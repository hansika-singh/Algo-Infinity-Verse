document.addEventListener('DOMContentLoaded', function() {
  blInit();
});

var blState = {
  numNodes: 7,
  nodes: [],
  coordinatorId: null,
  electionCount: 0,
  partitioned: false,
  partitionGroups: null,
  animating: false,
};

function blBuildNodes(n) {
  var nodes = [];
  var wrap = document.getElementById('blCanvasWrap');
  var W = wrap ? wrap.clientWidth : 600;
  var H = 400;
  var cx = W / 2; var cy = H / 2; var r = Math.min(W, H) / 2 - 50;

  for (var i = 0; i < n; i++) {
    var angle = (2 * Math.PI * i / n) - Math.PI / 2;
    nodes.push({ id: i + 1, alive: true, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  return nodes;
}

function blHighestAlive(nodes, excludeIds) {
  var alive = nodes.filter(function(n) { return n.alive && (!excludeIds || excludeIds.indexOf(n.id) === -1); });
  if (alive.length === 0) return null;
  return alive.reduce(function(a, b) { return a.id > b.id ? a : b; });
}

function blCanCommunicate(a, b) {
  if (!blState.partitioned || !blState.partitionGroups) return true;
  var groupA = blState.partitionGroups.find(function(g) { return g.indexOf(a) !== -1; });
  return groupA && groupA.indexOf(b) !== -1;
}

function blRunElection(initiatorId, log) {
  var initiator = blState.nodes.find(function(n) { return n.id === initiatorId; });
  if (!initiator || !initiator.alive) return null;

  log.push({ msg: 'Node ' + initiatorId + ' noticed the coordinator is unreachable — starting an election.', type: 'elect' });

  var higherAlive = blState.nodes.filter(function(n) {
    return n.alive && n.id > initiatorId && blCanCommunicate(initiatorId, n.id);
  });

  if (higherAlive.length === 0) {
    log.push({ msg: 'Node ' + initiatorId + ' found no higher alive node reachable — declares itself coordinator.', type: 'done' });
    return initiatorId;
  }

  log.push({ msg: 'Node ' + initiatorId + ' sends ELECTION to: ' + higherAlive.map(function(n) { return n.id; }).join(', ') + '.', type: 'elect' });

  higherAlive.forEach(function(n) {
    log.push({ msg: 'Node ' + n.id + ' responds "I\'m alive" — Node ' + initiatorId + ' stands down.', type: '' });
  });

  var winner = null;
  var candidates = [initiatorId].concat(higherAlive.map(function(n) { return n.id; }));
  candidates.forEach(function(cid) {
    var subResult = blRunElectionFrom(cid, log, candidates);
    if (subResult !== null && (winner === null || subResult > winner)) winner = subResult;
  });

  return winner;
}

function blRunElectionFrom(id, log, alreadyProcessed) {
  var higherAlive = blState.nodes.filter(function(n) {
    return n.alive && n.id > id && blCanCommunicate(id, n.id);
  });
  if (higherAlive.length === 0) return id;
  return blHighestAlive(blState.nodes.filter(function(n) { return blCanCommunicate(id, n.id); })).id;
}

function blSimpleElection(triggeringNodeIds, log) {
  var reachableGroups = blState.partitioned && blState.partitionGroups
    ? blState.partitionGroups
    : [blState.nodes.filter(function(n) { return n.alive; }).map(function(n) { return n.id; })];

  var results = {};

  triggeringNodeIds.forEach(function(startId) {
    var startNode = blState.nodes.find(function(n) { return n.id === startId; });
    if (!startNode || !startNode.alive) return;

    var group = reachableGroups.find(function(g) { return g.indexOf(startId) !== -1; });
    if (!group) return;

    if (results[group.join(',')]) return;

    log.push({ msg: 'Node ' + startId + ' detects coordinator failure — initiating election within its reachable group.', type: 'elect' });

    var aliveInGroup = group.filter(function(id) {
      var n = blState.nodes.find(function(nn) { return nn.id === id; });
      return n && n.alive;
    });

    var highest = Math.max.apply(null, aliveInGroup);

    aliveInGroup.filter(function(id) { return id !== highest; }).forEach(function(id) {
      if (id < highest) log.push({ msg: 'Node ' + id + ' receives ELECTION from a higher node or discovers a higher alive node (' + highest + ') — steps back.', type: '' });
    });

    log.push({ msg: 'Node ' + highest + ' is the highest alive ID in its reachable group — declares itself coordinator.', type: 'done' });
    log.push({ msg: 'Node ' + highest + ' broadcasts COORDINATOR to all reachable nodes: ' + aliveInGroup.filter(function(id) { return id !== highest; }).join(', ') + '.', type: 'done' });

    results[group.join(',')] = highest;
  });

  return results;
}

function blTriggerElectionIfNeeded() {
  var coord = blState.nodes.find(function(n) { return n.id === blState.coordinatorId; });
  var coordAlive = coord && coord.alive;

  var log = [];

  if (blState.partitioned && blState.partitionGroups) {
    var triggerIds = blState.partitionGroups.map(function(g) {
      var aliveInGroup = g.filter(function(id) { var n = blState.nodes.find(function(nn) { return nn.id === id; }); return n && n.alive; });
      return aliveInGroup.length > 0 ? aliveInGroup[0] : null;
    }).filter(function(x) { return x !== null; });

    var results = blSimpleElection(triggerIds, log);
    var winners = Object.values(results);

    if (winners.length > 1) {
      log.push({ msg: 'Network is partitioned — each side elected independently: ' + winners.join(' and ') + '. This is a split-brain until the partition heals.', type: 'elect' });
      blState.coordinatorId = winners[0];
    } else if (winners.length === 1) {
      blState.coordinatorId = winners[0];
    }

    blState.electionCount++;
    return log;
  }

  if (!coordAlive) {
    var aliveNodes = blState.nodes.filter(function(n) { return n.alive; });
    if (aliveNodes.length === 0) { blState.coordinatorId = null; return log; }

    var detector = aliveNodes[Math.floor(Math.random() * aliveNodes.length)];
    var results2 = blSimpleElection([detector.id], log);
    var winner = Object.values(results2)[0];

    blState.coordinatorId = winner;
    blState.electionCount++;
  }

  return log;
}

function blRenderCluster() {
  var canvas = document.getElementById('blCanvas');
  if (!canvas) return;
  var wrap = document.getElementById('blCanvasWrap');
  canvas.width = wrap.clientWidth;
  canvas.height = 400;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (blState.partitioned && blState.partitionGroups) {
    var midX = canvas.width / 2;
    ctx.strokeStyle = 'rgba(239,68,68,0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(midX, 10); ctx.lineTo(midX, canvas.height - 10); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(239,68,68,0.6)'; ctx.font = '10px Fira Code,monospace'; ctx.textAlign = 'center';
    ctx.fillText('NETWORK PARTITION', midX, 20);
  }

  blState.nodes.forEach(function(node) {
    var isCoord = node.id === blState.coordinatorId && node.alive;
    var fillColor, strokeColor;

    if (!node.alive) { fillColor = 'rgba(239,68,68,0.12)'; strokeColor = '#ef4444'; }
    else if (isCoord) { fillColor = 'rgba(34,197,94,0.3)'; strokeColor = '#22c55e'; }
    else { fillColor = 'rgba(6,182,212,0.18)'; strokeColor = '#06b6d4'; }

    ctx.beginPath();
    ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = fillColor; ctx.fill();
    ctx.strokeStyle = strokeColor; ctx.lineWidth = isCoord ? 3 : 1.8;
    ctx.stroke();

    ctx.fillStyle = strokeColor;
    ctx.font = 'bold 13px Fira Code, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(node.id, node.x, node.y);

    if (isCoord) {
      ctx.font = '9px Poppins,sans-serif'; ctx.fillStyle = '#22c55e';
      ctx.fillText('👑', node.x, node.y - 32);
    }

    if (!node.alive) {
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(node.x - 10, node.y - 10); ctx.lineTo(node.x + 10, node.y + 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(node.x + 10, node.y - 10); ctx.lineTo(node.x - 10, node.y + 10); ctx.stroke();
    }
  });
}

function blAddLog(msg, cls) {
  var log = document.getElementById('blLog');
  if (!log) return;
  var empty = log.querySelector('.bl-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'bl-log-entry ' + (cls || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 80) log.removeChild(log.lastChild);
}

function blSetStatus(msg, cls) {
  var el = document.getElementById('blStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'bl-status ' + (cls || '');
}

function blUpdateStats() {
  var coordEl = document.getElementById('blCoordinator');
  var aliveEl = document.getElementById('blAliveCount');
  var electionEl = document.getElementById('blElectionCount');

  if (coordEl) coordEl.textContent = blState.coordinatorId !== null ? 'Node ' + blState.coordinatorId : 'None (all dead)';
  if (aliveEl) aliveEl.textContent = blState.nodes.filter(function(n) { return n.alive; }).length + ' / ' + blState.nodes.length;
  if (electionEl) electionEl.textContent = blState.electionCount;
}

function blHandleCanvasClick(e) {
  if (blState.animating) return;
  var canvas = document.getElementById('blCanvas');
  var rect = canvas.getBoundingClientRect();
  var scaleX = canvas.width / rect.width;
  var scaleY = canvas.height / rect.height;
  var mx = (e.clientX - rect.left) * scaleX;
  var my = (e.clientY - rect.top) * scaleY;

  var clicked = blState.nodes.find(function(n) {
    var d = Math.sqrt((n.x - mx) * (n.x - mx) + (n.y - my) * (n.y - my));
    return d <= 26;
  });

  if (!clicked) return;

  if (clicked.alive) {
    clicked.alive = false;
    blAddLog('Node ' + clicked.id + ' killed.' + (clicked.id === blState.coordinatorId ? ' It was the coordinator!' : ''), 'kill');
    blRenderCluster();
    blUpdateStats();

    if (clicked.id === blState.coordinatorId) {
      blSetStatus('Coordinator (Node ' + clicked.id + ') died. Surviving nodes will detect this via timeout and elect a new leader.', 'elect');
      blState.animating = true;
      setTimeout(function() {
        var log = blTriggerElectionIfNeeded();
        log.forEach(function(entry) { blAddLog(entry.msg, entry.type); });
        blRenderCluster();
        blUpdateStats();
        blSetStatus('New coordinator elected: Node ' + blState.coordinatorId + '.', 'good');
        blState.animating = false;
      }, 700);
    } else {
      blSetStatus('Node ' + clicked.id + ' killed. Coordinator unaffected.', '');
    }
  } else {
    clicked.alive = true;
    blAddLog('Node ' + clicked.id + ' revived.', '');
    blRenderCluster();
    blUpdateStats();
    blSetStatus('Node ' + clicked.id + ' revived. It will defer to the current coordinator unless it has a higher ID and an election triggers again.', '');
  }
}

function blPartitionHandler() {
  if (blState.partitioned) return;
  var aliveIds = blState.nodes.filter(function(n) { return n.alive; }).map(function(n) { return n.id; });
  var mid = Math.ceil(aliveIds.length / 2);

  blState.partitioned = true;
  blState.partitionGroups = [aliveIds.slice(0, mid), aliveIds.slice(mid)];

  blAddLog('Network partitioned into two groups: {' + blState.partitionGroups[0].join(',') + '} and {' + blState.partitionGroups[1].join(',') + '}. They cannot communicate.', 'elect');

  var log = [];
  var results = blSimpleElection(blState.partitionGroups.map(function(g) { return g[0]; }), log);
  log.forEach(function(entry) { blAddLog(entry.msg, entry.type); });

  var winners = Object.values(results);
  blAddLog('Each partition elected its own leader independently: ' + winners.join(' and ') + '. This is split-brain — heal the partition to resolve it.', 'elect');

  blRenderCluster();
  blUpdateStats();
  blSetStatus('Network partitioned. Each side elected its own leader (split-brain). Click Heal Partition to resolve.', 'elect');

  var healBtn = document.getElementById('blHealBtn');
  if (healBtn) healBtn.disabled = false;
  var partitionBtn = document.getElementById('blPartitionBtn');
  if (partitionBtn) partitionBtn.disabled = true;
}

function blHealHandler() {
  if (!blState.partitioned) return;
  blState.partitioned = false;
  blState.partitionGroups = null;

  blAddLog('Partition healed — both groups can communicate again. Re-running election to resolve split-brain.', 'elect');

  var log = [];
  var aliveNodes = blState.nodes.filter(function(n) { return n.alive; });
  if (aliveNodes.length > 0) {
    var detector = aliveNodes[0];
    var results = blSimpleElection([detector.id], log);
    log.forEach(function(entry) { blAddLog(entry.msg, entry.type); });
    blState.coordinatorId = Object.values(results)[0];
    blState.electionCount++;
  }

  blRenderCluster();
  blUpdateStats();
  blSetStatus('Partition healed. Single coordinator resolved: Node ' + blState.coordinatorId + '.', 'good');

  var healBtn = document.getElementById('blHealBtn');
  if (healBtn) healBtn.disabled = true;
  var partitionBtn = document.getElementById('blPartitionBtn');
  if (partitionBtn) partitionBtn.disabled = false;
}

function blReset() {
  blState.nodes = blBuildNodes(blState.numNodes);
  blState.coordinatorId = blHighestAlive(blState.nodes).id;
  blState.electionCount = 0;
  blState.partitioned = false;
  blState.partitionGroups = null;
  blState.animating = false;

  var log = document.getElementById('blLog');
  if (log) log.innerHTML = '<div class="bl-empty">No elections yet.</div>';

  var healBtn = document.getElementById('blHealBtn');
  if (healBtn) healBtn.disabled = true;
  var partitionBtn = document.getElementById('blPartitionBtn');
  if (partitionBtn) partitionBtn.disabled = false;

  blRenderCluster();
  blUpdateStats();
  blSetStatus('Reset with ' + blState.numNodes + ' nodes. Node ' + blState.coordinatorId + ' (highest ID) is the initial coordinator.', '');
}

function blInit() {
  blReset();

  document.querySelectorAll('.bl-node-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.bl-node-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      blState.numNodes = parseInt(btn.getAttribute('data-n'));
      blReset();
    });
  });

  var canvas = document.getElementById('blCanvas');
  if (canvas) canvas.addEventListener('click', blHandleCanvasClick);

  var resetBtn = document.getElementById('blResetBtn');
  if (resetBtn) resetBtn.addEventListener('click', blReset);

  var partitionBtn = document.getElementById('blPartitionBtn');
  var healBtn = document.getElementById('blHealBtn');
  if (partitionBtn) partitionBtn.addEventListener('click', blPartitionHandler);
  if (healBtn) healBtn.addEventListener('click', blHealHandler);

  window.addEventListener('resize', function() { blRenderCluster(); });
}