/* turing-machine-simulator.js */

const EXAMPLES = {
    binary_increment: {
        initialTape: "1011",
        startState: "q0",
        acceptStates: ["halt"],
        rules: `// Move to the right end
q0, 0 -> 0, R, q0
q0, 1 -> 1, R, q0
q0, _ -> _, L, q1

// Increment binary number
q1, 1 -> 0, L, q1
q1, 0 -> 1, R, halt
q1, _ -> 1, R, halt`
    },
    palindrome: {
        initialTape: "10101",
        startState: "q0",
        acceptStates: ["accept"],
        rules: `// Read left-most symbol
q0, 0 -> _, R, q_match_0
q0, 1 -> _, R, q_match_1
q0, _ -> _, R, accept

// Move right to match 0
q_match_0, 0 -> 0, R, q_match_0
q_match_0, 1 -> 1, R, q_match_0
q_match_0, _ -> _, L, q_verify_0

// Move right to match 1
q_match_1, 0 -> 0, R, q_match_1
q_match_1, 1 -> 1, R, q_match_1
q_match_1, _ -> _, L, q_verify_1

// Verify matching symbol at right end
q_verify_0, 0 -> _, L, q_return
q_verify_0, _ -> _, R, accept

q_verify_1, 1 -> _, L, q_return
q_verify_1, _ -> _, R, accept

// Return to left end
q_return, 0 -> 0, L, q_return
q_return, 1 -> 1, L, q_return
q_return, _ -> _, R, q0`
    },
    busy_beaver: {
        initialTape: "_",
        startState: "A",
        acceptStates: ["halt"],
        rules: `// 3-state Busy Beaver
A, _ -> 1, R, B
A, 1 -> 1, R, halt
B, _ -> 0, R, C
B, 1 -> 1, R, B
C, _ -> 1, L, C
C, 1 -> 1, L, A`
    }
};

class TuringMachine {
    constructor() {
        this.tape = {}; // map of index -> character
        this.headPos = 0;
        this.currentState = "";
        this.startState = "";
        this.acceptStates = new Set();
        this.transitions = {}; // {state: {readSymbol: {writeSymbol, direction, nextState}}}
        this.history = []; // stack of previous states for Step Back
        this.steps = 0;
        this.halted = false;
        this.error = null;
    }

    parseRules(rulesText) {
        this.transitions = {};
        const lines = rulesText.split('\n');
        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('//')) continue;
            
            // Format: q0, 0 -> 1, R, q1
            const parts = line.split('->').map(p => p.trim());
            if (parts.length !== 2) continue;
            
            const left = parts[0].split(',').map(p => p.trim());
            const right = parts[1].split(',').map(p => p.trim());
            
            if (left.length !== 2 || right.length !== 3) continue;
            
            const [state, readSym] = left;
            const [writeSym, dir, nextState] = right;
            
            if (!this.transitions[state]) this.transitions[state] = {};
            this.transitions[state][readSym] = {
                write: writeSym,
                dir: dir,
                nextState: nextState
            };
        }
    }

    loadExample(exampleKey, initialInput = null) {
        const ex = EXAMPLES[exampleKey];
        if (!ex) return;
        
        this.startState = ex.startState;
        this.acceptStates = new Set(ex.acceptStates);
        this.parseRules(ex.rules);
        
        const inputToLoad = initialInput !== null ? initialInput : ex.initialTape;
        this.reset(inputToLoad);
    }

    reset(inputString) {
        this.tape = {};
        if (inputString === "" || inputString === "_") {
            // Empty tape
        } else {
            for (let i = 0; i < inputString.length; i++) {
                this.tape[i] = inputString[i];
            }
        }
        
        this.headPos = 0;
        this.currentState = this.startState;
        this.history = [];
        this.steps = 0;
        this.halted = false;
        this.error = null;
    }

    read() {
        return this.tape[this.headPos] || '_';
    }

    write(symbol) {
        if (symbol === '_') {
            delete this.tape[this.headPos];
        } else {
            this.tape[this.headPos] = symbol;
        }
    }

    step() {
        if (this.halted || this.error) return false;

        const currentSymbol = this.read();
        const stateTransitions = this.transitions[this.currentState];
        
        if (this.acceptStates.has(this.currentState)) {
            this.halted = true;
            return false;
        }

        if (!stateTransitions || !stateTransitions[currentSymbol]) {
            // Implicit halt or reject if no transition
            this.halted = true;
            this.error = `No transition defined for state '${this.currentState}' reading '${currentSymbol}'.`;
            return false;
        }

        const transition = stateTransitions[currentSymbol];
        
        // Save state to history
        this.history.push({
            tape: { ...this.tape },
            headPos: this.headPos,
            currentState: this.currentState,
            steps: this.steps
        });

        // Apply transition
        this.write(transition.write);
        
        if (transition.dir === 'R') this.headPos++;
        else if (transition.dir === 'L') this.headPos--;
        // If dir is 'N' (none) or 'S' (stay), don't move
        
        this.currentState = transition.nextState;
        this.steps++;

        if (this.acceptStates.has(this.currentState)) {
            this.halted = true;
        }
        
        return true;
    }

    stepBack() {
        if (this.history.length === 0) return false;
        
        const prev = this.history.pop();
        this.tape = { ...prev.tape };
        this.headPos = prev.headPos;
        this.currentState = prev.currentState;
        this.steps = prev.steps;
        this.halted = false;
        this.error = null;
        return true;
    }
}

// --- UI Logic ---
const tm = new TuringMachine();
let isPlaying = false;
let playInterval = null;

// DOM Elements
const tapeContainer = document.getElementById('tapeContainer');
const statCurrentState = document.getElementById('statCurrentState');
const statSteps = document.getElementById('statSteps');
const statHeadPos = document.getElementById('statHeadPos');
const statStatus = document.getElementById('statStatus');
const btnPlayPause = document.getElementById('btnPlayPause');
const speedSlider = document.getElementById('speedSlider');
const rulesTextarea = document.getElementById('transitionRulesText');

function init() {
    // Event Listeners
    document.getElementById('btnLoadExample').addEventListener('click', () => {
        const exampleKey = document.getElementById('exampleSelect').value;
        const inputVal = document.getElementById('initialTapeInput').value;
        loadExampleToUI(exampleKey, inputVal);
    });

    document.getElementById('exampleSelect').addEventListener('change', (e) => {
        const ex = EXAMPLES[e.target.value];
        if (ex) {
            document.getElementById('initialTapeInput').value = ex.initialTape;
            rulesTextarea.value = ex.rules;
        }
    });

    document.getElementById('btnUpdateRules').addEventListener('click', () => {
        tm.parseRules(rulesTextarea.value);
        tm.reset(document.getElementById('initialTapeInput').value);
        updateUI();
        renderGraph();
    });

    document.getElementById('btnReset').addEventListener('click', () => {
        pause();
        tm.reset(document.getElementById('initialTapeInput').value);
        updateUI();
    });

    document.getElementById('btnStepFwd').addEventListener('click', () => {
        pause();
        tm.step();
        updateUI();
    });

    document.getElementById('btnStepBack').addEventListener('click', () => {
        pause();
        tm.stepBack();
        updateUI();
    });

    btnPlayPause.addEventListener('click', () => {
        if (isPlaying) pause();
        else play();
    });

    speedSlider.addEventListener('input', () => {
        if (isPlaying) {
            pause();
            play();
        }
    });

    // Load initial example
    const defaultEx = 'binary_increment';
    document.getElementById('exampleSelect').value = defaultEx;
    document.getElementById('initialTapeInput').value = EXAMPLES[defaultEx].initialTape;
    rulesTextarea.value = EXAMPLES[defaultEx].rules;
    loadExampleToUI(defaultEx, null);
}

function loadExampleToUI(exampleKey, customInput) {
    pause();
    tm.loadExample(exampleKey, customInput);
    if (customInput === null) {
        document.getElementById('initialTapeInput').value = EXAMPLES[exampleKey].initialTape;
    }
    rulesTextarea.value = EXAMPLES[exampleKey].rules;
    updateUI();
    renderGraph();
}

function play() {
    if (tm.halted || tm.error) return;
    isPlaying = true;
    btnPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
    
    const delay = parseInt(speedSlider.value);
    playInterval = setInterval(() => {
        const canStep = tm.step();
        updateUI();
        if (!canStep) pause();
    }, delay);
}

function pause() {
    isPlaying = false;
    btnPlayPause.innerHTML = '<i class="fas fa-play"></i>';
    clearInterval(playInterval);
}

function updateUI() {
    // 1. Update Tape DOM
    tapeContainer.innerHTML = '';
    
    // We want to render cells from headPos - 5 to headPos + 5
    const viewRadius = 8;
    const startIdx = tm.headPos - viewRadius;
    const endIdx = tm.headPos + viewRadius;
    
    const cellWidth = 54; // 50px width + 4px margin
    
    // Center the tape container on the head
    // By default head is at center. 
    for (let i = startIdx; i <= endIdx; i++) {
        const cell = document.createElement('div');
        cell.className = 'tape-cell';
        if (i === tm.headPos) cell.classList.add('active');
        cell.textContent = tm.tape[i] !== undefined ? tm.tape[i] : '_';
        tapeContainer.appendChild(cell);
    }

    // Since we re-render symmetrically around headPos, we don't need to translate tapeContainer,
    // the head is always in the middle (index `viewRadius`).
    // Alternatively, animate tape movement for a smoother look:
    // This implementation just replaces DOM and head is always centered.
    tapeContainer.style.transform = `translateX(0)`; // Adjust if needed

    // 2. Update Stats
    statCurrentState.textContent = tm.currentState;
    statSteps.textContent = tm.steps;
    statHeadPos.textContent = tm.headPos;
    
    if (tm.error) {
        statStatus.textContent = 'Error: ' + tm.error;
        statStatus.style.color = '#e74c3c';
    } else if (tm.halted) {
        statStatus.textContent = tm.acceptStates.has(tm.currentState) ? 'Accepted/Halted' : 'Halted (No Reject)';
        statStatus.style.color = '#2ecc71';
    } else {
        statStatus.textContent = 'Running...';
        statStatus.style.color = 'var(--text-color)';
    }

    // 3. Highlight D3 Node
    d3.selectAll('.node').classed('active', false);
    d3.select('#node-' + tm.currentState.replace(/[^a-zA-Z0-9]/g, '_')).classed('active', true);
}

function renderGraph() {
    const container = document.getElementById('graphContainer');
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 400;

    const svg = d3.select("#stateGraphSvg")
        .attr("width", width)
        .attr("height", height);
    
    svg.selectAll("*").remove();

    const gWrapper = svg.append("g");
    
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
            gWrapper.attr("transform", event.transform);
        });
        
    svg.call(zoom);

    // Zoom controls
    const btnZoomIn = document.getElementById('btnZoomIn');
    const btnZoomOut = document.getElementById('btnZoomOut');
    const btnResetView = document.getElementById('btnResetView');
    
    if (btnZoomIn) btnZoomIn.onclick = () => svg.transition().duration(300).call(zoom.scaleBy, 1.2);
    if (btnZoomOut) btnZoomOut.onclick = () => svg.transition().duration(300).call(zoom.scaleBy, 0.8);
    if (btnResetView) btnResetView.onclick = () => svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);

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

    // Extract nodes and links from transitions
    const nodes = new Map();
    const linksMap = new Map(); // src->target: label

    // Add start state
    nodes.set(tm.startState, { id: tm.startState, isHalt: tm.acceptStates.has(tm.startState) });
    for (let acceptState of tm.acceptStates) {
        nodes.set(acceptState, { id: acceptState, isHalt: true });
    }

    for (const [state, transitions] of Object.entries(tm.transitions)) {
        if (!nodes.has(state)) nodes.set(state, { id: state, isHalt: tm.acceptStates.has(state) });
        for (const [readSym, t] of Object.entries(transitions)) {
            if (!nodes.has(t.nextState)) nodes.set(t.nextState, { id: t.nextState, isHalt: tm.acceptStates.has(t.nextState) });
            
            const linkKey = state + "->" + t.nextState;
            const formattedLabel = `${readSym} → ${t.write}, ${t.dir}`;
            
            if (linksMap.has(linkKey)) {
                linksMap.get(linkKey).push(formattedLabel);
            } else {
                linksMap.set(linkKey, [formattedLabel]);
            }
        }
    }

    const graphData = {
        nodes: Array.from(nodes.values()),
        links: Array.from(linksMap.entries()).map(([key, label]) => {
            const [source, target] = key.split('->');
            return { source, target, label };
        })
    };

    const simulation = d3.forceSimulation(graphData.nodes)
        .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-800))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(50));

    // Links
    const linkGroup = gWrapper.append("g").selectAll(".link-group")
        .data(graphData.links)
        .enter().append("g").attr("class", "link-group");

    const link = linkGroup.append("path")
        .attr("class", "link")
        .attr("marker-end", "url(#arrowhead)")
        .attr("id", (d, i) => "link-" + i);

    const linkLabel = linkGroup.append("g")
        .attr("class", "transition-label-group");
        
    linkLabel.append("text")
        .attr("class", "transition-label-text")
        .each(function(d) {
            const textEl = d3.select(this);
            d.label.forEach((line, i) => {
                textEl.append("tspan")
                    .attr("x", 0)
                    .attr("dy", i === 0 ? 0 : 16)
                    .text(line);
            });
        });

    // Nodes
    const node = gWrapper.append("g").selectAll(".node")
        .data(graphData.nodes)
        .enter().append("g")
        .attr("class", d => {
            let cls = "node";
            if (tm.acceptStates.has(d.id)) cls += " accept";
            else if (d.isHalt) cls += " halt"; // For non-accepting halt states if any
            return cls;
        })
        .attr("id", d => "node-" + d.id.replace(/[^a-zA-Z0-9]/g, '_'))
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("circle").attr("r", 30);
    
    // Double border for accept states
    node.filter(d => tm.acceptStates.has(d.id))
        .append("circle")
        .attr("r", 24)
        .attr("class", "inner-border");
        
    node.append("text").text(d => d.id);

    simulation.on("tick", () => {
        link.attr("d", d => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy);
            
            // Self loop (large bezier curve above the node)
            if (d.source === d.target) {
                const x = d.source.x, y = d.source.y;
                return `M ${x - 15} ${y - 25} C ${x - 80} ${y - 120}, ${x + 80} ${y - 120}, ${x + 15} ${y - 25}`;
            }
            
            // Stop arrow at node boundary (radius 30 + arrow size offset ~6)
            const r = 36;
            const offsetX = (dx * r) / dr;
            const offsetY = (dy * r) / dr;
            
            const targetX = d.target.x - offsetX;
            const targetY = d.target.y - offsetY;
            
            // Curve the path slightly for all non-self links
            const curveRadius = dr * 1.5; 
            return `M ${d.source.x} ${d.source.y} A ${curveRadius} ${curveRadius} 0 0 1 ${targetX} ${targetY}`;
        });

        // Position labels neatly just outside the curved path
        linkLabel.attr("transform", d => {
            let x, y;
            if (d.source === d.target) {
                x = d.source.x;
                y = d.source.y - 130; // Above self loop
            } else {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const mx = (d.source.x + d.target.x) / 2;
                const my = (d.source.y + d.target.y) / 2;
                const len = Math.sqrt(dx*dx + dy*dy);
                if (len === 0) {
                    x = mx; y = my;
                } else {
                    const offset = (len * 0.085) + 15;
                    x = mx + (-dy / len) * offset;
                    y = my + (dx / len) * offset;
                }
            }
            return `translate(${x},${y})`;
        });

        // Nodes no longer clamped strictly to width/height to allow infinite pan/zoom canvas
        node.attr("transform", d => `translate(${d.x},${d.y})`);
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

    // Highlight starting state
    d3.select('#node-' + tm.currentState.replace(/[^a-zA-Z0-9]/g, '_')).classed('active', true);
}

// Handle window resize for D3 graph
window.addEventListener('resize', () => {
    if (document.getElementById('graphContainer').clientWidth > 0) {
        renderGraph();
    }
});

document.addEventListener('DOMContentLoaded', init);
