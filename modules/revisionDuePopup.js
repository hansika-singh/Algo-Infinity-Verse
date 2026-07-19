// modules/revisionDuePopup.js
//
// Home-page popup that surfaces how many spaced-repetition reviews are
// due or overdue today. Per maintainer guidance on #2335, this is a
// dismissible home-page popup (NOT a navbar badge).

const DISMISS_KEY = 'aiv:revisionDuePopupDismissed';

/**
 * Local YYYY-MM-DD key for a date (matches revisionScheduler.toDateKey).
 */
export function toDateKey(date) {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Count reviews that are due today or overdue, based on the per-topic
 * revision schedule. A topic counts as due when it has a nextReviewDate
 * on or before today and is not already complete.
 *
 * Pure function — safe to unit test.
 * @param {{revisionSchedule?: Object}} progress
 * @param {Date} [now]
 * @returns {number}
 */
export function countDueReviews(progress = {}, now = new Date()) {
  const schedule = progress?.revisionSchedule || {};
  const today = new Date(now);
  today.setHours(23, 59, 59, 999); // include everything scheduled for today

  let count = 0;
  for (const topicKey of Object.keys(schedule)) {
    const entry = schedule[topicKey];
    if (!entry || !entry.nextReviewDate || entry.isComplete) continue;
    const reviewDate = new Date(entry.nextReviewDate);
    if (Number.isNaN(reviewDate.getTime())) continue;
    if (reviewDate <= today) count += 1;
  }
  return count;
}

/**
 * Whether the popup was already dismissed today (once-per-day behavior).
 */
function dismissedToday(now = new Date()) {
  try {
    return localStorage.getItem(DISMISS_KEY) === toDateKey(now);
  } catch {
    return false;
  }
}

function rememberDismissal(now = new Date()) {
  try {
    localStorage.setItem(DISMISS_KEY, toDateKey(now));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

function buildPopup(count) {
  const popup = document.createElement('div');
  popup.className = 'revision-due-popup';
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-modal', 'false');
  popup.setAttribute('aria-labelledby', 'revision-due-popup-title');

  const label = count === 1 ? '1 topic' : `${count} topics`;
  popup.innerHTML = `
    <button class="revision-due-popup__close" type="button" aria-label="Dismiss revision reminder">&times;</button>
    <div class="revision-due-popup__icon" aria-hidden="true">🧠</div>
    <div class="revision-due-popup__body">
      <h3 id="revision-due-popup-title" class="revision-due-popup__title">Time to revise!</h3>
      <p class="revision-due-popup__text">You have <strong>${label}</strong> due for review today.</p>
      <a class="revision-due-popup__cta btn btn-primary" href="#dashboard">Open Revision Calendar</a>
    </div>
  `;
  return popup;
}

function injectStyles() {
  if (document.getElementById('revision-due-popup-styles')) return;
  const style = document.createElement('style');
  style.id = 'revision-due-popup-styles';
  style.textContent = `
    .revision-due-popup {
      position: fixed;
      right: 20px;
      bottom: 20px;
      max-width: 320px;
      display: flex;
      gap: 12px;
      padding: 16px 18px;
      background: var(--bg-secondary, #ffffff);
      color: var(--text-primary, #0f172a);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);
      z-index: 9998;
      animation: revisionDuePopupIn 0.35s ease;
    }
    .revision-due-popup__icon { font-size: 28px; line-height: 1; }
    .revision-due-popup__title { margin: 0 0 4px 0; font-size: 16px; font-weight: 700; }
    .revision-due-popup__text { margin: 0 0 12px 0; font-size: 14px; color: var(--text-secondary, #475569); }
    .revision-due-popup__cta { display: inline-block; text-decoration: none; font-size: 13px; padding: 8px 14px; }
    .revision-due-popup__close {
      position: absolute;
      top: 8px;
      right: 10px;
      background: transparent;
      border: none;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      color: var(--text-secondary, #64748b);
    }
    .revision-due-popup__close:hover { color: var(--text-primary, #0f172a); }
    .revision-due-popup__close:focus-visible,
    .revision-due-popup__cta:focus-visible {
      outline: 2px solid var(--primary, #7c3aed);
      outline-offset: 2px;
    }
    @keyframes revisionDuePopupIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @media (max-width: 480px) {
      .revision-due-popup { right: 12px; left: 12px; bottom: 12px; max-width: none; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Initialize the home-page revision due popup.
 * No-op when there are no due reviews or it was already dismissed today.
 */
export function initRevisionDuePopup() {
  if (typeof document === 'undefined') return;
  if (dismissedToday()) return;

  const progress = (typeof window !== 'undefined' && window.userProgress) || {};
  const count = countDueReviews(progress);
  if (count <= 0) return;

  // Avoid duplicate popups.
  if (document.querySelector('.revision-due-popup')) return;

  injectStyles();
  const popup = buildPopup(count);

  const close = () => {
    rememberDismissal();
    popup.remove();
  };

  popup.querySelector('.revision-due-popup__close')?.addEventListener('click', close);
  popup.querySelector('.revision-due-popup__cta')?.addEventListener('click', () => {
    close();
    // After navigating to the dashboard, bring the revision scheduler into view.
    setTimeout(() => {
      document
        .getElementById('revisionSchedulerCard')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  });

  document.body.appendChild(popup);
}
