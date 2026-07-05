// ============================================
// MO'S ALGORITHM VISUALIZER
// ============================================

let array = [];
let queries = [];
let currentQueryIndex = 0;
let frequency = {};
let operations = 0;
let blockSize = 0;
let isRunning = false;
let isAutoPlaying = false;
let timeoutId = null;

// ============================================
// GENERATE ARRAY
// ============================================

function generateArray() {
    const size = Math.floor(Math.random() * 15) + 10;
    array = [];
    for (let i = 0; i < size; i++) {
        array.push(Math.floor(Math.random() * 10) + 1);
    }
    document.getElementById('arraySize').textContent = `Size: ${array.length}`;
    resetAll();
    renderArray();
    showMessage(`Generated array of size ${array.length} 📊`, 'info');
}

// ============================================
// GENERATE QUERIES
// ============================================

function generateQueries() {
    if (array.length === 0) {
        showMessage('Generate an array first! ⚠️', 'error');
        return;
    }
    
    const numQueries = Math.floor(Math.random() * 5) + 3;
    queries = [];
    const n = array.length;
    
    for (let i = 0; i < numQueries; i++) {
        const l = Math.floor(Math.random() * n);
        const r = Math.floor(Math.random() * (n - l)) + l;
        queries.push({ l, r, index: i });
    }
    
    // Sort queries for Mo's Algorithm
    blockSize = Math.floor(Math.sqrt(n));
    queries.sort((a, b) => {
        const blockA = Math.floor(a.l / blockSize);
        const blockB = Math.floor(b.l / blockSize);
        if (blockA !== blockB) return blockA - blockB;
        return a.r - b.r;
    });
    
    document.getElementById('queryInfo').textContent = `${queries.length} queries`;
    document.getElementById('blockSize').textContent = blockSize;
    renderQueries();
    showMessage(`Generated ${queries.length} queries 📋`, 'info');
}

// ============================================
// RENDER ARRAY
// ============================================

function renderArray(range = null) {
    const container = document.getElementById('arrayVisual');
    container.innerHTML = '';
    
    const maxVal = Math.max(...array, 1);
    
    array.forEach((val, i) => {
        const bar = document.createElement('div');
        bar.className = 'array-bar';
        const height = (val / maxVal) * 100;
        bar.style.height = `${Math.max(height, 20)}%`;
        bar.style.width = `${Math.max(80 / array.length, 20)}px`;
        bar.textContent = val;
        bar.dataset.index = i;
        
        if (range && i >= range.l && i <= range.r) {
            bar.classList.add('range');
        }
        
        container.appendChild(bar);
    });
}

// ============================================
// RENDER QUERIES
// ============================================

function renderQueries() {
    const container = document.getElementById('queryList');
    container.innerHTML = '';
    
    queries.forEach((q, i) => {
        const item = document.createElement('div');
        item.className = 'query-item';
        item.textContent = `[${q.l}, ${q.r}]`;
        item.dataset.index = i;
        if (i === currentQueryIndex) {
            item.classList.add('active');
        }
        container.appendChild(item);
    });
}

// ============================================
// RENDER FREQUENCY
// ============================================

function renderFrequency() {
    const container = document.getElementById('frequencyVisual');
    container.innerHTML = '';
    
    const sortedKeys = Object.keys(frequency).sort((a, b) => a - b);
    
    sortedKeys.forEach(key => {
        const item = document.createElement('div');
        item.className = 'freq-item';
        item.textContent = `${key}: ${frequency[key]}`;
        container.appendChild(item);
    });
}

// ============================================
// MO'S ALGORITHM
// ============================================

function addElement(val) {
    frequency[val] = (frequency[val] || 0) + 1;
    operations++;
    renderFrequency();
}

function removeElement(val) {
    if (frequency[val] > 0) {
        frequency[val]--;
        operations++;
        if (frequency[val] === 0) {
            delete frequency[val];
        }
        renderFrequency();
    }
}

function runAlgorithm() {
    if (array.length === 0 || queries.length === 0) {
        showMessage('Generate array and queries first! ⚠️', 'error');
        return;
    }
    
    if (isRunning) return;
    isRunning = true;
    currentQueryIndex = 0;
    frequency = {};
    operations = 0;
    
    document.getElementById('operationsCount').textContent = '0';
    renderFrequency();
    
    // Start with empty range
    let curL = 0;
    let curR = -1;
    
    function processNextQuery() {
        if (currentQueryIndex >= queries.length) {
            isRunning = false;
            isAutoPlaying = false;
            showMessage('✅ All queries processed!', 'success');
            document.getElementById('autoPlayBtn').innerHTML = '<i class="fas fa-play"></i> Auto Play';
            return;
        }
        
        const q = queries[currentQueryIndex];
        const l = q.l;
        const r = q.r;
        
        // Add/remove elements to match range
        while (curL > l) addElement(array[--curL]);
        while (curR < r) addElement(array[++curR]);
        while (curL < l) removeElement(array[curL++]);
        while (curR > r) removeElement(array[curR--]);
        
        // Update UI
        renderArray(q);
        renderQueries();
        document.getElementById('operationsCount').textContent = operations;
        document.getElementById('queryRange').textContent = `Range: [${l}, ${r}]`;
        
        // Calculate result (sum of distinct elements in range)
        const result = Object.keys(frequency).length;
        document.getElementById('queryResult').textContent = `Distinct: ${result}`;
        
        // Highlight current query
        const queryItems = document.querySelectorAll('.query-item');
        queryItems.forEach((item, i) => {
            item.classList.toggle('active', i === currentQueryIndex);
            item.classList.toggle('completed', i < currentQueryIndex);
        });
        
        currentQueryIndex++;
        
        // Schedule next step
        const speed = parseInt(document.getElementById('speedRange').value);
        timeoutId = setTimeout(() => {
            processNextQuery();
        }, speed);
    }
    
    // Start processing
    processNextQuery();
}

// ============================================
// STEP FORWARD
// ============================================

function stepForward() {
    if (isRunning) {
        // If currently running, stop and reset
        clearTimeout(timeoutId);
        isRunning = false;
        isAutoPlaying = false;
        document.getElementById('autoPlayBtn').innerHTML = '<i class="fas fa-play"></i> Auto Play';
    }
    
    if (array.length === 0 || queries.length === 0) {
        showMessage('Generate array and queries first! ⚠️', 'error');
        return;
    }
    
    if (currentQueryIndex >= queries.length) {
        showMessage('All queries processed! ✅', 'success');
        return;
    }
    
    // Process one query
    const q = queries[currentQueryIndex];
    const l = q.l;
    const r = q.r;
    
    // Quick mock: show range
    renderArray(q);
    document.getElementById('queryRange').textContent = `Range: [${l}, ${r}]`;
    
    // Highlight current query
    const queryItems = document.querySelectorAll('.query-item');
    queryItems.forEach((item, i) => {
        item.classList.toggle('active', i === currentQueryIndex);
        item.classList.toggle('completed', i < currentQueryIndex);
    });
    
    currentQueryIndex++;
    
    if (currentQueryIndex >= queries.length) {
        showMessage('✅ All queries processed!', 'success');
    }
}

// ============================================
// AUTO PLAY TOGGLE
// ============================================

function toggleAutoPlay() {
    if (isAutoPlaying) {
        isAutoPlaying = false;
        isRunning = false;
        clearTimeout(timeoutId);
        document.getElementById('autoPlayBtn').innerHTML = '<i class="fas fa-play"></i> Auto Play';
        return;
    }
    
    isAutoPlaying = true;
    document.getElementById('autoPlayBtn').innerHTML = '<i class="fas fa-pause"></i> Pause';
    runAlgorithm();
}

// ============================================
// RESET
// ============================================

function resetAll() {
    clearTimeout(timeoutId);
    isRunning = false;
    isAutoPlaying = false;
    currentQueryIndex = 0;
    frequency = {};
    operations = 0;
    
    document.getElementById('autoPlayBtn').innerHTML = '<i class="fas fa-play"></i> Auto Play';
    document.getElementById('operationsCount').textContent = '0';
    document.getElementById('queryRange').textContent = 'Range: [0, 0]';
    document.getElementById('queryResult').textContent = 'Result: 0';
    document.getElementById('blockSize').textContent = '0';
    
    renderArray();
    renderQueries();
    renderFrequency();
}

// ============================================
// SHOW MESSAGE
// ============================================

function showMessage(text, type = 'info') {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = `message ${type}`;
    msg.style.display = 'block';
    clearTimeout(msg._timeout);
    msg._timeout = setTimeout(() => {
        msg.style.display = 'none';
    }, 4000);
}

// ============================================
// SPEED CONTROL
// ============================================

document.getElementById('speedRange').addEventListener('input', function() {
    document.getElementById('speedLabel').textContent = this.value + 'ms';
});

// ============================================
// INITIALIZE
// ============================================

generateArray();
setTimeout(generateQueries, 500);
showMessage('Welcome to Mo\'s Algorithm Visualizer! 🎯', 'info');