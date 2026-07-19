// ============================================
// CACHE MANAGER (IndexedDB)
// ============================================
class CacheManager {
  constructor(dbName = 'AlgoInfinityCache', storeName = 'api_responses', maxConsecutiveFailures = 3) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbPromise = this.initDB();
    // Tracks consecutive background-refresh failures per URL. Without this,
    // a persistently failing endpoint would keep serving the same
    // stale-while-revalidate cached data forever, past its TTL, with no way
    // to recover other than a fetch eventually succeeding again (#2537).
    this.maxConsecutiveFailures = maxConsecutiveFailures;
    this.failureCounts = new Map();
  }

  initDB() {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'url' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }

  async set(url, data, type = 'json', ttlMs = 3600000) {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const record = {
          url,
          data,
          type,
          expiresAt: Date.now() + ttlMs,
          updatedAt: Date.now()
        };
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      void 0;
    }
  }

  async get(url) {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.get(url);
        req.onsuccess = () => {
          const record = req.result;
          if (!record) return resolve(null);
          if (Date.now() > record.expiresAt) {
            this.invalidate(url);
            return resolve(null);
          }
          resolve(record);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      void 0;
      return null;
    }
  }

  async invalidate(url) {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.delete(url);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      void 0;
    }
  }

  async fetchWithCache(url, options = {}, ttlMs = 3600000, type = 'json') {
    const cached = await this.get(url);

    const doFetch = async () => {
      try {
        const resp = await fetch(url, options);
        if (!resp.ok) throw new Error('Network response was not ok');
        const data = type === 'json' ? await resp.json() : await resp.text();
        await this.set(url, data, type, ttlMs);
        this.failureCounts.delete(url);
        return data;
      } catch (e) {
        if (e.name === 'AbortError') throw e;
        const failures = (this.failureCounts.get(url) || 0) + 1;
        this.failureCounts.set(url, failures);
        if (cached && failures >= this.maxConsecutiveFailures) {
          // Stop trusting cached data after too many consecutive failures —
          // it may be arbitrarily stale/wrong by now. Let this and future
          // calls fail (or hit an empty cache) rather than silently and
          // indefinitely serving old data.
          await this.invalidate(url);
          throw e;
        }
        if (cached) return cached.data;
        throw e;
      }
    };

    if (cached) {
      const age = Date.now() - cached.updatedAt;
      if (age > ttlMs / 2) {
        doFetch().catch(e => {
          if (e.name !== 'AbortError') void 0;
        });
      }
      return cached.data;
    }

    return await doFetch();
  }
}

const apiCache = new CacheManager();
window.apiCache = apiCache;
