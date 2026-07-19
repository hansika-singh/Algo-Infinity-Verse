/* ============================================================
   Treap Dual-Order Engine
   BST order on keys, max-heap order on random priorities.
   ============================================================ */

const SVG_NS = "http://www.w3.org/2000/svg";
let nodeIdSeq = 1;

function makeNode(key){
  return {
    id: nodeIdSeq++,
    key,
    priority: Math.floor(Math.random() * 100000),
    left: null,
    right: null
  };
}

/* ---------- core treap algorithms ---------- */

// Standard BST-insert-as-leaf, then bubble the new node up via single
// rotations while it violates heap order on priority against its parent.
// Returns { root, frames } where frames is an array of tree snapshots
// (one per meaningful step) used to animate the bubble-up.
function treapInsert(root, key){
  const node = makeNode(key);
  const frames = [];

  if(!root){
    frames.push(cloneTree(node));
    return { root: node, frames };
  }

  const path = [];
  let cur = root;
  while(true){
    path.push(cur);
    if(key < cur.key){
      if(!cur.left){ cur.left = node; break; }
      cur = cur.left;
    } else {
      if(!cur.right){ cur.right = node; break; }
      cur = cur.right;
    }
  }

  frames.push(cloneTree(root)); // snapshot right after leaf insertion

  let bubbling = node;
  for(let i = path.length - 1; i >= 0; i--){
    const parent = path[i];
    if(bubbling.priority <= parent.priority) break;
    if(parent.left === bubbling){
      parent.left = bubbling.right;
      bubbling.right = parent;
    } else {
      parent.right = bubbling.left;
      bubbling.left = parent;
    }
    if(i > 0){
      const grand = path[i - 1];
      if(grand.left === parent) grand.left = bubbling; else grand.right = bubbling;
    } else {
      root = bubbling;
    }
    frames.push(cloneTree(root));
  }

  return { root, frames };
}

function rotateRight(t){
  const l = t.left;
  t.left = l.right;
  l.right = t;
  return l;
}
function rotateLeft(t){
  const r = t.right;
  t.right = r.left;
  r.left = t;
  return r;
}

// Standard treap delete: rotate the target node down (toward whichever
// child has higher priority) until it is a leaf, then splice it out.
function treapDelete(root, key){
  if(!root) return null;
  if(key < root.key){
    root.left = treapDelete(root.left, key);
  } else if(key > root.key){
    root.right = treapDelete(root.right, key);
  } else {
    if(!root.left) return root.right;
    if(!root.right) return root.left;
    if(root.left.priority > root.right.priority){
      root = rotateRight(root);
      root.right = treapDelete(root.right, key);
    } else {
      root = rotateLeft(root);
      root.left = treapDelete(root.left, key);
    }
  }
  return root;
}

// split(t, key): everything with key <= splitKey goes left, rest goes right.
function treapSplit(t, key){
  if(!t) return [null, null];
  if(t.key <= key){
    const [l, r] = treapSplit(t.right, key);
    t.right = l;
    return [t, r];
  } else {
    const [l, r] = treapSplit(t.left, key);
    t.left = r;
    return [l, t];
  }
}

// merge(l, r): every key in l must be < every key in r.
function treapMerge(l, r){
  if(!l) return r;
  if(!r) return l;
  if(l.priority > r.priority){
    l.right = treapMerge(l.right, r);
    return l;
  } else {
    r.left = treapMerge(l, r.left);
    return r;
  }
}

function cloneTree(t){
  if(!t) return null;
  return { id: t.id, key: t.key, priority: t.priority, left: cloneTree(t.left), right: cloneTree(t.right) };
}

function treeHeight(t){
  if(!t) return 0;
  return 1 + Math.max(treeHeight(t.left), treeHeight(t.right));
}

function collectKeys(t, out = []){
  if(!t) return out;
  collectKeys(t.left, out);
  out.push(t.key);
  collectKeys(t.right, out);
  return out;
}

/* ---------- layout ---------- */

// x = in-order rank (shared across BST + heap views, this is what makes
// the Cartesian-tree duality visible). y differs per view.
function layoutBST(root, width, height){
  const positions = new Map();
  let rank = 0;
  const n = countNodes(root);
  const xStep = n > 1 ? width / (n + 1) : width / 2;

  function visit(node, depth){
    if(!node) return;
    visit(node.left, depth + 1);
    rank++;
    const x = xStep * rank;
    const y = 44 + depth * 62;
    positions.set(node.id, { x, y, node });
    visit(node.right, depth + 1);
  }
  visit(root, 0);
  return positions;
}

function layoutHeap(root, width, height){
  const positions = new Map();
  let rank = 0;
  const n = countNodes(root);
  const xStep = n > 1 ? width / (n + 1) : width / 2;

  const priorities = [];
  collectPriorities(root, priorities);
  const minP = Math.min(...priorities, 0);
  const maxP = Math.max(...priorities, 1);
  const span = Math.max(1, maxP - minP);

  function visit(node){
    if(!node) return;
    visit(node.left);
    rank++;
    const x = xStep * rank;
    // higher priority -> nearer the top
    const norm = (node.priority - minP) / span;
    const y = 30 + (1 - norm) * (height - 70);
    positions.set(node.id, { x, y, node });
    visit(node.right);
  }
  visit(root);
  return positions;
}

function countNodes(t){
  if(!t) return 0;
  return 1 + countNodes(t.left) + countNodes(t.right);
}
function collectPriorities(t, out){
  if(!t) return;
  out.push(t.priority);
  collectPriorities(t.left, out);
  collectPriorities(t.right, out);
}

/* ---------- rendering ---------- */

function clearSvg(svg){
  while(svg.firstChild) svg.removeChild(svg.firstChild);
}

function renderTree(svg, root, positions, kind, highlightIds = new Set()){
  clearSvg(svg);
  if(!root) return;

  const linkLayer = document.createElementNS(SVG_NS, "g");
  const nodeLayer = document.createElementNS(SVG_NS, "g");
  svg.appendChild(linkLayer);
  svg.appendChild(nodeLayer);

  function drawLinks(node){
    if(!node) return;
    const p = positions.get(node.id);
    [node.left, node.right].forEach(child => {
      if(!child) return;
      const c = positions.get(child.id);
      if(!p || !c) return;
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", p.x); line.setAttribute("y1", p.y);
      line.setAttribute("x2", c.x); line.setAttribute("y2", c.y);
      line.setAttribute("class", "tree-link" + (highlightIds.has(node.id) && highlightIds.has(child.id) ? " hi" : ""));
      linkLayer.appendChild(line);
      drawLinks(child);
    });
  }
  drawLinks(root);

  positions.forEach(({ x, y, node }) => {
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "node-group");
    g.setAttribute("transform", `translate(${x},${y})`);

    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("r", 20);
    circle.setAttribute("class", "node-circle " + kind + (highlightIds.has(node.id) ? " hi" : ""));
    g.appendChild(circle);

    const keyText = document.createElementNS(SVG_NS, "text");
    keyText.setAttribute("class", "node-key");
    keyText.setAttribute("y", 5);
    keyText.textContent = node.key;
    g.appendChild(keyText);

    const priText = document.createElementNS(SVG_NS, "text");
    priText.setAttribute("class", "node-pri");
    priText.setAttribute("y", 32);
    priText.textContent = "p:" + node.priority;
    g.appendChild(priText);

    nodeLayer.appendChild(g);
  });
}

function renderBoth(root, highlightIds = new Set()){
  const bstSvg = document.getElementById("bstSvg");
  const heapSvg = document.getElementById("heapSvg");
  const posB = layoutBST(root, 860, 380);
  const posH = layoutHeap(root, 860, 380);
  renderTree(bstSvg, root, posB, "bst", highlightIds);
  renderTree(heapSvg, root, posH, "heap", highlightIds);
}

/* ---------- app state & interactions ---------- */

let treap = null;
let lastSplit = null; // { key, left, right }

const statusLine = document.getElementById("statusLine");
function setStatus(msg){ statusLine.textContent = msg; }

function sleep(ms){ return new Promise(res => setTimeout(res, ms)); }

async function playInsertFrames(frames){
  for(let i = 0; i < frames.length; i++){
    const isLast = i === frames.length - 1;
    renderBoth(frames[i], isLast ? new Set() : new Set([frames[i].id]));
    await sleep(frames.length > 1 ? 380 : 120);
  }
}

async function handleInsert(key){
  if(Number.isNaN(key)){ setStatus("Enter a numeric key to insert."); return; }
  if(findKey(treap, key)){ setStatus(`Key ${key} already exists — treap keys are unique.`); return; }

  setStatus(`Rolling a random priority for key ${key}...`);
  await sleep(150);

  const { root, frames } = treapInsert(treap, key);
  const rotations = Math.max(0, frames.length - 1);
  setStatus(`Key ${key} inserted with priority ${findKey(root,key).priority}. ${rotations} rotation(s) to restore heap order.`);
  await playInsertFrames(frames);
  treap = root;
  renderBoth(treap);
  clearSplitPanel();
}

function findKey(t, key){
  while(t){
    if(key === t.key) return t;
    t = key < t.key ? t.left : t.right;
  }
  return null;
}

function handleDelete(key){
  if(Number.isNaN(key)){ setStatus("Enter a numeric key to delete."); return; }
  if(!findKey(treap, key)){ setStatus(`Key ${key} isn't in the treap.`); return; }
  treap = treapDelete(treap, key);
  setStatus(`Key ${key} rotated down to a leaf (favoring the higher-priority child each step) and removed.`);
  renderBoth(treap);
  clearSplitPanel();
}

function handleClear(){
  treap = null;
  setStatus("Treap cleared.");
  renderBoth(treap);
  clearSplitPanel();
}

function handleSplit(key){
  if(Number.isNaN(key)){ setStatus("Enter a key to split at."); return; }
  if(!treap){ setStatus("Nothing to split — treap is empty."); return; }
  const clone = cloneTree(treap);
  const [l, r] = treapSplit(clone, key);
  lastSplit = { key, left: l, right: r };
  document.getElementById("splitPanel").classList.remove("hidden");
  document.getElementById("btnMerge").disabled = false;
  document.getElementById("roundtripBadge").textContent = "";
  document.getElementById("roundtripBadge").className = "roundtrip-badge";

  const leftPos = layoutBST(l, 400, 300);
  const rightPos = layoutBST(r, 400, 300);
  renderTree(document.getElementById("leftSvg"), l, leftPos, "bst");
  renderTree(document.getElementById("rightSvg"), r, rightPos, "bst");
  document.getElementById("leftCount").textContent = countNodes(l);
  document.getElementById("rightCount").textContent = countNodes(r);
  setStatus(`Split at key ${key}: ${countNodes(l)} node(s) with key ≤ ${key} on the left, ${countNodes(r)} node(s) with key > ${key} on the right.`);
}

function handleMerge(){
  if(!lastSplit){ setStatus("Split something first."); return; }
  const before = collectKeys(treap).slice().sort((a,b)=>a-b);
  const merged = treapMerge(cloneTree(lastSplit.left), cloneTree(lastSplit.right));
  const after = collectKeys(merged).slice().sort((a,b)=>a-b);
  const same = before.length === after.length && before.every((k, i) => k === after[i]);

  const badge = document.getElementById("roundtripBadge");
  if(same){
    badge.textContent = "✓ round-trip verified — identical key set";
    badge.className = "roundtrip-badge ok";
  } else {
    badge.textContent = "✗ key sets differ after split → merge";
    badge.className = "roundtrip-badge fail";
  }

  treap = merged;
  renderBoth(treap);
  setStatus("Merged left and right treaps back together via treapMerge().");
}

function clearSplitPanel(){
  lastSplit = null;
  document.getElementById("splitPanel").classList.add("hidden");
  document.getElementById("btnMerge").disabled = true;
  document.getElementById("roundtripBadge").textContent = "";
}

/* ---------- telemetry ---------- */

function runTrials(n, trials, mode){
  const heights = [];
  for(let t = 0; t < trials; t++){
    let root = null;
    if(mode === "random"){
      const keys = shuffledRange(n);
      for(const k of keys) root = treapInsert(root, k).root;
    } else { // sorted, adversarial key order
      for(let k = 1; k <= n; k++) root = treapInsert(root, k).root;
    }
    heights.push(treeHeight(root));
  }
  return heights;
}

function shuffledRange(n){
  const arr = Array.from({ length: n }, (_, i) => i + 1);
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderHistogram(heights, n){
  const svg = document.getElementById("histSvg");
  clearSvg(svg);
  const W = 900, H = 320, padL = 40, padB = 34, padT = 16, padR = 16;
  const plotW = W - padL - padR, plotH = H - padT - padB;

  const maxH = Math.max(...heights, 1);
  const buckets = new Array(maxH + 1).fill(0);
  heights.forEach(h => buckets[h]++);
  const maxCount = Math.max(...buckets, 1);

  const barW = plotW / (maxH + 1);

  // axis
  const axis = document.createElementNS(SVG_NS, "line");
  axis.setAttribute("x1", padL); axis.setAttribute("y1", H - padB);
  axis.setAttribute("x2", W - padR); axis.setAttribute("y2", H - padB);
  axis.setAttribute("class", "hist-axis");
  svg.appendChild(axis);

  buckets.forEach((count, h) => {
    if(count === 0) return;
    const barH = (count / maxCount) * plotH;
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", padL + h * barW + barW * 0.15);
    rect.setAttribute("y", H - padB - barH);
    rect.setAttribute("width", barW * 0.7);
    rect.setAttribute("height", barH);
    rect.setAttribute("class", "hist-bar");
    svg.appendChild(rect);

    if(h % Math.max(1, Math.round((maxH+1)/16)) === 0){
      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("x", padL + h * barW + barW / 2);
      label.setAttribute("y", H - padB + 16);
      label.setAttribute("class", "hist-label");
      label.textContent = h;
      svg.appendChild(label);
    }
  });

  // theoretical expected-height marker: ~ (ln n)/ln(phi) ≈ well-known treap bound,
  // we use the commonly cited ~ 3 * log2(n) upper-ish reference line.
  const theory = 3 * Math.log2(Math.max(2, n));
  if(theory <= maxH + 1){
    const x = padL + theory * barW;
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", x); line.setAttribute("y1", padT);
    line.setAttribute("x2", x); line.setAttribute("y2", H - padB);
    line.setAttribute("class", "hist-theory-line");
    svg.appendChild(line);

    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("x", x);
    label.setAttribute("y", padT + 10);
    label.setAttribute("class", "hist-label");
    label.style.fill = "var(--cyan)";
    label.textContent = "3·log₂n";
    svg.appendChild(label);
  }
}

function handleRunTrials(mode){
  const n = Math.max(4, Math.min(4096, parseInt(document.getElementById("trialSize").value, 10) || 128));
  const trials = Math.max(1, Math.min(2000, parseInt(document.getElementById("trialCount").value, 10) || 200));

  setStatus(`Running ${trials} ${mode === "random" ? "random-order" : "adversarial sorted-order"} trials of n=${n}...`);

  // yield to the browser so the status text paints before the (synchronous) crunch
  setTimeout(() => {
    const heights = runTrials(n, trials, mode);
    const avg = heights.reduce((a,b) => a+b, 0) / heights.length;
    const max = Math.max(...heights);
    const theory = 3 * Math.log2(Math.max(2, n));

    renderHistogram(heights, n);
    document.getElementById("statTrials").textContent = trials;
    document.getElementById("statAvg").textContent = avg.toFixed(2);
    document.getElementById("statMax").textContent = max;
    document.getElementById("statTheory").textContent = theory.toFixed(2);

    setStatus(
      mode === "random"
        ? `Random-order result: avg height ${avg.toFixed(2)} for n=${n}, tracking the O(log n) expectation.`
        : `Adversarial sorted-key result: avg height ${avg.toFixed(2)} for n=${n} — still O(log n), because priorities (not key order) drive the balance.`
    );
  }, 20);
}

/* ---------- wire up UI ---------- */

document.getElementById("btnInsert").addEventListener("click", () => {
  const key = parseInt(document.getElementById("keyInput").value, 10);
  handleInsert(key);
});
document.getElementById("keyInput").addEventListener("keydown", e => {
  if(e.key === "Enter") handleInsert(parseInt(e.target.value, 10));
});
document.getElementById("btnDelete").addEventListener("click", () => {
  const key = parseInt(document.getElementById("keyInput").value, 10);
  handleDelete(key);
});
document.getElementById("btnRandom").addEventListener("click", () => {
  const key = Math.floor(Math.random() * 999) + 1;
  document.getElementById("keyInput").value = key;
  handleInsert(key);
});
document.getElementById("btnClear").addEventListener("click", handleClear);

document.getElementById("btnSplit").addEventListener("click", () => {
  const key = parseInt(document.getElementById("splitInput").value, 10);
  handleSplit(key);
});
document.getElementById("btnMerge").addEventListener("click", handleMerge);

document.getElementById("btnRunRandom").addEventListener("click", () => handleRunTrials("random"));
document.getElementById("btnRunSorted").addEventListener("click", () => handleRunTrials("sorted"));

/* ---------- boot: seed a small starter treap ---------- */

(function seed(){
  const starter = [50, 30, 70, 20, 40, 60, 80, 10];
  starter.forEach(k => { treap = treapInsert(treap, k).root; });
  renderBoth(treap);
  setStatus("Seeded with a starter treap. Try inserting, deleting, splitting, or running the telemetry trials.");
})();
