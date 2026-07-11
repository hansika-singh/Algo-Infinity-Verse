// ==========================================================================
// FUTURE KNOWLEDGE PREDICTOR - DIAGNOSTIC ENGINE
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  initPredictor();
});

// App State (Proficiency Scores)
let scores = {
  arrays: 85,
  searching: 90,
  trees: 70,
  graphs: 40,
  dp: 55
};

// Advanced Topics Rules Database
const ADVANCED_TOPICS = [
  {
    id: "segment_trees",
    name: "Segment Trees",
    icon: "fa-tree",
    prereqs: [
      { key: "trees", label: "Trees", weight: 0.6 },
      { key: "arrays", label: "Arrays", weight: 0.4 }
    ],
    baseDesc: "Used to solve range query optimization questions (e.g. Range Sum or Range Min queries) in O(log N) time.",
    recHigh: "Prerequisites in Trees and Arrays are insufficient. Review binary tree array indexing (parent `i`, children `2i` and `2i+1`) and write 2 basic Tree traversal solutions first.",
    recMod: "Solid Array baseline, but Tree traversal depth represents a moderate obstacle. Brush up on recursively splitting ranges before starting Segment Tree builds.",
    recLow: "Excellent Tree and Array proficiency! You are fully prepared. Begin by writing a classic tree construction function and mapping range parameters."
  },
  {
    id: "dijkstra",
    name: "Dijkstra's Pathfinding",
    icon: "fa-route",
    prereqs: [
      { key: "graphs", label: "Graphs", weight: 0.7 },
      { key: "trees", label: "Heaps (Trees)", weight: 0.3 }
    ],
    baseDesc: "Solves single-source shortest path problems on positive-weighted network graphs.",
    recHigh: "Graph score is critically low. Dijkstra requires an understanding of edge relaxation and priority queues. Review BFS queueing, and practice 2 basic DFS/BFS traversal problems first.",
    recMod: "Heaps/Trees are solid, but Graph traversals are at moderate risk. Spend 20 minutes practicing node traversal loops and adjacency matrix reading.",
    recLow: "Very strong Graph and Heap scores. You have a green light! Start directly with Dijkstra's priority queue implementation and edge relaxation loop."
  },
  {
    id: "bitmask_dp",
    name: "Bitmask DP",
    icon: "fa-qrcode",
    prereqs: [
      { key: "dp", label: "Dynamic Programming", weight: 0.65 },
      { key: "arrays", label: "Arrays", weight: 0.35 }
    ],
    baseDesc: "Solves exponential subproblem constraints (like Traveling Salesperson) by representing states as binary integers.",
    recHigh: "Dynamic Programming base is weak. Bitmask DP is highly advanced. Revisit memoization matrices and simple 1D DP problems (like Climbs Stairs or House Robber) before adding bitwise state overlays.",
    recMod: "DP skills are moderate. Review bitwise operators (`&`, `|`, `^`, `<<`, `>>`) and practice bitwise masking tricks before storing them in DP arrays.",
    recLow: "Strong DP and Array base! You are fully set. Start by implementing the TSP (Traveling Salesperson) problem using memoization and bit shifting."
  },
  {
    id: "answer_space",
    name: "Answer Space Search",
    icon: "fa-bullseye",
    prereqs: [
      { key: "searching", label: "Searching", weight: 0.75 },
      { key: "arrays", label: "Arrays", weight: 0.25 }
    ],
    baseDesc: "Solves optimization bounds (e.g. minimize maximum capacity) by running binary search on a range of possible answers.",
    recHigh: "Searching foundation needs significant practice. Re-write the classic Binary Search loop, paying close attention to boundary adjustments (`low = mid + 1`, `high = mid - 1`) first.",
    recMod: "Decent searching foundation. Study how to write a helper feasibility tester function `canSolve(mid)` before wrapping it in a binary search loop.",
    recLow: "Excellent Search capabilities. High readiness! Explore classic questions like 'Koko Eating Bananas' or 'Split Array Largest Sum' to get started."
  },
  {
    id: "kruskal",
    name: "Kruskal's MST",
    icon: "fa-network-wired",
    prereqs: [
      { key: "graphs", label: "Graphs", weight: 0.6 },
      { key: "arrays", label: "Arrays (Sorting)", weight: 0.4 }
    ],
    baseDesc: "Finds the minimum spanning tree of a weighted undirected graph by sorting edges and connecting components.",
    recHigh: "Graph score is critically low. Kruskal requires a Union-Find (Disjoint Set) structure. Review connected components in graphs and study DSU disjoint arrays before starting.",
    recMod: "Solid Array base for edge sorting, but Graph component tracking is at moderate risk. Review Disjoint Set Union operations (find & union) first.",
    recLow: "Strong Graph and sorting base. Start directly with Kruskal's edge sorting array, and use a standard DSU to prevent cycles."
  },
  {
    id: "dp_3d",
    name: "3D Dynamic Programming",
    icon: "fa-cube",
    prereqs: [
      { key: "dp", label: "Dynamic Programming", weight: 1.0 }
    ],
    baseDesc: "Solves multi-constraint subproblems (e.g., Knapsack with capacity, volume, and count limits) using 3D matrices.",
    recHigh: "DP base is weak. 3D matrices represent a steep learning barrier. Review 2D DP matrices (such as Knapsack or LCS) and write nested loops before adding a third dimension.",
    recMod: "DP base is moderate. Practice visualising state space transitions in 3D: `dp[i][w][v]`. Start by solving standard 2D problems with a third auxiliary state.",
    recLow: "Excellent DP foundation! Dive right in. Check out the 3D DP Matrix Visualizer page in the navigation bar to see loops in interactive 3D."
  }
];

// ──────────────────────────────────────────────────────────────────────────
// 🛠️ INITIALIZATION
// ──────────────────────────────────────────────────────────────────────────
function initPredictor() {
  loadScoresFromLocalStorage();

  // HTML Sliders Bindings
  const sliders = {
    arrays: document.getElementById("slider-arrays"),
    searching: document.getElementById("slider-searching"),
    trees: document.getElementById("slider-trees"),
    graphs: document.getElementById("slider-graphs"),
    dp: document.getElementById("slider-dp")
  };

  const displays = {
    arrays: document.getElementById("val-display-arrays"),
    searching: document.getElementById("val-display-searching"),
    trees: document.getElementById("val-display-trees"),
    graphs: document.getElementById("val-display-graphs"),
    dp: document.getElementById("val-display-dp")
  };

  // Set initial slider values
  Object.keys(sliders).forEach(key => {
    if (sliders[key]) {
      sliders[key].value = scores[key];
      displays[key].textContent = `${scores[key]}%`;
      
      // Attach listeners
      sliders[key].addEventListener("input", () => {
        scores[key] = parseInt(sliders[key].value);
        displays[key].textContent = `${scores[key]}%`;
        
        // Save to local storage for persistence
        saveScoresToLocalStorage();
        
        // Recalculate everything
        recalculateForecasts();
      });
    }
  });

  // Reset Button
  const btnReset = document.getElementById("btn-reset-simulator");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      scores = { arrays: 85, searching: 90, trees: 70, graphs: 40, dp: 55 };
      Object.keys(sliders).forEach(key => {
        if (sliders[key]) {
          sliders[key].value = scores[key];
          displays[key].textContent = `${scores[key]}%`;
        }
      });
      saveScoresToLocalStorage();
      recalculateForecasts();
    });
  }

  // Initial Calculation
  recalculateForecasts();

  }

// ──────────────────────────────────────────────────────────────────────────
// 💾 LOCAL STORAGE LINK
// ──────────────────────────────────────────────────────────────────────────
function loadScoresFromLocalStorage() {
  try {
    const topicData = JSON.parse(localStorage.getItem("topicPerformance"));
    if (topicData) {
      if (topicData.Arrays) scores.arrays = Math.round((topicData.Arrays.solved / topicData.Arrays.attempts) * 100) || 85;
      if (topicData.Searching) scores.searching = Math.round((topicData.Searching.solved / topicData.Searching.attempts) * 100) || 90;
      if (topicData.Trees) scores.trees = Math.round((topicData.Trees.solved / topicData.Trees.attempts) * 100) || 70;
      if (topicData.Graphs) scores.graphs = Math.round((topicData.Graphs.solved / topicData.Graphs.attempts) * 100) || 40;
      if (topicData.DynamicProgramming) scores.dp = Math.round((topicData.DynamicProgramming.solved / topicData.DynamicProgramming.attempts) * 100) || 55;
    }
  } catch (e) {
    void 0;
  }
}

function saveScoresToLocalStorage() {
  try {
    const mockData = {
      Arrays: { solved: scores.arrays, attempts: 100, time: 120 },
      Searching: { solved: scores.searching, attempts: 100, time: 90 },
      Trees: { solved: scores.trees, attempts: 100, time: 180 },
      Graphs: { solved: scores.graphs, attempts: 100, time: 250 },
      DynamicProgramming: { solved: scores.dp, attempts: 100, time: 220 }
    };
    localStorage.setItem("topicPerformance", JSON.stringify(mockData));
  } catch (e) {
    console.error("Failed to write to local storage:", e);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 🧮 FORECASTING LOGIC ENGINE
// ──────────────────────────────────────────────────────────────────────────
function recalculateForecasts() {
  const container = document.getElementById("risks-container");
  container.innerHTML = "";

  let highRiskCount = 0;

  ADVANCED_TOPICS.forEach(topic => {
    // 1. Calculate Prerequisite Weighted Score
    let totalWeight = 0;
    let weightedSum = 0;

    let prereqsHtml = topic.prereqs.map(p => {
      const score = scores[p.key];
      let statusClass = "strong";
      if (score < 60) statusClass = "weak";
      
      weightedSum += score * p.weight;
      totalWeight += p.weight;

      return `<span class="prereq-pill ${statusClass}">${p.label}: ${score}%</span>`;
    }).join(" ");

    const avgScore = weightedSum / totalWeight;
    const riskScore = 100 - avgScore;

    // 2. Determine Risk Level
    let riskLevel = "low";
    let riskLabel = "Low Risk / Safe";
    let recText = topic.recLow;

    if (riskScore >= 45) {
      riskLevel = "high";
      riskLabel = "High Risk";
      recText = topic.recHigh;
      highRiskCount++;
    } else if (riskScore >= 20) {
      riskLevel = "moderate";
      riskLabel = "Moderate Risk";
      recText = topic.recMod;
    }

    // 3. Render Card
    const card = document.createElement("div");
    card.className = "risk-card";
    
    // Customize indicator icons
    let indicatorIcon = '<i class="fas fa-circle-check text-emerald"></i>';
    if (riskLevel === "high") {
      indicatorIcon = '<i class="fas fa-triangle-exclamation text-red pulse-glow"></i>';
    } else if (riskLevel === "moderate") {
      indicatorIcon = '<i class="fas fa-circle-exclamation text-orange"></i>';
    }

    card.innerHTML = `
      <div class="risk-card-header">
        <div class="risk-topic-title">
          <div class="risk-topic-icon"><i class="fas ${topic.icon}"></i></div>
          <h4 class="risk-topic-name">${topic.name}</h4>
        </div>
        <span class="risk-badge ${riskLevel}">
          ${indicatorIcon} ${riskLabel}
        </span>
      </div>

      <div class="risk-prereqs">
        <span class="text-xs">Prerequisites:</span>
        ${prereqsHtml}
      </div>

      <p class="risk-analysis-text">
        <strong>Overview:</strong> ${topic.baseDesc}<br/>
        <strong>Forecasting:</strong> Based on prerequisite profiles, this topic holds a <strong>${Math.round(riskScore)}% difficulty factor</strong>.
      </p>

      <div class="recommendation-pane">
        <div class="rec-title"><i class="fas fa-lightbulb"></i> Study Path Recommendation</div>
        <p class="rec-text">${recText}</p>
      </div>
    `;

    container.appendChild(card);
  });

  // Update Badge count
  const badge = document.getElementById("risk-count-badge");
  badge.textContent = `${highRiskCount} High Risk${highRiskCount === 1 ? "" : "s"}`;
  
  // Apply badge styles
  if (highRiskCount > 2) {
    badge.className = "badge bg-red";
    badge.style.borderColor = "var(--fk-red)";
    badge.style.color = "#f87171";
  } else if (highRiskCount > 0) {
    badge.className = "badge bg-orange";
    badge.style.borderColor = "var(--fk-orange)";
    badge.style.color = "#fb923c";
  } else {
    badge.className = "badge bg-emerald";
    badge.style.borderColor = "var(--fk-emerald)";
    badge.style.color = "#34d399";
  }

  // Update Analytics HUD & Chart
  updateAnalytics();
}

// ──────────────────────────────────────────────────────────────────────────
// 📈 SVG LINE CHART & HUD GENERATION
// ──────────────────────────────────────────────────────────────────────────
function updateAnalytics() {
  const sumScores = Object.values(scores).reduce((a, b) => a + b, 0);
  const avgProficiency = Math.round(sumScores / 5);

  // HUD stats
  // Consistency = standard deviation of scores mapped to 0-100%
  const mean = sumScores / 5;
  const variance = Object.values(scores).reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 5;
  const stdDev = Math.sqrt(variance);
  const consistency = Math.max(40, Math.round(100 - stdDev * 1.5));
  
  document.getElementById("metric-consistency").textContent = `${consistency}%`;

  // Velocity = solved tasks estimate
  const velocity = Math.round(avgProficiency / 5);
  document.getElementById("metric-velocity").textContent = `${velocity} Solved / wk`;

  // Error Margin
  const errorMargin = 100 - avgProficiency;
  const errorSpan = document.getElementById("metric-error");
  errorSpan.textContent = `${errorMargin}%`;
  if (errorMargin > 40) {
    errorSpan.className = "text-red";
  } else if (errorMargin > 20) {
    errorSpan.className = "text-orange";
  } else {
    errorSpan.className = "text-emerald";
  }

  // Draw Chart
  const svg = document.getElementById("svg-trend-chart");
  svg.innerHTML = "";

  // Data Points (Week 1 to Week 6)
  // Weeks 1-4 are pre-authored historical progression leading up to current week 5.
  // Week 5 is current average proficiency.
  // Week 6 is forecasted projection (+8% improvement).
  const points = [
    { label: "Wk 1", val: 52 },
    { label: "Wk 2", val: 58 },
    { label: "Wk 3", val: 65 },
    { label: "Wk 4", val: 70 },
    { label: "Wk 5 (Now)", val: avgProficiency },
    { label: "Wk 6 (Fcst)", val: Math.min(100, avgProficiency + 8) }
  ];

  // SVG dimensions: 450w, 200h
  // Margin bounds: x in [40, 420], y in [20, 160]
  const startX = 40;
  const endX = 420;
  const startY = 160; // Y = 0%
  const endY = 20;    // Y = 100%

  function getXCoord(idx) {
    return startX + (idx * (endX - startX)) / 5;
  }

  function getYCoord(val) {
    return startY - (val * (startY - endY)) / 100;
  }

  // 1. Draw Grid lines
  for (let gridVal = 20; gridVal <= 100; gridVal += 20) {
    const yGrid = getYCoord(gridVal);
    
    // horizontal grid line
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", startX);
    line.setAttribute("y1", yGrid);
    line.setAttribute("x2", endX);
    line.setAttribute("y2", yGrid);
    line.setAttribute("class", "chart-grid");
    svg.appendChild(line);

    // axis label (20%, 40% etc.)
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", startX - 8);
    text.setAttribute("y", yGrid + 3);
    text.setAttribute("fill", "#52525b");
    text.setAttribute("font-size", "8px");
    text.setAttribute("text-anchor", "end");
    text.textContent = `${gridVal}%`;
    svg.appendChild(text);
  }

  // 2. Draw actual progression line (Wk 1 to Wk 5)
  let dActual = `M ${getXCoord(0)} ${getYCoord(points[0].val)}`;
  for (let i = 1; i <= 4; i++) {
    dActual += ` L ${getXCoord(i)} ${getYCoord(points[i].val)}`;
  }
  const pathActual = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathActual.setAttribute("d", dActual);
  pathActual.setAttribute("class", "chart-line-actual");
  svg.appendChild(pathActual);

  // 3. Draw forecast line (Wk 5 to Wk 6)
  const dForecast = `M ${getXCoord(4)} ${getYCoord(points[4].val)} L ${getXCoord(5)} ${getYCoord(points[5].val)}`;
  const pathForecast = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathForecast.setAttribute("d", dForecast);
  pathForecast.setAttribute("class", "chart-line-forecast");
  svg.appendChild(pathForecast);

  // 4. Draw points and labels
  points.forEach((pt, idx) => {
    const cx = getXCoord(idx);
    const cy = getYCoord(pt.val);
    const isForecast = (idx === 5);

    // Dot circle
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", cx);
    circle.setAttribute("cy", cy);
    circle.setAttribute("r", isForecast ? "4.5" : "4");
    circle.setAttribute("class", isForecast ? "chart-dot-forecast" : "chart-dot-actual");
    svg.appendChild(circle);

    // Value text above dot
    const textVal = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textVal.setAttribute("x", cx);
    textVal.setAttribute("y", cy - 10);
    textVal.setAttribute("class", "chart-text-value");
    if (isForecast) textVal.setAttribute("fill", "var(--fk-pink)");
    textVal.textContent = `${pt.val}%`;
    svg.appendChild(textVal);

    // Axis label (Wk 1, Wk 2 etc.) at bottom
    const textAxis = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textAxis.setAttribute("x", cx);
    textAxis.setAttribute("y", startY + 16);
    textAxis.setAttribute("class", "chart-text");
    textAxis.textContent = pt.label;
    svg.appendChild(textAxis);
  });

  // 5. Draw bottom axis line
  const axis = document.createElementNS("http://www.w3.org/2000/svg", "line");
  axis.setAttribute("x1", startX);
  axis.setAttribute("y1", startY);
  axis.setAttribute("x2", endX);
  axis.setAttribute("y2", startY);
  axis.setAttribute("class", "chart-axis");
  svg.appendChild(axis);
}
