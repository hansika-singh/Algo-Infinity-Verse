/* ============================================================
   CPU Pipeline Visualizer — UI layer (built on pipeline-core.js)
   ============================================================ */

const SVG_NS = "http://www.w3.org/2000/svg";
const REG_NAMES = ["R1", "R2", "R3", "R4", "R5", "R6", "R7"];

let simResult = null;
let currentCycle = 0;
let playing = false;
let playTimer = null;

const errorText = document.getElementById("errorText");

/* ---------- register inputs ---------- */

function buildRegInputs(defaults){
  const wrap = document.getElementById("regInputs");
  wrap.innerHTML = "";
  REG_NAMES.forEach(name => {
    const item = document.createElement("div");
    item.className = "reg-input-item";
    const label = document.createElement("label");
    label.textContent = name;
    const input = document.createElement("input");
    input.type = "number";
    input.id = "reg-" + name;
    input.value = (defaults && defaults[name] !== undefined) ? defaults[name] : 0;
    item.appendChild(label); item.appendChild(input);
    wrap.appendChild(item);
  });
}

function readRegInputs(){
  const regs = {};
  REG_NAMES.forEach(name => {
    const el = document.getElementById("reg-" + name);
    regs[name] = el ? (parseInt(el.value, 10) || 0) : 0;
  });
  return regs;
}

/* ---------- presets ---------- */

const PRESETS = {
  loop: {
    text: `LOOP:\n  ADD R2, R2, R3\n  SUB R1, R1, R3\n  BNE R1, R0, LOOP\n  ADD R4, R2, R0`,
    regs: { R1: 4, R2: 0, R3: 1 },
  },
  indep: {
    text: `ADD R1, R2, R3\nADD R4, R5, R6\nSUB R7, R2, R3\nADDI R2, R2, 1\nADD R5, R6, R0`,
    regs: { R2: 1, R3: 2, R5: 3, R6: 4 },
  },
  raw: {
    text: `ADD R1, R2, R3\nSUB R4, R1, R5\nADD R6, R7, R0`,
    regs: { R2: 10, R3: 5, R5: 2, R7: 9 },
  },
};

function applyPreset(key){
  const p = PRESETS[key];
  document.getElementById("programInput").value = p.text;
  buildRegInputs(p.regs);
}

/* ---------- run simulation ---------- */

function runSimulation(){
  errorText.textContent = "";
  stopPlaying();
  const text = document.getElementById("programInput").value;
  const regs = readRegInputs();
  const initState = parseInt(document.getElementById("predictorInit").value, 10);
  try{
    simResult = simulate(text, regs, { maxDynamic: 300, initialPredictorState: initState });
  } catch(e){
    errorText.textContent = e.message;
    simResult = null;
    return;
  }
  currentCycle = 0;
  renderGridSkeleton();
  renderAtCycle(0);
}

/* ---------- grid rendering ---------- */

function stageClass(label){
  if(!label) return "empty";
  if(label === "IF" || label === "IF-FLUSH" ) return label.includes("FLUSH") ? "flush" : "if";
  if(label === "ID" || label === "ID-FLUSH") return label.includes("FLUSH") ? "flush" : "id";
  if(label === "EX") return "ex";
  if(label === "MEM") return "mem";
  if(label === "WB") return "wb";
  return "empty";
}
function stageText(label){
  if(!label) return "";
  if(label.includes("FLUSH")) return "✕";
  return label;
}

function renderGridSkeleton(){
  const wrap = document.getElementById("gridWrap");
  wrap.innerHTML = "";
  if(!simResult) return;

  const totalCycles = simResult.totalCycles;
  const cycleNumRow = document.createElement("div");
  cycleNumRow.className = "cycle-num-row";
  const headerSpacer = document.createElement("div");
  headerSpacer.className = "grid-header-label";
  cycleNumRow.appendChild(headerSpacer);
  for(let c = 1; c <= totalCycles; c++){
    const el = document.createElement("div");
    el.className = "cycle-num";
    el.textContent = c;
    cycleNumRow.appendChild(el);
  }
  wrap.appendChild(cycleNumRow);
}

function renderAtCycle(cycle){
  const wrap = document.getElementById("gridWrap");
  // remove old instruction rows (keep the cycle-num header, which is wrap's first child)
  [...wrap.querySelectorAll(".grid-row")].forEach(r => r.remove());

  if(!simResult) return;
  const totalCycles = simResult.totalCycles;
  const instrOrder = [...simResult.instances.values()].sort((a, b) => a.id - b.id);

  instrOrder.forEach(inst => {
    const cycles = Object.keys(inst.timeline).map(Number);
    if(cycles.length === 0) return;
    const firstCycle = Math.min(...cycles);
    if(firstCycle > cycle) return; // not fetched yet at this point in playback

    const row = document.createElement("div");
    row.className = "grid-row";
    const label = document.createElement("div");
    label.className = "grid-label";
    label.textContent = `#${inst.id} ${inst.text}`;
    row.appendChild(label);

    for(let c = 1; c <= totalCycles; c++){
      const cell = document.createElement("div");
      if(c > cycle){
        cell.className = "grid-cell empty";
      } else {
        const stageLabel = inst.timeline[c];
        cell.className = "grid-cell " + stageClass(stageLabel);
        cell.textContent = stageText(stageLabel);
        if(c === cycle && stageLabel) cell.classList.add("current-col");
      }
      row.appendChild(cell);
    }
    wrap.appendChild(row);
  });

  document.getElementById("cycleReadout").textContent = `cycle ${cycle} / ${totalCycles}`;
  renderPredictor(cycle);
  renderStats(cycle);
}

/* ---------- predictor diagram ---------- */

function renderPredictor(uptoCycle){
  const svg = document.getElementById("predictorSvg");
  svg.innerHTML = "";
  if(!simResult) return;

  const relevantLog = simResult.predictorLog.filter(p => p.cycle <= uptoCycle);
  let currentState = document.getElementById("predictorInit") ? parseInt(document.getElementById("predictorInit").value, 10) : 1;
  if(relevantLog.length > 0) currentState = relevantLog[relevantLog.length - 1].stateAfter;

  const defs = document.createElementNS(SVG_NS, "defs");
  defs.innerHTML = `<marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 z" fill="#5c5e82"/></marker>`;
  svg.appendChild(defs);

  const positions = [
    { x: 100, y: 60 }, { x: 350, y: 60 }, { x: 100, y: 190 }, { x: 350, y: 190 },
  ];
  const labels = PREDICTOR_STATES;

  // arrows: 0<->1<->2<->3 (not-taken decrements, taken increments), plus self-loops at ends
  const arrowPairs = [[0,1],[1,2],[2,3]];
  arrowPairs.forEach(([a,b]) => {
    const pa = positions[a], pb = positions[b];
    const mx = (pa.x+pb.x)/2, my = (pa.y+pb.y)/2 - 18;
    const pathTaken = document.createElementNS(SVG_NS, "path");
    pathTaken.setAttribute("d", `M${pa.x+40},${pa.y-10} Q${mx},${my} ${pb.x-40},${pb.y-10}`);
    pathTaken.setAttribute("class", "predictor-arrow");
    svg.appendChild(pathTaken);
    const tLabel = document.createElementNS(SVG_NS, "text");
    tLabel.setAttribute("x", mx); tLabel.setAttribute("y", my + 2);
    tLabel.setAttribute("class", "predictor-arrow-label");
    tLabel.textContent = "taken";
    svg.appendChild(tLabel);

    const my2 = (pa.y+pb.y)/2 + 26;
    const pathNot = document.createElementNS(SVG_NS, "path");
    pathNot.setAttribute("d", `M${pb.x-40},${pb.y+10} Q${mx},${my2} ${pa.x+40},${pa.y+10}`);
    pathNot.setAttribute("class", "predictor-arrow");
    svg.appendChild(pathNot);
    const nLabel = document.createElementNS(SVG_NS, "text");
    nLabel.setAttribute("x", mx); nLabel.setAttribute("y", my2 + 12);
    nLabel.setAttribute("class", "predictor-arrow-label");
    nLabel.textContent = "not taken";
    svg.appendChild(nLabel);
  });

  positions.forEach((p, i) => {
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", p.x - 70); rect.setAttribute("y", p.y - 24);
    rect.setAttribute("width", 140); rect.setAttribute("height", 48);
    rect.setAttribute("rx", 10);
    rect.setAttribute("class", "predictor-state-box" + (i === currentState ? " active" : ""));
    svg.appendChild(rect);
    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", p.x); text.setAttribute("y", p.y + 5);
    text.setAttribute("class", "predictor-state-label");
    text.textContent = labels[i];
    svg.appendChild(text);
  });

  // predictor log panel
  const logEl = document.getElementById("predictorLog");
  logEl.innerHTML = "";
  if(relevantLog.length === 0){
    logEl.innerHTML = '<div>No branch has resolved yet.</div>';
  } else {
    relevantLog.forEach(p => {
      const div = document.createElement("div");
      const cls = p.mispredicted ? "log-miss" : "log-hit";
      div.innerHTML = `cycle ${p.cycle}: <span class="${cls}">${p.mispredicted ? "MISPREDICT" : "correct"}</span> ` +
        `(predicted ${p.predicted ? "taken" : "not-taken"}, actual ${p.actual ? "taken" : "not-taken"}) ` +
        `— state ${PREDICTOR_STATES[p.stateBefore]} → ${PREDICTOR_STATES[p.stateAfter]}`;
      logEl.appendChild(div);
    });
    logEl.scrollTop = logEl.scrollHeight;
  }
}

/* ---------- stats ---------- */

function renderStats(uptoCycle){
  if(!simResult){
    ["statCycles","statIdeal","statStalls","statFlushed","statMispredicts","statAccuracy"].forEach(id => {
      document.getElementById(id).textContent = "–";
    });
    return;
  }
  const retiredByNow = [...simResult.instances.values()].filter(inst => inst.timeline[uptoCycle] === "WB" || Object.entries(inst.timeline).some(([c,s]) => Number(c) <= uptoCycle && s === "WB"));
  const dynamicCount = [...simResult.instances.values()].filter(inst => Math.min(...Object.keys(inst.timeline).map(Number)) <= uptoCycle).length;
  const idealCycles = dynamicCount > 0 ? dynamicCount + 4 : 0;

  let stallCount = 0;
  simResult.instances.forEach(inst => {
    const idCycles = Object.entries(inst.timeline).filter(([c, s]) => Number(c) <= uptoCycle && s === "ID");
    if(idCycles.length > 1) stallCount += idCycles.length - 1;
  });

  const flushedByNow = [...simResult.instances.values()].filter(inst =>
    inst.flushed && Object.entries(inst.timeline).some(([c]) => Number(c) <= uptoCycle)
  ).length;

  const resolvedBranches = simResult.predictorLog.filter(p => p.cycle <= uptoCycle);
  const mispredicts = resolvedBranches.filter(p => p.mispredicted).length;
  const accuracy = resolvedBranches.length > 0 ? (100 * (resolvedBranches.length - mispredicts) / resolvedBranches.length).toFixed(0) + "%" : "–";

  document.getElementById("statCycles").textContent = uptoCycle;
  document.getElementById("statIdeal").textContent = idealCycles || "–";
  document.getElementById("statStalls").textContent = stallCount;
  document.getElementById("statFlushed").textContent = flushedByNow;
  document.getElementById("statMispredicts").textContent = mispredicts;
  document.getElementById("statAccuracy").textContent = accuracy;
}

/* ---------- playback controls ---------- */

function stepForward(){
  if(!simResult) return;
  if(currentCycle >= simResult.totalCycles){ stopPlaying(); return; }
  currentCycle++;
  renderAtCycle(currentCycle);
}
function stopPlaying(){
  playing = false;
  if(playTimer) clearInterval(playTimer);
  playTimer = null;
  document.getElementById("btnPlay").textContent = "▶ Play";
}
function togglePlay(){
  if(!simResult) return;
  if(playing){ stopPlaying(); return; }
  playing = true;
  document.getElementById("btnPlay").textContent = "⏸ Pause";
  const speed = parseInt(document.getElementById("speedSlider").value, 10);
  playTimer = setInterval(() => {
    if(!simResult || currentCycle >= simResult.totalCycles){ stopPlaying(); return; }
    stepForward();
  }, speed);
}

/* ---------- wire up UI ---------- */

document.getElementById("btnRun").addEventListener("click", runSimulation);
document.getElementById("btnStep").addEventListener("click", () => { stopPlaying(); stepForward(); });
document.getElementById("btnPlay").addEventListener("click", togglePlay);
document.getElementById("btnRestart").addEventListener("click", () => {
  stopPlaying();
  currentCycle = 0;
  renderAtCycle(0);
});
document.getElementById("speedSlider").addEventListener("input", (e) => {
  document.getElementById("speedVal").textContent = `${e.target.value}ms/cycle`;
  if(playing){ stopPlaying(); togglePlay(); }
});
document.getElementById("presetLoop").addEventListener("click", () => applyPreset("loop"));
document.getElementById("presetIndep").addEventListener("click", () => applyPreset("indep"));
document.getElementById("presetRaw").addEventListener("click", () => applyPreset("raw"));

/* ---------- boot ---------- */
applyPreset("loop");
runSimulation();
