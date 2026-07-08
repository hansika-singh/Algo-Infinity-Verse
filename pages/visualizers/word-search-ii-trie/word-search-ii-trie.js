/**
 * Word Search II Visualizer
 * Synchronizes a 2D Backtracking DFS (DOM) with a Prefix Tree (Canvas)
 */

class TrieNode {
    constructor(char) {
        this.char = char;
        this.children = {};
        this.isWord = false;
        this.fullWord = null;
        
        // Canvas rendering physics
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        
        // Status tracking
        this.isActive = false;
        this.isFound = false;
    }
    
    updatePhysics(speed = 0.15) {
        this.x += (this.targetX - this.x) * speed;
        this.y += (this.targetY - this.y) * speed;
    }
}

class WordSearchVisualizer {
    constructor() {
        // UI Inputs & Controls
        this.inputWords = document.getElementById('input-words');
        this.btnBuild = document.getElementById('btn-build');
        this.btnPlay = document.getElementById('btn-play');
        this.btnStep = document.getElementById('btn-step');
        this.btnReset = document.getElementById('btn-reset');
        this.speedSlider = document.getElementById('speed-slider');
        this.statusText = document.getElementById('status-text');
        
        // Telemetry
        this.valPruned = document.getElementById('val-pruned');
        this.valFound = document.getElementById('val-found');

        // Containers
        this.gridContainer = document.getElementById('grid-container');
        this.canvas = document.getElementById('trie-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Hardcoded Board for consistent testing
        this.boardStr = [
            ['o','a','a','n'],
            ['e','t','a','e'],
            ['i','h','k','r'],
            ['i','f','l','v']
        ];
        
        this.ROWS = this.boardStr.length;
        this.COLS = this.boardStr[0].length;
        this.domGrid = [];
        
        // Engine State
        this.trieRoot = null;
        this.allTrieNodes = [];
        this.foundWordsSet = new Set();
        this.pruneCount = 0;
        
        this.generator = null;
        this.isPlaying = false;
        this.animSpeed = 1.0;
        this.autoPlayTimeout = null;
        this.animationFrameId = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.renderInitialGrid();
        this.buildSystem(); // Build default Trie
        this.startRenderLoop();
    }

    bindEvents() {
        this.btnBuild.addEventListener('click', () => this.buildSystem());
        
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
            this.buildSystem();
        });
        
        this.speedSlider.addEventListener('input', (e) => {
            this.animSpeed = parseFloat(e.target.value);
            document.getElementById('speed-val').textContent = `${this.animSpeed.toFixed(1)}x`;
        });
    }

    resizeCanvas() {
        const wrapper = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = wrapper.clientWidth * dpr;
        // Subtract title bar height approx
        this.canvas.height = (wrapper.clientHeight - 50) * dpr;
        this.ctx.scale(dpr, dpr);
        
        if (this.trieRoot) this.calculateTrieLayout();
    }

    /* --- Build Phase --- */
    
    buildSystem() {
        const rawWords = this.inputWords.value.toLowerCase().split(',').map(w => w.trim().replace(/[^a-z]/g, '')).filter(w => w);
        if (rawWords.length === 0) rawWords.push('oath', 'pea', 'eat', 'rain');
        
        // Rebuild Trie
        this.trieRoot = new TrieNode('*');
        this.allTrieNodes = [this.trieRoot];
        
        for (let word of rawWords) {
            let curr = this.trieRoot;
            for (let c of word) {
                if (!curr.children[c]) {
                    const newNode = new TrieNode(c);
                    curr.children[c] = newNode;
                    this.allTrieNodes.push(newNode);
                }
                curr = curr.children[c];
            }
            curr.isWord = true;
            curr.fullWord = word;
        }

        this.calculateTrieLayout();
        // Snap coordinates
        this.allTrieNodes.forEach(n => { n.x = n.targetX; n.y = n.targetY; n.isActive = false; n.isFound = false; });
        
        this.resetGridUI();
        this.pruneCount = 0;
        this.foundWordsSet.clear();
        this.updateTelemetry();
        
        this.generator = this.runWordSearch();
        this.btnStep.disabled = false;
        this.btnPlay.disabled = false;
        this.updateStatus('Trie Generated. Engine ready for Dual DFS/Trie Traversal.', '');
    }

    calculateTrieLayout() {
        if (!this.trieRoot) return;
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);
        
        // Measure depth for vertical spacing
        const getDepth = (node) => {
            if(Object.keys(node.children).length === 0) return 1;
            let maxD = 0;
            for(let key in node.children) maxD = Math.max(maxD, getDepth(node.children[key]));
            return maxD + 1;
        };
        const maxDepth = getDepth(this.trieRoot);
        const ySpacing = Math.min(80, (h - 60) / maxDepth);

        // Assign recursive coordinates
        const assign = (node, xMin, xMax, y) => {
            node.targetX = xMin + (xMax - xMin) / 2;
            node.targetY = y;
            
            const keys = Object.keys(node.children);
            if (keys.length === 0) return;
            const sectorWidth = (xMax - xMin) / keys.length;
            
            keys.forEach((k, i) => {
                assign(node.children[k], xMin + (i * sectorWidth), xMin + ((i + 1) * sectorWidth), y + ySpacing);
            });
        };
        
        assign(this.trieRoot, 0, w, 40);
    }

    renderInitialGrid() {
        this.gridContainer.innerHTML = '';
        this.gridContainer.style.gridTemplateColumns = `repeat(${this.COLS}, 50px)`;
        this.domGrid = [];

        for (let r = 0; r < this.ROWS; r++) {
            const rowArr = [];
            for (let c = 0; c < this.COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.textContent = this.boardStr[r][c].toUpperCase();
                this.gridContainer.appendChild(cell);
                rowArr.push({ dom: cell, char: this.boardStr[r][c] });
            }
            this.domGrid.push(rowArr);
        }
    }

    resetGridUI() {
        for(let r=0; r<this.ROWS; r++) {
            for(let c=0; c<this.COLS; c++) {
                this.domGrid[r][c].dom.className = 'grid-cell';
            }
        }
    }

    /* --- Generator Engine --- */
    // Simulates the exact call stack of Leetcode 212 Word Search II
    *runWordSearch() {
        const visited = Array.from({length: this.ROWS}, () => Array(this.COLS).fill(false));
        
        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                yield* this.dfs(r, c, this.trieRoot, visited, []);
            }
        }
        yield { type: 'done', msg: 'Matrix Traversal Complete. All possible paths pruned or resolved.', phase: '' };
    }

    *dfs(r, c, parentNode, visited, pathCells) {
        if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS || visited[r][c]) return;

        const char = this.boardStr[r][c];
        const nextNode = parentNode.children[char];
        const currentCell = this.domGrid[r][c];
        
        // Pruning Logic (O(1) Trie Check)
        if (!nextNode) {
            this.pruneCount++;
            yield { 
                type: 'prune', 
                msg: `Prefix check failed for '${char}'. Search Space Pruned.`, 
                phase: 'prune', 
                activeCell: currentCell, 
                activeNode: parentNode 
            };
            return;
        }

        // Action: Visit
        visited[r][c] = true;
        pathCells.push(currentCell);
        
        yield { 
            type: 'visit', 
            msg: `DFS Exploring '${char}'. Trie pointer moving down branch.`, 
            phase: 'explore', 
            activeCell: currentCell, 
            activeNode: nextNode,
            path: [...pathCells]
        };

        // Check if word found
        if (nextNode.isWord && !this.foundWordsSet.has(nextNode.fullWord)) {
            this.foundWordsSet.add(nextNode.fullWord);
            nextNode.isWord = false; // Prevent duplicate triggering visually
            nextNode.isFound = true; // Permanent highlight
            
            yield { 
                type: 'found', 
                msg: `Word Found: "${nextNode.fullWord}"! Added to results.`, 
                phase: 'found', 
                activeCell: currentCell, 
                activeNode: nextNode,
                path: [...pathCells]
            };
        }

        // Continue DFS in 4 directions
        yield* this.dfs(r + 1, c, nextNode, visited, pathCells);
        yield* this.dfs(r - 1, c, nextNode, visited, pathCells);
        yield* this.dfs(r, c + 1, nextNode, visited, pathCells);
        yield* this.dfs(r, c - 1, nextNode, visited, pathCells);

        // Action: Backtrack
        visited[r][c] = false;
        pathCells.pop();
        
        yield { 
            type: 'backtrack', 
            msg: `Dead end. Backtracking from '${char}'. Reverting state.`, 
            phase: 'explore', 
            activeCell: currentCell, 
            activeNode: parentNode,
            path: [...pathCells]
        };
    }

    /* --- Frame Applier --- */

    stepForward() {
        if (!this.generator) return;
        const { value, done } = this.generator.next();
        if (done) {
            this.pauseAutoPlay();
            this.btnStep.disabled = true;
            this.btnPlay.disabled = true;
            if(value) this.updateStatus(value.msg, value.phase);
            return;
        }
        this.applyState(value);
    }

    applyState(state) {
        this.updateStatus(state.msg, state.phase);
        this.updateTelemetry();

        // Reset visual transient states
        this.allTrieNodes.forEach(n => { if(!n.isFound) n.isActive = false; });
        for(let r=0; r<this.ROWS; r++) {
            for(let c=0; c<this.COLS; c++) {
                // If it's not currently locked as a found word path, clear it
                if (!this.domGrid[r][c].dom.classList.contains('cell-found')) {
                    this.domGrid[r][c].dom.className = 'grid-cell';
                }
            }
        }

        // Apply Breadcrumb Path
        if (state.path) {
            state.path.forEach(cellObj => {
                if(!cellObj.dom.classList.contains('cell-found')) {
                     cellObj.dom.classList.add('cell-visited');
                }
            });
        }

        // Apply Active Cell
        if (state.activeCell && !state.activeCell.dom.classList.contains('cell-found')) {
            if (state.type === 'visit') state.activeCell.dom.classList.add('cell-visiting');
            if (state.type === 'prune') state.activeCell.dom.classList.add('cell-prune');
        }

        // Handle Word Found
        if (state.type === 'found' && state.path) {
            state.path.forEach(cellObj => {
                cellObj.dom.className = 'grid-cell cell-found';
            });
        }

        // Apply Active Trie Node
        if (state.activeNode) {
            state.activeNode.isActive = true;
        }
    }

    updateTelemetry() {
        this.valPruned.textContent = this.pruneCount;
        this.valFound.textContent = this.foundWordsSet.size;
    }

    updateStatus(msg, phaseStr) {
        this.statusText.textContent = msg;
        
        document.querySelectorAll('.phase-item').forEach(el => el.classList.remove('active-phase'));
        if (phaseStr) {
            const el = document.getElementById(`phase-${phaseStr}`);
            if (el) el.classList.add('active-phase');
        }
    }

    /* --- Auto Play Controllers --- */

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
            const delay = Math.max(80, 800 / this.animSpeed);
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

    /* --- Trie Canvas Rendering --- */

    startRenderLoop() {
        const render = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.allTrieNodes.forEach(n => n.updatePhysics());
            this.drawTrieEdges(this.trieRoot);
            this.allTrieNodes.forEach(n => this.drawTrieNode(n));
            this.animationFrameId = requestAnimationFrame(render);
        };
        render();
    }

    drawTrieEdges(node) {
        if(!node) return;
        this.ctx.lineWidth = 2;
        
        for(let key in node.children) {
            const child = node.children[key];
            
            // Edge style depends on child state
            if (child.isFound) this.ctx.strokeStyle = '#10b981'; // Emerald
            else if (child.isActive) this.ctx.strokeStyle = '#06b6d4'; // Cyan
            else this.ctx.strokeStyle = 'rgba(255,255,255,0.15)'; // Default
            
            this.ctx.beginPath();
            this.ctx.moveTo(node.x, node.y);
            this.ctx.lineTo(child.x, child.y);
            this.ctx.stroke();
            
            this.drawTrieEdges(child);
        }
    }

    drawTrieNode(node) {
        this.ctx.save();
        
        let bgColor = 'rgba(30, 41, 59, 0.8)';
        let borderColor = '#38bdf8';
        let radius = 18;
        
        if (node.isFound) {
            bgColor = 'rgba(16, 185, 129, 0.2)';
            borderColor = '#10b981';
            this.ctx.shadowColor = '#10b981';
            this.ctx.shadowBlur = 15;
            radius = 20;
        } else if (node.isActive) {
            bgColor = 'rgba(6, 182, 212, 0.2)';
            borderColor = '#06b6d4';
            this.ctx.shadowColor = '#06b6d4';
            this.ctx.shadowBlur = 15;
            radius = 22;
        } else if (node.isWord) {
            borderColor = '#7c3aed'; // Purple border for word ends
            this.ctx.setLineDash([4, 2]);
        }
        
        // Draw Circle
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = bgColor;
        this.ctx.fill();
        this.ctx.lineWidth = 2.5;
        this.ctx.strokeStyle = borderColor;
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reset
        
        // Draw Text
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.font = '600 14px "Fira Code", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(node.char.toUpperCase(), node.x, node.y);
        
        this.ctx.restore();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WordSearchVisualizer();
});
