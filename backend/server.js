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
import { setupApiRoutes } from "./routes/apiRoutes.js";
import { CodingPersonalityAnalyzer } from "./personalityAnalyzer.js";
import { applySM2 } from "./utils/sm2.js";
import { getSession, clearSessionCookie } from "./utils/sessionToken.js";

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
const MEMORY_FILE = path.join(DATA_DIR, "memory.json");

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
// the TRUSTED_PROXIES env let (comma-separated) at startup.
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
const LOGIN_RATE_LIMIT = 5; // max failed attempts before lockout
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15-minute sliding window
const loginFailures = new Map(); // identifier → [timestamp, ...]

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

  // Strong Password Validation
  if (rawPassword.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (rawPassword.length > 64) {
    return "Password must not exceed 64 characters.";
  }
  if (!/[a-z]/.test(rawPassword)) {
    return "Password must include at least one lowercase letter.";
  }
  if (!/[A-Z]/.test(rawPassword)) {
    return "Password must include at least one uppercase letter.";
  }
  if (!/\d/.test(rawPassword)) {
    return "Password must include at least one number.";
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};:'"|,.<>?/~`]/.test(rawPassword)) {
    return "Password must include at least one special character (!@#$%^&* etc.).";
  }

  // Common weak passwords check
  const commonPasswords = [
    "password123",
    "password1234",
    "password12345",
    "12345678",
    "123456789",
    "qwerty123",
    "qwertyuiop",
    "admin123",
    "letmein123",
    "welcome123",
    "monkey123",
    "1234567890",
    "abcdefgh",
    "abc12345",
    "password1",
    "passw0rd",
    "p@ssw0rd",
    "P@ssw0rd",
    "Password123",
    "Password123!",
    "Admin@123",
    "admin@123",
  ];
  if (commonPasswords.includes(rawPassword.toLowerCase())) {
    return "Password is too common or weak. Please choose a stronger password.";
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

  if (!useFirestore && !String(session.sub).startsWith("guest-")) {
    const users = await readUsers();

    const user = users.find((u) => u.id === session.sub);

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
      const routeResult = setupApiRoutes(req, res, pathname);
      if (routeResult !== null) {
        return routeResult;
      }
      return sendJson(res, 404, { error: "Not found." });
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

      server.listen(port, host, () => {
        const url = `http://${host}:${port}`;
        void 0;
        if (!process.env.SESSION_SECRET) {
          void 0;
        }
      });
    })
    .catch((error) => {
      console.error("Failed to load environment configuration:", error);
      process.exit(1);
    });
}
