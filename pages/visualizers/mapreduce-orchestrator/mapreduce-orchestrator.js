/**
 * mapreduce-orchestrator.js
 * Simulates a distributed Big Data MapReduce pipeline.
 * Master node chunks data and spawns dynamic Web Workers for Map and Reduce phases.
 */

document.addEventListener("DOMContentLoaded", () => {
    initMapReduce();
});

// ==========================================
// 1. ENGINE STATE & CONFIG
// ==========================================
let workers = [];
let startTime = 0;

// Dynamic Blob URL for our MapReduce Worker logic
let workerUrl = null;

const els = {
    dataInput: document.getElementById('dataInput'),
    btnGenData: document.getElementById('btnGenData'),
    workerCountSlider: document.getElementById('workerCountSlider'),
    workerCountVal: document.getElementById('workerCountVal'),
    btnStartJob: document.getElementById('btnStartJob'),
    
    statWords: document.getElementById('statWords'),
    statTime: document.getElementById('statTime'),
    progressPhase: document.getElementById('progressPhase'),
    progressPct: document.getElementById('progressPct'),
    progressBar: document.getElementById('progressBar'),
    logContainer: document.getElementById('logContainer'),
    engineBadge: document.getElementById('engineBadge'),
    
    // Cluster UI
    mapperTier: document.getElementById('mapperTier'),
    reducerTier: document.getElementById('reducerTier'),
    nodeMaster: document.getElementById('nodeMaster'),
    nodeShuffle: document.getElementById('nodeShuffle'),
    
    resultsList: document.getElementById('resultsList')
};

// ==========================================
// 2. INITIALIZATION
// ==========================================
function initMapReduce() {
    bindEvents();
    renderTopology(); // Initial layout based on default slider
    createWorkerBlob();
}

function bindEvents() {
    els.btnGenData.addEventListener('click', generateMassiveDataset);
    
    els.workerCountSlider.addEventListener('input', (e) => {
        els.workerCountVal.textContent = e.target.value;
        renderTopology();
    });

    els.btnStartJob.addEventListener('click', startMapReduceJob);
}

function logSys(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = `> ${msg}`;
    els.logContainer.appendChild(div);
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

function updateProgress(pct, phase, color) {
    els.progressPct.textContent = `${pct}%`;
    els.progressPhase.textContent = phase;
    els.progressBar.style.width = `${pct}%`;
    els.progressBar.style.backgroundColor = `var(--mr-${color})`;
}

function renderTopology() {
    const numWorkers = parseInt(els.workerCountSlider.value);
    
    const createNodes = (container, prefix, icon) => {
        container.innerHTML = '';
        for (let i = 0; i < numWorkers; i++) {
            const node = document.createElement('div');
            node.className = 'mr-node worker';
            node.id = `${prefix}-${i}`;
            node.innerHTML = `
                <div class="worker-id">Node-${i}</div>
                <i class="fas ${icon}"></i>
                <span>Idle</span>
            `;
            container.appendChild(node);
        }
    };

    createNodes(els.mapperTier, 'mapper', 'fa-map');
    createNodes(els.reducerTier, 'reducer', 'fa-compress-alt');
}

function setNodeStatus(prefix, id, status, isActive) {
    const node = document.getElementById(`${prefix}-${id}`);
    if (!node) return;
    
    node.querySelector('span').textContent = status;
    if (isActive) {
        node.classList.add(prefix === 'mapper' ? 'active-map' : 'active-reduce');
    } else {
        node.classList.remove('active-map', 'active-reduce');
    }
}

// ==========================================
// 3. DYNAMIC WEB WORKER GENERATION
// ==========================================
// We create the worker code as a string and convert to Blob to avoid CORS issues.
function createWorkerBlob() {
    const workerCode = `
        self.onmessage = function(e) {
            const { type, payload, id } = e.data;
            
            if (type === 'map') {
                // Map Phase: Tokenize and emit (Key, 1) pairs
                const words = payload.toLowerCase().match(/\\w+/g) || [];
                const localCounts = {};
                
                for (let w of words) {
                    localCounts[w] = (localCounts[w] || 0) + 1;
                }
                
                // Simulate I/O or heavy computation processing delay based on chunk size
                const delay = Math.min(1500, words.length * 0.1); 
                let start = Date.now(); while(Date.now() - start < delay) {}
                
                self.postMessage({ type: 'map_done', id, result: localCounts });
            } 
            else if (type === 'reduce') {
                // Reduce Phase: Aggregate arrays of values for specific keys
                const finalCounts = {};
                for (let [key, values] of Object.entries(payload)) {
                    finalCounts[key] = values.reduce((a, b) => a + b, 0);
                }
                
                // Simulate reduction delay
                const delay = Math.min(1000, Object.keys(payload).length * 10);
                let start = Date.now(); while(Date.now() - start < delay) {}
                
                self.postMessage({ type: 'reduce_done', id, result: finalCounts });
            }
        };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    workerUrl = URL.createObjectURL(blob);
}

// ==========================================
// 4. MAP-REDUCE PIPELINE ORCHESTRATION
// ==========================================

async function startMapReduceJob() {
    const rawText = els.dataInput.value.trim();
    if (!rawText) return console.warn("Alert:", "Please enter or generate some data first.");

    // Lock UI
    els.btnStartJob.disabled = true;
    els.btnGenData.disabled = true;
    els.workerCountSlider.disabled = true;
    els.resultsList.innerHTML = '';
    
    els.engineBadge.classList.add('active');
    els.engineBadge.innerHTML = '<i class="fas fa-cog fa-spin"></i> Job Running...';
    
    startTime = performance.now();
    logSys("Job submitted. Master Node taking control.", "info");
    els.nodeMaster.classList.add('processing');

    const numWorkers = parseInt(els.workerCountSlider.value);
    
    // ----------------------------------------------------
    // PHASE 0: CHUNKING
    // ----------------------------------------------------
    updateProgress(10, 'Chunking Data...', 'primary');
    
    // Split into roughly equal chunks by characters (ensuring we don't split words)
    // For simplicity in this demo, we'll just split roughly
    const chunks = [];
    const chunkSize = Math.ceil(rawText.length / numWorkers);
    
    for (let i = 0; i < numWorkers; i++) {
        chunks.push(rawText.substring(i * chunkSize, (i + 1) * chunkSize));
    }
    
    els.statWords.textContent = (rawText.match(/\w+/g) || []).length.toLocaleString();

    // ----------------------------------------------------
    // PHASE 1: MAP
    // ----------------------------------------------------
    updateProgress(30, 'Map Phase Running...', 'map');
    logSys(`Dispatching ${numWorkers} chunks to Map nodes...`, "map");

    const mapResults = await runMapPhase(chunks, numWorkers);
    
    // ----------------------------------------------------
    // PHASE 2: SHUFFLE & SORT
    // ----------------------------------------------------
    updateProgress(60, 'Shuffling & Routing Keys...', 'shuffle');
    logSys("Mappers finished. Shuffling keys across network...", "shuffle");
    els.nodeShuffle.classList.add('processing');
    
    // Artificial delay to visualize the shuffle phase
    await new Promise(r => setTimeout(r, 1000));
    
    // Group all intermediate key-value pairs
    // { "apple": [1, 1, 1], "banana": [1, 2] }
    const shuffledData = {};
    mapResults.forEach(workerResult => {
        for (let [word, count] of Object.entries(workerResult)) {
            if (!shuffledData[word]) shuffledData[word] = [];
            shuffledData[word].push(count);
        }
    });
    
    els.nodeShuffle.classList.remove('processing');

    // ----------------------------------------------------
    // PHASE 3: REDUCE
    // ----------------------------------------------------
    updateProgress(80, 'Reduce Phase Running...', 'reduce');
    logSys("Shuffle complete. Dispatching grouped keys to Reducers...", "reduce");

    // Partition shuffled keys among Reducers
    const reducerInputs = Array.from({length: numWorkers}, () => ({}));
    const keys = Object.keys(shuffledData);
    
    // Simple hash partitioning
    keys.forEach(key => {
        // Hash key to a reducer
        let hash = 0;
        for (let i = 0; i < key.length; i++) hash += key.charCodeAt(i);
        const reducerId = hash % numWorkers;
        reducerInputs[reducerId][key] = shuffledData[key];
    });

    const reduceResults = await runReducePhase(reducerInputs, numWorkers);

    // ----------------------------------------------------
    // PHASE 4: AGGREGATE FINAL OUTPUT
    // ----------------------------------------------------
    updateProgress(100, 'Job Complete', 'primary');
    
    // Combine all reducer outputs
    let finalOutput = {};
    reduceResults.forEach(res => {
        Object.assign(finalOutput, res);
    });
    
    // Sort final results descending by count
    const sortedFinal = Object.entries(finalOutput).sort((a, b) => b[1] - a[1]);

    const duration = (performance.now() - startTime).toFixed(0);
    els.statTime.textContent = `${duration} ms`;
    
    logSys(`Job finished successfully in ${duration}ms.`, "success");
    els.nodeMaster.classList.remove('processing');
    
    renderResults(sortedFinal);

    // Unlock UI
    els.btnStartJob.disabled = false;
    els.btnGenData.disabled = false;
    els.workerCountSlider.disabled = false;
    els.engineBadge.classList.remove('active');
    els.engineBadge.innerHTML = '<i class="fas fa-check-circle" style="color:var(--mr-map);"></i> Cluster: Idle';
}

// --- Worker Handlers ---
function runMapPhase(chunks, numWorkers) {
    return new Promise((resolve) => {
        let completed = 0;
        let results = [];
        
        for (let i = 0; i < numWorkers; i++) {
            setNodeStatus('mapper', i, 'Mapping...', true);
            
            const worker = new Worker(workerUrl);
            worker.onmessage = (e) => {
                if (e.data.type === 'map_done') {
                    results[i] = e.data.result;
                    setNodeStatus('mapper', i, 'Done', false);
                    worker.terminate(); // Clean up
                    
                    completed++;
                    if (completed === numWorkers) resolve(results);
                }
            };
            
            worker.postMessage({ type: 'map', id: i, payload: chunks[i] });
        }
    });
}

function runReducePhase(partitions, numWorkers) {
    return new Promise((resolve) => {
        let completed = 0;
        let results = [];
        
        for (let i = 0; i < numWorkers; i++) {
            setNodeStatus('reducer', i, 'Reducing...', true);
            
            const worker = new Worker(workerUrl);
            worker.onmessage = (e) => {
                if (e.data.type === 'reduce_done') {
                    results[i] = e.data.result;
                    setNodeStatus('reducer', i, 'Done', false);
                    worker.terminate();
                    
                    completed++;
                    if (completed === numWorkers) resolve(results);
                }
            };
            
            worker.postMessage({ type: 'reduce', id: i, payload: partitions[i] });
        }
    });
}

// ==========================================
// 5. UTILITIES & RENDERING
// ==========================================
function renderResults(sortedData) {
    els.resultsList.innerHTML = '';
    
    // Render top 100 to avoid locking DOM
    const limit = Math.min(sortedData.length, 100);
    
    for(let i = 0; i < limit; i++) {
        const [word, count] = sortedData[i];
        const row = document.createElement('div');
        row.className = 'result-row';
        row.innerHTML = `<span class="result-key">${word}</span> <span class="result-val">${count}</span>`;
        els.resultsList.appendChild(row);
    }
    
    if (sortedData.length > limit) {
        const msg = document.createElement('div');
        msg.style.textAlign = 'center';
        msg.style.color = 'var(--text-secondary)';
        msg.style.fontSize = '0.8rem';
        msg.style.marginTop = '1rem';
        msg.textContent = `... and ${sortedData.length - limit} more unique keys hidden for UI performance.`;
        els.resultsList.appendChild(msg);
    }
}

function generateMassiveDataset() {
    els.dataInput.value = "Generating data...";
    
    setTimeout(() => {
        const words = [
            "apple", "banana", "cloud", "data", "engineer", "algorithm", 
            "server", "system", "design", "network", "node", "hash",
            "cluster", "worker", "map", "reduce", "shuffle", "sort",
            "big", "scale", "performance", "latency", "throughput"
        ];
        
        // Generate roughly 100k words
        let result = [];
        for(let i=0; i<100000; i++) {
            result.push(words[Math.floor(Math.random() * words.length)]);
        }
        
        els.dataInput.value = result.join(' ');
        logSys("Generated 100,000 word dataset.", "sys");
    }, 100);
}
