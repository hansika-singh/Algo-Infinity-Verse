/**
 * NavigationManager
 * Handles dynamic routing via URL parameters without page reloads.
 * Preserves context (search, filters, active tabs, modals) and provides dynamic breadcrumbs.
 */
class NavigationManager {
  constructor() {
    this.state = this.parseUrlState();
    this.breadcrumbsContainer = null;
    this.onStateChangeCallbacks = [];
    this.lastScrollY = window.scrollY;
    this.scrollTick = null;

    // Bind methods
    this.handlePopState = this.handlePopState.bind(this);
    this.initBreadcrumbs = this.initBreadcrumbs.bind(this);
    this.syncBreadcrumbVisibility = this.syncBreadcrumbVisibility.bind(this);
    
    // Listen to browser back/forward
    window.addEventListener('popstate', this.handlePopState);
    // Track scroll for bottom breadcrumb visibility
    window.addEventListener('scroll', this.syncBreadcrumbVisibility, { passive: true });
    
    // Try to find breadcrumb container immediately (if DOM already ready)
    this.initBreadcrumbs();
    // Watch for the element to appear (handles async partial loading on any page)
    this.observeBreadcrumbs();
  }

  syncBreadcrumbVisibility() {
    if (!this.breadcrumbsContainer) return;
    if (this.scrollTick) return;
    this.scrollTick = requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - this.lastScrollY;
      const isAtBottom = window.innerHeight + currentScrollY >= document.documentElement.scrollHeight - 120;
      const isAtTop = currentScrollY <= 120;

      if (isAtTop || isAtBottom) {
        this.breadcrumbsContainer.classList.add('breadcrumb-visible');
      } else if (Math.abs(delta) > 15) {
        if (delta > 0) {
          this.breadcrumbsContainer.classList.remove('breadcrumb-visible');
        } else {
          this.breadcrumbsContainer.classList.add('breadcrumb-visible');
        }
      }
      this.lastScrollY = currentScrollY;
      this.scrollTick = null;
    });
  }

  initBreadcrumbs() {
    if (this.breadcrumbsContainer) return;
    const el = document.getElementById('dynamic-breadcrumbs');
    if (el) {
      // Prefer the element inside the navbar partial if one exists.
      const navbarEl = document.getElementById('navbar-placeholder')
        && document.getElementById('navbar-placeholder').querySelector('#dynamic-breadcrumbs');
      this.breadcrumbsContainer = navbarEl || el;
      this.breadcrumbsContainer.classList.add('breadcrumb-visible');
      this.renderBreadcrumbs();
    }
  }

  observeBreadcrumbs() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', () => this.observeBreadcrumbs());
      return;
    }
    if (this._observer) return;
    this._observer = new MutationObserver(() => {
      const el = document.getElementById('dynamic-breadcrumbs');
      if (!el) return;

      // If we already have an element, only upgrade to a "better" one
      // (i.e. the element that lives inside the navbar partial).
      if (this.breadcrumbsContainer) {
        if (el === this.breadcrumbsContainer) return;
        const newIsInNavbar = !!el.closest('#navbar-placeholder');
        if (!newIsInNavbar) return; // keep the current element
      }

      this.breadcrumbsContainer = el;
      this.breadcrumbsContainer.classList.add('breadcrumb-visible');
      this.renderBreadcrumbs();

      // Once the navbar's element is in play we're done — stop observing.
      if (el.closest('#navbar-placeholder')) {
        this._observer.disconnect();
        this._observer = null;
      }
    });
    this._observer.observe(document.body, { childList: true, subtree: true });
  }

  // Parse query parameters into a state object
  parseUrlState() {
    const params = new URLSearchParams(window.location.search);
    return {
      tab: params.get('tab') || 'practice',
      filter: params.get('filter') || 'all',
      search: params.get('search') || '',
      problem: params.get('problem') || null,
      step: params.get('step') || null,
      roadmapType: params.get('roadmapType') || 'basic'
    };
  }

  // Serialize state object into query parameters string
  serializeState(state) {
    const params = new URLSearchParams();
    if (state.tab && state.tab !== 'practice') params.set('tab', state.tab);
    if (state.filter && state.filter !== 'all') params.set('filter', state.filter);
    if (state.search) params.set('search', state.search);
    if (state.problem) params.set('problem', state.problem);
    if (state.step) params.set('step', state.step);
    if (state.roadmapType && state.roadmapType !== 'basic') params.set('roadmapType', state.roadmapType);
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : window.location.pathname;
  }

  // Update specific state keys and push to history
  updateState(newState, replace = false) {
    this.state = { ...this.state, ...newState };
    const newUrl = this.serializeState(this.state);
    
    if (replace) {
      window.history.replaceState(this.state, '', newUrl);
    } else {
      window.history.pushState(this.state, '', newUrl);
    }
    
    this.renderBreadcrumbs();
    this.notifyListeners();
  }

  // Handle browser back/forward
  handlePopState(event) {
    // If event.state is null, try parsing URL again
    this.state = event.state || this.parseUrlState();
    this.renderBreadcrumbs();
    this.notifyListeners();
  }

  // Register a callback to fire when state changes (e.g. from popstate)
  subscribe(callback) {
    this.onStateChangeCallbacks.push(callback);
  }

  notifyListeners() {
    this.onStateChangeCallbacks.forEach(cb => cb(this.state));
  }

  // Render breadcrumb UI based on current state
  renderBreadcrumbs() {
    if (!this.breadcrumbsContainer) return;

    const crumbs = [];
    crumbs.push({ label: 'Home', state: { tab: 'practice', filter: 'all', search: '', problem: null, step: null } });

    const hasSearchParams = !!window.location.search;

    if (hasSearchParams) {
      // SPA navigation on index.html — build crumbs from URL params
      this._buildSPACrumbs(crumbs);
    } else {
      // Sub-page (standalone HTML) — build from URL path + title
      this._buildSubPageCrumbs(crumbs);
    }

    // Mark the last as active if not already
    if (crumbs.length > 0 && !crumbs[crumbs.length - 1].isActive) {
      crumbs[crumbs.length - 1].isActive = true;
    }

    let html = '';
    crumbs.forEach((crumb, index) => {
      if (crumb.isActive) {
        html += `<span class="breadcrumb-active">${this.escapeHtml(crumb.label)}</span>`;
      } else {
        const stateJson = JSON.stringify(crumb.state).replace(/"/g, '&quot;');
        html += `<a href="#" class="breadcrumb-link" data-state="${stateJson}">${this.escapeHtml(crumb.label)}</a>`;
      }
      if (index < crumbs.length - 1) {
        html += `<span class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></span>`;
      }
    });

    this.breadcrumbsContainer.innerHTML = html;

    // Attach listeners
    this.breadcrumbsContainer.querySelectorAll('.breadcrumb-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetState = JSON.parse(link.getAttribute('data-state'));
        this.updateState(targetState);
      });
    });
  }

  // SPA breadcrumb logic — driven by URL query params
  _buildSPACrumbs(crumbs) {
    const isHomepage =
      this.state.tab === 'practice' &&
      this.state.filter === 'all' &&
      !this.state.search &&
      !this.state.problem &&
      !this.state.step;

    if (isHomepage) return;

    if (this.state.tab === 'practice') {
      crumbs.push({ label: 'Practice Problems', state: { tab: 'practice', filter: 'all', search: '', problem: null, step: null } });

      if (this.state.filter !== 'all') {
        const filterLabel = this.state.filter.charAt(0).toUpperCase() + this.state.filter.slice(1);
        crumbs.push({ label: `Filter: ${filterLabel}`, state: { tab: 'practice', filter: this.state.filter, search: '', problem: null, step: null } });
      }

      if (this.state.search) {
        crumbs.push({ label: `Search: "${this.state.search}"`, state: { tab: 'practice', filter: this.state.filter, search: this.state.search, problem: null, step: null } });
      }

      if (this.state.problem) {
        crumbs.push({ label: `Problem #${this.state.problem}`, state: this.state, isActive: true });
      }
    } else if (this.state.tab === 'roadmap') {
      crumbs.push({ label: 'Learning Roadmaps', state: { tab: 'roadmap', step: null } });

      const typeLabel = this.state.roadmapType === 'advanced' ? 'Advanced' : 'Basic';
      crumbs.push({ label: `${typeLabel} Path`, state: { tab: 'roadmap', roadmapType: this.state.roadmapType, step: null } });

      if (this.state.step) {
        crumbs.push({ label: `Step ${this.state.step}`, state: this.state, isActive: true });
      }
    } else if (this.state.tab === 'leaderboard') {
      crumbs.push({ label: 'Leaderboard', state: this.state, isActive: true });
    } else if (this.state.tab === 'community') {
      crumbs.push({ label: 'Community', state: this.state, isActive: true });
    }
  }

  // Build breadcrumb crumbs for standalone sub-pages from URL path + title.
  // Detects /pages/[category]/[subcategory]/ patterns to insert a parent crumb.
  _buildSubPageCrumbs(crumbs) {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    const pageTitle = this._getSubPageTitle();

    // Under /pages/[category]/… — insert the category as a parent crumb
    if (segments.length >= 3 && segments[0] === 'pages') {
      const category = segments[1];
      const categoryLabel = category
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      // Skip if the page title already begins with the category name
      // (e.g. /pages/interview/interview.html with title "Interview Preparation")
      const titleStarts = pageTitle &&
        pageTitle.toLowerCase().startsWith(categoryLabel.toLowerCase());
      if (!titleStarts) {
        crumbs.push({
          label: categoryLabel,
          state: this.state,
        });
      }
    }

    if (pageTitle) {
      crumbs.push({ label: pageTitle, state: this.state, isActive: true });
    }
  }

  // Derive a breadcrumb label for standalone sub-pages from document.title
  _getSubPageTitle() {
    const raw = document.title || '';
    // Most sub-pages use "Page Name — Algo Infinity Verse" or "Page Name | ..."
    const parts = raw.split(/\s*[—|–]\s*/).map(s => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      const title = parts[0];
      if (title && title !== 'Home' && !/^Algo\s+Infinity\s+Verse/i.test(title)) {
        return title;
      }
    }

    // Fallback: derive from the URL path folder name
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments.length >= 2) {
      const folder = segments[segments.length - 2];
      return folder
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    return null;
  }

  // Update the label of the active problem or step dynamically
  setDynamicLabel(label) {
    if (!this.breadcrumbsContainer) return;
    const activeEl = this.breadcrumbsContainer.querySelector('.breadcrumb-active');
    if (activeEl && (activeEl.textContent.includes('Problem #') || activeEl.textContent.includes('Step '))) {
      activeEl.textContent = label;
    }
  }

  escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  }
}

// Export a singleton instance
const navManager = new NavigationManager();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = navManager;
} else {
  window.navManager = navManager;
}
