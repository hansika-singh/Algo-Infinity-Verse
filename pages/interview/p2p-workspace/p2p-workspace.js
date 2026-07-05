/**
 * p2p-workspace.js
 * Implements a serverless WebRTC Peer-to-Peer architecture using Yjs CRDTs.
 * Handles the automatic WebRTC signaling via y-webrtc and CodeMirror syncing via y-codemirror.
 */

import * as Y from 'https://esm.sh/yjs@13.6.14';
import { WebrtcProvider } from 'https://esm.sh/y-webrtc@10.3.0';
import { CodemirrorBinding } from 'https://esm.sh/y-codemirror@1.2.1';

// --- DOM Elements ---
const els = {
    btnShareInvite: document.getElementById('btnShareInvite'),
    btnDisconnect: document.getElementById('btnDisconnect'),
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    networkBadge: document.getElementById('networkBadge'),
    
    systemLogs: document.getElementById('systemLogs'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    btnSendChat: document.getElementById('btnSendChat'),
    editorContainer: document.getElementById('editorContainer')
};

// --- App State ---
let editor;
let ydoc;
let provider;
let ychat;
let binding;

const userColors = [
    '#ffb86c', '#ff79c6', '#bd93f9', '#8be9fd', '#50fa7b', '#f1fa8c'
];

document.addEventListener("DOMContentLoaded", () => {
    initP2PWorkspace();
});

function getOrGenerateRoomId() {
    const urlParams = new URLSearchParams(window.location.search);
    let room = urlParams.get('room');
    if (!room) {
        // Generate a random room ID
        room = 'algo-p2p-' + Math.random().toString(36).substring(2, 10);
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('room', room);
        window.history.replaceState({}, '', newUrl);
    }
    return room;
}

function initP2PWorkspace() {
    const room = getOrGenerateRoomId();
    logSys(`Initializing P2P CRDT Workspace for room: ${room}`, 'sys');

    // 1. Initialize CodeMirror
    editor = CodeMirror(els.editorContainer, {
        lineNumbers: true,
        theme: 'material-ocean',
        mode: 'javascript',
        value: `// Peer-to-Peer Workspace Initialized.\n// Connecting to peers in room: ${room}\n\nfunction p2pTest() {\n    console.log("Hello CRDT WebRTC!");\n}\n`,
        indentUnit: 4,
        matchBrackets: true
    });

    // 2. Initialize Yjs and WebRTC Provider
    ydoc = new Y.Doc();
    
    // WebrtcProvider uses public signaling servers (wss://signaling.yjs.dev) by default
    provider = new WebrtcProvider(room, ydoc, {
        signaling: ['wss://signaling.yjs.dev']
    });

    const ytext = ydoc.getText('codemirror');
    ychat = ydoc.getArray('chat');

    // 3. Bind CodeMirror to Y.Text
    binding = new CodemirrorBinding(ytext, editor, provider.awareness);

    // 4. Setup Awareness (Live Cursors)
    const randomName = 'Peer-' + Math.floor(Math.random() * 10000);
    const randomColor = userColors[Math.floor(Math.random() * userColors.length)];
    provider.awareness.setLocalStateField('user', {
        name: randomName,
        color: randomColor
    });

    // Handle presence updates
    let connectedPeers = new Set();
    provider.awareness.on('change', () => {
        const states = provider.awareness.getStates();
        const currentPeers = new Set(Array.from(states.keys()));
        
        // Check for new peers
        currentPeers.forEach(clientId => {
            if (clientId !== ydoc.clientID && !connectedPeers.has(clientId)) {
                const state = states.get(clientId);
                if (state && state.user) {
                    logSys(`${state.user.name} joined the workspace.`, 'success');
                }
            }
        });
        
        // Check for left peers
        connectedPeers.forEach(clientId => {
            if (!currentPeers.has(clientId)) {
                logSys(`A peer left the workspace.`, 'error');
            }
        });
        
        connectedPeers = currentPeers;
        
        // Update connection status
        if (connectedPeers.size > 1) {
            onConnected(connectedPeers.size - 1);
        } else {
            onDisconnected();
        }
    });

    // 5. Setup Chat Sync
    ychat.observe(event => {
        // When the array changes, render the new messages
        event.changes.added.forEach(item => {
            item.content.getContent().forEach(msg => {
                renderChat(msg.sender, msg.text, msg.clientId === ydoc.clientID ? 'self' : 'peer');
            });
        });
    });

    // 6. Bind UI Events
    if (els.btnShareInvite) {
        els.btnShareInvite.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href);
            const originalText = els.btnShareInvite.innerHTML;
            els.btnShareInvite.innerHTML = '<i class="fas fa-check"></i> Copied Link!';
            setTimeout(() => {
                els.btnShareInvite.innerHTML = originalText;
            }, 2000);
        });
    }

    if (els.btnDisconnect) {
        els.btnDisconnect.addEventListener('click', disconnectP2P);
    }
    
    if (els.btnSendChat) {
        els.btnSendChat.addEventListener('click', sendChatMessage);
    }
    if (els.chatInput) {
        els.chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });
        els.chatInput.disabled = false;
        els.btnSendChat.disabled = false;
        els.chatInput.placeholder = "Send message to room...";
    }
    
    // Check for readonly mode
    const isReadonly = new URLSearchParams(window.location.search).get('readonly') === 'true';
    if (isReadonly) {
        editor.setOption('readOnly', 'nocursor');
        logSys('Joined in Read-Only Mode.', 'info');
    }
}

function logSys(msg, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    if (els.systemLogs) {
        els.systemLogs.appendChild(entry);
        els.systemLogs.scrollTop = els.systemLogs.scrollHeight;
    }
}

function sendChatMessage() {
    if (!els.chatInput) return;
    const text = els.chatInput.value.trim();
    if (!text) return;

    els.chatInput.value = '';
    
    const localState = provider.awareness.getLocalState();
    const senderName = localState?.user?.name || 'Unknown';

    // Push to Yjs Array
    ychat.push([{
        sender: senderName,
        text: text,
        clientId: ydoc.clientID,
        timestamp: Date.now()
    }]);
}

function renderChat(sender, text, type) {
    if (!els.chatMessages) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${type}`;
    msgDiv.textContent = type === 'self' ? text : `${sender}: ${text}`;
    els.chatMessages.appendChild(msgDiv);
    els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
}

function onConnected(peerCount) {
    if (els.btnDisconnect) els.btnDisconnect.classList.remove('hidden');
    
    if (els.statusDot) els.statusDot.className = 'dot online';
    if (els.statusText) {
        els.statusText.textContent = `Connected (${peerCount} Peer${peerCount > 1 ? 's' : ''})`;
        els.statusText.style.color = 'var(--p2p-primary)';
    }
    
    if (els.networkBadge) {
        els.networkBadge.className = 'network-badge online';
        els.networkBadge.innerHTML = '<i class="fas fa-wifi"></i> P2P Network: Online';
    }
}

function onDisconnected() {
    if (els.statusDot) els.statusDot.className = 'dot';
    if (els.statusText) {
        els.statusText.textContent = 'Disconnected (Waiting for peers...)';
        els.statusText.style.color = '#64748b';
    }
    
    if (els.networkBadge) {
        els.networkBadge.className = 'network-badge';
        els.networkBadge.innerHTML = '<i class="fas fa-wifi"></i> P2P Network: Offline';
    }
}

function disconnectP2P() {
    if (provider) {
        provider.disconnect();
    }
    onDisconnected();
    logSys('Manually disconnected from WebRTC network.', 'info');
    if (els.btnDisconnect) els.btnDisconnect.classList.add('hidden');
}
