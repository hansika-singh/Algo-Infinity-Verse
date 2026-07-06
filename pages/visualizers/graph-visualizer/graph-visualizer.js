/**
 * graph-visualizer.js
 * Interactivity and algorithm engine for the Graph Visualizer page.
 * Implements:
 *  - Hero typing animation
 *  - Interactive SVG-based Graph Drawing (add/remove nodes and edges, weights, directed arrowheads, dragging)
 *  - BFS/DFS Traversal Animations (Discover, Active, Visited states)
 *  - Animation control system (Play, Pause, Step-forward, Speed controls, Queue/Stack rendering)
 */

document.addEventListener("DOMContentLoaded", () => {
  initHeroTyping();
  initVisualizer();
});

/* ─────────────────────────────────────────────
   Hero Typing Animation
   ───────────────────────────────────────────── */
function initHeroTyping() {
  const el = document.getElementById("typingTextGraph");
  if (!el) return;

  const words = [
    "Interactive Graph Canvas",
    "Breadth First Search (BFS)",
    "Depth First Search (DFS)",
    "Weighted & Directed Graphs",
    "Step-by-Step Traversal Tracing",
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

    let speed = isDeleting ? 50 : 100;

    if (!isDeleting && charIdx === current.length) {
      speed = 2000;
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      wordIdx = (wordIdx + 1) % words.length;
      speed = 500;
    }

    requestAnimationFrame(() => setTimeout(tick, speed));
  }

  tick();
}

/* ─────────────────────────────────────────────
   Graph Visualizer Core Engine
   ───────────────────────────────────────────── */
function initVisualizer() {
  const svg = document.getElementById("visualizerSvg");
  const edgeGroup = document.getElementById("svgEdges");
  const nodeGroup = document.getElementById("svgNodes");
  const placeholder = document.getElementById("canvasPlaceholder");
  
  if (!svg) return;

  // Graph state
  let nodes = []; // { id: 'A', x: 100, y: 100, visited: false, active: false }
  let edges = []; // { id: 'A-B', source: 'A', target: 'B', weight: 1, active: false, visited: false }
  let nextLabelCode = 65; // ASCII 'A'
  
  // Interaction variables
  let selectedMode = 'node'; // 'node', 'edge', 'delete', 'run'
  let isDirected = false;
  let isWeighted = false;
  let edgeSourceNode = null;
  let draggedNode = null;
  let dragOffset = { x: 0, y: 0 };
  
  // Animation variables
  let isPlaying = false;
  let animationSteps = [];
  let currentStepIdx = -1;
  let stepDelay = 600; // ms
  let timerId = null;
  let visitedOrder = [];
  let activeStructure = []; // live queue/stack representation

  // Elements mapping
  const modeBtns = document.querySelectorAll(".mode-btn");
  const directedToggle = document.getElementById("directedToggle");
  const weightedToggle = document.getElementById("weightedToggle");
  const algoSelect = document.getElementById("algoSelect");
  const speedRange = document.getElementById("speedRange");
  const speedDisplay = document.getElementById("speedDisplay");
  
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const stepBtn = document.getElementById("stepBtn");
  const resetBtn = document.getElementById("resetBtn");
  const clearGraphBtn = document.getElementById("clearGraphBtn");
  
  const logPanel = document.getElementById("logPanel");
  const liveStructureEl = document.getElementById("liveStructure");
  const structureTitleEl = document.getElementById("structureTitle");
  const visitedOrderEl = document.getElementById("visitedOrder");

  // Mode select buttons click
  modeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedMode = btn.getAttribute("data-mode");
      
      // Reset edge creation temporary state
      resetEdgeCreationState();
      
      if (selectedMode === 'run') {
        addLogEntry("Click on a starting node to begin traversal.");
      } else {
        stopAnimation();
        resetVisualStates();
      }
    });
  });

  // Toggle flags
  if (directedToggle) {
    directedToggle.addEventListener("change", (e) => {
      isDirected = e.target.checked;
      renderGraph();
    });
  }

  if (weightedToggle) {
    weightedToggle.addEventListener("change", (e) => {
      isWeighted = e.target.checked;
      // If weighted is turned on, assign default weight 1 to unweighted edges
      edges.forEach(edge => {
        if (edge.weight === undefined || edge.weight === null) {
          edge.weight = 1;
        }
      });
      renderGraph();
    });
  }

  // Speed controls
  if (speedRange && speedDisplay) {
    speedRange.addEventListener("input", (e) => {
      stepDelay = 1050 - parseInt(e.target.value); // invert so higher value = faster (lower delay)
      speedDisplay.textContent = `${parseInt(e.target.value)}ms`;
    });
  }

  // Reset Graph
  if (clearGraphBtn) {
    clearGraphBtn.addEventListener("click", () => {
      stopAnimation();
      nodes = [];
      edges = [];
      nextLabelCode = 65; // Reset label count
      resetVisualStates();
      renderGraph();
      addLogEntry("Graph cleared.");
    });
  }

  // Canvas Click (Add Node)
  svg.addEventListener("mousedown", (e) => {
    if (selectedMode !== 'node') return;
    if (e.target !== svg && e.target.id !== 'canvasBg') return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (nextLabelCode > 90) {
      console.warn("Alert:", "Maximum node limit (26 nodes) reached!");
      return;
    }

    const label = String.fromCharCode(nextLabelCode);
    nextLabelCode++;

    nodes.push({ id: label, x, y, visited: false, active: false });
    renderGraph();
    addLogEntry(`Added Node ${label}.`);
  });

  // Edge drawing state helper
  function resetEdgeCreationState() {
    if (edgeSourceNode) {
      const el = document.getElementById(`node-circle-${edgeSourceNode.id}`);
      if (el) el.classList.remove("active");
      edgeSourceNode = null;
    }
  }

  // Render nodes and lines inside SVG
  function renderGraph() {
    // Show/hide placeholder
    if (nodes.length === 0) {
      placeholder.style.display = 'block';
    } else {
      placeholder.style.display = 'none';
    }

    // Clear groupings
    edgeGroup.innerHTML = '';
    nodeGroup.innerHTML = '';

    // Draw Edges
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return;

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "svg-edge-group");
      g.setAttribute("id", `edge-group-${edge.id}`);
      
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      
      // Calculate intersection points with node boundary to render arrowheads cleanly
      const radius = 18;
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      let x1 = sourceNode.x;
      let y1 = sourceNode.y;
      let x2 = targetNode.x;
      let y2 = targetNode.y;
      
      if (dist > radius * 2) {
        // Offset starting points
        x1 = sourceNode.x + (dx / dist) * radius;
        y1 = sourceNode.y + (dy / dist) * radius;
        x2 = targetNode.x - (dx / dist) * (radius + 6); // extra padding for arrowhead tip
        y2 = targetNode.y - (dy / dist) * (radius + 6);
      }

      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      
      let classes = "edge-line";
      if (edge.active) classes += " active";
      if (edge.visited) classes += " visited";
      line.setAttribute("class", classes);
      line.setAttribute("id", `edge-line-${edge.id}`);

      if (isDirected) {
        line.setAttribute("marker-end", "url(#arrowhead)");
      }

      // Add delete edge listener
      line.addEventListener("click", (e) => {
        e.stopPropagation();
        if (selectedMode === 'delete') {
          edges = edges.filter(ed => ed.id !== edge.id);
          renderGraph();
          addLogEntry(`Removed edge ${edge.source} → ${edge.target}.`);
        }
      });

      g.appendChild(line);

      // Render weight bubble
      if (isWeighted) {
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", midX - 12);
        rect.setAttribute("y", midY - 9);
        rect.setAttribute("width", 24);
        rect.setAttribute("height", 18);
        rect.setAttribute("class", "edge-weight-bg");

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", midX);
        text.setAttribute("y", midY);
        text.setAttribute("class", "edge-weight-text");
        text.textContent = edge.weight !== undefined ? edge.weight : 1;

        // Click weight to edit
        g.addEventListener("dblclick", (e) => {
          e.stopPropagation();
          const val = null /* prompt removed */;
          const parsed = parseInt(val);
          if (!isNaN(parsed) && parsed >= 0) {
            edge.weight = parsed;
            renderGraph();
            addLogEntry(`Updated edge ${edge.source} → ${edge.target} weight to ${parsed}.`);
          }
        });

        g.appendChild(rect);
        g.appendChild(text);
      }

      edgeGroup.appendChild(g);
    });

    // Draw Nodes
    nodes.forEach(node => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "svg-node-group");
      g.setAttribute("id", `node-group-${node.id}`);
      g.setAttribute("transform", `translate(${node.x}, ${node.y})`);

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("r", 18);
      circle.setAttribute("id", `node-circle-${node.id}`);
      
      let classes = "node-circle";
      if (node.active) classes += " active";
      if (node.visited) classes += " visited";
      circle.setAttribute("class", classes);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("class", "node-text");
      text.textContent = node.id;

      // Mouse drag handlers
      circle.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        if (selectedMode === 'node') {
          draggedNode = node;
          const rect = svg.getBoundingClientRect();
          dragOffset.x = e.clientX - rect.left - node.x;
          dragOffset.y = e.clientY - rect.top - node.y;
        }
      });

      // Node clicks (modes: Edge, Delete, Run)
      circle.addEventListener("click", (e) => {
        e.stopPropagation();

        if (selectedMode === 'delete') {
          // Remove Node and any connecting edges
          nodes = nodes.filter(n => n.id !== node.id);
          edges = edges.filter(ed => ed.source !== node.id && ed.target !== node.id);
          renderGraph();
          addLogEntry(`Removed node ${node.id}.`);
        } 
        
        else if (selectedMode === 'edge') {
          if (!edgeSourceNode) {
            edgeSourceNode = node;
            circle.classList.add("active");
            addLogEntry(`Selected source node ${node.id}. Click target node.`);
          } else {
            if (edgeSourceNode.id === node.id) {
              // Clicking same node resets selection
              circle.classList.remove("active");
              edgeSourceNode = null;
              return;
            }

            // Create Edge
            const edgeId = `${edgeSourceNode.id}-${node.id}`;
            const reverseEdgeId = `${node.id}-${edgeSourceNode.id}`;
            const exists = edges.some(ed => ed.id === edgeId || (!isDirected && ed.id === reverseEdgeId));

            if (!exists) {
              let weightVal = 1;
              if (isWeighted) {
                const val = null /* prompt removed */;
                const parsed = parseInt(val);
                if (!isNaN(parsed) && parsed >= 0) {
                  weightVal = parsed;
                }
              }

              edges.push({
                id: edgeId,
                source: edgeSourceNode.id,
                target: node.id,
                weight: weightVal,
                active: false,
                visited: false
              });
              addLogEntry(`Created edge ${edgeSourceNode.id} → ${node.id} (Weight: ${weightVal}).`);
            }
            
            // Clear source active status
            const sourceEl = document.getElementById(`node-circle-${edgeSourceNode.id}`);
            if (sourceEl) sourceEl.classList.remove("active");
            edgeSourceNode = null;
            renderGraph();
          }
        } 
        
        else if (selectedMode === 'run') {
          startTraversal(node.id);
        }
      });

      g.appendChild(circle);
      g.appendChild(text);
      nodeGroup.appendChild(g);
    });
  }

  // Global mousemove for node dragging
  svg.addEventListener("mousemove", (e) => {
    if (!draggedNode) return;
    const rect = svg.getBoundingClientRect();
    let x = e.clientX - rect.left - dragOffset.x;
    let y = e.clientY - rect.top - dragOffset.y;

    // Boundary constraints
    x = Math.max(20, Math.min(rect.width - 20, x));
    y = Math.max(20, Math.min(rect.height - 20, y));

    draggedNode.x = x;
    draggedNode.y = y;
    renderGraph();
  });

  // Global mouseup to release drag
  window.addEventListener("mouseup", () => {
    draggedNode = null;
  });

  /* ─────────────────────────────────────────────
     Algorithm Visualizer Animations
     ───────────────────────────────────────────── */

  // Prepare & run algorithm from starting node
  function startTraversal(startNodeId) {
    stopAnimation();
    resetVisualStates();
    
    const algorithm = algoSelect.value; // 'bfs' or 'dfs'
    addLogEntry(`Starting ${algorithm.toUpperCase()} from Node ${startNodeId}...`);

    visitedOrder = [];
    activeStructure = [];
    animationSteps = [];
    currentStepIdx = -1;

    // Generate Steps
    if (algorithm === 'bfs') {
      runBfsGenerator(startNodeId);
      structureTitleEl.textContent = "Queue (FIFO)";
    } else {
      runDfsGenerator(startNodeId);
      structureTitleEl.textContent = "Stack (LIFO)";
    }

    if (isDbgMode) {
      initGraphDebugger();
      return;
    }

    // Enable control buttons
    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
    if (stepBtn) stepBtn.disabled = false;
    if (resetBtn) resetBtn.disabled = false;

    // Auto play initial step
    playAnimation();
  }

  // BFS Algorithm Step Generator
  function runBfsGenerator(startId) {
    const queue = [startId];
    const visited = new Set([startId]);

    // Initial step
    animationSteps.push({
      type: 'discover',
      nodeId: startId,
      log: `Enqueued starting Node ${startId}.`,
      queueState: [...queue],
      visitedState: [...visited],
      pseudoCodeLine: 0
    });

    while (queue.length > 0) {
      const curr = queue.shift();
      
      // Step: Visit node
      animationSteps.push({
        type: 'visit',
        nodeId: curr,
        log: `Dequeued and visiting Node ${curr}.`,
        queueState: [...queue],
        visitedState: [...visited],
        pseudoCodeLine: 3
      });

      // Find neighbors
      const neighbors = getNeighbors(curr);

      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);

          const edge = findEdge(curr, neighbor);
          if (edge) {
            // Step: Traverse edge
            animationSteps.push({
              type: 'traverse',
              edgeId: edge.id,
              nodeId: neighbor,
              log: `Traversing edge ${curr} → ${neighbor} to discover unvisited Node ${neighbor}.`,
              queueState: [...queue],
              visitedState: [...visited],
              pseudoCodeLine: 5
            });
          }

          // Step: Discover node
          animationSteps.push({
            type: 'discover',
            nodeId: neighbor,
            log: `Enqueued Node ${neighbor}.`,
            queueState: [...queue],
            visitedState: [...visited],
            pseudoCodeLine: 7
          });
        }
      });
    }

    animationSteps.push({
      type: 'done',
      log: 'BFS Traversal complete.',
      queueState: [],
      visitedState: [...visited],
      pseudoCodeLine: 2
    });
  }

  // DFS Algorithm Step Generator (Iterative Stack)
  function runDfsGenerator(startId) {
    const stack = [startId];
    const visited = new Set();

    animationSteps.push({
      type: 'discover',
      nodeId: startId,
      log: `Pushed starting Node ${startId} onto Stack.`,
      queueState: [...stack],
      visitedState: [...visited],
      pseudoCodeLine: 0
    });

    while (stack.length > 0) {
      const curr = stack.pop();

      if (!visited.has(curr)) {
        visited.add(curr);

        // Step: Visit node
        animationSteps.push({
          type: 'visit',
          nodeId: curr,
          log: `Popped and visiting Node ${curr}.`,
          queueState: [...stack],
          visitedState: [...visited],
          pseudoCodeLine: 2
        });

        // Find neighbors
        const neighbors = getNeighbors(curr);
        // Reverse neighbors for stack to visit left branches first conceptually
        const revNeighbors = [...neighbors].reverse();

        revNeighbors.forEach(neighbor => {
          if (!visited.has(neighbor)) {
            stack.push(neighbor);

            const edge = findEdge(curr, neighbor);
            if (edge) {
              animationSteps.push({
                type: 'traverse',
                edgeId: edge.id,
                nodeId: neighbor,
                log: `Traversing edge ${curr} → ${neighbor} to discover Node ${neighbor}.`,
                queueState: [...stack],
                visitedState: [...visited],
                pseudoCodeLine: 6
              });
            }

            animationSteps.push({
              type: 'discover',
              nodeId: neighbor,
              log: `Pushed Node ${neighbor} onto Stack.`,
              queueState: [...stack],
              visitedState: [...visited],
              pseudoCodeLine: 8
            });
          }
        });
      }
    }

    animationSteps.push({
      type: 'done',
      log: 'DFS Traversal complete.',
      queueState: [],
      visitedState: [...visited],
      pseudoCodeLine: 1
    });
  }

  // Retrieve outgoing neighbors
  function getNeighbors(nodeId) {
    const list = [];
    edges.forEach(edge => {
      if (edge.source === nodeId) {
        list.push(edge.target);
      } else if (!isDirected && edge.target === nodeId) {
        list.push(edge.source);
      }
    });
    // Sort neighbors alphabetically for deterministic outputs
    return list.sort();
  }

  // Search edge helper
  function findEdge(u, v) {
    return edges.find(edge => {
      if (edge.source === u && edge.target === v) return true;
      if (!isDirected && edge.source === v && edge.target === u) return true;
      return false;
    });
  }

  // Step Execution Player
  function playStep() {
    if (currentStepIdx >= animationSteps.length - 1) {
      stopAnimation();
      return;
    }

    currentStepIdx++;
    const step = animationSteps[currentStepIdx];
    
    // Execute step action
    applyStepState(step);

    // Schedule next
    if (isPlaying) {
      timerId = setTimeout(playStep, stepDelay);
    }
  }

  // Reset visual properties of all components on graph
  function resetVisualStates() {
    nodes.forEach(n => {
      n.visited = false;
      n.active = false;
    });
    edges.forEach(e => {
      e.visited = false;
      e.active = false;
    });
    renderGraph();
    
    if (visitedOrderEl) visitedOrderEl.innerHTML = '';
    if (liveStructureEl) liveStructureEl.innerHTML = '';
  }

  // Apply step results onto HTML and SVGs
  function applyStepState(step) {
    addLogEntry(step.log, step.type);

    // Apply Node Active/Visited statuses
    if (step.type === 'discover') {
      const node = nodes.find(n => n.id === step.nodeId);
      if (node) {
        node.active = true;
      }
    } 
    
    else if (step.type === 'visit') {
      const node = nodes.find(n => n.id === step.nodeId);
      if (node) {
        node.active = false;
        node.visited = true;
        
        // Append visited display
        visitedOrder.push(node.id);
        updateVisitedOrderDisplay();
      }
    } 
    
    else if (step.type === 'traverse') {
      const edge = edges.find(e => e.id === step.edgeId || (!isDirected && e.id === `${e.target}-${e.source}`));
      if (edge) {
        edge.visited = true;
      }
    }

    renderGraph();
    updateLiveStructureDisplay(step.queueState);
  }

  // Render visited badges
  function updateVisitedOrderDisplay() {
    if (!visitedOrderEl) return;
    visitedOrderEl.innerHTML = '';
    visitedOrder.forEach((nodeId, idx) => {
      const box = document.createElement("div");
      box.className = "structure-box visited";
      box.textContent = nodeId;
      visitedOrderEl.appendChild(box);

      if (idx < visitedOrder.length - 1) {
        const arrow = document.createElement("div");
        arrow.className = "structure-arrow";
        arrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
        visitedOrderEl.appendChild(arrow);
      }
    });
  }

  // Render queue/stack contents
  function updateLiveStructureDisplay(structureList) {
    if (!liveStructureEl) return;
    liveStructureEl.innerHTML = '';
    
    if (!structureList || structureList.length === 0) {
      liveStructureEl.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.85rem;">[Empty]</div>';
      return;
    }

    structureList.forEach((nodeId, idx) => {
      const box = document.createElement("div");
      box.className = "structure-box active";
      box.textContent = nodeId;
      liveStructureEl.appendChild(box);

      if (idx < structureList.length - 1) {
        const arrow = document.createElement("div");
        arrow.className = "structure-arrow";
        arrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
        liveStructureEl.appendChild(arrow);
      }
    });
  }

  // Play controls
  function playAnimation() {
    isPlaying = true;
    if (startBtn) startBtn.style.display = "none";
    if (pauseBtn) {
      pauseBtn.style.display = "inline-block";
      pauseBtn.disabled = false;
    }
    if (stepBtn) stepBtn.disabled = true;
    
    playStep();
  }

  function stopAnimation() {
    isPlaying = false;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (startBtn) startBtn.style.display = "inline-block";
    if (pauseBtn) {
      pauseBtn.style.display = "none";
      pauseBtn.disabled = true;
    }
    if (stepBtn) stepBtn.disabled = false;
  }

  // Connect playback controls DOM events
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (animationSteps.length === 0) {
        console.warn("Alert:", "Please click a node on the canvas to set start node first!");
        return;
      }
      playAnimation();
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      stopAnimation();
      addLogEntry("Animation paused.");
    });
  }

  if (stepBtn) {
    stepBtn.addEventListener("click", () => {
      if (animationSteps.length === 0) {
        console.warn("Alert:", "Please click a node on the canvas to set start node first!");
        return;
      }
      playStep();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      stopAnimation();
      resetVisualStates();
      currentStepIdx = -1;
      visitedOrder = [];
      addLogEntry("Visualizer state reset.");
    });
  }

  // ==========================================================================
  // GRAPH STEP DEBUGGER BACKEND
  // ==========================================================================
  
  let isDbgMode = false;
  let dbgIsPlaying = false;
  let dbgPlayInterval = null;

  const graphPseudoCodes = {
    bfs: [
      "queue.push(start_node)",
      "mark start_node as visited",
      "while queue is not empty:",
      "  curr = queue.shift()",
      "  for neighbor of curr:",
      "    if neighbor not visited:",
      "      mark neighbor as visited",
      "      queue.push(neighbor)"
    ],
    dfs: [
      "stack.push(start_node)",
      "while stack is not empty:",
      "  curr = stack.pop()",
      "  if curr not visited:",
      "    mark curr as visited",
      "    for neighbor of curr:",
      "      if neighbor not visited:",
      "        stack.push(neighbor)"
    ]
  };

  const dbgToggle = document.getElementById("dbgToggle");
  const dbgPanel = document.getElementById("debuggerPanel");
  
  if (dbgToggle) {
    dbgToggle.addEventListener("change", (e) => {
      isDbgMode = e.target.checked;
      stopAnimation();
      resetVisualStates();
      currentStepIdx = -1;
      visitedOrder = [];
      animationSteps = [];

      if (isDbgMode) {
        dbgPanel.style.display = "block";
        if (startBtn) startBtn.disabled = true;
        if (stepBtn) stepBtn.disabled = true;
        drawGraphPseudoCode(algoSelect.value);
        addLogEntry("Debugger Mode enabled. Select 'Run Algo' mode and click on a start node to generate trace.");
      } else {
        dbgPanel.style.display = "none";
        if (startBtn) startBtn.disabled = false;
        if (stepBtn) stepBtn.disabled = false;
        dbgPause();
      }
    });
  }

  // Handle algorithm switch in debugger mode
  if (algoSelect) {
    algoSelect.addEventListener("change", () => {
      if (isDbgMode) {
        drawGraphPseudoCode(algoSelect.value);
        resetVisualStates();
        currentStepIdx = -1;
        visitedOrder = [];
        animationSteps = [];
      }
    });
  }

  function drawGraphPseudoCode(algo) {
    const container = document.getElementById("dbgPseudoCode");
    if (!container) return;
    container.innerHTML = "";
    const codeLines = graphPseudoCodes[algo] || [];
    codeLines.forEach((line, idx) => {
      const div = document.createElement("div");
      div.className = "pseudo-code-line";
      div.textContent = `${idx + 1}: ${line}`;
      container.appendChild(div);
    });
  }

  function initGraphDebugger() {
    dbgPause();
    drawGraphPseudoCode(algoSelect.value);

    const slider = document.getElementById("dbgStepSlider");
    if (slider) {
      slider.min = 0;
      slider.max = animationSteps.length - 1;
      slider.value = 0;
    }

    currentStepIdx = 0;
    applyStepStateDbg(currentStepIdx);
  }

  function applyStepStateDbg(stepIdx) {
    if (stepIdx < 0 || stepIdx >= animationSteps.length) return;
    const step = animationSteps[stepIdx];

    // 1. Reset all visual properties
    nodes.forEach(n => {
      n.visited = false;
      n.active = false;
    });
    edges.forEach(e => {
      e.visited = false;
      e.active = false;
    });

    // 2. Apply step state
    const qState = step.queueState || [];
    const vState = step.visitedState || [];
    vState.forEach(id => {
      const node = nodes.find(n => n.id === id);
      if (node) node.visited = true;
    });

    if (step.type === 'discover') {
      const node = nodes.find(n => n.id === step.nodeId);
      if (node) node.active = true;
    } else if (step.type === 'visit') {
      const node = nodes.find(n => n.id === step.nodeId);
      if (node) {
        node.active = true;
        node.visited = true;
      }
    } else if (step.type === 'traverse') {
      const edge = edges.find(e => e.id === step.edgeId || (!isDirected && e.id === `${e.target}-${e.source}`));
      if (edge) {
        edge.visited = true;
        edge.active = true;
      }
    }

    renderGraph();

    // Reconstruct visited badges up to this point
    const visitedSoFar = [];
    for (let i = 0; i <= stepIdx; i++) {
      const s = animationSteps[i];
      if (s.type === 'visit' && !visitedSoFar.includes(s.nodeId)) {
        visitedSoFar.push(s.nodeId);
      }
    }

    if (visitedOrderEl) {
      visitedOrderEl.innerHTML = '';
      visitedSoFar.forEach((nodeId, idx) => {
        const box = document.createElement("div");
        box.className = "structure-box visited";
        box.textContent = nodeId;
        visitedOrderEl.appendChild(box);

        if (idx < visitedSoFar.length - 1) {
          const arrow = document.createElement("div");
          arrow.className = "structure-arrow";
          arrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
          visitedOrderEl.appendChild(arrow);
        }
      });
    }

    updateLiveStructureDisplay(qState);
    
    // Add to log panel
    if (logPanel) {
      const entry = document.createElement("div");
      let classes = "log-entry";
      if (step.type === 'discover') classes += " active";
      if (step.type === 'visit') classes += " visited";
      entry.className = classes;
      entry.textContent = `> ${step.log}`;
      logPanel.appendChild(entry);
      logPanel.scrollTop = logPanel.scrollHeight;
    }

    const expEl = document.getElementById("dbgExplanationText");
    if (expEl) {
      expEl.innerHTML = generateGraphExplanation(step, stepIdx);
    }

    const counterEl = document.getElementById("dbgStepCounter");
    if (counterEl) counterEl.textContent = `Step ${stepIdx + 1} / ${animationSteps.length}`;

    const sliderEl = document.getElementById("dbgStepSlider");
    if (sliderEl) sliderEl.value = stepIdx;

    const prevBtn = document.getElementById("dbgPrevBtn");
    const nextBtn = document.getElementById("dbgNextBtn");
    if (prevBtn) prevBtn.disabled = stepIdx <= 0;
    if (nextBtn) nextBtn.disabled = stepIdx >= animationSteps.length - 1;

    const lines = document.querySelectorAll(".pseudo-code-line");
    lines.forEach((line, idx) => {
      if (idx === step.pseudoCodeLine) {
        line.classList.add("active");
      } else {
        line.classList.remove("active");
      }
    });
  }

  function generateGraphExplanation(step, idx) {
    const algo = algoSelect.value;
    if (step.type === 'done') {
      return `The ${algo.toUpperCase()} traversal has visited all reachable nodes. The traversal is complete.`;
    }
    
    if (step.type === 'discover') {
      if (idx === 0) {
        return `Initialize the traversal by placing the start node <strong>${step.nodeId}</strong> in the ${algo === 'bfs' ? 'Queue' : 'Stack'} and marking it as visited.`;
      }
      return `We discover node <strong>${step.nodeId}</strong> through traversal and place it in the ${algo === 'bfs' ? 'Queue' : 'Stack'} to explore later.`;
    }
    
    if (step.type === 'visit') {
      return `De-structure the next node <strong>${step.nodeId}</strong> from the front of the ${algo === 'bfs' ? 'Queue (FIFO)' : 'Stack (LIFO)'} and mark it as visited. We will now explore its outgoing edges.`;
    }
    
    if (step.type === 'traverse') {
      return `We traverse the edge to reach <strong>${step.nodeId}</strong>. Since it is unvisited, we will enqueue/push it to the structure.`;
    }
    
    return step.log;
  }

  function dbgPlay() {
    if (dbgIsPlaying) return;
    dbgIsPlaying = true;
    document.getElementById("dbgPlayBtn").style.display = "none";
    document.getElementById("dbgPauseBtn").style.display = "inline-block";

    dbgPlayInterval = setInterval(() => {
      if (currentStepIdx >= animationSteps.length - 1) {
        dbgPause();
        return;
      }
      currentStepIdx++;
      applyStepStateDbg(currentStepIdx);
    }, stepDelay);
  }

  // Pause
  function dbgPause() {
    if (!dbgIsPlaying) return;
    dbgIsPlaying = false;
    document.getElementById("dbgPlayBtn").style.display = "inline-block";
    document.getElementById("dbgPauseBtn").style.display = "none";
    if (dbgPlayInterval) {
      clearInterval(dbgPlayInterval);
      dbgPlayInterval = null;
    }
  }

  // Bind Debugger Controls Buttons
  const dbgPrevBtn = document.getElementById("dbgPrevBtn");
  const dbgNextBtn = document.getElementById("dbgNextBtn");
  const dbgPlayBtn = document.getElementById("dbgPlayBtn");
  const dbgPauseBtn = document.getElementById("dbgPauseBtn");
  const dbgStepSlider = document.getElementById("dbgStepSlider");

  if (dbgPrevBtn) {
    dbgPrevBtn.addEventListener("click", () => {
      dbgPause();
      if (currentStepIdx > 0) {
        currentStepIdx--;
        applyStepStateDbg(currentStepIdx);
      }
    });
  }

  if (dbgNextBtn) {
    dbgNextBtn.addEventListener("click", () => {
      dbgPause();
      if (currentStepIdx < animationSteps.length - 1) {
        currentStepIdx++;
        applyStepStateDbg(currentStepIdx);
      }
    });
  }

  if (dbgPlayBtn) dbgPlayBtn.addEventListener("click", dbgPlay);
  if (dbgPauseBtn) dbgPauseBtn.addEventListener("click", dbgPause);

  if (dbgStepSlider) {
    dbgStepSlider.addEventListener("input", (e) => {
      dbgPause();
      currentStepIdx = parseInt(e.target.value);
      applyStepStateDbg(currentStepIdx);
    });
  }

  // Initial draw
  renderGraph();
}
