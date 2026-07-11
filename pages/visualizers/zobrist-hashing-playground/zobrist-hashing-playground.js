document.addEventListener('DOMContentLoaded', function() {
  zbInit();
});

var ZB_SIZE = 16;
var ZB_PIECES = ['X', 'O'];
var ZB_CYCLE = [null, 'X', 'O'];

var zbState = {
  keyTable: {},
  board: [],
  hash: 0n,
  history: [],
};

function zbRandom64() {
  var hi = BigInt(Math.floor(Math.random() * 4294967296));
  var lo = BigInt(Math.floor(Math.random() * 4294967296));
  return (hi << 32n) | lo;
}

function zbKeyName(piece, sq) { return piece + '@' + sq; }

function zbBuildKeyTable() {
  var table = {};
  ZB_PIECES.forEach(function(piece) {
    for (var sq = 0; sq < ZB_SIZE; sq++) table[zbKeyName(piece, sq)] = zbRandom64();
  });
  return table;
}

function zbToHex(bigval) {
  var hex = bigval.toString(16);
  while (hex.length < 16) hex = '0' + hex;
  return '0x' + hex;
}

function zbApplyToggle(piece, sq) {
  var key = zbState.keyTable[zbKeyName(piece, sq)];
  zbState.hash ^= key;
  return key;
}

function zbRenderBoard(justChangedSq) {
  var board = document.getElementById('zbBoard');
  if (!board) return;
  board.innerHTML = '';
  for (var sq = 0; sq < ZB_SIZE; sq++) {
    var piece = zbState.board[sq];
    var cell = document.createElement('div');
    cell.className = 'zb-square' + (piece === 'X' ? ' piece-x' : piece === 'O' ? ' piece-o' : '') + (sq === justChangedSq ? ' just-changed' : '');
    cell.setAttribute('data-sq', sq);
    cell.setAttribute('role', 'button');
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('aria-label', 'Square ' + sq + ', ' + (piece || 'empty'));
    cell.innerHTML = (piece || '') + '<span class="zb-square-idx">' + sq + '</span>';
    cell.addEventListener('click', function() { zbHandleSquareClick(parseInt(this.getAttribute('data-sq'))); });
    cell.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        zbHandleSquareClick(parseInt(this.getAttribute('data-sq')));
      }
    });
    board.appendChild(cell);
  }
}

function zbRenderHash(flash) {
  var el = document.getElementById('zbHashValue');
  if (!el) return;
  el.textContent = zbToHex(zbState.hash);
  if (flash) { el.classList.remove('updated'); void el.offsetWidth; el.classList.add('updated'); }
}

function zbAddLog(msg, cls) {
  var log = document.getElementById('zbMoveLog');
  if (!log) return;
  var empty = log.querySelector('.zb-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'zb-log-entry ' + (cls || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 60) log.removeChild(log.lastChild);
}

function zbSetStatus(msg, cls) {
  var el = document.getElementById('zbStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'zb-status ' + (cls || '');
}

function zbHighlightKeys(names) {
  document.querySelectorAll('.zb-key-entry').forEach(function(el) { el.classList.remove('touched'); });
  names.forEach(function(name) {
    var el = document.querySelector('.zb-key-entry[data-key="' + name + '"]');
    if (el) el.classList.add('touched');
  });
}

function zbHandleSquareClick(sq) {
  var current = zbState.board[sq];
  var currentIdx = ZB_CYCLE.indexOf(current);
  var next = ZB_CYCLE[(currentIdx + 1) % ZB_CYCLE.length];

  var beforeHash = zbState.hash;
  var touchedKeys = [];

  if (current !== null) { zbApplyToggle(current, sq); touchedKeys.push(zbKeyName(current, sq)); }
  if (next !== null) { zbApplyToggle(next, sq); touchedKeys.push(zbKeyName(next, sq)); }

  zbState.board[sq] = next;
  zbState.history.push({ sq: sq, from: current, to: next, beforeHash: beforeHash });

  zbRenderBoard(sq);
  zbRenderHash(true);
  zbHighlightKeys(touchedKeys);

  var opDesc = current !== null && next !== null
    ? 'sq' + sq + ': ' + current + ' → ' + next + ' — XOR out ' + current + '@' + sq + ', XOR in ' + next + '@' + sq
    : current === null
      ? 'sq' + sq + ': empty → ' + next + ' — XOR in ' + next + '@' + sq
      : 'sq' + sq + ': ' + current + ' → empty — XOR out ' + current + '@' + sq;

  zbAddLog(opDesc, '');
  zbSetStatus('Move applied at square ' + sq + '. New hash: ' + zbToHex(zbState.hash), '');

  var undoBtn = document.getElementById('zbUndoBtn');
  if (undoBtn) undoBtn.disabled = false;
}

function zbUndoLastMove() {
  if (zbState.history.length === 0) return;
  var move = zbState.history.pop();

  var touchedKeys = [];
  if (move.to !== null) { zbApplyToggle(move.to, move.sq); touchedKeys.push(zbKeyName(move.to, move.sq)); }
  if (move.from !== null) { zbApplyToggle(move.from, move.sq); touchedKeys.push(zbKeyName(move.from, move.sq)); }

  zbState.board[move.sq] = move.from;

  zbRenderBoard(move.sq);
  zbRenderHash(true);
  zbHighlightKeys(touchedKeys);

  var matches = zbState.hash === move.beforeHash;
  zbAddLog('Undo sq' + move.sq + ': re-applied the same XOR keys — hash restored to ' + zbToHex(zbState.hash), 'undo');
  zbSetStatus('Undo complete. Hash exactly matches pre-move value: ' + (matches ? '✅ verified' : '❌ mismatch (should never happen)'), matches ? 'match' : '');

  if (zbState.history.length === 0) {
    var undoBtn = document.getElementById('zbUndoBtn');
    if (undoBtn) undoBtn.disabled = true;
  }
}

function zbRenderKeyTable() {
  var container = document.getElementById('zbKeyTable');
  if (!container) return;
  var entries = [];
  ZB_PIECES.forEach(function(piece) {
    for (var sq = 0; sq < 6; sq++) {
      var name = zbKeyName(piece, sq);
      entries.push('<div class="zb-key-entry" data-key="' + name + '"><span class="zb-key-name">' + name + '</span><span class="zb-key-hex">' + zbToHex(zbState.keyTable[name]).slice(0, 10) + '…</span></div>');
    }
  });
  container.innerHTML = entries.join('') + '<div style="font-size:0.62rem;color:rgba(148,163,184,0.35);font-style:italic;padding:0.3rem 0.4rem">…and ' + (ZB_SIZE * 2 - entries.length) + ' more keys (full table generated, not all shown)</div>';
}

function zbResetBoard() {
  zbState.board = new Array(ZB_SIZE).fill(null);
  zbState.hash = 0n;
  zbState.history = [];
  zbRenderBoard();
  zbRenderHash();
  var log = document.getElementById('zbMoveLog');
  if (log) log.innerHTML = '<div class="zb-empty">No moves yet.</div>';
  var undoBtn = document.getElementById('zbUndoBtn');
  if (undoBtn) undoBtn.disabled = true;
  zbSetStatus('Board reset. Click any square to make your first move.', '');
}

function zbNewKeyTable() {
  zbState.keyTable = zbBuildKeyTable();
  zbRenderKeyTable();
  zbResetBoard();
  zbSetStatus('New random key table generated. All previous hashes are now meaningless — this is a fresh Zobrist scheme.', '');
}

var ZB_PATH_A = [{ piece: 'X', sq: 0 }, { piece: 'O', sq: 5 }, { piece: 'X', sq: 10 }];
var ZB_PATH_B = [{ piece: 'X', sq: 10 }, { piece: 'X', sq: 0 }, { piece: 'O', sq: 5 }];

function zbRunPath(pathMoves, resultElId) {
  var hash = 0n;
  pathMoves.forEach(function(m) { hash ^= zbState.keyTable[zbKeyName(m.piece, m.sq)]; });
  var el = document.getElementById(resultElId);
  if (el) el.textContent = zbToHex(hash);
  return hash;
}

function zbRenderTranspositionMoves() {
  var aEl = document.getElementById('zbPathAMoves');
  var bEl = document.getElementById('zbPathBMoves');
  if (aEl) aEl.innerHTML = ZB_PATH_A.map(function(m) { return 'place ' + m.piece + ' @ sq' + m.sq; }).join('<br>');
  if (bEl) bEl.innerHTML = ZB_PATH_B.map(function(m) { return 'place ' + m.piece + ' @ sq' + m.sq; }).join('<br>');
}

function zbCheckTransposition() {
  var hashAEl = document.getElementById('zbHashA');
  var hashBEl = document.getElementById('zbHashB');
  var verdictEl = document.getElementById('zbTcVerdict');
  if (!hashAEl || !hashBEl || !verdictEl) return;

  var aRun = hashAEl.textContent !== '—';
  var bRun = hashBEl.textContent !== '—';

  if (aRun && bRun) {
    verdictEl.classList.remove('hidden');
    var match = hashAEl.textContent === hashBEl.textContent;
    verdictEl.className = 'zb-tc-verdict ' + (match ? 'match' : 'pending');
    verdictEl.textContent = match
      ? '✅ Identical hashes! Both paths placed the same 3 pieces on the same 3 squares — XOR is commutative, so move order never matters for the final hash.'
      : '⚠️ Hashes differ — this should never happen for the same set of placements. Check the key table.';
  }
}

var ZB_CC_STATE = { bits: 64 };

function zbRunCollisionDemo() {
  var count = 300;
  var hashes = {};
  var collisions = 0;

  for (var i = 0; i < count; i++) {
    var numPieces = 1 + Math.floor(Math.random() * 4);
    var usedSquares = {};
    var hash = 0n;
    for (var p = 0; p < numPieces; p++) {
      var sq = Math.floor(Math.random() * ZB_SIZE);
      if (usedSquares[sq]) continue;
      usedSquares[sq] = true;
      var piece = ZB_PIECES[Math.floor(Math.random() * ZB_PIECES.length)];
      var key = zbState.keyTable[zbKeyName(piece, sq)];
      if (ZB_CC_STATE.bits === 8) key = key & 0xFFn;
      hash ^= key;
    }

    var hashStr = hash.toString();
    if (hashes[hashStr] !== undefined) collisions++;
    else hashes[hashStr] = i;
  }

  var uniqueCount = Object.keys(hashes).length;
  var resultEl = document.getElementById('zbCcResult');
  if (resultEl) {
    var possibleValues = ZB_CC_STATE.bits === 8 ? 256 : 'about 1.8×10¹⁹ (2⁶⁴)';
    var verdictClass = collisions > 0 ? 'zb-cc-verdict-danger' : 'zb-cc-verdict-safe';
    var verdictText = collisions > 0
      ? '⚠️ ' + collisions + ' collision(s) found — with only ' + possibleValues + ' possible hash values, 300 random draws almost guarantee a collision by the birthday paradox.'
      : '✅ Zero collisions — with ' + possibleValues + ' possible hash values, 300 draws have negligible collision probability.';

    resultEl.innerHTML =
      '<div class="zb-cc-stat-row"><span>Positions generated</span><span>' + count + '</span></div>' +
      '<div class="zb-cc-stat-row"><span>Unique hashes</span><span>' + uniqueCount + '</span></div>' +
      '<div class="zb-cc-stat-row"><span>Collisions detected</span><span>' + collisions + '</span></div>' +
      '<div class="zb-cc-stat-row"><span>Possible hash space</span><span>' + possibleValues + '</span></div>' +
      '<p style="margin-top:0.6rem" class="' + verdictClass + '">' + verdictText + '</p>';
  }
}

function zbInit() {
  zbState.keyTable = zbBuildKeyTable();
  zbResetBoard();
  zbRenderKeyTable();
  zbRenderTranspositionMoves();

  var newTableBtn = document.getElementById('zbNewTableBtn');
  var undoBtn = document.getElementById('zbUndoBtn');
  var resetBtn = document.getElementById('zbResetBtn');
  if (newTableBtn) newTableBtn.addEventListener('click', zbNewKeyTable);
  if (undoBtn) undoBtn.addEventListener('click', zbUndoLastMove);
  if (resetBtn) resetBtn.addEventListener('click', zbResetBoard);

  var runA = document.getElementById('zbRunPathA');
  var runB = document.getElementById('zbRunPathB');
  if (runA) runA.addEventListener('click', function() { zbRunPath(ZB_PATH_A, 'zbHashA'); zbCheckTransposition(); });
  if (runB) runB.addEventListener('click', function() { zbRunPath(ZB_PATH_B, 'zbHashB'); zbCheckTransposition(); });

  document.querySelectorAll('.zb-cc-mode-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.zb-cc-mode-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      ZB_CC_STATE.bits = parseInt(btn.getAttribute('data-bits'));
    });
  });

  var ccRunBtn = document.getElementById('zbCcRunBtn');
  if (ccRunBtn) ccRunBtn.addEventListener('click', zbRunCollisionDemo);
}