/* Hero Typing Animation */
document.addEventListener("DOMContentLoaded", () => {
    initHeroTyping();
});

function initHeroTyping() {
    const el = document.getElementById("typingTextVisualizer");
    if (!el) return;

    const words = [
        "Build, Modify, and Animate Trees",
        "Visualize DFS Traversals",
        "Explore Level-Order BFS",
        "Master Binary Search Trees"
    ];

    let wordIdx = 0;
    let charIdx = 0;
    let isDeleting = false;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
        el.textContent = words[0];
        return;
    }

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
            speed = 2000; // Pause at end of word
            isDeleting = true;
        } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            wordIdx = (wordIdx + 1) % words.length;
            speed = 500; // Pause before typing next word
        }

        requestAnimationFrame(() => setTimeout(tick, speed));
    }

    tick();
}


class TreeNode {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
        this.x = 0;
        this.y = 0;
    }
}

class BinarySearchTree {
    constructor() {
        this.root = null;
    }

    insert(value) {
        const newNode = new TreeNode(value);
        if (!this.root) {
            this.root = newNode;
            return true;
        }
        let current = this.root;
        while (true) {
            if (value === current.value) return false; // Prevent duplicates
            if (value < current.value) {
                if (!current.left) { current.left = newNode; return true; }
                current = current.left;
            } else {
                if (!current.right) { current.right = newNode; return true; }
                current = current.right;
            }
        }
    }

    // Basic BST deletion
    delete(value) {
        const removeNode = (node, val) => {
            if (!node) return null;
            if (val === node.value) {
                if (!node.left && !node.right) return null;
                if (!node.left) return node.right;
                if (!node.right) return node.left;
                // Node has 2 children: get min value of right subtree
                let temp = node.right;
                while (temp.left) temp = temp.left;
                node.value = temp.value;
                node.right = removeNode(node.right, temp.value);
                return node;
            } else if (val < node.value) {
                node.left = removeNode(node.left, val);
                return node;
            } else {
                node.right = removeNode(node.right, val);
                return node;
            }
        };
        this.root = removeNode(this.root, value);
    }
}

// UI State
const tree = new BinarySearchTree();
const ANIMATION_SPEED = 600;
let isAnimating = false;

// DOM Elements
const canvas = document.getElementById('tree-canvas');
const svg = document.getElementById('edges-svg');
const statusMsg = document.getElementById('status-message');
const outputMsg = document.getElementById('traversal-output');
const inputVal = document.getElementById('node-value');

// Config for Drawing
const NODE_RADIUS = 20;
const LEVEL_HEIGHT = 80;

/* ── Rendering Logic ── */
function updateVisualization() {
    // Clear current DOM
    canvas.querySelectorAll('.tree-node').forEach(n => n.remove());
    svg.innerHTML = '';
    
    if (!tree.root) return;

    // Calculate Coordinates
    const canvasWidth = canvas.clientWidth || 800;
    calculateCoordinates(tree.root, canvasWidth / 2, 50, canvasWidth / 4);
    
    // Draw edges first (so they are under nodes)
    drawEdges(tree.root);
    // Draw nodes
    drawNodes(tree.root);
}

function calculateCoordinates(node, x, y, offset) {
    if (!node) return;
    node.x = x;
    node.y = y;
    // Reduce offset as we go deeper to prevent overlap
    calculateCoordinates(node.left, x - offset, y + LEVEL_HEIGHT, offset / 2);
    calculateCoordinates(node.right, x + offset, y + LEVEL_HEIGHT, offset / 2);
}

function drawEdges(node) {
    if (!node) return;
    if (node.left) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", node.x);
        line.setAttribute("y1", node.y);
        line.setAttribute("x2", node.left.x);
        line.setAttribute("y2", node.left.y);
        line.setAttribute("class", "tree-edge");
        svg.appendChild(line);
        drawEdges(node.left);
    }
    if (node.right) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", node.x);
        line.setAttribute("y1", node.y);
        line.setAttribute("x2", node.right.x);
        line.setAttribute("y2", node.right.y);
        line.setAttribute("class", "tree-edge");
        svg.appendChild(line);
        drawEdges(node.right);
    }
}

function drawNodes(node) {
    if (!node) return;
    const div = document.createElement('div');
    div.className = 'tree-node';
    div.id = `node-${node.value}`;
    div.innerText = node.value;
    div.style.left = `${node.x}px`;
    div.style.top = `${node.y}px`;
    canvas.appendChild(div);

    drawNodes(node.left);
    drawNodes(node.right);
}

/* ── Animation Helpers ── */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function highlightNode(value, statusClass = 'highlight') {
    const el = document.getElementById(`node-${value}`);
    if (el) {
        el.classList.add(statusClass);
        await sleep(ANIMATION_SPEED);
        el.classList.remove(statusClass);
    }
}

/* ── Interaction Listeners ── */
document.getElementById('btn-insert').addEventListener('click', () => {
    if (isAnimating) return;
    const val = parseInt(inputVal.value);
    if (isNaN(val)) return;
    
    if (tree.insert(val)) {
        statusMsg.innerText = `Inserted node ${val}.`;
        updateVisualization();
    } else {
        statusMsg.innerText = `Node ${val} already exists.`;
    }
    inputVal.value = '';
});

document.getElementById('btn-delete').addEventListener('click', () => {
    if (isAnimating) return;
    const val = parseInt(inputVal.value);
    if (isNaN(val)) return;
    
    tree.delete(val);
    statusMsg.innerText = `Attempted to delete node ${val}.`;
    updateVisualization();
    inputVal.value = '';
});

document.getElementById('btn-search').addEventListener('click', async () => {
    if (isAnimating) return;
    const target = parseInt(inputVal.value);
    if (isNaN(target)) return;

    if (isDbgMode) {
        startTreeDebugger('search', target);
        return;
    }

    isAnimating = true;
    let current = tree.root;
    let found = false;

    statusMsg.innerText = `Searching for ${target}...`;

    while (current) {
        await highlightNode(current.value);
        if (current.value === target) {
            found = true;
            break;
        }
        current = target < current.value ? current.left : current.right;
    }

    if (found) {
        statusMsg.innerText = `Found node ${target}!`;
        const el = document.getElementById(`node-${target}`);
        if (el) {
            el.classList.add('found');
            setTimeout(() => el.classList.remove('found'), 2000);
        }
    } else {
        statusMsg.innerText = `Node ${target} not found.`;
    }
    isAnimating = false;
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (isAnimating) return;
    tree.root = null;
    statusMsg.innerText = "Tree reset.";
    outputMsg.innerText = "Output: []";
    updateVisualization();
    if (isDbgMode) {
        dbgPause();
        addDbgStatus("Tree reset. Insert elements to start.");
    }
});

/* ── Traversals ── */
async function animateTraversal(generator, name) {
    if (isAnimating || !tree.root) return;
    isAnimating = true;
    statusMsg.innerText = `Running ${name} Traversal...`;
    outputMsg.innerText = "Output: [";
    const result = [];

    for (let node of generator(tree.root)) {
        await highlightNode(node.value);
        result.push(node.value);
        outputMsg.innerText = `Output: [${result.join(', ')}]`;
    }
    
    statusMsg.innerText = `${name} Traversal complete.`;
    isAnimating = false;
}

function* inorder(node) {
    if (node) {
        yield* inorder(node.left);
        yield node;
        yield* inorder(node.right);
    }
}

function* preorder(node) {
    if (node) {
        yield node;
        yield* preorder(node.left);
        yield* preorder(node.right);
    }
}

function* postorder(node) {
    if (node) {
        yield* postorder(node.left);
        yield* postorder(node.right);
        yield node;
    }
}

function* levelorder(root) {
    if (!root) return;
    const queue = [root];
    while (queue.length > 0) {
        const node = queue.shift();
        yield node;
        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);
    }
}

document.getElementById('btn-inorder').addEventListener('click', () => {
    if (isDbgMode) {
        startTreeDebugger('inorder');
        return;
    }
    animateTraversal(inorder, "In-order");
});

document.getElementById('btn-preorder').addEventListener('click', () => {
    if (isDbgMode) {
        startTreeDebugger('preorder');
        return;
    }
    animateTraversal(preorder, "Pre-order");
});

document.getElementById('btn-postorder').addEventListener('click', () => {
    if (isDbgMode) {
        startTreeDebugger('postorder');
        return;
    }
    animateTraversal(postorder, "Post-order");
});

document.getElementById('btn-levelorder').addEventListener('click', () => {
    if (isDbgMode) {
        startTreeDebugger('levelorder');
        return;
    }
    animateTraversal(levelorder, "Level-order");
});

// Initialize empty canvas
window.addEventListener('resize', updateVisualization);
updateVisualization();

// ==========================================================================
// TREE VISUALIZER STEP DEBUGGER IMPLEMENTATION
// ==========================================================================

let isDbgMode = false;
let dbgTrace = [];
let dbgCurrentStep = -1;
let dbgIsPlaying = false;
let dbgPlayInterval = null;

let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(val) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const freq = 200 + (val % 100) * 6;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch(e) {}
}

const treePseudoCodes = {
  inorder: [
    "inorder(node.left)",
    "visit(node)",
    "inorder(node.right)",
    "return"
  ],
  preorder: [
    "visit(node)",
    "preorder(node.left)",
    "preorder(node.right)",
    "return"
  ],
  postorder: [
    "postorder(node.left)",
    "postorder(node.right)",
    "visit(node)",
    "return"
  ],
  levelorder: [
    "queue.push(root)",
    "while queue is not empty:",
    "  curr = queue.pop()",
    "  visit(curr)",
    "  if curr.left queue.push(curr.left)",
    "  if curr.right queue.push(curr.right)"
  ],
  search: [
    "curr = root",
    "while curr is not null:",
    "  if target == curr.value: return curr",
    "  if target < curr.value: curr = curr.left",
    "  else: curr = curr.right",
    "return null"
  ]
};

document.getElementById("dbgToggle").addEventListener("change", (e) => {
  isDbgMode = e.target.checked;
  const dbgPanel = document.getElementById("debuggerPanel");
  
  canvas.querySelectorAll('.tree-node').forEach(nodeEl => {
    nodeEl.classList.remove('highlight', 'found');
  });
  statusMsg.innerText = "Ready.";
  outputMsg.innerText = "Output: []";

  if (isDbgMode) {
    dbgPanel.style.display = "block";
    addDbgStatus("Debugger mode enabled. Select a traversal or search below to begin.");
  } else {
    dbgPanel.style.display = "none";
    dbgPause();
  }
});

function addDbgStatus(text) {
  const expEl = document.getElementById("dbgExplanationText");
  if (expEl) expEl.textContent = text;
}

function startTreeDebugger(type, target) {
  dbgPause();
  drawTreePseudoCode(type);

  if (!tree.root) {
    addDbgStatus("Tree is empty. Insert nodes first!");
    return;
  }

  if (type === 'search') {
    dbgTrace = generateSearchTrace(target);
  } else if (type === 'inorder') {
    dbgTrace = generateInorderTrace();
  } else if (type === 'preorder') {
    dbgTrace = generatePreorderTrace();
  } else if (type === 'postorder') {
    dbgTrace = generatePostorderTrace();
  } else if (type === 'levelorder') {
    dbgTrace = generateLevelorderTrace();
  }

  dbgCurrentStep = 0;
  
  const slider = document.getElementById("dbgStepSlider");
  if (slider) {
    slider.min = 0;
    slider.max = dbgTrace.length - 1;
    slider.value = 0;
  }

  renderTreeDbgStep(dbgCurrentStep);
}

function drawTreePseudoCode(type) {
  const container = document.getElementById("dbgPseudoCode");
  if (!container) return;
  container.innerHTML = "";
  const codeLines = treePseudoCodes[type] || [];
  codeLines.forEach((line, idx) => {
    const div = document.createElement("div");
    div.className = "pseudo-code-line";
    div.textContent = `${idx + 1}: ${line}`;
    container.appendChild(div);
  });
}

function generateSearchTrace(target) {
  const trace = [];
  let current = tree.root;
  let found = false;

  trace.push({
    activeNode: null,
    visited: [],
    explanation: `Start searching for node ${target} from the root.`,
    pseudoCodeLine: 0,
    found: false
  });

  while (current) {
    const currVal = current.value;
    const visitedList = [...trace[trace.length - 1]?.visited || [], currVal];
    
    trace.push({
      activeNode: currVal,
      visited: visitedList,
      explanation: `Currently examining node ${currVal}.`,
      pseudoCodeLine: 1,
      found: false
    });

    if (currVal === target) {
      found = true;
      trace.push({
        activeNode: currVal,
        visited: visitedList,
        explanation: `Target node ${target} found!`,
        pseudoCodeLine: 2,
        found: true
      });
      break;
    }

    if (target < currVal) {
      current = current.left;
      trace.push({
        activeNode: currVal,
        visited: visitedList,
        explanation: `Since ${target} < ${currVal}, move to the left child node.`,
        pseudoCodeLine: 3,
        found: false
      });
    } else {
      current = current.right;
      trace.push({
        activeNode: currVal,
        visited: visitedList,
        explanation: `Since ${target} > ${currVal}, move to the right child node.`,
        pseudoCodeLine: 4,
        found: false
      });
    }
  }

  if (!found) {
    trace.push({
      activeNode: null,
      visited: trace[trace.length - 1]?.visited || [],
      explanation: `Target node ${target} not found in the BST.`,
      pseudoCodeLine: 5,
      found: false
    });
  }

  return trace;
}

function generateInorderTrace() {
  const trace = [];
  const visited = [];
  const output = [];

  function traverse(node) {
    if (!node) return;
    
    trace.push({
      activeNode: node.value,
      visited: [...visited],
      output: [...output],
      explanation: `Traverse left subtree of Node ${node.value}.`,
      pseudoCodeLine: 0
    });
    traverse(node.left);

    visited.push(node.value);
    output.push(node.value);
    trace.push({
      activeNode: node.value,
      visited: [...visited],
      output: [...output],
      explanation: `Visit Node ${node.value} and append it to output list.`,
      pseudoCodeLine: 1
    });

    trace.push({
      activeNode: node.value,
      visited: [...visited],
      output: [...output],
      explanation: `Traverse right subtree of Node ${node.value}.`,
      pseudoCodeLine: 2
    });
    traverse(node.right);
  }

  traverse(tree.root);
  trace.push({
    activeNode: null,
    visited: [...visited],
    output: [...output],
    explanation: "In-order traversal is complete.",
    pseudoCodeLine: 3
  });
  return trace;
}

function generatePreorderTrace() {
  const trace = [];
  const visited = [];
  const output = [];

  function traverse(node) {
    if (!node) return;

    visited.push(node.value);
    output.push(node.value);
    trace.push({
      activeNode: node.value,
      visited: [...visited],
      output: [...output],
      explanation: `Visit Node ${node.value} and append it to output list.`,
      pseudoCodeLine: 0
    });

    trace.push({
      activeNode: node.value,
      visited: [...visited],
      output: [...output],
      explanation: `Traverse left child of Node ${node.value}.`,
      pseudoCodeLine: 1
    });
    traverse(node.left);

    trace.push({
      activeNode: node.value,
      visited: [...visited],
      output: [...output],
      explanation: `Traverse right child of Node ${node.value}.`,
      pseudoCodeLine: 2
    });
    traverse(node.right);
  }

  traverse(tree.root);
  trace.push({
    activeNode: null,
    visited: [...visited],
    output: [...output],
    explanation: "Pre-order traversal complete.",
    pseudoCodeLine: 3
  });
  return trace;
}

function generatePostorderTrace() {
  const trace = [];
  const visited = [];
  const output = [];

  function traverse(node) {
    if (!node) return;

    trace.push({
      activeNode: node.value,
      visited: [...visited],
      output: [...output],
      explanation: `Traverse left subtree of Node ${node.value}.`,
      pseudoCodeLine: 0
    });
    traverse(node.left);

    trace.push({
      activeNode: node.value,
      visited: [...visited],
      output: [...output],
      explanation: `Traverse right subtree of Node ${node.value}.`,
      pseudoCodeLine: 1
    });
    traverse(node.right);

    visited.push(node.value);
    output.push(node.value);
    trace.push({
      activeNode: node.value,
      visited: [...visited],
      output: [...output],
      explanation: `Visit Node ${node.value} and append to output list.`,
      pseudoCodeLine: 2
    });
  }

  traverse(tree.root);
  trace.push({
    activeNode: null,
    visited: [...visited],
    output: [...output],
    explanation: "Post-order traversal complete.",
    pseudoCodeLine: 3
  });
  return trace;
}

function generateLevelorderTrace() {
  const trace = [];
  const visited = [];
  const output = [];

  if (!tree.root) return trace;
  const queue = [tree.root];

  trace.push({
    activeNode: null,
    visited: [],
    output: [],
    explanation: "Push root node to queue to start level-order BFS.",
    pseudoCodeLine: 0
  });

  while (queue.length > 0) {
    const node = queue.shift();
    visited.push(node.value);
    output.push(node.value);

    trace.push({
      activeNode: node.value,
      visited: [...visited],
      output: [...output],
      explanation: `Pop Node ${node.value} from queue, visit it, and append to output.`,
      pseudoCodeLine: 2
    });

    if (node.left) {
      queue.push(node.left);
      trace.push({
        activeNode: node.value,
        visited: [...visited],
        output: [...output],
        explanation: `Enqueue left child Node ${node.left.value}.`,
        pseudoCodeLine: 4
      });
    }

    if (node.right) {
      queue.push(node.right);
      trace.push({
        activeNode: node.value,
        visited: [...visited],
        output: [...output],
        explanation: `Enqueue right child Node ${node.right.value}.`,
        pseudoCodeLine: 5
      });
    }
  }

  trace.push({
    activeNode: null,
    visited: [...visited],
    output: [...output],
    explanation: "Level-order traversal complete.",
    pseudoCodeLine: 3
  });

  return trace;
}

function renderTreeDbgStep(stepIdx) {
  if (stepIdx < 0 || stepIdx >= dbgTrace.length) return;
  const step = dbgTrace[stepIdx];

  canvas.querySelectorAll('.tree-node').forEach(nodeEl => {
    nodeEl.classList.remove('highlight', 'found');
  });

  if (step.activeNode !== null) {
    const activeEl = document.getElementById(`node-${step.activeNode}`);
    if (activeEl) {
      activeEl.classList.add(step.found ? 'found' : 'highlight');
    }
  }

  statusMsg.innerText = step.explanation;

  if (step.output) {
    outputMsg.innerText = `Output: [${step.output.join(', ')}]`;
  } else if (step.visited) {
    outputMsg.innerText = `Visited: [${step.visited.join(', ')}]`;
  }

  const expEl = document.getElementById("dbgExplanationText");
  if (expEl) expEl.innerHTML = step.explanation;

  const counterEl = document.getElementById("dbgStepCounter");
  if (counterEl) counterEl.textContent = `Step ${stepIdx + 1} / ${dbgTrace.length}`;

  const sliderEl = document.getElementById("dbgStepSlider");
  if (sliderEl) sliderEl.value = stepIdx;

  const prevBtn = document.getElementById("dbgPrevBtn");
  const nextBtn = document.getElementById("dbgNextBtn");
  if (prevBtn) prevBtn.disabled = stepIdx <= 0;
  if (nextBtn) nextBtn.disabled = stepIdx >= dbgTrace.length - 1;

  const lines = document.querySelectorAll(".pseudo-code-line");
  lines.forEach((line, idx) => {
    if (idx === step.pseudoCodeLine) {
      line.classList.add("active");
    } else {
      line.classList.remove("active");
    }
  });

  if (step.activeNode !== null) {
    playTone(step.activeNode);
  }
}

function dbgPlay() {
  if (dbgIsPlaying) return;
  dbgIsPlaying = true;
  document.getElementById("dbgPlayBtn").style.display = "none";
  document.getElementById("dbgPauseBtn").style.display = "inline-block";

  dbgPlayInterval = setInterval(() => {
    if (dbgCurrentStep >= dbgTrace.length - 1) {
      dbgPause();
      return;
    }
    dbgCurrentStep++;
    renderTreeDbgStep(dbgCurrentStep);
  }, ANIMATION_SPEED);
}

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
document.getElementById("dbgPrevBtn").addEventListener("click", () => {
  dbgPause();
  if (dbgCurrentStep > 0) {
    dbgCurrentStep--;
    renderTreeDbgStep(dbgCurrentStep);
  }
});

document.getElementById("dbgNextBtn").addEventListener("click", () => {
  dbgPause();
  if (dbgCurrentStep < dbgTrace.length - 1) {
    dbgCurrentStep++;
    renderTreeDbgStep(dbgCurrentStep);
  }
});

document.getElementById("dbgPlayBtn").addEventListener("click", dbgPlay);
document.getElementById("dbgPauseBtn").addEventListener("click", dbgPause);

document.getElementById("dbgStepSlider").addEventListener("input", (e) => {
  dbgPause();
  dbgCurrentStep = parseInt(e.target.value);
  renderTreeDbgStep(dbgCurrentStep);
});
