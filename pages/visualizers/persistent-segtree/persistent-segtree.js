/**
 * persistent-segtree.js
 * Implements a Time-Traveling Persistent Segment Tree.
 * Every update generates O(log N) new nodes, keeping old root versions intact.
 * Uses a manual D3 coordinate system to gracefully map the overlapping DAG structure.
 */

document.addEventListener("DOMContentLoaded", () => {
    initPersistentTree();
});

// ==========================================
// 1. DATA STRUCTURES & CORE ENGINE
// ==========================================

let nodeIdCounter = 0;

class PSTNode {
    constructor(l, r, val = 0, leftChild = null, rightChild = null, version = 0) {
        this.id = `N${nodeIdCounter++}`;
        this.l = l;
        this.r = r;
        this.val = val;
        this.left = leftChild;
        this.right = rightChild;
        this.version = version;
        this.depth = 0; // Calculated visually
    }
}

let versions = []; // Array of root nodes: versions[0] = initial, versions[1] = first update, etc.
let allNodes = []; // Flat list for D3 rendering
let allLinks = []; // Flat list of edges for D3 rendering

const ARRAY_SIZE = 8; // Working with an 8-element array [0...7]
let initialArray = [1, 2, 3, 4, 5, 6, 7, 8];

// Recursively builds the initial tree (v0)
function buildTree(l, r) {
    const node = new PSTNode(l, r, 0, null, null, 0);
    allNodes.push(node);

    if (l === r) {
        node.val = initialArray[l];
        return node;
    }

    const mid = Math.floor((l + r) / 2);
    node.left = buildTree(l, mid);
    node.right = buildTree(mid + 1, r);
    node.val = node.left.val + node.right.val;

    // Record links for D3
    allLinks.push({ source: node.id, target: node.left.id, isShared: false, sourceVersion: 0 });
    allLinks.push({ source: node.id, target: node.right.id, isShared: false, sourceVersion: 0 });

    return node;
}

// Persistent Update: Returns a NEW node instead of mutating
function updatePersistent(prevNode, l, r, targetIdx, newVal, currentVersion) {
    // Create a new node copying the bounds, but assigning the new version tag
    const newNode = new PSTNode(l, r, 0, prevNode.left, prevNode.right, currentVersion);
    allNodes.push(newNode);

    if (l === r) {
        newNode.val = newVal;
        return newNode;
    }

    const mid = Math.floor((l + r) / 2);

    if (targetIdx <= mid) {
        // Go left: Update left child, SHARE right child
        newNode.left = updatePersistent(prevNode.left, l, mid, targetIdx, newVal, currentVersion);
        
        allLinks.push({ source: newNode.id, target: newNode.left.id, isShared: false, sourceVersion: currentVersion });
        allLinks.push({ source: newNode.id, target: prevNode.right.id, isShared: true, sourceVersion: currentVersion }); // SHARED EDGE
    } else {
        // Go right: Update right child, SHARE left child
        newNode.right = updatePersistent(prevNode.right, mid + 1, r, targetIdx, newVal, currentVersion);
        
        allLinks.push({ source: newNode.id, target: prevNode.left.id, isShared: true, sourceVersion: currentVersion }); // SHARED EDGE
        allLinks.push({ source: newNode.id, target: newNode.right.id, isShared: false, sourceVersion: currentVersion });
    }

    newNode.val = newNode.left.val + newNode.right.val;
    return newNode;
}

// Recursively calculates node depths for visual layout
function calcDepths(node, depth) {
    if (!node) return;
    // Since it's a DAG, nodes can be reached multiple times. 
    // We only set depth once (the segment tree depth is deterministic anyway)
    if (node.depth === 0 && depth > 0) node.depth = depth; 
    
    if (node.left) calcDepths(node.left, depth + 1);
    if (node.right) calcDepths(node.right, depth + 1);
}

// ==========================================
// 2. STATE & UI CONTROLS
// ==========================================

const els = {
    updateIndex: document.getElementById('updateIndex'),
    updateValue: document.getElementById('updateValue'),
    btnUpdate: document.getElementById('btnUpdate'),
    nextVersionText: document.getElementById('nextVersionText'),
    
    queryVersion: document.getElementById('queryVersion'),
    queryL: document.getElementById('queryL'),
    queryR: document.getElementById('queryR'),
    btnQuery: document.getElementById('btnQuery'),
    queryResult: document.getElementById('queryResult'),
    queryValue: document.getElementById('queryValue'),
    
    btnReset: document.getElementById('btnReset'),
    engineBadge: document.getElementById('engineBadge'),
    
    statVersions: document.getElementById('statVersions'),
    statNodes: document.getElementById('statNodes'),
    statSaved: document.getElementById('statSaved'),
    statDeepNodes: document.getElementById('statDeepNodes'),
    
    canvasWrapper: document.getElementById('canvasWrapper')
};

let svg, g, zoom;

function initPersistentTree() {
    setupD3();
    bindEvents();
    resetEngine();
}

function bindEvents() {
    els.btnUpdate.addEventListener('click', handleUpdate);
    els.btnQuery.addEventListener('click', handleQuery);
    els.btnReset.addEventListener('click', resetEngine);
    window.addEventListener('resize', () => {
        const w = els.canvasWrapper.clientWidth;
        const h = els.canvasWrapper.clientHeight;
        svg.attr("width", w).attr("height", h);
    });
}

function resetEngine() {
    nodeIdCounter = 0;
    allNodes = [];
    allLinks = [];
    versions = [];

    // Build base tree v0
    const root = buildTree(0, ARRAY_SIZE - 1);
    calcDepths(root, 0);
    versions.push(root);

    // Reset UI
    els.nextVersionText.textContent = "1";
    els.queryVersion.innerHTML = '<option value="0">v0 (Initial State)</option>';
    els.queryResult.classList.add('hidden');
    els.engineBadge.classList.remove('querying');

    updateTelemetry();
    renderD3DAG();
}

function handleUpdate() {
    const idx = parseInt(els.updateIndex.value);
    const val = parseInt(els.updateValue.value);

    if (isNaN(idx) || idx < 0 || idx >= ARRAY_SIZE) return console.warn("Alert:", "Index must be between 0 and 7.");
    if (isNaN(val)) return console.warn("Alert:", "Value must be a number.");

    const currentVersion = versions.length;
    const prevRoot = versions[currentVersion - 1];

    // Create new Persistent Root
    const newRoot = updatePersistent(prevRoot, 0, ARRAY_SIZE - 1, idx, val, currentVersion);
    calcDepths(newRoot, 0);
    versions.push(newRoot);

    // Update UI
    els.nextVersionText.textContent = currentVersion + 1;
    
    const opt = document.createElement('option');
    opt.value = currentVersion;
    opt.textContent = `v${currentVersion} (Updated idx ${idx} to ${val})`;
    els.queryVersion.appendChild(opt);
    els.queryVersion.value = currentVersion; // auto-select newest

    els.queryResult.classList.add('hidden');

    updateTelemetry();
    renderD3DAG();
}

function updateTelemetry() {
    const totalVersions = versions.length;
    const nodesCreated = allNodes.length;
    
    // A standard segment tree for N=8 has 15 nodes.
    // Without structural sharing, V versions = V * 15 nodes.
    const deepCopyCost = totalVersions * 15;
    const nodesSaved = deepCopyCost - nodesCreated;

    els.statVersions.textContent = totalVersions;
    els.statNodes.textContent = nodesCreated;
    els.statDeepNodes.textContent = deepCopyCost;
    els.statSaved.textContent = nodesSaved;
}

// ==========================================
// 3. TIME-TRAVEL QUERY ENGINE
// ==========================================

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function handleQuery() {
    const vIdx = parseInt(els.queryVersion.value);
    const l = parseInt(els.queryL.value);
    const r = parseInt(els.queryR.value);

    if (l > r || l < 0 || r >= ARRAY_SIZE) return console.warn("Alert:", "Invalid range. Ensure L <= R and within 0-7.");

    els.btnQuery.disabled = true;
    els.engineBadge.classList.add('querying');
    els.engineBadge.innerHTML = `<i class="fas fa-search"></i> Querying v${vIdx}...`;
    els.queryResult.classList.add('hidden');

    // Reset visual highlights
    d3.selectAll('.node').classed('query-target', false);
    d3.selectAll('.link').classed('query-path', false);

    const targetRoot = versions[vIdx];
    const sum = await executeRangeQuery(targetRoot, 0, ARRAY_SIZE - 1, l, r);

    els.queryValue.textContent = sum;
    els.queryResult.classList.remove('hidden');

    els.btnQuery.disabled = false;
    els.engineBadge.classList.remove('querying');
    els.engineBadge.innerHTML = `<i class="fas fa-history"></i> Immutable Memory Engine`;
}

// Visually animated recursive range query
async function executeRangeQuery(node, start, end, l, r) {
    if (!node) return 0;

    // No overlap
    if (l > end || r < start) return 0;

    // Total overlap -> Highlight Node and Return
    if (l <= start && end <= r) {
        d3.select(`#d3-${node.id}`).classed('query-target', true);
        await sleep(300);
        return node.val;
    }

    // Partial overlap -> Traverse children
    const mid = Math.floor((start + end) / 2);

    if (l <= mid) {
        // Highlight link to left child
        const linkId = `link-${node.id}-${node.left.id}`;
        d3.select(`#${linkId}`).classed('query-path', true);
        await sleep(200);
    }
    const leftSum = await executeRangeQuery(node.left, start, mid, l, r);

    if (r > mid) {
        // Highlight link to right child
        const linkId = `link-${node.id}-${node.right.id}`;
        d3.select(`#${linkId}`).classed('query-path', true);
        await sleep(200);
    }
    const rightSum = await executeRangeQuery(node.right, mid + 1, end, l, r);

    return leftSum + rightSum;
}

// ==========================================
// 4. D3.JS DAG RENDERER
// ==========================================

function setupD3() {
    const container = document.getElementById('canvasWrapper');
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg = d3.select("#canvasWrapper")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    g = svg.append("g");

    zoom = d3.zoom()
        .scaleExtent([0.3, 2])
        .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);
}

function renderD3DAG() {
    g.selectAll("*").remove();

    const NODE_W = 60;
    const NODE_H = 40;
    
    // --- Manual Deterministic DAG Layout ---
    // Instead of forcing a strict tree layout (which fails for multiple parents),
    // we logically arrange nodes based on their Segment Range and Version.
    // X-axis: Determined by the middle of the segment [L, R] + version offset
    // Y-axis: Determined by tree depth (0 for root, 3 for leaves)

    const X_SPACING = 65;
    const Y_SPACING = 90;
    const V_OFFSET = 18; // Offset newer versions slightly to the right to avoid overlapping exact clones

    allNodes.forEach(n => {
        const midPoint = (n.l + n.r) / 2;
        n.x = (midPoint * X_SPACING) + (n.version * V_OFFSET) + 50;
        n.y = (n.depth * Y_SPACING) + 80;
    });

    // Center the camera
    const canvasW = els.canvasWrapper.clientWidth;
    svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity.translate(canvasW/2 - 250, 20).scale(0.85));

    // 1. Draw Links
    const links = g.selectAll(".link")
        .data(allLinks, d => `${d.source}-${d.target}-${d.sourceVersion}`);

    links.enter().append("path")
        .attr("class", d => `link ${d.isShared ? 'shared' : 'new-path'}`)
        .attr("id", d => `link-${d.source}-${d.target}`)
        .attr("d", d => {
            const src = allNodes.find(n => n.id === d.source);
            const tgt = allNodes.find(n => n.id === d.target);
            // Cubic bezier curve
            return `M ${src.x} ${src.y + (NODE_H/2)} 
                    C ${src.x} ${src.y + (NODE_H/2) + 30}, 
                      ${tgt.x} ${tgt.y - (NODE_H/2) - 30}, 
                      ${tgt.x} ${tgt.y - (NODE_H/2)}`;
        });

    // 2. Draw Nodes
    const nodes = g.selectAll(".node")
        .data(allNodes, d => d.id);

    const nodeEnter = nodes.enter().append("g")
        .attr("class", d => `node ${d.version === 0 ? 'v0' : 'vN'}`)
        .attr("id", d => `d3-${d.id}`)
        .attr("transform", d => `translate(${d.x},${d.y})`);

    // Node Box
    nodeEnter.append("rect")
        .attr("width", NODE_W)
        .attr("height", NODE_H)
        .attr("x", -(NODE_W/2))
        .attr("y", -(NODE_H/2));

    // Value
    nodeEnter.append("text")
        .attr("dy", "-2")
        .text(d => d.val);

    // Range Label
    nodeEnter.append("text")
        .attr("class", "node-range")
        .attr("dy", "12")
        .text(d => `[${d.l},${d.r}]`);

    // Version Label (Roots only)
    nodeEnter.filter(d => d.depth === 0).append("text")
        .attr("class", "node-version")
        .attr("dy", "-28")
        .text(d => `v${d.version}`);
}
