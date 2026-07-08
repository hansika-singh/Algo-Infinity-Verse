/**
 * sorting-visualizer.js
 * Visualizes standard O(n^2) algorithms and complex O(n log n) Divide and Conquer algorithms.
 * Utilizes AbortController for safe asynchronous interruption and DOM updates.
 */

document.addEventListener("DOMContentLoaded", () => {
    initSortingVisualizer();
});

// ==========================================
// 1. STATE & CONSTANTS
// ==========================================
let array = [];
let delay = 50;
let isSorting = false;
let abortController = null;

const COLORS = {
    BASE: 'var(--bar-base)',
    COMPARE: 'var(--bar-compare)',
    SWAP: 'var(--bar-swap)',
    SORTED: 'var(--bar-sorted)',
    PIVOT: 'var(--bar-pivot)'
};

const ALGO_DETAILS = {
    'bubble': { title: 'Bubble Sort', desc: 'Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.', time: 'O(n²)', space: 'O(1)' },
    'selection': { title: 'Selection Sort', desc: 'Divides the input list into two parts: a sorted sublist and an unsorted sublist. Continuously finds the minimum element and moves it to the sorted part.', time: 'O(n²)', space: 'O(1)' },
    'insertion': { title: 'Insertion Sort', desc: 'Builds the final sorted array one item at a time. It iterates, consuming one input element each repetition, and grows a sorted output list.', time: 'O(n²)', space: 'O(1)' },
    'merge': { title: 'Merge Sort', desc: 'A divide-and-conquer algorithm that recursively splits the array in half, sorts the halves, and merges them back together.', time: 'O(n log n)', space: 'O(n)' },
    'quick': { title: 'Quick Sort', desc: 'Picks an element as pivot and partitions the given array around the picked pivot by placing it in its correct position in sorted array.', time: 'O(n log n)', space: 'O(log n)' }
};

const els = {
    container: document.getElementById('barsContainer'),
    algoSelect: document.getElementById('algoSelect'),
    sizeSlider: document.getElementById('sizeSlider'),
    speedSlider: document.getElementById('speedSlider'),
    sizeValue: document.getElementById('sizeValue'),
    speedValue: document.getElementById('speedValue'),
    btnGenerate: document.getElementById('btnGenerate'),
    btnSort: document.getElementById('btnSort'),
    engineBadge: document.getElementById('engineBadge'),
    algoInfo: document.getElementById('algoInfo')
};

// ==========================================
// 2. INITIALIZATION & EVENTS
// ==========================================
function initSortingVisualizer() {
    updateAlgoInfo();
    generateArray();
    bindEvents();
}

function bindEvents() {
    els.btnGenerate.addEventListener('click', () => {
        if (isSorting) resetEngine();
        generateArray();
    });

    els.btnSort.addEventListener('click', async () => {
        if (isSorting) {
            resetEngine();
            return;
        }
        await startSort();
    });

    els.sizeSlider.addEventListener('input', (e) => {
        els.sizeValue.textContent = e.target.value;
        if (!isSorting) generateArray();
    });

    els.speedSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        delay = val;
        // Label logic
        if (val < 20) els.speedValue.textContent = "Very Fast";
        else if (val < 50) els.speedValue.textContent = "Fast";
        else if (val < 80) els.speedValue.textContent = "Medium";
        else els.speedValue.textContent = "Slow";
    });

    els.algoSelect.addEventListener('change', updateAlgoInfo);
}

function updateAlgoInfo() {
    const data = ALGO_DETAILS[els.algoSelect.value];
    els.algoInfo.innerHTML = `
        <h5>${data.title}</h5>
        <p>${data.desc}</p>
        <div class="complexity-grid">
            <div class="comp-item"><span>Time (Avg):</span> <strong>${data.time}</strong></div>
            <div class="comp-item"><span>Space:</span> <strong>${data.space}</strong></div>
        </div>
    `;
}

// ==========================================
// 3. ARRAY MANAGEMENT & RENDERING
// ==========================================
function generateArray() {
    array = [];
    els.container.innerHTML = '';
    const size = parseInt(els.sizeSlider.value);
    
    for (let i = 0; i < size; i++) {
        // Values from 5 to 100 to ensure visibility
        const value = Math.floor(Math.random() * 96) + 5; 
        array.push(value);
        
        const bar = document.createElement('div');
        bar.classList.add('array-bar');
        bar.style.height = `${value}%`;
        bar.id = `bar-${i}`;
        els.container.appendChild(bar);
    }
}

function resetEngine() {
    if (abortController) {
        abortController.abort(); // Cancel active sorting animations
    }
    isSorting = false;
    els.btnSort.innerHTML = '<i class="fas fa-play"></i> Start Sorting';
    els.btnSort.className = 'btn btn-primary w-100';
    els.engineBadge.className = 'engine-badge';
    els.engineBadge.innerHTML = '<i class="fas fa-chart-bar"></i> Sorting Engine: Idle';
    els.algoSelect.disabled = false;
    els.sizeSlider.disabled = false;
}

// Helpers for visual updates
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getBar(index) {
    return document.getElementById(`bar-${index}`);
}

function setHeight(index, height) {
    getBar(index).style.height = `${height}%`;
}

function setColor(index, color) {
    getBar(index).style.backgroundColor = color;
}

async function swapBars(i, j) {
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
    
    setHeight(i, array[i]);
    setHeight(j, array[j]);
}

// ==========================================
// 4. SORTING ENGINE CONTROLLER
// ==========================================
async function startSort() {
    isSorting = true;
    abortController = new AbortController();
    const signal = abortController.signal;
    
    els.btnSort.innerHTML = '<i class="fas fa-stop"></i> Stop Execution';
    els.btnSort.className = 'btn btn-danger w-100';
    els.engineBadge.className = 'engine-badge active';
    els.engineBadge.innerHTML = '<i class="fas fa-cog fa-spin"></i> Engine Running...';
    
    // Disable inputs to prevent mid-sort corruption
    els.algoSelect.disabled = true;
    els.sizeSlider.disabled = true;

    // Reset colors
    for(let i=0; i<array.length; i++) setColor(i, COLORS.BASE);

    const algo = els.algoSelect.value;
    try {
        if (algo === 'bubble') await bubbleSort(signal);
        else if (algo === 'selection') await selectionSort(signal);
        else if (algo === 'insertion') await insertionSort(signal);
        else if (algo === 'merge') await mergeSortWrapper(signal);
        else if (algo === 'quick') await quickSortWrapper(signal);

        // Verification Sweep (Green confirmation wave)
        if (!signal.aborted) {
            for(let i=0; i<array.length; i++) {
                if (signal.aborted) throw new Error("aborted");
                setColor(i, COLORS.SORTED);
                await sleep(10);
            }
            els.engineBadge.innerHTML = '<i class="fas fa-check-circle"></i> Array Sorted';
        }
    } catch (err) {
        if (err.message !== "aborted") console.error(err);
        // If aborted intentionally, we just exit quietly
    } finally {
        isSorting = false;
        els.btnSort.innerHTML = '<i class="fas fa-play"></i> Start Sorting';
        els.btnSort.className = 'btn btn-primary w-100';
        els.algoSelect.disabled = false;
        els.sizeSlider.disabled = false;
        
        if (abortController.signal.aborted) {
            els.engineBadge.className = 'engine-badge';
            els.engineBadge.innerHTML = '<i class="fas fa-chart-bar"></i> Sorting Engine: Idle';
        }
    }
}

// ==========================================
// 5. ALGORITHMS O(n²)
// ==========================================

async function bubbleSort(signal) {
    let n = array.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (signal.aborted) throw new Error("aborted");
            
            setColor(j, COLORS.COMPARE);
            setColor(j + 1, COLORS.COMPARE);
            await sleep(delay);

            if (array[j] > array[j + 1]) {
                setColor(j, COLORS.SWAP);
                setColor(j + 1, COLORS.SWAP);
                await sleep(delay);
                await swapBars(j, j + 1);
            }

            setColor(j, COLORS.BASE);
            setColor(j + 1, COLORS.BASE);
        }
        // Element at n-i-1 is in correct place
        setColor(n - i - 1, COLORS.SORTED);
    }
    setColor(0, COLORS.SORTED);
}

async function selectionSort(signal) {
    let n = array.length;
    for (let i = 0; i < n; i++) {
        let minIdx = i;
        setColor(i, COLORS.PIVOT); // highlight current position
        
        for (let j = i + 1; j < n; j++) {
            if (signal.aborted) throw new Error("aborted");
            
            setColor(j, COLORS.COMPARE);
            await sleep(delay);

            if (array[j] < array[minIdx]) {
                if (minIdx !== i) setColor(minIdx, COLORS.BASE);
                minIdx = j;
                setColor(minIdx, COLORS.SWAP);
            } else {
                setColor(j, COLORS.BASE);
            }
        }
        
        if (signal.aborted) throw new Error("aborted");
        if (minIdx !== i) {
            await swapBars(i, minIdx);
        }
        setColor(minIdx, COLORS.BASE);
        setColor(i, COLORS.SORTED);
    }
}

async function insertionSort(signal) {
    let n = array.length;
    setColor(0, COLORS.SORTED);
    
    for (let i = 1; i < n; i++) {
        let key = array[i];
        let j = i - 1;
        setColor(i, COLORS.COMPARE);
        await sleep(delay);

        while (j >= 0 && array[j] > key) {
            if (signal.aborted) throw new Error("aborted");
            
            setColor(j, COLORS.SWAP);
            array[j + 1] = array[j];
            setHeight(j + 1, array[j]);
            
            await sleep(delay);
            
            setColor(j + 1, COLORS.SORTED);
            j = j - 1;
        }
        array[j + 1] = key;
        setHeight(j + 1, key);
        setColor(j + 1, COLORS.SORTED);
    }
}

// ==========================================
// 6. ALGORITHMS O(n log n)
// ==========================================

async function mergeSortWrapper(signal) {
    await mergeSort(0, array.length - 1, signal);
}

async function mergeSort(l, r, signal) {
    if (l >= r) return;
    const m = Math.floor(l + (r - l) / 2);
    
    await mergeSort(l, m, signal);
    await mergeSort(m + 1, r, signal);
    await merge(l, m, r, signal);
}

async function merge(l, m, r, signal) {
    let n1 = m - l + 1;
    let n2 = r - m;
    let L = new Array(n1);
    let R = new Array(n2);

    for (let i = 0; i < n1; i++) L[i] = array[l + i];
    for (let j = 0; j < n2; j++) R[j] = array[m + 1 + j];

    let i = 0, j = 0, k = l;

    while (i < n1 && j < n2) {
        if (signal.aborted) throw new Error("aborted");
        
        setColor(l + i, COLORS.COMPARE);
        setColor(m + 1 + j, COLORS.COMPARE);
        await sleep(delay);

        if (L[i] <= R[j]) {
            array[k] = L[i];
            setHeight(k, L[i]);
            setColor(k, COLORS.SWAP);
            i++;
        } else {
            array[k] = R[j];
            setHeight(k, R[j]);
            setColor(k, COLORS.SWAP);
            j++;
        }
        await sleep(delay);
        setColor(k, COLORS.BASE);
        k++;
    }

    while (i < n1) {
        if (signal.aborted) throw new Error("aborted");
        array[k] = L[i];
        setHeight(k, L[i]);
        setColor(k, COLORS.SWAP);
        await sleep(delay);
        setColor(k, COLORS.BASE);
        i++; k++;
    }

    while (j < n2) {
        if (signal.aborted) throw new Error("aborted");
        array[k] = R[j];
        setHeight(k, R[j]);
        setColor(k, COLORS.SWAP);
        await sleep(delay);
        setColor(k, COLORS.BASE);
        j++; k++;
    }
}

async function quickSortWrapper(signal) {
    await quickSort(0, array.length - 1, signal);
}

async function quickSort(low, high, signal) {
    if (low < high) {
        let pi = await partition(low, high, signal);
        
        setColor(pi, COLORS.SORTED);
        
        await quickSort(low, pi - 1, signal);
        await quickSort(pi + 1, high, signal);
    } else if (low === high && low >= 0) {
        setColor(low, COLORS.SORTED);
    }
}

async function partition(low, high, signal) {
    let pivot = array[high];
    setColor(high, COLORS.PIVOT); // Mark pivot visually
    
    let i = low - 1;

    for (let j = low; j <= high - 1; j++) {
        if (signal.aborted) throw new Error("aborted");
        
        setColor(j, COLORS.COMPARE);
        await sleep(delay);

        if (array[j] < pivot) {
            i++;
            setColor(i, COLORS.SWAP);
            setColor(j, COLORS.SWAP);
            await sleep(delay);
            await swapBars(i, j);
            setColor(i, COLORS.BASE);
        }
        setColor(j, COLORS.BASE);
    }
    
    if (signal.aborted) throw new Error("aborted");
    
    setColor(i + 1, COLORS.SWAP);
    setColor(high, COLORS.SWAP);
    await sleep(delay);
    await swapBars(i + 1, high);
    
    setColor(high, COLORS.BASE);
    return i + 1;
}
