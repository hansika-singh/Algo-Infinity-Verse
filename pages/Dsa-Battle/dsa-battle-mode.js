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

const battleLobby = document.getElementById("battle-lobby");
const activeBattle = document.getElementById("active-battle");
const solutionCode = document.getElementById("solutionCode");

// New DOM refs
const findMatchBtn = document.getElementById("findMatchBtn");
const difficultySelect = document.getElementById("difficultySelect");
const matchmakingStatus = document.getElementById("matchmakingStatus");
const myUsernameDisplay = document.getElementById("myUsernameDisplay");
const opponentNameDisplay = document.getElementById("opponentNameDisplay");
const myProgressBar = document.getElementById("myProgressBar");
const opponentProgressBar = document.getElementById("opponentProgressBar");
const myProgressText = document.getElementById("myProgressText");
const opponentProgressText = document.getElementById("opponentProgressText");
const submitStatusMsg = document.getElementById("submitStatusMsg");

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
    let { authenticated, user } = await apiFetch("/session").catch(() => ({ authenticated: false, user: null }));
    if (!authenticated || !user) {
      // Mock user for direct access without login
      authenticated = true;
      user = { sub: "guest-" + Math.floor(Math.random() * 10000), name: "Guest User", email: "guest@example.com" };
    }
    currentUserId = user.sub;
    currentUserName = user.name || user.email;
    initSocket();
    await loadHistory().catch(() => console.warn("Failed to load history (requires Firestore)"));
  } catch (err) {
    console.error("Session check failed:", err.message);
  }
}

function initSocket() {
  if (typeof io !== "undefined") {
    socket = io();
    
    socket.on("match-found", (data) => {
      currentBattleId = data.battleId;
      const battle = data.battleData;
      const oppName = data.opponentName[currentUserId];
      
      // Update UI
      if (matchmakingStatus) matchmakingStatus.style.display = "none";
      if (findMatchBtn) findMatchBtn.disabled = false;
      
      battleLobby.style.display = "none";
      activeBattle.style.display = "block";
      
      if (problemTitle) problemTitle.textContent = battle.problemTitle;
      if (problemDesc) problemDesc.textContent = battle.problemDescription;
      if (difficultyEl) difficultyEl.textContent = battle.difficulty;
      
      if (myUsernameDisplay) myUsernameDisplay.textContent = currentUserName;
      if (opponentNameDisplay) opponentNameDisplay.textContent = oppName;
      
      if (myProgressBar) myProgressBar.style.width = "0%";
      if (opponentProgressBar) opponentProgressBar.style.width = "0%";
      if (myProgressText) myProgressText.textContent = "0%";
      if (opponentProgressText) opponentProgressText.textContent = "0%";
      if (submitStatusMsg) submitStatusMsg.textContent = "";
      if (solutionCode) {
        solutionCode.value = "";
        solutionCode.disabled = false;
      }
      if (submitSolutionBtn) submitSolutionBtn.disabled = false;
      
      // Start client side timer (5 mins)
      let timeLeft = 300;
      if (timerEl) timerEl.textContent = timeLeft;
      
      stopPolling(); // we use socket now, but keep interval for timer
      pollInterval = setInterval(() => {
        timeLeft--;
        if (timerEl) timerEl.textContent = Math.max(0, timeLeft);
        if (timeLeft <= 0) {
          stopPolling();
          submitStatusMsg.textContent = "Time's up!";
          submitSolutionBtn.disabled = true;
          solutionCode.disabled = true;
        }
      }, 1000);
    });

    socket.on("battle-progress-update", (data) => {
      if (data.userId === currentUserId) {
        if (myProgressBar) myProgressBar.style.width = data.progress + "%";
        if (myProgressText) myProgressText.textContent = data.progress + "%";
      } else {
        if (opponentProgressBar) opponentProgressBar.style.width = data.progress + "%";
        if (opponentProgressText) opponentProgressText.textContent = data.progress + "%";
      }
    });

    socket.on("battle-over", (data) => {
      stopPolling();
      submitSolutionBtn.disabled = true;
      solutionCode.disabled = true;
      
      const isWinner = data.winnerId === currentUserId;
      if (isWinner) {
        submitStatusMsg.style.color = "#22c55e";
        submitStatusMsg.textContent = `🏆 You won the battle! Earned ${data.xpAwarded} XP and the '${data.badge}' badge!`;
        
        // Update LocalStorage
        const up = JSON.parse(localStorage.getItem("algoInfinityVerse") || "{}");
        up.battlesWon = (up.battlesWon || 0) + 1;
        up.xp = (up.xp || 0) + data.xpAwarded;
        if (!up.badges) up.badges = [];
        if (!up.badges.includes(data.badge)) up.badges.push(data.badge);
        localStorage.setItem("algoInfinityVerse", JSON.stringify(up));
      } else {
        submitStatusMsg.style.color = "#ef4444";
        submitStatusMsg.textContent = `❌ ${data.winnerName} won the battle!`;
      }
      
      setTimeout(() => {
        alert(submitStatusMsg.textContent);
        location.reload();
      }, 3000);
    });
    
    socket.on("battle-submit-result", (data) => {
      if (!data.success) {
        submitStatusMsg.style.color = "`#ef4444`";
        submitStatusMsg.textContent =
          data.message || data.error || "Submission failed.";
        submitSolutionBtn.disabled = false;
        submitSolutionBtn.textContent = "Submit Solution";
      }
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
if (findMatchBtn) {
  findMatchBtn.addEventListener("click", () => {
    if (!socket) return alert("Disconnected from server.");
    const difficulty = difficultySelect?.value || "Medium";
    
    findMatchBtn.disabled = true;
    if (matchmakingStatus) matchmakingStatus.style.display = "block";
    
    socket.emit('find-match', { 
      userId: currentUserId, 
      userName: currentUserName, 
      difficulty 
    });
  });
}

if (submitSolutionBtn) {
  submitSolutionBtn.addEventListener("click", () => {
    if (!currentBattleId || !socket) return;
    const code = solutionCode.value || "";
    if (!code.trim()) return;

    submitSolutionBtn.disabled = true;
    submitSolutionBtn.textContent = "Submitting...";
    if (submitStatusMsg) {
      submitStatusMsg.style.color = "#eab308";
      submitStatusMsg.textContent = "Running tests...";
    }

    socket.emit('battle-submit', {
      battleId: currentBattleId,
      userId: currentUserId,
      code
    });
  });
}

// ─── Real-time typing logic ───
if (solutionCode) {
    solutionCode.addEventListener('input', () => {
        if (!currentBattleId || !socket) return;
        
        // Mock progress updates based on line count for demo purposes
        const lines = solutionCode.value.split('\n').length;
        const progress = Math.min(100, lines * 5); // 5% per line typed as a mock
        socket.emit('battle-progress-update', {
            battleId: currentBattleId,
            userId: currentUserId,
            progress
        });
        
        // Update my own progress locally immediately
        if (myProgressBar) myProgressBar.style.width = progress + "%";
        if (myProgressText) myProgressText.textContent = progress + "%";
    });
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
