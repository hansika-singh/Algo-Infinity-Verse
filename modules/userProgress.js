// ============================================
// USER PROGRESS STATE
// ============================================
window.userProgress = {
  name: "Learner",
  avatar: "🚀",
  bio: '',
  name: 'Learner',
  avatar: { initial: 'L', bg: '#7c3aed' },
  completedProblems: [],
  completedDailyChallenges: [],
  codingPersonality: {
    type: 'brute-force first',
    bruteForceCount: 1,
    slowAccurateCount: 0,
    greedyCount: 0,
    overOptimizerCount: 0,
  },
  favoriteProblems: [],
  bookmarkCollections: [],
  bookmarkCollectionMeta: {},
  recentProblems: [],
  problemNotes: {},
  spacedRepetition: {},
  reviewStreak: 0,
  xp: 0,
  level: 1,
  streak: 0,
  freezes: 0,
  freezeHistory: [],
  badges: [],
  completedRoadmapSteps: [],
  lastActive: null,
  quizScores: {},
  dailyGoals: {},

  bestQuizTimes: {},
  activityData: {},
  xpHistory: [],
  quizAttempts: [],
  practiceEvents: [],
  mistakeDna: { offByOneCount: 0, recursionBaseCaseCount: 0, wrongLogicCount: 0, recentLogs: [] },
  revisionSchedule: {
    arrays: { currentStage: 0, nextReviewDate: null, history: [] },
    strings: { currentStage: 0, nextReviewDate: null, history: [] },
    linkedlist: { currentStage: 0, nextReviewDate: null, history: [] },
    trees: { currentStage: 0, nextReviewDate: null, history: [] },
    graphs: { currentStage: 0, nextReviewDate: null, history: [] },
    dp: { currentStage: 0, nextReviewDate: null, history: [] },
  },
  loaded: false,
};

let userProgress = window.userProgress;

function updateProfile() {
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
  const profileLevel = document.getElementById('profileLevel');
  if (profileLevel)
    profileLevel.textContent = `Level ${userProgress.level} - ${levelNames[userProgress.level - 1]}`;
  const profileLevelSection = document.getElementById('profileLevelSection');
  if (profileLevelSection)
    profileLevelSection.textContent = `Level ${userProgress.level} - ${levelNames[userProgress.level - 1]}`;
  const profileXP = document.getElementById('profileTotalXP');
  if (profileXP) profileXP.textContent = userProgress.xp.toLocaleString();
  const profileXPSection = document.getElementById('profileTotalXPSection');
  if (profileXPSection) profileXPSection.textContent = userProgress.xp.toLocaleString();
  const profileProblems = document.getElementById('profileProblems');
  if (profileProblems) profileProblems.textContent = userProgress.completedProblems.length;
  const profileProblemsSection = document.getElementById('profileProblemsSection');
  if (profileProblemsSection)
    profileProblemsSection.textContent = userProgress.completedProblems.length;
  const profileStreak = document.getElementById('profileStreak');
  if (profileStreak) profileStreak.textContent = userProgress.streak;
  const profileFreezes = document.getElementById('profileFreezes');
  if (profileFreezes) profileFreezes.textContent = userProgress.freezes || 0;
  const profileSectionStreak = document.getElementById('profileSectionStreak');
  if (profileSectionStreak) profileSectionStreak.textContent = userProgress.streak;
  const profileSectionFreezes = document.getElementById('profileSectionFreezes');
  if (profileSectionFreezes) profileSectionFreezes.textContent = userProgress.freezes || 0;
  const profileBadges = document.getElementById('profileBadges');
  if (profileBadges) {
    const badges = [
      userProgress.completedProblems.length >= 1,
      userProgress.streak >= 7,
      userProgress.xp >= 5000,
      userProgress.completedProblems.length >= 50,
      userProgress.completedProblems.length >= 100,
      userProgress.completedProblems.length >= 25 && userProgress.xp >= 2500,
    ].filter(Boolean).length;
    profileBadges.textContent = badges;
    const profileBadgesSection = document.getElementById('profileBadgesSection');
    if (profileBadgesSection) profileBadgesSection.textContent = badges;
  }
  document
    .querySelectorAll('.avatar-icon')
    .forEach((el) => renderAvatar(el, userProgress.avatar));

  function renderAvatar(el, av) {
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
  const profileSectionName = document.getElementById('profileSectionName');
  if (profileSectionName) profileSectionName.textContent = userProgress.name || 'Learner';
  updateLevelProgress();
}

function updateLevelProgress() {
  const levels = [0, 1000, 2500, 5000, 10000, 20000, 50000, 100000];
  const currentLevel = userProgress.level;
  const currentLevelXP = levels[Math.max(0, currentLevel - 1)];
  const nextLevelXP = levels[currentLevel] || 100000;
  const xpProgress = ((userProgress.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  const progressPercent = Math.min(Math.max(xpProgress, 0), 100);
  const progressBar = document.getElementById('profileProgressBar');
  if (progressBar) progressBar.style.width = progressPercent + '%';
  const progressLabel = document.getElementById('profileLevelProgress');
  if (progressLabel) progressLabel.textContent = Math.round(progressPercent) + '%';
  const progressBarSection = document.getElementById('profileProgressBarSection');
  if (progressBarSection) progressBarSection.style.width = progressPercent + '%';
  const progressLabelSection = document.getElementById('profileLevelProgressSection');
  if (progressLabelSection) progressLabelSection.textContent = Math.round(progressPercent) + '%';
}

function updateStreak() {
  const today = new Date();
  const lastActive = userProgress.lastActive ? new Date(userProgress.lastActive) : null;
  if (lastActive) {
    const diffDays = getDaysDifference(lastActive, today);
    if (diffDays > 1) userProgress.streak = 1;
    else if (diffDays === 0) {
      /* already active today */
    } else {
      let daysMissed = diffDays > 0 ? diffDays - 1 : 0;
      while (daysMissed > 0 && userProgress.freezes > 0) {
        userProgress.freezes -= 1;
        daysMissed -= 1;
        userProgress.freezeHistory.push({
          date: new Date(today.getTime() - (daysMissed + 1) * 24 * 60 * 60 * 1000).toISOString(),
          reason: 'Missed day automatically frozen',
        });
      }
      if (daysMissed > 0) userProgress.streak = 1;
      else {
        userProgress.streak += 1;
        if (userProgress.streak > 0 && userProgress.streak % 7 === 0) {
          userProgress.freezes += 1;
          showNotification('Milestone reached! You earned a Streak Freeze!', 'success');
        }
      }
    }
  } else userProgress.streak = 1;
  userProgress.lastActive = today.toISOString();
}

function getDaysDifference(date1, date2) {
  const d1 = new Date(date1);
  d1.setHours(0, 0, 0, 0);
  const d2 = new Date(date2);
  d2.setHours(0, 0, 0, 0);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function backfillActivityData() {
  if (!userProgress.activityData) userProgress.activityData = {};
  const lastActive = userProgress.lastActive ? new Date(userProgress.lastActive) : null;
  const anchor = lastActive || new Date();
  const total = userProgress.completedProblems.length;
  if (total > 0) {
    const today = new Date();
    let day = new Date(anchor);
    for (let i = 0; i < total; i++) {
      const key = formatDateKey(day);
      if (!userProgress.activityData[key]) userProgress.activityData[key] = 1;
      else userProgress.activityData[key] += 1;
      day.setDate(day.getDate() - 1);
      if (day > today) {
        day.setDate(today.getDate());
        break;
      }
    }
  }
}

function recordDailyActivity(problemCount = 1) {
  if (!userProgress.activityData) userProgress.activityData = {};
  const today = new Date();
  const dateKey = formatDateKey(today);
  userProgress.activityData[dateKey] = (userProgress.activityData[dateKey] || 0) + problemCount;
  recordAnalyticsEvent('practice', { dateKey, problemCount });
}

function ensureAnalyticsCollections() {
  if (!Array.isArray(userProgress.xpHistory)) userProgress.xpHistory = [];
  if (!Array.isArray(userProgress.quizAttempts)) userProgress.quizAttempts = [];
  if (!Array.isArray(userProgress.practiceEvents)) userProgress.practiceEvents = [];
}

function recordAnalyticsEvent(type, payload = {}) {
  ensureAnalyticsCollections();
  const entry = { type, timestamp: new Date().toISOString(), ...payload };

  if (type === 'xp') {
    userProgress.xpHistory.push(entry);
    if (userProgress.xpHistory.length > 120)
      userProgress.xpHistory = userProgress.xpHistory.slice(-120);
  } else if (type === 'quiz') {
    userProgress.quizAttempts.push(entry);
    if (userProgress.quizAttempts.length > 120)
      userProgress.quizAttempts = userProgress.quizAttempts.slice(-120);
  } else if (type === 'practice') {
    userProgress.practiceEvents.push(entry);
    if (userProgress.practiceEvents.length > 200)
      userProgress.practiceEvents = userProgress.practiceEvents.slice(-200);
  }

  return entry;
}

let cachedSession = null;
let progressSyncTimer = null;

function queueProgressSync() {
  if (location.protocol === 'file:') return;
  clearTimeout(progressSyncTimer);
  progressSyncTimer = setTimeout(syncUserProgress, 600);
}

async function syncUserProgress() {
  const session = await getAuthenticatedSession();
  if (!session?.authenticated) return;
  try {
    await fetch('/api/progress', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userProgress.name,
        xp: userProgress.xp,
        level: userProgress.level,
        avatar: userProgress.avatar,
        bookmarkCollections: userProgress.bookmarkCollections || [],
      }),
    });
    if (typeof updateLeaderboard === 'function') updateLeaderboard();
  } catch (e) {
    void 0;
  }
}

async function getAuthenticatedSession() {
  if (window.algoAuth) {
    cachedSession = window.algoAuth;
    return cachedSession;
  }
  if (cachedSession) return cachedSession;
  try {
    const response = await fetch('/api/session', { credentials: 'include' });
    cachedSession = response.ok ? await response.json() : { authenticated: false, user: null };
  } catch {
    cachedSession = { authenticated: false, user: null };
  }
  return cachedSession;
}

window.saveUserData = async function saveUserData() {
  try {
    userProgress.lastActive = new Date().toISOString();
    if (!Array.isArray(userProgress.bookmarkCollections)) userProgress.bookmarkCollections = [];
    if (!userProgress.bookmarkCollectionMeta) userProgress.bookmarkCollectionMeta = {};
    if (!Array.isArray(userProgress.bookmarkCollections)) userProgress.bookmarkCollections = [];
    if (!userProgress.bookmarkCollectionMeta) userProgress.bookmarkCollectionMeta = {};
    if (window.StorageDB && window.DB_STORES) {
      await window.StorageDB.set(window.DB_STORES.USER_DATA, 'algoInfinityVerse', userProgress);
    } else {
      localStorage.setItem('algoInfinityVerse', JSON.stringify(userProgress));
    }
    queueProgressSync();
  } catch (e) {
    void 0;
  }
}

async function loadUserData() {
  try {
    if (window.StorageDB) {
      await window.StorageDB.migrateFromLocalStorage();
    }

    let saved = null;
    if (window.StorageDB && window.DB_STORES) {
      saved = await window.StorageDB.get(window.DB_STORES.USER_DATA, 'algoInfinityVerse');
    } else {
      const lsSaved = localStorage.getItem('algoInfinityVerse');
      if (lsSaved) saved = JSON.parse(lsSaved);
    }

    if (saved) {
      Object.assign(userProgress, saved);
      if (!userProgress.quizScores) userProgress.quizScores = {};
      if (!userProgress.completedRoadmapSteps) userProgress.completedRoadmapSteps = [];
      if (!userProgress.activityData) userProgress.activityData = {};
      if (!userProgress.xpHistory) userProgress.xpHistory = [];
      if (!userProgress.quizAttempts) userProgress.quizAttempts = [];
      if (!userProgress.practiceEvents) userProgress.practiceEvents = [];
      if (!userProgress.codingPersonality)
        userProgress.codingPersonality = {
          type: 'brute-force first',
          bruteForceCount: 1,
          slowAccurateCount: 0,
          greedyCount: 0,
          overOptimizerCount: 0,
        };
      if (!Array.isArray(userProgress.bookmarkCollections)) userProgress.bookmarkCollections = [];
      if (!userProgress.bookmarkCollectionMeta) userProgress.bookmarkCollectionMeta = {};
      if (!userProgress.mistakeDna)
        userProgress.mistakeDna = {
          offByOneCount: 0,
          recursionBaseCaseCount: 0,
          wrongLogicCount: 0,
          recentLogs: [],
        };
      if (!userProgress.dailyGoals) userProgress.dailyGoals = {};
      backfillActivityData();
    } else {
      Object.assign(userProgress, {
        name: 'Learner',
        avatar: { initial: 'L', bg: '#7c3aed' },
        completedProblems: [],
        completedDailyChallenges: [],
        codingPersonality: {
          type: 'brute-force first',
          bruteForceCount: 1,
          slowAccurateCount: 0,
          greedyCount: 0,
          overOptimizerCount: 0,
        },
        favoriteProblems: [],
        bookmarkCollections: [],
        bookmarkCollectionMeta: {},
        recentProblems: [],
        problemNotes: {},
        xp: 0,
        level: 1,
        streak: 0,
        freezes: 0,
        freezeHistory: [],
        badges: [],
        completedRoadmapSteps: [],
        lastActive: null,
        quizScores: {},
        bestQuizTimes: {},
        dailyGoals: {},
        activityData: {},
        xpHistory: [],
        quizAttempts: [],
        practiceEvents: [],
        mistakeDna: {
          offByOneCount: 0,
          recursionBaseCaseCount: 0,
          wrongLogicCount: 0,
          recentLogs: [],
        },
        revisionSchedule: {
          arrays: { currentStage: 0, nextReviewDate: null, history: [] },
          strings: { currentStage: 0, nextReviewDate: null, history: [] },
          linkedlist: { currentStage: 0, nextReviewDate: null, history: [] },
          trees: { currentStage: 0, nextReviewDate: null, history: [] },
          graphs: { currentStage: 0, nextReviewDate: null, history: [] },
          dp: { currentStage: 0, nextReviewDate: null, history: [] },
        },
      });
      saveUserData();
    }
  } catch (e) {
    console.error('Error loading user data:', e);
    Object.assign(userProgress, {
      name: 'Learner',
      avatar: { initial: 'L', bg: '#7c3aed' },
      completedProblems: [],
      completedDailyChallenges: [],
      codingPersonality: {
        type: 'brute-force first',
        bruteForceCount: 1,
        slowAccurateCount: 0,
        greedyCount: 0,
        overOptimizerCount: 0,
      },
      favoriteProblems: [],
      recentProblems: [],
      problemNotes: {},
      xp: 0,
      level: 1,
      streak: 0,
      freezes: 0,
      freezeHistory: [],
      badges: [],
      completedRoadmapSteps: [],
      lastActive: null,
      quizScores: {},
      bestQuizTimes: {},
      dailyGoals: {},
      activityData: {},
      xpHistory: [],
      quizAttempts: [],
      practiceEvents: [],
      mistakeDna: {
        offByOneCount: 0,
        recursionBaseCaseCount: 0,
        wrongLogicCount: 0,
        recentLogs: [],
      },
      revisionSchedule: {
        arrays: { currentStage: 0, nextReviewDate: null, history: [] },
        strings: { currentStage: 0, nextReviewDate: null, history: [] },
        linkedlist: { currentStage: 0, nextReviewDate: null, history: [] },
        trees: { currentStage: 0, nextReviewDate: null, history: [] },
        graphs: { currentStage: 0, nextReviewDate: null, history: [] },
        dp: { currentStage: 0, nextReviewDate: null, history: [] },
      },
    });
    saveUserData();
  }
  userProgress.loaded = true;
  updateProfile();
  if (typeof window.updateDashboard === 'function') window.updateDashboard();
  getAuthenticatedSession().then((session) => {
    if (session?.user?.name) {
      userProgress.name = session.user.name;
      updateProfile();
      if (typeof window.updateDashboard === 'function') window.updateDashboard();
      saveUserData();
    } else {
      userProgress.name = 'Learner';
      updateProfile();
      if (typeof window.updateDashboard === 'function') window.updateDashboard();
      saveUserData();
    }
    if (typeof window !== 'undefined' && typeof window.initProfile === 'function') {
      window.initProfile();
    }
  });
}
