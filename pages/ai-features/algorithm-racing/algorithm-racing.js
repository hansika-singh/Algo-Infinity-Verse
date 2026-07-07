/**
 * algo-racing.js
 * Implements a WebRTC Mesh connection for a 1v1 Algorithm Race.
 * Synchronizes CodeMirror state and test case progress in real-time.
 */

document.addEventListener("DOMContentLoaded", () => {
    initRacingEngine();
});

// --- State ---
let myEditor, oppEditor;
let peerConnection;
let dataChannel;
let isHost = false;
let isRaceActive = false;
const TOTAL_TESTS = 5;

// --- DOM Elements ---
const els = {
    // Top Bar
    btnShowLobby: document.getElementById('btnShowLobby'),
    raceStatusBadge: document.getElementById('raceStatusBadge'),
    
    // Players
    myProgress: document.getElementById('myProgress'),
    myProgressText: document.getElementById('myProgressText'),
    btnRunMyCode: document.getElementById('btnRunMyCode'),
    myConsole: document.getElementById('myConsole'),
    
    oppProgress: document.getElementById('oppProgress'),
    oppProgressText: document.getElementById('oppProgressText'),
    oppPulse: document.getElementById('oppPulse'),
    oppStatusText: document.getElementById('oppStatusText'),
    
    // Modal
    lobbyModal: document.getElementById('lobbyModal'),
    btnCloseLobby: document.getElementById('btnCloseLobby'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // WebRTC Host
    btnGenerateOffer: document.getElementById('btnGenerateOffer'),
    hostOfferToken: document.getElementById('hostOfferToken'),
    hostAnswerToken: document.getElementById('hostAnswerToken'),
    btnConnectHost: document.getElementById('btnConnectHost'),
    
    // WebRTC Join
    guestOfferToken: document.getElementById('guestOfferToken'),
    btnAcceptOffer: document.getElementById('btnAcceptOffer'),
    guestReplySection: document.getElementById('guestReplySection'),
    guestAnswerToken: document.getElementById('guestAnswerToken'),
    
    // Overlay
    raceOverlay: document.getElementById('raceOverlay'),
    countdownText: document.getElementById('countdownText'),
    winnerPanel: document.getElementById('winnerPanel'),
    winnerText: document.getElementById('winnerText'),
    winnerSubtext: document.getElementById('winnerSubtext'),
    btnRematch: document.getElementById('btnRematch')
};

const STUN_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const INITIAL_CODE = `function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        // Your optimized logic here\n        \n    }\n    return [];\n}`;

function initRacingEngine() {
    // Initialize CodeMirror Editors
    myEditor = CodeMirror(document.getElementById('myEditorContainer'), {
        lineNumbers: true, theme: 'monokai', mode: 'javascript', indentUnit: 4, readOnly: true, value: INITIAL_CODE
    });
    
    oppEditor = CodeMirror(document.getElementById('oppEditorContainer'), {
        lineNumbers: true, theme: 'nord', mode: 'javascript', indentUnit: 4, readOnly: 'nocursor', value: INITIAL_CODE
    });

    // Capture Local Edits and Send to Peer
    myEditor.on('change', (cm, change) => {
        if (isRaceActive && dataChannel && dataChannel.readyState === 'open' && change.origin !== 'setValue') {
            dataChannel.send(JSON.stringify({ type: 'code', text: myEditor.getValue() }));
        }
    });

    bindUIEvents();
}

function bindUIEvents() {
    els.btnShowLobby.addEventListener('click', () => els.lobbyModal.classList.remove('hidden'));
    els.btnCloseLobby.addEventListener('click', () => els.lobbyModal.classList.add('hidden'));

    // Modal Tabs
    els.tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            els.tabBtns.forEach(b => b.classList.remove('active'));
            els.tabContents.forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(`tab-${e.target.dataset.tab}`).classList.add('active');
            isHost = e.target.dataset.tab === 'host';
        });
    });

    // WebRTC Flow
    els.btnGenerateOffer.addEventListener('click', handleCreateOffer);
    els.btnAcceptOffer.addEventListener('click', handleAcceptOffer);
    els.btnConnectHost.addEventListener('click', handleProcessAnswer);

    // Race Actions
    els.btnRunMyCode.addEventListener('click', runLocalTests);
    els.btnRematch.addEventListener('click', resetRaceState);
}

// ==========================================
// 1. WEBRTC HANDSHAKE (Serverless)
// ==========================================

function initPeerConnection() {
    if (peerConnection) peerConnection.close();
    peerConnection = new RTCPeerConnection(STUN_CONFIG);
    
    peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        setupDataChannelEvents();
    };

    peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') onConnected();
        if (peerConnection.connectionState === 'disconnected') onDisconnected();
    };
}

async function handleCreateOffer() {
    isHost = true;
    els.btnGenerateOffer.disabled = true;
    els.btnGenerateOffer.textContent = 'Generating...';
    
    initPeerConnection();
    dataChannel = peerConnection.createDataChannel('raceChannel');
    setupDataChannelEvents();

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    peerConnection.onicecandidate = (event) => {
        if (event.candidate === null) {
            els.hostOfferToken.value = btoa(JSON.stringify(peerConnection.localDescription));
            els.btnGenerateOffer.style.display = 'none';
        }
    };
}

async function handleProcessAnswer() {
    const token = els.hostAnswerToken.value.trim();
    if (!token) return void 0;
    try {
        await peerConnection.setRemoteDescription(JSON.parse(atob(token)));
    } catch (err) { void 0; }
}

async function handleAcceptOffer() {
    const token = els.guestOfferToken.value.trim();
    if (!token) return void 0;
    
    els.btnAcceptOffer.disabled = true;
    els.btnAcceptOffer.textContent = 'Processing...';
    initPeerConnection();

    try {
        await peerConnection.setRemoteDescription(JSON.parse(atob(token)));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        peerConnection.onicecandidate = (event) => {
            if (event.candidate === null) {
                els.guestAnswerToken.value = btoa(JSON.stringify(peerConnection.localDescription));
                els.btnAcceptOffer.style.display = 'none';
                els.guestReplySection.classList.remove('hidden');
            }
        };
    } catch (err) { void 0; els.btnAcceptOffer.disabled = false; }
}

// ==========================================
// 2. DATA CHANNEL & SYNC LOGIC
// ==========================================

function setupDataChannelEvents() {
    dataChannel.onopen = () => {
        if (isHost) {
            // Host controls the countdown start
            dataChannel.send(JSON.stringify({ type: 'start-countdown' }));
            startCountdown();
        }
    };

    dataChannel.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'start-countdown') {
            startCountdown();
        } 
        else if (data.type === 'code') {
            // Update opponent's read-only editor
            const scrollInfo = oppEditor.getScrollInfo();
            oppEditor.setValue(data.text);
            oppEditor.scrollTo(scrollInfo.left, scrollInfo.top);
        } 
        else if (data.type === 'progress') {
            // Update opponent's progress bar
            updateProgress('opp', data.passed);
        } 
        else if (data.type === 'win') {
            // Opponent won
            handleRaceEnd(false);
        }
        else if (data.type === 'rematch') {
            resetRaceState();
            if(isHost) {
                dataChannel.send(JSON.stringify({ type: 'start-countdown' }));
                startCountdown();
            }
        }
    };
}

// ==========================================
// 3. RACE STATE MACHINE
// ==========================================

function onConnected() {
    els.lobbyModal.classList.add('hidden');
    els.btnShowLobby.classList.add('hidden');
    
    els.raceStatusBadge.innerHTML = '<i class="fas fa-satellite-dish"></i> Peer Connected';
    els.oppPulse.classList.add('live');
    els.oppStatusText.textContent = 'Opponent is live.';
    els.oppStatusText.style.color = '#fff';
}

function onDisconnected() {
    isRaceActive = false;
    els.btnShowLobby.classList.remove('hidden');
    els.btnRunMyCode.disabled = true;
    myEditor.setOption("readOnly", true);
    
    els.raceStatusBadge.innerHTML = '<i class="fas fa-flag"></i> Connection Lost';
    els.raceStatusBadge.className = 'race-status';
    els.oppPulse.classList.remove('live');
    els.oppStatusText.textContent = 'Opponent disconnected.';
    els.oppStatusText.style.color = 'var(--text-secondary)';
}

function startCountdown() {
    els.raceOverlay.classList.remove('hidden');
    els.countdownText.classList.remove('hidden');
    els.winnerPanel.classList.add('hidden');
    
    let count = 3;
    els.countdownText.textContent = count;
    
    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            els.countdownText.textContent = count;
        } else if (count === 0) {
            els.countdownText.textContent = "GO!";
            els.countdownText.style.color = "var(--my-success)";
        } else {
            clearInterval(interval);
            els.raceOverlay.classList.add('hidden');
            els.countdownText.style.color = "#fff";
            beginRace();
        }
    }, 1000);
}

function beginRace() {
    isRaceActive = true;
    
    // Unlock editor and controls
    myEditor.setOption("readOnly", false);
    els.btnRunMyCode.disabled = false;
    
    els.raceStatusBadge.innerHTML = '<i class="fas fa-circle"></i> RACE IN PROGRESS';
    els.raceStatusBadge.className = 'race-status live';
    
    els.myConsole.innerHTML = '> Race started! Write your optimal solution and hit Run Tests.';
    myEditor.focus();
}

// Mock Test Evaluation Logic
function runLocalTests() {
    if (!isRaceActive) return;
    
    els.btnRunMyCode.disabled = true;
    els.btnRunMyCode.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Evaluating...';
    
    const code = myEditor.getValue();
    els.myConsole.innerHTML = '> Running 5 hidden test cases...<br>';
    
    setTimeout(() => {
        els.btnRunMyCode.disabled = false;
        els.btnRunMyCode.innerHTML = '<i class="fas fa-play"></i> Run Tests';
        
        // Mock Evaluation: Looking for target - nums[i] to detect Hash Map O(N) solution
        const isOptimal = code.includes('target - nums[i]') && code.includes('map.set');
        const isBruteForce = code.includes('for') && code.split('for').length > 2; // naive nested loops
        
        let passed = 0;
        
        if (isOptimal) {
            passed = 5;
            els.myConsole.innerHTML += '<span class="log-success">✓ Test 1: [2,7,11,15], target 9 -> Passed (1ms)</span><br>';
            els.myConsole.innerHTML += '<span class="log-success">✓ Test 2: [3,2,4], target 6 -> Passed (1ms)</span><br>';
            els.myConsole.innerHTML += '<span class="log-success">✓ Test 3: [3,3], target 6 -> Passed (1ms)</span><br>';
            els.myConsole.innerHTML += '<span class="log-success">✓ Test 4: Huge Array (N=10000) -> Passed (4ms)</span><br>';
            els.myConsole.innerHTML += '<span class="log-success">✓ Test 5: Negative numbers -> Passed (1ms)</span><br>';
        } else if (isBruteForce) {
            passed = 3;
            els.myConsole.innerHTML += '<span class="log-success">✓ Test 1: [2,7,11,15] -> Passed</span><br>';
            els.myConsole.innerHTML += '<span class="log-success">✓ Test 2: [3,2,4] -> Passed</span><br>';
            els.myConsole.innerHTML += '<span class="log-success">✓ Test 3: [3,3] -> Passed</span><br>';
            els.myConsole.innerHTML += '<span class="log-error">✗ Test 4: Huge Array (N=10000) -> Time Limit Exceeded (O(N²) detected)</span><br>';
        } else {
            passed = 0;
            els.myConsole.innerHTML += '<span class="log-error">✗ Syntax Error or Incorrect Implementation. Try again.</span>';
        }

        updateProgress('my', passed);
        
        // Broadcast progress to opponent
        if (dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({ type: 'progress', passed: passed }));
            
            if (passed === TOTAL_TESTS) {
                dataChannel.send(JSON.stringify({ type: 'win' }));
                handleRaceEnd(true);
            }
        }
        
    }, 800);
}

function updateProgress(player, passed) {
    const percentage = (passed / TOTAL_TESTS) * 100;
    
    if (player === 'my') {
        els.myProgress.style.width = `${percentage}%`;
        els.myProgressText.textContent = `${passed} / ${TOTAL_TESTS} Tests`;
    } else {
        els.oppProgress.style.width = `${percentage}%`;
        els.oppProgressText.textContent = `${passed} / ${TOTAL_TESTS} Tests`;
    }
}

function handleRaceEnd(didIWin) {
    isRaceActive = false;
    myEditor.setOption("readOnly", true);
    els.btnRunMyCode.disabled = true;
    els.raceStatusBadge.innerHTML = '<i class="fas fa-flag-checkered"></i> Race Finished';
    els.raceStatusBadge.className = 'race-status';

    // Show Overlay
    els.raceOverlay.classList.remove('hidden');
    els.countdownText.classList.add('hidden');
    els.winnerPanel.classList.remove('hidden');
    
    if (didIWin) {
        els.winnerPanel.className = 'winner-panel win';
        els.winnerText.textContent = "YOU WIN!";
        els.winnerSubtext.textContent = "Your algorithm was optimal and executed flawlessly.";
    } else {
        els.winnerPanel.className = 'winner-panel lose';
        els.winnerText.textContent = "OPPONENT WON!";
        els.winnerSubtext.textContent = "Your opponent solved the algorithm first.";
    }
}

function resetRaceState() {
    myEditor.setValue(INITIAL_CODE);
    oppEditor.setValue(INITIAL_CODE);
    updateProgress('my', 0);
    updateProgress('opp', 0);
    els.myConsole.innerHTML = 'System ready. Waiting for race to start...';
    
    if (dataChannel && dataChannel.readyState === 'open' && !els.raceOverlay.classList.contains('hidden') && !isHost) {
         // Guest clicked rematch
         dataChannel.send(JSON.stringify({ type: 'rematch' }));
         els.winnerSubtext.textContent = "Waiting for host to restart...";
         els.btnRematch.style.display = 'none';
    }
}
