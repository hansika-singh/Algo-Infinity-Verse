document.addEventListener('DOMContentLoaded', function() {
  sgInit();
});

var sgState = {
  nodes       : [],   
  mvBits      : 4,
  tool        : 'search',
  searchPath  : [],   
  searchTarget: null,
  searchStart : null,
};


var SG_NODE_R = 18;

function sgGenerate() {
  var n = Math.max(4, Math.min(16, parseInt(document.getElementById('sgNodeCount').value) || 10));
  var mvBits = parseInt(document.getElementById('sgMvBits').value) || 4;
  sgState.mvBits = mvBits;

  var keys = [];
  if (n <= 9) {
    for (var i = 1; i <= n; i++) keys.push(i * 10);
  } else {
    var pool = [];
    for (var i = 10; i <= 99; i += 5) pool.push(i);
    pool.sort(function() { return Math.random() - 0.5; });
    keys = pool.slice(0, n).sort(function(a, b) { return a - b; });
  }

  sgState.nodes = keys.map(function(k) {
    var mv = '';
    for (var j = 0; j < mvBits; j++) mv += Math.round(Math.random());
    return { key: k, mv: mv, alive: true };
  });

  sgState.searchPath  = [];
  sgState.searchTarget = null;
  sgState.searchStart  = null;

  sgComputePositions();
  sgRender();
  sgUpdateMvTable();
  sgUpdateFaultStats();
  sgClearTrace();
  sgSetStatus('Skip graph generated with ' + n + ' nodes, ' + mvBits + '-bit membership vectors. Click any node to search from it.');
}

/* ─── Compute node positions in concentric rings ─── */
function sgComputePositions() {
  var wrap = document.getElementById('sgCanvasWrap');
  var W = Math.min(wrap ? wrap.clientWidth : 600, 700);
  var H = Math.max(440, W * 0.8);
  var cx = W / 2; var cy = H / 2;

  var aliveNodes = sgState.nodes.filter(function(n){ return n.alive; });

  // Level 0: all alive nodes in a ring
  var r0 = Math.min(cx, cy) - SG_NODE_R - 20;
  aliveNodes.forEach(function(node, i) {
    var angle = (2 * Math.PI * i / aliveNodes.length) - Math.PI / 2;
    node.x0 = cx + r0 * Math.cos(angle);
    node.y0 = cy + r0 * Math.sin(angle);
    node.x = node.x0;
    node.y = node.y0;
    node.levelRadius = r0;
  });

  // Dead nodes: place off to the side
  sgState.nodes.filter(function(n){ return !n.alive; }).forEach(function(node, i) {
    node.x = 30 + i * 30;
    node.y = 20;
    node.x0 = node.x; node.y0 = node.y;
  });

  sgState._canvasW = W;
  sgState._canvasH = H;
  sgState._cx = cx;
  sgState._cy = cy;
  sgState._r0 = r0;
}

/* ─── Get members at level k ─── */
function sgLevelMembers(level) {
  if (level === 0) return sgState.nodes.filter(function(n){ return n.alive; });
  var groups = {};
  sgState.nodes.forEach(function(n) {
    if (!n.alive) return;
    var prefix = n.mv.substring(0, level);
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(n);
  });
  return groups; // object: prefix -> [nodes]
}

/* ─── Search from startKey toward targetKey ─── */
function sgSearch(startKey, targetKey) {
  var path = [];
  var cur = sgState.nodes.find(function(n){ return n.key === startKey && n.alive; });
  if (!cur) return path;
  if (cur.key === targetKey) { path.push({ type: 'found', key: cur.key }); return path; }

  path.push({ type: 'start', key: cur.key });

  for (var level = sgState.mvBits; level >= 0; level--) {
    // Get members at this level sharing prefix with cur
    var members;
    if (level === 0) {
      members = sgState.nodes.filter(function(n){ return n.alive; }).sort(function(a,b){ return a.key-b.key; });
    } else {
      var prefix = cur.mv.substring(0, level);
      members = sgState.nodes.filter(function(n){
        return n.alive && n.mv.substring(0, level) === prefix;
      }).sort(function(a,b){ return a.key-b.key; });
    }
    if (members.length < 2) continue;
    var best = cur;
    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      if (m.key <= targetKey && m.key >= best.key) best = m;
    }

    if (best.key !== cur.key) {
      path.push({ type: 'move', fromKey: cur.key, toKey: best.key, level: level });
      cur = best;
    }

    if (cur.key === targetKey) { path.push({ type: 'found', key: cur.key }); return path; }
  }

  path.push({ type: 'notfound', key: targetKey });
  return path;
}

/* ─── Render ─── */
function sgRender() {
  var canvas = document.getElementById('sgCanvas');
  if (!canvas) return;
  var W = sgState._canvasW || 600;
  var H = sgState._canvasH || 480;
  canvas.width = W; canvas.height = H;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  var cx = sgState._cx;
  var cy = sgState._cy;
  var r0 = sgState._r0;


  var pathNodeKeys = {};
  var pathEdges = []; // {fromKey, toKey, level}
  sgState.searchPath.forEach(function(step) {
    if (step.type === 'move') { pathNodeKeys[step.fromKey] = true; pathNodeKeys[step.toKey] = true; pathEdges.push(step); }
    if (step.type === 'found' || step.type === 'start') pathNodeKeys[step.key] = true;
  });

  var aliveNodes = sgState.nodes.filter(function(n){ return n.alive; });


  for (var level = 1; level <= sgState.mvBits; level++) {
    var members = sgState.nodes.filter(function(n){
      return n.alive;
    });
    var ringR = r0 * (1 - level * (0.18 / sgState.mvBits));
    if (ringR < 40) break;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(' + [
      level === 1 ? '168,85,247' : level === 2 ? '34,197,94' : '245,158,11'
    ] + ',0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw level-0 ring connections (all alive nodes in sorted order)
  if (aliveNodes.length > 1) {
    for (var i = 0; i < aliveNodes.length; i++) {
      var a = aliveNodes[i]; var b = aliveNodes[(i+1) % aliveNodes.length];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = 'rgba(6,182,212,0.18)'; ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  // Draw higher-level connections per group
  for (var level = 1; level <= sgState.mvBits; level++) {
    var groupsObj = {};
    sgState.nodes.forEach(function(n) {
      if (!n.alive) return;
      var prefix = n.mv.substring(0, level);
      if (!groupsObj[prefix]) groupsObj[prefix] = [];
      groupsObj[prefix].push(n);
    });

    var levelColors = ['', 'rgba(168,85,247,0.3)', 'rgba(34,197,94,0.25)', 'rgba(245,158,11,0.2)', 'rgba(239,68,68,0.2)'];
    var color = levelColors[Math.min(level, levelColors.length-1)];

    Object.keys(groupsObj).forEach(function(prefix) {
      var group = groupsObj[prefix].sort(function(a,b){return a.key-b.key;});
      if (group.length < 2) return;
      for (var i = 0; i < group.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(group[i].x, group[i].y); ctx.lineTo(group[i+1].x, group[i+1].y);
        ctx.strokeStyle = color; ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  }

  // Draw search path edges (highlighted)
  pathEdges.forEach(function(edge) {
    var fromNode = sgState.nodes.find(function(n){ return n.key === edge.fromKey; });
    var toNode   = sgState.nodes.find(function(n){ return n.key === edge.toKey; });
    if (!fromNode || !toNode) return;

    ctx.beginPath();
    ctx.moveTo(fromNode.x, fromNode.y); ctx.lineTo(toNode.x, toNode.y);
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3;
    ctx.stroke();

    // Arrow head
    var dx = toNode.x - fromNode.x; var dy = toNode.y - fromNode.y;
    var len = Math.sqrt(dx*dx+dy*dy) || 1;
    var ux = dx/len; var uy = dy/len;
    var ax = toNode.x - ux*22; var ay = toNode.y - uy*22;
    ctx.beginPath();
    ctx.moveTo(ax - uy*6, ay + ux*6);
    ctx.lineTo(toNode.x - ux*SG_NODE_R, toNode.y - uy*SG_NODE_R);
    ctx.lineTo(ax + uy*6, ay - ux*6);
    ctx.fillStyle = '#f59e0b'; ctx.fill();
  });

  // Draw nodes
  sgState.nodes.forEach(function(node) {
    var isAlive  = node.alive;
    var isPath   = pathNodeKeys[node.key];
    var isStart  = sgState.searchStart === node.key;
    var isTarget = sgState.searchTarget === node.key;

    var fillColor, strokeColor, lineWidth;

    if (!isAlive) {
      fillColor = 'rgba(239,68,68,0.12)'; strokeColor = '#ef4444'; lineWidth = 1.5;
    } else if (isStart && isPath) {
      fillColor = 'rgba(6,182,212,0.4)'; strokeColor = '#06b6d4'; lineWidth = 3;
    } else if (isTarget && isPath) {
      fillColor = 'rgba(34,197,94,0.4)'; strokeColor = '#22c55e'; lineWidth = 3;
    } else if (isPath) {
      fillColor = 'rgba(245,158,11,0.35)'; strokeColor = '#f59e0b'; lineWidth = 2.5;
    } else {
      fillColor = 'rgba(6,182,212,0.15)'; strokeColor = '#06b6d4'; lineWidth = 1.5;
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, SG_NODE_R, 0, Math.PI*2);
    ctx.fillStyle = fillColor; ctx.fill();
    ctx.strokeStyle = strokeColor; ctx.lineWidth = lineWidth; ctx.stroke();

    // Key label
    ctx.fillStyle = !isAlive ? '#ef4444' : strokeColor;
    ctx.font = 'bold 10px Fira Code,monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(node.key, node.x, node.y);

    // Dead X
    if (!isAlive) {
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(node.x-7, node.y-7); ctx.lineTo(node.x+7, node.y+7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(node.x+7, node.y-7); ctx.lineTo(node.x-7, node.y+7); ctx.stroke();
    }

    // Level indicator (small text below)
    if (isAlive) {
      var maxLevel = 0;
      for (var lv = sgState.mvBits; lv >= 1; lv--) {
        var prefix = node.mv.substring(0, lv);
        var count = sgState.nodes.filter(function(n){ return n.alive && n.mv.substring(0,lv) === prefix; }).length;
        if (count >= 2) { maxLevel = lv; break; }
      }
      ctx.fillStyle = 'rgba(148,163,184,0.4)';
      ctx.font = '7px Poppins,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('L' + maxLevel, node.x, node.y + SG_NODE_R + 2);
    }
  });

  // Level ring labels
  for (var level = 1; level <= Math.min(sgState.mvBits, 3); level++) {
    var ringR2 = r0 * (1 - level * (0.18 / sgState.mvBits));
    if (ringR2 < 40) break;
    ctx.fillStyle = level === 1 ? 'rgba(168,85,247,0.5)' : level === 2 ? 'rgba(34,197,94,0.5)' : 'rgba(245,158,11,0.5)';
    ctx.font = '9px Poppins,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('L' + level, cx + ringR2 + 4, cy - 6);
  }
}

/* ─── Handle canvas click ─── */
function sgHandleCanvasClick(e) {
  var canvas = document.getElementById('sgCanvas');
  if (!canvas) return;
  var rect = canvas.getBoundingClientRect();
  var mx = e.clientX - rect.left;
  var my = e.clientY - rect.top;

  // Scale for devicePixelRatio / CSS sizing
  var scaleX = canvas.width / rect.width;
  var scaleY = canvas.height / rect.height;
  mx *= scaleX; my *= scaleY;

  // Find clicked node
  var clicked = null;
  sgState.nodes.forEach(function(node) {
    var dx = node.x - mx; var dy = node.y - my;
    if (Math.sqrt(dx*dx+dy*dy) <= SG_NODE_R + 4) clicked = node;
  });

  if (!clicked) return;

  if (sgState.tool === 'kill') {
    if (clicked.alive) {
      clicked.alive = false;
      sgComputePositions();
      sgRender();
      sgUpdateMvTable();
      sgUpdateFaultStats();
      sgSetStatus('Node ' + clicked.key + ' killed. Search paths using it will reroute or fail.', 'killed');
    }
    return;
  }

  if (sgState.tool === 'revive') {
    if (!clicked.alive) {
      clicked.alive = true;
      sgComputePositions();
      sgRender();
      sgUpdateMvTable();
      sgUpdateFaultStats();
      sgSetStatus('Node ' + clicked.key + ' revived.');
    }
    return;
  }

  // Search tool
  if (!clicked.alive) { sgSetStatus('Node ' + clicked.key + ' is dead — choose an alive node to start search.', 'notfound'); return; }

  var targetInput = document.getElementById('sgSearchTarget');
  var target = targetInput ? parseInt(targetInput.value) : null;
  if (!target || isNaN(target)) {
    sgSetStatus('Enter a target key in the "Search target" field, then click a node to start from.', '');
    return;
  }

  sgState.searchStart  = clicked.key;
  sgState.searchTarget = target;
  sgState.searchPath   = sgSearch(clicked.key, target);

  sgRender();
  sgRenderTrace();

  var lastStep = sgState.searchPath[sgState.searchPath.length - 1];
  if (lastStep && lastStep.type === 'found') {
    sgSetStatus('✅ Found key ' + target + '! Search started from node ' + clicked.key + ' — ' + sgState.searchPath.filter(function(s){return s.type==='move';}).length + ' hop(s).', 'found');
  } else {
    sgSetStatus('❌ Key ' + target + ' not found in graph. Started from node ' + clicked.key + '.', 'notfound');
  }
}

/* ─── Render search trace ─── */
function sgRenderTrace() {
  var log = document.getElementById('sgTraceLog');
  if (!log) return;
  log.innerHTML = sgState.searchPath.map(function(step) {
    if (step.type === 'start') return '<div class="sg-trace-entry start">Start at node ' + step.key + '</div>';
    if (step.type === 'move')  return '<div class="sg-trace-entry move">Hop: ' + step.fromKey + ' → ' + step.toKey + ' (level ' + step.level + ' ring)</div>';
    if (step.type === 'found') return '<div class="sg-trace-entry found">✅ Found key ' + step.key + '</div>';
    if (step.type === 'notfound') return '<div class="sg-trace-entry miss">❌ Key ' + step.key + ' not in graph</div>';
    return '';
  }).join('');
}

/* ─── Clear trace ─── */
function sgClearTrace() {
  var log = document.getElementById('sgTraceLog');
  if (log) log.innerHTML = '<div class="sg-trace-empty">No search yet. Click a node to start.</div>';
  sgState.searchPath  = [];
  sgState.searchStart = null;
  sgState.searchTarget = null;
}

/* ─── Update MV table ─── */
function sgUpdateMvTable() {
  var tbody = document.getElementById('sgMvBody');
  if (!tbody) return;
  tbody.innerHTML = sgState.nodes.map(function(node) {
    var maxLevel = 0;
    for (var lv = sgState.mvBits; lv >= 1; lv--) {
      if (!node.alive) break;
      var prefix = node.mv.substring(0, lv);
      var count = sgState.nodes.filter(function(n){ return n.alive && n.mv.substring(0,lv) === prefix; }).length;
      if (count >= 2) { maxLevel = lv; break; }
    }
    var isPath = sgState.searchPath.some(function(s){ return s.fromKey === node.key || s.toKey === node.key || s.key === node.key; });
    return '<tr class="' + (!node.alive ? 'sg-mv-dead' : isPath ? 'sg-mv-active' : '') + '">' +
      '<td>' + node.key + '</td>' +
      '<td>' + node.mv + '</td>' +
      '<td>0–' + (node.alive ? maxLevel : '—') + '</td>' +
      '<td>' + (node.alive ? '✅' : '💀') + '</td>' +
    '</tr>';
  }).join('');
}

/* ─── Update fault stats ─── */
function sgUpdateFaultStats() {
  var total = sgState.nodes.length;
  var dead  = sgState.nodes.filter(function(n){ return !n.alive; }).length;
  var alive = total - dead;

  var tEl = document.getElementById('sgTotal');
  var dEl = document.getElementById('sgDead');
  var rEl = document.getElementById('sgReachable');
  if (tEl) tEl.textContent = total;
  if (dEl) dEl.textContent = dead;
  if (rEl) rEl.textContent = alive + ' / ' + total + (dead > 0 ? ' (skip graph still functional from any alive node)' : '');
}

/* ─── Status ─── */
function sgSetStatus(msg, cls) {
  var el = document.getElementById('sgStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = 'sg-status ' + (cls || '');
}

/* ─── Init ─── */
function sgInit() {
  // Generate button
  var genBtn = document.getElementById('sgGenerateBtn');
  if (genBtn) genBtn.addEventListener('click', sgGenerate);

  // Tool buttons
  document.querySelectorAll('.sg-tool-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.sg-tool-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      sgState.tool = btn.getAttribute('data-tool');
      var searchRow = document.getElementById('sgSearchRow');
      if (searchRow) searchRow.style.display = sgState.tool === 'search' ? '' : 'none';
    });
  });

  // Canvas click
  var canvas = document.getElementById('sgCanvas');
  if (canvas) canvas.addEventListener('click', sgHandleCanvasClick);

  // Reset highlights
  var resetBtn = document.getElementById('sgResetSearchBtn');
  if (resetBtn) resetBtn.addEventListener('click', function() {
    sgClearTrace();
    sgRender();
    sgUpdateMvTable();
    sgSetStatus('Highlights cleared. Click any node to search from it.');
  });

  // Enter key on target input
  var targetInput = document.getElementById('sgSearchTarget');
  if (targetInput) targetInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sgSetStatus('Now click any alive node to start the search from it.');
  });

  // Resize
  window.addEventListener('resize', function() {
    sgComputePositions();
    sgRender();
  });

  // Initial generation
  sgGenerate();
}