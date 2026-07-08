document.addEventListener('DOMContentLoaded', function() {
  lfInit();
});

/* ─── Thread colors ─── */
let LF_THREAD_COLORS = ['#22c55e','#06b6d4','#a855f7','#f59e0b'];
let LF_THREAD_COLOR_RGB = ['34,197,94','6,182,212','168,85,247','245,158,11'];

/* ─── State ─── */
let lfState = {
  struct      : 'stack',
  numThreads  : 3,
  initialized : false,
  hazardOn    : false,

  nodes       : [],     // [{id, value, next (id|null), freed}]
  head        : null,   // for stack: top; for queue: head node id
  tail        : null,   // for queue only
  nextNodeId  : 1,

  // Thread states
  threads     : [],     
  // Metrics
  casAttempts : 0,
  casFailures : 0,

  limbo       : [],     // [{id, value, freedBy}]

  // ABA demo
  abaStep     : -1,
};

/* ─── Node helpers ─── */
function lfNewNode(value) {
  let id = lfState.nextNodeId++;
  let node = { id: id, value: value, next: null, freed: false };
  lfState.nodes.push(node);
  return id;
}

function lfGetNode(id) { return lfState.nodes.find(function(n){ return n.id === id; }); }

/* ─── Initialize ─── */
function lfInitialize() {
  let n = parseInt(document.getElementById('lfThreadCount').value) || 3;
  lfState.numThreads   = n;
  lfState.nodes        = [];
  lfState.head         = null;
  lfState.tail         = null;
  lfState.nextNodeId   = 1;
  lfState.casAttempts  = 0;
  lfState.casFailures  = 0;
  lfState.limbo        = [];
  lfState.initialized  = true;
  lfState.abaStep      = -1;

  // Pre-populate with 3 values for demo
  let preValues = [30, 20, 10];
  if (lfState.struct === 'stack') {
    preValues.forEach(function(v) {
      let id = lfNewNode(v);
      let node = lfGetNode(id);
      node.next = lfState.head;
      lfState.head = id;
    });
  } else {
    // Queue: head is a sentinel node
    let sentinelId = lfNewNode(null);
    lfState.head = sentinelId;
    lfState.tail = sentinelId;
    preValues.forEach(function(v) {
      let newId = lfNewNode(v);
      lfGetNode(lfState.tail).next = newId;
      lfState.tail = newId;
    });
  }

  // Build threads
  lfState.threads = [];
  for (let i = 0; i < n; i++) {
    lfState.threads.push({
      id          : i,
      color       : LF_THREAD_COLORS[i],
      colorRgb    : LF_THREAD_COLOR_RGB[i],
      pendingOps  : [],
      readHead    : null,   // last head value this thread read
      casAttempts : 0,
      casFailures : 0,
      hazardPtr   : null,
      status      : 'idle', // idle | reading | retrying | done
    });
  }

  lfBuildThreadPanels();
  lfRenderDs();
  lfUpdateHazardTable();
  lfUpdateMetrics();
  lfSetStatus('Initialized ' + (lfState.struct === 'stack' ? 'Treiber Stack' : 'Michael-Scott Queue') + ' with 3 pre-loaded values. Add operations to threads and click Step to execute one at a time.');
}

/* ─── Build thread panels ─── */
function lfBuildThreadPanels() {
  let col = document.getElementById('lfThreadsCol');
  if (!col) return;
  col.innerHTML = '';

  lfState.threads.forEach(function(thread) {
    let panel = document.createElement('div');
    panel.className = 'lf-thread-panel';
    panel.style.setProperty('--tc', thread.color);
    panel.style.setProperty('--tc-rgb', thread.colorRgb);
    panel.setAttribute('id', 'lfThread' + thread.id);

    let opOptions = lfState.struct === 'stack'
      ? '<option value="push">push</option><option value="pop">pop</option>'
      : '<option value="enqueue">enqueue</option><option value="dequeue">dequeue</option>';

    panel.innerHTML =
      '<div class="lf-thread-header">' +
        '<span class="lf-thread-name">T' + (thread.id+1) + '</span>' +
        '<span class="lf-thread-status-dot idle" id="lfDot' + thread.id + '"></span>' +
      '</div>' +
      '<div class="lf-thread-op-row">' +
        '<select class="lf-thread-op-select" id="lfOpSel' + thread.id + '">' + opOptions + '</select>' +
        '<input type="number" class="lf-thread-val-input" id="lfOpVal' + thread.id + '" value="' + ((thread.id+1)*10) + '" min="1" max="99" />' +
        '<button class="lf-thread-queue-btn" id="lfQueueBtn' + thread.id + '">+ Queue</button>' +
      '</div>' +
      '<div class="lf-thread-pending" id="lfPending' + thread.id + '"></div>' +
      '<button class="lf-step-btn" id="lfStepBtn' + thread.id + '"><i class="fas fa-step-forward"></i> Step T' + (thread.id+1) + '</button>' +
      '<div class="lf-thread-stats">' +
        '<span>CAS✅ <span id="lfTOk' + thread.id + '">0</span></span>' +
        '<span>CAS❌ <span id="lfTFail' + thread.id + '">0</span></span>' +
      '</div>';

    col.appendChild(panel);

    // Wire queue button
    (function(tid) {
      let qBtn = document.getElementById('lfQueueBtn' + tid);
      if (qBtn) qBtn.addEventListener('click', function() { lfQueueOp(tid); });
      let stepBtn = document.getElementById('lfStepBtn' + tid);
      if (stepBtn) stepBtn.addEventListener('click', function() { lfStepThread(tid); });
    })(thread.id);
  });
}

/* ─── Queue an operation for a thread ─── */
function lfQueueOp(tid) {
  let thread = lfState.threads[tid];
  if (!thread) return;
  let opSel = document.getElementById('lfOpSel' + tid);
  let valIn = document.getElementById('lfOpVal' + tid);
  let op    = opSel ? opSel.value : 'push';
  let val   = parseInt(valIn ? valIn.value : 0);
  if (isNaN(val) || val < 1) val = tid * 10 + 10;

  thread.pendingOps.push({ op: op, value: val });
  lfRenderPendingOps(tid);
}

function lfRenderPendingOps(tid) {
  let thread = lfState.threads[tid];
  let el = document.getElementById('lfPending' + tid);
  if (!el) return;
  if (thread.pendingOps.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = thread.pendingOps.map(function(op) {
    let label = op.op + (op.op === 'push' || op.op === 'enqueue' ? '(' + op.value + ')' : '()');
    return '<span class="lf-pending-op">' + label + '</span>';
  }).join('');
}

/* ─── Step one thread ─── */
function lfStepThread(tid) {
  let thread = lfState.threads[tid];
  if (!thread || thread.pendingOps.length === 0) {
    lfSetStatus('T' + (tid+1) + ' has no pending operations. Add some using the + Queue button.', '');
    return;
  }

  let pending = thread.pendingOps[0];

  if (lfState.struct === 'stack') {
    if (pending.op === 'push') lfStackPush(tid, pending.value);
    else lfStackPop(tid);
  } else {
    if (pending.op === 'enqueue') lfQueueEnqueue(tid, pending.value);
    else lfQueueDequeue(tid);
  }

  // Remove completed op
  thread.pendingOps.shift();
  lfRenderPendingOps(tid);
  lfRenderDs();
  lfUpdateHazardTable();
  lfUpdateLimbo();
  lfUpdateMetrics();
}

/* ─── Treiber Stack: push ─── */
function lfStackPush(tid, value) {
  let thread = lfState.threads[tid];

  // Phase 1: Read head
  let observedHead = lfState.head;
  thread.readHead = observedHead;
  thread.status = 'reading';
  lfAddCasLog('read', 'T' + (tid+1) + ' reads head → ' + (observedHead !== null ? 'node#' + observedHead + '(val=' + lfGetNode(observedHead).value + ')' : 'null'));

  // Phase 2: Create new node
  let newId = lfNewNode(value);
  lfGetNode(newId).next = observedHead;

  // Phase 3: CAS(head, observedHead, newId)
  lfState.casAttempts++; thread.casAttempts++;

  if (lfState.head === observedHead) {
    // CAS SUCCESS
    lfState.head = newId;
    thread.status = 'done';
    lfAddCasLog('ok', 'T' + (tid+1) + ' CAS ✅ push(' + value + ') — head: ' + (observedHead !== null ? '#' + observedHead : 'null') + ' → #' + newId);
    lfSetStatus('T' + (tid+1) + ' pushed ' + value + ' successfully. CAS succeeded — head unchanged since read.', 'cas-ok');
  } else {
    // CAS FAILURE (simulated: another thread changed head)
    lfState.casFailures++; thread.casFailures++;
    thread.status = 'retrying';
    // Retry immediately in simulation
    lfGetNode(newId).next = lfState.head;
    lfState.head = newId;
    lfAddCasLog('fail', 'T' + (tid+1) + ' CAS ❌ push(' + value + ') — head changed! Retry succeeded.');
    lfSetStatus('T' + (tid+1) + ': CAS failed (head changed by another thread). Retried and succeeded.', 'cas-fail');
    thread.status = 'done';
  }

  let dokEl = document.getElementById('lfTOk' + tid);
  let dfailEl = document.getElementById('lfTFail' + tid);
  if (dokEl) dokEl.textContent = thread.casAttempts - thread.casFailures;
  if (dfailEl) dfailEl.textContent = thread.casFailures;
  lfUpdateDot(tid);
}

/* ─── Treiber Stack: pop ─── */
function lfStackPop(tid) {
  let thread = lfState.threads[tid];

  if (lfState.head === null) {
    lfSetStatus('T' + (tid+1) + ' tried to pop — stack is empty.', '');
    return;
  }

  // Phase 1: Read head
  let observedHead = lfState.head;
  thread.readHead = observedHead;
  let headNode = lfGetNode(observedHead);
  if (!headNode) return;

  // Hazard pointer: protect this node
  if (lfState.hazardOn) thread.hazardPtr = observedHead;

  thread.status = 'reading';
  lfAddCasLog('read', 'T' + (tid+1) + ' reads head → #' + observedHead + '(val=' + headNode.value + ')');

  let newHead = headNode.next;

  // Phase 2: CAS(head, observedHead, newHead)
  lfState.casAttempts++; thread.casAttempts++;

  if (lfState.head === observedHead) {
    lfState.head = newHead;
    thread.status = 'done';

    // Try to reclaim freed node
    if (lfState.hazardOn) {
      // Check if any thread still holds a hazard ptr to this node
      let stillProtected = lfState.threads.some(function(t) { return t.hazardPtr === observedHead; });
      if (stillProtected) {
        lfState.limbo.push({ id: observedHead, value: headNode.value, freedBy: tid+1 });
        lfAddCasLog('read', 'T' + (tid+1) + ' ✅ pop ' + headNode.value + '. Node #' + observedHead + ' → limbo (hazard protected by another thread)');
      } else {
        headNode.freed = true;
        lfAddCasLog('ok', 'T' + (tid+1) + ' CAS ✅ pop(' + headNode.value + ') — freed node #' + observedHead + ' safely (no hazard ptrs)');
      }
    } else {
      headNode.freed = true;
      lfAddCasLog('ok', 'T' + (tid+1) + ' CAS ✅ pop(' + headNode.value + ') — node #' + observedHead + ' freed immediately (no HP)');
    }

    if (lfState.hazardOn) thread.hazardPtr = null; // Release hazard pointer
    lfSetStatus('T' + (tid+1) + ' popped ' + headNode.value + ' successfully.', 'cas-ok');
  } else {
    lfState.casFailures++; thread.casFailures++;
    thread.status = 'retrying';
    if (lfState.hazardOn) thread.hazardPtr = null;
    lfAddCasLog('fail', 'T' + (tid+1) + ' CAS ❌ pop — head changed (ABA possible without HP)! Retry.');
    lfSetStatus('T' + (tid+1) + ': CAS failed — head changed between read and CAS.', 'cas-fail');
    thread.status = 'idle';
  }

  let dokEl = document.getElementById('lfTOk' + tid);
  let dfailEl = document.getElementById('lfTFail' + tid);
  if (dokEl) dokEl.textContent = thread.casAttempts - thread.casFailures;
  if (dfailEl) dfailEl.textContent = thread.casFailures;
  lfUpdateDot(tid);
}

/* ─── Michael-Scott Queue: enqueue ─── */
function lfQueueEnqueue(tid, value) {
  let thread = lfState.threads[tid];
  let newId = lfNewNode(value);

  lfAddCasLog('read', 'T' + (tid+1) + ' reads tail → #' + lfState.tail);

  lfState.casAttempts++; thread.casAttempts++;
  // CAS tail.next from null to newId
  let tailNode = lfGetNode(lfState.tail);
  if (tailNode && tailNode.next === null) {
    tailNode.next = newId;
    lfState.tail = newId;
    thread.status = 'done';
    lfAddCasLog('ok', 'T' + (tid+1) + ' CAS ✅ enqueue(' + value + ') — tail.next: null → #' + newId);
    lfSetStatus('T' + (tid+1) + ' enqueued ' + value + ' via CAS on tail.next.', 'cas-ok');
  } else {
    // Tail was not pointing to actual end — advance tail
    lfState.casFailures++; thread.casFailures++;
    if (tailNode && tailNode.next !== null) {
      lfState.tail = tailNode.next; // help advance tail
      tailNode = lfGetNode(lfState.tail);
      if (tailNode) { tailNode.next = newId; lfState.tail = newId; }
    }
    lfAddCasLog('fail', 'T' + (tid+1) + ' CAS ❌ tail stale — advanced tail and retried');
    lfSetStatus('T' + (tid+1) + ': CAS failed (tail was stale). Advanced tail and enqueued.', 'cas-fail');
    thread.status = 'done';
  }

  let dokEl = document.getElementById('lfTOk' + tid);
  let dfailEl = document.getElementById('lfTFail' + tid);
  if (dokEl) dokEl.textContent = thread.casAttempts - thread.casFailures;
  if (dfailEl) dfailEl.textContent = thread.casFailures;
  lfUpdateDot(tid);
}

/* ─── Michael-Scott Queue: dequeue ─── */
function lfQueueDequeue(tid) {
  let thread = lfState.threads[tid];
  let headNode = lfGetNode(lfState.head);
  if (!headNode || headNode.next === null) {
    lfSetStatus('T' + (tid+1) + ' tried to dequeue — queue is empty.', '');
    return;
  }

  lfAddCasLog('read', 'T' + (tid+1) + ' reads head.next → #' + headNode.next);
  let nextNode = lfGetNode(headNode.next);
  let nextId   = headNode.next;

  if (lfState.hazardOn) thread.hazardPtr = headNode.id;

  lfState.casAttempts++; thread.casAttempts++;
  // CAS head from current to head.next
  if (lfState.head === headNode.id) {
    let value = nextNode.value;
    lfState.head = nextId;
    if (lfState.hazardOn) {
      let stillProtected = lfState.threads.some(function(t){ return t.hazardPtr === headNode.id; });
      if (stillProtected) {
        lfState.limbo.push({ id: headNode.id, value: 'sentinel#' + headNode.id, freedBy: tid+1 });
      } else {
        headNode.freed = true;
      }
      thread.hazardPtr = null;
    } else {
      headNode.freed = true;
    }
    thread.status = 'done';
    lfAddCasLog('ok', 'T' + (tid+1) + ' CAS ✅ dequeue → ' + value);
    lfSetStatus('T' + (tid+1) + ' dequeued ' + value + '.', 'cas-ok');
  } else {
    lfState.casFailures++; thread.casFailures++;
    thread.status = 'retrying';
    if (lfState.hazardOn) thread.hazardPtr = null;
    lfAddCasLog('fail', 'T' + (tid+1) + ' CAS ❌ head changed — retry');
    lfSetStatus('T' + (tid+1) + ': CAS failed on dequeue.', 'cas-fail');
    thread.status = 'idle';
  }

  let dokEl = document.getElementById('lfTOk' + tid);
  let dfailEl = document.getElementById('lfTFail' + tid);
  if (dokEl) dokEl.textContent = thread.casAttempts - thread.casFailures;
  if (dfailEl) dfailEl.textContent = thread.casFailures;
  lfUpdateDot(tid);
}

/* ─── Render data structure canvas ─── */
function lfRenderDs() {
  let canvas = document.getElementById('lfDsCanvas');
  if (!canvas) return;
  let wrap = document.getElementById('lfDsCanvasWrap');
  let W = Math.max(wrap ? wrap.clientWidth : 500, 400);
  let H = 300;
  canvas.width = W; canvas.height = H;
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  // Collect live nodes in order
  let chain = [];
  let visited = {};
  let cur = lfState.head;
  let safety = 0;
  while (cur !== null && !visited[cur] && safety++ < 50) {
    let node = lfGetNode(cur);
    if (!node || node.freed) break;
    chain.push(node);
    visited[cur] = true;
    cur = node.next;
  }

  if (chain.length === 0) {
    ctx.fillStyle = 'rgba(148,163,184,0.3)';
    ctx.font = '12px Poppins,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(lfState.struct === 'stack' ? 'Stack is empty' : 'Queue is empty', W/2, H/2);
    return;
  }

  // Draw label
  ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.font = 'bold 9px Poppins,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(lfState.struct === 'stack' ? 'TOP →' : 'HEAD →', 10, 8);

  let boxW = 60; let boxH = 36; let spacing = 80;
  let startX = 50; let nodeY = H/2 - boxH/2;

  // Identify nodes being held by threads
  let threadHolding = {};
  lfState.threads.forEach(function(t) {
    if (t.readHead !== null) threadHolding[t.readHead] = t;
    if (t.hazardPtr !== null) threadHolding[t.hazardPtr] = t;
  });

  chain.forEach(function(node, i) {
    let x = startX + i * spacing;
    if (x + boxW > W - 20) return; // clip overflow

    let isHeld  = threadHolding[node.id];
    let isTail  = lfState.struct === 'queue' && node.id === lfState.tail;
    let isHead  = i === 0;
    let isHazard = lfState.hazardOn && lfState.threads.some(function(t){ return t.hazardPtr === node.id; });

    let fillColor   = isHazard ? 'rgba(168,85,247,0.25)' : isHeld ? 'rgba(245,158,11,0.2)' : 'rgba(6,182,212,0.15)';
    let strokeColor = isHazard ? '#a855f7' : isHeld ? '#f59e0b' : '#06b6d4';

    // Box
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor; ctx.lineWidth = isHead || isTail ? 2.5 : 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, nodeY, boxW, boxH, 6);
    else { ctx.rect(x, nodeY, boxW, boxH); }
    ctx.fill(); ctx.stroke();

    // Value
    ctx.fillStyle = strokeColor;
    ctx.font = 'bold 13px Fira Code,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let displayVal = node.value !== null ? String(node.value) : 'S'; // S for sentinel
    ctx.fillText(displayVal, x + boxW/2, nodeY + boxH/2 - 4);

    // Node id
    ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.font = '7px Fira Code,monospace';
    ctx.fillText('#' + node.id, x + boxW/2, nodeY + boxH - 5);

    // Arrow to next
    if (node.next !== null && i < chain.length - 1) {
      let ax = x + boxW + 2; let ay = nodeY + boxH/2;
      let bx = x + spacing - 4;
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, ay); ctx.stroke();
      ctx.fillStyle = 'rgba(148,163,184,0.4)';
      ctx.beginPath(); ctx.moveTo(bx, ay); ctx.lineTo(bx-6, ay-4); ctx.lineTo(bx-6, ay+4); ctx.fill();
    } else if (node.next === null) {
      ctx.fillStyle = 'rgba(148,163,184,0.3)'; ctx.font = '9px Fira Code,monospace'; ctx.textAlign = 'left';
      ctx.fillText('null', x + boxW + 4, nodeY + boxH/2 + 3);
    }

    // Head/Tail label
    if (isHead && lfState.struct === 'queue') { ctx.fillStyle = '#22c55e'; ctx.font = 'bold 8px Poppins,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('HEAD', x+boxW/2, nodeY - 10); }
    if (isTail)                               { ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 8px Poppins,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('TAIL', x+boxW/2, nodeY + boxH + 8); }

    // Thread reading indicator
    if (isHeld) {
      let t = threadHolding[node.id];
      ctx.fillStyle = t.color;
      ctx.font = 'bold 8px Fira Code,monospace'; ctx.textAlign = 'center';
      ctx.fillText('T' + (t.id+1) + ' reads', x + boxW/2, nodeY - 10);
    }
  });

  // Draw null pointer for last
  let size = document.getElementById('lfDsSize');
  if (size) size.textContent = lfState.struct === 'queue' ? Math.max(0, chain.length - 1) : chain.length;
}

/* ─── Hazard table ─── */
function lfUpdateHazardTable() {
  let tbody = document.getElementById('lfHazardBody');
  if (!tbody) return;
  tbody.innerHTML = lfState.threads.map(function(t) {
    let hp = t.hazardPtr;
    let node = hp !== null ? lfGetNode(hp) : null;
    let isActive = hp !== null;
    return '<tr class="' + (isActive ? 'lf-haz-active' : '') + '">' +
      '<td>T' + (t.id+1) + '</td>' +
      '<td>' + (hp !== null ? '#' + hp : '—') + '</td>' +
      '<td>' + (node ? 'val=' + node.value : '—') + '</td>' +
    '</tr>';
  }).join('');
}

/* ─── Limbo list ─── */
function lfUpdateLimbo() {
  let el = document.getElementById('lfLimboList');
  if (!el) return;

  // Try to reclaim any limbo nodes no longer hazard-protected
  lfState.limbo = lfState.limbo.filter(function(li) {
    let stillProtected = lfState.threads.some(function(t){ return t.hazardPtr === li.id; });
    if (!stillProtected) {
      let node = lfGetNode(li.id);
      if (node) node.freed = true;
      lfAddCasLog('ok', 'Limbo node #' + li.id + ' reclaimed (no more hazard ptrs)');
      return false;
    }
    return true;
  });

  if (lfState.limbo.length === 0) { el.innerHTML = '<div class="lf-log-empty">No nodes in limbo.</div>'; return; }
  el.innerHTML = lfState.limbo.map(function(li) {
    return '<div class="lf-limbo-entry">Node #' + li.id + ' (freed by T' + li.freedBy + ') — hazard protected</div>';
  }).join('');
}

/* ─── Metrics ─── */
function lfUpdateMetrics() {
  let att = document.getElementById('lfCasAttempts');
  let fail = document.getElementById('lfCasFailures');
  if (att)  att.textContent  = lfState.casAttempts;
  if (fail) fail.textContent = lfState.casFailures;
}

/* ─── Dot status ─── */
function lfUpdateDot(tid) {
  let dot = document.getElementById('lfDot' + tid);
  if (!dot) return;
  let thread = lfState.threads[tid];
  dot.className = 'lf-thread-status-dot ' + (thread.status === 'idle' ? 'idle' : thread.status === 'retrying' ? 'retrying' : '');
  setTimeout(function() {
    thread.status = 'idle'; dot.className = 'lf-thread-status-dot idle';
  }, 1200);
}

/* ─── CAS log ─── */
function lfAddCasLog(type, msg) {
  let log = document.getElementById('lfCasLog');
  if (!log) return;
  let empty = log.querySelector('.lf-log-empty');
  if (empty) empty.remove();
  let entry = document.createElement('div');
  entry.className = 'lf-cas-entry ' + type;
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 50) log.removeChild(log.lastChild);
}

/* ─── Status ─── */
function lfSetStatus(msg, cls) {
  let el = document.getElementById('lfStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'lf-status ' + (cls || '');
}

/* ─── ABA Demo ─── */
let lfAbaState = { step: -1, hazardOn: false };

function lfAbaStep() {
  lfAbaState.step++;
  if (lfAbaState.step > 3) lfAbaState.step = 3;

  let steps = ['lfAba0','lfAba1','lfAba2','lfAba3'];
  steps.forEach(function(id, i) {
    let el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('active','done','danger','safe','pending');
    if (i < lfAbaState.step)       el.classList.add('done');
    else if (i === lfAbaState.step) el.classList.add(i === 3 ? (lfState.hazardOn ? 'safe' : 'danger') : 'active');
    else                            el.classList.add('pending');
  });

  // Update step 4 text depending on hazard state
  let s4 = document.getElementById('lfAbaStep4Text');
  if (s4) s4.textContent = lfState.hazardOn
    ? 'WITH hazard pointers: T1 had a hazard pointer on A. B was in limbo, not freed. T1\'s CAS succeeds but B is still valid. ✅ No use-after-free.'
    : 'WITHOUT hazard pointers: B was freed → accessing it is use-after-free. 💥 Crash or silent data corruption.';

  // Update hazard badge
  let badge = document.getElementById('lfAbaHazardBadge');
  if (badge) {
    badge.textContent = 'Hazard Pointers: ' + (lfState.hazardOn ? 'ON' : 'OFF');
    badge.className = 'lf-hazard-badge' + (lfState.hazardOn ? ' on' : '');
  }

  lfDrawAbaCanvas(lfAbaState.step);
}

function lfAbaReset() {
  lfAbaState.step = -1;
  let steps = ['lfAba0','lfAba1','lfAba2','lfAba3'];
  steps.forEach(function(id) {
    let el = document.getElementById(id);
    if (el) { el.className = 'lf-aba-step pending'; }
  });
  lfDrawAbaCanvas(-1);
}

function lfDrawAbaCanvas(step) {
  let canvas = document.getElementById('lfAbaCanvas');
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth || 280;
  canvas.height = 200;
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let W = canvas.width; let H = canvas.height;
  let bw = 50; let bh = 32; let gap = 20;

  function drawNode(x, y, label, id, color, crossed) {
    ctx.fillStyle = 'rgba(' + color + ',0.2)'; ctx.strokeStyle = 'rgb(' + color + ')'; ctx.lineWidth = 1.8;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, bw, bh, 5); else ctx.rect(x, y, bw, bh);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgb(' + color + ')'; ctx.font = 'bold 11px Fira Code,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x+bw/2, y+bh/2-3);
    ctx.font = '7px Fira Code,monospace'; ctx.fillText('#' + id, x+bw/2, y+bh-5);
    if (crossed) {
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x+4, y+4); ctx.lineTo(x+bw-4, y+bh-4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+bw-4, y+4); ctx.lineTo(x+4, y+bh-4); ctx.stroke();
    }
  }

  function drawArrow(x1, y1, x2, y2, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    let dx = x2-x1; let dy = y2-y1; let len = Math.sqrt(dx*dx+dy*dy)||1;
    let ux = dx/len; let uy = dy/len;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2-ux*8-uy*4, y2-uy*8+ux*4); ctx.lineTo(x2-ux*8+uy*4, y2-uy*8-ux*4); ctx.fill();
  }

  // Always show initial state: HEAD → A(10) → B(20) → null
  let ax = 30; let ay = 80;
  let bx = ax + bw + gap; let by = ay;
  let cx2 = bx + bw + gap;

  // HEAD pointer
  ctx.fillStyle = '#22c55e'; ctx.font = 'bold 9px Poppins,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('HEAD', 4, ay + bh/2);
  drawArrow(38, ay+bh/2, ax, ay+bh/2, '#22c55e');

  let aFreed = step >= 1 && !lfState.hazardOn;
  let bFreed = step >= 1;

  drawNode(ax, ay, 'A=10', 1, '34,197,94', aFreed);
  drawNode(bx, by, 'B=20', 2, '239,68,68', bFreed);

  if (step < 1) drawArrow(ax+bw, ay+bh/2, bx, by+bh/2, 'rgba(148,163,184,0.5)');

  // After step 1: A is back at head (same address), B is freed
  if (step >= 1) {
    // A pushed back, head → A again
    ctx.fillStyle = '#f59e0b'; ctx.font = '8px Poppins,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('T2 pushed A back', ax+bw/2, ay-12);
    // B freed (or in limbo)
    ctx.fillStyle = lfState.hazardOn ? '#f59e0b' : '#ef4444';
    ctx.font = '8px Poppins,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(lfState.hazardOn ? 'B in limbo' : 'B freed! ⚠️', bx+bw/2, by+bh+12);
  }

  // T1's stale read indicator
  if (step >= 0) {
    ctx.fillStyle = '#06b6d4'; ctx.font = '8px Poppins,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('T1 read A here', ax+bw/2, ay + bh + 26);
    ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 1; ctx.setLineDash([3,2]);
    ctx.beginPath(); ctx.moveTo(ax+bw/2, ay+bh); ctx.lineTo(ax+bw/2, ay+bh+18); ctx.stroke();
    ctx.setLineDash([]);
  }

  // CAS outcome
  if (step >= 2) {
    ctx.fillStyle = step < 3 ? '#f97316' : (lfState.hazardOn ? '#22c55e' : '#ef4444');
    ctx.font = 'bold 9px Poppins,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(step < 3 ? 'T1 CAS: head==A → "success"!' : (lfState.hazardOn ? '✅ B safe in limbo — no UAF' : '💥 T1 accesses B — use-after-free!'), W/2, H - 15);
  }
}

/* ─── Hazard toggle ─── */
function lfHandleHazardToggle() {
  let check = document.getElementById('lfHazardOn');
  let stateEl = document.getElementById('lfHazardState');
  lfState.hazardOn = check.checked;
  if (stateEl) { stateEl.textContent = lfState.hazardOn ? 'ON — ABA protected' : 'OFF — ABA possible'; stateEl.className = 'lf-toggle-state' + (lfState.hazardOn ? ' on' : ''); }
}

/* ─── Init ─── */
function lfInit() {
  // Structure buttons
  document.querySelectorAll('.lf-struct-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.lf-struct-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      lfState.struct = btn.getAttribute('data-struct');
      let title = document.getElementById('lfDsTitle');
      if (title) title.textContent = lfState.struct === 'stack' ? 'Treiber Stack' : 'Michael-Scott Queue';
      if (lfState.initialized) lfInitialize();
    });
  });

  // Init/Reset
  let initBtn  = document.getElementById('lfInitBtn');
  let resetBtn = document.getElementById('lfResetBtn');
  if (initBtn)  initBtn.addEventListener('click', lfInitialize);
  if (resetBtn) resetBtn.addEventListener('click', function() {
    if (lfState.initialized) lfInitialize();
  });

  // Hazard toggle
  let hazardCheck = document.getElementById('lfHazardOn');
  if (hazardCheck) hazardCheck.addEventListener('change', lfHandleHazardToggle);

  // ABA buttons
  let abaBtn   = document.getElementById('lfAbaBtn');
  let abaStep  = document.getElementById('lfAbaStepBtn');
  let abaReset = document.getElementById('lfAbaResetBtn');
  if (abaBtn)   abaBtn.addEventListener('click', function() { lfAbaReset(); document.getElementById('lfAbaCard').scrollIntoView({ behavior: 'smooth' }); });
  if (abaStep)  abaStep.addEventListener('click', lfAbaStep);
  if (abaReset) abaReset.addEventListener('click', lfAbaReset);

  // Window resize
  window.addEventListener('resize', function() { if (lfState.initialized) lfRenderDs(); });

  // Auto-init
  lfInitialize();

  // Initial ABA canvas
  lfDrawAbaCanvas(-1);
}

// roundRect polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r) {
    this.beginPath(); this.moveTo(x+r,y); this.lineTo(x+w-r,y);
    this.quadraticCurveTo(x+w,y,x+w,y+r); this.lineTo(x+w,y+h-r);
    this.quadraticCurveTo(x+w,y+h,x+w-r,y+h); this.lineTo(x+r,y+h);
    this.quadraticCurveTo(x,y+h,x,y+h-r); this.lineTo(x,y+r);
    this.quadraticCurveTo(x,y,x+r,y); this.closePath();
  };
}