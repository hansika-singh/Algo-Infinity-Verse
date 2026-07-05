document.addEventListener('DOMContentLoaded', () => { initBTreeVisualizer(); });

const BT_SPEED = { 1: 1200, 2: 750, 3: 450, 4: 220, 5: 90 };

class BTreeNode {
  constructor(leaf = true) {
    this.leaf = leaf;
    this.keys = [];
    this.children = [];
    this.id = BTreeNode._nextId++;
  }
}
BTreeNode._nextId = 1;

class BTree {
  constructor(t = 2) {
    this.setDegree(t);
    this.root = new BTreeNode(true);
  }

  setDegree(t) {
    this.t = Math.max(2, Number.isFinite(t) ? t : 2);
  }

  cloneNode(node) {
    if (!node) return null;
    const copy = new BTreeNode(node.leaf);
    copy.id = node.id;
    copy.keys = [...node.keys];
    copy.children = node.children.map((child) => this.cloneNode(child));
    return copy;
  }

  cloneTree() { return this.cloneNode(this.root); }

  search(key) {
    return this._search(this.root, key);
  }

  _search(node, key) {
    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) i += 1;
    if (i < node.keys.length && node.keys[i] === key) return { node, index: i };
    if (node.leaf) return null;
    return this._search(node.children[i], key);
  }

  insert(key, captureStep) {
    const root = this.root;
    if (root.keys.length === 2 * this.t - 1) {
      const newRoot = new BTreeNode(false);
      newRoot.children[0] = root;
      this.root = newRoot;
      captureStep('Root split. The original root was full, so a new root was created before insertion.', { highlightNodes: [newRoot.id, root.id], promotedKey: null, searchKey: null });
      this.splitChild(newRoot, 0, captureStep);
      this.insertNonFull(newRoot, key, captureStep);
    } else {
      this.insertNonFull(root, key, captureStep);
    }
  }

  splitChild(parent, index, captureStep) {
    const t = this.t;
    const fullChild = parent.children[index];
    const newChild = new BTreeNode(fullChild.leaf);
    const promotedKey = fullChild.keys[t - 1];

    newChild.keys = fullChild.keys.slice(t);
    fullChild.keys = fullChild.keys.slice(0, t - 1);

    if (!fullChild.leaf) {
      newChild.children = fullChild.children.slice(t);
      fullChild.children = fullChild.children.slice(0, t);
    }

    parent.children.splice(index + 1, 0, newChild);
    parent.keys.splice(index, 0, promotedKey);

    captureStep('Splitting node. The middle key is promoted to the parent while the remaining keys are split into two child nodes.', {
      highlightNodes: [parent.id, fullChild.id, newChild.id],
      promotedKey,
      searchKey: null
    });
  }

  insertNonFull(node, key, captureStep) {
    let i = node.keys.length - 1;

    if (node.leaf) {
      while (i >= 0 && key < node.keys[i]) i -= 1;
      node.keys.splice(i + 1, 0, key);
      captureStep(`Inserted key ${key} into a leaf node.`, { highlightNodes: [node.id], promotedKey: null, searchKey: null });
      return;
    }

    while (i >= 0 && key < node.keys[i]) i -= 1;
    i += 1;
    captureStep('Descending into child. The key belongs in a deeper subtree.', { highlightNodes: [node.id, node.children[i].id], promotedKey: null, searchKey: null });

    if (node.children[i].keys.length === 2 * this.t - 1) {
      captureStep('Node overflow detected. The child is full and must be split before descending further.', { highlightNodes: [node.id, node.children[i].id], promotedKey: null, searchKey: null });
      this.splitChild(node, i, captureStep);
      if (key > node.keys[i]) i += 1;
    }

    this.insertNonFull(node.children[i], key, captureStep);
  }
}

const btState = { tree: new BTree(2), steps: [], stepIndex: 0, playing: false, timer: null, mode: 'idle', pendingKey: null, pendingSearch: null };

function cloneTree(root) {
  return JSON.parse(JSON.stringify(root));
}

function captureStep(message, extras = {}) {
  btState.steps.push({
    tree: cloneTree(btState.tree.root),
    message,
    highlightNodes: extras.highlightNodes || [],
    promotedKey: extras.promotedKey ?? null,
    searchKey: extras.searchKey ?? btState.pendingSearch ?? null
  });
}

function btSetStatus(text) { const el = document.getElementById('btStatusBox'); if (el) el.textContent = text; }
function btSetExplanation(text) { const el = document.getElementById('btExplanationBox'); if (el) el.textContent = text; }
function btStepCounter() { const el = document.getElementById('btStepCounter'); if (el) el.textContent = `Step ${btState.stepIndex} / ${btState.steps.length}`; }
function btGetDelay() { const el = document.getElementById('btSpeed'); return BT_SPEED[el?.value ?? 3] ?? 450; }

function calculateNodePositions(root, width, startX = width / 2, startY = 70, levelGap = 95) {
  const positions = new Map();
  const layout = (node, x, y, span) => {
    if (!node) return;
    positions.set(node.id, { x, y, node });
    const childCount = node.children?.length || 0;
    if (!childCount) return;
    const childSpan = Math.max(span / Math.max(childCount, 1), 120);
    const totalWidth = childSpan * childCount;
    const firstX = x - totalWidth / 2 + childSpan / 2;
    node.children.forEach((child, idx) => layout(child, firstX + idx * childSpan, y + levelGap, childSpan / 1.15));
  };
  layout(root, startX, startY, width / 1.4);
  return positions;
}

function drawEdges(root, positions) {
  const svg = document.getElementById('edges-svg');
  if (!svg) return;
  svg.innerHTML = '';
  const walk = (node) => {
    if (!node || node.leaf) return;
    const from = positions.get(node.id);
    if (!from) return;
    node.children.forEach((child) => {
      const to = positions.get(child.id);
      if (!to) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', from.x);
      line.setAttribute('y1', from.y + 18);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y - 20);
      line.setAttribute('class', 'bt-edge');
      svg.appendChild(line);
      walk(child);
    });
  };
  walk(root);
}

function drawNodes(root, positions, highlights = [], promotedKey = null, searchKey = null) {
  const canvas = document.getElementById('tree-canvas');
  if (!canvas) return;
  canvas.querySelectorAll('.bt-node').forEach((n) => n.remove());
  const highlightSet = new Set(highlights || []);

  const walk = (node) => {
    if (!node) return;
    const pos = positions.get(node.id);
    if (!pos) return;
    const div = document.createElement('div');
    div.className = 'bt-node';
    if (highlightSet.has(node.id)) div.classList.add('highlight');
    if (node.keys.includes(promotedKey)) div.classList.add('promoted');
    if (searchKey !== null && node.keys.includes(searchKey)) div.classList.add('found');
    const rows = [];
    rows.push('<div class="bt-node-row">' + node.keys.map((k) => `<span class="bt-key">${k}</span>`).join('') + '</div>');
    div.innerHTML = rows.join('');
    div.style.left = `${pos.x}px`;
    div.style.top = `${pos.y}px`;
    canvas.appendChild(div);
    node.children.forEach(walk);
  };
  walk(root);
}

function renderTree(step) {
  const canvas = document.getElementById('tree-canvas');
  if (!canvas || !step?.tree) return;
  const width = canvas.clientWidth || 900;
  const height = canvas.clientHeight || 650;
  canvas.style.minHeight = `${Math.max(height, 650)}px`;
  const positions = calculateNodePositions(step.tree, width, width / 2, 70, 100);
  drawEdges(step.tree, positions);
  drawNodes(step.tree, positions, step.highlightNodes, step.promotedKey, step.searchKey);
}

function updatePlaybackButtons() {
  const prev = document.getElementById('btPrevBtn');
  const next = document.getElementById('btNextBtn');
  const play = document.getElementById('btPlayBtn');
  const pause = document.getElementById('btPauseBtn');
  const hasSteps = btState.steps.length > 0;
  if (prev) prev.disabled = !hasSteps || btState.stepIndex <= 0;
  if (next) next.disabled = !hasSteps || btState.stepIndex >= btState.steps.length;
  if (play) play.disabled = !hasSteps || btState.playing || btState.stepIndex >= btState.steps.length;
  if (pause) pause.disabled = !btState.playing;
}

function applyStep(idx) {
  const step = btState.steps[idx];
  if (!step) return;
  renderTree(step);
  btSetStatus(step.message);
  btSetExplanation(step.message);
  btStepCounter();
  updatePlaybackButtons();
}

function stopPlayback() { btState.playing = false; if (btState.timer) { clearTimeout(btState.timer); btState.timer = null; } updatePlaybackButtons(); }
function playNext() {
  if (!btState.playing) return;
  if (btState.stepIndex >= btState.steps.length) { stopPlayback(); return; }
  applyStep(btState.stepIndex);
  btState.stepIndex += 1;
  btState.timer = setTimeout(playNext, btGetDelay());
}
function play() { if (btState.playing || btState.stepIndex >= btState.steps.length) return; btState.playing = true; updatePlaybackButtons(); playNext(); }
function next() { if (btState.stepIndex >= btState.steps.length) return; applyStep(btState.stepIndex); btState.stepIndex += 1; updatePlaybackButtons(); }
function prev() { if (btState.stepIndex <= 0) return; btState.stepIndex -= 1; if (btState.stepIndex <= 0) { renderTree({ tree: cloneTree(btState.tree.root), highlightNodes: [], promotedKey: null, searchKey: null, message: 'Ready.' }); btSetStatus('Ready.'); btSetExplanation('Ready.'); btStepCounter(); updatePlaybackButtons(); return; } applyStep(btState.stepIndex - 1); }

function resetAll() {
  stopPlayback();
  const degree = parseInt(document.getElementById('btDegree')?.value || '2', 10);
  btState.tree = new BTree(degree);
  btState.steps = [{ tree: cloneTree(btState.tree.root), message: 'B-Tree reset. Add a key to begin.', highlightNodes: [], promotedKey: null, searchKey: null }];
  btState.stepIndex = 0;
  btState.mode = 'idle';
  btState.pendingKey = null;
  btState.pendingSearch = null;
  renderTree(btState.steps[0]);
  btSetStatus('B-Tree reset.');
  btSetExplanation('B-Tree reset.');
  btStepCounter();
  updatePlaybackButtons();
}

function runInsert() {
  stopPlayback();
  const degree = parseInt(document.getElementById('btDegree')?.value || '2', 10);
  const key = parseInt(document.getElementById('btInsertKey')?.value || '', 10);
  if (!Number.isFinite(key)) { btSetStatus('Enter a valid insert key.'); return; }
  if (Number.isFinite(degree) && degree !== btState.tree.t) {
    btSetStatus('Degree changed — please Reset before inserting.');
    return;
  }
  btState.steps = [];
  btState.stepIndex = 0;
  btState.pendingKey = key;
  btState.pendingSearch = null;
  const cloneForCapture = () => captureStep.apply(null, arguments);
  btState.tree.insert(key, (message, extras) => {
    btState.steps.push({ tree: cloneTree(btState.tree.root), message, highlightNodes: extras.highlightNodes || [], promotedKey: extras.promotedKey ?? null, searchKey: null });
  });
  if (!btState.steps.length) captureStep(`Inserted key ${key}.`, { highlightNodes: [], promotedKey: null, searchKey: null });
  applyStep(0);
  btState.stepIndex = 1;
  btSetStatus(`Inserted key ${key}`);
  btSetExplanation(btState.steps[0]?.message || `Inserted key ${key}`);
  updatePlaybackButtons();
}

function runSearch() {
  stopPlayback();
  const key = parseInt(document.getElementById('btSearchKey')?.value || '', 10);
  if (!Number.isFinite(key)) { btSetStatus('Enter a valid search key.'); return; }
  btState.steps = [];
  btState.stepIndex = 0;
  btState.pendingSearch = key;
  btState.pendingKey = null;
  const searchRecursive = (node) => {
    if (!node) {
      btState.steps.push({ tree: cloneTree(btState.tree.root), message: `Key not found. Reached an empty child while searching for ${key}.`, highlightNodes: [], promotedKey: null, searchKey: key });
      return null;
    }
    btState.steps.push({ tree: cloneTree(btState.tree.root), message: `Searching key ${key}. Visiting node with keys [${node.keys.join(', ')}].`, highlightNodes: [node.id], promotedKey: null, searchKey: key });
    let idx = 0;
    while (idx < node.keys.length && key > node.keys[idx]) idx += 1;
    if (idx < node.keys.length && node.keys[idx] === key) {
      btState.steps.push({ tree: cloneTree(btState.tree.root), message: `Key found: ${key}.`, highlightNodes: [node.id], promotedKey: null, searchKey: key });
      return node;
    }
    if (node.leaf) {
      btState.steps.push({ tree: cloneTree(btState.tree.root), message: `Key not found. Search ended at a leaf node.`, highlightNodes: [node.id], promotedKey: null, searchKey: key });
      return null;
    }
    btState.steps.push({ tree: cloneTree(btState.tree.root), message: `Descending into child ${idx} while searching for ${key}.`, highlightNodes: [node.id, node.children[idx].id], promotedKey: null, searchKey: key });
    return searchRecursive(node.children[idx]);
  };
  searchRecursive(btState.tree.root);
  if (!btState.steps.length) btState.steps.push({ tree: cloneTree(btState.tree.root), message: `Key not found: ${key}.`, highlightNodes: [], promotedKey: null, searchKey: key });
  btState.stepIndex = 0;
  applyStep(0);
  btSetStatus(`Searching key ${key}`);
  btSetExplanation(btState.steps[0]?.message || `Searching key ${key}`);
  updatePlaybackButtons();
}

function initHeroTyping() {
  const el = document.getElementById('typingTextVisualizer');
  if (!el) return;
  const words = ['Insert. Split. Promote. Balance.', 'Search across multi-way nodes.', 'Watch B-Trees stay shallow.'];
  let wordIdx = 0, charIdx = 0, deleting = false;
  const tick = () => {
    const current = words[wordIdx];
    el.textContent = deleting ? current.substring(0, charIdx - 1) : current.substring(0, charIdx + 1);
    charIdx += deleting ? -1 : 1;
    let speed = deleting ? 55 : 90;
    if (!deleting && charIdx === current.length) { deleting = true; speed = 1200; }
    else if (deleting && charIdx === 0) { deleting = false; wordIdx = (wordIdx + 1) % words.length; speed = 300; }
    requestAnimationFrame(() => setTimeout(tick, speed));
  };
  tick();
}

function initBTreeVisualizer() {
  initHeroTyping();
  const insertBtn = document.getElementById('btInsertBtn');
  const searchBtn = document.getElementById('btSearchBtn');
  const prevBtn = document.getElementById('btPrevBtn');
  const nextBtn = document.getElementById('btNextBtn');
  const playBtn = document.getElementById('btPlayBtn');
  const pauseBtn = document.getElementById('btPauseBtn');
  const resetBtn = document.getElementById('btResetBtn');
  if (insertBtn) insertBtn.addEventListener('click', runInsert);
  if (searchBtn) searchBtn.addEventListener('click', runSearch);
  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);
  if (playBtn) playBtn.addEventListener('click', play);
  if (pauseBtn) pauseBtn.addEventListener('click', stopPlayback);
  if (resetBtn) resetBtn.addEventListener('click', resetAll);
  window.addEventListener('resize', () => { if (btState.steps.length) applyStep(Math.max(0, btState.stepIndex - 1)); });
  resetAll();
}
