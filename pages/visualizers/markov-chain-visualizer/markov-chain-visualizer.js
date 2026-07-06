/* markov-chain-visualizer.js */

const EXAMPLES = {
    custom: "I am Sam. Sam I am. I do not like green eggs and ham.",
    weather: "Sunny Sunny Rainy Sunny Rainy Rainy Sunny Sunny Sunny Rainy",
    seuss: "One fish two fish red fish blue fish. Black fish blue fish old fish new fish. This one has a little star.",
    shakespeare: "Shall I compare thee to a summer's day? Thou art more lovely and more temperate. Rough winds do shake the darling buds of May."
};

class MarkovChain {
    constructor() {
        this.transitions = {}; // { state1: { state2: count, ... }, ... }
        this.probabilities = {}; // { state1: { state2: prob, ... }, ... }
        this.states = [];
        this.order = 1;
        this.startStates = [];
    }

    tokenize(text) {
        // Simple tokenization: lowercase, remove some punctuation, split by whitespace
        return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0);
    }

    build(text, order = 1) {
        this.order = order;
        this.transitions = {};
        this.probabilities = {};
        this.states = [];
        this.startStates = [];

        const tokens = this.tokenize(text);
        if (tokens.length <= order) return;

        // Build N-grams
        for (let i = 0; i <= tokens.length - order; i++) {
            const stateArr = tokens.slice(i, i + order);
            const state = stateArr.join(' ');
            
            if (i === 0) this.startStates.push(state);

            if (!this.transitions[state]) {
                this.transitions[state] = {};
            }

            if (i + order < tokens.length) {
                // For order 1, next state is the single next word
                // For order 2, next state is (token[i+1], token[i+2])
                const nextStateArr = tokens.slice(i + 1, i + 1 + order);
                const nextState = nextStateArr.join(' ');
                
                if (!this.transitions[state][nextState]) {
                    this.transitions[state][nextState] = 0;
                }
                this.transitions[state][nextState]++;
            }
        }

        // Calculate Probabilities
        this.states = Object.keys(this.transitions);
        for (const state of this.states) {
            this.probabilities[state] = {};
            const totalTransitions = Object.values(this.transitions[state]).reduce((a, b) => a + b, 0);
            
            for (const nextState in this.transitions[state]) {
                if (totalTransitions > 0) {
                    this.probabilities[state][nextState] = this.transitions[state][nextState] / totalTransitions;
                }
            }
        }
    }

    getNextState(currentState) {
        const probs = this.probabilities[currentState];
        if (!probs || Object.keys(probs).length === 0) return null;

        const rand = Math.random();
        let cumulative = 0;
        
        for (const [nextState, prob] of Object.entries(probs)) {
            cumulative += prob;
            if (rand <= cumulative) {
                return nextState;
            }
        }
        return Object.keys(probs)[0];
    }
}

// --- UI & Visualization Logic ---
const mc = new MarkovChain();
let isPlaying = false;
let playInterval = null;
let currentGenState = null;
let generatedOutput = [];
let maxGenLength = 20;
let simulation = null;

// DOM Elements
const corpusInput = document.getElementById('corpusInput');
const exampleSelect = document.getElementById('exampleSelect');
const orderSelect = document.getElementById('orderSelect');
const btnBuildChain = document.getElementById('btnBuildChain');
const btnReset = document.getElementById('btnReset');
const btnPlayPause = document.getElementById('btnPlayPause');
const btnStepFwd = document.getElementById('btnStepFwd');
const speedSlider = document.getElementById('speedSlider');
const genLengthInput = document.getElementById('genLengthInput');

const statStates = document.getElementById('statStates');
const statCurrentState = document.getElementById('statCurrentState');
const statNextProbable = document.getElementById('statNextProbable');
const outputContainer = document.getElementById('outputContainer');
const matrixHeader = document.getElementById('matrixHeader');
const matrixBody = document.getElementById('matrixBody');

function init() {
    exampleSelect.addEventListener('change', (e) => {
        if (e.target.value !== 'custom') {
            corpusInput.value = EXAMPLES[e.target.value];
        }
    });

    btnBuildChain.addEventListener('click', () => {
        buildModel();
    });

    btnPlayPause.addEventListener('click', () => {
        if (isPlaying) pause();
        else play();
    });

    btnStepFwd.addEventListener('click', () => {
        pause();
        step();
    });

    btnReset.addEventListener('click', () => {
        pause();
        resetGeneration();
    });

    speedSlider.addEventListener('input', () => {
        if (isPlaying) {
            pause();
            play();
        }
    });

    // Build initial model
    corpusInput.value = EXAMPLES.seuss;
    exampleSelect.value = 'seuss';
    buildModel();
}

function buildModel() {
    pause();
    const text = corpusInput.value;
    const order = parseInt(orderSelect.value);
    
    mc.build(text, order);
    
    statStates.textContent = mc.states.length;
    resetGeneration();
    renderMatrix();
    renderGraph();
}

function resetGeneration() {
    generatedOutput = [];
    outputContainer.innerHTML = '<p class="placeholder">Click "Start Generation" or "Step" to see text.</p>';
    currentGenState = mc.startStates.length > 0 ? mc.startStates[Math.floor(Math.random() * mc.startStates.length)] : null;
    maxGenLength = parseInt(genLengthInput.value) || 20;
    updateUI();
}

function step() {
    if (!currentGenState || generatedOutput.length >= maxGenLength) {
        pause();
        return false;
    }

    if (generatedOutput.length === 0) {
        // Output first state completely
        generatedOutput.push(...currentGenState.split(' '));
    } else {
        // Output the *last* word of the new state (for N-grams > 1)
        const nextState = mc.getNextState(currentGenState);
        if (!nextState) {
            pause();
            return false;
        }
        
        // Find which link is active for animation
        highlightLink(currentGenState, nextState);
        
        currentGenState = nextState;
        const words = currentGenState.split(' ');
        generatedOutput.push(words[words.length - 1]);
    }

    updateUI();
    return true;
}

function play() {
    if (!currentGenState || generatedOutput.length >= maxGenLength) resetGeneration();
    
    isPlaying = true;
    btnPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
    
    const delay = parseInt(speedSlider.value);
    playInterval = setInterval(() => {
        const canStep = step();
        if (!canStep) pause();
    }, delay);
}

function pause() {
    isPlaying = false;
    btnPlayPause.innerHTML = '<i class="fas fa-play"></i>';
    clearInterval(playInterval);
}

function updateUI() {
    // 1. Update text output
    if (generatedOutput.length > 0) {
        outputContainer.innerHTML = '';
        generatedOutput.forEach((word, i) => {
            const span = document.createElement('span');
            span.textContent = word + ' ';
            if (i >= generatedOutput.length - mc.order) {
                span.className = 'active-word';
            }
            outputContainer.appendChild(span);
        });
    }

    // 2. Update Stats
    statCurrentState.textContent = currentGenState || 'None';
    
    if (currentGenState && mc.probabilities[currentGenState]) {
        const probs = mc.probabilities[currentGenState];
        const nextKeys = Object.keys(probs);
        if (nextKeys.length > 0) {
            // Find max prob
            let maxK = nextKeys[0];
            for (let k of nextKeys) {
                if (probs[k] > probs[maxK]) maxK = k;
            }
            statNextProbable.textContent = `${maxK} (${(probs[maxK]*100).toFixed(1)}%)`;
        } else {
            statNextProbable.textContent = 'None (End)';
        }
    } else {
        statNextProbable.textContent = '-';
    }

    // 3. Highlight Graph Node
    d3.selectAll('.node').classed('active', false);
    if (currentGenState) {
        const safeId = 'node-' + currentGenState.replace(/[^a-zA-Z0-9]/g, '_');
        d3.select('#' + safeId).classed('active', true);
    }
    
    // 4. Highlight Matrix Cell
    document.querySelectorAll('.active-cell').forEach(c => c.classList.remove('active-cell'));
    if (currentGenState) {
        const row = document.getElementById('row-' + currentGenState.replace(/[^a-zA-Z0-9]/g, '_'));
        if (row) {
            row.classList.add('active-cell'); // just highlighting the row or specific cell later
        }
    }
}

function highlightLink(src, target) {
    d3.selectAll('.link').classed('active', false);
    d3.selectAll('.link-label').classed('active', false);
    
    const safeSrc = src.replace(/[^a-zA-Z0-9]/g, '_');
    const safeTgt = target.replace(/[^a-zA-Z0-9]/g, '_');
    const linkId = `#link-${safeSrc}-${safeTgt}`;
    const labelId = `#label-${safeSrc}-${safeTgt}`;
    
    d3.select(linkId).classed('active', true);
    d3.select(labelId).classed('active', true);
}

function renderMatrix() {
    matrixHeader.innerHTML = '<th>State \\ Next</th>';
    matrixBody.innerHTML = '';

    // To prevent massive tables, limit to top 20 states if huge
    let displayStates = mc.states;
    if (displayStates.length > 20) {
        displayStates = displayStates.slice(0, 20);
        matrixHeader.innerHTML = '<th>State (Top 20) \\ Next</th>';
    }

    // Create Headers
    displayStates.forEach(s => {
        const th = document.createElement('th');
        th.textContent = s;
        matrixHeader.appendChild(th);
    });

    // Create Rows
    displayStates.forEach(src => {
        const tr = document.createElement('tr');
        tr.id = 'row-' + src.replace(/[^a-zA-Z0-9]/g, '_');
        
        const th = document.createElement('th');
        th.textContent = src;
        tr.appendChild(th);

        displayStates.forEach(tgt => {
            const td = document.createElement('td');
            const prob = mc.probabilities[src][tgt];
            if (prob) {
                td.textContent = prob.toFixed(2);
                td.style.backgroundColor = `rgba(46, 204, 113, ${prob * 0.5})`; // Green tint based on prob
            } else {
                td.textContent = '0';
                td.style.color = 'var(--text-muted)';
            }
            tr.appendChild(td);
        });

        matrixBody.appendChild(tr);
    });
}

function renderGraph() {
    const container = document.getElementById('graphContainer');
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    const svg = d3.select("#stateGraphSvg")
        .attr("width", width)
        .attr("height", height);
    
    svg.selectAll("*").remove();

    // Define arrow markers
    svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "-0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("orient", "auto")
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("xoverflow", "visible")
        .append("svg:path")
        .attr("d", "M 0,-5 L 10 ,0 L 0,5")
        .attr("fill", "var(--text-muted)");

    const nodesMap = new Map();
    const links = [];

    // Too many nodes will crash/clutter. Limit to most frequent or just top 30
    let renderStates = mc.states;
    if (renderStates.length > 30) renderStates = renderStates.slice(0, 30);

    renderStates.forEach(s => {
        nodesMap.set(s, { id: s });
    });

    renderStates.forEach(src => {
        const probs = mc.probabilities[src];
        for (const tgt in probs) {
            if (nodesMap.has(tgt)) {
                links.push({
                    source: src,
                    target: tgt,
                    prob: probs[tgt]
                });
            }
        }
    });

    const graphData = {
        nodes: Array.from(nodesMap.values()),
        links: links
    };

    if (simulation) simulation.stop();

    simulation = d3.forceSimulation(graphData.nodes)
        .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(35));

    // Links
    const linkGroup = svg.append("g").selectAll(".link-group")
        .data(graphData.links)
        .enter().append("g").attr("class", "link-group");

    const link = linkGroup.append("path")
        .attr("class", "link")
        .attr("id", d => `link-${d.source.id || d.source.replace(/[^a-zA-Z0-9]/g, '_')}-${d.target.id || d.target.replace(/[^a-zA-Z0-9]/g, '_')}`)
        .attr("stroke-width", d => Math.max(1, d.prob * 5)); // Thickness by prob

    const linkLabel = linkGroup.append("text")
        .attr("class", "link-label")
        .attr("id", d => `label-${d.source.id || d.source.replace(/[^a-zA-Z0-9]/g, '_')}-${d.target.id || d.target.replace(/[^a-zA-Z0-9]/g, '_')}`)
        .attr("dy", -5)
        .append("textPath")
        .attr("xlink:href", d => `#link-${d.source.id || d.source.replace(/[^a-zA-Z0-9]/g, '_')}-${d.target.id || d.target.replace(/[^a-zA-Z0-9]/g, '_')}`)
        .attr("startOffset", "50%")
        .style("text-anchor", "middle")
        .text(d => d.prob.toFixed(2));

    // Nodes
    const node = svg.append("g").selectAll(".node")
        .data(graphData.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("id", d => "node-" + d.id.replace(/[^a-zA-Z0-9]/g, '_'))
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("circle").attr("r", 25);
    node.append("text").text(d => {
        // truncate if too long
        return d.id.length > 8 ? d.id.substring(0, 7) + '..' : d.id;
    });

    simulation.on("tick", () => {
        link.attr("d", d => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy);
            
            if (d.source === d.target) {
                const x = d.source.x, y = d.source.y;
                return `M ${x} ${y - 25} A 25 25 0 1 1 ${x + 25} ${y} A 25 25 0 0 1 ${x} ${y - 25}`;
            }
            
            const r = 28;
            const offsetX = (dx * r) / dr;
            const offsetY = (dy * r) / dr;
            
            const targetX = d.target.x - offsetX;
            const targetY = d.target.y - offsetY;
            
            const curveRadius = dr * 1.5; 
            return `M ${d.source.x} ${d.source.y} A ${curveRadius} ${curveRadius} 0 0 1 ${targetX} ${targetY}`;
        });

        node.attr("transform", d => `translate(${Math.max(25, Math.min(width - 25, d.x))},${Math.max(25, Math.min(height - 25, d.y))})`);
    });

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

window.addEventListener('resize', () => {
    if (document.getElementById('graphContainer').clientWidth > 0) {
        renderGraph();
    }
});

document.addEventListener('DOMContentLoaded', init);
