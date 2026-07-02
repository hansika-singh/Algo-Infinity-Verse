import { jest } from '@jest/globals';
import IORedis from 'ioredis';
import { Worker } from 'bullmq';

// Stub Redis so importing the server does not hang.
IORedis.prototype.connect = function () {
  return Promise.resolve();
};
Worker.prototype.run = function () {
  return Promise.resolve();
};

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-for-token-refresh';

const { server } = await import('../server.js');

function cookiePair(setCookies, name) {
  const c = (setCookies || []).find((s) => s.startsWith(`${name}=`));
  return c ? c.split(';')[0] : null;
}

describe('Token refresh round-trip (#1225)', () => {
  let origin;

  beforeAll(async () => {
    const port = await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve(server.address().port));
    });
    origin = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('issues both the access and refresh cookies on signup', async () => {
    const password = 'ValidPass123';
    const res = await fetch(`${origin}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify({
        name: 'Refresh Tester',
        email: `reftest-signup-${Date.now()}@example.com`,
        password,
        confirmPassword: password,
      }),
    });
    expect(res.status).toBe(200);
    const cookies = res.headers.getSetCookie();
    expect(cookiePair(cookies, 'aiv_session')).toBeTruthy();
    expect(cookiePair(cookies, 'aiv_refresh')).toBeTruthy();
  });

  it('refreshes the session using the refresh cookie and rotates both cookies', async () => {
    const password = 'ValidPass123';
    // 1. Sign up to obtain a real refresh cookie.
    const signupRes = await fetch(`${origin}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify({
        name: 'Refresh Roundtrip',
        email: `reftest-roundtrip-${Date.now()}@example.com`,
        password,
        confirmPassword: password,
      }),
    });
    expect(signupRes.status).toBe(200);
    const refreshCookie = cookiePair(signupRes.headers.getSetCookie(), 'aiv_refresh');
    expect(refreshCookie).toBeTruthy();

    // 2. Exchange the refresh cookie for a fresh session.
    const refreshRes = await fetch(`${origin}/api/refresh`, {
      method: 'POST',
      headers: { Cookie: refreshCookie, Origin: origin },
    });
    expect(refreshRes.status).toBe(200);
    const rotated = refreshRes.headers.getSetCookie();
    expect(cookiePair(rotated, 'aiv_session')).toBeTruthy();
    expect(cookiePair(rotated, 'aiv_refresh')).toBeTruthy();

    // 3. The freshly issued access cookie authenticates a request.
    const sessionCookie = cookiePair(rotated, 'aiv_session');
    const sessionRes = await fetch(`${origin}/api/session`, {
      headers: { Cookie: sessionCookie },
    });
    const session = await sessionRes.json();
    expect(session.authenticated).toBe(true);
  });

  it('rejects /api/refresh when no refresh cookie is present', async () => {
    const res = await fetch(`${origin}/api/refresh`, {
      method: 'POST',
      headers: { Origin: origin },
    });
    expect(res.status).toBe(401);
  });
});
