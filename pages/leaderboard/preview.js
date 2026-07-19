/* =====================================================
   LEADERBOARD — Preview Mode (self-contained mock data)
   ===================================================== */

(function () {
  'use strict';

  // ── Mock Data ──────────────────────────────────────
  var MOCK_USERS = [
    { id: 'demo-1', name: 'XanderReed', xp: 19900, level: 8, avatar: { initial: 'X', bg: '#6B5B95' }, streak: 31, completedProblems: [1,2,3,4,6,9,14,20], joinDate: '2025-05-12T08:00:00.000Z' },
    { id: 'demo-2', name: 'AliceChen', xp: 18450, level: 7, avatar: { initial: 'A', bg: '#7B93B5' }, streak: 16, completedProblems: [1,2,3,5,8,13], joinDate: '2025-10-30T19:51:14.358Z' },
    { id: 'demo-3', name: 'YaraKhoury', xp: 17500, level: 7, avatar: { initial: 'Y', bg: '#D65076' }, streak: 19, completedProblems: [1,3,5,7,10], joinDate: '2025-07-01T10:15:00.000Z' },
    { id: 'demo-4', name: 'BobKumar', xp: 15200, level: 6, avatar: { initial: 'B', bg: '#5A8F7C' }, streak: 28, completedProblems: [1,2,4,7,11], joinDate: '2025-08-02T22:15:38.331Z' },
    { id: 'demo-5', name: 'ZaraCoelho', xp: 14200, level: 6, avatar: { initial: 'Z', bg: '#45B8AC' }, streak: 14, completedProblems: [2,5,6,8], joinDate: '2025-09-18T14:22:00.000Z' },
    { id: 'demo-6', name: 'CarolMendez', xp: 12900, level: 5, avatar: { initial: 'C', bg: '#B08060' }, streak: 5, completedProblems: [1,3,6], joinDate: '2026-06-29T18:31:21.354Z' },
    { id: 'demo-7', name: 'AidenNakamura', xp: 11500, level: 5, avatar: { initial: 'A', bg: '#E15D44' }, streak: 17, completedProblems: [1,4,7,10,13], joinDate: '2025-11-02T09:30:00.000Z' },
    { id: 'demo-8', name: 'DylanPark', xp: 10750, level: 4, avatar: { initial: 'D', bg: '#8B7E9A' }, streak: 21, completedProblems: [2,4,8,15], joinDate: '2026-03-14T21:10:49.285Z' },
    { id: 'demo-9', name: 'ElenaRossi', xp: 9800, level: 4, avatar: { initial: 'E', bg: '#D4A84B' }, streak: 25, completedProblems: [1,5,9,12], joinDate: '2026-05-30T03:02:50.215Z' },
    { id: 'demo-10', name: 'FelixWong', xp: 8600, level: 3, avatar: { initial: 'F', bg: '#7A9BAA' }, streak: 24, completedProblems: [3,7,11], joinDate: '2026-02-19T19:47:57.702Z' },
    { id: 'demo-11', name: 'BiancaFerreira', xp: 8200, level: 3, avatar: { initial: 'B', bg: '#009B77' }, streak: 8, completedProblems: [3,6,9], joinDate: '2026-01-10T11:45:00.000Z' },
    { id: 'demo-12', name: 'GraceOkafor', xp: 7400, level: 3, avatar: { initial: 'G', bg: '#C4926E' }, streak: 3, completedProblems: [1,2], joinDate: '2025-11-05T01:46:28.843Z' },
    { id: 'demo-13', name: 'ChloeDesai', xp: 7100, level: 3, avatar: { initial: 'C', bg: '#DD4124' }, streak: 6, completedProblems: [2,5], joinDate: '2025-12-15T16:00:00.000Z' },
    { id: 'demo-14', name: 'HiroshiTanaka', xp: 6500, level: 3, avatar: { initial: 'H', bg: '#6B8E8E' }, streak: 3, completedProblems: [4,9], joinDate: '2026-02-14T02:48:41.032Z' },
    { id: 'demo-15', name: 'DavidOkonkwo', xp: 6200, level: 3, avatar: { initial: 'D', bg: '#5B5EA6' }, streak: 12, completedProblems: [4,8], joinDate: '2025-10-05T20:10:00.000Z' },
    { id: 'demo-16', name: 'IngridSorensen', xp: 5800, level: 2, avatar: { initial: 'I', bg: '#9A8B7E' }, streak: 10, completedProblems: [5,10], joinDate: '2025-08-10T03:01:22.599Z' },
    { id: 'demo-17', name: 'EmmaJohansson', xp: 5400, level: 2, avatar: { initial: 'E', bg: '#9B5DE5' }, streak: 9, completedProblems: [1,6], joinDate: '2026-02-28T07:30:00.000Z' },
    { id: 'demo-18', name: 'JamalWilliams', xp: 5100, level: 2, avatar: { initial: 'J', bg: '#B57B7B' }, streak: 2, completedProblems: [6], joinDate: '2025-11-17T02:52:18.434Z' },
    { id: 'demo-19', name: 'FinnMcGregor', xp: 4800, level: 2, avatar: { initial: 'F', bg: '#F15BB5' }, streak: 7, completedProblems: [3,7], joinDate: '2025-11-30T13:45:00.000Z' },
    { id: 'demo-20', name: 'KeikoYamamoto', xp: 4500, level: 2, avatar: { initial: 'K', bg: '#7B93B5' }, streak: 12, completedProblems: [2,7], joinDate: '2025-08-10T14:33:16.390Z' },
    { id: 'demo-21', name: 'GabrielleNoel', xp: 4200, level: 2, avatar: { initial: 'G', bg: '#00BBF9' }, streak: 15, completedProblems: [2,4], joinDate: '2026-03-22T09:00:00.000Z' },
    { id: 'demo-22', name: 'LenaMueller', xp: 3900, level: 2, avatar: { initial: 'L', bg: '#5A8F7C' }, streak: 11, completedProblems: [3,8], joinDate: '2026-05-23T22:47:04.129Z' },
    { id: 'demo-23', name: 'HannahKim', xp: 3700, level: 2, avatar: { initial: 'H', bg: '#00F5D4' }, streak: 18, completedProblems: [5,9], joinDate: '2025-08-15T18:30:00.000Z' },
    { id: 'demo-24', name: 'MingWei', xp: 3400, level: 2, avatar: { initial: 'M', bg: '#B08060' }, streak: 11, completedProblems: [4,9], joinDate: '2025-07-25T01:02:00.790Z' },
    { id: 'demo-25', name: 'IvanMarkovic', xp: 3100, level: 1, avatar: { initial: 'I', bg: '#FEE440' }, streak: 4, completedProblems: [1], joinDate: '2026-04-10T14:20:00.000Z' },
    { id: 'demo-26', name: 'NadiaPetrov', xp: 2900, level: 1, avatar: { initial: 'N', bg: '#8B7E9A' }, streak: 22, completedProblems: [1,5], joinDate: '2025-12-28T03:16:50.760Z' },
    { id: 'demo-27', name: 'JuliaSantos', xp: 2700, level: 1, avatar: { initial: 'J', bg: '#9B5DE5' }, streak: 20, completedProblems: [2,6], joinDate: '2025-10-12T11:10:00.000Z' },
    { id: 'demo-28', name: 'OmarHassan', xp: 2400, level: 1, avatar: { initial: 'O', bg: '#D4A84B' }, streak: 2, completedProblems: [6], joinDate: '2025-08-20T20:52:01.244Z' },
    { id: 'demo-29', name: 'KaiOkafor', xp: 2200, level: 1, avatar: { initial: 'K', bg: '#F15BB5' }, streak: 8, completedProblems: [3], joinDate: '2026-05-05T16:40:00.000Z' },
    { id: 'demo-30', name: 'PriyaSharma', xp: 2000, level: 1, avatar: { initial: 'P', bg: '#7A9BAA' }, streak: 23, completedProblems: [2,7], joinDate: '2025-12-05T12:22:39.617Z' },
    { id: 'demo-31', name: 'LiamOBrien', xp: 1800, level: 1, avatar: { initial: 'L', bg: '#00BBF9' }, streak: 6, completedProblems: [4], joinDate: '2026-06-01T08:15:00.000Z' },
    { id: 'demo-32', name: 'QuinnFoster', xp: 1600, level: 1, avatar: { initial: 'Q', bg: '#C4926E' }, streak: 5, completedProblems: [3], joinDate: '2026-01-14T21:27:04.929Z' },
    { id: 'demo-33', name: 'MayaPatel', xp: 1500, level: 1, avatar: { initial: 'M', bg: '#00F5D4' }, streak: 3, completedProblems: [1], joinDate: '2026-05-20T12:00:00.000Z' },
    { id: 'demo-34', name: 'RaviPatel', xp: 1300, level: 1, avatar: { initial: 'R', bg: '#6B8E8E' }, streak: 5, completedProblems: [4], joinDate: '2026-04-06T10:47:03.824Z' },
    { id: 'demo-35', name: 'NathanChen', xp: 1100, level: 1, avatar: { initial: 'N', bg: '#FEE440' }, streak: 7, completedProblems: [2], joinDate: '2025-09-08T22:45:00.000Z' },
    { id: 'demo-36', name: 'SofiaLopez', xp: 1000, level: 1, avatar: { initial: 'S', bg: '#9A8B7E' }, streak: 13, completedProblems: [5], joinDate: '2025-08-27T00:08:48.300Z' },
    { id: 'demo-37', name: 'OliviaSchmidt', xp: 900, level: 1, avatar: { initial: 'O', bg: '#D65076' }, streak: 4, completedProblems: [], joinDate: '2026-04-28T19:30:00.000Z' },
    { id: 'demo-38', name: 'TaoWang', xp: 800, level: 1, avatar: { initial: 'T', bg: '#B57B7B' }, streak: 10, completedProblems: [], joinDate: '2026-03-16T19:29:49.444Z' },
    { id: 'demo-39', name: 'PabloReyes', xp: 700, level: 1, avatar: { initial: 'P', bg: '#45B8AC' }, streak: 2, completedProblems: [], joinDate: '2025-12-20T06:00:00.000Z' },
    { id: 'demo-40', name: 'UmaNair', xp: 600, level: 1, avatar: { initial: 'U', bg: '#7B93B5' }, streak: 11, completedProblems: [], joinDate: '2026-05-16T23:19:08.828Z' },
    { id: 'demo-41', name: 'QuinnAnderson', xp: 500, level: 1, avatar: { initial: 'Q', bg: '#009B77' }, streak: 1, completedProblems: [], joinDate: '2026-06-15T15:20:00.000Z' },
    { id: 'demo-42', name: 'ViktorIvanov', xp: 400, level: 1, avatar: { initial: 'V', bg: '#5A8F7C' }, streak: 10, completedProblems: [], joinDate: '2025-07-27T15:08:27.151Z' },
    { id: 'demo-43', name: 'RosaMendes', xp: 350, level: 1, avatar: { initial: 'R', bg: '#DD4124' }, streak: 3, completedProblems: [], joinDate: '2026-07-01T09:00:00.000Z' },
    { id: 'demo-44', name: 'SamirGupta', xp: 250, level: 1, avatar: { initial: 'S', bg: '#E15D44' }, streak: 2, completedProblems: [], joinDate: '2026-06-20T17:45:00.000Z' },
    { id: 'demo-45', name: 'WeiZhang', xp: 200, level: 1, avatar: { initial: 'W', bg: '#B08060' }, streak: 9, completedProblems: [], joinDate: '2025-12-05T12:54:12.392Z' },
    { id: 'demo-46', name: 'TinaLarsen', xp: 180, level: 1, avatar: { initial: 'T', bg: '#5B5EA6' }, streak: 1, completedProblems: [], joinDate: '2026-07-10T10:30:00.000Z' },
    { id: 'demo-47', name: 'UrsulaBraun', xp: 120, level: 1, avatar: { initial: 'U', bg: '#6B5B95' }, streak: 1, completedProblems: [], joinDate: '2026-07-12T11:00:00.000Z' },
    { id: 'demo-48', name: 'VictorDubois', xp: 80, level: 1, avatar: { initial: 'V', bg: '#D65076' }, streak: 1, completedProblems: [], joinDate: '2026-07-14T08:20:00.000Z' },
    { id: 'demo-49', name: 'WendyChoi', xp: 40, level: 1, avatar: { initial: 'W', bg: '#45B8AC' }, streak: 0, completedProblems: [], joinDate: '2026-07-14T20:00:00.000Z' },
    { id: 'demo-50', name: 'YukiTanaka', xp: 10, level: 1, avatar: { initial: 'Y', bg: '#FEE440' }, streak: 0, completedProblems: [], joinDate: '2026-07-14T18:00:00.000Z' }
  ];

  // Sort by XP descending, assign ranks
  MOCK_USERS.sort(function (a, b) { return b.xp - a.xp || a.name.localeCompare(b.name); });
  MOCK_USERS.forEach(function (u, i) {
    u.rank = i + 1;
    // Simulate rank changes for visual variety
    if (i < 3) u.change = 'up';
    else if (i < 6) u.change = 'down';
    else if (i % 5 === 0) u.change = 'up';
    else if (i % 7 === 0) u.change = 'down';
    else u.change = 'same';
  });

  // ── Configuration ──────────────────────────────────
  var PREVIEW_LOAD_SIZE = 10;

  // ── State ──────────────────────────────────────────
  var state = {
    period: 'all',
    totalUsers: MOCK_USERS.length,
    leaders: [],
    loadedCount: 0,
    searchQuery: ''
  };

  // ── DOM References ─────────────────────────────────
  var $ = function (id) { return document.getElementById(id); };
  var dom = {
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
    searchClear: $('lbSearchClear')
  };

  // ── Helpers ────────────────────────────────────────
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

  // ── Podium Rendering ──────────────────────────────
  function renderPodium(leaders) {
    var top3 = leaders.slice(0, 3);
    dom.podium.cards.forEach(function (slot, i) {
      var user = top3[i];
      if (!user) { slot.el.style.display = 'none'; return; }
      slot.el.style.display = '';
      var avatarUrl = getAvatarUrl(user.avatar);
      if (avatarUrl) {
        slot.avatar.innerHTML = '<img src="' + escapeHtml(avatarUrl) + '" alt="">';
      } else {
        slot.avatar.style.background = getAvatarBg(user.avatar);
        slot.avatar.textContent = getAvatarInitial(user.avatar);
      }
      slot.name.textContent = user.name || 'Learner';
      slot.xp.textContent = (user.xp !== undefined ? Number(user.xp).toLocaleString() : '0') + ' XP';
      slot.level.textContent = 'Level ' + (user.level || 1);
    });
  }

  // ── Table Rendering ───────────────────────────────
  function renderTable(leaders) {
    var html = '';
    leaders.forEach(function (user) {
      var displayName = escapeHtml(user.name || 'Learner');
      var rankClass = user.rank === 1 ? 'lb-rank--1' : user.rank === 2 ? 'lb-rank--2' : user.rank === 3 ? 'lb-rank--3' : '';
      var avatarUrl = getAvatarUrl(user.avatar);
      var avatarHtml;
      if (avatarUrl) {
        avatarHtml = '<div class="lb-row-avatar"><img src="' + escapeHtml(avatarUrl) + '" alt=""></div>';
      } else {
        avatarHtml = '<div class="lb-row-avatar" style="background:' + getAvatarBg(user.avatar) + '">' + escapeHtml(getAvatarInitial(user.avatar)) + '</div>';
      }
      var change = user.change || 'same';
      var changeHtml;
      if (change === 'up') {
        changeHtml = '<span class="lb-change lb-change--up"><i class="fas fa-arrow-up lb-change-icon"></i></span>';
      } else if (change === 'down') {
        changeHtml = '<span class="lb-change lb-change--down"><i class="fas fa-arrow-down lb-change-icon"></i></span>';
      } else {
        changeHtml = '<span class="lb-change lb-change--same"><i class="fas fa-minus lb-change-icon"></i></span>';
      }
      html += '<div class="lb-row" role="listitem" data-user-id="' + escapeHtml(user.id || '') + '">' +
        '<span class="lb-col-rank lb-rank ' + rankClass + '">#' + user.rank + '</span>' +
        '<span class="lb-col-avatar">' + avatarHtml + '</span>' +
        '<span class="lb-col-name"><span class="lb-row-name">' + displayName + '</span></span>' +
        '<span class="lb-col-xp"><span class="lb-row-xp">' + (user.xp !== undefined ? Number(user.xp).toLocaleString() : '0') + '</span></span>' +
        '<span class="lb-col-level"><span class="lb-row-level">Lv.' + (user.level || 1) + '</span></span>' +
        '<span class="lb-col-change">' + changeHtml + '</span>' +
        '</div>';
    });
    dom.tableBody.innerHTML = html;

    dom.tableBody.querySelectorAll('.lb-row').forEach(function (row) {
      row.addEventListener('click', function () {
        var userId = row.getAttribute('data-user-id');
        var user = MOCK_USERS.find(function (u) { return u.id === userId; });
        if (user) {
          user.rank = Array.from(dom.tableBody.querySelectorAll('.lb-row')).indexOf(row) + 1;
          openProfileModal(user);
        }
      });
    });
  }

  // ── Load More Button ─────────────────────────────
  function renderLoadMoreButton() {
    if (state.searchQuery || state.loadedCount >= state.totalUsers) {
      dom.loadMoreWrap.classList.add('hidden');
    } else {
      dom.loadMoreWrap.classList.remove('hidden');
    }
  }

  // ── Main Render ────────────────────────────────────
  function render() {
    dom.loader.classList.add('hidden');
    if (state.leaders.length === 0) {
      dom.tableWrap.classList.add('hidden');
      dom.empty.classList.remove('hidden');
      dom.loadMoreWrap.classList.add('hidden');
      dom.podium.cards.forEach(function (s) { s.el.style.display = 'none'; });
      return;
    }
    dom.empty.classList.add('hidden');
    dom.tableWrap.classList.remove('hidden');
    renderPodium(state.leaders);
    renderTable(state.leaders);
    renderLoadMoreButton();
  }

  // ── Load Data ─────────────────────────────────────
  function loadData(period) {
    state.period = period;
    state.loadedCount = 0;
    state.leaders = [];
    state.searchQuery = '';

    dom.loader.classList.remove('hidden');
    dom.tableWrap.classList.add('hidden');
    dom.empty.classList.add('hidden');
    dom.loadMoreWrap.classList.add('hidden');
    dom.podium.cards.forEach(function (s) { s.el.style.display = 'none'; });

    // Simulate async load for realistic feel
    setTimeout(function () {
      state.loadedCount = Math.min(PREVIEW_LOAD_SIZE, MOCK_USERS.length);
      state.leaders = MOCK_USERS.slice(0, state.loadedCount);
      render();
    }, 400);
  }

  // ── Handle Load More ──────────────────────────────
  function handleLoadMore() {
    if (state.loadedCount >= state.totalUsers) {
      dom.loadMoreWrap.classList.add('hidden');
      return;
    }
    dom.loadMoreBtn.disabled = true;
    dom.loadMoreBtn.innerHTML = 'Loading... <i class="fas fa-spinner fa-spin"></i>';

    setTimeout(function () {
      state.loadedCount = Math.min(state.loadedCount + PREVIEW_LOAD_SIZE, MOCK_USERS.length);
      state.leaders = MOCK_USERS.slice(0, state.loadedCount);
      dom.loadMoreBtn.disabled = false;
      dom.loadMoreBtn.innerHTML = 'Load More Learners <i class="fas fa-chevron-down"></i>';
      render();
    }, 300);
  }

  // ── Search Handler ────────────────────────────────
  function handleSearch() {
    var query = dom.searchInput.value.trim().toLowerCase();
    state.searchQuery = query;

    if (query) {
      dom.searchClear.style.display = 'flex';
      var matched = MOCK_USERS.filter(function (u) {
        return (u.name || '').toLowerCase().indexOf(query) !== -1;
      });
      matched.forEach(function (u, i) { u.rank = i + 1; });
      state.leaders = matched;
      state.loadedCount = matched.length;
    } else {
      dom.searchClear.style.display = '';
      state.loadedCount = Math.min(PREVIEW_LOAD_SIZE, MOCK_USERS.length);
      state.leaders = MOCK_USERS.slice(0, state.loadedCount);
    }
    render();
  }

  // ── Profile Modal ───────────────────────────────────
  function openProfileModal(user) {
    if (!user) return;
    var avatarUrl = getAvatarUrl(user.avatar);
    var modalAvatar = $('lbModalAvatar');
    if (avatarUrl) {
      modalAvatar.innerHTML = '<img src="' + escapeHtml(avatarUrl) + '" alt="">';
    } else {
      modalAvatar.style.background = getAvatarBg(user.avatar);
      modalAvatar.textContent = getAvatarInitial(user.avatar);
    }
    $('lbModalName').textContent = user.name || 'Learner';
    $('lbModalRank').textContent = '#' + (user.rank || '?');
    $('lbModalXp').textContent = (user.xp !== undefined ? Number(user.xp).toLocaleString() : '0');
    $('lbModalLevel').textContent = 'Level ' + (user.level || 1);
    $('lbModalBadges').textContent = (user.xp !== undefined ? Number(user.xp).toLocaleString() + ' XP' : '—');
    $('lbProfileModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // ── Event Binding ─────────────────────────────────
  function init() {
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
        dom.searchClear.style.display = '';
        loadData(tab.getAttribute('data-period'));
      });
    });

    dom.searchInput.addEventListener('input', handleSearch);
    dom.searchClear.addEventListener('click', function () {
      dom.searchInput.value = '';
      dom.searchClear.style.display = '';
      loadData(state.period);
    });

    dom.loadMoreBtn.addEventListener('click', handleLoadMore);

    dom.podium.cards.forEach(function (slot) {
      slot.el.addEventListener('click', function () {
        var rank = parseInt(slot.el.getAttribute('data-rank'), 10);
        var user = state.leaders[rank - 1];
        openProfileModal(user);
      });
    });

    $('lbModalClose').addEventListener('click', function () {
      $('lbProfileModal').classList.remove('active');
      document.body.style.overflow = '';
    });
    $('lbProfileModal').addEventListener('click', function (e) {
      if (e.target === $('lbProfileModal')) {
        $('lbProfileModal').classList.remove('active');
        document.body.style.overflow = '';
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        $('lbProfileModal').classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    loadData('all');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
