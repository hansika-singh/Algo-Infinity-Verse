document.addEventListener('DOMContentLoaded', function() {
  ckInit();
});

var ckState = {
  size: 8,
  table1: [],
  table2: [],
  seed1: 17,
  seed2: 31,
  keyCount: 0,
  evictionCount: 0,
  rehashCount: 0,
  maxKicks: 12,
  animating: false,
};

function ckHash(key, seed, size) {
  var h = seed;
  for (var i = 0; i < key.length; i++) {
    h = ((h << 5) + h + key.charCodeAt(i) + seed) >>> 0;
  }
  return h % size;
}

function ckH1(key) { return ckHash(key, ckState.seed1, ckState.size); }
function ckH2(key) { return ckHash(key, ckState.seed2, ckState.size); }

function ckInitTables(size) {
  ckState.size = size;
  ckState.table1 = new Array(size).fill(null);
  ckState.table2 = new Array(size).fill(null);
  ckState.keyCount = 0;
  ckState.evictionCount = 0;
  ckState.rehashCount = 0;
}

function ckLookup(key) {
  var pos1 = ckH1(key);
  var pos2 = ckH2(key);
  if (ckState.table1[pos1] === key) return { found: true, table: 1, pos: pos1 };
  if (ckState.table2[pos2] === key) return { found: true, table: 2, pos: pos2 };
  return { found: false, checkedPos1: pos1, checkedPos2: pos2 };
}

function ckAllKeys() {
  var keys = [];
  ckState.table1.forEach(function(k) { if (k !== null) keys.push(k); });
  ckState.table2.forEach(function(k) { if (k !== null) keys.push(k); });
  return keys;
}

function ckRegenerateSeeds() {
  ckState.seed1 = 17 + Math.floor(Math.random() * 5000);
  ckState.seed2 = 31 + Math.floor(Math.random() * 5000);
}

function ckInsert(key, log) {
  var existing = ckLookup(key);
  if (existing.found) { log.push({ type: 'done', msg: 'Key "' + key + '" already exists — no insertion needed.' }); return true; }

  var cur = key;
  var tableIdx = 1;
  var kicks = 0;

  while (kicks < ckState.maxKicks) {
    var table = tableIdx === 1 ? ckState.table1 : ckState.table2;
    var hashFn = tableIdx === 1 ? ckH1 : ckH2;
    var pos = hashFn(cur);

    if (table[pos] === null) {
      table[pos] = cur;
      log.push({ type: 'done', msg: '"' + cur + '" placed in Table ' + tableIdx + ' slot ' + pos + '. Chain complete.', table: tableIdx, pos: pos });
      return true;
    }

    var evicted = table[pos];
    table[pos] = cur;
    ckState.evictionCount++;
    log.push({ type: 'evict', msg: '"' + cur + '" → Table ' + tableIdx + ' slot ' + pos + ' (occupied by "' + evicted + '") — evicting "' + evicted + '"', table: tableIdx, pos: pos, evicted: evicted });

    cur = evicted;
    tableIdx = tableIdx === 1 ? 2 : 1;
    kicks++;
  }

  log.push({ type: 'rehash', msg: 'Eviction chain exceeded ' + ckState.maxKicks + ' kicks — cycle detected. Triggering full rehash with new hash functions.' });
  return false;
}

function ckFullRehash(pendingKey, log) {
  var allKeys = ckAllKeys();
  ckState.rehashCount++;

  ckInitTables(ckState.size);
  ckRegenerateSeeds();

  var success = true;
  allKeys.concat([pendingKey]).forEach(function(k) {
    var subLog = [];
    var ok = ckInsert(k, subLog);
    if (!ok) success = false;
  });

  log.push({ type: 'rehash', msg: 'Rehash complete with new h1/h2. Re-inserted ' + (allKeys.length + 1) + ' keys.' });
  return success;
}

function ckRenderTables(highlightState) {
  var t1 = document.getElementById('ckTable1');
  var t2 = document.getElementById('ckTable2');
  if (!t1 || !t2) return;

  function renderTable(container, table, tableNum) {
    container.innerHTML = table.map(function(key, idx) {
      var cls = 'ck-slot' + (key !== null ? ' filled' : ' empty');
      if (highlightState) {
        if (highlightState.table === tableNum && highlightState.pos === idx) {
          cls += ' ' + highlightState.type;
        }
        if (highlightState.checkTable === tableNum && highlightState.checkPos === idx) {
          cls += ' checking';
        }
      }
      return '<div class="' + cls + '"><span class="ck-slot-idx">' + idx + '</span><span class="ck-slot-key">' + (key !== null ? key : '—') + '</span></div>';
    }).join('');
  }

  renderTable(t1, ckState.table1, 1);
  renderTable(t2, ckState.table2, 2);
}

function ckAddLog(msg, cls) {
  var log = document.getElementById('ckLog');
  if (!log) return;
  var empty = log.querySelector('.ck-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'ck-log-entry ' + (cls || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 60) log.removeChild(log.lastChild);
}

function ckSetStatus(msg, cls) {
  var el = document.getElementById('ckStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'ck-status ' + (cls || '');
}

function ckUpdateStats() {
  var count = ckAllKeys().length;
  var loadFactor = Math.round((count / (ckState.size * 2)) * 100);

  var countEl = document.getElementById('ckKeyCount');
  var loadEl = document.getElementById('ckLoadFactor');
  var evictEl = document.getElementById('ckEvictionCount');
  var rehashEl = document.getElementById('ckRehashCount');

  if (countEl) countEl.textContent = count;
  if (loadEl) loadEl.textContent = loadFactor + '%';
  if (evictEl) evictEl.textContent = ckState.evictionCount;
  if (rehashEl) rehashEl.textContent = ckState.rehashCount;
}

function ckAnimateInsertLog(log, onDone) {
  var i = 0;
  function step() {
    if (i >= log.length) { onDone(); return; }
    var entry = log[i];
    ckAddLog(entry.msg, entry.type);
    ckRenderTables(entry.type === 'evict' || entry.type === 'done' ? { table: entry.table, pos: entry.pos, type: entry.type === 'evict' ? 'evicting' : 'inserting' } : null);
    i++;
    setTimeout(step, 380);
  }
  step();
}

function ckInsertHandler() {
  if (ckState.animating) return;
  var input = document.getElementById('ckKeyInput');
  var key = (input ? input.value : '').trim();
  if (!key) { ckSetStatus('Enter a key to insert.', ''); return; }

  ckState.animating = true;
  var log = [];
  var success = ckInsert(key, log);

  if (!success) {
    var rehashSuccess = ckFullRehash(key, log);
    ckAnimateInsertLog(log, function() {
      ckUpdateStats();
      ckSetStatus('Rehash complete. "' + key + '" and all other keys re-inserted with new hash functions.', 'rehash');
      ckState.animating = false;
    });
    return;
  }

  ckAnimateInsertLog(log, function() {
    ckRenderTables(null);
    ckUpdateStats();
    ckSetStatus('"' + key + '" inserted successfully.', 'good');
    ckState.animating = false;
  });
}

function ckLookupHandler() {
  if (ckState.animating) return;
  var input = document.getElementById('ckKeyInput');
  var key = (input ? input.value : '').trim();
  if (!key) { ckSetStatus('Enter a key to look up.', ''); return; }

  var result = ckLookup(key);

  if (result.found) {
    ckRenderTables({ checkTable: result.table, checkPos: result.pos });
    ckSetStatus('✅ Found "' + key + '" in Table ' + result.table + ' slot ' + result.pos + ' — checked exactly 2 locations (Table 1 and Table 2), O(1) worst case.', 'good');
  } else {
    ckRenderTables({ checkTable: 1, checkPos: result.checkedPos1 });
    setTimeout(function() { ckRenderTables({ checkTable: 2, checkPos: result.checkedPos2 }); }, 350);
    ckSetStatus('❌ "' + key + '" not found — checked Table 1 slot ' + result.checkedPos1 + ' and Table 2 slot ' + result.checkedPos2 + '. Exactly 2 checks, still O(1).', '');
  }
}

function ckCycleDemo() {
  ckInitTables(ckState.size);
  ckState.seed1 = 17;
  ckState.seed2 = 18;

  var demoKeys = [];
  for (var i = 0; i < ckState.size + 2; i++) demoKeys.push('k' + i);

  var log = document.getElementById('ckLog');
  if (log) log.innerHTML = '<div class="ck-empty">No insertions yet.</div>';

  var idx = 0;
  function insertNext() {
    if (idx >= demoKeys.length) {
      ckUpdateStats();
      ckSetStatus('Cycle demo complete. Watch the log above for any rehash events triggered by long eviction chains.', 'rehash');
      return;
    }
    var subLog = [];
    var success = ckInsert(demoKeys[idx], subLog);
    if (!success) ckFullRehash(demoKeys[idx], subLog);
    subLog.forEach(function(entry) { ckAddLog(entry.msg, entry.type); });
    ckRenderTables(null);
    ckUpdateStats();
    idx++;
    setTimeout(insertNext, 250);
  }

  ckSetStatus('Running cycle demo — inserting near-capacity keys with weak seeds to provoke eviction chains and rehashes.', 'evict');
  insertNext();
}

function ckReset() {
  ckInitTables(ckState.size);
  ckRegenerateSeeds();
  ckRenderTables(null);
  ckUpdateStats();

  var log = document.getElementById('ckLog');
  if (log) log.innerHTML = '<div class="ck-empty">No insertions yet.</div>';

  ckSetStatus('Reset. Insert a key. If both its slots are taken, watch the eviction chain animate.', '');
}

function ckInit() {
  ckReset();

  var insertBtn = document.getElementById('ckInsertBtn');
  var lookupBtn = document.getElementById('ckLookupBtn');
  var resetBtn  = document.getElementById('ckResetBtn');
  if (insertBtn) insertBtn.addEventListener('click', ckInsertHandler);
  if (lookupBtn) lookupBtn.addEventListener('click', ckLookupHandler);
  if (resetBtn)  resetBtn.addEventListener('click', ckReset);

  document.querySelectorAll('.ck-size-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.ck-size-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      ckState.size = parseInt(btn.getAttribute('data-size'));
      ckReset();
    });
  });

  var cycleDemoBtn = document.getElementById('ckCycleDemoBtn');
  if (cycleDemoBtn) cycleDemoBtn.addEventListener('click', ckCycleDemo);

  var keyInput = document.getElementById('ckKeyInput');
  if (keyInput) keyInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') ckInsertHandler(); });
}