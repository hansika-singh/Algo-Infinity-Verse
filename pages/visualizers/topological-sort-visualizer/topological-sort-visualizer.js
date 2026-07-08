// ===== GLOBAL STATE =====
let nodes = []; // { id: 'A', x: 250, y: 150, state: 0 } (DFS states: 0=Unvisited, 1=Visiting, 2=Visited)
let edges = []; // { id: 'A-B', source: 'A', target: 'B', active: false, visited: false, isCycle: false }
let nextLabelCode = 65; // ASCII 'A'

let selectedMode = "node"; // "node", "edge", "delete", "run"
let selectedAlgo = "kahns"; // "kahns", "dfs"

// Animation state
let steps = [];
let currentStepIdx = -1;
let isPlaying = false;
let playTimeout = null;
let speed = 700; // ms

// Audio state
let audioCtx = null;
let isSoundEnabled = true;

// DOM Elements
// =========================
// Required Elements Loader
// =========================
function loadRequiredElements() {
  const idMap = {
    svg: "visualizerSvg",
    edgeGroup: "svgEdges",
    nodeGroup: "svgNodes",
    placeholder: "canvasPlaceholder",
    presetSelect: "presetSelect",
    algoSelect: "algoSelect",
    speedRange: "speedRange",
    speedDisplay: "speedDisplay",
    soundToggle: "soundToggle",
    startBtn: "startBtn",
    pauseBtn: "pauseBtn",
    stepBackBtn: "stepBackBtn",
    stepForwardBtn: "stepForwardBtn",
    resetBtn: "resetBtn",
    canvasModeBadge: "canvasModeBadge",
    validationBadge: "validationBadge",
    validationAlert: "validationAlert",
    alertTitle: "alertTitle",
    alertDescription: "alertDescription",
    activeStructureWrapper: "activeStructureWrapper",
    structureTitle: "structureTitle",
    auxiliaryTitle: "auxiliaryTitle",
    auxiliaryStructureWrapper: "auxiliaryStructureWrapper",
    topologicalTape: "topologicalTape",
    logPanel: "logPanel",
    clearLogsBtn: "clearLogsBtn"
  };

  const elements = {};
  const missing = [];

  for (const [key, id] of Object.entries(idMap)) {
    const el = document.getElementById(id);
    if (!el) missing.push(id);
    elements[key] = el;
  }

  // mode buttons use querySelectorAll
  elements.modeBtns = document.querySelectorAll('.mode-btn');

  if (missing.length) {
    // Hard-fail gracefully with a visible message instead of throwing later.
    // (We still return partial elements to avoid breaking parsing entirely.)
    console.error("Topological Sort Visualizer missing required DOM elements:", missing);
    // If we can, show in validation alert area.
    const validationAlertEl = document.getElementById("validationAlert");
    const alertTitleEl = document.getElementById("alertTitle");
    const alertDescriptionEl = document.getElementById("alertDescription");
    if (validationAlertEl && alertTitleEl && alertDescriptionEl) {
      validationAlertEl.className = "validation-alert-card cycle-detected";
      alertTitleEl.textContent = "Visualizer UI not loaded";
      alertDescriptionEl.textContent = `Missing UI elements: ${missing.join(", ")}. Please open the correct Topological Sort Visualizer page.`;
      validationAlertEl.style.display = "flex";
    }
  }

  return elements;
}


const {
  svg,
  edgeGroup,
  nodeGroup,
  placeholder,
  modeBtns,
  presetSelect,
  algoSelect,
  speedRange,
  speedDisplay,
  soundToggle,
  startBtn,
  pauseBtn,
  stepBackBtn,
  stepForwardBtn,
  resetBtn,
  canvasModeBadge,
  validationBadge,
  validationAlert,
  alertTitle,
  alertDescription,
  activeStructureWrapper,
  structureTitle,
  auxiliaryTitle,
  auxiliaryStructureWrapper,
  topologicalTape,
  logPanel,
  clearLogsBtn
} = loadRequiredElements();

// Interaction Temp Variables
let edgeSourceNode = null;
let draggedNode = null;
let dragOffset = { x: 0, y: 0 };

// ===== AUDIO CONTEXT HELPER =====
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type) {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'push') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'traverse') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'cycle') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.4);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'success') {
      // Arpeggio C5 -> E5 -> G5 -> C6
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      osc.frequency.setValueAtTime(1046.50, now + 0.24);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.setValueAtTime(0.08, now + 0.08);
      gain.gain.setValueAtTime(0.08, now + 0.16);
      gain.gain.setValueAtTime(0.08, now + 0.24);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch (e) {
    void 0;
  }
}

// ===== GRAPH GRAPHICS DRAWING =====
function renderGraph() {
  if (!svg || !edgeGroup || !nodeGroup || !placeholder) return;

  if (nodes.length === 0) {
    placeholder.style.display = "block";
  } else {
    placeholder.style.display = "none";
  }


  // Clear layers
  edgeGroup.innerHTML = "";
  nodeGroup.innerHTML = "";

  // Draw Edges
  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "svg-edge-group");

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    
    // Intersection mathematics
    const radius = 18;
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let x1 = sourceNode.x;
    let y1 = sourceNode.y;
    let x2 = targetNode.x;
    let y2 = targetNode.y;

    if (dist > radius * 2) {
      x1 = sourceNode.x + (dx / dist) * radius;
      y1 = sourceNode.y + (dy / dist) * radius;
      x2 = targetNode.x - (dx / dist) * (radius + 6); // pad for arrowhead tip
      y2 = targetNode.y - (dy / dist) * (radius + 6);
    }

    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);

    let classes = "edge-line";
    if (edge.isCycle) classes += " cycle";
    else if (edge.active) classes += " active";
    else if (edge.visited) classes += " visited";
    line.setAttribute("class", classes);
    line.setAttribute("marker-end", edge.isCycle ? "url(#arrowhead-cycle)" : edge.active ? "url(#arrowhead-active)" : edge.visited ? "url(#arrowhead-visited)" : "url(#arrowhead)");

    // Delete edge listener
    line.addEventListener("click", (e) => {
      e.stopPropagation();
      if (selectedMode === "delete" && !isPlaying && currentStepIdx === -1) {
        edges = edges.filter((ed) => ed.id !== edge.id);
        renderGraph();
        addLogEntry(`Removed directed edge ${edge.source} &rarr; ${edge.target}.`, "sys");
      }
    });

    g.appendChild(line);
    edgeGroup.appendChild(g);
  });

  // Draw Nodes
  nodes.forEach((node) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "svg-node-group");
    g.setAttribute("transform", `translate(${node.x}, ${node.y})`);

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", 18);
    circle.setAttribute("id", `node-${node.id}`);
    
    let classes = "node-circle";
    if (node.isCycle) classes += " cycle-error";
    else if (node.active) classes += " active";
    else if (node.state === 1) classes += " visiting"; // Visiting DFS
    else if (node.state === 2) classes += " visited"; // Visited DFS
    circle.setAttribute("class", classes);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("class", "node-text");
    text.textContent = node.id;

    // Draggable listeners
    circle.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      if (selectedMode === "node" && !isPlaying && currentStepIdx === -1) {
        draggedNode = node;
        const rect = svg.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left - node.x;
        dragOffset.y = e.clientY - rect.top - node.y;
      }
    });

    // Click triggers
    circle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isPlaying || currentStepIdx !== -1) return;

      if (selectedMode === "delete") {
        nodes = nodes.filter((n) => n.id !== node.id);
        edges = edges.filter((ed) => ed.source !== node.id && ed.target !== node.id);
        renderGraph();
        addLogEntry(`Removed Node ${node.id}.`, "sys");
      } else if (selectedMode === "edge") {
        if (!edgeSourceNode) {
          edgeSourceNode = node;
          circle.classList.add("active");
          addLogEntry(`Selected source Node ${node.id}. Click target node.`, "sys");
        } else {
          if (edgeSourceNode.id === node.id) {
            // reset
            circle.classList.remove("active");
            edgeSourceNode = null;
            return;
          }

          const edgeId = `${edgeSourceNode.id}-${node.id}`;
          const exists = edges.some((ed) => ed.id === edgeId);
          if (!exists) {
            edges.push({
              id: edgeId,
              source: edgeSourceNode.id,
              target: node.id,
              active: false,
              visited: false,
              isCycle: false
            });
            addLogEntry(`Created edge ${edgeSourceNode.id} &rarr; ${node.id}.`, "sys");
          }

          // Unhighlight source
          const srcEl = document.getElementById(`node-${edgeSourceNode.id}`);
          if (srcEl) srcEl.classList.remove("active");
          edgeSourceNode = null;
          renderGraph();
        }
      }
    });

    g.appendChild(circle);
    g.appendChild(text);

    // If Kahn's is active AND we are in simulation, we can optionally render the indegrees above the node
    if (selectedAlgo === "kahns" && currentStepIdx !== -1) {
      const step = steps[currentStepIdx];
      if (step && step.indegrees) {
        const val = step.indegrees[node.id] !== undefined ? step.indegrees[node.id] : 0;
        const indegreeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        indegreeText.setAttribute("class", "node-indegree-text");
        indegreeText.setAttribute("y", -24);
        indegreeText.textContent = `in: ${val}`;
        g.appendChild(indegreeText);
      }
    }

    nodeGroup.appendChild(g);
  });
}

// Canvas Adding Node Click
svg.addEventListener("mousedown", (e) => {
  if (selectedMode !== "node" || isPlaying || currentStepIdx !== -1) return;
  if (e.target !== svg && e.target.id !== "canvasBg") return;

  const rect = svg.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (nextLabelCode > 90) {
    void 0;
    return;
  }

  const label = String.fromCharCode(nextLabelCode);
  nextLabelCode++;

  nodes.push({ id: label, x, y, state: 0 });
  renderGraph();
  addLogEntry(`Placed Node ${label}.`, "sys");
  playSound('step');
});

// Drag motion listeners
svg.addEventListener("mousemove", (e) => {
  if (!draggedNode) return;
  const rect = svg.getBoundingClientRect();
  let x = e.clientX - rect.left - dragOffset.x;
  let y = e.clientY - rect.top - dragOffset.y;

  // boundaries
  x = Math.max(20, Math.min(rect.width - 20, x));
  y = Math.max(20, Math.min(rect.height - 20, y));

  draggedNode.x = x;
  draggedNode.y = y;
  renderGraph();
});

window.addEventListener("mouseup", () => {
  draggedNode = null;
});

// ===== PRESETS LOADER =====
const presets = {
  diamond: {
    nodes: [
      { id: "A", x: 100, y: 225, state: 0 },
      { id: "B", x: 250, y: 125, state: 0 },
      { id: "C", x: 250, y: 325, state: 0 },
      { id: "D", x: 400, y: 225, state: 0 }
    ],
    edges: [
      { id: "A-B", source: "A", target: "B", active: false, visited: false },
      { id: "A-C", source: "A", target: "C", active: false, visited: false },
      { id: "B-D", source: "B", target: "D", active: false, visited: false },
      { id: "C-D", source: "C", target: "D", active: false, visited: false }
    ],
    nextCode: 69 // 'E'
  },
  linear: {
    nodes: [
      { id: "A", x: 100, y: 225, state: 0 },
      { id: "B", x: 220, y: 225, state: 0 },
      { id: "C", x: 340, y: 225, state: 0 },
      { id: "D", x: 460, y: 225, state: 0 }
    ],
    edges: [
      { id: "A-B", source: "A", target: "B", active: false, visited: false },
      { id: "B-C", source: "B", target: "C", active: false, visited: false },
      { id: "C-D", source: "C", target: "D", active: false, visited: false }
    ],
    nextCode: 69
  },
  cyclic: {
    nodes: [
      { id: "A", x: 150, y: 150, state: 0 },
      { id: "B", x: 350, y: 150, state: 0 },
      { id: "C", x: 250, y: 300, state: 0 }
    ],
    edges: [
      { id: "A-B", source: "A", target: "B", active: false, visited: false },
      { id: "B-C", source: "B", target: "C", active: false, visited: false },
      { id: "C-A", source: "C", target: "A", active: false, visited: false }
    ],
    nextCode: 68 // 'D'
  },
  disconnected: {
    nodes: [
      { id: "A", x: 100, y: 140, state: 0 },
      { id: "B", x: 250, y: 140, state: 0 },
      { id: "C", x: 100, y: 310, state: 0 },
      { id: "D", x: 250, y: 310, state: 0 }
    ],
    edges: [
      { id: "A-B", source: "A", target: "B", active: false, visited: false },
      { id: "C-D", source: "C", target: "D", active: false, visited: false }
    ],
    nextCode: 69
  },
  tree: {
    nodes: [
      { id: "A", x: 250, y: 80, state: 0 },
      { id: "B", x: 150, y: 200, state: 0 },
      { id: "C", x: 350, y: 200, state: 0 },
      { id: "D", x: 80, y: 320, state: 0 },
      { id: "E", x: 220, y: 320, state: 0 }
    ],
    edges: [
      { id: "A-B", source: "A", target: "B", active: false, visited: false },
      { id: "A-C", source: "A", target: "C", active: false, visited: false },
      { id: "B-D", source: "B", target: "D", active: false, visited: false },
      { id: "B-E", source: "B", target: "E", active: false, visited: false }
    ],
    nextCode: 70 // 'F'
  }
};

function loadPreset(key) {
  if (isPlaying) pauseSimulation();
  
  if (key === "empty") {
    nodes = [];
    edges = [];
    nextLabelCode = 65;
    addLogEntry("Canvas cleared.", "sys");
  } else if (presets[key]) {
    const data = presets[key];
    nodes = data.nodes.map((n) => ({ ...n }));
    edges = data.edges.map((e) => ({ ...e, isCycle: false, active: false, visited: false }));
    nextLabelCode = data.nextCode;
    addLogEntry(`Loaded preset: ${key.toUpperCase()}.`, "sys");
  }
  
  resetVisualizerState();
  renderGraph();
}

// ===== ALGORITHMS STEP GENERATORS =====

// Helper to get adjacency lists
function getOutgoingNeighbors(nodeId) {
  const result = [];
  edges.forEach((edge) => {
    if (edge.source === nodeId) result.push(edge.target);
  });
  return result.sort(); // alphabet sort for predictability
}

// Helper to calculate incoming indegrees mapping
function computeIndegreesMap() {
  const map = {};
  nodes.forEach((n) => map[n.id] = 0);
  edges.forEach((e) => {
    if (map[e.target] !== undefined) map[e.target]++;
  });
  return map;
}

// 1. Kahn's BFS Algorithm Step Generator
function generateKahnsSteps() {
  steps = [];
  const inMap = computeIndegreesMap();
  const topoOrder = [];
  const queue = [];

  // Log Initial indegrees
  steps.push({
    type: "INITIAL_INDEGREES",
    indegrees: { ...inMap },
    queue: [],
    topoOrder: [],
    log: "Computed initial indegrees for all nodes.",
    logType: "sys"
  });

  // Find indegree zero nodes
  const zeroNodes = Object.keys(inMap).filter((id) => inMap[id] === 0).sort();
  
  steps.push({
    type: "FIND_INDEGREE_ZERO",
    indegrees: { ...inMap },
    queue: [],
    topoOrder: [],
    log: `Identified nodes with indegree = 0: [${zeroNodes.join(", ")}]`,
    logType: "sys"
  });

  // Enqueue zero nodes
  zeroNodes.forEach((id) => {
    queue.push(id);
    steps.push({
      type: "ENQUEUE",
      activeNode: id,
      indegrees: { ...inMap },
      queue: [...queue],
      topoOrder: [...topoOrder],
      log: `Enqueued Node ${id} (indegree is 0).`,
      logType: "discover"
    });
  });

  // BFS search
  let evaluatedCount = 0;
  while (queue.length > 0) {
    const curr = queue.shift();
    topoOrder.push(curr);
    evaluatedCount++;

    steps.push({
      type: "DEQUEUE_VISIT",
      activeNode: curr,
      indegrees: { ...inMap },
      queue: [...queue],
      topoOrder: [...topoOrder],
      log: `Dequeued and visited Node ${curr}. Added to Topological order.`,
      logType: "visit"
    });

    const neighbors = getOutgoingNeighbors(curr);
    for (let neighbor of neighbors) {
      // Traverse edge step
      steps.push({
        type: "TRAVERSE_EDGE",
        activeNode: curr,
        targetNode: neighbor,
        edgeId: `${curr}-${neighbor}`,
        indegrees: { ...inMap },
        queue: [...queue],
        topoOrder: [...topoOrder],
        log: `Checking outgoing dependency edge: ${curr} &rarr; ${neighbor}.`,
        logType: "traverse"
      });

      // Decrement indegree
      inMap[neighbor]--;
      steps.push({
        type: "DECREMENT_INDEGREE",
        activeNode: neighbor,
        changedNode: neighbor,
        indegrees: { ...inMap },
        queue: [...queue],
        topoOrder: [...topoOrder],
        log: `Decremented indegree of Node ${neighbor} to ${inMap[neighbor]}.`,
        logType: "sys"
      });

      if (inMap[neighbor] === 0) {
        queue.push(neighbor);
        steps.push({
          type: "ENQUEUE",
          activeNode: neighbor,
          indegrees: { ...inMap },
          queue: [...queue],
          topoOrder: [...topoOrder],
          log: `Node ${neighbor} indegree became 0. Enqueued.`,
          logType: "discover"
        });
      }
    }
  }

  // Validation check
  if (evaluatedCount === nodes.length) {
    steps.push({
      type: "FINISHED_SUCCESS",
      indegrees: { ...inMap },
      queue: [],
      topoOrder: [...topoOrder],
      log: `Topological sorting completed successfully. Graph is a valid DAG.`,
      logType: "visit"
    });
  } else {
    // Cycle Detected! Collect nodes that couldn't be resolved (indegree > 0)
    const cyclicNodes = Object.keys(inMap).filter((id) => inMap[id] > 0);
    const cyclicEdges = edges.filter((e) => cyclicNodes.includes(e.source) && cyclicNodes.includes(e.target)).map(e => e.id);

    steps.push({
      type: "FINISHED_CYCLE",
      indegrees: { ...inMap },
      queue: [],
      topoOrder: [...topoOrder],
      cyclicNodes: cyclicNodes,
      cyclicEdges: cyclicEdges,
      log: `Cycle Detected! Nodes [${cyclicNodes.join(", ")}] have remaining dependency loops. Sorting failed.`,
      logType: "error"
    });
  }
}

// 2. DFS Topological Sort Step Generator
function generateDfsSteps() {
  steps = [];
  const nodeStates = {}; // 0 = Unvisited, 1 = Visiting (in recursion stack), 2 = Visited (finished)
  nodes.forEach((n) => nodeStates[n.id] = 0);

  const callStack = [];
  const outputStack = []; // topological stack (nodes pushed here when leaving)
  let cycleFound = false;

  steps.push({
    type: "INIT_DFS",
    states: { ...nodeStates },
    callStack: [],
    topoOrder: [],
    log: "Initialized DFS traversal states for all nodes to UNVISITED.",
    logType: "sys"
  });

  function dfsVisit(u) {
    if (cycleFound) return;

    nodeStates[u] = 1; // Mark VISITING
    callStack.push(u);

    steps.push({
      type: "ENTER_NODE",
      activeNode: u,
      states: { ...nodeStates },
      callStack: [...callStack],
      topoOrder: buildDfsOrder(outputStack),
      log: `Entered Node ${u}. Marked state as VISITING. Pushed to call stack.`,
      logType: "discover"
    });

    const neighbors = getOutgoingNeighbors(u);
    for (let neighbor of neighbors) {
      if (cycleFound) return;

      // Traverse edge check
      steps.push({
        type: "TRAVERSE_EDGE",
        activeNode: u,
        targetNode: neighbor,
        edgeId: `${u}-${neighbor}`,
        states: { ...nodeStates },
        callStack: [...callStack],
        topoOrder: buildDfsOrder(outputStack),
        log: `DFS traversing edge: ${u} &rarr; ${neighbor}.`,
        logType: "traverse"
      });

      if (nodeStates[neighbor] === 1) {
        // Back edge found (Neighbor is currently in recursion Call Stack). Cycle!
        cycleFound = true;
        
        // Find cycle path in the callStack
        const cycleStartIdx = callStack.indexOf(neighbor);
        const cycleNodes = callStack.slice(cycleStartIdx);
        
        // Find edges inside the cycle
        const cycleEdges = [];
        for (let i = 0; i < cycleNodes.length; i++) {
          const nextNode = cycleNodes[(i + 1) % cycleNodes.length];
          cycleEdges.push(`${cycleNodes[i]}-${nextNode}`);
        }

        steps.push({
          type: "CYCLE_DETECTED",
          activeNode: u,
          states: { ...nodeStates },
          callStack: [...callStack],
          topoOrder: buildDfsOrder(outputStack),
          cyclicNodes: cycleNodes,
          cyclicEdges: cycleEdges,
          log: `Cycle Detected! Encountered back-edge pointing to node '${neighbor}' (which is in VISITING state).`,
          logType: "error"
        });
        return;
      }

      if (nodeStates[neighbor] === 0) {
        dfsVisit(neighbor);
      }
    }

    if (cycleFound) return;

    // Leaving node u
    nodeStates[u] = 2; // Mark VISITED
    callStack.pop();
    outputStack.push(u); // Add to topological stack

    steps.push({
      type: "LEAVE_NODE",
      activeNode: u,
      states: { ...nodeStates },
      callStack: [...callStack],
      topoOrder: buildDfsOrder(outputStack),
      log: `Finished visiting Node ${u}. Marked as VISITED. Popped from call stack.`,
      logType: "visit"
    });

    steps.push({
      type: "PUSH_OUTPUT",
      activeNode: u,
      states: { ...nodeStates },
      callStack: [...callStack],
      topoOrder: buildDfsOrder(outputStack),
      log: `Pushed Node ${u} onto output Topological stack.`,
      logType: "sys"
    });
  }

  // Sort nodes alphabetically to run DFS deterministically
  const sortedNodeIds = nodes.map(n => n.id).sort();
  for (let id of sortedNodeIds) {
    if (cycleFound) break;
    if (nodeStates[id] === 0) {
      dfsVisit(id);
    }
  }

  if (!cycleFound) {
    steps.push({
      type: "FINISHED_SUCCESS",
      states: { ...nodeStates },
      callStack: [],
      topoOrder: buildDfsOrder(outputStack),
      log: `DFS-based Topological sorting completed. Reversing stack outputs for the linear order.`,
      logType: "visit"
    });
  } else {
    // DFS finished due to cycle detection
    steps.push({
      type: "FINISHED_CYCLE",
      states: { ...nodeStates },
      callStack: [],
      topoOrder: [],
      log: `Topological sorting halted. Cyclic dependencies found in DFS recursion stack.`,
      logType: "error"
    });
  }
}

// DFS reverse output helper
function buildDfsOrder(stack) {
  return [...stack].reverse(); // reverse of DFS finishes is topological order
}

// ===== RENDER STEP LOGIC =====
function renderStep(idx) {
  if (idx < 0 || idx >= steps.length) return;
  const step = steps[idx];
  
  // 1. Log update
  addLogEntry(step.log, step.logType);

  // 2. Sync node visual states
  nodes.forEach((n) => {
    // Clear styles
    n.active = false;
    n.state = 0;
    n.isCycle = false;

    // Apply states
    if (selectedAlgo === "kahns") {
      if (step.activeNode === n.id) {
        n.active = true;
      }
      // If finished cycle, color loop nodes
      if (step.cyclicNodes && step.cyclicNodes.includes(n.id)) {
        n.isCycle = true;
      }
    } else {
      // DFS
      if (step.states) {
        n.state = step.states[n.id]; // VISITING or VISITED
      }
      if (step.activeNode === n.id && step.type !== "LEAVE_NODE") {
        n.active = true;
      }
      if (step.cyclicNodes && step.cyclicNodes.includes(n.id)) {
        n.isCycle = true;
      }
    }
  });

  // 3. Sync edge active/visited lines
  edges.forEach((e) => {
    e.active = false;
    e.visited = false;
    e.isCycle = false;

    if (step.edgeId === e.id) {
      e.active = true;
    }
    
    // DFS Visiting edge highlighting
    if (selectedAlgo === "dfs" && step.callStack) {
      const uIdx = step.callStack.indexOf(e.source);
      const vIdx = step.callStack.indexOf(e.target);
      // If edge connects consecutive nodes in call stack
      if (uIdx !== -1 && vIdx !== -1 && Math.abs(uIdx - vIdx) === 1) {
        e.visited = true;
      }
    }

    // Cycle edges highlighting
    if (step.cyclicEdges && step.cyclicEdges.includes(e.id)) {
      e.isCycle = true;
    }
  });

  renderGraph();

  // 4. Update HUD Validation Badges and Alert Banners
  if (step.type === "FINISHED_SUCCESS") {
    validationBadge.textContent = "DAG Status: Valid (DAG)";
    validationBadge.className = "hud-badge success-badge";
    
    validationAlert.className = "validation-alert-card valid-dag";
    alertTitle.textContent = "Valid Acyclic Graph (DAG)";
    alertDescription.textContent = `Topological order found: [${step.topoOrder.join(" → ")}]. The graph contains zero cyclic loops.`;
  } else if (step.type === "FINISHED_CYCLE" || step.type === "CYCLE_DETECTED") {
    validationBadge.textContent = "DAG Status: Cycle Detected!";
    validationBadge.className = "hud-badge error-badge";
    
    validationAlert.className = "validation-alert-card cycle-detected";
    alertTitle.textContent = "Topological Sort Impossible";
    alertDescription.textContent = `A dependency loop/cycle was found. Topological ordering requires a Directed Acyclic Graph (DAG).`;
  } else {
    validationBadge.textContent = "DAG Status: Evaluating...";
    validationBadge.className = "hud-badge mode-badge";
    validationAlert.className = "validation-alert-card hidden";
  }

  // 5. Update Queue / Call Stack Structure View
  activeStructureWrapper.innerHTML = "";
  const list = selectedAlgo === "kahns" ? step.queue : step.callStack;
  
  if (!list || list.length === 0) {
    activeStructureWrapper.innerHTML = `<div class="structure-empty-msg">[Empty]</div>`;
  } else {
    list.forEach((id, idx) => {
      const box = document.createElement("div");
      box.className = `structure-box ${selectedAlgo === 'dfs' ? 'visiting' : 'active'}`;
      box.textContent = id;
      activeStructureWrapper.appendChild(box);

      if (idx < list.length - 1) {
        const arrow = document.createElement("div");
        arrow.className = "structure-arrow";
        arrow.innerHTML = `<i class="fas fa-chevron-right"></i>`;
        activeStructureWrapper.appendChild(arrow);
      }
    });
  }

  // 6. Update Auxiliary Card (Indegrees vs DFS Output Stack)
  auxiliaryStructureWrapper.innerHTML = "";
  if (selectedAlgo === "kahns") {
    auxiliaryTitle.textContent = "Vertex Indegrees";
    const container = document.createElement("div");
    container.className = "indegree-flex-container";

    if (step.indegrees) {
      Object.keys(step.indegrees).sort().forEach((id) => {
        const badge = document.createElement("div");
        badge.className = `indegree-badge ${step.indegrees[id] === 0 ? 'zero' : ''}`;
        
        // Highlight active decrement
        if (step.type === "DECREMENT_INDEGREE" && step.changedNode === id) {
          badge.classList.add("active-change");
        }

        badge.textContent = `${id}: ${step.indegrees[id]}`;
        container.appendChild(badge);
      });
    }
    auxiliaryStructureWrapper.appendChild(container);
  } else {
    // DFS stack view
    auxiliaryTitle.textContent = "DFS topological Stack (Reverse)";
    const container = document.createElement("div");
    container.className = "indegree-flex-container";

    // Trace visited items in reverse order
    if (step.topoOrder && step.topoOrder.length > 0) {
      // In DFS step.topoOrder contains reversed output stack, so stack itself is reversed
      const stackRepresentation = [...step.topoOrder].reverse();
      stackRepresentation.forEach((id) => {
        const box = document.createElement("div");
        box.className = "structure-box visited";
        box.style.marginRight = "0.4rem";
        box.textContent = id;
        container.appendChild(box);
      });
    } else {
      container.innerHTML = `<div class="structure-empty-msg">[Empty]</div>`;
    }
    auxiliaryStructureWrapper.appendChild(container);
  }

  // 7. Update Topological Output Tape
  topologicalTape.innerHTML = "";
  if (!step.topoOrder || step.topoOrder.length === 0) {
    topologicalTape.innerHTML = `<div class="tape-placeholder">Awaiting sorting execution...</div>`;
  } else {
    step.topoOrder.forEach((id, idx) => {
      const badge = document.createElement("div");
      badge.className = "tape-badge";
      badge.textContent = id;
      topologicalTape.appendChild(badge);

      if (idx < step.topoOrder.length - 1) {
        const arrow = document.createElement("div");
        arrow.className = "structure-arrow";
        arrow.style.fontSize = "0.85rem";
        arrow.innerHTML = `<i class="fas fa-chevron-right" style="color: var(--match-green)"></i>`;
        topologicalTape.appendChild(arrow);
      }
    });
  }

  // 8. Disable/Enable control buttons on extremes
  stepBackBtn.disabled = idx <= 0;
  stepForwardBtn.disabled = idx >= steps.length - 1;
}

// ===== PLAYBACK CYCLE ENGINE =====
function playNextStep() {
  if (currentStepIdx < steps.length - 1) {
    currentStepIdx++;
    renderStep(currentStepIdx);

    // Audio beep based on step type
    const step = steps[currentStepIdx];
    if (step.type === "ENQUEUE" || step.type === "ENTER_NODE") {
      playSound('push');
    } else if (step.type === "DEQUEUE_VISIT" || step.type === "LEAVE_NODE" || step.type === "PUSH_OUTPUT") {
      playSound('pop');
    } else if (step.type === "TRAVERSE_EDGE") {
      playSound('traverse');
    } else if (step.type === "CYCLE_DETECTED" || step.type === "FINISHED_CYCLE") {
      playSound('cycle');
    } else if (step.type === "FINISHED_SUCCESS") {
      playSound('success');
    } else {
      playSound('step');
    }

    playTimeout = setTimeout(playNextStep, speed);
  } else {
    pauseSimulation();
  }
}

function runSimulation() {
  getAudioContext();
  
  if (steps.length === 0) {
    initializeSimulation();
  }

  if (currentStepIdx >= steps.length - 1) {
    currentStepIdx = -1;
  }

  isPlaying = true;
  startBtn.style.display = "none";
  pauseBtn.style.display = "inline-block";
  stepBackBtn.disabled = true;
  stepForwardBtn.disabled = true;
  presetSelect.disabled = true;
  algoSelect.disabled = true;

  playNextStep();
}

function pauseSimulation() {
  isPlaying = false;
  clearTimeout(playTimeout);

  startBtn.style.display = "inline-block";
  pauseBtn.style.display = "none";
  stepBackBtn.disabled = currentStepIdx <= 0;
  stepForwardBtn.disabled = currentStepIdx >= steps.length - 1;
}

function stepForward() {
  getAudioContext();
  if (steps.length === 0) {
    initializeSimulation();
  }

  if (currentStepIdx < steps.length - 1) {
    currentStepIdx++;
    renderStep(currentStepIdx);
    playSound('step');
  }
}

function stepBackward() {
  getAudioContext();
  if (currentStepIdx > 0) {
    currentStepIdx--;
    renderStep(currentStepIdx);
    playSound('step');
  }
}

function resetVisualizerState() {
  isPlaying = false;
  clearTimeout(playTimeout);
  currentStepIdx = -1;
  steps = [];

  // Reset node/edge graphics
  nodes.forEach((n) => {
    n.active = false;
    n.state = 0;
    n.isCycle = false;
  });
  edges.forEach((e) => {
    e.active = false;
    e.visited = false;
    e.isCycle = false;
  });

  // UI Resets
  startBtn.style.display = "inline-block";
  if (pauseBtn) pauseBtn.style.display = "none";
  stepBackBtn.disabled = true;
  stepForwardBtn.disabled = false;
  presetSelect.disabled = false;
  algoSelect.disabled = false;

  validationBadge.textContent = "DAG Status: Valid";
  validationBadge.className = "hud-badge success-badge";
  validationAlert.className = "validation-alert-card hidden";

  activeStructureWrapper.innerHTML = `<div class="structure-empty-msg">[Empty]</div>`;
  auxiliaryStructureWrapper.innerHTML = `<div class="structure-empty-msg">[Empty]</div>`;
  topologicalTape.innerHTML = `<div class="tape-placeholder">Awaiting sorting execution...</div>`;

  addLogEntry("Simulation reset.", "sys");
}

function initializeSimulation() {
  if (nodes.length === 0) {
    void 0;
    resetVisualizerState();
    return;
  }

  // Pre-calculate steps list
  if (selectedAlgo === "kahns") {
    generateKahnsSteps();
  } else {
    generateDfsSteps();
  }

  currentStepIdx = 0;
  renderStep(0);
}

// ===== CONSOLE LOG DETAILS =====
function addLogEntry(text, type = "sys") {
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `&gt; [${type.toUpperCase()}] ${text}`;
  if (logPanel) {
    logPanel.appendChild(entry);
    
    // Auto-scroll logs
    logPanel.scrollTop = logPanel.scrollHeight;
  }

}

// ===== EVENT LISTENERS =====
function initEvents() {
  // Mode Select Buttons
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedMode = btn.getAttribute("data-mode");
      canvasModeBadge.textContent = `Mode: ${btn.textContent.trim()}`;
      
      // Clear selections
      if (edgeSourceNode) {
        const el = document.getElementById(`node-${edgeSourceNode.id}`);
        if (el) el.classList.remove("active");
        edgeSourceNode = null;
      }
      
      if (selectedMode === "run") {
        initializeSimulation();
        stepForwardBtn.disabled = false;
      } else {
        resetVisualizerState();
        renderGraph();
      }
    });
  });

  // Preset Select change
  presetSelect.addEventListener("change", (e) => {
    loadPreset(e.target.value);
  });

  // Algorithm Select change
  algoSelect.addEventListener("change", (e) => {
    selectedAlgo = e.target.value;
    addLogEntry(`Switched algorithm to ${selectedAlgo === "kahns" ? "Kahn's BFS" : "DFS Stack"}.`, "sys");
    resetVisualizerState();
    renderGraph();
  });

  // Control Buttons
  startBtn.addEventListener("click", runSimulation);
  pauseBtn.addEventListener("click", pauseSimulation);
  stepForwardBtn.addEventListener("click", stepForward);
  stepBackBtn.addEventListener("click", stepBackward);
  resetBtn.addEventListener("click", resetVisualizerState);

  // Speed Slider
  speedRange.addEventListener("input", (e) => {
    speed = parseInt(e.target.value, 10);
    speedDisplay.textContent = `${speed}ms`;
  });

  // Sound Toggle
  if (soundToggle) {
    isSoundEnabled = soundToggle.checked;
    soundToggle.addEventListener("change", (e) => {
      isSoundEnabled = e.target.checked;
      if (isSoundEnabled) getAudioContext();
    });
  }

  // Clear Logs
  clearLogsBtn.addEventListener("click", () => {
    logPanel.innerHTML = '<div class="log-entry sys">Logs cleared.</div>';
  });
}

// Hero typing subtitle
function initHeroTyping() {
  const el = document.getElementById("typingTextGraph");
  if (!el) return;

  const words = [
    "DAG Cycle Validation",
    "Kahn's BFS Indegree Tracing",
    "DFS Post-Order Recursion Stack",
    "Dependency Resolving"
  ];

  let wordIdx = 0;
  let charIdx = 0;
  let isDeleting = false;

  function tick() {
    const current = words[wordIdx];

    if (isDeleting) {
      el.textContent = current.substring(0, charIdx - 1);
      charIdx--;
    } else {
      el.textContent = current.substring(0, charIdx + 1);
      charIdx++;
    }

    let speedVal = isDeleting ? 50 : 100;

    if (!isDeleting && charIdx === current.length) {
      speedVal = 1800;
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      wordIdx = (wordIdx + 1) % words.length;
      speedVal = 500;
    }

    setTimeout(tick, speedVal);
  }

  tick();
}

// ===== INITIALIZATION =====
function init() {
  initEvents();
  initHeroTyping();
  
  // Load default Diamond preset graph
  loadPreset("diamond");

  // Hides loading screen
  setTimeout(() => {
    const loader = document.getElementById("loading-screen");
    if (loader) {
      loader.classList.add("hidden");
    }
  }, 600);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
