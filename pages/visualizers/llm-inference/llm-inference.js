/**
 * llm-inference.js
 * Visualizes LLM Decoding Algorithms: Greedy, Beam Search, and Top-p Sampling.
 * Mocks logits, applies Temperature/Softmax, builds a D3 tree, and prunes paths dynamically.
 */

document.addEventListener("DOMContentLoaded", () => {
    initLLMVisualizer();
});

// ==========================================
// 1. STATE & CONSTANTS
// ==========================================

const VOCAB = [
    "is", "learns", "can", "writes", "reads",
    "awesome", "smart", "fast", "complex", "simple",
    "code", "data", "text", "algorithms", "systems",
    "quickly", "efficiently", "deeply", "well", "poorly",
    "and", "but", "so", "because", "while",
    ".", "!", "?", "...", "the"
];

let state = {
    isRunning: false,
    intervalId: null,
    stepCount: 0,
    maxSteps: 8,
    treeData: null,
    nodesList: [],
    activeNodes: [], // Leaf nodes currently being expanded
    nodeIdCounter: 0,
    chartInstance: null
};

const els = {
    algoSelect: document.getElementById('algoSelect'),
    beamWidth: document.getElementById('beamWidth'),
    beamVal: document.getElementById('beamVal'),
    topP: document.getElementById('topP'),
    topPVal: document.getElementById('topPVal'),
    temperature: document.getElementById('temperature'),
    tempVal: document.getElementById('tempVal'),
    promptInput: document.getElementById('promptInput'),
    
    btnGenerate: document.getElementById('btnGenerate'),
    btnStop: document.getElementById('btnStop'),
    
    engineBadge: document.getElementById('engineBadge'),
    textOutput: document.getElementById('textOutput'),
    probChart: document.getElementById('probChart'),
    d3Container: document.getElementById('d3Container'),
    emptyState: document.getElementById('emptyState')
};

let d3Svg, d3G, treeLayout;

// ==========================================
// 2. INITIALIZATION & EVENTS
// ==========================================
function initLLMVisualizer() {
    initChart();
    initD3();
    bindEvents();
}

function bindEvents() {
    els.btnGenerate.addEventListener('click', startGeneration);
    els.btnStop.addEventListener('click', stopGeneration);
    
    // Sliders
    els.beamWidth.addEventListener('input', e => els.beamVal.textContent = e.target.value);
    els.topP.addEventListener('input', e => els.topPVal.textContent = parseFloat(e.target.value).toFixed(1));
    els.temperature.addEventListener('input', e => els.tempVal.textContent = parseFloat(e.target.value).toFixed(1));
    
    // Algorithm Dropdown Logic
    els.algoSelect.addEventListener('change', (e) => {
        const algo = e.target.value;
        if (algo === 'greedy') {
            els.beamWidth.disabled = true;
            els.topP.disabled = true;
        } else if (algo === 'beam') {
            els.beamWidth.disabled = false;
            els.topP.disabled = true;
        } else if (algo === 'topp') {
            els.beamWidth.disabled = true;
            els.topP.disabled = false;
        }
    });
}

// ==========================================
// 3. MOCK LLM ENGINE (Math & Probabilities)
// ==========================================

class TreeNode {
    constructor(id, token, prob, cumLogProb, parent) {
        this.id = id;
        this.token = token;
        this.prob = prob;
        this.cumLogProb = cumLogProb;
        this.parent = parent;
        this.children = [];
        this.status = 'active'; // active, pruned, final
    }
}

// Pseudo-random generator seeded by depth + parent token to ensure deterministic variations
function seededRandom(seedStr) {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
        hash = Math.imul(31, hash) + seedStr.charCodeAt(i) | 0;
    }
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
}

// Generates raw logits for next tokens
function getLogits(node) {
    // Pick 5 random words from vocab to act as candidates
    const candidates = [];
    const seed = node ? node.token + state.stepCount : els.promptInput.value;
    
    // Create a shuffled subset of vocab
    let shuffled = [...VOCAB].sort((a, b) => seededRandom(seed + a) - 0.5);
    const selectedVocab = shuffled.slice(0, 5);
    
    selectedVocab.forEach((word, idx) => {
        // Raw logit score roughly between -2.0 and 5.0
        const logit = (seededRandom(seed + word + idx) * 7) - 2;
        candidates.push({ token: word, logit: logit });
    });
    
    return candidates;
}

function applyTemperatureAndSoftmax(candidates, temp) {
    // Avoid division by zero
    const t = Math.max(temp, 0.01);
    
    // Scale logits
    const scaled = candidates.map(c => ({ ...c, logit: c.logit / t }));
    
    // Softmax
    const maxLogit = Math.max(...scaled.map(c => c.logit));
    const exps = scaled.map(c => Math.exp(c.logit - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    
    const probs = scaled.map((c, i) => ({
        token: c.token,
        prob: exps[i] / sumExps
    }));
    
    // Sort descending by probability
    return probs.sort((a, b) => b.prob - a.prob);
}

// ==========================================
// 4. DECODING ALGORITHMS
// ==========================================

function startGeneration() {
    if (state.isRunning) return;
    
    const prompt = els.promptInput.value.trim() || "The AI";
    
    // Reset State
    state.isRunning = true;
    state.stepCount = 0;
    state.nodeIdCounter = 0;
    state.treeData = new TreeNode(`node_${state.nodeIdCounter++}`, prompt, 1.0, 0, null);
    state.activeNodes = [state.treeData];
    
    els.textOutput.innerHTML = `<span class="prompt-text">${prompt}</span><span class="gen-text" id="genTextSpan"></span><span class="cursor blink"></span>`;
    els.emptyState.style.display = 'none';
    
    els.btnGenerate.classList.add('hidden');
    els.btnStop.classList.remove('hidden');
    els.engineBadge.classList.add('active');
    els.engineBadge.innerHTML = '<i class="fas fa-cog fa-spin"></i> Generating...';
    
    // Start Loop
    stepGeneration();
}

function stopGeneration() {
    if (!state.isRunning) return;
    state.isRunning = false;
    clearTimeout(state.intervalId);
    
    els.btnStop.classList.add('hidden');
    els.btnGenerate.classList.remove('hidden');
    els.engineBadge.classList.remove('active');
    els.engineBadge.innerHTML = '<i class="fas fa-check-circle"></i> Generation Complete';
    
    // Mark best path as final
    highlightFinalPath();
    renderD3();
}

function stepGeneration() {
    if (!state.isRunning || state.stepCount >= state.maxSteps) {
        stopGeneration();
        return;
    }

    state.stepCount++;
    const algo = els.algoSelect.value;
    const temp = parseFloat(els.temperature.value);
    
    let allNewChildren = [];
    
    // 1. Expand all active nodes
    state.activeNodes.forEach(parentNode => {
        const logits = getLogits(parentNode);
        const probs = applyTemperatureAndSoftmax(logits, temp);
        
        // Update Chart for the first active node expansion just to show the math
        if (parentNode === state.activeNodes[0]) {
            updateChart(probs, algo);
        }
        
        // Generate child nodes
        probs.forEach(p => {
            const childCumLogProb = parentNode.cumLogProb + Math.log(p.prob);
            const childNode = new TreeNode(`node_${state.nodeIdCounter++}`, p.token, p.prob, childCumLogProb, parentNode);
            parentNode.children.push(childNode);
            allNewChildren.push(childNode);
        });
    });

    // 2. Filter / Prune based on Algorithm
    state.activeNodes = []; // Reset active

    if (algo === 'greedy') {
        // Keep ONLY the single best child across everything (k=1)
        allNewChildren.sort((a, b) => b.prob - a.prob);
        const best = allNewChildren[0];
        best.status = 'active';
        state.activeNodes.push(best);
        
        // Mark rest as pruned
        allNewChildren.slice(1).forEach(n => n.status = 'pruned');
    } 
    else if (algo === 'beam') {
        const k = parseInt(els.beamWidth.value);
        // Sort ALL generated children by cumulative log probability
        allNewChildren.sort((a, b) => b.cumLogProb - a.cumLogProb);
        
        // Keep top K
        const topK = allNewChildren.slice(0, k);
        topK.forEach(n => { n.status = 'active'; state.activeNodes.push(n); });
        
        // Prune the rest
        allNewChildren.slice(k).forEach(n => n.status = 'pruned');
        
        // Prune parent nodes that have no active children (Visual cleanup)
        pruneDeadBranches(state.treeData);
    }
    else if (algo === 'topp') {
        const p_val = parseFloat(els.topP.value);
        
        // For simplicity in visualizer, Top-P is applied per-parent (like standard sampling)
        // Since we only maintain 1 active path in standard sampling (unlike beam search),
        // we process just the first parent's children
        let parentChildren = allNewChildren; // All children from the single active node
        
        let cumulative = 0;
        let nucleus = [];
        let pruned = [];
        
        for (let i = 0; i < parentChildren.length; i++) {
            const child = parentChildren[i];
            if (cumulative < p_val) {
                nucleus.push(child);
                cumulative += child.prob;
            } else {
                pruned.push(child);
                child.status = 'pruned';
            }
        }
        
        // Sample one from the nucleus. For deterministic visualization, we'll pick pseudo-randomly
        // based on the adjusted probabilities within the nucleus.
        // Simplification: just pick a random one from the nucleus to show sampling behavior!
        const sampledIndex = Math.floor(Math.random() * nucleus.length);
        
        nucleus.forEach((n, idx) => {
            if (idx === sampledIndex) {
                n.status = 'active';
                state.activeNodes.push(n);
            } else {
                n.status = 'pruned';
            }
        });
    }

    // 3. Update Text Output (Show the best path so far)
    updateTextOutput();

    // 4. Render D3
    renderD3();

    // 5. Loop
    state.intervalId = setTimeout(stepGeneration, 1500); // 1.5s delay to allow reading
}

function pruneDeadBranches(node) {
    if (!node.children || node.children.length === 0) return node.status === 'active';
    
    let hasActiveChild = false;
    node.children.forEach(child => {
        if (pruneDeadBranches(child)) hasActiveChild = true;
    });
    
    if (!hasActiveChild && node.status !== 'pruned') {
        node.status = 'pruned';
    }
    return hasActiveChild;
}

function getBestPath() {
    let bestLeaf = null;
    let maxLogProb = -Infinity;
    
    const traverse = (node) => {
        if (!node.children || node.children.length === 0) {
            if (node.status !== 'pruned' && node.cumLogProb > maxLogProb) {
                maxLogProb = node.cumLogProb;
                bestLeaf = node;
            }
        } else {
            node.children.forEach(traverse);
        }
    };
    traverse(state.treeData);
    
    const path = [];
    let curr = bestLeaf;
    while (curr && curr.parent) { // Don't include prompt root
        path.unshift(curr);
        curr = curr.parent;
    }
    return path;
}

function updateTextOutput() {
    const path = getBestPath();
    const text = path.map(n => n.token).join(' ');
    document.getElementById('genTextSpan').textContent = ' ' + text;
}

function highlightFinalPath() {
    const path = getBestPath();
    path.forEach(n => n.status = 'final');
    // Also mark root
    if (state.treeData) state.treeData.status = 'final';
}

// ==========================================
// 5. CHART.JS & D3.JS RENDERING
// ==========================================

function initChart() {
    const ctx = els.probChart.getContext('2d');
    state.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['-', '-', '-', '-', '-'],
            datasets: [{
                label: 'Probability',
                data: [0, 0, 0, 0, 0],
                backgroundColor: 'rgba(168, 85, 247, 0.5)',
                borderColor: '#a855f7',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 400 },
            scales: {
                y: { beginAtZero: true, max: 1.0, grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#cbd5e1' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function updateChart(probs, algo) {
    const p_val = parseFloat(els.topP.value);
    let cumulative = 0;
    
    state.chartInstance.data.labels = probs.map(p => p.token);
    state.chartInstance.data.datasets[0].data = probs.map(p => p.prob);
    
    // Color coding based on algorithm pruning logic
    state.chartInstance.data.datasets[0].backgroundColor = probs.map((p, idx) => {
        if (algo === 'greedy') {
            return idx === 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(51, 65, 85, 0.6)'; // Green for best, Gray for rest
        } else if (algo === 'topp') {
            let color;
            if (cumulative < p_val) {
                color = 'rgba(168, 85, 247, 0.6)'; // Nucleus (Purple)
            } else {
                color = 'rgba(51, 65, 85, 0.6)'; // Pruned (Gray)
            }
            cumulative += p.prob;
            return color;
        } else {
            // Beam search shows all as purple
            return 'rgba(168, 85, 247, 0.6)';
        }
    });
    
    state.chartInstance.update();
}

function initD3() {
    const width = els.d3Container.clientWidth;
    const height = els.d3Container.clientHeight || 400;

    d3Svg = d3.select("#d3Container").append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .call(d3.zoom().on("zoom", (event) => {
            d3G.attr("transform", event.transform);
        }));

    d3G = d3Svg.append("g").attr("transform", `translate(50, ${height/2})`); // Start left, center Y
}

function renderD3() {
    if (!state.treeData) return;
    d3G.selectAll("*").remove();

    const root = d3.hierarchy(state.treeData);
    
    // Horizontal tree layout
    treeLayout = d3.tree().nodeSize([40, 120]); 
    treeLayout(root);

    // Links
    const links = d3G.selectAll(".link")
        .data(root.links())
        .enter().append("path")
        .attr("class", d => {
            if (d.target.data.status === 'final') return 'link final';
            if (d.target.data.status === 'active') return 'link active';
            return 'link';
        })
        .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x))
        // Link thickness based on probability
        .style("stroke-width", d => Math.max(1, d.target.data.prob * 5) + "px");

    // Nodes
    const nodes = d3G.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", d => `node ${d.data.status}`)
        .attr("transform", d => `translate(${d.y},${d.x})`);

    nodes.append("circle")
        .attr("r", 14);

    nodes.append("text")
        .attr("dy", "-18px")
        .text(d => d.data.token);
        
    nodes.append("text")
        .attr("class", "node-prob")
        .attr("dy", "20px")
        .text(d => d.depth === 0 ? "root" : `${(d.data.prob * 100).toFixed(1)}%`);
}
