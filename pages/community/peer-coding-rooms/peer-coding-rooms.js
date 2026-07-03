document.addEventListener("DOMContentLoaded", () => {
  // Establish Socket connection
  const socket = typeof io !== "undefined" ? io("/") : null;

  // Retrieve user progress
  let myUserId = "user-" + Math.floor(Math.random() * 100000);
  let myUserName = "Learner";
  let myUserAvatar = "🚀";

  if (typeof userProgress !== "undefined" && userProgress.name) {
    myUserId = userProgress.id || "user-" + Math.floor(Math.random() * 100000);
    myUserName = userProgress.name;
    myUserAvatar = userProgress.avatar || "🚀";
  }

  // Local State
  let activeRoom = null;
  let editor = null;
  let inspectorEditor = null;
  let currentProblem = null;
  let codeSubmitTime = null;

  // DOM Elements
  const lobbyView = document.getElementById("lobbyView");
  const roomView = document.getElementById("roomView");
  const recapView = document.getElementById("recapView");

  const activeRoomsList = document.getElementById("activeRoomsList");
  const createRoomForm = document.getElementById("createRoomForm");
  const topicSelect = document.getElementById("topicSelect");
  const difficultySelect = document.getElementById("difficultySelect");
  const timerSelect = document.getElementById("timerSelect");
  const capacitySelect = document.getElementById("capacitySelect");

  const directRoomCode = document.getElementById("directRoomCode");
  const btnJoinDirect = document.getElementById("btnJoinDirect");

  const roomProblemTitle = document.getElementById("roomProblemTitle");
  const roomProblemDifficulty = document.getElementById("roomProblemDifficulty");
  const roomProblemCategory = document.getElementById("roomProblemCategory");
  const roomProblemDescription = document.getElementById("roomProblemDescription");
  const roomEditorContainer = document.getElementById("roomEditorContainer");
  const roomConsoleOutput = document.getElementById("roomConsoleOutput");
  const btnClearConsole = document.getElementById("btnClearConsole");

  const roomCountdownTimer = document.getElementById("roomCountdownTimer");
  const btnHostStartChallenge = document.getElementById("btnHostStartChallenge");
  const btnSubmitSolution = document.getElementById("btnSubmitSolution");
  const roomParticipantsList = document.getElementById("roomParticipantsList");

  const roomChatHistory = document.getElementById("roomChatHistory");
  const roomChatInput = document.getElementById("roomChatInput");
  const btnSendRoomChat = document.getElementById("btnSendRoomChat");
  const btnExitRoom = document.getElementById("btnExitRoom");

  const recapLeaderboardBody = document.getElementById("recapLeaderboardBody");
  const recapUserSelector = document.getElementById("recapUserSelector");
  const inspectorEditorContainer = document.getElementById("inspectorEditorContainer");
  const btnRecapBackToLobby = document.getElementById("btnRecapBackToLobby");

  // Initialize
  initLobby();

  // ── Lobby Functions ──
  function initLobby() {
    showView("lobby");
    fetchActiveRooms();
    
    // Bind Create Room Form
    createRoomForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const maxParticipants = parseInt(capacitySelect.value);
      const timerDuration = parseInt(timerSelect.value);
      const difficulty = difficultySelect.value;
      const topic = topicSelect.value;

      try {
        const res = await fetch("/api/study-rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ maxParticipants, timerDuration, difficulty, topic })
        });
        const data = await res.json();
        if (data.roomId) {
          joinRoom(data.roomId);
        } else {
          alert("Failed to create room: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        console.error("Create room error:", err);
      }
    });

    // Bind Join Direct
    btnJoinDirect.addEventListener("click", () => {
      const code = directRoomCode.value.trim().toUpperCase();
      if (code) {
        joinRoom(code);
      }
    });
  }

  async function fetchActiveRooms() {
    try {
      const res = await fetch("/api/study-rooms");
      const data = await res.json();
      renderRoomsList(data.rooms || []);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      activeRoomsList.innerHTML = `<div class="loading-placeholder" style="color: #ef4444;">Failed to load active rooms.</div>`;
    }
  }

  function renderRoomsList(rooms) {
    if (rooms.length === 0) {
      activeRoomsList.innerHTML = `<div class="loading-placeholder">No active rooms found. Create one to get started!</div>`;
      return;
    }

    activeRoomsList.innerHTML = "";
    rooms.forEach(room => {
      const card = document.createElement("div");
      card.className = "room-card-item";

      const diffClass = room.difficulty.toLowerCase();
      
      card.innerHTML = `
        <div class="room-info-block">
          <h3>${room.id}</h3>
          <div class="room-meta-tags">
            <span class="badge ${diffClass}">${room.difficulty}</span>
            <span class="badge">${room.topic.toUpperCase()}</span>
            <span class="badge"><i class="fas fa-users"></i> ${room.participantsCount} / ${room.maxParticipants}</span>
            <span class="badge"><i class="fas fa-hourglass-half"></i> ${room.timerDuration / 60}m</span>
          </div>
          <div style="font-size: 0.82rem; margin-top: 0.5rem; color: var(--text-secondary);">Host: ${room.hostName}</div>
        </div>
        <div>
          ${room.status === "playing" 
            ? `<button class="btn btn-secondary" disabled>In Progress</button>` 
            : `<button class="btn btn-primary btn-join-action" data-id="${room.id}">Join Room</button>`}
        </div>
      `;

      activeRoomsList.appendChild(card);
    });

    // Bind join buttons
    activeRoomsList.querySelectorAll(".btn-join-action").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        joinRoom(id);
      });
    });
  }

  function joinRoom(roomId) {
    if (!socket) {
      alert("Socket server connection not available.");
      return;
    }
    
    showView("room");
    activeRoom = { id: roomId };
    
    // Clear chat & console
    roomChatHistory.innerHTML = "";
    roomConsoleOutput.textContent = "Welcome to room " + roomId + ". Waiting for host to start...";
    btnSubmitSolution.style.display = "none";
    btnHostStartChallenge.style.display = "none";

    socket.emit("join-study-room", { roomId, userId: myUserId, userName: myUserName });
  }

  // ── Socket Events ──
  if (socket) {
    socket.on("study-room-updated", (room) => {
      activeRoom = room;
      updateLeaderboard();

      // If playing, render current problem
      if (room.status === "playing" && room.currentProblem) {
        loadRoundDetails(room.currentProblem, room.timerSeconds);
      } else {
        // If lobby, show host start button
        if (room.hostId === myUserId) {
          btnHostStartChallenge.style.display = "block";
          roomCountdownTimer.textContent = "LOBBY";
          roomCountdownTimer.classList.remove("danger");
        } else {
          btnHostStartChallenge.style.display = "none";
          roomCountdownTimer.textContent = "WAITING";
        }
      }
    });

    socket.on("study-round-started", ({ problem, timerDuration, roomState }) => {
      activeRoom = roomState;
      loadRoundDetails(problem, timerDuration);
    });

    socket.on("study-timer-tick", ({ timerSeconds }) => {
      if (activeRoom) activeRoom.timerSeconds = timerSeconds;
      
      const m = Math.floor(timerSeconds / 60);
      const s = timerSeconds % 60;
      roomCountdownTimer.textContent = `${m}:${s < 10 ? "0" : ""}${s}`;

      if (timerSeconds < 60) {
        roomCountdownTimer.classList.add("danger");
      } else {
        roomCountdownTimer.classList.remove("danger");
      }
    });

    socket.on("study-round-ended", (roomState) => {
      activeRoom = roomState;
      showView("recap");
      renderRecapScoreboard();
    });

    socket.on("receive-study-chat", ({ userName, text }) => {
      appendChatMessage(userName, text);
    });
  }

  // ── Game/Round Playback ──
  function loadRoundDetails(problem, timerSeconds) {
    currentProblem = problem;
    roomProblemTitle.textContent = problem.title;
    roomProblemDifficulty.textContent = problem.difficulty;
    roomProblemDifficulty.className = `badge ${problem.difficulty.toLowerCase()}`;
    roomProblemCategory.textContent = (problem.category || "General").toUpperCase();
    roomProblemDescription.innerHTML = `
      <p>${problem.description}</p>
      ${problem.constraints ? `<strong>Constraints:</strong><ul>${problem.constraints.map(c => `<li><code>${c}</code></li>`).join("")}</ul>` : ""}
      ${problem.examples ? `<strong>Examples:</strong><pre>${problem.examples.join("\n")}</pre>` : ""}
    `;

    // Initialize Code Editor
    roomEditorContainer.innerHTML = "";
    const starterCode = problem.starterCode || `/**
 * Problem: ${problem.title}
 * Topic: ${problem.category}
 */

function ${problem.functionName || "solve"}(${(problem.params || []).join(", ")}) {
    // Start writing your solution here...
    
}`;

    editor = CodeMirror(roomEditorContainer, {
      lineNumbers: true,
      theme: "dracula",
      mode: "javascript",
      value: starterCode,
      indentUnit: 4,
      matchBrackets: true,
      autoCloseBrackets: true
    });

    btnSubmitSolution.style.display = "block";
    btnHostStartChallenge.style.display = "none";
    
    // Check if I already submitted
    if (activeRoom && activeRoom.participants[myUserId]?.status === "completed") {
      btnSubmitSolution.disabled = true;
      btnSubmitSolution.textContent = "Submitted";
    } else {
      btnSubmitSolution.disabled = false;
      btnSubmitSolution.innerHTML = `<i class="fas fa-cloud-upload-alt"></i> Submit Solution`;
    }
  }

  function updateLeaderboard() {
    roomParticipantsList.innerHTML = "";
    if (!activeRoom) return;

    Object.values(activeRoom.participants).forEach(p => {
      const card = document.createElement("div");
      card.className = "participant-status-card";
      if (p.id === myUserId) card.classList.add("me");

      const timeStr = p.timeTaken !== null ? `${p.timeTaken}s` : "--";
      const scoreStr = p.score > 0 ? `+${p.score} XP` : "0 XP";

      card.innerHTML = `
        <div class="participant-info">
          <span class="participant-avatar">${myUserId === p.id ? myUserAvatar : "👤"}</span>
          <span class="participant-name">${p.name} ${p.id === activeRoom.hostId ? `<i class="fas fa-crown" style="color:#f59e0b; margin-left:0.25rem;"></i>` : ""}</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span style="font-size:0.8rem; color:var(--text-secondary);">${timeStr} | ${scoreStr}</span>
          <span class="participant-status-badge ${p.status}">${p.status}</span>
        </div>
      `;

      roomParticipantsList.appendChild(card);
    });
  }

  // Bind Start Round
  btnHostStartChallenge.addEventListener("click", () => {
    if (!activeRoom) return;
    
    // Find problem
    const diff = activeRoom.config.difficulty.toLowerCase();
    const topic = activeRoom.config.topic.toLowerCase();
    
    let candidates = [];
    if (typeof practiceProblems !== "undefined") {
      candidates = practiceProblems.filter(p => 
        p.category.toLowerCase() === topic && 
        p.difficulty.toLowerCase() === diff
      );
    }

    const problem = candidates.length > 0 
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : (typeof practiceProblems !== "undefined" ? practiceProblems[0] : { title: "Two Sum", difficulty: "Easy", category: "arrays", functionName: "twoSum", params: ["nums", "target"], testCases: [{ input: [[2,7,11,15], 9], expected: [0,1] }] });

    socket.emit("start-study-round", { roomId: activeRoom.id, problem });
  });

  // Bind Submit Solution
  btnSubmitSolution.addEventListener("click", () => {
    if (!editor || !currentProblem) return;
    const code = editor.getValue();
    
    roomConsoleOutput.textContent = "Running evaluation tests...";
    
    // Evaluate solution client-side
    const evalResult = runClientCode(code, currentProblem);
    roomConsoleOutput.innerHTML = evalResult.logOutputs.join("<br>");

    if (evalResult.passed) {
      btnSubmitSolution.disabled = true;
      btnSubmitSolution.textContent = "Submitted";
      
      const elapsedSeconds = activeRoom.config.timerDuration - activeRoom.timerSeconds;
      
      socket.emit("submit-study-solution", {
        roomId: activeRoom.id,
        userId: myUserId,
        code,
        timeTaken: elapsedSeconds,
        success: true
      });
    } else {
      roomConsoleOutput.innerHTML += "<br><span style='color:#ef4444;'>❌ Tests failed. Correct your solution and submit again.</span>";
    }
  });

  function runClientCode(code, problem) {
    try {
      const userFn = new Function(
        ...(problem.params || []), 
        `${code}\nreturn ${problem.functionName || "solve"}(...arguments);`
      );
      
      let passed = true;
      const logOutputs = [];
      const cases = problem.testCases || [];

      if (cases.length === 0) {
        logOutputs.push("⚠️ No test cases defined. Solution submitted.");
      } else {
        cases.forEach((tc, idx) => {
          const inputClone = JSON.parse(JSON.stringify(tc.input));
          const result = Array.isArray(inputClone) ? userFn(...inputClone) : userFn(inputClone);
          const expectedStr = JSON.stringify(tc.expected);
          const resultStr = JSON.stringify(result);
          
          if (resultStr === expectedStr) {
            logOutputs.push(`<span style="color:#10b981;">✅ Case ${idx + 1} passed:</span> input=${JSON.stringify(tc.input)} -> got ${resultStr}`);
          } else {
            passed = false;
            logOutputs.push(`<span style="color:#ef4444;">❌ Case ${idx + 1} failed:</span> input=${JSON.stringify(tc.input)} -> expected ${expectedStr}, got ${resultStr}`);
          }
        });
      }
      return { passed, logOutputs };
    } catch (e) {
      return { passed: false, logOutputs: [`<span style="color:#ef4444;">💥 Syntax/Runtime Error: ${e.message}</span>`] };
    }
  }

  // ── Chat Functions ──
  btnSendRoomChat.addEventListener("click", sendChatMessage);
  roomChatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendChatMessage();
  });

  function sendChatMessage() {
    const text = roomChatInput.value.trim();
    if (!text || !activeRoom) return;

    socket.emit("study-chat-message", { roomId: activeRoom.id, userName: myUserName, text });
    roomChatInput.value = "";
  }

  function appendChatMessage(sender, text) {
    const bubble = document.createElement("div");
    if (sender === "System") {
      bubble.className = "chat-bubble system";
      bubble.textContent = `> ${text}`;
    } else {
      bubble.className = "chat-bubble";
      bubble.innerHTML = `<strong>${sender}:</strong> ${text}`;
    }
    roomChatHistory.appendChild(bubble);
    roomChatHistory.scrollTop = roomChatHistory.scrollHeight;
  }

  // Exit Room
  btnExitRoom.addEventListener("click", () => {
    if (activeRoom) {
      socket.emit("leave-study-room", { roomId: activeRoom.id, userId: myUserId });
    }
    activeRoom = null;
    initLobby();
  });

  // ── Recap View Functions ──
  async function renderRecapScoreboard() {
    recapLeaderboardBody.innerHTML = "";
    recapUserSelector.innerHTML = `<option value="">-- Choose Participant --</option>`;
    
    if (!activeRoom) return;

    // Sort participants by score (descending) and timeTaken (ascending)
    const players = Object.values(activeRoom.participants).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.timeTaken || 9999) - (b.timeTaken || 9999);
    });

    players.forEach((p, idx) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td style="padding: 0.75rem 0.5rem; font-weight:600;">#${idx + 1}</td>
        <td style="padding: 0.75rem 0.5rem;">${p.name}</td>
        <td style="padding: 0.75rem 0.5rem;">${p.timeTaken !== null ? `${p.timeTaken}s` : "--"}</td>
        <td style="padding: 0.75rem 0.5rem; font-weight:600; color:var(--accent);">${p.score} XP</td>
        <td style="padding: 0.75rem 0.5rem;"><span class="badge ${p.status}">${p.status}</span></td>
      `;
      recapLeaderboardBody.appendChild(row);

      // Populate solutions inspector dropdown
      if (p.submittedCode) {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.name;
        recapUserSelector.appendChild(option);
      }
    });

    // Handle single read-only inspector initialization
    inspectorEditorContainer.innerHTML = "";
    inspectorEditor = CodeMirror(inspectorEditorContainer, {
      lineNumbers: true,
      theme: "dracula",
      mode: "javascript",
      value: "// Select a participant above to inspect their submitted solution",
      readOnly: true
    });

    // Update results to API
    const myRecap = activeRoom.participants[myUserId];
    if (myRecap && myRecap.score > 0) {
      try {
        const res = await fetch(`/api/study-rooms/${activeRoom.id}/results`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: activeRoom.config.topic,
            difficulty: activeRoom.config.difficulty,
            score: myRecap.score
          })
        });
        const data = await res.json();
        if (data.success) {
          // Increment local storage User XP and Streak
          if (typeof userProgress !== "undefined") {
            userProgress.xp = (userProgress.xp || 0) + myRecap.score;
            userProgress.streak = (userProgress.streak || 0) + 1;
            if (typeof saveUserData === "function") saveUserData();
            else localStorage.setItem("algoInfinityVerse", JSON.stringify(userProgress));
          }
          appendChatMessage("System", `Successfully awarded ${myRecap.score} XP and updated daily streak!`);
        }
      } catch (err) {
        console.error("Failed to post recap results:", err);
      }
    }
  }

  // Inspector dropdown change listener
  recapUserSelector.addEventListener("change", (e) => {
    const userId = e.target.value;
    if (!inspectorEditor) return;

    if (userId && activeRoom && activeRoom.participants[userId]) {
      const code = activeRoom.participants[userId].submittedCode;
      inspectorEditor.setValue(code || "// No solution code submitted.");
    } else {
      inspectorEditor.setValue("// Select a participant above to inspect their submitted solution");
    }
  });

  // Recap to Lobby button
  btnRecapBackToLobby.addEventListener("click", () => {
    if (activeRoom) {
      socket.emit("leave-study-room", { roomId: activeRoom.id, userId: myUserId });
    }
    activeRoom = null;
    initLobby();
  });

  // Helper function to switch views
  function showView(viewName) {
    lobbyView.style.display = viewName === "lobby" ? "grid" : "none";
    roomView.style.display = viewName === "room" ? "grid" : "none";
    recapView.style.display = viewName === "recap" ? "block" : "none";
  }

  // Clear console utility
  btnClearConsole.addEventListener("click", () => {
    roomConsoleOutput.textContent = "";
  });
});