// ===== GLOBAL STATE =====
let nodes = []; // { id: 'A', x: 250, y: 150, isSource: false, isSink: false, dist: Infinity }
let edges = []; // { id: 'A-B', source: 'A', target: 'B', capacity: 10, cost: 2, flow: 0 }
let nextLabelCode = 65; // ASCII 'A' (if source/sink renamed, this rolls)

let selectedMode = "node"; // "node", "edge", "delete", "source", "sink"
let showResidual = false;
let isPlaying = false;
let playTimeout = null;
let speed = 800; // ms

// Animation step storage
let steps = [];
let currentStepIdx = -1;

// Audio context
let audioCtx = null;
let isSoundEnabled = true;

// DOM Elements
const svg = document.getElementById("visualizerSvg");
const edgeGroup = document.getElementById("svgEdges");
const nodeGroup = document.getElementById("svgNodes");
const placeholder = document.getElementById("canvasPlaceholder");

const modeBtns = document.querySelectorAll(".mode-btn");
const presetSelect = document.getElementById("presetSelect");
const residualToggle = document.getElementById("residualToggle");
const speedRange = document.getElementById("speedRange");
const speedDisplay = document.getElementById("speedDisplay");
const soundToggle = document.getElementById("soundToggle");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stepBackBtn = document.getElementById("stepBackBtn");
const stepForwardBtn = document.getElementById("stepForwardBtn");
const resetBtn = document.getElementById("resetBtn");

const canvasModeBadge = document.getElementById("canvasModeBadge");
const flowInfoBadge = document.getElementById("flowInfoBadge");

const totalFlowVal = document.getElementById("totalFlowVal");
const totalCostVal = document.getElementById("totalCostVal");
const spfaQueueDisplay = document.getElementById("spfaQueueDisplay");
const spfaDistDisplay = document.getElementById("spfaDistDisplay");
const historyTableBody = document.getElementById("historyTableBody");
const logPanel = document.getElementById("logPanel");
const clearLogsBtn = document.getElementById("clearLogsBtn");

// Mouse drag state
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

    if (type === 'relax') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'path') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'augment') {
      // Ascending chord: C4 -> G4 -> C5
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63, now);
      osc.frequency.setValueAtTime(392.00, now + 0.08);
      osc.frequency.setValueAtTime(523.25, now + 0.16);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.setValueAtTime(0.06, now + 0.08);
      gain.gain.setValueAtTime(0.06, now + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'done') {
      // Chime: C5 -> E5 -> G5 -> C6
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      osc.frequency.setValueAtTime(1046.50, now + 0.24);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.setValueAtTime(0.08, now + 0.08);
      gain.gain.setValueAtTime(0.08, now + 0.16);
      gain.gain.setValueAtTime(0.08, now + 0.24);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch (e) {
    console.warn("Audio synthesis error:", e);
  }
}

// ===== GRAPH RENDER ENGINE =====
function renderGraph() {
  if (nodes.length === 0) {
    placeholder.style.display = "block";
  } else {
    placeholder.style.display = "none";
  }

  edgeGroup.innerHTML = "";
  nodeGroup.innerHTML = "";

  // Helper to find parent step data
  const step = currentStepIdx !== -1 ? steps[currentStepIdx] : null;

  // Determine drawing list of edges
  let renderEdges = [];
  if (showResidual) {
    // Generate residual edges representation
    edges.forEach((e) => {
      // Forward residual: capacity = cap - flow, cost = cost
      const forwardCap = e.capacity - e.flow;
      if (forwardCap > 0) {
        renderEdges.push({
          id: `${e.id}-fwd`,
          source: e.source,
          target: e.target,
          capacity: forwardCap,
          cost: e.cost,
          isResidual: true,
          isBackward: false,
          originalEdgeId: e.id,
          active: step ? step.activeEdges && step.activeEdges.includes(e.id) : false
        });
      }
      // Backward residual: capacity = flow, cost = -cost
      if (e.flow > 0) {
        renderEdges.push({
          id: `${e.id}-bwd`,
          source: e.target, // REVERSED DIRECTION
          target: e.source,
          capacity: e.flow,
          cost: -e.cost,
          isResidual: true,
          isBackward: true,
          originalEdgeId: e.id,
          active: step ? step.activeEdges && step.activeEdges.includes(e.id) : false
        });
      }
    });
  } else {
    // Normal graph view
    renderEdges = edges.map((e) => ({
      ...e,
      isResidual: false,
      isBackward: false,
      active: step ? step.activeEdges && step.activeEdges.includes(e.id) : false
    }));
  }

  // Draw Edges
  renderEdges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "svg-edge-group");

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    
    // Intersection adjustments
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
      x2 = targetNode.x - (dx / dist) * (radius + 6);
      y2 = targetNode.y - (dy / dist) * (radius + 6);
    }

    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);

    let classes = "edge-line";
    let markerId = "arrowhead";

    if (edge.active) {
      classes += " active-augment";
      markerId = "arrowhead-active";
    } else if (edge.isResidual) {
      if (edge.isBackward) {
        classes += " residual-backward";
        markerId = "arrowhead-back";
      } else {
        classes += " residual-forward";
        markerId = "arrowhead-residual";
      }
    }
    line.setAttribute("class", classes);
    line.setAttribute("marker-end", `url(#${markerId})`);

    // Click deletion listener
    line.addEventListener("click", (e) => {
      e.stopPropagation();
      if (selectedMode === "delete" && !isPlaying && currentStepIdx === -1) {
        const targetId = edge.isResidual ? edge.originalEdgeId : edge.id;
        edges = edges.filter((ed) => ed.id !== targetId);
        renderGraph();
        addLogEntry(`Deleted edge ${edge.source} &rarr; ${edge.target}.`, "sys");
      }
    });

    g.appendChild(line);

    // Flow / Capacity / Cost weight bubbles
    const midX = (sourceNode.x + targetNode.x) / 2;
    const midY = (sourceNode.y + targetNode.y) / 2;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", midX - 25);
    rect.setAttribute("y", midY - 9);
    rect.setAttribute("width", 50);
    rect.setAttribute("height", 18);
    rect.setAttribute("class", "edge-label-bg");

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", midX);
    text.setAttribute("y", midY);

    if (edge.isResidual) {
      text.setAttribute("class", `edge-label-text residual ${edge.isBackward ? 'cost-negative' : ''}`);
      text.textContent = `${edge.capacity} (-$${Math.abs(edge.cost)})`;
      if (edge.cost >= 0) {
        text.textContent = `${edge.capacity} ($${edge.cost})`;
      }
    } else {
      text.setAttribute("class", "edge-label-text");
      text.textContent = `${edge.flow}/${edge.capacity} ($${edge.cost})`;
    }

    g.appendChild(rect);
    g.appendChild(text);

    // Double click to edit capacity/cost
    g.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      if (isPlaying || currentStepIdx !== -1) return;

      const targetId = edge.isResidual ? edge.originalEdgeId : edge.id;
      const targetEdge = edges.find(ed => ed.id === targetId);
      if (!targetEdge) return;

      const val = null;
      
      if (val) {
        const parts = val.split(",");
        const cap = parseInt(parts[0], 10);
        const cost = parseInt(parts[1], 10);
        if (!isNaN(cap) && !isNaN(cost) && cap > 0 && cost >= 0) {
          targetEdge.capacity = cap;
          targetEdge.cost = cost;
          targetEdge.flow = 0; // reset flow
          renderGraph();
          addLogEntry(`Updated edge ${targetEdge.source} &rarr; ${targetEdge.target} (Capacity: ${cap}, Unit Cost: ${cost}).`, "sys");
        } else {
          console.warn("Alert:", "Invalid capacity or cost values.");
        }
      }
    });

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
    if (node.isSource) classes += " source-node";
    else if (node.isSink) classes += " sink-node";
    
    // Highlight SPFA relaxation states
    if (step) {
      if (step.activeNode === node.id) {
        classes += " spfa-active";
      } else if (step.pathNodes && step.pathNodes.includes(node.id)) {
        classes += " path-node";
      }
    }
    circle.setAttribute("class", classes);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("class", "node-text");
    text.textContent = node.id;

    // Drag events
    circle.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      if (selectedMode === "node" && !isPlaying && currentStepIdx === -1) {
        draggedNode = node;
        const rect = svg.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left - node.x;
        dragOffset.y = e.clientY - rect.top - node.y;
      }
    });

    // Click toggles
    circle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isPlaying || currentStepIdx !== -1) return;

      if (selectedMode === "delete") {
        nodes = nodes.filter((n) => n.id !== node.id);
        edges = edges.filter((ed) => ed.source !== node.id && ed.target !== node.id);
        renderGraph();
        addLogEntry(`Deleted Node ${node.id}.`, "sys");
      } else if (selectedMode === "source") {
        nodes.forEach((n) => n.isSource = false);
        node.isSource = true;
        node.isSink = false;
        renderGraph();
        addLogEntry(`Node ${node.id} designated as Source (S).`, "sys");
      } else if (selectedMode === "sink") {
        nodes.forEach((n) => n.isSink = false);
        node.isSink = true;
        node.isSource = false;
        renderGraph();
        addLogEntry(`Node ${node.id} designated as Sink (T).`, "sys");
      } else if (selectedMode === "edge") {
        if (!edgeSourceNode) {
          edgeSourceNode = node;
          circle.classList.add("spfa-active"); // temp active highlight
          addLogEntry(`Selected source Node ${node.id}. Click target node.`, "sys");
        } else {
          if (edgeSourceNode.id === node.id) {
            circle.classList.remove("spfa-active");
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
              capacity: 10,
              cost: 2,
              flow: 0
            });
            addLogEntry(`Connected ${edgeSourceNode.id} &rarr; ${node.id} (Capacity: 10, Cost: 2).`, "sys");
          }

          const srcEl = document.getElementById(`node-${edgeSourceNode.id}`);
          if (srcEl) srcEl.classList.remove("spfa-active");
          edgeSourceNode = null;
          renderGraph();
        }
      }
    });

    g.appendChild(circle);
    g.appendChild(text);

    // Render SPFA distance under nodes during simulation
    if (currentStepIdx !== -1 && step && step.distances) {
      const distVal = step.distances[node.id];
      const distText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      distText.setAttribute("y", 25);
      
      let classes = "node-dist-text";
      if (step.activeNode === node.id) {
        classes += " relaxed";
      }
      distText.setAttribute("class", classes);
      
      const displayVal = distVal === Infinity ? "∞" : distVal;
      distText.textContent = `d: ${displayVal}`;
      g.appendChild(distText);
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
    console.warn("Alert:", "Max node letters (A-Z) reached!");
    return;
  }

  const label = String.fromCharCode(nextLabelCode);
  nextLabelCode++;

  // Auto-designate first placed as S, second as T
  let isSource = false;
  let isSink = false;
  if (nodes.length === 0) isSource = true;
  else if (nodes.length === 1) isSink = true;

  nodes.push({ id: label, x, y, isSource, isSink });
  renderGraph();
  addLogEntry(`Placed Node ${label}${isSource ? ' (Source)' : isSink ? ' (Sink)' : ''}.`, "sys");
  playSound('step');
});

// Drag movements
svg.addEventListener("mousemove", (e) => {
  if (!draggedNode) return;
  const rect = svg.getBoundingClientRect();
  let x = e.clientX - rect.left - dragOffset.x;
  let y = e.clientY - rect.top - dragOffset.y;

  x = Math.max(20, Math.min(rect.width - 20, x));
  y = Math.max(20, Math.min(rect.height - 20, y));

  draggedNode.x = x;
  draggedNode.y = y;
  renderGraph();
});

window.addEventListener("mouseup", () => {
  draggedNode = null;
});

// ===== PRESET NETWORKS =====
const presets = {
  diamond: {
    nodes: [
      { id: "S", x: 100, y: 225, isSource: true, isSink: false },
      { id: "A", x: 250, y: 120, isSource: false, isSink: false },
      { id: "B", x: 250, y: 330, isSource: false, isSink: false },
      { id: "T", x: 400, y: 225, isSource: false, isSink: true }
    ],
    edges: [
      { id: "S-A", source: "S", target: "A", capacity: 10, cost: 2, flow: 0 },
      { id: "S-B", source: "S", target: "B", capacity: 15, cost: 1, flow: 0 },
      { id: "A-T", source: "A", target: "T", capacity: 10, cost: 1, flow: 0 },
      { id: "B-T", source: "B", target: "T", capacity: 5, cost: 3, flow: 0 },
      { id: "A-B", source: "A", target: "B", capacity: 5, cost: 1, flow: 0 }
    ],
    nextCode: 67 // 'C'
  },
  "cheap-expensive": {
    nodes: [
      { id: "S", x: 80, y: 225, isSource: true, isSink: false },
      { id: "A", x: 250, y: 120, isSource: false, isSink: false },
      { id: "B", x: 250, y: 330, isSource: false, isSink: false },
      { id: "T", x: 420, y: 225, isSource: false, isSink: true }
    ],
    edges: [
      { id: "S-A", source: "S", target: "A", capacity: 4, cost: 1, flow: 0 },
      { id: "A-T", source: "A", target: "T", capacity: 4, cost: 1, flow: 0 },
      { id: "S-B", source: "S", target: "B", capacity: 15, cost: 5, flow: 0 },
      { id: "B-T", source: "B", target: "T", capacity: 15, cost: 5, flow: 0 }
    ],
    nextCode: 67
  },
  disjoint: {
    nodes: [
      { id: "S", x: 80, y: 225, isSource: true, isSink: false },
      { id: "A", x: 200, y: 120, isSource: false, isSink: false },
      { id: "B", x: 200, y: 330, isSource: false, isSink: false },
      { id: "C", x: 320, y: 120, isSource: false, isSink: false },
      { id: "D", x: 320, y: 330, isSource: false, isSink: false },
      { id: "T", x: 440, y: 225, isSource: false, isSink: true }
    ],
    edges: [
      { id: "S-A", source: "S", target: "A", capacity: 10, cost: 1, flow: 0 },
      { id: "S-B", source: "S", target: "B", capacity: 10, cost: 2, flow: 0 },
      { id: "A-C", source: "A", target: "C", capacity: 5, cost: 1, flow: 0 },
      { id: "B-D", source: "B", target: "D", capacity: 5, cost: 1, flow: 0 },
      { id: "C-T", source: "C", target: "T", capacity: 10, cost: 1, flow: 0 },
      { id: "D-T", source: "D", target: "T", capacity: 10, cost: 2, flow: 0 },
      { id: "A-D", source: "A", target: "D", capacity: 5, cost: 1, flow: 0 },
      { id: "B-C", source: "B", target: "C", capacity: 5, cost: 1, flow: 0 }
    ],
    nextCode: 69 // 'E'
  }
};

function loadPreset(key) {
  if (isPlaying) pauseSimulation();
  
  if (key === "empty") {
    nodes = [];
    edges = [];
    nextLabelCode = 65;
    addLogEntry("Flow workspace cleared.", "sys");
  } else if (presets[key]) {
    const data = presets[key];
    nodes = data.nodes.map((n) => ({ ...n }));
    edges = data.edges.map((e) => ({ ...e, flow: 0 }));
    nextLabelCode = data.nextCode;
    addLogEntry(`Loaded preset flow network: ${key.toUpperCase()}.`, "sys");
  }
  
  resetVisualizerState();
  renderGraph();
}

// ===== SUCCESSIVE SHORTEST PATH GENERATOR (MCMF) =====
function generateMcmfSteps() {
  steps = [];
  
  const sourceNode = nodes.find((n) => n.isSource);
  const sinkNode = nodes.find((n) => n.isSink);
  if (!sourceNode || !sinkNode) return;

  const S = sourceNode.id;
  const T = sinkNode.id;

  // Reset flows initially
  edges.forEach((e) => e.flow = 0);

  let accumulatedFlow = 0;
  let accumulatedCost = 0;
  
  // Track dynamic edge flows to generate successive steps correctly
  const workingEdges = edges.map((e) => ({ ...e }));

  let augmentingPathExists = true;
  let augmentationCount = 0;

  while (augmentingPathExists) {
    // 1. Run SPFA to find the shortest path in terms of cost in residual graph
    const dist = {};
    const parent = {}; // maps node -> { parentNodeId, edgeId, direction: 'forward' | 'backward' }
    const inQueue = {};
    
    nodes.forEach((n) => {
      dist[n.id] = Infinity;
      parent[n.id] = null;
      inQueue[n.id] = false;
    });

    dist[S] = 0;
    const queue = [S];
    inQueue[S] = true;

    steps.push({
      type: "INIT_SPFA",
      activeNode: S,
      distances: { ...dist },
      queue: [...queue],
      totalFlow: accumulatedFlow,
      totalCost: accumulatedCost,
      log: `Augmentation ${augmentationCount + 1}: Initialized SPFA queue at source '${S}'.`,
      logType: "spfa"
    });

    while (queue.length > 0) {
      const u = queue.shift();
      inQueue[u] = false;

      steps.push({
        type: "SPFA_DEQUEUE",
        activeNode: u,
        distances: { ...dist },
        queue: [...queue],
        totalFlow: accumulatedFlow,
        totalCost: accumulatedCost,
        log: `SPFA popped node '${u}' from queue. Relaxing outgoing residual edges.`,
        logType: "spfa"
      });

      // Find outgoing residual edges from node u
      // Forward residual: original edge u -> v where cap - flow > 0. cost = cost
      // Backward residual: original edge v -> u where flow > 0. cost = -cost
      const activeFwdEdges = workingEdges.filter((e) => e.source === u && e.capacity - e.flow > 0);
      const activeBwdEdges = workingEdges.filter((e) => e.target === u && e.flow > 0);

      // Relax forward residual edges
      activeFwdEdges.forEach((e) => {
        const v = e.target;
        const edgeCost = e.cost;
        if (dist[u] + edgeCost < dist[v]) {
          dist[v] = dist[u] + edgeCost;
          parent[v] = { node: u, edgeId: e.id, direction: "forward" };
          
          if (!inQueue[v]) {
            queue.push(v);
            inQueue[v] = true;
          }

          steps.push({
            type: "SPFA_RELAX",
            activeNode: v,
            activeEdges: [e.id],
            distances: { ...dist },
            queue: [...queue],
            totalFlow: accumulatedFlow,
            totalCost: accumulatedCost,
            log: `Relaxed forward edge ${u} &rarr; ${v}: Distance to ${v} updated to ${dist[v]}.`,
            logType: "spfa"
          });
        }
      });

      // Relax backward residual edges
      activeBwdEdges.forEach((e) => {
        const v = e.source; // REVERSED DIRECTION
        const edgeCost = -e.cost;
        if (dist[u] + edgeCost < dist[v]) {
          dist[v] = dist[u] + edgeCost;
          parent[v] = { node: u, edgeId: e.id, direction: "backward" };

          if (!inQueue[v]) {
            queue.push(v);
            inQueue[v] = true;
          }

          steps.push({
            type: "SPFA_RELAX",
            activeNode: v,
            activeEdges: [e.id],
            distances: { ...dist },
            queue: [...queue],
            totalFlow: accumulatedFlow,
            totalCost: accumulatedCost,
            log: `Relaxed backward edge ${u} &rarr; ${v} (cancellation): Distance to ${v} updated to ${dist[v]}.`,
            logType: "spfa"
          });
        }
      });
    }

    // 2. Check if a path to Sink T exists
    if (dist[T] === Infinity) {
      augmentingPathExists = false;
      break;
    }

    augmentationCount++;

    // 3. Trace back path from T to S
    const pathNodes = [];
    const pathEdges = [];
    let currNode = T;

    while (currNode !== S) {
      pathNodes.push(currNode);
      const edgeInfo = parent[currNode];
      pathEdges.push(edgeInfo.edgeId);
      currNode = edgeInfo.node;
    }
    pathNodes.push(S);
    pathNodes.reverse();
    pathEdges.reverse();

    steps.push({
      type: "PATH_FOUND",
      pathNodes: [...pathNodes],
      activeEdges: [...pathEdges],
      distances: { ...dist },
      queue: [],
      totalFlow: accumulatedFlow,
      totalCost: accumulatedCost,
      log: `Shortest augmenting path found: [${pathNodes.join(" &rarr; ")}] with path cost = $${dist[T]}.`,
      logType: "path"
    });

    // 4. Calculate bottleneck capacity along path
    let df = Infinity;
    pathEdges.forEach((edgeId, idx) => {
      const e = workingEdges.find((ed) => ed.id === edgeId);
      const uNode = pathNodes[idx];
      const parentInfo = parent[pathNodes[idx + 1]];
      
      const resCap = (parentInfo.direction === "forward") ? (e.capacity - e.flow) : e.flow;
      if (resCap < df) df = resCap;
    });

    steps.push({
      type: "BOTTLENECK_FOUND",
      pathNodes: [...pathNodes],
      activeEdges: [...pathEdges],
      distances: { ...dist },
      queue: [],
      dfFlow: df,
      totalFlow: accumulatedFlow,
      totalCost: accumulatedCost,
      log: `Bottleneck residual capacity along the path is ${df}.`,
      logType: "path"
    });

    // 5. Augment flow and accumulate metrics
    pathEdges.forEach((edgeId, idx) => {
      const e = workingEdges.find((ed) => ed.id === edgeId);
      const parentInfo = parent[pathNodes[idx + 1]];
      
      if (parentInfo.direction === "forward") {
        e.flow += df;
      } else {
        e.flow -= df;
      }
    });

    accumulatedFlow += df;
    accumulatedCost += df * dist[T];

    steps.push({
      type: "AUGMENT_FLOW",
      pathNodes: [...pathNodes],
      activeEdges: [...pathEdges],
      distances: { ...dist },
      queue: [],
      dfFlow: df,
      pathCost: dist[T],
      stepCost: df * dist[T],
      totalFlow: accumulatedFlow,
      totalCost: accumulatedCost,
      flowsState: workingEdges.map((e) => ({ id: e.id, flow: e.flow })),
      log: `Augmented flow by ${df} units. Path Cost = $${dist[T]}, Flow contribution cost = $${df * dist[T]}.`,
      logType: "augment"
    });
  }

  // 6. Finished successfully
  steps.push({
    type: "MCMF_FINISHED",
    distances: {},
    queue: [],
    totalFlow: accumulatedFlow,
    totalCost: accumulatedCost,
    log: `Min-Cost Max-Flow complete. Max Flow: ${accumulatedFlow}, Min Cost: $${accumulatedCost}.`,
    logType: "done"
  });
}

// ===== RENDER STEP LOGIC =====
function renderStep(idx) {
  if (idx < 0 || idx >= steps.length) return;
  const step = steps[idx];

  // 1. Log update
  addLogEntry(step.log, step.logType);

  // 2. Scoreboard counters
  totalFlowVal.textContent = step.totalFlow;
  totalCostVal.textContent = `$${step.totalCost}`;
  flowInfoBadge.textContent = `Flow: ${step.totalFlow}, Cost: $${step.totalCost}`;

  // 3. SPFA Queues tracing
  if (!step.queue || step.queue.length === 0) {
    spfaQueueDisplay.textContent = "[Empty]";
  } else {
    spfaQueueDisplay.textContent = `[${step.queue.join(", ")}]`;
  }

  // Distances tracing
  if (!step.distances || Object.keys(step.distances).length === 0) {
    spfaDistDisplay.textContent = "Ready / Complete";
  } else {
    const distPairs = Object.keys(step.distances).sort().map((id) => {
      const val = step.distances[id] === Infinity ? "∞" : step.distances[id];
      return `${id}:${val}`;
    });
    spfaDistDisplay.textContent = `{ ${distPairs.join(", ")} }`;
  }

  // 4. Sync flow states on edges
  if (step.flowsState) {
    step.flowsState.forEach((fState) => {
      const e = edges.find((ed) => ed.id === fState.id);
      if (e) e.flow = fState.flow;
    });
  }

  renderGraph();

  // 5. Update History table up to this step
  updateHistoryTable(idx);

  // 6. Disable/enable playback controls
  stepBackBtn.disabled = idx <= 0;
  stepForwardBtn.disabled = idx >= steps.length - 1;
}

function updateHistoryTable(maxStepIdx) {
  historyTableBody.innerHTML = "";
  
  const augSteps = [];
  for (let i = 0; i <= maxStepIdx; i++) {
    if (steps[i].type === "AUGMENT_FLOW") {
      augSteps.push(steps[i]);
    }
  }

  if (augSteps.length === 0) {
    historyTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-table-message">No augmentations recorded. Click Run to begin.</td>
      </tr>`;
  } else {
    let runningCost = 0;
    augSteps.forEach((s, idx) => {
      runningCost += s.stepCost;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>#${idx + 1}</strong></td>
        <td><span class="val-display">${s.pathNodes.join(" → ")}</span></td>
        <td><span class="green-text">+${s.dfFlow}</span></td>
        <td>$${s.pathCost}</td>
        <td>$${s.stepCost}</td>
        <td><strong>$${runningCost}</strong></td>
      `;
      historyTableBody.appendChild(tr);
    });

    // Scroll to latest table records
    const scrollContainer = historyTableBody.parentElement.parentElement;
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }
}

// ===== PLAYBACK CYCLE ENGINE =====
function playNextStep() {
  if (currentStepIdx < steps.length - 1) {
    currentStepIdx++;
    renderStep(currentStepIdx);

    // Audio beep based on step type
    const step = steps[currentStepIdx];
    if (step.type === "SPFA_RELAX") {
      playSound('relax');
    } else if (step.type === "PATH_FOUND" || step.type === "BOTTLENECK_FOUND") {
      playSound('path');
    } else if (step.type === "AUGMENT_FLOW") {
      playSound('augment');
    } else if (step.type === "MCMF_FINISHED") {
      playSound('done');
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

  const sourceNode = nodes.find((n) => n.isSource);
  const sinkNode = nodes.find((n) => n.isSink);
  if (!sourceNode || !sinkNode) {
    console.warn("Alert:", "Please set both a Source (S) and a Sink (T) node first!");
    return;
  }

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

  // Reset original flows
  edges.forEach((e) => e.flow = 0);

  // UI Resets
  startBtn.style.display = "inline-block";
  if (pauseBtn) pauseBtn.style.display = "none";
  stepBackBtn.disabled = true;
  stepForwardBtn.disabled = false;
  presetSelect.disabled = false;

  totalFlowVal.textContent = "0";
  totalCostVal.textContent = "$0";
  flowInfoBadge.textContent = "Flow: 0, Cost: 0";
  spfaQueueDisplay.textContent = "[Empty]";
  spfaDistDisplay.textContent = "Ready";

  historyTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="empty-table-message">No augmentations recorded. Click Run to begin.</td>
    </tr>`;

  addLogEntry("Simulation reset.", "sys");
  renderGraph();
}

function initializeSimulation() {
  generateMcmfSteps();
  currentStepIdx = 0;
  renderStep(0);
}

// ===== LOGGER DETAILS =====
function addLogEntry(text, type = "sys") {
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `&gt; [${type.toUpperCase()}] ${text}`;
  logPanel.appendChild(entry);
  logPanel.scrollTop = logPanel.scrollHeight;
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
        if (el) el.classList.remove("spfa-active");
        edgeSourceNode = null;
      }
      
      if (selectedMode === "run") {
        initializeSimulation();
      } else {
        resetVisualizerState();
      }
    });
  });

  // Preset Select change
  presetSelect.addEventListener("change", (e) => {
    loadPreset(e.target.value);
  });

  // Residual graph toggle
  residualToggle.addEventListener("change", (e) => {
    showResidual = e.target.checked;
    addLogEntry(`Toggled residual representation: ${showResidual ? "ON" : "OFF"}.`, "sys");
    renderGraph();
  });

  // Playback triggers
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
  const el = document.getElementById("typingTextFlow");
  if (!el) return;

  const words = [
    "Successive Shortest Path",
    "SPFA Cost Distance Relaxation",
    "Residual Capacity Augmentation",
    "Cost-Canceling Backward Edges"
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
  
  // Load default Diamond flow preset graph
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
