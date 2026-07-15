import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { verifyToken, parseCookies } from './_lib/auth.js';

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
    console.warn('Firebase credentials not set.');
    return;
  }

  try {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    db = getFirestore();
    useFirestore = true;
  } catch (error) {
    console.error('Firebase init failed:', error);
  }
}

initFirebase();

const SESSION_COOKIE = 'aiv_session';

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const session = verifyToken(cookies[SESSION_COOKIE]);

  if (!session) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (!useFirestore) {
    return res.status(503).json({ error: 'User store unavailable.' });
  }

  try {
    const userRef = db.collection('users').doc(session.sub);

    if (req.method === 'GET') {
      const doc = await userRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const userData = doc.data();
      return res.status(200).json({
        success: true,
        revisionSchedule: userData.revisionSchedule || {},
        revisionCalendar: userData.revisionCalendar || {
          tasks: [],
          history: [],
          streak: 0,
          longestStreak: 0,
          missedDays: 0,
          stats: {},
        },
      });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      let body;
      try {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
      } catch {
        return res.status(400).json({ error: 'Invalid JSON body.' });
      }

      const { revisionSchedule, revisionCalendar } = body;
      const updates = {};
      if (revisionSchedule) updates.revisionSchedule = revisionSchedule;
      if (revisionCalendar) updates.revisionCalendar = revisionCalendar;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update.' });
      }

      await userRef.update(updates);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[api/revision] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
