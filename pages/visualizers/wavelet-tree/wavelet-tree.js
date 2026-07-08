// --- STATE MANAGEMENT ---
let currentTreeRoot = null;
let currentMode = 'rank'; // 'rank', 'kth', or 'freq'

// --- DOM ELEMENTS ---
const logConsole = document.getElementById('execution-log');
const queryInputs = document.getElementById('query-inputs');
const querySelector = document.querySelector('.query-selector');

// Inject the Range Frequency button dynamically if it doesn't exist
if (!document.getElementById('btn-mode-freq')) {
    const freqBtn = document.createElement('button');
    freqBtn.id = 'btn-mode-freq';
    freqBtn.className = 'mode-btn';
    freqBtn.innerText = 'Range Freq(L, R, X, Y)';
    querySelector.appendChild(freqBtn);
}

// --- TELEMETRY HELPER ---
const log = (msg, type = 'system') => {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.innerHTML = `> ${msg}`;
    logConsole.appendChild(div);
    logConsole.scrollTop = logConsole.scrollHeight;
};

// --- WAVELET TREE DATA STRUCTURE ---
class WaveletNode {
    /**
     * @param {number[]} arr - The sequence of integers at this node
     * @param {number} low - Minimum possible value in the alphabet range
     * @param {number} high - Maximum possible value in the alphabet range
     */
    constructor(arr, low, high) {
        this.arr = arr;
        this.low = low;
        this.high = high;
        this.left = null;
        this.right = null;
        this.bitVector = [];
        this.prefixSums = [0]; // Prefix sum of 0s (for rank/select routing)
        this.mid = Math.floor((low + high) / 2);

        // Base case: range has collapsed or array is empty
        if (arr.length === 0 || low === high) return;

        const leftArr = [];
        const rightArr = [];

        // Partitioning Phase: Construct bit vector and route elements
        for (let num of arr) {
            if (num <= this.mid) {
                this.bitVector.push(0);
                leftArr.push(num);
                this.prefixSums.push(this.prefixSums[this.prefixSums.length - 1] + 1);
            } else {
                this.bitVector.push(1);
                rightArr.push(num);
                this.prefixSums.push(this.prefixSums[this.prefixSums.length - 1]);
            }
        }

        // Recursive Construction
        if (leftArr.length > 0) this.left = new WaveletNode(leftArr, low, this.mid);
        if (rightArr.length > 0) this.right = new WaveletNode(rightArr, this.mid + 1, high);
    }
}

// --- D3.js VISUALIZATION ENGINE ---
const svg = d3.select("#tree-canvas");
const margin = {top: 40, right: 90, bottom: 50, left: 90};
let width, height;

function updateDimensions() {
    const container = document.querySelector('.visualization-stage');
    width = container.clientWidth - margin.left - margin.right;
    height = container.clientHeight - margin.top - margin.bottom;
}

function renderTree(rootData) {
    svg.selectAll("*").remove(); // Clear stage
    updateDimensions();

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Map custom Wavelet structure to D3 Hierarchy
    const hierarchyData = d3.hierarchy(rootData, d => {
        const children = [];
        if (d.left) children.push(d.left);
        if (d.right) children.push(d.right);
        return children;
    });

    const tree = d3.tree().size([width, height - 100]);
    const nodes = tree(hierarchyData);

    // Links (Edges)
    g.selectAll(".link")
        .data(nodes.descendants().slice(1))
        .enter().append("path")
        .attr("class", d => `link id-${d.data.low}-${d.data.high}`)
        .attr("d", d => {
            return `M${d.x},${d.y} C${d.x},${(d.y + d.parent.y) / 2} ${d.parent.x},${(d.y + d.parent.y) / 2} ${d.parent.x},${d.parent.y}`;
        });

    // Nodes (Rectangles)
    const node = g.selectAll(".node")
        .data(nodes.descendants())
        .enter().append("g")
        .attr("class", d => `node id-node-${d.data.low}-${d.data.high}`)
        .attr("transform", d => `translate(${d.x},${d.y})`);

    // Node Panel
    node.append("rect")
        .attr("x", -60)
        .attr("y", -20)
        .attr("width", 120)
        .attr("height", 50);

    // Array Data Text
    node.append("text")
        .attr("dy", "-2")
        .attr("text-anchor", "middle")
        .text(d => `[${d.data.arr.join(',')}]`);

    // Bit Vector Text
    node.append("text")
        .attr("class", "bit-vector")
        .attr("dy", "15")
        .attr("text-anchor", "middle")
        .text(d => d.data.bitVector.length ? d.data.bitVector.join('') : 'LEAF');
}

// --- QUERY ALGORITHMS & ANIMATION ---

const sleep = ms => new Promise(res => setTimeout(res, ms));

/**
 * Rank Query: Count of 'val' in range [L, R]
 */
async function simulateRank(node, l, r, val) {
    if (!node) return 0;
    
    d3.select(`.id-node-${node.low}-${node.high}`).classed('active', true);
    await sleep(800);

    if (node.low === node.high) {
        const count = r - l + 1;
        log(`Leaf reached. Found ${count} instance(s) of ${val}.`, 'success');
        return count;
    }

    log(`Range [${l}, ${r}] at Alphabet [${node.low}, ${node.high}]. Mid: ${node.mid}`, 'process');

    if (val <= node.mid) {
        const newL = l === 0 ? 0 : node.prefixSums[l];
        const newR = node.prefixSums[r + 1] - 1;
        log(`Value ${val} <= Mid (${node.mid}). Routing LEFT with new L=${newL}, R=${newR}`, 'highlight');
        return await simulateRank(node.left, newL, newR, val);
    } else {
        const newL = l - (l === 0 ? 0 : node.prefixSums[l]);
        const newR = r - node.prefixSums[r + 1];
        log(`Value ${val} > Mid (${node.mid}). Routing RIGHT with new L=${newL}, R=${newR}`, 'highlight');
        return await simulateRank(node.right, newL, newR, val);
    }
}

/**
 * K-th Smallest Element in Range [L, R]
 */
async function simulateKth(node, l, r, k) {
    if (!node) return null;
    
    d3.select(`.id-node-${node.low}-${node.high}`).classed('active', true);
    await sleep(800);

    if (node.low === node.high) {
        log(`Leaf reached. The target element is ${node.low}.`, 'success');
        return node.low;
    }

    log(`Range [${l}, ${r}] | Looking for K: ${k} | Mid: ${node.mid}`, 'process');

    const zeroesBeforeL = l === 0 ? 0 : node.prefixSums[l];
    const zeroesUpToR = node.prefixSums[r + 1];
    const countLeft = zeroesUpToR - zeroesBeforeL;

    if (k <= countLeft) {
        const newL = zeroesBeforeL;
        const newR = zeroesUpToR - 1;
        log(`${k} <= ${countLeft} (elements routed left). Routing LEFT with L=${newL}, R=${newR}`, 'highlight');
        return await simulateKth(node.left, newL, newR, k);
    } else {
        const newL = l - zeroesBeforeL;
        const newR = r - zeroesUpToR;
        log(`${k} > ${countLeft}. Routing RIGHT looking for K=${k - countLeft} with L=${newL}, R=${newR}`, 'highlight');
        return await simulateKth(node.right, newL, newR, k - countLeft);
    }
}

/**
 * Range Frequency: Count of elements in index [L, R] that fall within value range [X, Y]
 */
async function simulateRangeFrequency(node, l, r, x, y) {
    if (!node || l > r || x > node.high || y < node.low) return 0;
    
    d3.select(`.id-node-${node.low}-${node.high}`).classed('active', true);
    await sleep(500);

    if (x <= node.low && y >= node.high) {
        const count = r - l + 1;
        log(`Interval [${node.low}, ${node.high}] is fully within [${x}, ${y}]. Found ${count} elements.`, 'success');
        return count;
    }

    const zeroesBeforeL = l === 0 ? 0 : node.prefixSums[l];
    const zeroesUpToR = node.prefixSums[r + 1];
    
    const leftL = zeroesBeforeL;
    const leftR = zeroesUpToR - 1;
    const rightL = l - zeroesBeforeL;
    const rightR = r - zeroesUpToR;

    log(`Splitting query for Range [${x}, ${y}] at Mid: ${node.mid}`, 'process');

    const leftCount = await simulateRangeFrequency(node.left, leftL, leftR, x, y);
    const rightCount = await simulateRangeFrequency(node.right, rightL, rightR, x, y);

    return leftCount + rightCount;
}

// --- EVENT LISTENERS ---

document.getElementById('btn-build').addEventListener('click', () => {
    const inputStr = document.getElementById('arr-input').value;
    const arr = inputStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    
    if (arr.length === 0) return log('Error: Invalid array input.', 'system');

    const min = Math.min(...arr);
    const max = Math.max(...arr);
    
    logConsole.innerHTML = '';
    log(`Building Wavelet Tree for Alphabet Range: [${min}, ${max}]...`, 'process');
    
    currentTreeRoot = new WaveletNode(arr, min, max);
    renderTree(currentTreeRoot);
    
    log(`Tree construction complete. Ready for queries.`, 'success');
});

// Setup Query Inputs based on Mode
const setupInputs = () => {
    if (currentMode === 'rank') {
        queryInputs.innerHTML = `
            <input type="number" id="q-l" placeholder="L Index" class="cyber-input" style="width:30%">
            <input type="number" id="q-r" placeholder="R Index" class="cyber-input" style="width:30%">
            <input type="number" id="q-val" placeholder="Value (x)" class="cyber-input" style="width:30%">
        `;
    } else if (currentMode === 'kth') {
        queryInputs.innerHTML = `
            <input type="number" id="q-l" placeholder="L Index" class="cyber-input" style="width:30%">
            <input type="number" id="q-r" placeholder="R Index" class="cyber-input" style="width:30%">
            <input type="number" id="q-val" placeholder="K-th" class="cyber-input" style="width:30%">
        `;
    } else if (currentMode === 'freq') {
        queryInputs.innerHTML = `
            <input type="number" id="q-l" placeholder="L Index" class="cyber-input" style="width:23%">
            <input type="number" id="q-r" placeholder="R Index" class="cyber-input" style="width:23%">
            <input type="number" id="q-val" placeholder="Min (X)" class="cyber-input" style="width:23%">
            <input type="number" id="q-y" placeholder="Max (Y)" class="cyber-input" style="width:23%">
        `;
    }
};

const handleModeSwitch = (e, mode) => {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    setupInputs();
};

document.getElementById('btn-mode-rank').addEventListener('click', (e) => handleModeSwitch(e, 'rank'));
document.getElementById('btn-mode-kth').addEventListener('click', (e) => handleModeSwitch(e, 'kth'));
document.getElementById('btn-mode-freq').addEventListener('click', (e) => handleModeSwitch(e, 'freq'));

document.getElementById('btn-query').addEventListener('click', async () => {
    if (!currentTreeRoot) return log('Error: Build tree first.', 'system');

    const l = parseInt(document.getElementById('q-l').value);
    const r = parseInt(document.getElementById('q-r').value);
    const val = parseInt(document.getElementById('q-val').value);
    let y = null;

    if (currentMode === 'freq') {
        y = parseInt(document.getElementById('q-y').value);
        if (isNaN(y)) return log('Error: Provide valid Maximum (Y) integer.', 'system');
    }

    if (isNaN(l) || isNaN(r) || isNaN(val)) return log('Error: Provide valid query integers.', 'system');

    // Reset Visuals
    d3.selectAll('.node').classed('active', false);

    log(`--- Executing ${currentMode.toUpperCase()} Query ---`, 'process');
    
    // Lock UI during animation
    const queryBtn = document.getElementById('btn-query');
    queryBtn.disabled = true;
    queryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        if (currentMode === 'rank') {
            const result = await simulateRank(currentTreeRoot, l, r, val);
            log(`FINAL RESULT: Rank of ${val} in [${l}, ${r}] is ${result}`, 'success');
        } else if (currentMode === 'kth') {
            const result = await simulateKth(currentTreeRoot, l, r, val);
            log(`FINAL RESULT: The ${val}-th smallest element in [${l}, ${r}] is ${result}`, 'success');
        } else if (currentMode === 'freq') {
            const result = await simulateRangeFrequency(currentTreeRoot, l, r, val, y);
            log(`FINAL RESULT: Found ${result} element(s) between [${val}, ${y}] in index range [${l}, ${r}]`, 'success');
        }
    } catch (err) {
        log(`Execution failed: ${err.message}`, 'system');
    } finally {
        // Unlock UI
        queryBtn.disabled = false;
        queryBtn.innerHTML = '<i class="fas fa-bolt"></i> Run Query';
    }
});

// Init
setupInputs();
window.addEventListener('resize', () => { if(currentTreeRoot) renderTree(currentTreeRoot); });
