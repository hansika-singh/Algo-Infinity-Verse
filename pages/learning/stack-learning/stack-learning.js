/**
 * stack-learning.js
 *
 * Mirrors array-learning.js / linkedlist-learning.js exactly.
 * All selectors and IDs use the stk- / Stk prefix namespace
 * so this script can coexist with the other learning scripts
 * without conflict.
 *
 * Features:
 *  1. Hero typing animation
 *  2. Scroll-spy sidebar navigation
 *  3. Progress bar (fill + percent label + ARIA)
 *  4. Smooth scrolling for sidebar links
 *  5. Lesson completion tracking (localStorage)
 *  6. Code copy buttons with .copied CSS class
 *  7. Exercise solution toggles with aria-expanded
 *  8. Stats counter animation (once-only guard)
 *  9. Newsletter form (no full-page reload)
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ════════════════════════════════════════════════════════════
     1. HERO TYPING ANIMATION
  ════════════════════════════════════════════════════════════ */
  const words = [
    'LIFO Principle',
    'Push & Pop',
    'Array Implementation',
    'Linked List Stack',
    'Balanced Brackets',
    'Postfix Evaluation',
    'Min Stack',
    'Monotonic Stack',
    'Call Stack'
  ];

  const typingElement = document.getElementById('typingTextStk');

  if (typingElement) {
    let wordIndex = 0;
    let charIndex = 0;
    let deleting  = false;
    let timeoutId = null;

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
        speed    = 1800;
        deleting = true;
      }

      if (deleting && charIndex === 0) {
        deleting  = false;
        wordIndex = (wordIndex + 1) % words.length;
        speed     = 400;
      }

      timeoutId = setTimeout(typeEffect, speed);
    }

    typeEffect();
    window.addEventListener('beforeunload', () => clearTimeout(timeoutId));
  }

  /* ════════════════════════════════════════════════════════════
     2. SCROLL-SPY NAVIGATION
  ════════════════════════════════════════════════════════════ */
  const sections = document.querySelectorAll('.stk-lesson');
  const navLinks = document.querySelectorAll('.stk-sidebar-nav .stk-nav-link');

  function updateActiveLink() {
    let currentSection = '';

    sections.forEach(section => {
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
  updateActiveLink();

  /* ════════════════════════════════════════════════════════════
     3. PROGRESS TRACKER
  ════════════════════════════════════════════════════════════ */
  const progressFill    = document.getElementById('stkProgressFill');
  const progressCount   = document.getElementById('stkProgressCount');
  const progressPercent = document.getElementById('stkProgressPercent');
  const progressBar     = document.querySelector('.stk-progress-bar');

  function updateProgress() {
    let completed = 0;

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.7) {
        completed++;
      }
    });

    const percentage = sections.length
      ? Math.round((completed / sections.length) * 100)
      : 0;

    if (progressFill)    progressFill.style.width    = `${percentage}%`;
    if (progressCount)   progressCount.textContent   = completed;
    if (progressPercent) progressPercent.textContent = `${percentage}%`;
    if (progressBar)     progressBar.setAttribute('aria-valuenow', percentage);
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ════════════════════════════════════════════════════════════
     4. SMOOTH SCROLLING FOR SIDEBAR LINKS
  ════════════════════════════════════════════════════════════ */
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();

      const targetId = link.getAttribute('href');
      const target   = document.querySelector(targetId);

      if (!target) return;

      const offsetTop = target.getBoundingClientRect().top + window.scrollY - 80;

      window.scrollTo({ top: offsetTop, behavior: 'smooth' });

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  /* ════════════════════════════════════════════════════════════
     5. LESSON COMPLETION (LocalStorage)
  ════════════════════════════════════════════════════════════ */
  const STORAGE_KEY = 'stack-learning-progress';

  let completedTopics = [];
  try {
    completedTopics = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    completedTopics = [];
  }

  function saveProgress(topicId) {
    if (!completedTopics.includes(topicId)) {
      completedTopics.push(topicId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTopics));
      } catch (e) {
        void 0;
      }
    }
  }

  const lessonObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) saveProgress(entry.target.id);
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach(section => lessonObserver.observe(section));

  /* ════════════════════════════════════════════════════════════
     6. CODE COPY BUTTONS
  ════════════════════════════════════════════════════════════ */
  document.querySelectorAll('.stk-code-copy').forEach(button => {
    button.addEventListener('click', async () => {
      const codeEl = button
        .closest('.stk-code-block')
        ?.querySelector('code');

      if (!codeEl) return;

      try {
        await navigator.clipboard.writeText(codeEl.innerText);

        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied');
        button.setAttribute('aria-label', 'Code copied');

        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('copied');
          button.setAttribute('aria-label', 'Copy code');
        }, 2000);
      } catch (err) {
        button.textContent = 'Failed';
        setTimeout(() => { button.textContent = 'Copy'; }, 2000);
        console.error('Clipboard write failed:', err);
      }
    });
  });

  /* ════════════════════════════════════════════════════════════
     7. EXERCISE TOGGLES
  ════════════════════════════════════════════════════════════ */
  document.querySelectorAll('.stk-exercise-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('aria-controls');
      const solution = document.getElementById(targetId);

      if (!solution) return;

      const isVisible = solution.classList.toggle('visible');
      button.textContent = isVisible ? 'Hide Solution' : 'Show Solution';
      button.setAttribute('aria-expanded', isVisible ? 'true' : 'false');
    });
  });

  /* ════════════════════════════════════════════════════════════
     8. STATS COUNTER ANIMATION
  ════════════════════════════════════════════════════════════ */
  const counters = document.querySelectorAll('.stat-number[data-target]');

  const counterObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const counter = entry.target;
        if (counter.dataset.counted) return;
        counter.dataset.counted = 'true';

        const target    = parseInt(counter.dataset.target, 10);
        let   current   = 0;
        const increment = Math.ceil(target / 40);

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
     9. NEWSLETTER FORM
  ════════════════════════════════════════════════════════════ */
  const newsletterForm = document.getElementById('newsletterForm');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();

      const emailInput = newsletterForm.querySelector('input[type="email"]');
      if (!emailInput || !emailInput.value.trim()) return;

      const btn          = newsletterForm.querySelector('button[type="submit"]');
      const originalHTML = btn.innerHTML;

      btn.innerHTML    = '<i class="fas fa-check" aria-hidden="true"></i>';
      emailInput.value = '';

      setTimeout(() => { btn.innerHTML = originalHTML; }, 3000);
    });
  }

});