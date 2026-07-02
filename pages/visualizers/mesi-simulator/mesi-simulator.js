/**
 * mesi-simulator.js
 * Implements the MESI (Modified, Exclusive, Shared, Invalid) cache coherence protocol.
 * Simulates a multi-core processor motherboard communicating over a shared system bus.
 */

document.addEventListener("DOMContentLoaded", () => {
    initMESISimulator();
});

// ==========================================
// 1. ENGINE STATE & CONFIG
// ==========================================
const STATES = {
    M: 'M', // Modified
    E: 'E', // Exclusive
    S: 'S', // Shared
    I: 'I'  // Invalid
};

// Main Memory: 4 Addresses for simplicity
let MainMemory = {
    0: "AA",
    1: "BB",
    2: "CC",
    3: "DD"
};

// 4 CPUs, each with 4 cache lines (Direct mapped 1:1 for simplicity)
// Array of CPUs. Each CPU has lines[0..3]
let CPUs = [
    { id: 0, lines: [{state: STATES.I, data: "--"}, {state: STATES.I, data: "--"}, {state: STATES.I, data: "--"}, {state: STATES.I, data: "--"}] },
    { id: 1, lines: [{state: STATES.I, data: "--"}, {state: STATES.I, data: "--"}, {state: STATES.I, data: "--"}, {state: STATES.I, data: "--"}] },
    { id: 2, lines: [{state: STATES.I, data: "--"}, {state: STATES.I, data: "--"}, {state: STATES.I, data: "--"}, {state: STATES.I, data: "--"}] },
    { id: 3, lines: [{state: STATES.I, data: "--"}, {state: STATES.I, data: "--"}, {state: STATES.I, data: "--"}, {state: STATES.I, data: "--"}] }
];

let isExecuting = false;

// DOM Elements
const els = {
    selCore: document.getElementById('selCore'),
    selAddress: document.getElementById('selAddress'),
    inputData: document.getElementById('inputData'),
    btnRead: document.getElementById('btnRead'),
    btnWrite: document.getElementById('btnWrite'),
    
    logContainer: document.getElementById('logContainer'),
    engineBadge: document.getElementById('engineBadge'),
    busSvg: document.getElementById('busSvg'),
    
    sysBusNode: document.getElementById('system-bus'),
    mainMemNode: document.getElementById('main-memory')
};

// ==========================================
// 2. INITIALIZATION
// ==========================================
function initMESISimulator() {
    bindEvents();
    
    // Draw initial SVG lines
    window.addEventListener('resize', drawBusLines);
    // Slight delay to ensure DOM is painted
    setTimeout(drawBusLines, 100);
}

function bindEvents() {
    els.btnRead.addEventListener('click', async () => {
        if (isExecuting) return;
        const cpuId = parseInt(els.selCore.value);
        const addr = parseInt(els.selAddress.value);
        await executeRead(cpuId, addr);
    });

    els.btnWrite.addEventListener('click', async () => {
        if (isExecuting) return;
        const cpuId = parseInt(els.selCore.value);
        const addr = parseInt(els.selAddress.value);
        let data = els.inputData.value.trim().toUpperCase();
        
        // Validate Hex
        if (!/^[0-9A-F]{1,2}$/.test(data)) {
            return alert("Please enter valid 1 or 2 digit Hex data (e.g. FF).");
        }
        if (data.length === 1) data = "0" + data; // Pad to 2 chars

        await executeWrite(cpuId, addr, data);
        els.inputData.value = ''; // Reset
    });
}

function logMsg(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = `> ${msg}`;
    els.logContainer.appendChild(div);
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function lockUI(locked) {
    isExecuting = locked;
    els.btnRead.disabled = locked;
    els.btnWrite.disabled = locked;
    
    if (locked) {
        els.engineBadge.classList.add('active');
        els.engineBadge.innerHTML = '<i class="fas fa-cog fa-spin"></i> Processing...';
    } else {
        els.engineBadge.classList.remove('active');
        els.engineBadge.innerHTML = '<i class="fas fa-microchip"></i> Hardware Bus: Idle';
        
        // Clear all animations
        document.querySelectorAll('.active-cpu, .active-bus, .active-mem').forEach(el => {
            el.classList.remove('active-cpu', 'active-bus', 'active-mem');
        });
        document.querySelectorAll('.bus-line').forEach(el => {
            el.classList.remove('active', 'invalidating');
        });
    }
}

// ==========================================
// 3. MESI PROTOCOL IMPLEMENTATION
// ==========================================

async function executeRead(cpuId, addr) {
    lockUI(true);
    const hexAddr = `0x0${addr}`;
    logMsg(`[CPU ${cpuId}] Initiating READ for ${hexAddr}`, 'req');
    
    // Highlight CPU
    const cpuEl = document.getElementById(`cpu-${cpuId}`);
    cpuEl.classList.add('active-cpu');
    await sleep(400);

    const line = CPUs[cpuId].lines[addr];

    if (line.state === STATES.M || line.state === STATES.E || line.state === STATES.S) {
        // --- CACHE HIT ---
        logMsg(`[CPU ${cpuId}] L1 Cache HIT. State: ${line.state}. Data: ${line.data}`, 'req');
        flashCacheRow(cpuId, addr);
        await sleep(600);
    } else {
        // --- CACHE MISS ---
        logMsg(`[CPU ${cpuId}] L1 Cache MISS. State: I.`, 'err');
        await sleep(400);
        
        logMsg(`[CPU ${cpuId}] Broadcasting BusRd (Read Request)...`, 'req');
        animateBus(cpuId, 'active');
        els.sysBusNode.classList.add('active-bus');
        await sleep(600);

        // Snoop other caches
        let providedByOtherCache = false;

        for (let i = 0; i < 4; i++) {
            if (i === cpuId) continue;
            
            const otherLine = CPUs[i].lines[addr];
            if (otherLine.state !== STATES.I) {
                // Highlight snooping CPU
                document.getElementById(`cpu-${i}`).classList.add('active-cpu');
                animateBus(i, 'active');
                
                if (otherLine.state === STATES.M) {
                    logMsg(`[CPU ${i}] Snoops BusRd. Has modified data! Flushing to Memory.`, 'snoop');
                    
                    // Flush to memory
                    animateBus('mem', 'active');
                    els.mainMemNode.classList.add('active-mem');
                    await sleep(600);
                    
                    MainMemory[addr] = otherLine.data;
                    updateMainMemoryUI(addr);
                    logMsg(`[Memory] Updated ${hexAddr} to ${MainMemory[addr]}`, 'mem');
                    
                    // Standard MESI: Down-grades M to S after another CPU reads it
                    otherLine.state = STATES.S;
                    updateCacheUI(i, addr);
                    logMsg(`[CPU ${i}] Downgraded to Shared (S).`, 'snoop');
                } 
                else if (otherLine.state === STATES.E) {
                    logMsg(`[CPU ${i}] Snoops BusRd. Has exclusive data. Downgrading to Shared (S).`, 'snoop');
                    otherLine.state = STATES.S;
                    updateCacheUI(i, addr);
                }
                else if (otherLine.state === STATES.S) {
                    logMsg(`[CPU ${i}] Snoops BusRd. Copies provided to bus.`, 'snoop');
                }

                // Data is provided over bus
                providedByOtherCache = true;
                line.data = otherLine.data;
                line.state = STATES.S; // Becomes Shared
                
                await sleep(600);
                document.getElementById(`cpu-${i}`).classList.remove('active-cpu');
                // Don't break, technically all might snoop, though only one needs to provide.
                break; 
            }
        }

        if (!providedByOtherCache) {
            // Fetch from Main Memory
            logMsg(`[Bus] No caches have valid data. Fetching from Main Memory.`, 'sys');
            animateBus('mem', 'active');
            els.mainMemNode.classList.add('active-mem');
            await sleep(600);
            
            line.data = MainMemory[addr];
            line.state = STATES.E; // Exclusive because no one else has it
            logMsg(`[Memory] Provided data ${line.data} to CPU ${cpuId}.`, 'mem');
        } else {
            logMsg(`[CPU ${cpuId}] Received data ${line.data} via Cache-to-Cache transfer.`, 'req');
        }

        // Store in Requester Cache
        updateCacheUI(cpuId, addr);
        flashCacheRow(cpuId, addr);
        logMsg(`[CPU ${cpuId}] Stored ${hexAddr} as State: ${line.state}.`, 'req');
        await sleep(800);
    }

    lockUI(false);
}

async function executeWrite(cpuId, addr, data) {
    lockUI(true);
    const hexAddr = `0x0${addr}`;
    logMsg(`[CPU ${cpuId}] Initiating WRITE for ${hexAddr} with Data: ${data}`, 'req');
    
    // Highlight CPU
    const cpuEl = document.getElementById(`cpu-${cpuId}`);
    cpuEl.classList.add('active-cpu');
    await sleep(400);

    const line = CPUs[cpuId].lines[addr];

    if (line.state === STATES.M) {
        // --- WRITE HIT (M) ---
        logMsg(`[CPU ${cpuId}] Cache HIT (Modified). Writing locally without bus traffic.`, 'req');
        line.data = data;
        updateCacheUI(cpuId, addr);
        flashCacheRow(cpuId, addr);
        await sleep(600);
    } 
    else if (line.state === STATES.E) {
        // --- WRITE HIT (E) ---
        logMsg(`[CPU ${cpuId}] Cache HIT (Exclusive). Writing locally. Upgrading to Modified (M).`, 'req');
        line.data = data;
        line.state = STATES.M;
        updateCacheUI(cpuId, addr);
        flashCacheRow(cpuId, addr);
        await sleep(600);
    }
    else if (line.state === STATES.S) {
        // --- WRITE HIT (S) ---
        logMsg(`[CPU ${cpuId}] Cache HIT (Shared). Broadcasting BusUpgr (Invalidate)...`, 'req');
        animateBus(cpuId, 'invalidating');
        els.sysBusNode.classList.add('active-bus');
        await sleep(600);

        // Invalidate others
        await broadcastInvalidate(cpuId, addr);

        logMsg(`[CPU ${cpuId}] Upgrading to Modified (M) and writing data.`, 'req');
        line.data = data;
        line.state = STATES.M;
        updateCacheUI(cpuId, addr);
        flashCacheRow(cpuId, addr);
        await sleep(600);
    }
    else {
        // --- WRITE MISS (I) ---
        logMsg(`[CPU ${cpuId}] L1 Cache MISS. Broadcasting BusRdX (Read-for-Ownership)...`, 'err');
        animateBus(cpuId, 'invalidating');
        els.sysBusNode.classList.add('active-bus');
        await sleep(600);

        // Snoop other caches
        let providedByOtherCache = false;

        for (let i = 0; i < 4; i++) {
            if (i === cpuId) continue;
            
            const otherLine = CPUs[i].lines[addr];
            if (otherLine.state !== STATES.I) {
                document.getElementById(`cpu-${i}`).classList.add('active-cpu');
                animateBus(i, 'invalidating');
                
                if (otherLine.state === STATES.M) {
                    logMsg(`[CPU ${i}] Snoops BusRdX. Flushing modified data to memory and Invalidating.`, 'snoop');
                    
                    animateBus('mem', 'active');
                    els.mainMemNode.classList.add('active-mem');
                    await sleep(600);
                    
                    MainMemory[addr] = otherLine.data;
                    updateMainMemoryUI(addr);
                    providedByOtherCache = true;
                } else {
                    logMsg(`[CPU ${i}] Snoops BusRdX. Invalidating local copy.`, 'inv');
                }

                otherLine.state = STATES.I;
                otherLine.data = "--";
                updateCacheUI(i, addr);
                await sleep(500);
                document.getElementById(`cpu-${i}`).classList.remove('active-cpu');
            }
        }

        if (!providedByOtherCache) {
            // Memory must provide the old data block (Simulating cache line fetch before overwrite)
            logMsg(`[Bus] Fetching cache line from Main Memory before modifying.`, 'sys');
            animateBus('mem', 'active');
            els.mainMemNode.classList.add('active-mem');
            await sleep(600);
        }

        // Finally, perform write locally
        logMsg(`[CPU ${cpuId}] Cache line secured. Writing new data and setting to Modified (M).`, 'req');
        line.data = data;
        line.state = STATES.M;
        updateCacheUI(cpuId, addr);
        flashCacheRow(cpuId, addr);
        await sleep(800);
    }

    lockUI(false);
}

async function broadcastInvalidate(requesterId, addr) {
    for (let i = 0; i < 4; i++) {
        if (i === requesterId) continue;
        
        const otherLine = CPUs[i].lines[addr];
        if (otherLine.state === STATES.S) {
            document.getElementById(`cpu-${i}`).classList.add('active-cpu');
            animateBus(i, 'invalidating');
            await sleep(400);
            
            logMsg(`[CPU ${i}] Snoops Invalidate. Trashing local copy.`, 'inv');
            otherLine.state = STATES.I;
            otherLine.data = "--";
            updateCacheUI(i, addr);
            
            await sleep(400);
            document.getElementById(`cpu-${i}`).classList.remove('active-cpu');
        }
    }
}

// ==========================================
// 4. UI RENDERING & SVG BUS ROUTING
// ==========================================

function updateCacheUI(cpuId, addr) {
    const line = CPUs[cpuId].lines[addr];
    const stateEl = document.getElementById(`c${cpuId}-s${addr}`);
    const dataEl = document.getElementById(`c${cpuId}-d${addr}`);
    
    stateEl.textContent = line.state;
    // Update color class
    stateEl.className = `state st-${line.state.toLowerCase()}`;
    dataEl.textContent = line.data;
}

function flashCacheRow(cpuId, addr) {
    const row = document.getElementById(`c${cpuId}-s${addr}`).parentElement;
    row.classList.add('highlight');
    setTimeout(() => row.classList.remove('highlight'), 1000);
}

function updateMainMemoryUI(addr) {
    const cell = document.getElementById(`mem-d${addr}`);
    cell.textContent = MainMemory[addr];
    cell.parentElement.classList.add('highlight');
    setTimeout(() => cell.parentElement.classList.remove('highlight'), 1000);
}

// Draw dynamic SVG lines linking CPUs and Memory to the central bus
function drawBusLines() {
    const svg = els.busSvg;
    svg.innerHTML = ''; // Clear
    
    const svgRect = svg.getBoundingClientRect();
    const centerRect = els.sysBusNode.getBoundingClientRect();
    
    const cx = centerRect.left + (centerRect.width / 2) - svgRect.left;
    const cy = centerRect.top + (centerRect.height / 2) - svgRect.top;

    const drawLine = (targetId, idStr) => {
        const el = document.getElementById(targetId);
        const rect = el.getBoundingClientRect();
        
        // Simple bounding box routing to center
        let tx = rect.left + (rect.width / 2) - svgRect.left;
        let ty = rect.top + (rect.height / 2) - svgRect.top;
        
        // Minor adjustments to connect to edges instead of center of elements
        if (targetId === 'main-memory') ty = rect.top - svgRect.top; // connect to top of mem
        else if (targetId === 'cpu-0' || targetId === 'cpu-2') tx = rect.right - svgRect.left; // Connect to right
        else if (targetId === 'cpu-1' || targetId === 'cpu-3') tx = rect.left - svgRect.left; // Connect to left

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute('class', 'bus-line');
        path.setAttribute('id', `line-${idStr}`);
        
        // Draw an elbow pipe rather than straight line for aesthetics
        const midX = (cx + tx) / 2;
        path.setAttribute('d', `M ${tx} ${ty} L ${midX} ${ty} L ${midX} ${cy} L ${cx} ${cy}`);
        
        svg.appendChild(path);
    };

    drawLine('cpu-0', '0');
    drawLine('cpu-1', '1');
    drawLine('cpu-2', '2');
    drawLine('cpu-3', '3');
    
    // Memory uses a straight vertical line
    const memRect = els.mainMemNode.getBoundingClientRect();
    const mx = memRect.left + (memRect.width / 2) - svgRect.left;
    const my = memRect.top - svgRect.top;
    const memPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    memPath.setAttribute('class', 'bus-line');
    memPath.setAttribute('id', `line-mem`);
    memPath.setAttribute('d', `M ${mx} ${my} L ${cx} ${cy}`);
    svg.appendChild(memPath);
}

// Animates a specific bus line
function animateBus(targetId, typeClass) {
    const line = document.getElementById(`line-${targetId}`);
    if (line) {
        line.classList.add(typeClass);
    }
}
