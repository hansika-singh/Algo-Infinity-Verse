// Centralized contest persistence helpers.
// Uses Firestore when VERCEL=1 (db initialized in backend/server.js) otherwise uses local JSON files.
//
// NOTE: This repo currently initializes Firestore inside backend/server.js and does not expose it.
// For MVP, this file is kept minimal and will be wired in backend/server.js.

export function noop() {
  return null;
}

