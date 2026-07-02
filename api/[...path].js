// Vercel catch-all serverless function for every server-defined /api/* route.
//
// Why this exists: vercel.json deploys this repo as a static site plus the
// individual serverless functions under api/. `node server.js` (npm start) is
// never run by Vercel, so any route defined ONLY in server.js (the resume
// analyzer, team profiles, feedback, memory scanner, audit history, the SDLC
// advisor, acceptance prediction, etc.) was absent in production (issue #1218).
//
// Rather than duplicate each of those handlers as its own serverless file, this
// catch-all delegates to server.js's exported request handler, so every
// server-defined HTTP route works under Vercel's serverless model. Vercel routes
// an exact match (e.g. api/login.js for /api/login) before this catch-all, so
// the existing dedicated functions keep taking precedence; this only handles the
// paths that previously 404'd.
//
// LIMITATION: Socket.IO realtime (WebSockets) and the long-lived BullMQ worker
// cannot run on Vercel's serverless model. Those features require a host that
// runs a persistent Node process (e.g. Render / Railway / Fly.io running
// `npm start`). See DEPLOYMENT.md.

import { requestHandler } from "../server.js";

// Disable Vercel's automatic body parsing: server.js reads the raw request
// stream itself (readJsonBody / multer), so the stream must not be consumed.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  return requestHandler(req, res);
}
