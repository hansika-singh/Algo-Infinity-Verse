/**
 * Amortized Cost Sandbox
 * Dynamic Array doubling + Hash Map rehash — per-op cost bars & cumulative average.
 */
(() => {
  'use strict';

  const MAX_HISTORY = 64;
  const MAX_CAPACITY_DISPLAY = 64;

  const els = {
    modeArray: document.getElementById('modeArray'),
    modeHash: document.getElementById('modeHash'),
    modeHint: document.getElementById('modeHint'),
    initialCap: document.getElementById('initialCap'),
    initialCapVal: document.getElementById('initialCapVal'),
    loadFactorGroup: document.getElementById('loadFactorGroup'),
    loadFactor: document.getElementById('loadFactor'),
    loadFactorVal: document.getElementById('loadFactorVal'),
    btnPush: document.getElementById('btnPush'),
    btnPop: document.getElementById('btnPop'),
    btnPlay: document.getElementById('btnPlay'),
    btnReset: document.getElementById('btnReset'),
    pushLabel: document.getElementById('pushLabel'),
    playSpeed: document.getElementById('playSpeed'),
    playSpeedVal: document.getElementById('playSpeedVal'),
    statSizeCap: document.getElementById('statSizeCap'),
    statOps: document.getElementById('statOps'),
    statLastCost: document.getElementById('statLastCost'),
    statTotal: document.getElementById('statTotal'),
    statAvg: document.getElementById('statAvg'),
    statResizes: document.getElementById('statResizes'),
    amortizedCallout: document.getElementById('amortizedCallout'),
    theoryText: document.getElementById('theoryText'),
    structureTitle: document.getElementById('structureTitle'),
    structureSub: document.getElementById('structureSub'),
    slotsView: document.getElementById('slotsView'),
    mainStatus: document.getElementById('mainStatus'),
    costChart: document.getElementById('costChart'),
    chartEmpty: document.getElementById('chartEmpty'),
    eventLog: document.getElementById('eventLog'),
  };

  const THEORY = {
    array:
      'Doubling capacity means each element is copied at most <code>O(log n)</code> times across its lifetime. Sum of all resize costs is <code>&lt; 2n</code>, so average cost per push is <strong>O(1)</strong>.',
    hashmap:
      'When load factor exceeds the threshold, the table doubles and all keys are rehashed. Aggregate rehash cost is linear in total inserts, so average insert cost remains <strong>amortized O(1)</strong>.',
  };

  const HINTS = {
    array: 'Capacity doubles on overflow. Resize cost = copy all existing elements + insert.',
    hashmap: 'Rehash when size / capacity ≥ load factor. Rehash cost = re-insert every key into a doubled table.',
  };

  let state = createState(2, 'array', 0.75);
  let autoTimer = null;
  let nextValue = 1;

  function createState(capacity, mode, loadFactor) {
    return {
      mode,
      capacity: Math.max(1, capacity),
      size: 0,
      items: [],
      loadFactor,
      history: [],
      totalCost: 0,
      resizes: 0,
      lastCost: null,
      lastWasResize: false,
    };
  }

  function log(message, kind = 'sys') {
    const row = document.createElement('div');
    row.className = `acs-log-entry ${kind}`;
    row.textContent = `> ${message}`;
    els.eventLog.prepend(row);
    while (els.eventLog.children.length > 40) {
      els.eventLog.lastChild.remove();
    }
  }

  function setStatus(text) {
    els.mainStatus.textContent = text;
  }

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
    els.btnPlay.innerHTML = '<i class="fas fa-play"></i> Auto Push ×10';
    els.btnPlay.setAttribute('aria-pressed', 'false');
  }

  function average() {
    if (state.history.length === 0) return 0;
    return state.totalCost / state.history.length;
  }

  function shouldShowAmortizedProof() {
    if (state.history.length < 8) return false;
    const avg = average();
    // After enough ops, avg should stay well below the last resize spike size
    const maxCost = Math.max(...state.history.map((h) => h.cost));
    return avg <= 4 && maxCost >= state.capacity / 2;
  }

  function updateTelemetry() {
    els.statSizeCap.textContent = `${state.size} / ${state.capacity}`;
    els.statOps.textContent = String(state.history.length);
    els.statLastCost.textContent = state.lastCost == null ? '—' : String(state.lastCost);
    els.statTotal.textContent = String(state.totalCost);
    els.statAvg.textContent = average().toFixed(2);
    els.statResizes.textContent = String(state.resizes);
    els.structureSub.textContent = `capacity = ${state.capacity}`;
    els.btnPop.disabled = state.size === 0 || Boolean(autoTimer);

    const showProof = shouldShowAmortizedProof();
    els.amortizedCallout.hidden = !showProof;
  }

  function renderSlots(highlightResize = false) {
    const frag = document.createDocumentFragment();
    const displayCap = Math.min(state.capacity, MAX_CAPACITY_DISPLAY);

    for (let i = 0; i < displayCap; i++) {
      const slot = document.createElement('div');
      slot.className = 'acs-slot';
      slot.setAttribute('role', 'listitem');

      if (i < state.size) {
        slot.classList.add('filled');
        const val = state.items[i];
        slot.textContent = state.mode === 'hashmap' ? String(val) : String(val);
        if (i === state.size - 1 && !highlightResize) {
          slot.classList.add('just-added');
        }
        if (highlightResize) {
          slot.classList.add('resizing');
        }
      } else {
        slot.textContent = '·';
        slot.setAttribute('aria-label', 'empty slot');
      }
      frag.appendChild(slot);
    }

    if (state.capacity > MAX_CAPACITY_DISPLAY) {
      const more = document.createElement('div');
      more.className = 'acs-slot filled';
      more.textContent = `+${state.capacity - MAX_CAPACITY_DISPLAY}`;
      more.title = `${state.capacity - MAX_CAPACITY_DISPLAY} more slots`;
      frag.appendChild(more);
    }

    els.slotsView.replaceChildren(frag);
  }

  function renderChart() {
    const svg = els.costChart;
    const history = state.history;
    els.chartEmpty.classList.toggle('hidden', history.length > 0);

    if (history.length === 0) {
      svg.replaceChildren();
      return;
    }

    const W = 640;
    const H = 220;
    const padL = 36;
    const padR = 12;
    const padT = 16;
    const padB = 36;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const maxCost = Math.max(2, ...history.map((h) => h.cost));
    const n = history.length;
    const gap = 2;
    const barW = Math.max(4, (plotW - gap * (n - 1)) / n);

    const ns = 'http://www.w3.org/2000/svg';
    const root = document.createDocumentFragment();

    // Axes
    const axis = document.createElementNS(ns, 'line');
    axis.setAttribute('x1', String(padL));
    axis.setAttribute('y1', String(padT + plotH));
    axis.setAttribute('x2', String(W - padR));
    axis.setAttribute('y2', String(padT + plotH));
    axis.setAttribute('stroke', '#334155');
    axis.setAttribute('stroke-width', '1');
    root.appendChild(axis);

    // Y labels
    [0, 0.5, 1].forEach((t) => {
      const y = padT + plotH - t * plotH;
      const val = Math.round(maxCost * t);
      const lbl = document.createElementNS(ns, 'text');
      lbl.setAttribute('x', String(padL - 8));
      lbl.setAttribute('y', String(y + 4));
      lbl.setAttribute('text-anchor', 'end');
      lbl.setAttribute('fill', '#64748b');
      lbl.setAttribute('font-size', '10');
      lbl.setAttribute('font-family', 'Fira Code, monospace');
      lbl.textContent = String(val);
      root.appendChild(lbl);
    });

    let running = 0;
    const avgPoints = [];

    history.forEach((op, i) => {
      running += op.cost;
      const avg = running / (i + 1);
      const x = padL + i * (barW + gap);
      const h = (op.cost / maxCost) * plotH;
      const y = padT + plotH - h;

      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', String(x));
      rect.setAttribute('y', String(y));
      rect.setAttribute('width', String(barW));
      rect.setAttribute('height', String(Math.max(h, 1)));
      rect.setAttribute('rx', '2');
      rect.setAttribute('fill', op.resized ? '#f59e0b' : '#06b6d4');
      rect.setAttribute('opacity', '0.9');
      const title = document.createElementNS(ns, 'title');
      title.textContent = `op ${i + 1}: cost ${op.cost}${op.resized ? ' (resize)' : ''} · avg ${avg.toFixed(2)}`;
      rect.appendChild(title);
      root.appendChild(rect);

      avgPoints.push({
        x: x + barW / 2,
        y: padT + plotH - (avg / maxCost) * plotH,
      });
    });

    if (avgPoints.length > 1) {
      const path = document.createElementNS(ns, 'path');
      const d = avgPoints
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#a855f7');
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('stroke-linecap', 'round');
      root.appendChild(path);
    }

    const xLabel = document.createElementNS(ns, 'text');
    xLabel.setAttribute('x', String(W / 2));
    xLabel.setAttribute('y', String(H - 8));
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('fill', '#64748b');
    xLabel.setAttribute('font-size', '11');
    xLabel.textContent = 'operation #';
    root.appendChild(xLabel);

    svg.replaceChildren(root);
  }

  function recordOp(cost, resized, detail) {
    state.history.push({ cost, resized });
    if (state.history.length > MAX_HISTORY) {
      const removed = state.history.shift();
      state.totalCost -= removed.cost;
    }
    state.totalCost += cost;
    state.lastCost = cost;
    state.lastWasResize = resized;
    if (resized) state.resizes += 1;

    log(detail, resized ? 'resize' : 'cheap');
    updateTelemetry();
    renderSlots(resized);
    renderChart();
  }

  function pushArray() {
    let cost = 1;
    let resized = false;
    let detail = '';

    if (state.size >= state.capacity) {
      const oldCap = state.capacity;
      const newCap = oldCap * 2;
      // Cost model: copy oldCap elements, then insert 1
      cost = oldCap + 1;
      state.capacity = newCap;
      resized = true;
      detail = `RESIZE ${oldCap}→${newCap}: copy ${oldCap} + insert → cost ${cost}`;
      setStatus(`Resize! Copied ${oldCap} slots into capacity ${newCap}. Cost = ${cost}.`);
    } else {
      detail = `Push → cheap write, cost 1 (size ${state.size + 1}/${state.capacity})`;
      setStatus(`Pushed in O(1). Size ${state.size + 1}/${state.capacity}.`);
    }

    state.items.push(nextValue++);
    state.size += 1;
    recordOp(cost, resized, detail);
  }

  function pushHashMap() {
    let cost = 1;
    let resized = false;
    let detail = '';
    const load = (state.size + 1) / state.capacity;

    if (load > state.loadFactor) {
      const oldCap = state.capacity;
      const newCap = oldCap * 2;
      // Rehash every existing key + insert new
      cost = state.size + 1;
      state.capacity = newCap;
      resized = true;
      detail = `REHASH @ load>${state.loadFactor}: ${oldCap}→${newCap}, cost ${cost}`;
      setStatus(`Rehash triggered. Re-inserted ${state.size} keys into ${newCap} buckets. Cost = ${cost}.`);
    } else {
      detail = `Insert → bucket write, cost 1 (load ${((state.size + 1) / state.capacity).toFixed(2)})`;
      setStatus(`Inserted in O(1). Load ${((state.size + 1) / state.capacity).toFixed(2)}.`);
    }

    state.items.push(nextValue++);
    state.size += 1;
    recordOp(cost, resized, detail);
  }

  function doPush() {
    if (state.mode === 'array') pushArray();
    else pushHashMap();
  }

  function doPop() {
    if (state.size === 0) return;
    state.items.pop();
    state.size -= 1;
    // Pop is O(1) and does not affect amortized push analysis; still log cheaply
    recordOp(1, false, `Pop → cost 1 (size ${state.size}/${state.capacity})`);
    setStatus(`Popped. Size ${state.size}/${state.capacity}.`);
  }

  function reset(preserveMode = true) {
    stopAuto();
    const mode = preserveMode ? state.mode : 'array';
    const cap = Number(els.initialCap.value) || 2;
    const lf = (Number(els.loadFactor.value) || 75) / 100;
    state = createState(cap, mode, lf);
    nextValue = 1;
    els.eventLog.replaceChildren();
    log(`Sandbox reset. Mode: ${mode === 'array' ? 'Dynamic Array' : 'Hash Map'}.`, 'sys');
    setStatus('Ready. Push elements to watch amortized cost unfold.');
    updateTelemetry();
    renderSlots();
    renderChart();
    els.amortizedCallout.hidden = true;
  }

  function setMode(mode) {
    stopAuto();
    state.mode = mode;
    els.modeArray.classList.toggle('active', mode === 'array');
    els.modeHash.classList.toggle('active', mode === 'hashmap');
    els.modeArray.setAttribute('aria-selected', String(mode === 'array'));
    els.modeHash.setAttribute('aria-selected', String(mode === 'hashmap'));
    els.loadFactorGroup.hidden = mode !== 'hashmap';
    els.pushLabel.textContent = mode === 'array' ? 'Push' : 'Insert';
    els.structureTitle.textContent = mode === 'array' ? 'Array slots' : 'Hash buckets';
    els.modeHint.textContent = HINTS[mode];
    els.theoryText.innerHTML = THEORY[mode];
    reset(true);
  }

  function startAuto() {
    if (autoTimer) {
      stopAuto();
      return;
    }
    let remaining = 10;
    els.btnPlay.innerHTML = '<i class="fas fa-stop"></i> Stop';
    els.btnPlay.setAttribute('aria-pressed', 'true');
    const delay = Number(els.playSpeed.value) || 350;

    autoTimer = setInterval(() => {
      doPush();
      remaining -= 1;
      if (remaining <= 0 || state.capacity > 512) {
        stopAuto();
        updateTelemetry();
      }
    }, delay);
  }

  // Events
  els.modeArray.addEventListener('click', () => setMode('array'));
  els.modeHash.addEventListener('click', () => setMode('hashmap'));

  els.initialCap.addEventListener('input', () => {
    els.initialCapVal.textContent = els.initialCap.value;
  });
  els.initialCap.addEventListener('change', () => reset(true));

  els.loadFactor.addEventListener('input', () => {
    const v = (Number(els.loadFactor.value) / 100).toFixed(2);
    els.loadFactorVal.textContent = v;
  });
  els.loadFactor.addEventListener('change', () => {
    state.loadFactor = Number(els.loadFactor.value) / 100;
  });

  els.playSpeed.addEventListener('input', () => {
    els.playSpeedVal.textContent = `${els.playSpeed.value}ms`;
  });

  els.btnPush.addEventListener('click', () => {
    stopAuto();
    doPush();
  });
  els.btnPop.addEventListener('click', () => {
    stopAuto();
    doPop();
  });
  els.btnPlay.addEventListener('click', startAuto);
  els.btnReset.addEventListener('click', () => reset(true));

  // Init
  els.initialCapVal.textContent = els.initialCap.value;
  els.loadFactorVal.textContent = (Number(els.loadFactor.value) / 100).toFixed(2);
  els.playSpeedVal.textContent = `${els.playSpeed.value}ms`;
  setMode('array');
})();
