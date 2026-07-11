import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../');
const DATA_DIR = path.join(ROOT, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Memory cache for the threshold map
let thresholdCache = null;
let lastComputed = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

let userScoresCache = null;
let lastScoresComputed = 0;

async function computeUserScores() {
    const now = Date.now();
    if (userScoresCache && (now - lastScoresComputed <= CACHE_TTL_MS)) {
        return userScoresCache;
    }
    try {
        const raw = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(raw || '[]');
        
        // We will assign a deterministic mock score for the purpose of the benchmark
        // based on the length of their email or a random seed, just to have distribution
        // If there is an actual 'score' field, we'd use it.
        userScoresCache = users.map(u => ({
            id: u.id,
            // Simple deterministic mock score calculation based on id to simulate realistic data
            score: (u.id.charCodeAt(0) * 10) + (u.name ? u.name.length * 5 : 0) + 100
        }));
        lastScoresComputed = now;
        return userScoresCache;
    } catch (err) {
        console.error('Failed to compute user scores:', err);
        return userScoresCache || [];
    }
}

export async function computeGlobalThresholds() {
    const scoresData = await computeUserScores();
    const scores = scoresData.map(s => s.score).sort((a, b) => a - b);
    const totalEligible = scores.length;

    // Minimum data threshold
    if (totalEligible < 5) {
        return {
            insufficientData: true,
            totalUsers: totalEligible,
            thresholds: {}
        };
    }

    // Compute thresholds at various percentiles
    const getScoreAtPercentile = (p) => {
        const index = Math.ceil((p / 100) * totalEligible) - 1;
        return scores[Math.max(0, index)];
    };

    return {
        insufficientData: false,
        totalUsers: totalEligible,
        thresholds: {
            "top_1%": getScoreAtPercentile(99),
            "top_5%": getScoreAtPercentile(95),
            "top_10%": getScoreAtPercentile(90),
            "top_25%": getScoreAtPercentile(75),
            "top_50%": getScoreAtPercentile(50)
        }
    };
}

export async function getUserBenchmark(userId) {
    const now = Date.now();
    
    // Refresh cache if stale or null
    if (!thresholdCache || (now - lastComputed > CACHE_TTL_MS)) {
        thresholdCache = await computeGlobalThresholds();
        lastComputed = now;
    }

    const scoresData = await computeUserScores();
    const userRecord = scoresData.find(u => u.id === userId);
    const userScore = userRecord ? userRecord.score : 0;

    if (userScore === 0) {
        return {
            userScore: 0,
            percentileRank: 0,
            badgeMessage: "New Contributor",
            nextMilestone: thresholdCache.insufficientData ? null : thresholdCache.thresholds["top_50%"]
        };
    }

    if (thresholdCache.insufficientData) {
        return {
            userScore,
            percentileRank: null,
            badgeMessage: "Not enough community data",
            nextMilestone: null
        };
    }

    // Calculate specific percentile: (Number of users with strictly lower score / Total eligible) * 100
    const lowerScoresCount = scoresData.filter(s => s.score < userScore).length;
    const percentileRank = (lowerScoresCount / thresholdCache.totalUsers) * 100;

    let badgeMessage = "Top 50%+ Contributor";
    let nextMilestone = null;

    if (percentileRank >= 99) {
        badgeMessage = "Top 1% Elite Contributor";
        nextMilestone = null; // Maxed out
    } else if (percentileRank >= 95) {
        badgeMessage = "Top 5% Expert Contributor";
        nextMilestone = thresholdCache.thresholds["top_1%"];
    } else if (percentileRank >= 90) {
        badgeMessage = "Top 10% Senior Contributor";
        nextMilestone = thresholdCache.thresholds["top_5%"];
    } else if (percentileRank >= 75) {
        badgeMessage = "Top 25% Active Contributor";
        nextMilestone = thresholdCache.thresholds["top_10%"];
    } else {
        nextMilestone = thresholdCache.thresholds["top_25%"];
    }

    return {
        userScore,
        percentileRank: parseFloat(percentileRank.toFixed(1)),
        badgeMessage,
        nextMilestone
    };
}
