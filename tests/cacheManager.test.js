import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load CacheManager source
const cacheManagerCode = fs.readFileSync(path.resolve(__dirname, '../modules/cacheManager.js'), 'utf-8');

describe('CacheManager', () => {
  let mockStore;

  beforeEach(() => {
    mockStore = new Map();
    global.indexedDB = {
      open: jest.fn((dbName, version) => {
        const req = {};
        Promise.resolve().then(() => {
          req.result = {
            objectStoreNames: {
              contains: () => true
            },
            transaction: () => ({
              objectStore: () => ({
                put: (record) => {
                  mockStore.set(record.url, record);
                  const putReq = {};
                  Promise.resolve().then(() => {
                    if (putReq.onsuccess) putReq.onsuccess();
                  });
                  return putReq;
                },
                get: (url) => {
                  const getReq = {};
                  Promise.resolve().then(() => {
                    getReq.result = mockStore.get(url);
                    if (getReq.onsuccess) getReq.onsuccess();
                  });
                  return getReq;
                },
                delete: (url) => {
                  mockStore.delete(url);
                  const delReq = {};
                  Promise.resolve().then(() => {
                    if (delReq.onsuccess) delReq.onsuccess();
                  });
                  return delReq;
                }
              })
            })
          };
          if (req.onsuccess) req.onsuccess({ target: req });
        });
        return req;
      })
    };
    
    global.window = {};
    global.fetch = jest.fn();
    jest.useFakeTimers();

    // Evaluate in a context where window and indexedDB exists
    if (!global.CacheManager) {
      eval(cacheManagerCode.replace(/const apiCache = new CacheManager\(\);\s*window\.apiCache = apiCache;/, '') + '\nglobal.CacheManager = CacheManager;');
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('should set and get data from cache', async () => {
    const cache = new CacheManager();
    await cache.set('http://test.com', { test: 'data' }, 'json', 1000);
    
    const data = await cache.get('http://test.com');
    expect(data).toBeDefined();
    expect(data.data).toEqual({ test: 'data' });
  });

  test('should return null if cache is expired and invalidate it', async () => {
    const cache = new CacheManager();
    await cache.set('http://test.com', { test: 'data' }, 'json', 1000);
    
    jest.advanceTimersByTime(2000); // Fast-forward time to expire TTL
    
    const data = await cache.get('http://test.com');
    expect(data).toBeNull();
    
    // Allow invalidate to run
    await Promise.resolve();
    expect(mockStore.has('http://test.com')).toBe(false);
  });

  test('fetchWithCache should fetch if cache is empty', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ new: 'data' })
    });

    const cache = new CacheManager();
    const result = await cache.fetchWithCache('http://api.com/data');
    
    expect(result).toEqual({ new: 'data' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    
    const stored = await cache.get('http://api.com/data');
    expect(stored.data).toEqual({ new: 'data' });
  });

  test('fetchWithCache should return cached data without fetching if still fresh', async () => {
    const cache = new CacheManager();
    await cache.set('http://api.com/data', { cached: 'data' }, 'json', 10000);
    
    // Move time slightly forward but not beyond half TTL (e.g. 5000)
    jest.advanceTimersByTime(1000);

    const result = await cache.fetchWithCache('http://api.com/data', {}, 10000);
    expect(result).toEqual({ cached: 'data' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('fetchWithCache should revalidate in background if age > ttl/2', async () => {
    const cache = new CacheManager();
    await cache.set('http://api.com/data', { cached: 'data' }, 'json', 10000);
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ updated: 'data' })
    });

    // Move time beyond half TTL (10000 / 2 = 5000)
    jest.advanceTimersByTime(6000);

    const result = await cache.fetchWithCache('http://api.com/data', {}, 10000);
    expect(result).toEqual({ cached: 'data' }); // Should return stale data immediately
    
    // Background fetch should happen
    expect(global.fetch).toHaveBeenCalledTimes(1);
    
    // Await background tasks
    await Promise.resolve(); // flush promises
    
    // Cache should be updated eventually
    const stored = await cache.get('http://api.com/data');
    expect(stored.data).toEqual({ updated: 'data' });
  });
});
