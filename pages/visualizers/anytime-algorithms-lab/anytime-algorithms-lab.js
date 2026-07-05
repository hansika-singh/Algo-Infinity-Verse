document.addEventListener('DOMContentLoaded', function() {
  aalInit();
});

/* ─── State ─── */
var aalState = {
  numCities : 8,
  cities    : [],
  optimal   : { tour: [], cost: Infinity },
  snapshots : { astar: [], annealing: [], genetic: [] }, // each: [{tour, cost, iter, extra}]
  computed  : false,
};

/* ─── Distance helpers ─── */
function aalDist(a, b) { return Math.sqrt((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y)); }

function aalTourCost(tour, cities) {
  var cost = 0;
  for (var i = 0; i < tour.length; i++) {
    var a = cities[tour[i]];
    var b = cities[tour[(i+1) % tour.length]];
    cost += aalDist(a, b);
  }
  return cost;
}

/* ─── Generate random cities ─── */
function aalGenerateCities(n) {
  var cities = [];
  for (var i = 0; i < n; i++) {
    cities.push({ x: 30 + Math.random() * 240, y: 25 + Math.random() * 170 });
  }
  return cities;
}

/* ─── Brute force optimal (n <= 10) ─── */
function aalBruteForce(cities) {
  var n = cities.length;
  var indices = [];
  for (var i = 1; i < n; i++) indices.push(i); // fix city 0 as start

  var best = null; var bestCost = Infinity;

  function permute(arr, l) {
    if (l === arr.length) {
      var tour = [0].concat(arr);
      var cost = aalTourCost(tour, cities);
      if (cost < bestCost) { bestCost = cost; best = tour.slice(); }
      return;
    }
    for (var i = l; i < arr.length; i++) {
      var tmp = arr[l]; arr[l] = arr[i]; arr[i] = tmp;
      permute(arr, l + 1);
      tmp = arr[l]; arr[l] = arr[i]; arr[i] = tmp;
    }
  }
  permute(indices, 0);

  return { tour: best, cost: bestCost };
}

/* ─── Weighted A* (simplified as nearest-neighbor with progressively
   relaxed greediness, simulating weight decay from greedy to near-optimal) ─── */
function aalRunWeightedAStar(cities, maxIters) {
  var n = cities.length;
  var snapshots = [];

  // We simulate "weight" decaying from 5.0 (very greedy) to 1.0 (near optimal)
  // by running nearest-neighbor + progressively more 2-opt passes as weight decreases.
  var weights = [];
  for (var i = 0; i <= maxIters; i++) {
    var t = i / maxIters;
    weights.push(5.0 - t * 4.0); // 5.0 -> 1.0
  }

  // Base: nearest neighbor tour (this is what high-weight/greedy gives)
  function nearestNeighborTour() {
    var visited = new Array(n).fill(false);
    var tour = [0]; visited[0] = true;
    for (var step = 1; step < n; step++) {
      var last = tour[tour.length - 1];
      var bestNext = -1; var bestD = Infinity;
      for (var j = 0; j < n; j++) {
        if (!visited[j]) {
          var d = aalDist(cities[last], cities[j]);
          if (d < bestD) { bestD = d; bestNext = j; }
        }
      }
      tour.push(bestNext); visited[bestNext] = true;
    }
    return tour;
  }

  function twoOptPass(tour, passes) {
    var t = tour.slice();
    for (var p = 0; p < passes; p++) {
      var improved = false;
      for (var i = 0; i < n - 1; i++) {
        for (var j = i + 1; j < n; j++) {
          var newTour = t.slice(0, i).concat(t.slice(i, j+1).reverse(), t.slice(j+1));
          if (aalTourCost(newTour, cities) < aalTourCost(t, cities)) {
            t = newTour; improved = true;
          }
        }
      }
      if (!improved) break;
    }
    return t;
  }

  var baseTour = nearestNeighborTour();

  for (var i = 0; i <= maxIters; i++) {
    var w = weights[i];
    // Lower weight (closer to 1.0) => more 2-opt refinement passes
    var passes = Math.round((5.0 - w) * 2); // 0 passes at w=5, up to 8 passes at w=1
    var tour = twoOptPass(baseTour, passes);
    var cost = aalTourCost(tour, cities);
    snapshots.push({ tour: tour, cost: cost, iter: i, weight: w });
  }

  return snapshots;
}

/* ─── Simulated Annealing ─── */
function aalRunAnnealing(cities, maxIters) {
  var n = cities.length;
  var snapshots = [];

  // Random initial tour
  var tour = [];
  for (var i = 0; i < n; i++) tour.push(i);
  for (var i = tour.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i+1));
    var tmp = tour[i]; tour[i] = tour[j]; tour[j] = tmp;
  }

  var cost = aalTourCost(tour, cities);
  var bestTour = tour.slice(); var bestCost = cost;

  var T0 = 100; var Tmin = 0.5;

  for (var iter = 0; iter <= maxIters; iter++) {
    var t = iter / maxIters;
    var T = T0 * Math.pow(Tmin / T0, t); // exponential cooling

    // Random 2-swap neighbor
    var a = Math.floor(Math.random() * n);
    var b = Math.floor(Math.random() * n);
    if (a !== b) {
      var newTour = tour.slice();
      var tmp = newTour[a]; newTour[a] = newTour[b]; newTour[b] = tmp;
      var newCost = aalTourCost(newTour, cities);
      var delta = newCost - cost;

      if (delta < 0 || Math.random() < Math.exp(-delta / Math.max(T, 0.01))) {
        tour = newTour; cost = newCost;
        if (cost < bestCost) { bestCost = cost; bestTour = tour.slice(); }
      }
    }

    snapshots.push({ tour: bestTour.slice(), cost: bestCost, iter: iter, temperature: T, currentCost: cost });
  }

  return snapshots;
}

/* ─── Genetic Algorithm ─── */
function aalRunGenetic(cities, maxIters) {
  var n = cities.length;
  var popSize = 24;
  var snapshots = [];

  function randomTour() {
    var t = [];
    for (var i = 0; i < n; i++) t.push(i);
    for (var i = t.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i+1));
      var tmp = t[i]; t[i] = t[j]; t[j] = tmp;
    }
    return t;
  }

  function orderCrossover(p1, p2) {
    var start = Math.floor(Math.random() * n);
    var end   = start + Math.floor(Math.random() * (n - start));
    var child = new Array(n).fill(-1);
    for (var i = start; i <= end; i++) child[i] = p1[i];
    var pIdx = 0;
    for (var i = 0; i < n; i++) {
      if (child.indexOf(p2[i]) === -1) {
        while (child[pIdx] !== -1) pIdx++;
        child[pIdx] = p2[i];
      }
    }
    return child;
  }

  function mutate(tour, rate) {
    var t = tour.slice();
    if (Math.random() < rate) {
      var a = Math.floor(Math.random() * n);
      var b = Math.floor(Math.random() * n);
      var tmp = t[a]; t[a] = t[b]; t[b] = tmp;
    }
    return t;
  }

  function tournamentSelect(pop, costs) {
    var i1 = Math.floor(Math.random() * pop.length);
    var i2 = Math.floor(Math.random() * pop.length);
    return costs[i1] < costs[i2] ? pop[i1] : pop[i2];
  }

  var population = [];
  for (var i = 0; i < popSize; i++) population.push(randomTour());

  var bestTour = population[0]; var bestCost = aalTourCost(bestTour, cities);

  for (var gen = 0; gen <= maxIters; gen++) {
    var costs = population.map(function(t) { return aalTourCost(t, cities); });

    for (var i = 0; i < costs.length; i++) {
      if (costs[i] < bestCost) { bestCost = costs[i]; bestTour = population[i].slice(); }
    }

    // Build next generation (elitism: keep best)
    var newPop = [bestTour.slice()];
    while (newPop.length < popSize) {
      var parent1 = tournamentSelect(population, costs);
      var parent2 = tournamentSelect(population, costs);
      var child = orderCrossover(parent1, parent2);
      child = mutate(child, 0.15);
      newPop.push(child);
    }
    population = newPop;

    snapshots.push({ tour: bestTour.slice(), cost: bestCost, iter: gen, generation: gen, popAvg: costs.reduce(function(a,b){return a+b;},0)/costs.length });
  }

  return snapshots;
}

/* ─── Precompute everything ─── */
function aalPrecompute() {
  var statusEl = document.getElementById('aalPrecomputeStatus');
  if (statusEl) statusEl.textContent = 'Computing brute-force optimal...';

  var maxIters = 60;

  setTimeout(function() {
    aalState.optimal = aalBruteForce(aalState.cities);

    if (statusEl) statusEl.textContent = 'Running Weighted A*...';

    setTimeout(function() {
      aalState.snapshots.astar = aalRunWeightedAStar(aalState.cities, maxIters);

      if (statusEl) statusEl.textContent = 'Running Simulated Annealing...';

      setTimeout(function() {
        aalState.snapshots.annealing = aalRunAnnealing(aalState.cities, maxIters);

        if (statusEl) statusEl.textContent = 'Running Genetic Algorithm...';

        setTimeout(function() {
          aalState.snapshots.genetic = aalRunGenetic(aalState.cities, maxIters);

          aalState.computed = true;
          if (statusEl) statusEl.textContent = '✅ All 3 algorithms precomputed. Optimal cost: ' + aalState.optimal.cost.toFixed(1) + '. Drag the scrubber below.';

          // Enable scrubber
          var scrubber = document.getElementById('aalScrubber');
          var interruptBtn = document.getElementById('aalInterruptBtn');
          if (scrubber) scrubber.disabled = false;
          if (interruptBtn) interruptBtn.disabled = false;

          aalApplyScrubPosition(100);
          aalDrawChart();
        }, 30);
      }, 30);
    }, 30);
  }, 30);
}

/* ─── Canvas drawing: tour ─── */
function aalDrawTour(canvasId, tour, cities, color) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var wrap = canvas.parentElement;
  canvas.width  = wrap.clientWidth;
  canvas.height = 220;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!tour || tour.length === 0) return;

  var scaleX = canvas.width / 300;
  var scaleY = canvas.height / 220;

  // Draw edges
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (var i = 0; i < tour.length; i++) {
    var a = cities[tour[i]];
    var b = cities[tour[(i+1) % tour.length]];
    if (i === 0) ctx.moveTo(a.x * scaleX, a.y * scaleY);
    ctx.lineTo(b.x * scaleX, b.y * scaleY);
  }
  ctx.stroke();

  // Draw cities
  cities.forEach(function(c, idx) {
    var isStart = idx === tour[0];
    ctx.beginPath();
    ctx.arc(c.x * scaleX, c.y * scaleY, isStart ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isStart ? '#fff' : color;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

/* ─── Apply scrub position (0-100%) to all 3 panels ─── */
function aalApplyScrubPosition(pct) {
  if (!aalState.computed) return;

  var pctEl = document.getElementById('aalScrubberPct');
  if (pctEl) pctEl.textContent = Math.round(pct) + '%';

  var maxIdx = aalState.snapshots.astar.length - 1;
  var idx = Math.round((pct / 100) * maxIdx);
  idx = Math.max(0, Math.min(maxIdx, idx));

  var optimalCost = aalState.optimal.cost;

  // A*
  var aSnap = aalState.snapshots.astar[idx];
  aalDrawTour('aalCanvasAstar', aSnap.tour, aalState.cities, '#06b6d4');
  aalSetStat('aalCostAstar', aSnap.cost.toFixed(1));
  aalSetStat('aalGapAstar', '+' + (((aSnap.cost / optimalCost - 1) * 100).toFixed(1)) + '%');
  aalSetStat('aalWeightAstar', aSnap.weight.toFixed(2));
  aalSetBadge('aalBadgeAstar', idx === maxIdx ? 'Converged' : 'In progress');

  // Annealing
  var bSnap = aalState.snapshots.annealing[idx];
  aalDrawTour('aalCanvasAnnealing', bSnap.tour, aalState.cities, '#f59e0b');
  aalSetStat('aalCostAnnealing', bSnap.cost.toFixed(1));
  aalSetStat('aalGapAnnealing', '+' + (((bSnap.cost / optimalCost - 1) * 100).toFixed(1)) + '%');
  aalSetStat('aalTempAnnealing', bSnap.temperature.toFixed(2));
  aalSetBadge('aalBadgeAnnealing', idx === maxIdx ? 'Cooled' : 'Annealing');

  // Genetic
  var cSnap = aalState.snapshots.genetic[idx];
  aalDrawTour('aalCanvasGenetic', cSnap.tour, aalState.cities, '#a855f7');
  aalSetStat('aalCostGenetic', cSnap.cost.toFixed(1));
  aalSetStat('aalGapGenetic', '+' + (((cSnap.cost / optimalCost - 1) * 100).toFixed(1)) + '%');
  aalSetStat('aalGenGenetic', cSnap.generation);
  aalSetBadge('aalBadgeGenetic', idx === maxIdx ? 'Final gen' : 'Evolving');

  aalDrawChartCursor(idx);
}

function aalSetStat(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
function aalSetBadge(id, val) { var el = document.getElementById(id); if (el) { el.textContent = val; el.classList.add('ready'); } }

/* ─── Quality over time chart ─── */
function aalDrawChart() {
  var canvas = document.getElementById('aalChartCanvas');
  if (!canvas || !aalState.computed) return;
  var wrap = canvas.parentElement;
  canvas.width  = wrap.clientWidth;
  canvas.height = 240;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var padding = { top: 15, right: 15, bottom: 25, left: 50 };
  var plotW = canvas.width - padding.left - padding.right;
  var plotH = canvas.height - padding.top - padding.bottom;

  var allCosts = []
    .concat(aalState.snapshots.astar.map(function(s){return s.cost;}))
    .concat(aalState.snapshots.annealing.map(function(s){return s.cost;}))
    .concat(aalState.snapshots.genetic.map(function(s){return s.cost;}))
    .concat([aalState.optimal.cost]);

  var minCost = Math.min.apply(null, allCosts) * 0.95;
  var maxCost = Math.max.apply(null, allCosts) * 1.05;
  var maxIter = aalState.snapshots.astar.length - 1;

  function xPos(iter) { return padding.left + (iter / maxIter) * plotW; }
  function yPos(cost) { return padding.top + (1 - (cost - minCost) / (maxCost - minCost)) * plotH; }

  // Grid lines + Y labels
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.fillStyle = 'rgba(148,163,184,0.5)';
  ctx.font = '9px Fira Code, monospace';
  ctx.textAlign = 'right';
  for (var i = 0; i <= 4; i++) {
    var cost = minCost + (maxCost - minCost) * (i / 4);
    var y = yPos(cost);
    ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(canvas.width - padding.right, y); ctx.stroke();
    ctx.fillText(cost.toFixed(0), padding.left - 6, y + 3);
  }

  // X labels
  ctx.textAlign = 'center';
  [0, 0.25, 0.5, 0.75, 1].forEach(function(t) {
    var x = padding.left + t * plotW;
    ctx.fillText(Math.round(t * 100) + '%', x, canvas.height - 8);
  });

  // Optimal line (dashed green)
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(padding.left, yPos(aalState.optimal.cost));
  ctx.lineTo(canvas.width - padding.right, yPos(aalState.optimal.cost));
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw each algorithm's curve
  function drawCurve(snaps, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    snaps.forEach(function(s, i) {
      var x = xPos(s.iter); var y = yPos(s.cost);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  drawCurve(aalState.snapshots.astar, '#06b6d4');
  drawCurve(aalState.snapshots.annealing, '#f59e0b');
  drawCurve(aalState.snapshots.genetic, '#a855f7');

  // Store layout for cursor drawing
  aalState._chartLayout = { padding: padding, plotW: plotW, plotH: plotH, minCost: minCost, maxCost: maxCost, maxIter: maxIter, canvasW: canvas.width, canvasH: canvas.height };
}

function aalDrawChartCursor(idx) {
  var canvas = document.getElementById('aalChartCanvas');
  if (!canvas) return;

  // Redraw base chart then add cursor line
  aalDrawChart();
  var layout = aalState._chartLayout;
  if (!layout) return;

  var ctx = canvas.getContext('2d');
  var x = layout.padding.left + (idx / layout.maxIter) * layout.plotW;

  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(x, layout.padding.top);
  ctx.lineTo(x, layout.canvasH - layout.padding.bottom);
  ctx.stroke();
  ctx.setLineDash([]);
}

/* ─── Generate new cities ─── */
function aalNewCities() {
  aalState.cities = aalGenerateCities(aalState.numCities);
  aalState.computed = false;
  aalState.snapshots = { astar: [], annealing: [], genetic: [] };

  ['aalCanvasAstar','aalCanvasAnnealing','aalCanvasGenetic'].forEach(function(id) {
    var c = document.getElementById(id);
    if (c) { var ctx = c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height); }
  });

  var chartCanvas = document.getElementById('aalChartCanvas');
  if (chartCanvas) { var ctx = chartCanvas.getContext('2d'); ctx.clearRect(0,0,chartCanvas.width,chartCanvas.height); }

  ['aalCostAstar','aalGapAstar','aalWeightAstar','aalCostAnnealing','aalGapAnnealing','aalTempAnnealing','aalCostGenetic','aalGapGenetic','aalGenGenetic'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = '—';
  });

  ['aalBadgeAstar','aalBadgeAnnealing','aalBadgeGenetic'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.textContent = '—'; el.classList.remove('ready'); }
  });

  var scrubber = document.getElementById('aalScrubber');
  var interruptBtn = document.getElementById('aalInterruptBtn');
  if (scrubber) { scrubber.disabled = true; scrubber.value = 0; }
  if (interruptBtn) interruptBtn.disabled = true;

  var pctEl = document.getElementById('aalScrubberPct');
  if (pctEl) pctEl.textContent = '0%';

  var statusEl = document.getElementById('aalPrecomputeStatus');
  if (statusEl) statusEl.textContent = 'New cities generated. Click Precompute to run all 3 algorithms.';

  // Draw cities only (no tour yet)
  ['aalCanvasAstar','aalCanvasAnnealing','aalCanvasGenetic'].forEach(function(id) {
    var canvas = document.getElementById(id);
    if (!canvas) return;
    var wrap = canvas.parentElement;
    canvas.width = wrap.clientWidth; canvas.height = 220;
    var ctx = canvas.getContext('2d');
    var scaleX = canvas.width / 300; var scaleY = canvas.height / 220;
    aalState.cities.forEach(function(c) {
      ctx.beginPath();
      ctx.arc(c.x * scaleX, c.y * scaleY, 4.5, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(148,163,184,0.4)';
      ctx.fill();
    });
  });
}

/* ─── Interrupt at random moment ─── */
function aalInterruptRandom() {
  if (!aalState.computed) return;
  var randomPct = Math.round(Math.random() * 100);
  var scrubber = document.getElementById('aalScrubber');
  if (scrubber) scrubber.value = randomPct;
  aalApplyScrubPosition(randomPct);

  var statusEl = document.getElementById('aalPrecomputeStatus');
  if (statusEl) statusEl.textContent = '⚡ Interrupted at ' + randomPct + '% of the time budget! See what each algorithm returned.';
}

/* ─── Init ─── */
function aalInit() {
  aalState.cities = aalGenerateCities(aalState.numCities);

  // City count buttons
  document.querySelectorAll('.aal-city-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.aal-city-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      aalState.numCities = parseInt(btn.getAttribute('data-cities'));
      aalNewCities();
    });
  });

  // Shuffle button
  var shuffleBtn = document.getElementById('aalShuffleBtn');
  if (shuffleBtn) shuffleBtn.addEventListener('click', aalNewCities);

  // Run/Precompute button
  var runBtn = document.getElementById('aalRunBtn');
  if (runBtn) runBtn.addEventListener('click', aalPrecompute);

  // Scrubber
  var scrubber = document.getElementById('aalScrubber');
  if (scrubber) {
    scrubber.addEventListener('input', function() {
      aalApplyScrubPosition(parseFloat(scrubber.value));
    });
  }

  // Interrupt button
  var interruptBtn = document.getElementById('aalInterruptBtn');
  if (interruptBtn) interruptBtn.addEventListener('click', aalInterruptRandom);

  // Window resize
  window.addEventListener('resize', function() {
    if (aalState.computed) {
      var scrubber = document.getElementById('aalScrubber');
      aalApplyScrubPosition(scrubber ? parseFloat(scrubber.value) : 0);
    }
  });

  // Initial render: cities only, no tour
  aalNewCities();
}