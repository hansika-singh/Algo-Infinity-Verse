/**
 * Advanced Binomial Heap Architecture
 * Handles O(log N) operations and dynamic tree structural mapping.
 */

class Node {
    constructor(val) {
        this.val = val;
        this.degree = 0;
        this.parent = null;
        this.child = null;
        this.sibling = null;
        this.id = Math.random().toString(36).substr(2, 9);
    }
}

class BinomialHeap {
    constructor() {
        this.head = null;
    }

    /**
     * Links binomial tree y as a leftmost child of binomial tree z.
     * @param {Node} y - The tree to become a child.
     * @param {Node} z - The root tree gaining a child.
     */
    link(y, z) {
        y.parent = z;
        y.sibling = z.child;
        z.child = y;
        z.degree++;
    }

    /**
     * Merges two binomial heap root lists strictly by increasing degree.
     * @param {Node} h1 - The head of the first heap.
     * @param {Node} h2 - The head of the second heap.
     * @returns {Node} The new merged root list head.
     */
    mergeHeaps(h1, h2) {
        if (!h1) return h2;
        if (!h2) return h1;
        let head, tail;
        
        if (h1.degree <= h2.degree) { head = h1; h1 = h1.sibling; } 
        else { head = h2; h2 = h2.sibling; }
        
        tail = head;
        while (h1 && h2) {
            if (h1.degree <= h2.degree) { tail.sibling = h1; h1 = h1.sibling; } 
            else { tail.sibling = h2; h2 = h2.sibling; }
            tail = tail.sibling;
        }
        tail.sibling = h1 ? h1 : h2;
        return head;
    }

    /**
     * Consolidates the heap to restore binomial structural constraints.
     * @param {Node} otherHead - The head of the heap to unite with the current heap.
     */
    union(otherHead) {
        let newHead = this.mergeHeaps(this.head, otherHead);
        if (!newHead) return;
        
        let prev = null;
        let x = newHead;
        let next = x.sibling;
        
        while (next) {
            if (x.degree !== next.degree || (next.sibling && next.sibling.degree === x.degree)) {
                prev = x;
                x = next;
            } else if (x.val <= next.val) {
                x.sibling = next.sibling;
                this.link(next, x);
            } else {
                if (!prev) newHead = next;
                else prev.sibling = next;
                this.link(x, next);
                x = next;
            }
            next = x.sibling;
        }
        this.head = newHead;
    }

    /**
     * Inserts a new value into the binomial heap.
     * @param {number} val - The integer value to insert.
     */
    insert(val) {
        let node = new Node(val);
        this.union(node);
    }

    /**
     * Extracts and removes the minimum value from the binomial heap.
     * @returns {number|null} The minimum value, or null if the heap is empty.
     */
    extractMin() {
        if (!this.head) return null;
        
        let min = this.head, minPrev = null;
        let curr = this.head.sibling, prev = this.head;
        
        while (curr) {
            if (curr.val < min.val) { min = curr; minPrev = prev; }
            prev = curr;
            curr = curr.sibling;
        }
        
        if (!minPrev) this.head = min.sibling;
        else minPrev.sibling = min.sibling;
        
        let childHead = null, childCurr = min.child;
        while (childCurr) {
            let next = childCurr.sibling;
            childCurr.sibling = childHead;
            childCurr.parent = null;
            childHead = childCurr;
            childCurr = next;
        }
        
        this.union(childHead);
        return min.val;
    }

    /**
     * Translates the linked-list architecture into a D3.js compatible Hierarchy JSON.
     * @returns {Object} A hierarchical JSON structure suitable for D3.tree().
     */
    getD3Hierarchy() {
        const convert = (node) => {
            if (!node) return null;
            let result = { id: node.id, name: node.val, degree: node.degree, children: [] };
            let currChild = node.child;
            while (currChild) {
                result.children.push(convert(currChild));
                currChild = currChild.sibling;
            }
            // CodeRabbit fix: removed result.children.reverse() to preserve accurate tree layout
            return result;
        };

        let roots = [];
        let curr = this.head;
        while (curr) {
            roots.push(convert(curr));
            curr = curr.sibling;
        }
        return { name: "VirtualRoot", id: "virtual-root", children: roots };
    }
}

// --- D3.js Visualization Engine ---
const heap = new BinomialHeap();
let svg, g, rootLayout;
let currentValues = []; // State array for localStorage

function initD3() {
    svg = d3.select("#viz-canvas");
    const margin = { top: 60, right: 20, bottom: 20, left: 20 };
    g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    rootLayout = d3.tree().nodeSize([60, 80]);
}

function updateVisualization() {
    const container = document.querySelector(".canvas-container");
    if (!container) return;
    const containerWidth = container.clientWidth;
    
    if (!heap.head) {
        g.selectAll("*").remove();
        return;
    }

    const data = heap.getD3Hierarchy();
    const root = d3.hierarchy(data);
    rootLayout(root);
    const xOffset = containerWidth / 2 - (root.x || 0);

    const nodes = root.descendants().slice(1); 
    const links = root.links().filter(d => d.source.depth > 0);

    const link = g.selectAll(".link").data(links, d => d.target.data.id);
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", d => {
            const start = { x: d.source.x + xOffset, y: d.source.y - 40 };
            return `M${start.x},${start.y}C${start.x},${start.y} ${start.x},${start.y} ${start.x},${start.y}`;
        })
        .merge(link)
        .transition().duration(500)
        .attr("d", d => {
            return `M${d.source.x + xOffset},${d.source.y}
                    C${d.source.x + xOffset},${(d.source.y + d.target.y) / 2}
                     ${d.target.x + xOffset},${(d.source.y + d.target.y) / 2}
                     ${d.target.x + xOffset},${d.target.y}`;
        });
    link.exit().transition().duration(300).style("opacity", 0).remove();

    const node = g.selectAll(".node").data(nodes, d => d.data.id);
    const nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x + xOffset},${d.y - 30})`)
        .style("opacity", 0);
    nodeEnter.append("circle").attr("r", 20);
    nodeEnter.append("text").text(d => d.data.name);
    nodeEnter.append("text").attr("class", "degree-label").text(d => `deg: ${d.data.degree}`);
    
    const nodeUpdate = nodeEnter.merge(node);
    nodeUpdate.transition().duration(500)
        .attr("transform", d => `translate(${d.x + xOffset},${d.y})`)
        .style("opacity", 1);
    nodeUpdate.select(".degree-label").text(d => `deg: ${d.data.degree}`);
    
    node.exit().transition().duration(300)
        .attr("transform", d => `translate(${d.x + xOffset},${d.y + 30})`)
        .style("opacity", 0).remove();
}

// --- Storage Integration & Event Listeners ---
function syncStorage() {
    localStorage.setItem("binomial_heap_state", JSON.stringify(currentValues));
}

function loadStorage() {
    const cached = localStorage.getItem("binomial_heap_state");
    if (cached) {
        currentValues = JSON.parse(cached);
        currentValues.forEach(val => heap.insert(val));
        updateVisualization();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initD3();
    loadStorage();

    const input = document.getElementById("node-value");
    const statusTxt = document.querySelector(".status");

    // Fix: Allow array-based input (comma separated) and parse with radix 10
    document.getElementById("btn-insert").addEventListener("click", () => {
        const rawVals = input.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        
        if (rawVals.length > 0) {
            rawVals.forEach(val => {
                heap.insert(val);
                currentValues.push(val);
            });
            input.value = "";
            statusTxt.innerText = `Status: Inserted [${rawVals.join(', ')}] | Complexity: O(log N)`;
            syncStorage();
            updateVisualization();
        }
    });

    document.getElementById("btn-extract").addEventListener("click", () => {
        const min = heap.extractMin();
        if (min !== null) {
            statusTxt.innerText = `Status: Extracted Minimum (${min}) | Complexity: O(log N)`;
            
            // Remove extracted min from state tracking to keep storage synced
            const minIndex = currentValues.indexOf(min);
            if (minIndex > -1) currentValues.splice(minIndex, 1);
            
            syncStorage();
            updateVisualization();
        } else {
            statusTxt.innerText = `Status: Heap is empty`;
        }
    });

    document.getElementById("btn-clear").addEventListener("click", () => {
        heap.head = null;
        currentValues = [];
        statusTxt.innerText = `Status: Canvas Cleared`;
        syncStorage();
        updateVisualization();
    });

    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") document.getElementById("btn-insert").click();
    });
});
