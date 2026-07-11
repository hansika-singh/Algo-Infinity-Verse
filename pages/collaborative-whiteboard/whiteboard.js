/**
 * whiteboard.js
 * Core logic for the Real-time Collaborative Whiteboard
 */

// ==========================================
// GLOBALS & CONFIG
// ==========================================
let socket;
let roomId = '';
let myUserId = '';
let myUserName = '';
let myColor = '';

// Canvas
let canvas, ctx, tempCanvas, tempCtx;
let isDrawing = false;
let currentTool = 'pen';
let currentColor = '#8b5cf6';
let currentStroke = 4;
let startX = 0, startY = 0;

// State & Undo/Redo Stack
const MAX_HISTORY = 50;
let undoStack = [];
let redoStack = [];

// Socket batching
let strokeBatch = [];
let strokeEmitTimer = null;
const STROKE_EMIT_INTERVAL = 16; // ~60fps

// Remote cursors & users
const remoteUsers = new Map(); // userId -> { name, color, lastX, lastY }
const cursorOverlay = document.getElementById('remoteCursorsOverlay');

// Text tool state
const textOverlay = document.getElementById('textInputOverlay');
const textInput = document.getElementById('canvasTextInput');
let textActive = false;
let textPos = { x: 0, y: 0 };

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    initRoom();
    initCanvas();
    setupUI();
    
    // Wait for auth to settle to grab name, otherwise guest
    setTimeout(initSocket, 500); 
});

function initRoom() {
    const urlParams = new URLSearchParams(window.location.search);
    let urlRoom = urlParams.get('room');
    
    if (!urlRoom) {
        urlRoom = Math.random().toString(36).substring(2, 10).toUpperCase();
        window.history.replaceState({}, '', `?room=${urlRoom}`);
    }
    roomId = urlRoom;
    document.getElementById('roomIdDisplay').textContent = roomId;
    
    // Identity
    const session = typeof getSession === 'function' ? getSession() : null;
    myUserId = session?.userId || 'guest-' + Math.floor(Math.random() * 10000);
    myUserName = session?.name || 'Guest ' + myUserId.slice(-4);
    
    // Pick random color from palette if not set
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
    myColor = colors[Math.floor(Math.random() * colors.length)];
}

function initCanvas() {
    canvas = document.getElementById('whiteboardCanvas');
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    tempCanvas = document.getElementById('tempCanvas');
    tempCtx = tempCanvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initial clear background
    ctx.fillStyle = '#0f172a'; // Match CSS --wb-bg
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
    
    // Pointer Events
    const container = document.getElementById('canvasContainer');
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);
    container.addEventListener('pointerout', (e) => {
        // Only trigger up if it really left the container
        if (e.target === container) onPointerUp(e);
    });
}

function resizeCanvas() {
    const container = document.getElementById('canvasContainer');
    const rect = container.getBoundingClientRect();
    
    // Save state before resize to restore
    const saved = ctx ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    tempCanvas.width = rect.width;
    tempCanvas.height = rect.height;
    
    if (saved) {
        ctx.putImageData(saved, 0, 0);
    } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// ==========================================
// SOCKET.IO LOGIC
// ==========================================
function initSocket() {
    if (typeof io === 'undefined') {
        console.error('Socket.io script not loaded');
        return;
    }
    
    socket = io('/');
    
    socket.on('connect', () => {
        const el = document.getElementById('connectionStatus');
        el.className = 'connection-status connected';
        el.querySelector('.status-text').textContent = 'Connected';
        
        socket.emit('wb-join', {
            roomId,
            userId: myUserId,
            userName: myUserName,
            color: myColor
        });
    });
    
    socket.on('disconnect', () => {
        const el = document.getElementById('connectionStatus');
        el.className = 'connection-status connecting';
        el.querySelector('.status-text').textContent = 'Disconnected';
    });
    
    // User joined/left
    socket.on('wb-user-joined', (data) => {
        if (data.userId === myUserId) return;
        remoteUsers.set(data.userId, { name: data.userName, color: data.color });
        updatePresenceUI();
        
        // I am an existing user, send my canvas state to the new user to sync
        if (undoStack.length > 1) {
            const dataUrl = canvas.toDataURL('image/png');
            socket.emit('wb-undo', { roomId, imageData: dataUrl });
        }
    });
    
    socket.on('wb-user-left', (data) => {
        remoteUsers.delete(data.userId);
        updatePresenceUI();
        removeRemoteCursor(data.userId);
    });
    
    // Drawing events
    socket.on('wb-stroke', (data) => {
        drawStrokeBatch(data.points, data.color, data.size, data.tool);
    });
    
    socket.on('wb-shape', (data) => {
        drawShape(ctx, data.shape, data.x0, data.y0, data.x1, data.y1, data.color, data.size);
        saveState();
    });
    
    socket.on('wb-text', (data) => {
        drawText(ctx, data.text, data.x, data.y, data.color, data.fontSize);
        saveState();
    });
    
    socket.on('wb-clear', () => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveState();
    });
    
    socket.on('wb-undo', (data) => {
        if (!data.imageData) return;
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            saveState(); // Update local stack
        };
        img.src = data.imageData;
    });
    
    socket.on('wb-cursor', (data) => {
        if (data.userId === myUserId) return;
        updateRemoteCursor(data.userId, data.userName, data.x, data.y, data.color);
    });
}

// ==========================================
// DRAWING ENGINE
// ==========================================
function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function onPointerDown(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return; // only left click
    const pos = getPointerPos(e);
    
    if (currentTool === 'text') {
        activateTextTool(pos.x, pos.y);
        return;
    }
    
    isDrawing = true;
    startX = pos.x;
    startY = pos.y;
    
    if (currentTool === 'pen' || currentTool === 'eraser') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        strokeBatch = [{ x: startX / canvas.width, y: startY / canvas.height }];
        
        // Start emit interval
        if (strokeEmitTimer) clearInterval(strokeEmitTimer);
        strokeEmitTimer = setInterval(emitStrokeBatch, STROKE_EMIT_INTERVAL);
    }
}

function onPointerMove(e) {
    const pos = getPointerPos(e);
    
    // Broadcast live cursor (throttled)
    emitCursor(pos.x, pos.y);
    
    if (!isDrawing) return;
    
    if (currentTool === 'pen' || currentTool === 'eraser') {
        const isEraser = currentTool === 'eraser';
        ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = isEraser ? currentStroke * 3 : currentStroke; // Eraser is bigger
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        
        strokeBatch.push({ x: pos.x / canvas.width, y: pos.y / canvas.height });
    } else {
        // Shapes preview on temp canvas
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        drawShape(tempCtx, currentTool, startX, startY, pos.x, pos.y, currentColor, currentStroke);
    }
}

function onPointerUp(e) {
    if (!isDrawing) return;
    isDrawing = false;
    
    const pos = getPointerPos(e);
    
    if (currentTool === 'pen' || currentTool === 'eraser') {
        clearInterval(strokeEmitTimer);
        emitStrokeBatch(); // emit remaining
        ctx.globalCompositeOperation = 'source-over';
        saveState();
    } else {
        // Finalize shape
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        drawShape(ctx, currentTool, startX, startY, pos.x, pos.y, currentColor, currentStroke);
        
        if (socket && roomId) {
            socket.emit('wb-shape', {
                roomId,
                shape: currentTool,
                x0: startX / canvas.width, y0: startY / canvas.height,
                x1: pos.x / canvas.width, y1: pos.y / canvas.height,
                color: currentColor,
                size: currentStroke
            });
        }
        saveState();
    }
}

function drawShape(targetCtx, shape, x0, y0, x1, y1, color, size) {
    // If coordinates are normalized (0-1), scale them up
    if (x0 <= 1 && y0 <= 1 && x1 <= 1 && y1 <= 1 && (x0 > 0 || y0 > 0)) {
        x0 *= canvas.width; y0 *= canvas.height;
        x1 *= canvas.width; y1 *= canvas.height;
    }
    
    targetCtx.strokeStyle = color;
    targetCtx.lineWidth = size;
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';
    targetCtx.beginPath();
    
    if (shape === 'rect') {
        targetCtx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    } 
    else if (shape === 'circle') {
        const radius = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
        targetCtx.arc(x0, y0, radius, 0, 2 * Math.PI);
        targetCtx.stroke();
    }
    else if (shape === 'line') {
        targetCtx.moveTo(x0, y0);
        targetCtx.lineTo(x1, y1);
        targetCtx.stroke();
    }
    else if (shape === 'arrow') {
        targetCtx.moveTo(x0, y0);
        targetCtx.lineTo(x1, y1);
        targetCtx.stroke();
        
        // Arrow head
        const angle = Math.atan2(y1 - y0, x1 - x0);
        const headLen = size * 3 + 10;
        targetCtx.beginPath();
        targetCtx.moveTo(x1, y1);
        targetCtx.lineTo(x1 - headLen * Math.cos(angle - Math.PI / 6), y1 - headLen * Math.sin(angle - Math.PI / 6));
        targetCtx.moveTo(x1, y1);
        targetCtx.lineTo(x1 - headLen * Math.cos(angle + Math.PI / 6), y1 - headLen * Math.sin(angle + Math.PI / 6));
        targetCtx.stroke();
    }
}

function drawStrokeBatch(points, color, size, tool) {
    if (!points || points.length === 0) return;
    
    const isEraser = tool === 'eraser';
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = isEraser ? size * 3 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(points[0].x * canvas.width, points[0].y * canvas.height);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * canvas.width, points[i].y * canvas.height);
    }
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    saveState();
}

// ==========================================
// TEXT TOOL
// ==========================================
function activateTextTool(x, y) {
    if (textActive) commitText();
    
    textPos = { x, y };
    textActive = true;
    
    textOverlay.classList.remove('hidden');
    textOverlay.style.left = x + 'px';
    textOverlay.style.top = (y - 14) + 'px'; // Adjust for font size
    
    textInput.style.color = currentColor;
    textInput.style.fontSize = Math.max(16, currentStroke * 4) + 'px';
    textInput.value = '';
    
    setTimeout(() => textInput.focus(), 10);
}

function commitText() {
    if (!textActive) return;
    textActive = false;
    textOverlay.classList.add('hidden');
    
    const text = textInput.value.trim();
    if (!text) return;
    
    const fontSize = Math.max(16, currentStroke * 4);
    drawText(ctx, text, textPos.x, textPos.y, currentColor, fontSize);
    saveState();
    
    if (socket && roomId) {
        socket.emit('wb-text', {
            roomId,
            text,
            x: textPos.x / canvas.width,
            y: textPos.y / canvas.height,
            color: currentColor,
            fontSize
        });
    }
}

function drawText(targetCtx, text, x, y, color, fontSize) {
    if (x <= 1 && y <= 1 && (x > 0 || y > 0)) {
        x *= canvas.width; y *= canvas.height;
    }
    targetCtx.font = `${fontSize}px "Poppins", sans-serif`;
    targetCtx.fillStyle = color;
    targetCtx.textBaseline = 'middle';
    targetCtx.fillText(text, x, y);
}

// ==========================================
// EMITTERS & CURSORS
// ==========================================
function emitStrokeBatch() {
    if (strokeBatch.length < 2) return;
    
    if (socket && roomId) {
        socket.emit('wb-stroke', {
            roomId,
            points: strokeBatch,
            color: currentColor,
            size: currentStroke,
            tool: currentTool
        });
    }
    
    // Keep last point to connect next batch seamlessly
    strokeBatch = [strokeBatch[strokeBatch.length - 1]];
}

let lastCursorEmit = 0;
function emitCursor(x, y) {
    const now = Date.now();
    if (now - lastCursorEmit < 50) return; // Throttled to 20fps
    lastCursorEmit = now;
    
    if (socket && roomId) {
        socket.emit('wb-cursor', {
            roomId,
            userId: myUserId,
            userName: myUserName,
            x: x / canvas.width,
            y: y / canvas.height,
            color: myColor
        });
    }
}

function updateRemoteCursor(userId, name, x, y, color) {
    const actualX = x * canvas.width;
    const actualY = y * canvas.height;
    
    let el = document.getElementById('cursor-' + userId);
    if (!el) {
        el = document.createElement('div');
        el.id = 'cursor-' + userId;
        el.className = 'remote-cursor';
        el.innerHTML = `
            <svg class="remote-cursor-icon" width="16" height="16" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5">
                <path d="M3 3l7 19 3-7 7-3z"/>
            </svg>
            <div class="remote-cursor-label" style="background-color: ${color}">${name}</div>
        `;
        cursorOverlay.appendChild(el);
    }
    el.style.transform = `translate(${actualX}px, ${actualY}px)`;
    
    // Cleanup if dead for 5s
    if (el.timeoutId) clearTimeout(el.timeoutId);
    el.timeoutId = setTimeout(() => {
        el.remove();
    }, 5000);
}

function removeRemoteCursor(userId) {
    const el = document.getElementById('cursor-' + userId);
    if (el) el.remove();
}

// ==========================================
// HISTORY & UNDO
// ==========================================
function saveState() {
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack = [];
}

function handleUndo() {
    if (undoStack.length <= 1) return; // Keep at least the blank background
    redoStack.push(undoStack.pop());
    const prev = undoStack[undoStack.length - 1];
    ctx.putImageData(prev, 0, 0);
    
    if (socket && roomId) {
        socket.emit('wb-undo', { roomId, imageData: canvas.toDataURL('image/png') });
    }
}

function handleRedo() {
    if (redoStack.length === 0) return;
    const next = redoStack.pop();
    undoStack.push(next);
    ctx.putImageData(next, 0, 0);
    
    if (socket && roomId) {
        socket.emit('wb-undo', { roomId, imageData: canvas.toDataURL('image/png') });
    }
}

// ==========================================
// UI & EVENTS
// ==========================================
function setupUI() {
    // Toolbar Tools
    document.querySelectorAll('.wb-tool').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.wb-tool').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
            
            const cont = document.getElementById('canvasContainer');
            cont.className = 'wb-canvas-container'; // reset
            if (currentTool === 'eraser') cont.classList.add('eraser-mode');
            if (currentTool === 'text') cont.classList.add('text-mode');
        });
    });
    
    // Color Palette
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            currentColor = swatch.dataset.color;
            if (currentTool === 'eraser') {
                document.querySelector('[data-tool="pen"]').click(); // Auto switch to pen
            }
        });
    });
    
    // Custom Color picker
    const cp = document.getElementById('customColorPicker');
    cp.addEventListener('input', (e) => {
        currentColor = e.target.value;
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        if (currentTool === 'eraser') document.querySelector('[data-tool="pen"]').click();
    });
    
    // Stroke Slider
    const slider = document.getElementById('strokeSlider');
    const display = document.getElementById('strokeSizeVal');
    slider.addEventListener('input', (e) => {
        currentStroke = parseInt(e.target.value);
        display.textContent = currentStroke;
    });
    
    // Actions
    document.getElementById('btnUndo').addEventListener('click', handleUndo);
    document.getElementById('btnRedo').addEventListener('click', handleRedo);
    
    // Text commit
    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') commitText();
    });
    textInput.addEventListener('blur', commitText);
    
    // Copy link
    document.getElementById('btnCopyLink').addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href);
        const icon = document.querySelector('#btnCopyLink i');
        icon.className = 'fas fa-check';
        setTimeout(() => icon.className = 'fas fa-link', 2000);
    });
    
    // Export PNG
    document.getElementById('btnExport').addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `whiteboard-${roomId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
    
    // Clear Modal
    const modal = document.getElementById('clearModal');
    document.getElementById('btnClear').addEventListener('click', () => {
        modal.classList.remove('hidden');
    });
    document.getElementById('btnCancelClear').addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    document.getElementById('btnConfirmClear').addEventListener('click', () => {
        modal.classList.add('hidden');
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveState();
        if (socket && roomId) {
            socket.emit('wb-clear', { roomId });
        }
    });
    
    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        if (textActive) return; // Don't trigger tools while typing
        
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') { e.preventDefault(); handleUndo(); }
            if (e.key === 'y') { e.preventDefault(); handleRedo(); }
        } else {
            switch(e.key.toLowerCase()) {
                case 'p': document.querySelector('[data-tool="pen"]')?.click(); break;
                case 'e': document.querySelector('[data-tool="eraser"]')?.click(); break;
                case 't': document.querySelector('[data-tool="text"]')?.click(); break;
                case 'r': document.querySelector('[data-tool="rect"]')?.click(); break;
                case 'c': document.querySelector('[data-tool="circle"]')?.click(); break;
                case 'l': document.querySelector('[data-tool="line"]')?.click(); break;
                case 'a': document.querySelector('[data-tool="arrow"]')?.click(); break;
            }
        }
    });
}

function updatePresenceUI() {
    const container = document.getElementById('presenceAvatars');
    container.innerHTML = '';
    
    // Add self
    addAvatar(myUserId, myUserName, myColor, true);
    
    // Add remotes
    remoteUsers.forEach((data, uId) => {
        addAvatar(uId, data.name, data.color, false);
    });
    
    const count = remoteUsers.size + 1;
    document.querySelector('.status-text').textContent = count + (count === 1 ? ' User' : ' Users');
}

function addAvatar(uId, name, color, isSelf) {
    const container = document.getElementById('presenceAvatars');
    const el = document.createElement('div');
    el.className = 'presence-avatar tooltip';
    el.style.backgroundColor = color;
    
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    el.textContent = initials;
    
    const tt = document.createElement('span');
    tt.className = 'tooltip-text';
    tt.textContent = name + (isSelf ? ' (You)' : '');
    tt.style.top = '100%'; tt.style.marginTop = '8px';
    
    el.appendChild(tt);
    container.appendChild(el);
}
