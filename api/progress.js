import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";

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
    console.warn("Firebase credentials not set.");
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

const SESSION_COOKIE = "aiv_session";

function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production.");
  }
  return "dev-only-change-me-with-SESSION_SECRET-before-deploying";
}

function sign(value) {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function fromBase64Url(input) {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function verifySessionToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const body = `${header}.${payload}`;
  const expected = sign(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(fromBase64Url(payload));
    if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

function parseCookies(header = "") {
  return header.split(";").reduce((cookies, part) => {
    const [name, ...value] = part.trim().split("=");
    if (name) cookies[name] = decodeURIComponent(value.join("="));
    return cookies;
  }, {});
}

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
