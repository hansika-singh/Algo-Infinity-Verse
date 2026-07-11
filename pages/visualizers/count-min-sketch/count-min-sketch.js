// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Count-Min Sketch Frequency Estimator only
// All globals prefixed cms_ or CMS_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function () {
  cmsInit();
});

/* ════════════════════════════════════════════
   STATE
════════════════════════════════════════════ */

var cmsDepth  = 3;   // number of hash functions (rows)
var cmsWidth  = 8;   // number of counters per row (columns)
var cmsGrid   = [];  // 2D array [d][w] of counts
var cmsExact  = {};  // exact frequency map { item: count }
var cmsTotal  = 0;   // total items inserted

// Stable hash seeds — one per possible row (up to 5)
var CMS_SEEDS = [1000003, 999983, 999979, 999961, 999931];

/* ════════════════════════════════════════════
   HASH FUNCTION
   Uses a simple polynomial hash with the row-specific seed.
   Returns a column index in [0, cmsWidth).
════════════════════════════════════════════ */

function cmsHash(item, row) {
  var seed = CMS_SEEDS[row];
  var h = seed;

  for (var i = 0; i < item.length; i++) {
    h = Math.imul(h ^ item.charCodeAt(i), 0x9e3779b9);
    h = (h << 13) | (h >>> 19);
  }

  // Make positive and take modulo
  h = h >>> 0;
  return h % cmsWidth;
}

/* ════════════════════════════════════════════
   GRID INITIALISATION
════════════════════════════════════════════ */

function cmsInitGrid() {
  cmsGrid = [];
  for (var r = 0; r < cmsDepth; r++) {
    cmsGrid.push(new Array(cmsWidth).fill(0));
  }
}

/* ════════════════════════════════════════════
   SKETCH OPERATIONS
════════════════════════════════════════════ */

function cmsUpdate(item) {
  for (var r = 0; r < cmsDepth; r++) {
    var col = cmsHash(item, r);
    cmsGrid[r][col]++;
  }

  cmsExact[item] = (cmsExact[item] || 0) + 1;
  cmsTotal++;
}

// Returns { estimate, cells } where cells = [{row, col}]
function cmsQuery(item) {
  var minVal = Infinity;
  var cells  = [];

  for (var r = 0; r < cmsDepth; r++) {
    var col = cmsHash(item, r);
    var val = cmsGrid[r][col];
    cells.push({ row: r, col: col, val: val });
    if (val < minVal) minVal = val;
  }

  return { estimate: minVal, cells: cells };
}

/* ════════════════════════════════════════════
   GRID RENDERING
════════════════════════════════════════════ */

function cmsGetCellClass(r, c) {
  var val = cmsGrid[r][c];
  if (val === 0) return '';

  // Relative heat — find max in grid
  var maxVal = 1;
  for (var i = 0; i < cmsDepth; i++) {
    for (var j = 0; j < cmsWidth; j++) {
      if (cmsGrid[i][j] > maxVal) maxVal = cmsGrid[i][j];
    }
  }

  var ratio = val / maxVal;
  if (ratio >= 0.75) return 'cms-hot';
  if (ratio >= 0.35) return 'cms-warm';
  return '';
}

function cmsRenderGrid(highlightCells, queryMode) {
  var wrap = document.getElementById('cmsGridWrap');
  if (!wrap) return;

  // Build a lookup for highlights
  var hlMap = {};   // "r,c" -> 'cms-active' | 'cms-query' | 'cms-min'
  if (highlightCells) {
    highlightCells.forEach(function (h) {
      var key = h.row + ',' + h.col;
      hlMap[key] = queryMode ? (h.isMin ? 'cms-min' : 'cms-query') : 'cms-active';
    });
  }

  var tableHtml = '<table class="cms-grid-table"><thead><tr><th class="cms-row-hdr"></th>';

  // Column headers
  for (var c = 0; c < cmsWidth; c++) {
    tableHtml += '<th class="cms-col-hdr">c' + c + '</th>';
  }
  tableHtml += '</tr></thead><tbody>';

  // Rows
  for (var r = 0; r < cmsDepth; r++) {
    tableHtml += '<tr><td class="cms-row-hdr">h' + (r + 1) + '</td>';
    for (var cc = 0; cc < cmsWidth; cc++) {
      var hlClass  = hlMap[r + ',' + cc] || '';
      var heatClass = hlClass ? '' : cmsGetCellClass(r, cc);
      var cls = 'cms-cell ' + heatClass + ' ' + hlClass;
      tableHtml += '<td class="' + cls.trim() + '">' + cmsGrid[r][cc] + '</td>';
    }
    tableHtml += '</tr>';
  }

  tableHtml += '</tbody></table>';
  wrap.innerHTML = tableHtml;
}

/* ════════════════════════════════════════════
   FREQUENCY TABLE
════════════════════════════════════════════ */

function cmsRenderFreqTable() {
  var el = document.getElementById('cmsFreqTable');
  if (!el) return;

  var keys = Object.keys(cmsExact);
  if (keys.length === 0) {
    el.innerHTML = '<span class="cms-empty-text">No items inserted yet.</span>';
    return;
  }

  // Sort by count descending
  keys.sort(function (a, b) { return cmsExact[b] - cmsExact[a]; });

  var maxCount = cmsExact[keys[0]];
  var html = '';

  keys.forEach(function (key) {
    var count = cmsExact[key];
    var pct   = Math.round((count / maxCount) * 100);
    html +=
      '<div class="cms-freq-row">' +
        '<span class="cms-freq-key">' + cmsEscapeHtml(key) + '</span>' +
        '<div class="cms-freq-bar-wrap"><div class="cms-freq-bar" style="width:' + pct + '%"></div></div>' +
        '<span class="cms-freq-count">' + count + '</span>' +
      '</div>';
  });

  el.innerHTML = html;
}

/* ════════════════════════════════════════════
   HEAVY HITTERS PANEL
════════════════════════════════════════════ */

function cmsRenderHeavyHitters() {
  var card = document.getElementById('cmsHHCard');
  var list = document.getElementById('cmsHHList');
  if (!card || !list) return;

  var keys = Object.keys(cmsExact);
  if (keys.length === 0) { card.style.display = 'none'; return; }

  // Top-5 by exact count
  keys.sort(function (a, b) { return cmsExact[b] - cmsExact[a]; });
  var top = keys.slice(0, 5);
  var maxCount = cmsExact[top[0]];

  card.style.display = 'block';

  var html = '';
  top.forEach(function (key, idx) {
    var exact   = cmsExact[key];
    var sketch  = cmsQuery(key).estimate;
    var pct     = Math.round((exact / maxCount) * 100);
    html +=
      '<div class="cms-hh-row">' +
        '<span class="cms-hh-rank">#' + (idx + 1) + '</span>' +
        '<span class="cms-hh-key">' + cmsEscapeHtml(key) + '</span>' +
        '<div class="cms-hh-bar-wrap"><div class="cms-hh-bar" style="width:' + pct + '%"></div></div>' +
        '<span class="cms-hh-count">≈' + sketch + '</span>' +
      '</div>';
  });

  list.innerHTML = html;
}

/* ════════════════════════════════════════════
   ESTIMATE CARD (query result)
════════════════════════════════════════════ */

function cmsShowEstimate(item, result) {
  var card = document.getElementById('cmsEstimateCard');
  var rows = document.getElementById('cmsEstimateRows');
  if (!card || !rows) return;

  card.style.display = 'block';

  var exact     = cmsExact[item] || 0;
  var estimate  = result.estimate;
  var overcount = estimate - exact;

  var html =
    '<div class="cms-estimate-row">' +
      '<span class="cms-est-item">"' + cmsEscapeHtml(item) + '"</span>' +
      '<div class="cms-est-nums">' +
        '<span>True:&nbsp;<span class="cms-est-true">' + exact + '</span></span>' +
        '<span>Sketch:&nbsp;<span class="cms-est-sketch">' + estimate + '</span></span>' +
      '</div>' +
      (overcount > 0
        ? '<span class="cms-est-err">Over-estimate by ' + overcount + ' (collision noise)</span>'
        : '<span style="font-size:.7rem;color:#22c55e">✓ Exact match — no collision on minimum path</span>') +
      '<div style="font-size:.7rem;color:var(--text-secondary);margin-top:.3rem">' +
        'Cells checked: ' + result.cells.map(function (c) {
          return 'h' + (c.row + 1) + '[c' + c.col + ']=' + c.val;
        }).join(', ') +
      '</div>' +
    '</div>';

  rows.innerHTML = html;
}

/* ════════════════════════════════════════════
   STATUS
════════════════════════════════════════════ */

function cmsSetStatus(msg, cls) {
  var el = document.getElementById('cmsStatus');
  if (!el) return;
  el.textContent  = msg;
  el.className    = 'cms-status ' + (cls || '');
}

/* ════════════════════════════════════════════
   FLASH ANIMATION — briefly highlight cells then redraw neutral
════════════════════════════════════════════ */

function cmsFlashInsert(item) {
  var cells = [];
  for (var r = 0; r < cmsDepth; r++) {
    cells.push({ row: r, col: cmsHash(item, r) });
  }
  cmsRenderGrid(cells, false);

  setTimeout(function () {
    cmsRenderGrid(null, false);
  }, 700);
}

function cmsFlashQuery(item, result) {
  // Mark minimum cells
  var minVal = result.estimate;
  var cells  = result.cells.map(function (c) {
    return { row: c.row, col: c.col, isMin: c.val === minVal };
  });
  cmsRenderGrid(cells, true);
}

/* ════════════════════════════════════════════
   INSERT ACTION
════════════════════════════════════════════ */

function cmsDoInsert(item) {
  if (!item.trim()) {
    cmsSetStatus('Please enter an item to insert.', 'err');
    return;
  }

  cmsUpdate(item);
  cmsFlashInsert(item);
  cmsRenderFreqTable();
  cmsRenderHeavyHitters();
  cmsSetStatus(
    'Inserted "' + item + '" — incremented ' + cmsDepth + ' cells (one per hash function). ' +
    'Total items: ' + cmsTotal + '. True count: ' + cmsExact[item] + '.',
    'ok'
  );
}

/* ════════════════════════════════════════════
   QUERY ACTION
════════════════════════════════════════════ */

function cmsDoQuery(item) {
  if (!item.trim()) {
    cmsSetStatus('Please enter an item to query.', 'err');
    return;
  }

  var result = cmsQuery(item);
  cmsFlashQuery(item, result);
  cmsShowEstimate(item, result);

  var exact = cmsExact[item] || 0;
  var msg   = 'Query "' + item + '": sketch estimate = ' + result.estimate + ', true count = ' + exact + '.';

  if (result.estimate > exact) {
    msg += ' Over-estimate by ' + (result.estimate - exact) + ' due to collisions.';
    cmsSetStatus(msg, 'warn');
  } else {
    msg += ' Exact match — minimum cell had no collision noise.';
    cmsSetStatus(msg, 'ok');
  }
}

/* ════════════════════════════════════════════
   ZIPFIAN HEAVY HITTERS SCENARIO
════════════════════════════════════════════ */

var CMS_WORDS = [
  'react', 'python', 'javascript', 'typescript', 'rust',
  'golang', 'java', 'kotlin', 'swift', 'cpp',
  'docker', 'kubernetes', 'linux', 'git', 'sql',
  'redis', 'nginx', 'webpack', 'vite', 'node'
];

function cmsRunHeavyHitters() {
  cmsFullReset(false);

  // Zipfian: rank-k item appears proportional to 1/k
  var totalItems = 200;
  var stream     = [];

  CMS_WORDS.forEach(function (word, idx) {
    var count = Math.max(1, Math.round(totalItems / (idx + 1)));
    for (var i = 0; i < count; i++) {
      stream.push(word);
    }
  });

  // Shuffle the stream to simulate arrival order
  for (var i = stream.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = stream[i]; stream[i] = stream[j]; stream[j] = tmp;
  }

  // Insert all items without animation (batch)
  stream.forEach(function (item) {
    cmsUpdate(item);
  });

  cmsRenderGrid(null, false);
  cmsRenderFreqTable();
  cmsRenderHeavyHitters();

  cmsSetStatus(
    'Streamed ' + stream.length + ' items with Zipfian distribution (' + CMS_WORDS.length + ' distinct words). ' +
    'Top-5 heavy hitters identified using sketch estimates — no per-item exact counts stored.',
    'info'
  );
}

/* ════════════════════════════════════════════
   COLLISION DEMO
   Shrinks width to 4, inserts many items, shows overestimation, then widens back.
════════════════════════════════════════════ */

function cmsRunCollisionDemo() {
  // Step 1: shrink to w=4 and insert 10 items
  var widthSlider = document.getElementById('cmsWidthSlider');
  var widthVal    = document.getElementById('cmsWidthVal');

  cmsWidth = 4;
  if (widthSlider) widthSlider.value = 4;
  if (widthVal) widthVal.textContent = '4 counters / row (narrow — many collisions)';

  cmsFullReset(false);

  var words = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa'];

  // Insert 3 times each so there's a real count to compare against
  words.forEach(function (w) {
    cmsUpdate(w);
    cmsUpdate(w);
    cmsUpdate(w);
  });

  cmsRenderGrid(null, false);
  cmsRenderFreqTable();

  // Query the first item and show the inflated estimate
  var firstResult = cmsQuery('alpha');
  cmsFlashQuery('alpha', firstResult);
  cmsShowEstimate('alpha', firstResult);

  var exact    = cmsExact['alpha'] || 0;
  var estimate = firstResult.estimate;

  cmsSetStatus(
    'Collision demo (w=' + cmsWidth + '): "alpha" true count = ' + exact + ', sketch estimate = ' + estimate + '. ' +
    'Over-estimate = ' + (estimate - exact) + ' caused by hash collisions with other items sharing the same cell. ' +
    'Increase width to reduce collisions.',
    'warn'
  );

  // Step 2: after 2 seconds, widen to 16 and show the improvement
  setTimeout(function () {
    cmsWidth = 16;
    if (widthSlider) widthSlider.value = 16;
    if (widthVal) widthVal.textContent = '16 counters / row';

    cmsFullReset(false);

    words.forEach(function (w) {
      cmsUpdate(w);
      cmsUpdate(w);
      cmsUpdate(w);
    });

    cmsRenderGrid(null, false);
    cmsRenderFreqTable();

    var wideResult   = cmsQuery('alpha');
    var wideEstimate = wideResult.estimate;
    var wideExact    = cmsExact['alpha'] || 0;

    cmsFlashQuery('alpha', wideResult);
    cmsShowEstimate('alpha', wideResult);

    cmsSetStatus(
      'Width increased to 16: "alpha" true count = ' + wideExact + ', sketch estimate now = ' + wideEstimate + '. ' +
      'Over-estimate dropped to ' + (wideEstimate - wideExact) + '. ' +
      'Wider grid → fewer collisions → tighter estimates.',
      'ok'
    );
  }, 2200);
}

/* ════════════════════════════════════════════
   RESET
════════════════════════════════════════════ */

function cmsFullReset(resetSliders) {
  cmsExact = {};
  cmsTotal = 0;
  cmsInitGrid();

  if (resetSliders) {
    cmsDepth = 3;
    cmsWidth = 8;

    var depthSlider = document.getElementById('cmsDepthSlider');
    var widthSlider = document.getElementById('cmsWidthSlider');
    var depthVal    = document.getElementById('cmsDepthVal');
    var widthVal    = document.getElementById('cmsWidthVal');

    if (depthSlider) depthSlider.value = 3;
    if (widthSlider) widthSlider.value = 8;
    if (depthVal) depthVal.textContent = '3 hash functions';
    if (widthVal) widthVal.textContent = '8 counters / row';
  }

  cmsRenderGrid(null, false);
  cmsRenderFreqTable();

  var hhCard = document.getElementById('cmsHHCard');
  if (hhCard) hhCard.style.display = 'none';

  var estCard = document.getElementById('cmsEstimateCard');
  if (estCard) estCard.style.display = 'none';

  cmsSetStatus('Sketch reset. Grid is ' + cmsDepth + '×' + cmsWidth + '. Insert items to begin.', 'info');
}

/* ════════════════════════════════════════════
   UTILITY
════════════════════════════════════════════ */

function cmsEscapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */

function cmsInit() {
  cmsInitGrid();
  cmsRenderGrid(null, false);

  var depthSlider  = document.getElementById('cmsDepthSlider');
  var widthSlider  = document.getElementById('cmsWidthSlider');
  var depthVal     = document.getElementById('cmsDepthVal');
  var widthVal     = document.getElementById('cmsWidthVal');
  var insertInput  = document.getElementById('cmsInsertInput');
  var insertBtn    = document.getElementById('cmsInsertBtn');
  var queryInput   = document.getElementById('cmsQueryInput');
  var queryBtn     = document.getElementById('cmsQueryBtn');
  var heavyBtn     = document.getElementById('cmsHeavyBtn');
  var collisionBtn = document.getElementById('cmsCollisionBtn');
  var resetBtn     = document.getElementById('cmsResetBtn');

  // Depth slider
  if (depthSlider) {
    depthSlider.addEventListener('input', function () {
      cmsDepth = parseInt(depthSlider.value, 10);
      if (depthVal) depthVal.textContent = cmsDepth + ' hash function' + (cmsDepth !== 1 ? 's' : '');
      cmsFullReset(false);
    });
  }

  // Width slider
  if (widthSlider) {
    widthSlider.addEventListener('input', function () {
      cmsWidth = parseInt(widthSlider.value, 10);
      if (widthVal) widthVal.textContent = cmsWidth + ' counters / row';
      cmsFullReset(false);
    });
  }

  // Insert button
  if (insertBtn) {
    insertBtn.addEventListener('click', function () {
      var item = (insertInput ? insertInput.value.trim().toLowerCase() : '');
      cmsDoInsert(item);
    });
  }

  // Insert on Enter key
  if (insertInput) {
    insertInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        cmsDoInsert(insertInput.value.trim().toLowerCase());
      }
    });
  }

  // Query button
  if (queryBtn) {
    queryBtn.addEventListener('click', function () {
      var item = (queryInput ? queryInput.value.trim().toLowerCase() : '');
      cmsDoQuery(item);
    });
  }

  // Query on Enter key
  if (queryInput) {
    queryInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        cmsDoQuery(queryInput.value.trim().toLowerCase());
      }
    });
  }

  // Scenario buttons
  if (heavyBtn)     heavyBtn.addEventListener('click', cmsRunHeavyHitters);
  if (collisionBtn) collisionBtn.addEventListener('click', cmsRunCollisionDemo);
  if (resetBtn)     resetBtn.addEventListener('click', function () { cmsFullReset(true); });
}