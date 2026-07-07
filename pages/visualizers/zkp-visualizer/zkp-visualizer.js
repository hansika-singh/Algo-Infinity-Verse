/**
 * zkp-visualizer.js
 * Educational Simulation of a Zero-Knowledge Proof constraint system.
 * Converts the circuit f(x, y) = x * y + 2 into Rank-1 Constraint System (R1CS) matrices,
 * generates a witness vector based on a finite prime field, and mathematically verifies it.
 */

document.addEventListener("DOMContentLoaded", () => {
    initZKPVisualizer();
});

// ==========================================
// 1. ZKP MATHEMATICS & STATE
// ==========================================
const PRIME = 97; // Finite field modulo

// Modular Arithmetic Helpers
const mod = (n, p = PRIME) => ((n % p) + p) % p;
const addMod = (a, b) => mod(a + b);
const mulMod = (a, b) => mod(a * b);

// R1CS Matrices for the equation: out = x * y + 2
// Gates:
// 1. v1 = x * y
// 2. out = v1 + 2 * 1
// Witness vector s = [~one, ~out, x, y, v1]
const A = [
    [0, 0, 1, 0, 0], // x
    [2, 0, 0, 0, 1]  // 2*1 + v1
];
const B = [
    [0, 0, 0, 1, 0], // y
    [1, 0, 0, 0, 0]  // 1
];
const C = [
    [0, 0, 0, 0, 1], // v1
    [0, 1, 0, 0, 0]  // out
];

let state = {
    x: 3,
    y: 4,
    out: 0,
    witness: [], // s
    isProofGenerated: false
};

// DOM Elements
const els = {
    inputX: document.getElementById('inputX'),
    inputY: document.getElementById('inputY'),
    proverCalculation: document.getElementById('proverCalculation'),
    
    btnGenerateWitness: document.getElementById('btnGenerateWitness'),
    witnessContainer: document.getElementById('witnessContainer'),
    witnessVector: document.getElementById('witnessVector'),
    btnGenerateProof: document.getElementById('btnGenerateProof'),
    
    matrixA: document.getElementById('matrixA'),
    matrixB: document.getElementById('matrixB'),
    matrixC: document.getElementById('matrixC'),
    networkAnim: document.getElementById('networkAnim'),
    
    verifierOutput: document.getElementById('verifierOutput'),
    verifierProofStatus: document.getElementById('verifierProofStatus'),
    btnVerify: document.getElementById('btnVerify'),
    
    verificationResults: document.getElementById('verificationResults'),
    checkGate1: document.getElementById('checkGate1'),
    checkGate2: document.getElementById('checkGate2'),
    finalVerdict: document.getElementById('finalVerdict')
};

// ==========================================
// 2. INITIALIZATION & UI BINDING
// ==========================================
function initZKPVisualizer() {
    renderMatrices();
    updateProverCalculation();
    
    // Bind Inputs
    els.inputX.addEventListener('input', updateProverCalculation);
    els.inputY.addEventListener('input', updateProverCalculation);
    
    // Bind Buttons
    els.btnGenerateWitness.addEventListener('click', handleGenerateWitness);
    els.btnGenerateProof.addEventListener('click', handleGenerateProof);
    els.btnVerify.addEventListener('click', handleVerification);
}

function renderMatrices() {
    renderMatrix(A, els.matrixA);
    renderMatrix(B, els.matrixB);
    renderMatrix(C, els.matrixC);
}

function renderMatrix(matrix, container) {
    container.innerHTML = '';
    matrix.forEach(row => {
        row.forEach(val => {
            const cell = document.createElement('div');
            cell.className = `m-cell ${val > 0 ? 'active val-' + val : ''}`;
            cell.textContent = val;
            container.appendChild(cell);
        });
    });
}

// ==========================================
// 3. THE PROVER (Generating Witness & Proof)
// ==========================================
function updateProverCalculation() {
    const x = parseInt(els.inputX.value) || 0;
    const y = parseInt(els.inputY.value) || 0;
    
    // Reset down-stream UI
    els.witnessContainer.classList.add('hidden');
    els.networkAnim.classList.add('hidden');
    els.verificationResults.classList.add('hidden');
    els.verifierOutput.textContent = '?';
    els.verifierProofStatus.textContent = 'Waiting...';
    els.verifierProofStatus.className = 'text-secondary';
    els.btnVerify.disabled = true;
    state.isProofGenerated = false;

    // Modulo arithmetic
    const v1 = mulMod(x, y);
    const out = addMod(v1, 2);
    
    els.proverCalculation.innerHTML = `
        v1 = (${x} * ${y}) mod 97 = ${v1}<br>
        out = (v1 + 2) mod 97 = ${out}
    `;
    
    state.x = x;
    state.y = y;
    state.out = out;
}

function handleGenerateWitness() {
    const v1 = mulMod(state.x, state.y);
    // Construct Witness Vector s = [1, out, x, y, v1]
    state.witness = [1, state.out, state.x, state.y, v1];
    
    els.witnessVector.innerHTML = '';
    state.witness.forEach(val => {
        const span = document.createElement('span');
        span.className = 'vec-element';
        span.textContent = val;
        els.witnessVector.appendChild(span);
    });
    
    els.witnessContainer.classList.remove('hidden');
}

function handleGenerateProof() {
    // Simulate complex proof generation & network transfer
    els.btnGenerateProof.disabled = true;
    els.btnGenerateProof.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating SNARK...';
    
    setTimeout(() => {
        els.btnGenerateProof.innerHTML = '<i class="fas fa-check"></i> Proof Generated';
        
        // Trigger Animation
        els.networkAnim.classList.remove('hidden');
        
        // Update Verifier after animation completes
        setTimeout(() => {
            state.isProofGenerated = true;
            els.verifierOutput.textContent = state.out;
            els.verifierProofStatus.textContent = 'Proof π Received';
            els.verifierProofStatus.className = 'text-success';
            els.btnVerify.disabled = false;
            
            els.btnGenerateProof.disabled = false;
            els.btnGenerateProof.innerHTML = '<i class="fas fa-magic"></i> Generate Cryptographic Proof';
            els.networkAnim.classList.add('hidden');
        }, 2000);
        
    }, 800);
}

// ==========================================
// 4. THE VERIFIER (Mathematical Checking)
// ==========================================

// Dot product of two vectors modulo P
function dotProductMod(vec1, vec2) {
    let sum = 0;
    for (let i = 0; i < vec1.length; i++) {
        sum = addMod(sum, mulMod(vec1[i], vec2[i]));
    }
    return sum;
}

function handleVerification() {
    if (!state.isProofGenerated) return;
    
    els.btnVerify.disabled = true;
    els.btnVerify.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    els.verificationResults.classList.add('hidden');
    
    setTimeout(() => {
        // Mathematical Verification of R1CS: A.s * B.s == C.s
        const s = state.witness;
        
        // Gate 1 Check
        const a1 = dotProductMod(A[0], s);
        const b1 = dotProductMod(B[0], s);
        const c1 = dotProductMod(C[0], s);
        const isValid1 = mulMod(a1, b1) === c1;
        
        els.checkGate1.innerHTML = `(${a1} * ${b1}) mod 97 == ${c1} <i class="fas ${isValid1 ? 'fa-check valid-math' : 'fa-times invalid-math'}"></i>`;
        
        // Gate 2 Check
        const a2 = dotProductMod(A[1], s);
        const b2 = dotProductMod(B[1], s);
        const c2 = dotProductMod(C[1], s);
        const isValid2 = mulMod(a2, b2) === c2;
        
        els.checkGate2.innerHTML = `(${a2} * ${b2}) mod 97 == ${c2} <i class="fas ${isValid2 ? 'fa-check valid-math' : 'fa-times invalid-math'}"></i>`;

        // Final Verdict
        els.verificationResults.classList.remove('hidden');
        if (isValid1 && isValid2) {
            els.finalVerdict.className = 'verdict-box success';
            els.finalVerdict.innerHTML = '<i class="fas fa-shield-check"></i> PROOF VALID! The prover knows the secret inputs.';
        } else {
            els.finalVerdict.className = 'verdict-box error';
            els.finalVerdict.innerHTML = '<i class="fas fa-ban"></i> PROOF INVALID! The equations do not hold.';
        }
        
        els.btnVerify.disabled = false;
        els.btnVerify.innerHTML = '<i class="fas fa-check-double"></i> Run Verification';
        
    }, 1000);
}
