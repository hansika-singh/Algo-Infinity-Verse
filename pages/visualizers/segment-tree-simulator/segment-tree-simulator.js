// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Segment Tree simulator logic only
// All globals prefixed st_ or ST_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  stInit();
});

/* ─── Constants ─── */
let ST_SPEED_MAP   = { 1: 1200, 2: 700, 3: 400, 4: 180, 5: 60 };
let ST_SPEED_LABEL = { 1: 'Slowest', 2: 'Slow', 3: 'Normal', 4: 'Fast', 5: 'Blazing' };

/* Node fill colors */
let ST_COL = {
  DEFAULT : { fill: 'rgba(100,116,139,0.25)', stroke: '#64748b',  text: '#94a3b8' },
  ACTIVE  : { fill: 'rgba(168,85,247,0.25)',  stroke: '#a855f7',  text: '#e9d5ff' },
  MATCH   : { fill: 'rgba(34,197,94,0.25)',   stroke: '#22c55e',  text: '#bbf7d0' },
  PARTIAL : { fill: 'rgba(245,158,11,0.25)',  stroke: '#f59e0b',  text: '#fde68a' },
  NONE    : { fill: 'rgba(100,116,139,0.12)', stroke: '#64748b',  text: '#64748b' },
  UPDATED : { fill: 'rgba(6,182,212,0.25)',   stroke: '#06b6d4',  text: '#a5f3fc' },
};

/* ─── State ─── */
let stState = {
  arr       : [],
  tree      : [],        // segment tree array (1-indexed)
  n         : 0,
  nodePos   : {},        // nodePos[idx] = {x, y, r}
  nodeColor : {},        // nodeColor[idx] = key of ST_COL
  steps     : [],        // animation steps
  stepIdx   : 0,
  playing   : false,
  timer     : null,
  built     : false,
  hoveredIndex: null,
  arrBackup : null,
  treeBackup: null,
};

/* ─── Pulse Animation State ─── */
let stPulseState = {
  active: false,
  type: '',      // 'descent', 'ascent', or 'ripple'
  fromX: 0,
  fromY: 0,
  toX: 0,
  toY: 0,
  progress: 0,
  radius: 0,
  maxRadius: 0,
  node: -1
};

let stAnimationFrameId = null;

/* ─── Build Segment Tree ─── */
function stBuild(arr) {
  let n = arr.length;
  let tree = new Array(4 * n).fill(0);
  function buildNode(node, start, end) {
    if (start === end) { tree[node] = arr[start]; return; }
    let mid = Math.floor((start + end) / 2);
    buildNode(2 * node, start, mid);
    buildNode(2 * node + 1, mid + 1, end);
    tree[node] = tree[2 * node] + tree[2 * node + 1];
  }
  buildNode(1, 0, n - 1);
  return tree;
}

/* ─── Generate Query Steps ─── */
function stGenQuerySteps(tree, n, l, r) {
  let steps = [];
  function query(node, start, end, l, r) {
    if (r < start || end < l) {
      steps.push({ type: 'visit', node: node, color: 'NONE', start: start, end: end,
        msg: 'Node ' + node + ' [' + start + '..' + end + '] — no overlap with [' + l + '..' + r + ']. Return 0.' });
      return 0;
    }
    if (l <= start && end <= r) {
      steps.push({ type: 'visit', node: node, color: 'MATCH', start: start, end: end,
        msg: 'Node ' + node + ' [' + start + '..' + end + '] — fully inside [' + l + '..' + r + ']. Return ' + tree[node] + '.' });
      return tree[node];
    }
    steps.push({ type: 'visit', node: node, color: 'PARTIAL', start: start, end: end,
      msg: 'Node ' + node + ' [' + start + '..' + end + '] — partial overlap. Recurse into children.' });
    let mid = Math.floor((start + end) / 2);
    let left  = query(2 * node, start, mid, l, r);
    let right = query(2 * node + 1, mid + 1, end, l, r);
    steps.push({ type: 'return', node: node, color: 'ACTIVE', start: start, end: end,
      msg: 'Node ' + node + ': left=' + left + ' + right=' + right + ' = ' + (left + right) });
    return left + right;
  }
  let result = query(1, 0, n - 1, l, r);
  steps.push({ type: 'result', node: -1, color: null,
    msg: 'Query sum [' + l + '..' + r + '] = ' + result, result: result });
  return steps;
}

/* ─── Generate Update Steps ─── */
function stGenUpdateSteps(tree, n, idx, val, oldVal) {
  let steps = [];
  let delta = val - oldVal;
  function update(node, start, end, idx, val) {
    if (start === end) {
      tree[node] += delta;
      steps.push({ type: 'update', node: node, color: 'UPDATED', idx: idx, val: tree[node], start: start, end: end,
        msg: 'Leaf node ' + node + ' [' + start + ']: value updated from ' + oldVal + ' to ' + val + '.' });
      return;
    }
    let mid = Math.floor((start + end) / 2);
    steps.push({ type: 'visit', node: node, color: 'ACTIVE', idx: idx, start: start, end: end,
      msg: 'Node ' + node + ' [' + start + '..' + end + ']: descending to find index ' + idx + '.' });
    if (idx <= mid) update(2 * node, start, mid, idx, val);
    else update(2 * node + 1, mid + 1, end, idx, val);
    tree[node] = tree[2 * node] + tree[2 * node + 1];
    steps.push({ type: 'propagate', node: node, color: 'UPDATED', idx: idx, val: tree[node], start: start, end: end,
      msg: 'Node ' + node + ' [' + start + '..' + end + ']: recalculated sum = ' + tree[node] + '.' });
  }
  steps.push({ type: 'start', node: -1, color: null,
    msg: 'Updating index ' + idx + ' from ' + oldVal + ' to ' + val + ' (delta=' + delta + ').' });
  update(1, 0, n - 1, idx, val);
  steps.push({ type: 'result', node: -1, color: null, idx: idx, val: val,
    msg: 'Update complete. arr[' + idx + '] = ' + val + '.', result: val });
  return steps;
}

/* ─── Layout Calculation ─── */
function stCalcLayout(canvas, n) {
  let depth  = Math.ceil(Math.log2(n)) + 1;
  let levels = depth;
  let W      = canvas.width;
  let H      = Math.max(300, levels * 90 + 40);
  canvas.height = H;

  let pos = {};
  let nodeR = Math.min(28, Math.floor(W / (Math.pow(2, levels - 1) * 2.2)));
  nodeR = Math.max(16, nodeR);

  function layout(node, start, end, level, xMin, xMax) {
    let x = (xMin + xMax) / 2;
    let y  = level * 80 + 50;
    pos[node] = { x: x, y: y, r: nodeR, start: start, end: end, val: stState.tree[node] };
    if (start === end) return;
    let mid = Math.floor((start + end) / 2);
    layout(2 * node, start, mid,     level + 1, xMin, (xMin + xMax) / 2);
    layout(2 * node + 1, mid + 1, end, level + 1, (xMin + xMax) / 2, xMax);
  }

  layout(1, 0, n - 1, 0, nodeR + 4, W - nodeR - 4);
  return pos;
}

/* ─── Drawing ─── */
function stDraw() {
  let canvas = document.getElementById('stCanvas');
  if (!canvas) return;
  let ctx    = canvas.getContext('2d');
  let pos    = stState.nodePos;
  let colors = stState.nodeColor;
  let tree   = stState.tree;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!stState.built) return;

  let n = stState.n;

  // Draw edges first
  function drawEdges(node, start, end) {
    if (start === end) return;
    let mid  = Math.floor((start + end) / 2);
    let from = pos[node];
    let toL  = pos[2 * node];
    let toR  = pos[2 * node + 1];
    if (!from || !toL || !toR) return;

    ctx.strokeStyle = 'rgba(100,116,139,0.35)';
    ctx.lineWidth   = 1.5;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y + from.r);
    ctx.lineTo(toL.x,  toL.y  - toL.r);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(from.x, from.y + from.r);
    ctx.lineTo(toR.x,  toR.y  - toR.r);
    ctx.stroke();

    drawEdges(2 * node, start, mid);
    drawEdges(2 * node + 1, mid + 1, end);
  }

  drawEdges(1, 0, n - 1);

  // Draw pulse line / dot if active
  if (stPulseState.active) {
    ctx.save();
    if (stPulseState.type === 'descent' || stPulseState.type === 'ascent') {
      let px = stPulseState.fromX + (stPulseState.toX - stPulseState.fromX) * stPulseState.progress;
      let py = stPulseState.fromY + (stPulseState.toY - stPulseState.fromY) * stPulseState.progress;
      
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#06b6d4';
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (stPulseState.type === 'ripple') {
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#06b6d4';
      ctx.strokeStyle = 'rgba(6, 182, 212, ' + (1 - stPulseState.radius / stPulseState.maxRadius) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(stPulseState.fromX, stPulseState.fromY, stPulseState.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Draw nodes
  function drawNodes(node, start, end) {
    let p   = pos[node];
    if (!p) return;
    let col = ST_COL[colors[node] || 'DEFAULT'];

    let isHovered = (stState.hoveredIndex !== null && p.start === stState.hoveredIndex && p.end === stState.hoveredIndex);

    // Circle
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle   = col.fill;
    ctx.fill();
    ctx.strokeStyle = isHovered ? '#c084fc' : col.stroke;
    ctx.lineWidth   = isHovered ? 4 : 2;
    ctx.stroke();

    if (isHovered) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(168,85,247,0.4)';
      ctx.lineWidth   = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Value
    let val   = tree[node];
    let valStr = val !== undefined ? String(val) : '';
    ctx.fillStyle  = col.text;
    ctx.font       = 'bold ' + Math.min(13, p.r * 0.7) + 'px "Fira Code", monospace';
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(valStr, p.x, p.y);

    // Range label below node
    ctx.fillStyle    = 'rgba(148,163,184,0.8)';
    ctx.font         = Math.min(9, p.r * 0.45) + 'px Poppins,sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('[' + start + '..' + end + ']', p.x, p.y + p.r + 3);

    if (start === end) return;
    let mid = Math.floor((start + end) / 2);
    drawNodes(2 * node, start, mid);
    drawNodes(2 * node + 1, mid + 1, end);
  }

  drawNodes(1, 0, n - 1);
}

/* ─── Reset node colors ─── */
function stResetColors() {
  Object.keys(stState.nodePos).forEach(function(k) {
    stState.nodeColor[k] = 'DEFAULT';
  });
}

/* ─── Pulse Animations ─── */
function stTriggerPulse(step) {
  if (!stState.built) return;
  let pos = stState.nodePos;
  
  stPulseState.active = false;
  if (stAnimationFrameId) {
    cancelAnimationFrame(stAnimationFrameId);
    stAnimationFrameId = null;
  }

  let node = step.node;
  if (!node || node <= 0 || !pos[node]) return;

  if (step.type === 'visit') {
    if (node === 1) {
      stPulseState.active = true;
      stPulseState.type = 'ripple';
      stPulseState.fromX = pos[1].x;
      stPulseState.fromY = pos[1].y;
      stPulseState.radius = 0;
      stPulseState.maxRadius = pos[1].r + 15;
      stPulseState.node = 1;
    } else {
      let parent = Math.floor(node / 2);
      if (pos[parent]) {
        stPulseState.active = true;
        stPulseState.type = 'descent';
        stPulseState.fromX = pos[parent].x;
        stPulseState.fromY = pos[parent].y;
        stPulseState.toX = pos[node].x;
        stPulseState.toY = pos[node].y;
        stPulseState.progress = 0;
        stPulseState.node = node;
      }
    }
  } else if (step.type === 'update') {
    stPulseState.active = true;
    stPulseState.type = 'ripple';
    stPulseState.fromX = pos[node].x;
    stPulseState.fromY = pos[node].y;
    stPulseState.radius = 0;
    stPulseState.maxRadius = pos[node].r + 20;
    stPulseState.node = node;
  } else if (step.type === 'propagate') {
    let childNode = -1;
    let leftChild = 2 * node;
    let rightChild = 2 * node + 1;
    
    if (pos[leftChild] && step.idx !== undefined && step.idx >= pos[leftChild].start && step.idx <= pos[leftChild].end) {
      childNode = leftChild;
    } else if (pos[rightChild] && step.idx !== undefined && step.idx >= pos[rightChild].start && step.idx <= pos[rightChild].end) {
      childNode = rightChild;
    }
    
    if (childNode !== -1 && pos[childNode]) {
      stPulseState.active = true;
      stPulseState.type = 'ascent';
      stPulseState.fromX = pos[childNode].x;
      stPulseState.fromY = pos[childNode].y;
      stPulseState.toX = pos[node].x;
      stPulseState.toY = pos[node].y;
      stPulseState.progress = 0;
      stPulseState.node = node;
    }
  }
  
  if (stPulseState.active) {
    stAnimatePulse();
  }
}

function stAnimatePulse() {
  let lastTime = performance.now();
  let duration = Math.max(100, stGetDelay() * 0.7);
  
  function frame(time) {
    if (!stPulseState.active) return;
    let dt = time - lastTime;
    lastTime = time;
    
    if (stPulseState.type === 'ripple') {
      stPulseState.radius += (stPulseState.maxRadius / duration) * dt;
      if (stPulseState.radius >= stPulseState.maxRadius) {
        stPulseState.active = false;
      }
    } else {
      stPulseState.progress += dt / duration;
      if (stPulseState.progress >= 1.0) {
        stPulseState.progress = 1.0;
        stPulseState.active = false;
      }
    }
    
    stDraw();
    
    if (stPulseState.active) {
      stAnimationFrameId = requestAnimationFrame(frame);
    }
  }
  
  stAnimationFrameId = requestAnimationFrame(frame);
}

/* ─── Bottom Array Render ─── */
function stRenderArray() {
  let container = document.getElementById('stArrayLayout');
  if (!container) return;
  container.innerHTML = '';
  if (!stState.built) return;

  let currentStep = stState.steps[stState.stepIdx - 1];
  let cellClasses = new Array(stState.n).fill('');
  
  if (currentStep) {
    if (currentStep.type === 'visit' || currentStep.type === 'return') {
      let start = currentStep.start;
      let end = currentStep.end;
      let color = currentStep.color;
      let cls = '';
      if (color === 'MATCH') cls = 'highlight-match';
      else if (color === 'PARTIAL') cls = 'highlight-partial';
      else if (color === 'ACTIVE') cls = 'highlight-active';
      else if (color === 'NONE') cls = 'highlight-none';
      
      if (cls && start !== undefined && end !== undefined) {
        for (let i = start; i <= end; i++) {
          cellClasses[i] = cls;
        }
      }
    } else if (currentStep.type === 'update' || currentStep.type === 'propagate') {
      if (currentStep.idx !== undefined) {
        cellClasses[currentStep.idx] = 'highlight-updated';
      }
    } else if (currentStep.type === 'visit' && currentStep.idx !== undefined) {
      cellClasses[currentStep.idx] = 'highlight-active';
    }
  }

  for (let i = 0; i < stState.n; i++) {
    let cell = document.createElement('div');
    cell.className = 'st-array-cell ' + cellClasses[i];
    cell.setAttribute('data-idx', i);
    
    if (stState.hoveredIndex === i) {
      cell.classList.add('highlight-active');
    }
    
    let idxSpan = document.createElement('span');
    idxSpan.className = 'st-cell-idx';
    idxSpan.textContent = i;
    
    let valSpan = document.createElement('span');
    valSpan.className = 'st-cell-val';
    valSpan.textContent = stState.arr[i];
    
    cell.appendChild(idxSpan);
    cell.appendChild(valSpan);
    
    cell.addEventListener('mouseenter', (function(idx) {
      return function() {
        stState.hoveredIndex = idx;
        stDraw();
        this.classList.add('highlight-active');
      };
    })(i));
    
    cell.addEventListener('mouseleave', function() {
      stState.hoveredIndex = null;
      stDraw();
      this.classList.remove('highlight-active');
    });
    
    cell.addEventListener('click', (function(idx) {
      return function() {
        stPromptUpdate(idx);
      };
    })(i));
    
    container.appendChild(cell);
  }
}

/* ─── Apply a single step ─── */
function stApplyStep(step) {
  let statusEl = document.getElementById('stStatus');
  if (statusEl && step.msg) {
    statusEl.textContent = step.msg;
    statusEl.className   = 'st-status-bar ' + (step.type === 'result' ? 'done' : step.type === 'propagate' || step.type === 'update' ? 'update' : 'query');
  }

  stTriggerPulse(step);

  if (step.node && step.node > 0 && step.color) {
    stState.nodeColor[step.node] = step.color;
  }

  if (step.type === 'update' && step.node > 0 && step.val !== undefined) {
    stState.tree[step.node] = step.val;
    stState.arr[step.idx] = step.val;
  } else if (step.type === 'propagate' && step.node > 0 && step.val !== undefined) {
    stState.tree[step.node] = step.val;
  } else if (step.type === 'result' && step.result !== undefined && step.idx !== undefined) {
    stState.arr[step.idx] = step.val;
    stState.arrBackup = null;
    stState.treeBackup = null;
  }

  if (step.type === 'result') {
    let panel  = document.getElementById('stResultPanel');
    let iconEl = document.getElementById('stResultIcon');
    let textEl = document.getElementById('stResultText');
    if (panel && iconEl && textEl) {
      iconEl.textContent = step.result !== undefined ? '✅' : '⚡';
      textEl.textContent = step.msg;
      panel.classList.remove('hidden');
    }
  }

  stRenderArray();
  stDraw();
}

/* ─── Playback ─── */
function stGetDelay() {
  let el = document.getElementById('stSpeed');
  return ST_SPEED_MAP[el ? el.value : 3] || 400;
}

function stPlay() {
  if (stState.playing) return;
  if (stState.stepIdx >= stState.steps.length) { stState.stepIdx = 0; stResetColors(); }
  stState.playing = true;
  stUpdatePlaybackBtns();
  stPlayNext();
}

function stPlayNext() {
  if (!stState.playing) return;
  if (stState.stepIdx >= stState.steps.length) {
    stState.playing = false;
    stUpdatePlaybackBtns();
    return;
  }
  stApplyStep(stState.steps[stState.stepIdx]);
  stState.stepIdx++;
  stUpdateStepCounter();
  stState.timer = setTimeout(stPlayNext, stGetDelay());
}

function stPause() {
  stState.playing = false;
  if (stState.timer) { clearTimeout(stState.timer); stState.timer = null; }
  stUpdatePlaybackBtns();
}

function stStep() {
  if (stState.playing) stPause();
  if (stState.stepIdx >= stState.steps.length) return;
  stApplyStep(stState.steps[stState.stepIdx]);
  stState.stepIdx++;
  stUpdateStepCounter();
  stUpdatePlaybackBtns();
}

function stResetAnim() {
  stPause();
  if (stState.arrBackup) {
    stState.arr = stState.arrBackup.slice();
    stState.tree = stState.treeBackup.slice();
  }
  stState.stepIdx = 0;
  stResetColors();
  stPulseState.active = false;
  if (stAnimationFrameId) {
    cancelAnimationFrame(stAnimationFrameId);
    stAnimationFrameId = null;
  }
  let resultPanel = document.getElementById('stResultPanel');
  if (resultPanel) resultPanel.classList.add('hidden');
  let statusEl = document.getElementById('stStatus');
  if (statusEl) { statusEl.textContent = 'Animation reset. Press Play or Step.'; statusEl.className = 'st-status-bar'; }
  stUpdateStepCounter();
  stRenderArray();
  stDraw();
}

function stUpdateStepCounter() {
  let numEl = document.getElementById('stStepNum');
  let totEl = document.getElementById('stStepTotal');
  if (numEl) numEl.textContent = stState.stepIdx;
  if (totEl) totEl.textContent = stState.steps.length;
}

function stUpdatePlaybackBtns() {
  let playBtn  = document.getElementById('stPlayBtn');
  let pauseBtn = document.getElementById('stPauseBtn');
  let stepBtn  = document.getElementById('stStepBtn');
  let hasSteps = stState.steps.length > 0;
  if (playBtn)  playBtn.disabled  = stState.playing || !hasSteps;
  if (pauseBtn) pauseBtn.disabled = !stState.playing;
  if (stepBtn)  stepBtn.disabled  = !hasSteps || stState.stepIdx >= stState.steps.length;
}

/* ─── Build ─── */
function stDoBuild() {
  stPause();
  let inputEl = document.getElementById('stArrayInput');
  if (!inputEl) return;

  let raw = inputEl.value.split(',').map(function(s) { return parseInt(s.trim()); }).filter(function(v) { return !isNaN(v); });
  if (raw.length < 2 || raw.length > 16) {
    let statusEl = document.getElementById('stStatus');
    if (statusEl) { statusEl.textContent = 'Please enter between 2 and 16 numbers.'; statusEl.className = 'st-status-bar update'; }
    return;
  }

  stState.arr     = raw;
  stState.n       = raw.length;
  stState.tree    = stBuild(raw);
  stState.steps   = [];
  stState.stepIdx = 0;
  stState.built   = true;
  stState.playing = false;
  stState.arrBackup = null;
  stState.treeBackup = null;

  // Resize canvas
  let canvas = document.getElementById('stCanvas');
  if (!canvas) return;
  let wrap = canvas.parentElement;
  canvas.width = wrap ? wrap.clientWidth : 800;

  stState.nodePos   = stCalcLayout(canvas, stState.n);
  stState.nodeColor = {};
  Object.keys(stState.nodePos).forEach(function(k) { stState.nodeColor[k] = 'DEFAULT'; });

  let emptyEl = document.getElementById('stCanvasEmpty');
  if (emptyEl) emptyEl.classList.add('hidden');

  let resultPanel = document.getElementById('stResultPanel');
  if (resultPanel) resultPanel.classList.add('hidden');

  let statusEl = document.getElementById('stStatus');
  if (statusEl) {
    statusEl.textContent = 'Tree built from [' + raw.join(', ') + ']. Root sum = ' + stState.tree[1] + '. Now run a query or update.';
    statusEl.className = 'st-status-bar done';
  }

  // Update input bounds
  let qL = document.getElementById('stQueryL');
  let qR = document.getElementById('stQueryR');
  let ui = document.getElementById('stUpdateIdx');
  if (qL) { qL.max = raw.length - 1; }
  if (qR) { qR.max = raw.length - 1; qR.value = Math.min(parseInt(qR.value) || raw.length - 1, raw.length - 1); }
  if (ui) { ui.max = raw.length - 1; }

  stUpdateStepCounter();
  stUpdatePlaybackBtns();
  stRenderArray();
  stDraw();
}

/* ─── Query ─── */
function stDoQuery() {
  if (!stState.built) { console.warn("Alert:", 'Build the tree first.'); return; }
  stPause();

  let lEl = document.getElementById('stQueryL');
  let rEl = document.getElementById('stQueryR');
  let l   = parseInt(lEl ? lEl.value : 0);
  let r   = parseInt(rEl ? rEl.value : 0);
  let n   = stState.n;

  if (isNaN(l) || isNaN(r) || l < 0 || r >= n || l > r) {
    let statusEl = document.getElementById('stStatus');
    if (statusEl) { statusEl.textContent = 'Invalid range. Use 0-indexed values where L ≤ R < ' + n + '.'; statusEl.className = 'st-status-bar update'; }
    return;
  }

  if (stState.arrBackup) {
    stState.arr = stState.arrBackup.slice();
    stState.tree = stState.treeBackup.slice();
  }
  stState.arrBackup = stState.arr.slice();
  stState.treeBackup = stState.tree.slice();

  stResetColors();
  let resultPanel = document.getElementById('stResultPanel');
  if (resultPanel) resultPanel.classList.add('hidden');

  stState.steps   = stGenQuerySteps(stState.tree, n, l, r);
  stState.stepIdx = 0;
  stUpdateStepCounter();
  stUpdatePlaybackBtns();

  let statusEl = document.getElementById('stStatus');
  if (statusEl) { statusEl.textContent = 'Query sum [' + l + '..' + r + '] ready. Press Play or Step to animate.'; statusEl.className = 'st-status-bar query'; }
  stRenderArray();
  stDraw();
}

/* ─── Update ─── */
function stDoUpdate() {
  if (!stState.built) { console.warn("Alert:", 'Build the tree first.'); return; }
  stPause();

  let idxEl = document.getElementById('stUpdateIdx');
  let valEl = document.getElementById('stUpdateVal');
  let idx   = parseInt(idxEl ? idxEl.value : 0);
  let val   = parseInt(valEl ? valEl.value : 0);
  let n     = stState.n;

  if (isNaN(idx) || isNaN(val) || idx < 0 || idx >= n) {
    let statusEl = document.getElementById('stStatus');
    if (statusEl) { statusEl.textContent = 'Invalid index. Use 0 to ' + (n - 1) + '.'; statusEl.className = 'st-status-bar update'; }
    return;
  }

  if (stState.arrBackup) {
    stState.arr = stState.arrBackup.slice();
    stState.tree = stState.treeBackup.slice();
  }
  stState.arrBackup = stState.arr.slice();
  stState.treeBackup = stState.tree.slice();

  let oldVal = stState.arr[idx];
  stResetColors();
  let resultPanel = document.getElementById('stResultPanel');
  if (resultPanel) resultPanel.classList.add('hidden');

  // Clone tree for step generation (stGenUpdateSteps mutates it)
  let treeCopy = stState.tree.slice();
  stState.steps   = stGenUpdateSteps(treeCopy, n, idx, val, oldVal);
  // Defer applying to live state until animation completes
  stState.pendingUpdate = { idx: idx, val: val };

  stState.stepIdx = 0;
  stUpdateStepCounter();
  stUpdatePlaybackBtns();

  let statusEl = document.getElementById('stStatus');
  if (statusEl) { statusEl.textContent = 'Update arr[' + idx + '] = ' + val + ' ready. Press Play or Step to animate propagation.'; statusEl.className = 'st-status-bar update'; }
  stRenderArray();
  stDraw();
}

/* ─── Prompt Update dialog ─── */
function stPromptUpdate(idx) {
  let n = stState.n;
  if (idx < 0 || idx >= n) return;
  
  let currentVal = stState.arr[idx];
  let inputVal = null /* prompt removed */:', currentVal);
  if (inputVal === null) return;
  
  let val = parseInt(inputVal.trim());
  if (isNaN(val)) {
    console.warn("Alert:", 'Please enter a valid integer.');
    return;
  }
  
  let idxEl = document.getElementById('stUpdateIdx');
  let valEl = document.getElementById('stUpdateVal');
  if (idxEl) idxEl.value = idx;
  if (valEl) valEl.value = val;
  
  stDoUpdate();
}

/* ─── Init ─── */
function stInit() {
  let buildBtn  = document.getElementById('stBuildBtn');
  let queryBtn  = document.getElementById('stQueryBtn');
  let updateBtn = document.getElementById('stUpdateBtn');
  let playBtn   = document.getElementById('stPlayBtn');
  let pauseBtn  = document.getElementById('stPauseBtn');
  let stepBtn   = document.getElementById('stStepBtn');
  let resetBtn  = document.getElementById('stResetBtn');
  let speedSlider = document.getElementById('stSpeed');

  if (buildBtn)  buildBtn.addEventListener('click', stDoBuild);
  if (queryBtn)  queryBtn.addEventListener('click',  stDoQuery);
  if (updateBtn) updateBtn.addEventListener('click', stDoUpdate);
  if (playBtn)   playBtn.addEventListener('click',   stPlay);
  if (pauseBtn)  pauseBtn.addEventListener('click',  stPause);
  if (stepBtn)   stepBtn.addEventListener('click',   stStep);
  if (resetBtn)  resetBtn.addEventListener('click',  stResetAnim);

  if (speedSlider) {
    speedSlider.addEventListener('input', function() {
      let label = document.getElementById('stSpeedLabel');
      if (label) label.textContent = ST_SPEED_LABEL[speedSlider.value] || 'Normal';
      if (stState.playing) { stPause(); stPlay(); }
    });
  }

  // Set up canvas interactions
  let canvas = document.getElementById('stCanvas');
  if (canvas) {
    canvas.addEventListener('mousemove', function(e) {
      if (!stState.built) return;
      let rect = canvas.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;
      
      let scaleX = canvas.width / rect.width;
      let scaleY = canvas.height / rect.height;
      x *= scaleX;
      y *= scaleY;
      
      let foundIdx = null;
      let pos = stState.nodePos;
      for (let key in pos) {
        if (pos.hasOwnProperty(key)) {
          let p = pos[key];
          if (p.start === p.end) {
            let dist = Math.sqrt((x - p.x)*(x - p.x) + (y - p.y)*(y - p.y));
            if (dist <= p.r) {
              foundIdx = p.start;
              break;
            }
          }
        }
      }
      
      if (stState.hoveredIndex !== foundIdx) {
        stState.hoveredIndex = foundIdx;
        stDraw();
        stRenderArray();
      }
    });

    canvas.addEventListener('mouseleave', function() {
      if (stState.hoveredIndex !== null) {
        stState.hoveredIndex = null;
        stDraw();
        stRenderArray();
      }
    });

    canvas.addEventListener('click', function(e) {
      if (!stState.built) return;
      let rect = canvas.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;
      
      let scaleX = canvas.width / rect.width;
      let scaleY = canvas.height / rect.height;
      x *= scaleX;
      y *= scaleY;
      
      let pos = stState.nodePos;
      for (let key in pos) {
        if (pos.hasOwnProperty(key)) {
          let p = pos[key];
          if (p.start === p.end) {
            let dist = Math.sqrt((x - p.x)*(x - p.x) + (y - p.y)*(y - p.y));
            if (dist <= p.r) {
              stPromptUpdate(p.start);
              break;
            }
          }
        }
      }
    });
  }

  // Resize canvas on window resize
  window.addEventListener('resize', function() {
    if (!stState.built) return;
    let canvas = document.getElementById('stCanvas');
    let wrap   = canvas && canvas.parentElement;
    if (!canvas || !wrap) return;
    canvas.width = wrap.clientWidth;
    stState.nodePos = stCalcLayout(canvas, stState.n);
    stDraw();
  });

  // Auto-build on load with default array
  stDoBuild();
}