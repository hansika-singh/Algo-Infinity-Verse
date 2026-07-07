(function () {
  "use strict";

  // Preemptive Priority (higher number = higher priority by default)
  // Fixed waiting-time accounting:
  //   - Track lastEnqueuedAt for each process when it enters READY
  //   - When dispatched to CPU at tick t, add (t - lastEnqueuedAt) to waitingTime
  // This avoids double-counting around preemption/arrival boundaries.

  const $ = (sel) => document.querySelector(sel);

  const els = {
    priorityHighIsBigger: $("#priorityHighIsBigger"),
    tieBreakMode: $("#tieBreakMode"),
    simSpeed: $("#simSpeed"),
    simSpeedValue: $("#simSpeedValue"),
    btnLoadExample: $("#btnLoadExample"),
    btnGenerate: $("#btnGenerate"),
    btnStart: $("#btnStart"),
    btnPause: $("#btnPause"),
    btnStep: $("#btnStep"),
    btnReset: $("#btnReset"),
    pId: $("#pId"),
    pArrival: $("#pArrival"),
    pBurst: $("#pBurst"),
    pPriority: $("#pPriority"),
    btnAddProcess: $("#btnAddProcess"),
    processList: $("#processList"),
    cpuTimeline: $("#cpuTimeline"),
    currentCpuBadge: $("#currentCpuBadge"),
    tickBadge: $("#tickBadge"),
    scheduleLog: $("#scheduleLog"),
    avgWaiting: $("#avgWaiting"),
    avgTurnaround: $("#avgTurnaround"),
    avgResponse: $("#avgResponse"),
    metricsTableBody: $("#metricsTableBody"),
  };

  function formatPid(pid) {
    return String(pid);
  }

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  let state = null;
  let timer = null;

  function resetTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function setControlsEnabled({ canStart, canPause, canStep }) {
    els.btnStart.disabled = !canStart;
    els.btnPause.disabled = !canPause;
    els.btnStep.disabled = !canStep;
  }

  function getPriorityComparator() {
    // Returns a function (a,b)=>true if a has higher priority than b
    const higherIsBigger = els.priorityHighIsBigger?.value === "bigger";
    return (pA, pB) => (higherIsBigger ? pA > pB : pA < pB);
  }

  function tieBreakCompare(a, b, tieBreakMode) {
    if (a.priority !== b.priority) {
      const higher = getPriorityComparator();
      if (higher(a.priority, b.priority)) return -1;
      if (higher(b.priority, a.priority)) return 1;
    }

    if (tieBreakMode === "pid") {
      return String(a.pid).localeCompare(String(b.pid));
    }

    // FIFO by arrival then pid
    if (a.arrival !== b.arrival) return a.arrival - b.arrival;
    return String(a.pid).localeCompare(String(b.pid));
  }

  function buildReadyOrder(readyPids) {
    const tieBreakMode = els.tieBreakMode?.value || "fifo";
    const arr = readyPids
      .map((pid) => state.processesById.get(pid))
      .filter(Boolean)
      .map((rp) => ({ ...rp }));

    arr.sort((a, b) => {
      const cmp = tieBreakCompare(a, b, tieBreakMode);
      return cmp;
    });

    return arr.map((p) => p.pid);
  }

  function logLine(text, kind = "info") {
    const row = createEl("div", "log-row");
    row.classList.add(`log-${kind}`);
    row.textContent = text;
    els.scheduleLog.appendChild(row);
    // Keep log scrolled
    els.scheduleLog.scrollTop = els.scheduleLog.scrollHeight;
  }

  function renderProcessList() {
    els.processList.innerHTML = "";
    if (!state.processList.length) {
      els.processList.appendChild(createEl("div", "empty-state", "No processes yet. Add a process or load an example."));
      return;
    }
    for (const p of state.processList) {
      const item = createEl("div", "process-item");
      item.innerHTML = `
        <div class="process-pid">${formatPid(p.pid)}</div>
        <div class="process-meta">arrival: ${p.arrival}, burst: ${p.burst}, priority: ${p.priority}</div>
      `;
      els.processList.appendChild(item);
    }
  }

  function setCpuBadge(pid) {
    if (!pid) {
      els.currentCpuBadge.textContent = "CPU: idle";
      els.currentCpuBadge.className = "timeline-badge";
      return;
    }
    els.currentCpuBadge.textContent = `CPU: ${formatPid(pid)}`;
    els.currentCpuBadge.className = "timeline-badge";
  }

  function tickBadge(t) {
    els.tickBadge.textContent = `Tick: ${t}`;
  }

  function renderTimelineSegment(pid, startTick, endTick, kind) {
    // kind: 'run' | 'idle'
    const seg = createEl("div", "timeline-segment");
    const width = Math.max(1, endTick - startTick);
    seg.style.width = `${width * 34}px`;
    seg.title = `${kind} ${formatPid(pid || "idle")} [${startTick}, ${endTick})`;

    if (kind === "idle") {
      seg.classList.add("seg-idle");
      seg.innerHTML = `<div class="seg-label">idle</div>`;
    } else {
      seg.classList.add("seg-run");
      seg.innerHTML = `<div class="seg-label">${formatPid(pid)}</div>`;
    }

    els.cpuTimeline.appendChild(seg);
  }

  function clearSimulationUI() {
    resetTimer();
    els.cpuTimeline.innerHTML = "";
    els.scheduleLog.innerHTML = "";
    els.avgWaiting.textContent = "-";
    els.avgTurnaround.textContent = "-";
    els.avgResponse.textContent = "-";
    els.metricsTableBody.innerHTML = "";
  }

  function computeAndRenderMetrics() {
    const procs = state.processList;
    const sums = { waiting: 0, turnaround: 0, response: 0 };

    for (const p of procs) {
      const rp = state.processesById.get(p.pid);
      sums.waiting += rp.waitingTime;
      sums.turnaround += rp.turnaroundTime;
      sums.response += rp.responseTime;
    }

    const n = procs.length || 1;
    els.avgWaiting.textContent = (sums.waiting / n).toFixed(2);
    els.avgTurnaround.textContent = (sums.turnaround / n).toFixed(2);
    els.avgResponse.textContent = (sums.response / n).toFixed(2);

    const rows = [];
    for (const p of procs) {
      const rp = state.processesById.get(p.pid);
      rows.push(
        `<tr>
          <td>${formatPid(rp.pid)}</td>
          <td>${rp.arrival}</td>
          <td>${p.burst}</td>
          <td>${rp.priority}</td>
          <td>${rp.waitingTime}</td>
          <td>${rp.turnaroundTime}</td>
          <td>${rp.responseTime}</td>
        </tr>`
      );
    }
    els.metricsTableBody.innerHTML = rows.join("");
  }

  function initSimulation(processList) {
    clearSimulationUI();

    state = {
      tick: 0,
      processesById: new Map(),
      processList: processList.map((p) => ({ ...p })),

      // READY contains pids that are not running at current tick
      ready: [],

      runningPid: null,
      cpuSegment: null, // { pid,start }

      // Used for fixed waiting-time accounting
      // For each process:
      //   lastEnqueuedAt: tick when it most recently entered READY
      //   waitingTime: accumulated when dispatched
      //   responseTime: computed at first dispatch
    };

    for (const p of state.processList) {
      state.processesById.set(p.pid, {
        pid: p.pid,
        arrival: p.arrival,
        burstTime: p.burst,
        remainingTime: p.burst,
        priority: p.priority,

        waitingTime: 0,
        turnaroundTime: 0,
        responseTime: null,
        firstDispatchAt: null,

        lastEnqueuedAt: null,
        isCompleted: false,
        completionTime: null,
      });
    }

    // Initialize ready with any arrivals at tick 0
    const arrivalsAt0 = state.processList.filter((p) => p.arrival === 0).map((p) => p.pid);
    state.ready = arrivalsAt0;
    for (const pid of state.ready) {
      const rp = state.processesById.get(pid);
      rp.lastEnqueuedAt = 0;
    }

    state.tick = 0;
    tickBadge(state.tick);
    setCpuBadge(null);

    logLine(`Initialized ${state.processList.length} processes.`, "info");

    setControlsEnabled({ canStart: true, canPause: false, canStep: true });
  }

  function enqueueArrivalsAtTick(t) {
    const incoming = state.processList.filter((p) => p.arrival === t && !state.processesById.get(p.pid).isCompleted);
    for (const p of incoming) {
      const rp = state.processesById.get(p.pid);
      if (rp.remainingTime <= 0) continue;
      // If it is not already in READY, enqueue.
      if (!state.ready.includes(p.pid) && p.pid !== state.runningPid) {
        state.ready.push(p.pid);
        rp.lastEnqueuedAt = t;
        logLine(`t=${t}: Process ${formatPid(p.pid)} arrived -> READY`);
      }
    }
  }

  function dispatchNext(t) {
    if (state.ready.length === 0) return null;

    const ordered = buildReadyOrder(state.ready);
    const nextPid = ordered[0];

    // Remove from ready
    const idx = state.ready.indexOf(nextPid);
    if (idx !== -1) state.ready.splice(idx, 1);

    const rp = state.processesById.get(nextPid);

    // Fixed waiting-time update: add elapsed READY time since last enqueued
    if (rp.lastEnqueuedAt != null) {
      rp.waitingTime += t - rp.lastEnqueuedAt;
      rp.lastEnqueuedAt = null;
    }

    if (rp.firstDispatchAt == null) {
      rp.firstDispatchAt = t;
      rp.responseTime = t - rp.arrival;
    }

    return nextPid;
  }

  function maybePreemptAtTick(t) {
    // Determine if a higher-priority ready process should preempt running.
    if (!state.runningPid) return;

    // Order ready
    if (state.ready.length === 0) return;

    const ordered = buildReadyOrder(state.ready);
    const candidatePid = ordered[0];

    const running = state.processesById.get(state.runningPid);
    const candidate = state.processesById.get(candidatePid);

    const higher = getPriorityComparator();

    const candidateHigher = higher(candidate.priority, running.priority);
    let shouldPreempt = candidateHigher;

    if (!candidateHigher && candidate.priority === running.priority) {
      // If same priority, tie-break decided by ordering: if candidate is first among ready
      // then preempt so CPU runs the same ordering policy.
      shouldPreempt = true;
    }

    if (!shouldPreempt) return;

    // Preempt: move running back to READY, reset its lastEnqueuedAt.
    state.ready.push(state.runningPid);
    running.lastEnqueuedAt = t;

    logLine(
      `t=${t}: Preempt -> ${formatPid(running.pid)} back to READY, dispatch candidate ${formatPid(candidatePid)}`,
      "preempt"
    );

    state.runningPid = null;
  }

  function completeIfNeeded(t) {
    if (!state.runningPid) return;
    const rp = state.processesById.get(state.runningPid);
    if (!rp || rp.remainingTime <= 0) return;

    rp.remainingTime -= 1;

    if (rp.remainingTime === 0) {
      rp.isCompleted = true;
      rp.completionTime = t + 1;
      rp.turnaroundTime = rp.completionTime - rp.arrival;
      logLine(`t=${t + 1}: Process ${formatPid(rp.pid)} completed (turnaround=${rp.turnaroundTime}).`, "complete");
      state.runningPid = null;
    }
  }

  function stepSimulation() {
    const t = state.tick;

    // Arrivals may join READY at the start of this tick
    enqueueArrivalsAtTick(t);

    // Decide preemption before dispatch/execution for this tick
    maybePreemptAtTick(t);

    // Dispatch if CPU idle
    if (!state.runningPid) {
      const nextPid = dispatchNext(t);
      state.runningPid = nextPid;
      if (nextPid != null) {
        setCpuBadge(nextPid);
      } else {
        setCpuBadge(null);
      }
    }

    // Render CPU segment for this tick (simple: one segment per tick)
    renderTimelineSegment(state.runningPid, t, t + 1, state.runningPid ? "run" : "idle");

    tickBadge(t);

    // Execute 1 tick
    completeIfNeeded(t);

    state.tick += 1;

    // Stop condition: all completed and no ready/running
    const allDone = state.processList.every((p) => state.processesById.get(p.pid).isCompleted);
    if (allDone && state.ready.length === 0 && !state.runningPid) {
      resetTimer();
      setControlsEnabled({ canStart: false, canPause: false, canStep: false });
      tickBadge(state.tick);
      setCpuBadge(null);
      computeAndRenderMetrics();
      logLine(`Simulation complete at t=${state.tick}.`);
    }
  }

  function start() {
    resetTimer();
    const speed = Number(els.simSpeed.value || 1);
    const intervalMs = Math.round(850 / speed);

    setControlsEnabled({ canStart: false, canPause: true, canStep: false });

    timer = setInterval(() => {
      try {
        stepSimulation();
      } catch (e) {
        console.error(e);
        resetTimer();
      }
    }, intervalMs);
  }

  function pause() {
    resetTimer();
    setControlsEnabled({ canStart: false, canPause: false, canStep: true });
  }

  function stepOnce() {
    if (!state) return;
    stepSimulation();
  }

  function loadExample() {
    // Example chosen to trigger frequent preemptions around tick boundaries.
    const example = [
      { pid: "P1", arrival: 0, burst: 5, priority: 1 },
      { pid: "P2", arrival: 1, burst: 3, priority: 10 },
      { pid: "P3", arrival: 2, burst: 2, priority: 11 },
    ];
    state = null;

    // Render in pending list state-like structure
    const list = example.map((p) => ({ ...p }));
    // Ensure we keep it in a temporary place before generating.
    state = {
      processList: list,
    };
    renderProcessListFromTemp();
    els.btnGenerate.disabled = false;
  }

  function renderProcessListFromTemp() {
    const list = state?.processList || [];
    // temp render: reuse UI
    els.processList.innerHTML = "";
    if (!list.length) {
      els.processList.appendChild(createEl("div", "empty-state", "No processes yet. Add a process or load an example."));
      return;
    }
    for (const p of list) {
      const item = createEl("div", "process-item");
      item.innerHTML = `
        <div class="process-pid">${formatPid(p.pid)}</div>
        <div class="process-meta">arrival: ${p.arrival}, burst: ${p.burst}, priority: ${p.priority}</div>
      `;
      els.processList.appendChild(item);
    }
  }

  function generate() {
    const processes = state?.processList || [];
    if (!processes.length) return;

    // Validate
    for (const p of processes) {
      if (!p.pid) throw new Error("PID missing");
      if (p.arrival < 0) throw new Error("arrival must be >=0");
      if (p.burst <= 0) throw new Error("burst must be >=1");
      if (Number.isNaN(p.priority)) throw new Error("priority invalid");
    }

    initSimulation(processes);
  }

  function addProcessFromForm() {
    if (!state || !state.processList) {
      state = { processList: [] };
    }

    const pidRaw = String(els.pId.value || "").trim();
    const arrival = Number(els.pArrival.value);
    const burst = Number(els.pBurst.value);
    const priority = Number(els.pPriority.value);

    if (!pidRaw) return;
    if (state.processList.some((p) => p.pid === pidRaw)) {
      // Avoid duplicates
      return;
    }

    state.processList.push({ pid: pidRaw, arrival, burst, priority });
    renderProcessList();
  }

  function resetAll() {
    resetTimer();
    state = { processList: state?.processList || [] };
    clearSimulationUI();
    renderProcessList();
    setControlsEnabled({ canStart: false, canPause: false, canStep: false });
    els.tickBadge.textContent = "Tick: 0";
    els.currentCpuBadge.textContent = "CPU: idle";
  }

  // Wire UI
  if (els.simSpeed) {
    const updateSpeedUI = () => {
      const v = Number(els.simSpeed.value || 1);
      els.simSpeedValue.textContent = `${v.toFixed(1)}x`;
    };
    els.simSpeed.addEventListener("input", updateSpeedUI);
    updateSpeedUI();
  }

  if (els.btnLoadExample) els.btnLoadExample.addEventListener("click", () => {
    // Keep existing processes if any? For simplicity, replace.
    state = { processList: [] };
    loadExample();
    // After load, allow generate
    els.btnGenerate.disabled = false;
  });

  if (els.btnGenerate) els.btnGenerate.addEventListener("click", () => {
    generate();
    els.btnGenerate.disabled = true;
  });

  if (els.btnStart) els.btnStart.addEventListener("click", start);
  if (els.btnPause) els.btnPause.addEventListener("click", pause);
  if (els.btnStep) els.btnStep.addEventListener("click", stepOnce);
  if (els.btnReset) els.btnReset.addEventListener("click", resetAll);

  if (els.btnAddProcess) els.btnAddProcess.addEventListener("click", () => addProcessFromForm());

  // Initial temp state
  if (!state) state = { processList: [] };
  renderProcessList();

  // Start with controls disabled until generated
  setControlsEnabled({ canStart: false, canPause: false, canStep: false });
})();

