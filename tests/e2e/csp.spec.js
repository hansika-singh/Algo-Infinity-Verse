import { test, expect } from '@playwright/test';

test.describe('Content Security Policy (CSP) and Security Headers', () => {
  test('should include all configured security headers on HTML pages', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toBe('geolocation=(), camera=(), microphone=()');
    expect(headers['content-security-policy']).toBeDefined();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['content-security-policy']).toContain("script-src 'self' 'nonce-");
  });

  const targetPages = [
    '/',
    '/pages/auth/login.html',
    '/pages/visualizers/stack-queue-visualizer/stack-queue-visualizer.html'
  ];

  for (const pagePath of targetPages) {
    test(`should load page "${pagePath}" with no CSP violations or console errors`, async ({ page }) => {
      const cspViolations = [];
      const scriptErrors = [];

      // Monitor console logs for CSP violations and general script errors
      page.on('console', (msg) => {
        const text = msg.text();
        if (text.toLowerCase().includes('content security policy') || text.toLowerCase().includes('csp')) {
          cspViolations.push(`Console Warning/Error: ${text}`);
        }
      });

      page.on('pageerror', (err) => {
        if (err.message.toLowerCase().includes('csp') || err.message.toLowerCase().includes('content security policy')) {
          cspViolations.push(`Page Error: ${err.message}`);
        } else {
          scriptErrors.push(err.message);
        }
      });

      // Visit the page
      const response = await page.goto(pagePath);
      expect(response.status()).toBe(200);

      // Verify page is rendered correctly
      await expect(page).not.toHaveTitle(/Not Found/i);

      // Wait to allow all asynchronous JS scripts/libraries to run
      await page.waitForTimeout(2000);

      // Fail test if CSP violations were captured
      expect(cspViolations).toEqual([]);
      expect(scriptErrors).toEqual([]);
    });
  }
});
