/**
 * mvcc-simulator.js
 * Implements a strict Mathematical Snapshot Isolation and Read Committed visibility engine.
 * Mimics PostgreSQL's multi-version concurrency control (xmin, xmax) without locks.
 */

document.addEventListener("DOMContentLoaded", () => {
    initMVCCEngine();
});

// ==========================================
// 1. DATABASE STATE & MVCC ENGINE
// ==========================================

let dbState = {
    txCounter: 1, // Global Transaction ID issuer
    transactions: {}, // Stores all historical and active txs: { id: { status, isoLevel, snapshot } }
    tuples: [], // The physical table rows
    activeTxs: new Set() // Currently running tx IDs
};

const TX_STATUS = {
    ACTIVE: 'ACTIVE',
    COMMITTED: 'COMMITTED',
    ABORTED: 'ABORTED'
};

const ISO_LEVEL = {
    READ_COMMITTED: 'READ_COMMITTED',
    REPEATABLE_READ: 'REPEATABLE_READ'
};

// DOM Elements
const els = {
    btnVacuum: document.getElementById('btnVacuum'),
    btnResetDB: document.getElementById('btnResetDB'),
    globalTxCounter: document.getElementById('globalTxCounter'),
    dbTableBody: document.getElementById('dbTableBody'),
    
    clients: {
        A: {
            isoSelect: document.getElementById('isoA'),
            status: document.getElementById('statusA'),
            output: document.getElementById('outputA'),
            buttons: document.querySelectorAll('.btn-macro[data-tx="A"]'),
            activeTxId: null,
            name: 'A'
        },
        B: {
            isoSelect: document.getElementById('isoB'),
            status: document.getElementById('statusB'),
            output: document.getElementById('outputB'),
            buttons: document.querySelectorAll('.btn-macro[data-tx="B"]'),
            activeTxId: null,
            name: 'B'
        }
    }
};

// ==========================================
// 2. INITIALIZATION
// ==========================================
function initMVCCEngine() {
    bindEvents();
    resetDatabase();
}

function bindEvents() {
    els.btnResetDB.addEventListener('click', resetDatabase);
    els.btnVacuum.addEventListener('click', runVacuum);

    // Bind Terminal Macros
    ['A', 'B'].forEach(clientName => {
        const client = els.clients[clientName];
        client.buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.getAttribute('data-cmd');
                executeCommand(clientName, cmd);
            });
        });
    });
}

function resetDatabase() {
    dbState = {
        txCounter: 1,
        transactions: {},
        tuples: [],
        activeTxs: new Set()
    };
    
    // Seed initial data (Created by Tx 0 logically)
    dbState.transactions[0] = { id: 0, status: TX_STATUS.COMMITTED, isoLevel: ISO_LEVEL.READ_COMMITTED, snapshot: new Set() };
    dbState.tuples.push({ uid: Math.random(), id: 1, val: "Alice", xmin: 0, xmax: null });
    dbState.tuples.push({ uid: Math.random(), id: 2, val: "Bob", xmin: 0, xmax: null });

    ['A', 'B'].forEach(clientName => {
        const client = els.clients[clientName];
        client.activeTxId = null;
        updateClientUI(clientName);
        client.output.innerHTML = `<div class="log-line sys">> Client ${clientName} connected. Ready.</div>`;
    });

    updateGlobalUI();
}

function logTerminal(clientName, msg, type = 'sys') {
    const term = els.clients[clientName].output;
    const div = document.createElement('div');
    div.className = `log-line ${type}`;
    div.textContent = msg;
    term.appendChild(div);
    term.scrollTop = term.scrollHeight;
}

// ==========================================
// 3. TRANSACTION COMMAND EXECUTION
// ==========================================

function executeCommand(clientName, cmd) {
    const client = els.clients[clientName];

    logTerminal(clientName, `> ${cmd}`, 'cmd');

    try {
        switch (cmd) {
            case 'BEGIN':
                if (client.activeTxId !== null) throw new Error("Transaction already in progress.");
                const txId = dbState.txCounter++;
                const isoLevel = client.isoSelect.value;
                
                // Take a snapshot of CURRENTLY active transactions for Repeatable Read
                const snapshot = new Set(dbState.activeTxs);
                
                dbState.transactions[txId] = { id: txId, status: TX_STATUS.ACTIVE, isoLevel, snapshot };
                dbState.activeTxs.add(txId);
                client.activeTxId = txId;
                
                logTerminal(clientName, `Started Tx ${txId} (${isoLevel})`, 'res');
                break;

            case 'COMMIT':
                if (client.activeTxId === null) throw new Error("No active transaction.");
                dbState.transactions[client.activeTxId].status = TX_STATUS.COMMITTED;
                dbState.activeTxs.delete(client.activeTxId);
                logTerminal(clientName, `Tx ${client.activeTxId} COMMITTED successfully.`, 'res');
                client.activeTxId = null;
                break;

            case 'ROLLBACK':
                if (client.activeTxId === null) throw new Error("No active transaction.");
                dbState.transactions[client.activeTxId].status = TX_STATUS.ABORTED;
                dbState.activeTxs.delete(client.activeTxId);
                logTerminal(clientName, `Tx ${client.activeTxId} ABORTED.`, 'warn');
                client.activeTxId = null;
                break;

            case 'SELECT':
                if (client.activeTxId === null) throw new Error("Start a transaction first.");
                const results = executeSelect(client.activeTxId);
                if (results.length === 0) {
                    logTerminal(clientName, `0 rows returned.`, 'res');
                } else {
                    results.forEach(row => {
                        logTerminal(clientName, `ID: ${row.id} | Val: ${row.val}`, 'res');
                    });
                    logTerminal(clientName, `${results.length} rows returned.`, 'sys');
                }
                break;

            case 'UPDATE':
                if (client.activeTxId === null) throw new Error("Start a transaction first.");
                // For simplicity, we hardcode updating ID=1 to a random new value
                const newVal = `User_${Math.floor(Math.random() * 1000)}`;
                executeUpdate(client.activeTxId, 1, newVal);
                logTerminal(clientName, `Updated ID 1 to '${newVal}'.`, 'res');
                break;
        }
    } catch (err) {
        logTerminal(clientName, `ERROR: ${err.message}`, 'err');
        
        // If it's a conflict error, automatically rollback to mimic real DBs
        if (err.message.includes("Conflict")) {
            logTerminal(clientName, `Rolling back transaction automatically...`, 'warn');
            dbState.transactions[client.activeTxId].status = TX_STATUS.ABORTED;
            dbState.activeTxs.delete(client.activeTxId);
            client.activeTxId = null;
        }
    }

    updateClientUI(clientName);
    updateGlobalUI();
}

function updateClientUI(clientName) {
    const client = els.clients[clientName];
    const isActive = client.activeTxId !== null;

    if (isActive) {
        client.status.textContent = `TX ${client.activeTxId} ACTIVE`;
        client.status.className = 'term-status active';
        client.isoSelect.disabled = true;
    } else {
        client.status.textContent = `IDLE`;
        client.status.className = 'term-status';
        client.isoSelect.disabled = false;
    }

    // Button states
    client.buttons.forEach(btn => {
        const cmd = btn.getAttribute('data-cmd');
        if (cmd === 'BEGIN') btn.disabled = isActive;
        else btn.disabled = !isActive;
    });
}

// ==========================================
// 4. MVCC VISIBILITY RULES (The Core Mathematics)
// ==========================================

function isTupleVisible(tuple, txId) {
    const tx = dbState.transactions[txId];
    
    // 1. Determine Effective Snapshot based on Isolation Level
    let snapshot;
    if (tx.isoLevel === ISO_LEVEL.REPEATABLE_READ) {
        // Use the snapshot taken at BEGIN
        snapshot = tx.snapshot;
    } else {
        // READ_COMMITTED: Take a fresh snapshot at the start of every statement
        snapshot = new Set(dbState.activeTxs);
    }

    // Helper: Was transaction X committed BEFORE our snapshot?
    const isCommittedBeforeSnapshot = (xId) => {
        if (xId === null) return false;
        if (xId === txId) return true; // Self-writes are always visible
        const xTx = dbState.transactions[xId];
        // Must be committed, AND must not have been active when our snapshot was taken, AND must be older than our Tx
        return xTx.status === TX_STATUS.COMMITTED && !snapshot.has(xId) && xId < txId;
    };

    // 2. Check XMIN (Creation) Visibility
    let xminVisible = false;
    if (tuple.xmin === txId) {
        xminVisible = true; // We created it
    } else if (isCommittedBeforeSnapshot(tuple.xmin)) {
        xminVisible = true; // Someone else created it and committed before our snapshot
    }

    if (!xminVisible) return false;

    // 3. Check XMAX (Deletion/Update) Visibility
    let xmaxVisible = false;
    if (tuple.xmax === null) {
        xmaxVisible = false; // Not deleted
    } else if (tuple.xmax === txId) {
        xmaxVisible = true; // We deleted it
    } else if (dbState.transactions[tuple.xmax].status === TX_STATUS.ABORTED) {
        xmaxVisible = false; // Deletion was rolled back, so it's not deleted
    } else if (isCommittedBeforeSnapshot(tuple.xmax)) {
        xmaxVisible = true; // Someone else deleted it and committed before our snapshot
    }

    // Tuple is visible if it was created (visible) and NOT deleted (visible)
    return xminVisible && !xmaxVisible;
}

function executeSelect(txId) {
    const results = [];
    dbState.tuples.forEach(tuple => {
        if (isTupleVisible(tuple, txId)) {
            results.push(tuple);
        }
    });
    return results;
}

function executeUpdate(txId, rowId, newVal) {
    // 1. Find the visible version of the row to update
    let targetTuple = null;
    for (let tuple of dbState.tuples) {
        if (tuple.id === rowId && isTupleVisible(tuple, txId)) {
            targetTuple = tuple;
            break;
        }
    }

    if (!targetTuple) throw new Error(`Row ID ${rowId} not found or not visible.`);

    // 2. Check for Write-Write Conflicts (Concurrent Updates)
    // If xmax is set to a currently active transaction, we have a conflict.
    if (targetTuple.xmax !== null && targetTuple.xmax !== txId) {
        const xmaxTx = dbState.transactions[targetTuple.xmax];
        if (xmaxTx.status === TX_STATUS.ACTIVE) {
            throw new Error(`Write-Write Conflict! Tx ${targetTuple.xmax} is currently updating this row.`);
        }
        // If xmax committed AFTER our snapshot (in Repeatable Read), we also fail (Serialization error)
        const tx = dbState.transactions[txId];
        if (tx.isoLevel === ISO_LEVEL.REPEATABLE_READ && xmaxTx.status === TX_STATUS.COMMITTED) {
            throw new Error(`Serialization Failure! Row was modified by Tx ${targetTuple.xmax} which committed after we started.`);
        }
    }

    // 3. Perform the MVCC Update
    // Mark old tuple as deleted by us
    targetTuple.xmax = txId;

    // Insert new tuple version
    const newTuple = {
        uid: Math.random(), // React-style key for animations
        id: rowId,
        val: newVal,
        xmin: txId,
        xmax: null,
        isNew: true
    };
    dbState.tuples.push(newTuple);
}

// ==========================================
// 5. GARBAGE COLLECTION (VACUUM)
// ==========================================

function runVacuum() {
    // Find the oldest active transaction (Global Minimum XMIN)
    let minActiveXmin = dbState.txCounter;
    dbState.activeTxs.forEach(txId => {
        if (txId < minActiveXmin) minActiveXmin = txId;
    });

    const initialCount = dbState.tuples.length;

    // A tuple is dead (garbage) if it was deleted by a committed transaction
    // AND that transaction is older than ALL currently active transactions.
    dbState.tuples = dbState.tuples.filter(tuple => {
        if (tuple.xmax !== null) {
            const xmaxTx = dbState.transactions[tuple.xmax];
            if (xmaxTx.status === TX_STATUS.COMMITTED && tuple.xmax < minActiveXmin) {
                return false; // Safely collect garbage
            }
        }
        return true; // Keep
    });

    const removed = initialCount - dbState.tuples.length;
    
    // Log globally
    ['A', 'B'].forEach(clientName => {
        logTerminal(clientName, `SYSTEM: VACUUM completed. Removed ${removed} dead tuples.`, 'sys');
    });

    updateGlobalUI();
}

// ==========================================
// 6. GLOBAL UI RENDERING
// ==========================================

function updateGlobalUI() {
    els.globalTxCounter.textContent = dbState.txCounter;
    els.dbTableBody.innerHTML = '';

    dbState.tuples.forEach(tuple => {
        const tr = document.createElement('tr');
        
        // Determine physical status for styling
        let rowClass = 'live';
        if (tuple.xmax !== null) {
            const xmaxTx = dbState.transactions[tuple.xmax];
            if (xmaxTx.status === TX_STATUS.COMMITTED) rowClass = 'dead';
            else if (xmaxTx.status === TX_STATUS.ABORTED) rowClass = 'live'; // Rollback saved it
            else rowClass = 'uncommitted'; // Someone is actively deleting it
        } else {
            const xminTx = dbState.transactions[tuple.xmin];
            if (xminTx.status === TX_STATUS.ACTIVE) rowClass = 'uncommitted';
            else if (xminTx.status === TX_STATUS.ABORTED) rowClass = 'dead'; // Created but rolled back
        }

        if (tuple.isNew) {
            tr.classList.add('new-row');
            tuple.isNew = false; // Only flash once
        }

        tr.classList.add(rowClass);

        const xminStr = `<span class="xmin-badge">${tuple.xmin}</span>`;
        let xmaxStr = '<span class="xmax-null">NULL</span>';
        if (tuple.xmax !== null) {
            xmaxStr = `<span class="xmax-badge">${tuple.xmax}</span>`;
        }

        let statusText = rowClass.charAt(0).toUpperCase() + rowClass.slice(1);

        tr.innerHTML = `
            <td>${tuple.id}</td>
            <td><strong>${tuple.val}</strong></td>
            <td>${xminStr}</td>
            <td>${xmaxStr}</td>
            <td>${statusText}</td>
        `;
        els.dbTableBody.appendChild(tr);
    });
}
