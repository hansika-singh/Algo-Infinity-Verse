/**
 * Algo-Infinity-Verse | BGP Route Hijacking Simulator
 * Simulates Path-Vector routing, BGP propagation, and Longest-Prefix Match hijacking.
 */

// Simulates a BGP Routing Information Base (RIB) entry
class RIBEntry {
    constructor(prefix, asPath, nextHop) {
        this.prefix = prefix;
        this.asPath = asPath; // Array of ASNs e.g., [200, 400]
        this.nextHop = nextHop; // Direct neighbor ASN
    }
}

class ASNode {
    constructor(asn, type, xPercent, yPercent) {
        this.asn = asn;
        this.type = type; // 'client', 'transit', 'target', 'attacker'
        this.xPercent = xPercent;
        this.yPercent = yPercent;
        
        this.x = 0;
        this.y = 0;
        
        this.neighbors = []; // Connected ASNs
        this.rib = new Map(); // prefix -> RIBEntry
        
        this.dom = null;
        this.flareDom = null;
    }

    addNeighbor(node) {
        if (!this.neighbors.includes(node)) this.neighbors.push(node);
        if (!node.neighbors.includes(this)) node.neighbors.push(this);
    }
}

class BGPSimulator {
    constructor() {
        this.canvas = document.getElementById('bgp-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodesLayer = document.getElementById('nodes-layer');
        
        // UI
        this.btnReset = document.getElementById('btn-reset');
        this.btnHijack = document.getElementById('btn-hijack');
        this.ribTable = document.getElementById('rib-table').querySelector('tbody');
        this.valLegit = document.getElementById('val-legit');
        this.valHijacked = document.getElementById('val-hijacked');
        this.statusText = document.getElementById('status-text');

        // State
        this.nodes = new Map();
        this.packets = [];
        this.isHijacked = false;
        
        this.stats = { legit: 0, hijacked: 0 };
        this.animationFrame = null;

        this.init();
    }

    init() {
        this.buildTopology();
        this.bindEvents();
        
        window.addEventListener('resize', () => {
            this.resize();
            this.updateNodePositions();
        });
        
        this.resize();
        this.updateNodePositions();
        
        // Start Normal State
        this.triggerBGPConvergence();
        this.startTrafficSimulation();
    }

    buildTopology() {
        // Create AS Nodes with responsive % coordinates
        const n100 = new ASNode(100, 'client', 15, 80);
        const n200 = new ASNode(200, 'transit', 35, 30);
        const n300 = new ASNode(300, 'transit', 45, 80);
        const n400 = new ASNode(400, 'target', 85, 50);
        const n666 = new ASNode(666, 'attacker', 15, 20);

        this.nodes.set(100, n100);
        this.nodes.set(200, n200);
        this.nodes.set(300, n300);
        this.nodes.set(400, n400);
        this.nodes.set(666, n666);

        // BGP Peering Links
        n100.addNeighbor(n200);
        n100.addNeighbor(n300);
        n200.addNeighbor(n400);
        n300.addNeighbor(n400);
        n666.addNeighbor(n200); // Attacker peers with Transit 200

        // Create DOM Elements
        this.nodes.forEach(node => {
            const div = document.createElement('div');
            div.className = `as-node node-${node.type}`;
            div.innerHTML = `
                <span class="as-title">AS</span>
                <span class="as-number">${node.asn}</span>
                <div class="bgp-flare"></div>
            `;
            this.nodesLayer.appendChild(div);
            node.dom = div;
            node.flareDom = div.querySelector('.bgp-flare');
        });
    }

    bindEvents() {
        this.btnReset.addEventListener('click', () => {
            this.isHijacked = false;
            this.nodes.get(666).dom.classList.remove('active');
            this.triggerBGPConvergence();
            this.logStatus("Normal Routing Restored. AS 666 withdrawn.", "text-success");
        });

        this.btnHijack.addEventListener('click', () => {
            this.isHijacked = true;
            this.nodes.get(666).dom.classList.add('active');
            this.triggerBGPConvergence();
            this.logStatus("WARNING: AS 666 announced hijacked prefix 10.0.0.0/24!", "text-danger");
        });
    }

    resize() {
        const wrapper = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = wrapper.clientWidth * dpr;
        this.canvas.height = wrapper.clientHeight * dpr;
        this.ctx.scale(dpr, dpr);
    }

    updateNodePositions() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        
        this.nodes.forEach(node => {
            node.x = (node.xPercent / 100) * w;
            node.y = (node.yPercent / 100) * h;
            node.dom.style.left = `${node.x}px`;
            node.dom.style.top = `${node.y}px`;
        });
    }

    /* --- BGP Protocol Simulation --- */

    triggerBGPConvergence() {
        // 1. Clear all Routing Information Bases
        this.nodes.forEach(n => n.rib.clear());

        // 2. Announce Origin Routes
        const queue = [];
        
        // Legitimate Origin
        const targetAS = this.nodes.get(400);
        targetAS.rib.set('10.0.0.0/16', new RIBEntry('10.0.0.0/16', [400], 400));
        queue.push({ node: targetAS, prefix: '10.0.0.0/16', path: [400] });
        
        // Malicious Origin
        if (this.isHijacked) {
            const attackerAS = this.nodes.get(666);
            // More specific prefix always wins in IP routing!
            attackerAS.rib.set('10.0.0.0/24', new RIBEntry('10.0.0.0/24', [666], 666));
            queue.push({ node: attackerAS, prefix: '10.0.0.0/24', path: [666] });
        }

        // 3. Propagate Updates (BFS)
        while (queue.length > 0) {
            const { node, prefix, path } = queue.shift();
            
            // Visual Flare
            node.flareDom.classList.remove('flare-anim');
            void node.flareDom.offsetWidth; // Trigger reflow
            node.flareDom.classList.add('flare-anim');

            node.neighbors.forEach(neighbor => {
                // Prevent routing loops (BGP Split Horizon / AS Path Loop Prevention)
                if (path.includes(neighbor.asn)) return;

                const newPath = [neighbor.asn, ...path];
                const existingEntry = neighbor.rib.get(prefix);

                // Update if no entry OR if new AS Path is shorter
                if (!existingEntry || newPath.length < existingEntry.asPath.length) {
                    neighbor.rib.set(prefix, new RIBEntry(prefix, newPath, node.asn));
                    queue.push({ node: neighbor, prefix: prefix, path: newPath });
                }
            });
        }

        this.updateRoutingTableUI();
    }

    // IP Longest Prefix Match Algorithm
    routePacket(currentNode, targetIP) {
        let bestMatch = null;
        let longestMask = -1;

        // Simplified mock IP matching
        currentNode.rib.forEach((entry, prefix) => {
            // In our simulation, targetIP is 10.0.0.55.
            // Both 10.0.0.0/16 and 10.0.0.0/24 match it.
            const mask = parseInt(prefix.split('/')[1]);
            if (mask > longestMask) {
                longestMask = mask;
                bestMatch = entry;
            }
        });

        return bestMatch ? bestMatch.nextHop : null;
    }

    updateRoutingTableUI() {
        const clientAS = this.nodes.get(100);
        this.ribTable.innerHTML = '';

        clientAS.rib.forEach((entry, prefix) => {
            const tr = document.createElement('tr');
            
            // Highlight the active route for our target 10.0.0.55
            const isActive = this.isHijacked ? prefix === '10.0.0.0/24' : prefix === '10.0.0.0/16';
            if (isActive) {
                tr.className = this.isHijacked ? 'row-hijack' : 'row-active';
            }

            tr.innerHTML = `
                <td>${prefix}</td>
                <td>[${entry.asPath.join(', ')}]</td>
                <td>AS ${entry.nextHop}</td>
            `;
            this.ribTable.appendChild(tr);
        });
    }

    logStatus(msg, className) {
        this.statusText.textContent = msg;
        this.statusText.className = `status-message ${className}`;
    }

    /* --- Traffic Rendering Engine --- */

    startTrafficSimulation() {
        // Spawn packets periodically
        setInterval(() => {
            this.packets.push({
                x: this.nodes.get(100).x,
                y: this.nodes.get(100).y,
                currentNode: 100,
                nextNode: this.routePacket(this.nodes.get(100), '10.0.0.55'),
                progress: 0,
                isHijacked: this.isHijacked
            });
        }, 400);

        this.renderLoop();
    }

    renderLoop() {
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);
        this.ctx.clearRect(0, 0, w, h);

        // Draw Links
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        
        const drawnLinks = new Set();
        this.nodes.forEach(node => {
            node.neighbors.forEach(neighbor => {
                const linkId = [node.asn, neighbor.asn].sort().join('-');
                if (!drawnLinks.has(linkId)) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(node.x, node.y);
                    this.ctx.lineTo(neighbor.x, neighbor.y);
                    this.ctx.stroke();
                    drawnLinks.add(linkId);
                }
            });
        });

        // Update & Draw Packets
        for (let i = this.packets.length - 1; i >= 0; i--) {
            let p = this.packets[i];
            
            if (!p.nextNode) {
                this.packets.splice(i, 1);
                continue;
            }

            const fromNode = this.nodes.get(p.currentNode);
            const toNode = this.nodes.get(p.nextNode);

            p.progress += 0.02; // Speed

            if (p.progress >= 1) {
                p.currentNode = p.nextNode;
                p.progress = 0;
                
                // Check if reached destination
                if (p.currentNode === 400) {
                    this.stats.legit++;
                    this.valLegit.textContent = this.stats.legit;
                    this.packets.splice(i, 1);
                    continue;
                } else if (p.currentNode === 666) {
                    this.stats.hijacked++;
                    this.valHijacked.textContent = this.stats.hijacked;
                    this.packets.splice(i, 1);
                    continue;
                }

                // Route next hop
                p.nextNode = this.routePacket(this.nodes.get(p.currentNode), '10.0.0.55');
            } else {
                // Draw
                const cx = fromNode.x + (toNode.x - fromNode.x) * p.progress;
                const cy = fromNode.y + (toNode.y - fromNode.y) * p.progress;
                
                this.ctx.beginPath();
                this.ctx.arc(cx, cy, 5, 0, Math.PI * 2);
                
                if (p.isHijacked) {
                    this.ctx.fillStyle = '#f43f5e'; // Red
                    this.ctx.shadowColor = '#f43f5e';
                } else {
                    this.ctx.fillStyle = '#10b981'; // Green
                    this.ctx.shadowColor = '#10b981';
                }
                
                this.ctx.shadowBlur = 10;
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        }

        requestAnimationFrame(() => this.renderLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BGPSimulator();
});
