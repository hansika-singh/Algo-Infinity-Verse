import { jest } from '@jest/globals';
import IORedis from 'ioredis';
import { Worker } from 'bullmq';

// Stub out Redis connection to prevent server crash/hang
IORedis.prototype.connect = function() {
  return Promise.resolve();
};
Worker.prototype.run = function() {
  return Promise.resolve();
};

process.env.NODE_ENV = 'test';

// Import server after environment setup
const { server } = await import('../server.js');

describe('Resume Upload API Validation (/api/analyze-resume)', () => {
  let port;
  let url;
  let origin;

  beforeAll(async () => {
    const listenPromise = new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        resolve(server.address().port);
      });
    });
    port = await listenPromise;
    origin = `http://127.0.0.1:${port}`;
    url = `${origin}/api/analyze-resume`;
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
  });

  it('should reject requests with no file with status 400', async () => {
    const formData = new FormData();
    const res = await fetch(url, {
      method: 'POST',
      headers: { Origin: origin },
      body: formData,
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('No resume file uploaded.');
  });

  it('should reject unapproved MIME types with status 400', async () => {
    const formData = new FormData();
    const mockFile = new Blob(['hello content'], { type: 'text/plain' });
    formData.append('resume', mockFile, 'resume.txt');

    const res = await fetch(url, {
      method: 'POST',
      headers: { Origin: origin },
      body: formData,
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Unsupported file type. Upload PDF or DOCX.');
  });

  it('should reject PDF mime type with invalid PDF magic bytes', async () => {
    const formData = new FormData();
    const mockFile = new Blob(['invalid magic bytes'], { type: 'application/pdf' });
    formData.append('resume', mockFile, 'resume.pdf');

    const res = await fetch(url, {
      method: 'POST',
      headers: { Origin: origin },
      body: formData,
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('File content mismatch');
  });

  it('should reject file that exceeds maximum size limit with status 413', async () => {
    const formData = new FormData();
    // Exceeds 5MB size limit (5.5MB)
    const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024);
    const mockFile = new Blob([largeBuffer], { type: 'application/pdf' });
    formData.append('resume', mockFile, 'large.pdf');

    const res = await fetch(url, {
      method: 'POST',
      headers: { Origin: origin },
      body: formData,
    });
    expect(res.status).toBe(413);
    const data = await res.json();
    expect(data.error).toBe('Resume file is too large.');
  });

  it('should pass upload validation when magic bytes match MIME type', async () => {
    const formData = new FormData();
    // Valid PDF starts with %PDF- (25 50 44 46)
    const pdfBuffer = Buffer.from('%PDF-1.4\n%...\n%%EOF');
    const mockFile = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('resume', mockFile, 'resume.pdf');

    const res = await fetch(url, {
      method: 'POST',
      headers: { Origin: origin },
      body: formData,
    });
    // It should pass validation, though it might fail inside extractResumeText (returning 500 or similar),
    // but the status code will NOT be 400 (content mismatch).
    expect(res.status).not.toBe(400);
  });

  it('should reject a cross-site request (no token, foreign Origin) with 403', async () => {
    const formData = new FormData();
    const pdfBuffer = Buffer.from('%PDF-1.4\n%...\n%%EOF');
    formData.append('resume', new Blob([pdfBuffer], { type: 'application/pdf' }), 'resume.pdf');

    const res = await fetch(url, {
      method: 'POST',
      headers: { Origin: 'http://evil.example.com' },
      body: formData,
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('CSRF validation failed.');
  });

  it('should reject a state-changing request with no Origin/Referer and no token with 403', async () => {
    const formData = new FormData();
    const pdfBuffer = Buffer.from('%PDF-1.4\n%...\n%%EOF');
    formData.append('resume', new Blob([pdfBuffer], { type: 'application/pdf' }), 'resume.pdf');

    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    expect(res.status).toBe(403);
  });

  it('should accept a valid double-submit CSRF token without any Origin header', async () => {
    // 1. Obtain a token + the matching HttpOnly csrfSecret cookie.
    const tokenRes = await fetch(`${origin}/api/csrf-token`);
    const { csrfToken } = await tokenRes.json();
    const setCookie = tokenRes.headers.getSetCookie().find((c) => c.startsWith('csrfSecret='));
    const csrfSecretCookie = setCookie.split(';')[0];

    // 2. POST with the token header + secret cookie, but NO Origin/Referer —
    //    the double-submit token alone must satisfy the CSRF check.
    const formData = new FormData();
    const pdfBuffer = Buffer.from('%PDF-1.4\n%...\n%%EOF');
    formData.append('resume', new Blob([pdfBuffer], { type: 'application/pdf' }), 'resume.pdf');

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken, Cookie: csrfSecretCookie },
      body: formData,
    });
    expect(res.status).not.toBe(403);
  });
});
