document.addEventListener('DOMContentLoaded', function() {
  aalInit();
});

/* ─── State ─── */
let aalState = {
  numCities : 8,
  cities    : [],
  optimal   : { tour: [], cost: Infinity },
  snapshots : { astar: [], annealing: [], genetic: [] }, // each: [{tour, cost, iter, extra}]
  computed  : false,
};

/* ─── Distance helpers ─── */
function aalDist(a, b) { return Math.sqrt((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y)); }

function aalTourCost(tour, cities) {
  let cost = 0;
  for (let i = 0; i < tour.length; i++) {
    let a = cities[tour[i]];
    let b = cities[tour[(i+1) % tour.length]];
    cost += aalDist(a, b);
  }
  return cost;
}

/* ─── Generate random cities ─── */
function aalGenerateCities(n) {
  let cities = [];
  for (let i = 0; i < n; i++) {
    cities.push({ x: 30 + Math.random() * 240, y: 25 + Math.random() * 170 });
  }
  return cities;
}

/* ─── Brute force optimal (n <= 10) ─── */
function aalBruteForce(cities) {
  let n = cities.length;
  let indices = [];
  for (let i = 1; i < n; i++) indices.push(i); // fix city 0 as start

  let best = null; let bestCost = Infinity;

  function permute(arr, l) {
    if (l === arr.length) {
      let tour = [0].concat(arr);
      let cost = aalTourCost(tour, cities);
      if (cost < bestCost) { bestCost = cost; best = tour.slice(); }
      return;
    }
    for (let i = l; i < arr.length; i++) {
      let tmp = arr[l]; arr[l] = arr[i]; arr[i] = tmp;
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
  let n = cities.length;
  let snapshots = [];

  // We simulate "weight" decaying from 5.0 (very greedy) to 1.0 (near optimal)
  // by running nearest-neighbor + progressively more 2-opt passes as weight decreases.
  let weights = [];
  for (let i = 0; i <= maxIters; i++) {
    let t = i / maxIters;
    weights.push(5.0 - t * 4.0); // 5.0 -> 1.0
  }

  // Base: nearest neighbor tour (this is what high-weight/greedy gives)
  function nearestNeighborTour() {
    let visited = new Array(n).fill(false);
    let tour = [0]; visited[0] = true;
    for (let step = 1; step < n; step++) {
      let last = tour[tour.length - 1];
      let bestNext = -1; let bestD = Infinity;
      for (let j = 0; j < n; j++) {
        if (!visited[j]) {
          let d = aalDist(cities[last], cities[j]);
          if (d < bestD) { bestD = d; bestNext = j; }
        }
      }
      tour.push(bestNext); visited[bestNext] = true;
    }
    return tour;
  }

  function twoOptPass(tour, passes) {
    let t = tour.slice();
    for (let p = 0; p < passes; p++) {
      let improved = false;
      for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
          let newTour = t.slice(0, i).concat(t.slice(i, j+1).reverse(), t.slice(j+1));
          if (aalTourCost(newTour, cities) < aalTourCost(t, cities)) {
            t = newTour; improved = true;
          }
        }
      }
      if (!improved) break;
    }
    return t;
  }

  let baseTour = nearestNeighborTour();

  for (let i = 0; i <= maxIters; i++) {
    let w = weights[i];
    // Lower weight (closer to 1.0) => more 2-opt refinement passes
    let passes = Math.round((5.0 - w) * 2); // 0 passes at w=5, up to 8 passes at w=1
    let tour = twoOptPass(baseTour, passes);
    let cost = aalTourCost(tour, cities);
    snapshots.push({ tour: tour, cost: cost, iter: i, weight: w });
  }

  return snapshots;
}

/* ─── Simulated Annealing ─── */
function aalRunAnnealing(cities, maxIters) {
  let n = cities.length;
  let snapshots = [];

  // Random initial tour
  let tour = [];
  for (let i = 0; i < n; i++) tour.push(i);
  for (let i = tour.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i+1));
    let tmp = tour[i]; tour[i] = tour[j]; tour[j] = tmp;
  }

  let cost = aalTourCost(tour, cities);
  let bestTour = tour.slice(); let bestCost = cost;

  let T0 = 100; let Tmin = 0.5;

  for (let iter = 0; iter <= maxIters; iter++) {
    let t = iter / maxIters;
    let T = T0 * Math.pow(Tmin / T0, t); // exponential cooling

    // Random 2-swap neighbor
    let a = Math.floor(Math.random() * n);
    let b = Math.floor(Math.random() * n);
    if (a !== b) {
      let newTour = tour.slice();
      let tmp = newTour[a]; newTour[a] = newTour[b]; newTour[b] = tmp;
      let newCost = aalTourCost(newTour, cities);
      let delta = newCost - cost;

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
  let n = cities.length;
  let popSize = 24;
  let snapshots = [];

  function randomTour() {
    let t = [];
    for (let i = 0; i < n; i++) t.push(i);
    for (let i = t.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i+1));
      let tmp = t[i]; t[i] = t[j]; t[j] = tmp;
    }
    return t;
  }

  function orderCrossover(p1, p2) {
    let start = Math.floor(Math.random() * n);
    let end   = start + Math.floor(Math.random() * (n - start));
    let child = new Array(n).fill(-1);
    for (let i = start; i <= end; i++) child[i] = p1[i];
    let pIdx = 0;
    for (let i = 0; i < n; i++) {
      if (child.indexOf(p2[i]) === -1) {
        while (child[pIdx] !== -1) pIdx++;
        child[pIdx] = p2[i];
      }
    }
    return child;
  }

  function mutate(tour, rate) {
    let t = tour.slice();
    if (Math.random() < rate) {
      let a = Math.floor(Math.random() * n);
      let b = Math.floor(Math.random() * n);
      let tmp = t[a]; t[a] = t[b]; t[b] = tmp;
    }
    return t;
  }

  function tournamentSelect(pop, costs) {
    let i1 = Math.floor(Math.random() * pop.length);
    let i2 = Math.floor(Math.random() * pop.length);
    return costs[i1] < costs[i2] ? pop[i1] : pop[i2];
  }

  let population = [];
  for (let i = 0; i < popSize; i++) population.push(randomTour());

  let bestTour = population[0]; let bestCost = aalTourCost(bestTour, cities);

  for (let gen = 0; gen <= maxIters; gen++) {
    let costs = population.map(function(t) { return aalTourCost(t, cities); });

    for (let i = 0; i < costs.length; i++) {
      if (costs[i] < bestCost) { bestCost = costs[i]; bestTour = population[i].slice(); }
    }

    // Build next generation (elitism: keep best)
    let newPop = [bestTour.slice()];
    while (newPop.length < popSize) {
      let parent1 = tournamentSelect(population, costs);
      let parent2 = tournamentSelect(population, costs);
      let child = orderCrossover(parent1, parent2);
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
  let statusEl = document.getElementById('aalPrecomputeStatus');
  if (statusEl) statusEl.textContent = 'Computing brute-force optimal...';

  let maxIters = 60;

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
          let scrubber = document.getElementById('aalScrubber');
          let interruptBtn = document.getElementById('aalInterruptBtn');
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
  let canvas = document.getElementById(canvasId);
  if (!canvas) return;
  let wrap = canvas.parentElement;
  canvas.width  = wrap.clientWidth;
  canvas.height = 220;
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!tour || tour.length === 0) return;

  let scaleX = canvas.width / 300;
  let scaleY = canvas.height / 220;

  // Draw edges
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < tour.length; i++) {
    let a = cities[tour[i]];
    let b = cities[tour[(i+1) % tour.length]];
    if (i === 0) ctx.moveTo(a.x * scaleX, a.y * scaleY);
    ctx.lineTo(b.x * scaleX, b.y * scaleY);
  }
  ctx.stroke();

  // Draw cities
  cities.forEach(function(c, idx) {
    let isStart = idx === tour[0];
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

  let pctEl = document.getElementById('aalScrubberPct');
  if (pctEl) pctEl.textContent = Math.round(pct) + '%';

  let maxIdx = aalState.snapshots.astar.length - 1;
  let idx = Math.round((pct / 100) * maxIdx);
  idx = Math.max(0, Math.min(maxIdx, idx));

  let optimalCost = aalState.optimal.cost;

  // A*
  let aSnap = aalState.snapshots.astar[idx];
  aalDrawTour('aalCanvasAstar', aSnap.tour, aalState.cities, '#06b6d4');
  aalSetStat('aalCostAstar', aSnap.cost.toFixed(1));
  aalSetStat('aalGapAstar', '+' + (((aSnap.cost / optimalCost - 1) * 100).toFixed(1)) + '%');
  aalSetStat('aalWeightAstar', aSnap.weight.toFixed(2));
  aalSetBadge('aalBadgeAstar', idx === maxIdx ? 'Converged' : 'In progress');

  // Annealing
  let bSnap = aalState.snapshots.annealing[idx];
  aalDrawTour('aalCanvasAnnealing', bSnap.tour, aalState.cities, '#f59e0b');
  aalSetStat('aalCostAnnealing', bSnap.cost.toFixed(1));
  aalSetStat('aalGapAnnealing', '+' + (((bSnap.cost / optimalCost - 1) * 100).toFixed(1)) + '%');
  aalSetStat('aalTempAnnealing', bSnap.temperature.toFixed(2));
  aalSetBadge('aalBadgeAnnealing', idx === maxIdx ? 'Cooled' : 'Annealing');

  // Genetic
  let cSnap = aalState.snapshots.genetic[idx];
  aalDrawTour('aalCanvasGenetic', cSnap.tour, aalState.cities, '#a855f7');
  aalSetStat('aalCostGenetic', cSnap.cost.toFixed(1));
  aalSetStat('aalGapGenetic', '+' + (((cSnap.cost / optimalCost - 1) * 100).toFixed(1)) + '%');
  aalSetStat('aalGenGenetic', cSnap.generation);
  aalSetBadge('aalBadgeGenetic', idx === maxIdx ? 'Final gen' : 'Evolving');

  aalDrawChartCursor(idx);
}

function aalSetStat(id, val) { let el = document.getElementById(id); if (el) el.textContent = val; }
function aalSetBadge(id, val) { let el = document.getElementById(id); if (el) { el.textContent = val; el.classList.add('ready'); } }

/* ─── Quality over time chart ─── */
function aalDrawChart() {
  let canvas = document.getElementById('aalChartCanvas');
  if (!canvas || !aalState.computed) return;
  let wrap = canvas.parentElement;
  canvas.width  = wrap.clientWidth;
  canvas.height = 240;
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let padding = { top: 15, right: 15, bottom: 25, left: 50 };
  let plotW = canvas.width - padding.left - padding.right;
  let plotH = canvas.height - padding.top - padding.bottom;

  let allCosts = []
    .concat(aalState.snapshots.astar.map(function(s){return s.cost;}))
    .concat(aalState.snapshots.annealing.map(function(s){return s.cost;}))
    .concat(aalState.snapshots.genetic.map(function(s){return s.cost;}))
    .concat([aalState.optimal.cost]);

  let minCost = Math.min.apply(null, allCosts) * 0.95;
  let maxCost = Math.max.apply(null, allCosts) * 1.05;
  let maxIter = aalState.snapshots.astar.length - 1;

  function xPos(iter) { return padding.left + (iter / maxIter) * plotW; }
  function yPos(cost) { return padding.top + (1 - (cost - minCost) / (maxCost - minCost)) * plotH; }

  // Grid lines + Y labels
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.fillStyle = 'rgba(148,163,184,0.5)';
  ctx.font = '9px Fira Code, monospace';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    let cost = minCost + (maxCost - minCost) * (i / 4);
    let y = yPos(cost);
    ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(canvas.width - padding.right, y); ctx.stroke();
    ctx.fillText(cost.toFixed(0), padding.left - 6, y + 3);
  }

  // X labels
  ctx.textAlign = 'center';
  [0, 0.25, 0.5, 0.75, 1].forEach(function(t) {
    let x = padding.left + t * plotW;
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
      let x = xPos(s.iter); let y = yPos(s.cost);
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
  let canvas = document.getElementById('aalChartCanvas');
  if (!canvas) return;

  // Redraw base chart then add cursor line
  aalDrawChart();
  let layout = aalState._chartLayout;
  if (!layout) return;

  let ctx = canvas.getContext('2d');
  let x = layout.padding.left + (idx / layout.maxIter) * layout.plotW;

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
    let c = document.getElementById(id);
    if (c) { let ctx = c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height); }
  });

  let chartCanvas = document.getElementById('aalChartCanvas');
  if (chartCanvas) { let ctx = chartCanvas.getContext('2d'); ctx.clearRect(0,0,chartCanvas.width,chartCanvas.height); }

  ['aalCostAstar','aalGapAstar','aalWeightAstar','aalCostAnnealing','aalGapAnnealing','aalTempAnnealing','aalCostGenetic','aalGapGenetic','aalGenGenetic'].forEach(function(id) {
    let el = document.getElementById(id);
    if (el) el.textContent = '—';
  });

  ['aalBadgeAstar','aalBadgeAnnealing','aalBadgeGenetic'].forEach(function(id) {
    let el = document.getElementById(id);
    if (el) { el.textContent = '—'; el.classList.remove('ready'); }
  });

  let scrubber = document.getElementById('aalScrubber');
  let interruptBtn = document.getElementById('aalInterruptBtn');
  if (scrubber) { scrubber.disabled = true; scrubber.value = 0; }
  if (interruptBtn) interruptBtn.disabled = true;

  let pctEl = document.getElementById('aalScrubberPct');
  if (pctEl) pctEl.textContent = '0%';

  let statusEl = document.getElementById('aalPrecomputeStatus');
  if (statusEl) statusEl.textContent = 'New cities generated. Click Precompute to run all 3 algorithms.';

  // Draw cities only (no tour yet)
  ['aalCanvasAstar','aalCanvasAnnealing','aalCanvasGenetic'].forEach(function(id) {
    let canvas = document.getElementById(id);
    if (!canvas) return;
    let wrap = canvas.parentElement;
    canvas.width = wrap.clientWidth; canvas.height = 220;
    let ctx = canvas.getContext('2d');
    let scaleX = canvas.width / 300; let scaleY = canvas.height / 220;
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
  let randomPct = Math.round(Math.random() * 100);
  let scrubber = document.getElementById('aalScrubber');
  if (scrubber) scrubber.value = randomPct;
  aalApplyScrubPosition(randomPct);

  let statusEl = document.getElementById('aalPrecomputeStatus');
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
  let shuffleBtn = document.getElementById('aalShuffleBtn');
  if (shuffleBtn) shuffleBtn.addEventListener('click', aalNewCities);

  // Run/Precompute button
  let runBtn = document.getElementById('aalRunBtn');
  if (runBtn) runBtn.addEventListener('click', aalPrecompute);

  // Scrubber
  let scrubber = document.getElementById('aalScrubber');
  if (scrubber) {
    scrubber.addEventListener('input', function() {
      aalApplyScrubPosition(parseFloat(scrubber.value));
    });
  }

  // Interrupt button
  let interruptBtn = document.getElementById('aalInterruptBtn');
  if (interruptBtn) interruptBtn.addEventListener('click', aalInterruptRandom);

  // Window resize
  window.addEventListener('resize', function() {
    if (aalState.computed) {
      let scrubber = document.getElementById('aalScrubber');
      aalApplyScrubPosition(scrubber ? parseFloat(scrubber.value) : 0);
    }
  });

  // Initial render: cities only, no tour
  aalNewCities();
}