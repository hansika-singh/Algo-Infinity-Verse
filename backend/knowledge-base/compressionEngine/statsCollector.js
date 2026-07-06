// backend/knowledge-base/compressionEngine/statsCollector.js
// Collects simple usage statistics for a given topic.
// In a real system this would query the user's submissions, flashcards, etc.
// Here we provide a stub that returns mock data suitable for the prototype.

/**
 * Mock function to simulate fetching user submissions for a topic.
 * @param {string} userId - ID of the user.
 * @param {string} topic - Topic name.
 * @returns {Array<Object>} Array of submission objects.
 */
function fetchUserSubmissions(userId, topic) {
  // TODO: Replace with real data source (e.g., DB query).
  // Returning an array of dummy submissions for demonstration.
  return Array.from({ length: 10 }, (_, i) => ({
    id: `sub-${i}`,
    topic,
    userId,
    // Simulated mistake categories.
    mistake: i % 3 === 0 ? 'Missing base case' : i % 3 === 1 ? 'Off‑by‑one' : 'Inefficient recursion',
    // Simulated time taken (seconds).
    duration: Math.floor(Math.random() * 120) + 30,
  }));
}

/**
 * Aggregates statistics from an array of submissions.
 * @param {Array<Object>} submissions
 * @returns {Object} Aggregated stats.
 */
function aggregateStats(submissions) {
  const total = submissions.length;
  const totalTime = submissions.reduce((sum, s) => sum + s.duration, 0);
  const avgTime = total ? Math.round(totalTime / total) : 0;

  // Count mistakes.
  const mistakeCounts = submissions.reduce((acc, s) => {
    acc[s.mistake] = (acc[s.mistake] || 0) + 1;
    return acc;
  }, {});

  return {
    totalSubmissions: total,
    averageDurationSec: avgTime,
    mistakeBreakdown: mistakeCounts,
  };
}

module.exports = { fetchUserSubmissions, aggregateStats };
