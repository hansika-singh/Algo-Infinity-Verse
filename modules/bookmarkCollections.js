const COLLECTION_STORAGE_KEY = 'algoBookmarkCollections';
const COLLECTION_VERSION = 1;

function ensureBookmarkCollectionsState(userProgress) {
  if (!userProgress) return null;
  if (!Array.isArray(userProgress.bookmarkCollections)) {
    userProgress.bookmarkCollections = [];
  }
  if (!Array.isArray(userProgress.favoriteProblems)) {
    userProgress.favoriteProblems = [];
  }
  if (!userProgress.bookmarkCollectionMeta) {
    userProgress.bookmarkCollectionMeta = {};
  }
  return userProgress;
}

function normalizeCollectionName(name) {
  return String(name || '').trim().toLowerCase();
}

function sanitizeCollectionInput(payload = {}) {
  const name = String(payload.name || '').trim();
  return {
    name,
    description: String(payload.description || '').trim(),
    icon: String(payload.icon || '').trim(),
    color: String(payload.color || '#6366f1').trim()
  };
}

function createCollection(userProgress, payload = {}) {
  const state = ensureBookmarkCollectionsState(userProgress);
  if (!state) return null;
  const data = sanitizeCollectionInput(payload);
  if (!data.name) return null;
  const normalized = normalizeCollectionName(data.name);
  const duplicate = state.bookmarkCollections.some(collection => normalizeCollectionName(collection.name) === normalized);
  if (duplicate) return null;
  const collection = {
    id: `collection-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: data.name,
    description: data.description || '',
    icon: data.icon || '📚',
    color: data.color || '#6366f1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    problemIds: []
  };
  state.bookmarkCollections.push(collection);
  state.bookmarkCollectionMeta[collection.id] = { lastUsedAt: collection.updatedAt };
  return collection;
}

function renameCollection(userProgress, collectionId, newName) {
  const state = ensureBookmarkCollectionsState(userProgress);
  if (!state) return null;
  const collection = state.bookmarkCollections.find(item => item.id === collectionId);
  if (!collection) return null;
  const normalized = normalizeCollectionName(newName);
  if (!normalized) return null;
  const duplicate = state.bookmarkCollections.some(item => item.id !== collectionId && normalizeCollectionName(item.name) === normalized);
  if (duplicate) return null;
  collection.name = String(newName).trim();
  collection.updatedAt = new Date().toISOString();
  return collection;
}

function deleteCollection(userProgress, collectionId, targetCollectionId = null) {
  const state = ensureBookmarkCollectionsState(userProgress);
  if (!state) return false;
  const index = state.bookmarkCollections.findIndex(item => item.id === collectionId);
  if (index === -1) return false;
  const [removed] = state.bookmarkCollections.splice(index, 1);
  if (!removed) return false;
  const remainingProblemIds = Array.isArray(removed.problemIds) ? removed.problemIds : [];
  if (targetCollectionId && remainingProblemIds.length) {
    const target = state.bookmarkCollections.find(item => item.id === targetCollectionId);
    if (target) {
      target.problemIds = Array.from(new Set([...(target.problemIds || []), ...remainingProblemIds]));
      target.updatedAt = new Date().toISOString();
    }
  }
  delete state.bookmarkCollectionMeta[removed.id];
  return true;
}

function addProblemToCollections(userProgress, problemId, collectionIds = []) {
  const state = ensureBookmarkCollectionsState(userProgress);
  if (!state || !Number.isInteger(problemId)) return false;
  if (!Array.isArray(userProgress.favoriteProblems)) userProgress.favoriteProblems = [];
  if (!userProgress.favoriteProblems.includes(problemId)) userProgress.favoriteProblems.push(problemId);
  const ids = Array.from(new Set((collectionIds || []).filter(Boolean)));
  ids.forEach(collectionId => {
    const collection = state.bookmarkCollections.find(item => item.id === collectionId);
    if (!collection) return;
    collection.problemIds = Array.from(new Set([...(collection.problemIds || []), problemId]));
    collection.updatedAt = new Date().toISOString();
    state.bookmarkCollectionMeta[collection.id] = { lastUsedAt: collection.updatedAt };
  });
  return ids.length > 0;
}

function removeProblemFromCollections(userProgress, problemId, collectionIds = []) {
  const state = ensureBookmarkCollectionsState(userProgress);
  if (!state) return false;
  const ids = Array.from(new Set((collectionIds || []).filter(Boolean)));
  ids.forEach(collectionId => {
    const collection = state.bookmarkCollections.find(item => item.id === collectionId);
    if (!collection) return;
    collection.problemIds = (collection.problemIds || []).filter(item => item !== problemId);
    collection.updatedAt = new Date().toISOString();
  });
  if (!state.bookmarkCollections.some(collection => (collection.problemIds || []).includes(problemId))) {
    const favoriteIndex = userProgress.favoriteProblems.indexOf(problemId);
    if (favoriteIndex > -1) userProgress.favoriteProblems.splice(favoriteIndex, 1);
  }
  return ids.length > 0;
}

function moveProblemBetweenCollections(userProgress, problemId, sourceCollectionId, targetCollectionId) {
  const state = ensureBookmarkCollectionsState(userProgress);
  if (!state) return false;
  const source = state.bookmarkCollections.find(item => item.id === sourceCollectionId);
  const target = state.bookmarkCollections.find(item => item.id === targetCollectionId);
  if (!source || !target || sourceCollectionId === targetCollectionId) return false;
  source.problemIds = (source.problemIds || []).filter(item => item !== problemId);
  target.problemIds = Array.from(new Set([...(target.problemIds || []), problemId]));
  source.updatedAt = new Date().toISOString();
  target.updatedAt = new Date().toISOString();
  return true;
}

function copyProblemBetweenCollections(userProgress, problemId, sourceCollectionId, targetCollectionId) {
  const state = ensureBookmarkCollectionsState(userProgress);
  if (!state) return false;
  const source = state.bookmarkCollections.find(item => item.id === sourceCollectionId);
  const target = state.bookmarkCollections.find(item => item.id === targetCollectionId);
  if (!source || !target || sourceCollectionId === targetCollectionId) return false;
  target.problemIds = Array.from(new Set([...(target.problemIds || []), problemId]));
  target.updatedAt = new Date().toISOString();
  return true;
}

function getCollectionsForProblem(userProgress, problemId) {
  const state = ensureBookmarkCollectionsState(userProgress);
  if (!state) return [];
  return (state.bookmarkCollections || [])
    .filter(collection => (collection.problemIds || []).includes(problemId))
    .map(collection => collection.id);
}

function getCollectionStats(userProgress, problems = []) {
  const state = ensureBookmarkCollectionsState(userProgress);
  if (!state) return { totalCollections: 0, largestCollection: null, mostPracticedCollection: null, problemsCompleted: 0, completionPercent: 0, recentlyUsedCollections: [], collections: [] };
  const problemMap = new Map((problems || []).map(problem => [String(problem.id), problem]));
  const collections = (state.bookmarkCollections || []).map(collection => {
    const problemIds = Array.isArray(collection.problemIds) ? collection.problemIds : [];
    const completed = problemIds.filter(id => problemMap.has(String(id))).length;
    const total = problemIds.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return { ...collection, problemCount: total, completedCount: completed, completionPercent: percent };
  });
  const totalCollections = collections.length;
  const largestCollection = collections.slice().sort((a, b) => b.problemCount - a.problemCount)[0] || null;
  const mostPracticedCollection = collections.slice().sort((a, b) => (b.completedCount || 0) - (a.completedCount || 0))[0] || null;
  const recentlyUsedCollections = collections.slice().sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)).slice(0, 3);
  return {
    totalCollections,
    largestCollection,
    mostPracticedCollection,
    problemsCompleted: collections.reduce((sum, collection) => sum + (collection.completedCount || 0), 0),
    completionPercent: totalCollections ? Math.round(collections.reduce((sum, col) => sum + (col.completionPercent || 0), 0) / totalCollections) : 0,
    recentlyUsedCollections,
    collections
  };
}

function persistBookmarkCollections(userProgress) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(userProgress.bookmarkCollections || []));
  } catch (error) {
    console.warn('Bookmark collections storage unavailable', error);
  }
}

function loadBookmarkCollections(userProgress) {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(COLLECTION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    userProgress.bookmarkCollections = parsed;
    return parsed;
  } catch (error) {
    console.warn('Failed to parse stored bookmark collections', error);
    return [];
  }
}

function getBookmarkCollections(userProgress) {
  const state = ensureBookmarkCollectionsState(userProgress);
  return state ? state.bookmarkCollections : [];
}

function seedExampleBookmarkCollections(userProgress) {
  const state = ensureBookmarkCollectionsState(userProgress);
  if (!state) return false;
  if (Array.isArray(state.bookmarkCollections) && state.bookmarkCollections.length) return false;

  const examples = [
    {
      name: 'Warmup Arrays',
      description: 'A starter set of easy array problems.',
      icon: '🧠',
      color: '#6366f1',
      problemIds: [1, 16, 17]
    },
    {
      name: 'Interview Review',
      description: 'Common interview favorites to revisit.',
      icon: '🎯',
      color: '#06b6d4',
      problemIds: [2, 3, 10]
    },
    {
      name: 'Tree Practice',
      description: 'A small collection for tree traversal practice.',
      icon: '🌲',
      color: '#10b981',
      problemIds: [11, 12, 14]
    }
  ];

  examples.forEach((item) => {
    const collection = createCollection(state, {
      name: item.name,
      description: item.description,
      icon: item.icon,
      color: item.color
    });
    if (collection) {
      collection.problemIds = Array.from(new Set([...(item.problemIds || []), ...(collection.problemIds || [])]));
      collection.updatedAt = new Date().toISOString();
      state.bookmarkCollectionMeta[collection.id] = { lastUsedAt: collection.updatedAt };
    }
  });

  if (Array.isArray(state.favoriteProblems)) {
    const seededProblemIds = examples.flatMap((item) => item.problemIds || []);
    seededProblemIds.forEach((problemId) => {
      if (!state.favoriteProblems.includes(problemId)) state.favoriteProblems.push(problemId);
    });
  }

  return true;
}

export {
  COLLECTION_STORAGE_KEY,
  ensureBookmarkCollectionsState,
  createCollection,
  renameCollection,
  deleteCollection,
  addProblemToCollections,
  removeProblemFromCollections,
  moveProblemBetweenCollections,
  copyProblemBetweenCollections,
  getCollectionsForProblem,
  getCollectionStats,
  persistBookmarkCollections,
  loadBookmarkCollections,
  getBookmarkCollections,
  seedExampleBookmarkCollections
};
