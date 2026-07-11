/**
 * IndexedDB Wrapper for Offline Storage
 * Handles caching of DSA problems, user progress, and visualizer states.
 */

const DB_NAME = 'AlgoInfinityVerseDB';
const DB_VERSION = 1;

class OfflineStore {
    constructor() {
        this.db = null;
        this.initPromise = this.initDB();
    }

    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store for DSA Problems
                if (!db.objectStoreNames.contains('problems')) {
                    db.createObjectStore('problems', { keyPath: 'id' });
                }
                
                // Store for User Progress
                if (!db.objectStoreNames.contains('progress')) {
                    db.createObjectStore('progress', { keyPath: 'id' });
                }
                
                // Store for Visualizer States
                if (!db.objectStoreNames.contains('visualizers')) {
                    db.createObjectStore('visualizers', { keyPath: 'id' });
                }
                
                // Store for Bookmarks
                if (!db.objectStoreNames.contains('bookmarks')) {
                    db.createObjectStore('bookmarks', { keyPath: 'id' });
                }
                
                // Store for Offline Action Queue (Background Sync)
                if (!db.objectStoreNames.contains('syncQueue')) {
                    db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('IndexedDB init error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async getStore(storeName, mode = 'readonly') {
        await this.initPromise;
        const transaction = this.db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }

    async get(storeName, id) {
        const store = await this.getStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        const store = await this.getStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    // Background Sync Queue Helpers
    async queueAction(actionType, payload) {
        const action = {
            type: actionType,
            payload: payload,
            timestamp: Date.now()
        };
        await this.put('syncQueue', action);
        
        // Request background sync if supported
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            try {
                const reg = await navigator.serviceWorker.ready;
                await reg.sync.register('sync-offline-actions');
                void 0;
            } catch (err) {
                void 0;
            }
        }
    }
    
    async syncQueue() {
        const actions = await this.getAll('syncQueue');
        if (actions.length === 0) return;
        
        void 0;
        for (const action of actions) {
            try {
                // In a real application, you would send this to the server
                // e.g. await fetch('/api/sync', { method: 'POST', body: JSON.stringify(action) })
                void 0;
                
                // Remove from queue after successful sync
                await this.delete('syncQueue', action.id);
            } catch (error) {
                console.error('[OfflineStore] Failed to sync action:', action, error);
            }
        }
    }
}

// Export a singleton instance
export const offlineStore = new OfflineStore();
window.offlineStore = offlineStore; // Make available globally for SW message event
