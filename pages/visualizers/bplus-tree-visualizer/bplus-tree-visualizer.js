document.addEventListener('DOMContentLoaded', function () {
  bptInit();
});


var bptNodeIdCounter = 0;
var bptTree = null;
var bptCurrentOp = 'insert';
var bptSteps = [];
var bptStepIndex = 0;
var bptPlaying = false;
var bptTimer = null;
var bptSpeed = 700;

var BPT_OPS = ['insert', 'delete', 'search'];

function bptCreateNode(isLeaf) {
  bptNodeIdCounter++;

  return {
    id: bptNodeIdCounter,
    leaf: isLeaf,
    keys: [],
    values: isLeaf ? [] : undefined,
    children: isLeaf ? undefined : [],
    next: isLeaf ? null : undefined,
    parent: null
  };
}

function bptCreateTree(order) {
  var root = bptCreateNode(true);
  return { root: root, order: order };
}

function bptMaxKeys(tree) {
  return tree.order - 1;
}

function bptMinKeys(tree) {
  return Math.max(1, Math.ceil(tree.order / 2) - 1);
}

function bptFindChildIndex(node, key) {
  var i = 0;
  while (i < node.keys.length && key >= node.keys[i]) {
    i++;
  }
  return i;
}

function bptKeyExistsQuiet(tree, key) {
  var node = tree.root;
  while (!node.leaf) {
    node = node.children[bptFindChildIndex(node, key)];
  }
  return node.keys.indexOf(key) > -1;
}

/* ════════════════════════════════════════════
   SNAPSHOTS (for step-by-step playback)
════════════════════════════════════════════ */

function bptCloneForSnapshot(node) {
  if (!node) return null;

  return {
    id: node.id,
    leaf: node.leaf,
    keys: node.keys.slice(),
    children: node.leaf ? [] : node.children.map(bptCloneForSnapshot)
  };
}

function bptSnapshot(tree, highlightIds, message, type) {
  return {
    root: bptCloneForSnapshot(tree.root),
    highlight: highlightIds.slice(),
    type: type || 'active',
    message: message
  };
}

/* ════════════════════════════════════════════
   INSERT
════════════════════════════════════════════ */

function bptInsertKey(tree, key, steps) {
  steps.push(bptSnapshot(tree, [], 'Searching for the correct leaf to insert ' + key, 'active'));

  var node = tree.root;
  var path = [];

  while (!node.leaf) {
    path.push(node.id);
    steps.push(bptSnapshot(tree, path.slice(), 'At internal node, routing ' + key, 'active'));
    node = node.children[bptFindChildIndex(node, key)];
  }

  path.push(node.id);

  var idx = node.keys.findIndex(function (k) { return k > key; });
  if (idx === -1) idx = node.keys.length;

  node.keys.splice(idx, 0, key);
  node.values.splice(idx, 0, key);

  steps.push(bptSnapshot(tree, [node.id], 'Inserted ' + key + ' into leaf', 'active'));

  if (node.keys.length > bptMaxKeys(tree)) {
    bptSplitLeaf(tree, node, steps);
  }
}

function bptSplitLeaf(tree, node, steps) {
  var mid = Math.ceil(node.keys.length / 2);

  var newLeaf = bptCreateNode(true);
  newLeaf.keys = node.keys.splice(mid);
  newLeaf.values = node.values.splice(mid);
  newLeaf.next = node.next;
  node.next = newLeaf;

  var upKey = newLeaf.keys[0];

  steps.push(bptSnapshot(tree, [node.id, newLeaf.id], 'Leaf overflowed — splitting, key ' + upKey + ' moves up to parent', 'split'));

  bptInsertIntoParent(tree, node, upKey, newLeaf, steps);
}

function bptSplitInternal(tree, node, steps) {
  var mid = Math.floor(node.keys.length / 2);
  var upKey = node.keys[mid];

  var newNode = bptCreateNode(false);
  newNode.keys = node.keys.slice(mid + 1);
  newNode.children = node.children.slice(mid + 1);
  newNode.children.forEach(function (c) { c.parent = newNode; });

  node.keys = node.keys.slice(0, mid);
  node.children = node.children.slice(0, mid + 1);

  steps.push(bptSnapshot(tree, [node.id, newNode.id], 'Internal node overflowed — splitting, key ' + upKey + ' moves up', 'split'));

  bptInsertIntoParent(tree, node, upKey, newNode, steps);
}

function bptInsertIntoParent(tree, left, key, right, steps) {
  var parent = left.parent;

  if (!parent) {
    var newRoot = bptCreateNode(false);
    newRoot.keys = [key];
    newRoot.children = [left, right];
    left.parent = newRoot;
    right.parent = newRoot;
    tree.root = newRoot;

    steps.push(bptSnapshot(tree, [newRoot.id], 'Root split — created a new root with key ' + key, 'split'));
    return;
  }

  var idx = parent.children.indexOf(left);
  parent.keys.splice(idx, 0, key);
  parent.children.splice(idx + 1, 0, right);
  right.parent = parent;

  steps.push(bptSnapshot(tree, [parent.id], 'Key ' + key + ' inserted into parent node', 'active'));

  if (parent.keys.length > bptMaxKeys(tree)) {
    bptSplitInternal(tree, parent, steps);
  }
}

/* ════════════════════════════════════════════
   DELETE
════════════════════════════════════════════ */

function bptDeleteKey(tree, key, steps) {
  steps.push(bptSnapshot(tree, [], 'Searching for leaf containing ' + key, 'active'));

  var node = tree.root;
  var path = [];

  while (!node.leaf) {
    path.push(node.id);
    node = node.children[bptFindChildIndex(node, key)];
  }

  path.push(node.id);

  var idx = node.keys.indexOf(key);
  if (idx === -1) {
    steps.push(bptSnapshot(tree, [node.id], 'Key ' + key + ' was not found in the tree', 'notfound'));
    return false;
  }

  node.keys.splice(idx, 1);
  node.values.splice(idx, 1);

  steps.push(bptSnapshot(tree, [node.id], 'Removed ' + key + ' from leaf', 'active'));

  bptFixUnderflow(tree, node, steps);
  return true;
}

function bptFixUnderflow(tree, node, steps) {
  if (node === tree.root) {
    if (!node.leaf && node.keys.length === 0 && node.children.length === 1) {
      tree.root = node.children[0];
      tree.root.parent = null;
      steps.push(bptSnapshot(tree, [tree.root.id], 'Root had only one child — promoting it to be the new root', 'merge'));
    }
    return;
  }

  if (node.keys.length >= bptMinKeys(tree)) return;

  var parent = node.parent;
  var idx = parent.children.indexOf(node);
  var leftSibling = idx > 0 ? parent.children[idx - 1] : null;
  var rightSibling = idx < parent.children.length - 1 ? parent.children[idx + 1] : null;

  if (leftSibling && leftSibling.keys.length > bptMinKeys(tree)) {
    bptBorrowFromLeft(tree, parent, idx, steps);
    return;
  }

  if (rightSibling && rightSibling.keys.length > bptMinKeys(tree)) {
    bptBorrowFromRight(tree, parent, idx, steps);
    return;
  }

  if (leftSibling) {
    bptMergeNodes(tree, parent, idx - 1, steps);
  } else {
    bptMergeNodes(tree, parent, idx, steps);
  }
}

function bptBorrowFromLeft(tree, parent, idx, steps) {
  var node = parent.children[idx];
  var left = parent.children[idx - 1];

  if (node.leaf) {
    node.keys.unshift(left.keys.pop());
    node.values.unshift(left.values.pop());
    parent.keys[idx - 1] = node.keys[0];
  } else {
    var borrowedChild = left.children.pop();
    var borrowedKey = left.keys.pop();
    node.keys.unshift(parent.keys[idx - 1]);
    node.children.unshift(borrowedChild);
    borrowedChild.parent = node;
    parent.keys[idx - 1] = borrowedKey;
  }

  steps.push(bptSnapshot(tree, [node.id, left.id, parent.id], 'Borrowed a key from the left sibling', 'merge'));
}

function bptBorrowFromRight(tree, parent, idx, steps) {
  var node = parent.children[idx];
  var right = parent.children[idx + 1];

  if (node.leaf) {
    node.keys.push(right.keys.shift());
    node.values.push(right.values.shift());
    parent.keys[idx] = right.keys[0];
  } else {
    var borrowedChild = right.children.shift();
    var borrowedKey = right.keys.shift();
    node.keys.push(parent.keys[idx]);
    node.children.push(borrowedChild);
    borrowedChild.parent = node;
    parent.keys[idx] = borrowedKey;
  }

  steps.push(bptSnapshot(tree, [node.id, right.id, parent.id], 'Borrowed a key from the right sibling', 'merge'));
}

function bptMergeNodes(tree, parent, leftIdx, steps) {
  var left = parent.children[leftIdx];
  var right = parent.children[leftIdx + 1];

  if (left.leaf) {
    left.keys = left.keys.concat(right.keys);
    left.values = left.values.concat(right.values);
    left.next = right.next;
  } else {
    left.keys = left.keys.concat([parent.keys[leftIdx]], right.keys);
    left.children = left.children.concat(right.children);
    right.children.forEach(function (c) { c.parent = left; });
  }

  parent.keys.splice(leftIdx, 1);
  parent.children.splice(leftIdx + 1, 1);

  steps.push(bptSnapshot(tree, [left.id, parent.id], 'Merged node with its sibling', 'merge'));

  bptFixUnderflow(tree, parent, steps);
}

/* ════════════════════════════════════════════
   SEARCH
════════════════════════════════════════════ */

function bptSearchKey(tree, key, steps) {
  var node = tree.root;
  var path = [];

  steps.push(bptSnapshot(tree, [], 'Starting search for ' + key + ' at the root', 'active'));

  while (true) {
    path.push(node.id);
    steps.push(bptSnapshot(tree, path.slice(), 'Visiting node, comparing against ' + key, 'active'));

    if (node.leaf) {
      var found = node.keys.indexOf(key) > -1;
      steps.push(bptSnapshot(
        tree,
        path.slice(),
        found ? ('Found ' + key + ' in this leaf!') : ('Key ' + key + ' not found — reached a leaf with no match'),
        found ? 'found' : 'notfound'
      ));
      return found;
    }

    node = node.children[bptFindChildIndex(node, key)];
  }
}

/* ════════════════════════════════════════════
   TREE STATS
════════════════════════════════════════════ */

function bptTreeHeight(node) {
  if (!node) return 0;
  if (node.leaf) return 1;

  var max = 0;
  node.children.forEach(function (c) {
    max = Math.max(max, bptTreeHeight(c));
  });
  return 1 + max;
}

function bptCountKeys(node) {
  if (!node) return 0;
  if (node.leaf) return node.keys.length;

  var sum = 0;
  node.children.forEach(function (c) { sum += bptCountKeys(c); });
  return sum;
}

function bptUpdateMeta() {
  var heightEl = document.getElementById('bptHeightVal');
  var countEl = document.getElementById('bptCountVal');
  if (heightEl) heightEl.textContent = bptTreeHeight(bptTree.root);
  if (countEl) countEl.textContent = bptCountKeys(bptTree.root);
}

/* ════════════════════════════════════════════
   RENDERING
════════════════════════════════════════════ */

function bptRenderTree(snapshot) {
  var area = document.getElementById('bptTreeArea');
  if (!area || !snapshot.root) return;

  area.innerHTML = '';

  var levels = [];
  var queue = [{ node: snapshot.root, depth: 0 }];

  while (queue.length) {
    var item = queue.shift();
    if (!levels[item.depth]) levels[item.depth] = [];
    levels[item.depth].push(item.node);

    if (!item.node.leaf) {
      item.node.children.forEach(function (c) {
        queue.push({ node: c, depth: item.depth + 1 });
      });
    }
  }

  levels.forEach(function (levelNodes) {
    var row = document.createElement('div');
    row.className = 'bpt-level';

    levelNodes.forEach(function (node) {
      var hlClass = '';
      if (snapshot.highlight.indexOf(node.id) > -1) {
        hlClass = ' bpt-hl-' + snapshot.type;
      }

      var box = document.createElement('div');
      box.className = 'bpt-node' + (node.leaf ? ' bpt-leaf' : ' bpt-internal') + hlClass;
      box.id = 'bpt-node-' + node.id;

      box.innerHTML = node.keys.map(function (k) {
        return '<span class="bpt-key">' + k + '</span>';
      }).join('');

      row.appendChild(box);
    });

    area.appendChild(row);
  });

  requestAnimationFrame(function () { bptDrawConnectors(snapshot); });
}

function bptDrawConnectors(snapshot) {
  var svg = document.getElementById('bptLinesSvg');
  var area = document.getElementById('bptTreeArea');
  if (!svg || !area) return;

  var areaRect = area.getBoundingClientRect();
  svg.setAttribute('width', areaRect.width);
  svg.setAttribute('height', areaRect.height);
  svg.innerHTML = '';

  function drawLine(x1, y1, x2, y2, cls) {
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('class', cls);
    svg.appendChild(line);
  }

  function drawParentChildLines(node) {
    if (node.leaf) return;

    var parentEl = document.getElementById('bpt-node-' + node.id);
    if (!parentEl) return;

    var pRect = parentEl.getBoundingClientRect();
    var px = pRect.left - areaRect.left + pRect.width / 2;
    var py = pRect.bottom - areaRect.top;

    node.children.forEach(function (child) {
      var childEl = document.getElementById('bpt-node-' + child.id);
      if (childEl) {
        var cRect = childEl.getBoundingClientRect();
        var cx = cRect.left - areaRect.left + cRect.width / 2;
        var cy = cRect.top - areaRect.top;
        drawLine(px, py, cx, cy, 'bpt-link-line');
      }
      drawParentChildLines(child);
    });
  }

  drawParentChildLines(snapshot.root);

  var leaves = [];
  function collectLeaves(node) {
    if (node.leaf) { leaves.push(node); return; }
    node.children.forEach(collectLeaves);
  }
  collectLeaves(snapshot.root);

  for (var i = 0; i < leaves.length - 1; i++) {
    var a = document.getElementById('bpt-node-' + leaves[i].id);
    var b = document.getElementById('bpt-node-' + leaves[i + 1].id);
    if (a && b) {
      var ar = a.getBoundingClientRect();
      var br = b.getBoundingClientRect();
      drawLine(
        ar.right - areaRect.left,
        ar.top - areaRect.top + ar.height / 2,
        br.left - areaRect.left,
        br.top - areaRect.top + br.height / 2,
        'bpt-sibling-line'
      );
    }
  }
}

/* ════════════════════════════════════════════
   STATUS + STEP COUNTER
════════════════════════════════════════════ */

function bptSetStatus(msg, cls) {
  var el = document.getElementById('bptStatus');
  if (el) {
    el.textContent = msg;
    el.className = 'bpt-status ' + (cls || '');
  }
}

function bptUpdateStepCounter() {
  var el = document.getElementById('bptStepCounter');
  if (el) {
    el.textContent = 'Step ' + (bptSteps.length ? bptStepIndex + 1 : 0) + ' / ' + bptSteps.length;
  }
}

/* ════════════════════════════════════════════
   PLAYBACK CONTROLS
════════════════════════════════════════════ */

function bptLoadSteps(steps) {
  bptPauseAuto();
  bptSteps = steps;
  bptStepIndex = 0;
  bptRenderStep();
  bptUpdateMeta();
}

function bptRenderStep() {
  if (!bptSteps.length) return;

  var step = bptSteps[bptStepIndex];
  bptRenderTree(step);
  bptSetStatus(step.message, step.type === 'notfound' ? 'error' : 'info');
  bptUpdateStepCounter();
}

function bptStepForward() {
  if (bptStepIndex < bptSteps.length - 1) {
    bptStepIndex++;
    bptRenderStep();
  } else {
    bptPauseAuto();
  }
}

function bptPlayAuto() {
  if (!bptSteps.length) return;

  bptPlaying = true;
  var playBtn = document.getElementById('bptPlayBtn');
  if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';

  bptTimer = setInterval(function () {
    if (bptStepIndex >= bptSteps.length - 1) {
      bptPauseAuto();
      return;
    }
    bptStepForward();
  }, bptSpeed);
}

function bptPauseAuto() {
  bptPlaying = false;
  clearInterval(bptTimer);

  var playBtn = document.getElementById('bptPlayBtn');
  if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
}

function bptTogglePlay() {
  if (bptPlaying) bptPauseAuto();
  else bptPlayAuto();
}

/* ════════════════════════════════════════════
   ACTIONS (insert / delete / search / reset / preset)
════════════════════════════════════════════ */

function bptExecute() {
  var inputEl = document.getElementById('bptValueInput');
  var val = parseInt(inputEl.value, 10);

  if (isNaN(val)) {
    bptSetStatus('Please enter a valid integer value.', 'error');
    return;
  }

  if (bptCurrentOp === 'insert') {
    if (bptKeyExistsQuiet(bptTree, val)) {
      bptSetStatus('Key ' + val + ' already exists in the tree.', 'error');
      return;
    }
    var insertSteps = [];
    bptInsertKey(bptTree, val, insertSteps);
    bptLoadSteps(insertSteps);

  } else if (bptCurrentOp === 'delete') {
    var deleteSteps = [];
    bptDeleteKey(bptTree, val, deleteSteps);
    bptLoadSteps(deleteSteps);

  } else if (bptCurrentOp === 'search') {
    var searchSteps = [];
    bptSearchKey(bptTree, val, searchSteps);
    bptLoadSteps(searchSteps);
  }
}

function bptReset() {
  bptPauseAuto();
  var order = parseInt(document.getElementById('bptOrderSelect').value, 10);
  bptTree = bptCreateTree(order);

  bptSteps = [bptSnapshot(bptTree, [], 'Tree reset. Empty B+ Tree with order ' + order + '.', 'active')];
  bptStepIndex = 0;
  bptRenderStep();
  bptUpdateMeta();
}

function bptRunPreset() {
  bptReset();

  var allSteps = [];
  for (var v = 1; v <= 20; v++) {
    bptInsertKey(bptTree, v, allSteps);
  }

  bptLoadSteps(allSteps);
  bptPlayAuto();
}

/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */

function bptRenderOps() {
  var wrap = document.getElementById('bptOpsWrap');
  if (!wrap) return;

  wrap.innerHTML = BPT_OPS.map(function (op) {
    var label = op.charAt(0).toUpperCase() + op.slice(1);
    return '<button class="bpt-op-btn' + (op === bptCurrentOp ? ' active' : '') + '" data-op="' + op + '">' + label + '</button>';
  }).join('');

  wrap.querySelectorAll('.bpt-op-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      wrap.querySelectorAll('.bpt-op-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      bptCurrentOp = btn.getAttribute('data-op');
    });
  });
}

function bptInit() {
  bptReset();
  bptRenderOps();

  var execBtn = document.getElementById('bptExecBtn');
  var stepBtn = document.getElementById('bptStepBtn');
  var playBtn = document.getElementById('bptPlayBtn');
  var resetBtn = document.getElementById('bptResetBtn');
  var presetBtn = document.getElementById('bptPresetBtn');
  var orderSelect = document.getElementById('bptOrderSelect');
  var speedSlider = document.getElementById('bptSpeedSlider');
  var valueInput = document.getElementById('bptValueInput');

  if (execBtn) execBtn.addEventListener('click', bptExecute);
  if (stepBtn) stepBtn.addEventListener('click', function () { bptPauseAuto(); bptStepForward(); });
  if (playBtn) playBtn.addEventListener('click', bptTogglePlay);
  if (resetBtn) resetBtn.addEventListener('click', bptReset);
  if (presetBtn) presetBtn.addEventListener('click', bptRunPreset);
  if (orderSelect) orderSelect.addEventListener('change', bptReset);

  if (valueInput) {
    valueInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') bptExecute();
    });
  }

  if (speedSlider) {
    speedSlider.addEventListener('input', function () {
      bptSpeed = parseInt(speedSlider.value, 10);
      if (bptPlaying) {
        bptPauseAuto();
        bptPlayAuto();
      }
    });
  }

  window.addEventListener('resize', function () {
    if (bptSteps.length) bptRenderTree(bptSteps[bptStepIndex]);
  });
}