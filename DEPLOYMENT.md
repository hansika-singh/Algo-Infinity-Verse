# Deployment

This project can be deployed two ways. Pick based on which features you need.

## What runs where

`server.js` is a single long-lived Node process that serves **all** routes
(static pages, every `/api/*` route, Socket.IO realtime, and the BullMQ audit
worker). Running it with `npm start` gives you the full app.

Vercel, however, does **not** run `server.js` as a process. With
`outputDirectory: "."` and `framework: null`, Vercel deploys the repo as a
static site plus the serverless functions under `api/`. `npm start` is never
invoked. This previously meant any route defined only in `server.js` was absent
in production (issue #1218).

## Option A — Vercel (serverless)

Supported: static pages and **all HTTP `/api/*` routes**.

- The dedicated functions in `api/` (`login`, `signup`, `session`, …) handle
  their exact paths.
- `api/[...path].js` is a catch-all that delegates every remaining `/api/*`
  request to `server.js`'s exported `requestHandler`, so server-defined routes
  (resume analyzer, team profiles, feedback, memory scanner, audit history,
  SDLC advisor, acceptance prediction, …) work in production without being
  duplicated as separate files.

**Not supported on Vercel serverless:**

- **Socket.IO realtime** (study rooms, voice signalling, live chat) — requires a
  persistent WebSocket connection, which serverless functions cannot hold.
- **The BullMQ audit worker** — requires a long-lived process to consume jobs.

If you only need the HTTP API and static site, Vercel is sufficient. Set the
required environment variables (`SESSION_SECRET`, `FIREBASE_*`, etc.) in the
Vercel project settings.

## Option B — Long-lived Node host (full features)

To get Socket.IO realtime and the BullMQ worker, deploy `server.js` on a
platform that runs a persistent Node process — e.g. Render, Railway, Fly.io, or
any VPS:

```bash
npm install
npm start            # runs: node server.js
```

Set the environment variables the server needs (`SESSION_SECRET`, `PORT`,
`HOST`, `REDIS_URL` for the worker, `FIREBASE_*` for Firestore). Redis must be
reachable for the bulk-audit worker to run; without it the app falls back to
in-process audit handling.
