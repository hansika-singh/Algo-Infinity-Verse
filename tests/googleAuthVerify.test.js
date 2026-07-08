import crypto from 'crypto';
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
process.env.SESSION_SECRET = 'test-secret-supabase-verify';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_JWT_SECRET = 'test-supabase-jwt-secret';

const { server } = await import('../server.js');

function signSupabaseJwt(payload, secret) {
  const enc = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const header = { alg: 'HS256', typ: 'JWT' };
  const data = `${enc(header)}.${enc(payload)}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function validPayload(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: 'user-supabase-1',
    email: 'real@example.com',
    email_verified: true,
    aud: 'authenticated',
    iss: 'https://test.supabase.co/auth/v1',
    exp: now + 3600,
    user_metadata: { name: 'Real User', avatar_url: 'https://example.com/avatar.png' },
    ...overrides,
  };
}

async function postSupabase(origin, accessToken) {
  return fetch(`${origin}/api/auth/supabase`, {
    method: 'POST',
    // Origin matches the server host so the request passes the CSRF gate
    // (same-origin), exactly as a real browser would send it.
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ accessToken }),
  });
}

describe('Supabase auth: cryptographic verification + email_verified', () => {
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

  it('rejects a token with an invalid signature (401)', async () => {
    const token = signSupabaseJwt(validPayload(), 'wrong-secret');
    const res = await postSupabase(origin, token);
    expect(res.status).toBe(401);
  });

  it('rejects a verified token whose email is not verified (403)', async () => {
    const token = signSupabaseJwt(validPayload({ email_verified: false }), process.env.SUPABASE_JWT_SECRET);
    const res = await postSupabase(origin, token);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toMatch(/not verified/i);
  });

  it('accepts a cryptographically valid, email-verified token and upserts the user', async () => {
    const token = signSupabaseJwt(validPayload(), process.env.SUPABASE_JWT_SECRET);
    const res = await postSupabase(origin, token);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.authenticated).toBe(true);
    expect(data.user.email).toBe('real@example.com');
    expect(data.user.name).toBe('Real User');

    const setCookie = res.headers.get('set-cookie') || '';
    expect(setCookie).toMatch(/aiv_session=/);
  });
});
