/**
 * shamir-visualizer.js
 * Visualizes Shamir's Secret Sharing using standard polynomial interpolation.
 * Generates shares, allows interactive selection, and dynamically updates D3 graph
 * using Lagrange Interpolation to prove information-theoretic threshold security.
 */

document.addEventListener("DOMContentLoaded", () => {
    initShamirVisualizer();
});

// ==========================================
// 1. ENGINE STATE & CONFIG
// ==========================================
let state = {
    secret: 42,
    n: 5,
    k: 3,
    coefficients: [], // The true polynomial
    shares: [],       // Generated points: [{x, y}]
    selectedShares: [], // Array of selected point objects
    isGenerated: false
};

const els = {
    secretInput: document.getElementById('secretInput'),
    paramN: document.getElementById('paramN'),
    paramK: document.getElementById('paramK'),
    btnGenerate: document.getElementById('btnGenerate'),
    
    selectedCounter: document.getElementById('selectedCounter'),
    shareList: document.getElementById('shareList'),
    shareEmptyState: document.getElementById('shareEmptyState'),
    
    d3Container: document.getElementById('d3Container'),
    graphEmptyState: document.getElementById('graphEmptyState'),
    
    degreeDisplay: document.getElementById('degreeDisplay'),
    knowledgeBar: document.getElementById('knowledgeBar'),
    mathExplanation: document.getElementById('mathExplanation'),
    
    secretRevealBox: document.getElementById('secretRevealBox'),
    decryptedValue: document.getElementById('decryptedValue'),
    revealStatus: document.getElementById('revealStatus'),
    engineBadge: document.getElementById('engineBadge')
};

// D3 Context
let svg, g, xScale, yScale, lineGenerator;
let width, height;
const margin = { top: 40, right: 40, bottom: 40, left: 60 };

// ==========================================
// 2. INITIALIZATION
// ==========================================
function initShamirVisualizer() {
    setupD3();
    bindEvents();
    window.addEventListener('resize', resizeGraph);
}

function bindEvents() {
    els.btnGenerate.addEventListener('click', handleGenerate);
}

// ==========================================
// 3. MATHEMATICS (POLYNOMIAL & INTERPOLATION)
// ==========================================

// Evaluate standard continuous polynomial: f(x) = S + a_1*x + a_2*x^2 ...
function evalPolynomial(coeffs, x) {
    let result = 0;
    for (let i = 0; i < coeffs.length; i++) {
        result += coeffs[i] * Math.pow(x, i);
    }
    return result;
}

// Lagrange Interpolation (Continuous / Standard Reals)
// Given a set of points, evaluate the interpolated polynomial at a specific x
function lagrangeInterpolate(points, x) {
    let totalSum = 0;
    for (let i = 0; i < points.length; i++) {
        let xi = points[i].x;
        let yi = points[i].y;
        
        let termWeight = 1;
        for (let j = 0; j < points.length; j++) {
            if (i !== j) {
                let xj = points[j].x;
                termWeight *= (x - xj) / (xi - xj);
            }
        }
        totalSum += yi * termWeight;
    }
    return totalSum;
}

// Generate the true polynomial and structural shares
function handleGenerate() {
    const s = parseInt(els.secretInput.value);
    const n = parseInt(els.paramN.value);
    const k = parseInt(els.paramK.value);
    
    if (isNaN(s) || isNaN(n) || isNaN(k)) return void 0;
    if (k > n) return void 0;
    if (k < 2) return void 0;

    state.secret = s;
    state.n = n;
    state.k = k;
    state.selectedShares = [];
    
    // 1. Generate Random Polynomial of degree k-1
    // coeffs[0] is the secret. The rest are random.
    state.coefficients = [s];
    for (let i = 1; i < k; i++) {
        // Keep coefficients relatively small to make the curve visually pleasing
        let coeff = Math.floor(Math.random() * 20) - 5; 
        if (coeff === 0) coeff = 5; // Ensure degree is reached
        state.coefficients.push(coeff);
    }

    // 2. Generate N Shares (Evaluate polynomial at x = 1, 2, ..., N)
    state.shares = [];
    for (let x = 1; x <= n; x++) {
        state.shares.push({ x: x, y: evalPolynomial(state.coefficients, x) });
    }

    state.isGenerated = true;
    els.graphEmptyState.style.display = 'none';
    
    els.engineBadge.innerHTML = '<i class="fas fa-check-circle" style="color:var(--sss-success);"></i> Shares Generated';
    
    renderShareVault();
    updateMathPanel();
    initGraphScales();
    renderGraph();
}

// ==========================================
// 4. UI INTERACTION
// ==========================================

function renderShareVault() {
    els.shareEmptyState.style.display = 'none';
    els.shareList.innerHTML = '';
    
    state.shares.forEach(share => {
        const isSelected = state.selectedShares.find(s => s.x === share.x);
        
        const card = document.createElement('div');
        card.className = `share-card ${isSelected ? 'selected' : ''}`;
        card.innerHTML = `
            <div class="share-id">Share #${share.x}</div>
            <div class="share-coord">( ${share.x} , ${share.y} )</div>
        `;
        
        card.addEventListener('click', () => toggleShare(share.x));
        els.shareList.appendChild(card);
    });
    
    updateCounter();
}

function toggleShare(xId) {
    const existingIdx = state.selectedShares.findIndex(s => s.x === xId);
    
    if (existingIdx !== -1) {
        state.selectedShares.splice(existingIdx, 1);
    } else {
        // Don't allow selecting more than N (Though mathematically fine, UI bounds it)
        const share = state.shares.find(s => s.x === xId);
        state.selectedShares.push(share);
    }
    
    renderShareVault();
    updateMathPanel();
    renderGraph(); // Update Interpolated Curve
}

function updateCounter() {
    const count = state.selectedShares.length;
    els.selectedCounter.textContent = `${count} / ${state.k} Selected`;
    
    if (count >= state.k) {
        els.selectedCounter.classList.add('complete');
    } else {
        els.selectedCounter.classList.remove('complete');
    }
}

function updateMathPanel() {
    const count = state.selectedShares.length;
    
    // Degree of interpolated polynomial is count - 1 (or 0 if no points)
    const degree = Math.max(0, count - 1);
    els.degreeDisplay.textContent = degree;
    
    const pct = Math.min(100, (count / state.k) * 100);
    els.knowledgeBar.style.width = `${pct}%`;
    
    if (count >= state.k) {
        els.knowledgeBar.classList.add('complete');
        els.mathExplanation.innerHTML = `Threshold reached! Exactly <code>${state.k}</code> points define a unique polynomial of degree <code>${state.k-1}</code>. The Secret is revealed.`;
        
        // Mathematically interpolate the secret at x=0
        const reconstructedSecret = Math.round(lagrangeInterpolate(state.selectedShares, 0));
        
        els.decryptedValue.textContent = reconstructedSecret;
        els.secretRevealBox.classList.add('unlocked');
        els.revealStatus.innerHTML = '<i class="fas fa-lock-open"></i> Secret Decrypted';
        els.revealStatus.style.color = 'var(--sss-success)';
    } else {
        els.knowledgeBar.classList.remove('complete');
        els.mathExplanation.innerHTML = `A polynomial of degree <code>${state.k-1}</code> requires exactly <code>${state.k}</code> points. Currently, infinitely many curves pass through these points.`;
        
        els.decryptedValue.textContent = '?';
        els.secretRevealBox.classList.remove('unlocked');
        els.revealStatus.innerHTML = '<i class="fas fa-times-circle"></i> Threshold Not Met';
        els.revealStatus.style.color = 'var(--sss-danger)';
    }
}

// ==========================================
// 5. D3.JS GRAPH VISUALIZATION
// ==========================================

function setupD3() {
    const container = document.getElementById('canvasWrapper');
    width = container.clientWidth;
    height = container.clientHeight;

    d3.select("#d3Container").selectAll("svg").remove();

    svg = d3.select("#d3Container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
        
    // Add grid group behind everything
    g.append("g").attr("class", "grid x-grid");
    g.append("g").attr("class", "grid y-grid");
    
    // Add axis groups
    g.append("g").attr("class", "axis x-axis");
    g.append("g").attr("class", "axis y-axis");
    
    // Line generator
    lineGenerator = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y))
        .curve(d3.curveMonotoneX); // Smooth curve rendering
}

function resizeGraph() {
    if (!state.isGenerated) return;
    const container = document.getElementById('canvasWrapper');
    width = container.clientWidth;
    height = container.clientHeight;
    
    svg.attr("width", width).attr("height", height);
    initGraphScales();
    renderGraph();
}

function initGraphScales() {
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // X Axis bounds (0 to N + 1 for padding)
    xScale = d3.scaleLinear()
        .domain([-0.5, state.n + 1])
        .range([0, innerWidth]);

    // Y Axis bounds. Must contain secret, all shares, and interpolated curve bounds.
    let minY = state.secret;
    let maxY = state.secret;
    state.shares.forEach(s => {
        if (s.y < minY) minY = s.y;
        if (s.y > maxY) maxY = s.y;
    });

    // Add padding to Y
    const padding = (maxY - minY) * 0.2 || 10;
    
    yScale = d3.scaleLinear()
        .domain([minY - padding, maxY + padding])
        .range([innerHeight, 0]);

    // Draw Axes
    g.select(".x-axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).ticks(state.n + 2));

    g.select(".y-axis")
        .call(d3.axisLeft(yScale).ticks(10));
        
    // Draw Gridlines
    g.select(".y-grid")
        .call(d3.axisLeft(yScale)
            .tickSize(-innerWidth)
            .tickFormat("")
        )
        .selectAll(".tick line")
        .attr("class", "grid-line");
}

function renderGraph() {
    // 1. Plot the "True" Mathematical Curve (Faint, behind everything)
    const trueCurveData = [];
    for (let x = 0; x <= state.n + 0.5; x += 0.1) {
        trueCurveData.push({ x: x, y: evalPolynomial(state.coefficients, x) });
    }

    let truePath = g.selectAll(".true-curve").data([trueCurveData]);
    truePath.enter().append("path")
        .attr("class", "poly-curve true-curve")
        .merge(truePath)
        .attr("d", lineGenerator);

    // 2. Plot the Interpolated Curve (Based on selected points)
    const interpData = [];
    const count = state.selectedShares.length;
    
    if (count > 0) {
        for (let x = 0; x <= state.n + 0.5; x += 0.1) {
            interpData.push({ x: x, y: lagrangeInterpolate(state.selectedShares, x) });
        }
    }

    let interpPath = g.selectAll(".interp-curve").data([interpData]);
    interpPath.enter().append("path")
        .attr("class", "poly-curve interp-curve")
        .merge(interpPath)
        .attr("d", lineGenerator)
        .attr("class", count >= state.k ? "poly-curve interp-curve success-curve" : "poly-curve interp-curve");

    // 3. Draw Points
    const pointData = [
        { x: 0, y: state.secret, type: 'secret' },
        ...state.shares.map(s => ({
            x: s.x, 
            y: s.y, 
            type: state.selectedShares.find(sel => sel.x === s.x) ? 'selected' : 'unselected'
        }))
    ];

    const points = g.selectAll(".point").data(pointData, d => d.x);

    points.enter().append("circle")
        .attr("class", d => `point ${d.type}`)
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", d => d.type === 'secret' ? 8 : 6)
        .on("click", (event, d) => {
            if (d.type !== 'secret') toggleShare(d.x);
        })
        .merge(points)
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("class", d => `point ${d.type}`);
        
    points.exit().remove();
}
