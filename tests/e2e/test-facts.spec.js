import { test, expect } from '@playwright/test';

test('check facts card', async ({ page }) => {
  // Log page console messages
  page.on('console', msg => {
    void 0;
  });

  // Mock API requests to prevent 401 redirect
  await page.route('**/api/problem-notes', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, notes: {} })
    });
  });

  await page.route('**/api/refresh', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  void 0;
  
  const cardCount = await page.locator('.facts-card').count();
  const textElsCount = await page.locator('#factText').count();
  
  void 0;
  void 0;
  void 0;

  if (cardCount > 0) {
    const texts = await page.locator('.facts-card').allInnerTexts();
    void 0;
  }
  
  if (textElsCount > 0) {
    const texts = await page.locator('#factText').allTextContents();
    void 0;
  }
  
  void 0;
});
