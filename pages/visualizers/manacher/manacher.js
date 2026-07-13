/* ============================================================
   MANACHER'S ALGORITHM — Mirror-Symmetry Engine
   Algo Infinity Verse · pages/visualizers/manacher

   Two generator functions drive the pure algorithm logic
   (no DOM access): manacherGenerator runs the real O(N) mirror-
   copy algorithm, naiveGenerator runs a comparable O(N²)
   expand-around-center over the *same* transformed string so the
   two comparison counters are apples-to-apples. A separate DOM
   driver consumes their yielded steps to animate everything.
   ============================================================ */

/* ------------------------------------------------------------
   1. STRING TRANSFORM + INDEX MAPPING
   ------------------------------------------------------------
   t = "#" + s[0] + "#" + s[1] + ... + "#" + s[n-1] + "#"
   Odd transformed indices map to real characters; even indices
   are separators. This uniformly handles even- and odd-length
   palindromes without any sentinel characters.
------------------------------------------------------------- */

function transformString(s) {
  const parts = ["#"];
  for (const ch of s) { parts.push(ch); parts.push("#"); }
  return parts.join("");
}

// transformed index -> original string index, or null if it's a separator
function transformedToOriginal(i) {
  return i % 2 === 1 ? (i - 1) / 2 : null;
}

// (centerIndex, radius) in transformed space -> { start, length } in original space
function palindromeRangeInOriginal(centerIndex, radius) {
  const start = (centerIndex - radius) / 2;
  return { start, length: radius };
}

/* ------------------------------------------------------------
   2. MANACHER'S ALGORITHM (generator, pure)
   ------------------------------------------------------------
   Yields:
     { type:'init',    i, mirror, copied, initialGuess, C, R }
     { type:'compare', i, left, right, match, comparisons }
     { type:'boundary-update', i, C, R }
     { type:'center-done', i, radius, comparisons, maxLen, centerIndex }
     { type:'done', maxLen, centerIndex, comparisons, start, length }
------------------------------------------------------------- */

function* manacherGenerator(t) {
  const n = t.length;
  const P = new Array(n).fill(0);
  let C = 0, R = 0;
  let comparisons = 0;
  let maxLen = 0, centerIndex = 0;

  for (let i = 0; i < n; i++) {
    let mirror = null, copied = false, initialGuess = 0;
    if (i < R) {
      mirror = 2 * C - i;
      initialGuess = Math.min(R - i, P[mirror]);
      P[i] = initialGuess;
      copied = true;
    }

    yield { type: "init", i, mirror, copied, initialGuess, C, R };

    while (i - P[i] - 1 >= 0 && i + P[i] + 1 < n) {
      const left = i - P[i] - 1, right = i + P[i] + 1;
      comparisons++;
      const match = t[left] === t[right];
      yield { type: "compare", i, left, right, match, comparisons };
      if (!match) break;
      P[i]++;
    }

    if (i + P[i] > R) {
      C = i; R = i + P[i];
      yield { type: "boundary-update", i, C, R };
    }

    if (P[i] > maxLen) { maxLen = P[i]; centerIndex = i; }

    yield { type: "center-done", i, radius: P[i], comparisons, maxLen, centerIndex };
  }

  const { start, length } = palindromeRangeInOriginal(centerIndex, maxLen);
  yield { type: "done", maxLen, centerIndex, comparisons, start, length };
}

/* ------------------------------------------------------------
   3. NAIVE EXPAND-AROUND-CENTER (generator, pure)
   ------------------------------------------------------------
   Runs on the *same* transformed string with no memoization, so
   its comparison count is directly comparable to Manacher's.
------------------------------------------------------------- */

function* naiveGenerator(t) {
  const n = t.length;
  let comparisons = 0;
  let maxLen = 0, centerIndex = 0;

  for (let i = 0; i < n; i++) {
    let r = 0;
    while (i - r - 1 >= 0 && i + r + 1 < n) {
      comparisons++;
      const match = t[i - r - 1] === t[i + r + 1];
      yield { type: "compare", i, comparisons, match };
      if (!match) break;
      r++;
    }
    if (r > maxLen) { maxLen = r; centerIndex = i; }
    yield { type: "center-done", i, radius: r, comparisons, maxLen, centerIndex };
  }

  yield { type: "done", maxLen, centerIndex, comparisons };
}

/* ------------------------------------------------------------
   4. STATE
------------------------------------------------------------- */

const el = (id) => document.getElementById(id);

const state = {
  s: "",
  t: "",
  iterator: null,
  finished: false,
  playing: false,
  speedMs: 400,
  accumMs: 0,
  lastFrameTime: performance.now(),
  blockW: 36, // px, kept in sync with --block-w + margin

  P: [],
  i: 0,
  C: 0,
  R: 0,
  comparisons: 0,
  maxLen: 0,
  centerIndex: 0,

  raceOn: false,
  naiveIterator: null,
  naiveComparisons: 0,
  naiveDone: false,
  history: [], // { i, manacher, naive } for the race sparkline
};

/* ------------------------------------------------------------
   5. STRIP CONSTRUCTION
------------------------------------------------------------- */

function escapeHtml(ch) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return map[ch] || ch;
}

function buildStrip(s, t) {
  const origRow = el("origRow");
  const transRow = el("transRow");
  const radiusChart = el("radiusChart");
  origRow.innerHTML = "";
  transRow.innerHTML = "";
  radiusChart.innerHTML = "";

  // original string row, spaced out under its transformed odd-index counterpart
  for (let i = 0; i < t.length; i++) {
    const spacer = document.createElement("div");
    spacer.className = "char-block";
    spacer.style.visibility = "hidden";
    const origIdx = transformedToOriginal(i);
    if (origIdx !== null) {
      spacer.style.visibility = "visible";
      spacer.textContent = s[origIdx];
      spacer.style.background = "transparent";
      spacer.style.border = "none";
    }
    origRow.appendChild(spacer);
  }

  for (let i = 0; i < t.length; i++) {
    const block = document.createElement("div");
    const isSep = t[i] === "#";
    block.className = "char-block" + (isSep ? " sep" : "");
    block.id = "tblock-" + i;
    block.innerHTML = `${escapeHtml(t[i])}<span class="idx">${i}</span>`;
    transRow.appendChild(block);

    const bar = document.createElement("div");
    bar.className = "radius-bar";
    bar.id = "rbar-" + i;
    bar.style.left = (i * state.blockW) + "px";
    radiusChart.appendChild(bar);
  }

  const stripWrap = el("stripWrap");
  stripWrap.style.width = (t.length * state.blockW) + "px";

  positionGuide(el("cLine"), el("cLabel"), 0, false);
  positionGuide(el("rLine"), el("rLabel"), 0, false);
}

function positionGuide(lineEl, labelEl, index, visible) {
  lineEl.classList.toggle("visible", visible);
  const x = index * state.blockW + state.blockW / 2;
  lineEl.style.transform = `translateX(${x}px)`;
  labelEl.textContent = labelEl.classList.contains("c-label") ? `C=${index}` : `R=${index}`;
}

/* ------------------------------------------------------------
   6. VISUAL DRIVER
------------------------------------------------------------- */

function setPhase(phase) {
  const badge = el("phaseBadge");
  badge.className = "phase-badge phase-" + phase;
  const labels = {
    init: "Checking mirror", copy: "Mirror-copy — free radius",
    compare: "Comparing characters", boundary: "Boundary extended!", done: "Done",
  };
  badge.textContent = labels[phase] || phase;
}

function clearBlockStates() {
  document.querySelectorAll(".char-block").forEach((b) => {
    b.classList.remove("cur", "mirror-src", "cmp-flash", "match-flash");
  });
}

function drawMirrorArc(i, mirror) {
  const svg = el("mirrorSvg");
  if (mirror === null) { svg.classList.remove("visible"); svg.innerHTML = ""; return; }
  const x1 = mirror * state.blockW + state.blockW / 2;
  const x2 = i * state.blockW + state.blockW / 2;
  const midX = (x1 + x2) / 2;
  const w = Math.abs(x2 - x1);
  const archHeight = Math.min(40, 14 + w * 0.12);
  svg.setAttribute("width", Math.max(x1, x2) + 10);
  svg.setAttribute("height", archHeight + 10);
  svg.innerHTML = `
    <path d="M ${x1} ${archHeight} Q ${midX} 0 ${x2} ${archHeight}"
          fill="none" stroke="#facc15" stroke-width="2" stroke-dasharray="4 3" opacity="0.85" />
    <circle cx="${x1}" cy="${archHeight}" r="3" fill="#facc15" />
    <circle cx="${x2}" cy="${archHeight}" r="3" fill="#facc15" />
  `;
  svg.classList.add("visible");
}

function updateChips() {
  el("chipI").textContent = state.i;
  el("chipCR").textContent = `${state.C}, ${state.R}`;
  el("chipComparisons").textContent = state.comparisons;
  el("chipBest").textContent = state.maxLen;
  el("statPi").textContent = state.P[state.i] ?? 0;
  el("statMirror").textContent = state.i < state.R ? (2 * state.C - state.i) : "—";
}

function updateReadout(step) {
  el("roI").textContent = state.i;
  el("roInside").textContent = state.i < state.R ? "yes" : "no";
  el("roComparisons").textContent = state.comparisons;
  if (step && step.type === "init") {
    el("roGuess").textContent = step.copied ? step.initialGuess : 0;
  }
}

function updateRadiusBar(i, radius, isCurrent, isBest) {
  const bar = el("rbar-" + i);
  if (!bar) return;
  bar.style.height = Math.min(radius * 5.5, 66) + "px";
  bar.classList.toggle("cur", !!isCurrent);
  bar.classList.toggle("best", !!isBest);
}

function markBestRange(centerIndex, maxLen) {
  document.querySelectorAll(".char-block.best").forEach((b) => b.classList.remove("best"));
  if (maxLen <= 0) return;
  for (let k = centerIndex - maxLen; k <= centerIndex + maxLen; k++) {
    const b = el("tblock-" + k);
    if (b) b.classList.add("best");
  }
}

function applyManacherStep(step) {
  state.i = step.i ?? state.i;

  if (step.type === "init") {
    clearBlockStates();
    setPhase(step.copied ? "copy" : "init");
    const cur = el("tblock-" + step.i);
    if (cur) cur.classList.add("cur");
    positionGuide(el("cLine"), el("cLabel"), state.C, state.R > 0);
    positionGuide(el("rLine"), el("rLabel"), state.R, state.R > 0);

    if (step.copied) {
      const src = el("tblock-" + step.mirror);
      if (src) src.classList.add("mirror-src");
      drawMirrorArc(step.i, step.mirror);
    } else {
      drawMirrorArc(step.i, null);
    }
    state.P[step.i] = step.initialGuess;
    updateRadiusBar(step.i, step.initialGuess, true, false);
    updateChips();
    updateReadout(step);
  }

  else if (step.type === "compare") {
    setPhase("compare");
    state.comparisons = step.comparisons;
    const leftB = el("tblock-" + step.left), rightB = el("tblock-" + step.right);
    [leftB, rightB].forEach((b) => {
      if (!b) return;
      b.classList.remove("cmp-flash", "match-flash");
      void b.offsetWidth;
      b.classList.add(step.match ? "match-flash" : "cmp-flash");
    });
    if (step.match) {
      state.P[step.i] = (state.P[step.i] || 0) + 1;
      updateRadiusBar(step.i, state.P[step.i], true, false);
    }
    updateChips();
    updateReadout(step);
  }

  else if (step.type === "boundary-update") {
    state.C = step.C; state.R = step.R;
    setPhase("boundary");
    positionGuide(el("cLine"), el("cLabel"), state.C, true);
    positionGuide(el("rLine"), el("rLabel"), state.R, true);
    updateChips();
  }

  else if (step.type === "center-done") {
    state.maxLen = step.maxLen;
    state.centerIndex = step.centerIndex;
    updateRadiusBar(step.i, step.radius, false, step.i === step.centerIndex);
    markBestRange(step.centerIndex, step.maxLen);
    updateChips();
  }

  else if (step.type === "done") {
    state.finished = true;
    state.playing = false;
    el("playBtn").textContent = "▶ Play";
    setPhase("done");
    clearBlockStates();
    drawMirrorArc(0, null);
    markBestRange(step.centerIndex, step.maxLen);
    showResult(step);
    updateChips();
  }
}

function showResult(step) {
  const box = el("resultBox");
  box.classList.add("show");
  const substring = step.length > 0 ? state.s.substr(step.start, step.length) : "(none — single chars only)";
  el("resultVal").textContent = substring;
  el("resultMeta").textContent =
    `start ${step.start} · length ${step.length} · ${step.comparisons} real comparisons for N=${state.s.length}`;

  if (state.raceOn) {
    const ratio = state.naiveComparisons > 0 ? (state.naiveComparisons / Math.max(step.comparisons, 1)).toFixed(1) : "—";
    el("resultCallout").textContent =
      `Manacher: ${step.comparisons} comparisons vs. naive: ${state.naiveComparisons} — ${ratio}× fewer`;
  } else {
    el("resultCallout").textContent = "";
  }
}

/* ------------------------------------------------------------
   7. RACE MODE — naive comparisons fast-forwarded in the background
------------------------------------------------------------- */

function advanceNaiveTo(targetCenterIndex) {
  if (!state.naiveIterator || state.naiveDone) return;
  let guard = 0;
  while (guard < 100000) {
    const { value, done } = state.naiveIterator.next();
    guard++;
    if (done) { state.naiveDone = true; return; }
    if (value.type === "compare") state.naiveComparisons = value.comparisons;
    if (value.type === "center-done") {
      state.naiveComparisons = value.comparisons;
      if (value.i >= targetCenterIndex) return;
    }
    if (value.type === "done") { state.naiveDone = true; state.naiveComparisons = value.comparisons; return; }
  }
}

const svgNS = "http://www.w3.org/2000/svg";

function renderRaceChart() {
  const svg = el("raceChart");
  const hist = state.history;
  svg.innerHTML = "";
  if (hist.length < 2) return;

  const W = 300, H = 90, PAD = 4;
  const maxVal = Math.max(1, ...hist.map((h) => Math.max(h.manacher, h.naive)));

  const toPts = (key) => hist.map((h, idx) => {
    const x = PAD + (idx / (hist.length - 1)) * (W - PAD * 2);
    const y = H - PAD - (h[key] / maxVal) * (H - PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const naiveLine = document.createElementNS(svgNS, "polyline");
  naiveLine.setAttribute("points", toPts("naive"));
  naiveLine.setAttribute("fill", "none");
  naiveLine.setAttribute("stroke", "#f472b6");
  naiveLine.setAttribute("stroke-width", "2");
  svg.appendChild(naiveLine);

  const manacherLine = document.createElementNS(svgNS, "polyline");
  manacherLine.setAttribute("points", toPts("manacher"));
  manacherLine.setAttribute("fill", "none");
  manacherLine.setAttribute("stroke", "#06b6d4");
  manacherLine.setAttribute("stroke-width", "2.5");
  svg.appendChild(manacherLine);
}

function recordRaceHistory() {
  if (!state.raceOn) return;
  advanceNaiveTo(state.i);
  state.history.push({ i: state.i, manacher: state.comparisons, naive: state.naiveComparisons });
  if (state.history.length > 200) state.history.shift();
  renderRaceChart();
}

/* ------------------------------------------------------------
   8. RUN CONTROL
------------------------------------------------------------- */

function stepOnce() {
  if (!state.iterator || state.finished) return;
  const { value, done } = state.iterator.next();
  if (done) return;
  applyManacherStep(value);
  if (value.type === "center-done") recordRaceHistory();
}

function validateInput(s) {
  if (!s || !s.trim()) return "Source string can't be empty.";
  if (s.length > 26) return "Keep the string under 26 characters for a readable strip.";
  if (!/^[a-zA-Z0-9]+$/.test(s)) return "Use letters and numbers only (no '#' — it's reserved as the separator).";
  return null;
}

function resetRun() {
  const sVal = el("sourceInput").value;
  const err = validateInput(sVal);
  el("inputError").textContent = err || "";
  if (err) return false;

  state.s = sVal;
  state.t = transformString(sVal);
  state.iterator = manacherGenerator(state.t);
  state.finished = false;
  state.playing = false;
  state.accumMs = 0;
  state.i = 0; state.C = 0; state.R = 0;
  state.comparisons = 0; state.maxLen = 0; state.centerIndex = 0;
  state.P = new Array(state.t.length).fill(0);

  state.raceOn = el("toggleRace").checked;
  state.naiveIterator = state.raceOn ? naiveGenerator(state.t) : null;
  state.naiveComparisons = 0;
  state.naiveDone = false;
  state.history = [];
  el("raceChartWrap").classList.toggle("show", state.raceOn);
  el("raceChart").innerHTML = "";

  el("playBtn").textContent = "▶ Play";
  el("resultBox").classList.remove("show");

  buildStrip(sVal, state.t);
  clearBlockStates();
  drawMirrorArc(0, null);
  setPhase("init");
  updateChips();
  updateReadout(null);
  return true;
}

/* ------------------------------------------------------------
   9. UI WIRING
------------------------------------------------------------- */

el("applyBtn").addEventListener("click", () => resetRun());
el("stepBackBtn").addEventListener("click", () => resetRun());
el("stepNextBtn").addEventListener("click", () => { state.playing = false; el("playBtn").textContent = "▶ Play"; stepOnce(); });

el("playBtn").addEventListener("click", () => {
  if (state.finished) resetRun();
  state.playing = !state.playing;
  el("playBtn").textContent = state.playing ? "⏸ Pause" : "▶ Play";
});

el("pauseBtn").addEventListener("click", () => {
  state.playing = !state.playing;
  el("pauseBtn").textContent = state.playing ? "⏸" : "▶";
  el("playBtn").textContent = state.playing ? "⏸ Pause" : "▶ Play";
});

el("speedSlider").addEventListener("input", (e) => {
  state.speedMs = parseInt(e.target.value, 10);
  el("speedVal").textContent = `${state.speedMs}ms/step`;
});

el("toggleRace").addEventListener("change", () => resetRun());

el("sourceInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") resetRun();
});

/* ------------------------------------------------------------
   10. ANIMATION LOOP
------------------------------------------------------------- */

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = now - state.lastFrameTime;
  state.lastFrameTime = now;

  if (state.playing && !state.finished) {
    state.accumMs += dt;
    if (state.accumMs >= state.speedMs) {
      state.accumMs = 0;
      stepOnce();
    }
  }
}

/* ------------------------------------------------------------
   11. BOOT
------------------------------------------------------------- */

function boot() {
  el("speedVal").textContent = `${state.speedMs}ms/step`;
  resetRun();
  animate();

  requestAnimationFrame(() => {
    setTimeout(() => el("loadingVeil").classList.add("hidden"), 350);
  });
}

boot();
