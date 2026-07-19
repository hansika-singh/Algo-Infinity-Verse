document.addEventListener('DOMContentLoaded', function () {
  qrvInit();
});

/* ── Global state ── */
var qrvN = 3;
var qrvW = 2;
var qrvR = 2;

/* Each replica: { id, value, version, x, y } */
var qrvReplicas = [];
var qrvOpInFlight = false;
var qrvLogCount  = 0;

var QRV_RING_RADIUS_RATIO = 0.36;
var QRV_NODE_R            = 30;

/* ════════════════════════════════════════════
   REPLICA INITIALISATION
════════════════════════════════════════════ */

function qrvBuildReplicas() {
  qrvReplicas = [];
  for (var i = 0; i < qrvN; i++) {
    qrvReplicas.push({
      id:      i,
      label:   'R' + (i + 1),
      value:   null,
      version: 0
    });
  }
}

/* ════════════════════════════════════════════
   GEOMETRY — place nodes on a circle
════════════════════════════════════════════ */

function qrvNodePos(idx, n, cx, cy, r) {
  var angle = (2 * Math.PI * idx / n) - Math.PI / 2;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle)
  };
}

/* ════════════════════════════════════════════
   RENDER — SVG ring + node cards
════════════════════════════════════════════ */

function qrvRender(highlights) {
  highlights = highlights || {};
  var wrap = document.getElementById('qrvRingWrap');
  if (!wrap) return;

  var W = wrap.offsetWidth  || 360;
  var H = wrap.offsetHeight || 360;
  var cx = W / 2;
  var cy = H / 2;
  var R  = Math.min(W, H) * QRV_RING_RADIUS_RATIO;

  /* SVG: ring circle + lines */
  var svg = document.getElementById('qrvRingSvg');
  if (svg) {
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    var svgHtml = '';

    /* Faint ring */
    svgHtml += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" stroke-dasharray="4 4" />';

    /* Centre coordinator */
    svgHtml += '<circle cx="' + cx + '" cy="' + cy + '" r="14" fill="rgba(124,58,237,0.15)" stroke="#7c3aed" stroke-width="1.5" />';
    svgHtml += '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" font-size="9" font-family="Fira Code,monospace" fill="#a78bfa" font-weight="700">COORD</text>';

    /* Lines from coordinator to each replica, with animation */
    for (var i = 0; i < qrvN; i++) {
      var pos   = qrvNodePos(i, qrvN, cx, cy, R);
      var hl    = highlights[i] || '';
      var stroke = hl === 'write' ? '#06b6d4' : (hl === 'read' ? '#10b981' : 'rgba(255,255,255,0.07)');
      var dashed = hl ? '' : '4 4';
      var cls   = hl ? (' qrv-msg-line ' + hl + '-line active') : '';
      svgHtml += '<line x1="' + cx + '" y1="' + cy + '" x2="' + pos.x + '" y2="' + pos.y + '" stroke="' + stroke + '" stroke-width="' + (hl ? 2 : 1) + '" stroke-dasharray="' + (hl ? '6 4' : '4 4') + '" class="' + cls + '" />';
    }

    svg.innerHTML = svgHtml;
  }

  /* Node overlay cards */
  var overlay = document.getElementById('qrvNodesOverlay');
  if (!overlay) return;
  overlay.innerHTML = '';

  for (var j = 0; j < qrvN; j++) {
    var rep  = qrvReplicas[j];
    var pos2 = qrvNodePos(j, qrvN, cx, cy, R);
    var hl2  = highlights[j] || '';

    var cirCls = 'qrv-node-circle';
    if (hl2 === 'write')  cirCls += ' write-active';
    if (hl2 === 'read')   cirCls += ' read-active';
    if (hl2 === 'stale')  cirCls += ' stale-node';
    if (hl2 === 'fresh')  cirCls += ' fresh-node';

    var card = document.createElement('div');
    card.className = 'qrv-node-card';
    card.style.left = pos2.x + 'px';
    card.style.top  = pos2.y + 'px';

    card.innerHTML =
      '<div class="' + cirCls + '">' +
        '<span class="qrv-node-id">' + rep.label + '</span>' +
        '<span class="qrv-node-val">' + (rep.value !== null ? qrvEscape(rep.value) : '—') + '</span>' +
        '<span class="qrv-node-ver">v' + rep.version + '</span>' +
      '</div>' +
      '<div class="qrv-node-label">' + (hl2 === 'write' ? 'writing' : (hl2 === 'read' ? 'reading' : (hl2 === 'stale' ? 'STALE' : (hl2 === 'fresh' ? 'FRESH' : '')))) + '</div>';

    overlay.appendChild(card);
  }
}

/* ════════════════════════════════════════════
   CONSISTENCY INDICATOR
════════════════════════════════════════════ */

function qrvUpdateIndicator() {
  var sum     = qrvW + qrvR;
  var strong  = sum > qrvN;
  var badge   = document.getElementById('qrvConsistencyBadge');
  var formula = document.getElementById('qrvCiFormula');
  var verdict = document.getElementById('qrvCiVerdict');
  var desc    = document.getElementById('qrvCiDesc');

  if (formula) formula.textContent = 'W+R = ' + sum + (strong ? ' > ' : ' ≤ ') + 'N=' + qrvN;
  if (verdict) verdict.textContent = strong ? '✅ Strong Consistency' : '⚠️ Eventual Consistency';
  if (desc)    desc.textContent    = strong ? 'Read quorum always overlaps write quorum' : 'Reads may return stale data';
  if (badge)   badge.classList.toggle('eventual', !strong);
}

/* ════════════════════════════════════════════
   SLIDER LABELS
════════════════════════════════════════════ */

function qrvUpdateSliderLabels() {
  var vN = document.getElementById('qrvValN');
  var vW = document.getElementById('qrvValW');
  var vR = document.getElementById('qrvValR');
  if (vN) vN.textContent = qrvN;
  if (vW) vW.textContent = qrvW;
  if (vR) vR.textContent = qrvR;
  qrvUpdateIndicator();
}

/* ════════════════════════════════════════════
   UTILITY
════════════════════════════════════════════ */

function qrvSample(arr, k) {
  var copy = arr.slice();
  var result = [];
  for (var i = 0; i < k && copy.length; i++) {
    var idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function qrvRandLatency() {
  return 20 + Math.floor(Math.random() * 80);
}

function qrvSetStatus(msg, cls) {
  var el = document.getElementById('qrvStatus');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'qrv-status ' + (cls || '');
}

function qrvAddLog(msg, type) {
  var log = document.getElementById('qrvLog');
  if (!log) return;
  var empty = log.querySelector('.qrv-empty-text');
  if (empty) empty.remove();

  var entry = document.createElement('div');
  entry.className = 'qrv-log-entry log-' + (type || 'info');
  entry.textContent = '[' + (++qrvLogCount) + '] ' + msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 60) log.removeChild(log.lastChild);
}

function qrvClearQuorum() {
  var el = document.getElementById('qrvQuorumArea');
  if (el) el.innerHTML = '';

  var rc = document.getElementById('qrvResultCard');
  if (rc) rc.style.display = 'none';
}

function qrvAddQuorumRow(icon, nodeLabel, msg, ver, latency, rowCls, nodeColour) {
  var area = document.getElementById('qrvQuorumArea');
  if (!area) return;

  var empty = area.querySelector('.qrv-empty-text');
  if (empty) empty.remove();

  var row = document.createElement('div');
  row.className = 'qrv-quorum-row ' + (rowCls || '');

  var nodeCls = 'qrv-qrow-node' + (nodeColour === 'read' ? ' read-node' : '');

  row.innerHTML =
    '<span class="qrv-qrow-icon">' + icon + '</span>' +
    '<span class="' + nodeCls + '">' + nodeLabel + '</span>' +
    '<span class="qrv-qrow-msg">' + msg + '</span>' +
    (ver !== undefined && ver !== null ? '<span class="qrv-qrow-ver">v' + ver + '</span>' : '') +
    (latency ? '<span class="qrv-qrow-latency">' + latency + 'ms</span>' : '');

  area.appendChild(row);
}

function qrvShowResult(valHtml, noteHtml, repairHtml, stale) {
  var card = document.getElementById('qrvResultCard');
  var body = document.getElementById('qrvResultBody');
  if (!card || !body) return;

  card.style.display = 'block';
  body.innerHTML =
    '<div class="qrv-result-main">Operation result:</div>' +
    '<div class="qrv-result-val' + (stale ? ' stale-val' : '') + '">' + valHtml + '</div>' +
    (noteHtml  ? '<div class="qrv-result-note">'   + noteHtml   + '</div>' : '') +
    (repairHtml ? '<div class="qrv-result-repair">' + repairHtml + '</div>' : '');
}

function qrvEscape(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ════════════════════════════════════════════
   WRITE OPERATION
════════════════════════════════════════════ */

function qrvDoWrite(valueOverride) {
  if (qrvOpInFlight) return;
  qrvOpInFlight = true;
  qrvClearQuorum();

  var inputEl = document.getElementById('qrvWriteVal');
  var value   = (valueOverride !== undefined ? valueOverride : (inputEl ? inputEl.value.trim() : '')) || 'data';

  var newVersion = Math.max.apply(null, qrvReplicas.map(function (r) { return r.version; })) + 1;
  var targets    = qrvSample(qrvReplicas, qrvW);
  var highlights = {};
  targets.forEach(function (r) { highlights[r.id] = 'write'; });

  qrvRender(highlights);
  qrvSetStatus('Writing "' + qrvEscape(value) + '" v' + newVersion + ' to ' + qrvW + ' replica(s)…', 'info');
  qrvAddLog('WRITE "' + value + '" v' + newVersion + ' → ' + targets.map(function (r) { return r.label; }).join(', '), 'write');

  qrvAddQuorumRow('✍️', 'COORD', 'Broadcasting write "' + qrvEscape(value) + '" v' + newVersion + ' to W=' + qrvW + ' replica(s)', null, null, 'write-row');

  var done = 0;
  targets.forEach(function (rep, idx) {
    var lat = qrvRandLatency();
    setTimeout(function () {
      rep.value   = value;
      rep.version = newVersion;
      qrvRender(highlights);
      qrvAddQuorumRow('✅', rep.label, 'Wrote "' + qrvEscape(value) + '" — ACK', newVersion, lat, 'write-row');
      done++;

      if (done === targets.length) {
        setTimeout(function () {
          qrvRender({});
          qrvSetStatus('Write succeeded. ' + targets.map(function (r) { return r.label; }).join(', ') + ' updated to v' + newVersion + '. ' + (qrvN - qrvW) + ' replica(s) not yet updated.', 'ok');
          qrvShowResult(
            '"' + qrvEscape(value) + '" written at v' + newVersion,
            qrvW + ' of ' + qrvN + ' replicas acknowledged. ' + (qrvN - qrvW) + ' replica(s) (' + qrvReplicas.filter(function (r) { return r.version < newVersion; }).map(function (r) { return r.label; }).join(', ') + ') still at older version.',
            null, false
          );
          qrvAddLog('WRITE ACK — v' + newVersion + ' confirmed on ' + qrvW + ' node(s)', 'write');
          qrvOpInFlight = false;
        }, 300);
      }
    }, idx * 140 + lat);
  });
}

/* ════════════════════════════════════════════
   READ OPERATION
════════════════════════════════════════════ */

function qrvDoRead(forcedReadSet) {
  if (qrvOpInFlight) return;
  qrvOpInFlight = true;
  qrvClearQuorum();

  var readSet = forcedReadSet || qrvSample(qrvReplicas, qrvR);
  var highlights = {};
  readSet.forEach(function (r) { highlights[r.id] = 'read'; });

  qrvRender(highlights);
  qrvSetStatus('Reading from ' + qrvR + ' replica(s)…', 'info');
  qrvAddLog('READ → querying ' + readSet.map(function (r) { return r.label; }).join(', '), 'read');
  qrvAddQuorumRow('📖', 'COORD', 'Querying R=' + qrvR + ' replica(s): ' + readSet.map(function (r) { return r.label; }).join(', '), null, null, 'read-row', 'read');

  var responses = [];
  var done = 0;

  readSet.forEach(function (rep, idx) {
    var lat = qrvRandLatency();
    setTimeout(function () {
      responses.push({ rep: rep, version: rep.version, value: rep.value, lat: lat });

      var isFresh = rep.version === Math.max.apply(null, qrvReplicas.map(function (r) { return r.version; }));
      qrvAddQuorumRow(
        isFresh ? '✅' : '⚠️',
        rep.label,
        'Replied with "' + (rep.value !== null ? qrvEscape(rep.value) : '—') + '"',
        rep.version,
        lat,
        isFresh ? 'fresh-row' : 'stale-row',
        'read'
      );

      done++;
      if (done === readSet.length) {
        setTimeout(function () { qrvResolveRead(responses, highlights); }, 250);
      }
    }, idx * 140 + lat);
  });
}

function qrvResolveRead(responses, highlights) {
  var best = responses.reduce(function (a, b) { return a.version >= b.version ? a : b; });
  var maxVer  = best.version;
  var globalMax = Math.max.apply(null, qrvReplicas.map(function (r) { return r.version; }));
  var isStale = maxVer < globalMax;
  var staleNodes = responses.filter(function (r) { return r.version < maxVer; });
  var needRepair = staleNodes.length > 0;

  qrvRender(highlights);

  if (isStale) {
    qrvSetStatus('⚠️ STALE READ — returned v' + maxVer + ' but latest is v' + globalMax + '. Read quorum missed the latest write!', 'warn');
    qrvAddLog('READ STALE — got v' + maxVer + ', latest is v' + globalMax, 'stale');
    qrvAddQuorumRow('⚠️', 'COORD', 'STALE READ: best version in quorum is v' + maxVer + ', but v' + globalMax + ' exists on nodes NOT in this quorum.', maxVer, null, 'stale-row');

    qrvShowResult(
      '"' + (best.value !== null ? qrvEscape(best.value) : '—') + '" (v' + maxVer + ')',
      '⚠️ Stale read! Latest version is v' + globalMax + ' on ' + qrvReplicas.filter(function (r) { return r.version === globalMax; }).map(function (r) { return r.label; }).join(', ') + ' — not included in this read quorum.',
      needRepair ? '🔧 Read repair queued for stale replicas in quorum.' : null,
      true
    );
  } else {
    qrvSetStatus('✅ Read returned latest value "' + qrvEscape(best.value) + '" at v' + maxVer + '.', 'ok');
    qrvAddLog('READ OK — v' + maxVer + ' "' + best.value + '"', 'read');
    qrvAddQuorumRow('✅', 'COORD', 'Returning highest version v' + maxVer + ' to client.', maxVer, null, 'fresh-row');

    if (needRepair) {
      qrvAddQuorumRow('🔧', 'COORD', 'Read repair: pushing v' + maxVer + ' to ' + staleNodes.map(function (r) { return r.rep.label; }).join(', '), maxVer, null, 'repair-row');
      qrvAddLog('READ REPAIR → ' + staleNodes.map(function (r) { return r.rep.label; }).join(', '), 'repair');
      staleNodes.forEach(function (r) {
        r.rep.value   = best.value;
        r.rep.version = maxVer;
      });
      qrvRender({});
    }

    qrvShowResult(
      '"' + qrvEscape(best.value) + '" (v' + maxVer + ')',
      'Highest version from ' + responses.length + ' replicas. ' + (needRepair ? 'Read repair applied to ' + staleNodes.length + ' stale node(s).' : 'All queried replicas were up-to-date.'),
      null, false
    );
  }

  qrvOpInFlight = false;
}

/* ════════════════════════════════════════════
   STALENESS DEMO
   Deliberately constructs W+R ≤ N and ensures read misses write
════════════════════════════════════════════ */

function qrvStalenessDemo() {
  if (qrvOpInFlight) return;

  /* Force N=5, W=2, R=2 so W+R=4 ≤ 5 */
  qrvN = 5; qrvW = 2; qrvR = 2;

  var slN = document.getElementById('qrvSliderN');
  var slW = document.getElementById('qrvSliderW');
  var slR = document.getElementById('qrvSliderR');
  if (slN) { slN.max = '7'; slN.value = qrvN; }
  if (slW) { slW.value = qrvW; }
  if (slR) { slR.value = qrvR; }

  qrvUpdateSliderLabels();
  qrvBuildReplicas();
  qrvClearQuorum();
  qrvRender({});

  qrvSetStatus('Staleness Demo: N=5, W=2, R=2 (W+R=4 ≤ 5). Watch a read miss the latest write.', 'warn');
  qrvAddLog('STALENESS DEMO START — N=' + qrvN + ' W=' + qrvW + ' R=' + qrvR, 'stale');

  /* Step 1: write to replicas 0 and 1 only */
  qrvOpInFlight = true;
  qrvClearQuorum();

  var newVer  = 1;
  var writeSet = [qrvReplicas[0], qrvReplicas[1]];

  var wHl = {};
  writeSet.forEach(function (r) { wHl[r.id] = 'write'; });
  qrvRender(wHl);
  qrvAddQuorumRow('✍️', 'COORD', 'Write "newdata" v1 to R1 and R2 only (W=2)', null, null, 'write-row');

  writeSet.forEach(function (rep) {
    rep.value   = 'newdata';
    rep.version = newVer;
  });

  setTimeout(function () {
    qrvRender({});
    qrvAddLog('WRITE "newdata" v1 → R1, R2 only', 'write');
    qrvAddQuorumRow('✅', 'COORD', 'Write ACK. R1, R2 = v1. R3, R4, R5 still at v0.', newVer, null, 'write-row');
    qrvOpInFlight = false;

    /* Step 2: force read from replicas 2, 3 — guaranteed to miss write */
    setTimeout(function () {
      qrvAddQuorumRow('📖', 'COORD', 'Now reading from R3 and R4 (forced — to show they have v0)', null, null, 'read-row', 'read');
      var forcedRead = [qrvReplicas[2], qrvReplicas[3]];
      qrvDoRead(forcedRead);
    }, 900);

  }, 800);
}

/* ════════════════════════════════════════════
   STRONG CONSISTENCY DEMO
   W+R > N guarantees overlap
════════════════════════════════════════════ */

function qrvStrongDemo() {
  if (qrvOpInFlight) return;

  /* Force N=3, W=2, R=2 so W+R=4 > 3 */
  qrvN = 3; qrvW = 2; qrvR = 2;

  var slN = document.getElementById('qrvSliderN');
  var slW = document.getElementById('qrvSliderW');
  var slR = document.getElementById('qrvSliderR');
  if (slN) { slN.value = qrvN; }
  if (slW) { slW.value = qrvW; }
  if (slR) { slR.value = qrvR; }

  qrvUpdateSliderLabels();
  qrvBuildReplicas();
  qrvClearQuorum();
  qrvRender({});

  qrvSetStatus('Strong Consistency Demo: N=3, W=2, R=2 (W+R=4 > 3). Any read quorum overlaps write quorum.', 'ok');
  qrvAddLog('STRONG CONSISTENCY DEMO — N=' + qrvN + ' W=' + qrvW + ' R=' + qrvR, 'info');

  /* Write to first 2 replicas */
  qrvOpInFlight = true;
  qrvClearQuorum();

  var newVer   = 1;
  var writeSet = [qrvReplicas[0], qrvReplicas[1]];

  var wHl = {};
  writeSet.forEach(function (r) { wHl[r.id] = 'write'; });
  qrvRender(wHl);
  qrvAddQuorumRow('✍️', 'COORD', 'Write "strongval" v1 to R1, R2 (W=2)', null, null, 'write-row');

  writeSet.forEach(function (rep) {
    rep.value   = 'strongval';
    rep.version = newVer;
  });

  setTimeout(function () {
    qrvRender({});
    qrvAddLog('WRITE "strongval" v1 → R1, R2', 'write');
    qrvAddQuorumRow('✅', 'COORD', 'Write ACK. R1=v1, R2=v1. R3 still at v0.', newVer, null, 'write-row');
    qrvOpInFlight = false;

    setTimeout(function () {
      /* Any 2 of 3 replicas MUST include at least one of R1/R2 */
      qrvAddQuorumRow('📖', 'COORD', 'Reading from any R=2 replicas — guaranteed overlap with write quorum.', null, null, 'read-row', 'read');
      qrvDoRead(); /* random — will always overlap */
    }, 900);
  }, 800);
}

/* ════════════════════════════════════════════
   RESET
════════════════════════════════════════════ */

function qrvReset() {
  qrvOpInFlight = false;
  qrvLogCount   = 0;
  qrvBuildReplicas();
  qrvClearQuorum();
  qrvRender({});

  var log = document.getElementById('qrvLog');
  if (log) log.innerHTML = '<span class="qrv-empty-text">Operations appear here.</span>';

  qrvSetStatus('Reset. Replicas cleared. Adjust N/W/R and run operations.', 'purple');
}

/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */

function qrvInit() {
  qrvBuildReplicas();
  qrvUpdateSliderLabels();

  /* Resize observer to redraw ring when container size changes */
  var wrap = document.getElementById('qrvRingWrap');
  if (wrap && window.ResizeObserver) {
    new ResizeObserver(function () { qrvRender({}); }).observe(wrap);
  }

  qrvRender({});

  /* Slider: N */
  var slN = document.getElementById('qrvSliderN');
  if (slN) {
    slN.addEventListener('input', function () {
      qrvN = parseInt(slN.value, 10);
      qrvW = Math.min(qrvW, qrvN);
      qrvR = Math.min(qrvR, qrvN);
      var slW = document.getElementById('qrvSliderW');
      var slR = document.getElementById('qrvSliderR');
      if (slW) { slW.max = qrvN; slW.value = qrvW; }
      if (slR) { slR.max = qrvN; slR.value = qrvR; }
      qrvUpdateSliderLabels();
      qrvBuildReplicas();
      qrvRender({});
    });
  }

  /* Slider: W */
  var slW = document.getElementById('qrvSliderW');
  if (slW) {
    slW.addEventListener('input', function () {
      qrvW = Math.min(parseInt(slW.value, 10), qrvN);
      slW.value = qrvW;
      qrvUpdateSliderLabels();
    });
  }

  /* Slider: R */
  var slR = document.getElementById('qrvSliderR');
  if (slR) {
    slR.addEventListener('input', function () {
      qrvR = Math.min(parseInt(slR.value, 10), qrvN);
      slR.value = qrvR;
      qrvUpdateSliderLabels();
    });
  }

  /* Buttons */
  var writeBtn  = document.getElementById('qrvWriteBtn');
  var readBtn   = document.getElementById('qrvReadBtn');
  var staleBtn  = document.getElementById('qrvStaleBtn');
  var strongBtn = document.getElementById('qrvStrongBtn');
  var resetBtn  = document.getElementById('qrvResetBtn');

  if (writeBtn)  writeBtn.addEventListener('click',  function () { qrvDoWrite(); });
  if (readBtn)   readBtn.addEventListener('click',   function () { qrvDoRead(); });
  if (staleBtn)  staleBtn.addEventListener('click',  qrvStalenessDemo);
  if (strongBtn) strongBtn.addEventListener('click', qrvStrongDemo);
  if (resetBtn)  resetBtn.addEventListener('click',  qrvReset);

  var writeInput = document.getElementById('qrvWriteVal');
  if (writeInput) {
    writeInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') qrvDoWrite();
    });
  }

  window.addEventListener('resize', function () { qrvRender({}); });
}