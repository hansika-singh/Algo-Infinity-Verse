document.addEventListener('DOMContentLoaded', function() {
  epInit();
});

var EP_SPEEDS = { 1:1400, 2:700, 3:320, 4:120, 5:30 };
var EP_SPEED_LABELS = { 1:'Slowest', 2:'Slow', 3:'Normal', 4:'Fast', 5:'Blazing' };

var EP_MODE_INFO = {
  push:     '<strong>Push:</strong> Each infected node picks K random alive neighbors and sends its state to them. Simple, low overhead. Converges in O(log n) rounds with high probability.',
  pull:     '<strong>Pull:</strong> Each susceptible node picks K random peers and asks if they have newer data. Slower early spread, but better at reaching the last few stragglers.',
  pushpull: '<strong>Push-Pull:</strong> Every exchange is bidirectional — infected pushes AND susceptible pulls simultaneously. Amazon Dynamo and CockroachDB use this. Converges in roughly half the rounds of pure Push for the last few nodes.',
};

var epState = {
  nodes         : [],
  round         : 0,
  mode          : 'push',
  fanout        : 3,
  failRate      : 0,
  speed         : 3,
  playing       : false,
  timer         : null,
  showEdges     : true,
  antiEntropy   : false,
  converged     : false,
  convergeRound : null,
  messagesSent  : 0,
  gossipEdges   : [],
  sirHistory    : [],
  draggingId    : null,
  dragOffX      : 0,
  dragOffY      : 0,
};

var EP_NODE_R = 18;

function epGenerateNodes() {
  var n      = parseInt(document.getElementById('epNodeCount').value) || 16;
  var wrap   = document.getElementById('epCanvasWrap');
  var canvas = document.getElementById('epCanvas');
  var W = wrap ? wrap.clientWidth  : 600;
  var H = wrap ? wrap.clientHeight : 440;
  canvas.width  = W;
  canvas.height = H;

  epState.nodes = [];
  epState.round         = 0;
  epState.converged     = false;
  epState.convergeRound = null;
  epState.messagesSent  = 0;
  epState.gossipEdges   = [];
  epState.sirHistory    = [];

  var padding = 50;
  for (var i = 0; i < n; i++) {
    epState.nodes.push({
      id     : i,
      x      : padding + Math.random() * (W - padding * 2),
      y      : padding + Math.random() * (H - padding * 2),
      state  : 'S',
      alive  : true,
      rounds : 0,
    });
  }

  epRender();
  epUpdateCounters();
  epUpdateStats();
  epSetStatus('Cluster generated. Click any node to infect it, then click Run Gossip.');
}

function epNodeAt(mx, my) {
  return epState.nodes.find(function(n) {
    var dx = n.x - mx; var dy = n.y - my;
    return Math.sqrt(dx * dx + dy * dy) <= EP_NODE_R + 4;
  }) || null;
}

function epHandleCanvasClick(e) {
  var canvas = document.getElementById('epCanvas');
  var rect   = canvas.getBoundingClientRect();
  var scaleX = canvas.width  / rect.width;
  var scaleY = canvas.height / rect.height;
  var mx = (e.clientX - rect.left) * scaleX;
  var my = (e.clientY - rect.top)  * scaleY;

  var node = epNodeAt(mx, my);
  if (!node) return;

  if (!node.alive) {
    node.alive = true;
    node.state = 'S';
    epSetStatus('Node ' + node.id + ' revived.');
  } else if (node.state === 'S') {
    node.state  = 'I';
    node.rounds = 0;
    epSetStatus('Node ' + node.id + ' infected! Click Run Gossip to spread.');
  } else if (node.state === 'I') {
    node.state = 'S';
    epSetStatus('Node ' + node.id + ' reset to susceptible.');
  } else if (node.state === 'R') {
    node.state = 'I';
    epSetStatus('Node ' + node.id + ' re-infected.');
  }

  epRender();
  epUpdateCounters();
}

function epHandleMouseDown(e) {
  var canvas = document.getElementById('epCanvas');
  var rect   = canvas.getBoundingClientRect();
  var scaleX = canvas.width  / rect.width;
  var scaleY = canvas.height / rect.height;
  var mx = (e.clientX - rect.left) * scaleX;
  var my = (e.clientY - rect.top)  * scaleY;
  var node = epNodeAt(mx, my);
  if (node) {
    epState.draggingId = node.id;
    epState.dragOffX   = mx - node.x;
    epState.dragOffY   = my - node.y;
  }
}

function epHandleMouseMove(e) {
  if (epState.draggingId === null) return;
  var canvas = document.getElementById('epCanvas');
  var rect   = canvas.getBoundingClientRect();
  var scaleX = canvas.width  / rect.width;
  var scaleY = canvas.height / rect.height;
  var mx = (e.clientX - rect.left) * scaleX;
  var my = (e.clientY - rect.top)  * scaleY;
  var node = epState.nodes.find(function(n) { return n.id === epState.draggingId; });
  if (node) {
    node.x = Math.max(EP_NODE_R, Math.min(canvas.width  - EP_NODE_R, mx - epState.dragOffX));
    node.y = Math.max(EP_NODE_R, Math.min(canvas.height - EP_NODE_R, my - epState.dragOffY));
    epRender();
  }
}

function epHandleMouseUp() { epState.draggingId = null; }

function epRender() {
  var canvas = document.getElementById('epCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (epState.showEdges && epState.gossipEdges.length > 0) {
    epState.gossipEdges.forEach(function(edge) {
      var from = epState.nodes[edge.from];
      var to   = epState.nodes[edge.to];
      if (!from || !to) return;

      ctx.strokeStyle = 'rgba(239,68,68,0.35)';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.setLineDash([]);

      var dx = to.x - from.x;
      var dy = to.y - from.y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux  = dx / len; var uy = dy / len;
      var ax  = to.x - ux * (EP_NODE_R + 6);
      var ay  = to.y - uy * (EP_NODE_R + 6);
      ctx.fillStyle = 'rgba(239,68,68,0.5)';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - ux * 8 - uy * 4, ay - uy * 8 + ux * 4);
      ctx.lineTo(ax - ux * 8 + uy * 4, ay - uy * 8 - ux * 4);
      ctx.fill();
    });
  }

  epState.nodes.forEach(function(node) {
    var fillColor, strokeColor, glowColor;

    if (!node.alive) {
      fillColor   = 'rgba(71,85,105,0.3)';
      strokeColor = '#475569';
      glowColor   = null;
    } else if (node.state === 'I') {
      fillColor   = 'rgba(239,68,68,0.35)';
      strokeColor = '#ef4444';
      glowColor   = 'rgba(239,68,68,0.25)';
    } else if (node.state === 'R') {
      fillColor   = 'rgba(34,197,94,0.3)';
      strokeColor = '#22c55e';
      glowColor   = null;
    } else {
      fillColor   = 'rgba(148,163,184,0.15)';
      strokeColor = '#94a3b8';
      glowColor   = null;
    }

    if (glowColor) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, EP_NODE_R + 6, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, EP_NODE_R, 0, Math.PI * 2);
    ctx.fillStyle   = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth   = node.state === 'I' ? 2.5 : 1.5;
    ctx.stroke();

    ctx.fillStyle    = node.alive ? strokeColor : '#475569';
    ctx.font         = 'bold 9px Fira Code,monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.id, node.x, node.y);

    if (!node.alive) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth   = 1.8;
      ctx.beginPath();
      ctx.moveTo(node.x - 7, node.y - 7);
      ctx.lineTo(node.x + 7, node.y + 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(node.x + 7, node.y - 7);
      ctx.lineTo(node.x - 7, node.y + 7);
      ctx.stroke();
    }
  });
}

function epAliveNeighbors(excludeId) {
  return epState.nodes.filter(function(n) { return n.alive && n.id !== excludeId; });
}

function epPickRandom(arr, k) {
  var shuffled = arr.slice().sort(function() { return Math.random() - 0.5; });
  return shuffled.slice(0, Math.min(k, shuffled.length));
}

function epRunRound() {
  var failRate = epState.failRate / 100;
  var fanout   = epState.fanout;
  var mode     = epState.mode;
  var newEdges = [];
  var anyInfected = false;

  epState.nodes.forEach(function(node) {
    if (!node.alive) return;
    if (Math.random() < failRate && node.state !== 'I') {
      node.alive = false;
      return;
    }

    if (node.state === 'I') {
      anyInfected = true;
      node.rounds++;

      if (mode === 'push' || mode === 'pushpull') {
        var targets = epPickRandom(epAliveNeighbors(node.id), fanout);
        targets.forEach(function(t) {
          epState.messagesSent++;
          newEdges.push({ from: node.id, to: t.id });
          if (t.state === 'S') { t.state = 'I'; t.rounds = 0; }
        });
      }

      if (node.rounds >= 2) node.state = 'R';
    }
  });

  if (mode === 'pull' || mode === 'pushpull') {
    epState.nodes.forEach(function(node) {
      if (!node.alive || node.state !== 'S') return;
      var peers = epPickRandom(epAliveNeighbors(node.id), fanout);
      peers.forEach(function(p) {
        epState.messagesSent++;
        if (p.state === 'I' || p.state === 'R') {
          newEdges.push({ from: p.id, to: node.id });
          if (node.state === 'S') { node.state = 'I'; node.rounds = 0; }
        }
      });
    });
  }

  epState.gossipEdges = newEdges;
  epState.round++;

  var counts = epCountSIR();
  epState.sirHistory.push({ s: counts.s, i: counts.i, r: counts.r });

  epLogRound(counts);
  epUpdateCounters();
  epUpdateStats();
  epDrawSirChart();
  epRender();

  var aliveCount = epState.nodes.filter(function(n) { return n.alive; }).length;

  if (!epState.converged && counts.i === 0 && counts.s === 0) {
    epState.converged     = true;
    epState.convergeRound = epState.round;
    epSetStatus('✅ Converged in ' + epState.round + ' rounds! All ' + counts.r + ' alive nodes have the new data.', 'converged');
    epAddLog('✅ Converged! Round ' + epState.round + '. Alive: ' + aliveCount + ', recovered: ' + counts.r, 'converged');
    epUpdateStats();

    if (epState.antiEntropy && epState.playing) {
      epRunAntiEntropy();
    }
    return true;
  }

  if (counts.i === 0 && counts.s > 0) {
    epSetStatus('⚠️ Gossip stalled — ' + counts.s + ' nodes unreachable (failures isolated them). Try lower failure rate.', 'partial');
    return true;
  }

  epSetStatus('Round ' + epState.round + ' — Infected: ' + counts.i + ', Recovered: ' + counts.r + ', Susceptible: ' + counts.s, 'spreading');
  return false;
}

function epRunAntiEntropy() {
  var rounds = 0;
  var maxAE  = 3;
  function aeRound() {
    if (rounds >= maxAE) return;
    rounds++;
    var edges = [];
    epState.nodes.forEach(function(node) {
      if (!node.alive) return;
      var peers = epPickRandom(epAliveNeighbors(node.id), 2);
      peers.forEach(function(p) {
        edges.push({ from: node.id, to: p.id });
        epState.messagesSent++;
      });
    });
    epState.gossipEdges = edges;
    epRender();
    epAddLog('Anti-entropy round ' + rounds + ' — syncing inconsistencies', 'antientropy');
    setTimeout(aeRound, 600);
  }
  setTimeout(aeRound, 400);
}

function epCountSIR() {
  var s = 0; var i = 0; var r = 0; var d = 0;
  epState.nodes.forEach(function(n) {
    if (!n.alive) { d++; return; }
    if (n.state === 'S') s++;
    else if (n.state === 'I') i++;
    else r++;
  });
  return { s: s, i: i, r: r, d: d };
}

function epUpdateCounters() {
  var c = epCountSIR();
  var sEl = document.getElementById('epCountS');
  var iEl = document.getElementById('epCountI');
  var rEl = document.getElementById('epCountR');
  var dEl = document.getElementById('epCountD');
  if (sEl) sEl.textContent = c.s;
  if (iEl) iEl.textContent = c.i;
  if (rEl) rEl.textContent = c.r;
  if (dEl) dEl.textContent = c.d;

  var rndEl = document.getElementById('epRound');
  if (rndEl) rndEl.textContent = epState.round;
}

function epUpdateStats() {
  var c     = epCountSIR();
  var alive = epState.nodes.filter(function(n) { return n.alive; }).length;
  var total = epState.nodes.length;
  var spread = alive > 0 ? Math.round((c.r / alive) * 100) + '%' : '—';

  var srEl  = document.getElementById('epStatRounds');
  var scEl  = document.getElementById('epStatConverge');
  var smEl  = document.getElementById('epStatMessages');
  var saEl  = document.getElementById('epStatAlive');
  var sspEl = document.getElementById('epStatSpread');

  if (srEl)  srEl.textContent  = epState.round;
  if (scEl)  scEl.textContent  = epState.convergeRound !== null ? 'Round ' + epState.convergeRound : '—';
  if (smEl)  smEl.textContent  = epState.messagesSent;
  if (saEl)  saEl.textContent  = alive + ' / ' + total;
  if (sspEl) sspEl.textContent = spread;
}

function epLogRound(counts) {
  epAddLog('Round ' + epState.round + ': S=' + counts.s + ' I=' + counts.i + ' R=' + counts.r + ' D=' + counts.d, '');
}

function epAddLog(msg, cls) {
  var log   = document.getElementById('epRoundLog');
  if (!log) return;
  var empty = log.querySelector('.ep-log-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'ep-log-entry ' + (cls || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 60) log.removeChild(log.lastChild);
}

function epDrawSirChart() {
  var canvas = document.getElementById('epSirCanvas');
  if (!canvas) return;
  canvas.width  = canvas.parentElement.clientWidth;
  canvas.height = 130;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var hist = epState.sirHistory;
  if (hist.length < 2) return;

  var W   = canvas.width;
  var H   = canvas.height;
  var pad = { top: 10, right: 10, bottom: 20, left: 32 };
  var plotW = W - pad.left - pad.right;
  var plotH = H - pad.top  - pad.bottom;

  var total = epState.nodes.length;

  function xPos(i)   { return pad.left + (i / (hist.length - 1)) * plotW; }
  function yPos(val) { return pad.top  + (1 - val / total) * plotH; }

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  [0, Math.floor(total / 2), total].forEach(function(v) {
    var y = yPos(v);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.fillStyle    = 'rgba(148,163,184,0.4)';
    ctx.font         = '8px Fira Code,monospace';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(v, pad.left - 4, y);
  });

  var curves = [
    { key: 's', color: '#94a3b8' },
    { key: 'r', color: '#22c55e' },
    { key: 'i', color: '#ef4444' },
  ];

  curves.forEach(function(curve) {
    ctx.strokeStyle = curve.color;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    hist.forEach(function(entry, i) {
      var x = xPos(i);
      var y = yPos(entry[curve.key]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  ctx.fillStyle    = 'rgba(148,163,184,0.4)';
  ctx.font         = '8px Fira Code,monospace';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('round', pad.left + plotW / 2, H - 12);
}

function epPlay() {
  if (!epState.playing) return;
  var done = epRunRound();
  if (done) {
    epState.playing = false;
    return;
  }
  epState.timer = setTimeout(epPlay, EP_SPEEDS[epState.speed] || 320);
}

function epRun() {
  if (epState.nodes.length === 0) epGenerateNodes();
  var infected = epState.nodes.filter(function(n) { return n.alive && n.state === 'I'; });
  if (infected.length === 0) {
    epSetStatus('Click any node to infect it first, then click Run Gossip.');
    return;
  }
  epState.playing = true;
  var stepBtn = document.getElementById('epStepBtn');
  if (stepBtn) stepBtn.disabled = false;
  epPlay();
}

function epStepRound() {
  if (epState.nodes.length === 0) return;
  var infected = epState.nodes.filter(function(n) { return n.alive && n.state === 'I'; });
  if (infected.length === 0) { epSetStatus('Infect a node first.'); return; }
  epRunRound();
}

function epReset() {
  epState.playing = false;
  if (epState.timer) { clearTimeout(epState.timer); epState.timer = null; }
  epGenerateNodes();
  var stepBtn = document.getElementById('epStepBtn');
  if (stepBtn) stepBtn.disabled = true;
  var log = document.getElementById('epRoundLog');
  if (log) log.innerHTML = '<div class="ep-log-empty">No rounds yet.</div>';
}

function epSetStatus(msg, cls) {
  var el = document.getElementById('epStatus');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'ep-status ' + (cls || '');
}

function epInit() {
  epGenerateNodes();

  var canvas = document.getElementById('epCanvas');
  if (canvas) {
    canvas.addEventListener('click',     epHandleCanvasClick);
    canvas.addEventListener('mousedown', epHandleMouseDown);
    document.addEventListener('mousemove', epHandleMouseMove);
    document.addEventListener('mouseup',   epHandleMouseUp);
  }

  var nodeCountSl = document.getElementById('epNodeCount');
  if (nodeCountSl) {
    nodeCountSl.addEventListener('input', function() {
      var lbl = document.getElementById('epNodeCountVal');
      if (lbl) lbl.textContent = nodeCountSl.value;
      epReset();
    });
  }

  var fanoutSl = document.getElementById('epFanout');
  if (fanoutSl) {
    fanoutSl.addEventListener('input', function() {
      epState.fanout = parseInt(fanoutSl.value);
      var lbl = document.getElementById('epFanoutVal');
      if (lbl) lbl.textContent = fanoutSl.value;
    });
  }

  var speedSl = document.getElementById('epSpeed');
  if (speedSl) {
    speedSl.addEventListener('input', function() {
      epState.speed = parseInt(speedSl.value);
      var lbl = document.getElementById('epSpeedVal');
      if (lbl) lbl.textContent = EP_SPEED_LABELS[epState.speed] || 'Normal';
    });
  }

  var failSl = document.getElementById('epFailRate');
  if (failSl) {
    failSl.addEventListener('input', function() {
      epState.failRate = parseInt(failSl.value);
      var lbl = document.getElementById('epFailRateVal');
      if (lbl) lbl.textContent = failSl.value + '%';
    });
  }

  document.querySelectorAll('.ep-mode-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.ep-mode-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      epState.mode = btn.getAttribute('data-mode');
      var info = document.getElementById('epModeInfo');
      if (info) info.innerHTML = EP_MODE_INFO[epState.mode] || '';
    });
  });

  var runBtn   = document.getElementById('epRunBtn');
  var stepBtn  = document.getElementById('epStepBtn');
  var resetBtn = document.getElementById('epResetBtn');
  if (runBtn)   runBtn.addEventListener('click', epRun);
  if (stepBtn)  stepBtn.addEventListener('click', epStepRound);
  if (resetBtn) resetBtn.addEventListener('click', epReset);

  var edgesChk = document.getElementById('epShowEdges');
  if (edgesChk) {
    edgesChk.addEventListener('change', function() {
      epState.showEdges = edgesChk.checked;
      epRender();
    });
  }

  var aeChk = document.getElementById('epAntiEntropy');
  if (aeChk) {
    aeChk.addEventListener('change', function() {
      epState.antiEntropy = aeChk.checked;
    });
  }

  window.addEventListener('resize', function() {
    var wrap   = document.getElementById('epCanvasWrap');
    var canvas = document.getElementById('epCanvas');
    if (!wrap || !canvas) return;
    var W = wrap.clientWidth;
    var H = wrap.clientHeight || 440;
    var scaleX = W / (canvas.width  || W);
    var scaleY = H / (canvas.height || H);
    epState.nodes.forEach(function(n) { n.x *= scaleX; n.y *= scaleY; });
    canvas.width  = W;
    canvas.height = H;
    epRender();
    epDrawSirChart();
  });
}