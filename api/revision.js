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
    console.error("Firebase init failed:", error);
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

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie || "");
  const session = verifySessionToken(cookies[SESSION_COOKIE]);
  if (!session) {
    return res.status(401).json({ error: "Authentication required." });
  }

  if (!useFirestore) {
    return res.status(503).json({ error: "User store unavailable." });
  }

  try {
    const userRef = db.collection("users").doc(session.sub);

    if (req.method === "GET") {
      const doc = await userRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: "User not found." });
      }

      const userData = doc.data();
      return res.status(200).json({
        success: true,
        revisionSchedule: userData.revisionSchedule || {},
        revisionCalendar: userData.revisionCalendar || {
          tasks: [],
          history: [],
          streak: 0,
          longestStreak: 0,
          missedDays: 0,
          stats: {}
        }
      });
    }

    if (req.method === "PUT" || req.method === "POST") {
      let body;
      try {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
      } catch {
        return res.status(400).json({ error: "Invalid JSON body." });
      }

      const { revisionSchedule, revisionCalendar } = body;
      const updates = {};
      if (revisionSchedule) updates.revisionSchedule = revisionSchedule;
      if (revisionCalendar) updates.revisionCalendar = revisionCalendar;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No fields to update." });
      }

      await userRef.update(updates);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[api/revision] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
