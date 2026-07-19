/**
 * Constraint → Complexity Estimator
 * Maps n/m/time/memory to safe Big-O suggestions and TLE warnings.
 */

document.addEventListener('DOMContentLoaded', () => {
  ccInit();
});

const CC_COMPLEXITIES = [
  {
    id: '1',
    label: 'O(1)',
    estimate: (n, m) => 1,
    note: 'Constant work — always safe on time.',
  },
  {
    id: 'logn',
    label: 'O(log n)',
    estimate: (n) => Math.max(1, Math.log2(Math.max(n, 2))),
    note: 'Binary search / sparse tables.',
  },
  {
    id: 'n',
    label: 'O(n)',
    estimate: (n) => n,
    note: 'Single pass / linear scan.',
  },
  {
    id: 'nlogn',
    label: 'O(n log n)',
    estimate: (n) => n * Math.log2(Math.max(n, 2)),
    note: 'Sorting, segment tree builds, many graph algos.',
  },
  {
    id: 'nsqrt',
    label: 'O(n √n)',
    estimate: (n) => n * Math.sqrt(n),
    note: 'Mo’s algorithm / sqrt decomposition style.',
  },
  {
    id: 'nm',
    label: 'O(n + m)',
    estimate: (n, m) => n + (m || 0),
    note: 'Graphs: traverse vertices + edges.',
    needsM: true,
  },
  {
    id: 'n2',
    label: 'O(n²)',
    estimate: (n) => n * n,
    note: 'Nested loops / Floyd / DP tables.',
  },
  {
    id: 'n3',
    label: 'O(n³)',
    estimate: (n) => n * n * n,
    note: 'Triple loops / matrix multiply naive.',
  },
  {
    id: '2n',
    label: 'O(2ⁿ)',
    estimate: (n) => (n > 40 ? Infinity : 2 ** n),
    note: 'Subsets / exponential search — only tiny n.',
  },
  {
    id: 'nfact',
    label: 'O(n!)',
    estimate: (n) => {
      if (n > 12) return Infinity;
      let f = 1;
      for (let i = 2; i <= n; i += 1) f *= i;
      return f;
    },
    note: 'Permutations — only n ≤ ~10–11.',
  },
];

function ccInit() {
  document.getElementById('ccEstimateBtn').addEventListener('click', () => ccEstimate());

  document.querySelectorAll('.cc-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cc-preset').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('ccN').value = btn.dataset.n;
      document.getElementById('ccM').value = btn.dataset.m ?? '';
      document.getElementById('ccTime').value = btn.dataset.time ?? '2';
      ccEstimate();
    });
  });

  ['ccN', 'ccM', 'ccTime', 'ccMem', 'ccOps'].forEach((id) => {
    document.getElementById(id).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') ccEstimate();
    });
  });

  ccEstimate();
}

/** Parse contest-style numbers: 1e5, 2*10^5, 100000 */
function ccParseNumber(raw, { allowEmpty = false } = {}) {
  const text = String(raw ?? '').trim().replace(/,/g, '').toLowerCase();
  if (!text) {
    if (allowEmpty) return null;
    throw new Error('Value is required.');
  }

  const sci = text.match(/^(\d+(?:\.\d+)?)\s*[eE]\s*([+-]?\d+)$/);
  if (sci) return Number(sci[1]) * 10 ** Number(sci[2]);

  const pow = text.match(/^(\d+(?:\.\d+)?)\s*(?:\*|x)?\s*10\s*\^\s*([+-]?\d+)$/);
  if (pow) return Number(pow[1]) * 10 ** Number(pow[2]);

  const plain = Number(text);
  if (!Number.isFinite(plain) || plain < 0) {
    throw new Error(`Cannot parse “${raw}”. Try 1e5 or 100000.`);
  }
  return plain;
}

function ccFormatOps(value) {
  if (!Number.isFinite(value)) return '∞';
  if (value < 1000) return String(Math.round(value));
  return value.toExponential(2).replace('+', '');
}

function ccVerdict(ops, budget) {
  if (!Number.isFinite(ops)) return 'unsafe';
  const ratio = ops / budget;
  if (ratio <= 0.85) return 'safe';
  if (ratio <= 1.25) return 'borderline';
  return 'unsafe';
}

function ccSpaceTip(n, m, memMb) {
  const bytesBudget = memMb * 1024 * 1024;
  const intArr = n * 4;
  const longArr = n * 8;
  const matrix = n * n * 4;
  const tips = [];

  if (intArr < bytesBudget * 0.5) {
    tips.push(`~int[n] OK (~${ccFormatOps(intArr)} B)`);
  } else {
    tips.push('large int[n] may be tight');
  }

  if (Number.isFinite(matrix) && matrix > bytesBudget) {
    tips.push('O(n²) int matrix likely MLE');
  } else if (n <= 5000) {
    tips.push('small n² table may fit');
  }

  if (m != null && m > 0) {
    tips.push(`graph edges m=${ccFormatOps(m)}`);
  }

  return tips.join(' · ');
}

function ccEstimate() {
  const explain = document.getElementById('ccExplain');
  try {
    const n = ccParseNumber(document.getElementById('ccN').value);
    const m = ccParseNumber(document.getElementById('ccM').value, { allowEmpty: true });
    const time = Number(document.getElementById('ccTime').value);
    const mem = Number(document.getElementById('ccMem').value);
    const opsPerSec = ccParseNumber(document.getElementById('ccOps').value);

    if (!(time > 0)) throw new Error('Time limit must be positive.');
    if (!(mem > 0)) throw new Error('Memory must be positive.');
    if (!(opsPerSec > 0)) throw new Error('Ops/sec must be positive.');
    if (!(n >= 1)) throw new Error('n should be at least 1.');

    const budget = time * opsPerSec;

    document.getElementById('ccBudget').textContent = ccFormatOps(budget);
    document.getElementById('ccParsedN').textContent = ccFormatOps(n);
    document.getElementById('ccParsedM').textContent = m == null ? '—' : ccFormatOps(m);
    document.getElementById('ccSpaceTip').textContent = ccSpaceTip(n, m, mem);

    const rows = CC_COMPLEXITIES.filter((c) => !c.needsM || m != null).map((c) => {
      const ops = c.estimate(n, m ?? 0);
      const verdict = ccVerdict(ops, budget);
      const ratio = Number.isFinite(ops) ? ops / budget : Infinity;
      return { ...c, ops, verdict, ratio };
    });

    const safe = rows.filter((r) => r.verdict === 'safe');
    const recommended = safe.length
      ? safe
      : rows.filter((r) => r.verdict === 'borderline');

    const safeList = document.getElementById('ccSafeList');
    safeList.innerHTML = recommended.length
      ? recommended.map((r) => `<li class="cc-chip">${r.label}</li>`).join('')
      : '<li class="cc-chip">None fit — reduce n or raise time</li>';

    const bestSafe = safe.at(-1) ?? recommended[0];
    const unsafeExamples = rows.filter((r) => r.verdict === 'unsafe').slice(0, 2);

    let msg = `With n≈${ccFormatOps(n)}, ${time}s, and ~${ccFormatOps(opsPerSec)} ops/s, budget ≈ ${ccFormatOps(budget)} operations. `;
    if (bestSafe) {
      msg += `Prefer up to about ${bestSafe.label} (${bestSafe.note}). `;
    }
    if (unsafeExamples.length) {
      msg += `Avoid ${unsafeExamples.map((u) => u.label).join(', ')} — likely TLE.`;
    }

    explain.textContent = msg;

    const tbody = document.getElementById('ccTableBody');
    tbody.innerHTML = rows
      .map((r) => {
        return `<tr>
          <td>${r.label}</td>
          <td>${ccFormatOps(r.ops)}</td>
          <td>
            ${Number.isFinite(r.ratio) ? `${(r.ratio * 100).toFixed(0)}%` : '∞'}
            <span class="cc-ratio-bar" aria-hidden="true"><span class="cc-ratio-fill ${r.verdict}"></span></span>
          </td>
          <td><span class="cc-verdict ${r.verdict}">${r.verdict}</span></td>
        </tr>`;
      })
      .join('');

    tbody.querySelectorAll('.cc-ratio-fill').forEach((el, i) => {
      const pct = Number.isFinite(rows[i].ratio) ? Math.min(rows[i].ratio * 100, 100) : 100;
      el.style.width = `${pct}%`;
    });
  } catch (err) {
    explain.textContent = err.message;
    document.getElementById('ccBudget').textContent = '—';
    document.getElementById('ccParsedN').textContent = '—';
    document.getElementById('ccParsedM').textContent = '—';
    document.getElementById('ccSpaceTip').textContent = '—';
    document.getElementById('ccSafeList').innerHTML = '';
    document.getElementById('ccTableBody').innerHTML = '';
  }
}
