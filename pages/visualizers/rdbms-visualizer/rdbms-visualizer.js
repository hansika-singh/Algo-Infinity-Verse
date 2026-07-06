/**
 * rdbms-visualizer.js
 * Implements a strict B+Tree (degree m=4, max 3 keys) and a Write-Ahead Log (WAL).
 * Visualizes dynamic page splitting and crash recovery using D3.js.
 */

document.addEventListener("DOMContentLoaded", () => {
    initRDBMS();
});

// ==========================================
// 1. DATA STRUCTURES (B+TREE & WAL)
// ==========================================

// Config: B+Tree of Order 4 (Max 3 keys per node).
const B_TREE_ORDER = 4;
const MAX_KEYS = B_TREE_ORDER - 1; 

class BPlusTreeNode {
    constructor(isLeaf = false) {
        this.id = 'page_' + Math.random().toString(36).substr(2, 9);
        this.isLeaf = isLeaf;
        this.keys = []; // {k: id, v: value} for leaves, or just integer routing keys for internal nodes
        this.children = []; // Array of BPlusTreeNode
        this.next = null; // Pointer to next leaf
        this.isNew = true; // For animation highlighting
    }
}

class BPlusTree {
    constructor() {
        this.root = new BPlusTreeNode(true);
        this.height = 1;
        this.pageCount = 1;
        this.splitCount = 0;
    }

    insert(key, value) {
        // Clear 'isNew' flags before insert
        this.clearNewFlags(this.root);
        
        const split = this._insertNode(this.root, key, value);
        if (split) {
            // Root split! Create new root.
            const newRoot = new BPlusTreeNode(false);
            this.pageCount++;
            this.height++;
            newRoot.keys.push(split.key);
            newRoot.children.push(this.root);
            newRoot.children.push(split.right);
            this.root = newRoot;
        }
    }

    _insertNode(node, key, val) {
        node.isNew = true; // Highlight nodes touched during traversal

        if (node.isLeaf) {
            // Update if exists
            const existingIdx = node.keys.findIndex(item => item.k === key);
            if (existingIdx !== -1) {
                node.keys[existingIdx].v = val;
                return null;
            }

            // Insert sorted
            node.keys.push({ k: key, v: val });
            node.keys.sort((a, b) => a.k - b.k);

            // Check Overflow
            if (node.keys.length > MAX_KEYS) {
                this.splitCount++;
                this.pageCount++;
                const mid = Math.ceil(node.keys.length / 2);
                
                const rightNode = new BPlusTreeNode(true);
                // Leaf splits duplicate the key (it stays in leaf for data, and gets promoted for routing)
                rightNode.keys = node.keys.splice(mid); 
                
                // Maintain Linked List
                rightNode.next = node.next;
                node.next = rightNode;
                
                // Return promoted key (first key of right node)
                return { key: rightNode.keys[0].k, right: rightNode };
            }
            return null;
        } else {
            // Internal Node: Find correct child branch
            let idx = 0;
            while (idx < node.keys.length && key >= node.keys[idx]) idx++;
            
            const split = this._insertNode(node.children[idx], key, val);
            
            if (split) {
                // Child split, insert promoted key and new child pointer
                node.keys.splice(idx, 0, split.key);
                node.children.splice(idx + 1, 0, split.right);
                
                // Check Internal Node Overflow
                if (node.keys.length > MAX_KEYS) {
                    this.splitCount++;
                    this.pageCount++;
                    const mid = Math.floor(node.keys.length / 2);
                    
                    const rightNode = new BPlusTreeNode(false);
                    const promotedKey = node.keys[mid];
                    
                    // Internal nodes DO NOT duplicate the promoted key
                    rightNode.keys = node.keys.splice(mid + 1);
                    rightNode.children = node.children.splice(mid + 1);
                    node.keys.pop(); // Remove the promoted key from left node
                    
                    return { key: promotedKey, right: rightNode };
                }
            }
            return null;
        }
    }

    clearNewFlags(node) {
        if (!node) return;
        node.isNew = false;
        if (!node.isLeaf) {
            node.children.forEach(c => this.clearNewFlags(c));
        }
    }
}

// ==========================================
// 2. STATE & UI CONTROLLER
// ==========================================
let bTree = new BPlusTree();
let wal = []; // Write-Ahead Log
let txCounter = 1;

let isEngineOnline = true;

const els = {
    inputKey: document.getElementById('inputKey'),
    inputValue: document.getElementById('inputValue'),
    btnExecuteTx: document.getElementById('btnExecuteTx'),
    btnRandomTx: document.getElementById('btnRandomTx'),
    btnCrash: document.getElementById('btnCrash'),
    btnRecover: document.getElementById('btnRecover'),
    
    walLog: document.getElementById('walLog'),
    walCounter: document.getElementById('walCounter'),
    
    engineStatus: document.getElementById('engineStatus'),
    emptyState: document.getElementById('emptyState'),
    canvasWrapper: document.getElementById('canvasWrapper'),
    
    statNodes: document.getElementById('statNodes'),
    statSplits: document.getElementById('statSplits'),
    statHeight: document.getElementById('statHeight')
};

// D3 Context
let svgGroup, d3Zoom;
const NODE_WIDTH = 120;
const NODE_HEIGHT = 40;

function initRDBMS() {
    setupD3();
    bindEvents();
}

function bindEvents() {
    els.btnExecuteTx.addEventListener('click', () => {
        if (!isEngineOnline) return console.warn("Alert:", "Database is offline! Recover from WAL first.");
        
        const rawKey = els.inputKey.value.trim();
        const k = Number(rawKey);
        const v = els.inputValue.value.trim();
        
        if (!Number.isInteger(k) || !v) return console.warn("Alert:", "Provide a valid integer Key and Value.");
        
        executeTransaction(k, v);
        
        els.inputKey.value = '';
        els.inputValue.value = '';
        els.inputKey.focus();
    });
    
    els.btnRandomTx.addEventListener('click', () => {
        if (!isEngineOnline) return console.warn("Alert:", "Database is offline! Recover from WAL first.");
        const k = Math.floor(Math.random() * 999) + 1;
        const v = `Data_${Math.random().toString(36).substr(2,4).toUpperCase()}`;
        executeTransaction(k, v);
    });

    els.btnCrash.addEventListener('click', simulateCrash);
    els.btnRecover.addEventListener('click', recoverFromWAL);
}

// --- Transaction Pipeline ---
function executeTransaction(k, v, isRecovery = false) {
    // 1. Write to WAL (Disk)
    if (!isRecovery) {
        const txId = `TX_${String(txCounter++).padStart(4, '0')}`;
        wal.push({ txId, k, v });
        renderWALEntry(txId, k, v, false);
    }
    
    // 2. Apply to B+Tree (Volatile Memory)
    bTree.insert(k, v);
    
    // 3. Update Visuals
    updateTelemetry();
    renderD3Tree();
}

function renderWALEntry(txId, k, v, isRecovered) {
    const div = document.createElement('div');
    div.className = 'wal-entry';
    if (isRecovered) div.classList.add('recovered');

    const txIdSpan = document.createElement('span');
    txIdSpan.className = 'tx-id';
    txIdSpan.textContent = `[${txId}]`;

    const txCmdSpan = document.createElement('span');
    txCmdSpan.className = 'tx-cmd';
    txCmdSpan.textContent = 'INSERT';

    const txDataSpan = document.createElement('span');
    txDataSpan.className = 'tx-data';
    txDataSpan.textContent = `(${k}, '${v}')`;

    div.append(txIdSpan, txCmdSpan, txDataSpan);
    els.walLog.appendChild(div);
    els.walLog.scrollTop = els.walLog.scrollHeight;
    els.walCounter.textContent = `${wal.length} Entries`;
}

function updateTelemetry() {
    els.statNodes.textContent = bTree.pageCount;
    els.statSplits.textContent = bTree.splitCount;
    els.statHeight.textContent = bTree.height;
}

// --- Chaos Engineering ---
function simulateCrash() {
    if (!isEngineOnline) return;
    
    // Destroy memory
    bTree = null;
    isEngineOnline = false;
    
    // Update UI
    els.engineStatus.className = 'engine-badge offline';
    els.engineStatus.innerHTML = '<i class="fas fa-power-off"></i> Storage Engine: OFFLINE (Crashed)';
    
    els.btnExecuteTx.disabled = true;
    els.btnRandomTx.disabled = true;
    els.btnCrash.disabled = true;
    els.btnRecover.disabled = false;

    els.statNodes.textContent = '0';
    els.statSplits.textContent = '0';
    els.statHeight.textContent = '0';
    
    // Clear Canvas
    d3.select("`#canvasWrapper`").selectAll("svg").remove();
    els.emptyState.style.display = 'block';
    els.emptyState.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:`#ef4444`;"></i><p>Memory wiped. Tree structure lost.</p>';
}

function recoverFromWAL() {
    // Re-initialize engine
    bTree = new BPlusTree();
    bTree.pageCount = 1;
    bTree.splitCount = 0;
    bTree.height = 1;
    
    isEngineOnline = false;
    
    // Restore UI
    els.engineStatus.className = 'engine-badge offline';
    els.engineStatus.innerHTML = '<i class="fas fa-medkit"></i> Storage Engine: RECOVERING';
    
    els.btnExecuteTx.disabled = true;
    els.btnRandomTx.disabled = true;
    els.btnCrash.disabled = true;
    els.btnRecover.disabled = true;
    
    els.walLog.innerHTML = ''; // Clear old logs visually
    
    // Setup D3 again
    setupD3();
    
    // Replay WAL step-by-step
    let i = 0;
    function replayNext() {
        if (i < wal.length) {
            const entry = wal[i];
            renderWALEntry(entry.txId, entry.k, entry.v, true);
            bTree.insert(entry.k, entry.v);
            updateTelemetry();
            renderD3Tree();
            i++;
            setTimeout(replayNext, 150); // Visual delay for recovery
        } else {
            isEngineOnline = true;
            els.engineStatus.className = 'engine-badge online';
            els.engineStatus.innerHTML = '<i class="fas fa-database"></i> Storage Engine: ONLINE';
            els.btnExecuteTx.disabled = false;
            els.btnRandomTx.disabled = false;
            els.btnCrash.disabled = false;
        }
    }
    replayNext();
}

// ==========================================
// 3. D3.JS B+TREE RENDERING
// ==========================================
function setupD3() {
    d3.select("#canvasWrapper").selectAll("svg").remove();
    
    const width = els.canvasWrapper.clientWidth;
    const height = els.canvasWrapper.clientHeight;

    const svg = d3.select("#canvasWrapper")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .call(d3.zoom().on("zoom", (event) => {
            svgGroup.attr("transform", event.transform);
        }));

    svgGroup = svg.append("g")
        .attr("transform", `translate(${width / 2}, 60)`);
}

// Convert internal BTree structure to D3 Hierarchy format
function convertToD3Hierarchy(node) {
    if (!node) return null;
    
    // Format node label
    let name = "";
    if (node.isLeaf) {
        name = node.keys.map(k => `${k.k}:${k.v}`).join(' | ');
    } else {
        name = node.keys.join(' | ');
    }

    let d3Node = {
        id: node.id,
        name: name,
        isLeaf: node.isLeaf,
        isNew: node.isNew, // Passes animation state
        children: []
    };

    if (!node.isLeaf) {
        node.children.forEach(child => {
            d3Node.children.push(convertToD3Hierarchy(child));
        });
    } else {
        delete d3Node.children;
    }
    
    return d3Node;
}

function renderD3Tree() {
    if (!bTree || !bTree.root || bTree.root.keys.length === 0) {
        els.emptyState.style.display = 'block';
        return;
    }
    els.emptyState.style.display = 'none';

    const treeData = convertToD3Hierarchy(bTree.root);
    const root = d3.hierarchy(treeData);

    // Calculate dynamic node width based on keys to prevent overlap
    // Width is base 60px + 40px per key
    const dynamicNodeWidth = Math.max(120, treeData.name.length * 8);

    // Setup Tree Layout
    const treeLayout = d3.tree().nodeSize([dynamicNodeWidth + 20, 100]);
    treeLayout(root);

    // Center tree
    let x0 = Infinity;
    let x1 = -x0;
    root.each(d => {
        if (d.x > x1) x1 = d.x;
        if (d.x < x0) x0 = d.x;
    });

    // 1. Draw Standard Tree Links (Parent to Child)
    const links = svgGroup.selectAll(".link")
        .data(root.links(), d => d.target.data.id);

    links.exit().remove();

    links.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y - (NODE_HEIGHT/2)))
        .merge(links)
        .transition().duration(400)
        .attr("d", d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y - (NODE_HEIGHT/2)) // Connect to top of node rect
        );

    // 2. Draw Nodes (Pages)
    const nodes = svgGroup.selectAll(".node")
        .data(root.descendants(), d => d.data.id);

    nodes.exit().remove();

    const nodeEnter = nodes.enter().append("g")
        .attr("class", d => `node ${d.data.isLeaf ? 'leaf' : 'internal'} ${d.data.isNew ? 'new' : ''}`)
        .attr("transform", d => `translate(${d.x},${d.y})`);

    // Rectangles
    nodeEnter.append("rect")
        .attr("width", dynamicNodeWidth)
        .attr("height", NODE_HEIGHT)
        .attr("x", -(dynamicNodeWidth/2))
        .attr("y", -(NODE_HEIGHT/2));

    // Text
    nodeEnter.append("text")
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(d => d.data.name);

    const nodeUpdate = nodeEnter.merge(nodes);
    
    nodeUpdate.transition().duration(400)
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("class", d => `node ${d.data.isLeaf ? 'leaf' : 'internal'} ${d.data.isNew ? 'new' : ''}`);

    nodeUpdate.select("rect")
        .attr("width", dynamicNodeWidth)
        .attr("x", -(dynamicNodeWidth/2));
        
    nodeUpdate.select("text")
        .text(d => d.data.name);

    // 3. Draw Leaf Links (B+ Tree Linked List Pointers)
    // Find all leaf nodes in left-to-right order
    const leaves = root.leaves();
    const leafLinks = [];
    for (let i = 0; i < leaves.length - 1; i++) {
        leafLinks.push({ source: leaves[i], target: leaves[i+1] });
    }

    const leafPaths = svgGroup.selectAll(".leaf-link")
        .data(leafLinks, d => `${d.source.data.id}-${d.target.data.id}`);

    leafPaths.exit().remove();

    leafPaths.enter().insert("path", "g")
        .attr("class", "leaf-link")
        .merge(leafPaths)
        .transition().duration(400)
        .attr("d", d => {
            const startX = d.source.x + (dynamicNodeWidth/2);
            const startY = d.source.y;
            const endX = d.target.x - (dynamicNodeWidth/2);
            const endY = d.target.y;
            // Draw horizontal arrow
            return `M ${startX} ${startY} L ${endX} ${endY}`;
        });
}
