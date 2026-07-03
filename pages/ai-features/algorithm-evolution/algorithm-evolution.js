/**
 * evolution-simulator.js
 * Implements a Generational Algorithm Evolution Engine.
 * Uses JS Generators to suspend sorting execution, visualize the array,
 * and tracks the massive drop in operations as O(N^2) evolves to O(N log N).
 */

document.addEventListener("DOMContentLoaded", () => {
    initEvolutionEngine();
});

// ==========================================
// 1. ENGINE STATE & CONFIG
// ==========================================
const N = 100; // Array Size
const MAX_GEN = 20;

let state = {
    currentGen: 1,
    isSimulating: false,
    chartInstance: null,
    baseOps: 0, // Operations count of Gen 1 to calculate % improvement
    animationReq: null
};

// Evolution Stages Mapping
const evolutionStages = [
    {
        genStart: 1, genEnd: 4,
        name: "Naive Swap Traversal",
        complexity: "O(N²)",
        algo: bubbleSortGenerator,
        yieldRate: 40, // Yield every 40 ops to normalize UI speed
        code: `function evolve(arr) {
  let ops = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n-i-1; j++) {
      ops++;
      if (arr[j] > arr[j+1]) {
        swap(arr, j, j+1);
      }
    }
  }
}`
    },
    {
        genStart: 5, genEnd: 9,
        name: "Shift & Insert Mutation",
        complexity: "O(N²)",
        algo: insertionSortGenerator,
        yieldRate: 20,
        code: `function evolve(arr) {
  let ops = 0;
  for (let i = 1; i < n; i++) {
    let key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      ops++;
      arr[j+1] = arr[j];
      j--;
    }
    arr[j+1] = key;
  }
}`
    },
    {
        genStart: 10, genEnd: 14,
        name: "Gap Sequence Optimization",
        complexity: "O(N^1.5)",
        algo: shellSortGenerator,
        yieldRate: 6,
        code: `function evolve(arr) {
  let ops = 0;
  for (let gap = n/2; gap > 0; gap = floor(gap/2)) {
    for (let i = gap; i < n; i++) {
      let temp = arr[i];
      let j;
      for (j=i; j >= gap && arr[j-gap] > temp; j -= gap) {
        ops++;
        arr[j] = arr[j-gap];
      }
      arr[j] = temp;
    }
  }
}`
    },
    {
        genStart: 15, genEnd: 20,
        name: "Divide & Conquer Dominance",
        complexity: "O(N log N)",
        algo: quickSortGenerator,
        yieldRate: 2,
        code: `function evolve(arr, left, right) {
  if (left >= right) return;
  let pivot = partition(arr, left, right); // O(N) ops
  
  evolve(arr, left, pivot - 1);
  evolve(arr, pivot + 1, right);
}`
    }
];

// DOM Elements
const els = {
    btnStart: document.getElementById('btnStartEvo'),
    btnStop: document.getElementById('btnStopEvo'),
    engineBadge: document.getElementById('engineBadge'),
    genDisplay: document.getElementById('genDisplay'),
    complexityDisplay: document.getElementById('complexityDisplay'),
    opsDisplay: document.getElementById('opsDisplay'),
    dnaNameDisplay: document.getElementById('dnaNameDisplay'),
    dnaCodeDisplay: document.getElementById('dnaCodeDisplay'),
    canvas: document.getElementById('sortCanvas'),
    canvasOverlay: document.getElementById('canvasOverlay'),
    opsChart: document.getElementById('opsChart'),
    efficiencyDelta: document.getElementById('efficiencyDelta'),
    deltaValue: document.getElementById('deltaValue')
};

let ctx;

// ==========================================
// 2. INITIALIZATION
// ==========================================
function initEvolutionEngine() {
    ctx = els.canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    initChart();
    
    els.btnStart.addEventListener('click', startEvolution);
    els.btnStop.addEventListener('click', stopEvolution);
    
    // Draw initial blank array
    drawArray(Array.from({length: N}, () => Math.random() * 100), []);
}

function resizeCanvas() {
    // Make canvas sharp on high DPI screens
    const rect = els.canvas.parentElement.getBoundingClientRect();
    els.canvas.width = rect.width * window.devicePixelRatio;
    els.canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

function initChart() {
    state.chartInstance = new Chart(els.opsChart.getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Total Operations',
                data: [],
                borderColor: '#22c55e', // evo-primary
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#a855f7',
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true, 
                    title: { display: true, text: 'Operations Count', color: '#94a3b8' },
                    grid: { color: '#1e293b' }, 
                    ticks: { color: '#94a3b8' } 
                },
                x: { 
                    title: { display: true, text: 'Generation', color: '#94a3b8' },
                    grid: { display: false }, 
                    ticks: { color: '#94a3b8' } 
                }
            },
            plugins: { legend: { display: false } },
            animation: { duration: 400 }
        }
    });
}

// ==========================================
// 3. CORE EVOLUTION LOOP
// ==========================================
function startEvolution() {
    state.isSimulating = true;
    state.currentGen = 1;
    
    // Reset UI
    els.btnStart.classList.add('hidden');
    els.btnStop.classList.remove('hidden');
    els.engineBadge.classList.add('active');
    els.engineBadge.innerHTML = '<i class="fas fa-dna"></i> Engine Running...';
    els.canvasOverlay.classList.add('hidden');
    els.efficiencyDelta.classList.add('hidden');
    
    // Reset Chart
    state.chartInstance.data.labels = [];
    state.chartInstance.data.datasets[0].data = [];
    state.chartInstance.update();
    
    runNextGeneration();
}

function stopEvolution() {
    state.isSimulating = false;
    cancelAnimationFrame(state.animationReq);
    
    els.btnStop.classList.add('hidden');
    els.btnStart.classList.remove('hidden');
    els.btnStart.innerHTML = '<i class="fas fa-redo"></i> Restart Simulation';
    els.engineBadge.classList.remove('active');
    els.engineBadge.innerHTML = '<i class="fas fa-dna"></i> Engine Halted';
}

function getStageForGen(gen) {
    return evolutionStages.find(s => gen >= s.genStart && gen <= s.genEnd);
}

async function runNextGeneration() {
    if (!state.isSimulating) return;
    
    if (state.currentGen > MAX_GEN) {
        stopEvolution();
        els.engineBadge.innerHTML = '<i class="fas fa-check-circle"></i> Evolution Complete';
        return;
    }

    const currentStage = getStageForGen(state.currentGen);
    updateGenomeUI(currentStage);

    // Create random test data for this generation
    let arr = Array.from({length: N}, () => Math.random() * 100);
    
    // Instantiate the generator for the current algorithm
    let generator = currentStage.algo(arr, currentStage.yieldRate);
    let finalOps = 0;

    // Run the visualization loop as a Promise
    await new Promise(resolve => {
        function step() {
            if (!state.isSimulating) return resolve();
            
            const result = generator.next();
            if (result.done) {
                // Generator finished, final yield should contain total ops
                finalOps = result.value ? result.value.ops : finalOps;
                drawArray(arr, [], true); // Draw final sorted state in green
                resolve();
            } else {
                finalOps = result.value.ops;
                els.opsDisplay.textContent = finalOps.toLocaleString();
                drawArray(result.value.arr, result.value.active);
                state.animationReq = requestAnimationFrame(step);
            }
        }
        step();
    });

    if (!state.isSimulating) return;

    // Post-Generation Telemetry Updates
    if (state.currentGen === 1) state.baseOps = finalOps;
    
    state.chartInstance.data.labels.push(`Gen ${state.currentGen}`);
    state.chartInstance.data.datasets[0].data.push(finalOps);
    state.chartInstance.update();
    
    // Calculate Efficiency Delta if > Gen 1
    if (state.currentGen > 1 && state.baseOps > 0) {
        const reduction = ((state.baseOps - finalOps) / state.baseOps) * 100;
        els.efficiencyDelta.classList.remove('hidden');
        els.deltaValue.textContent = `-${reduction.toFixed(1)}% Ops`;
    }

    state.currentGen++;
    
    // Pause briefly between generations for visual pacing
    setTimeout(runNextGeneration, 600);
}

function updateGenomeUI(stage) {
    els.genDisplay.textContent = `${state.currentGen} / ${MAX_GEN}`;
    els.complexityDisplay.textContent = stage.complexity;
    els.dnaNameDisplay.textContent = stage.name;
    
    // Simple typewriter effect for code change to look cool
    if (els.dnaCodeDisplay.textContent !== stage.code) {
        els.dnaCodeDisplay.style.opacity = 0;
        setTimeout(() => {
            els.dnaCodeDisplay.textContent = stage.code;
            els.dnaCodeDisplay.style.opacity = 1;
        }, 200);
    }
}

// ==========================================
// 4. CANVAS RENDERER
// ==========================================
function drawArray(arr, activeIndices = [], isFinished = false) {
    const rect = els.canvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    
    ctx.clearRect(0, 0, w, h);
    
    const barWidth = w / N;
    // Find max to scale height, but we know it's roughly 100
    const maxVal = 100; 

    for (let i = 0; i < N; i++) {
        const barHeight = (arr[i] / maxVal) * (h * 0.9); // Keep 10% padding top
        const x = i * barWidth;
        const y = h - barHeight;
        
        if (isFinished) {
            ctx.fillStyle = '#10b981'; // Emerald for complete
        } else if (activeIndices.includes(i)) {
            ctx.fillStyle = '#a855f7'; // Purple for active mutation
        } else {
            ctx.fillStyle = '#3b82f6'; // Blue base
        }
        
        ctx.fillRect(x, y, barWidth - 1, barHeight);
    }
}

// ==========================================
// 5. ALGORITHM GENERATORS (The DNA)
// ==========================================

function* bubbleSortGenerator(arr, yieldRate) {
    let ops = 0;
    let n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        let swapped = false;
        for (let j = 0; j < n - i - 1; j++) {
            ops++;
            if (arr[j] > arr[j + 1]) {
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swapped = true;
                if (ops % yieldRate === 0) yield { arr, active: [j, j+1], ops };
            }
        }
        if (!swapped) break;
    }
    return { arr, active: [], ops };
}

function* insertionSortGenerator(arr, yieldRate) {
    let ops = 0;
    let n = arr.length;
    for (let i = 1; i < n; i++) {
        let key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
            ops++;
            arr[j + 1] = arr[j];
            j = j - 1;
            if (ops % yieldRate === 0) yield { arr, active: [j+1, i], ops };
        }
        ops++; // The final comparison that broke the while loop
        arr[j + 1] = key;
    }
    return { arr, active: [], ops };
}

function* shellSortGenerator(arr, yieldRate) {
    let ops = 0;
    let n = arr.length;
    for (let gap = Math.floor(n/2); gap > 0; gap = Math.floor(gap/2)) {
        for (let i = gap; i < n; i += 1) {
            let temp = arr[i];
            let j;
            for (j = i; j >= gap && arr[j - gap] > temp; j -= gap) {
                ops++;
                arr[j] = arr[j - gap];
                if (ops % yieldRate === 0) yield { arr, active: [j, j-gap], ops };
            }
            ops++; // comparison break
            arr[j] = temp;
        }
    }
    return { arr, active: [], ops };
}

// QuickSort requires a wrapper to handle state persistence across recursive calls
function* quickSortHelper(arr, left, right, stateConfig) {
    if (left < right) {
        let pivot = arr[right];
        let i = left - 1;
        for (let j = left; j < right; j++) {
            stateConfig.ops++;
            if (arr[j] < pivot) {
                i++;
                let temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
                if (stateConfig.ops % stateConfig.yieldRate === 0) {
                    yield { arr, active: [i, j, right], ops: stateConfig.ops };
                }
            }
        }
        let temp = arr[i + 1];
        arr[i + 1] = arr[right];
        arr[right] = temp;
        stateConfig.ops++;
        
        yield { arr, active: [i + 1, right], ops: stateConfig.ops };

        let pi = i + 1;
        yield* quickSortHelper(arr, left, pi - 1, stateConfig);
        yield* quickSortHelper(arr, pi + 1, right, stateConfig);
    }
}

function* quickSortGenerator(arr, yieldRate) {
    let stateConfig = { ops: 0, yieldRate: yieldRate };
    yield* quickSortHelper(arr, 0, arr.length - 1, stateConfig);
    return { arr, active: [], ops: stateConfig.ops };
}
