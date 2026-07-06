/**
 * graph-visualizer.js
 * Comprehensive Engine for BFS, DFS, Dijkstra, and Bellman-Ford.
 * Handles DOM/SVG hybrid rendering, interactive editing, and step-by-step algorithm generation.
 */

document.addEventListener("DOMContentLoaded", () => {
    initGraphVisualizer();
});

// ==========================================
// 1. STATE MANAGEMENT
// ==========================================
let nodes = []; // { id: 'A', x: 100, y: 100, el: DOMElement }
let edges = []; // { u: 'A', v: 'B', w: 5, el: SVGLine, textEl: SVGText }
let nodeIdCounter = 65; // ASCII 'A'

let state = {
    mode: 'move', // move, node, edge
    isSimulating: false,
    animationReq: null,
    generator: null,
    
    // Editor Temp State
    draggedNode: null,
    edgeStartNode: null,
    
    // Telemetry
    distances: {},
    previous: {}
};

// DOM Cache
const els = {
    wrapper: document.getElementById('canvasWrapper'),
    nodeLayer: document.getElementById('nodeLayer'),
    edgesGroup: document.getElementById('edgesGroup'),
    weightsGroup: document.getElementById('weightsGroup'),
    tempEdge: document.getElementById('tempEdge'),
    
    algoSelect: document.getElementById('algoSelect'),
    startNodeSelect: document.getElementById('startNodeSelect'),
    speedSlider: document.getElementById('speedSlider'),
    btnStart: document.getElementById('btnStart'),
    btnReset: document.getElementById('btnReset'),
    btnClearGraph: document.getElementById('btnClearGraph'),
    
    toolBtns: document.querySelectorAll('.tool-btn'),
    logContainer: document.getElementById('logContainer'),
    distTableBody: document.getElementById('distTableBody'),
    engineBadge: document.getElementById('engineBadge'),
    
    // Modal
    weightModal: document.getElementById('weightModal'),
    edgeWeightInput: document.getElementById('edgeWeightInput'),
    btnCancelEdge: document.getElementById('btnCancelEdge'),
    btnSaveEdge: document.getElementById('btnSaveEdge')
};

// ==========================================
// 2. INITIALIZATION & EVENTS
// ==========================================
function initGraphVisualizer() {
    bindEvents();
    loadDefaultGraph();
}

function bindEvents() {
    // Toolbar
    els.toolBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (state.isSimulating) return;
            els.toolBtns.forEach(b => b.classList.remove('active'));
            const target = e.target.closest('.tool-btn');
            target.classList.add('active');
            state.mode = target.dataset.mode;
            
            // Clean up drawing state if switching modes
            state.edgeStartNode = null;
            els.tempEdge.classList.add('hidden');
        });
    });

    els.btnClearGraph.addEventListener('click', () => {
        if (state.isSimulating) return;
        nodes = []; edges = []; nodeIdCounter = 65;
        renderAll();
        updateStartNodeSelect();
        logSys("Graph cleared.");
    });

    els.btnStart.addEventListener('click', toggleSimulation);
    els.btnReset.addEventListener('click', resetSimulationState);

    // Canvas Interactions
    els.wrapper.addEventListener('mousedown', handleCanvasMouseDown);
    els.wrapper.addEventListener('mousemove', handleCanvasMouseMove);
    window.addEventListener('mouseup', handleCanvasMouseUp);
    
    // Modal
    els.btnCancelEdge.addEventListener('click', () => {
        els.weightModal.classList.add('hidden');
        state.edgeStartNode = null;
        els.tempEdge.classList.add('hidden');
    });
    
    els.btnSaveEdge.addEventListener('click', () => {
        const w = parseInt(els.edgeWeightInput.value) || 0;
        finalizeEdge(w);
    });
}

function logSys(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = `> ${msg}`;
    els.logContainer.appendChild(div);
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

// ==========================================
// 3. GRAPH DATA STRUCTURE & RENDERING
// ==========================================
function loadDefaultGraph() {
    // Creates a sample graph with 5 nodes, varying weights, and a negative edge to test Bellman-Ford
    const cw = els.wrapper.clientWidth || 800;
    const ch = els.wrapper.clientHeight || 500;
    
    addNode(cw * 0.2, ch * 0.5, 'A');
    addNode(cw * 0.4, ch * 0.3, 'B');
    addNode(cw * 0.4, ch * 0.7, 'C');
    addNode(cw * 0.7, ch * 0.3, 'D');
    addNode(cw * 0.7, ch * 0.7, 'E');
    
    nodeIdCounter = 70; // 'F'

    addEdgeDirect('A', 'B', 4);
    addEdgeDirect('A', 'C', 2);
    addEdgeDirect('B', 'C', 5);
    addEdgeDirect('B', 'D', 10);
    addEdgeDirect('C', 'E', 3);
    addEdgeDirect('E', 'D', 4);
    addEdgeDirect('D', 'B', -2); // Negative weight for Bellman Ford

    updateStartNodeSelect();
    renderAll();
    logSys("Default graph loaded.");
}

function addNode(x, y, forcedId = null) {
    const id = forcedId || String.fromCharCode(nodeIdCounter++);
    const node = { id, x, y, el: null };
    
    // Create HTML element
    const el = document.createElement('div');
    el.className = 'graph-node';
    el.id = `node-${id}`;
    el.textContent = id;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    
    // Node Interactions
    el.addEventListener('mousedown', (e) => {
        if (state.mode === 'move') {
            state.draggedNode = node;
        } else if (state.mode === 'edge') {
            e.stopPropagation();
            if (!state.edgeStartNode) {
                state.edgeStartNode = node;
                els.tempEdge.setAttribute('x1', node.x);
                els.tempEdge.setAttribute('y1', node.y);
                els.tempEdge.setAttribute('x2', node.x);
                els.tempEdge.setAttribute('y2', node.y);
                els.tempEdge.classList.remove('hidden');
            } else if (state.edgeStartNode.id !== id) {
                // Prevent duplicate edges
                if (!edges.find(edge => edge.u === state.edgeStartNode.id && edge.v === id)) {
                    state.pendingEdgeTo = node;
                    els.edgeWeightInput.value = 1;
                    els.weightModal.classList.remove('hidden');
                    els.edgeWeightInput.focus();
                } else {
                    state.edgeStartNode = null;
                    els.tempEdge.classList.add('hidden');
                }
            }
        }
    });

    els.nodeLayer.appendChild(el);
    node.el = el;
    nodes.push(node);
    
    updateStartNodeSelect();
    return node;
}

function addEdgeDirect(uId, vId, weight) {
    const edge = { u: uId, v: vId, w: weight, lineEl: null, textEl: null };
    edges.push(edge);
}

function finalizeEdge(weight) {
    addEdgeDirect(state.edgeStartNode.id, state.pendingEdgeTo.id, weight);
    els.weightModal.classList.add('hidden');
    state.edgeStartNode = null;
    state.pendingEdgeTo = null;
    els.tempEdge.classList.add('hidden');
    renderAll();
}

function renderAll() {
    // Clear SVG
    els.edgesGroup.innerHTML = '';
    els.weightsGroup.innerHTML = '';

    // Render Edges
    edges.forEach(edge => {
        const uNode = nodes.find(n => n.id === edge.u);
        const vNode = nodes.find(n => n.id === edge.v);
        if (!uNode || !vNode) return;

        // Calculate offset to stop line at node border (radius = 22)
        const dx = vNode.x - uNode.x;
        const dy = vNode.y - uNode.y;
        const angle = Math.atan2(dy, dx);
        const targetX = vNode.x - Math.cos(angle) * 25;
        const targetY = vNode.y - Math.sin(angle) * 25;

        // Line
        const line = document.createElementNS("[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)", "line");
        line.setAttribute('x1', uNode.x);
        line.setAttribute('y1', uNode.y);
        line.setAttribute('x2', targetX);
        line.setAttribute('y2', targetY);
        line.setAttribute('class', 'edge-line');
        line.setAttribute('id', `edge-${edge.u}-${edge.v}`);
        line.setAttribute('marker-end', 'url(#arrowhead)');
        
        edge.lineEl = line;
        els.edgesGroup.appendChild(line);

        // Weight Text
        const text = document.createElementNS("[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)", "text");
        text.setAttribute('x', (uNode.x + vNode.x) / 2);
        text.setAttribute('y', ((uNode.y + vNode.y) / 2) - 8);
        text.setAttribute('class', 'edge-weight-text');
        text.textContent = edge.w;
        
        edge.textEl = text;
        els.weightsGroup.appendChild(text);
    });

    // Node DOM elements handle their own positions via CSS left/top
}

function updateStartNodeSelect() {
    const currentVal = els.startNodeSelect.value;
    els.startNodeSelect.innerHTML = '';
    nodes.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n.id;
        opt.textContent = `Node ${n.id}`;
        els.startNodeSelect.appendChild(opt);
    });
    if (nodes.find(n => n.id === currentVal)) {
        els.startNodeSelect.value = currentVal;
    }
}

// --- Canvas Interactions ---
function handleCanvasMouseDown(e) {
    if (state.isSimulating) return;
    if (state.mode === 'node' && e.target === els.wrapper) {
        const rect = els.wrapper.getBoundingClientRect();
        addNode(e.clientX - rect.left, e.clientY - rect.top);
    }
}

function handleCanvasMouseMove(e) {
    if (state.isSimulating) return;
    const rect = els.wrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (state.mode === 'move' && state.draggedNode) {
        state.draggedNode.x = x;
        state.draggedNode.y = y;
        state.draggedNode.el.style.left = `${x}px`;
        state.draggedNode.el.style.top = `${y}px`;
        renderAll(); // Re-render edges
    }

    if (state.mode === 'edge' && state.edgeStartNode) {
        els.tempEdge.setAttribute('x2', x);
        els.tempEdge.setAttribute('y2', y);
    }
}

function handleCanvasMouseUp() {
    state.draggedNode = null;
}

// ==========================================
// 4. TELEMETRY TABLE
// ==========================================
function initTelemetryTable() {
    state.distances = {};
    state.previous = {};
    
    nodes.forEach(n => {
        state.distances[n.id] = Infinity;
        state.previous[n.id] = null;
    });
    
    renderTelemetryTable();
}

function updateTelemetry(uId, dist, prev, highlight = false) {
    state.distances[uId] = dist;
    state.previous[uId] = prev;
    renderTelemetryTable(highlight ? uId : null);
}

function renderTelemetryTable(highlightId = null) {
    els.distTableBody.innerHTML = '';
    nodes.forEach(n => {
        const tr = document.createElement('tr');
        if (n.id === highlightId) tr.className = 'updated';
        
        let distDisplay = state.distances[n.id] === Infinity ? '∞' : state.distances[n.id];
        let prevDisplay = state.previous[n.id] === null ? '-' : state.previous[n.id];
        
        tr.innerHTML = `
            <td><strong>${n.id}</strong></td>
            <td>${distDisplay}</td>
            <td>${prevDisplay}</td>
        `;
        els.distTableBody.appendChild(tr);
    });
}

// ==========================================
// 5. ALGORITHM GENERATORS & EXECUTION
// ==========================================
function resetSimulationState() {
    clearTimeout(state.animationReq);
    state.isSimulating = false;
    
    // Reset Node CSS
    nodes.forEach(n => n.el.className = 'graph-node');
    // Reset Edge CSS
    edges.forEach(e => {
        if(e.lineEl) {
            e.lineEl.setAttribute('class', 'edge-line');
            e.lineEl.setAttribute('marker-end', 'url(#arrowhead)');
        }
    });

    els.btnStart.disabled = false;
    els.btnStart.innerHTML = '<i class="fas fa-play"></i> Run Algorithm';
    els.engineBadge.className = 'engine-badge';
    els.engineBadge.innerHTML = '<i class="fas fa-project-diagram"></i> Graph Engine: Idle';
    
    initTelemetryTable();
}

function toggleSimulation() {
    if (state.isSimulating) {
        // Stop
        resetSimulationState();
        return;
    }

    if (nodes.length === 0) return console.warn("Alert:", "Add some nodes first!");
    
    const startNodeId = els.startNodeSelect.value;
    const algo = els.algoSelect.value;

    // Safety checks
    if (algo === 'dijkstra') {
        const hasNegative = edges.some(e => e.w < 0);
        if (hasNegative) {
            logSys("WARNING: Dijkstra's algorithm fails with negative weights! Switch to Bellman-Ford.", "error");
            return;
        }
    }

    resetSimulationState();
    state.isSimulating = true;
    
    els.btnStart.innerHTML = '<i class="fas fa-stop"></i> Halt Simulation';
    els.engineBadge.className = 'engine-badge active';
    els.engineBadge.innerHTML = '<i class="fas fa-cog fa-spin"></i> Engine Running...';

    logSys(`Starting ${algo.toUpperCase()} from Node ${startNodeId}`, "info");

    // Initialize specific generator
    if (algo === 'bfs') state.generator = runBFS(startNodeId);
    if (algo === 'dfs') state.generator = runDFS(startNodeId);
    if (algo === 'dijkstra') state.generator = runDijkstra(startNodeId);
    if (algo === 'bellman') state.generator = runBellmanFord(startNodeId);

    executeStep();
}

function executeStep() {
    if (!state.isSimulating) return;

    const result = state.generator.next();
    
    if (result.done) {
        state.isSimulating = false;
        els.btnStart.innerHTML = '<i class="fas fa-check"></i> Finished';
        els.btnStart.disabled = true;
        els.engineBadge.className = 'engine-badge';
        els.engineBadge.innerHTML = '<i class="fas fa-check-circle" style="color:var(--gv-success);"></i> Execution Complete';
        return;
    }

    const action = result.value;
    processAction(action);

    const speed = parseInt(els.speedSlider.value);
    state.animationReq = setTimeout(executeStep, speed);
}

// --- Visual Processor ---
function processAction(action) {
    if (action.type === 'current') {
        // Mark previous current as visited
        nodes.forEach(n => {
            if (n.el.classList.contains('current')) {
                n.el.classList.remove('current');
                n.el.classList.add('visited');
            }
        });
        const n = nodes.find(n => n.id === action.id);
        if (n) {
            n.el.classList.add('current');
            logSys(`Visiting Node ${action.id}`);
        }
    } 
    else if (action.type === 'relax') {
        logSys(`Checking edge ${action.u} -> ${action.v} (Weight: ${action.w})`);
        
        // Highlight Edge Temporarily
        const edge = edges.find(e => e.u === action.u && e.v === action.v);
        if (edge && edge.lineEl) {
            edge.lineEl.setAttribute('class', 'edge-line active');
            edge.lineEl.setAttribute('marker-end', 'url(#arrowhead-active)');
            
            setTimeout(() => {
                if(!state.isSimulating) return;
                edge.lineEl.setAttribute('class', 'edge-line');
                edge.lineEl.setAttribute('marker-end', 'url(#arrowhead)');
            }, parseInt(els.speedSlider.value) - 50);
        }

        if (action.success) {
            logSys(`Relaxed! Dist[${action.v}] updated to ${action.newDist}`, "relax");
            updateTelemetry(action.v, action.newDist, action.u, true);
        }
    }
    else if (action.type === 'cycle') {
        logSys(`NEGATIVE CYCLE DETECTED over edge ${action.u} -> ${action.v}!`, "error");
        els.engineBadge.className = 'engine-badge error';
        els.engineBadge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Negative Cycle';
        
        const edge = edges.find(e => e.u === action.u && e.v === action.v);
        if (edge && edge.lineEl) {
            edge.lineEl.setAttribute('class', 'edge-line cycle');
        }
    }
    else if (action.type === 'path') {
        logSys("Reconstructing Shortest Path Tree...", "success");
        // Highlight all edges in the shortest path tree
        for (let vId in state.previous) {
            let uId = state.previous[vId];
            if (uId) {
                const edge = edges.find(e => e.u === uId && e.v === vId);
                if (edge && edge.lineEl) {
                    edge.lineEl.setAttribute('class', 'edge-line path');
                    edge.lineEl.setAttribute('marker-end', 'url(#arrowhead-path)');
                }
                const n = nodes.find(n => n.id === vId);
                if (n) n.el.classList.add('path');
            }
        }
        const startN = nodes.find(n => n.id === els.startNodeSelect.value);
        if(startN) startN.el.classList.add('path');
    }
}

// ==========================================
// 6. ALGORITHMS
// ==========================================

function* runBFS(startId) {
    const queue = [startId];
    const visited = new Set([startId]);
    
    updateTelemetry(startId, 0, null, true);

    while (queue.length > 0) {
        const u = queue.shift();
        yield { type: 'current', id: u };

        // Find neighbors
        const neighbors = edges.filter(e => e.u === u).map(e => e.v);
        for (let v of neighbors) {
            const edge = edges.find(e => e.u === u && e.v === v);
            yield { type: 'relax', u, v, w: edge.w, success: false }; // Just for visual

            if (!visited.has(v)) {
                visited.add(v);
                updateTelemetry(v, state.distances[u] + 1, u);
                queue.push(v);
            }
        }
    }
    yield { type: 'path' };
}

function* runDFS(startId) {
    const visited = new Set();
    
    updateTelemetry(startId, 0, null, true);

    function* dfsHelper(u) {
        visited.add(u);
        yield { type: 'current', id: u };

        const neighbors = edges.filter(e => e.u === u).map(e => e.v);
        for (let v of neighbors) {
            const edge = edges.find(e => e.u === u && e.v === v);
            yield { type: 'relax', u, v, w: edge.w, success: false };

            if (!visited.has(v)) {
                updateTelemetry(v, state.distances[u] + 1, u);
                yield* dfsHelper(v);
                // Return focus to parent for visual continuity
                yield { type: 'current', id: u };
            }
        }
    }

    yield* dfsHelper(startId);
    yield { type: 'path' };
}

function* runDijkstra(startId) {
    // Simple priority queue using array sort
    let pq = [{ id: startId, dist: 0 }];
    updateTelemetry(startId, 0, null, true);

    while (pq.length > 0) {
        pq.sort((a, b) => a.dist - b.dist);
        const { id: u, dist: d } = pq.shift();

        // If we found a shorter path previously, skip
        if (d > state.distances[u]) continue;

        yield { type: 'current', id: u };

        const outgoing = edges.filter(e => e.u === u);
        for (let edge of outgoing) {
            const v = edge.v;
            const w = edge.w;

            const newDist = state.distances[u] + w;
            let success = false;

            if (newDist < state.distances[v]) {
                success = true;
                pq.push({ id: v, dist: newDist });
            }
            
            yield { type: 'relax', u, v, w, newDist, success };
        }
    }
    yield { type: 'path' };
}

function* runBellmanFord(startId) {
    updateTelemetry(startId, 0, null, true);
    const V = nodes.length;

    // V - 1 Iterations
    for (let i = 1; i <= V - 1; i++) {
        logSys(`--- Bellman-Ford Iteration ${i} ---`, 'info');
        
        for (let edge of edges) {
            const { u, v, w } = edge;
            let success = false;
            let newDist = state.distances[u] + w;

            if (state.distances[u] !== Infinity && newDist < state.distances[v]) {
                success = true;
            }
            yield { type: 'relax', u, v, w, newDist, success };
        }
    }

    // Nth iteration to detect negative cycles
    logSys("--- Checking for Negative Cycles ---", 'info');
    for (let edge of edges) {
        const { u, v, w } = edge;
        if (state.distances[u] !== Infinity && state.distances[u] + w < state.distances[v]) {
            yield { type: 'cycle', u, v };
            return; // Halt if negative cycle detected
        }
    }

    yield { type: 'path' };
}
