// dsa-battle-mode.js
//
// Auth: session cookies with credentials: "include" — matches auth.js exactly.
// No Firebase client SDK. No Bearer tokens.
// User ID is session.sub — confirmed from server.js createSessionToken().
// Timer authority lives entirely on the server — this file never owns a countdown.

// ─── State ────────────────────────────────────────────────────────────────────
let currentBattleId = null;
let pollInterval    = null;
let currentUserId   = null; // populated on init from /api/session

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const startBattleBtn    = document.getElementById("startBattleBtn");
const joinBattleBtn     = document.getElementById("joinBattleBtn");
const submitSolutionBtn = document.getElementById("submitSolutionBtn");
const timerEl           = document.getElementById("timer");
const winnerText        = document.getElementById("winnerText");
const xpReward          = document.getElementById("xpReward");
const problemTitle      = document.getElementById("problemTitle");
const problemDesc       = document.getElementById("problemDescription");
const opponentEl        = document.getElementById("currentOpponent");
const difficultyEl      = document.getElementById("difficultyBadge");
const historyGrid       = document.getElementById("historyGrid");
const statusMsg         = document.getElementById("battleStatusMsg");

// ─── Authenticated fetch ──────────────────────────────────────────────────────
// credentials: "include" sends the session cookie on every request.
// Matches the exact pattern used in auth.js.
async function apiFetch(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ─── Polling ──────────────────────────────────────────────────────────────────
function startPolling(battleId) {
  stopPolling();
  pollBattle(battleId);                                      // immediate first fetch
  pollInterval = setInterval(() => pollBattle(battleId), 3000);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

async function pollBattle(battleId) {
  try {
    const battle = await apiFetch(`/battles/${battleId}`);
    renderBattleState(battle);
  } catch (err) {
    // Silent — don't alert on transient poll failures
    console.error("Poll error:", err.message);
  }
}

// ─── Render battle state ──────────────────────────────────────────────────────
function renderBattleState(battle) {
  switch (battle.status) {
    case "pending":
      setStatus(`⏳ Waiting for opponent to join. Share this Battle ID: ${battle.id}`);
      break;

    case "active": {
      setStatus("⚔️ Battle in progress!");

      if (problemTitle) problemTitle.textContent = battle.problemTitle || "Battle Problem";
      if (problemDesc)  problemDesc.textContent  = battle.problemDescription || "";
      if (opponentEl)   opponentEl.textContent   = battle.player2;
      if (opponentEl) {
        const opponentId =
          battle.player1 === currentUserId ? battle.player2 : battle.player1;
        opponentEl.textContent = opponentId || "Opponent";
      }
      if (difficultyEl) difficultyEl.textContent = battle.difficulty;

      // Server owns the time — display what it says is left
      const secsLeft = Math.max(0, Math.floor((battle.timeRemainingMs ?? 0) / 1000));
      if (timerEl) timerEl.textContent = secsLeft;

      if (secsLeft <= 0) {
        setStatus("⏰ Time is up!");
        stopPolling();
        pollBattle(battle.id); // one final fetch to get the resolved state
      }
      break;
    }

    case "completed":
    case "expired":
      stopPolling();
      renderResult(battle);
      loadHistory();
      break;
  }
}

// ─── Result ───────────────────────────────────────────────────────────────────
function renderResult(battle) {
  // currentUserId is session.sub — set during init() from /api/session response
  const iWon  = currentUserId && battle.winner === currentUserId;
  const isDraw = battle.status === "expired" && !battle.winner;

  if (winnerText) {
    winnerText.textContent = isDraw
      ? "🤝 Draw — time ran out"
      : iWon
        ? "🏆 You Won!"
        : "❌ Opponent Won";
  }
  if (xpReward) xpReward.textContent = iWon ? battle.xpAwarded : 0;

  resetUI();
}

// ─── History ──────────────────────────────────────────────────────────────────
async function loadHistory() {
  try {
    const { history } = await apiFetch("/battles/history");
    renderHistory(history);
  } catch (err) {
    console.error("Failed to load history:", err.message);
  }
}

function renderHistory(history) {
  if (!historyGrid) return;

  if (!history?.length) {
    historyGrid.innerHTML =
      '<p style="color:#94a3b8;text-align:center">No battles yet.</p>';
    return;
  }

  historyGrid.innerHTML = history.map((b) => {
    const iWon   = currentUserId && b.winner === currentUserId;
    const isDraw = b.status === "expired" && !b.winner;
    const result = isDraw ? "Draw" : iWon ? "Victory" : "Defeat";
    const xp     = iWon ? b.xpAwarded : 0;

    // Firestore server timestamps arrive as { _seconds, _nanoseconds }
    // when serialized to JSON through the API.
    const date = b.createdAt?._seconds
      ? new Date(b.createdAt._seconds * 1000).toLocaleDateString()
      : "—";

    return `
      <div class="history-card">
        <h3>${result}</h3>
        <p>${b.problemTitle || "Unknown Problem"}</p>
        <p>${b.difficulty} • ${xp} XP</p>
        <p>${date}</p>
      </div>
    `;
  }).join("");
}

// ─── Create battle ────────────────────────────────────────────────────────────
if (startBattleBtn) {
  startBattleBtn.addEventListener("click", async () => {
    // opponentEmail field — see HTML changes at bottom of this file
    const opponentEmail = document.getElementById("opponentEmail")?.value.trim();
    const difficulty    = document.getElementById("difficultySelect")?.value;

    if (!opponentEmail) {
      alert("Enter your opponent's email address first.");
      return;
    }

    startBattleBtn.disabled    = true;
    startBattleBtn.textContent = "Creating...";

    try {
      const { battleId } = await apiFetch("/battles", {
        method: "POST",
        body: JSON.stringify({ opponentEmail, difficulty }),
      });

      currentBattleId = battleId;
      setStatus(`✅ Battle created! Share this ID with your opponent: ${battleId}`);
      startPolling(battleId);
    } catch (err) {
      alert(`Could not create battle: ${err.message}`);
      resetUI();
    }
  });
}

// ─── Join battle ──────────────────────────────────────────────────────────────
if (joinBattleBtn) {
  joinBattleBtn.addEventListener("click", async () => {
    const battleId = document.getElementById("joinBattleId")?.value.trim();
    if (!battleId) {
      alert("Paste the Battle ID your opponent shared with you.");
      return;
    }

    joinBattleBtn.disabled    = true;
    joinBattleBtn.textContent = "Joining...";

    try {
      await apiFetch(`/battles/${battleId}/join`, { method: "POST" });
      currentBattleId = battleId;
      setStatus("✅ Joined! Battle is starting...");
      startPolling(battleId);
    } catch (err) {
      alert(`Could not join: ${err.message}`);
      joinBattleBtn.disabled    = false;
      joinBattleBtn.textContent = "Join Battle";
    }
  });
}

// ─── Submit solution ──────────────────────────────────────────────────────────
if (submitSolutionBtn) {
  submitSolutionBtn.addEventListener("click", async () => {
    if (!currentBattleId) {
      alert("No active battle. Create or join one first.");
      return;
    }

    const code = document.getElementById("solutionCode")?.value || "";
    if (!code.trim()) {
      alert("Write your solution before submitting.");
      return;
    }

    submitSolutionBtn.disabled    = true;
    submitSolutionBtn.textContent = "Submitting...";

    try {
      const result = await apiFetch(`/battles/${currentBattleId}/submit`, {
        method: "POST",
        body: JSON.stringify({ code }),
      });

      stopPolling();
      if (winnerText) winnerText.textContent = "🏆 You Won!";
      if (xpReward)   xpReward.textContent   = result.xpAwarded;
      loadHistory();
      resetUI();
    } catch (err) {
      // Could be "opponent submitted first" — poll to get the real final state
      alert(err.message);
      submitSolutionBtn.disabled    = false;
      submitSolutionBtn.textContent = "Submit Solution";
      if (currentBattleId) pollBattle(currentBattleId);
    }
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setStatus(msg) {
  if (statusMsg) statusMsg.textContent = msg;
}

function resetUI() {
  currentBattleId = null;
  if (startBattleBtn) {
    startBattleBtn.disabled    = false;
    startBattleBtn.textContent = "⚔️ Start Challenge";
  }
  if (joinBattleBtn) {
    joinBattleBtn.disabled    = false;
    joinBattleBtn.textContent = "Join Battle";
  }
  if (submitSolutionBtn) {
    submitSolutionBtn.disabled    = false;
    submitSolutionBtn.textContent = "Submit Solution";
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
// Fetch the current session once on load to get the user ID (session.sub).
// /api/session returns { authenticated, user: { sub, name, email, exp } }
async function init() {
  try {
    const { authenticated, user } = await apiFetch("/session");
    if (!authenticated || !user) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
      return;
    }
    currentUserId = user.sub; // confirmed from server.js createSessionToken line 195
    await loadHistory();
  } catch (err) {
    console.error("Session check failed:", err.message);
  }
}

document.addEventListener("DOMContentLoaded", init);
