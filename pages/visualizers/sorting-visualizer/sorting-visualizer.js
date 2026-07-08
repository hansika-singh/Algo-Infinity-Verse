// ===== GLOBAL STATE =====
let array = [];
let originalArrayCopy = [];
let isSorting = false;
let isPaused = false;
let speed = 50; // default delay in ms
let size = 30; // default array size
let currentRunId = 0; // unique ID tracking current visualization run
let audioCtx = null;
let isSoundEnabled = true;
let volume = 0.5;

// DOM Elements
const canvasWrapper = document.getElementById("canvasWrapper");
const algoSelect = document.getElementById("algoSelect");
const arraySizeRange = document.getElementById("arraySizeRange");
const sizeDisplay = document.getElementById("sizeDisplay");
const speedRange = document.getElementById("speedRange");
const speedDisplay = document.getElementById("speedDisplay");
const newArrayBtn = document.getElementById("newArrayBtn");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const algoInfoTitle = document.getElementById("algoInfoTitle");
const bestTimeComplexity = document.getElementById("bestTimeComplexity");
const avgTimeComplexity = document.getElementById("avgTimeComplexity");
const worstTimeComplexity = document.getElementById("worstTimeComplexity");
const spaceComplexity = document.getElementById("spaceComplexity");
const soundToggle = document.getElementById("soundToggle");
const volumeRange = document.getElementById("volumeRange");
const volumeDisplay = document.getElementById("volumeDisplay");

// Complexity Database
const complexityData = {
  bubble: {
    title: "Bubble Sort",
    best: "O(n)",
    avg: "O(n²)",
    worst: "O(n²)",
    space: "O(1)"
  },
  selection: {
    title: "Selection Sort",
    best: "O(n²)",
    avg: "O(n²)",
    worst: "O(n²)",
    space: "O(1)"
  },
  insertion: {
    title: "Insertion Sort",
    best: "O(n)",
    avg: "O(n²)",
    worst: "O(n²)",
    space: "O(1)"
  }
};

// ===== HELPER FUNCTIONS =====
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(val, type = 'compare') {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Map value (5 to 95) to frequency (150 to 850 Hz)
    const freq = 150 + (val - 5) * (850 - 150) / 90;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    if (type === 'compare') {
      osc.type = 'sine';
      gain.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'swap') {
      osc.type = 'triangle';
      gain.gain.setValueAtTime(volume * 0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'sorted') {
      osc.type = 'sine';
      gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    }
  } catch (e) {
    void 0;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkPause(runId) {
  while (isPaused) {
    await sleep(50);
    if (runId !== currentRunId || !isSorting) return;
  }
}

// Generate new random array
function generateNewArray() {
  if (isSorting) return;
  array = [];
  for (let i = 0; i < size; i++) {
    // Height as a percentage from 5% to 95%
    array.push(Math.floor(Math.random() * 90) + 5);
  }
  originalArrayCopy = [...array];
  renderBars();
  if (isDbgMode) {
    initDebuggerMode();
  }
}

// Render array elements as bars
function renderBars() {
  if (!canvasWrapper) return;
  canvasWrapper.innerHTML = "";
  
  array.forEach((val, idx) => {
    const bar = document.createElement("div");
    bar.className = "sorting-bar bar-default";
    bar.style.height = `${val}%`;
    bar.id = `bar-${idx}`;
    
    // Show label values inside bars if array size is small for readability
    if (size <= 25) {
      const label = document.createElement("span");
      label.className = "sorting-bar-label";
      label.textContent = val;
      bar.appendChild(label);
    }
    
    canvasWrapper.appendChild(bar);
  });
}

// Bar visual highlighting helpers
function highlight(idx, stateClass) {
  const bar = document.getElementById(`bar-${idx}`);
  if (bar) {
    bar.className = `sorting-bar bar-${stateClass}`;
  }
}

// Restore default bar color
function unhighlight(idx) {
  const bar = document.getElementById(`bar-${idx}`);
  if (bar) {
    bar.className = "sorting-bar bar-default";
  }
}

// Mark element as sorted
function markSorted(idx) {
  const bar = document.getElementById(`bar-${idx}`);
  if (bar) {
    bar.className = "sorting-bar bar-sorted";
  }
}

// Mark complete array as sorted
function markAllSorted(runId) {
  if (runId !== currentRunId) return;
  for (let i = 0; i < size; i++) {
    setTimeout(() => {
      if (runId !== currentRunId) return;
      markSorted(i);
      playTone(array[i], 'sorted');
    }, i * Math.max(15, Math.min(50, speed / 2)));
  }
}

// ===== SORTING ALGORITHMS =====

// 1. Bubble Sort
async function bubbleSort(runId) {
  const n = array.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (runId !== currentRunId || !isSorting) return;
      await checkPause(runId);
      if (runId !== currentRunId || !isSorting) return;

      highlight(j, "comparing");
      highlight(j + 1, "comparing");
      playTone(array[j], 'compare');
      await sleep(speed);
      if (runId !== currentRunId || !isSorting) return;

      if (array[j] > array[j + 1]) {
        highlight(j, "swapping");
        highlight(j + 1, "swapping");
        playTone(array[j], 'swap');
        await sleep(speed);
        if (runId !== currentRunId || !isSorting) return;

        let temp = array[j];
        array[j] = array[j + 1];
        array[j + 1] = temp;

        renderBars();
        highlight(j, "swapping");
        highlight(j + 1, "swapping");
        await sleep(speed);
        if (runId !== currentRunId || !isSorting) return;
      }

      unhighlight(j);
      unhighlight(j + 1);
    }
    if (runId !== currentRunId) return;
    markSorted(n - i - 1);
    playTone(array[n - i - 1], 'sorted');
  }
  markAllSorted(runId);
}

// 2. Selection Sort
async function selectionSort(runId) {
  const n = array.length;
  for (let i = 0; i < n; i++) {
    let minIdx = i;
    highlight(minIdx, "swapping");

    for (let j = i + 1; j < n; j++) {
      if (runId !== currentRunId || !isSorting) return;
      await checkPause(runId);
      if (runId !== currentRunId || !isSorting) return;

      highlight(j, "comparing");
      playTone(array[j], 'compare');
      await sleep(speed);
      if (runId !== currentRunId || !isSorting) return;

      if (array[j] < array[minIdx]) {
        unhighlight(minIdx);
        minIdx = j;
        highlight(minIdx, "swapping");
      } else {
        unhighlight(j);
      }
    }

    if (minIdx !== i) {
      highlight(i, "swapping");
      highlight(minIdx, "swapping");
      playTone(array[minIdx], 'swap');
      await sleep(speed);
      if (runId !== currentRunId || !isSorting) return;

      let temp = array[i];
      array[i] = array[minIdx];
      array[minIdx] = temp;

      renderBars();
      highlight(i, "swapping");
      highlight(minIdx, "swapping");
      await sleep(speed);
      if (runId !== currentRunId || !isSorting) return;
    }

    unhighlight(minIdx);
    unhighlight(i);
    if (runId !== currentRunId) return;
    markSorted(i);
    playTone(array[i], 'sorted');
  }
  markAllSorted(runId);
}

// 3. Insertion Sort
async function insertionSort(runId) {
  const n = array.length;
  for (let i = 1; i < n; i++) {
    let key = array[i];
    let j = i - 1;

    highlight(i, "swapping");
    playTone(key, 'swap');
    await sleep(speed);
    if (runId !== currentRunId || !isSorting) return;

    while (j >= 0 && array[j] > key) {
      if (runId !== currentRunId || !isSorting) return;
      await checkPause(runId);
      if (runId !== currentRunId || !isSorting) return;

      highlight(j, "comparing");
      highlight(j + 1, "swapping");
      playTone(array[j], 'compare');
      await sleep(speed);
      if (runId !== currentRunId || !isSorting) return;

      array[j + 1] = array[j];
      renderBars();

      highlight(j, "comparing");
      highlight(j + 1, "swapping");
      await sleep(speed);
      if (runId !== currentRunId || !isSorting) return;

      unhighlight(j);
      unhighlight(j + 1);
      j--;
    }

    array[j + 1] = key;
    renderBars();
    
    highlight(j + 1, "sorted");
    playTone(key, 'sorted');
    await sleep(speed);
    if (runId !== currentRunId || !isSorting) return;
    unhighlight(j + 1);
  }
  markAllSorted(runId);
}

// ===== CONTROLLER LOGIC =====
async function startSorting() {
  // Resume AudioContext on user interaction
  getAudioContext();

  if (isSorting) {
    if (isPaused) {
      isPaused = false;
      startBtn.disabled = true;
      pauseBtn.disabled = false;
    }
    return;
  }
  
  isSorting = true;
  isPaused = false;
  
  // Track this unique run ID to discard former async operations
  currentRunId++;
  const runId = currentRunId;
  
  // Disable configuration options
  algoSelect.disabled = true;
  arraySizeRange.disabled = true;
  newArrayBtn.disabled = true;
  
  // Update button states
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  
  const currentAlgorithm = algoSelect.value;
  if (currentAlgorithm === "bubble") {
    await bubbleSort(runId);
  } else if (currentAlgorithm === "selection") {
    await selectionSort(runId);
  } else if (currentAlgorithm === "insertion") {
    await insertionSort(runId);
  }
  
  // Restore control states when sorting completes naturally
  if (isSorting && runId === currentRunId) {
    isSorting = false;
    algoSelect.disabled = false;
    arraySizeRange.disabled = false;
    newArrayBtn.disabled = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }
}

function pauseSorting() {
  if (isSorting && !isPaused) {
    isPaused = true;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }
}

function resetSorting() {
  isSorting = false;
  isPaused = false;
  currentRunId++; // invalidate running algorithms instantly
  
  array = [...originalArrayCopy];
  renderBars();
  
  // Re-enable all controls
  algoSelect.disabled = false;
  arraySizeRange.disabled = false;
  newArrayBtn.disabled = false;
  
  if (isDbgMode) {
    startBtn.disabled = true;
    pauseBtn.disabled = true;
    initDebuggerMode();
  } else {
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }
}

// ===== EVENT LISTENERS =====

// Sliders
arraySizeRange.addEventListener("input", (e) => {
  size = parseInt(e.target.value);
  sizeDisplay.textContent = size;
  generateNewArray();
});

speedRange.addEventListener("input", (e) => {
  speed = parseInt(e.target.value);
  speedDisplay.textContent = `${speed}ms`;
});

// Control Triggers
newArrayBtn.addEventListener("click", () => {
  generateNewArray();
});

startBtn.addEventListener("click", () => {
  startSorting();
});

pauseBtn.addEventListener("click", () => {
  pauseSorting();
});

resetBtn.addEventListener("click", () => {
  resetSorting();
});

// Algorithm Switcher
algoSelect.addEventListener("change", (e) => {
  const selected = e.target.value;
  const data = complexityData[selected];
  
  if (data) {
    algoInfoTitle.textContent = data.title;
    bestTimeComplexity.textContent = data.best;
    avgTimeComplexity.textContent = data.avg;
    worstTimeComplexity.textContent = data.worst;
    spaceComplexity.textContent = data.space;
  }
  
  resetSorting();
});

// Typing animation for hero banner
function initHeroTyping() {
  const typingElement = document.getElementById("typingTextVisualizer");
  const texts = ["Bubble Sort", "Selection Sort", "Insertion Sort"];
  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function typeEffect() {
    const currentText = texts[textIndex];
    if (isDeleting) {
      typingElement.textContent = currentText.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typingElement.textContent = currentText.substring(0, charIndex + 1);
      charIndex++;
    }

    let typeSpeed = isDeleting ? 50 : 100;

    if (!isDeleting && charIndex === currentText.length) {
      typeSpeed = 1500;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
      typeSpeed = 500;
    }

    setTimeout(typeEffect, typeSpeed);
  }

  if (typingElement) {
    typeEffect();
  }
}

// Sound state and bindings helper
function initAudioControls() {
  if (soundToggle) {
    isSoundEnabled = soundToggle.checked;
    soundToggle.addEventListener("change", (e) => {
      isSoundEnabled = e.target.checked;
      // Resume context as safety on user action
      if (isSoundEnabled) {
        getAudioContext();
      }
    });
  }

  if (volumeRange && volumeDisplay) {
    const val = parseInt(volumeRange.value, 10);
    volume = val / 100;
    volumeDisplay.textContent = `${val}%`;
    volumeRange.addEventListener("input", (e) => {
      const v = parseInt(e.target.value, 10);
      volume = v / 100;
      volumeDisplay.textContent = `${v}%`;
      // Resume context on user action
      getAudioContext();
    });
  }
}

// ===== INITIALIZATION =====
let isInitialized = false;

function init() {
  if (isInitialized) return;
  isInitialized = true;
  
  generateNewArray();
  initHeroTyping();
  initAudioControls();
  initDbgListeners();
  
  // Hide loader if script.js didn't trigger
  setTimeout(() => {
    const loader = document.getElementById("loading-screen");
    if (loader && !loader.classList.contains("hidden")) {
      loader.classList.add("hidden");
    }
  }, 1000);
}

// Bind initialization events defensively
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// ==========================================================================
// STEP DEBUGGER CODE FOR SORTING VISUALIZER
// ==========================================================================

let isDbgMode = false;
let dbgTrace = [];
let dbgCurrentStep = -1;
let dbgIsPlaying = false;
let dbgPlayInterval = null;

const pseudoCodes = {
  bubble: [
    "for i from 0 to n-1:",
    "  for j from 0 to n-i-2:",
    "    if array[j] > array[j+1]:",
    "      swap(array[j], array[j+1])"
  ],
  selection: [
    "for i from 0 to n-1:",
    "  min_idx = i",
    "  for j from i+1 to n-1:",
    "    if array[j] < array[min_idx]: min_idx = j",
    "  swap(array[i], array[min_idx])"
  ],
  insertion: [
    "for i from 1 to n-1:",
    "  key = array[i]",
    "  j = i - 1",
    "  while j >= 0 and array[j] > key:",
    "    array[j+1] = array[j]; j--",
    "  array[j+1] = key"
  ]
};

function generateBubbleSortTrace(arr) {
  const trace = [];
  const tempArr = [...arr];
  const n = tempArr.length;
  
  trace.push({
    stateSnapshot: [...tempArr],
    highlights: {},
    explanation: "Initial array state before Bubble Sort starts.",
    pseudoCodeLine: 0
  });

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      trace.push({
        stateSnapshot: [...tempArr],
        highlights: { comparing: [j, j + 1] },
        explanation: `Comparing elements at index ${j} (value ${tempArr[j]}) and index ${j+1} (value ${tempArr[j+1]}).`,
        pseudoCodeLine: 2
      });

      if (tempArr[j] > tempArr[j + 1]) {
        const val1 = tempArr[j];
        const val2 = tempArr[j+1];
        tempArr[j] = val2;
        tempArr[j+1] = val1;

        trace.push({
          stateSnapshot: [...tempArr],
          highlights: { swapping: [j, j + 1] },
          explanation: `Since ${val1} > ${val2}, we swap them.`,
          pseudoCodeLine: 3
        });
      }
    }
    trace.push({
      stateSnapshot: [...tempArr],
      highlights: { sorted: Array.from({length: i + 1}, (_, idx) => n - 1 - idx) },
      explanation: `Element at index ${n - 1 - i} (value ${tempArr[n - 1 - i]}) is placed in its final sorted position.`,
      pseudoCodeLine: 0
    });
  }

  trace.push({
    stateSnapshot: [...tempArr],
    highlights: { sorted: Array.from({length: n}, (_, idx) => idx) },
    explanation: "Bubble Sort complete! The entire array is sorted.",
    pseudoCodeLine: 0
  });

  return trace;
}

function generateSelectionSortTrace(arr) {
  const trace = [];
  const tempArr = [...arr];
  const n = tempArr.length;

  trace.push({
    stateSnapshot: [...tempArr],
    highlights: {},
    explanation: "Initial array state before Selection Sort starts.",
    pseudoCodeLine: 0
  });

  for (let i = 0; i < n; i++) {
    let minIdx = i;
    trace.push({
      stateSnapshot: [...tempArr],
      highlights: { swapping: [i] },
      explanation: `Set minimum element pointer min_idx = ${i} (value ${tempArr[i]}).`,
      pseudoCodeLine: 1
    });

    for (let j = i + 1; j < n; j++) {
      trace.push({
        stateSnapshot: [...tempArr],
        highlights: { comparing: [j], swapping: [minIdx] },
        explanation: `Comparing element at index ${j} (value ${tempArr[j]}) with current minimum at index ${minIdx} (value ${tempArr[minIdx]}).`,
        pseudoCodeLine: 3
      });

      if (tempArr[j] < tempArr[minIdx]) {
        minIdx = j;
        trace.push({
          stateSnapshot: [...tempArr],
          highlights: { swapping: [minIdx] },
          explanation: `Found smaller element! Update min_idx to ${minIdx} (value ${tempArr[minIdx]}).`,
          pseudoCodeLine: 3
        });
      }
    }

    if (minIdx !== i) {
      const val1 = tempArr[i];
      const val2 = tempArr[minIdx];
      tempArr[i] = val2;
      tempArr[minIdx] = val1;

      trace.push({
        stateSnapshot: [...tempArr],
        highlights: { swapping: [i, minIdx] },
        explanation: `Swap element at index ${i} (${val1}) with minimum at index ${minIdx} (${val2}).`,
        pseudoCodeLine: 4
      });
    }

    trace.push({
      stateSnapshot: [...tempArr],
      highlights: { sorted: Array.from({length: i + 1}, (_, idx) => idx) },
      explanation: `Element at index ${i} (${tempArr[i]}) is now sorted.`,
      pseudoCodeLine: 0
    });
  }

  trace.push({
    stateSnapshot: [...tempArr],
    highlights: { sorted: Array.from({length: n}, (_, idx) => idx) },
    explanation: "Selection Sort complete! The entire array is sorted.",
    pseudoCodeLine: 0
  });

  return trace;
}

function generateInsertionSortTrace(arr) {
  const trace = [];
  const tempArr = [...arr];
  const n = tempArr.length;

  trace.push({
    stateSnapshot: [...tempArr],
    highlights: {},
    explanation: "Initial array state before Insertion Sort starts.",
    pseudoCodeLine: 0
  });

  for (let i = 1; i < n; i++) {
    let key = tempArr[i];
    let j = i - 1;

    trace.push({
      stateSnapshot: [...tempArr],
      highlights: { swapping: [i] },
      explanation: `Select key = ${key} at index ${i} to insert into the sorted partition [0..${i-1}].`,
      pseudoCodeLine: 1
    });

    while (j >= 0 && tempArr[j] > key) {
      trace.push({
        stateSnapshot: [...tempArr],
        highlights: { comparing: [j], swapping: [j + 1] },
        explanation: `Comparing key ${key} with element at index ${j} (${tempArr[j]}). Since ${tempArr[j]} > ${key}, shift it to the right.`,
        pseudoCodeLine: 4
      });

      tempArr[j + 1] = tempArr[j];

      trace.push({
        stateSnapshot: [...tempArr],
        highlights: { swapping: [j + 1] },
        explanation: `Shifted element from index ${j} to ${j+1}.`,
        pseudoCodeLine: 4
      });

      j--;
    }

    tempArr[j + 1] = key;
    trace.push({
      stateSnapshot: [...tempArr],
      highlights: { sorted: Array.from({length: i}, (_, idx) => idx) },
      explanation: `Insert key ${key} into index ${j+1}.`,
      pseudoCodeLine: 5
    });
  }

  trace.push({
    stateSnapshot: [...tempArr],
    highlights: { sorted: Array.from({length: n}, (_, idx) => idx) },
    explanation: "Insertion Sort complete! The entire array is sorted.",
    pseudoCodeLine: 0
  });

  return trace;
}

function renderDbgStep(stepIdx) {
  if (stepIdx < 0 || stepIdx >= dbgTrace.length) return;
  
  const step = dbgTrace[stepIdx];
  const arr = step.stateSnapshot;
  
  if (canvasWrapper) {
    canvasWrapper.innerHTML = "";
    arr.forEach((val, idx) => {
      const bar = document.createElement("div");
      bar.className = "sorting-bar bar-default";
      bar.style.height = `${val}%`;
      bar.id = `bar-${idx}`;
      
      if (step.highlights.comparing && step.highlights.comparing.includes(idx)) {
        bar.className = "sorting-bar bar-comparing";
      } else if (step.highlights.swapping && step.highlights.swapping.includes(idx)) {
        bar.className = "sorting-bar bar-swapping";
      } else if (step.highlights.sorted && step.highlights.sorted.includes(idx)) {
        bar.className = "sorting-bar bar-sorted";
      }

      if (size <= 25) {
        const label = document.createElement("span");
        label.className = "sorting-bar-label";
        label.textContent = val;
        bar.appendChild(label);
      }
      canvasWrapper.appendChild(bar);
    });
  }

  const expEl = document.getElementById("dbgExplanationText");
  if (expEl) expEl.innerHTML = step.explanation;

  const counterEl = document.getElementById("dbgStepCounter");
  if (counterEl) counterEl.textContent = `Step ${stepIdx + 1} / ${dbgTrace.length}`;

  const sliderEl = document.getElementById("dbgStepSlider");
  if (sliderEl) sliderEl.value = stepIdx;

  const prevBtn = document.getElementById("dbgPrevBtn");
  const nextBtn = document.getElementById("dbgNextBtn");
  if (prevBtn) prevBtn.disabled = stepIdx <= 0;
  if (nextBtn) nextBtn.disabled = stepIdx >= dbgTrace.length - 1;

  const lines = document.querySelectorAll(".pseudo-code-line");
  lines.forEach((line, idx) => {
    if (idx === step.pseudoCodeLine) {
      line.classList.add("active");
    } else {
      line.classList.remove("active");
    }
  });

  if (step.highlights.comparing && step.highlights.comparing.length > 0) {
    playTone(arr[step.highlights.comparing[0]], 'compare');
  } else if (step.highlights.swapping && step.highlights.swapping.length > 0) {
    playTone(arr[step.highlights.swapping[0]], 'swap');
  } else if (step.highlights.sorted && step.highlights.sorted.length > 0) {
    playTone(arr[step.highlights.sorted[0]], 'sorted');
  }
}

function drawPseudoCode(algo) {
  const container = document.getElementById("dbgPseudoCode");
  if (!container) return;
  container.innerHTML = "";
  
  const codeLines = pseudoCodes[algo] || [];
  codeLines.forEach((line, idx) => {
    const div = document.createElement("div");
    div.className = "pseudo-code-line";
    div.textContent = `${idx + 1}: ${line}`;
    container.appendChild(div);
  });
}

function dbgPlay() {
  if (dbgIsPlaying) return;
  dbgIsPlaying = true;
  document.getElementById("dbgPlayBtn").style.display = "none";
  document.getElementById("dbgPauseBtn").style.display = "inline-block";

  dbgPlayInterval = setInterval(() => {
    if (dbgCurrentStep >= dbgTrace.length - 1) {
      dbgPause();
      return;
    }
    dbgCurrentStep++;
    renderDbgStep(dbgCurrentStep);
  }, speed);
}

function dbgPause() {
  if (!dbgIsPlaying) return;
  dbgIsPlaying = false;
  document.getElementById("dbgPlayBtn").style.display = "inline-block";
  document.getElementById("dbgPauseBtn").style.display = "none";
  if (dbgPlayInterval) {
    clearInterval(dbgPlayInterval);
    dbgPlayInterval = null;
  }
}

function initDebuggerMode() {
  dbgPause();
  const algo = algoSelect.value;
  drawPseudoCode(algo);
  
  if (algo === "bubble") {
    dbgTrace = generateBubbleSortTrace(array);
  } else if (algo === "selection") {
    dbgTrace = generateSelectionSortTrace(array);
  } else if (algo === "insertion") {
    dbgTrace = generateInsertionSortTrace(array);
  }
  
  dbgCurrentStep = 0;
  
  const slider = document.getElementById("dbgStepSlider");
  if (slider) {
    slider.min = 0;
    slider.max = dbgTrace.length - 1;
    slider.value = 0;
  }
  
  renderDbgStep(dbgCurrentStep);
}

function initDbgListeners() {
  document.getElementById("dbgToggle").addEventListener("change", (e) => {
    isDbgMode = e.target.checked;
    const dbgPanel = document.getElementById("debuggerPanel");
    
    resetSorting();
    
    if (isDbgMode) {
      dbgPanel.style.display = "block";
      startBtn.disabled = true;
      pauseBtn.disabled = true;
      initDebuggerMode();
    } else {
      dbgPanel.style.display = "none";
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      dbgPause();
    }
  });

  document.getElementById("dbgPrevBtn").addEventListener("click", () => {
    dbgPause();
    if (dbgCurrentStep > 0) {
      dbgCurrentStep--;
      renderDbgStep(dbgCurrentStep);
    }
  });

  document.getElementById("dbgNextBtn").addEventListener("click", () => {
    dbgPause();
    if (dbgCurrentStep < dbgTrace.length - 1) {
      dbgCurrentStep++;
      renderDbgStep(dbgCurrentStep);
    }
  });

  document.getElementById("dbgPlayBtn").addEventListener("click", dbgPlay);
  document.getElementById("dbgPauseBtn").addEventListener("click", dbgPause);

  document.getElementById("dbgStepSlider").addEventListener("input", (e) => {
    dbgPause();
    dbgCurrentStep = parseInt(e.target.value);
    renderDbgStep(dbgCurrentStep);
  });
}

