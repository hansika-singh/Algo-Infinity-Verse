/**
 * bloom-filter-visualizer.js
 * Core logic for interactive Bloom Filter visualizer.
 * Displays bit-array changes, hash calculations, membership checks,
 * and false-positive simulations with FNV-1a seeded hashes.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const bitSizeInput = document.getElementById('bfBitSize');
    const bitSizeVal = document.getElementById('bfBitSizeVal');
    const hashCountInput = document.getElementById('bfHashCount');
    const hashCountVal = document.getElementById('bfHashCountVal');
    
    const insertInput = document.getElementById('bfInsertInput');
    const btnInsert = document.getElementById('btnBfInsert');
    const queryInput = document.getElementById('bfQueryInput');
    const btnQuery = document.getElementById('btnBfQuery');
    const btnReset = document.getElementById('btnBfReset');
    const btnSimulate = document.getElementById('btnBfSimulate');
    
    const statInserted = document.getElementById('bfStatInserted');
    const statBitsSet = document.getElementById('bfStatBitsSet');
    const statFPR = document.getElementById('bfStatFPR');
    const statEmpirical = document.getElementById('bfStatEmpirical');
    
    const bitGrid = document.getElementById('bfBitGrid');
    const bitLayoutTitle = document.getElementById('bfBitLayoutTitle');
    const solverContainer = document.getElementById('bfSolverContainer');
    const logContainer = document.getElementById('bfLogContainer');
    const loadingScreen = document.getElementById('loading-screen');

    // State Variables
    let m = parseInt(bitSizeInput.value) || 32;
    let k = parseInt(hashCountInput.value) || 3;
    let bitArray = new Array(m).fill(0);
    const insertedItems = new Set();
    // Maps bit index -> Set of items that set/mapped to this bit
    let bitMapping = Array.from({ length: m }, () => new Set());

    // FNV-1a 32-bit Hash Function
    function fnv1a(str, seed = 0) {
        let hash = 0x811c9dc5 ^ seed;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            // Multiply by FNV prime 16777619
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        return hash >>> 0;
    }

    // Generate k hash indices for a given item
    function getHashIndices(item, k, m) {
        const indices = [];
        const steps = [];
        for (let i = 0; i < k; i++) {
            const seed = i * 0x01000193;
            const hashVal = fnv1a(item, seed);
            const index = hashVal % m;
            indices.push(index);
            steps.push({
                hashIndex: i,
                seed: seed,
                hashVal: hashVal,
                index: index
            });
        }
        return { indices, steps };
    }

    // Calculate theoretical false positive rate
    function getTheoreticalFPR(m, k, n) {
        if (n === 0) return 0;
        // p = (1 - e^(-kn/m))^k
        return Math.pow(1 - Math.exp(-k * n / m), k);
    }

    // Write message to the visualizer logs
    function addLog(message, type = 'sys') {
        const entry = document.createElement('div');
        entry.className = `bf-log-entry ${type}`;
        entry.textContent = `> ${message}`;
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // Reset visualizer state
    function resetFilter() {
        m = parseInt(bitSizeInput.value);
        k = parseInt(hashCountInput.value);
        bitArray = new Array(m).fill(0);
        insertedItems.clear();
        bitMapping = Array.from({ length: m }, () => new Set());
        
        // Reset inputs and stats
        insertInput.value = '';
        queryInput.value = '';
        statEmpirical.textContent = '0.00%';
        
        updateStats();
        renderGrid();
        
        solverContainer.innerHTML = '<div class="bf-solver-placeholder">Enter or check an item to see hashing math steps.</div>';
        
        addLog(`Bloom Filter reset: m = ${m} bits, k = ${k} hash functions.`, 'sys');
    }

    // Update stats panel
    function updateStats() {
        const n = insertedItems.size;
        statInserted.textContent = n;
        
        const setBitsCount = bitArray.reduce((acc, val) => acc + val, 0);
        statBitsSet.textContent = `${setBitsCount} / ${m}`;
        
        const fpr = getTheoreticalFPR(m, k, n);
        statFPR.textContent = (fpr * 100).toFixed(2) + '%';
        
        bitLayoutTitle.textContent = `${m}-Bit Filter`;
    }

    // Render/rebuild the bit array grid elements
    function renderGrid() {
        bitGrid.innerHTML = '';
        
        for (let i = 0; i < m; i++) {
            const cell = document.createElement('div');
            cell.className = 'bf-bit-cell';
            cell.dataset.index = i;
            if (bitArray[i] === 1) {
                cell.classList.add('active');
            }
            
            const indexSpan = document.createElement('span');
            indexSpan.className = 'bf-bit-cell-idx';
            indexSpan.textContent = i;
            
            const valueSpan = document.createElement('span');
            valueSpan.className = 'bf-bit-cell-val';
            valueSpan.textContent = bitArray[i];
            
            cell.appendChild(indexSpan);
            cell.appendChild(valueSpan);
            
            // Set up rich tooltip describing mapped items (collisions)
            const mappedItems = bitMapping[i];
            if (mappedItems && mappedItems.size > 0) {
                const itemsList = Array.from(mappedItems).join(', ');
                cell.setAttribute('title', `Index ${i} is SET.\nMapped items: [${itemsList}]`);
            } else {
                cell.setAttribute('title', `Index ${i} is UNSET.`);
            }
            
            bitGrid.appendChild(cell);
        }
    }

    // Clear previous query/highlight classes
    function clearHighlights() {
        const cells = bitGrid.querySelectorAll('.bf-bit-cell');
        cells.forEach(cell => {
            cell.classList.remove('highlight-match', 'highlight-miss', 'pulse');
        });
    }

    // Render live step-by-step modulo math
    function renderSolverSteps(item, steps, isQuery = false) {
        solverContainer.innerHTML = '';
        
        const title = document.createElement('div');
        title.style.fontWeight = '600';
        title.style.marginBottom = '0.5rem';
        title.style.fontSize = '0.85rem';
        title.style.color = '#fff';
        title.textContent = `${isQuery ? 'Querying' : 'Inserting'} "${item}":`;
        solverContainer.appendChild(title);

        steps.forEach(step => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'bf-solver-step';
            
            // Format: Hash i: FNV1a("item", seed=seed) = hashVal -> hashVal % m = index
            stepDiv.innerHTML = `
                <span class="lbl">h${step.hashIndex + 1}("${item}"):</span> 
                Seed <span class="val">0x${step.seed.toString(16)}</span> → 
                FNV1a = <span class="val">${step.hashVal}</span> → 
                mod ${m} = <span class="res">${step.index}</span>
            `;
            solverContainer.appendChild(stepDiv);
        });
    }

    // Insert item into Bloom Filter
    function insertItem() {
        const item = insertInput.value.trim();
        if (!item) return;

        if (insertedItems.has(item)) {
            addLog(`"${item}" is already inserted in the filter.`, 'sys');
            insertInput.value = '';
            return;
        }

        clearHighlights();
        
        const { indices, steps } = getHashIndices(item, k, m);
        
        // Add to state
        insertedItems.add(item);
        indices.forEach(idx => {
            bitArray[idx] = 1;
            bitMapping[idx].add(item);
        });

        // Re-render and trigger animations
        renderGrid();
        updateStats();
        
        // Add visual pulse animation to the newly written bits
        indices.forEach(idx => {
            const cell = bitGrid.querySelector(`.bf-bit-cell[data-index="${idx}"]`);
            if (cell) {
                cell.classList.add('pulse');
            }
        });
        
        renderSolverSteps(item, steps, false);
        addLog(`Added "${item}" (Mapped to indices: [${indices.join(', ')}])`, 'add');
        
        insertInput.value = '';
    }

    // Query item membership
    function queryItem() {
        const item = queryInput.value.trim();
        if (!item) return;

        clearHighlights();

        const { indices, steps } = getHashIndices(item, k, m);
        let allBitsSet = true;
        
        // Check indices and highlight
        indices.forEach(idx => {
            const cell = bitGrid.querySelector(`.bf-bit-cell[data-index="${idx}"]`);
            if (bitArray[idx] === 1) {
                if (cell) cell.classList.add('highlight-match');
            } else {
                allBitsSet = false;
                if (cell) cell.classList.add('highlight-miss');
            }
        });

        renderSolverSteps(item, steps, true);

        if (allBitsSet) {
            // Probably present
            addLog(`Query for "${item}": PROBABLY PRESENT. (All matching bits [${indices.join(', ')}] are set)`, 'query');
        } else {
            // Definitely absent
            const unsetIndices = indices.filter(idx => bitArray[idx] === 0);
            addLog(`Query for "${item}": DEFINITELY ABSENT. (Unset bits at indices: [${unsetIndices.join(', ')}])`, 'sys');
        }

        // Keep highlight active for 2.5 seconds to let the user inspect the mapping
        setTimeout(clearHighlights, 2500);
        
        queryInput.value = '';
    }

    // Run empirical simulation of 500 absent queries to measure false-positive rate
    function runEmpiricalSimulation() {
        if (insertedItems.size === 0) {
            addLog("Simulation error: Add at least one item before running simulation.", "sys");
            alert("Please add some items to the Bloom Filter first to set some bits.");
            return;
        }

        btnSimulate.disabled = true;
        btnSimulate.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Simulating 500 Queries...';
        
        addLog("Starting Empirical False Positive Simulation (500 random queries)...", "sys");

        // We run in a short timeout to prevent blocking UI main thread
        setTimeout(() => {
            let falsePositives = 0;
            const simQueriesCount = 500;
            const simulatedAbsentItems = [];

            // Generate 500 unique strings that have not been inserted
            let currentIdx = 0;
            while (simulatedAbsentItems.length < simQueriesCount) {
                const candidate = `sim-absent-key-${currentIdx}`;
                if (!insertedItems.has(candidate)) {
                    simulatedAbsentItems.push(candidate);
                }
                currentIdx++;
            }

            // Test membership for each
            simulatedAbsentItems.forEach(absentItem => {
                const { indices } = getHashIndices(absentItem, k, m);
                const allSet = indices.every(idx => bitArray[idx] === 1);
                if (allSet) {
                    falsePositives++;
                }
            });

            const empiricalRate = falsePositives / simQueriesCount;
            const theoreticalRate = getTheoreticalFPR(m, k, insertedItems.size);

            statEmpirical.textContent = (empiricalRate * 100).toFixed(2) + '%';
            
            addLog(`Simulation Completed. False Positives: ${falsePositives}/${simQueriesCount} (${(empiricalRate * 100).toFixed(2)}%)`, 'fp');
            addLog(`Theoretical FPR: ${(theoreticalRate * 100).toFixed(2)}% | Absolute Deviation: ${Math.abs(empiricalRate - theoreticalRate).toFixed(4)}`, 'sys');

            btnSimulate.disabled = false;
            btnSimulate.innerHTML = '<i class="fas fa-flask"></i> Run Empirical FPR Simulation';
        }, 100);
    }

    // Event Listeners
    bitSizeInput.addEventListener('input', () => {
        bitSizeVal.textContent = `${bitSizeInput.value} bits`;
        resetFilter();
    });

    hashCountInput.addEventListener('input', () => {
        hashCountVal.textContent = `${hashCountInput.value} hashes`;
        resetFilter();
    });

    btnInsert.addEventListener('click', insertItem);
    insertInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') insertItem();
    });

    btnQuery.addEventListener('click', queryItem);
    queryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') queryItem();
    });

    btnReset.addEventListener('click', resetFilter);
    btnSimulate.addEventListener('click', runEmpiricalSimulation);

    // Initializer
    resetFilter();

    // Hide loading screen
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 300);
    }
});
