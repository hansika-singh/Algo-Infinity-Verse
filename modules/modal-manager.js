export function initModalManager() {
    const activeModals = new Set();
    
    function isModalElement(el) {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
        const classes = el.className?.toString().toLowerCase() || "";
        const id = el.id?.toLowerCase() || "";
        return classes.includes('modal') || 
               id.includes('modal') || 
               el.getAttribute('role') === 'dialog' || 
               el.getAttribute('aria-modal') === 'true';
    }
    
    function getFocusableElements(el) {
        return el.querySelectorAll('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]');
    }

    function setupModalAccessibility(modal) {
        if (!modal.getAttribute('role')) {
            modal.setAttribute('role', 'dialog');
        }
        modal.setAttribute('aria-modal', 'true');
        
        const header = modal.querySelector('h2, h3, h4, .modal-title, .quiz-modal-header h3');
        if (header && !modal.getAttribute('aria-labelledby')) {
            if (!header.id) {
                header.id = 'modal-title-' + Math.random().toString(36).substr(2, 9);
            }
            modal.setAttribute('aria-labelledby', header.id);
        }
    }

    function trapFocus(e, modal) {
        if (e.key !== 'Tab') return;
        const focusable = Array.from(getFocusableElements(modal)).filter(el => el.tabIndex !== -1);
        if (focusable.length === 0) return;
        
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === first) {
                last.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === last) {
                first.focus();
                e.preventDefault();
            }
        }
    }

    function handleModalOpen(modal) {
        if (activeModals.has(modal)) return;
        activeModals.add(modal);
        
        setupModalAccessibility(modal);
        
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
        document.body.classList.add('modal-open');
        
        modal._trapFocusListener = (e) => trapFocus(e, modal);
        modal.addEventListener('keydown', modal._trapFocusListener);
        
        const focusable = getFocusableElements(modal);
        modal._previouslyFocused = document.activeElement;
        if (focusable.length > 0) {
            setTimeout(() => focusable[0].focus(), 50);
        }
        
        if (!modal._overlayCloseBound) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
            modal._overlayCloseBound = true;
        }
    }

    function handleModalClose(modal) {
        if (!activeModals.has(modal)) return;
        activeModals.delete(modal);
        
        if (modal._trapFocusListener) {
            modal.removeEventListener('keydown', modal._trapFocusListener);
            modal._trapFocusListener = null;
        }
        
        if (modal._previouslyFocused && modal._previouslyFocused.focus) {
            modal._previouslyFocused.focus();
            modal._previouslyFocused = null;
        }
        
        if (activeModals.size === 0) {
            document.body.classList.remove('modal-open');
        }
    }

    function closeModal(modal) {
        if (modal.classList.contains('active')) {
            modal.classList.remove('active');
        } else if (modal.style.display && modal.style.display !== 'none') {
            modal.style.display = 'none';
        } else if (modal.classList.contains('show')) {
            modal.classList.remove('show');
        } else if (!modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
        }
    }

    function checkElement(element) {
        if (!isModalElement(element)) return;
        
        const isVisible = element.classList.contains('active') || 
                          element.classList.contains('show') || 
                          element.style.display === 'flex' || 
                          element.style.display === 'block' ||
                          (element.style.display && element.style.display !== 'none' && !element.classList.contains('hidden')) ||
                          (!element.classList.contains('hidden') && element.classList.contains('active')) ||
                          (element.classList.contains('modal-overlay') && !element.classList.contains('hidden'));
        
        if (isVisible) {
            handleModalOpen(element);
        } else {
            handleModalClose(element);
        }
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes') {
                checkElement(mutation.target);
            } else if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (isModalElement(node)) {
                            checkElement(node);
                        }
                        node.querySelectorAll && node.querySelectorAll('.modal, .modal-overlay, [class*="modal"]').forEach(checkElement);
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['class', 'style']
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            activeModals.forEach(modal => {
                closeModal(modal);
            });
        }
    });

    document.querySelectorAll('.modal, .modal-overlay, [class*="modal"]').forEach(checkElement);
}
// Legacy global exports
window.initModalManager = initModalManager;
