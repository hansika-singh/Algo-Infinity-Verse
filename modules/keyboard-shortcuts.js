export function initKeyboardShortcuts() {
  const toggleBtn = document.getElementById('shortcutsToggle');
  const modal = document.getElementById('shortcutsModal');
  const closeBtns = document.querySelectorAll('#shortcutsModalClose, #shortcutsModalCloseBtn');

  if (toggleBtn && modal) {
    toggleBtn.addEventListener('click', () => toggleShortcutModal());
    closeBtns.forEach(btn => btn.addEventListener('click', () => closeShortcutModal()));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeShortcutModal();
    });
  }

  document.addEventListener('keydown', function(e) {
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
      window.location.href = '#topics';
    }
    if (e.altKey && e.key === 'p') {
      e.preventDefault();
      window.location.href = '#practice';
    }
    if (e.altKey && e.key === 'q') {
      e.preventDefault();
      window.location.href = '#quiz';
    }
    if (e.altKey && e.key === 'd') {
      e.preventDefault();
      window.location.href = '#dashboard';
    }
    if (e.key === 'Escape') {
      closeShortcutModal();
    }
    if (e.key === '?') {
      toggleShortcutModal();
    }
  });
}

function toggleShortcutModal() {
  const modal = document.getElementById('shortcutsModal');
  if (!modal) return;
  const isVisible = modal.style.display !== 'none';
  modal.style.display = isVisible ? 'none' : 'flex';
  document.body.classList.toggle('modal-open', !isVisible);
}

function openShortcutModal() {
  const modal = document.getElementById('shortcutsModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
  }
}

function closeShortcutModal() {
  const modal = document.getElementById('shortcutsModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }
}

window.openShortcutModal = openShortcutModal;
window.closeShortcutModal = closeShortcutModal;
// Legacy global exports
window.initKeyboardShortcuts = initKeyboardShortcuts;
