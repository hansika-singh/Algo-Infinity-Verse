/**
 * fft-visualizer.js
 * Implements Complex Number arithmetic and the O(N log N) Cooley-Tukey FFT Algorithm.
 * Handles Dual-Canvas rendering (Time and Frequency domains) and dynamic SVG Butterfly Graph generation.
 */

document.addEventListener("DOMContentLoaded", () => {
    initFFTEngine();
});

// ==========================================
// 1. COMPLEX NUMBER ARITHMETIC
// ==========================================
class Complex {
    constructor(re, im = 0) {
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
    mag() {
        return Math.sqrt(this.re * this.re + this.im * this.im);
    }
}

// ==========================================
// 2. COOLEY-TUKEY FFT ALGORITHM
// ==========================================
/**
 * Recursive Radix-2 DIT Fast Fourier Transform.
 * Expects array length to be a power of 2.
 */
function fft(x) {
    const N = x.length;
    if (N <= 1) return x;

    // Divide
    const even = new Array(N / 2);
    const odd = new Array(N / 2);
    for (let i = 0; i < N / 2; i++) {
        even[i] = x[i * 2];
        odd[i] = x[i * 2 + 1];
    }

    // Conquer
    const qEven = fft(even);
    const qOdd = fft(odd);

    // Combine
    const y = new Array(N);
    for (let k = 0; k < N / 2; k++) {
        // Twiddle factor: e^(-i * 2 * pi * k / N)
        const angle = -2 * Math.PI * k / N;
        const twiddle = new Complex(Math.cos(angle), Math.sin(angle));
        
        const t = twiddle.mul(qOdd[k]);
        
        y[k] = qEven[k].add(t);
        y[k + N / 2] = qEven[k].sub(t);
    }
    return y;
}

// ==========================================
// 3. STATE & DOM ELEMENTS
// ==========================================
const SAMPLES = 256; // N must be power of 2 for Radix-2 FFT
let timeData = new Array(SAMPLES).fill(0); // Y-values of the drawn wave
let isDrawing = false;

const els = {
    timeCanvas: document.getElementById('timeCanvas'),
    freqCanvas: document.getElementById('freqCanvas'),
    butterflySvg: document.getElementById('butterflySvg'),
    
    btnRunFFT: document.getElementById('btnRunFFT'),
    btnClear: document.getElementById('btnClear'),
    btnWaveSine: document.getElementById('btnWaveSine'),
    btnWaveComposite: document.getElementById('btnWaveComposite'),
    btnWaveSquare: document.getElementById('btnWaveSquare'),
    
    engineBadge: document.getElementById('engineBadge'),
    freqEmptyState: document.getElementById('freqEmptyState'),
    execTime: document.getElementById('execTime')
};

let timeCtx, freqCtx;

function initFFTEngine() {
    timeCtx = els.timeCanvas.getContext('2d');
    freqCtx = els.freqCanvas.getContext('2d');
    
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);
    
    bindEvents();
    drawTimeCanvas();
    drawButterflyDiagram(16); // Draw N=16 sub-sample for the UI
}

function resizeCanvases() {
    const setRes = (canvas) => {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        canvas.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    setRes(els.timeCanvas);
    setRes(els.freqCanvas);
    drawTimeCanvas();
}

function bindEvents() {
    // Canvas Drawing Logic
    els.timeCanvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        updateWaveData(e);
    });
    
    els.timeCanvas.addEventListener('mousemove', (e) => {
        if (isDrawing) updateWaveData(e);
    });
    
    window.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    // Control Buttons
    els.btnClear.addEventListener('click', () => {
        timeData = new Array(SAMPLES).fill(0);
        drawTimeCanvas();
        clearFrequencyCanvas();
    });

    els.btnWaveSine.addEventListener('click', () => generatePreset('sine'));
    els.btnWaveComposite.addEventListener('click', () => generatePreset('composite'));
    els.btnWaveSquare.addEventListener('click', () => generatePreset('square'));

    els.btnRunFFT.addEventListener('click', executeFFT);
}

// ==========================================
// 4. SIGNAL GENERATION & DRAWING
// ==========================================
function updateWaveData(e) {
    const rect = els.timeCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Map X to array index
    let idx = Math.floor((x / rect.width) * SAMPLES);
    if (idx < 0) idx = 0;
    if (idx >= SAMPLES) idx = SAMPLES - 1;
    
    // Map Y to amplitude (-1 to 1)
    // Canvas Y is inverted (0 is top)
    const amplitude = 1 - (y / rect.height) * 2;
    
    // Brush size for smooth drawing
    const brushSize = 3;
    for (let i = -brushSize; i <= brushSize; i++) {
        if (idx + i >= 0 && idx + i < SAMPLES) {
            // Smooth falloff for brush
            const factor = 1 - Math.abs(i) / (brushSize + 1);
            timeData[idx + i] = amplitude * factor + timeData[idx + i] * (1 - factor);
        }
    }
    
    drawTimeCanvas();
}

function generatePreset(type) {
    timeData = new Array(SAMPLES).fill(0);
    for (let i = 0; i < SAMPLES; i++) {
        const t = i / SAMPLES; // Normalized time 0 to 1
        if (type === 'sine') {
            timeData[i] = Math.sin(2 * Math.PI * 3 * t); // 3 Hz
        } else if (type === 'composite') {
            timeData[i] = 0.5 * Math.sin(2 * Math.PI * 2 * t) + 0.3 * Math.sin(2 * Math.PI * 15 * t); // 2 Hz + 15 Hz
        } else if (type === 'square') {
            timeData[i] = Math.sin(2 * Math.PI * 5 * t) > 0 ? 0.8 : -0.8; // 5 Hz Square
        }
    }
    drawTimeCanvas();
    clearFrequencyCanvas();
}

function drawTimeCanvas() {
    const w = els.timeCanvas.clientWidth;
    const h = els.timeCanvas.clientHeight;
    timeCtx.clearRect(0, 0, w, h);

    // Draw Center Line
    timeCtx.beginPath();
    timeCtx.moveTo(0, h / 2);
    timeCtx.lineTo(w, h / 2);
    timeCtx.strokeStyle = 'rgba(255,255,255,0.1)';
    timeCtx.lineWidth = 1;
    timeCtx.stroke();

    // Draw Wave
    timeCtx.beginPath();
    const sliceWidth = w / SAMPLES;
    
    for (let i = 0; i < SAMPLES; i++) {
        const x = i * sliceWidth;
        // Map amplitude (-1 to 1) back to Canvas Y
        const y = h / 2 - (timeData[i] * (h / 2) * 0.9); // 0.9 to keep padding
        
        if (i === 0) timeCtx.moveTo(x, y);
        else timeCtx.lineTo(x, y);
    }
    
    timeCtx.strokeStyle = '#06b6d4'; // Cyan
    timeCtx.lineWidth = 2;
    timeCtx.shadowBlur = 10;
    timeCtx.shadowColor = '#06b6d4';
    timeCtx.stroke();
    timeCtx.shadowBlur = 0;
}

// ==========================================
// 5. EXECUTION & FREQUENCY RENDERING
// ==========================================
function executeFFT() {
    els.btnRunFFT.disabled = true;
    els.btnRunFFT.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Computing...';
    els.engineBadge.classList.add('computing');
    els.engineBadge.innerHTML = '<i class="fas fa-cog fa-spin"></i> Processing Signal...';

    // Allow UI to update before blocking math
    setTimeout(() => {
        const start = performance.now();
        
        // 1. Prepare Complex Input Array
        const complexInput = timeData.map(val => new Complex(val, 0));
        
        // 2. Run O(N log N) FFT
        const complexOutput = fft(complexInput);
        
        const duration = (performance.now() - start).toFixed(2);
        els.execTime.textContent = `${duration} ms`;

        // 3. Extract Magnitudes (Only need first half up to Nyquist limit)
        const magnitudes = [];
        for (let i = 0; i < SAMPLES / 2; i++) {
            magnitudes.push(complexOutput[i].mag());
        }

        // 4. Render output
        drawFrequencyCanvas(magnitudes);
        animateButterfly(); // Trigger visual effect
        
        // Reset UI
        els.btnRunFFT.disabled = false;
        els.btnRunFFT.innerHTML = '<i class="fas fa-bolt"></i> Compute FFT';
        els.engineBadge.classList.remove('computing');
        els.engineBadge.innerHTML = '<i class="fas fa-wave-square"></i> DSP Engine: Ready';
    }, 50);
}

function clearFrequencyCanvas() {
    const w = els.freqCanvas.clientWidth;
    const h = els.freqCanvas.clientHeight;
    freqCtx.clearRect(0, 0, w, h);
    els.freqEmptyState.style.display = 'flex';
}

function drawFrequencyCanvas(magnitudes) {
    els.freqEmptyState.style.display = 'none';
    const w = els.freqCanvas.clientWidth;
    const h = els.freqCanvas.clientHeight;
    freqCtx.clearRect(0, 0, w, h);

    // Ignore DC offset (index 0) for better visualization scaling
    const maxMag = Math.max(...magnitudes.slice(1), 0.001); 
    const barWidth = w / magnitudes.length;

    for (let i = 1; i < magnitudes.length; i++) {
        const x = i * barWidth;
        // Normalize height
        const barHeight = (magnitudes[i] / maxMag) * (h * 0.9);
        const y = h - barHeight;

        freqCtx.fillStyle = '#d946ef'; // Magenta
        freqCtx.fillRect(x, y, barWidth - 1, barHeight);
    }
}

// ==========================================
// 6. BUTTERFLY DIAGRAM GENERATOR (SVG)
// ==========================================
/**
 * Generates an SVG representation of the Decimation-in-Time Radix-2 FFT Graph.
 * Visualizing N=256 is a solid block of ink, so we render an N=16 sub-graph to teach the concept.
 */
function drawButterflyDiagram(N) {
    const svg = els.butterflySvg;
    svg.innerHTML = ''; // Clear
    
    // N=16 means 4 stages (log2(16))
    const stages = Math.log2(N);
    const width = svg.clientWidth || 800;
    const height = svg.clientHeight || 300;
    
    const xStep = width / (stages + 1);
    const yStep = height / N;
    
    // Bit reversal permutation for initial node layout
    function reverseBits(n, bits) {
        let rev = 0;
        for (let i = 0; i < bits; i++) {
            rev = (rev << 1) | (n & 1);
            n >>= 1;
        }
        return rev;
    }

    // Draw Lines (Edges)
    for (let stage = 1; stage <= stages; stage++) {
        const blockSize = Math.pow(2, stage);
        const halfBlock = blockSize / 2;
        
        for (let i = 0; i < N; i += blockSize) {
            for (let j = 0; j < halfBlock; j++) {
                const topIdx = i + j;
                const botIdx = i + j + halfBlock;
                
                const x1 = (stage - 1) * xStep + (xStep / 2);
                const x2 = stage * xStep + (xStep / 2);
                
                const yTop = (topIdx + 0.5) * yStep;
                const yBot = (botIdx + 0.5) * yStep;

                // Straight lines
                createSvgLine(svg, x1, yTop, x2, yTop);
                createSvgLine(svg, x1, yBot, x2, yBot);
                // Cross lines (The "Butterfly")
                createSvgLine(svg, x1, yTop, x2, yBot);
                createSvgLine(svg, x1, yBot, x2, yTop);
            }
        }
    }

    // Draw Nodes
    for (let stage = 0; stage <= stages; stage++) {
        for (let i = 0; i < N; i++) {
            const x = stage * xStep + (xStep / 2);
            const y = (i + 0.5) * yStep;
            
            // Determine odd/even for input stage (stage 0) based on bit reversal
            let isEven = true;
            if (stage === 0) {
                const origIdx = reverseBits(i, stages);
                isEven = origIdx % 2 === 0;
            }

            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", x);
            circle.setAttribute("cy", y);
            circle.setAttribute("r", "4");
            circle.setAttribute("class", `bf-node ${isEven ? 'even' : 'odd'}`);
            
            // Tooltip for educational hover
            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = stage === 0 ? `Input x[${reverseBits(i, stages)}]` : `Stage ${stage} Node`;
            circle.appendChild(title);
            
            svg.appendChild(circle);
        }
    }
}

function createSvgLine(svg, x1, y1, x2, y2) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("class", "bf-line");
    svg.appendChild(line);
}

function animateButterfly() {
    // Simple visual sweep effect over the lines to signify data flow
    const lines = document.querySelectorAll('.bf-line');
    lines.forEach(line => line.classList.add('active'));
    setTimeout(() => {
        lines.forEach(line => line.classList.remove('active'));
    }, 600);
}
