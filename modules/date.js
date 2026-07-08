// ===== DATE & TIME UTILITIES =====
function getCurrentDateFormatted() {
  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return now.toLocaleDateString('en-US', options);
}

function getShortDate() {
  const now = new Date();
  const options = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };
  return now.toLocaleDateString('en-US', options);
}

function getTimeUntilMidnight() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
}

function initDateDisplay() {
  const currentDateEl = document.getElementById("currentDateDisplay");
  const profileDateEl = document.getElementById("profileCurrentDate");
  const resetTimerEl = document.getElementById("resetTimer");

  const shortDate = getShortDate();
  const fullDate = getCurrentDateFormatted();

  if (currentDateEl) currentDateEl.textContent = `📅 ${shortDate}`;
  if (profileDateEl) profileDateEl.textContent = fullDate;

  if (resetTimerEl) {
    resetTimerEl.textContent = getTimeUntilMidnight();
    setInterval(() => {
      resetTimerEl.textContent = getTimeUntilMidnight();
    }, 1000);
  }
}