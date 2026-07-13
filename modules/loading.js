let loadingTimeout = null;
let animationObserver = null;

export function initLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');

  if (!loadingScreen) {
    void 0;
    initializeAnimations();
    return;
  }

  // Skip loading animation on non-landing pages (all individual visualizers)
  if (!document.body.hasAttribute('data-no-loading')) {
    loadingScreen.classList.add('hidden');
    initializeAnimations();
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    loadingScreen.classList.add('hidden');
    initializeAnimations();
    return;
  }

  // NEW: set context-specific loading text
  const textEl = loadingScreen.querySelector('#loadingScreenText');
  if (textEl) {
    const customMessage = document.body.getAttribute('data-loading-message');
    textEl.textContent = customMessage || 'Loading...';
  }

  const FALLBACK_TIMEOUT = 3000;
  let isHidden = false;

  function hideLoadingScreen() {
    if (isHidden) return;
    isHidden = true;

    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      loadingTimeout = null;
    }

    loadingScreen.classList.add('hidden');
    initializeAnimations();
  }

  if (document.readyState === 'complete') {
    hideLoadingScreen();
  } else {
    window.addEventListener('load', hideLoadingScreen);

    loadingTimeout = setTimeout(() => {
      if (!isHidden) {
        void 0;
        hideLoadingScreen();
      }
    }, FALLBACK_TIMEOUT);
  }

  window.addEventListener('beforeunload', () => {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      loadingTimeout = null;
    }
    window.removeEventListener('load', hideLoadingScreen);
  });
}

function initializeAnimations() {
  const elements = document.querySelectorAll('.animate-in');

  if (!elements.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    elements.forEach((el) => {
      el.classList.add('visible');
    });
    return;
  }

  if (animationObserver) {
    animationObserver.disconnect();
    animationObserver = null;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add('visible');
          observer.unobserve(el);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  elements.forEach((el) => {
    observer.observe(el);
  });

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

export function cleanupLoadingScreen() {
  if (loadingTimeout) {
    clearTimeout(loadingTimeout);
    loadingTimeout = null;
  }

  if (animationObserver) {
    animationObserver.disconnect();
    animationObserver = null;
  }

  window.removeEventListener('load', () => {});
}
// Legacy global exports
window.initLoadingScreen = initLoadingScreen;
