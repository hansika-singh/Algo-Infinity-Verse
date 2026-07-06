// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Complexity Comparator only
// All globals prefixed cc_ or CC_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  ccInit();
});

/* ─── Complexity Definitions ─── */
let CC_COMPLEXITIES = [
  {
    key   : 'o1',
    label : 'O(1)',
    color : '#22c55e',
    rgb   : '34 197 94',
    fn    : function() { return 1; },
    desc  : 'Constant time — independent of input size',
    algos : ['Array index access', 'Hash map get/put', 'Stack push/pop', 'Math operations'],
    visible: true,
  },
  {
    key   : 'ologn',
    label : 'O(log n)',
    color : '#06b6d4',
    rgb   : '6 182 212',
    fn    : function(n) { return Math.log2(n); },
    desc  : 'Logarithmic — halves the problem each step',
    algos : ['Binary Search', 'BST operations', 'Heap insert/delete', 'GCD (Euclidean)'],
    visible: true,
  },
  {
    key   : 'on',
    label : 'O(n)',
    color : '#a855f7',
    rgb   : '168 85 247',
    fn    : function(n) { return n; },
    desc  : 'Linear — processes each element once',
    algos : ['Linear Search', 'Array traversal', 'Counting Sort', 'BFS / DFS'],
    visible: true,
  },
  {
    key   : 'onlogn',
    label : 'O(n log n)',
    color : '#f59e0b',
    rgb   : '245 158 11',
    fn    : function(n) { return n * Math.log2(n); },
    desc  : 'Linearithmic — optimal comparison-based sorting',
    algos : ['Merge Sort', 'Quick Sort (avg)', 'Heap Sort', 'Timsort'],
    visible: true,
  },
  {
    key   : 'on2',
    label : 'O(n²)',
    color : '#f97316',
    rgb   : '249 115 22',
    fn    : function(n) { return n * n; },
    desc  : 'Quadratic — nested loops over input',
    algos : ['Bubble Sort', 'Insertion Sort', 'Selection Sort', 'Naive string matching'],
    visible: true,
  },
  {
    key   : 'on3',
    label : 'O(n³)',
    color : '#ef4444',
    rgb   : '239 68 68',
    fn    : function(n) { return n * n * n; },
    desc  : 'Cubic — triple nested loops',
    algos : ['Floyd-Warshall (all pairs shortest path)', 'Matrix multiplication (naive)', 'Some DP on intervals'],
    visible: true,
  },
  {
    key   : 'o2n',
    label : 'O(2ⁿ)',
    color : '#ec4899',
    rgb   : '236 72 153',
    fn    : function(n) { return Math.pow(2, n); },
    desc  : 'Exponential — doubles with each element added',
    algos : ['Subset enumeration', 'Travelling Salesman (brute force)', 'Bitmask DP', 'N-Queens (naive)'],
    visible: true,
  },
];

/* ─── State ─── */
let ccState = {
  n         : 100,
  logScale  : false,
  canvasW   : 0,
  canvasH   : 0,
};

/* ─── Format number ─── */
function ccFmt(val) {
  if (!isFinite(val) || val > 1e30) return '∞';
  if (val >= 1e24) return (val / 1e24).toFixed(1) + 'Y';
  if (val >= 1e21) return (val / 1e21).toFixed(1) + 'Z';
  if (val >= 1e18) return (val / 1e18).toFixed(1) + 'E';
  if (val >= 1e15) return (val / 1e15).toFixed(1) + 'P';
  if (val >= 1e12) return (val / 1e12).toFixed(1) + 'T';
  if (val >= 1e9)  return (val / 1e9).toFixed(1) + 'B';
  if (val >= 1e6)  return (val / 1e6).toFixed(1) + 'M';
  if (val >= 1e3)  return (val / 1e3).toFixed(1) + 'K';
  return Math.round(val).toString();
}

function ccFmtTime(ops) {
  if (!isFinite(ops) || ops > 1e30) return '∞';
  let sec = ops / 1e9;
  if (sec < 1e-6) return '< 1μs';
  if (sec < 1e-3) return (sec * 1e6).toFixed(1) + 'μs';
  if (sec < 1)    return (sec * 1e3).toFixed(1) + 'ms';
  if (sec < 60)   return sec.toFixed(2) + 's';
  if (sec < 3600) return (sec / 60).toFixed(1) + 'min';
  if (sec < 86400) return (sec / 3600).toFixed(1) + 'hr';
  if (sec < 3.15e7) return (sec / 86400).toFixed(1) + 'days';
  if (sec < 3.15e10) return (sec / 3.15e7).toFixed(1) + 'yrs';
  return '> lifetime';
}

function ccFeasibility(ops) {
  if (!isFinite(ops) || ops > 1e12) return { cls: 'cc-fkey-dead',  icon: '💀', label: 'Infeasible' };
  if (ops > 1e8)                    return { cls: 'cc-fkey-slow',  icon: '⚠️', label: 'Slow' };
  if (ops > 1e6)                    return { cls: 'cc-fkey-ok',    icon: '✅', label: 'OK' };
  return                                   { cls: 'cc-fkey-fast',  icon: '⚡', label: 'Fast' };
}

/* ─── Render Toggles ─── */
function ccRenderToggles() {
  let wrap = document.getElementById('ccToggles');
  if (!wrap) return;

  wrap.innerHTML = CC_COMPLEXITIES.map(function(c) {
    return '<button class="cc-toggle-btn' + (c.visible ? ' active' : '') + '" ' +
           'data-key="' + c.key + '" ' +
           'style="--cc-color:' + c.color + ';--cc-rgb:' + c.rgb + '" ' +
           'aria-pressed="' + c.visible + '">' +
      '<span class="cc-toggle-dot"></span>' + c.label +
    '</button>';
  }).join('');

  wrap.querySelectorAll('.cc-toggle-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      let key = btn.getAttribute('data-key');
      CC_COMPLEXITIES.forEach(function(c) {
        if (c.key === key) c.visible = !c.visible;
      });
      btn.classList.toggle('active');
      btn.setAttribute('aria-pressed', String(btn.classList.contains('active')));
      ccUpdate();
    });
  });
}

/* ─── Render Examples Grid ─── */
function ccRenderExamples() {
  let grid = document.getElementById('ccExamplesGrid');
  if (!grid) return;

  grid.innerHTML = CC_COMPLEXITIES.map(function(c) {
    let algosHtml = c.algos.map(function(a) {
      return '<div class="cc-example-algo">' + a + '</div>';
    }).join('');

    return '<div class="cc-example-card" style="--cc-color:' + c.color + '">' +
      '<div class="cc-example-card" style="display:contents">' +
      '<div class="cc-example-complexity" style="color:' + c.color + '">' + c.label + '</div>' +
      '<div class="cc-example-desc">' + c.desc + '</div>' +
      '<div class="cc-example-algos">' + algosHtml + '</div>' +
    '</div>';
  }).join('');

  // Apply top border gradient
  grid.querySelectorAll('.cc-example-card').forEach(function(card, i) {
    let c = CC_COMPLEXITIES[i];
    if (c) card.style.setProperty('--cc-color', c.color);
    let topBar = document.createElement('div');
    topBar.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:4px;background:' + (c ? c.color : '#f59e0b') + ';border-radius:16px 16px 0 0';
    card.style.position = 'relative';
    card.insertBefore(topBar, card.firstChild);
  });
}

/* ─── Update Table ─── */
function ccUpdateTable(n) {
  let tbody = document.getElementById('ccTableBody');
  let titleN = document.getElementById('ccTableN');
  if (!tbody) return;
  if (titleN) titleN.textContent = 'n = ' + n.toLocaleString();

  // Max ops among visible for bar scaling
  let maxOps = 0;
  CC_COMPLEXITIES.forEach(function(c) {
    if (!c.visible) return;
    let v = c.fn(n);
    if (isFinite(v) && v > maxOps) maxOps = v;
  });
  if (maxOps <= 0) maxOps = 1;

  tbody.innerHTML = CC_COMPLEXITIES.map(function(c) {
    let ops     = c.fn(n);
    let feas    = ccFeasibility(ops);
    let barPct  = !isFinite(ops) || ops > 1e30 ? 100 : Math.min(100, (Math.log(ops + 1) / Math.log(maxOps + 1)) * 100);
    let opsStr  = ccFmt(ops);
    let timeStr = ccFmtTime(ops);
    let algoStr = c.algos.slice(0, 2).join(', ');

    return '<tr class="' + (c.visible ? '' : 'cc-row-hidden') + '">' +
      '<td style="color:' + c.color + '">' + c.label + '</td>' +
      '<td>' +
        '<div class="cc-ops-bar-wrap">' +
          '<div class="cc-ops-bar-track">' +
            '<div class="cc-ops-bar-fill" style="width:' + barPct + '%;background:' + c.color + '"></div>' +
          '</div>' +
          '<span class="cc-ops-val" style="color:' + c.color + '">' + opsStr + '</span>' +
        '</div>' +
      '</td>' +
      '<td class="cc-feasibility-cell ' + feas.cls + '">' + feas.icon + ' ' + feas.label + '</td>' +
      '<td class="cc-timing-cell">' + timeStr + '</td>' +
      '<td class="cc-examples-cell">' + algoStr + '</td>' +
    '</tr>';
  }).join('');
}

/* ─── Annotation ─── */
function ccUpdateAnnotation(n) {
  let el = document.getElementById('ccAnnotationText');
  if (!el) return;

  let o1   = 1;
  let ologn = Math.log2(n);
  let on   = n;
  let onlogn = n * Math.log2(n);
  let on2  = n * n;

  let msg = '';

  if (n <= 10) {
    msg = 'At n = ' + n + ', even O(n²) = ' + ccFmt(on2) + ' operations — everything is fast at tiny inputs. Size doesn\'t matter here yet.';
  } else if (n <= 100) {
    msg = 'At n = ' + n + ': O(n²) = ' + ccFmt(on2) + ' ops is still fine. O(log n) = ' + ologn.toFixed(1) + ' vs O(n) = ' + n + ' — the gap is visible but manageable.';
  } else if (n <= 1000) {
    msg = 'At n = ' + n + ': O(n²) = ' + ccFmt(on2) + ' ops — getting heavy. O(n log n) = ' + ccFmt(onlogn) + ' vs O(n²) = ' + ccFmt(on2) + ' — this is why merge sort beats bubble sort at scale.';
  } else if (n <= 5000) {
    msg = 'At n = ' + n + ': O(n²) = ' + ccFmt(on2) + ' — that\'s ' + ccFmt(on2) + ' operations. At 1 GHz, that\'s ~' + ccFmtTime(on2) + '. O(n log n) = ' + ccFmt(onlogn) + ' — far more efficient.';
  } else {
    msg = 'At n = ' + n.toLocaleString() + ': O(n²) = ' + ccFmt(on2) + ' (~' + ccFmtTime(on2) + ' @1GHz). O(n log n) = ' + ccFmt(onlogn) + '. This is the real-world scale where algorithm choice becomes critical.';
  }

  el.textContent = msg;

  // Danger badge
  let o2n = Math.pow(2, n);
  let badge = document.getElementById('ccDangerBadge');
  if (badge) badge.classList.toggle('visible', !isFinite(o2n) || o2n > 1e15);
}

/* ─── Canvas Chart ─── */
function ccDrawChart(n) {
  let canvas = document.getElementById('ccCanvas');
  if (!canvas) return;
  let wrap = canvas.parentElement;
  let W    = wrap ? wrap.clientWidth : 800;
  let H    = Math.min(400, Math.max(280, W * 0.45));
  canvas.width  = W;
  canvas.height = H;

  let ctx   = canvas.getContext('2d');
  let PAD_L = 60, PAD_R = 20, PAD_T = 20, PAD_B = 40;
  let cW    = W - PAD_L - PAD_R;
  let cH    = H - PAD_T - PAD_B;

  ctx.clearRect(0, 0, W, H);

  // Background grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth   = 1;
  let gridLines = 6;
  for (let i = 0; i <= gridLines; i++) {
    let y = PAD_T + (cH / gridLines) * i;
    ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(PAD_L + cW, y); ctx.stroke();
    let x = PAD_L + (cW / gridLines) * i;
    ctx.beginPath(); ctx.moveTo(x, PAD_T); ctx.lineTo(x, PAD_T + cH); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = 'rgba(148,163,184,0.4)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath(); ctx.moveTo(PAD_L, PAD_T); ctx.lineTo(PAD_L, PAD_T + cH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(PAD_L, PAD_T + cH); ctx.lineTo(PAD_L + cW, PAD_T + cH); ctx.stroke();

  // Axis labels
  ctx.fillStyle    = 'rgba(148,163,184,0.6)';
  ctx.font         = '11px Poppins,sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('n (input size)', PAD_L + cW / 2, H - 14);

  ctx.save();
  ctx.translate(14, PAD_T + cH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Operations', 0, 0);
  ctx.restore();

  // x-axis ticks
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  [0.25, 0.5, 0.75, 1.0].forEach(function(frac) {
    let tx = PAD_L + frac * cW;
    let tv = Math.round(frac * n);
    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.fillText(tv >= 1000 ? (tv / 1000) + 'K' : tv, tx, PAD_T + cH + 6);
  });

  // Compute max visible value for y scaling
  let STEPS  = 200;
  let maxVal = 0;

  CC_COMPLEXITIES.forEach(function(c) {
    if (!c.visible) return;
    for (let s = 1; s <= STEPS; s++) {
      let nx  = Math.max(1, Math.round((s / STEPS) * n));
      let val = c.fn(nx);
      if (isFinite(val) && val > maxVal) maxVal = val;
    }
  });

  if (maxVal <= 0) maxVal = 1;

  // Cap exponential for display
  let displayMax = Math.min(maxVal, 1e15);

  function toY(val) {
    if (!isFinite(val) || val > displayMax) return PAD_T;
    let frac;
    if (ccState.logScale) {
      let logMax = Math.log(displayMax + 1);
      frac = logMax > 0 ? Math.log(val + 1) / logMax : 0;
    } else {
      frac = val / displayMax;
    }
    return PAD_T + cH - Math.min(1, frac) * cH;
  }

  // Y-axis labels
  ctx.textAlign    = 'right';
  ctx.textBaseline = 'middle';
  [0, 0.25, 0.5, 0.75, 1.0].forEach(function(frac) {
    let ty = PAD_T + (1 - frac) * cH;
    let tv = frac * displayMax;
    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.fillText(ccFmt(tv), PAD_L - 6, ty);
  });

  // Current n vertical marker
  let nX = PAD_L + cW;
  ctx.strokeStyle = 'rgba(245,158,11,0.3)';
  ctx.lineWidth   = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(nX, PAD_T); ctx.lineTo(nX, PAD_T + cH); ctx.stroke();
  ctx.setLineDash([]);

  // Draw each complexity line
  CC_COMPLEXITIES.forEach(function(c) {
    if (!c.visible) return;

    ctx.strokeStyle = c.color;
    ctx.lineWidth   = 2.5;
    ctx.shadowColor = c.color;
    ctx.shadowBlur  = 4;
    ctx.beginPath();

    let started = false;
    for (let s = 1; s <= STEPS; s++) {
      let nx2  = Math.max(1, Math.round((s / STEPS) * n));
      let val2 = c.fn(nx2);
      let px   = PAD_L + (s / STEPS) * cW;
      let py   = toY(val2);

      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }

    ctx.stroke();
    ctx.shadowBlur = 0;

    // Dot at current n
    let dotVal = c.fn(n);
    let dotY   = toY(dotVal);
    ctx.beginPath();
    ctx.arc(nX, dotY, 5, 0, Math.PI * 2);
    ctx.fillStyle = c.color;
    ctx.fill();
    ctx.strokeStyle = '#0a0a1a';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Label at dot
    ctx.fillStyle    = c.color;
    ctx.font         = 'bold 10px Fira Code,monospace';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.label, nX + 8, dotY);
  });
}

/* ─── Update everything ─── */
function ccUpdate() {
  let n = ccState.n;
  ccDrawChart(n);
  ccUpdateTable(n);
  ccUpdateAnnotation(n);
}

/* ─── Init ─── */
function ccInit() {
  ccRenderToggles();
  ccRenderExamples();

  let slider   = document.getElementById('ccNSlider');
  let display  = document.getElementById('ccNDisplay');
  let linearBtn = document.getElementById('ccLinearBtn');
  let logBtn   = document.getElementById('ccLogBtn');

  if (slider) {
    slider.addEventListener('input', function() {
      ccState.n = parseInt(slider.value);
      if (display) display.textContent = 'n = ' + ccState.n.toLocaleString();
      ccUpdate();
    });
  }

  if (linearBtn) {
    linearBtn.addEventListener('click', function() {
      ccState.logScale = false;
      linearBtn.classList.add('active');
      if (logBtn) logBtn.classList.remove('active');
      ccUpdate();
    });
  }

  if (logBtn) {
    logBtn.addEventListener('click', function() {
      ccState.logScale = true;
      logBtn.classList.add('active');
      if (linearBtn) linearBtn.classList.remove('active');
      ccUpdate();
    });
  }

  window.addEventListener('resize', function() { ccUpdate(); });

  ccUpdate();
}