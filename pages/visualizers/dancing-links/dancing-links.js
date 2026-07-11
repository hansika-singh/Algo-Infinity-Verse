/**
 * Dancing Links (DLX) Visualizer Engine
 * Vanilla JS DOM implementation of Algorithm X.
 */

// Node structure for the Toroidal Doubly Linked List
class Node {
    constructor(row, col) {
        this.left = this;
        this.right = this;
        this.up = this;
        this.down = this;
        this.column = null; // Pointer to Column Header
        
        // Metadata for rendering
        this.rowIdx = row; 
        this.colIdx = col;
        this.domElement = null;
    }
}

class ColumnNode extends Node {
    constructor(name, colIdx) {
        super(-1, colIdx);
        this.size = 0;
        this.name = name;
        this.column = this;
    }
}

class DLXVisualizer {
    constructor() {
        this.matrixContainer = document.getElementById('matrix-container');
        this.btnPlay = document.getElementById('btn-play');
        this.btnStep = document.getElementById('btn-step');
        this.btnReset = document.getElementById('btn-reset');
        this.statusText = document.getElementById('status-text');
        this.speedSlider = document.getElementById('speed-slider');
        this.speedVal = document.getElementById('speed-val');
        this.solutionStackDom = document.getElementById('solution-stack');

        this.animSpeed = 1.0;
        this.isPlaying = false;
        this.generator = null;
        this.autoPlayTimeout = null;
        
        this.root = null; // Root node (head)
        this.nodes = [];  // Flat array for rendering reference
        this.solution = [];
        
        // Simplified Exact Cover Problem (Binary Matrix)
        // Rows represent options, Cols represent constraints
        this.baseMatrix = [
            [0, 0, 1, 0, 1, 1, 0], // R1
            [1, 0, 0, 1, 0, 0, 1], // R2
            [0, 1, 1, 0, 0, 1, 0], // R3
            [1, 0, 0, 1, 0, 0, 0], // R4
            [0, 1, 0, 0, 0, 0, 1], // R5
            [0, 0, 0, 1, 1, 0, 1]  // R6
        ];
        this.numCols = this.baseMatrix[0].length;
        this.numRows = this.baseMatrix.length;

        this.init();
    }

    init() {
        this.bindEvents();
        this.resetEngine();
    }

    bindEvents() {
        this.btnPlay.addEventListener('click', () => {
            if (this.isPlaying) this.pauseAutoPlay();
            else this.startAutoPlay();
        });
        this.btnStep.addEventListener('click', () => {
            this.pauseAutoPlay();
            this.stepForward();
        });
        this.btnReset.addEventListener('click', () => {
            this.pauseAutoPlay();
            this.resetEngine();
        });
        this.speedSlider.addEventListener('input', (e) => {
            this.animSpeed = parseFloat(e.target.value);
            this.speedVal.textContent = `${this.animSpeed.toFixed(1)}x`;
        });
    }

    /* --- Data Structure Construction --- */
    
    buildToroidalGrid() {
        this.root = new ColumnNode("h", -1);
        this.nodes = [this.root];
        
        const colHeaders = [];
        
        // Build Column Headers
        for (let j = 0; j < this.numCols; j++) {
            const cNode = new ColumnNode(`C${j+1}`, j);
            colHeaders.push(cNode);
            this.nodes.push(cNode);
            
            // Link right
            cNode.right = this.root;
            cNode.left = this.root.left;
            this.root.left.right = cNode;
            this.root.left = cNode;
        }

        // Build Rows
        for (let i = 0; i < this.numRows; i++) {
            let rowStart = null;
            for (let j = 0; j < this.numCols; j++) {
                if (this.baseMatrix[i][j] === 1) {
                    const node = new Node(i, j);
                    const colHead = colHeaders[j];
                    node.column = colHead;
                    this.nodes.push(node);
                    
                    // Insert into column (link Up/Down)
                    node.down = colHead;
                    node.up = colHead.up;
                    colHead.up.down = node;
                    colHead.up = node;
                    colHead.size++;

                    // Insert into row (link Left/Right)
                    if (rowStart) {
                        node.right = rowStart;
                        node.left = rowStart.left;
                        rowStart.left.right = node;
                        rowStart.left = node;
                    } else {
                        rowStart = node;
                    }
                }
            }
        }
    }

    /* --- DOM Rendering --- */

    renderGridDOM() {
        this.matrixContainer.innerHTML = '';
        // Grid Template: +1 for header row, +1 for row labels (optional, we'll just align by matrix dimensions)
        this.matrixContainer.style.gridTemplateColumns = `repeat(${this.numCols}, 40px)`;
        this.matrixContainer.style.gridTemplateRows = `40px repeat(${this.numRows}, 40px)`;

        // Create a 2D array representing physical space
        const visualGrid = Array.from({ length: this.numRows + 1 }, () => Array(this.numCols).fill(null));
        
        // Populate visual grid
        this.nodes.forEach(n => {
            if (n === this.root) return; // Root handled separately if needed
            let r = n.rowIdx + 1; // offset header
            let c = n.colIdx;
            visualGrid[r][c] = n;
        });

        // Generate DOM elements
        for (let r = 0; r <= this.numRows; r++) {
            for (let c = 0; c < this.numCols; c++) {
                const node = visualGrid[r][c];
                const div = document.createElement('div');
                div.className = 'dlx-node';
                
                if (node) {
                    node.domElement = div;
                    if (r === 0) {
                        div.classList.add('dlx-header');
                        div.textContent = node.name;
                    } else {
                        div.textContent = `1`;
                    }
                } else {
                    div.classList.add('dlx-empty'); // Spacer to keep grid aligned
                }
                this.matrixContainer.appendChild(div);
            }
        }
    }

    /* --- Algorithm Engine (Generators) --- */

    *algorithmX(k) {
        // If R[h] = h, print solution and return
        if (this.root.right === this.root) {
            yield { type: 'solution', msg: `Solution Found!`, phase: 'solution', stack: [...this.solution] };
            return true;
        }

        // Choose a column object c (MRV heuristic: lowest size)
        let c = this.root.right;
        let minSize = c.size;
        for (let j = c.right; j !== this.root; j = j.right) {
            if (j.size < minSize) {
                minSize = j.size;
                c = j;
            }
        }

        // Cover column c
        yield* this.cover(c);

        for (let r = c.down; r !== c; r = r.down) {
            this.solution.push(r.rowIdx);
            yield { type: 'select', msg: `Selecting Row R${r.rowIdx + 1}`, phase: 'cover', node: r, stack: [...this.solution] };

            for (let j = r.right; j !== r; j = j.right) {
                yield* this.cover(j.column);
            }

            // Recurse
            let found = yield* this.algorithmX(k + 1);
            if (found) return true; // Stop after first solution for visualizer

            // Backtrack
            this.solution.pop();
            yield { type: 'backtrack', msg: `Dead end. Backtracking from Row R${r.rowIdx + 1}`, phase: 'uncover', node: r, stack: [...this.solution] };

            for (let j = r.left; j !== r; j = j.left) {
                yield* this.uncover(j.column);
            }
        }

        yield* this.uncover(c);
        return false;
    }

    *cover(c) {
        yield { type: 'cover_col', msg: `Covering Column ${c.name}`, phase: 'cover', node: c };
        
        // Remove c from header list
        c.right.left = c.left;
        c.left.right = c.right;
        if(c.domElement) c.domElement.classList.add('node-hidden');

        for (let i = c.down; i !== c; i = i.down) {
            for (let j = i.right; j !== i; j = j.right) {
                // Remove j from its column
                j.down.up = j.up;
                j.up.down = j.down;
                j.column.size--;
                if(j.domElement) {
                    j.domElement.classList.add('node-hidden');
                    j.domElement.classList.add('node-active-cover');
                    setTimeout(()=> j.domElement.classList.remove('node-active-cover'), 300);
                }
            }
        }
    }

    *uncover(c) {
        yield { type: 'uncover_col', msg: `Uncovering (Restoring) Column ${c.name}`, phase: 'uncover', node: c };
        
        for (let i = c.up; i !== c; i = i.up) {
            for (let j = i.left; j !== i; j = j.left) {
                // Restore j
                j.column.size++;
                j.down.up = j;
                j.up.down = j;
                if(j.domElement) {
                    j.domElement.classList.remove('node-hidden');
                    j.domElement.classList.add('node-active-uncover');
                    setTimeout(()=> j.domElement.classList.remove('node-active-uncover'), 300);
                }
            }
        }
        
        // Restore c to header list
        c.right.left = c;
        c.left.right = c;
        if(c.domElement) c.domElement.classList.remove('node-hidden');
    }

    /* --- Controllers & UI --- */

    resetEngine() {
        this.solution = [];
        this.buildToroidalGrid();
        this.renderGridDOM();
        
        this.generator = this.algorithmX(0);
        this.updateStatus('Matrix initialized. Ready for DLX.', '');
        this.renderStack([]);
        
        this.btnStep.disabled = false;
        this.btnPlay.disabled = false;
        
        // Clear Highlights
        document.querySelectorAll('.phase-item').forEach(el => el.classList.remove('active-phase'));
    }

    stepForward() {
        if (!this.generator) return;
        const { value, done } = this.generator.next();

        if (done) {
            this.pauseAutoPlay();
            this.btnStep.disabled = true;
            this.btnPlay.disabled = true;
            return;
        }
        this.applyState(value);
    }

    applyState(state) {
        if (!state) return;

        this.updateStatus(state.msg, state.phase);
        if (state.stack) this.renderStack(state.stack);

        // Optional: Highlight the primary node acting in this step
        if (state.node && state.node.domElement) {
            const classToAdd = state.phase === 'cover' ? 'node-active-cover' : 'node-active-uncover';
            state.node.domElement.classList.add(classToAdd);
            setTimeout(() => {
                if(state.node.domElement) state.node.domElement.classList.remove(classToAdd);
            }, Math.max(100, 800 / this.animSpeed));
        }
    }

    renderStack(stackData) {
        if (stackData.length === 0) {
            this.solutionStackDom.innerHTML = '<span class="empty-stream">Stack is empty...</span>';
            return;
        }
        this.solutionStackDom.innerHTML = stackData.map(rIdx => 
            `<span class="stack-node">R${rIdx + 1}</span>`
        ).join('<i class="fa-solid fa-arrow-right text-secondary" style="font-size: 0.7rem; align-self: center;"></i>');
    }

    updateStatus(msg, phaseStr) {
        this.statusText.textContent = msg;
        document.querySelectorAll('.phase-item').forEach(el => el.classList.remove('active-phase'));
        if (phaseStr) {
            const el = document.getElementById(`phase-${phaseStr}`);
            if (el) el.classList.add('active-phase');
        }
    }

    startAutoPlay() {
        this.isPlaying = true;
        this.btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        this.btnPlay.classList.replace('btn-primary', 'btn-accent');
        
        const tick = () => {
            if (!this.isPlaying) return;
            this.stepForward();
            if (this.btnStep.disabled) {
                this.pauseAutoPlay();
                return;
            }
            const delay = Math.max(100, 1000 / this.animSpeed);
            this.autoPlayTimeout = setTimeout(tick, delay);
        };
        tick();
    }

    pauseAutoPlay() {
        this.isPlaying = false;
        clearTimeout(this.autoPlayTimeout);
        this.btnPlay.innerHTML = '<i class="fa-solid fa-play"></i> Auto Play';
        this.btnPlay.classList.replace('btn-accent', 'btn-primary');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DLXVisualizer();
});
