export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.FIREBASE_API_KEY;
  const authDomain = process.env.FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return res.status(503).json({ configured: false, error: "Firebase not configured" });
  }

  return res.status(200).json({
    configured: true,
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  });
}
