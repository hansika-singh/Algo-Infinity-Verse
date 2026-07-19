/* ============================================================
   Centroid Decomposition — Recursive Centroid Engine
   ============================================================ */

const SVG_NS = "http://www.w3.org/2000/svg";

/* ---------- tree generators ---------- */

function generateRandomTree(n){
  const adj = Array.from({ length: n }, () => []);
  for(let i = 1; i < n; i++){
    const p = Math.floor(Math.random() * i);
    adj[i].push(p); adj[p].push(i);
  }
  return adj;
}
function generatePathTree(n){
  const adj = Array.from({ length: n }, () => []);
  for(let i = 1; i < n; i++){ adj[i].push(i - 1); adj[i - 1].push(i); }
  return adj;
}
function generateStarTree(n){
  const adj = Array.from({ length: n }, () => []);
  for(let i = 1; i < n; i++){ adj[i].push(0); adj[0].push(i); }
  return adj;
}
function generateBroomTree(n){
  const adj = Array.from({ length: n }, () => []);
  const handle = Math.max(1, Math.floor(n / 2));
  for(let i = 1; i < handle; i++){ adj[i].push(i - 1); adj[i - 1].push(i); }
  for(let i = handle; i < n; i++){ adj[i].push(handle - 1); adj[handle - 1].push(i); }
  return adj;
}

/* ---------- centroid finding (genuine subtree-size based) ---------- */

function computeSubtreeSizes(u, parent, adj, removed, size){
  size[u] = 1;
  for(const v of adj[u]){
    if(v !== parent && !removed[v]){
      computeSubtreeSizes(v, u, adj, removed, size);
      size[u] += size[v];
    }
  }
}

// Returns the walk path (array of node ids) from u to the true centroid,
// so callers can animate "walk toward the heavy side" step by step.
function findCentroidWithPath(u, adj, removed, size){
  const path = [u];
  let cur = u, parent = -1;
  const treeSize = size[u];
  while(true){
    let next = -1;
    for(const v of adj[cur]){
      if(v !== parent && !removed[v] && size[v] > treeSize / 2){
        next = v; break;
      }
    }
    if(next === -1) break;
    path.push(next);
    parent = cur;
    cur = next;
  }
  return path; // path[path.length - 1] is the centroid
}

/* ---------- distances / path counting ---------- */

function collectDistances(u, parent, adj, removed, d, out){
  out.push(d);
  for(const v of adj[u]){
    if(v !== parent && !removed[v]) collectDistances(v, u, adj, removed, d + 1, out);
  }
}
function countPairsLE(dists, K){
  const a = dists.slice().sort((x, y) => x - y);
  let i = 0, j = a.length - 1, count = 0;
  while(i < j){
    if(a[i] + a[j] <= K){ count += j - i; i++; }
    else j--;
  }
  return count;
}
function countPairsBruteForce(n, adj, K){
  let count = 0;
  for(let s = 0; s < n; s++){
    const dist = new Array(n).fill(-1);
    dist[s] = 0;
    const q = [s];
    while(q.length){
      const u = q.shift();
      for(const v of adj[u]) if(dist[v] === -1){ dist[v] = dist[u] + 1; q.push(v); }
    }
    for(let t = s + 1; t < n; t++) if(dist[t] <= K) count++;
  }
  return count;
}

/* ---------- generic tree layout (rooted at node 0, static across the run) ---------- */

function layoutTree(adj, n, root, width, height){
  const parent = new Array(n).fill(-1);
  const children = Array.from({ length: n }, () => []);
  const visited = new Array(n).fill(false);
  const depth = new Array(n).fill(0);
  const queue = [root];
  visited[root] = true;
  while(queue.length){
    const u = queue.shift();
    for(const v of adj[u]){
      if(!visited[v]){
        visited[v] = true; parent[v] = u; children[u].push(v);
        depth[v] = depth[u] + 1; queue.push(v);
      }
    }
  }
  let leafCounter = 0;
  const xRank = new Array(n).fill(0);
  function assignX(u){
    if(children[u].length === 0){ xRank[u] = leafCounter++; return; }
    for(const c of children[u]) assignX(c);
    const xs = children[u].map(c => xRank[c]);
    xRank[u] = (Math.min(...xs) + Math.max(...xs)) / 2;
  }
  assignX(root);
  const maxDepth = Math.max(...depth);
  const xStep = leafCounter > 1 ? width / (leafCounter + 1) : width / 2;
  const yStep = maxDepth > 0 ? (height - 70) / maxDepth : 0;
  const positions = new Map();
  for(let i = 0; i < n; i++){
    positions.set(i, { x: xStep * (xRank[i] + 1), y: 40 + depth[i] * Math.max(yStep, 46) });
  }
  return positions;
}

/* ---------- rendering helpers ---------- */

function clearSvg(svg){ while(svg.firstChild) svg.removeChild(svg.firstChild); }

function renderOriginalTree(adj, n, positions, removed, currentPiece, walking, foundCentroid){
  const svg = document.getElementById("origSvg");
  clearSvg(svg);
  const linkLayer = document.createElementNS(SVG_NS, "g");
  const nodeLayer = document.createElementNS(SVG_NS, "g");
  svg.appendChild(linkLayer); svg.appendChild(nodeLayer);

  for(let u = 0; u < n; u++){
    for(const v of adj[u]){
      if(v < u) continue;
      const p1 = positions.get(u), p2 = positions.get(v);
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", p1.x); line.setAttribute("y1", p1.y);
      line.setAttribute("x2", p2.x); line.setAttribute("y2", p2.y);
      let cls = "tree-link";
      if(walking && walking.includes(u) && walking.includes(v) && Math.abs(walking.indexOf(u) - walking.indexOf(v)) === 1){
        cls += " walk";
      }
      line.setAttribute("class", cls);
      linkLayer.appendChild(line);
    }
  }

  for(let u = 0; u < n; u++){
    const { x, y } = positions.get(u);
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "node-group" + (removed[u] ? " removed" : ""));
    g.setAttribute("transform", `translate(${x},${y})`);

    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("r", 16);
    let cls = "node-circle";
    if(removed[u]) cls += " removed";
    else if(foundCentroid === u) cls += " found-centroid";
    else if(walking && walking.includes(u)) cls += " walking";
    else if(currentPiece && currentPiece.has(u)) cls += " current-piece";
    circle.setAttribute("class", cls);
    g.appendChild(circle);

    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("class", "node-key"); label.setAttribute("y", 5);
    label.textContent = u;
    g.appendChild(label);

    nodeLayer.appendChild(g);
  }
}

function renderCentroidTree(centroidParent, centroidDepth, foundSoFar){
  const svg = document.getElementById("centSvg");
  clearSvg(svg);
  if(foundSoFar.length === 0) return;

  // build a temp adjacency among found centroids using centroidParent
  const idxOf = new Map(foundSoFar.map((id, i) => [id, i]));
  const n = foundSoFar.length;
  const adj = Array.from({ length: n }, () => []);
  let rootIdx = 0;
  foundSoFar.forEach((id, i) => {
    const p = centroidParent[id];
    if(p === -1){ rootIdx = i; return; }
    const pi = idxOf.get(p);
    adj[i].push(pi); adj[pi].push(i);
  });

  const positions = layoutTree(adj, n, rootIdx, 860, 420);

  const linkLayer = document.createElementNS(SVG_NS, "g");
  const nodeLayer = document.createElementNS(SVG_NS, "g");
  svg.appendChild(linkLayer); svg.appendChild(nodeLayer);

  for(let i = 0; i < n; i++){
    for(const j of adj[i]){
      if(j < i) continue;
      const p1 = positions.get(i), p2 = positions.get(j);
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", p1.x); line.setAttribute("y1", p1.y);
      line.setAttribute("x2", p2.x); line.setAttribute("y2", p2.y);
      line.setAttribute("class", "tree-link centroid-edge");
      linkLayer.appendChild(line);
    }
  }

  for(let i = 0; i < n; i++){
    const { x, y } = positions.get(i);
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "node-group");
    g.setAttribute("transform", `translate(${x},${y})`);

    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("r", 16);
    circle.setAttribute("class", "node-circle centroid-node");
    g.appendChild(circle);

    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("class", "node-key"); label.setAttribute("y", 5);
    label.textContent = foundSoFar[i];
    g.appendChild(label);

    const depthLabel = document.createElementNS(SVG_NS, "text");
    depthLabel.setAttribute("class", "node-size"); depthLabel.setAttribute("y", 30);
    depthLabel.textContent = "d:" + centroidDepth[foundSoFar[i]];
    g.appendChild(depthLabel);

    nodeLayer.appendChild(g);
  }
}

/* ---------- state ---------- */

let N = 20;
let adjacency = [];
let origPositions = null;
let removedArr = [];
let centroidParentArr = [];
let centroidDepthArr = [];
let foundCentroids = [];

const statusLine = document.getElementById("statusLine");
function setStatus(msg){ statusLine.textContent = msg; }
function sleep(ms){ return new Promise(res => setTimeout(res, ms)); }

function currentPieceSet(u, parent, adj, removed){
  const set = new Set();
  (function walk(u, parent){
    set.add(u);
    for(const v of adj[u]) if(v !== parent && !removed[v]) walk(v, u);
  })(u, parent);
  return set;
}

function resetState(){
  removedArr = new Array(N).fill(false);
  centroidParentArr = new Array(N).fill(-1);
  centroidDepthArr = new Array(N).fill(0);
  foundCentroids = [];
  document.getElementById("statN").textContent = "–";
  document.getElementById("statDepth").textContent = "–";
  document.getElementById("statBound").textContent = "–";
  document.getElementById("statWithin").textContent = "–";
  document.getElementById("statWithin").className = "stat-value";
  document.getElementById("pathCountLog").innerHTML = "";
  document.getElementById("statTotalPairs").textContent = "–";
  document.getElementById("statBruteForce").textContent = "–";
  document.getElementById("verifyBadge").textContent = "";
  document.getElementById("verifyBadge").className = "verify-badge";
}

function generateTree(){
  N = Math.max(3, Math.min(120, parseInt(document.getElementById("nodeCount").value, 10) || 20));
  const shape = document.getElementById("treeShape").value;
  if(shape === "random") adjacency = generateRandomTree(N);
  else if(shape === "path") adjacency = generatePathTree(N);
  else if(shape === "broom") adjacency = generateBroomTree(N);
  else adjacency = generateStarTree(N);

  origPositions = layoutTree(adjacency, N, 0, 860, 440);
  resetState();
  renderOriginalTree(adjacency, N, origPositions, removedArr, null, null, null);
  clearSvg(document.getElementById("centSvg"));
  setStatus(`Generated a ${shape} tree with ${N} nodes. Run the decomposition to watch it unfold.`);
}

/* ---------- animated decomposition ---------- */

async function runDecomposition(){
  setStatus("Running centroid decomposition...");
  resetState();

  async function rec(u, parentCentroid, parentDepth){
    const size = new Array(N).fill(0);
    computeSubtreeSizes(u, -1, adjacency, removedArr, size);
    const piece = currentPieceSet(u, -1, adjacency, removedArr);

    renderOriginalTree(adjacency, N, origPositions, removedArr, piece, null, null);
    await sleep(220);

    const path = findCentroidWithPath(u, adjacency, removedArr, size);
    for(let i = 0; i < path.length; i++){
      renderOriginalTree(adjacency, N, origPositions, removedArr, piece, path.slice(0, i + 1), null);
      await sleep(260);
    }
    const c = path[path.length - 1];
    renderOriginalTree(adjacency, N, origPositions, removedArr, piece, null, c);
    await sleep(260);

    removedArr[c] = true;
    centroidParentArr[c] = parentCentroid;
    centroidDepthArr[c] = parentDepth + 1;
    foundCentroids.push(c);

    renderOriginalTree(adjacency, N, origPositions, removedArr, null, null, null);
    renderCentroidTree(centroidParentArr, centroidDepthArr, foundCentroids);

    const depth = Math.max(...foundCentroids.map(id => centroidDepthArr[id]));
    const bound = Math.ceil(Math.log2(N + 1));
    document.getElementById("statN").textContent = N;
    document.getElementById("statDepth").textContent = depth;
    document.getElementById("statBound").textContent = bound;
    const within = depth <= bound + 1; // +1 slack for rounding at tiny n
    const withinEl = document.getElementById("statWithin");
    withinEl.textContent = within ? "Yes ✓" : "No ✗";
    withinEl.className = "stat-value " + (within ? "good" : "bad");

    setStatus(`Centroid ${c} found (piece size ${size[u]}), removed. Centroid-tree depth so far: ${depth}.`);

    for(const v of adjacency[c]){
      if(!removedArr[v]) await rec(v, c, centroidDepthArr[c]);
    }
  }

  await rec(0, -1, 0);
  setStatus(`Decomposition complete. Final centroid-tree depth: ${Math.max(...foundCentroids.map(id => centroidDepthArr[id]))} for n=${N}.`);
}

/* ---------- path-counting demo ---------- */

function logLine(html){
  const log = document.getElementById("pathCountLog");
  const div = document.createElement("div");
  div.innerHTML = html;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function runPathCountDemo(K){
  document.getElementById("pathCountLog").innerHTML = "";
  const removed = new Array(N).fill(false);
  let total = 0;

  function rec(u){
    const size = new Array(N).fill(0);
    computeSubtreeSizes(u, -1, adjacency, removed, size);
    const path = findCentroidWithPath(u, adjacency, removed, size);
    const c = path[path.length - 1];
    removed[c] = true;

    const allDist = [0];
    for(const v of adjacency[c]) if(!removed[v]) collectDistances(v, c, adjacency, removed, 1, allDist);
    const allCount = countPairsLE(allDist, K);

    let subtract = 0;
    const branchCounts = [];
    for(const v of adjacency[c]){
      if(!removed[v]){
        const branchDist = [];
        collectDistances(v, c, adjacency, removed, 1, branchDist);
        const bc = countPairsLE(branchDist, K);
        subtract += bc;
        branchCounts.push(bc);
      }
    }
    const net = allCount - subtract;
    total += net;

    logLine(
      `centroid <span class="log-c">${c}</span> — piece size ${size[u]}: ` +
      `<span class="log-plus">+${allCount}</span> pairs through/at centroid, ` +
      `<span class="log-minus">−${subtract}</span> same-branch overcounts ` +
      `(${branchCounts.join(", ") || "none"}) ⇒ net +${net}`
    );

    for(const v of adjacency[c]) if(!removed[v]) rec(v);
  }

  rec(0);
  document.getElementById("statTotalPairs").textContent = total;
  return total;
}

/* ---------- wire up UI ---------- */

document.getElementById("btnGenerate").addEventListener("click", generateTree);
document.getElementById("btnReset").addEventListener("click", () => {
  resetState();
  renderOriginalTree(adjacency, N, origPositions, removedArr, null, null, null);
  clearSvg(document.getElementById("centSvg"));
  setStatus("Reset. Run the decomposition again whenever you're ready.");
});
document.getElementById("btnDecompose").addEventListener("click", runDecomposition);

document.getElementById("btnRunPathCount").addEventListener("click", () => {
  const K = Math.max(0, parseInt(document.getElementById("kInput").value, 10) || 0);
  document.getElementById("verifyBadge").textContent = "";
  document.getElementById("verifyBadge").className = "verify-badge";
  document.getElementById("statBruteForce").textContent = "–";
  const total = runPathCountDemo(K);
  setStatus(`Path-count demo done for K=${K}: ${total} pairs with dist(u,v) ≤ K.`);
});

document.getElementById("btnVerifyBrute").addEventListener("click", () => {
  const K = Math.max(0, parseInt(document.getElementById("kInput").value, 10) || 0);
  const centroidTotal = parseInt(document.getElementById("statTotalPairs").textContent, 10);
  const brute = countPairsBruteForce(N, adjacency, K);
  document.getElementById("statBruteForce").textContent = brute;
  const badge = document.getElementById("verifyBadge");
  if(!Number.isNaN(centroidTotal) && centroidTotal === brute){
    badge.textContent = "✓ matches brute-force O(n²) scan";
    badge.className = "verify-badge ok";
  } else {
    badge.textContent = "✗ mismatch — run the demo first";
    badge.className = "verify-badge fail";
  }
});

/* ---------- boot ---------- */
generateTree();
