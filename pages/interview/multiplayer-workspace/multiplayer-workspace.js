/**
 * multiplayer-workspace.js — v2.0
 * Collaborative Interview Room
 * Features: Real-time whiteboard (fixed), WebRTC voice chat, session timer, shared notes
 */

// ============================================================
// SOCKET & SESSION IDENTITY
// ============================================================
const socket = typeof io !== 'undefined' ? io('/') : null;
const myUserId = 'user-' + Math.floor(Math.random() * 10000);
let currentRoomId = '';

// ============================================================
// GLOBAL STATE
// ============================================================
let editor;
let wbCtx, wbCanvas;
let wbTool = 'pen';          // pen | eraser | rect | arrow | text
let wbColor = '#8b5cf6';
let wbStroke = 3;
let wbDrawing = false;
let wbStart = { x: 0, y: 0 };
let wbCurrent = { x: 0, y: 0 };
let wbHistory = [];          // array of ImageData snapshots for undo
let wbRedoStack = [];

// Session timer
let sessionSeconds = 0;
let sessionTimerInterval = null;
const SESSION_DURATION = 60 * 60; // 60 minutes

// Voice chat
let localStream = null;
let peerConnections = {};
let isMuted = false;
let isInVoice = false;
let audioContext = null;
let analyser = null;
let voiceActivityInterval = null;

// ============================================================
// DOM REFS — gathered once after DOMContentLoaded
// ============================================================
const els = {};

document.addEventListener('DOMContentLoaded', () => {
    Object.assign(els, {
        roomIdDisplay:     document.getElementById('roomIdDisplay'),
        btnCopyLink:       document.getElementById('btnCopyLink'),
        participantsList:  document.getElementById('participantsList'),
        editorContainer:   document.getElementById('editorContainer'),
        btnRunCode:        document.getElementById('btnRunCode'),
        consoleOutput:     document.getElementById('consoleOutput'),
        btnClearConsole:   document.getElementById('btnClearConsole'),
        chatInput:         document.getElementById('chatInput'),
        btnSendChat:       document.getElementById('btnSendChat'),
        chatMessages:      document.getElementById('chatMessages'),
        tabCode:           document.getElementById('tabCode'),
        tabBoard:          document.getElementById('tabBoard'),
        whiteboardContainer: document.getElementById('whiteboardContainer'),
        whiteboardCanvas:  document.getElementById('whiteboardCanvas'),
        timerDisplay:      document.getElementById('timerDisplay'),
        sessionTimer:      document.getElementById('sessionTimer'),
        btnEndSession:     document.getElementById('btnEndSession'),
        // Voice
        btnJoinVoice:      document.getElementById('btnJoinVoice'),
        btnLeaveVoice:     document.getElementById('btnLeaveVoice'),
        btnToggleMute:     document.getElementById('btnToggleMute'),
        voiceParticipants: document.getElementById('voiceParticipants'),
        audioViz:          document.getElementById('audioViz'),
        voiceStatusDot:    document.getElementById('voiceStatusDot'),
        // Notes
        notesToggle:       document.getElementById('notesToggle'),
        notesBody:         document.getElementById('notesBody'),
        sharedNotes:       document.getElementById('sharedNotes'),
        wbTabBadge: document.getElementById('wbTabBadge')
    });

    initWorkspace();
});

// ============================================================
// INIT
// ============================================================
function initWorkspace() {
    setupRoomSession();
    initEditor();
    setupEventListeners();
    setupWhiteboard();
    startSessionTimer();
    simulatePeerConnection();
}

// ============================================================
// ROOM SESSION
// ============================================================
function setupRoomSession() {
    const urlParams = new URLSearchParams(window.location.search);
    currentRoomId = urlParams.get('room') ||
        Math.random().toString(36).substring(2, 10).toUpperCase();

    window.history.replaceState({}, '', `?room=${currentRoomId}`);
    if (els.roomIdDisplay) els.roomIdDisplay.textContent = currentRoomId;

    if (socket) {
        socket.emit('join-room', currentRoomId, myUserId);

        socket.on('user-connected', (userId) => {
            appendChatMessage('System', `${userId} joined the room.`, 'system');
            addParticipant(userId.split('-')[0], userId[0].toUpperCase(), 'var(--cursor-peer1)');
        });

        socket.on('user-disconnected', (userId) => {
            appendChatMessage('System', `${userId} left the room.`, 'system');
        });

        // Receive whiteboard draw events
        socket.on('receive-draw', (data) => {
            if (!wbCtx || !wbCanvas) return;
            const scaleX = wbCanvas.width;
            const scaleY = wbCanvas.height;
            drawOnCanvas(
                data.x0 * scaleX, data.y0 * scaleY,
                data.x1 * scaleX, data.y1 * scaleY,
                data.color, data.strokeW, false, data.tool
            );
        });

        // Receive whiteboard clear
        socket.on('receive-clear', () => {
            clearWhiteboardLocal();
        });

        // Receive shared notes
        socket.on('receive-notes', (text) => {
            if (els.sharedNotes && text !== els.sharedNotes.value) {
                els.sharedNotes.value = text;
            }
        });

        // WebRTC signaling
        socket.on('voice-offer', handleVoiceOffer);
        socket.on('voice-answer', handleVoiceAnswer);
        socket.on('voice-ice', handleIceCandidate);
        socket.on('voice-user-joined', handleVoiceUserJoined);
        socket.on('voice-user-left', handleVoiceUserLeft);
    }
}

// ============================================================
// CODE EDITOR (CodeMirror)
// ============================================================
function initEditor() {
    if (typeof CodeMirror === 'undefined') return;
    editor = CodeMirror(els.editorContainer, {
        lineNumbers: true,
        theme: 'dracula',
        mode: 'javascript',
        value: `/**
 * Problem: Two Sum
 * Language: JavaScript
 * Room: ${currentRoomId}
 */

function twoSum(nums, target) {
    const map = new Map();

    for (let i = 0; i < nums.length; i++) {
        // Start typing here...
    }
}`,
        indentUnit: 4,
        matchBrackets: true,
        autoCloseBrackets: true,
        extraKeys: {
            'Ctrl-Enter': runMockEvaluation,
        }
    });
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function setupEventListeners() {
    // Copy room link
    if (els.btnCopyLink) {
        els.btnCopyLink.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                showToast('Room link copied!', 'success');
                const orig = els.btnCopyLink.innerHTML;
                els.btnCopyLink.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => els.btnCopyLink.innerHTML = orig, 2000);
            });
        });
    }

    // Run code
    if (els.btnRunCode) els.btnRunCode.addEventListener('click', runMockEvaluation);
    if (els.btnClearConsole) {
        els.btnClearConsole.addEventListener('click', () => {
            if (els.consoleOutput) els.consoleOutput.innerHTML = '';
        });
    }

    // Chat
    const sendMessage = () => {
        const text = (els.chatInput?.value || '').trim();
        if (!text) return;
        appendChatMessage('You', text, 'self');
        els.chatInput.value = '';
        if (socket) socket.emit('chat-message', { roomId: currentRoomId, text, sender: myUserId });
        if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
            setTimeout(() => appendChatMessage('Alex', "Hey! Let's solve this optimally using a Hash Map.", 'peer', '#ec4899'), 900);
        }
    };
    els.btnSendChat?.addEventListener('click', sendMessage);
    els.chatInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    // Tab switching — editor vs whiteboard
    els.tabCode?.addEventListener('click', () => switchTab('code'));
    els.tabBoard?.addEventListener('click', () => switchTab('board'));

    // End session
    els.btnEndSession?.addEventListener('click', () => {
        if (false /* confirm removed */) {
            showToast('Session ended.', 'info');
            setTimeout(() => window.location.href = 'index.html', 1200);
        }
    });

    // Voice chat buttons
    els.btnJoinVoice?.addEventListener('click', joinVoiceChat);
    els.btnLeaveVoice?.addEventListener('click', leaveVoiceChat);
    els.btnToggleMute?.addEventListener('click', toggleMute);

    // Shared notes — debounced emit
    let notesTimeout;
    els.sharedNotes?.addEventListener('input', () => {
        clearTimeout(notesTimeout);
        notesTimeout = setTimeout(() => {
            if (socket) {
                socket.emit('share-notes', {
                    roomId: currentRoomId,
                    text: els.sharedNotes.value
                });
            }
        }, 400);
    });

    // Notes panel toggle
    els.notesToggle?.addEventListener('click', () => {
        els.notesBody?.classList.toggle('open');
        const icon = els.notesToggle.querySelector('.notes-toggle-icon');
        if (icon) icon.style.transform = els.notesBody?.classList.contains('open')
            ? 'rotate(180deg)' : 'rotate(0)';
    });

    // Receive socket chat
    if (socket) {
        socket.on('chat-message', ({ text, sender }) => {
            if (sender !== myUserId) {
                appendChatMessage('Peer', text, 'peer', '#ec4899');
            }
        });
    }
}

// ============================================================
// TAB SWITCHING
// ============================================================
function switchTab(tab) {
    const isCode = tab === 'code';

    els.tabCode?.classList.toggle('active', isCode);
    els.tabBoard?.classList.toggle('active', !isCode);

    if (els.editorContainer) {
        els.editorContainer.style.display = isCode ? 'block' : 'none';
    }

    if (els.whiteboardContainer) {
        if (isCode) {
            els.whiteboardContainer.classList.remove('active');
        } else {
            els.whiteboardContainer.classList.add('active');
            if (els.wbTabBadge) els.wbTabBadge.style.display = 'none';
            // KEY FIX: resize canvas AFTER container is visible (next frame)
            requestAnimationFrame(() => {
                requestAnimationFrame(() => resizeWhiteboard());
            });
            showWhiteboardHint();
        }
    }
}
function showWhiteboardHint() {
    const seen = localStorage.getItem('algo_wb_hint_seen');
    if (seen) return; // Agar user ne pehle dekh liya hai toh dobara mat dikhao

    const wrap = document.querySelector('.wb-canvas-wrap');
    if (!wrap || document.getElementById('wb-hint-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'wb-hint-overlay';
    overlay.innerHTML = `
        <div class="wb-hint-content">
            <i class="fas fa-hand-pointer wb-hint-icon"></i>
            <h3>Interactive Whiteboard</h3>
            <p style="font-size: 0.9rem; margin-top:0;">Click and drag on the grid to start drawing.</p>
            <div class="wb-hint-tips">
                <span><i class="fas fa-pen" style="width:20px;"></i> Select tools from the top bar</span>
                <span><i class="fas fa-palette" style="width:20px;"></i> Pick colors to switch</span>
                <span><i class="fas fa-users" style="width:20px;"></i> Collaborators see it in real-time</span>
            </div>
            <button onclick="dismissWbHint()">Got it, let's draw!</button>
        </div>
    `;
    wrap.appendChild(overlay);
}

window.dismissWbHint = function() {
    const overlay = document.getElementById('wb-hint-overlay');
    if (overlay) {
        overlay.style.animation = 'fadeIn 0.3s ease reverse forwards';
        setTimeout(() => overlay.remove(), 300);
    }
    localStorage.setItem('algo_wb_hint_seen', 'true');
};
// ============================================================
// WHITEBOARD — full rewrite with tool support & undo
// ============================================================
function setupWhiteboard() {
    wbCanvas = els.whiteboardCanvas;
    if (!wbCanvas) return;
    wbCtx = wbCanvas.getContext('2d');

    setupWbToolbar();
    setupWbDrawing();

    window.addEventListener('resize', () => {
        if (els.whiteboardContainer?.classList.contains('active')) {
            resizeWhiteboard();
        }
    });
}

function resizeWhiteboard() {
    if (!wbCanvas || !wbCtx) return;
    const wrap = wbCanvas.parentElement;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Save current drawing
    const imageData = wbCtx.getImageData(0, 0, wbCanvas.width, wbCanvas.height);
    wbCanvas.width  = rect.width;
    wbCanvas.height = rect.height;
    // Restore
    wbCtx.putImageData(imageData, 0, 0);
}

function setupWbToolbar() {
    // Tool buttons
    document.querySelectorAll('.wb-tool[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.wb-tool[data-tool]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            wbTool = btn.dataset.tool;
            if (wbCanvas) {
                wbCanvas.classList.toggle('eraser-cursor', wbTool === 'eraser');
            }
        });
    });

    // Color swatches
    document.querySelectorAll('.wb-color').forEach(swatch => {
        swatch.addEventListener('click', () => {
            document.querySelectorAll('.wb-color').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            wbColor = swatch.dataset.color;
            if (wbTool === 'eraser') {
                // Switch back to pen when picking a color
                wbTool = 'pen';
                document.querySelector('.wb-tool[data-tool="pen"]')?.click();
            }
        });
    });

    // Stroke size
    document.querySelectorAll('.wb-stroke-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.wb-stroke-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            wbStroke = parseInt(btn.dataset.size, 10);
        });
    });

    // Undo / Redo
    document.getElementById('btnWbUndo')?.addEventListener('click', wbUndo);
    document.getElementById('btnWbRedo')?.addEventListener('click', wbRedo);
    document.getElementById('btnWbClear')?.addEventListener('click', () => {
        if (false /* confirm removed */) {
            clearWhiteboardLocal();
            socket?.emit('clear-board', { roomId: currentRoomId });
        }
    });
}

function wbSaveState() {
    if (!wbCtx || !wbCanvas) return;
    wbHistory.push(wbCtx.getImageData(0, 0, wbCanvas.width, wbCanvas.height));
    if (wbHistory.length > 30) wbHistory.shift();
    wbRedoStack = [];
}

function wbUndo() {
    if (!wbHistory.length || !wbCtx || !wbCanvas) return;
    wbRedoStack.push(wbCtx.getImageData(0, 0, wbCanvas.width, wbCanvas.height));
    wbCtx.putImageData(wbHistory.pop(), 0, 0);
}

function wbRedo() {
    if (!wbRedoStack.length || !wbCtx || !wbCanvas) return;
    wbHistory.push(wbCtx.getImageData(0, 0, wbCanvas.width, wbCanvas.height));
    wbCtx.putImageData(wbRedoStack.pop(), 0, 0);
}

function clearWhiteboardLocal() {
    if (!wbCtx || !wbCanvas) return;
    wbSaveState();
    wbCtx.clearRect(0, 0, wbCanvas.width, wbCanvas.height);
}

function setupWbDrawing() {
    if (!wbCanvas) return;

    // ── Pointer events (works for mouse & touch) ──
    wbCanvas.addEventListener('pointerdown', (e) => {
        wbCanvas.setPointerCapture(e.pointerId);
        wbSaveState();
        wbDrawing = true;
        const pos = getCanvasPos(e);
        wbStart   = { ...pos };
        wbCurrent = { ...pos };

        if (wbTool === 'pen' || wbTool === 'eraser') {
            wbCtx.beginPath();
            wbCtx.moveTo(pos.x, pos.y);
        }
    });

    wbCanvas.addEventListener('pointermove', (e) => {
        if (!wbDrawing) return;
        const pos = getCanvasPos(e);

        if (wbTool === 'pen' || wbTool === 'eraser') {
            drawOnCanvas(wbCurrent.x, wbCurrent.y, pos.x, pos.y, wbColor, wbStroke, true, wbTool);
            wbCurrent = { ...pos };
        } else {
            // For shapes, redraw on temp — restore last saved state first
            if (wbHistory.length) {
                wbCtx.putImageData(wbHistory[wbHistory.length - 1], 0, 0);
            }
            drawShapePreview(wbStart.x, wbStart.y, pos.x, pos.y);
        }
    });

    wbCanvas.addEventListener('pointerup', (e) => {
        if (!wbDrawing) return;
        wbDrawing = false;
        const pos = getCanvasPos(e);

        if (wbTool === 'rect' || wbTool === 'arrow' || wbTool === 'line') {
            drawShapePreview(wbStart.x, wbStart.y, pos.x, pos.y);
            // Emit final shape
            emitWbEvent(wbStart.x, wbStart.y, pos.x, pos.y);
        }
    });

    wbCanvas.addEventListener('pointercancel', () => { wbDrawing = false; });
}

function getCanvasPos(e) {
    const r = wbCanvas.getBoundingClientRect();
    return {
        x: (e.clientX - r.left) * (wbCanvas.width  / r.width),
        y: (e.clientY - r.top)  * (wbCanvas.height / r.height),
    };
}

function drawOnCanvas(x0, y0, x1, y1, color, strokeW, emit, tool) {
    if (!wbCtx) return;

    if (tool === 'eraser') {
        wbCtx.save();
        wbCtx.globalCompositeOperation = 'destination-out';
        wbCtx.lineWidth = strokeW * 6;
        wbCtx.lineCap = 'round';
        wbCtx.beginPath();
        wbCtx.moveTo(x0, y0);
        wbCtx.lineTo(x1, y1);
        wbCtx.stroke();
        wbCtx.restore();
    } else {
        wbCtx.strokeStyle = color;
        wbCtx.lineWidth  = strokeW;
        wbCtx.lineCap    = 'round';
        wbCtx.lineJoin   = 'round';
        wbCtx.beginPath();
        wbCtx.moveTo(x0, y0);
        wbCtx.lineTo(x1, y1);
        wbCtx.stroke();
    }

    if (emit && socket && currentRoomId) {
        emitWbEvent(x0, y0, x1, y1);
    }
}

function drawShapePreview(x0, y0, x1, y1) {
    if (!wbCtx) return;
    wbCtx.strokeStyle = wbColor;
    wbCtx.lineWidth   = wbStroke;
    wbCtx.lineCap     = 'round';

    if (wbTool === 'rect') {
        wbCtx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    } else if (wbTool === 'arrow' || wbTool === 'line') {
        wbCtx.beginPath();
        wbCtx.moveTo(x0, y0);
        wbCtx.lineTo(x1, y1);
        wbCtx.stroke();

        if (wbTool === 'arrow') {
            // Arrowhead
            const angle = Math.atan2(y1 - y0, x1 - x0);
            const headLen = 14;
            wbCtx.beginPath();
            wbCtx.moveTo(x1, y1);
            wbCtx.lineTo(x1 - headLen * Math.cos(angle - Math.PI / 6), y1 - headLen * Math.sin(angle - Math.PI / 6));
            wbCtx.moveTo(x1, y1);
            wbCtx.lineTo(x1 - headLen * Math.cos(angle + Math.PI / 6), y1 - headLen * Math.sin(angle + Math.PI / 6));
            wbCtx.stroke();
        }
    }
}

function emitWbEvent(x0, y0, x1, y1) {
    if (!socket || !currentRoomId || !wbCanvas) return;
    socket.emit('draw', {
        roomId: currentRoomId,
        x0: x0 / wbCanvas.width,
        y0: y0 / wbCanvas.height,
        x1: x1 / wbCanvas.width,
        y1: y1 / wbCanvas.height,
        color: wbColor,
        strokeW: wbStroke,
        tool: wbTool,
    });
}

// ============================================================
// SESSION TIMER
// ============================================================
function startSessionTimer() {
    if (!els.timerDisplay) return;
    sessionTimerInterval = setInterval(() => {
        sessionSeconds++;
        const remaining = SESSION_DURATION - sessionSeconds;
        if (remaining <= 0) {
            clearInterval(sessionTimerInterval);
            showToast('Interview session time is up!', 'error');
            return;
        }
        const h = Math.floor(remaining / 3600);
        const m = Math.floor((remaining % 3600) / 60);
        const s = remaining % 60;
        els.timerDisplay.textContent = h > 0
            ? `${pad(h)}:${pad(m)}:${pad(s)}`
            : `${pad(m)}:${pad(s)}`;

        // Visual warnings
        if (els.sessionTimer) {
            els.sessionTimer.classList.remove('warning', 'critical');
            if (remaining <= 300) els.sessionTimer.classList.add('critical');
            else if (remaining <= 600) els.sessionTimer.classList.add('warning');
        }
    }, 1000);
}

function pad(n) { return String(n).padStart(2, '0'); }

// ============================================================
// VOICE CHAT (WebRTC)
// ============================================================
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

async function joinVoiceChat() {
    if (isInVoice) return;
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        isInVoice = true;
        isMuted = false;

        updateVoiceUI(true);
        setupAudioVisualizer(localStream);
        addVoiceParticipant('You', myUserId, true);

        if (socket) socket.emit('voice-join', { roomId: currentRoomId, userId: myUserId });
        showToast('Joined voice chat', 'success');
    } catch (err) {
        showToast('Microphone access denied', 'error');
        console.error('Voice chat error:', err);
    }
}

function leaveVoiceChat() {
    if (!isInVoice) return;
    localStream?.getTracks().forEach(t => t.stop());
    localStream = null;

    Object.values(peerConnections).forEach(pc => pc.close());
    peerConnections = {};

    clearInterval(voiceActivityInterval);
    if (audioContext) { audioContext.close(); audioContext = null; }

    isInVoice = false;
    updateVoiceUI(false);
    if (els.voiceParticipants) els.voiceParticipants.innerHTML = '';
    if (socket) socket.emit('voice-leave', { roomId: currentRoomId, userId: myUserId });
    showToast('Left voice chat', 'info');
}

function toggleMute() {
    if (!localStream) return;
    isMuted = !isMuted;
    localStream.getAudioTracks().forEach(t => { t.enabled = !isMuted; });

    if (els.btnToggleMute) {
        els.btnToggleMute.innerHTML = isMuted
            ? '<i class="fas fa-microphone-slash"></i> Unmute'
            : '<i class="fas fa-microphone"></i> Mute';
        els.btnToggleMute.classList.toggle('muted', isMuted);
    }

    // Pause visualizer when muted
    if (els.audioViz) els.audioViz.classList.toggle('active', !isMuted);
    showToast(isMuted ? 'Muted' : 'Unmuted', 'info');
}

function updateVoiceUI(joined) {
    if (els.btnJoinVoice)  els.btnJoinVoice.style.display  = joined ? 'none' : 'inline-flex';
    if (els.btnLeaveVoice) els.btnLeaveVoice.style.display = joined ? 'inline-flex' : 'none';
    if (els.btnToggleMute) els.btnToggleMute.style.display = joined ? 'inline-flex' : 'none';
    if (els.voiceStatusDot) els.voiceStatusDot.className = 'voice-status-dot' + (joined ? ' connected' : '');
}

function addVoiceParticipant(name, id, isMe) {
    if (!els.voiceParticipants) return;
    const el = document.createElement('div');
    el.className = 'voice-participant';
    el.id = 'vp-' + id;
    el.innerHTML = `<div class="vp-dot"></div><span>${name}${isMe ? ' (You)' : ''}</span>`;
    els.voiceParticipants.appendChild(el);
}

function removeVoiceParticipant(id) {
    document.getElementById('vp-' + id)?.remove();
}

function setupAudioVisualizer(stream) {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 32;
        const src = audioContext.createMediaStreamSource(stream);
        src.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);
        const bars = els.audioViz?.querySelectorAll('.audio-bar');

        voiceActivityInterval = setInterval(() => {
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            const isSpeaking = avg > 20 && !isMuted;

            // Update participant dot
            const myVp = document.getElementById('vp-' + myUserId);
            if (myVp) myVp.classList.toggle('speaking', isSpeaking);
            if (els.voiceStatusDot) {
                els.voiceStatusDot.className = 'voice-status-dot ' + (isSpeaking ? 'speaking' : 'connected');
            }

            // Animate bars
            if (bars && isSpeaking) {
                bars.forEach((bar, i) => {
                    const h = Math.max(4, Math.min(18, (data[i * 2] || 0) / 14));
                    bar.style.height = h + 'px';
                });
            }
        }, 100);

        if (els.audioViz) els.audioViz.classList.add('active');
    } catch (e) {
        console.warn('Audio visualizer not available:', e);
    }
}

// ── WebRTC signaling handlers ──
async function handleVoiceUserJoined({ userId }) {
    addVoiceParticipant('Peer', userId, false);
    if (!localStream) return;
    const pc = createPeerConnection(userId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('voice-offer', { roomId: currentRoomId, offer, to: userId, from: myUserId });
}

async function handleVoiceOffer({ offer, from }) {
    addVoiceParticipant('Peer', from, false);
    const pc = createPeerConnection(from);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('voice-answer', { roomId: currentRoomId, answer, to: from, from: myUserId });
}

async function handleVoiceAnswer({ answer, from }) {
    const pc = peerConnections[from];
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

async function handleIceCandidate({ candidate, from }) {
    const pc = peerConnections[from];
    if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
}

function handleVoiceUserLeft({ userId }) {
    peerConnections[userId]?.close();
    delete peerConnections[userId];
    removeVoiceParticipant(userId);
}

function createPeerConnection(peerId) {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections[peerId] = pc;

    localStream?.getTracks().forEach(t => pc.addTrack(t, localStream));

    pc.onicecandidate = (e) => {
        if (e.candidate && socket) {
            socket.emit('voice-ice', { roomId: currentRoomId, candidate: e.candidate, to: peerId, from: myUserId });
        }
    };

    pc.ontrack = (e) => {
        const audio = document.createElement('audio');
        audio.srcObject = e.streams[0];
        audio.autoplay = true;
        audio.style.display = 'none';
        document.body.appendChild(audio);
    };

    return pc;
}

// ============================================================
// CHAT HELPERS
// ============================================================
function appendChatMessage(sender, text, type, color = '') {
    if (!els.chatMessages) return;
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    
    if (type === 'peer') {
        const nameEl = document.createElement('div');
        nameEl.className = 'peer-name';
        nameEl.style.color = color;
        nameEl.textContent = sender; // Use textContent for safety
        div.appendChild(nameEl);
        div.appendChild(document.createTextNode(text)); // Plain text
    } else {
        div.textContent = text; // Plain text
    }
    els.chatMessages.appendChild(div);
    els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
}

function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ============================================================
// CODE RUNNER (mock evaluation)
// ============================================================
function runMockEvaluation() {
    if (!els.consoleOutput || !editor) return;
    els.consoleOutput.innerHTML = `<span class="info">> Executing solution...</span>\n`;

    setTimeout(() => {
        const code = editor.getValue();
        const hasComplement = code.includes('target - nums[i]') || code.includes('nums[i] - target');
        const hasMap = code.includes('map.set') || code.includes('Map()');

        if (hasComplement && hasMap) {
            els.consoleOutput.innerHTML +=
                `<span class="success">✓ Test Case 1 Passed  (Output: [0, 1])</span>\n` +
                `<span class="success">✓ Test Case 2 Passed  (Output: [1, 2])</span>\n` +
                `<span class="success">✓ Test Case 3 Passed  (Output: [0, 1])</span>\n` +
                `\n<span class="success">✅ All tests passed! O(n) optimal solution detected.</span>`;
        } else {
            els.consoleOutput.innerHTML +=
                `<span class="error">✗ Test Case 1 Failed</span>\n` +
                `<span class="error">  Hint: Try using a HashMap to track complements.</span>`;
        }
    }, 700);
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3100);
}

// ============================================================
// PARTICIPANTS UI
// ============================================================
function addParticipant(name, initial, color) {
    if (!els.participantsList) return;
    const avatar = document.createElement('div');
    avatar.className = 'avatar peer-avatar';
    avatar.title = name;
    avatar.textContent = initial;
    avatar.style.backgroundColor = color;
    els.participantsList.appendChild(avatar);
}

// ============================================================
// REMOTE CURSOR (CodeMirror bookmark)
// ============================================================
let remoteCursorBookmark = null;

function simulateRemoteCursor(name, color, pos) {
    if (!editor) return;
    remoteCursorBookmark?.clear();
    const cursorEl = document.createElement('div');
    cursorEl.className = 'remote-cursor-widget';
    cursorEl.style.borderColor = color;
    cursorEl.style.height = '1.2em';
    const nameEl = document.createElement('div');
    nameEl.className = 'remote-cursor-name';
    nameEl.style.backgroundColor = color;
    nameEl.textContent = name;
    cursorEl.appendChild(nameEl);
    remoteCursorBookmark = editor.setBookmark(pos, { widget: cursorEl, insertLeft: true });
}

function simulateRemoteTyping(text, startPos) {
    let pos = { ...startPos }; let i = 0;
    const type = () => {
        if (i >= text.length) {
            setTimeout(() => {
                remoteCursorBookmark?.widgetNode?.querySelector('.remote-cursor-name')
                    ?.style?.setProperty('display', 'none');
            }, 1200);
            return;
        }
        const ch = text[i];
        editor.replaceRange(ch, pos, pos, '*remote');
        if (ch === '\n') { pos.line += 1; pos.ch = 0; }
        else { pos.ch += 1; }
        simulateRemoteCursor('Alex', 'var(--cursor-peer1)', pos);
        i++;
        setTimeout(type, 75 + Math.random() * 90);
    };
    type();
}

// ============================================================
// MULTIPLAYER SIMULATION (demo on load)
// ============================================================
function simulatePeerConnection() {
    setTimeout(() => {
        addParticipant('Alex', 'A', 'var(--cursor-peer1)');
        appendChatMessage('System', 'Alex joined the room.', 'system');
        addVoiceParticipant('Alex', 'user-alex', false);

        setTimeout(() => {
            simulateRemoteCursor('Alex', 'var(--cursor-peer1)', { line: 9, ch: 8 });
            simulateRemoteTyping('const complement = target - nums[i];\n        ', { line: 9, ch: 8 });
            appendChatMessage('Alex', "I'll start filling in the loop logic.", 'peer', '#ec4899');
        }, 1800);
    }, 3000);
}