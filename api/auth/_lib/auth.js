import crypto from 'crypto';

/**
 * Get the session secret from environment variables
 * @returns {string} The session secret
 * @throws {Error} If SESSION_SECRET is not set
 */
export function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET is required. Set it in the environment before starting the server.'
    );
  }
  return secret;
}

/**
 * Sign a value using HMAC-SHA256
 * @param {string} value - The value to sign
 * @returns {string} The signed value in base64url format
 */
export function sign(value) {
  return crypto.createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

/**
 * Convert base64url to string
 * @param {string} input - The base64url encoded string
 * @returns {string} The decoded string
 */
export function fromBase64Url(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf8');
}

/**
 * Convert string to base64url
 * @param {string} input - The string to encode
 * @returns {string} The base64url encoded string
 */
export function toBase64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Verify a session token
 * @param {string} token - The JWT token to verify
 * @param {string} expectedType - The expected token type (e.g., "access", "refresh")
 * @returns {Object|null} The decoded session payload or null if invalid
 */
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
    if (expectedType && session.type !== expectedType) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Verify an access token
 * @param {string} token - The access token to verify
 * @returns {Object|null} The decoded session or null if invalid
 */
export function verifyAccessToken(token) {
  return verifyToken(token, 'access');
}

/**
 * Verify a refresh token
 * @param {string} token - The refresh token to verify
 * @returns {Object|null} The decoded session or null if invalid
 */
export function verifyRefreshToken(token) {
  return verifyToken(token, 'refresh');
}

/**
 * Parse cookies from a cookie header
 * @param {string} header - The Cookie header value
 * @returns {Object} Object containing parsed cookies
 */
export function parseCookies(header = '') {
  const cookies = {};
  if (!header || typeof header !== 'string') return cookies;

  header.split(';').forEach((cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name.trim()] = decodeURIComponent(value.trim());
    }
  });
  return cookies;
}

/**
 * Get session from request
 * @param {Object} req - The HTTP request object
 * @returns {Object|null} The session object or null
 */
export function getSession(req) {
  const cookieHeader = req.headers?.cookie || '';
  const cookies = parseCookies(cookieHeader);
  const token = cookies.session || cookies.access_token;

  if (!token) return null;

  try {
    const session = verifyAccessToken(token);
    return session;
  } catch {
    return null;
  }
}

/**
 * Create a session token
 * @param {Object} payload - The session payload
 * @param {number} expiresInSeconds - Token expiry in seconds
 * @param {string} type - Token type (access or refresh)
 * @returns {string} The signed JWT token
 */
export function createSessionToken(payload, expiresInSeconds, type = 'access') {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const tokenPayload = toBase64Url(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
      type,
    })
  );
  const body = `${header}.${tokenPayload}`;
  return `${body}.${sign(body)}`;
}
