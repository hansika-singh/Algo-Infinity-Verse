/**
 * splash.js — Algo Infinity Verse Loading Animation
 *
 * A self-contained module for the splash/loading screen animation.
 *
 * Animation sequence:
 * 1. Code particles begin floating upward (CSS animation)
 * 2. Typewriter effect types "Algo Infinity Verse" character by character
 * 3. Infinity symbol draws via SVG stroke-dashoffset animation
 * 4. Tagline fades in with a subtle scale pop
 * 5. Brief hold while everything is visible
 * 6. Loader container scales down and fades out
 * 7. Loading screen fades out
 *
 * Dependencies: GSAP 3.12+ (loaded as a global `gsap` via CDN)
 */

let animationObserver = null;
let loadingAnimationTimeline = null;
let typewriterInterval = null;

/**
 * Initializes the loading screen animation.
 * Call this once when the page is ready.
 */
export function initLoadingScreen() {
  // If the inline script in index.html already started the animation, skip.
  // But still set up scroll-triggered animations for .animate-in elements.
  if (window.__loadingStarted) {
    initializeAnimations();
    return;
  }

  const loadingScreen = document.getElementById('loading-screen');

  if (!loadingScreen) {
    initializeAnimations();
    return;
  }

  // Skip on pages that opt out via data-no-loading attribute
  if (document.body.hasAttribute('data-no-loading')) {
    loadingScreen.style.display = 'none';
    initializeAnimations();
    return;
  }

  // Skip animation for users who prefer reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    loadingScreen.style.display = 'none';
    initializeAnimations();
    return;
  }

  // Grab DOM elements
  const path = document.querySelector('.infinity-path');
  const typedText = document.querySelector('.typed-text');
  const cursor = document.querySelector('.cursor');
  const tagline = document.querySelector('.tagline');
  const loaderContainer = document.querySelector('.loader-container');

  if (!path || !typedText) {
    loadingScreen.style.display = 'none';
    initializeAnimations();
    return;
  }

  // GSAP must be available
  if (typeof gsap === 'undefined') {
    loadingScreen.style.display = 'none';
    initializeAnimations();
    return;
  }

  // Prevent browser scroll restoration from fighting with our scrollTo(0,0)
  try { history.scrollRestoration = 'manual'; } catch(e) {}

  // Lock scroll while the loading screen is visible
  document.documentElement.style.scrollBehavior = 'auto';
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  // Ensure loading screen starts visible
  loadingScreen.style.opacity = '1';
  loadingScreen.style.visibility = 'visible';

  // ── Build the GSAP timeline ──
  const tl = gsap.timeline({
    onComplete: () => {
      // Kill typewriter interval
      if (typewriterInterval) {
        clearInterval(typewriterInterval);
        typewriterInterval = null;
      }
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      document.documentElement.style.scrollBehavior = '';
      // Re-enable normal scroll restoration after we've set the position
      try { history.scrollRestoration = 'auto'; } catch(e) {}

      loadingScreen.classList.add('hidden');
      loadingScreen.classList.remove('animating');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 100);
      initializeAnimations();
    }
  });

  loadingScreen.classList.add('animating');

  // Measure the infinity path length for the draw animation
  const pathLength = path.getTotalLength();
  // Initial path state — stroke color is inherited from CSS (.infinity-path)
  gsap.set(path, {
    strokeDasharray: pathLength,
    strokeDashoffset: pathLength
  });

  // Phase 1 — Draw the infinity symbol (starts immediately, no delay)
  tl.to(path, {
    strokeDashoffset: 0,
    duration: 2.5,
    ease: 'power2.inOut'
  }, 0);

  // Phase 2 — Fade in the tagline with a pop
  tl.to(tagline, {
    opacity: 1,
    scale: 1,
    duration: 0.6,
    ease: 'back.out(1.5)'
  }, '-=1.2');

  // Phase 3 — Brief hold while everything is visible & fully lit
  tl.to({}, { duration: 1.2 });

  // Phase 4 — Shrink & fade the loader container
  tl.to(loaderContainer, {
    opacity: 0,
    scale: 0.9,
    duration: 0.8,
    ease: 'power2.inOut'
  });

  // Phase 5 — Fade out the entire loading screen
  tl.to(loadingScreen, {
    opacity: 0,
    duration: 0.6,
    ease: 'power2.out'
  }, '-=0.5');

  // Store reference for cleanup
  loadingAnimationTimeline = tl;

  // Start typewriter effect immediately (no delay)
  startTypewriter('Algo Infinity Verse', typedText);

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    if (typewriterInterval) {
      clearInterval(typewriterInterval);
      typewriterInterval = null;
    }
    if (loadingAnimationTimeline) {
      loadingAnimationTimeline.kill();
      loadingAnimationTimeline = null;
    }
  });

  // Expose for debugging / playground
  window.__loadingTimeline = tl;
}

/**
 * Cleanup function to kill the animation and disconnect observers.
 */
export function cleanupLoadingScreen() {
  if (typewriterInterval) {
    clearInterval(typewriterInterval);
    typewriterInterval = null;
  }
  if (loadingAnimationTimeline) {
    loadingAnimationTimeline.kill();
    loadingAnimationTimeline = null;
  }
  if (animationObserver) {
    animationObserver.disconnect();
    animationObserver = null;
  }
  window.__loadingTimeline = null;
}

// ── Internal helpers ──

/**
 * Typewriter effect: types out text character by character.
 */
function startTypewriter(text, element) {
  // Clear any existing interval
  if (typewriterInterval) {
    clearInterval(typewriterInterval);
  }

  let index = 0;
  element.textContent = '';

  typewriterInterval = setInterval(() => {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index++;
    } else {
      clearInterval(typewriterInterval);
      typewriterInterval = null;
    }
  }, 110);
}

/**
 * Initializes scroll-triggered animations after the loading screen is gone.
 */
function initializeAnimations() {
  const elements = document.querySelectorAll('.animate-in');
  if (!elements.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  if (animationObserver) {
    animationObserver.disconnect();
    animationObserver = null;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  elements.forEach(el => observer.observe(el));
  animationObserver = observer;

  const cleanup = () => {
    if (animationObserver) {
      animationObserver.disconnect();
      animationObserver = null;
    }
    window.removeEventListener('beforeunload', cleanup);
  };
  window.addEventListener('beforeunload', cleanup);
}

// Legacy global export
window.initLoadingScreen = initLoadingScreen;
