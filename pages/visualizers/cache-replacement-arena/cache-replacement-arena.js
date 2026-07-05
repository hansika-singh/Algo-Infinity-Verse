document.addEventListener('DOMContentLoaded', function() {
  craInit();
});

/* ─── Presets ─── */
var CRA_PRESETS = {
  temporal    : '1 2 3 4 1 2 3 4 1 2 3 4 1 2 3',
  scan        : '1 2 3 4 5 6 7 8 9 10 11 12 1 2 3',
  frequency   : '1 1 1 1 2 2 2 3 3 4 1 1 2 2 3 5 1 1',
  workingset  : '1 2 3 4 5 1 2 3 4 5 6 7 8 9 10 1 2 3',
  thrash      : '1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5',
};

var CRA_PRESET_EXPLAIN = {
  temporal    : 'Temporal locality — all four algorithms perform well. LRU is in its element.',
  scan        : 'Sequential scan — LRU is destroyed (cache pollution). ARC and CLOCK survive better.',
  frequency   : 'Frequency skew — LFU wins by tracking exact counts. ARC adapts toward T2.',
  workingset  : 'Working set shift — ARC adapts dynamically. LFU is stuck with old counts.',
  thrash      : 'LRU thrash — trace is just larger than cache. Every access is a miss for LRU.',
};

var CRA_SPEEDS = { 1:800, 2:450, 3:200, 4:80, 5:20 };
var CRA_SPEED_LABELS = { 1:'Slowest', 2:'Slow', 3:'Normal', 4:'Fast', 5:'Blazing' };

/* ─── Global state ─── */
var craState = {
  trace       : [],
  cacheSize   : 6,
  accessIdx   : 0,
  playing     : false,
  timer       : null,
  speed       : 3,
  chartHistory: { lru:[], lfu:[], arc:[], clock:[] },
  caches      : {},
};

/* ─── Parse trace ─── */
function craParsedTrace() {
  var raw = document.getElementById('craTraceInput').value || '';
  return raw.split(/[\s,]+/).map(Number).filter(function(n){ return !isNaN(n) && n > 0; });
}

/* ─────────────────────────────────────────────
   LRU Implementation
   Uses: order array (front = MRU, back = LRU)
───────────────────────────────────────────── */
function craLruCreate(size) {
  return { size: size, order: [], hits: 0, misses: 0, evictions: 0 };
}

function craLruAccess(cache, page) {
  var idx = cache.order.indexOf(page);
  if (idx !== -1) {
    cache.hits++;
    cache.order.splice(idx, 1);
    cache.order.unshift(page);
    return { hit: true, evicted: null };
  }
  cache.misses++;
  var evicted = null;
  if (cache.order.length >= cache.size) {
    evicted = cache.order.pop();
    cache.evictions++;
  }
  cache.order.unshift(page);
  return { hit: false, evicted: evicted };
}

/* ─────────────────────────────────────────────
   LFU Implementation
   Uses: map of page→{freq, lastUsed}
   Evicts: lowest freq; tie → lowest lastUsed
───────────────────────────────────────────── */
function craLfuCreate(size) {
  return { size: size, entries: {}, tick: 0, hits: 0, misses: 0, evictions: 0 };
}

function craLfuAccess(cache, page) {
  cache.tick++;
  if (cache.entries[page] !== undefined) {
    cache.hits++;
    cache.entries[page].freq++;
    cache.entries[page].lastUsed = cache.tick;
    return { hit: true, evicted: null };
  }
  cache.misses++;
  var evicted = null;
  var keys = Object.keys(cache.entries);
  if (keys.length >= cache.size) {
    // Find entry with min freq; tie-break by lastUsed (oldest)
    var victim = keys.reduce(function(a, b) {
      var ea = cache.entries[a]; var eb = cache.entries[b];
      if (ea.freq !== eb.freq) return ea.freq < eb.freq ? a : b;
      return ea.lastUsed < eb.lastUsed ? a : b;
    });
    evicted = parseInt(victim);
    delete cache.entries[victim];
    cache.evictions++;
  }
  cache.entries[page] = { freq: 1, lastUsed: cache.tick };
  return { hit: false, evicted: evicted };
}

/* ─────────────────────────────────────────────
   ARC Implementation
   T1: seen once recently, T2: seen twice+
   B1: ghost of evicted T1, B2: ghost of evicted T2
   target t: how many slots go to T1
───────────────────────────────────────────── */
function craArcCreate(size) {
  return {
    size: size, t: Math.floor(size / 2),
    T1: [], T2: [], B1: [], B2: [],
    hits: 0, misses: 0, evictions: 0
  };
}

function craArcAccess(cache, page) {
  var inT1 = cache.T1.indexOf(page) !== -1;
  var inT2 = cache.T2.indexOf(page) !== -1;

  if (inT1 || inT2) {
    cache.hits++;
    // Move to MRU of T2
    if (inT1) cache.T1.splice(cache.T1.indexOf(page), 1);
    if (inT2) cache.T2.splice(cache.T2.indexOf(page), 1);
    cache.T2.unshift(page);
    return { hit: true, evicted: null, t: cache.t };
  }

  cache.misses++;
  var evicted = null;
  var inB1 = cache.B1.indexOf(page) !== -1;
  var inB2 = cache.B2.indexOf(page) !== -1;

  if (inB1) {
    // Increase T1 target
    var delta1 = cache.B2.length >= cache.B1.length ? 1 : Math.floor(cache.B2.length / Math.max(1, cache.B1.length));
    cache.t = Math.min(cache.size, cache.t + Math.max(1, delta1));
    cache.B1.splice(cache.B1.indexOf(page), 1);
  } else if (inB2) {
    // Decrease T1 target (favor T2)
    var delta2 = cache.B1.length >= cache.B2.length ? 1 : Math.floor(cache.B1.length / Math.max(1, cache.B2.length));
    cache.t = Math.max(0, cache.t - Math.max(1, delta2));
    cache.B2.splice(cache.B2.indexOf(page), 1);
  }

  // Replace: evict from T1 or T2 based on target
  var total = cache.T1.length + cache.T2.length;
  if (total >= cache.size) {
    cache.evictions++;
    if (cache.T1.length > 0 && (cache.T1.length > cache.t || (inB2 && cache.T1.length === cache.t))) {
      evicted = cache.T1.pop();
      cache.B1.unshift(evicted);
      if (cache.B1.length > cache.size) cache.B1.pop();
    } else if (cache.T2.length > 0) {
      evicted = cache.T2.pop();
      cache.B2.unshift(evicted);
      if (cache.B2.length > cache.size) cache.B2.pop();
    } else if (cache.T1.length > 0) {
      evicted = cache.T1.pop();
      cache.B1.unshift(evicted);
      if (cache.B1.length > cache.size) cache.B1.pop();
    }
  }

  cache.T1.unshift(page);
  return { hit: false, evicted: evicted, t: cache.t };
}

/* ─────────────────────────────────────────────
   CLOCK Implementation
   Circular buffer with reference bits
   Hand sweeps, clears bits, evicts first 0
───────────────────────────────────────────── */
function craClockCreate(size) {
  return {
    size: size, slots: new Array(size).fill(null),
    refBits: new Array(size).fill(0),
    hand: 0,
    hits: 0, misses: 0, evictions: 0
  };
}

function craClockAccess(cache, page) {
  // Check if page is in any slot
  var slotIdx = cache.slots.indexOf(page);
  if (slotIdx !== -1) {
    cache.hits++;
    cache.refBits[slotIdx] = 1;
    return { hit: true, evicted: null, hand: cache.hand };
  }

  cache.misses++;
  var evicted = null;

  // Find victim: sweep hand until ref bit is 0
  var maxSweep = cache.size * 2 + 1;
  while (maxSweep-- > 0) {
    if (cache.slots[cache.hand] === null) break; // empty slot
    if (cache.refBits[cache.hand] === 0) break;  // victim found
    cache.refBits[cache.hand] = 0;               // second chance
    cache.hand = (cache.hand + 1) % cache.size;
  }

  if (cache.slots[cache.hand] !== null) {
    evicted = cache.slots[cache.hand];
    cache.evictions++;
  }
  cache.slots[cache.hand] = page;
  cache.refBits[cache.hand] = 1;
  cache.hand = (cache.hand + 1) % cache.size;
  return { hit: false, evicted: evicted, hand: cache.hand };
}

/* ─── Initialize all caches ─── */
function craInitCaches() {
  var size = craState.cacheSize;
  craState.caches = {
    lru  : craLruCreate(size),
    lfu  : craLfuCreate(size),
    arc  : craArcCreate(size),
    clock: craClockCreate(size),
  };
  craState.accessIdx = 0;
  craState.chartHistory = { lru:[], lfu:[], arc:[], clock:[] };
  craRenderAllSlots();
  craUpdateAllStats();
  craDrawChart();
}

/* ─── Access one page across all 4 caches ─── */
function craAccessPage(page) {
  var results = {
    lru  : craLruAccess(craState.caches.lru, page),
    lfu  : craLfuAccess(craState.caches.lfu, page),
    arc  : craArcAccess(craState.caches.arc, page),
    clock: craClockAccess(craState.caches.clock, page),
  };

  craRenderAllSlots(page, results);
  craUpdateAllStats();

  // Chart history: running hit rate
  var algos = ['lru','lfu','arc','clock'];
  algos.forEach(function(algo) {
    var c = craState.caches[algo];
    var total = c.hits + c.misses;
    craState.chartHistory[algo].push(total > 0 ? c.hits / total : 0);
  });
  craDrawChart();

  // Status
  var hitCount = algos.filter(function(a){ return results[a].hit; }).length;
  var pageStr = 'Page ' + page + ' — ';
  var hitters = algos.filter(function(a){ return results[a].hit; }).map(function(a){ return a.toUpperCase(); });
  var missers = algos.filter(function(a){ return !results[a].hit; }).map(function(a){ return a.toUpperCase(); });
  var msg = pageStr;
  if (hitters.length) msg += 'HIT in: ' + hitters.join(', ') + '. ';
  if (missers.length) msg += 'MISS in: ' + missers.join(', ') + '.';
  craSetStatus(msg, hitCount === 4 ? 'hit' : hitCount === 0 ? 'miss' : '');

  // Update access counter
  var numEl = document.getElementById('craAccessNum');
  var totEl = document.getElementById('craAccessTotal');
  var pgEl  = document.getElementById('craCurrentPage');
  if (numEl) numEl.textContent = craState.accessIdx;
  if (totEl) totEl.textContent = craState.trace.length;
  if (pgEl)  pgEl.textContent  = page;
}

/* ─── Render cache slots ─── */
function craRenderAllSlots(page, results) {
  craRenderLruSlots(page, results ? results.lru : null);
  craRenderLfuSlots(page, results ? results.lfu : null);
  craRenderArcSlots(page, results ? results.arc : null);
  craRenderClockSlots(page, results ? results.clock : null);
}

function craRenderLruSlots(page, result) {
  var el = document.getElementById('craSlotsLru');
  if (!el) return;
  var cache = craState.caches.lru;
  var slots = [];
  for (var i = 0; i < cache.size; i++) {
    var val = cache.order[i] !== undefined ? cache.order[i] : null;
    var cls = 'cra-slot';
    if (val === null) cls += ' empty';
    else if (result && result.hit && val === page && i === 0) cls += ' hit';
    else if (result && !result.hit && val === page) cls += ' new';
    else if (result && result.evicted !== null && val === result.evicted) cls += ' evict';
    var meta = i === 0 ? 'MRU' : i === cache.order.length - 1 ? 'LRU' : '';
    slots.push('<div class="' + cls + '"><span class="cra-slot-key">' + (val !== null ? val : '—') + '</span><span class="cra-slot-meta">' + meta + '</span></div>');
  }
  el.innerHTML = slots.join('');
}

function craRenderLfuSlots(page, result) {
  var el = document.getElementById('craSlotsLfu');
  if (!el) return;
  var cache = craState.caches.lfu;
  var entries = Object.keys(cache.entries).map(function(k) {
    return { key: parseInt(k), freq: cache.entries[k].freq, lastUsed: cache.entries[k].lastUsed };
  }).sort(function(a,b){ return b.freq - a.freq || b.lastUsed - a.lastUsed; });

  var slots = [];
  for (var i = 0; i < cache.size; i++) {
    var entry = entries[i] || null;
    var val = entry ? entry.key : null;
    var cls = 'cra-slot';
    if (val === null) cls += ' empty';
    else if (result && result.hit && val === page) cls += ' hit';
    else if (result && !result.hit && val === page) cls += ' new';
    var meta = entry ? 'f=' + entry.freq : '';
    slots.push('<div class="' + cls + '"><span class="cra-slot-key">' + (val !== null ? val : '—') + '</span><span class="cra-slot-meta">' + meta + '</span></div>');
  }
  el.innerHTML = slots.join('');
}

function craRenderArcSlots(page, result) {
  var el = document.getElementById('craSlotsArc');
  if (!el) return;
  var cache = craState.caches.arc;
  var slots = [];
  var size = cache.size;

  // Show T1 and T2 combined (visible cache)
  var visible = [];
  cache.T1.forEach(function(k){ visible.push({ key:k, list:'T1' }); });
  cache.T2.forEach(function(k){ visible.push({ key:k, list:'T2' }); });

  for (var i = 0; i < size; i++) {
    var entry = visible[i] || null;
    var val = entry ? entry.key : null;
    var cls = 'cra-slot';
    if (val === null) cls += ' empty';
    else if (result && result.hit && val === page) cls += ' hit';
    else if (result && !result.hit && val === page) cls += ' new';
    var meta = entry ? entry.list : '';
    slots.push('<div class="' + cls + '"><span class="cra-slot-key">' + (val !== null ? val : '—') + '</span><span class="cra-slot-meta">' + meta + '</span></div>');
  }
  el.innerHTML = slots.join('');

  // Update ARC target bar
  var t = cache.t;
  var t1Pct = Math.round((t / size) * 100);
  var t2Pct = 100 - t1Pct;
  var bar1 = document.getElementById('craArcBarT1');
  var bar2 = document.getElementById('craArcBarT2');
  var tEl  = document.getElementById('craArcT');
  if (bar1) bar1.style.width = t1Pct + '%';
  if (bar2) bar2.style.width = t2Pct + '%';
  if (tEl)  tEl.textContent  = t;
}

function craRenderClockSlots(page, result) {
  var el = document.getElementById('craSlotsClock');
  if (!el) return;
  var cache = craState.caches.clock;
  var hand  = cache.hand === 0 ? cache.size - 1 : cache.hand - 1; // last position the hand was at

  var slots = [];
  for (var i = 0; i < cache.size; i++) {
    var val = cache.slots[i];
    var ref = cache.refBits[i];
    var cls = 'cra-slot';
    if (val === null) cls += ' empty';
    else if (result && result.hit && val === page) cls += ' hit';
    else if (result && !result.hit && val === page) cls += ' new';
    if (i === hand && val !== null) cls += ' clock-hand';

    var refBit = '<span class="cra-ref-bit ' + (ref ? 'on' : 'off') + '">' + ref + '</span>';
    slots.push('<div class="' + cls + '">' + refBit + '<span class="cra-slot-key">' + (val !== null ? val : '—') + '</span><span class="cra-slot-meta">' + (i === hand ? '← hand' : '') + '</span></div>');
  }
  el.innerHTML = slots.join('');

  var handEl = document.getElementById('craClockHand');
  if (handEl) handEl.textContent = cache.hand;
}

/* ─── Update stats displays ─── */
function craUpdateAllStats() {
  ['lru','lfu','arc','clock'].forEach(function(algo) {
    var c = craState.caches[algo];
    var total = c.hits + c.misses;
    var rate  = total > 0 ? Math.round((c.hits / total) * 100) : 0;
    var capAlgo = algo[0].toUpperCase() + algo.slice(1);

    var hitEl    = document.getElementById('craHit' + capAlgo);
    var hitsEl   = document.getElementById('craHits' + capAlgo);
    var missEl   = document.getElementById('craMiss' + capAlgo);
    var evictEl  = document.getElementById('craEvict' + capAlgo);

    if (hitEl)   hitEl.textContent   = rate + '%';
    if (hitsEl)  hitsEl.textContent  = c.hits;
    if (missEl)  missEl.textContent  = c.misses;
    if (evictEl) evictEl.textContent = c.evictions;
  });
}

/* ─── Draw hit rate chart ─── */
function craDrawChart() {
  var canvas = document.getElementById('craChartCanvas');
  if (!canvas) return;
  var wrap = canvas.parentElement;
  canvas.width = wrap.clientWidth; canvas.height = 180;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var W = canvas.width; var H = canvas.height;
  var pad = { top:15, right:15, bottom:25, left:40 };
  var plotW = W - pad.left - pad.right;
  var plotH = H - pad.top - pad.bottom;

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  [0,25,50,75,100].forEach(function(pct) {
    var y = pad.top + (1 - pct/100) * plotH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W-pad.right, y); ctx.stroke();
    ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.font = '8px Fira Code,monospace';
    ctx.textAlign = 'right'; ctx.fillText(pct + '%', pad.left - 4, y + 3);
  });

  var algos = [
    { key:'lru',   color:'#06b6d4' },
    { key:'lfu',   color:'#a855f7' },
    { key:'arc',   color:'#22c55e' },
    { key:'clock', color:'#f59e0b' },
  ];

  var maxLen = Math.max.apply(null, algos.map(function(a){ return craState.chartHistory[a.key].length; }));
  if (maxLen < 2) return;

  algos.forEach(function(algo) {
    var hist = craState.chartHistory[algo.key];
    if (hist.length < 2) return;
    ctx.strokeStyle = algo.color; ctx.lineWidth = 2;
    ctx.beginPath();
    hist.forEach(function(rate, i) {
      var x = pad.left + (i / (maxLen - 1)) * plotW;
      var y = pad.top + (1 - rate) * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Last point dot
    var lastRate = hist[hist.length - 1];
    var lx = pad.left + ((hist.length-1) / (maxLen-1)) * plotW;
    var ly = pad.top + (1 - lastRate) * plotH;
    ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI*2);
    ctx.fillStyle = algo.color; ctx.fill();
  });
}

/* ─── Show verdict ─── */
function craShowVerdict() {
  var algos = ['lru','lfu','arc','clock'];
  var results = algos.map(function(algo) {
    var c = craState.caches[algo];
    var total = c.hits + c.misses;
    return { algo: algo, rate: total > 0 ? c.hits / total : 0, hits: c.hits, misses: c.misses };
  }).sort(function(a,b){ return b.rate - a.rate; });

  var winner = results[0];
  var colors = { lru:'#06b6d4', lfu:'#a855f7', arc:'#22c55e', clock:'#f59e0b' };
  var ranks = ['🥇','🥈','🥉','4th'];

  var card = document.getElementById('craVerdictCard');
  var title = document.getElementById('craVerdictTitle');
  var body  = document.getElementById('craVerdictBody');
  var grid  = document.getElementById('craVerdictGrid');

  if (card) card.classList.remove('hidden');
  if (title) title.textContent = '🏆 Winner: ' + winner.algo.toUpperCase() + ' — ' + Math.round(winner.rate * 100) + '% hit rate';

  // Explanation based on preset
  var traceInput = document.getElementById('craTraceInput').value || '';
  var explanation = 'On this access trace, ' + winner.algo.toUpperCase() + ' achieved the highest hit rate. ';
  if (winner.algo === 'arc') explanation += 'ARC adapted its T1/T2 split dynamically to match the access pattern — a key advantage of its ghost-list mechanism.';
  else if (winner.algo === 'lru') explanation += 'The trace had strong temporal locality, which is exactly what LRU is designed for.';
  else if (winner.algo === 'lfu') explanation += 'The trace had a heavily skewed frequency distribution — a few pages were accessed far more often than others.';
  else if (winner.algo === 'clock') explanation += 'CLOCK\'s second-chance mechanism gave it efficient approximation of LRU with lower overhead.';
  if (body) body.textContent = explanation;

  if (grid) {
    grid.innerHTML = results.map(function(r, i) {
      return '<div class="cra-verdict-item' + (i === 0 ? ' winner' : '') + '">' +
        '<div class="cra-verdict-algo" style="color:' + colors[r.algo] + '">' + r.algo.toUpperCase() + '</div>' +
        '<div class="cra-verdict-pct" style="color:' + colors[r.algo] + '">' + Math.round(r.rate * 100) + '%</div>' +
        '<div class="cra-verdict-rank">' + ranks[i] + ' — ' + r.hits + ' hits / ' + r.misses + ' misses</div>' +
      '</div>';
    }).join('');
  }
}

/* ─── Run / Step ─── */
function craRun() {
  craState.trace = craParsedTrace();
  if (craState.trace.length === 0) { craSetStatus('Enter a valid access trace (space-separated numbers).'); return; }

  craInitCaches();

  var stepBtn = document.getElementById('craStepBtn');
  if (stepBtn) stepBtn.disabled = false;

  // Update totals
  var totEl = document.getElementById('craAccessTotal');
  if (totEl) totEl.textContent = craState.trace.length;

  craState.playing = true;
  craPlayNext();
}

function craPlayNext() {
  if (!craState.playing || craState.accessIdx >= craState.trace.length) {
    craState.playing = false;
    if (craState.accessIdx >= craState.trace.length && craState.trace.length > 0) {
      craSetStatus('Simulation complete. ' + craState.trace.length + ' accesses processed.', 'done');
      craShowVerdict();
    }
    return;
  }
  var page = craState.trace[craState.accessIdx];
  craState.accessIdx++;
  craAccessPage(page);
  craState.timer = setTimeout(craPlayNext, CRA_SPEEDS[craState.speed] || 200);
}

function craStep() {
  if (craState.trace.length === 0) {
    craState.trace = craParsedTrace();
    if (craState.trace.length === 0) { craSetStatus('Enter a valid access trace.'); return; }
    craInitCaches();
    document.getElementById('craAccessTotal').textContent = craState.trace.length;
  }
  if (craState.accessIdx >= craState.trace.length) { craSetStatus('Trace complete. Reset to run again.', 'done'); craShowVerdict(); return; }
  var page = craState.trace[craState.accessIdx];
  craState.accessIdx++;
  craAccessPage(page);
}

function craReset() {
  craState.playing = false;
  if (craState.timer) { clearTimeout(craState.timer); craState.timer = null; }
  craState.trace = craParsedTrace();
  craInitCaches();
  var stepBtn = document.getElementById('craStepBtn');
  if (stepBtn) stepBtn.disabled = false;
  var totEl = document.getElementById('craAccessTotal');
  if (totEl) totEl.textContent = craState.trace.length;
  var numEl = document.getElementById('craAccessNum');
  if (numEl) numEl.textContent = 0;
  var pgEl = document.getElementById('craCurrentPage');
  if (pgEl) pgEl.textContent = '—';
  var verdict = document.getElementById('craVerdictCard');
  if (verdict) verdict.classList.add('hidden');
  craSetStatus('Reset. Click Run All or Step to begin.', '');
}

/* ─── Status ─── */
function craSetStatus(msg, cls) {
  var el = document.getElementById('craStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'cra-status ' + (cls || '');
}

/* ─── Init ─── */
function craInit() {
  // Cache size slider
  var sizeSlider = document.getElementById('craCacheSize');
  if (sizeSlider) {
    sizeSlider.addEventListener('input', function() {
      craState.cacheSize = parseInt(sizeSlider.value);
      var lbl = document.getElementById('craCacheSizeVal');
      if (lbl) lbl.textContent = craState.cacheSize + ' slots';
    });
  }

  // Speed slider
  var speedSlider = document.getElementById('craSpeed');
  if (speedSlider) {
    speedSlider.addEventListener('input', function() {
      craState.speed = parseInt(speedSlider.value);
      var lbl = document.getElementById('craSpeedLabel');
      if (lbl) lbl.textContent = CRA_SPEED_LABELS[craState.speed] || 'Normal';
    });
  }

  // Preset buttons
  document.querySelectorAll('.cra-preset-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.cra-preset-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      var preset = btn.getAttribute('data-preset');
      var input = document.getElementById('craTraceInput');
      if (input) input.value = CRA_PRESETS[preset] || '';
      var explain = CRA_PRESET_EXPLAIN[preset] || '';
      craSetStatus('Preset: ' + btn.textContent + '. ' + explain + ' Click Run All to see all 4 algorithms race.', '');
    });
  });

  // Run / Step / Reset
  var runBtn   = document.getElementById('craRunBtn');
  var stepBtn  = document.getElementById('craStepBtn');
  var resetBtn = document.getElementById('craResetBtn');
  if (runBtn)   runBtn.addEventListener('click', craRun);
  if (stepBtn)  stepBtn.addEventListener('click', craStep);
  if (resetBtn) resetBtn.addEventListener('click', craReset);

  // Initial state
  craState.cacheSize = 6;
  craState.speed = 3;
  craState.trace = craParsedTrace();
  craInitCaches();

  var totEl = document.getElementById('craAccessTotal');
  if (totEl) totEl.textContent = craState.trace.length;

  window.addEventListener('resize', craDrawChart);
}