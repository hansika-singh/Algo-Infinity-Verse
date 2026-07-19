import fs from 'fs/promises';
import path from 'path';
import { getSession, sendJson } from '../utils/helpers.js';
import { initializeFirebase } from '../../firebase.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PERSONALITY_CACHE_TTL = 60 * 60 * 1000;

const cache = {
  data: {},
  timestamp: {},
};

function isCacheValid(userId) {
  return cache.data[userId] && Date.now() - cache.timestamp[userId] < PERSONALITY_CACHE_TTL;
}

function getCacheStats() {
  return {
    size: Object.keys(cache.data).length,
    timestamp: new Date().toISOString(),
  };
}

function validateSession(session) {
  if (!session || !session.sub) {
    throw new Error('Unauthorized. Please login.');
  }
  return session;
}

function analyzeLearningStyle(metrics) {
  const patterns = {
    visual: 0,
    auditory: 0,
    kinesthetic: 0,
  };

  if (metrics.videoCount > metrics.readingCount) {
    patterns.visual += 2;
  }
  if (metrics.readingCount > metrics.videoCount) {
    patterns.auditory += 2;
  }
  if (metrics.practiceCount > metrics.readingCount && metrics.practiceCount > metrics.videoCount) {
    patterns.kinesthetic += 2;
  }

  const total = patterns.visual + patterns.auditory + patterns.kinesthetic;
  if (total === 0) {
    return { primary: 'balanced', scores: { visual: 33, auditory: 33, kinesthetic: 34 } };
  }

  const primary = Object.keys(patterns).reduce((a, b) => (patterns[a] > patterns[b] ? a : b));

  return {
    primary,
    scores: {
      visual: Math.round((patterns.visual / total) * 100),
      auditory: Math.round((patterns.auditory / total) * 100),
      kinesthetic: Math.round((patterns.kinesthetic / total) * 100),
    },
  };
}

function analyzeProblemSolving(metrics) {
  const systematicScore = metrics.systematicApproach || 0;
  const intuitiveScore = metrics.intuitiveApproach || 0;

  const total = systematicScore + intuitiveScore;
  if (total === 0) {
    return { primary: 'balanced', systematic: 50, intuitive: 50 };
  }

  return {
    primary: systematicScore > intuitiveScore ? 'systematic' : 'intuitive',
    systematic: Math.round((systematicScore / total) * 100),
    intuitive: Math.round((intuitiveScore / total) * 100),
  };
}

function analyzeMotivation(metrics) {
  const triggers = [];

  if (metrics.challengeMotivation > 70) {
    triggers.push('challenge');
  }
  if (metrics.curiosityMotivation > 70) {
    triggers.push('curiosity');
  }
  if (metrics.careerMotivation > 70) {
    triggers.push('career');
  }
  if (metrics.socialMotivation > 70) {
    triggers.push('social');
  }

  if (triggers.length === 0) {
    triggers.push('balanced');
  }

  return { primary: triggers[0], all: triggers };
}

function analyzeStressResponse(metrics) {
  const responses = {
    persistent: 0,
    avoidant: 0,
    seekHelp: 0,
  };

  if (metrics.difficultProblemsAttempted > metrics.difficultProblemsSkipped) {
    responses.persistent += 2;
  }
  if (metrics.helpRequests > metrics.independentAttempts * 0.3) {
    responses.seekHelp += 2;
  }
  if (metrics.difficultProblemsSkipped > metrics.difficultProblemsAttempted) {
    responses.avoidant += 2;
  }

  const total = responses.persistent + responses.avoidant + responses.seekHelp;
  if (total === 0) {
    return { primary: 'balanced' };
  }

  const primary = Object.keys(responses).reduce((a, b) => (responses[a] > responses[b] ? a : b));
  return { primary };
}

function analyzeCollaboration(metrics) {
  const soloScore = metrics.soloWorkCount || 0;
  const teamScore = metrics.teamWorkCount || 0;

  const total = soloScore + teamScore;
  if (total === 0) {
    return { primary: 'balanced', solo: 50, team: 50 };
  }

  return {
    primary: soloScore > teamScore ? 'solo' : 'team',
    solo: Math.round((soloScore / total) * 100),
    team: Math.round((teamScore / total) * 100),
  };
}

function analyzeKnowledgeRetention(metrics) {
  const retentionScore = metrics.retentionScore || 70;
  const recallScore = metrics.recallScore || 70;

  const average = (retentionScore + recallScore) / 2;

  let level = 'average';
  if (average >= 85) level = 'excellent';
  else if (average >= 70) level = 'good';
  else if (average >= 50) level = 'average';
  else level = 'needs_improvement';

  return {
    level,
    score: Math.round(average),
    retention: Math.round(retentionScore),
    recall: Math.round(recallScore),
  };
}

function analyzePeakPerformance(metrics) {
  const hours = metrics.activityHours || {};
  const sorted = Object.entries(hours).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return { peakHour: 'unknown', confidence: 0 };
  }

  return {
    peakHour: sorted[0][0],
    confidence: Math.round((sorted[0][1] / Object.values(hours).reduce((a, b) => a + b, 0)) * 100),
  };
}

function generatePersonalitySummary(analysis) {
  const parts = [];

  parts.push(`You are a ${analysis.learningStyle.primary} learner`);
  parts.push(`with a ${analysis.problemSolving.primary} problem-solving approach`);
  parts.push(`and ${analysis.motivation.primary} motivation style.`);

  if (analysis.collaboration.primary === 'solo') {
    parts.push('You prefer working independently.');
  } else {
    parts.push('You thrive in collaborative environments.');
  }

  return parts.join(' ');
}

function generateRecommendations(analysis) {
  const recommendations = [];

  if (analysis.learningStyle.primary === 'visual') {
    recommendations.push('Use video tutorials and diagrams for better understanding');
  } else if (analysis.learningStyle.primary === 'auditory') {
    recommendations.push('Listen to coding podcasts and explain concepts aloud');
  } else if (analysis.learningStyle.primary === 'kinesthetic') {
    recommendations.push('Practice coding actively through projects and exercises');
  }

  if (analysis.problemSolving.primary === 'systematic') {
    recommendations.push('Break down problems into smaller steps and follow structured approaches');
  } else {
    recommendations.push('Trust your intuition and experiment with different solutions');
  }

  if (analysis.motivation.primary === 'challenge') {
    recommendations.push('Set challenging goals to stay motivated');
  } else if (analysis.motivation.primary === 'curiosity') {
    recommendations.push('Explore new topics and technologies to maintain interest');
  } else if (analysis.motivation.primary === 'career') {
    recommendations.push('Focus on industry-relevant skills and career growth');
  }

  return recommendations.slice(0, 5);
}

async function fetchUserData(userId) {
  try {
    const db = initializeFirebase();
    if (db) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        return userDoc.data();
      }
      return null;
    }

    const raw = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(raw || '[]');
    return users.find((u) => u.id === userId) || null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

async function analyzePersonality(userId) {
  try {
    const userData = await fetchUserData(userId);

    if (!userData) {
      throw new Error('User data not found');
    }

    const metrics = {
      videoCount: userData.videoCount || 0,
      readingCount: userData.readingCount || 0,
      practiceCount: userData.practiceCount || 0,
      systematicApproach: userData.systematicApproach || 0,
      intuitiveApproach: userData.intuitiveApproach || 0,
      challengeMotivation: userData.challengeMotivation || 0,
      curiosityMotivation: userData.curiosityMotivation || 0,
      careerMotivation: userData.careerMotivation || 0,
      socialMotivation: userData.socialMotivation || 0,
      difficultProblemsAttempted: userData.difficultProblemsAttempted || 0,
      difficultProblemsSkipped: userData.difficultProblemsSkipped || 0,
      helpRequests: userData.helpRequests || 0,
      independentAttempts: userData.independentAttempts || 0,
      soloWorkCount: userData.soloWorkCount || 0,
      teamWorkCount: userData.teamWorkCount || 0,
      retentionScore: userData.retentionScore || 0,
      recallScore: userData.recallScore || 0,
      activityHours: userData.activityHours || {},
    };

    const learningStyle = analyzeLearningStyle(metrics);
    const problemSolving = analyzeProblemSolving(metrics);
    const motivation = analyzeMotivation(metrics);
    const stressResponse = analyzeStressResponse(metrics);
    const collaboration = analyzeCollaboration(metrics);
    const knowledgeRetention = analyzeKnowledgeRetention(metrics);
    const peakPerformance = analyzePeakPerformance(metrics);

    const result = {
      userId,
      learningStyle,
      problemSolving,
      motivation,
      stressResponse,
      collaboration,
      knowledgeRetention,
      peakPerformance,
      summary: generatePersonalitySummary({
        learningStyle,
        problemSolving,
        motivation,
        collaboration,
      }),
      recommendations: generateRecommendations({
        learningStyle,
        problemSolving,
        motivation,
      }),
      timestamp: new Date().toISOString(),
    };

    return result;
  } catch (error) {
    console.error('Error analyzing personality:', error);
    throw error;
  }
}

export async function handleUserPersonality(req, res) {
  try {
    const session = getSession(req);
    const userId = validateSession(session).sub;

    if (isCacheValid(userId)) {
      return sendJson(res, 200, {
        ...cache.data[userId],
        cached: true,
      });
    }

    const result = await analyzePersonality(userId);

    cache.data[userId] = result;
    cache.timestamp[userId] = Date.now();

    return sendJson(res, 200, {
      ...result,
      cached: false,
    });
  } catch (error) {
    console.error('Error in personality handler:', error);

    if (error.message === 'Unauthorized. Please login.') {
      return sendJson(res, 401, { error: error.message });
    }

    if (error.message === 'User data not found') {
      return sendJson(res, 404, { error: 'User data not found. Please complete your profile.' });
    }

    return sendJson(res, 500, {
      error: 'Failed to analyze personality',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

export async function handlePersonalityHistory(req, res) {
  try {
    const session = getSession(req);
    const userId = validateSession(session).sub;

    const db = initializeFirebase();
    let history = [];

    if (db) {
      const snapshot = await db
        .collection('personalityHistory')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();

      snapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() });
      });
    } else {
      const historyFile = path.join(DATA_DIR, 'personality_history.json');
      try {
        const raw = await fs.readFile(historyFile, 'utf8');
        const allHistory = JSON.parse(raw || '[]');
        history = allHistory
          .filter((h) => h.userId === userId)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 10);
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
    }

    return sendJson(res, 200, { history });
  } catch (error) {
    console.error('Error fetching personality history:', error);
    return sendJson(res, 500, { error: 'Failed to fetch personality history' });
  }
}

export async function handlePersonalityRefresh(req, res) {
  try {
    const session = getSession(req);
    const userId = validateSession(session).sub;

    delete cache.data[userId];
    delete cache.timestamp[userId];

    const result = await analyzePersonality(userId);

    cache.data[userId] = result;
    cache.timestamp[userId] = Date.now();

    return sendJson(res, 200, {
      ...result,
      refreshed: true,
    });
  } catch (error) {
    console.error('Error refreshing personality:', error);
    return sendJson(res, 500, { error: 'Failed to refresh personality analysis' });
  }
}

export async function handlePersonalitySummary(req, res) {
  try {
    const session = getSession(req);
    const userId = validateSession(session).sub;

    const result = await analyzePersonality(userId);

    return sendJson(res, 200, {
      summary: result.summary,
      learningStyle: result.learningStyle.primary,
      problemSolving: result.problemSolving.primary,
      motivation: result.motivation.primary,
      collaboration: result.collaboration.primary,
      knowledgeRetention: result.knowledgeRetention.level,
    });
  } catch (error) {
    console.error('Error getting personality summary:', error);
    return sendJson(res, 500, { error: 'Failed to get personality summary' });
  }
}

function invalidateCache() {
  cache.data = {};
  cache.timestamp = {};
  return { success: true };
}

export { analyzePersonality, invalidateCache, getCacheStats };
