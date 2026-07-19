import { startTelemetry } from './backend/utils/telemetry.js';
startTelemetry();
import { setupWebRTCSignaling } from './backend/services/webrtc.service.js';
import crypto from 'crypto';
import fs from 'fs/promises';
import http from 'http';
import express from 'express';
import apiRouter from './backend/routes/api.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { verifyCsrfToken } from './utils/csrf-verify.js';
import { validateEnv } from './utils/envValidator.js';
import multer from 'multer';
import { extractResumeText } from './backend/resume-analyzer/parser.js';
import { calculateATS } from './backend/resume-analyzer/atsScore.js';
import { findMissingSkills } from './backend/resume-analyzer/skills.js';
import { getSuggestions } from './backend/resume-analyzer/suggestions.js';
import { analyzeWorkflow } from './backend/repository-analyzer/cicdValidator.js';
import { VCSFactory } from './backend/vcs/VCSFactory.js';
import {
  enqueueBulkAudit,
  getBatchProgress,
  MAX_BULK_AUDIT_URLS,
  getReportStatus,
} from './backend/jobs/queue.js';
import './backend/jobs/worker.js'; // Initialize worker

import { parse as csvParse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import { generateSdlcAdvice } from './sdlcAdvisor.js';
import lockfile from 'proper-lockfile';
import { fileTypeFromBuffer } from 'file-type';

import { handleReportRequest } from './backend/reports/reportGenerator.js';
import { getBenchmark as getUserBenchmark } from './backend/benchmarking/percentileService.js';
import { Server as SocketIOServer } from 'socket.io';
import {
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  getClientIdentifier,
  normalizeAuthDelay,
  createAccessToken,
  verifyAccessToken,
  hashPassword,
  passwordMatches,
  validateSignup,
  createRefreshToken,
  verifyRefreshToken,
  revokeTokenFamily,
} from './backend/services/auth.service.js';
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
  logErrorLimiter,
  aiHintLimiter,
} from './backend/utils/rateLimiter.js';
import { generateAIHint } from './backend/services/aiHint.service.js';
import { applySM2 } from './backend/services/memory.service.js';
import { sendVerificationEmail } from './backend/services/email.service.js';
import { TEST_CASES, runDetailedTestCases } from './pages/Dsa-Battle/Battleservice.js';

// import { instrumentJS } from './modules/code-tracer.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).single('resume');
const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
}).single('csv');

async function validateMagicBytes(buffer, mimeType) {
  if (!buffer) return false;
  const fileType = await fileTypeFromBuffer(buffer);
  if (!fileType) return false;

  if (mimeType === 'application/pdf') {
    return fileType.mime === 'application/pdf';
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return fileType.ext === 'docx' || fileType.ext === 'zip';
  }
  if (mimeType === 'application/msword') {
    return (
      fileType.ext === 'cfb' || fileType.mime === 'application/x-cfb' || fileType.ext === 'doc'
    );
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
const PAGE_404 = path.join(ROOT, '404.html');
const IS_VERCEL = process.env.VERCEL === '1';
const DATA_DIR = IS_VERCEL ? path.join('/tmp', 'algo-infinity-verse') : path.join(ROOT, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MEMORY_FILE = path.join(DATA_DIR, 'memory.json');
const TEAM_PROFILES_FILE = path.join(DATA_DIR, 'team_profiles.json');
const ROADMAPS_FILE = path.join(DATA_DIR, 'roadmaps.json');
const AUDITS_FILE = path.join(DATA_DIR, 'audits_history.json');
const EXECUTIONS_FILE = path.join(DATA_DIR, 'executions.json');
const CLIENT_ERRORS_FILE = path.join(DATA_DIR, 'client_errors.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');
const INTERVIEW_EXPERIENCES_FILE = path.join(DATA_DIR, 'interview-experiences.json');
const QUIZ_RESULTS_FILE = path.join(DATA_DIR, 'quiz_results.json');
const STUDY_ROOM_RESULTS_FILE = path.join(DATA_DIR, 'study_room_results.json');

// Caps for append-only JSON logs so they can never grow unbounded on disk.
const MAX_CLIENT_ERROR_ENTRIES = 1000;
const MAX_FEEDBACK_ENTRIES = 5000;
const MAX_INTERVIEW_EXPERIENCE_ENTRIES = 5000;
const MAX_AUDIT_HISTORY_ENTRIES = 1000;
const MAX_EXECUTIONS_ENTRIES = 5000;
const SESSION_COOKIE = 'aiv_session';
const REFRESH_COOKIE = 'aiv_refresh';

const DELETION_LOG_FILE = path.join(DATA_DIR, 'account-deletions.json');
// ────────────────────────────────────────────────────────────────────────────

const protectedPaths = new Set([
  '/community',
  '/community.html',
  '/support-page',
  '/support-page/',
  '/support-page/index.html',
]);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.php': 'text/html; charset=utf-8',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

async function loadEnvFile() {
  const envPath = path.join(ROOT, '.env');
  try {
    const raw = await fs.readFile(envPath, 'utf8');
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const separatorIndex = trimmed.indexOf('=');
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
    if (error.code !== 'ENOENT') throw error;
  }
}

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((cookies, part) => {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (!rawName) return cookies;
    cookies[rawName] = decodeURIComponent(rawValue.join('='));
    return cookies;
  }, {});
}

function getRefreshToken(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies[REFRESH_COOKIE] || null;
}

// Builds the Set-Cookie header value(s) for an authenticated response. Returns
// an array of two cookies: the short-lived access token (read by getSession)
// and the long-lived refresh token (read by getRefreshToken on /api/refresh).
// Previously this set only the access cookie, so the aiv_refresh cookie was
// never issued and silent token refresh could never succeed (#1225).
function authCookies(accessToken, refreshToken, req) {
  // Don't rely solely on x-forwarded-proto: some deploy targets' proxies
  // don't forward it, which would leave session cookies without Secure over
  // HTTPS. Always require it in production regardless of that header (#2358).
  const secure =
    process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
  // Use SameSite=None so the refresh cookie is sent on cross-site fetches
  // (e.g. preview deployments) while remaining HttpOnly.
  const cookie = (name, value, maxAge) =>
    [
      `${name}=${encodeURIComponent(value)}`,
      'HttpOnly',
      'SameSite=None',
      'Path=/',
      `Max-Age=${maxAge}`,
      // SameSite=None requires Secure in modern browsers.
      secure ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; ');

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

async function getUserByEmail(email) {
  const users = await readUsers();
  return users.find((u) => u.email === email) || null;
}

let userWriteQueue = Promise.resolve();

async function createUser(userData) {
  const task = userWriteQueue.then(async () => {
    const users = await readUsers();
    users.push(userData);
    await writeUsers(users);
    return userData;
  });
  userWriteQueue = task.catch((err) => {
    console.error('[createUser] Write task failed:', err);
  });
  return task;
}

async function ensureUserStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, '[]\n');
    }
  } catch (err) {
    console.error('[ensureUserStore] Failed to initialize user store:', err);
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
    const raw = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(raw || '[]');
    memoryUserStore.clear();
    users.forEach((u) => memoryUserStore.set(u.email, u));
    userCacheTimestamp = stat.mtimeMs;
    userCacheDirty = false;
    return users;
  } catch (err) {
    console.error('[readUsers] Failed to read users:', err);
    return Array.from(memoryUserStore.values());
  }
}

async function writeUsers(users) {
  await ensureUserStore();
  try {
    const tmpPath = `${USERS_FILE}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmpPath, `${JSON.stringify(users, null, 2)}\n`);
    await fs.rename(tmpPath, USERS_FILE);
    userCacheDirty = true;
  } catch (err) {
    console.error('[writeUsers] Failed to write users:', err);
  }
}

async function ensureAuditsStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(AUDITS_FILE);
  } catch {
    await fs.writeFile(AUDITS_FILE, '[]\n');
  }
}

async function readAudits() {
  await ensureAuditsStore();
  const raw = await fs.readFile(AUDITS_FILE, 'utf8');
  return JSON.parse(raw || '[]');
}

// Generic capped JSON-array reader for per-feature append stores.
async function readJsonArray(filePath) {
  try {
    await fs.access(filePath);
  } catch {
    return [];
  }
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ── Execution History Store ─────────────────────────────────────────────────

let executionWriteQueue = Promise.resolve();

async function ensureExecutionStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(EXECUTIONS_FILE);
  } catch {
    await fs.writeFile(EXECUTIONS_FILE, '[]\n');
  }
}

async function readExecutions() {
  await ensureExecutionStore();
  const raw = await fs.readFile(EXECUTIONS_FILE, 'utf8');
  return JSON.parse(raw || '[]');
}

async function writeExecutionsAtomic(executions) {
  const tmpPath = `${EXECUTIONS_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmpPath, `${JSON.stringify(executions, null, 2)}\n`);
  await fs.rename(tmpPath, EXECUTIONS_FILE);
}

async function updateExecutionStore(mutator) {
  const task = executionWriteQueue.then(async () => {
    await ensureExecutionStore();
    const raw = await fs.readFile(EXECUTIONS_FILE, 'utf8');
    const store = JSON.parse(raw || '[]');
    const result = await mutator(store);
    if (store.length > MAX_EXECUTIONS_ENTRIES) {
      store.splice(0, store.length - MAX_EXECUTIONS_ENTRIES);
    }
    await writeExecutionsAtomic(store);
    return result;
  });
  executionWriteQueue = task.catch((err) => {
    console.error('[updateExecutionStore] Write task failed:', err);
  });
  return task;
}

// ── Memory Scanner (Spaced Repetition, SM-2) ─────────────────────────────────
// Uses local JSON file storage, matching the users.json/feedback.json pattern.
// This is the canonical store for the pure-JWT build (no Firebase/Firestore).
let memoryWriteQueue = Promise.resolve();

async function ensureMemoryStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(MEMORY_FILE);
  } catch {
    await fs.writeFile(MEMORY_FILE, '{}\n');
  }
}

async function readMemoryStore() {
  await ensureMemoryStore();
  const raw = await fs.readFile(MEMORY_FILE, 'utf8');
  return JSON.parse(raw || '{}');
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
    const raw = await fs.readFile(MEMORY_FILE, 'utf8');
    const store = JSON.parse(raw || '{}');
    const updated = await mutator(store);
    // Write the updated store if the mutator returned a new store object.
    // If the mutator mutated in-place and returned undefined or a sub-resource
    // (such as a card object), we write the mutated store.
    const isCard =
      updated &&
      typeof updated === 'object' &&
      ('topic' in updated || 'nextReviewDate' in updated || 'repetitions' in updated);
    const isNewStore = updated && typeof updated === 'object' && !isCard;
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
    await fs.writeFile(TEAM_PROFILES_FILE, '{}\n');
  }
}

async function readTeamProfilesStore() {
  await ensureTeamProfilesStore();
  const raw = await fs.readFile(TEAM_PROFILES_FILE, 'utf8');
  return JSON.parse(raw || '{}');
}

async function writeTeamProfilesStoreAtomic(filePath, store) {
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmpPath, `${JSON.stringify(store, null, 2)}\n`);
  await fs.rename(tmpPath, filePath);
}

async function updateTeamProfilesStore(mutator) {
  const task = teamProfilesWriteQueue.then(async () => {
    await ensureTeamProfilesStore();
    const raw = await fs.readFile(TEAM_PROFILES_FILE, 'utf8');
    const store = JSON.parse(raw || '{}');
    const updated = await mutator(store);
    await writeTeamProfilesStoreAtomic(TEAM_PROFILES_FILE, store);
    return updated;
  });

  teamProfilesWriteQueue = task.catch((err) => {
    console.error('[updateTeamProfilesStore] Write task failed:', err);
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

    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, '[]\n');
    }

    let release;
    try {
      release = await lockfile.lock(filePath, {
        retries: { retries: 5, minTimeout: 50, maxTimeout: 200 },
      });
    } catch (lockErr) {
      console.warn(`Failed to acquire lock on ${filePath}:`, lockErr.message);
    }

    try {
      let list = [];
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        list = JSON.parse(raw || '[]');
        if (!Array.isArray(list)) list = [];
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
      list.push(entry);
      if (list.length > maxEntries) {
        list = list.slice(list.length - maxEntries);
      }
      const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
      await fs.writeFile(tmpPath, `${JSON.stringify(list, null, 2)}\n`);
      await fs.rename(tmpPath, filePath);
    } finally {
      if (release) await release();
    }
    return entry;
  });
  // Keep the chain alive even if one write rejects, so later writes still run.
  jsonArrayWriteQueues.set(
    filePath,
    task.catch(() => {})
  );
  return task;
}

// ──────────────────────────────────────────────────────────────────────────

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (req.body && typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1024 * 1024) throw new Error('Request body is too large.');
  }
  return body ? JSON.parse(body) : {};
}

function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function redirect(res, location, headers = {}) {
  res.writeHead(302, { Location: location, ...headers });
  res.end();
}

// Sessions are carried in the aiv_session / aiv_refresh HttpOnly cookies and
// verified as pure HMAC-signed JWTs (see backend/services/auth.service.js).
// No third-party auth provider is involved.

function getSession(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return verifyAccessToken(cookies[SESSION_COOKIE]);
}

// A team profile is private to its owner — the authenticated user who first
// created it — and any explicitly listed members. `profile` must be `null`/
// `undefined` when no record exists yet (allowing the caller to create one
// and become its owner); a stored record with no `ownerId` is legacy data
// with no rightful owner on file, so it fails closed and denies everyone
// rather than granting open read/write access to anyone who knows the id.
function canAccessTeamProfile(profile, userId) {
  if (!profile) return true;
  if (!profile.ownerId) return false;
  if (profile.ownerId === userId) return true;
  const members = Array.isArray(profile.members) ? profile.members : [];
  return members.some(
    (m) => m === userId || (m && typeof m === 'object' && (m.id === userId || m.userId === userId))
  );
}

function normalizePathname(pathname) {
  if (!pathname) return '/';
  return pathname.replace(/\/+$/, '') || '/';
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
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  if (!allowedMethods.includes(req.method)) {
    return {
      valid: false,
      status: 405,
      message: 'Method not allowed.',
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
const CSRF_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function isSameOriginRequest(req) {
  const host = req.headers.host;
  if (!host) return false;
  for (const header of [req.headers.origin, req.headers.referer]) {
    if (!header) continue;
    try {
      const requestHost = host.split(':')[0];
      const urlHost = new URL(header).host.split(':')[0];
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
    return sendJson(res, 403, { error: 'CSRF validation failed.' });
  }

  if (pathname === '/api/team-profile' && req.method === 'GET') {
    try {
      const session = getSession(req);
      if (!session) {
        return sendJson(res, 401, { error: 'Login required.' });
      }

      const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
      const teamId = urlParams.get('id');

      if (!teamId) {
        return sendJson(res, 400, { error: 'Missing team id.' });
      }

      const store = await readTeamProfilesStore();
      const profileData = store[teamId] || null;

      if (profileData && !canAccessTeamProfile(profileData, session.sub)) {
        return sendJson(res, 403, { error: 'You do not have access to this team profile.' });
      }

      if (!profileData) {
        // Return default profile with version 1
        return sendJson(res, 200, {
          id: teamId,
          version: 1,
          name: 'New Team Profile',
          description: '',
          members: [],
        });
      }

      return sendJson(res, 200, profileData);
    } catch (error) {
      console.error('Fetch team profile error:', error);
      return sendJson(res, 500, { error: 'Failed to fetch team profile.' });
    }
  }

  if (pathname === '/api/team-profile' && req.method === 'POST') {
    try {
      const session = getSession(req);
      if (!session) {
        return sendJson(res, 401, { error: 'Login required.' });
      }

      const payload = await readJsonBody(req);
      const { id: teamId, version, name, description, members } = payload;

      if (!teamId) {
        return sendJson(res, 400, { error: 'Missing team id.' });
      }

      if (version === undefined || version === null) {
        return sendJson(res, 400, { error: 'Missing version for concurrency control.' });
      }

      let updatedProfile = null;

      try {
        updatedProfile = await updateTeamProfilesStore((store) => {
          const existing = store[teamId] || null;
          const currentProfile = existing || { version: 1 };

          // Ownership check: only the owner/members may modify a claimed profile.
          if (!canAccessTeamProfile(existing, session.sub)) {
            const forbiddenError = new Error('Forbidden');
            forbiddenError.status = 403;
            throw forbiddenError;
          }

          // OCC version check
          if (currentProfile.version !== version) {
            const conflictError = new Error('Conflict');
            conflictError.status = 409;
            conflictError.currentVersion = currentProfile.version;
            throw conflictError;
          }

          // Update data and increment version
          const newProfile = {
            id: teamId,
            ownerId: currentProfile.ownerId || session.sub,
            name: name || currentProfile.name || 'New Team Profile',
            description: description !== undefined ? description : currentProfile.description || '',
            members: members || currentProfile.members || [],
            version: version + 1,
            updatedAt: new Date().toISOString(),
          };

          store[teamId] = newProfile;
          return newProfile;
        });
      } catch (error) {
        if (error.status === 403) {
          return sendJson(res, 403, { error: 'You do not have access to this team profile.' });
        }
        if (error.status === 409) {
          return sendJson(res, 409, {
            error: 'Conflict detected: The profile was updated by someone else.',
            currentVersion: error.currentVersion,
          });
        }
        throw error;
      }

      return sendJson(res, 200, updatedProfile);
    } catch (error) {
      console.error('Update team profile error:', error);
      return sendJson(res, 500, { error: 'Failed to update team profile.' });
    }
  }

  if (
    pathname === '/api/debug-env' &&
    req.method === 'GET' &&
    process.env.ENABLE_DEBUG_ENV === 'true'
  ) {
    const keys = ['SESSION_SECRET', 'EMAIL_USER', 'ENABLE_DEBUG_ENV'];
    const vars = {};
    keys.forEach((k) => {
      const v = process.env[k];
      vars[k] = Boolean(v);
    });
    return sendJson(res, 200, vars);
  }
  if (pathname === '/api/firebase-config' && req.method === 'GET') {
    // Firebase auth/storage was removed in favour of pure JWT sessions.
    return sendJson(res, 503, { configured: false, error: 'Firebase is not used.' });
  }

  if (pathname === '/api/supabase-config' && req.method === 'GET') {
    // Supabase auth was removed in favour of pure JWT sessions.
    return sendJson(res, 200, { configured: false });
  }

  if (pathname === '/api/csrf-token' && req.method === 'GET') {
    const secret = crypto.randomBytes(32).toString('hex');
    const token = crypto
      .createHmac('sha256', process.env.CSRF_SALT || 'infinity-verse-secure-salt')
      .update(secret)
      .digest('hex');
    const isProd = process.env.NODE_ENV === 'production';
    const cookieString = `csrfSecret=${secret}; HttpOnly; ${isProd ? 'Secure; ' : ''}SameSite=Lax; Path=/; Max-Age=3600`;
    return sendJson(res, 200, { csrfToken: token }, { 'Set-Cookie': cookieString });
  }

  if (pathname === '/api/analyze-resume' && req.method === 'POST') {
    if (
      !applyRateLimit(
        req,
        res,
        resumeAnalysisLimiter,
        'Too many resume analysis requests. Please try again later.'
      )
    ) {
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
        return sendJson(res, 400, { error: 'No resume file uploaded.' });
      }

      const allowedMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return sendJson(res, 400, { error: 'Unsupported file type. Upload PDF or DOCX.' });
      }

      if (!(await validateMagicBytes(req.file.buffer, req.file.mimetype))) {
        return sendJson(res, 400, {
          error: "File content mismatch. The uploaded file's content does not match its type.",
        });
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
      console.error('Resume analysis error:', error);
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return sendJson(res, 413, { error: 'Resume file is too large.' });
      }
      if (error?.message === 'Unsupported file') {
        return sendJson(res, 400, { error: 'Unsupported file type. Upload PDF or DOCX.' });
      }
      return sendJson(res, 500, { error: 'Failed to analyze resume.' });
    }
  }

  if (pathname === '/api/analyze-repository' && req.method === 'POST') {
    if (
      !applyRateLimit(
        req,
        res,
        repoAnalysisLimiter,
        'Too many repository analysis requests. Please try again later.'
      )
    ) {
      return;
    }
    try {
      const payload = await readJsonBody(req);
      const { repoUrl } = payload;

      let parsedUrl;
      try {
        parsedUrl = new URL(repoUrl);
      } catch {
        return sendJson(res, 400, { error: 'Please provide a valid repository URL.' });
      }

      const validHostnames = [
        'github.com',
        'www.github.com',
        'gitlab.com',
        'www.gitlab.com',
        'bitbucket.org',
        'www.bitbucket.org',
      ];

      if (
        !['http:', 'https:'].includes(parsedUrl.protocol) ||
        !validHostnames.includes(parsedUrl.hostname.toLowerCase())
      ) {
        return sendJson(res, 400, {
          error: 'Please provide a valid GitHub, GitLab, or Bitbucket repository URL.',
        });
      }

      const provider = VCSFactory.getProvider(repoUrl);
      const workflows = await provider.getNormalizedWorkflows();

      if (workflows.length === 0) {
        let recommendation =
          'No GitHub Actions workflows found in .github/workflows. Add a CI/CD pipeline to automate testing.';
        if (repoUrl.includes('gitlab.com')) {
          recommendation =
            'No GitLab CI/CD configuration found (.gitlab-ci.yml). Add a CI/CD pipeline to automate testing.';
        } else if (repoUrl.includes('bitbucket.org')) {
          recommendation =
            'No Bitbucket Pipelines configuration found (bitbucket-pipelines.yml). Add a CI/CD pipeline to automate testing.';
        }
        return sendJson(res, 200, {
          score: 0,
          workflowsAnalyzed: 0,
          details: { hasDependencies: false, hasTests: false },
          recommendations: [recommendation],
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
      if (bestScore === 20)
        recommendations.push('Workflows found, but they contain no functional jobs or steps.');
      if (bestScore === 50)
        recommendations.push("Add explicit testing commands (like 'npm test') to your workflow.");
      if (bestScore === 75)
        recommendations.push('Ensure dependencies are installed securely before running tests.');
      if (bestScore === 100)
        recommendations.push('Excellent! Fully functional CI/CD pipeline detected.');

      return sendJson(res, 200, {
        score: bestScore,
        workflowsAnalyzed: workflows.length,
        details: {
          hasDependencies: overallDeps,
          hasTests: overallTests,
        },
        recommendations,
      });
    } catch (err) {
      console.error('Repository analysis error:', err.message);
      return sendJson(res, 500, { error: 'Failed to analyze repository. ' + err.message });
    }
  }

  // SDLC Advisor API
  if (pathname === '/api/sdlc-advisor' && req.method === 'POST') {
    if (
      !applyRateLimit(
        req,
        res,
        sdlcAdvisorLimiter,
        'Too many SDLC advisor requests. Please try again later.'
      )
    ) {
      return;
    }
    try {
      const payload = await readJsonBody(req);
      const { description } = payload;
      if (!description) {
        return sendJson(res, 400, { error: 'Project description is required.' });
      }
      const advice = await generateSdlcAdvice(description);
      return sendJson(res, 200, advice);
    } catch (e) {
      console.error('SDLC Advisor error:', e);
      return sendJson(res, 500, { error: 'Failed to generate SDLC advice.' });
    }
  }

  // Bulk Audit APIs
  if (pathname === '/api/audit/bulk' && req.method === 'POST') {
    if (
      !applyRateLimit(
        req,
        res,
        bulkAuditLimiter,
        'Too many bulk audit requests. Please try again later.'
      )
    ) {
      return;
    }
    try {
      uploadCsv(req, res, async (err) => {
        if (err) return sendJson(res, 500, { error: 'Upload error.' });
        if (!req.file) return sendJson(res, 400, { error: 'No CSV file uploaded.' });

        try {
          const records = csvParse(req.file.buffer.toString('utf-8'), {
            columns: false,
            skip_empty_lines: true,
          });
          // Extract repo URLs from the first column
          const repoUrls = records
            .map((row) => row[0])
            .filter((url) => url && url.includes('github.com'));

          if (repoUrls.length === 0) {
            return sendJson(res, 400, { error: 'No valid GitHub URLs found in the CSV.' });
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
            message: 'Bulk audit accepted and queued.',
            batchId,
            totalJobs: repoUrls.length,
          });
        } catch (parseErr) {
          console.error('CSV Parse Error:', parseErr);
          return sendJson(res, 400, { error: 'Failed to parse CSV file.' });
        }
      });
      return; // Async multer
    } catch (err) {
      return sendJson(res, 500, { error: 'Failed to queue bulk audit.' });
    }
  }

  if (pathname.startsWith('/api/audit/bulk/') && req.method === 'GET') {
    const batchId = pathname.split('/').pop();
    const progress = await getBatchProgress(batchId);
    if (!progress) {
      return sendJson(res, 404, { error: 'Batch not found.' });
    }
    return sendJson(res, 200, progress);
  }

  if (pathname === '/api/logout' && req.method === 'POST') {
    const rToken = getRefreshToken(req);
    if (rToken) {
      const decoded = await verifyRefreshToken(rToken);
      if (decoded) await revokeTokenFamily(decoded.familyId);
    }
    return sendJson(res, 200, { success: true }, { 'Set-Cookie': clearAuthCookies() });
  }

  if (pathname === '/api/refresh' && req.method === 'POST') {
    const rToken = getRefreshToken(req);
    if (!rToken) return sendJson(res, 401, { error: 'No refresh token' });

    const decoded = await verifyRefreshToken(rToken);
    if (!decoded)
      return sendJson(
        res,
        401,
        { error: 'Invalid or expired refresh token' },
        { 'Set-Cookie': clearAuthCookies() }
      );
    await revokeTokenFamily(decoded.familyId);

    // Find user
    const users = await readUsers();
    const user = users.find((u) => u.id === decoded.sub);

    if (!user)
      return sendJson(res, 401, { error: 'User not found' }, { 'Set-Cookie': clearAuthCookies() });

    const accessToken = createAccessToken(user);
    const refreshToken = await createRefreshToken(user, decoded.familyId);

    return sendJson(
      res,
      200,
      { success: true },
      { 'Set-Cookie': authCookies(accessToken, refreshToken, req) }
    );
  }

  if (pathname === '/api/guest' && req.method === 'POST') {
    try {
      const guestId = crypto.randomUUID();
      const guestUser = {
        id: `guest-${guestId}`,
        name: 'Guest',
        email: `guest-${guestId}@local`,
      };
      const token = createAccessToken(guestUser);
      const refreshToken = await createRefreshToken(guestUser);
      return sendJson(
        res,
        200,
        { user: { id: guestUser.id, name: guestUser.name, email: guestUser.email } },
        { 'Set-Cookie': authCookies(token, refreshToken, req) }
      );
    } catch (err) {
      console.error('[guest] Unexpected error:', err);
      return sendJson(res, 500, { error: 'Guest login failed. Please try again.' });
    }
  }

  if (pathname === '/api/session' && req.method === 'GET') {
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

  if (pathname === '/api/signup' && req.method === 'POST') {
    try {
      if (
        !applyRateLimit(
          req,
          res,
          signupLimiter,
          'Too many signup attempts. Please try again later.'
        )
      ) {
        return;
      }

      const payload = await readJsonBody(req);
      const validationError = validateSignup(payload);
      if (validationError) return sendJson(res, 400, { error: validationError });

      const email = String(payload.email).trim().toLowerCase();
      const existing = await getUserByEmail(email);
      if (existing) {
        await normalizeAuthDelay();
        return sendJson(res, 409, { error: 'An account with this email already exists.' });
      }

      const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
      const verifyToken = emailConfigured ? crypto.randomBytes(32).toString('hex') : null;
      const user = {
        id: crypto.randomUUID(),
        name: String(payload.name).trim(),
        email,
        password: hashPassword(String(payload.password)),
        createdAt: new Date().toISOString(),
        isDeactivated: false,
        deactivatedAt: null,
        emailVerified: !emailConfigured,
        verifyToken,
        verifyTokenExpiry: emailConfigured ? Date.now() + 24 * 60 * 60 * 1000 : null,
      };
      await createUser(user);

      if (emailConfigured) {
        sendVerificationEmail(email, user.name, verifyToken).catch((err) =>
          console.error('[email] Signup verification failed:', err)
        );
      }

      const token = createAccessToken(user);
      const refreshToken = await createRefreshToken(user);
      loginLimiter.reset(getClientIdentifier(req));
      return sendJson(
        res,
        200,
        { user: { id: user.id, name: user.name, email: user.email } },
        { 'Set-Cookie': authCookies(token, refreshToken, req) }
      );
    } catch (error) {
      console.error('[signup] Unexpected error:', error);
      return sendJson(res, 500, { error: 'Signup failed due to a server error.' });
    }
  }

  if (pathname === '/api/login' && req.method === 'POST') {
    try {
      if (
        !applyRateLimit(req, res, loginLimiter, 'Too many login attempts. Please try again later.')
      ) {
        return;
      }
      const payload = await readJsonBody(req);
      const email = String(payload.email || '')
        .trim()
        .toLowerCase();
      const password = String(payload.password || '');
      const user = await getUserByEmail(email);
      if (!user || !user.password || !passwordMatches(password, user.password)) {
        void 0;
        return sendJson(res, 401, { error: 'Invalid email or password.' });
      }

      if (!user.emailVerified && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return sendJson(res, 403, {
          error: 'Please verify your email before logging in.',
          requiresVerification: true,
          email: user.email,
        });
      }

      if (user.isDeactivated) {
        user.isDeactivated = false;
        user.deactivatedAt = null;
        const users = await readUsers();
        const index = users.findIndex((u) => u.id === user.id);
        if (index !== -1) {
          users[index] = user;
          await writeUsers(users);
        }
      }

      const token = createAccessToken(user);
      const refreshToken = await createRefreshToken(user);
      loginLimiter.reset(getClientIdentifier(req));
      return sendJson(
        res,
        200,
        { user: { id: user.id, name: user.name, email: user.email } },
        { 'Set-Cookie': authCookies(token, refreshToken, req) }
      );
    } catch (error) {
      console.error('[login] Unexpected error:', error);
      return sendJson(res, 500, { error: 'Login failed due to a server error.' });
    }
  }

  if (pathname === '/api/change-password' && req.method === 'POST') {
    if (
      !applyRateLimit(
        req,
        res,
        changePasswordLimiter,
        'Too many change password attempts. Please try again later.'
      )
    ) {
      return;
    }
    const session = getSession(req);

    if (!session) {
      return sendJson(res, 401, {
        error: 'Login required.',
      });
    }

    const { currentPassword, newPassword, confirmPassword } = await readJsonBody(req);

    if (!currentPassword || !newPassword || !confirmPassword) {
      return sendJson(res, 400, {
        error: 'All fields are required.',
      });
    }

    if (newPassword !== confirmPassword) {
      return sendJson(res, 400, {
        error: 'Passwords do not match.',
      });
    }

    if (newPassword.length < 8) {
      return sendJson(res, 400, {
        error: 'Password must be at least 8 characters.',
      });
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return sendJson(res, 400, {
        error: 'Password must contain uppercase, lowercase and number.',
      });
    }

    const users = await readUsers();

    const user = users.find((u) => u.id === session.sub);

    if (!user) {
      return sendJson(res, 404, {
        error: 'User not found.',
      });
    }

    if (!passwordMatches(currentPassword, user.password)) {
      return sendJson(res, 400, {
        error: 'Current password is incorrect.',
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
        message: 'Password updated successfully.',
      },
      {
        'Set-Cookie': clearAuthCookies(),
      }
    );
  }

  if (pathname === '/api/deactivate-account' && req.method === 'POST') {
    const session = getSession(req);

    if (!session) {
      return sendJson(res, 401, {
        error: 'Login required.',
      });
    }

    const users = await readUsers();

    const user = users.find((u) => u.id === session.sub);

    if (!user) {
      return sendJson(res, 404, {
        error: 'User not found.',
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
        'Set-Cookie': clearAuthCookies(),
      }
    );
  }

  if (pathname === '/api/delete-account' && req.method === 'POST') {
    if (
      !applyRateLimit(
        req,
        res,
        deleteAccountLimiter,
        'Too many delete account attempts. Please try again later.'
      )
    ) {
      return;
    }
    const session = getSession(req);

    if (!session) {
      return sendJson(res, 401, {
        error: 'Login required.',
      });
    }

    const payload = await readJsonBody(req);

    const password = String(payload.password || '');

    const users = await readUsers();

    const userIndex = users.findIndex((u) => u.id === session.sub);

    if (userIndex === -1) {
      return sendJson(res, 404, {
        error: 'User not found.',
      });
    }

    const user = users[userIndex];

    if (!passwordMatches(password, user.password)) {
      return sendJson(res, 401, {
        error: 'Incorrect password.',
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
      const raw = await fs.readFile(DELETION_LOG_FILE, 'utf8');

      logs = JSON.parse(raw || '[]');
    } catch {
      // ignore
    }

    logs.push(deletionEvent);

    await fs.writeFile(DELETION_LOG_FILE, JSON.stringify(logs, null, 2));

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
        'Set-Cookie': clearAuthCookies(),
      }
    );
  }
  if (pathname === '/api/forgot-password' && req.method === 'POST') {
    if (
      !applyRateLimit(
        req,
        res,
        forgotPasswordLimiter,
        'Too many forgot password attempts. Please try again later.'
      )
    ) {
      return;
    }
    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON body.' });
    }

    const email = String(payload.email || '')
      .trim()
      .toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendJson(res, 400, { error: 'Valid email required.' });
    }

    // Note: Supabase-based password reset has been removed. We intentionally
    // return success regardless of whether the account exists so we never leak
    // account existence via enumeration. Wire a real reset email here if needed.

    // Always return success to prevent email enumeration
    return sendJson(res, 200, { message: 'Reset email sent if account exists.' });
  }
  if (pathname === '/api/feedback' && req.method === 'POST') {
    const session = getSession(req);
    let payload;
    try {
      payload = await readJsonBody(req);
    } catch (err) {
      return sendJson(res, 400, { error: 'Invalid JSON body.' });
    }

    const { feedbackType, subject, message } = payload;
    if (
      typeof feedbackType !== 'string' ||
      typeof subject !== 'string' ||
      typeof message !== 'string'
    ) {
      return sendJson(res, 400, {
        error: 'Feedback type, subject, and message must be strings.',
      });
    }

    if (!feedbackType.trim() || !subject.trim() || !message.trim()) {
      return sendJson(res, 400, {
        error: 'Feedback type, subject, and message are required.',
      });
    }

    const allowedTypes = ['Suggestion', 'Bug Report', 'Feature Request', 'General Feedback'];
    if (!allowedTypes.includes(feedbackType)) {
      return sendJson(res, 400, { error: 'Invalid feedback type.' });
    }

    if (subject.trim().length < 3) {
      return sendJson(res, 400, {
        error: 'Subject must be at least 3 characters long.',
      });
    }

    if (message.trim().length < 10) {
      return sendJson(res, 400, {
        error: 'Message must be at least 10 characters long.',
      });
    }

    const feedbackData = {
      userId: session ? session.sub : null,
      userName: session ? session.name : null,
      userEmail: session ? session.email : null,
      feedbackType,
      subject: subject.trim(),
      message: message.trim(),
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    try {
      feedbackData.id = crypto.randomUUID();
      await appendToJsonArrayFile(FEEDBACK_FILE, feedbackData, MAX_FEEDBACK_ENTRIES);

      return sendJson(res, 201, { success: true, feedback: feedbackData });
    } catch (err) {
      console.error('Error saving feedback:', err);
      return sendJson(res, 500, { error: 'Failed to save feedback.' });
    }
  }

  if (pathname === '/api/user/profile' && req.method === 'GET') {
    const session = getSession(req);

    // Read the authenticated user's persisted record so the profile reflects
    // real progress saved via /api/progress, /api/study-rooms results, etc.
    let persisted = null;
    if (session) {
      const users = await readUsers();
      persisted = users.find((u) => u.id === session.sub);
    }

    const name = persisted?.name || session?.name || 'Learner';
    const email = persisted?.email || session?.email || '';
    const avatar = persisted?.avatar || {
      initial: (name || 'L').charAt(0).toUpperCase(),
      bg: '#7c3aed',
    };
    const activityData = persisted?.activityData || {};

    const userData = {
      user: {
        name,
        username: email.split('@')[0] || 'learner',
        avatar,
        bio: persisted?.bio || 'Passionate about DSA and building cool stuff!',
        joinedDate:
          persisted?.createdAt || persisted?.joinedDate || new Date().toISOString().slice(0, 10),
      },
      stats: {
        totalSolved: activityData.totalSolved || 0,
        xp: persisted?.xp || 0,
        streak: persisted?.streak || 0,
        level: persisted?.level || 1,
      },
      badges: persisted?.badges || ['🌟 First Steps'],
      languages: persisted?.languages || [
        { name: 'JavaScript', percentage: 80 },
        { name: 'Python', percentage: 65 },
        { name: 'C++', percentage: 40 },
      ],
      projects: persisted?.projects || [
        { name: 'Weather App', description: 'Real-time weather app', link: '#' },
        { name: 'Task Manager', description: 'Manage tasks easily', link: '#' },
      ],
      recentActivity: activityData.recentActivity || [
        { action: 'Joined Algo Infinity Verse', date: new Date().toISOString().slice(0, 10) },
      ],
    };

    return sendJson(res, 200, { success: true, data: userData });
  }

  if (pathname === '/api/interview-experiences' && req.method === 'POST') {
    const session = getSession(req);
    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON body.' });
    }

    const { company, role, difficulty, rating, title, content, topics, rounds, offerStatus } =
      payload;
    if (!company || !role || !difficulty || !rating || !title || !content) {
      return sendJson(res, 400, {
        error: 'Company, role, difficulty, rating, title, and content are required.',
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
      await appendToJsonArrayFile(
        INTERVIEW_EXPERIENCES_FILE,
        experienceData,
        MAX_INTERVIEW_EXPERIENCE_ENTRIES
      );
      return sendJson(res, 201, { success: true, experience: experienceData });
    } catch (err) {
      console.error('Error saving interview experience:', err);
      return sendJson(res, 500, {
        error: 'Failed to save interview experience.',
      });
    }
  }

  if (pathname === '/api/audit/history' && req.method === 'POST') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });

    try {
      const payload = await readJsonBody(req);
      const auditData = {
        auditId: crypto.randomUUID(),
        userId: session.sub,
        repoUrl: payload.repoUrl || 'unknown',
        timestamp: new Date().toISOString(),
        overallScore: Number(payload.overallScore) || 0,
        categoryScores: payload.categoryScores || {},
        issuesCount: Number(payload.issuesCount) || 0,
        recommendations: payload.recommendations || [],
      };

      await appendToJsonArrayFile(AUDITS_FILE, auditData, MAX_AUDIT_HISTORY_ENTRIES);

      return sendJson(res, 201, { success: true, auditId: auditData.auditId });
    } catch (err) {
      console.error('Error saving audit history:', err);
      return sendJson(res, 500, { error: 'Failed to save audit history.' });
    }
  }

  if (pathname === '/api/audit/history' && req.method === 'GET') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });

    const url = new URL(req.url, `http://${req.headers.host}`);
    const repoUrl = url.searchParams.get('repoUrl');
    const limit = Number(url.searchParams.get('limit')) || 20;

    try {
      const allAudits = await readAudits();
      let history = allAudits.filter((a) => a.userId === session.sub);
      if (repoUrl) {
        history = history.filter((a) => a.repoUrl === repoUrl);
      }
      history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      history = history.slice(0, limit);

      return sendJson(res, 200, history);
    } catch (err) {
      console.error('Error fetching audit history:', err);
      return sendJson(res, 500, { error: 'Failed to fetch audit history.' });
    }
  }

  if (pathname === '/api/audit/trends' && req.method === 'GET') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });

    const url = new URL(req.url, `http://${req.headers.host}`);
    const repoUrl = url.searchParams.get('repoUrl');

    try {
      const allAudits = await readAudits();
      let history = allAudits.filter((a) => a.userId === session.sub);
      if (repoUrl) history = history.filter((a) => a.repoUrl === repoUrl);
      history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      history = history.slice(0, 100).reverse();

      const trends = history.map((a) => ({
        timestamp: a.timestamp,
        overallScore: a.overallScore,
      }));

      return sendJson(res, 200, trends);
    } catch (err) {
      console.error('Error fetching audit trends:', err);
      return sendJson(res, 500, { error: 'Failed to fetch audit trends.' });
    }
  }

  if (pathname === '/api/memory/log' && req.method === 'POST') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });

    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON body.' });
    }

    const { topic, quality } = payload;
    if (!topic || typeof topic !== 'string' || topic.trim().length < 1) {
      return sendJson(res, 400, { error: 'Topic is required.' });
    }
    if (
      quality === undefined ||
      isNaN(Number(quality)) ||
      Number(quality) < 0 ||
      Number(quality) > 5
    ) {
      return sendJson(res, 400, {
        error: 'Quality must be a number between 0 and 5.',
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

  if (pathname === '/api/memory/due' && req.method === 'GET') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });

    const store = await readMemoryStore();
    const userCards = store[session.sub] || {};
    const now = new Date();
    const due = Object.values(userCards).filter((card) => new Date(card.nextReviewDate) <= now);

    return sendJson(res, 200, { success: true, due });
  }

  if (pathname === '/api/memory/all' && req.method === 'GET') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });

    const store = await readMemoryStore();
    const userCards = store[session.sub] || {};

    return sendJson(res, 200, {
      success: true,
      cards: Object.values(userCards),
    });
  }

  // ── Quiz Results ──────────────────────────────────────────────────────────
  if (pathname === '/api/quiz-results' && req.method === 'POST') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Authentication required.' });

    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON body.' });
    }

    const { quizId, quizTitle, score, totalQuestions, correctAnswers, percentage, topic } = payload;
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
          'Missing required fields: quizId, quizTitle, score, totalQuestions, correctAnswers, percentage, topic.',
      });
    }

    if (typeof score !== 'number' || score < 0)
      return sendJson(res, 400, {
        error: 'score must be a non-negative number.',
      });
    if (typeof totalQuestions !== 'number' || totalQuestions < 1)
      return sendJson(res, 400, { error: 'totalQuestions must be >= 1.' });
    if (typeof correctAnswers !== 'number' || correctAnswers < 0)
      return sendJson(res, 400, { error: 'correctAnswers must be >= 0.' });
    if (correctAnswers > totalQuestions)
      return sendJson(res, 400, {
        error: 'correctAnswers cannot exceed totalQuestions.',
      });
    if (typeof percentage !== 'number' || percentage < 0 || percentage > 100)
      return sendJson(res, 400, { error: 'percentage must be 0-100.' });

    try {
      const attemptId = crypto.randomUUID();
      const attempt = {
        id: attemptId,
        userId: session.sub,
        quizId: String(quizId),
        quizTitle: String(quizTitle),
        score: Number(score),
        totalQuestions: Number(totalQuestions),
        correctAnswers: Number(correctAnswers),
        percentage: Number(percentage),
        topic: String(topic),
        completedAt: new Date().toISOString(),
      };

      await appendToJsonArrayFile(QUIZ_RESULTS_FILE, attempt, MAX_AUDIT_HISTORY_ENTRIES);

      return sendJson(res, 201, { success: true, attemptId, attempt });
    } catch (error) {
      console.error('Failed to save quiz result:', error);
      return sendJson(res, 500, { error: 'Failed to save quiz result.' });
    }
  }

  if (pathname === '/api/quiz-results' && req.method === 'GET') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Authentication required.' });

    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const parsedLimit = parseInt(url.searchParams.get('limit') || '20', 10);
      const limit = Math.min(Number.isNaN(parsedLimit) ? 20 : parsedLimit, 100);
      const topic = url.searchParams.get('topic');

      let results = (await readJsonArray(QUIZ_RESULTS_FILE)).filter(
        (r) => r.userId === session.sub
      );
      if (topic) results = results.filter((r) => r.topic === topic);
      results.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
      results = results.slice(0, limit);

      return sendJson(res, 200, {
        success: true,
        results,
        count: results.length,
      });
    } catch (error) {
      console.error('Failed to fetch quiz results:', error);
      return sendJson(res, 500, { error: 'Failed to fetch quiz results.' });
    }
  }

  if (pathname === '/api/roadmaps' && req.method === 'GET') {
    try {
      const data = await fs.readFile(ROADMAPS_FILE, 'utf8');
      return sendJson(res, 200, JSON.parse(data));
    } catch (err) {
      console.error('Failed to load roadmaps registry:', err);
      return sendJson(res, 500, { error: 'Failed to load roadmaps registry.' });
    }
  }

  if (pathname === '/api/reports/export/pdf' || pathname === '/api/reports/export/image') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Authentication required.' });
    return await handleReportRequest(req, res, pathname, session);
  }

  if (pathname === '/api/reports/status' && req.method === 'GET') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Authentication required.' });

    const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
    const jobId = urlParams.get('jobId');
    if (!jobId) return sendJson(res, 400, { error: 'Missing jobId' });

    try {
      const jobStatus = await getReportStatus(jobId);
      if (!jobStatus) return sendJson(res, 404, { error: 'Job not found' });

      if (jobStatus.status === 'completed') {
        const buffer = Buffer.from(jobStatus.data, 'base64');
        const isPdf = jobStatus.type === 'pdf';
        const contentType = isPdf ? 'application/pdf' : 'image/png';
        const ext = isPdf ? 'pdf' : 'png';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="report_${session.sub}.${ext}"`,
          'Content-Length': buffer.length,
        });
        return res.end(buffer);
      } else if (jobStatus.status === 'failed') {
        return sendJson(res, 500, { error: jobStatus.error || 'Report generation failed' });
      } else {
        return sendJson(res, 200, { status: jobStatus.status });
      }
    } catch (err) {
      console.error('Error fetching report status:', err);
      return sendJson(res, 500, { error: 'Failed to fetch report status' });
    }
  }

  if (pathname === '/api/user/benchmark' && req.method === 'GET') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Authentication required.' });

    try {
      const benchmark = await getUserBenchmark(session.sub);
      return sendJson(res, 200, { success: true, benchmark });
    } catch (err) {
      console.error('Benchmark error:', err);
      return sendJson(res, 500, { error: 'Failed to generate benchmark.' });
    }
  }

  // ── Problem Notes & Mnemonics endpoints ──────────────────────────────────
  if (pathname === '/api/problem-notes' && req.method === 'GET') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });

    try {
      const users = await readUsers();
      const user = users.find((u) => u.id === session.sub);
      return sendJson(res, 200, { success: true, notes: user?.problemNotes || {} });
    } catch (err) {
      console.error('Error fetching notes:', err);
      return sendJson(res, 500, { error: 'Failed to fetch notes.' });
    }
  }

  const notesMatch = pathname.match(/^\/api\/problem-notes\/([^/]+)$/);
  if (notesMatch && req.method === 'PUT') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });

    const problemId = notesMatch[1];
    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON.' });
    }

    const noteData = {
      topicKey: String(payload.topicKey || ''),
      problemId: parseInt(problemId) || 0,
      notes: String(payload.notes || ''),
      mnemonics: String(payload.mnemonics || ''),
      pitfalls: String(payload.pitfalls || ''),
      whenToUse: String(payload.whenToUse || ''),
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      updatedAt: new Date().toISOString(),
    };

    try {
      const users = await readUsers();
      const idx = users.findIndex((u) => u.id === session.sub);
      if (idx !== -1) {
        if (!users[idx].problemNotes) users[idx].problemNotes = {};
        users[idx].problemNotes[problemId] = noteData;
        await writeUsers(users);
      }
      return sendJson(res, 200, { success: true, note: noteData });
    } catch (err) {
      console.error('Error saving note:', err);
      return sendJson(res, 500, { error: 'Failed to save note.' });
    }
  }

  // ── Spaced Repetition Practice Problems endpoints ─────────────────────────
  if (pathname === '/api/spaced-repetition' && req.method === 'GET') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });

    try {
      const users = await readUsers();
      const user = users.find((u) => u.id === session.sub);
      return sendJson(res, 200, { success: true, cards: user?.spacedRepetition || {} });
    } catch (err) {
      console.error('Error fetching spaced repetition cards:', err);
      return sendJson(res, 500, { error: 'Failed to fetch spaced repetition cards.' });
    }
  }

  const repMatch = pathname.match(/^\/api\/spaced-repetition\/([^/]+)$/);
  if (repMatch && req.method === 'PUT') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });

    const problemId = repMatch[1];
    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON.' });
    }

    const existing = payload.existing || { repetitions: 0, easeFactor: 2.5, interval: 0 };
    // parseInt() returns NaN (never undefined) for missing/non-numeric input,
    // so guard with Number.isInteger and fall back to the SM-2 default of 3,
    // clamped to the valid quality range (0-5) — otherwise applySM2 persists NaN.
    const parsedQuality = Number.parseInt(payload.quality, 10);
    const quality = Number.isInteger(parsedQuality) ? Math.max(0, Math.min(5, parsedQuality)) : 3;
    const updated = applySM2(existing, quality);
    updated.problemId = parseInt(problemId) || 0;

    try {
      const users = await readUsers();
      const idx = users.findIndex((u) => u.id === session.sub);
      if (idx !== -1) {
        if (!users[idx].spacedRepetition) users[idx].spacedRepetition = {};
        users[idx].spacedRepetition[problemId] = updated;
        await writeUsers(users);
      }
      return sendJson(res, 200, { success: true, card: updated });
    } catch (err) {
      console.error('Error saving spaced repetition card:', err);
      return sendJson(res, 500, { error: 'Failed to save spaced repetition card.' });
    }
  }

  // ── Smart Revision endpoints ──────────────────────────────────────────────
  if (pathname === '/api/revision' && req.method === 'GET') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });

    try {
      const users = await readUsers();
      const user = users.find((u) => u.id === session.sub);
      if (!user) return sendJson(res, 404, { error: 'User not found.' });
      return sendJson(res, 200, {
        success: true,
        revisionSchedule: user.revisionSchedule || {},
        revisionCalendar: user.revisionCalendar || {
          tasks: [],
          history: [],
          streak: 0,
          longestStreak: 0,
          missedDays: 0,
          stats: {},
        },
      });
    } catch (err) {
      console.error('Error fetching revision data:', err);
      return sendJson(res, 500, { error: 'Failed to fetch revision data.' });
    }
  }

  if (pathname === '/api/revision' && (req.method === 'PUT' || req.method === 'POST')) {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });

    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON.' });
    }

    const { revisionSchedule, revisionCalendar } = payload;
    const updates = {};
    if (revisionSchedule) updates.revisionSchedule = revisionSchedule;
    if (revisionCalendar) updates.revisionCalendar = revisionCalendar;

    try {
      const users = await readUsers();
      const idx = users.findIndex((u) => u.id === session.sub);
      if (idx !== -1) {
        if (revisionSchedule) users[idx].revisionSchedule = revisionSchedule;
        if (revisionCalendar) users[idx].revisionCalendar = revisionCalendar;
        await writeUsers(users);
      }
      return sendJson(res, 200, { success: true });
    } catch (err) {
      console.error('Error updating revision data:', err);
      return sendJson(res, 500, { error: 'Failed to update revision data.' });
    }
  }

  // ── Collaborative Study Rooms endpoints ──────────────────────────────────
  if (pathname === '/api/study-rooms' && req.method === 'GET') {
    const roomsList = [];
    for (const r of studyRooms.values()) {
      roomsList.push({
        id: r.id,
        hostName: r.hostName,
        status: r.status,
        topic: r.config.topic,
        difficulty: r.config.difficulty,
        timerDuration: r.config.timerDuration,
        maxParticipants: r.config.maxParticipants,
        participantsCount: Object.keys(r.participants).length,
      });
    }
    return sendJson(res, 200, { rooms: roomsList });
  }

  if (pathname === '/api/study-rooms' && req.method === 'POST') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });

    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      body = {};
    }

    const maxParticipants = Math.min(Math.max(parseInt(body.maxParticipants) || 4, 2), 8);
    const timerDuration = Math.min(Math.max(parseInt(body.timerDuration) || 600, 60), 1800);
    const difficulty = ['Easy', 'Medium', 'Hard'].includes(body.difficulty)
      ? body.difficulty
      : 'Medium';
    const topic = body.topic || 'arrays';

    const roomId = 'ROOM-' + Math.floor(10000 + Math.random() * 90000);

    let hostName = 'Host';
    const users = await readUsers();
    const hostUser = users.find((u) => u.id === session.sub);
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
        problems: [],
      },
      status: 'lobby',
      participants: {},
      currentProblem: null,
      timerSeconds: 0,
      timerInterval: null,
    };

    studyRooms.set(roomId, newRoom);
    return sendJson(res, 201, { roomId, room: { id: roomId, hostName, status: 'lobby' } });
  }

  if (
    pathname.startsWith('/api/study-rooms/') &&
    pathname.endsWith('/results') &&
    req.method === 'POST'
  ) {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });

    const match = pathname.match(/^\/api\/study-rooms\/([^/]+)\/results$/);
    if (!match) return sendJson(res, 400, { error: 'Invalid path.' });
    const roomId = match[1];

    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      body = {};
    }

    const { topic, difficulty, score = 50 } = body;

    try {
      await appendToJsonArrayFile(
        STUDY_ROOM_RESULTS_FILE,
        {
          userId: session.sub,
          roomId,
          topic,
          difficulty,
          score,
          completedAt: new Date().toISOString(),
        },
        MAX_AUDIT_HISTORY_ENTRIES
      );

      const users = await readUsers();
      const idx = users.findIndex((u) => u.id === session.sub);
      if (idx !== -1) {
        users[idx].xp = (users[idx].xp || 0) + score;
        users[idx].streak = (users[idx].streak || 0) + 1;
        users[idx].lastActive = new Date().toISOString();
        await writeUsers(users);
      }
      return sendJson(res, 200, { success: true, xpAwarded: score });
    } catch (err) {
      console.error('Error saving study room results:', err);
      return sendJson(res, 500, { error: 'Failed to persist results.' });
    }
  }

  // ── Battle routes ──────────────────────────────────────────────────────────
  // Battle mode relies on a document store (previously Firestore). It is
  // disabled in this pure-JWT build, so every battle route returns 503.
  // All routes still require an active session — unauthenticated requests get 401.

  if (pathname === '/api/battles' && req.method === 'POST') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });
    return sendJson(res, 503, { error: 'Battle mode is currently unavailable.' });
  }

  // GET /api/battles/history  — must be declared BEFORE the :id pattern below
  // or "history" gets captured as a battle ID.
  if (pathname === '/api/battles/history' && req.method === 'GET') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });
    return sendJson(res, 503, { error: 'Battle mode is currently unavailable.' });
  }

  // ── End battle routes ─────

  if (pathname === '/api/verify-email' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) return sendJson(res, 400, { error: 'Missing token.' });

    const users = await readUsers();
    const idx = users.findIndex((u) => u.verifyToken === token && u.verifyTokenExpiry > Date.now());
    if (idx === -1) return sendJson(res, 400, { error: 'Link is invalid or expired.' });

    users[idx].emailVerified = true;
    users[idx].verifyToken = null;
    users[idx].verifyTokenExpiry = null;
    await writeUsers(users);

    const sessionToken = createAccessToken(users[idx]);
    const refreshToken = await createRefreshToken(users[idx]);
    res.setHeader('Set-Cookie', authCookies(sessionToken, refreshToken, req));
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === '/api/resend-verification' && req.method === 'POST') {
    if (
      !applyRateLimit(
        req,
        res,
        resendVerificationLimiter,
        'Too many verification requests. Please try again later.'
      )
    ) {
      return;
    }
    const body = await readJsonBody(req);
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    if (!email) return sendJson(res, 400, { error: 'Email required.' });

    const users = await readUsers();
    const idx = users.findIndex((u) => u.email === email);
    if (idx === -1 || users[idx].emailVerified) return sendJson(res, 200, { ok: true });

    const newToken = crypto.randomBytes(32).toString('hex');
    users[idx].verifyToken = newToken;
    users[idx].verifyTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
    await writeUsers(users);

    sendVerificationEmail(email, users[idx].name, newToken).catch((err) =>
      console.error('[email] Resend failed:', err)
    );
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === '/api/predict-acceptance' && req.method === 'POST') {
    if (
      !applyRateLimit(
        req,
        res,
        predictionLimiter,
        'Too many prediction requests. Please try again later.'
      )
    ) {
      return;
    }
    let payload;
    try {
      payload = await readJsonBody(req);
    } catch (err) {
      const tooLarge = err?.message === 'Request body is too large.';
      return sendJson(res, tooLarge ? 413 : 400, {
        success: false,
        error: tooLarge ? 'Request body is too large.' : 'Invalid JSON body.',
      });
    }

    const { code, language, problemId } = payload;
    if (
      typeof code !== 'string' ||
      !code.trim() ||
      typeof language !== 'string' ||
      !language.trim() ||
      !String(problemId ?? '').trim()
    ) {
      return sendJson(res, 400, {
        success: false,
        error: 'Code, language, and problemId are required',
      });
    }

    try {
      const analysis = analyzeCode(code, language);
      return sendJson(res, 200, { success: true, data: analysis });
    } catch (error) {
      console.error('Error predicting acceptance:', error);
      return sendJson(res, 500, { success: false, error: error.message });
    }
  }

  // ── Execution History Endpoints ─────────────────────────────────────────

  if (pathname === '/api/executions' && req.method === 'GET') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });

    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const language = url.searchParams.get('language');
      const dateFrom = url.searchParams.get('from');
      const dateTo = url.searchParams.get('to');
      const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);

      const all = await readExecutions();
      let list = all.filter((e) => e.userId === session.sub);

      if (language) {
        list = list.filter((e) => e.language?.toLowerCase() === language.toLowerCase());
      }
      if (dateFrom) {
        const from = new Date(dateFrom);
        list = list.filter((e) => new Date(e.createdAt) >= from);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        list = list.filter((e) => new Date(e.createdAt) <= to);
      }

      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      list = list.slice(0, limit);

      const summary = list.map((e) => ({
        id: e.id,
        language: e.language,
        exitCode: e.exitCode,
        error: !!e.error,
        createdAt: e.createdAt,
        cpuTime: e.cpuTime,
        preview: (e.originalCode || e.sourceCode || '').slice(0, 120),
        hasSnapshots: Array.isArray(e.variableSnapshots) && e.variableSnapshots.length > 0,
      }));

      return sendJson(res, 200, {
        executions: summary,
        total: all.filter((e) => e.userId === session.sub).length,
      });
    } catch (err) {
      console.error('Error fetching executions:', err);
      return sendJson(res, 500, { error: 'Failed to fetch execution history.' });
    }
  }

  if (pathname.startsWith('/api/executions/') && req.method === 'GET') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });

    const execId = pathname.slice('/api/executions/'.length);
    if (!execId) return sendJson(res, 400, { error: 'Missing execution ID.' });

    try {
      const all = await readExecutions();
      const execution = all.find((e) => e.id === execId && e.userId === session.sub);
      if (!execution) return sendJson(res, 404, { error: 'Execution not found.' });

      return sendJson(res, 200, { execution });
    } catch (err) {
      console.error('Error fetching execution:', err);
      return sendJson(res, 500, { error: 'Failed to fetch execution.' });
    }
  }

  if (
    pathname.startsWith('/api/executions/') &&
    req.method === 'POST' &&
    pathname.endsWith('/snapshots')
  ) {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Login required.' });

    const execId = pathname.split('/')[3];
    if (!execId) return sendJson(res, 400, { error: 'Missing execution ID.' });

    try {
      const payload = await readJsonBody(req);
      const snapshots = payload.snapshots;
      if (!Array.isArray(snapshots))
        return sendJson(res, 400, { error: 'Snapshots must be an array.' });

      await updateExecutionStore((store) => {
        const idx = store.findIndex((e) => e.id === execId && e.userId === session.sub);
        if (idx !== -1) {
          store[idx].variableSnapshots = snapshots;
        }
      });

      return sendJson(res, 200, { success: true });
    } catch (err) {
      console.error('Error saving snapshots:', err);
      return sendJson(res, 500, { error: 'Failed to save snapshots.' });
    }
  }
  // ── AI Hint (progressive) ────────────────────────────────────────────────
  if (pathname === '/api/hint' && req.method === 'POST') {
    if (
      !applyRateLimit(req, res, aiHintLimiter, 'Too many hint requests. Please try again later.')
    ) {
      return;
    }

    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON body.' });
    }

    const title = String(payload.title || '').trim();
    const description = String(payload.description || '').trim();
    const level = Number(payload.level) || 1;
    const previousHints = Array.isArray(payload.previousHints)
      ? payload.previousHints.filter((h) => typeof h === 'string').slice(0, 10)
      : [];
    const currentCode = String(payload.currentCode || '');
    const tags = String(payload.tags || '');

    if (!title) {
      return sendJson(res, 400, { error: 'Problem title is required.' });
    }

    try {
      const hint = await generateAIHint({
        title,
        description,
        level,
        previousHints,
        currentCode,
        tags,
      });
      return sendJson(res, 200, { success: true, hint });
    } catch (error) {
      console.error('AI hint error:', error);
      if (
        error.message.includes('GEMINI_API_KEY not set') ||
        error.message.includes('unavailable')
      ) {
        return sendJson(res, 503, { error: 'AI hints unavailable (GEMINI_API_KEY not set).' });
      }
      return sendJson(res, 500, { error: error.message || 'Failed to generate hint.' });
    }
  }

  // Helper function to run javascript in child process securely for complexity profiling
  function _runInChild(code, N) {
    return new Promise((resolve) => {
      // Spawn node with 16MB heap memory limit and read from stdin (-)
      const child = spawn(process.execPath, ['--max-old-space-size=16', '-'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const runnerScript = `
        const vm = require('vm');
        const code = ${JSON.stringify(code)};
        const N = ${N};
        
        const sandbox = {
          console: { log: () => {}, error: () => {} },
          Math, Array, Object, String, Number, Boolean, Date, Set, Map, N
        };
        
        try {
          const memStart = process.memoryUsage().heapUsed;
          const timeStart = performance.now();
          
          const scriptContent = code + '\\n' + 'solve(N);';
          
          vm.runInNewContext(scriptContent, sandbox, { timeout: 150 });
          
          const timeEnd = performance.now();
          const memEnd = process.memoryUsage().heapUsed;
          
          const timeMs = timeEnd - timeStart;
          const memBytes = Math.max(0, memEnd - memStart);
          
          console.log(JSON.stringify({ success: true, timeMs, memKb: memBytes / 1024 }));
        } catch (err) {
          console.log(JSON.stringify({ success: false, error: err.message }));
        }
      `;

      let stdoutData = '';
      let stderrData = '';

      child.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      child.on('close', (exitCode) => {
        if (exitCode !== 0) {
          if (stderrData.includes('Allocation failed') || stderrData.includes('Out of memory')) {
            resolve({ success: false, error: 'Memory limit of 16MB exceeded.' });
          } else {
            resolve({
              success: false,
              error: stderrData.trim() || `Process exited with code ${exitCode}`,
            });
          }
          return;
        }

        try {
          const result = JSON.parse(stdoutData.trim());
          resolve(result);
        } catch (e) {
          resolve({ success: false, error: 'Internal execution sandbox crash.' });
        }
      });

      child.stdin.write(runnerScript);
      child.stdin.end();
    });
  }

  // ── Complexity Sandbox Profiler ───────────────────────────────────────────
  if (pathname === '/api/execute/profile' && req.method === 'POST') {
    if (
      !applyRateLimit(
        req,
        res,
        sdlcAdvisorLimiter,
        'Too many profile requests. Please try again later.'
      )
    ) {
      return;
    }

    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON body.' });
    }

    const { codeA, codeB, inputSizes } = payload;

    if (typeof codeA !== 'string' || typeof codeB !== 'string' || !codeA || !codeB) {
      return sendJson(res, 400, { error: 'Both codeA and codeB are required and must be strings.' });
    }

    if (!inputSizes || !Array.isArray(inputSizes) || !inputSizes.every(Number.isInteger)) {
      return sendJson(res, 400, { error: 'inputSizes is required and must be an array of integers.' });
    }

    if (inputSizes.length > 8) {
      return sendJson(res, 400, { error: 'cannot exceed 8 sizes' });
    }

    try {
      const results = [];
      for (const N of inputSizes) {
        const resA = await _runInChild(codeA, N);
        if (!resA.success) {
          return sendJson(res, 400, { error: resA.error });
        }

        const resB = await _runInChild(codeB, N);
        if (!resB.success) {
          return sendJson(res, 400, { error: resB.error });
        }

        results.push({
          inputSize: N,
          timeA: resA.timeMs,
          timeB: resB.timeMs,
          memA: resA.memKb,
          memB: resB.memKb,
        });
      }

      return sendJson(res, 200, { success: true, results });
    } catch (err) {
      console.error('Complexity profiling error:', err);
      return sendJson(res, 500, { error: 'Failed to profile code complexity.' });
    }
  }

  // ── AI Code Reviewer ──────────────────────────────────────────────────────
  if (pathname === '/api/ai/review' && req.method === 'POST') {
    if (
      !applyRateLimit(
        req,
        res,
        sdlcAdvisorLimiter,
        'Too many review requests. Please try again later.'
      )
    ) {
      return;
    }

    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON body.' });
    }

    const problemName = String(payload.problemName || '').trim();
    const problemDescription = String(payload.problemDescription || '').trim();
    const code = String(payload.code || '');
    const language = String(payload.language || '').trim();

    if (!code) {
      return sendJson(res, 400, { error: 'Code is required for review.' });
    }

    const MAX_REVIEW_CODE_LENGTH = 20000;
    if (code.length > MAX_REVIEW_CODE_LENGTH) {
      return sendJson(res, 400, {
        error: `Code exceeds maximum length of ${MAX_REVIEW_CODE_LENGTH} characters.`,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return sendJson(res, 503, { error: 'AI reviewer unavailable (GEMINI_API_KEY not set).' });
    }

    const prompt = `You are a critical senior software engineer and static analysis tool. Analyze the following user code for the problem "${problemName}" (Language: ${language}).
Problem description (if any):
${problemDescription}

User Code:
\`\`\`${language}
${code}
\`\`\`

Perform an in-depth audit of the code. Look for:
1. Poor time/space complexity (e.g., O(N^2) where O(N) is possible).
2. Unsafe operations, memory leaks, or potential crash points.
3. Styling issues, bad practices, or un-idiomatic code.
4. Edge-case bugs, off-by-one errors, or incorrect logic.

You must return a JSON array of suggestions.
Each item in the array must be an object with the following exact keys:
- "lineStart": (number) 1-based start line number of the flagged code section.
- "lineEnd": (number) 1-based end line number of the flagged code section (inclusive).
- "severity": (string) either "warning" or "error".
- "message": (string) clear, concise description of the issue and why it is a problem.
- "suggestionContent": (string) the proposed code snippet that should replace the code from lineStart to lineEnd. Make sure this snippet integrates seamlessly as a drop-in replacement for the exact lines from lineStart to lineEnd.

Example format:
[
  {
    "lineStart": 5,
    "lineEnd": 8,
    "severity": "error",
    "message": "This linear search inside a loop causes O(N^2) complexity. Use a hash map for O(N) lookup.",
    "suggestionContent": "    if (seen.has(complement)) {\\n        return [seen.get(complement), i];\\n    }"
  }
]

CRITICAL RULES:
1. Only flag genuine issues. If the code is perfect, return an empty array [].
2. The lineStart and lineEnd must match the line numbers of the user code EXACTLY.
3. "suggestionContent" must be a direct replacement for the lines from lineStart to lineEnd (inclusive). Ensure correct indentation, newlines, and syntax so that replacing those lines with suggestionContent keeps the overall file syntax correct.
4. Return ONLY valid JSON. Do not include markdown code block tags in your raw response (like \`\`\`json) if possible, but if you do, the server will parse it. Ensure it parses as a valid JSON array.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      const result = await response.json();
      let raw = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) {
        return sendJson(res, 502, { error: 'No suggestions were generated. Please try again.' });
      }

      raw = raw.trim();
      if (raw.startsWith('```')) {
        raw = raw
          .replace(/^```(?:json)?\n?/, '')
          .replace(/\n?```$/, '')
          .trim();
      }

      let suggestions;
      try {
        suggestions = JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse Gemini review JSON:', raw);
        return sendJson(res, 502, { error: 'AI returned an invalid JSON response format.' });
      }

      const lines = code.split('\n');
      const totalLines = lines.length;

      const validSuggestions = (Array.isArray(suggestions) ? suggestions : []).map((s) => {
        const lineStart = Math.max(1, Math.min(totalLines, Number(s.lineStart)));
        const lineEnd = Math.max(lineStart, Math.min(totalLines, Number(s.lineEnd)));
        const severity = s.severity === 'error' ? 'error' : 'warning';
        return {
          lineStart,
          lineEnd,
          severity,
          message: String(s.message || 'AI Review Suggestion'),
          suggestionContent: String(s.suggestionContent || ''),
        };
      });

      return sendJson(res, 200, { success: true, suggestions: validSuggestions });
    } catch (error) {
      console.error('AI review error:', error);
      return sendJson(res, 500, { error: 'Failed to complete AI review.' });
    }
  }

  // ── Leaderboard ──────────────────────────────────────────────────────────
  if (pathname === '/api/leaderboard' && req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const parsedPage = parseInt(url.searchParams.get('page'), 10);
      const page = Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1);
      const parsedLimit = parseInt(url.searchParams.get('limit'), 10);
      const limit = Number.isNaN(parsedLimit) ? 10 : Math.min(Math.max(parsedLimit, 1), 50);
      const period = url.searchParams.get('period') || 'all';
      const offset = (page - 1) * limit;

      const now = Date.now();
      const users = await readUsers();
      const allLeaders = users
        .filter((u) => {
          if (period === 'all') return true;
          const ts = u.progressUpdatedAt || u.updatedAt || u.createdAt;
          if (!ts) return false;
          const elapsed = now - new Date(ts).getTime();
          if (period === 'week') return elapsed <= 7 * 24 * 60 * 60 * 1000;
          if (period === 'month') return elapsed <= 30 * 24 * 60 * 60 * 1000;
          return true;
        })
        .map((u) => ({
          id: u.id || u.email,
          name: u.name || 'Learner',
          xp: u.xp || 0,
          level: u.level || 1,
          avatar: u.avatar || '🚀',
        }))
        .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name))
        .map((u, index) => ({ ...u, rank: index + 1 }));

      const totalUsers = allLeaders.length;
      const totalPages = Math.ceil(totalUsers / limit);
      const paginatedUsers = allLeaders.slice(offset, offset + limit);

      const session = getSession(req);
      return sendJson(res, 200, {
        leaders: paginatedUsers,
        currentUserId: session?.sub || null,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          pageSize: limit,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        period,
      });
    } catch (err) {
      console.error('Leaderboard error:', err);
      return sendJson(res, 200, { leaders: [], currentUserId: null, pagination: { totalUsers: 0, totalPages: 1 } });
    }
  }

  // ── User Progress Sync ───────────────────────────────────────────────────
  if (pathname === '/api/progress' && req.method === 'PUT') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Authentication required.' });
    try {
      const body = await readJsonBody(req);
      const users = await readUsers();
      const idx = users.findIndex((u) => u.id === session.sub || u.email === session.email);
      if (idx !== -1) {
        users[idx].name = body.name;
        users[idx].xp = body.xp || 0;
        users[idx].level = body.level || 1;
        users[idx].avatar = body.avatar || '🚀';
        if (body.bio !== undefined) users[idx].bio = body.bio;
        if (body.badges) users[idx].badges = body.badges;
        if (body.languages) users[idx].languages = body.languages;
        if (body.projects) users[idx].projects = body.projects;
        if (body.activityData) users[idx].activityData = body.activityData;
      } else {
        users.push({
          id: session.sub,
          email: session.email,
          name: body.name,
          xp: body.xp || 0,
          level: body.level || 1,
          avatar: body.avatar || '🚀',
          bio: body.bio,
          badges: body.badges,
          languages: body.languages,
          projects: body.projects,
          activityData: body.activityData || {},
        });
      }
      await writeUsers(users);
      return sendJson(res, 200, { success: true });
    } catch (err) {
      console.error('Progress sync error:', err);
      return sendJson(res, 200, { success: false });
    }
  }

  return sendJson(res, 404, { error: 'Not found.' });
}

function resolveStaticPath(pathname) {
  const routes = {
    '/': 'index.html',
    '/login': 'pages/auth/login.html',
    '/login.html': 'pages/auth/login.html',
    '/profile': 'pages/profile/public-profile.html',
    '/signup': 'pages/auth/signup.html',
    '/signup.html': 'pages/auth/signup.html',
    '/verify-email': 'pages/auth/verify-email.html',
    '/verify-email.html': 'pages/auth/verify-email.html',
    '/community': 'pages/community/community/community.html',
    '/community.html': 'pages/community/community/community.html',
    '/rust-learning': 'pages/rust-academy/rust-academy.html',
    '/rust-learning.html': 'pages/rust-academy/rust-academy.html',
    '/rust-academy': 'pages/rust-academy/rust-academy.html',
    '/rust-academy.html': 'pages/rust-academy/rust-academy.html',
    '/python-learning': 'pages/learning/python-learning/python-learning.html',
    '/javascript-learning': 'pages/learning/javascript-learning/javascript-learning.html',
    '/dbms-learning': 'pages/learning/dbms-learning/dbms-learning.html',
    '/powerbi-learning': 'pages/learning/powerbi-learning/powerbi-learning.html',
    '/cplusplus-learning': 'pages/learning/cplusplus-learning/cplusplus-learning.html',
    '/learning/php': 'pages/learning/php-learning/php-learning.html',
    '/php-learning': 'pages/learning/php-learning/php-learning.html',
    '/learning/oop': 'pages/learning/oop-learning/oop-learning.html',
    '/oop-learning': 'pages/learning/oop-learning/oop-learning.html',
    '/feedback': 'pages/community/feedback/feedback.html',
    '/feedback.html': 'pages/community/feedback/feedback.html',
    '/memory-scanner': 'pages/tools/memory-scanner/memory-scanner.html',
    '/memory-scanner.html': 'pages/tools/memory-scanner/memory-scanner.html',
    '/algorithm-timeline': 'pages/visualizers/algorithm-timeline/algorithm-timeline.html',
    '/practice': 'pages/practice/problems.html',
    '/practice.html': 'pages/practice/problems.html',
    '/support-page': 'support-page/index.html',
    '/support-page/': 'support-page/index.html',
    '/leaderboard': 'pages/leaderboard/leaderboard.html',
    '/leaderboard.html': 'pages/leaderboard/leaderboard.html',
    '/leaderboard/preview': 'pages/leaderboard/preview.html',
    '/leaderboard/preview.html': 'pages/leaderboard/preview.html',
  };
  let mapped = routes[pathname];
  if (!mapped) {
    const basePath = pathname.slice(1);
    mapped = path.extname(basePath) ? basePath : basePath + '.html';
  }
  const filePath = path.resolve(ROOT, mapped);
  const rel = path.relative(ROOT, filePath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;

  // ── Arbitrary File Disclosure Prevention ──────────────────────────────────
  const fileName = path.basename(filePath);

  // 1. Block hidden files and sensitive directories
  if (
    fileName.startsWith('.') ||
    (rel.startsWith('data' + path.sep) && !fileName.endsWith('.js')) ||
    rel.startsWith('api' + path.sep) ||
    rel.startsWith('node_modules' + path.sep)
  ) {
    return null;
  }

  // 2. Block specific sensitive root files
  const sensitiveFiles = [
    'server.js',
    'firebase.js',
    'package.json',
    'package-lock.json',
    'vercel.json',
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
  if (ext === '.html') {
    return 'no-store, no-cache, must-revalidate, private';
  }
  if (ext === '.css' || ext === '.js' || ext === '.json') {
    return 'no-cache, public';
  }
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'].includes(ext)) {
    return 'public, max-age=86400';
  }
  if (['.woff', '.woff2', '.eot', '.ttf', '.otf'].includes(ext)) {
    return 'public, max-age=2592000, immutable';
  }
  return 'no-cache';
}

async function serveStatic(req, res, pathname) {
  const filePath = resolveStaticPath(pathname);
  if (!filePath) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  try {
    const stat = await fs.stat(filePath);
    const target = stat.isDirectory() ? path.join(filePath, 'index.html') : filePath;

    const fileStat = await fs.stat(target);
    const ext = path.extname(target);

    // ── Server-side auth gate ────────────────────────────────────────────────
    // A page may declare that it requires authentication with
    // <meta name="auth-required" content="true">. Enforce it here so access is
    // controlled by the server regardless of which URL reached the file — the
    // client-side gate (auth-gate.js) is cosmetic only. Read the HTML once and
    // reuse it below to avoid a second read.
    let htmlContent = null;
    if (ext === '.html') {
      htmlContent = await fs.readFile(target, 'utf-8');
      const requiresAuth =
        /<meta\b(?=[^>]*\sname\s*=\s*["']auth-required["'])(?=[^>]*\scontent\s*=\s*["']true["'])[^>]*>/i.test(
          htmlContent
        );
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
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
      'Cache-Control': cacheControl,
      ETag: etag,
    };

    // Handle If-None-Match conditional request
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag === etag) {
      headers['Content-Type'] = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(304, headers);
      return res.end();
    }

    let content;

    if (ext === '.html') {
      content = Buffer.from(htmlContent, 'utf-8');
      headers['Content-Security-Policy'] =
        `default-src 'self'; ` +
        `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://esm.sh https://cdn.socket.io; ` +
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.tailwindcss.com; ` +
        `font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; ` +
        `img-src 'self' data: https: blob:; ` +
        `connect-src 'self' https: wss:; ` +
        `frame-src 'self' blob: https://*.firebaseapp.com; ` +
        `object-src 'none'; ` +
        `base-uri 'self';`;
    } else {
      content = await fs.readFile(target);
    }

    headers['Content-Type'] = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, headers);
    res.end(content);
  } catch {
    await serve404Page(req, res);
  }
}

async function serve404Page(req, res) {
  try {
    const content = await fs.readFile(PAGE_404, 'utf8');
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

async function requestHandler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = normalizePathname(decodeURIComponent(url.pathname));

    const requestValidation = validateRequest(req);

    if (!requestValidation.valid) {
      return sendJson(res, requestValidation.status, {
        error: requestValidation.message,
      });
    }

    if (pathname.startsWith('/api/')) {
      return await handleApi(req, res, pathname);
    }

    if (pathname === '/logout') {
      return redirect(res, '/login', { 'Set-Cookie': clearAuthCookies() });
    }

    const authorization = authorizeRequest(req, pathname);

    if (!authorization.authorized) {
      return redirect(res, authorization.redirectTo);
    }

    return await serveStatic(req, res, pathname);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: 'Something went wrong.' });
  }
}

const app = express();
app.use('/api', apiRouter);
app.use(async (req, res, next) => {
  try {
    await requestHandler(req, res);
  } catch (err) {
    next(err);
  }
});
const server = http.createServer(app);

// ===== CODE ANALYSIS ENGINE =====
// Used by the POST /api/predict-acceptance route in handleApi().
function analyzeCode(code, language) {
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
  if (checkSyntaxErrors(code)) {
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
    summary: getSummary(score),
  };
}

// ===== HELPER FUNCTIONS =====

function checkTimeComplexity(code) {
  // Remove comments and string literals, then detect nested loops using word boundaries
  const sanitizedCode = code.replace(
    /\/\/.*|#.*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g,
    ''
  );
  const nestedLoops = (sanitizedCode.match(/\bfor\b/g) || []).length > 1;
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

function checkSyntaxErrors(code) {
  // Basic syntax check
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;

  return openBraces !== closeBraces || openParens !== closeParens;
}

function checkMissingImports(code, language) {
  if (language) {
    const lang = language.toLowerCase();
    // Snippet-based testing environments generally do not require explicit imports
    if (
      [
        'python',
        'javascript',
        'cpp',
        'c',
        'java',
        'ruby',
        'go',
        'rust',
        'c++',
        'py',
        'js',
      ].includes(lang)
    ) {
      return false;
    }
  }
  const imports = ['import', 'require', 'include', '#include'];
  const hasImport = imports.some((i) => code.includes(i));
  return !hasImport;
}

function hasUnusedVariables(code) {
  const vars = code.match(/let\s+(\w+)|const\s+(\w+)|var\s+(\w+)/g);
  if (!vars) return false;

  for (const v of vars) {
    const name = v.replace(/let |const |let /g, '');
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

// --- BATTLE MODE STATE ---
const matchmakingQueue = { Easy: [], Medium: [], Hard: [] };
const activeBattles = new Map();

function serializeRoom(room) {
  return {
    id: room.id,
    hostId: room.hostId,
    hostName: room.hostName,
    config: room.config,
    status: room.status,
    participants: room.participants,
    currentProblem: room.currentProblem,
    timerSeconds: room.timerSeconds,
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
    void 0;
  } else {
    if (room.hostId === userId) {
      const nextHostId = Object.keys(room.participants)[0];
      room.hostId = nextHostId;
      room.hostName = room.participants[nextHostId].name;
      void 0;
    }
    io.to(roomId).emit('study-room-updated', serializeRoom(room));
  }
}

io.on('connection', (socket) => {
  setupWebRTCSignaling(socket);
  void 0;

  // ==========================================
  // AI INTERVIEWER - GEMINI API INTEGRATION
  // ==========================================
  socket.on('ai-evaluate-code', async (data = {}) => {
    // Bot Fix 1: Validate payload first
    if (
      typeof data !== 'object' ||
      typeof data.code !== 'string' ||
      typeof data.language !== 'string' ||
      typeof data.problem !== 'string'
    ) {
      return socket.emit('ai-interviewer-feedback', { hint: 'Unable to analyze code right now.' });
    }

    void 0;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        socket.emit('ai-interviewer-feedback', {
          hint: 'Backend Error: GEMINI_API_KEY is missing in .env!',
        });
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
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0) {
        let aiHint = result.candidates[0].content.parts[0].text;
        aiHint = aiHint.replace(/\*/g, '').replace(/`/g, ''); // Clean markdown
        socket.emit('ai-interviewer-feedback', { hint: aiHint });
      } else {
        socket.emit('ai-interviewer-feedback', {
          hint: 'Hmm, your logic is interesting... keep going!',
        });
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      socket.emit('ai-interviewer-feedback', {
        hint: 'My AI brain is taking a break. Keep coding!',
      });
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
          // eslint-disable-next-line no-control-regex
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
      imageData: { type: 'string', string: true },
    });
    if (!valid) return;
    socket.to(valid.roomId).emit('receive-draw', valid);
  });

  // Clear board
  socket.on('clear-board', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
    });
    if (!valid) return;
    socket.to(valid.roomId).emit('receive-clear');
  });

  // Shared notes
  socket.on('share-notes', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
      text: { type: 'string', string: true, maxLength: MAX_TEXT_LENGTH },
    });
    if (!valid) return;
    socket.to(valid.roomId).emit('receive-notes', valid.text);
  });

  // Chat messages
  socket.on('chat-message', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
      userName: { type: 'string', string: true },
      text: { type: 'string', string: true, maxLength: MAX_TEXT_LENGTH },
    });
    if (!valid) return;
    socket.to(valid.roomId).emit('chat-message', valid);
  });

  // ── VOICE CHAT (WebRTC signaling) ──

  socket.on('voice-join', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
      userId: { type: 'string', string: true },
    });
    if (!valid) return;
    socket.to(valid.roomId).emit('voice-user-joined', { userId: valid.userId });
  });

  socket.on('voice-leave', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
      userId: { type: 'string', string: true },
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
      from: { type: 'string', string: true },
    });
    if (!valid) return;
    const targetSocketId = userSocketMap.get(valid.to);
    if (targetSocketId)
      io.to(targetSocketId).emit('voice-offer', { offer: valid.offer, from: valid.from });
  });

  socket.on('voice-answer', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
      answer: { type: 'object', required: true },
      to: { type: 'string', required: true },
      from: { type: 'string', string: true },
    });
    if (!valid) return;
    const targetSocketId = userSocketMap.get(valid.to);
    if (targetSocketId)
      io.to(targetSocketId).emit('voice-answer', { answer: valid.answer, from: valid.from });
  });

  socket.on('voice-ice', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
      candidate: { type: 'object', required: true },
      to: { type: 'string', required: true },
      from: { type: 'string', string: true },
    });
    if (!valid) return;
    const targetSocketId = userSocketMap.get(valid.to);
    if (targetSocketId)
      io.to(targetSocketId).emit('voice-ice', { candidate: valid.candidate, from: valid.from });
  });

  // ── BATTLE ROYALE MODE ──

  socket.on('battle-join', (data) => {
    const valid = validateSocketInput(data, {
      battleId: { type: 'string', required: true },
      userId: { type: 'string', string: true },
    });
    if (!valid) return;
    socket.join(`battle_${valid.battleId}`);
    socket.battleId = valid.battleId;
    socket.battleUserId = valid.userId;
    socket.to(`battle_${valid.battleId}`).emit('battle-user-joined', { userId: valid.userId });

    // Send all existing updates to the joining user for synchronization
    const battle = activeBattles.get(valid.battleId);
    if (battle && battle.updates) {
      socket.emit('battle-init-state', {
        updates: battle.updates,
      });
    }
  });

  socket.on('battle-code-update', (data) => {
    const valid = validateSocketInput(data, {
      battleId: { type: 'string', required: true },
      userId: { type: 'string', required: true },
      update: { type: 'string', required: true, maxLength: 50000 },
    });
    if (!valid) return;

    // Save update in room state
    const battle = activeBattles.get(valid.battleId);
    if (battle) {
      if (!battle.updates) {
        battle.updates = [];
      }
      battle.updates.push(valid.update);
    }

    socket.to(`battle_${valid.battleId}`).emit('battle-code-update', valid);
  });

  socket.on('battle-cursor-update', (data) => {
    const valid = validateSocketInput(data, {
      battleId: { type: 'string', required: true },
      userId: { type: 'string', required: true },
      position: { type: 'object', required: true },
    });
    if (!valid) return;
    socket.to(`battle_${valid.battleId}`).emit('battle-cursor-update', valid);
  });

  socket.on('battle-progress-update', (data) => {
    const valid = validateSocketInput(data, {
      battleId: { type: 'string', required: true },
      userId: { type: 'string', required: true },
      progress: { type: 'number', required: true },
    });
    if (!valid) return;
    socket.to(`battle_${valid.battleId}`).emit('battle-progress-update', valid);
  });

  // ── IN-MEMORY MATCHMAKING LOGIC ──
  socket.on('find-match', (data) => {
    const valid = validateSocketInput(data, {
      userId: { type: 'string', required: true },
      userName: { type: 'string', required: true },
      difficulty: { type: 'string', required: true },
    });
    if (!valid) return;

    const diff = valid.difficulty;
    if (!matchmakingQueue[diff]) matchmakingQueue[diff] = [];

    // Check if someone is already waiting
    const queue = matchmakingQueue[diff];
    const opponentIdx = queue.findIndex((u) => u.userId !== valid.userId);

    if (opponentIdx !== -1) {
      // Match found!
      const opponent = queue.splice(opponentIdx, 1)[0];
      const battleId = crypto.randomUUID();

      const problemKeys = Object.keys(TEST_CASES);
      const chosenTitle = problemKeys[Math.floor(Math.random() * problemKeys.length)];
      const problem = TEST_CASES[chosenTitle];

      const battleData = {
        id: battleId,
        difficulty: diff,
        status: 'active',
        problemTitle: chosenTitle,
        problemDescription: `Implement ${problem.func}. Test cases await.`,
        participants: {
          [valid.userId]: { name: valid.userName, progress: 0, status: 'active' },
          [opponent.userId]: { name: opponent.userName, progress: 0, status: 'active' },
        },
        winner: null,
      };

      activeBattles.set(battleId, battleData);

      // Join both to the socket room
      socket.join(`battle_${battleId}`);
      const opponentSocket = io.sockets.sockets.get(opponent.socketId);
      if (opponentSocket) opponentSocket.join(`battle_${battleId}`);

      // Emit match-found to both
      io.to(`battle_${battleId}`).emit('match-found', {
        battleId,
        battleData,
        opponentName: { [valid.userId]: opponent.userName, [opponent.userId]: valid.userName },
      });
    } else {
      // Add to queue
      // Remove existing entries for this user first
      matchmakingQueue[diff] = queue.filter((u) => u.userId !== valid.userId);
      matchmakingQueue[diff].push({
        userId: valid.userId,
        userName: valid.userName,
        socketId: socket.id,
      });
    }
  });

  // ── Multiplayer Battle Live Telemetry ──
  socket.on('battle-typing', (data) => {
    const valid = validateSocketInput(data, {
      battleId: { type: 'string', required: true },
      userId: { type: 'string', required: true },
      typing: { type: 'boolean', required: true },
    });
    if (!valid) return;
    socket.to(`battle_${valid.battleId}`).emit('opponent:typing', {
      userId: valid.userId,
      typing: valid.typing,
    });
  });

  socket.on('battle-editor-state', (data) => {
    const valid = validateSocketInput(data, {
      battleId: { type: 'string', required: true },
      userId: { type: 'string', required: true },
      charCount: { type: 'number', required: true },
      syntaxErrors: { type: 'number', required: true },
      wpm: { type: 'number', required: true },
    });
    if (!valid) return;
    socket.to(`battle_${valid.battleId}`).emit('opponent:editor-state', {
      userId: valid.userId,
      charCount: valid.charCount,
      syntaxErrors: valid.syntaxErrors,
      wpm: valid.wpm,
    });
  });

  socket.on('battle-submit', (data) => {
    const valid = validateSocketInput(data, {
      battleId: { type: 'string', required: true },
      userId: { type: 'string', required: true },
      code: { type: 'string', required: true },
    });
    if (!valid) return;

    const battle = activeBattles.get(valid.battleId);
    if (!battle || battle.status !== 'active') {
      socket.emit('battle-submit-result', { error: 'Battle not active.' });
      return;
    }

    let results = [];
    try {
      results = runDetailedTestCases(battle.problemTitle, valid.code);
    } catch (e) {
      results = [false];
    }
    const passed = results.length > 0 && results.every((r) => r === true);

    // Broadcast test run results to the room for opponent telemetry grid
    socket.to(`battle_${valid.battleId}`).emit('opponent:test-run', {
      userId: valid.userId,
      results: results,
    });

    if (passed) {
      battle.status = 'completed';
      battle.winner = valid.userId;
      delete battle.updates;
      io.to(`battle_${valid.battleId}`).emit('battle-over', {
        winnerId: valid.userId,
        winnerName: battle.participants[valid.userId].name,
        badge: 'Speed Demon',
        xpAwarded: 100, // Mock XP
      });
    } else {
      socket.emit('battle-submit-result', {
        success: false,
        message: 'Tests failed. Keep trying!',
        results: results,
      });
    }
  });

  // ── ESCAPE ROOM MODE ──

  socket.on('escape-join', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
      userId: { type: 'string', required: true },
      userName: { type: 'string', required: true },
    });
    if (!valid) return;
    const roomName = `escape_${valid.roomId}`;
    socket.join(roomName);
    socket.escapeRoomId = valid.roomId;
    socket
      .to(roomName)
      .emit('escape-user-joined', { userId: valid.userId, userName: valid.userName });
  });

  socket.on('escape-code-update', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
      code: { type: 'string', string: true },
    });
    if (!valid || socket.escapeRoomId !== valid.roomId) return;
    socket.to(`escape_${valid.roomId}`).emit('escape-code-update', valid);
  });

  socket.on('escape-chat', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
      userName: { type: 'string', required: true },
      message: { type: 'string', string: true },
    });
    if (!valid || socket.escapeRoomId !== valid.roomId) return;
    socket.to(`escape_${valid.roomId}`).emit('escape-chat', valid);
  });

  socket.on('escape-puzzle-solved', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
      userId: { type: 'string', required: true },
      userName: { type: 'string', required: true },
      puzzleId: { type: 'string', required: true },
    });
    if (!valid || socket.escapeRoomId !== valid.roomId) return;
    socket.to(`escape_${valid.roomId}`).emit('escape-puzzle-solved', valid);
  });

  // ── END OF ADDITIONS ──

  // ── COLLABORATIVE STUDY ROOM EVENTS ──
  socket.on('join-study-room', async ({ roomId, userId, userName }) => {
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
        config: {
          maxParticipants: 4,
          timerDuration: 600,
          difficulty: 'Medium',
          topic: 'arrays',
          problems: [],
        },
        status: 'lobby',
        participants: {},
        currentProblem: null,
        timerSeconds: 0,
        timerInterval: null,
      };
      studyRooms.set(roomId, room);
    }

    if (!room.participants[authUserId]) {
      room.participants[authUserId] = {
        id: authUserId,
        name: authUserName,
        status: room.status === 'playing' ? 'solving' : 'lobby',
        score: 0,
        timeTaken: null,
        submittedCode: '',
      };
    }

    void 0;
    io.to(roomId).emit('study-room-updated', serializeRoom(room));
  });

  socket.on('start-study-round', ({ roomId, problem }) => {
    const room = studyRooms.get(roomId);
    if (!room) return;
    if (socket.userId !== room.hostId) {
      socket.emit('error', { message: 'Only host can start the study round' });
      return;
    }

    room.status = 'playing';
    room.currentProblem = problem;
    room.timerSeconds = room.config.timerDuration;

    for (const pid in room.participants) {
      room.participants[pid].status = 'solving';
      room.participants[pid].timeTaken = null;
      room.participants[pid].submittedCode = '';
      room.participants[pid].score = 0;
    }

    io.to(roomId).emit('study-round-started', {
      problem,
      timerDuration: room.config.timerDuration,
      roomState: serializeRoom(room),
    });

    if (room.timerInterval) clearInterval(room.timerInterval);
    room.timerInterval = setInterval(() => {
      room.timerSeconds--;
      io.to(roomId).emit('study-timer-tick', { timerSeconds: room.timerSeconds });

      if (room.timerSeconds <= 0) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
        room.status = 'recap';
        io.to(roomId).emit('study-round-ended', serializeRoom(room));
      }
    }, 1000);
  });

  socket.on('submit-study-solution', ({ roomId, userId, code, timeTaken, success }) => {
    const room = studyRooms.get(roomId);
    if (!room) return;

    const participant = room.participants[userId];
    if (participant) {
      participant.status = 'completed';
      participant.submittedCode = code;
      participant.timeTaken = timeTaken;
      participant.score = success ? Math.max(10, Math.floor(room.timerSeconds / 10)) : 0;
    }

    const allDone = Object.values(room.participants).every((p) => p.status === 'completed');
    if (allDone) {
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }
      room.status = 'recap';
      io.to(roomId).emit('study-round-ended', serializeRoom(room));
    } else {
      io.to(roomId).emit('study-room-updated', serializeRoom(room));
    }
  });

  socket.on('leave-study-room', ({ roomId, userId }) => {
    cleanupStudyUser(socket, roomId, userId);
  });

  socket.on('study-chat-message', ({ roomId, userName, text }) => {
    io.to(roomId).emit('receive-study-chat', { userName, text });
  });

  // ============================================================
  // COLLABORATIVE WHITEBOARD (#1780)
  // ============================================================

  socket.on('wb-join', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
      userId: { type: 'string', required: true },
      userName: { type: 'string', required: true },
      color: { type: 'string', required: true },
    });
    if (!valid) return;

    const wbRoom = 'wb_' + valid.roomId;
    socket.join(wbRoom);
    socket.wbRoomId = valid.roomId;
    socket.wbUserId = valid.userId;

    socket.to(wbRoom).emit('wb-user-joined', valid);
  });

  socket.on('wb-stroke', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
      points: { type: 'object', required: true }, // array of points
      color: { type: 'string', required: true },
      size: { type: 'number', required: true },
      tool: { type: 'string', required: true },
    });
    if (!valid) return;
    socket.to('wb_' + valid.roomId).emit('wb-stroke', valid);
  });

  socket.on('wb-shape', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
      shape: { type: 'string', required: true },
      x0: { type: 'number', required: true },
      y0: { type: 'number', required: true },
      x1: { type: 'number', required: true },
      y1: { type: 'number', required: true },
      color: { type: 'string', required: true },
      size: { type: 'number', required: true },
    });
    if (!valid) return;
    socket.to('wb_' + valid.roomId).emit('wb-shape', valid);
  });

  socket.on('wb-text', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
      text: { type: 'string', required: true },
      x: { type: 'number', required: true },
      y: { type: 'number', required: true },
      color: { type: 'string', required: true },
      fontSize: { type: 'number', required: true },
    });
    if (!valid) return;
    socket.to('wb_' + valid.roomId).emit('wb-text', valid);
  });

  socket.on('wb-clear', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
    });
    if (!valid) return;
    socket.to('wb_' + valid.roomId).emit('wb-clear');
  });

  socket.on('wb-undo', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
      imageData: { type: 'string', required: true },
    });
    if (!valid) return;
    socket.to('wb_' + valid.roomId).emit('wb-undo', valid);
  });

  socket.on('wb-cursor', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
      userId: { type: 'string', required: true },
      userName: { type: 'string', required: true },
      x: { type: 'number', required: true },
      y: { type: 'number', required: true },
      color: { type: 'string', required: true },
    });
    if (!valid) return;
    socket.to('wb_' + valid.roomId).emit('wb-cursor', valid);
  });

  socket.on('wb-leave', (data) => {
    const valid = validateSocketInput(data, {
      roomId: { type: 'string', required: true },
      userId: { type: 'string', required: true },
    });
    if (!valid) return;
    const wbRoom = 'wb_' + valid.roomId;
    socket.to(wbRoom).emit('wb-user-left', valid);
    socket.leave(wbRoom);
  });

  // Handle clean disconnect for whiteboard
  socket.on('disconnect', () => {
    if (socket.wbRoomId && socket.wbUserId) {
      const wbRoom = 'wb_' + socket.wbRoomId;
      socket.to(wbRoom).emit('wb-user-left', { userId: socket.wbUserId });
    }
    // Handle clean disconnect for Battle Mode CRDT presence and cursors
    if (socket.battleId && socket.battleUserId) {
      socket
        .to(`battle_${socket.battleId}`)
        .emit('battle-user-left', { userId: socket.battleUserId });
    }
  });

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    // Store user mapping
    userSocketMap.set(userId, socket.id);
    socket.userId = userId;
    socket.roomId = roomId;
    void 0;

    socket.to(roomId).emit('user-connected', userId);

    socket.on('disconnect', () => {
      if (socket.userId) {
        userSocketMap.delete(socket.userId);
        if (socket.roomId) {
          socket.to(socket.roomId).emit('user-disconnected', socket.userId);
        }
      }
      if (socket.studyRoomId && socket.userId) {
        cleanupStudyUser(socket, socket.studyRoomId, socket.userId);
      }
    });
  });
});
// -----------------------------------------

export {
  server,
  requestHandler,
  // Expose internal auth endpoint handler for Vercel function delegation.
  handleApi,
  hashPassword,
  passwordMatches,
  applySM2,
  validateSignup,
  updateMemoryStore,
  readMemoryStore,
  appendToJsonArrayFile,
  sendJson,
  readJsonBody,
  getSession,
  updateExecutionStore,
  applyRateLimit,
  logErrorLimiter,
  CLIENT_ERRORS_FILE,
  DATA_DIR,
  MAX_CLIENT_ERROR_ENTRIES,
  verifyCsrfToken,
};

if (process.env.VERCEL === '1') {
  validateEnv();
}

const vercelHandler =
  process.env.VERCEL === '1' ? async (req, res) => requestHandler(req, res) : undefined;

export default vercelHandler;

if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  loadEnvFile()
    .then(() => {
      validateEnv();
      const port = Number(process.env.PORT || 3000);
      const host = process.env.HOST || '127.0.0.1';

      server.listen(port, host, () => {
        // listening started
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`\n❌ Port ${port} is already in use.`);
          console.error(`   Stop the existing server first, then run: npm run dev\n`);
          process.exit(1);
        } else {
          throw err;
        }
      });
    })
    .catch((error) => {
      console.error('Failed to load environment configuration:', error);
      process.exit(1);
    });
}
