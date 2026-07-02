import { test, expect } from '@playwright/test';

test.describe('Global Error Boundary E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console diagnostics
    page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });

    // Block ServiceWorker registration
    await page.context().route('**/sw.js', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'text/javascript',
        body: 'console.log("SW blocked in tests");'
      });
    });

    // Mock API session request to return authenticated: true
    await page.context().route('**/api/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          user: { sub: 'test-user', email: 'test@example.com' }
        })
      });
    });

    // Mock other initial API requests
    await page.context().route('**/api/problem-notes', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, notes: {} }) });
    });
    await page.context().route('**/api/refresh', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });
    await page.context().route('**/api/spaced-repetition', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, cards: {} }) });
    });
    await page.context().route('**/api/leaderboard', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, leaderboard: [] }) });
    });
  });

  test('should capture uncaught runtime exceptions and report to backend', async ({ page }) => {
    let errorReportPayload = null;
    let resolveReport;
    const reportPromise = new Promise(resolve => {
      resolveReport = resolve;
    });

    // Intercept log-error endpoint
    await page.context().route('**/api/log-error', async route => {
      errorReportPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
      resolveReport();
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Trigger an uncaught exception asynchronously in the browser context
    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error('Simulated runtime error');
      }, 50);
    });

    // Wait for the report request to be sent
    await reportPromise;

    // Verify error boundary toast is visible in the UI
    const toast = page.locator('#error-boundary-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Simulated runtime error');

    // Verify payload contents
    expect(errorReportPayload).not.toBeNull();
    expect(errorReportPayload.message).toContain('Simulated runtime error');
    expect(errorReportPayload.feature).toBe('general');
    expect(errorReportPayload.pageName).not.toBeNull();
    expect(errorReportPayload.lastActionTimestamp).toBeGreaterThan(0);
    expect(errorReportPayload.stack).toContain('Error: Simulated runtime error');
  });

  test('should capture unhandled promise rejections and report to backend', async ({ page }) => {
    let errorReportPayload = null;
    let resolveReport;
    const reportPromise = new Promise(resolve => {
      resolveReport = resolve;
    });

    // Intercept log-error endpoint
    await page.context().route('**/api/log-error', async route => {
      errorReportPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
      resolveReport();
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Trigger an unhandled promise rejection in the browser context
    await page.evaluate(() => {
      Promise.reject(new Error('Simulated unhandled promise rejection'));
    });

    // Wait for the report request to be sent
    await reportPromise;

    // Verify error boundary toast is visible in the UI
    const toast = page.locator('#error-boundary-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Simulated unhandled promise rejection');

    // Verify payload contents
    expect(errorReportPayload).not.toBeNull();
    expect(errorReportPayload.message).toContain('Unhandled Promise Rejection: Simulated unhandled promise rejection');
    expect(errorReportPayload.stack).toContain('Simulated unhandled promise rejection');
  });
});
