// NOTE: Current app serves /api/* routes via backend/server.js.
// This file is intentionally left as a placeholder for future refactors.
export default async function handler(req, res) {
  return res.status(501).json({ error: "Not implemented. Use backend/server.js routes." });
}

