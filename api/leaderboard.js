import { initializeFirebase } from '../firebase.js';
import { SESSION_COOKIE, verifySessionToken, parseCookies } from '../backend/utils/sessionToken.js';
import { getLeaderboardData } from '../backend/services/leaderboard.service.js';

const db = initializeFirebase();
const useFirestore = !!db;

function publicUser(user) {
  return {
    id: user.id,
    name: user.name || 'Learner',
    xp: Number(user.xp || user.progress?.xp || 0),
    level: Number(user.level || user.progress?.level || 1),
    avatar: user.avatar || user.progress?.avatar || '{"initial":"L","bg":"#7c3aed"}',
    updatedAt: user.progressUpdatedAt || user.updatedAt || user.createdAt || null,
  };
}

function isUserActiveInPeriod(user, period) {
  if (period === 'all') return true;
  const ts = user.progressUpdatedAt || user.updatedAt || user.createdAt;
  if (!ts) return false;
  const updated = new Date(ts).getTime();
  const now = Date.now();
  if (period === 'week') return now - updated <= 7 * 24 * 60 * 60 * 1000;
  if (period === 'month') return now - updated <= 30 * 24 * 60 * 60 * 1000;
  return true;
}

let cachedUsers = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function readUsers() {
  if (cachedUsers && Date.now() - cacheTime < CACHE_TTL) {
    return cachedUsers;
  }
  if (!useFirestore) return [];
  const snapshot = await db.collection('users').get();
  cachedUsers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  cacheTime = Date.now();
  return cachedUsers;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Parse period filter (passed through to data sources that support it)
    const period = req.query.period || 'all';

    // Parse pagination parameters (bounded to match the convention used by
    // other paginated endpoints, e.g. api/battles.js and api/quiz-results.js)
    const MAX_PAGE_SIZE = 50;
    const parsedPage = parseInt(req.query.page, 10);
    const page = Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1);

    const parsedLimit = parseInt(req.query.limit, 10);
    const limit = Number.isNaN(parsedLimit) ? 10 : Math.min(Math.max(parsedLimit, 1), MAX_PAGE_SIZE);
    const offset = (page - 1) * limit;

    const cookies = parseCookies(req.headers.cookie || '');
    const session = verifySessionToken(cookies[SESSION_COOKIE]);

    // Try fetching from Redis Sorted Set first (only for all-time, since Redis
    // stores total XP and cannot filter by time period)
    if (period === 'all') {
      const cachedData = await getLeaderboardData({ page, limit, period });
      if (cachedData) {
        const totalUsers = cachedData.totalUsers;
        const totalPages = Math.ceil(totalUsers / limit);
        return res.status(200).json({
          leaders: cachedData.leaders,
          currentUserId: session?.sub || null,
          pagination: {
            currentPage: page,
            totalPages,
            totalUsers,
            pageSize: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        });
      }
    }

    // Fallback: Get all users, filter by period, and sort
    const allUsers = await readUsers();
    const sortedUsers = allUsers
      .filter((u) => isUserActiveInPeriod(u, period))
      .map(publicUser)
      .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name))
      .map((user, index) => ({ ...user, rank: index + 1 }));

    // Calculate pagination metadata
    const totalUsers = sortedUsers.length;
    const totalPages = Math.ceil(totalUsers / limit);
    const currentPage = page;
    const pageSize = limit;

    // Get paginated data
    const paginatedUsers = sortedUsers.slice(offset, offset + limit);

    // Prepare response with pagination metadata
    return res.status(200).json({
      leaders: paginatedUsers,
      currentUserId: session?.sub || null,
      pagination: {
        currentPage,
        totalPages,
        totalUsers,
        pageSize,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
      // Echo requested period so the client can confirm
      period,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
