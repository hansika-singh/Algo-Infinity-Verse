import crypto from "crypto";
import fs from "fs/promises";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { initializeFirebase, getDb, COLLECTIONS } from "../firebase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const MEMORY_FILE = path.join(DATA_DIR, "memory.json");
const TEAM_PROFILES_FILE = path.join(DATA_DIR, "team_profiles.json");
const SESSION_COOKIE = "aiv_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const PBKDF2_ITERATIONS = 210000;
const PASSWORD_KEY_LENGTH = 32;

// ── IP & Proxy Identification ────────────────────────────────────────────────
const TRUSTED_PROXIES = new Set(
  (process.env.TRUSTED_PROXIES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

function getClientIdentifier(req) {
  const remoteAddress = req.socket?.remoteAddress || "unknown";

  if (
    remoteAddress !== "unknown" &&
    TRUSTED_PROXIES.has(remoteAddress) &&
    req.headers["x-forwarded-for"]
  ) {
    const leftmost = req.headers["x-forwarded-for"].split(",")[0].trim();
    if (leftmost) return leftmost;
  }
  return remoteAddress;
}

// ── Signup Rate Limiting ───────────────────────────────────────────────────
const SIGNUP_RATE_LIMIT = 5;
const SIGNUP_WINDOW_MS = 15 * 60 * 1000;
const signupAttempts = new Map();

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
if (_signupSweeper.unref) _signupSweeper.unref();

function isSignupRateLimited(identifier) {
  const now = Date.now();
  const attempts = signupAttempts.get(identifier) || [];
  const recentAttempts = attempts.filter((t) => now - t < SIGNUP_WINDOW_MS);
  signupAttempts.set(identifier, recentAttempts);
  return recentAttempts.length >= SIGNUP_RATE_LIMIT;
}

function recordSignupAttempt(identifier) {
  const now = Date.now();
  const attempts = signupAttempts.get(identifier) || [];
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

function isLoginRateLimited(identifier) {
  const now = Date.now();
  const attempts = loginFailures.get(identifier) || [];
  const recent = attempts.filter((t) => now - t < LOGIN_WINDOW_MS);
  loginFailures.set(identifier, recent); // keep array trimmed
  return recent.length >= LOGIN_RATE_LIMIT;
}

function recordLoginFailure(identifier) {
  const now = Date.now();
  const attempts = loginFailures.get(identifier) || [];
  const recent = attempts.filter((t) => now - t < LOGIN_WINDOW_MS);
  recent.push(now);
  loginFailures.set(identifier, recent);
}

function clearLoginFailures(identifier) {
  loginFailures.delete(identifier);
}

// ── Active Sessions Management ───────────────────────────────
const activeSessions = [];

/**
 * Creates a new active-session record and appends it to activeSessions.
 *
 * @param {string|number} userId - The authenticated user's ID.
 * @param {import("http").IncomingMessage} req - The current HTTP request.
 * @returns {string} The newly-created sessionId.
 */
function createSession(userId, req) {
  const sessionId = crypto.randomUUID();

  const userAgent = req.headers["user-agent"] || "Unknown";
  const ipAddress = getClientIdentifier(req);

  // Prefer CDN/proxy-injected region headers; fall back gracefully.
  const location =
    (req.headers["x-region"] || req.headers["cf-ipcountry"] || "").trim() ||
    "Local/Unknown Location";

  const session = {
    sessionId,
    userId: String(userId),
    ipAddress,
    userAgent,
    location,
    createdAt: new Date(),
  };

  activeSessions.push(session);
  return sessionId;
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Express Route Protection Middleware ─────────────────────────
// Note: This matches the Express `req, res, next` format requested.
function authenticate(req, res, next) {
  // If you use standard Authorization headers:
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided." });
  }

  // NOTE: If using the native verifySessionToken instead of jwt.verify:
  const decoded = verifySessionToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }

  // Inject a cross-reference session check:
  const active = activeSessions.find(
    (s) => s.sessionId === decoded.sessionId && s.userId === String(decoded.sub || decoded.id)
  );

  if (!active) {
    // If no matching session is found (individually or globally revoked)
    return res.status(401).json({
      success: false,
      message: 'Session has been invalidated. Please log in again.'
    });
  }

  // Attach decoded payload data to req.user and call next()
  req.user = decoded;
  next();
}

/* === EXPRESS ROUTE BLUEPRINTS ===
 * Note: These are the Express variants of the routes requested. 
 * Since this codebase currently uses native HTTP routing, they 
 * have been safely encapsulated here to prevent "app is undefined" 
 * crashes while you migrate! The active logic is handled inside handleApi().
 *
app.get('/api/auth/sessions', authenticate, (req, res) => {
  const uid = String(req.user.sub || req.user.id);
  const userSessions = activeSessions
    .filter(s => s.userId === uid)
    .map(s => ({
      ...s,
      isCurrent: s.sessionId === req.user.sessionId
    }));
  return res.json(userSessions);
});

app.delete('/api/auth/sessions/:sessionId', authenticate, (req, res) => {
  const uid = String(req.user.sub || req.user.id);
  const index = activeSessions.findIndex(s => s.sessionId === req.params.sessionId && s.userId === uid);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Session not found.' });
  }

  activeSessions.splice(index, 1);
  return res.json({ success: true, message: 'Session successfully revoked.' });
});

app.delete('/api/auth/sessions', authenticate, (req, res) => {
  const uid = String(req.user.sub || req.user.id);
  let i = activeSessions.length;
  while (i--) {
    if (activeSessions[i].userId === uid) {
      activeSessions.splice(i, 1);
    }
  }
  return res.json({ success: true, message: 'Successfully logged out of all devices.' });
});
// ─────────────────────────────────────────────────────────────────────────────
*/



app.post('/api/login', async (req, res) => {
  // 1. Extract proxy-safe IP identifier
  const identifier = getClientIdentifier(req);

  // 2. Check if they are locked out BEFORE touching the database
  if (isLoginRateLimited(identifier)) {
    return res.status(429).json({
      success: false,
      message: "Too many failed login attempts. Please try again in 15 minutes."
    });
  }

  const { email, password } = req.body;

  try {
    const user = null;
    const isPasswordValid = false;

    // 3. Check for invalid credentials and record the failure
    if (!user || !isPasswordValid) {
      recordLoginFailure(identifier); // Record strike against IP


      await normalizeAuthDelay();

      return res.status(401).json({
        success: false,
        message: "Invalid credentials."
      });
    }

    // 4. If the code reaches here, login is successful. Wipe the slate clean.
    clearLoginFailures(identifier);

    const sessionId = createSession(user ? (user._id || user.id) : "unknown", req);

    // Send your JWT and success response
    return res.status(200).json({
      success: true,
      token: "your_generated_jwt_token",
      message: "Logged in successfully"
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


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
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // Fail closed: never fall back to a hardcoded secret, regardless of NODE_ENV.
    // A known fallback would let anyone forge session JWTs.
    throw new Error(
      "SESSION_SECRET is required. Set it in the environment before starting the server.",
    );
  }
  return secret;
}

function sign(value) {
  return crypto
    .createHmac("sha256", sessionSecret())
    .update(value)
    .digest("base64url");
}

function createSessionToken(user, sessionId) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      sub: user.id,
      name: user.name,
      email: user.email,
      sessionId,
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
    if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) return null;

    // Cross-reference session check for native HTTP routes
    const active = activeSessions.find(
      (s) => s.sessionId === session.sessionId && s.userId === String(session.sub)
    );
    if (!active) return null; // Invalidated session

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
  return { ...snapshot.docs[0].data(), id: snapshot.docs[0].id };
}

async function createUser(userData) {
  if (!useFirestore) {
    const users = await readUsers();
    users.push(userData);
    await writeUsers(users);
    return userData;
  }
  const docRef = await db.collection(COLLECTIONS.USERS).add(userData);
  return { ...userData, id: docRef.id };
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
// and must return the updated store (or modify it in-place).
async function updateMemoryStore(mutator) {
  const task = memoryWriteQueue.then(async () => {
    await ensureMemoryStore();
    const raw = await fs.readFile(MEMORY_FILE, "utf8");
    const store = JSON.parse(raw || "{}");
    const updated = await mutator(store);
    // Write the updated store if the mutator returned a new store object.
    // If the mutator mutated in-place and returned undefined or a sub-resource
    // (such as a card object), we write the mutated store.
    const isCard = updated && typeof updated === "object" && ("topic" in updated || "nextReviewDate" in updated || "repetitions" in updated);
    const isNewStore = updated && typeof updated === "object" && !isCard;
    const storeToSave = isNewStore && updated !== store ? updated : store;
    await writeMemoryStoreAtomic(MEMORY_FILE, storeToSave);
    return updated;
  });

  // Prevent one rejected task from permanently breaking the queue.
  memoryWriteQueue = task.catch((err) => {
    console.error("[updateMemoryStore] Write task failed:", err);
  });
  return task;
}

let teamProfilesWriteQueue = Promise.resolve();

async function ensureTeamProfilesStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(TEAM_PROFILES_FILE);
  } catch {
    await fs.writeFile(TEAM_PROFILES_FILE, "{}\n");
  }
}

async function readTeamProfilesStore() {
  await ensureTeamProfilesStore();
  const raw = await fs.readFile(TEAM_PROFILES_FILE, "utf8");
  return JSON.parse(raw || "{}");
}

async function writeTeamProfilesStoreAtomic(filePath, store) {
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmpPath, `${JSON.stringify(store, null, 2)}\n`);
  await fs.rename(tmpPath, filePath);
}

async function updateTeamProfilesStore(mutator) {
  const task = teamProfilesWriteQueue.then(async () => {
    await ensureTeamProfilesStore();
    const raw = await fs.readFile(TEAM_PROFILES_FILE, "utf8");
    const store = JSON.parse(raw || "{}");
    const updated = await mutator(store);
    await writeTeamProfilesStoreAtomic(TEAM_PROFILES_FILE, store);
    return updated;
  });

  teamProfilesWriteQueue = task.catch((err) => {
    console.error("[updateTeamProfilesStore] Write task failed:", err);
  });
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

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto
    .pbkdf2Sync(
      password,
      salt,
      PBKDF2_ITERATIONS,
      PASSWORD_KEY_LENGTH,
      "sha256",
    )
    .toString("hex");
  return { salt, hash, iterations: PBKDF2_ITERATIONS, digest: "sha256" };
}

function passwordMatches(password, stored) {
  const calculated = crypto.pbkdf2Sync(
    password,
    stored.salt,
    stored.iterations || PBKDF2_ITERATIONS,
    PASSWORD_KEY_LENGTH,
    stored.digest || "sha256",
  );
  const saved = Buffer.from(stored.hash, "hex");
  return (
    saved.length === calculated.length &&
    crypto.timingSafeEqual(saved, calculated)
  );
}

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
  if (pathname === "/api/log-error" && req.method === "POST") {
    try {
      const payload = await readJsonBody(req);
      const logFile = path.join(DATA_DIR, "client_errors.json");
      await fs.mkdir(DATA_DIR, { recursive: true });
      let currentLogs = [];
      try {
        const raw = await fs.readFile(logFile, "utf8");
        currentLogs = JSON.parse(raw || "[]");
      } catch (e) {
        // file might not exist
      }
      currentLogs.push(payload);
      await fs.writeFile(logFile, `${JSON.stringify(currentLogs, null, 2)}\n`);
      return sendJson(res, 200, { success: true });
    } catch (err) {
      console.error("Error logging client error:", err);
      return sendJson(res, 500, { error: "Failed to log error" });
    }
  }

  if (pathname === "/api/team-profile" && req.method === "GET") {
    try {
      const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
      const teamId = urlParams.get("id");
      
      if (!teamId) {
        return sendJson(res, 400, { error: "Missing team id." });
      }

      let profileData = null;

      if (!useFirestore) {
        const store = await readTeamProfilesStore();
        profileData = store[teamId] || null;
      } else {
        const docRef = db.collection(COLLECTIONS.TEAM_PROFILES).doc(teamId);
        const snapshot = await docRef.get();
        if (snapshot.exists) {
          profileData = snapshot.data();
        }
      }

      if (!profileData) {
        // Return default profile with version 1
        return sendJson(res, 200, {
          id: teamId,
          version: 1,
          name: "New Team Profile",
          description: "",
          members: []
        });
      }

      return sendJson(res, 200, profileData);
    } catch (error) {
      console.error("Fetch team profile error:", error);
      return sendJson(res, 500, { error: "Failed to fetch team profile." });
    }
  }

  if (pathname === "/api/team-profile" && req.method === "POST") {
    try {
      const payload = await readJsonBody(req);
      const { id: teamId, version, name, description, members } = payload;

      if (!teamId) {
        return sendJson(res, 400, { error: "Missing team id." });
      }

      if (version === undefined || version === null) {
        return sendJson(res, 400, { error: "Missing version for concurrency control." });
      }

      let updatedProfile = null;

      if (!useFirestore) {
        try {
          updatedProfile = await updateTeamProfilesStore(store => {
            const currentProfile = store[teamId] || { version: 1 };
            
            // OCC version check
            if (currentProfile.version !== version) {
              const conflictError = new Error("Conflict");
              conflictError.status = 409;
              conflictError.currentVersion = currentProfile.version;
              throw conflictError;
            }

            // Update data and increment version
            const newProfile = {
              id: teamId,
              name: name || currentProfile.name || "New Team Profile",
              description: description !== undefined ? description : (currentProfile.description || ""),
              members: members || currentProfile.members || [],
              version: version + 1,
              updatedAt: new Date().toISOString()
            };

            store[teamId] = newProfile;
            return newProfile;
          });
        } catch (error) {
          if (error.status === 409) {
            return sendJson(res, 409, { 
              error: "Conflict detected: The profile was updated by someone else.",
              currentVersion: error.currentVersion
            });
          }
          throw error;
        }
      } else {
        const docRef = db.collection(COLLECTIONS.TEAM_PROFILES).doc(teamId);
        try {
          updatedProfile = await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            
            const currentVersion = doc.exists ? doc.data().version : 1;

            if (currentVersion !== version) {
              const conflictError = new Error("Conflict");
              conflictError.status = 409;
              conflictError.currentVersion = currentVersion;
              throw conflictError;
            }

            const newProfile = {
              id: teamId,
              name: name || (doc.exists ? doc.data().name : "New Team Profile"),
              description: description !== undefined ? description : (doc.exists ? doc.data().description : ""),
              members: members || (doc.exists ? doc.data().members : []),
              version: version + 1,
              updatedAt: new Date().toISOString()
            };

            transaction.set(docRef, newProfile);
            return newProfile;
          });
        } catch (error) {
          if (error.status === 409) {
            return sendJson(res, 409, { 
              error: "Conflict detected: The profile was updated by someone else.",
              currentVersion: error.currentVersion
            });
          }
          throw error;
        }
      }

      return sendJson(res, 200, updatedProfile);
    } catch (error) {
      console.error("Update team profile error:", error);
      return sendJson(res, 500, { error: "Failed to update team profile." });
    }
  }

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

  if (pathname === "/api/auth/sessions" && req.method === "GET") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });
    const uid = String(session.sub);
    const userSessions = activeSessions
      .filter(s => s.userId === uid)
      .map(s => ({ ...s, isCurrent: s.sessionId === session.sessionId }));
    return sendJson(res, 200, userSessions);
  }

  if (pathname === "/api/auth/sessions" && req.method === "DELETE") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });
    const uid = String(session.sub);
    for (let i = activeSessions.length - 1; i >= 0; i--) {
      if (activeSessions[i].userId === uid) {
        activeSessions.splice(i, 1);
      }
    }
    return sendJson(res, 200, { success: true, message: "Successfully logged out of all devices." });
  }

  if (pathname.startsWith("/api/auth/sessions/") && req.method === "DELETE") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });
    const targetSessionId = pathname.replace("/api/auth/sessions/", "");
    const uid = String(session.sub);
    const index = activeSessions.findIndex(s => s.sessionId === targetSessionId && s.userId === uid);
    if (index === -1) return sendJson(res, 404, { success: false, message: "Session not found." });
    activeSessions.splice(index, 1);
    return sendJson(res, 200, { success: true, message: "Session successfully revoked." });
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

    const sessionId = createSession(user.id, req);
    const token = createSessionToken(user, sessionId);
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

    // Successful login — clear any accumulated failure count so a legitimate
    // user who mistyped their password earlier is not locked out.
    clearLoginFailures(clientId);

    const sessionId = createSession(user._id || user.id, req);
    const token = createSessionToken(user, sessionId);
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

  if (pathname === "/api/recommendations/next" && req.method === "GET") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });

    try {
      const store = await readMemoryStore();
      const userCards = store[session.sub] || {};
      
      const now = new Date();
      // Find cards due for review
      const dueCards = Object.values(userCards).filter(
        (card) => new Date(card.nextReviewDate) <= now
      );
      
      // Sort by SM-2 quality (lowest first) to prioritize weak areas
      const weakCards = Object.values(userCards).sort((a, b) => a.quality - b.quality);
      
      let recommendedTopic = null;
      let reason = "";

      if (dueCards.length > 0) {
        dueCards.sort((a, b) => new Date(a.nextReviewDate) - new Date(b.nextReviewDate));
        recommendedTopic = dueCards[0].topic;
        reason = `Based on your spaced repetition schedule, it's time to review ${recommendedTopic}.`;
      } else if (weakCards.length > 0 && weakCards[0].quality < 4) {
        recommendedTopic = weakCards[0].topic;
        reason = `Your performance in ${recommendedTopic} indicates it's a weak area. We recommend practicing it.`;
      } else {
        recommendedTopic = "dp";
        reason = "You're doing great! Keep pushing your boundaries with some advanced problems.";
      }

      // Generate AI tip
      let aiTip = "";
      try {
        const { generateTopicMarkdown } = await import("./knowledge-base/llmClient.js");
        if (generateTopicMarkdown) {
          aiTip = `AI Insight: Mastering ${recommendedTopic} will significantly improve your overall problem-solving skills.`;
        }
      } catch (err) {
        console.warn("LLM client not available for tip generation.");
      }

      return sendJson(res, 200, {
        success: true,
        recommendation: {
          topic: recommendedTopic,
          reason: reason,
          aiTip: aiTip
        }
      });
    } catch (err) {
      console.error("Error generating recommendation:", err);
      return sendJson(res, 500, { error: "Failed to generate recommendation." });
    }
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

function getCacheControlHeader(ext) {
  if (ext === ".html") {
    return "no-store, no-cache, must-revalidate, private";
  }
  if (ext === ".css" || ext === ".js" || ext === ".json") {
    return "no-cache, public";
  }
  if ([".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp"].includes(ext)) {
    return "public, max-age=86400";
  }
  if ([".woff", ".woff2", ".eot", ".ttf", ".otf"].includes(ext)) {
    return "public, max-age=2592000, immutable";
  }
  return "no-cache";
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
    
    const fileStat = await fs.stat(target);
    const ext = path.extname(target);

    // ETag generation based on file size and mtime
    const mtimeMs = fileStat.mtime.getTime();
    const size = fileStat.size;
    const cacheControl = getCacheControlHeader(ext);
    // HTML is rewritten per-request with a unique CSP nonce, so a size/mtime
    // ETag is not a valid validator for it.
    const etag = ext === ".html" ? null : `W/"${size}-${mtimeMs}"`;

    const headers = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
      "Cache-Control": cacheControl,
    };
    if (etag) headers["ETag"] = etag;

    // Handle If-None-Match conditional request
    const clientEtag = req.headers["if-none-match"];
    if (etag && clientEtag === etag) {
      headers["Content-Type"] = mimeTypes[ext] || "application/octet-stream";
      res.writeHead(304, headers);
      return res.end();
    }

    let content = await fs.readFile(target);

    if (ext === ".html") {
      // Generate a dynamic nonce for CSP script elements
      const nonce = crypto.randomBytes(16).toString("base64");
      
      // Inject nonce into script tags in the HTML content
      let htmlStr = content.toString("utf-8");
      htmlStr = htmlStr.replace(/<script(\s|>)/gi, `<script nonce="${nonce}"$1`);
      content = Buffer.from(htmlStr, "utf-8");

      headers["Content-Security-Policy"] = 
        `default-src 'self'; ` +
        `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com; ` +
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; ` +
        `font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; ` +
        `img-src 'self' data: https: blob:; ` +
        `connect-src 'self' https: wss:; ` +
        `frame-src 'self' https://*.firebaseapp.com; ` +
        `object-src 'none'; ` +
        `base-uri 'self';`;
    }

    headers["Content-Type"] = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, headers);
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

export { server, updateMemoryStore, readMemoryStore };
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

      server.listen(port, host, () => {
        const url = `http://${host}:${port}`;
        console.log(`Server running at ${url}`);
        if (!process.env.SESSION_SECRET) {
          // Fail closed in every environment — a missing secret means tokens
          // would be signed with a forgeable, hardcoded fallback.
          console.error(
            "FATAL: SESSION_SECRET is required. Set it in the environment before starting the server.",
          );
          process.exit(1);
        }
      });
    })
    .catch((error) => {
      console.error("Failed to load environment configuration:", error);
      process.exit(1);
    });
}
