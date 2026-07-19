import { initializeFirebase } from '../firebase.js';
import { SESSION_COOKIE, verifySessionToken, parseCookies } from '../backend/utils/sessionToken.js';

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

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const session = verifySessionToken(cookies[SESSION_COOKIE]);
    if (!session) return res.status(401).json({ error: 'Authentication required.' });
    if (!useFirestore) return res.status(503).json({ error: 'User store unavailable.' });

    const snapshot = await db.collection('users').where('id', '==', session.sub).limit(1).get();
    if (snapshot.empty) return res.status(404).json({ error: 'User not found.' });

    const doc = snapshot.docs[0];
    const payload = req.body || {};
    const progress = {
      name: String(payload.name || '').trim() || doc.data().name,
      xp: Math.max(0, Number(payload.xp) || 0),
      level: Math.max(1, Number(payload.level) || 1),
      avatar:
        String(payload.avatar || '{"initial":"L","bg":"#7c3aed"}').trim() ||
        '{"initial":"L","bg":"#7c3aed"}',
      progressUpdatedAt: new Date().toISOString(),
    };

    await doc.ref.update(progress);

    // Concurrently update leaderboard in Redis
    (async () => {
      try {
        const { enqueueLeaderboardUpdate } = await import('../backend/jobs/queue.js');
        await enqueueLeaderboardUpdate(session.sub, progress.xp);
      } catch (e) {
        console.error('[LEADERBOARD] Failed to update user XP in Redis:', e);
      }
    })();

    return res
      .status(200)
      .json({ user: publicUser({ id: session.sub, ...doc.data(), ...progress }) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
