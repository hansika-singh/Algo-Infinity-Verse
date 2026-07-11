/**
 * memory-leak-simulator.js
 * Interactive Memory Leak Debugger Simulator
 */

const scenarios = {
    timer: {
        title: "Uncleared setInterval",
        desc: "A common leak is setting an interval that allocates memory or references objects, but never clearing it when the component is destroyed. The interval keeps the closure and its objects alive forever.",
        code: `// Buggy code: The interval runs forever.
let intervalId = setInterval(() => {
    // Simulate allocating 5 objects every tick
    allocateMemory(5); 
}, 100);

// FIX: Un-comment the line below to clear the interval after some time.
// setTimeout(() => clearInterval(intervalId), 3000);
`
    },
    dom: {
        title: "Detached DOM Elements",
        desc: "If you remove a DOM node from the document but keep a reference to it in JavaScript, it cannot be garbage collected. This is known as a detached DOM leak.",
        code: `// Buggy code: Removing element from DOM but keeping JS reference.
let detachedNodes = [];

function createNode() {
    let node = document.createElement('div');
    document.body.appendChild(node);
    
    // Simulate removing from DOM later
    setTimeout(() => {
        document.body.removeChild(node);
        // LEAK: We still hold a reference in the array!
        detachedNodes.push(node);
    }, 200);
}

// Keep creating nodes
let intId = setInterval(createNode, 200);

// FIX: Stop the interval and clear the array to allow GC.
// setTimeout(() => { clearInterval(intId); detachedNodes = []; }, 3000);
`
    },
    event: {
        title: "Unremoved Event Listeners",
        desc: "Event listeners attached to long-lived objects (like window or document) keep their callback closures alive. If you don't remove them when an element is destroyed, you leak memory.",
        code: `// Buggy code: Adding listeners but never removing them.
let container = document.createElement('div');

function attachListener() {
    let largeData = allocateMemory(50); // Heavy object
    
    // Adding listener to a global mock object
    window.addEventListener('resize', function() {
        console.log(largeData);
    });
}

let intId = setInterval(attachListener, 500);

// FIX: Always use removeEventListener when done, or don't attach in a loop!
// setTimeout(() => clearInterval(intId), 3000);
`
    }
};

// --- App State ---
let editor;
let isRunning = false;
let simLoopId = null;
let graphLoopId = null;

// Virtual Sandbox State
let sandbox = {
    timers: [],
    eventListeners: 0,
    allocatedObjects: 0,
    detachedNodes: 0,
    attachedNodes: 0,
    baseMemory: 100 // Baseline memory score
};

// Graph State
const history = [];
const MAX_HISTORY = 100;
let canvas, ctx;

document.addEventListener("DOMContentLoaded", () => {
    initUI();
    initGraph();
    loadScenario('timer');
});

function initUI() {
    editor = CodeMirror(document.getElementById('editorContainer'), {
        lineNumbers: true,
        theme: 'material-ocean',
        mode: 'javascript',
        indentUnit: 4,
        matchBrackets: true
    });

    document.getElementById('scenarioSelect').addEventListener('change', (e) => {
        loadScenario(e.target.value);
    });

    document.getElementById('btnRun').addEventListener('click', startSimulation);
    document.getElementById('btnStop').addEventListener('click', stopSimulation);
    document.getElementById('btnGC').addEventListener('click', forceGC);
    document.getElementById('btnReset').addEventListener('click', () => {
        stopSimulation();
        loadScenario(document.getElementById('scenarioSelect').value);
    });
}

function loadScenario(key) {
    stopSimulation();
    const scenario = scenarios[key];
    if (!scenario) return;

    document.getElementById('scenarioInfo').innerHTML = `
        <h4>${scenario.title}</h4>
        <p>${scenario.desc}</p>
    `;
    
    editor.setValue(scenario.code);
    resetSandbox();
    clearGraph();
}

function resetSandbox() {
    // Clear all virtual timers
    sandbox.timers.forEach(t => {
        clearTimeout(t.id);
        clearInterval(t.id);
    });
    
    sandbox = {
        timers: [],
        eventListeners: 0,
        allocatedObjects: 0,
        detachedNodes: 0,
        attachedNodes: 0,
        baseMemory: 100,
        globalScope: {} // Objects retained globally
    };
}

function startSimulation() {
    if (isRunning) return;
    
    resetSandbox();
    clearGraph();
    
    const userCode = editor.getValue();
    isRunning = true;
    
    document.getElementById('btnRun').classList.add('hidden');
    document.getElementById('btnStop').classList.remove('hidden');
    document.getElementById('simStatus').textContent = 'Running';
    document.getElementById('simStatus').className = 'status-running';

    // Build the Virtual Context
    // We proxy standard functions so they affect our sandbox state instead of the real browser.
    const context = {
        console: { log: () => {} },
        allocateMemory: (amount) => {
            sandbox.allocatedObjects += amount;
            return { _virtualSize: amount };
        },
        setInterval: (fn, ms) => {
            const id = setInterval(() => {
                if (isRunning) fn();
            }, ms);
            sandbox.timers.push({ id, type: 'interval', fn, active: true });
            return id;
        },
        clearInterval: (id) => {
            clearInterval(id);
            const t = sandbox.timers.find(t => t.id === id);
            if (t) t.active = false;
        },
        setTimeout: (fn, ms) => {
            const id = setTimeout(() => {
                if (isRunning) fn();
                const t = sandbox.timers.find(t => t.id === id);
                if (t) t.active = false;
            }, ms);
            sandbox.timers.push({ id, type: 'timeout', fn, active: true });
            return id;
        },
        clearTimeout: (id) => {
            clearTimeout(id);
            const t = sandbox.timers.find(t => t.id === id);
            if (t) t.active = false;
        },
        document: {
            createElement: (tag) => {
                return { _isNode: true, attached: false };
            },
            body: {
                appendChild: (node) => {
                    if (node && node._isNode) {
                        node.attached = true;
                        sandbox.attachedNodes++;
                    }
                },
                removeChild: (node) => {
                    if (node && node._isNode && node.attached) {
                        node.attached = false;
                        sandbox.attachedNodes--;
                        // If they don't explicitly null it, it's detached
                        sandbox.detachedNodes++;
                    }
                }
            }
        },
        window: {
            addEventListener: (evt, cb) => {
                sandbox.eventListeners++;
            },
            removeEventListener: (evt, cb) => {
                sandbox.eventListeners--;
            }
        }
    };

    try {
        // Execute user code safely
        const argNames = Object.keys(context);
        const argValues = Object.values(context);
        const fn = new Function(...argNames, userCode);
        fn(...argValues);
    } catch (err) {
        void 0;
        stopSimulation();
        return;
    }

    // Start graph render loop
    graphLoopId = requestAnimationFrame(renderGraph);
}

function stopSimulation() {
    isRunning = false;
    
    // Clear actual JS timers created by sandbox
    sandbox.timers.forEach(t => {
        clearTimeout(t.id);
        clearInterval(t.id);
    });

    if (graphLoopId) cancelAnimationFrame(graphLoopId);

    document.getElementById('btnRun').classList.remove('hidden');
    document.getElementById('btnStop').classList.add('hidden');
    document.getElementById('simStatus').textContent = 'Stopped';
    document.getElementById('simStatus').className = 'status-idle';
}

function forceGC() {
    if (!isRunning) return;
    
    // Simulate Garbage Collection
    // In a real engine, GC cleans up unreferenced objects.
    // In our virtual engine:
    // 1. If timers are active, their closures (and allocatedObjects) are retained.
    // 2. Detached nodes are retained if they are in global scope (which we assume they are for simplicity if active).
    
    // Calculate what gets swept.
    let activeTimers = sandbox.timers.filter(t => t.active).length;
    
    // If they cleared the timers, we can sweep the allocated memory tied to them.
    // Simple heuristic for simulation:
    let objectsToKeep = 0;
    if (activeTimers > 0) {
        objectsToKeep += sandbox.allocatedObjects; // Cannot GC if interval is running
    } else {
        sandbox.allocatedObjects = 0; // Swept!
    }

    if (sandbox.eventListeners === 0) {
        // No leaks from listeners
    }

    // Update UI badge to reflect a "GC flash"
    const badge = document.getElementById('memBadge');
    badge.style.backgroundColor = 'var(--success-color, #50fa7b)';
    badge.style.color = '#000';
    setTimeout(() => {
        badge.style.backgroundColor = '';
        badge.style.color = '';
    }, 500);
}

// --- Graph Logic ---

function initGraph() {
    canvas = document.getElementById('memoryGraph');
    ctx = canvas.getContext('2d');
    
    // Handle resizing
    const resize = () => {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        if (!isRunning) drawGraph();
    };
    window.addEventListener('resize', resize);
    resize();
}

function clearGraph() {
    history.length = 0;
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function calculateCurrentMemory() {
    // Total virtual memory = Base + Allocated + Detached Nodes + Listeners
    let mem = sandbox.baseMemory;
    mem += sandbox.allocatedObjects * 2;
    mem += sandbox.detachedNodes * 5;
    mem += sandbox.eventListeners * 10;
    
    // Also, active timers have overhead
    let activeTimers = sandbox.timers.filter(t => t.active).length;
    mem += activeTimers * 15;

    return mem;
}

let lastRenderTime = 0;

function renderGraph(timestamp) {
    if (!isRunning) return;
    
    if (timestamp - lastRenderTime > 100) {
        // Update history 10 times a second
        let currentMem = calculateCurrentMemory();
        history.push(currentMem);
        if (history.length > MAX_HISTORY) {
            history.shift();
        }
        
        document.getElementById('memBadge').textContent = `${currentMem} Objects`;
        drawGraph();
        lastRenderTime = timestamp;
    }
    
    graphLoopId = requestAnimationFrame(renderGraph);
}

function drawGraph() {
    if (!ctx || !canvas || history.length === 0) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Determine max Y scale
    const maxVal = Math.max(500, ...history) * 1.2;
    
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    const step = width / (MAX_HISTORY - 1);
    
    for (let i = 0; i < history.length; i++) {
        const x = i * step;
        const y = height - ((history[i] / maxVal) * height);
        ctx.lineTo(x, y);
    }
    
    // Fill under curve
    ctx.lineTo((history.length - 1) * step, height);
    ctx.closePath();
    
    const isDark = document.documentElement.classList.contains('light-mode') === false;
    const colorRGB = isDark ? '255, 121, 198' : '0, 123, 255'; // Pink in dark mode, Blue in light
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `rgba(${colorRGB}, 0.5)`);
    gradient.addColorStop(1, `rgba(${colorRGB}, 0.05)`);
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw line
    ctx.beginPath();
    for (let i = 0; i < history.length; i++) {
        const x = i * step;
        const y = height - ((history[i] / maxVal) * height);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    
    ctx.strokeStyle = `rgb(${colorRGB})`;
    ctx.lineWidth = 2;
    ctx.stroke();
}
