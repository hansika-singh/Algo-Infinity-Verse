/**
 * system-design.js
 * Handles the Drag and Drop Workspace, Node Physics, and Dynamic SVG Routing.
 */

document.addEventListener("DOMContentLoaded", () => {
    initWhiteboard();
});

// App State
const state = {
    nodeIdCounter: 1,
    nodes: {}, // Stores node DOM elements and their metadata
    connections: [], // Stores drawn lines {id, fromNode, toNode}
    
    // Dragging Nodes state
    isDraggingNode: false,
    draggedNodeId: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    
    // Drawing Connections state
    isDrawingLine: false,
    lineStartNodeId: null,
    lineStartPort: null // e.g., 'right', 'left'
};

// DOM Elements
const els = {
    workspace: document.getElementById('workspace'),
    connectionLayer: document.getElementById('connectionLayer'),
    tempLine: document.getElementById('tempLine'),
    placeholder: document.getElementById('workspacePlaceholder'),
    paletteItems: document.querySelectorAll('.palette-item'),
    btnClear: document.getElementById('btnClearBoard'),
    btnHelp: document.getElementById('btnHelp'),
    helpModal: document.getElementById('helpModal'),
    btnCloseHelp: document.getElementById('btnCloseHelp')
};

function initWhiteboard() {
    setupPaletteDrag();
    setupWorkspaceDrop();
    setupWorkspaceMouseEvents();
    setupToolbarEvents();
}

// ----------------------------------------------------
// 1. PALETTE DRAG & DROP (HTML5 API)
// ----------------------------------------------------
function setupPaletteDrag() {
    els.paletteItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            // Package the component data to be read on drop
            const compData = {
                type: item.dataset.type,
                color: item.dataset.color,
                icon: item.dataset.icon,
                label: item.textContent.trim()
            };
            e.dataTransfer.setData('application/json', JSON.stringify(compData));
            e.dataTransfer.effectAllowed = 'copy';
        });
    });
}

function setupWorkspaceDrop() {
    els.workspace.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'copy';
    });

    els.workspace.addEventListener('drop', (e) => {
        e.preventDefault();
        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr) return;

        const compData = JSON.parse(dataStr);
        
        // Calculate exact drop position relative to workspace
        const rect = els.workspace.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        createNode(compData, x, y);
    });
}

// ----------------------------------------------------
// 2. NODE CREATION & MANAGEMENT
// ----------------------------------------------------
function createNode(data, x, y) {
    els.placeholder.style.display = 'none'; // Hide empty state
    
    const nodeId = `node-${state.nodeIdCounter++}`;
    
    const nodeEl = document.createElement('div');
    nodeEl.className = 'canvas-node';
    nodeEl.id = nodeId;
    nodeEl.style.borderColor = data.color;
    
    // Center the node on the mouse drop point (approx 50px wide/high)
    nodeEl.style.left = `${x - 50}px`;
    nodeEl.style.top = `${y - 40}px`;

    nodeEl.innerHTML = `
        <i class="fas ${data.icon}" style="color: ${data.color};"></i>
        <span class="node-label">${data.label}</span>
        <!-- Connection Ports -->
        <div class="node-port port-top" data-port="top"></div>
        <div class="node-port port-right" data-port="right"></div>
        <div class="node-port port-bottom" data-port="bottom"></div>
        <div class="node-port port-left" data-port="left"></div>
    `;

    // 1. Node Drag Event
    nodeEl.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('node-port')) return; // Ignore if clicking a port
        startNodeDrag(e, nodeId, nodeEl);
    });

    // 2. Node Delete Event (Double Click)
    nodeEl.addEventListener('dblclick', () => {
        deleteNode(nodeId);
    });

    // 3. Port Mouse Down (Start Connection)
    const ports = nodeEl.querySelectorAll('.node-port');
    ports.forEach(port => {
        port.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // Don't drag the node
            startDrawingLine(nodeId, port.dataset.port);
        });
        
        // Port Mouse Up (Finish Connection)
        port.addEventListener('mouseup', (e) => {
            e.stopPropagation();
            if (state.isDrawingLine && state.lineStartNodeId !== nodeId) {
                completeConnection(state.lineStartNodeId, nodeId);
            }
        });
    });

    els.workspace.appendChild(nodeEl);
    state.nodes[nodeId] = { element: nodeEl, ...data };
}

function deleteNode(nodeId) {
    // Remove DOM element
    const nodeEl = state.nodes[nodeId].element;
    nodeEl.remove();
    delete state.nodes[nodeId];

    // Remove any connections attached to this node
    state.connections = state.connections.filter(conn => {
        if (conn.from === nodeId || conn.to === nodeId) {
            const path = document.getElementById(conn.id);
            if (path) path.remove();
            return false;
        }
        return true;
    });

    if (Object.keys(state.nodes).length === 0) {
        els.placeholder.style.display = 'block';
    }
}

// ----------------------------------------------------
// 3. WORKSPACE MOUSE PHYSICS (Moving Nodes & Lines)
// ----------------------------------------------------
function setupWorkspaceMouseEvents() {
    els.workspace.addEventListener('mousemove', (e) => {
        const rect = els.workspace.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Logic 1: Moving a Node
        if (state.isDraggingNode && state.draggedNodeId) {
            const nodeEl = state.nodes[state.draggedNodeId].element;
            nodeEl.style.left = `${mouseX - state.dragOffsetX}px`;
            nodeEl.style.top = `${mouseY - state.dragOffsetY}px`;
            renderConnections(); // Redraw lines dynamically
        }

        // Logic 2: Drawing a temporary connection line
        if (state.isDrawingLine) {
            const startCenter = getNodeCenter(state.lineStartNodeId);
            drawCurvedPath(els.tempLine, startCenter.x, startCenter.y, mouseX, mouseY);
        }
    });

    // Handle dropping/releasing anywhere on the workspace
    els.workspace.addEventListener('mouseup', () => {
        if (state.isDraggingNode) {
            state.isDraggingNode = false;
            state.draggedNodeId = null;
        }

        if (state.isDrawingLine) {
            // Cancel line drawing if dropped on empty space
            state.isDrawingLine = false;
            state.lineStartNodeId = null;
            els.tempLine.classList.add('hidden');
        }
    });

    // Handle mouse leaving the workspace entirely
    els.workspace.addEventListener('mouseleave', () => {
        state.isDraggingNode = false;
        if (state.isDrawingLine) {
            state.isDrawingLine = false;
            els.tempLine.classList.add('hidden');
        }
    });
}

function startNodeDrag(e, nodeId, nodeEl) {
    state.isDraggingNode = true;
    state.draggedNodeId = nodeId;
    
    // Calculate offset so the node doesn't snap to the top-left of the mouse
    const rect = nodeEl.getBoundingClientRect();
    state.dragOffsetX = e.clientX - rect.left;
    state.dragOffsetY = e.clientY - rect.top;
}

// ----------------------------------------------------
// 4. DYNAMIC SVG ROUTING (The Magic S-Curves)
// ----------------------------------------------------
function startDrawingLine(nodeId, port) {
    state.isDrawingLine = true;
    state.lineStartNodeId = nodeId;
    state.lineStartPort = port;
    els.tempLine.classList.remove('hidden');
    
    const center = getNodeCenter(nodeId);
    drawCurvedPath(els.tempLine, center.x, center.y, center.x, center.y);
}

function completeConnection(fromNodeId, toNodeId) {
    state.isDrawingLine = false;
    els.tempLine.classList.add('hidden');

    // Prevent duplicate exact connections
    const exists = state.connections.find(c => 
        (c.from === fromNodeId && c.to === toNodeId) || 
        (c.from === toNodeId && c.to === fromNodeId)
    );
    if (exists) return;

    const connId = `conn-${Date.now()}`;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute('class', 'connection-path');
    path.setAttribute('id', connId);
    
    // Delete connection on click
    path.addEventListener('click', () => {
        path.remove();
        state.connections = state.connections.filter(c => c.id !== connId);
    });

    els.connectionLayer.appendChild(path);
    state.connections.push({ id: connId, from: fromNodeId, to: toNodeId, element: path });
    
    renderConnections(); // Draw it immediately
}

function renderConnections() {
    state.connections.forEach(conn => {
        const start = getNodeCenter(conn.from);
        const end = getNodeCenter(conn.to);
        drawCurvedPath(conn.element, start.x, start.y, end.x, end.y);
    });
}

function getNodeCenter(nodeId) {
    if (!state.nodes[nodeId]) return {x: 0, y: 0};
    const nodeEl = state.nodes[nodeId].element;
    
    // Get inline styles, remove 'px', parse to float
    const left = parseFloat(nodeEl.style.left) || 0;
    const top = parseFloat(nodeEl.style.top) || 0;
    const width = nodeEl.offsetWidth;
    const height = nodeEl.offsetHeight;

    return {
        x: left + (width / 2),
        y: top + (height / 2)
    };
}

function drawCurvedPath(pathElement, x1, y1, x2, y2) {
    // Cubic Bezier curve for a smooth "S" shape data flow
    const offset = Math.abs(x2 - x1) * 0.5; // Control point offset
    const d = `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`;
    pathElement.setAttribute('d', d);
}

// ----------------------------------------------------
// 5. TOOLBAR UTILITIES
// ----------------------------------------------------
function setupToolbarEvents() {
    els.btnClear.addEventListener('click', () => {
        if(confirm("Are you sure you want to clear the entire architecture?")) {
            // Remove all nodes
            Object.values(state.nodes).forEach(n => n.element.remove());
            state.nodes = {};
            
            // Remove all connection lines
            state.connections.forEach(c => c.element.remove());
            state.connections = [];
            
            els.placeholder.style.display = 'block';
        }
    });

    els.btnHelp.addEventListener('click', () => {
        els.helpModal.classList.remove('hidden');
    });

    els.btnCloseHelp.addEventListener('click', () => {
        els.helpModal.classList.add('hidden');
    });
}
