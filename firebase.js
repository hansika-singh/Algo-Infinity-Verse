import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let dbInstance = null;
let initializationError = null;

function validateFirebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  if (!clientEmail.includes("@")) {
    throw new Error("Invalid Firebase client email");
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

export function initializeFirebase() {
  if (dbInstance) {
    return dbInstance;
  }

  if (initializationError) {
    console.error("Firebase initialization previously failed");
    return null;
  }

  try {
    const config = validateFirebaseConfig();

    if (!config) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Firebase credentials are required in production mode.");
      }
      console.warn(
        "Firebase credentials not set. Using in-memory fallback."
      );
      return null;
    }

    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: config.projectId,
          clientEmail: config.clientEmail,
          privateKey: config.privateKey,
        }),
      });
    }

    dbInstance = getFirestore();

    return dbInstance;
  } catch (error) {
    initializationError = error;

    console.error(
      "Firebase initialization failed:",
      error.message
    );

    return null;
  }
}

export function getDb() {
  return dbInstance;
}

export function getFirebaseInitializationError() {
  return initializationError;
}

export const COLLECTIONS = {
  USERS: "users",
  SESSIONS: "sessions",
  QUIZ_RESULTS: "quizResults",
  AUDITS_HISTORY: "audits_history",
  BATTLES:  "battles",
  PROBLEMS: "problems",
  TEAM_PROFILES: "teamProfiles",
};