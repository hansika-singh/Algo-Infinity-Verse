/* ==========================================================================
   RECURSION TREE VISUALIZER
   Interactive tree of recursive calls with expand/collapse, stack tracking,
   and return value visualization.
   ========================================================================== */

/* ── Helpers ── */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const uid = (() => { let c = 0; return () => `rtv-${++c}`; })();

/* ── DOM refs ── */
const $ = id => document.getElementById(id);
const canvas = $('rtv-canvas');
const svg = $('rtv-svg');
const treeInner = $('rtv-tree-inner');
const placeholder = $('rtv-placeholder');
const stackContainer = $('rtv-stack');
const returnsContainer = $('rtv-returns');
const logContainer = $('rtv-log');
const algoSelect = $('rtv-algo');
const inputVal = $('rtv-input');
const speedRange = $('rtv-speed');
const speedDisplay = $('rtv-speed-display');
const btnPlay = $('rtv-play');
const btnPause = $('rtv-pause');
const btnStep = $('rtv-step');
const btnReset = $('rtv-reset');
const statsTotalCalls = $('rtv-stat-calls');
const statsDepth = $('rtv-stat-depth');
const statsReturns = $('rtv-stat-returns');
const algoInfo = $('rtv-algo-info');
const statusMsg = $('rtv-status');
const legend = $('rtv-legend');

/* ── Node ID tracking ── */
let nodeIdCounter = 0;

/* ══════════════════════════════════════════════════════════════════════════
   RecursionNode
   ══════════════════════════════════════════════════════════════════════════ */
class RecursionNode {
  constructor({ name, args, depth, parentId, computeFn, displayFn, nodeWidth }) {
    this.id = uid();
    this.name = name;
    this.args = args;
    this.depth = depth;
    this.parentId = parentId;
    this.computeFn = computeFn;
    this.displayFn = displayFn || (() => this.argsToString());
    this.nodeWidth = nodeWidth || NODE_W;
    this.children = [];
    this.returnValue = undefined;
    this.state = 'pending';   // pending | computing | computed
    this.isExpanded = true;
    this.childResults = [];
    this.x = 0;
    this.y = 0;
  }

  argsToString() {
    return Object.entries(this.args)
      .map(([k, v]) => Array.isArray(v) ? `[${v.join(',')}]` : String(v))
      .join(', ');
  }

  label() {
    return `${this.name}(${this.argsToString()})`;
  }

  hasChildren() {
    return this.children.length > 0;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   Algorithm Definitions
   Each algorithm provides:
     - name, description, code (for the info panel)
     - defaultInput value
     - inputLabel, inputMin, inputMax
     - buildTree(n) → RecursionNode root
   ══════════════════════════════════════════════════════════════════════════ */
const ALGORITHMS = {

  fibonacci: {
    name: 'Fibonacci',
    description: 'F(n) = F(n-1) + F(n-2), with F(0) = 0, F(1) = 1',
    code: `function fib(n) {
  if (n <= 1) return n;
  return fib(n-1) + fib(n-2);
}`,
    defaultInput: 5,
    inputLabel: 'n (0 – 15)',
    inputMin: 0,
    inputMax: 15,

    buildTree(n, depth = 0, parentId = null) {
      const node = new RecursionNode({
        name: 'fib',
        args: { n },
        depth,
        parentId,
        computeFn: (childVals) => childVals.reduce((a, b) => a + b, 0),
      });
      if (n <= 1) {
        node.returnValue = n;
        return node;
      }
      const left = this.buildTree(n - 1, depth + 1, node.id);
      const right = this.buildTree(n - 2, depth + 1, node.id);
      node.children = [left, right];
      node.returnValue = left.returnValue + right.returnValue;
      return node;
    },
  },

  factorial: {
    name: 'Factorial',
    description: 'n! = n × (n-1)!, with 0! = 1, 1! = 1',
    code: `function fact(n) {
  if (n <= 1) return 1;
  return n * fact(n-1);
}`,
    defaultInput: 5,
    inputLabel: 'n (0 – 12)',
    inputMin: 0,
    inputMax: 12,

    buildTree(n, depth = 0, parentId = null) {
      const node = new RecursionNode({
        name: 'fact',
        args: { n },
        depth,
        parentId,
        computeFn: (childVals) => n * (childVals[0] || 1),
      });
      if (n <= 1) {
        node.returnValue = 1;
        return node;
      }
      const child = this.buildTree(n - 1, depth + 1, node.id);
      node.children = [child];
      node.returnValue = n * child.returnValue;
      return node;
    },
  },

  mergeSort: {
    name: 'Merge Sort',
    description: 'Recursively divide array, sort halves, then merge.',
    code: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}`,
    defaultInput: 8,
    inputLabel: 'Array size (2 – 16)',
    inputMin: 2,
    inputMax: 16,

    buildTree(size, depth = 0, parentId = null) {
      const arr = this._generateArray(size);
      return this._buildFromArray(arr, depth, parentId);
    },

    _generateArray(n) {
      const arr = [];
      for (let i = 0; i < n; i++) {
        arr.push(Math.floor(Math.random() * 90) + 10);
      }
      return arr;
    },

    _buildFromArray(arr, depth = 0, parentId = null) {
      const nodeWidth = Math.max(NODE_W, arr.length * 36 + 80);
      const node = new RecursionNode({
        name: 'mergeSort',
        args: { arr: [...arr] },
        depth,
        parentId,
        nodeWidth,
        computeFn: (childVals) => {
          const left = childVals[0] || [];
          const right = childVals[1] || [];
          return this._merge(left, right);
        },
        displayFn: () => `[${arr.join(',')}]`,
      });
      if (arr.length <= 1) {
        node.returnValue = [...arr];
        return node;
      }
      const mid = Math.floor(arr.length / 2);
      const leftArr = arr.slice(0, mid);
      const rightArr = arr.slice(mid);
      const leftChild = this._buildFromArray(leftArr, depth + 1, node.id);
      const rightChild = this._buildFromArray(rightArr, depth + 1, node.id);
      node.children = [leftChild, rightChild];
      node.returnValue = this._merge(leftChild.returnValue, rightChild.returnValue);
      return node;
    },

    _merge(left, right) {
      const result = [];
      let i = 0, j = 0;
      while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) result.push(left[i++]);
        else result.push(right[j++]);
      }
      return result.concat(left.slice(i)).concat(right.slice(j));
    },
  },

};

/* ══════════════════════════════════════════════════════════════════════════
   Step Generator
   Walks the recursion tree in DFS order and produces atomic animation steps.
   ══════════════════════════════════════════════════════════════════════════ */
function* generateSteps(node) {
  yield { type: 'create', nodeId: node.id };

  yield { type: 'enter', nodeId: node.id };

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    yield* generateSteps(child);
    yield {
      type: 'child-returned',
      nodeId: node.id,
      childIdx: i,
      childReturnValue: child.returnValue,
    };
  }

  if (node.returnValue !== undefined) {
    yield { type: 'return', nodeId: node.id, value: node.returnValue };
  }

  yield { type: 'exit', nodeId: node.id };
}

/* ══════════════════════════════════════════════════════════════════════════
   Tree layout calculator
   Positions nodes using a recursive algorithm.
   ══════════════════════════════════════════════════════════════════════════ */
const NODE_W = 130;
const NODE_H = 60;
const LEVEL_H = 110;
const NODE_GAP = 24;

function layoutTree(root, canvasW) {
  const leafNodes = [];

  function walk(n) {
    if (!n.isExpanded || !n.hasChildren()) {
      leafNodes.push(n);
      return;
    }
    n.children.forEach(walk);
  }
  walk(root);

  const leafCount = leafNodes.length;
  if (leafCount === 0) return { totalPixelW: 0, spacing: 0 };

  // Calculate total width from actual leaf node widths
  const totalLeafW = leafNodes.reduce((sum, leaf) => sum + leaf.nodeWidth, 0);
  const totalGapsW = (leafCount - 1) * NODE_GAP;
  const totalContentW = totalLeafW + totalGapsW;
  const totalW = Math.max(canvasW, totalContentW);

  // Distribute extra space as gaps between leaves (proportional)
  const extraSpace = totalW - totalContentW;
  const extraPerGap = leafCount > 1 ? extraSpace / (leafCount - 1) : 0;

  // Position leaves from left to right
  let cursor = 0;
  leafNodes.forEach((leaf, i) => {
    leaf.x = cursor + leaf.nodeWidth / 2;
    cursor += leaf.nodeWidth + NODE_GAP + extraPerGap;
  });

  // Center single-leaf trees (like factorial's linear chain)
  if (leafCount === 1) {
    leafNodes[0].x = canvasW / 2;
  }

  // Set y positions (respects expansion)
  function setY(n, y) {
    n.y = y;
    if (n.isExpanded && n.hasChildren()) {
      n.children.forEach(c => setY(c, y + LEVEL_H));
    }
  }
  setY(root, 55);

  // Internal nodes center over their descendant leaves
  function positionNode(n) {
    if (!n.isExpanded || !n.hasChildren()) return;
    n.children.forEach(positionNode);

    const xs = [];
    function collectLeafX(node) {
      if (!node.isExpanded || !node.hasChildren()) {
        xs.push(node.x);
        return;
      }
      node.children.forEach(collectLeafX);
    }
    collectLeafX(n);

    n.x = (Math.min(...xs) + Math.max(...xs)) / 2;
  }
  positionNode(root);

  return { totalPixelW: totalW };
}

/* ══════════════════════════════════════════════════════════════════════════
   Renderer
   Manages all visual updates.
   ══════════════════════════════════════════════════════════════════════════ */
const Renderer = {
  nodeEls: new Map(),
  edgeEls: new Map(),

  reset() {
    this.nodeEls.clear();
    this.edgeEls.clear();
    treeInner.innerHTML = '';
    svg.innerHTML = '';
    stackContainer.innerHTML = '';
    returnsContainer.innerHTML = '';
    logContainer.innerHTML = '';
    placeholder.style.display = 'block';
  },

  renderTree(root) {
    placeholder.style.display = 'none';
    const canvasW = Math.max(canvas.clientWidth || 800, 400);
    const layout = layoutTree(root, canvasW);
    const totalPixelW = layout.totalPixelW;

    const visibleNodes = [];
    function collect(n) {
      visibleNodes.push(n);
      if (n.isExpanded) n.children.forEach(collect);
    }
    collect(root);

    const maxNodeDepth = visibleNodes.reduce((m, n) => Math.max(m, n.depth), 0);
    const neededHeight = 55 + (maxNodeDepth + 1) * LEVEL_H + 60;
    const minH = Math.max(480, neededHeight);
    treeInner.style.minHeight = minH + 'px';
    canvas.style.minHeight = minH + 'px';
    svg.style.minHeight = minH + 'px';

    const treeW = Math.max(canvasW, totalPixelW + 20);
    treeInner.style.width = treeW + 'px';

    // ── Draw SVG edges ──
    svg.innerHTML = '';
    svg.style.width = treeW + 'px';
    svg.style.height = minH + 'px';
    visibleNodes.forEach(n => {
      if (!n.parentId) return;
      const parent = visibleNodes.find(v => v.id === n.parentId);
      if (!parent) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', parent.x);
      line.setAttribute('y1', parent.y + NODE_H / 2);
      line.setAttribute('x2', n.x);
      line.setAttribute('y2', n.y - NODE_H / 2);
      line.setAttribute('class', `rtv-edge edge-${n.state}`);
      line.id = `edge-${n.id}`;
      svg.appendChild(line);
      this.edgeEls.set(n.id, line);
    });

    // ── Draw nodes ──
    const existingIds = new Set(visibleNodes.map(n => n.id));
    this.nodeEls.forEach((el, id) => {
      if (!existingIds.has(id)) { el.remove(); this.nodeEls.delete(id); }
    });

    visibleNodes.forEach(n => {
      const existing = this.nodeEls.get(n.id);
      const div = existing || document.createElement('div');
      if (!existing) {
        div.className = 'rtv-node';
        div.addEventListener('click', () => this.toggleNode(n.id));
        this.nodeEls.set(n.id, div);
        treeInner.appendChild(div);
      }
      div.id = `rtv-node-${n.id}`;
      div.style.left = n.x + 'px';
      div.style.top = n.y + 'px';
      div.style.width = n.nodeWidth + 'px';
      div.className = `rtv-node state-${n.state}`;

      let html = `<span class="rtv-fn-name">${n.name}(<span class="rtv-args">${n.displayFn()}</span>)</span>`;
      if (n.returnValue !== undefined && n.state === 'computed') {
        const rv = Array.isArray(n.returnValue)
          ? `[${n.returnValue.join(',')}]`
          : String(n.returnValue);
        html += `<span class="rtv-return-val visible">= ${rv}</span>`;
      } else {
        html += `<span class="rtv-return-val"></span>`;
      }
      if (n.childResults.length > 0 && n.state === 'computing') {
        html += `<span class="rtv-partial-label">${n.childResults.length}/${n.children.length} done</span>`;
      }
      if (n.hasChildren()) {
        html += `<span class="rtv-collapse-btn">${n.isExpanded ? '−' : '+'}</span>`;
      }
      div.innerHTML = html;
    });
  },

  toggleNode(nodeId) {
    const root = window.__rtvRoot;
    if (!root) return;
    function find(n) {
      if (n.id === nodeId) { n.isExpanded = !n.isExpanded; return true; }
      return n.children.some(find);
    }
    find(root);
    this.renderTree(root);
  },

  updateStack(stack) {
    stackContainer.innerHTML = '';
    stack.forEach((frame, idx) => {
      const div = document.createElement('div');
      div.className = 'rtv-stack-frame';
      if (idx === stack.length - 1) div.classList.add('active');
      const rv = frame.returnValue !== undefined
        ? (Array.isArray(frame.returnValue)
          ? `[${frame.returnValue.join(',')}]`
          : String(frame.returnValue))
        : null;
      div.innerHTML = `
        <span class="rtv-stack-idx">#${idx}</span>
        <span>${frame.label()}</span>
        ${rv !== null ? `<span class="rtv-stack-ret">→ ${rv}</span>` : ''}
      `;
      stackContainer.appendChild(div);
    });
  },

  addReturn(node) {
      const rv = Array.isArray(node.returnValue)
        ? `[${node.returnValue.join(',')}]`
      : String(node.returnValue);
    const div = document.createElement('div');
    div.className = 'rtv-return-item';
    div.innerHTML = `<span class="rtv-ret-fn">${node.name}(…)</span><span class="rtv-ret-arrow">→</span><span class="rtv-ret-value">${rv}</span>`;
    returnsContainer.appendChild(div);
    returnsContainer.scrollTop = returnsContainer.scrollHeight;
  },

  log(msg, type = 'info') {
    const div = document.createElement('div');
    div.className = 'rtv-log-line';
    const cls = type === 'call' ? 'rtv-log-call' : type === 'return' ? 'rtv-log-return' : 'rtv-log-info';
    div.innerHTML = `<span class="rtv-log-time">▸</span><span class="${cls}">${msg}</span>`;
    logContainer.appendChild(div);
    logContainer.scrollTop = logContainer.scrollHeight;
  },

  clearLog() {
    logContainer.innerHTML = '';
  },

  updateStats(totalCalls, maxDepth, returnCount) {
    statsTotalCalls.textContent = totalCalls;
    statsDepth.textContent = maxDepth;
    statsReturns.textContent = returnCount;
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   Animation Engine
   Manages step playback (play / pause / step / reset).
   ══════════════════════════════════════════════════════════════════════════ */
class AnimationEngine {
  constructor() {
    this.steps = [];
    this.currentIdx = -1;
    this.isPlaying = false;
    this.isPaused = false;
    this.isDone = false;
    this.timer = null;
    this.stack = [];
    this.nodeMap = new Map();
    this.returnCount = 0;
    this.root = null;
  }

  load(root) {
    this.root = root;
    this.nodeMap.clear();
    this.stack = [];
    this.returnCount = 0;

    function collect(n) {
      this.nodeMap.set(n.id, n);
      n.children.forEach(c => collect.call(this, c));
    }
    collect.call(this, root);

    this.steps = [...generateSteps(root)];
    this.currentIdx = -1;
    this.isDone = false;
    this.isPlaying = false;
    this.isPaused = false;
  }

  getSpeed() {
    const val = parseInt(speedRange.value);
    return 600 - (val / 100) * 580 + 20; // 20ms (fast) → 600ms (slow)
  }

  async play() {
    if (this.isDone || !this.steps.length) return;
    this.isPlaying = true;
    this.isPaused = false;
    btnPlay.disabled = true;
    btnPause.disabled = false;
    btnStep.disabled = true;

    while (this.currentIdx < this.steps.length - 1 && this.isPlaying && !this.isPaused) {
      this.currentIdx++;
      this.applyStep(this.steps[this.currentIdx]);
      await sleep(this.getSpeed());
    }

    if (this.currentIdx >= this.steps.length - 1) {
      this.isDone = true;
      this.isPlaying = false;
      btnPlay.disabled = true;
      btnPause.disabled = true;
      btnStep.disabled = true;
      statusMsg.textContent = '✓ Recursion complete!';
    } else if (this.isPaused) {
      btnPlay.disabled = false;
      btnPause.disabled = true;
      btnStep.disabled = false;
    }
  }

  pause() {
    this.isPaused = true;
    this.isPlaying = false;
  }

  stepForward() {
    if (this.isDone || this.currentIdx >= this.steps.length - 1) return;
    if (this.currentIdx === -1) {
      Renderer.clearLog();
    }
    this.currentIdx++;
    this.applyStep(this.steps[this.currentIdx]);
    if (this.currentIdx >= this.steps.length - 1) {
      this.isDone = true;
      btnPlay.disabled = true;
      btnPause.disabled = true;
      btnStep.disabled = true;
      statusMsg.textContent = '✓ Recursion complete!';
    }
  }

  reset() {
    this.isPlaying = false;
    this.isPaused = false;
    this.isDone = false;
    this.currentIdx = -1;
    this.stack = [];
    this.nodeMap.clear();
    this.returnCount = 0;
    btnPlay.disabled = false;
    btnPause.disabled = true;
    btnStep.disabled = false;
    Renderer.reset();
    Renderer.clearLog();
    statusMsg.textContent = 'Ready. Press Play or Step to begin.';
  }

  applyStep(step) {
    switch (step.type) {
      case 'create': {
        const node = this.nodeMap.get(step.nodeId);
        if (node) {
          Renderer.log(`Call ${node.label()}`, 'call');
          statusMsg.textContent = `→ ${node.label()}`;
        }
        break;
      }
      case 'enter': {
        const node = this.nodeMap.get(step.nodeId);
        if (node) {
          node.state = 'computing';
          this.stack.push(node);
          Renderer.updateStack(this.stack);
        }
        Renderer.renderTree(this.root);
        break;
      }
      case 'child-returned': {
        const node = this.nodeMap.get(step.nodeId);
        if (node) {
          node.childResults.push(step.childReturnValue);
          if (node.childResults.length === node.children.length) {
            statusMsg.textContent = `All children of ${node.label()} returned`;
          }
        }
        Renderer.renderTree(this.root);
        break;
      }
      case 'return': {
        const node = this.nodeMap.get(step.nodeId);
        if (node) {
          node.returnValue = step.value;
          node.state = 'computed';
          this.returnCount++;
            const rv = Array.isArray(step.value)
              ? `[${step.value.join(',')}]`
            : String(step.value);
          Renderer.log(`${node.label()} → ${rv}`, 'return');
          statusMsg.textContent = `${node.label()} = ${rv}`;
          Renderer.addReturn(node);
          Renderer.updateStats(
            this.steps.filter(s => s.type === 'create').length,
            this.root ? Math.max(...this._collectDepths(this.root)) : 0,
            this.returnCount
          );
        }
        Renderer.renderTree(this.root);
        break;
      }
      case 'exit': {
        const node = this.nodeMap.get(step.nodeId);
        if (node) {
          this.stack = this.stack.filter(n => n.id !== node.id);
          Renderer.updateStack(this.stack);
        }
        Renderer.renderTree(this.root);
        break;
      }
    }
  }

  _collectDepths(node) {
    if (!node.children.length) return [node.depth];
    return node.children.flatMap(c => this._collectDepths(c));
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   Controller
   Wires UI to the engine and manages algorithm selection.
   ══════════════════════════════════════════════════════════════════════════ */
const Controller = {
  engine: new AnimationEngine(),
  currentAlgo: null,

  init() {
    this.populateAlgorithms();
    this.bindControls();
    this.selectAlgorithm(algoSelect.value);
    this.buildTree();
    const initMs = Math.round(this.engine.getSpeed());
    speedDisplay.textContent = `${initMs}ms`;
  },

  populateAlgorithms() {
    algoSelect.innerHTML = '';
    Object.entries(ALGORITHMS).forEach(([key, algo]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = algo.name;
      algoSelect.appendChild(opt);
    });
  },

  bindControls() {
    algoSelect.addEventListener('change', () => {
      this.selectAlgorithm(algoSelect.value);
      this.buildTree();
    });

    inputVal.addEventListener('change', () => this.buildTree());

    speedRange.addEventListener('input', () => {
      const val = parseInt(speedRange.value);
      const ms = Math.round(this.engine.getSpeed());
      speedDisplay.textContent = `${ms}ms`;
    });

    btnPlay.addEventListener('click', () => {
      if (this.engine.isDone || this.engine.currentIdx === -1) {
        this.engine.reset();
        this.buildTreeSilent();
      }
      this.engine.play();
    });

    btnPause.addEventListener('click', () => {
      this.engine.pause();
      btnPlay.disabled = false;
      btnPause.disabled = true;
      btnStep.disabled = false;
    });

    btnStep.addEventListener('click', () => {
      if (this.engine.isDone) return;
      if (this.engine.currentIdx === -1) {
        this.engine.reset();
        this.buildTreeSilent();
      }
      this.engine.stepForward();
    });

    btnReset.addEventListener('click', () => {
      this.engine.reset();
      this.buildTreeSilent();
    });
  },

  selectAlgorithm(key) {
    const algo = ALGORITHMS[key];
    if (!algo) return;
    this.currentAlgo = algo;
    inputVal.min = algo.inputMin;
    inputVal.max = algo.inputMax;
    inputVal.value = algo.defaultInput;
    const labelSpan = document.getElementById('rtv-input-label');
    if (labelSpan) labelSpan.textContent = algo.inputLabel;

    algoInfo.innerHTML = `
      <strong style="color:var(--text-primary);font-size:0.9rem;">${algo.name}</strong>
      <p style="margin:0.25rem 0 0.5rem;font-size:0.8rem;color:var(--text-secondary);">${algo.description}</p>
      <pre style="background:rgba(0,0,0,0.3);padding:0.5rem 0.65rem;border-radius:6px;font-size:0.72rem;line-height:1.5;overflow-x:auto;color:#e6edf3;font-family:'Fira Code',monospace;border:1px solid var(--glass-border);">${algo.code}</pre>
    `;
  },

  buildTree() {
    const algo = this.currentAlgo;
    if (!algo) return;
    this.engine.reset();
    const n = parseInt(inputVal.value);
    if (isNaN(n) || n < algo.inputMin || n > algo.inputMax) {
      statusMsg.textContent = `Enter a value between ${algo.inputMin} and ${algo.inputMax}`;
      return;
    }
    const root = algo.buildTree(n);
    window.__rtvRoot = root;
    this.engine.load(root);
    Renderer.renderTree(root);
    function maxDepth(n) {
      return n.children.reduce((max, c) => Math.max(max, 1 + maxDepth(c)), 1);
    }
    Renderer.updateStats(
      this.engine.steps.filter(s => s.type === 'create').length,
      maxDepth(root),
      0
    );
    statusMsg.textContent = `Built recursion tree for ${algo.name}(${n}). Press Play or Step.`;
  },

  buildTreeSilent() {
    const algo = this.currentAlgo;
    if (!algo) return;
    const n = parseInt(inputVal.value);
    if (isNaN(n) || n < algo.inputMin || n > algo.inputMax) return;
    const root = algo.buildTree(n);
    window.__rtvRoot = root;
    this.engine.load(root);
    Renderer.renderTree(root);
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   Hero Typing Animation
   ══════════════════════════════════════════════════════════════════════════ */
function initHeroTyping() {
  const el = document.getElementById('typingTextRTV');
  if (!el) return;

  const words = [
    "Visualize Recursive Calls Step-by-Step",
    "Track the Call Stack in Real-Time",
    "See Return Values Propagate Up the Tree",
    "Explore Fibonacci, Factorial & Merge Sort"
  ];

  let wordIdx = 0, charIdx = 0, isDeleting = false;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) { el.textContent = words[0]; return; }

  function tick() {
    const current = words[wordIdx];
    el.textContent = isDeleting ? current.substring(0, charIdx - 1) : current.substring(0, charIdx + 1);
    isDeleting ? charIdx-- : charIdx++;
    let speed = isDeleting ? 50 : 100;
    if (!isDeleting && charIdx === current.length) { speed = 2000; isDeleting = true; }
    else if (isDeleting && charIdx === 0) { isDeleting = false; wordIdx = (wordIdx + 1) % words.length; speed = 500; }
    requestAnimationFrame(() => setTimeout(tick, speed));
  }
  tick();
}

/* ── Window resize handler ── */
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (window.__rtvRoot) Renderer.renderTree(window.__rtvRoot);
  }, 250);
});

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  initHeroTyping();
  Controller.init();
});
