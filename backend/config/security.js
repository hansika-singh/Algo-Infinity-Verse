// config/security.js

export default {
  // ── Upload limits ──────────────────────────────────────────────────────────
  MAX_RESUME_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  MAX_RESUME_TEXT_LENGTH: 50000, // Maximum extracted resume text length (50,000 characters)

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
    special: /[!@#$%^&*()_+\-=<>?/~`]/,
  },

  // ── HTTP Server Timeouts (#2139) ──────────────────────────────────────────
  REQUEST_TIMEOUT_MS: 30000, // 30 seconds for the request to complete
  HEADERS_TIMEOUT_MS: 31000, // 31 seconds (slightly higher to prevent errors)
  KEEP_ALIVE_TIMEOUT_MS: 5000, // 5 seconds for idle keep-alive connections

  // ── Token expiry ──────────────────────────────────────────────────────────
  ACCESS_TOKEN_MAX_AGE_SECONDS: 15 * 60, // 15 minutes
  REFRESH_TOKEN_MAX_AGE_SECONDS: 60 * 60 * 24 * 7, // 7 days

  // ── Authentication Security (#2343) ──────────────────────────────────────
  PBKDF2_ITERATIONS: 210000, // Number of PBKDF2 iterations for password hashing
  PASSWORD_KEY_LENGTH: 32, // Key length for password derivation
  SESSION_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7 days session expiry
  REFRESH_TOKEN_EXPIRY_MS: 30 * 24 * 60 * 60 * 1000, // 30 days refresh token expiry
  MAX_LOGIN_ATTEMPTS: 5, // Max login attempts before lockout
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes lockout duration
  PASSWORD_RESET_EXPIRY_MS: 60 * 60 * 1000, // 1 hour password reset expiry
  EMAIL_VERIFICATION_EXPIRY_MS: 24 * 60 * 60 * 1000, // 24 hours email verification expiry
  MIN_PASSWORD_STRENGTH: 3, // Minimum password strength score (0-4)
  ENCRYPTION_ALGORITHM: 'aes-256-gcm', // Encryption algorithm for sensitive data
  HASHING_ALGORITHM: 'sha256', // Hashing algorithm for data integrity
};
