import { jest } from '@jest/globals';

jest.unstable_mockModule('../backend/jobs/queue.js', () => ({
  enqueueBulkAudit: jest.fn(),
  getBatchProgress: jest.fn(),
  MAX_BULK_AUDIT_URLS: 50,
  batchStore: new Map(),
  bulkAuditQueue: {
    add: jest.fn(),
    on: jest.fn(),
  },
  redisAvailable: false,
  redisClient: null,
  redisReady: Promise.resolve(),
  default: {},
}));

jest.unstable_mockModule('../backend/jobs/worker.js', () => ({
  default: {},
}));

const { hashPassword, passwordMatches, applySM2, validateSignup } = await import('../server.js');
import crypto from 'crypto';

describe('server.js Utility Functions', () => {
  describe('Password Hashing & Matching', () => {
    it('should generate a valid hash object with salt', () => {
      const password = 'TestPassword123!';
      const result = hashPassword(password);

      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('salt');
      expect(result).toHaveProperty('iterations', 210000);
      expect(result).toHaveProperty('digest', 'sha256');
    });

    it('should successfully match a correct password', () => {
      const password = 'SecurePassword1!';
      const storedHash = hashPassword(password);

      expect(passwordMatches(password, storedHash)).toBe(true);
    });

    it('should fail to match an incorrect password', () => {
      const password = 'SecurePassword1!';
      const storedHash = hashPassword(password);

      expect(passwordMatches('WrongPassword!', storedHash)).toBe(false);
    });

    it('should generate deterministic hashes with the same salt', () => {
      const password = 'Password';
      const salt = crypto.randomBytes(16).toString('hex');
      const hash1 = hashPassword(password, salt);
      const hash2 = hashPassword(password, salt);

      expect(hash1.hash).toEqual(hash2.hash);
      expect(hash1.salt).toEqual(hash2.salt);
    });
  });

  describe('SM-2 Algorithm (applySM2)', () => {
    it('should initialize a new card correctly on a perfect score', () => {
      const card = null;
      const result = applySM2(card, 5);

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(1);
      expect(result.easeFactor).toBeGreaterThan(2.5);
      expect(result.lastQuality).toBe(5);
    });

    it('should reset interval and repetitions on a score < 3', () => {
      const card = { repetitions: 5, easeFactor: 2.6, interval: 14 };
      const result = applySM2(card, 2); // Blackout

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
      expect(result.lastQuality).toBe(2);
    });

    it('should increase interval for score >= 3', () => {
      const card = { repetitions: 1, easeFactor: 2.5, interval: 1 };
      const result = applySM2(card, 4);

      expect(result.repetitions).toBe(2);
      expect(result.interval).toBe(6);
    });
  });

  describe('validateSignup', () => {
    it('should validate correctly formatted input', () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
      };
      expect(validateSignup(input)).toBeNull(); // null means no error
    });

    it('should return error for mismatched passwords', () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'ValidPassword123!',
        confirmPassword: 'DifferentPassword1!',
      };
      expect(validateSignup(input)).toBe('Passwords do not match.');
    });

    it('should return error for missing uppercase/lowercase/number in password', () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weakpassword',
        confirmPassword: 'weakpassword',
      };
      expect(validateSignup(input)).toBe(
        'Password must include uppercase, lowercase, and a number.'
      );
    });

    it('should return error for invalid email', () => {
      const input = {
        name: 'John Doe',
        email: 'john.com', // invalid
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
      };
      expect(validateSignup(input)).toBe('Enter a valid email address.');
    });
  });

  describe('Centralized Rate Limiter', () => {
    let RateLimiter, applyRateLimit;

    beforeAll(async () => {
      const rlModule = await import('../backend/utils/rateLimiter.js');
      RateLimiter = rlModule.RateLimiter;
      applyRateLimit = rlModule.applyRateLimit;
    });

    let rateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter({
        windowMs: 1000, // 1 second
        maxAttempts: 3,
        cooldownMs: 2000, // 2 seconds
        backoffType: 'fixed',
      });
    });

    afterEach(() => {
      rateLimiter.stopSweeper();
    });

    it('should allow requests within limit', () => {
      const key = 'test-client-1';
      expect(rateLimiter.check(key).allowed).toBe(true);
      rateLimiter.record(key);
      expect(rateLimiter.check(key).allowed).toBe(true);
      rateLimiter.record(key);
      expect(rateLimiter.check(key).allowed).toBe(true);
      rateLimiter.record(key);
    });

    it('should block requests exceeding limit', () => {
      const key = 'test-client-2';
      for (let i = 0; i < 3; i++) {
        expect(rateLimiter.check(key).allowed).toBe(true);
        rateLimiter.record(key);
      }
      const check = rateLimiter.check(key);
      expect(check.allowed).toBe(false);
      expect(check.retryAfter).toBeGreaterThan(0);
    });

    it('should enforce fixed cooldown', () => {
      const key = 'test-client-3';
      for (let i = 0; i < 3; i++) {
        rateLimiter.record(key);
      }
      expect(rateLimiter.check(key).allowed).toBe(false);

      const now = Date.now();
      const realNow = Date.now;
      try {
        Date.now = () => now + 2500;
        expect(rateLimiter.check(key).allowed).toBe(true);
      } finally {
        Date.now = realNow;
      }
    });

    it('should enforce exponential backoff', () => {
      const expLimiter = new RateLimiter({
        windowMs: 1000,
        maxAttempts: 2,
        cooldownMs: 1000,
        backoffType: 'exponential',
      });

      try {
        const key = 'test-client-4';

        // Exceed limit 1st time -> cooldown should be 1s
        expLimiter.record(key);
        expLimiter.record(key);
        let check = expLimiter.check(key);
        expect(check.allowed).toBe(false);
        expect(check.retryAfter).toBe(1);

        // Exceed limit 2nd time (simulate 1.5s passes, then 2 new attempts)
        const now = Date.now();
        const realNow = Date.now;

        Date.now = () => now + 1500;
        expLimiter.record(key);
        expLimiter.record(key);

        check = expLimiter.check(key);
        expect(check.allowed).toBe(false);
        expect(check.retryAfter).toBe(2); // 1s * 2^1 = 2s

        Date.now = realNow;
      } finally {
        expLimiter.stopSweeper();
      }
    });

    it('should reset limiter state', () => {
      const key = 'test-client-5';
      for (let i = 0; i < 3; i++) {
        rateLimiter.record(key);
      }
      expect(rateLimiter.check(key).allowed).toBe(false);
      rateLimiter.reset(key);
      expect(rateLimiter.check(key).allowed).toBe(true);
    });

    it('should write 429 response on rate limit hit', () => {
      const res = {
        writeHead: jest.fn(),
        end: jest.fn(),
      };
      const req = {
        socket: { remoteAddress: '127.0.0.1' },
      };

      for (let i = 0; i < 3; i++) {
        rateLimiter.record('127.0.0.1');
      }

      const allowed = applyRateLimit(req, res, rateLimiter, 'Too many attempts.');
      expect(allowed).toBe(false);
      expect(res.writeHead).toHaveBeenCalledWith(429, expect.any(Object));
      expect(res.end).toHaveBeenCalledWith(expect.stringContaining('Too many attempts.'));
    });
  });
});
