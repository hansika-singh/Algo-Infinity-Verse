// Escape Room Client Logic

const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');
const userName = urlParams.get('user') || 'Anonymous Hacker';

if (!roomId) {
    window.location.href = 'index.html';
    return;
}

document.getElementById('room-id-display').innerText = `[ROOM: ${roomId}]`;

// Join the room
socket.emit('escape-join', { roomId, userId: socket.id || Date.now().toString(), userName });

// --- Chat Logic ---
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

function appendMessage(sender, text, isSystem = false) {
    const div = document.createElement('div');
    div.className = 'message' + (isSystem ? ' system' : '');
    div.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendBtn.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
        appendMessage('You', message);
        socket.emit('escape-chat', { roomId, userName, message });
        chatInput.value = '';
    }
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});

socket.on('escape-chat', (data) => {
    appendMessage(data.userName, data.message);
});

socket.on('escape-user-joined', (data) => {
    appendMessage('SYSTEM', `${data.userName} has breached the firewall and joined the mission.`, true);
});

// --- Code Editor Sync ---
const codeEditor = document.getElementById('code-editor');

// Sync outgoing changes
codeEditor.addEventListener('input', () => {
    socket.emit('escape-code-update', { roomId, code: codeEditor.value });
});

// Sync incoming changes
socket.on('escape-code-update', (data) => {
    // Basic cursor retention to prevent jumping (naive implementation for MVP)
    const start = codeEditor.selectionStart;
    const end = codeEditor.selectionEnd;
    codeEditor.value = data.code;
    codeEditor.setSelectionRange(start, end);
});

// --- Execution & Puzzle Validation ---
const submitBtn = document.getElementById('submit-btn');
const executionOutput = document.getElementById('execution-output');
const statusAlert = document.getElementById('status-alert');

function logTerminal(msg) {
    executionOutput.innerHTML += `<br>> ${msg}`;
    executionOutput.scrollTop = executionOutput.scrollHeight;
}

submitBtn.addEventListener('click', () => {
    const code = codeEditor.value;
    logTerminal("Compiling and running tests...");
    
    try {
        // Create a safe environment to test the function
        // For MVP, we use new Function, though in production an isolated sandbox or backend execution is better.
        const testFunc = new Function('encryptedStr', 'shift', code + '\nreturn decryptToken(encryptedStr, shift);');
        
        const testCases = [
            { input: ["KHOOR", 3], expected: "HELLO" }, // Basic shift
            { input: ["DEF", 3], expected: "ABC" }, // Another basic shift
            { input: ["A", 3], expected: "X" }, // Wrap around alphabet edge case
            { input: ["khoor zruog!", 3], expected: "hello world!" }, // Lowercase and special chars edge case
            { input: ["", 5], expected: "" } // Empty string edge case
        ];

        let passedAll = true;

        for (let i = 0; i < testCases.length; i++) {
            const { input, expected } = testCases[i];
            const result = testFunc(input[0], input[1]);
            
            if (result !== expected) {
                logTerminal(`<span style="color: red;">Test ${i+1} Failed: Expected "${expected}", got "${result}"</span>`);
                passedAll = false;
                break;
            } else {
                logTerminal(`<span style="color: var(--text-primary);">Test ${i+1} Passed.</span>`);
            }
        }

        if (passedAll) {
            logTerminal('<span style="color: var(--text-primary); font-weight: bold;">ALL TESTS PASSED. VAULT UNLOCKED.</span>');
            statusAlert.innerText = "MISSION ACCOMPLISHED! The vault is open.";
            statusAlert.className = "status-alert success";
            statusAlert.style.display = "block";
            
            socket.emit('escape-puzzle-solved', { roomId, userId: socket.id, userName, puzzleId: 'cyber_vault_1' });
        }

    } catch (err) {
        logTerminal(`<span style="color: red;">Error: ${err.message}</span>`);
    }
});

socket.on('escape-puzzle-solved', (data) => {
    logTerminal(`<span style="color: var(--text-primary); font-weight: bold;">TEAMMATE ${data.userName} UNLOCKED THE VAULT!</span>`);
    statusAlert.innerText = `MISSION ACCOMPLISHED BY ${data.userName.toUpperCase()}!`;
    statusAlert.className = "status-alert success";
    statusAlert.style.display = "block";
});

// --- Timer Logic ---
let timeLeft = 15 * 60; // 15 minutes
const timerDisplay = document.getElementById('mission-timer');

setInterval(() => {
    if (timeLeft <= 0) return;
    timeLeft--;
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    timerDisplay.innerText = `${m}:${s}`;
    
    if (timeLeft === 0) {
        logTerminal('<span style="color: red; font-weight: bold;">TIME IS UP. MISSION FAILED.</span>');
        statusAlert.innerText = "SECURITY ALERT TRIPPED. YOU HAVE BEEN DISCONNECTED.";
        statusAlert.style.display = "block";
        codeEditor.disabled = true;
    }
}, 1000);
