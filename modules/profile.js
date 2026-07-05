export function initProfile() {
  window.initProfile = initProfile;
  const userProgress = window.userProgress || {};

  // Populate dashboard profile card elements
  const profileName = document.getElementById("profileName");
  if (profileName) profileName.textContent = userProgress.name;
  const joinDate = document.getElementById("joinDate");
  if (joinDate) {
    let joinDateObj = userProgress.joinDate ? new Date(userProgress.joinDate) : new Date();
    if (!userProgress.joinDate) { userProgress.joinDate = joinDateObj.toISOString(); if (typeof saveUserData === 'function') saveUserData(); }
    joinDate.textContent = joinDateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  // Populate profile section elements
  const profileSectionName = document.getElementById("profileSectionName");
  if (profileSectionName) profileSectionName.textContent = userProgress.name || "Learner";
  const joinDateSection = document.getElementById("joinDateSection");
  if (joinDateSection) {
    let joinDateObj = userProgress.joinDate ? new Date(userProgress.joinDate) : new Date();
    if (!userProgress.joinDate) { userProgress.joinDate = joinDateObj.toISOString(); if (typeof saveUserData === 'function') saveUserData(); }
    joinDateSection.textContent = joinDateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  const avatarIcons = document.querySelectorAll('.avatar-icon');
  avatarIcons.forEach(el => el.textContent = userProgress.avatar || '🚀');

  updateProfile();
  updateProfileLeaderboard();

  // Render language chips if available
  if (typeof window.renderLanguageChips === 'function') {
    window.renderLanguageChips();
  }
}

export function updateProfile() {
  const userProgress = window.userProgress || {};
  const levelNames = ["Beginner", "Novice", "Intermediate", "Advanced", "Expert", "Master", "Grandmaster", "Legend"];

  // Dashboard profile card
  const profileLevel = document.getElementById("profileLevel");
  if (profileLevel) profileLevel.textContent = `Level ${userProgress.level} - ${levelNames[userProgress.level - 1]}`;
  const profileXP = document.getElementById("profileTotalXP");
  if (profileXP) profileXP.textContent = (userProgress.xp || 0).toLocaleString();
  const profileProblems = document.getElementById("profileProblems");
  if (profileProblems) profileProblems.textContent = (userProgress.completedProblems || []).length;
  const profileStreak = document.getElementById("profileStreak");
  if (profileStreak) profileStreak.textContent = userProgress.streak || 0;
  const profileFreezes = document.getElementById("profileFreezes");
  if (profileFreezes) profileFreezes.textContent = userProgress.freezes || 0;
  const profileBadges = document.getElementById("profileBadges");

  const completedCount = (userProgress.completedProblems || []).length;
  const badgeCount = [completedCount >= 1, (userProgress.streak || 0) >= 7, (userProgress.xp || 0) >= 5000, completedCount >= 50, completedCount >= 100, completedCount >= 25 && (userProgress.xp || 0) >= 2500].filter(Boolean).length;
  if (profileBadges) profileBadges.textContent = badgeCount;

  // Profile section
  const profileLevelSection = document.getElementById("profileLevelSection");
  if (profileLevelSection) profileLevelSection.textContent = `Level ${userProgress.level} - ${levelNames[userProgress.level - 1]}`;
  const profileXPSection = document.getElementById("profileTotalXPSection");
  if (profileXPSection) profileXPSection.textContent = (userProgress.xp || 0).toLocaleString();
  const profileProblemsSection = document.getElementById("profileProblemsSection");
  if (profileProblemsSection) profileProblemsSection.textContent = (userProgress.completedProblems || []).length;
  const profileSectionStreak = document.getElementById("profileSectionStreak");
  if (profileSectionStreak) profileSectionStreak.textContent = userProgress.streak || 0;
  const profileSectionFreezes = document.getElementById("profileSectionFreezes");
  if (profileSectionFreezes) profileSectionFreezes.textContent = userProgress.freezes || 0;
  const profileBadgesSection = document.getElementById("profileBadgesSection");
  if (profileBadgesSection) profileBadgesSection.textContent = badgeCount;

  // Profile section name (kept in sync)
  const profileSectionName = document.getElementById("profileSectionName");
  if (profileSectionName) profileSectionName.textContent = userProgress.name || "Learner";

  document.querySelectorAll(".avatar-icon").forEach(el => el.textContent = userProgress.avatar || "🚀");
  updateLevelProgress();
}

function updateLevelProgress() {
  const userProgress = window.userProgress || {};
  const levels = [0, 1000, 2500, 5000, 10000, 20000, 50000, 100000];
  const currentLevel = userProgress.level || 1;
  const currentLevelXP = levels[Math.max(0, currentLevel - 1)];
  const nextLevelXP = levels[currentLevel] || 100000;
  const xpProgress = (((userProgress.xp || 0) - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  const progressPercent = Math.min(Math.max(xpProgress, 0), 100);

  // Dashboard progress bar
  const progressBar = document.getElementById("profileProgressBar");
  if (progressBar) progressBar.style.width = progressPercent + "%";
  const progressLabel = document.getElementById("profileLevelProgress");
  if (progressLabel) progressLabel.textContent = Math.round(progressPercent) + "%";

  // Profile section progress bar
  const progressBarSection = document.getElementById("profileProgressBarSection");
  if (progressBarSection) progressBarSection.style.width = progressPercent + "%";
  const progressLabelSection = document.getElementById("profileLevelProgressSection");
  if (progressLabelSection) progressLabelSection.textContent = Math.round(progressPercent) + "%";
}

function updateProfileLeaderboard() {
  const profileLeaderboardList = document.getElementById("profileLeaderboardList");
  if (!profileLeaderboardList) return;

  // Show loading state
  profileLeaderboardList.innerHTML = '<p class="empty-state">Loading leaderboard...</p>';

  // Try to fetch leaderboard data
  if (location.protocol === "file:") {
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
  apiCache.fetchWithCache("/api/leaderboard", { credentials: "include", signal }, 300000, 'json')
    .then(({ leaders, currentUserId }) => {
      apiAbort.clearSignal('profileLeaderboard');
      renderProfileLeaderboardRows(profileLeaderboardList, leaders || [], currentUserId);
    })
    .catch(err => {
      apiAbort.clearSignal('profileLeaderboard');
      if (err.name === 'AbortError') return;
      console.warn("Profile leaderboard load failed:", err);
      renderProfileLeaderboardFallback(profileLeaderboardList);
    });
}

function renderProfileLeaderboardFallback(container) {
  const userProgress = window.userProgress || {};
  const currentUser = {
    id: "local-user",
    name: userProgress.name || "Learner",
    xp: userProgress.xp || 0,
    level: userProgress.level || 1,
    avatar: userProgress.avatar || "🚀",
    rank: 1
  };
  renderProfileLeaderboardEntries(container, [currentUser], "local-user");
}

function renderProfileLeaderboardRows(container, leaders, currentUserId) {
  const userProgress = window.userProgress || {};
  const resolvedUserId = currentUserId || window.algoAuth?.user?.sub || window.algoAuth?.user?.id || "local-user";

  const rowsById = new Map();
  leaders.forEach(leader => {
    const normalized = {
      id: String(leader.id || ""),
      name: String(leader.name || "Learner"),
      xp: Math.max(0, Number(leader.xp) || 0),
      level: Math.max(1, Number(leader.level) || 1),
      avatar: String(leader.avatar || "🚀")
    };
    if (normalized.id) rowsById.set(normalized.id, normalized);
  });

  // Include current user
  const currentEntry = {
    id: resolvedUserId,
    name: userProgress.name || "Learner",
    xp: userProgress.xp || 0,
    level: userProgress.level || 1,
    avatar: userProgress.avatar || "🚀"
  };
  rowsById.set(currentEntry.id, currentEntry);

  const ranked = Array.from(rowsById.values())
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name))
    .map((leader, index) => ({ ...leader, rank: index + 1 }));

  const visible = ranked.slice(0, 10);
  if (!visible.some(l => l.id === currentEntry.id)) {
    const currentRow = ranked.find(l => l.id === currentEntry.id);
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
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  container.innerHTML = rows.map(user => {
    const isCurrentUser = user.id === currentUserId || (currentUserId === "local-user" && user.id === "local-user");
    const displayName = isCurrentUser ? `${user.name} (You)` : user.name;
    return `<div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
      <span class="leader-rank">#${user.rank}</span>
      <span class="leader-avatar" aria-hidden="true">${esc(user.avatar)}</span>
      <span class="leader-name">${esc(displayName)}</span>
      <span class="leader-xp">${user.xp.toLocaleString()} XP</span>
    </div>`;
  }).join("");
}
