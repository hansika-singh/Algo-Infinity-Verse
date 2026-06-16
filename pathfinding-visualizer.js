/**
 * pathfinding-visualizer.js
 * Core engine for Algo Infinity Verse Pathfinding Visualizer.
 * Implements:
 *  - Grid state management (22 rows x 50 columns)
 *  - Repositioning of Start and Target nodes via drag-and-drop
 *  - Multi-tool drawing (Draw Wall, Erase Wall, Place Weight, Clear Cell) via click-and-drag
 *  - Pathfinding algorithms: BFS, DFS, and Dijkstra (Weighted pathfinding)
 *  - Playback controls: Play, Pause, Step-forward, Delay slider, Reset Grid, and Clear Path
 *  - Execution logs, live node stats, and algorithmic complexity panel updates
 *  - Randomized maze / obstacle generator (scattered walls & weights)
 */

document.addEventListener("DOMContentLoaded", () => {
  initHeroTyping();
  initPathfindingVisualizer();
});

/* ─────────────────────────────────────────────
   Hero Typing Animation
   ───────────────────────────────────────────── */
function initHeroTyping() {
  const el = document.getElementById("typingTextPathfinding");
  if (!el) return;

  const words = [
    "Breadth First Search (BFS)",
    "Depth First Search (DFS)",
    "Dijkstra's Algorithm",
    "Interactive Wall Drawing",
    "Weighted Path Exploration",
    "Random Obstacle Generation",
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

    let speed = isDeleting ? 40 : 80;

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
   Pathfinding Visualizer Core
   ───────────────────────────────────────────── */
function initPathfindingVisualizer() {
  // Grid parameters
  const ROWS = 22;
  const COLS = 50;
  
  // Node coordinates
  let startNode = { r: 10, c: 10 };
  let targetNode = { r: 10, c: 40 };
  
  // Board configuration (2D Arrays)
  let walls = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  let weights = Array.from({ length: ROWS }, () => Array(COLS).fill(false)); // true = cost 5, false = cost 1
  
  // Interactive Drawing states
  let activeTool = "wall"; // "wall", "erase", "weight", "clear"
  let isMouseDown = false;
  let draggedItem = null; // "start" or "target"
  
  // Playback states
  let isPlaying = false;
  let stepDelay = 25; // ms
  let animationSteps = []; // List of step events
  let shortestPath = []; // Path nodes in order
  let currentStepIdx = -1;
  let timerId = null;
  
  // Traversal Stats
  let visitedCount = 0;
  let pathLength = 0;
  let pathCost = 0;
  let hasFoundTarget = false;
  
  // DOM Elements
  const gridCanvas = document.getElementById("gridCanvas");
  const toolBtns = document.querySelectorAll(".mode-btn");
  const generateMazeBtn = document.getElementById("generateMazeBtn");
  
  const algoSelect = document.getElementById("algoSelect");
  const speedRange = document.getElementById("speedRange");
  const speedDisplay = document.getElementById("speedDisplay");
  
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const stepBtn = document.getElementById("stepBtn");
  const clearPathBtn = document.getElementById("clearPathBtn");
  const resetGridBtn = document.getElementById("resetGridBtn");
  
  const visitedCountEl = document.getElementById("visitedCount");
  const pathLengthEl = document.getElementById("shortestPathLength");
  const pathCostEl = document.getElementById("shortestPathCost");
  const executionStateEl = document.getElementById("executionState");
  
  const algoInfoTitle = document.getElementById("algoInfoTitle");
  const timeComplexityEl = document.getElementById("timeComplexity");
  const spaceComplexityEl = document.getElementById("spaceComplexity");
  const shortestPathGuaranteeEl = document.getElementById("shortestPathGuarantee");
  const logPanel = document.getElementById("logPanel");

  // Initialize
  buildGrid();
  updateComplexityHUD();
  
  /* ─────────────────────────────────────────────
     Grid Builder
     ───────────────────────────────────────────── */
  function buildGrid() {
    gridCanvas.innerHTML = "";
    gridCanvas.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    gridCanvas.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;
    
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement("div");
        cell.className = "grid-cell";
        cell.setAttribute("data-row", r);
        cell.setAttribute("data-col", c);
        
        // Populate node states
        if (r === startNode.r && c === startNode.c) {
          cell.classList.add("cell-start");
          cell.innerHTML = '<i class="fas fa-chevron-right"></i>';
        } else if (r === targetNode.r && c === targetNode.c) {
          cell.classList.add("cell-target");
          cell.innerHTML = '<i class="fas fa-bullseye"></i>';
        } else if (walls[r][c]) {
          cell.classList.add("cell-wall");
        } else if (weights[r][c]) {
          cell.classList.add("cell-weight");
          cell.innerHTML = '<i class="fas fa-weight-hanging"></i>';
        }
        
        // Mouse Listeners
        cell.addEventListener("mousedown", (e) => handleMouseDown(e, r, c));
        cell.addEventListener("mouseenter", () => handleMouseEnter(r, c));
        
        gridCanvas.appendChild(cell);
      }
    }
  }

  /* ─────────────────────────────────────────────
     Interactive Drawing & Dragging Handlers
     ───────────────────────────────────────────── */
  function handleMouseDown(e, r, c) {
    e.preventDefault();
    if (isPlaying) return;
    
    // Check if dragging start/target nodes
    if (r === startNode.r && c === startNode.c) {
      draggedItem = "start";
    } else if (r === targetNode.r && c === targetNode.c) {
      draggedItem = "target";
    } else {
      isMouseDown = true;
      applyTool(r, c);
    }
  }
  
  function handleMouseEnter(r, c) {
    if (isPlaying) return;
    
    // Drag Start/Target node
    if (draggedItem) {
      // Prevent placing start on target, target on start, or on walls
      if (draggedItem === "start" && (r !== targetNode.r || c !== targetNode.c) && !walls[r][c]) {
        moveStartNode(r, c);
      } else if (draggedItem === "target" && (r !== startNode.r || c !== startNode.c) && !walls[r][c]) {
        moveTargetNode(r, c);
      }
    } 
    // Click and drag tool drawing
    else if (isMouseDown) {
      applyTool(r, c);
    }
  }
  
  // Global release
  window.addEventListener("mouseup", () => {
    isMouseDown = false;
    draggedItem = null;
  });
  
  function applyTool(r, c) {
    // Cannot draw on start/target nodes
    if ((r === startNode.r && c === startNode.c) || (r === targetNode.r && c === targetNode.c)) return;
    
    const cell = getCellElement(r, c);
    if (!cell) return;
    
    if (activeTool === "wall") {
      walls[r][c] = true;
      weights[r][c] = false; // Wall overrides weight
      cell.className = "grid-cell cell-wall";
      cell.innerHTML = "";
    } else if (activeTool === "erase") {
      walls[r][c] = false;
      cell.classList.remove("cell-wall");
    } else if (activeTool === "weight") {
      weights[r][c] = true;
      walls[r][c] = false; // Weight overrides wall
      cell.className = "grid-cell cell-weight";
      cell.innerHTML = '<i class="fas fa-weight-hanging"></i>';
    } else if (activeTool === "clear") {
      walls[r][c] = false;
      weights[r][c] = false;
      cell.className = "grid-cell";
      cell.innerHTML = "";
    }
    
    // Clear path animations on change to keep visual state consistent
    clearPathVisuals();
  }
  
  function moveStartNode(r, c) {
    // Remove old start
    const oldCell = getCellElement(startNode.r, startNode.c);
    if (oldCell) {
      oldCell.classList.remove("cell-start");
      oldCell.innerHTML = "";
    }
    
    // If target cell had weight, remove weight
    weights[r][c] = false;
    
    // Set new start
    startNode = { r, c };
    const newCell = getCellElement(r, c);
    if (newCell) {
      newCell.classList.remove("cell-visited", "cell-shortest-path", "cell-weight");
      newCell.classList.add("cell-start");
      newCell.innerHTML = '<i class="fas fa-chevron-right"></i>';
    }
    
    clearPathVisuals();
  }
  
  function moveTargetNode(r, c) {
    // Remove old target
    const oldCell = getCellElement(targetNode.r, targetNode.c);
    if (oldCell) {
      oldCell.classList.remove("cell-target");
      oldCell.innerHTML = "";
    }
    
    // If target cell had weight, remove weight
    weights[r][c] = false;
    
    // Set new target
    targetNode = { r, c };
    const newCell = getCellElement(r, c);
    if (newCell) {
      newCell.classList.remove("cell-visited", "cell-shortest-path", "cell-weight");
      newCell.classList.add("cell-target");
      newCell.innerHTML = '<i class="fas fa-bullseye"></i>';
    }
    
    clearPathVisuals();
  }
  
  function getCellElement(r, c) {
    return document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
  }
  
  // Select drawing tools
  toolBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      toolBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeTool = btn.getAttribute("data-tool");
    });
  });

  // Generate Randomized Maze/Obstacles
  if (generateMazeBtn) {
    generateMazeBtn.addEventListener("click", () => {
      if (isPlaying) return;
      stopAnimation();
      clearPathVisuals();
      
      walls = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
      weights = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
      
      let wallsPlaced = 0;
      let weightsPlaced = 0;
      
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          // Keep start and target nodes clear
          if ((r === startNode.r && c === startNode.c) || (r === targetNode.r && c === targetNode.c)) continue;
          
          const rand = Math.random();
          if (rand < 0.25) { // 25% chance of wall
            walls[r][c] = true;
            wallsPlaced++;
          } else if (rand < 0.35) { // 10% chance of weight
            weights[r][c] = true;
            weightsPlaced++;
          }
        }
      }
      
      buildGrid();
      addLogEntry(`Generated random grid: placed ${wallsPlaced} walls and ${weightsPlaced} weights.`, "info");
    });
  }

  /* ─────────────────────────────────────────────
     Complexity & Control Bindings
     ───────────────────────────────────────────── */
  if (algoSelect) {
    algoSelect.addEventListener("change", () => {
      updateComplexityHUD();
      clearPathVisuals();
    });
  }
  
  if (speedRange && speedDisplay) {
    speedRange.addEventListener("input", (e) => {
      // Value represents delay in ms. Less delay = faster animation.
      stepDelay = parseInt(e.target.value);
      speedDisplay.textContent = `${stepDelay}ms`;
    });
  }
  
  function updateComplexityHUD() {
    const algo = algoSelect.value;
    if (algo === "bfs") {
      algoInfoTitle.innerHTML = '<i class="fas fa-project-diagram" style="color: var(--accent); margin-right: 0.5rem;"></i>Breadth First Search';
      timeComplexityEl.textContent = "O(V + E)";
      spaceComplexityEl.textContent = "O(V)";
      shortestPathGuaranteeEl.textContent = "Yes (Unweighted)";
    } else if (algo === "dfs") {
      algoInfoTitle.innerHTML = '<i class="fas fa-sitemap" style="color: var(--accent); margin-right: 0.5rem;"></i>Depth First Search';
      timeComplexityEl.textContent = "O(V + E)";
      spaceComplexityEl.textContent = "O(V)";
      shortestPathGuaranteeEl.textContent = "No";
    } else if (algo === "dijkstra") {
      algoInfoTitle.innerHTML = '<i class="fas fa-route" style="color: var(--accent); margin-right: 0.5rem;"></i>Dijkstra\'s Algorithm';
      timeComplexityEl.textContent = "O((V + E) log V)";
      spaceComplexityEl.textContent = "O(V)";
      shortestPathGuaranteeEl.textContent = "Yes (Weighted)";
    }
  }

  /* ─────────────────────────────────────────────
     Pathfinding Algorithms Engine
     ───────────────────────────────────────────── */
  function getNeighbors(r, c) {
    const neighbors = [];
    // 4-directional search coordinates
    const directions = [
      { r: -1, c: 0 }, // Up
      { r: 1, c: 0 },  // Down
      { r: 0, c: -1 }, // Left
      { r: 0, c: 1 }   // Right
    ];
    
    for (const dir of directions) {
      const nr = r + dir.r;
      const nc = c + dir.c;
      
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        if (!walls[nr][nc]) {
          neighbors.push({ r: nr, c: nc });
        }
      }
    }
    return neighbors;
  }
  
  function getKey(r, c) {
    return `${r},${c}`;
  }

  function runBfs() {
    const visitedOrder = [];
    const parent = {};
    const queue = [startNode];
    const visitedSet = new Set([getKey(startNode.r, startNode.c)]);
    let found = false;

    while (queue.length > 0) {
      const curr = queue.shift();
      
      // Skip logging start node as visited order, but log others
      if (curr.r !== startNode.r || curr.c !== startNode.c) {
        visitedOrder.push(curr);
      }
      
      if (curr.r === targetNode.r && curr.c === targetNode.c) {
        found = true;
        break;
      }
      
      const neighbors = getNeighbors(curr.r, curr.c);
      for (const neighbor of neighbors) {
        const key = getKey(neighbor.r, neighbor.c);
        if (!visitedSet.has(key)) {
          visitedSet.add(key);
          parent[key] = curr;
          queue.push(neighbor);
        }
      }
    }
    
    const path = backtrackPath(parent, found);
    return { visitedOrder, path, found };
  }

  function runDfs() {
    const visitedOrder = [];
    const parent = {};
    const stack = [startNode];
    const visitedSet = new Set();
    let found = false;

    while (stack.length > 0) {
      const curr = stack.pop();
      const key = getKey(curr.r, curr.c);
      
      if (visitedSet.has(key)) continue;
      visitedSet.add(key);
      
      if (curr.r !== startNode.r || curr.c !== startNode.c) {
        visitedOrder.push(curr);
      }
      
      if (curr.r === targetNode.r && curr.c === targetNode.c) {
        found = true;
        break;
      }
      
      const neighbors = getNeighbors(curr.r, curr.c);
      // Process neighbors
      for (const neighbor of neighbors) {
        const nKey = getKey(neighbor.r, neighbor.c);
        if (!visitedSet.has(nKey)) {
          parent[nKey] = curr;
          stack.push(neighbor);
        }
      }
    }
    
    const path = backtrackPath(parent, found);
    return { visitedOrder, path, found };
  }

  function runDijkstra() {
    const visitedOrder = [];
    const parent = {};
    let found = false;
    
    // Distances table
    const dist = Array.from({ length: ROWS }, () => Array(COLS).fill(Infinity));
    dist[startNode.r][startNode.c] = 0;
    
    // Set of unvisited coordinates
    const unvisited = new Set();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!walls[r][c]) {
          unvisited.add(getKey(r, c));
        }
      }
    }

    while (unvisited.size > 0) {
      // Find node with minimum distance in unvisited
      let minDist = Infinity;
      let currKey = null;
      
      for (const key of unvisited) {
        const [r, c] = key.split(",").map(Number);
        if (dist[r][c] < minDist) {
          minDist = dist[r][c];
          currKey = key;
        }
      }
      
      if (currKey === null || minDist === Infinity) {
        // Target is unreachable
        break;
      }
      
      const [cr, cc] = currKey.split(",").map(Number);
      unvisited.delete(currKey);
      
      if (cr !== startNode.r || cc !== startNode.c) {
        visitedOrder.push({ r: cr, c: cc });
      }
      
      if (cr === targetNode.r && cc === targetNode.c) {
        found = true;
        break;
      }
      
      const neighbors = getNeighbors(cr, cc);
      for (const neighbor of neighbors) {
        const nKey = getKey(neighbor.r, neighbor.c);
        if (unvisited.has(nKey)) {
          const cost = weights[neighbor.r][neighbor.c] ? 5 : 1;
          const newDist = dist[cr][cc] + cost;
          
          if (newDist < dist[neighbor.r][neighbor.c]) {
            dist[neighbor.r][neighbor.c] = newDist;
            parent[nKey] = { r: cr, c: cc };
          }
        }
      }
    }
    
    const path = backtrackPath(parent, found);
    return { visitedOrder, path, found };
  }

  function backtrackPath(parent, found) {
    const path = [];
    if (!found) return path;
    
    let curr = targetNode;
    while (curr.r !== startNode.r || curr.c !== startNode.c) {
      path.push(curr);
      const key = getKey(curr.r, curr.c);
      curr = parent[key];
      if (!curr) break;
    }
    // Add start node to the final path array
    path.push(startNode);
    return path.reverse();
  }

  /* ─────────────────────────────────────────────
     Animation Playback Engine
     ───────────────────────────────────────────── */
  function startPlayback() {
    if (isPlaying) return;
    
    // If not loaded yet, run the pathfinder to compile the steps
    if (animationSteps.length === 0) {
      clearPathVisuals();
      
      const algo = algoSelect.value;
      addLogEntry(`Executing ${algo.toUpperCase()} pathfinder...`, "info");
      executionStateEl.textContent = "Running";
      executionStateEl.style.color = "var(--primary-light)";
      
      let result;
      if (algo === "bfs") {
        result = runBfs();
      } else if (algo === "dfs") {
        result = runDfs();
      } else if (algo === "dijkstra") {
        result = runDijkstra();
      }
      
      // Compile steps
      // Step format: { type: 'visited' | 'path', r, c }
      animationSteps = result.visitedOrder.map(node => ({ type: "visited", r: node.r, c: node.c }));
      shortestPath = result.path;
      hasFoundTarget = result.found;
      
      // Append shortest path nodes to steps
      if (hasFoundTarget) {
        // Exclude start and target from visual path overwrite to preserve icons
        const pathVisualNodes = shortestPath.filter(
          node => (node.r !== startNode.r || node.c !== startNode.c) && 
                  (node.r !== targetNode.r || node.c !== targetNode.c)
        );
        pathVisualNodes.forEach(node => {
          animationSteps.push({ type: "path", r: node.r, c: node.c });
        });
      }
      
      animationSteps.push({ type: "done" });
      currentStepIdx = -1;
      
      // Reset HUD
      visitedCount = 0;
      pathLength = 0;
      pathCost = 0;
      visitedCountEl.textContent = "0";
      pathLengthEl.textContent = "0";
      pathCostEl.textContent = "0";
    }
    
    isPlaying = true;
    startBtn.style.display = "none";
    pauseBtn.style.display = "inline-block";
    stepBtn.disabled = true;
    
    playStep();
  }
  
  function playStep() {
    if (currentStepIdx >= animationSteps.length - 1) {
      stopAnimation();
      executionStateEl.textContent = "Completed";
      executionStateEl.style.color = "`#10b981`";
      if (hasFoundTarget) {
        addLogEntry(`Target reached! Shortest path length: ${shortestPath.length} cells. Total cost: ${calculateTotalCost()}.`, "success");
      } else {
        addLogEntry("Target unreachable! Visited all accessible nodes.", "info");
      }
      return;
    }
    
    currentStepIdx++;
    const step = animationSteps[currentStepIdx];
    applyStepState(step);
    
    if (isPlaying) {
      timerId = setTimeout(playStep, stepDelay);
    }
  }
  
  function applyStepState(step) {
    if (step.type === "visited") {
      const cell = getCellElement(step.r, step.c);
      if (cell) {
        cell.classList.add("cell-visited");
      }
      visitedCount++;
      visitedCountEl.textContent = visitedCount;
    } 
    else if (step.type === "path") {
      const cell = getCellElement(step.r, step.c);
      if (cell) {
        cell.classList.add("cell-shortest-path");
      }
      pathLength++;
      pathLengthEl.textContent = pathLength;
      
      // Calculate running path cost
      pathCost += weights[step.r][step.c] ? 5 : 1;
      pathCostEl.textContent = pathCost;
    }
    else if (step.type === "done") {
      // Finalize HUD values
      pathLengthEl.textContent = shortestPath.length;
      pathCostEl.textContent = calculateTotalCost();
    }
  }
  
  function calculateTotalCost() {
    if (!hasFoundTarget || shortestPath.length === 0) return 0;
    return shortestPath.reduce((acc, curr) => acc + (weights[curr.r][curr.c] ? 5 : 1), 0);
  }
  
  function stopAnimation() {
    isPlaying = false;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    startBtn.style.display = "inline-block";
    pauseBtn.style.display = "none";
    stepBtn.disabled = false;
  }
  
  function clearPathVisuals() {
    stopAnimation();
    animationSteps = [];
    shortestPath = [];
    currentStepIdx = -1;
    visitedCount = 0;
    pathLength = 0;
    pathCost = 0;
    hasFoundTarget = false;
    
    visitedCountEl.textContent = "0";
    pathLengthEl.textContent = "0";
    pathCostEl.textContent = "0";
    executionStateEl.textContent = "Idle";
    executionStateEl.style.color = "var(--text-secondary)";
    
    const cells = document.querySelectorAll(".grid-cell");
    cells.forEach(cell => {
      cell.classList.remove("cell-visited", "cell-shortest-path");
    });
  }
  
  function resetGrid() {
    stopAnimation();
    
    // Clear state arrays
    walls = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    weights = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    
    // Reset positions
    startNode = { r: 10, c: 10 };
    targetNode = { r: 10, c: 40 };
    
    buildGrid();
    clearPathVisuals();
    addLogEntry("Grid reset to empty template.");
  }

  // Play button click
  startBtn.addEventListener("click", () => {
    startPlayback();
  });
  
  // Pause button click
  pauseBtn.addEventListener("click", () => {
    stopAnimation();
    executionStateEl.textContent = "Paused";
    executionStateEl.style.color = "#f59e0b";
    addLogEntry("Animation paused.");
  });
  
  // Step button click
  stepBtn.addEventListener("click", () => {
    if (animationSteps.length === 0) {
      startPlayback();
      stopAnimation(); // Pause immediately to step manually
    }
    
    if (currentStepIdx < animationSteps.length - 1) {
      currentStepIdx++;
      applyStepState(animationSteps[currentStepIdx]);
      if (currentStepIdx === animationSteps.length - 1) {
        executionStateEl.textContent = "Completed";
        executionStateEl.style.color = "#10b981";
        addLogEntry("Target trace complete.", "success");
      }
    } else {
      addLogEntry("Execution completed. Reset or clear grid to rerun.");
    }
  });
  
  // Clear buttons
  clearPathBtn.addEventListener("click", () => {
    clearPathVisuals();
    addLogEntry("Path and visited cells cleared.", "info");
  });
  
  resetGridBtn.addEventListener("click", () => {
    resetGrid();
  });

  /* ─────────────────────────────────────────────
     Execution Logger
     ───────────────────────────────────────────── */
  function addLogEntry(msg, type = "normal") {
    if (!logPanel) return;
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    entry.textContent = `> ${msg}`;
    logPanel.appendChild(entry);
    
    // Scroll to bottom
    logPanel.scrollTop = logPanel.scrollHeight;
  }
}
