/**
 * Grid Optimization - A* (A-Star) Pathfinding Engine
 * Dynamic DOM Grid with interactive wall-painting and node-dragging mechanics.
 * F = G + H telemetry injected directly into evaluated cells.
 */

class GridNode {
    constructor(row, col) {
        this.r = row;
        this.c = col;
        this.id = `node-${row}-${col}`;
        this.type = 'empty'; // empty, wall, start, target
        
        // A* State
        this.g = Infinity;
        this.h = 0;
        this.f = Infinity;
        this.parent = null;
        this.isOpen = false;
        this.isClosed = false;
        
        // DOM Ref
        this.domEl = null;
    }
}

class AStarVisualizer {
    constructor() {
        this.gridContainer = document.getElementById('grid-container');
        this.mathPanel = document.getElementById('math-overlay');
        this.mathEq = document.getElementById('math-equation');
        this.statusTxt = document.getElementById('main-status');
        
        this.btnPlay = document.getElementById('btn-play');
        this.btnStep = document.getElementById('btn-step');

        this.rows = 15;
        this.cols = 25;
        this.grid = [];
        
        this.startNode = { r: 7, c: 3 };
        this.targetNode = { r: 7, c: 21 };
        
        // Interactive Mouse States
        this.isMouseDown = false;
        this.dragState = null; // 'start', 'target', 'wall', 'empty'

        // Algorithmic State
        this.animating = false;
        this.generator = null;
        this.timer = null;
        
        this.openSet = [];
        this.closedSet = [];

        this.initGrid();
        this.bindEvents();
    }

    // --- Grid Initialization & DOM Generation ---
    initGrid() {
        this.gridContainer.innerHTML = '';
        this.gridContainer.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        this.grid = [];

        for (let r = 0; r < this.rows; r++) {
            let rowNodes = [];
            for (let c = 0; c < this.cols; c++) {
                let node = new GridNode(r, c);
                if (r === this.startNode.r && c === this.startNode.c) node.type = 'start';
                if (r === this.targetNode.r && c === this.targetNode.c) node.type = 'target';
                
                let el = document.createElement('div');
                el.className = `node ${node.type}`;
                el.id = node.id;
                
                // Add Event Listeners for interactive drawing
                el.addEventListener('mousedown', (e) => this.handleMouseDown(e, node));
                el.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, node));
                
                node.domEl = el;
                this.gridContainer.appendChild(el);
                rowNodes.push(node);
            }
            this.grid.push(rowNodes);
        }
        
        document.addEventListener('mouseup', () => this.isMouseDown = false);
    }

    // --- Interactive Tools ---
    handleMouseDown(e, node) {
        if (this.animating || this.generator) return;
        this.isMouseDown = true;
        
        if (node.type === 'start') this.dragState = 'start';
        else if (node.type === 'target') this.dragState = 'target';
        else {
            this.dragState = node.type === 'empty' ? 'wall' : 'empty';
            this.updateNodeStyle(node, this.dragState);
        }
    }

    handleMouseEnter(e, node) {
        if (!this.isMouseDown || this.animating || this.generator) return;

        if (this.dragState === 'start') {
            if (node.type !== 'target' && node.type !== 'wall') {
                this.updateNodeStyle(this.grid[this.startNode.r][this.startNode.c], 'empty');
                this.startNode = { r: node.r, c: node.c };
                this.updateNodeStyle(node, 'start');
            }
        } else if (this.dragState === 'target') {
            if (node.type !== 'start' && node.type !== 'wall') {
                this.updateNodeStyle(this.grid[this.targetNode.r][this.targetNode.c], 'empty');
                this.targetNode = { r: node.r, c: node.c };
                this.updateNodeStyle(node, 'target');
            }
        } else if (this.dragState === 'wall' || this.dragState === 'empty') {
            if (node.type !== 'start' && node.type !== 'target') {
                this.updateNodeStyle(node, this.dragState);
            }
        }
    }

    updateNodeStyle(node, type) {
        node.type = type;
        node.domEl.className = `node ${type}`;
    }

    bindEvents() {
        document.getElementById('btn-random').addEventListener('click', () => {
            if (this.animating) return;
            this.clearAlgorithmState();
            // Generate Random Obstacles (~30% coverage)
            for(let r=0; r<this.rows; r++) {
                for(let c=0; c<this.cols; c++) {
                    let n = this.grid[r][c];
                    if (n.type !== 'start' && n.type !== 'target') {
                        this.updateNodeStyle(n, Math.random() < 0.3 ? 'wall' : 'empty');
                    }
                }
            }
        });

        document.getElementById('btn-clear').addEventListener('click', () => {
            if (this.animating) return;
            this.clearAlgorithmState();
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            if (this.animating) return;
            this.clearAlgorithmState();
            this.grid.forEach(row => row.forEach(n => {
                if(n.type === 'wall') this.updateNodeStyle(n, 'empty');
            }));
            // Reset to defaults
            this.updateNodeStyle(this.grid[this.startNode.r][this.startNode.c], 'empty');
            this.updateNodeStyle(this.grid[this.targetNode.r][this.targetNode.c], 'empty');
            this.startNode = { r: 7, c: 3 };
            this.targetNode = { r: 7, c: 21 };
            this.updateNodeStyle(this.grid[this.startNode.r][this.startNode.c], 'start');
            this.updateNodeStyle(this.grid[this.targetNode.r][this.targetNode.c], 'target');
        });

        this.btnStep.addEventListener('click', () => this.step());
        this.btnPlay.addEventListener('click', () => this.togglePlay());
    }

    clearAlgorithmState() {
        if (this.timer) clearTimeout(this.timer);
        this.generator = null;
        this.animating = false;
        
        this.openSet = [];
        this.closedSet = [];
        
        this.grid.forEach(row => row.forEach(n => {
            n.g = Infinity; n.h = 0; n.f = Infinity;
            n.parent = null; n.isOpen = false; n.isClosed = false;
            n.domEl.innerHTML = ''; // Clear telemetry
            
            if (n.type === 'empty' || n.type === 'wall' || n.type === 'start' || n.type === 'target') {
                n.domEl.className = `node ${n.type}`;
            }
        }));

        this.btnPlay.innerHTML = '<i class="fas fa-play"></i> Auto Run';
        this.btnPlay.disabled = false;
        this.btnStep.disabled = false;
        this.mathPanel.classList.add('hidden');
        this.highlightCode(null);
        this.updateTelemetry();
        this.statusTxt.innerText = `Status: Grid Cleared`;
    }

    // --- Telemetry & UI Helpers ---
    updateMath(eq) { this.mathEq.innerHTML = eq; this.mathPanel.classList.remove('hidden'); }
    
    highlightCode(stepId) {
        document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active', 'active-cyan', 'active-purple', 'active-green'));
        if (stepId) document.getElementById(stepId).classList.add('active');
    }

    updateTelemetry() {
        document.getElementById('stat-open').innerText = this.openSet.length;
        document.getElementById('stat-closed').innerText = this.closedSet.length;
        
        let minF = Infinity;
        if (this.openSet.length > 0) {
            this.openSet.forEach(n => { if(n.f < minF) minF = n.f; });
            document.getElementById('stat-min-f').innerText = minF;
        } else {
            document.getElementById('stat-min-f').innerText = '—';
        }
    }

    injectNodeMath(node) {
        if (node.type === 'start' || node.type === 'target') return;
        node.domEl.innerHTML = `
            <span class="f-val">${node.f}</span>
            <span class="g-val">${node.g}</span>
            <span class="h-val">${node.h}</span>
        `;
    }

    // --- A* Algorithm Core ---
    manhattan(nodeA, nodeB) {
        return Math.abs(nodeA.r - nodeB.r) + Math.abs(nodeA.c - nodeB.c);
    }

    getNeighbors(node) {
        let neighbors = [];
        let dirs = [[-1,0], [1,0], [0,-1], [0,1]]; // Up, Down, Left, Right
        
        for (let d of dirs) {
            let nr = node.r + d[0];
            let nc = node.c + d[1];
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                neighbors.push(this.grid[nr][nc]);
            }
        }
        return neighbors;
    }

    *runAStar() {
        this.highlightCode('as-1');
        let start = this.grid[this.startNode.r][this.startNode.c];
        let target = this.grid[this.targetNode.r][this.targetNode.c];
        
        start.g = 0;
        start.h = this.manhattan(start, target);
        start.f = start.g + start.h;
        
        this.highlightCode('as-2');
        this.openSet.push(start);
        start.isOpen = true;
        this.updateTelemetry();
        this.updateMath(`Adding Start Node to Open Set. H-Cost = ${start.h}`);
        yield;

        while (this.openSet.length > 0) {
            this.highlightCode('as-3');
            yield;

            this.highlightCode('as-4');
            // Find lowest F. Tie-break using H (closer to target)
            let lowestIdx = 0;
            for (let i = 1; i < this.openSet.length; i++) {
                if (this.openSet[i].f < this.openSet[lowestIdx].f || 
                   (this.openSet[i].f === this.openSet[lowestIdx].f && this.openSet[i].h < this.openSet[lowestIdx].h)) {
                    lowestIdx = i;
                }
            }
            
            let curr = this.openSet[lowestIdx];
            curr.domEl.classList.add('evaluating');
            this.updateMath(`Selected lowest F: <span class="eq-hl">${curr.f}</span> (G:${curr.g} + H:${curr.h})`);
            yield;

            this.highlightCode('as-5');
            if (curr === target) {
                this.updateMath(`Target Reached! Reconstructing Path.`);
                curr.domEl.classList.remove('evaluating');
                yield* this.reconstructPath(curr);
                return;
            }
            yield;

            this.highlightCode('as-6');
            this.openSet.splice(lowestIdx, 1);
            curr.isOpen = false;
            curr.isClosed = true;
            this.closedSet.push(curr);
            
            curr.domEl.classList.remove('evaluating');
            if (curr !== start) curr.domEl.className = 'node closed';
            this.updateTelemetry();
            yield;

            this.highlightCode('as-7');
            let neighbors = this.getNeighbors(curr);
            yield;

            for (let neighbor of neighbors) {
                this.highlightCode('as-8');
                if (neighbor.type === 'wall' || neighbor.isClosed) continue;

                this.highlightCode('as-9');
                let tempG = curr.g + 1; // Assuming cost between neighbors is 1

                this.highlightCode('as-10');
                if (tempG < neighbor.g || !neighbor.isOpen) {
                    this.highlightCode('as-11');
                    neighbor.g = tempG;
                    
                    this.highlightCode('as-12');
                    neighbor.h = this.manhattan(neighbor, target);
                    
                    this.highlightCode('as-13');
                    neighbor.f = neighbor.g + neighbor.h;
                    
                    this.highlightCode('as-14');
                    neighbor.parent = curr;
                    
                    this.highlightCode('as-15');
                    if (!neighbor.isOpen) {
                        this.openSet.push(neighbor);
                        neighbor.isOpen = true;
                        if (neighbor !== target) neighbor.domEl.className = 'node open';
                    }
                    
                    this.injectNodeMath(neighbor);
                    this.updateMath(`Updated Neighbor: F = <span class="eq-hl">${neighbor.f}</span> (G:${neighbor.g} + H:${neighbor.h})`);
                    this.updateTelemetry();
                    yield;
                }
            }
        }

        this.highlightCode(null);
        this.statusTxt.innerText = `Status: Terminated. Target is unreachable.`;
        this.updateMath(`<span class="eq-err">Open Set is empty. No valid path exists.</span>`);
        this.btnPlay.innerHTML = '<i class="fas fa-check"></i> Done';
        this.btnPlay.disabled = true;
        this.btnStep.disabled = true;
        this.animating = false;
    }

    *reconstructPath(curr) {
        let path = [];
        let temp = curr;
        while (temp.parent) {
            path.push(temp.parent);
            temp = temp.parent;
        }
        
        // Reverse to animate from Start to Target
        path.reverse();
        
        this.statusTxt.innerText = `Status: Path Found (Length: ${path.length})`;
        
        for (let i = 1; i < path.length; i++) { // Skip start node
            let node = path[i];
            node.domEl.className = 'node path';
            node.domEl.innerHTML = ''; // Clear math telemetry for clean path
            yield;
        }
        
        this.highlightCode(null);
        this.mathPanel.classList.add('hidden');
        this.btnPlay.innerHTML = '<i class="fas fa-check"></i> Done';
        this.btnPlay.disabled = true;
        this.btnStep.disabled = true;
        this.animating = false;
    }

    // --- Control Flow ---
    startAlgorithm() {
        if (this.animating) return;
        
        // Soft clear: remove algorithm states but keep walls/start/target
        this.clearAlgorithmState();
        
        this.generator = this.runAStar();
        this.animating = true;
        
        this.btnPlay.innerHTML = '<i class="fas fa-pause"></i> Pause';
        this.btnPlay.disabled = false;
        this.btnStep.disabled = false;
        
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
            this.timer = setTimeout(() => this.autoStep(), 150); // Fast pacing for grid expansions
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new AStarVisualizer();
});
