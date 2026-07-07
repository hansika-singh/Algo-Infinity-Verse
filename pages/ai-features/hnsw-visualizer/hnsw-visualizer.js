/**
 * hnsw-visualizer.js
 * Client-side implementation of the Hierarchical Navigable Small World (HNSW) graph.
 * Renders an interactive multi-layer isometric 3D projection using HTML5 Canvas.
 */

document.addEventListener("DOMContentLoaded", () => {
    initHNSWVisualizer();
});

// ==========================================
// 1. DATA STRUCTURES & HNSW ENGINE
// ==========================================

const MAX_LAYERS = 3;
const M_L = 1 / Math.log(2); // Probability multiplier for layers

// Calculate Euclidean distance between two 2D points
function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

class VectorNode {
    constructor(id, x, y, maxLayer) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.maxLayer = maxLayer;
        this.neighbors = {}; // { layerIndex: [Node, Node] }
        for (let i = 0; i <= maxLayer; i++) {
            this.neighbors[i] = [];
        }
    }
}

class HNSW {
    constructor(M, efConstruction) {
        this.M = M;
        this.M_max = M;
        this.M_max0 = M * 2; // Bottom layer allows more connections
        this.efConstruction = efConstruction;
        
        this.nodes = [];
        this.entryPoint = null;
        this.maxLayer = -1;
    }

    // Insert a new vector into the HNSW graph
    insert(x, y) {
        // Randomly determine the max layer for this node
        let l = Math.floor(-Math.log(Math.random()) * M_L);
        l = Math.min(l, MAX_LAYERS - 1);
        
        const newNode = new VectorNode(this.nodes.length, x, y, l);
        this.nodes.push(newNode);

        if (!this.entryPoint) {
            this.entryPoint = newNode;
            this.maxLayer = l;
            return;
        }

        let currObj = this.entryPoint;
        let currDist = dist(newNode, currObj);

        // Phase 1: Search top layers (Highways) down to l+1 to find a good local entry point
        for (let lc = this.maxLayer; lc > l; lc--) {
            let changed = true;
            while (changed) {
                changed = false;
                for (let neighbor of currObj.neighbors[lc]) {
                    let d = dist(newNode, neighbor);
                    if (d < currDist) {
                        currDist = d;
                        currObj = neighbor;
                        changed = true;
                    }
                }
            }
        }

        // Phase 2: Insert into layer l and below
        let ep = [currObj]; 
        for (let lc = Math.min(this.maxLayer, l); lc >= 0; lc--) {
            // Search layer for nearest neighbors
            let W = this.searchLayer(newNode, ep, this.efConstruction, lc);
            // Select M best neighbors
            let neighbors = this.selectNeighbors(newNode, W, this.M);
            
            // Add bidirectional connections
            for (let n of neighbors) {
                newNode.neighbors[lc].push(n);
                n.neighbors[lc].push(newNode);
                
                // Shrink connections if exceeded
                let MMax = lc === 0 ? this.M_max0 : this.M_max;
                if (n.neighbors[lc].length > MMax) {
                    const kept = this.selectNeighbors(n, n.neighbors[lc], MMax);
                    const dropped = n.neighbors[lc].filter(node => !kept.includes(node));
                    n.neighbors[lc] = kept;

                    dropped.forEach(node => {
                        node.neighbors[lc] = node.neighbors[lc].filter(neighbor => neighbor !== n);
                    });
                }
            }
            ep = W; // Use current results as entry points for the next lower layer
        }

        if (l > this.maxLayer) {
            this.maxLayer = l;
            this.entryPoint = newNode;
        }
    }

    // Search a specific layer for nearest neighbors
    searchLayer(queryNode, entryPoints, ef, lc) {
        let visited = new Set(entryPoints.map(e => e.id));
        let candidates = [...entryPoints]; // Min-heap conceptually
        let results = [...entryPoints];    // Max-heap conceptually

        // Sort ascending by distance
        candidates.sort((a, b) => dist(queryNode, a) - dist(queryNode, b));
        results.sort((a, b) => dist(queryNode, a) - dist(queryNode, b));

        while (candidates.length > 0) {
            let c = candidates.shift();
            let cDist = dist(queryNode, c);
            let fDist = dist(queryNode, results[results.length - 1]);

            if (cDist > fDist && results.length >= ef) break;

            for (let neighbor of c.neighbors[lc]) {
                if (!visited.has(neighbor.id)) {
                    visited.add(neighbor.id);
                    let nDist = dist(queryNode, neighbor);
                    let fDistCurrent = dist(queryNode, results[results.length - 1]);
                    
                    if (nDist < fDistCurrent || results.length < ef) {
                        candidates.push(neighbor);
                        results.push(neighbor);
                        
                        candidates.sort((a, b) => dist(queryNode, a) - dist(queryNode, b));
                        results.sort((a, b) => dist(queryNode, a) - dist(queryNode, b));
                        
                        if (results.length > ef) {
                            results.pop(); // Remove furthest
                        }
                    }
                }
            }
        }
        return results;
    }

    // Heuristic neighbor selection (Simplified to just closest distance for visualizer)
    selectNeighbors(queryNode, candidates, M) {
        let sorted = [...candidates].sort((a, b) => dist(queryNode, a) - dist(queryNode, b));
        return sorted.slice(0, M);
    }
}

// ==========================================
// 2. STATE & UI CONTROLS
// ==========================================

let hnsw = null;
let isIsometric = true;
let searchPath = []; // Stores nodes visited during a query
let targetPoint = null;

const els = {
    canvas: document.getElementById('hnswCanvas'),
    wrapper: document.getElementById('canvasWrapper'),
    emptyState: document.getElementById('emptyState'),
    
    btnGenerate: document.getElementById('btnGenerate'),
    btnReset: document.getElementById('btnReset'),
    btnRandomSearch: document.getElementById('btnRandomSearch'),
    
    paramM: document.getElementById('paramM'),
    paramEf: document.getElementById('paramEf'),
    
    btnIsoView: document.getElementById('btnIsoView'),
    btnFlatView: document.getElementById('btnFlatView'),
    
    statExplored: document.getElementById('statExplored'),
    statTotal: document.getElementById('statTotal'),
    statDist: document.getElementById('statDist'),
    logContainer: document.getElementById('logContainer'),
    engineBadge: document.getElementById('engineBadge')
};

let ctx;
let animationReq;

function initHNSWVisualizer() {
    ctx = els.canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    bindEvents();
    startRenderLoop();
}

function resizeCanvas() {
    const rect = els.wrapper.getBoundingClientRect();
    els.canvas.width = rect.width * window.devicePixelRatio;
    els.canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    els.canvas.style.width = `${rect.width}px`;
    els.canvas.style.height = `${rect.height}px`;
}

function logMsg(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = `> ${msg}`;
    els.logContainer.appendChild(div);
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

function bindEvents() {
    els.btnGenerate.addEventListener('click', () => {
        generateGraph();
    });

    els.btnReset.addEventListener('click', () => {
        hnsw = null;
        searchPath = [];
        targetPoint = null;
        els.emptyState.style.display = 'block';
        els.btnRandomSearch.disabled = true;
        els.engineBadge.classList.remove('active');
        els.engineBadge.innerHTML = '<i class="fas fa-database"></i> Vector DB Engine: Idle';
        els.statExplored.textContent = '0';
        els.statTotal.textContent = '0';
        els.statDist.textContent = '0.00';
        logMsg("Graph destroyed. Memory cleared.", "sys");
    });

    els.btnRandomSearch.addEventListener('click', () => {
        if (!hnsw) return;
        const w = els.canvas.clientWidth;
        const h = els.canvas.clientHeight;
        const rx = Math.random() * w;
        const ry = Math.random() * h;
        executeSearchQuery(rx, ry);
    });

    // View toggles
    els.btnIsoView.addEventListener('click', () => {
        isIsometric = true;
        els.btnIsoView.classList.add('active');
        els.btnFlatView.classList.remove('active');
    });

    els.btnFlatView.addEventListener('click', () => {
        isIsometric = false;
        els.btnFlatView.classList.add('active');
        els.btnIsoView.classList.remove('active');
    });

    // Canvas click to search
    els.canvas.addEventListener('click', (e) => {
        if (!hnsw) return;
        const rect = els.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // If in isometric view, we need to inversely transform the click to logical 2D space.
        // For simplicity in this demo, we'll just search using the raw screen coordinates 
        // if flat, and an approximation if isometric.
        let targetX = mouseX;
        let targetY = mouseY;

        if (isIsometric) {
            // Very rough inverse iso transform for demo interactivity
            const isoScale = 0.8;
            const offsetX = els.canvas.clientWidth / 2;
            const offsetY = els.canvas.clientHeight / 4;
            
            const dx = (mouseX - offsetX) / isoScale;
            const dy = (mouseY - offsetY) / isoScale;
            
            targetX = (dx / Math.cos(Math.PI/6) + dy / Math.sin(Math.PI/6)) / 2;
            targetY = (dy / Math.sin(Math.PI/6) - dx / Math.cos(Math.PI/6)) / 2;
        }

        executeSearchQuery(targetX, targetY);
    });
}

function generateGraph() {
    const M = parseInt(els.paramM.value) || 5;
    const ef = parseInt(els.paramEf.value) || 20;
    
    hnsw = new HNSW(M, ef);
    searchPath = [];
    targetPoint = null;

    const numNodes = 120; // Visual sweet spot
    const w = els.canvas.clientWidth;
    const h = els.canvas.clientHeight;

    // Distribute nodes roughly in the canvas bounds
    for (let i = 0; i < numNodes; i++) {
        // Keep within a bounded area so isometric projection doesn't fly off screen
        const x = (Math.random() * w * 0.8) + (w * 0.1);
        const y = (Math.random() * h * 0.8) + (h * 0.1);
        hnsw.insert(x, y);
    }

    els.emptyState.style.display = 'none';
    els.btnRandomSearch.disabled = false;
    els.statTotal.textContent = hnsw.nodes.length;
    els.engineBadge.classList.add('active');
    els.engineBadge.innerHTML = '<i class="fas fa-check-circle"></i> Graph Indexed';
    logMsg(`Generated HNSW graph with ${numNodes} vectors.`, "sys");
}

// ==========================================
// 3. QUERY EXECUTION & ANIMATION
// ==========================================

async function executeSearchQuery(tx, ty) {
    if (!hnsw || !hnsw.entryPoint) return;

    targetPoint = { x: tx, y: ty };
    searchPath = [];
    let exploredNodes = 0;

    logMsg(`Initiating Greedy Search for vector [${Math.floor(tx)}, ${Math.floor(ty)}]`, "search");

    let currObj = hnsw.entryPoint;
    let currDist = dist(targetPoint, currObj);

    // Phase 1: Search top layers down
    for (let lc = hnsw.maxLayer; lc >= 0; lc--) {
        searchPath.push({ node: currObj, layer: lc, isDrop: false });
        logMsg(`Searching Layer ${lc}...`, "sys");

        let changed = true;
        while (changed) {
            changed = false;
            exploredNodes++;
            els.statExplored.textContent = exploredNodes;

            for (let neighbor of currObj.neighbors[lc]) {
                let d = dist(targetPoint, neighbor);
                if (d < currDist) {
                    currDist = d;
                    currObj = neighbor;
                    changed = true;
                    // Record path hop
                    searchPath.push({ node: currObj, layer: lc, isDrop: false });
                    await sleep(150); // Animation delay
                }
            }
        }
        
        // Record layer drop (same node, moving down a layer)
        if (lc > 0) {
            searchPath.push({ node: currObj, layer: lc - 1, isDrop: true });
            logMsg(`Local minimum found. Dropping to Layer ${lc-1}.`, "drop");
            await sleep(150);
        }
    }

    els.statDist.textContent = currDist.toFixed(2);
    logMsg(`Search complete. Nearest Neighbor: Node ID ${currObj.id}.`, "search");
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ==========================================
// 4. ISOMETRIC CANVAS RENDERER
// ==========================================

function startRenderLoop() {
    function loop() {
        renderCanvas();
        animationReq = requestAnimationFrame(loop);
    }
    loop();
}

function renderCanvas() {
    const w = els.canvas.clientWidth;
    const h = els.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    if (!hnsw) return;

    // View Configurations
    const LAYER_HEIGHT = isIsometric ? 100 : 0; // Spacing between layers
    const ISO_SCALE = 0.8;
    const ISO_OFFSET_X = w / 2;
    const ISO_OFFSET_Y = h / 4;

    // Transform function maps logical (x,y, layer) to screen (px, py)
    function transform(x, y, layer) {
        if (!isIsometric) return { px: x, py: y };

        // Standard Isometric projection formula
        const angle = Math.PI / 6; // 30 degrees
        let px = (x - y) * Math.cos(angle);
        let py = (x + y) * Math.sin(angle);
        
        // Apply scaling and Layer Z-offset
        px = (px * ISO_SCALE) + ISO_OFFSET_X;
        py = (py * ISO_SCALE) - (layer * LAYER_HEIGHT) + ISO_OFFSET_Y;

        return { px, py };
    }

    const layerColors = ['#3b82f6', '#10b981', '#d946ef']; // L0: Blue, L1: Green, L2: Fuchsia
    const opacities = [0.15, 0.4, 0.8]; // Bottom layer faint, top layer prominent

    // Render layers from bottom (0) to top (maxLayer)
    for (let lc = 0; lc <= hnsw.maxLayer; lc++) {
        const color = layerColors[lc % layerColors.length];
        const opacity = isIsometric ? opacities[Math.min(lc, 2)] : 0.5;

        // Draw connections for this layer
        ctx.lineWidth = 1;
        ctx.strokeStyle = color;
        ctx.globalAlpha = opacity;

        hnsw.nodes.forEach(node => {
            if (node.maxLayer < lc) return;
            const p1 = transform(node.x, node.y, lc);

            node.neighbors[lc].forEach(neighbor => {
                // Avoid drawing lines twice
                if (neighbor.id > node.id) {
                    const p2 = transform(neighbor.x, neighbor.y, lc);
                    ctx.beginPath();
                    ctx.moveTo(p1.px, p1.py);
                    ctx.lineTo(p2.px, p2.py);
                    ctx.stroke();
                }
            });
        });

        // Draw nodes for this layer
        ctx.globalAlpha = isIsometric ? Math.min(opacity + 0.3, 1) : 0.8;
        hnsw.nodes.forEach(node => {
            if (node.maxLayer < lc) return;
            const p = transform(node.x, node.y, lc);
            
            ctx.beginPath();
            ctx.arc(p.px, p.py, isIsometric ? 4 : 3, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        });
    }
    ctx.globalAlpha = 1.0;

    // Draw Target Point if searching
    if (targetPoint) {
        // Target point exists on layer 0 conceptually
        const tp = transform(targetPoint.x, targetPoint.y, 0);
        ctx.beginPath();
        // Draw a star/cross target
        const s = 8;
        ctx.moveTo(tp.px - s, tp.py - s); ctx.lineTo(tp.px + s, tp.py + s);
        ctx.moveTo(tp.px + s, tp.py - s); ctx.lineTo(tp.px - s, tp.py + s);
        ctx.strokeStyle = '#ef4444'; // Red
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(tp.px, tp.py, 12, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.stroke();
    }

    // Draw Search Path (Greedy Descent)
    if (searchPath.length > 0) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#facc15'; // Yellow tracking line
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#facc15';

        ctx.beginPath();
        const startP = transform(searchPath[0].node.x, searchPath[0].node.y, searchPath[0].layer);
        ctx.moveTo(startP.px, startP.py);

        for (let i = 1; i < searchPath.length; i++) {
            const step = searchPath[i];
            const p = transform(step.node.x, step.node.y, step.layer);
            ctx.lineTo(p.px, p.py);
        }
        ctx.stroke();

        // Highlight Current Head of Search
        const last = searchPath[searchPath.length - 1];
        const hp = transform(last.node.x, last.node.y, last.layer);
        ctx.beginPath();
        ctx.arc(hp.px, hp.py, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#facc15';
        ctx.fill();

        ctx.shadowBlur = 0; // Reset
    }
}
