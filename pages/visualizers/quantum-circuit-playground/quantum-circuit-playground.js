document.addEventListener('DOMContentLoaded', function() {
  qcInit();
});

var qcState = {
  numQubits    : 2,
  numCols      : 6,
  gates        : [],
  selectedGate : null,
  eraseMode    : false,
  pendingMulti : null,
  currentCol   : 0,
  amplitudes   : [],
  puzzleIdx    : 0,
};

function qcComplexAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
function qcComplexMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
function qcComplexScale(a, s) { return { re: a.re * s, im: a.im * s }; }
function qcMag2(a) { return a.re * a.re + a.im * a.im; }

function qcZeroState(n) {
  var dim = Math.pow(2, n);
  var state = [];
  for (var i = 0; i < dim; i++) state.push({ re: 0, im: 0 });
  state[0] = { re: 1, im: 0 };
  return state;
}

var QC_GATE_MATRICES = {
  H: [[{re:1/Math.SQRT2,im:0},{re:1/Math.SQRT2,im:0}], [{re:1/Math.SQRT2,im:0},{re:-1/Math.SQRT2,im:0}]],
  X: [[{re:0,im:0},{re:1,im:0}], [{re:1,im:0},{re:0,im:0}]],
  Y: [[{re:0,im:0},{re:0,im:-1}], [{re:0,im:1},{re:0,im:0}]],
  Z: [[{re:1,im:0},{re:0,im:0}], [{re:0,im:0},{re:-1,im:0}]],
};

function qcApplySingleGate(state, n, q, gateKey) {
  var matrix = QC_GATE_MATRICES[gateKey];
  var dim = state.length;
  var bitPos = n - 1 - q;
  var newState = state.slice();

  for (var i = 0; i < dim; i++) {
    var bit = (i >> bitPos) & 1;
    if (bit === 0) {
      var j = i | (1 << bitPos);
      var a0 = state[i]; var a1 = state[j];
      newState[i] = qcComplexAdd(qcComplexMul(matrix[0][0], a0), qcComplexMul(matrix[0][1], a1));
      newState[j] = qcComplexAdd(qcComplexMul(matrix[1][0], a0), qcComplexMul(matrix[1][1], a1));
    }
  }
  return newState;
}

function qcApplyCNOT(state, n, control, target) {
  var dim = state.length;
  var cBit = n - 1 - control;
  var tBit = n - 1 - target;
  var newState = new Array(dim);

  for (var i = 0; i < dim; i++) {
    var isControlSet = (i >> cBit) & 1;
    var partner = isControlSet ? (i ^ (1 << tBit)) : i;
    newState[i] = state[partner];
  }
  return newState;
}

function qcApplyToffoli(state, n, c1, c2, target) {
  var dim = state.length;
  var c1Bit = n - 1 - c1;
  var c2Bit = n - 1 - c2;
  var tBit  = n - 1 - target;
  var newState = new Array(dim);

  for (var i = 0; i < dim; i++) {
    var bothSet = ((i >> c1Bit) & 1) && ((i >> c2Bit) & 1);
    var partner = bothSet ? (i ^ (1 << tBit)) : i;
    newState[i] = state[partner];
  }
  return newState;
}

function qcApplyCZ(state, n, q1, q2) {
  var dim = state.length;
  var b1 = n - 1 - q1;
  var b2 = n - 1 - q2;
  var newState = state.slice();

  for (var i = 0; i < dim; i++) {
    if (((i >> b1) & 1) && ((i >> b2) & 1)) newState[i] = qcComplexScale(state[i], -1);
  }
  return newState;
}

function qcCreateEmptyGates(n, cols) {
  var g = [];
  for (var c = 0; c < cols; c++) g.push({});
  return g;
}

function qcApplyColumn(state, n, colGates) {
  var newState = state;
  Object.keys(colGates).forEach(function(key) {
    var op = colGates[key];
    if (op.type === 'single') newState = qcApplySingleGate(newState, n, op.qubit, op.gate);
    else if (op.type === 'cnot') newState = qcApplyCNOT(newState, n, op.control, op.target);
    else if (op.type === 'cz')   newState = qcApplyCZ(newState, n, op.q1, op.q2);
    else if (op.type === 'toffoli') newState = qcApplyToffoli(newState, n, op.c1, op.c2, op.target);
  });
  return newState;
}

function qcRunFullCircuit() {
  var n = qcState.numQubits;
  var state = qcZeroState(n);
  for (var c = 0; c < qcState.numCols; c++) {
    var colGates = qcColumnOps(c);
    state = qcApplyColumn(state, n, colGates);
  }
  return state;
}

function qcColumnOps(colIdx) {
  var ops = {};
  var seen = {};

  Object.keys(qcState.gates[colIdx] || {}).forEach(function(key) {
    var cell = qcState.gates[colIdx][key];
    if (cell.role === 'single') { ops[key] = { type: 'single', qubit: parseInt(key), gate: cell.gate }; }
  });

  var cnotPairs = {};
  var czPairs = {};

  Object.keys(qcState.gates[colIdx] || {}).forEach(function(key) {
    var cell = qcState.gates[colIdx][key];
    if (cell.role === 'control-cnot') { if (!cnotPairs[cell.pairId]) cnotPairs[cell.pairId] = {}; cnotPairs[cell.pairId].control = parseInt(key); }
    if (cell.role === 'target-cnot')  { if (!cnotPairs[cell.pairId]) cnotPairs[cell.pairId] = {}; cnotPairs[cell.pairId].target  = parseInt(key); }
    if (cell.role === 'control-cz')   { if (!czPairs[cell.pairId]) czPairs[cell.pairId] = {}; czPairs[cell.pairId].q1 = parseInt(key); }
    if (cell.role === 'target-cz')    { if (!czPairs[cell.pairId]) czPairs[cell.pairId] = {}; czPairs[cell.pairId].q2 = parseInt(key); }
  });

  Object.keys(cnotPairs).forEach(function(pid) {
    var p = cnotPairs[pid];
    if (p.control !== undefined && p.target !== undefined) ops['cnot-' + pid] = { type: 'cnot', control: p.control, target: p.target };
  });
  Object.keys(czPairs).forEach(function(pid) {
    var p = czPairs[pid];
    if (p.q1 !== undefined && p.q2 !== undefined) ops['cz-' + pid] = { type: 'cz', q1: p.q1, q2: p.q2 };
  });

  return ops;
}

function qcRenderCircuitGrid() {
  var grid = document.getElementById('qcCircuitGrid');
  if (!grid) return;
  grid.innerHTML = '';

  for (var q = 0; q < qcState.numQubits; q++) {
    var row = document.createElement('div');
    row.className = 'qc-qubit-row';

    var label = document.createElement('div');
    label.className = 'qc-qubit-label';
    label.textContent = '|q' + q + '⟩';
    row.appendChild(label);

    var track = document.createElement('div');
    track.className = 'qc-cell-track';

    for (var c = 0; c < qcState.numCols; c++) {
      var cell = document.createElement('div');
      cell.className = 'qc-cell';
      cell.setAttribute('data-col', c);
      cell.setAttribute('data-qubit', q);

      var placed = qcState.gates[c] && qcState.gates[c][q];
      if (placed) {
        if (placed.role === 'single') { cell.classList.add('filled-' + placed.gate); cell.textContent = placed.gate; }
        if (placed.role === 'control-cnot') cell.classList.add('control-dot');
        if (placed.role === 'target-cnot')  { cell.classList.add('target-cnot'); cell.textContent = '⊕'; }
        if (placed.role === 'control-cz')   cell.classList.add('cz-dot');
        if (placed.role === 'target-cz')    { cell.classList.add('target-cz'); cell.textContent = 'Z'; }
      }

      cell.addEventListener('click', function() {
        qcHandleCellClick(parseInt(this.getAttribute('data-col')), parseInt(this.getAttribute('data-qubit')));
      });

      cell.addEventListener('dragover', function(e) { e.preventDefault(); });
      cell.addEventListener('drop', function(e) {
        e.preventDefault();
        var gate = e.dataTransfer.getData('text/plain');
        qcPlaceSingleOrMulti(parseInt(this.getAttribute('data-col')), parseInt(this.getAttribute('data-qubit')), gate);
      });

      track.appendChild(cell);
    }

    row.appendChild(track);
    grid.appendChild(row);
  }
}

function qcPlaceSingleOrMulti(col, qubit, gate) {
  if (gate === 'ERASE') return;
  if (!qcState.gates[col]) qcState.gates[col] = {};

  if (gate === 'H' || gate === 'X' || gate === 'Y' || gate === 'Z') {
    qcState.gates[col][qubit] = { role: 'single', gate: gate };
    qcRenderCircuitGrid();
    return;
  }

  if (gate === 'CNOT' || gate === 'CZ') {
    qcState.pendingMulti = { type: gate, col: col, first: qubit };
    qcSetStatus('Now click the ' + (gate === 'CNOT' ? 'target' : 'second') + ' qubit in the same column.', 'warn');
  }
}

function qcHandleCellClick(col, qubit) {
  if (qcState.eraseMode) {
    if (qcState.gates[col] && qcState.gates[col][qubit]) {
      var removed = qcState.gates[col][qubit];
      delete qcState.gates[col][qubit];
      if (removed.pairId) {
        Object.keys(qcState.gates[col]).forEach(function(k) {
          if (qcState.gates[col][k].pairId === removed.pairId) delete qcState.gates[col][k];
        });
      }
      qcRenderCircuitGrid();
    }
    return;
  }

  if (qcState.pendingMulti) {
    var pm = qcState.pendingMulti;
    if (col !== pm.col) { qcSetStatus('Target must be in the same column as the control.', 'warn'); return; }
    if (qubit === pm.first) { qcSetStatus('Target must be a different qubit than control.', 'warn'); return; }

    var pairId = pm.type + '-' + pm.col + '-' + Date.now();
    if (!qcState.gates[col]) qcState.gates[col] = {};

    if (pm.type === 'CNOT') {
      qcState.gates[col][pm.first] = { role: 'control-cnot', pairId: pairId };
      qcState.gates[col][qubit]    = { role: 'target-cnot',  pairId: pairId };
    } else {
      qcState.gates[col][pm.first] = { role: 'control-cz', pairId: pairId };
      qcState.gates[col][qubit]    = { role: 'target-cz',  pairId: pairId };
    }

    qcState.pendingMulti = null;
    qcRenderCircuitGrid();
    qcSetStatus(pm.type + ' placed.', '');
    return;
  }

  if (qcState.selectedGate === 'CNOT' || qcState.selectedGate === 'CZ') {
    qcPlaceSingleOrMulti(col, qubit, qcState.selectedGate);
    return;
  }

  if (qcState.selectedGate) {
    qcPlaceSingleOrMulti(col, qubit, qcState.selectedGate);
  }
}

function qcSimulateUpToColumn(uptoCol) {
  var n = qcState.numQubits;
  var state = qcZeroState(n);
  for (var c = 0; c <= uptoCol; c++) {
    state = qcApplyColumn(state, n, qcColumnOps(c));
  }
  return state;
}

function qcRenderHistogram(state) {
  var canvas = document.getElementById('qcHistCanvas');
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 160;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var n = qcState.numQubits;
  var dim = state.length;
  var W = canvas.width; var H = canvas.height;
  var pad = { top: 12, right: 10, bottom: 24, left: 10 };
  var plotW = W - pad.left - pad.right;
  var plotH = H - pad.top - pad.bottom;
  var barW = plotW / dim;

  for (var i = 0; i < dim; i++) {
    var prob = qcMag2(state[i]);
    var h = prob * plotH;
    var x = pad.left + i * barW;
    var y = pad.top + plotH - h;

    ctx.fillStyle = 'rgba(168,85,247,0.6)';
    ctx.fillRect(x + 2, y, barW - 4, h);

    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.font = '8px Fira Code,monospace';
    ctx.textAlign = 'center';
    ctx.fillText('|' + i.toString(2).padStart(n, '0') + '⟩', x + barW / 2, H - 10);

    if (prob > 0.02) {
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 8px Fira Code,monospace';
      ctx.fillText((prob * 100).toFixed(0) + '%', x + barW / 2, y - 4);
    }
  }
}

function qcRenderAmplitudes(state) {
  var container = document.getElementById('qcAmpTable');
  if (!container) return;
  var n = qcState.numQubits;

  container.innerHTML = state.map(function(amp, i) {
    var ket = '|' + i.toString(2).padStart(n, '0') + '⟩';
    var reStr = amp.re.toFixed(2);
    var imStr = amp.im >= 0 ? '+' + amp.im.toFixed(2) + 'i' : amp.im.toFixed(2) + 'i';
    return '<div class="qc-amp-row"><span class="qc-amp-ket">' + ket + '</span><span class="qc-amp-val">' + reStr + imStr + '</span></div>';
  }).join('');
}

function qcCheckEntanglement(state) {
  var el = document.getElementById('qcEntangleIndicator');
  if (!el) return;

  if (qcState.numQubits !== 2) {
    el.className = 'qc-entangle-indicator';
    el.textContent = 'Entanglement check available for 2-qubit circuits';
    return;
  }

  var m00 = state[0]; var m01 = state[1]; var m10 = state[2]; var m11 = state[3];
  var det = qcComplexAdd(qcComplexMul(m00, m11), qcComplexScale(qcComplexMul(m01, m10), -1));
  var detMag = Math.sqrt(qcMag2(det));

  if (detMag > 0.02) {
    el.className = 'qc-entangle-indicator yes';
    el.textContent = '🔗 Entangled — cannot factor into independent qubits';
  } else {
    el.className = 'qc-entangle-indicator no';
    el.textContent = '✓ Separable — independent qubit states';
  }
}

function qcSetStatus(msg, cls) {
  var el = document.getElementById('qcStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = 'qc-status ' + (cls || '');
}

function qcRunCircuit() {
  var state = qcRunFullCircuit();
  qcRenderHistogram(state);
  qcRenderAmplitudes(state);
  qcCheckEntanglement(state);
  qcState.currentCol = qcState.numCols;
  qcUpdateColCtr();
  qcSetStatus('Circuit executed. Final state shown in histogram and amplitude table.', 'success');
}

function qcStepColumn() {
  if (qcState.currentCol >= qcState.numCols) { qcSetStatus('All columns already stepped through. Reset to step again.', 'warn'); return; }
  var state = qcSimulateUpToColumn(qcState.currentCol);
  qcRenderHistogram(state);
  qcRenderAmplitudes(state);
  qcCheckEntanglement(state);
  qcState.currentCol++;
  qcUpdateColCtr();
  qcSetStatus('Applied column ' + qcState.currentCol + '.', '');
}

function qcUpdateColCtr() {
  var numEl = document.getElementById('qcColNum');
  var totEl = document.getElementById('qcColTotal');
  if (numEl) numEl.textContent = qcState.currentCol;
  if (totEl) totEl.textContent = qcState.numCols;
}

function qcResetCircuit() {
  qcState.gates = qcCreateEmptyGates(qcState.numQubits, qcState.numCols);
  qcState.currentCol = 0;
  qcState.pendingMulti = null;
  qcRenderCircuitGrid();
  qcUpdateColCtr();
  var state = qcZeroState(qcState.numQubits);
  qcRenderHistogram(state);
  qcRenderAmplitudes(state);
  qcCheckEntanglement(state);
  qcSetStatus('Circuit reset to |' + '0'.repeat(qcState.numQubits) + '⟩.', '');
  var measureResult = document.getElementById('qcMeasureResult');
  if (measureResult) measureResult.textContent = '';
}

function qcLoadPreset(name) {
  qcState.numQubits = 2;
  document.querySelectorAll('.qc-qubit-btn').forEach(function(b) { b.classList.toggle('active', b.getAttribute('data-qubits') === '2'); });
  qcState.gates = qcCreateEmptyGates(2, qcState.numCols);

  if (name === 'bell') {
    qcState.gates[0][0] = { role: 'single', gate: 'H' };
    var pid = 'preset-cnot';
    qcState.gates[1][0] = { role: 'control-cnot', pairId: pid };
    qcState.gates[1][1] = { role: 'target-cnot', pairId: pid };
  } else if (name === 'uniform') {
    qcState.gates[0][0] = { role: 'single', gate: 'H' };
    qcState.gates[0][1] = { role: 'single', gate: 'H' };
  } else if (name === 'grover') {
    qcState.gates[0][0] = { role: 'single', gate: 'H' };
    qcState.gates[0][1] = { role: 'single', gate: 'H' };
    var oraclePid = 'grover-oracle';
    qcState.gates[1][0] = { role: 'control-cz', pairId: oraclePid };
    qcState.gates[1][1] = { role: 'target-cz', pairId: oraclePid };
    qcState.gates[2][0] = { role: 'single', gate: 'H' };
    qcState.gates[2][1] = { role: 'single', gate: 'H' };
    qcState.gates[3][0] = { role: 'single', gate: 'X' };
    qcState.gates[3][1] = { role: 'single', gate: 'X' };
    var diffPid = 'grover-diff';
    qcState.gates[4][0] = { role: 'control-cz', pairId: diffPid };
    qcState.gates[4][1] = { role: 'target-cz', pairId: diffPid };
    qcState.gates[5][0] = { role: 'single', gate: 'X' };
    qcState.gates[5][1] = { role: 'single', gate: 'X' };
  }

  qcState.currentCol = 0;
  qcRenderCircuitGrid();
  qcUpdateColCtr();
  qcRunCircuit();
  qcSetStatus('Preset "' + name + '" loaded and executed.', 'success');
}

function qcMeasure() {
  var state = qcRunFullCircuit();
  var probs = state.map(function(a) { return qcMag2(a); });
  var r = Math.random();
  var cumulative = 0;
  var result = 0;
  for (var i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (r <= cumulative) { result = i; break; }
  }
  var n = qcState.numQubits;
  var resultEl = document.getElementById('qcMeasureResult');
  if (resultEl) resultEl.textContent = 'Collapsed to: |' + result.toString(2).padStart(n, '0') + '⟩';
}

var QC_PUZZLES = [
  {
    desc: 'Produce the Bell state (|00⟩ + |11⟩)/√2 using exactly 2 gates: H on qubit 0, then CNOT(control=0, target=1).',
    tests: [{ initial: 0, expectedProbs: [0.5, 0, 0, 0.5] }],
  },
  {
    desc: 'Flip qubit 1 only when qubit 0 is |1⟩, using exactly 1 gate. Test cases: starting from |00⟩ should stay |00⟩; starting from |10⟩ should become |11⟩.',
    tests: [{ initial: 0, expectedProbs: [1,0,0,0] }, { initial: 2, expectedProbs: [0,0,0,1] }],
  },
  {
    desc: 'Create a uniform superposition over all 4 basis states using 1 gate per qubit (H on qubit 0 and H on qubit 1).',
    tests: [{ initial: 0, expectedProbs: [0.25,0.25,0.25,0.25] }],
  },
];

function qcRunCircuitFromInitial(initialIdx) {
  var n = qcState.numQubits;
  var state = qcZeroState(n);
  state[0] = { re: 0, im: 0 };
  state[initialIdx] = { re: 1, im: 0 };
  for (var c = 0; c < qcState.numCols; c++) state = qcApplyColumn(state, n, qcColumnOps(c));
  return state;
}

function qcCheckPuzzle() {
  var puzzle = QC_PUZZLES[qcState.puzzleIdx];
  var allPass = true;
  var details = [];

  puzzle.tests.forEach(function(test, ti) {
    var state = qcRunCircuitFromInitial(test.initial);
    var probs = state.map(function(a) { return qcMag2(a); });
    var pass = probs.every(function(p, i) { return Math.abs(p - test.expectedProbs[i]) < 0.03; });
    if (!pass) allPass = false;
    details.push('Test ' + (ti+1) + ': ' + (pass ? 'passed' : 'failed'));
  });

  var resultEl = document.getElementById('qcPuzzleResult');
  if (resultEl) {
    resultEl.classList.remove('hidden');
    resultEl.className = 'qc-puzzle-result ' + (allPass ? 'correct' : 'incorrect');
    resultEl.textContent = allPass
      ? '✅ Correct! Your circuit produces the target state.'
      : '❌ Not quite. ' + details.join(', ') + '. Adjust your circuit and try again.';
  }
}

function qcInit() {
  qcState.gates = qcCreateEmptyGates(qcState.numQubits, qcState.numCols);
  qcRenderCircuitGrid();
  qcUpdateColCtr();

  var initState = qcZeroState(qcState.numQubits);
  qcRenderHistogram(initState);
  qcRenderAmplitudes(initState);
  qcCheckEntanglement(initState);

  document.querySelectorAll('.qc-gate-tile[draggable="true"]').forEach(function(tile) {
    tile.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/plain', tile.getAttribute('data-gate'));
    });
    tile.addEventListener('click', function() {
      document.querySelectorAll('.qc-gate-tile').forEach(function(t) { t.classList.remove('selected'); });
      tile.classList.add('selected');
      qcState.selectedGate = tile.getAttribute('data-gate');
      qcState.eraseMode = false;
    });
  });

  var eraseTile = document.querySelector('.qc-gate-erase');
  if (eraseTile) {
    eraseTile.addEventListener('click', function() {
      document.querySelectorAll('.qc-gate-tile').forEach(function(t) { t.classList.remove('selected'); });
      eraseTile.classList.add('selected');
      qcState.eraseMode = true;
      qcState.selectedGate = null;
      qcState.pendingMulti = null;
      qcSetStatus('Erase mode — click any placed gate to remove it.', 'warn');
    });
  }

  document.querySelectorAll('.qc-qubit-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.qc-qubit-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      qcState.numQubits = parseInt(btn.getAttribute('data-qubits'));
      qcResetCircuit();
    });
  });

  document.querySelectorAll('.qc-preset-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { qcLoadPreset(btn.getAttribute('data-preset')); });
  });

  var runBtn   = document.getElementById('qcRunBtn');
  var stepBtn  = document.getElementById('qcStepBtn');
  var resetBtn = document.getElementById('qcResetBtn');
  if (runBtn)   runBtn.addEventListener('click', qcRunCircuit);
  if (stepBtn)  stepBtn.addEventListener('click', qcStepColumn);
  if (resetBtn) resetBtn.addEventListener('click', qcResetCircuit);

  var measureBtn = document.getElementById('qcMeasureBtn');
  if (measureBtn) measureBtn.addEventListener('click', qcMeasure);

  document.querySelectorAll('.qc-puzzle-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.qc-puzzle-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      qcState.puzzleIdx = parseInt(btn.getAttribute('data-puzzle'));
      var descEl = document.getElementById('qcPuzzleDesc');
      if (descEl) descEl.textContent = QC_PUZZLES[qcState.puzzleIdx].desc;
      var resultEl = document.getElementById('qcPuzzleResult');
      if (resultEl) resultEl.classList.add('hidden');
    });
  });

  var checkPuzzleBtn = document.getElementById('qcCheckPuzzleBtn');
  if (checkPuzzleBtn) checkPuzzleBtn.addEventListener('click', qcCheckPuzzle);

  var descEl = document.getElementById('qcPuzzleDesc');
  if (descEl) descEl.textContent = QC_PUZZLES[0].desc;

  window.addEventListener('resize', function() {
    var state = qcRunFullCircuit();
    qcRenderHistogram(state);
  });
}