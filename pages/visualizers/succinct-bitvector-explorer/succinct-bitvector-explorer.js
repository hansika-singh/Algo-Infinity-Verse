document.addEventListener('DOMContentLoaded', function() {
  sbInit();
});

var SB_SUPERBLOCK_SIZE = 8;
var SB_BLOCK_SIZE = 4;
var SB_BLOCKS_PER_SUPERBLOCK = SB_SUPERBLOCK_SIZE / SB_BLOCK_SIZE;

var sbState = {
  bits: [],
  n: 0,
  superblockRank: [],
  blockRank: [],
  blockBits: [],
  popcountTable: {},
  queryType: 'rank',
};

function sbPopcount(bits) {
  return bits.reduce(function(a, b) { return a + b; }, 0);
}

function sbBuildPopcountTable() {
  var table = {};
  for (var v = 0; v < 16; v++) {
    var bits = [];
    for (var b = 3; b >= 0; b--) bits.push((v >> b) & 1);
    table[v] = sbPopcount(bits);
  }
  return table;
}

function sbBitsToVal(bits) {
  var v = 0;
  bits.forEach(function(b) { v = (v << 1) | b; });
  return v;
}

function sbBuildStructure(bitString) {
  var bits = bitString.split('').map(Number);
  var n = bits.length;

  var numBlocks = Math.ceil(n / SB_BLOCK_SIZE);
  var numSuperblocks = Math.ceil(n / SB_SUPERBLOCK_SIZE);

  var superblockRank = [];
  var blockRank = [];
  var blockBits = [];

  var runningSuperblockRank = 0;
  var runningBlockRankInSuperblock = 0;

  for (var s = 0; s < numSuperblocks; s++) {
    superblockRank.push(runningSuperblockRank);
    runningBlockRankInSuperblock = 0;

    for (var localB = 0; localB < SB_BLOCKS_PER_SUPERBLOCK; localB++) {
      var globalBlockIdx = s * SB_BLOCKS_PER_SUPERBLOCK + localB;
      if (globalBlockIdx >= numBlocks) break;

      blockRank.push(runningBlockRankInSuperblock);

      var start = globalBlockIdx * SB_BLOCK_SIZE;
      var end = Math.min(start + SB_BLOCK_SIZE, n);
      var thisBlockBits = bits.slice(start, end);
      while (thisBlockBits.length < SB_BLOCK_SIZE) thisBlockBits.push(0);
      blockBits.push(thisBlockBits);

      var blockPop = sbPopcount(bits.slice(start, end));
      runningBlockRankInSuperblock += blockPop;
    }

    runningSuperblockRank += runningBlockRankInSuperblock;
  }

  return { bits: bits, n: n, superblockRank: superblockRank, blockRank: blockRank, blockBits: blockBits };
}

function sbNaiveRank(bits, i) {
  var count = 0;
  for (var k = 0; k < i && k < bits.length; k++) count += bits[k];
  return count;
}

function sbSuccinctRank(i) {
  var trace = [];
  var n = sbState.n;
  if (i > n) i = n;
  if (i <= 0) return { result: 0, trace: ['i <= 0, rank is trivially 0'] };

  // When i === n, return the total popcount directly
  if (i === n) {
    var total = sbPopcount(sbState.bits);
    trace.push('rank(' + i + ') = total popcount = ' + total);
    return { result: total, trace: trace, highlightRange: [0, n] };
  }

  var superblockIdx = Math.floor(i / SB_SUPERBLOCK_SIZE);
  var withinSuperblockOffset = i % SB_SUPERBLOCK_SIZE;
  var localBlockIdx = Math.floor(withinSuperblockOffset / SB_BLOCK_SIZE);
  var globalBlockIdx = superblockIdx * SB_BLOCKS_PER_SUPERBLOCK + localBlockIdx;
  var withinBlockOffset = withinSuperblockOffset % SB_BLOCK_SIZE;

  var sRank = sbState.superblockRank[superblockIdx] !== undefined ? sbState.superblockRank[superblockIdx] : sbState.superblockRank[sbState.superblockRank.length - 1];
  trace.push('superblock[' + superblockIdx + '] cumulative rank = ' + sRank);

  var bRank = sbState.blockRank[globalBlockIdx] !== undefined ? sbState.blockRank[globalBlockIdx] : 0;
  trace.push('block[' + globalBlockIdx + '] relative rank (within its superblock) = ' + bRank);

  var blockBitsArr = sbState.blockBits[globalBlockIdx] || [0,0,0,0];
  var partialBits = blockBitsArr.slice(0, withinBlockOffset);
  var partialVal = sbBitsToVal(partialBits.concat(new Array(4 - partialBits.length).fill(0)));
  var partialPop = withinBlockOffset === 0 ? 0 : sbPopcount(partialBits);
  trace.push('within-block popcount lookup: first ' + withinBlockOffset + ' bit(s) of block = ' + partialBits.join('') + ' → popcount table lookup = ' + partialPop);

  var result = sRank + bRank + partialPop;
  trace.push('rank(' + i + ') = ' + sRank + ' + ' + bRank + ' + ' + partialPop + ' = ' + result);

  return { result: result, trace: trace, highlightRange: [Math.max(0, i - withinBlockOffset), i] };
}

function sbSuccinctSelect(k) {
  var trace = [];
  if (k <= 0) return { result: null, trace: ['k must be >= 1'] };

  var totalOnes = sbPopcount(sbState.bits);
  if (k > totalOnes) return { result: null, trace: ['k=' + k + ' exceeds total 1s (' + totalOnes + ')'] };

  var superblockIdx = 0;
  for (var s = 0; s < sbState.superblockRank.length; s++) {
    var thisRank = sbState.superblockRank[s];
    var nextRank = s + 1 < sbState.superblockRank.length ? sbState.superblockRank[s + 1] : Infinity;
    if (k > thisRank && k <= nextRank) { superblockIdx = s; break; }
    superblockIdx = s;
  }
  trace.push('scan superblock ranks → superblock[' + superblockIdx + '] contains the k-th 1 (cumulative rank before it = ' + sbState.superblockRank[superblockIdx] + ')');

  var remainingInSuperblock = k - sbState.superblockRank[superblockIdx];

  var blockIdxInSuperblock = -1;
  var startBlock = superblockIdx * SB_BLOCKS_PER_SUPERBLOCK;
  for (var b = 0; b < SB_BLOCKS_PER_SUPERBLOCK; b++) {
    var globalB = startBlock + b;
    if (globalB >= sbState.blockRank.length) break;
    var thisBlockRank = sbState.blockRank[globalB];
    var nextBlockRank = globalB + 1 < sbState.blockRank.length && (globalB + 1) % SB_BLOCKS_PER_SUPERBLOCK !== 0
      ? sbState.blockRank[globalB + 1]
      : Infinity;
    if (remainingInSuperblock > thisBlockRank) blockIdxInSuperblock = globalB;
  }
  if (blockIdxInSuperblock === -1) blockIdxInSuperblock = startBlock;

  trace.push('scan blocks within superblock → block[' + blockIdxInSuperblock + '] is where the k-th 1 falls');

  var blockLocalRank = sbState.blockRank[blockIdxInSuperblock];
  var neededInBlock = remainingInSuperblock - blockLocalRank;

  var blockBitsArr = sbState.blockBits[blockIdxInSuperblock] || [0,0,0,0];
  var seen = 0; var posInBlock = -1;
  for (var p = 0; p < blockBitsArr.length; p++) {
    if (blockBitsArr[p] === 1) seen++;
    if (seen === neededInBlock) { posInBlock = p; break; }
  }

  trace.push('within block bits = ' + blockBitsArr.join('') + ', need the ' + neededInBlock + '-th 1 → found at local position ' + posInBlock);

  var globalPos = blockIdxInSuperblock * SB_BLOCK_SIZE + posInBlock;
  trace.push('select(' + k + ') = position ' + globalPos);

  return { result: globalPos, trace: trace };
}

function sbRenderBitsRow(highlightRange, resultPos) {
  var row = document.getElementById('sbBitsRow');
  if (!row) return;
  row.innerHTML = sbState.bits.map(function(bit, i) {
    var cls = 'sb-bit-cell ' + (bit === 1 ? 'one' : 'zero');
    if (highlightRange && i >= highlightRange[0] && i < highlightRange[1]) cls += ' highlighted';
    if (resultPos !== undefined && i === resultPos) cls += ' result';
    return '<div class="' + cls + '">' + bit + '<span class="sb-bit-idx">' + i + '</span></div>';
  }).join('');
}

function sbRenderStructure() {
  var grid = document.getElementById('sbStructureGrid');
  if (!grid) return;

  var numSuperblocks = sbState.superblockRank.length;
  grid.innerHTML = '';

  for (var s = 0; s < numSuperblocks; s++) {
    var box = document.createElement('div');
    box.className = 'sb-superblock-box';

    var header = document.createElement('div');
    header.className = 'sb-superblock-header';
    header.textContent = 'Superblock[' + s + '] — cumulative rank before = ' + sbState.superblockRank[s];
    box.appendChild(header);

    var blockRow = document.createElement('div');
    blockRow.className = 'sb-block-row';

    for (var b = 0; b < SB_BLOCKS_PER_SUPERBLOCK; b++) {
      var globalB = s * SB_BLOCKS_PER_SUPERBLOCK + b;
      if (globalB >= sbState.blockBits.length) break;
      var blockBox = document.createElement('div');
      blockBox.className = 'sb-block-box';
      blockBox.innerHTML = 'block[' + globalB + '] rank=' + sbState.blockRank[globalB] + ' <span class="sb-block-bits">bits=' + sbState.blockBits[globalB].join('') + '</span>';
      blockRow.appendChild(blockBox);
    }

    box.appendChild(blockRow);
    grid.appendChild(box);
  }
}

function sbRenderPopcountTable() {
  var container = document.getElementById('sbPopcountTable');
  if (!container) return;
  var table = sbBuildPopcountTable();
  container.innerHTML = Object.keys(table).map(function(v) {
    var bits = parseInt(v).toString(2).padStart(4, '0');
    return '<div class="sb-pop-entry"><span class="sb-pop-bits">' + bits + '</span><span class="sb-pop-count">popcount=' + table[v] + '</span></div>';
  }).join('');
  sbState.popcountTable = table;
}

function sbSetStatus(msg, cls) {
  var el = document.getElementById('sbStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'sb-status ' + (cls || '');
}

function sbAddTrace(traceArr, isResult) {
  var container = document.getElementById('sbQueryTrace');
  if (!container) return;
  container.innerHTML = '';
  traceArr.forEach(function(msg, i) {
    var entry = document.createElement('div');
    entry.className = 'sb-trace-entry' + (i === traceArr.length - 1 ? ' result' : '');
    entry.textContent = msg;
    container.appendChild(entry);
  });
}

function sbRenderSpaceStats() {
  var n = sbState.n;
  var rawBits = n;
  var superblockBits = sbState.superblockRank.length * Math.ceil(Math.log2(n + 1));
  var blockBitsCount = sbState.blockRank.length * Math.ceil(Math.log2(SB_SUPERBLOCK_SIZE + 1));
  var popTableBits = 16 * 3;
  var total = superblockBits + blockBitsCount + popTableBits;

  var rawEl   = document.getElementById('sbSpaceRaw');
  var superEl = document.getElementById('sbSpaceSuper');
  var blockEl = document.getElementById('sbSpaceBlock');
  var popEl   = document.getElementById('sbSpacePop');
  var totalEl = document.getElementById('sbSpaceTotal');

  if (rawEl)   rawEl.textContent   = rawBits + ' bits';
  if (superEl) superEl.textContent = superblockBits + ' bits';
  if (blockEl) blockEl.textContent = blockBitsCount + ' bits';
  if (popEl)   popEl.textContent   = popTableBits + ' bits (shared across all instances)';
  if (totalEl) totalEl.textContent = total + ' bits (' + (Math.round((total / rawBits) * 1000) / 10) + '% of raw size)';
}

function sbBuildAndRender() {
  var input = document.getElementById('sbBitsInput');
  var raw = (input ? input.value : '').replace(/[^01]/g, '');
  if (raw.length === 0) { sbSetStatus('Enter a valid bit string (0s and 1s only).', ''); return; }

  var built = sbBuildStructure(raw);
  sbState.bits = built.bits;
  sbState.n = built.n;
  sbState.superblockRank = built.superblockRank;
  sbState.blockRank = built.blockRank;
  sbState.blockBits = built.blockBits;

  sbRenderBitsRow();
  sbRenderStructure();
  sbRenderPopcountTable();
  sbRenderSpaceStats();

  var trace = document.getElementById('sbQueryTrace');
  if (trace) trace.innerHTML = '<div class="sb-empty">Run a query to see the O(1) computation trace.</div>';

  sbSetStatus('Structure built: ' + sbState.n + ' bits, ' + sbState.superblockRank.length + ' superblock(s), ' + sbState.blockBits.length + ' block(s). Try a rank or select query.', 'found');
}

function sbRunQuery() {
  var input = document.getElementById('sbQueryInput');
  var param = parseInt(input ? input.value : NaN);
  if (isNaN(param) || param < 0) { sbSetStatus('Enter a valid non-negative integer.', ''); return; }

  if (sbState.queryType === 'rank') {
    var naiveResult = sbNaiveRank(sbState.bits, param);
    var succinctResult = sbSuccinctRank(param);

    sbAddTrace(succinctResult.trace);
    sbRenderBitsRow(succinctResult.highlightRange);

    var naiveEl = document.getElementById('sbCompNaive');
    var succEl  = document.getElementById('sbCompSuccinct');
    if (naiveEl) naiveEl.textContent = naiveResult + ' (via ' + Math.min(param, sbState.n) + ' bit scans)';
    if (succEl)  succEl.textContent  = succinctResult.result + ' (via O(1) lookup)';

    var match = naiveResult === succinctResult.result;
    sbSetStatus('rank(' + param + ') = ' + succinctResult.result + '. Naive scan agrees: ' + (match ? '✅ yes' : '❌ mismatch'), match ? 'found' : '');
  } else {
    var succinctResult2 = sbSuccinctSelect(param);
    sbAddTrace(succinctResult2.trace);

    if (succinctResult2.result !== null) {
      sbRenderBitsRow(null, succinctResult2.result);
      sbSetStatus('select(' + param + ') = position ' + succinctResult2.result, 'found');
    } else {
      sbSetStatus('select(' + param + '): no such 1-bit exists (k out of range).', '');
    }

    var naiveEl2 = document.getElementById('sbCompNaive');
    var succEl2  = document.getElementById('sbCompSuccinct');
    if (naiveEl2) naiveEl2.textContent = 'linear scan until k-th 1 found';
    if (succEl2)  succEl2.textContent  = (succinctResult2.result !== null ? succinctResult2.result : '—') + ' (binary search + block scan)';
  }
}

function sbRandomize() {
  var bits = '';
  for (var i = 0; i < 16; i++) bits += Math.random() < 0.5 ? '0' : '1';
  var input = document.getElementById('sbBitsInput');
  if (input) input.value = bits;
  sbBuildAndRender();
}

function sbRunFmTeaser() {
  var input = document.getElementById('sbFmInput');
  var seq = (input ? input.value : '').toUpperCase().replace(/[^ACGT]/g, '');
  if (seq.length === 0) { return; }

  var withSentinel = seq + '$';
  var rotations = [];
  for (var i = 0; i < withSentinel.length; i++) {
    rotations.push(withSentinel.slice(i) + withSentinel.slice(0, i));
  }
  var sorted = rotations.slice().sort();
  var bwt = sorted.map(function(r) { return r[r.length - 1]; }).join('');

  var resultEl = document.getElementById('sbFmResult');
  if (resultEl) {
    resultEl.innerHTML =
      '<div class="sb-fm-result-row"><span class="sb-fm-label">Original:</span><span class="sb-fm-seq">' + seq + '</span></div>' +
      '<div class="sb-fm-result-row"><span class="sb-fm-label">With sentinel:</span><span class="sb-fm-seq">' + withSentinel + '</span></div>' +
      '<div class="sb-fm-result-row"><span class="sb-fm-label">BWT:</span><span class="sb-fm-seq sb-fm-highlight">' + bwt + '</span></div>' +
      '<p style="margin-top:0.5rem;font-size:0.78rem;color:var(--text-secondary);line-height:1.6">Rank queries on this BWT string (counting occurrences of each character up to a position) let the FM-index answer "does this substring exist, and how many times?" in O(m) steps for a pattern of length m — never scanning the original sequence, no matter how long it is.</p>';
  }
}

function sbInit() {
  sbBuildAndRender();

  var randomizeBtn = document.getElementById('sbRandomizeBtn');
  var buildBtn = document.getElementById('sbBuildBtn');
  if (randomizeBtn) randomizeBtn.addEventListener('click', sbRandomize);
  if (buildBtn) buildBtn.addEventListener('click', sbBuildAndRender);

  document.querySelectorAll('.sb-query-type').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.sb-query-type').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      sbState.queryType = btn.getAttribute('data-qtype');
    });
  });

  var runQueryBtn = document.getElementById('sbRunQueryBtn');
  if (runQueryBtn) runQueryBtn.addEventListener('click', sbRunQuery);

  var queryInput = document.getElementById('sbQueryInput');
  if (queryInput) queryInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') sbRunQuery(); });

  var fmRunBtn = document.getElementById('sbFmRunBtn');
  if (fmRunBtn) fmRunBtn.addEventListener('click', sbRunFmTeaser);

  sbRunFmTeaser();
}