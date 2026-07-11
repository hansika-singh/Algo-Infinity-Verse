(() => {
  // ===== State =====
  const state = {
    s: 'banana',
    steps: [], // round-by-round snapshots
    idx: 0,
    playing: false,
    timer: null,
    delay: 400,
    activeSuffixRow: -1,
    selectedRowIdx: -1,

    caseInsensitive: true,
    allowSpaces: true,
  };

  // ===== DOM =====
  const el = {
    textInput: document.getElementById('saTextInput'),
    methodSelect: document.getElementById('saMethodSelect'),
    speedRange: document.getElementById('saSpeedRange'),
    speedDisplay: document.getElementById('saSpeedDisplay'),
    roundSlider: document.getElementById('saRoundSlider'),

    kDisplay: document.getElementById('saKDisplay'),
    lenDisplay: document.getElementById('saLenDisplay'),

    playBtn: document.getElementById('saPlayBtn'),
    pauseBtn: document.getElementById('saPauseBtn'),
    stepBackBtn: document.getElementById('saStepBackBtn'),
    stepForwardBtn: document.getElementById('saStepForwardBtn'),
    resetBtn: document.getElementById('saResetBtn'),

    stepIndicator: document.getElementById('saStepIndicator'),
    phaseLabel: document.getElementById('saPhaseLabel'),
    explanation: document.getElementById('saExplanation'),
    status: document.getElementById('saStatus'),

    tableBody: document.getElementById('saRankTableBody'),
    finalOrder: document.getElementById('saFinalOrder'),

    timeComplexity: document.getElementById('saTimeComplexity'),
    spaceComplexity: document.getElementById('saSpaceComplexity'),

    caseInsensitiveToggle: document.getElementById('saCaseInsensitiveToggle'),
    allowSpacesToggle: document.getElementById('saAllowSpacesToggle'),
    modeHint: document.getElementById('saModeHint'),
    inputWarning: document.getElementById('saInputWarning'),

    // Drill-down panel elements
    selectedSuffixIndex: document.getElementById('saSelectedSuffixIndex'),
    firstHalfRank: document.getElementById('saFirstHalfRank'),
    secondHalfRank: document.getElementById('saSecondHalfRank'),
    combinedKey: document.getElementById('saCombinedKey'),
    adjacentComparison: document.getElementById('saAdjacentComparison'),
    drilldownReason: document.getElementById('saDrilldownReason'),

    exportJsonBtn: document.getElementById('saExportJsonBtn'),
    exportReportBtn: document.getElementById('saExportReportBtn'),
    shareBtn: document.getElementById('saShareBtn'),
    shareStatus: document.getElementById('saShareStatus'),

    compareBtn: document.getElementById('saCompareBtn'),
    compareIInput: document.getElementById('saCompareIInput'),
    compareJInput: document.getElementById('saCompareJInput'),
    compareWarning: document.getElementById('saCompareWarning'),
    compareResult: document.getElementById('saCompareResult'),
  };

  // ===== Helpers =====
  const safeStr = (x) => (typeof x === 'string' ? x : '');

  function normalizeInput(str) {
    const raw = safeStr(str);

    // Trim ends always (keeps behavior predictable across modes).
    let s = raw.trim();

    if (state.caseInsensitive) {
      s = s.toLowerCase();
    }

    if (!state.allowSpaces) {
      // Educational rule: if spaces aren't allowed, we remove ALL space characters.
      // That means "a b" becomes "ab".
      s = s.replace(/\s+/g, '');
    }

    return s;
  }

  function renderModeHint() {
    if (!el.modeHint) return;

    const caseText = state.caseInsensitive
      ? 'Using case-insensitive mode: “A” equals “a”.'
      : 'Using case-sensitive mode: “A” is different from “a”.';

    const spacesText = state.allowSpaces
      ? 'Spaces are allowed inside the string.'
      : 'Spaces are not allowed: they are removed before ranking.';

    el.modeHint.textContent = `${caseText} ${spacesText}`;
  }

  function validateAndWarn() {
    if (!el.inputWarning || !el.status) return;

    const raw = el.textInput ? el.textInput.value : '';
    const normalized = normalizeInput(raw);
    const n = normalized.length;

    const hardMax = 60;

    if (n === 0) {
      el.inputWarning.textContent = 'Warning: input is empty after applying the mode rules.';
      el.inputWarning.style.display = 'block';
      return;
    }

    // Use a gentle warning threshold for learning/performance.
    const warnings = [];
    if (n > hardMax) {
      warnings.push(`Input length ${n} exceeds ${hardMax} (animation may be slow).`);
    }

    if (n > 50) {
      warnings.push('Tip: shorter strings (n ≤ 50) make the learning loop smoother.');
    }

    el.inputWarning.textContent = warnings.length ? warnings.join(' ') : '';
    el.inputWarning.style.display = warnings.length ? 'block' : 'none';
  }

  function getCharCodeMap(s) {
    // Compress initial ranks by character.
    // Using UTF-16 code units ranking.
    const chars = s.split('');
    const unique = Array.from(new Set(chars)).sort();
    const map = new Map();
    unique.forEach((ch, i) => map.set(ch, i));
    return { map, chars };
  }

  function compareKeyTuple(keys, aIdx, bIdx) {
    const ka = keys[aIdx];
    const kb = keys[bIdx];

    if (ka[0] !== kb[0]) return ka[0] - kb[0];
    if (ka[1] !== kb[1]) return ka[1] - kb[1];

    // Deterministic tie-breaker to match previous behavior.
    return aIdx - bIdx;
  }

  function stableInsertionSortSim(keys, indices) {
    // Produces frames: compare + shift + place.
    // - indices is treated as the input order (stable base).
    // - we output ordering in ascending key order.
    const arr = indices.slice();
    const frames = [];

    // Insertion sort on arr.
    for (let i = 1; i < arr.length; i++) {
      const item = arr[i];
      let j = i - 1;

      // Compare item against elements to its left.
      while (j >= 0) {
        frames.push({
          type: 'Compare',
          left: arr[j],
          right: item,
          comparedKeys: [keys[arr[j]], keys[item]],
        });

        // If left <= item, we can stop (stable insertion point).
        const cmp = compareKeyTuple(keys, arr[j], item);
        if (cmp <= 0) break;

        // Shift arr[j] one step right.
        frames.push({
          type: 'Shift',
          fromPos: j,
          toPos: j + 1,
          movedIndex: arr[j],
        });

        arr[j + 1] = arr[j];
        j--;
      }

      // Place item at j+1
      const placePos = j + 1;
      frames.push({
        type: 'Place',
        pos: placePos,
        placedIndex: item,
      });
      arr[placePos] = item;
    }

    return { sorted: arr, frames };
  }

  function buildDoublingSteps(s) {
    const n = s.length;
    if (n === 0) return { steps: [], finalOrder: [] };
    if (n === 1) {
      return {
        steps: [
          {
            phase: 'Initialization',
            k: 0,
            len: 1,
            ordering: [0],
            ranks: [0],
            nextRanks: [0],
            keys: [[0, -1]],
            updated: [true],
            explanation: 'Single character string: suffix rank is already unique.',
          },
        ],
        finalOrder: [0],
      };
    }

    const { map, chars } = getCharCodeMap(s);
    let ranks = chars.map((ch) => map.get(ch));

    const steps = [];

    // Use stable insertion sort for initial ordering too (so we show compare/place).
    {
      const len = 1;
      const k = 0;
      const keys = Array.from({ length: n }, (_, i) => [ranks[i], -1]);
      const inputIndices = Array.from({ length: n }, (_, i) => i);
      const { sorted: ordering, frames } = stableInsertionSortSim(keys, inputIndices);

      // Initialization frames
      frames.forEach((f) => {
        steps.push({
          phase: 'Initialization (stable insert)',
          k,
          len,
          ordering: ordering.slice(), // show final ordering snapshot for context
          ranks: ranks.slice(),
          nextRanks: ranks.slice(),
          keys: ordering.map((idx) => keys[idx]),
          updated: ordering.map(() => false),
          explanation: buildComparePlaceExplanation(k, len, f, keys, s),
          anim: f,
        });
      });

      // Final initialization snapshot (rank table values)
      steps.push({
        phase: 'Initialization',
        k,
        len,
        ordering: ordering.slice(),
        ranks: ranks.slice(),
        nextRanks: ranks.slice(),
        keys: ordering.map((idx) => keys[idx]),
        updated: ordering.map(() => false),
        explanation:
          'Assign initial ranks based on characters. Ordering is sorted by first-character rank.',
      });
    }

    let k = 0;
    let len = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // key pair = (rank[i], rank[i+len])
      const keys = Array.from({ length: n }, (_, i) => {
        const r1 = ranks[i];
        const r2 = i + len < n ? ranks[i + len] : -1;
        return [r1, r2];
      });

      const inputIndices = Array.from({ length: n }, (_, i) => i);
      const { sorted: ordering, frames } = stableInsertionSortSim(keys, inputIndices);

      // compute new ranks after sorting by keys
      const nextRanks = new Array(n).fill(0);
      let curRank = 0;
      nextRanks[ordering[0]] = 0;

      for (let idx = 1; idx < n; idx++) {
        const prev = ordering[idx - 1];
        const curr = ordering[idx];
        const same = keys[prev][0] === keys[curr][0] && keys[prev][1] === keys[curr][1];
        if (!same) curRank++;
        nextRanks[curr] = curRank;
      }

      const updated = ordering.map((i) => nextRanks[i] !== ranks[i]);

      // Add frames for this round
      frames.forEach((f) => {
        steps.push({
          phase: `Round (doubling, k=${k})` + (f.type === 'Compare' ? '' : ''),
          k,
          len,
          ordering: ordering.slice(),
          ranks: ranks.slice(),
          nextRanks: nextRanks.slice(),
          keys: ordering.map((idx) => keys[idx]),
          updated,
          anim: f,
          explanation: buildComparePlaceExplanation(k, len, f, keys, s),
        });
      });

      // Round end snapshot (ranks update)
      steps.push({
        phase: 'Round (doubling)',
        k,
        len,
        ordering: ordering.slice(),
        ranks: ranks.slice(),
        nextRanks: nextRanks.slice(),
        keys: ordering.map((idx) => keys[idx]),
        updated,
        explanation: `Finished stable sorting by key (rank[i], rank[i+${len}]); then reassigned ranks (compressed from sorted unique keys).`,
      });

      ranks = nextRanks;

      const maxRank = Math.max(...ranks);
      if (maxRank === n - 1) break;

      k++;
      len *= 2;
      if (len > n) break;
    }

    // final ordering: rank-based sort (keep deterministic)
    const finalOrdering = Array.from({ length: n }, (_, i) => i).sort((a, b) => {
      if (ranks[a] !== ranks[b]) return ranks[a] - ranks[b];
      return a - b;
    });

    return { steps, finalOrder: finalOrdering };
  }

  function buildComparePlaceExplanation(k, len, frame, keys, s) {
    if (!frame || !frame.type) return '';

    if (frame.type === 'Compare') {
      const leftKey = frame.comparedKeys[0];
      const rightKey = frame.comparedKeys[1];
      const leftIdx = frame.left;
      const rightIdx = frame.right;
      return `Compared keys: ${formatKey(leftKey)} for suffix ${leftIdx} (${formatSuffixPreview(s, leftIdx)}) vs ${formatKey(rightKey)} for suffix ${rightIdx} (${formatSuffixPreview(s, rightIdx)}).`;
    }

    if (frame.type === 'Shift') {
      return `Shift: moving suffix index ${frame.movedIndex} one position to the right.`;
    }

    if (frame.type === 'Place') {
      return `Place: inserting suffix index ${frame.placedIndex} at position ${frame.pos}.`;
    }

    if (frame.type === 'RoundEnd') return 'Round finished.';

    return String(frame.type);
  }

  function formatKey(keyTuple) {
    if (!keyTuple) return '(—, —)';
    const a = keyTuple[0] ?? '-';
    const b = keyTuple[1] ?? '-';
    return `(${a}, ${b})`;
  }

  function formatSuffixPreview(s, idx) {
    return substringForSuffix(s, idx);
  }

  // Keep original helper used by drill-down.
  function substringForSuffix(s, i, maxLen = 18) {
    const sub = s.slice(i);
    if (sub.length <= maxLen) return sub;
    return sub.slice(0, maxLen) + '…';
  }

  function getRoundsSummary() {
    const summary = [];
    if (!state.steps || state.steps.length === 0) return summary;

    // Find initialization snapshot
    const initStep = state.steps.find((step) => step.phase === 'Initialization');
    if (initStep) {
      summary.push({
        roundName: 'Initialization',
        k: initStep.k,
        len: initStep.len,
        ordering: initStep.ordering.slice(),
        ranks: initStep.ranks.slice(),
      });
    }

    // Find all round end snapshots
    const roundEndSteps = state.steps.filter(
      (step) => step.phase.startsWith('Round (doubling)') && !step.anim
    );
    roundEndSteps.forEach((step, index) => {
      summary.push({
        roundName: `Round ${index + 1} (k=${step.k})`,
        k: step.k,
        len: step.len,
        ordering: step.ordering.slice(),
        ranks: step.nextRanks.slice(),
      });
    });

    return summary;
  }

  function downloadJson() {
    if (!state.s) return;
    const summary = getRoundsSummary();
    const exportData = {
      inputString: state.s,
      caseInsensitive: state.caseInsensitive,
      allowSpaces: state.allowSpaces,
      finalOrdering: state.finalOrder || [],
      rounds: summary,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suffix_array_${state.s.replace(/[^a-zA-Z0-9]/g, '_')}_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function generateHtmlReport() {
    if (!state.s) return;
    const summary = getRoundsSummary();
    const dateStr = new Date().toLocaleString();

    let roundsHtml = '';
    summary.forEach((round) => {
      let rowsHtml = '';
      round.ordering.forEach((suffixIndex, rowIdx) => {
        const suffixSub = state.s.slice(suffixIndex);
        const suffixSubDisplay = suffixSub.length > 20 ? suffixSub.slice(0, 20) + '…' : suffixSub;
        const rank = round.ranks[suffixIndex] ?? 0;

        let keyDisplay = '—';
        if (round.k > 0 || round.roundName !== 'Initialization') {
          const r1 = round.ranks[suffixIndex];
          const r2Idx = suffixIndex + round.len;
          const r2 = r2Idx < state.s.length ? round.ranks[r2Idx] : -1;
          keyDisplay = `(${r1}, ${r2})`;
        }

        rowsHtml += `
          <tr>
            <td>${rowIdx}</td>
            <td>${suffixIndex}</td>
            <td class="suffix">${suffixSubDisplay}</td>
            <td>${rank}</td>
            <td class="fira">${keyDisplay}</td>
          </tr>
        `;
      });

      roundsHtml += `
        <div class="card">
          <h3>${round.roundName} (len = ${round.len})</h3>
          <table>
            <thead>
              <tr>
                <th>Row</th>
                <th>Suffix Index</th>
                <th>Suffix Substring</th>
                <th>Rank</th>
                <th>Key Pair</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    });

    const finalOrderStr = state.finalOrder ? state.finalOrder.join(', ') : '—';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Suffix Array Visualization Report - ${state.s}</title>
  <style>
    body {
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #0a0a1a;
      color: #e2e8f0;
      line-height: 1.6;
      padding: 2.5rem;
      max-width: 900px;
      margin: 0 auto;
    }
    header {
      border-bottom: 2px solid #7c3aed;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    h1 {
      font-size: 2.5rem;
      color: #06b6d4;
      margin: 0 0 0.5rem 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .metadata {
      font-size: 0.9rem;
      color: #a0aec0;
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }
    .metadata span strong {
      color: #fff;
    }
    .card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .card h3 {
      margin-top: 0;
      color: #a78bfa;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 0.5rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }
    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    th {
      color: #06b6d4;
      font-weight: 600;
      font-size: 0.9rem;
      text-transform: uppercase;
    }
    td {
      font-size: 0.95rem;
    }
    .suffix {
      font-family: 'Fira Code', monospace;
      color: #e2e8f0;
      font-weight: 500;
    }
    .fira {
      font-family: 'Fira Code', monospace;
    }
    .final-badge {
      display: inline-block;
      background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%);
      color: white;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      font-family: 'Fira Code', monospace;
      font-size: 1.1rem;
      font-weight: bold;
      margin-top: 0.5rem;
      box-shadow: 0 4px 15px rgba(6, 182, 212, 0.25);
    }
    footer {
      text-align: center;
      margin-top: 4rem;
      font-size: 0.8rem;
      color: #718096;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 1.5rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>Suffix Array Report</h1>
    <div class="metadata">
      <span>String: <strong>"${state.s}"</strong></span>
      <span>Length: <strong>${state.s.length}</strong></span>
      <span>Case-Insensitive: <strong>${state.caseInsensitive}</strong></span>
      <span>Allow Spaces: <strong>${state.allowSpaces}</strong></span>
      <span>Generated: <strong>${dateStr}</strong></span>
    </div>
  </header>

  <div class="card">
    <h3>Final Suffix Array</h3>
    <div class="final-badge">${finalOrderStr}</div>
  </div>

  <h2>Construction Rounds Summary</h2>
  ${roundsHtml}

  <footer>
    Generated by Algo Infinity Verse Suffix Array Visualizer
  </footer>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suffix_array_${state.s.replace(/[^a-zA-Z0-9]/g, '_')}_report.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function getShareLink() {
    const sVal = el.textInput ? el.textInput.value : state.s;
    const ciVal = el.caseInsensitiveToggle
      ? el.caseInsensitiveToggle.checked
      : state.caseInsensitive;
    const asVal = el.allowSpacesToggle ? el.allowSpacesToggle.checked : state.allowSpaces;

    const url = new URL(window.location.href);
    url.searchParams.set('s', sVal);
    url.searchParams.set('ci', String(ciVal));
    url.searchParams.set('as', String(asVal));
    return url.toString();
  }

  function copyShareLink() {
    const link = getShareLink();
    navigator.clipboard.writeText(link).then(() => {
      if (el.shareStatus) {
        el.shareStatus.classList.remove('hidden');
        setTimeout(() => {
          el.shareStatus.classList.add('hidden');
        }, 2000);
      }
    });
  }

  function setButtons() {
    clearCompareHighlights();

    const total = state.steps.length;
    const atStart = state.idx <= 0;
    const atEnd = total === 0 || state.idx >= total - 1;

    el.stepBackBtn.disabled = total === 0 || atStart;
    el.stepForwardBtn.disabled = total === 0 || atEnd;

    el.pauseBtn.disabled = !state.playing;
  }

  function updateDrillDownPanel() {
    const step = state.steps[state.idx];
    if (!step || !el.selectedSuffixIndex) return;

    const totalRows = step.ordering ? step.ordering.length : 0;
    if (state.selectedRowIdx < 0 || state.selectedRowIdx >= totalRows) {
      el.selectedSuffixIndex.textContent = '—';
      el.firstHalfRank.textContent = '—';
      el.secondHalfRank.textContent = '—';
      el.combinedKey.textContent = '—';
      el.adjacentComparison.textContent = '—';
      el.drilldownReason.textContent = 'Select a row in the table to see reasoning.';
      return;
    }

    const suffixIndex = step.ordering[state.selectedRowIdx];
    const len = step.len;
    const n = state.s.length;

    const firstHalfRank = step.ranks ? step.ranks[suffixIndex] : undefined;
    const secondHalfIndex = suffixIndex + len;
    const secondHalfRank = secondHalfIndex < n && step.ranks ? step.ranks[secondHalfIndex] : -1;

    const combinedKey = `(${firstHalfRank ?? '-'}, ${secondHalfRank})`;

    // Adjacent suffix reasoning: compare against previous row in sorted order.

    const prevRowIdx = state.selectedRowIdx - 1;

    let adjacentText = '—';
    let reasonText = '';

    if (prevRowIdx >= 0) {
      const prevSuffixIndex = step.ordering[prevRowIdx];
      const prevFirstHalfRank = step.ranks ? step.ranks[prevSuffixIndex] : undefined;
      const prevSecondHalfIndex = prevSuffixIndex + len;
      const prevSecondHalfRank =
        prevSecondHalfIndex < n && step.ranks ? step.ranks[prevSecondHalfIndex] : -1;

      const thisKey = [firstHalfRank, secondHalfRank];
      const prevKey = [prevFirstHalfRank, prevSecondHalfRank];

      const same0 = thisKey[0] === prevKey[0];
      const same1 = thisKey[1] === prevKey[1];

      if (same0 && same1) {
        adjacentText = `Adjacent previous suffix key is equal (${combinedKey}).`;
        reasonText =
          'Keys are equal, so ranks tie. The ordering falls back to suffix index tie-breaker in sorting.';
      } else {
        // Lexicographic compare for the doubling key.
        // Higher key means it should appear after in ascending sort; we can describe relative.
        let cmp = 0;
        if ((thisKey[0] ?? -1) !== (prevKey[0] ?? -1)) {
          cmp = (thisKey[0] ?? -1) - (prevKey[0] ?? -1);
        } else {
          cmp = (thisKey[1] ?? -1) - (prevKey[1] ?? -1);
        }

        const rel = cmp > 0 ? 'greater than' : 'less than';
        const diffPart = !same0 ? 'first half rank' : 'second half rank';
        adjacentText = `Compared to previous suffix (row ${prevRowIdx}): key is ${rel} the adjacent key.`;
        reasonText = `Lexicographic compare of (rank[i], rank[i+len]) differs at ${diffPart}.`;
      }

      el.adjacentComparison.textContent = `${adjacentText}`;
      el.drilldownReason.textContent = reasonText;

      const prevSuffixPreview = substringForSuffix(state.s, step.ordering[prevRowIdx]);
      if (prevSuffixPreview) {
        // keep reasonText concise but informative
        // (No-op for now; panel already has main explanation.)
      }
    } else {
      el.adjacentComparison.textContent = 'No previous adjacent suffix in this sorted order.';
      el.drilldownReason.textContent =
        'This suffix is the first row of the current sorted ordering.';
    }

    el.selectedSuffixIndex.textContent = String(suffixIndex);
    el.firstHalfRank.textContent = String(firstHalfRank ?? '-');
    el.secondHalfRank.textContent = String(secondHalfRank);
    el.combinedKey.textContent = combinedKey;
    // Keep len/k mention implicit in the combined key.
  }

  function getRoundKey(step, idx, len) {
    if (!step || !step.ranks) return [null, null];
    const r1 = step.ranks[idx];
    const r2Idx = idx + len;
    const r2 = r2Idx < step.ranks.length ? step.ranks[r2Idx] : -1;
    return [r1, r2];
  }

  function compareKeyPairs(pairA, pairB) {
    if (pairA[0] !== pairB[0]) return pairA[0] - pairB[0];
    if (pairA[1] !== pairB[1]) return pairA[1] - pairB[1];
    return 0;
  }

  function findRowIdxForSuffix(step, suffixIndex) {
    if (!step || !step.ordering) return -1;
    return step.ordering.indexOf(suffixIndex);
  }

  function clearCompareHighlights() {
    if (!el.tableBody) return;
    el.tableBody.querySelectorAll('.sa-compare-i-row, .sa-compare-j-row').forEach((node) => {
      node.classList.remove('sa-compare-i-row');
      node.classList.remove('sa-compare-j-row');
    });
  }

  function setCompareRowHighlight(step, i, j) {
    clearCompareHighlights();
    if (!step || !step.ordering) return;
    const iRowIdx = findRowIdxForSuffix(step, i);
    const jRowIdx = findRowIdxForSuffix(step, j);

    if (iRowIdx < 0 || jRowIdx < 0) return;

    const children = Array.from(el.tableBody.children);
    if (children[iRowIdx]) children[iRowIdx].classList.add('sa-compare-i-row');
    if (children[jRowIdx]) children[jRowIdx].classList.add('sa-compare-j-row');
  }

  function computeAndDisplayComparison(step, i, j) {
    const n = state.s.length;
    if (!step || !step.ranks) {
      if (el.compareWarning) el.compareWarning.style.display = 'block';
      if (el.compareResult) el.compareResult.textContent = 'No data for comparison yet.';
      return;
    }

    if (!Number.isInteger(i) || !Number.isInteger(j)) {
      if (el.compareWarning) {
        el.compareWarning.textContent = 'Indices must be integers.';
        el.compareWarning.style.display = 'block';
      }
      if (el.compareResult) el.compareResult.textContent = '';
      return;
    }

    if (i < 0 || i >= n || j < 0 || j >= n) {
      if (el.compareWarning) {
        el.compareWarning.textContent = `Indices must be in range [0, ${n - 1}].`;
        el.compareWarning.style.display = 'block';
      }
      if (el.compareResult) el.compareResult.textContent = '';
      return;
    }

    if (el.compareWarning) el.compareWarning.style.display = 'none';

    const len = step.len;
    const keyI = getRoundKey(step, i, len);
    const keyJ = getRoundKey(step, j, len);

    const cmp = compareKeyPairs(keyI, keyJ);
    const relation = cmp === 0 ? 'equal to' : cmp < 0 ? 'less than' : 'greater than';
    const chosenEarlier =
      cmp === 0
        ? 'Tie (same key). Ordering falls back to suffix index tie-break.'
        : cmp < 0
          ? `key(i) < key(j), so suffix i is chosen earlier.`
          : `key(j) < key(i), so suffix j is chosen earlier.`;

    const previewI = substringForSuffix(state.s, i);
    const previewJ = substringForSuffix(state.s, j);

    if (el.compareResult) {
      el.compareResult.innerHTML = `
        <div><b>Current round key length</b>: len = <span class="fira">${len}</span> (2^k)</div>
        <div><b>key(i)</b> = (${keyI[0] ?? '-'}, ${keyI[1] ?? '-'}) for suffix ${i} ("${previewI}")</div>
        <div><b>key(j)</b> = (${keyJ[0] ?? '-'}, ${keyJ[1] ?? '-'}) for suffix ${j} ("${previewJ}")</div>
        <div><b>Comparison</b>: key(i) is <b>${relation}</b> key(j). ${chosenEarlier}</div>
      `;
    }

    // Highlight rows in the table simultaneously.
    setCompareRowHighlight(step, i, j);
  }

  function renderRound() {
    const total = state.steps.length;
    if (!total) {
      el.stepIndicator.textContent = `Round: 0 / 0`;
      el.phaseLabel.textContent = '—';
      el.explanation.textContent = 'Enter a string, then step through rounds.';
      el.tableBody.innerHTML = '';
      el.finalOrder.textContent = '—';
      if (el.roundSlider) {
        el.roundSlider.max = '0';
        el.roundSlider.value = '0';
      }
      if (el.kDisplay) el.kDisplay.textContent = '—';
      if (el.lenDisplay) el.lenDisplay.textContent = '—';
      setButtons();
      return;
    }

    const step = state.steps[state.idx];

    // If nothing is selected yet, default to the first sorted row.
    if (state.selectedRowIdx < 0 && step && step.ordering && step.ordering.length > 0) {
      state.selectedRowIdx = 0;
    }

    el.stepIndicator.textContent = `Round: ${state.idx} / ${total - 1}`;
    el.phaseLabel.textContent = step.phase;
    el.explanation.textContent = step.explanation || '';

    // Update round slider + k/len
    if (el.roundSlider) {
      el.roundSlider.max = String(total - 1);
      el.roundSlider.value = String(state.idx);
    }
    if (el.kDisplay) el.kDisplay.textContent = step.k;
    if (el.lenDisplay) el.lenDisplay.textContent = step.len;

    // Table
    el.tableBody.innerHTML = '';

    // step.ordering is the sorted indices for this state
    step.ordering.forEach((suffixIndex, rowIdx) => {
      const tr = document.createElement('div');
      tr.className = 'sa-row';
      tr.setAttribute('role', 'row');

      const isActive = rowIdx === state.activeSuffixRow;
      const isUpdated = step.updated && step.updated[rowIdx];

      if (isActive) tr.classList.add('sa-active-row');
      if (isUpdated) tr.classList.add('sa-updated-row');

      const suffixText = substringForSuffix(state.s, suffixIndex);
      const rankVal =
        step.nextRanks && step.nextRanks[suffixIndex] != null
          ? step.nextRanks[suffixIndex]
          : step.ranks
            ? step.ranks[suffixIndex]
            : 0;

      const keyPair = step.keys && step.keys[rowIdx] ? step.keys[rowIdx] : [null, null];

      // next rank reference: show the second component's rank reference
      const nextRankRef = keyPair && keyPair.length === 2 ? keyPair[1] : -1;

      const suffixCell = document.createElement('div');
      suffixCell.className = 'sa-cell suffix-cell';
      suffixCell.setAttribute('role', 'cell');
      suffixCell.title = `Suffix start at index ${suffixIndex}`;
      suffixCell.textContent = `${suffixIndex} → "${suffixText}"`;

      const rankCell = document.createElement('div');
      rankCell.className = 'sa-cell';
      rankCell.setAttribute('role', 'cell');
      rankCell.textContent = String(rankVal);

      const keyCell = document.createElement('div');
      keyCell.className = 'sa-cell';
      keyCell.setAttribute('role', 'cell');
      keyCell.textContent = `(${keyPair[0] ?? '-'}, ${nextRankRef ?? '-'})`;

      const nextRankCell = document.createElement('div');
      nextRankCell.className = 'sa-cell';
      nextRankCell.setAttribute('role', 'cell');
      nextRankCell.textContent = nextRankRef === -1 ? '∅ (-1)' : String(nextRankRef);

      tr.append(suffixCell, rankCell, keyCell, nextRankCell);

      tr.addEventListener('click', () => {
        state.selectedRowIdx = rowIdx;
        state.activeSuffixRow = rowIdx;
        updateDrillDownPanel();
        renderRound();
      });

      el.tableBody.appendChild(tr);
    });

    // Keep drill-down panel synced with current selected row for this round.
    if (state.selectedRowIdx < 0 && step.ordering && step.ordering.length > 0) {
      state.selectedRowIdx = 0;
    }
    updateDrillDownPanel();

    const isFinalRound = state.idx === total - 1;
    el.finalOrder.textContent =
      isFinalRound && state.finalOrder ? state.finalOrder.join(', ') : '—';

    setButtons();
  }

  function computeFinalOrderIfMissing() {
    if (!state.finalOrder) {
      const last = state.steps[state.steps.length - 1];
      if (last && last.ordering) state.finalOrder = last.ordering.slice();
      else state.finalOrder = [];
    }
  }

  function stopPlay() {
    state.playing = false;
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = null;
    }
    el.playBtn.disabled = false;
    el.pauseBtn.disabled = true;
    setButtons();
  }

  function play() {
    if (state.playing) return;
    const total = state.steps.length;
    if (!total) return;

    state.playing = true;
    el.pauseBtn.disabled = false;
    el.playBtn.disabled = true;

    const tick = () => {
      if (!state.playing) return;
      if (state.idx >= total - 1) {
        stopPlay();
        return;
      }
      state.idx += 1;
      state.activeSuffixRow = 0;
      renderRound();
      state.timer = setTimeout(tick, state.delay);
    };

    tick();
  }

  function stepForward() {
    const total = state.steps.length;
    if (!total) return;
    if (state.idx >= total - 1) return;
    stopPlay();
    state.idx += 1;
    state.activeSuffixRow = 0;
    computeFinalOrderIfMissing();
    renderRound();
  }

  function stepBack() {
    const total = state.steps.length;
    if (!total) return;
    if (state.idx <= 0) return;
    stopPlay();
    state.idx -= 1;
    state.activeSuffixRow = 0;
    renderRound();
  }

  function generateAndReset() {
    stopPlay();

    const s = normalizeInput(el.textInput ? el.textInput.value : '');
    state.s = s;

    const { steps, finalOrder } = buildDoublingSteps(s);
    state.steps = steps;
    state.idx = 0;
    state.activeSuffixRow = 0;
    state.finalOrder = finalOrder;

    // Update slider
    if (el.roundSlider) {
      el.roundSlider.max = String(Math.max(0, state.steps.length - 1));
      el.roundSlider.value = '0';
    }

    el.status.textContent = s.length
      ? 'Ready. Step through rounds to watch rank changes.'
      : 'Enter a non-empty string to generate suffix array rounds.';

    validateAndWarn();
    renderModeHint();
    renderRound();
  }

  // ===== Init =====
  function init() {
    // Parse URL query parameters for sharing
    const params = new URLSearchParams(window.location.search);
    const paramS = params.get('s');
    const paramCI = params.get('ci');
    const paramAS = params.get('as');

    if (paramS !== null && el.textInput) {
      el.textInput.value = paramS;
    }
    if (paramCI !== null && el.caseInsensitiveToggle) {
      el.caseInsensitiveToggle.checked = paramCI === 'true';
    }
    if (paramAS !== null && el.allowSpacesToggle) {
      el.allowSpacesToggle.checked = paramAS === 'true';
    }

    // Set complexity text from spec/education
    if (el.timeComplexity) el.timeComplexity.textContent = 'O(n log² n)';
    if (el.spaceComplexity) el.spaceComplexity.textContent = 'O(n)';

    // Speed
    if (el.speedRange) {
      state.delay = Number(el.speedRange.value || 400);
      if (el.speedDisplay) el.speedDisplay.textContent = `${state.delay}ms`;
      el.speedRange.addEventListener('input', (e) => {
        state.delay = Number(e.target.value);
        if (el.speedDisplay) el.speedDisplay.textContent = `${state.delay}ms`;
        if (state.playing) {
          stopPlay();
          play();
        }
      });
    }

    // Round slider
    if (el.roundSlider) {
      el.roundSlider.addEventListener('input', (e) => {
        stopPlay();
        state.idx = Number(e.target.value);
        state.activeSuffixRow = 0;
        renderRound();
      });
    }

    // Buttons
    if (el.playBtn) el.playBtn.addEventListener('click', () => play());
    if (el.pauseBtn) el.pauseBtn.addEventListener('click', () => stopPlay());
    if (el.stepForwardBtn) el.stepForwardBtn.addEventListener('click', () => stepForward());
    if (el.stepBackBtn) el.stepBackBtn.addEventListener('click', () => stepBack());
    if (el.resetBtn) el.resetBtn.addEventListener('click', () => generateAndReset());

    if (el.exportJsonBtn) el.exportJsonBtn.addEventListener('click', () => downloadJson());
    if (el.exportReportBtn)
      el.exportReportBtn.addEventListener('click', () => generateHtmlReport());
    if (el.shareBtn) el.shareBtn.addEventListener('click', () => copyShareLink());

    if (el.compareBtn) {
      el.compareBtn.addEventListener('click', () => {
        if (el.compareIInput && el.compareJInput) {
          const i = parseInt(el.compareIInput.value, 10);
          const j = parseInt(el.compareJInput.value, 10);
          const step = state.steps[state.idx];
          computeAndDisplayComparison(step, i, j);
        }
      });
    }

    // Toggles
    const applyTogglesFromUI = () => {
      if (el.caseInsensitiveToggle) state.caseInsensitive = !!el.caseInsensitiveToggle.checked;
      if (el.allowSpacesToggle) state.allowSpaces = !!el.allowSpacesToggle.checked;
      // Also re-render hints/warnings live, even before Generate/Reset.
      validateAndWarn();
      renderModeHint();
    };

    if (el.caseInsensitiveToggle) {
      el.caseInsensitiveToggle.addEventListener('change', () => {
        applyTogglesFromUI();
        generateAndReset();
      });
    }

    if (el.allowSpacesToggle) {
      el.allowSpacesToggle.addEventListener('change', () => {
        applyTogglesFromUI();
        generateAndReset();
      });
    }

    // Input validation (real-time)
    if (el.textInput) {
      el.textInput.addEventListener('input', () => {
        validateAndWarn();
        renderModeHint();
      });

      // Input: press Enter generates
      el.textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') generateAndReset();
      });
    }

    // Sync initial toggle states
    applyTogglesFromUI();

    // Initial render
    generateAndReset();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
