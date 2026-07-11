import {
  ensureBookmarkCollectionsState,
  createCollection,
  renameCollection,
  deleteCollection,
  addProblemToCollections,
  getCollectionsForProblem,
  getCollectionStats,
  persistBookmarkCollections,
  loadBookmarkCollections,
  getBookmarkCollections,
  seedExampleBookmarkCollections
} from './bookmarkCollections.js';
import { filterCollectionsByQuery, filterCollections } from './bookmarkFilters.js';

function initBookmarkCollections() {
  if (window.__bookmarkCollectionsInitialized) return;
  window.__bookmarkCollectionsInitialized = true;
  const userProgress = window.userProgress || {};
  ensureBookmarkCollectionsState(userProgress);
  loadBookmarkCollections(userProgress);
  if (!getBookmarkCollections(userProgress).length) {
    seedExampleBookmarkCollections(userProgress);
    persistBookmarkCollections(userProgress);
  }
  renderBookmarkCollectionsPanel();
  attachBookmarkCollectionEvents();
}

function attachBookmarkCollectionEvents() {
  const createForm = document.getElementById('bookmarkCollectionCreateForm');
  if (createForm) {
    createForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = document.getElementById('bookmarkCollectionName');
      const description = document.getElementById('bookmarkCollectionDescription');
      const icon = document.getElementById('bookmarkCollectionIcon');
      const color = document.getElementById('bookmarkCollectionColor');
      if (!input || !window.userProgress) return;
      const created = createCollection(window.userProgress, {
        name: input.value,
        description: description ? description.value : '',
        icon: icon ? icon.value : '',
        color: color ? color.value : '#6366f1'
      });
      if (!created) {
        if (typeof window.showNotification === 'function') window.showNotification('Collection name is required and must be unique.', 'error');
        return;
      }
      if (typeof saveUserData === 'function') saveUserData();
      persistBookmarkCollections(window.userProgress);
      renderBookmarkCollectionsPanel();
      createForm.reset();
      if (typeof window.showNotification === 'function') window.showNotification(`Collection created: ${created.name}`, 'success');
    });
  }

  const searchInput = document.getElementById('bookmarkCollectionSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => renderBookmarkCollectionsPanel());
  }

  const topicFilter = document.getElementById('bookmarkCollectionTopicFilter');
  if (topicFilter) {
    topicFilter.addEventListener('change', () => renderBookmarkCollectionsPanel());
  }

  const solvedFilter = document.getElementById('bookmarkCollectionSolvedFilter');
  if (solvedFilter) {
    solvedFilter.addEventListener('change', () => renderBookmarkCollectionsPanel());
  }

  document.addEventListener('click', (event) => {
    const renameButton = event.target.closest('.bookmark-rename-btn');
    if (renameButton) {
      const collectionId = renameButton.dataset.collectionId;
      const collection = getBookmarkCollections(window.userProgress).find(item => item.id === collectionId);
      if (!collection) return;
      const nextName = window.prompt('Rename collection', collection.name);
      if (!nextName || !nextName.trim()) return;
      renameCollection(window.userProgress, collectionId, nextName);
      if (typeof saveUserData === 'function') saveUserData();
      persistBookmarkCollections(window.userProgress);
      renderBookmarkCollectionsPanel();
      return;
    }

    const deleteButton = event.target.closest('.bookmark-delete-btn');
    if (deleteButton) {
      const collectionId = deleteButton.dataset.collectionId;
      if (!window.confirm('Delete this collection? Problems will remain in favorites.')) return;
      deleteCollection(window.userProgress, collectionId);
      if (typeof saveUserData === 'function') saveUserData();
      persistBookmarkCollections(window.userProgress);
      renderBookmarkCollectionsPanel();
      return;
    }

    const addToCollectionButton = event.target.closest('.bookmark-add-collection-btn');
    if (addToCollectionButton) {
      const problemId = Number(addToCollectionButton.dataset.problemId);
      const collectionIds = Array.from(document.querySelectorAll('.bookmark-collection-choice:checked')).map(item => item.value);
      addProblemToCollections(window.userProgress, problemId, collectionIds);
      if (typeof saveUserData === 'function') saveUserData();
      persistBookmarkCollections(window.userProgress);
      renderBookmarkCollectionsPanel();
      if (typeof window.showNotification === 'function') window.showNotification('Problem added to selected collections.', 'success');
    }
  });
}

function renderBookmarkCollectionsPanel() {
  const container = document.getElementById('bookmarkCollectionsPanel');
  if (!container) return;
  const userProgress = window.userProgress || {};
  ensureBookmarkCollectionsState(userProgress);
  loadBookmarkCollections(userProgress);
  const searchInput = document.getElementById('bookmarkCollectionSearch');
  const topicFilter = document.getElementById('bookmarkCollectionTopicFilter');
  const solvedFilter = document.getElementById('bookmarkCollectionSolvedFilter');
  const searchQuery = searchInput ? searchInput.value : '';
  const filters = {
    topic: topicFilter ? topicFilter.value : '',
    solved: solvedFilter ? solvedFilter.checked : false,
    unsolved: false,
    recentlyAdded: false
  };
  let collections = getBookmarkCollections(userProgress);
  collections = filterCollectionsByQuery(collections, searchQuery);
  collections = filterCollections(collections, filters);
  if (!collections.length) {
    container.innerHTML = '<div class="empty-state">No bookmark collections yet. Create one to organize problems.</div>';
    return;
  }
  const problemData = Array.isArray(window.practiceProblems) ? window.practiceProblems : [];
  const stats = getCollectionStats(userProgress, problemData);
  const visibleCollections = stats.collections.filter(collection => collections.some(item => item.id === collection.id));
  container.innerHTML = visibleCollections.map(collection => {
    const problemCount = collection.problemCount || 0;
    const completedCount = collection.completedCount || 0;
    const completionPercent = collection.completionPercent || 0;
    return `
      <article class="bookmark-collection-card" style="border-left: 6px solid ${collection.color || '#6366f1'};">
        <div class="bookmark-collection-header">
          <div>
            <div class="bookmark-collection-icon">${collection.icon || '📚'}</div>
            <h3>${escapeHtml(collection.name)}</h3>
            <p>${escapeHtml(collection.description || 'Organized practice collection')}</p>
          </div>
          <div class="bookmark-collection-actions">
            <button type="button" class="bookmark-rename-btn" data-collection-id="${collection.id}" aria-label="Rename collection">✏️</button>
            <button type="button" class="bookmark-delete-btn" data-collection-id="${collection.id}" aria-label="Delete collection">🗑️</button>
          </div>
        </div>
        <div class="bookmark-collection-metrics">
          <span>${problemCount} problems</span>
          <span>${completedCount} completed</span>
          <span>${completionPercent}% done</span>
        </div>
      </article>`;
  }).join('');
}

function renderCollectionChooser(problemId) {
  const userProgress = window.userProgress || {};
  ensureBookmarkCollectionsState(userProgress);
  loadBookmarkCollections(userProgress);
  const collections = getBookmarkCollections(userProgress);
  if (!collections.length) return '';
  const selected = getCollectionsForProblem(userProgress, problemId);
  return `
    <div class="bookmark-collection-picker">
      <strong>Collections</strong>
      <div class="bookmark-collection-choices">
        ${collections.map(collection => `
          <label class="bookmark-collection-choice-item">
            <input type="checkbox" class="bookmark-collection-choice" value="${collection.id}" ${selected.includes(collection.id) ? 'checked' : ''}>
            <span>${escapeHtml(collection.name)}</span>
          </label>`).join('')}
      </div>
      <button type="button" class="bookmark-add-collection-btn" data-problem-id="${problemId}">Save to collections</button>
    </div>`;
}

function escapeHtml(value) {
  const text = String(value ?? '');
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export {
  initBookmarkCollections,
  renderBookmarkCollectionsPanel,
  renderCollectionChooser
};
