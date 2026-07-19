/**
 * Approach Tradeoff Matrix
 * Compare brute / better / optimal approaches; persist via localStorage.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'aivApproachTradeoffMatrix';
  const APPROACHES = [
    { id: 'brute', label: 'Brute force', hint: 'Correct but costly' },
    { id: 'better', label: 'Better', hint: 'Improved / intermediate' },
    { id: 'optimal', label: 'Optimal', hint: 'Best complexity / interview' },
  ];

  /** Seeded defaults for common problems (editable after load). */
  const PRESETS = {
    1: { // Two Sum
      rows: {
        brute: { time: 'O(n²)', space: 'O(1)', codeLength: 'Short', wow: 2, notes: 'Nested loops' },
        better: { time: 'O(n log n)', space: 'O(n)', codeLength: 'Medium', wow: 3, notes: 'Sort + two pointers (variant)' },
        optimal: { time: 'O(n)', space: 'O(n)', codeLength: 'Short', wow: 5, notes: 'Hash map one-pass' },
      },
    },
    4: { // Maximum Subarray
      rows: {
        brute: { time: 'O(n²) / O(n³)', space: 'O(1)', codeLength: 'Short', wow: 2, notes: 'All subarrays' },
        better: { time: 'O(n log n)', space: 'O(log n)', codeLength: 'Long', wow: 4, notes: 'Divide & conquer' },
        optimal: { time: 'O(n)', space: 'O(1)', codeLength: 'Short', wow: 5, notes: "Kadane's algorithm" },
      },
    },
    7: { // LIS
      rows: {
        brute: { time: 'O(2ⁿ)', space: 'O(n)', codeLength: 'Medium', wow: 1, notes: 'All subsequences' },
        better: { time: 'O(n²)', space: 'O(n)', codeLength: 'Medium', wow: 3, notes: 'Classic DP' },
        optimal: { time: 'O(n log n)', space: 'O(n)', codeLength: 'Medium', wow: 5, notes: 'Patience / binary search' },
      },
    },
    9: { // Trapping Rain Water
      rows: {
        brute: { time: 'O(n²)', space: 'O(1)', codeLength: 'Medium', wow: 2, notes: 'Per index scan bounds' },
        better: { time: 'O(n)', space: 'O(n)', codeLength: 'Medium', wow: 4, notes: 'Prefix max arrays' },
        optimal: { time: 'O(n)', space: 'O(1)', codeLength: 'Medium', wow: 5, notes: 'Two pointers' },
      },
    },
    13: { // Number of Islands
      rows: {
        brute: { time: 'O(m·n)', space: 'O(m·n)', codeLength: 'Medium', wow: 3, notes: 'DFS flood fill + visited' },
        better: { time: 'O(m·n)', space: 'O(m·n)', codeLength: 'Medium', wow: 4, notes: 'BFS queue flood fill' },
        optimal: { time: 'O(m·n)', space: 'O(1)*', codeLength: 'Medium', wow: 5, notes: 'Mutate grid in-place / Union-Find' },
      },
    },
    26: { // Longest Substring Without Repeating
      rows: {
        brute: { time: 'O(n³)', space: 'O(k)', codeLength: 'Short', wow: 1, notes: 'All substrings + set check' },
        better: { time: 'O(n²)', space: 'O(k)', codeLength: 'Short', wow: 3, notes: 'Expand from each start' },
        optimal: { time: 'O(n)', space: 'O(k)', codeLength: 'Short', wow: 5, notes: 'Sliding window + last index map' },
      },
    },
    36: { // Coin Change
      rows: {
        brute: { time: 'O(Sⁿ)', space: 'O(n)', codeLength: 'Short', wow: 1, notes: 'Pure recursion' },
        better: { time: 'O(n·amount)', space: 'O(n·amount)', codeLength: 'Medium', wow: 3, notes: 'Top-down memo' },
        optimal: { time: 'O(n·amount)', space: 'O(amount)', codeLength: 'Medium', wow: 5, notes: 'Bottom-up DP' },
      },
    },
  };

  const EMPTY_ROW = { time: '', space: '', codeLength: '', wow: 3, notes: '' };

  let problems = [];
  let selectedId = null;
  let matrixState = null;

  function $(id) {
    return document.getElementById(id);
  }

  function emptyRows() {
    return {
      brute: { ...EMPTY_ROW },
      better: { ...EMPTY_ROW },
      optimal: { ...EMPTY_ROW },
    };
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { comparisons: {} };
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object'
        ? { comparisons: parsed.comparisons || {} }
        : { comparisons: {} };
    } catch {
      return { comparisons: {} };
    }
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function buildProblemCatalog() {
    const fromData = Array.isArray(window.practiceProblems) ? window.practiceProblems : [];
    if (fromData.length) {
      problems = fromData.map((p) => ({
        id: p.id,
        title: p.title,
        difficulty: (p.difficulty || 'medium').toLowerCase(),
        tags: p.tags || [],
        description: p.description || '',
      }));
      return;
    }
    problems = [
      { id: 1, title: 'Two Sum', difficulty: 'easy', tags: ['Arrays'], description: 'Find two numbers that add up to target.' },
      { id: 4, title: 'Maximum Subarray', difficulty: 'medium', tags: ['Arrays'], description: 'Largest contiguous subarray sum.' },
      { id: 7, title: 'Longest Increasing Subsequence', difficulty: 'hard', tags: ['DP'], description: 'Length of LIS.' },
    ];
  }

  function defaultMatrixFor(problemId) {
    const preset = PRESETS[problemId];
    return {
      problemId,
      updatedAt: Date.now(),
      overallNotes: '',
      rows: preset
        ? {
            brute: { ...EMPTY_ROW, ...preset.rows.brute },
            better: { ...EMPTY_ROW, ...preset.rows.better },
            optimal: { ...EMPTY_ROW, ...preset.rows.optimal },
          }
        : emptyRows(),
    };
  }

  function getProblem(id) {
    return problems.find((p) => String(p.id) === String(id));
  }

  function filteredProblems() {
    const q = ($('atmSearch').value || '').toLowerCase().trim();
    const diff = $('atmDifficulty').value;
    return problems.filter((p) => {
      const matchDiff = diff === 'all' || p.difficulty === diff;
      const hay = `${p.title} ${(p.tags || []).join(' ')}`.toLowerCase();
      const matchQ = !q || hay.includes(q);
      return matchDiff && matchQ;
    });
  }

  function renderProblemList() {
    const list = $('atmProblemList');
    const items = filteredProblems();
    if (!items.length) {
      list.innerHTML = '<p class="atm-hint">No problems match your filters.</p>';
      return;
    }
    list.innerHTML = items
      .map((p) => {
        const active = String(p.id) === String(selectedId) ? ' active' : '';
        return `<button type="button" class="atm-problem-btn${active}" role="option" aria-selected="${active ? 'true' : 'false'}" data-id="${p.id}">
          <strong>${escapeHtml(p.title)}</strong>
          <span class="atm-problem-meta-line">
            <span class="atm-diff ${p.difficulty}">${p.difficulty}</span>
            ${(p.tags || []).slice(0, 3).map(escapeHtml).join(' · ')}
          </span>
        </button>`;
      })
      .join('');

    list.querySelectorAll('.atm-problem-btn').forEach((btn) => {
      btn.addEventListener('click', () => selectProblem(btn.dataset.id));
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function selectProblem(id, fromSaved) {
    selectedId = id;
    const store = loadStore();
    if (fromSaved && store.comparisons[id]) {
      matrixState = structuredClone
        ? structuredClone(store.comparisons[id])
        : JSON.parse(JSON.stringify(store.comparisons[id]));
    } else if (store.comparisons[id]) {
      matrixState = structuredClone
        ? structuredClone(store.comparisons[id])
        : JSON.parse(JSON.stringify(store.comparisons[id]));
    } else {
      matrixState = defaultMatrixFor(id);
    }
    renderProblemList();
    renderMatrix();
  }

  function renderMatrix() {
    const problem = getProblem(selectedId);
    if (!problem || !matrixState) {
      $('atmEmptyState').hidden = false;
      $('atmMatrixWrap').hidden = true;
      $('atmSaveBtn').disabled = true;
      $('atmResetBtn').disabled = true;
      return;
    }

    $('atmEmptyState').hidden = true;
    $('atmMatrixWrap').hidden = false;
    $('atmSaveBtn').disabled = false;
    $('atmResetBtn').disabled = false;

    $('atmProblemMeta').innerHTML = `
      <h3>${escapeHtml(problem.title)}</h3>
      <p>
        <span class="atm-diff ${problem.difficulty}">${problem.difficulty}</span>
        ${(problem.tags || []).map(escapeHtml).join(' · ')}
      </p>
      <p style="margin-top:0.45rem">${escapeHtml(problem.description || '')}</p>
    `;

    const tbody = $('atmTableBody');
    tbody.innerHTML = APPROACHES.map((a) => {
      const row = matrixState.rows[a.id] || { ...EMPTY_ROW };
      return `<tr data-approach="${a.id}">
        <th scope="row">
          <div class="atm-approach">
            <span class="atm-approach-name ${a.id}">${a.label}</span>
            <span class="atm-approach-sub">${a.hint}</span>
          </div>
        </th>
        <td><input class="atm-cell-input" data-field="time" value="${escapeAttr(row.time)}" aria-label="${a.label} time complexity" placeholder="O(n)" /></td>
        <td><input class="atm-cell-input" data-field="space" value="${escapeAttr(row.space)}" aria-label="${a.label} space complexity" placeholder="O(1)" /></td>
        <td><input class="atm-cell-input" data-field="codeLength" value="${escapeAttr(row.codeLength)}" aria-label="${a.label} code length" placeholder="Short / Medium / Long" /></td>
        <td>
          <div class="atm-wow">
            <input type="range" min="1" max="5" step="1" data-field="wow" value="${Number(row.wow) || 3}" aria-label="${a.label} interview wow factor" />
            <output data-wow-out>${Number(row.wow) || 3}/5</output>
          </div>
        </td>
        <td><input class="atm-cell-input" data-field="notes" value="${escapeAttr(row.notes)}" aria-label="${a.label} notes" placeholder="Key idea…" /></td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('tr').forEach((tr) => {
      const approach = tr.dataset.approach;
      tr.querySelectorAll('[data-field]').forEach((input) => {
        const sync = () => {
          const field = input.dataset.field;
          let val = input.value;
          if (field === 'wow') {
            val = Number(input.value);
            const out = tr.querySelector('[data-wow-out]');
            if (out) out.textContent = `${val}/5`;
          }
          matrixState.rows[approach][field] = val;
        };
        input.addEventListener('input', sync);
        input.addEventListener('change', sync);
      });
    });

    $('atmOverallNotes').value = matrixState.overallNotes || '';
  }

  function escapeAttr(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function readOverallNotes() {
    if (matrixState) {
      matrixState.overallNotes = $('atmOverallNotes').value;
    }
  }

  function saveCurrent() {
    if (!selectedId || !matrixState) return;
    readOverallNotes();
    matrixState.updatedAt = Date.now();
    matrixState.problemId = selectedId;
    const store = loadStore();
    store.comparisons[selectedId] = matrixState;
    saveStore(store);
    renderSavedList();
    flashStatus('Comparison saved to localStorage');
  }

  function resetDefaults() {
    if (!selectedId) return;
    matrixState = defaultMatrixFor(selectedId);
    renderMatrix();
    flashStatus('Rows reset to seeded defaults (not saved yet)');
  }

  function renderSavedList() {
    const store = loadStore();
    const ids = Object.keys(store.comparisons);
    const list = $('atmSavedList');
    const empty = $('atmSavedEmpty');
    $('atmClearAllBtn').disabled = ids.length === 0;

    if (!ids.length) {
      list.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    list.innerHTML = ids
      .map((id) => {
        const p = getProblem(id);
        const title = p ? p.title : `Problem #${id}`;
        const when = store.comparisons[id].updatedAt
          ? new Date(store.comparisons[id].updatedAt).toLocaleDateString()
          : '';
        return `<li>
          <button type="button" class="load" data-id="${id}">${escapeHtml(title)}${when ? ` · ${when}` : ''}</button>
          <button type="button" class="del" data-id="${id}" aria-label="Delete saved comparison for ${escapeAttr(title)}"><i class="fas fa-trash" aria-hidden="true"></i></button>
        </li>`;
      })
      .join('');

    list.querySelectorAll('button.load').forEach((btn) => {
      btn.addEventListener('click', () => selectProblem(btn.dataset.id, true));
    });
    list.querySelectorAll('button.del').forEach((btn) => {
      btn.addEventListener('click', () => {
        const store2 = loadStore();
        delete store2.comparisons[btn.dataset.id];
        saveStore(store2);
        renderSavedList();
        flashStatus('Saved comparison removed');
      });
    });
  }

  function clearAllSaved() {
    if (!confirm('Clear all saved approach comparisons?')) return;
    saveStore({ comparisons: {} });
    renderSavedList();
    flashStatus('All saved comparisons cleared');
  }

  function flashStatus(msg) {
    const el = $('atmStatus');
    if (!el) return;
    el.textContent = msg;
    clearTimeout(flashStatus._t);
    flashStatus._t = setTimeout(() => {
      if (el.textContent === msg) el.textContent = '';
    }, 2500);
  }

  function init() {
    buildProblemCatalog();
    renderProblemList();
    renderSavedList();

    $('atmSearch').addEventListener('input', renderProblemList);
    $('atmDifficulty').addEventListener('change', renderProblemList);
    $('atmSaveBtn').addEventListener('click', saveCurrent);
    $('atmResetBtn').addEventListener('click', resetDefaults);
    $('atmClearAllBtn').addEventListener('click', clearAllSaved);
    $('atmOverallNotes').addEventListener('input', readOverallNotes);

    // Auto-select Two Sum if present
    if (problems.some((p) => p.id === 1)) {
      selectProblem(1);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
