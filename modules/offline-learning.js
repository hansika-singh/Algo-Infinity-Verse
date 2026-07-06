// Offline Learning Mode (IndexedDB cache + offline indicator)
// Usage: import { cacheLesson, getCachedLesson, initOfflineIndicator } from '/modules/offline-learning.js'

const DB_NAME = 'algo-infinity-verse-offline-learning';
const DB_VERSION = 1;
const STORE_NAME = 'lessons';

function safeStringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return null;
  }
}

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

async function idbPut(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const req = store.put({ key, ...value });

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error || new Error('Failed to put lesson cache'));
  });
}

async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error('Failed to get lesson cache'));
  });
}

function normalizeLessonKey(url) {
  try {
    // Keep it stable across domains via pathname+search
    const u = new URL(url, location.origin);
    return u.pathname + (u.search || '');
  } catch {
    return String(url);
  }
}

/**
 * Cache lesson snapshot.
 * @param {object} params
 * @param {string} params.url - Lesson URL (used as key)
 * @param {string} params.html - HTML snapshot
 * @param {string[]} [params.assets] - Related asset URLs (informational)
 * @param {number} [params.updatedAt] - ms timestamp
 */
export async function cacheLesson({ url, html, assets = [], updatedAt = Date.now() }) {
  const key = normalizeLessonKey(url);
  if (!key) throw new Error('Invalid lesson url');
  if (typeof html !== 'string') throw new Error('Invalid lesson html');

  await idbPut(key, {
    updatedAt,
    html,
    assets,
    // Helpful metadata for future sync logic
    cachedAt: Date.now(),
  });

  return true;
}

/**
 * @param {string} url
 * @returns {Promise<{updatedAt:number,html:string,assets:string[],cachedAt:number}|null>}
 */
export async function getCachedLesson(url) {
  const key = normalizeLessonKey(url);
  if (!key) return null;
  const cached = await idbGet(key);
  if (!cached) return null;

  return {
    updatedAt: cached.updatedAt,
    html: cached.html,
    assets: Array.isArray(cached.assets) ? cached.assets : [],
    cachedAt: cached.cachedAt,
  };
}

export function getNetworkStatus() {
  return {
    online: typeof navigator !== 'undefined' ? !!navigator.onLine : true,
    reduced: false,
  };
}

function ensureOfflineBanner() {
  let banner = document.getElementById('offline-indicator');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'offline-indicator';
    banner.setAttribute('role', 'status');
    banner.style.position = 'fixed';
    banner.style.top = '10px';
    banner.style.left = '50%';
    banner.style.transform = 'translateX(-50%)';
    banner.style.zIndex = '100000';
    banner.style.padding = '10px 14px';
    banner.style.borderRadius = '12px';
    banner.style.background = 'rgba(0,0,0,0.6)';
    banner.style.border = '1px solid rgba(255,255,255,0.15)';
    banner.style.backdropFilter = 'blur(6px)';
    banner.style.color = 'white';
    banner.style.fontWeight = '700';
    banner.style.display = 'none';
    banner.style.maxWidth = '92vw';
    document.body.appendChild(banner);
  }
  return banner;
}

/**
 * Initializes an offline indicator UI for learning pages.
 * @param {object} opts
 * @param {string} [opts.offlineText]
 * @param {string} [opts.onlineText]
 */
export function initOfflineIndicator(opts = {}) {
  const banner = ensureOfflineBanner();
  const offlineText = opts.offlineText || 'Offline: using cached lesson (IndexedDB)';
  const onlineText = opts.onlineText || 'Online: syncing lessons…';

  function setOfflineUI() {
    banner.textContent = offlineText;
    banner.style.display = 'block';
    banner.style.background = 'rgba(239,68,68,0.22)';
    banner.style.borderColor = 'rgba(239,68,68,0.55)';
  }

  function setOnlineUI(text = onlineText) {
    banner.textContent = text;
    banner.style.display = 'block';
    banner.style.background = 'rgba(34,197,94,0.18)';
    banner.style.borderColor = 'rgba(34,197,94,0.45)';
  }

  function clearUI() {
    banner.style.display = 'none';
  }

  // Initial state
  if (getNetworkStatus().online) {
    clearUI();
  } else {
    setOfflineUI();
  }

  window.addEventListener('online', () => {
    setOnlineUI('Back online: syncing lessons…');
    window.setTimeout(() => clearUI(), 2500);
  });

  window.addEventListener('offline', () => {
    setOfflineUI();
  });

  return { setOfflineUI, setOnlineUI, clearUI };
}

/**
 * Helper to fetch and cache lessons when online.
 * If fetch fails, caller can fallback to cache.
 */
export async function fetchLessonHTML(url) {
  const resp = await fetch(url, { cache: 'no-store', credentials: 'omit' });
  if (!resp.ok) throw new Error(`Failed to fetch lesson: ${resp.status}`);
  return await resp.text();
}

/**
 * Basic sync trigger.
 * @param {object} params
 * @param {string} params.url
 * @param {function} params.onUpdate - called after successful cache update
 */
export async function syncLessonWhenOnline({ url, onUpdate }) {
  if (!getNetworkStatus().online) return false;

  try {
    const html = await fetchLessonHTML(url);
    await cacheLesson({ url, html, assets: [], updatedAt: Date.now() });
    if (typeof onUpdate === 'function') onUpdate({ updated: true, url });
    return true;
  } catch (e) {
    if (typeof onUpdate === 'function') onUpdate({ updated: false, url, error: e });
    return false;
  }
}


// Legacy global exports
window.cacheLesson = cacheLesson;
window.getCachedLesson = getCachedLesson;
window.getNetworkStatus = getNetworkStatus;
window.initOfflineIndicator = initOfflineIndicator;
window.fetchLessonHTML = fetchLessonHTML;
window.syncLessonWhenOnline = syncLessonWhenOnline;
