import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";

let db = null;
let useFirestore = false;

function initFirebase() {
  if (getApps().length > 0) {
    db = getFirestore();
    useFirestore = true;
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("Firebase credentials not set.");
    return;
  }

  try {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    db = getFirestore();
    useFirestore = true;
  } catch (e) {
    console.error(e);
  }
}

initFirebase();

const SESSION_COOKIE = "aiv_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const PBKDF2_ITERATIONS = 210000;
const PASSWORD_KEY_LENGTH = 32;

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
    .filter(Boolean)
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

function isRateLimited(identifier) {
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
// ────────────────────────────────────────────────────────────────────────────

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

function b64u(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createSessionToken(user) {
  const header = b64u(
    JSON.stringify({
      alg: "HS256",
      typ: "JWT",
    })
  );

  const payload = b64u(
    JSON.stringify({
      sub: user.id,
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    })
  );

  return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
}

function hashPassword(
  password,
  salt = crypto.randomBytes(16).toString("hex")
) {
  return {
    salt,
    hash: crypto
      .pbkdf2Sync(
        password,
        salt,
        PBKDF2_ITERATIONS,
        PASSWORD_KEY_LENGTH,
        "sha256"
      )
      .toString("hex"),
    iterations: PBKDF2_ITERATIONS,
    digest: "sha256",
  };
}

function sessionCookie(token) {
  const secure = process.env.VERCEL === "1";

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

async function readUsers() {
  if (!useFirestore) return [];

  try {
    const snapshot = await db.collection("users").get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function createUserTransaction(user) {
  if (!useFirestore) {
    throw new Error("Firestore unavailable");
  }

  const existing = await db
    .collection("users")
    .where("email", "==", user.email)
    .limit(1)
    .get();

  if (!existing.empty) {
    throw new Error("DUPLICATE_USER");
  }

  const docRef = await db.collection("users").add(user);

  return docRef;
}

async function rollbackUserCreation(docRef) {
  if (!docRef) return;

  try {
    await docRef.delete();
  } catch (error) {
    console.error("Rollback failed:", error);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  // ── Rate limit check ───────────────────────────────────────────────────────
  const clientId = getClientIdentifier(req);

  if (isRateLimited(clientId)) {
    await normalizeAuthDelay();
    return res.status(429).json({
      error: "Too many signup attempts. Please try again later.",
    });
  }

  // Record the attempt before any async work so every request counts,
  // including ones that ultimately fail validation or find a duplicate.
  recordSignupAttempt(clientId);
  // ──────────────────────────────────────────────────────────────────────────

  try {
    const {
      name,
      email,
      password,
      confirmPassword,
    } = req.body;

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();

    const rawPassword = String(password || "");
    const rawConfirmPassword = String(confirmPassword || "");

    if (cleanName.length < 2) {
      return res.status(400).json({
        error: "Name must be at least 2 characters.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        error: "Enter a valid email address.",
      });
    }

    if (rawPassword.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters.",
      });
    }

    if (
      !/[a-z]/.test(rawPassword) ||
      !/[A-Z]/.test(rawPassword) ||
      !/\d/.test(rawPassword)
    ) {
      return res.status(400).json({
        error:
          "Password must include uppercase, lowercase, and a number.",
      });
    }

    if (rawPassword !== rawConfirmPassword) {
      return res.status(400).json({
        error: "Passwords do not match.",
      });
    }

    const users = await readUsers();

    if (users.some((user) => user.email === cleanEmail)) {
      // Normalize response time so a duplicate is indistinguishable from a
      // real signup by timing — a real signup always runs PBKDF2 before
      // responding, so we must delay here to match that latency profile.
      await normalizeAuthDelay();
      console.warn("[signup] duplicate email attempt", {
        email: cleanEmail,
        ip: clientId,
        at: new Date().toISOString(),
      });
      // Return a generic 200 that is indistinguishable from a real signup
      // success so callers cannot enumerate registered email addresses.
      // No session cookie is issued — the submitter has not authenticated.
      return res.status(200).json({ ok: true });
    }

    const user = {
      id: crypto.randomUUID(),
      name: cleanName,
      email: cleanEmail,
      password: hashPassword(rawPassword),
      xp: 0,
      level: 1,
      avatar: "🚀",
      createdAt: new Date().toISOString(),
    };

    let createdUserDoc = null;

    try {
      if (useFirestore) {
        createdUserDoc = await createUserTransaction(user);
      }

      const token = createSessionToken(user);

      return res
        .status(201)
        .setHeader("Set-Cookie", sessionCookie(token))
        .json({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        });
    } catch (error) {
      await rollbackUserCreation(createdUserDoc);

      if (error.message === "DUPLICATE_USER") {
        await normalizeAuthDelay();
        console.warn("[signup] duplicate email attempt", {
          email: cleanEmail,
          ip: clientId,
          at: new Date().toISOString(),
        });
       if (error.message === "DUPLICATE_USER") {
         console.info(`Duplicate signup attempt (transaction) for email: ${cleanEmail}`);
         // Same generic 200 as the non-Firestore path above.
         return res.status(200).json({ ok: true });
       }
      }

      throw error;
    }
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}