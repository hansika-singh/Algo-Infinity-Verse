function filterCollectionsByQuery(collections, query = '') {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) return collections;
  return collections.filter(collection => {
    const haystack = [collection.name, collection.description, ...(collection.problemIds || [])].join(' ').toLowerCase();
    return haystack.includes(normalized);
  });
}

function filterCollections(collections, filters = {}) {
  let result = [...collections];
  if (filters.topic) {
    result = result.filter(collection => {
      const problemIds = collection.problemIds || [];
      return problemIds.some(id => String(id).includes(filters.topic));
    });
  }
  if (filters.solved) {
    result = result.filter(collection => (collection.problemIds || []).length > 0);
  }
  if (filters.unsolved) {
    result = result.filter(collection => (collection.problemIds || []).length === 0);
  }
  if (filters.recentlyAdded) {
    result = result.filter(collection => collection.updatedAt);
  }
  return result;
}

export { filterCollectionsByQuery, filterCollections };
