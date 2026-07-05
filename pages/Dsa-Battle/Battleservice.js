// backend/battle/battleService.js
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getDb, COLLECTIONS } from "../../firebase.js";

// Add these two entries to COLLECTIONS in firebase.js:
//   BATTLES:  "battles",
//   PROBLEMS: "problems",
const BATTLES  = "battles";
const PROBLEMS = "problems";
const USERS    = COLLECTIONS.USERS;

const BATTLE_DURATION_SECONDS = 300;
const XP_BY_DIFFICULTY = { Easy: 50, Medium: 100, Hard: 150 };

// Battle mode requires Firestore — it has no local JSON fallback.
// getDb() returns null when Firebase env vars are missing.
function db() {
  const instance = getDb();
  if (!instance) {
    throw new Error(
      "Battle mode requires Firestore. " +
      "Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env file."
    );
  }
  return instance;
}

// ─── Create Battle ────────────────────────────────────────────────────────────
export async function createBattle(creatorId, opponentEmail, difficulty) {
  const firestore = db();

  // Lookup by email — the project stores email not username (confirmed in server.js signup).
  const opponentSnap = await firestore
    .collection(USERS)
    .where("email", "==", opponentEmail.toLowerCase())
    .limit(1)
    .get();

  if (opponentSnap.empty) {
    throw new Error(`No account found with email "${opponentEmail}"`);
  }

  const opponentId = opponentSnap.docs[0].id;

  if (opponentId === creatorId) {
    throw new Error("You cannot challenge yourself");
  }

  // Server picks the problem so both players always see the same one.
  // Previous client-side Math.random() pick meant each browser could load
  // a different problem — that was a real bug.
  const problemSnap = await firestore
    .collection(PROBLEMS)
    .where("difficulty", "==", difficulty)
    .get();

  if (problemSnap.empty) {
    throw new Error(
      `No problems for difficulty "${difficulty}". Run: node seed-problems.js`
    );
  }

  const candidates = problemSnap.docs;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  const battleRef = firestore.collection(BATTLES).doc();

  await battleRef.set({
    player1:            creatorId,
    player2:            opponentId,
    // participants array enables array-contains queries in getHistory.
    // Firestore cannot do "player1 == X OR player2 == X" natively.
    participants:       [creatorId, opponentId],
    status:             "pending",   // pending → active → completed | expired
    difficulty,
    problemId:          chosen.id,
    problemTitle:       chosen.data().title,
    problemDescription: chosen.data().description,
    // Map keyed by playerId — allows atomic per-player updates with dot notation.
    // An array would require reading and rewriting the whole field.
    submissions:        {},
    winner:             null,
    xpAwarded:          0,
    createdAt:          FieldValue.serverTimestamp(),
    startedAt:          null,
    expiresAt:          null,
  });

  return battleRef.id;
}

// ─── Join Battle ──────────────────────────────────────────────────────────────
export async function joinBattle(battleId, requesterId) {
  const firestore = db();
  const battleRef = firestore.collection(BATTLES).doc(battleId);

  return firestore.runTransaction(async (tx) => {
    const doc = await tx.get(battleRef);
    if (!doc.exists) throw new Error("Battle not found");

    const battle = doc.data();

    if (battle.status !== "pending") {
      throw new Error("This battle is no longer open to join");
    }
    if (battle.player2 !== requesterId) {
      throw new Error("You were not invited to this battle");
    }

    const startedAt = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(
      startedAt.toMillis() + BATTLE_DURATION_SECONDS * 1000
    );

    tx.update(battleRef, { status: "active", startedAt, expiresAt });

    return { status: "active", expiresAt: expiresAt.toMillis() };
  });
}

// ─── Submit Solution ──────────────────────────────────────────────────────────
// Transaction ensures two near-simultaneous submissions cannot both win —
// the second one sees status "completed" and throws before any write.
export async function submitSolution(battleId, playerId, code) {
  const firestore = db();
  const battleRef = firestore.collection(BATTLES).doc(battleId);

  return firestore.runTransaction(async (tx) => {
    const doc = await tx.get(battleRef);
    if (!doc.exists) throw new Error("Battle not found");

    const battle = doc.data();

    if (battle.status === "completed") {
      throw new Error("Battle already finished — opponent submitted first");
    }
    if (battle.status !== "active") {
      throw new Error("Battle is not active");
    }
    if (![battle.player1, battle.player2].includes(playerId)) {
      throw new Error("You are not a participant in this battle");
    }
    if (battle.submissions?.[playerId]) {
      throw new Error("You have already submitted");
    }

    const now = Timestamp.now();
    if (now.toMillis() > battle.expiresAt.toMillis()) {
      tx.update(battleRef, { status: "expired" });
      throw new Error("Time is up — battle expired");
    }

    // v1 scope: first non-empty submission wins.
    // Code execution/grading is out of scope for issue #542.
    const xp = XP_BY_DIFFICULTY[battle.difficulty] ?? 50;

    tx.update(battleRef, {
      [`submissions.${playerId}`]: { code, submittedAt: now },
      status:    "completed",
      winner:    playerId,
      xpAwarded: xp,
    });

    // FieldValue.increment creates totalXp if it doesn't already exist.
    tx.update(firestore.collection(USERS).doc(playerId), {
      totalXp: FieldValue.increment(xp),
    });

    return { winner: playerId, xpAwarded: xp };
  });
}

// ─── Get Battle ───────────────────────────────────────────────────────────────
// Lazily resolves expired battles on read — no background job or cron needed.
export async function getBattle(battleId) {
  const firestore = db();
  const doc = await firestore.collection(BATTLES).doc(battleId).get();

  if (!doc.exists) throw new Error("Battle not found");

  const battle = doc.data();

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

  return { id: doc.id, ...battle, timeRemainingMs };
}

// ─── Get History ──────────────────────────────────────────────────────────────
// IMPORTANT: This query needs a composite index in Firestore.
// Run it once — Firestore will throw an error with a URL to auto-create the index.
// Follow that URL or define it in firestore.indexes.json before deploying.
export async function getHistory(userId, limit = 20, startAfterDocId = null) {
  const firestore = db();

  let query = firestore
    .collection(BATTLES)
    .where("participants", "array-contains", userId)
    .where("status", "in", ["completed", "expired"])
    .orderBy("createdAt", "desc")
    .limit(limit);

  if (startAfterDocId) {
    const cursorDoc = await firestore.collection(BATTLES).doc(startAfterDocId).get();
    query = query.startAfter(cursorDoc);
  }

  const snap = await query.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}