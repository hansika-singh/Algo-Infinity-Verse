// ============================================
// UTILITY FUNCTIONS
// ============================================
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; }
  return array;
}

function getDifficultyClass(difficulty) {
  const d = difficulty.toLowerCase();
  if (d.includes("easy")) return "easy";
  if (d.includes("medium")) return "medium";
  if (d.includes("hard")) return "hard";
  return "medium";
}

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

function getDailyTopic() { return dsaTopics[getDayOfYear() % dsaTopics.length]; }

function getQuizTopicKey(topic) {
  const normalize = s => String(s).trim().toLowerCase().replace(/\s+/g, " ");
  const map = { arrays: "arrays", strings: "strings", "linked list": "linkedlist", linkedlist: "linkedlist", trees: "trees", graphs: "graphs", "dynamic programming": "dp", dp: "dp" };
  if (typeof topic === "string") return map[normalize(topic)] || null;
  const name = normalize(topic.name);
  return map[name] || null;
}

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

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `position:fixed; top:100px; right:20px; padding:1rem 1.5rem; background:${type === "success" ? "var(--gradient-4)" : type === "error" ? "#ef4444" : "var(--primary)"}; color:${type === "success" ? "var(--dark-bg)" : "white"}; border-radius:10px; box-shadow:var(--glass-shadow); z-index:10000; animation:slideIn 0.3s ease; font-weight:600; max-width:350px;`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => { notification.style.opacity = "0"; notification.style.transform = "translateX(100%)"; notification.style.transition = "all 0.3s ease"; setTimeout(() => notification.remove(), 300); }, 3000);
}

let scrollPosition = 0;

function lockBodyScroll() {
  scrollPosition = window.scrollY;

  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function unlockBodyScroll() {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  window.scrollTo(0, scrollPosition);
}

const PARTIALS_VERSION = 1;

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

function handleActiveNav() {
  const currentPage = document.body.dataset.page;
  if (!currentPage) return;
  const pageRegex = new RegExp('/' + currentPage + '\\.html(?:#|$)');
  document.querySelectorAll('.dropdown-item').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href && pageRegex.test(href));
  });
}
