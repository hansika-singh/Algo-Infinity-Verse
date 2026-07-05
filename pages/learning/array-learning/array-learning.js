/**
 * array-learning.js — Full corrected script
 *
 * Fixes applied vs. original:
 *  1. Scroll-spy: updated querySelector target to '.arr-nav-link'
 *     to match the renamed class in HTML/CSS.
 *  2. Progress bar: now also updates the new #progressPercent label
 *     and the ARIA aria-valuenow attribute on the progress container.
 *  3. Smooth-scroll: updated selector to '.arr-nav-link'.
 *  4. Copy button: now adds/removes the 'copied' CSS class (was only
 *     changing textContent — class was never applied, so green style
 *     never rendered).
 *  5. Exercise toggle: now also toggles aria-expanded on the button
 *     for screen-reader accessibility.
 *  6. Stats counter: guard added so counters only run once even if
 *     the observer fires multiple times for the same element.
 *  7. Newsletter form: preventDefault added so the static page never
 *     performs a full navigation on submit.
 *  8. LocalStorage key kept identical so existing progress is not lost.
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ════════════════════════════════════════════════════════════
     1. HERO TYPING ANIMATION
  ════════════════════════════════════════════════════════════ */
  const words = [
    'Array Basics',
    'Traversal',
    'Insertion',
    'Deletion',
    'Searching',
    'Sorting',
    '2D Arrays',
    'Interview Problems'
  ];

  const typingElement = document.getElementById('typingTextArray');

  if (typingElement) {
    let wordIndex  = 0;
    let charIndex  = 0;
    let deleting   = false;
    let timeoutId  = null;

    function typeEffect() {
      const currentWord = words[wordIndex];

      if (deleting) {
        typingElement.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
      } else {
        typingElement.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
      }

      let speed = deleting ? 50 : 100;

      if (!deleting && charIndex === currentWord.length) {
        speed    = 1800;   // pause at end of word
        deleting = true;
      }

      if (deleting && charIndex === 0) {
        deleting   = false;
        wordIndex  = (wordIndex + 1) % words.length;
        speed      = 400;  // pause before typing next word
      }

      timeoutId = setTimeout(typeEffect, speed);
    }

    typeEffect();

    // Clean up if the element is ever removed (SPA navigation safety)
    window.addEventListener('beforeunload', () => clearTimeout(timeoutId));
  }

  /* ════════════════════════════════════════════════════════════
     2. SCROLL-SPY NAVIGATION
     FIX: selector updated from '.arr-sidebar-nav a'
          to '.arr-sidebar-nav .arr-nav-link'
  ════════════════════════════════════════════════════════════ */
  const sections = document.querySelectorAll('.arr-lesson');
  // FIX: match exact class used in HTML
  const navLinks = document.querySelectorAll('.arr-sidebar-nav .arr-nav-link');

  function updateActiveLink() {
    let currentSection = '';

    sections.forEach(section => {
      // 150px offset accounts for the sticky navbar height
      const sectionTop = section.offsetTop - 150;
      if (window.scrollY >= sectionTop) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink(); // run once on load

  /* ════════════════════════════════════════════════════════════
     3. PROGRESS TRACKER
     Uses IntersectionObserver + localStorage (same pattern as
     MST learning page) so progress persists across visits.
  ════════════════════════════════════════════════════════════ */
  const STORAGE_KEY    = 'array-learning-progress';
  const TOTAL_TOPICS   = sections.length;
  const progressFill   = document.getElementById('progressFill');
  const progressCount  = document.getElementById('progressCount');
  const progressPercent = document.getElementById('progressPercent');
  const progressBar    = document.querySelector('.arr-progress-bar');

  if (!progressFill || !progressCount) return;

  let completed = new Set();

  // Restore saved progress
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) saved.forEach(t => completed.add(t));
  } catch { /* ignore */ }

  function updateUI() {
    const pct = TOTAL_TOPICS
      ? Math.round((completed.size / TOTAL_TOPICS) * 100)
      : 0;

    progressFill.style.width = `${pct}%`;
    progressCount.textContent = completed.size;
    if (progressPercent) progressPercent.textContent = `${pct}%`;
    if (progressBar) progressBar.setAttribute('aria-valuenow', pct);
  }

  updateUI();

  let ready = false;

  const progressObserver = new IntersectionObserver(
    entries => {
      if (!ready) return;
      let changed = false;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const topic = entry.target.getAttribute('data-topic');
          if (topic && !completed.has(topic)) {
            completed.add(topic);
            changed = true;
          }
        }
      });
      if (changed) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
        } catch (e) {
          console.warn('Could not save progress:', e);
        }
        updateUI();
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -20% 0px' }
  );

  sections.forEach(s => progressObserver.observe(s));

  // Prevent initial observer callback from marking everything visited
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { ready = true; });
  });

  /* ════════════════════════════════════════════════════════════
     4. SMOOTH SCROLLING FOR SIDEBAR LINKS
     FIX: selector updated to '.arr-nav-link'
  ════════════════════════════════════════════════════════════ */
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();

      const targetId = link.getAttribute('href');
      const target   = document.querySelector(targetId);

      if (!target) return;

      // 80px offset for sticky navbar
      const offsetTop = target.getBoundingClientRect().top + window.scrollY - 80;

      window.scrollTo({
        top:      offsetTop,
        behavior: 'smooth'
      });

      // After scroll, update active state immediately
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  /* ════════════════════════════════════════════════════════════
     5. CODE COPY BUTTONS
     FIX: now also adds/removes the '.copied' CSS class so the
          green colour defined in CSS actually renders.
  ════════════════════════════════════════════════════════════ */
  document.querySelectorAll('.arr-code-copy').forEach(button => {
    button.addEventListener('click', async () => {
      const codeEl = button
        .closest('.arr-code-block')
        ?.querySelector('code');

      if (!codeEl) return;

      const code = codeEl.innerText;

      try {
        await navigator.clipboard.writeText(code);

        const originalText = button.textContent;

        // FIX: apply .copied class for CSS colour change
        button.textContent = 'Copied!';
        button.classList.add('copied');
        button.setAttribute('aria-label', 'Code copied');

        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('copied');
          button.setAttribute('aria-label', 'Copy code');
        }, 2000);
      } catch (err) {
        // Clipboard API not available (e.g. non-HTTPS)
        button.textContent = 'Failed';
        setTimeout(() => {
          button.textContent = 'Copy';
        }, 2000);
        console.error('Clipboard write failed:', err);
      }
    });
  });

  /* ════════════════════════════════════════════════════════════
     6. EXERCISE TOGGLE
     FIX: now also toggles aria-expanded on the button.
  ════════════════════════════════════════════════════════════ */
  document.querySelectorAll('.arr-exercise-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('aria-controls');
      const solution = document.getElementById(targetId);

      if (!solution) return;

      const isVisible = solution.classList.toggle('visible');

      button.textContent = isVisible ? 'Hide Solution' : 'Show Solution';

      // FIX: update aria-expanded for screen readers
      button.setAttribute('aria-expanded', isVisible ? 'true' : 'false');
    });
  });

  /* ════════════════════════════════════════════════════════════
     7. STATS COUNTER ANIMATION
     FIX: added a 'data-counted' guard so the counter only fires
          once even if IntersectionObserver re-triggers.
  ════════════════════════════════════════════════════════════ */
  const counters = document.querySelectorAll('.stat-number[data-target]');

  const counterObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const counter = entry.target;

        // FIX: guard against double-counting
        if (counter.dataset.counted) return;
        counter.dataset.counted = 'true';

        const target    = parseInt(counter.dataset.target, 10);
        let   current   = 0;
        const increment = Math.ceil(target / 40); // ~40 steps

        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          counter.textContent = current;
        }, 30);

        counterObserver.unobserve(counter);
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(counter => counterObserver.observe(counter));

  /* ════════════════════════════════════════════════════════════
     8. NEWSLETTER FORM — prevent page reload on static host
  ════════════════════════════════════════════════════════════ */
  const newsletterForm = document.getElementById('newsletterForm');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();

      const emailInput = newsletterForm.querySelector('input[type="email"]');
      if (!emailInput || !emailInput.value.trim()) return;

      const btn = newsletterForm.querySelector('button[type="submit"]');
      const originalHTML = btn.innerHTML;

      btn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';
      emailInput.value = '';

      setTimeout(() => {
        btn.innerHTML = originalHTML;
      }, 3000);
    });
  }

});