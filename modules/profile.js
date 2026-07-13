import { renderBookmarkCollectionsPanel } from './bookmarkUI.js';

function renderProfileAvatar(el, av) {
  if (!el) return;
  if (typeof av === 'string' && av.startsWith('data:image')) {
    el.innerHTML = `<img src="${av}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    el.style.fontSize = '0';
    return;
  }
  const initial = (av && av.initial) ? av.initial : 'L';
  const bg = (av && av.bg) ? av.bg : '#7c3aed';
  el.innerHTML = `<span style="display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:50%;background:${bg};color:#fff;font-size:1.3rem;font-weight:600;font-family:'Poppins',sans-serif;">${initial}</span>`;
  el.style.fontSize = '0';
}

export function initProfile() {
  window.initProfile = initProfile;
  const userProgress = window.userProgress || {};

  // Populate dashboard profile card elements
  const profileName = document.getElementById('profileName');
  if (profileName) profileName.textContent = userProgress.name || 'Learner';
  const joinDate = document.getElementById('joinDate');
  if (joinDate) {
    let joinDateObj = userProgress.joinDate ? new Date(userProgress.joinDate) : new Date();
    if (!userProgress.joinDate) {
      userProgress.joinDate = joinDateObj.toISOString();
    }
    joinDate.textContent = joinDateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Populate profile section elements
  const profileSectionName = document.getElementById('profileSectionName');
  if (profileSectionName) profileSectionName.textContent = userProgress.name || 'Learner';
  const joinDateSection = document.getElementById('joinDateSection');
  if (joinDateSection) {
    let joinDateObj = userProgress.joinDate ? new Date(userProgress.joinDate) : new Date();
    if (!userProgress.joinDate) {
      userProgress.joinDate = joinDateObj.toISOString();
    }
    joinDateSection.textContent = joinDateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

 const avatarIcons = document.querySelectorAll('.avatar-icon');
avatarIcons.forEach((el) => renderProfileAvatar(el, userProgress.avatar));

const profileBio = document.getElementById('profileBio');

if (profileBio) {
  if (userProgress.bio) {
    profileBio.textContent = userProgress.bio;
    profileBio.classList.remove('empty-state');
  } else {
    profileBio.textContent = 'No bio yet. Click edit to add one!';
    profileBio.classList.add('empty-state');
  }
}

  updateProfile();
  updateProfileLeaderboard();
  renderBookmarkCollectionsPanel();

  // Render language chips if available
  if (typeof window.renderLanguageChips === 'function') {
    window.renderLanguageChips();
  }
}

export function updateProfile() {
  const userProgress = window.userProgress || {};
  const isLoaded = !!userProgress.loaded;
  const levelNames = [
    'Beginner',
    'Novice',
    'Intermediate',
    'Advanced',
    'Expert',
    'Master',
    'Grandmaster',
    'Legend',
  ];

  // Dashboard profile card
  const profileLevel = document.getElementById('profileLevel');
  if (profileLevel)
    profileLevel.textContent = `Level ${userProgress.level} - ${levelNames[userProgress.level - 1]}`;

  const profileXP = document.getElementById('profileTotalXP');
  if (profileXP) {
    if (!isLoaded) {
      profileXP.textContent = '--';
      profileXP.classList.add('loading');
    } else {
      profileXP.textContent = (userProgress.xp || 0).toLocaleString();
      profileXP.classList.remove('loading');
    }
  }

  const profileProblems = document.getElementById('profileProblems');
  if (profileProblems) {
    if (!isLoaded) {
      profileProblems.textContent = '--';
      profileProblems.classList.add('loading');
    } else {
      profileProblems.textContent = (userProgress.completedProblems || []).length;
      profileProblems.classList.remove('loading');
    }
  }

  const profileStreak = document.getElementById('profileStreak');
  if (profileStreak) {
    if (!isLoaded) {
      profileStreak.textContent = '--';
      profileStreak.classList.add('loading');
    } else {
      profileStreak.textContent = userProgress.streak || 0;
      profileStreak.classList.remove('loading');
    }
  }

  const profileFreezes = document.getElementById('profileFreezes');
  if (profileFreezes) {
    if (!isLoaded) {
      profileFreezes.textContent = '--';
      profileFreezes.classList.add('loading');
    } else {
      profileFreezes.textContent = userProgress.freezes || 0;
      profileFreezes.classList.remove('loading');
    }
  }

  const completedCount = (userProgress.completedProblems || []).length;
  const badgeCount = [
    completedCount >= 1,
    (userProgress.streak || 0) >= 7,
    (userProgress.xp || 0) >= 5000,
    completedCount >= 50,
    completedCount >= 100,
    completedCount >= 25 && (userProgress.xp || 0) >= 2500,
  ].filter(Boolean).length;

  const profileBadges = document.getElementById('profileBadges');
  if (profileBadges) {
    if (!isLoaded) {
      profileBadges.textContent = '--';
      profileBadges.classList.add('loading');
    } else {
      profileBadges.textContent = badgeCount;
      profileBadges.classList.remove('loading');
    }
  }

  // Profile section
  const profileLevelSection = document.getElementById('profileLevelSection');
  if (profileLevelSection)
    profileLevelSection.textContent = `Level ${userProgress.level} - ${levelNames[userProgress.level - 1]}`;

  const profileXPSection = document.getElementById('profileTotalXPSection');
  if (profileXPSection) {
    if (!isLoaded) {
      profileXPSection.textContent = '--';
      profileXPSection.classList.add('loading');
    } else {
      profileXPSection.textContent = (userProgress.xp || 0).toLocaleString();
      profileXPSection.classList.remove('loading');
    }
  }

  const profileProblemsSection = document.getElementById('profileProblemsSection');
  if (profileProblemsSection) {
    if (!isLoaded) {
      profileProblemsSection.textContent = '--';
      profileProblemsSection.classList.add('loading');
    } else {
      profileProblemsSection.textContent = (userProgress.completedProblems || []).length;
      profileProblemsSection.classList.remove('loading');
    }
  }

  const profileSectionStreak = document.getElementById('profileSectionStreak');
  if (profileSectionStreak) {
    if (!isLoaded) {
      profileSectionStreak.textContent = '--';
      profileSectionStreak.classList.add('loading');
    } else {
      profileSectionStreak.textContent = userProgress.streak || 0;
      profileSectionStreak.classList.remove('loading');
    }
  }

  const profileSectionFreezes = document.getElementById('profileSectionFreezes');
  if (profileSectionFreezes) {
    if (!isLoaded) {
      profileSectionFreezes.textContent = '--';
      profileSectionFreezes.classList.add('loading');
    } else {
      profileSectionFreezes.textContent = userProgress.freezes || 0;
      profileSectionFreezes.classList.remove('loading');
    }
  }

  const profileBadgesSection = document.getElementById('profileBadgesSection');
  if (profileBadgesSection) {
    if (!isLoaded) {
      profileBadgesSection.textContent = '--';
      profileBadgesSection.classList.add('loading');
    } else {
      profileBadgesSection.textContent = badgeCount;
      profileBadgesSection.classList.remove('loading');
    }
  }

  // Profile section name (kept in sync)
  const profileSectionName = document.getElementById('profileSectionName');
  if (profileSectionName) profileSectionName.textContent = userProgress.name || 'Learner';

  document
    .querySelectorAll('.avatar-icon')
    .forEach((el) => renderProfileAvatar(el, userProgress.avatar));
  updateLevelProgress();
  renderRecentActivity();
  renderSkillsMastery(); 
}
const XP_BY_DIFFICULTY = { easy: 100, medium: 250, hard: 500 };

function renderRecentActivity() {
  const container = document.getElementById('recentActivityList');
  if (!container) return;

  const userProgress = window.userProgress || {};
  const practiceProblems = window.practiceProblems || [];
  const completedIds = userProgress.completedProblems || [];
  const submittedSolutions = userProgress.submittedSolutions || {};

  if (!completedIds.length) {
    container.innerHTML = '<p class="empty-state">No problems solved yet. Go solve one!</p>';
    return;
  }

  const entries = completedIds
    .map((id) => {
      const problem = practiceProblems.find((p) => p.id === id);
      if (!problem) return null;
      const sub = submittedSolutions[id];
      const date = sub && sub.date ? new Date(sub.date) : null;
      return {
        id: problem.id,
        title: problem.title,
        difficulty: (problem.difficulty || 'easy').toLowerCase(),
        xp: XP_BY_DIFFICULTY[(problem.difficulty || 'easy').toLowerCase()] || 100,
        date,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0))
    .slice(0, 5);

  container.innerHTML = entries
    .map((entry) => {
      const dateStr = entry.date
        ? entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '';
      return `<button type="button" class="recent-activity-item" data-id="${entry.id}">
        <span class="recent-activity-title">${escapeHtmlText(entry.title)}</span>
        <span class="difficulty-badge ${entry.difficulty}">${entry.difficulty}</span>
        <span class="recent-activity-xp">+${entry.xp} XP</span>
        <span class="recent-activity-date">${dateStr}</span>
      </button>`;
    })
    .join('');

  container.querySelectorAll('.recent-activity-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const problemId = Number(btn.dataset.id);
      const problem = practiceProblems.find((p) => p.id === problemId);
      if (problem && typeof window.openQuizEditor === 'function') window.openQuizEditor(problem);
    });
  });
}

function renderSkillsMastery() {
  const container = document.getElementById('skillsMasteryGrid');
  if (!container) return;

  const dsaTopics = window.dsaTopics || [];
  if (!dsaTopics.length || typeof window.getTopicProgress !== 'function') {
    container.innerHTML = '<p class="empty-state">No topics available yet.</p>';
    return;
  }

  container.innerHTML = dsaTopics
    .map((topic) => {
      const progress = window.getTopicProgress(topic.name);
      if (!progress.total) return '';
      return `<div class="skill-mastery-item">
        <div class="mastery-header">
          <span class="mastery-label">${topic.icon} ${topic.name}</span>
          <span class="mastery-stats">${progress.completed}/${progress.total} solved</span>
        </div>
        <div class="mastery-bar">
          <div class="mastery-fill" style="width: ${progress.percentage}%"></div>
        </div>
        <span class="mastery-percentage">${progress.percentage}%</span>
      </div>`;
    })
    .join('');
}

function escapeHtmlText(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
function updateLevelProgress() {
  const userProgress = window.userProgress || {};
  const levels = [0, 1000, 2500, 5000, 10000, 20000, 50000, 100000];
  const currentLevel = userProgress.level || 1;
  const currentLevelXP = levels[Math.max(0, currentLevel - 1)];
  const nextLevelXP = levels[currentLevel] || 100000;
  const xpProgress =
    (((userProgress.xp || 0) - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  const progressPercent = Math.min(Math.max(xpProgress, 0), 100);

  // Dashboard progress bar
  const progressBar = document.getElementById('profileProgressBar');
  if (progressBar) progressBar.style.width = progressPercent + '%';
  const progressLabel = document.getElementById('profileLevelProgress');
  if (progressLabel) progressLabel.textContent = Math.round(progressPercent) + '%';

  // Profile section progress bar
  const progressBarSection = document.getElementById('profileProgressBarSection');
  if (progressBarSection) progressBarSection.style.width = progressPercent + '%';
  const progressLabelSection = document.getElementById('profileLevelProgressSection');
  if (progressLabelSection) progressLabelSection.textContent = Math.round(progressPercent) + '%';
}

function updateProfileLeaderboard() {
  const profileLeaderboardList = document.getElementById('profileLeaderboardList');
  if (!profileLeaderboardList) return;

  // Show loading state
  profileLeaderboardList.innerHTML = '<p class="empty-state">Loading leaderboard...</p>';

  // Try to fetch leaderboard data
  if (location.protocol === 'file:') {
    renderProfileLeaderboardFallback(profileLeaderboardList);
    return;
  }

  const apiCache = window.apiCache;
  const apiAbort = window.apiAbort;

  if (!apiCache || !apiAbort) {
    renderProfileLeaderboardFallback(profileLeaderboardList);
    return;
  }

  const signal = apiAbort.getSignal('profileLeaderboard');
  apiCache
    .fetchWithCache('/api/leaderboard', { credentials: 'include', signal }, 300000, 'json')
    .then(({ leaders, currentUserId }) => {
      apiAbort.clearSignal('profileLeaderboard');
      renderProfileLeaderboardRows(profileLeaderboardList, leaders || [], currentUserId);
    })
    .catch((err) => {
      apiAbort.clearSignal('profileLeaderboard');
      if (err.name === 'AbortError') return;
      void 0;
      renderProfileLeaderboardFallback(profileLeaderboardList);
    });
}

function renderProfileLeaderboardFallback(container) {
  const userProgress = window.userProgress || {};

  const mockLeaderboard = [
    { id: 'bot-1', name: 'CodeNinja', xp: 12450, level: 5, avatar: 'C', rank: 1 },
    { id: 'bot-2', name: 'AlgoMaster', xp: 9800, level: 4, avatar: 'A', rank: 2 },
    { id: 'bot-3', name: 'ByteWizard', xp: 7200, level: 4, avatar: 'B', rank: 3 },
    { id: 'bot-4', name: 'DevHero', xp: 5100, level: 3, avatar: 'D', rank: 4 },
    { id: 'bot-5', name: 'PixelForge', xp: 3600, level: 3, avatar: 'P', rank: 5 },
    {
      id: 'local-user',
      name: userProgress.name || 'Learner',
      xp: userProgress.xp || 0,
      level: userProgress.level || 1,
      avatar: userProgress.avatar || '🚀',
      rank: 6,
    },
  ];

  renderProfileLeaderboardEntries(container, mockLeaderboard, 'local-user');
}

function renderProfileLeaderboardRows(container, leaders, currentUserId) {
  const userProgress = window.userProgress || {};
  const resolvedUserId =
    currentUserId || window.algoAuth?.user?.sub || window.algoAuth?.user?.id || 'local-user';

  const rowsById = new Map();
  leaders.forEach((leader) => {
    const normalized = {
      id: String(leader.id || ''),
      name: String(leader.name || 'Learner'),
      xp: Math.max(0, Number(leader.xp) || 0),
      level: Math.max(1, Number(leader.level) || 1),
      avatar: String(leader.avatar || '🚀'),
    };
    if (normalized.id) rowsById.set(normalized.id, normalized);
  });

  // Include current user
  const currentEntry = {
    id: resolvedUserId,
    name: userProgress.name || 'Learner',
    xp: userProgress.xp || 0,
    level: userProgress.level || 1,
    avatar: userProgress.avatar || '🚀',
  };
  rowsById.set(currentEntry.id, currentEntry);

  const ranked = Array.from(rowsById.values())
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name))
    .map((leader, index) => ({ ...leader, rank: index + 1 }));

  const visible = ranked.slice(0, 10);
  if (!visible.some((l) => l.id === currentEntry.id)) {
    const currentRow = ranked.find((l) => l.id === currentEntry.id);
    if (currentRow) visible[visible.length - 1] = currentRow;
  }

  renderProfileLeaderboardEntries(container, visible, resolvedUserId);
}

function renderProfileLeaderboardEntries(container, rows, currentUserId) {
  if (!rows.length) {
    container.innerHTML = '<p class="empty-state">No leaderboard data yet.</p>';
    return;
  }

  function esc(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  container.innerHTML = rows
    .map((user) => {
      const isCurrentUser =
        user.id === currentUserId || (currentUserId === 'local-user' && user.id === 'local-user');
      const displayName = isCurrentUser ? `${user.name} (You)` : user.name;
      return `<div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
      <span class="leader-rank">#${user.rank}</span>
      <span class="leader-avatar" aria-hidden="true">${esc(user.avatar)}</span>
      <span class="leader-name">${esc(displayName)}</span>
      <span class="leader-xp">${user.xp.toLocaleString()} XP</span>
    </div>`;
    })
    .join('');
}
// Legacy global exports
window.updateProfile = updateProfile;
