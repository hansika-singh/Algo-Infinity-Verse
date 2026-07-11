// modules/revisionScheduler.js

import { defaultRevisionEngine } from './revisionEngine.js';
import { calculateStats } from './revisionStats.js';

export const DEFAULT_INTERVALS = [1, 3, 7, 14, 30];
export const PRIORITY_LEVELS = {
  high: 'high',
  medium: 'medium',
  low: 'low'
};

export function toDateKey(date) {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeProgress(progress = {}) {
  const safeProgress = progress || {};
  const revisionSchedule = safeProgress.revisionSchedule || {};
  const revisionCalendar = safeProgress.revisionCalendar || {};
  return {
    ...safeProgress,
    revisionSchedule,
    revisionCalendar: {
      tasks: Array.isArray(revisionCalendar.tasks) ? revisionCalendar.tasks : [],
      history: Array.isArray(revisionCalendar.history) ? revisionCalendar.history : [],
      streak: Number(revisionCalendar.streak) || 0,
      longestStreak: Number(revisionCalendar.longestStreak) || 0,
      missedDays: Number(revisionCalendar.missedDays) || 0,
      stats: revisionCalendar.stats || {}
    }
  };
}

export function getTopicName(topicKey) {
  const topicMeta = (globalThis.dsaTopics || []).find(topic => topic.name?.toLowerCase() === topicKey || topic.id?.toString() === topicKey);
  return topicMeta?.name || topicKey;
}

export function getTopicDifficulty(topicKey) {
  const topicMeta = (globalThis.dsaTopics || []).find(topic => topic.name?.toLowerCase() === topicKey || topic.id?.toString() === topicKey);
  return topicMeta?.difficulty || 'Medium';
}

export function getTopicProblemCount(topicKey) {
  if (!Array.isArray(globalThis.practiceProblems)) return 0;
  return globalThis.practiceProblems.filter(problem => problem.category?.toLowerCase() === topicKey.toLowerCase()).length;
}

export function buildReason(progress, topicKey) {
  const quizScore = progress.quizScores?.[topicKey]?.bestScore || 0;
  const completedCount = progress.completedProblems?.length || 0;
  const topicProblems = getTopicProblemCount(topicKey);
  if (quizScore < 60) return ' Low quiz accuracy suggests a quick review is helpful.';
  if (topicProblems > 0 && completedCount < topicProblems) return '📚 You have prior learning history for this topic and should reinforce it.';
  return ' A regular review keeps this topic fresh for interviews.';
}

export function buildRevisionTasks(progress = {}) {
  const state = normalizeProgress(progress);
  const topicKeys = Object.keys(state.revisionSchedule || {}).filter(Boolean);

  const tasks = topicKeys.map((topicKey, index) => {
    const schedule = state.revisionSchedule[topicKey] || { currentStage: 0, history: [] };
    const quizScore = state.quizScores?.[topicKey]?.bestScore || 0;
    const attempted = state.quizScores?.[topicKey]?.attempts || 0;
    const weaknessScore = Math.max(0, 70 - quizScore);
    const repeatScore = Math.max(0, schedule.history?.length || 0) * 5;

    const priority = weaknessScore >= 25 || quizScore < 60 ? PRIORITY_LEVELS.high : (attempted > 0 ? PRIORITY_LEVELS.medium : PRIORITY_LEVELS.low);
    const stage = Number(schedule.currentStage) || 0;

    //  FIX: Pass configuration to handle last stage properly
    const nextReviewResult = defaultRevisionEngine.calculateNext(
      schedule, 
      {
        scorePercentage: quizScore,
        isIncorrect: false,
        difficulty: getTopicDifficulty(topicKey)
      },
      {
        passThreshold: 60,
        perfectThreshold: 90,
        markCompleteAfterLast: true, //  This will mark as complete!
        maxStages: DEFAULT_INTERVALS.length
      }
    );

    //  Check if topic is complete
    const isComplete = nextReviewResult.isComplete || false;

    return {
      id: `${topicKey}-${index}`,
      topicKey,
      topic: getTopicName(topicKey),
      difficulty: getTopicDifficulty(topicKey),
      reason: buildReason(state, topicKey),
      duration: Math.max(10, 20 - (index * 2)),
      priority,
      completed: false,
      intervalDays: nextReviewResult.intervalDays,
      nextReviewDate: nextReviewResult.nextReviewDate,
      score: quizScore,
      scoreValue: weaknessScore + repeatScore + (index * 2),
      isComplete: isComplete, // New field to track completion
      message: nextReviewResult.message || '' //  Add message for feedback
    };
  }).sort((left, right) => right.scoreValue - left.scoreValue);

  const calculatedStats = calculateStats(state);
  const todayKey = toDateKey(new Date());

  //  Count completed topics
  const completedTopics = tasks.filter(task => task.isComplete).length;
  const totalTopics = tasks.length;
  const completionRate = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const calendar = {
    ...state.revisionCalendar,
    tasks,
    stats: {
      pending: tasks.filter(task => !task.completed && !task.isComplete).length,
      completed: tasks.filter(task => task.completed).length,
      upcoming: tasks.filter(task => !task.completed && !task.isComplete).length,
      completedTopics: completedTopics,
      totalTopics: totalTopics,
      completionRate: completionRate,
      weeklyCompletion: calculatedStats.weeklyCompletionRate,
      monthlyCompletion: calculatedStats.monthlyCompletionRate,
      averageConsistency: calculatedStats.overallRetentionEstimate
    },
    todayKey
  };

  return { tasks, revisionCalendar: calendar };
}

export function toggleRevisionTaskCompletion(taskId, progress = {}) {
  const state = normalizeProgress(progress);
  const { tasks, revisionCalendar } = buildRevisionTasks(state);
  const targetTask = tasks.find(task => task.id === taskId);
  if (!targetTask) return state;

  const updatedTask = { ...targetTask, completed: !targetTask.completed };
  const updatedTasks = tasks.map(task => task.id === taskId ? updatedTask : task);
  const now = new Date();
  const dayKey = toDateKey(now);

  const revisionSchedule = { ...(state.revisionSchedule || {}) };
  const currentSchedule = revisionSchedule[targetTask.topicKey] || { currentStage: 0, history: [] };

  //  FIX: Pass config to calculateNext
  const nextReviewResult = defaultRevisionEngine.calculateNext(
    currentSchedule,
    {
      scorePercentage: updatedTask.completed ? 100 : 0,
      isIncorrect: !updatedTask.completed,
      difficulty: targetTask.difficulty
    },
    {
      passThreshold: 60,
      perfectThreshold: 90,
      markCompleteAfterLast: true,
      maxStages: DEFAULT_INTERVALS.length
    }
  );

  revisionSchedule[targetTask.topicKey] = {
    ...currentSchedule,
    currentStage: nextReviewResult.nextStage,
    nextReviewDate: updatedTask.completed ? nextReviewResult.nextReviewDate : null,
    isComplete: nextReviewResult.isComplete || false, // ✅ Store completion status
    history: [
      ...(currentSchedule.history || []),
      {
        reviewedAt: now.toISOString(),
        stageCompleted: nextReviewResult.nextStage,
        daysCalculated: nextReviewResult.intervalDays,
        nextReviewDueDate: updatedTask.completed ? nextReviewResult.nextReviewDate : null,
        isComplete: nextReviewResult.isComplete || false
      }
    ]
  };

  const nextHistory = [
    ...(state.revisionCalendar?.history || []),
    { dayKey, completed: updatedTask.completed, taskId }
  ];

  const nextState = {
    ...state,
    revisionSchedule,
    revisionCalendar: {
      ...state.revisionCalendar,
      tasks: updatedTasks,
      history: nextHistory.slice(-120),
      streak: state.revisionCalendar.streak,
      longestStreak: state.revisionCalendar.longestStreak,
      todayKey: dayKey
    }
  };

  // Re-calculate stats to update streak and rates
  const calculatedStats = calculateStats(nextState);
  nextState.reviewStreak = calculatedStats.streak;
  nextState.revisionCalendar.streak = calculatedStats.streak;
  nextState.revisionCalendar.longestStreak = calculatedStats.longestStreak;
  
  //  Updated stats with completion tracking
  const completedTopics = updatedTasks.filter(task => task.isComplete).length;
  const totalTopics = updatedTasks.length;
  
  nextState.revisionCalendar.stats = {
    pending: updatedTasks.filter(task => !task.completed && !task.isComplete).length,
    completed: updatedTasks.filter(task => task.completed).length,
    upcoming: updatedTasks.filter(task => !task.completed && !task.isComplete).length,
    completedTopics: completedTopics,
    totalTopics: totalTopics,
    completionRate: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
    weeklyCompletion: calculatedStats.weeklyCompletionRate,
    monthlyCompletion: calculatedStats.monthlyCompletionRate,
    averageConsistency: calculatedStats.overallRetentionEstimate
  };

  const xpGained = updatedTask.completed ? 40 + Math.min(20, targetTask.score / 10) : 0;
  nextState.xp = (Number(nextState.xp) || 0) + xpGained;

  return nextState;
}