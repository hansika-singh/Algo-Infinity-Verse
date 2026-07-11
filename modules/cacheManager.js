// ============================================
// CACHE MANAGER (IndexedDB)
// ============================================
class CacheManager {
  constructor(dbName = 'AlgoInfinityCache', storeName = 'api_responses') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbPromise = this.initDB();
  }

  initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'url' });
        }
      };
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
        return data;
      } catch (e) {
        if (e.name === 'AbortError') throw e;
        void 0;
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
