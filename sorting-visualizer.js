// ===== GLOBAL STATE =====
let array = [];
let originalArrayCopy = [];
let isSorting = false;
let isPaused = false;
let speed = 50; // default delay in ms
let size = 30; // default array size
let currentRunId = 0; // unique ID tracking current visualization run

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
    markSorted(i);
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
      await sleep(speed);
      if (runId !== currentRunId || !isSorting) return;

      if (array[j] > array[j + 1]) {
        highlight(j, "swapping");
        highlight(j + 1, "swapping");
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
    await sleep(speed);
    if (runId !== currentRunId || !isSorting) return;

    while (j >= 0 && array[j] > key) {
      if (runId !== currentRunId || !isSorting) return;
      await checkPause(runId);
      if (runId !== currentRunId || !isSorting) return;

      highlight(j, "comparing");
      highlight(j + 1, "swapping");
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
    await sleep(speed);
    if (runId !== currentRunId || !isSorting) return;
    unhighlight(j + 1);
  }
  markAllSorted(runId);
}

// ===== CONTROLLER LOGIC =====
async function startSorting() {
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
  startBtn.disabled = false;
  pauseBtn.disabled = true;
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

// ===== INITIALIZATION =====
let isInitialized = false;

function init() {
  if (isInitialized) return;
  isInitialized = true;
  
  generateNewArray();
  initHeroTyping();
  
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
