document.addEventListener('DOMContentLoaded', function() {
  orInit();
});

/* ─── Constants ─── */
let OR_LEVELS       = 3;
let OR_N_LEAVES     = 8;
let OR_TOTAL_NODES  = 2 * OR_N_LEAVES - 1;
let OR_LEAF_START   = OR_N_LEAVES;
let OR_BUCKET_CAP   = 4;
let OR_N_BLOCKS     = 8;

let OR_BLOCK_NAMES = ['Medical', 'Finance', 'Messages', 'Location', 'Contacts', 'Photos', 'Calendar', 'Passwords'];
let OR_BLOCK_EMOJI = ['🏥','💰','✉️','📍','👤','📷','📅','🔑'];

/* ─── Part 1: Naive state ─── */
let orNaiveState = {
  accessed    : {},
  logCount    : 0,
};

/* ─── Part 2: ORAM state ─── */
let orOramState = {
  posMap      : {},   // blockId → leafIdx (0..N_LEAVES-1)
  stash       : [],   // [{blockId, data, leaf}]
  buckets     : {},   // nodeIdx → [{blockId, data, leaf}]
  accessCount : 0,
  maxStash    : 0,
  activePath  : [],   // node indices on current path
  targetBlock : null,
  animating   : false,
};

/* ─── Helpers ─── */
function orRandInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function orPathToLeaf(leafIdx) {
  let nodeIdx = OR_LEAF_START + leafIdx;
  let path    = [];
  while (nodeIdx >= 1) { path.push(nodeIdx); nodeIdx = Math.floor(nodeIdx / 2); }
  return path;
}

/* ─── Init ORAM ─── */
function orInitOram() {
  orOramState.posMap      = {};
  orOramState.stash       = [];
  orOramState.buckets     = {};
  orOramState.accessCount = 0;
  orOramState.maxStash    = 0;
  orOramState.activePath  = [];
  orOramState.targetBlock = null;
  orOramState.animating   = false;

  for (let i = 1; i <= OR_TOTAL_NODES; i++) orOramState.buckets[i] = [];

  for (let b = 0; b < OR_N_BLOCKS; b++) {
    let leaf = orRandInt(0, OR_N_LEAVES - 1);
    orOramState.posMap[b] = leaf;

    let path    = orPathToLeaf(leaf);
    let placed  = false;

    for (let pi = 0; pi < path.length && !placed; pi++) {
      let nodeIdx = path[pi];
      if (orOramState.buckets[nodeIdx].length < OR_BUCKET_CAP) {
        orOramState.buckets[nodeIdx].push({ blockId: b, leaf: leaf });
        placed = true;
      }
    }

    if (!placed) orOramState.stash.push({ blockId: b, leaf: leaf });
  }
}

/* ─── Part 1: Naive render ─── */
function orRenderNaive() {
  let container = document.getElementById('orNaiveBlocks');
  if (!container) return;

  container.innerHTML = '';
  for (let i = 0; i < OR_N_BLOCKS; i++) {
    let div = document.createElement('div');
    div.className = 'or-naive-block' + (orNaiveState.accessed[i] ? ' accessed' : '');
    div.setAttribute('data-block', i);
    div.innerHTML =
      '<div class="or-nb-addr">0x' + (i * 64).toString(16).padStart(4,'0') + '</div>' +
      '<div class="or-nb-lock">🔒</div>' +
      '<div class="or-nb-label">' + OR_BLOCK_NAMES[i] + '</div>';
    div.addEventListener('click', function() { orNaiveAccess(parseInt(this.getAttribute('data-block'))); });
    container.appendChild(div);
  }
}

function orNaiveAccess(blockId) {
  orNaiveState.accessed[blockId] = true;
  orNaiveState.logCount++;
  orRenderNaive();

  let addr    = '0x' + (blockId * 64).toString(16).padStart(4,'0');
  let log     = document.getElementById('orNaiveAdvLog');
  let empty   = log ? log.querySelector('.or-adv-empty') : null;
  if (empty) empty.remove();

  let entry = document.createElement('div');
  entry.className = 'or-adv-entry bad';
  entry.textContent = 'Access #' + orNaiveState.logCount + ': READ addr ' + addr + ' → "' + OR_BLOCK_NAMES[blockId] + '" identified!';
  if (log) log.insertBefore(entry, log.firstChild);

  let identified = Object.keys(orNaiveState.accessed).length;
  let idEl       = document.getElementById('orNaiveIdentified');
  if (idEl) idEl.textContent = identified + ' / ' + OR_N_BLOCKS;

  let verdict = document.getElementById('orNaiveVerdict');
  if (verdict) {
    verdict.textContent = identified >= OR_N_BLOCKS
      ? '💀 All ' + OR_N_BLOCKS + ' blocks identified!'
      : '⚠️ ' + identified + ' block(s) de-anonymized from access pattern alone.';
  }
}

/* ─── Part 2: ORAM render ─── */
function orRenderOramBlocks() {
  let container = document.getElementById('orOramBlocks');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < OR_N_BLOCKS; i++) {
    let leaf = orOramState.posMap[i];
    let div  = document.createElement('div');
    div.className = 'or-data-block';
    div.setAttribute('data-block', i);
    div.innerHTML =
      '<div class="or-db-id">blk#' + i + '</div>' +
      '<div class="or-db-lock">' + OR_BLOCK_EMOJI[i] + '</div>' +
      '<div class="or-db-name">' + OR_BLOCK_NAMES[i] + '</div>' +
      '<div class="or-db-leaf">leaf→' + leaf + '</div>';
    div.addEventListener('click', function() {
      if (!orOramState.animating) orOramAccess(parseInt(this.getAttribute('data-block')));
    });
    container.appendChild(div);
  }
}

function orRenderPosMap(changedId) {
  let grid = document.getElementById('orPosMapGrid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 0; i < OR_N_BLOCKS; i++) {
    let leaf = orOramState.posMap[i];
    let div  = document.createElement('div');
    div.className = 'or-pm-entry' + (i === changedId ? ' changed' : '');
    div.innerHTML = '<span class="or-pm-id">blk#' + i + '</span><span class="or-pm-leaf">L' + leaf + '</span>';
    grid.appendChild(div);
  }
}

function orRenderStash() {
  let container = document.getElementById('orStashBlocks');
  let countEl   = document.getElementById('orStashCount');
  if (!container) return;

  let stash = orOramState.stash;
  if (countEl) countEl.textContent = stash.length + ' block(s)';

  if (stash.length === 0) {
    container.innerHTML = '<div class="or-stash-empty">Stash is empty.</div>';
    return;
  }

  container.innerHTML = stash.map(function(b) {
    return '<div class="or-stash-block">' +
      '<span>blk#' + b.blockId + ' ' + OR_BLOCK_EMOJI[b.blockId] + ' ' + OR_BLOCK_NAMES[b.blockId] + '</span>' +
      '<span>→L' + b.leaf + '</span>' +
    '</div>';
  }).join('');
}

function orRenderStats() {
  let accEl     = document.getElementById('orStatAccesses');
  let stashEl   = document.getElementById('orStatMaxStash');
  let L         = OR_LEVELS + 1;
  let overhead  = L;

  if (accEl)   accEl.textContent  = orOramState.accessCount;
  if (stashEl) stashEl.textContent = orOramState.maxStash;

  let fetchEl   = document.getElementById('orStatFetched');
  let overEl    = document.getElementById('orStatOverhead');
  if (fetchEl)  fetchEl.textContent = L + ' buckets';
  if (overEl)   overEl.textContent  = L + '× vs naive';
}

/* ─── ORAM Tree Canvas ─── */
function orDrawTree(activePath, targetNode) {
  let canvas = document.getElementById('orTreeCanvas');
  if (!canvas) return;

  let levels = OR_LEVELS + 1;
  let W      = 440;
  let H      = 280;
  canvas.width  = W;
  canvas.height = H;
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  let nodePos = {};
  let levelH  = H / (levels + 0.5);

  for (let lv = 0; lv < levels; lv++) {
    let nodesAtLevel = Math.pow(2, lv);
    let firstNode    = Math.pow(2, lv);
    let cellW        = W / nodesAtLevel;
    for (let ni = 0; ni < nodesAtLevel; ni++) {
      let nodeIdx = firstNode + ni;
      nodePos[nodeIdx] = {
        x: cellW * ni + cellW / 2,
        y: levelH * lv + levelH * 0.65,
      };
    }
  }

  for (let nodeIdx = 1; nodeIdx <= OR_TOTAL_NODES; nodeIdx++) {
    let left  = nodeIdx * 2;
    let right = nodeIdx * 2 + 1;
    if (left <= OR_TOTAL_NODES) {
      let p = nodePos[nodeIdx]; let c = nodePos[left];
      ctx.strokeStyle = 'rgba(148,163,184,0.2)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(c.x, c.y); ctx.stroke();
    }
    if (right <= OR_TOTAL_NODES) {
      let p = nodePos[nodeIdx]; let c = nodePos[right];
      ctx.strokeStyle = 'rgba(148,163,184,0.2)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(c.x, c.y); ctx.stroke();
    }
  }

  for (let nodeIdx = 1; nodeIdx <= OR_TOTAL_NODES; nodeIdx++) {
    let pos      = nodePos[nodeIdx];
    let onPath   = activePath && activePath.indexOf(nodeIdx) !== -1;
    let isTarget = nodeIdx === targetNode;
    let isLeaf   = nodeIdx >= OR_LEAF_START;
    let blocks   = orOramState.buckets[nodeIdx] || [];

    let fillColor, strokeColor, glow;
    if (isTarget) {
      fillColor   = 'rgba(34,197,94,0.4)';
      strokeColor = '#22c55e';
      glow        = 'rgba(34,197,94,0.3)';
    } else if (onPath) {
      fillColor   = 'rgba(168,85,247,0.35)';
      strokeColor = '#a855f7';
      glow        = 'rgba(168,85,247,0.2)';
    } else {
      fillColor   = isLeaf ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.04)';
      strokeColor = isLeaf ? '#06b6d4' : 'rgba(148,163,184,0.3)';
      glow        = null;
    }

    let r = isLeaf ? 12 : 15;

    if (glow) {
      ctx.beginPath(); ctx.arc(pos.x, pos.y, r + 5, 0, Math.PI * 2);
      ctx.fillStyle = glow; ctx.fill();
    }

    ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle   = fillColor; ctx.fill();
    ctx.strokeStyle = strokeColor; ctx.lineWidth = onPath || isTarget ? 2.5 : 1.5;
    ctx.stroke();

    ctx.fillStyle    = strokeColor;
    ctx.font         = 'bold 8px Fira Code,monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(blocks.length + '/' + OR_BUCKET_CAP, pos.x, pos.y);

    if (isLeaf) {
      let leafIdx = nodeIdx - OR_LEAF_START;
      ctx.fillStyle    = 'rgba(148,163,184,0.45)';
      ctx.font         = '7px Poppins,sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('L' + leafIdx, pos.x, pos.y + r + 3);
    }
  }
}

/* ─── ORAM Access (Path ORAM algorithm) ─── */
function orOramAccess(blockId) {
  if (orOramState.animating) return;
  orOramState.animating   = true;
  orOramState.accessCount++;
  orOramState.targetBlock = blockId;

  let leaf     = orOramState.posMap[blockId];
  let path     = orPathToLeaf(leaf);
  orOramState.activePath  = path.slice();

  let newLeaf  = orRandInt(0, OR_N_LEAVES - 1);
  orOramState.posMap[blockId] = newLeaf;

  orAddOramAdvLog(path, blockId);
  orAddAccessLog(blockId, leaf, newLeaf);

  let blockDiv = document.querySelector('#orOramBlocks [data-block="' + blockId + '"]');
  if (blockDiv) blockDiv.classList.add('reading');

  let step = 0;

  function animateStep() {
    let nodeIdx = path[step];

    let foundInBucket = false;
    let newBucket     = [];
    let blocks        = orOramState.buckets[nodeIdx] || [];
    blocks.forEach(function(b) {
      if (b.blockId === blockId) {
        b.leaf       = newLeaf;
        foundInBucket = true;
        orOramState.stash.push(b);
      } else {
        newBucket.push(b);
      }
    });
    orOramState.buckets[nodeIdx] = newBucket;

    if (!foundInBucket) {
      let inStash = orOramState.stash.find(function(b) { return b.blockId === blockId; });
      if (!inStash) orOramState.stash.push({ blockId: blockId, leaf: newLeaf });
    }

    let isTarget = foundInBucket ? nodeIdx : null;
    orDrawTree(orOramState.activePath, isTarget);
    orRenderStash();

    if (orOramState.stash.length > orOramState.maxStash) orOramState.maxStash = orOramState.stash.length;

    step++;
    if (step < path.length) {
      setTimeout(animateStep, 380);
    } else {
      setTimeout(function() { orEvictStash(path, blockId, newLeaf); }, 380);
    }
  }

  orDrawTree(orOramState.activePath, null);
  setTimeout(animateStep, 200);
}

/* ─── Evict stash back into tree ─── */
function orEvictStash(path, targetBlockId, newLeaf) {
  let remaining = [];

  orOramState.stash.forEach(function(block) {
    let blockLeaf = block.blockId === targetBlockId ? newLeaf : orOramState.posMap[block.blockId];
    block.leaf    = blockLeaf;

    let blockPath = orPathToLeaf(blockLeaf);
    let placed    = false;

    for (let pi = 0; pi < path.length && !placed; pi++) {
      let nodeIdx = path[pi];
      if (blockPath.indexOf(nodeIdx) !== -1 && orOramState.buckets[nodeIdx].length < OR_BUCKET_CAP) {
        orOramState.buckets[nodeIdx].push(block);
        placed = true;
      }
    }

    if (!placed) remaining.push(block);
  });

  orOramState.stash = remaining;

  if (orOramState.stash.length > orOramState.maxStash) orOramState.maxStash = orOramState.stash.length;

  setTimeout(function() {
    orOramState.activePath  = [];
    orOramState.targetBlock = null;
    orOramState.animating   = false;

    let blockDiv = document.querySelector('#orOramBlocks [data-block="' + targetBlockId + '"]');
    if (blockDiv) blockDiv.classList.remove('reading');

    orDrawTree([], null);
    orRenderOramBlocks();
    orRenderPosMap(targetBlockId);
    orRenderStash();
    orRenderStats();
  }, 400);
}

/* ─── ORAM adversary log ─── */
function orAddOramAdvLog(path, blockId) {
  let log   = document.getElementById('orOramAdvLog');
  let empty = log ? log.querySelector('.or-adv-empty') : null;
  if (empty) empty.remove();

  let pathStr = path.map(function(n) { return 'node#' + n; }).join(' → ');
  let entry   = document.createElement('div');
  entry.className = 'or-adv-entry good';
  entry.textContent = 'Access #' + orOramState.accessCount + ': PATH ' + pathStr + ' — cannot determine which block was read!';
  if (log) log.insertBefore(entry, log.firstChild);

  let idEl = document.getElementById('orOramIdentified');
  if (idEl) idEl.textContent = '0 / ' + OR_N_BLOCKS;
}

/* ─── ORAM access log ─── */
function orAddAccessLog(blockId, oldLeaf, newLeaf) {
  let log   = document.getElementById('orAccessLog');
  let empty = log ? log.querySelector('.or-adv-empty') : null;
  if (empty) empty.remove();

  let entry = document.createElement('div');
  entry.className = 'or-access-entry';
  entry.textContent = 'blk#' + blockId + ' ' + OR_BLOCK_EMOJI[blockId] + ' "' + OR_BLOCK_NAMES[blockId] + '" — leaf: ' + oldLeaf + ' → re-rand: ' + newLeaf;
  if (log) log.insertBefore(entry, log.firstChild);
  while (log && log.children.length > 30) log.removeChild(log.lastChild);
}

/* ─── Init ─── */
function orInit() {
  orNaiveState.accessed  = {};
  orNaiveState.logCount  = 0;

  orRenderNaive();

  orInitOram();
  orRenderOramBlocks();
  orRenderPosMap(-1);
  orRenderStash();
  orDrawTree([], null);
  orRenderStats();

  window.addEventListener('resize', function() { orDrawTree(orOramState.activePath, null); });
}