import { getCollectionStats } from './bookmarkCollections.js';

function getBookmarkOverview(userProgress, problems = []) {
  return getCollectionStats(userProgress, problems);
}

export { getBookmarkOverview };
