import { getSession, sendJson, readJsonBody } from "../utils/helpers.js";
import { updateMemoryStore, readMemoryStore, applySM2 } from "../utils/memoryUtils.js";

export async function handleMemoryLog(req, res) {
  const session = getSession(req);
  if (!session) return sendJson(res, 401, { error: "Login required." });

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON body." });
  }

  const { topic, quality } = payload;
  if (!topic || typeof topic !== "string" || topic.trim().length < 1) {
    return sendJson(res, 400, { error: "Topic is required." });
  }
  if (
    quality === undefined ||
    isNaN(Number(quality)) ||
    Number(quality) < 0 ||
    Number(quality) > 5
  ) {
    return sendJson(res, 400, {
      error: "Quality must be a number between 0 and 5.",
    });
  }

  const trimmedTopic = topic.trim();
  const updatedCard = await updateMemoryStore((store) => {
    const userCards = store[session.sub] || {};
    const existing = userCards[trimmedTopic] || { topic: trimmedTopic };
    const updated = applySM2(existing, quality);
    userCards[trimmedTopic] = updated;
    store[session.sub] = userCards;
    return updated;
  });

  return sendJson(res, 200, { success: true, card: updatedCard });
}

export async function handleMemoryDue(req, res) {
  const session = getSession(req);
  if (!session) return sendJson(res, 401, { error: "Login required." });

  const store = await readMemoryStore();
  const userCards = store[session.sub] || {};
  const now = new Date();
  const due = Object.values(userCards).filter(
    (card) => new Date(card.nextReviewDate) <= now,
  );

  return sendJson(res, 200, { success: true, due });
}

export async function handleMemoryAll(req, res) {
  const session = getSession(req);
  if (!session) return sendJson(res, 401, { error: "Login required." });

  const store = await readMemoryStore();
  const userCards = store[session.sub] || {};

  return sendJson(res, 200, {
    success: true,
    cards: Object.values(userCards),
  });
}