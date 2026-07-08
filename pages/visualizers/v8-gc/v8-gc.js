/**
 * v8-gc.js
 * Implements a simulation of the V8 JavaScript Engine's Memory Heap.
 * Features:
 * - Young Generation (Eden, Survivor 0, Survivor 1)
 * - Old Generation
 * - Cheney's Copying Algorithm (Minor GC / Scavenger)
 * - Mark-Sweep-Compact (Major GC)
 * - Object Tenuring
 */

document.addEventListener("DOMContentLoaded", () => {
    initV8GC();
});

// ==========================================
// 1. MEMORY ENGINE CONFIG & STATE
// ==========================================

const CAPACITIES = {
    EDEN: 8,
    S0: 4,
    S1: 4,
    OLD: 24
};

const AGE_THRESHOLD = 2; // Age at which objects are promoted to Old Gen

let heap = {
    eden: new Array(CAPACITIES.EDEN).fill(null),
    s0: new Array(CAPACITIES.S0).fill(null),
    s1: new Array(CAPACITIES.S1).fill(null),
    old: new Array(CAPACITIES.OLD).fill(null)
};

let state = {
    objIdCounter: 1,
    activeSurvivor: 's0', // 's0' is To-Space, 's1' is From-Space initially
    isGCRunning: false,
    
    // Telemetry
    stats: {
        minorGCs: 0,
        majorGCs: 0,
        tenured: 0,
        garbageCollected: 0
    }
};

class MemoryObject {
    constructor() {
        this.id = state.objIdCounter++;
        this.age = 0;
        this.isLive = true; // Simulating "Reachable from Root"
        this.isTenured = false;
    }
}

// DOM Elements
const els = {
    btnAllocate: document.getElementById('btnAllocate'),
    btnAllocBatch: document.getElementById('btnAllocBatch'),
    btnMinorGC: document.getElementById('btnMinorGC'),
    btnMajorGC: document.getElementById('btnMajorGC'),
    
    logContainer: document.getElementById('logContainer'),
    engineBadge: document.getElementById('engineBadge'),
    
    slotsEden: document.getElementById('slotsEden'),
    slotsS0: document.getElementById('slotsS0'),
    slotsS1: document.getElementById('slotsS1'),
    slotsOld: document.getElementById('slotsOld'),
    
    capEden: document.getElementById('capEden'),
    capS0: document.getElementById('capS0'),
    capS1: document.getElementById('capS1'),
    capOld: document.getElementById('capOld'),
    
    spaceS0: document.getElementById('spaceS0'),
    spaceS1: document.getElementById('spaceS1'),
    roleS0: document.getElementById('roleS0'),
    roleS1: document.getElementById('roleS1'),
    
    statMinorGC: document.getElementById('statMinorGC'),
    statMajorGC: document.getElementById('statMajorGC'),
    statTenured: document.getElementById('statTenured'),
    statGarbage: document.getElementById('statGarbage')
};

// ==========================================
// 2. INITIALIZATION
// ==========================================

function initV8GC() {
    bindEvents();
    initDOMSlots();
    updateUI();
}

function bindEvents() {
    els.btnAllocate.addEventListener('click', () => allocate(1));
    els.btnAllocBatch.addEventListener('click', () => allocate(4));
    els.btnMinorGC.addEventListener('click', () => runMinorGC(false));
    els.btnMajorGC.addEventListener('click', runMajorGC);
}

function logMsg(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = `> ${msg}`;
    els.logContainer.appendChild(div);
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function lockUI(locked, badgeType = 'active', badgeText = 'V8 Heap Manager: Active') {
    state.isGCRunning = locked;
    els.btnAllocate.disabled = locked;
    els.btnAllocBatch.disabled = locked;
    els.btnMinorGC.disabled = locked;
    els.btnMajorGC.disabled = locked;
    
    els.engineBadge.className = `engine-badge ${locked ? badgeType : ''}`;
    els.engineBadge.innerHTML = `<i class="fas ${locked ? 'fa-cog fa-spin' : 'fa-memory'}"></i> ${badgeText}`;
}

// ==========================================
// 3. ALLOCATION LOGIC
// ==========================================

async function allocate(count) {
    if (state.isGCRunning) return;

    let allocatedCount = 0;
    
    for (let i = 0; i < count; i++) {
        // Find empty slot in Eden
        const emptyIdx = heap.eden.findIndex(obj => obj === null);
        
        if (emptyIdx === -1) {
            logMsg(`Eden space full. Triggering automatic Minor GC...`, 'minor');
            await runMinorGC(true); // Auto triggered
            
            // Try again after GC
            const retryIdx = heap.eden.findIndex(obj => obj === null);
            if (retryIdx === -1) {
                logMsg(`Allocation failed. Nursery is completely full of live objects!`, 'error');
                break;
            } else {
                heap.eden[retryIdx] = new MemoryObject();
                allocatedCount++;
            }
        } else {
            heap.eden[emptyIdx] = new MemoryObject();
            allocatedCount++;
        }
    }
    
    if (allocatedCount > 0) {
        logMsg(`Allocated ${allocatedCount} new object(s) in Eden Space.`, 'alloc');
        // Randomly simulate some objects dying immediately to make the GC visually interesting
        simulateAgingAndDeath();
        updateUI();
    }
}

// Gives objects a chance to lose their root reference (turn into garbage)
function simulateAgingAndDeath() {
    const deathChance = 0.3; // 30% chance to die
    
    const killRandom = (space) => {
        space.forEach(obj => {
            if (obj && obj.isLive && Math.random() < deathChance) {
                obj.isLive = false;
            }
        });
    };
    
    killRandom(heap.eden);
    killRandom(heap[state.activeSurvivor === 's0' ? 's1' : 's0']); // The From-space
    killRandom(heap.old);
}

// Manual user toggle to kill an object
function toggleObjectLiveness(objId) {
    if (state.isGCRunning) return;
    
    const toggleInSpace = (space) => {
        const obj = space.find(o => o && o.id === objId);
        if (obj) {
            obj.isLive = !obj.isLive;
            if (!obj.isLive) logMsg(`Obj#${obj.id} reference severed. Now garbage.`, 'sys');
            else logMsg(`Obj#${obj.id} reference restored.`, 'sys');
            return true;
        }
        return false;
    };
    
    if (toggleInSpace(heap.eden)) return updateUI();
    if (toggleInSpace(heap.s0)) return updateUI();
    if (toggleInSpace(heap.s1)) return updateUI();
    if (toggleInSpace(heap.old)) return updateUI();
}

// ==========================================
// 4. MINOR GC (SCAVENGER - CHENEY's ALGORITHM)
// ==========================================

async function runMinorGC(isAuto = false) {
    if (state.isGCRunning) return;
    lockUI(true, 'minor', 'Scavenger (Minor GC) Running...');
    
    if (!isAuto) logMsg("Manual Minor GC Triggered.", "minor");
    state.stats.minorGCs++;

    // 1. Identify From-Space and To-Space
    const fromSpaceKey = state.activeSurvivor === 's0' ? 's1' : 's0';
    const toSpaceKey = state.activeSurvivor; // The currently empty one
    
    const fromSpace = heap[fromSpaceKey];
    const toSpace = heap[toSpaceKey];
    
    document.getElementById('spaceEden').classList.add('scavenge-flash');
    document.getElementById(`space${fromSpaceKey.toUpperCase()}`).classList.add('scavenge-flash');

    await sleep(500);

    // 2. Process Eden and From-Space
    let garbageCollected = 0;
    const objectsToProcess = [...heap.eden, ...fromSpace].filter(obj => obj !== null);
    
    // Clear the spaces conceptually (we will rebuild them)
    heap.eden = new Array(CAPACITIES.EDEN).fill(null);
    heap[fromSpaceKey] = new Array(CAPACITIES[fromSpaceKey.toUpperCase()]).fill(null);
    
    let toSpaceIdx = 0;
    
    for (const obj of objectsToProcess) {
        if (!obj.isLive) {
            // Garbage! Sweep it.
            garbageCollected++;
            state.stats.garbageCollected++;
            // Visually trigger destruction (handled by re-render dropping them)
        } else {
            // Live object. Survive!
            obj.age++;
            
            if (obj.age >= AGE_THRESHOLD) {
                // Tenure to Old Gen
                const oldIdx = heap.old.findIndex(o => o === null);
                if (oldIdx !== -1) {
                    obj.isTenured = true;
                    heap.old[oldIdx] = obj;
                    state.stats.tenured++;
                    logMsg(`Obj#${obj.id} promoted to Old Generation (Age ${obj.age}).`, 'tenure');
                } else {
                    // Old Gen is full during minor GC! Force Major GC later.
                    logMsg(`Old Gen full! Obj#${obj.id} stuck in To-Space.`, 'error');
                    // Fallback to To-Space if room
                    if (toSpaceIdx < CAPACITIES[toSpaceKey.toUpperCase()]) {
                        toSpace[toSpaceIdx++] = obj;
                    }
                }
            } else {
                // Move to To-Space
                if (toSpaceIdx < CAPACITIES[toSpaceKey.toUpperCase()]) {
                    toSpace[toSpaceIdx++] = obj;
                } else {
                    logMsg(`Survivor space full! Prematurely tenuring Obj#${obj.id}.`, 'warn');
                    // Premature tenuring
                    const oldIdx = heap.old.findIndex(o => o === null);
                    if (oldIdx !== -1) {
                        obj.isTenured = true;
                        heap.old[oldIdx] = obj;
                        state.stats.tenured++;
                    }
                }
            }
        }
    }

    logMsg(`Minor GC Swept ${garbageCollected} dead objects.`, 'success');
    updateTelemetry();
    updateUI(); // Reflect movements
    
    await sleep(800);

    // 3. Swap roles of Survivor spaces
    state.activeSurvivor = fromSpaceKey; // Swap
    
    // Swap Roles visually
    els.spaceS0.classList.remove('active-to', 'active-from');
    els.spaceS1.classList.remove('active-to', 'active-from');
    
    if (state.activeSurvivor === 's0') {
        els.spaceS0.classList.add('active-to');
        els.spaceS1.classList.add('active-from');
        els.roleS0.textContent = 'To-Space';
        els.roleS1.textContent = 'From-Space';
    } else {
        els.spaceS0.classList.add('active-from');
        els.spaceS1.classList.add('active-to');
        els.roleS0.textContent = 'From-Space';
        els.roleS1.textContent = 'To-Space';
    }

    document.getElementById('spaceEden').classList.remove('scavenge-flash');
    document.getElementById(`space${fromSpaceKey.toUpperCase()}`).classList.remove('scavenge-flash');

    // Check if Old Gen is critically full to trigger auto Major GC
    const oldGenUsed = heap.old.filter(o => o !== null).length;
    if (oldGenUsed >= CAPACITIES.OLD) {
        logMsg("Old Generation full. Triggering automatic Major GC...", "major");
        await sleep(500);
        await runMajorGC(true);
    } else {
        lockUI(false);
    }
}

// ==========================================
// 5. MAJOR GC (MARK-SWEEP-COMPACT)
// ==========================================

async function runMajorGC(isAuto = false) {
    if (state.isGCRunning && !isAuto) return;
    lockUI(true, 'major', 'Mark-Compact (Major GC) Running...');
    
    if (!isAuto) logMsg("Manual Major GC Triggered. Scanning Old Generation...", "major");
    state.stats.majorGCs++;

    const spaceOld = document.getElementById('spaceOld');
    spaceOld.classList.add('mark-compact-flash');

    await sleep(600);

    // Mark Phase (Identify Dead) & Sweep
    let garbageCollected = 0;
    const liveObjects = [];

    // Visualize the sweep
    for (let i = 0; i < CAPACITIES.OLD; i++) {
        const obj = heap.old[i];
        if (obj) {
            if (!obj.isLive) {
                // Visualize destruction
                const domObj = document.getElementById(`obj-${obj.id}`);
                if (domObj) domObj.classList.add('sweeping');
                garbageCollected++;
                state.stats.garbageCollected++;
            } else {
                liveObjects.push(obj);
            }
        }
    }

    await sleep(500);

    // Compact Phase (Shift left)
    heap.old = new Array(CAPACITIES.OLD).fill(null);
    for (let i = 0; i < liveObjects.length; i++) {
        heap.old[i] = liveObjects[i];
    }

    logMsg(`Major GC Swept ${garbageCollected} dead objects and compacted memory.`, 'success');
    
    updateTelemetry();
    updateUI(); // Render compacted state
    
    spaceOld.classList.remove('mark-compact-flash');
    lockUI(false);
}

// ==========================================
// 6. UI RENDERING
// ==========================================

function initDOMSlots() {
    const createSlots = (container, count, prefix) => {
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const slot = document.createElement('div');
            slot.className = 'mem-slot';
            slot.id = `slot-${prefix}-${i}`;
            container.appendChild(slot);
        }
    };
    
    createSlots(els.slotsEden, CAPACITIES.EDEN, 'eden');
    createSlots(els.slotsS0, CAPACITIES.S0, 's0');
    createSlots(els.slotsS1, CAPACITIES.S1, 's1');
    createSlots(els.slotsOld, CAPACITIES.OLD, 'old');
}

function updateUI() {
    renderSpace(heap.eden, 'eden', els.slotsEden, els.capEden);
    renderSpace(heap.s0, 's0', els.slotsS0, els.capS0);
    renderSpace(heap.s1, 's1', els.slotsS1, els.capS1);
    renderSpace(heap.old, 'old', els.slotsOld, els.capOld);
    updateTelemetry();
}

function renderSpace(spaceArray, prefix, containerEl, capEl) {
    let usedCount = 0;
    
    for (let i = 0; i < spaceArray.length; i++) {
        const slotEl = document.getElementById(`slot-${prefix}-${i}`);
        slotEl.innerHTML = ''; // Clear slot
        
        const obj = spaceArray[i];
        if (obj) {
            usedCount++;
            
            // Build Object Element
            const objEl = document.createElement('div');
            let classes = 'v8-object';
            if (obj.isLive) {
                classes += obj.isTenured ? ' tenured' : ' live';
            } else {
                classes += ' dead';
            }
            objEl.className = classes;
            objEl.id = `obj-${obj.id}`;
            
            objEl.innerHTML = `
                <span class="obj-id">#${obj.id}</span>
                <span class="obj-age">Age ${obj.age}</span>
            `;
            
            // Interaction to kill object
            objEl.addEventListener('click', () => toggleObjectLiveness(obj.id));
            
            slotEl.appendChild(objEl);
        }
    }
    
    capEl.textContent = `${usedCount}/${spaceArray.length}`;
}

function updateTelemetry() {
    els.statMinorGC.textContent = state.stats.minorGCs;
    els.statMajorGC.textContent = state.stats.majorGCs;
    els.statTenured.textContent = state.stats.tenured;
    els.statGarbage.textContent = state.stats.garbageCollected;
}
