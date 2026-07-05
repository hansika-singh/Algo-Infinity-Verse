/**
 * Calculates individual readiness scores and provides feedback/suggestions.
 * @param {Object} userData - Contains metrics like quizzes, problemsSolved, streak, topicCoverage, xp
 */
export function calculateReadinessScore(userData) {
  const {
    quizPerformance = 0,    // percentage (0-100)
    problemsSolved = 0,     // count
    targetProblems = 100,   // baseline benchmark
    streakDays = 0,         // current streak
    maxStreakGoal = 30,     // baseline benchmark
    coveredTopics = [],     // array of strings
    totalRequiredTopics = ['DSA', 'System Design', 'Behavioral'],
    xpEarned = 0,
    targetXp = 5000
  } = userData;

  // 1. Calculate Component Scores (Normalized to 0-100)
  const dsaScore = Math.min((problemsSolved / targetProblems) * 100, 100);
  const systemDesignScore = coveredTopics.includes('System Design') ? 100 : 50; // Simple placeholder logic
  const interviewScore = quizPerformance;
  const streakBonus = Math.min((streakDays / maxStreakGoal) * 100, 100);
  const xpScore = Math.min((xpEarned / targetXp) * 100, 100);

  // 2. Weighted Overall Score Calculation (Weights sum to 1.0)
  // DSA (30%), System Design (25%), Interview/Quizzes (25%), Streak (10%), XP (10%)
  const overallScore = Math.round(
    (dsaScore * 0.30) +
    (systemDesignScore * 0.25) +
    (interviewScore * 0.25) +
    (streakBonus * 0.10) +
    (xpScore * 0.10)
  );

  // 3. Find Missing Topics & Generate Suggestions
  const missingTopics = totalRequiredTopics.filter(topic => !coveredTopics.includes(topic));
  const suggestions = [];

  if (interviewScore < 70) suggestions.push("Take more mock quizzes to boost your quick recall.");
  if (problemsSolved < (targetProblems / 2)) suggestions.push("Try solving at least 2 DSA problems daily to hit your target.");
  if (streakDays < 5) suggestions.push("Maintain a 5-day streak to unlock consistency multipliers.");
  if (missingTopics.length > 0) suggestions.push(`Focus on learning missing foundational topics: ${missingTopics.join(', ')}.`);

  return {
    overallPercentage: overallScore,
    breakdown: {
      dsa: Math.round(dsaScore),
      systemDesign: Math.round(systemDesignScore),
      interview: Math.round(interviewScore)
    },
    missingTopics,
    suggestions: suggestions.length > 0 ? suggestions : ["Looking sharp! Keep maintaining your current pace."]
  };
}
