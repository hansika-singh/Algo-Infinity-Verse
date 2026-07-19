/**
 * Accessibility Audit Toolkit
 * WCAG 2.2–aligned checks for Algo Infinity Verse visualizer pages.
 */
(function () {
  'use strict';

  const DEMO_VISUALIZERS = [
    { name: 'AVL Tree', path: '/pages/visualizers/avl-tree/avl-tree.html' },
    { name: 'BFS / DFS', path: '/pages/visualizers/bfs-dfs-visualizer/bfs-dfs-visualizer.html' },
    { name: 'Sorting Visualizer', path: '/pages/visualizers/sorting-visualizer/sorting-visualizer.html' },
    { name: 'A* Pathfinding', path: '/pages/visualizers/astar-pathfinding/astar-pathfinding.html' },
    { name: 'Bellman-Ford', path: '/pages/visualizers/bellman-ford-visualizer/bellman-ford-visualizer.html' },
    { name: 'Fenwick Tree', path: '/pages/visualizers/fenwick-tree/fenwick-tree.html' },
    { name: 'Linked List', path: '/pages/visualizers/linked-list-visualizer/linked-list-visualizer.html' },
    { name: 'Pathfinding Arena', path: '/pages/visualizers/pathfinding-arena/pathfinding-arena.html' },
    { name: 'Binary Search Boundaries', path: '/pages/visualizers/binary-search-boundaries/binary-search-boundaries.html' },
    { name: 'Trie Visualizer', path: '/pages/visualizers/trie-visualizer/trie-visualizer.html' },
  ];

  const SELECTOR_VISUALIZERS = [
    ...DEMO_VISUALIZERS,
    { name: 'Circuit Breaker', path: '/pages/visualizers/circuit-breaker/circuit-breaker.html' },
    { name: 'Kafka Simulator', path: '/pages/visualizers/kafka-simulator/kafka-simulator.html' },
    { name: 'Bloom Filter', path: '/pages/visualizers/bloom-filter-visualizer/bloom-filter-visualizer.html' },
    { name: 'Big-O Analyzer', path: '/pages/visualizers/big-o-analyzer/big-o-analyzer.html' },
  ];

  const ARIA_ROLES_NEEDING_NAME = new Set([
    'button', 'link', 'checkbox', 'radio', 'menuitem', 'tab', 'option',
    'switch', 'textbox', 'searchbox', 'combobox', 'slider', 'spinbutton',
  ]);

  const VALID_ARIA_ROLES = new Set([
    'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
    'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
    'contentinfo', 'definition', 'dialog', 'directory', 'document',
    'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
    'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
    'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
    'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
    'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
    'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
    'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist',
    'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree',
    'treegrid', 'treeitem',
  ]);

  let lastReports = [];
  let activeSeverity = 'all';
  let activeTab = 'visualizer';

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cssPath(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return `#${CSS.escape(el.id)}`;
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 4) {
      let part = node.tagName.toLowerCase();
      if (node.classList && node.classList.length) {
        part += '.' + [...node.classList].slice(0, 2).map((c) => CSS.escape(c)).join('.');
      }
      const parent = node.parentElement;
      if (parent) {
        const siblings = [...parent.children].filter((c) => c.tagName === node.tagName);
        if (siblings.length > 1) {
          part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
        }
      }
      parts.unshift(part);
      node = parent;
      if (node && node.tagName === 'BODY') break;
    }
    return parts.join(' > ');
  }

  function issue(severity, category, rule, title, detail, fix, selector) {
    return { severity, category, rule, title, detail, fix, selector: selector || '' };
  }

  /* ─── Color / contrast helpers ─── */

  function parseColor(input) {
    if (!input || typeof input !== 'string') return null;
    const s = input.trim().toLowerCase();
    if (s === 'transparent' || s === 'inherit' || s === 'initial' || s === 'currentcolor') return null;

    let m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
    if (m) {
      let hex = m[1];
      if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
      if (hex.length === 8) hex = hex.slice(0, 6);
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }

    m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/);
    if (m) {
      const a = m[4] !== undefined ? Number(m[4]) : 1;
      if (a < 0.2) return null;
      return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
    }

    const named = {
      white: { r: 255, g: 255, b: 255 },
      black: { r: 0, g: 0, b: 0 },
      red: { r: 255, g: 0, b: 0 },
      gray: { r: 128, g: 128, b: 128 },
      grey: { r: 128, g: 128, b: 128 },
      silver: { r: 192, g: 192, b: 192 },
      navy: { r: 0, g: 0, b: 128 },
    };
    return named[s] || null;
  }

  function channelLum(c) {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }

  function relativeLuminance(rgb) {
    return 0.2126 * channelLum(rgb.r) + 0.7152 * channelLum(rgb.g) + 0.0722 * channelLum(rgb.b);
  }

  function contrastRatio(fg, bg) {
    const L1 = relativeLuminance(fg);
    const L2 = relativeLuminance(bg);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function extractInlineColors(styleAttr) {
    if (!styleAttr) return {};
    const out = {};
    const colorMatch = styleAttr.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    const bgMatch = styleAttr.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/i);
    if (colorMatch) out.color = colorMatch[1].trim();
    if (bgMatch) out.background = bgMatch[1].trim();
    return out;
  }

  function collectStyleRules(doc) {
    const rules = [];
    doc.querySelectorAll('style').forEach((styleEl) => {
      const css = styleEl.textContent || '';
      const re = /([^{}]+)\{([^}]*)\}/g;
      let m;
      while ((m = re.exec(css))) {
        const selector = m[1].trim();
        const body = m[2];
        const colors = extractInlineColors(body.replace(/\n/g, ' '));
        if (colors.color || colors.background) {
          rules.push({ selector, ...colors });
        }
      }
    });
    return rules;
  }

  /* ─── Auditors ─── */

  function auditHeadings(doc) {
    const issues = [];
    const headings = [...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')];

    if (headings.length === 0) {
      issues.push(issue(
        'serious',
        'Headings',
        'WCAG 1.3.1 / 2.4.6',
        'No heading elements found',
        'The document has no h1–h6 headings, which makes structure hard to navigate with assistive tech.',
        'Add a single page-level <h1> and nest section headings without skipping levels.',
      ));
      return issues;
    }

    const h1s = headings.filter((h) => h.tagName === 'H1');
    if (h1s.length === 0) {
      issues.push(issue(
        'serious',
        'Headings',
        'WCAG 2.4.6',
        'Missing h1',
        'Page starts without a top-level heading.',
        'Provide one descriptive <h1> that names the visualizer or page purpose.',
        cssPath(headings[0]),
      ));
    } else if (h1s.length > 1) {
      issues.push(issue(
        'moderate',
        'Headings',
        'WCAG 2.4.6',
        'Multiple h1 elements',
        `Found ${h1s.length} <h1> elements. Prefer a single primary heading per page.`,
        'Keep one <h1> and demote secondary titles to <h2>–<h3>.',
        cssPath(h1s[1]),
      ));
    }

    let prevLevel = 0;
    headings.forEach((h) => {
      const level = Number(h.tagName[1]);
      const text = (h.textContent || '').trim();
      if (!text) {
        issues.push(issue(
          'moderate',
          'Headings',
          'WCAG 2.4.6',
          'Empty heading',
          `${h.tagName.toLowerCase()} has no accessible text.`,
          'Add visible text or an accessible name; remove empty headings.',
          cssPath(h),
        ));
      }
      if (prevLevel && level > prevLevel + 1) {
        issues.push(issue(
          'moderate',
          'Headings',
          'WCAG 1.3.1',
          'Skipped heading level',
          `Jumped from h${prevLevel} to h${level}${text ? ` (“${text.slice(0, 60)}”)` : ''}.`,
          `Use h${prevLevel + 1} instead of h${level}, or insert the missing intermediate level.`,
          cssPath(h),
        ));
      }
      prevLevel = level;
    });

    return issues;
  }

  function auditAltText(doc) {
    const issues = [];

    doc.querySelectorAll('img').forEach((img) => {
      const hasAlt = img.hasAttribute('alt');
      const alt = img.getAttribute('alt');
      const inLink = !!img.closest('a, button');
      const decorative = img.getAttribute('role') === 'presentation' || img.getAttribute('aria-hidden') === 'true';

      if (!hasAlt && !decorative) {
        issues.push(issue(
          inLink ? 'critical' : 'serious',
          'Alt text',
          'WCAG 1.1.1',
          'Image missing alt attribute',
          `Image${img.src ? ` (${img.src.split('/').pop()})` : ''} has no alt text.`,
          inLink
            ? 'Add alt that describes the link purpose, or put the accessible name on the parent link.'
            : 'Add meaningful alt text, or alt="" if the image is purely decorative.',
          cssPath(img),
        ));
      } else if (hasAlt && alt && /^(image|img|picture|photo|graphic)$/i.test(alt.trim())) {
        issues.push(issue(
          'moderate',
          'Alt text',
          'WCAG 1.1.1',
          'Non-descriptive alt text',
          `alt="${alt}" does not describe the image content.`,
          'Describe what the image conveys (e.g. “AVL tree after left rotation”).',
          cssPath(img),
        ));
      }
    });

    doc.querySelectorAll('canvas').forEach((canvas) => {
      const named =
        canvas.hasAttribute('aria-label') ||
        canvas.hasAttribute('aria-labelledby') ||
        canvas.getAttribute('role') === 'img' && canvas.hasAttribute('aria-label');
      const title = canvas.querySelector('title');
      if (!named && !title) {
        const roleImg = canvas.getAttribute('role') === 'img';
        issues.push(issue(
          roleImg ? 'critical' : 'serious',
          'Alt text',
          'WCAG 1.1.1',
          'Canvas without accessible name',
          'Interactive or informative canvas has no aria-label / aria-labelledby.',
          'Add role="img" (if static) or describe the live region; always provide an accessible name.',
          cssPath(canvas),
        ));
      }
    });

    doc.querySelectorAll('svg').forEach((svg) => {
      const decorative = svg.getAttribute('aria-hidden') === 'true' || svg.getAttribute('role') === 'presentation';
      if (decorative) return;
      const named =
        svg.hasAttribute('aria-label') ||
        svg.hasAttribute('aria-labelledby') ||
        svg.querySelector('title');
      const inButton = !!svg.closest('button, a, [role="button"]');
      if (!named && !inButton) {
        issues.push(issue(
          'moderate',
          'Alt text',
          'WCAG 1.1.1',
          'SVG missing accessible name',
          'Non-decorative SVG has no <title> or aria-label.',
          'Add <title> inside the SVG or aria-label; use aria-hidden="true" for decorative icons.',
          cssPath(svg),
        ));
      }
    });

    doc.querySelectorAll('video, audio').forEach((media) => {
      const hasTrack = media.querySelector('track[kind="captions"], track[kind="subtitles"]');
      if (media.tagName === 'VIDEO' && !hasTrack) {
        issues.push(issue(
          'serious',
          'Alt text',
          'WCAG 1.2.2',
          'Video without captions track',
          'Video element has no captions/subtitles <track>.',
          'Add <track kind="captions"> or ensure equivalent caption UI is provided.',
          cssPath(media),
        ));
      }
    });

    return issues;
  }

  function auditContrast(doc) {
    const issues = [];
    const styleRules = collectStyleRules(doc);
    const seen = new Set();

    function flagPair(fgStr, bgStr, selector, context) {
      const fg = parseColor(fgStr);
      const bg = parseColor(bgStr);
      if (!fg || !bg) return;
      const ratio = contrastRatio(fg, bg);
      const key = `${selector}|${fgStr}|${bgStr}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (ratio < 3) {
        issues.push(issue(
          'critical',
          'Contrast',
          'WCAG 1.4.3',
          'Very low color contrast',
          `${context}: contrast ratio ${ratio.toFixed(2)}:1 (needs ≥ 4.5:1 for normal text, ≥ 3:1 for large/UI).`,
          'Darken text or lighten the background until the ratio meets WCAG AA.',
          selector,
        ));
      } else if (ratio < 4.5) {
        issues.push(issue(
          'serious',
          'Contrast',
          'WCAG 1.4.3',
          'Insufficient text contrast',
          `${context}: contrast ratio ${ratio.toFixed(2)}:1 — below 4.5:1 AA for normal text.`,
          'Increase contrast to at least 4.5:1 (or 3:1 if text is ≥18pt / bold 14pt).',
          selector,
        ));
      }
    }

    doc.querySelectorAll('[style]').forEach((el) => {
      const colors = extractInlineColors(el.getAttribute('style'));
      if (colors.color && colors.background) {
        flagPair(colors.color, colors.background, cssPath(el), 'Inline styles');
      }
    });

    styleRules.forEach((rule) => {
      if (rule.color && rule.background) {
        flagPair(rule.color, rule.background, rule.selector, 'Stylesheet rule');
      }
    });

    // Heuristic: body/default dark theme pairs often used in visualizers
    const bodyStyle = doc.body ? extractInlineColors(doc.body.getAttribute('style') || '') : {};
    const htmlStyleEl = [...doc.querySelectorAll('style')].map((s) => s.textContent || '').join('\n');
    const bodyBgMatch = htmlStyleEl.match(/body\s*\{[^}]*background(?:-color)?\s*:\s*([^;}+]+)/i);
    const bodyColorMatch = htmlStyleEl.match(/body\s*\{[^}]*?(?:^|[;{])\s*color\s*:\s*([^;}+]+)/i);
    const bodyBg = bodyStyle.background || (bodyBgMatch && bodyBgMatch[1].trim());
    const bodyColor = bodyStyle.color || (bodyColorMatch && bodyColorMatch[1].trim());
    if (bodyBg && bodyColor) {
      flagPair(bodyColor, bodyBg, 'body', 'Body text on background');
    }

    // Sample muted text colors against common dark backgrounds
    const mutedRe = /(?:\.[\w-]+|p|span|label|small)\s*\{[^}]*color\s*:\s*([^;]+)/gi;
    let mm;
    const darkDefaults = ['#0a0a14', '#0f172a', '#111827', '#000000', 'rgb(10,10,20)'];
    while ((mm = mutedRe.exec(htmlStyleEl))) {
      const colorVal = mm[1].trim();
      darkDefaults.forEach((bg) => {
        const fg = parseColor(colorVal);
        const bgc = parseColor(bg);
        if (!fg || !bgc) return;
        const ratio = contrastRatio(fg, bgc);
        if (ratio < 4.5 && ratio >= 3) {
          const key = `muted|${colorVal}|${bg}`;
          if (seen.has(key)) return;
          seen.add(key);
          issues.push(issue(
            'moderate',
            'Contrast',
            'WCAG 1.4.3',
            'Possible low-contrast muted text',
            `Color ${colorVal} vs common dark background ${bg} ≈ ${ratio.toFixed(2)}:1.`,
            'Verify muted helper text still meets 4.5:1, or reserve low-contrast colors for non-essential decoration only.',
            colorVal,
          ));
        }
      });
    }

    return issues;
  }

  function isFocusable(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') return false;
    const tabindex = el.getAttribute('tabindex');
    if (tabindex !== null && Number(tabindex) < 0) return false;
    const tag = el.tagName;
    if (['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY'].includes(tag)) {
      if (tag === 'A' && !el.hasAttribute('href') && tabindex === null) return false;
      return true;
    }
    if (tabindex !== null) return true;
    const role = el.getAttribute('role');
    if (role && ARIA_ROLES_NEEDING_NAME.has(role) && tabindex !== null) return true;
    return false;
  }

  function accessibleName(el) {
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const text = labelledBy
        .split(/\s+/)
        .map((id) => el.ownerDocument.getElementById(id))
        .filter(Boolean)
        .map((n) => (n.textContent || '').trim())
        .join(' ');
      if (text) return text;
    }
    if (el.tagName === 'IMG') return (el.getAttribute('alt') || '').trim();
    if (el.tagName === 'INPUT') {
      if (el.getAttribute('aria-label')) return el.getAttribute('aria-label').trim();
      const id = el.id;
      if (id) {
        const label = el.ownerDocument.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (label) return (label.textContent || '').trim();
      }
      return (el.getAttribute('placeholder') || el.getAttribute('title') || el.value || '').trim();
    }
    const title = el.getAttribute('title');
    if (title && title.trim()) return title.trim();
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function auditFocus(doc) {
    const issues = [];
    const focusables = [...doc.querySelectorAll(
      'a[href], button, input, select, textarea, summary, [tabindex], [role="button"], [role="link"], [role="tab"], [role="menuitem"]',
    )].filter(isFocusable);

    focusables.forEach((el) => {
      const tab = el.getAttribute('tabindex');
      if (tab !== null && Number(tab) > 0) {
        issues.push(issue(
          'serious',
          'Focus',
          'WCAG 2.4.3',
          'Positive tabindex disrupts focus order',
          `tabindex="${tab}" forces an unnatural tab sequence.`,
          'Use tabindex="0" (or omit it) and rely on DOM order for keyboard navigation.',
          cssPath(el),
        ));
      }

      const name = accessibleName(el);
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role');
      const needsName =
        ['button', 'a'].includes(tag) ||
        (role && ARIA_ROLES_NEEDING_NAME.has(role)) ||
        (tag === 'input' && !['hidden', 'submit', 'button', 'reset'].includes((el.type || '').toLowerCase()));

      if (needsName && !name) {
        issues.push(issue(
          'critical',
          'Focus',
          'WCAG 4.1.2 / 2.4.4',
          'Focusable control without accessible name',
          `<${tag}${role ? ` role="${role}"` : ''}> is keyboard-focusable but has no accessible name.`,
          'Add visible text, aria-label, aria-labelledby, or an associated <label>.',
          cssPath(el),
        ));
      }
    });

    doc.querySelectorAll('[onclick], [ondblclick]').forEach((el) => {
      if (isFocusable(el)) return;
      const tag = el.tagName;
      if (['SCRIPT', 'BODY', 'HTML'].includes(tag)) return;
      issues.push(issue(
        'serious',
        'Focus',
        'WCAG 2.1.1',
        'Click handler on non-focusable element',
        `<${tag.toLowerCase()}> has an inline click handler but is not keyboard accessible.`,
        'Use <button>, add tabindex="0" with keyboard handlers, or move the handler to a native control.',
        cssPath(el),
      ));
    });

    // Icon-only buttons without aria-label
    doc.querySelectorAll('button').forEach((btn) => {
      const text = (btn.textContent || '').replace(/\s+/g, ' ').trim();
      const hasIcon = !!btn.querySelector('i, svg, img');
      if (hasIcon && !text && !accessibleName(btn)) {
        issues.push(issue(
          'critical',
          'Focus',
          'WCAG 4.1.2',
          'Icon-only button missing name',
          'Button contains only an icon with no accessible name.',
          'Add aria-label (e.g. “Play algorithm”) or visually hidden text.',
          cssPath(btn),
        ));
      }
    });

    return issues;
  }

  function auditAria(doc) {
    const issues = [];
    const ids = new Map();

    doc.querySelectorAll('[id]').forEach((el) => {
      const id = el.id;
      if (!id) return;
      if (ids.has(id)) {
        issues.push(issue(
          'serious',
          'ARIA',
          'WCAG 4.1.1',
          'Duplicate id attribute',
          `id="${id}" appears more than once.`,
          'Make every id unique so aria-labelledby / labels resolve correctly.',
          cssPath(el),
        ));
      } else {
        ids.set(id, el);
      }
    });

    doc.querySelectorAll('[role]').forEach((el) => {
      const role = (el.getAttribute('role') || '').trim().toLowerCase();
      if (!role) return;
      if (!VALID_ARIA_ROLES.has(role)) {
        issues.push(issue(
          'serious',
          'ARIA',
          'WCAG 4.1.2',
          'Invalid ARIA role',
          `role="${role}" is not a valid WAI-ARIA role.`,
          'Use a valid role or prefer native HTML semantics.',
          cssPath(el),
        ));
      }

      if (ARIA_ROLES_NEEDING_NAME.has(role) && !accessibleName(el)) {
        issues.push(issue(
          'critical',
          'ARIA',
          'WCAG 4.1.2',
          'ARIA widget missing accessible name',
          `Element with role="${role}" has no accessible name.`,
          'Provide aria-label or aria-labelledby (and ensure the element is keyboard operable).',
          cssPath(el),
        ));
      }
    });

    doc.querySelectorAll('[aria-labelledby], [aria-describedby], [aria-controls], [aria-owns]').forEach((el) => {
      ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns'].forEach((attr) => {
        const val = el.getAttribute(attr);
        if (!val) return;
        val.split(/\s+/).forEach((id) => {
          if (!id) return;
          if (!doc.getElementById(id)) {
            issues.push(issue(
              'serious',
              'ARIA',
              'WCAG 1.3.1 / 4.1.2',
              `Broken ${attr} reference`,
              `${attr} points to missing id="${id}".`,
              'Fix the id reference or remove the attribute.',
              cssPath(el),
            ));
          }
        });
      });
    });

    doc.querySelectorAll('[aria-hidden="true"]').forEach((el) => {
      if (isFocusable(el) || el.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')) {
        issues.push(issue(
          'critical',
          'ARIA',
          'WCAG 4.1.2',
          'Focusable content inside aria-hidden',
          'An element (or descendant) is focusable but hidden from assistive tech.',
          'Remove aria-hidden, or set tabindex="-1" and inert on focusable descendants.',
          cssPath(el),
        ));
      }
    });

    doc.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea').forEach((el) => {
      const hasLabel =
        !!accessibleName(el) ||
        !!el.closest('label') ||
        (el.id && doc.querySelector(`label[for="${CSS.escape(el.id)}"]`));
      if (!hasLabel) {
        issues.push(issue(
          'critical',
          'ARIA',
          'WCAG 1.3.1 / 3.3.2',
          'Form control without label',
          `<${el.tagName.toLowerCase()}${el.type ? ` type="${el.type}"` : ''}> has no associated label.`,
          'Associate a <label for="…"> or provide aria-label / aria-labelledby.',
          cssPath(el),
        ));
      }
    });

    const html = doc.documentElement;
    if (html && !html.hasAttribute('lang')) {
      issues.push(issue(
        'moderate',
        'ARIA',
        'WCAG 3.1.1',
        'Missing html lang attribute',
        'Document language is not declared.',
        'Add lang="en" (or the correct language code) on <html>.',
        'html',
      ));
    }

    if (!doc.title || !String(doc.title).trim()) {
      issues.push(issue(
        'serious',
        'ARIA',
        'WCAG 2.4.2',
        'Missing document title',
        'Page has an empty or missing <title>.',
        'Set a descriptive title, e.g. “AVL Tree Visualizer | Algo Infinity Verse”.',
        'title',
      ));
    }

    return issues;
  }

  function runAuditOnDocument(doc, options) {
    const issues = [];
    if (options.headings) issues.push(...auditHeadings(doc));
    if (options.alt) issues.push(...auditAltText(doc));
    if (options.contrast) issues.push(...auditContrast(doc));
    if (options.focus) issues.push(...auditFocus(doc));
    if (options.aria) issues.push(...auditAria(doc));

    const severityRank = { critical: 0, serious: 1, moderate: 2 };
    issues.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
    return issues;
  }

  function parseHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Could not parse HTML. Check that the markup is well-formed.');
    }
    return doc;
  }

  async function fetchPage(path) {
    const url = path.startsWith('http') ? path : path;
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) {
      throw new Error(`Failed to load ${path} (${res.status} ${res.statusText})`);
    }
    return res.text();
  }

  function getOptions() {
    return {
      headings: $('checkHeadings').checked,
      alt: $('checkAlt').checked,
      contrast: $('checkContrast').checked,
      focus: $('checkFocus').checked,
      aria: $('checkAria').checked,
    };
  }

  function countBySeverity(reports) {
    const counts = { critical: 0, serious: 0, moderate: 0, pages: reports.length };
    reports.forEach((r) => {
      r.issues.forEach((i) => {
        counts[i.severity] = (counts[i.severity] || 0) + 1;
      });
    });
    return counts;
  }

  function updateStats(reports) {
    const c = countBySeverity(reports);
    $('statCritical').textContent = c.critical;
    $('statSerious').textContent = c.serious;
    $('statModerate').textContent = c.moderate;
    $('statPages').textContent = c.pages;
  }

  function setLoading(on, message) {
    $('loadingState').hidden = !on;
    $('loadingText').textContent = message || 'Scanning pages…';
    if (on) {
      $('reportStatus').hidden = true;
      $('errorState').hidden = true;
      $('reportResults').hidden = true;
    }
  }

  function showError(message) {
    setLoading(false);
    $('reportStatus').hidden = true;
    $('reportResults').hidden = true;
    $('errorState').hidden = false;
    $('errorState').innerHTML = `<p><strong>Scan failed.</strong> ${escapeHtml(message)}</p>`;
  }

  function renderReports(reports) {
    lastReports = reports;
    updateStats(reports);
    setLoading(false);
    $('errorState').hidden = true;
    $('clearReportBtn').disabled = false;
    $('exportReportBtn').disabled = false;

    const totalIssues = reports.reduce((n, r) => n + r.issues.length, 0);
    if (reports.length === 0) {
      $('reportStatus').hidden = false;
      $('reportResults').hidden = true;
      $('reportStatus').innerHTML = `
        <div class="a11y-empty">
          <i class="fas fa-universal-access" aria-hidden="true"></i>
          <p>No audit yet. Select a visualizer, paste HTML, or start demo mode.</p>
        </div>`;
      return;
    }

    $('reportStatus').hidden = true;
    $('reportResults').hidden = false;

    const summary = countBySeverity(reports);
    let html = `
      <div class="a11y-summary-bar" aria-label="Report summary">
        <span class="a11y-summary-chip">${reports.length} page${reports.length === 1 ? '' : 's'}</span>
        <span class="a11y-summary-chip">${totalIssues} issue${totalIssues === 1 ? '' : 's'}</span>
        <span class="a11y-summary-chip" style="color:var(--a11y-critical)">${summary.critical} critical</span>
        <span class="a11y-summary-chip" style="color:var(--a11y-serious)">${summary.serious} serious</span>
        <span class="a11y-summary-chip" style="color:var(--a11y-moderate)">${summary.moderate} moderate</span>
      </div>`;

    reports.forEach((report) => {
      const filtered = report.issues.filter(
        (i) => activeSeverity === 'all' || i.severity === activeSeverity,
      );
      html += `<article class="a11y-page-block">
        <header class="a11y-page-header">
          <h3 class="a11y-page-title">${escapeHtml(report.name)}</h3>
          <span class="a11y-page-meta">${escapeHtml(report.source)} · ${report.issues.length} issue${report.issues.length === 1 ? '' : 's'}</span>
        </header>`;

      if (report.error) {
        html += `<div class="a11y-issue"><p class="a11y-issue-detail">${escapeHtml(report.error)}</p></div>`;
      } else if (report.issues.length === 0) {
        html += `<p class="a11y-page-pass"><i class="fas fa-check-circle" aria-hidden="true"></i> No automated issues found for the selected checks.</p>`;
      } else if (filtered.length === 0) {
        html += `<p class="a11y-page-pass">No ${escapeHtml(activeSeverity)} issues for this page.</p>`;
      } else {
        filtered.forEach((i) => {
          html += `<div class="a11y-issue">
            <div class="a11y-issue-top">
              <span class="a11y-badge ${i.severity}">${i.severity}</span>
              <span class="a11y-rule">${escapeHtml(i.rule)} · ${escapeHtml(i.category)}</span>
            </div>
            <h4 class="a11y-issue-title">${escapeHtml(i.title)}</h4>
            <p class="a11y-issue-detail">${escapeHtml(i.detail)}</p>
            <p class="a11y-issue-fix"><strong>Fix:</strong> ${escapeHtml(i.fix)}</p>
            ${i.selector ? `<div class="a11y-issue-selector" title="Selector">${escapeHtml(i.selector)}</div>` : ''}
          </div>`;
        });
      }
      html += '</article>';
    });

    $('reportResults').innerHTML = html;
  }

  async function auditSources(sources) {
    const options = getOptions();
    if (!Object.values(options).some(Boolean)) {
      showError('Select at least one check to run.');
      return;
    }

    setLoading(true, sources.length > 1 ? `Scanning ${sources.length} pages…` : 'Scanning page…');
    $('runAuditBtn').disabled = true;

    const reports = [];
    try {
      for (let i = 0; i < sources.length; i++) {
        const src = sources[i];
        $('loadingText').textContent = `Scanning ${i + 1}/${sources.length}: ${src.name}…`;
        try {
          let html = src.html;
          if (!html && src.path) {
            html = await fetchPage(src.path);
          }
          if (!html || !String(html).trim()) {
            throw new Error('Empty document — nothing to audit.');
          }
          const doc = parseHtml(html);
          const issues = runAuditOnDocument(doc, options);
          reports.push({
            name: src.name,
            source: src.path || 'pasted HTML',
            issues,
          });
        } catch (err) {
          reports.push({
            name: src.name,
            source: src.path || 'pasted HTML',
            issues: [],
            error: err.message || String(err),
          });
        }
        // Yield to UI between pages
        await new Promise((r) => setTimeout(r, 0));
      }
      renderReports(reports);
    } catch (err) {
      showError(err.message || String(err));
    } finally {
      $('runAuditBtn').disabled = false;
    }
  }

  function collectSourcesFromUI() {
    if (activeTab === 'paste') {
      const html = $('htmlPaste').value;
      if (!html.trim()) {
        showError('Paste some HTML markup before running the audit.');
        return null;
      }
      return [{ name: 'Pasted document', html }];
    }

    if (activeTab === 'demo') {
      return DEMO_VISUALIZERS.map((v) => ({ name: v.name, path: v.path }));
    }

    // visualizer tab
    const selected = $('visualizerSelect').value;
    const custom = $('pathInput').value.trim();
    const path = custom || selected;
    if (!path) {
      showError('Choose a visualizer from the list or enter a page path.');
      return null;
    }
    const known = SELECTOR_VISUALIZERS.find((v) => v.path === path);
    const name = known ? known.name : path.split('/').filter(Boolean).pop() || path;
    return [{ name, path }];
  }

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.a11y-tab').forEach((btn) => {
      const on = btn.dataset.tab === tab;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });
    $('panelVisualizer').hidden = tab !== 'visualizer';
    $('panelPaste').hidden = tab !== 'paste';
    $('panelDemo').hidden = tab !== 'demo';
  }

  function initTabs() {
    const tabs = [...document.querySelectorAll('.a11y-tab')];
    tabs.forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
      btn.addEventListener('keydown', (e) => {
        const idx = tabs.indexOf(btn);
        let next = idx;
        if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        else return;
        e.preventDefault();
        tabs[next].focus();
        switchTab(tabs[next].dataset.tab);
      });
    });
  }

  function initFilters() {
    document.querySelectorAll('.a11y-filter').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeSeverity = btn.dataset.severity;
        document.querySelectorAll('.a11y-filter').forEach((b) => {
          b.classList.toggle('active', b === btn);
        });
        if (lastReports.length) renderReports(lastReports);
      });
    });
  }

  function populateSelects() {
    const select = $('visualizerSelect');
    SELECTOR_VISUALIZERS.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.path;
      opt.textContent = v.name;
      select.appendChild(opt);
    });

    const list = $('demoList');
    DEMO_VISUALIZERS.forEach((v) => {
      const li = document.createElement('li');
      li.innerHTML = `<i class="fas fa-check" aria-hidden="true"></i><span>${escapeHtml(v.name)}</span>`;
      list.appendChild(li);
    });
  }

  function exportJson() {
    if (!lastReports.length) return;
    const blob = new Blob([JSON.stringify({
      generatedAt: new Date().toISOString(),
      tool: 'Algo Infinity Verse Accessibility Audit Toolkit',
      reports: lastReports,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `a11y-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearReport() {
    lastReports = [];
    updateStats([]);
    $('clearReportBtn').disabled = true;
    $('exportReportBtn').disabled = true;
    $('errorState').hidden = true;
    $('reportResults').hidden = true;
    $('reportResults').innerHTML = '';
    $('reportStatus').hidden = false;
    $('reportStatus').innerHTML = `
      <div class="a11y-empty">
        <i class="fas fa-universal-access" aria-hidden="true"></i>
        <p>No audit yet. Select a visualizer, paste HTML, or start demo mode.</p>
      </div>`;
  }

  function init() {
    populateSelects();
    initTabs();
    initFilters();

    $('runAuditBtn').addEventListener('click', () => {
      const sources = collectSourcesFromUI();
      if (sources) auditSources(sources);
    });
    $('clearReportBtn').addEventListener('click', clearReport);
    $('exportReportBtn').addEventListener('click', exportJson);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
