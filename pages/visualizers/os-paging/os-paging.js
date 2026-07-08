/**
 * os-paging.js
 * Implements a 16-bit Virtual Memory addressing system.
 * Simulates TLB caching, Page Table walks, and LRU Page Fault evictions.
 */

document.addEventListener("DOMContentLoaded", () => {
    initOSPaging();
});

// ==========================================
// 1. SYSTEM CONSTANTS & STATE
// ==========================================

const CONFIG = {
    // 16-bit virtual address: 6 bits VPN, 10 bits Offset
    ADDRESS_BITS: 16,
    VPN_BITS: 6,
    OFFSET_BITS: 10,
    
    // Derived limits
    NUM_PAGES: 64,       // 2^6
    PAGE_SIZE: 1024,     // 2^10
    
    // Hardware constraints to force collisions
    NUM_FRAMES: 4,       // Extremely small RAM to force frequent evictions
    TLB_SIZE: 2          // Small TLB to force misses
};

let state = {
    tlb: [], // Array of {vpn, pfn, lruTime}
    pageTable: [], // Array of {vpn, valid, pfn}
    ram: [], // Array of {pfn, vpn, lruTime}
    globalClock: 0, // Used for LRU tracking
    isExecuting: false
};

// DOM Elements
const els = {
    addressInput: document.getElementById('addressInput'),
    btnRandom: document.getElementById('btnRandom'),
    btnFetch: document.getElementById('btnFetch'),
    btnReset: document.getElementById('btnReset'),
    
    binaryDisplay: document.getElementById('binaryDisplay'),
    vpnDisplay: document.getElementById('vpnDisplay'),
    offsetDisplay: document.getElementById('offsetDisplay'),
    
    logContainer: document.getElementById('logContainer'),
    engineBadge: document.getElementById('engineBadge'),
    
    // Hardware Nodes (for animation)
    nodeCPU: document.getElementById('nodeCPU'),
    nodeTLB: document.getElementById('nodeTLB'),
    nodePT: document.getElementById('nodePT'),
    nodeDisk: document.getElementById('nodeDisk'),
    nodeRAM: document.getElementById('nodeRAM'),
    finalAddressDisplay: document.getElementById('finalAddressDisplay'),
    
    // Arrows & Labels
    arrowCPUTLB: document.getElementById('arrowCPU-TLB'),
    labelTLBHit: document.getElementById('labelTLBHit'),
    labelTLBMiss: document.getElementById('labelTLBMiss'),
    arrowTLBRAM: document.getElementById('arrowTLB-RAM'),
    arrowTLBPT: document.getElementById('arrowTLB-PT'),
    
    labelPTHit: document.getElementById('labelPTHit'),
    labelPTMiss: document.getElementById('labelPTMiss'),
    arrowPTRAM: document.getElementById('arrowPT-RAM'),
    arrowPTDisk: document.getElementById('arrowPT-Disk'),
    arrowDiskRAM: document.getElementById('arrowDisk-RAM'),
    
    // Tables
    tlbBody: document.getElementById('tlbBody'),
    ptBody: document.getElementById('ptBody'),
    ramBody: document.getElementById('ramBody')
};

// ==========================================
// 2. INITIALIZATION
// ==========================================
function initOSPaging() {
    bootOS();
    bindEvents();
}

function bootOS() {
    // Initialize empty memory structures
    state.tlb = [];
    
    // 64 pages mapped to Disk initially
    state.pageTable = Array.from({length: CONFIG.NUM_PAGES}, (_, i) => ({
        vpn: i,
        valid: false,
        pfn: null
    }));
    
    // 4 Empty RAM Frames
    state.ram = Array.from({length: CONFIG.NUM_FRAMES}, (_, i) => ({
        pfn: i,
        vpn: null,
        lruTime: 0
    }));
    
    state.globalClock = 0;
    
    els.addressInput.value = generateRandomHexAddress();
    updateAddressBreakdown();
    
    renderAllTables();
    resetAnimations();
    logSys("OS Rebooted. Memory structures initialized.");
}

function bindEvents() {
    els.btnReset.addEventListener('click', bootOS);
    
    els.btnRandom.addEventListener('click', () => {
        if (state.isExecuting) return;
        els.addressInput.value = generateRandomHexAddress();
        updateAddressBreakdown();
    });
    
    els.addressInput.addEventListener('input', () => {
        // Enforce valid hex
        els.addressInput.value = els.addressInput.value.replace(/[^0-9A-Fa-fxX]/g, '');
        if (els.addressInput.value.length > 6) els.addressInput.value = els.addressInput.value.slice(0, 6);
        updateAddressBreakdown();
    });
    
    els.addressInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleFetch();
    });
    
    els.btnFetch.addEventListener('click', handleFetch);
}

// ==========================================
// 3. UTILITIES & LOGGING
// ==========================================
const sleep = ms => new Promise(r => setTimeout(r, ms));

function logSys(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = type === 'sys' ? `> ${msg}` : msg;
    els.logContainer.appendChild(div);
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

function generateRandomHexAddress() {
    const maxVal = Math.pow(2, CONFIG.ADDRESS_BITS) - 1;
    const randomInt = Math.floor(Math.random() * maxVal);
    return '0x' + randomInt.toString(16).toUpperCase().padStart(4, '0');
}

function parseInputAddress() {
    let raw = els.addressInput.value;
    if (!raw.startsWith('0x') && !raw.startsWith('0X')) raw = '0x' + raw;
    const intVal = parseInt(raw, 16);
    if (isNaN(intVal) || intVal < 0 || intVal > 0xFFFF) return null;
    return intVal;
}

function updateAddressBreakdown() {
    const addr = parseInputAddress();
    if (addr === null) {
        els.binaryDisplay.textContent = "INVALID ADDRESS";
        return;
    }
    
    // Mathematical Splitting based on requirements
    // VPN = top 6 bits, Offset = bottom 10 bits
    const vpn = (addr >> CONFIG.OFFSET_BITS) & 0x3F;
    const offset = addr & 0x3FF;
    
    // Format Binary String neatly
    const binStr = addr.toString(2).padStart(16, '0');
    els.binaryDisplay.textContent = `${binStr.slice(0,4)} ${binStr.slice(4,8)} ${binStr.slice(8,12)} ${binStr.slice(12,16)}`;
    
    els.vpnDisplay.textContent = `0x${vpn.toString(16).toUpperCase().padStart(2,'0')} (${vpn})`;
    els.offsetDisplay.textContent = `0x${offset.toString(16).toUpperCase().padStart(3,'0')} (${offset})`;
    
    return { addr, vpn, offset };
}

// ==========================================
// 4. MEMORY MANAGEMENT UNIT (MMU) SIMULATION
// ==========================================

async function handleFetch() {
    if (state.isExecuting) return;
    
    const parsed = updateAddressBreakdown();
    if (!parsed) return void 0;
    
    state.isExecuting = true;
    els.btnFetch.disabled = true;
    els.btnRandom.disabled = true;
    els.addressInput.disabled = true;
    els.engineBadge.classList.add('active');
    els.engineBadge.innerHTML = '<i class="fas fa-cog fa-spin"></i> Processing Request...';
    resetAnimations();
    
    state.globalClock++;
    const { vpn, offset } = parsed;
    
    logSys(`CPU requests Virtual Address 0x${parsed.addr.toString(16).toUpperCase().padStart(4,'0')}`, 'info');
    
    // 1. CPU -> TLB
    els.nodeCPU.classList.add('active-cpu');
    els.arrowCPUTLB.classList.add('active');
    await sleep(500);
    
    // 2. TLB Check
    els.nodeTLB.classList.add('active-tlb');
    logSys(`Checking TLB for VPN ${vpn}...`, 'tlb');
    await sleep(500);
    
    let pfn = checkTLB(vpn);
    
    if (pfn !== null) {
        // --- TLB HIT ---
        logSys(`TLB HIT! VPN ${vpn} maps to Frame ${pfn}`, 'success');
        els.labelTLBHit.classList.add('active');
        els.arrowTLBRAM.classList.add('active');
        highlightRow('tlbBody', vpn, 'flash-success');
        
        // Update LRU for RAM since it was accessed
        updateRAMLRU(pfn);
        
        await sleep(500);
    } else {
        // --- TLB MISS ---
        logSys(`TLB MISS. Falling back to Page Table walk.`, 'tlb');
        els.labelTLBMiss.classList.add('active');
        els.arrowTLBPT.classList.add('active');
        await sleep(500);
        
        // 3. Page Table Lookup
        els.nodePT.classList.add('active-pt');
        logSys(`Querying Page Table for VPN ${vpn}...`, 'pt');
        // Scroll PT table to row
        const ptRow = document.getElementById(`pt-row-${vpn}`);
        if(ptRow) ptRow.scrollIntoView({behavior: "smooth", block: "center"});
        await sleep(600);
        
        const ptEntry = state.pageTable[vpn];
        
        if (ptEntry.valid) {
            // --- PAGE TABLE HIT ---
            pfn = ptEntry.pfn;
            logSys(`Page Table HIT. VPN ${vpn} maps to Frame ${pfn}.`, 'success');
            els.labelPTHit.classList.add('active');
            els.arrowPTRAM.classList.add('active');
            highlightRow('ptBody', vpn, 'flash-success');
            
            updateRAMLRU(pfn);
            updateTLB(vpn, pfn);
            
            await sleep(500);
        } else {
            // --- PAGE FAULT (MISS) ---
            logSys(`PAGE FAULT! VPN ${vpn} is not in RAM (Valid bit = 0).`, 'fault');
            els.labelPTMiss.classList.add('active');
            els.arrowPTDisk.classList.add('active');
            highlightRow('ptBody', vpn, 'flash-error');
            await sleep(600);
            
            // 4. Disk Access & Replacement Algorithm
            els.nodeDisk.classList.add('active-disk');
            logSys(`Trapping to OS. Fetching Page ${vpn} from Disk...`, 'fault');
            await sleep(800);
            
            pfn = handlePageFault(vpn);
            els.arrowDiskRAM.classList.add('active');
            
            updateTLB(vpn, pfn);
            await sleep(500);
        }
    }
    
    // 5. Final Physical Memory Access
    els.nodeRAM.classList.add('active-ram');
    const physicalAddress = (pfn << CONFIG.OFFSET_BITS) | offset;
    const hexPA = '0x' + physicalAddress.toString(16).toUpperCase().padStart(4, '0');
    
    els.finalAddressDisplay.textContent = `Physical Address: ${hexPA}`;
    logSys(`Successfully accessed Physical RAM at ${hexPA} (Frame ${pfn}, Offset 0x${offset.toString(16).toUpperCase()})`, 'success');
    
    highlightRow('ramBody', pfn, 'flash-success', true);
    renderAllTables();
    
    // Cleanup Execution State
    state.isExecuting = false;
    els.btnFetch.disabled = false;
    els.btnRandom.disabled = false;
    els.addressInput.disabled = false;
    els.engineBadge.classList.remove('active');
    els.engineBadge.innerHTML = '<i class="fas fa-microchip"></i> OS Memory Manager: Active';
}

// ==========================================
// 5. ALGORITHMIC LOGIC
// ==========================================

function checkTLB(vpn) {
    const entry = state.tlb.find(e => e.vpn === vpn);
    if (entry) {
        entry.lruTime = state.globalClock;
        return entry.pfn;
    }
    return null;
}

function updateTLB(vpn, pfn) {
    // Check if already exists (shouldn't if called properly, but safety)
    let entry = state.tlb.find(e => e.vpn === vpn);
    if (entry) {
        entry.pfn = pfn;
        entry.lruTime = state.globalClock;
    } else {
        if (state.tlb.length >= CONFIG.TLB_SIZE) {
            // Evict LRU
            state.tlb.sort((a, b) => a.lruTime - b.lruTime);
            const evicted = state.tlb.shift();
            logSys(`TLB Full. Evicted VPN ${evicted.vpn} via LRU.`, 'tlb');
        }
        state.tlb.push({ vpn, pfn, lruTime: state.globalClock });
    }
    renderTableTLB();
}

function updateRAMLRU(pfn) {
    const frame = state.ram[pfn];
    if (frame) frame.lruTime = state.globalClock;
}

function handlePageFault(requestedVpn) {
    // 1. Look for free frame
    let frameToUse = state.ram.find(f => f.vpn === null);
    
    if (!frameToUse) {
        // 2. RAM is full. Apply LRU Page Replacement
        state.ram.sort((a, b) => a.lruTime - b.lruTime);
        frameToUse = state.ram[0]; // LRU frame
        
        const evictedVpn = frameToUse.vpn;
        logSys(`RAM Full. LRU Evicting VPN ${evictedVpn} from Frame ${frameToUse.pfn} to Disk.`, 'fault');
        
        // Update Page Table for evicted page
        state.pageTable[evictedVpn].valid = false;
        state.pageTable[evictedVpn].pfn = null;
        highlightRow('ptBody', evictedVpn, 'flash-warning');
        
        // Invalidate TLB if evicted page was cached
        const tlbIdx = state.tlb.findIndex(e => e.vpn === evictedVpn);
        if (tlbIdx !== -1) {
            state.tlb.splice(tlbIdx, 1);
            logSys(`Flushed VPN ${evictedVpn} from TLB due to eviction.`, 'tlb');
        }
    }
    
    // 3. Load requested page into frame
    const pfn = frameToUse.pfn;
    frameToUse.vpn = requestedVpn;
    frameToUse.lruTime = state.globalClock;
    
    // 4. Update Page Table for new page
    state.pageTable[requestedVpn].valid = true;
    state.pageTable[requestedVpn].pfn = pfn;
    
    logSys(`Loaded VPN ${requestedVpn} into Frame ${pfn}.`, 'sys');
    
    // Re-sort RAM back to PFN order for UI display
    state.ram.sort((a, b) => a.pfn - b.pfn);
    
    return pfn;
}

// ==========================================
// 6. UI RENDERING & HIGHLIGHTING
// ==========================================

function renderAllTables() {
    renderTableTLB();
    renderTablePT();
    renderTableRAM();
}

function renderTableTLB() {
    els.tlbBody.innerHTML = '';
    
    if (state.tlb.length === 0) {
        els.tlbBody.innerHTML = '<tr><td colspan="3" class="td-empty">Cache Empty</td></tr>';
        return;
    }
    
    // Sort by LRU to show oldest at top for clarity
    const sortedTLB = [...state.tlb].sort((a, b) => a.lruTime - b.lruTime);
    
    sortedTLB.forEach(entry => {
        const tr = document.createElement('tr');
        tr.id = `tlb-row-${entry.vpn}`;
        tr.innerHTML = `
            <td>${entry.vpn}</td>
            <td>${entry.pfn}</td>
            <td>T-${entry.lruTime}</td>
        `;
        els.tlbBody.appendChild(tr);
    });
}

function renderTablePT() {
    // Only re-render entirely on boot to preserve scroll position during execution
    if (els.ptBody.children.length !== CONFIG.NUM_PAGES) {
        els.ptBody.innerHTML = '';
        state.pageTable.forEach(pt => {
            const tr = document.createElement('tr');
            tr.id = `pt-row-${pt.vpn}`;
            tr.innerHTML = `
                <td>${pt.vpn}</td>
                <td class="${pt.valid ? 'td-hit' : 'td-miss'}">${pt.valid ? '1' : '0'}</td>
                <td>${pt.valid ? pt.pfn : 'Disk'}</td>
            `;
            els.ptBody.appendChild(tr);
        });
    } else {
        // Fast update existing rows
        state.pageTable.forEach(pt => {
            const tr = document.getElementById(`pt-row-${pt.vpn}`);
            if (tr) {
                tr.innerHTML = `
                    <td>${pt.vpn}</td>
                    <td class="${pt.valid ? 'td-hit' : 'td-miss'}">${pt.valid ? '1' : '0'}</td>
                    <td>${pt.valid ? pt.pfn : 'Disk'}</td>
                `;
            }
        });
    }
}

function renderTableRAM() {
    els.ramBody.innerHTML = '';
    state.ram.forEach(frame => {
        const tr = document.createElement('tr');
        tr.id = `ram-row-${frame.pfn}`;
        
        let vpnDisp = frame.vpn !== null ? frame.vpn : '<span class="td-empty">Free</span>';
        let lruDisp = frame.vpn !== null ? `T-${frame.lruTime}` : '-';
        
        tr.innerHTML = `
            <td>Frame ${frame.pfn}</td>
            <td>${vpnDisp}</td>
            <td>${lruDisp}</td>
        `;
        els.ramBody.appendChild(tr);
    });
}

function highlightRow(tableBodyId, idParam, className, isRam = false) {
    const prefix = tableBodyId === 'tlbBody' ? 'tlb' : (tableBodyId === 'ptBody' ? 'pt' : 'ram');
    const trId = `${prefix}-row-${idParam}`;
    const tr = document.getElementById(trId);
    if (tr) {
        tr.classList.add(className);
        setTimeout(() => tr.classList.remove(className), 1000);
    }
}

function resetAnimations() {
    const nodes = [els.nodeCPU, els.nodeTLB, els.nodePT, els.nodeDisk, els.nodeRAM];
    nodes.forEach(n => n.className = n.className.replace(/active-[a-z]+/g, '').trim());
    
    const elements = [
        els.arrowCPUTLB, els.labelTLBHit, els.labelTLBMiss, els.arrowTLBRAM, els.arrowTLBPT,
        els.labelPTHit, els.labelPTMiss, els.arrowPTRAM, els.arrowPTDisk, els.arrowDiskRAM
    ];
    elements.forEach(el => el.classList.remove('active'));
    
    els.finalAddressDisplay.textContent = "Physical Address: ----";
}
