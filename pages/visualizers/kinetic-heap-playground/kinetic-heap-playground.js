document.addEventListener('DOMContentLoaded', function() {
  khInit();
});

var KH_COLORS = ['#06b6d4','#a855f7','#22c55e','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316','#3b82f6','#84cc16'];
var KH_EPS = 1e-6;

var khState = {
  objects   : [],
  heapOrder : [],
  certs     : [],
  time      : 0,
  playing   : false,
  speed     : 1,
  lastFrame : null,
  nextObjId : 0,
  selectedId: null,
  canvasW   : 640,
  canvasH   : 420,
};

function khPriority(obj, t) { return obj.x0 + obj.vx * t; }

function khTriangleWave(val, span) {
  var m = val % (2 * span);
  if (m < 0) m += 2 * span;
  return m <= span ? m : 2 * span - m;
}

function khRenderX(obj, t) { return khTriangleWave(obj.x0 + obj.vx * t, khState.canvasW - 40) + 20; }
function khRenderY(obj, t) { return khTriangleWave(obj.y0 + obj.vy * t, khState.canvasH - 40) + 20; }

function khMakeObject(idx) {
  var color = KH_COLORS[idx % KH_COLORS.length];
  return {
    id: khState.nextObjId++,
    x0: Math.random() * 400,
    y0: Math.random() * 300,
    vx: 20 + Math.random() * 60,
    vy: (Math.random() - 0.5) * 80,
    color: color,
  };
}

function khCertExpiry(parentObj, childObj, currentTime) {
  var diffA = parentObj.vx - childObj.vx;
  var diffB = parentObj.x0 - childObj.x0;
  if (diffA >= -KH_EPS) return Infinity;
  var t = -diffB / diffA;
  if (t <= currentTime + KH_EPS) t = currentTime + KH_EPS;
  return t;
}

function khRecomputeCerts() {
  khState.certs = [];
  var order = khState.heapOrder;
  for (var i = 1; i < order.length; i++) {
    var p = Math.floor((i - 1) / 2);
    var parentObj = khState.objects[order[p]];
    var childObj  = khState.objects[order[i]];
    var expiry = khCertExpiry(parentObj, childObj, khState.time);
    khState.certs.push({ parentIdx: p, childIdx: i, expiry: expiry, parentObjId: parentObj.id, childObjId: childObj.id });
  }
}

function khNextEvent() {
  if (khState.certs.length === 0) return null;
  var best = null;
  khState.certs.forEach(function(c) {
    if (c.expiry === Infinity) return;
    if (!best || c.expiry < best.expiry) best = c;
  });
  return best;
}

function khBuildInitialHeap(objects) {
  var order = objects.map(function(_, i) { return i; });
  order.sort(function(a, b) { return khPriority(objects[b], 0) - khPriority(objects[a], 0); });
  return khHeapifyByArray(order, objects, 0);
}

function khHeapifyByArray(order, objects, t) {
  var n = order.length;
  for (var i = Math.floor(n / 2) - 1; i >= 0; i--) khSiftDown(order, objects, i, t);
  return order;
}

function khSiftDown(order, objects, i, t) {
  var n = order.length;
  while (true) {
    var l = 2 * i + 1; var r = 2 * i + 2; var largest = i;
    if (l < n && khPriority(objects[order[l]], t) > khPriority(objects[order[largest]], t)) largest = l;
    if (r < n && khPriority(objects[order[r]], t) > khPriority(objects[order[largest]], t)) largest = r;
    if (largest === i) break;
    var tmp = order[i]; order[i] = order[largest]; order[largest] = tmp;
    i = largest;
  }
}

function khSiftUp(order, objects, i, t) {
  while (i > 0) {
    var p = Math.floor((i - 1) / 2);
    if (khPriority(objects[order[p]], t) >= khPriority(objects[order[i]], t)) break;
    var tmp = order[i]; order[i] = order[p]; order[p] = tmp;
    i = p;
  }
}

function khAdvanceTo(targetTime) {
  var guard = 0;
  while (guard++ < 200) {
    var event = khNextEvent();
    if (!event || event.expiry > targetTime + KH_EPS) break;

    khState.time = event.expiry;
    var order = khState.heapOrder;
    var tmp = order[event.parentIdx]; order[event.parentIdx] = order[event.childIdx]; order[event.childIdx] = tmp;

    var parentName = 'obj#' + khState.objects[event.parentObjId] ? khObjLabel(event.parentObjId) : event.parentObjId;
    khAddEventLog('Swap at t=' + event.expiry.toFixed(2) + 's: ' + khObjLabel(event.childObjId) + ' overtook ' + khObjLabel(event.parentObjId));

    khSiftDown(order, khState.objects, event.parentIdx, khState.time);
    khSiftUp(order, khState.objects, event.childIdx, khState.time);
    khRecomputeCerts();
  }
  khState.time = targetTime;
}

function khObjLabel(objId) {
  var idx = khState.objects.findIndex(function(o) { return o.id === objId; });
  return 'obj#' + objId;
}

function khAddEventLog(msg) {
  var log = document.getElementById('khEventLog');
  if (!log) return;
  var empty = log.querySelector('.kh-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'kh-event-entry';
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 40) log.removeChild(log.lastChild);
  var statusEl = document.getElementById('khStatus');
  if (statusEl) { statusEl.textContent = msg; statusEl.className = 'kh-status repair'; }
}

function khDrawMainCanvas() {
  var canvas = document.getElementById('khMainCanvas');
  if (!canvas) return;
  var wrap = document.getElementById('khCanvasWrap');
  khState.canvasW = wrap.clientWidth;
  khState.canvasH = wrap.clientHeight || 420;
  canvas.width = khState.canvasW;
  canvas.height = khState.canvasH;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var maxObjId = khState.heapOrder.length ? khState.objects[khState.heapOrder[0]].id : null;

  khState.objects.forEach(function(obj) {
    var x = khRenderX(obj, khState.time);
    var y = khRenderY(obj, khState.time);
    var isMax = obj.id === maxObjId;
    var isSelected = obj.id === khState.selectedId;

    if (isMax) {
      ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34,197,94,0.25)'; ctx.fill();
    }

    ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fillStyle = obj.color + '55';
    ctx.fill();
    ctx.strokeStyle = isMax ? '#22c55e' : obj.color;
    ctx.lineWidth = isMax ? 3 : (isSelected ? 2.5 : 1.8);
    ctx.stroke();

    ctx.fillStyle = obj.color;
    ctx.font = 'bold 9px Fira Code,monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(obj.id, x, y);

    ctx.font = '8px Fira Code,monospace';
    ctx.fillStyle = 'rgba(203,213,225,0.7)';
    ctx.fillText('p=' + Math.round(khPriority(obj, khState.time)), x, y + 22);
  });

  var maxLabel = document.getElementById('khMaxLabel');
  if (maxLabel && maxObjId !== null) maxLabel.textContent = 'obj#' + maxObjId + ' (p=' + Math.round(khPriority(khState.objects[khState.heapOrder[0]], khState.time)) + ')';
}

function khDrawHeapSvg() {
  var svg = document.getElementById('khHeapSvg');
  if (!svg) return;
  var order = khState.heapOrder;
  var n = order.length;
  if (n === 0) { svg.innerHTML = ''; return; }

  var levels = Math.floor(Math.log2(n)) + 1;
  var W = 260; var H = levels * 55 + 30;
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  svg.innerHTML = '';

  var pos = {};
  for (var lvl = 0; lvl < levels; lvl++) {
    var start = Math.pow(2, lvl) - 1;
    var count = Math.min(Math.pow(2, lvl), n - start);
    for (var k = 0; k < count; k++) {
      var idx = start + k;
      if (idx >= n) break;
      var slots = Math.pow(2, lvl);
      pos[idx] = { x: W * (k + 0.5) / slots, y: 30 + lvl * 50 };
    }
  }

  var ns = 'http://www.w3.org/2000/svg';
  for (var i = 1; i < n; i++) {
    var p = Math.floor((i - 1) / 2);
    if (!pos[i] || !pos[p]) continue;
    var line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', pos[p].x); line.setAttribute('y1', pos[p].y);
    line.setAttribute('x2', pos[i].x); line.setAttribute('y2', pos[i].y);
    line.setAttribute('stroke', 'rgba(148,163,184,0.3)'); line.setAttribute('stroke-width', '1.3');
    svg.appendChild(line);
  }

  for (var idx = 0; idx < n; idx++) {
    if (!pos[idx]) continue;
    var obj = khState.objects[order[idx]];
    var circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', pos[idx].x); circle.setAttribute('cy', pos[idx].y); circle.setAttribute('r', '13');
    circle.setAttribute('fill', obj.color + '33'); circle.setAttribute('stroke', obj.color); circle.setAttribute('stroke-width', idx === 0 ? '2.5' : '1.5');
    svg.appendChild(circle);

    var text = document.createElementNS(ns, 'text');
    text.setAttribute('x', pos[idx].x); text.setAttribute('y', pos[idx].y + 3);
    text.setAttribute('text-anchor', 'middle'); text.setAttribute('font-size', '9'); text.setAttribute('font-family', 'Fira Code,monospace');
    text.setAttribute('fill', obj.color); text.textContent = obj.id;
    svg.appendChild(text);
  }
}

function khRenderCertList() {
  var list = document.getElementById('khCertList');
  if (!list) return;
  if (khState.certs.length === 0) { list.innerHTML = '<div class="kh-empty">No certificates yet.</div>'; return; }

  var sorted = khState.certs.slice().sort(function(a, b) { return a.expiry - b.expiry; });
  list.innerHTML = sorted.slice(0, 12).map(function(c) {
    var countdown = c.expiry === Infinity ? '∞' : (c.expiry - khState.time).toFixed(2) + 's';
    var isSoon = c.expiry !== Infinity && (c.expiry - khState.time) < 1;
    return '<div class="kh-cert-item' + (isSoon ? ' soon' : '') + '">' +
      '<span>obj#' + c.parentObjId + ' ≥ obj#' + c.childObjId + '</span>' +
      '<span class="kh-cert-countdown">' + countdown + '</span>' +
    '</div>';
  }).join('');
}

function khUpdateTimeDisplay() {
  var el = document.getElementById('khTimeVal');
  if (el) el.textContent = khState.time.toFixed(2);
}

function khDrawInspector() {
  var card = document.getElementById('khInspectorCard');
  var canvas = document.getElementById('khInspectorCanvas');
  var nameEl = document.getElementById('khInspectorObjName');
  if (!card || !canvas) return;

  if (khState.selectedId === null) { card.classList.add('hidden'); return; }
  var obj = khState.objects.find(function(o) { return o.id === khState.selectedId; });
  if (!obj) { card.classList.add('hidden'); return; }

  card.classList.remove('hidden');
  if (nameEl) nameEl.textContent = '(obj#' + obj.id + ')';

  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 140;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var W = canvas.width; var H = canvas.height;
  var pad = { top: 10, right: 10, bottom: 20, left: 40 };
  var plotW = W - pad.left - pad.right;
  var plotH = H - pad.top - pad.bottom;

  var tMin = Math.max(0, khState.time - 5);
  var tMax = khState.time + 5;
  var pMin = khPriority(obj, tMin);
  var pMax = khPriority(obj, tMax);
  if (pMin > pMax) { var tmp = pMin; pMin = pMax; pMax = tmp; }
  pMin -= 20; pMax += 20;

  function xPos(t) { return pad.left + ((t - tMin) / (tMax - tMin)) * plotW; }
  function yPos(p) { return pad.top + (1 - (p - pMin) / (pMax - pMin)) * plotH; }

  ctx.strokeStyle = obj.color; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xPos(tMin), yPos(khPriority(obj, tMin)));
  ctx.lineTo(xPos(tMax), yPos(khPriority(obj, tMax)));
  ctx.stroke();

  var curX = xPos(khState.time); var curY = yPos(khPriority(obj, khState.time));
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([3, 2]);
  ctx.beginPath(); ctx.moveTo(curX, pad.top); ctx.lineTo(curX, pad.top + plotH); ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath(); ctx.arc(curX, curY, 4, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();

  ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.font = '8px Fira Code,monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('p(t)=' + obj.vx.toFixed(1) + 't+' + obj.x0.toFixed(0), pad.left, pad.top);
}

function khRerenderAll() {
  khDrawMainCanvas();
  khDrawHeapSvg();
  khRenderCertList();
  khUpdateTimeDisplay();
  khDrawInspector();
}

function khTick(now) {
  if (!khState.playing) return;
  if (khState.lastFrame === null) khState.lastFrame = now;
  var dt = (now - khState.lastFrame) / 1000;
  khState.lastFrame = now;

  var target = khState.time + dt * khState.speed;
  khAdvanceTo(target);
  khRerenderAll();

  requestAnimationFrame(khTick);
}

function khTogglePlay() {
  khState.playing = !khState.playing;
  var btn = document.getElementById('khPlayBtn');
  if (khState.playing) {
    if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> Pause Time';
    khState.lastFrame = null;
    requestAnimationFrame(khTick);
  } else {
    if (btn) btn.innerHTML = '<i class="fas fa-play"></i> Play Time';
  }
}

function khAddObject() {
  var idx = khState.objects.length;
  var newObj = khMakeObject(idx);
  khState.objects.push(newObj);
  var newHeapIdx = khState.heapOrder.length;
  khState.heapOrder.push(khState.objects.length - 1);
  khSiftUp(khState.heapOrder, khState.objects, newHeapIdx, khState.time);
  khRecomputeCerts();
  khAddEventLog('obj#' + newObj.id + ' added at t=' + khState.time.toFixed(2) + 's');
  var log = document.getElementById('khEventLog');
  if (log && log.firstChild) log.firstChild.classList.add('add');
  khRerenderAll();
}

function khHandleCanvasClick(e) {
  var canvas = document.getElementById('khMainCanvas');
  var rect = canvas.getBoundingClientRect();
  var scaleX = canvas.width / rect.width;
  var scaleY = canvas.height / rect.height;
  var mx = (e.clientX - rect.left) * scaleX;
  var my = (e.clientY - rect.top) * scaleY;

  var clicked = null;
  khState.objects.forEach(function(obj) {
    var x = khRenderX(obj, khState.time);
    var y = khRenderY(obj, khState.time);
    var d = Math.sqrt((x - mx) * (x - mx) + (y - my) * (y - my));
    if (d <= 14) clicked = obj;
  });

  khState.selectedId = clicked ? clicked.id : null;
  khDrawInspector();
  khDrawMainCanvas();
}

function khReset() {
  khState.playing = false;
  var btn = document.getElementById('khPlayBtn');
  if (btn) btn.innerHTML = '<i class="fas fa-play"></i> Play Time';

  khState.time = 0;
  khState.nextObjId = 0;
  khState.selectedId = null;
  khState.objects = [];
  for (var i = 0; i < 8; i++) khState.objects.push(khMakeObject(i));
  khState.heapOrder = khBuildInitialHeap(khState.objects);
  khRecomputeCerts();

  var log = document.getElementById('khEventLog');
  if (log) log.innerHTML = '<div class="kh-empty">No events yet.</div>';

  khRerenderAll();
}

function khInit() {
  khReset();

  var playBtn  = document.getElementById('khPlayBtn');
  var addBtn   = document.getElementById('khAddBtn');
  var resetBtn = document.getElementById('khResetBtn');
  if (playBtn)  playBtn.addEventListener('click', khTogglePlay);
  if (addBtn)   addBtn.addEventListener('click', khAddObject);
  if (resetBtn) resetBtn.addEventListener('click', khReset);

  var speedSlider = document.getElementById('khSpeedSlider');
  if (speedSlider) {
    speedSlider.addEventListener('input', function() {
      khState.speed = parseFloat(speedSlider.value);
      var lbl = document.getElementById('khSpeedVal');
      if (lbl) lbl.textContent = khState.speed.toFixed(2) + '×';
    });
  }

  var canvas = document.getElementById('khMainCanvas');
  if (canvas) canvas.addEventListener('click', khHandleCanvasClick);

  window.addEventListener('resize', khRerenderAll);
}