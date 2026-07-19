/* ============================================
   TECH COMPARISON RADAR — Interactive Engine
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ─── Global state ───
  let activeComparison = null;
  let decisionStep = 0;
  let decisionHistory = [];

  const data = window.techComparisons || [];
  const picker = document.getElementById('tcPicker');
  const comparisonView = document.getElementById('tcComparison');
  const searchInput = document.getElementById('tcSearchInput');
  const clearBtn = document.getElementById('tcClearBtn');
  const filterContainer = document.getElementById('tcFilters');
  const pickerMessage = document.getElementById('tcPickerMessage');

  // ─── Radar chart constants ───
  const RADAR_CENTER = 180;
  const RADAR_RADIUS = 110;
  const RADAR_LEVELS = 5; // 1–5 scale
  const DIM_KEYS = ['learningCurve', 'performance', 'ecosystemSize', 'jobDemand', 'communitySupport', 'scalability'];

  // ─── Initialize ───
  initScrollTop();
  initBackButton();
  buildCategoryFilters();
  renderPickerCards(data);
  handleUrlParams();

  // ─── Scroll to top ───
  function initScrollTop() {
    const btn = document.getElementById('scrollTopBtn');
    if (!btn) return;
    window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // ─── Back button ───
  function initBackButton() {
    const btn = document.getElementById('tcBackBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      // Use history.back() to avoid adding extra history entries (which causes a loop)
      if (window.history.length > 1) {
        history.back();
      } else {
        location.href = '/';
      }
    });
  }

  // ─── Build category filter chips ───
  function buildCategoryFilters() {
    const cats = ['All', ...new Set(data.map((c) => c.category))];
    const urlCat = new URLSearchParams(window.location.search).get('category');
    filterContainer.innerHTML = '';
    filterContainer.setAttribute('role', 'tablist');
    filterContainer.setAttribute('aria-label', 'Comparison categories');
    cats.forEach((cat) => {
      const key = cat === 'All' ? 'all' : cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const isActive = (!urlCat && cat === 'All') || urlCat === key;
      const count = cat === 'All' ? data.length : data.filter((c) => c.category === cat).length;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tc-filter-chip' + (isActive ? ' active' : '');
      btn.dataset.category = key;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.textContent = cat + ' (' + count + ')';
      btn.addEventListener('click', () => {
        filterContainer.querySelectorAll('.tc-filter-chip').forEach((c) => {
          c.classList.remove('active');
          c.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const newUrl = new URL(window.location);
        if (key === 'all') newUrl.searchParams.delete('category');
        else newUrl.searchParams.set('category', key);
        history.pushState({}, '', newUrl);
        renderPickerCards(filterComparisons());
      });
      filterContainer.appendChild(btn);
    });
  }

  // ─── Filter logic ───
  function filterComparisons() {
    const activeFilter = filterContainer.querySelector('.tc-filter-chip.active');
    const cat = activeFilter ? activeFilter.dataset.category : 'all';
    const q = (searchInput.value || '').toLowerCase();
    return data.filter((c) => {
      const matchCat = cat === 'all' || c.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') === cat;
      const matchSearch =
        !q ||
        c.techA.name.toLowerCase().includes(q) ||
        c.techB.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }

  // ─── Render picker cards ───
  function renderPickerCards(list) {
    if (list.length === 0) {
      pickerMessage.style.display = 'block';
      pickerMessage.innerHTML = '<i class="fas fa-search-minus"></i> No comparisons found. Try a different filter.';
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'tc-picker-grid';
    list.forEach((comp) => {
      const link = '?tech=' + encodeURIComponent(comp.id);
      const card = document.createElement('a');
      card.className = 'tc-picker-card';
      card.href = link;
      card.setAttribute('aria-label', 'Compare ' + comp.techA.name + ' vs ' + comp.techB.name);

      card.innerHTML =
        '<div class="tc-picker-card-icons">' +
        '<i class="' + comp.techA.icon + '" style="color:' + comp.techA.color + '"></i>' +
        '<span class="tc-vs">VS</span>' +
        '<i class="' + comp.techB.icon + '" style="color:' + comp.techB.color + '"></i>' +
        '</div>' +
        '<div class="tc-picker-card-title">' + escHtml(comp.techA.name) + ' vs ' + escHtml(comp.techB.name) + '</div>' +
        '<div class="tc-picker-card-category">' + escHtml(comp.category) + '</div>' +
        '<div class="tc-picker-card-desc">' + escHtml(comp.description || '') + '</div>';

      grid.appendChild(card);
    });

    picker.innerHTML = '';
    picker.appendChild(grid);
    pickerMessage.style.display = 'none';
  }

  // ─── Load a specific comparison ───
  function loadComparison(id) {
    const comp = data.find((c) => c.id === id);
    if (!comp) return;
    activeComparison = comp;
    decisionStep = 0;
    decisionHistory = [];

    // Hide hero content (title, subtitle, search, filters) + picker, show only comparison
    const heroContent = document.querySelector('.tc-hero-content');
    if (heroContent) heroContent.style.display = 'none';
    const pickerEl = document.getElementById('tcPicker');
    if (pickerEl) pickerEl.style.display = 'none';
    comparisonView.style.display = 'block';

    // Render all sections
    renderCompareHeader(comp);
    renderRadarChart(comp);
    renderFeatureTable(comp);
    renderSyntaxSelector(comp);
    renderMigrationSteps(comp);
    renderDecisionFlow(comp);
    setActiveTab('radar');

    // Scroll to comparison
    comparisonView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─── Render comparison header ───
  function renderCompareHeader(comp) {
    const h = document.getElementById('tcCompareHeader');
    h.innerHTML =
      '<div class="tc-compare-tech">' +
      '<i class="' + comp.techA.icon + ' tc-compare-tech-icon" style="color:' + comp.techA.color + '"></i>' +
      '<span class="tc-compare-tech-name" style="color:' + comp.techA.color + '">' + escHtml(comp.techA.name) + '</span>' +
      '</div>' +
      '<span class="tc-compare-vs">vs</span>' +
      '<div class="tc-compare-tech">' +
      '<i class="' + comp.techB.icon + ' tc-compare-tech-icon" style="color:' + comp.techB.color + '"></i>' +
      '<span class="tc-compare-tech-name" style="color:' + comp.techB.color + '">' + escHtml(comp.techB.name) + '</span>' +
      '</div>' +
      '<div class="tc-compare-desc">' + escHtml(comp.description || '') + '</div>';
  }

  // ─── Tab switching ───
  function setActiveTab(tabName) {
    document.querySelectorAll('.tc-tab').forEach((t) => {
      const isActive = t.dataset.tab === tabName;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    document.querySelectorAll('.tc-panel').forEach((p) => {
      p.classList.toggle('active', p.id === 'panel-' + tabName);
    });
  }

  document.querySelectorAll('.tc-tab').forEach((tab) => {
    tab.addEventListener('click', () => setActiveTab(tab.dataset.tab));
  });

  // ══════════════════════════════════════════
  // RADAR CHART
  // ══════════════════════════════════════════

  function renderRadarChart(comp) {
    const svg = document.getElementById('tcRadarChart');
    svg.innerHTML = '';
    const dims = comp.dimensions;
    const dimLabels = comp.dimensionLabels || {};
    const angleStep = (Math.PI * 2) / DIM_KEYS.length;

    // Grid levels (0.2, 0.4, 0.6, 0.8, 1.0)
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

    const getPoint = (value, index) => {
      const angle = -Math.PI / 2 + angleStep * index;
      const dist = RADAR_RADIUS * (value / RADAR_LEVELS);
      return {
        x: RADAR_CENTER + Math.cos(angle) * dist,
        y: RADAR_CENTER + Math.sin(angle) * dist,
      };
    };

    const getEdgePoint = (index) => {
      const angle = -Math.PI / 2 + angleStep * index;
      return {
        x: RADAR_CENTER + Math.cos(angle) * RADAR_RADIUS,
        y: RADAR_CENTER + Math.sin(angle) * RADAR_RADIUS,
      };
    };

    // Build polygon points strings
    const buildPoly = (getter) => {
      return DIM_KEYS.map((_, i) => {
        const p = getter(i);
        return p.x + ',' + p.y;
      }).join(' ');
    };

    let html = '';
    const ns = 'http://www.w3.org/2000/svg';

    // Grid polygons
    gridLevels.forEach((level) => {
      const pts = DIM_KEYS.map((_, i) => {
        const angle = -Math.PI / 2 + angleStep * i;
        const dist = RADAR_RADIUS * level;
        const x = RADAR_CENTER + Math.cos(angle) * dist;
        const y = RADAR_CENTER + Math.sin(angle) * dist;
        return x + ',' + y;
      }).join(' ');
      html += '<polygon points="' + pts + '" fill="none" stroke="rgba(148,163,184,0.1)" />';
    });

    // Spokes with labels
    DIM_KEYS.forEach((key, i) => {
      const edge = getEdgePoint(i);
      const label = getEdgePoint(i);
      const labelDist = RADAR_RADIUS + 24;
      const angle = -Math.PI / 2 + angleStep * i;
      const lx = RADAR_CENTER + Math.cos(angle) * labelDist;
      const ly = RADAR_CENTER + Math.sin(angle) * labelDist;

      html +=
        '<line x1="' +
        RADAR_CENTER +
        '" y1="' +
        RADAR_CENTER +
        '" x2="' +
        edge.x +
        '" y2="' +
        edge.y +
        '" stroke="rgba(148,163,184,0.12)" />';
      html +=
        '<text x="' +
        lx +
        '" y="' +
        ly +
        '" text-anchor="middle" dominant-baseline="middle" fill="rgba(226,232,240,0.7)" font-family="JetBrains Mono, monospace" font-size="10">' +
        escHtml(dimLabels[key] || key) +
        '</text>';
    });

    // Tech A polygon
    const aPts = DIM_KEYS.map((key, i) => {
      const val = dims[key] ? dims[key].a : 3;
      const p = getPoint(val, i);
      return p.x + ',' + p.y;
    }).join(' ');
    html +=
      '<polygon points="' +
      aPts +
      '" fill="' +
      comp.techA.color +
      '" fill-opacity="0.2" stroke="' +
      comp.techA.color +
      '" stroke-width="2.5" stroke-linejoin="round" />';

    // Tech B polygon
    const bPts = DIM_KEYS.map((key, i) => {
      const val = dims[key] ? dims[key].b : 3;
      const p = getPoint(val, i);
      return p.x + ',' + p.y;
    }).join(' ');
    html +=
      '<polygon points="' +
      bPts +
      '" fill="' +
      comp.techB.color +
      '" fill-opacity="0.2" stroke="' +
      comp.techB.color +
      '" stroke-width="2.5" stroke-linejoin="round" />';

    // Data points for Tech A
    DIM_KEYS.forEach((key, i) => {
      const val = dims[key] ? dims[key].a : 3;
      const p = getPoint(val, i);
      html +=
        '<circle cx="' +
        p.x +
        '" cy="' +
        p.y +
        '" r="4" fill="' +
        comp.techA.color +
        '" stroke="#0c0c14" stroke-width="1.5" />';
    });

    // Data points for Tech B
    DIM_KEYS.forEach((key, i) => {
      const val = dims[key] ? dims[key].b : 3;
      const p = getPoint(val, i);
      html +=
        '<circle cx="' +
        p.x +
        '" cy="' +
        p.y +
        '" r="4" fill="' +
        comp.techB.color +
        '" stroke="#0c0c14" stroke-width="1.5" />';
    });

    svg.innerHTML = html;

    // Render legend with dimension bars
    const legend = document.getElementById('tcRadarLegend');
    let legendHtml =
      '<div class="tc-legend-item">' +
      '<span class="tc-legend-swatch" style="background:' +
      comp.techA.color +
      '"></span>' +
      '<span>' +
      escHtml(comp.techA.name) +
      '</span>' +
      '</div>' +
      '<div class="tc-legend-item">' +
      '<span class="tc-legend-swatch" style="background:' +
      comp.techB.color +
      '"></span>' +
      '<span>' +
      escHtml(comp.techB.name) +
      '</span>' +
      '</div>' +
      '<div style="margin-top:0.5rem;border-top:1px solid var(--tc-border);padding-top:0.5rem"></div>';

    DIM_KEYS.forEach((key) => {
      const label = dimLabels[key] || key;
      const aVal = dims[key] ? dims[key].a : 3;
      const bVal = dims[key] ? dims[key].b : 3;
      legendHtml +=
        '<div class="tc-legend-dim">' +
        '<div class="tc-legend-dim-label">' +
        escHtml(label) +
        '</div>' +
        '<div class="tc-legend-dim-bar">' +
        '<span class="tc-bar-label" style="color:' +
        comp.techA.color +
        '">A:' +
        aVal +
        '</span>' +
        '<div class="tc-bar"><div class="tc-bar-fill" style="width:' +
        (aVal / RADAR_LEVELS) * 100 +
        '%;background:' +
        comp.techA.color +
        '"></div></div>' +
        '</div>' +
        '<div class="tc-legend-dim-bar">' +
        '<span class="tc-bar-label" style="color:' +
        comp.techB.color +
        '">B:' +
        bVal +
        '</span>' +
        '<div class="tc-bar"><div class="tc-bar-fill" style="width:' +
        (bVal / RADAR_LEVELS) * 100 +
        '%;background:' +
        comp.techB.color +
        '"></div></div>' +
        '</div>' +
        '</div>';
    });

    legend.innerHTML = legendHtml;
  }

  // ══════════════════════════════════════════
  // FEATURE TABLE
  // ══════════════════════════════════════════

  function renderFeatureTable(comp) {
    document.getElementById('tcThA').textContent = comp.techA.name;
    document.getElementById('tcThB').textContent = comp.techB.name;
    const body = document.getElementById('tcFeatureBody');
    body.innerHTML = '';

    if (!comp.features || comp.features.length === 0) {
      body.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--tc-text-muted);padding:2rem;">No feature data available.</td></tr>';
      return;
    }

    comp.features.forEach((f) => {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + escHtml(f.name) + '</td>' +
        '<td>' +
        (f.a ? '<span class="tc-feature-check"><i class="fas fa-check-circle"></i></span>' : '<span class="tc-feature-x"><i class="fas fa-times-circle"></i></span>') +
        '</td>' +
        '<td>' +
        (f.b ? '<span class="tc-feature-check"><i class="fas fa-check-circle"></i></span>' : '<span class="tc-feature-x"><i class="fas fa-times-circle"></i></span>') +
        '</td>' +
        '<td class="tc-feature-note">' + escHtml(f.note || '') + '</td>';
      body.appendChild(tr);
    });
  }

  // ══════════════════════════════════════════
  // SYNTAX COMPARISON
  // ══════════════════════════════════════════

  function renderSyntaxSelector(comp) {
    const select = document.getElementById('tcSyntaxSelect');
    const grid = document.getElementById('tcSyntaxGrid');
    select.innerHTML = '';

    if (!comp.syntaxExamples || comp.syntaxExamples.length === 0) {
      select.innerHTML = '<option value="">No syntax examples available</option>';
      document.getElementById('tcSyntaxA').querySelector('code').textContent = '';
      document.getElementById('tcSyntaxB').querySelector('code').textContent = '';
      return;
    }

    comp.syntaxExamples.forEach((ex, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = escHtml(ex.task);
      select.appendChild(opt);
    });

    select.addEventListener('change', () => {
      const idx = parseInt(select.value, 10);
      if (isNaN(idx)) return;
      const ex = comp.syntaxExamples[idx];
      if (!ex) return;
      document.getElementById('tcSyntaxA').querySelector('code').textContent = ex.a || '';
      document.getElementById('tcSyntaxB').querySelector('code').textContent = ex.b || '';
    });

    // Render first example
    const first = comp.syntaxExamples[0];
    if (first) {
      document.getElementById('tcSyntaxA').querySelector('code').textContent = first.a || '';
      document.getElementById('tcSyntaxB').querySelector('code').textContent = first.b || '';
    }

    // Style headers
    document.getElementById('tcSyntaxAHeader').textContent = comp.techA.name;
    document.getElementById('tcSyntaxAHeader').style.color = comp.techA.color;
    document.getElementById('tcSyntaxAHeader').style.borderColor = comp.techA.color + '44';

    document.getElementById('tcSyntaxBHeader').textContent = comp.techB.name;
    document.getElementById('tcSyntaxBHeader').style.color = comp.techB.color;
    document.getElementById('tcSyntaxBHeader').style.borderColor = comp.techB.color + '44';
  }

  // ══════════════════════════════════════════
  // MIGRATION GUIDE
  // ══════════════════════════════════════════

  function renderMigrationSteps(comp) {
    document.getElementById('tcMigrateA').textContent = comp.techA.name;
    document.getElementById('tcMigrateA').style.color = comp.techA.color;
    document.getElementById('tcMigrateB').textContent = comp.techB.name;
    document.getElementById('tcMigrateB').style.color = comp.techB.color;

    const container = document.getElementById('tcMigrationSteps');
    container.innerHTML = '';

    if (!comp.migrationGuide || comp.migrationGuide.length === 0) {
      container.innerHTML =
        '<p style="font-family:Inter,sans-serif;font-size:0.85rem;color:var(--tc-text-muted);padding:1rem 0;">Migration guide coming soon.</p>';
      return;
    }

    comp.migrationGuide.forEach((step, i) => {
      const div = document.createElement('div');
      div.className = 'tc-migration-step';
      div.innerHTML =
        '<div class="tc-migration-step-number">' + (i + 1) + '</div>' +
        '<div class="tc-migration-step-content"><h4>' +
        escHtml(step.step) +
        '</h4><p>' +
        escHtml(step.detail) +
        '</p></div>';
      container.appendChild(div);
    });
  }

  // ══════════════════════════════════════════
  // DECISION FLOW
  // ══════════════════════════════════════════

  function renderDecisionFlow(comp) {
    const flow = comp.decisionFlow || [];
    const questionEl = document.getElementById('tcDecisionQuestion');
    const optionsEl = document.getElementById('tcDecisionOptions');
    const resultEl = document.getElementById('tcDecisionResult');
    const prevBtn = document.getElementById('tcDecisionPrev');
    const nextBtn = document.getElementById('tcDecisionNext');
    const resetBtn = document.getElementById('tcDecisionReset');

    decisionStep = 0;
    decisionHistory = [];

    function showStep() {
      // Clear selection
      resultEl.style.display = 'none';
      resultEl.className = 'tc-decision-result';

      if (decisionStep >= flow.length) {
        // Show final summary
        questionEl.innerHTML = '<i class="fas fa-check-circle" style="color:var(--tc-pastel-green);margin-right:0.4rem;"></i> Decision Summary';
        optionsEl.innerHTML = '';
        prevBtn.style.display = 'inline-flex';
        nextBtn.style.display = 'none';
        resetBtn.style.display = 'inline-flex';

        let summaryHtml = '<div style="margin-top:0.5rem;">';
        decisionHistory.forEach((item, i) => {
          summaryHtml +=
            '<div style="padding:0.5rem;margin-bottom:0.5rem;border-radius:6px;background:rgba(148,163,184,0.04);border:1px solid var(--tc-border-light);">' +
            '<div style="font-size:0.75rem;color:var(--tc-text-dim);margin-bottom:0.25rem;">Q' +
            (i + 1) +
            ': ' +
            escHtml(item.question) +
            '</div>' +
            '<div style="font-size:0.85rem;color:var(--tc-pastel-green);">→ ' +
            escHtml(item.result) +
            '</div>' +
            '</div>';
        });
        summaryHtml += '</div>';
        resultEl.innerHTML = summaryHtml;
        resultEl.style.display = 'block';
        return;
      }

      const q = flow[decisionStep];
      questionEl.textContent = q.question;
      optionsEl.innerHTML = '';
      prevBtn.style.display = decisionStep > 0 ? 'inline-flex' : 'none';
      nextBtn.style.display = 'none';
      resetBtn.style.display = 'inline-flex';

      q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tc-decision-opt';
        btn.innerHTML =
          '<span class="tc-decision-opt-indicator"></span><span>' + escHtml(opt.label) + '</span>';
        btn.addEventListener('click', () => {
          // Select this option
          optionsEl.querySelectorAll('.tc-decision-opt').forEach((o) => o.classList.remove('selected'));
          btn.classList.add('selected');
          // Store result
          decisionHistory[decisionStep] = {
            question: q.question,
            result: opt.result,
            label: opt.label,
          };
          // Show result for current step
          resultEl.innerHTML = '<i class="fas fa-lightbulb" style="margin-right:0.4rem;"></i> ' + escHtml(opt.result);
          resultEl.style.display = 'block';
          // Show next button
          nextBtn.style.display = 'inline-flex';
          nextBtn.textContent = decisionStep < flow.length - 1 ? 'Next' : 'See Summary';
        });
        optionsEl.appendChild(btn);
      });
    }

    showStep();

    prevBtn.onclick = () => {
      if (decisionStep > 0) {
        decisionStep--;
        showStep();
      }
    };

    nextBtn.onclick = () => {
      if (decisionStep < flow.length) {
        decisionStep++;
        showStep();
      }
    };

    resetBtn.onclick = () => {
      decisionStep = 0;
      decisionHistory = [];
      showStep();
    };
  }

  // ══════════════════════════════════════════
  // SEARCH
  // ══════════════════════════════════════════

  searchInput.addEventListener('input', () => {
    clearBtn.classList.toggle('visible', searchInput.value.length > 0);
    comparisonView.style.display = 'none';
    renderPickerCards(filterComparisons());
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.classList.remove('visible');
    comparisonView.style.display = 'none';
    renderPickerCards(filterComparisons());
    searchInput.focus();
  });

  // Keyboard shortcut: ⌘K / Ctrl+K
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key === 'Escape') {
      searchInput.blur();
    }
  });

  // ══════════════════════════════════════════
  // URL PARAM SHARING
  // ══════════════════════════════════════════

  function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const techId = params.get('tech');
    if (techId && data.find((c) => c.id === techId)) {
      loadComparison(techId);
    } else {
      // Restore picker view when no comparison is selected
      const heroContent = document.querySelector('.tc-hero-content');
      if (heroContent) heroContent.style.display = '';
      const pickerEl = document.getElementById('tcPicker');
      if (pickerEl) pickerEl.style.display = '';
      const comparisonEl = document.getElementById('tcComparison');
      if (comparisonEl) comparisonEl.style.display = 'none';
    }
  }

  // Share button
  document.getElementById('tcShareBtn').addEventListener('click', () => {
    if (!activeComparison) return;
    const url = new URL(window.location);
    url.searchParams.set('tech', activeComparison.id);
    const btn = document.getElementById('tcShareBtn');
    navigator.clipboard.writeText(url.toString()).then(
      () => {
        showToast('Link copied! Share it with your team.', 'success');
        btn.classList.add('copied');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = originalHtml;
        }, 2000);
      },
      () => showToast('Could not copy link.', 'error')
    );
  });

  // ══════════════════════════════════════════
  // TOAST NOTIFICATION
  // ══════════════════════════════════════════

  function showToast(msg, type) {
    const existing = document.querySelector('.tc-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'tc-toast tc-toast-' + (type || 'success');
    toast.innerHTML =
      (type === 'success' ? '<i class="fas fa-check-circle" style="color:var(--tc-pastel-green)"></i>' : '<i class="fas fa-exclamation-circle" style="color:var(--tc-pastel-rose)"></i>') +
      ' ' +
      escHtml(msg);
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // ══════════════════════════════════════════
  // UTILITY
  // ══════════════════════════════════════════

  function escHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    handleUrlParams();
    const urlCat = new URLSearchParams(window.location.search).get('category');
    if (!urlCat) {
      filterContainer.querySelectorAll('.tc-filter-chip').forEach((c) => {
        c.classList.toggle('active', c.dataset.category === 'all');
      });
    }
  });
});
