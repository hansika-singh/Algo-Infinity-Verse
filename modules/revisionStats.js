// modules/revisionStats.js

/**
 * Calculates revision statistics from user progress.
 * @param {Object} userProgress - Global user progress object
 * @returns {Object} Calculated stats
 */
export function calculateStats(userProgress) {
  const schedule = userProgress.revisionSchedule || {};
  const calendar = userProgress.revisionCalendar || {};
  const history = calendar.history || [];
  const quizScores = userProgress.quizScores || {};
  const quizAttempts = userProgress.quizAttempts || [];

  // 1. Streak calculations (verify consecutive days in history)
  const today = new Date();
  const todayKey = toDateKey(today);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toDateKey(yesterday);

  // Group completions by date
  const completionsByDate = new Set();
  history.forEach(h => {
    if (h.completed || h.status === 'completed') {
      completionsByDate.add(h.dayKey);
    }
  });

  let currentStreak = 0;
  let checkDate = new Date();
  
  // If no completions today or yesterday, streak is broken (0)
  if (completionsByDate.has(todayKey) || completionsByDate.has(yesterdayKey)) {
    // If completed yesterday but not yet today, start checking from yesterday
    if (!completionsByDate.has(todayKey)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    while (completionsByDate.has(toDateKey(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  const longestStreak = Math.max(calendar.longestStreak || 0, currentStreak);

  // 2. Mastered & Weakest Topics
  const topicKeys = Object.keys(schedule);
  const masteredTopics = [];
  const weakestTopics = [];

  topicKeys.forEach(topicKey => {
    const bestScore = quizScores[topicKey]?.bestScore || 0;
    const stage = schedule[topicKey]?.currentStage || 0;

    if (bestScore >= 85 && stage >= 3) {
      masteredTopics.push(topicKey);
    } else if (bestScore > 0 && bestScore < 60) {
      weakestTopics.push(topicKey);
    }
  });

  // 3. Weekly/Monthly Completion Rates
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const completedWeekly = history.filter(h => new Date(h.dayKey) >= weekAgo && (h.completed || h.status === 'completed')).length;
  const totalWeekly = history.filter(h => new Date(h.dayKey) >= weekAgo).length;

  const completedMonthly = history.filter(h => new Date(h.dayKey) >= monthAgo && (h.completed || h.status === 'completed')).length;
  const totalMonthly = history.filter(h => new Date(h.dayKey) >= monthAgo).length;

  const weeklyCompletionRate = totalWeekly > 0 ? Math.round((completedWeekly / totalWeekly) * 100) : 100;
  const monthlyCompletionRate = totalMonthly > 0 ? Math.round((completedMonthly / totalMonthly) * 100) : 100;

  // 4. Average Quiz Improvement
  // Group quiz attempts by topic key, chronological order
  const attemptsByTopic = {};
  quizAttempts.forEach(attempt => {
    const topic = attempt.topic;
    if (topic) {
      if (!attemptsByTopic[topic]) attemptsByTopic[topic] = [];
      attemptsByTopic[topic].push(attempt);
    }
  });

  let totalImprovement = 0;
  let improvementTopicsCount = 0;

  for (const topic in attemptsByTopic) {
    const attempts = attemptsByTopic[topic].sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
    if (attempts.length >= 2) {
      const firstScore = attempts[0].percentage || 0;
      const lastScore = attempts[attempts.length - 1].percentage || 0;
      totalImprovement += (lastScore - firstScore);
      improvementTopicsCount++;
    }
  }

  const averageQuizImprovement = improvementTopicsCount > 0 ? Math.round(totalImprovement / improvementTopicsCount) : 0;

  // 5. Retention Estimate (half-life spaced decay)
  let totalRetention = 0;
  let topicsCalculated = 0;

  topicKeys.forEach(topicKey => {
    const topicSchedule = schedule[topicKey] || {};
    const lastReviewedStr = topicSchedule.history?.[topicSchedule.history.length - 1]?.reviewedAt;
    const intervalDays = topicSchedule.currentStage ? [1, 3, 7, 14, 30][topicSchedule.currentStage] : 1;

    topicsCalculated++;
    if (!lastReviewedStr) {
      // Default retention if never reviewed
      totalRetention += (quizScores[topicKey]?.attempts > 0 ? 0.3 : 0.6);
    } else {
      const elapsedMs = Date.now() - new Date(lastReviewedStr).getTime();
      const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
      const halfLife = intervalDays * 1.5;
      const retention = Math.pow(0.5, elapsedDays / halfLife);
      totalRetention += retention;
    }
  });

  const overallRetentionEstimate = topicsCalculated > 0 
    ? Math.round((totalRetention / topicsCalculated) * 100) 
    : 80;

  return {
    streak: currentStreak,
    longestStreak,
    masteredTopics,
    weakestTopics,
    weeklyCompletionRate,
    monthlyCompletionRate,
    averageQuizImprovement,
    overallRetentionEstimate,
    totalRevisions: history.filter(h => h.completed || h.status === 'completed').length,
    revisionLevel: Math.floor(history.filter(h => h.completed || h.status === 'completed').length / 5) + 1
  };
}

function toDateKey(date) {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
