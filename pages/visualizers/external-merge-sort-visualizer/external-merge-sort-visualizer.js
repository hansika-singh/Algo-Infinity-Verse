document.addEventListener('DOMContentLoaded', function() {
  exInit();
});

var exState = {
  input: [],
  budget: 4,
  runs: [],
  reads: 0,
  writes: 0,
  passCount: 0,
  initialRunCount: 0,
  stepQueue: [],
  stepIdx: 0,
};

function exGenerateInput() {
  var arr = [];
  for (var i = 0; i < 24; i++) arr.push(1 + Math.floor(Math.random() * 99));
  return arr;
}

function exRenderInput(highlightIdx) {
  var container = document.getElementById('exInputRow');
  if (!container) return;
  container.innerHTML = exState.input.map(function(v, i) {
    return '<div class="ex-block' + (highlightIdx !== undefined && highlightIdx.indexOf(i) !== -1 ? ' read' : '') + '">' + v + '</div>';
  }).join('');
}

function exGenerateRuns() {
  var runs = [];
  var budget = exState.budget;
  var readIndices = [];

  for (var i = 0; i < exState.input.length; i += budget) {
    var chunk = exState.input.slice(i, i + budget);
    for (var j = i; j < Math.min(i + budget, exState.input.length); j++) readIndices.push(j);

    exState.reads += chunk.length;
    var sorted = chunk.slice().sort(function(a, b) { return a - b; });
    exState.writes += sorted.length;

    runs.push({ id: runs.length, elements: sorted, gen: 0 });
  }

  exState.runs = runs;
  exState.initialRunCount = runs.length;
  exRenderInput(readIndices);
  return runs;
}

function exRenderRuns(mergingIds) {
  var container = document.getElementById('exRunsContainer');
  if (!container) return;
  if (exState.runs.length === 0) { container.innerHTML = '<div class="ex-empty">No runs generated yet.</div>'; return; }

  container.innerHTML = exState.runs.map(function(run) {
    var isMerged = run.gen > 0;
    var isActive = mergingIds && mergingIds.indexOf(run.id) !== -1;
    return '<div class="ex-run-block' + (isMerged ? ' merged-block' : '') + '">' +
      '<div class="ex-run-header' + (isMerged ? ' merged' : '') + '">' +
        (isMerged ? 'Merged run (gen ' + run.gen + ')' : 'Run #' + run.id) +
        ' — ' + run.elements.length + ' elements' + (isActive ? ' ⟵ merging' : '') +
      '</div>' +
      '<div class="ex-run-elements">' +
        run.elements.map(function(v) { return '<div class="ex-run-el">' + v + '</div>'; }).join('') +
      '</div>' +
    '</div>';
  }).join('');
}

function exAddLog(msg, cls) {
  var log = document.getElementById('exLog');
  if (!log) return;
  var empty = log.querySelector('.ex-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'ex-log-entry ' + (cls || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 60) log.removeChild(log.lastChild);
}

function exSetStatus(msg, cls) {
  var el = document.getElementById('exStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'ex-status ' + (cls || '');
}

function exUpdateStats() {
  var readEl = document.getElementById('exReadCount');
  var writeEl = document.getElementById('exWriteCount');
  var totalEl = document.getElementById('exTotalIO');
  var passEl = document.getElementById('exPassCount');
  var runEl = document.getElementById('exRunCount');

  if (readEl) readEl.textContent = exState.reads;
  if (writeEl) writeEl.textContent = exState.writes;
  if (totalEl) totalEl.textContent = exState.reads + exState.writes;
  if (passEl) passEl.textContent = exState.passCount;
  if (runEl) runEl.textContent = exState.initialRunCount;
}

function exKWayMerge(runGroup, gen) {
  var budget = exState.budget;
  var buffers = runGroup.map(function(run) { return { queue: run.elements.slice(), current: null }; });

  buffers.forEach(function(buf) {
    if (buf.queue.length > 0) { buf.current = buf.queue.shift(); exState.reads++; }
  });

  var output = [];
  var maxIter = runGroup.reduce(function(a, r) { return a + r.elements.length; }, 0) + 5;

  while (maxIter-- > 0) {
    var minIdx = -1; var minVal = Infinity;
    buffers.forEach(function(buf, i) {
      if (buf.current !== null && buf.current < minVal) { minVal = buf.current; minIdx = i; }
    });

    if (minIdx === -1) break;

    output.push(minVal);
    exState.writes++;

    var buf = buffers[minIdx];
    if (buf.queue.length > 0) { buf.current = buf.queue.shift(); exState.reads++; }
    else buf.current = null;
  }

  return { id: exState.runs.length + gen * 1000 + Math.floor(Math.random() * 100), elements: output, gen: gen };
}

function exRunFullSort() {
  exResetCounters();
  exGenerateRuns();
  exRenderRuns(null);
  exUpdateStats();
  exAddLog(exState.initialRunCount + ' initial sorted run(s) generated from ' + exState.input.length + ' elements (budget = ' + exState.budget + ').', '');

  var gen = 1;

  function mergeLoop() {
    if (exState.runs.length <= 1) {
      exRenderRuns(null);
      exUpdateStats();
      exAddLog('Sort complete. Final sorted output has ' + (exState.runs[0] ? exState.runs[0].elements.length : 0) + ' elements.', 'done');
      exRenderFinalOutput();
      exSetStatus('External merge sort complete in ' + exState.passCount + ' merge pass(es). Total I/O: ' + (exState.reads + exState.writes) + ' operations.', 'good');
      return;
    }

    var mergeGroupSize = Math.max(2, exState.budget - 1);
    var newRuns = [];
    var i = 0;

    while (i < exState.runs.length) {
      var group = exState.runs.slice(i, i + mergeGroupSize);
      if (group.length === 1) { newRuns.push(group[0]); i += mergeGroupSize; continue; }
      var merged = exKWayMerge(group, gen);
      newRuns.push(merged);
      i += mergeGroupSize;
    }

    exState.passCount++;
    exAddLog('Merge pass ' + exState.passCount + ': merged ' + exState.runs.length + ' run(s) into ' + newRuns.length + ' run(s) using up to ' + mergeGroupSize + '-way merge.', 'merge');
    exState.runs = newRuns;
    gen++;

    exRenderRuns(null);
    exUpdateStats();
    setTimeout(mergeLoop, 500);
  }

  setTimeout(mergeLoop, 400);
}

function exRenderFinalOutput() {
  var outputRow = document.getElementById('exOutputRow');
  if (!outputRow || !exState.runs[0]) return;
  outputRow.innerHTML = exState.runs[0].elements.map(function(v) {
    return '<div class="ex-output-el">' + v + '</div>';
  }).join('');
}

function exResetCounters() {
  exState.reads = 0;
  exState.writes = 0;
  exState.passCount = 0;
  exState.initialRunCount = 0;
  exState.runs = [];

  var log = document.getElementById('exLog');
  if (log) log.innerHTML = '<div class="ex-empty">No activity yet.</div>';

  var outputRow = document.getElementById('exOutputRow');
  if (outputRow) outputRow.innerHTML = '';

  var bufferRow = document.getElementById('exBufferRow');
  if (bufferRow) bufferRow.innerHTML = '';

  exRenderRuns(null);
  exUpdateStats();
}

function exStepHandler() {
  if (exState.stepQueue.length === 0) {
    exState.stepQueue = exBuildStepQueue();
    exState.stepIdx = 0;
  }

  if (exState.stepIdx >= exState.stepQueue.length) {
    exSetStatus('All steps complete. Click Reset to step through again.', 'good');
    return;
  }

  var step = exState.stepQueue[exState.stepIdx];
  step();
  exState.stepIdx++;

  if (exState.stepIdx >= exState.stepQueue.length) {
    exSetStatus('Step-through complete. Sort finished.', 'good');
  }
}

function exBuildStepQueue() {
  exResetCounters();
  var queue = [];

  queue.push(function() {
    exGenerateRuns();
    exRenderRuns(null);
    exUpdateStats();
    exAddLog(exState.initialRunCount + ' initial sorted run(s) generated (budget = ' + exState.budget + ').', '');
    exSetStatus('Phase 1 complete: generated ' + exState.initialRunCount + ' sorted runs.', '');
  });

  var gen = 1;
  var maxPasses = 6;

  for (var p = 0; p < maxPasses; p++) {
    (function(passGen) {
      queue.push(function() {
        if (exState.runs.length <= 1) {
          exRenderFinalOutput();
          exSetStatus('Sort already complete.', 'good');
          return;
        }
        var mergeGroupSize = Math.max(2, exState.budget - 1);
        var newRuns = [];
        var i = 0;
        while (i < exState.runs.length) {
          var group = exState.runs.slice(i, i + mergeGroupSize);
          if (group.length === 1) { newRuns.push(group[0]); i += mergeGroupSize; continue; }
          var merged = exKWayMerge(group, passGen);
          newRuns.push(merged);
          i += mergeGroupSize;
        }
        exState.passCount++;
        exAddLog('Merge pass ' + exState.passCount + ': ' + exState.runs.length + ' → ' + newRuns.length + ' run(s).', 'merge');
        exState.runs = newRuns;
        exRenderRuns(null);
        exUpdateStats();

        if (exState.runs.length === 1) {
          exRenderFinalOutput();
          exAddLog('Sort complete. Final output has ' + exState.runs[0].elements.length + ' elements.', 'done');
          exSetStatus('Sort complete after ' + exState.passCount + ' merge pass(es).', 'good');
        } else {
          exSetStatus('Merge pass ' + exState.passCount + ' complete. ' + exState.runs.length + ' run(s) remain.', 'merge');
        }
      });
    })(gen);
    gen++;
  }

  return queue;
}

function exReset() {
  exState.input = exGenerateInput();
  exState.stepQueue = [];
  exState.stepIdx = 0;
  exResetCounters();
  exRenderInput();
  exSetStatus('Reset. Choose a memory budget, then run the sort or step through it phase by phase.', '');
}

function exInit() {
  exState.input = exGenerateInput();
  exRenderInput();
  exUpdateStats();

  var budgetSlider = document.getElementById('exBudgetSlider');
  if (budgetSlider) {
    budgetSlider.addEventListener('input', function() {
      exState.budget = parseInt(budgetSlider.value);
      var lbl = document.getElementById('exBudgetVal');
      if (lbl) lbl.textContent = exState.budget + ' elements';
      exState.stepQueue = [];
      exState.stepIdx = 0;
      exResetCounters();
    });
  }

  var randomizeBtn = document.getElementById('exRandomizeBtn');
  var runBtn = document.getElementById('exRunBtn');
  var stepBtn = document.getElementById('exStepBtn');
  var resetBtn = document.getElementById('exResetBtn');

  if (randomizeBtn) randomizeBtn.addEventListener('click', exReset);
  if (runBtn) runBtn.addEventListener('click', exRunFullSort);
  if (stepBtn) stepBtn.addEventListener('click', exStepHandler);
  if (resetBtn) resetBtn.addEventListener('click', exReset);
}