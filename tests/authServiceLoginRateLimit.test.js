// tests/authServiceLoginRateLimit.test.js
//
// Verifies isLoginRateLimited/recordLoginAttempt/LOGIN_WINDOW_MS are
// actually exported and work correctly from auth.service.js (Issue #2535).
// Previously these were imported by backend/handlers/authHandlers.js but
// never defined/exported here, so handleLogin would throw
// `TypeError: isLoginRateLimited is not a function` as soon as it ran.

import { jest } from '@jest/globals';

describe('auth.service - login rate limiting', () => {
  let isLoginRateLimited;
  let recordLoginAttempt;
  let LOGIN_RATE_LIMIT;
  let LOGIN_WINDOW_MS;

  beforeAll(async () => {
    const mod = await import('../backend/services/auth.service.js');
    isLoginRateLimited = mod.isLoginRateLimited;
    recordLoginAttempt = mod.recordLoginAttempt;
    LOGIN_RATE_LIMIT = mod.LOGIN_RATE_LIMIT;
    LOGIN_WINDOW_MS = mod.LOGIN_WINDOW_MS;
  });

  it('exports isLoginRateLimited and recordLoginAttempt as functions', () => {
    expect(typeof isLoginRateLimited).toBe('function');
    expect(typeof recordLoginAttempt).toBe('function');
  });

  it('exports LOGIN_RATE_LIMIT and LOGIN_WINDOW_MS as numbers', () => {
    expect(typeof LOGIN_RATE_LIMIT).toBe('number');
    expect(typeof LOGIN_WINDOW_MS).toBe('number');
    expect(LOGIN_RATE_LIMIT).toBeGreaterThan(0);
    expect(LOGIN_WINDOW_MS).toBeGreaterThan(0);
  });

  it('does not rate-limit a fresh identifier', () => {
    const identifier = `test-fresh-${Math.random()}`;
    expect(isLoginRateLimited(identifier)).toBe(false);
  });

  it('rate-limits after LOGIN_RATE_LIMIT recorded attempts', () => {
    const identifier = `test-limited-${Math.random()}`;
    for (let i = 0; i < LOGIN_RATE_LIMIT; i++) {
      expect(isLoginRateLimited(identifier)).toBe(false);
      recordLoginAttempt(identifier);
    }
    // One more attempt beyond the limit should now be blocked.
    expect(isLoginRateLimited(identifier)).toBe(true);
  });

  it('tracks attempts independently per identifier', () => {
    const idA = `test-a-${Math.random()}`;
    const idB = `test-b-${Math.random()}`;
    for (let i = 0; i < LOGIN_RATE_LIMIT; i++) recordLoginAttempt(idA);
    expect(isLoginRateLimited(idA)).toBe(true);
    expect(isLoginRateLimited(idB)).toBe(false);
  });

  it('only counts attempts within the rate-limit window', () => {
    const identifier = `test-window-${Math.random()}`;
    const originalNow = Date.now;
    let mockedTime = originalNow();
    jest.spyOn(Date, 'now').mockImplementation(() => mockedTime);

    try {
      for (let i = 0; i < LOGIN_RATE_LIMIT; i++) recordLoginAttempt(identifier);
      expect(isLoginRateLimited(identifier)).toBe(true);

      // Advance past the window — old attempts should no longer count.
      mockedTime += LOGIN_WINDOW_MS + 1000;
      expect(isLoginRateLimited(identifier)).toBe(false);
    } finally {
      Date.now.mockRestore();
    }
  });
});
