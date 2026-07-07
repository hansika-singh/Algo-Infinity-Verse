/**
 * autograd-engine.js
 * Implements a scalar-valued Autograd Engine (similar to Karpathy's micrograd).
 * Calculates gradients via backpropagation over a dynamically built DAG.
 * Uses Cytoscape.js and Dagre to render the computational graph in real-time.
 */

document.addEventListener("DOMContentLoaded", () => {
    initAutogradEngine();
});

// ==========================================
// 1. SCALAR VALUE ENGINE (The Autograd Core)
// ==========================================

class Value {
    constructor(data, _children = [], _op = '', label = '') {
        this.id = 'v_' + Math.random().toString(36).substr(2, 9);
        this.data = data;
        this.grad = 0;
        this._backward = () => {};
        this._prev = new Set(_children);
        this._op = _op;
        this.label = label;
        
        // Register node for graph rendering
        EngineState.allNodes.push(this);
    }

    add(other, label = '') {
        other = other instanceof Value ? other : new Value(other);
        const out = new Value(this.data + other.data, [this, other], '+', label);
        
        out._backward = () => {
            this.grad += 1.0 * out.grad;
            other.grad += 1.0 * out.grad;
        };
        return out;
    }

    mul(other, label = '') {
        other = other instanceof Value ? other : new Value(other);
        const out = new Value(this.data * other.data, [this, other], '*', label);
        
        out._backward = () => {
            this.grad += other.data * out.grad;
            other.grad += this.data * out.grad;
        };
        return out;
    }

    pow(other, label = '') {
        const out = new Value(Math.pow(this.data, other), [this], `**${other}`, label);
        
        out._backward = () => {
            this.grad += (other * Math.pow(this.data, other - 1)) * out.grad;
        };
        return out;
    }

    relu(label = '') {
        const out = new Value(this.data < 0 ? 0 : this.data, [this], 'relu', label);
        
        out._backward = () => {
            this.grad += (out.data > 0 ? 1.0 : 0.0) * out.grad;
        };
        return out;
    }

    tanh(label = '') {
        const x = this.data;
        const t = (Math.exp(2 * x) - 1) / (Math.exp(2 * x) + 1);
        const out = new Value(t, [this], 'tanh', label);
        
        out._backward = () => {
            this.grad += (1 - t * t) * out.grad;
        };
        return out;
    }

    // Mathematical Topological Sort
    getTopo() {
        const topo = [];
        const visited = new Set();
        
        const buildTopo = (v) => {
            if (!visited.has(v.id)) {
                visited.add(v.id);
                for (let child of v._prev) {
                    buildTopo(child);
                }
                topo.push(v);
            }
        };
        
        buildTopo(this);
        return topo;
    }
}

// Global scope injection for eval() sandbox
window.Value = Value;

// ==========================================
// 2. STATE & UI BINDING
// ==========================================

const EngineState = {
    allNodes: [],
    rootNode: null,
    cyGraph: null,
    isAnimating: false,
    topoOrder: []
};

const els = {
    editorContainer: document.getElementById('editorContainer'),
    btnForward: document.getElementById('btnForward'),
    btnBackward: document.getElementById('btnBackward'),
    animSpeed: document.getElementById('animSpeed'),
    logContainer: document.getElementById('logContainer'),
    engineBadge: document.getElementById('engineBadge'),
    cyContainer: document.getElementById('cy'),
    graphEmptyState: document.getElementById('graphEmptyState')
};

let editor;

function initAutogradEngine() {
    // 1. Setup Editor
    editor = CodeMirror(els.editorContainer, {
        lineNumbers: true,
        theme: 'material-darker',
        mode: 'javascript',
        value: `// Define a simple 2-input neuron
let x1 = new Value(2.0, [], '', 'x1');
let w1 = new Value(-3.0, [], '', 'w1');

let x2 = new Value(0.0, [], '', 'x2');
let w2 = new Value(1.0, [], '', 'w2');

// Weights * Inputs
let w1x1 = x1.mul(w1, 'w1*x1');
let w2x2 = x2.mul(w2, 'w2*x2');

// Bias
let b = new Value(6.8813, [], '', 'b');

// Sum & Activation
let w1x1_plus_w2x2 = w1x1.add(w2x2, 'sum');
let n = w1x1_plus_w2x2.add(b, 'n');
let o = n.tanh('o');

// Return the final output node
return o;`,
        indentUnit: 4
    });

    // 2. Bind Events
    els.btnForward.addEventListener('click', runForwardPass);
    els.btnBackward.addEventListener('click', runBackwardPass);

    // Register Cytoscape plugins
    if (typeof cytoscape !== 'undefined' && typeof dagre !== 'undefined') {
        cytoscape.use(cytoscapeDagre);
    }
}

function logSys(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = `> ${msg}`;
    els.logContainer.appendChild(div);
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

// ==========================================
// 3. EXECUTION & GRAPH RENDERER
// ==========================================

function runForwardPass() {
    if (EngineState.isAnimating) return;
    
    // Reset Engine
    EngineState.allNodes = [];
    EngineState.rootNode = null;
    els.btnBackward.disabled = true;
    
    logSys("Initiating Forward Pass...", "sys");
    els.engineBadge.classList.add('active');
    els.engineBadge.innerHTML = '<i class="fas fa-arrow-right"></i> Forward Pass Built';

    try {
        const code = editor.getValue();
        // Safe evaluation wrapping the user code
        const func = new Function('Value', code);
        
        EngineState.rootNode = func(Value);
        
        if (!(EngineState.rootNode instanceof Value)) {
            throw new Error("User script must return a Value object (the root node).");
        }
        
        logSys(`Forward Pass complete. Output Value: ${EngineState.rootNode.data.toFixed(4)}`, "forward");
        
        // Render the DAG
        generateCytoscapeGraph(EngineState.rootNode);
        els.btnBackward.disabled = false;
        
    } catch (e) {
        console.error(e);
        logSys(`Execution Error: ${e.message}`, "error");
        els.engineBadge.classList.remove('active');
        els.engineBadge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
    }
}

function generateCytoscapeGraph(root) {
    els.graphEmptyState.style.display = 'none';
    if (EngineState.cyGraph) EngineState.cyGraph.destroy();

    const elements = [];
    const addedNodes = new Set();

    // Traverse custom DAG to build Cytoscape elements
    function traverse(v) {
        if (!addedNodes.has(v.id)) {
            addedNodes.add(v.id);
            
            // Format label: Display Name | Data | Grad
            const labelStr = v.label ? `${v.label}\nd: ${v.data.toFixed(4)}\ng: ${v.grad.toFixed(4)}` : `d: ${v.data.toFixed(4)}\ng: ${v.grad.toFixed(4)}`;
            
            elements.push({
                data: { id: v.id, label: labelStr, type: 'value', rawValue: v }
            });

            // If this node was created by an operation, add an OP node
            if (v._op) {
                const opId = v.id + '_op';
                elements.push({
                    data: { id: opId, label: v._op, type: 'op' }
                });
                
                // Edge from Op to Result
                elements.push({
                    data: { id: opId + '_' + v.id, source: opId, target: v.id, type: 'edge' }
                });
                
                // Edges from Children to Op
                for (let child of v._prev) {
                    elements.push({
                        data: { id: child.id + '_' + opId, source: child.id, target: opId, type: 'edge' }
                    });
                    traverse(child);
                }
            }
        }
    }
    
    traverse(root);

    EngineState.cyGraph = cytoscape({
        container: els.cyContainer,
        elements: elements,
        style: [
            {
                selector: 'node[type="value"]',
                style: {
                    'background-color': '#1e293b',
                    'border-width': 2,
                    'border-color': '#ee4c2c',
                    'shape': 'round-rectangle',
                    'width': 'label',
                    'height': 'label',
                    'padding': '10px',
                    'label': 'data(label)',
                    'color': '#f8fafc',
                    'text-wrap': 'wrap',
                    'text-halign': 'center',
                    'text-valign': 'center',
                    'font-family': 'Fira Code, monospace',
                    'font-size': '12px',
                    'transition-property': 'border-color, box-shadow, background-color',
                    'transition-duration': '0.3s'
                }
            },
            {
                selector: 'node[type="op"]',
                style: {
                    'background-color': '#a855f7',
                    'shape': 'ellipse',
                    'width': 30,
                    'height': 30,
                    'label': 'data(label)',
                    'color': '#fff',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-family': 'Orbitron, sans-serif',
                    'font-size': '16px',
                    'font-weight': 'bold'
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
                    'transition-property': 'line-color, width, target-arrow-color',
                    'transition-duration': '0.3s'
                }
            },
            {
                selector: '.highlight-backward',
                style: {
                    'border-color': '#a855f7',
                    'box-shadow': '0 0 20px #a855f7',
                    'background-color': 'rgba(168, 85, 247, 0.2)'
                }
            },
            {
                selector: '.highlight-edge',
                style: {
                    'line-color': '#a855f7',
                    'target-arrow-color': '#a855f7',
                    'width': 4
                }
            }
        ],
        layout: {
            name: 'dagre',
            rankDir: 'LR', // Left-to-Right
            nodeSep: 60,
            rankSep: 80
        },
        userZoomingEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: false
    });
}

// ==========================================
// 4. BACKPROPAGATION ANIMATION
// ==========================================

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runBackwardPass() {
    if (!EngineState.rootNode || EngineState.isAnimating) return;
    
    EngineState.isAnimating = true;
    els.btnForward.disabled = true;
    els.btnBackward.disabled = true;
    els.engineBadge.className = 'engine-badge backprop';
    els.engineBadge.innerHTML = '<i class="fas fa-undo fa-spin"></i> Backpropagating...';
    logSys("Calculating Topological Sort...", "sys");

    // Clear previous gradients visually and internally
    EngineState.allNodes.forEach(n => n.grad = 0);
    updateGraphLabels();
    
    EngineState.rootNode.grad = 1.0; // Base case
    updateGraphLabels();

    EngineState.topoOrder = EngineState.rootNode.getTopo();
    // Micrograd iterates the topo array in reverse
    const reversedTopo = [...EngineState.topoOrder].reverse();
    
    logSys("Topological Sort complete. Applying Chain Rule...", "backward");

    for (let v of reversedTopo) {
        const cyNode = EngineState.cyGraph.getElementById(v.id);
        
        // Visual Highlight Node
        cyNode.addClass('highlight-backward');
        logSys(`Calculating backward() for node [${v.label || 'unnamed'}]`, 'sys');
        
        await sleep(parseInt(els.animSpeed.value) / 2);

        // Compute Gradients mathematically
        v._backward();
        
        // Update Graph UI
        updateGraphLabels();

        // Highlight Incoming Edges to show flow
        if (v._op) {
            const opId = v.id + '_op';
            const edgesIn = EngineState.cyGraph.edges(`[target = "${opId}"]`);
            const edgesOut = EngineState.cyGraph.edges(`[source = "${opId}"]`);
            
            edgesIn.addClass('highlight-edge');
            edgesOut.addClass('highlight-edge');
            
            await sleep(parseInt(els.animSpeed.value) / 2);
            
            edgesIn.removeClass('highlight-edge');
            edgesOut.removeClass('highlight-edge');
        } else {
            await sleep(parseInt(els.animSpeed.value) / 2);
        }

        cyNode.removeClass('highlight-backward');
    }

    logSys("Backpropagation complete. All gradients calculated.", "success");
    els.engineBadge.className = 'engine-badge active';
    els.engineBadge.innerHTML = '<i class="fas fa-check-circle"></i> Gradients Computed';
    
    EngineState.isAnimating = false;
    els.btnForward.disabled = false;
    els.btnBackward.disabled = false;
}

function updateGraphLabels() {
    if (!EngineState.cyGraph) return;

    EngineState.cyGraph.nodes('[type="value"]').forEach(node => {
        const v = node.data('rawValue');
        const labelStr = v.label ? `${v.label}\nd: ${v.data.toFixed(4)}\ng: ${v.grad.toFixed(4)}` : `d: ${v.data.toFixed(4)}\ng: ${v.grad.toFixed(4)}`;
        node.data('label', labelStr);
    });
}
