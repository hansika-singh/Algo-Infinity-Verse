// SM-2 algorithm: quality is 0-5 (0 = total blackout, 5 = perfect recall)
export function applySM2(card, quality) {
  const q = Math.max(0, Math.min(5, Number(quality)));
  let { repetitions = 0, easeFactor = 2.5, interval = 0 } = card || {};

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);
  }

  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const now = new Date();
  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(now.getDate() + interval);

  return {
    topic: card?.topic,
    repetitions,
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval,
    lastReviewed: now.toISOString(),
    nextReviewDate: nextReviewDate.toISOString(),
    lastQuality: q,
  };
}
