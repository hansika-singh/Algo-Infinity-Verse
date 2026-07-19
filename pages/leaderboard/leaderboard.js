/* =====================================================
   LEADERBOARD — Full Interactive Logic
   ===================================================== */

(function () {
  'use strict';

  // ── Configuration ──────────────────────────────────
  const LOAD_MORE_SIZE = 10;
  const CACHE_KEY_PREFIX = 'lb_cache_';
  const RANK_HISTORY_KEY = 'lb_rank_history';

  // ── State ──────────────────────────────────────────
  let state = {
    period: 'all',
    nextPage: 1,
    totalUsers: 0,
    leaders: [],
    currentUserId: null,
    searchQuery: '',
    isLoading: false,
  };

  // ── DOM References ─────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const dom = {
    loader: $('lbLoader'),
    tableWrap: $('lbTableWrap'),
    tableBody: $('lbTableBody'),
    empty: $('lbEmpty'),
    podium: {
      container: $('lbPodium'),
      cards: [
        { rank: 1, avatar: $('lbPodiumAvatar1'), name: $('lbPodiumName1'), xp: $('lbPodiumXp1'), level: $('lbPodiumLevel1'), el: $('lbPodium1') },
        { rank: 2, avatar: $('lbPodiumAvatar2'), name: $('lbPodiumName2'), xp: $('lbPodiumXp2'), level: $('lbPodiumLevel2'), el: $('lbPodium2') },
        { rank: 3, avatar: $('lbPodiumAvatar3'), name: $('lbPodiumName3'), xp: $('lbPodiumXp3'), level: $('lbPodiumLevel3'), el: $('lbPodium3') },
      ],
    },
    loadMoreWrap: $('lbLoadMoreWrap'),
    loadMoreBtn: $('lbLoadMoreBtn'),
    searchInput: $('lbSearchInput'),
    searchClear: $('lbSearchClear'),

    sticky: {
      card: $('lbStickyCard'),
      rank: $('lbStickyRank'),
      xp: $('lbStickyXp'),
      level: $('lbStickyLevel'),
    },

    modal: {
      overlay: $('lbProfileModal'),
      close: $('lbModalClose'),
      avatar: $('lbModalAvatar'),
      name: $('lbModalName'),
      rank: $('lbModalRank'),
      xp: $('lbModalXp'),
      level: $('lbModalLevel'),
      badges: $('lbModalBadges'),
    },
  };

  // ── Helpers ────────────────────────────────────────
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getCurrentUserId() {
    return (
      window.algoAuth?.user?.sub ||
      window.algoAuth?.user?.id ||
      (typeof cachedSession !== 'undefined' ? cachedSession?.user?.sub : null) ||
      null
    );
  }

  function getCurrentDisplayName() {
    return (
      window.algoAuth?.user?.name ||
      (typeof cachedSession !== 'undefined' ? cachedSession?.user?.name : null) ||
      (window.userProgress ? window.userProgress.name : null) ||
      null
    );
  }

  function getAvatarHtml(avatar, size) {
    if (!avatar) {
      return '<span style="background:#8B9DC4;width:' + size + ';height:' + size + ';border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.9rem;font-weight:600;">L</span>';
    }
    if (typeof avatar === 'string' && (avatar.startsWith('http') || avatar.startsWith('data:image'))) {
      return '<img src="' + escapeHtml(avatar) + '" alt="" style="width:' + size + ';height:' + size + ';object-fit:cover;">';
    }
    var initial = (avatar && avatar.initial) ? avatar.initial : 'L';
    var bg = (avatar && avatar.bg) ? avatar.bg : '#8B9DC4';
    return '<span style="background:' + bg + ';width:' + size + ';height:' + size + ';border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.9rem;font-weight:600;">' + escapeHtml(initial) + '</span>';
  }

  function getAvatarBg(avatar) {
    if (!avatar) return '#8B9DC4';
    if (typeof avatar === 'string') return '#8B9DC4';
    return avatar.bg || '#8B9DC4';
  }

  function getAvatarInitial(avatar) {
    if (!avatar) return 'L';
    if (typeof avatar === 'string') return 'L';
    return avatar.initial || 'L';
  }

  function getAvatarUrl(avatar) {
    if (!avatar) return null;
    if (typeof avatar === 'string' && (avatar.startsWith('http') || avatar.startsWith('data:image'))) {
      return avatar;
    }
    return null;
  }

  // ── Rank Change Tracking ──────────────────────────
  function loadRankHistory() {
    try {
      var raw = localStorage.getItem(RANK_HISTORY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) { return {}; }
  }

  function saveRankHistory(leaders, period) {
    try {
      var history = loadRankHistory();
      history[period] = {};
      leaders.forEach(function (u) {
        history[period][u.id] = { rank: u.rank, xp: u.xp };
      });
      localStorage.setItem(RANK_HISTORY_KEY, JSON.stringify(history));
    } catch (_) { /* ignore */ }
  }

  function getRankChange(leaderId, currentRank, period) {
    var history = loadRankHistory();
    var prev = history[period] && history[period][leaderId];
    if (!prev) return 'same';
    if (prev.rank > currentRank) return 'up';
    if (prev.rank < currentRank) return 'down';
    return 'same';
  }

  // ── API Fetch ──────────────────────────────────────
  function buildUrl(page, period) {
    return '/api/leaderboard?page=' + page + '&limit=' + LOAD_MORE_SIZE + '&period=' + encodeURIComponent(period);
  }

  function fetchLeaderboard(page, period) {
    if (location.protocol === 'file:') {
      return Promise.resolve({ leaders: [], currentUserId: null, pagination: { totalUsers: 0, totalPages: 1 } });
    }

    var apiCache = window.apiCache;
    var apiAbort = window.apiAbort;

    if (!apiCache || !apiAbort) {
      return Promise.resolve({ leaders: [], currentUserId: null, pagination: { totalUsers: 0, totalPages: 1 } });
    }

    var signal = apiAbort.getSignal('leaderboardPage');
    return apiCache
      .fetchWithCache(buildUrl(page, period), { credentials: 'include', signal }, 300000, 'json')
      .then(function (resp) {
        apiAbort.clearSignal('leaderboardPage');
        return resp;
      })
      .catch(function (err) {
        apiAbort.clearSignal('leaderboardPage');
        if (err && err.name === 'AbortError') throw err;
        return { leaders: [], currentUserId: null, pagination: { totalUsers: 0, totalPages: 1 } };
      });
  }

  // ── Podium Rendering ──────────────────────────────
  function renderPodium(leaders, currentUserId) {
    var top3 = leaders.slice(0, 3);

    dom.podium.cards.forEach(function (slot, i) {
      var user = top3[i];

      if (!user) {
        slot.el.style.display = 'none';
        return;
      }

      slot.el.style.display = '';

      var avatarUrl = getAvatarUrl(user.avatar);
      if (avatarUrl) {
        slot.avatar.innerHTML = '<img src="' + escapeHtml(avatarUrl) + '" alt="">';
      } else {
        var bg = getAvatarBg(user.avatar);
        var init = getAvatarInitial(user.avatar);
        slot.avatar.style.background = bg;
        slot.avatar.textContent = init;
      }

      var displayName = escapeHtml(user.name || 'Learner');
      var isCurrent = user.id === currentUserId || (user.id === 'local-user' && !currentUserId);
      slot.name.innerHTML = displayName + (isCurrent ? ' <span class="lb-current-badge">(You)</span>' : '');

      slot.xp.textContent = (user.xp !== undefined ? Number(user.xp).toLocaleString() : '0') + ' XP';
      slot.level.textContent = 'Level ' + (user.level || 1);
    });
  }

  // ── Table Rendering ───────────────────────────────
  function renderTable(leaders, currentUserId) {
    var html = '';

    leaders.forEach(function (user) {
      var isCurrent = user.id === currentUserId || (user.id === 'local-user' && !currentUserId);
      var displayName = escapeHtml(user.name || 'Learner');
      var rankClass = '';
      if (user.rank === 1) rankClass = 'lb-rank--1';
      else if (user.rank === 2) rankClass = 'lb-rank--2';
      else if (user.rank === 3) rankClass = 'lb-rank--3';

      var change = getRankChange(user.id, user.rank, state.period);
      var changeHtml = '';
      if (change === 'up') {
        changeHtml = '<span class="lb-change lb-change--up"><i class="fas fa-arrow-up lb-change-icon"></i> </span>';
      } else if (change === 'down') {
        changeHtml = '<span class="lb-change lb-change--down"><i class="fas fa-arrow-down lb-change-icon"></i> </span>';
      } else {
        changeHtml = '<span class="lb-change lb-change--same"><i class="fas fa-minus lb-change-icon"></i></span>';
      }

      var avatarUrl = getAvatarUrl(user.avatar);
      var avatarHtml;
      if (avatarUrl) {
        avatarHtml = '<div class="lb-row-avatar"><img src="' + escapeHtml(avatarUrl) + '" alt=""></div>';
      } else {
        var bg = getAvatarBg(user.avatar);
        var init = getAvatarInitial(user.avatar);
        avatarHtml = '<div class="lb-row-avatar" style="background:' + bg + '">' + escapeHtml(init) + '</div>';
      }

      html +=
        '<div class="lb-row' + (isCurrent ? ' lb-row--current' : '') + '" role="listitem" data-user-id="' + escapeHtml(user.id || '') + '">' +
          '<span class="lb-col-rank lb-rank ' + rankClass + '">#' + user.rank + '</span>' +
          '<span class="lb-col-avatar">' + avatarHtml + '</span>' +
          '<span class="lb-col-name"><span class="lb-row-name">' + displayName + (isCurrent ? ' <span class="lb-current-badge">You</span>' : '') + '</span></span>' +
          '<span class="lb-col-xp"><span class="lb-row-xp">' + (user.xp !== undefined ? Number(user.xp).toLocaleString() : '0') + '</span></span>' +
          '<span class="lb-col-level"><span class="lb-row-level">Lv.' + (user.level || 1) + '</span></span>' +
          '<span class="lb-col-change">' + changeHtml + '</span>' +
        '</div>';
    });

    dom.tableBody.innerHTML = html;

    // Click handler for user rows → open profile modal
    dom.tableBody.querySelectorAll('.lb-row').forEach(function (row) {
      row.addEventListener('click', function () {
        var userId = row.getAttribute('data-user-id');
        var user = state.leaders.find(function (u) { return u.id === userId; });
        if (user) openProfileModal(user);
      });
    });
  }

  // ── Load More Button ─────────────────────────────
  function renderLoadMoreButton() {
    if (state.searchQuery || state.leaders.length >= state.totalUsers) {
      dom.loadMoreWrap.classList.add('hidden');
    } else {
      dom.loadMoreWrap.classList.remove('hidden');
    }
  }

  // ── Sticky Card ────────────────────────────────────
  function updateStickyCard(leaders, currentUserId) {
    var currentUser = null;
    if (currentUserId) {
      currentUser = leaders.find(function (u) { return u.id === currentUserId; });
    }

    var userProgress = window.userProgress || {};

    if (currentUser) {
      dom.sticky.card.classList.remove('lb-sticky-card--hidden');
      dom.sticky.rank.textContent = '#' + currentUser.rank;
      dom.sticky.xp.textContent = (currentUser.xp !== undefined ? Number(currentUser.xp).toLocaleString() : '0') + ' XP';
      dom.sticky.level.textContent = 'Level ' + (currentUser.level || 1);
    } else if (currentUserId) {
      dom.sticky.card.classList.remove('lb-sticky-card--hidden');
      dom.sticky.rank.textContent = '#' + (userProgress.rank || '?');
      dom.sticky.xp.textContent = (userProgress.xp || 0).toLocaleString() + ' XP';
      dom.sticky.level.textContent = 'Level ' + (userProgress.level || 1);
    } else {
      dom.sticky.card.classList.add('lb-sticky-card--hidden');
    }
  }

  // ── Profile Modal ─────────────────────────────────
  function openProfileModal(user) {
    if (!user) return;

    var avatarUrl = getAvatarUrl(user.avatar);
    if (avatarUrl) {
      dom.modal.avatar.innerHTML = '<img src="' + escapeHtml(avatarUrl) + '" alt="">';
    } else {
      var bg = getAvatarBg(user.avatar);
      var init = getAvatarInitial(user.avatar);
      dom.modal.avatar.style.background = bg;
      dom.modal.avatar.textContent = init;
    }

    dom.modal.name.textContent = user.name || 'Learner';
    dom.modal.rank.textContent = '#' + (user.rank || '?');
    dom.modal.xp.textContent = (user.xp !== undefined ? Number(user.xp).toLocaleString() : '0');
    dom.modal.level.textContent = 'Level ' + (user.level || 1);
    dom.modal.badges.textContent = (user.xp !== undefined ? Number(user.xp).toLocaleString() + ' XP' : '—');

    dom.modal.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeProfileModal() {
    dom.modal.overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ── Main Render ────────────────────────────────────
  function render(leaders, currentUserId, pagination) {
    state.leaders = leaders;
    state.currentUserId = currentUserId;
    state.totalUsers = pagination ? pagination.totalUsers : leaders.length;

    // Save rank history for change tracking
    saveRankHistory(leaders, state.period);

    // Hide loader
    dom.loader.classList.add('hidden');

    if (!leaders || leaders.length === 0) {
      dom.tableWrap.classList.add('hidden');
      dom.empty.classList.remove('hidden');
      dom.loadMoreWrap.classList.add('hidden');
      dom.sticky.card.classList.add('lb-sticky-card--hidden');
      dom.podium.cards.forEach(function (slot) { slot.el.style.display = 'none'; });
      return;
    }

    dom.empty.classList.add('hidden');
    dom.tableWrap.classList.remove('hidden');

    renderPodium(leaders, currentUserId);
    renderTable(leaders, currentUserId);
    renderLoadMoreButton();
    updateStickyCard(leaders, currentUserId);
  }

  // ── Append more leaders (load more) ────────────────
  function appendLeaders(newLeaders, currentUserId) {
    state.leaders = state.leaders.concat(newLeaders);

    // Save updated rank history
    saveRankHistory(state.leaders, state.period);

    renderTable(state.leaders, currentUserId);
    renderLoadMoreButton();
    updateStickyCard(state.leaders, currentUserId);
  }

  // ── Fetch all pages for search ────────────────────
  function fetchAllForSearch(period, query) {
    return fetchLeaderboard(1, period).then(function (resp) {
      var total = resp.pagination ? resp.pagination.totalUsers : 0;
      if (total <= LOAD_MORE_SIZE) {
        var allLeaders = (resp.leaders || []).filter(function (u) {
          return (u.name || '').toLowerCase().indexOf(query) !== -1;
        });
        return { leaders: allLeaders, pagination: resp.pagination, currentUserId: resp.currentUserId };
      }
      var pagesNeeded = Math.ceil(total / LOAD_MORE_SIZE);
      var pagePromises = [];
      for (var p = 2; p <= pagesNeeded; p++) {
        pagePromises.push(fetchLeaderboard(p, period));
      }
      return Promise.all(pagePromises).then(function (pages) {
        var allLeaders = (resp.leaders || []).concat.apply([], pages.map(function (p) { return p.leaders || []; }));
        var matched = allLeaders.filter(function (u) {
          return (u.name || '').toLowerCase().indexOf(query) !== -1;
        });
        matched.forEach(function (u, i) { u.rank = i + 1; });
        return {
          leaders: matched,
          currentUserId: resp.currentUserId,
          pagination: { totalUsers: matched.length, totalPages: 1, currentPage: 1 },
        };
      });
    });
  }

  // ── Initial Load & Refresh ─────────────────────────
  function loadLeaderboard(period) {
    if (state.isLoading) return;
    state.isLoading = true;
    state.period = period;
    state.leaders = [];
    state.nextPage = 1;
    state.totalUsers = 0;

    // Only flash the loader + hide content on very first load.
    // On period switches, keep current content visible to avoid flicker.
    var hasContent = dom.tableBody.children.length > 0;
    if (!hasContent) {
      dom.loader.classList.remove('hidden');
      dom.tableWrap.classList.add('hidden');
      dom.empty.classList.add('hidden');
      dom.loadMoreWrap.classList.add('hidden');
      dom.sticky.card.classList.add('lb-sticky-card--hidden');
      dom.podium.cards.forEach(function (slot) { slot.el.style.display = 'none'; });
    } else {
      // Subtle loading state on the active tab during period switch
      var activeTab = document.querySelector('.lb-period-tab.active');
      if (activeTab) activeTab.classList.add('lb-period-tab--loading');
    }

    var currentUserId = getCurrentUserId();
    var query = state.searchQuery.trim().toLowerCase();

    var fetchPromise = query
      ? fetchAllForSearch(period, query)
      : fetchLeaderboard(1, period);

    fetchPromise
      .then(function (resp) {
        state.isLoading = false;

        // Remove subtle loading state from tab
        var activeTab = document.querySelector('.lb-period-tab.active');
        if (activeTab) activeTab.classList.remove('lb-period-tab--loading');

        var leaders = resp.leaders || [];
        var resolvedUserId = resp.currentUserId || currentUserId;
        state.nextPage = 2;

        render(leaders, resolvedUserId, resp.pagination);
      })
      .catch(function (err) {
        state.isLoading = false;

        var activeTab = document.querySelector('.lb-period-tab.active');
        if (activeTab) activeTab.classList.remove('lb-period-tab--loading');

        if (err && err.name === 'AbortError') return;
        dom.loader.classList.add('hidden');
        // Only show empty state on first load (no old content to show)
        if (!hasContent) {
          dom.empty.classList.remove('hidden');
          var emptyText = dom.empty.querySelector('.lb-empty-text');
          if (emptyText) emptyText.textContent = 'Could not load leaderboard. Please try again.';
        }
      });
  }

  // ── Handle Load More ──────────────────────────────
  function handleLoadMore() {
    if (state.isLoading) return;
    if (state.leaders.length >= state.totalUsers) {
      dom.loadMoreWrap.classList.add('hidden');
      return;
    }

    state.isLoading = true;
    dom.loadMoreBtn.disabled = true;
    dom.loadMoreBtn.innerHTML = 'Loading... <i class="fas fa-spinner fa-spin"></i>';

    var currentUserId = getCurrentUserId() || state.currentUserId;

    fetchLeaderboard(state.nextPage, state.period)
      .then(function (resp) {
        state.isLoading = false;
        dom.loadMoreBtn.disabled = false;
        dom.loadMoreBtn.innerHTML = 'Load More Learners <i class="fas fa-chevron-down"></i>';

        var newLeaders = resp.leaders || [];
        state.nextPage++;

        appendLeaders(newLeaders, currentUserId || resp.currentUserId);
      })
      .catch(function (err) {
        state.isLoading = false;
        dom.loadMoreBtn.disabled = false;
        dom.loadMoreBtn.innerHTML = 'Load More Learners <i class="fas fa-chevron-down"></i>';
        if (err && err.name === 'AbortError') return;
      });
  }

  // ── Search Handler ────────────────────────────────
  function handleSearch() {
    var query = dom.searchInput.value;
    state.searchQuery = query;

    if (query) {
      dom.searchClear.style.display = 'flex';
    } else {
      dom.searchClear.style.display = '';
    }

    loadLeaderboard(state.period);
  }

  // ── Event Binding ─────────────────────────────────
  function init() {
    // Period tabs
    var tabs = document.querySelectorAll('.lb-period-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        dom.searchInput.value = '';
        state.searchQuery = '';
        dom.searchClear.style.display = '';
        loadLeaderboard(tab.getAttribute('data-period'));
      });
    });

    // Search input
    dom.searchInput.addEventListener('input', handleSearch);

    // Search clear
    dom.searchClear.addEventListener('click', function () {
      dom.searchInput.value = '';
      state.searchQuery = '';
      dom.searchClear.style.display = '';
      loadLeaderboard(state.period);
    });

    // Load More button
    dom.loadMoreBtn.addEventListener('click', handleLoadMore);

    // Podium card click → profile modal
    dom.podium.cards.forEach(function (slot) {
      slot.el.addEventListener('click', function () {
        var rank = parseInt(slot.el.getAttribute('data-rank'), 10);
        var user = state.leaders[rank - 1];
        if (user) openProfileModal(user);
      });
    });

    // Modal close
    dom.modal.close.addEventListener('click', closeProfileModal);
    dom.modal.overlay.addEventListener('click', function (e) {
      if (e.target === dom.modal.overlay) closeProfileModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeProfileModal();
    });

    // Initial load
    loadLeaderboard('all');
  }

  // ── Boot ───────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
