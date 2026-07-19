/**
 * Trace Table / Desk-Check Builder
 * Manual desk-check editing + guided auto-fill for sample algorithms.
 */

document.addEventListener('DOMContentLoaded', () => {
  ttInit();
});

const TT_SAMPLES = {
  blank: {
    columns: ['i', 'j', 'temp', 'notes'],
    rows: [
      { i: '', j: '', temp: '', notes: 'start' },
      { i: '', j: '', temp: '', notes: '' },
      { i: '', j: '', temp: '', notes: '' },
    ],
  },
  bubble: {
    columns: ['pass', 'i', 'a[i]', 'a[i+1]', 'swapped?', 'array'],
    rows: [
      {
        pass: '1',
        i: '0',
        'a[i]': '5',
        'a[i+1]': '1',
        'swapped?': 'yes',
        array: '[1, 5, 4, 2]',
      },
      {
        pass: '1',
        i: '1',
        'a[i]': '5',
        'a[i+1]': '4',
        'swapped?': 'yes',
        array: '[1, 4, 5, 2]',
      },
      {
        pass: '1',
        i: '2',
        'a[i]': '5',
        'a[i+1]': '2',
        'swapped?': 'yes',
        array: '[1, 4, 2, 5]',
      },
      {
        pass: '2',
        i: '0',
        'a[i]': '1',
        'a[i+1]': '4',
        'swapped?': 'no',
        array: '[1, 4, 2, 5]',
      },
      {
        pass: '2',
        i: '1',
        'a[i]': '4',
        'a[i+1]': '2',
        'swapped?': 'yes',
        array: '[1, 2, 4, 5]',
      },
    ],
  },
  twoPointers: {
    columns: ['L', 'R', 'a[L]', 'a[R]', 'sum', 'move'],
    rows: [
      { L: '0', R: '4', 'a[L]': '1', 'a[R]': '9', sum: '10', move: 'sum > target → R--' },
      { L: '0', R: '3', 'a[L]': '1', 'a[R]': '7', sum: '8', move: 'sum < target → L++' },
      { L: '1', R: '3', 'a[L]': '2', 'a[R]': '7', sum: '9', move: 'found pair' },
    ],
  },
  factorial: {
    columns: ['n', 'i', 'fact', 'notes'],
    rows: [
      { n: '5', i: '1', fact: '1', notes: 'init' },
      { n: '5', i: '2', fact: '2', notes: 'fact *= i' },
      { n: '5', i: '3', fact: '6', notes: 'fact *= i' },
      { n: '5', i: '4', fact: '24', notes: 'fact *= i' },
      { n: '5', i: '5', fact: '120', notes: 'done' },
    ],
  },
};

let ttState = {
  sample: 'bubble',
  columns: [],
  rows: [],
  activeStep: 0,
};

function ttInit() {
  document.querySelectorAll('.tt-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tt-chip').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      ttState.sample = btn.dataset.sample;
      ttLoadSample(ttState.sample, { emptyValues: ttState.sample !== 'blank' });
      ttSetStatus(`Loaded “${btn.textContent.trim()}” — use Auto-fill or type values.`);
    });
  });

  document.getElementById('ttAddColBtn').addEventListener('click', () => ttAddColumn());
  document.getElementById('ttAddRowBtn').addEventListener('click', () => ttAddRow());
  document.getElementById('ttAutoFillBtn').addEventListener('click', () => ttAutoFill());
  document.getElementById('ttHighlightBtn').addEventListener('click', () => ttNextHighlight());
  document.getElementById('ttCopyBtn').addEventListener('click', () => ttCopy());
  document.getElementById('ttExportBtn').addEventListener('click', () => ttExportCsv());
  document.getElementById('ttResetBtn').addEventListener('click', () => {
    ttLoadSample(ttState.sample, { emptyValues: true });
    ttSetStatus('Table reset. Cells cleared for desk-check practice.');
  });

  document.getElementById('ttColName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') ttAddColumn();
  });

  ttLoadSample('bubble', { emptyValues: true });
  ttSetStatus('Blank desk-check ready — Auto-fill to see guided values.');
}

function ttCloneSample(key) {
  const sample = TT_SAMPLES[key] ?? TT_SAMPLES.blank;
  return {
    columns: [...sample.columns],
    rows: sample.rows.map((row) => ({ ...row })),
  };
}

function ttLoadSample(key, { emptyValues = false } = {}) {
  const cloned = ttCloneSample(key);
  ttState.columns = cloned.columns;
  ttState.rows = emptyValues
    ? cloned.rows.map((row) => {
        const blank = {};
        ttState.columns.forEach((col) => {
          blank[col] = '';
        });
        return blank;
      })
    : cloned.rows;
  ttState.activeStep = 0;
  ttRender();
}

function ttAutoFill() {
  const cloned = ttCloneSample(ttState.sample);
  ttState.columns = cloned.columns;
  ttState.rows = cloned.rows;
  ttState.activeStep = 0;
  ttRender();
  ttSetStatus('Sample auto-filled. Step through with Next step highlight.');
}

function ttAddColumn() {
  const input = document.getElementById('ttColName');
  const name = input.value.trim();
  if (!name) {
    ttSetStatus('Enter a variable name first.');
    input.focus();
    return;
  }
  if (ttState.columns.includes(name)) {
    ttSetStatus(`Column “${name}” already exists.`);
    return;
  }
  ttState.columns.push(name);
  ttState.rows.forEach((row) => {
    row[name] = '';
  });
  input.value = '';
  ttRender();
  ttSetStatus(`Added column “${name}”.`);
}

function ttRemoveColumn(colName) {
  if (ttState.columns.length <= 1) {
    ttSetStatus('Keep at least one variable column.');
    return;
  }
  ttState.columns = ttState.columns.filter((c) => c !== colName);
  ttState.rows.forEach((row) => {
    delete row[colName];
  });
  ttRender();
  ttSetStatus(`Removed column “${colName}”.`);
}

function ttAddRow() {
  const row = {};
  ttState.columns.forEach((col) => {
    row[col] = '';
  });
  ttState.rows.push(row);
  ttState.activeStep = ttState.rows.length - 1;
  ttRender();
  ttSetStatus(`Added step ${ttState.rows.length}.`);
}

function ttRemoveRow(index) {
  if (ttState.rows.length <= 1) {
    ttSetStatus('Keep at least one step row.');
    return;
  }
  ttState.rows.splice(index, 1);
  ttState.activeStep = Math.min(ttState.activeStep, ttState.rows.length - 1);
  ttRender();
  ttSetStatus('Step removed.');
}

function ttNextHighlight() {
  if (!ttState.rows.length) return;
  ttState.activeStep = (ttState.activeStep + 1) % ttState.rows.length;
  ttRender();
  ttSetStatus(`Highlighting step ${ttState.activeStep + 1} / ${ttState.rows.length}.`);
}

function ttSyncFromDom() {
  const body = document.getElementById('ttBody');
  const rows = [...body.querySelectorAll('.tt-body-row')];
  ttState.rows = rows.map((tr) => {
    const row = {};
    ttState.columns.forEach((col) => {
      const input = tr.querySelector(`input[data-col="${CSS.escape(col)}"]`);
      row[col] = input ? input.value : '';
    });
    return row;
  });
}

function ttRender() {
  const head = document.getElementById('ttHead');
  const body = document.getElementById('ttBody');

  head.innerHTML = `<tr>
    <th scope="col">Step</th>
    ${ttState.columns
      .map(
        (col) => `<th scope="col">
          <div class="tt-th-inner">
            <span class="tt-col-name">${ttEscape(col)}</span>
            <button type="button" class="tt-icon-btn" data-remove-col="${ttEscape(col)}" aria-label="Remove column ${ttEscape(col)}">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </th>`
      )
      .join('')}
    <th scope="col" class="tt-row-actions"></th>
  </tr>`;

  body.innerHTML = ttState.rows
    .map((row, idx) => {
      const active = idx === ttState.activeStep ? 'active-step' : '';
      return `<tr class="tt-body-row ${active}" data-row="${idx}">
        <td class="tt-step-cell">#${idx + 1}</td>
        ${ttState.columns
          .map(
            (col) => `<td>
              <input
                type="text"
                class="tt-cell-input"
                data-col="${ttEscape(col)}"
                value="${ttEscape(row[col] ?? '')}"
                aria-label="Step ${idx + 1} ${ttEscape(col)}"
                spellcheck="false"
                autocomplete="off"
              />
            </td>`
          )
          .join('')}
        <td class="tt-row-actions">
          <button type="button" class="tt-icon-btn" data-remove-row="${idx}" aria-label="Remove step ${idx + 1}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
    })
    .join('');

  head.querySelectorAll('[data-remove-col]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ttSyncFromDom();
      ttRemoveColumn(btn.dataset.removeCol);
    });
  });

  body.querySelectorAll('[data-remove-row]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ttSyncFromDom();
      ttRemoveRow(Number(btn.dataset.removeRow));
    });
  });

  body.querySelectorAll('.tt-body-row').forEach((tr) => {
    tr.addEventListener('focusin', () => {
      ttState.activeStep = Number(tr.dataset.row);
      body.querySelectorAll('.tt-body-row').forEach((r) => r.classList.remove('active-step'));
      tr.classList.add('active-step');
    });
  });
}

function ttEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function ttToMatrix() {
  ttSyncFromDom();
  const header = ['Step', ...ttState.columns];
  const lines = [header];
  ttState.rows.forEach((row, idx) => {
    lines.push([String(idx + 1), ...ttState.columns.map((col) => row[col] ?? '')]);
  });
  return lines;
}

function ttToCsv() {
  return ttToMatrix()
    .map((cols) =>
      cols
        .map((cell) => {
          const text = String(cell);
          if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
          return text;
        })
        .join(',')
    )
    .join('\n');
}

function ttToTsv() {
  return ttToMatrix()
    .map((cols) => cols.join('\t'))
    .join('\n');
}

async function ttCopy() {
  const text = ttToTsv();
  try {
    await navigator.clipboard.writeText(text);
    ttSetStatus('Copied table to clipboard (TSV).');
  } catch {
    ttSetStatus('Clipboard blocked — use Export CSV instead.');
  }
}

function ttExportCsv() {
  const blob = new Blob([ttToCsv()], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'desk-check-trace-table.csv';
  a.click();
  URL.revokeObjectURL(url);
  ttSetStatus('CSV downloaded.');
}

function ttSetStatus(message) {
  document.getElementById('ttStatus').textContent = message;
}
