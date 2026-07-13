import { processInBatches } from '../utils/concurrency.js';

/**
 * Simulates fetching large repository blobs via GraphQL API.
 * Uses the concurrency utility to process fetches in manageable batches,
 * preventing Node.js memory heap exhaustion and OOM crashes.
 *
 * @param {Array<string>} filePaths - Array of file paths to fetch.
 * @param {string} repoOwner - Owner of the repository.
 * @param {string} repoName - Repository name.
 * @returns {Promise<Array>} - Array of fetched blob contents.
 */
export async function fetchBlobsConcurrently(filePaths, _repoOwner, _repoName) {
  // Simulate GraphQL endpoint

  // Async function to fetch a single blob
  const fetchSingleBlob = async (filePath, _index) => {
    // In a real scenario, this would use a GraphQL Query, e.g.,
    // query { repository(owner: "owner", name: "repo") { object(expression: "HEAD:path") { ... on Blob { text } } } }
    
    // Simulating network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
    
    // Simulate fetching
    return {
      path: filePath,
      content: `Simulated content for ${filePath}`
    };
  };

  // Process the large array of file paths with a strict concurrency limit of 5.
  // This replaces unconstrained Promise.all(filePaths.map(...))
  try {
    const fetchedBlobs = await processInBatches(filePaths, fetchSingleBlob, 5);
    return fetchedBlobs;
  } catch (error) {
    console.error("Batch fetch failed:", error);
    throw new Error("Failed to fetch repository blobs in batches");
  }
}
