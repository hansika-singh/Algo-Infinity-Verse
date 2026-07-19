import http from 'http';
import IORedis from 'ioredis';
import { Worker } from 'bullmq';

// Stub Redis so importing the server (via the catch-all) does not hang.
IORedis.prototype.connect = function () {
  return Promise.resolve();
};
Worker.prototype.run = function () {
  return Promise.resolve();
};

process.env.NODE_ENV = 'test';

// The catch-all serverless entry — it must delegate to server.js's handler.
const { default: handler, config } = await import('../api/[...path].js');

describe('Vercel catch-all delegates server-only /api routes (#1218)', () => {
  let server;
  let origin;

  beforeAll(async () => {
    // A Vercel Node function is (req, res) => …; mounting it on a plain http
    // server reproduces how Vercel invokes it.
    server = http.createServer((req, res) => handler(req, res));
    const port = await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve(server.address().port));
    });
    origin = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('disables Vercel body parsing so server.js can read the raw stream', () => {
    expect(config).toEqual({ api: { bodyParser: false } });
  });

  it('serves a route defined only in server.js (/api/firebase-config)', async () => {
    // This route exists only in server.js — there is no api/firebase-config.js,
    // so before the catch-all it was a 404 in production. A structured JSON
    // response proves the request reached server.js's handleApi.
    const res = await fetch(`${origin}/api/firebase-config`);
    expect(res.status).toBe(503); // not configured in the test env
    const data = await res.json();
    expect(data).toHaveProperty('configured', false);
  });

  it('returns server.js\'s JSON 404 for an unknown /api route (not a crash)', async () => {
    const res = await fetch(`${origin}/api/this-route-does-not-exist`);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});
