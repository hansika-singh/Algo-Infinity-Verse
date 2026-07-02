// dsa-adventure.js

const storyData = {
  start: {
    title: "Scenario 01: Core Routing",
    text: "<p>Welcome to the <strong>Algorithm Visualizer V3.1</strong>.</p><p>We have a critical unweighted grid. Dark cells are corrupted memory (walls).</p><p>You must route a signal from the Start node (Blue) to the Target node (Red).</p><p>Select an algorithm below. You can now <strong>Pause</strong>, <strong>Step Forward</strong>, or <strong>Stop</strong> execution using the controls at the top of the Arena.</p>",
    metrics: { time: "-", space: "-", visited: "-" },
    choices: [
      { id: "bfs", text: "Execute BFS (Queue)", algo: "BFS" },
      { id: "dfs", text: "Execute DFS (Stack)", algo: "DFS" }
    ],
    state: "start"
  },
  post_bfs: {
    title: "Analysis: BFS",
    text: "<p><strong>Observation:</strong> BFS explored systematically layer by layer.</p><p>By looking at the <strong>Queue</strong> in the inspector, you saw it pushed all neighbors of the current layer before moving deeper. This guarantees the shortest path.</p><p><strong>Drawback:</strong> The queue grew massive as the perimeter expanded, hitting O(V) space.</p>",
    metrics: { time: "O(V + E)", space: "O(V) (Queue)", visited: "High" },
    choices: [
      { id: "reset", text: "Reset Simulator", algo: "SYS" }
    ],
    state: "done"
  },
  post_dfs: {
    title: "Analysis: DFS",
    text: "<p><strong>Observation:</strong> DFS plunged deep immediately.</p><p>By watching the <strong>Stack</strong>, you saw it constantly pushed the newest neighbor and popped it immediately, plunging down a single path until it hit a wall.</p><p><strong>Drawback:</strong> The resulting path is completely unoptimized and chaotic.</p>",
    metrics: { time: "O(V + E)", space: "O(Max Depth)", visited: "Moderate" },
    choices: [
      { id: "reset", text: "Reset Simulator", algo: "SYS" }
    ],
    state: "done"
  }
};

// Reduced grid size for faster execution and clearer visuals
const GRID_ROWS = 10;
const GRID_COLS = 15;
let grid = [];
const startNode = { r: 4, c: 2 };
const targetNode = { r: 4, c: 12 };

// Execution State
let isExecuting = false;
let isPaused = false;
let isStopped = false;
let isStepMode = false;
let resumeFunc = null;

// UI Elements
let btnPlayPause, btnStep, btnStop;

document.addEventListener('DOMContentLoaded', () => {
  btnPlayPause = document.getElementById('btnPlayPause');
  btnStep = document.getElementById('btnStep');
  btnStop = document.getElementById('btnStop');

  btnPlayPause.addEventListener('click', togglePause);
  btnStep.addEventListener('click', stepForward);
  btnStop.addEventListener('click', stopExecution);

  initGrid();
  renderNode('start');
});

function initGrid() {
  const container = document.getElementById('gridContainer');
  container.style.gridTemplateColumns = `repeat(${GRID_COLS}, 30px)`;
  container.style.gridTemplateRows = `repeat(${GRID_ROWS}, 30px)`;
  container.innerHTML = '';
  grid = [];

  for (let r = 0; r < GRID_ROWS; r++) {
    let row = [];
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.id = `cell-${r}-${c}`;
      
      let isWall = false;
      // Fixed maze pattern
      if ((c === 5 && r < 7) || (c === 9 && r > 2)) {
        if ((r !== startNode.r || c !== startNode.c) && (r !== targetNode.r || c !== targetNode.c)) {
          isWall = true;
          cell.classList.add('wall');
        }
      }

      if (r === startNode.r && c === startNode.c) cell.classList.add('start');
      if (r === targetNode.r && c === targetNode.c) cell.classList.add('target');

      container.appendChild(cell);
      row.push({ r, c, isWall, visited: false, previousNode: null });
    }
    grid.push(row);
  }
}

function resetGridState() {
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      grid[r][c].visited = false;
      grid[r][c].previousNode = null;
      const cell = document.getElementById(`cell-${r}-${c}`);
      cell.classList.remove('visited', 'path', 'current');
    }
  }
  document.getElementById('memoryContainer').innerHTML = '<div class="memory-empty">Awaiting Execution</div>';
  document.getElementById('terminalLog').innerHTML = '';
  updateCurrentOp('Awaiting algorithm selection...');
}

function renderNode(nodeId) {
  const node = storyData[nodeId];
  if (!node) return;

  document.getElementById('scenarioBadge').textContent = node.title;
  document.getElementById('narrativeContent').innerHTML = node.text;

  const metricsPanel = document.getElementById('metricsPanel');
  if (node.state === 'start') {
    metricsPanel.classList.add('hidden');
  } else {
    metricsPanel.classList.remove('hidden');
    document.getElementById('metricTime').textContent = node.metrics.time;
    document.getElementById('metricSpace').textContent = node.metrics.space;
    document.getElementById('metricNodes').textContent = node.metrics.visited;
  }

  const choicesContainer = document.getElementById('choicesContainer');
  choicesContainer.innerHTML = '';
  
  node.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = `
      <div><span class="choice-algo-badge">${choice.algo}</span> ${choice.text}</div>
      <i class="fas fa-play"></i>
    `;
    btn.addEventListener('click', () => handleChoice(choice.id));
    choicesContainer.appendChild(btn);
  });
}

function handleChoice(actionId) {
  if (isExecuting) return;

  if (actionId === 'reset') {
    initGrid();
    renderNode('start');
    return;
  }

  isExecuting = true;
  isPaused = false;
  isStopped = false;
  isStepMode = false;
  resetGridState();
  
  // Enable controls
  btnPlayPause.disabled = false;
  btnPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
  btnStep.disabled = false;
  btnStop.disabled = false;

  const choicesContainer = document.getElementById('choicesContainer');
  choicesContainer.innerHTML = '<div style="color:#64748b; font-style:italic; font-size:0.85rem;">System locked during execution...</div>';
  
  const statusIndicator = document.getElementById('arenaStatus');
  statusIndicator.classList.add('active');
  document.getElementById('statusSpinner').classList.remove('hidden');
  document.getElementById('statusText').textContent = `Executing ${actionId.toUpperCase()}...`;

  if (actionId === 'bfs') {
    document.getElementById('memoryType').textContent = 'QUEUE (FIFO)';
    executeBFS();
  } else if (actionId === 'dfs') {
    document.getElementById('memoryType').textContent = 'STACK (LIFO)';
    executeDFS();
  }
}

// Control Functions
function togglePause() {
  if (isStopped || !isExecuting) return;
  isPaused = !isPaused;
  btnPlayPause.innerHTML = isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
  if (!isPaused && resumeFunc) {
    let fn = resumeFunc;
    resumeFunc = null;
    fn();
  }
}

function stepForward() {
  if (isStopped || !isExecuting) return;
  if (!isPaused) {
    togglePause(); // pause it first
  }
  isStepMode = true;
  if (resumeFunc) {
    let fn = resumeFunc;
    resumeFunc = null;
    fn();
  }
}

function stopExecution() {
  if (!isExecuting) return;
  isStopped = true;
  isPaused = false;
  if (resumeFunc) {
    let fn = resumeFunc;
    resumeFunc = null;
    fn();
  }
  finishExecution('start', 0, true);
}

async function checkPause() {
  if (isStopped) throw new Error('STOPPED');
  if (isStepMode) {
    isStepMode = false;
    isPaused = true;
  }
  while (isPaused) {
    await new Promise(r => { resumeFunc = r; setTimeout(r, 50); });
    if (isStopped) throw new Error('STOPPED');
  }
}

function getDelay() {
  const speed = parseInt(document.getElementById('speedSlider').value);
  return 300 - (speed * 2.8); 
}

async function sleep(ms) {
  if (ms <= 0) return;
  await new Promise(r => setTimeout(r, ms));
}

function updateCurrentOp(msg) {
  document.getElementById('currentOpBox').textContent = msg;
}

function logToTerminal(msg, type = '') {
  const term = document.getElementById('terminalLog');
  const line = document.createElement('div');
  line.className = `log-line ${type}`;
  line.textContent = `> ${msg}`;
  term.appendChild(line);
  
  // Keep log size small (max 15 lines)
  while (term.children.length > 15) {
    term.removeChild(term.firstChild);
  }
  
  term.scrollTop = term.scrollHeight;
}

function updateMemoryUI(items) {
  const container = document.getElementById('memoryContainer');
  container.innerHTML = '';
  if (items.length === 0) {
    container.innerHTML = '<div class="memory-empty">Empty</div>';
    return;
  }
  [...items].reverse().forEach(item => {
    const div = document.createElement('div');
    div.className = 'memory-item';
    div.textContent = `Node[${item.r}, ${item.c}]`;
    container.appendChild(div);
  });
}

async function executeBFS() {
  try {
    let queue = [grid[startNode.r][startNode.c]];
    grid[startNode.r][startNode.c].visited = true;
    let visitedCount = 0;
    let found = false;
    let targetRef = null;

    updateCurrentOp('Initializing BFS: Adding Start Node to Queue.');
    logToTerminal('Initializing BFS Queue', 'info');
    updateMemoryUI(queue);
    await checkPause();
    await sleep(getDelay());

    while (queue.length > 0) {
      await checkPause();
      let curr = queue.shift();
      updateMemoryUI(queue);
      
      const currCell = document.getElementById(`cell-${curr.r}-${curr.c}`);
      currCell.classList.add('current');
      
      updateCurrentOp(`Dequeueing Node[${curr.r}, ${curr.c}] and examining.`);
      logToTerminal(`Dequeueing Node[${curr.r}, ${curr.c}]`);

      if (curr.r === targetNode.r && curr.c === targetNode.c) {
        updateCurrentOp('Target Found! BFS terminating.');
        logToTerminal('Target found!', 'success');
        found = true;
        targetRef = curr;
        currCell.classList.remove('current');
        break;
      }

      if (curr.r !== startNode.r || curr.c !== startNode.c) {
        currCell.classList.add('visited');
        visitedCount++;
      }

      await checkPause();
      await sleep(getDelay());

      updateCurrentOp(`Checking valid neighbors for Node[${curr.r}, ${curr.c}].`);
      let neighbors = getNeighbors(curr);
      for (let neighbor of neighbors) {
        if (!neighbor.visited && !neighbor.isWall) {
          neighbor.visited = true;
          neighbor.previousNode = curr;
          queue.push(neighbor);
          logToTerminal(`Enqueuing valid Node[${neighbor.r}, ${neighbor.c}]`);
        }
      }
      
      updateMemoryUI(queue);
      currCell.classList.remove('current');
      await checkPause();
      await sleep(getDelay());
    }

    if (found) await drawPath(targetRef);
    finishExecution('post_bfs', visitedCount);
  } catch (e) {
    if (e.message !== 'STOPPED') console.error(e);
  }
}

async function executeDFS() {
  try {
    let stack = [grid[startNode.r][startNode.c]];
    let visitedCount = 0;
    let found = false;
    let targetRef = null;

    updateCurrentOp('Initializing DFS: Pushing Start Node to Stack.');
    logToTerminal('Initializing DFS Stack', 'info');
    updateMemoryUI(stack);
    await checkPause();
    await sleep(getDelay());

    while (stack.length > 0) {
      await checkPause();
      let curr = stack.pop();
      updateMemoryUI(stack);
      
      if (curr.visited) continue;
      curr.visited = true;

      const currCell = document.getElementById(`cell-${curr.r}-${curr.c}`);
      currCell.classList.add('current');
      
      updateCurrentOp(`Popping Node[${curr.r}, ${curr.c}] from top of Stack.`);
      logToTerminal(`Popping Node[${curr.r}, ${curr.c}]`);

      if (curr.r === targetNode.r && curr.c === targetNode.c) {
        updateCurrentOp('Target Found! DFS terminating.');
        logToTerminal('Target found!', 'success');
        found = true;
        targetRef = curr;
        currCell.classList.remove('current');
        break;
      }

      if (curr.r !== startNode.r || curr.c !== startNode.c) {
        currCell.classList.add('visited');
        visitedCount++;
      }

      await checkPause();
      await sleep(getDelay());

      updateCurrentOp(`Pushing neighbors of Node[${curr.r}, ${curr.c}] to Stack.`);
      let neighbors = getNeighbors(curr).reverse(); 
      for (let neighbor of neighbors) {
        if (!neighbor.visited && !neighbor.isWall) {
          // Note: In DFS, we don't mark nodes visited until they are popped.
          // This allows duplicate pushes with different parents, causing
          // previousNode overwrites. This "chaotic" pathfinding is intentional
          // for educational contrast with BFS.
          neighbor.previousNode = curr;
          stack.push(neighbor);
          logToTerminal(`Pushing valid Node[${neighbor.r}, ${neighbor.c}]`);
        }
      }
      
      updateMemoryUI(stack);
      currCell.classList.remove('current');
      await checkPause();
      await sleep(getDelay());
    }

    if (found) await drawPath(targetRef);
    finishExecution('post_dfs', visitedCount);
  } catch (e) {
    if (e.message !== 'STOPPED') console.error(e);
  }
}

function getNeighbors(node) {
  let neighbors = [];
  let { r, c } = node;
  if (r > 0) neighbors.push(grid[r - 1][c]); // Up
  if (c < GRID_COLS - 1) neighbors.push(grid[r][c + 1]); // Right
  if (r < GRID_ROWS - 1) neighbors.push(grid[r + 1][c]); // Down
  if (c > 0) neighbors.push(grid[r][c - 1]); // Left
  return neighbors;
}

async function drawPath(targetRef) {
  updateCurrentOp('Reconstructing optimal path by tracing previous nodes...');
  logToTerminal('Reconstructing optimal path...', 'info');
  let path = [];
  let curr = targetRef;
  while (curr !== null) {
    path.unshift(curr);
    curr = curr.previousNode;
  }

  for (let i = 0; i < path.length; i++) {
    await checkPause();
    let node = path[i];
    if ((node.r === startNode.r && node.c === startNode.c) || 
        (node.r === targetNode.r && node.c === targetNode.c)) continue;
    document.getElementById(`cell-${node.r}-${node.c}`).classList.add('path');
    await sleep(30);
  }
}

function finishExecution(nextNodeId, nodesVisited, wasStopped = false) {
  isExecuting = false;
  btnPlayPause.disabled = true;
  btnStep.disabled = true;
  btnStop.disabled = true;

  const statusIndicator = document.getElementById('arenaStatus');
  statusIndicator.classList.remove('active');
  document.getElementById('statusSpinner').classList.add('hidden');
  
  if (wasStopped) {
    document.getElementById('statusText').textContent = `Execution Stopped`;
    updateCurrentOp('Execution was stopped by the user.');
    renderNode('start');
  } else {
    document.getElementById('statusText').textContent = `Execution Complete`;
    updateCurrentOp('Execution finished successfully.');
    storyData[nextNodeId].metrics.visited = nodesVisited.toString();
    renderNode(nextNodeId);
  }
}

// Placeholder for navbar injection
fetch('../../../partials/navbar.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('navbar-placeholder').innerHTML = data;
  })
  .catch(error => console.error('Error loading navbar:', error));
