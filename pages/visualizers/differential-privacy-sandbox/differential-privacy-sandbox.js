document.addEventListener('DOMContentLoaded', function() {
  dpInit();
});

/* ─── Synthetic dataset ─── */
let DP_NAMES = [
  'Alice','Bob','Carol','David','Eve','Frank','Grace','Hank',
  'Iris','Jack','Karen','Leo','Mia','Nate','Olivia','Paul',
  'Quinn','Rosa','Sam','Tina',
];

let dpState = {
  dataset   : [],
  attribute : 'salary',
  queryType : 'mean',
  epsilon   : 1.0,
  threshold : 50,
};

/* ─── Generate dataset ─── */
function dpGenerateDataset() {
  dpState.dataset = DP_NAMES.map(function(name) {
    return {
      name   : name,
      salary : Math.round(30 + Math.random() * 120),  // $30k-$150k
      health : Math.random() < 0.35 ? 1 : 0,         // 35% positive
    };
  });
}

/* ─── True query values ─── */
function dpTrueAnswer(dataset, attr, qtype, threshold) {
  let values = dataset.map(function(d) { return d[attr]; });
  if (qtype === 'mean')  return values.reduce(function(a,b){return a+b;},0) / values.length;
  if (qtype === 'sum')   return values.reduce(function(a,b){return a+b;},0);
  if (qtype === 'count') return values.filter(function(v){return v >= threshold;}).length;
  return 0;
}

/* ─── Sensitivity per query type ─── */
function dpSensitivity(attr, qtype, n) {
  let maxVal = attr === 'salary' ? 150 : 1;
  if (qtype === 'mean')  return maxVal / n;   // removing one person changes mean by at most maxVal/n
  if (qtype === 'sum')   return maxVal;        // removing one person changes sum by at most maxVal
  if (qtype === 'count') return 1;             // removing one person changes count by at most 1
  return 1;
}

/* ─── Sample Laplace noise ─── */
function dpLaplaceNoise(scale) {
  // Inverse CDF sampling: Laplace(0, scale)
  let u = Math.random() - 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

/* ─── Render dataset table ─── */
function dpRenderTable(highlightIdx) {
  let tbody = document.getElementById('dpDataBody');
  let attrHeader = document.getElementById('dpAttrHeader');
  if (!tbody) return;
  if (attrHeader) attrHeader.textContent = dpState.attribute === 'salary' ? 'Salary ($k)' : 'Health Flag';

  tbody.innerHTML = dpState.dataset.map(function(person, i) {
    let val   = person[dpState.attribute];
    let isHighlighted = i === highlightIdx;
    let dotColor = isHighlighted ? '#ef4444' : 'rgba(148,163,184,0.2)';
    return '<tr class="' + (isHighlighted ? 'dp-highlighted' : '') + '">' +
      '<td>' + (i+1) + '</td>' +
      '<td>' + person.name + '</td>' +
      '<td>' + val + '</td>' +
      '<td style="text-align:center"><span class="dp-highlight-dot" style="background:' + dotColor + '"></span></td>' +
    '</tr>';
  }).join('');

  // Update true stats
  let n = dpState.dataset.length;
  let mean = dpTrueAnswer(dpState.dataset, dpState.attribute, 'mean', dpState.threshold);
  let count = dpTrueAnswer(dpState.dataset, dpState.attribute, 'count', dpState.threshold);

  let nEl = document.getElementById('dpN');
  let meanEl = document.getElementById('dpTrueMean');
  let countEl = document.getElementById('dpTrueCount');
  if (nEl) nEl.textContent = n;
  if (meanEl) meanEl.textContent = mean.toFixed(2);
  if (countEl) countEl.textContent = count + (dpState.attribute === 'salary' ? ' (≥ $' + dpState.threshold + 'k)' : ' (= 1)');
}

/* ─── Update epsilon display ─── */
function dpUpdateEpsilonDisplay() {
  let eps = dpState.epsilon;
  let valEl = document.getElementById('dpEpsilonVal');
  let interpEl = document.getElementById('dpEpsInterp');
  let sensEl = document.getElementById('dpSensitivity');
  let scaleEl = document.getElementById('dpLaplaceScale');

  if (valEl) valEl.textContent = eps.toFixed(2);

  let interp = eps < 0.5  ? 'Very high privacy, large error' :
               eps < 1.5  ? 'Balanced privacy & accuracy' :
               eps < 3.0  ? 'Lower privacy, smaller error' :
                             'Low privacy, near-accurate results';
  if (interpEl) interpEl.textContent = interp;

  let n = dpState.dataset.length;
  let sens = dpSensitivity(dpState.attribute, dpState.queryType, n);
  let scale = sens / eps;

  if (sensEl) sensEl.textContent = sens.toFixed(4);
  if (scaleEl) scaleEl.textContent = scale.toFixed(4);

  dpDrawHistogram(scale);
}

/* ─── Run a single DP query ─── */
function dpRunQuery() {
  let n = dpState.dataset.length;
  let trueAns = dpTrueAnswer(dpState.dataset, dpState.attribute, dpState.queryType, dpState.threshold);
  let sens  = dpSensitivity(dpState.attribute, dpState.queryType, n);
  let scale = sens / dpState.epsilon;
  let noise = dpLaplaceNoise(scale);
  let noisyAns = trueAns + noise;

  // Show result
  let placeholder = document.getElementById('dpResultPlaceholder');
  let inner = document.getElementById('dpResultInner');
  if (placeholder) placeholder.classList.add('hidden');
  if (inner) inner.classList.remove('hidden');

  let trueEl  = document.getElementById('dpTrueAnswer');
  let noiseEl = document.getElementById('dpNoiseAdded');
  let noisyEl = document.getElementById('dpNoisyAnswer');
  let errEl   = document.getElementById('dpError');

  if (trueEl)  trueEl.textContent  = trueAns.toFixed(3);
  if (noiseEl) noiseEl.textContent = (noise >= 0 ? '+' : '') + noise.toFixed(3);
  if (noisyEl) noisyEl.textContent = noisyAns.toFixed(3);
  if (errEl)   errEl.textContent   = Math.abs(noise).toFixed(3);
}

/* ─── Run 100 queries (budget composition demo) ─── */
function dpRun100Queries() {
  let n = dpState.dataset.length;
  let trueAns = dpTrueAnswer(dpState.dataset, dpState.attribute, dpState.queryType, dpState.threshold);
  let sens  = dpSensitivity(dpState.attribute, dpState.queryType, n);
  let scale = sens / dpState.epsilon;

  let results = [];
  for (let i = 0; i < 100; i++) results.push(trueAns + dpLaplaceNoise(scale));
  let averaged = results.reduce(function(a,b){return a+b;},0) / results.length;

  // Show composition card
  let compCard = document.getElementById('dpCompositionCard');
  if (compCard) compCard.classList.remove('hidden');

  let compResult = document.getElementById('dpCompResult');
  if (compResult) {
    compResult.textContent = '100 queries averaged: ' + averaged.toFixed(3) + ' (true: ' + trueAns.toFixed(3) + ', error: ' + Math.abs(averaged - trueAns).toFixed(3) + '). ' +
      'Privacy budget consumed: 100 × ε = ' + (100 * dpState.epsilon).toFixed(1) + '.';
  }

  dpDrawCompositionChart(results, trueAns);

  // Also show in main result
  dpRunQuery();
}

/* ─── Histogram of Laplace noise ─── */
function dpDrawHistogram(scale) {
  let canvas = document.getElementById('dpHistCanvas');
  if (!canvas) return;
  let wrap = canvas.parentElement;
  canvas.width = wrap.clientWidth; canvas.height = 180;
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let pad = { top: 15, right: 20, bottom: 30, left: 40 };
  let plotW = canvas.width - pad.left - pad.right;
  let plotH = canvas.height - pad.top - pad.bottom;

  // Sample noise values for the histogram
  let samples = 3000;
  let values = [];
  for (let i = 0; i < samples; i++) values.push(dpLaplaceNoise(scale));

  let minV = Math.min.apply(null, values); let maxV = Math.max.apply(null, values);
  let range = Math.max(maxV - minV, 0.001);
  let bins = 40;
  let counts = new Array(bins).fill(0);
  values.forEach(function(v) {
    let b = Math.floor(((v - minV) / range) * (bins - 1));
    counts[Math.max(0, Math.min(bins-1, b))]++;
  });
  let maxCount = Math.max.apply(null, counts);

  // Draw bars
  let barW = plotW / bins;
  counts.forEach(function(c, i) {
    let x = pad.left + i * barW;
    let h = (c / maxCount) * plotH;
    let t = i / bins; // 0=left, 1=right
    // color gradient from cyan to purple
    let r = Math.round(6 + t * 162);
    let g = Math.round(182 - t * 97);
    let b = Math.round(212 + t * 35);
    ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.7)';
    ctx.fillRect(x, pad.top + plotH - h, barW - 1, h);
  });

  // Axes
  ctx.strokeStyle = 'rgba(148,163,184,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH);
  ctx.lineTo(pad.left + plotW, pad.top + plotH);
  ctx.stroke();

  // Zero line
  let zeroX = pad.left + ((0 - minV) / range) * plotW;
  if (zeroX >= pad.left && zeroX <= pad.left + plotW) {
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(zeroX, pad.top); ctx.lineTo(zeroX, pad.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '9px Fira Code,monospace'; ctx.textAlign = 'center';
    ctx.fillText('0', zeroX, pad.top + plotH + 14);
  }

  // X labels at extremes
  ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.font = '9px Fira Code,monospace'; ctx.textAlign = 'center';
  ctx.fillText(minV.toFixed(1), pad.left, pad.top + plotH + 14);
  ctx.fillText(maxV.toFixed(1), pad.left + plotW, pad.top + plotH + 14);

  // Title annotation
  ctx.fillStyle = 'rgba(168,85,247,0.8)'; ctx.font = 'bold 9px Poppins,sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Laplace(0, b=' + scale.toFixed(3) + ')  —  ε=' + dpState.epsilon.toFixed(2), pad.left + 4, pad.top + 10);

  let infoEl = document.getElementById('dpHistInfo');
  if (infoEl) infoEl.textContent = 'Scale b = ' + scale.toFixed(3) + '. ~68% of noise falls within ±' + scale.toFixed(2) + ' of 0. ' + (dpState.epsilon < 1 ? 'Wide distribution = strong privacy, less accuracy.' : dpState.epsilon > 2 ? 'Narrow distribution = weak privacy, high accuracy.' : 'Moderate noise — balanced tradeoff.');
}

/* ─── Privacy-Utility tradeoff chart ─── */
function dpDrawTradeoffChart() {
  let canvas = document.getElementById('dpTradeoffCanvas');
  if (!canvas) return;
  let wrap = canvas.parentElement;
  canvas.width = wrap.clientWidth; canvas.height = 180;
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let pad = { top: 15, right: 15, bottom: 28, left: 50 };
  let plotW = canvas.width - pad.left - pad.right;
  let plotH = canvas.height - pad.top - pad.bottom;

  let n = dpState.dataset.length;
  let sens = dpSensitivity(dpState.attribute, dpState.queryType, n);
  let trueAns = dpTrueAnswer(dpState.dataset, dpState.attribute, dpState.queryType, dpState.threshold);

  // Sample 50 epsilon values from 0.1 to 5.0, compute expected error = E[|Laplace(scale)|] = scale
  let epsilons = [];
  for (let i = 0; i <= 50; i++) epsilons.push(0.1 + (i / 50) * 4.9);
  let errors = epsilons.map(function(eps) { return sens / eps; }); // expected |Laplace(b)| = b = sens/eps

  let maxError = Math.max.apply(null, errors);

  function xPos(eps) { return pad.left + ((eps - 0.1) / 4.9) * plotW; }
  function yPos(err) { return pad.top + (1 - err / maxError) * plotH; }

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i <= 4; i++) {
    let y = pad.top + (i/4) * plotH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left+plotW, y); ctx.stroke();
    let errLabel = (maxError * (1 - i/4)).toFixed(2);
    ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.font = '8px Fira Code,monospace'; ctx.textAlign = 'right';
    ctx.fillText(errLabel, pad.left - 4, y + 3);
  }

  // X axis labels
  ctx.textAlign = 'center';
  [0.1, 1, 2, 3, 4, 5].forEach(function(eps) {
    let x = xPos(eps);
    ctx.fillText(eps, x, canvas.height - 10);
  });

  // Axis labels
  ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.font = '8px Poppins,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('ε (epsilon)', pad.left + plotW/2, canvas.height - 2);

  // Tradeoff curve (gradient colored)
  for (let i = 0; i < epsilons.length - 1; i++) {
    let x1 = xPos(epsilons[i]); let y1 = yPos(errors[i]);
    let x2 = xPos(epsilons[i+1]); let y2 = yPos(errors[i+1]);
    let t = i / epsilons.length;
    let r = Math.round(239 - t * (239-34));
    let g = Math.round(68  + t * (197-68));
    let b = Math.round(68  - t * 46);
    ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  }

  // Current epsilon marker
  let curX = xPos(dpState.epsilon);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.setLineDash([3,2]);
  ctx.beginPath(); ctx.moveTo(curX, pad.top); ctx.lineTo(curX, pad.top+plotH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#a855f7'; ctx.font = 'bold 9px Fira Code,monospace'; ctx.textAlign = 'center';
  ctx.fillText('ε='+dpState.epsilon.toFixed(1), curX, pad.top - 3);
}

/* ─── Composition chart ─── */
function dpDrawCompositionChart(results, trueAns) {
  let canvas = document.getElementById('dpCompositionCanvas');
  if (!canvas) return;
  let wrap = canvas.parentElement;
  canvas.width = wrap.clientWidth; canvas.height = 160;
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let pad = { top: 15, right: 15, bottom: 25, left: 50 };
  let plotW = canvas.width - pad.left - pad.right;
  let plotH = canvas.height - pad.top - pad.bottom;

  // Running average after k queries
  let runAvg = [];
  let sum = 0;
  results.forEach(function(v, i) { sum += v; runAvg.push(sum / (i+1)); });

  let allVals = runAvg.concat([trueAns]);
  let minV = Math.min.apply(null, allVals) - 1;
  let maxV = Math.max.apply(null, allVals) + 1;

  function xPos(i) { return pad.left + (i / (results.length-1)) * plotW; }
  function yPos(v) { return pad.top + (1 - (v-minV)/(maxV-minV)) * plotH; }

  // True answer line
  ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.5; ctx.setLineDash([5,3]);
  ctx.beginPath();
  ctx.moveTo(pad.left, yPos(trueAns)); ctx.lineTo(pad.left+plotW, yPos(trueAns));
  ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#22c55e'; ctx.font = '8px Fira Code,monospace'; ctx.textAlign = 'left';
  ctx.fillText('true=' + trueAns.toFixed(2), pad.left+2, yPos(trueAns) - 3);

  // Running average
  ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2;
  ctx.beginPath();
  runAvg.forEach(function(v, i) {
    if (i === 0) ctx.moveTo(xPos(i), yPos(v));
    else ctx.lineTo(xPos(i), yPos(v));
  });
  ctx.stroke();

  // X labels
  ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.font = '8px Fira Code,monospace'; ctx.textAlign = 'center';
  [0,25,50,75,99].forEach(function(i) { ctx.fillText(i+1, xPos(i), canvas.height - 8); });
  ctx.fillText('query count', pad.left+plotW/2, canvas.height - 1);
}

/* ─── Attacker demo ─── */
function dpRunAttackDemo() {
  let targetIdx = parseInt(document.getElementById('dpTargetPerson').value);
  let targetPerson = dpState.dataset[targetIdx];

  let fullDataset = dpState.dataset;
  let withoutTarget = dpState.dataset.filter(function(_, i){ return i !== targetIdx; });

  let n = fullDataset.length;
  let sens = dpSensitivity(dpState.attribute, dpState.queryType, n);
  let scale = sens / dpState.epsilon;

  let trueWith    = dpTrueAnswer(fullDataset, dpState.attribute, dpState.queryType, dpState.threshold);
  let trueWithout = dpTrueAnswer(withoutTarget, dpState.attribute, dpState.queryType, dpState.threshold);
  let trueDiff    = Math.abs(trueWith - trueWithout);

  // DP queries (noisy)
  let noisyWith    = trueWith    + dpLaplaceNoise(scale);
  let noisyWithout = trueWithout + dpLaplaceNoise(scale);
  let noisyDiff    = Math.abs(noisyWith - noisyWithout);

  let resultEl = document.getElementById('dpAttackerResult');
  if (resultEl) resultEl.classList.remove('hidden');

  document.getElementById('dpAtkWithRaw').textContent    = trueWith.toFixed(3);
  document.getElementById('dpAtkWithoutRaw').textContent = trueWithout.toFixed(3);
  document.getElementById('dpAtkDiffRaw').textContent    = trueDiff.toFixed(3) + ' ← ' + targetPerson.name + '\'s exact ' + dpState.attribute;
  document.getElementById('dpAtkWithDp').textContent     = noisyWith.toFixed(3);
  document.getElementById('dpAtkWithoutDp').textContent  = noisyWithout.toFixed(3);
  document.getElementById('dpAtkDiffDp').textContent     = noisyDiff.toFixed(3);
  document.getElementById('dpAtkEps').textContent        = dpState.epsilon.toFixed(2);

  // Verdict: if noisy diff is within 2x of scale, attacker can't reliably distinguish
  let verdictEl = document.getElementById('dpAtkVerdict');
  let isProtected = noisyDiff < scale * 2;
  if (verdictEl) {
    verdictEl.className = 'dp-attack-verdict ' + (isProtected ? 'dp-verdict-good' : 'dp-verdict-bad');
    verdictEl.textContent = isProtected
      ? '✅ Noise overwhelms signal — ' + targetPerson.name + '\'s presence undetectable'
      : '⚠️ Noise too small at ε=' + dpState.epsilon.toFixed(1) + ' — lower ε for better protection';
  }

  // Also highlight target in table
  dpRenderTable(targetIdx);
}

/* ─── Populate person dropdown ─── */
function dpPopulatePersonDropdown() {
  let sel = document.getElementById('dpTargetPerson');
  if (!sel) return;
  sel.innerHTML = dpState.dataset.map(function(p, i) {
    return '<option value="' + i + '">' + p.name + ' (' + dpState.attribute + '=' + p[dpState.attribute] + ')</option>';
  }).join('');
}

/* ─── Init ─── */
function dpInit() {
  dpGenerateDataset();
  dpRenderTable(-1);
  dpUpdateEpsilonDisplay();
  dpDrawTradeoffChart();
  dpPopulatePersonDropdown();

  // Attribute selector
  let attrSel = document.getElementById('dpAttrSelect');
  if (attrSel) {
    attrSel.addEventListener('change', function() {
      dpState.attribute = attrSel.value;
      dpRenderTable(-1);
      dpUpdateEpsilonDisplay();
      dpDrawTradeoffChart();
      dpPopulatePersonDropdown();
    });
  }

  // Regenerate dataset
  let shuffleBtn = document.getElementById('dpShuffleBtn');
  if (shuffleBtn) shuffleBtn.addEventListener('click', function() {
    dpGenerateDataset();
    dpRenderTable(-1);
    dpUpdateEpsilonDisplay();
    dpDrawTradeoffChart();
    dpPopulatePersonDropdown();
    // Clear results
    let placeholder = document.getElementById('dpResultPlaceholder');
    let inner = document.getElementById('dpResultInner');
    if (placeholder) placeholder.classList.remove('hidden');
    if (inner) inner.classList.add('hidden');
    let attResult = document.getElementById('dpAttackerResult');
    if (attResult) attResult.classList.add('hidden');
    let compCard = document.getElementById('dpCompositionCard');
    if (compCard) compCard.classList.add('hidden');
  });

  // Epsilon slider
  let epsSl = document.getElementById('dpEpsilon');
  if (epsSl) {
    epsSl.addEventListener('input', function() {
      dpState.epsilon = parseFloat(epsSl.value);
      dpUpdateEpsilonDisplay();
      dpDrawTradeoffChart();
    });
  }

  // Query type buttons
  document.querySelectorAll('.dp-query-type').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.dp-query-type').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      dpState.queryType = btn.getAttribute('data-qtype');

      let thrRow = document.getElementById('dpThresholdRow');
      if (thrRow) thrRow.style.display = dpState.queryType === 'count' ? '' : 'none';

      dpUpdateEpsilonDisplay();
      dpDrawTradeoffChart();
    });
  });

  // Threshold input
  let thrInput = document.getElementById('dpThreshold');
  if (thrInput) {
    thrInput.addEventListener('input', function() {
      dpState.threshold = parseFloat(thrInput.value) || 50;
      dpRenderTable(-1);
    });
  }

  // Query buttons
  let queryBtn = document.getElementById('dpQueryBtn');
  let query100Btn = document.getElementById('dpQuery100Btn');
  if (queryBtn)   queryBtn.addEventListener('click', dpRunQuery);
  if (query100Btn) query100Btn.addEventListener('click', dpRun100Queries);

  // Attack button
  let attBtn = document.getElementById('dpAttackBtn');
  if (attBtn) attBtn.addEventListener('click', dpRunAttackDemo);

  // Person dropdown change → update table highlight
  let personSel = document.getElementById('dpTargetPerson');
  if (personSel) {
    personSel.addEventListener('change', function() {
      dpRenderTable(parseInt(personSel.value));
    });
  }

  // Initial histogram draw
  let n = dpState.dataset.length;
  let sens = dpSensitivity(dpState.attribute, dpState.queryType, n);
  dpDrawHistogram(sens / dpState.epsilon);

  // Resize
  window.addEventListener('resize', function() {
    dpUpdateEpsilonDisplay();
    dpDrawTradeoffChart();
  });
}