import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SESSION_COOKIE, verifySessionToken, parseCookies } from '../backend/utils/sessionToken.js';

let db = null;
let useFirestore = false;

function initFirebase() {
  if (getApps().length > 0) {
    db = getFirestore();
    useFirestore = true;
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    void 0;
    return;
  }

  try {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    db = getFirestore();
    useFirestore = true;
  } catch (error) {
    console.error(error);
  }
}

initFirebase();

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
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const cookies = parseCookies(req.headers.cookie || '');
    const session = verifySessionToken(cookies[SESSION_COOKIE]);

    // Get all users and sort
    const allUsers = await readUsers();
    const sortedUsers = allUsers
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
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
