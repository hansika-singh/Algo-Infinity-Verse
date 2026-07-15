import crypto from 'crypto';
import securityConfig from '../config/security.js';

export const {
  SIGNUP_RATE_LIMIT,
  SIGNUP_WINDOW_MS,
  AUTH_DELAY_MS,
  MIN_PASSWORD_LENGTH,
  PASSWORD_REGEX,
  PBKDF2_ITERATIONS,
  PASSWORD_KEY_LENGTH,
  HASHING_ALGORITHM,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} = securityConfig;

import { redisAvailable, redisClient } from '../jobs/queue.js';

export const activeRefreshFamilies = new Map();
const signupAttempts = new Map();

export const _signupSweeper = setInterval(() => {
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

const TRUSTED_PROXIES = new Set(
  (process.env.TRUSTED_PROXIES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

export function getClientIdentifier(req) {
  const remoteAddress = req.socket?.remoteAddress || 'unknown';

  if (
    remoteAddress !== 'unknown' &&
    TRUSTED_PROXIES.has(remoteAddress) &&
    req.headers['x-forwarded-for']
  ) {
    const leftmost = req.headers['x-forwarded-for'].split(',')[0].trim();
    if (leftmost) return leftmost;
  }

  return remoteAddress;
}

export function isSignupRateLimited(identifier) {
  const now = Date.now();
  const attempts = signupAttempts.get(identifier) || [];
  const recentAttempts = attempts.filter((t) => now - t < SIGNUP_WINDOW_MS);
  signupAttempts.set(identifier, recentAttempts);
  return recentAttempts.length >= SIGNUP_RATE_LIMIT;
}

export function recordSignupAttempt(identifier) {
  const now = Date.now();
  const attempts = signupAttempts.get(identifier) || [];
  const recentAttempts = attempts.filter((t) => now - t < SIGNUP_WINDOW_MS);
  recentAttempts.push(now);
  signupAttempts.set(identifier, recentAttempts);
}

export async function normalizeAuthDelay() {
  return new Promise((resolve) => setTimeout(resolve, AUTH_DELAY_MS));
}

// ── Authentication & Tokens ──────────────────────────────────────────────────

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromBase64Url(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf8');
}

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET is required. Set it in the environment before starting the server.'
    );
  }
  return secret;
}

function sign(value) {
  return crypto.createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

export function createAccessToken(user) {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      sub: user.id,
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_MAX_AGE_SECONDS,
      type: 'access',
    })
  );
  const body = `${header}.${payload}`;
  return `${body}.${sign(body)}`;
}

export async function createRefreshToken(
  user,
  familyId = crypto.randomUUID(),
  nonce = crypto.randomUUID()
) {
  if (redisAvailable && redisClient) {
    await redisClient.set(`refresh:${familyId}`, nonce, 'EX', REFRESH_TOKEN_MAX_AGE_SECONDS);
  } else {
    activeRefreshFamilies.set(familyId, { currentNonce: nonce });
  }
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      sub: user.id,
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_MAX_AGE_SECONDS,
      type: 'refresh',
      familyId,
      nonce,
    })
  );
  const body = `${header}.${payload}`;
  return `${body}.${sign(body)}`;
}

export async function revokeTokenFamily(familyId) {
  if (redisAvailable && redisClient) {
    await redisClient.del(`refresh:${familyId}`);
  } else {
    activeRefreshFamilies.delete(familyId);
  }
}

export function verifyToken(token, expectedType) {
  if (!token) return null;
  const parts = token.split('.');
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
    if (session.type !== expectedType) return null;
    return session;
  } catch {
    return null;
  }
}

export function verifyAccessToken(token) {
  return verifyToken(token, 'access');
}

export async function verifyRefreshToken(token) {
  const session = verifyToken(token, 'refresh');
  if (!session) return null;

  if (redisAvailable && redisClient) {
    const currentNonce = await redisClient.get(`refresh:${session.familyId}`);
    if (!currentNonce) return null;
    if (currentNonce !== session.nonce) {
      await revokeTokenFamily(session.familyId);
      return null;
    }
  } else {
    const family = activeRefreshFamilies.get(session.familyId);
    if (!family) return null;

    if (family.currentNonce !== session.nonce) {
      activeRefreshFamilies.delete(session.familyId);
      return null;
    }
  }
  return session;
}

const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || '';

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto
    .pbkdf2Sync(
      password + PASSWORD_PEPPER,
      salt,
      PBKDF2_ITERATIONS,
      PASSWORD_KEY_LENGTH,
      HASHING_ALGORITHM
    )
    .toString('hex');
  return { salt, hash, iterations: PBKDF2_ITERATIONS, digest: HASHING_ALGORITHM };
}

export function passwordMatches(password, stored) {
  const calculated = crypto.pbkdf2Sync(
    password + PASSWORD_PEPPER,
    stored.salt,
    stored.iterations || PBKDF2_ITERATIONS,
    PASSWORD_KEY_LENGTH,
    stored.digest || HASHING_ALGORITHM
  );
  const saved = Buffer.from(stored.hash, 'hex');
  return saved.length === calculated.length && crypto.timingSafeEqual(saved, calculated);
}

export function validateSignup({ name, email, password, confirmPassword }) {
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '')
    .trim()
    .toLowerCase();
  const rawPassword = String(password || '');
  const rawConfirm = String(confirmPassword || '');

  if (cleanName.length < 2) return 'Name must be at least 2 characters.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return 'Enter a valid email address.';
  }
  if (rawPassword.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (
    !PASSWORD_REGEX.lowercase.test(rawPassword) ||
    !PASSWORD_REGEX.uppercase.test(rawPassword) ||
    !PASSWORD_REGEX.digit.test(rawPassword)
  ) {
    return 'Password must include uppercase, lowercase, and a number.';
  }
  if (rawPassword !== rawConfirm) return 'Passwords do not match.';
  return null;
}
