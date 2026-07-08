/**
 * 2pc-visualizer.js
 * Implements a Distributed System simulation for the Two-Phase Commit protocol.
 * Tracks and visually renders Vector Clocks for causality across network hops.
 */

document.addEventListener("DOMContentLoaded", () => {
    init2PCVisualizer();
});

// --- System Architecture Config ---
const COORD_IDX = 0;
const NODE_A_IDX = 1;
const NODE_B_IDX = 2;
const NODE_C_IDX = 3;

const PACKET_SPEED = 0.015; // Animation progress per frame
const TIMEOUT_DURATION = 5000; // 5 seconds for coordinator timeout

// --- Global State ---
let nodes = [];
let networkPackets = [];
let isTxActive = false;
let animationReq;
let globalTimer = null;

const els = {
    canvas: document.getElementById('networkCanvas'),
    svgConnections: document.getElementById('connectionsGroup'),
    svgPackets: document.getElementById('packetsGroup'),
    nodesLayer: document.getElementById('nodesLayer'),
    
    btnStartTx: document.getElementById('btnStartTx'),
    btnReset: document.getElementById('btnReset'),
    failNodeA: document.getElementById('failNodeA'),
    crashNodeC: document.getElementById('crashNodeC'),
    
    txStatusDisplay: document.getElementById('txStatusDisplay'),
    logsContainer: document.getElementById('logsContainer'),
    engineBadge: document.getElementById('engineBadge')
};

// ==========================================
// 1. DATA STRUCTURES (Nodes & Vector Clocks)
// ==========================================

class VectorClock {
    constructor() {
        this.clock = [0, 0, 0, 0]; // [Coord, A, B, C]
    }
    
    increment(nodeIdx) {
        this.clock[nodeIdx]++;
    }
    
    merge(incomingClock, nodeIdx) {
        // Increment own logical clock before merging event
        this.increment(nodeIdx);
        // Element-wise maximum
        for (let i = 0; i < 4; i++) {
            this.clock[i] = Math.max(this.clock[i], incomingClock[i]);
        }
    }

    toString() {
        return `[${this.clock.join(', ')}]`;
    }
}

class DistributedNode {
    constructor(id, name, index, isCoord, xPct, yPct) {
        this.id = id;
        this.name = name;
        this.index = index;
        this.isCoord = isCoord;
        this.xPct = xPct;
        this.yPct = yPct;
        
        // State: IDLE, PREPARED, COMMITTED, ABORTED, FAILED
        this.state = 'IDLE'; 
        this.vc = new VectorClock();
        this.x = 0; // Calculated on render
        this.y = 0;
        
        this.votesReceived = 0;
        this.acksReceived = 0;
        
        this.initDOM();
    }

    initDOM() {
        this.el = document.createElement('div');
        this.el.className = `dist-node ${this.isCoord ? 'coord' : ''} ${this.state}`;
        
        this.el.innerHTML = `
            <div class="node-title">${this.name}</div>
            <div class="node-role">${this.isCoord ? 'Coordinator' : 'Participant'}</div>
            <div class="vector-clock" id="vc-${this.id}">${this.vc.toString()}</div>
        `;
        els.nodesLayer.appendChild(this.el);
        this.vcDisplay = document.getElementById(`vc-${this.id}`);
    }

    updatePosition(width, height) {
        this.x = width * this.xPct;
        this.y = height * this.yPct;
        this.el.style.left = `${this.x}px`;
        this.el.style.top = `${this.y}px`;
    }

    setState(newState) {
        this.state = newState;
        this.el.className = `dist-node ${this.isCoord ? 'coord' : ''} ${this.state}`;
    }

    updateClockUI() {
        this.vcDisplay.textContent = this.vc.toString();
        this.vcDisplay.classList.add('updated');
        setTimeout(() => this.vcDisplay.classList.remove('updated'), 300);
    }
    
    log(msg, type = 'sys') {
        const div = document.createElement('div');
        div.className = `log-entry ${type}`;
        div.innerHTML = `<strong>${this.name}:</strong> ${msg} <code>${this.vc.toString()}</code>`;
        els.logsContainer.appendChild(div);
        els.logsContainer.scrollTop = els.logsContainer.scrollHeight;
    }

    // --- Message Handling ---
    receiveMessage(msg) {
        if (this.state === 'FAILED') return; // Ignore if crashed

        // 1. Merge Vector Clock on Receive
        this.vc.merge(msg.vc, this.index);
        this.updateClockUI();

        if (this.isCoord) {
            this.handleCoordinatorMessage(msg);
        } else {
            this.handleParticipantMessage(msg);
        }
    }

    handleParticipantMessage(msg) {
        if (msg.type === 'PREPARE') {
            // Chaos Check
            if (this.id === 'nodeA' && els.failNodeA.checked) {
                this.setState('ABORTED');
                this.log("Constraint violation. Voting NO.", "abt");
                sendPacket(this.id, 'coord', 'NO', [...this.vc.clock]);
            } else {
                this.setState('PREPARED');
                this.log("Local write successful. Voting YES.", "prep");
                sendPacket(this.id, 'coord', 'YES', [...this.vc.clock]);
            }
        } 
        else if (msg.type === 'COMMIT') {
            this.setState('COMMITTED');
            this.log("Committed to disk.", "com");
            sendPacket(this.id, 'coord', 'ACK', [...this.vc.clock]);
        } 
        else if (msg.type === 'ABORT') {
            this.setState('ABORTED');
            this.log("Rollback completed.", "abt");
            sendPacket(this.id, 'coord', 'ACK', [...this.vc.clock]);
        }
    }

    handleCoordinatorMessage(msg) {
        if (msg.type === 'YES' || msg.type === 'NO') {
            if (this.state === 'ABORTED') return; // Already aborted, ignore further votes

            if (msg.type === 'NO') {
                clearTimeout(globalTimer);
                this.log(`Received NO from ${msg.from}. Initiating GLOBAL ABORT.`, "abt");
                this.setState('ABORTED');
                this.broadcast('ABORT');
                finishTransaction('ABORTED', 'aborted');
            } else {
                this.votesReceived++;
                // If 3 YES votes received (Total Participants)
                if (this.votesReceived === 3) {
                    clearTimeout(globalTimer);
                    this.log("All YES votes received. Initiating GLOBAL COMMIT.", "com");
                    this.setState('COMMITTED');
                    this.broadcast('COMMIT');
                }
            }
        }
        else if (msg.type === 'ACK') {
            this.acksReceived++;
            if (this.acksReceived === 3 || (this.acksReceived === 2 && els.crashNodeC.checked)) {
                // Done
                this.log("All ACKs received. Transaction Complete.", "com");
                finishTransaction('COMMITTED', 'committed');
            }
        }
    }

    broadcast(type) {
        nodes.forEach(peer => {
            if (!peer.isCoord) {
                sendPacket(this.id, peer.id, type, [...this.vc.clock]);
            }
        });
    }
}

// ==========================================
// 2. NETWORK INITIALIZATION & CANVAS
// ==========================================
function init2PCVisualizer() {
    setupNodes();
    bindEvents();
    
    window.addEventListener('resize', drawCanvas);
    startCanvasLoop();
}

function setupNodes() {
    els.nodesLayer.innerHTML = '';
    nodes = [
        new DistributedNode('coord', 'Coordinator', COORD_IDX, true, 0.5, 0.15),
        new DistributedNode('nodeA', 'Node A', NODE_A_IDX, false, 0.2, 0.8),
        new DistributedNode('nodeB', 'Node B', NODE_B_IDX, false, 0.5, 0.8),
        new DistributedNode('nodeC', 'Node C', NODE_C_IDX, false, 0.8, 0.8)
    ];
    drawCanvas();
}

function bindEvents() {
    els.btnStartTx.addEventListener('click', startTransaction);
    
    els.btnReset.addEventListener('click', () => {
        isTxActive = false;
        clearTimeout(globalTimer);
        networkPackets = [];
        els.svgPackets.innerHTML = '';
        els.logsContainer.innerHTML = '<div class="log-entry sys">>> Network Reset. Ready.</div>';
        finishTransaction('IDLE', '');
        
        nodes.forEach(n => {
            n.vc = new VectorClock();
            n.setState('IDLE');
            n.updateClockUI();
            n.votesReceived = 0;
            n.acksReceived = 0;
            // Revive from crash
            if(n.state === 'FAILED') n.setState('IDLE');
        });
        els.crashNodeC.checked = false;
        els.failNodeA.checked = false;
    });

    els.crashNodeC.addEventListener('change', (e) => {
        const nodeC = nodes.find(n => n.id === 'nodeC');
        if (e.target.checked) {
            nodeC.setState('FAILED');
            logSys("Node C crashed completely.", "abt");
        } else {
            nodeC.setState('IDLE');
            logSys("Node C recovered.", "sys");
        }
    });
}

function logSys(msg, type='sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = `>> ${msg}`;
    els.logsContainer.appendChild(div);
    els.logsContainer.scrollTop = els.logsContainer.scrollHeight;
}

// ==========================================
// 3. 2PC PROTOCOL EXECUTION
// ==========================================
function startTransaction() {
    if (isTxActive) return;
    isTxActive = true;
    
    els.btnStartTx.disabled = true;
    els.engineBadge.classList.add('active');
    els.engineBadge.innerHTML = '<i class="fas fa-bolt"></i> Transaction Active';
    
    els.txStatusDisplay.textContent = 'Status: PREPARING';
    els.txStatusDisplay.className = 'status-display active';

    const coord = nodes.find(n => n.isCoord);
    coord.votesReceived = 0;
    coord.acksReceived = 0;
    
    // Phase 1: Prepare
    coord.log("Starting Transaction. Broadcasting PREPARE.", "coord");
    coord.vc.increment(COORD_IDX); // Local event
    coord.updateClockUI();
    coord.broadcast('PREPARE');

    // Coordinator Timeout Logic
    globalTimer = setTimeout(() => {
        if (coord.state === 'IDLE' || coord.state === 'PREPARED') {
            coord.log("TIMEOUT waiting for votes. Initiating GLOBAL ABORT.", "abt");
            coord.setState('ABORTED');
            coord.broadcast('ABORT');
            finishTransaction('ABORTED', 'aborted');
        }
    }, TIMEOUT_DURATION);
}

function finishTransaction(statusText, cssClass) {
    els.btnStartTx.disabled = false;
    els.engineBadge.classList.remove('active');
    els.engineBadge.innerHTML = '<i class="fas fa-network-wired"></i> Distributed Network: Idle';
    
    els.txStatusDisplay.textContent = `Status: ${statusText}`;
    els.txStatusDisplay.className = `status-display ${cssClass}`;
    isTxActive = false;
}

// ==========================================
// 4. ANIMATION & CANVAS ROUTING
// ==========================================
function drawCanvas() {
    const w = els.canvas.clientWidth;
    const h = els.canvas.clientHeight;
    els.svgConnections.innerHTML = '';

    const coord = nodes.find(n => n.isCoord);
    coord.updatePosition(w, h);

    nodes.forEach(node => {
        if (!node.isCoord) {
            node.updatePosition(w, h);
            
            // Draw lines connecting Coordinator to Participants
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", coord.x);
            line.setAttribute("y1", coord.y + 40); // Offset bottom of node
            line.setAttribute("x2", node.x);
            line.setAttribute("y2", node.y - 40);  // Offset top of node
            line.setAttribute("class", "net-link");
            els.svgConnections.appendChild(line);
        }
    });
}

function sendPacket(fromId, toId, type, vcSnapshot) {
    const fromNode = nodes.find(n => n.id === fromId);
    const toNode = nodes.find(n => n.id === toId);
    
    // Create SVG element
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", "8");
    circle.setAttribute('class', `packet ${type}`);
    
    els.svgPackets.appendChild(circle);

    networkPackets.push({
        from: fromId,
        to: toId,
        startX: fromNode.x,
        startY: fromNode.y + (fromNode.isCoord ? 40 : -40),
        endX: toNode.x,
        endY: toNode.y + (toNode.isCoord ? 40 : -40),
        type: type,
        vc: vcSnapshot,
        progress: 0,
        element: circle
    });
}

function startCanvasLoop() {
    function loop() {
        for (let i = networkPackets.length - 1; i >= 0; i--) {
            let p = networkPackets[i];
            p.progress += PACKET_SPEED;

            if (p.progress >= 1) {
                // Deliver message
                const targetNode = nodes.find(n => n.id === p.to);
                if (targetNode) targetNode.receiveMessage(p);
                
                // Remove packet
                p.element.remove();
                networkPackets.splice(i, 1);
            } else {
                // Move packet
                const currX = p.startX + (p.endX - p.startX) * p.progress;
                const currY = p.startY + (p.endY - p.startY) * p.progress;
                p.element.setAttribute("cx", currX);
                p.element.setAttribute("cy", currY);
            }
        }
        animationReq = requestAnimationFrame(loop);
    }
    loop();
}
