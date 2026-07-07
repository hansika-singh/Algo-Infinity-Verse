/**
 * time-travel.js
 * Implements a Generator-based state-snapshot engine. By running the algorithm
 * inside a generator, we yield and deep-clone the local variables at every step,
 * allowing instantaneous O(1) time-travel debugging via the timeline scrubber.
 */

document.addEventListener("DOMContentLoaded", () => {
    initDebugger();
});

const els = {
    editorContainer: document.getElementById('editorContainer'),
    btnCompile: document.getElementById('btnCompile'),
    arrayContainer: document.getElementById('arrayContainer'),
    varDisplay: document.getElementById('varDisplay'),
    btnPlayPause: document.getElementById('btnPlayPause'),
    btnStepBack: document.getElementById('btnStepBack'),
    btnStepFwd: document.getElementById('btnStepFwd'),
    timelineSlider: document.getElementById('timelineSlider'),
    stepCurrent: document.getElementById('stepCurrent'),
    stepTotal: document.getElementById('stepTotal')
};

let editor;
let stateHistory = []; // Array to hold all execution snapshots
let currentStep = 0;
let isPlaying = false;
let playInterval;

// The initial array to sort
const initialArray = [45, 12, 88, 23, 67, 34, 9, 56];

function initDebugger() {
    editor = CodeMirror(els.editorContainer, {
        lineNumbers: true,
        theme: 'nord',
        mode: 'javascript',
        value: `// The visualizer uses a Generator Engine to snapshot state.
// Click "Compile & Snapshot" to map out the memory history!

function bubbleSort(arr) {
    let n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            // Comparing arr[j] and arr[j+1]
            if (arr[j] > arr[j + 1]) {
                // Swapping elements
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    return arr;
}`,
        indentUnit: 4,
        readOnly: true // Read-only for this demonstration
    });

    drawArray(initialArray, [], [], []);
    setupEventListeners();
}

// --- The State Snapshot Engine (Generators) ---
// This generator yields a deep clone of memory at every logical step of the algorithm.
function* sortAlgorithmGenerator(inputArray) {
    let arr = [...inputArray]; // Clone input
    let sortedIndices = [];

    // Snapshot: Initial State
    yield { array: [...arr], i: undefined, j: undefined, compare: [], swap: [], sorted: [...sortedIndices] };

    let n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            // Snapshot: About to compare
            yield { array: [...arr], i: i, j: j, compare: [j, j + 1], swap: [], sorted: [...sortedIndices] };

            if (arr[j] > arr[j + 1]) {
                // Snapshot: Identified swap needed
                yield { array: [...arr], i: i, j: j, compare: [], swap: [j, j + 1], sorted: [...sortedIndices] };
                
                // Execute swap
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;

                // Snapshot: After swap
                yield { array: [...arr], i: i, j: j, compare: [], swap: [j, j + 1], sorted: [...sortedIndices] };
            }
        }
        // Mark the last sorted element
        sortedIndices.push(n - i - 1);
        yield { array: [...arr], i: i, j: undefined, compare: [], swap: [], sorted: [...sortedIndices] };
    }
    // Mark remaining elements as sorted
    sortedIndices.push(0);
    yield { array: [...arr], i: 'done', j: 'done', compare: [], swap: [], sorted: [...sortedIndices] };
}

function compileAndSnapshot() {
    stateHistory = []; // Clear old history
    
    // Instantiate the generator
    const generator = sortAlgorithmGenerator(initialArray);
    
    // Run the entire algorithm instantly in the background and save every yielded state
    let result = generator.next();
    while (!result.done) {
        stateHistory.push(result.value);
        result = generator.next();
    }

    // Configure UI Slider
    els.timelineSlider.max = stateHistory.length - 1;
    els.timelineSlider.value = 0;
    els.timelineSlider.disabled = false;
    els.stepTotal.textContent = stateHistory.length - 1;
    
    currentStep = 0;
    renderSnapshot(currentStep);

    els.btnCompile.innerHTML = `<i class="fas fa-check"></i> Snapshots Ready`;
    setTimeout(() => els.btnCompile.innerHTML = `<i class="fas fa-cogs"></i> Compile & Snapshot`, 2000);
}

// --- Renderer ---
function renderSnapshot(index) {
    const state = stateHistory[index];
    if (!state) return;

    els.stepCurrent.textContent = index;
    els.timelineSlider.value = index;

    // Update Local Variables Display
    els.varDisplay.innerHTML = `<code>i: ${state.i !== undefined ? state.i : 'undefined'}, j: ${state.j !== undefined ? state.j : 'undefined'}</code>`;

    // Draw the array bars based on the snapshot
    drawArray(state.array, state.compare, state.swap, state.sorted);
}

function drawArray(arr, compareArr, swapArr, sortedArr) {
    els.arrayContainer.innerHTML = '';
    
    const maxVal = Math.max(...initialArray);

    arr.forEach((val, idx) => {
        const bar = document.createElement('div');
        bar.className = 'array-bar';
        // Height proportional to value
        const heightPercent = (val / maxVal) * 100;
        bar.style.height = `${Math.max(15, heightPercent)}%`;
        bar.textContent = val;

        // Apply visual classes based on state snapshot
        if (swapArr.includes(idx)) {
            bar.classList.add('swap');
        } else if (compareArr.includes(idx)) {
            bar.classList.add('compare');
        } else if (sortedArr.includes(idx)) {
            bar.classList.add('sorted');
        }

        els.arrayContainer.appendChild(bar);
    });
}

// --- Controls ---
function setupEventListeners() {
    els.btnCompile.addEventListener('click', compileAndSnapshot);

    els.timelineSlider.addEventListener('input', (e) => {
        currentStep = parseInt(e.target.value);
        renderSnapshot(currentStep);
        pausePlayback(); // Manual scrub pauses auto-playback
    });

    els.btnStepFwd.addEventListener('click', () => {
        pausePlayback();
        if (currentStep < stateHistory.length - 1) {
            currentStep++;
            renderSnapshot(currentStep);
        }
    });

    els.btnStepBack.addEventListener('click', () => {
        pausePlayback();
        if (currentStep > 0) {
            currentStep--;
            renderSnapshot(currentStep);
        }
    });

    els.btnPlayPause.addEventListener('click', () => {
        if (stateHistory.length === 0) compileAndSnapshot();
        
        if (isPlaying) {
            pausePlayback();
        } else {
            startPlayback();
        }
    });
}

function startPlayback() {
    if (currentStep >= stateHistory.length - 1) {
        currentStep = 0; // Loop to start if at the end
    }
    
    isPlaying = true;
    els.btnPlayPause.innerHTML = `<i class="fas fa-pause"></i>`;
    
    playInterval = setInterval(() => {
        if (currentStep < stateHistory.length - 1) {
            currentStep++;
            renderSnapshot(currentStep);
        } else {
            pausePlayback();
        }
    }, 400); // 400ms per step
}

function pausePlayback() {
    isPlaying = false;
    els.btnPlayPause.innerHTML = `<i class="fas fa-play"></i>`;
    clearInterval(playInterval);
}
