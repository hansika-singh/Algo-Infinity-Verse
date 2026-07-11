const sandboxRoot = document.getElementById('sandbox-root');
const domTreeView = document.getElementById('dom-tree-view');

// Controls
const algoSelect = document.getElementById('algo-select');
const speedRange = document.getElementById('speed-range');
const speedDisplay = document.getElementById('speed-display');
const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const btnStep = document.getElementById('btn-step');
const btnReset = document.getElementById('btn-reset');

// Stats
const statNodes = document.getElementById('stat-nodes');
const statCurrent = document.getElementById('stat-current');

// State
let isPlaying = false;
let isPaused = false;
let shouldStop = false; 
let stepRequested = false;
let delayMs = parseInt(speedRange.value);
let nodesVisited = 0;

// Mapping actual DOM nodes to Tree View elements for dual-highlighting
const nodeMap = new Map(); // Key: DOM Node, Value: Tree View DOM Element

// Update speed label
speedRange.addEventListener('input', (e) => {
    delayMs = parseInt(e.target.value);
    speedDisplay.innerText = delayMs;
});

// Build the Tree View recursively
function buildTreeView(node, parentTreeElement) {
    // Only process Element Nodes (Node.ELEMENT_NODE === 1)
    if (node.nodeType !== 1) return;

    const div = document.createElement('div');
    div.className = 'tree-node';
    
    let tagHtml = `<span class="tree-tag">&lt;${node.tagName.toLowerCase()}</span>`;
    if (node.className && typeof node.className === 'string') {
        const cleanClass = node.className.replace(/traversal-(active|visited)/g, '').trim();
        if (cleanClass) {
            tagHtml += ` class="<span class="tree-class">${cleanClass}</span>"`;
        }
    }
    if (node.id) {
        tagHtml += ` id="<span class="tree-class">${node.id}</span>"`;
    }
    tagHtml += `<span class="tree-tag">&gt;</span>`;
    
    div.innerHTML = tagHtml;
    parentTreeElement.appendChild(div);
    
    // Map the actual sandbox node to this tree view element
    nodeMap.set(node, div);

    // Recursively build children
    Array.from(node.childNodes).forEach(child => {
        buildTreeView(child, div);
    });
}

// Initialize the visualizer
function init() {
    domTreeView.innerHTML = '';
    nodeMap.clear();
    buildTreeView(sandboxRoot, domTreeView);
}

// Visualizer Yield Engine
// Handles delays, pausing, and step-by-step logic
async function yieldToVisualizer() {
    if (shouldStop) throw new Error("STOP");

    // Handle pausing and stepping
    while (isPaused && !stepRequested && !shouldStop) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    if (stepRequested) {
        stepRequested = false; 
        isPaused = true; 
    }

    if (shouldStop) throw new Error("STOP");

    // Standard delay based on speed slider
    if (!isPaused) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
}

// Helper to highlight a node
function highlightNode(node) {
    node.classList.add('traversal-active');
    node.classList.remove('traversal-visited');
    
    const treeNode = nodeMap.get(node);
    if (treeNode) {
        treeNode.classList.add('active-node');
        // Scroll tree view to show the active node
        treeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    nodesVisited++;
    statNodes.innerText = nodesVisited;
    statCurrent.innerText = `<${node.tagName.toLowerCase()}>`;
}

// Helper to mark a node as visited (backtracking or finished)
function markVisited(node) {
    node.classList.remove('traversal-active');
    node.classList.add('traversal-visited');
    
    const treeNode = nodeMap.get(node);
    if (treeNode) {
        treeNode.classList.remove('active-node');
        treeNode.classList.add('visited-node');
    }
}

// Clear all highlights
function clearHighlights() {
    const activeNodes = document.querySelectorAll('.traversal-active, .traversal-visited, .active-node, .visited-node');
    activeNodes.forEach(node => {
        node.classList.remove('traversal-active', 'traversal-visited', 'active-node', 'visited-node');
    });
    nodesVisited = 0;
    statNodes.innerText = 0;
    statCurrent.innerText = '-';
}

// ==========================================
// ALGORITHMS
// ==========================================

async function dfsPreorder(node) {
    if (node.nodeType !== 1) return; // Only process element nodes
    
    highlightNode(node);
    await yieldToVisualizer();
    
    for (let child of Array.from(node.childNodes)) {
        await dfsPreorder(child);
    }
    
    markVisited(node);
    // Optional: await yieldToVisualizer() here if we want to visualize backtracking step-by-step
}

async function bfsLevelOrder(rootNode) {
    if (rootNode.nodeType !== 1) return;

    const queue = [rootNode];
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        highlightNode(current);
        await yieldToVisualizer();
        
        // Enqueue children
        for (let child of Array.from(current.childNodes)) {
            if (child.nodeType === 1) { // Only Elements
                queue.push(child);
            }
        }
        
        markVisited(current);
    }
}

// ==========================================
// CONTROL BUTTON LOGIC
// ==========================================

async function startTraversal(startPaused = false) {
    clearHighlights();
    isPlaying = true;
    shouldStop = false;
    
    isPaused = startPaused;
    stepRequested = startPaused; // If starting paused via Step button, we want it to execute exactly 1 step then pause.
    
    btnPause.disabled = startPaused;
    btnStep.disabled = false;
    btnPlay.innerText = startPaused ? "Resume" : "Restart";
    
    const algo = algoSelect.value;
    
    try {
        if (algo === 'dfs') {
            await dfsPreorder(sandboxRoot);
        } else if (algo === 'bfs') {
            await bfsLevelOrder(sandboxRoot);
        }
        
        // If it finishes naturally (not aborted)
        if (!shouldStop) {
            statCurrent.innerText = "FINISHED!";
            statCurrent.style.color = "var(--hp-green)";
        }
    } catch (e) {
        if (e.message !== "STOP") console.error(e);
    } finally {
        isPlaying = false;
        isPaused = false;
        btnPause.disabled = true;
        btnStep.disabled = false;
        btnPlay.innerText = "Play";
    }
}

btnPlay.addEventListener('click', () => {
    if (isPlaying && !isPaused) return; 
    
    if (isPaused && isPlaying) {
        isPaused = false;
        btnPause.disabled = false;
        btnPlay.innerText = "Play";
        return;
    }
    
    // Start fresh
    startTraversal(false);
});

btnPause.addEventListener('click', () => {
    if (!isPlaying) return;
    isPaused = true;
    btnPause.disabled = true;
    btnPlay.innerText = "Resume";
});

btnStep.addEventListener('click', () => {
    if (!isPlaying) {
        startTraversal(true);
    } else {
        isPaused = true;
        stepRequested = true;
        btnPause.disabled = true;
        btnPlay.innerText = "Resume";
    }
});

btnReset.addEventListener('click', () => {
    if (isPlaying) {
        shouldStop = true; // Signals the engine to abort
    }
    
    // Reset UI immediately
    clearHighlights();
    btnPlay.innerText = "Play";
    btnPause.disabled = true;
    btnStep.disabled = false;
    domTreeView.scrollTo(0, 0); 
    statCurrent.style.color = "var(--highlight-active)";
});

// Run once on load
init();
