/**
 * Neural Network Backpropagation & Chain Rule Engine
 */

const COLORS = {
    bg: '#13151f',
    nodeBase: '#1e293b',
    nodeActive: '#334155',
    forward: '#06b6d4',  // Cyan
    backward: '#a855f7', // Purple
    update: '#10b981',   // Emerald
    textMain: '#ffffff',
    textMuted: '#8b949e',
    edgeNeutral: '#334155'
};

// --- Math Engine ---
class MathEngine {
    static activate(x, type) {
        switch(type) {
            case 'sigmoid': return 1 / (1 + Math.exp(-x));
            case 'relu': return Math.max(0, x);
            case 'tanh': return Math.tanh(x);
            default: return 1 / (1 + Math.exp(-x));
        }
    }

    static derivative(a, type) {
        // Note: Derivatives here take the output 'a' for efficiency, 
        // except ReLU which technically requires 'z', but we can infer from 'a'
        switch(type) {
            case 'sigmoid': return a * (1 - a);
            case 'relu': return a > 0 ? 1 : 0;
            case 'tanh': return 1 - (a * a);
            default: return a * (1 - a);
        }
    }
}

// --- Network Data Structures ---
class Neuron {
    constructor(id, layer, x, y, label) {
        this.id = id;
        this.layer = layer; // 0=Input, 1=Hidden, 2=Output
        this.x = x;
        this.y = y;
        this.label = label;
        
        // Mathematical state
        this.a = 0; // Activation
        this.z = 0; // Pre-activation
        this.bias = (Math.random() * 2 - 1).toFixed(2) * 1;
        
        // Backprop state
        this.delta = 0; // Error signal ∂L/∂z
    }
}

class Edge {
    constructor(source, target) {
        this.source = source;
        this.target = target;
        this.weight = (Math.random() * 2 - 1).toFixed(2) * 1;
        this.grad = 0; // ∂L/∂w
    }
}

// --- State Machine & Algorithm ---
class BackpropEngine {
    constructor(network) {
        this.net = network;
        this.learningRate = 0.5;
        this.target = 1.0;
        this.activationType = 'sigmoid';
        this.loss = 0;
    }

    *runEpoch() {
        // --- 1. FORWARD PASS (SUM) ---
        // Hidden Layer
        for (let h of this.net.hidden) {
            let sum = h.bias;
            let equation = `z_${h.label} = (${h.bias}) `;
            for (let e of this.net.edges.filter(ed => ed.target === h)) {
                sum += e.source.a * e.weight;
                equation += `+ (${e.weight.toFixed(2)} · ${e.source.a.toFixed(2)}) `;
            }
            h.z = sum;
            yield { step: 'step-fwd-sum', type: 'forward', edges: this.net.edges.filter(e => e.target === h), math: equation };
        }
        // Output Layer
        let outSum = this.net.output.bias;
        let outEq = `z_${this.net.output.label} = (${this.net.output.bias}) `;
        for (let e of this.net.edges.filter(ed => ed.target === this.net.output)) {
            outSum += e.source.a * e.weight;
            outEq += `+ (${e.weight.toFixed(2)} · ${e.source.a.toFixed(2)}) `;
        }
        this.net.output.z = outSum;
        yield { step: 'step-fwd-sum', type: 'forward', edges: this.net.edges.filter(e => e.target === this.net.output), math: outEq };

        // --- 2. FORWARD PASS (ACTIVATION) ---
        for (let h of this.net.hidden) h.a = MathEngine.activate(h.z, this.activationType);
        this.net.output.a = MathEngine.activate(this.net.output.z, this.activationType);
        yield { step: 'step-fwd-act', type: 'forward', edges: [], math: `a = ${this.activationType}(z)` };

        // --- 3. COMPUTE LOSS ---
        this.loss = 0.5 * Math.pow(this.target - this.net.output.a, 2);
        yield { step: 'step-loss', type: 'loss', edges: [], math: `L = 0.5 · (${this.target} - ${this.net.output.a.toFixed(3)})² = <span class="eq-hl">${this.loss.toFixed(4)}</span>` };

        // --- 4. BACKPROPAGATION (OUTPUT NODE) ---
        // ∂L/∂a = (a - y)
        const dL_da = this.net.output.a - this.target;
        // ∂a/∂z = f'(z)
        const da_dz = MathEngine.derivative(this.net.output.a, this.activationType);
        // δ_o = ∂L/∂z = ∂L/∂a * ∂a/∂z
        this.net.output.delta = dL_da * da_dz;

        // Gradients for Output Weights
        let outEdges = this.net.edges.filter(e => e.target === this.net.output);
        for (let e of outEdges) {
            // ∂L/∂w = δ_o * a_h
            e.grad = this.net.output.delta * e.source.a;
        }
        
        let backEq = `δ_o = (${this.net.output.a.toFixed(2)} - ${this.target}) · f'(${this.net.output.z.toFixed(2)}) = <span class="eq-hl">${this.net.output.delta.toFixed(4)}</span>`;
        yield { step: 'step-back-out', type: 'backward', edges: outEdges, math: backEq };

        // --- 5. BACKPROPAGATION (HIDDEN NODES) ---
        let hidEdges = this.net.edges.filter(e => this.net.hidden.includes(e.target));
        for (let h of this.net.hidden) {
            // Error propagated back: Σ(δ_o * w_ho)
            let err_sum = 0;
            for (let e of outEdges.filter(ed => ed.source === h)) {
                err_sum += this.net.output.delta * e.weight;
            }
            // δ_h = err_sum * f'(z_h)
            h.delta = err_sum * MathEngine.derivative(h.a, this.activationType);

            // Gradients for Hidden Weights
            for (let e of hidEdges.filter(ed => ed.target === h)) {
                e.grad = h.delta * e.source.a;
            }
        }
        
        let hidEq = `δ_h = Σ(δ_o · w) · f'(z_h)`;
        yield { step: 'step-back-hid', type: 'backward', edges: hidEdges, math: hidEq };

        // --- 6. WEIGHT UPDATES (GRADIENT DESCENT) ---
        for (let e of this.net.edges) {
            e.weight -= this.learningRate * e.grad;
        }
        for (let n of [...this.net.hidden, this.net.output]) {
            n.bias -= this.learningRate * n.delta;
        }
        
        yield { step: 'step-update', type: 'update', edges: this.net.edges, math: `w_new = w_old - ${this.learningRate} · ∂L/∂w` };
    }
}

// --- Application Core & Renderer ---
class NeuralNetVisualizer {
    constructor() {
        this.canvas = document.getElementById('viz-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.epoch = 0;
        this.animating = false;
        this.generator = null;

        this.initNetwork();
        this.engine = new BackpropEngine(this.net);
        
        this.initDOM();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.bindEvents();
        
        this.renderLoop();
        this.updateTelemetry();
    }

    initNetwork() {
        // Standard 2-2-1 Topology
        this.net = { inputs: [], hidden: [], output: null, edges: [] };
        
        // Define exact node positions (will be scaled on render)
        const w = 800, h = 600;
        
        const i1 = new Neuron('i1', 0, 150, 200, 'x1'); i1.a = 1.0;
        const i2 = new Neuron('i2', 0, 150, 400, 'x2'); i2.a = 0.5;
        this.net.inputs.push(i1, i2);

        const h1 = new Neuron('h1', 1, 400, 200, 'h1');
        const h2 = new Neuron('h2', 1, 400, 400, 'h2');
        this.net.hidden.push(h1, h2);

        const o1 = new Neuron('o1', 2, 650, 300, 'ŷ');
        this.net.output = o1;

        // Fully connected edges
        this.net.edges.push(
            new Edge(i1, h1), new Edge(i1, h2),
            new Edge(i2, h1), new Edge(i2, h2),
            new Edge(h1, o1), new Edge(h2, o1)
        );
    }

    initDOM() {
        this.btnPlay = document.getElementById('btn-play');
        this.btnStep = document.getElementById('btn-step');
        this.btnReset = document.getElementById('btn-reset');
        this.mathPanel = document.getElementById('math-overlay');
        this.mathEq = document.getElementById('math-equation');
        
        document.getElementById('input-target').addEventListener('change', (e) => {
            this.engine.target = parseFloat(e.target.value);
            this.updateTelemetry();
        });
        document.getElementById('slider-lr').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('val-lr').innerText = val.toFixed(2);
            this.engine.learningRate = val;
        });
        document.getElementById('sel-activation').addEventListener('change', (e) => {
            this.engine.activationType = e.target.value;
        });
    }

    bindEvents() {
        this.btnStep.addEventListener('click', () => this.step());
        this.btnPlay.addEventListener('click', () => this.togglePlay());
        document.getElementById('btn-random').addEventListener('click', () => {
            this.initNetwork();
            this.engine.net = this.net;
            this.epoch = 0;
            this.resetEpochState();
        });
        this.btnReset.addEventListener('click', () => {
            this.epoch = 0;
            this.resetEpochState();
        });
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    resetEpochState() {
        this.generator = null;
        this.particles = [];
        this.animating = false;
        this.btnPlay.innerHTML = '<i class="fas fa-play"></i> Auto Run';
        this.mathPanel.classList.add('hidden');
        document.querySelectorAll('.code-line').forEach(el => {
            el.classList.remove('active-fwd', 'active-bwd', 'active-upd');
        });
        this.updateTelemetry();
        document.getElementById('main-status').innerText = `Status: Ready | Epoch: ${this.epoch}`;
    }

    togglePlay() {
        this.animating = !this.animating;
        this.btnPlay.innerHTML = this.animating ? '<i class="fas fa-pause"></i> Pause' : '<i class="fas fa-play"></i> Auto Run';
        if (this.animating) this.autoStep();
    }

    step() {
        if (!this.generator) {
            this.generator = this.engine.runEpoch();
            this.epoch++;
        }

        const res = this.generator.next();
        
        if (res.done) {
            this.generator = null;
            this.updateTelemetry();
            if (!this.animating) this.resetEpochState();
            return false;
        }

        const state = res.value;
        this.processUIState(state);
        this.spawnParticles(state.edges, state.type);
        return true;
    }

    autoStep() {
        if (!this.animating) return;
        const hasNext = this.step();
        if (hasNext) {
            setTimeout(() => this.autoStep(), 1500); // 1.5s delay for educational pacing
        } else {
            // Auto start next epoch
            setTimeout(() => { if(this.animating) this.autoStep(); }, 1500);
        }
    }

    processUIState(state) {
        // 1. Update Pseudocode highlighting
        document.querySelectorAll('.code-line').forEach(el => {
            el.classList.remove('active-fwd', 'active-bwd', 'active-upd');
        });
        const codeClass = state.type === 'forward' ? 'active-fwd' : (state.type === 'backward' ? 'active-bwd' : 'active-upd');
        document.getElementById(state.step)?.classList.add(codeClass);

        // 2. Show Live Math
        this.mathEq.innerHTML = state.math;
        this.mathPanel.classList.remove('hidden');

        // 3. Status Bar
        document.getElementById('main-status').innerText = `Status: ${state.type.toUpperCase()} | Epoch: ${this.epoch}`;

        // 4. Update right sidebar telemetry specifically during loss or update
        if (state.type === 'loss' || state.type === 'update') {
            this.updateTelemetry();
        }
    }

    updateTelemetry() {
        document.getElementById('stat-pred').innerText = this.net.output.a.toFixed(4);
        document.getElementById('stat-expected').innerText = this.engine.target.toFixed(4);
        document.getElementById('stat-loss').innerText = this.engine.loss.toFixed(6);

        const gradPanel = document.getElementById('gradient-telemetry');
        gradPanel.innerHTML = '';
        this.net.edges.forEach(e => {
            const el = document.createElement('div');
            el.className = 'grad-row';
            el.innerHTML = `<span>∂L/∂w_${e.source.label}${e.target.label}</span> <span class="grad-val">${e.grad.toFixed(4)}</span>`;
            gradPanel.appendChild(el);
        });
    }

    spawnParticles(activeEdges, type) {
        this.particles = [];
        const color = type === 'forward' ? COLORS.forward : (type === 'backward' ? COLORS.backward : COLORS.update);
        const direction = type === 'backward' ? -1 : 1; // Gradients flow backward

        activeEdges.forEach(edge => {
            // Spawn 3 particles per edge
            for(let i=0; i<3; i++) {
                this.particles.push({
                    edge: edge,
                    progress: direction === 1 ? -i * 0.2 : 1 + (i * 0.2), // stagger
                    dir: direction,
                    color: color,
                    speed: 0.015
                });
            }
        });
    }

    // --- Canvas Drawing ---
    getScaledPos(node) {
        // Maps virtual fixed coordinates to responsive canvas size
        const scaleX = this.canvas.width / 800;
        const scaleY = this.canvas.height / 600;
        return { x: node.x * scaleX, y: node.y * scaleY };
    }

    renderLoop() {
        this.ctx.fillStyle = COLORS.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Edges
        this.ctx.lineWidth = 2;
        this.net.edges.forEach(edge => {
            const s = this.getScaledPos(edge.source);
            const t = this.getScaledPos(edge.target);
            
            this.ctx.beginPath();
            this.ctx.moveTo(s.x, s.y);
            this.ctx.lineTo(t.x, t.y);
            this.ctx.strokeStyle = COLORS.edgeNeutral;
            this.ctx.stroke();

            // Edge Weight Label
            const mx = (s.x + t.x) / 2;
            const my = (s.y + t.y) / 2;
            this.ctx.fillStyle = COLORS.bg;
            this.ctx.fillRect(mx - 15, my - 8, 30, 16);
            this.ctx.fillStyle = COLORS.textMuted;
            this.ctx.font = '10px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(edge.weight.toFixed(2), mx, my);
        });

        // Draw Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.progress += (p.speed * p.dir);
            
            if ((p.dir === 1 && p.progress >= 1) || (p.dir === -1 && p.progress <= 0)) {
                this.particles.splice(i, 1);
                continue;
            }
            
            if (p.progress >= 0 && p.progress <= 1) {
                const s = this.getScaledPos(p.edge.source);
                const t = this.getScaledPos(p.edge.target);
                const px = s.x + (t.x - s.x) * p.progress;
                const py = s.y + (t.y - s.y) * p.progress;
                
                this.ctx.beginPath();
                this.ctx.arc(px, py, 4, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 10;
                this.ctx.fill();
                this.ctx.shadowBlur = 0; // reset
            }
        }

        // Draw Nodes
        const allNodes = [...this.net.inputs, ...this.net.hidden, this.net.output];
        allNodes.forEach(node => {
            const pos = this.getScaledPos(node);
            
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
            this.ctx.fillStyle = COLORS.nodeBase;
            this.ctx.fill();
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = COLORS.textMuted;
            this.ctx.stroke();

            // Node Value (Activation)
            this.ctx.fillStyle = COLORS.textMain;
            this.ctx.font = '12px Poppins';
            this.ctx.fillText(node.a.toFixed(2), pos.x, pos.y + 2);

            // Node Label
            this.ctx.fillStyle = COLORS.textMuted;
            this.ctx.font = '10px monospace';
            this.ctx.fillText(node.label, pos.x, pos.y - 35);
            
            // Bias (except inputs)
            if (node.layer !== 0) {
                this.ctx.fillStyle = COLORS.update;
                this.ctx.fillText(`b:${node.bias.toFixed(2)}`, pos.x, pos.y + 35);
            }
        });

        requestAnimationFrame(() => this.renderLoop());
    }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new NeuralNetVisualizer();
});
