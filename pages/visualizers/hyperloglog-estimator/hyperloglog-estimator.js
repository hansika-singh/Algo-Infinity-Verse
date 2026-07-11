document.addEventListener('DOMContentLoaded', function() {
  hlInit();
});

var hlState = {
  m: 64,
  b: 6,
  registers: [],
  streamed: 0,
  trueSet: {},
  itemCounter: 0,
  chartHistory: [],
  duplicates: false,
};

function hlHash32(str) {
  var h = 2166136261;
  for (var i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h >>>= 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function hlLeadingZeros(x, bits) {
  if (x === 0) return bits;
  var count = 0;
  for (var i = bits - 1; i >= 0; i--) {
    if ((x >> i) & 1) break;
    count++;
  }
  return count;
}

function hlAlpha(m) {
  if (m === 16) return 0.673;
  if (m === 32) return 0.697;
  if (m === 64) return 0.709;
  return 0.7213 / (1 + 1.079 / m);
}

function hlProcessItem(itemStr) {
  var b = hlState.b;
  var h = hlHash32(itemStr);
  var bucketIdx = h >>> (32 - b);
  var rest = (h << b) >>> b;
  var restBits = 32 - b;
  var run = hlLeadingZeros(rest, restBits) + 1;

  var isNewMax = run > hlState.registers[bucketIdx];
  if (isNewMax) hlState.registers[bucketIdx] = run;

  return { bucketIdx: bucketIdx, run: run, isNewMax: isNewMax, hashHex: '0x' + h.toString(16).padStart(8, '0') };
}

function hlEstimate() {
  var m = hlState.m;
  var sum = 0;
  hlState.registers.forEach(function(r) { sum += Math.pow(2, -r); });
  var alpha = hlAlpha(m);
  var raw = alpha * m * m / sum;

  if (raw <= 2.5 * m) {
    var zeros = hlState.registers.filter(function(r) { return r === 0; }).length;
    if (zeros > 0) raw = m * Math.log(m / zeros);
  }

  return Math.round(raw);
}

function hlRenderRegisters(justUpdatedIdx) {
  var grid = document.getElementById('hlRegistersGrid');
  if (!grid) return;
  grid.textContent = '';
  var frag = document.createDocumentFragment();
  hlState.registers.forEach(function(r, i) {
    var cell = document.createElement('div');
    cell.className = 'hl-register-cell' + (r > 0 ? ' nonzero' : '') + (i === justUpdatedIdx ? ' just-updated' : '');
    cell.textContent = r;
    frag.appendChild(cell);
  });
  grid.appendChild(frag);
}

function hlRenderStats() {
  var estimate = hlEstimate();
  var trueCount = Object.keys(hlState.trueSet).length;
  var error = trueCount > 0 ? Math.abs(estimate - trueCount) / trueCount * 100 : 0;

  var estBigEl = document.getElementById('hlEstimateBig');
  var streamedEl = document.getElementById('hlStreamed');
  var trueEl = document.getElementById('hlTrueCount');
  var errorEl = document.getElementById('hlErrorPct');

  if (estBigEl) estBigEl.textContent = estimate.toLocaleString();
  if (streamedEl) streamedEl.textContent = hlState.streamed;
  if (trueEl) trueEl.textContent = trueCount;
  if (errorEl) errorEl.textContent = trueCount > 0 ? error.toFixed(1) + '%' : '—';

  var hllBytes = hlState.m * 1;
  var setBytes = trueCount * 24;
  var memHllEl = document.getElementById('hlMemHll');
  var memSetEl = document.getElementById('hlMemSet');
  var memSavingsEl = document.getElementById('hlMemSavings');

  if (memHllEl) memHllEl.textContent = hllBytes + ' bytes';
  if (memSetEl) memSetEl.textContent = setBytes.toLocaleString() + ' bytes (~24B/item est.)';
  if (memSavingsEl) {
    var pct = setBytes > 0 ? Math.round((1 - hllBytes / setBytes) * 100) : 0;
    memSavingsEl.textContent = setBytes > hllBytes ? pct + '% smaller' : '—';
  }

  hlState.chartHistory.push({ streamed: hlState.streamed, estimate: estimate, trueCount: trueCount });
  hlDrawChart();
}

function hlDrawChart() {
  var canvas = document.getElementById('hlChartCanvas');
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 200;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var hist = hlState.chartHistory;
  if (hist.length < 2) return;

  var W = canvas.width; var H = canvas.height;
  var pad = { top: 15, right: 15, bottom: 25, left: 50 };
  var plotW = W - pad.left - pad.right;
  var plotH = H - pad.top - pad.bottom;

  var maxVal = Math.max.apply(null, hist.map(function(h) { return Math.max(h.estimate, h.trueCount); }).concat([10]));

  function xPos(i) { return pad.left + (i / (hist.length - 1)) * plotW; }
  function yPos(v) { return pad.top + (1 - v / maxVal) * plotH; }

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (var i = 0; i <= 4; i++) {
    var y = pad.top + (i / 4) * plotH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    var val = Math.round(maxVal * (1 - i / 4));
    ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.font = '8px Fira Code,monospace'; ctx.textAlign = 'right';
    ctx.fillText(val, pad.left - 4, y + 3);
  }

  ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2;
  ctx.beginPath();
  hist.forEach(function(h, i) { var x = xPos(i); var y = yPos(h.trueCount); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.stroke();

  ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2;
  ctx.beginPath();
  hist.forEach(function(h, i) { var x = xPos(i); var y = yPos(h.estimate); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.stroke();

  ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.font = '8px Fira Code,monospace'; ctx.textAlign = 'center';
  ctx.fillText('items streamed', pad.left + plotW / 2, H - 4);
}

function hlSetStatus(msg) {
  var el = document.getElementById('hlStatus');
  if (el) el.textContent = msg;
}

function hlUpdateHashTrace(itemStr, result) {
  var el = document.getElementById('hlHashTrace');
  if (!el) return;
  el.textContent = '';
  el.appendChild(document.createTextNode('item "'));
  var strong = document.createElement('strong');
  strong.textContent = itemStr;
  el.appendChild(strong);
  el.appendChild(document.createTextNode('" → hash ' + result.hashHex + ' → bucket [' + result.bucketIdx + '], leading-zero-run = ' + result.run + (result.isNewMax ? ' → new max for this bucket!' : ' (not a new max — bucket already has a longer run)')));
}

function hlAddOneItem() {
  var itemStr;
  if (hlState.duplicates && Math.random() < 0.3 && hlState.itemCounter > 5) {
    var pastId = Math.floor(Math.random() * hlState.itemCounter);
    itemStr = 'item-' + pastId;
  } else {
    itemStr = 'item-' + hlState.itemCounter;
    hlState.itemCounter++;
  }

  hlState.trueSet[itemStr] = true;
  hlState.streamed++;

  var result = hlProcessItem(itemStr);
  hlUpdateHashTrace(itemStr, result);
  hlRenderRegisters(result.isNewMax ? result.bucketIdx : undefined);
  hlRenderStats();

  var trueCount = Object.keys(hlState.trueSet).length;
  var est = hlEstimate();
  hlSetStatus('Streamed ' + hlState.streamed + ' items (' + trueCount + ' unique). Current estimate: ' + est.toLocaleString() + '.');
}

function hlStreamMany() {
  var count = 500;
  var done = 0;
  function loop() {
    if (done >= count) { hlSetStatus('Streamed ' + count + ' items. Final estimate: ' + hlEstimate().toLocaleString() + ' vs true count: ' + Object.keys(hlState.trueSet).length + '.'); return; }
    var batchSize = 10;
    for (var i = 0; i < batchSize && done < count; i++, done++) hlAddOneItem();
    requestAnimationFrame(loop);
  }
  loop();
}

function hlUpdateMParams() {
  var slider = document.getElementById('hlMSlider');
  var exp = parseInt(slider.value);
  hlState.b = exp;
  hlState.m = Math.pow(2, exp);

  var mValEl = document.getElementById('hlMVal');
  if (mValEl) mValEl.textContent = 'm = ' + hlState.m;

  var errorHintEl = document.getElementById('hlErrorHint');
  if (errorHintEl) errorHintEl.textContent = 'Standard error ≈ ' + (104 / Math.sqrt(hlState.m)).toFixed(1) + '%';
}

function hlReset() {
  hlState.registers = new Array(hlState.m).fill(0);
  hlState.streamed = 0;
  hlState.trueSet = {};
  hlState.itemCounter = 0;
  hlState.chartHistory = [];

  hlRenderRegisters();
  hlRenderStats();

  var traceEl = document.getElementById('hlHashTrace');
  if (traceEl) traceEl.textContent = 'Stream an item to see its hash split into bucket index + leading-zero-run.';

  hlSetStatus('Reset with m = ' + hlState.m + ' registers. Stream items to watch the estimate converge.');
}

function hlInit() {
  hlUpdateMParams();
  hlReset();

  var mSlider = document.getElementById('hlMSlider');
  if (mSlider) {
    mSlider.addEventListener('input', function() {
      hlUpdateMParams();
      hlReset();
    });
  }

  var streamBtn = document.getElementById('hlStreamBtn');
  var stepBtn = document.getElementById('hlStepBtn');
  var resetBtn = document.getElementById('hlResetBtn');
  if (streamBtn) streamBtn.addEventListener('click', hlStreamMany);
  if (stepBtn) stepBtn.addEventListener('click', hlAddOneItem);
  if (resetBtn) resetBtn.addEventListener('click', hlReset);

  var dupCheck = document.getElementById('hlDuplicates');
  if (dupCheck) {
    dupCheck.addEventListener('change', function() {
      hlState.duplicates = dupCheck.checked;
    });
  }

  window.addEventListener('resize', hlDrawChart);
}