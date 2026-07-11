import { test, expect } from '@playwright/test';

test.describe('Navigation and Topics Flow', () => {
  test.beforeEach(async ({ page }) => {
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

  test('should navigate to DSA Topics and view content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ensure topics section is visible
    const topicsSection = page.locator('#topics');
    await expect(topicsSection).toBeVisible();

    // Ensure the practice page loads
    await page.goto('/pages/practice/problems.html');
    await expect(page).toHaveURL(/problems\.html/);
    const heroTitle = page.locator('.pp-hero-title');
    await expect(heroTitle).toBeVisible();
  });
});
