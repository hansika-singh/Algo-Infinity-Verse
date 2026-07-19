// utils/clientIdentifier.js

/**
 * IPs of reverse-proxies / load-balancers that are allowed to set X-Forwarded-For.
 * Populate via the TRUSTED_PROXIES env variable (comma-separated) at startup.
 */
const TRUSTED_PROXIES = new Set(
  (process.env.TRUSTED_PROXIES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

/**
 * Resolves a unique client identifier from the incoming request.
 * Handles trusted proxy headers (X-Forwarded-For) to extract the real client IP.
 * @param {http.IncomingMessage} req - The Express/HTTP request object.
 * @returns {string} The client identifier (IP address).
 */
export function getClientIdentifier(req) {
  const remoteAddress = req.socket?.remoteAddress || 'unknown';

  // Only honour X-Forwarded-For when the immediate TCP caller is a
  // known trusted proxy — otherwise an attacker can supply any value
  // they like and trivially bypass rate limiting.
  if (
    remoteAddress !== 'unknown' &&
    TRUSTED_PROXIES.has(remoteAddress) &&
    req.headers['x-forwarded-for']
  ) {
    // The left-most entry is the original client IP added by the
    // first proxy in the chain; everything to the right can be spoofed.
    const leftmost = req.headers['x-forwarded-for'].split(',')[0].trim();
    if (leftmost) return leftmost;
  }

  return remoteAddress;
}
