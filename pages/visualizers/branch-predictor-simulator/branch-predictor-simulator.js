// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Branch Predictor Simulator only
// All globals prefixed bp_ or BP_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  bpInit();
});

/* ─── State ─── */
var bpState = {
  source    : 'pattern',
  pattern   : 'TTTTTTTTTT',
  length    : 20,
  sequence  : [],   // array of 'T'/'N'
  stepIdx   : 0,
  predictors: {},   // keyed by id
};

/* ─── Sequence generators ─── */
function bpGenFromPattern(pattern, length) {
  var seq = [];
  for (var i = 0; i < length; i++) seq.push(pattern[i % pattern.length]);
  return seq;
}

function bpGenRandom(length) {
  var seq = [];
  for (var i = 0; i < length; i++) seq.push(Math.random() < 0.5 ? 'T' : 'N');
  return seq;
}

function bpGenSortedDemo(length) {
  // Simulates if(arr[i] >= threshold) on a SORTED array
  // First half all below threshold (N), second half all above (T)
  var seq = [];
  var threshold = Math.floor(length / 2);
  for (var i = 0; i < length; i++) seq.push(i >= threshold ? 'T' : 'N');
  return seq;
}

function bpGenUnsortedDemo(length) {
  // Random distribution — same ratio of T/N as sorted, but shuffled
  var threshold = Math.floor(length / 2);
  var arr = [];
  for (var i = 0; i < length; i++) arr.push(i >= threshold ? 'T' : 'N');
  // Fisher-Yates shuffle
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

/* ─── Predictor factories ─── */

function bpMakeStatic() {
  return {
    id: 'static',
    predict: function() { return 'T'; }, // static backward-taken: always predict T for this demo
    update: function() {},
    state: function() { return null; },
  };
}

function bpMakeOneBit() {
  var lastOutcome = 'N';
  return {
    id: 'onebit',
    predict: function() { return lastOutcome; },
    update: function(actual) { lastOutcome = actual; },
    state: function() { return lastOutcome; },
  };
}

function bpMakeTwoBit() {
  // States: 0=Strongly NT, 1=Weakly NT, 2=Weakly T, 3=Strongly T
  var counter = 1; // start weakly not-taken
  return {
    id: 'twobit',
    predict: function() { return counter >= 2 ? 'T' : 'N'; },
    update: function(actual) {
      if (actual === 'T') counter = Math.min(3, counter + 1);
      else counter = Math.max(0, counter - 1);
    },
    state: function() { return counter; },
  };
}

function bpMakeTwoLevel() {
  var historyBits = 3;
  var history = '0'.repeat(historyBits); // binary string history of outcomes (0=N,1=T)
  var pht = {}; // pattern -> 2-bit counter (0-3)

  function getCounter(pattern) { if (pht[pattern] === undefined) pht[pattern] = 1; return pht[pattern]; }

  return {
    id: 'twolevel',
    predict: function() { return getCounter(history) >= 2 ? 'T' : 'N'; },
    update: function(actual) {
      var c = getCounter(history);
      if (actual === 'T') c = Math.min(3, c + 1); else c = Math.max(0, c - 1);
      pht[history] = c;
      history = (history + (actual === 'T' ? '1' : '0')).slice(-historyBits);
    },
    state: function() { return { history: history, pht: pht }; },
  };
}

var BP_PRED_FACTORIES = {
  static:   bpMakeStatic,
  onebit:   bpMakeOneBit,
  twobit:   bpMakeTwoBit,
  twolevel: bpMakeTwoLevel,
};

/* ─── Run all predictors over a sequence, return per-predictor results ─── */
function bpRunPredictors(sequence) {
  var results = {};
  Object.keys(BP_PRED_FACTORIES).forEach(function(id) {
    var p = BP_PRED_FACTORIES[id]();
    var hits = 0; var misses = 0; var track = []; var fsmStates = []; var phtSnapshots = [];

    sequence.forEach(function(actual) {
      var pred = p.predict();
      var hit  = pred === actual;
      if (hit) hits++; else misses++;
      track.push(hit ? 'hit' : 'miss');

      p.update(actual);

      if (id === 'twobit') fsmStates.push(p.state());
      if (id === 'twolevel') {
        var st = p.state();
        phtSnapshots.push({ history: st.history, pht: Object.assign({}, st.pht) });
      }
    });
    });

    results[id] = {
      hits: hits,
      misses: misses,
      total: sequence.length,
      accuracy: sequence.length > 0 ? Math.round((hits / sequence.length) * 100) : 0,
      track: track,
      stallCycles: misses * 3, // 3-cycle flush penalty per miss
      fsmStates: fsmStates,
      phtSnapshots: phtSnapshots,
    };
  });
  return results;
}

/* ─── Render sequence row ─── */
function bpRenderSequence(sequence, currentIdx) {
  var row = document.getElementById('bpSequenceRow');
  if (!row) return;
  row.innerHTML = sequence.map(function(outcome, i) {
    var cls = 'bp-seq-cell ' + (outcome === 'T' ? 'bp-taken' : 'bp-nottaken');
    if (i === currentIdx) cls += ' bp-current';
    return '<div class="' + cls + '">' + outcome + '</div>';
  }).join('');
}

/* ─── Render predictor tracks (cumulative up to stepIdx) ─── */
function bpRenderPredictorTracks(results, upToIdx) {
  Object.keys(results).forEach(function(id) {
    var r = results[id];
    var trackEl = document.getElementById('bpTrack' + bpCapFirst(id));
    if (!trackEl) return;

    var visibleTrack = r.track.slice(0, upToIdx);
    trackEl.innerHTML = visibleTrack.map(function(t) {
      return '<div class="bp-track-cell bp-track-' + t + '"></div>';
    }).join('');

    var hits = visibleTrack.filter(function(t){return t==='hit';}).length;
    var misses = visibleTrack.length - hits;
    var acc = visibleTrack.length > 0 ? Math.round(hits/visibleTrack.length*100) : 0;

    var accEl    = document.getElementById('bpAcc' + bpCapFirst(id));
    var hitsEl   = document.getElementById('bpHits' + bpCapFirst(id));
    var missesEl = document.getElementById('bpMisses' + bpCapFirst(id));
    var stallEl  = document.getElementById('bpStall' + bpCapFirst(id));

    if (accEl)    accEl.textContent    = visibleTrack.length > 0 ? acc + '%' : '—';
    if (hitsEl)   hitsEl.textContent   = hits;
    if (missesEl) missesEl.textContent = misses;
    if (stallEl)  stallEl.textContent  = misses * 3;
  });

  // FSM diagram for 2-bit
  if (results.twobit && upToIdx > 0) {
    var curState = results.twobit.fsmStates[upToIdx - 1];
    bpRenderFsm(curState);
  } else {
    bpRenderFsm(1);
  }

  // PHT for two-level
  if (results.twolevel) {
    var snap = upToIdx > 0 ? results.twolevel.phtSnapshots[upToIdx - 1] : { history: '000', pht: {} };
    bpRenderPht(snap);
  }
}

function bpCapFirst(s) { return s[0].toUpperCase() + s.slice(1); }

/* ─── FSM diagram for 2-bit saturating counter ─── */
var BP_FSM_LABELS = ['Strong NT', 'Weak NT', 'Weak T', 'Strong T'];
var BP_FSM_POS    = [ [40,55], [130,55], [220,55], [310,55] ];

function bpRenderFsm(activeState) {
  var svg = document.getElementById('bpFsmSvg');
  if (!svg) return;
  svg.innerHTML = '';

  // Arrows between states (forward = T, backward = N)
  for (var i = 0; i < 3; i++) {
    var x1 = BP_FSM_POS[i][0] + 20; var x2 = BP_FSM_POS[i+1][0] - 20;
    var y  = BP_FSM_POS[i][1];

    var lineT = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    lineT.setAttribute('x1', x1); lineT.setAttribute('y1', y - 6);
    lineT.setAttribute('x2', x2); lineT.setAttribute('y2', y - 6);
    lineT.setAttribute('stroke', '#22c55e'); lineT.setAttribute('stroke-width', '1.5');
    lineT.setAttribute('marker-end', 'url(#bpArrowT)');
    svg.appendChild(lineT);

    var lineN = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    lineN.setAttribute('x1', x2); lineN.setAttribute('y1', y + 6);
    lineN.setAttribute('x2', x1); lineN.setAttribute('y2', y + 6);
    lineN.setAttribute('stroke', '#ef4444'); lineN.setAttribute('stroke-width', '1.5');
    lineN.setAttribute('marker-end', 'url(#bpArrowN)');
    svg.appendChild(lineN);
  }

  // Defs for arrowheads
  var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  ['T','N'].forEach(function(type) {
    var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'bpArrow' + type);
    marker.setAttribute('viewBox', '0 0 8 8'); marker.setAttribute('refX', '7'); marker.setAttribute('refY', '4');
    marker.setAttribute('markerWidth', '5'); marker.setAttribute('markerHeight', '5'); marker.setAttribute('orient', 'auto');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M0,0 L8,4 L0,8 z');
    path.setAttribute('fill', type === 'T' ? '#22c55e' : '#ef4444');
    marker.appendChild(path);
    defs.appendChild(marker);
  });
  svg.insertBefore(defs, svg.firstChild);

  // Nodes
  BP_FSM_POS.forEach(function(pos, i) {
    var isActive = i === activeState;
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', pos[0]); circle.setAttribute('cy', pos[1]); circle.setAttribute('r', '18');
    circle.setAttribute('fill', isActive ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.04)');
    circle.setAttribute('stroke', isActive ? '#06b6d4' : 'rgba(148,163,184,0.3)');
    circle.setAttribute('stroke-width', isActive ? '2.5' : '1.5');
    g.appendChild(circle);

    var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', pos[0]); text.setAttribute('y', pos[1] + 4);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '10'); text.setAttribute('font-weight', '700');
    text.setAttribute('fill', isActive ? '#06b6d4' : 'rgba(148,163,184,0.6)');
    text.setAttribute('font-family', 'Fira Code, monospace');
    text.textContent = i;
    g.appendChild(text);

    var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', pos[0]); label.setAttribute('y', pos[1] + 32);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '7');
    label.setAttribute('fill', 'rgba(148,163,184,0.6)');
    label.setAttribute('font-family', 'Poppins, sans-serif');
    label.textContent = BP_FSM_LABELS[i];
    g.appendChild(label);

    svg.appendChild(g);
  });
}

/* ─── PHT display for two-level ─── */
function bpRenderPht(snap) {
  var wrap = document.getElementById('bpPhtWrap');
  if (!wrap || !snap) return;
  var entries = Object.keys(snap.pht || {});
  if (entries.length === 0) { wrap.innerHTML = '<span style="font-size:0.65rem;color:var(--text-secondary)">No patterns learned yet.</span>'; return; }

  wrap.innerHTML = entries.map(function(pattern) {
    var counter = snap.pht[pattern];
    var isCurrent = pattern === snap.history;
    var style = isCurrent ? 'box-shadow:0 0 6px #a855f7;border-color:#a855f7' : '';
    return '<span class="bp-pht-entry" style="' + style + '">' + pattern + '→' + counter + '</span>';
  }).join('');
}

/* ─── Render pipeline (2-bit predictor) ─── */
function bpRenderPipeline(track) {
  var pipelineEl = document.getElementById('bpPipelineTrack');
  if (!pipelineEl) return;

  pipelineEl.innerHTML = track.map(function(t, i) {
    var cls = t === 'hit' ? 'bp-pipe-hit' : 'bp-pipe-miss';
    var cost = t === 'miss' ? '-3' : '';
    return '<div class="bp-pipe-unit">' +
      '<div class="bp-pipe-box ' + cls + '">' + (i+1) + '</div>' +
      '<div class="bp-pipe-cost">' + cost + '</div>' +
    '</div>';
  }).join('');
}

/* ─── Run full sequence ─── */
function bpRunAll() {
  bpState.stepIdx = bpState.sequence.length; // jump to end
  var results = bpRunPredictors(bpState.sequence);
  bpState.predictors = results;

  bpRenderSequence(bpState.sequence, -1);
  bpRenderPredictorTracks(results, bpState.sequence.length);
  bpRenderPipeline(results.twobit ? results.twobit.track : []);
  bpUpdateStepCounter();

  var stepBtn = document.getElementById('bpStepBtn');
  if (stepBtn) stepBtn.disabled = true;
}

/* ─── Step through one branch at a time ─── */
function bpStep() {
  if (bpState.stepIdx >= bpState.sequence.length) return;

  if (Object.keys(bpState.predictors).length === 0) {
    bpState.predictors = bpRunPredictors(bpState.sequence);
  }

  bpState.stepIdx++;
  bpRenderSequence(bpState.sequence, bpState.stepIdx - 1);
  bpRenderPredictorTracks(bpState.predictors, bpState.stepIdx);
  bpRenderPipeline(bpState.predictors.twobit ? bpState.predictors.twobit.track.slice(0, bpState.stepIdx) : []);
  bpUpdateStepCounter();

  if (bpState.stepIdx >= bpState.sequence.length) {
    var stepBtn = document.getElementById('bpStepBtn');
    if (stepBtn) stepBtn.disabled = true;
  }
}

function bpUpdateStepCounter() {
  var n = document.getElementById('bpStepNum');
  var t = document.getElementById('bpStepTotal');
  if (n) n.textContent = bpState.stepIdx;
  if (t) t.textContent = bpState.sequence.length;
}

/* ─── Build sequence from current settings ─── */
function bpBuildSequence() {
  var length = bpState.length;
  if (bpState.source === 'pattern')   bpState.sequence = bpGenFromPattern(bpState.pattern, length);
  else if (bpState.source === 'random')   bpState.sequence = bpGenRandom(length);
  else if (bpState.source === 'sorted')   bpState.sequence = bpGenSortedDemo(length);
  else if (bpState.source === 'unsorted') bpState.sequence = bpGenUnsortedDemo(length);
}

/* ─── Reset ─── */
function bpReset() {
  bpState.stepIdx    = 0;
  bpState.predictors = {};
  bpBuildSequence();
  bpRenderSequence(bpState.sequence, -1);

  ['static','onebit','twobit','twolevel'].forEach(function(id) {
    var trackEl = document.getElementById('bpTrack' + bpCapFirst(id));
    if (trackEl) trackEl.innerHTML = '';
    var accEl = document.getElementById('bpAcc' + bpCapFirst(id));
    if (accEl) accEl.textContent = '—';
    ['Hits','Misses','Stall'].forEach(function(stat) {
      var el = document.getElementById('bp' + stat + bpCapFirst(id));
      if (el) el.textContent = '0';
    });
  });

  bpRenderFsm(1);
  bpRenderPht({ history: '000', pht: {} });

  var pipelineEl = document.getElementById('bpPipelineTrack');
  if (pipelineEl) pipelineEl.innerHTML = '';

  var stepBtn = document.getElementById('bpStepBtn');
  if (stepBtn) stepBtn.disabled = false;

  bpUpdateStepCounter();
}

/* ─── Sorted vs Unsorted demo ─── */
function bpRunDemo() {
  var demoLength = 30;
  var sortedSeq   = bpGenSortedDemo(demoLength);
  var unsortedSeq = bpGenUnsortedDemo(demoLength);

  var sortedResults   = bpRunPredictors(sortedSeq).twobit;
  var unsortedResults = bpRunPredictors(unsortedSeq).twobit;

  var resultsEl = document.getElementById('bpDemoResults');
  var verdictEl = document.getElementById('bpDemoVerdict');
  if (resultsEl) resultsEl.classList.remove('hidden');
  if (verdictEl) verdictEl.classList.remove('hidden');

  document.getElementById('bpSortedMiss').textContent   = sortedResults.misses;
  document.getElementById('bpSortedAcc').textContent    = sortedResults.accuracy + '%';
  document.getElementById('bpSortedStall').textContent  = sortedResults.stallCycles + ' cycles';

  document.getElementById('bpUnsortedMiss').textContent  = unsortedResults.misses;
  document.getElementById('bpUnsortedAcc').textContent   = unsortedResults.accuracy + '%';
  document.getElementById('bpUnsortedStall').textContent = unsortedResults.stallCycles + ' cycles';

  var speedup = unsortedResults.stallCycles > 0
    ? (unsortedResults.stallCycles / Math.max(1, sortedResults.stallCycles)).toFixed(1)
    : '1.0';

  if (verdictEl) {
    verdictEl.innerHTML = '⚡ On this run: sorted data caused <strong>' + sortedResults.misses + '</strong> mispredictions vs <strong>' + unsortedResults.misses + '</strong> for unsorted — a <strong>' + speedup + '×</strong> difference in wasted pipeline stall cycles, with byte-for-byte identical comparison logic. This is exactly why <code style="font-family:Fira Code,monospace">std::sort(arr, arr+n)</code> before a branch-heavy filter loop can make real code measurably faster.';
  }
}

/* ─── Init ─── */
function bpInit() {
  // Source buttons
  document.querySelectorAll('.bp-source-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.bp-source-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      bpState.source = btn.getAttribute('data-source');

      var patternRow = document.getElementById('bpPatternRow');
      if (patternRow) patternRow.style.display = bpState.source === 'pattern' ? '' : 'none';

      bpReset();
    });
  });

  // Pattern buttons
  document.querySelectorAll('.bp-pattern-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.bp-pattern-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      bpState.pattern = btn.getAttribute('data-pattern');
      bpReset();
    });
  });

  // Length slider
  var lengthSl = document.getElementById('bpLength');
  if (lengthSl) {
    lengthSl.addEventListener('input', function() {
      bpState.length = parseInt(lengthSl.value);
      var lbl = document.getElementById('bpLengthVal');
      if (lbl) lbl.textContent = bpState.length;
      bpReset();
    });
  }

  // Run / Step / Reset
  var runBtn   = document.getElementById('bpRunBtn');
  var stepBtn  = document.getElementById('bpStepBtn');
  var resetBtn = document.getElementById('bpResetBtn');
  if (runBtn)   runBtn.addEventListener('click',   bpRunAll);
  if (stepBtn)  stepBtn.addEventListener('click',  bpStep);
  if (resetBtn) resetBtn.addEventListener('click', bpReset);

  // Demo button
  var demoBtn = document.getElementById('bpDemoRunBtn');
  if (demoBtn) demoBtn.addEventListener('click', bpRunDemo);

  // Initial state
  bpReset();
}