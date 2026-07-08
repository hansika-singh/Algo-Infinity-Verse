/**
 * DP Visualizer Engine
 * Handles State Generation, Playback, and Rendering
 */

class DPVisualizer {
  constructor() {
    this.canvas = document.getElementById('recursionCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.memoTable = document.getElementById('memoTable');
    this.callStackList = document.getElementById('callStackList');
    this.currentStateDisplay = document.getElementById('currentStateDisplay');
    this.sourceCodeDisplay = document.getElementById('sourceCodeDisplay');

    // Controls
    this.problemSelect = document.getElementById('problemSelect');
    this.dpInput = document.getElementById('dpInput');
    this.inputContainer = document.getElementById('inputContainer');
    this.knapsackInputs = document.getElementById('knapsackInputs');
    this.ksWeights = document.getElementById('ksWeights');
    this.ksValues = document.getElementById('ksValues');
    this.ksCapacity = document.getElementById('ksCapacity');
    this.ksMode = document.getElementById('ksMode');

    this.btnGenerate = document.getElementById('btnGenerate');
    this.btnPlayPause = document.getElementById('btnPlayPause');
    this.btnStepFwd = document.getElementById('btnStepFwd');
    this.btnStepBack = document.getElementById('btnStepBack');
    this.btnReset = document.getElementById('btnReset');
    this.timelineSlider = document.getElementById('timelineSlider');
    this.timelineProgress = document.getElementById('timelineProgress');
    this.speedSlider = document.getElementById('speedSlider');

    // State
    this.steps = [];
    this.currentStepIndex = 0;
    this.isPlaying = false;
    this.playInterval = null;
    this.treeNodes = [];
    this.memoData = {}; // Stores computed values for display
    this.nodeRadius = 25;
    this.nodeSpacingX = 60;
    this.nodeSpacingY = 80;

    this.setupEventListeners();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Initialize default
    this.updateContext();
  }

  setupEventListeners() {
    this.btnGenerate.addEventListener('click', () => this.generate());

    this.problemSelect.addEventListener('change', () => {
      this.updateContext();
    });

    this.btnPlayPause.addEventListener('click', () => this.togglePlay());
    this.btnStepFwd.addEventListener('click', () => this.stepForward());
    this.btnStepBack.addEventListener('click', () => this.stepBackward());
    this.btnReset.addEventListener('click', () => this.resetPlayback());

    this.timelineSlider.addEventListener('input', (e) => {
      this.jumpToStep(parseInt(e.target.value));
    });

    this.speedSlider.addEventListener('input', () => {
      if (this.isPlaying) {
        this.pause();
        this.play();
      }
    });
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    // Make canvas large enough to hold typical trees, or resize based on tree width later
    this.canvas.width = Math.max(container.clientWidth, 1200);
    this.canvas.height = Math.max(container.clientHeight, 800);
    this.render();
  }

  updateContext() {
    const problem = this.problemSelect.value;
    if (problem === 'fibonacci') {
      this.inputContainer.style.display = 'flex';
      this.knapsackInputs.style.display = 'none';
      this.dpInput.value = 5;
      this.dpInput.max = 10;
      this.sourceCodeDisplay.textContent = `function fib(n, memo = {}) {
  if (n <= 1) return n;
  if (n in memo) return memo[n];
  
  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
  return memo[n];
}`;
    } else if (problem === 'knapsack') {
      this.inputContainer.style.display = 'none';
      this.knapsackInputs.style.display = 'flex';

      this.sourceCodeDisplay.textContent = `// Top-Down (Memoization)
function knapsack(W, wt, val, n, memo) {
  if (n === 0 || W === 0) return 0;
  if (memo[n][W] !== -1) return memo[n][W];
  
  if (wt[n-1] > W) {
    return memo[n][W] = knapsack(W, wt, val, n - 1, memo);
  } else {
    return memo[n][W] = Math.max(
      val[n-1] + knapsack(W - wt[n-1], wt, val, n - 1, memo),
      knapsack(W, wt, val, n - 1, memo)
    );
  }
}

// Bottom-Up (Tabulation)
function knapsackBottomUp(W, wt, val, n) {
  let dp = Array(n + 1).fill().map(() => Array(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let w = 1; w <= W; w++) {
      if (wt[i-1] <= w) {
        dp[i][w] = Math.max(val[i-1] + dp[i-1][w-wt[i-1]], dp[i-1][w]);
      } else {
        dp[i][w] = dp[i-1][w];
      }
    }
  }
  return dp[n][W];
}`;
    } else {
      this.inputContainer.style.display = 'flex';
      this.knapsackInputs.style.display = 'none';
      this.sourceCodeDisplay.textContent = `// Code for ${problem} coming soon...`;
    }
  }

  generate() {
    this.pause();
    const problem = this.problemSelect.value;

    this.steps = [];
    this.treeNodes = [];
    this.memoData = {};

    if (problem === 'fibonacci') {
      const n = parseInt(this.dpInput.value);
      this.generateFibonacci(n);
      this.layoutTree();
      this.initMemoTable(problem, n, null);
    } else if (problem === 'knapsack') {
      const wt = this.ksWeights.value.split(',').map((x) => parseInt(x.trim()));
      const val = this.ksValues.value.split(',').map((x) => parseInt(x.trim()));
      const W = parseInt(this.ksCapacity.value);
      const n = Math.min(wt.length, val.length); // Prevent mismatch errors
      const mode = this.ksMode.value;

      if (mode === 'bottomup') {
        this.generateKnapsackBottomUp(W, wt.slice(0, n), val.slice(0, n), n);
        // Tree is empty for bottom-up
      } else {
        this.generateKnapsackTopDown(W, wt.slice(0, n), val.slice(0, n), n);
        this.layoutTree();
      }
      this.initMemoTable(problem, n, W);
    }

    this.timelineSlider.max = Math.max(0, this.steps.length - 1);
    this.resetPlayback();
  }

  // --- State Generators ---

  generateFibonacci(n) {
    let idCounter = 0;
    const memo = {};
    const callStack = [];

    const recurse = (currentN, parentId) => {
      const nodeId = idCounter++;
      const node = {
        id: nodeId,
        label: `fib(${currentN})`,
        parent: parentId,
        children: [],
        n: currentN,
      };
      this.treeNodes.push(node);

      if (parentId !== null) {
        this.treeNodes[parentId].children.push(nodeId);
      }

      callStack.push(`fib(${currentN})`);

      // Step: Calling function
      this.steps.push({
        type: 'CALL',
        nodeId,
        callStack: [...callStack],
        stateStr: `fib(${currentN})`,
        memo: JSON.parse(JSON.stringify(memo)),
      });

      let res;
      if (currentN <= 1) {
        res = currentN;
        this.steps.push({
          type: 'BASE_CASE',
          nodeId,
          callStack: [...callStack],
          stateStr: `fib(${currentN}) = ${res}`,
          memo: JSON.parse(JSON.stringify(memo)),
        });
      } else if (currentN in memo) {
        res = memo[currentN];
        this.steps.push({
          type: 'MEMO_HIT',
          nodeId,
          callStack: [...callStack],
          stateStr: `Memo Hit: fib(${currentN}) = ${res}`,
          memo: JSON.parse(JSON.stringify(memo)),
        });
      } else {
        const left = recurse(currentN - 1, nodeId);
        const right = recurse(currentN - 2, nodeId);
        res = left + right;
        memo[currentN] = res;

        this.steps.push({
          type: 'CALCULATED',
          nodeId,
          callStack: [...callStack],
          stateStr: `Calculated: fib(${currentN}) = ${res}`,
          memo: JSON.parse(JSON.stringify(memo)),
          updatedMemoKey: currentN,
        });
      }

      callStack.pop();

      this.steps.push({
        type: 'RETURN',
        nodeId,
        callStack: [...callStack],
        stateStr: `Return ${res}`,
        memo: JSON.parse(JSON.stringify(memo)),
      });

      return res;
    };

    recurse(n, null);
  }

  generateKnapsackTopDown(W, wt, val, n) {
    let idCounter = 0;
    const memo = Array.from({ length: n + 1 }, () => Array(W + 1).fill(-1));
    const callStack = [];

    const recurse = (remW, currN, parentId) => {
      const nodeId = idCounter++;
      const node = {
        id: nodeId,
        label: `KS(${currN},${remW})`,
        parent: parentId,
        children: [],
        n: currN,
        w: remW,
      };
      this.treeNodes.push(node);

      if (parentId !== null) {
        this.treeNodes[parentId].children.push(nodeId);
      }

      callStack.push(`KS(${currN},${remW})`);

      this.steps.push({
        type: 'CALL',
        nodeId,
        callStack: [...callStack],
        stateStr: `KS(${currN}, ${remW})`,
        memo: JSON.parse(JSON.stringify(memo)),
      });

      let res;
      if (currN === 0 || remW === 0) {
        res = 0;
        this.steps.push({
          type: 'BASE_CASE',
          nodeId,
          callStack: [...callStack],
          stateStr: `KS(${currN},${remW}) = 0`,
          memo: JSON.parse(JSON.stringify(memo)),
        });
      } else if (memo[currN][remW] !== -1) {
        res = memo[currN][remW];
        this.steps.push({
          type: 'MEMO_HIT',
          nodeId,
          callStack: [...callStack],
          stateStr: `Memo Hit: ${res}`,
          memo: JSON.parse(JSON.stringify(memo)),
        });
      } else if (wt[currN - 1] > remW) {
        res = recurse(remW, currN - 1, nodeId);
        memo[currN][remW] = res;
        this.steps.push({
          type: 'CALCULATED',
          nodeId,
          callStack: [...callStack],
          stateStr: `Calculated: ${res}`,
          memo: JSON.parse(JSON.stringify(memo)),
          updatedMemoKey: `${currN},${remW}`,
        });
      } else {
        const excl = recurse(remW, currN - 1, nodeId);
        const incl = val[currN - 1] + recurse(remW - wt[currN - 1], currN - 1, nodeId);
        res = Math.max(incl, excl);
        memo[currN][remW] = res;
        this.steps.push({
          type: 'CALCULATED',
          nodeId,
          callStack: [...callStack],
          stateStr: `Calculated: ${res}`,
          memo: JSON.parse(JSON.stringify(memo)),
          updatedMemoKey: `${currN},${remW}`,
        });
      }

      callStack.pop();
      this.steps.push({
        type: 'RETURN',
        nodeId,
        callStack: [...callStack],
        stateStr: `Return ${res}`,
        memo: JSON.parse(JSON.stringify(memo)),
      });

      return res;
    };

    recurse(W, n, null);
  }

  generateKnapsackBottomUp(W, wt, val, n) {
    const dp = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));

    this.steps.push({
      type: 'INIT',
      callStack: ['Tabulation Mode'],
      stateStr: 'Initialize DP table with 0s',
      memo: JSON.parse(JSON.stringify(dp)),
    });

    for (let i = 1; i <= n; i++) {
      for (let w = 1; w <= W; w++) {
        let excludeVal = dp[i - 1][w];
        let includeVal = 0;
        let usedWeight = wt[i - 1];
        let usedValue = val[i - 1];
        let isIncluded = false;

        let stateStr = '';
        let includeCell = null;

        if (usedWeight <= w) {
          includeVal = usedValue + dp[i - 1][w - usedWeight];
          includeCell = { r: i - 1, c: w - usedWeight };
          isIncluded = includeVal > excludeVal;
          dp[i][w] = Math.max(includeVal, excludeVal);
          stateStr = `dp[${i}][${w}] = Math.max(${includeVal} (Include), ${excludeVal} (Exclude)) = ${dp[i][w]}`;
        } else {
          dp[i][w] = excludeVal;
          stateStr = `Weight ${usedWeight} > ${w}. Exclude item: dp[${i}][${w}] = ${dp[i][w]}`;
        }

        this.steps.push({
          type: 'CELL_COMPUTE',
          callStack: [`Evaluating Item ${i}, W ${w}`],
          stateStr: stateStr,
          memo: JSON.parse(JSON.stringify(dp)),
          updatedMemoKey: `${i},${w}`,
          currentCell: { r: i, c: w },
          excludeCell: { r: i - 1, c: w },
          includeCell: includeCell,
          choseInclude: isIncluded,
        });
      }
    }

    // Backtracking to find path
    let res = dp[n][W];
    let currW = W;
    let backtrackPath = [{ r: n, c: W }];

    for (let i = n; i > 0; i--) {
      if (res === dp[i - 1][currW]) {
        // Excluded
        backtrackPath.push({ r: i - 1, c: currW });
      } else {
        // Included
        currW -= wt[i - 1];
        res -= val[i - 1];
        backtrackPath.push({ r: i - 1, c: currW });
      }
    }

    this.steps.push({
      type: 'BACKTRACK',
      callStack: ['Backtracking Path'],
      stateStr: `Optimal value: ${dp[n][W]}. Highlighted path shows selected items.`,
      memo: JSON.parse(JSON.stringify(dp)),
      backtrackPath: backtrackPath,
    });
  }

  // --- Tree Layout (Reingold-Tilford Simplified) ---

  layoutTree() {
    if (this.treeNodes.length === 0) return;

    // Very basic layout: assign depth (y) and index in depth (x)
    const levels = {};
    const assignDepth = (nodeId, depth) => {
      const node = this.treeNodes[nodeId];
      node.depth = depth;
      if (!levels[depth]) levels[depth] = [];
      levels[depth].push(nodeId);
      for (const childId of node.children) {
        assignDepth(childId, depth + 1);
      }
    };

    assignDepth(0, 0);

    // Calculate X based on level spacing
    let maxWidth = 0;
    for (const depth in levels) {
      const nodesAtDepth = levels[depth];
      const levelWidth = nodesAtDepth.length * this.nodeSpacingX * 2;
      maxWidth = Math.max(maxWidth, levelWidth);

      const startX = this.canvas.width / 2 - levelWidth / 2 + this.nodeSpacingX;
      nodesAtDepth.forEach((nodeId, idx) => {
        this.treeNodes[nodeId].x = startX + idx * this.nodeSpacingX * 2;
        this.treeNodes[nodeId].y = 50 + parseInt(depth) * this.nodeSpacingY;
      });
    }
  }

  // --- Memo Table Initialization ---

  initMemoTable(problem, n, W) {
    this.memoTable.innerHTML = '';
    if (problem === 'fibonacci') {
      const tr1 = document.createElement('tr');
      const tr2 = document.createElement('tr');

      const thLabel = document.createElement('th');
      thLabel.textContent = 'n';
      tr1.appendChild(thLabel);

      const tdLabel = document.createElement('th');
      tdLabel.textContent = 'fib(n)';
      tr2.appendChild(tdLabel);

      for (let i = 0; i <= n; i++) {
        const th = document.createElement('th');
        th.textContent = i;
        tr1.appendChild(th);

        const td = document.createElement('td');
        td.id = `memo-cell-${i}`;
        td.textContent = '';
        tr2.appendChild(td);
      }
      this.memoTable.appendChild(tr1);
      this.memoTable.appendChild(tr2);
    } else if (problem === 'knapsack') {
      // Header Row (Weights)
      const headerRow = document.createElement('tr');
      headerRow.appendChild(document.createElement('th')); // Empty top-left
      for (let w = 0; w <= W; w++) {
        const th = document.createElement('th');
        th.textContent = `W=${w}`;
        headerRow.appendChild(th);
      }
      this.memoTable.appendChild(headerRow);

      // Rows (Items)
      for (let i = 0; i <= n; i++) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = `i=${i}`;
        tr.appendChild(th);

        for (let w = 0; w <= W; w++) {
          const td = document.createElement('td');
          td.id = `memo-cell-${i}-${w}`;
          td.textContent = '';
          tr.appendChild(td);
        }
        this.memoTable.appendChild(tr);
      }
    }
  }

  // --- Playback Controls ---

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (this.currentStepIndex >= this.steps.length - 1) {
      this.currentStepIndex = 0; // Loop if at end
    }
    this.isPlaying = true;
    this.btnPlayPause.innerHTML = '<i class="fas fa-pause"></i>';

    const speed = this.speedSlider.value; // ms

    this.playInterval = setInterval(() => {
      if (this.currentStepIndex < this.steps.length - 1) {
        this.stepForward();
      } else {
        this.pause();
      }
    }, speed);
  }

  pause() {
    this.isPlaying = false;
    this.btnPlayPause.innerHTML = '<i class="fas fa-play"></i>';
    clearInterval(this.playInterval);
  }

  stepForward() {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.updateUI();
    }
  }

  stepBackward() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.updateUI();
    }
  }

  resetPlayback() {
    this.pause();
    this.currentStepIndex = 0;
    this.updateUI();
  }

  jumpToStep(index) {
    this.currentStepIndex = index;
    this.updateUI();
  }

  // --- Rendering ---

  updateUI() {
    if (this.steps.length === 0) return;

    const step = this.steps[this.currentStepIndex];

    // Update slider
    this.timelineSlider.value = this.currentStepIndex;
    this.timelineProgress.textContent = `${this.currentStepIndex} / ${this.steps.length - 1}`;

    // Update State Display
    this.currentStateDisplay.textContent = step.stateStr;

    // Update Call Stack
    this.callStackList.innerHTML = '';
    step.callStack.forEach((call, idx) => {
      const li = document.createElement('li');
      li.textContent = call;
      if (idx === step.callStack.length - 1) {
        li.classList.add('active-frame');
      }
      this.callStackList.appendChild(li);
    });

    // Render Canvas Tree
    this.render();

    // Update Memo Table
    this.updateMemoTableDisplay(step);
  }

  render() {
    // Clear
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.steps.length === 0 || this.treeNodes.length === 0) return;

    const currentStep = this.steps[this.currentStepIndex];

    // Which nodes are visible? A node is visible if a step for it has been reached.
    // We can figure this out by looking at steps up to currentStepIndex
    const visibleNodes = new Set();
    const calculatedNodes = new Set();
    const memoHitNodes = new Set();

    for (let i = 0; i <= this.currentStepIndex; i++) {
      const s = this.steps[i];
      visibleNodes.add(s.nodeId);
      if (s.type === 'CALCULATED' || s.type === 'BASE_CASE') {
        calculatedNodes.add(s.nodeId);
      }
      if (s.type === 'MEMO_HIT') {
        memoHitNodes.add(s.nodeId);
      }
    }

    // Draw Edges
    this.ctx.lineWidth = 2;
    this.treeNodes.forEach((node) => {
      if (!visibleNodes.has(node.id)) return;

      node.children.forEach((childId) => {
        if (visibleNodes.has(childId)) {
          const child = this.treeNodes[childId];
          this.ctx.beginPath();
          this.ctx.moveTo(node.x, node.y);
          this.ctx.lineTo(child.x, child.y);
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          this.ctx.stroke();
        }
      });
    });

    // Draw Nodes
    this.treeNodes.forEach((node) => {
      if (!visibleNodes.has(node.id)) return;

      const isActive = node.id === currentStep.nodeId;
      const isCalc = calculatedNodes.has(node.id);
      const isMemoHit = memoHitNodes.has(node.id);

      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, this.nodeRadius, 0, Math.PI * 2);

      // Colors matching CSS
      if (isActive) {
        this.ctx.fillStyle = '#eab308'; // Active
        this.ctx.strokeStyle = '#fef08a';
      } else if (isMemoHit) {
        this.ctx.fillStyle = '#ef4444'; // Overlap
        this.ctx.strokeStyle = '#fca5a5';
      } else if (isCalc) {
        this.ctx.fillStyle = '#22c55e'; // Calculated
        this.ctx.strokeStyle = '#86efac';
      } else {
        this.ctx.fillStyle = '#475569'; // Uncalculated
        this.ctx.strokeStyle = '#94a3b8';
      }

      this.ctx.fill();
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Draw Text
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px Fira Code';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(node.label, node.x, node.y);
    });
  }

  updateMemoTableDisplay(step) {
    const problem = this.problemSelect.value;
    const memo = step.memo;

    // Reset all cells visually
    document.querySelectorAll('#memoTable td').forEach((td) => {
      td.className = '';
      td.textContent = '';
    });

    if (problem === 'fibonacci') {
      for (const key in memo) {
        const cell = document.getElementById(`memo-cell-${key}`);
        if (cell) {
          cell.textContent = memo[key];
          cell.classList.add('cell-filled');
          if (step.updatedMemoKey == key) {
            cell.classList.add('cell-active');
          }
        }
      }
    } else if (problem === 'knapsack') {
      for (let i = 0; i < memo.length; i++) {
        for (let w = 0; w < memo[i].length; w++) {
          const val = memo[i][w];
          if (val !== -1) {
            const cell = document.getElementById(`memo-cell-${i}-${w}`);
            if (cell) {
              cell.textContent = val;
              cell.classList.add('cell-filled');

              // Top-down highlight
              if (step.updatedMemoKey === `${i},${w}`) {
                cell.classList.add('cell-active');
              }
            }
          }
        }
      }

      // Bottom-up highlights
      if (step.type === 'CELL_COMPUTE') {
        const currentCell = document.getElementById(
          `memo-cell-${step.currentCell.r}-${step.currentCell.c}`
        );
        if (currentCell) currentCell.classList.add('cell-active');

        const excludeCell = document.getElementById(
          `memo-cell-${step.excludeCell.r}-${step.excludeCell.c}`
        );
        if (excludeCell) {
          excludeCell.classList.add(step.choseInclude ? 'cell-reference' : 'cell-chosen');
        }

        if (step.includeCell) {
          const includeCell = document.getElementById(
            `memo-cell-${step.includeCell.r}-${step.includeCell.c}`
          );
          if (includeCell) {
            includeCell.classList.add(step.choseInclude ? 'cell-chosen' : 'cell-reference');
          }
        }
      }

      // Backtrack path highlights
      if (step.type === 'BACKTRACK' && step.backtrackPath) {
        step.backtrackPath.forEach((pos) => {
          const cell = document.getElementById(`memo-cell-${pos.r}-${pos.c}`);
          if (cell) {
            cell.classList.add('cell-backtrack-path');
          }
        });
      }
    }
  }
}

// Init on load
document.addEventListener('DOMContentLoaded', () => {
  window.dpVis = new DPVisualizer();
});
