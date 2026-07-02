/**
 * ssd-simulator.js
 * Implements a Solid State Drive Flash Translation Layer (FTL) simulator.
 * Demonstrates wear leveling, garbage collection, and write amplification.
 */

document.addEventListener("DOMContentLoaded", () => {
    initSSD();
});

// ==========================================
// 1. ENGINE CONSTANTS & STATE
// ==========================================

const CONFIG = {
    NUM_BLOCKS: 8,
    PAGES_PER_BLOCK: 16,
    MAX_LBA: 64, // Over-provisioning: 128 physical pages, but only 64 logical addresses. Guarantees free space for GC.
    GC_THRESHOLD: 1 // If free blocks <= 1, trigger GC
};

const PAGE_STATE = {
    EMPTY: 'empty',
    VALID: 'valid',
    STALE: 'stale'
};

let ssdState = {
    blocks: [], // Array of block objects
    l2pMap: new Map(), // LBA -> { blockIdx, pageIdx }
    
    activeBlockIdx: 0,
    
    // Telemetry
    userWrites: 0,
    flashWrites: 0,
    gcCycles: 0,
    
    // Automation
    isSimulating: false,
    simTimer: null,
    wafHistory: []
};

// DOM Elements
const els = {
    btnRandomWrite: document.getElementById('btnRandomWrite'),
    btnForceGC: document.getElementById('btnForceGC'),
    btnSimulateWorkload: document.getElementById('btnSimulateWorkload'),
    
    lbaCount: document.getElementById('lbaCount'),
    l2pTableBody: document.getElementById('l2pTableBody'),
    emptyL2P: document.getElementById('emptyL2P'),
    
    nandArena: document.getElementById('nandArena'),
    
    wafDisplay: document.getElementById('wafDisplay'),
    statUserWrites: document.getElementById('statUserWrites'),
    statFlashWrites: document.getElementById('statFlashWrites'),
    statGCCycles: document.getElementById('statGCCycles'),
    statMaxPE: document.getElementById('statMaxPE'),
    
    logContainer: document.getElementById('logContainer'),
    engineBadge: document.getElementById('engineBadge')
};

let wafChart;

// ==========================================
// 2. INITIALIZATION
// ==========================================

function initSSD() {
    // Initialize Blocks
    for (let b = 0; b < CONFIG.NUM_BLOCKS; b++) {
        const block = {
            id: b,
            peCycles: 0,
            pages: new Array(CONFIG.PAGES_PER_BLOCK).fill(null).map(() => ({ state: PAGE_STATE.EMPTY, lba: null }))
        };
        ssdState.blocks.push(block);
    }
    
    // Set first active block
    ssdState.activeBlockIdx = 0;

    initChart();
    renderNAND();
    bindEvents();
}

function bindEvents() {
    els.btnRandomWrite.addEventListener('click', () => {
        const randomLBA = Math.floor(Math.random() * CONFIG.MAX_LBA);
        handleUserWrite(randomLBA);
    });

    els.btnForceGC.addEventListener('click', triggerGarbageCollection);
    els.btnSimulateWorkload.addEventListener('click', toggleSimulation);
}

function logMsg(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = `> ${msg}`;
    els.logContainer.appendChild(div);
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

// ==========================================
// 3. FTL & WRITE LOGIC
// ==========================================

function handleUserWrite(lba) {
    if (ssdState.isSimulating && event?.isTrusted) return; // Prevent manual writes during sim

    // Check if we need to GC before writing to ensure space
    ensureFreeSpace();

    // 1. Invalidate old page if LBA already exists
    if (ssdState.l2pMap.has(lba)) {
        const oldMapping = ssdState.l2pMap.get(lba);
        const oldBlock = ssdState.blocks[oldMapping.blockIdx];
        oldBlock.pages[oldMapping.pageIdx].state = PAGE_STATE.STALE;
    }

    // 2. Find next free page in active block
    let activeBlock = ssdState.blocks[ssdState.activeBlockIdx];
    let freePageIdx = activeBlock.pages.findIndex(p => p.state === PAGE_STATE.EMPTY);

    // If active block is full (shouldn't happen due to ensureFreeSpace, but safety check)
    if (freePageIdx === -1) {
        ensureFreeSpace();
        activeBlock = ssdState.blocks[ssdState.activeBlockIdx];
        freePageIdx = activeBlock.pages.findIndex(p => p.state === PAGE_STATE.EMPTY);
    }

    // 3. Write Data
    activeBlock.pages[freePageIdx].state = PAGE_STATE.VALID;
    activeBlock.pages[freePageIdx].lba = lba;

    // 4. Update L2P Mapping
    ssdState.l2pMap.set(lba, { blockIdx: ssdState.activeBlockIdx, pageIdx: freePageIdx });

    // 5. Update Metrics
    ssdState.userWrites++;
    ssdState.flashWrites++; // Initial write is 1:1

    if (!ssdState.isSimulating) {
        logMsg(`Wrote LBA ${lba} to Block ${ssdState.activeBlockIdx}, Page ${freePageIdx}`, 'write');
        updateUI(lba);
    }
}

// Internal write used by GC (does not increment userWrites)
function writeInternal(lba) {
    // 1. Find free page (GC ensures active block has space)
    let activeBlock = ssdState.blocks[ssdState.activeBlockIdx];
    let freePageIdx = activeBlock.pages.findIndex(p => p.state === PAGE_STATE.EMPTY);

    if (freePageIdx === -1) {
        // Shift active block (GC handles block management so this is safe)
        ssdState.activeBlockIdx = getBestFreeBlock();
        activeBlock = ssdState.blocks[ssdState.activeBlockIdx];
        freePageIdx = activeBlock.pages.findIndex(p => p.state === PAGE_STATE.EMPTY);
    }

    // 2. Write Data
    activeBlock.pages[freePageIdx].state = PAGE_STATE.VALID;
    activeBlock.pages[freePageIdx].lba = lba;

    // 3. Update L2P Mapping
    ssdState.l2pMap.set(lba, { blockIdx: ssdState.activeBlockIdx, pageIdx: freePageIdx });

    // 4. Update Metrics
    ssdState.flashWrites++; // GC write! Amplification occurs here.
}

function ensureFreeSpace() {
    let activeBlock = ssdState.blocks[ssdState.activeBlockIdx];
    
    // If active block is full, find a new one
    if (activeBlock.pages.findIndex(p => p.state === PAGE_STATE.EMPTY) === -1) {
        const nextFree = getBestFreeBlock();
        if (nextFree !== -1) {
            ssdState.activeBlockIdx = nextFree;
        } else {
            // No completely free blocks exist. Force GC.
            triggerGarbageCollection();
            // GC will free a block. Pick a new active block.
            ssdState.activeBlockIdx = getBestFreeBlock();
        }
    } else {
        // Active block has space, but check if we are critically low on free blocks overall
        // Overprovisioning allows us to trigger background GC before we hit 0
        const freeBlocksCount = ssdState.blocks.filter(b => b.pages.every(p => p.state === PAGE_STATE.EMPTY)).length;
        if (freeBlocksCount <= CONFIG.GC_THRESHOLD && !ssdState.isSimulating) { // Don't trigger auto-GC in heavy sim loop until out of space for performance
             // Optional: proactive GC. For this visualizer, reactive is easier to see.
        }
    }
}

// Wear Leveling: Pick the completely free block with the LOWEST P/E cycle count
function getBestFreeBlock() {
    let bestIdx = -1;
    let minPE = Infinity;

    for (let i = 0; i < ssdState.blocks.length; i++) {
        const b = ssdState.blocks[i];
        const isCompletelyFree = b.pages.every(p => p.state === PAGE_STATE.EMPTY);
        
        if (isCompletelyFree && b.peCycles < minPE) {
            minPE = b.peCycles;
            bestIdx = i;
        }
    }
    return bestIdx;
}

// ==========================================
// 4. GARBAGE COLLECTION
// ==========================================

function triggerGarbageCollection() {
    // 1. Identify Victim Block (Block with MOST STALE pages to maximize reclaimed space)
    let victimIdx = -1;
    let maxStale = -1;

    for (let i = 0; i < ssdState.blocks.length; i++) {
        // Skip active block
        if (i === ssdState.activeBlockIdx) continue;
        
        const staleCount = ssdState.blocks[i].pages.filter(p => p.state === PAGE_STATE.STALE).length;
        // Also ensure it actually has valid/stale data (not already empty)
        const emptyCount = ssdState.blocks[i].pages.filter(p => p.state === PAGE_STATE.EMPTY).length;

        if (emptyCount < CONFIG.PAGES_PER_BLOCK && staleCount > maxStale) {
            maxStale = staleCount;
            victimIdx = i;
        }
    }

    if (victimIdx === -1) {
        if (!ssdState.isSimulating) logMsg("GC aborted: No suitable victim block found.", "warning");
        return;
    }

    const victimBlock = ssdState.blocks[victimIdx];
    let movedPages = 0;

    // 2. Relocate Valid Pages
    for (let p = 0; p < victimBlock.pages.length; p++) {
        const page = victimBlock.pages[p];
        if (page.state === PAGE_STATE.VALID) {
            // Must write this valid LBA to a new location
            writeInternal(page.lba);
            movedPages++;
        }
    }

    // 3. Erase Block
    victimBlock.peCycles++;
    for (let p = 0; p < victimBlock.pages.length; p++) {
        victimBlock.pages[p] = { state: PAGE_STATE.EMPTY, lba: null };
    }

    ssdState.gcCycles++;
    if (!ssdState.isSimulating) {
        logMsg(`[GC] Block ${victimIdx} erased. Reclaimed space. Moved ${movedPages} valid pages.`, 'gc');
        updateUI();
    }
}

// ==========================================
// 5. SIMULATION & TELEMETRY
// ==========================================

function toggleSimulation() {
    if (ssdState.isSimulating) {
        ssdState.isSimulating = false;
        clearInterval(ssdState.simTimer);
        els.btnSimulateWorkload.innerHTML = '<i class="fas fa-bolt"></i> Simulate Heavy Workload';
        els.btnRandomWrite.disabled = false;
        els.btnForceGC.disabled = false;
        els.engineBadge.classList.remove('active');
        els.engineBadge.innerHTML = '<i class="fas fa-microchip"></i> SSD Controller: Active';
        logMsg("Heavy workload simulation stopped.", "sys");
    } else {
        ssdState.isSimulating = true;
        els.btnSimulateWorkload.innerHTML = '<i class="fas fa-stop"></i> Stop Simulation';
        els.btnRandomWrite.disabled = true;
        els.btnForceGC.disabled = true;
        els.engineBadge.classList.add('active');
        els.engineBadge.innerHTML = '<i class="fas fa-fire"></i> Controller Stressed';
        logMsg("Starting massive random write workload...", "warning");
        
        let batchCount = 0;
        ssdState.simTimer = setInterval(() => {
            // Write batch of 5 random LBAs
            for(let i=0; i<5; i++) {
                const randomLBA = Math.floor(Math.random() * CONFIG.MAX_LBA);
                handleUserWrite(randomLBA);
            }
            batchCount += 5;
            
            // Force UI update periodically
            if (batchCount % 20 === 0) updateUI();
            
        }, 50); // Fast interval
    }
}

function updateTelemetry() {
    els.lbaCount.textContent = `${ssdState.l2pMap.size} / ${CONFIG.MAX_LBA} LBA Used`;
    els.statUserWrites.textContent = ssdState.userWrites.toLocaleString();
    els.statFlashWrites.textContent = ssdState.flashWrites.toLocaleString();
    els.statGCCycles.textContent = ssdState.gcCycles.toLocaleString();

    let maxPE = 0;
    ssdState.blocks.forEach(b => maxPE = Math.max(maxPE, b.peCycles));
    els.statMaxPE.textContent = `${maxPE} Cycles`;
    if (maxPE > 50) els.statMaxPE.className = 'box-value text-danger';
    else if (maxPE > 20) els.statMaxPE.className = 'box-value text-warning';
    else els.statMaxPE.className = 'box-value';

    // Write Amplification Factor = Flash Writes / User Writes
    let waf = 1.0;
    if (ssdState.userWrites > 0) {
        waf = ssdState.flashWrites / ssdState.userWrites;
    }
    
    els.wafDisplay.textContent = `${waf.toFixed(2)}x`;
    if (waf > 2.0) els.wafDisplay.style.color = 'var(--ssd-danger)';
    else if (waf > 1.2) els.wafDisplay.style.color = 'var(--ssd-warning)';
    else els.wafDisplay.style.color = 'var(--text-primary)';

    // Update Chart
    if (ssdState.userWrites % 10 === 0 || !ssdState.isSimulating) {
        ssdState.wafHistory.push(waf);
        wafChart.data.labels.push(ssdState.userWrites);
        wafChart.data.datasets[0].data.push(waf);
        
        if (ssdState.wafHistory.length > 50) {
            wafChart.data.labels.shift();
            wafChart.data.datasets[0].data.shift();
        }
        wafChart.update();
    }
}

// ==========================================
// 6. UI RENDERING
// ==========================================

function initChart() {
    const ctx = document.getElementById('wafChart').getContext('2d');
    wafChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'WAF',
                data: [],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            scales: {
                y: { beginAtZero: true, min: 1.0, grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
                x: { display: false }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function updateUI(highlightLBA = null) {
    renderNAND();
    renderL2PTable(highlightLBA);
    updateTelemetry();
}

function renderNAND() {
    els.nandArena.innerHTML = '';

    ssdState.blocks.forEach((block, idx) => {
        const div = document.createElement('div');
        div.className = `ssd-block ${idx === ssdState.activeBlockIdx ? 'active' : ''}`;
        
        let peClass = '';
        if (block.peCycles > 50) peClass = 'worn text-danger';
        else if (block.peCycles > 20) peClass = 'worn';
        
        let headerHtml = `
            <div class="block-header">
                <span>Block ${idx}</span>
                <span class="pe-badge ${peClass}">P/E: ${block.peCycles}</span>
            </div>
            <div class="page-grid">
        `;

        let pagesHtml = '';
        block.pages.forEach(p => {
            if (p.state === PAGE_STATE.EMPTY) {
                pagesHtml += `<div class="page-cell empty"></div>`;
            } else if (p.state === PAGE_STATE.VALID) {
                pagesHtml += `<div class="page-cell valid">${p.lba}</div>`;
            } else {
                pagesHtml += `<div class="page-cell stale">${p.lba}</div>`;
            }
        });

        div.innerHTML = headerHtml + pagesHtml + `</div>`;
        els.nandArena.appendChild(div);
    });
}

function renderL2PTable(highlightLBA) {
    if (ssdState.l2pMap.size > 0) els.emptyL2P.style.display = 'none';

    // Only fully re-render if not heavily simulating to save DOM operations
    if (ssdState.isSimulating) {
        if (Math.random() < 0.1) { // 10% render chance during heavy load
            els.l2pTableBody.innerHTML = '';
            buildTableRows();
        }
        return;
    }

    els.l2pTableBody.innerHTML = '';
    buildTableRows(highlightLBA);
}

function buildTableRows(highlightLBA = null) {
    // Sort by LBA for cleaner reading
    const entries = Array.from(ssdState.l2pMap.entries()).sort((a, b) => a[0] - b[0]);
    
    entries.forEach(([lba, loc]) => {
        const tr = document.createElement('tr');
        if (lba === highlightLBA) tr.className = 'updated';
        tr.innerHTML = `
            <td>LBA ${lba}</td>
            <td>Block ${loc.blockIdx}, Page ${loc.pageIdx}</td>
        `;
        els.l2pTableBody.appendChild(tr);
    });
}
