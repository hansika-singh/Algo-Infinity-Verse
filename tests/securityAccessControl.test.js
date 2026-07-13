import IORedis from 'ioredis';
import { Worker } from 'bullmq';

// Stub out Redis so importing the server does not hang or hit a real Redis.
IORedis.prototype.connect = function () {
  return Promise.resolve();
};
Worker.prototype.run = function () {
  return Promise.resolve();
};

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-for-access-control';

const { server } = await import('../server.js');
const { createAccessToken } = await import('../backend/services/auth.service.js');
const { MAX_BULK_AUDIT_URLS } = await import('../backend/jobs/queue.js');

function cookieFor(user) {
  return `aiv_session=${createAccessToken(user)}`;
}

describe('Access control: /api/team-profile IDOR (#1216)', () => {
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

  it('rejects anonymous GET with 401', async () => {
    const res = await fetch(`${origin}/api/team-profile?id=team-anon-get`);
    expect(res.status).toBe(401);
  });

  it('rejects anonymous POST with 401', async () => {
    const res = await fetch(`${origin}/api/team-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': origin },
      body: JSON.stringify({ id: 'team-anon-post', version: 1, name: 'x' }),
    });
    expect(res.status).toBe(401);
  });

  it('binds a new profile to its creator and blocks other users (IDOR)', async () => {
    const teamId = `team-owner-${Date.now()}`;
    const userA = { id: `userA-${Date.now()}`, name: 'A', email: 'a@example.com' };
    const userB = { id: `userB-${Date.now()}`, name: 'B', email: 'b@example.com' };

    // User A creates the profile -> becomes owner.
    const createRes = await fetch(`${origin}/api/team-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieFor(userA), 'Origin': origin },
      body: JSON.stringify({ id: teamId, version: 1, name: 'A Team', description: 'secret' }),
    });
    expect(createRes.status).toBe(200);
    const created = await createRes.json();
    expect(created.ownerId).toBe(userA.id);

    // User B must not be able to read it.
    const bGet = await fetch(`${origin}/api/team-profile?id=${teamId}`, {
      headers: { Cookie: cookieFor(userB) },
    });
    expect(bGet.status).toBe(403);

    // User B must not be able to overwrite it.
    const bPost = await fetch(`${origin}/api/team-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieFor(userB), 'Origin': origin },
      body: JSON.stringify({ id: teamId, version: created.version, name: 'hijacked' }),
    });
    expect(bPost.status).toBe(403);

    // User A still has full access.
    const aGet = await fetch(`${origin}/api/team-profile?id=${teamId}`, {
      headers: { Cookie: cookieFor(userA) },
    });
    expect(aGet.status).toBe(200);
    const aData = await aGet.json();
    expect(aData.name).toBe('A Team');
  });
});

describe('DoS guard: /api/audit/bulk URL cap (#1216)', () => {
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

  it(`rejects a CSV with more than ${MAX_BULK_AUDIT_URLS} repositories with 400`, async () => {
    const rows = Array.from(
      { length: MAX_BULK_AUDIT_URLS + 10 },
      (_, i) => `https://github.com/owner/repo-${i}`,
    ).join('\n');

    const formData = new FormData();
    formData.append('csv', new Blob([rows], { type: 'text/csv' }), 'repos.csv');

    const res = await fetch(`${origin}/api/audit/bulk`, {
      method: 'POST',
      headers: { 'Origin': origin },
      body: formData
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.maxAllowed).toBe(MAX_BULK_AUDIT_URLS);
  });
});
