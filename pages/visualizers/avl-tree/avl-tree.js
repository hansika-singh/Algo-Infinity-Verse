/**
 * Tree Balancing - AVL Tree Rotations Engine
 * Explicitly tracks recursive paths, highlights Balance Factor (BF) mathematics,
 * and uses linear Canvas interpolation to smoothly drag subtrees during rotations.
 */

const COLORS = {
    bg: '#00000000',
    nodeBg: '#1e293b',
    nodeBorder: '#334155',
    textMain: '#ffffff',
    textMuted: '#94a3b8',
    edge: '#475569',
    
    activeCyan: '#06b6d4',
    activeDanger: '#ef4444',
    activePurple: '#a855f7',
    activeEmerald: '#10b981'
};

class AVLNode {
    constructor(val) {
        this.val = val;
        this.left = null;
        this.right = null;
        this.height = 1;
        this.bf = 0;
        
        // Canvas Layout Properties
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        
        // UI Status
        this.status = 'idle'; // idle, eval, violation, balanced
    }
}

class AVLVisualizer {
    constructor() {
        this.canvas = document.getElementById('viz-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.mathPanel = document.getElementById('math-overlay');
        this.mathEq = document.getElementById('math-equation');
        this.statusTxt = document.getElementById('main-status');
        
        this.btnPlay = document.getElementById('btn-play');
        this.btnStep = document.getElementById('btn-step');
        
        this.root = null;
        this.nodeCount = 0;
        
        this.animating = false;
        this.generator = null;
        this.timer = null;
        
        this.pendingInsertions = [];

        this.bindEvents();
        this.resize();
        window.addEventListener('resize', () => { this.resize(); this.calculateLayout(); });
        this.renderLoop();
    }

    bindEvents() {
        document.getElementById('btn-insert').addEventListener('click', () => {
            const val = parseInt(document.getElementById('input-val').value, 10);
            if (!isNaN(val)) {
                this.pendingInsertions.push(val);
                if (!this.animating) this.startNextOperation();
                document.getElementById('input-val').value = '';
            }
        });

        document.getElementById('btn-random-batch').addEventListener('click', () => {
            for(let i=0; i<5; i++) {
                this.pendingInsertions.push(Math.floor(Math.random() * 90) + 10);
            }
            if (!this.animating) this.startNextOperation();
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            if (!this.animating) this.hardReset();
        });

        this.btnStep.addEventListener('click', () => this.step());
        this.btnPlay.addEventListener('click', () => this.togglePlay());
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    hardReset() {
        this.animating = false;
        if (this.timer) clearTimeout(this.timer);
        this.generator = null;
        
        this.root = null;
        this.nodeCount = 0;
        this.pendingInsertions = [];
        
        this.btnPlay.innerHTML = '<i class="fas fa-play"></i> Auto Run';
        this.btnPlay.disabled = true;
        this.btnStep.disabled = true;
        this.mathPanel.classList.add('hidden');
        this.highlightCode(null);
        this.updateTelemetry();
        this.statusTxt.innerText = `Status: Tree Cleared`;
    }

    // --- Math & Telemetry ---
    getHeight(node) {
        return node ? node.height : 0;
    }

    updateTelemetry() {
        document.getElementById('stat-nodes').innerText = this.nodeCount;
        document.getElementById('stat-height').innerText = this.getHeight(this.root);
    }

    updateMath(eq) {
        this.mathEq.innerHTML = eq;
        this.mathPanel.classList.remove('hidden');
    }

    highlightCode(stepId, colorClass = 'active') {
        document.querySelectorAll('.code-line').forEach(el => {
            el.classList.remove('active', 'active-danger', 'active-purple');
        });
        if (stepId) document.getElementById(stepId).classList.add(colorClass);
    }

    resetNodeStatuses(node) {
        if (!node) return;
        node.status = 'idle';
        this.resetNodeStatuses(node.left);
        this.resetNodeStatuses(node.right);
    }

    // --- Dynamic Target Positioning Algorithm ---
    calculateLayout() {
        if (!this.root) return;
        // Standard Binary Tree split: root at center, child nodes take half the remaining width
        const w = this.canvas.width;
        const startY = 60;
        this.setLayoutRecursive(this.root, w / 2, startY, w / 4, 80);
    }

    setLayoutRecursive(node, x, y, offsetX, offsetY) {
        if (!node) return;
        node.targetX = x;
        node.targetY = y;
        
        // If node doesn't have an initial position, snap it to parent (creates pop-out effect)
        if (node.x === 0 && node.y === 0) {
            node.x = x;
            node.y = y - offsetY; // spawn slightly above
        }

        this.setLayoutRecursive(node.left, x - Math.max(offsetX, 40), y + offsetY, offsetX / 1.8, offsetY);
        this.setLayoutRecursive(node.right, x + Math.max(offsetX, 40), y + offsetY, offsetX / 1.8, offsetY);
    }

    // --- AVL Rotations (Logical) ---
    rotateRight(y) {
        let x = y.left;
        let T2 = x.right;

        // Perform rotation
        x.right = y;
        y.left = T2;

        // Update heights
        y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;
        x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;

        return x;
    }

    rotateLeft(x) {
        let y = x.right;
        let T2 = y.left;

        // Perform rotation
        y.left = x;
        x.right = T2;

        // Update heights
        x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;
        y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;

        return y;
    }

    replaceChild(path, index, newSubRoot) {
        if (index === 0) {
            this.root = newSubRoot;
        } else {
            let parent = path[index - 1];
            if (parent.left === path[index]) parent.left = newSubRoot;
            else parent.right = newSubRoot;
            
            // Re-update parent height explicitly after structural change
            parent.height = Math.max(this.getHeight(parent.left), this.getHeight(parent.right)) + 1;
        }
    }

    // --- State Machine Generators ---
    
    *insertGenerator(val) {
        this.statusTxt.innerText = `Status: Inserting ${val}`;
        this.resetNodeStatuses(this.root);
        
        this.highlightCode('avl-1');
        
        // Phase 1: Iterative Traverse & Build Path
        let path = [];
        if (!this.root) {
            this.root = new AVLNode(val);
            this.nodeCount++;
            this.updateMath(`Empty Tree. Created Root Node <span class="eq-hl">${val}</span>`);
            this.calculateLayout();
            this.updateTelemetry();
            yield;
            
            this.statusTxt.innerText = `Status: Insert Complete`;
            this.finishOperation();
            return;
        }

        let curr = this.root;
        while (curr) {
            path.push(curr);
            curr.status = 'eval';
            this.updateMath(`Traversing. Comparing <span class="eq-hl">${val}</span> to <span class="eq-hl">${curr.val}</span>`);
            yield;

            if (val < curr.val) {
                if (!curr.left) {
                    curr.left = new AVLNode(val);
                    path.push(curr.left);
                    this.nodeCount++;
                    break;
                }
                curr.status = 'idle';
                curr = curr.left;
            } else if (val > curr.val) {
                if (!curr.right) {
                    curr.right = new AVLNode(val);
                    path.push(curr.right);
                    this.nodeCount++;
                    break;
                }
                curr.status = 'idle';
                curr = curr.right;
            } else {
                this.updateMath(`<span class="eq-err">Duplicate Value Ignored.</span>`);
                yield;
                this.finishOperation();
                return;
            }
        }

        this.calculateLayout();
        this.updateTelemetry();
        this.updateMath(`Inserted Leaf Node <span class="eq-hl">${val}</span>`);
        yield;

        // Phase 2: Backtrack and Update
        this.highlightCode('avl-2', 'active-purple');
        this.updateMath(`<span class="eq-p">Backtracking up the insertion path to evaluate Balance Factors.</span>`);
        yield;

        for (let i = path.length - 1; i >= 0; i--) {
            let node = path[i];
            
            // Clean visuals
            path.forEach(n => n.status = 'idle');
            node.status = 'eval';

            this.highlightCode('avl-3');
            node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
            this.updateMath(`Updating Height of Node <span class="eq-hl">${node.val}</span> <br> Height = 1 + max(hL:${this.getHeight(node.left)}, hR:${this.getHeight(node.right)}) = <span class="eq-p">${node.height}</span>`);
            yield;

            this.highlightCode('avl-4');
            const hl = this.getHeight(node.left);
            const hr = this.getHeight(node.right);
            const bf = hl - hr;
            node.bf = bf;
            
            if (bf > 1 || bf < -1) {
                node.status = 'violation';
                this.updateMath(`BF = Height(L) - Height(R) <br> BF = ${hl} - ${hr} = <span class="eq-err">${bf}</span> <br> <span class="eq-err">UNBALANCED. Triggering Rotation.</span>`);
                yield;

                // Rotation Routing
                if (bf > 1) { // Left Heavy
                    this.highlightCode('avl-5', 'active-danger');
                    yield;

                    if (val < node.left.val) {
                        this.highlightCode('avl-6', 'active-danger');
                        this.updateMath(`Left Heavy & Insertion is Left of Left. <br> <span class="eq-err">Executing Right Rotation (LL Case).</span>`);
                        document.getElementById('stat-rot').innerText = 'Right (LL)';
                        yield;

                        let newSubRoot = this.rotateRight(node);
                        this.replaceChild(path, i, newSubRoot);
                        
                    } else {
                        this.highlightCode('avl-7', 'active-danger');
                        this.updateMath(`Left Heavy & Insertion is Right of Left. <br> <span class="eq-err">Executing Left-Right Rotation (LR Case).</span>`);
                        document.getElementById('stat-rot').innerText = 'Left-Right (LR)';
                        yield;

                        node.left = this.rotateLeft(node.left);
                        this.calculateLayout();
                        yield; // Show intermediate state
                        
                        let newSubRoot = this.rotateRight(node);
                        this.replaceChild(path, i, newSubRoot);
                    }
                } else if (bf < -1) { // Right Heavy
                    this.highlightCode('avl-8', 'active-danger');
                    yield;

                    if (val > node.right.val) {
                        this.highlightCode('avl-9', 'active-danger');
                        this.updateMath(`Right Heavy & Insertion is Right of Right. <br> <span class="eq-err">Executing Left Rotation (RR Case).</span>`);
                        document.getElementById('stat-rot').innerText = 'Left (RR)';
                        yield;

                        let newSubRoot = this.rotateLeft(node);
                        this.replaceChild(path, i, newSubRoot);
                        
                    } else {
                        this.highlightCode('avl-10', 'active-danger');
                        this.updateMath(`Right Heavy & Insertion is Left of Right. <br> <span class="eq-err">Executing Right-Left Rotation (RL Case).</span>`);
                        document.getElementById('stat-rot').innerText = 'Right-Left (RL)';
                        yield;

                        node.right = this.rotateRight(node.right);
                        this.calculateLayout();
                        yield;

                        let newSubRoot = this.rotateLeft(node);
                        this.replaceChild(path, i, newSubRoot);
                    }
                }
                
                // Rotation finished. Re-layout and show gliding physics
                this.calculateLayout();
                this.resetNodeStatuses(this.root);
                this.updateMath(`Rotation complete. Subtree is re-balanced.`);
                this.updateTelemetry();
                yield;
                
                // After 1 rotation, an AVL tree is guaranteed to be balanced locally and globally.
                break; 
            } else {
                node.status = 'balanced';
                this.updateMath(`BF = Height(L) - Height(R) <br> BF = ${hl} - ${hr} = <span class="eq-hl">${bf}</span> <br> <span style="color:var(--accent-emerald)">Subtree is Balanced.</span>`);
                yield;
            }
        }

        this.finishOperation();
    }

    // --- Control Flow Engine ---
    startNextOperation() {
        if (this.pendingInsertions.length === 0) return;
        
        const nextVal = this.pendingInsertions.shift();
        this.generator = this.insertGenerator(nextVal);
        this.animating = true;
        
        const btnPlay = document.getElementById('btn-play');
        btnPlay.innerHTML = '<i class="fas fa-pause"></i> Pause';
        btnPlay.disabled = false;
        document.getElementById('btn-step').disabled = false;
        
        this.autoStep();
    }

    finishOperation() {
        this.highlightCode(null);
        this.resetNodeStatuses(this.root);
        this.mathPanel.classList.add('hidden');
        this.statusTxt.innerText = `Status: Insert Complete. Tree Balanced.`;
        
        // If more pending, queue them. Otherwise halt.
        if (this.pendingInsertions.length > 0) {
            setTimeout(() => this.startNextOperation(), 1000);
        } else {
            this.animating = false;
            document.getElementById('btn-play').innerHTML = '<i class="fas fa-play"></i> Auto Run';
            document.getElementById('btn-play').disabled = true;
            document.getElementById('btn-step').disabled = true;
        }
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
            return false;
        }
        return true;
    }

    autoStep() {
        if (!this.animating) return;
        const hasNext = this.step();
        if (hasNext) {
            this.timer = setTimeout(() => this.autoStep(), 1200); // 1.2s Pacing
        }
    }

    // --- Canvas Rendering Loop ---
    drawEdges(node) {
        if (!node) return;
        
        // Draw to children using current X/Y (so lines follow nodes as they physically glide)
        if (node.left) {
            this.ctx.beginPath();
            this.ctx.moveTo(node.x, node.y);
            this.ctx.lineTo(node.left.x, node.left.y);
            this.ctx.strokeStyle = COLORS.edge;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.drawEdges(node.left);
        }
        if (node.right) {
            this.ctx.beginPath();
            this.ctx.moveTo(node.x, node.y);
            this.ctx.lineTo(node.right.x, node.right.y);
            this.ctx.strokeStyle = COLORS.edge;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.drawEdges(node.right);
        }
    }

    drawNodes(node) {
        if (!node) return;

        // Apply Gliding Physics
        node.x += (node.targetX - node.x) * 0.15;
        node.y += (node.targetY - node.y) * 0.15;

        // Draw Circle
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);
        this.ctx.fillStyle = COLORS.nodeBg;
        this.ctx.fill();
        
        // Style based on State
        this.ctx.lineWidth = 3;
        if (node.status === 'eval') {
            this.ctx.strokeStyle = COLORS.activeCyan;
            this.ctx.shadowColor = COLORS.activeCyan;
            this.ctx.shadowBlur = 15;
        } else if (node.status === 'violation') {
            this.ctx.strokeStyle = COLORS.activeDanger;
            this.ctx.shadowColor = COLORS.activeDanger;
            this.ctx.shadowBlur = 20;
        } else if (node.status === 'balanced') {
            this.ctx.strokeStyle = COLORS.activeEmerald;
            this.ctx.shadowBlur = 0;
        } else {
            this.ctx.strokeStyle = COLORS.nodeBorder;
            this.ctx.shadowBlur = 0;
        }
        this.ctx.stroke();
        this.ctx.shadowBlur = 0; // reset

        // Draw Value
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(node.val, node.x, node.y);

        // Draw BF Badge (Top Right)
        if (node.status === 'eval' || node.status === 'violation' || node.status === 'balanced') {
            this.ctx.beginPath();
            this.ctx.arc(node.x + 18, node.y - 18, 12, 0, Math.PI * 2);
            this.ctx.fillStyle = node.status === 'violation' ? COLORS.activeDanger : (node.status === 'balanced' ? COLORS.activeEmerald : COLORS.activePurple);
            this.ctx.fill();
            
            this.ctx.fillStyle = COLORS.textMain;
            this.ctx.font = '11px Poppins';
            this.ctx.fillText(node.bf, node.x + 18, node.y - 18);
        }

        this.drawNodes(node.left);
        this.drawNodes(node.right);
    }

    renderLoop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawEdges(this.root);
        this.drawNodes(this.root);

        requestAnimationFrame(() => this.renderLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new AVLVisualizer();
});
