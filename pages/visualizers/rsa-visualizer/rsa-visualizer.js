/* rsa-visualizer.js */

// --- Math Utilities for RSA (using BigInt) ---

function gcd(a, b) {
    while (b !== 0n) {
        let temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

// Extended Euclidean Algorithm to find modular inverse
function modInverse(e, phi) {
    let m0 = phi;
    let y = 0n, x = 1n;
    let a = e;

    if (phi === 1n) return 0n;

    while (a > 1n) {
        // q is quotient
        let q = a / m0;
        let t = m0;

        // m0 is remainder now, process same as Euclid's algo
        m0 = a % m0;
        a = t;
        t = y;

        // Update x and y
        y = x - q * y;
        x = t;
    }

    // Make x positive
    if (x < 0n) x += phi;

    return x;
}

// Modular exponentiation: (base^exponent) % mod
async function modPowVisualized(base, exponent, modulus, breakdownElement, onStep, speedMs = 100) {
    breakdownElement.innerHTML = '';
    
    if (modulus === 1n) return 0n;
    
    let result = 1n;
    base = base % modulus;
    
    let e = exponent;
    let stepCount = 1;

    while (e > 0n) {
        if (e % 2n === 1n) {
            let oldResult = result;
            result = (result * base) % modulus;
            const msg = `Step ${stepCount}: exponent is odd. result = (${oldResult} × ${base}) mod ${modulus} = <span class="highlight">${result}</span>`;
            
            const div = document.createElement('div');
            div.innerHTML = msg;
            breakdownElement.appendChild(div);
            breakdownElement.scrollTop = breakdownElement.scrollHeight;
            if (onStep) await new Promise(r => setTimeout(r, speedMs));
        }
        
        e = e / 2n;
        if (e > 0n) {
            let oldBase = base;
            base = (base * base) % modulus;
            const msg = `Step ${stepCount}: square base. base = (${oldBase} × ${oldBase}) mod ${modulus} = <span class="highlight">${base}</span>, exponent = ${e}`;
            
            const div = document.createElement('div');
            div.innerHTML = msg;
            breakdownElement.appendChild(div);
            breakdownElement.scrollTop = breakdownElement.scrollHeight;
            if (onStep) await new Promise(r => setTimeout(r, speedMs));
        }
        stepCount++;
    }
    return result;
}

// Simple prime checker for small numbers
function isPrime(num) {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    for (let i = 5; i * i <= num; i += 6) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
    }
    return true;
}

function getRandomPrime(min, max) {
    let p;
    do {
        p = Math.floor(Math.random() * (max - min + 1)) + min;
    } while (!isPrime(p));
    return p;
}


// --- UI Logic ---

let N = 0n, Phi = 0n, E = 0n, D = 0n;
let P_val = 0n, Q_val = 0n;

const dom = {
    primeP: document.getElementById('primeP'),
    primeQ: document.getElementById('primeQ'),
    btnGenPrimes: document.getElementById('btnGeneratePrimes'),
    btnFindE: document.getElementById('btnFindE'),
    btnCalcKeys: document.getElementById('btnCalculateKeys'),
    
    inputE: document.getElementById('inputE'),
    resN: document.getElementById('resN'),
    resPhi: document.getElementById('resPhi'),
    errE: document.getElementById('errE'),
    resD: document.getElementById('resD'),
    
    pubE: document.getElementById('pubE'),
    pubN: document.getElementById('pubN'),
    privD: document.getElementById('privD'),
    privN: document.getElementById('privN'),
    
    msgInput: document.getElementById('msgInput'),
    btnEncrypt: document.getElementById('btnEncrypt'),
    encBreakdown: document.getElementById('encBreakdown'),
    encResult: document.getElementById('encResult'),
    
    cipherInput: document.getElementById('cipherInput'),
    btnDecrypt: document.getElementById('btnDecrypt'),
    decBreakdown: document.getElementById('decBreakdown'),
    decResult: document.getElementById('decResult')
};

function init() {
    dom.btnGenPrimes.addEventListener('click', () => {
        dom.primeP.value = getRandomPrime(10, 100);
        
        let q;
        do {
            q = getRandomPrime(10, 100);
        } while (q === parseInt(dom.primeP.value));
        
        dom.primeQ.value = q;
        resetOutputs();
    });

    dom.btnFindE.addEventListener('click', findValidE);
    dom.btnCalcKeys.addEventListener('click', calculateKeys);
    
    dom.btnEncrypt.addEventListener('click', encryptMessage);
    dom.btnDecrypt.addEventListener('click', decryptMessage);
    
    // Auto-calculate on start
    calculateKeys();
}

function resetOutputs() {
    N = 0n; Phi = 0n; E = 0n; D = 0n;
    dom.resN.textContent = '-';
    dom.resPhi.textContent = '-';
    dom.resD.textContent = '-';
    dom.errE.textContent = '';
    
    dom.pubE.textContent = '-';
    dom.pubN.textContent = '-';
    dom.privD.textContent = '-';
    dom.privN.textContent = '-';
    
    dom.encBreakdown.innerHTML = 'Waiting for input...';
    dom.encResult.textContent = '-';
    dom.decBreakdown.innerHTML = 'Waiting for input...';
    dom.decResult.textContent = '-';
}

function highlightStep(id) {
    document.querySelectorAll('.math-step').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function calculateKeys() {
    resetOutputs();
    
    const p = BigInt(dom.primeP.value);
    const q = BigInt(dom.primeQ.value);
    
    if (p <= 1n || q <= 1n) {
        console.warn("Alert:", "P and Q must be greater than 1.");
        return;
    }
    
    P_val = p;
    Q_val = q;
    
    // Step 1: N
    highlightStep('stepN');
    N = p * q;
    dom.resN.textContent = N.toString();
    
    // Step 2: Phi
    setTimeout(() => {
        highlightStep('stepPhi');
        Phi = (p - 1n) * (q - 1n);
        dom.resPhi.textContent = Phi.toString();
        
        // Check E
        setTimeout(() => {
            highlightStep('stepE');
            validateE();
            
            // Step 4: D
            setTimeout(() => {
                if (E > 0n) {
                    highlightStep('stepD');
                    D = modInverse(E, Phi);
                    dom.resD.textContent = D.toString();
                    
                    updateKeyCards();
                }
            }, 500);
            
        }, 500);
        
    }, 500);
}

function validateE() {
    let eVal;
    try {
        eVal = BigInt(dom.inputE.value);
    } catch {
        dom.errE.textContent = "Invalid E.";
        return;
    }
    
    if (eVal <= 1n || eVal >= Phi) {
        dom.errE.textContent = `E must be between 1 and ${Phi}.`;
        E = 0n;
        return;
    }
    
    if (gcd(eVal, Phi) !== 1n) {
        dom.errE.textContent = `GCD of ${eVal} and ${Phi} is not 1.`;
        E = 0n;
        return;
    }
    
    dom.errE.textContent = "";
    E = eVal;
}

function findValidE() {
    if (Phi <= 1n) return;
    
    // Start searching from 3
    let candidate = 3n;
    while (candidate < Phi) {
        if (gcd(candidate, Phi) === 1n) {
            dom.inputE.value = candidate.toString();
            validateE();
            
            // Auto update D if Phi exists
            if (E > 0n) {
                highlightStep('stepD');
                D = modInverse(E, Phi);
                dom.resD.textContent = D.toString();
                updateKeyCards();
            }
            return;
        }
        candidate += 2n; // Check odd numbers
    }
}

function updateKeyCards() {
    if (E > 0n && N > 0n && D > 0n) {
        dom.pubE.textContent = E.toString();
        dom.pubN.textContent = N.toString();
        
        dom.privD.textContent = D.toString();
        dom.privN.textContent = N.toString();
    }
}

async function encryptMessage() {
    if (E === 0n || N === 0n) {
        console.warn("Alert:", "Please generate valid keys first.");
        return;
    }
    
    let msgStr = dom.msgInput.value;
    if (!msgStr) return;
    
    let m = BigInt(msgStr);
    
    if (m >= N) {
        console.warn("Alert:", `Message M (${m}) must be strictly less than Modulus N (${N}).`);
        return;
    }
    
    dom.btnEncrypt.disabled = true;
    dom.encBreakdown.innerHTML = `<div style="color:var(--text-color);">Starting computation for ${m}<sup>${E}</sup> mod ${N}...</div>`;
    dom.encResult.textContent = '...';
    
    const c = await modPowVisualized(m, E, N, dom.encBreakdown, true, 200);
    
    dom.encResult.textContent = c.toString();
    dom.cipherInput.value = c.toString();
    dom.btnEncrypt.disabled = false;
}

async function decryptMessage() {
    if (D === 0n || N === 0n) {
        console.warn("Alert:", "Please generate valid keys first.");
        return;
    }
    
    let cipherStr = dom.cipherInput.value;
    if (!cipherStr) return;
    
    let c = BigInt(cipherStr);
    
    dom.btnDecrypt.disabled = true;
    dom.decBreakdown.innerHTML = `<div style="color:var(--text-color);">Starting computation for ${c}<sup>${D}</sup> mod ${N}...</div>`;
    dom.decResult.textContent = '...';
    
    const m = await modPowVisualized(c, D, N, dom.decBreakdown, true, 200);
    
    dom.decResult.textContent = m.toString();
    dom.btnDecrypt.disabled = false;
}

document.addEventListener('DOMContentLoaded', init);
