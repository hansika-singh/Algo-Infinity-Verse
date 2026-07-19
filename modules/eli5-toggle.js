/**
 * ELI5 Toggle — "Explain Like I'm 5" for academy learning modules
 *
 * Exposes window.eli5Toggle with helpers to:
 * - Create a pill toggle (Technical / Simple)
 * - Persist preference in localStorage per academy
 * - Wrap content in [data-technical] / [data-simple] containers
 *
 * Usage (in HTML):
 *   <link rel="stylesheet" href="/styles/eli5-toggle.css">
 *   <script src="/modules/eli5-toggle.js"></script>
 *
 * Then in academy JS:
 *   eli5Toggle.initEli5Toggle('redis', lessonContainerEl);
 */

(function () {
  'use strict';

  var STORAGE_PREFIX = 'academy-eli5-';

  /* ─── Read / write preference ─── */

  function getPreference(academyId) {
    try {
      return localStorage.getItem(STORAGE_PREFIX + academyId) === 'simple';
    } catch (e) {
      return false;
    }
  }

  function setPreference(academyId, isSimple) {
    try {
      localStorage.setItem(STORAGE_PREFIX + academyId, isSimple ? 'simple' : 'technical');
    } catch (e) {
      /* localStorage unavailable */
    }
  }

  /* ─── Build the toggle pill DOM ─── */

  /**
   * Create the pill-shaped Technical / Simple toggle.
   * @param {string} academyId    Used for localStorage key
   * @param {function} onChange   Called with (isSimple) when toggled
   * @returns {HTMLElement}
   */
  function createToggle(academyId, onChange) {
    var isSimple = getPreference(academyId);

    var toggle = document.createElement('div');
    toggle.className = 'eli5-toggle';
    toggle.setAttribute('role', 'group');
    toggle.setAttribute('aria-label', 'Explanation mode');
    toggle.setAttribute('data-academy', academyId);

    toggle.innerHTML =
      '<button class="eli5-btn' +
      (isSimple ? '' : ' active') +
      '" data-mode="technical" aria-pressed="' +
      String(!isSimple) +
      '">' +
      '<span class="eli5-label">Technical</span>' +
      '</button>' +
      '<button class="eli5-btn' +
      (isSimple ? ' active' : '') +
      '" data-mode="simple" aria-pressed="' +
      String(isSimple) +
      '">' +
      '<span class="eli5-label">Simple</span>' +
      '</button>';

    toggle.addEventListener('click', function onClick(e) {
      var btn = e.target.closest('.eli5-btn');
      if (!btn || btn.classList.contains('active')) return;

      var isSimpleMode = btn.dataset.mode === 'simple';

      toggle.querySelectorAll('.eli5-btn').forEach(function (b) {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });

      setPreference(academyId, isSimpleMode);
      onChange(isSimpleMode);
    });

    return toggle;
  }

  /* ─── High-level initializer ─── */

  /**
   * Initialize the ELI5 toggle inside a container.
   * The container gets .eli5-container class. Lesson content should
   * use [data-technical] and [data-simple] sections inside it.
   *
   * @param {string} academyId
   * @param {HTMLElement} container
   * @param {HTMLElement} [insertBefore]  Insert toggle before this child
   * @returns {HTMLElement} The toggle element
   */
  function initToggle(academyId, container, insertBefore) {
    if (!container) return null;

    if (!container.classList.contains('eli5-container')) {
      container.classList.add('eli5-container');
    }

    /* Remove any existing toggle inside this container to avoid duplicates */
    var existing = container.querySelector('.eli5-toggle');
    if (existing) existing.remove();

    var isSimple = getPreference(academyId);
    container.dataset.mode = isSimple ? 'simple' : 'technical';

    var toggle = createToggle(academyId, function onToggle(simpleMode) {
      container.dataset.mode = simpleMode ? 'simple' : 'technical';
    });

    toggle.classList.add('eli5-toggle-inline');

    if (insertBefore && insertBefore.parentNode === container) {
      container.insertBefore(toggle, insertBefore);
    } else {
      /* Insert after the title element (h2, h3, etc.) so the toggle
         sits next to the lesson title, not above everything */
      var title = container.querySelector('h2, h3');
      if (title && title.parentNode === container) {
        title.parentNode.insertBefore(toggle, title.nextSibling);
      } else {
        container.insertBefore(toggle, container.firstChild);
      }
    }

    return toggle;
  }

  /* ─── Wrap content sections ─── */

  /**
   * Wrap technical and simple content in data-attribute containers.
   * @param {string} technicalHtml
   * @param {string} [simpleHtml]
   * @returns {string}
   */
  function wrapContent(technicalHtml, simpleHtml) {
    var simplePart = '';
    if (simpleHtml) {
      simplePart =
        '<div data-simple>' +
        '<div class="eli5-simple-content">' +
        '<div class="eli5-label-badge">Explain Like I\'m 5</div>' +
        simpleHtml +
        '</div>' +
        '</div>';
    } else {
      simplePart =
        '<div data-simple>' +
        '<div class="eli5-simple-content eli5-simple-empty">' +
        '<p style="opacity:0.6;font-style:italic;margin:0;">No simple explanation available for this lesson yet. Switch back to Technical mode.</p>' +
        '</div>' +
        '</div>';
    }

    return '<div data-technical>' + technicalHtml + '</div>' + simplePart;
  }

  /* ─── Expose globally ─── */

  window.eli5Toggle = {
    getPreference: getPreference,
    setPreference: setPreference,
    createToggle: createToggle,
    initToggle: initToggle,        /* renamed from initEli5Toggle */
    wrapContent: wrapContent,
  };
})();
