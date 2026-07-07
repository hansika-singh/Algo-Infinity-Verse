/**
 * rbt-visualizer.js
 * Implements a complete Red-Black Tree data structure and records state changes
 * for step-by-step D3.js animated visualization.
 */

document.addEventListener("DOMContentLoaded", () => {
    initRBTVisualizer();
});

// --- Sentinel Null Node (TNULL) ---
const TNULL = {
    id: 'TNULL',
    val: null,
    color: 'BLACK',
    left: null,
    right: null,
    parent: null
};

class Node {
    constructor(val) {
        this.id = `N_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        this.val = val;
        this.parent = TNULL;
        this.left = TNULL;
        this.right = TNULL;
        this.color = 'RED'; // New nodes are always red initially
    }
}

class RedBlackTree {
    constructor() {
        this.root = TNULL;
    }

    // Left Rotation
    leftRotate(x) {
        let y = x.right;
        x.right = y.left;
        if (y.left !== TNULL) {
            y.left.parent = x;
        }
        y.parent = x.parent;
        if (x.parent === TNULL) {
            this.root = y;
        } else if (x === x.parent.left) {
            x.parent.left = y;
        } else {
            x.parent.right = y;
        }
        y.left = x;
        x.parent = y;
    }

    // Right Rotation
    rightRotate(x) {
        let y = x.left;
        x.left = y.right;
        if (y.right !== TNULL) {
            y.right.parent = x;
        }
        y.parent = x.parent;
        if (x.parent === TNULL) {
            this.root = y;
        } else if (x === x.parent.right) {
            x.parent.right = y;
        } else {
            x.parent.left = y;
        }
        y.right = x;
        x.parent = y;
    }

    insert(key) {
        let node = new Node(key);
        let y = TNULL;
        let x = this.root;

        while (x !== TNULL) {
            y = x;
            if (node.val < x.val) {
                x = x.left;
            } else if (node.val > x.val) {
                x = x.right;
            } else {
                // Ignore duplicates
                return null;
            }
        }

        node.parent = y;
        if (y === TNULL) {
            this.root = node;
        } else if (node.val < y.val) {
            y.left = node;
        } else {
            y.right = node;
        }

        if (node.parent === TNULL) {
            node.color = 'BLACK';
            return node;
        }
        if (node.parent.parent === TNULL) {
            return node;
        }

        return node; // Return node so we can start fixup tracking
    }
}

// ==========================================
// VISUALIZER STATE & ANIMATION ENGINE
// ==========================================
let rbt;
let animationQueue = [];
let isAnimating = false;

// D3 State
let svg, g, treeLayout;

const els = {
    btnInsert: document.getElementById('btnInsert'),
    btnRandomInsert: document.getElementById('btnRandomInsert'),
    btnReset: document.getElementById('btnReset'),
    nodeValueInput: document.getElementById('nodeValueInput'),
    speedSlider: document.getElementById('speedSlider'),
    logContainer: document.getElementById('logContainer'),
    engineBadge: document.getElementById('engineBadge'),
    emptyState: document.getElementById('emptyState')
};

function initRBTVisualizer() {
    rbt = new RedBlackTree();
    setupD3();
    bindEvents();
}

function bindEvents() {
    els.btnInsert.addEventListener('click', () => {
        const val = parseInt(els.nodeValueInput.value);
        if (isNaN(val)) return;
        els.nodeValueInput.value = '';
        processInsert(val);
    });

    els.nodeValueInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') els.btnInsert.click();
    });

    els.btnRandomInsert.addEventListener('click', () => {
        const val = Math.floor(Math.random() * 100) + 1;
        processInsert(val);
    });

    els.btnReset.addEventListener('click', () => {
        rbt = new RedBlackTree();
        animationQueue = [];
        isAnimating = false;
        els.emptyState.style.display = 'block';
        logMsg("Tree cleared.", "sys");
        renderD3(null);
    });
}

function logMsg(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = `> ${msg}`;
    els.logContainer.appendChild(div);
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Capture the tree structure without circular parent references for D3
function snapshotTree(node) {
    if (node === TNULL) return null;
    let res = {
        id: node.id,
        val: node.val,
        color: node.color,
        children: []
    };
    // Include null placeholders to maintain strict binary structure visually
    if (node.left !== TNULL || node.right !== TNULL) {
        res.children.push(snapshotTree(node.left) || { id: `null-L-${node.id}`, isNull: true });
        res.children.push(snapshotTree(node.right) || { id: `null-R-${node.id}`, isNull: true });
    }
    return res;
}

function recordState(msg, type, highlightIds = []) {
    animationQueue.push({
        treeData: snapshotTree(rbt.root),
        msg: msg,
        type: type,
        highlightIds: highlightIds
    });
}

// ==========================================
// INSERTION LOGIC WITH STEP TRACKING
// ==========================================
function processInsert(val) {
    if (isAnimating) return;
    
    // Check duplicate locally
    let x = rbt.root;
    while (x !== TNULL) {
        if (val === x.val) {
            logMsg(`Value ${val} already exists.`, 'sys');
            return;
        }
        x = val < x.val ? x.left : x.right;
    }

    animationQueue = []; // Clear queue
    
    // Step 1: Standard BST Insert
    let node = rbt.insert(val);
    recordState(`Inserted ${val} as a standard RED node.`, 'insert', [node.id]);

    // Step 2: Fixup Loop
    fixInsert(node);
    
    // Final state ensure root is black
    if (rbt.root.color === 'RED') {
        rbt.root.color = 'BLACK';
        recordState(`Root forced to BLACK.`, 'recolor', [rbt.root.id]);
    }
    
    recordState(`Insertion of ${val} complete and balanced.`, 'done');

    // Run Animation
    playAnimation();
}

function fixInsert(k) {
    while (k.parent.color === 'RED') {
        if (k.parent === k.parent.parent.right) {
            let u = k.parent.parent.left; // uncle
            if (u.color === 'RED') {
                // Case 1: Uncle is RED
                u.color = 'BLACK';
                k.parent.color = 'BLACK';
                k.parent.parent.color = 'RED';
                recordState(`Case 1: Uncle is RED. Recolored Parent and Uncle to BLACK, Grandparent to RED.`, 'recolor', [u.id, k.parent.id, k.parent.parent.id]);
                k = k.parent.parent;
            } else {
                if (k === k.parent.left) {
                    // Case 2: Uncle is BLACK, Node is Left child -> Right Rotate
                    k = k.parent;
                    rbt.rightRotate(k);
                    recordState(`Case 2: Node is Left child. Right Rotating Parent.`, 'rotate', [k.id, k.parent.id]);
                }
                // Case 3: Uncle is BLACK, Node is Right child -> Left Rotate Grandparent
                k.parent.color = 'BLACK';
                k.parent.parent.color = 'RED';
                recordState(`Case 3: Recoloring Parent BLACK, Grandparent RED before rotation.`, 'recolor', [k.parent.id, k.parent.parent.id]);
                
                let grandparent = k.parent.parent;
                rbt.leftRotate(k.parent.parent);
                recordState(`Case 3: Left Rotating Grandparent.`, 'rotate', [grandparent.id]);
            }
        } else {
            // Mirrored
            let u = k.parent.parent.right; // uncle
            if (u.color === 'RED') {
                // Case 1
                u.color = 'BLACK';
                k.parent.color = 'BLACK';
                k.parent.parent.color = 'RED';
                recordState(`Case 1: Uncle is RED. Recolored Parent and Uncle to BLACK, Grandparent to RED.`, 'recolor', [u.id, k.parent.id, k.parent.parent.id]);
                k = k.parent.parent;
            } else {
                if (k === k.parent.right) {
                    // Case 2
                    k = k.parent;
                    rbt.leftRotate(k);
                    recordState(`Case 2: Node is Right child. Left Rotating Parent.`, 'rotate', [k.id, k.parent.id]);
                }
                // Case 3
                k.parent.color = 'BLACK';
                k.parent.parent.color = 'RED';
                recordState(`Case 3: Recoloring Parent BLACK, Grandparent RED before rotation.`, 'recolor', [k.parent.id, k.parent.parent.id]);
                
                let grandparent = k.parent.parent;
                rbt.rightRotate(k.parent.parent);
                recordState(`Case 3: Right Rotating Grandparent.`, 'rotate', [grandparent.id]);
            }
        }
        if (k === rbt.root) break;
    }
}

async function playAnimation() {
    isAnimating = true;
    els.btnInsert.disabled = true;
    els.btnRandomInsert.disabled = true;
    els.btnReset.disabled = true;
    
    els.engineBadge.classList.add('active');
    els.engineBadge.innerHTML = '<i class="fas fa-sync fa-spin"></i> Rebalancing...';

    for (let i = 0; i < animationQueue.length; i++) {
        const state = animationQueue[i];
        
        logMsg(state.msg, state.type);
        renderD3(state.treeData, state.highlightIds);
        
        const speed = parseInt(els.speedSlider.value);
        await sleep(speed);
    }

    isAnimating = false;
    els.btnInsert.disabled = false;
    els.btnRandomInsert.disabled = false;
    els.btnReset.disabled = false;
    els.engineBadge.classList.remove('active');
    els.engineBadge.innerHTML = '<i class="fas fa-tree"></i> RBT Engine: Idle';
}

// ==========================================
// D3.JS RENDERING
// ==========================================

function setupD3() {
    const container = document.getElementById('canvasWrapper');
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg = d3.select("#rbtCanvas")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom().on("zoom", (event) => {
            g.attr("transform", event.transform);
        }));

    g = svg.append("g")
        .attr("transform", `translate(${width / 2}, 60)`);

    treeLayout = d3.tree().nodeSize([60, 80]); // Spacing x, y
}

function renderD3(treeData, highlightIds = []) {
    if (!treeData) {
        g.selectAll("*").remove();
        return;
    }
    
    els.emptyState.style.display = 'none';

    const root = d3.hierarchy(treeData);
    treeLayout(root);

    const speed = parseInt(els.speedSlider.value) * 0.8; // Transition duration slightly less than pause

    // --- LINKS ---
    // Filter out links connecting to null spacer nodes
    const linksData = root.links().filter(d => !d.target.data.isNull);
    
    const link = g.selectAll(".link")
        .data(linksData, d => d.target.data.id);

    link.exit().remove();

    const linkEnter = link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", d => {
            const o = { x: d.source.x, y: d.source.y };
            return d3.linkVertical().x(d => d.x).y(d => d.y)({ source: o, target: o });
        });

    linkEnter.merge(link).transition().duration(speed)
        .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y));

    // --- NODES ---
    const node = g.selectAll(".node")
        .data(root.descendants(), d => d.data.id);

    node.exit().transition().duration(speed)
        .attr("transform", d => d.parent ? `translate(${d.parent.x},${d.parent.y})` : `translate(${d.x},${d.y})`)
        .style("opacity", 0)
        .remove();

    const nodeEnter = node.enter().append("g")
        .attr("class", d => `node ${d.data.isNull ? 'null-node' : d.data.color}`)
        .attr("transform", d => d.parent ? `translate(${d.parent.x},${d.parent.y})` : `translate(${d.x},${d.y})`);

    nodeEnter.append("circle")
        .attr("r", 20);

    nodeEnter.append("text")
        .attr("dy", 1)
        .text(d => d.data.val);

    const nodeUpdate = nodeEnter.merge(node);
    
    // Transition positions and classes (colors)
    nodeUpdate.transition().duration(speed)
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("class", d => {
            if (d.data.isNull) return 'node null-node';
            let classes = `node ${d.data.color}`;
            if (highlightIds.includes(d.data.id)) classes += ' highlight';
            return classes;
        });
}
