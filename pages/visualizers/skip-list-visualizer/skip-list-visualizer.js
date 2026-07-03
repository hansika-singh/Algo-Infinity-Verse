// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Skip List Visualizer only
// All globals prefixed sl_ or SL_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  slInitControls();
});

/* ─── Speed map ─── */
var SL_SPEED = { 1: 1200, 2: 700, 3: 400, 4: 180, 5: 60 };
var SL_SPEED_LABEL = { 1: 'Slowest', 2: 'Slow', 3: 'Normal', 4: 'Fast', 5: 'Blazing' };

/* ─── Colors ─── */
var SL_COL = {
  DEFAULT : { fill: 'rgba(100,116,139,0.2)', stroke: '#64748b', text: '#94a3b8' },
  ACTIVE  : { fill: 'rgba(168,85,247,0.3)',  stroke: '#a855f7', text: '#e9d5ff' },
  FOUND   : { fill: 'rgba(34,197,94,0.3)',   stroke: '#22c55e', text: '#bbf7d0' },
  PATH    : { fill: 'rgba(6,182,212,0.25)',   stroke: '#06b6d4', text: '#a5f3fc' },
  DELETED : { fill: 'rgba(239,68,68,0.2)',    stroke: '#ef4444', text: '#fca5a5' },
  SENTINEL: { fill: 'rgba(245,158,11,0.15)', stroke: '#f59e0b', text: '#fde68a' },
};

/* ─── Skip List Data Structure ─── */
function slMakeNode(val, level) {
  return { val: val, level: level, forward: new Array(level + 1).fill(null) };
}

var slList = {
  maxLevel: 6,
  prob    : 0.5,
  level   : 0,
  header  : null,
};

function slInit(prob) {
  slList.prob   = prob || 0.5;
  slList.level  = 0;
  slList.header = slMakeNode(-Infinity, slList.maxLevel);
}

function slRandomLevel() {
  var lvl = 0;
  while (Math.random() < slList.prob && lvl < slList.maxLevel) lvl++;
  return lvl;
}

/* ─── Insert (returns steps) ─── */
function slGenInsertSteps(val) {
  var steps = [];
  var update = new Array(slList.maxLevel + 1).fill(null);
  var curr   = slList.header;

  steps.push({ type: 'start', msg: 'Insert(' + val + '): Starting from header at level ' + slList.level });

  for (var i = slList.level; i >= 0; i--) {
    while (curr.forward[i] !== null && curr.forward[i].val < val) {
      steps.push({ type: 'traverse', node: curr.forward[i].val, level: i, color: 'PATH',
        msg: 'Level ' + i + ': ' + curr.forward[i].val + ' < ' + val + ', move right' });
      curr = curr.forward[i];
    }
    update[i] = curr;
    steps.push({ type: 'drop', node: curr.val === -Infinity ? 'header' : curr.val, level: i,
      msg: 'Level ' + i + ': next ≥ target or null, drop down' });
  }

  // Check duplicate
  var existing = curr.forward[0];
  if (existing !== null && existing.val === val) {
    steps.push({ type: 'duplicate', msg: 'Insert(' + val + '): Value already exists! Skipping.', result: 'duplicate' });
    return steps;
  }

  var newLevel = slRandomLevel();
  steps.push({ type: 'level-gen', newLevel: newLevel,
    msg: 'Coin flip result: new node gets ' + (newLevel + 1) + ' level(s)' });

  if (newLevel > slList.level) {
    for (var j = slList.level + 1; j <= newLevel; j++) update[j] = slList.header;
    slList.level = newLevel;
    steps.push({ type: 'level-up', level: newLevel,
      msg: 'Skip list height increased to level ' + newLevel });
  }

  var newNode = slMakeNode(val, newLevel);
  for (var k = 0; k <= newLevel; k++) {
    newNode.forward[k] = update[k].forward[k];
    update[k].forward[k] = newNode;
  }

  steps.push({ type: 'inserted', node: val, newLevel: newLevel, color: 'FOUND',
    msg: 'Inserted ' + val + ' at levels 0–' + newLevel + ' ✅' });

  return steps;
}

/* ─── Search (returns steps) ─── */
function slGenSearchSteps(val) {
  var steps = [];
  var curr  = slList.header;

  steps.push({ type: 'start', msg: 'Search(' + val + '): Starting from header at level ' + slList.level });

  for (var i = slList.level; i >= 0; i--) {
    while (curr.forward[i] !== null && curr.forward[i].val < val) {
      steps.push({ type: 'traverse', node: curr.forward[i].val, level: i, color: 'PATH',
        msg: 'Level ' + i + ': ' + curr.forward[i].val + ' < ' + val + ', move right' });
      curr = curr.forward[i];
    }
    steps.push({ type: 'drop', level: i,
      msg: 'Level ' + i + ': next ≥ target or null, drop down' });
  }

  var target = curr.forward[0];
  if (target !== null && target.val === val) {
    steps.push({ type: 'found', node: val, color: 'FOUND',
      msg: 'Found ' + val + ' at level 0 ✅', result: 'found' });
  } else {
    steps.push({ type: 'not-found', msg: 'Value ' + val + ' not found in skip list ❌', result: 'not-found' });
  }

  return steps;
}

/* ─── Delete (returns steps) ─── */
function slGenDeleteSteps(val) {
  var steps  = [];
  var update = new Array(slList.maxLevel + 1).fill(null);
  var curr   = slList.header;

  steps.push({ type: 'start', msg: 'Delete(' + val + '): Finding update pointers' });

  for (var i = slList.level; i >= 0; i--) {
    while (curr.forward[i] !== null && curr.forward[i].val < val) {
      steps.push({ type: 'traverse', node: curr.forward[i].val, level: i, color: 'PATH',
        msg: 'Level ' + i + ': ' + curr.forward[i].val + ' < ' + val + ', move right' });
      curr = curr.forward[i];
    }
    update[i] = curr;
  }

  var target = curr.forward[0];
  if (target === null || target.val !== val) {
    steps.push({ type: 'not-found', msg: 'Delete(' + val + '): Value not found ❌', result: 'not-found' });
    return steps;
  }

  steps.push({ type: 'mark-delete', node: val, color: 'DELETED',
    msg: 'Found ' + val + ', marking for deletion' });

  for (var k = 0; k <= slList.level; k++) {
    if (update[k].forward[k] !== target) break;
    update[k].forward[k] = target.forward[k];
    steps.push({ type: 'unlink', node: val, level: k,
      msg: 'Level ' + k + ': Unlinked ' + val + ' — pointer updated' });
  }

  while (slList.level > 0 && slList.header.forward[slList.level] === null) {
    slList.level--;
  }

  steps.push({ type: 'deleted', node: val,
    msg: 'Deleted ' + val + ' successfully ✅', result: 'deleted' });

  return steps;
}

/* ─── State ─── */
var slState = {
  built   : false,
  steps   : [],
  stepIdx : 0,
  playing : false,
  timer   : null,
  nodeCol : {},
};

/* ─── Canvas Draw ─── */
var SL_NODE_W  = 46;
var SL_NODE_H  = 28;
var SL_LEVEL_H = 52;
var SL_PAD_X   = 30;
var SL_PAD_Y   = 20;

function slGetNodes() {
  var nodes = [];
  var curr  = slList.header.forward[0];
  while (curr) { nodes.push(curr); curr = curr.forward[0]; }
  return nodes;
}

function slDraw() {
  var canvas = document.getElementById('slCanvas');
  if (!canvas) return;
  var ctx    = canvas.getContext('2d');
  var W      = canvas.width;
  var maxLev = slList.level;
  var nodes  = slGetNodes();
  var n      = nodes.length;
  var H      = (maxLev + 2) * SL_LEVEL_H + SL_PAD_Y * 2;
  canvas.height = Math.max(240, H);
  ctx.clearRect(0, 0, W, H);

  if (!slState.built && n === 0) return;

  // X positions: sentinel + nodes
  var allNodes = ['header'].concat(nodes.map(function(nd) { return nd.val; }));
  var xPos = {};
  var gap   = Math.min(80, Math.floor((W - SL_PAD_X * 2 - SL_NODE_W) / Math.max(n + 1, 1)));
  gap = Math.max(56, gap);
  allNodes.forEach(function(v, i) { xPos[v === 'header' ? '__header__' : v] = SL_PAD_X + i * gap + SL_NODE_W / 2; });

  function xOf(v) { return v === -Infinity ? xPos['__header__'] : xPos[v]; }
  function yOf(lev) { return H - SL_PAD_Y - (lev + 1) * SL_LEVEL_H + SL_LEVEL_H / 2; }

  // Draw level labels
  for (var lev = 0; lev <= maxLev; lev++) {
    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.font      = '11px Poppins,sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('L' + lev, 4, yOf(lev) + 5);
  }

  // Draw horizontal lines per level
  for (var lv = 0; lv <= maxLev; lv++) {
    var y = yOf(lv);
    ctx.strokeStyle = 'rgba(100,116,139,0.15)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(SL_PAD_X, y);
    ctx.lineTo(W - SL_PAD_X, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw forward pointers as arrows
  function drawArrow(x1, y1, x2, y2, col) {
    ctx.strokeStyle = col || 'rgba(100,116,139,0.4)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1 + SL_NODE_W / 2, y1);
    ctx.lineTo(x2 - SL_NODE_W / 2, y2);
    ctx.stroke();
    // Arrow head
    var dx = (x2 - SL_NODE_W / 2) - (x1 + SL_NODE_W / 2);
    var dy = y2 - y1;
    var len = Math.sqrt(dx*dx + dy*dy);
    if (len < 1) return;
    var ux = dx/len, uy = dy/len;
    ctx.fillStyle = col || 'rgba(100,116,139,0.4)';
    ctx.beginPath();
    ctx.moveTo(x2 - SL_NODE_W/2, y2);
    ctx.lineTo(x2 - SL_NODE_W/2 - ux*8 - uy*4, y2 - uy*8 + ux*4);
    ctx.lineTo(x2 - SL_NODE_W/2 - ux*8 + uy*4, y2 - uy*8 - ux*4);
    ctx.closePath();
    ctx.fill();
  }

  // Header arrows
  for (var lev2 = 0; lev2 <= maxLev; lev2++) {
    var hx = xOf(-Infinity);
    var hy = yOf(lev2);
    var fwd = slList.header.forward[lev2];
    if (fwd) {
      drawArrow(hx, hy, xOf(fwd.val), yOf(lev2), 'rgba(245,158,11,0.5)');
    }
  }

  // Node arrows
  nodes.forEach(function(nd) {
    var nx = xOf(nd.val);
    for (var lev3 = 0; lev3 <= nd.level; lev3++) {
      var ny = yOf(lev3);
      if (nd.forward[lev3]) {
        var col = slState.nodeCol[nd.val] === 'PATH' ? '#06b6d4' : 'rgba(100,116,139,0.35)';
        drawArrow(nx, ny, xOf(nd.forward[lev3].val), yOf(lev3), col);
      }
    }
  });

  // Draw header sentinel
  var hxPos = xOf(-Infinity);
  for (var lev4 = 0; lev4 <= maxLev; lev4++) {
    var hcol = SL_COL.SENTINEL;
    var hy2  = yOf(lev4);
    ctx.beginPath();
    ctx.roundRect(hxPos - SL_NODE_W/2, hy2 - SL_NODE_H/2, SL_NODE_W, SL_NODE_H, 6);
    ctx.fillStyle   = hcol.fill;
    ctx.fill();
    ctx.strokeStyle = hcol.stroke;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.fillStyle    = hcol.text;
    ctx.font         = 'bold 9px Fira Code,monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('-∞', hxPos, hy2);
  }

  // Draw nodes
  nodes.forEach(function(nd) {
    var nx   = xOf(nd.val);
    var ckey = slState.nodeCol[nd.val] || 'DEFAULT';
    var col  = SL_COL[ckey] || SL_COL.DEFAULT;

    for (var lev5 = 0; lev5 <= maxLev; lev5++) {
      var ny = yOf(lev5);
      if (lev5 <= nd.level) {
        ctx.beginPath();
        ctx.roundRect(nx - SL_NODE_W/2, ny - SL_NODE_H/2, SL_NODE_W, SL_NODE_H, 6);
        ctx.fillStyle   = col.fill;
        ctx.fill();
        ctx.strokeStyle = col.stroke;
        ctx.lineWidth   = lev5 === 0 ? 2 : 1.5;
        ctx.stroke();
        ctx.fillStyle    = col.text;
        ctx.font         = lev5 === 0 ? 'bold 12px Fira Code,monospace' : 'bold 11px Fira Code,monospace';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(nd.val), nx, ny);
      } else {
        // Ghost box at levels above node's level
        ctx.beginPath();
        ctx.roundRect(nx - SL_NODE_W/2, ny - SL_NODE_H/2, SL_NODE_W, SL_NODE_H, 6);
        ctx.strokeStyle = 'rgba(100,116,139,0.12)';
        ctx.lineWidth   = 1;
        ctx.stroke();
      }
    }
  });
}

/* ─── Update Table ─── */
function slUpdateTable() {
  var tbody = document.getElementById('slTableBody');
  if (!tbody) return;
  var nodes = slGetNodes();
  if (nodes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-secondary);font-style:italic">No nodes yet.</td></tr>';
    return;
  }
  tbody.innerHTML = nodes.map(function(nd) {
    var ckey = slState.nodeCol[nd.val] || 'DEFAULT';
    var statusMap = { DEFAULT: '—', ACTIVE: '🟣 Visiting', FOUND: '✅ Found', PATH: '🔵 In Path', DELETED: '🔴 Deleting' };
    return '<tr>' +
      '<td>' + nd.val + '</td>' +
      '<td>' + (nd.level + 1) + ' (0–' + nd.level + ')</td>' +
      '<td>' + (statusMap[ckey] || '—') + '</td>' +
    '</tr>';
  }).join('');
}

/* ─── Log ─── */
function slAddLog(msg, type) {
  var log = document.getElementById('slLog');
  if (!log) return;
  var empty = log.querySelector('.sl-log-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'sl-log-entry ' + (type || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
}

/* ─── Apply step ─── */
function slApplyStep(step) {
  var statusEl = document.getElementById('slStatus');
  if (statusEl && step.msg) {
    statusEl.textContent = step.msg;
    var cls = step.type === 'inserted' || step.type === 'deleted' ? 'done' :
              step.type === 'not-found' || step.type === 'duplicate' ? 'error' :
              step.type.indexOf('delete') !== -1 || step.type === 'mark-delete' || step.type === 'unlink' ? 'delete' :
              step.type === 'found' ? 'done' : 'search';
    statusEl.className = 'sl-status ' + cls;
  }

  if (step.node !== undefined && step.node !== 'header' && step.color) {
    slState.nodeCol[step.node] = step.color;
  }

  slDraw();
  slUpdateTable();
  slUpdateStepCounter();
}

/* ─── Playback ─── */
function slGetDelay() {
  var el = document.getElementById('slSpeed');
  return SL_SPEED[el ? el.value : 3] || 400;
}

function slPlay() {
  if (slState.playing) return;
  if (slState.stepIdx >= slState.steps.length) { slState.stepIdx = 0; slResetColors(); }
  slState.playing = true;
  slUpdatePBBtns();
  slPlayNext();
}

function slPlayNext() {
  if (!slState.playing) return;
  if (slState.stepIdx >= slState.steps.length) {
    slState.playing = false;
    slUpdatePBBtns();
    return;
  }
  slApplyStep(slState.steps[slState.stepIdx]);
  slState.stepIdx++;
  slState.timer = setTimeout(slPlayNext, slGetDelay());
}

function slStopPlay() {
  slState.playing = false;
  if (slState.timer) { clearTimeout(slState.timer); slState.timer = null; }
  slUpdatePBBtns();
}

function slStep() {
  if (slState.playing) slStopPlay();
  if (slState.stepIdx >= slState.steps.length) return;
  slApplyStep(slState.steps[slState.stepIdx]);
  slState.stepIdx++;
  slUpdatePBBtns();
}

function slUpdatePBBtns() {
  var stepBtn = document.getElementById('slStepBtn');
  var playBtn = document.getElementById('slPlayBtn');
  var has = slState.steps.length > 0;
  if (stepBtn) stepBtn.disabled = !has || slState.stepIdx >= slState.steps.length;
  if (playBtn) playBtn.disabled = slState.playing || !has || slState.stepIdx >= slState.steps.length;
}

function slUpdateStepCounter() {
  var n = document.getElementById('slStepNum');
  var t = document.getElementById('slStepTotal');
  if (n) n.textContent = slState.stepIdx;
  if (t) t.textContent = slState.steps.length;
}

function slResetColors() {
  slState.nodeCol = {};
}

/* ─── Operations ─── */
function slDoInsert() {
  var el  = document.getElementById('slInsertVal');
  var val = parseInt(el ? el.value : 0);
  if (isNaN(val)) { slSetStatus('Please enter a valid integer.', 'error'); return; }

  slStopPlay();
  slResetColors();
  slState.steps   = slGenInsertSteps(val);
  slState.stepIdx = 0;
  slUpdateStepCounter();
  slUpdatePBBtns();
  slSetStatus('Insert(' + val + ') ready. Press Step or Play.', 'insert');
  slAddLog('Insert(' + val + ')', 'insert');

  var emptyEl = document.getElementById('slCanvasEmpty');
  if (emptyEl) emptyEl.classList.add('hidden');
  slState.built = true;

  var canvas = document.getElementById('slCanvas');
  if (canvas) {
    canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : 800;
    slDraw();
  }
}

function slDoSearch() {
  var el  = document.getElementById('slSearchVal');
  var val = parseInt(el ? el.value : 0);
  if (isNaN(val)) { slSetStatus('Please enter a valid integer.', 'error'); return; }
  if (!slState.built) { slSetStatus('Insert some values first.', 'error'); return; }

  slStopPlay();
  slResetColors();
  slState.steps   = slGenSearchSteps(val);
  slState.stepIdx = 0;
  slUpdateStepCounter();
  slUpdatePBBtns();
  slSetStatus('Search(' + val + ') ready. Press Step or Play.', 'search');
  slAddLog('Search(' + val + ')', 'search');
  slDraw();
}

function slDoDelete() {
  var el  = document.getElementById('slDeleteVal');
  var val = parseInt(el ? el.value : 0);
  if (isNaN(val)) { slSetStatus('Please enter a valid integer.', 'error'); return; }
  if (!slState.built) { slSetStatus('Insert some values first.', 'error'); return; }

  slStopPlay();
  slResetColors();
  slState.steps   = slGenDeleteSteps(val);
  slState.stepIdx = 0;
  slUpdateStepCounter();
  slUpdatePBBtns();
  slSetStatus('Delete(' + val + ') ready. Press Step or Play.', 'delete');
  slAddLog('Delete(' + val + ')', 'delete');
  slDraw();
}

function slSetStatus(msg, cls) {
  var el = document.getElementById('slStatus');
  if (el) { el.textContent = msg; el.className = 'sl-status ' + (cls || ''); }
}

function slDoReset() {
  slStopPlay();
  var prob = parseFloat(document.getElementById('slProbVal').textContent.replace('p = ', '')) || 0.5;
  slInit(prob);
  slState.built   = false;
  slState.steps   = [];
  slState.stepIdx = 0;
  slState.nodeCol = {};

  var emptyEl = document.getElementById('slCanvasEmpty');
  if (emptyEl) emptyEl.classList.remove('hidden');

  var canvas = document.getElementById('slCanvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  var logEl = document.getElementById('slLog');
  if (logEl) logEl.innerHTML = '<div class="sl-log-empty">No operations yet.</div>';

  slUpdateTable();
  slUpdateStepCounter();
  slUpdatePBBtns();
  slSetStatus('Reset complete. Insert values to begin.', '');
}

/* ─── Init controls ─── */
function slInitControls() {
  slInit(0.5);

  var insertBtn  = document.getElementById('slInsertBtn');
  var searchBtn  = document.getElementById('slSearchBtn');
  var deleteBtn  = document.getElementById('slDeleteBtn');
  var stepBtn    = document.getElementById('slStepBtn');
  var playBtn    = document.getElementById('slPlayBtn');
  var resetBtn   = document.getElementById('slResetBtn');
  var presetBtn  = document.getElementById('slPresetBtn');
  var clearBtn   = document.getElementById('slClearBtn');
  var probSl     = document.getElementById('slProb');
  var speedSl    = document.getElementById('slSpeed');

  if (insertBtn) insertBtn.addEventListener('click', slDoInsert);
  if (searchBtn) searchBtn.addEventListener('click', slDoSearch);
  if (deleteBtn) deleteBtn.addEventListener('click', slDoDelete);
  if (stepBtn)   stepBtn.addEventListener('click',   slStep);
  if (playBtn)   playBtn.addEventListener('click',   slPlay);
  if (resetBtn)  resetBtn.addEventListener('click',  slDoReset);

  if (probSl) {
    probSl.addEventListener('input', function() {
      var p = (parseInt(probSl.value) / 10).toFixed(1);
      var lbl = document.getElementById('slProbVal');
      if (lbl) lbl.textContent = 'p = ' + p;
      slList.prob = parseFloat(p);
    });
  }

  if (speedSl) {
    speedSl.addEventListener('input', function() {
      var lbl = document.getElementById('slSpeedVal');
      if (lbl) lbl.textContent = SL_SPEED_LABEL[speedSl.value] || 'Normal';
      if (slState.playing) { slStopPlay(); slPlay(); }
    });
  }

  if (presetBtn) {
    presetBtn.addEventListener('click', function() {
      slDoReset();
      var vals = [3, 6, 7, 9, 12, 19, 21, 25];
      vals.forEach(function(v) {
        // Directly insert without animation for preset
        var update = new Array(slList.maxLevel + 1).fill(null);
        var curr   = slList.header;
        for (var i = slList.level; i >= 0; i--) {
          while (curr.forward[i] !== null && curr.forward[i].val < v) curr = curr.forward[i];
          update[i] = curr;
        }
        if (curr.forward[0] && curr.forward[0].val === v) return;
        var lvl = slRandomLevel();
        if (lvl > slList.level) {
          for (var j = slList.level + 1; j <= lvl; j++) update[j] = slList.header;
          slList.level = lvl;
        }
        var nd = slMakeNode(v, lvl);
        for (var k = 0; k <= lvl; k++) { nd.forward[k] = update[k].forward[k]; update[k].forward[k] = nd; }
      });

      slState.built = true;
      var emptyEl = document.getElementById('slCanvasEmpty');
      if (emptyEl) emptyEl.classList.add('hidden');
      var canvas = document.getElementById('slCanvas');
      if (canvas) {
        canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : 800;
        slDraw();
      }
      slUpdateTable();
      slSetStatus('Preloaded 8 nodes. Try searching or deleting!', 'done');
      slAddLog('Preloaded [3,6,7,9,12,19,21,25]', 'insert');
    });
  }

  if (clearBtn) clearBtn.addEventListener('click', slDoReset);

  // Allow Enter key in inputs
  ['slInsertVal','slSearchVal','slDeleteVal'].forEach(function(id) {
    var inp = document.getElementById(id);
    if (!inp) return;
    inp.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter') return;
      if (id === 'slInsertVal') slDoInsert();
      else if (id === 'slSearchVal') slDoSearch();
      else slDoDelete();
    });
  });

  // Resize
  window.addEventListener('resize', function() {
    if (!slState.built) return;
    var canvas = document.getElementById('slCanvas');
    if (!canvas) return;
    canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : 800;
    slDraw();
  });
}