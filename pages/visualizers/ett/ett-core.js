/* ============================================================
   Euler Tour Tree — pure core logic (no DOM)
   Implicit (position-based) treap storing the Euler tour sequence.
   ============================================================ */

let TOKEN_ID = 1;
function TreapNode(label){
  this.id = TOKEN_ID++;
  this.label = label;
  this.priority = Math.random();
  this.size = 1;
  this.left = null;
  this.right = null;
  this.parent = null;
}
function getSize(n){ return n ? n.size : 0; }
function update(n){ if(n) n.size = 1 + getSize(n.left) + getSize(n.right); }
function setLeft(n, c){ n.left = c; if(c) c.parent = n; update(n); }
function setRight(n, c){ n.right = c; if(c) c.parent = n; update(n); }

function splitRaw(node, k){
  if(!node) return [null, null];
  const ls = getSize(node.left);
  if(k <= ls){
    const [l, r] = splitRaw(node.left, k);
    setLeft(node, r);
    return [l, node];
  } else {
    const [l, r] = splitRaw(node.right, k - ls - 1);
    setRight(node, l);
    return [node, r];
  }
}
// split(root, k): first k elements (in-order) -> left, rest -> right. Both returned roots are clean (parent=null).
function split(node, k){
  const [l, r] = splitRaw(node, k);
  if(l) l.parent = null;
  if(r) r.parent = null;
  return [l, r];
}
// merge(l, r): l,r must be roots (parent=null) or null.
function merge(l, r){
  if(!l) return r;
  if(!r) return l;
  if(l.priority > r.priority){
    setRight(l, merge(l.right, r));
    return l;
  } else {
    setLeft(r, merge(l, r.left));
    return r;
  }
}
function rank(node){
  let r = getSize(node.left) + 1;
  let cur = node;
  while(cur.parent){
    if(cur.parent.right === cur) r += getSize(cur.parent.left) + 1;
    cur = cur.parent;
  }
  return r;
}
function getRoot(node){
  let cur = node;
  while(cur.parent) cur = cur.parent;
  return cur;
}
function inorder(node, out = []){
  if(!node) return out;
  inorder(node.left, out);
  out.push(node.label);
  inorder(node.right, out);
  return out;
}

/* ---------- Euler Tour Tree wrapper ---------- */

function createETT(n){
  const occurrences = new Map(); // label -> Set<TreapNode>
  const adj = new Map();         // ground-truth adjacency, label -> Set<label>
  for(let i = 0; i < n; i++){
    const t = new TreapNode(i);
    occurrences.set(i, new Set([t]));
    adj.set(i, new Set());
  }

  function canonical(label){
    return occurrences.get(label).values().next().value;
  }
  function addToken(label){
    const t = new TreapNode(label);
    occurrences.get(label).add(t);
    return t;
  }
  function discardToken(t){
    occurrences.get(t.label).delete(t);
  }

  function connected(u, v){
    return getRoot(canonical(u)) === getRoot(canonical(v));
  }

  // reroot(v): make v (any current occurrence) the new start (rank 1) of its tour.
  function reroot(v){
    const p = canonical(v);
    const root = getRoot(p);
    const size = getSize(root);
    if(size === 1) return { changed: false };
    const i = rank(p);
    if(i === 1) return { changed: false };
    const [left, right] = split(root, i - 1);
    const [discard, leftRest] = split(left, 1);
    discardToken(discard);
    const fresh = addToken(v);
    const merged1 = merge(right, leftRest);
    merge(merged1, fresh); // new combined root reachable via any token's getRoot()
    return { changed: true, discardedLabel: discard.label, pivot: p };
  }

  function link(u, v){
    if(connected(u, v)) return { ok: false, reason: "would create a cycle" };
    reroot(v);
    const p = canonical(u);
    const pRank = rank(p);
    const rootU = getRoot(p);
    const [left, right] = split(rootU, pRank);
    const rootV = getRoot(canonical(v));
    const fresh = addToken(u);
    merge(merge(merge(left, rootV), fresh), right);
    adj.get(u).add(v);
    adj.get(v).add(u);
    return { ok: true };
  }

  function componentOf(start, excludeEdge){
    // BFS on ground-truth adjacency, optionally not crossing one specific edge
    const seen = new Set([start]);
    const q = [start];
    while(q.length){
      const x = q.shift();
      for(const y of adj.get(x)){
        if(excludeEdge && ((excludeEdge[0] === x && excludeEdge[1] === y) || (excludeEdge[0] === y && excludeEdge[1] === x))) continue;
        if(!seen.has(y)){ seen.add(y); q.push(y); }
      }
    }
    return seen;
  }

  function cut(u, v){
    if(!adj.get(u).has(v)) return { ok: false, reason: "edge does not exist" };
    const vSide = componentOf(v, [u, v]);
    const sv = vSide.size;
    reroot(u);
    const rootCombined = getRoot(canonical(u));
    let lo = Infinity, hi = -Infinity, count = 0;
    for(const label of vSide){
      for(const t of occurrences.get(label)){
        const r = rank(t);
        if(r < lo) lo = r;
        if(r > hi) hi = r;
        count++;
      }
    }
    if(count !== 2 * sv - 1 || hi - lo + 1 !== 2 * sv - 1){
      return { ok: false, reason: "internal error: v-side block not contiguous", debug: { count, lo, hi, sv } };
    }
    const [prefix, rest] = split(rootCombined, lo - 1);
    const [block, afterBlock] = split(rest, hi - lo + 1);
    const [extraU, suffix] = split(afterBlock, 1);
    if(!extraU || extraU.label !== u){
      return { ok: false, reason: "internal error: trailing token after v-block was not labeled u", debug: { extraU } };
    }
    discardToken(extraU);
    merge(prefix, suffix); // u's remaining tour
    adj.get(u).delete(v);
    adj.get(v).delete(u);
    return { ok: true, vBlockRoot: block };
  }

  function bruteConnected(u, v){
    const seen = new Set([u]);
    const q = [u];
    while(q.length){
      const x = q.shift();
      if(x === v) return true;
      for(const y of adj.get(x)) if(!seen.has(y)){ seen.add(y); q.push(y); }
    }
    return seen.has(v);
  }

  function tourOf(label){
    return inorder(getRoot(canonical(label)));
  }

  function componentLabelsOf(label){
    return componentOf(label, null);
  }

  // Validity checker: re-reading the current tour for `label`'s component
  // must reproduce a genuine Euler tour of the ground-truth edges.
  function validateComponent(label){
    const comp = [...componentLabelsOf(label)];
    const m = comp.length;
    const seq = tourOf(label);
    if(seq.length !== 2 * m - 1) return { ok: false, reason: `length ${seq.length} !== 2*${m}-1` };
    const edgeCounts = new Map();
    for(let i = 0; i + 1 < seq.length; i++){
      const a = seq[i], b = seq[i + 1];
      if(a === b) return { ok: false, reason: `adjacent duplicate ${a} at pos ${i}` };
      const key = a < b ? a + "-" + b : b + "-" + a;
      edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
    }
    const trueEdges = new Set();
    for(const x of comp) for(const y of adj.get(x)) if(x < y) trueEdges.add(x + "-" + y);
    if(edgeCounts.size !== trueEdges.size) return { ok: false, reason: "edge-set mismatch" };
    for(const e of trueEdges){
      if(edgeCounts.get(e) !== 2) return { ok: false, reason: `edge ${e} traversed ${edgeCounts.get(e) || 0} times` };
    }
    return { ok: true, seq };
  }

  return { link, cut, connected, bruteConnected, reroot, tourOf, componentLabelsOf, validateComponent, adj, occurrences, canonical };
}

if(typeof module !== "undefined") module.exports = { createETT, TreapNode, split, merge, rank, getRoot, inorder };
