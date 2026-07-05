/**
 * Push-Relabel Maximum Flow Engine
 * @description Enterprise-grade implementation mapping exact network topography
 * with an interactive state-machine executor and native Canvas rendering.
 */

// --- Constants & Global State ---
const COLORS = {
    bg: '#13151f',             
    nodeBase: '#1e293b',         /* Slate */
    nodeActive: '#06b6d4',       /* Neon Cyan */
    nodeSource: '#a855f7',       /* Neon Purple */
    nodeSink: '#06b6d4',         /* Neon Cyan */
    nodeFinished: '#0f766e',     /* Dark Teal */
    textMain: '#ffffff',
    textMuted: '#8b949e',
    edgeEmpty: '#334155',
    edgeFlow: '#a855f7',         /* Flow matches the purple brand accent */
    edgeFull: '#06b6d4',         /* Saturated edges glow cyan */
    particle: '#ffffff',
    glassBorder: 'rgba(255, 255, 255, 0.06)'
};

const NODE_RADIUS = 22;
let animationId = null;

// --- Data Structures ---
class Node {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.height = 0;
        this.excess = 0;
        this.isSource = false;
        this.isSink = false;
    }
}

class Edge {
    constructor(u, v, capacity) {
        this.u = u;
        this.v = v;
        this.capacity = capacity;
        this.flow = 0;
    }
}

// --- Application Core ---
class PushRelabelVisualizer {
    constructor() {
        this.canvas = document.getElementById('viz-canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.nodes = new Map();
        this.edges = [];
        this.nodeIdCounter = 0;
        
        // Editor State
        this.isEditing = true;
        this.dragStartNode = null;
        this.mousePos = { x: 0, y: 0 };
        this.sourceId = null;
        this.sinkId = null;

        // Algorithm State
        this.generator = null;
        this.animating = false;
        this.particles = [];
        this.currentLine = null;
        this.stats = { u: null, op: null, edge: null };

        this.initDOM();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.bindEvents();
        
        // Setup initial default graph
        this.generateRandomGraph();
        this.renderLoop();
    }

    // --- System UI Integration ---
    initDOM() {
        this.statusTxt = document.querySelector('.status');
        this.btnPlay = document.getElementById('btn-play');
        this.btnStep = document.getElementById('btn-step');
        this.btnReset = document.getElementById('btn-reset');
        this.editorHint = document.getElementById('editor-hint');
        this.weightEditor = document.getElementById('weight-editor');
        this.weightInput = document.getElementById('edge-capacity');
        this.btnSaveWeight = document.getElementById('btn-save-weight');
        this.editingEdge = null;
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    setStatus(msg) {
        this.statusTxt.innerText = msg;
    }

    updateTelemetry() {
        const u = this.stats.u ? this.nodes.get(this.stats.u) : null;
        document.getElementById('stat-active').innerText = u ? `Node ${u.id}` : '—';
        document.getElementById('stat-op').innerText = this.stats.op || '—';
        document.getElementById('stat-excess').innerText = u ? u.excess : '0';
        document.getElementById('stat-height').innerText = u ? u.height : '0';
        document.getElementById('stat-edge').innerText = this.stats.edge || '—';
        
        let maxFlow = 0;
        if (this.sinkId && this.nodes.has(this.sinkId)) {
            maxFlow = this.nodes.get(this.sinkId).excess;
        }
        document.getElementById('stat-maxflow').innerText = maxFlow;
    }

    highlightCode(lineId) {
        if (this.currentLine) {
            document.getElementById(this.currentLine)?.classList.remove('active');
        }
        if (lineId) {
            document.getElementById(lineId)?.classList.add('active');
            this.currentLine = lineId;
        }
    }

    // --- Graph Editing ---
    bindEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        
        this.btnSaveWeight.addEventListener('click', () => {
            if (this.editingEdge) {
                const val = parseInt(this.weightInput.value, 10);
                if (!isNaN(val) && val > 0) this.editingEdge.capacity = val;
                this.weightEditor.classList.add('hidden');
                this.editingEdge = null;
            }
        });

        document.getElementById('btn-random').addEventListener('click', () => {
            if (this.isEditing) this.generateRandomGraph();
        });
        document.getElementById('btn-clear').addEventListener('click', () => {
            if (this.isEditing) {
                this.nodes.clear();
                this.edges = [];
                this.sourceId = null;
                this.sinkId = null;
                this.nodeIdCounter = 0;
            }
        });
        
        this.btnPlay.addEventListener('click', () => this.togglePlay());
        this.btnStep.addEventListener('click', () => this.step());
        this.btnReset.addEventListener('click', () => this.resetAlgorithm());
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    getHoveredNode(pos) {
        for (let [id, node] of this.nodes) {
            const dx = pos.x - node.x;
            const dy = pos.y - node.y;
            if (dx * dx + dy * dy < NODE_RADIUS * NODE_RADIUS) return node;
        }
        return null;
    }

    getHoveredEdge(pos) {
        for (let edge of this.edges) {
            const u = this.nodes.get(edge.u);
            const v = this.nodes.get(edge.v);
            const dist = this.distToSegmentSquared(pos, u, v);
            if (dist < 100) return edge;
        }
        return null;
    }

    distToSegmentSquared(p, v, w) {
        const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
        if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return (p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2;
    }

    handleMouseDown(e) {
        if (!this.isEditing) return;
        const pos = this.getMousePos(e);
        const clickedNode = this.getHoveredNode(pos);
        
        if (clickedNode) {
            this.dragStartNode = clickedNode;
        } else {
            // Check if edge clicked to hide editor
            this.weightEditor.classList.add('hidden');
        }
    }

    handleMouseMove(e) {
        this.mousePos = this.getMousePos(e);
    }

    handleMouseUp(e) {
        if (!this.isEditing) return;
        const pos = this.getMousePos(e);
        const clickedNode = this.getHoveredNode(pos);

        if (this.dragStartNode) {
            if (clickedNode && clickedNode !== this.dragStartNode) {
                // Add Edge
                const existing = this.edges.find(e => e.u === this.dragStartNode.id && e.v === clickedNode.id);
                if (!existing) {
                    const capacity = parseInt(Math.random() * 15 + 5, 10);
                    this.edges.push(new Edge(this.dragStartNode.id, clickedNode.id, capacity));
                }
            }
            this.dragStartNode = null;
        } else if (!clickedNode && !this.getHoveredEdge(pos)) {
            // Add Node
            const id = this.nodeIdCounter++;
            const node = new Node(id, pos.x, pos.y);
            if (!this.sourceId) { node.isSource = true; this.sourceId = id; }
            else if (!this.sinkId) { node.isSink = true; this.sinkId = id; }
            this.nodes.set(id, node);
        }
    }

    handleDoubleClick(e) {
        if (!this.isEditing) return;
        const pos = this.getMousePos(e);
        const edge = this.getHoveredEdge(pos);
        const node = this.getHoveredNode(pos);

        if (edge) {
            this.editingEdge = edge;
            this.weightInput.value = edge.capacity;
            this.weightEditor.style.left = `${pos.x}px`;
            this.weightEditor.style.top = `${pos.y}px`;
            this.weightEditor.classList.remove('hidden');
            this.weightInput.focus();
        } else if (node) {
            // Toggle S/T roles
            if (node.isSource) { node.isSource = false; this.sourceId = null; }
            else if (node.isSink) { node.isSink = false; this.sinkId = null; }
            else if (!this.sourceId) { node.isSource = true; this.sourceId = node.id; }
            else if (!this.sinkId) { node.isSink = true; this.sinkId = node.id; }
        }
    }

    generateRandomGraph() {
        this.nodes.clear();
        this.edges = [];
        this.nodeIdCounter = 0;
        
        const w = this.canvas.width || 800;
        const h = this.canvas.height || 600;
        
        // S and T
        const s = new Node(this.nodeIdCounter++, 100, h / 2); s.isSource = true; this.sourceId = s.id;
        const t = new Node(this.nodeIdCounter++, w - 100, h / 2); t.isSink = true; this.sinkId = t.id;
        this.nodes.set(s.id, s);
        this.nodes.set(t.id, t);

        // Intermediaries
        const layers = 3, nodesPerLayer = 2;
        const layerWidth = (w - 300) / (layers + 1);
        const mNodes = [];
        
        for(let i=0; i<layers; i++) {
            let col = [];
            for(let j=0; j<nodesPerLayer; j++) {
                const node = new Node(this.nodeIdCounter++, 200 + i * layerWidth + (Math.random()*40-20), (h/4) + j * (h/3) + (Math.random()*40-20));
                this.nodes.set(node.id, node);
                col.push(node);
                mNodes.push(node);
            }
        }

        // Connect S to Layer 0
        mNodes.slice(0, nodesPerLayer).forEach(n => this.edges.push(new Edge(s.id, n.id, parseInt(Math.random()*15+10, 10))));
        // Connect Layer N to T
        mNodes.slice(-nodesPerLayer).forEach(n => this.edges.push(new Edge(n.id, t.id, parseInt(Math.random()*15+10, 10))));
        // Random internal edges
        for (let i = 0; i < mNodes.length - 1; i++) {
            for (let j = i + 1; j < mNodes.length; j++) {
                if (mNodes[i].x < mNodes[j].x && Math.random() > 0.4) {
                    this.edges.push(new Edge(mNodes[i].id, mNodes[j].id, parseInt(Math.random()*10+5, 10)));
                }
            }
        }
    }

    // --- Push Relabel Algorithm Core ---
    *algorithmGenerator() {
        if (this.sourceId === null || this.sinkId === null) {
            alert("Please designate a Source (S) and Sink (T) by double clicking nodes.");
            return;
        }

        this.highlightCode('line-init-h');
        this.stats.op = "Initialize Heights";
        this.updateTelemetry();
        
        // 1. Init Heights
        const S = this.nodes.get(this.sourceId);
        S.height = this.nodes.size;
        yield true; // Pause

        this.highlightCode('line-init-f');
        this.stats.op = "Initialize Preflow";
        this.updateTelemetry();

        // 2. Init Preflow
        for (let edge of this.edges) {
            if (edge.u === this.sourceId) {
                edge.flow = edge.capacity;
                const v = this.nodes.get(edge.v);
                v.excess += edge.flow;
                S.excess -= edge.flow;
                this.spawnParticles(S, v, edge.flow);
            }
        }
        yield true;

        // Main Loop
        while (true) {
            this.highlightCode('line-while');
            // Find active node (excess > 0, not S, not T)
            let uNode = null;
            for (let [id, node] of this.nodes) {
                if (id !== this.sourceId && id !== this.sinkId && node.excess > 0) {
                    uNode = node;
                    break;
                }
            }

            if (!uNode) break; // Finished

            this.stats.u = uNode.id;
            this.stats.op = "Select Active Vertex";
            this.stats.edge = "—";
            this.updateTelemetry();
            yield true;

            this.highlightCode('line-find');
            this.stats.op = "Find Admissible Edge";
            this.updateTelemetry();
            yield true;

            // Find Admissible Edge
            let pushed = false;
            
            // Forward and Reverse edges view
            let adjEdges = [];
            for (let edge of this.edges) {
                if (edge.u === uNode.id) adjEdges.push({ edge, isForward: true, vId: edge.v });
                if (edge.v === uNode.id) adjEdges.push({ edge, isForward: false, vId: edge.u });
            }

            for (let adj of adjEdges) {
                const vNode = this.nodes.get(adj.vId);
                const residualCap = adj.isForward ? (adj.edge.capacity - adj.edge.flow) : adj.edge.flow;

                if (residualCap > 0 && uNode.height === vNode.height + 1) {
                    // PUSH
                    this.highlightCode('line-push');
                    const delta = Math.min(uNode.excess, residualCap);
                    this.stats.op = `Push ${delta}`;
                    this.stats.edge = `${uNode.id} → ${vNode.id}`;
                    this.updateTelemetry();
                    
                    if (adj.isForward) adj.edge.flow += delta;
                    else adj.edge.flow -= delta;

                    uNode.excess -= delta;
                    vNode.excess += delta;
                    
                    this.spawnParticles(uNode, vNode, delta);
                    pushed = true;
                    yield true;
                    break; // Only one push per loop iteration to visualize clearly
                }
            }

            if (!pushed) {
                // RELABEL
                this.highlightCode('line-relabel');
                this.stats.op = `Relabel`;
                this.stats.edge = `—`;
                
                let minH = Infinity;
                for (let adj of adjEdges) {
                    const vNode = this.nodes.get(adj.vId);
                    const residualCap = adj.isForward ? (adj.edge.capacity - adj.edge.flow) : adj.edge.flow;
                    if (residualCap > 0) {
                        minH = Math.min(minH, vNode.height);
                    }
                }
                
                if (minH !== Infinity) {
                    uNode.height = minH + 1;
                }
                this.updateTelemetry();
                yield true;
            }
        }

        // Done
        this.highlightCode('line-done');
        this.stats.u = null;
        this.stats.op = "Algorithm Complete";
        this.updateTelemetry();
        this.setStatus(`Status: Finished | Max Flow: ${document.getElementById('stat-maxflow').innerText}`);
        this.btnPlay.innerHTML = '<i class="fas fa-check"></i> Done';
        this.btnPlay.disabled = true;
        this.btnStep.disabled = true;
        this.animating = false;
    }

    spawnParticles(u, v, amount) {
        const count = Math.min(amount, 10);
        for(let i = 0; i < count; i++) {
            this.particles.push({
                u: u, v: v,
                progress: -Math.random() * 0.5, // stagger start
                speed: 0.02 + Math.random() * 0.01
            });
        }
    }

    // --- Control Flow ---
    togglePlay() {
        if (this.isEditing) {
            this.isEditing = false;
            this.editorHint.classList.add('hidden');
            this.btnPlay.innerHTML = '<i class="fas fa-pause"></i> Pause';
            this.btnStep.disabled = false;
            this.btnReset.disabled = false;
            this.btnPlay.classList.remove('primary');
            this.btnPlay.classList.add('warning');
            document.getElementById('btn-random').disabled = true;
            document.getElementById('btn-clear').disabled = true;
            this.generator = this.algorithmGenerator();
            this.setStatus("Status: Running Algorithm");
            this.animating = true;
            this.autoStep();
        } else {
            this.animating = !this.animating;
            this.btnPlay.innerHTML = this.animating ? '<i class="fas fa-pause"></i> Pause' : '<i class="fas fa-play"></i> Resume';
            if (this.animating) this.autoStep();
            else this.setStatus("Status: Paused");
        }
    }

    step() {
        if (!this.generator) return;
        const res = this.generator.next();
        if (res.done) this.animating = false;
    }

    autoStep() {
        if (!this.animating) return;
        this.step();
        if (this.animating) {
            setTimeout(() => this.autoStep(), 800); // Animation delay between steps
        }
    }

    resetAlgorithm() {
        this.animating = false;
        this.generator = null;
        this.particles = [];
        this.highlightCode(null);
        
        // Reset node and edge states
        for (let [id, node] of this.nodes) {
            node.height = 0;
            node.excess = 0;
        }
        for (let edge of this.edges) {
            edge.flow = 0;
        }

        this.stats = { u: null, op: null, edge: null };
        this.updateTelemetry();
        
        this.isEditing = true;
        this.editorHint.classList.remove('hidden');
        this.btnPlay.innerHTML = '<i class="fas fa-play"></i> Start';
        this.btnPlay.disabled = false;
        this.btnPlay.classList.add('primary');
        this.btnPlay.classList.remove('warning');
        this.btnStep.disabled = true;
        this.btnReset.disabled = true;
        document.getElementById('btn-random').disabled = false;
        document.getElementById('btn-clear').disabled = false;
        this.setStatus("Status: Graph Editor Mode");
    }

    // --- Rendering Engine ---
    renderLoop() {
        this.ctx.fillStyle = COLORS.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Edges
        this.edges.forEach(edge => {
            const u = this.nodes.get(edge.u);
            const v = this.nodes.get(edge.v);
            
            // Draw Line
            this.ctx.beginPath();
            this.ctx.moveTo(u.x, u.y);
            this.ctx.lineTo(v.x, v.y);
            this.ctx.lineWidth = 3;
            
            if (edge.flow === edge.capacity) this.ctx.strokeStyle = COLORS.edgeFull;
            else if (edge.flow > 0) this.ctx.strokeStyle = COLORS.edgeFlow;
            else this.ctx.strokeStyle = COLORS.edgeEmpty;
            
            this.ctx.stroke();

            // Draw Capacity/Flow Label
            const mx = (u.x + v.x) / 2;
            const my = (u.y + v.y) / 2;
            this.ctx.fillStyle = COLORS.nodeBase;
            this.ctx.fillRect(mx - 15, my - 10, 30, 20);
            this.ctx.fillStyle = COLORS.textMain;
            this.ctx.font = '11px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`${edge.flow}/${edge.capacity}`, mx, my);
            
            // Arrow head
            const angle = Math.atan2(v.y - u.y, v.x - u.x);
            this.ctx.beginPath();
            this.ctx.moveTo(mx + 15 * Math.cos(angle), my + 15 * Math.sin(angle));
            this.ctx.lineTo(mx + 5 * Math.cos(angle - Math.PI*0.8), my + 5 * Math.sin(angle - Math.PI*0.8));
            this.ctx.lineTo(mx + 5 * Math.cos(angle + Math.PI*0.8), my + 5 * Math.sin(angle + Math.PI*0.8));
            this.ctx.fillStyle = this.ctx.strokeStyle;
            this.ctx.fill();
        });

        // Editor Drag Edge
        if (this.dragStartNode && this.isEditing) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.dragStartNode.x, this.dragStartNode.y);
            this.ctx.lineTo(this.mousePos.x, this.mousePos.y);
            this.ctx.strokeStyle = COLORS.textMuted;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.progress += p.speed;
            if (p.progress >= 1) {
                this.particles.splice(i, 1);
                continue;
            }
            if (p.progress > 0) {
                const px = p.u.x + (p.v.x - p.u.x) * p.progress;
                const py = p.u.y + (p.v.y - p.u.y) * p.progress;
                this.ctx.beginPath();
                this.ctx.arc(px, py, 4, 0, Math.PI * 2);
                this.ctx.fillStyle = COLORS.particle;
                this.ctx.fill();
            }
        }

        // Nodes
        for (let [id, node] of this.nodes) {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
            
            if (node.isSource) this.ctx.fillStyle = COLORS.nodeSource;
            else if (node.isSink) this.ctx.fillStyle = COLORS.nodeSink;
            else if (this.stats.u === id) this.ctx.fillStyle = COLORS.nodeActive;
            else if (!this.isEditing && node.excess === 0 && this.generator) this.ctx.fillStyle = COLORS.nodeFinished;
            else this.ctx.fillStyle = COLORS.nodeBase;
            
            this.ctx.fill();
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = COLORS.glassBorder;
            this.ctx.stroke();

            // Node ID
            this.ctx.fillStyle = COLORS.textMain;
            this.ctx.font = '12px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            let label = node.isSource ? 'S' : (node.isSink ? 'T' : id);
            this.ctx.fillText(label, node.x, node.y - 4);

            // Excess Flow
            if (!this.isEditing) {
                this.ctx.font = '10px monospace';
                this.ctx.fillStyle = COLORS.textMuted;
                this.ctx.fillText(`e:${node.excess}`, node.x, node.y + 10);
                
                // Topographic Height Badge
                this.ctx.beginPath();
                this.ctx.arc(node.x + 18, node.y - 18, 10, 0, Math.PI * 2);
                this.ctx.fillStyle = COLORS.purple;
                this.ctx.fill();
                this.ctx.fillStyle = COLORS.textMain;
                this.ctx.fillText(node.height, node.x + 18, node.y - 18);
            }
        }

        animationId = requestAnimationFrame(() => this.renderLoop());
    }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new PushRelabelVisualizer();
});
