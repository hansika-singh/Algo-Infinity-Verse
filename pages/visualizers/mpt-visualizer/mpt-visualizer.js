/**
 * mpt-visualizer.js
 * Implements a simulated Ethereum Merkle Patricia Trie (Hexary).
 * Handles Node splitting, path compression (Extension nodes), and cryptographic hashing.
 * Renders the state dynamically using D3.js.
 */

document.addEventListener("DOMContentLoaded", () => {
    initMPTVisualizer();
});

// ==========================================
// 1. CRYPTOGRAPHY MOCK & UTILS
// ==========================================

// Mock Keccak256 hash function (Synchronous and deterministic for visualizer)
// Converts a string to a 64-character pseudo-random hex string.
function mockKeccak256(inputStr) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < inputStr.length; i++) {
        let ch = inputStr.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    
    const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
    const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
    
    // Repeat to simulate 256-bit (64 char) hash length
    const raw = hex1 + hex2 + hex1 + hex2;
    // Scramble it a bit more
    let fullHash = '';
    for(let i=0; i<64; i++) {
        fullHash += raw.charAt((i * 3) % raw.length);
    }
    return `0x${fullHash}`;
}

// Find common prefix length between two arrays
function commonPrefixLen(arr1, arr2) {
    let len = 0;
    while (len < arr1.length && len < arr2.length && arr1[len] === arr2[len]) {
        len++;
    }
    return len;
}

// ==========================================
// 2. MPT DATA STRUCTURES
// ==========================================
let nodeIdSeq = 1;

class LeafNode {
    constructor(path, value) {
        this.id = `leaf_${nodeIdSeq++}`;
        this.type = 'leaf';
        this.path = path; // Array of nibbles
        this.value = value;
        this.hash = '';
    }
    updateHash() {
        this.hash = mockKeccak256(`leaf:${this.path.join('')}:${this.value}`);
        return this.hash;
    }
}

class ExtensionNode {
    constructor(path, child) {
        this.id = `ext_${nodeIdSeq++}`;
        this.type = 'extension';
        this.path = path;
        this.child = child;
        this.hash = '';
    }
    updateHash() {
        const childHash = this.child ? this.child.updateHash() : '';
        this.hash = mockKeccak256(`ext:${this.path.join('')}:${childHash}`);
        return this.hash;
    }
}

class BranchNode {
    constructor() {
        this.id = `branch_${nodeIdSeq++}`;
        this.type = 'branch';
        this.branches = new Array(16).fill(null);
        this.value = null; // Can hold a value if a key ends exactly here
        this.hash = '';
    }
    updateHash() {
        let branchHashes = this.branches.map(b => b ? b.updateHash() : '').join(',');
        this.hash = mockKeccak256(`branch:${branchHashes}:${this.value || ''}`);
        return this.hash;
    }
}

class MerklePatriciaTrie {
    constructor() {
        this.root = null;
        this.nodeCount = 0;
        this.leafCount = 0;
        this.activePathIds = new Set(); // For animation
    }

    insert(hexKey, value) {
        // Convert hex string to array of nibbles (0-15 integers)
        const path = hexKey.split('').map(char => parseInt(char, 16));
        this.activePathIds.clear(); // Clear previous highlights
        
        this.root = this._insert(this.root, path, value);
        this.root.updateHash(); // Ripple hashes up to root
        this.updateStats();
    }

    _insert(node, path, value) {
        if (!node) {
            const leaf = new LeafNode(path, value);
            this.activePathIds.add(leaf.id);
            return leaf;
        }

        this.activePathIds.add(node.id);

        if (node.type === 'leaf') {
            const matchLen = commonPrefixLen(node.path, path);

            // Case 1: Complete match (Update existing leaf)
            if (matchLen === node.path.length && matchLen === path.length) {
                node.value = value;
                return node;
            }

            // Case 2: Divergence -> Split into Branch + (Optional Ext) + 2 Leaves
            return this._splitNode(node, path, value, matchLen);
        }

        if (node.type === 'extension') {
            const matchLen = commonPrefixLen(node.path, path);

            // Case 1: Complete prefix match -> traverse to child
            if (matchLen === node.path.length) {
                node.child = this._insert(node.child, path.slice(matchLen), value);
                return node;
            }

            // Case 2: Divergence -> Split
            return this._splitNode(node, path, value, matchLen);
        }

        if (node.type === 'branch') {
            if (path.length === 0) {
                node.value = value; // Key ends exactly at this branch
                return node;
            }
            const nibble = path[0];
            node.branches[nibble] = this._insert(node.branches[nibble], path.slice(1), value);
            return node;
        }
    }

    // Advanced: Compresses and splits paths
    _splitNode(node, newPath, newValue, matchLen) {
        const branch = new BranchNode();
        this.activePathIds.add(branch.id);

        // 1. Process Old Node Remainder
        const oldRem = node.path.slice(matchLen);
        if (oldRem.length === 0) {
            // Unlikely for extension, but if a leaf matches exactly up to branch
            branch.value = node.value; 
        } else {
            const oldNibble = oldRem[0];
            const oldRest = oldRem.slice(1);
            
            if (node.type === 'leaf') {
                const newOldLeaf = new LeafNode(oldRest, node.value);
                branch.branches[oldNibble] = newOldLeaf;
            } else if (node.type === 'extension') {
                if (oldRest.length > 0) {
                    branch.branches[oldNibble] = new ExtensionNode(oldRest, node.child);
                } else {
                    branch.branches[oldNibble] = node.child; // Attach directly to branch
                }
            }
        }

        // 2. Process New Path Remainder
        const newRem = newPath.slice(matchLen);
        if (newRem.length === 0) {
            branch.value = newValue;
        } else {
            const newNibble = newRem[0];
            const newLeaf = new LeafNode(newRem.slice(1), newValue);
            this.activePathIds.add(newLeaf.id);
            branch.branches[newNibble] = newLeaf;
        }

        // 3. Return Branch or Wrap in Extension if there's a shared prefix
        if (matchLen > 0) {
            const ext = new ExtensionNode(node.path.slice(0, matchLen), branch);
            this.activePathIds.add(ext.id);
            return ext;
        }
        return branch;
    }

    updateStats() {
        let nodes = 0, leaves = 0;
        const traverse = (n) => {
            if (!n) return;
            nodes++;
            if (n.type === 'leaf') leaves++;
            if (n.type === 'extension') traverse(n.child);
            if (n.type === 'branch') n.branches.forEach(b => traverse(b));
        };
        traverse(this.root);
        this.nodeCount = nodes;
        this.leafCount = leaves;
    }
}

// ==========================================
// 3. STATE & UI CONTROLLER
// ==========================================
let mpt = new MerklePatriciaTrie();

const els = {
    inputKey: document.getElementById('inputKey'),
    inputValue: document.getElementById('inputValue'),
    btnInsert: document.getElementById('btnInsert'),
    btnReset: document.getElementById('btnReset'),
    
    rootHashDisplay: document.getElementById('rootHashDisplay'),
    statNodes: document.getElementById('statNodes'),
    statLeaves: document.getElementById('statLeaves'),
    logContainer: document.getElementById('logContainer'),
    
    engineBadge: document.getElementById('engineBadge'),
    emptyState: document.getElementById('emptyState'),
    canvasWrapper: document.getElementById('canvasWrapper')
};

// D3 State
let svgGroup;
const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;

function initMPTVisualizer() {
    setupD3();
    bindEvents();
}

function logSys(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = `> ${msg}`;
    els.logContainer.appendChild(div);
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

function bindEvents() {
    els.btnInsert.addEventListener('click', handleInsert);
    els.inputKey.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleInsert(); });
    els.inputValue.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleInsert(); });

    els.btnReset.addEventListener('click', () => {
        mpt = new MerklePatriciaTrie();
        nodeIdSeq = 1;
        updateDashboard();
        renderD3Tree();
        logSys("State Trie reset. Memory cleared.");
    });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function handleInsert() {
    const key = els.inputKey.value.trim().toLowerCase();
    const val = els.inputValue.value.trim();

    if (!key || !val) return alert("Key and Value are required.");
    if (!/^[0-9a-f]+$/.test(key)) return alert("Key must be a valid Hex string (0-9, a-f).");

    els.btnInsert.disabled = true;
    els.engineBadge.classList.add('hashing');
    els.engineBadge.innerHTML = '<i class="fas fa-fingerprint"></i> Recalculating Hashes...';

    logSys(`Insert Request: Key[0x${key}] -> Val[${val}]`, 'insert');

    // Slight delay to allow UI to show hashing state
    await sleep(400);

    const prevNodeCount = mpt.nodeCount;
    mpt.insert(key, val);

    if (mpt.nodeCount > prevNodeCount + 1) {
        logSys("Path collision detected! Extension Node split generated.", "split");
    }
    
    logSys(`Hashes rippled to root. New Root: ${mpt.root.hash.substring(0, 10)}...`, 'hash');

    updateDashboard();
    renderD3Tree();

    els.inputKey.value = '';
    els.inputValue.value = '';
    els.inputKey.focus();

    els.btnInsert.disabled = false;
    els.engineBadge.classList.remove('hashing');
    els.engineBadge.innerHTML = '<i class="fab fa-ethereum"></i> Cryptographic State: Active';
}

function updateDashboard() {
    if (mpt.root) {
        els.rootHashDisplay.textContent = mpt.root.hash;
        els.rootHashDisplay.classList.add('updated');
        setTimeout(() => els.rootHashDisplay.classList.remove('updated'), 500);
    } else {
        els.rootHashDisplay.textContent = "0x0000000000000000000000000000000000000000000000000000000000000000";
    }

    els.statNodes.textContent = mpt.nodeCount;
    els.statLeaves.textContent = mpt.leafCount;
}

// ==========================================
// 4. D3.JS RENDERING ENGINE
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

// Convert MPT node to D3 format
function convertToD3Hierarchy(node, edgeLabel = "root") {
    if (!node) return null;

    let d3Node = {
        id: node.id,
        type: node.type,
        hash: node.hash ? `${node.hash.substring(0, 8)}...` : '',
        edgeLabel: edgeLabel,
        isActive: mpt.activePathIds.has(node.id),
        children: []
    };

    if (node.type === 'leaf') {
        d3Node.title = "LEAF";
        d3Node.data = `Path: [${node.path.map(n=>n.toString(16)).join('')}]\nVal: ${node.value}`;
    } else if (node.type === 'extension') {
        d3Node.title = "EXTENSION";
        d3Node.data = `Shared: [${node.path.map(n=>n.toString(16)).join('')}]`;
        if (node.child) d3Node.children.push(convertToD3Hierarchy(node.child, "ptr"));
    } else if (node.type === 'branch') {
        d3Node.title = "BRANCH";
        d3Node.data = node.value ? `Val: ${node.value}` : `[16 Pointers]`;
        
        node.branches.forEach((child, index) => {
            if (child) {
                const hexChar = index.toString(16);
                d3Node.children.push(convertToD3Hierarchy(child, hexChar));
            }
        });
    }

    if (d3Node.children.length === 0) delete d3Node.children;
    return d3Node;
}

function renderD3Tree() {
    if (!mpt.root) {
        els.emptyState.style.display = 'block';
        d3.select("#canvasWrapper").selectAll("g.node, g.link").remove();
        return;
    }
    els.emptyState.style.display = 'none';

    const treeData = convertToD3Hierarchy(mpt.root);
    const root = d3.hierarchy(treeData);

    const treeLayout = d3.tree().nodeSize([NODE_WIDTH + 40, 120]);
    treeLayout(root);

    // Center tree
    let x0 = Infinity, x1 = -x0;
    root.each(d => {
        if (d.x > x1) x1 = d.x;
        if (d.x < x0) x0 = d.x;
    });

    // 1. Draw Links
    const links = svgGroup.selectAll(".link-group")
        .data(root.links(), d => d.target.data.id);

    links.exit().remove();

    const linkEnter = links.enter().insert("g", "g.node")
        .attr("class", "link-group");

    linkEnter.append("path")
        .attr("class", d => `link ${d.target.data.isActive ? 'active-path' : ''}`)
        .attr("d", d => {
            const start = {x: d.source.x, y: d.source.y + (NODE_HEIGHT/2)};
            return d3.linkVertical().x(p => p.x).y(p => p.y)({source: start, target: start});
        });

    linkEnter.append("text")
        .attr("class", "link-label")
        .attr("text-anchor", "middle")
        .attr("dy", "-5")
        .attr("x", d => d.source.x)
        .attr("y", d => d.source.y + (NODE_HEIGHT/2))
        .text(d => d.target.data.edgeLabel);

    const linkUpdate = linkEnter.merge(links);
    
    linkUpdate.select("path")
        .transition().duration(500)
        .attr("class", d => `link ${d.target.data.isActive ? 'active-path' : ''}`)
        .attr("d", d => {
            const start = {x: d.source.x, y: d.source.y + (NODE_HEIGHT/2)};
            const end = {x: d.target.x, y: d.target.y - (NODE_HEIGHT/2)};
            return d3.linkVertical().x(p => p.x).y(p => p.y)({source: start, target: end});
        });

    linkUpdate.select("text")
        .transition().duration(500)
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + (NODE_HEIGHT/2) + d.target.y - (NODE_HEIGHT/2)) / 2);


    // 2. Draw Nodes
    const nodes = svgGroup.selectAll("g.node")
        .data(root.descendants(), d => d.data.id);

    nodes.exit().transition().duration(400).style("opacity", 0).remove();

    const nodeEnter = nodes.enter().append("g")
        .attr("class", d => `node ${d.data.type} ${d.data.isActive ? 'active-path' : ''}`)
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .style("opacity", 0);

    nodeEnter.append("rect")
        .attr("width", NODE_WIDTH)
        .attr("height", NODE_HEIGHT)
        .attr("x", -(NODE_WIDTH/2))
        .attr("y", -(NODE_HEIGHT/2));

    // Title (LEAF, BRANCH, EXT)
    nodeEnter.append("text")
        .attr("class", "node-type")
        .attr("dy", "-10")
        .attr("text-anchor", "middle")
        .text(d => d.data.title);

    // Hash
    nodeEnter.append("text")
        .attr("class", "node-hash")
        .attr("dy", "5")
        .attr("text-anchor", "middle")
        .text(d => `Hash: ${d.data.hash}`);

    // Data/Path
    nodeEnter.append("text")
        .attr("class", "node-data")
        .attr("dy", "20")
        .attr("text-anchor", "middle")
        .text(d => d.data.data);

    const nodeUpdate = nodeEnter.merge(nodes);
    
    nodeUpdate.transition().duration(500)
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("class", d => `node ${d.data.type} ${d.data.isActive ? 'active-path' : ''}`)
        .style("opacity", 1);
        
    nodeUpdate.select(".node-hash").text(d => `Hash: ${d.data.hash}`);
    nodeUpdate.select(".node-data").text(d => d.data.data);
}
