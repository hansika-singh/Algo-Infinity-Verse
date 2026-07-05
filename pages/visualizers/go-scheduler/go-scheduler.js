/**
 * go-scheduler.js
 * Visualizes the Go M:N Scheduler, Local/Global Run Queues, Work Stealing, and Blocking Syscalls.
 */

document.addEventListener("DOMContentLoaded", () => {
    initGoScheduler();
});

// ==========================================
// 1. SCHEDULER STATE & CLASSES
// ==========================================

const GOMAXPROCS = 4;
const MAX_LRQ_CAPACITY = 10; // Capped small for visual clarity

let gIdCounter = 1;
let mIdCounter = 1;

let globalQueue = [];
let processors = [];
let machinePool = []; // Idle Ms
let blockedMachines = []; // Ms blocked on Syscalls

let engineTimer = null;

class Goroutine {
    constructor(id) {
        this.id = id;
        this.state = 'RUNNABLE'; // RUNNABLE, RUNNING, BLOCKED, DEAD
        // Random work between 3 and 10 ticks
        this.workLeft = Math.floor(Math.random() * 8) + 3; 
    }
}

class Machine {
    constructor(id) {
        this.id = id;
        this.g = null; // Currently executing Goroutine
        this.processorId = null; // The P this M is attached to
    }
}

class Processor {
    constructor(id) {
        this.id = id;
        this.lrq = []; // Local Run Queue
        this.m = null; // Attached Machine (OS Thread)
        this.isStealing = false;
    }
}

// DOM Elements
const els = {
    btnSpawn1: document.getElementById('btnSpawn1'),
    btnSpawn10: document.getElementById('btnSpawn10'),
    btnBlockSyscall: document.getElementById('btnBlockSyscall'),
    speedSlider: document.getElementById('speedSlider'),
    
    statActiveG: document.getElementById('statActiveG'),
    statIdleM: document.getElementById('statIdleM'),
    logContainer: document.getElementById('logContainer'),
    
    globalQueue: document.getElementById('globalQueue'),
    gqCount: document.getElementById('gqCount'),
    gqEmpty: document.getElementById('gqEmpty'),
    
    blockedPool: document.getElementById('blockedPool'),
    blockedEmpty: document.getElementById('blockedEmpty')
};

// ==========================================
// 2. INITIALIZATION
// ==========================================
function initGoScheduler() {
    // 1. Initialize P's
    for (let i = 0; i < GOMAXPROCS; i++) {
        processors.push(new Processor(i));
    }
    
    // 2. Initialize initial M's and attach to P's
    for (let i = 0; i < GOMAXPROCS; i++) {
        const m = new Machine(mIdCounter++);
        attachMachineToProcessor(m, processors[i]);
    }

    bindEvents();
    
    // Start engine loop
    startEngineLoop();
    updateUI();
}

function bindEvents() {
    els.btnSpawn1.addEventListener('click', () => spawnGoroutines(1));
    els.btnSpawn10.addEventListener('click', () => spawnGoroutines(10));
    els.btnBlockSyscall.addEventListener('click', triggerBlockingSyscall);
    
    els.speedSlider.addEventListener('input', () => {
        startEngineLoop(); // Restarts interval with new speed
    });
}

function logSys(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = `> ${msg}`;
    els.logContainer.appendChild(div);
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

// ==========================================
// 3. CORE SCHEDULER LOGIC
// ==========================================

function spawnGoroutines(count) {
    let spawned = 0;
    for (let i = 0; i < count; i++) {
        const g = new Goroutine(gIdCounter++);
        
        // Logic: Try to put in a random P's LRQ if there's space.
        // If not, put in Global Queue.
        // In real Go, it tries to put it in the current P's queue, but we just distribute it.
        let placed = false;
        // Shuffle processors to distribute evenly
        const shuffledPs = [...processors].sort(() => 0.5 - Math.random());
        
        for (let p of shuffledPs) {
            if (p.lrq.length < MAX_LRQ_CAPACITY) {
                p.lrq.push(g);
                placed = true;
                break;
            }
        }
        
        if (!placed) {
            globalQueue.push(g);
        }
        spawned++;
    }
    
    logSys(`Spawned ${spawned} Goroutine(s).`, 'spawn');
    updateUI();
}

function attachMachineToProcessor(m, p) {
    m.processorId = p.id;
    p.m = m;
}

function getIdleMachine() {
    if (machinePool.length > 0) {
        return machinePool.shift();
    }
    // OS creates a new thread if needed
    return new Machine(mIdCounter++);
}

function triggerBlockingSyscall() {
    // Find a P that has an M running a G
    const activePs = processors.filter(p => p.m && p.m.g);
    if (activePs.length === 0) {
        logSys("No running Goroutines to block.", "err");
        return;
    }
    
    // Pick random active P
    const p = activePs[Math.floor(Math.random() * activePs.length)];
    const m = p.m;
    const g = m.g;
    
    // 1. Block the G
    g.state = 'BLOCKED';
    
    // 2. Detach M from P and move to blocked pool
    m.processorId = null;
    p.m = null;
    blockedMachines.push(m);
    
    // 3. P needs a new M to continue executing its LRQ
    const newM = getIdleMachine();
    attachMachineToProcessor(newM, p);
    
    logSys(`G${g.id} made blocking syscall! M${m.id} detached from P${p.id}. New M${newM.id} attached.`, 'block');
    updateUI();
    
    // Simulate I/O completion after a random time
    setTimeout(() => {
        resolveSyscall(m);
    }, Math.random() * 3000 + 2000); // 2-5 seconds
}

function resolveSyscall(m) {
    const g = m.g;
    g.state = 'RUNNABLE';
    
    // Remove M from blocked pool
    blockedMachines = blockedMachines.filter(bm => bm.id !== m.id);
    
    // 1. Put G in Global Queue
    globalQueue.push(g);
    m.g = null;
    
    // 2. Park M in idle pool
    machinePool.push(m);
    
    logSys(`Syscall done for G${g.id}. G moved to Global Queue. M${m.id} parked in idle pool.`, 'sys');
    updateUI();
}

function startEngineLoop() {
    if (engineTimer) clearInterval(engineTimer);
    const speed = parseInt(els.speedSlider.value);
    engineTimer = setInterval(schedulerTick, speed);
}

/**
 * The Heart of the Visualizer: The Scheduler Tick
 */
function schedulerTick() {
    let uiNeedsUpdate = false;

    // 1. Processors Execute their M's
    processors.forEach(p => {
        p.isStealing = false; // Reset steal flag
        
        if (!p.m) {
            // Unlikely in our sim, but grab an M if naked
            const newM = getIdleMachine();
            attachMachineToProcessor(newM, p);
            uiNeedsUpdate = true;
        }

        const m = p.m;

        // If M has a G, execute it
        if (m.g) {
            m.g.workLeft--;
            if (m.g.workLeft <= 0) {
                logSys(`G${m.g.id} finished execution.`, 'done');
                m.g = null; // G dies
                uiNeedsUpdate = true;
            }
        } 
        // If M doesn't have a G, P needs to find work
        else {
            findWork(p);
            uiNeedsUpdate = true; // State probably changed
        }
    });

    if (uiNeedsUpdate) updateUI();
}

function findWork(p) {
    // Rule 1: Check Local Run Queue (LRQ)
    if (p.lrq.length > 0) {
        p.m.g = p.lrq.shift();
        p.m.g.state = 'RUNNING';
        return;
    }

    // Rule 2: Check Global Queue (GQ)
    if (globalQueue.length > 0) {
        // Take 1 for execution, and move a batch to LRQ
        p.m.g = globalQueue.shift();
        p.m.g.state = 'RUNNING';
        
        // Move up to half of LRQ capacity from GQ to LRQ to balance
        const transferCount = Math.min(globalQueue.length, Math.floor(MAX_LRQ_CAPACITY / 2));
        for(let i=0; i<transferCount; i++) {
            p.lrq.push(globalQueue.shift());
        }
        
        logSys(`P${p.id} pulled work from Global Queue.`, 'sys');
        return;
    }

    // Rule 3: WORK STEALING
    // Look at other Ps. Find one with the most Gs in LRQ.
    let targetP = null;
    let maxLen = 1; // Must have at least 2 to steal

    processors.forEach(otherP => {
        if (otherP.id !== p.id && otherP.lrq.length > maxLen) {
            maxLen = otherP.lrq.length;
            targetP = otherP;
        }
    });

    if (targetP) {
        // Steal half of the target's LRQ
        const stealCount = Math.floor(targetP.lrq.length / 2);
        const stolenGs = targetP.lrq.splice(targetP.lrq.length - stealCount, stealCount);
        
        // First one goes to execution
        p.m.g = stolenGs.shift();
        p.m.g.state = 'RUNNING';
        
        // Rest go to LRQ
        p.lrq.push(...stolenGs);
        
        p.isStealing = true;
        logSys(`P${p.id} STOLE ${stealCount} G(s) from P${targetP.id}!`, 'steal');
    }
}

// ==========================================
// 4. UI RENDERING
// ==========================================

function updateUI() {
    renderGlobalQueue();
    renderProcessors();
    renderBlockedPool();
    updateTelemetry();
}

function createGNode(g) {
    const div = document.createElement('div');
    div.className = `g-node ${g.state === 'RUNNING' ? 'running' : ''} ${g.state === 'BLOCKED' ? 'blocked' : ''}`;
    div.textContent = `G${g.id}`;
    return div;
}

function renderGlobalQueue() {
    els.globalQueue.innerHTML = '';
    els.gqCount.textContent = globalQueue.length;
    
    if (globalQueue.length === 0) {
        els.gqEmpty.style.display = 'block';
    } else {
        els.gqEmpty.style.display = 'none';
        // Render max 20 to avoid DOM lag
        const limit = Math.min(globalQueue.length, 20);
        for (let i = 0; i < limit; i++) {
            els.globalQueue.appendChild(createGNode(globalQueue[i]));
        }
        if (globalQueue.length > limit) {
            const more = document.createElement('div');
            more.className = 'g-node';
            more.style.background = 'transparent';
            more.style.borderStyle = 'dashed';
            more.style.color = '#94a3b8';
            more.textContent = `+${globalQueue.length - limit}`;
            els.globalQueue.appendChild(more);
        }
    }
}

function renderProcessors() {
    processors.forEach(p => {
        const pCard = document.getElementById(`P${p.id}`);
        
        // Stealing state
        if (p.isStealing) pCard.classList.add('stealing');
        else pCard.classList.remove('stealing');

        // Render M Slot
        const mSlot = document.getElementById(`M-slot-P${p.id}`);
        mSlot.innerHTML = '';
        if (p.m) {
            const mNode = document.createElement('div');
            mNode.className = `m-node ${p.m.g ? 'active' : ''}`;
            
            let gHtml = p.m.g ? `<div class="g-node running">G${p.m.g.id}</div>` : `<span style="color:#64748b">Idle</span>`;
            mNode.innerHTML = `<span>M${p.m.id}</span> ${gHtml}`;
            mSlot.appendChild(mNode);
        }

        // Render LRQ
        const lrqContainer = document.getElementById(`lrq-P${p.id}`);
        lrqContainer.innerHTML = '';
        p.lrq.forEach(g => {
            lrqContainer.appendChild(createGNode(g));
        });
    });
}

function renderBlockedPool() {
    els.blockedPool.innerHTML = '';
    
    if (blockedMachines.length === 0) {
        els.blockedEmpty.style.display = 'block';
    } else {
        els.blockedEmpty.style.display = 'none';
        blockedMachines.forEach(m => {
            const div = document.createElement('div');
            div.className = 'blocked-m';
            div.innerHTML = `<span>M${m.id}</span> <i class="fas fa-lock" style="color:var(--go-warning); font-size:0.7rem;"></i>`;
            if (m.g) {
                div.appendChild(createGNode(m.g));
            }
            els.blockedPool.appendChild(div);
        });
    }
}

function updateTelemetry() {
    // Total active Gs = Global Queue + All LRQs + Running Gs + Blocked Gs
    let activeG = globalQueue.length;
    processors.forEach(p => {
        activeG += p.lrq.length;
        if (p.m && p.m.g) activeG++;
    });
    blockedMachines.forEach(m => {
        if (m.g) activeG++;
    });
    
    els.statActiveG.textContent = activeG;
    els.statIdleM.textContent = machinePool.length;
}
