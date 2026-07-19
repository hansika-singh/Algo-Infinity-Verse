/**
 * Test Case Builder Studio
 * Presets → editable cases with expected asserts → practice-editor JSON export.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'aivTestCaseBuilderSuite';

  const PRESETS = [
    { id: 'empty', label: 'Empty' },
    { id: 'min', label: 'Min' },
    { id: 'max', label: 'Max' },
    { id: 'duplicates', label: 'Duplicates' },
    { id: 'sorted', label: 'Sorted' },
    { id: 'random', label: 'Random' },
  ];

  const els = {
    shape: document.getElementById('tcbShape'),
    size: document.getElementById('tcbSize'),
    min: document.getElementById('tcbMin'),
    max: document.getElementById('tcbMax'),
    presets: document.getElementById('tcbPresets'),
    expected: document.getElementById('tcbExpected'),
    note: document.getElementById('tcbNote'),
    addGenerated: document.getElementById('tcbAddGenerated'),
    addBlank: document.getElementById('tcbAddBlank'),
    preview: document.getElementById('tcbPreview'),
    count: document.getElementById('tcbCount'),
    copy: document.getElementById('tcbCopy'),
    download: document.getElementById('tcbDownload'),
    clear: document.getElementById('tcbClear'),
    status: document.getElementById('tcbStatus'),
    cases: document.getElementById('tcbCases'),
  };

  let activePreset = 'random';
  let cases = [];
  let nextId = 1;

  function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function makeArray(type, size, min, max) {
    size = clamp(size, 0, 50);
    if (type === 'empty') return [];
    if (type === 'min') return size <= 0 ? [min] : Array.from({ length: size }, () => min);
    if (type === 'max') return size <= 0 ? [max] : Array.from({ length: size }, () => max);
    if (type === 'duplicates') {
      if (size <= 0) return [];
      const v = randInt(min, max);
      return Array.from({ length: Math.max(2, size) }, () => v);
    }
    if (type === 'sorted') {
      const arr = Array.from({ length: Math.max(1, size) }, () => randInt(min, max));
      arr.sort((a, b) => a - b);
      return arr;
    }
    // random
    return Array.from({ length: Math.max(0, size) }, () => randInt(min, max));
  }

  function makeString(type, size) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    size = clamp(size, 0, 40);
    if (type === 'empty') return '';
    if (type === 'min') return 'a'.repeat(Math.max(1, size || 1));
    if (type === 'max') return 'z'.repeat(Math.max(1, size || 1));
    if (type === 'duplicates') return 'a'.repeat(Math.max(2, size || 2));
    if (type === 'sorted') {
      return Array.from({ length: Math.max(1, size || 1) }, () => alphabet[randInt(0, 25)])
        .sort()
        .join('');
    }
    return Array.from({ length: Math.max(0, size) }, () => alphabet[randInt(0, 25)]).join('');
  }

  function makeMatrix(type, size, min, max) {
    const n = clamp(size || 3, 0, 8);
    if (type === 'empty' || n === 0) return [];
    return Array.from({ length: n }, () => makeArray(type, n, min, max));
  }

  function generateInput() {
    const shape = els.shape.value;
    const type = activePreset;
    const size = Number(els.size.value) || 0;
    const min = Number(els.min.value);
    const max = Number(els.max.value);
    const lo = Number.isFinite(min) ? min : 0;
    const hi = Number.isFinite(max) ? max : 10;
    const a = Math.min(lo, hi);
    const b = Math.max(lo, hi);

    if (shape === 'array') {
      return [makeArray(type, size, a, b)];
    }
    if (shape === 'array-target') {
      const nums = makeArray(type === 'empty' ? 'random' : type, Math.max(2, size || 4), a, b);
      if (type === 'empty') return [[], a];
      const i = 0;
      const j = Math.min(1, nums.length - 1);
      const target = nums[i] + nums[j];
      return [nums, target];
    }
    if (shape === 'two-arrays') {
      return [makeArray(type, size, a, b), makeArray(type, Math.max(1, Math.floor(size / 2) || 1), a, b)];
    }
    if (shape === 'string') {
      return [makeString(type, size)];
    }
    if (shape === 'matrix') {
      return [makeMatrix(type, size, a, b)];
    }
    return [[]];
  }

  function parseJsonValue(raw, fieldName) {
    const text = String(raw ?? '').trim();
    if (text === '') return { ok: true, value: undefined, empty: true };
    try {
      return { ok: true, value: JSON.parse(text), empty: false };
    } catch {
      // Allow bare words true/false/null and numbers without quotes already handled by JSON
      // Try wrapping strings
      try {
        return { ok: true, value: JSON.parse(`"${text.replace(/"/g, '\\"')}"`), empty: false };
      } catch {
        return { ok: false, error: `Invalid JSON in ${fieldName}` };
      }
    }
  }

  function toExportSuite() {
    return cases.map((c) => {
      const row = { input: c.input };
      if (c.expected !== undefined) row.expected = c.expected;
      return row;
    });
  }

  function setStatus(msg, isError = false) {
    els.status.textContent = msg;
    els.status.style.color = isError ? 'var(--tcb-red)' : 'var(--tcb-green)';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderPresets() {
    els.presets.replaceChildren(
      ...PRESETS.map((p) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `tcb-preset${p.id === activePreset ? ' active' : ''}`;
        btn.textContent = p.label;
        btn.setAttribute('aria-pressed', String(p.id === activePreset));
        btn.addEventListener('click', () => {
          activePreset = p.id;
          renderPresets();
        });
        return btn;
      })
    );
  }

  function renderPreview() {
    const suite = toExportSuite();
    els.preview.textContent = JSON.stringify(suite, null, 2);
    els.count.textContent = `${suite.length} case${suite.length === 1 ? '' : 's'}`;
  }

  function renderCases() {
    if (!cases.length) {
      els.cases.innerHTML = '<p class="tcb-empty">No cases yet. Generate a preset or add a blank case.</p>';
      renderPreview();
      return;
    }

    els.cases.replaceChildren(
      ...cases.map((c, index) => {
        const card = document.createElement('article');
        card.className = 'tcb-case';
        card.setAttribute('role', 'listitem');
        card.dataset.id = c.id;

        const inputStr = JSON.stringify(c.input);
        const expectedStr = c.expected === undefined ? '' : JSON.stringify(c.expected);

        card.innerHTML = `
          <div class="tcb-case-head">
            <h3 class="tcb-case-title">#${index + 1}${c.note ? ` · ${escapeHtml(c.note)}` : ''}</h3>
            <span class="tcb-case-type">${escapeHtml(c.type || 'custom')}</span>
          </div>
          <div class="tcb-case-grid">
            <div>
              <label for="tcb-in-${c.id}">Input (JSON array of args)</label>
              <textarea id="tcb-in-${c.id}" class="tcb-textarea tcb-mono" rows="3">${escapeHtml(inputStr)}</textarea>
            </div>
            <div>
              <label for="tcb-ex-${c.id}">Expected output (assert)</label>
              <textarea id="tcb-ex-${c.id}" class="tcb-textarea tcb-mono" rows="3" placeholder="null / true / [0,1] / 42">${escapeHtml(expectedStr)}</textarea>
            </div>
          </div>
        `;

        const actions = document.createElement('div');
        actions.className = 'tcb-case-actions';

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'tcb-mini-btn';
        saveBtn.textContent = 'Apply edits';
        saveBtn.addEventListener('click', () => {
          const inEl = card.querySelector(`#tcb-in-${c.id}`);
          const exEl = card.querySelector(`#tcb-ex-${c.id}`);
          const parsedIn = parseJsonValue(inEl.value, 'input');
          if (!parsedIn.ok || parsedIn.empty) {
            inEl.classList.add('tcb-invalid');
            setStatus(parsedIn.error || 'Input cannot be empty.', true);
            return;
          }
          if (!Array.isArray(parsedIn.value)) {
            inEl.classList.add('tcb-invalid');
            setStatus('Input must be a JSON array of function arguments.', true);
            return;
          }
          inEl.classList.remove('tcb-invalid');

          const parsedEx = parseJsonValue(exEl.value, 'expected');
          if (!parsedEx.ok) {
            exEl.classList.add('tcb-invalid');
            setStatus(parsedEx.error, true);
            return;
          }
          exEl.classList.remove('tcb-invalid');

          c.input = parsedIn.value;
          c.expected = parsedEx.empty ? undefined : parsedEx.value;
          persist();
          renderPreview();
          setStatus(`Case #${index + 1} updated.`);
        });

        const dupBtn = document.createElement('button');
        dupBtn.type = 'button';
        dupBtn.className = 'tcb-mini-btn';
        dupBtn.textContent = 'Duplicate';
        dupBtn.addEventListener('click', () => {
          cases.splice(index + 1, 0, {
            id: `tc_${nextId++}`,
            type: c.type,
            note: c.note ? `${c.note} (copy)` : 'copy',
            input: JSON.parse(JSON.stringify(c.input)),
            expected: c.expected === undefined ? undefined : JSON.parse(JSON.stringify(c.expected)),
          });
          persist();
          renderCases();
          setStatus('Case duplicated.');
        });

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'tcb-mini-btn danger';
        delBtn.textContent = 'Delete';
        delBtn.addEventListener('click', () => {
          cases = cases.filter((x) => x.id !== c.id);
          persist();
          renderCases();
          setStatus('Case deleted.');
        });

        actions.append(saveBtn, dupBtn, delBtn);
        card.appendChild(actions);
        return card;
      })
    );

    renderPreview();
  }

  function addCase(input, expected, type, note) {
    cases.push({
      id: `tc_${nextId++}`,
      type,
      note: note || '',
      input,
      expected,
    });
    persist();
    renderCases();
  }

  function handleAddGenerated() {
    const input = generateInput();
    const parsedEx = parseJsonValue(els.expected.value, 'expected');
    if (!parsedEx.ok) {
      els.expected.classList.add('tcb-invalid');
      setStatus(parsedEx.error, true);
      return;
    }
    els.expected.classList.remove('tcb-invalid');
    const note = els.note.value.trim() || `${activePreset} · ${els.shape.value}`;
    addCase(input, parsedEx.empty ? undefined : parsedEx.value, activePreset, note);
    setStatus(`Added ${activePreset} case.`);
  }

  function handleAddBlank() {
    addCase([[]], undefined, 'custom', els.note.value.trim() || 'blank');
    setStatus('Blank case added — edit input & expected.');
  }

  async function handleCopy() {
    const text = JSON.stringify(toExportSuite(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Copied JSON suite to clipboard.');
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      setStatus('Copied JSON suite to clipboard.');
    }
  }

  function handleDownload() {
    const blob = new Blob([JSON.stringify(toExportSuite(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-cases.json';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Downloaded test-cases.json');
  }

  function handleClear() {
    if (!cases.length) {
      setStatus('Suite is already empty.', true);
      return;
    }
    if (!window.confirm('Clear all test cases?')) return;
    cases = [];
    persist();
    renderCases();
    setStatus('Suite cleared.');
  }

  function persist() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ cases, nextId, shape: els.shape.value, preset: activePreset })
      );
    } catch {
      /* ignore quota */
    }
  }

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.cases)) return;
      cases = data.cases;
      nextId = Number(data.nextId) || cases.length + 1;
      if (data.shape) els.shape.value = data.shape;
      if (data.preset) activePreset = data.preset;
    } catch {
      /* ignore */
    }
  }

  els.addGenerated.addEventListener('click', handleAddGenerated);
  els.addBlank.addEventListener('click', handleAddBlank);
  els.copy.addEventListener('click', handleCopy);
  els.download.addEventListener('click', handleDownload);
  els.clear.addEventListener('click', handleClear);
  els.shape.addEventListener('change', persist);

  const scrollBtn = document.getElementById('scrollTopBtn');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('visible', window.scrollY > 400);
    });
    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  loadSaved();
  renderPresets();
  renderCases();
  if (cases.length) setStatus('Restored saved suite from localStorage.');
})();
