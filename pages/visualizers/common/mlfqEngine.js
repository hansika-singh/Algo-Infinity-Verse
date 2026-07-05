// pages/visualizers/common/mlfqEngine.js
// Pure simulation engine for MLFQ visualizer
// Exported function generateScheduleTrace replicates the original deterministic engine.

/** Clamp integer within [min, max] */
function clampInt(n, min, max) {
  const x = Math.floor(Number(n));
  if (Number.isNaN(x)) return min;
  return Math.min(max, Math.max(min, x));
}

/** Clone process objects to avoid mutating original inputs */
function cloneProcesses(processes) {
  return processes.map((p) => ({ ...p }));
}

/** Build a map of process id → process object */
function buildProcessesById(processes) {
  const map = new Map();
  processes.forEach((p) => map.set(p.id, p));
  return map;
}

/**
 * Generate a deterministic schedule trace for MLFQ.
 * @param {Object} param0
 * @param {Array} param0.processes - Array of process definitions ({id, arrivalTime, burstTimeTotal, initialQueueLevel})
 * @param {number} param0.queueCount - Number of queues
 * @param {Array<number>} param0.quantumPerQueue - Quantum for each queue level
 * @param {number} param0.agingThreshold - Aging promotion threshold (ticks)
 * @returns {Array<Object>} trace events
 */
export function generateScheduleTrace({ processes, queueCount, quantumPerQueue, agingThreshold }) {
  const procs = cloneProcesses(processes).map((p) => {
    return {
      id: p.id,
      arrivalTime: p.arrivalTime,
      burstTimeTotal: p.burstTimeTotal,
      remainingTime: p.burstTimeTotal,
      queueLevel: clampInt(p.initialQueueLevel, 0, queueCount - 1),
      age: 0,
      // helper
      lastEnqueuedAt: p.arrivalTime,
      completedAt: null,
    };
  });

  // Sort by arrival then by id stable
  procs.sort((a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));

  const arrivals = new Map();
  procs.forEach((p) => {
    if (!arrivals.has(p.arrivalTime)) arrivals.set(p.arrivalTime, []);
    arrivals.get(p.arrivalTime).push(p.id);
  });

  const queues = Array.from({ length: queueCount }, () => []);
  const processesById = new Map(procs.map((p) => [p.id, p]));

  let cpuRunning = null;
  let cpuQueueLevel = null;
  let quantumLeft = 0;

  let t = 0;
  const trace = [];
  const MAX_T = 500;
  for (let stepGuard = 0; stepGuard < MAX_T; stepGuard++) {
    if (procs.every((p) => p.remainingTime === 0)) break;

    // 1) Arrivals at time t
    if (arrivals.has(t)) {
      for (const pid of arrivals.get(t)) {
        const p = processesById.get(pid);
        const level = clampInt(p.queueLevel, 0, queueCount - 1);
        queues[level].push(pid);
        p.queueLevel = level;
        p.age = 0;
        trace.push({ type: 'arrive', t, pid, queueLevel: level });
      }
    }

    // 2) Aging: increment age for waiting processes
    for (let level = 0; level < queueCount; level++) {
      const q = queues[level];
      for (let i = 0; i < q.length; i++) {
        const pid = q[i];
        if (pid === cpuRunning) continue;
        const p = processesById.get(pid);
        p.age += 1;
      }
    }

    // Promotions based on aging threshold
    for (let level = 1; level < queueCount; level++) {
      const q = queues[level];
      const keep = [];
      const toPromote = [];
      q.forEach((pid) => {
        const p = processesById.get(pid);
        if (p.age >= agingThreshold && level > 0) toPromote.push(pid);
        else keep.push(pid);
      });
      if (toPromote.length) {
        queues[level] = keep;
        toPromote.forEach((pid) => {
          const p = processesById.get(pid);
          p.queueLevel = level - 1;
          p.age = 0;
          queues[level - 1].push(pid);
          trace.push({ type: 'promote', t, pid, fromQueue: level, toQueue: level - 1 });
        });
      }
    }

    // Dispatch if CPU idle
    const highestNonEmpty = () => {
      for (let ql = 0; ql < queueCount; ql++) {
        if (queues[ql].length > 0) return ql;
      }
      return null;
    };

    if (!cpuRunning) {
      const ql = highestNonEmpty();
      if (ql !== null) {
        const pid = queues[ql].shift();
        cpuRunning = pid;
        cpuQueueLevel = ql;
        quantumLeft = quantumPerQueue[ql];
        trace.push({ type: 'dispatch', t, pid, fromQueue: ql, quantum: quantumLeft });
      }
    }

    if (!cpuRunning) {
      trace.push({ type: 'idle', t });
      t += 1;
      continue;
    }

    // Execute one tick
    const p = processesById.get(cpuRunning);
    p.remainingTime -= 1;
    quantumLeft -= 1;

    if (!p._currentSlice) {
      p._currentSlice = { startedAt: t, fromQueue: cpuQueueLevel, processId: p.id, duration: 0 };
    }
    p._currentSlice.duration += 1;

    const sliceEnds = p.remainingTime === 0 || quantumLeft === 0;
    if (sliceEnds) {
      const s = p._currentSlice;
      delete p._currentSlice;
      trace.push({
        type: 'run_slice',
        t: s.startedAt,
        duration: s.duration,
        processId: s.processId,
        fromQueue: s.fromQueue,
        completed: p.remainingTime === 0,
        quantumEnd: p.remainingTime > 0 && quantumLeft === 0,
      });

      if (p.remainingTime === 0) {
        p.completedAt = t + 1;
        trace.push({ type: 'complete', t: t + 1, pid: p.id });
        cpuRunning = null;
        cpuQueueLevel = null;
        quantumLeft = 0;
      } else if (quantumLeft === 0) {
        const from = cpuQueueLevel;
        const to = Math.min(queueCount - 1, from + 1);
        p.queueLevel = to;
        p.age = 0;
        trace.push({ type: 'demote', t: t + 1, pid: p.id, fromQueue: from, toQueue: to });
        queues[to].push(p.id);
        cpuRunning = null;
        cpuQueueLevel = null;
        quantumLeft = 0;
      }
    }

    t += 1;
  }

  // Assign traceIndex for UI convenience
  trace.forEach((x, idx) => (x.traceIndex = idx));
  return trace;
}
