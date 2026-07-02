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

  let isAuthenticated = false;

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
    }

    isAuthenticated = false;
    sessionNotice.className = "session-notice guest";
    sessionNotice.innerHTML = `<i class="fas fa-circle-exclamation"></i> You need to <a href="login.html?next=memory-scanner.html">log in</a> to use the Memory Scanner.`;

    dueList.innerHTML = `<p class="empty-state">Log in to see topics due for revision.</p>`;
    allList.innerHTML = `<p class="empty-state">Log in to see your tracked topics.</p>`;
    logBtn.disabled = true;
  }

  function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function renderTopicCard(card, { dueClass = "" } = {}) {
    const nextReview = formatDate(card.nextReviewDate);
    const lastReviewed = formatDate(card.lastReviewed);
    return `
      <div class="topic-card ${dueClass}">
        <div>
          <div class="topic-name">${escapeHtml(card.topic)}</div>
          <div class="topic-meta">
            Last reviewed: ${lastReviewed} &middot;
            Next review: ${nextReview} &middot;
            Repetitions: ${card.repetitions} &middot;
            Ease: ${card.easeFactor}
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  async function loadDueTopics() {
    if (!isAuthenticated) return;
    try {
      const response = await fetch("/api/memory/due", { credentials: "include" });
      const data = await safeJsonParse(response);
      
      if (!response.ok) throw new Error(data.error || "Failed to load due topics.");

      if (!data.due || data.due.length === 0) {
        dueList.innerHTML = `<p class="empty-state">Nothing due right now. Great job staying on top of things!</p>`;
        return;
      }

      dueList.innerHTML = data.due
        .map((card) => renderTopicCard(card, { dueClass: "due" }))
        .join("");
    } catch (err) {
      console.error(err);
      dueList.innerHTML = `<p class="empty-state" style="color: #dc3545;">${err.message}</p>`;
    }
  }

  async function loadAllTopics() {
    if (!isAuthenticated) return;
    try {
      const response = await fetch("/api/memory/all", { credentials: "include" });
      const data = await safeJsonParse(response);
      
      if (!response.ok) throw new Error(data.error || "Failed to load topics.");

      if (!data.cards || data.cards.length === 0) {
        allList.innerHTML = `<p class="empty-state">No topics tracked yet. Log a practice session above to get started.</p>`;
        return;
      }

      const now = new Date();
      allList.innerHTML = data.cards
        .map((card) => {
          const isDue = new Date(card.nextReviewDate) <= now;
          return renderTopicCard(card, { dueClass: isDue ? "due" : "upcoming" });
        })
        .join("");
    } catch (err) {
      console.error(err);
      allList.innerHTML = `<p class="empty-state" style="color: #dc3545;">${err.message}</p>`;
    }
  }

  logForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showLogMessage("Please log in to log a practice session.", "error");
      return;
    }

    const topic = topicInput.value.trim();
    const quality = qualityInput.value;

    if (!topic) {
      showLogMessage("Please enter a topic.", "error");
      return;
    }
    if (quality === "") {
      showLogMessage("Please select a recall rating.", "error");
      return;
    }

    logBtn.disabled = true;
    btnText.classList.add("hidden");
    btnLoader.classList.remove("hidden");
    logMessage.classList.add("hidden");

    try {
      const response = await fetch("/api/memory/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ topic, quality: Number(quality) }),
      });

      const result = await safeJsonParse(response);
      if (!response.ok) throw new Error(result.error || "Failed to log session.");

      showLogMessage(`Logged "${topic}". Next review: ${formatDate(result.card.nextReviewDate)}.`, "success");
      logForm.reset();
      await Promise.all([loadDueTopics(), loadAllTopics()]);
    } catch (err) {
      console.error(err);
      showLogMessage(err.message || "Failed to log session. Please try again.", "error");
    } finally {
      logBtn.disabled = !isAuthenticated;
      btnText.classList.remove("hidden");
      btnLoader.classList.add("hidden");
    }
  });

  function showLogMessage(text, type) {
    logMessage.textContent = text;
    logMessage.className = `form-message ${type}`;
    logMessage.classList.remove("hidden");
  }

  (async () => {
    await verifySession();
    if (isAuthenticated) {
      await Promise.all([loadDueTopics(), loadAllTopics()]);
    }
  })();
});