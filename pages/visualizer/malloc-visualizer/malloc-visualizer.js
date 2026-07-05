/**
 * malloc-visualizer.js
 * Implements the Buddy Memory Allocation algorithm.
 * Manages allocation requests, powers-of-two splitting, memory coalescing,
 * fragmentation math, and visualizes the binary tree using D3.js.
 */

document.addEventListener("DOMContentLoaded", () => {
    initMallocVisualizer();
});

// ==========================================
// 1. BUDDY ALLOCATOR LOGIC & STATE
// ==========================================

const TOTAL_MEMORY = 1024;
const MIN_BLOCK_SIZE = 16;

class MemNode {
    constructor(size, startAddr, id) {
        this.size = size;
        this.startAddr = startAddr;
        this.id = id;
        this.isFree = true;
        this.isSplit = false;
        this.left = null;
        this.right = null;
        
        // Payload info
        this.allocName = null;
        this.reqSize = 0; // Exactly what the user asked for
    }
}

let rootNode = null;
let activeAllocations = []; // { id, name, reqSize, blockSize }
let ptrCounter = 1;

// Math helper
function nextPowerOfTwo(n) {
    let p = 1;
    while (p < n) p <<= 1;
    // Enforce minimum block size
    return Math.max(p, MIN_BLOCK_SIZE);
}

function initAllocator() {
    rootNode = new MemNode(TOTAL_MEMORY, 0, "root");
    activeAllocations = [];
    ptrCounter = 1;
}

function allocateMemory(targetBlockSize, reqSize, name) {
    return _allocate(rootNode, targetBlockSize, reqSize, name);
}

function _allocate(node, targetSize, reqSize, name) {
    // 1. If block is too small or already used (but not split), fail
    if (node.size < targetSize) return null;
    if (!node.isFree && !node.isSplit) return null;

    // 2. If exact size match, and it's perfectly free (not split)
    if (node.size === targetSize && !node.isSplit && node.isFree) {
        node.isFree = false;
        node.allocName = name;
        node.reqSize = reqSize;
        return node;
    }

    // 3. If block is larger, we need to split it if it isn't already
    if (!node.isSplit && node.size > targetSize) {
        if (node.size <= MIN_BLOCK_SIZE) return null; // Safety boundary
        node.isSplit = true;
        node.isFree = false; // Internal nodes are marked false
        node.left = new MemNode(node.size / 2, node.startAddr, node.id + "-L");
        node.right = new MemNode(node.size / 2, node.startAddr + (node.size / 2), node.id + "-R");
    }

    // 4. Recurse down split children (Prefer left/lower addresses first)
    if (node.isSplit) {
        let res = _allocate(node.left, targetSize, reqSize, name);
        if (!res) res = _allocate(node.right, targetSize, reqSize, name);
        return res;
    }

    return null;
}

function freeMemory(nodeId) {
    _free(rootNode, nodeId);
    _coalesce(rootNode);
}

function _free(node, targetId) {
    if (!node) return false;
    
    if (!node.isSplit && node.id === targetId) {
        node.isFree = true;
        node.allocName = null;
        node.reqSize = 0;
        return true;
    }
    
    if (node.isSplit) {
        if (_free(node.left, targetId)) return true;
        if (_free(node.right, targetId)) return true;
    }
    return false;
}

function _coalesce(node) {
    if (!node || !node.isSplit) return;
    
    // Bottom-up recursion
    _coalesce(node.left);
    _coalesce(node.right);
    
    // If both children are completely free (not split and isFree=true), merge them!
    if (!node.left.isSplit && !node.right.isSplit && node.left.isFree && node.right.isFree) {
        node.isSplit = false;
        node.isFree = true;
        node.left = null;
        node.right = null;
    }
}

// Extract leaf nodes in address order for the RAM Bar
function getLeafNodes(node, arr = []) {
    if (!node) return arr;
    if (!node.isSplit) {
        arr.push(node);
    } else {
        getLeafNodes(node.left, arr);
        getLeafNodes(node.right, arr);
    }
    return arr;
}

// Find largest free block for External Fragmentation math
function getLargestFreeBlock(node) {
    if (!node) return 0;
    if (!node.isSplit && node.isFree) return node.size;
    if (node.isSplit) {
        return Math.max(getLargestFreeBlock(node.left), getLargestFreeBlock(node.right));
    }
    return 0;
}

// ==========================================
// 2. UI ORCHESTRATION & EVENTS
// ==========================================
const els = {
    mallocSize: document.getElementById('mallocSize'),
    btnMalloc: document.getElementById('btnMalloc'),
    btnRandomAlloc: document.getElementById('btnRandomAlloc'),
    btnResetHeap: document.getElementById('btnResetHeap'),
    
    pointersList: document.getElementById('pointersList'),
    pointersEmpty: document.getElementById('pointersEmpty'),
    
    ramBarContainer: document.getElementById('ramBarContainer'),
    treeContainer: document.getElementById('treeContainer'),
    
    usageBar: document.getElementById('usageBar'),
    usageBytes: document.getElementById('usageBytes'),
    largestFree: document.getElementById('largestFree'),
    internalFrag: document.getElementById('internalFrag'),
    fragExplanation: document.getElementById('fragExplanation'),
    
    logContainer: document.getElementById('logContainer'),
    engineBadge: document.getElementById('engineBadge')
};

let d3Svg, d3G;

function initMallocVisualizer() {
    initAllocator();
    bindEvents();
    updateAllViews();
}

function bindEvents() {
    els.btnMalloc.addEventListener('click', handleMalloc);
    els.mallocSize.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') handleMalloc();
    });
    
    els.btnRandomAlloc.addEventListener('click', () => {
        const sizes = [12, 24, 45, 60, 100, 150, 200, 300];
        els.mallocSize.value = sizes[Math.floor(Math.random() * sizes.length)];
        handleMalloc();
    });

    els.btnResetHeap.addEventListener('click', () => {
        initAllocator();
        logSys("Heap memory forcefully reset. All allocations wiped.", "error");
        updateAllViews();
    });
}

function logSys(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-line ${type}`;
    div.textContent = `> ${msg}`;
    els.logContainer.appendChild(div);
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

function handleMalloc() {
    const reqSize = parseInt(els.mallocSize.value);
    if (isNaN(reqSize) || reqSize <= 0) return alert("Enter a valid positive byte size.");
    if (reqSize > TOTAL_MEMORY) return alert(`Requested size exceeds maximum heap limit of ${TOTAL_MEMORY}B.`);

    const targetSize = nextPowerOfTwo(reqSize);
    const ptrName = `*p${ptrCounter++}`;
    
    // Check if we have total memory but fail due to external fragmentation
    const leaves = getLeafNodes(rootNode);
    let totalFree = 0;
    leaves.forEach(l => { if(l.isFree) totalFree += l.size; });
    
    const largestContiguous = getLargestFreeBlock(rootNode);

    const allocatedNode = allocateMemory(targetSize, reqSize, ptrName);

    if (allocatedNode) {
        activeAllocations.push({
            id: allocatedNode.id,
            name: ptrName,
            reqSize: reqSize,
            blockSize: targetSize
        });
        logSys(`malloc(${reqSize}) -> Allocated ${targetSize}B block at ${ptrName}.`, "success");
        setEngineStatus(true, "Allocation Success");
    } else {
        // Out of memory! Determine reason.
        if (reqSize <= totalFree && targetSize > largestContiguous) {
            logSys(`malloc(${reqSize}) -> FAILED. EXTERNAL FRAGMENTATION! Total free is ${totalFree}B, but largest contiguous block is only ${largestContiguous}B.`, "error");
            setEngineStatus(false, "External Fragmentation (OOM)");
        } else {
            logSys(`malloc(${reqSize}) -> FAILED. Out of Memory. Not enough total free space.`, "error");
            setEngineStatus(false, "Out Of Memory (OOM)");
        }
    }
    
    els.mallocSize.value = '';
    updateAllViews();
}

function handleFree(ptrId, ptrName) {
    freeMemory(ptrId);
    activeAllocations = activeAllocations.filter(a => a.id !== ptrId);
    logSys(`free(${ptrName}) -> Memory released and buddies coalesced.`, "info");
    setEngineStatus(true, "Memory Freed");
    updateAllViews();
}

function setEngineStatus(isOk, msg) {
    if (isOk) {
        els.engineBadge.className = 'engine-badge';
        els.engineBadge.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
    } else {
        els.engineBadge.className = 'engine-badge error';
        els.engineBadge.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${msg}`;
    }
}

// ==========================================
// 3. UI RENDERING & TELEMETRY
// ==========================================

function updateAllViews() {
    renderPointerList();
    renderRAMBar();
    updateTelemetry();
    renderD3Tree();
}

function renderPointerList() {
    els.pointersList.innerHTML = '';
    if (activeAllocations.length === 0) {
        els.pointersEmpty.style.display = 'block';
        return;
    }
    els.pointersEmpty.style.display = 'none';

    activeAllocations.forEach(alloc => {
        const div = document.createElement('div');
        div.className = 'ptr-card';
        div.innerHTML = `
            <div class="ptr-info">
                <span class="ptr-name">${alloc.name}</span>
                <span class="ptr-details">Req: ${alloc.reqSize}B | Blk: ${alloc.blockSize}B</span>
            </div>
            <button class="btn-free" data-id="${alloc.id}" data-name="${alloc.name}">free()</button>
        `;
        div.querySelector('.btn-free').addEventListener('click', (e) => {
            handleFree(e.target.dataset.id, e.target.dataset.name);
        });
        els.pointersList.appendChild(div);
    });
}

function renderRAMBar() {
    els.ramBarContainer.innerHTML = '';
    const leaves = getLeafNodes(rootNode);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'ram-wrapper';

    leaves.forEach(leaf => {
        const pct = (leaf.size / TOTAL_MEMORY) * 100;
        const block = document.createElement('div');
        
        if (leaf.isFree) {
            block.className = 'ram-block free';
            block.style.width = `${pct}%`;
        } else {
            block.className = 'ram-block used';
            block.style.width = `${pct}%`;
            
            // Calculate Waste
            const payloadPct = (leaf.reqSize / leaf.size) * 100;
            const wastePct = 100 - payloadPct;
            
            block.innerHTML = `
                <div class="ram-payload used-bg" style="width: ${payloadPct}%;">${leaf.allocName}</div>
                <div class="ram-waste" style="width: ${wastePct}%;"></div>
            `;
        }
        wrapper.appendChild(block);
    });

    els.ramBarContainer.appendChild(wrapper);
}

function updateTelemetry() {
    const leaves = getLeafNodes(rootNode);
    let usedMem = 0;
    let internalWaste = 0;
    let totalFree = 0;

    leaves.forEach(l => {
        if (!l.isFree) {
            usedMem += l.size;
            internalWaste += (l.size - l.reqSize);
        } else {
            totalFree += l.size;
        }
    });

    const largestFree = getLargestFreeBlock(rootNode);

    // Update Progress Bar
    const usagePct = (usedMem / TOTAL_MEMORY) * 100;
    els.usageBar.style.width = `${usagePct}%`;
    els.usageBytes.textContent = usedMem;

    // Update Stats
    els.largestFree.textContent = `${largestFree} B`;
    els.internalFrag.textContent = `${internalWaste} B`;

    // Explanation Logic
    els.fragExplanation.className = 'frag-explanation';
    if (internalWaste > (TOTAL_MEMORY * 0.2)) {
        els.fragExplanation.classList.add('warning');
        els.fragExplanation.innerHTML = `<i class="fas fa-exclamation-triangle"></i> High Internal Fragmentation! Large blocks allocated for small payload requests.`;
    } 
    else if (totalFree > 0 && largestFree < totalFree && largestFree < 128) {
        els.fragExplanation.classList.add('error');
        els.fragExplanation.innerHTML = `<i class="fas fa-skull-crossbones"></i> External Fragmentation detected. Free memory is scattered in small chunks, preventing large allocations.`;
    }
    else {
        els.fragExplanation.classList.add('healthy');
        els.fragExplanation.innerHTML = `<i class="fas fa-check-circle"></i> Heap is healthy. Memory optimally packed.`;
    }
}

// ==========================================
// 4. D3.JS BINARY TREE VISUALIZATION
// ==========================================

function convertToD3Hierarchy(node) {
    if (!node) return null;
    
    let d3Node = {
        id: node.id,
        name: node.isSplit ? "" : (node.allocName || "Free"),
        sizeStr: `${node.size}B`,
        isFree: node.isFree,
        isSplit: node.isSplit,
        children: []
    };

    if (node.isSplit) {
        d3Node.children.push(convertToD3Hierarchy(node.left));
        d3Node.children.push(convertToD3Hierarchy(node.right));
    } else {
        delete d3Node.children;
    }
    
    return d3Node;
}

function renderD3Tree() {
    d3.select("#treeContainer").selectAll("svg").remove();

    const treeData = convertToD3Hierarchy(rootNode);
    if (!treeData) return;

    const width = els.treeContainer.clientWidth;
    const height = els.treeContainer.clientHeight || 300;
    const margin = { top: 40, right: 20, bottom: 40, left: 20 };

    d3Svg = d3.select("#treeContainer")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .call(d3.zoom().on("zoom", (event) => {
            d3G.attr("transform", event.transform);
        }));

    d3G = d3Svg.append("g")
        .attr("transform", `translate(${width / 2}, ${margin.top})`);

    const root = d3.hierarchy(treeData);
    
    // nodeSize: [width, height] spacing
    const treeLayout = d3.tree().nodeSize([80, 80]);
    treeLayout(root);

    // Center tree dynamically
    let x0 = Infinity;
    let x1 = -x0;
    root.each(d => {
        if (d.x > x1) x1 = d.x;
        if (d.x < x0) x0 = d.x;
    });
    d3Svg.call(d3.zoom().transform, d3.zoomIdentity.translate(width / 2, margin.top).scale(1));

    // Links
    d3G.selectAll(".link")
        .data(root.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y)
        );

    // Nodes
    const nodeEnter = d3G.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", d => {
            if (d.data.isSplit) return "node split";
            if (d.data.isFree) return "node free";
            return "node used";
        })
        .attr("transform", d => `translate(${d.x},${d.y})`);

    // Rectangles
    nodeEnter.append("rect")
        .attr("width", 60)
        .attr("height", 40)
        .attr("x", -30)
        .attr("y", -20);

    // Size Text
    nodeEnter.append("text")
        .attr("dy", d => d.data.isSplit ? "0.35em" : "-0.2em")
        .text(d => d.data.sizeStr);

    // Name Subtext (if leaf)
    nodeEnter.append("text")
        .attr("class", "node-subtext")
        .attr("dy", "1.5em")
        .text(d => d.data.name);
}
