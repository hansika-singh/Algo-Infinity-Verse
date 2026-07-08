// dsa-battle-mode.js
let currentBattleId = null;
let pollInterval = null;
let currentUserId = null;
let currentUserName = null;
let socket = null;
let spectatorTargetId = null;
let participantsMap = {}; // map of id to { progress, code }

// DOM refs
const startBattleBtn = document.getElementById("startBattleBtn");
const joinBattleBtn = document.getElementById("joinBattleBtn");
const submitSolutionBtn = document.getElementById("submitSolutionBtn");
const timerEl = document.getElementById("timer");
const winnerText = document.getElementById("winnerText");
const xpReward = document.getElementById("xpReward");
const problemTitle = document.getElementById("problemTitle");
const problemDesc = document.getElementById("problemDescription");
const difficultyEl = document.getElementById("difficultyBadge");
const historyGrid = document.getElementById("historyGrid");
const statusMsg = document.getElementById("battleStatusMsg");

const waitingRoom = document.getElementById("waitingRoom");
const lobbyCodeDisplay = document.getElementById("lobbyCodeDisplay");
const participantsList = document.getElementById("participantsList");
const hostStartBtn = document.getElementById("hostStartBtn");
const activeBattle = document.getElementById("active-battle");
const scoreboardList = document.getElementById("scoreboardList");
const battleLobby = document.getElementById("battle-lobby");

const solutionCode = document.getElementById("solutionCode");

// Spectator
const spectatorModal = document.getElementById("spectatorModal");
const spectatorTargetName = document.getElementById("spectatorTargetName");
const spectatorCode = document.getElementById("spectatorCode");
const spectatorCursor = document.getElementById("spectatorCursor");
const closeSpectatorBtn = document.getElementById("closeSpectatorBtn");

// ─── Authenticated fetch ───
async function apiFetch(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    ...options, credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ─── Init ───
async function init() {
  try {
    const { authenticated, user } = await apiFetch("/session");
    if (!authenticated || !user) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
      return;
    }
    currentUserId = user.sub;
    currentUserName = user.name || user.email;
    initSocket();
    await loadHistory();
  } catch (err) {
    console.error("Session check failed:", err.message);
  }
}

function initSocket() {
  if (typeof io !== "undefined") {
    socket = io();
    
    socket.on("battle-user-joined", (data) => {
      // Just re-poll to get updated participant list
      if (currentBattleId) pollBattle(currentBattleId);
    });

    socket.on("battle-code-update", (data) => {
      if (spectatorTargetId === data.userId && spectatorCode) {
        spectatorCode.value = data.code || "";
      }
    });

    socket.on("battle-cursor-update", (data) => {
      if (spectatorTargetId === data.userId && spectatorCursor) {
        spectatorCursor.style.display = "block";
        // Approximating cursor position, in a real editor we'd map row/col to pixels.
        // We use 8px per char width and 16px line height approximation
        spectatorCursor.style.left = (data.position.col * 8 + 16) + "px"; 
        spectatorCursor.style.top = (data.position.row * 16 + 16) + "px";
      }
    });

    socket.on("battle-progress-update", (data) => {
      if (!participantsMap[data.userId]) {
         participantsMap[data.userId] = { progress: 0 };
      }
      participantsMap[data.userId].progress = data.progress;
      renderScoreboard();
    });
  }
}

// ─── Polling ───
function startPolling(battleId) {
  stopPolling();
  pollBattle(battleId);
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
    console.error("Poll error:", err.message);
  }
}

function renderBattleState(battle) {
  switch (battle.status) {
    case "waiting":
      battleLobby.style.display = "block";
      activeBattle.style.display = "none";
      waitingRoom.style.display = "block";
      lobbyCodeDisplay.textContent = battle.id;
      
      participantsList.innerHTML = battle.participants.map(p => 
        `<li style="padding: 8px; background: var(--bg-lighter); margin-bottom: 5px; border-radius: 4px;">
            ${p === currentUserId ? 'You' : 'Player ' + p.substring(0,6)}
        </li>`
      ).join('');
      
      if (battle.hostId === currentUserId) {
        hostStartBtn.style.display = "inline-block";
      } else {
        hostStartBtn.style.display = "none";
      }
      
      // Update participantsMap for scoreboard
      battle.participants.forEach(p => {
         if(!participantsMap[p]) participantsMap[p] = { progress: 0 };
      });
      break;

    case "active":
      battleLobby.style.display = "none";
      activeBattle.style.display = "block";
      waitingRoom.style.display = "none";

      if (problemTitle) problemTitle.textContent = battle.problemTitle || "Battle Problem";
      if (problemDesc)  problemDesc.textContent  = battle.problemDescription || "";
      if (difficultyEl) difficultyEl.textContent = battle.difficulty;

      const secsLeft = Math.max(0, Math.floor((battle.timeRemainingMs ?? 0) / 1000));
      if (timerEl) timerEl.textContent = secsLeft;
      
      renderScoreboard();

      if (secsLeft <= 0) {
        stopPolling();
        pollBattle(battle.id);
      }
      break;

    case "completed":
    case "expired":
      stopPolling();
      renderResult(battle);
      loadHistory();
      break;
  }
}

function renderScoreboard() {
    if (!scoreboardList) return;
    scoreboardList.innerHTML = Object.keys(participantsMap).map(pId => {
        const isMe = pId === currentUserId;
        const prog = participantsMap[pId].progress || 0;
        return `
            <div style="background:var(--bg-lighter); padding: 10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${isMe ? 'You' : 'Player ' + pId.substring(0,6)}</strong>
                    <div style="width: 150px; background:#444; height:10px; border-radius:5px; margin-top:5px; overflow:hidden;">
                        <div style="width:${prog}%; background:var(--primary-color); height:100%;"></div>
                    </div>
                </div>
                ${!isMe ? `<button class="btn btn-secondary btn-sm spectate-btn" data-id="${pId}">Spectate</button>` : ''}
            </div>
        `;
    }).join('');

    document.querySelectorAll('.spectate-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-id');
            spectatorTargetId = targetId;
            spectatorTargetName.textContent = 'Player ' + targetId.substring(0,6);
            spectatorCode.value = "// Waiting for code updates...";
            spectatorCursor.style.display = "none";
            spectatorModal.style.display = "flex";
        });
    });
}

// ─── Actions ───
if (startBattleBtn) {
  startBattleBtn.addEventListener("click", async () => {
    const difficulty = document.getElementById("difficultySelect")?.value;
    startBattleBtn.disabled = true;
    startBattleBtn.textContent = "Creating...";

    try {
      const { battleId } = await apiFetch("/battles", {
        method: "POST",
        body: JSON.stringify({ difficulty }), // No opponent email needed
      });

      currentBattleId = battleId;
      if (socket) socket.emit('battle-join', { battleId, userId: currentUserId });
      startPolling(battleId);
      setStatus("Lobby created!");
    } catch (err) {
      console.warn("Alert:", err.message);
      resetUI();
    }
  });
}

if (joinBattleBtn) {
  joinBattleBtn.addEventListener("click", async () => {
    const battleId = document.getElementById("joinBattleId")?.value.trim().toUpperCase();
    if (!battleId) return;

    joinBattleBtn.disabled = true;
    joinBattleBtn.textContent = "Joining...";

    try {
      await apiFetch(`/battles/${battleId}/join`, { method: "POST" });
      currentBattleId = battleId;
      if (socket) socket.emit('battle-join', { battleId, userId: currentUserId });
      startPolling(battleId);
      setStatus("Joined lobby!");
    } catch (err) {
      console.warn("Alert:", err.message);
      resetUI();
    }
  });
}

if (hostStartBtn) {
  hostStartBtn.addEventListener("click", async () => {
    if (!currentBattleId) return;
    try {
      await apiFetch(`/battles/${currentBattleId}/start`, { method: "POST" });
      pollBattle(currentBattleId);
    } catch (err) {
      console.warn("Alert:", err.message);
    }
  });
}

if (submitSolutionBtn) {
  submitSolutionBtn.addEventListener("click", async () => {
    if (!currentBattleId) return;
    const code = solutionCode.value || "";
    if (!code.trim()) return;

    submitSolutionBtn.disabled = true;
    submitSolutionBtn.textContent = "Submitting...";

    try {
      const result = await apiFetch(`/battles/${currentBattleId}/submit`, {
        method: "POST", body: JSON.stringify({ code }),
      });
      stopPolling();
      winnerText.textContent = "🏆 You Won!";
      xpReward.textContent = result.xpAwarded;
      loadHistory();
      renderResult({ winner: currentUserId, xpAwarded: result.xpAwarded });
    } catch (err) {
      console.warn("Alert:", err.message);
      submitSolutionBtn.disabled = false;
      submitSolutionBtn.textContent = "Submit Solution";
      pollBattle(currentBattleId);
    }
  });
}

if (closeSpectatorBtn) {
    closeSpectatorBtn.addEventListener("click", () => {
        spectatorModal.style.display = "none";
        spectatorTargetId = null;
    });
}

// ─── Real-time typing logic ───
if (solutionCode) {
    solutionCode.addEventListener('input', () => {
        if (!currentBattleId || !socket) return;
        socket.emit('battle-code-update', {
            battleId: currentBattleId,
            userId: currentUserId,
            code: solutionCode.value
        });
        
        // Mock progress updates based on line count for demo purposes
        const lines = solutionCode.value.split('\n').length;
        const progress = Math.min(100, lines * 5); // 5% per line typed as a mock
        socket.emit('battle-progress-update', {
            battleId: currentBattleId,
            userId: currentUserId,
            progress
        });
        if (participantsMap[currentUserId]) participantsMap[currentUserId].progress = progress;
        renderScoreboard();
    });

    solutionCode.addEventListener('keyup', updateCursor);
    solutionCode.addEventListener('click', updateCursor);

    function updateCursor() {
        if (!currentBattleId || !socket) return;
        const pos = solutionCode.selectionStart;
        const textToCursor = solutionCode.value.substring(0, pos);
        const lines = textToCursor.split('\n');
        const row = lines.length - 1;
        const col = lines[lines.length - 1].length;
        
        socket.emit('battle-cursor-update', {
            battleId: currentBattleId,
            userId: currentUserId,
            position: { row, col }
        });
    }
}

// ─── Helpers ───
function setStatus(msg) {
  if (statusMsg) statusMsg.textContent = msg;
}

function resetUI() {
  currentBattleId = null;
  participantsMap = {};
  if (startBattleBtn) {
    startBattleBtn.disabled = false;
    startBattleBtn.textContent = "Create Lobby";
  }
  if (joinBattleBtn) {
    joinBattleBtn.disabled = false;
    joinBattleBtn.textContent = "Join Lobby";
  }
  if (submitSolutionBtn) {
    submitSolutionBtn.disabled = false;
    submitSolutionBtn.textContent = "Submit Solution";
  }
}

function renderResult(battle) {
  const iWon = currentUserId && battle.winner === currentUserId;
  const isDraw = battle.status === "expired" && !battle.winner;

  if (winnerText) {
    winnerText.textContent = isDraw
      ? "🤝 Draw — time ran out"
      : iWon ? "🏆 You Won!" : "❌ Player " + (battle.winner ? battle.winner.substring(0,6) : "Unknown") + " Won";
  }
  if (xpReward) xpReward.textContent = iWon ? battle.xpAwarded : 0;
  
  // Show result modal or section (reuse active battle but hide editor)
  battleLobby.style.display = "none";
  activeBattle.style.display = "block";
  document.querySelector('.battle-editor').style.display = "none";
  resetUI();
}

async function loadHistory() {
  try {
    const { history } = await apiFetch("/battles/history");
    if (!historyGrid) return;
    if (!history?.length) {
      historyGrid.innerHTML = '<p style="color:#94a3b8;text-align:center">No battles yet.</p>';
      return;
    }
    historyGrid.innerHTML = history.map((b) => {
      const iWon = currentUserId && b.winner === currentUserId;
      const isDraw = b.status === "expired" && !b.winner;
      const result = isDraw ? "Draw" : iWon ? "Victory" : "Defeat";
      const xp = iWon ? b.xpAwarded : 0;
      const date = b.createdAt?._seconds ? new Date(b.createdAt._seconds * 1000).toLocaleDateString() : "—";
      return `<div class="history-card">
          <h3>${result}</h3>
          <p>${b.problemTitle || "Unknown Problem"}</p>
          <p>${b.difficulty} • ${xp} XP</p>
          <p>${date}</p>
        </div>`;
    }).join("");
  } catch (err) { }
}

document.addEventListener("DOMContentLoaded", init);
