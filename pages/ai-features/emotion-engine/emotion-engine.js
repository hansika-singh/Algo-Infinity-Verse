/**
 * emotion-engine.js
 * An invisible telemetry engine that calculates a "Frustration Score" 
 * based on edit frequency, error retries, and delay time.
 */

document.addEventListener("DOMContentLoaded", () => {
    initEmotionEngine();
});

// --- Telemetry State ---
const state = {
    frustrationScore: 0,
    threshold: 100, // Score needed to trigger intervention
    
    // Tracking Variables
    failedRetries: 0,
    backspaceCount: 0,
    lastKeystrokeTime: Date.now(),
    lastFailTime: null,
    
    // Timers
    idleTimer: null,
    metricsDecayTimer: null,
    
    isInterventionActive: false
};

// --- DOM Elements ---
const els = {
    editorContainer: document.getElementById('editorContainer'),
    btnRunCode: document.getElementById('btnRunCode'),
    consoleOutput: document.getElementById('consoleOutput'),
    interventionOverlay: document.getElementById('interventionOverlay'),
    
    // Interventions
    btnGiveHint: document.getElementById('btnGiveHint'),
    btnReduceDiff: document.getElementById('btnReduceDiff'),
    btnSwitchMode: document.getElementById('btnSwitchMode'),
    btnDismiss: document.getElementById('btnDismiss'),
    
    // Dynamic Content Updates
    difficultyBadge: document.getElementById('difficultyBadge'),
    problemTitle: document.getElementById('problemTitle'),
    problemDesc: document.getElementById('problemDesc'),
    hintBox: document.getElementById('hintBox'),
    
    // Debug
    debugScore: document.getElementById('debugScore'),
    debugMetric: document.getElementById('debugMetric')
};

let editor;

function initEmotionEngine() {
    editor = CodeMirror(els.editorContainer, {
        lineNumbers: true,
        theme: 'material-ocean',
        mode: 'javascript',
        value: `function alienOrder(words) {\n    // I have no idea how to start this graph...\n    \n}`,
        indentUnit: 4
    });

    setupTelemetry();
    setupEventListeners();
    startDecayLoop(); // Gradually reduces frustration over time if user calms down
}

// --- 1. The Core Telemetry Trackers ---
function setupTelemetry() {
    // A. Edit Frequency Tracking (Frantic Deletions)
    editor.on('keydown', (cm, event) => {
        state.lastKeystrokeTime = Date.now();
        resetIdleTimer();

        if (event.key === 'Backspace' || event.key === 'Delete') {
            state.backspaceCount++;
            
            // Spike frustration if frantically deleting (more than 5 quick backspaces)
            if (state.backspaceCount > 5) {
                increaseFrustration(15, "Frantic Code Deletion");
                state.backspaceCount = 0; // reset for next burst
            }
        } else {
            // Typing normally resets the backspace combo
            state.backspaceCount = 0;
            // Reward smooth typing with slight frustration decay
            if (state.frustrationScore > 0 && Math.random() > 0.8) {
                state.frustrationScore = Math.max(0, state.frustrationScore - 1);
                updateDebug();
            }
        }
    });

    // B. Delay / Idle Time Tracking (Staring blankly after a failure)
    resetIdleTimer();
}

function resetIdleTimer() {
    clearTimeout(state.idleTimer);
    
    // If the user goes idle for 15 seconds, evaluate context
    state.idleTimer = setTimeout(() => {
        // If they went idle shortly after a failed test run, they are likely stuck/frustrated
        if (state.lastFailTime && (Date.now() - state.lastFailTime) < 30000) {
            increaseFrustration(25, "Extended Delay Post-Failure");
        } else {
            increaseFrustration(10, "Extended Idle Time");
        }
    }, 15000); 
}

function startDecayLoop() {
    // Frustration decays by 5 points every 10 seconds to account for the user taking a breath/thinking
    state.metricsDecayTimer = setInterval(() => {
        if (state.frustrationScore > 0 && !state.isInterventionActive) {
            state.frustrationScore = Math.max(0, state.frustrationScore - 5);
            updateDebug("Decay (-5)");
        }
    }, 10000);
}

// --- 2. Action Handlers ---
function setupEventListeners() {
    // C. Retry Tracking (Running code over and over without fixing errors)
    els.btnRunCode.addEventListener('click', () => {
        els.consoleOutput.innerHTML = `<span class="text-muted">> Executing tests...</span>`;
        
        setTimeout(() => {
            // Mocking a failure compilation
            els.consoleOutput.innerHTML += `<br><span class="text-error">✗ Error: RangeError: Maximum call stack size exceeded at alienOrder (line 3)</span>`;
            
            state.failedRetries++;
            state.lastFailTime = Date.now();
            
            // Exponential frustration penalty for rapid retries
            let penalty = 20 * state.failedRetries; 
            increaseFrustration(penalty, "Rapid Failed Retries");
            
        }, 600);
    });

    // Intervention Resolvers
    els.btnGiveHint.addEventListener('click', applyHintStrategy);
    els.btnReduceDiff.addEventListener('click', applyDifficultyStepDown);
    els.btnSwitchMode.addEventListener('click', applyModeSwitch);
    els.btnDismiss.addEventListener('click', hideIntervention);
}

// --- 3. Emotion Engine Logic ---
function increaseFrustration(points, triggerReason) {
    if (state.isInterventionActive) return;

    state.frustrationScore += points;
    updateDebug(triggerReason);

    if (state.frustrationScore >= state.threshold) {
        triggerIntervention();
    }
}

function triggerIntervention() {
    state.isInterventionActive = true;
    els.interventionOverlay.classList.remove('hidden');
    clearTimeout(state.idleTimer); // Pause idle tracking while modal is open
}

function hideIntervention() {
    state.isInterventionActive = false;
    els.interventionOverlay.classList.add('hidden');
    state.frustrationScore = 0; // Reset score
    state.failedRetries = 0;
    updateDebug("Reset");
    resetIdleTimer();
}

function updateDebug(metric = "Stable") {
    els.debugScore.textContent = Math.min(state.frustrationScore, state.threshold);
    els.debugMetric.textContent = metric;
}

// --- 4. Dynamic Adjustments (Acceptance Criteria) ---
function applyHintStrategy() {
    hideIntervention();
    els.hintBox.classList.remove('hidden');
}

function applyDifficultyStepDown() {
    hideIntervention();
    
    // Dynamically alter the DOM to reflect an easier version of the problem
    els.difficultyBadge.className = 'badge medium';
    els.difficultyBadge.textContent = 'Medium';
    
    els.problemTitle.textContent = 'Course Schedule (Cycle Detection)';
    els.problemDesc.innerHTML = `Let's simplify. Instead of ordering an entire alien language, let's just detect if it's possible to finish a list of courses given their prerequisites. <br><br>Return <code>true</code> if you can finish all courses, otherwise return <code>false</code>.`;
    
    editor.setValue(`function canFinish(numCourses, prerequisites) {\n    // Hint: Start by creating an adjacency list mapping courses to their prereqs\n    const adjList = new Map();\n    \n}`);
    
    els.hintBox.classList.add('hidden'); // Clear previous hints
}

function applyModeSwitch() {
    hideIntervention();
    void 0;
    // In a real environment, this would initialize the Drag-and-Drop visualizer built in a previous PR
}
