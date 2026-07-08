/**
 * FFT Divide-and-Conquer Visualizer
 * Simulates Cooley-Tukey FFT with interactive stepping and complex plane rendering.
 */

class Complex {
    constructor(re, im) {
        this.re = re;
        this.im = im;
    }
    add(other) {
        return new Complex(this.re + other.re, this.im + other.im);
    }
    sub(other) {
        return new Complex(this.re - other.re, this.im - other.im);
    }
    mul(other) {
        return new Complex(
            this.re * other.re - this.im * other.im,
            this.re * other.im + this.im * other.re
        );
    }
    // Static method for e^(i * theta)
    static exp(theta) {
        return new Complex(Math.cos(theta), Math.sin(theta));
    }
    toString() {
        const reStr = this.re.toFixed(2);
        const imStr = Math.abs(this.im).toFixed(2);
        return `${reStr} ${this.im >= 0 ? '+' : '-'} ${imStr}i`;
    }
}

class FFTVisualizer {
    constructor() {
        this.input = [];
        this.speed = 800;
        this.isPlaying = false;
        this.fftGenerator = null;
        this.currentStep = null;
        this.animationTimer = null;
        this.depth = 0;
        
        // DOM Elements
        this.els = {
            input: document.getElementById('inputSequence'),
            btnLoad: document.getElementById('btnLoadCustom'),
            btnSine: document.getElementById('btnExampleSine'),
            btnImpulse: document.getElementById('btnExampleImpulse'),
            btnRand: document.getElementById('btnRandomize'),
            btnReset: document.getElementById('btnReset'),
            btnPlay: document.getElementById('btnPlay'),
            btnPause: document.getElementById('btnPause'),
            btnStep: document.getElementById('btnStep'),
            logContainer: document.getElementById('logContainer'),
            treeContainer: document.getElementById('treeContainer'),
            complexCanvas: document.getElementById('complexCanvas'),
            emptyState: document.getElementById('emptyState'),
            speed: document.getElementById('animSpeed'),
            statDepth: document.getElementById('statDepth'),
            statSize: document.getElementById('statSize'),
            panelLeft: document.getElementById('panelLeft'),
            mainResizer: document.getElementById('mainResizer'),
            arrayViewPanel: document.getElementById('arrayViewPanel'),
            splitResizer: document.getElementById('splitResizer')
        };
        
        this.ctx = this.els.complexCanvas.getContext('2d');
        
        this.bindEvents();
    }
    
    bindEvents() {
        this.els.btnLoad.addEventListener('click', () => this.loadCustom());
        this.els.btnSine.addEventListener('click', () => this.loadExample('sine'));
        this.els.btnImpulse.addEventListener('click', () => this.loadExample('impulse'));
        this.els.btnRand.addEventListener('click', () => this.loadExample('random'));
        this.els.btnReset.addEventListener('click', () => this.reset());
        
        this.els.btnPlay.addEventListener('click', () => this.play());
        this.els.btnPause.addEventListener('click', () => this.pause());
        this.els.btnStep.addEventListener('click', () => this.step());
        
        this.els.speed.addEventListener('input', (e) => {
            this.speed = 2100 - parseInt(e.target.value); // Reverse scale: higher value = lower ms delay
            if (this.isPlaying) {
                this.pause();
                this.play();
            }
        });
        
        this.setupResizer(this.els.mainResizer, this.els.panelLeft);
        this.setupResizer(this.els.splitResizer, this.els.arrayViewPanel);
    }
    
    setupResizer(resizer, targetPanel) {
        if (!resizer || !targetPanel) return;
        
        let isResizing = false;
        let startPos = 0;
        let startSize = 0;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startPos = e.clientX;
            startSize = targetPanel.getBoundingClientRect().width;
            resizer.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const delta = e.clientX - startPos;
            targetPanel.style.flex = 'none';
            targetPanel.style.width = `${startSize + delta}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizer.classList.remove('resizing');
                document.body.style.cursor = '';
            }
        });
    }

    log(message, type = 'info') {
        const div = document.createElement('div');
        div.className = `log-entry ${type}`;
        div.textContent = `> ${message}`;
        this.els.logContainer.appendChild(div);
        this.els.logContainer.scrollTop = this.els.logContainer.scrollHeight;
    }
    
    setLine(lineId) {
        document.querySelectorAll('.pseudo-panel span').forEach(el => el.classList.remove('active-line'));
        if (lineId) {
            const el = document.getElementById(`pseudo-${lineId}`);
            if (el) el.classList.add('active-line');
        }
    }
    
    padToPowerOfTwo(arr) {
        let n = 1;
        while (n < arr.length) n *= 2;
        while (arr.length < n) arr.push(0);
        return arr;
    }
    
    loadCustom() {
        const val = this.els.input.value;
        if (!val) return this.log('Please enter a sequence.', 'error');
        let arr = val.split(',').map(s => parseFloat(s.trim()));
        if (arr.some(isNaN)) return this.log('Invalid number in sequence.', 'error');
        
        this.initSequence(arr);
    }
    
    loadExample(type) {
        let arr = [];
        if (type === 'sine') {
            for (let i = 0; i < 8; i++) arr.push(Math.sin((Math.PI / 4) * i));
            this.els.input.value = arr.map(n => n.toFixed(2)).join(', ');
        } else if (type === 'impulse') {
            arr = [1, 0, 0, 0, 0, 0, 0, 0];
            this.els.input.value = "1, 0, 0, 0, 0, 0, 0, 0";
        } else if (type === 'random') {
            for (let i = 0; i < 8; i++) arr.push(Math.round(Math.random() * 10 - 5));
            this.els.input.value = arr.join(', ');
        }
        this.initSequence(arr);
    }
    
    initSequence(arr) {
        this.pause();
        arr = this.padToPowerOfTwo(arr);
        this.input = arr.map(v => new Complex(v, 0));
        
        this.els.emptyState.classList.add('hidden');
        this.els.treeContainer.innerHTML = '';
        this.log(`Loaded sequence of size ${arr.length}. Starting FFT.`, 'success');
        
        this.depth = 0;
        this.buildStaticTree(this.input);
        
        this.fftGenerator = this.fftAlg(this.input, 0, "fft-root");
        this.drawComplexPlane(); // Reset canvas
        
        this.els.statSize.textContent = arr.length;
    }
    
    buildStaticTree(P) {
        this.els.treeContainer.innerHTML = '';
        const levels = [];
        
        const build = (arr, depth, id, type) => {
            if (!levels[depth]) levels[depth] = [];
            levels[depth].push({ arr, id, type });
            
            if (arr.length > 1) {
                const even = [], odd = [];
                for(let i = 0; i < arr.length; i++) {
                    if (i % 2 === 0) even.push(arr[i]);
                    else odd.push(arr[i]);
                }
                build(even, depth + 1, `${id}-e`, 'even');
                build(odd, depth + 1, `${id}-o`, 'odd');
            }
        };
        
        build(P, 0, 'fft-root', 'even');
        
        levels.forEach((levelNodes, d) => {
            const levelDiv = document.createElement('div');
            levelDiv.className = 'tree-level';
            levelDiv.id = `level-${d}`;
            
            levelNodes.forEach(node => {
                const nodeDiv = document.createElement('div');
                nodeDiv.className = `array-node ${node.type}`;
                nodeDiv.id = node.id;
                
                node.arr.forEach(c => {
                    const cell = document.createElement('div');
                    cell.className = `array-cell ${node.type}`;
                    const val = Math.abs(c.im) < 0.01 ? c.re.toFixed(1) : `${c.re.toFixed(1)}${c.im >= 0?'+':''}${c.im.toFixed(1)}i`;
                    cell.textContent = val;
                    cell.title = c.toString();
                    nodeDiv.appendChild(cell);
                });
                
                levelDiv.appendChild(nodeDiv);
            });
            this.els.treeContainer.appendChild(levelDiv);
        });
    }
    
    reset() {
        this.pause();
        this.input = [];
        this.els.input.value = '';
        this.els.emptyState.classList.remove('hidden');
        this.els.treeContainer.innerHTML = '';
        this.ctx.clearRect(0, 0, this.els.complexCanvas.width, this.els.complexCanvas.height);
        this.log('Visualizer reset.', 'sys');
        this.setLine('');
        this.els.statSize.textContent = '0';
        this.els.statDepth.textContent = '0';
    }
    
    // createDOMNode is no longer needed dynamically as we build static tree upfront.
    
    updateDOMNode(id, arr) {
        const nodeDiv = document.getElementById(id);
        if (!nodeDiv) return;
        nodeDiv.innerHTML = '';
        arr.forEach(c => {
            const cell = document.createElement('div');
            cell.className = `array-cell merged`;
            const val = Math.abs(c.im) < 0.01 ? c.re.toFixed(1) : `${c.re.toFixed(1)}${c.im >= 0?'+':''}${c.im.toFixed(1)}i`;
            cell.textContent = val;
            cell.title = c.toString();
            nodeDiv.appendChild(cell);
        });
    }

    *fftAlg(P, currentDepth, nodeId) {
        const n = P.length;
        this.depth = currentDepth;
        this.els.statDepth.textContent = currentDepth;
        
        // Base Case
        if (n === 1) {
            this.log(`Base case reached: [${P[0].toString()}]`);
            yield { state: 'base', arr: P, id: nodeId };
            return P;
        }
        
        // Divide
        this.setLine('split');
        this.log(`Splitting array of size ${n} into Even and Odd.`);
        const Pe = [], Po = [];
        for (let i = 0; i < n; i++) {
            if (i % 2 === 0) Pe.push(P[i]);
            else Po.push(P[i]);
        }
        
        const evenId = `${nodeId}-e`;
        const oddId = `${nodeId}-o`;
        this.depth++;
        this.depth--;
        
        yield { state: 'split', n, evenId, oddId };

        // Conquer
        this.setLine('recurse');
        const ye = yield* this.fftAlg(Pe, currentDepth + 1, evenId);
        const yo = yield* this.fftAlg(Po, currentDepth + 1, oddId);
        
        this.depth = currentDepth; // restore depth
        
        // Merge
        this.setLine('merge');
        this.log(`Merging size ${n}...`);
        const y = new Array(n).fill(null);
        
        yield { state: 'pre-merge', n, evenId, oddId, id: nodeId };

        for (let j = 0; j < n / 2; j++) {
            this.setLine('loop');
            
            // Butterfly operation: omega = e^(-2*pi*i*j/n) for forward FFT
            const angle = -2 * Math.PI * j / n;
            const omega = Complex.exp(angle);
            
            this.setLine('butterfly');
            const omega_yo = omega.mul(yo[j]);
            y[j] = ye[j].add(omega_yo);
            
            this.setLine('butterfly2');
            y[j + n/2] = ye[j].sub(omega_yo);
            
            this.log(`Butterfly j=${j}: ${ye[j].toString()} & ${omega_yo.toString()}`);
            
            yield { state: 'butterfly', j, n, omega, ye_j: ye[j], yo_j: yo[j], y1: y[j], y2: y[j + n/2] };
        }
        
        this.updateDOMNode(nodeId, y);
        this.log(`Merge complete for node ${nodeId}`);
        yield { state: 'merged', arr: y, id: nodeId };
        return y;
    }
    
    drawComplexPlane(activeOmega = null, highlightPts = []) {
        const w = this.els.complexCanvas.width;
        const h = this.els.complexCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(cx, cy) - 40;
        
        this.ctx.clearRect(0, 0, w, h);
        
        // Draw grid
        this.ctx.strokeStyle = '#334155';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, cy); this.ctx.lineTo(w, cy);
        this.ctx.moveTo(cx, 0); this.ctx.lineTo(cx, h);
        this.ctx.stroke();
        
        // Draw Unit Circle
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Draw Active Twiddle Factor (Omega)
        if (activeOmega) {
            this.ctx.strokeStyle = '#10b981';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx + activeOmega.re * r, cy - activeOmega.im * r);
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#10b981';
            this.ctx.beginPath();
            this.ctx.arc(cx + activeOmega.re * r, cy - activeOmega.im * r, 5, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }

    step() {
        if (!this.fftGenerator) {
            this.log('Initialize a sequence first.', 'error');
            return false;
        }
        
        const res = this.fftGenerator.next();
        if (res.done) {
            this.log('FFT Completed.', 'success');
            this.setLine('');
            this.fftGenerator = null;
            this.pause();
            return false;
        }
        
        const state = res.value;
        this.handleVisualState(state);
        return true;
    }
    
    handleVisualState(s) {
        document.querySelectorAll('.active-split').forEach(el => el.classList.remove('active-split'));
        
        if (s.state === 'base') {
            const el = document.getElementById(s.id);
            if (el) el.classList.add('active-split');
        } else if (s.state === 'split') {
            const elE = document.getElementById(s.evenId);
            const elO = document.getElementById(s.oddId);
            if (elE) elE.classList.add('active-split');
            if (elO) elO.classList.add('active-split');
        } else if (s.state === 'pre-merge') {
            const el = document.getElementById(s.id);
            if (el) el.classList.add('active-split');
        } else if (s.state === 'butterfly') {
            this.drawComplexPlane(s.omega);
        } else if (s.state === 'merged') {
            const el = document.getElementById(s.id);
            if (el) el.classList.add('active-split');
            this.drawComplexPlane();
        }
    }

    play() {
        if (!this.fftGenerator) {
            this.log('Please load a sequence first.', 'error');
            return;
        }
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.els.btnPlay.disabled = true;
        
        const loop = () => {
            if (!this.isPlaying) return;
            const hasMore = this.step();
            if (hasMore) {
                this.animationTimer = setTimeout(loop, this.speed);
            }
        };
        loop();
    }
    
    pause() {
        this.isPlaying = false;
        this.els.btnPlay.disabled = false;
        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = null;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.fftVis = new FFTVisualizer();
});
