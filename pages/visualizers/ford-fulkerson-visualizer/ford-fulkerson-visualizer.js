// ===== GLOBAL STATE =====
let nodes = []; // { id: 'A', x: 250, y: 150, isSource: false, isSink: false }
let edges = []; // { id: 'A-B', source: 'A', target: 'B', capacity: 10, flow: 0 }
let nextLabelCode = 65; // ASCII 'A'

let selectedMode = "node"; // "node", "edge", "delete", "source", "sink"
let selectedStrategy = "bfs"; // "bfs" (Edmonds-Karp), "dfs" (Ford-Fulkerson)
let showResidual = false;
let isPlaying = false;
let playTimeout = null;
let speed = 800; // ms

// Animation steps
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
const strategySelect = document.getElementById("strategySelect");
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
const activeStructureTitle = document.getElementById("activeStructureTitle");
const activeStructureItems = document.getElementById("activeStructureItems");
const predecessorsDisplay = document.getElementById("predecessorsDisplay");
const historyTableBody = document.getElementById("historyTableBody");
const logPanel = document.getElementById("logPanel");
const clearLogsBtn = document.getElementById("clearLogsBtn");

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

    if (type === 'relax') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'path') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'augment') {
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
      osc.frequency.setValueAtTime(320, now);
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

  const step = currentStepIdx !== -1 ? steps[currentStepIdx] : null;

  // Determine drawing list of edges
  let renderEdges = [];
  if (showResidual) {
    // Generate residual edges representation
    edges.forEach((e) => {
      // Forward residual: capacity = cap - flow
      const forwardCap = e.capacity - e.flow;
      if (forwardCap > 0) {
        renderEdges.push({
          id: `${e.id}-fwd`,
          source: e.source,
          target: e.target,
          capacity: forwardCap,
          isResidual: true,
          isBackward: false,
          originalEdgeId: e.id,
          active: step ? step.activeEdges && step.activeEdges.includes(e.id) : false
        });
      }
      // Backward residual: capacity = flow
      if (e.flow > 0) {
        renderEdges.push({
          id: `${e.id}-bwd`,
          source: e.target, // REVERSED
          target: e.source,
          capacity: e.flow,
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
    
    // Intersection
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

    // Label weight bubbles
    const midX = (sourceNode.x + targetNode.x) / 2;
    const midY = (sourceNode.y + targetNode.y) / 2;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", midX - 18);
    rect.setAttribute("y", midY - 9);
    rect.setAttribute("width", 36);
    rect.setAttribute("height", 18);
    rect.setAttribute("class", "edge-label-bg");

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", midX);
    text.setAttribute("y", midY);

    if (edge.isResidual) {
      text.setAttribute("class", "edge-label-text residual");
      text.textContent = `${edge.capacity}`;
    } else {
      text.setAttribute("class", "edge-label-text");
      text.textContent = `${edge.flow}/${edge.capacity}`;
    }

    g.appendChild(rect);
    g.appendChild(text);

    // Double click to edit capacity
    g.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      if (isPlaying || currentStepIdx !== -1) return;

      const targetId = edge.isResidual ? edge.originalEdgeId : edge.id;
      const targetEdge = edges.find(ed => ed.id === targetId);
      if (!targetEdge) return;

      const val = prompt(
        `Update Edge ${targetEdge.source} → ${targetEdge.target}\nEnter Capacity:`,
        `${targetEdge.capacity}`
      );
      
      if (val) {
        const cap = parseInt(val, 10);
        if (!isNaN(cap) && cap > 0) {
          targetEdge.capacity = cap;
          targetEdge.flow = 0; // reset flow
          renderGraph();
          addLogEntry(`Updated edge ${targetEdge.source} &rarr; ${targetEdge.target} (Capacity: ${cap}).`, "sys");
        } else {
          alert("Invalid capacity value.");
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
    
    // Highlight states
    if (step) {
      if (step.activeNode === node.id) {
        classes += " search-active";
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
          circle.classList.add("search-active");
          addLogEntry(`Selected source Node ${node.id}. Click target node.`, "sys");
        } else {
          if (edgeSourceNode.id === node.id) {
            circle.classList.remove("search-active");
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
              flow: 0
            });
            addLogEntry(`Connected ${edgeSourceNode.id} &rarr; ${node.id} (Capacity: 10).`, "sys");
          }

          const srcEl = document.getElementById(`node-${edgeSourceNode.id}`);
          if (srcEl) srcEl.classList.remove("search-active");
          edgeSourceNode = null;
          renderGraph();
        }
      }
    });

    g.appendChild(circle);
    g.appendChild(text);
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
    alert("Max node letters (A-Z) reached!");
    return;
  }

  const label = String.fromCharCode(nextLabelCode);
  nextLabelCode++;

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

// ===== PRESET GRAPH LOADERS =====
const presets = {
  diamond: {
    nodes: [
      { id: "S", x: 100, y: 225, isSource: true, isSink: false },
      { id: "A", x: 250, y: 120, isSource: false, isSink: false },
      { id: "B", x: 250, y: 330, isSource: false, isSink: false },
      { id: "T", x: 400, y: 225, isSource: false, isSink: true }
    ],
    edges: [
      { id: "S-A", source: "S", target: "A", capacity: 10, flow: 0 },
      { id: "S-B", source: "S", target: "B", capacity: 10, flow: 0 },
      { id: "A-T", source: "A", target: "T", capacity: 5, flow: 0 },
      { id: "B-T", source: "B", target: "T", capacity: 10, flow: 0 },
      { id: "A-B", source: "A", target: "B", capacity: 5, flow: 0 }
    ],
    nextCode: 67
  },
  "multi-path": {
    nodes: [
      { id: "S", x: 80, y: 225, isSource: true, isSink: false },
      { id: "A", x: 220, y: 120, isSource: false, isSink: false },
      { id: "B", x: 220, y: 330, isSource: false, isSink: false },
      { id: "C", x: 340, y: 120, isSource: false, isSink: false },
      { id: "D", x: 340, y: 330, isSource: false, isSink: false },
      { id: "T", x: 480, y: 225, isSource: false, isSink: true }
    ],
    edges: [
      { id: "S-A", source: "S", target: "A", capacity: 10, flow: 0 },
      { id: "S-B", source: "S", target: "B", capacity: 10, flow: 0 },
      { id: "A-C", source: "A", target: "C", capacity: 4, flow: 0 },
      { id: "B-D", source: "B", target: "D", capacity: 4, flow: 0 },
      { id: "C-T", source: "C", target: "T", capacity: 10, flow: 0 },
      { id: "D-T", source: "D", target: "T", capacity: 10, flow: 0 },
      { id: "A-D", source: "A", target: "D", capacity: 6, flow: 0 },
      { id: "B-C", source: "B", target: "C", capacity: 6, flow: 0 }
    ],
    nextCode: 69
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
      { id: "S-A", source: "S", target: "A", capacity: 10, flow: 0 },
      { id: "S-B", source: "S", target: "B", capacity: 10, flow: 0 },
      { id: "A-C", source: "A", target: "C", capacity: 5, flow: 0 },
      { id: "B-D", source: "B", target: "D", capacity: 5, flow: 0 },
      { id: "C-T", source: "C", target: "T", capacity: 10, flow: 0 },
      { id: "D-T", source: "D", target: "T", capacity: 10, flow: 0 },
      { id: "A-D", source: "A", target: "D", capacity: 5, flow: 0 },
      { id: "B-C", source: "B", target: "C", capacity: 5, flow: 0 }
    ],
    nextCode: 69
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
    addLogEntry(`Loaded preset capacity network: ${key.toUpperCase()}.`, "sys");
  }
  
  resetVisualizerState();
  renderGraph();
}

// ===== AUGMENTING PATHS GENERATORS (BFS & DFS) =====
function getOutgoingResidual(u, workingEdges) {
  const list = [];
  workingEdges.forEach((e) => {
    // Forward residual: capacity = cap - flow
    if (e.source === u && e.capacity - e.flow > 0) {
      list.push({ node: e.target, edgeId: e.id, direction: "forward", cap: e.capacity - e.flow });
    }
    // Backward residual: capacity = flow
    if (e.target === u && e.flow > 0) {
      list.push({ node: e.source, edgeId: e.id, direction: "backward", cap: e.flow });
    }
  });
  // Sort alphabetically for deterministic BFS/DFS ordering
  return list.sort((a, b) => a.node.localeCompare(b.node));
}

function generateMaxFlowSteps() {
  steps = [];
  
  const sourceNode = nodes.find((n) => n.isSource);
  const sinkNode = nodes.find((n) => n.isSink);
  if (!sourceNode || !sinkNode) return;

  const S = sourceNode.id;
  const T = sinkNode.id;

  edges.forEach((e) => e.flow = 0);
  const workingEdges = edges.map((e) => ({ ...e }));
  
  let accumulatedFlow = 0;
  let hasAugmentingPath = true;
  let stepCount = 0;

  while (hasAugmentingPath) {
    const parent = {};
    nodes.forEach((n) => parent[n.id] = null);
    
    let pathNodes = [];
    let pathEdges = [];

    if (selectedStrategy === "bfs") {
      // ─────────────────────────────────────────────
      // BFS Strategy (Edmonds-Karp)
      // ─────────────────────────────────────────────
      const queue = [S];
      const visited = new Set([S]);

      steps.push({
        type: "INIT_BFS",
        activeNode: S,
        queue: [...queue],
        parentMap: { ...parent },
        totalFlow: accumulatedFlow,
        log: `Augmentation ${stepCount + 1}: Initialized BFS Queue at source '${S}'.`,
        logType: "search"
      });

      let found = false;
      while (queue.length > 0 && !found) {
        const u = queue.shift();
        
        steps.push({
          type: "QUEUE_POP",
          activeNode: u,
          queue: [...queue],
          parentMap: { ...parent },
          totalFlow: accumulatedFlow,
          log: `BFS popped node '${u}' from queue. Expanding residual edges.`,
          logType: "search"
        });

        const neighbors = getOutgoingResidual(u, workingEdges);
        for (let next of neighbors) {
          const v = next.node;
          if (!visited.has(v)) {
            visited.add(v);
            parent[v] = { parentNodeId: u, edgeId: next.edgeId, direction: next.direction };
            queue.push(v);

            steps.push({
              type: "RELAX_EDGE",
              activeNode: v,
              activeEdges: [next.edgeId],
              queue: [...queue],
              parentMap: { ...parent },
              totalFlow: accumulatedFlow,
              log: `BFS traversed edge ${u} &rarr; ${v} (Residual Cap: ${next.cap}).`,
              logType: "search"
            });

            if (v === T) {
              found = true;
              break;
            }
          }
        }
      }

      if (visited.has(T)) {
        // Trace path back
        let curr = T;
        while (curr !== S) {
          pathNodes.push(curr);
          const pInfo = parent[curr];
          pathEdges.push(pInfo.edgeId);
          curr = pInfo.parentNodeId;
        }
        pathNodes.push(S);
        pathNodes.reverse();
        pathEdges.reverse();
      } else {
        hasAugmentingPath = false;
        break;
      }

    } else {
      // ─────────────────────────────────────────────
      // DFS Strategy (Ford-Fulkerson)
      // ─────────────────────────────────────────────
      const visited = new Set();
      const dfsStack = [S];
      let found = false;

      steps.push({
        type: "INIT_DFS",
        activeNode: S,
        dfsStack: [...dfsStack],
        parentMap: { ...parent },
        totalFlow: accumulatedFlow,
        log: `Augmentation ${stepCount + 1}: Initialized DFS search at source '${S}'.`,
        logType: "search"
      });

      function dfs(u) {
        if (found) return;
        visited.add(u);

        steps.push({
          type: "ENTER_NODE",
          activeNode: u,
          dfsStack: [...dfsStack],
          parentMap: { ...parent },
          totalFlow: accumulatedFlow,
          log: `DFS entered node '${u}'. Searching outgoing residual edges.`,
          logType: "search"
        });

        const neighbors = getOutgoingResidual(u, workingEdges);
        for (let next of neighbors) {
          const v = next.node;
          if (!visited.has(v) && !found) {
            parent[v] = { parentNodeId: u, edgeId: next.edgeId, direction: next.direction };
            dfsStack.push(v);

            steps.push({
              type: "RELAX_EDGE",
              activeNode: v,
              activeEdges: [next.edgeId],
              dfsStack: [...dfsStack],
              parentMap: { ...parent },
              totalFlow: accumulatedFlow,
              log: `DFS traversed edge ${u} &rarr; ${v} (Residual Cap: ${next.cap}).`,
              logType: "search"
            });

            if (v === T) {
              found = true;
              break;
            }

            dfs(v);
            if (!found) {
              dfsStack.pop();
              steps.push({
                type: "BACKTRACK",
                activeNode: u,
                dfsStack: [...dfsStack],
                parentMap: { ...parent },
                totalFlow: accumulatedFlow,
                log: `DFS backtracked from '${v}' to '${u}'.`,
                logType: "search"
              });
            }
          }
        }
      }

      dfs(S);

      if (visited.has(T)) {
        let curr = T;
        while (curr !== S) {
          pathNodes.push(curr);
          const pInfo = parent[curr];
          pathEdges.push(pInfo.edgeId);
          curr = pInfo.parentNodeId;
        }
        pathNodes.push(S);
        pathNodes.reverse();
        pathEdges.reverse();
      } else {
        hasAugmentingPath = false;
        break;
      }
    }

    stepCount++;

    // Path Found step
    steps.push({
      type: "PATH_FOUND",
      pathNodes: [...pathNodes],
      activeEdges: [...pathEdges],
      queue: [],
      dfsStack: [],
      parentMap: { ...parent },
      totalFlow: accumulatedFlow,
      log: `Augmenting path discovered: [${pathNodes.join(" &rarr; ")}].`,
      logType: "path"
    });

    // Calculate bottleneck
    let df = Infinity;
    pathEdges.forEach((edgeId, idx) => {
      const e = workingEdges.find((ed) => ed.id === edgeId);
      const parentInfo = parent[pathNodes[idx + 1]];
      const resCap = (parentInfo.direction === "forward") ? (e.capacity - e.flow) : e.flow;
      if (resCap < df) df = resCap;
    });

    // Bottleneck step
    steps.push({
      type: "BOTTLENECK_FOUND",
      pathNodes: [...pathNodes],
      activeEdges: [...pathEdges],
      queue: [],
      dfsStack: [],
      dfFlow: df,
      parentMap: { ...parent },
      totalFlow: accumulatedFlow,
      log: `Bottleneck capacity along path = ${df}.`,
      logType: "path"
    });

    // Augment flow
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

    // Augmentation Complete Step
    steps.push({
      type: "AUGMENT_FLOW",
      pathNodes: [...pathNodes],
      activeEdges: [...pathEdges],
      queue: [],
      dfsStack: [],
      dfFlow: df,
      parentMap: { ...parent },
      totalFlow: accumulatedFlow,
      flowsState: workingEdges.map((e) => ({ id: e.id, flow: e.flow })),
      log: `Augmented flow by ${df} units. Total Max Flow value is now ${accumulatedFlow}.`,
      logType: "augment"
    });
  }

  // Done
  steps.push({
    type: "FINISHED_SUCCESS",
    distances: {},
    queue: [],
    totalFlow: accumulatedFlow,
    log: `Maximum flow reached. No more augmenting paths exist. Max Flow: ${accumulatedFlow}.`,
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
  flowInfoBadge.textContent = `Max Flow: ${step.totalFlow}`;

  // 3. Queue/Stack visual state monitors
  if (selectedStrategy === "bfs") {
    activeStructureTitle.textContent = "BFS Queue (FIFO)";
    if (!step.queue || step.queue.length === 0) {
      activeStructureItems.textContent = "[Empty]";
    } else {
      activeStructureItems.textContent = `[${step.queue.join(", ")}]`;
    }
  } else {
    activeStructureTitle.textContent = "DFS Call Stack (LIFO)";
    const stack = step.dfsStack || [];
    if (stack.length === 0) {
      activeStructureItems.textContent = "[Empty]";
    } else {
      activeStructureItems.textContent = `[${stack.join(", ")}]`;
    }
  }

  // Predecessors displays
  if (!step.parentMap) {
    predecessorsDisplay.textContent = "Ready";
  } else {
    const parentPairs = Object.keys(step.parentMap).filter((id) => step.parentMap[id] !== null).map((id) => {
      return `${id}&larr;${step.parentMap[id].parentNodeId}`;
    });
    predecessorsDisplay.innerHTML = parentPairs.length === 0 ? "Ready" : `{ ${parentPairs.join(", ")} }`;
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
        <td colspan="4" class="empty-table-message">No path augmentations recorded. Click Run to begin.</td>
      </tr>`;
  } else {
    augSteps.forEach((s, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>#${idx + 1}</strong></td>
        <td><span class="val-display">${s.pathNodes.join(" → ")}</span></td>
        <td><span class="green-text">+${s.dfFlow}</span></td>
        <td><strong>${s.totalFlow}</strong></td>
      `;
      historyTableBody.appendChild(tr);
    });

    const scrollContainer = historyTableBody.parentElement.parentElement;
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }
}

// ===== PLAYBACK ENGINE LOOP =====
function playNextStep() {
  if (currentStepIdx < steps.length - 1) {
    currentStepIdx++;
    renderStep(currentStepIdx);

    const step = steps[currentStepIdx];
    if (step.type === "RELAX_EDGE" || step.type === "ENTER_NODE") {
      playSound('relax');
    } else if (step.type === "PATH_FOUND" || step.type === "BOTTLENECK_FOUND") {
      playSound('path');
    } else if (step.type === "AUGMENT_FLOW") {
      playSound('augment');
    } else if (step.type === "FINISHED_SUCCESS") {
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
    alert("Please set both a Source (S) and a Sink (T) node first!");
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
  strategySelect.disabled = true;

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
  strategySelect.disabled = false;

  totalFlowVal.textContent = "0";
  flowInfoBadge.textContent = "Max Flow: 0";
  activeStructureItems.textContent = "[Empty]";
  predecessorsDisplay.textContent = "Ready";

  historyTableBody.innerHTML = `
    <tr>
      <td colspan="4" class="empty-table-message">No path augmentations recorded. Click Run to begin.</td>
    </tr>`;

  addLogEntry("Simulation reset.", "sys");
  renderGraph();
}

function initializeSimulation() {
  generateMaxFlowSteps();
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
        if (el) el.classList.remove("search-active");
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

  // Strategy change
  strategySelect.addEventListener("change", (e) => {
    selectedStrategy = e.target.value;
    addLogEntry(`Switched augmenting strategy to ${selectedStrategy === "bfs" ? "BFS (Edmonds-Karp)" : "DFS (Ford-Fulkerson)"}.`, "sys");
    resetVisualizerState();
    renderGraph();
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
    "DFS Augmenting Paths",
    "BFS Edmonds-Karp Hops Finder",
    "Residual Network Computations",
    "Max-Flow Min-Cut Verification"
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
