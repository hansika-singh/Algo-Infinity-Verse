/**
 * gc-visualizer.js
 * Visualizes the Call Stack, Memory Heap, and the V8 Mark-and-Sweep
 * Garbage Collection algorithm using D3.js Force Simulation.
 */

document.addEventListener("DOMContentLoaded", () => {
    initGCVisualizer();
});

// App State & Graph Data
let nodes = [];
let links = [];
let nodeIdCounter = 1;
let isGC_Running = false;

// D3 State
let svg, g, simulation;
let link, node;
const width = window.innerWidth * 0.65; // Approx panel width
const height = window.innerHeight - 110;

// DOM Elements
const els = {
    btnScenNormal: document.getElementById('btnScenNormal'),
    btnScenCircular: document.getElementById('btnScenCircular'),
    btnScenSever: document.getElementById('btnScenSever'),
    btnRunGC: document.getElementById('btnRunGC'),
    btnClearHeap: document.getElementById('btnClearHeap'),
    
    statLiveCount: document.getElementById('statLiveCount'),
    statHeapBytes: document.getElementById('statHeapBytes'),
    gcPhaseDisplay: document.getElementById('gcPhaseDisplay'),
    engineBadge: document.getElementById('engineBadge')
};

// ==========================================
// 1. INITIALIZATION & D3 SETUP
// ==========================================
function initGCVisualizer() {
    setupD3();
    bindEvents();
    
    // Load default scenario
    loadScenario('normal');
}

function setupD3() {
    svg = d3.select("#memoryCanvas")
        .call(d3.zoom().on("zoom", (event) => {
            g.attr("transform", event.transform);
        }))
        .on("dblclick.zoom", null); // Disable double click zoom

    // Define arrowhead markers
    const defs = svg.append("defs");
    createMarker(defs, "arrow", "#475569");
    createMarker(defs, "arrow-active", "var(--gc-mark)");
    createMarker(defs, "arrow-dying", "var(--gc-sweep)");

    g = svg.append("g");

    // Init Simulation
    simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(height / 2).strength(0.05));
        
    // Root nodes stay pinned to the left
    simulation.on("tick", ticked);
}

function createMarker(defs, id, color) {
    defs.append("marker")
        .attr("id", id)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 22) // Offset for circle radius
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", color);
}

// ==========================================
// 2. DATA MANIPULATION
// ==========================================

function createNode(type, label, isRoot = false) {
    const node = {
        id: `obj_${nodeIdCounter++}`,
        type: type,
        label: label,
        isRoot: isRoot,
        status: 'allocated' // allocated, marked, swept
    };
    
    // Pin roots to the left side (Stack representation)
    if (isRoot) {
        node.fx = 100;
        // Spread out multiple roots vertically
        const rootCount = nodes.filter(n => n.isRoot).length;
        node.fy = 150 + (rootCount * 100);
    }
    
    nodes.push(node);
    return node;
}

function createLink(source, target) {
    // Avoid duplicates
    if (!links.find(l => l.source.id === source.id && l.target.id === target.id)) {
        links.push({ source: source.id, target: target.id, status: 'allocated' });
    }
}

function removeLink(sourceId, targetId) {
    links = links.filter(l => !(l.source.id === sourceId && l.target.id === targetId));
    updateGraph();
}

// ==========================================
// 3. GRAPH RENDERING
// ==========================================

function updateGraph() {
    // 1. Update Links
    link = g.selectAll(".link")
        .data(links, d => `${d.source.id || d.source}-${d.target.id || d.target}`);

    link.exit().remove();

    const linkEnter = link.enter().append("path")
        .attr("class", "link")
        .attr("marker-end", "url(#arrow)");

    link = linkEnter.merge(link);
    
    // Apply visual status to links
    link.attr("class", d => `link ${d.status}`)
        .attr("marker-end", d => {
            if (d.status === 'active') return "url(#arrow-active)";
            if (d.status === 'dying') return "url(#arrow-dying)";
            return "url(#arrow)";
        });

    // 2. Update Nodes
    node = g.selectAll(".node")
        .data(nodes, d => d.id);

    node.exit().remove();

    const nodeEnter = node.enter().append("g")
        .attr("class", d => `node ${d.isRoot ? 'root' : 'heap'}`)
        .call(drag(simulation));

    // Root nodes get Rectangles, Heap nodes get Circles
    nodeEnter.each(function(d) {
        const el = d3.select(this);
        if (d.isRoot) {
            el.append("rect")
                .attr("width", 60).attr("height", 30)
                .attr("x", -30).attr("y", -15).attr("rx", 4);
        } else {
            el.append("circle").attr("r", 20);
        }
        el.append("text").text(d.label);
    });

    node = nodeEnter.merge(node);
    
    // Apply visual status to nodes
    node.attr("class", d => `node ${d.isRoot ? 'root' : 'heap'} ${d.status}`);

    // 3. Restart Simulation
    simulation.nodes(nodes);
    simulation.force("link").links(links);
    simulation.alpha(0.3).restart();
    
    updateTelemetry();
}

function ticked() {
    link.attr("d", d => {
        // Adjust for root rectangles vs heap circles
        const targetRadius = d.target.isRoot ? 30 : 20;
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Shorten path so arrow points exactly at node border
        const offset = targetRadius / dist;
        const targetX = d.target.x - (dx * offset);
        const targetY = d.target.y - (dy * offset);
        
        return `M${d.source.x},${d.source.y} L${targetX},${targetY}`;
    });

    node.attr("transform", d => `translate(${d.x},${d.y})`);
}

// Drag Physics
function drag(sim) {
    return d3.drag()
        .on("start", (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
        })
        .on("drag", (event, d) => {
            d.fx = event.x; d.fy = event.y;
        })
        .on("end", (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            if (!d.isRoot) { d.fx = null; d.fy = null; } // Only unpin heap objects
        });
}

function updateTelemetry() {
    const heapCount = nodes.filter(n => !n.isRoot).length;
    els.statLiveCount.textContent = heapCount;
    // Mock metric: 64 bytes per object
    els.statHeapBytes.textContent = `${(heapCount * 64).toLocaleString()} B`;
}

// ==========================================
// 4. MARK-AND-SWEEP ALGORITHM (The GC)
// ==========================================

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runMarkAndSweep() {
    if (isGC_Running || nodes.length === 0) return;
    
    isGC_Running = true;
    els.btnRunGC.disabled = true;
    els.btnScenSever.disabled = true;
    els.engineBadge.classList.add('active');
    
    // Reset statuses
    nodes.forEach(n => { if (!n.isRoot) n.status = 'allocated'; });
    links.forEach(l => l.status = 'allocated');
    updateGraph();

    // --- PHASE 1: MARK ---
    els.gcPhaseDisplay.textContent = "Phase 1: Marking Reachable Objects...";
    els.gcPhaseDisplay.className = "gc-phase-indicator marking";
    
    const roots = nodes.filter(n => n.isRoot);
    const visited = new Set();
    const queue = [...roots];
    
    while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current.id)) continue;
        visited.add(current.id);
        
        // Visual delay for educational effect
        if (!current.isRoot) {
            current.status = 'marked';
            updateGraph();
            await sleep(400);
        }

        // Find outbound references
        const outboundLinks = links.filter(l => (l.source.id || l.source) === current.id);
        
        for (let l of outboundLinks) {
            l.status = 'active';
            updateGraph();
            await sleep(200);
            
            const targetNode = typeof l.target === 'object' ? l.target : nodes.find(n => n.id === l.target);
            if (!visited.has(targetNode.id)) {
                queue.push(targetNode);
            }
        }
    }
    
    await sleep(800);

    // --- PHASE 2: SWEEP ---
    els.gcPhaseDisplay.textContent = "Phase 2: Sweeping Unreachable Memory...";
    els.gcPhaseDisplay.className = "gc-phase-indicator sweeping";
    
    const nodesToSweep = nodes.filter(n => !n.isRoot && !visited.has(n.id));
    const linksToSweep = links.filter(l => {
        const sid = l.source.id || l.source;
        const tid = l.target.id || l.target;
        return !visited.has(sid) || !visited.has(tid);
    });

    // Mark as dying
    nodesToSweep.forEach(n => n.status = 'swept');
    linksToSweep.forEach(l => l.status = 'dying');
    updateGraph();
    
    await sleep(1000);

    // Physically remove from memory
    nodes = nodes.filter(n => n.isRoot || visited.has(n.id));
    links = links.filter(l => {
        const sid = l.source.id || l.source;
        const tid = l.target.id || l.target;
        return visited.has(sid) && visited.has(tid);
    });
    
    // Reset visuals
    nodes.forEach(n => n.status = 'allocated');
    links.forEach(l => l.status = 'allocated');
    updateGraph();
    
    // Cleanup UI
    els.gcPhaseDisplay.textContent = "System Idle";
    els.gcPhaseDisplay.className = "gc-phase-indicator";
    els.engineBadge.classList.remove('active');
    els.btnRunGC.disabled = false;
    els.btnScenSever.disabled = false;
    isGC_Running = false;
}

// ==========================================
// 5. SCENARIOS & UI BINDING
// ==========================================

function bindEvents() {
    els.btnRunGC.addEventListener('click', runMarkAndSweep);
    els.btnClearHeap.addEventListener('click', () => {
        nodes = []; links = []; nodeIdCounter = 1;
        updateGraph();
    });
    
    els.btnScenNormal.addEventListener('click', () => loadScenario('normal'));
    els.btnScenCircular.addEventListener('click', () => loadScenario('circular'));
    els.btnScenSever.addEventListener('click', severRootReference);
}

function loadScenario(type) {
    if (isGC_Running) return;
    nodes = []; links = []; nodeIdCounter = 1;

    if (type === 'normal') {
        const root = createNode('stack', 'let app', true);
        const objA = createNode('heap', 'User');
        const objB = createNode('heap', 'Profile');
        createLink(root, objA);
        createLink(objA, objB);
    } 
    else if (type === 'circular') {
        // Create an isolated island of objects pointing to each other
        const obj1 = createNode('heap', 'Node A');
        const obj2 = createNode('heap', 'Node B');
        const obj3 = createNode('heap', 'Node C');
        
        createLink(obj1, obj2);
        createLink(obj2, obj3);
        createLink(obj3, obj1); // Circular Reference!
        
        // Valid references
        const root = createNode('stack', 'let active', true);
        const obj4 = createNode('heap', 'Session');
        createLink(root, obj4);
    }
    
    updateGraph();
}

function severRootReference() {
    if (isGC_Running) return;
    // Find a link connected to a root and delete it
    const rootLink = links.find(l => {
        const sourceNode = typeof l.source === 'object' ? l.source : nodes.find(n => n.id === l.source);
        return sourceNode.isRoot;
    });
    
    if (rootLink) {
        removeLink(rootLink.source.id || rootLink.source, rootLink.target.id || rootLink.target);
    } else {
        alert("No root references left to sever!");
    }
}
