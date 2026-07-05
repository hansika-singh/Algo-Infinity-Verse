/**
 * fuzz-engine.js
 * main thread
 * Controls the CodeMirror editor and manages the lifecycle of the Fuzz Testing Web Worker.
 */

document.addEventListener("DOMContentLoaded", () => {
    initFuzzEngine();
});

let editor;
let fuzzWorker;

const els = {
    editorContainer: document.getElementById('editorContainer'),
    engineBadge: document.getElementById('engineBadge'),
    
    // Config
    btnStartFuzz: document.getElementById('btnStartFuzz'),
    btnStopFuzz: document.getElementById('btnStopFuzz'),
    iterationCount: document.getElementById('iterationCount'),
    arrLength: document.getElementById('arrLength'),
    valMin: document.getElementById('valMin'),
    valMax: document.getElementById('valMax'),
    
    // Telemetry
    odometerDisplay: document.getElementById('odometerDisplay'),
    fuzzProgress: document.getElementById('fuzzProgress'),
    
    // Reports
    crashReport: document.getElementById('crashReport'),
    crashInput: document.getElementById('crashInput'),
    crashExpected: document.getElementById('crashExpected'),
    crashActual: document.getElementById('crashActual'),
    successReport: document.getElementById('successReport'),
    successCount: document.getElementById('successCount')
};

// Intentionally buggy Kadane's implementation to demonstrate Fuzzing
const DEFAULT_CODE = `/**
 * PROBLEM: Maximum Subarray Sum
 * Write a function that finds the contiguous subarray 
 * with the largest sum and returns its sum.
 */

function maxSubArray(nums) {
    let maxSoFar = 0; 
    let currentMax = 0;
    
    for (let i = 0; i < nums.length; i++) {
        currentMax += nums[i];
        
        if (currentMax < 0) {
            currentMax = 0;
        }
        if (maxSoFar < currentMax) {
            maxSoFar = currentMax;
        }
    }
    
    return maxSoFar;
}

// ⚠️ BUG HINT: Try passing an array with ONLY negative numbers!
// Our Fuzzer will find this instantly.`;

function initFuzzEngine() {
    // 1. Init Editor
    editor = CodeMirror(els.editorContainer, {
        lineNumbers: true,
        theme: 'material-palenight',
        mode: 'javascript',
        value: DEFAULT_CODE,
        indentUnit: 4,
        matchBrackets: true
    });

    // 2. Bind Events
    els.btnStartFuzz.addEventListener('click', startFuzzing);
    els.btnStopFuzz.addEventListener('click', stopFuzzing);
}

function startFuzzing() {
    // Reset UI
    els.crashReport.classList.add('hidden');
    els.successReport.classList.add('hidden');
    els.odometerDisplay.textContent = '0';
    els.odometerDisplay.style.color = 'var(--fuzz-accent)';
    els.fuzzProgress.style.width = '0%';
    
    els.btnStartFuzz.classList.add('hidden');
    els.btnStopFuzz.classList.remove('hidden');
    els.engineBadge.className = 'engine-badge running';
    els.engineBadge.innerHTML = '<i class="fas fa-cog"></i> Fuzzing Active';

    // Terminate old worker if exists
    if (fuzzWorker) fuzzWorker.terminate();

    // Spin up new isolated Web Worker
    try {
        fuzzWorker = new Worker('fuzz-worker.js');
        setupWorkerListeners();
    } catch (e) {
        console.error("Worker failed to start:", e);
        alert("Could not start Web Worker. Fuzzing requires running this file through a local web server (e.g. Live Server) due to browser CORS policies.");
        stopFuzzing();
        return;
    }

    // Pass configuration and user code to Worker
    const config = {
        code: editor.getValue(),
        iterations: parseInt(els.iterationCount.value),
        maxLen: parseInt(els.arrLength.value),
        minVal: parseInt(els.valMin.value),
        maxVal: parseInt(els.valMax.value)
    };

    fuzzWorker.postMessage({ type: 'start', config });
}

function stopFuzzing() {
    if (fuzzWorker) {
        fuzzWorker.terminate();
        fuzzWorker = null;
    }
    
    els.btnStopFuzz.classList.add('hidden');
    els.btnStartFuzz.classList.remove('hidden');
    els.engineBadge.className = 'engine-badge';
    els.engineBadge.innerHTML = '<i class="fas fa-shield-alt"></i> Fuzz Engine Idle';
}

function setupWorkerListeners() {
    fuzzWorker.onmessage = (event) => {
        const msg = event.data;

        if (msg.type === 'progress') {
            // Update Odometer
            els.odometerDisplay.textContent = msg.count.toLocaleString();
            const total = parseInt(els.iterationCount.value);
            els.fuzzProgress.style.width = `${(msg.count / total) * 100}%`;
        } 
        else if (msg.type === 'fail') {
            // CRASH DETECTED
            stopFuzzing();
            els.odometerDisplay.style.color = 'var(--fuzz-danger)';
            
            els.crashInput.textContent = `[${msg.input.join(', ')}]`;
            els.crashExpected.textContent = msg.expected;
            els.crashActual.textContent = msg.actual;
            els.crashReport.classList.remove('hidden');
        } 
        else if (msg.type === 'pass') {
            // SUCCESS
            stopFuzzing();
            els.fuzzProgress.style.width = '100%';
            els.odometerDisplay.textContent = els.iterationCount.value.toLocaleString();
            els.odometerDisplay.style.color = 'var(--fuzz-success)';
            
            els.successCount.textContent = els.iterationCount.value.toLocaleString();
            els.successReport.classList.remove('hidden');
        } 
        else if (msg.type === 'error') {
            // Runtime Exception in User Code
            stopFuzzing();
            els.odometerDisplay.style.color = 'var(--fuzz-danger)';
            
            els.crashInput.textContent = "N/A (Syntax or Runtime Error)";
            els.crashExpected.textContent = "Valid Execution";
            els.crashActual.textContent = msg.error;
            els.crashReport.classList.remove('hidden');
        }
    };
}
