import { renderBookmarkCollectionsPanel } from './bookmarkUI.js';

const AVATAR_THEMES = {
  default: null,
  ocean: ['#0ea5e9', '#06b6d4', '#14b8a6', '#3b82f6', '#0284c7'],
  sunset: ['#f97316', '#ef4444', '#ec4899', '#f59e0b', '#e11d48'],
  midnight: ['#7c3aed', '#6d28d9', '#4f46e5', '#4338ca', '#312e81'],
  forest: ['#10b981', '#059669', '#047857', '#16a34a', '#15803d'],
  royal: ['#a855f7', '#7c3aed', '#f59e0b', '#d946ef', '#8b5cf6'],
};

const AVATAR_BORDER_STYLES = {
  none: '',
  gold: '3px solid #f59e0b',
  'premium-glow': '3px solid #8b5cf6',
  rainbow: '3px solid transparent',
  'neon-cyan': '3px solid #06b6d4',
  'neon-pink': '3px solid #ec4899',
};

function getAvatarThemeBg(theme, initial) {
  if (!theme || theme === 'default') return null;
  const palette = AVATAR_THEMES[theme];
  if (!palette) return null;
  const index = (initial.charCodeAt(0) - 65) % palette.length;
  return palette[index >= 0 ? index : 0];
}

function renderProfileAvatar(el, av) {
  if (!el) return;
  const userProgress = window.userProgress || {};
  const customization = userProgress.avatarCustomization || { border: 'none', theme: 'default' };

  if (typeof av === 'string' && av.startsWith('data:image')) {
    const borderStyle = AVATAR_BORDER_STYLES[customization.border] || '';
    el.innerHTML = `<span style="display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:50%;overflow:hidden;${borderStyle ? 'border:' + borderStyle + ';' : ''}"><img src="${av}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"></span>`;
    el.style.fontSize = '0';
    return;
  }
  const initial = (av && av.initial) ? av.initial : 'L';
  const themeBg = getAvatarThemeBg(customization.theme, initial);
  const bg = themeBg || ((av && av.bg) ? av.bg : '#7c3aed');
  const borderStyle = AVATAR_BORDER_STYLES[customization.border] || '';
  const borderCss = borderStyle ? `border:${borderStyle};` : '';
  const extraClass = customization.border === 'rainbow' ? ' avatar-border-rainbow' : '';
  el.innerHTML = `<span class="avatar-inner${extraClass}" style="display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:50%;background:${bg};color:#fff;font-size:1.3rem;font-weight:600;font-family:'Poppins',sans-serif;${borderCss}">${initial}</span>`;
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
    (userProgress.battlesWon || 0) >= 1,
    (userProgress.battlesWon || 0) >= 5,
    !!(userProgress.inventory?.exclusiveBadge),
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

// Legacy global exports
window.updateProfile = updateProfile;
