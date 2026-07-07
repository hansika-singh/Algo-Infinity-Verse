/**
 * doubly-linked-list-visualizer.js
 * Advanced visualizer for Doubly Linked List Operations.
 */

document.addEventListener("DOMContentLoaded", () => {
    initDLLVisualizer();
});

// --- State Management ---
const state = {
    nodes: [], // { id, val }
    nodeCounter: 0,
    isAnimating: false,
    ptrUpdates: 0
};

// UI Config
const NODE_WIDTH = 100;
const NODE_SPACING = 80;

// DOM Elements
const els = {
    wrapper: document.getElementById('canvasWrapper'),
    nodesLayer: document.getElementById('nodesLayer'),
    svgLayer: document.getElementById('svgLayer'),
    arrowsGroup: document.getElementById('arrowsGroup'),
    emptyState: document.getElementById('emptyState'),
    
    btnRandomize: document.getElementById('btnRandomize'),
    btnReset: document.getElementById('btnReset'),
    insertVal: document.getElementById('insertVal'),
    insertPos: document.getElementById('insertPos'),
    deleteVal: document.getElementById('deleteVal'),
    searchVal: document.getElementById('searchVal'),
    animSpeed: document.getElementById('animSpeed'),
    
    btnInsertHead: document.getElementById('btnInsertHead'),
    btnInsertTail: document.getElementById('btnInsertTail'),
    btnInsertAt: document.getElementById('btnInsertAt'),
    btnDeleteHead: document.getElementById('btnDeleteHead'),
    btnDeleteTail: document.getElementById('btnDeleteTail'),
    btnDeletePos: document.getElementById('btnDeletePos'),
    btnDeleteVal: document.getElementById('btnDeleteVal'),
    btnSearch: document.getElementById('btnSearch'),
    btnTraverseFwd: document.getElementById('btnTraverseFwd'),
    btnTraverseBwd: document.getElementById('btnTraverseBwd'),
    btnReverse: document.getElementById('btnReverse'),
    
    logContainer: document.getElementById('logContainer'),
    
    statSize: document.getElementById('statSize'),
    statPtrs: document.getElementById('statPtrs'),
    statTime: document.getElementById('statTime'),
    
    pseudoCodeContent: document.getElementById('pseudoCodeContent')
};

const pseudoCodes = {
    insertHead: `Node newNode = new Node(val)\nif (head == null) {\n  head = tail = newNode\n} else {\n  newNode.next = head\n  head.prev = newNode\n  head = newNode\n}`,
    insertTail: `Node newNode = new Node(val)\nif (tail == null) {\n  head = tail = newNode\n} else {\n  tail.next = newNode\n  newNode.prev = tail\n  tail = newNode\n}`,
    insertAt: `Node newNode = new Node(val)\nCurr = head\nfor (i=0 to index-1) Curr = Curr.next\nnewNode.next = Curr\nnewNode.prev = Curr.prev\nCurr.prev.next = newNode\nCurr.prev = newNode`,
    deleteHead: `if (head == null) return\nif (head == tail) head = tail = null\nelse {\n  head = head.next\n  head.prev = null\n}`,
    deleteTail: `if (tail == null) return\nif (head == tail) head = tail = null\nelse {\n  tail = tail.prev\n  tail.next = null\n}`,
    traverseFwd: `Curr = head\nwhile (Curr != null) {\n  visit(Curr)\n  Curr = Curr.next\n}`,
    traverseBwd: `Curr = tail\nwhile (Curr != null) {\n  visit(Curr)\n  Curr = Curr.prev\n}`,
    reverse: `Curr = head, temp = null\nwhile (Curr != null) {\n  temp = Curr.prev\n  Curr.prev = Curr.next\n  Curr.next = temp\n  Curr = Curr.prev\n}\nif (temp != null) head = temp.prev`
};

function initDLLVisualizer() {
    bindEvents();
    window.addEventListener('resize', renderArrows);
    updateStats('O(1)');
}

function bindEvents() {
    els.btnRandomize.addEventListener('click', () => executeOp(randomizeList));
    els.btnReset.addEventListener('click', () => executeOp(resetList));

    // Insertions
    els.btnInsertHead.addEventListener('click', () => executeOp(() => insertNode(0, 'head')));
    els.btnInsertTail.addEventListener('click', () => executeOp(() => insertNode(state.nodes.length, 'tail')));
    els.btnInsertAt.addEventListener('click', () => executeOp(() => {
        const pos = parseInt(els.insertPos.value);
        if (isNaN(pos)) return logSys("Invalid index.", "error");
        insertNode(pos, 'index');
    }));

    // Deletions
    els.btnDeleteHead.addEventListener('click', () => executeOp(() => deleteNode(0, 'head')));
    els.btnDeleteTail.addEventListener('click', () => executeOp(() => deleteNode(state.nodes.length - 1, 'tail')));
    els.btnDeletePos.addEventListener('click', () => executeOp(() => {
        const pos = parseInt(els.deleteVal.value);
        if (isNaN(pos)) return logSys("Invalid index.", "error");
        deleteNode(pos, 'index');
    }));
    els.btnDeleteVal.addEventListener('click', () => executeOp(() => {
        const val = parseInt(els.deleteVal.value);
        if (isNaN(val)) return logSys("Invalid value.", "error");
        deleteByValue(val);
    }));

    // Operations
    els.btnSearch.addEventListener('click', () => executeOp(() => {
        const val = parseInt(els.searchVal.value);
        if (isNaN(val)) return logSys("Invalid search value.", "error");
        searchList(val);
    }));
    
    els.btnTraverseFwd.addEventListener('click', () => executeOp(() => traverseList(true)));
    els.btnTraverseBwd.addEventListener('click', () => executeOp(() => traverseList(false)));
    els.btnReverse.addEventListener('click', () => executeOp(reverseList));
}

function getDelay() {
    return parseInt(els.animSpeed.value);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function logSys(msg, type = 'info') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = `> ${msg}`;
    els.logContainer.appendChild(div);
    setTimeout(() => {
        els.logContainer.scrollTop = els.logContainer.scrollHeight;
    }, 10);
}

function updateStats(timeComplexity) {
    els.statSize.innerText = state.nodes.length;
    els.statPtrs.innerText = state.ptrUpdates;
    if (timeComplexity) els.statTime.innerText = timeComplexity;
}

function incrementPtrs(count = 1) {
    state.ptrUpdates += count;
    updateStats();
}

function lockUI(locked) {
    state.isAnimating = locked;
    const btns = document.querySelectorAll('.operation-panel .btn, .control-section .btn');
    btns.forEach(b => b.disabled = locked);
}

function renderPseudo(type) {
    if (!pseudoCodes[type]) {
        els.pseudoCodeContent.innerHTML = '// Operation pseudocode will appear here';
        return;
    }
    const lines = pseudoCodes[type].split('\n');
    els.pseudoCodeContent.innerHTML = lines.map((l, i) => `<div id="pseudo-l${i}" class="code-line">${l.replace(/ /g, '&nbsp;')}</div>`).join('');
}

async function highlightPseudo(lineIdx) {
    document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active'));
    const el = document.getElementById(`pseudo-l${lineIdx}`);
    if (el) el.classList.add('active');
    await sleep(getDelay() / 2);
}

async function executeOp(asyncFunc) {
    if (state.isAnimating) return;
    lockUI(true);
    try {
        await asyncFunc();
    } catch (e) {
        console.error(e);
        logSys("Execution error.", "error");
    }
    lockUI(false);
}

async function randomizeList() {
    state.nodes = [];
    state.ptrUpdates = 0;
    const size = Math.floor(Math.random() * 5) + 3; // 3 to 7 nodes
    for (let i = 0; i < size; i++) {
        state.nodes.push({ id: ++state.nodeCounter, val: Math.floor(Math.random() * 99) + 1 });
    }
    renderNodesDOM();
    renderArrows();
    updateStats('O(N)');
    logSys(`Randomized list with ${size} nodes.`, 'sys');
}

async function resetList() {
    state.nodes = [];
    state.ptrUpdates = 0;
    renderNodesDOM();
    renderArrows();
    updateStats('O(1)');
    renderPseudo('');
    logSys("List cleared manually.", "sys");
}

// ==========================================
// RENDERING LOGIC (DOM + SVG)
// ==========================================

function renderNodesDOM() {
    els.nodesLayer.innerHTML = '';
    
    if (state.nodes.length === 0) {
        els.emptyState.style.opacity = '1';
        return;
    }
    els.emptyState.style.opacity = '0';

    state.nodes.forEach((node, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'dll-node-wrapper';
        wrapper.id = `wrapper-${node.id}`;
        
        let ptrsTop = `<div class="dll-pointers-top" id="ptrs-top-${node.id}">`;
        if (idx === 0) ptrsTop += `<span class="ptr-badge head">HEAD</span>`;
        if (idx === state.nodes.length - 1) ptrsTop += `<span class="ptr-badge tail">TAIL</span>`;
        ptrsTop += `</div>`;

        let ptrsBottom = `<div class="dll-pointers-bottom" id="ptrs-bot-${node.id}"></div>`;
        let innerHtml = `<div class="dll-prev"><i class="fas fa-circle"></i></div>`;
        innerHtml += `<div class="dll-value">${node.val}</div>`;
        innerHtml += `<div class="dll-next"><i class="fas fa-circle"></i></div>`;
        const indexHtml = `<div class="dll-index">[${idx}]</div>`;

        wrapper.innerHTML = ptrsTop + `<div class="dll-node" id="node-${node.id}">${innerHtml}</div>` + ptrsBottom + indexHtml;
        els.nodesLayer.appendChild(wrapper);
    });
    
    els.wrapper.scrollLeft = els.wrapper.scrollWidth;
}

function renderArrows() {
    els.arrowsGroup.innerHTML = '';
    if (state.nodes.length === 0) return;

    setTimeout(() => {
        const layerRect = els.svgLayer.getBoundingClientRect();

        for (let i = 0; i < state.nodes.length; i++) {
            const curr = state.nodes[i];
            const next = state.nodes[i + 1];
            
            const currEl = document.getElementById(`node-${curr.id}`);
            if (!currEl) continue;
            const currRect = currEl.getBoundingClientRect();
            
            if (next) {
                const nextEl = document.getElementById(`node-${next.id}`);
                const nextRect = nextEl.getBoundingClientRect();

                // FWD Arrow (Top half)
                const startX_fwd = currRect.right - layerRect.left;
                const startY_fwd = currRect.top + (currRect.height * 0.3) - layerRect.top;
                const endX_fwd = nextRect.left - layerRect.left;
                const endY_fwd = startY_fwd;
                drawArrow(startX_fwd, startY_fwd, endX_fwd, endY_fwd, `arrow-fwd-${i}`, 'fwd');

                // BWD Arrow (Bottom half)
                const startX_bwd = nextRect.left - layerRect.left;
                const startY_bwd = nextRect.top + (nextRect.height * 0.7) - layerRect.top;
                const endX_bwd = currRect.right - layerRect.left;
                const endY_bwd = startY_bwd;
                drawArrow(startX_bwd, startY_bwd, endX_bwd, endY_bwd, `arrow-bwd-${i}`, 'bwd');
            }
        }
    }, 50);
}

function drawArrow(x1, y1, x2, y2, id, type) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute('id', id);
    path.setAttribute('class', `ptr-arrow ${type}`);
    
    const gap = 4;
    const actualX2 = type === 'bwd' ? x2 + gap : x2 - gap;
    
    path.setAttribute('d', `M ${x1} ${y1} L ${actualX2} ${y2}`);
    path.setAttribute('marker-end', `url(#arrowhead-${type})`);
    
    els.arrowsGroup.appendChild(path);
    return path;
}

function highlightNode(id, isActive) {
    const el = document.getElementById(`node-${id}`);
    if (el) {
        if (isActive) el.classList.add('active');
        else el.classList.remove('active');
    }
}

function setTempPointer(id, label) {
    const ptrs = document.getElementById(`ptrs-bot-${id}`);
    if (ptrs) {
        const exist = ptrs.querySelector('.temp');
        if (exist) exist.remove();
        if (label) {
            ptrs.innerHTML += `<span class="ptr-badge temp">${label}</span>`;
        }
    }
}

// ==========================================
// ALGORITHMIC OPERATIONS
// ==========================================

async function traverseTo(index, label = 'TEMP', delayMod = 1) {
    for (let i = 0; i <= index; i++) {
        if (i >= state.nodes.length) break;
        const curr = state.nodes[i];
        
        highlightNode(curr.id, true);
        setTempPointer(curr.id, label);
        
        if (i < index && i < state.nodes.length - 1) {
            await sleep(getDelay() * delayMod);
            const arrow = document.getElementById(`arrow-fwd-${i}`);
            if (arrow) arrow.classList.add('active');
            await sleep((getDelay() / 2) * delayMod);
            if (arrow) arrow.classList.remove('active');
        } else {
            await sleep(getDelay() * delayMod);
        }

        highlightNode(curr.id, false);
        setTempPointer(curr.id, null);
    }
}

async function insertNode(index, type = 'index') {
    const valInput = els.insertVal.value;
    if (valInput === '') return logSys("Provide a value to insert.", "error");
    const val = parseInt(valInput);

    if (index < 0 || index > state.nodes.length) {
        return logSys(`Index ${index} is out of bounds.`, "error");
    }

    logSys(`Inserting ${val} at index ${index}...`);
    
    if (type === 'head') {
        renderPseudo('insertHead');
        updateStats('O(1)');
        await highlightPseudo(0); // Node newNode
        await highlightPseudo(1); // if head == null
        if (state.nodes.length === 0) {
            await highlightPseudo(2);
            incrementPtrs(2); // head and tail
        } else {
            await highlightPseudo(4); // newNode.next = head
            incrementPtrs();
            await highlightPseudo(5); // head.prev = newNode
            incrementPtrs();
            await highlightPseudo(6); // head = newNode
            incrementPtrs();
        }
    } else if (type === 'tail') {
        renderPseudo('insertTail');
        updateStats('O(1)');
        await highlightPseudo(0);
        await highlightPseudo(1);
        if (state.nodes.length === 0) {
            await highlightPseudo(2);
            incrementPtrs(2);
        } else {
            await highlightPseudo(4); // tail.next = newNode
            incrementPtrs();
            await highlightPseudo(5); // newNode.prev = tail
            incrementPtrs();
            await highlightPseudo(6); // tail = newNode
            incrementPtrs();
        }
    } else {
        renderPseudo('insertAt');
        updateStats('O(N)');
        await highlightPseudo(0);
        await highlightPseudo(1);
        if (index > 0 && state.nodes.length > 0) {
            await highlightPseudo(2); // for loop
            await traverseTo(index - 1, 'CURR');
        }
        await highlightPseudo(3); incrementPtrs();
        await highlightPseudo(4); incrementPtrs();
        await highlightPseudo(5); incrementPtrs();
        await highlightPseudo(6); incrementPtrs();
    }

    const newNode = { id: ++state.nodeCounter, val: val };
    state.nodes.splice(index, 0, newNode);
    
    renderNodesDOM();
    renderArrows();
    updateStats();
    logSys(`Inserted ${val} successfully.`, "success");
    els.insertVal.value = '';
}

async function deleteNode(index, type = 'index') {
    if (state.nodes.length === 0) return logSys("List is empty.", "error");
    if (index < 0 || index >= state.nodes.length) return logSys("Invalid deletion index.", "error");

    logSys(`Deleting node at index ${index}...`);

    if (type === 'head') {
        renderPseudo('deleteHead');
        updateStats('O(1)');
        await highlightPseudo(0);
        await highlightPseudo(1);
        if (state.nodes.length === 1) incrementPtrs(2);
        else {
            await highlightPseudo(3); incrementPtrs();
            await highlightPseudo(4); incrementPtrs();
        }
    } else if (type === 'tail') {
        renderPseudo('deleteTail');
        updateStats('O(1)');
        await highlightPseudo(0);
        await highlightPseudo(1);
        if (state.nodes.length === 1) incrementPtrs(2);
        else {
            await highlightPseudo(3); incrementPtrs();
            await highlightPseudo(4); incrementPtrs();
        }
    } else {
        updateStats('O(N)');
        if (index > 0) {
            await traverseTo(index - 1, 'PREV');
        }
        incrementPtrs(2); // Bypass pointers
    }

    const target = state.nodes[index];
    highlightNode(target.id, true);
    setTempPointer(target.id, 'DEL');
    await sleep(getDelay());

    const wrapper = document.getElementById(`wrapper-${target.id}`);
    if (wrapper) wrapper.classList.add('deleting');
    
    await sleep(400);

    state.nodes.splice(index, 1);
    renderNodesDOM();
    renderArrows();
    updateStats();
    logSys("Node deleted.", "success");
}

async function deleteByValue(val) {
    if (state.nodes.length === 0) return logSys("List is empty.", "error");
    logSys(`Searching for value ${val} to delete...`);
    updateStats('O(N)');
    
    let foundIdx = -1;
    for (let i = 0; i < state.nodes.length; i++) {
        const curr = state.nodes[i];
        highlightNode(curr.id, true);
        setTempPointer(curr.id, 'CURR');
        await sleep(getDelay());
        
        if (curr.val === val) {
            foundIdx = i;
            break;
        }
        highlightNode(curr.id, false);
        setTempPointer(curr.id, null);
    }

    if (foundIdx !== -1) {
        logSys(`Value ${val} found. Deleting...`, "info");
        await deleteNode(foundIdx, 'index');
    } else {
        logSys(`Value ${val} not found.`, "error");
    }
}

async function searchList(val) {
    if (state.nodes.length === 0) return logSys("List is empty.", "error");
    logSys(`Searching for value: ${val}`);
    updateStats('O(N)');
    
    for (let i = 0; i < state.nodes.length; i++) {
        const curr = state.nodes[i];
        highlightNode(curr.id, true);
        setTempPointer(curr.id, 'SEARCH');
        await sleep(getDelay());
        
        if (curr.val === val) {
            document.getElementById(`node-${curr.id}`).classList.add('found');
            logSys(`Value ${val} found at index [${i}]!`, "success");
            await sleep(getDelay() * 2);
            document.getElementById(`node-${curr.id}`).classList.remove('found');
            highlightNode(curr.id, false);
            setTempPointer(curr.id, null);
            return;
        }
        highlightNode(curr.id, false);
        setTempPointer(curr.id, null);
    }
    logSys(`Value ${val} not found.`, "error");
}

async function traverseList(forward = true) {
    if (state.nodes.length === 0) return logSys("List is empty.", "error");
    renderPseudo(forward ? 'traverseFwd' : 'traverseBwd');
    updateStats('O(N)');
    
    await highlightPseudo(0);
    logSys(`Starting ${forward ? 'forward' : 'backward'} traversal...`);

    const len = state.nodes.length;
    for (let j = 0; j < len; j++) {
        const i = forward ? j : (len - 1 - j);
        const curr = state.nodes[i];
        
        await highlightPseudo(1); // while
        await highlightPseudo(2); // visit
        
        highlightNode(curr.id, true);
        setTempPointer(curr.id, 'CURR');
        
        await sleep(getDelay());
        
        await highlightPseudo(3); // curr = curr.next/prev
        if (j < len - 1) {
            const arrowId = forward ? `arrow-fwd-${i}` : `arrow-bwd-${i-1}`;
            const arrow = document.getElementById(arrowId);
            if (arrow) arrow.classList.add('active');
            await sleep(getDelay());
            if (arrow) arrow.classList.remove('active');
        }
        
        highlightNode(curr.id, false);
        setTempPointer(curr.id, null);
    }
    logSys("Traversal complete.", "success");
}

async function reverseList() {
    if (state.nodes.length < 2) return logSys("Need at least 2 nodes to reverse.", "error");
    renderPseudo('reverse');
    updateStats('O(N)');
    
    logSys("Reversing the list...");
    await highlightPseudo(0); // init
    
    for (let i = 0; i < state.nodes.length; i++) {
        const curr = state.nodes[i];
        highlightNode(curr.id, true);
        setTempPointer(curr.id, 'CURR');
        
        await highlightPseudo(1);
        await highlightPseudo(2); incrementPtrs();
        await highlightPseudo(3); incrementPtrs();
        await highlightPseudo(4); incrementPtrs();
        await highlightPseudo(5); incrementPtrs();
        
        await sleep(getDelay());
        highlightNode(curr.id, false);
        setTempPointer(curr.id, null);
    }
    
    await highlightPseudo(7);
    
    // Visually update the array and re-render
    state.nodes.reverse();
    renderNodesDOM();
    renderArrows();
    logSys("List reversed successfully.", "success");
}
