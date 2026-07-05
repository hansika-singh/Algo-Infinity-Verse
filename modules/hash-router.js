export function initHashRouter() {
  window.addEventListener('hashchange', () => {
    const currentHash = window.location.hash || '#home';
    if (currentHash === '#home' || currentHash === '') {
      document.querySelectorAll('*').forEach(element => {
        const id = element.id ? element.id.toLowerCase() : '';
        const className = element.className ? element.className.toString().toLowerCase() : '';
        if (id.includes('quiz') || className.includes('quiz') || id.includes('assistant')) {
          element.dataset.routeHidden = 'true';
          element.style.display = 'none';
        } else if (element.dataset.routeHidden === 'true') {
          delete element.dataset.routeHidden;
          element.classList.remove('hidden');
          element.style.display = '';
        }
      });
      if (typeof tQuiz !== 'undefined' && tQuiz !== null) tQuiz = null;
    }
  });
}
