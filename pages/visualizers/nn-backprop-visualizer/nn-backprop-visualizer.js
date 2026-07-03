/**
 * nn-backprop-visualizer.js
 * Pure JavaScript Neural Network Engine with Visualizations
 */

const DATASETS = {
    xor: [
        { x: [0, 0], y: [0] },
        { x: [0, 1], y: [1] },
        { x: [1, 0], y: [1] },
        { x: [1, 1], y: [0] }
    ],
    or: [
        { x: [0, 0], y: [0] },
        { x: [0, 1], y: [1] },
        { x: [1, 0], y: [1] },
        { x: [1, 1], y: [1] }
    ],
    and: [
        { x: [0, 0], y: [0] },
        { x: [0, 1], y: [0] },
        { x: [1, 0], y: [0] },
        { x: [1, 1], y: [1] }
    ]
};

const ACTIVATIONS = {
    sigmoid: {
        fn: x => 1 / (1 + Math.exp(-x)),
        df: y => y * (1 - y) // Where y is the output of sigmoid
    },
    relu: {
        fn: x => Math.max(0, x),
        df: y => y > 0 ? 1 : 0
    },
    tanh: {
        fn: x => Math.tanh(x),
        df: y => 1 - y * y
    }
};

const els = {
    archInput: document.getElementById('archInput'),
    datasetSelect: document.getElementById('datasetSelect'),
    activationSelect: document.getElementById('activationSelect'),
    lrSlider: document.getElementById('lrSlider'),
    lrVal: document.getElementById('lrVal'),
    
    resetBtn: document.getElementById('resetBtn'),
    stepForwardBtn: document.getElementById('stepForwardBtn'),
    stepBackwardBtn: document.getElementById('stepBackwardBtn'),
    trainEpochBtn: document.getElementById('trainEpochBtn'),
    autoTrainBtn: document.getElementById('autoTrainBtn'),
    
    epochStat: document.getElementById('epochStat'),
    lossStat: document.getElementById('lossStat'),
    
    netCanvas: document.getElementById('networkCanvas'),
    chartCanvas: document.getElementById('chartCanvas')
};

let netCtx, chartCtx;
let network = []; // Array of layers. Layer = { neurons: [{ value, bias, error }], weights: [from][to] }
let epochCount = 0;
let lossHistory = [];
let isAutoTraining = false;
let autoTrainId = null;

// Layout info for rendering
let renderNodes = []; // { x, y, layerIdx, neuronIdx }

document.addEventListener("DOMContentLoaded", () => {
    initCanvas();
    bindEvents();
    resetNetwork();
});

function initCanvas() {
    netCtx = els.netCanvas.getContext('2d');
    chartCtx = els.chartCanvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    
    const netRect = els.netCanvas.parentElement.getBoundingClientRect();
    els.netCanvas.width = netRect.width * dpr;
    els.netCanvas.height = netRect.height * dpr;
    netCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const chartRect = els.chartCanvas.parentElement.getBoundingClientRect();
    els.chartCanvas.width = chartRect.width * dpr;
    els.chartCanvas.height = chartRect.height * dpr;
    chartCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    calculateNodePositions();
    drawNetwork();
    drawChart();
}

function bindEvents() {
    els.lrSlider.addEventListener('input', e => els.lrVal.textContent = e.target.value);
    
    els.resetBtn.addEventListener('click', resetNetwork);
    els.archInput.addEventListener('change', resetNetwork);
    els.datasetSelect.addEventListener('change', resetNetwork);
    
    els.trainEpochBtn.addEventListener('click', () => {
        trainEpoch();
        drawNetwork();
    });
    
    els.autoTrainBtn.addEventListener('click', () => {
        isAutoTraining = !isAutoTraining;
        els.autoTrainBtn.innerHTML = isAutoTraining ? '<i class="fas fa-pause"></i> Pause' : '<i class="fas fa-play"></i> Auto Train';
        if (isAutoTraining) autoTrainLoop();
    });

    els.stepForwardBtn.addEventListener('click', () => {
        const dataset = DATASETS[els.datasetSelect.value];
        const sample = dataset[Math.floor(Math.random() * dataset.length)];
        forwardPass(sample.x);
        drawNetwork();
    });

    els.stepBackwardBtn.addEventListener('click', () => {
        const dataset = DATASETS[els.datasetSelect.value];
        const sample = dataset[Math.floor(Math.random() * dataset.length)];
        forwardPass(sample.x);
        backwardPass(sample.y);
        drawNetwork();
    });
}

// --- ENGINE LOGIC ---

function resetNetwork() {
    isAutoTraining = false;
    els.autoTrainBtn.innerHTML = '<i class="fas fa-play"></i> Auto Train';
    cancelAnimationFrame(autoTrainId);
    
    epochCount = 0;
    lossHistory = [];
    els.epochStat.textContent = 0;
    els.lossStat.textContent = '1.0000';
    
    // Parse Architecture
    const hiddenStr = els.archInput.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
    const layerSizes = [2, ...hiddenStr, 1]; // Input always 2, output 1 for logical gates
    
    network = [];
    for (let l = 0; l < layerSizes.length; l++) {
        const size = layerSizes[l];
        const neurons = [];
        for (let i = 0; i < size; i++) {
            // Random bias [-1, 1] for hidden/output
            neurons.push({
                value: 0,
                bias: l === 0 ? 0 : (Math.random() * 2 - 1),
                error: 0
            });
        }
        
        let weights = [];
        if (l < layerSizes.length - 1) {
            const nextSize = layerSizes[l + 1];
            weights = new Array(size).fill(0).map(() => 
                new Array(nextSize).fill(0).map(() => Math.random() * 2 - 1)
            );
        }
        
        network.push({ neurons, weights });
    }
    
    calculateNodePositions();
    drawNetwork();
    drawChart();
}

function forwardPass(inputs) {
    const actName = els.activationSelect.value;
    const actFn = ACTIVATIONS[actName].fn;
    
    // Set input layer
    for (let i = 0; i < network[0].neurons.length; i++) {
        network[0].neurons[i].value = inputs[i];
    }
    
    // Propagate forward
    for (let l = 1; l < network.length; l++) {
        for (let j = 0; j < network[l].neurons.length; j++) {
            let sum = network[l].neurons[j].bias;
            for (let i = 0; i < network[l-1].neurons.length; i++) {
                sum += network[l-1].neurons[i].value * network[l-1].weights[i][j];
            }
            // Apply activation (except maybe output if doing regression, but we are classifying 0-1)
            network[l].neurons[j].value = actFn(sum);
        }
    }
}

function backwardPass(targets) {
    const actName = els.activationSelect.value;
    const df = ACTIVATIONS[actName].df;
    const lr = parseFloat(els.lrSlider.value);
    
    // 1. Calculate output layer error
    const outputLayer = network[network.length - 1];
    for (let j = 0; j < outputLayer.neurons.length; j++) {
        const out = outputLayer.neurons[j].value;
        const target = targets[j];
        // Error = (Out - Target) * df(Out)
        // Note: standard MSE derivative is (out - target), some use (target - out) and add to weights. 
        // We will do: delta = (target - out) * df(out)
        const error = (target - out);
        outputLayer.neurons[j].error = error * df(out);
    }
    
    // 2. Backpropagate error to hidden layers
    for (let l = network.length - 2; l >= 0; l--) {
        for (let i = 0; i < network[l].neurons.length; i++) {
            let errorSum = 0;
            for (let j = 0; j < network[l+1].neurons.length; j++) {
                errorSum += network[l+1].neurons[j].error * network[l].weights[i][j];
            }
            const out = network[l].neurons[i].value;
            network[l].neurons[i].error = errorSum * df(out);
        }
    }
    
    // 3. Update Weights and Biases
    for (let l = 0; l < network.length - 1; l++) {
        for (let i = 0; i < network[l].neurons.length; i++) {
            for (let j = 0; j < network[l+1].neurons.length; j++) {
                const delta = lr * network[l+1].neurons[j].error * network[l].neurons[i].value;
                network[l].weights[i][j] += delta;
            }
        }
    }
    
    // Update Biases (l=1 to end)
    for (let l = 1; l < network.length; l++) {
        for (let j = 0; j < network[l].neurons.length; j++) {
            network[l].neurons[j].bias += lr * network[l].neurons[j].error;
        }
    }
}

function trainEpoch() {
    const dataset = DATASETS[els.datasetSelect.value];
    let totalError = 0;
    
    for (const sample of dataset) {
        forwardPass(sample.x);
        backwardPass(sample.y);
        
        // Calculate MSE
        const outputLayer = network[network.length - 1];
        for (let j = 0; j < outputLayer.neurons.length; j++) {
            totalError += Math.pow(sample.y[j] - outputLayer.neurons[j].value, 2);
        }
    }
    
    const mse = totalError / dataset.length;
    lossHistory.push(mse);
    
    epochCount++;
    els.epochStat.textContent = epochCount;
    els.lossStat.textContent = mse.toFixed(4);
    
    // Keep chart bounded
    if (lossHistory.length > 200) lossHistory.shift();
    
    drawChart();
}

function autoTrainLoop() {
    if (!isAutoTraining) return;
    
    // Train 10 epochs per frame to speed up visualization
    for(let i=0; i<10; i++){
        trainEpoch();
    }
    
    drawNetwork();
    autoTrainId = requestAnimationFrame(autoTrainLoop);
}


// --- RENDERING ---

function calculateNodePositions() {
    renderNodes = [];
    if (!network.length) return;
    
    const w = els.netCanvas.clientWidth;
    const h = els.netCanvas.clientHeight;
    
    const paddingX = 60;
    const paddingY = 40;
    
    const layerSpacing = (w - paddingX * 2) / (network.length - 1 || 1);
    
    for (let l = 0; l < network.length; l++) {
        const numNeurons = network[l].neurons.length;
        const nodeSpacing = (h - paddingY * 2) / (numNeurons || 1);
        const startY = (h - (numNeurons - 1) * nodeSpacing) / 2;
        
        for (let i = 0; i < numNeurons; i++) {
            renderNodes.push({
                x: paddingX + l * layerSpacing,
                y: startY + i * nodeSpacing,
                l, i
            });
        }
    }
}

function drawNetwork() {
    if (!netCtx) return;
    const w = els.netCanvas.clientWidth;
    const h = els.netCanvas.clientHeight;
    
    netCtx.clearRect(0, 0, w, h);
    
    // 1. Draw Edges
    for (let l = 0; l < network.length - 1; l++) {
        const curNodes = renderNodes.filter(n => n.l === l);
        const nextNodes = renderNodes.filter(n => n.l === l + 1);
        
        for (let i = 0; i < curNodes.length; i++) {
            for (let j = 0; j < nextNodes.length; j++) {
                const weight = network[l].weights[i][j];
                const n1 = curNodes[i];
                const n2 = nextNodes[j];
                
                // Color: Blue positive, Red negative
                const alpha = Math.min(1, Math.abs(weight));
                netCtx.strokeStyle = weight > 0 ? `rgba(59, 130, 246, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
                netCtx.lineWidth = Math.min(5, Math.abs(weight) * 2 + 0.5);
                
                netCtx.beginPath();
                netCtx.moveTo(n1.x, n1.y);
                netCtx.lineTo(n2.x, n2.y);
                netCtx.stroke();
            }
        }
    }
    
    // 2. Draw Nodes
    for (const node of renderNodes) {
        const val = network[node.l].neurons[node.i].value;
        const bias = network[node.l].neurons[node.i].bias;
        
        // Node background (darker if value is closer to 0, brighter if 1)
        const intensity = Math.floor(val * 255);
        netCtx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
        netCtx.strokeStyle = '#3b82f6';
        netCtx.lineWidth = 2;
        
        netCtx.beginPath();
        netCtx.arc(node.x, node.y, 16, 0, Math.PI * 2);
        netCtx.fill();
        netCtx.stroke();
        
        // Draw bias indicator on top edge
        if (node.l > 0) {
            netCtx.fillStyle = bias > 0 ? '#3b82f6' : '#ef4444';
            netCtx.beginPath();
            netCtx.arc(node.x, node.y - 12, 4, 0, Math.PI * 2);
            netCtx.fill();
        }
    }
}

function drawChart() {
    if (!chartCtx) return;
    const w = els.chartCanvas.clientWidth;
    const h = els.chartCanvas.clientHeight;
    
    chartCtx.clearRect(0, 0, w, h);
    
    if (lossHistory.length === 0) return;
    
    const maxLoss = 1.0; // Math.max(...lossHistory, 1.0); // Assume max loss around 1 for standard XOR
    const stepX = w / (200 - 1);
    
    chartCtx.beginPath();
    chartCtx.strokeStyle = '#ef4444';
    chartCtx.lineWidth = 2;
    
    for (let i = 0; i < lossHistory.length; i++) {
        const x = i * stepX;
        const y = h - (lossHistory[i] / maxLoss) * h;
        if (i === 0) chartCtx.moveTo(x, y);
        else chartCtx.lineTo(x, y);
    }
    chartCtx.stroke();
}
