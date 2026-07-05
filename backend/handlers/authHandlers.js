import crypto from "crypto";
import { 
  getSession, sendJson, readJsonBody, createSessionToken, 
  sessionCookie, clearSessionCookie, getClientIdentifier,
  readUsers, writeUsers, getUserByEmail, createUser,
  hashPassword, passwordMatches, normalizeAuthDelay
} from "../utils/helpers.js";

// Rate limiting setup
const SIGNUP_RATE_LIMIT = 5;
const SIGNUP_WINDOW_MS = 15 * 60 * 1000;
const signupAttempts = new Map();

const LOGIN_RATE_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginFailures = new Map();

let db = null;
let useFirestore = false;

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

function isLoginRateLimited(identifier) {
  const now = Date.now();
  const attempts = loginFailures.get(identifier) || [];
  const recent = attempts.filter((t) => now - t < LOGIN_WINDOW_MS);
  loginFailures.set(identifier, recent);
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

function validateSignup({ name, email, password, confirmPassword }) {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const rawPassword = String(password || "");
  const rawConfirm = String(confirmPassword || "");

  if (cleanName.length < 2) return "Name must be at least 2 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return "Enter a valid email address.";
  }
  if (rawPassword.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(rawPassword) || !/[A-Z]/.test(rawPassword) || !/\d/.test(rawPassword)) {
    return "Password must include uppercase, lowercase, and a number.";
  }
  if (rawPassword !== rawConfirm) return "Passwords do not match.";
  return null;
}

export async function handleGuestLogin(req, res) {
  try {
    const guestId = crypto.randomUUID();
    const guestUser = {
      id: `guest-${guestId}`,
      name: "Guest",
      email: `guest-${guestId}@local`,
    };
    const token = createSessionToken(guestUser);
    return sendJson(
      res, 200,
      { authenticated: true, user: { id: guestUser.id, name: guestUser.name, email: guestUser.email } },
      { "Set-Cookie": sessionCookie(token, req) },
    );
  } catch (err) {
    console.error("[guest] Unexpected error:", err);
    return sendJson(res, 500, { error: "Guest login failed. Please try again." });
  }
}

export async function handleSignup(req, res) {
  const clientId = getClientIdentifier(req);

  if (isSignupRateLimited(clientId)) {
    await normalizeAuthDelay();
    return sendJson(res, 429, {
      error: "Too many signup attempts. Please try again later.",
    });
  }

  recordSignupAttempt(clientId);

  const payload = await readJsonBody(req);
  const validationError = validateSignup(payload);
  if (validationError) return sendJson(res, 400, { error: validationError });

  const email = String(payload.email).trim().toLowerCase();
  const existing = useFirestore
    ? await getUserByEmail(email)
    : (await readUsers()).find((user) => user.email === email);
  
  if (existing) {
    await normalizeAuthDelay();
    console.warn("[signup] duplicate email attempt", {
      email,
      ip: clientId,
      at: new Date().toISOString(),
    });
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

export async function handleLogin(req, res) {
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
        error: "Too many failed login attempts. Please wait 15 minutes before trying again.",
        retryAfterSeconds: Math.ceil(LOGIN_WINDOW_MS / 1000),
      },
      { "Retry-After": String(Math.ceil(LOGIN_WINDOW_MS / 1000)) },
    );
  }

  const payload = await readJsonBody(req);
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");
  const user = useFirestore
    ? await getUserByEmail(email)
    : (await readUsers()).find((candidate) => candidate.email === email);

  if (!user || !passwordMatches(password, user.password)) {
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

  clearLoginFailures(clientId);

  const token = createSessionToken(user);
  return sendJson(
    res,
    200,
    { user: { id: user.id, name: user.name, email: user.email } },
    { "Set-Cookie": sessionCookie(token, req) },
  );
}

export async function handleLogout(req, res) {
  return sendJson(
    res,
    200,
    { ok: true },
    { "Set-Cookie": clearSessionCookie() },
  );
}

export async function handleDeactivateAccount(req, res) {
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
    { "Set-Cookie": clearSessionCookie() },
  );
}

export async function handleSession(req, res) {
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