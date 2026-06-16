/* Hero Typing Animation */
document.addEventListener("DOMContentLoaded", () => {
    initHeroTyping();
});

function initHeroTyping() {
    const el = document.getElementById("typingTextVisualizer");
    if (!el) return;

    const words = [
        "Build, Modify, and Animate Trees",
        "Visualize DFS Traversals",
        "Explore Level-Order BFS",
        "Master Binary Search Trees"
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

        let speed = isDeleting ? 50 : 100;

        if (!isDeleting && charIdx === current.length) {
            speed = 2000; // Pause at end of word
            isDeleting = true;
        } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            wordIdx = (wordIdx + 1) % words.length;
            speed = 500; // Pause before typing next word
        }

        requestAnimationFrame(() => setTimeout(tick, speed));
    }

    tick();
}


class TreeNode {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
        this.x = 0;
        this.y = 0;
    }
}

class BinarySearchTree {
    constructor() {
        this.root = null;
    }

    insert(value) {
        const newNode = new TreeNode(value);
        if (!this.root) {
            this.root = newNode;
            return true;
        }
        let current = this.root;
        while (true) {
            if (value === current.value) return false; // Prevent duplicates
            if (value < current.value) {
                if (!current.left) { current.left = newNode; return true; }
                current = current.left;
            } else {
                if (!current.right) { current.right = newNode; return true; }
                current = current.right;
            }
        }
    }

    // Basic BST deletion
    delete(value) {
        const removeNode = (node, val) => {
            if (!node) return null;
            if (val === node.value) {
                if (!node.left && !node.right) return null;
                if (!node.left) return node.right;
                if (!node.right) return node.left;
                // Node has 2 children: get min value of right subtree
                let temp = node.right;
                while (temp.left) temp = temp.left;
                node.value = temp.value;
                node.right = removeNode(node.right, temp.value);
                return node;
            } else if (val < node.value) {
                node.left = removeNode(node.left, val);
                return node;
            } else {
                node.right = removeNode(node.right, val);
                return node;
            }
        };
        this.root = removeNode(this.root, value);
    }
}

// UI State
const tree = new BinarySearchTree();
const ANIMATION_SPEED = 600;
let isAnimating = false;

// DOM Elements
const canvas = document.getElementById('tree-canvas');
const svg = document.getElementById('edges-svg');
const statusMsg = document.getElementById('status-message');
const outputMsg = document.getElementById('traversal-output');
const inputVal = document.getElementById('node-value');

// Config for Drawing
const NODE_RADIUS = 20;
const LEVEL_HEIGHT = 80;

/* ── Rendering Logic ── */
function updateVisualization() {
    // Clear current DOM
    canvas.querySelectorAll('.tree-node').forEach(n => n.remove());
    svg.innerHTML = '';
    
    if (!tree.root) return;

    // Calculate Coordinates
    const canvasWidth = canvas.clientWidth || 800;
    calculateCoordinates(tree.root, canvasWidth / 2, 50, canvasWidth / 4);
    
    // Draw edges first (so they are under nodes)
    drawEdges(tree.root);
    // Draw nodes
    drawNodes(tree.root);
}

function calculateCoordinates(node, x, y, offset) {
    if (!node) return;
    node.x = x;
    node.y = y;
    // Reduce offset as we go deeper to prevent overlap
    calculateCoordinates(node.left, x - offset, y + LEVEL_HEIGHT, offset / 2);
    calculateCoordinates(node.right, x + offset, y + LEVEL_HEIGHT, offset / 2);
}

function drawEdges(node) {
    if (!node) return;
    if (node.left) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", node.x);
        line.setAttribute("y1", node.y);
        line.setAttribute("x2", node.left.x);
        line.setAttribute("y2", node.left.y);
        line.setAttribute("class", "tree-edge");
        svg.appendChild(line);
        drawEdges(node.left);
    }
    if (node.right) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", node.x);
        line.setAttribute("y1", node.y);
        line.setAttribute("x2", node.right.x);
        line.setAttribute("y2", node.right.y);
        line.setAttribute("class", "tree-edge");
        svg.appendChild(line);
        drawEdges(node.right);
    }
}

function drawNodes(node) {
    if (!node) return;
    const div = document.createElement('div');
    div.className = 'tree-node';
    div.id = `node-${node.value}`;
    div.innerText = node.value;
    div.style.left = `${node.x}px`;
    div.style.top = `${node.y}px`;
    canvas.appendChild(div);

    drawNodes(node.left);
    drawNodes(node.right);
}

/* ── Animation Helpers ── */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function highlightNode(value, statusClass = 'highlight') {
    const el = document.getElementById(`node-${value}`);
    if (el) {
        el.classList.add(statusClass);
        await sleep(ANIMATION_SPEED);
        el.classList.remove(statusClass);
    }
}

/* ── Interaction Listeners ── */
document.getElementById('btn-insert').addEventListener('click', () => {
    if (isAnimating) return;
    const val = parseInt(inputVal.value);
    if (isNaN(val)) return;
    
    if (tree.insert(val)) {
        statusMsg.innerText = `Inserted node ${val}.`;
        updateVisualization();
    } else {
        statusMsg.innerText = `Node ${val} already exists.`;
    }
    inputVal.value = '';
});

document.getElementById('btn-delete').addEventListener('click', () => {
    if (isAnimating) return;
    const val = parseInt(inputVal.value);
    if (isNaN(val)) return;
    
    tree.delete(val);
    statusMsg.innerText = `Attempted to delete node ${val}.`;
    updateVisualization();
    inputVal.value = '';
});

document.getElementById('btn-search').addEventListener('click', async () => {
    if (isAnimating) return;
    const target = parseInt(inputVal.value);
    if (isNaN(target)) return;

    isAnimating = true;
    let current = tree.root;
    let found = false;

    statusMsg.innerText = `Searching for ${target}...`;

    while (current) {
        await highlightNode(current.value);
        if (current.value === target) {
            found = true;
            break;
        }
        current = target < current.value ? current.left : current.right;
    }

    if (found) {
        statusMsg.innerText = `Found node ${target}!`;
        const el = document.getElementById(`node-${target}`);
        if (el) {
            el.classList.add('found');
            setTimeout(() => el.classList.remove('found'), 2000);
        }
    } else {
        statusMsg.innerText = `Node ${target} not found.`;
    }
    isAnimating = false;
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (isAnimating) return;
    tree.root = null;
    statusMsg.innerText = "Tree reset.";
    outputMsg.innerText = "Output: []";
    updateVisualization();
});

/* ── Traversals ── */
async function animateTraversal(generator, name) {
    if (isAnimating || !tree.root) return;
    isAnimating = true;
    statusMsg.innerText = `Running ${name} Traversal...`;
    outputMsg.innerText = "Output: [";
    const result = [];

    for (let node of generator(tree.root)) {
        await highlightNode(node.value);
        result.push(node.value);
        outputMsg.innerText = `Output: [${result.join(', ')}]`;
    }
    
    statusMsg.innerText = `${name} Traversal complete.`;
    isAnimating = false;
}

function* inorder(node) {
    if (node) {
        yield* inorder(node.left);
        yield node;
        yield* inorder(node.right);
    }
}

function* preorder(node) {
    if (node) {
        yield node;
        yield* preorder(node.left);
        yield* preorder(node.right);
    }
}

function* postorder(node) {
    if (node) {
        yield* postorder(node.left);
        yield* postorder(node.right);
        yield node;
    }
}

function* levelorder(root) {
    if (!root) return;
    const queue = [root];
    while (queue.length > 0) {
        const node = queue.shift();
        yield node;
        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);
    }
}

document.getElementById('btn-inorder').addEventListener('click', () => animateTraversal(inorder, "In-order"));
document.getElementById('btn-preorder').addEventListener('click', () => animateTraversal(preorder, "Pre-order"));
document.getElementById('btn-postorder').addEventListener('click', () => animateTraversal(postorder, "Post-order"));
document.getElementById('btn-levelorder').addEventListener('click', () => animateTraversal(levelorder, "Level-order"));

// Initialize empty canvas
window.addEventListener('resize', updateVisualization);
updateVisualization();