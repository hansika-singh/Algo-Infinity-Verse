import { getDb } from '../../firebase.js';
import { redisAvailable, redisClient } from '../jobs/queue.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Fetches the paginated leaderboard data directly from Redis Sorted Sets.
 * Fallbacks to db/local queries if Redis is offline.
 *
 * @param {Object} params
 * @param {number} params.page
 * @param {number} params.limit
 * @returns {Promise<{leaders: Array, totalUsers: number}|null>}
 */
export async function getLeaderboardData({ page = 1, limit = 10, period = 'all' }) {
  if (!redisAvailable || !redisClient) {
    return null; // Fallback will handle
  }

  // Redis sorted sets store total XP and cannot filter by time period,
  // so skip Redis for non-all-time queries.
  if (period !== 'all') {
    return null;
  }

  try {
    const offset = (page - 1) * limit;
    const dbInstance = getDb();

    const totalUsers = await redisClient.zcard('leaderboard:xp');
    if (totalUsers === 0) {
      return { leaders: [], totalUsers: 0 };
    }

    // Retrieve user IDs and scores sorted descending
    const userIdsWithScores = await redisClient.zrevrange(
      'leaderboard:xp',
      offset,
      offset + limit - 1,
      'WITHSCORES'
    );
    if (userIdsWithScores.length === 0) {
      return { leaders: [], totalUsers };
    }

    const leaders = [];
    const userIds = [];
    const scoreMap = {};

    for (let i = 0; i < userIdsWithScores.length; i += 2) {
      const id = userIdsWithScores[i];
      const score = Number(userIdsWithScores[i + 1]);
      userIds.push(id);
      scoreMap[id] = score;
    }

    if (dbInstance) {
      // Batch fetch specific user documents from Firestore
      const refs = userIds.map((id) => dbInstance.collection('users').doc(id));
      const docs = await dbInstance.getAll(...refs);

      userIds.forEach((id, idx) => {
        const doc = docs.find((d) => d.id === id);
        const data = doc && doc.exists ? doc.data() : {};
        leaders.push({
          id,
          name: data.name || 'Learner',
          xp: scoreMap[id],
          level: Number(data.level || data.progress?.level || 1),
          avatar: data.avatar || data.progress?.avatar || '{"initial":"L","bg":"#7c3aed"}',
          rank: offset + idx + 1,
        });
      });
    } else {
      // Fallback local JSON files matching database fallback
      const DATA_DIR = path.join(process.cwd(), 'data');
      const USERS_FILE = path.join(DATA_DIR, 'users.json');
      try {
        const raw = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(raw || '[]');
        userIds.forEach((id, idx) => {
          const u = users.find((user) => user.id === id || user.email === id) || {};
          leaders.push({
            id,
            name: u.name || 'Learner',
            xp: scoreMap[id],
            level: Number(u.level || 1),
            avatar: u.avatar || '{"initial":"L","bg":"#7c3aed"}',
            rank: offset + idx + 1,
          });
        });
      } catch (e) {
        userIds.forEach((id, idx) => {
          leaders.push({
            id,
            name: 'Learner',
            xp: scoreMap[id],
            level: 1,
            avatar: '{"initial":"L","bg":"#7c3aed"}',
            rank: offset + idx + 1,
          });
        });
      }
    }

    return { leaders, totalUsers };
  } catch (error) {
    console.error('[LEADERBOARD] Redis fetch failed, triggering database fallback:', error);
    return null;
  }
}

/**
 * Rebuilds the Redis Sorted Set from the source of truth database.
 * Syncs Firestore if active, else falls back to local JSON user data.
 */
export async function syncDatabaseToRedis() {
  if (!redisAvailable || !redisClient) return;

  const db = getDb();
  if (!db) {
    // Local JSON file sync fallback
    const DATA_DIR = path.join(process.cwd(), 'data');
    const USERS_FILE = path.join(DATA_DIR, 'users.json');
    try {
      const raw = await fs.readFile(USERS_FILE, 'utf8');
      const users = JSON.parse(raw || '[]');
      const pipeline = redisClient.pipeline();
      for (const u of users) {
        const xp = Number(u.xp || u.totalXp || 0);
        pipeline.zadd('leaderboard:xp', xp, u.id || u.email);
      }
      await pipeline.exec();
      console.log(`[LEADERBOARD] Local sync completed. Synced ${users.length} users.`);
    } catch (e) {
      // ignore if local users file is missing
    }
    return;
  }

  try {
    const usersSnap = await db.collection('users').get();
    const pipeline = redisClient.pipeline();
    for (const doc of usersSnap.docs) {
      const d = doc.data();
      const xp = Number(d.xp || d.totalXp || d.progress?.xp || 0);
      pipeline.zadd('leaderboard:xp', xp, doc.id);
    }
    await pipeline.exec();
    console.log(`[LEADERBOARD] Firestore sync completed. Synced ${usersSnap.docs.length} users.`);
  } catch (err) {
    console.error('[LEADERBOARD] Firestore to Redis sync failed:', err);
  }
}
