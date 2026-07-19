/*
 * modules/aiHintsBootstrap.js
 * ------------------------------------------------------------------
 * Zero-wiring loader for the hint system. It watches the page, and when a
 * problem is open it reads the problem's TITLE from the DOM, derives the id
 * (same slug rule aiHints.js's curated hint keys use), and injects the hint
 * panel — so you do NOT have to edit the problem-render function or know
 * its variables.
 *
 * SETUP (2 things):
 *   1. Set TITLE_SELECTOR below to the element that shows the problem title
 *      (e.g. "Maximum Depth"). Get it in 10s: in the browser, right-click the
 *      title -> Inspect -> in DevTools right-click the highlighted element ->
 *      Copy -> "Copy selector", and paste it between the quotes.
 *   2. Load this file once from index.html (see the <script> line in chat).
 *
 * If the panel appears in the wrong spot, change ANCHOR_TEXT (it inserts the
 * panel just before the element whose text equals ANCHOR_TEXT).
 * ------------------------------------------------------------------ */

import { renderHints } from './aiHints.js';

// ===== Pre-configured for Algo-Infinity-Verse =====
const MODAL_SELECTOR = '#quizEditorModal';
const TITLE_SELECTOR = '#quizTitle';
const DESCRIPTION_SELECTOR = '#quizDescription';
const ANCHOR_TEXT = 'Test Cases';
// ==================================================

// ── Anchor Cache ──────────────────────────────────────────────────────────

const anchorCache = new Map();
const CACHE_MAX_SIZE = 20;
const CACHE_TTL_MS = 30000;

function getCachedAnchor(text) {
  const cached = anchorCache.get(text);
  if (cached) {
    const now = Date.now();
    if (now - cached.timestamp < CACHE_TTL_MS) {
      if (document.contains(cached.element)) {
        return cached.element;
      }
      anchorCache.delete(text);
      return null;
    }
    anchorCache.delete(text);
  }
  return null;
}

function setCachedAnchor(text, element) {
  if (anchorCache.size >= CACHE_MAX_SIZE) {
    const firstKey = anchorCache.keys().next().value;
    if (firstKey) {
      anchorCache.delete(firstKey);
    }
  }
  anchorCache.set(text, {
    element: element,
    timestamp: Date.now(),
  });
}

function clearAnchorCache(text) {
  if (text) {
    anchorCache.delete(text);
  } else {
    anchorCache.clear();
  }
}

// ── Slugify ──────────────────────────────────────────────────────────────

function slugify(t) {
  return t
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Find Element by Text with Caching ──────────────────────────────────

function findByText(text) {
  if (!text) return null;

  const cached = getCachedAnchor(text);
  if (cached) {
    return cached;
  }

  const nodes = document.querySelectorAll('h1,h2,h3,h4,h5,div,span,p,strong,b');
  for (const n of nodes) {
    if (n.children.length === 0 && n.textContent.trim() === text) {
      setCachedAnchor(text, n);
      return n;
    }
  }
  return null;
}

// ── Mount Logic ──────────────────────────────────────────────────────────

let lastTitle = null;
let mountTimeout = null;
const MOUNT_DEBOUNCE_MS = 200;

function mount() {
  if (mountTimeout) {
    clearTimeout(mountTimeout);
  }
  mountTimeout = setTimeout(() => {
    mountTimeout = null;
    doMount();
  }, MOUNT_DEBOUNCE_MS);
}

function doMount() {
  const modalEl = document.querySelector(MODAL_SELECTOR);
  if (!modalEl || !modalEl.classList.contains('active')) {
    lastTitle = null;
    return;
  }

  const titleEl = document.querySelector(TITLE_SELECTOR);
  if (!titleEl) return;
  const title = titleEl.textContent.trim();
  if (!title) return;

  const existing = document.getElementById('ai-hint-mount');
  if (existing && lastTitle === title) return;
  lastTitle = title;

  let mountEl = existing;
  if (!mountEl) {
    mountEl = document.createElement('div');
    mountEl.id = 'ai-hint-mount';
    const anchor = findByText(ANCHOR_TEXT);
    if (anchor && anchor.parentElement) {
      anchor.parentElement.insertBefore(mountEl, anchor);
    } else {
      (titleEl.parentElement || document.body).appendChild(mountEl);
    }
  }

  const descEl = document.querySelector(DESCRIPTION_SELECTOR);
  const description = descEl ? descEl.textContent.trim() : '';
  renderHints(mountEl, { id: slugify(title), title, description });
}

// ── Cache Invalidation ──────────────────────────────────────────────────

function invalidateCacheOnDOMChange() {
  clearAnchorCache();
}

// ── Observer Setup ──────────────────────────────────────────────────────

let observer = null;

function init() {
  mount();

  observer = new MutationObserver(() => {
    invalidateCacheOnDOMChange();
    mount();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });

  document.addEventListener('click', () => {
    const modal = document.querySelector(MODAL_SELECTOR);
    if (modal && modal.classList.contains('active')) {
      mount();
    }
  });
}

function cleanup() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (mountTimeout) {
    clearTimeout(mountTimeout);
    mountTimeout = null;
  }
  clearAnchorCache();
  lastTitle = null;
}

// ── Exports ─────────────────────────────────────────────────────────────

export {
  init,
  cleanup,
  mount,
  findByText,
  clearAnchorCache,
  getCachedAnchor,
  setCachedAnchor,
  slugify,
};

// ── Auto-init ───────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

document.addEventListener('modalOpened', mount);
