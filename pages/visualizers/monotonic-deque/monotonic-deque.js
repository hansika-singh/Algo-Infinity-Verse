/**
 * Array Optimization - Monotonic Deque Engine
 * Visualizes the O(N) Sliding Window Maximum algorithm (LeetCode 239).
 * Utilizes a Generator state-machine bound to a Dynamic DOM renderer.
 */

class MonotonicDequeVisualizer {
    constructor() {
        this.arrContainer = document.getElementById('input-array');
        this.dequeContainer = document.getElementById('deque-container');
        this.outputContainer = document.getElementById('output-array');
        
        this.btnPlay = document.getElementById('btn-play');
        this.btnStep = document.getElementById('btn-step');
        this.btnReset = document.getElementById('btn-reset');
        this.btnGenerate = document.getElementById('btn-generate');
        
        this.mathPanel = document.getElementById('math-overlay');
        this.mathEq = document.getElementById('math-equation');
        this.statusTxt = document.getElementById('main-status');

        this.animating = false;
        this.generator = null;
        this.timer = null;
        this.arr = [];
        this.k = 3;
        
        this.bindEvents();
        this.generateArray();
    }

    bindEvents() {
        this.btnGenerate.addEventListener('click', () => this.generateArray());
        this.btnReset.addEventListener('click', () => this.resetSimulation());
        this.btnStep.addEventListener('click', () => this.step());
        this.btnPlay.addEventListener('click', () => this.togglePlay());
        
        // Update k on input change
        document.getElementById('input-k').addEventListener('change', (e) => {
            this.k = parseInt(e.target.value, 10);
            this.resetSimulation();
        });
    }

    generateArray() {
        const n = parseInt(document.getElementById('input-n').value, 10);
        this.k = parseInt(document.getElementById('input-k').value, 10);
        
        this.arr = [];
        for (let i = 0; i < n; i++) {
            // Generate distinct readable numbers for visualization
            this.arr.push(Math.floor(Math.random() * 90) + 10);
        }
        
        this.resetSimulation();
    }

    resetSimulation() {
        this.animating = false;
        if (this.timer) clearTimeout(this.timer);
        this.generator = null;
        
        this.btnPlay.innerHTML = '<i class="fas fa-play"></i> Auto Run';
        this.btnPlay.disabled = false;
        this.btnStep.disabled = false;
        this.mathPanel.classList.add('hidden');
        document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active'));

        // Reset DOM Arrays
        this.arrContainer.innerHTML = '';
        this.dequeContainer.innerHTML = '';
        this.outputContainer.innerHTML = '';

        this.arr.forEach((val, idx) => {
            const block = document.createElement('div');
            block.className = 'array-block';
            block.id = `arr-${idx}`;
            block.innerText = val;
            
            const label = document.createElement('span');
            label.className = 'index-label';
            label.innerText = `i=${idx}`;
            block.appendChild(label);
            
            this.arrContainer.appendChild(block);
        });

        this.statusTxt.innerText = `Status: Grid Ready | Window (k) = ${this.k}`;
    }

    highlightCode(stepId) {
        document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active'));
        if (stepId) document.getElementById(stepId).classList.add('active');
    }

    updateMath(equation) {
        this.mathEq.innerHTML = equation;
        this.mathPanel.classList.remove('hidden');
    }

    updateArrayWindow(i) {
        // Clear previous window styling
        document.querySelectorAll('.array-block').forEach(b => {
            b.classList.remove('in-window', 'current-eval', 'is-max');
        });
        
        // Calculate window bounds (handles initial filling where window is < k)
        const leftBound = Math.max(0, i - this.k + 1);
        
        for (let j = leftBound; j <= i; j++) {
            const el = document.getElementById(`arr-${j}`);
            if (el) el.classList.add('in-window');
        }
        
        const curr = document.getElementById(`arr-${i}`);
        if (curr) curr.classList.add('current-eval');
    }

    // Generator function for the State Machine
    *runAlgorithm() {
        const deque = []; // Stores indices

        for (let i = 0; i < this.arr.length; i++) {
            
            this.updateArrayWindow(i);
            this.highlightCode('step-loop');
            this.statusTxt.innerText = `Status: Processing index i=${i}`;
            this.updateMath(`Entering array element arr[${i}] = <span class="eq-hl">${this.arr[i]}</span>`);
            yield;

            // 1. Remove out-of-bounds front elements
            while (deque.length > 0 && deque[0] < i - this.k + 1) {
                this.highlightCode('step-pop-front');
                const outIndex = deque[0];
                this.updateMath(`Index ${outIndex} is out of window [${i - this.k + 1}, ${i}]. <br> <span class="eq-red">Pop from Front.</span>`);
                yield;
                
                this.highlightCode('step-pop-front-op');
                const dequeEl = document.getElementById(`dq-${outIndex}`);
                if (dequeEl) {
                    dequeEl.classList.add('pop-warning');
                    setTimeout(() => dequeEl.remove(), 400); // Wait for CSS animation
                }
                deque.shift();
                yield;
            }

            // 2. Remove elements from back that are smaller than current
            while (deque.length > 0 && this.arr[deque[deque.length - 1]] <= this.arr[i]) {
                const backIndex = deque[deque.length - 1];
                
                this.highlightCode('step-pop-back');
                this.updateMath(`arr[${i}] (<span class="eq-hl">${this.arr[i]}</span>) >= deque.back() (<span class="eq-red">${this.arr[backIndex]}</span>). <br> Smaller elements can't be maximum. <span class="eq-red">Pop from Back.</span>`);
                yield;

                this.highlightCode('step-pop-back-op');
                const dequeEl = document.getElementById(`dq-${backIndex}`);
                if (dequeEl) {
                    dequeEl.classList.add('pop-danger');
                    setTimeout(() => dequeEl.remove(), 400);
                }
                deque.pop();
                yield;
            }

            // 3. Push current element
            this.highlightCode('step-push');
            deque.push(i);
            
            // Create DOM representation in Deque
            const dqBlock = document.createElement('div');
            dqBlock.className = 'deque-block';
            dqBlock.id = `dq-${i}`;
            dqBlock.innerText = this.arr[i];
            
            const dqLabel = document.createElement('span');
            dqLabel.className = 'index-label';
            dqLabel.innerText = `i=${i}`;
            dqBlock.appendChild(dqLabel);
            
            this.dequeContainer.appendChild(dqBlock);
            this.updateMath(`Push index ${i} (value <span class="eq-hl">${this.arr[i]}</span>) to Deque.`);
            yield;

            // 4. Record output if window is full
            if (i >= this.k - 1) {
                this.highlightCode('step-record');
                const maxIndex = deque[0];
                const maxVal = this.arr[maxIndex];
                
                document.getElementById(`arr-${maxIndex}`).classList.add('is-max');
                this.updateMath(`Window full. Front of deque (<span class="eq-green">${maxVal}</span>) is the maximum.`);
                yield;

                this.highlightCode('step-record-op');
                const outBlock = document.createElement('div');
                outBlock.className = 'output-block';
                outBlock.innerText = maxVal;
                this.outputContainer.appendChild(outBlock);
                yield;
            }
        }

        // Cleanup and finish
        document.querySelectorAll('.array-block').forEach(b => {
            b.classList.remove('in-window', 'current-eval', 'is-max');
        });
        
        this.highlightCode(null);
        this.statusTxt.innerText = `Status: Algorithm Complete`;
        this.mathPanel.classList.add('hidden');
        this.btnPlay.innerHTML = '<i class="fas fa-check"></i> Done';
        this.btnPlay.disabled = true;
        this.btnStep.disabled = true;
        this.animating = false;
    }

    togglePlay() {
        this.animating = !this.animating;
        this.btnPlay.innerHTML = this.animating ? '<i class="fas fa-pause"></i> Pause' : '<i class="fas fa-play"></i> Auto Run';
        if (this.animating) this.autoStep();
    }

    step() {
        if (!this.generator) {
            this.generator = this.runAlgorithm();
        }

        const res = this.generator.next();
        
        if (res.done) {
            this.generator = null;
            return false;
        }
        return true;
    }

    autoStep() {
        if (!this.animating) return;
        
        const hasNext = this.step();
        if (hasNext) {
            // Speed could be mapped to a slider, defaulting to 1s for clear educational pacing
            this.timer = setTimeout(() => this.autoStep(), 1000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new MonotonicDequeVisualizer();
});
