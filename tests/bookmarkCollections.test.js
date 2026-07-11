import { jest } from '@jest/globals';
import {
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
  seedExampleBookmarkCollections
} from '../modules/bookmarkCollections.js';

describe('bookmark collections', () => {
  test('creates unique collections and rejects empty names', () => {
    const userProgress = { favoriteProblems: [], bookmarkCollections: [] };

    const created = createCollection(userProgress, { name: 'Arrays' });
    expect(created).toBeTruthy();
    expect(userProgress.bookmarkCollections).toHaveLength(1);

    const duplicate = createCollection(userProgress, { name: 'arrays' });
    expect(duplicate).toBeNull();

    const invalid = createCollection(userProgress, { name: '   ' });
    expect(invalid).toBeNull();
  });

  test('seeds example collections for new users', () => {
    const userProgress = { favoriteProblems: [], bookmarkCollections: [] };
    const seeded = seedExampleBookmarkCollections(userProgress);
    expect(seeded).toBe(true);
    expect(userProgress.bookmarkCollections).toHaveLength(3);
    expect(userProgress.bookmarkCollections[0].problemIds.length).toBeGreaterThan(0);
  });

  test('adds and removes a problem from multiple collections without touching favorites', () => {
    const userProgress = { favoriteProblems: [101], bookmarkCollections: [] };
    const first = createCollection(userProgress, { name: 'Warmups' });
    const second = createCollection(userProgress, { name: 'Review' });

    addProblemToCollections(userProgress, 101, [first.id, second.id]);
    expect(getCollectionsForProblem(userProgress, 101)).toEqual(expect.arrayContaining([first.id, second.id]));
    expect(userProgress.favoriteProblems).toContain(101);

    removeProblemFromCollections(userProgress, 101, [first.id]);
    expect(getCollectionsForProblem(userProgress, 101)).toEqual([second.id]);
  });

  test('renames collections and updates stats', () => {
    const userProgress = { favoriteProblems: [1, 2], bookmarkCollections: [] };
    const collection = createCollection(userProgress, { name: 'DSA' });
    addProblemToCollections(userProgress, 1, [collection.id]);
    addProblemToCollections(userProgress, 2, [collection.id]);

    const renamed = renameCollection(userProgress, collection.id, 'Dynamic Programming');
    expect(renamed.name).toBe('Dynamic Programming');
    const stats = getCollectionStats(userProgress, [{ id: 1, difficulty: 'easy', tags: [], acceptance: '70%' }, { id: 2, difficulty: 'hard', tags: [], acceptance: '60%' }]);
    expect(stats.totalCollections).toBe(1);
    expect(stats.collections[0].problemCount).toBe(2);
  });

  test('moves and copies problems between collections', () => {
    const userProgress = { favoriteProblems: [], bookmarkCollections: [] };
    const a = createCollection(userProgress, { name: 'A' });
    const b = createCollection(userProgress, { name: 'B' });
    addProblemToCollections(userProgress, 42, [a.id]);

    const moved = moveProblemBetweenCollections(userProgress, 42, a.id, b.id);
    expect(moved).toBe(true);
    expect(getCollectionsForProblem(userProgress, 42)).toEqual([b.id]);

    addProblemToCollections(userProgress, 77, [a.id]);
    const copied = copyProblemBetweenCollections(userProgress, 77, a.id, b.id);
    expect(copied).toBe(true);
    expect(getCollectionsForProblem(userProgress, 77)).toEqual(expect.arrayContaining([a.id, b.id]));
  });

  test('deletes a collection and optionally reassigns problems', () => {
    const userProgress = { favoriteProblems: [], bookmarkCollections: [] };
    const first = createCollection(userProgress, { name: 'First' });
    const second = createCollection(userProgress, { name: 'Second' });
    addProblemToCollections(userProgress, 1, [first.id]);

    const deleted = deleteCollection(userProgress, first.id, second.id);
    expect(deleted).toBe(true);
    expect(userProgress.bookmarkCollections.find(col => col.id === first.id)).toBeUndefined();
    expect(getCollectionsForProblem(userProgress, 1)).toEqual([second.id]);
  });
});
