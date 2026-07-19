/**
 * Binary Search Boundary Finder
 * Side-by-side leftmost / rightmost / insert-position search with mid±1 rules.
 */

document.addEventListener('DOMContentLoaded', () => {
  bsInit();
});

const BS_SPEED_MS = { 1: 1400, 2: 900, 3: 550, 4: 300, 5: 120 };
const BS_SPEED_LABEL = { 1: 'Slowest', 2: 'Slow', 3: 'Normal', 4: 'Fast', 5: 'Blazing' };

const BS_PRESETS = {
  dup: { array: '1, 2, 2, 2, 3, 4, 5', target: 2 },
  single: { array: '7', target: 7 },
  equal: { array: '5, 5, 5, 5', target: 5 },
  missing: { array: '1, 3, 5, 7', target: 4 },
  empty: { array: '', target: 1 },
};

const BS_VARIANTS = [
  { id: 'left', title: 'Leftmost (first)' },
  { id: 'right', title: 'Rightmost (last)' },
  { id: 'insert', title: 'Insert position' },
];

let bsState = {
  arr: [],
  target: 2,
  timelines: { left: [], right: [], insert: [] },
  answers: { left: null, right: null, insert: null },
  index: 0,
  maxSteps: 0,
  playing: false,
  timer: null,
  speed: 3,
};

function bsInit() {
  BS_VARIANTS.forEach((v) => {
    const panel = document.createElement('article');
    panel.className = 'bs-panel';
    panel.dataset.variant = v.id;
    panel.innerHTML = `
      <div class="bs-panel-head">
        <h3>${v.title}</h3>
        <span class="bs-panel-status" id="status-${v.id}">idle</span>
      </div>
      <div class="bs-array" id="array-${v.id}" role="list" aria-label="${v.title} array"></div>
      <div class="bs-pointers" id="ptr-${v.id}">lo / mid / hi</div>
      <p class="bs-panel-why" id="why-${v.id}">Waiting…</p>
      <div class="bs-legend">
        <span><i class="bs-dot lo"></i> lo</span>
        <span><i class="bs-dot mid"></i> mid</span>
        <span><i class="bs-dot hi"></i> hi</span>
        <span><i class="bs-dot ans"></i> answer</span>
      </div>
    `;
    document.getElementById('bsPanels').appendChild(panel);
  });

  document.querySelectorAll('.bs-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = BS_PRESETS[btn.dataset.preset];
      if (!preset) return;
      document.getElementById('bsArrayInput').value = preset.array;
      document.getElementById('bsTarget').value = String(preset.target);
      bsRebuild();
    });
  });

  document.getElementById('bsApplyBtn').addEventListener('click', () => bsRebuild());
  document.getElementById('bsPlayBtn').addEventListener('click', () => bsTogglePlay());
  document.getElementById('bsStepBtn').addEventListener('click', () => {
    bsPause();
    bsStepForward();
  });
  document.getElementById('bsStepBackBtn').addEventListener('click', () => {
    bsPause();
    bsStepBack();
  });
  document.getElementById('bsResetBtn').addEventListener('click', () => {
    bsPause();
    bsState.index = 0;
    bsRenderFrame();
  });

  const speedEl = document.getElementById('bsSpeed');
  speedEl.addEventListener('input', () => {
    bsState.speed = Number(speedEl.value);
    document.getElementById('bsSpeedLabel').textContent = BS_SPEED_LABEL[bsState.speed];
    if (bsState.playing) {
      bsPause();
      bsTogglePlay();
    }
  });

  bsRebuild();
}

function bsParseArray() {
  const raw = document.getElementById('bsArrayInput').value.trim();
  if (!raw) return [];
  const nums = raw
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  if (nums.some((n) => Number.isNaN(n))) {
    throw new Error('Enter a comma-separated list of numbers (or leave empty).');
  }
  for (let i = 1; i < nums.length; i += 1) {
    if (nums[i] < nums[i - 1]) {
      throw new Error('Array must be sorted in non-decreasing order.');
    }
  }
  return nums;
}

function bsRebuild() {
  bsPause();
  try {
    const arr = bsParseArray();
    const target = Number(document.getElementById('bsTarget').value);
    if (Number.isNaN(target)) throw new Error('Target must be a number.');

    bsState.arr = arr;
    bsState.target = target;
    bsState.timelines = {
      left: bsBuildLeftmost(arr, target),
      right: bsBuildRightmost(arr, target),
      insert: bsBuildInsert(arr, target),
    };
    bsState.answers = {
      left: bsState.timelines.left.at(-1)?.answer ?? -1,
      right: bsState.timelines.right.at(-1)?.answer ?? -1,
      insert: bsState.timelines.insert.at(-1)?.answer ?? 0,
    };
    bsState.maxSteps = Math.max(
      bsState.timelines.left.length,
      bsState.timelines.right.length,
      bsState.timelines.insert.length
    );
    bsState.index = 0;

    document.getElementById('resLeft').textContent = String(bsState.answers.left);
    document.getElementById('resRight').textContent = String(bsState.answers.right);
    document.getElementById('resInsert').textContent = String(bsState.answers.insert);

    BS_VARIANTS.forEach((v) => bsRenderArrayShell(v.id));
    bsRenderFrame();
  } catch (err) {
    document.getElementById('bsWhy').textContent = err.message;
    document.getElementById('resLeft').textContent = '—';
    document.getElementById('resRight').textContent = '—';
    document.getElementById('resInsert').textContent = '—';
    bsState.timelines = { left: [], right: [], insert: [] };
    bsState.maxSteps = 0;
    document.getElementById('bsStepMeta').textContent = 'Step 0 / 0';
  }
}

function bsBuildLeftmost(arr, target) {
  const steps = [];
  let lo = 0;
  let hi = arr.length - 1;
  let answer = -1;

  steps.push({
    lo,
    hi,
    mid: null,
    answer,
    done: false,
    why: `Leftmost: find first index of ${target}. Start lo=0, hi=${hi}. If empty, answer stays -1.`,
  });

  if (arr.length === 0) {
    steps.push({
      lo: 0,
      hi: -1,
      mid: null,
      answer: -1,
      done: true,
      why: 'Empty array — leftmost answer is -1 (not found).',
    });
    return steps;
  }

  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const val = arr[mid];
    if (val >= target) {
      if (val === target) answer = mid;
      hi = mid - 1;
      steps.push({
        lo,
        hi,
        mid,
        answer,
        done: false,
        why: `mid=${mid}, arr[mid]=${val} ≥ ${target} → hi = mid - 1${
          val === target ? ` (record answer=${mid}, keep searching left)` : ''
        }.`,
      });
    } else {
      lo = mid + 1;
      steps.push({
        lo,
        hi,
        mid,
        answer,
        done: false,
        why: `mid=${mid}, arr[mid]=${val} < ${target} → lo = mid + 1.`,
      });
    }
  }

  steps.push({
    lo,
    hi,
    mid: null,
    answer,
    done: true,
    why:
      answer === -1
        ? `Done. ${target} not found — leftmost = -1.`
        : `Done. Leftmost (first) occurrence of ${target} is index ${answer}.`,
  });
  return steps;
}

function bsBuildRightmost(arr, target) {
  const steps = [];
  let lo = 0;
  let hi = arr.length - 1;
  let answer = -1;

  steps.push({
    lo,
    hi,
    mid: null,
    answer,
    done: false,
    why: `Rightmost: find last index of ${target}. Start lo=0, hi=${hi}.`,
  });

  if (arr.length === 0) {
    steps.push({
      lo: 0,
      hi: -1,
      mid: null,
      answer: -1,
      done: true,
      why: 'Empty array — rightmost answer is -1 (not found).',
    });
    return steps;
  }

  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const val = arr[mid];
    if (val <= target) {
      if (val === target) answer = mid;
      lo = mid + 1;
      steps.push({
        lo,
        hi,
        mid,
        answer,
        done: false,
        why: `mid=${mid}, arr[mid]=${val} ≤ ${target} → lo = mid + 1${
          val === target ? ` (record answer=${mid}, keep searching right)` : ''
        }.`,
      });
    } else {
      hi = mid - 1;
      steps.push({
        lo,
        hi,
        mid,
        answer,
        done: false,
        why: `mid=${mid}, arr[mid]=${val} > ${target} → hi = mid - 1.`,
      });
    }
  }

  steps.push({
    lo,
    hi,
    mid: null,
    answer,
    done: true,
    why:
      answer === -1
        ? `Done. ${target} not found — rightmost = -1.`
        : `Done. Rightmost (last) occurrence of ${target} is index ${answer}.`,
  });
  return steps;
}

function bsBuildInsert(arr, target) {
  const steps = [];
  let lo = 0;
  let hi = arr.length - 1;

  steps.push({
    lo,
    hi,
    mid: null,
    answer: lo,
    done: false,
    why: `Insert position (lower bound): first index where arr[i] ≥ ${target}. Final lo is the answer.`,
  });

  if (arr.length === 0) {
    steps.push({
      lo: 0,
      hi: -1,
      mid: null,
      answer: 0,
      done: true,
      why: 'Empty array — insert at index 0.',
    });
    return steps;
  }

  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const val = arr[mid];
    if (val >= target) {
      hi = mid - 1;
      steps.push({
        lo,
        hi,
        mid,
        answer: lo,
        done: false,
        why: `mid=${mid}, arr[mid]=${val} ≥ ${target} → hi = mid - 1 (candidate insert ≤ mid).`,
      });
    } else {
      lo = mid + 1;
      steps.push({
        lo,
        hi,
        mid,
        answer: lo,
        done: false,
        why: `mid=${mid}, arr[mid]=${val} < ${target} → lo = mid + 1.`,
      });
    }
  }

  steps.push({
    lo,
    hi,
    mid: null,
    answer: lo,
    done: true,
    why: `Done. Insert position for ${target} is index ${lo} (lower bound).`,
  });
  return steps;
}

function bsRenderArrayShell(variantId) {
  const root = document.getElementById(`array-${variantId}`);
  if (!bsState.arr.length) {
    root.innerHTML = '<span class="bs-empty">(empty)</span>';
    return;
  }
  root.innerHTML = bsState.arr
    .map(
      (val, i) =>
        `<div class="bs-cell" data-i="${i}" role="listitem"><span>${val}</span><span class="bs-idx">${i}</span></div>`
    )
    .join('');
}

function bsTogglePlay() {
  if (bsState.playing) {
    bsPause();
    return;
  }
  if (!bsState.maxSteps) return;
  if (bsState.index >= bsState.maxSteps - 1) bsState.index = 0;
  bsState.playing = true;
  const btn = document.getElementById('bsPlayBtn');
  btn.classList.add('bs-playing');
  btn.innerHTML = '<i class="fas fa-pause"></i>';
  btn.setAttribute('aria-label', 'Pause');
  bsTick();
}

function bsPause() {
  bsState.playing = false;
  if (bsState.timer) {
    clearTimeout(bsState.timer);
    bsState.timer = null;
  }
  const btn = document.getElementById('bsPlayBtn');
  btn.classList.remove('bs-playing');
  btn.innerHTML = '<i class="fas fa-play"></i>';
  btn.setAttribute('aria-label', 'Play');
}

function bsTick() {
  if (!bsState.playing) return;
  if (bsState.index >= bsState.maxSteps - 1) {
    bsPause();
    return;
  }
  bsStepForward();
  bsState.timer = setTimeout(() => bsTick(), BS_SPEED_MS[bsState.speed]);
}

function bsStepForward() {
  if (!bsState.maxSteps) return;
  if (bsState.index < bsState.maxSteps - 1) bsState.index += 1;
  bsRenderFrame();
}

function bsStepBack() {
  if (!bsState.maxSteps) return;
  if (bsState.index > 0) bsState.index -= 1;
  bsRenderFrame();
}

function bsStepAt(timeline, index) {
  if (!timeline.length) return null;
  return timeline[Math.min(index, timeline.length - 1)];
}

function bsRenderFrame() {
  const last = Math.max(bsState.maxSteps - 1, 0);
  document.getElementById('bsStepMeta').textContent = `Step ${bsState.index} / ${last}`;

  const explanations = [];

  BS_VARIANTS.forEach((v) => {
    const step = bsStepAt(bsState.timelines[v.id], bsState.index);
    const status = document.getElementById(`status-${v.id}`);
    const whyEl = document.getElementById(`why-${v.id}`);
    const ptrEl = document.getElementById(`ptr-${v.id}`);

    if (!step) {
      status.textContent = 'idle';
      status.className = 'bs-panel-status';
      whyEl.textContent = 'No steps.';
      return;
    }

    status.textContent = step.done ? 'done' : 'searching';
    status.className = `bs-panel-status${step.done ? ' done' : ''}`;
    whyEl.textContent = step.why;
    whyEl.classList.toggle('active-line', !step.done);
    ptrEl.textContent =
      step.mid == null
        ? `lo=${step.lo} · hi=${step.hi} · answer=${step.answer}`
        : `lo=${step.lo} · mid=${step.mid} · hi=${step.hi} · answer=${step.answer}`;

    explanations.push(`${v.title}: ${step.why}`);

    document.querySelectorAll(`#array-${v.id} .bs-cell`).forEach((cell) => {
      const i = Number(cell.dataset.i);
      cell.classList.remove('in-range', 'is-lo', 'is-hi', 'is-mid', 'is-answer');
      if (step.hi >= step.lo && i >= step.lo && i <= step.hi) cell.classList.add('in-range');
      if (i === step.lo && step.lo <= step.hi) cell.classList.add('is-lo');
      if (i === step.hi && step.lo <= step.hi) cell.classList.add('is-hi');
      if (step.mid != null && i === step.mid) cell.classList.add('is-mid');
      if (step.done && step.answer === i) cell.classList.add('is-answer');
      if (v.id === 'insert' && step.done && step.answer === i) cell.classList.add('is-answer');
    });
  });

  document.getElementById('bsWhy').textContent =
    explanations[0] ?? 'Apply an array and press Play or Step to begin.';
}
