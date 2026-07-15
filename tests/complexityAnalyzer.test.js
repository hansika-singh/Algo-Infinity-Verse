import http from 'http';
import IORedis from 'ioredis';
import { Worker } from 'bullmq';

// Stub Redis & Worker so importing/running tests doesn't hang
IORedis.prototype.connect = function () {
  return Promise.resolve();
};
Worker.prototype.run = function () {
  return Promise.resolve();
};

process.env.NODE_ENV = 'test';

// Import requestHandler from server
const { requestHandler } = await import('../server.js');

describe('Algorithmic Complexity Profiler API Endpoint (/api/execute/profile)', () => {
  let server;
  let origin;

  beforeAll(async () => {
    // Mount the handler on a standard HTTP server
    server = http.createServer((req, res) => requestHandler(req, res));
    const port = await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve(server.address().port));
    });
    origin = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('should return 400 Bad Request if codeA, codeB or inputSizes are missing', async () => {
    const res = await fetch(`${origin}/api/execute/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
      },
      body: JSON.stringify({
        codeA: 'function solve(n) { return n; }',
        inputSizes: [1, 2],
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Both codeA and codeB are required');
  });

  it('should return 400 if inputSizes exceeds 8 items', async () => {
    const res = await fetch(`${origin}/api/execute/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
      },
      body: JSON.stringify({
        codeA: 'function solve(n) { return n; }',
        codeB: 'function solve(n) { return n; }',
        inputSizes: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('cannot exceed 8 sizes');
  });

  it('should profile normal execution sizes successfully', async () => {
    const res = await fetch(`${origin}/api/execute/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
      },
      body: JSON.stringify({
        codeA: 'function solve(n) { return n * 2; }',
        codeB: 'function solve(n) { return n * n; }',
        inputSizes: [5, 10],
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.results).toHaveLength(2);
    expect(data.results[0]).toHaveProperty('inputSize', 5);
    expect(data.results[0]).toHaveProperty('timeA');
    expect(data.results[0]).toHaveProperty('timeB');
    expect(data.results[0]).toHaveProperty('memA');
    expect(data.results[0]).toHaveProperty('memB');
  });

  it('should terminate and return error if implementation A has an infinite loop', async () => {
    const res = await fetch(`${origin}/api/execute/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
      },
      body: JSON.stringify({
        codeA: 'function solve(n) { while(true){} }',
        codeB: 'function solve(n) { return n; }',
        inputSizes: [10],
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('timed out');
  });

  it('should terminate and return error if implementation B runs out of memory (16MB limit)', async () => {
    // Array allocation of size 1,000,000 floats is around 8MB,
    // and allocating elements sequentially or nested maps will exceed 16MB very fast.
    const res = await fetch(`${origin}/api/execute/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
      },
      body: JSON.stringify({
        codeA: 'function solve(n) { return n; }',
        codeB: `function solve(n) {
          const arr = [];
          for (let i = 0; i < 500000; i++) {
            arr.push({ data: new Array(10).fill('a') });
          }
          return arr.length;
        }`,
        inputSizes: [10],
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('exceeded');
  });
});
