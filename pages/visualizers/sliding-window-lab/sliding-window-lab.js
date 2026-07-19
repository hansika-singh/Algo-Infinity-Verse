/**
 * Sliding Window Invariant Lab
 * Step-by-step expand/shrink with invariant tracking and move explanations.
 */

document.addEventListener('DOMContentLoaded', () => {
  swInit();
});

const SW_SPEED_MS = { 1: 1400, 2: 900, 3: 550, 4: 300, 5: 120 };
const SW_SPEED_LABEL = { 1: 'Slowest', 2: 'Slow', 3: 'Normal', 4: 'Fast', 5: 'Blazing' };

const SW_PRESETS = {
  max1: { problem: 'maxSumK', input: '2, 1, 5, 1, 3, 2', k: 3 },
  max2: { problem: 'maxSumK', input: '1, 4, 2, 10, 2, 3, 1, 0, 20', k: 4 },
  uniq1: { problem: 'longestUnique', input: 'abcabcbb', k: null },
  uniq2: { problem: 'longestUnique', input: 'pwwkew', k: null },
};

let swState = {
  problem: 'maxSumK',
  items: [],
  steps: [],
  index: 0,
  playing: false,
  timer: null,
  speed: 3,
};

function swInit() {
  document.querySelectorAll('.sw-algo-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sw-algo-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      swState.problem = btn.dataset.problem;
      swSyncProblemUI();
      swRebuild();
    });
  });

  document.querySelectorAll('.sw-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = SW_PRESETS[btn.dataset.preset];
      if (!preset) return;
      swState.problem = preset.problem;
      document.querySelectorAll('.sw-algo-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.problem === preset.problem);
      });
      document.getElementById('swInput').value = preset.input;
      if (preset.k != null) document.getElementById('swK').value = String(preset.k);
      swSyncProblemUI();
      swRebuild();
    });
  });

  document.getElementById('swApplyBtn').addEventListener('click', () => swRebuild());
  document.getElementById('swPlayBtn').addEventListener('click', () => swTogglePlay());
  document.getElementById('swStepBtn').addEventListener('click', () => {
    swPause();
    swStepForward();
  });
  document.getElementById('swStepBackBtn').addEventListener('click', () => {
    swPause();
    swStepBack();
  });
  document.getElementById('swResetBtn').addEventListener('click', () => {
    swPause();
    swState.index = 0;
    swRenderStep();
  });

  const speedEl = document.getElementById('swSpeed');
  speedEl.addEventListener('input', () => {
    swState.speed = Number(speedEl.value);
    document.getElementById('swSpeedLabel').textContent = SW_SPEED_LABEL[swState.speed];
    if (swState.playing) {
      swPause();
      swTogglePlay();
    }
  });

  swSyncProblemUI();
  swRebuild();
}

function swSyncProblemUI() {
  const isMax = swState.problem === 'maxSumK';
  document.getElementById('swKWrap').hidden = !isMax;
  document.getElementById('invMetricLabel').textContent = isMax ? 'Sum' : 'Unique count';
  document.getElementById('invDesc').textContent = isMax
    ? 'Invariant: maintain a fixed window of size K and track its sum. Slide by removing L and adding R.'
    : 'Invariant: every character inside [L, R] appears at most once. Shrink while a duplicate exists.';
  if (isMax && !document.getElementById('swInput').value.includes(',')) {
    document.getElementById('swInput').value = '2, 1, 5, 1, 3, 2';
  }
  if (!isMax && document.getElementById('swInput').value.includes(',')) {
    document.getElementById('swInput').value = 'abcabcbb';
  }
}

function swParseInput() {
  const raw = document.getElementById('swInput').value.trim();
  if (swState.problem === 'maxSumK') {
    const nums = raw
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (!nums.length || nums.some((n) => Number.isNaN(n))) {
      throw new Error('Enter a comma-separated list of numbers.');
    }
    const k = Number(document.getElementById('swK').value);
    if (!Number.isInteger(k) || k < 1 || k > nums.length) {
      throw new Error(`K must be an integer between 1 and ${nums.length}.`);
    }
    return { items: nums.map(String), values: nums, k };
  }

  const str = raw.replace(/\s+/g, '');
  if (!str) throw new Error('Enter a non-empty string.');
  return { items: [...str], values: [...str], k: null };
}

function swRebuild() {
  swPause();
  try {
    const parsed = swParseInput();
    swState.items = parsed.items;
    swState.steps =
      swState.problem === 'maxSumK'
        ? swBuildMaxSumK(parsed.values, parsed.k)
        : swBuildLongestUnique(parsed.values);
    swState.index = 0;
    swRenderArrayShell();
    swRenderStep();
  } catch (err) {
    document.getElementById('swWhy').textContent = err.message;
    document.getElementById('swMoveBadge').textContent = 'error';
    document.getElementById('swMoveBadge').className = 'sw-move-badge';
    swState.steps = [];
    swState.items = [];
    document.getElementById('swArray').innerHTML = '';
    document.getElementById('swTrace').innerHTML = '';
    document.getElementById('swStepMeta').textContent = 'Step 0 / 0';
  }
}

/** Fixed-size window: maximum sum of any subarray of length K. */
function swBuildMaxSumK(arr, k) {
  const steps = [];
  let L = 0;
  let R = -1;
  let sum = 0;
  let best = -Infinity;
  let bestL = 0;
  let bestR = -1;

  steps.push({
    L: 0,
    R: -1,
    sum: 0,
    unique: null,
    valid: false,
    best: '—',
    bestRange: null,
    move: 'idle',
    why: `Goal: find the maximum sum among all contiguous subarrays of length K=${k}. Start with an empty window.`,
    flash: null,
  });

  while (R + 1 < arr.length && R - L + 1 < k) {
    R += 1;
    sum += arr[R];
    const size = R - L + 1;
    const valid = size === k;
    if (valid && sum > best) {
      best = sum;
      bestL = L;
      bestR = R;
    }
    steps.push({
      L,
      R,
      sum,
      unique: null,
      valid,
      best: valid || best !== -Infinity ? best : '—',
      bestRange: bestR >= 0 ? [bestL, bestR] : null,
      move: 'expand',
      why: `Expand R → ${R}. Include ${arr[R]}. Window sum is now ${sum}. Size ${size}/${k}.${
        valid ? ' Window is full — candidate answer recorded.' : ' Keep expanding until size = K.'
      }`,
      flash: 'entering',
      flashIdx: R,
    });
  }

  while (R + 1 < arr.length) {
    sum -= arr[L];
    const leaveIdx = L;
    L += 1;
    steps.push({
      L,
      R,
      sum,
      unique: null,
      valid: false,
      best,
      bestRange: [bestL, bestR],
      move: 'shrink',
      why: `Slide: remove arr[${leaveIdx}]=${arr[leaveIdx]} from the left. Temporary size ${R - L + 1} (invalid until we expand again).`,
      flash: 'leaving',
      flashIdx: leaveIdx,
    });

    R += 1;
    sum += arr[R];
    if (sum > best) {
      best = sum;
      bestL = L;
      bestR = R;
    }
    steps.push({
      L,
      R,
      sum,
      unique: null,
      valid: true,
      best,
      bestRange: [bestL, bestR],
      move: 'slide',
      why: `Slide: add arr[${R}]=${arr[R]} on the right. Window [${L}, ${R}] sum=${sum}. Best so far = ${best}.`,
      flash: 'entering',
      flashIdx: R,
    });
  }

  steps.push({
    L,
    R,
    sum,
    unique: null,
    valid: R - L + 1 === k,
    best,
    bestRange: bestR >= 0 ? [bestL, bestR] : null,
    move: 'done',
    why: `Done. Maximum window sum of size ${k} is ${best} at indices [${bestL}, ${bestR}].`,
    flash: null,
  });

  return steps;
}

/** Variable window: longest substring with all unique characters. */
function swBuildLongestUnique(chars) {
  const steps = [];
  const freq = new Map();
  let L = 0;
  let R = -1;
  let best = 0;
  let bestL = 0;
  let bestR = -1;

  const uniqueCount = () => freq.size;
  const hasDup = () => [...freq.values()].some((c) => c > 1);

  steps.push({
    L: 0,
    R: -1,
    sum: null,
    unique: 0,
    valid: true,
    best: 0,
    bestRange: null,
    move: 'idle',
    why: 'Goal: longest substring where every character appears at most once. Invariant: no duplicates inside [L, R].',
    flash: null,
  });

  while (R + 1 < chars.length) {
    R += 1;
    const ch = chars[R];
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
    let valid = !hasDup();
    steps.push({
      L,
      R,
      sum: null,
      unique: uniqueCount(),
      valid,
      best,
      bestRange: bestR >= 0 ? [bestL, bestR] : null,
      move: 'expand',
      why: valid
        ? `Expand R → ${R}. Add '${ch}'. Window "${chars.slice(L, R + 1).join('')}" is still unique.`
        : `Expand R → ${R}. Add '${ch}'. Duplicate detected — invariant broken. Shrink from the left.`,
      flash: 'entering',
      flashIdx: R,
    });

    while (hasDup()) {
      const leave = chars[L];
      const leaveIdx = L;
      freq.set(leave, freq.get(leave) - 1);
      if (freq.get(leave) === 0) freq.delete(leave);
      L += 1;
      valid = !hasDup();
      steps.push({
        L,
        R,
        sum: null,
        unique: uniqueCount(),
        valid,
        best,
        bestRange: bestR >= 0 ? [bestL, bestR] : null,
        move: 'shrink',
        why: `Shrink L past index ${leaveIdx} ('${leave}'). ${
          valid
            ? 'Invariant restored — all characters unique again.'
            : 'Still duplicated — keep shrinking.'
        }`,
        flash: 'leaving',
        flashIdx: leaveIdx,
      });
    }

    const len = R - L + 1;
    if (len > best) {
      best = len;
      bestL = L;
      bestR = R;
      steps.push({
        L,
        R,
        sum: null,
        unique: uniqueCount(),
        valid: true,
        best,
        bestRange: [bestL, bestR],
        move: 'record',
        why: `Record answer: length ${best} for window "${chars.slice(L, R + 1).join('')}" [${L}, ${R}].`,
        flash: null,
      });
    }
  }

  steps.push({
    L,
    R,
    sum: null,
    unique: uniqueCount(),
    valid: true,
    best,
    bestRange: bestR >= 0 ? [bestL, bestR] : null,
    move: 'done',
    why: `Done. Longest unique substring length is ${best}${
      bestR >= 0 ? ` → "${chars.slice(bestL, bestR + 1).join('')}"` : ''
    }.`,
    flash: null,
  });

  return steps;
}

function swRenderArrayShell() {
  const root = document.getElementById('swArray');
  root.innerHTML = swState.items
    .map(
      (val, i) =>
        `<div class="sw-cell" data-i="${i}" role="listitem"><span>${val}</span><span class="sw-idx">${i}</span></div>`
    )
    .join('');
}

function swTogglePlay() {
  if (swState.playing) {
    swPause();
    return;
  }
  if (!swState.steps.length) return;
  if (swState.index >= swState.steps.length - 1) swState.index = 0;
  swState.playing = true;
  const btn = document.getElementById('swPlayBtn');
  btn.classList.add('sw-playing');
  btn.innerHTML = '<i class="fas fa-pause"></i>';
  btn.setAttribute('aria-label', 'Pause');
  swTick();
}

function swPause() {
  swState.playing = false;
  if (swState.timer) {
    clearTimeout(swState.timer);
    swState.timer = null;
  }
  const btn = document.getElementById('swPlayBtn');
  btn.classList.remove('sw-playing');
  btn.innerHTML = '<i class="fas fa-play"></i>';
  btn.setAttribute('aria-label', 'Play');
}

function swTick() {
  if (!swState.playing) return;
  if (swState.index >= swState.steps.length - 1) {
    swPause();
    return;
  }
  swStepForward();
  swState.timer = setTimeout(() => swTick(), SW_SPEED_MS[swState.speed]);
}

function swStepForward() {
  if (!swState.steps.length) return;
  if (swState.index < swState.steps.length - 1) swState.index += 1;
  swRenderStep();
}

function swStepBack() {
  if (!swState.steps.length) return;
  if (swState.index > 0) swState.index -= 1;
  swRenderStep();
}

function swRenderStep() {
  const step = swState.steps[swState.index];
  if (!step) return;

  document.getElementById('swStepMeta').textContent =
    `Step ${swState.index} / ${swState.steps.length - 1}`;
  document.getElementById('swWhy').textContent = step.why;

  const badge = document.getElementById('swMoveBadge');
  badge.textContent = step.move;
  badge.className = `sw-move-badge ${step.move}`;

  document.getElementById('invBounds').textContent =
    step.R < 0 ? 'empty' : `[${step.L}, ${step.R}]`;
  document.getElementById('invSize').textContent = step.R < 0 ? '0' : String(step.R - step.L + 1);
  document.getElementById('invMetric').textContent =
    step.sum != null ? String(step.sum) : step.unique != null ? String(step.unique) : '—';
  const validEl = document.getElementById('invValid');
  validEl.textContent = step.valid ? 'Yes' : 'No';
  validEl.className = step.valid ? 'valid' : 'invalid';
  document.getElementById('invBest').textContent = String(step.best);

  document.getElementById('swPointers').textContent =
    step.R < 0 ? 'L = 0 · R = -1 (empty)' : `L = ${step.L} · R = ${step.R}`;

  document.querySelectorAll('.sw-cell').forEach((cell) => {
    const i = Number(cell.dataset.i);
    cell.classList.remove('in-window', 'is-left', 'is-right', 'in-best', 'leaving', 'entering');
    if (step.R >= 0 && i >= step.L && i <= step.R) cell.classList.add('in-window');
    if (step.R >= 0 && i === step.L) cell.classList.add('is-left');
    if (step.R >= 0 && i === step.R) cell.classList.add('is-right');
    if (step.bestRange && i >= step.bestRange[0] && i <= step.bestRange[1]) {
      cell.classList.add('in-best');
    }
    if (step.flash && step.flashIdx === i) cell.classList.add(step.flash);
  });

  const trace = document.getElementById('swTrace');
  trace.innerHTML = swState.steps
    .slice(0, swState.index + 1)
    .map((s, idx) => {
      const active = idx === swState.index ? 'active' : '';
      return `<li class="${active}"><span class="sw-trace-move">${s.move}</span>${s.why}</li>`;
    })
    .join('');
  trace.scrollTop = trace.scrollHeight;
}
