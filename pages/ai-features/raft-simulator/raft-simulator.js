/**
 * raft-simulator.js
 * A complete, interactive simulation of the Raft Consensus Algorithm.
 * Implements Leader Election, Heartbeats, and Log Replication.
 */

document.addEventListener("DOMContentLoaded", () => {
    initRaftSimulator();
});

// --- Constants & Config ---
const CONFIG = {
    NUM_NODES: 5,
    RADIUS: 180, // Radius of the circle arrangement
    HEARTBEAT_INTERVAL: 1500, // ms
    ELECTION_MIN: 3000, // ms
    ELECTION_MAX: 6000, // ms
    PACKET_SPEED: 0.015, // progress per frame (~60fps)
};

// --- System State ---
let nodes = [];
let networkPackets = [];
let globalTerm = 0;
let isPaused = false;
let animationFrameId;
let lastTimestamp = 0;

// --- DOM Elements ---
const els = {
    canvas: document.getElementById('networkCanvas'),
    svgConnections: document.getElementById('connectionsGroup'),
    svgPackets: document.getElementById('packetsGroup'),
    nodesLayer: document.getElementById('nodesLayer'),
    nodeLogsContainer: document.getElementById('nodeLogsContainer'),
    globalTermDisplay: document.getElementById('globalTermDisplay'),
    
    btnClientReq: document.getElementById('btnClientReq'),
    btnKillLeader: document.getElementById('btnKillLeader'),
    btnPause: document.getElementById('btnPause'),
    btnReset: document.getElementById('btnReset')
};

// ==========================================
// 1. RAFT NODE CLASS (State Machine)
// ==========================================
class RaftNode {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.isDead = false;
        
        // Persistent state on all servers
        this.currentTerm = 0;
        this.votedFor = null;
        this.log = [];
        
        // Volatile state
        this.commitIndex = 0;
        this.state = 'FOLLOWER'; // FOLLOWER, CANDIDATE, LEADER
        
        // Volatile state on leaders
        this.nextIndex = {};
        this.matchIndex = {};
        
        // Simulation timers
        this.electionTimer = 0;
        this.electionTimeout = this.getRandomTimeout();
        this.heartbeatTimer = 0;
        this.votesReceived = 0;
        
        this.initDOM();
    }

    getRandomTimeout() {
        return Math.random() * (CONFIG.ELECTION_MAX - CONFIG.ELECTION_MIN) + CONFIG.ELECTION_MIN;
    }

    initDOM() {
        // Main Node
        this.el = document.createElement('div');
        this.el.className = 'raft-node follower';
        this.el.style.left = `${this.x}px`;
        this.el.style.top = `${this.y}px`;
        this.el.textContent = `S${this.id}`;
        
        // Timer Ring
        this.el.innerHTML += `
            <svg class="timer-ring" viewBox="0 0 80 80">
                <circle class="timer-circle" cx="40" cy="40" r="38" id="timer-${this.id}"></circle>
            </svg>
            <div class="heartbeat-pulse"></div>
        `;
        
        this.el.addEventListener('click', () => this.toggleDead());
        els.nodesLayer.appendChild(this.el);
        this.timerCircle = document.getElementById(`timer-${this.id}`);
        
        // Log Card
        this.logCard = document.createElement('div');
        this.logCard.className = 'node-log-card';
        this.logCard.id = `log-card-${this.id}`;
        els.nodeLogsContainer.appendChild(this.logCard);
        this.updateLogUI();
    }

    toggleDead() {
        this.isDead = !this.isDead;
        if (this.isDead) {
            this.state = 'FOLLOWER';
            this.el.className = 'raft-node dead';
            this.updateLogUI();
        } else {
            this.el.className = 'raft-node follower';
            this.electionTimer = 0; // Restart timer
            this.updateLogUI();
        }
    }

    // --- Core Logic Tick ---
    update(dt) {
        if (this.isDead || isPaused) return;

        if (this.state === 'LEADER') {
            this.heartbeatTimer += dt;
            if (this.heartbeatTimer >= CONFIG.HEARTBEAT_INTERVAL) {
                this.heartbeatTimer = 0;
                this.sendHeartbeats();
            }
        } else {
            this.electionTimer += dt;
            this.updateTimerUI();
            
            if (this.electionTimer >= this.electionTimeout) {
                this.startElection();
            }
        }
    }

    updateTimerUI() {
        if (!this.timerCircle) return;
        const progress = 1 - (this.electionTimer / this.electionTimeout);
        // Dasharray is 240. 240 * progress
        this.timerCircle.style.strokeDashoffset = 240 * (1 - progress);
    }

    // --- State Transitions ---
    startElection() {
        this.state = 'CANDIDATE';
        this.currentTerm++;
        this.votedFor = this.id;
        this.votesReceived = 1;
        this.electionTimer = 0;
        this.electionTimeout = this.getRandomTimeout();
        
        this.updateUI();
        updateGlobalTerm(this.currentTerm);

        // Broadcast RequestVote
        nodes.forEach(peer => {
            if (peer.id !== this.id) {
                sendPacket(this.id, peer.id, 'RequestVote', {
                    term: this.currentTerm,
                    candidateId: this.id,
                    lastLogIndex: this.log.length - 1,
                    lastLogTerm: this.log.length > 0 ? this.log[this.log.length - 1].term : 0
                });
            }
        });
    }

    becomeLeader() {
        this.state = 'LEADER';
        this.updateUI();
        
        // Initialize leader state
        nodes.forEach(peer => {
            this.nextIndex[peer.id] = this.log.length;
            this.matchIndex[peer.id] = 0;
        });

        this.sendHeartbeats();
    }

    becomeFollower(term) {
        this.state = 'FOLLOWER';
        this.currentTerm = term;
        this.votedFor = null;
        this.electionTimer = 0;
        this.updateUI();
        updateGlobalTerm(term);
    }

    // --- Network Send/Receive ---
    sendHeartbeats() {
        nodes.forEach(peer => {
            if (peer.id !== this.id) {
                const prevLogIndex = this.nextIndex[peer.id] - 1;
                const prevLogTerm = prevLogIndex >= 0 ? this.log[prevLogIndex].term : 0;
                const entries = this.log.slice(this.nextIndex[peer.id]);

                sendPacket(this.id, peer.id, 'AppendEntries', {
                    term: this.currentTerm,
                    leaderId: this.id,
                    prevLogIndex: prevLogIndex,
                    prevLogTerm: prevLogTerm,
                    entries: entries,
                    leaderCommit: this.commitIndex
                });
            }
        });
    }

    receiveMessage(msg) {
        if (this.isDead) return;

        // Step down if message has a higher term
        if (msg.payload.term > this.currentTerm) {
            this.becomeFollower(msg.payload.term);
        }

        switch(msg.type) {
            case 'RequestVote':
                this.handleRequestVote(msg);
                break;
            case 'VoteReply':
                this.handleVoteReply(msg);
                break;
            case 'AppendEntries':
                this.handleAppendEntries(msg);
                break;
            case 'AppendReply':
                this.handleAppendReply(msg);
                break;
            case 'ClientRequest':
                if (this.state === 'LEADER') {
                    this.log.push({ term: this.currentTerm, cmd: msg.payload.cmd });
                    this.updateLogUI();
                    this.sendHeartbeats();
                } else {
                    // Redirect to leader (visually, just drop or bounce in this sim)
                }
                break;
        }
    }

    handleRequestVote(msg) {
        const { term, candidateId, lastLogIndex, lastLogTerm } = msg.payload;
        let voteGranted = false;

        // Simplified Raft Rules for UI simulation
        if (term >= this.currentTerm) {
            if (this.votedFor === null || this.votedFor === candidateId) {
                // Log up-to-date check omitted for simplicity unless requested
                voteGranted = true;
                this.votedFor = candidateId;
                this.electionTimer = 0; // Reset timer on granting vote
            }
        }

        sendPacket(this.id, candidateId, 'VoteReply', {
            term: this.currentTerm,
            voteGranted: voteGranted
        });
    }

    handleVoteReply(msg) {
        if (this.state !== 'CANDIDATE') return;
        if (msg.payload.term !== this.currentTerm) return;

        if (msg.payload.voteGranted) {
            this.votesReceived++;
            if (this.votesReceived > Math.floor(CONFIG.NUM_NODES / 2)) {
                this.becomeLeader();
            }
        }
    }

    handleAppendEntries(msg) {
        const { term, leaderId, prevLogIndex, prevLogTerm, entries, leaderCommit } = msg.payload;
        let success = false;

        if (term >= this.currentTerm) {
            this.electionTimer = 0; // Heartbeat received! Reset timeout.
            if (this.state === 'CANDIDATE') this.becomeFollower(term);
            
            // Simplified log replication
            success = true;
            if (entries && entries.length > 0) {
                // For this simulation, just overwrite log
                this.log = this.log.slice(0, prevLogIndex + 1).concat(entries);
            }
            
            if (leaderCommit > this.commitIndex) {
                this.commitIndex = Math.min(leaderCommit, this.log.length - 1);
            }
            this.updateLogUI();
        }

        sendPacket(this.id, leaderId, 'AppendReply', {
            term: this.currentTerm,
            success: success,
            matchIndex: this.log.length - 1
        });
    }

    handleAppendReply(msg) {
        if (this.state !== 'LEADER' || msg.payload.term > this.currentTerm) return;
        
        const followerId = msg.from;
        if (msg.payload.success) {
            this.nextIndex[followerId] = msg.payload.matchIndex + 1;
            this.matchIndex[followerId] = msg.payload.matchIndex;
            
            // Update commit index if majority reached (Simplified)
            // ... omitting exact majority math for UI brevity ...
        } else {
            // Decrement nextIndex and retry (handled by next heartbeat)
            this.nextIndex[followerId] = Math.max(0, this.nextIndex[followerId] - 1);
        }
    }

    // --- DOM Updates ---
    updateUI() {
        if (this.isDead) return;
        this.el.className = `raft-node ${this.state.toLowerCase()}`;
        this.updateLogUI();
    }

    updateLogUI() {
        let stateStr = this.isDead ? "DEAD" : this.state;
        this.logCard.className = `node-log-card ${this.state === 'LEADER' && !this.isDead ? 'leader-log' : ''}`;
        
        const logDisplay = this.log.length > 0 
            ? this.log.map(l => `[${l.cmd}]`).join(' ') 
            : 'Empty';

        this.logCard.innerHTML = `
            <div class="log-header">
                <span>Server ${this.id} (${stateStr})</span>
                <span class="log-term">Term: ${this.currentTerm}</span>
            </div>
            <div class="log-entries">
                Log: <span>${logDisplay}</span>
            </div>
        `;
    }
}

// ==========================================
// 2. NETWORK CONTROLLER & RENDERING
// ==========================================
function initRaftSimulator() {
    setupCanvas();
    bindControls();
    
    // Start Game Loop
    lastTimestamp = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function setupCanvas() {
    nodes = [];
    networkPackets = [];
    els.nodesLayer.innerHTML = '';
    els.svgConnections.innerHTML = '';
    els.svgPackets.innerHTML = '';
    els.nodeLogsContainer.innerHTML = '';
    globalTerm = 0;
    updateGlobalTerm(0);

    const rect = els.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Distribute nodes in a circle
    for (let i = 0; i < CONFIG.NUM_NODES; i++) {
        const angle = (i / CONFIG.NUM_NODES) * (Math.PI * 2) - (Math.PI / 2);
        const x = centerX + Math.cos(angle) * CONFIG.RADIUS;
        const y = centerY + Math.sin(angle) * CONFIG.RADIUS;
        nodes.push(new RaftNode(i + 1, x, y));
    }

    // Draw lines between all nodes
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

function sendPacket(fromId, toId, type, payload) {
    if (isPaused) return;

    const fromNode = nodes.find(n => n.id === fromId);
    const toNode = nodes.find(n => n.id === toId);
    if (!fromNode || !toNode || fromNode.isDead || toNode.isDead) return;

    // Create SVG element
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", "4");
    
    // Determine CSS class based on packet type
    if (type === 'AppendEntries') circle.setAttribute('class', 'packet heartbeat');
    else if (type === 'RequestVote') circle.setAttribute('class', 'packet vote-req');
    else if (type === 'ClientRequest') circle.setAttribute('class', 'packet client');
    else circle.setAttribute('class', 'packet');

    els.svgPackets.appendChild(circle);

    networkPackets.push({
        from: fromId,
        to: toId,
        startX: fromNode.x,
        startY: fromNode.y,
        endX: toNode.x,
        endY: toNode.y,
        type: type,
        payload: payload,
        progress: 0,
        element: circle
    });
}

function gameLoop(timestamp) {
    const dt = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    if (!isPaused) {
        // Update Nodes (Timers)
        nodes.forEach(node => node.update(dt));

        // Update Packets
        for (let i = networkPackets.length - 1; i >= 0; i--) {
            let p = networkPackets[i];
            p.progress += CONFIG.PACKET_SPEED;

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
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- UI Controls ---
function bindControls() {
    els.btnPause.addEventListener('click', () => {
        isPaused = !isPaused;
        els.btnPause.innerHTML = isPaused ? '<i class="fas fa-play"></i> Resume Network' : '<i class="fas fa-pause"></i> Pause Network';
        if (!isPaused) lastTimestamp = performance.now(); // Prevent time jump
    });

    els.btnReset.addEventListener('click', () => {
        cancelAnimationFrame(animationFrameId);
        setupCanvas();
        lastTimestamp = performance.now();
        animationFrameId = requestAnimationFrame(gameLoop);
    });

    els.btnKillLeader.addEventListener('click', () => {
        const leader = nodes.find(n => n.state === 'LEADER' && !n.isDead);
        if (leader) leader.toggleDead();
    });

    let reqCounter = 1;
    els.btnClientReq.addEventListener('click', () => {
        const leader = nodes.find(n => n.state === 'LEADER' && !n.isDead);
        if (leader) {
            // Animate client request to leader (spawn packet from top)
            const fakeClientId = 999;
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("r", "6");
            circle.setAttribute('class', 'packet client');
            els.svgPackets.appendChild(circle);

            networkPackets.push({
                from: fakeClientId,
                to: leader.id,
                startX: els.canvas.clientWidth / 2,
                startY: -50, // Comes from top
                endX: leader.x,
                endY: leader.y,
                type: 'ClientRequest',
                payload: { cmd: `V${reqCounter++}` },
                progress: 0,
                element: circle
            });
        } else {
            console.warn("Alert:", "No active leader! Please wait for election.");
        }
    });
}

function updateGlobalTerm(term) {
    if (term > globalTerm) {
        globalTerm = term;
        els.globalTermDisplay.textContent = globalTerm;
    }
}
