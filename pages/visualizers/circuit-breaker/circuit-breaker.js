document.addEventListener('DOMContentLoaded', function () {
  cbvInit();
});

/* ── State ── */
var CBV_STATES   = { CLOSED: 'CLOSED', OPEN: 'OPEN', HALFOPEN: 'HALF-OPEN' };
var cbvState     = CBV_STATES.CLOSED;
var cbvThreshold = 3;
var cbvCooldown  = 6;
var cbvFailRate  = 0;
var cbvServiceKilled = false;
var cbvAutoSpeed = 1200;
var cbvAutoTimer = null;
var cbvAutoFiring = false;
var cbvCooldownTimer    = null;
var cbvCooldownRemaining = 0;
var cbvCooldownInterval  = null;
var cbvShowCompare = false;
var cbvHalfOpenPending = false;

var cbvStats = { total: 0, success: 0, failed: 0, blocked: 0, consec: 0, trips: 0 };
var cbvWithLog    = [];
var cbvWithoutLog = [];

var FAST_FAIL_COST   = '~0ms (blocked)';
var SERVICE_COST_OK  = '~50ms';
var SERVICE_COST_FAIL = '~30,000ms (timeout)';

/* ── UI helpers ── */
function cbvSetStatus(msg, cls) {
  var el = document.getElementById('cbvStatus');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'cbv-status ' + (cls || '');
}

function cbvAddLog(msg, type, icon) {
  var log   = document.getElementById('cbvLog');
  if (!log) return;
  var empty = log.querySelector('.cbv-empty-text');
  if (empty) empty.remove();

  var entry = document.createElement('div');
  entry.className = 'cbv-log-entry log-' + (type || 'info');
  entry.innerHTML =
    '<span class="cbv-log-icon"><i class="fas ' + (icon || 'fa-circle') + '"></i></span>' +
    '<span>' + msg + '</span>';
  log.insertBefore(entry, log.firstChild);

  while (log.children.length > 60) log.removeChild(log.lastChild);
}

function cbvUpdateStateUI() {
  ['cbvStateClosed', 'cbvStateOpen', 'cbvStateHalfOpen'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('active-state');
  });

  var iconEl = document.getElementById('cbvBreakerIcon');
  ['state-closed', 'state-open', 'state-halfopen'].forEach(function (c) {
    if (iconEl) iconEl.classList.remove(c);
  });

  if (cbvState === CBV_STATES.CLOSED) {
    var el = document.getElementById('cbvStateClosed');
    if (el) el.classList.add('active-state');
    if (iconEl) iconEl.classList.add('state-closed');
    var i = document.getElementById('cbvBreakerIconI');
    if (i) i.className = 'fas fa-lock-open';
  } else if (cbvState === CBV_STATES.OPEN) {
    var el2 = document.getElementById('cbvStateOpen');
    if (el2) el2.classList.add('active-state');
    if (iconEl) iconEl.classList.add('state-open');
    var i2 = document.getElementById('cbvBreakerIconI');
    if (i2) i2.className = 'fas fa-ban';
  } else {
    var el3 = document.getElementById('cbvStateHalfOpen');
    if (el3) el3.classList.add('active-state');
    if (iconEl) iconEl.classList.add('state-halfopen');
    var i3 = document.getElementById('cbvBreakerIconI');
    if (i3) i3.className = 'fas fa-circle-half-stroke';
  }
}

function cbvUpdateStats() {
  var fields = { cbvStatTotal: cbvStats.total, cbvStatSuccess: cbvStats.success, cbvStatFailed: cbvStats.failed, cbvStatBlocked: cbvStats.blocked, cbvStatConsec: cbvStats.consec, cbvStatTrips: cbvStats.trips };
  Object.keys(fields).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = fields[id];
  });

  var bar    = document.getElementById('cbvConsecBar');
  var marker = document.getElementById('cbvThreshMarker');
  var maxVal = Math.max(cbvThreshold, cbvStats.consec);
  var pct    = Math.min((cbvStats.consec / maxVal) * 100, 100);
  var mPct   = Math.min((cbvThreshold / maxVal) * 100, 100);

  if (bar)    bar.style.width    = pct + '%';
  if (marker) marker.style.left  = mPct + '%';
}

function cbvUpdateServiceUI() {
  var svc   = document.getElementById('cbvServiceIcon');
  var hlth  = document.getElementById('cbvServiceHealth');

  if (!svc || !hlth) return;

  ['healthy','sick','dead'].forEach(function (c) { svc.classList.remove(c); });

  if (cbvServiceKilled) {
    svc.classList.add('dead');
    hlth.textContent = '● Dead';
    hlth.className   = 'cbv-service-health dead';
  } else if (cbvFailRate >= 50) {
    svc.classList.add('sick');
    hlth.textContent = '● Degraded';
    hlth.className   = 'cbv-service-health';
    hlth.style.color = '#f59e0b';
  } else {
    svc.classList.add('healthy');
    hlth.textContent = '● Healthy';
    hlth.className   = 'cbv-service-health';
    hlth.style.color = '';
  }
}

/* ── Cooldown logic ── */
function cbvStartCooldown() {
  cbvCooldownRemaining = cbvCooldown;
  var wrap = document.getElementById('cbvCooldownWrap');
  var bar  = document.getElementById('cbvCooldownBar');
  var txt  = document.getElementById('cbvCooldownTxt');

  if (wrap) wrap.style.display = 'block';
  if (bar)  bar.style.width = '100%';
  if (txt)  txt.textContent = cbvCooldownRemaining + 's';

  clearInterval(cbvCooldownInterval);

  cbvCooldownInterval = setInterval(function () {
    cbvCooldownRemaining--;

    var pct = (cbvCooldownRemaining / cbvCooldown) * 100;
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = cbvCooldownRemaining + 's';

    if (cbvCooldownRemaining <= 0) {
      clearInterval(cbvCooldownInterval);
      if (wrap) wrap.style.display = 'none';
      cbvTransitionTo(CBV_STATES.HALFOPEN, 'Cooldown expired — entering HALF-OPEN. One test request allowed.');
    }
  }, 1000);
}

function cbvStopCooldown() {
  clearInterval(cbvCooldownInterval);
  var wrap = document.getElementById('cbvCooldownWrap');
  if (wrap) wrap.style.display = 'none';
}

/* ── State transitions ── */
function cbvTransitionTo(newState, reason) {
  cbvState = newState;
  cbvUpdateStateUI();

  if (newState === CBV_STATES.OPEN) {
    cbvStats.trips++;
    cbvStats.consec = 0;
    cbvHalfOpenPending = false;
    cbvUpdateStats();
    cbvSetStatus('🔴 OPEN — ' + reason, 'fail');
    cbvAddLog('TRIP → OPEN: ' + reason, 'trip', 'fa-bolt');
    cbvAnimateArrow('cbvArrowTrip');
    cbvStartCooldown();
  } else if (newState === CBV_STATES.HALFOPEN) {
    cbvHalfOpenPending = true;
    cbvSetStatus('🟡 HALF-OPEN — ' + reason, 'warn');
    cbvAddLog('→ HALF-OPEN: ' + reason, 'info', 'fa-circle-half-stroke');
    cbvAnimateArrow('cbvArrowRecover');
  } else if (newState === CBV_STATES.CLOSED) {
    cbvStats.consec    = 0;
    cbvHalfOpenPending = false;
    cbvUpdateStats();
    cbvSetStatus('🟢 CLOSED — ' + reason, 'ok');
    cbvAddLog('→ CLOSED: ' + reason, 'ok', 'fa-check');
    cbvAnimateArrow('cbvArrowRecover');
  }

  cbvUpdateCompare();
}

function cbvAnimateArrow(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.classList.add('animating');
  setTimeout(function () { el.classList.remove('animating'); }, 800);
}

/* ── Service call simulation ── */
function cbvCallService() {
  if (cbvServiceKilled) return false;
  return Math.random() * 100 >= cbvFailRate;
}

/* ── Packet animation ── */
function cbvAnimatePacket(connId, success, callback) {
  var packet = document.getElementById(connId);
  var line   = document.getElementById(connId === 'cbvPacketA' ? 'cbvConnALine' : 'cbvConnBLine');

  if (!packet) { if (callback) callback(); return; }

  packet.className = 'cbv-conn-packet ' + (success ? '' : 'fail-color');
  if (line) line.className = 'cbv-conn-line active-conn';

  packet.classList.add('traveling');

  setTimeout(function () {
    packet.className = 'cbv-conn-packet';
    if (line) line.className = 'cbv-conn-line';
    if (callback) callback();
  }, 600);
}

function cbvShowResult(msg, cls) {
  var el = document.getElementById('cbvPipelineResult');
  if (!el) return;
  el.textContent  = msg;
  el.className    = 'cbv-pipeline-result ' + cls;
  setTimeout(function () {
    el.textContent = '';
    el.className   = 'cbv-pipeline-result';
  }, 1800);
}

/* ── Core: fire one request ── */
function cbvFireRequest() {
  cbvStats.total++;

  if (cbvState === CBV_STATES.OPEN) {
    cbvStats.blocked++;
    cbvUpdateStats();

    cbvShowResult('⚡ FAST FAIL — not calling service', 'cbv-result-blocked');
    cbvSetStatus('⚡ OPEN: request ' + cbvStats.total + ' instantly rejected. Service not contacted.', 'warn');
    cbvAddLog('#' + cbvStats.total + ' FAST-FAILED (breaker OPEN) — 0ms', 'blocked', 'fa-bolt');

    cbvPushCompare(
      { msg: '#' + cbvStats.total + ' blocked — 0ms', cls: 'cmp-blocked', cost: FAST_FAIL_COST },
      { msg: '#' + cbvStats.total + ' sent → timeout 30s', cls: 'cmp-fail',    cost: SERVICE_COST_FAIL }
    );
    return;
  }

  if (cbvState === CBV_STATES.HALFOPEN) {
    if (!cbvHalfOpenPending) {
      cbvStats.blocked++;
      cbvUpdateStats();
      cbvAddLog('#' + cbvStats.total + ' queued — HALF-OPEN already has a pending test', 'blocked', 'fa-hourglass-half');
      cbvSetStatus('HALF-OPEN: one test already in flight — queued request fast-failed.', 'warn');
      return;
    }
    cbvHalfOpenPending = false;

    cbvAnimatePacket('cbvPacketA', true, function () {
      var ok = cbvCallService();
      cbvAnimatePacket('cbvPacketB', ok, function () {
        if (ok) {
          cbvStats.success++;
          cbvUpdateStats();
          cbvShowResult('✅ Test succeeded', 'cbv-result-success');
          cbvAddLog('#' + cbvStats.total + ' TEST OK → recovering', 'ok', 'fa-check-circle');
          cbvTransitionTo(CBV_STATES.CLOSED, 'Test request succeeded. Service recovered.');
          cbvPushCompare(
            { msg: '#' + cbvStats.total + ' test OK → closed', cls: 'cmp-ok',   cost: SERVICE_COST_OK },
            { msg: '#' + cbvStats.total + ' sent → OK', cls: 'cmp-ok', cost: SERVICE_COST_OK }
          );
        } else {
          cbvStats.failed++;
          cbvStats.consec++;
          cbvUpdateStats();
          cbvShowResult('❌ Test failed — re-tripping', 'cbv-result-fail');
          cbvAddLog('#' + cbvStats.total + ' TEST FAILED → re-tripping', 'fail', 'fa-times-circle');
          cbvTransitionTo(CBV_STATES.OPEN, 'Test request failed. Re-tripping breaker.');
          cbvPushCompare(
            { msg: '#' + cbvStats.total + ' test fail → open', cls: 'cmp-fail', cost: SERVICE_COST_FAIL },
            { msg: '#' + cbvStats.total + ' fail (timeout)', cls: 'cmp-fail', cost: SERVICE_COST_FAIL }
          );
        }
      });
    });
    return;
  }

  /* CLOSED */
  cbvAnimatePacket('cbvPacketA', true, function () {
    var ok = cbvCallService();
    cbvAnimatePacket('cbvPacketB', ok, function () {
      if (ok) {
        cbvStats.success++;
        cbvStats.consec = 0;
        cbvUpdateStats();
        cbvShowResult('✅ 200 OK', 'cbv-result-success');
        cbvSetStatus('✅ Request ' + cbvStats.total + ' succeeded.', 'ok');
        cbvAddLog('#' + cbvStats.total + ' SUCCESS', 'ok', 'fa-check');
        cbvPushCompare(
          { msg: '#' + cbvStats.total + ' OK', cls: 'cmp-ok',   cost: SERVICE_COST_OK },
          { msg: '#' + cbvStats.total + ' OK', cls: 'cmp-ok', cost: SERVICE_COST_OK }
        );
      } else {
        cbvStats.failed++;
        cbvStats.consec++;
        cbvUpdateStats();
        cbvShowResult('❌ Error — failure #' + cbvStats.consec + '/' + cbvThreshold, 'cbv-result-fail');
        cbvSetStatus('❌ Request ' + cbvStats.total + ' failed. Consecutive failures: ' + cbvStats.consec + ' / ' + cbvThreshold + '.', 'fail');
        cbvAddLog('#' + cbvStats.total + ' FAILED (consec ' + cbvStats.consec + '/' + cbvThreshold + ')', 'fail', 'fa-times');

        cbvPushCompare(
          { msg: '#' + cbvStats.total + ' fail (counted)', cls: 'cmp-fail', cost: SERVICE_COST_FAIL },
          { msg: '#' + cbvStats.total + ' fail (timeout)', cls: 'cmp-fail', cost: SERVICE_COST_FAIL }
        );

        if (cbvStats.consec >= cbvThreshold) {
          setTimeout(function () {
            cbvTransitionTo(CBV_STATES.OPEN, cbvThreshold + ' consecutive failures — breaker tripped.');
          }, 350);
        }
      }
    });
  });
}

/* ── Comparison panel ── */
function cbvPushCompare(withItem, withoutItem) {
  cbvWithLog.push(withItem);
  cbvWithoutLog.push(withoutItem);

  if (cbvShowCompare) cbvRenderCompare();
}

function cbvRenderCompare() {
  var wEl  = document.getElementById('cbvCmpWith');
  var woEl = document.getElementById('cbvCmpWithout');
  if (!wEl || !woEl) return;

  function renderRows(container, items) {
    container.innerHTML = '';
    items.slice(-20).reverse().forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'cbv-cmp-row ' + (item.cls || '');
      row.innerHTML = '<span>' + item.msg + '</span><span class="cbv-cmp-cost">' + item.cost + '</span>';
      container.appendChild(row);
    });
  }

  renderRows(wEl, cbvWithLog);
  renderRows(woEl, cbvWithoutLog);

  var totalWith    = cbvWithLog.length;
  var blockedWith  = cbvWithLog.filter(function (x) { return x.cls === 'cmp-blocked'; }).length;
  var failWithout  = cbvWithoutLog.filter(function (x) { return x.cls === 'cmp-fail'; }).length;

  var savedMs      = failWithout * 30000;
  var summary      = document.getElementById('cbvCompareSummary');
  if (summary) {
    summary.innerHTML =
      '<strong>Breaker fast-failed ' + blockedWith + ' request(s)</strong> — saved ~' +
      (blockedWith * 30).toFixed(0) + 's of timeout wait. ' +
      'Without breaker: ' + failWithout + ' timeout(s) = ~' + (failWithout * 30).toFixed(0) + 's wasted. ' +
      'Total requests: ' + totalWith + '.';
  }
}

function cbvUpdateCompare() {
  if (cbvShowCompare) cbvRenderCompare();
}

/* ── Reset ── */
function cbvFullReset() {
  cbvStopAutoFire();
  cbvStopCooldown();

  cbvState         = CBV_STATES.CLOSED;
  cbvServiceKilled = false;
  cbvHalfOpenPending = false;
  cbvStats         = { total: 0, success: 0, failed: 0, blocked: 0, consec: 0, trips: 0 };
  cbvWithLog       = [];
  cbvWithoutLog    = [];

  cbvUpdateStateUI();
  cbvUpdateStats();
  cbvUpdateServiceUI();

  var log = document.getElementById('cbvLog');
  if (log) log.innerHTML = '<span class="cbv-empty-text">Requests appear here.</span>';

  var result = document.getElementById('cbvPipelineResult');
  if (result) { result.textContent = ''; result.className = 'cbv-pipeline-result'; }

  if (cbvShowCompare) cbvRenderCompare();

  cbvSetStatus('Reset. Configure and fire requests.', 'info');
}

/* ── Auto-fire ── */
function cbvStartAutoFire() {
  if (cbvAutoFiring) return;
  cbvAutoFiring = true;

  var btn = document.getElementById('cbvAutoBtn');
  if (btn) btn.innerHTML = '<i class="fas fa-stop"></i> Stop Auto';

  cbvAutoTimer = setInterval(function () {
    cbvFireRequest();
  }, cbvAutoSpeed);
}

function cbvStopAutoFire() {
  cbvAutoFiring = false;
  clearInterval(cbvAutoTimer);
  var btn = document.getElementById('cbvAutoBtn');
  if (btn) btn.innerHTML = '<i class="fas fa-play"></i> Auto-Fire';
}

function cbvToggleAutoFire() {
  if (cbvAutoFiring) cbvStopAutoFire();
  else cbvStartAutoFire();
}

/* ── Init ── */
function cbvInit() {
  cbvUpdateStateUI();
  cbvUpdateServiceUI();
  cbvUpdateStats();

  /* Threshold slider */
  var threshSl  = document.getElementById('cbvThreshSlider');
  var threshVal = document.getElementById('cbvThreshVal');
  if (threshSl) {
    threshSl.addEventListener('input', function () {
      cbvThreshold = parseInt(threshSl.value, 10);
      if (threshVal) threshVal.textContent = cbvThreshold + ' consecutive failure' + (cbvThreshold !== 1 ? 's' : '');
      cbvUpdateStats();
    });
  }

  /* Cooldown slider */
  var coolSl  = document.getElementById('cbvCooldownSlider');
  var coolVal = document.getElementById('cbvCooldownVal');
  if (coolSl) {
    coolSl.addEventListener('input', function () {
      cbvCooldown = parseInt(coolSl.value, 10);
      if (coolVal) coolVal.textContent = cbvCooldown + ' second' + (cbvCooldown !== 1 ? 's' : '');
    });
  }

  /* Fail rate slider */
  var failSl  = document.getElementById('cbvFailRateSlider');
  var failVal = document.getElementById('cbvFailRateVal');
  if (failSl) {
    failSl.addEventListener('input', function () {
      cbvFailRate = parseInt(failSl.value, 10);
      var lbl = cbvFailRate === 0 ? '0% (healthy)' : (cbvFailRate === 100 ? '100% (all fail)' : cbvFailRate + '%');
      if (failVal) failVal.textContent = lbl;
      cbvUpdateServiceUI();
    });
  }

  /* Auto speed */
  var speedEl = document.getElementById('cbvAutoSpeed');
  if (speedEl) {
    speedEl.addEventListener('input', function () {
      cbvAutoSpeed = parseInt(speedEl.value, 10);
      if (cbvAutoFiring) { cbvStopAutoFire(); cbvStartAutoFire(); }
    });
  }

  /* Kill / Heal */
  var killBtn = document.getElementById('cbvKillBtn');
  var healBtn = document.getElementById('cbvHealBtn');

  if (killBtn) {
    killBtn.addEventListener('click', function () {
      cbvServiceKilled = true;
      cbvFailRate = 100;
      var failSl2 = document.getElementById('cbvFailRateSlider');
      var failV2  = document.getElementById('cbvFailRateVal');
      if (failSl2) failSl2.value = 100;
      if (failV2) failV2.textContent = '100% (all fail)';
      cbvUpdateServiceUI();
      cbvSetStatus('💀 Service killed. All requests will fail until healed.', 'fail');
      cbvAddLog('Service KILLED — 100% failure rate', 'fail', 'fa-skull');
    });
  }

  if (healBtn) {
    healBtn.addEventListener('click', function () {
      cbvServiceKilled = false;
      cbvFailRate = 0;
      var failSl3 = document.getElementById('cbvFailRateSlider');
      var failV3  = document.getElementById('cbvFailRateVal');
      if (failSl3) failSl3.value = 0;
      if (failV3) failV3.textContent = '0% (healthy)';
      cbvUpdateServiceUI();
      cbvSetStatus('💚 Service healed. Failures reset to 0%.', 'ok');
      cbvAddLog('Service HEALED — back to healthy', 'ok', 'fa-heart-pulse');
    });
  }

  /* Fire, auto, compare, reset */
  var fireBtn    = document.getElementById('cbvFireBtn');
  var autoBtn    = document.getElementById('cbvAutoBtn');
  var compareBtn = document.getElementById('cbvCompareBtn');
  var resetBtn   = document.getElementById('cbvResetBtn');

  if (fireBtn) fireBtn.addEventListener('click', cbvFireRequest);
  if (autoBtn) autoBtn.addEventListener('click', cbvToggleAutoFire);

  if (compareBtn) {
    compareBtn.addEventListener('click', function () {
      cbvShowCompare = !cbvShowCompare;
      var section = document.getElementById('cbvCompareSection');
      if (section) section.style.display = cbvShowCompare ? 'block' : 'none';
      if (cbvShowCompare) cbvRenderCompare();
    });
  }

  if (resetBtn) resetBtn.addEventListener('click', cbvFullReset);
}