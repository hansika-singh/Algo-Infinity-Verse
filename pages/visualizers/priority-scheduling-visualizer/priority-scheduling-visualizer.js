/* ── DOM helpers ──────────────────────────────────────── */
const $ = id => document.getElementById(id);

const DOM = {
  procTbody   : $('processTableBody'),
  addBtn      : $('addProcessBtn'),
  speedSlider : $('speedSlider'),
  speedDisplay: $('speedDisplay'),
  playBtn     : $('playBtn'),
  pauseBtn    : $('pauseBtn'),
  resetBtn    : $('resetBtn'),
  stepDesc    : $('stepDescription'),
  statusBadge : $('statusBadge'),
  queueViz    : $('priorityQueueViz'),
  ganttChart  : $('ganttChart'),
  ganttLine   : $('ganttTimeline'),
  ganttLegend : $('ganttLegend'),
  timeLabel   : $('currentTimeLabel'),
  metricsTbody: $('metricsTableBody'),
  avgWrap     : $('avgMetrics'),
  copyBtn     : $('copyCodeBtn'),
};

/* ── Constants ────────────────────────────────────────── */
const COLORS = [
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#22c55e', // green
  '#f43f5e', // rose
  '#ec4899', // pink
  '#14b8a6', // teal
  '#a78bfa', // violet
];

const IDLE_CLR    = '#374151';
const MAX_PROCS   = 8;

/* ── Default process table ────────────────────────────── */
let processes = [
  { id:1, pid:'P1', arrival:0, burst:4, priority:3 },
  { id:2, pid:'P2', arrival:1, burst:3, priority:1 },
  { id:3, pid:'P3', arrival:2, burst:1, priority:4 },
  { id:4, pid:'P4', arrival:3, burst:5, priority:2 },
  { id:5, pid:'P5', arrival:4, burst:2, priority:5 },
];
let nextId = 6;

/* ── App state ────────────────────────────────────────── */
const S = {
  isPlaying : false,
  isPaused  : false,
  timeouts  : [],
  stepDelay : 1200,   // ms between steps; synced with slider
  totalTime : 0,      // total schedule length (for Gantt widths)
};

/* ── Utility: colour for process index ───────────────── */
function clr(i) { return COLORS[i % COLORS.length]; }

/* ── Utility: schedule a timeout and track it ─────────── */
function later(fn, delay) {
  const id = setTimeout(fn, delay);
  S.timeouts.push(id);
  return id;
}

/* ── Utility: cancel all pending timeouts ─────────────── */
function cancelAll() {
  S.timeouts.forEach(clearTimeout);
  S.timeouts = [];
}

/* ── Utility: update status badge ────────────────────── */
function setStatus(text, type) {
  DOM.statusBadge.textContent = text;
  DOM.statusBadge.className   = `ps-status-badge ps-status-${type}`;
}

/* ── Utility: update step description ────────────────── */
function setStep(html) {
  DOM.stepDesc.innerHTML = html;
}

/* ============================================================
   NON-PREEMPTIVE PRIORITY SCHEDULING ALGORITHM
   Returns:
     timeline — ordered list of execution/idle slots
     results  — process array with CT, TAT, WT filled in
============================================================ */
function computeSchedule() {
  // Deep copy with colour assigned by original index
  const procs = processes.map((p, i) => ({
    ...p,
    color    : clr(i),
    completed: false,
    ct       : 0,
    tat      : 0,
    wt       : 0,
  }));

  let time     = 0;
  let done     = 0;
  const timeline = [];

  while (done < procs.length) {
    /* ── All processes that have arrived and are still pending ── */
    const available = procs.filter(p => !p.completed && p.arrival <= time);

    if (available.length === 0) {
      /* ── CPU IDLE: jump to the next process arrival ── */
      const nextArrival = Math.min(
        ...procs.filter(p => !p.completed).map(p => p.arrival)
      );
      timeline.push({ type:'idle', start:time, end:nextArrival });
      time = nextArrival;
      continue;
    }

    /* ── Pick: lowest priority number = highest priority
          Tiebreak: earlier arrival time (FCFS) ── */
    available.sort((a, b) =>
      a.priority - b.priority || a.arrival - b.arrival
    );
    const sel = available[0];

    const start = time;
    const end   = time + sel.burst;

    /* ── Snapshot the queue so the visualizer can replay it ── */
    const queueSnapshot = available.map(p => ({
      pid     : p.pid,
      priority: p.priority,
      burst   : p.burst,
      color   : p.color,
      selected: p.pid === sel.pid,
    }));

    /* ── Record metrics for the selected process ── */
    const ref      = procs.find(p => p.id === sel.id);
    ref.completed  = true;
    ref.ct         = end;
    ref.tat        = end - sel.arrival;
    ref.wt         = ref.tat - sel.burst;

    timeline.push({
      type         : 'process',
      id           : sel.id,
      pid          : sel.pid,
      color        : sel.color,
      priority     : sel.priority,
      start, end,
      burst        : sel.burst,
      queueSnapshot,
    });

    time = end;
    done++;
  }

  return { timeline, results: procs };
}

/* ============================================================
   PROCESS INPUT TABLE RENDERER
============================================================ */
function renderTable() {
  DOM.procTbody.innerHTML = '';

  processes.forEach((p, i) => {
    const c  = clr(i);
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>
        <div class="ps-pid-cell"
          style="background:${c}22; border-color:${c}">
          <span style="color:${c}">${p.pid}</span>
        </div>
      </td>
      <td>
        <input class="ps-num-input" type="number"
          data-id="${p.id}" data-field="arrival"
          value="${p.arrival}" min="0" max="99">
      </td>
      <td>
        <input class="ps-num-input" type="number"
          data-id="${p.id}" data-field="burst"
          value="${p.burst}" min="1" max="20">
      </td>
      <td>
        <input class="ps-num-input" type="number"
          data-id="${p.id}" data-field="priority"
          value="${p.priority}" min="1" max="99">
      </td>
      <td>
        <button class="ps-del-btn"
          data-id="${p.id}"
          ${processes.length <= 1 ? 'disabled' : ''}>
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    DOM.procTbody.appendChild(tr);
  });

  /* ── Input change: update process store ── */
  DOM.procTbody.querySelectorAll('.ps-num-input').forEach(inp => {
    inp.addEventListener('change', () => {
      const proc = processes.find(p => p.id === +inp.dataset.id);
      if (!proc) return;
      const parsed  = parseInt(inp.value, 10) || 0;
      const clamped = Math.max(+(inp.min) || 0,
                       Math.min(+(inp.max) || 99, parsed));
      proc[inp.dataset.field] = clamped;
      inp.value = clamped;
    });
  });

  /* ── Delete row ── */
  DOM.procTbody.querySelectorAll('.ps-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      processes = processes.filter(p => p.id !== +btn.dataset.id);
      renderTable();
      doReset();
    });
  });
}

/* ============================================================
   METRICS TABLE — initial render (dashes for CT/TAT/WT)
============================================================ */
function renderMetricsInit() {
  DOM.metricsTbody.innerHTML = '';
  DOM.avgWrap.innerHTML      = '';

  processes.forEach((p, i) => {
    const c  = clr(i);
    const tr = document.createElement('tr');
    tr.id    = `mrow-${p.id}`;

    tr.innerHTML = `
      <td>
        <span class="ps-pid-badge"
          style="background:${c}22; color:${c}; border-color:${c}">
          ${p.pid}
        </span>
      </td>
      <td>${p.arrival}</td>
      <td>${p.burst}</td>
      <td><span class="ps-pri-badge">${p.priority}</span></td>
      <td id="m-ct-${p.id}"  class="ps-metric-cell">—</td>
      <td id="m-tat-${p.id}" class="ps-metric-cell">—</td>
      <td id="m-wt-${p.id}"  class="ps-metric-cell">—</td>
    `;
    DOM.metricsTbody.appendChild(tr);
  });
}

/* ── Fill one metrics row after a process completes ──── */
function fillMetricsRow(result) {
  const fill = (id, val) => {
    const el = $(id);
    if (!el) return;
    el.textContent = val;
    el.classList.add('ps-metric-flash');
    // Remove class so animation can re-trigger next time
    el.addEventListener('animationend', () =>
      el.classList.remove('ps-metric-flash'), { once: true }
    );
  };

  fill(`m-ct-${result.id}`,  result.ct);
  fill(`m-tat-${result.id}`, result.tat);
  fill(`m-wt-${result.id}`,  result.wt);

  const row = $(`mrow-${result.id}`);
  if (row) row.classList.add('ps-row-done');
}

/* ── Average WT / TAT strip ──────────────────────────── */
function showAverages(results) {
  const n    = results.length;
  const avgT = (results.reduce((s, r) => s + r.tat, 0) / n).toFixed(2);
  const avgW = (results.reduce((s, r) => s + r.wt,  0) / n).toFixed(2);

  DOM.avgWrap.innerHTML = `
    <span class="ps-avg-badge">Avg TAT: <strong>${avgT}</strong></span>
    <span class="ps-avg-badge">Avg WT: <strong>${avgW}</strong></span>
  `;
}

/* ============================================================
   PRIORITY QUEUE VISUALIZATION
   Shows all arrived processes sorted by priority.
   The selected (winning) process gets a crown badge.
============================================================ */
function renderQueue(items, atTime) {
  if (!items || items.length === 0) {
    DOM.queueViz.innerHTML =
      '<div class="ps-empty-msg"><i class="fas fa-layer-group"></i> No processes in queue.</div>';
    return;
  }

  const sorted = [...items].sort((a, b) => a.priority - b.priority);

  DOM.queueViz.innerHTML = `
    <div class="ps-queue-time-label">Available at T = ${atTime}</div>
    <div class="ps-queue-row">
      ${sorted.map((p, rank) => `
        <div class="ps-q-item${p.selected ? ' ps-q-selected' : ''}">
          <span class="ps-q-rank">#${rank + 1}</span>
          <span class="ps-q-pid"
            style="background:${p.color}22;
                   border-color:${p.color};
                   color:${p.color}">
            ${p.pid}
          </span>
          <div class="ps-q-details">
            <div class="ps-q-info">
              <span class="ps-q-lbl">Priority</span>
              <span class="ps-q-val${p.selected ? ' ps-q-val-winner' : ''}">
                ${p.priority}
              </span>
            </div>
            <div class="ps-q-info">
              <span class="ps-q-lbl">Burst</span>
              <span class="ps-q-val">${p.burst}</span>
            </div>
          </div>
          ${p.selected
            ? `<div class="ps-selected-crown">
                 <i class="fas fa-crown"></i> SELECTED
               </div>`
            : ''}
        </div>
      `).join('')}
    </div>
  `;
}

/* ============================================================
   GANTT CHART HELPERS
============================================================ */

/* ── Initialise: clear chart and timeline, record total ── */
function initGantt(timeline) {
  S.totalTime = timeline[timeline.length - 1].end;
  DOM.ganttChart.innerHTML  = '';
  DOM.ganttLine.innerHTML   = '';
  DOM.ganttLegend.innerHTML = '';
  DOM.timeLabel.textContent = 'Time: 0';

  /* t = 0 marker */
  addTimeMarker(0);

  /* Legend: one dot per process (no idle) */
  processes.forEach((p, i) => {
    const c   = clr(i);
    const div = document.createElement('div');
    div.className = 'ps-legend-item';
    div.innerHTML = `
      <span class="ps-legend-dot" style="background:${c}"></span>
      ${p.pid}
    `;
    DOM.ganttLegend.appendChild(div);
  });
}

/* ── Add one bar to the Gantt chart ──────────────────── */
function addGanttBar(entry) {
  const duration = entry.end - entry.start;
  const widthPct = (duration / S.totalTime) * 100;

  const bar = document.createElement('div');
  bar.className = 'ps-g-bar';
  bar.title     = entry.type === 'idle'
    ? `IDLE: T${entry.start}–T${entry.end}`
    : `${entry.pid} (Priority ${entry.priority}): T${entry.start}–T${entry.end}`;

  bar.style.cssText = `
    width      : 0%;
    background : ${entry.type === 'idle' ? IDLE_CLR : entry.color};
    border-right: 1px solid rgba(0,0,0,.25);
    ${entry.type === 'idle' ? 'opacity:.65;' : ''}
  `;

  bar.innerHTML = `
    <span class="ps-g-pid">${entry.type === 'idle' ? 'IDLE' : entry.pid}</span>
    <span class="ps-g-t-start">${entry.start}</span>
  `;

  DOM.ganttChart.appendChild(bar);

  /* ── Animate bar width growing (two rAF for style flush) ── */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bar.style.width = widthPct + '%';
    });
  });

  /* ── Add end-time marker after the bar finishes growing ── */
  later(() => {
    DOM.timeLabel.textContent = `Time: ${entry.end}`;
    addTimeMarker(entry.end);
  }, S.stepDelay * 0.7);
}

/* ── Add a time marker below the Gantt chart ─────────── */
function addTimeMarker(t) {
  /* Avoid duplicate markers */
  if (DOM.ganttLine.querySelector(`[data-t="${t}"]`)) return;

  const span = document.createElement('span');
  span.className    = 'ps-t-marker';
  span.dataset.t    = t;
  span.textContent  = t;
  span.style.left   = `${(t / S.totalTime) * 100}%`;
  DOM.ganttLine.appendChild(span);
}

/* ============================================================
   MAIN SIMULATION LOOP
   Walks timeline entries with timed delays.
   Each step:
     1. Update priority queue display
     2. Update step description
     3. Add animated Gantt bar
     4. Fill metrics row (after bar finishes animating)
============================================================ */
function playSimulation() {
  const { timeline, results } = computeSchedule();

  initGantt(timeline);
  renderMetricsInit();
  setStatus('Running...', 'running');

  let cumDelay = 0;

  timeline.forEach((entry, stepIdx) => {
    const d = cumDelay;  // capture for closure

    later(() => {
      /* ── Priority queue + step description ── */
      if (entry.type === 'process') {
        renderQueue(entry.queueSnapshot, entry.start);
        setStep(`
          <strong>Step ${stepIdx + 1}:</strong>
          At T = <strong>${entry.start}</strong>,
          <span style="color:${entry.color};font-weight:800">${entry.pid}</span>
          has the highest priority
          (<strong>PR = ${entry.priority}</strong>)
          among all arrived processes.
          It runs from T = ${entry.start} → T = ${entry.end}
          <em>(Burst = ${entry.burst})</em>.
        `);
      } else {
        /* idle slot */
        DOM.queueViz.innerHTML = `
          <div class="ps-empty-msg">
            <i class="fas fa-hourglass-half"></i>
            CPU idle from T = ${entry.start} to T = ${entry.end}.
            No process has arrived yet.
          </div>
        `;
        setStep(`
          <strong>Step ${stepIdx + 1}:</strong>
          CPU is <span class="ps-idle-text">IDLE</span>
          from T = ${entry.start} to T = ${entry.end}.
          Waiting for the next process to arrive.
        `);
      }

      /* ── Gantt bar ── */
      addGanttBar(entry);

    }, d);

    /* ── Fill metrics after the Gantt animation finishes ── */
    if (entry.type === 'process') {
      later(() => {
        const result = results.find(r => r.id === entry.id);
        if (result) fillMetricsRow(result);
      }, d + S.stepDelay * 0.82);
    }

    cumDelay += S.stepDelay;
  });

  /* ── All steps done ── */
  later(() => {
    setStatus('✅ Completed', 'done');
    setStep(`
      <strong>All ${processes.length} processes scheduled!</strong>
      Check the Gantt chart and metrics table for the complete results.
    `);
    showAverages(results);
    S.isPlaying = false;
  }, cumDelay);
}

/* ============================================================
   RESET — clears animation, resets all UI panels
============================================================ */
function doReset() {
  cancelAll();
  S.isPlaying = false;
  S.isPaused  = false;

  DOM.queueViz.innerHTML = `
    <div class="ps-empty-msg">
      <i class="fas fa-layer-group"></i>
      Start the simulation to see the priority queue.
    </div>
  `;
  DOM.ganttChart.innerHTML = `
    <div class="ps-empty-msg">Gantt chart builds here during simulation.</div>
  `;
  DOM.ganttLine.innerHTML   = '';
  DOM.ganttLegend.innerHTML = '';
  DOM.timeLabel.textContent = 'Time: 0';
  DOM.avgWrap.innerHTML     = '';

  setStatus('Ready', 'ready');
  setStep('Configure the process table on the left, then press <strong>Play</strong> to start the simulation.');
  renderMetricsInit();
}

/* ============================================================
   VALIDATION
   Returns an error message string, or null if all OK.
============================================================ */
function validate() {
  if (processes.length === 0)
    return 'Add at least one process.';
  if (processes.some(p => p.burst < 1))
    return 'All burst times must be ≥ 1.';
  if (processes.some(p => p.arrival < 0))
    return 'Arrival times cannot be negative.';
  return null;
}

/* ============================================================
   EVENT LISTENERS
============================================================ */

/* Add process */
DOM.addBtn.addEventListener('click', () => {
  if (processes.length >= MAX_PROCS) {
    setStep(`<span class="ps-error-text">Maximum of ${MAX_PROCS} processes allowed.</span>`);
    return;
  }
  processes.push({
    id      : nextId++,
    pid     : `P${processes.length + 1}`,
    arrival : 0,
    burst   : 3,
    priority: processes.length + 1,
  });
  renderTable();
  doReset();
});

/* Speed slider */
DOM.speedSlider.addEventListener('input', () => {
  S.stepDelay = +DOM.speedSlider.value;
  DOM.speedDisplay.textContent = `${S.stepDelay}ms`;
});

/* Play */
DOM.playBtn.addEventListener('click', () => {
  if (S.isPlaying) return;

  const err = validate();
  if (err) {
    setStep(`<span class="ps-error-text"><i class="fas fa-triangle-exclamation"></i> ${err}</span>`);
    return;
  }

  S.isPlaying = true;
  S.isPaused  = false;
  playSimulation();
});

/* Pause — cancels pending timeouts; already-rendered bars stay */
DOM.pauseBtn.addEventListener('click', () => {
  if (!S.isPlaying) return;
  cancelAll();
  S.isPlaying = false;
  S.isPaused  = true;
  setStatus('Paused', 'paused');
});

/* Reset */
DOM.resetBtn.addEventListener('click', () => {
  doReset();
  renderTable();
});

/* Copy code */
DOM.copyBtn.addEventListener('click', () => {
  const text = $('codeBlock')?.textContent?.trim() || '';
  navigator.clipboard.writeText(text).then(() => {
    DOM.copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => {
      DOM.copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy';
    }, 1600);
  });
});

/* ============================================================
   INIT — called once on page load
============================================================ */
(function init() {
  S.stepDelay = +DOM.speedSlider.value;
  DOM.speedDisplay.textContent = `${S.stepDelay}ms`;
  renderTable();
  renderMetricsInit();
  setStatus('Ready', 'ready');
})();