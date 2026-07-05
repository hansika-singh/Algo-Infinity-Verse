import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import crypto from "crypto";

// ─── Firebase init ────────────────────────────────────────────────────────────
let db = null;

function initFirebase() {
  if (getApps().length > 0) { db = getFirestore(); return; }
  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return;
  try {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    db = getFirestore();
  } catch (e) { console.error("Firebase init error:", e); }
}

initFirebase();

function getDb() {
  if (!db) throw new Error("Firestore not available. Check FIREBASE_* env vars.");
  return db;
}

// ─── Auth helpers (mirrors session.js exactly) ────────────────────────────────
const SESSION_COOKIE = "aiv_session";

function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET required");
  return "dev-only-change-me-with-SESSION_SECRET-before-deploying";
}

function sign(value) {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function fromBase64Url(input) {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function timingSafeEqStr(a, b) {
  const ab = Buffer.from(a || "", "utf8");
  const bb = Buffer.from(b || "", "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function verifySessionToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  if (!timingSafeEqStr(signature, sign(`${header}.${payload}`))) return null;
  try {
    const session = JSON.parse(fromBase64Url(payload));
    if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch { return null; }
}

function parseCookies(h = "") {
  return h.split(";").reduce((c, p) => {
    const [k, ...v] = p.trim().split("=");
    if (k) c[k] = decodeURIComponent(v.join("="));
    return c;
  }, {});
}

function getUser(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return verifySessionToken(cookies[SESSION_COOKIE]);
}

// ─── Battle constants ─────────────────────────────────────────────────────────
const BATTLES  = "battles";
const PROBLEMS = "problems";
const USERS    = "users";
const BATTLE_DURATION_MS = 300 * 1000;
const XP_BY_DIFFICULTY = { Easy: 50, Medium: 100, Hard: 150 };

// ─── Route handlers ───────────────────────────────────────────────────────────

// POST /api/battles — create battle
async function createBattle(req, res, user) {
  const { opponentEmail, difficulty = "Medium" } = req.body || {};

  if (!opponentEmail) {
    return res.status(400).json({ error: "opponentEmail is required" });
  }

  const validDifficulties = ["Easy", "Medium", "Hard"];
  if (!validDifficulties.includes(difficulty)) {
    return res.status(400).json({ error: "difficulty must be Easy, Medium, or Hard" });
  }

  const firestore = getDb();

  // Look up opponent by email
  const opponentSnap = await firestore
    .collection(USERS)
    .where("email", "==", opponentEmail.toLowerCase().trim())
    .limit(1)
    .get();

  if (opponentSnap.empty) {
    return res.status(404).json({ error: `No account found with email "${opponentEmail}"` });
  }

  const opponentId = opponentSnap.docs[0].id;

  if (opponentId === user.sub) {
    return res.status(400).json({ error: "You cannot challenge yourself" });
  }

  // Pick a random problem at the requested difficulty
  const problemSnap = await firestore
    .collection(PROBLEMS)
    .where("difficulty", "==", difficulty)
    .get();

  if (problemSnap.empty) {
    return res.status(500).json({ error: `No problems found for difficulty "${difficulty}"` });
  }

  const candidates = problemSnap.docs;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  const battleRef = firestore.collection(BATTLES).doc();

  await battleRef.set({
    player1:            user.sub,
    player2:            opponentId,
    participants:       [user.sub, opponentId],
    status:             "pending",
    difficulty,
    problemId:          chosen.id,
    problemTitle:       chosen.data().title,
    problemDescription: chosen.data().description,
    submissions:        {},
    winner:             null,
    xpAwarded:          0,
    createdAt:          FieldValue.serverTimestamp(),
    startedAt:          null,
    expiresAt:          null,
  });

  return res.status(201).json({ battleId: battleRef.id });
}

// GET /api/battles/history — battle history for current user
async function getHistory(req, res, user) {
  const firestore = getDb();

  const snap = await firestore
    .collection(BATTLES)
    .where("participants", "array-contains", user.sub)
    .where("status", "in", ["completed", "expired"])
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();

  const history = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return res.status(200).json({ history });
}

// GET /api/battles/:id — get single battle
async function getBattle(req, res, user, battleId) {
  const firestore = getDb();
  const doc = await firestore.collection(BATTLES).doc(battleId).get();

  if (!doc.exists) return res.status(404).json({ error: "Battle not found" });

  const battle = doc.data();

  // Lazy expiry — resolve on read, no cron needed
  if (
    battle.status === "active" &&
    battle.expiresAt &&
    Timestamp.now().toMillis() > battle.expiresAt.toMillis()
  ) {
    await firestore.collection(BATTLES).doc(battleId).update({ status: "expired" });
    battle.status = "expired";
  }

  const timeRemainingMs = battle.expiresAt
    ? Math.max(0, battle.expiresAt.toMillis() - Date.now())
    : null;

  return res.status(200).json({ id: doc.id, ...battle, timeRemainingMs });
}

// POST /api/battles/:id/join — join a pending battle
async function joinBattle(req, res, user, battleId) {
  const firestore = getDb();
  const battleRef = firestore.collection(BATTLES).doc(battleId);

  try {
    await firestore.runTransaction(async (tx) => {
      const doc = await tx.get(battleRef);
      if (!doc.exists) throw new Error("Battle not found");

      const battle = doc.data();

      if (battle.status !== "pending") {
        throw new Error("This battle is no longer open to join");
      }
      if (battle.player2 !== user.sub) {
        throw new Error("You were not invited to this battle");
      }

      const startedAt = Timestamp.now();
      const expiresAt = Timestamp.fromMillis(startedAt.toMillis() + BATTLE_DURATION_MS);

      tx.update(battleRef, { status: "active", startedAt, expiresAt });
    });

    return res.status(200).json({ joined: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// POST /api/battles/:id/submit — submit solution
async function submitSolution(req, res, user, battleId) {
  const { code } = req.body || {};
  if (!code?.trim()) {
    return res.status(400).json({ error: "code is required" });
  }

  const firestore = getDb();
  const battleRef = firestore.collection(BATTLES).doc(battleId);

  try {
    const result = await firestore.runTransaction(async (tx) => {
      const doc = await tx.get(battleRef);
      if (!doc.exists) throw new Error("Battle not found");

      const battle = doc.data();

      if (battle.status === "completed") {
        throw new Error("Battle already finished — opponent submitted first");
      }
      if (battle.status !== "active") {
        throw new Error("Battle is not active");
      }
      if (![battle.player1, battle.player2].includes(user.sub)) {
        throw new Error("You are not a participant in this battle");
      }
      if (battle.submissions?.[user.sub]) {
        throw new Error("You have already submitted");
      }

      const now = Timestamp.now();
      if (battle.expiresAt && now.toMillis() > battle.expiresAt.toMillis()) {
        tx.update(battleRef, { status: "expired" });
        throw new Error("Time is up — battle expired");
      }

      const xp = XP_BY_DIFFICULTY[battle.difficulty] ?? 50;

      tx.update(battleRef, {
        [`submissions.${user.sub}`]: { code, submittedAt: now },
        status:    "completed",
        winner:    user.sub,
        xpAwarded: xp,
      });

      tx.update(firestore.collection(USERS).doc(user.sub), {
        totalXp: FieldValue.increment(xp),
      });

      return { winner: user.sub, xpAwarded: xp };
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// ─── Route helpers ────────────────────────────────────────────────────────────
async function handleGetRoutes(req, res, user, url) {
  if (/^\/api\/battles\/history/.test(url)) {
    return await getHistory(req, res, user);
  }
  const getMatch = url.match(/^\/api\/battles\/([^/]+)\/?$/);
  if (getMatch) {
    return await getBattle(req, res, user, getMatch[1]);
  }
  return null;
}

async function handlePostRoutes(req, res, user, url) {
  if (/^\/api\/battles\/?$/.test(url)) {
    return await createBattle(req, res, user);
  }
  const joinMatch = url.match(/^\/api\/battles\/([^/]+)\/join\/?$/);
  if (joinMatch) {
    return await joinBattle(req, res, user, joinMatch[1]);
  }
  const submitMatch = url.match(/^\/api\/battles\/([^/]+)\/submit\/?$/);
  if (submitMatch) {
    return await submitSolution(req, res, user, submitMatch[1]);
  }
  return null;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Auth check — every battle route requires a valid session
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized — please log in" });
  }

  // Parse body for POST requests
  if (req.method === "POST" && typeof req.body === "string") {
    try { req.body = JSON.parse(req.body); } catch { req.body = {}; }
  }

  // Content-Type guard — all responses are JSON
  res.setHeader("Content-Type", "application/json");

  const url  = req.url || "";
  const method = req.method;

  try {
    let result = null;
    
    if (method === "GET") {
      result = await handleGetRoutes(req, res, user, url);
    } else if (method === "POST") {
      result = await handlePostRoutes(req, res, user, url);
    }

    if (result) return result;

    return res.status(404).json({ error: "Route not found" });

  } catch (err) {
    console.error("Battle API error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}