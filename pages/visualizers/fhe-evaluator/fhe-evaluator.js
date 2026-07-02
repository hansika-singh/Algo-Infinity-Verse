/**
 * fhe-evaluator.js
 * Implements a Toy Learning With Errors (LWE) lattice cryptography engine.
 * Visualizes the Homomorphic Evaluation of logic gates and the exponential growth of Noise.
 */

document.addEventListener("DOMContentLoaded", () => {
    initFHEVisualizer();
});

// ==========================================
// 1. TOY LWE CRYPTOGRAPHY ENGINE
// ==========================================
class LWEEngine {
    constructor() {
        this.q = 1000000; // Modulus
        this.delta = 500000; // Scaling factor (q / 2)
        this.n = 4; // Dimension of secret vector
        this.sk = null;
    }

    generateKeys() {
        // Secret Key is a random vector in Z_q
        this.sk = Array.from({length: this.n}, () => Math.floor(Math.random() * 100));
        return this.sk;
    }

    // Encrypt a bit (0 or 1)
    // c = (a, b) where b = dot(a, sk) + e + m * Delta
    encrypt(m) {
        if (!this.sk) throw new Error("Generate keys first.");
        const a = Array.from({length: this.n}, () => Math.floor(Math.random() * this.q));
        const e = Math.floor((Math.random() - 0.5) * 20); // Small initial noise
        
        const dot = a.reduce((sum, val, i) => sum + (val * this.sk[i]), 0);
        const b = (dot + e + (m * this.delta)) % this.q;
        
        return { a, b, noise: Math.abs(e), plaintextBit: m }; // plaintext tracked ONLY for UI verification
    }

    // Decrypt a ciphertext
    decrypt(c) {
        if (!this.sk) throw new Error("No secret key found.");
        
        const dot = c.a.reduce((sum, val, i) => sum + (val * this.sk[i]), 0);
        let phase = (c.b - dot) % this.q;
        if (phase < 0) phase += this.q;
        
        // Is phase closer to 0 or Delta?
        const dist0 = Math.min(phase, this.q - phase);
        const dist1 = Math.abs(phase - this.delta);
        
        const decryptedBit = dist1 < dist0 ? 1 : 0;
        
        // If noise exceeds Delta/4, decryption is mathematically corrupted
        const maxNoise = this.delta / 4;
        const isCorrupted = c.noise > maxNoise;

        return { decryptedBit, isCorrupted, currentNoise: c.noise, maxNoise };
    }

    // Homomorphic Addition (XOR for binary)
    // Noise adds linearly: e1 + e2
    add(c1, c2) {
        const a = c1.a.map((v, i) => (v + c2.a[i]) % this.q);
        const b = (c1.b + c2.b) % this.q;
        const noise = c1.noise + c2.noise + 5; // Add a tiny bit of operation noise
        return { a, b, noise, plaintextBit: c1.plaintextBit ^ c2.plaintextBit };
    }

    // Homomorphic Multiplication (AND for binary)
    // Real LWE multiplication requires complex Relinearization & Key Switching.
    // For this visualizer, we mathematically simulate the catastrophic noise multiplication
    // while returning a valid structural ciphertext object.
    multiply(c1, c2) {
        // Mock LWE multiplication vector math to keep it simple for the UI
        const a = c1.a.map((v, i) => (v * c2.a[i]) % this.q);
        const b = (c1.b * c2.b) % this.q;
        
        // THE CATCH: Noise multiplies!
        let noise = (c1.noise * c2.noise) / 5; 
        if (noise < c1.noise) noise = c1.noise * 50; // Force explosion if noise is low
        
        return { a, b, noise, plaintextBit: c1.plaintextBit & c2.plaintextBit };
    }

    // Bootstrapping: Homomorphically decrypt and re-encrypt to reset noise
    bootstrap(c) {
        return { a: c.a, b: c.b, noise: 15, plaintextBit: c.plaintextBit }; // Reset noise to safe level
    }
}

// ==========================================
// 2. STATE & DOM ELEMENTS
// ==========================================
const fhe = new LWEEngine();
let cipherA, cipherB, cipherC, finalCipher;

const els = {
    // Client
    btnKeyGen: document.getElementById('btnKeyGen'),
    skDisplay: document.getElementById('skDisplay'),
    skVal: document.getElementById('skVal'),
    valA: document.getElementById('valA'),
    valB: document.getElementById('valB'),
    valC: document.getElementById('valC'),
    btnEncrypt: document.getElementById('btnEncrypt'),
    cipherLog: document.getElementById('cipherLog'),
    cipherDump: document.getElementById('cipherDump'),
    
    // Cloud
    btnEvaluate: document.getElementById('btnEvaluate'),
    svgLines: document.getElementById('svgLines'),
    nodeA: document.getElementById('node-A'),
    nodeB: document.getElementById('node-B'),
    nodeC: document.getElementById('node-C'),
    gate1: document.getElementById('gate-1'),
    gate2: document.getElementById('gate-2'),
    nodeOut: document.getElementById('node-OUT'),
    opGate1: document.getElementById('opGate1'),
    opGate2: document.getElementById('opGate2'),
    noiseGate1: document.getElementById('noise-gate1'),
    noiseGate2: document.getElementById('noise-gate2'),
    checkBootstrap: document.getElementById('checkBootstrap'),
    
    // Decrypt
    receivedBox: document.getElementById('receivedBox'),
    receivedCipher: document.getElementById('receivedCipher'),
    btnDecrypt: document.getElementById('btnDecrypt'),
    resultsDashboard: document.getElementById('resultsDashboard'),
    verdictCard: document.getElementById('verdictCard'),
    verdictIcon: document.getElementById('verdictIcon'),
    verdictTitle: document.getElementById('verdictTitle'),
    expectedLogic: document.getElementById('expectedLogic'),
    actualResult: document.getElementById('actualResult'),
    finalNoiseText: document.getElementById('finalNoiseText'),
    explanationText: document.getElementById('explanationText')
};

// ==========================================
// 3. INITIALIZATION & EVENTS
// ==========================================
function initFHEVisualizer() {
    els.btnKeyGen.addEventListener('click', generateKeys);
    els.btnEncrypt.addEventListener('click', encryptInputs);
    els.btnEvaluate.addEventListener('click', runCloudEvaluation);
    els.btnDecrypt.addEventListener('click', decryptResult);
    
    window.addEventListener('resize', drawCircuitLines);
    drawCircuitLines();
}

function drawCircuitLines() {
    els.svgLines.innerHTML = '';
    
    // Helper to draw a connecting SVG line
    const drawLine = (el1, el2) => {
        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();
        const arenaRect = els.svgLines.getBoundingClientRect();
        
        const x1 = rect1.right - arenaRect.left;
        const y1 = rect1.top + (rect1.height / 2) - arenaRect.top;
        const x2 = rect2.left - arenaRect.left;
        const y2 = rect2.top + (rect2.height / 2) - arenaRect.top;
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute('class', 'circuit-line');
        
        const offset = Math.abs(x2 - x1) * 0.5;
        path.setAttribute('d', `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`);
        els.svgLines.appendChild(path);
    };

    drawLine(els.nodeA, els.gate1);
    drawLine(els.nodeB, els.gate1);
    drawLine(els.gate1, els.gate2);
    drawLine(els.nodeC, els.gate2);
    drawLine(els.gate2, els.nodeOut);
}

// ==========================================
// 4. CLIENT LOGIC
// ==========================================
function generateKeys() {
    const sk = fhe.generateKeys();
    els.skVal.textContent = `[${sk.join(', ')}]`;
    els.skDisplay.classList.remove('hidden');
    els.btnKeyGen.innerHTML = '<i class="fas fa-check"></i> Keys Generated';
    els.btnKeyGen.classList.replace('btn-outline', 'btn-success');
}

function encryptInputs() {
    if (!fhe.sk) return alert("Please generate a Secret Key first.");

    const bitA = parseInt(els.valA.value);
    const bitB = parseInt(els.valB.value);
    const bitC = parseInt(els.valC.value);

    cipherA = fhe.encrypt(bitA);
    cipherB = fhe.encrypt(bitB);
    cipherC = fhe.encrypt(bitC);

    // Format for log
    const formatC = (c) => `[${c.a[0]}, ${c.a[1]}...] : ${c.b}`;
    
    els.cipherDump.innerHTML = `
        c_A = ${formatC(cipherA)}<br>
        c_B = ${formatC(cipherB)}<br>
        c_C = ${formatC(cipherC)}
    `;
    els.cipherLog.classList.remove('hidden');
    
    // Enable Cloud
    els.btnEvaluate.disabled = false;
    els.btnEncrypt.innerHTML = '<i class="fas fa-check"></i> Sent to Cloud';
    
    // Reset Decrypt Panel
    els.receivedBox.classList.add('hidden');
    els.btnDecrypt.disabled = true;
    els.resultsDashboard.classList.add('hidden');
}

// ==========================================
// 5. CLOUD HOMOMORPHIC EVALUATION
// ==========================================
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runCloudEvaluation() {
    els.btnEvaluate.disabled = true;
    els.btnEvaluate.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Evaluating...';
    
    // Animate Lines
    document.querySelectorAll('.circuit-line').forEach(l => l.classList.add('active'));

    // Gate 1 Evaluation
    els.gate1.classList.add('processing');
    await sleep(800);
    
    const op1 = els.opGate1.value;
    let resGate1 = op1 === 'XOR' ? fhe.add(cipherA, cipherB) : fhe.multiply(cipherA, cipherB);
    
    updateNoiseMeter(els.noiseGate1, resGate1.noise);
    els.gate1.classList.remove('processing');

    // Bootstrap if requested
    if (els.checkBootstrap.checked) {
        await sleep(500);
        resGate1 = fhe.bootstrap(resGate1);
        updateNoiseMeter(els.noiseGate1, resGate1.noise); // Show reduction
    }

    // Gate 2 Evaluation
    els.gate2.classList.add('processing');
    await sleep(800);
    
    const op2 = els.opGate2.value;
    let resGate2 = op2 === 'XOR' ? fhe.add(resGate1, cipherC) : fhe.multiply(resGate1, cipherC);
    
    updateNoiseMeter(els.noiseGate2, resGate2.noise);
    els.gate2.classList.remove('processing');

    // Finish
    await sleep(500);
    document.querySelectorAll('.circuit-line').forEach(l => l.classList.remove('active'));
    els.btnEvaluate.innerHTML = '<i class="fas fa-check"></i> Computation Complete';
    
    finalCipher = resGate2;
    
    // Send to Client
    els.receivedCipher.textContent = `[${finalCipher.a[0]}, ${finalCipher.a[1]}...] : ${finalCipher.b}`;
    els.receivedBox.classList.remove('hidden');
    els.btnDecrypt.disabled = false;
}

function updateNoiseMeter(element, noiseVal) {
    // Max safe noise is delta / 4. Max catastrophic is delta / 2.
    const maxSafe = fhe.delta / 4;
    let percentage = (noiseVal / maxSafe) * 50; // Scale so 50% is max safe
    if (percentage > 100) percentage = 100;
    
    element.style.width = `${percentage}%`;
    
    if (percentage < 30) {
        element.className = 'noise-fill';
        element.style.backgroundColor = 'var(--fhe-primary)';
    } else if (percentage < 70) {
        element.className = 'noise-fill';
        element.style.backgroundColor = 'var(--fhe-warning)';
    } else {
        element.className = 'noise-fill';
        element.style.backgroundColor = 'var(--fhe-danger)';
    }
}

// ==========================================
// 6. CLIENT DECRYPTION
// ==========================================
function decryptResult() {
    els.btnDecrypt.disabled = true;
    const res = fhe.decrypt(finalCipher);
    
    // Calculate expected logic based on user inputs
    const a = parseInt(els.valA.value);
    const b = parseInt(els.valB.value);
    const c = parseInt(els.valC.value);
    
    const op1 = els.opGate1.value;
    const res1 = op1 === 'XOR' ? a ^ b : a & b;
    
    const op2 = els.opGate2.value;
    const expected = op2 === 'XOR' ? res1 ^ c : res1 & c;
    
    // Update UI
    els.expectedLogic.textContent = expected;
    els.actualResult.textContent = res.decryptedBit;
    
    const noisePct = Math.min(100, Math.round((res.currentNoise / res.maxNoise) * 100));
    els.finalNoiseText.textContent = `${noisePct}%`;

    if (res.isCorrupted || res.decryptedBit !== expected) {
        // Failed due to noise
        els.verdictCard.className = 'verdict-card error';
        els.verdictIcon.className = 'fas fa-times-circle';
        els.verdictTitle.textContent = "Decryption Failed (Corrupted)";
        els.actualResult.className = 'text-danger';
        els.explanationText.innerHTML = "The homomorphic multiplications caused the mathematical noise to exceed the bounds of the ciphertext (Delta). The bits overflowed, corrupting the data. <strong>Try running it again with 'Bootstrapping' enabled.</strong>";
        els.finalNoiseText.className = 'text-danger';
    } else {
        // Success
        els.verdictCard.className = 'verdict-card success';
        els.verdictIcon.className = 'fas fa-check-circle';
        els.verdictTitle.textContent = "Decryption Successful";
        els.actualResult.className = 'text-success';
        els.explanationText.innerHTML = "The server successfully evaluated the logic circuit using completely encrypted arrays. You decrypted the final result perfectly using your secret key!";
        els.finalNoiseText.className = 'text-success';
    }

    els.resultsDashboard.classList.remove('hidden');
}
