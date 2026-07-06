import { getClientIdentifier } from '../services/auth.service.js';

export class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 mins default
    this.maxAttempts = options.maxAttempts || 5;
    this.cooldownMs = options.cooldownMs || 15 * 60 * 1000; // 15 mins default cooldown
    this.backoffType = options.backoffType || 'fixed'; // 'fixed' or 'exponential'
    this.maxCooldownMs = options.maxCooldownMs || 24 * 60 * 60 * 1000; // max 24 hours backoff
    
    this.attempts = new Map(); // key -> timestamps[]
    this.cooldowns = new Map(); // key -> { blockUntil: timestamp, consecutiveBlocks: number }
    this.sweeper = null;

    this.startSweeper();
  }

  // Check rate limit state for a key.
  // Returns { allowed: boolean, retryAfter: number, remaining: number }
  check(key) {
    const now = Date.now();
    
    // 1. Check current cooldown block
    const cooldown = this.cooldowns.get(key);
    if (cooldown && now < cooldown.blockUntil) {
      const retryAfter = Math.ceil((cooldown.blockUntil - now) / 1000);
      return {
        allowed: false,
        retryAfter,
        remaining: 0
      };
    }

    // 2. Count attempts in the current sliding window
    let timestamps = this.attempts.get(key) || [];
    timestamps = timestamps.filter(t => now - t < this.windowMs);
    this.attempts.set(key, timestamps);

    if (timestamps.length >= this.maxAttempts) {
      // Exceeded limit. Initiate or upgrade cooldown.
      let consecutiveBlocks = 1;
      if (cooldown) {
        consecutiveBlocks = cooldown.consecutiveBlocks + 1;
      }

      let duration = this.cooldownMs;
      if (this.backoffType === 'exponential') {
        duration = this.cooldownMs * Math.pow(2, consecutiveBlocks - 1);
        if (duration > this.maxCooldownMs) {
          duration = this.maxCooldownMs;
        }
      }

      const blockUntil = now + duration;
      this.cooldowns.set(key, { blockUntil, consecutiveBlocks });
      
      const retryAfter = Math.ceil(duration / 1000);
      return {
        allowed: false,
        retryAfter,
        remaining: 0
      };
    }

    const remaining = this.maxAttempts - timestamps.length;
    return {
      allowed: true,
      retryAfter: 0,
      remaining
    };
  }

  // Record an attempt
  record(key) {
    const now = Date.now();
    let timestamps = this.attempts.get(key) || [];
    timestamps = timestamps.filter(t => now - t < this.windowMs);
    timestamps.push(now);
    this.attempts.set(key, timestamps);
  }

  // Reset rate limiting state for a key (e.g. on successful login)
  reset(key) {
    this.attempts.delete(key);
    this.cooldowns.delete(key);
  }

  startSweeper(intervalMs = 30 * 60 * 1000) {
    this.sweeper = setInterval(() => {
      const now = Date.now();
      
      for (const [key, timestamps] of this.attempts.entries()) {
        const fresh = timestamps.filter(t => now - t < this.windowMs);
        if (fresh.length === 0) {
          this.attempts.delete(key);
        } else {
          this.attempts.set(key, fresh);
        }
      }

      for (const [key, cooldown] of this.cooldowns.entries()) {
        if (now >= cooldown.blockUntil) {
          this.cooldowns.delete(key);
        }
      }
    }, intervalMs);

    if (this.sweeper.unref) {
      this.sweeper.unref();
    }
  }

  stopSweeper() {
    if (this.sweeper) {
      clearInterval(this.sweeper);
    }
  }
}

// Instantiate specific limiters for brute-forceable endpoints
export const loginLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  maxAttempts: 5,
  cooldownMs: 15 * 60 * 1000, // 15 mins
  backoffType: 'exponential',
});

export const signupLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
  cooldownMs: 15 * 60 * 1000,
  backoffType: 'exponential',
});

export const forgotPasswordLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 3,
  cooldownMs: 15 * 60 * 1000,
  backoffType: 'exponential',
});

export const changePasswordLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
  cooldownMs: 15 * 60 * 1000,
  backoffType: 'exponential',
});

export const deleteAccountLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
  cooldownMs: 15 * 60 * 1000,
  backoffType: 'exponential',
});

export const resendVerificationLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 3,
  cooldownMs: 15 * 60 * 1000,
  backoffType: 'exponential',
});

// ── Expensive / cost-amplifying endpoints ───────────────────────────────────
// These routes are unauthenticated tools that perform heavy work (file parsing,
// outbound GitHub requests, LLM calls). Without limits, an anonymous client can
// exhaust CPU, third-party rate limits, or paid API quotas. Limits are sized to
// allow normal interactive use while blocking abuse.
export const resumeAnalysisLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 15,
  cooldownMs: 15 * 60 * 1000,
});

export const repoAnalysisLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 20,
  cooldownMs: 15 * 60 * 1000,
});

export const sdlcAdvisorLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 15,
  cooldownMs: 15 * 60 * 1000,
});

export const complexityAnalysisLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 20,
  cooldownMs: 15 * 60 * 1000,
});

export const predictionLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 30,
  cooldownMs: 15 * 60 * 1000,
});

// Bulk audit fans out to many outbound GitHub requests per submission, so it is
// the most expensive route — keep its budget small and the window long.
export const bulkAuditLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  maxAttempts: 5,
  cooldownMs: 60 * 60 * 1000,
  backoffType: 'exponential',
});

// Client error reports are written to an append-only log on disk. Without a
// limit, an anonymous client could spam reports to inflate the file. Allow
// generous normal use while capping abusive bursts.
export const logErrorLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 30,
  cooldownMs: 15 * 60 * 1000,
});

// Centralized helper to check and apply rate limits on HTTP server requests
export function applyRateLimit(req, res, limiter, errorMessage = "Too many attempts. Please try again later.") {
  const key = getClientIdentifier(req);
  const checkResult = limiter.check(key);
  
  if (!checkResult.allowed) {
    res.writeHead(429, {
      "Content-Type": "application/json; charset=utf-8",
      "Retry-After": String(checkResult.retryAfter),
    });
    res.end(JSON.stringify({
      error: errorMessage,
      retryAfter: checkResult.retryAfter,
    }));
    return false;
  }
  
  limiter.record(key);
  return true;
}
