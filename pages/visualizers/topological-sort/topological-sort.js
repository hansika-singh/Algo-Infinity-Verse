/**
 * Graph Theory - Topological Sort (Kahn's Algorithm) Engine
 * Hybrid Canvas (Graph) + DOM (Queue/Result) visualizer for dependency resolution.
 */

const COLORS = {
    bg: '#00000000', // Canvas transparent overlay over DOM
    nodeBase: '#1e293b',
    nodeBorder: '#334155',
    nodeProcessing: '#06b6d4',
    nodeFinished: '#10b981',
    edgeActive: '#94a3b8',
    edgeHighlight: '#ef4444', // Red when removing
    textMain: '#ffffff',
    textMuted: '#94a3b8',
    badgeBg: '#a855f7',
    badgeZero: '#f59e0b'
};

class KahnNode {
    constructor(id, x, y, label) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.label = label;
        this.inDegree = 0;
        
        // Visual States
        this.status = 'idle'; // idle, processing, finished
        this.radius = 22;
    }
}

class KahnEdge {
    constructor(u, v) {
        this.u = u;
        this.v = v;
        this.active = true;
        this.highlighting = false;
    }
}

class TopologicalSortVisualizer {
    constructor() {
        this.canvas = document.getElementById('viz-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.queueContainer = document.getElementById('queue-container');
        this.sortedContainer = document.getElementById('sorted-container');
        this.mathPanel = document.getElementById('math-overlay');
        this.mathEq = document.getElementById('math-equation');
        this.statusTxt = document.getElementById('main-status');

        this.nodes = [];
        this.edges = [];
        
        this.animating = false;
        this.generator = null;
        this.timer = null;

        this.bindEvents();
        this.initGraph(0); // 0 = standard, 1 = random
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.renderLoop();
    }

    bindEvents() {
        document.getElementById('btn-random').addEventListener('click', () => this.initGraph(1));
        document.getElementById('btn-reset').addEventListener('click', () => this.initGraph(this.lastGraphType));
        document.getElementById('btn-step').addEventListener('click', () => this.step());
        document.getElementById('btn-play').addEventListener('click', () => this.togglePlay());
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    initGraph(type = 0) {
        this.lastGraphType = type;
        this.animating = false;
        if (this.timer) clearTimeout(this.timer);
        this.generator = null;
        
        const btnPlay = document.getElementById('btn-play');
        btnPlay.innerHTML = '<i class="fas fa-play"></i> Auto Run';
        btnPlay.disabled = false;
        document.getElementById('btn-step').disabled = false;
        
        this.mathPanel.classList.add('hidden');
        document.querySelectorAll('.code-line').forEach(el => el.className = 'code-line' + (el.classList.contains('indent') ? ' indent' : '') + (el.classList.contains('indent-2') ? ' indent-2' : ''));
        
        this.queueContainer.innerHTML = '';
        this.sortedContainer.innerHTML = '';
        document.getElementById('stat-curr').innerText = '—';
        document.getElementById('stat-q-size').innerText = '0';

        this.nodes = [];
        this.edges = [];

        // Virtual coords mapping for responsive resize
        if (type === 0) {
            // Standard Preset Course Schedule DAG
            this.nodes.push(new KahnNode(0, 150, 150, 'A'));
            this.nodes.push(new KahnNode(1, 150, 350, 'B'));
            this.nodes.push(new KahnNode(2, 350, 250, 'C'));
            this.nodes.push(new KahnNode(3, 550, 150, 'D'));
            this.nodes.push(new KahnNode(4, 550, 350, 'E'));
            this.nodes.push(new KahnNode(5, 750, 250, 'F'));
            
            this.edges.push(new KahnEdge(0, 2), new KahnEdge(1, 2));
            this.edges.push(new KahnEdge(2, 3), new KahnEdge(2, 4));
            this.edges.push(new KahnEdge(3, 5), new KahnEdge(4, 5));
        } else {
            // Random Valid DAG Generation (Level based to guarantee acyclic)
            const layers = 3;
            const nodesPerLayer = 2;
            let idCount = 0;
            
            for(let i=0; i<layers; i++) {
                for(let j=0; j<nodesPerLayer; j++) {
                    const jitterX = Math.random() * 40 - 20;
                    const jitterY = Math.random() * 60 - 30;
                    this.nodes.push(new KahnNode(idCount, 150 + i * 300 + jitterX, 150 + j * 200 + jitterY, String.fromCharCode(65 + idCount)));
                    idCount++;
                }
            }
            
            // Generate strictly forward edges to prevent cycles
            for(let i=0; i < this.nodes.length; i++) {
                for(let j=i+1; j < this.nodes.length; j++) {
                    if (this.nodes[j].x > this.nodes[i].x + 100 && Math.random() > 0.4) {
                        this.edges.push(new KahnEdge(i, j));
                    }
                }
            }
        }

        this.nodes.forEach(n => n.inDegree = 0);
        this.edges.forEach(e => { this.nodes[e.v].inDegree++; });
        
        document.getElementById('stat-sorted').innerText = `0 / ${this.nodes.length}`;
        this.statusTxt.innerText = `Status: Graph Initialized`;
    }

    highlightCode(stepId, colorClass = 'active') {
        document.querySelectorAll('.code-line').forEach(el => {
            el.classList.remove('active', 'active-purple', 'active-green');
        });
        if (stepId) document.getElementById(stepId).classList.add(colorClass);
    }

    updateMath(equation) {
        this.mathEq.innerHTML = equation;
        this.mathPanel.classList.remove('hidden');
    }

    // Custom DOM Injectors
    injectDOMNode(container, idStr, label, styleClass) {
        const el = document.createElement('div');
        el.className = `dom-node ${styleClass}`;
        el.id = idStr;
        el.innerText = label;
        container.appendChild(el);
    }

    removeDOMNode(idStr) {
        const el = document.getElementById(idStr);
        if (el) {
            el.classList.add('popping');
            setTimeout(() => el.remove(), 400);
        }
    }

    *kahnAlgorithm() {
        const queue = [];
        const sorted = [];

        this.statusTxt.innerText = `Status: Computing Initial Dependencies`;
        this.highlightCode('step-indegree');
        this.updateMath(`Initialize In-Degree array via Graph edge sweep.`);
        yield;

        // Find Zero In-Degrees
        this.highlightCode('step-init-q', 'active-purple');
        let initialZeros = [];
        this.nodes.forEach(n => {
            if (n.inDegree === 0) {
                queue.push(n);
                initialZeros.push(n.label);
                this.injectDOMNode(this.queueContainer, `q-${n.id}`, n.label, 'in-queue');
            }
        });
        document.getElementById('stat-q-size').innerText = queue.length;
        this.updateMath(`Nodes with InDegree == 0: [<span class="eq-q">${initialZeros.join(', ')}</span>] <br> Push to Queue.`);
        yield;

        while (queue.length > 0) {
            this.highlightCode('step-loop');
            yield;

            // Pop Queue
            const u = queue.shift();
            this.removeDOMNode(`q-${u.id}`);
            document.getElementById('stat-q-size').innerText = queue.length;
            
            u.status = 'processing';
            document.getElementById('stat-curr').innerText = u.label;
            
            this.highlightCode('step-pop', 'active-green');
            sorted.push(u);
            this.injectDOMNode(this.sortedContainer, `s-${u.id}`, u.label, 'sorted');
            document.getElementById('stat-sorted').innerText = `${sorted.length} / ${this.nodes.length}`;
            
            this.updateMath(`Dequeue Node <span class="eq-hl">${u.label}</span>. Add to Topological Output.`);
            yield;

            this.highlightCode('step-neighbors');
            const outgoingEdges = this.edges.filter(e => e.u === u.id && e.active);
            if (outgoingEdges.length === 0) {
                this.updateMath(`Node <span class="eq-hl">${u.label}</span> has no remaining outgoing dependencies.`);
                yield;
            }

            // Process Neighbors
            for (let edge of outgoingEdges) {
                const v = this.nodes[edge.v];
                
                // Highlight edge before removal
                edge.highlighting = true;
                this.highlightCode('step-decrement', 'active-purple');
                this.updateMath(`Severing Edge ${u.label} → ${v.label}. <br> Decrementing In-Degree of <span class="eq-hl">${v.label}</span>.`);
                yield;

                // Sever Edge
                edge.active = false;
                edge.highlighting = false;
                v.inDegree--;
                this.updateMath(`In-Degree[${v.label}] = <span class="eq-hl">${v.inDegree}</span>`);
                yield;

                // Check new 0s
                if (v.inDegree === 0) {
                    this.highlightCode('step-enqueue', 'active-purple');
                    queue.push(v);
                    this.injectDOMNode(this.queueContainer, `q-${v.id}`, v.label, 'in-queue');
                    document.getElementById('stat-q-size').innerText = queue.length;
                    this.updateMath(`In-Degree[${v.label}] hits 0. <br> <span class="eq-q">Enqueue ${v.label}</span>.`);
                    yield;
                }
            }

            u.status = 'finished';
        }

        // Final Check
        this.highlightCode('step-check');
        document.getElementById('stat-curr').innerText = '—';
        
        if (sorted.length === this.nodes.length) {
            this.updateMath(`Sorted Count (${sorted.length}) == V (${this.nodes.length}). <br> <span class="eq-hl">Valid Topological Order Found.</span>`);
            this.statusTxt.innerText = `Status: Algorithm Complete`;
        } else {
            this.updateMath(`Sorted Count (${sorted.length}) != V (${this.nodes.length}). <br> <span class="eq-err">CYCLE DETECTED. Graph is not a DAG.</span>`);
            this.statusTxt.innerText = `Status: Terminated (Cycle Detected)`;
        }
        
        document.getElementById('btn-play').innerHTML = '<i class="fas fa-check"></i> Done';
        document.getElementById('btn-play').disabled = true;
        document.getElementById('btn-step').disabled = true;
        this.animating = false;
    }

    togglePlay() {
        this.animating = !this.animating;
        const btnPlay = document.getElementById('btn-play');
        btnPlay.innerHTML = this.animating ? '<i class="fas fa-pause"></i> Pause' : '<i class="fas fa-play"></i> Auto Run';
        if (this.animating) this.autoStep();
    }

    step() {
        if (!this.generator) {
            this.generator = this.kahnAlgorithm();
        }

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
            this.timer = setTimeout(() => this.autoStep(), 1200); // Educational pacing
        }
    }

    // --- Canvas Drawing Helpers ---
    getScaled(val, isX) {
        // Map 900x600 virtual box to physical canvas limits
        const s = isX ? this.canvas.width / 900 : this.canvas.height / 600;
        return val * s;
    }

    drawArrow(fromX, fromY, toX, toY, color, width) {
        const headlen = 12;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);
        
        // Adjust points to snap to radius bounds, not center
        const r = 22; 
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < r * 2) return; // Prevent drawing if nodes overlap weirdly

        const startX = fromX + r * (dx/dist);
        const startY = fromY + r * (dy/dist);
        const endX = toX - r * (dx/dist);
        const endY = toY - r * (dy/dist);

        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.lineTo(endX, endY);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    renderLoop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Edges
        this.edges.forEach(edge => {
            if (!edge.active) return;
            const u = this.nodes[edge.u];
            const v = this.nodes[edge.v];
            
            const sx = this.getScaled(u.x, true);
            const sy = this.getScaled(u.y, false);
            const tx = this.getScaled(v.x, true);
            const ty = this.getScaled(v.y, false);

            const color = edge.highlighting ? COLORS.edgeHighlight : COLORS.edgeActive;
            const width = edge.highlighting ? 3 : 1.5;
            this.drawArrow(sx, sy, tx, ty, color, width);
        });

        // Nodes
        this.nodes.forEach(node => {
            const x = this.getScaled(node.x, true);
            const y = this.getScaled(node.y, false);

            this.ctx.beginPath();
            this.ctx.arc(x, y, node.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = COLORS.nodeBase;
            this.ctx.fill();

            this.ctx.lineWidth = 2;
            if (node.status === 'processing') {
                this.ctx.strokeStyle = COLORS.nodeProcessing;
                this.ctx.shadowColor = COLORS.nodeProcessing;
                this.ctx.shadowBlur = 15;
            } else if (node.status === 'finished') {
                this.ctx.strokeStyle = COLORS.nodeFinished;
                this.ctx.setLineDash([4, 4]);
            } else {
                this.ctx.strokeStyle = COLORS.nodeBorder;
            }
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
            this.ctx.setLineDash([]);

            // Label
            this.ctx.fillStyle = COLORS.textMain;
            this.ctx.font = '14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.label, x, y);

            // In-Degree Badge
            if (node.status !== 'finished') {
                this.ctx.beginPath();
                this.ctx.arc(x + 18, y - 18, 10, 0, Math.PI * 2);
                this.ctx.fillStyle = node.inDegree === 0 ? COLORS.badgeZero : COLORS.badgeBg;
                this.ctx.fill();
                
                this.ctx.fillStyle = COLORS.textMain;
                this.ctx.font = '10px Inter';
                this.ctx.fillText(node.inDegree, x + 18, y - 18);
            }
        });

        requestAnimationFrame(() => this.renderLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new TopologicalSortVisualizer();
});
