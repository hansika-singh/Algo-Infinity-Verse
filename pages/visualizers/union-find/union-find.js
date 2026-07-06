/**
 * Graph Connectivity - Union-Find (Disjoint Set) Engine
 * Implements Path Compression and Union by Rank.
 * Features a Dual-Architecture: Canvas Fluid Tree Layout + Synchronized DOM Array mapping.
 */

const COLORS = {
    nodeBg: '#1e293b',
    nodeBorder: '#334155',
    textMain: '#ffffff',
    edge: '#475569',
    edgeActive: '#06b6d4',
    edgeCompress: '#a855f7',
    edgeSuccess: '#10b981'
};

class UFNode {
    constructor(id) {
        this.id = id;
        this.parent = id;
        this.rank = 0;
        
        // Fluid Layout Properties
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        
        // Visual States
        this.isEvaluating = false;
        this.isRoot = true;
    }
}

class UnionFindVisualizer {
    constructor() {
        this.canvas = document.getElementById('viz-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.mathPanel = document.getElementById('math-overlay');
        this.mathEq = document.getElementById('math-equation');
        this.statusTxt = document.getElementById('main-status');

        this.n = 10; // Fixed 10 elements for clarity (0-9)
        this.nodes = [];
        this.componentsCount = this.n;
        
        this.animating = false;
        this.generator = null;
        this.timer = null;
        this.operationQueue = []; // Used to track recursive paths

        this.bindEvents();
        this.initDataStructure();
        
        // Ensure DOM is ready for initial size
        setTimeout(() => {
            this.resize();
            this.calculateTreeLayout();
            this.renderLoop();
        }, 50);
        
        window.addEventListener('resize', () => { 
            this.resize(); 
            this.calculateTreeLayout(); 
        });
    }

    bindEvents() {
        document.getElementById('btn-union').addEventListener('click', () => {
            const u = parseInt(document.getElementById('input-u').value, 10);
            const v = parseInt(document.getElementById('input-v').value, 10);
            if (!isNaN(u) && !isNaN(v) && u >= 0 && u < this.n && v >= 0 && v < this.n) {
                if (!this.animating) this.startAlgorithm(this.unionAlgo(u, v), 'Union');
            } else {
                this.updateMath(`<span class="eq-err">Error: Inputs must be between 0 and 9.</span>`);
            }
        });

        document.getElementById('btn-find').addEventListener('click', () => {
            const x = parseInt(document.getElementById('input-find').value, 10);
            if (!isNaN(x) && x >= 0 && x < this.n) {
                if (!this.animating) this.startAlgorithm(this.findAlgo(x, true), 'Find');
            }
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            if (!this.animating) this.initDataStructure();
        });

        document.getElementById('btn-step').addEventListener('click', () => this.step());
        document.getElementById('btn-play').addEventListener('click', () => this.togglePlay());
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    initDataStructure() {
        this.nodes = [];
        this.componentsCount = this.n;
        
        const idxContainer = document.getElementById('index-array');
        const pContainer = document.getElementById('parent-array');
        const rContainer = document.getElementById('rank-array');
        
        idxContainer.innerHTML = '';
        pContainer.innerHTML = '';
        rContainer.innerHTML = '';

        for (let i = 0; i < this.n; i++) {
            this.nodes.push(new UFNode(i));
            
            // Build DOM Arrays
            this.injectArrayCell(idxContainer, `idx-${i}`, i, 'idx');
            this.injectArrayCell(pContainer, `arr-p-${i}`, i, '');
            this.injectArrayCell(rContainer, `arr-r-${i}`, 0, '');
        }

        this.updateStatus(`Status: Forest Initialized | Components: ${this.componentsCount}`);
        this.calculateTreeLayout(true); // true = force instant position
    }

    injectArrayCell(container, id, val, extraClass) {
        const cell = document.createElement('div');
        cell.className = `array-cell ${extraClass}`;
        cell.id = id;
        cell.innerText = val;
        container.appendChild(cell);
    }

    updateArrayCell(type, index, val, colorClass) {
        const cell = document.getElementById(`arr-${type}-${index}`);
        if (cell) {
            cell.innerText = val;
            cell.className = `array-cell ${colorClass}`;
        }
    }

    clearArrayHighlights() {
        for (let i = 0; i < this.n; i++) {
            const p = document.getElementById(`arr-p-${i}`);
            const r = document.getElementById(`arr-r-${i}`);
            if (p) p.className = 'array-cell';
            if (r) r.className = 'array-cell';
        }
    }

    updateStatus(msg) {
        this.statusTxt.innerText = msg;
    }

    updateMath(equation) {
        this.mathEq.innerHTML = equation;
        this.mathPanel.classList.remove('hidden');
    }

    highlightCode(stepId, mode) {
        document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active', 'active-purple', 'active-green'));
        document.getElementById('pseudo-union').classList.add('hidden');
        document.getElementById('pseudo-find').classList.add('hidden');
        
        if (mode === 'Union') document.getElementById('pseudo-union').classList.remove('hidden');
        if (mode === 'Find') document.getElementById('pseudo-find').classList.remove('hidden');
        
        if (stepId) document.getElementById(stepId).classList.add('active');
    }

    // --- Dynamic Hierarchical Fluid Layout ---
    calculateTreeLayout(instant = false) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Find all distinct roots
        let roots = [];
        for (let i = 0; i < this.n; i++) {
            if (this.nodes[i].parent === i) roots.push(i);
        }

        const sectionWidth = w / roots.length;
        const verticalSpacing = 70;

        roots.forEach((rootId, rIndex) => {
            const baseX = (rIndex * sectionWidth) + (sectionWidth / 2);
            
            // Build tree topology for this root to calculate widths
            const childrenMap = new Map();
            for(let i=0; i<this.n; i++) childrenMap.set(i, []);
            for(let i=0; i<this.n; i++) {
                if (this.nodes[i].parent !== i) {
                    childrenMap.get(this.nodes[i].parent).push(i);
                }
            }

            // Assign coords via BFS/DFS
            const queue = [{ id: rootId, depth: 0, x: baseX, w: sectionWidth }];
            
            while (queue.length > 0) {
                const curr = queue.shift();
                const node = this.nodes[curr.id];
                
                node.targetX = curr.x;
                node.targetY = 40 + (curr.depth * verticalSpacing);
                if (instant) {
                    node.x = node.targetX;
                    node.y = node.targetY;
                }

                const children = childrenMap.get(curr.id);
                if (children.length > 0) {
                    const childSpace = curr.w / children.length;
                    const startX = curr.x - (curr.w / 2) + (childSpace / 2);
                    children.forEach((childId, cIndex) => {
                        queue.push({
                            id: childId,
                            depth: curr.depth + 1,
                            x: startX + (cIndex * childSpace),
                            w: childSpace
                        });
                    });
                }
            }
        });
    }

    // --- Algorithms as Generators ---
    
    // Internal generator for Find (used by both Union and standalone Find)
    *findRoutine(x, isStandalone) {
        let path = [];
        let curr = x;
        
        this.updateMath(`Finding root of Node <span class="eq-hl">${x}</span>...`);
        this.highlightCode('fd-1', 'Find');
        
        while (this.nodes[curr].parent !== curr) {
            path.push(curr);
            this.nodes[curr].isEvaluating = true;
            this.updateArrayCell('p', curr, this.nodes[curr].parent, 'active-cyan');
            
            this.highlightCode('fd-4', 'Find');
            this.updateMath(`parent[${curr}] = ${this.nodes[curr].parent}. Recursing upward.`);
            yield;
            
            curr = this.nodes[curr].parent;
        }

        const root = curr;
        this.nodes[root].isEvaluating = true;
        this.updateArrayCell('p', root, root, 'active-green');
        
        this.highlightCode('fd-2', 'Find');
        this.updateMath(`Root found: <span class="eq-ok">${root}</span>`);
        yield;

        // Path Compression
        if (path.length > 0) {
            this.highlightCode('fd-5', 'Find');
            this.updateMath(`<span class="eq-p">Applying Path Compression...</span>`);
            yield;

            for (let i = 0; i < path.length; i++) {
                const node = path[i];
                // Only animate if it actually changes (isn't already pointing to root)
                if (this.nodes[node].parent !== root) {
                    this.nodes[node].parent = root;
                    this.updateArrayCell('p', node, root, 'active-purple');
                }
            }
            
            // Recalculate physical graph layout
            this.calculateTreeLayout();
            this.updateMath(`All nodes on path now point directly to Root <span class="eq-ok">${root}</span>.`);
            yield;
        } else {
            this.updateMath(`Path already compressed. Parent == Root.`);
            yield;
        }

        // Cleanup visuals
        path.forEach(n => this.nodes[n].isEvaluating = false);
        this.nodes[root].isEvaluating = false;
        
        return root;
    }

    *findAlgo(x) {
        this.updateStatus(`Status: Executing Find(${x})`);
        yield* this.findRoutine(x, true);
        
        this.clearArrayHighlights();
        this.updateStatus(`Status: Find Complete | Components: ${this.componentsCount}`);
    }

    *unionAlgo(u, v) {
        this.updateStatus(`Status: Executing Union(${u}, ${v})`);
        
        // Swap to Union Pseudocode, but Find routines will briefly hijack it
        this.highlightCode('un-1', 'Union');
        const rootU = yield* this.findRoutine(u, false);
        
        this.highlightCode('un-2', 'Union');
        const rootV = yield* this.findRoutine(v, false);

        this.highlightCode('un-3', 'Union');
        if (rootU === rootV) {
            this.updateMath(`rootU (${rootU}) == rootV (${rootV}). <span class="eq-err">Already in same set.</span>`);
            yield;
        } else {
            const rankU = this.nodes[rootU].rank;
            const rankV = this.nodes[rootV].rank;
            
            this.updateArrayCell('r', rootU, rankU, 'active-cyan');
            this.updateArrayCell('r', rootV, rankV, 'active-cyan');
            this.updateMath(`Comparing Ranks: rank[${rootU}]=${rankU}, rank[${rootV}]=${rankV}`);
            yield;

            // Union By Rank
            if (rankU > rankV) {
                this.highlightCode('un-4', 'Union');
                yield;
                
                this.highlightCode('un-5', 'Union');
                this.nodes[rootV].parent = rootU;
                this.updateArrayCell('p', rootV, rootU, 'active-green');
                this.updateMath(`rank[${rootU}] > rank[${rootV}]. Attaching ${rootV} under ${rootU}.`);
                
            } else if (rankU < rankV) {
                this.highlightCode('un-6', 'Union');
                yield;

                this.highlightCode('un-7', 'Union');
                this.nodes[rootU].parent = rootV;
                this.updateArrayCell('p', rootU, rootV, 'active-green');
                this.updateMath(`rank[${rootU}] < rank[${rootV}]. Attaching ${rootU} under ${rootV}.`);
                
            } else {
                this.highlightCode('un-8', 'Union');
                yield;

                this.highlightCode('un-9', 'Union');
                this.nodes[rootV].parent = rootU;
                this.updateArrayCell('p', rootV, rootU, 'active-green');
                this.updateMath(`Ranks equal. Attaching ${rootV} under ${rootU}.`);
                yield;
                
                this.highlightCode('un-10', 'Union');
                this.nodes[rootU].rank++;
                this.updateArrayCell('r', rootU, this.nodes[rootU].rank, 'active-purple');
                this.updateMath(`Incrementing rank[${rootU}] to <span class="eq-p">${this.nodes[rootU].rank}</span>.`);
            }
            
            this.componentsCount--;
            this.calculateTreeLayout();
            yield;
        }

        this.clearArrayHighlights();
        this.highlightCode(null, 'Union');
        this.updateStatus(`Status: Union Complete | Components: ${this.componentsCount}`);
    }

    // --- Control Flow ---
    startAlgorithm(generator, mode) {
        if (this.animating) return;
        
        this.clearArrayHighlights();
        this.generator = generator;
        this.animating = true;
        
        const btnPlay = document.getElementById('btn-play');
        btnPlay.innerHTML = '<i class="fas fa-pause"></i> Pause';
        btnPlay.disabled = false;
        document.getElementById('btn-step').disabled = false;
        
        this.autoStep();
    }

    togglePlay() {
        this.animating = !this.animating;
        const btnPlay = document.getElementById('btn-play');
        btnPlay.innerHTML = this.animating ? '<i class="fas fa-pause"></i> Pause' : '<i class="fas fa-play"></i> Auto Run';
        if (this.animating) this.autoStep();
    }

    step() {
        if (!this.generator) return false;
        const res = this.generator.next();
        
        if (res.done) {
            this.generator = null;
            this.animating = false;
            document.getElementById('btn-play').innerHTML = '<i class="fas fa-check"></i> Done';
            document.getElementById('btn-play').disabled = true;
            document.getElementById('btn-step').disabled = true;
            setTimeout(() => { this.mathPanel.classList.add('hidden'); }, 3000);
            return false;
        }
        return true;
    }

    autoStep() {
        if (!this.animating) return;
        const hasNext = this.step();
        if (hasNext) {
            this.timer = setTimeout(() => this.autoStep(), 1200); // 1.2s per algorithmic yield
        }
    }

    // --- Canvas Drawing ---
    drawArrow(fromX, fromY, toX, toY, color) {
        const headlen = 10;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);
        
        // Stop exactly at node border (r=18)
        const r = 18; 
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < r * 2) return;

        const startX = fromX + r * (dx/dist);
        const startY = fromY + r * (dy/dist);
        const endX = toX - r * (dx/dist);
        const endY = toY - r * (dy/dist);

        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
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

        // Physics/Interpolation Step for smooth layout transitions
        this.nodes.forEach(node => {
            node.x += (node.targetX - node.x) * 0.15;
            node.y += (node.targetY - node.y) * 0.15;
        });

        // Draw Edges (Node to Parent)
        this.nodes.forEach(node => {
            if (node.parent !== node.id) {
                const parent = this.nodes[node.parent];
                let edgeColor = COLORS.edge;
                if (node.isEvaluating || parent.isEvaluating) edgeColor = COLORS.edgeActive;
                this.drawArrow(node.x, node.y, parent.x, parent.y, edgeColor);
            }
        });

        // Draw Nodes
        this.nodes.forEach(node => {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, 18, 0, Math.PI * 2);
            this.ctx.fillStyle = COLORS.nodeBg;
            this.ctx.fill();
            
            this.ctx.lineWidth = 2;
            if (node.isEvaluating) {
                this.ctx.strokeStyle = COLORS.edgeActive;
                this.ctx.shadowColor = COLORS.edgeActive;
                this.ctx.shadowBlur = 10;
            } else if (node.parent === node.id) {
                this.ctx.strokeStyle = COLORS.edgeSuccess; // Roots are green
            } else {
                this.ctx.strokeStyle = COLORS.nodeBorder;
            }
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            this.ctx.fillStyle = COLORS.textMain;
            this.ctx.font = '14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.id, node.x, node.y);
        });

        requestAnimationFrame(() => this.renderLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new UnionFindVisualizer();
});
