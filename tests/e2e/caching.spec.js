import { test, expect } from '@playwright/test';

test.describe('Static Asset Performance and HTTP Caching', () => {
  test('should return no-store/no-cache headers for HTML files to prevent nonce caching', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers['cache-control']).toBe('no-store, no-cache, must-revalidate, private');
    expect(headers['etag']).toBeDefined();
  });

  test('should return Cache-Control and ETag headers for static JS/CSS assets', async ({ request }) => {
    const response = await request.get('/styles.css');
    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers['cache-control']).toBe('no-cache, public');
    expect(headers['etag']).toBeDefined();
  });

  test('should return 304 Not Modified when sending a valid If-None-Match ETag', async ({ request }) => {
    // 1. Fetch style sheet to acquire its current ETag
    const firstResponse = await request.get('/styles.css');
    expect(firstResponse.status()).toBe(200);
    const etag = firstResponse.headers()['etag'];
    expect(etag).toBeDefined();

    // 2. Perform conditional request using If-None-Match
    const secondResponse = await request.get('/styles.css', {
      headers: {
        'If-None-Match': etag,
      },
    });

    // 3. Confirm 304 Not Modified response
    expect(secondResponse.status()).toBe(304);
  });
});
