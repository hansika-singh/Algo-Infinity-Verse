import crypto from "crypto";
import {
  getSession, sendJson, readJsonBody, createSessionToken,
  sessionCookie, clearSessionCookie,
  readUsers, writeUsers, getUserByEmail, createUser,
  hashPassword, passwordMatches, normalizeAuthDelay,createUserAtomic
} from "../utils/helpers.js";
import { getClientIdentifier, isLoginRateLimited, LOGIN_WINDOW_MS } from "../services/auth.service.js";
import { applyRateLimit, signupLimiter, loginLimiter } from "../utils/rateLimiter.js";
import { initializeFirebase, COLLECTIONS } from "../../firebase.js";
import { validateAndNormalizeEmail } from "../utils/emailValidation.js";

function validateSignup({ name, email, password, confirmPassword }) {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const rawPassword = String(password || "");
  const rawConfirm = String(confirmPassword || "");

  if (cleanName.length < 2) return { isValid: false, error: "Name must be at least 2 characters." };

  const emailValidation = validateAndNormalizeEmail(email);
  if (!emailValidation.valid) {
    return { isValid: false, error: emailValidation.error };
  }

  if (rawPassword.length < 8) return { isValid: false, error: "Password must be at least 8 characters." };
  if (!/[a-z]/.test(rawPassword) || !/[A-Z]/.test(rawPassword) || !/\d/.test(rawPassword)) {
    return { isValid: false, error: "Password must include uppercase, lowercase, and a number." };
  }
  if (rawPassword !== rawConfirm) return { isValid: false, error: "Passwords do not match." };

  return { isValid: true, normalizedEmail: emailValidation.normalizedEmail, error: null };

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
  if (!applyRateLimit(req, res, signupLimiter, "Too many signup attempts. Please try again later.")) {
    return;
  }

  const payload = await readJsonBody(req);
  const validationResult = validateSignup(payload);
  if (!validationResult.isValid) return sendJson(res, 400, { error: validationResult.error });

  const db = initializeFirebase();
  const useFirestore = !!db;

  const email = validationResult.normalizedEmail;

  // ✅ Prepare user object
  const user = {
    id: crypto.randomUUID(),
    name: String(payload.name).trim(),
    email,
    password: hashPassword(String(payload.password)),
    createdAt: new Date().toISOString(),
    isDeactivated: false,
    deactivatedAt: null,
  };

  try {
    // ✅ ATOMIC CREATE: Checking and Creating in a single go
    const createdUser = await createUserAtomic(user, useFirestore, db);

    const token = createSessionToken(createdUser);
    return sendJson(
      res,
      201,
      { user: { id: createdUser.id, name: createdUser.name, email: createdUser.email } },
      { "Set-Cookie": sessionCookie(token, req) },
    );
  } catch (error) {
    // ✅ Handle Atomic duplicate error
    if (error.message === 'User already exists') {
      await normalizeAuthDelay(); // Security delay
      return sendJson(res, 200, {
        message: "If this email is registered, you will receive a verification email."
      });
    }
    console.error('Atomic create error:', error);
    return sendJson(res, 500, { error: 'Failed to create user' });
  }
}

  export async function handleLogin(req, res) {
    const clientId = getClientIdentifier(req);

    if (isLoginRateLimited(clientId)) {
      void 0;
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

    const db = initializeFirebase();
    const useFirestore = !!db;

    const user = await getUserByEmail(email, useFirestore, db);

    if (!user || !passwordMatches(password, user.password)) {
      await normalizeAuthDelay();
      return sendJson(res, 401, { error: "Invalid email or password." });
    }

    if (user.isDeactivated) {
      user.isDeactivated = false;
      user.deactivatedAt = null;
    }

    if (useFirestore) {
      await db.collection(COLLECTIONS.USERS).doc(user.id).update({
        isDeactivated: user.isDeactivated,
        deactivatedAt: user.deactivatedAt,
      });
    } else {
      const users = await readUsers();
      const index = users.findIndex((u) => u.id === user.id);
      if (index !== -1) {
        users[index] = user;
        await writeUsers(users);
      }
    }

    loginLimiter.reset(getClientIdentifier(req));

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