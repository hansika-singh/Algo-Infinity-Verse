import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const CONFIG = {
  CACHE_TTL: 15 * 60 * 1000,
  CACHE_VERSION: '1.0.0',
  SCORE_DECAY_DAYS: 30,
  WEIGHTS: {
    feedback: 10,
    memoryCards: 5,
    reviews: 8,
    contributions: 15,
    streak: 20,
  },
  THRESHOLDS: {
    top: 90,
    aboveAverage: 75,
    average: 50,
    belowAverage: 25,
  },
};

const cache = {
  data: null,
  timestamp: 0,
  version: CONFIG.CACHE_VERSION,
  hits: 0,
  misses: 0,
};

function isCacheValid() {
  return (
    cache.data &&
    cache.version === CONFIG.CACHE_VERSION &&
    Date.now() - cache.timestamp < CONFIG.CACHE_TTL
  );
}

function getCacheStats() {
  return {
    hits: cache.hits,
    misses: cache.misses,
    ratio:
      cache.hits + cache.misses > 0
        ? ((cache.hits / (cache.hits + cache.misses)) * 100).toFixed(2) + '%'
        : '0%',
    size: cache.data ? cache.data.length : 0,
    timestamp: cache.timestamp ? new Date(cache.timestamp).toISOString() : null,
  };
}

function validateScore(score) {
  if (score === null || score === undefined) return false;
  if (typeof score !== 'number') return false;
  if (isNaN(score) || !isFinite(score)) return false;
  if (score < 0) return false;
  return true;
}

function calculateRealScore(user) {
  let score = 0;

  if (user.feedback && Array.isArray(user.feedback)) {
    score += user.feedback.length * CONFIG.WEIGHTS.feedback;
  }

  if (user.memoryCards && Array.isArray(user.memoryCards)) {
    score += user.memoryCards.length * CONFIG.WEIGHTS.memoryCards;
  }

  if (user.reviews && Array.isArray(user.reviews)) {
    score += user.reviews.length * CONFIG.WEIGHTS.reviews;
  }

  if (user.contributions && typeof user.contributions === 'number') {
    score += user.contributions * CONFIG.WEIGHTS.contributions;
  }

  if (user.streak && typeof user.streak === 'number') {
    score += user.streak * CONFIG.WEIGHTS.streak;
  }

  const now = Date.now();
  if (user.lastActivity) {
    const daysSince = (now - new Date(user.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > CONFIG.SCORE_DECAY_DAYS) {
      const decayFactor = Math.max(0, 1 - (daysSince - CONFIG.SCORE_DECAY_DAYS) / 365);
      score = score * decayFactor;
    }
  }

  return Math.round(score);
}

function calculatePercentile(scores, userScore) {
  if (!scores || scores.length === 0) return 0;

  const sorted = [...scores].sort((a, b) => a - b);
  const index = sorted.findIndex((s) => s >= userScore);

  if (index === -1) return 100;
  return Math.round((index / sorted.length) * 100);
}

function calculateScoreDistribution(scores) {
  if (!scores || scores.length === 0) {
    return { low: 0, medium: 0, high: 0, top: 0 };
  }

  const distribution = { low: 0, medium: 0, high: 0, top: 0 };

  scores.forEach((score) => {
    if (score >= CONFIG.THRESHOLDS.top) distribution.top++;
    else if (score >= CONFIG.THRESHOLDS.aboveAverage) distribution.high++;
    else if (score >= CONFIG.THRESHOLDS.average) distribution.medium++;
    else distribution.low++;
  });

  return distribution;
}

function getTopContributors(users, limit = 10) {
  if (!users || users.length === 0) return [];

  return [...users].sort((a, b) => b.score - a.score).slice(0, Math.min(limit, 100));
}

async function readUsersFile() {
  try {
    const raw = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(raw || '[]');

    if (!Array.isArray(users)) {
      throw new Error('Invalid users data: expected array');
    }

    return users;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function computeUserScores(force = false) {
  try {
    if (!force && isCacheValid()) {
      cache.hits++;
      return cache.data;
    }

    cache.misses++;

    const users = await readUsersFile();

    if (!users || users.length === 0) {
      const result = { users: [], insufficientData: true };
      cache.data = result;
      cache.timestamp = Date.now();
      return result;
    }

    const scoredUsers = users
      .map((user) => {
        const score = calculateRealScore(user);
        if (!validateScore(score)) {
          return null;
        }
        return { ...user, score };
      })
      .filter((user) => user !== null);

    const sortedUsers = [...scoredUsers].sort((a, b) => b.score - a.score);

    const result = {
      users: sortedUsers,
      insufficientData: sortedUsers.length < 3,
      totalUsers: sortedUsers.length,
      scoreDistribution: calculateScoreDistribution(sortedUsers.map((u) => u.score)),
      topScore: sortedUsers.length > 0 ? sortedUsers[0].score : 0,
      averageScore:
        sortedUsers.length > 0
          ? Math.round(sortedUsers.reduce((sum, u) => sum + u.score, 0) / sortedUsers.length)
          : 0,
    };

    cache.data = result;
    cache.timestamp = Date.now();
    cache.version = CONFIG.CACHE_VERSION;

    return result;
  } catch (error) {
    console.error('Error computing user scores:', error);
    throw error;
  }
}

async function getBenchmark(userId) {
  try {
    const data = await computeUserScores();

    if (data.insufficientData || !data.users || data.users.length === 0) {
      return {
        userId,
        percentile: 0,
        score: 0,
        totalUsers: 0,
        rank: 0,
        insufficientData: true,
      };
    }

    const user = data.users.find((u) => u.id === userId);

    if (!user) {
      return {
        userId,
        percentile: 0,
        score: 0,
        totalUsers: data.totalUsers,
        rank: 0,
        insufficientData: false,
        userNotFound: true,
      };
    }

    const scores = data.users.map((u) => u.score);
    const percentile = calculatePercentile(scores, user.score);
    const rank = data.users.findIndex((u) => u.id === userId) + 1;

    const totalUsers = data.totalUsers;

    let tier = 'bronze';
    if (percentile >= CONFIG.THRESHOLDS.top) tier = 'diamond';
    else if (percentile >= CONFIG.THRESHOLDS.aboveAverage) tier = 'gold';
    else if (percentile >= CONFIG.THRESHOLDS.average) tier = 'silver';

    return {
      userId,
      score: user.score,
      percentile,
      rank,
      totalUsers,
      tier,
      insufficientData: false,
    };
  } catch (error) {
    console.error('Error getting benchmark:', error);
    throw error;
  }
}

async function getBatchBenchmark(userIds) {
  try {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('User IDs array is required');
    }

    if (userIds.length > 100) {
      throw new Error('Maximum 100 user IDs per batch request');
    }

    const results = await Promise.all(userIds.map((id) => getBenchmark(id)));

    return results;
  } catch (error) {
    console.error('Error getting batch benchmark:', error);
    throw error;
  }
}

async function getTopUsers(limit = 10) {
  try {
    const data = await computeUserScores();

    if (data.insufficientData || !data.users || data.users.length === 0) {
      return [];
    }

    return getTopContributors(data.users, limit);
  } catch (error) {
    console.error('Error getting top users:', error);
    throw error;
  }
}

async function getScoreDistribution() {
  try {
    const data = await computeUserScores();

    if (data.insufficientData || !data.users || data.users.length === 0) {
      return { low: 0, medium: 0, high: 0, top: 0 };
    }

    return data.scoreDistribution;
  } catch (error) {
    console.error('Error getting score distribution:', error);
    throw error;
  }
}

function invalidateCache() {
  cache.data = null;
  cache.timestamp = 0;
  cache.hits = 0;
  cache.misses = 0;
  console.log('Cache invalidated successfully');
  return { success: true };
}

function getConfig() {
  return { ...CONFIG };
}

function updateConfig(newConfig) {
  Object.assign(CONFIG, newConfig);
  invalidateCache();
  return { ...CONFIG };
}

export {
  computeUserScores,
  getBenchmark,
  getBatchBenchmark,
  getTopUsers,
  getScoreDistribution,
  getCacheStats,
  invalidateCache,
  getConfig,
  updateConfig,
  CONFIG,
};
