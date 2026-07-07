/**
 * crdt-visualizer.js
 * Implements a Sequence CRDT using Fractional Indexing.
 * Includes a deterministic Network Delay Simulator and diffing logic for HTML textareas.
 */

document.addEventListener("DOMContentLoaded", () => {
    initCRDTEngine();
});

// ==========================================
// 1. FRACTIONAL INDEXING ALGORITHM
// ==========================================

const MIN_CHAR = 32;  // ASCII Space ' '
const MAX_CHAR = 126; // ASCII Tilde '~'

/**
 * Generates a string strictly lexicographically between a and b.
 * Works like decimal fractions: between "1.4" and "1.5" is "1.45".
 */
function generateKeyBetween(a, b) {
    a = a || "";
    b = b || "";
    let key = "";
    let i = 0;

    while (true) {
        let charA = i < a.length ? a.charCodeAt(i) : MIN_CHAR;
        let charB = i < b.length ? b.charCodeAt(i) : MAX_CHAR;

        if (charA === charB) {
            key += String.fromCharCode(charA);
            i++;
            continue;
        }

        // If there's a gap greater than 1, we can pick the midpoint
        if (charB - charA > 1) {
            let mid = Math.floor((charA + charB) / 2);
            key += String.fromCharCode(mid);
            return key;
        }

        // Gap is exactly 1 (e.g., 'A' and 'B'). 
        // Append charA, then move to next character of 'a' and go halfway to MAX_CHAR.
        if (charB - charA === 1) {
            key += String.fromCharCode(charA);
            let nextA = (i + 1 < a.length) ? a.charCodeAt(i + 1) : MIN_CHAR;
            let mid = Math.floor((nextA + MAX_CHAR) / 2);
            key += String.fromCharCode(mid);
            return key;
        }
    }
}

// ==========================================
// 2. CRDT DOCUMENT CLASS
// ==========================================
class CRDTDocument {
    constructor(siteId, onUpdate) {
        this.siteId = siteId;
        this.counter = 0;
        this.nodes = []; // Sorted array of { id, key, char }
        this.onUpdate = onUpdate;
    }

    insertLocal(index, char) {
        const prevKey = index > 0 ? this.nodes[index - 1].key : null;
        const nextKey = index < this.nodes.length ? this.nodes[index].key : null;
        
        const key = generateKeyBetween(prevKey, nextKey);
        const id = `${this.siteId}-${++this.counter}`;
        const node = { id, key, char };
        
        this.nodes.splice(index, 0, node);
        if (this.onUpdate) this.onUpdate();
        
        return { type: 'insert', node };
    }

    deleteLocal(index) {
        if (index < 0 || index >= this.nodes.length) return null;
        const node = this.nodes[index];
        this.nodes.splice(index, 1);
        if (this.onUpdate) this.onUpdate();
        
        return { type: 'delete', id: node.id };
    }

    applyRemoteOp(op) {
        if (op.type === 'insert') {
            this.nodes.push(op.node);
            // Sort by key, using ID as tie-breaker for identical concurrent keys
            this.nodes.sort((a, b) => {
                if (a.key === b.key) return a.id.localeCompare(b.id);
                return a.key.localeCompare(b.key);
            });
        } else if (op.type === 'delete') {
            this.nodes = this.nodes.filter(n => n.id !== op.id);
        }
        if (this.onUpdate) this.onUpdate();
    }

    toText() {
        return this.nodes.map(n => n.char).join('');
    }
}

// ==========================================
// 3. NETWORK SIMULATOR
// ==========================================
class NetworkSimulator {
    constructor() {
        this.isFrozen = false;
        this.frozenQueue = []; // Holds operations while frozen
        this.delay = 2000;
        this.timeouts = new Set(); // Tracks in-flight delivery timers so they can be cancelled on reset

        this.ui = {
            laneAtoB: document.getElementById('trackAtoB'),
            laneBtoA: document.getElementById('trackBtoA')
        };
    }

    send(from, to, op) {
        const packet = { from, to, op, id: Date.now() + Math.random() };
        
        if (this.isFrozen) {
            this.frozenQueue.push(packet);
            this.renderFrozenPacket(packet);
        } else {
            this.dispatchPacket(packet);
        }
    }

    dispatchPacket(packet) {
        const track = packet.from === 'A' ? this.ui.laneAtoB : this.ui.laneBtoA;
        const el = document.createElement('div');
        
        const isDel = packet.op.type === 'delete';
        const displayChar = isDel ? 'DEL' : `+ '${packet.op.node.char}'`;
        
        el.className = `net-packet ${isDel ? 'packet-delete' : 'packet-insert'}`;
        el.textContent = displayChar;
        
        // Setup Animation (A->B goes left to right, B->A goes right to left)
        el.style.animation = `slide${packet.from === 'A' ? 'Right' : 'Left'} ${this.delay}ms linear forwards`;
        track.appendChild(el);

        // Deliver payload when animation finishes
        const timeoutId = setTimeout(() => {
            this.timeouts.delete(timeoutId);
            el.remove();
            deliverToSite(packet.to, packet.op);
        }, this.delay);
        this.timeouts.add(timeoutId);
    }

    // Fully reset the simulator: cancel pending deliveries, clear queued/frozen
    // state, and wipe the packet tracks. Prevents in-flight packets from firing
    // into freshly-cleared documents ("ghost characters").
    reset() {
        this.timeouts.forEach(id => clearTimeout(id));
        this.timeouts.clear();

        this.isFrozen = false;
        this.frozenQueue = [];

        if (this.ui.laneAtoB) this.ui.laneAtoB.innerHTML = '';
        if (this.ui.laneBtoA) this.ui.laneBtoA.innerHTML = '';
    }

    renderFrozenPacket(packet) {
        const track = packet.from === 'A' ? this.ui.laneAtoB : this.ui.laneBtoA;
        const el = document.createElement('div');
        
        const isDel = packet.op.type === 'delete';
        const displayChar = isDel ? 'DEL' : `+ '${packet.op.node.char}'`;
        
        el.className = `net-packet frozen ${isDel ? 'packet-delete' : 'packet-insert'}`;
        el.textContent = displayChar;
        
        // Stack them visually on the source side
        const offset = track.children.length * 10; 
        if (packet.from === 'A') el.style.left = `${10 + offset}px`;
        else el.style.right = `${10 + offset}px`;
        
        // Attach raw data so we can animate it later
        el.dataset.id = packet.id;
        track.appendChild(el);
    }

    toggleFreeze() {
        this.isFrozen = !this.isFrozen;
        if (!this.isFrozen) {
            // Release all queued packets
            const packetsToDispatch = [...this.frozenQueue];
            this.frozenQueue = [];
            
            // Clear frozen DOM elements
            this.ui.laneAtoB.innerHTML = '';
            this.ui.laneBtoA.innerHTML = '';

            // Dispatch concurrently
            packetsToDispatch.forEach(p => this.dispatchPacket(p));
        }
    }
}

// ==========================================
// 4. APP STATE & UI CONTROLLER
// ==========================================

const network = new NetworkSimulator();
let docA, docB;

const els = {
    editorA: document.getElementById('editorA'),
    editorB: document.getElementById('editorB'),
    tableBodyA: document.getElementById('tableBodyA'),
    tableBodyB: document.getElementById('tableBodyB'),
    
    delaySlider: document.getElementById('delaySlider'),
    delayValue: document.getElementById('delayValue'),
    btnFreezeNetwork: document.getElementById('btnFreezeNetwork'),
    btnResumeNetwork: document.getElementById('btnResumeNetwork'),
    btnClearAll: document.getElementById('btnClearAll')
};

function initCRDTEngine() {
    docA = new CRDTDocument('A', () => renderTable('A'));
    docB = new CRDTDocument('B', () => renderTable('B'));

    bindEvents();
}

function deliverToSite(siteId, op) {
    const targetDoc = siteId === 'A' ? docA : docB;
    const targetEditor = siteId === 'A' ? els.editorA : els.editorB;
    
    targetDoc.applyRemoteOp(op);
    
    // Update Textarea (Preserving cursor position)
    const newText = targetDoc.toText();
    if (targetEditor.value !== newText) {
        const cursorStart = targetEditor.selectionStart;
        const cursorEnd = targetEditor.selectionEnd;
        targetEditor.value = newText;
        
        // Basic cursor restoration
        const offset = op.type === 'insert' ? 1 : -1;
        targetEditor.setSelectionRange(cursorStart + offset, cursorEnd + offset);
    }
}

// Diffing Algorithm to translate standard text input into CRDT Operations
function handleLocalInput(siteId, doc, editor) {
    const oldText = doc.toText();
    const newText = editor.value;
    if (oldText === newText) return;

    let start = 0;
    while (start < oldText.length && start < newText.length && oldText[start] === newText[start]) {
        start++;
    }

    let oldEnd = oldText.length - 1;
    let newEnd = newText.length - 1;
    while (oldEnd >= start && newEnd >= start && oldText[oldEnd] === newText[newEnd]) {
        oldEnd--;
        newEnd--;
    }

    const targetPeer = siteId === 'A' ? 'B' : 'A';

    // 1. Process Deletions (Backwards to preserve indices)
    for (let i = oldEnd; i >= start; i--) {
        const op = doc.deleteLocal(i);
        if (op) network.send(siteId, targetPeer, op);
    }

    // 2. Process Insertions
    for (let i = start; i <= newEnd; i++) {
        const op = doc.insertLocal(i, newText[i]);
        if (op) network.send(siteId, targetPeer, op);
    }
}

function bindEvents() {
    // Editor Inputs
    els.editorA.addEventListener('input', () => handleLocalInput('A', docA, els.editorA));
    els.editorB.addEventListener('input', () => handleLocalInput('B', docB, els.editorB));

    // Network Controls
    els.delaySlider.addEventListener('input', (e) => {
        network.delay = parseInt(e.target.value);
        els.delayValue.textContent = (network.delay / 1000).toFixed(1) + 's';
    });

    els.btnFreezeNetwork.addEventListener('click', () => {
        network.toggleFreeze();
        els.btnFreezeNetwork.classList.add('hidden');
        els.btnResumeNetwork.classList.remove('hidden');
    });

    els.btnResumeNetwork.addEventListener('click', () => {
        network.toggleFreeze();
        els.btnResumeNetwork.classList.add('hidden');
        els.btnFreezeNetwork.classList.remove('hidden');
    });

    els.btnClearAll.addEventListener('click', () => {
        // Cancel in-flight packets and reset network state before rebuilding docs
        network.reset();

        els.editorA.value = '';
        els.editorB.value = '';
        docA = new CRDTDocument('A', () => renderTable('A'));
        docB = new CRDTDocument('B', () => renderTable('B'));
        renderTable('A');
        renderTable('B');

        // Network is no longer frozen after a reset — restore button state
        els.btnResumeNetwork.classList.add('hidden');
        els.btnFreezeNetwork.classList.remove('hidden');
    });
}

function renderTable(siteId) {
    const doc = siteId === 'A' ? docA : docB;
    const tbody = siteId === 'A' ? els.tableBodyA : els.tableBodyB;
    
    tbody.innerHTML = '';
    
    doc.nodes.forEach(node => {
        const tr = document.createElement('tr');
        
        // Prepend "0." so it looks like a fraction mathematically to the user
        const displayKey = `0.${node.key}`; 
        const displayChar = node.char === ' ' ? '&nbsp;' : node.char;
        
        tr.innerHTML = `
            <td><span class="char-val">${displayChar}</span></td>
            <td class="key-val">${displayKey}</td>
            <td>${node.id}</td>
        `;
        tbody.appendChild(tr);
    });
}
