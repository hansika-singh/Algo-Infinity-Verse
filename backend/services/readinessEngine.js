import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const CONFIG = {
  WEIGHTS: {
    easy: 1,
    medium: 2,
    hard: 3,
    consistency: 2,
    recency: 1.5,
    confidence: 1.2,
    peerComparison: 1,
  },
  THRESHOLDS: {
    beginner: 40,
    intermediate: 60,
    advanced: 80,
    expert: 90,
  },
  DECAY: {
    daysToDecay: 30,
    decayRate: 0.05,
  },
  CACHE_TTL: 5 * 60 * 1000,
  MAX_TOPICS: 50,
  DEFAULT_GOALS: {
    problemsPerWeek: 5,
    topicsPerMonth: 2,
    practiceHoursPerDay: 1,
  },
};

const cache = {
  data: null,
  timestamp: 0,
  hits: 0,
  misses: 0,
};

function isCacheValid() {
  return cache.data && Date.now() - cache.timestamp < CONFIG.CACHE_TTL;
}

function getCacheStats() {
  return {
    hits: cache.hits,
    misses: cache.misses,
    ratio:
      cache.hits + cache.misses > 0
        ? ((cache.hits / (cache.hits + cache.misses)) * 100).toFixed(2) + '%'
        : '0%',
  };
}

function validateMetrics(metrics) {
  if (!metrics || typeof metrics !== 'object') {
    return { valid: false, errors: ['Metrics object is required'] };
  }

  const validations = [
    { key: 'easySolved', type: 'number', min: 0 },
    { key: 'mediumSolved', type: 'number', min: 0 },
    { key: 'hardSolved', type: 'number', min: 0 },
    { key: 'streak', type: 'number', min: 0 },
    { key: 'completionRate', type: 'number', min: 0, max: 100 },
    { key: 'topicsCovered', type: 'array' },
    { key: 'lastActivity', type: 'string' },
  ];

  const errors = [];
  for (const v of validations) {
    if (metrics[v.key] === undefined || metrics[v.key] === null) {
      errors.push(`${v.key} is required`);
      continue;
    }

    if (v.type === 'number') {
      if (typeof metrics[v.key] !== 'number' || isNaN(metrics[v.key])) {
        errors.push(`${v.key} must be a valid number`);
      } else if (v.min !== undefined && metrics[v.key] < v.min) {
        errors.push(`${v.key} must be at least ${v.min}`);
      } else if (v.max !== undefined && metrics[v.key] > v.max) {
        errors.push(`${v.key} must be at most ${v.max}`);
      }
    }

    if (v.type === 'array' && !Array.isArray(metrics[v.key])) {
      errors.push(`${v.key} must be an array`);
    }

    if (v.type === 'string' && typeof metrics[v.key] !== 'string') {
      errors.push(`${v.key} must be a string`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function sanitizeTopics(topics) {
  if (!Array.isArray(topics)) return [];
  return topics
    .filter((t) => t && typeof t === 'string' && t.trim().length > 0)
    .map((t) => t.trim().toLowerCase())
    .slice(0, CONFIG.MAX_TOPICS);
}

function calculateWeightedScore(metrics) {
  const easyScore = (metrics.easySolved || 0) * CONFIG.WEIGHTS.easy;
  const mediumScore = (metrics.mediumSolved || 0) * CONFIG.WEIGHTS.medium;
  const hardScore = (metrics.hardSolved || 0) * CONFIG.WEIGHTS.hard;

  return easyScore + mediumScore + hardScore;
}

function calculateConsistencyScore(metrics) {
  const streak = metrics.streak || 0;
  const completionRate = metrics.completionRate || 0;
  const regularity = metrics.regularity || 0.5;

  const streakScore = Math.min(streak / 30, 1) * 100;
  const completionScore = completionRate;
  const regularityScore = regularity * 100;

  return (
    (streakScore * 0.4 + completionScore * 0.4 + regularityScore * 0.2) * CONFIG.WEIGHTS.consistency
  );
}

function calculateRecencyScore(metrics) {
  if (!metrics.lastActivity) return 0;

  const daysSince = (Date.now() - new Date(metrics.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 0) return 100;

  const decay = Math.exp(-CONFIG.DECAY.decayRate * daysSince);
  return Math.max(0, 100 * decay) * CONFIG.WEIGHTS.recency;
}

function calculateConfidenceScore(metrics) {
  const confidence = metrics.confidence || 0.5;
  return confidence * 100 * CONFIG.WEIGHTS.confidence;
}

function calculateTopicCoverage(metrics) {
  const topics = sanitizeTopics(metrics.topicsCovered || []);
  const totalTopics = metrics.totalTopics || 50;

  if (totalTopics === 0) return 0;

  const coveredCount = topics.length;
  return Math.min((coveredCount / totalTopics) * 100, 100);
}

function calculateOverallScore(metrics) {
  const weightedScore = calculateWeightedScore(metrics);
  const consistencyScore = calculateConsistencyScore(metrics);
  const recencyScore = calculateRecencyScore(metrics);
  const confidenceScore = calculateConfidenceScore(metrics);
  const topicCoverage = calculateTopicCoverage(metrics);

  const totalWeight = Object.values(CONFIG.WEIGHTS).reduce((a, b) => a + b, 0);

  const scores = {
    weighted: weightedScore * CONFIG.WEIGHTS.easy,
    consistency: consistencyScore,
    recency: recencyScore,
    confidence: confidenceScore,
    topicCoverage: topicCoverage,
  };

  const overall = Object.values(scores).reduce((a, b) => a + b, 0) / totalWeight;

  return Math.min(Math.max(overall, 0), 100);
}

function getReadinessLevel(score) {
  if (score >= CONFIG.THRESHOLDS.expert) return 'expert';
  if (score >= CONFIG.THRESHOLDS.advanced) return 'advanced';
  if (score >= CONFIG.THRESHOLDS.intermediate) return 'intermediate';
  if (score >= CONFIG.THRESHOLDS.beginner) return 'beginner';
  return 'novice';
}

function getLearningPace(metrics) {
  const daysSince = metrics.lastActivity
    ? (Date.now() - new Date(metrics.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    : 30;

  const solvedPerDay =
    (metrics.easySolved + metrics.mediumSolved + metrics.hardSolved) / Math.max(daysSince, 1);

  if (solvedPerDay >= 3) return 'fast';
  if (solvedPerDay >= 1) return 'medium';
  return 'slow';
}

function generateSuggestions(metrics, level, pace) {
  const suggestions = [];
  const topicCoverage = calculateTopicCoverage(metrics);

  if (topicCoverage < 30) {
    suggestions.push('Focus on covering fundamental topics first');
  }

  if (metrics.hardSolved < 5) {
    suggestions.push('Practice more hard problems to build confidence');
  }

  if (metrics.mediumSolved < 10) {
    suggestions.push('Increase medium problem practice for balanced learning');
  }

  if (level === 'beginner' || level === 'novice') {
    suggestions.push('Start with easy problems to build foundation');
    suggestions.push('Follow structured learning path for basics');
  }

  if (level === 'intermediate') {
    suggestions.push('Challenge yourself with medium-hard problems');
    suggestions.push('Start preparing for interview questions');
  }

  if (level === 'advanced' || level === 'expert') {
    suggestions.push('Focus on system design and architecture');
    suggestions.push('Contribute to open source projects');
  }

  if (pace === 'fast') {
    suggestions.push('You are learning fast! Keep maintaining consistency');
    suggestions.push('Try competitive programming challenges');
  } else if (pace === 'slow') {
    suggestions.push('Increase daily practice time by 30 minutes');
    suggestions.push('Review concepts regularly for better retention');
  }

  return suggestions.slice(0, 5);
}

function generateGoals(metrics, level) {
  const baseGoals = {
    dailyProblems: 1,
    weeklyProblems: 5,
    monthlyTopics: 2,
    dailyHours: 1,
  };

  if (level === 'novice' || level === 'beginner') {
    return {
      ...baseGoals,
      dailyProblems: 1,
      weeklyProblems: 3,
      monthlyTopics: 1,
      dailyHours: 0.5,
    };
  }

  if (level === 'intermediate') {
    return {
      ...baseGoals,
      dailyProblems: 2,
      weeklyProblems: 7,
      monthlyTopics: 2,
      dailyHours: 1.5,
    };
  }

  if (level === 'advanced') {
    return {
      ...baseGoals,
      dailyProblems: 3,
      weeklyProblems: 10,
      monthlyTopics: 3,
      dailyHours: 2,
    };
  }

  if (level === 'expert') {
    return {
      ...baseGoals,
      dailyProblems: 4,
      weeklyProblems: 12,
      monthlyTopics: 4,
      dailyHours: 3,
    };
  }

  return baseGoals;
}

function getCareerTrack(track) {
  const tracks = {
    frontend: ['JavaScript', 'React', 'CSS', 'HTML', 'TypeScript'],
    backend: ['Node.js', 'Python', 'Java', 'SQL', 'API Design'],
    fullstack: ['JavaScript', 'Node.js', 'React', 'SQL', 'CSS'],
    'data-science': ['Python', 'SQL', 'Machine Learning', 'Statistics'],
    devops: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux'],
  };

  return tracks[track] || tracks['fullstack'];
}

async function readUsersFile() {
  try {
    const raw = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(raw || '[]');
    return Array.isArray(users) ? users : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function calculateReadiness(userId, metrics = null) {
  try {
    if (isCacheValid()) {
      const cached = cache.data?.find?.((u) => u.userId === userId);
      if (cached) {
        cache.hits++;
        return cached;
      }
    }

    cache.misses++;

    let userMetrics = metrics;
    if (!userMetrics) {
      const users = await readUsersFile();
      const user = users.find((u) => u.id === userId);
      userMetrics = {
        easySolved: user?.easySolved || 0,
        mediumSolved: user?.mediumSolved || 0,
        hardSolved: user?.hardSolved || 0,
        streak: user?.streak || 0,
        completionRate: user?.completionRate || 0,
        topicsCovered: user?.topicsCovered || [],
        lastActivity: user?.lastActivity || new Date().toISOString(),
        confidence: user?.confidence || 0.5,
        regularity: user?.regularity || 0.5,
        totalTopics: user?.totalTopics || 50,
      };
    }

    const validation = validateMetrics(userMetrics);
    if (!validation.valid) {
      throw new Error(`Invalid metrics: ${validation.errors.join(', ')}`);
    }

    const overallScore = calculateOverallScore(userMetrics);
    const level = getReadinessLevel(overallScore);
    const pace = getLearningPace(userMetrics);
    const topicCoverage = calculateTopicCoverage(userMetrics);
    const suggestions = generateSuggestions(userMetrics, level, pace);
    const goals = generateGoals(userMetrics, level);

    const componentScores = {
      weighted: calculateWeightedScore(userMetrics) * CONFIG.WEIGHTS.easy,
      consistency: calculateConsistencyScore(userMetrics),
      recency: calculateRecencyScore(userMetrics),
      confidence: calculateConfidenceScore(userMetrics),
      topicCoverage: topicCoverage,
    };

    const result = {
      userId,
      overallScore: Math.round(overallScore),
      level,
      pace,
      componentScores,
      topicCoverage: Math.round(topicCoverage),
      suggestions,
      goals,
      timestamp: new Date().toISOString(),
      careerTrackRecommendations: getCareerTrack(user?.careerTrack || metrics?.careerTrack || 'fullstack'),
    };

    if (!cache.data) {
      cache.data = [];
    }

    const existingIndex = cache.data.findIndex((u) => u.userId === userId);
    if (existingIndex !== -1) {
      cache.data[existingIndex] = result;
    } else {
      cache.data.push(result);
    }

    cache.timestamp = Date.now();

    return result;
  } catch (error) {
    console.error('Error calculating readiness:', error);
    throw error;
  }
}

async function getBatchReadiness(userIds) {
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new Error('User IDs array is required');
  }

  if (userIds.length > 50) {
    throw new Error('Maximum 50 user IDs per batch request');
  }

  const settled = await Promise.allSettled(userIds.map((id) => calculateReadiness(id)));

  return settled.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      userId: userIds[index],
      error: result.reason?.message || 'Failed to calculate readiness',
    };
  });
}

function invalidateCache() {
  cache.data = null;
  cache.timestamp = 0;
  cache.hits = 0;
  cache.misses = 0;
  return { success: true };
}

function getConfig() {
  return structuredClone(CONFIG);
}

function updateConfig(newConfig) {
  for (const [key, value] of Object.entries(newConfig)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && CONFIG[key]) {
      Object.assign(CONFIG[key], value);
    } else {
      CONFIG[key] = value;
    }
  }
  invalidateCache();
  return structuredClone(CONFIG);
}

export {
  calculateReadiness,
  getBatchReadiness,
  getCacheStats,
  invalidateCache,
  getConfig,
  updateConfig,
  CONFIG,
};
