// ===== GLOBAL STATE =====
let text = "";
let pattern = "";
let d = 10;
let q = 11;
let m = 0;
let n = 0;
let h = 1; // hash multiplier: d^(m-1) % q

let steps = [];
let currentStepIdx = -1;
let isPlaying = false;
let playTimeout = null;
let speed = 800; // default delay in ms

let audioCtx = null;
let isSoundEnabled = true;

// DOM Elements
const textInput = document.getElementById("textInput");
const patternInput = document.getElementById("patternInput");
const baseInput = document.getElementById("baseInput");
const modInput = document.getElementById("modInput");
const speedRange = document.getElementById("speedRange");
const speedDisplay = document.getElementById("speedDisplay");
const soundToggle = document.getElementById("soundToggle");

const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stepBackBtn = document.getElementById("stepBackBtn");
const stepForwardBtn = document.getElementById("stepForwardBtn");
const resetBtn = document.getElementById("resetBtn");

const textGridWrapper = document.getElementById("textGridWrapper");
const patternGridWrapper = document.getElementById("patternGridWrapper");

const pHashVal = document.getElementById("pHashVal");
const wHashVal = document.getElementById("wHashVal");
const pHashValCompare = document.getElementById("pHashValCompare");
const operatorIcon = document.getElementById("operatorIcon");
const hashCompareResult = document.getElementById("hashCompareResult");

const substitutedFormula = document.getElementById("substitutedFormula");
const mathBase = document.getElementById("mathBase");
const mathMod = document.getElementById("mathMod");
const mathMult = document.getElementById("mathMult");
const stepIndicator = document.getElementById("stepIndicator");

const statComparisons = document.getElementById("statComparisons");
const statMatches = document.getElementById("statMatches");
const statCollisions = document.getElementById("statCollisions");
const statChecked = document.getElementById("statChecked");

const historyTableBody = document.getElementById("historyTableBody");

// ===== AUDIO CONTEXT HELPER =====
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type) {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'step') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'compare') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'mismatch') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'collision') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.35);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'match') {
      // Arpeggio C5 -> E5 -> G5 -> C6
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      osc.frequency.setValueAtTime(1046.50, now + 0.24);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.setValueAtTime(0.08, now + 0.08);
      gain.gain.setValueAtTime(0.08, now + 0.16);
      gain.gain.setValueAtTime(0.08, now + 0.24);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'roll') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.18);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch (e) {
    console.warn("Audio synthesis error:", e);
  }
}

// ===== MODULO MULTIPLIER HELPER =====
// Compute d^(m-1) % q
function computeMultiplier(base, len, mod) {
  let val = 1;
  for (let i = 0; i < len - 1; i++) {
    val = (val * base) % mod;
  }
  return val;
}

// ===== RABIN-KARP STEPS GENERATOR =====
function generateSimulationSteps() {
  steps = [];
  
  if (!text || !pattern || text.length < pattern.length) {
    return;
  }

  n = text.length;
  m = pattern.length;
  h = computeMultiplier(d, m, q);

  let p = 0; // hash value for pattern
  let t = 0; // hash value for text sliding window

  // 1. Precompute hashes of pattern and first window
  for (let i = 0; i < m; i++) {
    p = (d * p + pattern.charCodeAt(i)) % q;
    t = (d * t + text.charCodeAt(i)) % q;
  }

  steps.push({
    type: "PRECOMPUTE",
    wIdx: 0,
    pHash: p,
    wHash: t,
    hMultiplier: h,
    desc: `Precomputed Pattern Hash: <strong>${p}</strong>, First Window Hash: <strong>${t}</strong>.`
  });

  // 2. Slide the pattern over text
  for (let i = 0; i <= n - m; i++) {
    const sub = text.substring(i, i + m);
    
    // Hash check step
    const hashMatch = (p === t);
    steps.push({
      type: "COMPARE_HASH",
      wIdx: i,
      pHash: p,
      wHash: t,
      sub: sub,
      hashMatch: hashMatch,
      desc: hashMatch 
        ? `Hashes match (<strong>${t} === ${p}</strong>)! Verifying characters...` 
        : `Hashes do not match (<strong>${t} &ne; ${p}</strong>). Sliding window.`
    });

    if (hashMatch) {
      let match = true;
      // Compare character by character
      for (let j = 0; j < m; j++) {
        const charMatch = (text[i + j] === pattern[j]);
        
        steps.push({
          type: "COMPARE_CHARS",
          wIdx: i,
          charIdx: j,
          pHash: p,
          wHash: t,
          sub: sub,
          charMatch: charMatch,
          matchSoFar: match,
          desc: `Comparing characters at window index ${j}: T[${i + j}] ('${text[i + j]}') vs P[${j}] ('${pattern[j]}').`
        });

        if (!charMatch) {
          match = false;
          break; // Stop at first mismatch
        }
      }

      if (match) {
        steps.push({
          type: "MATCH",
          wIdx: i,
          pHash: p,
          wHash: t,
          sub: sub,
          desc: `<strong>Valid Match found!</strong> All characters match at starting index ${i}.`
        });
      } else {
        steps.push({
          type: "COLLISION",
          wIdx: i,
          pHash: p,
          wHash: t,
          sub: sub,
          desc: `<strong>Collision (Spurious Match)!</strong> Hashes match but characters do not.`
        });
      }
    }

    // 3. Compute hash value for next window of text
    if (i < n - m) {
      const charRemove = text[i];
      const charRemoveCode = text.charCodeAt(i);
      const charAdd = text[i + m];
      const charAddCode = text.charCodeAt(i + m);

      // Rolling Hash formula
      let tNext = (d * (t - charRemoveCode * h) + charAddCode) % q;
      if (tNext < 0) {
        tNext = tNext + q;
      }

      steps.push({
        type: "ROLL",
        wIdx: i,
        nextWIdx: i + 1,
        pHash: p,
        wHash: t,
        nextWHash: tNext,
        removeChar: charRemove,
        removeCharCode: charRemoveCode,
        addChar: charAdd,
        addCharCode: charAddCode,
        desc: `Slide window: Subtract leftmost char '${charRemove}', multiply by base ${d}, and add rightmost char '${charAdd}'.`
      });

      t = tNext; // Update hash for next iteration
    }
  }
}

// ===== RENDER FUNCTION =====
function renderStep(stepIdx) {
  if (stepIdx < 0 || stepIdx >= steps.length) return;
  
  const step = steps[stepIdx];
  const { type, wIdx, pHash, wHash } = step;

  // 1. Update Step Counter Banner
  stepIndicator.textContent = `Step ${stepIdx + 1} / ${steps.length} (${type})`;

  // 2. Render Text grid
  textGridWrapper.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const cell = document.createElement("div");
    cell.className = "char-cell";
    cell.textContent = text[i];
    
    // Add subscript index
    const idxSpan = document.createElement("span");
    idxSpan.className = "char-idx";
    idxSpan.textContent = i;
    cell.appendChild(idxSpan);

    // Styling highlights based on steps
    if (type === "PRECOMPUTE") {
      // highlight first window lightly
      if (i < m) {
        cell.classList.add("window-active");
      }
    } else if (type === "COMPARE_HASH") {
      if (i >= wIdx && i < wIdx + m) {
        cell.classList.add("window-active");
      }
    } else if (type === "COMPARE_CHARS") {
      if (i >= wIdx && i < wIdx + m) {
        const offset = i - wIdx;
        if (offset === step.charIdx) {
          cell.classList.add("char-comparing");
        } else if (offset < step.charIdx) {
          cell.classList.add("char-matched"); // previous checked chars matched
        } else {
          cell.classList.add("window-active");
        }
      }
    } else if (type === "MATCH") {
      if (i >= wIdx && i < wIdx + m) {
        cell.classList.add("window-match");
      }
    } else if (type === "COLLISION") {
      if (i >= wIdx && i < wIdx + m) {
        cell.classList.add("window-collision");
      }
    } else if (type === "ROLL") {
      if (i === wIdx) {
        cell.classList.add("roll-remove");
      } else if (i > wIdx && i < wIdx + m) {
        cell.classList.add("window-active");
      } else if (i === wIdx + m) {
        cell.classList.add("roll-add");
      }
    }

    textGridWrapper.appendChild(cell);
  }

  // Scroll active window into view if overflow occurs
  const activeCells = textGridWrapper.querySelectorAll(".window-active, .window-match, .window-collision, .char-comparing");
  if (activeCells.length > 0) {
    const firstActive = activeCells[0];
    const wrapperWidth = textGridWrapper.clientWidth;
    const cellLeft = firstActive.offsetLeft;
    const cellWidth = firstActive.clientWidth;
    
    // Smoothly adjust scroll position if cell is out of visible frame
    if (cellLeft < textGridWrapper.scrollLeft || (cellLeft + cellWidth) > (textGridWrapper.scrollLeft + wrapperWidth)) {
      textGridWrapper.scroll(cellLeft - 20, 0);
    }
  }

  // 3. Render Pattern grid
  patternGridWrapper.innerHTML = "";
  for (let i = 0; i < m; i++) {
    const cell = document.createElement("div");
    cell.className = "char-cell";
    cell.textContent = pattern[i];

    const idxSpan = document.createElement("span");
    idxSpan.className = "char-idx";
    idxSpan.textContent = i;
    cell.appendChild(idxSpan);

    if (type === "COMPARE_CHARS" && i === step.charIdx) {
      cell.classList.add("char-comparing");
    } else if (type === "COMPARE_CHARS" && i < step.charIdx) {
      cell.classList.add("char-matched");
    } else if (type === "MATCH") {
      cell.classList.add("window-match");
    } else if (type === "COLLISION") {
      cell.classList.add("window-collision");
    } else if (type === "COMPARE_HASH" && step.hashMatch) {
      cell.classList.add("window-active");
    }

    patternGridWrapper.appendChild(cell);
  }

  // 4. Update Hashes Banner
  pHashVal.textContent = pHash;
  wHashVal.textContent = wHash;
  pHashValCompare.textContent = pHash;

  if (type === "PRECOMPUTE") {
    operatorIcon.innerHTML = `<i class="fas fa-question" style="color: var(--text-secondary)"></i>`;
    hashCompareResult.textContent = "Hashes Initialized";
    hashCompareResult.className = "comparison-result no-match";
  } else if (type === "COMPARE_HASH") {
    if (step.hashMatch) {
      operatorIcon.innerHTML = `<i class="fas fa-equals" style="color: var(--match-green)"></i>`;
      hashCompareResult.textContent = "Hashes Equal (Verify chars)";
      hashCompareResult.className = "comparison-result match";
    } else {
      operatorIcon.innerHTML = `<i class="fas fa-not-equal" style="color: var(--collision-red)"></i>`;
      hashCompareResult.textContent = "Hashes Unequal (Skip)";
      hashCompareResult.className = "comparison-result no-match";
    }
  } else if (type === "COMPARE_CHARS") {
    operatorIcon.innerHTML = `<i class="fas fa-equals" style="color: var(--match-green)"></i>`;
    hashCompareResult.textContent = `Verifying character [${step.charIdx}]`;
    hashCompareResult.className = "comparison-result match";
  } else if (type === "MATCH") {
    operatorIcon.innerHTML = `<i class="fas fa-check-double" style="color: var(--match-green)"></i>`;
    hashCompareResult.textContent = "Valid Match Found!";
    hashCompareResult.className = "comparison-result match";
  } else if (type === "COLLISION") {
    operatorIcon.innerHTML = `<i class="fas fa-exclamation-triangle" style="color: var(--collision-red)"></i>`;
    hashCompareResult.textContent = "Collision (Spurious match)";
    hashCompareResult.className = "comparison-result collision";
  } else if (type === "ROLL") {
    operatorIcon.innerHTML = `<i class="fas fa-arrow-right" style="color: var(--active-blue)"></i>`;
    hashCompareResult.textContent = `Rolling hash to ${step.nextWHash}`;
    hashCompareResult.className = "comparison-result no-match";
  }

  // 5. Update Mathematical Breakdown Display
  mathBase.textContent = d;
  mathMod.textContent = q;
  mathMult.textContent = `${d}^${m - 1} % ${q} = ${h}`;

  if (type === "PRECOMPUTE") {
    substitutedFormula.innerHTML = `Calculating initial hashes:<br/>
      Pattern Hash: <span class="highlight-term">${pHash}</span><br/>
      Text Window 0: <span class="highlight-term">${wHash}</span>`;
  } else if (type === "ROLL") {
    const { removeChar, removeCharCode, addChar, addCharCode, nextWHash } = step;
    
    // Formula plugged values: H_(i+1) = (d * (H_i - removeChar * h) + addChar) % q
    const subVal = removeCharCode * h;
    const term1 = wHash - subVal;
    const term2 = d * term1;
    const term3 = term2 + addCharCode;
    
    substitutedFormula.innerHTML = `
      H<sub>${wIdx + 1}</sub> = (${d} &times; (H<sub>${wIdx}</sub> - T[${wIdx}] &times; d<sup>m-1</sup>) + T[${wIdx + m}]) mod ${q}<br/>
      H<sub>${wIdx + 1}</sub> = (${d} &times; (${wHash} - '<span class="highlight-remove">${removeChar}</span>'(${removeCharCode}) &times; ${h}) + '<span class="highlight-add">${addChar}</span>'(${addCharCode})) mod ${q}<br/>
      H<sub>${wIdx + 1}</sub> = (${d} &times; (${wHash} - ${subVal}) + ${addCharCode}) mod ${q}<br/>
      H<sub>${wIdx + 1}</sub> = (${d} &times; (${term1}) + ${addCharCode}) mod ${q}<br/>
      H<sub>${wIdx + 1}</sub> = (${term2} + ${addCharCode}) mod ${q} = ${term3} mod ${q}<br/>
      H<sub>${wIdx + 1}</sub> = <strong>${nextWHash}</strong>
    `;
  } else {
    // Standard verification steps (COMPARE_HASH, COMPARE_CHARS, MATCH, COLLISION)
    substitutedFormula.innerHTML = `Current Window [${wIdx}]: <strong>"${step.sub}"</strong><br/>
      Active Hash Comparison: <span class="highlight-term">${wHash}</span> vs <span class="highlight-term">${pHash}</span> (${wHash === pHash ? 'Matches' : 'Does not match'})`;
  }

  // 6. Update Stats and History Log Table up to this step
  updateStatsAndTable(stepIdx);
}

// ===== HISTORY TABLE & STATS COMPILER =====
function updateStatsAndTable(maxStepIdx) {
  // Reset logs and stats counters
  let countComparisons = 0;
  let countMatches = 0;
  let countCollisions = 0;
  let windowsEvaluated = new Set();
  
  // Track unique window items for display in table
  const tableData = [];

  for (let i = 0; i <= maxStepIdx; i++) {
    const step = steps[i];
    
    if (step.type === "COMPARE_HASH") {
      countComparisons++;
      windowsEvaluated.add(step.wIdx);
      
      // If hashes do NOT match, we log it immediately since it's finalized
      if (!step.hashMatch) {
        tableData.push({
          idx: step.wIdx,
          sub: step.sub,
          hash: step.wHash,
          hashMatch: "No",
          charsVerified: 0,
          outcome: "no-match",
          outcomeText: "No Match"
        });
      }
    } else if (step.type === "COMPARE_CHARS") {
      // Find or update entry
      const existing = tableData.find(t => t.idx === step.wIdx);
      const charsTested = step.charIdx + 1;
      
      if (!existing) {
        tableData.push({
          idx: step.wIdx,
          sub: step.sub,
          hash: step.wHash,
          hashMatch: "Yes",
          charsVerified: charsTested,
          outcome: "comparing",
          outcomeText: "Verifying"
        });
      } else {
        existing.charsVerified = charsTested;
      }
    } else if (step.type === "MATCH") {
      countMatches++;
      const existing = tableData.find(t => t.idx === step.wIdx);
      if (existing) {
        existing.outcome = "match";
        existing.outcomeText = "Match";
        existing.charsVerified = m;
      } else {
        tableData.push({
          idx: step.wIdx,
          sub: step.sub,
          hash: step.wHash,
          hashMatch: "Yes",
          charsVerified: m,
          outcome: "match",
          outcomeText: "Match"
        });
      }
    } else if (step.type === "COLLISION") {
      countCollisions++;
      const existing = tableData.find(t => t.idx === step.wIdx);
      if (existing) {
        existing.outcome = "collision";
        existing.outcomeText = "Collision";
      } else {
        tableData.push({
          idx: step.wIdx,
          sub: step.sub,
          hash: step.wHash,
          hashMatch: "Yes",
          charsVerified: existing ? existing.charsVerified : 1,
          outcome: "collision",
          outcomeText: "Collision"
        });
      }
    }
  }

  // Update Stats DOM
  statComparisons.textContent = countComparisons;
  statMatches.textContent = countMatches;
  statCollisions.textContent = countCollisions;
  
  const totalWindows = Math.max(0, n - m + 1);
  statChecked.textContent = `${windowsEvaluated.size} / ${totalWindows}`;

  // Update Table DOM
  historyTableBody.innerHTML = "";
  if (tableData.length === 0) {
    historyTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-table-message">No steps executed. Enter parameters and press Play/Step.</td>
      </tr>`;
  } else {
    tableData.forEach(row => {
      const tr = document.createElement("tr");
      
      let rowClass = "";
      if (row.outcome === "match") rowClass = "row-match";
      else if (row.outcome === "collision") rowClass = "row-collision";
      
      if (rowClass) tr.className = rowClass;

      tr.innerHTML = `
        <td>${row.idx}</td>
        <td><strong>"${row.sub}"</strong></td>
        <td>${row.hash}</td>
        <td><span class="${row.hashMatch === 'Yes' ? 'green-text' : ''}">${row.hashMatch}</span></td>
        <td>${row.charsVerified} / ${m}</td>
        <td><span class="badge-outcome ${row.outcome}">${row.outcomeText}</span></td>
      `;
      historyTableBody.appendChild(tr);
    });

    // Auto-scroll table to show latest records
    const scrollContainer = historyTableBody.parentElement.parentElement;
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }
}

// ===== PLAYBACK LOGIC =====
function playNextStep() {
  if (currentStepIdx < steps.length - 1) {
    currentStepIdx++;
    renderStep(currentStepIdx);
    
    // Play sounds
    const step = steps[currentStepIdx];
    if (step.type === "COMPARE_HASH") {
      playSound('compare');
    } else if (step.type === "COMPARE_CHARS") {
      playSound(step.charMatch ? 'step' : 'mismatch');
    } else if (step.type === "MATCH") {
      playSound('match');
    } else if (step.type === "COLLISION") {
      playSound('collision');
    } else if (step.type === "ROLL") {
      playSound('roll');
    } else {
      playSound('step');
    }

    playTimeout = setTimeout(playNextStep, speed);
  } else {
    // Reached the end
    pauseSimulation();
  }
}

function startSimulation() {
  getAudioContext(); // Resume audio
  
  if (steps.length === 0) {
    initializeSimulation();
  }

  if (currentStepIdx >= steps.length - 1) {
    currentStepIdx = -1; // Reset to loop around
  }

  isPlaying = true;
  playBtn.disabled = true;
  pauseBtn.disabled = false;
  stepBackBtn.disabled = true;
  stepForwardBtn.disabled = true;
  disableInputs(true);

  playNextStep();
}

function pauseSimulation() {
  isPlaying = false;
  clearTimeout(playTimeout);
  
  playBtn.disabled = false;
  pauseBtn.disabled = true;
  stepBackBtn.disabled = currentStepIdx <= 0;
  stepForwardBtn.disabled = currentStepIdx >= steps.length - 1;
}

function stepForward() {
  getAudioContext();
  if (steps.length === 0) {
    initializeSimulation();
  }
  
  if (currentStepIdx < steps.length - 1) {
    currentStepIdx++;
    renderStep(currentStepIdx);
    playSound('step');
    
    stepBackBtn.disabled = false;
    if (currentStepIdx === steps.length - 1) {
      stepForwardBtn.disabled = true;
    }
  }
}

function stepBackward() {
  getAudioContext();
  if (currentStepIdx > 0) {
    currentStepIdx--;
    renderStep(currentStepIdx);
    playSound('step');
    
    stepForwardBtn.disabled = false;
    if (currentStepIdx === 0) {
      stepBackBtn.disabled = true;
    }
  }
}

function resetSimulation() {
  isPlaying = false;
  clearTimeout(playTimeout);
  currentStepIdx = -1;
  steps = [];
  
  // Re-enable inputs
  disableInputs(false);
  
  // Refresh simulation steps
  initializeSimulation();
  
  // Update controls states
  playBtn.disabled = false;
  pauseBtn.disabled = true;
  stepBackBtn.disabled = true;
  stepForwardBtn.disabled = false;
  
  // Clear table and reset operator display
  historyTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="empty-table-message">No steps executed. Enter parameters and press Play/Step.</td>
    </tr>`;
  
  operatorIcon.innerHTML = `<i class="fas fa-question" style="color: var(--text-secondary)"></i>`;
  hashCompareResult.textContent = "Simulation Reset";
  hashCompareResult.className = "comparison-result no-match";
  wHashVal.textContent = "0";
  
  // Stats
  statComparisons.textContent = "0";
  statMatches.textContent = "0";
  statCollisions.textContent = "0";
  statChecked.textContent = `0 / ${Math.max(0, n - m + 1)}`;
  
  // Step badge
  stepIndicator.textContent = "Step: Ready";
  substitutedFormula.textContent = 'Select "Step" or "Play" to observe rolling hash substitution.';
  
  playSound('step');
}

function disableInputs(disable) {
  textInput.disabled = disable;
  patternInput.disabled = disable;
  baseInput.disabled = disable;
  modInput.disabled = disable;
}

function initializeSimulation() {
  // 1. Fetch values
  text = textInput.value.trim();
  pattern = patternInput.value.trim();
  d = parseInt(baseInput.value, 10) || 10;
  q = parseInt(modInput.value, 10) || 11;
  
  // Basic validation
  if (!text) {
    alert("Source text cannot be empty.");
    return;
  }
  if (!pattern) {
    alert("Pattern to match cannot be empty.");
    return;
  }
  if (text.length < pattern.length) {
    alert("Source text length must be greater than or equal to pattern length.");
    return;
  }
  if (d < 2) {
    alert("Radix base must be at least 2.");
    return;
  }
  if (q < 2) {
    alert("Modulo prime must be at least 2.");
    return;
  }

  // Generate Simulation steps array
  generateSimulationSteps();
  currentStepIdx = 0;
  renderStep(0);
}

// ===== EVENT LISTENERS =====
function initEvents() {
  // Inputs change triggers reset (re-calculates steps)
  [textInput, patternInput, baseInput, modInput].forEach(elem => {
    elem.addEventListener("change", () => {
      resetSimulation();
    });
  });

  // Buttons bindings
  playBtn.addEventListener("click", startSimulation);
  pauseBtn.addEventListener("click", pauseSimulation);
  stepForwardBtn.addEventListener("click", stepForward);
  stepBackBtn.addEventListener("click", stepBackward);
  resetBtn.addEventListener("click", resetSimulation);

  // Speed Slider
  speedRange.addEventListener("input", (e) => {
    speed = parseInt(e.target.value, 10);
    speedDisplay.textContent = `${speed}ms`;
  });

  // Sound Toggle
  if (soundToggle) {
    isSoundEnabled = soundToggle.checked;
    soundToggle.addEventListener("change", (e) => {
      isSoundEnabled = e.target.checked;
      if (isSoundEnabled) getAudioContext();
    });
  }
}

// Typing effect for hero header subtitle
function initHeroTyping() {
  const typingElement = document.getElementById("typingTextVisualizer");
  if (!typingElement) return;

  const texts = [
    "Sliding Windows",
    "Rolling Hash Calculations",
    "Collision Verification",
    "O(N + M) String Search"
  ];
  
  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function typeEffect() {
    const currentText = texts[textIndex];
    if (isDeleting) {
      typingElement.textContent = currentText.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typingElement.textContent = currentText.substring(0, charIndex + 1);
      charIndex++;
    }

    let typeSpeed = isDeleting ? 50 : 100;

    if (!isDeleting && charIndex === currentText.length) {
      typeSpeed = 1600;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
      typeSpeed = 500;
    }

    setTimeout(typeEffect, typeSpeed);
  }

  typeEffect();
}

// ===== INITIALIZATION ON PAGE LOAD =====
function init() {
  initEvents();
  initHeroTyping();
  
  // Build initial simulation steps but do not autoplay
  initializeSimulation();

  // Hide loading screen safely
  setTimeout(() => {
    const loader = document.getElementById("loading-screen");
    if (loader) {
      loader.classList.add("hidden");
    }
  }, 600);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
