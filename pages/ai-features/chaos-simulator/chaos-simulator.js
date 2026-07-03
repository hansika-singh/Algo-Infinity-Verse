/**
 * chaos-simulator.js
 * A high-performance Vanilla JS physics engine representing a Directed Acyclic Graph (DAG).
 * Handles traffic generation, dynamic load balancing, capacity constraints, and Chaos Monkey node destruction.
 */

document.addEventListener("DOMContentLoaded", () => {
    initSimulator();
});

// --- State Management ---
const state = {
    isRunning: false,
    trafficRate: 50, // Packets generated per second
    lastSpawnTime: 0,
    nodes: {},
    edges: [],
    packets: [],
    animationFrameId: null
};

// --- DOM Elements ---
const els = {
    canvas: document.getElementById('canvas'),
    svgLayer: document.getElementById('svgLayer'),
    packetLayer: document.getElementById('packetLayer'),
    btnPlay: document.getElementById('btnPlay'),
    btnPause: document.getElementById('btnPause'),
    btnChaos: document.getElementById('btnChaos'),
    btnReset: document.getElementById('btnReset'),
    trafficSlider: document.getElementById('trafficSlider'),
    trafficValue: document.getElementById('trafficValue'),
    simStatusDot: document.getElementById('simStatusDot'),
    simStatusText: document.getElementById('simStatusText')
};

function initSimulator() {
    buildGraph();
    drawEdges();
    setupEventListeners();
    updateLoop(); // Start physics loop (idling)
}

function buildGraph() {
    // 1. Initialize Nodes from DOM
    document.querySelectorAll('.node').forEach(el => {
        state.nodes[el.id] = {
            id: el.id,
            el: el,
            type: el.dataset.type,
            maxCapacity: parseFloat(el.dataset.capacity),
            currentLoad: 0, // Number of packets currently processing
            isAlive: true,
            x: el.offsetLeft + el.offsetWidth / 2,
            y: el.offsetTop + el.offsetHeight / 2,
            // LB Specific
            lastRoutedIndex: 0 
        };
    });

    // 2. Define the Directed Acyclic Graph (DAG) Edges
    const connections = [
        { from: 'node-client', to: 'node-lb' },
        { from: 'node-lb', to: 'node-web1' },
        { from: 'node-lb', to: 'node-web2' },
        { from: 'node-lb', to: 'node-web3' },
        { from: 'node-web1', to: 'node-db' },
        { from: 'node-web2', to: 'node-db' },
        { from: 'node-web3', to: 'node-db' }
    ];

    connections.forEach(conn => {
        const fromNode = state.nodes[conn.from];
        const toNode = state.nodes[conn.to];
        
        // Create SVG Path Element
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.classList.add('path-line');
        els.svgLayer.appendChild(path);

        state.edges.push({
            from: fromNode,
            to: toNode,
            pathEl: path,
            length: 0 // Calculated in drawEdges
        });
    });
}

// Draws the curved SVG lines between connected nodes
function drawEdges() {
    state.edges.forEach(edge => {
        const dx = edge.to.x - edge.from.x;
        const dy = edge.to.y - edge.from.y;
        
        // Bezier curve control points for smooth flow
        const d = `M ${edge.from.x} ${edge.from.y} C ${edge.from.x + dx/2} ${edge.from.y}, ${edge.from.x + dx/2} ${edge.to.y}, ${edge.to.x} ${edge.to.y}`;
        edge.pathEl.setAttribute('d', d);
        edge.length = edge.pathEl.getTotalLength();
    });
}

function setupEventListeners() {
    els.btnPlay.addEventListener('click', () => {
        state.isRunning = true;
        els.simStatusDot.className = 'dot active';
        els.simStatusText.textContent = 'Traffic Flowing';
    });
    
    els.btnPause.addEventListener('click', () => {
        state.isRunning = false;
        els.simStatusDot.className = 'dot';
        els.simStatusText.textContent = 'Paused';
    });

    els.trafficSlider.addEventListener('input', (e) => {
        state.trafficRate = parseInt(e.target.value);
        els.trafficValue.textContent = state.trafficRate;
    });

    els.btnChaos.addEventListener('click', unleashChaosMonkey);
    els.btnReset.addEventListener('click', () => location.reload());
}

// --- CORE PHYSICS & ROUTING LOOP ---

function updateLoop(timestamp) {
    if (state.isRunning) {
        generateTraffic(timestamp);
        updatePackets();
        updateNodeCapacities();
    }
    state.animationFrameId = requestAnimationFrame(updateLoop);
}

function generateTraffic(timestamp) {
    // Determine how much time passed since last spawn
    const timeBetweenSpawns = 1000 / state.trafficRate;
    
    if (timestamp - state.lastSpawnTime > timeBetweenSpawns) {
        // Find path from Client to LB
        const edge = state.edges.find(e => e.from.type === 'client');
        if (edge) spawnPacket(edge);
        
        state.lastSpawnTime = timestamp;
    }
}

function spawnPacket(edge) {
    const packetEl = document.createElement('div');
    packetEl.className = 'packet';
    els.packetLayer.appendChild(packetEl);

    state.packets.push({
        el: packetEl,
        edge: edge,
        progress: 0,   // Distance traveled along SVG path
        speed: 3 + (Math.random() * 2), // Pixels per frame
        isDropped: false
    });
}

function updatePackets() {
    for (let i = state.packets.length - 1; i >= 0; i--) {
        const p = state.packets[i];

        if (p.isDropped) {
            // Remove dropped packet after short delay
            p.el.style.opacity = parseFloat(p.el.style.opacity || 1) - 0.05;
            if (p.el.style.opacity <= 0) removePacket(i);
            continue;
        }

        p.progress += p.speed;

        if (p.progress >= p.edge.length) {
            // Packet reached destination node
            handlePacketArrival(p, i);
        } else {
            // Move packet along SVG path
            const point = p.edge.pathEl.getPointAtLength(p.progress);
            p.el.style.transform = `translate(${point.x}px, ${point.y}px)`;
        }
    }
}

function handlePacketArrival(packet, index) {
    const targetNode = packet.edge.to;

    // 1. Is Node Dead?
    if (!targetNode.isAlive) {
        dropPacket(packet);
        return;
    }

    // 2. Add Load to Node
    targetNode.currentLoad += 1;

    // Simulate processing time (frees up capacity after 500ms)
    setTimeout(() => {
        if (targetNode.currentLoad > 0) targetNode.currentLoad -= 1;
    }, 500);

    // 3. Did it Exceed Capacity?
    if (targetNode.currentLoad > targetNode.maxCapacity) {
        dropPacket(packet);
        return;
    }

    // 4. Route to next tier (Graph Traversal)
    removePacket(index); // Consume current visual packet

    const outboundEdges = state.edges.filter(e => e.from.id === targetNode.id);
    
    if (outboundEdges.length > 0) {
        let nextEdge = null;

        // Load Balancer Routing Logic (Round Robin across ALIVE nodes)
        if (targetNode.type === 'lb') {
            const validEdges = outboundEdges.filter(e => e.to.isAlive);
            if (validEdges.length > 0) {
                targetNode.lastRoutedIndex = (targetNode.lastRoutedIndex + 1) % validEdges.length;
                nextEdge = validEdges[targetNode.lastRoutedIndex];
            }
        } 
        // Standard Server -> DB Routing
        else {
            nextEdge = outboundEdges[0];
        }

        if (nextEdge) spawnPacket(nextEdge);
    }
}

function dropPacket(packet) {
    packet.isDropped = true;
    packet.el.classList.add('dropped');
}

function removePacket(index) {
    els.packetLayer.removeChild(state.packets[index].el);
    state.packets.splice(index, 1);
}

// Visualizes node load dynamically (Green -> Yellow -> Red)
function updateNodeCapacities() {
    Object.values(state.nodes).forEach(node => {
        if (node.type === 'client' || !node.isAlive) return;

        const loadPercentage = (node.currentLoad / node.maxCapacity) * 100;
        const fillEl = document.getElementById(`load-${node.id.replace('node-', '')}`);
        
        node.el.className = 'node'; // Reset

        if (fillEl) {
            fillEl.style.width = `${Math.min(loadPercentage, 100)}%`;
            
            if (loadPercentage < 60) {
                fillEl.style.backgroundColor = 'var(--status-healthy)';
                node.el.classList.add('healthy');
            } else if (loadPercentage < 90) {
                fillEl.style.backgroundColor = 'var(--status-warning)';
                node.el.classList.add('warning');
            } else {
                fillEl.style.backgroundColor = 'var(--status-danger)';
                node.el.classList.add('overloaded');
            }
        }
    });
}

// --- THE CHAOS MONKEY ---
function unleashChaosMonkey() {
    // Find active backend servers or databases
    const vulnerableNodes = Object.values(state.nodes).filter(n => 
        (n.type === 'server' || n.type === 'db') && n.isAlive
    );

    if (vulnerableNodes.length === 0) return;

    // Pick random node to destroy
    const victim = vulnerableNodes[Math.floor(Math.random() * vulnerableNodes.length)];
    
    victim.isAlive = false;
    victim.currentLoad = 0;
    victim.el.className = 'node dead';
    
    // Update Load Bar to 0
    const fillEl = document.getElementById(`load-${victim.id.replace('node-', '')}`);
    if (fillEl) fillEl.style.width = '0%';

    // UI Feedback
    els.simStatusDot.className = 'dot chaos';
    els.simStatusText.textContent = `Chaos Monkey destroyed ${victim.el.querySelector('.node-name').textContent}!`;
    
    setTimeout(() => {
        if(state.isRunning) {
            els.simStatusDot.className = 'dot active';
            els.simStatusText.textContent = 'Traffic Flowing (Rerouting...)';
        }
    }, 2000);
}
