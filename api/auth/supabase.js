// Dedicated Vercel serverless function for the Supabase auth exchange.
//
// The api/[...path].js catch-all normally delegates this to server.js's
// requestHandler, but registering an exact-match function guarantees the route
// is served on Vercel regardless of catch-all path resolution.
import { requestHandler } from "../server.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  return requestHandler(req, res);
}
