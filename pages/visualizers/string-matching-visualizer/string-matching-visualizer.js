// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: String Matching Visualizer only
// All globals prefixed sm_ or SM_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  smInit();
});

/* ─── Speed map ─── */
let SM_SPEED = { 1: 1200, 2: 700, 3: 400, 4: 180, 5: 60 };
let SM_SPEED_LABEL = { 1: 'Slowest', 2: 'Slow', 3: 'Normal', 4: 'Fast', 5: 'Blazing' };

/* ─── State ─── */
let smState = {
  algo    : 'kmp',
  steps   : [],
  stepIdx : 0,
  playing : false,
  timer   : null,
  matches : [],
};

/* ─── Get inputs ─── */
function smGetText()    { return (document.getElementById('smText')    || {}).value || ''; }
function smGetPattern() { return (document.getElementById('smPattern') || {}).value || ''; }

/* ─── KMP: Build failure function steps ─── */
function smKmpFailure(pat) {
  let m    = pat.length;
  let fail = new Array(m).fill(0);
  let steps = [];
  steps.push({ type: 'fail-start', fail: fail.slice(), msg: 'Building failure function. fail[0] = 0 by definition.' });

  let k = 0;
  for (let i = 1; i < m; i++) {
    while (k > 0 && pat[i] !== pat[k]) {
      steps.push({ type: 'fail-mismatch', i: i, k: k, fail: fail.slice(),
        msg: 'pat[' + i + ']="' + pat[i] + '" ≠ pat[' + k + ']="' + pat[k] + '", fall back: k = fail[' + (k-1) + '] = ' + fail[k-1] });
      k = fail[k - 1];
    }
    if (pat[i] === pat[k]) {
      k++;
      fail[i] = k;
      steps.push({ type: 'fail-match', i: i, k: k - 1, fail: fail.slice(),
        msg: 'pat[' + i + ']="' + pat[i] + '" = pat[' + (k-1) + ']: fail[' + i + '] = ' + k });
    } else {
      fail[i] = 0;
      steps.push({ type: 'fail-zero', i: i, k: 0, fail: fail.slice(),
        msg: 'No match: fail[' + i + '] = 0' });
    }
  }
  return { fail: fail, steps: steps };
}

/* ─── KMP: Search steps ─── */
function smKmpSearch(text, pat) {
  let n    = text.length;
  let m    = pat.length;
  let failRes = smKmpFailure(pat);
  let fail    = failRes.fail;
  let steps   = failRes.steps.slice();
  let matches = [];

  steps.push({ type: 'search-start', msg: 'Failure function complete. Starting search.' });

  let j = 0;
  for (let i = 0; i < n; i++) {
    while (j > 0 && text[i] !== pat[j]) {
      steps.push({ type: 'mismatch', ti: i, pi: j, fail: fail.slice(),
        msg: 'text[' + i + ']="' + text[i] + '" ≠ pat[' + j + ']="' + pat[j] + '". Jump: j = fail[' + (j-1) + '] = ' + fail[j-1] });
      j = fail[j - 1];
    }
    if (text[i] === pat[j]) {
      steps.push({ type: 'match-char', ti: i, pi: j, fail: fail.slice(),
        msg: 'text[' + i + ']="' + text[i] + '" = pat[' + j + ']: match ✓' });
      j++;
    } else {
      steps.push({ type: 'no-match', ti: i, pi: j, fail: fail.slice(),
        msg: 'text[' + i + ']="' + text[i] + '" ≠ pat[' + j + ']="' + pat[j] + '"' });
    }
    if (j === m) {
      let pos = i - m + 1;
      matches.push(pos);
      steps.push({ type: 'found', ti: i, start: pos, fail: fail.slice(), matches: matches.slice(),
        msg: '✅ Pattern found at index ' + pos + '! Reset: j = fail[' + (m-1) + '] = ' + fail[m-1] });
      j = fail[j - 1];
    }
  }

  steps.push({ type: 'done', matches: matches.slice(),
    msg: 'Search complete. ' + matches.length + ' match(es) found: [' + matches.join(', ') + ']' });

  return { steps: steps, matches: matches, fail: fail };
}

/* ─── Z-Algorithm steps ─── */
function smZSearch(text, pat) {
  let combined = pat + '$' + text;
  let n        = combined.length;
  let m        = pat.length;
  let Z        = new Array(n).fill(0);
  let steps    = [];
  let matches  = [];

  steps.push({ type: 'z-start', combined: combined, m: m, Z: Z.slice(),
    msg: 'Concatenate: "' + pat + '$' + text + '". Build Z-array on combined string.' });

  let L = 0, R = 0;
  for (let i = 1; i < n; i++) {
    if (i < R) {
      Z[i] = Math.min(R - i, Z[i - L]);
      steps.push({ type: 'z-box', i: i, L: L, R: R, Z: Z.slice(),
        msg: 'i=' + i + ' inside Z-box [' + L + ',' + R + ']: Z[' + i + '] initialized to min(' + (R-i) + ',' + Z[i-L] + ')=' + Z[i] });
    }

    let zi = Z[i];
    while (i + zi < n && combined[zi] === combined[i + zi]) {
      steps.push({ type: 'z-extend', i: i, zi: zi, Z: Z.slice(),
        msg: 'Extending Z[' + i + ']: combined[' + zi + ']="' + combined[zi] + '" = combined[' + (i+zi) + ']="' + combined[i+zi] + '"' });
      zi++;
    }
    Z[i] = zi;

    if (zi > 0 && i + zi > R) {
      L = i; R = i + zi;
      steps.push({ type: 'z-update-box', i: i, L: L, R: R, Z: Z.slice(),
        msg: 'Update Z-box: L=' + L + ', R=' + R + '. Z[' + i + ']=' + Z[i] });
    } else {
      steps.push({ type: 'z-set', i: i, Z: Z.slice(),
        msg: 'Z[' + i + '] = ' + Z[i] });
    }

    if (Z[i] >= m) {
      let pos = i - m - 1;
      matches.push(pos);
      steps.push({ type: 'found', i: i, start: pos, Z: Z.slice(), matches: matches.slice(),
        msg: '✅ Z[' + i + ']=' + Z[i] + ' ≥ m=' + m + ': pattern found at text index ' + pos });
    }
  }

  steps.push({ type: 'done', matches: matches.slice(), Z: Z.slice(),
    msg: 'Z-algorithm complete. ' + matches.length + ' match(es) at: [' + matches.join(', ') + ']' });

  return { steps: steps, matches: matches, Z: Z, combined: combined };
}

/* ─── Rabin-Karp steps ─── */
function smRKSearch(text, pat) {
  let n      = text.length;
  let m      = pat.length;
  let BASE   = 31;
  let MOD    = 1000003;
  let steps  = [];
  let matches = [];

  if (m > n) {
    steps.push({ type: 'done', matches: [], msg: 'Pattern longer than text.' });
    return { steps: steps, matches: [], patHash: 0, winHash: 0 };
  }

  // Compute pattern hash and first window hash
  function charVal(c) { return c.charCodeAt(0) - 'A'.charCodeAt(0) + 1; }

  let patHash = 0;
  let winHash = 0;
  let power   = 1;

  for (let i = 0; i < m - 1; i++) power = (power * BASE) % MOD;

  for (let i = 0; i < m; i++) {
    patHash = (patHash * BASE + charVal(pat[i]))  % MOD;
    winHash = (winHash * BASE + charVal(text[i])) % MOD;
  }

  steps.push({ type: 'rk-init', patHash: patHash, winHash: winHash, window: 0,
    msg: 'Pattern hash = ' + patHash + '. Initial window [0..' + (m-1) + '] hash = ' + winHash });

  for (let i = 0; i <= n - m; i++) {
    let hashMatch = patHash === winHash;

    if (hashMatch) {
      // Verify character by character
      let spurious = false;
      for (let k = 0; k < m; k++) {
        if (text[i + k] !== pat[k]) { spurious = true; break; }
      }

      if (!spurious) {
        matches.push(i);
        steps.push({ type: 'found', window: i, patHash: patHash, winHash: winHash, matches: matches.slice(),
          msg: '✅ Hash match AND character match: pattern at index ' + i });
      } else {
        steps.push({ type: 'rk-spurious', window: i, patHash: patHash, winHash: winHash,
          msg: 'Hash collision at ' + i + '! (spurious hit) — chars differ. False positive.' });
      }
    } else {
      steps.push({ type: 'rk-no-match', window: i, patHash: patHash, winHash: winHash,
        msg: 'Window[' + i + '..' + (i+m-1) + '] hash=' + winHash + ' ≠ patHash=' + patHash + '. Skip.' });
    }

    // Roll hash
    if (i < n - m) {
      let oldHash = winHash;
      winHash = (BASE * (winHash - charVal(text[i]) * power % MOD + MOD) % MOD + charVal(text[i + m])) % MOD;
      steps.push({ type: 'rk-roll', window: i + 1, patHash: patHash, winHash: winHash, oldHash: oldHash,
        msg: 'Roll hash: remove "' + text[i] + '", add "' + text[i+m] + '". New hash = ' + winHash });
    }
  }

  steps.push({ type: 'done', matches: matches.slice(), patHash: patHash, winHash: winHash,
    msg: 'Rabin-Karp complete. ' + matches.length + ' match(es) at: [' + matches.join(', ') + ']' });

  return { steps: steps, matches: matches, patHash: patHash };
}

/* ─── Render char rows ─── */
function smRenderCharRow(containerId, indexId, str, classes) {
  let row = document.getElementById(containerId);
  let idx = document.getElementById(indexId);
  if (!row) return;

  row.innerHTML = str.split('').map(function(ch, i) {
    let cls = 'sm-char ' + (classes && classes[i] ? classes[i] : '');
    return '<div class="' + cls.trim() + '">' + ch + '</div>';
  }).join('');

  if (idx) {
    idx.innerHTML = str.split('').map(function(ch, i) {
      return '<div class="sm-index">' + i + '</div>';
    }).join('');
  }
}

/* ─── Render aux array ─── */
function smRenderAux(label, chars, values, activeIdx) {
  let titleEl = document.getElementById('smAuxTitle');
  let wrap    = document.getElementById('smAuxWrap');
  if (!titleEl || !wrap) return;
  titleEl.textContent = label;

  // Char row
  let charHtml = chars.split('').map(function(c, i) {
    return '<div class="sm-aux-cell">' + c + '</div>';
  }).join('');

  // Value row
  let valHtml = values.map(function(v, i) {
    let cls = 'sm-aux-cell' + (v !== null && v !== undefined ? ' sm-computed' : '') + (i === activeIdx ? ' sm-active' : '');
    return '<div class="' + cls + '">' + (v !== null && v !== undefined ? v : '') + '</div>';
  }).join('');

  wrap.innerHTML = '<div class="sm-aux-row">' + charHtml + '</div><div class="sm-aux-row">' + valHtml + '</div>';
}

/* ─── Apply KMP step ─── */
function smApplyKmpStep(step, text, pat) {
  let textClasses    = new Array(text.length).fill('');
  let patClasses     = new Array(pat.length).fill('');
  let fail           = step.fail || [];
  let auxVals        = fail.map(function(v) { return v; });
  let activeAuxIdx   = -1;

  let offsetEl = document.getElementById('smOffsetLabel');

  if (step.type === 'fail-start' || step.type === 'fail-match' || step.type === 'fail-mismatch' || step.type === 'fail-zero') {
    // Preprocessing phase — show pattern only
    if (step.i !== undefined) {
      patClasses[step.i] = 'sm-active';
      activeAuxIdx = step.i;
    }
    smRenderCharRow('smPatternRow', 'smPatternIndexRow', pat, patClasses);
    smRenderCharRow('smTextRow', 'smTextIndexRow', text, textClasses);
    smRenderAux('Failure Function (prefix table)', pat, auxVals, activeAuxIdx);
    if (offsetEl) offsetEl.textContent = '— building failure function';

  } else if (step.type === 'search-start') {
    smRenderCharRow('smPatternRow', 'smPatternIndexRow', pat, patClasses);
    smRenderCharRow('smTextRow', 'smTextIndexRow', text, textClasses);
    smRenderAux('Failure Function (complete)', pat, auxVals, -1);
    if (offsetEl) offsetEl.textContent = '';

  } else if (step.type === 'match-char' || step.type === 'no-match' || step.type === 'mismatch') {
    let ti = step.ti; let pi = step.pi;
    // Highlight matched prefix in text and pattern
    let offset = ti - pi;
    if (offsetEl) offsetEl.textContent = 'aligned at text[' + offset + ']';
    for (let k = 0; k < pi; k++) {
      if (offset + k < text.length) textClasses[offset + k] = 'sm-match';
      patClasses[k] = 'sm-match';
    }
    if (step.type === 'match-char') {
      textClasses[ti] = 'sm-active'; patClasses[pi] = 'sm-active';
    } else {
      textClasses[ti] = 'sm-mismatch';
      if (pi < pat.length) patClasses[pi] = 'sm-mismatch';
    }
    smRenderCharRow('smTextRow', 'smTextIndexRow', text, textClasses);
    smRenderCharRow('smPatternRow', 'smPatternIndexRow', pat, patClasses);
    smRenderAux('Failure Function', pat, auxVals, pi);

  } else if (step.type === 'found') {
    let start = step.start;
    for (let k = 0; k < pat.length; k++) textClasses[start + k] = 'sm-found';
    // Also keep previous found positions
    if (step.matches) {
      step.matches.forEach(function(pos) {
        for (let k = 0; k < pat.length; k++) {
          if (pos + k < text.length) textClasses[pos + k] = 'sm-found';
        }
      });
    }
    for (let k = 0; k < pat.length; k++) patClasses[k] = 'sm-found';
    smRenderCharRow('smTextRow', 'smTextIndexRow', text, textClasses);
    smRenderCharRow('smPatternRow', 'smPatternIndexRow', pat, patClasses);
    smRenderAux('Failure Function', pat, auxVals, -1);
    if (offsetEl) offsetEl.textContent = '✅ found at ' + start;

  } else if (step.type === 'done') {
    if (step.matches) {
      step.matches.forEach(function(pos) {
        for (let k = 0; k < pat.length; k++) {
          if (pos + k < text.length) textClasses[pos + k] = 'sm-found';
        }
      });
    }
    smRenderCharRow('smTextRow', 'smTextIndexRow', text, textClasses);
    smRenderCharRow('smPatternRow', 'smPatternIndexRow', pat, patClasses);
    smRenderAux('Failure Function (complete)', pat, auxVals, -1);
    if (offsetEl) offsetEl.textContent = '';
    smUpdateMatches(step.matches || []);
  }

  smUpdateStatus(step);
  if (step.matches) smUpdateMatches(step.matches);
}

/* ─── Apply Z step ─── */
function smApplyZStep(step, text, pat) {
  let combined = step.combined || (pat + '$' + text);
  let m        = pat.length;
  let Z        = step.Z || [];
  let n        = combined.length;

  let combClasses = new Array(n).fill('');
  let offsetEl    = document.getElementById('smOffsetLabel');

  // Highlight Z-box
  if (step.L !== undefined && step.R !== undefined) {
    for (let k = step.L; k < step.R && k < n; k++) combClasses[k] = 'sm-window';
  }

  // Highlight current i
  if (step.i !== undefined) combClasses[step.i] = 'sm-active';

  // Highlight found positions
  if (step.matches) {
    step.matches.forEach(function(pos) {
      let ci = pos + m + 1;
      for (let k = ci; k < ci + m && k < n; k++) combClasses[k] = 'sm-found';
    });
  }

  smRenderCharRow('smTextRow', 'smTextIndexRow', combined, combClasses);

  // Hide pattern row — using text row for combined
  let patRow = document.getElementById('smPatternSection');
  if (patRow) patRow.style.display = 'none';
  if (offsetEl) offsetEl.textContent = '';

  // Aux: Z-array values (only for combined string portion)
  let auxVals = Z.slice(0, n);
  smRenderAux('Z-Array (on "' + pat + '$' + text + '")', combined, auxVals, step.i !== undefined ? step.i : -1);

  smUpdateStatus(step);
  if (step.matches) smUpdateMatches(step.matches);
  if (step.type === 'done') smUpdateMatches(step.matches || []);
}

/* ─── Apply RK step ─── */
function smApplyRkStep(step, text, pat) {
  let n           = text.length;
  let m           = pat.length;
  let textClasses = new Array(n).fill('');
  let patClasses  = new Array(m).fill('');
  let offsetEl    = document.getElementById('smOffsetLabel');

  let win = step.window !== undefined ? step.window : 0;

  // Highlight window
  for (let k = win; k < win + m && k < n; k++) {
    textClasses[k] = step.type === 'found' ? 'sm-found' : step.type === 'rk-spurious' ? 'sm-mismatch' : 'sm-window';
  }

  // Keep previous found
  if (step.matches) {
    step.matches.forEach(function(pos) {
      for (let k = pos; k < pos + m && k < n; k++) textClasses[k] = 'sm-found';
    });
  }

  if (step.type === 'found') {
    for (let k = 0; k < m; k++) patClasses[k] = 'sm-found';
    if (offsetEl) offsetEl.textContent = '✅ found at ' + win;
  } else {
    if (offsetEl) offsetEl.textContent = 'window[' + win + '..' + (win+m-1) + ']';
  }

  smRenderCharRow('smTextRow', 'smTextIndexRow', text, textClasses);
  smRenderCharRow('smPatternRow', 'smPatternIndexRow', pat, patClasses);
  smRenderAux('Pattern chars', pat, pat.split('').map(function() { return null; }), -1);

  // Hash display
  let hashSection = document.getElementById('smHashSection');
  let patHashEl   = document.getElementById('smPatHash');
  let winHashEl   = document.getElementById('smWinHash');
  let hashMatchEl = document.getElementById('smHashMatch');
  if (hashSection) hashSection.classList.remove('hidden');
  if (patHashEl && step.patHash !== undefined) patHashEl.textContent = step.patHash;
  if (winHashEl && step.winHash !== undefined) winHashEl.textContent = step.winHash;
  if (hashMatchEl) {
    let hm = step.patHash === step.winHash;
    hashMatchEl.textContent = step.type === 'done' ? '—' : hm ? '✅ yes' : '❌ no';
    hashMatchEl.style.color = step.type === 'done' ? '' : hm ? '#22c55e' : '#ef4444';
  }

  smUpdateStatus(step);
  if (step.matches) smUpdateMatches(step.matches);
}

/* ─── Status update ─── */
function smUpdateStatus(step) {
  let el = document.getElementById('smStatus');
  if (!el || !step.msg) return;
  el.textContent = step.msg;
  let cls = 'sm-status ';
  if (step.type === 'found')         cls += 'found';
  else if (step.type === 'match-char' || step.type === 'z-extend') cls += 'match';
  else if (step.type === 'mismatch' || step.type === 'no-match' || step.type === 'rk-spurious') cls += 'mismatch';
  else if (step.type === 'done')     cls += 'done';
  else if (step.type.indexOf('fail') !== -1 || step.type.indexOf('z-') !== -1 || step.type.indexOf('rk-') !== -1) cls += 'compute';
  el.className = cls.trim();
}

/* ─── Matches update ─── */
function smUpdateMatches(matches) {
  let el = document.getElementById('smMatchesList');
  if (!el) return;
  if (!matches || matches.length === 0) { el.innerHTML = 'None yet.'; return; }
  el.innerHTML = matches.map(function(pos) {
    return '<span class="sm-match-badge">index ' + pos + '</span>';
  }).join('');
}

/* ─── Step counter ─── */
function smUpdateStepCounter() {
  let n = document.getElementById('smStepNum');
  let t = document.getElementById('smStepTotal');
  if (n) n.textContent = smState.stepIdx;
  if (t) t.textContent = smState.steps.length;
}

/* ─── Playback buttons ─── */
function smUpdatePBBtns() {
  let stepBtn  = document.getElementById('smStepBtn');
  let pauseBtn = document.getElementById('smPauseBtn');
  let has = smState.steps.length > 0;
  if (stepBtn)  stepBtn.disabled  = !has || smState.stepIdx >= smState.steps.length;
  if (pauseBtn) pauseBtn.disabled = !smState.playing;
}

/* ─── Apply step dispatcher ─── */
function smApplyStep(step) {
  let text = smGetText();
  let pat  = smGetPattern();
  if (smState.algo === 'kmp') smApplyKmpStep(step, text, pat);
  else if (smState.algo === 'z') smApplyZStep(step, text, pat);
  else smApplyRkStep(step, text, pat);
  smUpdateStepCounter();
}

/* ─── Playback ─── */
function smGetDelay() {
  let el = document.getElementById('smSpeed');
  return SM_SPEED[el ? el.value : 3] || 400;
}

function smPlay() {
  if (smState.playing) return;
  if (smState.stepIdx >= smState.steps.length) smState.stepIdx = 0;
  smState.playing = true;
  smUpdatePBBtns();
  smPlayNext();
}

function smPlayNext() {
  if (!smState.playing) return;
  if (smState.stepIdx >= smState.steps.length) {
    smState.playing = false;
    smUpdatePBBtns();
    return;
  }
  smApplyStep(smState.steps[smState.stepIdx]);
  smState.stepIdx++;
  smState.timer = setTimeout(smPlayNext, smGetDelay());
}

function smStopPlay() {
  smState.playing = false;
  if (smState.timer) { clearTimeout(smState.timer); smState.timer = null; }
  smUpdatePBBtns();
}

function smStep() {
  if (smState.playing) smStopPlay();
  if (smState.stepIdx >= smState.steps.length) return;
  smApplyStep(smState.steps[smState.stepIdx]);
  smState.stepIdx++;
  smUpdatePBBtns();
}

/* ─── Run ─── */
function smRun() {
  smStopPlay();
  let text = smGetText();
  let pat  = smGetPattern();

  if (!text || !pat) {
    let el = document.getElementById('smStatus');
    if (el) { el.textContent = 'Enter both text and pattern.'; el.className = 'sm-status mismatch'; }
    return;
  }
  if (pat.length > text.length) {
    let el = document.getElementById('smStatus');
    if (el) { el.textContent = 'Pattern is longer than text.'; el.className = 'sm-status mismatch'; }
    return;
  }

  // Reset matches display
  smUpdateMatches([]);

  // Hide/show hash section
  let hashSec = document.getElementById('smHashSection');
  if (hashSec) hashSec.classList.toggle('hidden', smState.algo !== 'rk');

  // Show/hide pattern section for Z
  let patSec = document.getElementById('smPatternSection');
  if (patSec) patSec.style.display = smState.algo === 'z' ? 'none' : '';

  // Generate steps
  let result;
  if (smState.algo === 'kmp')      result = smKmpSearch(text, pat);
  else if (smState.algo === 'z')   result = smZSearch(text, pat);
  else                              result = smRKSearch(text, pat);

  smState.steps   = result.steps;
  smState.stepIdx = 0;
  smState.matches = result.matches;

  // Initial render
  smRenderCharRow('smTextRow',    'smTextIndexRow',    text, []);
  if (smState.algo !== 'z') {
    smRenderCharRow('smPatternRow', 'smPatternIndexRow', pat,  []);
  }

  smUpdateStepCounter();
  smUpdatePBBtns();

  let el = document.getElementById('smStatus');
  if (el) { el.textContent = 'Ready. Press Step or Play to animate.'; el.className = 'sm-status'; }

  // Auto-play
  smPlay();
}

/* ─── Reset ─── */
function smReset() {
  smStopPlay();
  smState.steps   = [];
  smState.stepIdx = 0;
  smState.matches = [];

  let text = smGetText();
  let pat  = smGetPattern();

  smRenderCharRow('smTextRow',    'smTextIndexRow',    text, []);
  smRenderCharRow('smPatternRow', 'smPatternIndexRow', pat,  []);

  let auxWrap = document.getElementById('smAuxWrap');
  if (auxWrap) auxWrap.innerHTML = '';

  let hashSec = document.getElementById('smHashSection');
  if (hashSec) hashSec.classList.add('hidden');

  let patSec = document.getElementById('smPatternSection');
  if (patSec) patSec.style.display = '';

  smUpdateMatches([]);
  smUpdateStepCounter();
  smUpdatePBBtns();

  let el = document.getElementById('smStatus');
  if (el) { el.textContent = 'Select an algorithm and press Run to begin.'; el.className = 'sm-status'; }

  let offsetEl = document.getElementById('smOffsetLabel');
  if (offsetEl) offsetEl.textContent = '';
}

/* ─── Init ─── */
function smInit() {
  // Algorithm buttons
  document.querySelectorAll('.sm-algo-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.sm-algo-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      smState.algo = btn.getAttribute('data-algo');
      smReset();
    });
  });

  // Presets
  document.querySelectorAll('.sm-preset-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      let textEl = document.getElementById('smText');
      let patEl  = document.getElementById('smPattern');
      if (textEl) textEl.value = btn.getAttribute('data-text');
      if (patEl)  patEl.value  = btn.getAttribute('data-pat');
      smReset();
    });
  });

  // Playback buttons
  let runBtn   = document.getElementById('smRunBtn');
  let stepBtn  = document.getElementById('smStepBtn');
  let pauseBtn = document.getElementById('smPauseBtn');
  let resetBtn = document.getElementById('smResetBtn');
  let speedSl  = document.getElementById('smSpeed');

  if (runBtn)   runBtn.addEventListener('click',   smRun);
  if (stepBtn)  stepBtn.addEventListener('click',  smStep);
  if (pauseBtn) pauseBtn.addEventListener('click', smStopPlay);
  if (resetBtn) resetBtn.addEventListener('click', smReset);

  if (speedSl) {
    speedSl.addEventListener('input', function() {
      let lbl = document.getElementById('smSpeedVal');
      if (lbl) lbl.textContent = SM_SPEED_LABEL[speedSl.value] || 'Normal';
      if (smState.playing) { smStopPlay(); smPlay(); }
    });
  }

  // Re-run on input change
  ['smText', 'smPattern'].forEach(function(id) {
    let el = document.getElementById(id);
    if (el) {
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') smRun();
      });
    }
  });

  // Initial render
  smReset();

  // Hide loading screen
  setTimeout(() => {
    const loader = document.getElementById("loading-screen");
    if (loader) loader.classList.add("hidden");
  }, 300);
}