// ============================================
// UTILITY FUNCTIONS
// ============================================
/**
 * Creates a debounced function that delays invoking the provided function until after `wait` milliseconds.
 *
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to delay.
 * @returns {Function} Returns the new debounced function.
 */
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Escapes HTML characters in a given string to prevent XSS.
 *
 * @param {string} text - The text to escape.
 * @returns {string} The escaped HTML string.
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 *
 * @param {Array} array - The array to shuffle.
 * @returns {Array} The shuffled array.
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; }
  return array;
}

/**
 * Determines the CSS class associated with a given difficulty level.
 *
 * @param {string} difficulty - The difficulty level (e.g., 'easy', 'medium', 'hard').
 * @returns {string} The normalized difficulty class name.
 */
function getDifficultyClass(difficulty) {
  const d = difficulty.toLowerCase();
  if (d.includes("easy")) return "easy";
  if (d.includes("medium")) return "medium";
  if (d.includes("hard")) return "hard";
  return "medium";
}

/**
 * Calculates the current day of the year.
 *
 * `@returns` {number} The current day of the year (1-366).
 */
function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

/**
 * Retrieves the daily DSA topic based on the current day of the year.
 *
 * @returns {Object} The topic object for today.
 */
function getDailyTopic() { return dsaTopics[getDayOfYear() % dsaTopics.length]; }

/**
 * Normalizes a topic string or object to match a quiz topic key.
 *
 * @param {string|Object} topic - The topic name or object containing a name.
 * @returns {string|null} The normalized quiz topic key, or null if no match is found.
 */
function getQuizTopicKey(topic) {
  const normalize = s => String(s).trim().toLowerCase().replace(/\s+/g, " ");
  const map = { arrays: "arrays", strings: "strings", "linked list": "linkedlist", linkedlist: "linkedlist", trees: "trees", graphs: "graphs", "dynamic programming": "dp", dp: "dp" };
  if (typeof topic === "string") return map[normalize(topic)] || null;
  const name = normalize(topic.name);
  return map[name] || null;
}

/**
 * Calculates the user's progress for a specific DSA topic.
 *
 * @param {string} topicName - The name of the topic.
 * @returns {{completed: number, total: number, percentage: number}} The progress metrics.
 */
function getTopicProgress(topicName) {
  const categoryMap = { Arrays: "arrays", Strings: "strings", "Linked List": "linkedlist", Trees: "trees", Graphs: "graphs", "Dynamic Programming": "dp" };
  const category = categoryMap[topicName];
  if (!category) return { completed: 0, total: 0, percentage: 0 };
  const topicProblems = practiceProblems.filter(p => p.category === category);
  const total = topicProblems.length;
  if (total === 0) return { completed: 0, total: 0, percentage: 0 };
  const completed = topicProblems.filter(p => userProgress.completedProblems.includes(p.id)).length;
  return { completed, total, percentage: Math.round((completed / total) * 100) };
}

/**
 * Displays a toast notification message.
 *
 * @param {string} message - The message to display.
 * @param {string} [type="info"] - The type of notification ("info", "success", "error").
 */
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `position:fixed; top:100px; right:20px; padding:1rem 1.5rem; background:${type === "success" ? "var(--gradient-4)" : type === "error" ? "#ef4444" : "var(--primary)"}; color:${type === "success" ? "var(--dark-bg)" : "white"}; border-radius:10px; box-shadow:var(--glass-shadow); z-index:10000; animation:slideIn 0.3s ease; font-weight:600; max-width:350px;`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => { notification.style.opacity = "0"; notification.style.transform = "translateX(100%)"; notification.style.transition = "all 0.3s ease"; setTimeout(() => notification.remove(), 300); }, 3000);
}

let scrollPosition = 0;

/**
 * Locks body scroll to prevent background scrolling when a modal is open.
 */
function lockBodyScroll() {
  scrollPosition = window.scrollY;

  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

/**
 * Unlocks body scroll to restore normal page scrolling.
 */
function unlockBodyScroll() {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  window.scrollTo(0, scrollPosition);
}

const PARTIALS_VERSION = 1;

/**
 * Asynchronously loads a partial HTML file and injects it into a target element.
 *
 * @param {string} id - The ID of the target DOM element.
 * @param {string} url - The URL of the partial to load.
 * @returns {Promise<void>}
 */
async function loadPartial(id, url) {
  const abortKey = `partial_${id}`;
  try {
    const signal = typeof apiAbort !== 'undefined' ? apiAbort.getSignal(abortKey) : undefined;
    const versionedUrl = url + '?v=' + PARTIALS_VERSION;
    
    let html;
    if (typeof apiCache !== 'undefined') {
      html = await apiCache.fetchWithCache(versionedUrl, { signal }, 86400000, 'text');
    } else {
      const resp = await fetch(versionedUrl, { signal });
      if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
      html = await resp.text();
    }
    
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = html;
    }
    
    handleActiveNav();
  } catch (e) {
    if (e.name !== 'AbortError') {
      console.warn('Could not load partial:', url, e);
    }
  } finally {
    if (typeof apiAbort !== 'undefined') {
      apiAbort.clearSignal(abortKey);
    }
  }
}

/**
 * Updates the navigation links to highlight the currently active page.
 */
function handleActiveNav() {
  const currentPage = document.body.dataset.page;
  if (!currentPage) return;
  const pageRegex = new RegExp('/' + currentPage + '\\.html(?:#|$)');
  document.querySelectorAll('.dropdown-item').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href && pageRegex.test(href));
  });
}
