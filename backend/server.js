import crypto from "crypto";
import fs from "fs/promises";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { initializeFirebase, getDb, COLLECTIONS } from "../firebase.js";
import multer from "multer";
import { extractResumeText } from "./resume-analyzer/parser.js";
import { calculateATS } from "./resume-analyzer/atsScore.js";
import { findMissingSkills } from "./resume-analyzer/skills.js";
import { getSuggestions } from "./resume-analyzer/suggestions.js";

const MAX_RESUME_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_FILE_SIZE_BYTES, files: 1 },
}).single("resume");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const CodingPersonalityAnalyzer = require('./personalityAnalyzer.js');
const MEMORY_FILE = path.join(DATA_DIR, "memory.json");
const SESSION_COOKIE = "aiv_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

// ── Rate limiting ────────────────────────────────────────────────────────────
const SIGNUP_RATE_LIMIT = 5;
const SIGNUP_WINDOW_MS = 15 * 60 * 1000;
const signupAttempts = new Map();

// Periodic sweeper — runs every SIGNUP_WINDOW_MS and deletes any identifier
// whose timestamps have all aged out of the window.  This bounds the Map to
// only identifiers that have been active within the last window period and
// prevents unbounded memory growth under a sustained stream of unique IPs.
const _signupSweeper = setInterval(() => {
  const now = Date.now();
  for (const [identifier, timestamps] of signupAttempts) {
    const fresh = timestamps.filter((t) => now - t < SIGNUP_WINDOW_MS);
    if (fresh.length === 0) {
      signupAttempts.delete(identifier);
    } else {
      signupAttempts.set(identifier, fresh);
    }
  }
}, SIGNUP_WINDOW_MS);

// Allow the process to exit cleanly even while the interval is live
// (relevant in test environments and graceful-shutdown scenarios).
if (_signupSweeper.unref) _signupSweeper.unref();

// IPs of reverse-proxies / load-balancers that are allowed to set
// X-Forwarded-For.  Add your proxy CIDRs / IPs here or populate via
// the TRUSTED_PROXIES env var (comma-separated) at startup.
const TRUSTED_PROXIES = new Set(
  (process.env.TRUSTED_PROXIES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

function getClientIdentifier(req) {
  const remoteAddress = req.socket?.remoteAddress || "unknown";

  // Only honour X-Forwarded-For when the immediate TCP caller is a
  // known trusted proxy — otherwise an attacker can supply any value
  // they like and trivially bypass rate limiting.
  if (
    remoteAddress !== "unknown" &&
    TRUSTED_PROXIES.has(remoteAddress) &&
    req.headers["x-forwarded-for"]
  ) {
    // The left-most entry is the original client IP added by the
    // first proxy in the chain; everything to the right can be spoofed.
    const leftmost = req.headers["x-forwarded-for"].split(",")[0].trim();
    if (leftmost) return leftmost;
  }

  return remoteAddress;
}

function isSignupRateLimited(identifier) {
  const now = Date.now();
  const attempts = signupAttempts.get(identifier) || [];
  // Trim stale timestamps on every read so the per-identifier array stays
  // small even between sweeper runs.
  const recentAttempts = attempts.filter((t) => now - t < SIGNUP_WINDOW_MS);
  signupAttempts.set(identifier, recentAttempts);
  return recentAttempts.length >= SIGNUP_RATE_LIMIT;
}

function recordSignupAttempt(identifier) {
  const now = Date.now();
  const attempts = signupAttempts.get(identifier) || [];
  // Trim before appending so the array never accumulates beyond
  // SIGNUP_RATE_LIMIT + 1 entries between sweeper passes.
  const recentAttempts = attempts.filter((t) => now - t < SIGNUP_WINDOW_MS);
  recentAttempts.push(now);
  signupAttempts.set(identifier, recentAttempts);
}

async function normalizeAuthDelay() {
  return new Promise((resolve) => setTimeout(resolve, 500));
}
// ── Login Rate Limiting (failed attempts only) ──────────────────────────────
const LOGIN_RATE_LIMIT = 5;          // max failed attempts before lockout
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15-minute sliding window
const loginFailures = new Map();     // identifier → [timestamp, ...]

// Periodic sweeper — mirrors the signup sweeper to prevent unbounded growth.
const _loginSweeper = setInterval(() => {
  const now = Date.now();
  for (const [identifier, timestamps] of loginFailures) {
    const fresh = timestamps.filter((t) => now - t < LOGIN_WINDOW_MS);
    if (fresh.length === 0) {
      loginFailures.delete(identifier);
    } else {
      loginFailures.set(identifier, fresh);
    }
  }
}, LOGIN_WINDOW_MS);
if (_loginSweeper.unref) _loginSweeper.unref();

/**
 * Returns true when the given identifier has reached the failed-login limit
 * within the current sliding window.
 */
function isLoginRateLimited(identifier) {
  const now = Date.now();
  const attempts = loginFailures.get(identifier) || [];
  const recent = attempts.filter((t) => now - t < LOGIN_WINDOW_MS);
  loginFailures.set(identifier, recent); // keep array trimmed
  return recent.length >= LOGIN_RATE_LIMIT;
}

/**
 * Records a single failed login attempt for the given identifier.
 * Only call this after confirming the credentials were wrong.
 */
function recordLoginFailure(identifier) {
  const now = Date.now();
  const attempts = loginFailures.get(identifier) || [];
  const recent = attempts.filter((t) => now - t < LOGIN_WINDOW_MS);
  recent.push(now);
  loginFailures.set(identifier, recent);
}

/**
 * Clears the failure counter for the given identifier on successful login
 * so a legitimate user is never locked out after a prior mistake.
 */
function clearLoginFailures(identifier) {
  loginFailures.delete(identifier);
}
// ────────────────────────────────────────────────────────────────────────────

const protectedPaths = new Set([
  "/community",
  "/community.html",
  "/support-page",
  "/support-page/",
  "/support-page/index.html",
]);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".php": "text/html; charset=utf-8",
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

async function loadEnvFile() {
  const envPath = path.join(ROOT, ".env");
  try {
    const raw = await fs.readFile(envPath, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) return;

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production.");
  }
  return "dev-only-change-me-with-SESSION_SECRET-before-deploying";
}

function sign(value) {
  return crypto
    .createHmac("sha256", sessionSecret())
    .update(value)
    .digest("base64url");
}

function createSessionToken(user) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      sub: user.id,
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    }),
  );
  const body = `${header}.${payload}`;
  return `${body}.${sign(body)}`;
}

function verifySessionToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const body = `${header}.${payload}`;
  const expected = sign(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(fromBase64Url(payload));
    if (!session.exp || session.exp < Math.floor(Date.now() / 1000))
      return null;
    return session;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, part) => {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName) return cookies;
    cookies[rawName] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
}

function sessionCookie(token, req) {
  const secure = req.headers["x-forwarded-proto"] === "https";
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

let db = null;
let useFirestore = false;

async function getUserByEmail(email) {
  if (!useFirestore) {
    const users = await readUsers();
    return users.find((u) => u.email === email) || null;
  }
  const snapshot = await db
    .collection(COLLECTIONS.USERS)
    .where("email", "==", email)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

async function createUser(userData) {
  if (!useFirestore) {
    const users = await readUsers();
    users.push(userData);
    await writeUsers(users);
    return userData;
  }
  const docRef = await db.collection(COLLECTIONS.USERS).add(userData);
  return { id: docRef.id, ...userData };
}

async function ensureUserStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, "[]\n");
  }
}

async function readUsers() {
  await ensureUserStore();
  const raw = await fs.readFile(USERS_FILE, "utf8");
  return JSON.parse(raw || "[]");
}

async function writeUsers(users) {
  await ensureUserStore();
  await fs.writeFile(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`);
}

// ── Memory Scanner (Spaced Repetition, SM-2) ─────────────────────────────────
// NOTE: This currently uses local JSON file storage, matching the existing
// users.json/feedback.json pattern in this codebase. In multi-instance or
// serverless (VERCEL=1 / Firestore) deployments this is not a shared source
// of truth. Migrating to Firestore (mirroring getUserByEmail/createUser's
// useFirestore branching) is tracked as a follow-up.
let memoryWriteQueue = Promise.resolve();

async function ensureMemoryStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(MEMORY_FILE);
  } catch {
    await fs.writeFile(MEMORY_FILE, "{}\n");
  }
}

async function readMemoryStore() {
  await ensureMemoryStore();
  const raw = await fs.readFile(MEMORY_FILE, "utf8");
  return JSON.parse(raw || "{}");
}

async function writeMemoryStoreAtomic(filePath, store) {
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmpPath, `${JSON.stringify(store, null, 2)}\n`);
  await fs.rename(tmpPath, filePath);
}

// Serializes read-modify-write cycles so concurrent /api/memory/* requests
// cannot clobber each other's updates. `mutator` receives the current store
// and must return the updated store.
async function updateMemoryStore(mutator) {
  const task = memoryWriteQueue.then(async () => {
    await ensureMemoryStore();
    const raw = await fs.readFile(MEMORY_FILE, "utf8");
    const store = JSON.parse(raw || "{}");
    const updated = await mutator(store);
    await writeMemoryStoreAtomic(MEMORY_FILE, store);
    return updated;
  });

  // Prevent one rejected task from permanently breaking the queue.
  memoryWriteQueue = task.catch(() => {});
  return task;
}
// SM-2 algorithm: quality is 0-5 (0 = total blackout, 5 = perfect recall)
function applySM2(card, quality) {
  const q = Math.max(0, Math.min(5, Number(quality)));
  let { repetitions = 0, easeFactor = 2.5, interval = 0 } = card || {};

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);
  }

  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const now = new Date();
  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(now.getDate() + interval);

  return {
    topic: card?.topic,
    repetitions,
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval,
    lastReviewed: now.toISOString(),
    nextReviewDate: nextReviewDate.toISOString(),
    lastQuality: q,
  };
}
// ──────────────────────────────────────────────────────────────────────────

function validateSignup({ name, email, password, confirmPassword }) {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "")
    .trim()
    .toLowerCase();
  const rawPassword = String(password || "");
  const rawConfirm = String(confirmPassword || "");

  if (cleanName.length < 2) return "Name must be at least 2 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return "Enter a valid email address.";
  }
  if (rawPassword.length < 8) return "Password must be at least 8 characters.";
  if (
    !/[a-z]/.test(rawPassword) ||
    !/[A-Z]/.test(rawPassword) ||
    !/\d/.test(rawPassword)
  ) {
    return "Password must include uppercase, lowercase, and a number.";
  }
  if (rawPassword !== rawConfirm) return "Passwords do not match.";
  return null;
}

async function readJsonBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1024 * 1024)
      throw new Error("Request body is too large.");
  }
  return body ? JSON.parse(body) : {};
}

function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function redirect(res, location, headers = {}) {
  res.writeHead(302, { Location: location, ...headers });
  res.end();
}

function getSession(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return verifySessionToken(cookies[SESSION_COOKIE]);
}

function normalizePathname(pathname) {
  if (!pathname) return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function isProtectedRoute(pathname) {
  return protectedPaths.has(pathname);
}

async function authorizeRequest(req, pathname) {
  if (!isProtectedRoute(pathname)) {
    return { authorized: true };
  }

  const session = getSession(req);

  if (!session) {
    return {
      authorized: false,
      redirectTo: `/login?next=${encodeURIComponent(pathname)}`,
    };
  }

  if (!useFirestore) {
    const users = await readUsers();

    const user = users.find(
      (u) => u.id === session.sub
    );

    if (!user || user.isDeactivated) {
      return {
        authorized: false,
        redirectTo: "/login",
      };
    }
  }

  return {
    authorized: true,
    session,
  };
}

function validateRequest(req) {
  const allowedMethods = ["GET", "POST"];

  if (!allowedMethods.includes(req.method)) {
    return {
      valid: false,
      status: 405,
      message: "Method not allowed.",
    };
  }

  return { valid: true };
}

async function handleApi(req, res, pathname) {
  if (pathname === "/api/analyze-resume" && req.method === "POST") {
    try {
      await new Promise((resolve, reject) => {
        upload(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      if (!req.file) {
        return sendJson(res, 400, { error: "No resume file uploaded." });
      }

      const text = await extractResumeText(req.file);
      const atsScore = calculateATS(text);
      const missingSkills = findMissingSkills(text);
      const suggestions = getSuggestions(atsScore);

      return sendJson(res, 200, {
        atsScore,
        missingSkills,
        suggestions,
      });
    } catch (error) {
      console.error("Resume analysis error:", error);
      return sendJson(res, 500, { error: error.message || "Failed to analyze resume." });
    }
  }

  if (pathname === "/api/session" && req.method === "GET") {
    const session = getSession(req);

    if (session) {
      const users = await readUsers();

      const user = users.find((u) => u.id === session.sub);

      if (user?.isDeactivated) {
        return sendJson(res, 200, {
          authenticated: false,
          user: null,
        });
      }
    }
    return sendJson(res, 200, {
      authenticated: Boolean(session),
      user: session,
    });
  }

  if (pathname === "/api/signup" && req.method === "POST") {
    // ── Rate limit check ─────────────────────────────────────────────────────
    const clientId = getClientIdentifier(req);

    if (isSignupRateLimited(clientId)) {
      await normalizeAuthDelay();
      return sendJson(res, 429, {
        error: "Too many signup attempts. Please try again later.",
      });
    }

    // Record the attempt before processing so every inbound request counts,
    // including those that fail validation or find a duplicate email.
    recordSignupAttempt(clientId);
    // ─────────────────────────────────────────────────────────────────────────

    const payload = await readJsonBody(req);
    const validationError = validateSignup(payload);
    if (validationError) return sendJson(res, 400, { error: validationError });

    const email = String(payload.email).trim().toLowerCase();
    const existing = useFirestore
      ? await getUserByEmail(email)
      : (await readUsers()).find((user) => user.email === email);
    if (existing) {
      // Normalize response time so a duplicate is indistinguishable from a
      // real signup by timing — a real signup always runs PBKDF2 before
      // responding, so we must delay here to match that latency profile.
      await normalizeAuthDelay();
      console.warn("[signup] duplicate email attempt", {
        email,
        ip: clientId,
        at: new Date().toISOString(),
      });
      // Return a generic 200 that is indistinguishable from a real signup
      // success so callers cannot enumerate registered email addresses.
      // No session cookie is issued — the submitter has not authenticated.
      return sendJson(res, 200, { ok: true });
    }

    const user = {
      id: crypto.randomUUID(),
      name: String(payload.name).trim(),
      email,
      password: hashPassword(String(payload.password)),
      createdAt: new Date().toISOString(),
      isDeactivated: false,
      deactivatedAt: null,
    };
    await createUser(user);

    const token = createSessionToken(user);
    return sendJson(
      res,
      201,
      { user: { id: user.id, name: user.name, email: user.email } },
      { "Set-Cookie": sessionCookie(token, req) },
    );
  }

  if (pathname === "/api/login" && req.method === "POST") {
    // ── Rate-limit check (failed attempts only) ───────────────────────────────
    const clientId = getClientIdentifier(req);

    if (isLoginRateLimited(clientId)) {
      console.warn("[login] rate limited", {
        ip: clientId,
        at: new Date().toISOString(),
      });
      await normalizeAuthDelay();
      return sendJson(
        res,
        429,
        {
          error:
            "Too many failed login attempts. " +
            "Please wait 15 minutes before trying again.",
          retryAfterSeconds: Math.ceil(LOGIN_WINDOW_MS / 1000),
        },
        // Inform standards-compliant clients how long to back off.
        { "Retry-After": String(Math.ceil(LOGIN_WINDOW_MS / 1000)) },
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    const payload = await readJsonBody(req);
    const email = String(payload.email || "")
      .trim()
      .toLowerCase();
    const password = String(payload.password || "");
    const user = useFirestore
      ? await getUserByEmail(email)
      : (await readUsers()).find((candidate) => candidate.email === email);

    if (!user || !passwordMatches(password, user.password)) {
      // Record the failure ONLY when credentials are wrong, not for every request.
      recordLoginFailure(clientId);
      await normalizeAuthDelay();
      return sendJson(res, 401, { error: "Invalid email or password." });
    }
    if (user.isDeactivated) {
      user.isDeactivated = false;
      user.deactivatedAt = null;
    }
    if (!useFirestore) {
      const users = await readUsers();

      const index = users.findIndex((u) => u.id === user.id);

      if (index !== -1) {
        users[index] = user;
        await writeUsers(users);
      }
    }

    // Successful login — clear any accumulated failure count so a legitimate
    // user who mistyped their password earlier is not locked out.
    clearLoginFailures(clientId);

    const token = createSessionToken(user);
    return sendJson(
      res,
      200,
      { user: { id: user.id, name: user.name, email: user.email } },
      { "Set-Cookie": sessionCookie(token, req) },
    );
  }

  if (pathname === "/api/deactivate-account" && req.method === "POST") {
    const session = getSession(req);

    if (!session) {
      return sendJson(res, 401, {
        error: "Login required.",
      });
    }

    const users = await readUsers();

    const user = users.find((u) => u.id === session.sub);

    if (!user) {
      return sendJson(res, 404, {
        error: "User not found.",
      });
    }

    user.isDeactivated = true;
    user.deactivatedAt = new Date().toISOString();

    await writeUsers(users);

    return sendJson(
      res,
      200,
      {
        success: true,
      },
      {
        "Set-Cookie": clearSessionCookie(),
      },
    );
  }

  if (pathname === "/api/logout" && req.method === "POST") {
    return sendJson(
      res,
      200,
      { ok: true },
      { "Set-Cookie": clearSessionCookie() },
    );
  }

  if (pathname === "/api/feedback" && req.method === "POST") {
    const session = getSession(req);
    let payload;
    try {
      payload = await readJsonBody(req);
    } catch (err) {
      return sendJson(res, 400, { error: "Invalid JSON body." });
    }

    const { feedbackType, subject, message } = payload;
    if (!feedbackType || !subject || !message) {
      return sendJson(res, 400, {
        error: "Feedback type, subject, and message are required.",
      });
    }

    const allowedTypes = [
      "Suggestion",
      "Bug Report",
      "Feature Request",
      "General Feedback",
    ];
    if (!allowedTypes.includes(feedbackType)) {
      return sendJson(res, 400, { error: "Invalid feedback type." });
    }

    if (subject.trim().length < 3) {
      return sendJson(res, 400, {
        error: "Subject must be at least 3 characters long.",
      });
    }

    if (message.trim().length < 10) {
      return sendJson(res, 400, {
        error: "Message must be at least 10 characters long.",
      });
    }

    const feedbackData = {
      userId: session ? session.sub : null,
      userName: session ? session.name : null,
      userEmail: session ? session.email : null,
      feedbackType,
      subject: subject.trim(),
      message: message.trim(),
      status: "new",
      createdAt: new Date().toISOString(),
    };

    try {
      if (useFirestore) {
        const docRef = await db.collection("feedback").add(feedbackData);
        feedbackData.id = docRef.id;
      } else {
        const feedbackFile = path.join(DATA_DIR, "feedback.json");
        await fs.mkdir(DATA_DIR, { recursive: true });
        let feedbackList = [];
        try {
          const raw = await fs.readFile(feedbackFile, "utf8");
          feedbackList = JSON.parse(raw || "[]");
        } catch (err) {
          if (err.code !== "ENOENT") throw err;
        }
        feedbackData.id = crypto.randomUUID();
        feedbackList.push(feedbackData);
        await fs.writeFile(
          feedbackFile,
          JSON.stringify(feedbackList, null, 2) + "\n",
        );
      }

      return sendJson(res, 201, { success: true, feedback: feedbackData });
    } catch (err) {
      console.error("Error saving feedback:", err);
      return sendJson(res, 500, { error: "Failed to save feedback." });
    }
  }

  if (pathname === "/api/interview-experiences" && req.method === "POST") {
    const session = getSession(req);
    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON body." });
    }

    const {
      company,
      role,
      difficulty,
      rating,
      title,
      content,
      topics,
      rounds,
      offerStatus,
    } = payload;
    if (!company || !role || !difficulty || !rating || !title || !content) {
      return sendJson(res, 400, {
        error:
          "Company, role, difficulty, rating, title, and content are required.",
      });
    }

    const experienceData = {
      id: crypto.randomUUID(),
      userId: session ? session.sub : null,
      userName: session ? session.name : null,
      company: company.trim(),
      role: role.trim(),
      difficulty,
      rating,
      title: title.trim(),
      content: content.trim(),
      topics: Array.isArray(topics) ? topics : [],
      rounds: rounds || null,
      offerStatus: offerStatus || null,
      upvotes: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      if (useFirestore) {
        const docRef = await db
          .collection("interviewExperiences")
          .add(experienceData);
        experienceData.id = docRef.id;
      } else {
        const filePath = path.join(DATA_DIR, "interview-experiences.json");
        await fs.mkdir(DATA_DIR, { recursive: true });
        let list = [];
        try {
          const raw = await fs.readFile(filePath, "utf8");
          list = JSON.parse(raw || "[]");
        } catch (err) {
          if (err.code !== "ENOENT") throw err;
        }
        list.push(experienceData);
        await fs.writeFile(filePath, JSON.stringify(list, null, 2) + "\n");
      }
      return sendJson(res, 201, { success: true, experience: experienceData });
    } catch (err) {
      console.error("Error saving interview experience:", err);
      return sendJson(res, 500, {
        error: "Failed to save interview experience.",
      });
    }
  }

  if (pathname === "/api/memory/log" && req.method === "POST") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });

    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON body." });
    }

    const { topic, quality } = payload;
    if (!topic || typeof topic !== "string" || topic.trim().length < 1) {
      return sendJson(res, 400, { error: "Topic is required." });
    }
    if (
      quality === undefined ||
      isNaN(Number(quality)) ||
      Number(quality) < 0 ||
      Number(quality) > 5
    ) {
      return sendJson(res, 400, {
        error: "Quality must be a number between 0 and 5.",
      });
    }

    const trimmedTopic = topic.trim();
    const updatedCard = await updateMemoryStore((store) => {
      const userCards = store[session.sub] || {};
      const existing = userCards[trimmedTopic] || { topic: trimmedTopic };
      const updated = applySM2(existing, quality);
      userCards[trimmedTopic] = updated;
      store[session.sub] = userCards;
      return updated;
    });

    return sendJson(res, 200, { success: true, card: updatedCard });
  }

  if (pathname === "/api/memory/due" && req.method === "GET") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });

    const store = await readMemoryStore();
    const userCards = store[session.sub] || {};
    const now = new Date();
    const due = Object.values(userCards).filter(
      (card) => new Date(card.nextReviewDate) <= now,
    );

    return sendJson(res, 200, { success: true, due });
  }

  if (pathname === "/api/memory/all" && req.method === "GET") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });

    const store = await readMemoryStore();
    const userCards = store[session.sub] || {};

    return sendJson(res, 200, {
      success: true,
      cards: Object.values(userCards),
    });
  }

  return sendJson(res, 404, { error: "Not found." });
}

function resolveStaticPath(pathname) {
  const routes = {
    "/": "index.html",
    "/login": "login.html",
    "/signup": "signup.html",
    "/community": "community.html",
    "/python-learning": "python-learning.html",
    "/javascript-learning": "javascript-learning.html",
    "/dbms-learning": "dbms-learning.html",
    "/powerbi-learning": "powerbi-learning.html",
    "/cplusplus-learning": "cplusplus-learning.html",
    "/learning/php": "php-learning.html",
    "/php-learning": "php-learning.html",
    "/learning/oop": "oop-learning.html",
    "/oop-learning": "oop-learning.html",
    "/feedback": "feedback.html",
    "/feedback.html": "feedback.html",
    "/memory-scanner": "memory-scanner.html",
    "/memory-scanner.html": "memory-scanner.html",
    "/algorithm-timeline": "algorithm-timeline.html",
    "/support-page": "support-page/index.html",
    "/support-page/": "support-page/index.html",
  };
  let mapped = routes[pathname];
  if (!mapped) {
    const basePath = pathname.slice(1);
    mapped = path.extname(basePath) ? basePath : basePath + ".html";
  }
  const filePath = path.resolve(ROOT, mapped);
  const rel = path.relative(ROOT, filePath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;

  // ── Arbitrary File Disclosure Prevention ──────────────────────────────────
  const fileName = path.basename(filePath);

  // 1. Block hidden files and sensitive directories
  if (
    fileName.startsWith(".") ||
    rel.startsWith("data" + path.sep) ||
    rel.startsWith("api" + path.sep) ||
    rel.startsWith("node_modules" + path.sep)
  ) {
    return null;
  }

  // 2. Block specific sensitive root files
  const sensitiveFiles = [
    "server.js",
    "firebase.js",
    "package.json",
    "package-lock.json",
    "vercel.json",
  ];
  if (sensitiveFiles.includes(fileName)) {
    return null;
  }

  // 3. Extension whitelist (only serve files with known mime types)
  const ext = path.extname(filePath);
  if (!mimeTypes[ext]) {
    return null;
  }
  // ──────────────────────────────────────────────────────────────────────────

  return filePath;
}

async function serveStatic(req, res, pathname) {
  const filePath = resolveStaticPath(pathname);
  if (!filePath) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  try {
    const stat = await fs.stat(filePath);
    const target = stat.isDirectory()
      ? path.join(filePath, "index.html")
      : filePath;
    const ext = path.extname(target);
    const content = await fs.readFile(target);
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = normalizePathname(decodeURIComponent(url.pathname));

    const requestValidation = validateRequest(req);

    if (!requestValidation.valid) {
      return sendJson(res, requestValidation.status, {
        error: requestValidation.message,
      });
    }

    if (pathname.startsWith("/api/")) {
      return await handleApi(req, res, pathname);
    }

    if (pathname === "/logout") {
      return redirect(res, "/login", { "Set-Cookie": clearSessionCookie() });
    }

    const authorization = await authorizeRequest(req, pathname);

    if (!authorization.authorized) {
      return redirect(res, authorization.redirectTo);
    }

    return await serveStatic(req, res, pathname);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Something went wrong." });
  }
});

export { server };
if (process.env.VERCEL === "1") {
  db = initializeFirebase();
  useFirestore = !!db;
}

if (process.env.VERCEL !== "1") {
  loadEnvFile()
    .then(() => {
      db = initializeFirebase();
      useFirestore = !!db;
      const port = Number(process.env.PORT || 3000);
      const host = process.env.HOST || "127.0.0.1";
       
      // ===== CODING PERSONALITY =====
     app.get('/api/user/personality', (req, res) => {
     try {
     const userId = req.user?.id || req.query.userId;
    
      if (!userId) {
       return res.status(401).json({ error: 'User not authenticated' });
      }
    
     // Get user data - replace with actual DB fetch
     const userData = {
      problems: [], 
      submissions: [], 
      topics: [], 
      streak: 0 
    };
    
     const analyzer = new CodingPersonalityAnalyzer(userData);
     const personality = analyzer.analyze();
    
      res.json({
       success: true,
       data: personality
      });
    } catch (error) {
     console.error('Personality analysis error:', error);
     res.status(500).json({ error: 'Failed to analyze personality' });
   }
  });

      server.listen(port, host, () => {
        const url = `http://${host}:${port}`;
        console.log(`Server running at ${url}`);
        if (!process.env.SESSION_SECRET) {
          console.warn(
            "Using a development SESSION_SECRET. Set SESSION_SECRET before deploying.",
          );
        }
      });
    })
    .catch((error) => {
      console.error("Failed to load environment configuration:", error);
      process.exit(1);
    });
}
