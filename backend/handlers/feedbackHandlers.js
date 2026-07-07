import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getSession, sendJson, readJsonBody } from "../utils/helpers.js";
import { initializeFirebase } from "../../firebase.js";

const DATA_DIR = path.join(process.cwd(), "data");

export async function handleSubmitFeedback(req, res) {
  const session = getSession(req);
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (err) {
    return sendJson(res, 400, { error: "Invalid JSON body." });
  }

  const { feedbackType, subject, message } = payload;
  if (!feedbackType || !subject || !message) {
    return sendJson(res, 400, {
      error: "Feedback type, subject, and message are required.",
    });
  }

  const allowedTypes = [
    "Suggestion",
    "Bug Report",
    "Feature Request",
    "General Feedback",
  ];
  if (!allowedTypes.includes(feedbackType)) {
    return sendJson(res, 400, { error: "Invalid feedback type." });
  }

  if (subject.trim().length < 3) {
    return sendJson(res, 400, {
      error: "Subject must be at least 3 characters long.",
    });
  }

  if (message.trim().length < 10) {
    return sendJson(res, 400, {
      error: "Message must be at least 10 characters long.",
    });
  }

  const feedbackData = {
    userId: session ? session.sub : null,
    userName: session ? session.name : null,
    userEmail: session ? session.email : null,
    feedbackType,
    subject: subject.trim(),
    message: message.trim(),
    status: "new",
    createdAt: new Date().toISOString(),
  };

  try {
    const db = initializeFirebase();
    if (db) {
      const docRef = await db.collection("feedback").add(feedbackData);
      feedbackData.id = docRef.id;
    } else {
      const feedbackFile = path.join(DATA_DIR, "feedback.json");
      await fs.mkdir(DATA_DIR, { recursive: true });
      let feedbackList = [];
      try {
        const raw = await fs.readFile(feedbackFile, "utf8");
        feedbackList = JSON.parse(raw || "[]");
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
      }
      feedbackData.id = crypto.randomUUID();
      feedbackList.push(feedbackData);
      await fs.writeFile(
        feedbackFile,
        JSON.stringify(feedbackList, null, 2) + "\n",
      );
    }

    return sendJson(res, 201, { success: true, feedback: feedbackData });
  } catch (err) {
    console.error("Error saving feedback:", err);
    return sendJson(res, 500, { error: "Failed to save feedback." });
  }
}