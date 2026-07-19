/**
 * CSS Design Token Playground
 * Edit AIV :root tokens and preview on quiz card + navbar.
 */
(function () {
  'use strict';

  const DEFAULTS = {
    '--primary': '#7c3aed',
    '--primary-light': '#a78bfa',
    '--secondary': '#3b82f6',
    '--accent': '#06b6d4',
    '--dark-bg': '#0a0a1a',
    '--dark-surface': '#1a1a3e',
    '--dark-card': '#252550',
    '--text-primary': '#ffffff',
    '--text-secondary': '#a1a1aa',
    '--font-display': "'Orbitron', sans-serif",
    '--font-body': "'Poppins', sans-serif",
    '--font-mono': "'Fira Code', monospace",
    '--space-sm': '0.5rem',
    '--space-md': '1rem',
    '--space-lg': '1.5rem',
    '--radius': '12px',
  };

  const TOKEN_GROUPS = [
    {
      title: 'Colors (README Customization)',
      tokens: [
        { key: '--primary', type: 'color', label: 'Primary brand color' },
        { key: '--primary-light', type: 'color', label: 'Lighter primary for text/highlights' },
        { key: '--secondary', type: 'color', label: 'Secondary actions & links' },
        { key: '--accent', type: 'color', label: 'Accent / focus accents' },
        { key: '--dark-bg', type: 'color', label: 'Page background' },
        { key: '--dark-surface', type: 'color', label: 'Navbar / surface panels' },
        { key: '--dark-card', type: 'color', label: 'Card surfaces (quiz)' },
        { key: '--text-primary', type: 'color', label: 'Primary text' },
        { key: '--text-secondary', type: 'color', label: 'Muted / secondary text' },
      ],
    },
    {
      title: 'Fonts',
      tokens: [
        {
          key: '--font-display',
          type: 'font',
          label: 'Display / headings',
          options: [
            { value: "'Orbitron', sans-serif", label: 'Orbitron (default)' },
            { value: "'Space Grotesk', sans-serif", label: 'Space Grotesk' },
            { value: "'Inter', sans-serif", label: 'Inter' },
            { value: "'Poppins', sans-serif", label: 'Poppins' },
          ],
        },
        {
          key: '--font-body',
          type: 'font',
          label: 'Body UI text',
          options: [
            { value: "'Poppins', sans-serif", label: 'Poppins (default)' },
            { value: "'Inter', sans-serif", label: 'Inter' },
            { value: "'Space Grotesk', sans-serif", label: 'Space Grotesk' },
          ],
        },
        {
          key: '--font-mono',
          type: 'font',
          label: 'Code / mono',
          options: [
            { value: "'Fira Code', monospace", label: 'Fira Code (default)' },
            { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono' },
            { value: 'ui-monospace, monospace', label: 'System mono' },
          ],
        },
      ],
    },
    {
      title: 'Spacing & radius',
      tokens: [
        { key: '--space-sm', type: 'spacing', label: 'Small gap', min: 0.25, max: 1.25, step: 0.05, unit: 'rem' },
        { key: '--space-md', type: 'spacing', label: 'Medium gap', min: 0.5, max: 2, step: 0.05, unit: 'rem' },
        { key: '--space-lg', type: 'spacing', label: 'Large gap', min: 0.75, max: 3, step: 0.05, unit: 'rem' },
        { key: '--radius', type: 'spacing', label: 'Corner radius', min: 0, max: 24, step: 1, unit: 'px' },
      ],
    },
  ];

  const SWATCH_KEYS = [
    '--primary',
    '--primary-light',
    '--secondary',
    '--accent',
    '--dark-bg',
    '--dark-surface',
    '--dark-card',
    '--text-primary',
    '--text-secondary',
  ];

  let state = { ...DEFAULTS };
  let previewTheme = 'dark';
  let lightColorOverrides = null;

  function $(id) {
    return document.getElementById(id);
  }

  function hexToRgb(hex) {
    const m = String(hex).trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!m) return null;
    let h = m[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  function normalizeHex(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const to = (n) => n.toString(16).padStart(2, '0');
    return `#${to(rgb.r)}${to(rgb.g)}${to(rgb.b)}`;
  }

  function parseSpacing(value, unit) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : unit === 'px' ? 12 : 1;
  }

  function applyTokens() {
    const root = $('dtpPreview');
    if (!root) return;

    const effective = { ...state };

    // In light preview, keep user color edits for brand tokens but soft-swap surfaces if still at dark defaults
    if (previewTheme === 'light') {
      if (!lightColorOverrides) {
        lightColorOverrides = {
          '--dark-bg': state['--dark-bg'] === DEFAULTS['--dark-bg'] ? '#f8fafc' : state['--dark-bg'],
          '--dark-surface': state['--dark-surface'] === DEFAULTS['--dark-surface'] ? '#ffffff' : state['--dark-surface'],
          '--dark-card': state['--dark-card'] === DEFAULTS['--dark-card'] ? '#ffffff' : state['--dark-card'],
          '--text-primary': state['--text-primary'] === DEFAULTS['--text-primary'] ? '#0f172a' : state['--text-primary'],
          '--text-secondary': state['--text-secondary'] === DEFAULTS['--text-secondary'] ? '#64748b' : state['--text-secondary'],
        };
      }
      Object.assign(effective, lightColorOverrides);
    }

    Object.entries(effective).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    const rgb = hexToRgb(effective['--primary'] || state['--primary']);
    if (rgb) {
      root.style.setProperty('--primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }

    root.dataset.previewTheme = previewTheme;
    updateSnippet();
    updateSwatches(effective);
  }

  function updateSnippet() {
    const lines = Object.entries(state).map(([k, v]) => `  ${k}: ${v};`);
    const rgb = hexToRgb(state['--primary']);
    if (rgb) {
      lines.splice(1, 0, `  --primary-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};`);
    }
    const css = `:root {\n${lines.join('\n')}\n}`;
    const ta = $('dtpSnippet');
    if (ta) ta.value = css;
  }

  function updateSwatches(effective) {
    const wrap = $('dtpSwatches');
    if (!wrap) return;
    wrap.innerHTML = SWATCH_KEYS.map((key) => {
      const color = effective[key] || state[key];
      return `<div class="dtp-swatch">
        <div class="dtp-swatch-chip" style="background:${color}"></div>
        <div class="dtp-swatch-label">${key}</div>
      </div>`;
    }).join('');
  }

  function buildEditors() {
    const container = $('dtpTokenGroups');
    if (!container) return;
    container.innerHTML = '';

    TOKEN_GROUPS.forEach((group) => {
      const section = document.createElement('div');
      section.className = 'dtp-group';
      section.innerHTML = `<h3 class="dtp-group-title">${group.title}</h3>`;

      group.tokens.forEach((token) => {
        const row = document.createElement('div');
        row.className = 'dtp-token-row';

        const meta = document.createElement('div');
        meta.className = 'dtp-token-meta';
        meta.innerHTML = `<span class="dtp-token-name">${token.key}</span>
          <span class="dtp-token-desc">${token.label}</span>`;

        const controls = document.createElement('div');
        controls.className = 'dtp-token-controls';

        if (token.type === 'color') {
          const color = document.createElement('input');
          color.type = 'color';
          color.className = 'dtp-color-input';
          color.value = normalizeHex(state[token.key]);
          color.setAttribute('aria-label', `${token.key} color picker`);

          const text = document.createElement('input');
          text.type = 'text';
          text.className = 'dtp-text-input';
          text.value = state[token.key];
          text.setAttribute('aria-label', `${token.key} hex value`);
          text.spellcheck = false;

          const sync = (val) => {
            const hex = normalizeHex(val);
            state[token.key] = hex.startsWith('#') ? hex : val;
            if (hexToRgb(hex)) {
              color.value = normalizeHex(hex);
              text.value = normalizeHex(hex);
            } else {
              text.value = val;
            }
            if (previewTheme === 'light' && lightColorOverrides && token.key in lightColorOverrides) {
              lightColorOverrides[token.key] = state[token.key];
            }
            applyTokens();
          };

          color.addEventListener('input', () => sync(color.value));
          text.addEventListener('change', () => sync(text.value.trim()));
          text.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              sync(text.value.trim());
            }
          });

          controls.appendChild(color);
          controls.appendChild(text);
        } else if (token.type === 'font') {
          const select = document.createElement('select');
          select.className = 'dtp-select';
          select.setAttribute('aria-label', token.key);
          token.options.forEach((opt) => {
            const o = document.createElement('option');
            o.value = opt.value;
            o.textContent = opt.label;
            if (opt.value === state[token.key]) o.selected = true;
            select.appendChild(o);
          });
          select.addEventListener('change', () => {
            state[token.key] = select.value;
            applyTokens();
          });
          controls.appendChild(select);
        } else if (token.type === 'spacing') {
          const wrap = document.createElement('div');
          wrap.className = 'dtp-range-wrap';
          const range = document.createElement('input');
          range.type = 'range';
          range.className = 'dtp-range';
          range.min = String(token.min);
          range.max = String(token.max);
          range.step = String(token.step);
          range.value = String(parseSpacing(state[token.key], token.unit));
          range.setAttribute('aria-label', token.key);

          const val = document.createElement('span');
          val.className = 'dtp-range-val';
          val.textContent = state[token.key];

          range.addEventListener('input', () => {
            const n = Number(range.value);
            const formatted = token.unit === 'px' ? `${Math.round(n)}px` : `${n.toFixed(2).replace(/\.?0+$/, '')}rem`;
            state[token.key] = formatted;
            val.textContent = formatted;
            applyTokens();
          });

          wrap.appendChild(range);
          wrap.appendChild(val);
          controls.appendChild(wrap);
        }

        row.appendChild(meta);
        row.appendChild(controls);
        section.appendChild(row);
      });

      container.appendChild(section);
    });
  }

  function resetTokens() {
    state = { ...DEFAULTS };
    lightColorOverrides = null;
    buildEditors();
    applyTokens();
    const status = $('dtpCopyStatus');
    if (status) status.textContent = 'Reset to AIV defaults';
    setTimeout(() => {
      if (status && status.textContent === 'Reset to AIV defaults') status.textContent = '';
    }, 2000);
  }

  async function copySnippet() {
    const css = $('dtpSnippet')?.value || '';
    const status = $('dtpCopyStatus');
    try {
      await navigator.clipboard.writeText(css);
      if (status) status.textContent = 'Copied!';
    } catch {
      $('dtpSnippet')?.select();
      document.execCommand('copy');
      if (status) status.textContent = 'Copied!';
    }
    setTimeout(() => {
      if (status) status.textContent = '';
    }, 2000);
  }

  function setPreviewTheme(theme) {
    previewTheme = theme;
    lightColorOverrides = null;
    document.querySelectorAll('.dtp-theme-btn').forEach((btn) => {
      const on = btn.dataset.theme === theme;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    applyTokens();
  }

  function initQuizOptionClicks() {
    document.querySelectorAll('.dtp-quiz-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dtp-quiz-option').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  }

  function init() {
    buildEditors();
    applyTokens();
    initQuizOptionClicks();

    $('dtpResetBtn')?.addEventListener('click', resetTokens);
    $('dtpCopyBtn')?.addEventListener('click', copySnippet);
    $('dtpThemeDark')?.addEventListener('click', () => setPreviewTheme('dark'));
    $('dtpThemeLight')?.addEventListener('click', () => setPreviewTheme('light'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
