/**
 * huffman-engine.js
 * Implements Huffman Coding Algorithm, generates prefix codes,
 * and renders the resulting binary tree via D3.js.
 */

document.addEventListener("DOMContentLoaded", () => {
    initHuffmanEngine();
});

const els = {
    btnCompress: document.getElementById('btnCompress'),
    textInput: document.getElementById('textInput'),
    freqTableBody: document.getElementById('freqTableBody'),
    treeContainer: document.getElementById('treeContainer'),
    emptyState: document.getElementById('emptyState'),
    
    statOriginal: document.getElementById('statOriginal'),
    statCompressed: document.getElementById('statCompressed'),
    statRatio: document.getElementById('statRatio'),
    outputOriginal: document.getElementById('outputOriginal'),
    outputCompressed: document.getElementById('outputCompressed')
};

// --- Huffman Algorithm Classes ---
class HuffmanNode {
    constructor(char, freq, left = null, right = null) {
        this.char = char;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }
}

// --- Engine State ---
let d3Svg = null;
let d3G = null;

function initHuffmanEngine() {
    els.btnCompress.addEventListener('click', processCompression);
    // Run default example on load
    processCompression();
}

function processCompression() {
    const text = els.textInput.value;
    if (!text) {
        void 0;
        return;
    }

    // 1. Calculate Frequencies
    const freqMap = new Map();
    for (let char of text) {
        freqMap.set(char, (freqMap.get(char) || 0) + 1);
    }

    // 2. Build Priority Queue (Min-Heap simulated with sorting for small N)
    let pq = [];
    for (let [char, freq] of freqMap.entries()) {
        pq.push(new HuffmanNode(char, freq));
    }
    pq.sort((a, b) => a.freq - b.freq);

    // Handle edge case: single unique character
    if (pq.length === 1) {
        const singleNode = pq[0];
        const root = new HuffmanNode(null, singleNode.freq, singleNode, null);
        finalizeCompression(text, root, freqMap);
        return;
    }

    // 3. Build Huffman Tree
    while (pq.length > 1) {
        const left = pq.shift();
        const right = pq.shift();
        
        const merged = new HuffmanNode(null, left.freq + right.freq, left, right);
        
        // Insert merged node back into sorted array
        let inserted = false;
        for (let i = 0; i < pq.length; i++) {
            if (merged.freq < pq[i].freq) {
                pq.splice(i, 0, merged);
                inserted = true;
                break;
            }
        }
        if (!inserted) pq.push(merged);
    }

    const root = pq[0];
    finalizeCompression(text, root, freqMap);
}

function finalizeCompression(text, root, freqMap) {
    // 4. Generate Prefix Codes
    const codes = new Map();
    generateCodes(root, "", codes);

    // 5. Compress Text
    let compressedBinary = "";
    let originalBinary = "";
    for (let char of text) {
        compressedBinary += codes.get(char);
        // Convert to 8-bit binary representation for standard ASCII
        originalBinary += char.charCodeAt(0).toString(2).padStart(8, '0') + " ";
    }

    // 6. Update UI
    updateFrequencyTable(freqMap, codes);
    updateTelemetry(originalBinary.replace(/ /g, '').length, compressedBinary.length);
    
    els.outputOriginal.textContent = originalBinary.trim();
    els.outputCompressed.textContent = compressedBinary;

    // 7. Render D3 Visualization
    renderD3Tree(root);
}

function generateCodes(node, currentCode, codesMap) {
    if (!node) return;
    if (node.char !== null) {
        codesMap.set(node.char, currentCode || "0"); // "0" fallback for single char
        return;
    }
    generateCodes(node.left, currentCode + "0", codesMap);
    generateCodes(node.right, currentCode + "1", codesMap);
}

function updateFrequencyTable(freqMap, codesMap) {
    els.freqTableBody.innerHTML = '';
    
    // Sort by frequency descending
    const sortedEntries = [...freqMap.entries()].sort((a, b) => b[1] - a[1]);

    sortedEntries.forEach(([char, freq]) => {
        const tr = document.createElement('tr');
        
        // Handle space visual representation
        let displayChar = char;
        if (char === ' ') displayChar = '" " (Space)';
        else if (char === '\n') displayChar = '\\n (Newline)';

        tr.innerHTML = `
            <td class="char-col">${displayChar}</td>
            <td>${freq}</td>
            <td class="code-col">${codesMap.get(char)}</td>
        `;
        els.freqTableBody.appendChild(tr);
    });
}

function updateTelemetry(origBits, compBits) {
    els.statOriginal.textContent = origBits.toLocaleString();
    els.statCompressed.textContent = compBits.toLocaleString();
    
    const ratio = ((1 - (compBits / origBits)) * 100).toFixed(2);
    els.statRatio.textContent = `${ratio}% Saved`;
    
    if (ratio < 0) {
        els.statRatio.style.color = 'var(--huff-danger)';
        els.statRatio.style.textShadow = 'none';
    } else {
        els.statRatio.style.color = 'var(--huff-primary)';
        els.statRatio.style.textShadow = '0 0 15px rgba(16, 185, 129, 0.3)';
    }
}

// ==========================================
// D3.js TREE VISUALIZATION
// ==========================================

// Convert custom HuffmanNode to D3 Hierarchy format
function convertToD3Hierarchy(node, edgeLabel = "") {
    if (!node) return null;
    
    let name = node.char !== null ? `'${node.char}'` : `${node.freq}`;
    if (node.char === ' ') name = `Space`;
    
    let d3Node = {
        name: name,
        freq: node.freq,
        isLeaf: node.char !== null,
        edgeLabel: edgeLabel,
        children: []
    };

    if (node.left) d3Node.children.push(convertToD3Hierarchy(node.left, "0"));
    if (node.right) d3Node.children.push(convertToD3Hierarchy(node.right, "1"));
    
    if (d3Node.children.length === 0) delete d3Node.children;
    
    return d3Node;
}

function renderD3Tree(huffmanRoot) {
    els.emptyState.style.display = 'none';
    d3.select("#treeContainer").selectAll("svg").remove(); // Clear old

    const treeData = convertToD3Hierarchy(huffmanRoot);
    
    const width = els.treeContainer.clientWidth;
    const height = els.treeContainer.clientHeight;
    
    // Setup SVG with Zoom & Pan
    d3Svg = d3.select("#treeContainer")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom().on("zoom", (event) => {
            d3G.attr("transform", event.transform);
        }));

    d3G = d3Svg.append("g")
        .attr("transform", `translate(${width / 2}, 40)`); // Center top

    const root = d3.hierarchy(treeData);
    
    // Tree Layout setup (dynamic spacing based on depth/width)
    const treeLayout = d3.tree().nodeSize([50, 70]);
    treeLayout(root);

    // Center the tree horizontally
    let x0 = Infinity;
    let x1 = -x0;
    root.each(d => {
        if (d.x > x1) x1 = d.x;
        if (d.x < x0) x0 = d.x;
    });
    // Initial transform to ensure it fits
    d3Svg.call(d3.zoom().transform, d3.zoomIdentity.translate(width / 2, 40).scale(1));

    // 1. Draw Links
    const links = d3G.selectAll(".link")
        .data(root.links())
        .enter().append("g");

    links.append("path")
        .attr("class", "link")
        .attr("d", d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y)
        );

    // 2. Draw Edge Labels (0 or 1)
    links.append("rect")
        .attr("class", "link-label-bg")
        .attr("x", d => ((d.source.x + d.target.x) / 2) - 6)
        .attr("y", d => ((d.source.y + d.target.y) / 2) - 8)
        .attr("width", 12)
        .attr("height", 16)
        .attr("rx", 3);

    links.append("text")
        .attr("class", "link-label")
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + d.target.y) / 2)
        .attr("dy", "0.3em")
        .text(d => d.target.data.edgeLabel)
        .style("fill", d => d.target.data.edgeLabel === "0" ? "#38bdf8" : "#f472b6"); // Color code edges

    // 3. Draw Nodes
    const nodes = d3G.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", d => d.data.isLeaf ? "node leaf" : "node")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    nodes.append("circle")
        .attr("r", d => d.data.isLeaf ? 16 : 14);

    nodes.append("text")
        .text(d => d.data.name);
}
