document.addEventListener('DOMContentLoaded', function() {
  craInit();
});

/* ─── Presets ─── */
let CRA_PRESETS = {
  temporal    : '1 2 3 4 1 2 3 4 1 2 3 4 1 2 3',
  scan        : '1 2 3 4 5 6 7 8 9 10 11 12 1 2 3',
  frequency   : '1 1 1 1 2 2 2 3 3 4 1 1 2 2 3 5 1 1',
  workingset  : '1 2 3 4 5 1 2 3 4 5 6 7 8 9 10 1 2 3',
  thrash      : '1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5',
};

let CRA_PRESET_EXPLAIN = {
  temporal    : 'Temporal locality — all four algorithms perform well. LRU is in its element.',
  scan        : 'Sequential scan — LRU is destroyed (cache pollution). ARC and CLOCK survive better.',
  frequency   : 'Frequency skew — LFU wins by tracking exact counts. ARC adapts toward T2.',
  workingset  : 'Working set shift — ARC adapts dynamically. LFU is stuck with old counts.',
  thrash      : 'LRU thrash — trace is just larger than cache. Every access is a miss for LRU.',
};

let CRA_SPEEDS = { 1:800, 2:450, 3:200, 4:80, 5:20 };
let CRA_SPEED_LABELS = { 1:'Slowest', 2:'Slow', 3:'Normal', 4:'Fast', 5:'Blazing' };

/* ─── Global state ─── */
let craState = {
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
  let raw = document.getElementById('craTraceInput').value || '';
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
  let idx = cache.order.indexOf(page);
  if (idx !== -1) {
    cache.hits++;
    cache.order.splice(idx, 1);
    cache.order.unshift(page);
    return { hit: true, evicted: null };
  }
  cache.misses++;
  let evicted = null;
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
  let evicted = null;
  let keys = Object.keys(cache.entries);
  if (keys.length >= cache.size) {
    // Find entry with min freq; tie-break by lastUsed (oldest)
    let victim = keys.reduce(function(a, b) {
      let ea = cache.entries[a]; let eb = cache.entries[b];
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
  let inT1 = cache.T1.indexOf(page) !== -1;
  let inT2 = cache.T2.indexOf(page) !== -1;

  if (inT1 || inT2) {
    cache.hits++;
    // Move to MRU of T2
    if (inT1) cache.T1.splice(cache.T1.indexOf(page), 1);
    if (inT2) cache.T2.splice(cache.T2.indexOf(page), 1);
    cache.T2.unshift(page);
    return { hit: true, evicted: null, t: cache.t };
  }

  cache.misses++;
  let evicted = null;
  let inB1 = cache.B1.indexOf(page) !== -1;
  let inB2 = cache.B2.indexOf(page) !== -1;

  if (inB1) {
    // Increase T1 target
    let delta1 = cache.B2.length >= cache.B1.length ? 1 : Math.floor(cache.B2.length / Math.max(1, cache.B1.length));
    cache.t = Math.min(cache.size, cache.t + Math.max(1, delta1));
    cache.B1.splice(cache.B1.indexOf(page), 1);
  } else if (inB2) {
    // Decrease T1 target (favor T2)
    let delta2 = cache.B1.length >= cache.B2.length ? 1 : Math.floor(cache.B1.length / Math.max(1, cache.B2.length));
    cache.t = Math.max(0, cache.t - Math.max(1, delta2));
    cache.B2.splice(cache.B2.indexOf(page), 1);
  }

  // Replace: evict from T1 or T2 based on target
  let total = cache.T1.length + cache.T2.length;
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
  let slotIdx = cache.slots.indexOf(page);
  if (slotIdx !== -1) {
    cache.hits++;
    cache.refBits[slotIdx] = 1;
    return { hit: true, evicted: null, hand: cache.hand };
  }

  cache.misses++;
  let evicted = null;

  // Find victim: sweep hand until ref bit is 0
  let maxSweep = cache.size * 2 + 1;
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
  let size = craState.cacheSize;
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
  let results = {
    lru  : craLruAccess(craState.caches.lru, page),
    lfu  : craLfuAccess(craState.caches.lfu, page),
    arc  : craArcAccess(craState.caches.arc, page),
    clock: craClockAccess(craState.caches.clock, page),
  };

  craRenderAllSlots(page, results);
  craUpdateAllStats();

  // Chart history: running hit rate
  let algos = ['lru','lfu','arc','clock'];
  algos.forEach(function(algo) {
    let c = craState.caches[algo];
    let total = c.hits + c.misses;
    craState.chartHistory[algo].push(total > 0 ? c.hits / total : 0);
  });
  craDrawChart();

  // Status
  let hitCount = algos.filter(function(a){ return results[a].hit; }).length;
  let pageStr = 'Page ' + page + ' — ';
  let hitters = algos.filter(function(a){ return results[a].hit; }).map(function(a){ return a.toUpperCase(); });
  let missers = algos.filter(function(a){ return !results[a].hit; }).map(function(a){ return a.toUpperCase(); });
  let msg = pageStr;
  if (hitters.length) msg += 'HIT in: ' + hitters.join(', ') + '. ';
  if (missers.length) msg += 'MISS in: ' + missers.join(', ') + '.';
  craSetStatus(msg, hitCount === 4 ? 'hit' : hitCount === 0 ? 'miss' : '');

  // Update access counter
  let numEl = document.getElementById('craAccessNum');
  let totEl = document.getElementById('craAccessTotal');
  let pgEl  = document.getElementById('craCurrentPage');
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
  let el = document.getElementById('craSlotsLru');
  if (!el) return;
  let cache = craState.caches.lru;
  let slots = [];
  for (let i = 0; i < cache.size; i++) {
    let val = cache.order[i] !== undefined ? cache.order[i] : null;
    let cls = 'cra-slot';
    if (val === null) cls += ' empty';
    else if (result && result.hit && val === page && i === 0) cls += ' hit';
    else if (result && !result.hit && val === page) cls += ' new';
    else if (result && result.evicted !== null && val === result.evicted) cls += ' evict';
    let meta = i === 0 ? 'MRU' : i === cache.order.length - 1 ? 'LRU' : '';
    slots.push('<div class="' + cls + '"><span class="cra-slot-key">' + (val !== null ? val : '—') + '</span><span class="cra-slot-meta">' + meta + '</span></div>');
  }
  el.innerHTML = slots.join('');
}

function craRenderLfuSlots(page, result) {
  let el = document.getElementById('craSlotsLfu');
  if (!el) return;
  let cache = craState.caches.lfu;
  let entries = Object.keys(cache.entries).map(function(k) {
    return { key: parseInt(k), freq: cache.entries[k].freq, lastUsed: cache.entries[k].lastUsed };
  }).sort(function(a,b){ return b.freq - a.freq || b.lastUsed - a.lastUsed; });

  let slots = [];
  for (let i = 0; i < cache.size; i++) {
    let entry = entries[i] || null;
    let val = entry ? entry.key : null;
    let cls = 'cra-slot';
    if (val === null) cls += ' empty';
    else if (result && result.hit && val === page) cls += ' hit';
    else if (result && !result.hit && val === page) cls += ' new';
    let meta = entry ? 'f=' + entry.freq : '';
    slots.push('<div class="' + cls + '"><span class="cra-slot-key">' + (val !== null ? val : '—') + '</span><span class="cra-slot-meta">' + meta + '</span></div>');
  }
  el.innerHTML = slots.join('');
}

function craRenderArcSlots(page, result) {
  let el = document.getElementById('craSlotsArc');
  if (!el) return;
  let cache = craState.caches.arc;
  let slots = [];
  let size = cache.size;

  // Show T1 and T2 combined (visible cache)
  let visible = [];
  cache.T1.forEach(function(k){ visible.push({ key:k, list:'T1' }); });
  cache.T2.forEach(function(k){ visible.push({ key:k, list:'T2' }); });

  for (let i = 0; i < size; i++) {
    let entry = visible[i] || null;
    let val = entry ? entry.key : null;
    let cls = 'cra-slot';
    if (val === null) cls += ' empty';
    else if (result && result.hit && val === page) cls += ' hit';
    else if (result && !result.hit && val === page) cls += ' new';
    let meta = entry ? entry.list : '';
    slots.push('<div class="' + cls + '"><span class="cra-slot-key">' + (val !== null ? val : '—') + '</span><span class="cra-slot-meta">' + meta + '</span></div>');
  }
  el.innerHTML = slots.join('');

  // Update ARC target bar
  let t = cache.t;
  let t1Pct = Math.round((t / size) * 100);
  let t2Pct = 100 - t1Pct;
  let bar1 = document.getElementById('craArcBarT1');
  let bar2 = document.getElementById('craArcBarT2');
  let tEl  = document.getElementById('craArcT');
  if (bar1) bar1.style.width = t1Pct + '%';
  if (bar2) bar2.style.width = t2Pct + '%';
  if (tEl)  tEl.textContent  = t;
}

function craRenderClockSlots(page, result) {
  let el = document.getElementById('craSlotsClock');
  if (!el) return;
  let cache = craState.caches.clock;
  let hand  = cache.hand === 0 ? cache.size - 1 : cache.hand - 1; // last position the hand was at

  let slots = [];
  for (let i = 0; i < cache.size; i++) {
    let val = cache.slots[i];
    let ref = cache.refBits[i];
    let cls = 'cra-slot';
    if (val === null) cls += ' empty';
    else if (result && result.hit && val === page) cls += ' hit';
    else if (result && !result.hit && val === page) cls += ' new';
    if (i === hand && val !== null) cls += ' clock-hand';

    let refBit = '<span class="cra-ref-bit ' + (ref ? 'on' : 'off') + '">' + ref + '</span>';
    slots.push('<div class="' + cls + '">' + refBit + '<span class="cra-slot-key">' + (val !== null ? val : '—') + '</span><span class="cra-slot-meta">' + (i === hand ? '← hand' : '') + '</span></div>');
  }
  el.innerHTML = slots.join('');

  let handEl = document.getElementById('craClockHand');
  if (handEl) handEl.textContent = cache.hand;
}

/* ─── Update stats displays ─── */
function craUpdateAllStats() {
  ['lru','lfu','arc','clock'].forEach(function(algo) {
    let c = craState.caches[algo];
    let total = c.hits + c.misses;
    let rate  = total > 0 ? Math.round((c.hits / total) * 100) : 0;
    let capAlgo = algo[0].toUpperCase() + algo.slice(1);

    let hitEl    = document.getElementById('craHit' + capAlgo);
    let hitsEl   = document.getElementById('craHits' + capAlgo);
    let missEl   = document.getElementById('craMiss' + capAlgo);
    let evictEl  = document.getElementById('craEvict' + capAlgo);

    if (hitEl)   hitEl.textContent   = rate + '%';
    if (hitsEl)  hitsEl.textContent  = c.hits;
    if (missEl)  missEl.textContent  = c.misses;
    if (evictEl) evictEl.textContent = c.evictions;
  });
}

/* ─── Draw hit rate chart ─── */
function craDrawChart() {
  let canvas = document.getElementById('craChartCanvas');
  if (!canvas) return;
  let wrap = canvas.parentElement;
  canvas.width = wrap.clientWidth; canvas.height = 180;
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let W = canvas.width; let H = canvas.height;
  let pad = { top:15, right:15, bottom:25, left:40 };
  let plotW = W - pad.left - pad.right;
  let plotH = H - pad.top - pad.bottom;

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  [0,25,50,75,100].forEach(function(pct) {
    let y = pad.top + (1 - pct/100) * plotH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W-pad.right, y); ctx.stroke();
    ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.font = '8px Fira Code,monospace';
    ctx.textAlign = 'right'; ctx.fillText(pct + '%', pad.left - 4, y + 3);
  });

  let algos = [
    { key:'lru',   color:'#06b6d4' },
    { key:'lfu',   color:'#a855f7' },
    { key:'arc',   color:'#22c55e' },
    { key:'clock', color:'#f59e0b' },
  ];

  let maxLen = Math.max.apply(null, algos.map(function(a){ return craState.chartHistory[a.key].length; }));
  if (maxLen < 2) return;

  algos.forEach(function(algo) {
    let hist = craState.chartHistory[algo.key];
    if (hist.length < 2) return;
    ctx.strokeStyle = algo.color; ctx.lineWidth = 2;
    ctx.beginPath();
    hist.forEach(function(rate, i) {
      let x = pad.left + (i / (maxLen - 1)) * plotW;
      let y = pad.top + (1 - rate) * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Last point dot
    let lastRate = hist[hist.length - 1];
    let lx = pad.left + ((hist.length-1) / (maxLen-1)) * plotW;
    let ly = pad.top + (1 - lastRate) * plotH;
    ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI*2);
    ctx.fillStyle = algo.color; ctx.fill();
  });
}

/* ─── Show verdict ─── */
function craShowVerdict() {
  let algos = ['lru','lfu','arc','clock'];
  let results = algos.map(function(algo) {
    let c = craState.caches[algo];
    let total = c.hits + c.misses;
    return { algo: algo, rate: total > 0 ? c.hits / total : 0, hits: c.hits, misses: c.misses };
  }).sort(function(a,b){ return b.rate - a.rate; });

  let winner = results[0];
  let colors = { lru:'#06b6d4', lfu:'#a855f7', arc:'#22c55e', clock:'#f59e0b' };
  let ranks = ['🥇','🥈','🥉','4th'];

  let card = document.getElementById('craVerdictCard');
  let title = document.getElementById('craVerdictTitle');
  let body  = document.getElementById('craVerdictBody');
  let grid  = document.getElementById('craVerdictGrid');

  if (card) card.classList.remove('hidden');
  if (title) title.textContent = '🏆 Winner: ' + winner.algo.toUpperCase() + ' — ' + Math.round(winner.rate * 100) + '% hit rate';

  // Explanation based on preset
  let traceInput = document.getElementById('craTraceInput').value || '';
  let explanation = 'On this access trace, ' + winner.algo.toUpperCase() + ' achieved the highest hit rate. ';
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

  let stepBtn = document.getElementById('craStepBtn');
  if (stepBtn) stepBtn.disabled = false;

  // Update totals
  let totEl = document.getElementById('craAccessTotal');
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
  let page = craState.trace[craState.accessIdx];
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
  let page = craState.trace[craState.accessIdx];
  craState.accessIdx++;
  craAccessPage(page);
}

function craReset() {
  craState.playing = false;
  if (craState.timer) { clearTimeout(craState.timer); craState.timer = null; }
  craState.trace = craParsedTrace();
  craInitCaches();
  let stepBtn = document.getElementById('craStepBtn');
  if (stepBtn) stepBtn.disabled = false;
  let totEl = document.getElementById('craAccessTotal');
  if (totEl) totEl.textContent = craState.trace.length;
  let numEl = document.getElementById('craAccessNum');
  if (numEl) numEl.textContent = 0;
  let pgEl = document.getElementById('craCurrentPage');
  if (pgEl) pgEl.textContent = '—';
  let verdict = document.getElementById('craVerdictCard');
  if (verdict) verdict.classList.add('hidden');
  craSetStatus('Reset. Click Run All or Step to begin.', '');
}

/* ─── Status ─── */
function craSetStatus(msg, cls) {
  let el = document.getElementById('craStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'cra-status ' + (cls || '');
}

/* ─── Init ─── */
function craInit() {
  // Cache size slider
  let sizeSlider = document.getElementById('craCacheSize');
  if (sizeSlider) {
    sizeSlider.addEventListener('input', function() {
      craState.cacheSize = parseInt(sizeSlider.value);
      let lbl = document.getElementById('craCacheSizeVal');
      if (lbl) lbl.textContent = craState.cacheSize + ' slots';
    });
  }

  // Speed slider
  let speedSlider = document.getElementById('craSpeed');
  if (speedSlider) {
    speedSlider.addEventListener('input', function() {
      craState.speed = parseInt(speedSlider.value);
      let lbl = document.getElementById('craSpeedLabel');
      if (lbl) lbl.textContent = CRA_SPEED_LABELS[craState.speed] || 'Normal';
    });
  }

  // Preset buttons
  document.querySelectorAll('.cra-preset-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.cra-preset-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      let preset = btn.getAttribute('data-preset');
      let input = document.getElementById('craTraceInput');
      if (input) input.value = CRA_PRESETS[preset] || '';
      let explain = CRA_PRESET_EXPLAIN[preset] || '';
      craSetStatus('Preset: ' + btn.textContent + '. ' + explain + ' Click Run All to see all 4 algorithms race.', '');
    });
  });

  // Run / Step / Reset
  let runBtn   = document.getElementById('craRunBtn');
  let stepBtn  = document.getElementById('craStepBtn');
  let resetBtn = document.getElementById('craResetBtn');
  if (runBtn)   runBtn.addEventListener('click', craRun);
  if (stepBtn)  stepBtn.addEventListener('click', craStep);
  if (resetBtn) resetBtn.addEventListener('click', craReset);

  // Initial state
  craState.cacheSize = 6;
  craState.speed = 3;
  craState.trace = craParsedTrace();
  craInitCaches();

  let totEl = document.getElementById('craAccessTotal');
  if (totEl) totEl.textContent = craState.trace.length;

  window.addEventListener('resize', craDrawChart);
}