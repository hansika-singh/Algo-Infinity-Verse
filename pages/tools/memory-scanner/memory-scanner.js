document.addEventListener("DOMContentLoaded", () => {
  const sessionNotice = document.getElementById("sessionNotice");
  const logForm = document.getElementById("logForm");
  const topicInput = document.getElementById("topicInput");
  const qualityInput = document.getElementById("qualityInput");
  const logBtn = document.getElementById("logBtn");
  const btnText = logBtn.querySelector(".btn-text");
  const btnLoader = logBtn.querySelector(".btn-loader");
  const logMessage = document.getElementById("logMessage");
  const dueList = document.getElementById("dueList");
  const allList = document.getElementById("allList");

  // Local Storage Helpers
  let isAuthenticated = false;

  function getMemoryData() {
    let data;
    try {
      data = JSON.parse(localStorage.getItem("algoInfinityVerse")) || {};
    } catch (e) {
      data = {};
    }
    if (!data.memoryScanner) data.memoryScanner = {};
    return data;
  }

  // CodeRabbit-proof: Safe JSON parser to gracefully handle HTML 404/500 errors
  async function safeJsonParse(response) {
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text(); // Read as text to prevent JSON crash
      throw new Error(`Server Error (${response.status}): Expected JSON but received HTML/Text.`);
    }
    return response.json();
  }

  async function verifySession() {
    try {
      const response = await fetch("/api/session", { credentials: "include" });
      const data = await safeJsonParse(response);
      
      if (response.ok) {
        if (data.authenticated && data.user) {
          isAuthenticated = true;
          sessionNotice.className = "session-notice authenticated";
          sessionNotice.textContent = "";
          const icon = document.createElement("i");
          icon.className = "fas fa-circle-check";
          const strong = document.createElement("strong");
          strong.textContent = data.user.name;
          sessionNotice.append(
            icon,
            " Tracking memory for ",
            strong,
            ` (${data.user.email})`
          );
          return;
        }
      }
    } catch (err) {
      console.error("Failed to check user session:", err);
      // Let the user know the session failed to load properly.
      sessionNotice.className = "session-notice error";
      sessionNotice.innerHTML = `<i class="fas fa-circle-exclamation"></i> Error loading session data: ${err.message}. Please refresh.`;
      
      dueList.innerHTML = `<p class="empty-state">Unable to load session. Please refresh the page.</p>`;
      allList.innerHTML = `<p class="empty-state">Unable to load session. Please refresh the page.</p>`;
      logBtn.disabled = true;
      return; 
    }
  }

  function saveMemoryData(data) {
    localStorage.setItem("algoInfinityVerse", JSON.stringify(data));
  }

  // Initialize Local Session
  function initSession() {
    sessionNotice.className = "session-notice authenticated";
    sessionNotice.innerHTML = `<i class="fas fa-brain"></i> <strong>Local Mode Active:</strong> Tracking your spaced repetition securely in browser storage.`;
    loadTopics();
  }

  function formatDate(isoString) {
    if (!isoString) return "Never";
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderTopicCard(card, { dueClass = "" } = {}) {
    const nextReview = formatDate(card.nextReviewDate);
    const lastReviewed = formatDate(card.lastReviewed);
    return `
      <div class="topic-card ${dueClass}" style="margin-bottom: 10px; padding: 15px; border-radius: 8px; border: 1px solid var(--border-color, #e2e8f0); background: var(--card-bg, #fff);">
        <div>
          <div class="topic-name" style="font-weight: 600; font-size: 1.1rem; color: var(--accent, #6366f1);">${escapeHtml(card.topic)}</div>
          <div class="topic-meta" style="font-size: 0.85rem; color: var(--text-muted, #64748b); margin-top: 5px;">
            Last reviewed: ${lastReviewed} &middot;
            Next review: <strong style="color: ${dueClass === 'due' ? '#ef4444' : '#10b981'}">${nextReview}</strong> &middot;
            Repetitions: ${card.repetitions} &middot;
            Ease: ${card.easeFactor.toFixed(2)}
          </div>
        </div>
      </div>
    `;
  }

  function loadTopics() {
    const appData = getMemoryData();
    const memData = appData.memoryScanner;
    const cards = Object.values(memData);

    if (cards.length === 0) {
      dueList.innerHTML = `<p class="empty-state">Nothing due right now. Log a session to start!</p>`;
      allList.innerHTML = `<p class="empty-state">No topics tracked yet. Log a practice session above to get started.</p>`;
      return;
    }

    const now = new Date();
    const dueCards = [];
    const allCardsHtml = [];

    cards.forEach(card => {
      const nextDate = new Date(card.nextReviewDate);
      const isDue = nextDate <= now;
      
      if (isDue) {
        dueCards.push(renderTopicCard(card, { dueClass: "due" }));
      }
      allCardsHtml.push(renderTopicCard(card, { dueClass: isDue ? "due" : "upcoming" }));
    });

    dueList.innerHTML = dueCards.length > 0 ? dueCards.join("") : `<p class="empty-state">Nothing due right now. Great job staying on top of things!</p>`;
    allList.innerHTML = allCardsHtml.join("");
  }

  logForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const displayTopic = topicInput.value.trim();
    const topicKey = displayTopic.toLowerCase();
    const quality = Number(qualityInput.value);

    if (!displayTopic || isNaN(quality)) {
      showLogMessage("Please enter a topic and select a rating.", "error");
      return;
    }

    logBtn.disabled = true;
    btnText.classList.add("hidden");
    btnLoader.classList.remove("hidden");
    logMessage.classList.add("hidden");

    // SuperMemo-2 (SM-2) Algorithm Integration
    setTimeout(() => {
      const appData = getMemoryData();
      const memData = appData.memoryScanner;

      // Initialize new topic card if it doesn't exist
      if (!memData[topicKey]) {
        memData[topicKey] = {
          topic: displayTopic,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          lastReviewed: null,
          nextReviewDate: null
        };
      }

      const card = memData[topicKey];


      // SM-2 Math Calculation
      if (quality >= 3) {
        if (card.repetitions === 0) {
          card.interval = 1;
        } else if (card.repetitions === 1) {
          card.interval = 6;
        } else {
          card.interval = Math.round(card.interval * card.easeFactor);
        }
        card.repetitions += 1;
      } else {
        card.repetitions = 0;
        card.interval = 1;
      }

      // Update Ease Factor (EF)
      card.easeFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (card.easeFactor < 1.3) card.easeFactor = 1.3;

      // Set Dates
      const now = new Date();
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + card.interval);

      card.lastReviewed = now.toISOString();
      card.nextReviewDate = nextDate.toISOString();

      // Save and Re-render
      saveMemoryData(appData);
      loadTopics();

      showLogMessage(`Logged "${displayTopic}". Next review in ${card.interval} days.`, "success");
      logForm.reset();

      logBtn.disabled = false;
      btnText.classList.remove("hidden");
      btnLoader.classList.add("hidden");
    }, 400); // Small timeout to simulate processing
  });

  function showLogMessage(text, type) {
    logMessage.textContent = text;
    logMessage.className = `form-message ${type}`;
    logMessage.classList.remove("hidden");
  }

  // Boot up the scanner
  initSession();
});