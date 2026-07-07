document.addEventListener('DOMContentLoaded', () => { kmpInit(); });

const KMP_SPEED_MAP = { 1: 1100, 2: 700, 3: 420, 4: 220, 5: 80 };

const kmpState = { mode: 'idle', steps: [], stepIndex: 0, playing: false, timer: null, pattern: '', text: '', lps: [], matches: [], currentFound: -1 };

function kmpGetPattern() { return document.getElementById('kmpPatternInput')?.value?.trim() ?? ''; }
function kmpGetText() { return document.getElementById('kmpTextInput')?.value?.trim() ?? ''; }

function kmpBuildLps(pattern) {
  const lps = new Array(pattern.length).fill(0);
  const steps = [];
  let len = 0;
  let i = 1;
  steps.push({ pattern, text: '', lps: lps.slice(), i: 0, j: 0, message: 'Starting LPS computation. lps[0] = 0 by definition.' });
  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) { len += 1; lps[i] = len; steps.push({ pattern, text: '', lps: lps.slice(), i, j: len, message: `Comparing pattern[${i}] and pattern[${len - 1}] Characters match Increase len Set LPS[${i}]=${len}` }); i += 1; continue; }
    if (len !== 0) { const fallback = lps[len - 1]; steps.push({ pattern, text: '', lps: lps.slice(), i, j: len, message: `Mismatch Fallback from len=${len} Move to LPS[${len - 1}]=${fallback}` }); len = fallback; continue; }
    lps[i] = 0; steps.push({ pattern, text: '', lps: lps.slice(), i, j: 0, message: `Mismatch at pattern[${i}] and pattern[0]. Set LPS[${i}]=0` }); i += 1;
  }
  steps.push({ pattern, text: '', lps: lps.slice(), i: pattern.length - 1, j: len, message: 'LPS computation complete.' });
  return { steps, lps };
}

function kmpBuildMatchSteps(text, pattern, lps) {
  const steps = [];
  const matches = [];
  let i = 0;
  let j = 0;
  steps.push({ pattern, text, lps: lps.slice(), i: 0, j: 0, message: 'Starting KMP matching. Compare text against the pattern using the computed LPS array.' });
  while (i < text.length) {
    if (text[i] === pattern[j]) {
      steps.push({ pattern, text, lps: lps.slice(), i, j, message: `Comparing text[${i}] and pattern[${j}] Characters match Move both pointers forward` });
      i += 1; j += 1;
      if (j === pattern.length) { const foundAt = i - j; matches.push(foundAt); steps.push({ pattern, text, lps: lps.slice(), i: i - 1, j: j - 1, message: `Pattern found at index ${foundAt}. Reset j using LPS[${j - 1}] = ${lps[j - 1]}`, foundAt }); j = lps[j - 1]; }
      continue;
    }
    steps.push({ pattern, text, lps: lps.slice(), i, j, message: `Mismatch comparing text[${i}] and pattern[${j}]` });
    if (j !== 0) { const fallback = lps[j - 1]; steps.push({ pattern, text, lps: lps.slice(), i, j, message: `Fallback from len=${j} Move pattern pointer to LPS[${j - 1}] = ${fallback}` }); j = fallback; } else { steps.push({ pattern, text, lps: lps.slice(), i, j, message: `Mismatch at pattern start. Move text pointer forward.` }); i += 1; }
  }
  steps.push({ pattern, text, lps: lps.slice(), i: Math.max(0, text.length - 1), j, message: matches.length ? `Matching complete. Pattern found ${matches.length} time(s).` : 'Matching complete. Pattern not found.', matches });
  return { steps, matches };
}

function kmpRenderCells(container, values, stateGetter) {
  const el = document.getElementById(container);
  if (!el) return;
  el.innerHTML = '';
  values.forEach((value, idx) => {
    const div = document.createElement('div');
    div.className = `kmp-cell ${stateGetter ? stateGetter(idx) : ''}`;
    div.textContent = value === '' ? '\u00a0' : value;
    el.appendChild(div);
  });
}

function kmpRenderPointers(container, i, j, mode) {
  const el = document.getElementById(container);
  if (!el) return;
  const pointers = [];
  if (typeof i === 'number' && i >= 0) pointers.push(`<div class="kmp-pointer ${mode === 'match' ? 'kmp-match' : ''}" style="margin-left:${i * 40}px"><i class="fas fa-arrow-up"></i><span>i</span></div>`);
  if (typeof j === 'number' && j >= 0) pointers.push(`<div class="kmp-pointer kmp-j" style="margin-left:${j * 40}px"><i class="fas fa-arrow-up"></i><span>j / len</span></div>`);
  el.innerHTML = pointers.join('');
}

function kmpApplyStep(step) {
  const pattern = step.pattern ?? kmpState.pattern;
  const text = step.text ?? kmpState.text;
  const lps = step.lps ?? kmpState.lps;
  const modePill = document.getElementById('kmpModePill');
  const explanation = document.getElementById('kmpExplanation');
  const statusBadge = document.getElementById('kmpStatusBadge');
  const statusValue = document.getElementById('kmpStatusPanelValue');
  const resultValue = document.getElementById('kmpResultValue');
  const textBlock = document.getElementById('kmpTextBlock');
  const isCompute = !text;
  kmpState.mode = isCompute ? 'compute' : 'match';
  if (modePill) modePill.textContent = isCompute ? 'Compute LPS' : 'Run Match';
  if (statusBadge) statusBadge.textContent = isCompute ? 'Building LPS' : 'Matching';
  if (statusValue) statusValue.textContent = isCompute ? 'Building LPS...' : 'Matching...';
  if (resultValue && step.message?.includes('Pattern found')) resultValue.textContent = 'Pattern Found';
  if (resultValue && step.message?.includes('Pattern not found')) resultValue.textContent = 'Pattern Not Found';
  if (explanation) explanation.textContent = step.message ?? '';
  if (textBlock) textBlock.style.display = isCompute ? 'none' : '';
  const patternCells = pattern.split('');
  const lpsCells = lps.map(v => String(v));
  const textCells = text.split('');
  kmpRenderCells('kmpPatternRow', patternCells, idx => { if (idx === step.i) return 'kmp-active'; if (step.message?.includes('Characters match') && idx < (step.j ?? 0)) return 'kmp-match'; if (step.message?.includes('Mismatch') && idx === step.j) return 'kmp-mismatch'; if (step.message?.includes('Fallback') && idx === step.j) return 'kmp-fallback'; return ''; });
  kmpRenderCells('kmpLpsRow', lpsCells, idx => { if (idx === step.i) return 'kmp-result'; if (lps[idx] > 0) return 'kmp-match'; return ''; });
  if (textCells.length > 0) kmpRenderCells('kmpTextRow', textCells, idx => { if (idx === step.i) return 'kmp-active'; if (typeof step.foundAt === 'number' && idx >= step.foundAt && idx < step.foundAt + pattern.length) return 'kmp-match'; return ''; });
  else document.getElementById('kmpTextRow').innerHTML = '';
  kmpRenderPointers('kmpPatternPointers', isCompute ? step.i ?? 0 : step.j ?? 0, isCompute ? step.j ?? 0 : step.j ?? 0, isCompute ? 'compute' : 'match');
  kmpRenderPointers('kmpTextPointers', step.i ?? 0, -1, 'match');
  if (step.matches) { kmpState.matches = step.matches.slice(); if (step.matches.length > 0) resultValue.textContent = 'Pattern Found'; }
  kmpUpdateCounter(); kmpUpdateControls();
}

function kmpUpdateCounter() { const num = document.getElementById('kmpStepNum'); const total = document.getElementById('kmpStepTotal'); if (num) num.textContent = String(kmpState.stepIndex); if (total) total.textContent = String(kmpState.steps.length); }
function kmpUpdateControls() { const hasSteps = kmpState.steps.length > 0; const prevBtn = document.getElementById('kmpPrevBtn'); const nextBtn = document.getElementById('kmpNextBtn'); const playBtn = document.getElementById('kmpPlayBtn'); const pauseBtn = document.getElementById('kmpPauseBtn'); if (prevBtn) prevBtn.disabled = !hasSteps || kmpState.stepIndex <= 0; if (nextBtn) nextBtn.disabled = !hasSteps || kmpState.stepIndex >= kmpState.steps.length; if (playBtn) playBtn.disabled = !hasSteps || kmpState.playing || kmpState.stepIndex >= kmpState.steps.length; if (pauseBtn) pauseBtn.disabled = !kmpState.playing; }
function kmpStop() { kmpState.playing = false; if (kmpState.timer) { clearTimeout(kmpState.timer); kmpState.timer = null; } kmpUpdateControls(); }
function kmpGetDelay() { const speed = document.getElementById('kmpSpeed'); return KMP_SPEED_MAP[speed?.value ?? 3] ?? 420; }
function kmpNext() { if (kmpState.stepIndex >= kmpState.steps.length) return; kmpApplyStep(kmpState.steps[kmpState.stepIndex]); kmpState.stepIndex += 1; kmpUpdateControls(); }
function kmpPrev() { if (kmpState.stepIndex <= 1) { kmpState.stepIndex = 0; kmpResetRender(); kmpUpdateCounter(); kmpUpdateControls(); return; } const target = kmpState.stepIndex - 2; kmpResetRender(); kmpState.stepIndex = 0; for (let idx = 0; idx <= target; idx += 1) { kmpApplyStep(kmpState.steps[idx]); kmpState.stepIndex = idx + 1; } }
function kmpPlay() { if (kmpState.playing || kmpState.stepIndex >= kmpState.steps.length) return; kmpState.playing = true; kmpUpdateControls(); const tick = () => { if (!kmpState.playing) return; if (kmpState.stepIndex >= kmpState.steps.length) { kmpStop(); return; } kmpApplyStep(kmpState.steps[kmpState.stepIndex]); kmpState.stepIndex += 1; kmpState.timer = setTimeout(tick, kmpGetDelay()); }; tick(); }
function kmpPause() { kmpStop(); }
function kmpResetRender() { const pattern = kmpState.pattern; const text = kmpState.text; const lps = kmpState.lps; document.getElementById('kmpPatternRow').innerHTML = ''; document.getElementById('kmpLpsRow').innerHTML = ''; document.getElementById('kmpTextRow').innerHTML = ''; document.getElementById('kmpPatternPointers').innerHTML = ''; document.getElementById('kmpTextPointers').innerHTML = ''; if (pattern) kmpRenderCells('kmpPatternRow', pattern.split(''), () => ''); if (lps.length) kmpRenderCells('kmpLpsRow', lps.map(v => String(v)), () => ''); if (text) kmpRenderCells('kmpTextRow', text.split(''), () => ''); }
function kmpRunCompute() { const pattern = kmpGetPattern(); if (!pattern) return kmpSetMessage('Enter a pattern first.'); kmpStop(); const result = kmpBuildLps(pattern); kmpState.pattern = pattern; kmpState.text = ''; kmpState.lps = result.lps.slice(); kmpState.steps = result.steps; kmpState.stepIndex = 0; kmpState.matches = []; kmpState.currentFound = -1; document.getElementById('kmpTextBlock').style.display = 'none'; kmpResetRender(); kmpUpdateCounter(); kmpUpdateControls(); kmpSetMessage('Building LPS...'); kmpNext(); }
function kmpRunMatch() { const pattern = kmpGetPattern(); const text = kmpGetText(); if (!pattern || !text) return kmpSetMessage('Enter both pattern and text.'); kmpStop(); const lpsResult = kmpBuildLps(pattern); const matchResult = kmpBuildMatchSteps(text, pattern, lpsResult.lps); kmpState.pattern = pattern; kmpState.text = text; kmpState.lps = lpsResult.lps.slice(); kmpState.steps = [...lpsResult.steps, ...matchResult.steps]; kmpState.stepIndex = 0; kmpState.matches = []; document.getElementById('kmpTextBlock').style.display = ''; kmpResetRender(); kmpUpdateCounter(); kmpUpdateControls(); kmpSetMessage('Matching...'); kmpPlay(); }
function kmpSetMessage(message) { const explanation = document.getElementById('kmpExplanation'); if (explanation) explanation.textContent = message; }
function kmpResetAll() { kmpStop(); kmpState.steps = []; kmpState.stepIndex = 0; kmpState.pattern = kmpGetPattern(); kmpState.text = kmpGetText(); kmpState.lps = []; kmpState.matches = []; document.getElementById('kmpTextBlock').style.display = kmpState.text ? '' : 'none'; kmpResetRender(); kmpSetMessage('Every step will explain exactly what happened.'); document.getElementById('kmpStatusBadge').textContent = 'Idle'; document.getElementById('kmpStatusPanelValue').textContent = 'Building LPS...'; document.getElementById('kmpResultValue').textContent = 'Pattern Not Found'; kmpUpdateCounter(); kmpUpdateControls(); }
function kmpInit() { document.getElementById('kmpComputeBtn')?.addEventListener('click', kmpRunCompute); document.getElementById('kmpRunBtn')?.addEventListener('click', kmpRunMatch); document.getElementById('kmpPrevBtn')?.addEventListener('click', kmpPrev); document.getElementById('kmpNextBtn')?.addEventListener('click', kmpNext); document.getElementById('kmpPlayBtn')?.addEventListener('click', kmpPlay); document.getElementById('kmpPauseBtn')?.addEventListener('click', kmpPause); document.getElementById('kmpResetBtn')?.addEventListener('click', kmpResetAll); document.getElementById('kmpPatternInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') kmpRunCompute(); }); document.getElementById('kmpTextInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') kmpRunMatch(); }); kmpResetAll(); }
