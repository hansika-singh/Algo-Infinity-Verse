/**
 * redlock-simulator.js
 * Implements the Redis Redlock Algorithm for Distributed Locking.
 * Simulates 5 independent Redis nodes, 2 competing clients, clock drift, and GC pauses.
 */

document.addEventListener("DOMContentLoaded", () => {
    initRedlockSimulator();
});

// ==========================================
// 1. ENGINE CONFIG & STATE
// ==========================================
const CONFIG = {
    NUM_NODES: 5,
    QUORUM: 3, // N/2 + 1
    LOCK_TTL: 10000, // 10 seconds
    DRIFT_FACTOR: 0.01, // 1% clock drift margin
    NETWORK_DELAY: 300, // ms artificial delay to show packet lines
    TICK_RATE: 50 // ms per animation frame
};

let nodes = [];
let clients = {};
let engineTimer = null;

const els = {
    svgLayer: document.getElementById('svgLayer'),
    engineBadge: document.getElementById('engineBadge')
};

// ==========================================
// 2. REDIS NODE CLASS
// ==========================================
class RedisNode {
    constructor(id, index) {
        this.id = id;
        this.index = index;
        this.isOffline = false;
        this.isDrifting = false;
        
        // Lock State
        this.lockedBy = null; // 'A' or 'B'
        this.token = null;    // Unique secret for this lock
        this.expireTime = 0;  // Absolute timestamp when lock expires
        
        // UI
        this.el = document.getElementById(`node-${index}`);
        this.stateEl = document.getElementById(`state-${index}`);
        this.ttlFill = document.getElementById(`ttl-${index}`);
        this.driftWarning = document.getElementById(`drift-${index}`);
    }

    // Attempt to acquire lock on this specific node
    async lock(clientId, token, ttl) {
        // Simulate Network Latency
        drawPacketLine(clientId, this.index, `req-${clientId.toLowerCase()}`);
        await sleep(CONFIG.NETWORK_DELAY);

        if (this.isOffline) {
            flashLine(clientId, this.index, 'fail');
            return false;
        }

        const now = Date.now();
        // If free or expired
        if (this.lockedBy === null || now > this.expireTime) {
            this.lockedBy = clientId;
            this.token = token;
            this.expireTime = now + ttl;
            this.updateUI();
            flashLine(clientId, this.index, 'success');
            return true;
        }

        flashLine(clientId, this.index, 'fail');
        return false;
    }

    // Release lock only if token matches (Redlock rule)
    async unlock(clientId, token) {
        drawPacketLine(clientId, this.index, `req-${clientId.toLowerCase()}`);
        await sleep(CONFIG.NETWORK_DELAY);

        if (this.isOffline) {
            flashLine(clientId, this.index, 'fail');
            return false;
        }

        if (this.lockedBy === clientId && this.token === token) {
            this.lockedBy = null;
            this.token = null;
            this.expireTime = 0;
            this.updateUI();
            flashLine(clientId, this.index, 'success');
            return true;
        }

        flashLine(clientId, this.index, 'fail');
        return false;
    }

    // Tick down the visual TTL
    tick(now) {
        if (this.isOffline) return;

        if (this.lockedBy !== null) {
            // Apply artificial clock drift (time moves 5x faster on this node)
            if (this.isDrifting) {
                // We fake drift by manually decreasing the expireTime faster
                this.expireTime -= (CONFIG.TICK_RATE * 4); 
            }

            if (now >= this.expireTime) {
                // Auto-expire
                this.lockedBy = null;
                this.token = null;
                this.updateUI();
            } else {
                // Update Progress Bar
                const remaining = this.expireTime - now;
                const pct = (remaining / CONFIG.LOCK_TTL) * 100;
                this.ttlFill.style.width = `${Math.max(0, pct)}%`;
            }
        }
    }

    updateUI() {
        if (this.isOffline) {
            this.el.className = 'redis-node offline';
            this.stateEl.textContent = 'OFFLINE';
            this.ttlFill.style.width = '0%';
        } else if (this.lockedBy === 'A') {
            this.el.className = 'redis-node locked-a';
            this.stateEl.textContent = 'LOCKED (A)';
        } else if (this.lockedBy === 'B') {
            this.el.className = 'redis-node locked-b';
            this.stateEl.textContent = 'LOCKED (B)';
        } else {
            this.el.className = 'redis-node';
            this.stateEl.textContent = 'FREE';
            this.ttlFill.style.width = '0%';
        }
        
        if (this.isDrifting) this.driftWarning.classList.remove('hidden');
        else this.driftWarning.classList.add('hidden');
    }

    togglePower() {
        this.isOffline = !this.isOffline;
        if (this.isOffline) {
            this.lockedBy = null;
            this.token = null;
        }
        this.updateUI();
    }
    
    toggleDrift() {
        this.isDrifting = !this.isDrifting;
        this.updateUI();
    }
}

// ==========================================
// 3. MICROSERVICE CLIENT CLASS
// ==========================================
class MicroserviceClient {
    constructor(id) {
        this.id = id;
        this.isPaused = false;
        this.activeLockToken = null;
        this.lockValidUntil = 0; // Local client understanding of TTL
        
        // UI
        this.statusEl = document.getElementById(`status${id}`);
        this.timerEl = document.getElementById(`timer${id}`);
        this.barEl = document.getElementById(`bar${id}`);
        this.logs = document.getElementById(`logs${id}`);
        this.btnLock = document.getElementById(`btnLock${id}`);
        this.btnUnlock = document.getElementById(`btnUnlock${id}`);
        this.btnPause = document.getElementById(`btnPause${id}`);
        
        this.bindEvents();
    }

    bindEvents() {
        this.btnLock.addEventListener('click', () => this.acquireLock());
        this.btnUnlock.addEventListener('click', () => this.releaseLock());
        this.btnPause.addEventListener('click', () => this.triggerGCPause());
    }

    log(msg, type = 'info') {
        const div = document.createElement('div');
        div.className = `log-line ${type}`;
        div.textContent = `> ${msg}`;
        this.logs.appendChild(div);
        this.logs.scrollTop = this.logs.scrollHeight;
    }

    // THE REDLOCK ALGORITHM IMPLEMENTATION
    async acquireLock() {
        if (this.isPaused) return;
        
        this.log("Initiating Redlock Algorithm...", "info");
        this.btnLock.disabled = true;
        
        // 1. Record start time
        const T1 = Date.now();
        
        // 2. Generate random token
        const token = Math.random().toString(36).substring(2, 10);
        let acquiredCount = 0;

        // 3. Request locks sequentially (or concurrently in JS via Promise.allSettled)
        const lockPromises = nodes.map(node => node.lock(this.id, token, CONFIG.LOCK_TTL));
        
        this.log("Sent LOCK requests to 5 nodes.");
        const results = await Promise.allSettled(lockPromises);
        
        results.forEach(res => {
            if (res.status === 'fulfilled' && res.value === true) acquiredCount++;
        });

        // 4. Record end time and calculate validity
        const T2 = Date.now();
        const elapsed = T2 - T1;
        const driftMargin = CONFIG.LOCK_TTL * CONFIG.DRIFT_FACTOR + 2; // +2ms standard safety
        const validity = CONFIG.LOCK_TTL - elapsed - driftMargin;

        this.log(`Received responses. Acquired ${acquiredCount}/${CONFIG.NUM_NODES}. Elapsed: ${elapsed}ms.`);

        // 5. Evaluate Quorum and Validity
        if (acquiredCount >= CONFIG.QUORUM && validity > 0) {
            // SUCCESS
            this.log(`Quorum reached! Lock ACQUIRED. Validity: ${Math.floor(validity)}ms.`, "success");
            this.activeLockToken = token;
            this.lockValidUntil = T2 + validity; // Local clock tracking
            this.updateUI('locked');
        } else {
            // FAILED - Must rollback
            this.log(`Failed to acquire lock. Rolling back...`, "error");
            // 6. Unlock any partial locks acquired
            this.releaseLock(token, true); 
            this.btnLock.disabled = false;
        }
    }

    async releaseLock(overrideToken = null, isRollback = false) {
        if (this.isPaused) return;
        const token = overrideToken || this.activeLockToken;
        if (!token) return;

        if (!isRollback) this.log("Initiating UNLOCK across cluster...", "info");
        this.btnUnlock.disabled = true;

        const unlockPromises = nodes.map(node => node.unlock(this.id, token));
        await Promise.allSettled(unlockPromises);

        if (!isRollback) {
            this.log("Lock successfully released.", "success");
            this.activeLockToken = null;
            this.lockValidUntil = 0;
            this.updateUI('free');
        }
    }

    async triggerGCPause() {
        if (this.isPaused) return;
        this.isPaused = true;
        this.log("CRITICAL: Heavy Garbage Collection running. Thread FROZEN for 6 seconds!", "error");
        
        this.statusEl.className = 'status-indicator paused';
        this.statusEl.innerHTML = '<i class="fas fa-snowflake"></i> GC Pause (Frozen)';
        this.btnLock.disabled = true;
        this.btnUnlock.disabled = true;
        this.btnPause.disabled = true;

        // Freeze for 6 seconds
        await sleep(6000);

        this.isPaused = false;
        this.btnPause.disabled = false;
        this.log("GC Pause finished. Thread un-frozen.", "info");
        
        // Split-Brain Mitigation check
        if (this.activeLockToken) {
            const now = Date.now();
            if (now > this.lockValidUntil) {
                this.log("WARNING: Local lock validity expired during pause! Halting task to prevent split-brain data corruption.", "error");
                this.activeLockToken = null;
                this.updateUI('free');
            } else {
                this.log(`Lock still valid for ${Math.floor(this.lockValidUntil - now)}ms. Resuming task.`, "success");
                this.updateUI('locked');
            }
        } else {
            this.updateUI('free');
        }
    }

    tick(now) {
        if (this.isPaused) return; // Client clock is frozen during GC

        if (this.activeLockToken) {
            const remaining = this.lockValidUntil - now;
            if (remaining <= 0) {
                // Client-side auto expire
                this.log("Local lock validity expired. Dropping lock state.", "error");
                this.activeLockToken = null;
                this.updateUI('free');
            } else {
                // Update local timer bar
                const pct = (remaining / CONFIG.LOCK_TTL) * 100;
                this.barEl.style.width = `${Math.max(0, pct)}%`;
            }
        }
    }

    updateUI(state) {
        if (state === 'locked') {
            this.statusEl.className = `status-indicator locked-${this.id.toLowerCase()}`;
            this.statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Lock Acquired';
            this.timerEl.classList.remove('hidden');
            this.btnLock.disabled = true;
            this.btnUnlock.disabled = false;
        } else {
            this.statusEl.className = 'status-indicator';
            this.statusEl.innerHTML = '<i class="fas fa-times-circle"></i> No Lock Acquired';
            this.timerEl.classList.add('hidden');
            this.btnLock.disabled = false;
            this.btnUnlock.disabled = true;
        }
    }
}

// ==========================================
// 4. MAIN ENGINE & SVG ROUTING
// ==========================================

const sleep = ms => new Promise(r => setTimeout(r, ms));

function initRedlockSimulator() {
    // Init Nodes
    for (let i = 0; i < CONFIG.NUM_NODES; i++) {
        nodes.push(new RedisNode(`R${i+1}`, i));
    }

    // Init Clients
    clients['A'] = new MicroserviceClient('A');
    clients['B'] = new MicroserviceClient('B');

    // Bind Node Controls
    document.querySelectorAll('.btn-icon').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = btn.dataset.action;
            const idx = parseInt(btn.dataset.node);
            if (action === 'toggle') nodes[idx].togglePower();
            if (action === 'drift') nodes[idx].toggleDrift();
        });
    });

    // Start Engine Loop
    engineTimer = setInterval(engineTick, CONFIG.TICK_RATE);
    
    // Draw initial empty SVG structure (Lines are drawn dynamically on request)
    window.addEventListener('resize', clearLines);
}

function engineTick() {
    const now = Date.now();
    // Tick all nodes
    nodes.forEach(n => n.tick(now));
    // Tick all clients
    clients['A'].tick(now);
    clients['B'].tick(now);
}

// --- SVG Animation System ---
function drawPacketLine(clientId, nodeIndex, styleClass) {
    const clientPanel = document.getElementById(`panel${clientId}`);
    const redisNode = document.getElementById(`node-${nodeIndex}`);
    const svgLayer = els.svgLayer;

    // Calculate Coordinates relative to SVG Layer
    const svgRect = svgLayer.getBoundingClientRect();
    const cRect = clientPanel.getBoundingClientRect();
    const rRect = redisNode.getBoundingClientRect();

    let startX, startY;
    
    if (clientId === 'A') {
        startX = cRect.right - svgRect.left;
        startY = cRect.top + (cRect.height / 2) - svgRect.top;
    } else {
        startX = cRect.left - svgRect.left;
        startY = cRect.top + (cRect.height / 2) - svgRect.top;
    }

    const endX = rRect.left + (rRect.width / 2) - svgRect.left;
    const endY = rRect.top + (rRect.height / 2) - svgRect.top;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const id = `line-${clientId}-${nodeIndex}-${Date.now()}`;
    path.setAttribute('id', id);
    path.setAttribute('class', `net-link ${styleClass}`);
    
    // Draw simple Bezier curve
    const offset = Math.abs(endX - startX) * 0.3;
    const d = `M ${startX} ${startY} C ${startX + (clientId==='A'?offset:-offset)} ${startY}, ${endX} ${endY - 50}, ${endX} ${endY}`;
    path.setAttribute('d', d);

    svgLayer.appendChild(path);

    // Remove line after network delay
    setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.remove();
    }, CONFIG.NETWORK_DELAY);
}

function flashLine(clientId, nodeIndex, resultClass) {
    const clientPanel = document.getElementById(`panel${clientId}`);
    const redisNode = document.getElementById(`node-${nodeIndex}`);
    const svgLayer = els.svgLayer;

    const svgRect = svgLayer.getBoundingClientRect();
    const cRect = clientPanel.getBoundingClientRect();
    const rRect = redisNode.getBoundingClientRect();

    let endX, endY;
    
    if (clientId === 'A') {
        endX = cRect.right - svgRect.left;
        endY = cRect.top + (cRect.height / 2) - svgRect.top;
    } else {
        endX = cRect.left - svgRect.left;
        endY = cRect.top + (cRect.height / 2) - svgRect.top;
    }

    const startX = rRect.left + (rRect.width / 2) - svgRect.left;
    const startY = rRect.top + (rRect.height / 2) - svgRect.top;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const id = `reply-${clientId}-${nodeIndex}-${Date.now()}`;
    path.setAttribute('id', id);
    path.setAttribute('class', `net-link ${resultClass}`);
    
    const offset = Math.abs(endX - startX) * 0.3;
    const d = `M ${startX} ${startY} C ${startX} ${startY - 50}, ${endX + (clientId==='A'?-offset:offset)} ${endY}, ${endX} ${endY}`;
    path.setAttribute('d', d);

    svgLayer.appendChild(path);

    setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.remove();
    }, CONFIG.NETWORK_DELAY);
}

function clearLines() {
    els.svgLayer.innerHTML = '';
}
