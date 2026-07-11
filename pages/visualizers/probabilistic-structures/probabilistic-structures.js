/**
 * probabilistic-structures.js
 * Implements a high-speed data stream simulator, a Bloom Filter for membership testing,
 * and a HyperLogLog (HLL) structure for cardinality estimation.
 * Visualizes RAM savings and False Positives in real-time.
 */
/* global Chart */

document.addEventListener('DOMContentLoaded', () => {
  initEngine();
});

// ==========================================
// 1. ENGINE CONFIG & STATE
// ==========================================

const BLOOM_BITS = 256;
const BLOOM_HASHES = 3;
const HLL_REGISTERS = 64; // b=6 bits for index
const HLL_ALPHA = 0.709; // Alpha correction for m=64

const CMS_ROWS = 3;
const CMS_COLS = 16;

let state = {
  isRunning: false,
  intervalId: null,
  totalProcessed: 0,

  exactSet: new Set(), // Truth anchor
  exactFreq: new Map(), // Frequency truth anchor

  // Bloom State
  bloomBits: new Array(BLOOM_BITS).fill(0),
  bloomFalsePositives: 0,

  // HLL State
  hllRegisters: new Array(HLL_REGISTERS).fill(0),
  hllEstimate: 0,

  // CMS State
  cmsMatrix: Array(CMS_ROWS)
    .fill(0)
    .map(() => Array(CMS_COLS).fill(0)),
  cmsErrorSum: 0,

  // Charts
  chartTime: 0,
  cardChart: null,
  fpChart: null,

  // Data generation state for duplicates
  recentItems: [],
};

const els = {
  btnStart: document.getElementById('btnStartStream'),
  btnStop: document.getElementById('btnStopStream'),
  btnReset: document.getElementById('btnReset'),
  engineBadge: document.getElementById('engineBadge'),

  streamType: document.getElementById('streamType'),
  speedSlider: document.getElementById('speedSlider'),
  speedVal: document.getElementById('speedVal'),
  dupSlider: document.getElementById('dupSlider'),
  dupVal: document.getElementById('dupVal'),

  ramExact: document.getElementById('ramExact'),
  ramBloom: document.getElementById('ramBloom'),
  ramHLL: document.getElementById('ramHLL'),
  streamContainer: document.getElementById('streamContainer'),

  bloomGrid: document.getElementById('bloomGrid'),
  bloomCount: document.getElementById('bloomCount'),
  bloomFalsePos: document.getElementById('bloomFalsePos'),
  bloomErrorRate: document.getElementById('bloomErrorRate'),

  hllGrid: document.getElementById('hllGrid'),
  exactCount: document.getElementById('exactCount'),
  hllEstimateDisplay: document.getElementById('hllEstimate'),
  hllErrorMargin: document.getElementById('hllErrorMargin'),

  cmsGrid: document.getElementById('cmsGrid'),
  exactFreqAvg: document.getElementById('exactFreqAvg'),
  cmsFreqAvg: document.getElementById('cmsFreqAvg'),
  cmsErrorMargin: document.getElementById('cmsErrorMargin'),
};

// ==========================================
// 2. INITIALIZATION & UI
// ==========================================

function initEngine() {
  initGrids();
  initCharts();
  bindEvents();
}

function initGrids() {
  // Render Bloom Bits
  els.bloomGrid.innerHTML = '';
  for (let i = 0; i < BLOOM_BITS; i++) {
    const bit = document.createElement('div');
    bit.className = 'bit-cell';
    bit.id = `bbit-${i}`;
    bit.textContent = '0';
    els.bloomGrid.appendChild(bit);
  }

  // Render HLL Registers
  els.hllGrid.innerHTML = '';
  for (let i = 0; i < HLL_REGISTERS; i++) {
    const reg = document.createElement('div');
    reg.className = 'hll-reg';
    reg.id = `hll-${i}`;
    reg.textContent = '0';
    els.hllGrid.appendChild(reg);
  }

  // Render CMS Matrix
  els.cmsGrid.innerHTML = '';
  for (let r = 0; r < CMS_ROWS; r++) {
    for (let c = 0; c < CMS_COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'cms-cell';
      cell.id = `cms-${r}-${c}`;
      cell.textContent = '0';
      els.cmsGrid.appendChild(cell);
    }
  }
}

function bindEvents() {
  els.btnStart.addEventListener('click', toggleStream);
  els.btnStop.addEventListener('click', toggleStream);
  els.btnReset.addEventListener('click', resetEngine);

  els.speedSlider.addEventListener('input', (e) => {
    els.speedVal.textContent = `${e.target.value} msgs/sec`;
    if (state.isRunning) {
      clearInterval(state.intervalId);
      startLoop();
    }
  });

  els.dupSlider.addEventListener('input', (e) => (els.dupVal.textContent = `${e.target.value}%`));
}

function toggleStream() {
  if (state.isRunning) {
    state.isRunning = false;
    clearInterval(state.intervalId);
    els.btnStop.classList.add('hidden');
    els.btnStart.classList.remove('hidden');
    els.engineBadge.classList.remove('active');
    els.engineBadge.innerHTML = '<i class="fas fa-database"></i> Data Stream: Paused';
  } else {
    state.isRunning = true;
    els.btnStart.classList.add('hidden');
    els.btnStop.classList.remove('hidden');
    els.engineBadge.classList.add('active');
    els.engineBadge.innerHTML = '<i class="fas fa-satellite-dish"></i> Data Stream: Live';
    startLoop();
  }
}

function resetEngine() {
  if (state.isRunning) toggleStream();

  state.totalProcessed = 0;
  state.exactSet.clear();
  state.exactFreq.clear();
  state.bloomBits.fill(0);
  state.bloomFalsePositives = 0;
  state.hllRegisters.fill(0);
  state.hllEstimate = 0;
  state.cmsMatrix = Array(CMS_ROWS)
    .fill(0)
    .map(() => Array(CMS_COLS).fill(0));
  state.cmsErrorSum = 0;
  state.chartTime = 0;
  state.recentItems = [];

  els.streamContainer.innerHTML = '';

  initGrids();

  state.cardChart.data.labels = [];
  state.cardChart.data.datasets[0].data = [];
  state.cardChart.data.datasets[1].data = [];
  state.cardChart.update();

  state.fpChart.data.labels = [];
  state.fpChart.data.datasets[0].data = [];
  state.fpChart.update();

  updateTelemetryUI();
}

// ==========================================
// 3. CORE HASHING ALGORITHMS (Mocks)
// ==========================================

// Simple deterministic hash (FNV-1a 32-bit variant)
function hashString(str, seed = 0) {
  let h = 0x811c9dc5 ^ seed;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0; // Force unsigned 32-bit integer
}

// ==========================================
// 4. DATA STRUCTURE LOGIC
// ==========================================

function processItem(item) {
  state.totalProcessed++;
  const isNewToExactSet = !state.exactSet.has(item);
  if (isNewToExactSet) {
    state.exactSet.add(item);
  }

  // --- BLOOM FILTER LOGIC ---
  let allBitsWereSet = true;
  let bitsToFlip = [];

  for (let k = 0; k < BLOOM_HASHES; k++) {
    // Hash item with different seeds, map to array index
    const hash = hashString(item, k);
    const idx = hash % BLOOM_BITS;

    if (state.bloomBits[idx] === 0) {
      allBitsWereSet = false;
      state.bloomBits[idx] = 1;
      bitsToFlip.push(idx);
    }
  }

  // False Positive Check: Bloom filter thinks it's there (all bits set), but exact set says it's new
  if (allBitsWereSet && isNewToExactSet) {
    state.bloomFalsePositives++;
  }

  // Visual Updates for Bloom
  bitsToFlip.forEach((idx) => {
    const bitEl = document.getElementById(`bbit-${idx}`);
    if (bitEl) {
      bitEl.className = 'bit-cell active ping';
      bitEl.textContent = '1';
      setTimeout(() => bitEl.classList.remove('ping'), 300);
    }
  });

  // --- HYPERLOGLOG LOGIC ---
  // Use a single hash for HLL
  const hllHash = hashString(item, 42);

  // b=6 bits for index (0 to 63)
  const index = hllHash & 0x3f;

  // Remaining 26 bits to count leading zeros
  const w = hllHash >>> 6;
  // Count leading zeros (up to 26) + 1
  let rho = 1;
  let tempW = w;
  while ((tempW & 1) === 0 && rho <= 26) {
    rho++;
    tempW >>>= 1;
  }

  // Update register if new max found
  if (rho > state.hllRegisters[index]) {
    state.hllRegisters[index] = rho;

    // Visual Update
    const regEl = document.getElementById(`hll-${index}`);
    if (regEl) {
      regEl.textContent = rho;
      regEl.classList.add('updated');
      setTimeout(() => regEl.classList.remove('updated'), 300);
    }
  }

  // Recalculate HLL Estimate (Harmonic Mean)
  let harmonicSum = 0;
  for (let i = 0; i < HLL_REGISTERS; i++) {
    harmonicSum += Math.pow(2, -state.hllRegisters[i]);
  }
  const estimate = (HLL_ALPHA * Math.pow(HLL_REGISTERS, 2)) / harmonicSum;

  // Small range correction (simplified)
  state.hllEstimate = Math.round(estimate);

  // --- COUNT-MIN SKETCH LOGIC ---
  let minFreq = Infinity;

  state.exactFreq.set(item, (state.exactFreq.get(item) || 0) + 1);

  for (let r = 0; r < CMS_ROWS; r++) {
    // Use different seed for each row
    const cmsHash = hashString(item, 100 + r);
    const c = cmsHash % CMS_COLS;

    state.cmsMatrix[r][c]++;

    if (state.cmsMatrix[r][c] < minFreq) {
      minFreq = state.cmsMatrix[r][c];
    }

    // Visual Update
    const cellEl = document.getElementById(`cms-${r}-${c}`);
    if (cellEl) {
      cellEl.textContent = state.cmsMatrix[r][c];
      cellEl.classList.add('updated');
      setTimeout(() => cellEl.classList.remove('updated'), 200);
    }
  }

  const exactFreq = state.exactFreq.get(item);
  state.cmsErrorSum += minFreq - exactFreq;

  // Render firehose item
  renderStreamItem(item);
}

// ==========================================
// 5. ENGINE LOOP & TELEMETRY
// ==========================================

function startLoop() {
  const msgsPerSec = parseInt(els.speedSlider.value);
  const msPerTick = 1000 / msgsPerSec;

  // To prevent browser freezing at high speeds, we batch process
  // If interval < 16ms (60fps), we process multiple items per tick
  let itemsPerTick = 1;
  let tickMs = msPerTick;

  if (msPerTick < 16) {
    tickMs = 16;
    itemsPerTick = Math.ceil(16 / msPerTick);
  }

  state.intervalId = setInterval(() => {
    for (let i = 0; i < itemsPerTick; i++) {
      const item = generateData();
      processItem(item);
    }

    // Throttle heavy UI updates
    if (state.totalProcessed % 5 === 0) {
      updateTelemetryUI();
    }
    if (state.totalProcessed % 20 === 0) {
      updateCharts();
    }
  }, tickMs);
}

function generateData() {
  const isIp = els.streamType.value === 'ip';
  const dupRate = parseInt(els.dupSlider.value) / 100;

  // Chance to generate a duplicate item
  if (Math.random() < dupRate && state.recentItems.length > 0) {
    return state.recentItems[Math.floor(Math.random() * state.recentItems.length)];
  }

  let newItem;
  if (isIp) {
    newItem = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  } else {
    newItem = `User_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  state.recentItems.push(newItem);
  if (state.recentItems.length > 100) state.recentItems.shift(); // Keep recent pool small

  return newItem;
}

function renderStreamItem(item) {
  const el = document.createElement('div');
  el.className = 'stream-item';
  el.textContent = item;

  // Randomize horizontal position
  el.style.left = `${Math.floor(Math.random() * 80)}%`;

  els.streamContainer.appendChild(el);

  // Cleanup DOM
  setTimeout(() => {
    if (el.parentNode) el.remove();
  }, 1500);
}

function updateTelemetryUI() {
  const exactCount = state.exactSet.size;

  // Update Counts
  els.bloomCount.textContent = state.totalProcessed.toLocaleString();
  els.bloomFalsePos.textContent = state.bloomFalsePositives.toLocaleString();

  const errRate =
    state.totalProcessed > 0 ? (state.bloomFalsePositives / state.totalProcessed) * 100 : 0;
  els.bloomErrorRate.textContent = `${errRate.toFixed(2)}%`;

  els.exactCount.textContent = exactCount.toLocaleString();
  els.hllEstimateDisplay.textContent = state.hllEstimate.toLocaleString();

  const hllErr = exactCount > 0 ? Math.abs((state.hllEstimate - exactCount) / exactCount) * 100 : 0;
  els.hllErrorMargin.textContent = `±${hllErr.toFixed(2)}%`;

  // Update CMS Telemetry
  if (state.totalProcessed > 0 && state.exactFreq.size > 0) {
    const avgExactFreq = state.totalProcessed / state.exactFreq.size;
    const avgCMSFreq = avgExactFreq + state.cmsErrorSum / state.totalProcessed; // Approx avg returned by CMS

    els.exactFreqAvg.textContent = avgExactFreq.toFixed(2);
    els.cmsFreqAvg.textContent = avgCMSFreq.toFixed(2);
    els.cmsErrorMargin.textContent = `+${(state.cmsErrorSum / state.totalProcessed).toFixed(2)}`;
  } else {
    els.exactFreqAvg.textContent = '0';
    els.cmsFreqAvg.textContent = '0';
    els.cmsErrorMargin.textContent = '0.00';
  }

  // Calculate RAM (Estimations)
  // String length * 2 bytes + overhead (~15 bytes per entry in exact set)
  const exactBytes = exactCount * 15;
  els.ramExact.textContent = formatBytes(exactBytes);

  // Bloom Filter is exactly BLOOM_BITS / 8 bytes
  els.ramBloom.textContent = formatBytes(BLOOM_BITS / 8);

  // HLL is exactly HLL_REGISTERS bytes (1 byte per register holds counts up to 255)
  els.ramHLL.textContent = formatBytes(HLL_REGISTERS);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==========================================
// 6. CHART.JS VISUALIZATIONS
// ==========================================
function initCharts() {
  const ctxCard = document.getElementById('cardinalityChart').getContext('2d');
  state.cardChart = new Chart(ctxCard, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Exact Set',
          data: [],
          borderColor: '#94a3b8',
          borderDash: [5, 5],
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 0,
        },
        {
          label: 'HLL Estimate',
          data: [],
          borderColor: '#c084fc', // prob-hll
          backgroundColor: 'rgba(192, 132, 252, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        y: { beginAtZero: true, grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
        x: { display: false },
      },
      plugins: { legend: { display: false } },
    },
  });

  const ctxFP = document.getElementById('fpChart').getContext('2d');
  state.fpChart = new Chart(ctxFP, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'False Positives',
          data: [],
          borderColor: '#f59e0b', // prob-bloom
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        y: { beginAtZero: true, grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
        x: { display: false },
      },
      plugins: { legend: { display: false } },
    },
  });
}

function updateCharts() {
  state.chartTime++;

  state.cardChart.data.labels.push(state.chartTime);
  state.cardChart.data.datasets[0].data.push(state.exactSet.size);
  state.cardChart.data.datasets[1].data.push(state.hllEstimate);

  state.fpChart.data.labels.push(state.chartTime);
  state.fpChart.data.datasets[0].data.push(state.bloomFalsePositives);

  // Keep charts moving
  if (state.cardChart.data.labels.length > 50) {
    state.cardChart.data.labels.shift();
    state.cardChart.data.datasets[0].data.shift();
    state.cardChart.data.datasets[1].data.shift();

    state.fpChart.data.labels.shift();
    state.fpChart.data.datasets[0].data.shift();
  }

  state.cardChart.update();
  state.fpChart.update();
}
