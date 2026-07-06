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

    // Bind methods
    this.handlePopState = this.handlePopState.bind(this);
    
    // Listen to browser back/forward
    window.addEventListener('popstate', this.handlePopState);
    
    // Initial setup
    document.addEventListener('DOMContentLoaded', () => {
      this.breadcrumbsContainer = document.getElementById('dynamic-breadcrumbs');
      this.renderBreadcrumbs();
    });
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

    // Tab level
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
        // We might not know the problem title here, rely on the main script to update it if needed.
        // But we'll put a placeholder
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
