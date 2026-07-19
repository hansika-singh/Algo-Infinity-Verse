import http from 'http';
import IORedis from 'ioredis';
import { Worker } from 'bullmq';
import { jest } from '@jest/globals';

// Stub Redis & Worker so importing/running tests doesn't hang
IORedis.prototype.connect = function () {
  return Promise.resolve();
};
Worker.prototype.run = function () {
  return Promise.resolve();
};

process.env.NODE_ENV = 'test';

const { requestHandler } = await import('../server.js');
const { aiHintLimiter } = await import('../backend/utils/rateLimiter.js');

describe('Context-Aware AI Hint API Endpoint (/api/hint)', () => {
  let server;
  let origin;
  let originalFetch;

  beforeAll(async () => {
    // Mount the handler on a standard HTTP server
    server = http.createServer((req, res) => requestHandler(req, res));
    const port = await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve(server.address().port));
    });
    origin = `http://127.0.0.1:${port}`;
    originalFetch = global.fetch;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test_gemini_api_key_456';
    // Clear rate limiters
    aiHintLimiter.attempts.clear();
    aiHintLimiter.cooldowns.clear();
    jest.restoreAllMocks();
  });

  it('should return 400 Bad Request if problem title is missing', async () => {
    const res = await fetch(`${origin}/api/hint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
      },
      body: JSON.stringify({
        description: 'Find two sum',
        level: 1,
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Problem title is required');
  });

  it('should return 503 Service Unavailable if GEMINI_API_KEY is not set', async () => {
    delete process.env.GEMINI_API_KEY;

    const res = await fetch(`${origin}/api/hint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
      },
      body: JSON.stringify({
        title: 'Two Sum',
        level: 1,
      }),
    });
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toContain('GEMINI_API_KEY not set');
  });

  it('should pass hidden contexts (code + tags) to the prompt and succeed', async () => {
    let capturedPrompt = '';
    global.fetch = jest.fn((url, options) => {
      if (url.includes('generativelanguage.googleapis.com')) {
        const body = JSON.parse(options.body);
        capturedPrompt = body.contents[0].parts[0].text;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: 'Try using a sliding window to find the longest unique substring.',
                      },
                    ],
                  },
                },
              ],
            }),
        });
      }
      return originalFetch(url, options);
    });

    const res = await fetch(`${origin}/api/hint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
      },
      body: JSON.stringify({
        title: 'Longest Substring',
        description: 'Find the longest substring without repeating characters.',
        level: 2,
        currentCode: 'function longest(s) { let map = {}; }',
        tags: 'Array, Sliding Window',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.hint).toBe('Try using a sliding window to find the longest unique substring.');

    // Verify hidden contexts were embedded in the prompt
    expect(capturedPrompt).toContain("[STUDENT'S CURRENT CODE STATE]");
    expect(capturedPrompt).toContain('function longest(s) { let map = {}; }');
    expect(capturedPrompt).toContain('[PROBLEM CATEGORY/CONTEXT]: Array, Sliding Window');
    expect(capturedPrompt).toContain('NEVER write, generate, suggest, or correct actual code');
  });

  it('should trigger the safety guardrail fallback if Gemini responds with code block fences or markers', async () => {
    global.fetch = jest.fn((url, options) => {
      if (url.includes('generativelanguage.googleapis.com')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: 'Here is the code:\n```javascript\nfunction twoSum() {}\n```',
                      },
                    ],
                  },
                },
              ],
            }),
        });
      }
      return originalFetch(url, options);
    });

    const res = await fetch(`${origin}/api/hint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
      },
      body: JSON.stringify({
        title: 'Two Sum',
        level: 1,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    // Should have intercepted the code and returned the conceptual fallback message
    expect(data.hint).toBe(
      'Analyze your loop conditions or check if you are handling extreme values (like empty input or large inputs) correctly.'
    );
  });

  it('should enforce rate limiting and return 429 when max requests exceeded', async () => {
    global.fetch = jest.fn((url, options) => {
      if (url.includes('generativelanguage.googleapis.com')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: 'Conceptual hint text.',
                      },
                    ],
                  },
                },
              ],
            }),
        });
      }
      return originalFetch(url, options);
    });

    // Make 15 successful requests (the limit)
    for (let i = 0; i < 15; i++) {
      const res = await fetch(`${origin}/api/hint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: origin,
        },
        body: JSON.stringify({
          title: 'Two Sum',
          level: 1,
        }),
      });
      expect(res.status).toBe(200);
    }

    // The 16th request must be rate limited
    const limitRes = await fetch(`${origin}/api/hint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
      },
      body: JSON.stringify({
        title: 'Two Sum',
        level: 1,
      }),
    });
    expect(limitRes.status).toBe(429);
    const data = await limitRes.json();
    expect(data.error).toContain('Too many hint requests. Please try again later.');
  });
});
