/**
 * network-routing-simulator.js
 * Interactive OSPF/Dijkstra Network Topology Simulator using D3.js
 */

document.addEventListener("DOMContentLoaded", () => {
    initNetworkSimulator();
});

const els = {
    svg: d3.select("#networkSvg"),
    wrapper: document.getElementById('canvasWrapper'),
    toolBtns: document.querySelectorAll('.tool-btn'),
    srcSelect: document.getElementById('sourceSelect'),
    dstSelect: document.getElementById('destSelect'),
    sendBtn: document.getElementById('sendPacketBtn'),
    randomizeBtn: document.getElementById('randomizeWeightsBtn'),
    clearBtn: document.getElementById('clearNetBtn'),
    routerNameLabel: document.getElementById('selectedRouterName'),
    routingTableBody: document.querySelector('#routingTable tbody'),
    statusLabel: document.getElementById('networkStatus'),
    ctxMenu: document.getElementById('linkContextMenu'),
    ctxInput: document.getElementById('linkCostInput'),
    ctxSave: document.getElementById('ctxSaveBtn'),
    ctxCancel: document.getElementById('ctxCancelBtn')
};

let width, height;
let simulation;
let svg = els.svg;

// Graph Data
let nodes = [];
let links = [];
let routerCounter = 1;

// State
let currentTool = 'select'; // select, add-node, add-link, delete
let selectedNodeForLink = null;
let selectedNodeForTable = null;
let editingLink = null;

// D3 Selections
let linkGroup, nodeGroup, packetGroup;

function initNetworkSimulator() {
    const rect = els.wrapper.getBoundingClientRect();
    width = rect.width;
    height = rect.height;

    // SVG Groups for z-indexing
    linkGroup = svg.append("g").attr("class", "links");
    nodeGroup = svg.append("g").attr("class", "nodes");
    packetGroup = svg.append("g").attr("class", "packets");

    // Force Simulation Setup
    simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-800))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);

    // Initial default topology
    createDefaultTopology();

    bindEvents();
    updateGraph();
    recalculateAll();
}

// ==========================================
// EVENTS & UI BINDINGS
// ==========================================
function bindEvents() {
    // Resize
    window.addEventListener('resize', () => {
        const rect = els.wrapper.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        simulation.force("center", d3.forceCenter(width / 2, height / 2));
        simulation.alpha(0.3).restart();
    });

    // Toolbar
    els.toolBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            els.toolBtns.forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            currentTool = target.dataset.tool;
            
            // Update SVG cursor class
            document.getElementById('networkSvg').className = `tool-${currentTool}`;
            
            // Reset state
            if(selectedNodeForLink) {
                unhighlightNode(selectedNodeForLink);
                selectedNodeForLink = null;
            }
        });
    });

    // SVG Background Clicks (Add Node)
    svg.on("click", (event) => {
        if (event.defaultPrevented) return; // Dragged

        if (currentTool === 'add-node') {
            const coords = d3.pointer(event);
            addNode(coords[0], coords[1]);
        } else if (currentTool === 'select') {
            // Deselect routing table
            selectedNodeForTable = null;
            updateRoutingTableUI();
            els.ctxMenu.style.display = 'none';
        }
    });

    // Context Menu Links
    els.ctxSave.addEventListener('click', () => {
        if(editingLink) {
            const val = parseInt(els.ctxInput.value);
            if(val > 0) {
                editingLink.weight = val;
                updateGraph();
                recalculateAll();
            }
        }
        els.ctxMenu.style.display = 'none';
    });

    els.ctxCancel.addEventListener('click', () => {
        els.ctxMenu.style.display = 'none';
    });

    // Top buttons
    els.clearBtn.addEventListener('click', () => {
        nodes = [];
        links = [];
        routerCounter = 1;
        selectedNodeForTable = null;
        updateGraph();
        recalculateAll();
    });

    els.randomizeBtn.addEventListener('click', () => {
        links.forEach(l => l.weight = Math.floor(Math.random() * 20) + 1);
        updateGraph();
        recalculateAll();
    });

    // Packet Sending
    els.sendBtn.addEventListener('click', sendPacket);
    
    // Select dropdown changes
    els.srcSelect.addEventListener('change', updateSendButtonState);
    els.dstSelect.addEventListener('change', updateSendButtonState);
}

function updateSendButtonState() {
    if (els.srcSelect.value && els.dstSelect.value && els.srcSelect.value !== els.dstSelect.value) {
        els.sendBtn.disabled = false;
    } else {
        els.sendBtn.disabled = true;
    }
}

// ==========================================
// GRAPH MUTATIONS
// ==========================================
function createDefaultTopology() {
    nodes = [
        { id: "R1", x: width/2 - 150, y: height/2 - 100 },
        { id: "R2", x: width/2 + 150, y: height/2 - 100 },
        { id: "R3", x: width/2, y: height/2 + 100 },
        { id: "R4", x: width/2 - 250, y: height/2 + 50 }
    ];
    routerCounter = 5;

    links = [
        { source: "R1", target: "R2", weight: 5 },
        { source: "R1", target: "R3", weight: 2 },
        { source: "R2", target: "R3", weight: 8 },
        { source: "R1", target: "R4", weight: 1 }
    ];
}

function addNode(x, y) {
    const id = `R${routerCounter++}`;
    nodes.push({ id, x, y });
    updateGraph();
    recalculateAll();
}

function addLink(source, target) {
    // Check if exists
    const exists = links.find(l => 
        (l.source.id === source.id && l.target.id === target.id) || 
        (l.source.id === target.id && l.target.id === source.id)
    );
    
    if (!exists && source.id !== target.id) {
        links.push({
            source: source.id,
            target: target.id,
            weight: Math.floor(Math.random() * 15) + 1
        });
        updateGraph();
        recalculateAll();
    }
}

function deleteNode(node) {
    nodes = nodes.filter(n => n.id !== node.id);
    links = links.filter(l => l.source.id !== node.id && l.target.id !== node.id);
    if (selectedNodeForTable && selectedNodeForTable.id === node.id) {
        selectedNodeForTable = null;
    }
    updateGraph();
    recalculateAll();
}

function deleteLink(link) {
    links = links.filter(l => l !== link);
    updateGraph();
    recalculateAll();
}

// ==========================================
// D3 RENDERING
// ==========================================
function updateGraph() {
    // Sync simulation data
    simulation.nodes(nodes);
    simulation.force("link").links(links);

    // --- LINKS ---
    const linkSel = linkGroup.selectAll(".link-group").data(links, d => d.source.id + "-" + d.target.id);
    
    linkSel.exit().remove();
    
    const linkEnter = linkSel.enter().append("g").attr("class", "link-group");
    
    // Line
    linkEnter.append("line")
        .attr("class", "link")
        .on("click", (event, d) => {
            if (currentTool === 'delete') {
                deleteLink(d);
            } else if (currentTool === 'select') {
                // Open Context Menu
                editingLink = d;
                els.ctxInput.value = d.weight;
                els.ctxMenu.style.left = `${event.pageX}px`;
                els.ctxMenu.style.top = `${event.pageY}px`;
                els.ctxMenu.style.display = 'flex';
                event.stopPropagation();
            }
        });
        
    // Label BG
    linkEnter.append("rect").attr("class", "link-label-bg");
    // Label Text
    linkEnter.append("text").attr("class", "link-label");

    const allLinks = linkEnter.merge(linkSel);
    
    // Update texts
    allLinks.select("text").text(d => d.weight);
    allLinks.select("rect").each(function(d) {
        // Approximate bg size based on text
        const w = 24; const h = 18;
        d3.select(this)
          .attr("width", w).attr("height", h)
          .attr("x", -w/2).attr("y", -h/2);
    });

    // --- NODES ---
    const nodeSel = nodeGroup.selectAll(".node").data(nodes, d => d.id);
    
    nodeSel.exit().remove();
    
    const nodeEnter = nodeSel.enter()
        .append("g")
        .attr("class", "node")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    nodeEnter.append("circle").attr("r", 20);
    nodeEnter.append("text").text(d => d.id);
    
    nodeEnter.on("click", (event, d) => {
        event.stopPropagation();
        els.ctxMenu.style.display = 'none';

        if (currentTool === 'delete') {
            deleteNode(d);
        } 
        else if (currentTool === 'add-link') {
            if (!selectedNodeForLink) {
                selectedNodeForLink = d;
                highlightNode(d);
            } else {
                addLink(selectedNodeForLink, d);
                unhighlightNode(selectedNodeForLink);
                selectedNodeForLink = null;
            }
        } 
        else if (currentTool === 'select') {
            // Select for routing table
            d3.selectAll(".node").classed("selected", false);
            d3.select(event.currentTarget).classed("selected", true);
            selectedNodeForTable = d;
            updateRoutingTableUI();
        }
    });

    // --- DROPDOWNS ---
    updateDropdowns();
    
    simulation.alpha(1).restart();
}

function highlightNode(d) {
    d3.selectAll(".node").filter(n => n.id === d.id).select("circle").style("stroke", "#f59e0b");
}
function unhighlightNode(d) {
    d3.selectAll(".node").filter(n => n.id === d.id).select("circle").style("stroke", null);
}

function ticked() {
    // Keep nodes in bounds
    nodes.forEach(d => {
        d.x = Math.max(20, Math.min(width - 20, d.x));
        d.y = Math.max(20, Math.min(height - 20, d.y));
    });

    linkGroup.selectAll(".link-group line")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
        
    linkGroup.selectAll(".link-group rect")
        .attr("transform", d => `translate(${(d.source.x + d.target.x)/2}, ${(d.source.y + d.target.y)/2})`);
        
    linkGroup.selectAll(".link-group text")
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + d.target.y) / 2);

    nodeGroup.selectAll(".node")
        .attr("transform", d => `translate(${d.x},${d.y})`);
}

// Drag functions
function dragstarted(event, d) {
    if (currentTool !== 'select') return;
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    if (currentTool !== 'select') return;
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (currentTool !== 'select') return;
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function updateDropdowns() {
    let opts = `<option value="">Select...</option>`;
    nodes.forEach(n => opts += `<option value="${n.id}">${n.id}</option>`);
    
    const currSrc = els.srcSelect.value;
    const currDst = els.dstSelect.value;
    
    els.srcSelect.innerHTML = opts;
    els.dstSelect.innerHTML = opts;
    
    // Restore if still exists
    if(nodes.find(n=>n.id===currSrc)) els.srcSelect.value = currSrc;
    if(nodes.find(n=>n.id===currDst)) els.dstSelect.value = currDst;
    
    updateSendButtonState();
}

// ==========================================
// OSPF / DIJKSTRA LOGIC
// ==========================================

// Calculate global routing tables for all nodes
let globalRoutingTables = {};

function recalculateAll() {
    globalRoutingTables = {};
    nodes.forEach(n => {
        globalRoutingTables[n.id] = computeDijkstra(n.id);
    });
    
    // Show visual status
    els.statusLabel.innerHTML = '<i class="fas fa-sync fa-spin text-accent"></i> OSPF Converging...';
    setTimeout(() => {
        els.statusLabel.innerHTML = '<i class="fas fa-check-circle text-accent"></i> Network Stable';
    }, 500);

    updateRoutingTableUI();
}

function computeDijkstra(sourceId) {
    // Adjacency List
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    links.forEach(l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        adj[s].push({ node: t, weight: l.weight });
        adj[t].push({ node: s, weight: l.weight });
    });

    const dist = {};
    const nextHop = {};
    const prev = {};
    const unvisited = new Set();

    nodes.forEach(n => {
        dist[n.id] = Infinity;
        nextHop[n.id] = null;
        prev[n.id] = null;
        unvisited.add(n.id);
    });

    dist[sourceId] = 0;

    while (unvisited.size > 0) {
        // Find min dist node in unvisited
        let u = null;
        let minDist = Infinity;
        for (let nId of unvisited) {
            if (dist[nId] < minDist) {
                minDist = dist[nId];
                u = nId;
            }
        }

        if (u === null) break; // Remaining are unreachable
        unvisited.delete(u);

        for (let edge of adj[u]) {
            let v = edge.node;
            if (unvisited.has(v)) {
                let alt = dist[u] + edge.weight;
                if (alt < dist[v]) {
                    dist[v] = alt;
                    prev[v] = u;
                }
            }
        }
    }

    // Determine next hops by backtracking prev map
    nodes.forEach(n => {
        if (n.id === sourceId) {
            nextHop[n.id] = "Local";
        } else if (dist[n.id] === Infinity) {
            nextHop[n.id] = "Unreachable";
        } else {
            let curr = n.id;
            while (prev[curr] !== sourceId) {
                curr = prev[curr];
            }
            nextHop[n.id] = curr; // The first node on the path from source
        }
    });

    return { dist, nextHop };
}

function updateRoutingTableUI() {
    if (!selectedNodeForTable) {
        els.routerNameLabel.textContent = '';
        els.routingTableBody.innerHTML = `<tr><td colspan="3" class="empty-state">Select a router to view its OSPF table</td></tr>`;
        return;
    }

    els.routerNameLabel.textContent = `[${selectedNodeForTable.id}]`;
    const table = globalRoutingTables[selectedNodeForTable.id];
    
    if(!table) return;

    let html = '';
    
    // Sort destinations alphanumerically
    const sortedDests = nodes.map(n=>n.id).sort();

    sortedDests.forEach(destId => {
        if (destId === selectedNodeForTable.id) return; // Skip self

        const cost = table.dist[destId];
        const nh = table.nextHop[destId];

        const costDisplay = cost === Infinity ? '<span class="text-danger">∞</span>' : cost;
        const nhDisplay = cost === Infinity ? '-' : nh;

        html += `
            <tr>
                <td>${destId}</td>
                <td>${costDisplay}</td>
                <td>${nhDisplay}</td>
            </tr>
        `;
    });

    if (html === '') {
        html = `<tr><td colspan="3" class="empty-state">No other routers in topology</td></tr>`;
    }

    els.routingTableBody.innerHTML = html;
}

// ==========================================
// PACKET ANIMATION
// ==========================================

function sendPacket() {
    const srcId = els.srcSelect.value;
    const dstId = els.dstSelect.value;
    if (!srcId || !dstId) return;

    const table = globalRoutingTables[srcId];
    if (!table || table.dist[dstId] === Infinity) {
        console.warn("Alert:", "Destination is unreachable! No path exists.");
        return;
    }

    els.sendBtn.disabled = true;
    
    // Trace path
    let currentId = srcId;
    const pathIds = [currentId];

    while (currentId !== dstId) {
        const t = globalRoutingTables[currentId];
        const next = t.nextHop[dstId];
        if(!next || next === 'Unreachable') break;
        pathIds.push(next);
        currentId = next;
    }

    animatePath(pathIds, 0);
}

function animatePath(pathIds, index) {
    if (index >= pathIds.length - 1) {
        els.sendBtn.disabled = false;
        return; // Done
    }

    const n1 = nodes.find(n => n.id === pathIds[index]);
    const n2 = nodes.find(n => n.id === pathIds[index+1]);

    if (!n1 || !n2) {
        // Topology changed mid-flight; abort gracefully
        els.sendBtn.disabled = false;
        return;
    }

    const packet = packetGroup.append("circle")
        .attr("class", "packet")
        .attr("r", 6)
        .attr("cx", n1.x)
        .attr("cy", n1.y);

    packet.transition()
        .duration(800)
        .ease(d3.easeLinear)
        .attr("cx", n2.x)
        .attr("cy", n2.y)
        .on("end", () => {
            packet.remove();
            animatePath(pathIds, index + 1); // Jump to next hop
        });
}
