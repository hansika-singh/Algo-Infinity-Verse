/* ============================================================
   Euler Tour Tree — UI layer (built on ett-core.js)
   ============================================================ */

const SVG_NS = "http://www.w3.org/2000/svg";

let N = 10;
let ett = null;
let pendingEdges = []; // [ [u,v], ... ] generated but not yet built into the tour

const statusLine = document.getElementById("statusLine");
function setStatus(msg, cls){
  statusLine.textContent = msg;
  statusLine.className = "status-line" + (cls ? " " + cls : "");
}
function sleep(ms){ return new Promise(res => setTimeout(res, ms)); }

/* ---------- generation ---------- */

function generateRandomTreeEdges(n){
  const edges = [];
  for(let i = 1; i < n; i++){
    const p = Math.floor(Math.random() * i);
    edges.push([p, i]);
  }
  return edges;
}

function resetForest(n){
  N = n;
  ett = createETT(n);
  pendingEdges = [];
  document.getElementById("focusNode").max = n - 1;
  document.getElementById("uInput").max = n - 1;
  document.getElementById("vInput").max = n - 1;
  document.getElementById("connU").max = n - 1;
  document.getElementById("connV").max = n - 1;
  renderAll();
}

function dfsLinkOrder(n, edges){
  const adjList = Array.from({ length: n }, () => []);
  edges.forEach(([a, b]) => { adjList[a].push(b); adjList[b].push(a); });
  const order = [];
  const visited = new Array(n).fill(false);
  (function dfs(u, p){
    visited[u] = true;
    if(p !== -1) order.push([p, u]);
    for(const w of adjList[u]) if(!visited[w]) dfs(w, u);
  })(0, -1);
  return order;
}

/* ---------- rendering ---------- */

function focusLabel(){
  const v = parseInt(document.getElementById("focusNode").value, 10);
  return Number.isNaN(v) || v < 0 || v >= N ? 0 : v;
}

function renderTourStrip(seq, highlightRange){
  const strip = document.getElementById("tourStrip");
  strip.innerHTML = "";
  seq.forEach((label, i) => {
    if(i > 0){
      const arrow = document.createElement("span");
      arrow.className = "tour-arrow";
      arrow.textContent = "→";
      strip.appendChild(arrow);
    }
    const box = document.createElement("div");
    let cls = "tour-box";
    if(highlightRange && i >= highlightRange[0] && i <= highlightRange[1]) cls += " new";
    box.className = cls;
    box.textContent = label;
    strip.appendChild(box);
  });
  document.getElementById("stripTag").textContent = `length ${seq.length} (2·${Math.ceil((seq.length + 1) / 2)}−1 for its component)`;
}

function layoutBSTFromSeqRoot(root, width, height){
  const positions = new Map();
  let rank = 0;
  function visit(node, depth){
    if(!node) return;
    visit(node.left, depth + 1);
    rank++;
    positions.set(node.id, { x: 0, y: 40 + depth * 46, node, rankIdx: rank });
    visit(node.right, depth + 1);
  }
  visit(root, 0);
  const total = rank;
  const xStep = total > 1 ? width / (total + 1) : width / 2;
  positions.forEach(p => { p.x = xStep * p.rankIdx; });
  return positions;
}

function renderBST(root){
  const svg = document.getElementById("bstSvg");
  svg.innerHTML = "";
  if(!root) return;
  const positions = layoutBSTFromSeqRoot(root, 860, 340);

  const linkLayer = document.createElementNS(SVG_NS, "g");
  const nodeLayer = document.createElementNS(SVG_NS, "g");
  svg.appendChild(linkLayer); svg.appendChild(nodeLayer);

  function drawLinks(node){
    if(!node) return;
    const p = positions.get(node.id);
    [node.left, node.right].forEach(child => {
      if(!child) return;
      const c = positions.get(child.id);
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", p.x); line.setAttribute("y1", p.y);
      line.setAttribute("x2", c.x); line.setAttribute("y2", c.y);
      line.setAttribute("class", "tree-link");
      linkLayer.appendChild(line);
      drawLinks(child);
    });
  }
  drawLinks(root);

  positions.forEach(({ x, y, node }) => {
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("transform", `translate(${x},${y})`);
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("r", 15);
    circle.setAttribute("class", "node-circle");
    g.appendChild(circle);
    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("class", "node-key"); label.setAttribute("y", 5);
    label.textContent = node.label;
    g.appendChild(label);
    nodeLayer.appendChild(g);
  });
}

function renderAll(highlightRange){
  if(!ett) return;
  const f = focusLabel();
  const seq = ett.tourOf(f);
  renderTourStrip(seq, highlightRange);
  const root = getRoot(ett.canonical(f));
  renderBST(root);
}

/* ---------- build (animated) ---------- */

async function animateBuildTour(){
  if(pendingEdges.length === 0){
    setStatus("Generate a random tree first.", "err");
    return;
  }
  const order = dfsLinkOrder(N, pendingEdges);
  setStatus(`Building the Euler tour: performing ${order.length} link(s) in DFS order, each a real splice.`);
  for(const [p, u] of order){
    const res = ett.link(p, u);
    if(!res.ok){
      setStatus(`Unexpected: link(${p},${u}) failed (${res.reason}).`, "err");
      return;
    }
    renderAll();
    await sleep(Math.max(120, 500 - order.length * 15));
  }
  const val = ett.validateComponent(0);
  setStatus(val.ok
    ? `Euler tour built: ${val.seq.length} entries (2·${N}−1) for n=${N}, every edge visited exactly twice. Valid ✓`
    : `Validation failed: ${val.reason}`, val.ok ? "ok" : "err");
  renderAll();
}

/* ---------- manual link / cut ---------- */

function handleLink(){
  const u = parseInt(document.getElementById("uInput").value, 10);
  const v = parseInt(document.getElementById("vInput").value, 10);
  if(Number.isNaN(u) || Number.isNaN(v) || u < 0 || v < 0 || u >= N || v >= N || u === v){
    setStatus("Enter two distinct valid node labels.", "err"); return;
  }
  const res = ett.link(u, v);
  if(!res.ok){
    setStatus(`link(${u},${v}) rejected: ${res.reason}.`, "err");
    return;
  }
  setStatus(`Linked ${u}–${v}: rerooted ${v}'s tour, spliced it into ${u}'s tour, appended one more visit to ${u}.`, "ok");
  renderAll();
}

function handleCut(){
  const u = parseInt(document.getElementById("uInput").value, 10);
  const v = parseInt(document.getElementById("vInput").value, 10);
  if(Number.isNaN(u) || Number.isNaN(v) || u < 0 || v < 0 || u >= N || v >= N || u === v){
    setStatus("Enter two distinct valid node labels.", "err"); return;
  }
  const res = ett.cut(u, v);
  if(!res.ok){
    setStatus(`cut(${u},${v}) rejected: ${res.reason}.`, "err");
    return;
  }
  setStatus(`Cut ${u}–${v}: extracted ${v}'s subtree block from ${u}'s tour and split it into two independent tours.`, "ok");
  renderAll();
}

/* ---------- connectivity checker ---------- */

function handleCheckConn(){
  const u = parseInt(document.getElementById("connU").value, 10);
  const v = parseInt(document.getElementById("connV").value, 10);
  if(Number.isNaN(u) || Number.isNaN(v) || u < 0 || v < 0 || u >= N || v >= N){
    setStatus("Enter two valid node labels to check.", "err"); return;
  }
  const ettAns = ett.connected(u, v);
  const bruteAns = ett.bruteConnected(u, v);
  document.getElementById("connEtt").textContent = ettAns ? "connected" : "not connected";
  document.getElementById("connBrute").textContent = bruteAns ? "connected" : "not connected";
  const matchEl = document.getElementById("connMatch");
  const match = ettAns === bruteAns;
  matchEl.textContent = match ? "✓ match" : "✗ MISMATCH";
  matchEl.className = "stat-value " + (match ? "good" : "bad");
}

/* ---------- stress test ---------- */

function runStressTest(){
  const opCount = Math.max(10, Math.min(2000, parseInt(document.getElementById("opCount").value, 10) || 150));
  let checks = 0, mismatches = 0, invalidTours = 0, badRejections = 0;

  for(let step = 0; step < opCount; step++){
    const u = Math.floor(Math.random() * N), v = Math.floor(Math.random() * N);
    if(u === v) continue;
    if(Math.random() < 0.55){
      const wasConnected = ett.bruteConnected(u, v);
      const res = ett.link(u, v);
      if(wasConnected === res.ok) badRejections++;
    } else {
      const edgeExists = ett.adj.get(u).has(v);
      const res = ett.cut(u, v);
      if(edgeExists !== res.ok) badRejections++;
    }
    for(let q = 0; q < 3; q++){
      const a = Math.floor(Math.random() * N), b = Math.floor(Math.random() * N);
      checks++;
      if(ett.connected(a, b) !== ett.bruteConnected(a, b)) mismatches++;
    }
    const a = Math.floor(Math.random() * N);
    const val = ett.validateComponent(a);
    if(!val.ok) invalidTours++;
  }

  document.getElementById("stressOps").textContent = opCount;
  document.getElementById("stressChecks").textContent = checks;
  const mm = document.getElementById("stressMismatch");
  mm.textContent = mismatches; mm.className = "stat-value " + (mismatches === 0 ? "good" : "bad");
  const iv = document.getElementById("stressInvalid");
  iv.textContent = invalidTours; iv.className = "stat-value " + (invalidTours === 0 ? "good" : "bad");
  const br = document.getElementById("stressBadReject");
  br.textContent = badRejections; br.className = "stat-value " + (badRejections === 0 ? "good" : "bad");

  setStatus(`Stress test complete: ${opCount} ops, ${checks} connectivity checks, ${mismatches} mismatches, ${invalidTours} invalid tours, ${badRejections} wrong accept/reject.`,
    (mismatches === 0 && invalidTours === 0 && badRejections === 0) ? "ok" : "err");
  renderAll();
}

/* ---------- wire up UI ---------- */

document.getElementById("btnGenerate").addEventListener("click", () => {
  const n = Math.max(2, Math.min(60, parseInt(document.getElementById("nodeCount").value, 10) || 10));
  resetForest(n);
  pendingEdges = generateRandomTreeEdges(n);
  setStatus(`Generated a random tree with ${n} nodes (all isolated in the ETT for now). Click "Animate Euler Tour Construction" to build it.`);
});
document.getElementById("btnBuildTour").addEventListener("click", animateBuildTour);
document.getElementById("btnReset").addEventListener("click", () => {
  const n = Math.max(2, Math.min(60, parseInt(document.getElementById("nodeCount").value, 10) || 10));
  resetForest(n);
  setStatus("Reset: all nodes isolated.");
});
document.getElementById("btnLink").addEventListener("click", handleLink);
document.getElementById("btnCut").addEventListener("click", handleCut);
document.getElementById("focusNode").addEventListener("change", () => renderAll());
document.getElementById("btnCheckConn").addEventListener("click", handleCheckConn);
document.getElementById("btnStress").addEventListener("click", runStressTest);

/* ---------- boot ---------- */
resetForest(10);
pendingEdges = generateRandomTreeEdges(10);
setStatus("Ready. Click \"Animate Euler Tour Construction\" to build the initial tree, or link/cut nodes manually.");
