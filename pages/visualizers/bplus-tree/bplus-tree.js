/**
 * Advanced B+ Tree Architecture
 * Handles dynamic node splitting, key promotion, and leaf linked-lists.
 */

class BPTreeNode {
    /**
     * Initializes a B+ Tree node.
     * @param {boolean} isLeaf - Determines if the node is a leaf (contains data) or internal (routing).
     */
    constructor(isLeaf = false) {
        this.isLeaf = isLeaf;
        this.keys = [];
        this.children = [];
        this.next = null; // Horizontal pointer for O(K) range queries
        this.id = Math.random().toString(36).substr(2, 9);
    }
}

class BPlusTree {
    /**
     * Initializes the B+ Tree.
     * @param {number} order - The maximum number of children per node (m). Max keys = m - 1.
     */
    constructor(order = 4) { 
        this.order = order;
        this.root = new BPTreeNode(true);
    }

    /**
     * Inserts a value into the B+ Tree, handling structural splits dynamically.
     * @param {number} val - The integer key to insert.
     */
    insert(val) {
        const splitData = this._insertRecursive(this.root, val);
        
        // If the root node split, the tree grows in height
        if (splitData) {
            let newRoot = new BPTreeNode(false);
            newRoot.keys = [splitData.key];
            newRoot.children = [this.root, splitData.rightNode];
            this.root = newRoot;
        }
    }

    /**
     * Recursively traverses the tree to find the correct insertion point and handles splits.
     * @param {BPTreeNode} node - The current node being evaluated.
     * @param {number} val - The integer key to insert.
     * @returns {Object|null} Split payload containing the promoted key and right sibling, or null.
     */
    _insertRecursive(node, val) {
        if (node.isLeaf) {
            let pos = 0;
            while (pos < node.keys.length && node.keys[pos] < val) pos++;
            if (node.keys[pos] === val) return null; // Prevent duplicates
            
            node.keys.splice(pos, 0, val);

            if (node.keys.length > this.order - 1) {
                return this._splitLeaf(node);
            }
            return null;
        } else {
            let pos = 0;
            while (pos < node.keys.length && node.keys[pos] <= val) pos++; 

            const splitData = this._insertRecursive(node.children[pos], val);
            
            if (splitData) {
                node.keys.splice(pos, 0, splitData.key);
                node.children.splice(pos + 1, 0, splitData.rightNode);

                if (node.keys.length > this.order - 1) {
                    return this._splitInternal(node);
                }
            }
            return null;
        }
    }

    /**
     * Splits a leaf node in half, maintaining the sequence set linked list.
     * @param {BPTreeNode} node - The leaf node to split.
     * @returns {Object} Payload containing the duplicated promoted key and the new right node.
     */
    _splitLeaf(node) {
        let mid = Math.floor(node.keys.length / 2);
        let rightNode = new BPTreeNode(true);
        
        // Leaf promotion DUPLICATES the key to the parent, so the right node retains it
        rightNode.keys = node.keys.splice(mid); 
        
        // Wire the horizontal sequence set pointers
        rightNode.next = node.next;
        node.next = rightNode;

        return { key: rightNode.keys[0], rightNode: rightNode };
    }

    /**
     * Splits an internal routing node in half.
     * @param {BPTreeNode} node - The internal node to split.
     * @returns {Object} Payload containing the strictly promoted key and the new right node.
     */
    _splitInternal(node) {
        let mid = Math.floor(node.keys.length / 2);
        let rightNode = new BPTreeNode(false);
        
        // Internal promotion PUSHES UP the key, removing it from this level
        let promotedKey = node.keys[mid];
        
        rightNode.keys = node.keys.splice(mid + 1); 
        node.keys.splice(mid); 
        rightNode.children = node.children.splice(mid + 1);

        return { key: promotedKey, rightNode: rightNode };
    }

    /**
     * Formats the tree for D3.js consumption.
     * @param {BPTreeNode} node - The current node to format.
     * @returns {Object} Hierarchical JSON.
     */
    getD3Hierarchy(node = this.root) {
        let res = { 
            id: node.id, 
            keys: node.keys, 
            isLeaf: node.isLeaf,
            next: node.next ? node.next.id : null 
        };
        
        if (!node.isLeaf) {
            res.children = node.children.map(c => this.getD3Hierarchy(c));
        }
        return res;
    }
}

// --- D3.js Visualization Engine ---
const treeOrder = 4;
const tree = new BPlusTree(treeOrder);
let svg, g, treeLayout;
let currentValues = []; // State array for localStorage

const KEY_WIDTH = 40;
const NODE_HEIGHT = 45;

function initD3() {
    svg = d3.select("#viz-canvas");
    const margin = { top: 60, right: 40, bottom: 60, left: 40 };
    g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    treeLayout = d3.tree().nodeSize([treeOrder * KEY_WIDTH + 30, 120]); 
}

/**
 * Executes the D3 rendering pipeline for the B+ Tree.
 */
function updateVisualization() {
    const container = document.querySelector(".canvas-container");
    if (!container) return;
    const containerWidth = container.clientWidth;
    g.selectAll("*").remove(); 

    if (tree.root.keys.length === 0) return;

    const data = tree.getD3Hierarchy();
    const root = d3.hierarchy(data);
    treeLayout(root);

    const xOffset = containerWidth / 2 - (root.x || 0);
    const nodes = root.descendants();
    const links = root.links();

    // 1. Draw Vertical Tree Links
    g.selectAll(".tree-link")
        .data(links)
        .enter().append("path")
        .attr("class", "tree-link")
        .attr("d", d => {
            return `M${d.source.x + xOffset},${d.source.y + (NODE_HEIGHT/2)}
                    C${d.source.x + xOffset},${(d.source.y + d.target.y) / 2}
                     ${d.target.x + xOffset},${(d.source.y + d.target.y) / 2}
                     ${d.target.x + xOffset},${d.target.y - (NODE_HEIGHT/2)}`;
        });

    // 2. Draw Horizontal Leaf Sequence Set
    const leafNodes = nodes.filter(n => n.data.isLeaf);
    leafNodes.forEach((leaf) => {
        if (leaf.data.next) {
            let nextLeaf = leafNodes.find(n => n.data.id === leaf.data.next);
            if (nextLeaf) {
                let startX = leaf.x + xOffset + ((leaf.data.keys.length * KEY_WIDTH)/2);
                let endX = nextLeaf.x + xOffset - ((nextLeaf.data.keys.length * KEY_WIDTH)/2);
                g.append("path")
                    .attr("class", "leaf-link")
                    .attr("marker-end", "url(#arrow)")
                    .attr("d", `M${startX},${leaf.y} L${endX - 10},${leaf.y}`);
            }
        }
    });

    // 3. Draw Variable-Width Nodes
    const nodeGroups = g.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", d => `node ${d.data.isLeaf ? 'leaf' : 'internal'}`)
        .attr("transform", d => `translate(${d.x + xOffset},${d.y})`);

    nodeGroups.each(function(d) {
        const nodeG = d3.select(this);
        const totalWidth = d.data.keys.length * KEY_WIDTH;
        const startX = -(totalWidth / 2);

        nodeG.append("rect")
            .attr("x", startX)
            .attr("y", -(NODE_HEIGHT / 2))
            .attr("width", totalWidth)
            .attr("height", NODE_HEIGHT)
            .attr("rx", 6);

        d.data.keys.forEach((key, i) => {
            let keyX = startX + (i * KEY_WIDTH);
            
            if (i > 0) {
                nodeG.append("line")
                    .attr("x1", keyX).attr("y1", -(NODE_HEIGHT / 2))
                    .attr("x2", keyX).attr("y2", (NODE_HEIGHT / 2))
                    .style("stroke", d.data.isLeaf ? "var(--leaf-color)" : "var(--accent)")
                    .style("stroke-width", "1px")
                    .style("opacity", "0.5");
            }

            nodeG.append("text")
                .attr("x", keyX + (KEY_WIDTH / 2))
                .attr("y", 0)
                .text(key);
        });
    });
}

// --- Storage Integration & Event Listeners ---
function syncStorage() {
    localStorage.setItem("bplus_tree_state", JSON.stringify(currentValues));
}

function loadStorage() {
    const cached = localStorage.getItem("bplus_tree_state");
    if (cached) {
        currentValues = JSON.parse(cached);
        currentValues.forEach(val => tree.insert(val));
        updateVisualization();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initD3();
    loadStorage();

    const input = document.getElementById("node-value");
    const statusTxt = document.querySelector(".status");

    document.getElementById("btn-insert").addEventListener("click", () => {
        // Strict radix 10 parsing and array mapping
        const rawVals = input.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        
        if (rawVals.length > 0) {
            rawVals.forEach(val => {
                tree.insert(val);
                if (!currentValues.includes(val)) currentValues.push(val); // Prevent duplicate tracking
            });
            input.value = "";
            statusTxt.innerText = `Status: Inserted [${rawVals.join(', ')}] | Engine Order: ${treeOrder}`;
            syncStorage();
            updateVisualization();
        }
    });

    document.getElementById("btn-clear").addEventListener("click", () => {
        tree.root = new BPTreeNode(true);
        currentValues = [];
        statusTxt.innerText = `Status: Index Dropped | Engine Order: ${treeOrder}`;
        syncStorage();
        updateVisualization();
    });

    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") document.getElementById("btn-insert").click();
    });
});
