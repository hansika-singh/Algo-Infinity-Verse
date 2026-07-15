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

// Import requestHandler from server
const { requestHandler } = await import('../server.js');

describe('AI Code Reviewer API Endpoint (/api/ai/review)', () => {
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
    process.env.GEMINI_API_KEY = 'test_gemini_api_key_123';
  });

  it('should return 400 Bad Request if code is missing', async () => {
    const res = await fetch(`${origin}/api/ai/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
      },
      body: JSON.stringify({
        language: 'javascript',
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Code is required');
  });

  it('should return 503 Service Unavailable if GEMINI_API_KEY is not set', async () => {
    delete process.env.GEMINI_API_KEY;

    const res = await fetch(`${origin}/api/ai/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
      },
      body: JSON.stringify({
        code: 'const x = 5;',
        language: 'javascript',
      }),
    });
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toContain('GEMINI_API_KEY not set');
  });

  it('should return valid suggestions when Gemini API responds successfully', async () => {
    const mockSuggestions = [
      {
        lineStart: 1,
        lineEnd: 2,
        severity: 'warning',
        message: 'Use const instead of let.',
        suggestionContent: 'const x = 5;',
      },
    ];

    // Mock global.fetch to intercept Google API call
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
                        text: JSON.stringify(mockSuggestions),
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

    const res = await fetch(`${origin}/api/ai/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
      },
      body: JSON.stringify({
        code: 'let x = 5;\nx = 6;',
        language: 'javascript',
        problemName: 'test-prob',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.suggestions).toHaveLength(1);
    expect(data.suggestions[0].lineStart).toBe(1);
    expect(data.suggestions[0].severity).toBe('warning');
    expect(data.suggestions[0].message).toBe('Use const instead of let.');
    expect(data.suggestions[0].suggestionContent).toBe('const x = 5;');
  });

  it('should handle markdown fenced JSON blocks returned by Gemini', async () => {
    const mockSuggestions = [
      {
        lineStart: 2,
        lineEnd: 2,
        severity: 'error',
        message: 'Syntax error.',
        suggestionContent: 'return x;',
      },
    ];

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
                        text: `\`\`\`json\n${JSON.stringify(mockSuggestions)}\n\`\`\``,
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

    const res = await fetch(`${origin}/api/ai/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
      },
      body: JSON.stringify({
        code: 'function test() {\nret x;\n}',
        language: 'javascript',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.suggestions).toHaveLength(1);
    expect(data.suggestions[0].lineStart).toBe(2);
    expect(data.suggestions[0].severity).toBe('error');
  });
});
