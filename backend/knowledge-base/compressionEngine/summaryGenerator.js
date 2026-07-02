// backend/knowledge-base/compressionEngine/summaryGenerator.js
// Generates a concise "cheat sheet" revision markdown for a topic based on user stats.
// This is a lightweight implementation that uses the statsCollector stub.
// In a production system this would incorporate LLM‑generated insights.

const { fetchUserSubmissions, aggregateStats } = require('./statsCollector');

/**
 * Builds a markdown section summarizing user performance for the given topic.
 * @param {string} topic - The topic name (e.g., "Dynamic Programming").
 * @param {string} userId - ID of the user.
 * @returns {string} Markdown string.
 */
function generateStatsSection(topic, userId) {
  const submissions = fetchUserSubmissions(userId, topic);
  const stats = aggregateStats(submissions);

  const mistakeLines = Object.entries(stats.mistakeBreakdown)
    .map(([mistake, count]) => `- ${mistake}: ${count} time(s)`).join('\n');

  return `## 📊 Personal Revision Cheat Sheet\n\n` +
    `**Total Submissions:** ${stats.totalSubmissions}\n` +
    `**Average Solving Time:** ${stats.averageDurationSec}s\n\n` +
    `### Common Mistakes\n${mistakeLines}\n`;
}

module.exports = { generateStatsSection };
