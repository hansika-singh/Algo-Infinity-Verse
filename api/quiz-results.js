/**
 * Vercel serverless function — POST/GET /api/quiz-results
 *
 * ⚠️ IMPORTANT: On Vercel each file must have a default export.
 *    This file previously only exported named functions, which caused
 *    Vercel to return 500 on every request.
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";
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

/**
 * Validate quiz result payload before saving.
 * Returns an error message string or null if valid.
 */
function validateQuizResult(payload) {
  if (!payload || typeof payload !== "object") return "Invalid payload.";
  if (!payload.quizId || typeof payload.quizId !== "string") return "quizId is required.";
  if (!payload.quizTitle || typeof payload.quizTitle !== "string") return "quizTitle is required.";
  if (typeof payload.score !== "number" || payload.score < 0) return "score must be a non-negative number.";
  if (typeof payload.totalQuestions !== "number" || payload.totalQuestions < 1) return "totalQuestions must be >= 1.";
  if (typeof payload.correctAnswers !== "number" || payload.correctAnswers < 0) return "correctAnswers must be >= 0.";
  if (typeof payload.percentage !== "number" || payload.percentage < 0 || payload.percentage > 100) return "percentage must be 0-100.";
  if (!payload.topic || typeof payload.topic !== "string") return "topic is required.";
  return null;
}

/**
 * POST /api/quiz-results
 * Save a quiz attempt to Firestore under users/{userId}/quizResults/{attemptId}
 */
export async function saveQuizResult(req, _res) {
  const cookies = parseCookies(req.headers.cookie || "");
  const session = verifySessionToken(cookies[SESSION_COOKIE]);
  if (!session) return { status: 401, body: { error: "Authentication required." } };
  if (!useFirestore) return { status: 503, body: { error: "User store unavailable." } };

  let payload;
  try {
    const chunks = [];
    let totalSize = 0;
    const MAX_BODY_SIZE = 1024 * 1024; // 1MB
    for await (const chunk of req) {
      chunks.push(chunk);
      totalSize += chunk.length;
      if (totalSize > MAX_BODY_SIZE) {
        return { status: 413, body: { error: "Request body too large." } };
      }
    }
    const raw = Buffer.concat(chunks).toString();
    payload = JSON.parse(raw);
  } catch {
    return { status: 400, body: { error: "Invalid JSON body." } };
  }

  const validationError = validateQuizResult(payload);
  if (validationError) return { status: 400, body: { error: validationError } };

  try {
    const attemptId = crypto.randomUUID();
    const attempt = {
      quizId: payload.quizId,
      quizTitle: payload.quizTitle,
      score: payload.score,
      totalQuestions: payload.totalQuestions,
      correctAnswers: payload.correctAnswers,
      percentage: payload.percentage,
      topic: payload.topic,
      completedAt: new Date().toISOString(),
    };

    await db
      .collection("users")
      .doc(session.sub)
      .collection("quizResults")
      .doc(attemptId)
      .set(attempt);

    return { status: 201, body: { success: true, attemptId, attempt } };
  } catch (error) {
    console.error("Failed to save quiz result:", error);
    return { status: 500, body: { error: "Failed to save quiz result." } };
  }
}

/**
 * GET /api/quiz-results
 * Fetch quiz history for the authenticated user, sorted by completedAt descending.
 * Optional query params: ?limit=20&topic=Arrays
 */
export async function getQuizResults(req, _res) {
  const cookies = parseCookies(req.headers.cookie || "");
  const session = verifySessionToken(cookies[SESSION_COOKIE]);
  if (!session) return { status: 401, body: { error: "Authentication required." } };
  if (!useFirestore) return { status: 503, body: { error: "User store unavailable." } };

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
    const topic = url.searchParams.get("topic");

    let query = db
      .collection("users")
      .doc(session.sub)
      .collection("quizResults")
      .orderBy("completedAt", "desc")
      .limit(limit);

    if (topic) {
      query = query.where("topic", "==", topic);
    }

    const snapshot = await query.get();
    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { status: 200, body: { success: true, results, count: results.length } };
  } catch (error) {
    console.error("Failed to fetch quiz results:", error);
    return { status: 500, body: { error: "Failed to fetch quiz results." } };
  }
}

export default async function handler(req, res) {
  try {
    let result;
    if (req.method === "POST") {
      result = await saveQuizResult(req, res);
    } else if (req.method === "GET") {
      result = await getQuizResults(req, res);
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("[quiz-results] Unhandled error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
