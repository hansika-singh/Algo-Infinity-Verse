/**
 * linked-list-visualizer.js
 * Visualizes Singly, Doubly, and Circular Linked Lists.
 * Uses a hybrid approach: DOM elements for Nodes and SVG paths for dynamic pointer arrows.
 */

document.addEventListener("DOMContentLoaded", () => {
    initLinkedListVisualizer();
});

// --- State Management ---
const state = {
    type: 'singly', // singly, doubly, circular
    nodes: [], // Array of internal node objects: { id, val }
    nodeCounter: 0,
    isAnimating: false,
    head: null,
    tail: null
};

// UI Config
const NODE_WIDTH = 80;
const NODE_SPACING = 60; // Gap between nodes
const TOTAL_NODE_SPACING = NODE_WIDTH + NODE_SPACING;

// DOM Elements
const els = {
    wrapper: document.getElementById('canvasWrapper'),
    nodesLayer: document.getElementById('nodesLayer'),
    svgLayer: document.getElementById('svgLayer'),
    arrowsGroup: document.getElementById('arrowsGroup'),
    emptyState: document.getElementById('emptyState'),
    
    listTypeSelect: document.getElementById('listTypeSelect'),
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
    btnDeleteVal: document.getElementById('btnDeleteVal'),
    btnSearch: document.getElementById('btnSearch'),
    btnTraverse: document.getElementById('btnTraverse'),
    
    logContainer: document.getElementById('logContainer'),
    engineBadge: document.getElementById('engineBadge')
};

function initLinkedListVisualizer() {
    bindEvents();
    window.addEventListener('resize', renderArrows); // Redraw arrows on resize
}

function bindEvents() {
    // Type change
    els.listTypeSelect.addEventListener('change', (e) => {
        if (state.isAnimating) return;
        state.type = e.target.value;
        resetList(`Switched to ${e.target.options[e.target.selectedIndex].text}`);
    });

    els.btnReset.addEventListener('click', () => resetList("List cleared manually."));

    // Insertions
    els.btnInsertHead.addEventListener('click', () => executeOp(() => insertNode(0)));
    els.btnInsertTail.addEventListener('click', () => executeOp(() => insertNode(state.nodes.length)));
    els.btnInsertAt.addEventListener('click', () => executeOp(() => {
        const pos = parseInt(els.insertPos.value);
        if (isNaN(pos)) return logSys("Invalid index.", "error");
        insertNode(pos);
    }));

    // Deletions
    els.btnDeleteHead.addEventListener('click', () => executeOp(() => deleteNode(0)));
    els.btnDeleteTail.addEventListener('click', () => executeOp(() => deleteNode(state.nodes.length - 1)));
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
    
    els.btnTraverse.addEventListener('click', () => executeOp(() => traverseList()));
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
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

function lockUI(locked) {
    state.isAnimating = locked;
    const btns = document.querySelectorAll('.operation-panel .btn, #listTypeSelect, #btnReset');
    btns.forEach(b => b.disabled = locked);
    if (locked) {
        els.engineBadge.classList.add('active');
        els.engineBadge.innerHTML = '<i class="fas fa-cog fa-spin"></i> Engine Running...';
    } else {
        els.engineBadge.classList.remove('active');
        els.engineBadge.innerHTML = '<i class="fas fa-link"></i> Memory Engine: Idle';
    }
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

function resetList(msg) {
    state.nodes = [];
    state.head = null;
    state.tail = null;
    state.nodeCounter = 0;
    renderNodesDOM();
    renderArrows();
    logSys(msg, "sys");
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
        wrapper.className = 'll-node-wrapper';
        wrapper.id = `wrapper-${node.id}`;
        
        // Pointers Display (Top)
        let ptrsHtml = `<div class="ll-pointers-top" id="ptrs-${node.id}">`;
        if (idx === 0) ptrsHtml += `<span class="ptr-badge head">HEAD</span>`;
        if (idx === state.nodes.length - 1) ptrsHtml += `<span class="ptr-badge tail">TAIL</span>`;
        ptrsHtml += `</div>`;

        // Inner Node Box
        let innerHtml = '';
        if (state.type === 'doubly') {
            innerHtml += `<div class="ll-prev"><i class="fas fa-circle"></i></div>`;
        }
        innerHtml += `<div class="ll-value">${node.val}</div>`;
        innerHtml += `<div class="ll-next"><i class="fas fa-circle"></i></div>`;

        // Index Display (Bottom)
        const indexHtml = `<div class="ll-index">[${idx}]</div>`;

        wrapper.innerHTML = ptrsHtml + `<div class="ll-node" id="node-${node.id}">${innerHtml}</div>` + indexHtml;
        els.nodesLayer.appendChild(wrapper);
    });
    
    // Auto-scroll to show newly added nodes
    els.wrapper.scrollLeft = els.wrapper.scrollWidth;
}

function renderArrows() {
    els.arrowsGroup.innerHTML = '';
    if (state.nodes.length === 0) return;

    // We must wait a tick for DOM layout to settle if nodes just rendered
    setTimeout(() => {
        const layerRect = els.svgLayer.getBoundingClientRect();

        for (let i = 0; i < state.nodes.length; i++) {
            const curr = state.nodes[i];
            const next = state.nodes[i + 1];
            
            const currEl = document.getElementById(`node-${curr.id}`);
            if (!currEl) continue;
            
            const currRect = currEl.getBoundingClientRect();
            
            // 1. Forward Arrows
            if (next) {
                const nextEl = document.getElementById(`node-${next.id}`);
                const nextRect = nextEl.getBoundingClientRect();

                // From right edge of current to left edge of next
                const startX = currRect.right - layerRect.left;
                const startY = currRect.top + (currRect.height / 2) - layerRect.top;
                const endX = nextRect.left - layerRect.left;
                const endY = startY;

                drawArrow(startX, startY, endX, endY, `arrow-fwd-${i}`);
            }

            // 2. Backward Arrows (Doubly)
            if (state.type === 'doubly' && next) {
                const nextEl = document.getElementById(`node-${next.id}`);
                const nextRect = nextEl.getBoundingClientRect();

                // Draw below the forward arrow
                const startX = nextRect.left - layerRect.left;
                const startY = nextRect.top + (nextRect.height / 2) + 12 - layerRect.top;
                const endX = currRect.right - layerRect.left;
                const endY = startY;

                drawArrow(startX, startY, endX, endY, `arrow-back-${i}`, true);
            }
        }

        // 3. Circular Arrow
        if (state.type === 'circular' && state.nodes.length > 0) {
            const headEl = document.getElementById(`node-${state.nodes[0].id}`);
            const tailEl = document.getElementById(`node-${state.nodes[state.nodes.length - 1].id}`);
            
            if (headEl && tailEl) {
                const hRect = headEl.getBoundingClientRect();
                const tRect = tailEl.getBoundingClientRect();

                const startX = tRect.right - layerRect.left;
                const startY = tRect.top + (tRect.height / 2) - layerRect.top;
                const endX = hRect.left - layerRect.left;
                const endY = hRect.top + (hRect.height / 2) - layerRect.top;

                // Draw curved line underneath
                const path = document.createElementNS("[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)", "path");
                path.setAttribute('class', 'ptr-arrow');
                path.setAttribute('marker-end', 'url(#arrowhead)');
                
                // Curve logic: Down, Left, Up
                const curveDrop = 40;
                const d = `M ${startX} ${startY} 
                           Q ${startX + 30} ${startY}, ${startX + 30} ${startY + curveDrop} 
                           L ${endX - 30} ${endY + curveDrop} 
                           Q ${endX - 30} ${endY}, ${endX} ${endY}`;
                           
                path.setAttribute('d', d);
                els.arrowsGroup.appendChild(path);
            }
        }
    }, 50);
}

function drawArrow(x1, y1, x2, y2, id, isPrev = false) {
    const path = document.createElementNS("[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)", "path");
    path.setAttribute('id', id);
    path.setAttribute('class', `ptr-arrow ${isPrev ? 'prev' : ''}`);
    
    // Slight gap so arrowhead doesn't overlap border
    const gap = 4;
    const actualX2 = isPrev ? x2 + gap : x2 - gap;
    
    path.setAttribute('d', `M ${x1} ${y1} L ${actualX2} ${y2}`);
    
    if (!isPrev) {
        path.setAttribute('marker-end', 'url(#arrowhead)');
    }
    
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
    const ptrs = document.getElementById(`ptrs-${id}`);
    if (ptrs) {
        // Remove existing temp
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

async function traverseTo(index, label = 'TEMP') {
    for (let i = 0; i <= index; i++) {
        if (i >= state.nodes.length) break;
        const curr = state.nodes[i];
        
        // Highlight current
        highlightNode(curr.id, true);
        setTempPointer(curr.id, label);
        logSys(`Pointer at index [${i}], value: ${curr.val}`);
        
        // Highlight outgoing arrow if not last step
        if (i < index && i < state.nodes.length - 1) {
            await sleep(getDelay());
            const arrow = document.getElementById(`arrow-fwd-${i}`);
            if (arrow) arrow.classList.add('active');
            await sleep(getDelay() / 2);
            if (arrow) arrow.classList.remove('active');
        } else {
            await sleep(getDelay());
        }

        // Cleanup highlight
        highlightNode(curr.id, false);
        setTempPointer(curr.id, null);
    }
}

async function insertNode(index) {
    const valInput = els.insertVal.value;
    if (valInput === '') return logSys("Provide a value to insert.", "error");
    const val = parseInt(valInput);

    if (index < 0 || index > state.nodes.length) {
        return logSys(`Index ${index} is out of bounds.`, "error");
    }

    logSys(`Inserting ${val} at index ${index}...`);
    
    // Simulate traversal to insertion point if not head
    if (index > 0 && state.nodes.length > 0) {
        await traverseTo(index - 1, 'PREV');
    }

    const newNode = { id: ++state.nodeCounter, val: val };
    state.nodes.splice(index, 0, newNode);
    
    renderNodesDOM();
    renderArrows();
    logSys(`Inserted ${val} successfully.`, "success");
    els.insertVal.value = '';
}

async function deleteNode(index) {
    if (state.nodes.length === 0) return logSys("List is empty.", "error");
    if (index < 0 || index >= state.nodes.length) return logSys("Invalid deletion index.", "error");

    logSys(`Deleting node at index ${index}...`);

    if (index > 0) {
        await traverseTo(index - 1, 'PREV');
    }
    
    // Highlight target
    const target = state.nodes[index];
    highlightNode(target.id, true);
    setTempPointer(target.id, 'DEL');
    await sleep(getDelay());

    // Visually drop it
    const wrapper = document.getElementById(`wrapper-${target.id}`);
    if (wrapper) wrapper.classList.add('deleting');
    
    await sleep(400); // match animation

    state.nodes.splice(index, 1);
    renderNodesDOM();
    renderArrows();
    logSys("Node deleted.", "success");
}

async function deleteByValue(val) {
    if (state.nodes.length === 0) return logSys("List is empty.", "error");
    
    logSys(`Searching for value ${val} to delete...`);
    
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
        logSys(`Value ${val} found at index ${foundIdx}. Deleting...`, "info");
        await deleteNode(foundIdx);
    } else {
        logSys(`Value ${val} not found in the list.`, "error");
    }
}

async function searchList(val) {
    if (state.nodes.length === 0) return logSys("List is empty.", "error");
    
    logSys(`Traversing to search for value: ${val}`);
    
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
    
    logSys(`Search complete. Value ${val} not found.`, "error");
}

async function traverseList() {
    if (state.nodes.length === 0) return logSys("List is empty.", "error");
    logSys("Starting full traversal...");
    await traverseTo(state.nodes.length - 1, 'CURR');
    logSys("Traversal complete.", "success");
}
