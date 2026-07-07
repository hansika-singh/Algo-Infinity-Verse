/**
 * attention-visualizer.js
 * Implements a mock client-side tensor engine to compute and visualize
 * Transformer Scaled Dot-Product Attention step-by-step.
 */

document.addEventListener("DOMContentLoaded", () => {
    initAttentionVisualizer();
});

// ==========================================
// 1. MATH & TENSOR ENGINE
// ==========================================
class TensorMath {
    // Generate deterministic pseudo-random matrix based on seed string
    static generateEmbedding(token, d_model) {
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
            hash = ((hash << 5) - hash) + token.charCodeAt(i);
            hash |= 0;
        }
        
        const row = [];
        for (let i = 0; i < d_model; i++) {
            // Pseudo-random value between -1.0 and 1.0
            const val = Math.sin(hash + i * 10) * 0.9;
            row.push(val);
        }
        return row;
    }

    static generateWeights(rows, cols, seed) {
        const mat = [];
        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < cols; j++) {
                row.push(Math.cos(seed + i * cols + j) * 0.5);
            }
            mat.push(row);
        }
        return mat;
    }

    static matmul(A, B) {
        const rowsA = A.length, colsA = A[0].length;
        const rowsB = B.length, colsB = B[0].length;
        if (colsA !== rowsB) throw new Error("MatMul Dimension Mismatch");

        const C = Array.from({length: rowsA}, () => Array(colsB).fill(0));
        for (let i = 0; i < rowsA; i++) {
            for (let j = 0; j < colsB; j++) {
                for (let k = 0; k < colsA; k++) {
                    C[i][j] += A[i][k] * B[k][j];
                }
            }
        }
        return C;
    }

    static transpose(A) {
        return A[0].map((_, colIndex) => A.map(row => row[colIndex]));
    }

    static scale(A, factor) {
        return A.map(row => row.map(val => val / factor));
    }

    static softmax(A) {
        return A.map(row => {
            const max = Math.max(...row);
            const exps = row.map(val => Math.exp(val - max));
            const sumExps = exps.reduce((a, b) => a + b, 0);
            return exps.map(val => val / sumExps);
        });
    }
}

// ==========================================
// 2. STATE & CONFIG
// ==========================================
const CONFIG = {
    D_MODEL: 4,
    D_K: 3 // d_k = d_v
};

let state = {
    step: 0,
    tokens: [],
    E: [], // Embeddings
    Wq: [], Wk: [], Wv: [], // Weights
    Q: [], K: [], V: [],    // Projections
    Scores: [], Scaled: [], Attention: [], Output: []
};

const els = {
    seqInput: document.getElementById('seqInput'),
    btnProcess: document.getElementById('btnProcess'),
    btnStepFwd: document.getElementById('btnStepFwd'),
    btnReset: document.getElementById('btnReset'),
    logContainer: document.getElementById('logContainer'),
    stepIndicator: document.getElementById('stepIndicator'),
    engineBadge: document.getElementById('engineBadge'),
    
    // Steps
    stepEmbeddings: document.getElementById('stepEmbeddings'),
    stepQKV: document.getElementById('stepQKV'),
    stepScores: document.getElementById('stepScores'),
    
    // Matrices
    matEmbeddings: document.getElementById('matEmbeddings'),
    matQ: document.getElementById('matQ'),
    matK: document.getElementById('matK'),
    matV: document.getElementById('matV'),
    matQ_mini: document.getElementById('matQ_mini'),
    matK_T: document.getElementById('matK_T'),
    matScores: document.getElementById('matScores'),
    matOutput: document.getElementById('matOutput'),
    
    // Heatmap
    heatmapContainer: document.getElementById('heatmapContainer'),
    heatmapEmpty: document.getElementById('heatmapEmpty'),
    heatmapTooltip: document.getElementById('heatmapTooltip'),
    ttQuery: document.getElementById('ttQuery'),
    ttKey: document.getElementById('ttKey'),
    ttValue: document.getElementById('ttValue')
};

// ==========================================
// 3. INITIALIZATION & EVENTS
// ==========================================
function initAttentionVisualizer() {
    els.btnProcess.addEventListener('click', startProcessing);
    els.btnStepFwd.addEventListener('click', executeStep);
    els.btnReset.addEventListener('click', resetAll);
    
    els.seqInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') startProcessing();
    });

    // Initialize static weights
    state.Wq = TensorMath.generateWeights(CONFIG.D_MODEL, CONFIG.D_K, 1);
    state.Wk = TensorMath.generateWeights(CONFIG.D_MODEL, CONFIG.D_K, 2);
    state.Wv = TensorMath.generateWeights(CONFIG.D_MODEL, CONFIG.D_K, 3);
}

function logMsg(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = `> ${msg}`;
    els.logContainer.appendChild(div);
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

function resetAll() {
    state.step = 0;
    state.tokens = [];
    els.btnStepFwd.disabled = true;
    els.btnProcess.disabled = false;
    
    els.stepIndicator.textContent = "Step 0: Input";
    els.engineBadge.classList.remove('active');
    
    els.stepEmbeddings.classList.add('hidden');
    els.stepQKV.classList.add('hidden');
    els.stepScores.classList.add('hidden');
    
    els.heatmapContainer.innerHTML = '';
    els.heatmapContainer.appendChild(els.heatmapEmpty);
    els.heatmapEmpty.style.display = 'flex';
    
    els.matOutput.innerHTML = '';
    els.logContainer.innerHTML = '<div class="log-entry sys">> System reset. Waiting for input...</div>';
}

function startProcessing() {
    let text = els.seqInput.value.trim();
    if (!text) return void 0;
    
    resetAll();
    
    let words = text.split(/\s+/);
    if (words.length > 6) {
        words = words.slice(0, 6); // Cap at 6 to fit screen
        els.seqInput.value = words.join(" ");
        logMsg("Input truncated to 6 tokens to fit visualization grid.", "sys");
    }
    els.btnProcess.disabled = true;
    els.btnStepFwd.disabled = false;
    
    state.tokens = words;
    els.engineBadge.classList.add('active');
    logMsg(`Tokenized input: [${state.tokens.join(', ')}]`, "info");
    
    executeStep(); // Move to Step 1
}

// ==========================================
// 4. STEP EXECUTION LOGIC
// ==========================================
function executeStep() {
    state.step++;
    els.stepIndicator.textContent = `Step ${state.step}: ${getStepName(state.step)}`;
    
    switch (state.step) {
        case 1:
            computeEmbeddings();
            break;
        case 2:
            computeQKV();
            break;
        case 3:
            computeScores();
            break;
        case 4:
            computeSoftmax();
            break;
        case 5:
            computeOutput();
            els.btnStepFwd.disabled = true;
            els.btnStepFwd.innerHTML = '<i class="fas fa-check"></i> Complete';
            break;
    }
}

function getStepName(step) {
    const names = ["", "Embeddings", "Q, K, V", "Dot Product", "Softmax", "Output"];
    return names[step];
}

// --- Step 1: Embeddings ---
function computeEmbeddings() {
    state.E = state.tokens.map(token => TensorMath.generateEmbedding(token, CONFIG.D_MODEL));
    
    renderMatrix(state.E, els.matEmbeddings, state.tokens);
    els.stepEmbeddings.classList.remove('hidden');
    logMsg(`Generated [${state.tokens.length} x ${CONFIG.D_MODEL}] Embedding Matrix E.`);
}

// --- Step 2: Q, K, V ---
function computeQKV() {
    state.Q = TensorMath.matmul(state.E, state.Wq);
    state.K = TensorMath.matmul(state.E, state.Wk);
    state.V = TensorMath.matmul(state.E, state.Wv);
    
    renderMatrix(state.Q, els.matQ, state.tokens);
    renderMatrix(state.K, els.matK, state.tokens);
    renderMatrix(state.V, els.matV, state.tokens);
    
    els.stepQKV.classList.remove('hidden');
    logMsg(`Computed Q = E × Wq [${state.tokens.length} x ${CONFIG.D_K}]`, "q");
    logMsg(`Computed K = E × Wk [${state.tokens.length} x ${CONFIG.D_K}]`, "k");
    logMsg(`Computed V = E × Wv [${state.tokens.length} x ${CONFIG.D_K}]`, "v");
}

// --- Step 3: Raw Scores ---
function computeScores() {
    const K_T = TensorMath.transpose(state.K);
    state.Scores = TensorMath.matmul(state.Q, K_T);
    
    // Scale it
    const sqrt_dk = Math.sqrt(CONFIG.D_K);
    state.Scaled = TensorMath.scale(state.Scores, sqrt_dk);
    
    // Mini visual representations
    renderMatrix(state.Q, els.matQ_mini, null, true);
    renderMatrix(K_T, els.matK_T, null, true);
    
    // Render Scaled Scores
    renderMatrix(state.Scaled, els.matScores, state.tokens);
    
    els.stepScores.classList.remove('hidden');
    logMsg(`Computed Raw Scores = Q × K^T`, "info");
    logMsg(`Scaled Scores by 1/√${CONFIG.D_K} (${(1/sqrt_dk).toFixed(2)})`);
}

// --- Step 4: Softmax & Heatmap ---
function computeSoftmax() {
    state.Attention = TensorMath.softmax(state.Scaled);
    
    els.heatmapEmpty.style.display = 'none';
    renderHeatmap(state.Attention, state.tokens, els.heatmapContainer);
    
    logMsg(`Applied Softmax row-wise. Each row now sums to 1.0`, "sys");
}

// --- Step 5: Final Output ---
function computeOutput() {
    state.Output = TensorMath.matmul(state.Attention, state.V);
    
    renderMatrix(state.Output, els.matOutput, state.tokens);
    logMsg(`Computed Final Output = Attention × V`, "v");
    logMsg(`Sequence contextualization complete.`, "sys");
}

// ==========================================
// 5. DOM RENDERING UTILITIES
// ==========================================
function renderMatrix(matrix, container, rowLabels = null, isMini = false) {
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'matrix-grid';
    grid.style.gridTemplateColumns = rowLabels ? `auto repeat(${matrix[0].length}, 1fr)` : `repeat(${matrix[0].length}, 1fr)`;
    
    matrix.forEach((row, i) => {
        if (rowLabels) {
            const label = document.createElement('div');
            label.className = 'matrix-row-label';
            label.textContent = rowLabels[i];
            grid.appendChild(label);
        }
        
        row.forEach(val => {
            const cell = document.createElement('div');
            cell.className = 'matrix-cell';
            // Determine precision based on size
            const precision = isMini ? 1 : 2;
            cell.textContent = val.toFixed(precision);
            grid.appendChild(cell);
        });
    });
    
    container.appendChild(grid);
}

function renderHeatmap(attentionMatrix, tokens, container) {
    container.innerHTML = '';
    const n = tokens.length;
    
    const grid = document.createElement('div');
    grid.className = 'heatmap-grid';
    grid.style.gridTemplateColumns = `auto repeat(${n}, 1fr)`;
    
    // Top Row (Empty corner + X labels)
    grid.appendChild(document.createElement('div')); // Corner
    tokens.forEach(tok => {
        const label = document.createElement('div');
        label.className = 'hm-label-x';
        label.textContent = tok;
        grid.appendChild(label);
    });
    
    // Heatmap Rows
    attentionMatrix.forEach((row, i) => {
        // Y Label
        const labelY = document.createElement('div');
        labelY.className = 'hm-label-y';
        labelY.textContent = tokens[i];
        grid.appendChild(labelY);
        
        row.forEach((val, j) => {
            const cell = document.createElement('div');
            cell.className = 'hm-cell';
            
            // Map value (0.0 to 1.0) to a heatmap color (Black to Orange/Yellow)
            // Softmax ranges from 0 to 1.
            const intensity = Math.floor(val * 255);
            // Fire scale: r=intensity, g=intensity/2, b=0
            cell.style.backgroundColor = `rgb(${intensity}, ${Math.floor(intensity * 0.4)}, 0)`;
            
            // Text color logic (dark text for bright background)
            if (val > 0.6) cell.style.color = '#000';
            
            cell.textContent = val.toFixed(2);
            
            // Interaction
            cell.addEventListener('mouseenter', () => showHeatmapTooltip(tokens[i], tokens[j], val));
            cell.addEventListener('mouseleave', hideHeatmapTooltip);
            
            grid.appendChild(cell);
        });
    });
    
    container.appendChild(grid);
}

function showHeatmapTooltip(queryToken, keyToken, value) {
    els.ttQuery.textContent = queryToken;
    els.ttKey.textContent = keyToken;
    els.ttValue.textContent = value.toFixed(3);
    els.heatmapTooltip.classList.remove('hidden');
}

function hideHeatmapTooltip() {
    els.heatmapTooltip.classList.add('hidden');
}
