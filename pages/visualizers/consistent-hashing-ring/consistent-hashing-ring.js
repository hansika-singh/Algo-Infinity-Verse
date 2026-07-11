document.addEventListener('DOMContentLoaded', function() {
  chInit();
});

var CH_KEYSPACE = 65536;
var CH_KEY_COUNT = 400;
var CH_SERVER_COLORS = ['#06b6d4','#a855f7','#22c55e','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316'];

var chState = {
  numServers  : 3,
  V           : 12,
  servers     : [],
  virtualNodes: [],
  keys        : [],
  nextServerId: 0,
};

function chHash(str) {
  var h = 5381;
  for (var i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h % CH_KEYSPACE;
}

function chBuildServers(n) {
  chState.servers = [];
  for (var i = 0; i < n; i++) {
    chState.servers.push({ id: chState.nextServerId++, color: CH_SERVER_COLORS[i % CH_SERVER_COLORS.length] });
  }
}

function chBuildVirtualNodes() {
  chState.virtualNodes = [];
  chState.servers.forEach(function(server) {
    for (var v = 0; v < chState.V; v++) {
      var pos = chHash(server.id + '-vn-' + v);
      chState.virtualNodes.push({ pos: pos, serverId: server.id });
    }
  });
  chState.virtualNodes.sort(function(a, b) { return a.pos - b.pos; });
}

function chBuildKeys() {
  chState.keys = [];
  for (var i = 0; i < CH_KEY_COUNT; i++) {
    var name = 'key' + i;
    chState.keys.push({ name: name, pos: chHash(name) });
  }
}

function chOwnerOf(pos) {
  var vns = chState.virtualNodes;
  if (vns.length === 0) return null;
  for (var i = 0; i < vns.length; i++) {
    if (vns[i].pos >= pos) return vns[i].serverId;
  }
  return vns[0].serverId;
}

function chAssignAllKeys() {
  chState.keys.forEach(function(key) { key.owner = chOwnerOf(key.pos); });
}

function chLoadCounts() {
  var counts = {};
  chState.servers.forEach(function(s) { counts[s.id] = 0; });
  chState.keys.forEach(function(key) { counts[key.owner] = (counts[key.owner] || 0) + 1; });
  return counts;
}

function chDrawRing() {
  var canvas = document.getElementById('chRingCanvas');
  if (!canvas) return;
  var wrap = document.getElementById('chRingWrap');
  var size = Math.min(wrap.clientWidth, wrap.clientHeight || 460, 480);
  canvas.width = size; canvas.height = size;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  var cx = size / 2; var cy = size / 2;
  var outerR = size * 0.42;
  var innerR = size * 0.34;

  var vns = chState.virtualNodes;
  var serverColor = {};
  chState.servers.forEach(function(s) { serverColor[s.id] = s.color; });

  for (var i = 0; i < vns.length; i++) {
    var startPos = i === 0 ? 0 : vns[i - 1].pos;
    var endPos = vns[i].pos;
    var startAngle = (startPos / CH_KEYSPACE) * Math.PI * 2 - Math.PI / 2;
    var endAngle = (endPos / CH_KEYSPACE) * Math.PI * 2 - Math.PI / 2;

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, endAngle);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = serverColor[vns[i].serverId] + '33';
    ctx.fill();
  }

  vns.forEach(function(vn) {
    var angle = (vn.pos / CH_KEYSPACE) * Math.PI * 2 - Math.PI / 2;
    var x1 = cx + Math.cos(angle) * innerR;
    var y1 = cy + Math.sin(angle) * innerR;
    var x2 = cx + Math.cos(angle) * outerR;
    var y2 = cy + Math.sin(angle) * outerR;
    ctx.strokeStyle = serverColor[vn.serverId];
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

    var dotX = cx + Math.cos(angle) * outerR;
    var dotY = cy + Math.sin(angle) * outerR;
    ctx.beginPath(); ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = serverColor[vn.serverId];
    ctx.fill();
  });

  chState.keys.forEach(function(key) {
    var angle = (key.pos / CH_KEYSPACE) * Math.PI * 2 - Math.PI / 2;
    var r = innerR * 0.72;
    var x = cx + Math.cos(angle) * r;
    var y = cy + Math.sin(angle) * r;
    ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI * 2);
    ctx.fillStyle = serverColor[key.owner] || 'rgba(148,163,184,0.4)';
    ctx.fill();
  });

  ctx.beginPath();
  ctx.arc(cx, cy, innerR * 0.5, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (chState.highlightKey) {
    var hk = chState.highlightKey;
    var angle = (hk.pos / CH_KEYSPACE) * Math.PI * 2 - Math.PI / 2;
    var r = innerR * 0.72;
    var x = cx + Math.cos(angle) * r;
    var y = cy + Math.sin(angle) * r;
    ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.stroke();

    var ownerVn = null;
    for (var i = 0; i < vns.length; i++) { if (vns[i].pos >= hk.pos) { ownerVn = vns[i]; break; } }
    if (!ownerVn) ownerVn = vns[0];
    var ownerAngle = (ownerVn.pos / CH_KEYSPACE) * Math.PI * 2 - Math.PI / 2;
    var ox = cx + Math.cos(ownerAngle) * outerR;
    var oy = cy + Math.sin(ownerAngle) * outerR;
    ctx.beginPath(); ctx.arc(ox, oy, 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.setLineDash([3, 2]);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ox, oy); ctx.stroke();
    ctx.setLineDash([]);
  }
}

function chRenderLegend() {
  var el = document.getElementById('chRingLegend');
  if (!el) return;
  el.innerHTML = chState.servers.map(function(s) {
    return '<span class="ch-legend-item" style="display:flex;align-items:center;gap:0.25rem;font-size:0.66rem;color:var(--text-secondary)">' +
      '<span style="width:9px;height:9px;border-radius:50%;background:' + s.color + ';flex-shrink:0"></span>S' + s.id + '</span>';
  }).join('');
}

function chRenderLoadBars() {
  var counts = chLoadCounts();
  var el = document.getElementById('chLoadBars');
  if (!el) return;

  var total = chState.keys.length;
  var maxCount = Math.max.apply(null, Object.values(counts).concat([1]));

  el.innerHTML = chState.servers.map(function(s) {
    var count = counts[s.id] || 0;
    var pct = total > 0 ? Math.round((count / total) * 100) : 0;
    var widthPct = Math.round((count / maxCount) * 100);
    return '<div class="ch-load-item">' +
      '<div class="ch-load-label"><span>S' + s.id + '</span><span>' + count + ' keys (' + pct + '%)</span></div>' +
      '<div class="ch-load-track"><div class="ch-load-fill" style="width:' + widthPct + '%;background:' + s.color + '"></div></div>' +
    '</div>';
  }).join('');
}

function chRenderStats() {
  var counts = chLoadCounts();
  var values = Object.values(counts);
  var n = values.length;
  var mean = values.reduce(function(a, b) { return a + b; }, 0) / n;
  var variance = values.reduce(function(a, b) { return a + Math.pow(b - mean, 2); }, 0) / n;
  var stdDev = Math.sqrt(variance);

  var stdEl   = document.getElementById('chStdDev');
  var maxEl   = document.getElementById('chMaxLoad');
  var minEl   = document.getElementById('chMinLoad');
  var idealEl = document.getElementById('chIdealLoad');

  if (stdEl)   stdEl.textContent   = stdDev.toFixed(1) + ' keys';
  if (maxEl)   maxEl.textContent   = Math.max.apply(null, values) + ' keys';
  if (minEl)   minEl.textContent   = Math.min.apply(null, values) + ' keys';
  if (idealEl) idealEl.textContent = Math.round(mean) + ' keys';
}

function chAddLog(msg, cls) {
  var log = document.getElementById('chMigrationLog');
  if (!log) return;
  var empty = log.querySelector('.ch-log-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'ch-log-entry ' + (cls || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 50) log.removeChild(log.lastChild);
}

function chSetStatus(msg, cls) {
  var el = document.getElementById('chStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = 'ch-status ' + (cls || '');
}

function chRerenderAll() {
  chDrawRing();
  chRenderLegend();
  chRenderLoadBars();
  chRenderStats();
}

function chRebuild(numServers) {
  chState.numServers = numServers;
  chState.nextServerId = 0;
  chBuildServers(numServers);
  chBuildVirtualNodes();
  chBuildKeys();
  chAssignAllKeys();
  chState.highlightKey = null;
  chRerenderAll();
  var log = document.getElementById('chMigrationLog');
  if (log) log.innerHTML = '<div class="ch-log-empty">No changes yet.</div>';
}

function chAddServer() {
  var oldOwners = {};
  chState.keys.forEach(function(k) { oldOwners[k.name] = k.owner; });

  var newColor = CH_SERVER_COLORS[chState.servers.length % CH_SERVER_COLORS.length];
  var newServer = { id: chState.nextServerId++, color: newColor };
  chState.servers.push(newServer);

  for (var v = 0; v < chState.V; v++) {
    var pos = chHash(newServer.id + '-vn-' + v);
    chState.virtualNodes.push({ pos: pos, serverId: newServer.id });
  }
  chState.virtualNodes.sort(function(a, b) { return a.pos - b.pos; });

  chAssignAllKeys();

  var migrated = 0;
  chState.keys.forEach(function(k) { if (oldOwners[k.name] !== k.owner) migrated++; });

  chRerenderAll();
  chAddLog('Added S' + newServer.id + ' (' + chState.V + ' virtual nodes) — ' + migrated + ' / ' + chState.keys.length + ' keys migrated (' + Math.round(migrated / chState.keys.length * 100) + '%)', 'add');
  chSetStatus('Server S' + newServer.id + ' added. Only ' + migrated + ' keys (' + Math.round(migrated / chState.keys.length * 100) + '%) moved — everyone else untouched.', 'good');
}

function chRemoveServer() {
  if (chState.servers.length <= 1) { chSetStatus('Cannot remove the last server.', 'bad'); return; }

  var oldOwners = {};
  chState.keys.forEach(function(k) { oldOwners[k.name] = k.owner; });

  var removed = chState.servers.pop();
  chState.virtualNodes = chState.virtualNodes.filter(function(vn) { return vn.serverId !== removed.id; });

  chAssignAllKeys();

  var migrated = 0;
  chState.keys.forEach(function(k) { if (oldOwners[k.name] !== k.owner) migrated++; });

  chRerenderAll();
  chAddLog('Removed S' + removed.id + ' — ' + migrated + ' / ' + chState.keys.length + ' keys migrated to clockwise neighbors (' + Math.round(migrated / chState.keys.length * 100) + '%)', 'remove');
  chSetStatus('Server S' + removed.id + ' removed. Its ' + migrated + ' keys redistributed to clockwise neighbors only.', 'bad');
}

function chLocateKey() {
  var input = document.getElementById('chKeyInput');
  var key = input ? input.value.trim() : '';
  if (!key) { chSetStatus('Enter a key name first.', ''); return; }

  var pos = chHash(key);
  var owner = chOwnerOf(pos);
  chState.highlightKey = { name: key, pos: pos };

  chDrawRing();
  chSetStatus('Key "' + key + '" hashes to position ' + pos + ' → owned by server S' + owner + '.', 'hash');
}

function chSetV(v) {
  chState.V = v;
  var oldOwners = {};
  chState.keys.forEach(function(k) { oldOwners[k.name] = k.owner; });

  chBuildVirtualNodes();
  chAssignAllKeys();

  var migrated = 0;
  chState.keys.forEach(function(k) { if (oldOwners[k.name] !== k.owner) migrated++; });

  chRerenderAll();
  chAddLog('V changed to ' + v + ' — virtual nodes re-randomized, ' + migrated + ' keys reshuffled', '');
}

function chInit() {
  chRebuild(3);

  document.querySelectorAll('.ch-server-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.ch-server-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      chRebuild(parseInt(btn.getAttribute('data-servers')));
      chSetStatus(btn.getAttribute('data-servers') + ' servers, V=' + chState.V + ' virtual nodes each.', '');
    });
  });

  var vSlider = document.getElementById('chVSlider');
  if (vSlider) {
    vSlider.addEventListener('input', function() {
      var v = parseInt(vSlider.value);
      var lbl = document.getElementById('chVVal');
      if (lbl) lbl.textContent = v;
      chSetV(v);
    });
  }

  var addBtn    = document.getElementById('chAddServerBtn');
  var removeBtn = document.getElementById('chRemoveServerBtn');
  var resetBtn  = document.getElementById('chResetBtn');
  if (addBtn)    addBtn.addEventListener('click', chAddServer);
  if (removeBtn) removeBtn.addEventListener('click', chRemoveServer);
  if (resetBtn)  resetBtn.addEventListener('click', function() {
    document.querySelectorAll('.ch-server-btn').forEach(function(b) { b.classList.toggle('active', b.getAttribute('data-servers') === '3'); });
    var vSl = document.getElementById('chVSlider');
    if (vSl) vSl.value = 12;
    var lbl = document.getElementById('chVVal');
    if (lbl) lbl.textContent = 12;
    chState.V = 12;
    chRebuild(3);
    chSetStatus('Reset to 3 servers, V=12.', '');
  });

  var hashBtn  = document.getElementById('chHashBtn');
  var keyInput = document.getElementById('chKeyInput');
  if (hashBtn)  hashBtn.addEventListener('click', chLocateKey);
  if (keyInput) keyInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') chLocateKey(); });

  var teachV1  = document.getElementById('chTeachV1');
  var teachV50 = document.getElementById('chTeachV50');
  if (teachV1) teachV1.addEventListener('click', function() {
    var vSl = document.getElementById('chVSlider');
    if (vSl) vSl.value = 1;
    var lbl = document.getElementById('chVVal');
    if (lbl) lbl.textContent = 1;
    chSetV(1);
    chSetStatus('V set to 1. Now click Add Server and watch the load balance chart.', '');
  });
  if (teachV50) teachV50.addEventListener('click', function() {
    var vSl = document.getElementById('chVSlider');
    if (vSl) vSl.value = 50;
    var lbl = document.getElementById('chVVal');
    if (lbl) lbl.textContent = 50;
    chSetV(50);
    chSetStatus('V set to 50. Now click Add Server and watch load stay balanced.', '');
  });

  window.addEventListener('resize', chDrawRing);
}