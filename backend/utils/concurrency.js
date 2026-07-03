/**
 * Executes a set of asynchronous tasks with a concurrency limit.
 * This prevents Out-Of-Memory (OOM) crashes by ensuring no more than
 * `limit` promises are running simultaneously.
 *
 * @param {Array} items - The array of items to process.
 * @param {Function} asyncFn - The async function to call on each item. Returns a Promise.
 * @param {number} limit - Maximum number of concurrent executions (default 5).
 * @returns {Promise<Array>} - Resolves to an array of results in the same order as items.
 */
export async function processInBatches(items, asyncFn, limit = 5) {
  const results = [];
  const executing = new Set();

  let index = 0;

  for (const item of items) {
    // Wrap the call to ensure it tracks the index correctly for ordering
    const currentIndex = index++;
    const promise = Promise.resolve().then(() => asyncFn(item, currentIndex));

    // Save the promise to the executing set
    executing.add(promise);

    // When the promise resolves or rejects, remove it from the executing set
    const cleanPromise = promise
      .then(result => {
        results[currentIndex] = { status: 'fulfilled', value: result };
      })
      .catch(error => {
        results[currentIndex] = { status: 'rejected', reason: error };
      })
      .finally(() => {
        executing.delete(cleanPromise);
      });
      
    // Add the cleanup promise to the executing set to await its completion,
    // not the raw promise, because we want to wait for the result assignment.
    executing.add(cleanPromise);
    executing.delete(promise);

    // If we've reached the concurrency limit, wait for at least one to finish
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  // Wait for all remaining promises to finish
  await Promise.all(executing);

  // Return the unwrapped results, throwing the first error if any occurred to match Promise.all behavior,
  // or return all if we want Promise.allSettled behavior. We'll mimic Promise.all but collect all first.
  const finalResults = [];
  for (const r of results) {
    if (r.status === 'rejected') {
      throw r.reason;
    }
    finalResults.push(r.value);
  }

  return finalResults;
}
