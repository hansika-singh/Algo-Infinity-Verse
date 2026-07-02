/**
 * lsm-tree.js
 * Visualizes an LSM-Tree Storage Engine.
 * Handles MemTable inserts, Write-Ahead Log (WAL), Bloom Filters, 
 * Flush to Disk (Level 0), and Tiered Compaction logic.
 */

document.addEventListener("DOMContentLoaded", () => {
    initLSMTree();
});

// ==========================================
// 1. ENGINE CONFIG & STATE
// ==========================================
const CONFIG = {
    MEMTABLE_MAX: 4,      // Flush when reached
    L0_MAX_SSTABLES: 4,   // Compact when reached
    L1_MAX_SSTABLES: 10,
    BLOOM_SIZE: 10        // Size of bloom filter bit array
};

let state = {
    seqNumber: 0, // Logical timestamp for conflict resolution
    wal: [],
    memTable: [], // Array of { key, val, seq, isTombstone }
    disk: {
        level0: [], // Array of SSTable objects
        level1: [],
        level2: []
    },
    sstCounter: 1,
    isCompacting: false
};

// DOM Elements
const els = {
    inputKey: document.getElementById('inputKey'),
    inputValue: document.getElementById('inputValue'),
    btnInsert: document.getElementById('btnInsert'),
    btnDelete: document.getElementById('btnDelete'),
    btnRead: document.getElementById('btnRead'),
    btnSimulate: document.getElementById('btnSimulateLoad'),
    
    walLog: document.getElementById('walLog'),
    walEmpty: document.getElementById('walEmpty'),
    queryLogs: document.getElementById('queryLogs'),
    engineBadge: document.getElementById('engineBadge'),
    
    memTableContainer: document.getElementById('memTableContainer'),
    memTableList: document.getElementById('memTableList'),
    memTableEmpty: document.getElementById('memTableEmpty'),
    memSizeDisplay: document.getElementById('memSizeDisplay'),
    
    level0Track: document.getElementById('level0Track'),
    level1Track: document.getElementById('level1Track'),
    level2Track: document.getElementById('level2Track'),
};

function initLSMTree() {
    bindEvents();
}

function bindEvents() {
    els.btnInsert.addEventListener('click', () => {
        const k = parseInt(els.inputKey.value);
        const v = els.inputValue.value.trim();
        if (isNaN(k) || !v) return alert("Valid Key and Value required.");
        handleWrite(k, v, false);
    });

    els.btnDelete.addEventListener('click', () => {
        const k = parseInt(els.inputKey.value);
        if (isNaN(k)) return alert("Valid Key required to delete.");
        handleWrite(k, null, true);
    });

    els.btnRead.addEventListener('click', async () => {
        if (state.isCompacting) return alert("System busy. Compaction in progress.");
        const k = parseInt(els.inputKey.value);
        if (isNaN(k)) return alert("Valid Key required to read.");
        await handleRead(k);
    });

    els.btnSimulate.addEventListener('click', simulateWorkload);
}

function logQuery(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = msg;
    els.queryLogs.appendChild(div);
    els.queryLogs.scrollTop = els.queryLogs.scrollHeight;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ==========================================
// 2. WRITE PATH (WAL & MEMTABLE)
// ==========================================
async function handleWrite(key, val, isTombstone) {
    if (state.isCompacting) return;
    
    state.seqNumber++;
    const entry = { key, val, seq: state.seqNumber, isTombstone };

    // 1. Append to WAL
    state.wal.push(entry);
    renderWALEntry(entry);

    // 2. Insert into MemTable (Keep Sorted)
    // Remove existing key if present to represent in-place update in memory
    state.memTable = state.memTable.filter(item => item.key !== key);
    state.memTable.push(entry);
    state.memTable.sort((a, b) => a.key - b.key); // Sorted by Key

    renderMemTable();

    // 3. Check Flush condition
    if (state.memTable.length >= CONFIG.MEMTABLE_MAX) {
        await flushMemTable();
    }
}

function renderWALEntry(entry) {
    els.walEmpty.style.display = 'none';
    const div = document.createElement('div');
    div.className = `wal-entry ${entry.isTombstone ? 'del' : ''}`;
    const cmd = entry.isTombstone ? 'DEL' : 'PUT';
    const valStr = entry.isTombstone ? 'null' : `'${entry.val}'`;
    div.innerHTML = `<span>[Seq:${entry.seq}] ${cmd}</span> <span>K:${entry.key} V:${valStr}</span>`;
    els.walLog.appendChild(div);
    els.walLog.scrollTop = els.walLog.scrollHeight;
}

function renderMemTable() {
    els.memSizeDisplay.textContent = state.memTable.length;
    
    if (state.memTable.length === 0) {
        els.memTableEmpty.style.display = 'block';
        els.memTableList.innerHTML = '';
        return;
    }
    
    els.memTableEmpty.style.display = 'none';
    els.memTableList.innerHTML = '';
    
    state.memTable.forEach(item => {
        const div = document.createElement('div');
        div.className = 'kv-pair';
        div.style.border = '1px solid #475569';
        if (item.isTombstone) {
            div.innerHTML = `<span class="kv-key">${item.key}</span><span class="kv-tombstone">DEL</span>`;
        } else {
            div.innerHTML = `<span class="kv-key">${item.key}</span><span class="kv-val">${item.val}</span>`;
        }
        els.memTableList.appendChild(div);
    });
}

// ==========================================
// 3. FLUSH & SSTABLE CREATION
// ==========================================
async function flushMemTable() {
    logQuery("MemTable full. Flushing to Level 0...", "info");
    els.memTableContainer.classList.add('flash-flush');
    await sleep(400);

    // Create SSTable Data Structure
    const sstable = createSSTable(state.memTable);
    
    // Push to Disk Level 0
    state.disk.level0.push(sstable);
    
    // Clear Memory
    state.memTable = [];
    state.wal = [];
    els.walLog.innerHTML = '<div class="empty-state-text" id="walEmpty">WAL flushed to disk.</div>';
    els.walEmpty = document.getElementById('walEmpty');
    
    renderMemTable();
    renderDisk();
    
    els.memTableContainer.classList.remove('flash-flush');
    logQuery(`Flushed SSTable_${sstable.id} to L0.`, "success");

    // Check Compaction condition
    if (state.disk.level0.length >= CONFIG.L0_MAX_SSTABLES) {
        await triggerCompaction(0);
    }
}

class BloomFilter {
    constructor(size) {
        this.size = size;
        this.bits = new Array(size).fill(0);
    }
    // Simple mock hash functions
    add(key) {
        this.bits[key % this.size] = 1;
        this.bits[(key * 3) % this.size] = 1;
    }
    mightContain(key) {
        return this.bits[key % this.size] === 1 && this.bits[(key * 3) % this.size] === 1;
    }
}

function createSSTable(dataArray) {
    const filter = new BloomFilter(CONFIG.BLOOM_SIZE);
    dataArray.forEach(item => filter.add(item.key));
    
    return {
        id: state.sstCounter++,
        keys: [...dataArray], // clone
        bloomFilter: filter,
        minKey: dataArray[0].key,
        maxKey: dataArray[dataArray.length - 1].key
    };
}

// ==========================================
// 4. COMPACTION ENGINE
// ==========================================
async function triggerCompaction(level) {
    state.isCompacting = true;
    els.engineBadge.classList.add('compacting');
    els.engineBadge.innerHTML = '<i class="fas fa-cog fa-spin"></i> Compacting...';
    
    const currentLevelArr = state.disk[`level${level}`];
    const nextLevelArr = state.disk[`level${level + 1}`];
    
    logQuery(`Triggering Compaction for Level ${level}...`, "info");
    
    // Visual flash
    const track = document.getElementById(`level${level}Track`);
    track.classList.add('flash-compact');
    await sleep(1000);

    // 1. Gather all tables from current level (and potentially overlapping ones in next level for true LSM, but for visual simplicity we just push down current level and merge).
    // To be more accurate to Level-tiered compaction: we merge L(i) with overlapping L(i+1). 
    // Here we merge ALL of L0 into new tables, and append to L1. If L1 is full, we merge ALL L1 into L2.
    
    let allData = [];
    currentLevelArr.forEach(sst => allData = allData.concat(sst.keys));
    if (nextLevelArr) {
        nextLevelArr.forEach(sst => allData = allData.concat(sst.keys));
    }

    // 2. Merge Sort and Deduplicate
    // Sort by Key ascending. If keys tie, sort by Sequence Number descending (latest wins)
    allData.sort((a, b) => {
        if (a.key === b.key) return b.seq - a.seq; 
        return a.key - b.key;
    });

    let mergedData = [];
    let lastKey = null;
    
    allData.forEach(item => {
        if (item.key !== lastKey) {
            // Drop tombstones ONLY if we are merging into the final deep archive level
            // In a real DB, you keep tombstones until max level so they can mask older records.
            if (level === 1 && item.isTombstone) {
                // Drop it completely
            } else {
                mergedData.push(item);
            }
            lastKey = item.key;
        }
    });

    // 3. Chunk into new SSTables
    let newSSTables = [];
    for (let i = 0; i < mergedData.length; i += CONFIG.MEMTABLE_MAX) {
        const chunk = mergedData.slice(i, i + CONFIG.MEMTABLE_MAX);
        newSSTables.push(createSSTable(chunk));
    }

    // 4. Update Disk State
    state.disk[`level${level}`] = []; // Clear current level
    if (level < 2) {
        state.disk[`level${level + 1}`] = newSSTables;
    }
    
    renderDisk();
    track.classList.remove('flash-compact');
    logQuery(`Compaction complete. Promoted to Level ${level + 1}.`, "success");

    // 5. Cascade Compaction if next level overflowed
    if (level === 0 && state.disk.level1.length >= CONFIG.L1_MAX_SSTABLES) {
        await triggerCompaction(1);
    }

    state.isCompacting = false;
    els.engineBadge.classList.remove('compacting');
    els.engineBadge.innerHTML = '<i class="fas fa-database"></i> NoSQL Engine: Active';
}

// ==========================================
// 5. READ PATH (GET)
// ==========================================
async function handleRead(key) {
    logQuery(`> Searching for Key: ${key}...`, "sys");
    
    // 1. Check MemTable
    const memResult = state.memTable.find(item => item.key === key);
    if (memResult) {
        if (memResult.isTombstone) return logQuery(`Key ${key} was DELETED in MemTable.`, "error");
        return logQuery(`Found Key ${key} in MemTable -> '${memResult.val}'`, "success");
    }

    // 2. Check Disk Levels (L0 -> L1 -> L2)
    // Because L0 can have overlapping keys, we should search L0 backwards (newest first)
    // Then L1, L2.
    const searchOrder = [
        { name: 'L0', tables: [...state.disk.level0].reverse() }, // L0 flushed sequentially, newest at end
        { name: 'L1', tables: state.disk.level1 },
        { name: 'L2', tables: state.disk.level2 }
    ];

    for (let tier of searchOrder) {
        for (let sst of tier.tables) {
            
            // Visual feedback
            const sstDOM = document.getElementById(`sst-${sst.id}`);
            if (sstDOM) sstDOM.classList.add('searching');
            await sleep(300); // Simulate disk seek latency
            
            // Bloom Filter Check
            if (!sst.bloomFilter.mightContain(key)) {
                logQuery(`Bloom Filter skipped SSTable_${sst.id} in ${tier.name}.`);
                if (sstDOM) sstDOM.classList.remove('searching');
                continue;
            }
            
            // False positive or Hit? Binary search the keys array
            const hit = sst.keys.find(item => item.key === key);
            
            if (hit) {
                // Highlight hit row
                const row = document.getElementById(`sst-${sst.id}-k-${key}`);
                if (row) row.classList.add('found');
                await sleep(500);
                
                if (sstDOM) sstDOM.classList.remove('searching');
                if (row) row.classList.remove('found');
                
                if (hit.isTombstone) return logQuery(`Key ${key} found as TOMBSTONE in ${tier.name}.`, "error");
                return logQuery(`Found Key ${key} in ${tier.name} (SSTable_${sst.id}) -> '${hit.val}'`, "success");
            } else {
                logQuery(`Bloom Filter False Positive in SSTable_${sst.id}!`);
            }
            
            if (sstDOM) sstDOM.classList.remove('searching');
        }
    }

    logQuery(`Key ${key} does not exist in the database.`, "error");
}

// ==========================================
// 6. DISK UI RENDERING
// ==========================================
function renderDisk() {
    renderLevel(state.disk.level0, els.level0Track);
    renderLevel(state.disk.level1, els.level1Track);
    renderLevel(state.disk.level2, els.level2Track);
}

function renderLevel(tables, container) {
    container.innerHTML = '';
    
    tables.forEach(sst => {
        const div = document.createElement('div');
        div.className = 'sstable';
        div.id = `sst-${sst.id}`;
        
        // Render Bloom Filter Bits visually
        let bloomHtml = `<div class="bloom-filter">`;
        sst.bloomFilter.bits.forEach(bit => {
            bloomHtml += `<div class="bloom-bit ${bit ? 'active' : ''}"></div>`;
        });
        bloomHtml += `</div>`;
        
        // Render Keys
        let keysHtml = `<div class="sstable-data">`;
        sst.keys.forEach(k => {
            if (k.isTombstone) {
                keysHtml += `<div class="kv-pair" id="sst-${sst.id}-k-${k.key}"><span class="kv-key">${k.key}</span><span class="kv-tombstone">DEL</span></div>`;
            } else {
                keysHtml += `<div class="kv-pair" id="sst-${sst.id}-k-${k.key}"><span class="kv-key">${k.key}</span><span class="kv-val">${k.val}</span></div>`;
            }
        });
        keysHtml += `</div>`;

        div.innerHTML = `
            <div class="sstable-header">SSTable_${sst.id}</div>
            ${bloomHtml}
            ${keysHtml}
        `;
        container.appendChild(div);
    });
}

// ==========================================
// 7. SIMULATION UTILITIES
// ==========================================
async function simulateWorkload() {
    if (state.isCompacting) return alert("System busy.");
    
    els.btnSimulate.disabled = true;
    els.btnSimulate.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Blasting Data...';
    
    for (let i = 1; i <= 20; i++) {
        // Randomly update existing keys to force overwrites/tombstones
        const key = Math.floor(Math.random() * 15) + 1;
        const val = `V_${Math.random().toString(36).substring(2,5).toUpperCase()}`;
        
        // 10% chance to delete
        if (Math.random() > 0.9) {
            await handleWrite(key, null, true);
        } else {
            await handleWrite(key, val, false);
        }
        await sleep(150); // Small delay for visual tracking
    }
    
    els.btnSimulate.disabled = false;
    els.btnSimulate.innerHTML = '<i class="fas fa-bolt"></i> Simulate Write-Heavy Workload';
}
