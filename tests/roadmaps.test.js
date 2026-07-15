import http from 'http';
import IORedis from 'ioredis';
import { Worker } from 'bullmq';

// Stub Redis so importing the server does not hang
IORedis.prototype.connect = function () {
  return Promise.resolve();
};
Worker.prototype.run = function () {
  return Promise.resolve();
};

process.env.NODE_ENV = 'test';

const { default: handler } = await import('../api/[...path].js');

describe('/api/roadmaps registry endpoint', () => {
  let server;
  let origin;

  beforeAll(async () => {
    server = http.createServer((req, res) => handler(req, res));
    const port = await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve(server.address().port));
    });
    origin = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('GET /api/roadmaps returns the JSON registry', async () => {
    const res = await fetch(`${origin}/api/roadmaps`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('beginner');
    expect(data).toHaveProperty('advanced');
    expect(data.beginner.title).toBe('Beginner DSA Roadmap');
    expect(data.advanced.title).toBe('Advanced DSA Roadmap');
    expect(data.beginner.steps.length).toBe(10);
    expect(data.advanced.steps.length).toBe(10);
  });

  it('has valid roadmaps HTML, CSS and JS files', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');

    const htmlPath = path.join(process.cwd(), 'pages', 'roadmaps', 'roadmaps.html');
    const cssPath = path.join(process.cwd(), 'pages', 'roadmaps', 'roadmaps.css');
    const jsPath = path.join(process.cwd(), 'pages', 'roadmaps', 'roadmaps.js');

    await expect(fs.access(htmlPath)).resolves.not.toThrow();
    await expect(fs.access(cssPath)).resolves.not.toThrow();
    await expect(fs.access(jsPath)).resolves.not.toThrow();
  });
});
