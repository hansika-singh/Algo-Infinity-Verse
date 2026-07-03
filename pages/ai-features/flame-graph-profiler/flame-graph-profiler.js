/**
 * flame-graph-profiler.js
 * Implements an Execution Engine and a custom D3.js Partition Layout
 * to render a Real-Time Call Stack Flame Graph.
 */

document.addEventListener("DOMContentLoaded", () => {
    initProfilerApp();
});


// ==========================================
// 2. EDITOR & APP STATE
// ==========================================

let editor;
const els = {
    editorContainer: document.getElementById('editorContainer'),
    btnProfileCode: document.getElementById('btnProfileCode'),
    flameGraphContainer: document.getElementById('flameGraphContainer'),
    emptyState: document.getElementById('emptyState'),
    d3Tooltip: document.getElementById('d3Tooltip'),
    
    // Stats
    statTotalTime: document.getElementById('statTotalTime'),
    statMaxDepth: document.getElementById('statMaxDepth'),
    statNodeCount: document.getElementById('statNodeCount')
};

function initProfilerApp() {
    // 1. Initialize CodeMirror with Traced Fibonacci Example
    editor = CodeMirror(els.editorContainer, {
        lineNumbers: true,
        theme: 'material-darker',
        mode: 'javascript',
        value: `// Recursive Fibonacci with manual trace instrumentation
function fib(n) {
    // 1. Mark function entry
    Tracer.enter(\`fib(\${n})\`);
    
    let result;
    if (n <= 1) {
        simulateHeavyWork(2); // Mocking DB/API latency
        result = 1;
    } else {
        // Recursive calls
        result = fib(n - 1) + fib(n - 2);
    }
    
    // 2. Mark function exit
    Tracer.exit();
    return result;
}

// Kick off the execution
fib(5);
`,
        indentUnit: 4,
        matchBrackets: true
    });

    // 2. Bind Execution Event
    els.btnProfileCode.addEventListener('click', executeAndProfile);
}

function executeAndProfile() {
    els.emptyState.style.display = 'none';
    els.btnProfileCode.disabled = true;
    els.btnProfileCode.textContent = "Profiling...";
    
    const code = editor.getValue();
    const worker = new Worker('profiler-worker.js');
    const timeoutMs = 5000;

    const cleanup = () => {
        clearTimeout(timeoutId);
        worker.terminate();
        els.btnProfileCode.disabled = false;
        els.btnProfileCode.textContent = "Run Profile";
    };

    const timeoutId = setTimeout(() => {
        cleanup();
        alert(`Execution Error: Timeout / Infinite Loop Detected (exceeded ${timeoutMs}ms)`);
    }, timeoutMs);

    worker.onmessage = (e) => {
        cleanup();
        const { success, error, traceData } = e.data;
        if (success) {
            if (traceData) {
                renderFlameGraph(traceData);
                updateStats(traceData);
            } else {
                alert("No trace data generated. Did you use Tracer.enter() and Tracer.exit()?");
            }
        } else {
            alert(`Execution Error: ${error}`);
        }
    };

    worker.onerror = (err) => {
        cleanup();
        alert(`Worker Error: ${err.message}`);
        console.error(err);
    };

    worker.postMessage({ code });
}

// ==========================================
// 3. D3.JS FLAME GRAPH RENDERER
// ==========================================

function renderFlameGraph(data) {
    // Clear existing canvas
    d3.select("#flameGraphContainer").selectAll("svg").remove();

    const containerRect = els.flameGraphContainer.getBoundingClientRect();
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = containerRect.width - margin.left - margin.right;
    const height = containerRect.height - margin.top - margin.bottom;

    // Color Scale: Warm Fire colors based on call depth
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 10]);

    // Format D3 Hierarchy
    // We sum by exclusiveTime so a parent's width equals its own time PLUS its children's time
    const root = d3.hierarchy(data)
        .sum(d => d.exclusiveTime)
        .sort((a, b) => b.value - a.value); // Sort to keep graph stable

    // Configure Partition Layout
    const partition = d3.partition()
        .size([width, height])
        .padding(1);

    partition(root);

    // Create SVG Canvas
    const svg = d3.select("#flameGraphContainer")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate dynamic node heights based on max depth to fit screen
    const maxDepth = d3.max(root.descendants(), d => d.depth);
    const nodeHeight = Math.min(30, height / (maxDepth + 1));

    // Draw Nodes
    const cell = svg.selectAll(".flame-node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", "flame-node")
        // Invert Y axis: Root is at the bottom of the screen
        .attr("transform", d => `translate(${d.x0}, ${height - (d.depth + 1) * nodeHeight})`)
        .on("mousemove", handleMouseOver)
        .on("mouseout", handleMouseOut);

    // Draw Rectangles
    cell.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", nodeHeight - 2)
        .attr("fill", d => colorScale(d.depth + 2)) // Shift color index for better contrast
        .attr("stroke", "rgba(0,0,0,0.3)")
        .attr("rx", 3);

    // Draw Labels (Only if the box is wide enough to fit text)
    cell.append("text")
        .attr("class", "flame-label")
        .attr("x", 4)
        .attr("y", (nodeHeight / 2) + 2)
        .text(d => {
            const rectWidth = d.x1 - d.x0;
            return rectWidth > 40 ? d.data.name : "";
        });
}

// --- D3 Interactions ---
function handleMouseOver(event, d) {
    const tooltip = els.d3Tooltip;
    
    // Populate Data
    document.getElementById('ttName').textContent = d.data.name;
    document.getElementById('ttTotal').textContent = `${d.data.totalTime.toFixed(2)} ms`;
    document.getElementById('ttExclusive').textContent = `${d.data.exclusiveTime.toFixed(2)} ms`;
    
    // Calculate percentage relative to the root execution time
    const rootTime = d.ancestors()[d.ancestors().length - 1].data.totalTime;
    const percentage = ((d.data.totalTime / rootTime) * 100).toFixed(1);
    document.getElementById('ttPercentage').textContent = `${percentage}%`;

    // Position Tooltip attached to cursor
    tooltip.style.left = `${event.pageX}px`;
    tooltip.style.top = `${event.pageY - 15}px`;
    tooltip.classList.remove('hidden');
    tooltip.style.opacity = '1';
}

function handleMouseOut() {
    els.d3Tooltip.classList.add('hidden');
    els.d3Tooltip.style.opacity = '0';
}

// --- HUD Updates ---
function updateStats(traceRoot) {
    let nodeCount = 0;
    let maxDepth = 0;

    function traverse(node, depth) {
        nodeCount++;
        if (depth > maxDepth) maxDepth = depth;
        node.children.forEach(child => traverse(child, depth + 1));
    }
    traverse(traceRoot, 0);

    els.statTotalTime.textContent = `${traceRoot.totalTime.toFixed(2)} ms`;
    els.statMaxDepth.textContent = maxDepth;
    els.statNodeCount.textContent = nodeCount;
}
