/**
 * Offline-First IndexedDB Storage Wrapper
 * Provides an asynchronous, robust alternative to localStorage.
 */
const DB_NAME = 'AlgoInfinityVerseDB';
const DB_VERSION = 1;

// Define Object Stores (Collections)
const STORES = {
    USER_DATA: 'user_data',
    PLAYGROUND: 'playground_code',
    PREFERENCES: 'preferences',
    SYNC_QUEUE: 'sync_queue'
};

class StorageDB {
    constructor() {
        this.db = null;
        this.initPromise = this.initDB();
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores if they don't exist
                Object.values(STORES).forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName);
                    }
                });
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error("IndexedDB initialization error:", event.target.error);
                reject(event.target.error);
            };
        });
    }

    async getDB() {
        if (!this.db) {
            await this.initPromise;
        }
        return this.db;
    }

    async get(storeName, key) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(key);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (e) {
                reject(e);
            }
        });
    }

    async set(storeName, key, value) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(value, key);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (e) {
                reject(e);
            }
        });
    }

    async remove(storeName, key) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(key);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            } catch (e) {
                reject(e);
            }
        });
    }

    async getAll(storeName) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (e) {
                reject(e);
            }
        });
    }

    async clear(storeName) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Automatic migration from localStorage to IndexedDB
     */
    async migrateFromLocalStorage() {
        try {
            const hasMigrated = localStorage.getItem('idb_migration_complete');
            if (hasMigrated === 'true') return;

            console.log("Starting IndexedDB migration...");

            // Migrate user progress
            const algoData = localStorage.getItem('algoInfinityVerse');
            if (algoData) {
                try {
                    const parsedData = JSON.parse(algoData);
                    await this.set(STORES.USER_DATA, 'algoInfinityVerse', parsedData);
                } catch(e) { console.warn("Failed to parse user progress", e); }
            }

            // Migrate playground code snippets
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('playground-code-')) {
                    const code = localStorage.getItem(key);
                    await this.set(STORES.PLAYGROUND, key, code);
                }
            }

            // Migrate Sync Queue
            const syncQueueStr = localStorage.getItem('offlineSyncQueue');
            if (syncQueueStr) {
                try {
                    const syncQueue = JSON.parse(syncQueueStr);
                    await this.set(STORES.SYNC_QUEUE, 'offlineSyncQueue', syncQueue);
                } catch(e) { console.warn("Failed to parse sync queue", e); }
            }

            // Mark migration complete
            localStorage.setItem('idb_migration_complete', 'true');
            console.log("IndexedDB migration complete.");
        } catch (error) {
            console.error("Error migrating from localStorage:", error);
        }
    }
}

// Export a singleton instance globally
window.StorageDB = new StorageDB();
window.DB_STORES = STORES;
