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
process.env.SESSION_SECRET = 'test-secret-auth-gate';

const { server } = await import('../server.js');
const { createAccessToken } = await import('../backend/services/auth.service.js');

const PRIVATE_PAGE = '/pages/auth/setting.html'; // declares <meta name="auth-required">

describe('Server-side auth gate for private pages (#1227)', () => {
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

  const expectedLocation = `/login?next=${encodeURIComponent(PRIVATE_PAGE)}`;

  it('redirects an unauthenticated request for a private page to /login', async () => {
    const res = await fetch(`${origin}${PRIVATE_PAGE}`, { redirect: 'manual' });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(expectedLocation);
  });

  it('redirects when the session cookie is invalid (gate is not client-bypassable)', async () => {
    const res = await fetch(`${origin}${PRIVATE_PAGE}`, {
      redirect: 'manual',
      headers: { Cookie: 'aiv_session=forged.garbage.token' },
    });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(expectedLocation);
  });

  it('serves the private page to an authenticated user', async () => {
    const token = createAccessToken({ id: 'u1', name: 'Test', email: 't@example.com' });
    const res = await fetch(`${origin}${PRIVATE_PAGE}`, {
      redirect: 'manual',
      headers: { Cookie: `aiv_session=${token}` },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
  });

  it('serves a public (non-marked) page without authentication', async () => {
    const res = await fetch(`${origin}/`, { redirect: 'manual' });
    expect(res.status).toBe(200);
  });
});
