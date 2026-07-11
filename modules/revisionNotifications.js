// modules/revisionNotifications.js

import { toDateKey } from './revisionScheduler.js';

/**
 * Checks for due or overdue revision tasks and triggers reminders/banners.
 * @param {Object} userProgress - Global user progress object
 */
export function checkAndShowReminders(userProgress) {
  if (!userProgress.revisionSchedule) return;

  const schedule = userProgress.revisionSchedule;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(today);

  let dueTodayCount = 0;
  let overdueCount = 0;

  for (const topicKey in schedule) {
    const s = schedule[topicKey];
    if (!s.nextReviewDate) continue;

    const nextReview = new Date(s.nextReviewDate);
    const nextReviewKey = toDateKey(nextReview);

    if (nextReview < today) {
      overdueCount++;
    } else if (nextReviewKey === todayKey) {
      dueTodayCount++;
    }
  }

  // Trigger toasts after DOM settles
  setTimeout(() => {
    if (window.Toast) {
      if (overdueCount > 0) {
        window.Toast.warning(
          `You have ${overdueCount} overdue revision${overdueCount > 1 ? "s" : ""}! Revise them now to save your learning streak. ⚠️`,
          5000
        );
      } else if (dueTodayCount > 0) {
        window.Toast.info(
          `You have ${dueTodayCount} revision task${dueTodayCount > 1 ? "s" : ""} scheduled for today. Keep up the good work! 🔥`,
          4000
        );
      }
    }
  }, 1500);
}
