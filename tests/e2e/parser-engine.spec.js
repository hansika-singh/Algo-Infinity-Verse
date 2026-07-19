import { test, expect } from '@playwright/test';

test.describe('Parser Engine Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Block ServiceWorker registration
    await page.context().route('**/sw.js', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'text/javascript',
        body: 'console.log("SW blocked in tests");',
      });
    });
  });

  test('should load parser engine, build LL(1) tables, and run step simulation', async ({
    page,
  }) => {
    await page.goto('/pages/ai-features/parser-engine/parser-engine.html');
    await page.waitForLoadState('networkidle');

    // Check title and engine ready status
    await expect(page.locator('.logo-title')).toContainText('Algo Infinity Verse');
    await expect(page.locator('#engineBadge')).toContainText('Parser Engine: Ready');

    // Click Build Parser Table
    await page.click('#btnBuild');

    // Ensure FIRST & FOLLOW sets are shown
    const setsGrid = page.locator('#setsGrid');
    await expect(setsGrid).toBeVisible();

    // Verify parser engine is ready for simulation
    await expect(page.locator('#engineBadge')).toContainText('Engine: Running');

    // Step the simulation
    await page.click('#btnStep');

    // Tape cells should reflect input pointer advance/simulation
    const tapeActiveCell = page.locator('.tape-cell.active-cell');
    await expect(tapeActiveCell).toBeVisible();
  });
});
