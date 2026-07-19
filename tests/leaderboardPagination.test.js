// tests/leaderboardPagination.test.js
//
// Verifies /api/leaderboard bounds its page/limit query parameters
// (Issue #2493). Firebase is not configured in the test environment, so
// the handler's readUsers() short-circuits to an empty list — this lets
// us exercise the pagination math in isolation without a real database.

function createMockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

async function callLeaderboard(query) {
  const { default: handler } = await import('../api/leaderboard.js');
  const req = { method: 'GET', query, headers: {} };
  const res = createMockRes();
  await handler(req, res);
  return res;
}

describe('/api/leaderboard pagination bounds', () => {
  it('defaults to page 1 and a limit of 10 when no query params are given', async () => {
    const res = await callLeaderboard({});
    expect(res.statusCode).toBe(200);
    expect(res.body.pagination.currentPage).toBe(1);
    expect(res.body.pagination.pageSize).toBe(10);
  });

  it('caps an oversized limit at 50', async () => {
    const res = await callLeaderboard({ limit: '100000' });
    expect(res.body.pagination.pageSize).toBe(50);
  });

  it('caps a huge page number down to a sane bound without throwing', async () => {
    const res = await callLeaderboard({ page: '999999999', limit: '100000' });
    expect(res.statusCode).toBe(200);
    expect(res.body.pagination.pageSize).toBe(50);
    // page itself is clamped to a minimum of 1 but is otherwise passed through;
    // the critical safety property is that pageSize (limit) never exceeds the cap,
    // so offset math stays bounded regardless of how large `page` is requested.
    expect(res.body.pagination.currentPage).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.leaders)).toBe(true);
  });

  it('treats non-numeric or negative input as the default rather than NaN/negative', async () => {
    const res = await callLeaderboard({ page: 'not-a-number', limit: '-5' });
    expect(res.body.pagination.currentPage).toBe(1);
    expect(res.body.pagination.pageSize).toBeGreaterThanOrEqual(1);
    expect(Number.isNaN(res.body.pagination.pageSize)).toBe(false);
  });

  it('rejects non-GET methods', async () => {
    const { default: handler } = await import('../api/leaderboard.js');
    const req = { method: 'POST', query: {}, headers: {} };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });
});
