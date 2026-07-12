document.addEventListener('DOMContentLoaded', function() {
  mkInit();
});

var MK_NS = 'http://www.w3.org/2000/svg';

var mkState = {
  n: 16,
  blocks: [],
  levels: [],
  currentProof: null,
  originalLeafData: null,
  tampered: false,
};

function mkHash(str) {
  var h1 = 0xdeadbeef ^ str.length;
  var h2 = 0x41c6ce57 ^ str.length;
  for (var i = 0; i < str.length; i++) {
    var ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  var combined = (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  return combined;
}

function mkGenerateBlocks(n) {
  var blocks = [];
  var words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa'];
  for (var i = 0; i < n; i++) blocks.push(words[i % words.length] + '-' + Math.floor(Math.random() * 1000));
  return blocks;
}

function mkBuildTree(blocks) {
  var levels = [];
  var currentLevel = blocks.map(function(b) { return mkHash(b); });
  levels.push(currentLevel);

  while (currentLevel.length > 1) {
    var nextLevel = [];
    for (var i = 0; i < currentLevel.length; i += 2) {
      var left = currentLevel[i];
      var right = i + 1 < currentLevel.length ? currentLevel[i + 1] : currentLevel[i];
      nextLevel.push(mkHash(left + right));
    }
    levels.push(nextLevel);
    currentLevel = nextLevel;
  }

  return levels;
}

function mkRecomputePath(leafIdx) {
  var levels = mkState.levels;
  levels[0][leafIdx] = mkHash(mkState.blocks[leafIdx]);

  var idx = leafIdx;
  var changedPath = [{ level: 0, idx: leafIdx }];

  for (var lvl = 0; lvl < levels.length - 1; lvl++) {
    var currentLevel = levels[lvl];
    var pairIdx = idx % 2 === 0 ? idx : idx - 1;
    var left = currentLevel[pairIdx];
    var right = pairIdx + 1 < currentLevel.length ? currentLevel[pairIdx + 1] : currentLevel[pairIdx];

    var parentIdx = Math.floor(idx / 2);
    levels[lvl + 1][parentIdx] = mkHash(left + right);
    changedPath.push({ level: lvl + 1, idx: parentIdx });
    idx = parentIdx;
  }

  return changedPath;
}

function mkGenerateProof(leafIdx) {
  var levels = mkState.levels;
  var proof = [];
  var idx = leafIdx;

  for (var lvl = 0; lvl < levels.length - 1; lvl++) {
    var currentLevel = levels[lvl];
    var isRightChild = idx % 2 === 1;
    var siblingIdx = isRightChild ? idx - 1 : idx + 1;
    var siblingHash = siblingIdx < currentLevel.length ? currentLevel[siblingIdx] : currentLevel[idx];

    proof.push({ level: lvl, siblingIdx: siblingIdx, hash: siblingHash, position: isRightChild ? 'left' : 'right' });
    idx = Math.floor(idx / 2);
  }

  return proof;
}

function mkVerifyProof(leafData, proof, expectedRoot) {
  var computed = mkHash(leafData);
  for (var i = 0; i < proof.length; i++) {
    var step = proof[i];
    computed = step.position === 'left' ? mkHash(step.hash + computed) : mkHash(computed + step.hash);
  }
  return { computedRoot: computed, matches: computed === expectedRoot };
}

function mkComputeLayout() {
  var levels = mkState.levels;
  var positions = [];
  var maxLevel = levels.length - 1;

  for (var lvl = 0; lvl <= maxLevel; lvl++) {
    var count = levels[lvl].length;
    var levelPositions = [];
    var colWidth = 700 / count;
    for (var i = 0; i < count; i++) {
      levelPositions.push({ x: colWidth * i + colWidth / 2, y: (maxLevel - lvl) * 70 + 30 });
    }
    positions.push(levelPositions);
  }

  return positions;
}

function mkRenderTree(highlightPath, proofSiblings) {
  var svg = document.getElementById('mkTreeSvg');
  if (!svg) return;

  var levels = mkState.levels;
  var positions = mkComputeLayout();
  var W = 720;
  var H = levels.length * 70 + 40;
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  svg.innerHTML = '';

  var highlightSet = {};
  (highlightPath || []).forEach(function(p) { highlightSet[p.level + '-' + p.idx] = true; });

  var proofSet = {};
  (proofSiblings || []).forEach(function(p) { proofSet[p.level + '-' + p.siblingIdx] = true; });

  for (let lvl = 0; lvl < levels.length - 1; lvl++) {
    var count = levels[lvl].length;
    for (let i = 0; i < count; i++) {
      var parentIdx = Math.floor(i / 2);
      var childPos = positions[lvl][i];
      var parentPos = positions[lvl + 1][parentIdx];
      var line = document.createElementNS(MK_NS, 'line');
      line.setAttribute('x1', childPos.x); line.setAttribute('y1', childPos.y - 12);
      line.setAttribute('x2', parentPos.x); line.setAttribute('y2', parentPos.y + 12);
      line.setAttribute('stroke', 'rgba(148,163,184,0.25)'); line.setAttribute('stroke-width', '1.3');
      svg.appendChild(line);
    }
  }

  for (let lvl = 0; lvl < levels.length; lvl++) {
    var levelHashes = levels[lvl];
    for (let i = 0; i < levelHashes.length; i++) {
      var pos = positions[lvl][i];
      var key = lvl + '-' + i;
      var isChanged = highlightSet[key];
      var isProofSibling = proofSet[key];
      var isRoot = lvl === levels.length - 1;
      var isLeaf = lvl === 0;

      var fillColor, strokeColor;
      if (isRoot) { fillColor = 'rgba(34,197,94,0.3)'; strokeColor = '#22c55e'; }
      else if (isChanged) { fillColor = 'rgba(245,158,11,0.3)'; strokeColor = '#f59e0b'; }
      else if (isProofSibling) { fillColor = 'rgba(168,85,247,0.3)'; strokeColor = '#a855f7'; }
      else { fillColor = 'rgba(6,182,212,0.15)'; strokeColor = '#06b6d4'; }

      var g = document.createElementNS(MK_NS, 'g');
      g.setAttribute('data-leaf', isLeaf ? i : '');
      if (isLeaf) g.style.cursor = 'pointer';

      var rect = document.createElementNS(MK_NS, 'rect');
      var w = isLeaf ? 44 : 40;
      rect.setAttribute('x', pos.x - w / 2); rect.setAttribute('y', pos.y - 12);
      rect.setAttribute('width', w); rect.setAttribute('height', 24); rect.setAttribute('rx', 5);
      rect.setAttribute('fill', fillColor); rect.setAttribute('stroke', strokeColor);
      rect.setAttribute('stroke-width', isRoot || isChanged ? '2.2' : '1.4');
      g.appendChild(rect);

      var label = document.createElementNS(MK_NS, 'text');
      label.setAttribute('x', pos.x); label.setAttribute('y', pos.y + 4);
      label.setAttribute('text-anchor', 'middle'); label.setAttribute('fill', strokeColor);
      label.setAttribute('font-family', 'Fira Code, monospace'); label.setAttribute('font-size', '8');
      label.textContent = levelHashes[i].slice(0, 6);
      g.appendChild(label);

      if (isLeaf) {
        var dataLabel = document.createElementNS(MK_NS, 'text');
        dataLabel.setAttribute('x', pos.x); dataLabel.setAttribute('y', pos.y + 22);
        dataLabel.setAttribute('text-anchor', 'middle'); dataLabel.setAttribute('fill', 'rgba(148,163,184,0.5)');
        dataLabel.setAttribute('font-size', '7');
        dataLabel.textContent = mkState.blocks[i].slice(0, 8);
        g.appendChild(dataLabel);

        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', 'Edit data for block #' + i);

        g.addEventListener('click', function() {
          mkEditLeaf(parseInt(this.getAttribute('data-leaf')));
        });
        g.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            mkEditLeaf(parseInt(this.getAttribute('data-leaf')));
          }
        });
      }

      if (isRoot) {
        var rootLabel = document.createElementNS(MK_NS, 'text');
        rootLabel.setAttribute('x', pos.x); rootLabel.setAttribute('y', pos.y - 18);
        rootLabel.setAttribute('text-anchor', 'middle'); rootLabel.setAttribute('fill', '#22c55e');
        rootLabel.setAttribute('font-size', '9'); rootLabel.setAttribute('font-weight', '700');
        rootLabel.textContent = 'ROOT';
        g.appendChild(rootLabel);
      }

      svg.appendChild(g);
    }
  }
}

function mkEditLeaf(leafIdx) {
  var newVal = prompt('Edit data for block #' + leafIdx + ':', mkState.blocks[leafIdx]);
  if (newVal === null || newVal === mkState.blocks[leafIdx]) return;

  mkState.blocks[leafIdx] = newVal;
  var changedPath = mkRecomputePath(leafIdx);

  mkRenderTree(changedPath, null);
  mkSetStatus('Block #' + leafIdx + ' changed → recomputed ' + changedPath.length + ' hashes up to the root (highlighted in amber).', '');

  mkResetTamperState();
}

function mkPopulateProofSelect() {
  var select = document.getElementById('mkProofLeafSelect');
  if (!select) return;
  select.innerHTML = mkState.blocks.map(function(b, i) { return '<option value="' + i + '">Block #' + i + ' — ' + b + '</option>'; }).join('');
}

function mkGenProofHandler() {
  var select = document.getElementById('mkProofLeafSelect');
  var leafIdx = parseInt(select.value);
  if (isNaN(leafIdx)) return;

  var proof = mkGenerateProof(leafIdx);
  mkState.currentProof = { leafIdx: leafIdx, proof: proof, leafData: mkState.blocks[leafIdx] };
  mkState.originalLeafData = mkState.blocks[leafIdx];
  mkState.tampered = false;

  mkRenderTree(null, proof);

  var resultEl = document.getElementById('mkProofResult');
  if (resultEl) {
    resultEl.innerHTML = proof.map(function(step, i) {
      return '<div class="mk-proof-entry">Level ' + step.level + ': sibling hash ' + step.hash.slice(0, 10) + '… (' + step.position + ' side)</div>';
    }).join('') + '<div class="mk-proof-entry root">Verifying root: ' + mkState.levels[mkState.levels.length - 1][0].slice(0, 12) + '…</div>';
  }

  mkUpdateByteComparison(proof.length);

  var tamperBtn = document.getElementById('mkTamperBtn');
  var verifyBtn = document.getElementById('mkVerifyBtn');
  if (tamperBtn) tamperBtn.disabled = false;
  if (verifyBtn) verifyBtn.disabled = false;

  var tamperResult = document.getElementById('mkTamperResult');
  if (tamperResult) tamperResult.classList.add('hidden');

  mkSetStatus('Proof generated for block #' + leafIdx + ' — ' + proof.length + ' sibling hashes (purple), highlighted on the tree.', '');
}

function mkUpdateByteComparison(proofLength) {
  var n = mkState.n;
  var avgBlockBytes = 20;
  var hashBytes = 16;

  var naiveBytes = n * avgBlockBytes;
  var proofBytes = proofLength * hashBytes;

  var naiveEl = document.getElementById('mkNaiveBytes');
  var proofEl = document.getElementById('mkProofBytes');
  var savingsEl = document.getElementById('mkSavings');

  if (naiveEl) naiveEl.textContent = naiveBytes + ' bytes (' + n + ' blocks)';
  if (proofEl) proofEl.textContent = proofBytes + ' bytes (' + proofLength + ' hashes)';
  if (savingsEl) {
    var pct = naiveBytes > 0 ? Math.round((1 - proofBytes / naiveBytes) * 100) : 0;
    savingsEl.textContent = pct + '% fewer bytes';
  }
}

function mkTamperHandler() {
  if (!mkState.currentProof) return;

  var leafIdx = mkState.currentProof.leafIdx;
  var fakeData = mkState.blocks[leafIdx] + '-TAMPERED';
  mkState.currentProof.leafData = fakeData;
  mkState.tampered = true;

  var resultEl = document.getElementById('mkTamperResult');
  if (resultEl) {
    resultEl.classList.remove('hidden');
    resultEl.className = 'mk-tamper-result';
    resultEl.textContent = 'Attacker silently changed block #' + leafIdx + '\'s claimed data to "' + fakeData + '" — without updating the tree. Click Verify Proof to see if this is caught.';
  }

  mkSetStatus('Attacker tampered with block #' + leafIdx + '. Click Verify Proof.', 'bad');
}

function mkVerifyHandler() {
  if (!mkState.currentProof) return;

  var expectedRoot = mkState.levels[mkState.levels.length - 1][0];
  var result = mkVerifyProof(mkState.currentProof.leafData, mkState.currentProof.proof, expectedRoot);

  var resultEl = document.getElementById('mkTamperResult');
  if (resultEl) {
    resultEl.classList.remove('hidden');

    if (mkState.tampered) {
      resultEl.className = 'mk-tamper-result ' + (result.matches ? 'undetected' : 'detected');
      resultEl.innerHTML = result.matches
        ? '❌ Tamper went undetected — this should never happen with correct hashing.'
        : '✅ <strong>Tamper detected!</strong> Recomputed root from the (tampered) leaf + proof: ' + result.computedRoot.slice(0, 12) + '…, but the tree\'s actual root is ' + expectedRoot.slice(0, 12) + '…. Mismatch → verification fails, exactly as it should.';
    } else {
      resultEl.className = 'mk-tamper-result ' + (result.matches ? 'detected' : 'undetected');
      resultEl.innerHTML = result.matches
        ? '✅ Proof verified successfully. Recomputed root ' + result.computedRoot.slice(0, 12) + '… matches the tree\'s actual root — using only ' + mkState.currentProof.proof.length + ' sibling hashes, no other block needed.'
        : '❌ Verification failed unexpectedly.';
    }
  }

  var asExpected = result.matches === !mkState.tampered;
  var statusMsg = mkState.tampered
    ? (result.matches ? 'Unexpected: tamper not detected.' : 'Tamper correctly detected via proof mismatch.')
    : (result.matches ? 'Proof verified successfully.' : 'Verification failed unexpectedly.');
  mkSetStatus(statusMsg, asExpected ? 'good' : 'bad');
}

function mkResetTamperState() {
  mkState.currentProof = null;
  mkState.tampered = false;
  var tamperBtn = document.getElementById('mkTamperBtn');
  var verifyBtn = document.getElementById('mkVerifyBtn');
  if (tamperBtn) tamperBtn.disabled = true;
  if (verifyBtn) verifyBtn.disabled = true;
  var tamperResult = document.getElementById('mkTamperResult');
  if (tamperResult) tamperResult.classList.add('hidden');
}

function mkSetStatus(msg, cls) {
  var el = document.getElementById('mkStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'mk-status ' + (cls || '');
}

function mkBuildAndRender() {
  mkState.blocks = mkGenerateBlocks(mkState.n);
  mkState.levels = mkBuildTree(mkState.blocks);
  mkRenderTree(null, null);
  mkPopulateProofSelect();
  mkResetTamperState();

  var proofResult = document.getElementById('mkProofResult');
  if (proofResult) proofResult.innerHTML = '<div class="mk-empty">Select a leaf and generate its proof.</div>';

  var naiveEl = document.getElementById('mkNaiveBytes');
  var proofEl = document.getElementById('mkProofBytes');
  var savingsEl = document.getElementById('mkSavings');
  if (naiveEl) naiveEl.textContent = '—';
  if (proofEl) proofEl.textContent = '—';
  if (savingsEl) savingsEl.textContent = '—';

  mkSetStatus('Tree built with ' + mkState.n + ' blocks. Click any leaf to edit it, or generate a Merkle proof from the panel.', '');
}

function mkInit() {
  mkBuildAndRender();

  document.querySelectorAll('.mk-n-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.mk-n-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      mkState.n = parseInt(btn.getAttribute('data-n'));
      mkBuildAndRender();
    });
  });

  var randomizeBtn = document.getElementById('mkRandomizeBtn');
  if (randomizeBtn) randomizeBtn.addEventListener('click', mkBuildAndRender);

  var genProofBtn = document.getElementById('mkGenProofBtn');
  if (genProofBtn) genProofBtn.addEventListener('click', mkGenProofHandler);

  var tamperBtn = document.getElementById('mkTamperBtn');
  var verifyBtn = document.getElementById('mkVerifyBtn');
  if (tamperBtn) tamperBtn.addEventListener('click', mkTamperHandler);
  if (verifyBtn) verifyBtn.addEventListener('click', mkVerifyHandler);

  window.addEventListener('resize', function() { mkRenderTree(null, null); });
}