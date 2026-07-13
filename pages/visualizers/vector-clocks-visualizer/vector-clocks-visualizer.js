document.addEventListener('DOMContentLoaded', function () {
  vcInit();
});

var VC_COLORS = ['#06b6d4', '#a855f7', '#22c55e', '#f59e0b'];

var vcState = {
  numNodes: 3,
  clocks: [],
  lamport: [],
  events: [],
  pendingSend: null,
};

function vcCloneClock(clock) {
  return clock.slice();
}

function vcCreateNodes(n) {
  vcState.numNodes = n;
  vcState.clocks = [];
  vcState.lamport = [];
  for (var i = 0; i < n; i++) {
    vcState.clocks.push(new Array(n).fill(0));
    vcState.lamport.push(0);
  }
  vcState.events = [];
  vcState.pendingSend = null;
}

function vcLocalEvent(nodeId) {
  vcState.clocks[nodeId][nodeId]++;
  vcState.lamport[nodeId]++;
  var event = {
    type: 'local',
    nodeId: nodeId,
    clock: vcCloneClock(vcState.clocks[nodeId]),
    lamport: vcState.lamport[nodeId],
    id: vcState.events.length,
  };
  vcState.events.push(event);
  return event;
}

function vcSendMessage(fromId) {
  vcState.clocks[fromId][fromId]++;
  vcState.lamport[fromId]++;
  var event = {
    type: 'send',
    nodeId: fromId,
    clock: vcCloneClock(vcState.clocks[fromId]),
    lamport: vcState.lamport[fromId],
    id: vcState.events.length,
  };
  vcState.events.push(event);
  vcState.pendingSend = event;
  return event;
}

function vcReceiveMessage(toId, sendEvent) {
  for (var i = 0; i < vcState.numNodes; i++) {
    vcState.clocks[toId][i] = Math.max(vcState.clocks[toId][i], sendEvent.clock[i]);
  }
  vcState.clocks[toId][toId]++;
  vcState.lamport[toId] = Math.max(vcState.lamport[toId], sendEvent.lamport) + 1;

  var event = {
    type: 'receive',
    nodeId: toId,
    clock: vcCloneClock(vcState.clocks[toId]),
    lamport: vcState.lamport[toId],
    id: vcState.events.length,
    fromEventId: sendEvent.id,
  };
  vcState.events.push(event);
  vcState.pendingSend = null;
  return event;
}

function vcCompareClocks(clockA, clockB) {
  var aLessOrEqual = true;
  var bLessOrEqual = true;
  for (var i = 0; i < clockA.length; i++) {
    if (clockA[i] > clockB[i]) aLessOrEqual = false;
    if (clockB[i] > clockA[i]) bLessOrEqual = false;
  }
  if (aLessOrEqual && !arraysEqual(clockA, clockB)) return 'a-before-b';
  if (bLessOrEqual && !arraysEqual(clockA, clockB)) return 'b-before-a';
  if (arraysEqual(clockA, clockB)) return 'equal';
  return 'concurrent';
}

function arraysEqual(a, b) {
  return (
    a.length === b.length &&
    a.every(function (v, i) {
      return v === b[i];
    })
  );
}

function vcRenderNodePanels() {
  var container = document.getElementById('vcNodePanels');
  if (!container) return;
  container.innerHTML = '';

  for (var n = 0; n < vcState.numNodes; n++) {
    var panel = document.createElement('div');
    panel.className = 'vc-node-panel';
    panel.style.setProperty('--nc', VC_COLORS[n % VC_COLORS.length]);

    var clockHtml = vcState.clocks[n]
      .map(function (v, i) {
        return '<div class="vc-clock-comp' + (i === n ? ' own' : '') + '">' + v + '</div>';
      })
      .join('');

    var sendOptions = '';
    for (var t = 0; t < vcState.numNodes; t++) {
      if (t !== n) sendOptions += '<option value="' + t + '">to N' + t + '</option>';
    }

    panel.innerHTML =
      '<div class="vc-node-header"><span class="vc-node-name">Node ' +
      n +
      '</span></div>' +
      '<div class="vc-clock-display">' +
      clockHtml +
      '</div>' +
      '<div class="vc-node-btn-row">' +
      '<button class="vc-local-event-btn" data-node="' +
      n +
      '">Local Event</button>' +
      '<select class="vc-select vc-send-target" data-node="' +
      n +
      '" style="flex:1;font-size:0.72rem;padding:0.32rem 0.4rem">' +
      sendOptions +
      '</select>' +
      '<button class="vc-send-btn" data-node="' +
      n +
      '">Send</button>' +
      '</div>';

    container.appendChild(panel);
  }

  container.querySelectorAll('.vc-local-event-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var nodeId = parseInt(this.getAttribute('data-node'));
      var ev = vcLocalEvent(nodeId);
      vcRenderNodePanels();
      vcRenderTimeline();
      vcUpdateEventSelects();
      vcSetStatus(
        'Node ' + nodeId + ' had a local event. Clock: [' + ev.clock.join(', ') + ']',
        'event'
      );
    });
  });

  container.querySelectorAll('.vc-send-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var fromId = parseInt(this.getAttribute('data-node'));
      var select = container.querySelector('.vc-send-target[data-node="' + fromId + '"]');
      var toId = parseInt(select.value);
      if (isNaN(toId)) return;

      var sendEv = vcSendMessage(fromId);
      var recvEv = vcReceiveMessage(toId, sendEv);

      vcRenderNodePanels();
      vcRenderTimeline();
      vcUpdateEventSelects();
      vcSetStatus(
        'Node ' +
          fromId +
          ' sent to Node ' +
          toId +
          '. Receiver merged clocks (component-wise max) then incremented its own: [' +
          recvEv.clock.join(', ') +
          ']',
        'sent'
      );
    });
  });
}

function vcRenderTimeline() {
  var canvas = document.getElementById('vcTimelineCanvas');
  if (!canvas) return;
  var wrap = canvas.parentElement;
  var W = Math.max(wrap.clientWidth, 500);
  var H = vcState.numNodes * 70 + 40;
  canvas.width = W;
  canvas.height = H;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  var laneY = {};
  for (var n = 0; n < vcState.numNodes; n++) laneY[n] = 40 + n * 70;

  for (var m = 0; m < vcState.numNodes; m++) {
    ctx.strokeStyle = 'rgba(148,163,184,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, laneY[m]);
    ctx.lineTo(W - 20, laneY[m]);
    ctx.stroke();
    ctx.fillStyle = VC_COLORS[m % VC_COLORS.length];
    ctx.font = 'bold 10px Fira Code,monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('N' + m, 5, laneY[m]);
  }

  var eventsByNode = {};
  vcState.events.forEach(function (ev) {
    if (!eventsByNode[ev.nodeId]) eventsByNode[ev.nodeId] = [];
    eventsByNode[ev.nodeId].push(ev);
  });

  var eventX = {};
  var spacing = Math.max(60, (W - 80) / Math.max(1, vcState.events.length));

  vcState.events.forEach(function (ev, i) {
    var x = 50 + i * spacing;
    eventX[ev.id] = x;
    var y = laneY[ev.nodeId];
    var color = VC_COLORS[ev.nodeId % VC_COLORS.length];

    ctx.beginPath();
    ctx.arc(x, y, ev.type === 'send' || ev.type === 'receive' ? 7 : 5, 0, Math.PI * 2);
    ctx.fillStyle = color + '55';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = '8px Fira Code,monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('[' + ev.clock.join(',') + ']', x, y + 12);

    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.textBaseline = 'bottom';
    ctx.fillText('e' + ev.id, x, y - 10);
  });

  vcState.events.forEach(function (ev) {
    if (ev.type === 'receive' && eventX[ev.fromEventId] !== undefined) {
      var fromEv = vcState.events[ev.fromEventId];
      var x1 = eventX[ev.fromEventId];
      var y1 = laneY[fromEv.nodeId];
      var x2 = eventX[ev.id];
      var y2 = laneY[ev.nodeId];
      ctx.strokeStyle = 'rgba(245,158,11,0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);

      var dx = x2 - x1;
      var dy = y2 - y1;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / len;
      var uy = dy / len;
      ctx.fillStyle = 'rgba(245,158,11,0.6)';
      ctx.beginPath();
      ctx.moveTo(x2 - ux * 10, y2 - uy * 10);
      ctx.lineTo(x2 - ux * 16 - uy * 5, y2 - uy * 16 + ux * 5);
      ctx.lineTo(x2 - ux * 16 + uy * 5, y2 - uy * 16 - ux * 5);
      ctx.fill();
    }
  });
}

function vcUpdateEventSelects() {
  var aSel = document.getElementById('vcEventASelect');
  var bSel = document.getElementById('vcEventBSelect');
  if (!aSel || !bSel) return;

  var options =
    '<option value="">Select event</option>' +
    vcState.events
      .map(function (ev) {
        return (
          '<option value="' +
          ev.id +
          '">e' +
          ev.id +
          ' — N' +
          ev.nodeId +
          ' [' +
          ev.clock.join(',') +
          ']</option>'
        );
      })
      .join('');

  var curA = aSel.value;
  var curB = bSel.value;
  aSel.innerHTML = options;
  bSel.innerHTML = options;
  aSel.value = curA;
  bSel.value = curB;
}

function vcCheckCausality() {
  var aSel = document.getElementById('vcEventASelect');
  var bSel = document.getElementById('vcEventBSelect');
  var resultEl = document.getElementById('vcCcResult');
  if (!aSel || !bSel || !resultEl) return;

  var aId = parseInt(aSel.value);
  var bId = parseInt(bSel.value);
  if (isNaN(aId) || isNaN(bId)) {
    vcSetStatus('Select two events to compare.', '');
    return;
  }

  var evA = vcState.events[aId];
  var evB = vcState.events[bId];
  var relation = vcCompareClocks(evA.clock, evB.clock);

  resultEl.classList.remove('hidden');

  if (relation === 'a-before-b') {
    resultEl.className = 'vc-cc-result before';
    resultEl.innerHTML =
      '✅ <strong>e' +
      aId +
      ' happened-before e' +
      bId +
      '</strong>. Every component of [' +
      evA.clock.join(',') +
      '] is ≤ the corresponding component of [' +
      evB.clock.join(',') +
      '], with at least one strictly less.';
  } else if (relation === 'b-before-a') {
    resultEl.className = 'vc-cc-result before';
    resultEl.innerHTML =
      '✅ <strong>e' +
      bId +
      ' happened-before e' +
      aId +
      '</strong>. Every component of [' +
      evB.clock.join(',') +
      '] is ≤ the corresponding component of [' +
      evA.clock.join(',') +
      '], with at least one strictly less.';
  } else if (relation === 'equal') {
    resultEl.className = 'vc-cc-result before';
    resultEl.textContent = 'These are the same event (identical clocks).';
  } else {
    resultEl.className = 'vc-cc-result concurrent';
    resultEl.innerHTML =
      '⚡ <strong>e' +
      aId +
      ' and e' +
      bId +
      ' are CONCURRENT</strong>. Neither clock dominates the other — [' +
      evA.clock.join(',') +
      '] vs [' +
      evB.clock.join(',') +
      ']. Neither event could have influenced the other; a real conflict if both wrote to the same data.';
  }
}

function vcRunLamportDivergence() {
  vcCreateNodes(2);

  vcLocalEvent(0);
  vcLocalEvent(0);
  vcLocalEvent(0);
  var evA = vcState.events[vcState.events.length - 1];

  vcLocalEvent(1);
  var evB = vcState.events[vcState.events.length - 1];

  var relation = vcCompareClocks(evA.clock, evB.clock);

  var resultEl = document.getElementById('vcLamportResult');
  if (resultEl) {
    resultEl.classList.remove('hidden');
    resultEl.innerHTML =
      'Node 0 had 3 independent local events (Lamport reaches ' +
      vcState.lamport[0] +
      ', vector clock [' +
      evA.clock.join(',') +
      ']). ' +
      'Node 1, completely independently, had 1 local event (Lamport reaches ' +
      vcState.lamport[1] +
      ', vector clock [' +
      evB.clock.join(',') +
      ']). ' +
      "<br><br>Lamport timestamps: Node 1's event (" +
      vcState.lamport[1] +
      ") has a <strong>smaller</strong> number than Node 0's third event (" +
      vcState.lamport[0] +
      ') — a naive reading might assume Node 1\'s event "happened before" in some causal sense. ' +
      '<br><br>Vector clocks reveal the truth: <strong>' +
      (relation === 'concurrent' ? 'these two events are genuinely CONCURRENT' : relation) +
      "</strong> — neither clock dominates the other, because no message was ever exchanged between these nodes. Lamport's single integer cannot express this; only the vector can.";
  }

  vcRenderNodePanels();
  vcRenderTimeline();
  vcUpdateEventSelects();
  vcSetStatus('Divergence scenario complete. See the result panel below the button.', 'event');
}

function vcSetStatus(msg, cls) {
  var el = document.getElementById('vcStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = 'vc-status ' + (cls || '');
}

function vcReset() {
  vcCreateNodes(vcState.numNodes);
  vcRenderNodePanels();
  vcRenderTimeline();
  vcUpdateEventSelects();
  var ccResult = document.getElementById('vcCcResult');
  if (ccResult) ccResult.classList.add('hidden');
  var lamportResult = document.getElementById('vcLamportResult');
  if (lamportResult) lamportResult.classList.add('hidden');
  vcSetStatus(
    'Reset with ' + vcState.numNodes + ' nodes. Click "Local Event" or "Send" to begin.',
    ''
  );
}

function vcInit() {
  var nodeBtnContainer = document.getElementById('vcNodeBtns');
  if (nodeBtnContainer) {
    [3, 4].forEach(function (n) {
      var btn = document.createElement('button');
      btn.className = 'vc-node-count-btn' + (n === 3 ? ' active' : '');
      btn.textContent = n + ' nodes';
      btn.addEventListener('click', function () {
        nodeBtnContainer.querySelectorAll('.vc-node-count-btn').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        vcCreateNodes(n);
        vcReset();
      });
      nodeBtnContainer.appendChild(btn);
    });
  }

  vcCreateNodes(3);
  vcRenderNodePanels();
  vcRenderTimeline();
  vcUpdateEventSelects();

  var resetBtn = document.getElementById('vcResetBtn');
  if (resetBtn) resetBtn.addEventListener('click', vcReset);

  var ccCheckBtn = document.getElementById('vcCcCheckBtn');
  if (ccCheckBtn) ccCheckBtn.addEventListener('click', vcCheckCausality);

  var lamportRunBtn = document.getElementById('vcLamportRunBtn');
  if (lamportRunBtn) lamportRunBtn.addEventListener('click', vcRunLamportDivergence);

  window.addEventListener('resize', vcRenderTimeline);
}
