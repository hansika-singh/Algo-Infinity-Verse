document.addEventListener('DOMContentLoaded', function () {
  bmvInit();
});

var bmvMode      = 'n2';
var bmvSequence  = [];
var bmvSteps     = [];
var bmvStepIndex = 0;
var bmvPlaying   = false;
var bmvTimer     = null;
var bmvSpeed     = 800;

function bmvBuildStepsN2(seq) {
  var steps    = [];
  var candidate = null;
  var counter   = 0;

  steps.push({
    phase:     'voting',
    current:   -1,
    candidate: null,
    counter:   0,
    event:     'init',
    msg:       'Starting voting pass. candidate = none, counter = 0.',
    logType:   'info',
    tokenStates: new Array(seq.length).fill('idle')
  });

  for (var i = 0; i < seq.length; i++) {
    var el        = seq[i];
    var prevCand  = candidate;
    var prevCount = counter;
    var event;
    var msg;

    if (counter === 0) {
      candidate = el;
      counter   = 1;
      event     = 'replace';
      msg       = 'Counter was 0 → ' + el + ' becomes new candidate. counter = 1.';
    } else if (el === candidate) {
      counter++;
      event = 'match';
      msg   = '"' + el + '" matches candidate "' + candidate + '" → counter = ' + counter + '.';
    } else {
      counter--;
      event = 'mismatch';
      msg   = '"' + el + '" ≠ "' + candidate + '" → counter = ' + counter + '. (cancellation)';
    }

    var tokenStates = seq.map(function (_, j) {
      if (j < i)  return 'done';
      if (j === i) return event === 'replace' ? 'replace' : (event === 'match' ? 'match' : 'mismatch');
      return 'idle';
    });

    steps.push({
      phase:     'voting',
      current:   i,
      candidate: candidate,
      counter:   counter,
      event:     event,
      msg:       msg,
      logType:   event === 'match' ? 'match' : (event === 'replace' ? 'replace' : 'miss'),
      tokenStates: tokenStates
    });
  }

  var finalCandidate = candidate;

  steps.push({
    phase:     'voting_done',
    current:   -1,
    candidate: finalCandidate,
    counter:   counter,
    event:     'done',
    msg:       'Voting pass complete. Surviving candidate: "' + finalCandidate + '". Now running verification pass...',
    logType:   'info',
    tokenStates: new Array(seq.length).fill('done')
  });

  var trueCount = 0;
  for (var k = 0; k < seq.length; k++) {
    if (seq[k] === finalCandidate) trueCount++;
  }

  var runningVerifyCount = 0;
  for (var v = 0; v < seq.length; v++) {
    var isMatch = seq[v] === finalCandidate;
    if (isMatch) runningVerifyCount++;
    var vStates = seq.map(function (_, j) {
      if (j <= v) return seq[j] === finalCandidate ? 'verify-match' : 'verify-other';
      return 'idle';
    });

    steps.push({
      phase:        'verify',
      current:      v,
      candidate:    finalCandidate,
      counter:      counter,
      event:        'verify',
      verifyCount:  runningVerifyCount,
      verifyOf:     seq.length,
      verifyFinal:  trueCount,
      msg:          'Verify [' + (v + 1) + '/' + seq.length + ']: "' + seq[v] + '" — count so far = ' + (seq.slice(0, v + 1).filter(function (x) { return x === finalCandidate; }).length) + '.',
      logType:      'verify',
      tokenStates:  vStates
    });
  }

  var isMaj    = trueCount > seq.length / 2;
  var verdict  = isMaj
    ? '"' + finalCandidate + '" appears ' + trueCount + '/' + seq.length + ' times (' + (trueCount / seq.length * 100).toFixed(1) + '%) — CONFIRMED majority.'
    : '"' + finalCandidate + '" appears ' + trueCount + '/' + seq.length + ' times — does NOT exceed n/2. No majority exists!';

  steps.push({
    phase:       'done',
    current:     -1,
    candidate:   finalCandidate,
    counter:     counter,
    event:       'final',
    isMajority:  isMaj,
    trueCount:   trueCount,
    verifyLines: [{ cand: finalCandidate, count: trueCount, pass: isMaj }],
    msg:         verdict,
    logType:     isMaj ? 'match' : 'miss',
    tokenStates: new Array(seq.length).fill(isMaj ? 'verify-match' : 'done')
  });

  return steps;
}

/* ════════════════════════════════════════════
   STEP BUILDER — n/3
════════════════════════════════════════════ */

function bmvBuildStepsN3(seq) {
  var steps  = [];
  var cand1  = null, cand2 = null;
  var count1 = 0,   count2 = 0;

  steps.push({
    phase: 'voting', current: -1,
    cand1: null, cand2: null, count1: 0, count2: 0,
    event: 'init', msg: 'n/3 mode: tracking two candidates. Both start as null.',
    logType: 'info',
    tokenStates: new Array(seq.length).fill('idle')
  });

  for (var i = 0; i < seq.length; i++) {
    var el  = seq[i];
    var event, msg, box1, box2;

    if (el === cand1) {
      count1++;
      event = 'match1';
      msg   = '"' + el + '" matches cand1 "' + cand1 + '" → count1 = ' + count1 + '.';
      box1  = 'match'; box2 = '';
    } else if (el === cand2) {
      count2++;
      event = 'match2';
      msg   = '"' + el + '" matches cand2 "' + cand2 + '" → count2 = ' + count2 + '.';
      box1  = ''; box2 = 'match';
    } else if (count1 === 0) {
      cand1  = el;
      count1 = 1;
      event  = 'replace1';
      msg    = 'count1 = 0 → "' + el + '" becomes cand1. count1 = 1.';
      box1   = 'replace'; box2 = '';
    } else if (count2 === 0) {
      cand2  = el;
      count2 = 1;
      event  = 'replace2';
      msg    = 'count2 = 0 → "' + el + '" becomes cand2. count2 = 1.';
      box1   = ''; box2 = 'replace';
    } else {
      count1--;
      count2--;
      event = 'decrement';
      msg   = '"' + el + '" matches neither → decrement both. count1 = ' + count1 + ', count2 = ' + count2 + '.';
      box1  = 'mismatch'; box2 = 'mismatch';
    }

    var tokenStates = seq.map(function (_, j) {
      if (j < i)  return 'done';
      if (j === i) return (event.indexOf('match') > -1) ? 'match' : (event.indexOf('replace') > -1 ? 'replace' : 'mismatch');
      return 'idle';
    });

    steps.push({
      phase: 'voting', current: i,
      cand1: cand1, cand2: cand2, count1: count1, count2: count2,
      event: event, msg: msg,
      logType: (event.indexOf('match') > -1) ? 'match' : (event.indexOf('replace') > -1 ? 'replace' : 'miss'),
      box1State: box1, box2State: box2,
      tokenStates: tokenStates
    });
  }

  var fc1 = cand1, fc2 = cand2;

  steps.push({
    phase: 'voting_done', current: -1,
    cand1: fc1, cand2: fc2, count1: count1, count2: count2,
    event: 'done',
    msg: 'Voting done. Candidates: "' + fc1 + '", "' + fc2 + '". Running verification...',
    logType: 'info',
    tokenStates: new Array(seq.length).fill('done')
  });

  var tc1 = seq.filter(function (x) { return x === fc1; }).length;
  var tc2 = seq.filter(function (x) { return x === fc2; }).length;
  var n   = seq.length;

  var verifyLines = [];
  if (fc1 !== null) verifyLines.push({ cand: fc1, count: tc1, pass: tc1 > n / 3 });
  if (fc2 !== null && fc2 !== fc1) verifyLines.push({ cand: fc2, count: tc2, pass: tc2 > n / 3 });

  var verdictParts = verifyLines.map(function (v) {
    return '"' + v.cand + '": ' + v.count + '/' + n + (v.pass ? ' ✓ (>n/3)' : ' ✗ (≤n/3)');
  });

  steps.push({
    phase: 'done', current: -1,
    cand1: fc1, cand2: fc2, count1: count1, count2: count2,
    event: 'final', isMajority: true,
    verifyLines: verifyLines,
    msg: 'Verification: ' + (verdictParts.join(' | ') || 'No candidates.'),
    logType: verifyLines.some(function (v) { return v.pass; }) ? 'match' : 'miss',
    tokenStates: new Array(seq.length).fill('done')
  });

  return steps;
}

/* ════════════════════════════════════════════
   RENDERING
════════════════════════════════════════════ */

function bmvRenderStep() {
  if (!bmvSteps.length) return;

  var step = bmvSteps[bmvStepIndex];

  bmvRenderTokens(step);
  bmvRenderState(step);
  bmvSetStatus(step.msg, step.logType === 'match' ? 'ok' : (step.logType === 'miss' ? 'fail' : (step.logType === 'replace' ? 'info' : 'warn')));
  bmvAddLog(step.msg, step.logType);
  bmvUpdateStepUI();

  if (step.phase === 'done') {
    bmvRenderFrequency();
    if (bmvMode === 'n2') bmvRenderVerify(step);
    if (bmvMode === 'n3') bmvRenderN3Verify(step);
  }
}

function bmvRenderTokens(step) {
  var area = document.getElementById('bmvSeqArea');
  if (!area) return;

  area.innerHTML = bmvSequence.map(function (el, i) {
    var cls = 'bmv-token ' + (step.tokenStates[i] || 'idle');
    return '<div class="' + cls + '">' + bmvEscape(el) + '</div>';
  }).join('');
}

function bmvRenderState(step) {
  var phaseEl = document.getElementById('bmvPhaseBadge');
  var descEl  = document.getElementById('bmvPhaseDesc');

  if (bmvMode === 'n2') {
    var candCard = document.getElementById('bmvCandidateCard');
    if (candCard) candCard.style.display = 'block';

    var n3Card = document.getElementById('bmvN3Card');
    if (n3Card) n3Card.style.display = 'none';

    var candVal  = document.getElementById('bmvCandVal');
    var countVal = document.getElementById('bmvCounterVal');
    var countBar = document.getElementById('bmvCounterBar');
    var candBox  = document.getElementById('bmvCandBox');
    var countBox = document.getElementById('bmvCounterBox');

    if (candVal)  candVal.textContent  = step.candidate !== null ? step.candidate : '—';
    if (countVal) countVal.textContent = step.counter;

    var maxBar = Math.max(bmvSequence.length, 1);
    if (countBar) countBar.style.width = Math.min((step.counter / maxBar) * 100, 100) + '%';

    var boxCls = '';
    if (step.event === 'match')    boxCls = 'pulse-match';
    if (step.event === 'mismatch') boxCls = 'pulse-mismatch';
    if (step.event === 'replace')  boxCls = 'pulse-replace';

    ['pulse-match','pulse-mismatch','pulse-replace'].forEach(function (c) {
      if (candBox)  candBox.classList.remove(c);
      if (countBox) countBox.classList.remove(c);
    });

    if (boxCls && candBox)  candBox.classList.add(boxCls);
    if (boxCls && countBox) countBox.classList.add(boxCls);

    if (phaseEl) {
      if (step.phase === 'voting')      { phaseEl.className = 'bmv-phase-badge'; phaseEl.textContent = 'Voting Pass'; }
      if (step.phase === 'voting_done') { phaseEl.className = 'bmv-phase-badge'; phaseEl.textContent = 'Voting Done'; }
      if (step.phase === 'verify')      { phaseEl.className = 'bmv-phase-badge verify'; phaseEl.textContent = 'Verification Pass'; }
      if (step.phase === 'done') {
        phaseEl.className = 'bmv-phase-badge ' + (step.isMajority ? 'done-ok' : 'done-fail');
        phaseEl.textContent = step.isMajority ? 'Majority Confirmed ✓' : 'No Majority ✗';
      }
    }

    if (descEl) {
      if (step.phase === 'voting')      descEl.textContent = 'Processing element ' + (step.current + 1) + ' of ' + bmvSequence.length + '.';
      if (step.phase === 'voting_done') descEl.textContent = 'Surviving candidate: "' + step.candidate + '". Starting verification...';
      if (step.phase === 'verify')      descEl.textContent = 'Counting occurrences of "' + step.candidate + '"...';
      if (step.phase === 'done')        descEl.textContent = step.isMajority ? 'Majority element found and verified.' : 'Candidate rejected — no majority in this sequence.';
    }

    var verCard = document.getElementById('bmvVerifyCard');
    if (step.phase === 'verify' && verCard) {
      verCard.style.display = 'block';
      var vArea = document.getElementById('bmvVerifyArea');
      if (vArea) {
        var counted = bmvSequence.slice(0, step.current + 1).filter(function (x) { return x === step.candidate; }).length;
        vArea.innerHTML =
          '<div class="bmv-verify-row">' +
            '<span class="bmv-verify-cand">"' + bmvEscape(step.candidate) + '"</span>' +
            '<span class="bmv-verify-count">' + counted + ' / ' + (step.current + 1) + '</span>' +
          '</div>';
      }
    }
  }

  if (bmvMode === 'n3') {
    var c2 = document.getElementById('bmvCandidateCard');
    if (c2) c2.style.display = 'none';

    var n3Card2 = document.getElementById('bmvN3Card');
    if (n3Card2) n3Card2.style.display = 'block';

    var c1El = document.getElementById('bmvN3Cand1');
    var c2El = document.getElementById('bmvN3Cand2');
    var ct1  = document.getElementById('bmvN3Count1');
    var ct2  = document.getElementById('bmvN3Count2');
    var b1   = document.getElementById('bmvN3CandBox1');
    var b2   = document.getElementById('bmvN3CandBox2');

    if (c1El) c1El.textContent = step.cand1 !== null ? step.cand1 : '—';
    if (c2El) c2El.textContent = step.cand2 !== null ? step.cand2 : '—';
    if (ct1)  ct1.textContent  = step.count1 || 0;
    if (ct2)  ct2.textContent  = step.count2 || 0;

    ['pulse-match','pulse-replace','pulse-mismatch'].forEach(function (c) {
      if (b1) b1.classList.remove(c);
      if (b2) b2.classList.remove(c);
    });

    var toClass = function (s) {
      if (s === 'match')   return 'pulse-match';
      if (s === 'replace') return 'pulse-replace';
      if (s === 'mismatch') return 'pulse-mismatch';
      return '';
    };

    if (step.box1State && b1) b1.classList.add(toClass(step.box1State));
    if (step.box2State && b2) b2.classList.add(toClass(step.box2State));

    if (phaseEl) {
      if (step.phase === 'voting')      { phaseEl.className = 'bmv-phase-badge'; phaseEl.textContent = 'n/3 Voting Pass'; }
      if (step.phase === 'voting_done') { phaseEl.className = 'bmv-phase-badge'; phaseEl.textContent = 'Voting Done'; }
      if (step.phase === 'done')        { phaseEl.className = 'bmv-phase-badge done-ok'; phaseEl.textContent = 'Verification'; }
    }

    if (descEl) {
      if (step.phase === 'voting') descEl.textContent = 'Processing element ' + (step.current + 1) + ' of ' + bmvSequence.length + '.';
      if (step.phase === 'done')   descEl.textContent = 'Verification pass complete.';
    }
  }
}

function bmvRenderVerify(step) {
  if (!step.verifyLines) return;
  var card = document.getElementById('bmvVerifyCard');
  var area = document.getElementById('bmvVerifyArea');
  if (!card || !area) return;

  card.style.display = 'block';
  area.innerHTML = step.verifyLines.map(function (v) {
    return (
      '<div class="bmv-verify-row">' +
        '<span class="bmv-verify-cand">"' + bmvEscape(v.cand) + '"</span>' +
        '<span class="bmv-verify-count ' + (v.pass ? 'pass' : 'fail') + '">' + v.count + '/' + bmvSequence.length + '</span>' +
        '<span class="bmv-verify-verdict ' + (v.pass ? 'pass' : 'fail') + '">' + (v.pass ? '✓ Majority' : '✗ Rejected') + '</span>' +
      '</div>'
    );
  }).join('') || '<div class="bmv-verify-row"><span class="bmv-verify-cand">No candidates.</span></div>';
}

function bmvRenderN3Verify(step) {
  if (!step.verifyLines) return;
  var card = document.getElementById('bmvVerifyCard');
  var area = document.getElementById('bmvVerifyArea');
  if (!card || !area) return;

  card.style.display = 'block';
  var n = bmvSequence.length;
  area.innerHTML = '<div class="bmv-phase-desc" style="margin-bottom:.5rem;font-size:.72rem;color:var(--text-secondary)">Elements appearing &gt; n/3 (' + (n / 3).toFixed(1) + ') times:</div>' +
    (step.verifyLines.map(function (v) {
      return (
        '<div class="bmv-verify-row">' +
          '<span class="bmv-verify-cand">"' + bmvEscape(v.cand) + '"</span>' +
          '<span class="bmv-verify-count ' + (v.pass ? 'pass' : 'fail') + '">' + v.count + '/' + n + '</span>' +
          '<span class="bmv-verify-verdict ' + (v.pass ? 'pass' : 'fail') + '">' + (v.pass ? '✓' : '✗') + '</span>' +
        '</div>'
      );
    }).join('') || '<span class="bmv-empty-text">No qualifying elements.</span>');
}

function bmvRenderFrequency() {
  var area = document.getElementById('bmvFreqArea');
  if (!area || !bmvSequence.length) return;

  var freq = Object.create(null);
  bmvSequence.forEach(function (el) { freq[el] = (freq[el] || 0) + 1; });

  var n      = bmvSequence.length;
  var keys   = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a]; });
  var maxC   = freq[keys[0]];
  var thresh = n / (bmvMode === 'n3' ? 3 : 2);

  area.innerHTML = keys.map(function (k) {
    var c    = freq[k];
    var pct  = Math.round((c / maxC) * 100);
    var isMaj = c > thresh;
    return (
      '<div class="bmv-freq-row">' +
        '<span class="bmv-freq-key">' + bmvEscape(k) + '</span>' +
        '<div class="bmv-freq-bar-wrap"><div class="bmv-freq-bar' + (isMaj ? ' majority' : '') + '" style="width:' + pct + '%"></div></div>' +
        '<span class="bmv-freq-count">' + c + '</span>' +
        (isMaj ? '<span class="bmv-majority-tag">' + (bmvMode === 'n3' ? '>n/3' : 'MAJORITY') + '</span>' : '') +
      '</div>'
    );
  }).join('');
}

/* ════════════════════════════════════════════
   LOG
════════════════════════════════════════════ */

function bmvAddLog(msg, type) {
  var log   = document.getElementById('bmvLog');
  if (!log) return;

  var empty = log.querySelector('.bmv-empty-text');
  if (empty) empty.remove();

  var entry = document.createElement('div');
  entry.className = 'bmv-log-entry ' + (type || 'info');
  entry.textContent = '[' + (bmvStepIndex + 1) + '] ' + msg;
  log.insertBefore(entry, log.firstChild);

  while (log.children.length > 60) log.removeChild(log.lastChild);
}

/* ════════════════════════════════════════════
   PLAYBACK
════════════════════════════════════════════ */

function bmvStepForward() {
  if (bmvStepIndex < bmvSteps.length - 1) {
    bmvStepIndex++;
    bmvRenderStep();
  } else {
    bmvPause();
  }
}

function bmvPlay() {
  if (!bmvSteps.length) return;
  bmvPlaying = true;
  var btn = document.getElementById('bmvPlayBtn');
  if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> Pause';

  bmvTimer = setInterval(function () {
    if (bmvStepIndex >= bmvSteps.length - 1) { bmvPause(); return; }
    bmvStepForward();
  }, bmvSpeed);
}

function bmvPause() {
  bmvPlaying = false;
  clearInterval(bmvTimer);
  var btn = document.getElementById('bmvPlayBtn');
  if (btn) btn.innerHTML = '<i class="fas fa-play"></i> Play';
}

function bmvTogglePlay() {
  if (bmvPlaying) bmvPause();
  else bmvPlay();
}

function bmvUpdateStepUI() {
  var counter = document.getElementById('bmvStepCounter');
  var fill    = document.getElementById('bmvStepFill');
  var total   = bmvSteps.length;
  var cur     = total ? bmvStepIndex + 1 : 0;

  if (counter) counter.textContent = 'Step ' + cur + ' / ' + total;
  if (fill) fill.style.width = (total > 1 ? (bmvStepIndex / (total - 1)) * 100 : 0) + '%';
}

function bmvSetStatus(msg, cls) {
  var el = document.getElementById('bmvStatus');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'bmv-status ' + (cls || '');
}

/* ════════════════════════════════════════════
   LOAD / RESET
════════════════════════════════════════════ */

function bmvLoadSequence(rawStr) {
  var tokens = rawStr.trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 2) {
    bmvSetStatus('Please enter at least 2 elements separated by spaces.', 'fail');
    return;
  }
  if (tokens.length > 40) {
    bmvSetStatus('Maximum 40 elements allowed.', 'fail');
    return;
  }

  bmvReset(false);
  bmvSequence = tokens;
  bmvSteps    = bmvMode === 'n3' ? bmvBuildStepsN3(tokens) : bmvBuildStepsN2(tokens);
  bmvStepIndex = 0;
  bmvRenderStep();
  bmvSetStatus('Loaded ' + tokens.length + ' elements. Use Step or Play to walk through the algorithm.', 'warn');
}

function bmvReset(clearSeq) {
  bmvPause();
  if (clearSeq !== false) {
    bmvSequence  = [];
    bmvSteps     = [];
  }
  bmvStepIndex = 0;

  var log = document.getElementById('bmvLog');
  if (log) log.innerHTML = '<span class="bmv-empty-text">Steps appear here.</span>';

  var freq = document.getElementById('bmvFreqArea');
  if (freq) freq.innerHTML = '<span class="bmv-empty-text">Frequencies shown after stream ends.</span>';

  var seqArea = document.getElementById('bmvSeqArea');
  if (seqArea) seqArea.innerHTML = '';

  var verCard = document.getElementById('bmvVerifyCard');
  if (verCard) verCard.style.display = 'none';

  var candVal  = document.getElementById('bmvCandVal');
  var countVal = document.getElementById('bmvCounterVal');
  var countBar = document.getElementById('bmvCounterBar');
  if (candVal)  candVal.textContent  = '—';
  if (countVal) countVal.textContent = '0';
  if (countBar) countBar.style.width = '0%';

  var c1 = document.getElementById('bmvN3Cand1');
  var c2 = document.getElementById('bmvN3Cand2');
  var ct1 = document.getElementById('bmvN3Count1');
  var ct2 = document.getElementById('bmvN3Count2');
  if (c1)  c1.textContent  = '—';
  if (c2)  c2.textContent  = '—';
  if (ct1) ct1.textContent = '0';
  if (ct2) ct2.textContent = '0';

  bmvUpdateStepUI();

  var phBadge = document.getElementById('bmvPhaseBadge');
  var phDesc  = document.getElementById('bmvPhaseDesc');
  if (phBadge) { phBadge.className = 'bmv-phase-badge'; phBadge.textContent = 'Voting Pass'; }
  if (phDesc)  phDesc.textContent = 'Load a sequence and step through the algorithm.';

  bmvSetStatus('Reset. Load a sequence or pick a preset.', 'warn');
}

/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */

function bmvInit() {
  bmvReset(true);

  var modeSeg    = document.getElementById('bmvModeSeg');
  var seqInput   = document.getElementById('bmvSeqInput');
  var loadBtn    = document.getElementById('bmvLoadBtn');
  var presetMaj  = document.getElementById('bmvPresetMajBtn');
  var presetNo   = document.getElementById('bmvPresetNoBtn');
  var presetN3   = document.getElementById('bmvPresetN3Btn');
  var stepBtn    = document.getElementById('bmvStepBtn');
  var playBtn    = document.getElementById('bmvPlayBtn');
  var resetBtn   = document.getElementById('bmvResetBtn');
  var speedEl    = document.getElementById('bmvSpeed');

  if (modeSeg) {
    modeSeg.querySelectorAll('.bmv-seg-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        modeSeg.querySelectorAll('.bmv-seg-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        bmvMode = btn.getAttribute('data-mode');

        var candCard = document.getElementById('bmvCandidateCard');
        var n3Card   = document.getElementById('bmvN3Card');
        if (bmvMode === 'n2') {
          if (candCard) candCard.style.display = 'block';
          if (n3Card)   n3Card.style.display   = 'none';
        } else {
          if (candCard) candCard.style.display = 'none';
          if (n3Card)   n3Card.style.display   = 'block';
        }

        bmvReset(true);
      });
    });
  }

  if (loadBtn) {
    loadBtn.addEventListener('click', function () {
      var val = seqInput ? seqInput.value : '';
      bmvLoadSequence(val);
    });
  }

  if (seqInput) {
    seqInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') bmvLoadSequence(seqInput.value);
    });
  }

  if (presetMaj) {
    presetMaj.addEventListener('click', function () {
      bmvMode = 'n2';
      document.querySelectorAll('#bmvModeSeg .bmv-seg-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-mode') === 'n2');
      });
      var candCard = document.getElementById('bmvCandidateCard');
      var n3Card   = document.getElementById('bmvN3Card');
      if (candCard) candCard.style.display = 'block';
      if (n3Card)   n3Card.style.display   = 'none';
      bmvLoadSequence('A B A C A A B A A');
    });
  }

  if (presetNo) {
    presetNo.addEventListener('click', function () {
      bmvMode = 'n2';
      document.querySelectorAll('#bmvModeSeg .bmv-seg-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-mode') === 'n2');
      });
      var candCard = document.getElementById('bmvCandidateCard');
      var n3Card   = document.getElementById('bmvN3Card');
      if (candCard) candCard.style.display = 'block';
      if (n3Card)   n3Card.style.display   = 'none';
      bmvLoadSequence('A B C A B C A B');
    });
  }

  if (presetN3) {
    presetN3.addEventListener('click', function () {
      bmvMode = 'n3';
      document.querySelectorAll('#bmvModeSeg .bmv-seg-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-mode') === 'n3');
      });
      var candCard = document.getElementById('bmvCandidateCard');
      var n3Card   = document.getElementById('bmvN3Card');
      if (candCard) candCard.style.display = 'none';
      if (n3Card)   n3Card.style.display   = 'block';
      bmvLoadSequence('A A A B B B C C D E');
    });
  }

  if (stepBtn)  stepBtn.addEventListener('click', function () { bmvPause(); bmvStepForward(); });
  if (playBtn)  playBtn.addEventListener('click', bmvTogglePlay);
  if (resetBtn) resetBtn.addEventListener('click', function () { bmvReset(true); });

  if (speedEl) {
    speedEl.addEventListener('input', function () {
      bmvSpeed = parseInt(speedEl.value, 10);
      if (bmvPlaying) { bmvPause(); bmvPlay(); }
    });
  }
}

function bmvEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}