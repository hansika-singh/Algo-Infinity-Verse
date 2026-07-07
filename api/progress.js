import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { SESSION_COOKIE, verifySessionToken, parseCookies } from "../backend/utils/sessionToken.js";

let db = null;
let useFirestore = false;

function initFirebase() {
  if (getApps().length > 0) {
    db = getFirestore();
    useFirestore = true;
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    void 0;
    return;
  }

  try {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    db = getFirestore();
    useFirestore = true;
  } catch (error) {
    console.error(error);
  }
}

initFirebase();

function publicUser(user) {
  return {
    id: user.id,
    name: user.name || "Learner",
    xp: Number(user.xp || user.progress?.xp || 0),
    level: Number(user.level || user.progress?.level || 1),
    avatar: user.avatar || user.progress?.avatar || "🚀",
    updatedAt: user.progressUpdatedAt || user.updatedAt || user.createdAt || null,
  };
}

export default async function handler(req, res) {
  if (req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });

  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const session = verifySessionToken(cookies[SESSION_COOKIE]);
    if (!session) return res.status(401).json({ error: "Authentication required." });
    if (!useFirestore) return res.status(503).json({ error: "User store unavailable." });

    const snapshot = await db.collection("users").where("id", "==", session.sub).limit(1).get();
    if (snapshot.empty) return res.status(404).json({ error: "User not found." });

    const doc = snapshot.docs[0];
    const payload = req.body || {};
    const progress = {
      name: String(payload.name || "").trim() || doc.data().name,
      xp: Math.max(0, Number(payload.xp) || 0),
      level: Math.max(1, Number(payload.level) || 1),
      avatar: String(payload.avatar || "🚀").trim() || "🚀",
      progressUpdatedAt: new Date().toISOString(),
    };

    await doc.ref.update(progress);

    return res.status(200).json({ user: publicUser({ id: session.sub, ...doc.data(), ...progress }) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
