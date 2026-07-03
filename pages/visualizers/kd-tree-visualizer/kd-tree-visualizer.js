// kd-tree-visualizer.js

/**
 * K-D Tree & Nearest Neighbor Spatial Visualizer
 */

// State
let points = [];
let kdTree = null;
let targetPoint = null;
let currentMode = 'add'; // 'add' or 'search'

// Tree Data structure ID counter
let nextNodeId = 1;

// Trace & Animation
let evaluationTrace = [];
let traceIndex = 0;
let isPlaying = false;
let playInterval = null;
let playSpeedMs = 400;

// Metrics
let statVisited = 0;
let statPruned = 0;
let currentBestNode = null;
let currentBestDist = Infinity;

// UI Elements
const canvas = document.getElementById('kdCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvasContainer');

const modeAddBtn = document.getElementById('modeAdd');
const modeSearchBtn = document.getElementById('modeSearch');
const btnRandomize = document.getElementById('btnRandomize');
const btnClear = document.getElementById('btnClear');
const btnPlayPause = document.getElementById('btnPlayPause');
const btnStep = document.getElementById('btnStep');
const speedSlider = document.getElementById('speedSlider');

const statVisitedEl = document.getElementById('statVisited');
const statPrunedEl = document.getElementById('statPruned');
const statDistEl = document.getElementById('statDist');
const treeOverlay = document.getElementById('treeOverlay');

// D3 Setup
const treeContainer = document.getElementById('treeContainer');
const svg = d3.select('#treeSvg');
const gWrapper = svg.append('g');
const zoom = d3.zoom().scaleExtent([0.1, 3]).on('zoom', (event) => {
    gWrapper.attr('transform', event.transform);
});
svg.call(zoom);
let treeLayout = d3.tree().nodeSize([80, 90]); 

// Resize Canvas
function resizeCanvas() {
    canvas.width = container.clientWidth - 40;
    canvas.height = container.clientHeight - 40;
    drawCanvas();
    if (kdTree) {
        centerTree();
    }
}
window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 100);

// Point Class
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

// KD Node Class
class KDNode {
    constructor(point, depth, id) {
        this.id = id;
        this.point = point;
        this.depth = depth;
        this.axis = depth % 2; // 0 for X, 1 for Y
        this.left = null;
        this.right = null;
        
        // Visual state
        this.pruned = false;
        
        // Bounding box for canvas drawing
        this.bounds = { xMin: 0, xMax: canvas.width, yMin: 0, yMax: canvas.height };
    }
}

// K-D Tree logic (incremental insertion without rebalancing for simplicity in visualizer)
function insertKD(node, point, depth, xMin, xMax, yMin, yMax) {
    if (node === null) {
        const newNode = new KDNode(point, depth, nextNodeId++);
        newNode.bounds = { xMin, xMax, yMin, yMax };
        return newNode;
    }
    
    const axis = depth % 2;
    if (axis === 0) {
        // Compare X
        if (point.x < node.point.x) {
            node.left = insertKD(node.left, point, depth + 1, xMin, node.point.x, yMin, yMax);
        } else {
            node.right = insertKD(node.right, point, depth + 1, node.point.x, xMax, yMin, yMax);
        }
    } else {
        // Compare Y
        if (point.y < node.point.y) {
            node.left = insertKD(node.left, point, depth + 1, xMin, xMax, yMin, node.point.y);
        } else {
            node.right = insertKD(node.right, point, depth + 1, xMin, xMax, node.point.y, yMax);
        }
    }
    return node;
}

function rebuildTree() {
    kdTree = null;
    nextNodeId = 1;
    // We insert points in the order they were added
    for (const p of points) {
        kdTree = insertKD(kdTree, p, 0, 0, canvas.width, 0, canvas.height);
    }
    
    if (points.length > 0) {
        treeOverlay.style.display = 'none';
        renderD3Tree(kdTree);
        centerTree();
    } else {
        treeOverlay.style.display = 'block';
        clearTree();
    }
    drawCanvas();
}

function clearTree() {
    gWrapper.selectAll("*").remove();
}

let lastTreeRoot = null;

function centerTree() {
    if (!lastTreeRoot) return;
    
    // 1. Calculate bounding box of the tree data
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    // We add buffer space for node labels and circles (r=15, labels up to dy=32)
    const nodeRadius = 30; // buffer for circle
    const labelHeight = 40; // buffer for text below
    
    lastTreeRoot.descendants().forEach(d => {
        if (d.x < minX) minX = d.x;
        if (d.x > maxX) maxX = d.x;
        if (d.y < minY) minY = d.y;
        if (d.y > maxY) maxY = d.y;
    });
    
    minX -= nodeRadius;
    maxX += nodeRadius;
    minY -= nodeRadius;
    maxY += (nodeRadius + labelHeight); // extra for bottom text
    
    const treeWidth = maxX - minX;
    const treeHeight = maxY - minY;
    
    // 2. Get container size
    const containerW = treeContainer.clientWidth;
    const containerH = treeContainer.clientHeight;
    
    if (treeWidth <= 0 || treeHeight <= 0) return;
    
    // 3. Padding logic
    const padding = 60;
    
    // 4. Calculate required scale
    const scaleX = (containerW - padding * 2) / treeWidth;
    const scaleY = (containerH - padding * 2) / treeHeight;
    const scale = Math.min(scaleX, scaleY, 2); // Cap max zoom at 2
    
    // 5. Calculate center translation
    const scaledWidth = treeWidth * scale;
    const scaledHeight = treeHeight * scale;
    
    const tx = (containerW - scaledWidth) / 2 - (minX * scale);
    const ty = (containerH - scaledHeight) / 2 - (minY * scale);
    
    const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);
    svg.transition().duration(500).call(zoom.transform, transform);
}

// Nearest Neighbor Search Generator
function distanceSq(p1, p2) {
    return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
}

function startNNSearch(target) {
    if (!kdTree) return;
    targetPoint = target;
    evaluationTrace = [];
    currentBestNode = null;
    currentBestDist = Infinity;
    
    // reset visual state
    resetTreeState(kdTree);
    
    nnSearch(kdTree, target);
    
    traceIndex = 0;
    statVisited = 0;
    statPruned = 0;
    statVisitedEl.textContent = '0';
    statPrunedEl.textContent = '0';
    statDistEl.textContent = '-';
    
    btnPlayPause.disabled = false;
    btnStep.disabled = false;
    isPlaying = true;
    btnPlayPause.innerHTML = '<i class="fas fa-pause"></i> Pause';
    
    renderD3Tree(kdTree);
    drawCanvas();
    
    clearInterval(playInterval);
    playInterval = setInterval(stepVisualization, playSpeedMs);
}

function resetTreeState(node) {
    if(!node) return;
    node.pruned = false;
    resetTreeState(node.left);
    resetTreeState(node.right);
}

function nnSearch(node, target) {
    if (!node) return;
    
    // Visit
    evaluationTrace.push({ type: 'visit', node: node });
    
    const dist = distanceSq(node.point, target);
    if (dist < currentBestDist) {
        currentBestDist = dist;
        currentBestNode = node;
        evaluationTrace.push({ type: 'update_best', node: node, dist: dist });
    }
    
    const axis = node.axis;
    let nextBranch = null;
    let otherBranch = null;
    
    const diff = (axis === 0) ? (target.x - node.point.x) : (target.y - node.point.y);
    
    if (diff < 0) {
        nextBranch = node.left;
        otherBranch = node.right;
    } else {
        nextBranch = node.right;
        otherBranch = node.left;
    }
    
    nnSearch(nextBranch, target);
    
    // Check if we need to explore other branch (Bounding box intersection)
    // The perpendicular distance from target to the splitting plane
    if (diff * diff < currentBestDist) {
        if(otherBranch) evaluationTrace.push({ type: 'check_other', node: otherBranch });
        nnSearch(otherBranch, target);
    } else if (otherBranch) {
        // Pruned
        evaluationTrace.push({ type: 'prune', node: otherBranch });
    }
}

// Playback Logic
function stepVisualization() {
    if (traceIndex >= evaluationTrace.length) {
        pauseVisualization();
        btnPlayPause.disabled = true;
        btnStep.disabled = true;
        renderD3Tree(kdTree, null, currentBestNode?.id);
        drawCanvas(null, currentBestNode);
        return;
    }
    
    const step = evaluationTrace[traceIndex];
    let activeId = step.node.id;
    
    if (step.type === 'visit') {
        statVisited++;
        statVisitedEl.textContent = statVisited;
    } else if (step.type === 'update_best') {
        statDistEl.textContent = Math.sqrt(step.dist).toFixed(1);
    } else if (step.type === 'prune') {
        statPruned++;
        statPrunedEl.textContent = statPruned;
        markSubtreePruned(step.node);
    }
    
    // Extract current best from history up to traceIndex
    let currentTraceBest = null;
    for(let i = traceIndex; i>=0; i--) {
        if (evaluationTrace[i].type === 'update_best') {
            currentTraceBest = evaluationTrace[i].node;
            break;
        }
    }
    
    renderD3Tree(kdTree, activeId, currentTraceBest?.id);
    drawCanvas(step.node, currentTraceBest);
    
    traceIndex++;
}

function markSubtreePruned(node) {
    if(!node) return;
    node.pruned = true;
    markSubtreePruned(node.left);
    markSubtreePruned(node.right);
}

function togglePlay() {
    if (isPlaying) {
        pauseVisualization();
    } else {
        isPlaying = true;
        btnPlayPause.innerHTML = '<i class="fas fa-pause"></i> Pause';
        playInterval = setInterval(stepVisualization, playSpeedMs);
    }
}

function pauseVisualization() {
    isPlaying = false;
    btnPlayPause.innerHTML = '<i class="fas fa-play"></i> Play';
    clearInterval(playInterval);
}

// D3 Rendering
function renderD3Tree(rootData, activeNodeId = null, bestNodeId = null) {
    if (!rootData) return;
    
    // We map our custom tree to D3 Hierarchy format
    const d3Map = (node) => {
        if(!node) return null;
        let children = [];
        if(node.left) children.push(d3Map(node.left));
        if(node.right) children.push(d3Map(node.right));
        return {
            id: node.id,
            x_val: node.point.x,
            y_val: node.point.y,
            axis: node.axis,
            pruned: node.pruned,
            children: children
        };
    };
    
    const root = d3.hierarchy(d3Map(rootData));
    treeLayout(root);
    lastTreeRoot = root;
    
    // Links
    const link = gWrapper.selectAll(".link").data(root.links(), d => d.target.data.id);
        
    link.enter().append("path").attr("class", "link")
        .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y))
        .attr("opacity", 0)
        .transition().duration(200).attr("opacity", 1);
        
    link.attr("d", d3.linkVertical().x(d => d.x).y(d => d.y))
        .attr("class", d => {
            let c = "link";
            if(d.target.data.pruned) c += " pruned";
            if(d.target.data.id === activeNodeId || d.source.data.id === activeNodeId) c += " active-eval";
            return c;
        });
        
    link.exit().remove();
    
    // Nodes
    const node = gWrapper.selectAll(".node").data(root.descendants(), d => d.data.id);
        
    const nodeEnter = node.enter().append("g")
        .attr("class", d => `node ${d.data.axis === 0 ? 'axis-x' : 'axis-y'}`)
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("opacity", 0);
        
    nodeEnter.transition().duration(200).attr("opacity", 1);
    nodeEnter.append("circle").attr("r", 15);
    
    nodeEnter.append("text").attr("class", "coord-text").attr("dy", 4)
        .text(d => `${d.data.axis === 0 ? 'X' : 'Y'}`);
        
    // Add text background for readability
    nodeEnter.append("rect")
        .attr("class", "label-bg")
        .attr("x", -25)
        .attr("y", 20)
        .attr("width", 50)
        .attr("height", 16)
        .attr("rx", 8);
        
    nodeEnter.append("text").attr("class", "val-text").attr("dy", 32)
        .text(d => `(${Math.round(d.data.x_val)},${Math.round(d.data.y_val)})`);
        
    node.attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("class", d => {
            let c = `node ${d.data.axis === 0 ? 'axis-x' : 'axis-y'}`;
            if(d.data.pruned) c += " pruned";
            if(d.data.id === bestNodeId) c += " nearest";
            if(d.data.id === activeNodeId) c += " active-eval";
            return c;
        });
        
    node.exit().remove();
}

// Canvas Rendering
function drawCanvas(activeNode = null, bestNode = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (kdTree) {
        drawKDNodeBounds(kdTree, activeNode);
    }
    
    // Draw all points
    for (let p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.closePath();
    }
    
    // Draw Target and best search state
    if (targetPoint) {
        // Target
        ctx.beginPath();
        ctx.arc(targetPoint.x, targetPoint.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#f1c40f'; // Yellow
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        if (bestNode) {
            // Draw radius circle
            const r = Math.sqrt(distanceSq(targetPoint, bestNode.point));
            ctx.beginPath();
            ctx.arc(targetPoint.x, targetPoint.y, r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(46, 204, 113, 0.4)'; // Green dash
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw line to best
            ctx.beginPath();
            ctx.moveTo(targetPoint.x, targetPoint.y);
            ctx.lineTo(bestNode.point.x, bestNode.point.y);
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Highlight best node point
            ctx.beginPath();
            ctx.arc(bestNode.point.x, bestNode.point.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#2ecc71';
            ctx.fill();
        }
        
        if (activeNode) {
            // Highlight active evaluating node
            ctx.beginPath();
            ctx.arc(activeNode.point.x, activeNode.point.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#f39c12';
            ctx.fill();
        }
    }
}

function drawKDNodeBounds(node, activeNode) {
    if (!node) return;
    
    // Dim pruned areas
    if (node.pruned) {
        ctx.fillStyle = 'rgba(30, 30, 30, 0.6)';
        ctx.fillRect(node.bounds.xMin, node.bounds.yMin, node.bounds.xMax - node.bounds.xMin, node.bounds.yMax - node.bounds.yMin);
    } else {
        // Draw split line
        ctx.beginPath();
        if (node.axis === 0) {
            // Vertical line
            ctx.moveTo(node.point.x, node.bounds.yMin);
            ctx.lineTo(node.point.x, node.bounds.yMax);
            ctx.strokeStyle = node.id === activeNode?.id ? '#f1c40f' : 'rgba(231, 76, 60, 0.5)'; // Red
        } else {
            // Horizontal line
            ctx.moveTo(node.bounds.xMin, node.point.y);
            ctx.lineTo(node.bounds.xMax, node.point.y);
            ctx.strokeStyle = node.id === activeNode?.id ? '#f1c40f' : 'rgba(52, 152, 219, 0.5)'; // Blue
        }
        ctx.lineWidth = node.id === activeNode?.id ? 3 : 1.5;
        ctx.stroke();
    }
    
    if(!node.pruned) {
        drawKDNodeBounds(node.left, activeNode);
        drawKDNodeBounds(node.right, activeNode);
    }
}

// Interaction
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentMode === 'add') {
        points.push(new Point(x, y));
        targetPoint = null;
        pauseVisualization();
        btnPlayPause.disabled = true;
        btnStep.disabled = true;
        rebuildTree();
    } else {
        startNNSearch(new Point(x, y));
    }
});

modeAddBtn.addEventListener('click', () => {
    currentMode = 'add';
    modeAddBtn.className = 'btn-primary';
    modeSearchBtn.className = 'btn-secondary';
    targetPoint = null;
    drawCanvas();
});

modeSearchBtn.addEventListener('click', () => {
    currentMode = 'search';
    modeSearchBtn.className = 'btn-primary';
    modeAddBtn.className = 'btn-secondary';
});

btnRandomize.addEventListener('click', () => {
    pauseVisualization();
    points = [];
    for(let i=0; i<15; i++) {
        points.push(new Point(
            Math.random() * (canvas.width - 40) + 20,
            Math.random() * (canvas.height - 40) + 20
        ));
    }
    targetPoint = null;
    rebuildTree();
});

btnClear.addEventListener('click', () => {
    pauseVisualization();
    points = [];
    targetPoint = null;
    rebuildTree();
});

btnPlayPause.addEventListener('click', togglePlay);
btnStep.addEventListener('click', () => {
    pauseVisualization();
    stepVisualization();
});

speedSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    const speeds = {1: 1500, 2: 1000, 3: 600, 4: 250, 5: 50};
    playSpeedMs = speeds[val];
    if (isPlaying) {
        pauseVisualization();
        togglePlay();
    }
});
