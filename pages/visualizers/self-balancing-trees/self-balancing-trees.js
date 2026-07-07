/* ─────────────────────────────────────────────
   Self-Balancing Trees Simulator JavaScript
   ───────────────────────────────────────────── */

// Typing Animation
document.addEventListener("DOMContentLoaded", () => {
    initHeroTyping();
    initSimulator();
});

function initHeroTyping() {
    const el = document.getElementById("typingTextVisualizer");
    if (!el) return;

    const words = [
        "Simulate AVL Tree Rotations",
        "Explore Red-Black Recoloring",
        "Trace Self-Balancing Step-by-Step",
        "Click Nodes to Rotate Manually"
    ];

    let wordIdx = 0;
    let charIdx = 0;
    let isDeleting = false;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
        el.textContent = words[0];
        return;
    }

    function tick() {
        const current = words[wordIdx];

        if (isDeleting) {
            el.textContent = current.substring(0, charIdx - 1);
            charIdx--;
        } else {
            el.textContent = current.substring(0, charIdx + 1);
            charIdx++;
        }

        let speed = isDeleting ? 40 : 80;

        if (!isDeleting && charIdx === current.length) {
            speed = 1800; // Pause at end of word
            isDeleting = true;
        } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            wordIdx = (wordIdx + 1) % words.length;
            speed = 400; // Pause before next word
        }

        requestAnimationFrame(() => setTimeout(tick, speed));
    }

    tick();
}

/* ─────────────────────────────────────────────
   Tree Node Definitions
   ───────────────────────────────────────────── */
class Node {
    constructor(val, color = 'RED') {
        this.value = val;
        this.left = null;
        this.right = null;
        this.parent = null;
        this.height = 1;
        this.color = color; // 'RED' or 'BLACK'
        this.x = 0;
        this.y = 0;
    }
}

// Deep clone tree helper to store step states
function cloneTree(node, parent = null) {
    if (!node) return null;
    const copy = new Node(node.value, node.color);
    copy.height = node.height;
    copy.parent = parent;
    copy.x = node.x;
    copy.y = node.y;
    copy.left = cloneTree(node.left, copy);
    copy.right = cloneTree(node.right, copy);
    return copy;
}

/* ─────────────────────────────────────────────
   AVL Tree Implementation
   ───────────────────────────────────────────── */
class AVLTree {
    constructor() {
        this.root = null;
        this.steps = [];
    }

    getHeight(node) {
        return node ? node.height : 0;
    }

    getBalanceFactor(node) {
        return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
    }

    updateHeight(node) {
        if (node) {
            node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
        }
    }

    recordStep(message, highlightNodes = [], rotNode = null) {
        this.steps.push({
            tree: cloneTree(this.root),
            message: message,
            highlightNodes: [...highlightNodes],
            rotNode: rotNode
        });
    }

    rotateRight(y) {
        const x = y.left;
        if (!x) return y;
        const T2 = x.right;

        x.right = y;
        y.left = T2;

        x.parent = y.parent;
        y.parent = x;
        if (T2) T2.parent = y;

        if (x.parent) {
            if (x.parent.left === y) x.parent.left = x;
            else x.parent.right = x;
        } else {
            this.root = x;
        }

        this.updateHeight(y);
        this.updateHeight(x);

        return x;
    }

    rotateLeft(x) {
        const y = x.right;
        if (!y) return x;
        const T2 = y.left;

        y.left = x;
        x.right = T2;

        y.parent = x.parent;
        x.parent = y;
        if (T2) T2.parent = x;

        if (y.parent) {
            if (y.parent.left === x) y.parent.left = y;
            else y.parent.right = y;
        } else {
            this.root = y;
        }

        this.updateHeight(x);
        this.updateHeight(y);

        return y;
    }

    insert(val) {
        this.steps = [];
        this.root = this._insert(this.root, val, null);
        this.recordStep(`Successfully inserted ${val} and rebalanced tree.`, [val]);
        return this.steps;
    }

    _insert(node, val, parent) {
        if (!node) {
            const newNode = new Node(val);
            newNode.parent = parent;
            if (!this.root) this.root = newNode;
            this.recordStep(`BST Insert: Added node ${val} to the tree.`, [val]);
            return newNode;
        }

        if (val < node.value) {
            node.left = this._insert(node.left, val, node);
        } else if (val > node.value) {
            node.right = this._insert(node.right, val, node);
        } else {
            return node; // No duplicates
        }

        this.updateHeight(node);
        const balance = this.getBalanceFactor(node);

        // LL Case
        if (balance > 1 && val < node.left.value) {
            this.recordStep(`Imbalance at node ${node.value} (BF: ${balance}). Left-Left case requires Right Rotation on ${node.value}.`, [node.value, node.left.value], node.value);
            return this.rotateRight(node);
        }

        // RR Case
        if (balance < -1 && val > node.right.value) {
            this.recordStep(`Imbalance at node ${node.value} (BF: ${balance}). Right-Right case requires Left Rotation on ${node.value}.`, [node.value, node.right.value], node.value);
            return this.rotateLeft(node);
        }

        // LR Case
        if (balance > 1 && val > node.left.value) {
            this.recordStep(`Imbalance at node ${node.value} (BF: ${balance}). Left-Right case requires Left Rotation on child ${node.left.value}.`, [node.value, node.left.value], node.left.value);
            node.left = this.rotateLeft(node.left);
            this.recordStep(`Left rotation complete. Now Right Rotate on parent ${node.value}.`, [node.value, node.left.value], node.value);
            return this.rotateRight(node);
        }

        // RL Case
        if (balance < -1 && val < node.right.value) {
            this.recordStep(`Imbalance at node ${node.value} (BF: ${balance}). Right-Left case requires Right Rotation on child ${node.right.value}.`, [node.value, node.right.value], node.right.value);
            node.right = this.rotateRight(node.right);
            this.recordStep(`Right rotation complete. Now Left Rotate on parent ${node.value}.`, [node.value, node.right.value], node.value);
            return this.rotateLeft(node);
        }

        return node;
    }
}

/* ─────────────────────────────────────────────
   Red-Black Tree Implementation
   ───────────────────────────────────────────── */
class RedBlackTree {
    constructor() {
        this.root = null;
        this.steps = [];
    }

    recordStep(message, highlightNodes = [], rotNode = null) {
        this.steps.push({
            tree: cloneTree(this.root),
            message: message,
            highlightNodes: [...highlightNodes],
            rotNode: rotNode
        });
    }

    rotateLeft(x) {
        const y = x.right;
        x.right = y.left;
        if (y.left) y.left.parent = x;
        y.parent = x.parent;
        if (!x.parent) {
            this.root = y;
        } else if (x === x.parent.left) {
            x.parent.left = y;
        } else {
            x.parent.right = y;
        }
        y.left = x;
        x.parent = y;
    }

    rotateRight(x) {
        const y = x.left;
        x.left = y.right;
        if (y.right) y.right.parent = x;
        y.parent = x.parent;
        if (!x.parent) {
            this.root = y;
        } else if (x === x.parent.right) {
            x.parent.right = y;
        } else {
            x.parent.left = y;
        }
        y.right = x;
        x.parent = y;
    }

    insert(val) {
        this.steps = [];
        const newNode = new Node(val, 'RED');
        
        if (!this.root) {
            newNode.color = 'BLACK';
            this.root = newNode;
            this.recordStep(`Tree was empty. Inserted ${val} as root (colored BLACK).`, [val]);
            return this.steps;
        }

        let curr = this.root;
        let parent = null;
        while (curr) {
            parent = curr;
            if (val < curr.value) {
                curr = curr.left;
            } else if (val > curr.value) {
                curr = curr.right;
            } else {
                return this.steps; // Duplicate
            }
        }

        newNode.parent = parent;
        if (val < parent.value) {
            parent.left = newNode;
        } else {
            parent.right = newNode;
        }

        this.recordStep(`BST Insert: Inserted node ${val} (colored RED) under parent ${parent.value}.`, [val]);

        this.fixInsert(newNode);
        
        if (this.root.color !== 'BLACK') {
            this.root.color = 'BLACK';
            this.recordStep(`Enforced property: Recolored root ${this.root.value} to BLACK.`, [this.root.value]);
        }

        this.recordStep(`Successfully inserted and balanced Red-Black tree for ${val}.`, [val]);
        return this.steps;
    }

    fixInsert(k) {
        while (k.parent && k.parent.color === 'RED') {
            const gp = k.parent.parent;
            if (!gp) break;

            if (k.parent === gp.left) {
                const uncle = gp.right;
                if (uncle && uncle.color === 'RED') {
                    this.recordStep(`Double Red violation at ${k.value}. Parent ${k.parent.value} & Uncle ${uncle.value} are RED. Recoloring parent and uncle to BLACK, grandparent ${gp.value} to RED.`, [k.value, k.parent.value, uncle.value, gp.value]);
                    k.parent.color = 'BLACK';
                    uncle.color = 'BLACK';
                    gp.color = 'RED';
                    k = gp;
                } else {
                    if (k === k.parent.right) {
                        this.recordStep(`Double Red violation. Parent ${k.parent.value} is RED, Uncle is BLACK (Triangle). Left Rotate on parent ${k.parent.value}.`, [k.value, k.parent.value], k.parent.value);
                        k = k.parent;
                        this.rotateLeft(k);
                    }
                    this.recordStep(`Double Red violation. Parent ${k.parent.value} is RED, Uncle is BLACK (Line). Recoloring parent ${k.parent.value} to BLACK, grandparent ${gp.value} to RED.`, [k.value, k.parent.value, gp.value]);
                    k.parent.color = 'BLACK';
                    gp.color = 'RED';
                    this.recordStep(`Performing Right Rotation on grandparent ${gp.value}.`, [gp.value], gp.value);
                    this.rotateRight(gp);
                }
            } else {
                const uncle = gp.left;
                if (uncle && uncle.color === 'RED') {
                    this.recordStep(`Double Red violation at ${k.value}. Parent ${k.parent.value} & Uncle ${uncle.value} are RED. Recoloring parent and uncle to BLACK, grandparent ${gp.value} to RED.`, [k.value, k.parent.value, uncle.value, gp.value]);
                    k.parent.color = 'BLACK';
                    uncle.color = 'BLACK';
                    gp.color = 'RED';
                    k = gp;
                } else {
                    if (k === k.parent.left) {
                        this.recordStep(`Double Red violation. Parent ${k.parent.value} is RED, Uncle is BLACK (Triangle). Right Rotate on parent ${k.parent.value}.`, [k.value, k.parent.value], k.parent.value);
                        k = k.parent;
                        this.rotateRight(k);
                    }
                    this.recordStep(`Double Red violation. Parent ${k.parent.value} is RED, Uncle is BLACK (Line). Recoloring parent ${k.parent.value} to BLACK, grandparent ${gp.value} to RED.`, [k.value, k.parent.value, gp.value]);
                    k.parent.color = 'BLACK';
                    gp.color = 'RED';
                    this.recordStep(`Performing Left Rotation on grandparent ${gp.value}.`, [gp.value], gp.value);
                    this.rotateLeft(gp);
                }
            }
        }
    }
}

/* ─────────────────────────────────────────────
   Simulator UI & Main Loop Controller
   ───────────────────────────────────────────── */
function initSimulator() {
    let treeType = 'AVL'; // 'AVL' or 'RBT'
    let avl = new AVLTree();
    let rbt = new RedBlackTree();

    let stepHistory = [];
    let currentStepIdx = -1;
    let isPlaying = false;
    let playTimer = null;
    let animationSpeed = 800;

    let selectedNodeVal = null;

    // DOM Elements
    const canvas = document.getElementById('tree-canvas');
    const svg = document.getElementById('edges-svg');
    const statusMsg = document.getElementById('status-message');
    const inputVal = document.getElementById('node-value');
    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-val');

    const btnAvl = document.getElementById('btn-avl');
    const btnRbt = document.getElementById('btn-rbt');
    const btnInsert = document.getElementById('btn-insert');
    const btnRandom = document.getElementById('btn-random');
    const btnClear = document.getElementById('btn-clear');

    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnPlay = document.getElementById('btn-play');

    const legendPanel = document.getElementById('tree-legend');
    const nodeMenu = document.getElementById('node-menu');

    // Layout configuration
    const LEVEL_HEIGHT = 85;

    function getActiveTree() {
        return treeType === 'AVL' ? avl : rbt;
    }

    function updateLegend() {
        legendPanel.innerHTML = '';
        if (treeType === 'AVL') {
            legendPanel.innerHTML = `
                <div class="legend-item"><div class="legend-color" style="background: rgba(139, 92, 246, 0.2); border: 2px solid var(--primary-light);"></div><span>AVL Node</span></div>
                <div class="legend-item"><div class="legend-color avl-height"></div><span>Subtree Height (H)</span></div>
                <div class="legend-item"><span class="avl-bf balanced" style="font-family: 'Fira Code', monospace; font-size: 0.8rem;">BF: 0 / ±1</span><span>Balanced BF</span></div>
                <div class="legend-item"><span class="avl-bf critical" style="font-family: 'Fira Code', monospace; font-size: 0.8rem;">BF: ±2</span><span>Imbalance (Requires Rotation)</span></div>
            `;
        } else {
            legendPanel.innerHTML = `
                <div class="legend-item"><div class="legend-color red-node" style="width:14px; height:14px;"></div><span>Red Node</span></div>
                <div class="legend-item"><div class="legend-color black-node" style="width:14px; height:14px; border: 1px solid #4b5563;"></div><span>Black Node</span></div>
                <div class="legend-item"><i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i><span>Check: Parent is RED -> Double Red!</span></div>
            `;
        }
    }

    // Coordinate Math
    function getMaxDepth(node) {
        if (!node) return 0;
        return 1 + Math.max(getMaxDepth(node.left), getMaxDepth(node.right));
    }

    function computeCoordinates(node, x, y, level, maxDepth) {
        if (!node) return;
        node.x = x;
        node.y = y;

        // Dynamic horizontal spacing factor to avoid overlapping at deep levels
        const spreadFactor = Math.max(1.5, Math.min(2.5, 4.2 - maxDepth * 0.45));
        const canvasWidth = canvas.clientWidth || 800;
        const offset = (canvasWidth / Math.pow(2, level + 1)) * (spreadFactor / 2.2);

        computeCoordinates(node.left, x - offset, y + LEVEL_HEIGHT, level + 1, maxDepth);
        computeCoordinates(node.right, x + offset, y + LEVEL_HEIGHT, level + 1, maxDepth);
    }

    // Renders the tree elements to the DOM
    function renderTree(root, highlightNodes = [], rotNode = null) {
        // Clear nodes, keep SVG edges (they are drawn in transition sync)
        canvas.querySelectorAll('.tree-node').forEach(n => n.remove());

        if (!root) {
            svg.innerHTML = '';
            return;
        }

        const canvasWidth = canvas.clientWidth || 800;
        const maxDepth = getMaxDepth(root);
        computeCoordinates(root, canvasWidth / 2, 50, 0, maxDepth);

        // Render nodes
        drawNodesRecursive(root, highlightNodes, rotNode);

        // Start real-time sync of edges during node movement transition
        startEdgeSyncTransition(600);
    }

    function drawNodesRecursive(node, highlightNodes, rotNode) {
        if (!node) return;

        const div = document.createElement('div');
        div.id = `node-${node.value}`;
        
        let typeClass = '';
        if (treeType === 'AVL') {
            typeClass = 'avl-node';
        } else {
            typeClass = node.color === 'RED' ? 'red-node' : 'black-node';
        }

        div.className = `tree-node ${typeClass}`;
        
        if (highlightNodes.includes(node.value)) {
            div.classList.add('highlight');
        }
        if (rotNode === node.value) {
            div.classList.add('rot-target');
        }

        div.style.left = `${node.x}px`;
        div.style.top = `${node.y}px`;
        div.innerText = node.value;

        // AVL indicators
        if (treeType === 'AVL') {
            const h = node.height;
            const bf = getAVLBalanceFactor(node);
            const bfClass = Math.abs(bf) > 1 ? 'critical' : (Math.abs(bf) === 1 ? 'warning' : 'balanced');
            
            const ind = document.createElement('div');
            ind.className = 'avl-indicator';
            ind.innerHTML = `<span class="avl-h">H:${h}</span><span class="avl-bf ${bfClass}">BF:${bf}</span>`;
            div.appendChild(ind);
        }

        // Click handler to open options menu
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            openNodeMenu(node.value, node.x, node.y);
        });

        canvas.appendChild(div);

        drawNodesRecursive(node.left, highlightNodes, rotNode);
        drawNodesRecursive(node.right, highlightNodes, rotNode);
    }

    function getAVLBalanceFactor(node) {
        if (!node) return 0;
        const leftH = node.left ? node.left.height : 0;
        const rightH = node.right ? node.right.height : 0;
        return leftH - rightH;
    }

    // Dynamic Edge Line sync loop
    let edgeSyncTimer = null;
    function startEdgeSyncTransition(duration = 600) {
        if (edgeSyncTimer) cancelAnimationFrame(edgeSyncTimer);
        const startTime = Date.now();

        function syncLoop() {
            const elapsed = Date.now() - startTime;
            redrawSvgEdges();
            if (elapsed < duration) {
                edgeSyncTimer = requestAnimationFrame(syncLoop);
            } else {
                redrawSvgEdges(); // final frame sync
            }
        }
        edgeSyncTimer = requestAnimationFrame(syncLoop);
    }

    function redrawSvgEdges() {
        svg.innerHTML = '';
        const root = currentRenderedRoot();
        if (!root) return;
        drawEdgesRecursive(root);
    }

    function drawEdgesRecursive(node) {
        if (!node) return;
        const pDiv = document.getElementById(`node-${node.value}`);
        if (!pDiv) return;

        const px = parseFloat(pDiv.style.left);
        const py = parseFloat(pDiv.style.top);

        if (node.left) {
            const cDiv = document.getElementById(`node-${node.left.value}`);
            if (cDiv) {
                const cx = parseFloat(cDiv.style.left);
                const cy = parseFloat(cDiv.style.top);
                createSvgLine(px, py, cx, cy);
            }
            drawEdgesRecursive(node.left);
        }
        if (node.right) {
            const cDiv = document.getElementById(`node-${node.right.value}`);
            if (cDiv) {
                const cx = parseFloat(cDiv.style.left);
                const cy = parseFloat(cDiv.style.top);
                createSvgLine(px, py, cx, cy);
            }
            drawEdgesRecursive(node.right);
        }
    }

    function createSvgLine(x1, y1, x2, y2) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("class", "tree-edge");
        svg.appendChild(line);
    }

    function currentRenderedRoot() {
        if (currentStepIdx >= 0 && currentStepIdx < stepHistory.length) {
            return stepHistory[currentStepIdx].tree;
        }
        return getActiveTree().root;
    }

    // Step-by-Step state viewer
    function showStep(index) {
        if (index < 0 || index >= stepHistory.length) return;
        currentStepIdx = index;

        const step = stepHistory[index];
        statusMsg.innerText = step.message;
        
        renderTree(step.tree, step.highlightNodes, step.rotNode);

        // Update control button status
        btnPrev.disabled = index === 0;
        btnNext.disabled = index === stepHistory.length - 1;

        if (index === stepHistory.length - 1 && isPlaying) {
            pauseAutoPlay();
        }
    }

    // Auto Play loop
    function startAutoPlay() {
        if (stepHistory.length === 0) return;
        isPlaying = true;
        btnPlay.innerHTML = '<i class="fas fa-pause"></i>';
        
        if (currentStepIdx === stepHistory.length - 1) {
            currentStepIdx = -1; // restart
        }

        playTimer = setInterval(() => {
            if (currentStepIdx < stepHistory.length - 1) {
                showStep(currentStepIdx + 1);
            } else {
                pauseAutoPlay();
            }
        }, animationSpeed);
    }

    function pauseAutoPlay() {
        isPlaying = false;
        btnPlay.innerHTML = '<i class="fas fa-play"></i>';
        if (playTimer) {
            clearInterval(playTimer);
            playTimer = null;
        }
    }

    // Floating Node Rotation menu
    function openNodeMenu(value, x, y) {
        selectedNodeVal = value;
        
        // Show/hide double rotation options depending on mode
        const rotLr = document.getElementById('menu-rot-lr');
        const rotRl = document.getElementById('menu-rot-rl');
        if (treeType === 'AVL') {
            rotLr.style.display = 'flex';
            rotRl.style.display = 'flex';
        } else {
            rotLr.style.display = 'none';
            rotRl.style.display = 'none';
        }

        nodeMenu.style.left = `${x + 25}px`;
        nodeMenu.style.top = `${y - 30}px`;
        nodeMenu.style.display = 'block';
    }

    function closeNodeMenu() {
        nodeMenu.style.display = 'none';
        selectedNodeVal = null;
    }

    // Find node helper in tree (recursively)
    function findNode(node, val) {
        if (!node) return null;
        if (node.value === val) return node;
        return findNode(node.left, val) || findNode(node.right, val);
    }

    // Recalculates heights for the AVL Tree recursively after manual rotation
    function recalculateHeights(node) {
        if (!node) return 0;
        node.height = 1 + Math.max(recalculateHeights(node.left), recalculateHeights(node.right));
        return node.height;
    }

    // Manual rotation executors
    function executeManualLeftRotation() {
        if (selectedNodeVal === null) return;
        const tree = getActiveTree();
        const node = findNode(tree.root, selectedNodeVal);

        if (!node || !node.right) {
            statusMsg.innerText = `Cannot perform Left Rotation: Node ${selectedNodeVal} has no right child.`;
            closeNodeMenu();
            return;
        }

        statusMsg.innerText = `Performing manual Left Rotation around node ${selectedNodeVal}.`;
        
        if (treeType === 'AVL') {
            tree.rotateLeft(node);
            recalculateHeights(tree.root);
        } else {
            tree.rotateLeft(node);
        }

        closeNodeMenu();
        // Clear step history for manual interactions
        stepHistory = [{
            tree: cloneTree(tree.root),
            message: `Manual Left Rotation completed around node ${selectedNodeVal}.`,
            highlightNodes: [selectedNodeVal],
            rotNode: selectedNodeVal
        }];
        showStep(0);
    }

    function executeManualRightRotation() {
        if (selectedNodeVal === null) return;
        const tree = getActiveTree();
        const node = findNode(tree.root, selectedNodeVal);

        if (!node || !node.left) {
            statusMsg.innerText = `Cannot perform Right Rotation: Node ${selectedNodeVal} has no left child.`;
            closeNodeMenu();
            return;
        }

        statusMsg.innerText = `Performing manual Right Rotation around node ${selectedNodeVal}.`;

        if (treeType === 'AVL') {
            tree.rotateRight(node);
            recalculateHeights(tree.root);
        } else {
            tree.rotateRight(node);
        }

        closeNodeMenu();
        // Clear step history for manual interactions
        stepHistory = [{
            tree: cloneTree(tree.root),
            message: `Manual Right Rotation completed around node ${selectedNodeVal}.`,
            highlightNodes: [selectedNodeVal],
            rotNode: selectedNodeVal
        }];
        showStep(0);
    }

    function executeManualLeftRightRotation() {
        if (selectedNodeVal === null) return;
        const tree = getActiveTree();
        const node = findNode(tree.root, selectedNodeVal);

        if (!node || !node.left || !node.left.right) {
            statusMsg.innerText = `Cannot perform Left-Right Rotation around ${selectedNodeVal}. Child must have a right subtree.`;
            closeNodeMenu();
            return;
        }

        statusMsg.innerText = `Performing manual Left-Right Rotation: Left rotating child ${node.left.value}.`;
        tree.rotateLeft(node.left);
        recalculateHeights(tree.root);
        
        setTimeout(() => {
            statusMsg.innerText = `Left-Right Rotation: Right rotating parent ${node.value}.`;
            tree.rotateRight(node);
            recalculateHeights(tree.root);

            stepHistory = [{
                tree: cloneTree(tree.root),
                message: `Manual Left-Right Rotation completed around node ${selectedNodeVal}.`,
                highlightNodes: [selectedNodeVal],
                rotNode: selectedNodeVal
            }];
            showStep(0);
        }, 600);

        closeNodeMenu();
    }

    function executeManualRightLeftRotation() {
        if (selectedNodeVal === null) return;
        const tree = getActiveTree();
        const node = findNode(tree.root, selectedNodeVal);

        if (!node || !node.right || !node.right.left) {
            statusMsg.innerText = `Cannot perform Right-Left Rotation around ${selectedNodeVal}. Child must have a left subtree.`;
            closeNodeMenu();
            return;
        }

        statusMsg.innerText = `Performing manual Right-Left Rotation: Right rotating child ${node.right.value}.`;
        tree.rotateRight(node.right);
        recalculateHeights(tree.root);

        setTimeout(() => {
            statusMsg.innerText = `Right-Left Rotation: Left rotating parent ${node.value}.`;
            tree.rotateLeft(node);
            recalculateHeights(tree.root);

            stepHistory = [{
                tree: cloneTree(tree.root),
                message: `Manual Right-Left Rotation completed around node ${selectedNodeVal}.`,
                highlightNodes: [selectedNodeVal],
                rotNode: selectedNodeVal
            }];
            showStep(0);
        }, 600);

        closeNodeMenu();
    }

    // Click anywhere on canvas to close menu
    document.addEventListener('click', () => {
        closeNodeMenu();
    });

    // ── Bind Listeners ──
    btnAvl.addEventListener('click', () => {
        if (treeType === 'AVL') return;
        pauseAutoPlay();
        treeType = 'AVL';
        btnAvl.classList.add('active');
        btnRbt.classList.remove('active');
        updateLegend();
        statusMsg.innerText = "Switched to AVL Tree mode. Balance factor limits (±1) will be checked during insertions.";
        stepHistory = [];
        currentStepIdx = -1;
        renderTree(avl.root);
    });

    btnRbt.addEventListener('click', () => {
        if (treeType === 'RBT') return;
        pauseAutoPlay();
        treeType = 'RBT';
        btnRbt.classList.add('active');
        btnAvl.classList.remove('active');
        updateLegend();
        statusMsg.innerText = "Switched to Red-Black Tree mode. Double-red violations and recolor steps will be animated.";
        stepHistory = [];
        currentStepIdx = -1;
        renderTree(rbt.root);
    });

    btnInsert.addEventListener('click', () => {
        const val = parseInt(inputVal.value);
        if (isNaN(val) || val < 1 || val > 999) {
            statusMsg.innerText = "Please enter a valid node value between 1 and 999.";
            return;
        }
        inputVal.value = '';
        pauseAutoPlay();
        closeNodeMenu();

        // Check if value already exists
        const tree = getActiveTree();
        if (findNode(tree.root, val)) {
            statusMsg.innerText = `Value ${val} is already in the tree (no duplicates allowed).`;
            return;
        }

        const steps = tree.insert(val);
        stepHistory = steps;
        
        // Show first step (BST insert step)
        showStep(0);
        
        // Auto play the rest of the balancing steps
        if (stepHistory.length > 1) {
            setTimeout(() => {
                startAutoPlay();
            }, animationSpeed);
        }
    });

    // Support trigger insert via Enter key
    inputVal.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btnInsert.click();
        }
    });

    btnRandom.addEventListener('click', () => {
        const randVal = Math.floor(Math.random() * 90) + 10; // random 2 digit
        inputVal.value = randVal;
        btnInsert.click();
    });

    btnClear.addEventListener('click', () => {
        pauseAutoPlay();
        closeNodeMenu();
        if (treeType === 'AVL') {
            avl = new AVLTree();
        } else {
            rbt = new RedBlackTree();
        }
        stepHistory = [];
        currentStepIdx = -1;
        renderTree(null);
        statusMsg.innerText = "Tree cleared. Insert a value to start.";
    });

    btnPrev.addEventListener('click', () => {
        pauseAutoPlay();
        if (currentStepIdx > 0) {
            showStep(currentStepIdx - 1);
        }
    });

    btnNext.addEventListener('click', () => {
        pauseAutoPlay();
        if (currentStepIdx < stepHistory.length - 1) {
            showStep(currentStepIdx + 1);
        }
    });

    btnPlay.addEventListener('click', () => {
        if (isPlaying) {
            pauseAutoPlay();
        } else {
            startAutoPlay();
        }
    });

    speedSlider.addEventListener('input', (e) => {
        animationSpeed = parseInt(e.target.value);
        speedVal.innerText = `${animationSpeed}ms`;
        if (isPlaying) {
            pauseAutoPlay();
            startAutoPlay();
        }
    });

    // Menu buttons binds
    document.getElementById('menu-rot-left').addEventListener('click', executeManualLeftRotation);
    document.getElementById('menu-rot-right').addEventListener('click', executeManualRightRotation);
    document.getElementById('menu-rot-lr').addEventListener('click', executeManualLeftRightRotation);
    document.getElementById('menu-rot-rl').addEventListener('click', executeManualRightLeftRotation);

    // Initial setup
    updateLegend();
    window.addEventListener('resize', () => {
        const root = currentRenderedRoot();
        if (root) {
            renderTree(root);
        }
    });
}
