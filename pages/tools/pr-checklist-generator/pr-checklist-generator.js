/**
 * Open Source PR Checklist Generator (AIV-flavored)
 */
(function () {
  'use strict';

  const SHARED_CHECKS = [
    'Link this PR to the related issue (e.g. `Closes #ISSUE` or `#ISSUE issue resolved`)',
    'Branch is based on the latest `main`',
    'Changes follow existing project style and patterns',
    'HTML, CSS, and JS live in separate files (no large inline blocks)',
    'UI is responsive on desktop and mobile',
    'No secrets or `.env` credentials committed',
    'Self-reviewed the diff before requesting review',
  ];

  const TYPE_CONFIG = {
    visualizer: {
      label: 'Visualizer',
      commitType: 'feat',
      defaultScope: 'visualizers',
      folder: 'pages/visualizers/<name>/',
      files: '<name>.html, <name>.css, <name>.js',
      checks: [
        'Created folder under `pages/visualizers/<name>/`',
        'Added triad: `<name>.html`, `<name>.css`, `<name>.js`',
        'Visualizer controls are keyboard-accessible where interactive',
        'Canvas / SVG has an accessible name (`aria-label` or equivalent)',
        'Registered or linked from the visualizer hub/index if required',
        'Briefly documented what algorithm/concept is shown',
      ],
    },
    tool: {
      label: 'Tool',
      commitType: 'feat',
      defaultScope: 'tools',
      folder: 'pages/tools/<name>/',
      files: '<name>.html, <name>.css, <name>.js',
      checks: [
        'Created folder under `pages/tools/<name>/`',
        'Added triad: `<name>.html`, `<name>.css`, `<name>.js`',
        'Registered the tool in `pages/tools/tools.js`',
        'Includes loading / empty / error states where useful',
        'Matches existing tools UI patterns (hero + panels)',
        'Works without requiring new backend secrets',
      ],
    },
    academy: {
      label: 'Academy',
      commitType: 'feat',
      defaultScope: 'academy',
      folder: 'pages/<name>-academy/',
      files: '<name>-academy.html, .css, .js',
      checks: [
        'Created academy folder under `pages/` following existing `*-academy` pattern',
        'Separated HTML / CSS / JS for the academy pages',
        'Lessons or modules follow existing academy structure',
        'Progress / completion storage keys are namespaced if used',
        'Linked from academy hub or navigation if applicable',
        'Content is beginner-friendly and consistent with AIV tone',
      ],
    },
    bugfix: {
      label: 'Bug fix',
      commitType: 'fix',
      defaultScope: 'core',
      folder: '(existing files)',
      files: 'only files needed for the fix',
      checks: [
        'Described the bug and root cause in the PR',
        'Included clear reproduction steps (before / after)',
        'Fix is minimal and scoped to the issue',
        'Verified the bug no longer occurs locally',
        'Checked for related regressions in nearby UI',
        'Did not mix unrelated refactors into this PR',
      ],
    },
  };

  let lastCommit = '';
  let lastChecklist = '';
  let lastFull = '';

  function $(id) {
    return document.getElementById(id);
  }

  function selectedType() {
    const el = document.querySelector('input[name="contribType"]:checked');
    return el ? el.value : 'visualizer';
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
  }

  function cleanIssue(raw) {
    const digits = String(raw || '').replace(/[^\d]/g, '');
    return digits || '';
  }

  function imperativeSummary(raw, type) {
    const text = String(raw || '').trim();
    if (text) return text.replace(/\.$/, '');
    const title = String($('prcTitle').value || '').trim();
    if (title) {
      const verb = type === 'bugfix' ? 'fix' : 'add';
      return `${verb} ${title.toLowerCase()}`;
    }
    return type === 'bugfix' ? 'resolve reported issue' : 'add new contribution';
  }

  function buildCommit(typeKey) {
    const cfg = TYPE_CONFIG[typeKey];
    const scopeInput = $('prcScope').value.trim();
    const title = $('prcTitle').value.trim();
    const scope = scopeInput || slugify(title) || cfg.defaultScope;
    const summary = imperativeSummary($('prcSummary').value, typeKey);
    const issue = cleanIssue($('prcIssue').value);

    let msg = `${cfg.commitType}(${scope}): ${summary}`;
    if (issue) {
      msg += `\n\nRefs #${issue}`;
    }
    return msg;
  }

  function buildChecklist(typeKey) {
    const cfg = TYPE_CONFIG[typeKey];
    const title = $('prcTitle').value.trim() || cfg.label;
    const issue = cleanIssue($('prcIssue').value);
    const issueLine = issue ? `# #${issue} issue resolved\n\n` : '';

    const lines = [
      `${issueLine}## Description`,
      '',
      `This PR adds / updates a beginner-friendly **${cfg.label}** contribution for Algo Infinity Verse${title ? `: ${title}` : ''}.`,
      '',
      `**Expected location:** \`${cfg.folder}\``,
      `**File pattern:** \`${cfg.files}\``,
      '',
      '## Features / changes',
      '',
      `- ${title || cfg.label}`,
      '',
      '## PR checklist',
      '',
      '### Type-specific',
      ...cfg.checks.map((c) => `- [ ] ${c}`),
      '',
      '### Shared AIV guidelines',
      ...SHARED_CHECKS.map((c) => {
        if (issue && c.includes('#ISSUE')) {
          return `- [ ] ${c.replace(/#ISSUE/g, `#${issue}`)}`;
        }
        return `- [ ] ${c}`;
      }),
      '',
      '### HTML / CSS / JS separation',
      '- [ ] Markup, styles, and behavior are in separate `.html` / `.css` / `.js` files',
      '- [ ] Avoided dumping large logic into inline scripts unless the page already requires it',
      '',
      '## Test plan',
      '',
      '- [ ] Opened the new/changed page locally and verified UI',
      '- [ ] Checked responsive layout',
      '- [ ] Confirmed no console errors on happy path',
    ];

    return lines.join('\n');
  }

  function buildFull(typeKey) {
    const commit = buildCommit(typeKey);
    const checklist = buildChecklist(typeKey);
    return `${checklist}\n\n---\n\n## Suggested conventional commit\n\n\`\`\`\n${commit}\n\`\`\`\n`;
  }

  function setOutputs(commit, checklist, full) {
    lastCommit = commit;
    lastChecklist = checklist;
    lastFull = full;

    $('prcCommitOut').textContent = commit;
    $('prcChecklistOut').textContent = checklist;
    $('prcFullOut').textContent = full;

    $('prcCopyCommit').disabled = false;
    $('prcCopyChecklist').disabled = false;
    $('prcCopyAll').disabled = false;
  }

  function generate() {
    const typeKey = selectedType();
    setOutputs(buildCommit(typeKey), buildChecklist(typeKey), buildFull(typeKey));
    flashStatus('Generated checklist and commit template');
  }

  function resetForm() {
    document.querySelector('input[name="contribType"][value="visualizer"]').checked = true;
    $('prcTitle').value = '';
    $('prcScope').value = '';
    $('prcIssue').value = '';
    $('prcSummary').value = '';
    lastCommit = lastChecklist = lastFull = '';
    $('prcCommitOut').textContent = 'Select a type and click Generate.';
    $('prcChecklistOut').textContent = 'Your tailored checklist will appear here.';
    $('prcFullOut').textContent = 'Checklist + commit tip in one pasteable PR description.';
    $('prcCopyCommit').disabled = true;
    $('prcCopyChecklist').disabled = true;
    $('prcCopyAll').disabled = true;
    flashStatus('Reset');
  }

  function flashStatus(msg) {
    const el = $('prcCopyStatus');
    if (!el) return;
    el.textContent = msg;
    clearTimeout(flashStatus._t);
    flashStatus._t = setTimeout(() => {
      if (el.textContent === msg) el.textContent = '';
    }, 2000);
  }

  async function copyText(text, label) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      flashStatus(`${label} copied`);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      flashStatus(`${label} copied`);
    }
  }

  function syncScopePlaceholder() {
    const typeKey = selectedType();
    const cfg = TYPE_CONFIG[typeKey];
    const title = $('prcTitle').value.trim();
    const scope = $('prcScope');
    if (!scope.dataset.touched) {
      scope.placeholder = `e.g. ${slugify(title) || cfg.defaultScope}`;
    }
  }

  function init() {
    document.querySelectorAll('input[name="contribType"]').forEach((input) => {
      input.addEventListener('change', () => {
        syncScopePlaceholder();
        generate();
      });
    });

    $('prcTitle').addEventListener('input', syncScopePlaceholder);
    $('prcScope').addEventListener('input', () => {
      $('prcScope').dataset.touched = '1';
    });

    $('prcGenerateBtn').addEventListener('click', generate);
    $('prcResetBtn').addEventListener('click', resetForm);
    $('prcCopyCommit').addEventListener('click', () => copyText(lastCommit, 'Commit template'));
    $('prcCopyChecklist').addEventListener('click', () => copyText(lastChecklist, 'Checklist'));
    $('prcCopyAll').addEventListener('click', () => copyText(lastFull, 'Full PR body'));

    syncScopePlaceholder();
    generate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
