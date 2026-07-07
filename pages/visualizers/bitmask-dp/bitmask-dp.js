/**
 * Advanced DP - State Space Bitmasking Visualizer
 * Traces BFS traversal of a graph combined with O(2^N * N) state memoization.
 * Highlights Bitwise operations and cycle pruning dynamically.
 */

const COLORS = {
    bg: '#00000000',
    nodeBase: '#1e293b',
    nodeBorder: '#334155',
    nodeActive: '#06b6d4',
    nodePath: '#10b981',
    edgeBase: '#475569',
    edgeActive: '#a855f7',
    textMain: '#ffffff'
};

class Node {
    constructor(id, rx, ry) {
        this.id = id;
        this.rx = rx; // Relative X
        this.ry = ry;
        
        // Canvas pixel mapping
        this.x = 0;
        this.y = 0;
        
        // Render state
        this.isActive = false;
        this.isPath = false;
    }
}

class Edge {
    constructor(u, v) {
        this.u = u;
        this.v = v;
        this.isActive = false;
        this.isPath = false;
    }
}

class BitmaskVisualizer {
    constructor() {
        this.canvas = document.getElementById('viz-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.dpTable = document.getElementById('dp-table');
        this.binDisplay = document.getElementById('binary-mask');
        this.mathPanel = document.getElementById('math-overlay');
        this.mathEq = document.getElementById('math-equation');
        this.statusTxt = document.getElementById('main-status');
        
        this.btnPlay = document.getElementById('btn-play');
        this.btnStep = document.getElementById('btn-step');

        this.N = 4;
        this.TARGET_MASK = (1 << this.N) - 1; // 15 (1111)
        
        this.nodes = [];
        this.edges = [];
        this.adj = [];
        
        // State
        this.dp = [];
        this.queue = [];
        this.statesExplored = 0;
        this.cyclesPruned = 0;
        
        this.animating = false;
        this.generator = null;
        this.timer = null;

        this.bindEvents();
        this.initGraph();
        this.initDPTable();
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.renderLoop();
    }

    bindEvents() {
        document.getElementById('btn-play').addEventListener('click', () => {
            if (!this.generator) this.startAlgorithm();
            else this.togglePlay();
        });

        document.getElementById('btn-step').addEventListener('click', () => {
            if (!this.generator) this.startAlgorithm();
            this.step();
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            if (!this.animating) this.hardReset();
        });
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
        
        this.nodes.forEach(node => {
            node.x = node.rx * this.canvas.width;
            node.y = node.ry * this.canvas.height;
        });
    }

    initGraph() {
        // Star-like topology to guarantee cycle evaluation
        this.nodes = [
            new Node(0, 0.2, 0.5), // Left
            new Node(1, 0.5, 0.2), // Top Center
            new Node(2, 0.8, 0.5), // Right
            new Node(3, 0.5, 0.8)  // Bottom Center
        ];

        this.edges = [
            new Edge(0, 1), new Edge(0, 3), 
            new Edge(1, 2), new Edge(1, 3)
        ];

        this.adj = Array.from({ length: this.N }, () => []);
        this.edges.forEach(e => {
            this.adj[e.u].push(e.v);
            this.adj[e.v].push(e.u);
        });
    }

    initDPTable() {
        this.dpTable.innerHTML = '';
        this.dp = Array.from({ length: 16 }, () => Array(this.N).fill(false));

        for (let m = 0; m < 16; m++) {
            const row = document.createElement('div');
            row.className = 'dp-row';
            
            const label = document.createElement('div');
            label.className = 'dp-label';
            label.innerText = m.toString(2).padStart(this.N, '0');
            row.appendChild(label);
            
            for (let n = 0; n < this.N; n++) {
                const cell = document.createElement('div');
                cell.className = 'dp-cell';
                cell.id = `dp-${m}-${n}`;
                row.appendChild(cell);
            }
            this.dpTable.appendChild(row);
        }
    }

    hardReset() {
        this.animating = false;
        if (this.timer) clearTimeout(this.timer);
        this.generator = null;
        
        this.nodes.forEach(n => { n.isActive = false; n.isPath = false; });
        this.edges.forEach(e => { e.isActive = false; e.isPath = false; });
        
        this.statesExplored = 0;
        this.cyclesPruned = 0;
        this.updateTelemetry(0);
        
        this.binDisplay.innerHTML = '0000';
        this.initDPTable();
        
        this.btnPlay.innerHTML = '<i class="fas fa-play"></i> Auto Run';
        this.btnPlay.disabled = false;
        this.btnStep.disabled = false;
        this.mathPanel.classList.add('hidden');
        this.highlightCode(null);
        this.statusTxt.innerText = `Status: Execution Reset`;
    }

    // --- UI/UX Helpers ---
    updateMath(eq) { this.mathEq.innerHTML = eq; this.mathPanel.classList.remove('hidden'); }
    
    highlightCode(stepId, styleClass = 'active') {
        document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active', 'active-danger', 'active-emerald', 'active-purple'));
        if (stepId) document.getElementById(stepId).classList.add(styleClass);
    }

    updateTelemetry(qSize) {
        document.getElementById('stat-q').innerText = qSize;
        document.getElementById('stat-states').innerText = this.statesExplored;
        document.getElementById('stat-pruned').innerText = this.cyclesPruned;
    }

    updateBinaryDisplay(oldMask, newMask) {
        const oStr = oldMask.toString(2).padStart(this.N, '0');
        const nStr = newMask.toString(2).padStart(this.N, '0');
        let html = '';
        
        for (let i = 0; i < this.N; i++) {
            if (oStr[i] !== nStr[i]) {
                html += `<span class="flipped">${nStr[i]}</span>`;
            } else {
                html += `<span>${nStr[i]}</span>`;
            }
        }
        this.binDisplay.innerHTML = html;
        
        // Scroll DP table to the new mask row
        const targetRow = document.getElementById(`dp-${newMask}-0`).parentElement;
        if (targetRow) {
            targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    setDPState(mask, node, stateClass) {
        // Clear old evals
        document.querySelectorAll('.dp-cell').forEach(c => c.classList.remove('eval-green', 'eval-red'));
        
        const cell = document.getElementById(`dp-${mask}-${node}`);
        if (cell) {
            cell.classList.add(stateClass);
            if (stateClass === 'visited' || stateClass === 'eval-green') {
                cell.innerText = '1';
                cell.classList.add('visited'); // Persist
            } else if (stateClass === 'eval-red') {
                cell.innerText = 'X';
                setTimeout(() => cell.innerText = this.dp[mask][node] ? '1' : '', 1000);
            }
        }
    }

    formatBinaryNodeString(v) {
        // Represents (1 << v) formatted to N bits
        const val = 1 << ((this.N - 1) - v); // formatting for standard L-to-R binary visual
        return val.toString(2).padStart(this.N, '0');
    }

    getEdge(u, v) {
        return this.edges.find(e => (e.u === u && e.v === v) || (e.u === v && e.v === u));
    }

    // --- State Machine Generator ---
    *runAlgorithm() {
        this.statusTxt.innerText = `Status: Running BFS State Engine`;
        
        this.highlightCode('bm-1');
        this.updateMath(`Target Mask = (1 << ${this.N}) - 1 <br> Target = <span class="eq-hl">1111</span> (All Nodes Visited)`);
        yield;

        this.highlightCode('bm-2');
        this.queue = [];
        
        // Start BFS from Node 0 for visual clarity
        const startNode = 0;
        const startMask = 1 << ((this.N - 1) - startNode); // Adjusted so Node 0 is left-most bit
        
        this.queue.push({ u: startNode, mask: startMask, path: [startNode] });
        this.dp[startMask][startNode] = true;
        this.setDPState(startMask, startNode, 'eval-green');
        this.updateBinaryDisplay(0, startMask);
        this.updateTelemetry(this.queue.length);
        
        this.updateMath(`Initialize Queue: Starting at Node <span class="eq-hl">${startNode}</span> <br> Mask: <span class="eq-hl">${startMask.toString(2).padStart(4, '0')}</span>`);
        yield;

        while (this.queue.length > 0) {
            this.highlightCode('bm-3');
            yield;

            this.highlightCode('bm-4');
            const curr = this.queue.shift();
            this.updateTelemetry(this.queue.length);
            
            this.nodes.forEach(n => n.isActive = false);
            this.edges.forEach(e => e.isActive = false);
            
            this.nodes[curr.u].isActive = true;
            this.updateBinaryDisplay(curr.mask, curr.mask);
            this.updateMath(`Dequeued State: Node <span class="eq-hl">${curr.u}</span>, Mask <span class="eq-p">${curr.mask.toString(2).padStart(4, '0')}</span>`);
            yield;

            this.highlightCode('bm-5');
            if (curr.mask === this.TARGET_MASK) {
                this.highlightCode('bm-6', 'active-emerald');
                this.statusTxt.innerText = `Status: Target Reached! Shortest Path Length: ${curr.path.length - 1}`;
                this.updateMath(`<span class="eq-ok">Target Mask 1111 achieved!</span> <br> Path: ${curr.path.join(' &rarr; ')}`);
                
                // Animate final path
                this.nodes.forEach(n => n.isActive = false);
                curr.path.forEach(nodeId => this.nodes[nodeId].isPath = true);
                for (let i = 0; i < curr.path.length - 1; i++) {
                    const edge = this.getEdge(curr.path[i], curr.path[i+1]);
                    if (edge) edge.isPath = true;
                }
                
                yield;
                break;
            }

            this.highlightCode('bm-7');
            const neighbors = this.adj[curr.u];
            yield;

            for (let v of neighbors) {
                // Highlight edge actively being evaluated
                const edge = this.getEdge(curr.u, v);
                edge.isActive = true;
                this.nodes[v].isActive = true;

                this.highlightCode('bm-8', 'active-purple');
                const vBit = 1 << ((this.N - 1) - v);
                const nextMask = curr.mask | vBit;
                
                this.updateBinaryDisplay(curr.mask, nextMask);
                this.updateMath(`Evaluate Neighbor <span class="eq-hl">${v}</span> <br> mask | (1 &lt;&lt; ${v}) <br> <span class="eq-p">${curr.mask.toString(2).padStart(4, '0')}</span> | <span class="eq-hl">${vBit.toString(2).padStart(4, '0')}</span> = <span class="eq-ok">${nextMask.toString(2).padStart(4, '0')}</span>`);
                yield;

                this.highlightCode('bm-9');
                if (this.dp[nextMask][v]) {
                    this.highlightCode('bm-10', 'active-danger');
                    this.cyclesPruned++;
                    this.updateTelemetry(this.queue.length);
                    this.setDPState(nextMask, v, 'eval-red');
                    this.updateMath(`Checking dp[${nextMask.toString(2).padStart(4, '0')}][${v}] <br> <span class="eq-err">Already Visited (Value = 1). CYCLE PRUNED.</span>`);
                    yield;
                } else {
                    this.highlightCode('bm-11');
                    yield;

                    this.highlightCode('bm-12', 'active-emerald');
                    this.dp[nextMask][v] = true;
                    this.setDPState(nextMask, v, 'eval-green');
                    this.updateMath(`Checking dp[${nextMask.toString(2).padStart(4, '0')}][${v}] <br> <span class="eq-ok">Unvisited (Empty). Valid State Transition.</span>`);
                    yield;

                    this.highlightCode('bm-13');
                    this.queue.push({ u: v, mask: nextMask, path: [...curr.path, v] });
                    this.statesExplored++;
                    this.updateTelemetry(this.queue.length);
                    this.updateMath(`Queued State: Node <span class="eq-hl">${v}</span>, Mask <span class="eq-ok">${nextMask.toString(2).padStart(4, '0')}</span>`);
                    yield;
                }

                edge.isActive = false;
                this.nodes[v].isActive = false;
                this.updateBinaryDisplay(nextMask, curr.mask); // revert UI mask to current BFS pop
            }
            this.nodes[curr.u].isActive = false;
        }

        this.highlightCode(null);
        document.getElementById('btn-play').innerHTML = '<i class="fas fa-check"></i> Done';
        document.getElementById('btn-play').disabled = true;
        document.getElementById('btn-step').disabled = true;
        this.animating = false;
    }

    // --- Control Flow ---
    startAlgorithm() {
        if (this.animating) return;
        this.hardReset();
        this.generator = this.runAlgorithm();
        this.animating = true;
        
        this.btnPlay.innerHTML = '<i class="fas fa-pause"></i> Pause';
        this.btnPlay.disabled = false;
        document.getElementById('btn-step').disabled = false;
        
        this.autoStep();
    }

    togglePlay() {
        if (!this.generator) {
            this.startAlgorithm();
            return;
        }
        
        this.animating = !this.animating;
        this.btnPlay.innerHTML = this.animating ? '<i class="fas fa-pause"></i> Pause' : '<i class="fas fa-play"></i> Auto Run';
        if (this.animating) this.autoStep();
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
            this.timer = setTimeout(() => this.autoStep(), 1500); // 1.5s Pacing
        }
    }

    // --- Canvas Renderer ---
    renderLoop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Edges
        this.edges.forEach(edge => {
            const u = this.nodes[edge.u];
            const v = this.nodes[edge.v];

            this.ctx.beginPath();
            this.ctx.moveTo(u.x, u.y);
            this.ctx.lineTo(v.x, v.y);

            if (edge.isPath) {
                this.ctx.strokeStyle = COLORS.nodePath;
                this.ctx.lineWidth = 4;
            } else if (edge.isActive) {
                this.ctx.strokeStyle = COLORS.edgeActive;
                this.ctx.lineWidth = 3;
            } else {
                this.ctx.strokeStyle = COLORS.edgeBase;
                this.ctx.lineWidth = 2;
            }
            this.ctx.stroke();
        });

        // Nodes
        this.nodes.forEach(node => {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
            this.ctx.fillStyle = COLORS.nodeBase;
            this.ctx.fill();

            this.ctx.lineWidth = 2;
            if (node.isPath) {
                this.ctx.strokeStyle = COLORS.nodePath;
                this.ctx.shadowColor = COLORS.nodePath;
                this.ctx.shadowBlur = 20;
            } else if (node.isActive) {
                this.ctx.strokeStyle = COLORS.nodeActive;
                this.ctx.shadowColor = COLORS.nodeActive;
                this.ctx.shadowBlur = 15;
            } else {
                this.ctx.strokeStyle = COLORS.nodeBorder;
                this.ctx.shadowBlur = 0;
            }
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            this.ctx.fillStyle = COLORS.textMain;
            this.ctx.font = '14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`N${node.id}`, node.x, node.y);
        });

        requestAnimationFrame(() => this.renderLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new BitmaskVisualizer();
});
