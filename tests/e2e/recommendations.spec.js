import { test, expect } from '@playwright/test';

test.describe('AI Recommendations Debounce & Abort E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console log diagnostics
    page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });

    page.on('requestfailed', request => {
      console.log('REQUEST FAILED:', request.method(), request.url(), request.failure()?.errorText);
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        console.log('BAD RESPONSE:', response.status(), response.url());
      }
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

    // Mock problem notes request
    await page.context().route('**/api/problem-notes', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, notes: {} })
      });
    });

    // Mock the refresh endpoint to prevent redirects or auth errors
    await page.context().route('**/api/refresh', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Mock spaced repetition endpoint
    await page.context().route('**/api/spaced-repetition', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, cards: {} })
      });
    });

    // Mock leaderboard endpoint
    await page.context().route('**/api/leaderboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, leaderboard: [] })
      });
    });
  });

  test('should debounce multiple rapid clicks and make only one API call', async ({ page }) => {
    let callCount = 0;
    
    // Intercept and delay recommendations response
    await page.context().route('**/api/recommendations/next', async route => {
      callCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          recommendation: {
            topic: 'dp',
            reason: 'Practice Dynamic Programming to boost your performance.',
            aiTip: 'Solve knapsack problem variants.'
          }
        })
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Set debounce delay to 1500ms
    const delayInput = page.locator('#ai-recommend-debounce-input');
    await expect(delayInput).toBeVisible();
    await delayInput.fill('1500');

    const recommendBtn = page.locator('#ai-recommend-btn');
    await expect(recommendBtn).toBeVisible();

    // Click 3 times rapidly
    await recommendBtn.click();
    await recommendBtn.click();
    await recommendBtn.click();

    // Verify UI shows "Waiting..." (debouncing)
    const statusMsg = page.locator('#ai-recommend-status-msg');
    await expect(statusMsg).toHaveText('Waiting...');

    // Wait for debounce and fetch to complete
    await page.waitForTimeout(2000);

    // Verify UI shows success state and only 1 network call occurred
    await expect(statusMsg).toHaveText('New result');
    expect(callCount).toBe(1);
  });

  test('should abort an in-flight request when clicked again (AbortController test)', async ({ page }) => {
    let requestCount = 0;
    let resolveFirstRequest;
    const firstRequestPromise = new Promise(resolve => {
      resolveFirstRequest = resolve;
    });

    await page.context().route('**/api/recommendations/next', async route => {
      requestCount++;
      const currentReqNum = requestCount;

      if (currentReqNum === 1) {
        // Hold the first request open until we trigger the abort
        resolveFirstRequest();
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          });
        } catch (err) {
          // Expecting abort error here
        }
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            recommendation: {
              topic: 'graphs',
              reason: 'Graph traversal is critical.',
              aiTip: 'Focus on BFS/DFS.'
            }
          })
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ensure we do NOT disable the button during fetch so we can click it again
    const disableToggle = page.locator('#ai-recommend-disable-toggle');
    await disableToggle.uncheck();

    // Set debounce delay to 0 for immediate execution
    const delayInput = page.locator('#ai-recommend-debounce-input');
    await delayInput.fill('0');

    const recommendBtn = page.locator('#ai-recommend-btn');
    const statusMsg = page.locator('#ai-recommend-status-msg');

    // Click first time
    await recommendBtn.click();
    await firstRequestPromise; // Wait until backend route handler is reached for the first request
    
    // Click again immediately to abort the first request and start the second one
    await recommendBtn.click();

    // Verify UI shows "Request cancelled" or eventually transitions to success
    await page.waitForTimeout(1000);
    await expect(statusMsg).toHaveText('New result');
    expect(requestCount).toBe(2);
  });

  test('should disable button during fetch if toggle is checked', async ({ page }) => {
    let firstRequestHandled = false;
    let resolveRequest;
    const requestPromise = new Promise(resolve => {
      resolveRequest = resolve;
    });

    await page.context().route('**/api/recommendations/next', async route => {
      resolveRequest();
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          recommendation: {
            topic: 'trees',
            reason: 'Practice binary search trees.',
            aiTip: 'Check tree height balance.'
          }
        })
      });
      firstRequestHandled = true;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ensure we DO disable the button during fetch
    const disableToggle = page.locator('#ai-recommend-disable-toggle');
    await disableToggle.check();

    // Set debounce delay to 0
    const delayInput = page.locator('#ai-recommend-debounce-input');
    await delayInput.fill('0');

    const recommendBtn = page.locator('#ai-recommend-btn');

    // Click to start fetch
    await recommendBtn.click();
    await requestPromise;

    // Verify button is disabled
    await expect(recommendBtn).toBeDisabled();

    // Wait for completion
    await page.waitForTimeout(1800);
    await expect(recommendBtn).toBeEnabled();
    expect(firstRequestHandled).toBe(true);
  });
});
