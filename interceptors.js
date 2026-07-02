(function() {
  const originalFetch = window.fetch;
  let isRefreshing = false;
  let refreshPromise = null;

  const UNAUTHENTICATED_ENDPOINTS = [
    '/api/spaced-repetition',
    '/api/leaderboard',
    '/api/problem-notes',
    '/api/recommendations',
  ];

  function shouldRedirectOn401(url) {
    if (url.includes('/api/refresh') || url.includes('/api/login') || url.includes('/api/signup')) {
      return false;
    }
    for (const endpoint of UNAUTHENTICATED_ENDPOINTS) {
      if (url.startsWith(endpoint)) {
        return false;
      }
    }
    return true;
  }

  window.fetch = async function(...args) {
    const response = await originalFetch(...args);

    const requestObj = args[0];
    const url = typeof requestObj === 'string' ? requestObj : requestObj.url;
    
    if (response.status === 401 && shouldRedirectOn401(url)) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = originalFetch('/api/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }).then(res => {
          isRefreshing = false;
          if (!res.ok) {
            const path = window.location.pathname;
            const isAuthPage = path === '/login.html' || path === '/login' || path.endsWith('/login.html') ||
                               path === '/signup.html' || path === '/signup' || path.endsWith('/signup.html') ||
                               path === '/verify-email' || path.endsWith('/verify-email.html') ||
                               path === '/verify-email.html';
            if (!isAuthPage) {
               window.location.href = '/login.html?session_expired=true';
            }
            throw new Error('Token refresh failed');
          }
          return res;
        }).catch(err => {
          isRefreshing = false;
          throw err;
        });
      }

      try {
        await refreshPromise;
        return originalFetch(...args);
      } catch (e) {
        return response;
      }
    }
    
    return response;
  };
})();
