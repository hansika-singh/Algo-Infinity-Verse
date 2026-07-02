/**
 * Vanilla JS Stale-While-Revalidate (SWR) Caching Engine
 */

import { offlineStore } from './offlineStore.js';

const cache = new Map();
const activePromises = new Map();

const DEFAULT_OPTIONS = {
    ttl: 5 * 60 * 1000, // 5 minutes
    onRevalidate: null,  // Callback triggered when background fetch completes with new data
    offlineStoreName: 'problems' // Default object store
};

/**
 * Main SWR fetch mechanism
 * @param {string} key - Unique identifier for the request
 * @param {Function} fetcher - Function returning a Promise that fetches the data
 * @param {Object} options - Configuration options
 * @returns {Promise<{ data: any, isStale: boolean }>}
 */
export async function fetchWithCache(key, fetcher, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const now = Date.now();
    
    // 1. Check RAM Cache (Stale Phase)
    let cachedRecord = cache.get(key);
    
    // If not in RAM, try IndexedDB (Offline Phase)
    if (!cachedRecord) {
        try {
            const dbRecord = await offlineStore.get(opts.offlineStoreName, key);
            if (dbRecord) {
                cachedRecord = dbRecord;
                cache.set(key, cachedRecord);
            }
        } catch (err) {
            console.warn('[OfflineStore] Failed to read from DB:', err);
        }
    }

    const isFresh = cachedRecord && (now - cachedRecord.timestamp < opts.ttl);

    // If fresh and online, just return it without revalidating
    // However, if we are offline, we MUST return what we have regardless of freshness
    if (isFresh || !navigator.onLine) {
        if (cachedRecord) return { data: cachedRecord.data, isStale: false };
    }

    // 2. Revalidate Phase (Network Request)
    if (!activePromises.has(key)) {
        const fetchPromise = fetcher()
            .then(data => {
                const isDifferent = !cachedRecord || JSON.stringify(cachedRecord.data) !== JSON.stringify(data);
                
                const newRecord = { id: key, data, timestamp: Date.now() };
                // Update RAM cache
                cache.set(key, newRecord);
                
            .then(async data => {
                // Update IndexedDB cache
                await offlineStore.put(opts.offlineStoreName, newRecord).catch(err => {
                    console.warn('[OfflineStore] Failed to persist cache record:', err);
                });
                
                // Trigger callback if data changed
                if (cachedRecord && isDifferent && typeof opts.onRevalidate === 'function') {
                    opts.onRevalidate(data);
                }
                
                return data;
            })
            .finally(() => {
                activePromises.delete(key);
            });

        activePromises.set(key, fetchPromise);
    }

    // If we had stale data, return it immediately while the activePromise runs in background
    if (cachedRecord) {
        // Run background update silently
        activePromises.get(key).catch(err => console.error(`[SWR] Background revalidation failed for ${key}:`, err));
        return { data: cachedRecord.data, isStale: true };
    }

    // No stale data available, must wait for network
    try {
        const newData = await activePromises.get(key);
        return { data: newData, isStale: false };
    } catch (error) {
        throw error;
    }
}

/**
 * Force invalidate a cache key
 */
export function mutate(key) {
    cache.delete(key);
}

/**
 * Clear the entire cache
 */
export function clearCache() {
    cache.clear();
}
