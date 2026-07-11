const canvas = document.getElementById('graph-canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');

// UI Elements
const btnAddNode = document.getElementById('btn-add-node');
const btnAddEdge = document.getElementById('btn-add-edge');
const btnClear = document.getElementById('btn-clear');
const btnRandom = document.getElementById('btn-random');
const btnStart = document.getElementById('btn-start');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const statusMessage = document.getElementById('status-message');
const stackDisplay = document.getElementById('stack-display');
const nodeDetailsList = document.getElementById('node-details-list');
const themeToggle = document.getElementById('theme-toggle');

// Graph Data
let nodes = [];
let edges = [];
let nodeCounter = 0;

// Modes: 'idle', 'add_node', 'add_edge'
let currentMode = 'idle';
let selectedNodeForEdge = null;

// Algorithm State
let isRunning = false;
let steps = [];
let currentStep = 0;

// Colors
const colors = {
  defaultNode: '#e5e7eb',
  defaultBorder: '#9ca3af',
  text: '#1f2937',
  edge: '#9ca3af',
  activeNode: '#fef08a', // yellow-200
  activeEdge: '#eab308', // yellow-500
  onStack: '#fca5a5', // red-300
  sccFound: '#86efac', // green-300
};

let isDark = localStorage.getItem('theme') === 'dark';
function updateThemeColors() {
  if (isDark) {
    colors.defaultNode = '#374151';
    colors.defaultBorder = '#4b5563';
    colors.text = '#f9fafb';
    colors.edge = '#6b7280';
  } else {
    colors.defaultNode = '#e5e7eb';
    colors.defaultBorder = '#9ca3af';
    colors.text = '#1f2937';
    colors.edge = '#9ca3af';
  }
}

function resizeCanvas() {
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  draw();
}
window.addEventListener('resize', resizeCanvas);

// UI Event Listeners
btnAddNode.addEventListener('click', () => setMode('add_node'));
btnAddEdge.addEventListener('click', () => setMode('add_edge'));
btnClear.addEventListener('click', clearGraph);
btnRandom.addEventListener('click', generateRandomGraph);
btnStart.addEventListener('click', startAlgorithm);
btnPrev.addEventListener('click', () => {
  if (currentStep > 0) {
    currentStep--;
    renderStep();
  }
});
btnNext.addEventListener('click', () => {
  if (currentStep < steps.length - 1) {
    currentStep++;
    renderStep();
  }
});

themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  document.body.classList.toggle('dark-mode', isDark);
  themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeColors();
  draw();
});

if (isDark) {
  document.body.classList.add('dark-mode');
  themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  updateThemeColors();
}

function setMode(mode) {
  if (isRunning) return;
  currentMode = currentMode === mode ? 'idle' : mode;
  selectedNodeForEdge = null;

  btnAddNode.classList.toggle('ring-2', currentMode === 'add_node');
  btnAddEdge.classList.toggle('ring-2', currentMode === 'add_edge');

  canvas.style.cursor = currentMode !== 'idle' ? 'crosshair' : 'default';
  draw();
}

function clearGraph() {
  nodes = [];
  edges = [];
  nodeCounter = 0;
  resetAlgorithmState();
  draw();
}

function generateRandomGraph() {
  clearGraph();
  const numNodes = 6;
  const padding = 50;
  for (let i = 0; i < numNodes; i++) {
    nodes.push({
      id: i,
      x: padding + Math.random() * (canvas.width - 2 * padding),
      y: padding + Math.random() * (canvas.height - 2 * padding),
      disc: -1,
      low: -1,
      onStack: false,
      sccColor: null,
    });
  }
  nodeCounter = numNodes;

  // Add random edges (guaranteeing at least one SCC)
  edges.push({ from: 0, to: 1 });
  edges.push({ from: 1, to: 2 });
  edges.push({ from: 2, to: 0 });
  edges.push({ from: 2, to: 3 });
  edges.push({ from: 3, to: 4 });
  edges.push({ from: 4, to: 5 });
  edges.push({ from: 5, to: 3 });

  draw();
}

// Canvas Interaction
canvas.addEventListener('mousedown', (e) => {
  if (isRunning) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (currentMode === 'add_node') {
    nodes.push({ id: nodeCounter++, x, y, disc: -1, low: -1, onStack: false, sccColor: null });
    draw();
  } else if (currentMode === 'add_edge') {
    const clickedNode = nodes.find((n) => Math.hypot(n.x - x, n.y - y) < 20);
    if (clickedNode) {
      if (selectedNodeForEdge === null) {
        selectedNodeForEdge = clickedNode;
      } else {
        if (
          selectedNodeForEdge.id !== clickedNode.id &&
          !edges.some((e) => e.from === selectedNodeForEdge.id && e.to === clickedNode.id)
        ) {
          edges.push({ from: selectedNodeForEdge.id, to: clickedNode.id });
        }
        selectedNodeForEdge = null;
      }
      draw();
    } else {
      selectedNodeForEdge = null;
      draw();
    }
  }
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw edges
  edges.forEach((edge) => {
    const fromNode = nodes.find((n) => n.id === edge.from);
    const toNode = nodes.find((n) => n.id === edge.to);

    let strokeColor = colors.edge;
    let lineWidth = 2;

    if (isRunning && steps[currentStep]) {
      const step = steps[currentStep];
      if (
        step.activeEdge &&
        step.activeEdge.from === fromNode.id &&
        step.activeEdge.to === toNode.id
      ) {
        strokeColor = colors.activeEdge;
        lineWidth = 4;
      }
    }

    drawArrow(fromNode.x, fromNode.y, toNode.x, toNode.y, strokeColor, lineWidth);
  });

  // Draw nodes
  nodes.forEach((node) => {
    let bgColor = colors.defaultNode;
    if (isRunning && steps[currentStep]) {
      const step = steps[currentStep];
      const stateNode = step.nodes.find((n) => n.id === node.id);
      if (step.activeNode === node.id) {
        bgColor = colors.activeNode;
      } else if (stateNode.sccColor) {
        bgColor = stateNode.sccColor;
      } else if (stateNode.onStack) {
        bgColor = colors.onStack;
      }
    } else {
      if (node === selectedNodeForEdge) {
        bgColor = colors.activeNode;
      }
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = colors.defaultBorder;
    ctx.stroke();

    ctx.fillStyle = colors.text;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.id, node.x, node.y);

    // Draw disc and low next to node if running
    if (isRunning && steps[currentStep]) {
      const stateNode = steps[currentStep].nodes.find((n) => n.id === node.id);
      if (stateNode.disc !== -1) {
        ctx.font = '10px Arial';
        ctx.fillStyle = colors.text;
        ctx.fillText(`${stateNode.disc} / ${stateNode.low}`, node.x, node.y - 30);
      }
    }
  });
}

function drawArrow(fromx, fromy, tox, toy, color, lineWidth) {
  const headlen = 10;
  const dx = tox - fromx;
  const dy = toy - fromy;
  const angle = Math.atan2(dy, dx);

  // adjust to point to border of node (radius 20)
  tox = tox - 20 * Math.cos(angle);
  toy = toy - 20 * Math.sin(angle);
  fromx = fromx + 20 * Math.cos(angle);
  fromy = fromy + 20 * Math.sin(angle);

  ctx.beginPath();
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(tox, toy);
  ctx.lineTo(
    tox - headlen * Math.cos(angle - Math.PI / 6),
    toy - headlen * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(tox, toy);
  ctx.lineTo(
    tox - headlen * Math.cos(angle + Math.PI / 6),
    toy - headlen * Math.sin(angle + Math.PI / 6)
  );
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function resetAlgorithmState() {
  isRunning = false;
  steps = [];
  currentStep = 0;
  btnStart.innerHTML = '<i class="fas fa-play"></i> Start';
  btnStart.classList.replace('bg-orange-500', 'bg-indigo-600');
  btnStart.classList.replace('hover:bg-orange-600', 'hover:bg-indigo-700');

  btnAddNode.disabled = false;
  btnAddEdge.disabled = false;
  btnClear.disabled = false;
  btnRandom.disabled = false;

  btnPrev.disabled = true;
  btnNext.disabled = true;

  statusMessage.textContent = 'Ready to start. Create a graph or click "Random Graph".';
  statusMessage.className = 'text-sm font-semibold text-indigo-600 mb-4 bg-indigo-100 p-2 rounded';
  stackDisplay.innerHTML = '';
  nodeDetailsList.innerHTML = '';
}

function startAlgorithm() {
  if (nodes.length === 0) return;

  if (isRunning) {
    resetAlgorithmState();
    draw();
    return;
  }

  isRunning = true;
  currentMode = 'idle';
  selectedNodeForEdge = null;

  btnStart.innerHTML = '<i class="fas fa-stop"></i> Stop';
  btnStart.classList.replace('bg-indigo-600', 'bg-orange-500');
  btnStart.classList.replace('hover:bg-indigo-700', 'hover:bg-orange-600');

  btnAddNode.disabled = true;
  btnAddEdge.disabled = true;
  btnClear.disabled = true;
  btnRandom.disabled = true;
  btnPrev.disabled = false;
  btnNext.disabled = false;

  runTarjan();
  currentStep = 0;
  renderStep();
}

function runTarjan() {
  steps = [];
  let time = 0;

  // clone nodes to track state
  let stateNodes = nodes.map((n) => ({ ...n, disc: -1, low: -1, onStack: false, sccColor: null }));
  let stack = [];

  // helper to save state
  const saveState = (msg, activeNode = null, activeEdge = null) => {
    steps.push({
      msg,
      nodes: JSON.parse(JSON.stringify(stateNodes)),
      stack: [...stack],
      activeNode,
      activeEdge,
    });
  };

  const sccColors = ['#86efac', '#93c5fd', '#c4b5fd', '#fca5a5', '#fde047'];
  let sccCount = 0;

  const dfs = (u) => {
    stateNodes[u].disc = time;
    stateNodes[u].low = time;
    time++;
    stack.push(u);
    stateNodes[u].onStack = true;

    saveState(
      `Visiting Node ${u}. disc=${stateNodes[u].disc}, low=${stateNodes[u].low}. Pushed to stack.`,
      u
    );

    const neighbors = edges.filter((e) => e.from === u).map((e) => e.to);

    for (let v of neighbors) {
      saveState(`Checking edge ${u} -> ${v}`, u, { from: u, to: v });

      if (stateNodes[v].disc === -1) {
        saveState(`Node ${v} is unvisited. Recursing into ${v}.`, u, { from: u, to: v });
        dfs(v);
        stateNodes[u].low = Math.min(stateNodes[u].low, stateNodes[v].low);
        saveState(
          `Back from ${v}. Updated low of ${u} to Math.min(low[${u}], low[${v}]) = ${stateNodes[u].low}`,
          u
        );
      } else if (stateNodes[v].onStack) {
        stateNodes[u].low = Math.min(stateNodes[u].low, stateNodes[v].disc);
        saveState(
          `Node ${v} is on stack (back-edge). Updated low of ${u} to ${stateNodes[u].low}`,
          u,
          { from: u, to: v }
        );
      } else {
        saveState(`Node ${v} is already processed (cross-edge). Ignored.`, u, { from: u, to: v });
      }
    }

    if (stateNodes[u].low === stateNodes[u].disc) {
      saveState(
        `low[${u}] == disc[${u}] (${stateNodes[u].low}). Found a Strongly Connected Component!`,
        u
      );
      let color = sccColors[sccCount % sccColors.length];
      sccCount++;
      let w = -1;
      let popped = [];
      while (w !== u) {
        w = stack.pop();
        stateNodes[w].onStack = false;
        stateNodes[w].sccColor = color;
        popped.push(w);
      }
      saveState(`Popped SCC nodes from stack: ${popped.join(', ')}`, u);
    }
  };

  for (let i = 0; i < stateNodes.length; i++) {
    if (stateNodes[i].disc === -1) {
      saveState(`Starting DFS from unvisited node ${i}`, i);
      dfs(i);
    }
  }

  saveState('Algorithm finished. All SCCs found!');
}

function renderStep() {
  if (!isRunning || steps.length === 0) return;

  const step = steps[currentStep];

  statusMessage.textContent = step.msg;

  // Render stack
  stackDisplay.innerHTML =
    step.stack.length === 0
      ? '<span class="text-gray-500 italic">Empty</span>'
      : step.stack.map((n) => `<div class="stack-node">${n}</div>`).join('');

  // Render details
  nodeDetailsList.innerHTML = step.nodes
    .map((n) => {
      const isActive = n.id === step.activeNode;
      const colorClass = isActive
        ? 'bg-indigo-100 text-indigo-800 border-l-4 border-indigo-500'
        : '';
      const disc = n.disc === -1 ? '∞' : n.disc;
      const low = n.low === -1 ? '∞' : n.low;
      const onStack = n.onStack ? 'Yes' : 'No';
      return `<li class="node-item ${colorClass}">
            <span class="font-bold">Node ${n.id}</span>
            <span class="text-xs text-gray-500">d:${disc}, l:${low}, s:${onStack}</span>
        </li>`;
    })
    .join('');

  btnPrev.disabled = currentStep === 0;
  btnNext.disabled = currentStep === steps.length - 1;

  draw();
}

// Initial draw
setTimeout(() => {
  resizeCanvas();
  generateRandomGraph();
}, 100);
