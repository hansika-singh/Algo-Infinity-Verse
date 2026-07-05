// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Memory Palace RAM Simulator only
// All globals prefixed mp_ or MP_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  mpInit();
});

/* ─── Constants ─── */
var MP_CELLS     = 256;
var MP_COLS      = 16;

/* ─── Memory model ─── */
// Each cell: { type: 'free'|'data'|'pointer'|'header'|'sp', value: any, label: '', dsId: null, addr: N }
var mpMem = [];
var mpSelectedCell = -1;
var mpCurrentDs    = 'array';
var mpCurrentOp    = 'push';

/* ─── DS State ─── */
var mpDsState = {
  array: { items: [], baseAddr: 10 },
  linkedlist: { head: -1, nodes: [] },   // nodes: [{addr, val, nextPtr}]
  stack: { items: [], base: 50, sp: 50 },
  queue: { items: [], base: 80, head: 0, tail: 0, cap: 8 },
  hashmap: { buckets: [], base: 120, cap: 8, entries: [] },
  binarytree: { nodes: [], base: 160 },
};

/* ─── DS Operations config ─── */
var MP_DS_OPS = {
  array:      ['push', 'pop', 'access'],
  linkedlist: ['insert head', 'insert tail', 'delete head'],
  stack:      ['push', 'pop', 'peek'],
  queue:      ['enqueue', 'dequeue'],
  hashmap:    ['put', 'get', 'delete'],
  binarytree: ['insert'],
};

/* ─── Init memory ─── */
function mpInitMem() {
  mpMem = [];
  for (var i = 0; i < MP_CELLS; i++) {
    mpMem.push({ type: 'free', value: null, label: '', dsId: null, addr: i });
  }
}

/* ─── Render grid ─── */
function mpRenderGrid() {
  var grid = document.getElementById('mpGrid');
  if (!grid) return;

  grid.innerHTML = mpMem.map(function(cell, i) {
    var cls = 'mp-cell mp-' + cell.type;
    if (i === mpSelectedCell) cls += ' mp-selected';
    var showBin = document.getElementById('mpShowBinary') && document.getElementById('mpShowBinary').checked;
    var displayVal = '';
    if (cell.type !== 'free' && cell.value !== null) {
      if (showBin && typeof cell.value === 'number') {
        displayVal = (cell.value & 0xFF).toString(2).padStart(8, '0');
      } else {
        displayVal = String(cell.value).substring(0, 4);
      }
    }
    var cellTitle = 'Addr: 0x' + i.toString(16).toUpperCase().padStart(2,'0') + ' | ' + (cell.type === 'free' ? 'FREE' : cell.label || cell.type);
    return '<button type="button" class="' + cls + '" data-addr="' + i + '" title="' + cellTitle + '" aria-label="' + cellTitle + '">' +
      '<span class="mp-cell-val">' + displayVal + '</span>' +
    '</button>';
  }).join('');

  // Click handlers
  grid.querySelectorAll('.mp-cell').forEach(function(cell) {
    cell.addEventListener('click', function() {
      var addr = parseInt(cell.getAttribute('data-addr'));
      mpSelectCell(addr);
    });
  });

  mpUpdateStats();
}

/* ─── Select cell ─── */
function mpSelectCell(addr) {
  mpSelectedCell = addr;
  var cell = mpMem[addr];
  var detailEl = document.getElementById('mpCellDetail');
  if (!detailEl) return;

  detailEl.innerHTML = [
    { k: 'Address',   v: '0x' + addr.toString(16).toUpperCase().padStart(3,'0') + ' (' + addr + ')' },
    { k: 'Status',    v: cell.type.toUpperCase() },
    { k: 'Value',     v: cell.value !== null ? cell.value : '—' },
    { k: 'Label',     v: cell.label || '—' },
    { k: 'Binary',    v: typeof cell.value === 'number' ? (cell.value & 0xFF).toString(2).padStart(8,'0') : '—' },
    { k: 'Hex',       v: typeof cell.value === 'number' ? '0x' + (cell.value & 0xFF).toString(16).toUpperCase().padStart(2,'0') : '—' },
    { k: 'Belongs to', v: cell.dsId || '—' },
  ].map(function(r) {
    return '<div class="mp-detail-row"><span class="mp-detail-key">' + r.k + '</span><span class="mp-detail-val">' + r.v + '</span></div>';
  }).join('');

  mpRenderGrid();
}

/* ─── Update stats ─── */
function mpUpdateStats() {
  var used = mpMem.filter(function(c) { return c.type !== 'free'; }).length;
  var free = MP_CELLS - used;

  // Fragmentation: count free blocks separated by used cells
  var freeBlocks = 0; var inFree = false;
  mpMem.forEach(function(c) {
    if (c.type === 'free') { if (!inFree) { freeBlocks++; inFree = true; } }
    else inFree = false;
  });
  var frag = used > 0 && freeBlocks > 1 ? Math.min(99, Math.round(((freeBlocks - 1) / Math.max(1, free)) * 100)) : 0;

  var usedEl = document.getElementById('mpUsed');
  var freeEl = document.getElementById('mpFree');
  var fragEl = document.getElementById('mpFrag');
  if (usedEl) usedEl.textContent = used;
  if (freeEl) freeEl.textContent = free;
  if (fragEl) fragEl.textContent = frag + '%';
}

/* ─── Allocate cells ─── */
function mpAlloc(startAddr, count, type, values, label, dsId) {
  if (startAddr < 0 || count < 0 || startAddr + count > MP_CELLS) return false;
  for (var j = 0; j < count; j++) {
    if (mpMem[startAddr + j].type !== 'free') return false;
  }
  for (var i = 0; i < count; i++) {
    mpMem[startAddr + i] = {
      type  : type,
      value : Array.isArray(values) ? values[i] : values,
      label : label,
      dsId  : dsId,
      addr  : startAddr + i,
    };
  }
  return true;
}


/* ─── Free cells ─── */
function mpFree(addrs) {
  addrs.forEach(function(a) {
    if (a >= 0 && a < MP_CELLS) {
      mpMem[a] = { type: 'free', value: null, label: '', dsId: null, addr: a };
    }
  });
}

/* ─── Flash animation ─── */
function mpFlashCells(addrs) {
  if (!document.getElementById('mpAnimate') || !document.getElementById('mpAnimate').checked) return;
  addrs.forEach(function(addr) {
    setTimeout(function() {
      var cellEl = document.querySelector('[data-addr="' + addr + '"]');
      if (cellEl) {
        cellEl.classList.add('mp-active');
        setTimeout(function() { cellEl.classList.remove('mp-active'); }, 500);
      }
    }, 0);
  });
}

/* ─── Log ─── */
function mpLog(msg, type) {
  var log = document.getElementById('mpAllocLog');
  if (!log) return;
  var empty = log.querySelector('.mp-log-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'mp-log-entry ' + (type || 'info');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 30) log.removeChild(log.lastChild);
}

/* ─── Status ─── */
function mpSetStatus(msg, cls) {
  var el = document.getElementById('mpStatus');
  if (el) { el.textContent = msg; el.className = 'mp-status ' + (cls || ''); }
}

/* ─── ── ARRAY operations ─── */
function mpArrayPush(val) {
  var st  = mpDsState.array;
  var idx = st.items.length;
  var addr = st.baseAddr + idx;
  if (addr >= MP_CELLS) { mpSetStatus('Memory full! Cannot push.', 'error'); return; }
  st.items.push(val);
  mpAlloc(addr, 1, 'data', val, 'arr[' + idx + ']', 'array');
  mpFlashCells([addr]);
  mpLog('alloc addr=' + addr + ' arr[' + idx + ']=' + val, 'alloc');
  mpSetStatus('Pushed ' + val + ' → arr[' + idx + '] at address ' + addr + '. Contiguous with previous elements.', 'alloc');
  mpRenderArrayViz();
}

function mpArrayPop() {
  var st = mpDsState.array;
  if (st.items.length === 0) { mpSetStatus('Array is empty!', 'error'); return; }
  var idx  = st.items.length - 1;
  var addr = st.baseAddr + idx;
  var val  = st.items.pop();
  mpFree([addr]);
  mpLog('free addr=' + addr + ' arr[' + idx + ']=' + val, 'free');
  mpSetStatus('Popped arr[' + idx + ']=' + val + '. Address ' + addr + ' freed.', 'free');
  mpRenderArrayViz();
}

function mpArrayAccess(idx) {
  var st = mpDsState.array;
  if (idx < 0 || idx >= st.items.length) { mpSetStatus('Index ' + idx + ' out of bounds!', 'error'); return; }
  var addr = st.baseAddr + idx;
  mpFlashCells([addr]);
  mpSetStatus('Access arr[' + idx + ']=' + st.items[idx] + ' at address ' + addr + '. O(1) — direct calculation: base(' + st.baseAddr + ') + index(' + idx + ') = ' + addr, 'info');
}

function mpRenderArrayViz() {
  var viz = document.getElementById('mpDsViz');
  var titleEl = document.getElementById('mpDsVizTitle');
  if (!viz) return;
  if (titleEl) titleEl.textContent = 'Array in Memory (contiguous)';

  var st = mpDsState.array;
  if (st.items.length === 0) { viz.innerHTML = '<span style="font-size:0.78rem;color:var(--text-secondary)">Empty — allocate elements to see them here.</span>'; return; }

  viz.innerHTML = st.items.map(function(val, i) {
    return '<div class="mp-viz-node">' +
      '<div class="mp-viz-box">' + val + '</div>' +
      '<div class="mp-viz-addr">@' + (st.baseAddr + i) + '</div>' +
      '<div class="mp-viz-label">arr[' + i + ']</div>' +
    '</div>';
  }).join('<div class="mp-viz-arrow">|</div>');
}

/* ─── LINKED LIST operations ─── */
function mpLLInsertHead(val) {
  var st = mpDsState.linkedlist;
  // Each node takes 2 cells: [data, next_pointer]
  var addr = mpFindFreeBlock(2);
  if (addr === -1) { mpSetStatus('No contiguous 2-cell block available!', 'error'); return; }

  var oldHead = st.head;
  st.head = addr;
  st.nodes.unshift({ addr: addr, val: val, nextPtr: oldHead });

  mpAlloc(addr,   1, 'data',    val,     'LL.data', 'linkedlist');
  mpAlloc(addr+1, 1, 'pointer', oldHead === -1 ? 'NULL' : oldHead, 'LL.next', 'linkedlist');
  mpFlashCells([addr, addr+1]);
  mpLog('alloc @' + addr + ',' + (addr+1) + ' node{' + val + '|→' + (oldHead === -1 ? 'NULL' : oldHead) + '}', 'alloc');
  mpSetStatus('Inserted ' + val + ' at head. Node at addr=' + addr + ': [data=' + val + '][next→' + (oldHead === -1 ? 'NULL' : oldHead) + ']. Note: scattered allocation!', 'alloc');
  mpRenderLLViz();
}

function mpLLInsertTail(val) {
  var st = mpDsState.linkedlist;
  var addr = mpFindFreeBlock(2);
  if (addr === -1) { mpSetStatus('No contiguous 2-cell block available!', 'error'); return; }

  // Update last node's next pointer
  if (st.nodes.length > 0) {
    var last = st.nodes[st.nodes.length - 1];
    mpMem[last.addr + 1].value = addr;
    last.nextPtr = addr;
  } else {
    st.head = addr;
  }

  st.nodes.push({ addr: addr, val: val, nextPtr: -1 });
  mpAlloc(addr,   1, 'data',    val,   'LL.data', 'linkedlist');
  mpAlloc(addr+1, 1, 'pointer', 'NULL','LL.next', 'linkedlist');
  mpFlashCells([addr, addr+1]);
  mpLog('alloc @' + addr + ',' + (addr+1) + ' tail{' + val + '|NULL}', 'alloc');
  mpSetStatus('Inserted ' + val + ' at tail at addr=' + addr + '. Each node is 2 cells: [data][next_ptr].', 'alloc');
  mpRenderLLViz();
}

function mpLLDeleteHead() {
  var st = mpDsState.linkedlist;
  if (st.nodes.length === 0) { mpSetStatus('Linked list is empty!', 'error'); return; }
  var node = st.nodes.shift();
  st.head = node.nextPtr;
  mpFree([node.addr, node.addr + 1]);
  mpLog('free @' + node.addr + ',' + (node.addr+1) + ' node{' + node.val + '}', 'free');
  mpSetStatus('Deleted head node (val=' + node.val + ') — freed addresses ' + node.addr + ' and ' + (node.addr+1) + '. Head now: ' + (st.head === -1 ? 'NULL' : st.head), 'free');
  mpRenderLLViz();
}

function mpRenderLLViz() {
  var viz = document.getElementById('mpDsViz');
  var titleEl = document.getElementById('mpDsVizTitle');
  if (!viz) return;
  if (titleEl) titleEl.textContent = 'Linked List (scattered nodes)';

  var st = mpDsState.linkedlist;
  if (st.nodes.length === 0) { viz.innerHTML = '<span style="font-size:0.78rem;color:var(--text-secondary)">NULL — empty list.</span>'; return; }

  var html = 'HEAD → ';
  st.nodes.forEach(function(node, i) {
    html += '<div class="mp-viz-node">' +
      '<div style="display:flex;gap:1px">' +
        '<div class="mp-viz-box">' + node.val + '</div>' +
        '<div class="mp-viz-box mp-viz-ptr">' + (node.nextPtr === -1 ? 'N' : node.nextPtr) + '</div>' +
      '</div>' +
      '<div class="mp-viz-addr">@' + node.addr + '</div>' +
    '</div>';
    if (i < st.nodes.length - 1) html += '<div class="mp-viz-arrow">→</div>';
    else html += '<div class="mp-viz-arrow">→ NULL</div>';
  });
  viz.innerHTML = html;
}

/* ─── STACK operations ─── */
function mpStackPush(val) {
  var st = mpDsState.stack;
  var addr = st.base + st.items.length;
  if (addr >= MP_CELLS) { mpSetStatus('Stack overflow!', 'error'); return; }
  st.items.push(val);
  mpAlloc(addr, 1, 'data', val, 'stack[' + (st.items.length-1) + ']', 'stack');
  // Stack pointer cell
  var spAddr = st.base - 1;
  mpAlloc(spAddr, 1, 'sp', addr, 'SP', 'stack');
  mpFlashCells([addr]);
  mpLog('push @' + addr + ' val=' + val + ' SP=' + addr, 'alloc');
  mpSetStatus('Pushed ' + val + ' → addr=' + addr + '. Stack pointer (SP) now points to ' + addr + '. LIFO structure grows upward.', 'alloc');
  mpRenderStackViz();
}

function mpStackPop() {
  var st = mpDsState.stack;
  if (st.items.length === 0) { mpSetStatus('Stack underflow!', 'error'); return; }
  var idx  = st.items.length - 1;
  var addr = st.base + idx;
  var val  = st.items.pop();
  mpFree([addr]);
  var spAddr = st.base - 1;
  var newSP = st.items.length > 0 ? st.base + st.items.length - 1 : st.base - 1;
  if (spAddr >= 0) mpAlloc(spAddr, 1, 'sp', newSP, 'SP', 'stack');
  mpLog('pop @' + addr + ' val=' + val, 'free');
  mpSetStatus('Popped ' + val + ' from addr=' + addr + '. SP decremented.', 'free');
  mpRenderStackViz();
}

function mpStackPeek() {
  var st = mpDsState.stack;
  if (st.items.length === 0) { mpSetStatus('Stack is empty!', 'error'); return; }
  var addr = st.base + st.items.length - 1;
  mpFlashCells([addr]);
  mpSetStatus('Peek: top = ' + st.items[st.items.length-1] + ' at addr=' + addr + '. No memory modification — O(1) read.', 'info');
}

function mpRenderStackViz() {
  var viz = document.getElementById('mpDsViz');
  var titleEl = document.getElementById('mpDsVizTitle');
  if (!viz) return;
  if (titleEl) titleEl.textContent = 'Stack (LIFO — grows up)';

  var st = mpDsState.stack;
  if (st.items.length === 0) { viz.innerHTML = '<span style="font-size:0.78rem;color:var(--text-secondary)">Empty stack. SP = base.</span>'; return; }

  var html = '';
  var rev = st.items.slice().reverse();
  rev.forEach(function(val, i) {
    var idx  = st.items.length - 1 - i;
    var addr = st.base + idx;
    var isTop = i === 0;
    html += '<div class="mp-viz-node" style="margin:1px 0">' +
      '<div class="mp-viz-box' + (isTop ? ' mp-viz-sp' : '') + '">' + val + (isTop ? ' ← SP' : '') + '</div>' +
      '<div class="mp-viz-addr">@' + addr + '</div>' +
    '</div>';
  });
  viz.innerHTML = html;
}

/* ─── QUEUE (ring buffer) operations ─── */
function mpQueueEnqueue(val) {
  var st = mpDsState.queue;
  if (st.items.length >= st.cap) { mpSetStatus('Queue full (capacity ' + st.cap + ')!', 'error'); return; }
  var addr = st.base + (st.tail % st.cap);
  st.items.push(val);
  st.tail = (st.tail + 1) % st.cap;
  mpAlloc(addr, 1, 'data', val, 'Q[' + ((st.tail - 1 + st.cap) % st.cap) + ']', 'queue');
  mpFlashCells([addr]);
  mpLog('enqueue @' + addr + ' val=' + val, 'alloc');
  mpSetStatus('Enqueued ' + val + ' → addr=' + addr + '. Ring buffer tail=' + ((st.tail - 1 + st.cap) % st.cap) + '. Wraps around at capacity ' + st.cap + '.', 'alloc');
  mpRenderQueueViz();
}

function mpQueueDequeue() {
  var st = mpDsState.queue;
  if (st.items.length === 0) { mpSetStatus('Queue is empty!', 'error'); return; }
  var addr = st.base + (st.head % st.cap);
  var val  = st.items.shift();
  st.head  = (st.head + 1) % st.cap;
  mpFree([addr]);
  mpLog('dequeue @' + addr + ' val=' + val, 'free');
  mpSetStatus('Dequeued ' + val + ' from addr=' + addr + '. Head moves to ' + st.head + '. Ring buffer — tail wraps around!', 'free');
  mpRenderQueueViz();
}

function mpRenderQueueViz() {
  var viz = document.getElementById('mpDsViz');
  var titleEl = document.getElementById('mpDsVizTitle');
  if (!viz) return;
  if (titleEl) titleEl.textContent = 'Queue (Ring Buffer)';

  var st = mpDsState.queue;
  if (st.items.length === 0) { viz.innerHTML = '<span style="font-size:0.78rem;color:var(--text-secondary)">Empty queue.</span>'; return; }

  var html = 'HEAD→ ';
  st.items.forEach(function(val, i) {
    var slotIdx = (st.head + i) % st.cap;
    var addr    = st.base + slotIdx;
    html += '<div class="mp-viz-node">' +
      '<div class="mp-viz-box">' + val + '</div>' +
      '<div class="mp-viz-addr">@' + addr + '[' + slotIdx + ']</div>' +
    '</div>';
    if (i < st.items.length - 1) html += '<div class="mp-viz-arrow">→</div>';
  });
  html += ' ←TAIL';
  viz.innerHTML = html;
}

/* ─── HASH MAP operations ─── */
function mpHash(val) {
  return ((val * 2654435761) >>> 0) % mpDsState.hashmap.cap;
}

function mpHashMapPut(val) {
  var st   = mpDsState.hashmap;
  var key  = val % 100;
  var slot = mpHash(key);
  var addr = st.base + slot * 2;

  // Simple open addressing — check if slot taken
  var collision = mpMem[addr].type !== 'free' && mpMem[addr].value !== key;
  var key  = val % 100;
  var existing = st.entries.find(function(e) { return e.key === key; });
  if (!existing && st.entries.length >= st.cap) {
    mpSetStatus('Hash map full! Cannot insert key ' + key + '.', 'error');
    return;
  }
  var slot = mpHash(key);

  if (collision) {
    // Linear probe
    var orig = slot;
    do {
      slot = (slot + 1) % st.cap;
      addr = st.base + slot * 2;
    } while (mpMem[addr].type !== 'free' && mpMem[addr].value !== key && slot !== orig);
  }

  st.entries = st.entries.filter(function(e) { return e.key !== key; });
  st.entries.push({ key: key, val: val, slot: slot, addr: addr });

  mpAlloc(addr,   1, 'header', key, 'HM.key[' + slot + ']', 'hashmap');
  mpAlloc(addr+1, 1, 'data',   val, 'HM.val[' + slot + ']', 'hashmap');
  mpFlashCells([addr, addr+1]);
  mpLog((collision ? 'probe→' : 'put') + ' slot=' + slot + ' @' + addr + ' key=' + key + ' val=' + val, 'alloc');
  mpSetStatus((collision ? 'Hash collision! Linear probed to slot ' + slot + '. ' : '') + 'put(key=' + key + ', val=' + val + ') → bucket ' + slot + ' at addr=' + addr + '. hash(' + key + ') % ' + st.cap + ' = ' + mpHash(key), 'alloc');
  mpRenderHashMapViz();
}

function mpHashMapGet(val) {
  var st  = mpDsState.hashmap;
  var key = val % 100;
  var entry = st.entries.find(function(e) { return e.key === key; });
  if (!entry) { mpSetStatus('Key ' + key + ' not found in hash map.', 'error'); return; }
  mpFlashCells([entry.addr, entry.addr+1]);
  mpSetStatus('get(key=' + key + ') → hash=' + mpHash(key) + ' → slot=' + entry.slot + ' → addr=' + entry.addr + ' → value=' + entry.val + '. O(1) average!', 'info');
}

function mpHashMapDelete(val) {
  var st  = mpDsState.hashmap;
  var key = val % 100;
  var idx = st.entries.findIndex(function(e) { return e.key === key; });
  if (idx === -1) { mpSetStatus('Key ' + key + ' not in hash map.', 'error'); return; }
  var entry = st.entries[idx];
  mpFree([entry.addr, entry.addr+1]);
  st.entries.splice(idx, 1);
  mpLog('delete key=' + key + ' @' + entry.addr, 'free');
  mpSetStatus('delete(key=' + key + ') freed addresses ' + entry.addr + ' and ' + (entry.addr+1) + '.', 'free');
  mpRenderHashMapViz();
}

function mpRenderHashMapViz() {
  var viz     = document.getElementById('mpDsViz');
  var titleEl = document.getElementById('mpDsVizTitle');
  if (!viz) return;
  if (titleEl) titleEl.textContent = 'Hash Map (Open Addressing)';

  var st = mpDsState.hashmap;
  if (st.entries.length === 0) { viz.innerHTML = '<span style="font-size:0.78rem;color:var(--text-secondary)">Empty — put(key, value) to start.</span>'; return; }

  viz.innerHTML = st.entries.map(function(e) {
    return '<div class="mp-viz-node">' +
      '<div style="display:flex;gap:1px">' +
        '<div class="mp-viz-box mp-viz-head">' + e.key + '</div>' +
        '<div class="mp-viz-box">' + e.val + '</div>' +
      '</div>' +
      '<div class="mp-viz-addr">slot ' + e.slot + ' @' + e.addr + '</div>' +
      '<div class="mp-viz-label">key|val</div>' +
    '</div>';
  }).join('');
}

/* ─── BINARY TREE operations ─── */
function mpBTreeInsert(val) {
  var st = mpDsState.binarytree;
  var idx = st.nodes.length;
  var addr = st.base + idx;
  if (addr >= MP_CELLS) { mpSetStatus('Tree memory full!', 'error'); return; }
  st.nodes.push(val);
  mpAlloc(addr, 1, 'data', val, 'tree[' + idx + ']', 'binarytree');
  mpFlashCells([addr]);
  var parentIdx = idx > 0 ? Math.floor((idx - 1) / 2) : -1;
  var parentAddr = parentIdx >= 0 ? st.base + parentIdx : -1;
  mpLog('insert tree[' + idx + ']=' + val + ' @' + addr, 'alloc');
  mpSetStatus(
    'Inserted ' + val + ' as tree[' + idx + '] at addr=' + addr + '.' +
    (parentIdx >= 0 ? ' Parent=tree[' + parentIdx + ']='+st.nodes[parentIdx]+' at addr='+parentAddr+'.' : ' This is the root.') +
    ' No pointers — parent(i)=⌊(i-1)/2⌋, left(i)=2i+1, right(i)=2i+2.', 'alloc');
  mpRenderBTreeViz();
}

function mpRenderBTreeViz() {
  var viz     = document.getElementById('mpDsViz');
  var titleEl = document.getElementById('mpDsVizTitle');
  if (!viz) return;
  if (titleEl) titleEl.textContent = 'Binary Tree (heap-indexed array)';

  var st = mpDsState.binarytree;
  if (st.nodes.length === 0) { viz.innerHTML = '<span style="font-size:0.78rem;color:var(--text-secondary)">Empty — insert nodes to see heap indexing.</span>'; return; }

  viz.innerHTML = st.nodes.map(function(val, i) {
    var parentIdx = i > 0 ? Math.floor((i-1)/2) : -1;
    return '<div class="mp-viz-node">' +
      '<div class="mp-viz-box">' + val + '</div>' +
      '<div class="mp-viz-addr">[' + i + ']@' + (mpDsState.binarytree.base + i) + '</div>' +
      '<div class="mp-viz-label">' + (parentIdx >= 0 ? 'par['+parentIdx+']' : 'root') + '</div>' +
    '</div>';
  }).join('');
}

/* ─── Find free block ─── */
function mpFindFreeBlock(size) {
  for (var i = 0; i <= MP_CELLS - size; i++) {
    var ok = true;
    for (var j = 0; j < size; j++) {
      if (mpMem[i + j].type !== 'free') { ok = false; break; }
    }
    if (ok) return i;
  }
  return -1;
}

/* ─── Render ops for current DS ─── */
function mpRenderOps() {
  var wrap = document.getElementById('mpOpsWrap');
  if (!wrap) return;
  var ops = MP_DS_OPS[mpCurrentDs] || [];
  if (ops.indexOf(mpCurrentOp) === -1) mpCurrentOp = ops[0] || '';
  wrap.innerHTML = ops.map(function(op) {
    var active = op === mpCurrentOp;
    return '<button type="button" class="mp-op-btn' + (active ? ' active' : '') + '" data-op="' + op + '" aria-pressed="' + active + '">' + op + '</button>';
  }).join('');
  wrap.querySelectorAll('.mp-op-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      wrap.querySelectorAll('.mp-op-btn').forEach(function(b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      mpCurrentOp = btn.getAttribute('data-op');
    });
  });
}

/* ─── Execute operation ─── */
function mpExecute() {
  var valueOps = ['push', 'access', 'insert head', 'insert tail', 'enqueue', 'put', 'get', 'delete', 'insert'];
  var needsValue = valueOps.indexOf(mpCurrentOp) !== -1;
  var rawValue = ((document.getElementById('mpValue') || {}).value || '').trim();
  var val = 0;
  if (needsValue) {
    if (!/^-?\d+$/.test(rawValue)) { mpSetStatus('Enter a valid integer value.', 'error'); return; }
    val = Number(rawValue);
  }

  switch (mpCurrentDs) {
    case 'array':
      if (mpCurrentOp === 'push')   mpArrayPush(val);
      else if (mpCurrentOp === 'pop')    mpArrayPop();
      else if (mpCurrentOp === 'access') mpArrayAccess(val);
      break;
    case 'linkedlist':
      if (mpCurrentOp === 'insert head') mpLLInsertHead(val);
      else if (mpCurrentOp === 'insert tail') mpLLInsertTail(val);
      else if (mpCurrentOp === 'delete head') mpLLDeleteHead();
      break;
    case 'stack':
      if (mpCurrentOp === 'push') mpStackPush(val);
      else if (mpCurrentOp === 'pop')  mpStackPop();
      else if (mpCurrentOp === 'peek') mpStackPeek();
      break;
    case 'queue':
      if (mpCurrentOp === 'enqueue') mpQueueEnqueue(val);
      else if (mpCurrentOp === 'dequeue') mpQueueDequeue();
      break;
    case 'hashmap':
      if (mpCurrentOp === 'put')    mpHashMapPut(val);
      else if (mpCurrentOp === 'get')    mpHashMapGet(val);
      else if (mpCurrentOp === 'delete') mpHashMapDelete(val);
      break;
    case 'binarytree':
      mpBTreeInsert(val);
      break;
  }
  mpRenderGrid();
}

/* ─── Reset ─── */
function mpResetAll() {
  mpInitMem();
  mpDsState = {
    array:      { items: [], baseAddr: 10 },
    linkedlist: { head: -1, nodes: [] },
    stack:      { items: [], base: 50, sp: 50 },
    queue:      { items: [], base: 80, head: 0, tail: 0, cap: 8 },
    hashmap:    { buckets: [], base: 120, cap: 8, entries: [] },
    binarytree: { nodes: [], base: 160 },
  };
  var log = document.getElementById('mpAllocLog');
  if (log) log.innerHTML = '<div class="mp-log-empty">No operations yet.</div>';
  var viz = document.getElementById('mpDsViz');
  if (viz) viz.innerHTML = '';
  mpSelectedCell = -1;
  var detail = document.getElementById('mpCellDetail');
  if (detail) detail.innerHTML = '<div class="mp-detail-empty">Click a memory cell to inspect it.</div>';
  mpSetStatus('Memory reset. 256 cells available. Select a data structure and start operating.', '');
  mpRenderGrid();

  // Re-render viz for current DS
  mpRenderDsViz();
}

function mpRenderDsViz() {
  switch (mpCurrentDs) {
    case 'array':      mpRenderArrayViz(); break;
    case 'linkedlist': mpRenderLLViz(); break;
    case 'stack':      mpRenderStackViz(); break;
    case 'queue':      mpRenderQueueViz(); break;
    case 'hashmap':    mpRenderHashMapViz(); break;
    case 'binarytree': mpRenderBTreeViz(); break;
  }
}

/* ─── Init ─── */
function mpInit() {
  mpInitMem();
  mpRenderGrid();
  mpRenderOps();
  mpRenderDsViz();

  // DS buttons
  document.querySelectorAll('.mp-ds-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.mp-ds-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      mpCurrentDs = btn.getAttribute('data-ds');
      mpRenderOps();
      mpRenderDsViz();
      mpSetStatus('Switched to ' + mpCurrentDs + '. Operations now affect this structure\'s memory region.', 'info');
    });
  });

  var execBtn  = document.getElementById('mpExecBtn');
  var resetBtn = document.getElementById('mpResetBtn');
  if (execBtn)  execBtn.addEventListener('click', mpExecute);
  if (resetBtn) resetBtn.addEventListener('click', mpResetAll);

  // Keyboard shortcut: Enter to execute
  var valEl = document.getElementById('mpValue');
  if (valEl) valEl.addEventListener('keydown', function(e) { if (e.key === 'Enter') mpExecute(); });

  // Options re-render
  ['mpShowBinary', 'mpShowPointers', 'mpAnimate'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', mpRenderGrid);
  });
}