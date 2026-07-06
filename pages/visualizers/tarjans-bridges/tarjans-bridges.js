/**
 * Graph Vulnerabilities - Tarjan's Bridge-Finding Algorithm
 * State Machine tracing standard DFS while dynamically updating 
 * discovery/low times to identify Critical Connections.
 */

const COLORS = {
    bg: '#00000000',
    nodeBase: '#1e293b',
    nodeActive: '#a855f7',
    nodeVisited: '#0f172a',
    edgeUnexplored: '#334155',
    edgeTree: '#06b6d4',      // Cyan (Forward)
    edgeBack: '#f59e0b',      // Warning Orange (Cycle)
    edgeBridge: '#ef4444',    // Danger Red (Critical)
    textMain: '#ffffff',
    textMuted: '#94a3b8'
};

class GraphNode {
    constructor(id, rx, ry) {
        this.id = id;
        this.rx = rx; // Relative X [0.0 - 1.0]
        this.ry = ry; // Relative Y [0.0 - 1.0]
        
        // Tarjan State
        this.visited = false;
        this.disc = -1;
        this.low = -1;
        
        // UI State
        this.isActive = false;
    }
}

class GraphEdge {
    constructor(u, v) {
        this.u = u;
        this.v = v;
        this.type = 'unexplored'; // 'unexplored', 'tree', 'back', 'bridge'
        this.evaluating = false;
    }
}

class TarjansVisualizer {
    constructor() {
        this.canvas = document.getElementById('viz-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.mathPanel = document.getElementById('math-overlay');
        this.mathEq = document.getElementById('math-equation');
        this.statusTxt = document.getElementById('main-status');

        this.nodes = [];
        this.edges = [];
        this.adj = [];
        
        this.timerCount = 0;
        this.bridgesCount = 0;
        
        this.animating = false;
        this.generator = null;
        this.loopTimer = null;

        this.bindEvents();
        this.initGraph(0); // 0 = Standard Base Preset
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.renderLoop();
    }

    bindEvents() {
        document.getElementById('btn-random').addEventListener('click', () => this.initGraph(1));
        document.getElementById('btn-reset').addEventListener('click', () => this.initGraph(this.lastPreset));
        document.getElementById('btn-step').addEventListener('click', () => this.step());
        document.getElementById('btn-play').addEventListener('click', () => this.togglePlay());
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    getEdge(u, v) {
        return this.edges.find(e => (e.u === u && e.v === v) || (e.u === v && e.v === u));
    }

    initGraph(presetType) {
        this.lastPreset = presetType;
        this.animating = false;
        if (this.loopTimer) clearTimeout(this.loopTimer);
        this.generator = null;
        
        this.timerCount = 0;
        this.bridgesCount = 0;
        document.getElementById('stat-timer').innerText = '0';
        document.getElementById('stat-bridges').innerText = '0';
        document.getElementById('stat-u').innerText = '—';
        
        const btnPlay = document.getElementById('btn-play');
        btnPlay.innerHTML = '<i class="fas fa-play"></i> Auto Run';
        btnPlay.disabled = false;
        document.getElementById('btn-step').disabled = false;
        this.mathPanel.classList.add('hidden');
        this.highlightCode(null);

        this.nodes = [];
        this.edges = [];

        if (presetType === 0) {
            // Standard Preset: Two triangles connected by a bridge
            // Triangle 1: 0, 1, 2
            this.nodes.push(new GraphNode(0, 0.2, 0.3));
            this.nodes.push(new GraphNode(1, 0.2, 0.7));
            this.nodes.push(new GraphNode(2, 0.4, 0.5));
            // Bridge 2 - 3
            // Triangle 2: 3, 4, 5
            this.nodes.push(new GraphNode(3, 0.6, 0.5));
            this.nodes.push(new GraphNode(4, 0.8, 0.3));
            this.nodes.push(new GraphNode(5, 0.8, 0.7));

            this.edges.push(new GraphEdge(0, 1), new GraphEdge(1, 2), new GraphEdge(2, 0));
            this.edges.push(new GraphEdge(2, 3)); // The Bridge
            this.edges.push(new GraphEdge(3, 4), new GraphEdge(4, 5), new GraphEdge(5, 3));
        } else {
            // "Random" Graph (Hardcoded shape with 2 bridges for robust edge cases)
            this.nodes.push(new GraphNode(0, 0.5, 0.2));
            this.nodes.push(new GraphNode(1, 0.3, 0.4));
            this.nodes.push(new GraphNode(2, 0.7, 0.4));
            this.nodes.push(new GraphNode(3, 0.5, 0.6));
            this.nodes.push(new GraphNode(4, 0.5, 0.8)); // Bridge 3-4
            this.nodes.push(new GraphNode(5, 0.2, 0.8)); // Bridge 1-5

            this.edges.push(new GraphEdge(0, 1), new GraphEdge(0, 2), new GraphEdge(1, 3), new GraphEdge(2, 3)); // Diamond
            this.edges.push(new GraphEdge(3, 4)); // Bridge
            this.edges.push(new GraphEdge(1, 5)); // Bridge
        }

        // Build Adjacency List
        this.adj = Array.from({ length: this.nodes.length }, () => []);
        this.edges.forEach(e => {
            this.adj[e.u].push(e.v);
            this.adj[e.v].push(e.u);
        });

        this.updateStatus(`Status: Graph Ready`);
    }

    // --- UI Helpers ---
    updateStatus(msg) { this.statusTxt.innerText = msg; }
    updateMath(eq) { this.mathEq.innerHTML = eq; this.mathPanel.classList.remove('hidden'); }
    
    highlightCode(stepId, styleClass = 'active') {
        document.querySelectorAll('.code-line').forEach(el => {
            el.classList.remove('active', 'active-purple', 'active-warning', 'active-danger');
        });
        if (stepId) document.getElementById(stepId).classList.add(styleClass);
    }

    // --- Tarjan's Generator State Machine ---
    *dfs(u, parentId) {
        let nodeU = this.nodes[u];
        nodeU.isActive = true;
        document.getElementById('stat-u').innerText = u;

        this.highlightCode('tj-3');
        nodeU.visited = true;
        this.updateMath(`Visiting Node <span class="eq-hl">${u}</span>`);
        yield;

        this.highlightCode('tj-4');
        this.timerCount++;
        nodeU.disc = this.timerCount;
        nodeU.low = this.timerCount;
        
        document.getElementById('stat-timer').innerText = this.timerCount;
        this.updateMath(`Initialize Timer: <br> disc[${u}] = <span class="eq-hl">${this.timerCount}</span> | low[${u}] = <span class="eq-hl">${this.timerCount}</span>`);
        yield;

        for (let v of this.adj[u]) {
            this.highlightCode('tj-5');
            let nodeV = this.nodes[v];
            let edge = this.getEdge(u, v);
            edge.evaluating = true;
            this.updateMath(`Evaluating neighbor <span class="eq-hl">${v}</span> from ${u}.`);
            yield;

            if (v === parentId) {
                this.highlightCode('tj-6');
                this.updateMath(`Neighbor ${v} is the parent of ${u}. Ignoring traversal backward.`);
                edge.evaluating = false;
                yield;
                continue;
            }

            if (nodeV.visited) {
                // Back Edge / Cycle detected
                this.highlightCode('tj-7', 'active-warning');
                edge.type = 'back';
                this.updateMath(`Neighbor <span class="eq-warn">${v}</span> is already visited! <br> Cycle detected (Back Edge).`);
                yield;

                this.highlightCode('tj-8', 'active-warning');
                const oldLow = nodeU.low;
                nodeU.low = Math.min(nodeU.low, nodeV.disc);
                this.updateMath(`low[${u}] = min(low[${u}], disc[${v}]) <br> low[${u}] = min(${oldLow}, ${nodeV.disc}) = <span class="eq-warn">${nodeU.low}</span>`);
                yield;
                
            } else {
                // Tree Edge / Forward DFS
                this.highlightCode('tj-9');
                edge.type = 'tree';
                this.updateMath(`Neighbor <span class="eq-hl">${v}</span> is unvisited. <br> Advancing DFS via Tree Edge.`);
                yield;

                this.highlightCode('tj-10');
                edge.evaluating = false;
                nodeU.isActive = false;
                
                // Recurse
                yield* this.dfs(v, u);
                
                // Backtrack Phase
                nodeU.isActive = true; // Refocus parent
                document.getElementById('stat-u').innerText = u;
                edge.evaluating = true; // Highlight edge again on return
                
                this.highlightCode('tj-11', 'active-purple');
                const oldLow = nodeU.low;
                nodeU.low = Math.min(nodeU.low, nodeV.low);
                this.updateMath(`<span class="eq-p">Backtracking from ${v} to ${u}.</span> <br> low[${u}] = min(low[${u}], low[${v}]) <br> low[${u}] = min(${oldLow}, ${nodeV.low}) = <span class="eq-p">${nodeU.low}</span>`);
                yield;

                // Bridge Check
                this.highlightCode('tj-12', 'active-danger');
                if (nodeV.low > nodeU.disc) {
                    this.updateMath(`Check Bridge: low[${v}] > disc[${u}] <br> ${nodeV.low} > ${nodeU.disc} : <span class="eq-err">TRUE</span>`);
                    yield;

                    this.highlightCode('tj-13', 'active-danger');
                    edge.type = 'bridge';
                    this.bridgesCount++;
                    document.getElementById('stat-bridges').innerText = this.bridgesCount;
                    this.updateMath(`Edge (${u}, ${v}) is a <span class="eq-err">CRITICAL BRIDGE</span>!`);
                    yield;
                } else {
                    this.updateMath(`Check Bridge: low[${v}] > disc[${u}] <br> ${nodeV.low} > ${nodeU.disc} : FALSE. Not a bridge.`);
                    yield;
                }
            }
            edge.evaluating = false;
        }
        
        nodeU.isActive = false;
    }

    *runTarjan() {
        this.highlightCode('tj-1');
        this.updateStatus('Status: Starting Algorithm');
        this.updateMath('Initialize Global Timer = 0');
        yield;

        // Ensure all components are handled (if disconnected graph)
        for (let i = 0; i < this.nodes.length; i++) {
            if (!this.nodes[i].visited) {
                this.highlightCode('tj-2');
                this.updateMath(`Starting DFS Traversal from Unvisited Node <span class="eq-hl">${i}</span>`);
                yield;
                yield* this.dfs(i, -1);
            }
        }

        this.updateStatus(`Status: Algorithm Complete. Bridges Found: ${this.bridgesCount}`);
        this.highlightCode(null);
        this.mathPanel.classList.add('hidden');
        document.getElementById('btn-play').innerHTML = '<i class="fas fa-check"></i> Done';
        document.getElementById('btn-play').disabled = true;
        document.getElementById('btn-step').disabled = true;
        this.animating = false;
    }

    // --- Control Flow ---
    startAlgorithm() {
        if (this.animating) return;
        this.generator = this.runTarjan();
        this.animating = true;
        
        document.getElementById('btn-play').innerHTML = '<i class="fas fa-pause"></i> Pause';
        document.getElementById('btn-play').disabled = false;
        document.getElementById('btn-step').disabled = false;
        
        this.autoStep();
    }

    togglePlay() {
        if (!this.generator) {
            this.startAlgorithm();
            return;
        }
        
        this.animating = !this.animating;
        const btnPlay = document.getElementById('btn-play');
        btnPlay.innerHTML = this.animating ? '<i class="fas fa-pause"></i> Pause' : '<i class="fas fa-play"></i> Auto Run';
        if (this.animating) {
            this.autoStep();
        } else if (this.loopTimer) {
            clearTimeout(this.loopTimer);
            this.loopTimer = null;
        }
    }

    step() {
        if (!this.generator) this.startAlgorithm();
        
        const res = this.generator.next();
        if (res.done) {
            this.generator = null;
            return false;
        }
        return true;
    }

    autoStep() {
        if (!this.animating) return;
        const hasNext = this.step();
        if (hasNext) {
            this.loopTimer = setTimeout(() => this.autoStep(), 1500); // 1.5s Educational Pacing
        }
    }

    // --- Canvas Rendering ---
    getPixelPos(node) {
        // Leave padding on edges
        const padX = 80;
        const padY = 80;
        const w = this.canvas.width - (padX * 2);
        const h = this.canvas.height - (padY * 2);
        return {
            x: padX + (node.rx * w),
            y: padY + (node.ry * h)
        };
    }

    renderLoop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Edges
        this.edges.forEach(edge => {
            const u = this.getPixelPos(this.nodes[edge.u]);
            const v = this.getPixelPos(this.nodes[edge.v]);

            this.ctx.beginPath();
            this.ctx.moveTo(u.x, u.y);
            this.ctx.lineTo(v.x, v.y);

            // Coloring based on evaluation and Tarjan state
            if (edge.evaluating) {
                this.ctx.strokeStyle = COLORS.textMain;
                this.ctx.lineWidth = 4;
            } else if (edge.type === 'bridge') {
                this.ctx.strokeStyle = COLORS.edgeBridge;
                this.ctx.lineWidth = 5;
            } else if (edge.type === 'back') {
                this.ctx.strokeStyle = COLORS.edgeBack;
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
            } else if (edge.type === 'tree') {
                this.ctx.strokeStyle = COLORS.edgeTree;
                this.ctx.lineWidth = 3;
            } else {
                this.ctx.strokeStyle = COLORS.edgeUnexplored;
                this.ctx.lineWidth = 2;
            }

            this.ctx.stroke();
            this.ctx.setLineDash([]); // Reset dash
        });

        // Draw Nodes
        this.nodes.forEach(node => {
            const pos = this.getPixelPos(node);

            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
            this.ctx.fillStyle = node.visited ? COLORS.nodeVisited : COLORS.nodeBase;
            this.ctx.fill();

            this.ctx.lineWidth = 2;
            if (node.isActive) {
                this.ctx.strokeStyle = COLORS.nodeActive;
                this.ctx.shadowColor = COLORS.nodeActive;
                this.ctx.shadowBlur = 15;
            } else {
                this.ctx.strokeStyle = node.visited ? COLORS.edgeTree : COLORS.edgeUnexplored;
            }
            this.ctx.stroke();
            this.ctx.shadowBlur = 0; // Reset shadow

            // Node ID Label
            this.ctx.fillStyle = COLORS.textMain;
            this.ctx.font = '14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.id, pos.x, pos.y);

            // Tarjan Timers (Disc / Low)
            if (node.visited) {
                // Background badge
                this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
                this.ctx.beginPath();
                this.ctx.roundRect(pos.x - 25, pos.y + 25, 50, 20, 4);
                this.ctx.fill();
                this.ctx.strokeStyle = COLORS.edgeUnexplored;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();

                // Text: d (cyan), separator, l (purple/warning)
                this.ctx.font = '10px monospace';
                this.ctx.fillStyle = COLORS.edgeTree; // Cyan
                this.ctx.textAlign = 'right';
                this.ctx.fillText(`d:${node.disc}`, pos.x - 2, pos.y + 35);
                
                this.ctx.fillStyle = COLORS.textMuted;
                this.ctx.textAlign = 'center';
                this.ctx.fillText('|', pos.x, pos.y + 35);

                this.ctx.fillStyle = COLORS.nodeActive; // Purple
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`l:${node.low}`, pos.x + 2, pos.y + 35);
            }
        });

        requestAnimationFrame(() => this.renderLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new TarjansVisualizer();
});
