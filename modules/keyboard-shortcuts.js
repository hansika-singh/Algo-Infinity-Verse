export function initKeyboardShortcuts() {
  const toggleBtn = document.getElementById('shortcutsToggle');
  const modal = document.getElementById('shortcutsModal');
  const closeBtns = document.querySelectorAll('#shortcutsModalClose');

  if (toggleBtn && modal) {
    toggleBtn.addEventListener('click', () => toggleShortcutModal());
    closeBtns.forEach(btn => btn.addEventListener('click', () => closeShortcutModal()));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeShortcutModal();
    });
  }

  document.addEventListener('keydown', function(e) {
    const tag = e.target.tagName;
    const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;

    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.focus();
    }
    if (e.altKey && e.key === 'h') {
      e.preventDefault();
      window.location.href = '#home';
    }
    if (e.altKey && e.key === 't') {
      e.preventDefault();
      window.location.href = '/pages/learning/learning-topics.html';
    }
    if (e.altKey && e.key === 'p') {
      e.preventDefault();
      window.location.href = '/pages/practice/problems.html';
    }
    if (e.altKey && e.key === 'q') {
      e.preventDefault();
      window.location.href = '#quiz';
    }
    if (e.altKey && e.key === 'd') {
      e.preventDefault();
      window.location.href = '#dashboard';
    }
    if (
      e.key === '/' &&
      !isEditing &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      e.preventDefault();
      const navSearch = document.getElementById('navSearchDesktop');
      const searchInput = navSearch?.querySelector('.nav-search-input');
      if (navSearch && searchInput) {
        if (!navSearch.classList.contains('expanded')) {
          navSearch.classList.add('expanded');
        }
        setTimeout(() => {
          searchInput.focus();
          searchInput.select();
        }, 250);
      }
    }
    if (e.key === 'Escape') {
      const modal = document.getElementById('shortcutsModal');
      if (modal && modal.style.display !== 'none') {
        closeShortcutModal();
      }
    }
    if (e.key === '?' && !isEditing) {
      e.preventDefault();
      toggleShortcutModal();
    }
  });
}

function toggleShortcutModal() {
  const modal = document.getElementById('shortcutsModal');
  if (!modal) return;
  const isVisible = modal.classList.contains('shortcuts-modal--visible');
  if (isVisible) {
    closeShortcutModal();
  } else {
    openShortcutModal();
  }
}

function openShortcutModal() {
  const modal = document.getElementById('shortcutsModal');
  if (!modal) return;
  // Ensure modal is displayed (but invisible) before transitioning
  modal.style.display = 'flex';
  // Force reflow to ensure the display property takes effect before the class transition
  void modal.offsetWidth;
  modal.classList.add('shortcuts-modal--visible');
  document.body.classList.add('modal-open');
  document.body.classList.add('shortcuts-modal-open');
}

function closeShortcutModal() {
  const modal = document.getElementById('shortcutsModal');
  if (!modal) return;
  modal.classList.remove('shortcuts-modal--visible');
  // Unlock scroll immediately; visibility transition handles the fade-out visually
  document.body.classList.remove('modal-open');
  document.body.classList.remove('shortcuts-modal-open');
  // Wait for the CSS transition to complete before hiding the element
  setTimeout(() => {
    if (!modal.classList.contains('shortcuts-modal--visible')) {
      modal.style.display = 'none';
    }
  }, 200); // match CSS transition duration
}

window.openShortcutModal = openShortcutModal;
window.closeShortcutModal = closeShortcutModal;
// Legacy global exports
window.initKeyboardShortcuts = initKeyboardShortcuts;
