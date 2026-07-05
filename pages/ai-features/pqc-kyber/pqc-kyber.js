/**
 * pqc-kyber.js
 * Implements a visually simplified Toy Module-LWE based Key Encapsulation Mechanism.
 * Simulates CRYSTALS-Kyber operations: Matrix/Polynomial arithmetic over finite rings,
 * error injection, and noise-filtering decapsulation.
 */

document.addEventListener("DOMContentLoaded", () => {
    initKyberSimulator();
});

// ==========================================
// 1. CRYPTO MATH CONSTANTS & CLASSES
// ==========================================

const Q = 3329; // Standard Kyber modulus
const N = 16;   // Degree of polynomials (Simplified from 256 for 4x4 visual grids)
const K = 2;    // Rank of module (2x2 Matrix A, 2x1 Vectors)
const HALF_Q = Math.floor(Q / 2); // 1664

// Modulo helper (handles negative numbers correctly in JS)
const modQ = (val) => ((val % Q) + Q) % Q;

class Polynomial {
    constructor(coeffs = null) {
        this.coeffs = coeffs ? [...coeffs] : new Array(N).fill(0);
    }

    add(other) {
        const res = new Array(N);
        for (let i = 0; i < N; i++) {
            res[i] = modQ(this.coeffs[i] + other.coeffs[i]);
        }
        return new Polynomial(res);
    }

    sub(other) {
        const res = new Array(N);
        for (let i = 0; i < N; i++) {
            res[i] = modQ(this.coeffs[i] - other.coeffs[i]);
        }
        return new Polynomial(res);
    }

    // Multiplication in the ring Z_q[X]/(X^N + 1)
    // O(N^2) anti-cyclic convolution (Sufficient for N=16, avoids complex NTT for UI)
    mul(other) {
        const res = new Array(N).fill(0);
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                let idx = i + j;
                let sign = 1;
                if (idx >= N) {
                    idx -= N;
                    sign = -1; // X^N = -1
                }
                res[idx] = modQ(res[idx] + sign * this.coeffs[i] * other.coeffs[j]);
            }
        }
        return new Polynomial(res);
    }
}

class PolyVector {
    constructor(k) {
        this.polys = Array.from({ length: k }, () => new Polynomial());
    }

    add(other) {
        const res = new PolyVector(this.polys.length);
        for (let i = 0; i < this.polys.length; i++) res.polys[i] = this.polys[i].add(other.polys[i]);
        return res;
    }

    // Dot product
    dot(other) {
        let res = new Polynomial();
        for (let i = 0; i < this.polys.length; i++) {
            res = res.add(this.polys[i].mul(other.polys[i]));
        }
        return res;
    }
}

class PolyMatrix {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.mat = Array.from({ length: rows }, () => new PolyVector(cols));
    }

    // Mat * Vec
    mulVector(vec) {
        const res = new PolyVector(this.rows);
        for (let i = 0; i < this.rows; i++) {
            res.polys[i] = this.mat[i].dot(vec);
        }
        return res;
    }

    // Transpose
    transpose() {
        const res = new PolyMatrix(this.cols, this.rows);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                res.mat[j].polys[i] = this.mat[i].polys[j];
            }
        }
        return res;
    }
}

// Generators
function genUniformPoly() {
    return new Polynomial(Array.from({ length: N }, () => Math.floor(Math.random() * Q)));
}

// Small CBD (Centered Binomial Distribution) approx for secrets/errors [-2, 2]
function genSmallPoly() {
    const getSmall = () => {
        let a = (Math.random() > 0.5 ? 1 : 0) + (Math.random() > 0.5 ? 1 : 0);
        let b = (Math.random() > 0.5 ? 1 : 0) + (Math.random() > 0.5 ? 1 : 0);
        return modQ(a - b);
    };
    return new Polynomial(Array.from({ length: N }, getSmall));
}

function genUniformMatrix(k) {
    const m = new PolyMatrix(k, k);
    for (let i = 0; i < k; i++) {
        for (let j = 0; j < k; j++) m.mat[i].polys[j] = genUniformPoly();
    }
    return m;
}

function genSmallVector(k) {
    const v = new PolyVector(k);
    for (let i = 0; i < k; i++) v.polys[i] = genSmallPoly();
    return v;
}

// Message Encoding
function genRandomMessage() {
    return Array.from({ length: N }, () => (Math.random() > 0.5 ? 1 : 0));
}

function encodeMessage(msgBits) {
    const coeffs = msgBits.map(bit => bit === 1 ? HALF_Q : 0);
    return new Polynomial(coeffs);
}

function decodeMessage(poly) {
    return poly.coeffs.map(coeff => {
        // Is it closer to 0 or Q/2?
        const dist0 = Math.min(coeff, Q - coeff);
        const dist1 = Math.abs(coeff - HALF_Q);
        return dist1 < dist0 ? 1 : 0;
    });
}

// ==========================================
// 2. APP STATE & UI CONTROLLERS
// ==========================================

const state = {
    // Alice Keys
    A: null, s: null, e: null, t: null,
    // Bob Encaps
    m: null, mPoly: null, r: null, e1: null, e2: null, u: null, v: null,
    // Alice Decaps
    mNoisy: null, mDecoded: null
};

const els = {
    btnAliceKeyGen: document.getElementById('btnAliceKeyGen'),
    btnBobEncaps: document.getElementById('btnBobEncaps'),
    btnAliceDecaps: document.getElementById('btnAliceDecaps'),
    
    aliceStatus: document.getElementById('aliceStatus'),
    bobStatus: document.getElementById('bobStatus'),
    
    aliceKeyGen: document.getElementById('aliceKeyGen'),
    aliceDecaps: document.getElementById('aliceDecaps'),
    bobEncaps: document.getElementById('bobEncaps'),
    bobWaiting: document.getElementById('bobWaiting'),
    
    pubKeySection: document.getElementById('pubKeySection'),
    cipherSection: document.getElementById('cipherSection'),
    publicOverlay: document.getElementById('publicOverlay'),
    
    polyTooltip: document.getElementById('polyTooltip'),
    ttVal: document.getElementById('ttVal')
};

function initKyberSimulator() {
    els.btnAliceKeyGen.addEventListener('click', runAliceKeyGen);
    els.btnBobEncaps.addEventListener('click', runBobEncaps);
    els.btnAliceDecaps.addEventListener('click', runAliceDecaps);
    
    // Setup generic mouse events for tooltips
    document.addEventListener('mousemove', handleTooltip);
}

// ==========================================
// 3. EXECUTION PHASES
// ==========================================

async function runAliceKeyGen() {
    els.btnAliceKeyGen.disabled = true;
    els.btnAliceKeyGen.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Computing MLWE...';
    
    await new Promise(r => setTimeout(r, 500)); // Visual delay

    // Math
    state.A = genUniformMatrix(K);
    state.s = genSmallVector(K);
    state.e = genSmallVector(K);
    // t = A * s + e
    const As = state.A.mulVector(state.s);
    state.t = As.add(state.e);

    // Render Alice UI
    renderVector(state.s, 'grid-s', 'secret');
    renderVector(state.e, 'grid-e', 'error');
    
    // Render Public UI
    renderMatrix(state.A, 'grid-A', 'public');
    renderVector(state.t, 'grid-t', 'public');
    
    els.publicOverlay.classList.add('hidden');
    
    // Enable Bob
    els.bobWaiting.classList.add('hidden');
    els.bobEncaps.classList.remove('hidden');
    els.aliceStatus.textContent = "Waiting";
    els.aliceStatus.classList.add('disabled');
    els.bobStatus.textContent = "Step 2: Encapsulate";
    els.bobStatus.classList.remove('disabled');

    // Generate Bob's message immediately for UI flow
    state.m = genRandomMessage();
    state.mPoly = encodeMessage(state.m);
    renderBinary(state.m, 'bobBinary');
    renderPoly(state.mPoly, 'grid-encode-m', 'secret');

    els.btnAliceKeyGen.style.display = 'none';
}

async function runBobEncaps() {
    els.btnBobEncaps.disabled = true;
    els.btnBobEncaps.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Encapsulating...';
    
    await new Promise(r => setTimeout(r, 500));

    // Math
    state.r = genSmallVector(K);
    state.e1 = genSmallVector(K);
    // e2 is a scalar polynomial here (since output v is scalar)
    state.e2 = genSmallPoly(); 
    
    // u = A^T * r + e1
    const At = state.A.transpose();
    const Atr = At.mulVector(state.r);
    state.u = Atr.add(state.e1);

    // v = t^T * r + e2 + Encode(m)
    const tTr = state.t.dot(state.r);
    state.v = tTr.add(state.e2).add(state.mPoly);

    // Render Bob UI
    renderVector(state.r, 'grid-r', 'secret');
    renderVector(state.e1, 'grid-e1', 'error');
    renderPoly(state.e2, 'grid-e2', 'error');

    // Render Public UI
    els.cipherSection.classList.remove('hidden');
    renderVector(state.u, 'grid-u', 'public');
    renderPoly(state.v, 'grid-v', 'public');

    // Enable Alice Decaps
    els.aliceKeyGen.classList.add('hidden');
    els.aliceDecaps.classList.remove('hidden');
    els.bobStatus.textContent = "Complete";
    els.bobStatus.classList.add('disabled');
    els.aliceStatus.textContent = "Step 3: Decapsulate";
    els.aliceStatus.classList.remove('disabled');

    els.btnBobEncaps.style.display = 'none';
}

async function runAliceDecaps() {
    els.btnAliceDecaps.disabled = true;
    els.btnAliceDecaps.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Decapsulating...';
    
    await new Promise(r => setTimeout(r, 500));

    // Math
    // m' = v - s^T * u
    const sTu = state.s.dot(state.u);
    state.mNoisy = state.v.sub(sTu);
    
    state.mDecoded = decodeMessage(state.mNoisy);

    // Render Alice UI
    renderPoly(state.mNoisy, 'grid-noisy-m', 'public');
    renderBinary(state.mDecoded, 'aliceBinary');
    
    document.getElementById('aliceFinalSecret').classList.remove('hidden');
    els.aliceStatus.textContent = "Success";
    els.aliceStatus.style.background = "rgba(16, 185, 129, 0.2)";
    els.aliceStatus.style.color = "var(--pqc-success)";
    els.aliceStatus.style.borderColor = "var(--pqc-success)";
    
    els.btnAliceDecaps.style.display = 'none';
}

// ==========================================
// 4. RENDERING UTILITIES
// ==========================================

function getColorForValue(val, type) {
    // Map val to opacity. For Q=3329, values near 0 or 3329 are "low", values near 1664 are "high"
    let intensity = 0;
    
    if (type === 'error' || type === 'secret') {
        // Small values (-2 to 2 mapped to Q space)
        // 0 -> 0 opacity, >0 -> higher
        let norm = val > HALF_Q ? Q - val : val; 
        intensity = Math.min(1.0, 0.2 + (norm * 0.2)); 
        
        if (type === 'secret') return `rgba(239, 68, 68, ${intensity})`; // Red
        return `rgba(245, 158, 11, ${intensity})`; // Amber
    } 
    else {
        // Public uniform values (0 to 3329)
        intensity = val / Q;
        return `rgba(6, 182, 212, ${intensity})`; // Cyan
    }
}

function createPolyGrid(poly, type) {
    const grid = document.createElement('div');
    grid.className = 'poly-grid';
    
    poly.coeffs.forEach(val => {
        const cell = document.createElement('div');
        cell.className = 'poly-cell';
        cell.style.backgroundColor = getColorForValue(val, type);
        cell.dataset.val = val; // Store for tooltip
        grid.appendChild(cell);
    });
    
    return grid;
}

function renderPoly(poly, containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(createPolyGrid(poly, type));
}

function renderVector(vec, containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    vec.polys.forEach(p => {
        container.appendChild(createPolyGrid(p, type));
    });
}

function renderMatrix(mat, containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    // Matrix A is KxK. Flatten for CSS grid
    for (let r = 0; r < mat.rows; r++) {
        for (let c = 0; c < mat.cols; c++) {
            container.appendChild(createPolyGrid(mat.mat[r].polys[c], type));
        }
    }
}

function renderBinary(bits, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    bits.forEach(b => {
        const span = document.createElement('span');
        span.className = `bit-${b}`;
        span.textContent = b;
        container.appendChild(span);
    });
}

// Tooltip Interaction
function handleTooltip(e) {
    if (e.target.classList.contains('poly-cell')) {
        els.ttVal.textContent = e.target.dataset.val;
        els.polyTooltip.style.left = `${e.pageX}px`;
        els.polyTooltip.style.top = `${e.pageY - 10}px`;
        els.polyTooltip.classList.remove('hidden');
    } else {
        els.polyTooltip.classList.add('hidden');
    }
}
