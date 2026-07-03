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

// Control what the Admin SDK's verifyIdToken returns for each test.
let verifyImpl = async () => {
  throw new Error('verifyImpl not configured');
};
jest.unstable_mockModule('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken: (token) => verifyImpl(token) }),
}));

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-google-verify';
process.env.FIREBASE_PROJECT_ID = 'test-project';

const { server } = await import('../server.js');

async function postGoogle(origin) {
  return fetch(`${origin}/api/auth/google`, {
    method: 'POST',
    // Origin matches the server host so the request passes the CSRF gate
    // (same-origin), exactly as a real browser would send it.
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ idToken: 'fake-token' }),
  });
}

describe('Google auth: cryptographic verification + email_verified (#1226)', () => {
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

  it('rejects a token that fails cryptographic verification (401)', async () => {
    verifyImpl = async () => {
      throw new Error('Firebase ID token has invalid signature');
    };
    const res = await postGoogle(origin);
    expect(res.status).toBe(401);
  });

  it('rejects a verified token whose email is not verified (403)', async () => {
    verifyImpl = async () => ({
      uid: 'uid-1',
      email: 'attacker@example.com',
      email_verified: false,
      name: 'Attacker',
    });
    const res = await postGoogle(origin);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toMatch(/not verified/i);
  });

  it('accepts a cryptographically valid, email-verified token (past verification)', async () => {
    verifyImpl = async () => ({
      uid: 'uid-2',
      email: 'real@example.com',
      email_verified: true,
      name: 'Real User',
    });
    const res = await postGoogle(origin);
    // Verification + email_verified passed; without Firestore configured in the
    // test env the handler then returns 503 — i.e. it got past the security
    // checks (not a 401/403).
    expect(res.status).toBe(503);
  });
});
