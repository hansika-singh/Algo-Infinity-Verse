import { test, expect } from '@playwright/test';

test('check facts card', async ({ page }) => {
  // Log page console messages
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
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

  console.log('Current Page URL:', page.url());
  
  const cardCount = await page.locator('.facts-card').count();
  const textElsCount = await page.locator('#factText').count();
  
  console.log('--- FACTS CARD DIAGNOSTIC INFO ---');
  console.log('cardCount:', cardCount);
  console.log('textElsCount:', textElsCount);

  if (cardCount > 0) {
    const texts = await page.locator('.facts-card').allInnerTexts();
    console.log('facts-card innerTexts:', JSON.stringify(texts, null, 2));
  }
  
  if (textElsCount > 0) {
    const texts = await page.locator('#factText').allTextContents();
    console.log('#factText contents:', JSON.stringify(texts, null, 2));
  }
  
  console.log('-----------------------------------');
});
