// ==========================================================================
// ALGORITHM MUSIC COMPOSER - Web Audio API Synthesizer & Simulators
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  initComposer();
});

// Web Audio API Globals
let audioCtx = null;
let masterGainNode = null;
let analyserNode = null;
let canvasCtx = null;
let drawVisual = null;

// Composer Playback States
let currentMCAlgo = "mergesort";
let selectedWaveType = "sine";
let volumeLevel = 0.6;
let tempoBPM = 120;
let isPlaying = false;
let playbackTimer = null;
let currentStepIdx = 0;
let simulationSteps = [];

// Sequence timeline UI
let stepChips = [];
let lastPlayedChipIdx = -1;

// Visual sync
let noteIndicatorTimeout = null;


// Visualizer State data
let activeVisualBars = [];
let bfsGraphNodes = [];
let dfsTreeNodes = [];

// Musical Scale Frequencies (C-Major pentatonic extended, harmonically pleasing)
const SCALE_FREQS = [
  130.81, // C3
  146.83, // D3
  164.81, // E3
  196.00, // G3
  220.00, // A3
  261.63, // C4 (Middle C)
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
  1046.50 // C6
];

// Sonification Descriptions
const EXPLANATIONS = {
  mergesort: {
    title: "Merge Sort (Classical Piano)",
    desc: "Array element heights are mapped to C-major frequencies. As Merge Sort splits arrays recursively, you hear short arpeggios representing subproblem separations. The merge phase compares adjacent elements, playing comparative notes, and writes sorted values in ascending pitch order, culminating in a clear, resolved ascending scale.",
    mapping: "Array Index = Left-to-Right Position | Element Value = Pitch Frequency"
  },
  bfs: {
    title: "BFS Traversal (Rhythmic Pulse)",
    desc: "BFS explores nodes level-by-level using a Queue. Sonification maps queue operations to a rhythmic pulse. Popping a node triggers a low, synthetic drum-like kick, while queuing neighbors plays rapid high-pitched bleeps (synced to node coordinates). This creates a rhythmic tempo that reflects the widening breadth of the search.",
    mapping: "Active Vertex = Rhythmic Beat | Neighbor Discovered = High Pitch Pulse"
  },
  dfs: {
    title: "DFS Traversal (Deep Ambient)",
    desc: "DFS plunges deep down a branch before backtracking. Sonification creates a thick, atmospheric ambient pad. As DFS dives deeper, the oscillator pitches step lower and detune, creating a heavy, echo-like drone. Backtracking resolves the pitch upwards, mimicking surfacing from a deep cavern.",
    mapping: "Traversal Depth = Pitch Octave (Lower is Deeper) | Backtracking = Pitch Ascension"
  }
};

// ──────────────────────────────────────────────────────────────────────────
// 🛠️ INITIALIZATION & CONTROLS BINDINGS
// ──────────────────────────────────────────────────────────────────────────
function initComposer() {
  // HTML elements
  const btnPlay = document.getElementById("btn-play");
  const btnReset = document.getElementById("btn-reset");
  const selectAlgo = document.getElementById("select-mc-algo");
  const selectWave = document.getElementById("select-osc-type");
  const sliderVol = document.getElementById("slider-volume");
  const sliderTempo = document.getElementById("slider-tempo");
  const valVol = document.getElementById("display-val-volume");
  const valTempo = document.getElementById("display-val-tempo");

  // Initial stage drawing based on default algorithm
  changeAlgorithm(selectAlgo.value);

  // Selector handlers
  selectAlgo.addEventListener("change", () => {
    changeAlgorithm(selectAlgo.value);
  });

  selectWave.addEventListener("change", () => {
    selectedWaveType = selectWave.value;
  });

  // Slider bindings
  sliderVol.addEventListener("input", () => {
    volumeLevel = parseFloat(sliderVol.value) / 100;
    valVol.textContent = `${sliderVol.value}%`;
    if (masterGainNode) {
      masterGainNode.gain.setValueAtTime(volumeLevel, audioCtx.currentTime);
    }
  });

  sliderTempo.addEventListener("input", () => {
    tempoBPM = parseInt(sliderTempo.value);
    valTempo.textContent = `${tempoBPM} BPM`;
    if (isPlaying) {
      // Dynamic tempo adjusting: restart playback loop
      pausePlayback();
      startPlayback();
    }
  });

  // Action Buttons
  btnPlay.addEventListener("click", () => {
    if (isPlaying) {
      pausePlayback();
      btnPlay.innerHTML = `<i class="fas fa-play"></i> Start Sequence`;
    } else {
      ensureAudioContext();
      startPlayback();
      btnPlay.innerHTML = `<i class="fas fa-pause"></i> Pause`;
    }
  });

  btnReset.addEventListener("click", () => {
    resetComposer();
    btnPlay.innerHTML = `<i class="fas fa-play"></i> Start Sequence`;
  });

  // Hide platform loading screen
  const s = document.getElementById("loading-screen");
  if (s) s.classList.add("hidden");
}

function changeAlgorithm(algo) {
  stopPlayback();
  currentMCAlgo = algo;
  currentStepIdx = 0;

  // Render text descriptions
  const exp = EXPLANATIONS[algo];
  const explainPanel = document.getElementById("composer-explanation-content");
  explainPanel.innerHTML = `
    <div class="mc-exp-title">${exp.title}</div>
    <p class="mc-exp-desc">${exp.desc}</p>
    <div class="mc-exp-mapping"><i class="fas fa-circle-nodes"></i> ${exp.mapping}</div>
  `;

  // Draw initial visual graphics
  drawInitialStage();

  // Compile the simulation steps
  compileSimulationSteps();

  document.getElementById("composer-status-badge").textContent = "Ready";
  document.getElementById("composer-status-badge").className = "visualizer-status";
}

// ──────────────────────────────────────────────────────────────────────────
// 🔊 WEB AUDIO API CORE SYNTHESIZER
// ──────────────────────────────────────────────────────────────────────────
function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create master gain control
    masterGainNode = audioCtx.createGain();
    masterGainNode.gain.setValueAtTime(volumeLevel, audioCtx.currentTime);
    
    // Create AnalyserNode
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 64;

    // Connect nodes
    masterGainNode.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);

    // Start canvas spectrum analyzer rendering loop
    initSpectrumAnalyzer();

    document.getElementById("audio-context-status").innerHTML = `<i class="fas fa-volume-high"></i> Active`;
    document.getElementById("audio-context-status").className = "live-badge playing";
  }

  // Resume context if suspended (Chrome autoplay policies)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function playSynthNote(freq, duration, type) {
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const envelope = audioCtx.createGain();

  osc.type = type || selectedWaveType;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  // Soft envelope to prevent clicks
  envelope.gain.setValueAtTime(0, audioCtx.currentTime);
  envelope.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.015);
  envelope.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration - 0.01);

  osc.connect(envelope);
  envelope.connect(masterGainNode);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

// Custom sound for BFS kicks
function playBfsPulse() {
  if (!audioCtx) return;
  
  // A low frequency kick drum synth
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = "sine";
  osc.frequency.setValueAtTime(140, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.15);
  
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
  
  osc.connect(gain);
  gain.connect(masterGainNode);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.16);
}

// ──────────────────────────────────────────────────────────────────────────
// 📊 CANVAS SPECTRUM ANALYZER
// ──────────────────────────────────────────────────────────────────────────
function initSpectrumAnalyzer() {
  const canvas = document.getElementById("analyser-canvas");
  canvasCtx = canvas.getContext("2d");
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  function draw() {
    drawVisual = requestAnimationFrame(draw);
    analyserNode.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = "#0c0c16";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 1.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] * 0.4;

      // Draw custom glowing neon lines
      const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, "rgba(139, 92, 246, 0.4)");
      gradient.addColorStop(1, "rgba(6, 182, 212, 1.0)");

      canvasCtx.fillStyle = gradient;
      canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

      x += barWidth;
    }
  }

  draw();
}

// ──────────────────────────────────────────────────────────────────────────
// 🎨 DYNAMIC SVG STAGE INITIAL DRAW
// ──────────────────────────────────────────────────────────────────────────
function drawInitialStage() {
  const svg = document.getElementById("stage-svg");
  svg.innerHTML = "";

  if (currentMCAlgo === "mergesort") {
    // Generate 16 array values (C-Major scale bounds)
    activeVisualBars = [12, 4, 15, 1, 9, 5, 13, 2, 11, 7, 0, 3, 10, 6, 14, 8];
    const width = 30;
    const gap = 8;
    const startX = (svg.clientWidth - (16 * width + 15 * gap)) / 2 || 50;

    activeVisualBars.forEach((val, idx) => {
      const height = 40 + val * 18;
      const x = startX + idx * (width + gap);
      const y = 320 - height;

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", width);
      rect.setAttribute("height", height);
      rect.setAttribute("class", "mc-bar");
      rect.setAttribute("id", `bar-${idx}`);
      svg.appendChild(rect);

      // Label value under bar
      const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
      txt.setAttribute("x", x + width/2);
      txt.setAttribute("y", 340);
      // Theme-aware: color is controlled by CSS via `currentColor`
      txt.setAttribute("fill", "currentColor");
      txt.setAttribute("font-family", "'Fira Code', sans-serif");
      txt.setAttribute("font-size", "10px");
      txt.setAttribute("text-anchor", "middle");
      txt.textContent = val;
      svg.appendChild(txt);
    });

  } else if (currentMCAlgo === "bfs") {
    // Concentric rings layout for BFS traversal
    // Node positions (0: center, 1-3: ring 1, 4-9: ring 2)
    bfsGraphNodes = [
      { id: 0, x: 320, y: 190, label: "Root" },
      { id: 1, x: 220, y: 130, label: "A" },
      { id: 2, x: 420, y: 130, label: "B" },
      { id: 3, x: 320, y: 290, label: "C" },
      { id: 4, x: 140, y: 90, label: "A1" },
      { id: 5, x: 190, y: 220, label: "A2" },
      { id: 6, x: 500, y: 90, label: "B1" },
      { id: 7, x: 450, y: 220, label: "B2" },
      { id: 8, x: 240, y: 340, label: "C1" },
      { id: 9, x: 400, y: 340, label: "C2" }
    ];

    const edges = [
      { from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 },
      { from: 1, to: 4 }, { from: 1, to: 5 },
      { from: 2, to: 6 }, { from: 2, to: 7 },
      { from: 3, to: 8 }, { from: 3, to: 9 }
    ];

    // Draw Edges
    edges.forEach(e => {
      const fromNode = bfsGraphNodes[e.from];
      const toNode = bfsGraphNodes[e.to];
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", fromNode.x);
      line.setAttribute("y1", fromNode.y);
      line.setAttribute("x2", toNode.x);
      line.setAttribute("y2", toNode.y);
      line.setAttribute("class", "mc-edge-line");
      line.setAttribute("id", `edge-${e.from}-${e.to}`);
      svg.appendChild(line);
    });

    // Draw Nodes
    bfsGraphNodes.forEach(node => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "mc-node");
      g.setAttribute("id", `node-${node.id}`);

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", node.x);
      circle.setAttribute("cy", node.y);
      circle.setAttribute("r", "16");
      circle.setAttribute("class", "mc-node-circle");
      
      const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
      txt.setAttribute("x", node.x);
      txt.setAttribute("y", node.y + 4);
      txt.setAttribute("class", "mc-node-text");
      txt.textContent = node.id;

      g.appendChild(circle);
      g.appendChild(txt);
      svg.appendChild(g);
    });

  } else if (currentMCAlgo === "dfs") {
    // Hierarchical binary tree layout for DFS
    dfsTreeNodes = [
      { id: 0, x: 320, y: 40, depth: 0 },
      { id: 1, x: 180, y: 120, depth: 1 },
      { id: 2, x: 460, y: 120, depth: 1 },
      { id: 3, x: 100, y: 220, depth: 2 },
      { id: 4, x: 260, y: 220, depth: 2 },
      { id: 5, x: 380, y: 220, depth: 2 },
      { id: 6, x: 540, y: 220, depth: 2 },
      { id: 7, x: 60, y: 320, depth: 3 },
      { id: 8, x: 140, y: 320, depth: 3 },
      { id: 9, x: 220, y: 320, depth: 3 },
      { id: 10, x: 300, y: 320, depth: 3 }
    ];

    const edges = [
      { from: 0, to: 1 }, { from: 0, to: 2 },
      { from: 1, to: 3 }, { from: 1, to: 4 },
      { from: 2, to: 5 }, { from: 2, to: 6 },
      { from: 3, to: 7 }, { from: 3, to: 8 },
      { from: 4, to: 9 }, { from: 4, to: 10 }
    ];

    // Draw Edges
    edges.forEach(e => {
      const fromNode = dfsTreeNodes[e.from];
      const toNode = dfsTreeNodes[e.to];
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", fromNode.x);
      line.setAttribute("y1", fromNode.y);
      line.setAttribute("x2", toNode.x);
      line.setAttribute("y2", toNode.y);
      line.setAttribute("class", "mc-edge-line");
      line.setAttribute("id", `edge-${e.from}-${e.to}`);
      svg.appendChild(line);
    });

    // Draw Nodes
    dfsTreeNodes.forEach(node => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "mc-node");
      g.setAttribute("id", `node-${node.id}`);

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", node.x);
      circle.setAttribute("cy", node.y);
      circle.setAttribute("r", "14");
      circle.setAttribute("class", "mc-node-circle");
      
      const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
      txt.setAttribute("x", node.x);
      txt.setAttribute("y", node.y + 4);
      txt.setAttribute("class", "mc-node-text");
      txt.style.fontSize = "9px";
      txt.textContent = node.id;

      g.appendChild(circle);
      g.appendChild(txt);
      svg.appendChild(g);
    });
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 📐 STEP-BY-STEP SIMULATION COMPILES
// ──────────────────────────────────────────────────────────────────────────
function compileSimulationSteps() {
  simulationSteps = [];

  if (currentMCAlgo === "mergesort") {
    const arr = [...activeVisualBars];
    
    // We run a mock merge sort that logs comparisons and swaps/moves
    function mSort(start, end) {
      if (end - start <= 1) return;
      const mid = Math.floor((start + end) / 2);
      mSort(start, mid);
      mSort(mid, end);
      merge(start, mid, end);
    }

    function merge(start, mid, end) {
      let left = arr.slice(start, mid);
      let right = arr.slice(mid, end);
      let i = 0, j = 0, k = start;

      while (i < left.length && j < right.length) {
        // Log comparison
        simulationSteps.push({
          type: "compare",
          indices: [start + i, mid + j],
          state: [...arr]
        });

        if (left[i] <= right[j]) {
          arr[k] = left[i];
          i++;
        } else {
          arr[k] = right[j];
          j++;
        }
        
        // Log merge/override
        simulationSteps.push({
          type: "swap",
          index: k,
          value: arr[k],
          state: [...arr]
        });
        k++;
      }

      while (i < left.length) {
        arr[k] = left[i];
        simulationSteps.push({
          type: "swap",
          index: k,
          value: arr[k],
          state: [...arr]
        });
        i++; k++;
      }

      while (j < right.length) {
        arr[k] = right[j];
        simulationSteps.push({
          type: "swap",
          index: k,
          value: arr[k],
          state: [...arr]
        });
        j++; k++;
      }
    }

    mSort(0, arr.length);

    // Conclude with final sorted sweep
    for (let i = 0; i < arr.length; i++) {
      simulationSteps.push({
        type: "sorted-sweep",
        index: i,
        state: [...arr]
      });
    }

  } else if (currentMCAlgo === "bfs") {
    // BFS traversal order simulation
    const queue = [0];
    const visited = new Set([0]);

    const edgesMap = {
      0: [1, 2, 3],
      1: [4, 5],
      2: [6, 7],
      3: [8, 9],
      4: [], 5: [], 6: [], 7: [], 8: [], 9: []
    };

    while (queue.length) {
      const u = queue.shift();
      
      // Node popped step
      simulationSteps.push({
        type: "pop",
        node: u,
        queue: [...queue],
        visited: Array.from(visited)
      });

      edgesMap[u].forEach(v => {
        if (!visited.has(v)) {
          visited.add(v);
          queue.push(v);
          
          // Neighbor pushed step
          simulationSteps.push({
            type: "push",
            node: v,
            parent: u,
            queue: [...queue],
            visited: Array.from(visited)
          });
        }
      });
    }

  } else if (currentMCAlgo === "dfs") {
    // DFS traversal order simulation
    const visited = new Set();
    const stack = [];

    const edgesMap = {
      0: [1, 2],
      1: [3, 4],
      2: [5, 6],
      3: [7, 8],
      4: [9, 10],
      5: [], 6: [], 7: [], 8: [], 9: [], 10: []
    };

    function traverseDFS(u, parent = null) {
      visited.add(u);
      stack.push(u);

      // Traversal step
      simulationSteps.push({
        type: "visit",
        node: u,
        parent: parent,
        stack: [...stack],
        visited: Array.from(visited)
      });

      edgesMap[u].forEach(v => {
        if (!visited.has(v)) {
          traverseDFS(v, u);
        }
      });

      // Backtrack step
      stack.pop();
      simulationSteps.push({
        type: "backtrack",
        node: u,
        stack: [...stack],
        visited: Array.from(visited)
      });
    }

    traverseDFS(0);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 🔁 PLAYBACK CONTROLLER LOOP
// ──────────────────────────────────────────────────────────────────────────
function startPlayback() {
  isPlaying = true;
  document.getElementById("composer-status-badge").textContent = "Synthesizing";
  document.getElementById("composer-status-badge").className = "visualizer-status running";

  // Calculate tempo delay
  // Tempo in BPM, each step is one beat
  const delay = (60 / tempoBPM) * 1000;

  playbackTimer = setInterval(() => {
    executeNextMCStep();
  }, delay);
}

function pausePlayback() {
  isPlaying = false;
  document.getElementById("composer-status-badge").textContent = "Paused";
  document.getElementById("composer-status-badge").className = "visualizer-status";
  clearInterval(playbackTimer);
}

function stopPlayback() {
  isPlaying = false;
  clearInterval(playbackTimer);
}

function resetComposer() {
  stopPlayback();
  currentStepIdx = 0;
  drawInitialStage();
  document.getElementById("composer-status-badge").textContent = "Ready";
  document.getElementById("composer-status-badge").className = "visualizer-status";
}

// ──────────────────────────────────────────────────────────────────────────
// 🎼 SOUNDTRIGGER & SVG MUTATION
// ──────────────────────────────────────────────────────────────────────────
function executeNextMCStep() {
  if (currentStepIdx >= simulationSteps.length) {
    // Loop reset
    currentStepIdx = 0;
    drawInitialStage();
    return;
  }

  const step = simulationSteps[currentStepIdx];
  
  if (currentMCAlgo === "mergesort") {
    executeMergeSortStep(step);
  } else if (currentMCAlgo === "bfs") {
    executeBfsStep(step);
  } else if (currentMCAlgo === "dfs") {
    executeDfsStep(step);
  }

  currentStepIdx++;
}

function executeMergeSortStep(step) {
  const bars = document.querySelectorAll(".mc-bar");
  
  // Reset all highlight classes
  bars.forEach(b => b.classList.remove("active", "comparing"));

  // Update bar heights to match current step state array
  step.state.forEach((val, idx) => {
    const bar = document.getElementById(`bar-${idx}`);
    if (bar) {
      const height = 40 + val * 18;
      bar.setAttribute("height", height);
      bar.setAttribute("y", 320 - height);
      // update text label
      const text = bar.nextSibling;
      if (text) text.textContent = val;
    }
  });

  if (step.type === "compare") {
    // Highlight elements compared
    step.indices.forEach(idx => {
      const b = document.getElementById(`bar-${idx}`);
      if (b) b.classList.add("comparing");
    });

    // Play chord comparison notes
    const freq1 = SCALE_FREQS[step.state[step.indices[0]]];
    const freq2 = SCALE_FREQS[step.state[step.indices[1]]];
    playSynthNote(freq1, 0.25, selectedWaveType);
    playSynthNote(freq2, 0.25, selectedWaveType);

  } else if (step.type === "swap") {
    const b = document.getElementById(`bar-${step.index}`);
    if (b) b.classList.add("active");

    // Play swap/merge target note
    const freq = SCALE_FREQS[step.value];
    playSynthNote(freq, 0.35, selectedWaveType);

  } else if (step.type === "sorted-sweep") {
    const b = document.getElementById(`bar-${step.index}`);
    if (b) b.classList.add("sorted");

    // Play final sweep notes (smooth C-major ascending sweep)
    const freq = SCALE_FREQS[step.state[step.index]];
    playSynthNote(freq, 0.15, selectedWaveType);
  }
}

function executeBfsStep(step) {
  // Reset nodes classes
  document.querySelectorAll(".mc-node-circle").forEach(n => n.classList.remove("active", "in-queue", "visited"));
  document.querySelectorAll(".mc-edge-line").forEach(e => e.classList.remove("active", "visited"));

  // Apply visited
  step.visited.forEach(id => {
    const el = document.querySelector(`#node-${id} circle`);
    if (el) el.classList.add("visited");
  });

  // Apply queue indicators
  step.queue.forEach(id => {
    const el = document.querySelector(`#node-${id} circle`);
    if (el) el.classList.add("in-queue");
  });

  // Active Node
  const activeEl = document.querySelector(`#node-${step.node} circle`);
  if (activeEl) activeEl.classList.add("active");

  if (step.type === "pop") {
    // Pop trigger drum pulse (kick beat)
    playBfsPulse();
  } else if (step.type === "push") {
    // Connect edge active
    const edge = document.getElementById(`edge-${step.parent}-${step.node}`);
    if (edge) edge.classList.add("active");

    // Play high pitch synth note representing neighbor discovery
    const freq = SCALE_FREQS[step.node + 6]; // offset higher frequency
    playSynthNote(freq, 0.18, selectedWaveType);
  }
}

function executeDfsStep(step) {
  // Reset nodes classes
  document.querySelectorAll(".mc-node-circle").forEach(n => n.classList.remove("active", "visited"));
  document.querySelectorAll(".mc-edge-line").forEach(e => e.classList.remove("active", "visited"));

  // Mark all stack nodes active
  step.stack.forEach(id => {
    const el = document.querySelector(`#node-${id} circle`);
    if (el) el.classList.add("active");
  });

  // Mark visited nodes
  step.visited.forEach(id => {
    const el = document.querySelector(`#node-${id} circle`);
    if (el) el.classList.add("visited");
  });

  // Highlight stack paths
  for (let i = 0; i < step.stack.length - 1; i++) {
    const edge = document.getElementById(`edge-${step.stack[i]}-${step.stack[i+1]}`);
    if (edge) edge.classList.add("active");
  }

  if (step.type === "visit") {
    // Deeper nodes play lower octaves (DFS Plunge)
    const node = dfsTreeNodes[step.node];
    
    // Scale octaves by depth: depth 0 -> mid freq, depth 3 -> low freq
    // Detuned sawtooth drone chord
    const baseFreq = SCALE_FREQS[step.node + 2];
    const depthDivider = 1.0 + node.depth * 0.5; // lower frequency deeper
    const freq = baseFreq / depthDivider;

    // Trigger ambient tone
    playSynthNote(freq, 0.6, selectedWaveType || "sawtooth");
  } else if (step.type === "backtrack") {
    // Backtracking triggers soft, resolving chime (sine wave)
    const freq = SCALE_FREQS[step.node + 5];
    playSynthNote(freq, 0.25, "sine");
  }
}
