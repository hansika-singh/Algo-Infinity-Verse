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
  // opponentEmail is no longer strictly used for 1v1 matching but we can ignore it
  // or allow it as an optional invite later. For Battle Royale, we just create a room.
  const firestore = db();

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

  // Generate a random 6-character alphanumeric code
  const lobbyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const battleRef = firestore.collection(BATTLES).doc(lobbyCode);
  
  const doc = await battleRef.get();
  if (doc.exists) {
     throw new Error("Lobby code collision, please try again");
  }

  await battleRef.set({
    hostId:             creatorId,
    participants:       [creatorId],
    status:             "waiting",   // waiting → active → completed | expired
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

  return lobbyCode;
}

// ─── Join Battle ──────────────────────────────────────────────────────────────
export async function joinBattle(battleId, requesterId) {
  const firestore = db();
  const battleRef = firestore.collection(BATTLES).doc(battleId);

  return firestore.runTransaction(async (tx) => {
    const doc = await tx.get(battleRef);
    if (!doc.exists) throw new Error("Battle not found");

    const battle = doc.data();

    if (battle.status !== "waiting" && battle.status !== "active") {
      throw new Error("This battle is finished and cannot be joined");
    }

    if (!battle.participants.includes(requesterId)) {
        if (battle.participants.length >= 8) {
            throw new Error("Lobby is full");
        }
        tx.update(battleRef, { participants: FieldValue.arrayUnion(requesterId) });
    }

    return { status: battle.status, problemTitle: battle.problemTitle };
  });
}

// ─── Start Battle ─────────────────────────────────────────────────────────────
export async function startBattle(battleId, requesterId) {
  const firestore = db();
  const battleRef = firestore.collection(BATTLES).doc(battleId);

  return firestore.runTransaction(async (tx) => {
    const doc = await tx.get(battleRef);
    if (!doc.exists) throw new Error("Battle not found");

    const battle = doc.data();

    if (battle.hostId !== requesterId) {
      throw new Error("Only the host can start the battle");
    }
    if (battle.status !== "waiting") {
      throw new Error("Battle is already active or finished");
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
    if (!battle.participants.includes(playerId)) {
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