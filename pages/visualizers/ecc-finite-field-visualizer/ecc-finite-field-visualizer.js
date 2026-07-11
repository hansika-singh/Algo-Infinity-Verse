/**
 * Algo-Infinity-Verse | ECC Finite Field Visualizer
 * Mathematically rigorously calculates and animates Point Addition over a Galois Field (modulo prime p).
 */

class ECCVisualizer {
    constructor() {
        // UI Inputs
        this.inputA = document.getElementById('input-a');
        this.inputB = document.getElementById('input-b');
        this.inputP = document.getElementById('input-p');
        this.btnUpdate = document.getElementById('btn-update-curve');
        this.curveStatus = document.getElementById('curve-status');
        
        this.selectP = document.getElementById('select-p');
        this.selectQ = document.getElementById('select-q');
        
        this.btnPlay = document.getElementById('btn-play');
        this.btnStep = document.getElementById('btn-step');
        this.btnReset = document.getElementById('btn-reset');
        
        this.statusText = document.getElementById('status-text');
        this.mathStream = document.getElementById('math-stream');
        
        this.valP = document.getElementById('val-p');
        this.valQ = document.getElementById('val-q');
        this.valR = document.getElementById('val-r');

        // Canvas setup
        this.canvas = document.getElementById('ecc-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Curve State
        this.a = 2;
        this.b = 2;
        this.p = 17;
        this.validPoints = [];
        
        // Operation State
        this.ptP = null;
        this.ptQ = null;
        this.ptR = null;
        this.ptNegR = null;
        this.slopeM = null;
        
        // Generator & Rendering State
        this.generator = null;
        this.isPlaying = false;
        this.animationPhase = 'IDLE'; // IDLE, DRAW_LINE, REFLECT, DONE
        this.animFrame = null;
        this.lineProgress = 0; // 0 to 1 for drawing line

        this.init();
    }

    init() {
        this.bindEvents();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.updateCurveParameters();
    }

    bindEvents() {
        this.btnUpdate.addEventListener('click', () => this.updateCurveParameters());
        
        this.selectP.addEventListener('change', () => this.updateSelectedPoints());
        this.selectQ.addEventListener('change', () => this.updateSelectedPoints());
        
        this.btnPlay.addEventListener('click', () => {
            if (this.isPlaying) this.pauseAutoPlay();
            else this.startAutoPlay();
        });
        
        this.btnStep.addEventListener('click', () => {
            this.pauseAutoPlay();
            this.stepForward();
        });
        
        this.btnReset.addEventListener('click', () => {
            this.pauseAutoPlay();
            this.resetAnimation();
        });
    }

    resizeCanvas() {
        const wrapper = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = wrapper.clientWidth * dpr;
        this.canvas.height = wrapper.clientHeight * dpr;
        this.ctx.scale(dpr, dpr);
        this.renderCanvas(); // Redraw immediately
    }

    /* --- Core ECC Mathematics --- */
    
    // True mathematical modulo (handles negatives)
    mod(n, m) {
        return ((n % m) + m) % m;
    }

    // Extended Euclidean Algorithm for Modular Inverse
    modInverse(a, m) {
        let [m0, x0, x1] = [m, 0, 1];
        if (m === 1) return 0;
        a = this.mod(a, m);
        while (a > 1) {
            if (m === 0) return null; // No inverse
            let q = Math.floor(a / m);
            [m, a] = [a % m, m];
            [x0, x1] = [x1 - q * x0, x0];
        }
        return x1 < 0 ? x1 + m0 : x1;
    }

    updateCurveParameters() {
        this.a = parseInt(this.inputA.value);
        this.b = parseInt(this.inputB.value);
        this.p = parseInt(this.inputP.value);
        
        this.statusText.textContent = `y² ≡ x³ + ${this.a}x + ${this.b} (mod ${this.p})`;

        // Verify non-singular curve: 4a^3 + 27b^2 != 0 (mod p)
        let det = this.mod(4 * Math.pow(this.a, 3) + 27 * Math.pow(this.b, 2), this.p);
        if (det === 0) {
            this.curveStatus.textContent = "Singular Curve (Invalid)";
            this.curveStatus.className = "status-text mt-2 text-error";
            this.validPoints = [];
            this.populateSelects();
            return;
        }
        this.curveStatus.textContent = "Curve is Valid";
        this.curveStatus.className = "status-text mt-2 text-success";

        // Brute force all valid points for visualizer
        this.validPoints = [];
        for (let x = 0; x < this.p; x++) {
            let rhs = this.mod(Math.pow(x, 3) + this.a * x + this.b, this.p);
            for (let y = 0; y < this.p; y++) {
                let lhs = this.mod(y * y, this.p);
                if (lhs === rhs) {
                    this.validPoints.push({ x, y });
                }
            }
        }

        this.populateSelects();
        this.resetAnimation();
    }

    populateSelects() {
        this.selectP.innerHTML = '';
        this.selectQ.innerHTML = '';
        
        if (this.validPoints.length === 0) {
            this.selectP.innerHTML = '<option>None</option>';
            this.selectQ.innerHTML = '<option>None</option>';
            return;
        }

        this.validPoints.forEach((pt, i) => {
            let str = `(${pt.x}, ${pt.y})`;
            this.selectP.add(new Option(str, i));
            // Select a different point for Q by default if possible
            this.selectQ.add(new Option(str, i, false, i === Math.min(1, this.validPoints.length-1)));
        });
        
        this.updateSelectedPoints();
    }

    updateSelectedPoints() {
        if (this.validPoints.length === 0) return;
        
        this.ptP = this.validPoints[this.selectP.value];
        this.ptQ = this.validPoints[this.selectQ.value];
        
        this.valP.textContent = `(${this.ptP.x}, ${this.ptP.y})`;
        this.valQ.textContent = `(${this.ptQ.x}, ${this.ptQ.y})`;
        
        this.resetAnimation();
    }

    resetAnimation() {
        this.ptR = null;
        this.ptNegR = null;
        this.slopeM = null;
        this.animationPhase = 'IDLE';
        this.lineProgress = 0;
        this.valR.textContent = 'null';
        this.mathStream.innerHTML = '<div class="empty-stream">Press Animate to view point addition steps...</div>';
        
        this.generator = this.eccAdditionGenerator();
        this.btnStep.disabled = false;
        this.btnPlay.disabled = false;
        
        this.renderCanvas();
    }

    /* --- Generator for Animation Steps --- */

    *eccAdditionGenerator() {
        this.mathStream.innerHTML = ''; // Clear stream
        this.logMath(`Start addition: P(${this.ptP.x}, ${this.ptP.y}) + Q(${this.ptQ.x}, ${this.ptQ.y})`);

        // Check for Point at Infinity (P = -Q)
        if (this.ptP.x === this.ptQ.x && this.ptP.y === this.mod(-this.ptQ.y, this.p)) {
            this.valR.textContent = 'O (Infinity)';
            this.logMath(`P and Q are inverses. Result is Point at Infinity O.`, 'hl-emerald');
            this.animationPhase = 'DONE';
            this.renderCanvas();
            return;
        }

        // Calculate Slope (m)
        let num, den;
        if (this.ptP.x === this.ptQ.x && this.ptP.y === this.ptQ.y) {
            // Point Doubling
            this.logMath(`P = Q. Calculating Tangent Line (Point Doubling).`);
            num = this.mod(3 * Math.pow(this.ptP.x, 2) + this.a, this.p);
            den = this.mod(2 * this.ptP.y, this.p);
            this.logMath(`m = (3x₁² + a) / (2y₁) mod p`);
        } else {
            // Point Addition
            this.logMath(`P ≠ Q. Calculating Secant Line (Point Addition).`);
            num = this.mod(this.ptQ.y - this.ptP.y, this.p);
            den = this.mod(this.ptQ.x - this.ptP.x, this.p);
            this.logMath(`m = (y₂ - y₁) / (x₂ - x₁) mod p`);
        }

        let invDen = this.modInverse(den, this.p);
        this.slopeM = this.mod(num * invDen, this.p);
        
        this.logMath(`Numerator: ${num}, Denominator: ${den}`);
        this.logMath(`Modular Inverse of ${den} mod ${this.p} is ${invDen}`, 'hl-cyan');
        this.logMath(`Slope (m) = ${num} * ${invDen} ≡ ${this.slopeM} (mod ${this.p})`);

        yield; // Pause

        // Calculate Intersection -R
        let rx = this.mod(Math.pow(this.slopeM, 2) - this.ptP.x - this.ptQ.x, this.p);
        let ry = this.mod(this.slopeM * (this.ptP.x - rx) - this.ptP.y, this.p);
        this.ptNegR = { x: rx, y: this.mod(-ry, this.p) }; // Internal math gives -R directly, but we need standard coordinates for rendering line intersection.
        
        // Wait, standard line eq: y - y1 = m(x - x1)
        let negRy = this.mod(this.slopeM * (rx - this.ptP.x) + this.ptP.y, this.p);
        this.ptNegR = { x: rx, y: negRy };
        
        this.animationPhase = 'DRAW_LINE';
        
        // Animate line drawing
        for(let i=0; i<=20; i++) {
            this.lineProgress = i / 20;
            this.renderCanvas();
            yield; 
        }

        this.logMath(`Line intersects curve at -R(x₃, -y₃)`);
        this.logMath(`x₃ = m² - x₁ - x₂ ≡ ${rx} (mod ${this.p})`);
        this.logMath(`Intersection -R found at (${rx}, ${negRy})`);
        
        yield; // Pause at intersection

        // Reflect to R
        this.ptR = { x: rx, y: this.mod(-negRy, this.p) };
        this.valR.textContent = `(${this.ptR.x}, ${this.ptR.y})`;
        
        this.animationPhase = 'REFLECT';
        this.renderCanvas();
        this.logMath(`Reflect across x-axis: y₃ = -(-y₃) mod p`);
        
        yield;

        this.animationPhase = 'DONE';
        this.renderCanvas();
        this.logMath(`Result R = (${this.ptR.x}, ${this.ptR.y})`, 'hl-emerald');
    }

    logMath(text, className = '') {
        const div = document.createElement('div');
        div.className = `math-line ${className}`;
        div.textContent = text;
        this.mathStream.appendChild(div);
        this.mathStream.scrollTop = this.mathStream.scrollHeight;
    }

    /* --- Frame Applier --- */
    
    stepForward() {
        if (!this.generator) return;
        const { done } = this.generator.next();
        if (done) {
            this.pauseAutoPlay();
            this.btnStep.disabled = true;
            this.btnPlay.disabled = true;
        }
    }

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
            // Dynamic speed: Faster during line drawing phase
            let delay = this.animationPhase === 'DRAW_LINE' ? 40 : 1000;
            setTimeout(tick, delay / this.animSpeed);
        };
        tick();
    }

    pauseAutoPlay() {
        this.isPlaying = false;
        clearTimeout(this.autoPlayTimeout);
        this.btnPlay.innerHTML = '<i class="fa-solid fa-play"></i> Animate';
        this.btnPlay.classList.replace('btn-accent', 'btn-primary');
    }

    /* --- Canvas Rendering Engine --- */

    renderCanvas() {
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);
        
        this.ctx.clearRect(0, 0, w, h);

        const padding = 40;
        const gridW = w - padding * 2;
        const gridH = h - padding * 2;
        
        // Coordinate mapping functions
        // Math coordinates: (0,0) bottom-left, (p, p) top-right
        const getX = (mathX) => padding + (mathX / (this.p - 1 || 1)) * gridW;
        const getY = (mathY) => padding + gridH - (mathY / (this.p - 1 || 1)) * gridH;

        // 1. Draw Grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let i = 0; i < this.p; i++) {
            let x = getX(i);
            let y = getY(i);
            this.ctx.moveTo(x, padding); this.ctx.lineTo(x, h - padding);
            this.ctx.moveTo(padding, y); this.ctx.lineTo(w - padding, y);
        }
        this.ctx.stroke();

        // Axes labels
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '10px "Fira Code"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("0", getX(0), h - padding + 15);
        this.ctx.fillText((this.p-1).toString(), getX(this.p-1), h - padding + 15);
        this.ctx.textAlign = 'right';
        this.ctx.fillText((this.p-1).toString(), padding - 10, getY(this.p-1) + 4);

        // 2. Draw Wrapping Line (if active)
        if (this.animationPhase === 'DRAW_LINE' || this.animationPhase === 'REFLECT' || this.animationPhase === 'DONE') {
            this.ctx.save();
            this.ctx.rect(padding, padding, gridW, gridH);
            this.ctx.clip(); // Restrict line to bounding box

            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 2;
            
            // To simulate "wrapping", we draw multiple continuous line segments shifted by p
            // Equation: y = m(x - P.x) + P.y + k*p
            for (let k = -this.p; k <= this.p; k++) {
                this.ctx.beginPath();
                // Draw from x=0 to x=p
                let yStart = this.slopeM * (0 - this.ptP.x) + this.ptP.y + k * this.p;
                let yEnd = this.slopeM * (this.p - this.ptP.x) + this.ptP.y + k * this.p;
                
                // Apply animation progress
                let currentX = this.p * this.lineProgress;
                let currentY = this.slopeM * (currentX - this.ptP.x) + this.ptP.y + k * this.p;

                this.ctx.moveTo(getX(0), getY(yStart));
                this.ctx.lineTo(getX(currentX), getY(currentY));
                this.ctx.stroke();
            }
            this.ctx.restore();
        }

        // 3. Draw Reflection Line
        if (this.animationPhase === 'REFLECT' || this.animationPhase === 'DONE') {
            this.ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)'; // Orange dashed
            this.ctx.setLineDash([5, 5]);
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(getX(this.ptNegR.x), getY(this.ptNegR.y));
            this.ctx.lineTo(getX(this.ptR.x), getY(this.ptR.y));
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // 4. Draw All Valid Points
        this.ctx.fillStyle = '#475569';
        this.validPoints.forEach(pt => {
            this.ctx.beginPath();
            this.ctx.arc(getX(pt.x), getY(pt.y), 4, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 5. Draw Highlighted Points
        const drawPoint = (pt, color, label, size = 7) => {
            if (!pt) return;
            const px = getX(pt.x); const py = getY(pt.y);
            this.ctx.beginPath();
            this.ctx.arc(px, py, size, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px "Inter"';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(label, px + 10, py - 10);
        };

        if (this.ptP) drawPoint(this.ptP, '#06b6d4', 'P'); // Cyan
        
        // If point doubling, shift label slightly to avoid overlap
        if (this.ptQ) {
            if (this.ptP.x === this.ptQ.x && this.ptP.y === this.ptQ.y) {
                drawPoint(this.ptQ, '#7c3aed', 'P=Q', 9);
            } else {
                drawPoint(this.ptQ, '#7c3aed', 'Q');
            }
        }

        if (this.ptNegR && (this.animationPhase === 'REFLECT' || this.animationPhase === 'DONE')) {
            drawPoint(this.ptNegR, '#f97316', '-R'); // Orange
        }

        if (this.ptR && this.animationPhase === 'DONE') {
            drawPoint(this.ptR, '#10b981', 'R', 9); // Emerald
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ECCVisualizer();
});
