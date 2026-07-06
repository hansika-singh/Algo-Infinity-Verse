document.addEventListener('DOMContentLoaded', () => {

  /* ════════════════════════════════════════════════════════════
     1. HERO TYPING ANIMATION
  ════════════════════════════════════════════════════════════ */
  const words = [
    'Understand the Problem',
    'Brute Force Solution',
    'Optimize Your Approach',
    'Write Clean Code',
    'Test Thoroughly',
    'Master Any Interview Problem'
  ];

  const typingElement = document.getElementById('typingTextPsf');

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
        speed    = 1800;
        deleting = true;
      }

      if (deleting && charIndex === 0) {
        deleting   = false;
        wordIndex  = (wordIndex + 1) % words.length;
        speed      = 400;
      }

      timeoutId = setTimeout(typeEffect, speed);
    }

    typeEffect();

    window.addEventListener('beforeunload', () => clearTimeout(timeoutId));
  }

  /* ════════════════════════════════════════════════════════════
     2. SCROLL-SPY NAVIGATION
  ════════════════════════════════════════════════════════════ */
  const sections = document.querySelectorAll('.psf-lesson');
  const navLinks = document.querySelectorAll('.psf-sidebar-nav .psf-nav-link');

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
  const STORAGE_KEY = 'psf-learning-progress';
  const TOTAL_TOPICS = 6;
  const fill = document.getElementById('progressFill');
  const count = document.getElementById('progressCount');
  const percent = document.getElementById('progressPercent');
  const bar = document.querySelector('.psf-progress-bar');

  if (fill && count) {
    let completed = new Set();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved)) {
        completed = new Set(saved.filter((v) => /^[1-6]$/.test(v)));
      }
    } catch { /* ignore */ }

    function updateUI() {
      const pct = Math.min(100, Math.round((completed.size / TOTAL_TOPICS) * 100));
      fill.style.width = pct + '%';
      count.textContent = completed.size;
      if (percent) percent.textContent = pct + '%';
      if (bar) bar.setAttribute('aria-valuenow', pct);
    }

    updateUI();

    const lessons = document.querySelectorAll('.psf-lesson');
    const observer = new IntersectionObserver(
      (entries) => {
        let changed = false;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const topic = entry.target.getAttribute('data-topic');
            if (topic && !completed.has(topic)) {
              completed.add(topic);
              changed = true;
            }
          }
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
          updateUI();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -20% 0px' }
    );

    lessons.forEach((l) => observer.observe(l));
  }

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

      window.scrollTo({
        top:      offsetTop,
        behavior: 'smooth'
      });

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  /* ════════════════════════════════════════════════════════════
     5. CODE COPY BUTTONS
  ════════════════════════════════════════════════════════════ */
  document.querySelectorAll('.psf-code-copy').forEach(button => {
    button.addEventListener('click', async () => {
      const codeEl = button
        .closest('.psf-code-block')
        ?.querySelector('code');

      if (!codeEl) return;

      const code = codeEl.innerText;

      try {
        await navigator.clipboard.writeText(code);

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
        setTimeout(() => {
          button.textContent = 'Copy';
        }, 2000);
        console.error('Clipboard write failed:', err);
      }
    });
  });

  /* ════════════════════════════════════════════════════════════
     7. EXERCISE TOGGLE
  ════════════════════════════════════════════════════════════ */
  document.querySelectorAll('.psf-exercise-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('aria-controls');
      const solution = document.getElementById(targetId);

      if (!solution) return;

      const isVisible = solution.classList.toggle('visible');
      const originalText = button.dataset.originalText || button.textContent;

      if (!button.dataset.originalText) {
        button.dataset.originalText = originalText;
      }

      button.textContent = isVisible ? 'Hide Solution' : originalText;
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

      const btn = newsletterForm.querySelector('button[type="submit"]');
      const originalHTML = btn.innerHTML;

      btn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';
      emailInput.value = '';

      setTimeout(() => {
        btn.innerHTML = originalHTML;
      }, 3000);
    });
  }

  /* ════════════════════════════════════════════════════════════
     10. PRACTICE PROBLEMS INTERACTIVE FEEDBACK
  ════════════════════════════════════════════════════════════ */
  const problemAnswers = {
    1: {
      brute: 'nested',
      complexity: 'on'
    },
    2: {
      brute: 'nested',
      optimized: 'kadane',
      complexity: 'on'
    },
    3: {
      brute: 'onk',
      optimized: 'deque',
      complexity: 'on'
    }
  };

  const problemLabels = {
    1: {
      brute: 'Nested loops comparing every pair',
      complexity: 'O(n) time, O(n) space'
    },
    2: {
      brute: 'Try all subarrays with nested loops',
      optimized: `Kadane's algorithm O(n)`,
      complexity: 'O(n) time, O(1) space'
    },
    3: {
      brute: 'O(n·k) time, O(1) space',
      optimized: 'Deque (Monotonic Queue)',
      complexity: 'O(n) time, O(k) space'
    }
  };

  document.querySelectorAll('.psf-pq-submit').forEach(button => {
    button.addEventListener('click', () => {
      const problemNum = button.dataset.problem;
      const answers = problemAnswers[problemNum];
      const labels  = problemLabels[problemNum];

      if (!answers) return;

      const selects = button.closest('.psf-practice-card').querySelectorAll('.psf-pq-select');
      let allCorrect = true;
      let answeredCount = 0;

      selects.forEach(select => {
        const fieldName = select.id.split('-').slice(1).join('-');
        const userValue = select.value;
        const feedbackEl = document.getElementById(`${select.id}-feedback`);

        if (!feedbackEl) return;

        if (!userValue) {
          feedbackEl.textContent = 'Please select an answer.';
          feedbackEl.className = 'psf-pq-feedback incorrect';
          allCorrect = false;
          return;
        }

        answeredCount++;

        const correctAnswer = answers[fieldName];

        if (userValue === correctAnswer) {
          feedbackEl.textContent = `✓ Correct! (${labels[fieldName]})`;
          feedbackEl.className = 'psf-pq-feedback correct';
        } else {
          feedbackEl.textContent = `✗ Incorrect. Hint: ${labels[fieldName]}`;
          feedbackEl.className = 'psf-pq-feedback incorrect';
          allCorrect = false;
        }
      });

      const resultEl = document.getElementById(`problem${problemNum}-result`);

      if (!resultEl) return;

      if (answeredCount === 0) {
        resultEl.textContent = 'Please answer at least one question.';
        resultEl.className = 'psf-pq-result visible error';
        return;
      }

      if (allCorrect) {
        resultEl.textContent = '🎉 All answers correct! Great understanding of the framework!';
        resultEl.className = 'psf-pq-result visible success';
      } else {
        resultEl.textContent = 'Some answers need review. Check the hints above and try again.';
        resultEl.className = 'psf-pq-result visible error';
      }
    });
  });

});
