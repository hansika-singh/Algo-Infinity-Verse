// config/security.js

export default {
  // ── Upload limits ──────────────────────────────────────────────────────────
  MAX_RESUME_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB

  // ── Rate limiting ──────────────────────────────────────────────────────────
  SIGNUP_RATE_LIMIT: 5,
  SIGNUP_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  LOGIN_RATE_LIMIT: 5,
  LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes

  // ── Authentication delays ─────────────────────────────────────────────────
  AUTH_DELAY_MS: 500, // 500ms delay for auth normalization

  // ── Password policy ───────────────────────────────────────────────────────
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 64,
  PASSWORD_REGEX: {
    lowercase: /[a-z]/,
    uppercase: /[A-Z]/,
    digit: /\d/,
    special: /[!@#$%^&*()_+\-=\[\]{};:'"|,.<>?/~`]/
  }
};