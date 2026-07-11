/**
 * Algo-Infinity-Verse | Grover's Algorithm Amplitude Amplification Visualizer
 * Simulates Quantum States, Oracle Phase Flips, and Diffusion (Inversion about Mean).
 */

class GroversVisualizer {
    constructor() {
        this.N = 16; // 4 Qubits
        this.amplitudes = new Array(this.N).fill(0);
        this.targetIndex = 5;
        this.iterationCount = 0;
        
        // UI
        this.selectTarget = document.getElementById('select-target');
        this.btnInit = document.getElementById('btn-initialize');
        this.btnPlay = document.getElementById('btn-play');
        this.btnStep = document.getElementById('btn-step');
        this.speedSlider = document.getElementById('speed-slider');
        
        // Telemetry & Logs
        this.valIterations = document.getElementById('val-iterations');
        this.valProbability = document.getElementById('val-probability');
        this.warningOvercook = document.getElementById('overcook-warning');
        this.statusText = document.getElementById('status-text');
        
        // DOM Stage
        this.barsWrapper = document.getElementById('bars-wrapper');
        this.meanLine = document.getElementById('mean-line');
        this.colElements = [];

        // Engine State
        this.generator = null;
        this.isPlaying = false;
        this.animSpeed = 1.0;
        this.autoPlayTimeout = null;

        this.init();
    }

    init() {
        this.populateSelector();
        this.bindEvents();
        this.initializeSuperposition();
    }

    populateSelector() {
        this.selectTarget.innerHTML = '';
        for (let i = 0; i < this.N; i++) {
            // Display binary representation mapping to states
            const bin = i.toString(2).padStart(4, '0');
            this.selectTarget.add(new Option(`|${bin}⟩ (State ${i})`, i, false, i === this.targetIndex));
        }
    }

    bindEvents() {
        this.selectTarget.addEventListener('change', (e) => {
            this.targetIndex = parseInt(e.target.value);
            this.initializeSuperposition();
        });

        this.btnInit.addEventListener('click', () => this.initializeSuperposition());
        
        this.btnPlay.addEventListener('click', () => {
            if (this.isPlaying) this.pauseAutoPlay();
            else this.startAutoPlay();
        });
        
        this.btnStep.addEventListener('click', () => {
            this.pauseAutoPlay();
            this.stepForward();
        });
        
        this.speedSlider.addEventListener('input', (e) => {
            this.animSpeed = parseFloat(e.target.value);
            document.getElementById('speed-val').textContent = `${this.animSpeed.toFixed(1)}x`;
        });
    }

    /* --- Quantum Math & Logic --- */

    initializeSuperposition() {
        this.pauseAutoPlay();
        this.iterationCount = 0;
        this.warningOvercook.style.display = 'none';
        
        // Uniform Superposition: 1 / sqrt(N)
        const initialAmp = 1 / Math.sqrt(this.N);
        for (let i = 0; i < this.N; i++) {
            this.amplitudes[i] = initialAmp;
        }

        this.buildBarsDOM();
        this.updateUI();
        this.meanLine.classList.remove('visible');
        
        this.generator = this.algorithmGenerator();
        this.btnStep.disabled = false;
        this.btnPlay.disabled = false;
        this.updateStatus(`Initialized Uniform Superposition. Amplitude: ${initialAmp.toFixed(3)}`);
    }

    *algorithmGenerator() {
        // Run slightly past optimal to demonstrate "overcooking"
        const maxIterations = 5; 
        
        while (this.iterationCount < maxIterations) {
            this.iterationCount++;
            
            /* --- STEP 1: THE ORACLE (PHASE INVERSION) --- */
            this.amplitudes[this.targetIndex] *= -1;
            
            yield {
                phase: 'oracle',
                msg: `Iteration ${this.iterationCount}: Oracle Applied. Target state phase inverted.`
            };

            /* --- STEP 2: DIFFUSION (INVERSION ABOUT MEAN) --- */
            // Calculate Mean
            let sum = 0;
            for (let i = 0; i < this.N; i++) sum += this.amplitudes[i];
            const mean = sum / this.N;
            
            yield {
                phase: 'mean_calc',
                msg: `Iteration ${this.iterationCount}: Calculating Average Amplitude (μ = ${mean.toFixed(3)}).`,
                meanVal: mean
            };

            // Invert about mean: new = 2*mean - old
            for (let i = 0; i < this.N; i++) {
                this.amplitudes[i] = (2 * mean) - this.amplitudes[i];
            }

            yield {
                phase: 'diffusion',
                msg: `Iteration ${this.iterationCount}: Diffusion Applied. Amplitudes reflected across the mean.`
            };
        }

        yield { phase: 'done', msg: 'Algorithm complete. Notice how excessive iterations destroy the probability!' };
    }

    /* --- DOM Updates & Physics --- */

    buildBarsDOM() {
        this.barsWrapper.innerHTML = '';
        this.colElements = [];

        for (let i = 0; i < this.N; i++) {
            const col = document.createElement('div');
            col.className = `q-state-col ${i === this.targetIndex ? 'is-target' : ''}`;
            
            // Binary label
            const bin = i.toString(2).padStart(4, '0');
            
            col.innerHTML = `
                <span class="prob-label" id="prob-${i}">0%</span>
                <div class="amp-bar-container">
                    <div class="amp-bar" id="bar-${i}"></div>
                </div>
                <span class="state-label">|${bin}⟩</span>
            `;
            
            this.barsWrapper.appendChild(col);
            this.colElements.push({
                root: col,
                bar: col.querySelector(`#bar-${i}`),
                probLabel: col.querySelector(`#prob-${i}`)
            });
        }
    }

    updateUI() {
        let targetProb = 0;

        for (let i = 0; i < this.N; i++) {
            const amp = this.amplitudes[i];
            const prob = Math.pow(amp, 2);
            if (i === this.targetIndex) targetProb = prob;

            const colObj = this.colElements[i];
            
            // Adjust phase class (negative phase points downward)
            if (amp < -0.001) colObj.root.classList.add('negative');
            else colObj.root.classList.remove('negative');

            // Max visual height is 1.0 (100%). Container is 50% of screen.
            const heightPercent = Math.min(100, Math.abs(amp) * 100);
            colObj.bar.style.height = `${heightPercent}%`;
            
            // Update percentage text
            colObj.probLabel.textContent = `${(prob * 100).toFixed(1)}%`;
        }

        // Update Telemetry
        this.valIterations.textContent = this.iterationCount;
        this.valProbability.textContent = `${(targetProb * 100).toFixed(1)}%`;

        if (this.iterationCount > 3) {
            this.warningOvercook.style.display = 'block';
            this.valProbability.style.color = 'var(--danger)';
        } else {
            this.warningOvercook.style.display = 'none';
            this.valProbability.style.color = 'var(--accent-emerald)';
        }
    }

    updateStatus(msg) {
        this.statusText.textContent = msg;
    }

    /* --- Frame Applier --- */
    
    stepForward() {
        if (!this.generator) return;
        const { value, done } = this.generator.next();
        
        if (done) {
            this.pauseAutoPlay();
            this.btnStep.disabled = true;
            this.btnPlay.disabled = true;
            if(value) this.updateStatus(value.msg);
            this.meanLine.classList.remove('visible');
            return;
        }

        this.applyState(value);
    }

    applyState(state) {
        this.updateStatus(state.msg);

        if (state.phase === 'oracle') {
            this.meanLine.classList.remove('visible');
            this.updateUI();
        } 
        else if (state.phase === 'mean_calc') {
            // Position the mean line. Math 0 is 50% visually.
            // A mean of 0.25 means moving UP 25% of the half-height (which is 12.5% of total height).
            // Formula: top = 50% - (mean * 50%)
            const topPosition = 50 - (state.meanVal * 50);
            this.meanLine.style.top = `${topPosition}%`;
            this.meanLine.classList.add('visible');
        } 
        else if (state.phase === 'diffusion') {
            this.updateUI();
        }
    }

    /* --- Auto Play Mechanics --- */

    startAutoPlay() {
        this.isPlaying = true;
        this.btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        this.btnPlay.classList.replace('btn-primary', 'btn-accent');
        
        const tick = () => {
            if (!this.isPlaying) return;
            this.stepForward();
            if (this.btnStep.disabled) {
                this.pauseAutoPlay();
                return;
            }
            // Give diffusion/mean calculations a bit more time to render
            const delay = Math.max(400, 1500 / this.animSpeed);
            this.autoPlayTimeout = setTimeout(tick, delay);
        };
        tick();
    }

    pauseAutoPlay() {
        this.isPlaying = false;
        clearTimeout(this.autoPlayTimeout);
        this.btnPlay.innerHTML = '<i class="fa-solid fa-play"></i> Auto Run';
        this.btnPlay.classList.replace('btn-accent', 'btn-primary');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GroversVisualizer();
});
