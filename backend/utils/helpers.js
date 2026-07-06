import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

export const SESSION_COOKIE = "aiv_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const DATA_DIR = path.join(process.cwd(), "data");

// JWT Functions
export function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function fromBase64Url(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

export function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production.");
  }
  return "dev-only-change-me-with-SESSION_SECRET-before-deploying";
}

export function sign(value) {
  return crypto
    .createHmac("sha256", sessionSecret())
    .update(value)
    .digest("base64url");
}

export function createSessionToken(user) {
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

export function verifySessionToken(token) {
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

// Cookie Functions
export function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, part) => {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName) return cookies;
    cookies[rawName] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
}

export function getSession(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return verifySessionToken(cookies[SESSION_COOKIE]);
}

export function sessionCookie(token, req) {
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

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

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
  // Firestore implementation
  return null;
}

export async function createUser(userData, useFirestore = false, db = null) {
  if (!useFirestore) {
    const users = await readUsers();
    users.push(userData);
    await writeUsers(users);
    return userData;
  }
  // Firestore implementation
  return userData;
}

// Password Functions (placeholder)
export function hashPassword(password) {
  // Implement actual password hashing
  return password; // Placeholder
}

export function passwordMatches(password, hash) {
  // Implement actual password verification
  return password === hash; // Placeholder
}