document.addEventListener('DOMContentLoaded', function() {
  wsInit();
});

var WS_COLORS = ['#06b6d4','#a855f7','#22c55e','#f59e0b','#ef4444','#ec4899'];

var wsState = {
  numWorkers  : 4,
  workers     : [],
  tasks       : {},
  nextTaskId  : 0,
  tick        : 0,
  autoRunning : false,
  autoTimer   : null,
  challengeActive: false,
  challengeSteals: 0,
};

function wsCreateWorker(id) {
  return { id: id, color: WS_COLORS[id % WS_COLORS.length], deque: [], status: 'idle', stalled: false, tasksExecuted: 0, stealsGiven: 0, stealsReceived: 0 };
}

function wsCreateTask(label, depth, parentId) {
  var id = wsState.nextTaskId++;
  wsState.tasks[id] = { id: id, label: label, depth: depth, parentId: parentId, status: 'pending', children: [] };
  if (parentId !== null && wsState.tasks[parentId]) wsState.tasks[parentId].children.push(id);
  return id;
}

function wsBuildMergeSortTree(n) {
  wsState.tasks = {};
  wsState.nextTaskId = 0;

  function build(size, depth, parentId, rangeLabel) {
    var id = wsCreateTask('sort[' + rangeLabel + ']', depth, parentId);
    if (size > 2) {
      var half = Math.ceil(size / 2);
      build(half, depth + 1, id, rangeLabel + 'L');
      build(size - half, depth + 1, id, rangeLabel + 'R');
    }
    return id;
  }

  return build(n, 0, null, '0-' + (n - 1));
}

function wsResetWorkers() {
  wsState.workers = [];
  for (var i = 0; i < wsState.numWorkers; i++) wsState.workers.push(wsCreateWorker(i));
}

function wsSpawnRoot() {
  wsResetWorkers();
  var rootId = wsBuildMergeSortTree(16);
  wsState.workers[0].deque.push(rootId);
  wsState.tasks[rootId].status = 'queued';
  wsState.tick = 0;

  var log = document.getElementById('wsLog');
  if (log) log.innerHTML = '<div class="ws-empty">No activity yet.</div>';

  wsAddLog('Root task spawned into Worker 0\'s deque. Others start idle.', '');
  wsRerenderAll();
  wsSetStatus('Task tree built (merge sort, 16 elements). Click Step or Auto-Run to begin scheduling.', '');
}

function wsPickTaskToExecute(worker) {
  if (worker.deque.length === 0) return null;
  var taskId = worker.deque.shift();
  return taskId;
}

function wsFindVictim(thiefId) {
  var candidates = wsState.workers.filter(function(w) { return w.id !== thiefId && !w.stalled && w.deque.length > 0; });
  if (candidates.length === 0) return null;
  candidates.sort(function(a, b) { return b.deque.length - a.deque.length; });
  return candidates[0];
}

function wsSchedulerStep() {
  wsState.tick++;
  var anyActivity = false;

  wsState.workers.forEach(function(worker) {
    if (worker.stalled) { worker.status = 'stalled'; return; }

    if (worker.deque.length > 0) {
      var taskId = wsPickTaskToExecute(worker);
      var task = wsState.tasks[taskId];
      anyActivity = true;

      if (task.children.length > 0) {
        task.status = 'split';
        task.children.forEach(function(childId) {
          wsState.tasks[childId].status = 'queued';
          worker.deque.unshift(childId);
        });
        wsAddLog('W' + worker.id + ' popped ' + task.label + ' (own front, LIFO) — split into ' + task.children.length + ' subtasks, pushed to own front', '');
      } else {
        task.status = 'done';
        worker.tasksExecuted++;
        wsAddLog('W' + worker.id + ' executed leaf task ' + task.label + ' (own front, LIFO)', 'done');
      }
      worker.status = 'busy';
    } else {
      var victim = wsFindVictim(worker.id);
      if (victim) {
        var stolenId = victim.deque.pop();
        worker.deque.push(stolenId);
        victim.stealsGiven++;
        worker.stealsReceived++;
        worker.status = 'stealing';
        anyActivity = true;
        wsAddLog('W' + worker.id + ' STOLE ' + wsState.tasks[stolenId].label + ' from W' + victim.id + '\'s BACK (FIFO)', 'steal');
      } else {
        worker.status = 'idle';
      }
    }
  });

  wsRerenderAll();

  if (!anyActivity) {
    wsState.autoRunning = false;
    if (wsState.autoTimer) { clearTimeout(wsState.autoTimer); wsState.autoTimer = null; }
    var autoBtn = document.getElementById('wsAutoBtn');
    if (autoBtn) autoBtn.innerHTML = '<i class="fas fa-play"></i> Auto-Run';
    wsSetStatus('All tasks complete after ' + wsState.tick + ' ticks.', 'done');
    return false;
  }

  wsSetStatus('Tick ' + wsState.tick + ' processed.', '');
  return true;
}

function wsAutoRun() {
  if (wsState.autoRunning) {
    wsState.autoRunning = false;
    if (wsState.autoTimer) { clearTimeout(wsState.autoTimer); wsState.autoTimer = null; }
    var autoBtn = document.getElementById('wsAutoBtn');
    if (autoBtn) autoBtn.innerHTML = '<i class="fas fa-play"></i> Auto-Run';
    return;
  }

  wsState.autoRunning = true;
  var autoBtn = document.getElementById('wsAutoBtn');
  if (autoBtn) autoBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';

  function loop() {
    if (!wsState.autoRunning) return;
    var cont = wsSchedulerStep();
    if (cont) wsState.autoTimer = setTimeout(loop, 500);
    else wsState.autoRunning = false;
  }
  loop();
}

function wsStallRandomWorker() {
  var active = wsState.workers.filter(function(w) { return !w.stalled; });
  if (active.length <= 1) { wsSetStatus('Cannot stall — need at least one active worker.', ''); return; }
  var target = active[Math.floor(Math.random() * active.length)];
  target.stalled = true;
  target.status = 'stalled';
  wsAddLog('W' + target.id + ' STALLED (blocked) — others must steal to keep progressing', 'steal');
  wsRerenderAll();
  wsSetStatus('Worker ' + target.id + ' stalled. Step or Auto-Run to see others steal around it.', 'steal');
}

function wsAddLog(msg, cls) {
  var log = document.getElementById('wsLog');
  if (!log) return;
  var empty = log.querySelector('.ws-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'ws-log-entry ' + (cls || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 60) log.removeChild(log.lastChild);
}

function wsSetStatus(msg, cls) {
  var el = document.getElementById('wsStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'ws-status ' + (cls || '');
}

function wsRenderWorkers() {
  var col = document.getElementById('wsWorkersCol');
  if (!col) return;
  col.innerHTML = '';

  wsState.workers.forEach(function(worker) {
    var panel = document.createElement('div');
    panel.className = 'ws-worker-panel';
    panel.style.setProperty('--wc', worker.color);

    var badgeCls = worker.stalled ? 'stalled' : worker.status === 'busy' ? 'busy' : worker.status === 'stealing' ? 'stealing' : 'idle';
    var badgeLabel = worker.stalled ? 'STALLED' : worker.status === 'busy' ? 'BUSY' : worker.status === 'stealing' ? 'STOLE' : 'IDLE';

    var dequeItems = worker.deque.map(function(taskId, idx) {
      var task = wsState.tasks[taskId];
      var cls = idx === 0 ? 'own-front' : '';
      return '<div class="ws-deque-item ' + cls + '">' + task.label + '</div>';
    }).join('');

    panel.innerHTML =
      '<div class="ws-worker-header">' +
        '<span class="ws-worker-name">W' + worker.id + '</span>' +
        '<span class="ws-worker-badge ' + badgeCls + '">' + badgeLabel + '</span>' +
      '</div>' +
      '<div class="ws-deque-track">' +
        '<span class="ws-deque-end-label">front→</span>' +
        (dequeItems || '<span style="font-size:0.68rem;color:rgba(148,163,184,0.3);font-style:italic">empty</span>') +
        '<span class="ws-deque-end-label">←back</span>' +
      '</div>' +
      '<div class="ws-worker-stats">' +
        '<span>Executed: ' + worker.tasksExecuted + '</span>' +
        '<span>Steals given: ' + worker.stealsGiven + '</span>' +
        '<span>Steals received: ' + worker.stealsReceived + '</span>' +
      '</div>';

    if (wsState.challengeActive) {
      panel.style.cursor = 'pointer';
      panel.addEventListener('click', function() {
        if (worker.deque.length === 0 && !worker.stalled) {
          var victim = wsFindVictim(worker.id);
          if (victim) {
            var stolenId = victim.deque.pop();
            worker.deque.push(stolenId);
            victim.stealsGiven++;
            worker.stealsReceived++;
            wsState.challengeSteals++;
            var stealsEl = document.getElementById('wsChallengeSteals');
            if (stealsEl) stealsEl.textContent = wsState.challengeSteals;
            wsAddLog('Manual steal: W' + worker.id + ' took ' + wsState.tasks[stolenId].label + ' from W' + victim.id, 'steal');
            wsRerenderAll();
          }
        }
      });
    }

    col.appendChild(panel);
  });

  var maxDepth = Math.max.apply(null, wsState.workers.map(function(w) { return w.deque.length; }).concat([0]));
  if (wsState.challengeActive) {
    var maxDepthEl = document.getElementById('wsChallengeMaxDepth');
    if (maxDepthEl) maxDepthEl.textContent = maxDepth;
  }
}

function wsRenderTree() {
  var svg = document.getElementById('wsTreeSvg');
  if (!svg) return;
  var ids = Object.keys(wsState.tasks).map(Number);
  if (ids.length === 0) { svg.innerHTML = ''; return; }

  var byDepth = {};
  ids.forEach(function(id) {
    var d = wsState.tasks[id].depth;
    if (!byDepth[d]) byDepth[d] = [];
    byDepth[d].push(id);
  });

  var maxDepth = Math.max.apply(null, Object.keys(byDepth).map(Number));
  var W = 280; var rowH = 42;
  var H = (maxDepth + 1) * rowH + 20;
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  svg.innerHTML = '';

  var pos = {};
  Object.keys(byDepth).forEach(function(depth) {
    var arr = byDepth[depth];
    arr.forEach(function(id, idx) {
      pos[id] = { x: W * (idx + 0.5) / arr.length, y: 20 + depth * rowH };
    });
  });

  var ns = 'http://www.w3.org/2000/svg';
  ids.forEach(function(id) {
    var task = wsState.tasks[id];
    task.children.forEach(function(childId) {
      if (!pos[id] || !pos[childId]) return;
      var line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', pos[id].x); line.setAttribute('y1', pos[id].y);
      line.setAttribute('x2', pos[childId].x); line.setAttribute('y2', pos[childId].y);
      line.setAttribute('stroke', 'rgba(148,163,184,0.25)'); line.setAttribute('stroke-width', '1.2');
      svg.appendChild(line);
    });
  });

  ids.forEach(function(id) {
    var task = wsState.tasks[id];
    if (!pos[id]) return;
    var color = task.status === 'done' ? '#22c55e' : task.status === 'split' ? 'rgba(148,163,184,0.4)' : task.status === 'queued' ? '#06b6d4' : 'rgba(148,163,184,0.3)';

    var circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', pos[id].x); circle.setAttribute('cy', pos[id].y); circle.setAttribute('r', '9');
    circle.setAttribute('fill', color + '33'); circle.setAttribute('stroke', color); circle.setAttribute('stroke-width', '1.5');
    svg.appendChild(circle);
  });
}

function wsRerenderAll() {
  wsRenderWorkers();
  wsRenderTree();
  var tickEl = document.getElementById('wsTickNum');
  if (tickEl) tickEl.textContent = wsState.tick;
}

function wsSimulateSharedQueue(tasks) {
  var contentionEvents = 0;
  var ticks = 0;
  var queue = Object.keys(tasks).filter(function(id) { return tasks[id].children.length === 0; }).length;
  var remaining = queue;
  var throughput = [];

  while (remaining > 0 && ticks < 200) {
    ticks++;
    var completedThisTick = 0;
    for (var w = 0; w < wsState.numWorkers; w++) {
      if (remaining <= 0) break;
      contentionEvents += Math.max(0, wsState.numWorkers - 1);
      remaining--;
      completedThisTick++;
    }
    throughput.push(completedThisTick);
  }

  return { contentionEvents: contentionEvents, ticks: ticks, throughput: throughput };
}

function wsSimulateWorkStealing(tasks) {
  var leaves = Object.keys(tasks).filter(function(id) { return tasks[id].children.length === 0; }).length;
  var remaining = leaves;
  var ticks = 0;
  var contentionEvents = 0;
  var throughput = [];
  var perWorkerLoad = [];
  for (var i = 0; i < wsState.numWorkers; i++) perWorkerLoad.push(i === 0 ? leaves : 0);

  while (remaining > 0 && ticks < 200) {
    ticks++;
    var completedThisTick = 0;
    for (var w = 0; w < wsState.numWorkers; w++) {
      if (perWorkerLoad[w] > 0) {
        perWorkerLoad[w]--;
        remaining--;
        completedThisTick++;
      } else {
        var maxIdx = -1; var maxVal = 0;
        for (var j = 0; j < perWorkerLoad.length; j++) {
          if (j !== w && perWorkerLoad[j] > maxVal) { maxVal = perWorkerLoad[j]; maxIdx = j; }
        }
        if (maxIdx !== -1) { perWorkerLoad[maxIdx]--; perWorkerLoad[w]++; contentionEvents += 0.1; }
      }
    }
    throughput.push(completedThisTick);
  }

  return { contentionEvents: Math.round(contentionEvents), ticks: ticks, throughput: throughput };
}

function wsRunComparison() {
  var sharedResult = wsSimulateSharedQueue(wsState.tasks);
  var wsResult = wsSimulateWorkStealing(wsState.tasks);

  var maxContention = Math.max(sharedResult.contentionEvents, wsResult.contentionEvents, 1);

  var sharedFill = document.getElementById('wsContentionShared');
  var wsFill = document.getElementById('wsContentionWs');
  if (sharedFill) sharedFill.style.width = Math.round((sharedResult.contentionEvents / maxContention) * 100) + '%';
  if (wsFill) wsFill.style.width = Math.round((wsResult.contentionEvents / maxContention) * 100) + '%';

  var sc = document.getElementById('wsSharedContention');
  var wc = document.getElementById('wsWsContention');
  var st = document.getElementById('wsSharedTicks');
  var wt = document.getElementById('wsWsTicks');
  if (sc) sc.textContent = sharedResult.contentionEvents;
  if (wc) wc.textContent = wsResult.contentionEvents;
  if (st) st.textContent = sharedResult.ticks;
  if (wt) wt.textContent = wsResult.ticks;

  wsDrawThroughputChart(sharedResult.throughput, wsResult.throughput);
  wsAddLog('Comparison run: Shared Queue had ' + sharedResult.contentionEvents + ' contention events vs Work-Stealing\'s ' + wsResult.contentionEvents + '.', '');
}

function wsDrawThroughputChart(sharedData, wsData) {
  var canvas = document.getElementById('wsThroughputCanvas');
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 150;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var maxLen = Math.max(sharedData.length, wsData.length, 1);
  var maxVal = Math.max.apply(null, sharedData.concat(wsData).concat([1]));

  var W = canvas.width; var H = canvas.height;
  var pad = { top: 10, right: 10, bottom: 20, left: 30 };
  var plotW = W - pad.left - pad.right;
  var plotH = H - pad.top - pad.bottom;

  function xPos(i) { return pad.left + (i / (maxLen - 1 || 1)) * plotW; }
  function yPos(v) { return pad.top + (1 - v / maxVal) * plotH; }

  function drawCurve(data, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach(function(v, i) {
      var x = xPos(i); var y = yPos(v);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  drawCurve(sharedData, '#ef4444');
  drawCurve(wsData, '#22c55e');

  ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.font = '8px Fira Code,monospace'; ctx.textAlign = 'center';
  ctx.fillText('tick', pad.left + plotW / 2, H - 5);
}

function wsStartChallenge() {
  wsResetWorkers();
  var rootId = wsBuildMergeSortTree(16);

  function flatten(id, acc) {
    var task = wsState.tasks[id];
    if (task.children.length === 0) acc.push(id);
    else task.children.forEach(function(c) { flatten(c, acc); });
    return acc;
  }
  var leaves = flatten(rootId, []);
  wsState.workers[0].deque = leaves.slice();
  leaves.forEach(function(id) { wsState.tasks[id].status = 'queued'; });

  wsState.challengeActive = true;
  wsState.challengeSteals = 0;

  var statsEl = document.getElementById('wsChallengeStats');
  if (statsEl) statsEl.classList.remove('hidden');
  var stealsEl = document.getElementById('wsChallengeSteals');
  if (stealsEl) stealsEl.textContent = '0';

  wsRerenderAll();
  wsSetStatus('Challenge started! Worker 0 has all the work. Click idle workers to trigger manual steals and balance the load.', 'steal');
}

function wsInit() {
  wsSpawnRoot();

  document.querySelectorAll('.ws-worker-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.ws-worker-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      wsState.numWorkers = parseInt(btn.getAttribute('data-workers'));
      wsSpawnRoot();
    });
  });

  var spawnBtn = document.getElementById('wsSpawnRootBtn');
  var resetBtn = document.getElementById('wsResetBtn');
  var stepBtn  = document.getElementById('wsStepBtn');
  var autoBtn  = document.getElementById('wsAutoBtn');
  var stallBtn = document.getElementById('wsStallBtn');

  if (spawnBtn) spawnBtn.addEventListener('click', wsSpawnRoot);
  if (resetBtn) resetBtn.addEventListener('click', function() { wsState.challengeActive = false; var s = document.getElementById('wsChallengeStats'); if (s) s.classList.add('hidden'); wsSpawnRoot(); });
  if (stepBtn)  stepBtn.addEventListener('click', wsSchedulerStep);
  if (autoBtn)  autoBtn.addEventListener('click', wsAutoRun);
  if (stallBtn) stallBtn.addEventListener('click', wsStallRandomWorker);

  var runCompareBtn = document.getElementById('wsRunCompareBtn');
  if (runCompareBtn) runCompareBtn.addEventListener('click', wsRunComparison);

  var challengeStartBtn = document.getElementById('wsChallengeStartBtn');
  if (challengeStartBtn) challengeStartBtn.addEventListener('click', wsStartChallenge);

  window.addEventListener('resize', function() { wsRenderTree(); });
}