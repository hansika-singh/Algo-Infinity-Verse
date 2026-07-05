/**
 * pbft-simulator.js
 * Visualizes the 3-phase commit process of Practical Byzantine Fault Tolerance.
 * Handles node generation, malicious behavior logic, threshold counting, and SVG packet animation.
 */

document.addEventListener("DOMContentLoaded", () => {
    initPBFT();
});

// --- System Configuration & State ---
const MAX_NODES = 10;
const MIN_NODES = 4; // Absolute minimum for pBFT to tolerate 1 failure (3f+1 = 4)
const PACKET_SPEED = 0.02;

let nodes = [];
let networkPackets = [];
let isSimulating = false;
let animationReq = null;

const VALID_DATA = "ATTACK";
const LIE_DATA = "RETREAT";

const els = {
    canvasWrapper: document.getElementById('networkCanvas'),
    svgConnections: document.getElementById('connectionsGroup'),
    svgPackets: document.getElementById('packetsGroup'),
    nodesLayer: document.getElementById('nodesLayer'),
    
    valN: document.getElementById('valN'),
    valF: document.getElementById('valF'),
    valQuorum: document.getElementById('valQuorum'),
    
    btnStart: document.getElementById('btnStartConsensus'),
    btnReset: document.getElementById('btnReset'),
    btnAddNode: document.getElementById('btnAddNode'),
    
    phaseIndicator: document.getElementById('phaseIndicator'),
    logContainer: document.getElementById('logContainer'),
    engineBadge: document.getElementById('engineBadge')
};

// ==========================================
// 1. DATA STRUCTURES & INITIALIZATION
// ==========================================

class PBFTNode {
    constructor(id, index) {
        this.id = id;
        this.index = index;
        this.isPrimary = (index === 0);
        this.isMalicious = false;
        
        this.x = 0;
        this.y = 0;
        
        // pBFT State
        this.preparesReceived = {};
        this.commitsReceived = {};
        this.finalValue = null;
        
        this.initDOM();
    }

    initDOM() {
        this.el = document.createElement('div');
        this.el.className = `pbft-node ${this.isPrimary ? 'primary' : 'honest'}`;
        
        const iconClass = this.isPrimary ? 'fa-star' : 'fa-skull';
        
        this.el.innerHTML = `
            <span class="n-label">${this.id}</span>
            <div class="n-icon"><i class="fas ${iconClass}"></i></div>
            <div class="node-state-badge" id="badge-${this.id}">IDLE</div>
        `;
        
        // Toggle Malicious status on click
        this.el.addEventListener('click', () => {
            if (isSimulating) return;
            this.isMalicious = !this.isMalicious;
            this.updateAppearance();
            updateMathThresholds(); // Validate limits
        });

        els.nodesLayer.appendChild(this.el);
        this.badgeEl = document.getElementById(`badge-${this.id}`);
    }

    updatePosition(width, height, totalNodes) {
        // Arrange in a circle
        const radius = Math.min(width, height) * 0.35;
        const cx = width / 2;
        const cy = height / 2;
        
        // Start Primary at the top (-PI/2)
        const angle = (this.index / totalNodes) * (Math.PI * 2) - (Math.PI / 2);
        
        this.x = cx + Math.cos(angle) * radius;
        this.y = cy + Math.sin(angle) * radius;
        
        this.el.style.left = `${this.x}px`;
        this.el.style.top = `${this.y}px`;
    }

    updateAppearance() {
        if (this.isPrimary) {
            this.el.className = `pbft-node primary ${this.isMalicious ? 'malicious' : ''}`;
        } else {
            this.el.className = `pbft-node ${this.isMalicious ? 'malicious' : 'honest'}`;
        }
    }

    resetState() {
        this.preparesReceived = {};
        this.commitsReceived = {};
        this.finalValue = null;
        this.badgeEl.textContent = 'IDLE';
        this.badgeEl.className = 'node-state-badge';
    }

    setPhase(phase, committed = false) {
        this.badgeEl.textContent = phase;
        if (committed) this.badgeEl.classList.add('committed');
    }
}

function initPBFT() {
    bindEvents();
    
    // Create initial 4 nodes
    for (let i = 0; i < 4; i++) {
        nodes.push(new PBFTNode(`N${i}`, i));
    }
    
    window.addEventListener('resize', drawNetwork);
    drawNetwork();
    updateMathThresholds();
    startAnimationLoop();
}

function bindEvents() {
    els.btnAddNode.addEventListener('click', () => {
        if (isSimulating) return;
        if (nodes.length >= MAX_NODES) return alert("Maximum nodes reached.");
        
        const newIdx = nodes.length;
        nodes.push(new PBFTNode(`N${newIdx}`, newIdx));
        
        drawNetwork();
        updateMathThresholds();
    });

    els.btnReset.addEventListener('click', () => {
        if (isSimulating) return;
        nodes.forEach(n => n.resetState());
        els.svgPackets.innerHTML = '';
        networkPackets = [];
        els.logContainer.innerHTML = '<div class="log-entry sys">> Network reset. Ready.</div>';
        
        els.phaseIndicator.textContent = "Phase: IDLE";
        els.phaseIndicator.classList.remove('active');
        els.engineBadge.className = 'engine-badge';
        els.engineBadge.innerHTML = '<i class="fas fa-shield-alt"></i> Consensus Engine: Idle';
    });

    els.btnStart.addEventListener('click', runConsensus);
}

function logMsg(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.innerHTML = msg;
    els.logContainer.appendChild(div);
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

// ==========================================
// 2. MATHEMATICS & THRESHOLDS
// ==========================================
function updateMathThresholds() {
    const N = nodes.length;
    // pBFT formula: N = 3f + 1  => f = floor((N-1)/3)
    const f = Math.floor((N - 1) / 3);
    const quorum = 2 * f + 1; // Used for execution
    const prepQuorum = 2 * f; // Used to advance to commit (from others)

    els.valN.textContent = N;
    els.valF.textContent = f;
    els.valQuorum.textContent = quorum;

    // Check if user added too many malicious nodes manually
    let maliciousCount = nodes.filter(n => n.isMalicious).length;
    if (maliciousCount > f) {
        logMsg(`<i class="fas fa-exclamation-triangle"></i> WARNING: You have configured ${maliciousCount} malicious nodes, but the network can only tolerate ${f}. Consensus will fail!`, 'error');
        els.valF.style.color = '#ef4444';
        els.valF.style.textShadow = '0 0 10px rgba(239,68,68,0.5)';
    } else {
        els.valF.style.color = '';
        els.valF.style.textShadow = '';
    }

    return { N, f, quorum, prepQuorum, maliciousCount };
}

// ==========================================
// 3. PBFT ALGORITHM EXECUTION
// ==========================================
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runConsensus() {
    if (isSimulating) return;
    
    // Pre-flight check
    nodes.forEach(n => n.resetState());
    els.svgPackets.innerHTML = '';
    networkPackets = [];
    
    const { N, f, quorum, prepQuorum, maliciousCount } = updateMathThresholds();

    isSimulating = true;
    els.btnStart.disabled = true;
    els.btnAddNode.disabled = true;
    els.btnReset.disabled = true;
    
    els.engineBadge.className = 'engine-badge active';
    els.engineBadge.innerHTML = '<i class="fas fa-cog fa-spin"></i> Processing...';

    // ----------------------------------------------------
    // PHASE 1: PRE-PREPARE
    // ----------------------------------------------------
    els.phaseIndicator.textContent = "Phase 1: PRE-PREPARE";
    els.phaseIndicator.classList.add('active');
    
    const primary = nodes[0];
    primary.setPhase('PRE-PREPARE');
    
    logMsg(`Client requests execution of value [<b>${VALID_DATA}</b>].`, 'sys');
    
    // Primary Broadcasts
    let primaryVal = VALID_DATA;
    if (primary.isMalicious) {
        logMsg(`[Traitor] Primary N0 is malicious! Sending conflicting values.`, 'error');
    } else {
        logMsg(`[Honest] Primary N0 multicasting PRE-PREPARE to replicas.`, 'phase');
    }

    for (let i = 1; i < nodes.length; i++) {
        const peer = nodes[i];
        let sendVal = primaryVal;
        
        if (primary.isMalicious) {
            // Malicious primary splits the network: half gets truth, half gets lie
            sendVal = (i % 2 === 0) ? VALID_DATA : LIE_DATA;
        }
        
        spawnPacket(primary.id, peer.id, sendVal);
        // Pretend replica receives it instantly for state purposes
        if (!peer.isMalicious) {
            // Honest node assumes the primary's pre-prepare is what it should vote on
            peer.targetValue = sendVal; 
        }
    }

    await waitForPackets();
    await sleep(500);

    // ----------------------------------------------------
    // PHASE 2: PREPARE
    // ----------------------------------------------------
    els.phaseIndicator.textContent = "Phase 2: PREPARE";
    logMsg(`Nodes verifying PRE-PREPARE and multicasting PREPARE to all peers.`, 'phase');
    
    nodes.forEach(n => {
        if (n.id !== primary.id) n.setPhase('PREPARE');
    });

    // Every replica multicasts to every other replica (excluding primary usually, but we'll multicast to all for visuals)
    for (let i = 1; i < nodes.length; i++) {
        const sender = nodes[i];
        
        let broadcastVal = sender.targetValue; // Honest broadcasts what it received
        if (sender.isMalicious) {
            logMsg(`[Traitor] Node ${sender.id} is malicious! Sending garbage PREPARE.`, 'error');
            broadcastVal = LIE_DATA; // Lie
        }

        for (let j = 0; j < nodes.length; j++) {
            if (i !== j) { // Don't send to self
                spawnPacket(sender.id, nodes[j].id, broadcastVal);
                
                // Record receipt in target
                const target = nodes[j];
                if (!target.preparesReceived[broadcastVal]) target.preparesReceived[broadcastVal] = 0;
                target.preparesReceived[broadcastVal]++;
            }
        }
    }

    await waitForPackets();
    await sleep(500);

    // ----------------------------------------------------
    // PHASE 3: COMMIT
    // ----------------------------------------------------
    els.phaseIndicator.textContent = "Phase 3: COMMIT";
    
    // Evaluate if nodes have 2f prepares matching their pre-prepare
    let nodesProceedingToCommit = [];
    
    nodes.forEach(n => {
        // Primary doesn't need prepares to enter commit, it already knows the truth
        let canCommit = false;
        let commitVal = null;

        if (n.isPrimary) {
            canCommit = true;
            commitVal = VALID_DATA;
        } else {
            // Check if we received >= 2f prepares matching our targetValue
            const matchingPrepares = n.preparesReceived[n.targetValue] || 0;
            if (matchingPrepares >= prepQuorum) {
                canCommit = true;
                commitVal = n.targetValue;
            }
        }

        if (canCommit) {
            nodesProceedingToCommit.push(n);
            n.setPhase('COMMIT');
            if (n.isMalicious) {
                logMsg(`[Traitor] Node ${n.id} sending garbage COMMIT.`, 'error');
            }
        } else {
            logMsg(`Node ${n.id} failed to reach PREPARE quorum. Cannot proceed to Commit.`, 'error');
        }
    });

    if (nodesProceedingToCommit.length === 0) {
        finishConsensus(false, "Consensus Failed at Prepare Phase.");
        return;
    }

    logMsg(`Nodes with sufficient PREPAREs multicasting COMMIT.`, 'phase');

    nodesProceedingToCommit.forEach(sender => {
        let broadcastVal = sender.isPrimary ? VALID_DATA : sender.targetValue;
        if (sender.isMalicious) broadcastVal = LIE_DATA;

        nodes.forEach(target => {
            // Everyone sends to everyone
            spawnPacket(sender.id, target.id, broadcastVal);
            
            if (!target.commitsReceived[broadcastVal]) target.commitsReceived[broadcastVal] = 0;
            target.commitsReceived[broadcastVal]++;
        });
    });

    await waitForPackets();
    await sleep(500);

    // ----------------------------------------------------
    // PHASE 4: EXECUTE / REPLY
    // ----------------------------------------------------
    els.phaseIndicator.textContent = "Phase 4: EXECUTE";
    logMsg(`Nodes checking for 2f+1 COMMIT messages to execute.`, 'phase');
    
    let successfulNodes = 0;

    nodes.forEach(n => {
        let execVal = null;
        let highestCommits = 0;
        
        for (const [val, count] of Object.entries(n.commitsReceived)) {
            // Node adds its own implicitly if it participated
            let total = count;
            if (nodesProceedingToCommit.includes(n) && (n.isPrimary ? VALID_DATA : n.targetValue) === val) total++;
            
            if (total >= quorum) {
                execVal = val;
                highestCommits = total;
            }
        }

        if (execVal === VALID_DATA) {
            n.setPhase('COMMITTED', true);
            successfulNodes++;
        } else if (execVal === LIE_DATA) {
            n.setPhase('CORRUPTED');
            logMsg(`Node ${n.id} was forced to commit corrupted data!`, 'error');
        } else {
            n.setPhase('FAILED');
        }
    });

    if (successfulNodes >= quorum) {
        logMsg(`[SUCCESS] The network reached consensus on [<b>${VALID_DATA}</b>]. Tolerated ${maliciousCount} traitor(s).`, 'success');
        finishConsensus(true, "Consensus Achieved");
    } else {
        logMsg(`[FAILED] Network failed to reach consensus. Too many traitors or partitioned.`, 'error');
        finishConsensus(false, "Consensus Failed");
    }
}

function finishConsensus(isSuccess, msg) {
    els.engineBadge.className = `engine-badge ${isSuccess ? 'active' : 'error'}`;
    els.engineBadge.innerHTML = isSuccess 
        ? '<i class="fas fa-check-circle"></i> State Committed' 
        : '<i class="fas fa-times-circle"></i> Network Partitioned';
        
    els.phaseIndicator.textContent = msg;
    els.phaseIndicator.classList.remove('active');
    
    els.btnStart.disabled = false;
    els.btnAddNode.disabled = false;
    els.btnReset.disabled = false;
    isSimulating = false;
}

// ==========================================
// 4. SVG RENDERING & ANIMATION
// ==========================================

function drawNetwork() {
    const w = els.canvasWrapper.clientWidth;
    const h = els.canvasWrapper.clientHeight;
    
    // Reset connections
    els.svgConnections.innerHTML = '';
    
    nodes.forEach(node => {
        node.updatePosition(w, h, nodes.length);
    });

    // Draw all-to-all subtle mesh lines
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", nodes[i].x);
            line.setAttribute("y1", nodes[i].y);
            line.setAttribute("x2", nodes[j].x);
            line.setAttribute("y2", nodes[j].y);
            line.setAttribute("class", "net-link");
            els.svgConnections.appendChild(line);
        }
    }
}

function spawnPacket(fromId, toId, dataValue) {
    const fromNode = nodes.find(n => n.id === fromId);
    const toNode = nodes.find(n => n.id === toId);
    if (!fromNode || !toNode) return;

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", "5");
    
    // Color code based on truth vs lie
    const isTruth = (dataValue === VALID_DATA);
    circle.setAttribute("class", `packet ${isTruth ? 'truth' : 'lie'}`);
    
    els.svgPackets.appendChild(circle);

    networkPackets.push({
        startX: fromNode.x,
        startY: fromNode.y,
        endX: toNode.x,
        endY: toNode.y,
        progress: 0,
        element: circle
    });
}

function startAnimationLoop() {
    function loop() {
        if (networkPackets.length > 0) {
            for (let i = networkPackets.length - 1; i >= 0; i--) {
                let p = networkPackets[i];
                p.progress += PACKET_SPEED;

                if (p.progress >= 1) {
                    p.element.remove();
                    networkPackets.splice(i, 1);
                } else {
                    const cx = p.startX + (p.endX - p.startX) * p.progress;
                    const cy = p.startY + (p.endY - p.startY) * p.progress;
                    p.element.setAttribute("cx", cx);
                    p.element.setAttribute("cy", cy);
                }
            }
        }
        animationReq = requestAnimationFrame(loop);
    }
    loop();
}

function waitForPackets() {
    return new Promise(resolve => {
        const check = setInterval(() => {
            if (networkPackets.length === 0) {
                clearInterval(check);
                resolve();
            }
        }, 50);
    });
}
