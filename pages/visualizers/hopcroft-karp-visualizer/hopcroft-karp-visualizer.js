/**
 * Hopcroft-Karp Maximum Bipartite Matching Visualizer
 */

// --- Graph State & Configuration ---
let nodes = []; // { id, set: 'L' | 'R', x, y }
let edges = []; // { source, target, matched: boolean }
let nextNodeId = 1;

let currentMode = "add-left";
let selectedNode = null;
let isPlaying = false;
let isPaused = false;
let animSpeed = 800;

// Algorithm State
let pairU = new Map(); // node ID in U -> node ID in V
let pairV = new Map(); // node ID in V -> node ID in U
let dist = new Map();  // node ID in U -> distance

let algorithmSteps = []; // Stores generator snapshots/steps
let currentStepIndex = -1;

const svgNodes = document.getElementById("svgNodes");
const svgEdges = document.getElementById("svgEdges");
const visualizerSvg = document.getElementById("visualizerSvg");

// --- Initialization & Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
  setupUIHandlers();
  // Load the perfect matching preset by default so users see a beautiful graph immediately
  document.getElementById("presetSelect").value = "perfect";
  loadPreset("perfect");
});

function setupUIHandlers() {
  // Mode Buttons
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      currentMode = e.currentTarget.dataset.mode;
      document.getElementById("canvasModeBadge").innerText = `Mode: ${e.currentTarget.innerText}`;
      selectedNode = null; // Reset selection
    });
  });

  // Controls
  document.getElementById("startBtn").addEventListener("click", startAlgorithm);
  document.getElementById("pauseBtn").addEventListener("click", pauseAlgorithm);
  document.getElementById("resetBtn").addEventListener("click", resetAlgorithm);
  document.getElementById("clearLogsBtn").addEventListener("click", () => {
    document.getElementById("logPanel").innerHTML = "";
  });

  document.getElementById("speedRange").addEventListener("input", (e) => {
    animSpeed = parseInt(e.target.value);
    document.getElementById("speedDisplay").innerText = `${animSpeed}ms`;
  });

  // Presets
  document.getElementById("presetSelect").addEventListener("change", (e) => {
    loadPreset(e.target.value);
    e.target.value = "empty"; // Reset dropdown
  });

  // SVG Interactions
  visualizerSvg.addEventListener("click", handleSvgClick);
}

function handleSvgClick(e) {
  if (isPlaying) return; // Prevent edits during execution
  
  const rect = visualizerSvg.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (currentMode === "add-left" && x < rect.width / 2) {
    addNode(x, y, "L");
  } else if (currentMode === "add-right" && x > rect.width / 2) {
    addNode(x, y, "R");
  } else if (currentMode === "add-edge" || currentMode === "delete") {
    // Handled by node clicks
  } else if (currentMode === "add-left" || currentMode === "add-right") {
    addLog(`Cannot add node here. Set L is on the left, Set R is on the right.`, 'sys');
  }
}

function addNode(x, y, set) {
  nodes.push({ id: nextNodeId++, set, x, y });
  drawGraph();
}

function handleNodeClick(e, node) {
  e.stopPropagation();
  if (isPlaying) return;

  if (currentMode === "delete") {
    nodes = nodes.filter(n => n.id !== node.id);
    edges = edges.filter(edge => edge.source !== node.id && edge.target !== node.id);
    drawGraph();
  } else if (currentMode === "add-edge") {
    if (!selectedNode) {
      selectedNode = node;
      addLog(`Selected Node ${node.id}. Click a node in the opposite set to connect.`, 'sys');
    } else {
      if (selectedNode.set !== node.set) {
        // Ensure source is L and target is R for consistency
        let source = selectedNode.set === 'L' ? selectedNode.id : node.id;
        let target = selectedNode.set === 'R' ? selectedNode.id : node.id;
        
        // Check if edge already exists
        if (!edges.find(edge => edge.source === source && edge.target === target)) {
          edges.push({ source, target, matched: false });
          addLog(`Added edge between ${source} and ${target}.`, 'sys');
        }
      } else {
        addLog(`Cannot add edge within the same set.`, 'sys');
      }
      selectedNode = null;
      drawGraph();
    }
  }
}

function handleEdgeClick(e, edge) {
  e.stopPropagation();
  if (isPlaying) return;

  if (currentMode === "delete") {
    edges = edges.filter(e => !(e.source === edge.source && e.target === edge.target));
    drawGraph();
  }
}

function drawGraph() {
  // Clear
  svgNodes.innerHTML = "";
  svgEdges.innerHTML = "";

  // Draw Edges
  edges.forEach(edge => {
    const srcNode = nodes.find(n => n.id === edge.source);
    const tgtNode = nodes.find(n => n.id === edge.target);
    if (!srcNode || !tgtNode) return;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", srcNode.x);
    line.setAttribute("y1", srcNode.y);
    line.setAttribute("x2", tgtNode.x);
    line.setAttribute("y2", tgtNode.y);
    line.classList.add("edge-line");
    if (edge.matched) line.classList.add("matched-edge");
    line.addEventListener("click", (e) => handleEdgeClick(e, edge));
    
    // Add custom ID for algorithm animation
    line.id = `edge-${edge.source}-${edge.target}`;
    
    svgEdges.appendChild(line);
  });

  // Draw Nodes
  nodes.forEach(node => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", node.x);
    circle.setAttribute("cy", node.y);
    circle.setAttribute("r", 15);
    circle.classList.add("node-circle", node.set === "L" ? "set-l" : "set-r");
    circle.id = `node-${node.id}`;
    
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", node.x);
    text.setAttribute("y", node.y);
    text.classList.add("node-text");
    text.textContent = node.id;

    g.appendChild(circle);
    g.appendChild(text);
    
    // Distance label for BFS
    const distText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    distText.setAttribute("x", node.x - 20);
    distText.setAttribute("y", node.y - 20);
    distText.classList.add("node-dist");
    distText.id = `dist-${node.id}`;
    g.appendChild(distText);

    g.addEventListener("click", (e) => handleNodeClick(e, node));
    svgNodes.appendChild(g);
  });

  document.getElementById("canvasPlaceholder").style.display = nodes.length > 0 ? "none" : "block";
}

// --- Visual & Logging Utils ---
function addLog(msg, type = "sys") {
  const panel = document.getElementById("logPanel");
  const el = document.createElement("div");
  el.className = `log-entry ${type}`;
  el.innerText = msg;
  panel.appendChild(el);
  panel.scrollTop = panel.scrollHeight;
}

function updateHUD(phase, bfsIters, augPaths, matchSize) {
  document.getElementById("activePhaseTitle").innerText = `Current Phase: ${phase}`;
  document.getElementById("bfsIterationsVal").innerText = bfsIters;
  document.getElementById("augmentingPathsVal").innerText = augPaths;
  document.getElementById("totalMatchingVal").innerText = matchSize;
  document.getElementById("flowInfoBadge").innerText = `Max Matching: ${matchSize}`;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Graph Algorithm Execution ---

async function startAlgorithm() {
  if (nodes.length === 0) return;
  isPlaying = true;
  document.getElementById("startBtn").disabled = true;
  document.getElementById("startBtn").style.display = "none";
  document.getElementById("pauseBtn").style.display = "flex";
  
  // Initialize state
  pairU.clear();
  pairV.clear();
  dist.clear();
  
  nodes.forEach(n => {
    pairU.set(n.id, 0); // 0 means unmatched (NIL)
    pairV.set(n.id, 0);
    dist.set(n.id, Infinity);
  });
  
  edges.forEach(e => e.matched = false);
  drawGraph();

  let matchingSize = 0;
  let bfsIters = 0;
  let augPathsCount = 0;

  addLog("Started Hopcroft-Karp algorithm.", "sys");

  while (await bfs()) {
    bfsIters++;
    addLog(`BFS Iteration ${bfsIters}: Level graph constructed.`, "bfs");
    updateHUD("DFS", bfsIters, augPathsCount, matchingSize);

    // DFS phase
    let uNodes = nodes.filter(n => n.set === 'L');
    for (let u of uNodes) {
      if (pairU.get(u.id) === 0) {
        if (await dfs(u.id)) {
          matchingSize++;
          augPathsCount++;
          addLog(`Found augmenting path starting at ${u.id}. New match size: ${matchingSize}`, "augment");
          updateHUD("DFS", bfsIters, augPathsCount, matchingSize);
        }
      }
    }
    updateHUD("BFS", bfsIters, augPathsCount, matchingSize);
  }

  addLog(`Algorithm finished. Maximum Matching: ${matchingSize}`, "done");
  updateHUD("Complete", bfsIters, augPathsCount, matchingSize);
  
  isPlaying = false;
  document.getElementById("startBtn").style.display = "flex";
  document.getElementById("startBtn").innerText = "Restart";
  document.getElementById("startBtn").disabled = false;
  document.getElementById("pauseBtn").style.display = "none";
}

async function bfs() {
  const queue = [];
  let uNodes = nodes.filter(n => n.set === 'L');
  
  // Clear previous BFS highlights
  document.querySelectorAll(".node-circle").forEach(n => n.classList.remove("bfs-active", "dfs-active"));
  document.querySelectorAll(".node-dist").forEach(n => n.textContent = "");
  document.querySelectorAll(".edge-line").forEach(n => n.classList.remove("bfs-edge", "augmenting-path"));

  updateHUD("BFS", document.getElementById("bfsIterationsVal").innerText, document.getElementById("augmentingPathsVal").innerText, document.getElementById("totalMatchingVal").innerText);

  for (let u of uNodes) {
    if (pairU.get(u.id) === 0) {
      dist.set(u.id, 0);
      queue.push(u.id);
      
      const el = document.getElementById(`node-${u.id}`);
      if (el) el.classList.add("bfs-active");
      
      const distEl = document.getElementById(`dist-${u.id}`);
      if (distEl) distEl.textContent = "d=0";
    } else {
      dist.set(u.id, Infinity);
    }
  }
  
  dist.set(0, Infinity); // NIL node
  
  while (queue.length > 0) {
    let u = queue.shift();
    if (dist.get(u) < dist.get(0)) {
      // Find adjacent v (in set R)
      let adjEdges = edges.filter(e => e.source === u);
      for (let edge of adjEdges) {
        let v = edge.target;
        
        const edgeEl = document.getElementById(`edge-${u}-${v}`);
        if(edgeEl) edgeEl.classList.add("bfs-edge");
        
        await sleep(animSpeed / 4);

        if (dist.get(pairV.get(v)) === Infinity) {
          dist.set(pairV.get(v), dist.get(u) + 1);
          queue.push(pairV.get(v));
          
          if (pairV.get(v) !== 0) {
             const uNext = pairV.get(v);
             const el = document.getElementById(`node-${uNext}`);
             if (el) el.classList.add("bfs-active");
             
             const distEl = document.getElementById(`dist-${uNext}`);
             if (distEl) distEl.textContent = `d=${dist.get(uNext)}`;
             
             // Highlight matched edge traversed backwards
             const matchEdge = document.getElementById(`edge-${uNext}-${v}`);
             if(matchEdge) matchEdge.classList.add("bfs-edge");
          }
        }
      }
    }
  }
  return dist.get(0) !== Infinity;
}

async function dfs(u) {
  if (u !== 0) {
    const nodeEl = document.getElementById(`node-${u}`);
    if(nodeEl) nodeEl.classList.add("dfs-active");
    addLog(`DFS Exploring node ${u}`, "dfs");
    await sleep(animSpeed / 2);

    let adjEdges = edges.filter(e => e.source === u);
    for (let edge of adjEdges) {
      let v = edge.target;
      
      const edgeEl = document.getElementById(`edge-${u}-${v}`);
      if(edgeEl) edgeEl.classList.add("augmenting-path");

      if (dist.get(pairV.get(v)) === dist.get(u) + 1) {
        if (await dfs(pairV.get(v))) {
          pairV.set(v, u);
          pairU.set(u, v);
          
          // Mark edge as matched visually
          edge.matched = true;
          if(edgeEl) {
             edgeEl.classList.add("matched-edge");
             edgeEl.classList.remove("augmenting-path");
          }
          if(nodeEl) nodeEl.classList.add("matched");
          const vEl = document.getElementById(`node-${v}`);
          if (vEl) vEl.classList.add("matched");
          
          return true;
        }
      }
      
      if(edgeEl && !edge.matched) edgeEl.classList.remove("augmenting-path");
    }
    
    dist.set(u, Infinity);
    if(nodeEl) nodeEl.classList.remove("dfs-active");
    return false;
  }
  return true;
}

function pauseAlgorithm() {
  // Real stepping logic is complex with native async. In a real system, we'd use generators.
  // For this visualizer, we implement basic pause functionality.
  addLog("Pause not fully supported in this iteration. Please reset.", "sys");
}

function resetAlgorithm() {
  isPlaying = false;
  document.getElementById("startBtn").style.display = "flex";
  document.getElementById("startBtn").innerText = "Run Algorithm";
  document.getElementById("startBtn").disabled = false;
  document.getElementById("pauseBtn").style.display = "none";
  
  pairU.clear();
  pairV.clear();
  edges.forEach(e => e.matched = false);
  
  updateHUD("Ready", 0, 0, 0);
  document.getElementById("logPanel").innerHTML = "";
  addLog("Algorithm reset.", "sys");
  drawGraph();
}

// --- Presets ---
function loadPreset(type) {
  nodes = [];
  edges = [];
  nextNodeId = 1;
  
  const w = visualizerSvg.clientWidth;
  const h = visualizerSvg.clientHeight;
  const L_X = w * 0.25;
  const R_X = w * 0.75;
  
  if (type === "empty") {
    drawGraph();
    return;
  }

  if (type === "perfect") {
    for(let i=0; i<4; i++) { addNode(L_X, 100 + i*80, "L"); }
    for(let i=0; i<4; i++) { addNode(R_X, 100 + i*80, "R"); }
    edges.push({source: 1, target: 5, matched: false});
    edges.push({source: 1, target: 6, matched: false});
    edges.push({source: 2, target: 5, matched: false});
    edges.push({source: 2, target: 8, matched: false});
    edges.push({source: 3, target: 6, matched: false});
    edges.push({source: 3, target: 7, matched: false});
    edges.push({source: 4, target: 8, matched: false});
  } else if (type === "disjoint") {
    for(let i=0; i<3; i++) { addNode(L_X, 100 + i*100, "L"); }
    for(let i=0; i<3; i++) { addNode(R_X, 100 + i*100, "R"); }
    edges.push({source: 1, target: 4, matched: false});
    edges.push({source: 2, target: 5, matched: false});
    edges.push({source: 3, target: 6, matched: false});
  } else if (type === "random") {
    const numNodes = 4 + Math.floor(Math.random() * 3);
    for(let i=0; i<numNodes; i++) { addNode(L_X, 80 + i*70, "L"); }
    for(let i=0; i<numNodes; i++) { addNode(R_X, 80 + i*70, "R"); }
    
    for (let u = 1; u <= numNodes; u++) {
      const numEdges = 1 + Math.floor(Math.random() * 3);
      for (let e = 0; e < numEdges; e++) {
        const v = numNodes + 1 + Math.floor(Math.random() * numNodes);
        if (!edges.find(edge => edge.source === u && edge.target === v)) {
          edges.push({source: u, target: v, matched: false});
        }
      }
    }
  }
  
  drawGraph();
  addLog(`Loaded preset: ${type}`, "sys");
}
