import crypto from "crypto";
import fs from "fs/promises";
import http from "http";
import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { FieldValue } from "firebase-admin/firestore";
import { initializeFirebase, getDb, COLLECTIONS } from "./firebase.js";
import { verifyCsrfToken } from "./utils/csrf-verify.js";
import multer from "multer";
import { extractResumeText } from "./backend/resume-analyzer/parser.js";
import { calculateATS } from "./backend/resume-analyzer/atsScore.js";
import { findMissingSkills } from "./backend/resume-analyzer/skills.js";
import { getSuggestions } from "./backend/resume-analyzer/suggestions.js";
import { analyzeWorkflow } from "./backend/repository-analyzer/cicdValidator.js";
import { VCSFactory } from "./backend/vcs/VCSFactory.js";
import { enqueueBulkAudit, getBatchProgress, MAX_BULK_AUDIT_URLS } from "./backend/jobs/queue.js";
import "./backend/jobs/worker.js"; // Initialize worker

import { parse as csvParse } from "csv-parse/sync";
import { v4 as uuidv4 } from "uuid";
import { generateSdlcAdvice } from "./sdlcAdvisor.js";

const JUDGE0_LANGUAGE_IDS = {
  python:      71,
  javascript:  63,
  java:        62,
  'c++':       54,
  cpp:         54,
  c:           50,
  typescript:  74,
  go:          60,
  rust:        73,
  ruby:        72,
  swift:       83,
  dart:        98,
  haskell:     89,
  kotlin:      78,
};
import { handleReportRequest } from "./backend/reports/reportGenerator.js";
import { getUserBenchmark } from "./backend/benchmarking/percentileService.js";
import { Server as SocketIOServer } from "socket.io";
import {
  ACCESS_TOKEN_MAX_AGE_SECONDS, REFRESH_TOKEN_MAX_AGE_SECONDS, getClientIdentifier, isSignupRateLimited,
  recordSignupAttempt, normalizeAuthDelay, createAccessToken,
  verifyAccessToken, hashPassword, passwordMatches, validateSignup,
  createRefreshToken, verifyRefreshToken, revokeTokenFamily,
  activeRefreshFamilies
} from "./backend/services/auth.service.js";
import {
  applyRateLimit,
  loginLimiter,
  signupLimiter,
  forgotPasswordLimiter,
  changePasswordLimiter,
  deleteAccountLimiter,
  resendVerificationLimiter,
  resumeAnalysisLimiter,
  repoAnalysisLimiter,
  sdlcAdvisorLimiter,
  predictionLimiter,
  bulkAuditLimiter,
  logErrorLimiter
} from "./backend/utils/rateLimiter.js";
import { applySM2 } from "./backend/services/memory.service.js";
import { sendVerificationEmail } from "./backend/services/email.service.js";
import {
  createBattle,
  joinBattle,
  submitSolution,
  getBattle,
  getHistory,
} from "./pages/Dsa-Battle/Battleservice.js";

import { instrumentJS } from "./modules/code-tracer.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single("resume");
const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
}).single("csv");

function validateMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 4) return false;
  const hex = buffer.slice(0, 4).toString("hex").toUpperCase();
  
  if (mimeType === "application/pdf") {
    return hex === "25504446";
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return hex === "504B0304";
  }
  if (mimeType === "application/msword") {
    return hex === "D0CF11E0";
  }
  return false;
}
const userSocketMap = new Map();
const studyRooms = new Map();
const memoryUserStore = new Map();
let userCacheTimestamp = 0;
let userCacheDirty = true;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;
const IS_VERCEL = process.env.VERCEL === "1";
const DATA_DIR = IS_VERCEL
  ? path.join("/tmp", "algo-infinity-verse")
  : path.join(ROOT, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const MEMORY_FILE = path.join(DATA_DIR, "memory.json");
const TEAM_PROFILES_FILE = path.join(DATA_DIR, "team_profiles.json");
const AUDITS_FILE = path.join(DATA_DIR, "audits_history.json");
const EXECUTIONS_FILE = path.join(DATA_DIR, "executions.json");
const CLIENT_ERRORS_FILE = path.join(DATA_DIR, "client_errors.json");
const FEEDBACK_FILE = path.join(DATA_DIR, "feedback.json");
const INTERVIEW_EXPERIENCES_FILE = path.join(DATA_DIR, "interview-experiences.json");

// Caps for append-only JSON logs so they can never grow unbounded on disk.
const MAX_CLIENT_ERROR_ENTRIES = 1000;
const MAX_FEEDBACK_ENTRIES = 5000;
const MAX_INTERVIEW_EXPERIENCE_ENTRIES = 5000;
const MAX_AUDIT_HISTORY_ENTRIES = 1000;
const MAX_EXECUTIONS_ENTRIES = 5000;
const SESSION_COOKIE = "aiv_session";
const ACCESS_COOKIE = "aiv_access";
const REFRESH_COOKIE = "aiv_refresh";

const DELETION_LOG_FILE = path.join(
  DATA_DIR,
  "account-deletions.json"
);
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

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, part) => {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName) return cookies;
    cookies[rawName] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
}

function getRefreshToken(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return cookies[REFRESH_COOKIE] || null;
}

// Builds the Set-Cookie header value(s) for an authenticated response. Returns
// an array of two cookies: the short-lived access token (read by getSession)
// and the long-lived refresh token (read by getRefreshToken on /api/refresh).
// Previously this set only the access cookie, so the aiv_refresh cookie was
// never issued and silent token refresh could never succeed (#1225).
function authCookies(accessToken, refreshToken, req) {
  const secure = req.headers["x-forwarded-proto"] === "https";
  const cookie = (name, value, maxAge) =>
    [
      `${name}=${encodeURIComponent(value)}`,
      "HttpOnly",
      "SameSite=Lax",
      "Path=/",
      `Max-Age=${maxAge}`,
      secure ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

  return [
    cookie(SESSION_COOKIE, accessToken, ACCESS_TOKEN_MAX_AGE_SECONDS),
    cookie(REFRESH_COOKIE, refreshToken, REFRESH_TOKEN_MAX_AGE_SECONDS),
  ];
}

function clearAuthCookies() {
  return [
    `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
    `${REFRESH_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
  ];
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
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, "[]\n");
    }
  } catch (err) {
    console.error("[ensureUserStore] Failed to initialize user store:", err);
  }
}

async function readUsers() {
  if (!userCacheDirty && memoryUserStore.size > 0) {
    return Array.from(memoryUserStore.values());
  }
  await ensureUserStore();
  try {
    const stat = await fs.stat(USERS_FILE);
    if (!userCacheDirty && stat.mtimeMs <= userCacheTimestamp) {
      return Array.from(memoryUserStore.values());
    }
    const raw = await fs.readFile(USERS_FILE, "utf8");
    const users = JSON.parse(raw || "[]");
    memoryUserStore.clear();
    users.forEach((u) => memoryUserStore.set(u.email, u));
    userCacheTimestamp = stat.mtimeMs;
    userCacheDirty = false;
    return users;
  } catch (err) {
    console.error("[readUsers] Failed to read users:", err);
    return Array.from(memoryUserStore.values());
  }
}

async function writeUsers(users) {
  await ensureUserStore();
  try {
    await fs.writeFile(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`);
    userCacheDirty = true;
  } catch (err) {
    console.error("[writeUsers] Failed to write users:", err);
  }
}

async function ensureAuditsStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(AUDITS_FILE);
  } catch {
    await fs.writeFile(AUDITS_FILE, "[]\n");
  }
}

async function readAudits() {
  await ensureAuditsStore();
  const raw = await fs.readFile(AUDITS_FILE, "utf8");
  return JSON.parse(raw || "[]");
}

async function writeAudits(audits) {
  await ensureAuditsStore();
  await fs.writeFile(AUDITS_FILE, `${JSON.stringify(audits, null, 2)}\n`);
}

// ── Execution History Store ─────────────────────────────────────────────────

let executionWriteQueue = Promise.resolve();

async function ensureExecutionStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(EXECUTIONS_FILE);
  } catch {
    await fs.writeFile(EXECUTIONS_FILE, "[]\n");
  }
}

async function readExecutions() {
  await ensureExecutionStore();
  const raw = await fs.readFile(EXECUTIONS_FILE, "utf8");
  return JSON.parse(raw || "[]");
}

async function writeExecutionsAtomic(executions) {
  const tmpPath = `${EXECUTIONS_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmpPath, `${JSON.stringify(executions, null, 2)}\n`);
  await fs.rename(tmpPath, EXECUTIONS_FILE);
}

async function updateExecutionStore(mutator) {
  const task = executionWriteQueue.then(async () => {
    await ensureExecutionStore();
    const raw = await fs.readFile(EXECUTIONS_FILE, "utf8");
    const store = JSON.parse(raw || "[]");
    const result = await mutator(store);
    if (store.length > MAX_EXECUTIONS_ENTRIES) {
      store.splice(0, store.length - MAX_EXECUTIONS_ENTRIES);
    }
    await writeExecutionsAtomic(store);
    return result;
  });
  executionWriteQueue = task.catch((err) => {
    console.error("[updateExecutionStore] Write task failed:", err);
  });
  return task;
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
  memoryWriteQueue = task.catch(() => {});
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

// ── Serialized, size-capped JSON array append store ──────────────────────────
// Append-style endpoints (client error logs, feedback, interview experiences,
// audit history) previously did an unserialized readFile → parse → push →
// writeFile. Under concurrency those interleave and silently drop entries
// (lost writes), and they grow without bound — the anonymous /api/log-error
// route is a disk-fill DoS. This helper serializes each file's read-modify-write
// through a per-file promise chain (mirroring updateMemoryStore), writes
// atomically via a temp file + rename, and caps the array to its most recent
// `maxEntries` so the file can never grow unbounded.
const jsonArrayWriteQueues = new Map();

function appendToJsonArrayFile(filePath, entry, maxEntries = 1000) {
  const previous = jsonArrayWriteQueues.get(filePath) || Promise.resolve();
  const task = previous.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    let list = [];
    try {
      const raw = await fs.readFile(filePath, "utf8");
      list = JSON.parse(raw || "[]");
      if (!Array.isArray(list)) list = [];
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
    list.push(entry);
    if (list.length > maxEntries) {
      list = list.slice(list.length - maxEntries);
    }
    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmpPath, `${JSON.stringify(list, null, 2)}\n`);
    await fs.rename(tmpPath, filePath);
    return entry;
  });
  // Keep the chain alive even if one write rejects, so later writes still run.
  jsonArrayWriteQueues.set(filePath, task.catch(() => {}));
  return task;
}

// ──────────────────────────────────────────────────────────────────────────

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (req.body && typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1024 * 1024)
      throw new Error("Request body is too large.");
  }
  return body ? JSON.parse(body) : {};
}

function sendJson(res, status, body, headers = {}) {
  // Note: COOP header omitted to allow Firebase signInWithPopup to access popup.closed
  // when opening cross-origin OAuth popups (Google, etc.)
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
  return verifyAccessToken(cookies[SESSION_COOKIE]);
}

// A team profile is private to its owner — the authenticated user who first
// created it — and any explicitly listed members. Profiles with no recorded
// owner are treated as unclaimed legacy data: still readable, and claimed by
// the first authenticated user who writes them. This closes the IDOR where any
// client could read/overwrite any profile just by knowing its id.
function canAccessTeamProfile(profile, userId) {
  if (!profile || !profile.ownerId) return true;
  if (profile.ownerId === userId) return true;
  const members = Array.isArray(profile.members) ? profile.members : [];
  return members.some(
    (m) =>
      m === userId ||
      (m && typeof m === "object" && (m.id === userId || m.userId === userId)),
  );
}

function normalizePathname(pathname) {
  if (!pathname) return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function isProtectedRoute(pathname) {
  return protectedPaths.has(pathname);
}

function authorizeRequest(req, pathname) {
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

  return {
    authorized: true,
    session,
  };
}

function validateRequest(req) {
  const allowedMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
  if (!allowedMethods.includes(req.method)) {
    return {
      valid: false,
      status: 405,
      message: "Method not allowed.",
    };
  }

  return { valid: true };
}

// ── CSRF protection ──────────────────────────────────────────────────────────
// Previously a CSRF token was issued by /api/csrf-token but never checked, so
// every state-changing request was unprotected. A mutating request is now
// accepted only when it proves it originated from our own site, via EITHER:
//   1. a valid double-submit token — the x-csrf-token header equals
//      HMAC(csrfSecret cookie), compared with crypto.timingSafeEqual
//      (see verifyCsrfToken); OR
//   2. an Origin/Referer header whose host matches our own — a value a
//      cross-site attacker's page cannot set on a forged request.
// A forged cross-site request carries neither and is rejected with 403.
const CSRF_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function isSameOriginRequest(req) {
  const host = req.headers.host;
  if (!host) return false;
  for (const header of [req.headers.origin, req.headers.referer]) {
    if (!header) continue;
    try {
      const requestHost = host.split(":")[0];
      const urlHost = new URL(header).host.split(":")[0];
      if (urlHost && requestHost && urlHost === requestHost) return true;
    } catch {
      // Malformed Origin/Referer header — treat as untrusted.
    }
  }
  return false;
}

function isCsrfRequestTrusted(req) {
  return verifyCsrfToken(req) || isSameOriginRequest(req);
}

async function handleApi(req, res, pathname) {
  // Reject state-changing requests that cannot prove a same-site origin.
  if (!CSRF_SAFE_METHODS.has(req.method) && !isCsrfRequestTrusted(req)) {
    return sendJson(res, 403, { error: "CSRF validation failed." });
  }

  if (pathname === "/api/csrf-token" && req.method === "GET") {
    const secret = crypto.randomBytes(32).toString("hex");
    const token = crypto.createHmac("sha256", process.env.CSRF_SALT || "infinity-verse-secure-salt")
                        .update(secret)
                        .digest("hex");
    const isProd = process.env.NODE_ENV === "production";
    const cookieString = `csrfSecret=${secret}; HttpOnly; ${isProd ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=3600`;
    return sendJson(res, 200, { csrfToken: token }, { "Set-Cookie": cookieString });
  }

  if (pathname === "/api/log-error" && req.method === "POST") {
    // Anonymous + append-only: rate-limit to curb write-flooding abuse. The
    // capped, serialized write below bounds disk use regardless.
    if (!applyRateLimit(req, res, logErrorLimiter, "Too many error reports. Please try again later.")) {
      return;
    }
    try {
      const payload = await readJsonBody(req);
      await appendToJsonArrayFile(CLIENT_ERRORS_FILE, payload, MAX_CLIENT_ERROR_ENTRIES);
      return sendJson(res, 200, { success: true });
    } catch (err) {
      console.error("Error logging client error:", err);
      return sendJson(res, 500, { error: "Failed to log error" });
    }
  }
  
  if (pathname === "/api/execute" && req.method === "POST") {
    try {
      const session = getSession(req);
      if (!session) {
        return sendJson(res, 401, {
          success: false,
          message: "Authentication required.",
        });
      }

      let payload;
      try {
        payload = await readJsonBody(req);
      } catch (err) {
        const tooLarge = err?.message === "Request body is too large.";
        return sendJson(res, tooLarge ? 413 : 400, {
          success: false,
          message: tooLarge ? "Request body is too large." : "Invalid JSON body.",
        });
      }
      const sourceCode = payload.sourceCode ?? payload.source_code;
      const originalCode = payload.originalCode;
      const { language, stdin } = payload;

      if (
        typeof sourceCode !== "string" ||
        !sourceCode.trim() ||
        typeof language !== "string" ||
        !language.trim()
      ) {
        return sendJson(res, 400, { success: false, message: 'Source code and language are required.' });
      }

      if (!sourceCode || !language) {
        return sendJson(res, 400, { success: false, message: 'Source code and language are required.' });
      }



      const languageId = JUDGE0_LANGUAGE_IDS[language.toLowerCase()];

      if (!languageId) {
         return sendJson(res, 400, { success: false, message: 'Unsupported language.' });
      }

      const JUDGE0_API = 'https://ce.judge0.com';
      const b64 = (s) => Buffer.from(s, 'utf-8').toString('base64');
      const d64 = (s) => s ? Buffer.from(s, 'base64').toString('utf-8') : '';

      const executionId = uuidv4();
      const startedAt = new Date().toISOString();

      let stdout = "", stderr = "", exitCode = 0, cpuTime = null, memory = null, execError = null;

      try {
        const submitRes = await fetch(`${JUDGE0_API}/submissions?base64_encoded=true&wait=false`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_code: b64(sourceCode),
            language_id: languageId,
            stdin: b64(stdin || ""),
            compiler_options: languageId === 54 ? '-std=c++17' : undefined,
          })
        });

        if (!submitRes.ok) {
          const errText = await submitRes.text();
          throw new Error(`Judge0 submission error: ${errText}`);
        }

        const { token } = await submitRes.json();
        if (!token) throw new Error('No submission token received from Judge0');

        let result;
        for (let i = 0; i < 50; i++) {
          await new Promise(r => setTimeout(r, 600));
          const pollRes = await fetch(`${JUDGE0_API}/submissions/${encodeURIComponent(token)}?base64_encoded=true`);
          if (!pollRes.ok) throw new Error(`Judge0 poll error: ${await pollRes.text()}`);
          result = await pollRes.json();
          if (result.status && result.status.id >= 3) break;
        }

        if (!result || (result.status && result.status.id < 3)) {
          throw new Error('Judge0 execution timed out');
        }

        stdout = d64(result.stdout);
        stderr = d64(result.stderr) || d64(result.compile_output) || '';
        exitCode = result.status?.id === 3 ? 0 : 1;
        cpuTime = result.time ?? null;
        memory = result.memory ?? null;
      } catch (fetchErr) {
        execError = fetchErr.message;
      }

      const execution = {
        id: executionId,
        userId: session.sub,
        sourceCode,
        originalCode,
        language,
        stdin: stdin || "",
        stdout,
        stderr,
        exitCode: execError ? 1 : exitCode,
        cpuTime,
        memory,
        error: execError,
        createdAt: startedAt,
        variableSnapshots: []
      };

      await updateExecutionStore((store) => {
        store.push(execution);
      });

      if (execError) {
        return sendJson(res, 500, {
            success: false,
            message: execError,
            executionId
        });
      }

      return sendJson(res, 200, {
          success: true,
          executionId,
          data: {
              output: stdout,
              stderr,
              memory,
              cpuTime
          }
      });
    } catch (error) {
        console.error('Server Execution Error:', error);
        return sendJson(res, 500, { success: false, message: 'Internal server proxy error.' });
    }
  }

  // ── Traced Execution (JS only, server-side child process with variable snapshots) ──

  if (pathname === "/api/execute/traced" && req.method === "POST") {
    try {
      const session = getSession(req);
      if (!session) {
        return sendJson(res, 401, { success: false, message: "Authentication required." });
      }

      const payload = await readJsonBody(req);
      const sourceCode = payload.sourceCode ?? payload.source_code;
      const originalCode = payload.originalCode;
      const stdin = payload.stdin ?? "";

      if (!sourceCode || typeof sourceCode !== "string") {
        return sendJson(res, 400, { success: false, message: "Source code is required." });
      }

      const { instrumented, variableNames, error: instrumentError } = instrumentJS(sourceCode);
      if (instrumentError) {
        return sendJson(res, 400, { success: false, message: instrumentError });
      }

      const tmpFile = path.join(DATA_DIR, `__trace_${crypto.randomUUID()}.mjs`);
      let snapshots = [];
      let userOutput = "";
      let traceError = null;

      try {
        await fs.writeFile(tmpFile, instrumented, "utf8");
        await new Promise((resolve, reject) => {
          // Sandbox the user-submitted code: instrumentJS does NOT isolate it,
          // so run it under Node's Permission Model (--permission denies fs,
          // child_process, worker_threads and native addons) with an empty
          // environment so the child cannot read server secrets (SESSION_SECRET,
          // Firebase keys, etc.). process.execPath is used directly so the
          // binary resolves without a PATH in the stripped env. This blocks the
          // RCE / secret-exfiltration path while still allowing console output
          // and the snapshot JSON written to stdout.
          execFile(process.execPath, ["--permission", tmpFile], {
            timeout: 10000,
            maxBuffer: 1024 * 1024,
            env: {},
          }, (err, stdout, stderr) => {
            if (stdout) {
              try {
                const parsed = JSON.parse(stdout);
                if (parsed.snapshots && Array.isArray(parsed.snapshots)) {
                  snapshots = parsed.snapshots;
                  userOutput = (parsed.output || []).join("\n");
                } else {
                  userOutput = stdout;
                }
              } catch {
                userOutput = stdout;
              }
            }

            if (err) {
              if (snapshots.length === 0) {
                reject(new Error(stderr || err.message));
              } else {
                resolve();
              }
            } else {
              resolve();
            }
          });
        });
      } catch (execError) {
        traceError = execError.message;
        userOutput = `Execution error: ${traceError}`;
      } finally {
        await fs.unlink(tmpFile).catch(() => {});
      }
      const executionId = uuidv4();
      const execution = {
        id: executionId,
        userId: session.sub,
        sourceCode,
        originalCode,
        language: "javascript",
        stdin,
        stdout: userOutput,
        stderr: traceError || "",
        exitCode: traceError ? 1 : 0,
        cpuTime: null,
        memory: null,
        error: traceError,
        createdAt: new Date().toISOString(),
        variableSnapshots: snapshots,
        traced: true,
      };

      await updateExecutionStore((store) => {
        store.push(execution);
      });

      return sendJson(res, 200, {
        success: !traceError,
        executionId,
        data: { output: userOutput },
        snapshots,
      });
    } catch (error) {
      console.error("Traced Execution Error:", error);
      return sendJson(res, 500, { success: false, message: "Traced execution failed." });
    }
  }

  if (pathname === "/api/team-profile" && req.method === "GET") {
    try {
      const session = getSession(req);
      if (!session) {
        return sendJson(res, 401, { error: "Login required." });
      }

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

      if (profileData && !canAccessTeamProfile(profileData, session.sub)) {
        return sendJson(res, 403, { error: "You do not have access to this team profile." });
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
      const session = getSession(req);
      if (!session) {
        return sendJson(res, 401, { error: "Login required." });
      }

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

            // Ownership check: only the owner/members may modify a claimed profile.
            if (!canAccessTeamProfile(currentProfile, session.sub)) {
              const forbiddenError = new Error("Forbidden");
              forbiddenError.status = 403;
              throw forbiddenError;
            }

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
              ownerId: currentProfile.ownerId || session.sub,
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
          if (error.status === 403) {
            return sendJson(res, 403, { error: "You do not have access to this team profile." });
          }
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
            const existing = doc.exists ? doc.data() : null;

            // Ownership check: only the owner/members may modify a claimed profile.
            if (!canAccessTeamProfile(existing, session.sub)) {
              const forbiddenError = new Error("Forbidden");
              forbiddenError.status = 403;
              throw forbiddenError;
            }

            const currentVersion = existing ? existing.version : 1;

            if (currentVersion !== version) {
              const conflictError = new Error("Conflict");
              conflictError.status = 409;
              conflictError.currentVersion = currentVersion;
              throw conflictError;
            }

            const newProfile = {
              id: teamId,
              ownerId: (existing && existing.ownerId) || session.sub,
              name: name || (existing ? existing.name : "New Team Profile"),
              description: description !== undefined ? description : (existing ? existing.description : ""),
              members: members || (existing ? existing.members : []),
              version: version + 1,
              updatedAt: new Date().toISOString()
            };

            transaction.set(docRef, newProfile);
            return newProfile;
          });
        } catch (error) {
          if (error.status === 403) {
            return sendJson(res, 403, { error: "You do not have access to this team profile." });
          }
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

  if (
    pathname === "/api/debug-env" &&
    req.method === "GET" &&
    process.env.ENABLE_DEBUG_ENV === "true"
  ) {
    const keys = ["FIREBASE_API_KEY","FIREBASE_AUTH_DOMAIN","FIREBASE_PROJECT_ID","FIREBASE_STORAGE_BUCKET","FIREBASE_MESSAGING_SENDER_ID","FIREBASE_APP_ID","FIREBASE_CLIENT_EMAIL","FIREBASE_PRIVATE_KEY","SESSION_SECRET"];
    const vars = {};
    keys.forEach(k => {
      const v = process.env[k];
      vars[k] = Boolean(process.env[k]);
    });
    return sendJson(res, 200, vars);
  }
  if (pathname === "/api/firebase-config" && req.method === "GET") {
    const apiKey = process.env.FIREBASE_API_KEY;
    const authDomain = process.env.FIREBASE_AUTH_DOMAIN;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    const messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID;
    const appId = process.env.FIREBASE_APP_ID;

    if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
      return sendJson(res, 503, { configured: false, error: "Firebase not configured" });
    }

    return sendJson(res, 200, {
      configured: true,
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    });
  }

  if (pathname === "/api/analyze-resume" && req.method === "POST") {
    if (!applyRateLimit(req, res, resumeAnalysisLimiter, "Too many resume analysis requests. Please try again later.")) {
      return;
    }
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

      const allowedMimeTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
      ];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return sendJson(res, 400, { error: "Unsupported file type. Upload PDF or DOCX." });
      }

      if (!validateMagicBytes(req.file.buffer, req.file.mimetype)) {
        return sendJson(res, 400, { error: "File content mismatch. The uploaded file's content does not match its type." });
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
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return sendJson(res, 413, { error: "Resume file is too large." });
      }
      if (error?.message === "Unsupported file") {
        return sendJson(res, 400, { error: "Unsupported file type. Upload PDF or DOCX." });
      }
      return sendJson(res, 500, { error: "Failed to analyze resume." });
    }
  }

  if (pathname === "/api/analyze-repository" && req.method === "POST") {
    if (!applyRateLimit(req, res, repoAnalysisLimiter, "Too many repository analysis requests. Please try again later.")) {
      return;
    }
    try {
      const payload = await readJsonBody(req);
      const { repoUrl } = payload;
      
      if (!repoUrl || !repoUrl.includes("github.com")) {
        return sendJson(res, 400, { error: "Please provide a valid GitHub repository URL." });
      }

      const provider = VCSFactory.getProvider(repoUrl);
      const workflows = await provider.getNormalizedWorkflows();
      
      if (workflows.length === 0) {
        return sendJson(res, 200, {
          score: 0,
          workflowsAnalyzed: 0,
          details: { hasDependencies: false, hasTests: false },
          recommendations: ["No GitHub Actions workflows found in .github/workflows. Add a CI/CD pipeline to automate testing."]
        });
      }

      let bestScore = -1;
      let overallDeps = false;
      let overallTests = false;

      for (const wf of workflows) {
        const result = analyzeWorkflow(wf.commands);
        if (result.score > bestScore) bestScore = result.score;
        if (result.hasDependencies) overallDeps = true;
        if (result.hasTests) overallTests = true;
      }

      const recommendations = [];
      if (bestScore === 20) recommendations.push("Workflows found, but they contain no functional jobs or steps.");
      if (bestScore === 50) recommendations.push("Add explicit testing commands (like 'npm test') to your workflow.");
      if (bestScore === 75) recommendations.push("Ensure dependencies are installed securely before running tests.");
      if (bestScore === 100) recommendations.push("Excellent! Fully functional CI/CD pipeline detected.");

      return sendJson(res, 200, {
        score: bestScore,
        workflowsAnalyzed: workflows.length,
        details: {
          hasDependencies: overallDeps,
          hasTests: overallTests
        },
        recommendations
      });

    } catch (err) {
      console.error("Repository analysis error:", err.message);
      return sendJson(res, 500, { error: "Failed to analyze repository. " + err.message });
    }
  }

  // SDLC Advisor API
  if (pathname === "/api/sdlc-advisor" && req.method === "POST") {
    if (!applyRateLimit(req, res, sdlcAdvisorLimiter, "Too many SDLC advisor requests. Please try again later.")) {
      return;
    }
    try {
      const payload = await readJsonBody(req);
      const { description } = payload;
      if (!description) {
        return sendJson(res, 400, { error: "Project description is required." });
      }
      const advice = await generateSdlcAdvice(description);
      return sendJson(res, 200, advice);
    } catch (e) {
      console.error("SDLC Advisor error:", e);
      return sendJson(res, 500, { error: "Failed to generate SDLC advice." });
    }
  }

  // Bulk Audit APIs
  if (pathname === "/api/audit/bulk" && req.method === "POST") {
    if (!applyRateLimit(req, res, bulkAuditLimiter, "Too many bulk audit requests. Please try again later.")) {
      return;
    }
    try {
      uploadCsv(req, res, async (err) => {
        if (err) return sendJson(res, 500, { error: "Upload error." });
        if (!req.file) return sendJson(res, 400, { error: "No CSV file uploaded." });

        try {
          const records = csvParse(req.file.buffer.toString('utf-8'), { columns: false, skip_empty_lines: true });
          // Extract repo URLs from the first column
          const repoUrls = records.map(row => row[0]).filter(url => url && url.includes("github.com"));

          if (repoUrls.length === 0) {
            return sendJson(res, 400, { error: "No valid GitHub URLs found in the CSV." });
          }

          // Cap batch size: each URL fans out to outbound GitHub requests, so an
          // unbounded CSV is a denial-of-service / cost-amplification vector.
          if (repoUrls.length > MAX_BULK_AUDIT_URLS) {
            return sendJson(res, 400, {
              error: `Too many repositories. A maximum of ${MAX_BULK_AUDIT_URLS} is allowed per bulk audit.`,
              maxAllowed: MAX_BULK_AUDIT_URLS,
              received: repoUrls.length,
            });
          }

          const batchId = uuidv4();
          await enqueueBulkAudit(batchId, repoUrls);

          return sendJson(res, 202, {
            message: "Bulk audit accepted and queued.",
            batchId,
            totalJobs: repoUrls.length
          });
        } catch (parseErr) {
          console.error("CSV Parse Error:", parseErr);
          return sendJson(res, 400, { error: "Failed to parse CSV file." });
        }
      });
      return; // Async multer
    } catch (err) {
      return sendJson(res, 500, { error: "Failed to queue bulk audit." });
    }
  }

  if (pathname.startsWith("/api/audit/bulk/") && req.method === "GET") {
    const batchId = pathname.split("/").pop();
    const progress = getBatchProgress(batchId);
    if (!progress) {
      return sendJson(res, 404, { error: "Batch not found." });
    }
    return sendJson(res, 200, progress);
  }


  if (pathname === "/api/logout" && req.method === "POST") {
    const rToken = getRefreshToken(req);
    if (rToken) {
      const decoded = verifyRefreshToken(rToken);
      if (decoded) revokeTokenFamily(decoded.familyId);
    }
    return sendJson(res, 200, { success: true }, { "Set-Cookie": clearAuthCookies() });
  }

  if (pathname === "/api/refresh" && req.method === "POST") {
    const rToken = getRefreshToken(req);
    if (!rToken) return sendJson(res, 401, { error: "No refresh token" });
    
    const decoded = verifyRefreshToken(rToken);
    if (!decoded) return sendJson(res, 401, { error: "Invalid or expired refresh token" }, { "Set-Cookie": clearAuthCookies() });
    revokeTokenFamily(decoded.familyId);

    // Find user
    const users = useFirestore ? [] : await readUsers();
    let user;
    if (useFirestore) {
      user = await getUserByEmail(decoded.email);
      if (!user) {
        try {
          const snapshot = await db.collection("users").doc(decoded.sub).get();
          if (snapshot.exists) user = { ...snapshot.data(), id: snapshot.id };
        } catch(e) {}
      }
    } else {
      user = users.find(u => u.id === decoded.sub);
    }

    if (!user) return sendJson(res, 401, { error: "User not found" }, { "Set-Cookie": clearAuthCookies() });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user, decoded.familyId);
    
    return sendJson(res, 200, { success: true }, { "Set-Cookie": authCookies(accessToken, refreshToken, req) });
  }

  if (pathname === "/api/guest" && req.method === "POST") {
    try {
      const guestId = crypto.randomUUID();
      const guestUser = {
        id: `guest-${guestId}`,
        name: "Guest",
        email: `guest-${guestId}@local`,
      };
      const token = createAccessToken(guestUser);
      const refreshToken = createRefreshToken(guestUser);
      return sendJson(
        res, 200,
        { user: { id: guestUser.id, name: guestUser.name, email: guestUser.email } },
        { "Set-Cookie": authCookies(token, refreshToken, req) },
      );
    } catch (err) {
      console.error("[guest] Unexpected error:", err);
      return sendJson(res, 500, { error: "Guest login failed. Please try again." });
    }
  }

  if (pathname === "/api/session" && req.method === "GET") {
    const session = getSession(req);
    
    
    if (!session) {
      return sendJson(res, 200, { authenticated: false, user: null });
    }
    
    if (!session) {
      return sendJson(res, 200, { authenticated: false, user: null });
    }
    return sendJson(res, 200, {
      authenticated: true,
      user: {
        id: session.sub,
        name: session.name,
        sub: session.sub,
        email: session.email,
      },
    });
  }

  if (pathname === "/api/signup" && req.method === "POST") {
    try {
      if (!applyRateLimit(req, res, signupLimiter, "Too many signup attempts. Please try again later.")) {
        return;
      }

      const payload = await readJsonBody(req);
      const validationError = validateSignup(payload);
      if (validationError) return sendJson(res, 400, { error: validationError });

      const email = String(payload.email).trim().toLowerCase();
      const existing = await getUserByEmail(email);
      if (existing) {
        await normalizeAuthDelay();
        return sendJson(res, 409, { error: "An account with this email already exists." });
      }

      const verifyToken = crypto.randomBytes(32).toString("hex");
      const user = {
        id: crypto.randomUUID(),
        name: String(payload.name).trim(),
        email,
        password: hashPassword(String(payload.password)),
        createdAt: new Date().toISOString(),
        isDeactivated: false,
        deactivatedAt: null,
        emailVerified: false,
        verifyToken,
        verifyTokenExpiry: Date.now() + 24 * 60 * 60 * 1000,
      };
      await createUser(user);

      sendVerificationEmail(email, user.name, verifyToken).catch((err) =>
        console.error("[email] Signup verification failed:", err)
      );

      const token = createAccessToken(user);
      const refreshToken = createRefreshToken(user);
      loginLimiter.reset(getClientIdentifier(req));
      return sendJson(
        res, 200,
        { user: { id: user.id, name: user.name, email: user.email } },
        { "Set-Cookie": authCookies(token, refreshToken, req) },
      );
    } catch (error) {
      console.error("[signup] Unexpected error:", error);
      return sendJson(res, 500, { error: "Signup failed due to a server error." });
    }
  }

  if (pathname === "/api/login" && req.method === "POST") {
    try {
      if (!applyRateLimit(req, res, loginLimiter, "Too many login attempts. Please try again later.")) {
        return;
      }
      const payload = await readJsonBody(req);
      const email = String(payload.email || "").trim().toLowerCase();
      const password = String(payload.password || "");
      const user = await getUserByEmail(email);
      if (!user || !user.password || !passwordMatches(password, user.password)) {
       console.warn(`[LOGIN FAILED] ${email}`);
      return sendJson(res, 401, { error: "Invalid email or password." });
      }

      if (!user.emailVerified) {
        return sendJson(res, 403, {
          error: "Please verify your email before logging in.",
          requiresVerification: true,
          email: user.email,
        });
      }

      if (user.isDeactivated) {
        user.isDeactivated = false;
        user.deactivatedAt = null;
        if (useFirestore) {
          await db.collection(COLLECTIONS.USERS).doc(user.id).update({
            isDeactivated: false,
            deactivatedAt: null,
          });
        } else {
          const users = await readUsers();
          const index = users.findIndex((u) => u.id === user.id);
          if (index !== -1) {
            users[index] = user;
            await writeUsers(users);
          }
        }
      }

      const token = createAccessToken(user);
      const refreshToken = createRefreshToken(user);
      loginLimiter.reset(getClientIdentifier(req));
      return sendJson(
        res, 200,
        { user: { id: user.id, name: user.name, email: user.email } },
        { "Set-Cookie": authCookies(token, refreshToken, req) },
      );
    } catch (error) {
      console.error("[login] Unexpected error:", error);
      return sendJson(res, 500, { error: "Login failed due to a server error." });
    }
  }

  if (pathname === "/api/auth/google" && req.method === "POST") {
    if (!process.env.FIREBASE_PROJECT_ID) {
      return sendJson(res, 500, { error: "Firebase is not configured for authentication. Set FIREBASE_PROJECT_ID environment variable." });
    }

    try {
      const body = await readJsonBody(req);
      const { idToken } = body;
      if (!idToken) {
        return sendJson(res, 400, { error: "Missing idToken" });
      }

      let decoded;
      try {
        // Cryptographically verify the Google ID token with the Firebase Admin
        // SDK. verifyIdToken checks the RS256 signature against Google's public
        // keys and validates the aud (project id), iss
        // (securetoken.google.com/<project>) and exp claims — far stronger than
        // the previous Identity Toolkit REST lookup with the public API key.
        const { getAuth } = await import("firebase-admin/auth");
        const decodedToken = await getAuth().verifyIdToken(idToken);
        decoded = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email,
          picture: decodedToken.picture || null,
          emailVerified: decodedToken.email_verified === true,
        };
      } catch (verifyError) {
        console.error("Token verification failed:", verifyError.message);
        return sendJson(res, 401, { error: "Invalid token" });
      }

      // Enforce a Google-verified email. Only an email Google itself has
      // verified is trusted, which is what makes the email-based account
      // matching below safe from takeover.
      if (!decoded.email) {
        return sendJson(res, 400, { error: "Google token has no email." });
      }
      if (!decoded.emailVerified) {
        return sendJson(res, 403, { error: "Google account email is not verified." });
      }

      const { uid, email, name, picture } = decoded;
      const cleanEmail = (email || "").toLowerCase().trim();
      const displayName = name || cleanEmail.split("@")[0] || "Learner";

      let user = null;
      if (!useFirestore) {
        return sendJson(res, 503, { error: "User accounts require Firebase Firestore in serverless mode. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables." });
      }
      const snapshot = await db
        .collection(COLLECTIONS.USERS)
        .where("firebaseUid", "==", uid)
        .limit(1)
        .get();
      if (!snapshot.empty) {
        user = { ...snapshot.docs[0].data(), id: snapshot.docs[0].id };
      } else {
        const emailSnapshot = await db
          .collection(COLLECTIONS.USERS)
          .where("email", "==", cleanEmail)
          .limit(1)
          .get();
        if (!emailSnapshot.empty) {
          const existing = { ...emailSnapshot.docs[0].data(), id: emailSnapshot.docs[0].id };
          // Only link to an account that is itself Google-provisioned. Silently
          // merging a Google login into a password account would let anyone with
          // a matching Google address take it over (local signups are not
          // email-verified), so require the user to sign in with their password.
          const isGoogleAccount = existing.authProvider === "google" || !!existing.firebaseUid;
          if (!isGoogleAccount) {
            return sendJson(res, 409, {
              error: "An account with this email already exists. Please sign in with your password.",
            });
          }
          user = existing;
        }
      }

      if (user) {
        user.name = displayName;
        user.avatar = picture || user.avatar;
        user.lastLogin = new Date().toISOString();
        if (!user.firebaseUid) user.firebaseUid = uid;
        if (!user.authProvider) user.authProvider = "google";
        await db.collection(COLLECTIONS.USERS).doc(user.id).update({
          name: displayName, avatar: picture || null,
          lastLogin: new Date().toISOString(),
          firebaseUid: uid, authProvider: "google",
        });
      } else {
        const newUser = {
          id: uid, name: displayName, email: cleanEmail,
          avatar: picture || null, firebaseUid: uid,
          authProvider: "google",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        user = await createUser(newUser);
      }

      const token = createAccessToken(user);
      const refreshToken = createRefreshToken(user);
      const cookie = authCookies(token, refreshToken, req);

      return sendJson(res, 200, {
        authenticated: true,
        user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
      }, { "Set-Cookie": cookie });

    } catch (error) {
      console.error("Google auth error:", error.message || error);
      return sendJson(res, 500, { error: "Internal server error" });
    }
  }

  if (pathname === "/api/change-password" && req.method === "POST") {
    if (!applyRateLimit(req, res, changePasswordLimiter, "Too many change password attempts. Please try again later.")) {
      return;
    }
    const session = getSession(req);

    if (!session) {
      return sendJson(res, 401, {
        error: "Login required.",
      });
    }

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = await readJsonBody(req);

  if (
    !currentPassword ||
    !newPassword ||
    !confirmPassword
  ) {
    return sendJson(res, 400, {
      error: "All fields are required.",
    });
  }

  if (newPassword !== confirmPassword) {
    return sendJson(res, 400, {
      error: "Passwords do not match.",
    });
  }

  if (newPassword.length < 8) {
    return sendJson(res, 400, {
      error:
        "Password must be at least 8 characters.",
    });
  }

  if (
    !/[A-Z]/.test(newPassword) ||
    !/[a-z]/.test(newPassword) ||
    !/\d/.test(newPassword)
  ) {
    return sendJson(res, 400, {
      error:
        "Password must contain uppercase, lowercase and number.",
    });
  }

  const users = await readUsers();

  const user = users.find(
    (u) => u.id === session.sub
  );

  if (!user) {
    return sendJson(res, 404, {
      error: "User not found.",
    });
  }

  if (
    !passwordMatches(
      currentPassword,
      user.password
    )
  ) {
    return sendJson(res, 400, {
      error: "Current password is incorrect.",
    });
  }

  user.password = hashPassword(newPassword);

  await writeUsers(users);

  changePasswordLimiter.reset(getClientIdentifier(req));

  return sendJson(
    res,
    200,
    {
      success: true,
      message:
        "Password updated successfully.",
    },
    {
      "Set-Cookie": clearAuthCookies(),
    }
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
    { success: true },
    {
      "Set-Cookie": clearAuthCookies(),
    },
  );
}

if (
  pathname === "/api/delete-account" &&
  req.method === "POST"
) {
  if (!applyRateLimit(req, res, deleteAccountLimiter, "Too many delete account attempts. Please try again later.")) {
    return;
  }
  const session = getSession(req);

  if (!session) {
    return sendJson(res, 401, {
      error: "Login required.",
    });
  }

  const payload = await readJsonBody(req);

  const password = String(
    payload.password || ""
  );

  const users = await readUsers();

  const userIndex = users.findIndex(
    (u) => u.id === session.sub
  );

  if (userIndex === -1) {
    return sendJson(res, 404, {
      error: "User not found.",
    });
  }

  const user = users[userIndex];

  if (
    !passwordMatches(
      password,
      user.password
    )
  ) {
    return sendJson(res, 401, {
      error: "Incorrect password.",
    });
  }

  // Log deletion event
  const deletionEvent = {
    userId: user.id,
    email: user.email,
    deletedAt: new Date().toISOString(),
  };

  let logs = [];

  try {
    const raw = await fs.readFile(
      DELETION_LOG_FILE,
      "utf8"
    );

    logs = JSON.parse(raw || "[]");
  } catch {}

  logs.push(deletionEvent);

  await fs.writeFile(
    DELETION_LOG_FILE,
    JSON.stringify(logs, null, 2)
  );

  // Remove user
  users.splice(userIndex, 1);

  await writeUsers(users);

  return sendJson(
    res,
    200,
    {
      success: true,
    },
    {
      "Set-Cookie":
        clearAuthCookies(),
    }
  );
}
if (pathname === "/api/forgot-password" && req.method === "POST") {
    if (!applyRateLimit(req, res, forgotPasswordLimiter, "Too many forgot password attempts. Please try again later.")) {
      return;
    }
    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON body." });
    }

    const email = String(payload.email || "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendJson(res, 400, { error: "Valid email required." });
    }

    try {
      const { initializeApp, getApps } = await import("firebase/app");
      const { getAuth, sendPasswordResetEmail } = await import("firebase/auth");

      const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
      };

      if (firebaseConfig.projectId) {
        const existingApps = getApps();
        const clientApp = existingApps.find(a => a.name === "reset-client") ||
          initializeApp(firebaseConfig, "reset-client");

        const auth = getAuth(clientApp);
        await sendPasswordResetEmail(auth, email);
      }
    } catch (err) {
      // Silently fail — don't expose whether email exists
      console.warn("[forgot-password]", err.message);
    }

    // Always return success to prevent email enumeration
    return sendJson(res, 200, { message: "Reset email sent if account exists." });
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
    if (
      typeof feedbackType !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string"
    ) {
      return sendJson(res, 400, {
        error: "Feedback type, subject, and message must be strings.",
      });
    }

    if (!feedbackType.trim() || !subject.trim() || !message.trim()) {
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
        feedbackData.id = crypto.randomUUID();
        await appendToJsonArrayFile(FEEDBACK_FILE, feedbackData, MAX_FEEDBACK_ENTRIES);
      }

      return sendJson(res, 201, { success: true, feedback: feedbackData });
    } catch (err) {
      console.error("Error saving feedback:", err);
      return sendJson(res, 500, { error: "Failed to save feedback." });
    }
  }



  if (pathname === "/api/user/profile" && req.method === "GET") {
    const session = getSession(req);
    
    const userData = {
        user: {
            name: session?.name || 'John Doe',
            username: session?.email?.split('@')[0] || 'johndoe',
            avatar: '🚀',
            bio: 'Passionate about DSA and building cool stuff!',
            joinedDate: '2024-01-15'
        },
        stats: {
            totalSolved: 45,
            xp: 2800,
            streak: 7,
            level: 4
        },
        badges: ['🌟 First Steps', '🔥 On Fire', '💎 Diamond'],
        languages: [
            { name: 'JavaScript', percentage: 80 },
            { name: 'Python', percentage: 65 },
            { name: 'Java', percentage: 50 },
            { name: 'C++', percentage: 40 }
        ],
        projects: [
            { name: 'Weather App', description: 'Real-time weather app', link: '#' },
            { name: 'Task Manager', description: 'Manage tasks easily', link: '#' }
        ],
        recentActivity: [
            { action: 'Solved Two Sum', date: '2026-06-26' },
            { action: 'Completed Arrays Quiz', date: '2026-06-25' },
            { action: 'Earned Diamond Badge', date: '2026-06-24' }
        ]
    };
    
    return sendJson(res, 200, { success: true, data: userData });
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
        await appendToJsonArrayFile(
          INTERVIEW_EXPERIENCES_FILE,
          experienceData,
          MAX_INTERVIEW_EXPERIENCE_ENTRIES,
        );
      }
      return sendJson(res, 201, { success: true, experience: experienceData });
    } catch (err) {
      console.error("Error saving interview experience:", err);
      return sendJson(res, 500, {
        error: "Failed to save interview experience.",
      });
    }
  }

  if (pathname === "/api/audit/history" && req.method === "POST") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });

    try {
      const payload = await readJsonBody(req);
      const auditData = {
        auditId: crypto.randomUUID(),
        userId: session.sub,
        repoUrl: payload.repoUrl || "unknown",
        timestamp: new Date().toISOString(),
        overallScore: Number(payload.overallScore) || 0,
        categoryScores: payload.categoryScores || {},
        issuesCount: Number(payload.issuesCount) || 0,
        recommendations: payload.recommendations || []
      };

      if (useFirestore) {
        await db.collection(COLLECTIONS.AUDITS_HISTORY).doc(auditData.auditId).set(auditData);
      } else {
        await appendToJsonArrayFile(AUDITS_FILE, auditData, MAX_AUDIT_HISTORY_ENTRIES);
      }

      return sendJson(res, 201, { success: true, auditId: auditData.auditId });
    } catch (err) {
      console.error("Error saving audit history:", err);
      return sendJson(res, 500, { error: "Failed to save audit history." });
    }
  }

  if (pathname === "/api/audit/history" && req.method === "GET") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });

    const url = new URL(req.url, `http://${req.headers.host}`);
    const repoUrl = url.searchParams.get("repoUrl");
    const limit = Number(url.searchParams.get("limit")) || 20;

    try {
      let history = [];
      if (useFirestore) {
        let query = db.collection(COLLECTIONS.AUDITS_HISTORY)
          .where("userId", "==", session.sub);
        
        if (repoUrl) {
          query = query.where("repoUrl", "==", repoUrl);
        }
        
        const snapshot = await query.orderBy("timestamp", "desc").limit(limit).get();
        history = snapshot.docs.map(doc => doc.data());
      } else {
        const allAudits = await readAudits();
        history = allAudits.filter(a => a.userId === session.sub);
        if (repoUrl) {
          history = history.filter(a => a.repoUrl === repoUrl);
        }
        history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        history = history.slice(0, limit);
      }

      return sendJson(res, 200, history);
    } catch (err) {
      console.error("Error fetching audit history:", err);
      return sendJson(res, 500, { error: "Failed to fetch audit history." });
    }
  }

  if (pathname === "/api/audit/trends" && req.method === "GET") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });

    const url = new URL(req.url, `http://${req.headers.host}`);
    const repoUrl = url.searchParams.get("repoUrl");

    try {
      let history = [];
      if (useFirestore) {
        let query = db.collection(COLLECTIONS.AUDITS_HISTORY)
          .where("userId", "==", session.sub);
        if (repoUrl) query = query.where("repoUrl", "==", repoUrl);
        const snapshot = await query.orderBy("timestamp", "asc").get();
        history = snapshot.docs.map(doc => doc.data());
      } else {
        const allAudits = await readAudits();
        history = allAudits.filter(a => a.userId === session.sub);
        if (repoUrl) history = history.filter(a => a.repoUrl === repoUrl);
        history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      }

      const trends = history.map(a => ({
        timestamp: a.timestamp,
        overallScore: a.overallScore
      }));

      return sendJson(res, 200, trends);
    } catch (err) {
      console.error("Error fetching audit trends:", err);
      return sendJson(res, 500, { error: "Failed to fetch audit trends." });
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

  // ── Quiz Results (Firestore) ──────────────────────────────────────────────
  if (pathname === "/api/quiz-results" && req.method === "POST") {
    const session = getSession(req);
    if (!session)
      return sendJson(res, 401, { error: "Authentication required." });
    if (!useFirestore)
      return sendJson(res, 503, { error: "User store unavailable." });

    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON body." });
    }

    const {
      quizId,
      quizTitle,
      score,
      totalQuestions,
      correctAnswers,
      percentage,
      topic,
    } = payload;
    if (
      !quizId ||
      !quizTitle ||
      score === undefined ||
      !totalQuestions ||
      correctAnswers === undefined ||
      percentage === undefined ||
      !topic
    ) {
      return sendJson(res, 400, {
        error:
          "Missing required fields: quizId, quizTitle, score, totalQuestions, correctAnswers, percentage, topic.",
      });
    }

    if (typeof score !== "number" || score < 0)
      return sendJson(res, 400, {
        error: "score must be a non-negative number.",
      });
    if (typeof totalQuestions !== "number" || totalQuestions < 1)
      return sendJson(res, 400, { error: "totalQuestions must be >= 1." });
    if (typeof correctAnswers !== "number" || correctAnswers < 0)
      return sendJson(res, 400, { error: "correctAnswers must be >= 0." });
    if (correctAnswers > totalQuestions)
      return sendJson(res, 400, {
        error: "correctAnswers cannot exceed totalQuestions.",
      });
    if (typeof percentage !== "number" || percentage < 0 || percentage > 100)
      return sendJson(res, 400, { error: "percentage must be 0-100." });

    try {
      const attemptId = crypto.randomUUID();
      const attempt = {
        quizId: String(quizId),
        quizTitle: String(quizTitle),
        score: Number(score),
        totalQuestions: Number(totalQuestions),
        correctAnswers: Number(correctAnswers),
        percentage: Number(percentage),
        topic: String(topic),
        completedAt: new Date().toISOString(),
      };

      await db
        .collection("users")
        .doc(session.sub)
        .collection("quizResults")
        .doc(attemptId)
        .set(attempt);

      return sendJson(res, 201, { success: true, attemptId, attempt });
    } catch (error) {
      console.error("Failed to save quiz result:", error);
      return sendJson(res, 500, { error: "Failed to save quiz result." });
    }
  }

  if (pathname === "/api/quiz-results" && req.method === "GET") {
    const session = getSession(req);
    if (!session)
      return sendJson(res, 401, { error: "Authentication required." });
    if (!useFirestore)
      return sendJson(res, 503, { error: "User store unavailable." });

    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const parsedLimit = parseInt(url.searchParams.get("limit") || "20", 10);
      const limit = Math.min(Number.isNaN(parsedLimit) ? 20 : parsedLimit, 100);
      const topic = url.searchParams.get("topic");

      let query = db
        .collection("users")
        .doc(session.sub)
        .collection("quizResults")
        .orderBy("completedAt", "desc")
        .limit(limit);

      if (topic) {
        query = query.where("topic", "==", topic);
      }

      const snapshot = await query.get();
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return sendJson(res, 200, {
        success: true,
        results,
        count: results.length,
      });
    } catch (error) {
      console.error("Failed to fetch quiz results:", error);
      return sendJson(res, 500, { error: "Failed to fetch quiz results." });
    }
  }

  if (pathname === "/api/reports/export/pdf" || pathname === "/api/reports/export/image") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Authentication required." });
    return await handleReportRequest(req, res, pathname, session);
  }

  if (pathname === "/api/user/benchmark" && req.method === "GET") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Authentication required." });
    
    try {
        const benchmark = await getUserBenchmark(session.sub);
        return sendJson(res, 200, { success: true, benchmark });
    } catch (err) {
        console.error("Benchmark error:", err);
        return sendJson(res, 500, { error: "Failed to generate benchmark." });
    }
  }

  // ── Problem Notes & Mnemonics endpoints ──────────────────────────────────
  if (pathname === "/api/problem-notes" && req.method === "GET") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });

    try {
      if (useFirestore) {
        const snap = await db.collection("users").doc(session.sub).collection("problemNotes").get();
        const notes = {};
        snap.forEach(doc => {
          notes[doc.id] = doc.data();
        });
        return sendJson(res, 200, { success: true, notes });
      } else {
        const users = await readUsers();
        const user = users.find(u => u.id === session.sub);
        return sendJson(res, 200, { success: true, notes: user?.problemNotes || {} });
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
      return sendJson(res, 500, { error: "Failed to fetch notes." });
    }
  }

  const notesMatch = pathname.match(/^\/api\/problem-notes\/([^/]+)$/);
  if (notesMatch && req.method === "PUT") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });

    const problemId = notesMatch[1];
    let payload;
    try { payload = await readJsonBody(req); } catch { return sendJson(res, 400, { error: "Invalid JSON." }); }

    const noteData = {
      topicKey: String(payload.topicKey || ""),
      problemId: parseInt(problemId) || 0,
      notes: String(payload.notes || ""),
      mnemonics: String(payload.mnemonics || ""),
      pitfalls: String(payload.pitfalls || ""),
      whenToUse: String(payload.whenToUse || ""),
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      updatedAt: new Date().toISOString()
    };

    try {
      if (useFirestore) {
        await db.collection("users").doc(session.sub).collection("problemNotes").doc(String(problemId)).set(noteData);
      } else {
        const users = await readUsers();
        const idx = users.findIndex(u => u.id === session.sub);
        if (idx !== -1) {
          if (!users[idx].problemNotes) users[idx].problemNotes = {};
          users[idx].problemNotes[problemId] = noteData;
          await writeUsers(users);
        }
      }
      return sendJson(res, 200, { success: true, note: noteData });
    } catch (err) {
      console.error("Error saving note:", err);
      return sendJson(res, 500, { error: "Failed to save note." });
    }
  }

  // ── Spaced Repetition Practice Problems endpoints ─────────────────────────
  if (pathname === "/api/spaced-repetition" && req.method === "GET") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });

    try {
      if (useFirestore) {
        const snap = await db.collection("users").doc(session.sub).collection("spacedRepetition").get();
        const cards = {};
        snap.forEach(doc => {
          cards[doc.id] = doc.data();
        });
        return sendJson(res, 200, { success: true, cards });
      } else {
        const users = await readUsers();
        const user = users.find(u => u.id === session.sub);
        return sendJson(res, 200, { success: true, cards: user?.spacedRepetition || {} });
      }
    } catch (err) {
      console.error("Error fetching spaced repetition cards:", err);
      return sendJson(res, 500, { error: "Failed to fetch spaced repetition cards." });
    }
  }

  const repMatch = pathname.match(/^\/api\/spaced-repetition\/([^/]+)$/);
  if (repMatch && req.method === "PUT") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });

    const problemId = repMatch[1];
    let payload;
    try { payload = await readJsonBody(req); } catch { return sendJson(res, 400, { error: "Invalid JSON." }); }

    const existing = payload.existing || { repetitions: 0, easeFactor: 2.5, interval: 0 };
    // parseInt() returns NaN (never undefined) for missing/non-numeric input,
    // so guard with Number.isInteger and fall back to the SM-2 default of 3,
    // clamped to the valid quality range (0-5) — otherwise applySM2 persists NaN.
    const parsedQuality = Number.parseInt(payload.quality, 10);
    const quality = Number.isInteger(parsedQuality)
      ? Math.max(0, Math.min(5, parsedQuality))
      : 3;
    const updated = applySM2(existing, quality);
    updated.problemId = parseInt(problemId) || 0;

    try {
      if (useFirestore) {
        await db.collection("users").doc(session.sub).collection("spacedRepetition").doc(String(problemId)).set(updated);
      } else {
        const users = await readUsers();
        const idx = users.findIndex(u => u.id === session.sub);
        if (idx !== -1) {
          if (!users[idx].spacedRepetition) users[idx].spacedRepetition = {};
          users[idx].spacedRepetition[problemId] = updated;
          await writeUsers(users);
        }
      }
      return sendJson(res, 200, { success: true, card: updated });
    } catch (err) {
      console.error("Error saving spaced repetition card:", err);
      return sendJson(res, 500, { error: "Failed to save spaced repetition card." });
    }
  }

  // ── Collaborative Study Rooms endpoints ──────────────────────────────────
  if (pathname === "/api/study-rooms" && req.method === "GET") {
    const roomsList = [];
    for (const [id, r] of studyRooms.entries()) {
      roomsList.push({
        id: r.id,
        hostName: r.hostName,
        status: r.status,
        topic: r.config.topic,
        difficulty: r.config.difficulty,
        timerDuration: r.config.timerDuration,
        maxParticipants: r.config.maxParticipants,
        participantsCount: Object.keys(r.participants).length
      });
    }
    return sendJson(res, 200, { rooms: roomsList });
  }

  if (pathname === "/api/study-rooms" && req.method === "POST") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });

    let body;
    try { body = await readJsonBody(req); } catch { body = {}; }

    const maxParticipants = Math.min(Math.max(parseInt(body.maxParticipants) || 4, 2), 8);
    const timerDuration = Math.min(Math.max(parseInt(body.timerDuration) || 600, 60), 1800);
    const difficulty = ["Easy", "Medium", "Hard"].includes(body.difficulty) ? body.difficulty : "Medium";
    const topic = body.topic || "arrays";

    const roomId = "ROOM-" + Math.floor(10000 + Math.random() * 90000);
    
    let hostName = "Host";
    const users = await readUsers();
    const hostUser = users.find(u => u.id === session.sub);
    if (hostUser) hostName = hostUser.name || hostUser.email;

    const newRoom = {
      id: roomId,
      hostId: session.sub,
      hostName: hostName,
      config: {
        maxParticipants,
        timerDuration,
        difficulty,
        topic,
        problems: []
      },
      status: "lobby",
      participants: {},
      currentProblem: null,
      timerSeconds: 0,
      timerInterval: null
    };

    studyRooms.set(roomId, newRoom);
    return sendJson(res, 201, { roomId, room: { id: roomId, hostName, status: "lobby" } });
  }

  if (pathname.startsWith("/api/study-rooms/") && pathname.endsWith("/results") && req.method === "POST") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });

    const match = pathname.match(/^\/api\/study-rooms\/([^/]+)\/results$/);
    if (!match) return sendJson(res, 400, { error: "Invalid path." });
    const roomId = match[1];

    let body;
    try { body = await readJsonBody(req); } catch { body = {}; }

    const { topic, difficulty, score = 50 } = body;

    try {
      if (useFirestore) {
        await db.collection("users").doc(session.sub).collection("studyRoomResults").add({
          roomId,
          topic,
          difficulty,
          score,
          completedAt: new Date().toISOString()
        });

        const userRef = db.collection("users").doc(session.sub);
        const userSnap = await userRef.get();
        if (userSnap.exists) {
          const curStreak = userSnap.data().streak || 0;
          await userRef.update({
            totalXp: FieldValue.increment(score),
            streak: curStreak + 1,
            lastActive: new Date().toISOString()
          });
        }
      } else {
        const users = await readUsers();
        const idx = users.findIndex(u => u.id === session.sub);
        if (idx !== -1) {
          users[idx].xp = (users[idx].xp || 0) + score;
          users[idx].streak = (users[idx].streak || 0) + 1;
          users[idx].lastActive = new Date().toISOString();
          await writeUsers(users);
        }
      }
      return sendJson(res, 200, { success: true, xpAwarded: score });
    } catch (err) {
      console.error("Error saving study room results:", err);
      return sendJson(res, 500, { error: "Failed to persist results." });
    }
  }

  // ── Battle routes ──────────────────────────────────────────────────────────
  // All battle routes require Firestore. If useFirestore is false (local dev
  // with no Firebase env vars), we return 503 rather than crashing.
  // All routes require an active session — unauthenticated requests get 401.
 
  if (pathname === "/api/battles" && req.method === "POST") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });
    if (!useFirestore) return sendJson(res, 503, { error: "Battle mode requires Firestore." });
 
    try {
      const { opponentEmail, difficulty } = await readJsonBody(req);
      if (!opponentEmail?.trim()) {
        return sendJson(res, 400, { error: "opponentEmail is required." });
      }
      if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
        return sendJson(res, 400, { error: "difficulty must be Easy, Medium, or Hard." });
      }
      const battleId = await createBattle(session.sub, opponentEmail.trim(), difficulty);
      return sendJson(res, 201, { battleId });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }
 
  // GET /api/battles/history  — must be declared BEFORE the :id pattern below
  // or "history" gets captured as a battle ID.
  if (pathname === "/api/battles/history" && req.method === "GET") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });
    if (!useFirestore) return sendJson(res, 503, { error: "Battle mode requires Firestore." });
 
    try {
      const params = new URL(req.url, `http://${req.headers.host}`).searchParams;
      const limit      = Math.min(parseInt(params.get("limit") || "20", 10), 50);
      const startAfter = params.get("cursor") || null;
      const history = await getHistory(session.sub, limit, startAfter);
      return sendJson(res, 200, {
        history,
        nextCursor: history.length === limit ? history[history.length - 1].id : null,
      });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }
 
  // Dynamic battle routes: /api/battles/:id and /api/battles/:id/(join|submit|result)
  const battleMatch = pathname.match(
    /^\/api\/battles\/([^/]+?)(?:\/(join|submit|result))?$/
  );
 
  if (battleMatch) {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });
    if (!useFirestore) return sendJson(res, 503, { error: "Battle mode requires Firestore." });
 
    const [, battleId, action] = battleMatch;
 
    // GET /api/battles/:id — poll endpoint, returns state + timeRemainingMs
    if (!action && req.method === "GET") {
      try {
        const battle = await getBattle(battleId);
        return sendJson(res, 200, battle);
      } catch (err) {
        return sendJson(res, 404, { error: err.message });
      }
    }
 
    // POST /api/battles/:id/join
    if (action === "join" && req.method === "POST") {
      try {
        const result = await joinBattle(battleId, session.sub);
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }
 
    // POST /api/battles/:id/submit
    if (action === "submit" && req.method === "POST") {
      try {
        const { code } = await readJsonBody(req);
        if (!code?.trim()) {
          return sendJson(res, 400, { error: "code is required." });
        }
        const result = await submitSolution(battleId, session.sub, code);
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }
 
    // GET /api/battles/:id/result
    if (action === "result" && req.method === "GET") {
      try {
        const battle = await getBattle(battleId);
        if (!["completed", "expired"].includes(battle.status)) {
          return sendJson(res, 409, { error: "Battle is not finished yet." });
        }
        return sendJson(res, 200, {
          winner:     battle.winner,
          xpAwarded:  battle.xpAwarded,
          status:     battle.status,
        });
      } catch (err) {
        return sendJson(res, 404, { error: err.message });
      }
    }
  }
  // ── End battle routes ─────

  if (pathname === "/api/verify-email" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    if (!token) return sendJson(res, 400, { error: "Missing token." });

    const users = await readUsers();
    const idx = users.findIndex(
      (u) => u.verifyToken === token && u.verifyTokenExpiry > Date.now()
    );
    if (idx === -1) return sendJson(res, 400, { error: "Link is invalid or expired." });

    users[idx].emailVerified = true;
    users[idx].verifyToken = null;
    users[idx].verifyTokenExpiry = null;
    await writeUsers(users);

    const sessionToken = createAccessToken(users[idx]);
    const refreshToken = createRefreshToken(users[idx]);
    res.setHeader("Set-Cookie", authCookies(sessionToken, refreshToken, req));
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === "/api/resend-verification" && req.method === "POST") {
    if (!applyRateLimit(req, res, resendVerificationLimiter, "Too many verification requests. Please try again later.")) {
      return;
    }
    const body = await readJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) return sendJson(res, 400, { error: "Email required." });

    const users = await readUsers();
    const idx = users.findIndex((u) => u.email === email);
    if (idx === -1 || users[idx].emailVerified) return sendJson(res, 200, { ok: true });

    const newToken = crypto.randomBytes(32).toString("hex");
    users[idx].verifyToken = newToken;
    users[idx].verifyTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
    await writeUsers(users);

    sendVerificationEmail(email, users[idx].name, newToken).catch((err) =>
      console.error("[email] Resend failed:", err)
    );
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === "/api/predict-acceptance" && req.method === "POST") {
    if (!applyRateLimit(req, res, predictionLimiter, "Too many prediction requests. Please try again later.")) {
      return;
    }
    let payload;
    try {
      payload = await readJsonBody(req);
    } catch (err) {
      const tooLarge = err?.message === "Request body is too large.";
      return sendJson(res, tooLarge ? 413 : 400, {
        success: false,
        error: tooLarge ? "Request body is too large." : "Invalid JSON body.",
      });
    }

    const { code, language, problemId } = payload;
    if (
      typeof code !== "string" ||
      !code.trim() ||
      typeof language !== "string" ||
      !language.trim() ||
      !String(problemId ?? "").trim()
    ) {
      return sendJson(res, 400, {
        success: false,
        error: "Code, language, and problemId are required",
      });
    }

    try {
      const analysis = analyzeCode(code, language, problemId);
      return sendJson(res, 200, { success: true, data: analysis });
    } catch (error) {
      console.error("Error predicting acceptance:", error);
      return sendJson(res, 500, { success: false, error: error.message });
    }
  }

  // ── Execution History Endpoints ─────────────────────────────────────────

  if (pathname === "/api/executions" && req.method === "GET") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });

    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const language = url.searchParams.get("language");
      const dateFrom = url.searchParams.get("from");
      const dateTo = url.searchParams.get("to");
      const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);

      const all = await readExecutions();
      let list = all.filter(e => e.userId === session.sub);

      if (language) {
        list = list.filter(e => e.language?.toLowerCase() === language.toLowerCase());
      }
      if (dateFrom) {
        const from = new Date(dateFrom);
        list = list.filter(e => new Date(e.createdAt) >= from);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        list = list.filter(e => new Date(e.createdAt) <= to);
      }

      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      list = list.slice(0, limit);

      const summary = list.map(e => ({
        id: e.id,
        language: e.language,
        exitCode: e.exitCode,
        error: !!e.error,
        createdAt: e.createdAt,
        cpuTime: e.cpuTime,
        preview: (e.originalCode || e.sourceCode || '').slice(0, 120),
        hasSnapshots: Array.isArray(e.variableSnapshots) && e.variableSnapshots.length > 0
      }));

      return sendJson(res, 200, { executions: summary, total: all.filter(e => e.userId === session.sub).length });
    } catch (err) {
      console.error("Error fetching executions:", err);
      return sendJson(res, 500, { error: "Failed to fetch execution history." });
    }
  }

  if (pathname.startsWith("/api/executions/") && req.method === "GET") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });

    const execId = pathname.slice("/api/executions/".length);
    if (!execId) return sendJson(res, 400, { error: "Missing execution ID." });

    try {
      const all = await readExecutions();
      const execution = all.find(e => e.id === execId && e.userId === session.sub);
      if (!execution) return sendJson(res, 404, { error: "Execution not found." });

      return sendJson(res, 200, { execution });
    } catch (err) {
      console.error("Error fetching execution:", err);
      return sendJson(res, 500, { error: "Failed to fetch execution." });
    }
  }

  if (pathname.startsWith("/api/executions/") && req.method === "POST" && pathname.endsWith("/snapshots")) {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Login required." });

    const execId = pathname.split("/")[3];
    if (!execId) return sendJson(res, 400, { error: "Missing execution ID." });

    try {
      const payload = await readJsonBody(req);
      const snapshots = payload.snapshots;
      if (!Array.isArray(snapshots)) return sendJson(res, 400, { error: "Snapshots must be an array." });

      await updateExecutionStore((store) => {
        const idx = store.findIndex(e => e.id === execId && e.userId === session.sub);
        if (idx !== -1) {
          store[idx].variableSnapshots = snapshots;
        }
      });

      return sendJson(res, 200, { success: true });
    } catch (err) {
      console.error("Error saving snapshots:", err);
      return sendJson(res, 500, { error: "Failed to save snapshots." });
    }
  }

  // ── Leaderboard ──────────────────────────────────────────────────────────
  if (pathname === "/api/leaderboard" && req.method === "GET") {
    try {
      let leaders = [];
      if (useFirestore) {
        const usersSnap = await db.collection("users").get();
        leaders = usersSnap.docs.map(doc => {
          const d = doc.data();
          return { id: doc.id, name: d.name || "Learner", xp: d.xp || 0, level: d.level || 1, avatar: d.avatar || "🚀" };
        });
      } else {
        const users = await readUsers();
        leaders = users.map(u => ({
          id: u.id || u.email,
          name: u.name || "Learner",
          xp: u.xp || 0,
          level: u.level || 1,
          avatar: u.avatar || "🚀"
        }));
      }
      const session = getSession(req);
      return sendJson(res, 200, { leaders, currentUserId: session?.sub || null });
    } catch (err) {
      console.error("Leaderboard error:", err);
      return sendJson(res, 200, { leaders: [], currentUserId: null });
    }
  }

  // ── User Progress Sync ───────────────────────────────────────────────────
  if (pathname === "/api/progress" && req.method === "PUT") {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: "Authentication required." });
    try {
      const body = await readJsonBody(req);
      if (useFirestore) {
         await db.collection("users").doc(session.sub).set({
           name: body.name,
           xp: body.xp || 0,
           level: body.level || 1,
           avatar: body.avatar || "🚀",
           activityData: body.activityData || {},
           updatedAt: new Date().toISOString()
         }, { merge: true });
      } else {
        const users = await readUsers();
        const idx = users.findIndex(u => u.id === session.sub || u.email === session.email);
         if (idx !== -1) {
           users[idx].name = body.name;
           users[idx].xp = body.xp || 0;
           users[idx].level = body.level || 1;
           users[idx].avatar = body.avatar || "🚀";
           if (body.activityData) users[idx].activityData = body.activityData;
         } else {
           users.push({
             id: session.sub,
             email: session.email,
             name: body.name,
             xp: body.xp || 0,
             level: body.level || 1,
             avatar: body.avatar || "🚀",
             activityData: body.activityData || {}
           });
         }
        await writeUsers(users);
      }
      return sendJson(res, 200, { success: true });
    } catch (err) {
      console.error("Progress sync error:", err);
      return sendJson(res, 200, { success: false });
    }
  }

  return sendJson(res, 404, { error: "Not found." });
}

function resolveStaticPath(pathname) {
const routes = {
  "/": "index.html",
  "/login": "pages/auth/login.html",
  "/login.html": "pages/auth/login.html",
  "/profile": "pages/profile/public-profile.html",
  "/signup": "pages/auth/signup.html",
  "/signup.html": "pages/auth/signup.html",
  "/verify-email": "pages/auth/verify-email.html",
  "/verify-email.html": "pages/auth/verify-email.html",
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
    (rel.startsWith("data" + path.sep) && !fileName.endsWith(".js")) ||
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

    // ── Server-side auth gate ────────────────────────────────────────────────
    // A page may declare that it requires authentication with
    // <meta name="auth-required" content="true">. Enforce it here so access is
    // controlled by the server regardless of which URL reached the file — the
    // client-side gate (auth-gate.js) is cosmetic only. Read the HTML once and
    // reuse it below to avoid a second read.
    let htmlContent = null;
    if (ext === ".html") {
      htmlContent = await fs.readFile(target, "utf-8");
      const requiresAuth =
        /<meta\b(?=[^>]*\sname\s*=\s*["']auth-required["'])(?=[^>]*\scontent\s*=\s*["']true["'])[^>]*>/i.test(htmlContent);
      if (requiresAuth && !getSession(req)) {
        return redirect(res, `/login?next=${encodeURIComponent(pathname)}`);
      }
    }

    // ETag generation based on file size and mtime
    const mtimeMs = fileStat.mtime.getTime();
    const size = fileStat.size;
    const etag = `W/"${size}-${mtimeMs}"`;
    const cacheControl = getCacheControlHeader(ext);

    const headers = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
      "Cache-Control": cacheControl,
      "ETag": etag,
    };

    // Handle If-None-Match conditional request
    const clientEtag = req.headers["if-none-match"];
    if (clientEtag === etag) {
      headers["Content-Type"] = mimeTypes[ext] || "application/octet-stream";
      res.writeHead(304, headers);
      return res.end();
    }

    let content;

    if (ext === ".html") {
      // Generate a dynamic nonce for CSP script elements
      const nonce = crypto.randomBytes(16).toString("base64");

      // Inject nonce into script tags in the HTML content (htmlContent was read
      // by the auth gate above).
      const htmlStr = htmlContent.replace(/<script(\s|>)/gi, `<script nonce="${nonce}"$1`);
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
    } else {
      content = await fs.readFile(target);
    }

    headers["Content-Type"] = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, headers);
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

async function requestHandler(req, res) {
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
      return redirect(res, "/login", { "Set-Cookie": clearAuthCookies() });
    }

    const authorization = authorizeRequest(req, pathname);

    if (!authorization.authorized) {
      return redirect(res, authorization.redirectTo);
    }

    return await serveStatic(req, res, pathname);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Something went wrong." });
  }
}

const server = http.createServer(requestHandler);

// ===== CODE ANALYSIS ENGINE =====
// Used by the POST /api/predict-acceptance route in handleApi().
function analyzeCode(code, language, problemId) {
    let score = 100;
    const risks = [];
    const suggestions = [];
    const edgeCases = [];

    // 1. Check for Time Complexity risks
    const complexityCheck = checkTimeComplexity(code);
    if (complexityCheck.risky) {
        score -= 20;
        risks.push('⚠️ Possible TLE: ' + complexityCheck.reason);
        suggestions.push('Optimize algorithm to reduce time complexity');
    }

    // 2. Check for Overflow risks
    if (checkOverflowRisk(code)) {
        score -= 15;
        risks.push('⚠️ Possible integer overflow');
        suggestions.push('Use long long or BigInt for large numbers');
    }

    // 3. Check for Edge Cases
    const edgeCaseCheck = checkEdgeCases(code);
    if (edgeCaseCheck.missing.length > 0) {
        score -= 10;
        edgeCases.push(...edgeCaseCheck.missing);
        suggestions.push('Handle edge cases: ' + edgeCaseCheck.missing.join(', '));
    }

    // 4. Check for Syntax errors
    if (checkSyntaxErrors(code, language)) {
        score -= 25;
        risks.push('❌ Syntax errors detected');
        suggestions.push('Fix syntax errors before submitting');
    }

    // 5. Check for missing imports
    if (checkMissingImports(code, language)) {
        score -= 10;
        risks.push('⚠️ Missing required imports');
        suggestions.push('Add necessary imports');
    }

    // 6. Check for unused variables
    if (hasUnusedVariables(code)) {
        score -= 5;
        suggestions.push('Remove unused variables for cleaner code');
    }

    // 7. Check for hardcoded values
    if (hasHardcodedValues(code)) {
        score -= 5;
        suggestions.push('Avoid hardcoded values, use variables');
    }

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    return {
        acceptanceProbability: score,
        riskLevel: score >= 80 ? 'Low' : score >= 60 ? 'Medium' : 'High',
        risks: risks,
        edgeCases: edgeCases,
        suggestions: suggestions,
        summary: getSummary(score)
    };
}

// ===== HELPER FUNCTIONS =====

function checkTimeComplexity(code) {
    // Detect nested loops
    const nestedLoops = (code.match(/for/g) || []).length > 1;
    if (nestedLoops) {
        return { risky: true, reason: 'Nested loops detected (O(n²) or worse)' };
    }
    
    // Detect recursion without memoization
    if (code.includes('function') && code.includes('return') && code.includes('(')) {
        if (code.includes('fibonacci') || code.includes('factorial')) {
            return { risky: true, reason: 'Recursion without memoization may cause TLE' };
        }
    }
    
    return { risky: false };
}

function checkOverflowRisk(code) {
    const intTypes = ['int', 'long', 'number'];
    const largeOperations = ['*', '+', '-', '/'];
    
    for (const type of intTypes) {
        if (code.includes(type) && code.includes('*')) {
            return true;
        }
    }
    return false;
}

function checkEdgeCases(code) {
    const missing = [];
    
    if (!code.includes('null') && !code.includes('undefined')) {
        missing.push('Null/undefined inputs');
    }
    if (!code.includes('length') && !code.includes('size')) {
        missing.push('Empty input');
    }
    if (!code.includes('max') && !code.includes('min')) {
        missing.push('Extreme values');
    }
    
    return { missing };
}

function checkSyntaxErrors(code, language) {
    // Basic syntax check
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    
    return openBraces !== closeBraces || openParens !== closeParens;
}

function checkMissingImports(code, language) {
    const imports = ['import', 'require', 'include', '#include'];
    const hasImport = imports.some(i => code.includes(i));
    return !hasImport;
}

function hasUnusedVariables(code) {
    const vars = code.match(/let\s+(\w+)|const\s+(\w+)|var\s+(\w+)/g);
    if (!vars) return false;
    
    for (const v of vars) {
        const name = v.replace(/let |const |var /g, '');
        if (code.split(name).length <= 2) {
            return true;
        }
    }
    return false;
}

function hasHardcodedValues(code) {
    const numbers = code.match(/\b\d{2,}\b/g);
    return numbers && numbers.length > 3;
}

function getSummary(score) {
    if (score >= 80) return '✅ High chance of acceptance. Good to submit!';
    if (score >= 60) return '⚠️ Moderate chance. Consider improving your solution.';
    return '❌ Low chance. Review the suggestions before submitting.';
}

// --- PHASE 1 ADDITION: SOCKET.IO LOGIC ---
const io = new SocketIOServer(server);

function serializeRoom(room) {
  return {
    id: room.id,
    hostId: room.hostId,
    hostName: room.hostName,
    config: room.config,
    status: room.status,
    participants: room.participants,
    currentProblem: room.currentProblem,
    timerSeconds: room.timerSeconds
  };
}

function cleanupStudyUser(socket, roomId, userId) {
  const room = studyRooms.get(roomId);
  if (!room) return;

  delete room.participants[userId];
  socket.leave(roomId);

  const remainingCount = Object.keys(room.participants).length;
  if (remainingCount === 0) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    studyRooms.delete(roomId);
    console.log(`🗑️ Study room ${roomId} deleted (empty)`);
  } else {
    if (room.hostId === userId) {
      const nextHostId = Object.keys(room.participants)[0];
      room.hostId = nextHostId;
      room.hostName = room.participants[nextHostId].name;
      console.log(`👑 Host transferred to ${room.hostName} in room ${roomId}`);
    }
    io.to(roomId).emit("study-room-updated", serializeRoom(room));
  }
}

io.on("connection", (socket) => {
console.log("🟢 New client connected:", socket.id);




// ==========================================
// AI INTERVIEWER - GEMINI API INTEGRATION
// ==========================================
socket.on('ai-evaluate-code', async (data = {}) => {
    // Bot Fix 1: Validate payload first
    if (typeof data !== 'object' || typeof data.code !== 'string' || typeof data.language !== 'string' || typeof data.problem !== 'string') {
        return socket.emit('ai-interviewer-feedback', { hint: 'Unable to analyze code right now.' });
    }

    console.log(`🤖 AI Interviewer analyzing code...`);
    
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            socket.emit('ai-interviewer-feedback', { hint: "Backend Error: GEMINI_API_KEY is missing in .env!" });
            return;
        }

        // The Real Gemini Prompt
        const prompt = `You are an expert FAANG technical interviewer. A candidate is solving the "${data.problem}" problem in ${data.language}.
        Here is their current code:
        
        ${data.code}
        
        Your task: Give a short, strategic hint (max 2-3 sentences) to guide them. 
        CRITICAL RULES:
        1. Do NOT give the exact code solution. 
        2. Focus on time/space complexity, pointing out edge cases, or spotting logical flaws.
        3. Keep the tone encouraging, professional, and directly address the logic in their code.`;

        // Real API Call to Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const result = await response.json();
        
        if (result.candidates && result.candidates.length > 0) {
            let aiHint = result.candidates[0].content.parts[0].text;
            aiHint = aiHint.replace(/\*/g, '').replace(/\`/g, ''); // Clean markdown
            socket.emit('ai-interviewer-feedback', { hint: aiHint });
        } else {
            socket.emit('ai-interviewer-feedback', { hint: "Hmm, your logic is interesting... keep going!" });
        }
        
    } catch (error) {
        console.error("Gemini API Error:", error);
        socket.emit('ai-interviewer-feedback', { hint: "My AI brain is taking a break. Keep coding!" });
    }
});

// Socket input validation helper
const MAX_PAYLOAD_SIZE = 100 * 1024;
const MAX_TEXT_LENGTH = 10000;

function validateSocketInput(data, schema) {
  if (!data || typeof data !== 'object') return null;
  if (JSON.stringify(data).length > MAX_PAYLOAD_SIZE) return null;
  const result = {};
  for (const [key, rules] of Object.entries(schema)) {
    if (rules.required && !(key in data)) return null;
    if (key in data) {
      let val = data[key];
      if (rules.type && (val === null || typeof val !== rules.type)) return null;
      if (rules.string && typeof val === 'string') {
        val = val.slice(0, rules.maxLength || MAX_TEXT_LENGTH);
        val = val.replace(/[\x00-\x1F\x7F]/g, '');
      }
      result[key] = val;
    }
  }
  return result;
}

// Draw events (whiteboard)
socket.on('draw', (data) => {
  const valid = validateSocketInput(data, {
    roomId: { type: 'string', required: true },
    imageData: { type: 'string', string: true }
  });
  if (!valid) return;
  socket.to(valid.roomId).emit('receive-draw', valid);
});

// Clear board
socket.on('clear-board', (data) => {
  const valid = validateSocketInput(data, {
    roomId: { type: 'string', required: true }
  });
  if (!valid) return;
  socket.to(valid.roomId).emit('receive-clear');
});

// Shared notes
socket.on('share-notes', (data) => {
  const valid = validateSocketInput(data, {
    roomId: { type: 'string', required: true },
    text: { type: 'string', string: true, maxLength: MAX_TEXT_LENGTH }
  });
  if (!valid) return;
  socket.to(valid.roomId).emit('receive-notes', valid.text);
});

// Chat messages
socket.on('chat-message', (data) => {
  const valid = validateSocketInput(data, {
    roomId: { type: 'string', required: true },
    userName: { type: 'string', string: true },
    text: { type: 'string', string: true, maxLength: MAX_TEXT_LENGTH }
  });
  if (!valid) return;
  socket.to(valid.roomId).emit('chat-message', valid);
});

// ── VOICE CHAT (WebRTC signaling) ──

socket.on('voice-join', (data) => {
  const valid = validateSocketInput(data, {
    roomId: { type: 'string', required: true },
    userId: { type: 'string', string: true }
  });
  if (!valid) return;
  socket.to(valid.roomId).emit('voice-user-joined', { userId: valid.userId });
});

socket.on('voice-leave', (data) => {
  const valid = validateSocketInput(data, {
    roomId: { type: 'string', required: true },
    userId: { type: 'string', string: true }
  });
  if (!valid) return;
  socket.to(valid.roomId).emit('voice-user-left', { userId: valid.userId });
});

// WebRTC offer
socket.on('voice-offer', (data) => {
  const valid = validateSocketInput(data, {
    roomId: { type: 'string', required: true },
    offer: { type: 'object', required: true },
    to: { type: 'string', required: true },
    from: { type: 'string', string: true }
  });
  if (!valid) return;
  const targetSocketId = userSocketMap.get(valid.to);
  if (targetSocketId) io.to(targetSocketId).emit('voice-offer', { offer: valid.offer, from: valid.from });
});

socket.on('voice-answer', (data) => {
  const valid = validateSocketInput(data, {
    roomId: { type: 'string', required: true },
    answer: { type: 'object', required: true },
    to: { type: 'string', required: true },
    from: { type: 'string', string: true }
  });
  if (!valid) return;
  const targetSocketId = userSocketMap.get(valid.to);
  if (targetSocketId) io.to(targetSocketId).emit('voice-answer', { answer: valid.answer, from: valid.from });
});

socket.on('voice-ice', (data) => {
  const valid = validateSocketInput(data, {
    roomId: { type: 'string', required: true },
    candidate: { type: 'object', required: true },
    to: { type: 'string', required: true },
    from: { type: 'string', string: true }
  });
  if (!valid) return;
  const targetSocketId = userSocketMap.get(valid.to);
  if (targetSocketId) io.to(targetSocketId).emit('voice-ice', { candidate: valid.candidate, from: valid.from });
});

// ── END OF ADDITIONS ──


  // ── COLLABORATIVE STUDY ROOM EVENTS ──
  socket.on("join-study-room", async ({ roomId, userId, userName }) => {
    const session = getSession(socket.request);
    const authUserId = session ? session.sub : userId;
    const authUserName = session ? session.name : userName;

    socket.join(roomId);
    socket.userId = authUserId;
    socket.studyRoomId = roomId;
    socket.userName = authUserName;

    let room = studyRooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        hostId: authUserId,
        hostName: authUserName,
        config: { maxParticipants: 4, timerDuration: 600, difficulty: "Medium", topic: "arrays", problems: [] },
        status: "lobby",
        participants: {},
        currentProblem: null,
        timerSeconds: 0,
        timerInterval: null
      };
      studyRooms.set(roomId, room);
    }

    if (!room.participants[authUserId]) {
      room.participants[authUserId] = { 
        id: authUserId,
        name: authUserName,
        status: room.status === "playing" ? "solving" : "lobby",
        score: 0,
        timeTaken: null,
        submittedCode: ""
      };
    }

    console.log(`👥 Study room: User ${authUserName} joined room ${roomId}`);
    io.to(roomId).emit("study-room-updated", serializeRoom(room));
  });

  socket.on("start-study-round", ({ roomId, problem }) => {
    const room = studyRooms.get(roomId);
    if (!room) return;
    if (socket.userId !== room.hostId) {
      socket.emit('error', { message: 'Only host can start the study round' });
      return;
    }

    room.status = "playing";
    room.currentProblem = problem;
    room.timerSeconds = room.config.timerDuration;
    
    for (const pid in room.participants) {
      room.participants[pid].status = "solving";
      room.participants[pid].timeTaken = null;
      room.participants[pid].submittedCode = "";
      room.participants[pid].score = 0;
    }

    io.to(roomId).emit("study-round-started", {
      problem,
      timerDuration: room.config.timerDuration,
      roomState: serializeRoom(room)
    });

    if (room.timerInterval) clearInterval(room.timerInterval);
    room.timerInterval = setInterval(() => {
      room.timerSeconds--;
      io.to(roomId).emit("study-timer-tick", { timerSeconds: room.timerSeconds });

      if (room.timerSeconds <= 0) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
        room.status = "recap";
        io.to(roomId).emit("study-round-ended", serializeRoom(room));
      }
    }, 1000);
  });

  socket.on("submit-study-solution", ({ roomId, userId, code, timeTaken, success }) => {
    const room = studyRooms.get(roomId);
    if (!room) return;

    const participant = room.participants[userId];
    if (participant) {
      participant.status = "completed";
      participant.submittedCode = code;
      participant.timeTaken = timeTaken;
      participant.score = success ? Math.max(10, Math.floor(room.timerSeconds / 10)) : 0;
    }

    const allDone = Object.values(room.participants).every(p => p.status === "completed");
    if (allDone) {
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }
      room.status = "recap";
      io.to(roomId).emit("study-round-ended", serializeRoom(room));
    } else {
      io.to(roomId).emit("study-room-updated", serializeRoom(room));
    }
  });

  socket.on("leave-study-room", ({ roomId, userId }) => {
    cleanupStudyUser(socket, roomId, userId);
  });

  socket.on("study-chat-message", ({ roomId, userName, text }) => {
    io.to(roomId).emit("receive-study-chat", { userName, text });
  });

  socket.on("join-room", (roomId, userId) => {
      socket.join(roomId);
      // Store user mapping
    userSocketMap.set(userId, socket.id);
    socket.userId = userId;
    socket.roomId = roomId;
     console.log(`👥 User ${userId} joined Room ${roomId}`);
      
      socket.to(roomId).emit("user-connected", userId);

      socket.on("disconnect", () => {
    if (socket.userId) {
        userSocketMap.delete(socket.userId);
        if (socket.roomId) {
            socket.to(socket.roomId).emit("user-disconnected", socket.userId);
        }
    }
    if (socket.studyRoomId && socket.userId) {
        cleanupStudyUser(socket, socket.studyRoomId, socket.userId);
    }
});
  });
});
// -----------------------------------------

export { server, requestHandler, hashPassword, passwordMatches, applySM2, validateSignup, updateMemoryStore, readMemoryStore, appendToJsonArrayFile };

if (process.env.VERCEL === "1") {
  db = initializeFirebase();
  useFirestore = !!db;
  if (!process.env.SESSION_SECRET) {
    throw new Error("FATAL: SESSION_SECRET is required on Vercel. Set it in the Vercel dashboard under Project Settings > Environment Variables.");
  }
}

const vercelHandler = process.env.VERCEL === "1"
  ? async (req, res) => requestHandler(req, res)
  : undefined;

export default vercelHandler;



if (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "test") {
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

      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.error(`\n❌ Port ${port} is already in use.`);
          console.error(`   Stop the existing server first, then run: npm run dev\n`);
          process.exit(1);
        } else {
          throw err;
        }
      });
    })
    .catch((error) => {
      console.error("Failed to load environment configuration:", error);
      process.exit(1);
    });
  }