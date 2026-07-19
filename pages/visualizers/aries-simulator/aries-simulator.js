// aries-simulator.js

let lsnCounter = 1;
let txCounter = 1;
let activeTxs = {}; // txId -> { status, lastLsn }
let dirtyPages = {}; // pageId -> recLsn
let wal = []; // Array of log records

let isCrashed = false;
let recoveryPhase = null; // 'analysis', 'redo', 'undo'
let recoveryStepIndex = 0;
let undoList = [];

const sysLog = document.getElementById('sysLog');
const txListEl = document.getElementById('txList');
const dptEl = document.getElementById('dirtyPageTable');
const walEl = document.getElementById('walDisk');

function logSys(msg) {
    const div = document.createElement('div');
    div.className = 'sys-log-entry';
    div.textContent = msg;
    sysLog.appendChild(div);
    sysLog.scrollTop = sysLog.scrollHeight;
}

function renderState() {
    // Render Active Txs
    txListEl.innerHTML = '';
    Object.keys(activeTxs).forEach(t => {
        const div = document.createElement('div');
        div.className = 'data-row';
        div.innerHTML = `<span>Tx ${t}</span><span>LastLSN: ${activeTxs[t].lastLsn}</span>`;
        txListEl.appendChild(div);
    });
    if (Object.keys(activeTxs).length === 0) {
        txListEl.innerHTML = '<div class="data-row">No active transactions</div>';
    }

    // Render Dirty Pages
    dptEl.innerHTML = '';
    Object.keys(dirtyPages).forEach(p => {
        const div = document.createElement('div');
        div.className = 'data-row';
        div.innerHTML = `<span>Page ${p}</span><span>RecLSN: ${dirtyPages[p]}</span>`;
        dptEl.appendChild(div);
    });
    if (Object.keys(dirtyPages).length === 0) {
        dptEl.innerHTML = '<div class="data-row">No dirty pages</div>';
    }

    // Render WAL
    walEl.innerHTML = '';
    wal.forEach((record, index) => {
        const div = document.createElement('div');
        let classes = 'wal-record';
        if (record.type === 'BEGIN') classes += ' type-begin';
        if (record.type === 'UPDATE') classes += ' type-update';
        if (record.type === 'COMMIT') classes += ' type-commit';
        if (record.type === 'CLR') classes += ' type-clr';
        
        // Highlight current record during recovery
        if (isCrashed && recoveryPhase && index === recoveryStepIndex - (recoveryPhase==='undo'?1:0)) {
            classes += ' active';
        }
        
        div.className = classes;
        
        let info = '';
        if (record.type === 'UPDATE') info = `Pg:${record.pageId} UndoNext:${record.prevLsn}`;
        if (record.type === 'CLR') info = `Pg:${record.pageId} UndoNext:${record.undoNextLsn}`;
        
        div.innerHTML = `<span>[${record.lsn}] Tx${record.txId} ${record.type}</span> <span>${info}</span>`;
        walEl.appendChild(div);
    });
    walEl.scrollTop = walEl.scrollHeight;
}

function appendLog(type, txId, pageId = null, undoNextLsn = null) {
    const lsn = lsnCounter++;
    const prevLsn = activeTxs[txId] ? activeTxs[txId].lastLsn : 0;
    
    const record = { lsn, type, txId, prevLsn, pageId, undoNextLsn };
    wal.push(record);
    
    if (type !== 'CLR' && type !== 'END') {
        if (!activeTxs[txId]) activeTxs[txId] = { status: 'U', lastLsn: lsn };
        else activeTxs[txId].lastLsn = lsn;
    }
    
    if (pageId && !(pageId in dirtyPages)) {
        dirtyPages[pageId] = lsn;
    }
    
    renderState();
    return lsn;
}

document.getElementById('btnBeginTx').addEventListener('click', () => {
    if (isCrashed) return;
    const txId = txCounter++;
    appendLog('BEGIN', txId);
    logSys(`Started Tx ${txId}`);
});

document.getElementById('btnUpdateTx').addEventListener('click', () => {
    if (isCrashed) return;
    const active = Object.keys(activeTxs);
    if (active.length === 0) {
        logSys(`No active transactions to update.`);
        return;
    }
    // Pick random tx
    const txId = active[Math.floor(Math.random() * active.length)];
    const pageId = 'P' + Math.floor(Math.random() * 5 + 1); // P1-P5
    
    appendLog('UPDATE', txId, pageId);
    logSys(`Tx ${txId} updated page ${pageId}`);
});

document.getElementById('btnCommitTx').addEventListener('click', () => {
    if (isCrashed) return;
    const active = Object.keys(activeTxs);
    if (active.length === 0) return;
    
    // Commit oldest
    const txId = active[0];
    appendLog('COMMIT', txId);
    delete activeTxs[txId];
    appendLog('END', txId);
    logSys(`Committed Tx ${txId}`);
    renderState();
});

document.getElementById('btnCrash').addEventListener('click', () => {
    if (isCrashed) return;
    isCrashed = true;
    
    // Wipe memory
    activeTxs = {};
    dirtyPages = {};
    
    document.querySelectorAll('.db-components .btn').forEach(b => b.disabled = true);
    document.getElementById('btnStartRecovery').disabled = false;
    
    logSys(`⚡ SYSTEM CRASH! Memory wiped. WAL preserved on disk.`);
    renderState();
});

document.getElementById('btnStartRecovery').addEventListener('click', () => {
    document.getElementById('btnStartRecovery').disabled = true;
    document.getElementById('btnStepRecovery').disabled = false;
    
    recoveryPhase = 'analysis';
    recoveryStepIndex = 0;
    
    document.getElementById('stepAnalysis').classList.add('active');
    logSys(`--- Starting ARIES Recovery ---`);
    logSys(`Phase 1: Analysis (Scanning WAL forward)`);
    renderState();
});

document.getElementById('btnStepRecovery').addEventListener('click', () => {
    if (recoveryPhase === 'analysis') {
        if (recoveryStepIndex < wal.length) {
            const rec = wal[recoveryStepIndex];
            logSys(`Analysis: Read LSN ${rec.lsn}`);
            if (rec.type === 'BEGIN' || rec.type === 'UPDATE') {
                if (!activeTxs[rec.txId]) activeTxs[rec.txId] = { status: 'U', lastLsn: rec.lsn };
                else activeTxs[rec.txId].lastLsn = rec.lsn;
            }
            if (rec.type === 'COMMIT') {
                if (activeTxs[rec.txId]) activeTxs[rec.txId].status = 'C';
            }
            if (rec.type === 'END') {
                delete activeTxs[rec.txId];
            }
            if (rec.type === 'UPDATE' || rec.type === 'CLR') {
                if (!(rec.pageId in dirtyPages)) {
                    dirtyPages[rec.pageId] = rec.lsn;
                }
            }
            recoveryStepIndex++;
        } else {
            recoveryPhase = 'redo';
            recoveryStepIndex = 0; // Find min RecLSN
            
            let minRecLsn = Infinity;
            Object.values(dirtyPages).forEach(lsn => {
                if (lsn < minRecLsn) minRecLsn = lsn;
            });
            
            if (minRecLsn === Infinity) {
                recoveryStepIndex = wal.length; // Skip redo
            } else {
                recoveryStepIndex = wal.findIndex(r => r.lsn === minRecLsn);
                if(recoveryStepIndex === -1) recoveryStepIndex = wal.length;
            }
            
            document.getElementById('stepAnalysis').classList.remove('active');
            document.getElementById('stepRedo').classList.add('active');
            logSys(`Analysis Complete. Active Txs: [${Object.keys(activeTxs).join(',')}]`);
            logSys(`Phase 2: Redo (Starting from Min RecLSN)`);
        }
    } else if (recoveryPhase === 'redo') {
        if (recoveryStepIndex < wal.length) {
            const rec = wal[recoveryStepIndex];
            if (rec.type === 'UPDATE' || rec.type === 'CLR') {
                if (rec.pageId in dirtyPages && rec.lsn >= dirtyPages[rec.pageId]) {
                    logSys(`Redo: Re-applying LSN ${rec.lsn} to Page ${rec.pageId}`);
                }
            }
            recoveryStepIndex++;
        } else {
            recoveryPhase = 'undo';
            // Prepare Undo list
            undoList = [];
            Object.keys(activeTxs).forEach(txId => {
                if (activeTxs[txId].status === 'U') {
                    undoList.push(activeTxs[txId].lastLsn);
                }
            });
            undoList.sort((a,b) => b - a); // Descending
            
            document.getElementById('stepRedo').classList.remove('active');
            document.getElementById('stepUndo').classList.add('active');
            logSys(`Redo Complete. Rolling back uncommitted Txs.`);
            logSys(`Phase 3: Undo (Scanning backwards)`);
        }
    } else if (recoveryPhase === 'undo') {
        if (undoList.length > 0) {
            const targetLsn = Math.max(...undoList);
            const rec = wal.find(r => r.lsn === targetLsn);
            
            // Remove targetLsn from undoList
            undoList = undoList.filter(l => l !== targetLsn);
            recoveryStepIndex = wal.indexOf(rec) + 1; // For highlighting in UI
            
            if (rec.type === 'UPDATE') {
                logSys(`Undo: Rolling back LSN ${rec.lsn} (Tx ${rec.txId})`);
                // Write CLR
                appendLog('CLR', rec.txId, rec.pageId, rec.prevLsn);
                if (rec.prevLsn > 0) {
                    undoList.push(rec.prevLsn);
                } else {
                    appendLog('END', rec.txId);
                    logSys(`Undo: Tx ${rec.txId} rollback complete.`);
                    delete activeTxs[rec.txId];
                }
            }
        } else {
            document.getElementById('stepUndo').classList.remove('active');
            document.getElementById('btnStepRecovery').disabled = true;
            document.getElementById('btnReset').style.display = 'inline-block';
            logSys(`--- Recovery Complete ---`);
            recoveryPhase = null;
        }
    }
    
    renderState();
});

document.getElementById('btnReset').addEventListener('click', () => {
    isCrashed = false;
    lsnCounter = 1;
    txCounter = 1;
    activeTxs = {};
    dirtyPages = {};
    wal = [];
    sysLog.innerHTML = '';
    
    document.querySelectorAll('.db-components .btn').forEach(b => b.disabled = false);
    document.getElementById('btnStartRecovery').disabled = true;
    document.getElementById('btnStepRecovery').disabled = true;
    document.getElementById('btnReset').style.display = 'none';
    
    renderState();
});

// Initial render
renderState();
