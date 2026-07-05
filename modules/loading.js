let loadingTimeout = null;
let animationObserver = null;
let isPageLoaded = false;

export function initLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    
    if (!loadingScreen) {
        console.warn("Loading screen element not found");
        initializeAnimations();
        return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        loadingScreen.classList.add("hidden");
        initializeAnimations();
        return;
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
        
        loadingScreen.classList.add("hidden");
        initializeAnimations();
    }

    if (document.readyState === 'complete') {
        hideLoadingScreen();
    } else {
        window.addEventListener('load', hideLoadingScreen);
        
        loadingTimeout = setTimeout(() => {
            if (!isHidden) {
                console.warn("Loading screen timeout - forcing hide");
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
        elements.forEach(el => {
            el.classList.add('visible');
        });
        return;
    }

    if (animationObserver) {
        animationObserver.disconnect();
        animationObserver = null;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                el.classList.add('visible');
                observer.unobserve(el);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => {
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

export function isReducedMotionPreferred() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}   