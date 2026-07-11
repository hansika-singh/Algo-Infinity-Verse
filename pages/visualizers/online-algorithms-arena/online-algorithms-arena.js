document.addEventListener('DOMContentLoaded', function() {
  oaInit();
});

var oaState = {
  ski: {
    rentCost: 1,
    buyCost: 10,
    strategy: 'optimal-online',
    day: 0,
    bought: false,
    onlineCost: 0,
    history: [],
  },
  interval: {
    intervals: [],
    idx: 0,
    onlineAccepted: [],
    onlineRejectedLog: [],
    lastAcceptedEnd: -1,
  },
};

function oaSkiBuyDay() {
  return Math.ceil(oaState.ski.buyCost / oaState.ski.rentCost);
}

function oaSkiOptCost(days) {
  return Math.min(days * oaState.ski.rentCost, oaState.ski.buyCost);
}

function oaSkiAdvanceDay() {
  var s = oaState.ski;
  s.day++;

  var dayCost = 0;
  var boughtThisDay = false;

  if (s.strategy === 'buy-immediately') {
    if (s.day === 1) { dayCost = s.buyCost; s.bought = true; boughtThisDay = true; }
    else dayCost = 0;
  } else if (s.strategy === 'rent-forever') {
    dayCost = s.rentCost;
  } else {
    var buyDay = oaSkiBuyDay();
    if (s.bought) {
      dayCost = 0;
    } else if (s.day >= buyDay) {
      dayCost = s.buyCost;
      s.bought = true;
      boughtThisDay = true;
    } else {
      dayCost = s.rentCost;
    }
  }

  s.onlineCost += dayCost;
  s.history.push({ day: s.day, onlineCost: s.onlineCost, optCost: oaSkiOptCost(s.day), bought: boughtThisDay });

  oaRenderSkiChart();
  oaUpdateSkiStats();

  if (boughtThisDay) {
    oaSetStatus('oaSkiStatus', 'Bought on day ' + s.day + ' for ' + s.buyCost + '. All future days are free.', 'bought');
  } else {
    oaSetStatus('oaSkiStatus', 'Day ' + s.day + ': paid ' + dayCost + ' to rent. Total so far: ' + s.onlineCost + '.', '');
  }
}

function oaSkiAdversaryStop() {
  var s = oaState.ski;
  if (s.strategy !== 'optimal-online') { oaSetStatus('oaSkiStatus', 'Adversary mode targets the Optimal Online strategy — switch to it first.', 'adversary'); return; }

  var buyDay = oaSkiBuyDay();
  while (s.day < buyDay) oaSkiAdvanceDay();

  var ratio = s.onlineCost / oaSkiOptCost(s.day);
  oaSetStatus('oaSkiStatus', '⚡ Adversary stopped you the instant after buying (day ' + s.day + '). Online cost: ' + s.onlineCost + '. Offline optimal (knowing you\'d ski exactly ' + s.day + ' days): ' + oaSkiOptCost(s.day) + '. Ratio: ' + ratio.toFixed(2) + '× — approaching the proven worst case of 2×.', 'adversary');

  var proofEl = document.getElementById('oaSkiProof');
  if (proofEl) proofEl.textContent = 'With rent=' + s.rentCost + ', buy=' + s.buyCost + ': the optimal online strategy rents for ' + (buyDay - 1) + ' days then buys on day ' + buyDay + '. The adversary stopped you right after — you paid ' + s.onlineCost + ' vs the offline optimum\'s ' + oaSkiOptCost(s.day) + ', a ratio of ' + ratio.toFixed(2) + '×.';
}

function oaSkiReset() {
  var s = oaState.ski;
  s.day = 0;
  s.bought = false;
  s.onlineCost = 0;
  s.history = [];
  oaRenderSkiChart();
  oaUpdateSkiStats();
  oaSetStatus('oaSkiStatus', 'Reset. Click "Ski One More Day" to advance.', '');
}

function oaUpdateSkiStats() {
  var s = oaState.ski;
  var daysEl = document.getElementById('oaSkiDays');
  var onlineEl = document.getElementById('oaSkiOnlineCost');
  var optEl = document.getElementById('oaSkiOptCost');
  var ratioEl = document.getElementById('oaSkiRatio');

  var opt = oaSkiOptCost(s.day);
  var ratio = opt > 0 ? s.onlineCost / opt : 1;

  if (daysEl) daysEl.textContent = s.day;
  if (onlineEl) onlineEl.textContent = s.onlineCost;
  if (optEl) optEl.textContent = opt;
  if (ratioEl) ratioEl.textContent = ratio.toFixed(2) + '×';
}

function oaRenderSkiChart() {
  var canvas = document.getElementById('oaSkiCanvas');
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 260;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var s = oaState.ski;
  var maxDay = Math.max(s.day, 5);
  var maxCost = Math.max(s.onlineCost, oaSkiOptCost(maxDay), s.buyCost) * 1.15;

  var W = canvas.width; var H = canvas.height;
  var pad = { top: 15, right: 15, bottom: 25, left: 40 };
  var plotW = W - pad.left - pad.right;
  var plotH = H - pad.top - pad.bottom;

  function xPos(d) { return pad.left + (d / maxDay) * plotW; }
  function yPos(c) { return pad.top + (1 - c / maxCost) * plotH; }

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (var i = 0; i <= 4; i++) {
    var y = pad.top + (i / 4) * plotH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    var val = Math.round(maxCost * (1 - i / 4));
    ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.font = '8px Fira Code,monospace'; ctx.textAlign = 'right';
    ctx.fillText(val, pad.left - 4, y + 3);
  }

  ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(xPos(0), yPos(s.buyCost)); ctx.lineTo(xPos(maxDay), yPos(s.buyCost));
  ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#f59e0b'; ctx.font = '8px Fira Code,monospace'; ctx.textAlign = 'left';
  ctx.fillText('buy price = ' + s.buyCost, pad.left + 4, yPos(s.buyCost) - 4);

  if (s.history.length > 0) {
    ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(0));
    s.history.forEach(function(h) { ctx.lineTo(xPos(h.day), yPos(h.optCost)); });
    ctx.stroke();

    ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(0));
    s.history.forEach(function(h) { ctx.lineTo(xPos(h.day), yPos(h.onlineCost)); });
    ctx.stroke();

    s.history.forEach(function(h) {
      if (h.bought) {
        ctx.beginPath(); ctx.arc(xPos(h.day), yPos(h.onlineCost), 5, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4'; ctx.fill();
      }
    });
  }

  ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 9px Poppins,sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('● Online strategy cost', pad.left, 12);
  ctx.fillStyle = '#a855f7';
  ctx.fillText('● Offline optimal cost', pad.left + 140, 12);
}

function oaGenerateIntervals() {
  var intervals = [];
  var count = 10;
  for (var i = 0; i < count; i++) {
    var start = Math.floor(Math.random() * 18);
    var len = 2 + Math.floor(Math.random() * 5);
    intervals.push({ id: i, start: start, end: start + len, arrivalOrder: i });
  }
  intervals.sort(function() { return Math.random() - 0.5; });
  intervals.forEach(function(iv, i) { iv.arrivalOrder = i; });
  return intervals;
}

function oaGenerateAdversarialIntervals() {
  var intervals = [];
  intervals.push({ start: 0, end: 10 });
  for (var i = 0; i < 6; i++) {
    var segStart = i * 1.6;
    intervals.push({ start: segStart, end: segStart + 1.5 });
  }
  intervals.forEach(function(iv, i) { iv.id = i; iv.arrivalOrder = i; });
  return intervals;
}

function oaComputeOfflineOptimal(intervals) {
  var sorted = intervals.slice().sort(function(a, b) { return a.end - b.end; });
  var count = 0; var lastEnd = -Infinity; var chosen = [];
  sorted.forEach(function(iv) {
    if (iv.start >= lastEnd) { count++; lastEnd = iv.end; chosen.push(iv.id); }
  });
  return { count: count, chosen: chosen };
}

function oaStartIntervalRound(intervals) {
  oaState.interval.intervals = intervals;
  oaState.interval.idx = 0;
  oaState.interval.onlineAccepted = [];
  oaState.interval.lastAcceptedEnd = -Infinity;

  var totalEl = document.getElementById('oaIntervalTotal');
  var numEl = document.getElementById('oaIntervalNum');
  if (totalEl) totalEl.textContent = intervals.length;
  if (numEl) numEl.textContent = 0;

  var log = document.getElementById('oaIntervalLog');
  if (log) log.innerHTML = '<div class="oa-empty">No decisions yet.</div>';

  oaRenderIntervalCanvas();
  oaUpdateIntervalStats();
  oaSetStatus('oaIntervalStatus', intervals.length + ' intervals loaded in arrival order. Click "Next Interval Arrives" to process them one at a time.', '');
}

function oaIntervalNext() {
  var st = oaState.interval;
  if (st.idx >= st.intervals.length) { oaSetStatus('oaIntervalStatus', 'All intervals processed. Generate a new set to continue.', ''); return; }

  var iv = st.intervals[st.idx];
  var accept = iv.start >= st.lastAcceptedEnd;

  if (accept) {
    st.onlineAccepted.push(iv.id);
    st.lastAcceptedEnd = iv.end;
    oaAddIntervalLog('Interval #' + iv.id + ' [' + iv.start.toFixed(1) + ', ' + iv.end.toFixed(1) + ']: ACCEPTED (doesn\'t overlap last accepted)', 'accept');
  } else {
    oaAddIntervalLog('Interval #' + iv.id + ' [' + iv.start.toFixed(1) + ', ' + iv.end.toFixed(1) + ']: REJECTED (overlaps current accepted interval)', 'reject');
  }

  st.idx++;
  var numEl = document.getElementById('oaIntervalNum');
  if (numEl) numEl.textContent = st.idx;

  oaRenderIntervalCanvas();
  oaUpdateIntervalStats();

  if (st.idx >= st.intervals.length) {
    var opt = oaComputeOfflineOptimal(st.intervals);
    var ratio = st.onlineAccepted.length > 0 ? (opt.count / st.onlineAccepted.length) : 1;
    oaSetStatus('oaIntervalStatus', 'All intervals processed. Online accepted ' + st.onlineAccepted.length + ', offline optimal was ' + opt.count + '. Competitive ratio: ' + ratio.toFixed(2) + '×.', accept ? 'bought' : '');
  } else {
    oaSetStatus('oaIntervalStatus', accept ? 'Accepted — this interval is now blocking any overlapping future intervals.' : 'Rejected — it overlapped the currently accepted interval.', '');
  }
}

function oaAddIntervalLog(msg, cls) {
  var log = document.getElementById('oaIntervalLog');
  if (!log) return;
  var empty = log.querySelector('.oa-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'oa-log-entry ' + (cls || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 40) log.removeChild(log.lastChild);
}

function oaUpdateIntervalStats() {
  var st = oaState.interval;
  var opt = oaComputeOfflineOptimal(st.intervals);
  var onlineCountEl = document.getElementById('oaIntervalOnlineCount');
  var optCountEl = document.getElementById('oaIntervalOptCount');
  var ratioEl = document.getElementById('oaIntervalRatio');

  var ratio = st.onlineAccepted.length > 0 ? opt.count / st.onlineAccepted.length : 1;

  if (onlineCountEl) onlineCountEl.textContent = st.onlineAccepted.length;
  if (optCountEl) optCountEl.textContent = opt.count;
  if (ratioEl) ratioEl.textContent = ratio.toFixed(2) + '×';
}

function oaRenderIntervalCanvas() {
  var canvas = document.getElementById('oaIntervalCanvas');
  if (!canvas) return;
  var st = oaState.interval;
  var maxEnd = Math.max.apply(null, st.intervals.map(function(iv) { return iv.end; }).concat([10]));

  var W = Math.max(canvas.parentElement.clientWidth, 500);
  var H = 260;
  canvas.width = W; canvas.height = H;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  var pad = { top: 20, right: 20, bottom: 30, left: 20 };
  var plotW = W - pad.left - pad.right;
  var rowH = 22;

  function xPos(t) { return pad.left + (t / maxEnd) * plotW; }

  var opt = oaComputeOfflineOptimal(st.intervals);

  st.intervals.forEach(function(iv, row) {
    var y = pad.top + row * rowH;
    var isProcessed = iv.arrivalOrder < st.idx;
    var isAccepted = st.onlineAccepted.indexOf(iv.id) !== -1;
    var isOptimal = opt.chosen.indexOf(iv.id) !== -1;
    var isCurrent = iv.arrivalOrder === st.idx;

    var color = isAccepted ? '#22c55e' : (isProcessed ? '#ef4444' : (isCurrent ? '#f59e0b' : 'rgba(148,163,184,0.35)'));

    ctx.fillStyle = color + '33';
    ctx.strokeStyle = color;
    ctx.lineWidth = isCurrent ? 2.5 : 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(xPos(iv.start), y, xPos(iv.end) - xPos(iv.start), 16, 4);
    else ctx.rect(xPos(iv.start), y, xPos(iv.end) - xPos(iv.start), 16);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = '9px Fira Code,monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('#' + iv.id + ' (arrives ' + (iv.arrivalOrder + 1) + ')', xPos(iv.start) + 4, y + 8);

    if (isOptimal) {
      ctx.strokeStyle = 'rgba(168,85,247,0.6)'; ctx.lineWidth = 1;
      ctx.strokeRect(xPos(iv.start) - 1, y - 1, xPos(iv.end) - xPos(iv.start) + 2, 18);
    }
  });

  ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.font = '8px Poppins,sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Purple outline = part of offline optimal solution', pad.left, H - 8);
}

function oaSetStatus(elId, msg, cls) {
  var el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg; el.className = 'oa-status ' + (cls || '');
}

function oaInit() {
  document.querySelectorAll('.oa-mode-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.oa-mode-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var mode = tab.getAttribute('data-mode');
      document.querySelectorAll('.oa-panel').forEach(function(p) { p.classList.remove('active'); });
      var panel = document.getElementById('oaPanel' + mode[0].toUpperCase() + mode.slice(1));
      if (panel) panel.classList.add('active');
      if (mode === 'ski') oaRenderSkiChart();
      else oaRenderIntervalCanvas();
    });
  });

  var skiApplyBtn = document.getElementById('oaSkiApplyBtn');
  if (skiApplyBtn) skiApplyBtn.addEventListener('click', function() {
    var rentInput = document.getElementById('oaRentCost');
    var buyInput = document.getElementById('oaBuyCost');
    oaState.ski.rentCost = Math.max(1, parseInt(rentInput.value) || 1);
    oaState.ski.buyCost = Math.min(100, Math.max(2, parseInt(buyInput.value) || 10));
    oaSkiReset();
  });

  document.querySelectorAll('.oa-strategy-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.oa-strategy-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      oaState.ski.strategy = btn.getAttribute('data-strat');
      oaSkiReset();
    });
  });

  var skiDayBtn = document.getElementById('oaSkiDayBtn');
  var skiAdversaryBtn = document.getElementById('oaSkiAdversaryBtn');
  var skiResetBtn = document.getElementById('oaSkiResetBtn');
  if (skiDayBtn) skiDayBtn.addEventListener('click', oaSkiAdvanceDay);
  if (skiAdversaryBtn) skiAdversaryBtn.addEventListener('click', oaSkiAdversaryStop);
  if (skiResetBtn) skiResetBtn.addEventListener('click', oaSkiReset);

  var intervalGenBtn = document.getElementById('oaIntervalGenBtn');
  var intervalAdversaryBtn = document.getElementById('oaIntervalAdversaryBtn');
  var intervalResetBtn = document.getElementById('oaIntervalResetBtn');
  var intervalNextBtn = document.getElementById('oaIntervalNextBtn');

  if (intervalGenBtn) intervalGenBtn.addEventListener('click', function() { oaStartIntervalRound(oaGenerateIntervals()); });
  if (intervalAdversaryBtn) intervalAdversaryBtn.addEventListener('click', function() { oaStartIntervalRound(oaGenerateAdversarialIntervals()); });
  if (intervalResetBtn) intervalResetBtn.addEventListener('click', function() { oaStartIntervalRound(oaState.interval.intervals.length ? oaState.interval.intervals : oaGenerateIntervals()); });
  if (intervalNextBtn) intervalNextBtn.addEventListener('click', oaIntervalNext);

  oaSkiReset();
  oaStartIntervalRound(oaGenerateIntervals());

  window.addEventListener('resize', function() {
    oaRenderSkiChart();
    oaRenderIntervalCanvas();
  });
}