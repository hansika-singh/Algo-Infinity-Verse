// tests/revisionStorage.test.js

import { loadRevisionData, saveRevisionData } from '../modules/revisionStorage.js';

describe('Revision Storage', () => {
  let mockFetch;
  let mockLocalStorage;

  let getItemCalls = 0;
  let setItemCalls = 0;
  let fetchCallCount = 0;
  let fetchResponses = [];

  beforeEach(() => {
    mockLocalStorage = {};
    getItemCalls = 0;
    setItemCalls = 0;
    fetchCallCount = 0;
    fetchResponses = [];

    global.localStorage = {
      getItem: (key) => { getItemCalls++; return mockLocalStorage[key] || null; },
      setItem: (key, value) => { setItemCalls++; mockLocalStorage[key] = String(value); },
      clear: () => { mockLocalStorage = {}; }
    };

    mockFetch = async (url, options) => {
      fetchCallCount++;
      const nextResp = fetchResponses.shift();
      if (nextResp) return nextResp;
      return { ok: false, status: 500 };
    };
    mockFetch.mockResolvedValueOnce = (val) => { fetchResponses.push(val); };
    global.fetch = mockFetch;
  });

  afterEach(() => {
    delete global.localStorage;
    delete global.fetch;
  });

  it('falls back to local storage if user is not authenticated', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: false, user: null })
    });

    const userProgress = { revisionSchedule: {}, revisionCalendar: {} };
    mockLocalStorage['algoInfinityVerse'] = JSON.stringify({
      revisionSchedule: { arrays: { currentStage: 2 } }
    });

    await loadRevisionData(userProgress);
    expect(userProgress.revisionSchedule.arrays.currentStage).toBe(2);
    expect(fetchCallCount).toBe(1); // just session check
  });

  it('merges guest and remote schedules on login, keeping the more advanced stages', async () => {
    // Session is authenticated
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: true, user: { sub: 'user-123' } })
    });

    // GET /api/revision returns remote schedule
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({
        success: true,
        revisionSchedule: {
          arrays: { currentStage: 1, history: [] },
          strings: { currentStage: 3, history: [] }
        },
        revisionCalendar: { history: [{ dayKey: '2026-07-09', taskId: 'strings-0' }] }
      })
    });

    // PUT /api/revision return mock success
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ success: true })
    });

    const userProgress = {
      revisionSchedule: {
        arrays: { currentStage: 4, history: [] } // Guest has newer Arrays stage
      },
      revisionCalendar: { history: [{ dayKey: '2026-07-10', taskId: 'arrays-0' }] }
    };

    await loadRevisionData(userProgress);

    // Expect Arrays stage to be guest (4) and Strings stage to be remote (3)
    expect(userProgress.revisionSchedule.arrays.currentStage).toBe(4);
    expect(userProgress.revisionSchedule.strings.currentStage).toBe(3);

    // Expect merged calendar history to contain both days
    expect(userProgress.revisionCalendar.history.length).toBe(2);
  });
});
