/**
 * crdt-whiteboard.js
 * Implements a Multi-player Drag-and-Drop Whiteboard using Yjs and WebRTC.
 * ES Modules are used to import Yjs libraries directly from CDN.
 */

import * as Y from 'https://esm.sh/yjs@13.6.1';
import { WebrtcProvider } from 'https://esm.sh/y-webrtc@10.3.0';

// ==========================================
// 1. STATE & CRDT INITIALIZATION
// ==========================================

// Parse or generate Room ID
const urlParams = new URLSearchParams(window.location.search);
let roomName = urlParams.get('room');
if (!roomName) {
    roomName = `algo-design-${Math.random().toString(36).substring(2, 8)}`;
    window.history.replaceState({}, '', `?room=${roomName}`);
}

// Generate random user data for Awareness
const userColors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
const userNames = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank'];
const myColor = userColors[Math.floor(Math.random() * userColors.length)];
const myName = userNames[Math.floor(Math.random() * userNames.length)] + `-${Math.floor(Math.random()*100)}`;

// Initialize Yjs Document & WebRTC Provider
const ydoc = new Y.Doc();
// WebrtcProvider uses public signaling servers (wss://signaling.yjs.dev) by default
const provider = new WebrtcProvider(roomName, ydoc);
const awareness = provider.awareness;

// CRDT Data Structures
// yNodes: Map<NodeId, {x, y, type, color, icon, label}>
const yNodes = ydoc.getMap('nodes'); 
// yLines: Array<{id, from, to}>
const yLines = ydoc.getArray('lines');

// Local UI State
const state = {
    draggedNodeId: null,
    isDrawingLine: false,
    lineStartNodeId: null
};

// DOM Elements
const els = {
    roomIdDisplay: document.getElementById('roomIdDisplay'),
    networkStatus: document.getElementById('networkStatus'),
    btnCopyLink: document.getElementById('btnCopyLink'),
    participantsList: document.getElementById('participantsList'),
    btnClearBoard: document.getElementById('btnClearBoard'),
    
    workspace: document.getElementById('workspace'),
    nodesLayer: document.getElementById('nodesLayer'),
    connectionLayer: document.getElementById('connectionLayer'),
    cursorsLayer: document.getElementById('cursorsLayer'),
    tempLine: document.getElementById('tempLine'),
    placeholder: document.getElementById('workspacePlaceholder'),
    paletteItems: document.querySelectorAll('.palette-item')
};

// ==========================================
// 2. LIFECYCLE & EVENT BINDING
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    els.roomIdDisplay.textContent = roomName;
    
    // Set Local Awareness State (User details)
    awareness.setLocalStateField('user', { name: myName, color: myColor });

    setupNetworkListeners();
    setupAwarenessListeners();
    setupCRDTObervers();
    
    setupPaletteDrag();
    setupWorkspaceInteractions();
    setupToolbarEvents();
});

function setupNetworkListeners() {
    provider.on('synced', synced => {
        if (synced) {
            els.networkStatus.classList.add('connected');
            els.networkStatus.innerHTML = '<div class="status-dot"></div> Connected to Peers';
        }
    });
}

// ==========================================
// 3. YJS AWARENESS (Remote Cursors & Presence)
// ==========================================

function setupAwarenessListeners() {
    // Listen to changes in the awareness state (people joining/moving/leaving)
    awareness.on('change', () => {
        const states = Array.from(awareness.getStates().entries());
        
        // Render Avatars in Toolbar
        els.participantsList.innerHTML = '';
        states.forEach(([clientId, state]) => {
            if (state.user) {
                const avatar = document.createElement('div');
                avatar.className = 'avatar';
                avatar.style.backgroundColor = state.user.color;
                avatar.textContent = state.user.name.charAt(0);
                avatar.title = state.user.name + (clientId === awareness.clientID ? ' (You)' : '');
                els.participantsList.appendChild(avatar);
            }
        });

        // Render Remote Cursors on Canvas
        els.cursorsLayer.innerHTML = '';
        states.forEach(([clientId, state]) => {
            // Don't render our own cursor
            if (clientId !== awareness.clientID && state.cursor && state.user) {
                const cursorEl = document.createElement('div');
                cursorEl.className = 'remote-cursor';
                cursorEl.style.left = `${state.cursor.x}px`;
                cursorEl.style.top = `${state.cursor.y}px`;
                
                cursorEl.innerHTML = `
                    <i class="fas fa-mouse-pointer remote-cursor-icon" style="color: ${state.user.color};"></i>
                    <div class="remote-cursor-name" style="background-color: ${state.user.color};">${state.user.name}</div>
                `;
                els.cursorsLayer.appendChild(cursorEl);
            }
        });
    });

    // Track local mouse movement and broadcast it to peers
    els.workspace.addEventListener('mousemove', (e) => {
        const rect = els.workspace.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Broadcast mouse position to the swarm
        awareness.setLocalStateField('cursor', { x, y });
    });

    // Remove cursor when mouse leaves workspace
    els.workspace.addEventListener('mouseleave', () => {
        awareness.setLocalStateField('cursor', null);
    });
}

// ==========================================
// 4. CRDT OBSERVERS (Syncing DOM with Data)
// ==========================================

function setupCRDTObervers() {
    // Watch for Nodes being added/moved/removed
    yNodes.observe(event => {
        renderAllNodes();
        renderAllLines(); // Redraw lines because nodes might have moved
    });

    // Watch for Connection Lines being drawn/removed
    yLines.observe(event => {
        renderAllLines();
    });

    // Initial render
    renderAllNodes();
    renderAllLines();
}

function renderAllNodes() {
    els.nodesLayer.innerHTML = ''; // Clear DOM
    const nodes = Array.from(yNodes.entries());
    
    if (nodes.length > 0) els.placeholder.classList.add('hidden');
    else els.placeholder.classList.remove('hidden');

    nodes.forEach(([id, data]) => {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'canvas-node';
        nodeEl.id = id;
        nodeEl.style.borderColor = data.color;
        nodeEl.style.left = `${data.x}px`;
        nodeEl.style.top = `${data.y}px`;

        nodeEl.innerHTML = `
            <i class="fas ${data.icon}" style="color: ${data.color};"></i>
            <span class="node-label">${data.label}</span>
            <div class="node-port port-top" data-port="top"></div>
            <div class="node-port port-right" data-port="right"></div>
            <div class="node-port port-bottom" data-port="bottom"></div>
            <div class="node-port port-left" data-port="left"></div>
        `;

        // Interaction: Start Dragging Node
        nodeEl.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('node-port')) return;
            startNodeDrag(id);
        });

        // Interaction: Delete Node (Double Click)
        nodeEl.addEventListener('dblclick', () => {
            yNodes.delete(id);
            // Cleanup connected lines
            const linesToKeep = yLines.toArray().filter(l => l.from !== id && l.to !== id);
            yLines.delete(0, yLines.length);
            yLines.insert(0, linesToKeep);
        });

        // Interaction: Draw Lines from Ports
        const ports = nodeEl.querySelectorAll('.node-port');
        ports.forEach(port => {
            port.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                state.isDrawingLine = true;
                state.lineStartNodeId = id;
                els.tempLine.classList.remove('hidden');
            });
            
            port.addEventListener('mouseup', (e) => {
                e.stopPropagation();
                if (state.isDrawingLine && state.lineStartNodeId !== id) {
                    // Check for duplicate
                    const exists = yLines.toArray().some(l => 
                        (l.from === state.lineStartNodeId && l.to === id) || 
                        (l.from === id && l.to === state.lineStartNodeId)
                    );
                    if (!exists) {
                        yLines.push([{ id: `line-${Date.now()}`, from: state.lineStartNodeId, to: id }]);
                    }
                }
            });
        });

        els.nodesLayer.appendChild(nodeEl);
    });
}

function renderAllLines() {
    // Keep tempLine, remove everything else
    Array.from(els.connectionLayer.children).forEach(child => {
        if (child.id !== 'tempLine') child.remove();
    });

    const lines = yLines.toArray();
    lines.forEach((line, index) => {
        const fromNode = yNodes.get(line.from);
        const toNode = yNodes.get(line.to);
        
        if (!fromNode || !toNode) return; // Node was deleted

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute('class', 'connection-path');
        
        // Draw Bezier Curve
        const offset = Math.abs(toNode.x - fromNode.x) * 0.5;
        const d = `M ${fromNode.x} ${fromNode.y} C ${fromNode.x + offset} ${fromNode.y}, ${toNode.x - offset} ${toNode.y}, ${toNode.x} ${toNode.y}`;
        path.setAttribute('d', d);

        // Delete line on click
        path.addEventListener('click', () => {
            yLines.delete(index, 1);
        });

        els.connectionLayer.appendChild(path);
    });
}

// ==========================================
// 5. MOUSE PHYSICS & DRAG LOGIC
// ==========================================

function setupPaletteDrag() {
    els.paletteItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            const data = {
                type: item.dataset.type,
                color: item.dataset.color,
                icon: item.dataset.icon,
                label: item.textContent.trim()
            };
            e.dataTransfer.setData('application/json', JSON.stringify(data));
        });
    });
}

function setupWorkspaceInteractions() {
    els.workspace.addEventListener('dragover', e => e.preventDefault());

    // Drop from palette
    els.workspace.addEventListener('drop', e => {
        e.preventDefault();
        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr) return;

        const rect = els.workspace.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Insert into CRDT! It will automatically render via the observer
        yNodes.set(`node-${Date.now()}`, { ...JSON.parse(dataStr), x, y });
    });

    // Workspace MouseMove (Moving nodes & drawing lines)
    els.workspace.addEventListener('mousemove', e => {
        const rect = els.workspace.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (state.draggedNodeId) {
            // Update CRDT Map. Observer handles re-rendering.
            // Using a Map update is highly efficient in Yjs.
            const nodeData = yNodes.get(state.draggedNodeId);
            if (nodeData) {
                yNodes.set(state.draggedNodeId, { ...nodeData, x, y });
            }
        }

        if (state.isDrawingLine && state.lineStartNodeId) {
            const startNode = yNodes.get(state.lineStartNodeId);
            if (startNode) {
                const offset = Math.abs(x - startNode.x) * 0.5;
                els.tempLine.setAttribute('d', `M ${startNode.x} ${startNode.y} C ${startNode.x + offset} ${startNode.y}, ${x - offset} ${y}, ${x} ${y}`);
            }
        }
    });

    // Global MouseUp to catch drops
    window.addEventListener('mouseup', () => {
        state.draggedNodeId = null;
        if (state.isDrawingLine) {
            state.isDrawingLine = false;
            state.lineStartNodeId = null;
            els.tempLine.classList.add('hidden');
        }
    });
}

function startNodeDrag(id) {
    state.draggedNodeId = id;
}

// ==========================================
// 6. TOOLBAR UTILS
// ==========================================

function setupToolbarEvents() {
    els.btnCopyLink.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            const og = els.btnCopyLink.innerHTML;
            els.btnCopyLink.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => els.btnCopyLink.innerHTML = og, 2000);
        });
    });

    els.btnClearBoard.addEventListener('click', () => {
        if (false /* confirm removed */) {
            // Clear Yjs Data Structures
            Array.from(yNodes.keys()).forEach(key => yNodes.delete(key));
            yLines.delete(0, yLines.length);
        }
    });
}
