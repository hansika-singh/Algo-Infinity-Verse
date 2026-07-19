/**
 * Interview Self-Scorecard
 * Rate clarity / correctness / complexity / communication → radar + revision links.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'aivInterviewScorecards';
  const MAX_HISTORY = 30;
  const WEAK_THRESHOLD = 3;

  const DIMENSIONS = [
    {
      id: 'clarity',
      label: 'Clarity',
      tip: 'Problem understanding & approach explanation',
      links: [
        { label: 'Problem Solving Framework', href: '/pages/tools/problem-solving-framework/problem-solving-framework.html' },
        { label: 'Revision Sheet', href: '/pages/interview/revision-sheet.html' },
        { label: 'Pattern Trainer', href: '/pages/tools/pattern-trainer/pattern-trainer.html' },
      ],
    },
    {
      id: 'correctness',
      label: 'Correctness',
      tip: 'Bugs, edge cases, test coverage',
      links: [
        { label: 'Interview Mistakes', href: '/pages/interview/interview-mistakes/interview-mistakes.html' },
        { label: 'Edge Case Generator', href: '/pages/tools/edge-case-generator/edge-case-generator.html' },
        { label: 'Dry Run Simulator', href: '/pages/tools/dry-run-simulator/dry-run-simulator.html' },
      ],
    },
    {
      id: 'complexity',
      label: 'Complexity',
      tip: 'Time/space analysis & optimization',
      links: [
        { label: 'Brute → Optimal Studio', href: '/pages/tools/brute-to-optimal-studio/brute-to-optimal-studio.html' },
        { label: 'Big-O Analyzer', href: '/pages/visualizers/big-o-analyzer/big-o-analyzer.html' },
        { label: 'Complexity Analyzer', href: '/pages/tools/complexity-analyzer/complexity-analyzer.html' },
      ],
    },
    {
      id: 'communication',
      label: 'Communication',
      tip: 'Think-aloud, tradeoffs, collaboration',
      links: [
        { label: 'Think-Aloud Judge', href: '/pages/tools/think-aloud-judge/think-aloud-judge.html' },
        { label: 'Mock Interview', href: '/pages/interview/mock-interview-simulator/mock-interview-simulator.html' },
        { label: 'Behavioral Prep', href: '/pages/interview/behavioral-questions/behavioral-questions.html' },
      ],
    },
  ];

  const scores = {
    clarity: 0,
    correctness: 0,
    complexity: 0,
    communication: 0,
  };

  const els = {
    problem: document.getElementById('iscProblem'),
    notes: document.getElementById('iscNotes'),
    save: document.getElementById('iscSave'),
    reset: document.getElementById('iscReset'),
    saveMsg: document.getElementById('iscSaveMsg'),
    radar: document.getElementById('iscRadar'),
    avg: document.getElementById('iscAvg'),
    legend: document.getElementById('iscLegend'),
    weak: document.getElementById('iscWeakAreas'),
    history: document.getElementById('iscHistory'),
    clearHistory: document.getElementById('iscClearHistory'),
  };

  function buildStarControls() {
    document.querySelectorAll('.isc-score-row').forEach((row) => {
      const dim = row.dataset.dim;
      const group = row.querySelector('.isc-stars');
      group.replaceChildren();
      for (let n = 1; n <= 5; n++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'isc-star-btn';
        btn.textContent = String(n);
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', 'false');
        btn.setAttribute('aria-label', `${DIMENSIONS.find((d) => d.id === dim).label} ${n} of 5`);
        btn.addEventListener('click', () => {
          scores[dim] = n;
          syncStars();
          renderRadar();
          renderWeakAreas();
          els.saveMsg.textContent = '';
        });
        group.appendChild(btn);
      }
    });
  }

  function syncStars() {
    document.querySelectorAll('.isc-score-row').forEach((row) => {
      const dim = row.dataset.dim;
      const value = scores[dim];
      row.querySelectorAll('.isc-star-btn').forEach((btn) => {
        const n = Number(btn.textContent);
        const active = n === value;
        btn.classList.toggle('active', active);
        btn.classList.toggle('weak-active', active && value > 0 && value <= WEAK_THRESHOLD);
        btn.setAttribute('aria-checked', String(active));
      });
    });
  }

  function allScored() {
    return DIMENSIONS.every((d) => scores[d.id] >= 1);
  }

  function average() {
    if (!allScored()) return null;
    const sum = DIMENSIONS.reduce((acc, d) => acc + scores[d.id], 0);
    return sum / DIMENSIONS.length;
  }

  function renderRadar() {
    const svg = els.radar;
    const ns = 'http://www.w3.org/2000/svg';
    const cx = 160;
    const cy = 160;
    const maxR = 110;
    const levels = 5;
    const n = DIMENSIONS.length;
    const frag = document.createDocumentFragment();

    // Grid polygons
    for (let level = 1; level <= levels; level++) {
      const r = (maxR / levels) * level;
      const poly = document.createElementNS(ns, 'polygon');
      poly.setAttribute('points', polygonPoints(cx, cy, r, n));
      poly.setAttribute('fill', 'none');
      poly.setAttribute('stroke', '#334155');
      poly.setAttribute('stroke-width', level === levels ? '1.5' : '1');
      poly.setAttribute('opacity', '0.7');
      frag.appendChild(poly);
    }

    // Axes + labels
    DIMENSIONS.forEach((dim, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const x = cx + maxR * Math.cos(angle);
      const y = cy + maxR * Math.sin(angle);
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', String(cx));
      line.setAttribute('y1', String(cy));
      line.setAttribute('x2', String(x));
      line.setAttribute('y2', String(y));
      line.setAttribute('stroke', '#475569');
      line.setAttribute('stroke-width', '1');
      frag.appendChild(line);

      const lx = cx + (maxR + 22) * Math.cos(angle);
      const ly = cy + (maxR + 22) * Math.sin(angle);
      const text = document.createElementNS(ns, 'text');
      text.setAttribute('x', String(lx));
      text.setAttribute('y', String(ly));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', '#94a3b8');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-family', 'Poppins, sans-serif');
      text.setAttribute('font-weight', '600');
      text.textContent = dim.label;
      frag.appendChild(text);
    });

    // Data polygon
    const values = DIMENSIONS.map((d) => scores[d.id] || 0);
    if (values.some((v) => v > 0)) {
      const pts = values
        .map((v, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
          const r = (maxR / 5) * v;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        })
        .join(' ');

      const area = document.createElementNS(ns, 'polygon');
      area.setAttribute('points', pts);
      area.setAttribute('fill', 'rgba(6, 182, 212, 0.25)');
      area.setAttribute('stroke', '#06b6d4');
      area.setAttribute('stroke-width', '2.5');
      frag.appendChild(area);

      values.forEach((v, i) => {
        if (v <= 0) return;
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const r = (maxR / 5) * v;
        const dot = document.createElementNS(ns, 'circle');
        dot.setAttribute('cx', String(cx + r * Math.cos(angle)));
        dot.setAttribute('cy', String(cy + r * Math.sin(angle)));
        dot.setAttribute('r', '4.5');
        dot.setAttribute('fill', v <= WEAK_THRESHOLD ? '#f87171' : '#06b6d4');
        frag.appendChild(dot);
      });
    }

    svg.replaceChildren(frag);

    const avg = average();
    els.avg.textContent = avg == null ? 'Avg —' : `Avg ${avg.toFixed(1)} / 5`;

    els.legend.replaceChildren(
      ...DIMENSIONS.map((d) => {
        const li = document.createElement('li');
        li.textContent = `${d.label}: ${scores[d.id] || '—'}/5`;
        return li;
      })
    );
  }

  function polygonPoints(cx, cy, r, n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return pts.join(' ');
  }

  function renderWeakAreas() {
    if (!allScored()) {
      els.weak.innerHTML = '<p class="isc-muted">Score all four dimensions to unlock revision links.</p>';
      return;
    }

    const ranked = [...DIMENSIONS].sort((a, b) => scores[a.id] - scores[b.id]);
    els.weak.replaceChildren(
      ...ranked.map((dim) => {
        const score = scores[dim.id];
        const weak = score <= WEAK_THRESHOLD;
        const card = document.createElement('article');
        card.className = `isc-weak-card${weak ? '' : ' ok'}`;
        card.innerHTML = `
          <h3>
            <span>${escapeHtml(dim.label)}</span>
            <span class="isc-score-chip">${score}/5 ${weak ? '· focus' : '· solid'}</span>
          </h3>
          <p>${escapeHtml(dim.tip)}</p>
          <div class="isc-links">
            ${dim.links
              .map((l) => `<a href="${l.href}">${escapeHtml(l.label)}</a>`)
              .join('')}
          </div>
        `;
        return card;
      })
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveHistory(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)));
  }

  function renderHistory() {
    const list = loadHistory();
    els.clearHistory.disabled = list.length === 0;

    if (list.length === 0) {
      els.history.innerHTML = '<p class="isc-empty">No saved scorecards yet. Rate a mock and hit Save.</p>';
      return;
    }

    els.history.replaceChildren(
      ...list.map((item) => {
        const row = document.createElement('div');
        row.className = 'isc-history-item';
        row.setAttribute('role', 'listitem');
        const title = item.problem || 'Untitled mock';
        const date = new Date(item.savedAt).toLocaleString();
        row.innerHTML = `
          <div>
            <div class="isc-history-title">${escapeHtml(title)}</div>
            <div class="isc-history-meta">${escapeHtml(date)} · avg ${item.average.toFixed(1)}</div>
          </div>
          <div class="isc-history-scores">
            <span class="isc-mini">Cl ${item.scores.clarity}</span>
            <span class="isc-mini">Co ${item.scores.correctness}</span>
            <span class="isc-mini">Cx ${item.scores.complexity}</span>
            <span class="isc-mini">Cm ${item.scores.communication}</span>
          </div>
        `;
        row.addEventListener('click', () => {
          Object.assign(scores, item.scores);
          els.problem.value = item.problem || '';
          els.notes.value = item.notes || '';
          syncStars();
          renderRadar();
          renderWeakAreas();
          els.saveMsg.textContent = 'Loaded from history.';
        });
        row.style.cursor = 'pointer';
        row.title = 'Click to load';
        return row;
      })
    );
  }

  function handleSave() {
    if (!allScored()) {
      els.saveMsg.textContent = 'Please score all four dimensions (1–5) before saving.';
      els.saveMsg.style.color = 'var(--isc-red)';
      return;
    }

    const entry = {
      id: `isc_${Date.now()}`,
      problem: els.problem.value.trim(),
      notes: els.notes.value.trim(),
      scores: { ...scores },
      average: average(),
      savedAt: new Date().toISOString(),
    };

    const list = loadHistory();
    list.unshift(entry);
    saveHistory(list);
    renderHistory();
    els.saveMsg.style.color = 'var(--isc-green)';
    els.saveMsg.textContent = 'Scorecard saved to localStorage.';
  }

  function handleReset() {
    DIMENSIONS.forEach((d) => {
      scores[d.id] = 0;
    });
    els.problem.value = '';
    els.notes.value = '';
    els.saveMsg.textContent = '';
    syncStars();
    renderRadar();
    renderWeakAreas();
  }

  els.save.addEventListener('click', handleSave);
  els.reset.addEventListener('click', handleReset);
  els.clearHistory.addEventListener('click', () => {
    if (!loadHistory().length) return;
    if (window.confirm('Clear all saved interview scorecards?')) {
      localStorage.removeItem(STORAGE_KEY);
      renderHistory();
      els.saveMsg.textContent = 'History cleared.';
    }
  });

  const scrollBtn = document.getElementById('scrollTopBtn');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('visible', window.scrollY > 400);
    });
    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  buildStarControls();
  syncStars();
  renderRadar();
  renderWeakAreas();
  renderHistory();
})();
