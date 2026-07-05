/**
 * regex-visualizer.js
 * Compiles a Regular Expression to a Non-deterministic Finite Automaton (NFA) using Thompson's Construction.
 * Visualizes the graph using Cytoscape.js and simulates string processing via Epsilon Closures.
 */

document.addEventListener("DOMContentLoaded", () => {
    initAutomataEngine();
});

// DOM Elements
const els = {
    regexInput: document.getElementById('regexInput'),
    btnCompile: document.getElementById('btnCompile'),
    compilerLogs: document.getElementById('compilerLogs'),
    
    testStringInput: document.getElementById('testStringInput'),
    btnReset: document.getElementById('btnReset'),
    btnStep: document.getElementById('btnStep'),
    charDisplay: document.getElementById('charDisplay'),
    verdictBox: document.getElementById('verdictBox'),
    
    cyContainer: document.getElementById('cy'),
    graphEmptyState: document.getElementById('graphEmptyState')
};

// Application State
let cy = null;
let nfaGraph = null; // Stores structural NFA data
let simulatorState = {
    activeStates: new Set(),
    testString: "",
    currentIndex: 0
};

// ==========================================
// 1. INITIALIZATION & UI
// ==========================================
function initAutomataEngine() {
    els.btnCompile.addEventListener('click', handleCompilation);
    els.btnStep.addEventListener('click', handleSimulationStep);
    els.btnReset.addEventListener('click', resetSimulation);
    els.testStringInput.addEventListener('input', resetSimulation);
}

function logMsg(msg, type = 'info') {
    const div = document.createElement('div');
    div.className = `log-line ${type}`;
    div.textContent = `> ${msg}`;
    els.compilerLogs.appendChild(div);
    els.compilerLogs.scrollTop = els.compilerLogs.scrollHeight;
}

// ==========================================
// 2. REGEX PARSER & THOMPSON'S CONSTRUCTION
// ==========================================

// Global state counter for unique Node IDs
let stateCounter = 0;

class State {
    constructor(isEnd = false) {
        this.id = `S${stateCounter++}`;
        this.isEnd = isEnd;
        this.transitions = {}; // { 'a': [State, State], 'ε': [State] }
    }
    
    addTransition(symbol, state) {
        if (!this.transitions[symbol]) this.transitions[symbol] = [];
        this.transitions[symbol].push(state);
    }
}

class NFA {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
}

// Step 2a: Format Regex (Insert explicit concatenation operators '.')
function insertExplicitConcat(exp) {
    let res = "";
    for (let i = 0; i < exp.length; i++) {
        const c1 = exp[i];
        res += c1;
        if (i + 1 < exp.length) {
            const c2 = exp[i + 1];
            // If c1 is alphanumeric, * + ? or ) AND c2 is alphanumeric or (
            const isC1Valid = /[a-zA-Z0-9*+?)]/.test(c1);
            const isC2Valid = /[a-zA-Z0-9(]/.test(c2);
            if (isC1Valid && isC2Valid) {
                res += '.';
            }
        }
    }
    return res;
}

// Step 2b: Shunting Yard (Infix to Postfix)
function toPostfix(exp) {
    let postfix = "";
    const stack = [];
    const precedence = { '*': 3, '+': 3, '?': 3, '.': 2, '|': 1, '(': 0 };

    for (let c of exp) {
        if (/[a-zA-Z0-9]/.test(c)) {
            postfix += c;
        } else if (c === '(') {
            stack.push(c);
        } else if (c === ')') {
            while (stack.length > 0 && stack[stack.length - 1] !== '(') {
                postfix += stack.pop();
            }
            stack.pop(); // Pop '('
        } else {
            while (stack.length > 0 && precedence[stack[stack.length - 1]] >= precedence[c]) {
                postfix += stack.pop();
            }
            stack.push(c);
        }
    }
    while (stack.length > 0) postfix += stack.pop();
    return postfix;
}

// Step 2c: Thompson's Construction (Postfix to NFA)
function compileNFA(postfix) {
    const stack = [];
    stateCounter = 0; // Reset counter for new compilation

    for (let c of postfix) {
        if (/[a-zA-Z0-9]/.test(c)) {
            // Literal
            let start = new State();
            let end = new State();
            start.addTransition(c, end);
            stack.push(new NFA(start, end));
        } 
        else if (c === '.') {
            // Concat
            if (stack.length < 2) throw new Error("Invalid Regex: Operator '.' lacks operands");
            let nfa2 = stack.pop();
            let nfa1 = stack.pop();
            nfa1.end.addTransition('ε', nfa2.start);
            stack.push(new NFA(nfa1.start, nfa2.end));
        } 
        else if (c === '|') {
            // Union
            if (stack.length < 2) throw new Error("Invalid Regex: Operator '|' lacks operands");
            let nfa2 = stack.pop();
            let nfa1 = stack.pop();
            let start = new State();
            let end = new State();
            start.addTransition('ε', nfa1.start);
            start.addTransition('ε', nfa2.start);
            nfa1.end.addTransition('ε', end);
            nfa2.end.addTransition('ε', end);
            stack.push(new NFA(start, end));
        } 
        else if (c === '*') {
            // Kleene Star
            if (stack.length < 1) throw new Error("Invalid Regex: Operator '*' lacks operand");
            let nfa = stack.pop();
            let start = new State();
            let end = new State();
            start.addTransition('ε', nfa.start);
            start.addTransition('ε', end);
            nfa.end.addTransition('ε', nfa.start);
            nfa.end.addTransition('ε', end);
            stack.push(new NFA(start, end));
        }
        else if (c === '+') {
            // Plus (One or more)
            if (stack.length < 1) throw new Error("Invalid Regex: Operator '+' lacks operand");
            let nfa = stack.pop();
            let start = new State();
            let end = new State();
            start.addTransition('ε', nfa.start);
            nfa.end.addTransition('ε', nfa.start);
            nfa.end.addTransition('ε', end);
            stack.push(new NFA(start, end));
        }
        else if (c === '?') {
            // Optional
            if (stack.length < 1) throw new Error("Invalid Regex: Operator '?' lacks operand");
            let nfa = stack.pop();
            let start = new State();
            let end = new State();
            start.addTransition('ε', nfa.start);
            start.addTransition('ε', end);
            nfa.end.addTransition('ε', end);
            stack.push(new NFA(start, end));
        }
    }

    if (stack.length !== 1) throw new Error("Invalid Regex: Malformed expression");
    let finalNfa = stack.pop();
    finalNfa.end.isEnd = true; // Mark the global end state
    return finalNfa;
}

// Traverse NFA to extract nodes and edges for Cytoscape
function extractGraphData(nfa) {
    const nodes = [];
    const edges = [];
    const visited = new Set();
    const queue = [nfa.start];

    while(queue.length > 0) {
        const curr = queue.shift();
        if (visited.has(curr.id)) continue;
        visited.add(curr.id);

        nodes.push({
            data: { 
                id: curr.id, 
                label: curr.id,
                isStart: curr.id === nfa.start.id,
                isEnd: curr.isEnd,
                stateRef: curr // Reference to actual state object for simulation
            }
        });

        for (let symbol in curr.transitions) {
            curr.transitions[symbol].forEach(nextState => {
                edges.push({
                    data: {
                        id: `${curr.id}-${nextState.id}-${symbol}-${Math.random()}`,
                        source: curr.id,
                        target: nextState.id,
                        label: symbol
                    }
                });
                queue.push(nextState);
            });
        }
    }
    return { nodes, edges, startState: nfa.start };
}

// ==========================================
// 3. CYTOSCAPE GRAPH RENDERER
// ==========================================
function renderGraph(graphData) {
    els.graphEmptyState.style.display = 'none';

    if (cy) cy.destroy(); // Clear existing graph

    // Register dagre if not already (safeguard)
    if(typeof cytoscape !== 'undefined' && typeof dagre !== 'undefined') {
        cytoscape.use(cytoscapeDagre);
    }

    cy = cytoscape({
        container: els.cyContainer,
        elements: {
            nodes: graphData.nodes,
            edges: graphData.edges
        },
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': '#1e293b',
                    'border-width': 2,
                    'border-color': '#64748b',
                    'label': 'data(label)',
                    'color': '#f8fafc',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-family': 'Fira Code, monospace',
                    'font-size': '12px',
                    'width': 40,
                    'height': 40,
                    'transition-property': 'background-color, border-color, box-shadow',
                    'transition-duration': '0.3s'
                }
            },
            {
                // Start Node styling
                selector: 'node[?isStart]',
                style: {
                    'background-color': '#3b82f6',
                    'border-color': '#60a5fa'
                }
            },
            {
                // End Node styling (Double circle effect via border)
                selector: 'node[?isEnd]',
                style: {
                    'border-style': 'double',
                    'border-width': 4,
                    'border-color': '#10b981'
                }
            },
            {
                // Active State styling during simulation
                selector: '.active-state',
                style: {
                    'background-color': '#ec4899',
                    'border-color': '#fbcfe8',
                    'box-shadow': '0 0 15px #ec4899'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#475569',
                    'target-arrow-color': '#475569',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'label': 'data(label)',
                    'color': '#38bdf8', // Neon blue labels
                    'font-family': 'Fira Code, monospace',
                    'font-size': '12px',
                    'text-background-opacity': 1,
                    'text-background-color': '#020617',
                    'text-background-padding': 2,
                    'transition-property': 'line-color, target-arrow-color',
                    'transition-duration': '0.2s'
                }
            },
            {
                // Epsilon transitions are dashed
                selector: 'edge[label="ε"]',
                style: {
                    'line-style': 'dashed',
                    'color': '#a78bfa'
                }
            },
            {
                // Active Edge styling
                selector: '.active-edge',
                style: {
                    'line-color': '#ec4899',
                    'target-arrow-color': '#ec4899',
                    'width': 3
                }
            }
        ],
        layout: {
            name: 'dagre',
            rankDir: 'LR', // Left-to-Right
            nodeSep: 50,
            edgeSep: 10,
            rankSep: 80
        },
        userZoomingEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: false
    });
}

// ==========================================
// 4. EVENT HANDLERS & NFA SIMULATION
// ==========================================

function handleCompilation() {
    const rawRegex = els.regexInput.value.trim();
    if (!rawRegex) return logMsg("Please enter a valid regex.", "error");

    els.compilerLogs.innerHTML = ''; // Clear logs
    logMsg(`Compiling regex: ${rawRegex}`);

    try {
        const formatted = insertExplicitConcat(rawRegex);
        logMsg(`Inserted implicit concatenations: ${formatted}`);
        
        const postfix = toPostfix(formatted);
        logMsg(`Postfix representation: ${postfix}`);
        
        const nfa = compileNFA(postfix);
        logMsg(`Thompson's Construction complete. Generating AST...`, "success");
        
        nfaGraph = extractGraphData(nfa);
        logMsg(`NFA graph generated: ${nfaGraph.nodes.length} states, ${nfaGraph.edges.length} transitions.`, "success");
        
        renderGraph(nfaGraph);
        
        // Enable simulation UI
        els.testStringInput.disabled = false;
        els.btnReset.disabled = false;
        els.btnStep.disabled = false;
        resetSimulation();
        
    } catch (e) {
        logMsg(e.message, "error");
    }
}

// Compute all states reachable via 'ε' (Epsilon) from a set of states
function getEpsilonClosure(states) {
    const closure = new Set(states);
    const stack = [...states];

    while (stack.length > 0) {
        const curr = stack.pop();
        if (curr.transitions['ε']) {
            curr.transitions['ε'].forEach(nextState => {
                if (!closure.has(nextState)) {
                    closure.add(nextState);
                    stack.push(nextState);
                }
            });
        }
    }
    return closure;
}

function resetSimulation() {
    if (!nfaGraph) return;

    // Reset String Tracker UI
    simulatorState.testString = els.testStringInput.value;
    simulatorState.currentIndex = 0;
    
    els.charDisplay.innerHTML = '';
    if (simulatorState.testString.length === 0) {
        els.charDisplay.innerHTML = '<span class="char placeholder">Type a string...</span>';
    } else {
        for (let i = 0; i < simulatorState.testString.length; i++) {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = simulatorState.testString[i];
            els.charDisplay.appendChild(span);
        }
    }

    // Initial Epsilon Closure from Start State
    simulatorState.activeStates = getEpsilonClosure([nfaGraph.startState]);
    
    els.btnStep.disabled = simulatorState.testString.length === 0;
    els.btnStep.innerHTML = 'Step Forward <i class="fas fa-step-forward"></i>';
    updateSimulationUI();
    setVerdict("processing", '<i class="fas fa-spinner fa-spin"></i> Simulation reset. Ready to step.');
}

function handleSimulationStep() {
    if (simulatorState.currentIndex >= simulatorState.testString.length) return;

    const charToConsume = simulatorState.testString[simulatorState.currentIndex];
    const nextStates = new Set();
    const activeEdges = []; // Track edges to highlight

    // 1. Consume Character
    simulatorState.activeStates.forEach(state => {
        if (state.transitions[charToConsume]) {
            state.transitions[charToConsume].forEach(nextState => {
                nextStates.add(nextState);
                // Find corresponding edge ID for animation
                const edge = nfaGraph.edges.find(e => e.data.source === state.id && e.data.target === nextState.id && e.data.label === charToConsume);
                if (edge) activeEdges.push(edge.data.id);
            });
        }
    });

    // 2. Compute Epsilon Closure of the new states
    simulatorState.activeStates = getEpsilonClosure(nextStates);

    // 3. Update String Tracker UI
    const charElements = els.charDisplay.children;
    if (charElements[simulatorState.currentIndex]) {
        charElements[simulatorState.currentIndex].classList.add('consumed');
    }
    simulatorState.currentIndex++;
    
    if (simulatorState.currentIndex < simulatorState.testString.length) {
        charElements[simulatorState.currentIndex].classList.add('active');
    }

    // 4. Temporarily highlight edges consumed
    if (cy) {
        cy.edges().removeClass('active-edge');
        activeEdges.forEach(id => cy.getElementById(id).addClass('active-edge'));
        setTimeout(() => cy.edges().removeClass('active-edge'), 500); // Clear edge highlight after step
    }

    updateSimulationUI();

    // 5. Check Completion
    if (simulatorState.currentIndex >= simulatorState.testString.length) {
        els.btnStep.disabled = true;
        els.btnStep.innerHTML = '<i class="fas fa-flag-checkered"></i> Finished';
        checkFinalVerdict();
    } else {
        // If active states drop to 0 early, it's a dead end
        if (simulatorState.activeStates.size === 0) {
            els.btnStep.disabled = true;
            checkFinalVerdict();
        } else {
            setVerdict("processing", `<i class="fas fa-cog fa-spin"></i> Consumed '${charToConsume}'. Active states: ${simulatorState.activeStates.size}`);
        }
    }
}

function updateSimulationUI() {
    if (!cy) return;
    
    // Clear all highlights
    cy.nodes().removeClass('active-state');
    
    // Highlight currently active states
    simulatorState.activeStates.forEach(state => {
        cy.getElementById(state.id).addClass('active-state');
    });
}

function checkFinalVerdict() {
    // Check if any of the active states is an End state
    let accepted = false;
    simulatorState.activeStates.forEach(state => {
        if (state.isEnd) accepted = true;
    });

    if (accepted && simulatorState.currentIndex === simulatorState.testString.length) {
        setVerdict("success", '<i class="fas fa-check-circle"></i> String ACCEPTED by the Automaton!');
    } else {
        setVerdict("error", '<i class="fas fa-times-circle"></i> String REJECTED. Failed to reach accept state.');
    }
}

function setVerdict(type, html) {
    els.verdictBox.className = `verdict-box ${type}`;
    els.verdictBox.innerHTML = html;
}
