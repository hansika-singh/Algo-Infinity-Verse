// stp-simulator.js

const canvas = document.getElementById('stpCanvas');
const ctx = canvas.getContext('2d');
const logContainer = document.getElementById('simLog');

let width, height;
let nodes = [];
let links = [];
let animationFrame;
let simInterval;

// Theme colors
function getColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#1a1a1a' : '#ffffff',
        text: isDark ? '#ffffff' : '#333333',
        nodeBg: isDark ? '#333333' : '#f5f5f5',
        nodeBorder: isDark ? '#666666' : '#cccccc',
        linkActive: isDark ? '#666666' : '#999999',
        linkFailed: '#F44336',
        rootBridge: isDark ? '#81c784' : '#4CAF50',
        rootPort: isDark ? '#64b5f6' : '#2196F3',
        designatedPort: isDark ? '#ffd54f' : '#FFC107',
        blockedPort: isDark ? '#e57373' : '#F44336',
    };
}

// Logging
function log(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString([], {hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit'});
    el.textContent = `[${time}] ${msg}`;
    logContainer.appendChild(el);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function initTopology() {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;

    // Create 5 switches
    const radius = Math.min(width, height) * 0.35;
    const cx = width / 2;
    const cy = height / 2;

    const macs = ['00:11:22:33:44:01', '00:11:22:33:44:02', '00:11:22:33:44:03', '00:11:22:33:44:04', '00:11:22:33:44:05'];
    // Randomize priorities (multiples of 4096)
    const priorities = [32768, 32768, 32768, 4096, 32768].sort(() => Math.random() - 0.5);

    nodes = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        nodes.push({
            id: i,
            mac: macs[i],
            priority: priorities[i],
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
            // STP State
            rootBridgeId: `${priorities[i]}.${macs[i]}`,
            rootPathCost: 0,
            nextHop: null,
            ports: [] // Will hold port roles
        });
    }

    // Connect them with redundant links
    links = [
        { id: 'l1', source: 0, target: 1, cost: 19, active: true },
        { id: 'l2', source: 1, target: 2, cost: 19, active: true },
        { id: 'l3', source: 2, target: 3, cost: 19, active: true },
        { id: 'l4', source: 3, target: 4, cost: 19, active: true },
        { id: 'l5', source: 4, target: 0, cost: 19, active: true },
        { id: 'l6', source: 0, target: 2, cost: 19, active: true },
        { id: 'l7', source: 1, target: 4, cost: 19, active: true }
    ];

    // Initialize ports
    nodes.forEach(n => {
        links.forEach(l => {
            if (l.source === n.id || l.target === n.id) {
                const neighborId = l.source === n.id ? l.target : l.source;
                n.ports.push({ linkId: l.id, neighborId, role: 'designated', blocked: false });
            }
        });
    });

    logContainer.innerHTML = '';
    log('Topology initialized. All switches claim to be Root.', 'info');
    draw();
}

function getBridgeId(node) {
    return `${node.priority}.${node.mac}`;
}

function compareBridgeIds(id1, id2) {
    // format: PRIORITY.MAC
    const [p1, m1] = id1.split('.');
    const [p2, m2] = id2.split('.');
    if (parseInt(p1) !== parseInt(p2)) return parseInt(p1) - parseInt(p2);
    return m1.localeCompare(m2);
}

// One step of BPDU exchange
function stepSTP() {
    let changed = false;
    let bpdusSent = 0;

    // Simulate sending BPDUs to neighbors
    const newStates = nodes.map(n => ({
        rootBridgeId: n.rootBridgeId,
        rootPathCost: n.rootPathCost,
        nextHop: n.nextHop
    }));

    nodes.forEach((node, i) => {
        // Send BPDU to neighbors
        node.ports.forEach(port => {
            const link = links.find(l => l.id === port.linkId);
            if (!link.active) return;

            const neighborIndex = port.neighborId;
            const neighbor = nodes[neighborIndex];
            const proposedCost = node.rootPathCost + link.cost;

            // BPDU: { rootBridgeId, cost, senderId }
            let updateNeighbor = false;
            if (compareBridgeIds(node.rootBridgeId, newStates[neighborIndex].rootBridgeId) < 0) {
                updateNeighbor = true;
            } else if (node.rootBridgeId === newStates[neighborIndex].rootBridgeId && proposedCost < newStates[neighborIndex].rootPathCost) {
                updateNeighbor = true;
            } else if (node.rootBridgeId === newStates[neighborIndex].rootBridgeId && proposedCost === newStates[neighborIndex].rootPathCost) {
                if (compareBridgeIds(getBridgeId(node), getBridgeId(neighbor)) < 0) {
                    // Tie breaker on sender ID (usually not nextHop change if already better, but simplified here)
                }
            }

            if (updateNeighbor) {
                newStates[neighborIndex].rootBridgeId = node.rootBridgeId;
                newStates[neighborIndex].rootPathCost = proposedCost;
                newStates[neighborIndex].nextHop = node.id;
                changed = true;
                bpdusSent++;
            }
        });
    });

    // Apply new states
    nodes.forEach((n, i) => {
        n.rootBridgeId = newStates[i].rootBridgeId;
        n.rootPathCost = newStates[i].rootPathCost;
        n.nextHop = newStates[i].nextHop;
    });

    if (bpdusSent > 0) {
        log(`Exchanged BPDUs. Topology updating...`, 'bpdu');
    }

    resolvePorts();
    draw();

    return changed;
}

function resolvePorts() {
    // 1. Identify Root Bridge
    let currentRoot = nodes[0].rootBridgeId;
    nodes.forEach(n => {
        if (compareBridgeIds(n.rootBridgeId, currentRoot) < 0) {
            currentRoot = n.rootBridgeId;
        }
    });

    const rootNode = nodes.find(n => getBridgeId(n) === currentRoot);

    // 2. Set Port Roles
    nodes.forEach(node => {
        node.ports.forEach(port => port.role = 'designated'); // default

        if (node === rootNode) {
            node.ports.forEach(port => { port.role = 'designated'; port.blocked = false; });
            return;
        }

        // Find Root Port
        const rootPort = node.ports.find(p => p.neighborId === node.nextHop);
        if (rootPort) {
            rootPort.role = 'root';
            rootPort.blocked = false;
        }
    });

    // 3. Resolve Designated vs Blocked per link
    links.forEach(link => {
        if (!link.active) return;
        const n1 = nodes.find(n => n.id === link.source);
        const n2 = nodes.find(n => n.id === link.target);

        const p1 = n1.ports.find(p => p.linkId === link.id);
        const p2 = n2.ports.find(p => p.linkId === link.id);

        if (p1.role === 'root' && p2.role === 'root') {
            // Should not happen, but safeguard
        } else if (p1.role === 'root') {
            p2.role = 'designated';
            p2.blocked = false;
        } else if (p2.role === 'root') {
            p1.role = 'designated';
            p1.blocked = false;
        } else {
            // Both are designated initially, one must block
            // Tie breaker: lowest cost to root, then lowest bridge ID
            let block1 = false;
            if (n1.rootPathCost > n2.rootPathCost) block1 = true;
            else if (n1.rootPathCost < n2.rootPathCost) block1 = false;
            else {
                if (compareBridgeIds(getBridgeId(n1), getBridgeId(n2)) > 0) block1 = true;
            }

            if (block1) {
                p1.role = 'blocked';
                p1.blocked = true;
                p2.role = 'designated';
                p2.blocked = false;
            } else {
                p2.role = 'blocked';
                p2.blocked = true;
                p1.role = 'designated';
                p1.blocked = false;
            }
        }
    });

    if (rootNode) {
        log(`Root Bridge elected: ${rootNode.mac} (Pri: ${rootNode.priority})`, 'root');
    }
}

function failLink(link) {
    if (!link.active) return;
    link.active = false;
    log(`Link ${link.source}-${link.target} FAILED!`, 'fail');
    
    // Reset network state partially to force reconvergence
    nodes.forEach(n => {
        n.rootBridgeId = getBridgeId(n);
        n.rootPathCost = 0;
        n.nextHop = null;
    });
    
    draw();
    if(simInterval) {
        clearInterval(simInterval);
        simInterval = setInterval(() => {
            if (!stepSTP()) {
                clearInterval(simInterval);
                simInterval = null;
                log('Topology converged.', 'info');
            }
        }, 800);
    } else {
        stepSTP();
    }
}

function draw() {
    const c = getColors();
    ctx.clearRect(0, 0, width, height);

    // Draw links
    links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.lineWidth = 4;
        ctx.strokeStyle = link.active ? c.linkActive : c.linkFailed;
        if (!link.active) ctx.setLineDash([5, 5]);
        else ctx.setLineDash([]);
        ctx.stroke();

        // Draw ports on link ends if active
        if (link.active) {
            const p1 = source.ports.find(p => p.linkId === link.id);
            const p2 = target.ports.find(p => p.linkId === link.id);

            const drawPort = (node, pInfo, tNode) => {
                const dx = tNode.x - node.x;
                const dy = tNode.y - node.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const px = node.x + (dx/dist) * 35;
                const py = node.y + (dy/dist) * 35;

                ctx.beginPath();
                ctx.arc(px, py, 8, 0, 2*Math.PI);
                if (pInfo.role === 'root') ctx.fillStyle = c.rootPort;
                else if (pInfo.role === 'designated') ctx.fillStyle = c.designatedPort;
                else ctx.fillStyle = c.blockedPort;
                ctx.fill();
                ctx.strokeStyle = c.bg;
                ctx.lineWidth = 2;
                ctx.stroke();
            };

            drawPort(source, p1, target);
            drawPort(target, p2, source);
        }
    });
    ctx.setLineDash([]);

    // Draw nodes
    nodes.forEach(node => {
        const isRoot = getBridgeId(node) === node.rootBridgeId && node.rootPathCost === 0;

        ctx.beginPath();
        ctx.arc(node.x, node.y, 25, 0, 2*Math.PI);
        ctx.fillStyle = isRoot ? c.rootBridge : c.nodeBg;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = isRoot ? c.bg : c.nodeBorder;
        ctx.stroke();

        // Text
        ctx.fillStyle = isRoot ? '#fff' : c.text;
        ctx.font = '10px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText(`Pri: ${node.priority}`, node.x, node.y - 4);
        ctx.fillText(node.mac.substring(12), node.x, node.y + 10);
    });
}

// Interaction
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check link clicks
    links.forEach(link => {
        if (!link.active) return;
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);
        
        // Distance to line segment
        const l2 = Math.pow(source.x - target.x, 2) + Math.pow(source.y - target.y, 2);
        let t = ((x - source.x) * (target.x - source.x) + (y - source.y) * (target.y - source.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const px = source.x + t * (target.x - source.x);
        const py = source.y + t * (target.y - source.y);
        const dist = Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2));

        if (dist < 10) {
            failLink(link);
        }
    });
});

document.getElementById('btnReset').addEventListener('click', () => {
    if(simInterval) { clearInterval(simInterval); simInterval = null; }
    initTopology();
});

document.getElementById('btnStep').addEventListener('click', () => {
    if(simInterval) { clearInterval(simInterval); simInterval = null; }
    const changed = stepSTP();
    if (!changed) log('Topology is stable.', 'info');
});

document.getElementById('btnPlay').addEventListener('click', () => {
    if(simInterval) clearInterval(simInterval);
    simInterval = setInterval(() => {
        const changed = stepSTP();
        if (!changed) {
            clearInterval(simInterval);
            simInterval = null;
            log('Topology converged.', 'info');
        }
    }, 800);
});

// Observe theme changes
const observer = new MutationObserver(() => draw());
observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

window.addEventListener('resize', () => {
    const oldW = width, oldH = height;
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
    nodes.forEach(n => {
        n.x = (n.x / oldW) * width;
        n.y = (n.y / oldH) * height;
    });
    draw();
});

initTopology();
