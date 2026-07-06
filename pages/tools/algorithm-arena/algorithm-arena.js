// script.js handles: loading screen, navbar, dark mode, scroll top
// This file handles ONLY: arena battle logic

document.addEventListener('DOMContentLoaded', function() {
  arenaInit();
  arenaRenderEdu();
});

/* ─── Algorithm Metadata ─── */
let ARENA_ALGOS = {
  bubbleSort:    { name: 'Bubble Sort',    timeAvg: 'O(n²)',     timeBest: 'O(n)',       timeWorst: 'O(n²)',      space: 'O(1)',  stable: true  },
  selectionSort: { name: 'Selection Sort', timeAvg: 'O(n²)',     timeBest: 'O(n²)',      timeWorst: 'O(n²)',      space: 'O(1)',  stable: false },
  insertionSort: { name: 'Insertion Sort', timeAvg: 'O(n²)',     timeBest: 'O(n)',       timeWorst: 'O(n²)',      space: 'O(1)',  stable: true  },
  mergeSort:     { name: 'Merge Sort',     timeAvg: 'O(n log n)',timeBest: 'O(n log n)', timeWorst: 'O(n log n)', space: 'O(n)', stable: true  },
  quickSort:     { name: 'Quick Sort',     timeAvg: 'O(n log n)',timeBest: 'O(n log n)', timeWorst: 'O(n²)',      space: 'O(log n)', stable: false },
  heapSort:      { name: 'Heap Sort',      timeAvg: 'O(n log n)',timeBest: 'O(n log n)', timeWorst: 'O(n log n)', space: 'O(1)',  stable: false },
};

let ALGO_BEST_FOR = {
  bubbleSort:    'Small arrays or nearly-sorted data (educational use)',
  selectionSort: 'When write count must be minimized (e.g. flash memory)',
  insertionSort: 'Small or nearly-sorted arrays — O(n) best case',
  mergeSort:     'Large datasets needing stability and guaranteed O(n log n)',
  quickSort:     'Large random datasets — fastest in practice on average',
  heapSort:      'When guaranteed O(n log n) and O(1) space both required',
};

/* ─── Dataset Generator ─── */
function arenaGenData(type, size) {
  let arr = [];
  let i;
  for (i = 0; i < size; i++) arr.push(Math.floor(Math.random() * (size - 1)) + 1);
  if (type === 'sorted')      { arr.sort(function(a,b){return a-b;}); }
  else if (type === 'reverse'){ arr.sort(function(a,b){return b-a;}); }
  else if (type === 'nearlySorted') {
    arr.sort(function(a,b){return a-b;});
    for (i = 0; i < Math.floor(size * 0.1); i++) {
      let x = Math.floor(Math.random() * size);
      let y = Math.floor(Math.random() * size);
      let tmp = arr[x]; arr[x] = arr[y]; arr[y] = tmp;
    }
  } else if (type === 'duplicates') {
    let vals = [1,2,3,4,5];
    for (i = 0; i < size; i++) arr[i] = vals[Math.floor(Math.random() * vals.length)];
  }
  return arr;
}

/* ─── Step Generators (return array of steps, each step = array state + highlights) ─── */
function arenaStepsBubble(arr) {
  let a = arr.slice(), steps = [], n = a.length, comps = 0, swaps = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comps++;
      if (a[j] > a[j+1]) {
        let tmp = a[j]; a[j] = a[j+1]; a[j+1] = tmp;
        swaps++;
      }
      steps.push({ arr: a.slice(), hi: [j, j+1], sorted: [], comps: comps, swaps: swaps });
    }
  }
  steps.push({ arr: a.slice(), hi: [], sorted: 'all', comps: comps, swaps: swaps });
  return steps;
}

function arenaStepsSelection(arr) {
  let a = arr.slice(), steps = [], n = a.length, comps = 0, swaps = 0;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      comps++;
      if (a[j] < a[minIdx]) minIdx = j;
      steps.push({ arr: a.slice(), hi: [i, j, minIdx], sorted: [], comps: comps, swaps: swaps });
    }
    if (minIdx !== i) { let tmp = a[i]; a[i] = a[minIdx]; a[minIdx] = tmp; swaps++; }
    steps.push({ arr: a.slice(), hi: [], sorted: [], comps: comps, swaps: swaps });
  }
  steps.push({ arr: a.slice(), hi: [], sorted: 'all', comps: comps, swaps: swaps });
  return steps;
}

function arenaStepsInsertion(arr) {
  let a = arr.slice(), steps = [], n = a.length, comps = 0, swaps = 0;
  for (let i = 1; i < n; i++) {
    let key = a[i], j = i - 1;
    while (j >= 0 && a[j] > key) {
      comps++; swaps++;
      a[j + 1] = a[j]; j--;
      steps.push({ arr: a.slice(), hi: [j+1, j+2], sorted: [], comps: comps, swaps: swaps });
    }
    comps++;
    a[j + 1] = key;
    steps.push({ arr: a.slice(), hi: [j+1], sorted: [], comps: comps, swaps: swaps });
  }
  steps.push({ arr: a.slice(), hi: [], sorted: 'all', comps: comps, swaps: swaps });
  return steps;
}

function arenaStepsMerge(arr) {
  let a = arr.slice(), steps = [], comps = 0, swaps = 0;
  function merge(arr, l, m, r) {
    let left = arr.slice(l, m+1), right = arr.slice(m+1, r+1);
    let i = 0, j = 0, k = l;
    while (i < left.length && j < right.length) {
      comps++;
      if (left[i] <= right[j]) { arr[k++] = left[i++]; }
      else { arr[k++] = right[j++]; swaps++; }
      steps.push({ arr: arr.slice(), hi: [k-1], sorted: [], comps: comps, swaps: swaps });
    }
    while (i < left.length) { arr[k++] = left[i++]; steps.push({ arr: arr.slice(), hi: [k-1], sorted: [], comps: comps, swaps: swaps }); }
    while (j < right.length) { arr[k++] = right[j++]; steps.push({ arr: arr.slice(), hi: [k-1], sorted: [], comps: comps, swaps: swaps }); }
  }
  function mergeSort(arr, l, r) {
    if (l >= r) return;
    let m = Math.floor((l + r) / 2);
    mergeSort(arr, l, m);
    mergeSort(arr, m+1, r);
    merge(arr, l, m, r);
  }
  mergeSort(a, 0, a.length - 1);
  steps.push({ arr: a.slice(), hi: [], sorted: 'all', comps: comps, swaps: swaps });
  return steps;
}

function arenaStepsQuick(arr) {
  let a = arr.slice(), steps = [], comps = 0, swaps = 0;
  function partition(arr, lo, hi) {
    let pivot = arr[hi], i = lo - 1;
    for (let j = lo; j < hi; j++) {
      comps++;
      if (arr[j] <= pivot) {
        i++;
        let tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        swaps++;
        steps.push({ arr: arr.slice(), hi: [i, j, hi], sorted: [], comps: comps, swaps: swaps });
      } else {
        steps.push({ arr: arr.slice(), hi: [j, hi], sorted: [], comps: comps, swaps: swaps });
      }
    }
    let tmp2 = arr[i+1]; arr[i+1] = arr[hi]; arr[hi] = tmp2;
    swaps++;
    steps.push({ arr: arr.slice(), hi: [i+1], sorted: [], comps: comps, swaps: swaps });
    return i + 1;
  }
  function quickSort(arr, lo, hi) {
    if (lo < hi) {
      let p = partition(arr, lo, hi);
      quickSort(arr, lo, p - 1);
      quickSort(arr, p + 1, hi);
    }
  }
  quickSort(a, 0, a.length - 1);
  steps.push({ arr: a.slice(), hi: [], sorted: 'all', comps: comps, swaps: swaps });
  return steps;
}

function arenaStepsHeap(arr) {
  let a = arr.slice(), steps = [], n = a.length, comps = 0, swaps = 0;
  function heapify(arr, n, i) {
    let largest = i, l = 2*i+1, r = 2*i+2;
    comps++;
    if (l < n && arr[l] > arr[largest]) largest = l;
    comps++;
    if (r < n && arr[r] > arr[largest]) largest = r;
    if (largest !== i) {
      let tmp = arr[i]; arr[i] = arr[largest]; arr[largest] = tmp;
      swaps++;
      steps.push({ arr: arr.slice(), hi: [i, largest], sorted: [], comps: comps, swaps: swaps });
      heapify(arr, n, largest);
    }
  }
  for (let i = Math.floor(n/2) - 1; i >= 0; i--) heapify(a, n, i);
  for (let j = n - 1; j > 0; j--) {
    let tmp2 = a[0]; a[0] = a[j]; a[j] = tmp2;
    swaps++;
    steps.push({ arr: a.slice(), hi: [0, j], sorted: [], comps: comps, swaps: swaps });
    heapify(a, j, 0);
  }
  steps.push({ arr: a.slice(), hi: [], sorted: 'all', comps: comps, swaps: swaps });
  return steps;
}

let STEP_FUNS = {
  bubbleSort: arenaStepsBubble,
  selectionSort: arenaStepsSelection,
  insertionSort: arenaStepsInsertion,
  mergeSort: arenaStepsMerge,
  quickSort: arenaStepsQuick,
  heapSort: arenaStepsHeap,
};

/* ─── Canvas Draw ─── */
function arenaDrawStep(canvas, step, colorA) {
  let ctx = canvas.getContext('2d');
  let W = canvas.width, H = canvas.height;
  let arr = step.arr, n = arr.length;
  let max = Math.max.apply(null, arr);
  ctx.clearRect(0, 0, W, H);
  let barW = Math.floor(W / n);
  for (let i = 0; i < n; i++) {
    let h = Math.max(2, Math.floor((arr[i] / max) * (H - 8)));
    let x = i * barW;
    let isHi = step.hi && step.hi.indexOf(i) !== -1;
    let isSorted = step.sorted === 'all';
    if (isSorted)     ctx.fillStyle = '#22c55e';
    else if (isHi)    ctx.fillStyle = '#ffffff';
    else              ctx.fillStyle = colorA;
    ctx.beginPath();
    ctx.roundRect(x + 1, H - h, barW - 2, h, 2);
    ctx.fill();
  }
}

/* ─── Update Metrics + Chart ─── */
function arenaUpdateMetrics(side, comps, swaps, time) {
  let suffix = side === 'A' ? 'A' : 'B';
  let compsEl  = document.getElementById('arenaComps'  + suffix);
  let swapsEl  = document.getElementById('arenaSwaps'  + suffix);
  let timeEl   = document.getElementById('arenaTime'   + suffix);
  if (compsEl) compsEl.textContent = comps.toLocaleString();
  if (swapsEl) swapsEl.textContent = swaps.toLocaleString();
  if (timeEl)  timeEl.textContent  = time;
}

function arenaUpdateChart(compsA, swapsA, timeA, compsB, swapsB, timeB) {
  let maxComps = Math.max(compsA, compsB, 1);
  let maxSwaps = Math.max(swapsA, swapsB, 1);
  let maxTime  = Math.max(timeA,  timeB,  1);

  function set(id, val, pct) {
    let el = document.getElementById(id);
    if (el) el.style.width = Math.min(100, Math.round(pct)) + '%';
  }
  function setVal(id, val) {
    let el = document.getElementById(id);
    if (el) el.textContent = typeof val === 'number' ? val.toLocaleString() : val;
  }

  set('arenaBarCompsA', compsA, (compsA / maxComps) * 90);
  set('arenaBarCompsB', compsB, (compsB / maxComps) * 90);
  set('arenaBarSwapsA', swapsA, (swapsA / maxSwaps) * 90);
  set('arenaBarSwapsB', swapsB, (swapsB / maxSwaps) * 90);
  set('arenaBarTimeA',  timeA,  (timeA  / maxTime)  * 90);
  set('arenaBarTimeB',  timeB,  (timeB  / maxTime)  * 90);

  setVal('arenaBarValCompsA', compsA);
  setVal('arenaBarValCompsB', compsB);
  setVal('arenaBarValSwapsA', swapsA);
  setVal('arenaBarValSwapsB', swapsB);
  setVal('arenaBarValTimeA',  timeA + 'ms');
  setVal('arenaBarValTimeB',  timeB + 'ms');
}

/* ─── Arena State ─── */
let arenaState = {
  data: [],
  running: false,
  rafA: null,
  rafB: null,
  stepsA: [], stepsB: [],
  idxA: 0,   idxB: 0,
  doneA: false, doneB: false,
  compsA: 0, swapsA: 0, timeA: 0,
  compsB: 0, swapsB: 0, timeB: 0,
  startA: 0, startB: 0,
};

let SPEED_MS = { 1: 120, 2: 60, 3: 25, 4: 10, 5: 2 };
let SPEED_LABELS = { 1: 'Slowest', 2: 'Slow', 3: 'Normal', 4: 'Fast', 5: 'Blazing' };

function arenaGetDelay() {
  let el = document.getElementById('arenaSpeed');
  return SPEED_MS[el ? el.value : 3] || 25;
}

function arenaSetStatus(side, text, cls) {
  let el = document.getElementById('arenaStatus' + side);
  if (!el) return;
  el.textContent = text;
  el.className = 'arena-status' + (cls ? ' ' + cls : '');
}

function arenaCheckDone() {
  if (!arenaState.doneA || !arenaState.doneB) return;
  arenaState.running = false;

  // Determine winner
  let timeA = arenaState.timeA, timeB = arenaState.timeB;
  let compsA = arenaState.compsA, compsB = arenaState.compsB;
  let nameA = document.getElementById('arenaPanelNameA');
  let nameB = document.getElementById('arenaPanelNameB');
  let nA = nameA ? nameA.textContent : 'A';
  let nB = nameB ? nameB.textContent : 'B';

  let winnerName, winnerSide;
  if (compsA < compsB) { winnerName = nA; winnerSide = 'A'; }
  else if (compsB < compsA) { winnerName = nB; winnerSide = 'B'; }
  else if (timeA <= timeB) { winnerName = nA; winnerSide = 'A'; }
  else { winnerName = nB; winnerSide = 'B'; }

  let banner = document.getElementById('arenaWinnerBanner');
  let content = document.getElementById('arenaWinnerContent');
  if (banner && content) {
    content.innerHTML = '🏆<br>' + winnerName + '<br>wins!';
    banner.classList.remove('hidden');
  }

  let panelA = document.getElementById('arenaPanelA');
  let panelB = document.getElementById('arenaPanelB');
  if (panelA && panelB) {
    if (winnerSide === 'A') { panelA.classList.add('winner'); panelB.classList.add('loser'); }
    else { panelB.classList.add('winner'); panelA.classList.add('loser'); }
  }

  arenaSetStatus('A', winnerSide === 'A' ? '🏆 Winner!' : 'Done', winnerSide === 'A' ? 'done' : '');
  arenaSetStatus('B', winnerSide === 'B' ? '🏆 Winner!' : 'Done', winnerSide === 'B' ? 'done' : '');

  let fightBtn = document.getElementById('arenaFightBtn');
  if (fightBtn) { fightBtn.disabled = false; fightBtn.innerHTML = '<i class="fas fa-play"></i> Fight Again'; }
}

function arenaRunSide(side, steps, canvasId, color) {
  let canvas = document.getElementById(canvasId);
  if (!canvas) return;
  let idx = 0;
  let startTime = performance.now();
  arenaSetStatus(side, 'Fighting...', 'running');

  function tick() {
    if (idx >= steps.length) {
      let elapsed = Math.round(performance.now() - startTime);
      if (side === 'A') {
        arenaState.doneA = true;
        arenaState.timeA = elapsed;
        arenaState.compsA = steps[steps.length - 1].comps;
        arenaState.swapsA = steps[steps.length - 1].swaps;
        arenaUpdateMetrics('A', arenaState.compsA, arenaState.swapsA, elapsed);
      } else {
        arenaState.doneB = true;
        arenaState.timeB = elapsed;
        arenaState.compsB = steps[steps.length - 1].comps;
        arenaState.swapsB = steps[steps.length - 1].swaps;
        arenaUpdateMetrics('B', arenaState.compsB, arenaState.swapsB, elapsed);
      }
      arenaUpdateChart(arenaState.compsA, arenaState.swapsA, arenaState.timeA, arenaState.compsB, arenaState.swapsB, arenaState.timeB);
      arenaCheckDone();
      return;
    }

    let step = steps[idx];
    arenaDrawStep(canvas, step, color);
    let s = side === 'A' ? arenaState : arenaState;
    arenaUpdateMetrics(side, step.comps, step.swaps, Math.round(performance.now() - startTime));
    arenaUpdateChart(
      side === 'A' ? step.comps : arenaState.compsA,
      side === 'A' ? step.swaps : arenaState.swapsA,
      side === 'A' ? Math.round(performance.now() - startTime) : arenaState.timeA,
      side === 'B' ? step.comps : arenaState.compsB,
      side === 'B' ? step.swaps : arenaState.swapsB,
      side === 'B' ? Math.round(performance.now() - startTime) : arenaState.timeB
    );

    idx++;
    let delay = arenaGetDelay();
    if (side === 'A') arenaState.rafA = setTimeout(tick, delay);
    else              arenaState.rafB = setTimeout(tick, delay);
  }

  tick();
}

function arenaResizeCanvas(id) {
  let canvas = document.getElementById(id);
  if (!canvas) return;
  let parent = canvas.parentElement;
  canvas.width  = parent ? parent.clientWidth : 400;
  canvas.height = 200;
}

/* ─── Fight! ─── */
function arenaFight() {
  if (arenaState.running) return;

  let selA = document.getElementById('arenaAlgoA');
  let selB = document.getElementById('arenaAlgoB');
  if (!selA || !selB) return;

  let keyA = selA.value, keyB = selB.value;
  if (keyA === keyB) {
    console.warn("Alert:", 'Please select two different algorithms to battle!');
    return;
  }

  // Stop any running animation
  if (arenaState.rafA) { clearTimeout(arenaState.rafA); }
  if (arenaState.rafB) { clearTimeout(arenaState.rafB); }

  // Reset state
  arenaState.running = true;
  arenaState.doneA = false;
  arenaState.doneB = false;
  arenaState.compsA = arenaState.compsB = 0;
  arenaState.swapsA = arenaState.swapsB = 0;
  arenaState.timeA  = arenaState.timeB  = 0;

  // Update panel names + legend
  let nameA = ARENA_ALGOS[keyA].name;
  let nameB = ARENA_ALGOS[keyB].name;
  let pnA = document.getElementById('arenaPanelNameA');
  let pnB = document.getElementById('arenaPanelNameB');
  let lgA = document.getElementById('arenaLegendA');
  let lgB = document.getElementById('arenaLegendB');
  if (pnA) pnA.textContent = nameA;
  if (pnB) pnB.textContent = nameB;
  if (lgA) lgA.textContent = nameA;
  if (lgB) lgB.textContent = nameB;

  // Reset panels
  let panelA = document.getElementById('arenaPanelA');
  let panelB = document.getElementById('arenaPanelB');
  let banner = document.getElementById('arenaWinnerBanner');
  if (panelA) { panelA.classList.remove('winner','loser'); }
  if (panelB) { panelB.classList.remove('winner','loser'); }
  if (banner) { banner.classList.add('hidden'); }

  // Reset metrics + chart
  arenaUpdateMetrics('A', 0, 0, 0);
  arenaUpdateMetrics('B', 0, 0, 0);
  arenaUpdateChart(0,0,0,0,0,0);

  // Generate data
  let datasetSel = document.getElementById('arenaDataset');
  let sizeSel    = document.getElementById('arenaSize');
  let dataType   = datasetSel ? datasetSel.value : 'random';
  let size       = sizeSel   ? parseInt(sizeSel.value) : 40;
  let data       = arenaGenData(dataType, size);

  // Resize canvases
  arenaResizeCanvas('arenaCanvasA');
  arenaResizeCanvas('arenaCanvasB');

  // Generate steps
  let stepsA = STEP_FUNS[keyA](data.slice());
  let stepsB = STEP_FUNS[keyB](data.slice());

  // Disable fight button
  let fightBtn = document.getElementById('arenaFightBtn');
  if (fightBtn) { fightBtn.disabled = true; fightBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fighting...'; }

  // Run both simultaneously
  arenaRunSide('A', stepsA, 'arenaCanvasA', '#f59e0b');
  arenaRunSide('B', stepsB, 'arenaCanvasB', '#3b82f6');
}

function arenaReset() {
  if (arenaState.rafA) clearTimeout(arenaState.rafA);
  if (arenaState.rafB) clearTimeout(arenaState.rafB);
  arenaState.running = false;
  arenaState.doneA = false;
  arenaState.doneB = false;

  let canvasA = document.getElementById('arenaCanvasA');
  let canvasB = document.getElementById('arenaCanvasB');
  if (canvasA) { arenaResizeCanvas('arenaCanvasA'); let ctx = canvasA.getContext('2d'); ctx.clearRect(0,0,canvasA.width,canvasA.height); }
  if (canvasB) { arenaResizeCanvas('arenaCanvasB'); let ctx = canvasB.getContext('2d'); ctx.clearRect(0,0,canvasB.width,canvasB.height); }

  let panelA = document.getElementById('arenaPanelA');
  let panelB = document.getElementById('arenaPanelB');
  let banner = document.getElementById('arenaWinnerBanner');
  if (panelA) panelA.classList.remove('winner','loser');
  if (panelB) panelB.classList.remove('winner','loser');
  if (banner) banner.classList.add('hidden');

  arenaSetStatus('A', 'Ready');
  arenaSetStatus('B', 'Ready');
  arenaUpdateMetrics('A',0,0,0);
  arenaUpdateMetrics('B',0,0,0);
  arenaUpdateChart(0,0,0,0,0,0);

  let fightBtn = document.getElementById('arenaFightBtn');
  if (fightBtn) { fightBtn.disabled = false; fightBtn.innerHTML = '<i class="fas fa-play"></i> Fight!'; }
}

function arenaNewData() {
  arenaReset();
  // Draw preview bars on both canvases
  let datasetSel = document.getElementById('arenaDataset');
  let sizeSel    = document.getElementById('arenaSize');
  let dataType   = datasetSel ? datasetSel.value : 'random';
  let size       = sizeSel   ? parseInt(sizeSel.value) : 40;
  let data       = arenaGenData(dataType, size);

  arenaResizeCanvas('arenaCanvasA');
  arenaResizeCanvas('arenaCanvasB');

  let previewStep = { arr: data, hi: [], sorted: [] };
  let canvasA = document.getElementById('arenaCanvasA');
  let canvasB = document.getElementById('arenaCanvasB');
  if (canvasA) arenaDrawStep(canvasA, previewStep, '#f59e0b');
  if (canvasB) arenaDrawStep(canvasB, previewStep, '#3b82f6');
}

/* ─── Educational Cards ─── */
function arenaRenderEdu() {
  let grid = document.getElementById('arenaEduGrid');
  if (!grid) return;
  let html = '';
  let keys = Object.keys(ARENA_ALGOS);
  for (let i = 0; i < keys.length; i++) {
    let k = keys[i];
    let a = ARENA_ALGOS[k];
    html +=
      '<div class="arena-edu-card">' +
        '<div class="arena-edu-card-name">' + a.name + '</div>' +
        '<div class="arena-edu-row"><span class="arena-edu-key">Best Case</span><span class="arena-edu-val">' + a.timeBest + '</span></div>' +
        '<div class="arena-edu-row"><span class="arena-edu-key">Average</span><span class="arena-edu-val">' + a.timeAvg + '</span></div>' +
        '<div class="arena-edu-row"><span class="arena-edu-key">Worst Case</span><span class="arena-edu-val">' + a.timeWorst + '</span></div>' +
        '<div class="arena-edu-row"><span class="arena-edu-key">Space</span><span class="arena-edu-val">' + a.space + '</span></div>' +
        '<div class="arena-edu-row"><span class="arena-edu-key">Stable</span><span class="arena-edu-val">' + (a.stable ? 'Yes ✅' : 'No ❌') + '</span></div>' +
        '<span class="arena-edu-tag">Best for</span>' +
        '<p class="arena-edu-best">' + ALGO_BEST_FOR[k] + '</p>' +
      '</div>';
  }
  grid.innerHTML = html;
}

/* ─── Init ─── */
function arenaInit() {
  let fightBtn   = document.getElementById('arenaFightBtn');
  let resetBtn   = document.getElementById('arenaResetBtn');
  let newDataBtn = document.getElementById('arenaNewDataBtn');
  let sizeSlider = document.getElementById('arenaSize');
  let speedSlider= document.getElementById('arenaSpeed');

  if (fightBtn)    fightBtn.addEventListener('click', arenaFight);
  if (resetBtn)    resetBtn.addEventListener('click', arenaReset);
  if (newDataBtn)  newDataBtn.addEventListener('click', arenaNewData);

  if (sizeSlider) {
    sizeSlider.addEventListener('input', function() {
      let lbl = document.getElementById('arenaSizeLabel');
      if (lbl) lbl.textContent = sizeSlider.value;
    });
  }

  if (speedSlider) {
    speedSlider.addEventListener('input', function() {
      let lbl = document.getElementById('arenaSpeedLabel');
      if (lbl) lbl.textContent = SPEED_LABELS[speedSlider.value] || 'Normal';
    });
  }

  // Draw initial preview on load
  arenaNewData();

  // Resize canvases on window resize
  window.addEventListener('resize', function() {
    if (!arenaState.running) { arenaNewData(); }
  });
}