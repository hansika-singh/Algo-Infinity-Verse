import fs from "fs/promises";
import path from "path";
import {
  hashPassword as hashPasswordSecure,
  passwordMatches as passwordMatchesSecure,
} from "../services/auth.service.js";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  base64Url,
  fromBase64Url,
  sessionSecret,
  sign,
  createSessionToken,
  verifySessionToken,
  parseCookies,
  getSession,
  sessionCookie,
  clearSessionCookie,
} from "./sessionToken.js";
import { COLLECTIONS } from "../../firebase.js";

export const DATA_DIR = path.join(process.cwd(), "data");

export {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  base64Url,
  fromBase64Url,
  sessionSecret,
  sign,
  createSessionToken,
  verifySessionToken,
  parseCookies,
  getSession,
  sessionCookie,
  clearSessionCookie,
};

// Response Helpers
export function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  });
  res.end(JSON.stringify(body));
}

export function redirect(res, location, headers = {}) {
  res.writeHead(302, { Location: location, ...headers });
  res.end();
}

export async function readJsonBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1024 * 1024)
      throw new Error("Request body is too large.");
  }
  return body ? JSON.parse(body) : {};
}

// Path Helpers
export function normalizePathname(pathname) {
  if (!pathname) return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

// Protected Routes
export function isProtectedRoute(pathname) {
  const protectedPaths = new Set([
    "/community",
    "/community.html",
    "/support-page",
    "/support-page/",
    "/support-page/index.html",
  ]);
  return protectedPaths.has(pathname);
}

// Request Validation
export function validateRequest(req) {
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

// Rate Limiting Helpers
export function getClientIdentifier(req) {
  const remoteAddress = req.socket?.remoteAddress || "unknown";
  return remoteAddress;
}

export async function normalizeAuthDelay() {
  return new Promise((resolve) => setTimeout(resolve, 500));
}

// User Functions
export async function readUsers() {
  const DATA_DIR = path.join(process.cwd(), "data");
  const USERS_FILE = path.join(DATA_DIR, "users.json");
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

export async function writeUsers(users) {
  const DATA_DIR = path.join(process.cwd(), "data");
  const USERS_FILE = path.join(DATA_DIR, "users.json");
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`);
}

export async function getUserByEmail(email, useFirestore = false, db = null) {
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

export async function createUser(userData, useFirestore = false, db = null) {
  if (!useFirestore) {
    const users = await readUsers();
    users.push(userData);
    await writeUsers(users);
    return userData;
  }
  const docRef = await db.collection(COLLECTIONS.USERS).add(userData);
  return { ...userData, id: docRef.id };
}

// Password Functions — delegate to the PBKDF2 implementation in
// auth.service.js so every caller gets real hashing/verification instead of
// storing and comparing plaintext passwords.
export function hashPassword(password) {
  return hashPasswordSecure(password);
}

export function passwordMatches(password, stored) {
  return passwordMatchesSecure(password, stored);
}