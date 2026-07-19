import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getSession, sendJson, readJsonBody } from '../utils/helpers.js';
import { initializeFirebase } from '../../firebase.js';

const DATA_DIR = path.join(process.cwd(), 'data');

const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 5;

const ALLOWED_FEEDBACK_TYPES = [
  'Suggestion',
  'Bug Report',
  'Feature Request',
  'General Feedback',
  'Complaint',
  'Praise',
];

const VALID_STATUSES = ['new', 'reviewed', 'in-progress', 'resolved', 'closed'];

function sanitizeInput(value) {
  if (typeof value !== 'string') return value;
  return value
    .trim()
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .slice(0, 10000);
}

function validateSubject(subject) {
  const sanitized = sanitizeInput(subject);
  if (sanitized.length < 3) {
    return { valid: false, message: 'Subject must be at least 3 characters long.' };
  }
  if (sanitized.length > 100) {
    return { valid: false, message: 'Subject must not exceed 100 characters.' };
  }
  return { valid: true, value: sanitized };
}

function validateMessage(message) {
  const sanitized = sanitizeInput(message);
  if (sanitized.length < 10) {
    return { valid: false, message: 'Message must be at least 10 characters long.' };
  }
  if (sanitized.length > 1000) {
    return { valid: false, message: 'Message must not exceed 1000 characters.' };
  }
  return { valid: true, value: sanitized };
}

function validateFeedbackType(type) {
  if (!ALLOWED_FEEDBACK_TYPES.includes(type)) {
    return {
      valid: false,
      message: `Invalid feedback type. Allowed: ${ALLOWED_FEEDBACK_TYPES.join(', ')}`,
    };
  }
  return { valid: true, value: type };
}

function validateStatus(status) {
  if (!VALID_STATUSES.includes(status)) {
    return { valid: false, message: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}` };
  }
  return { valid: true, value: status };
}

function checkRateLimit(ip) {
  const now = Date.now();
  const key = `feedback_${ip}`;

  if (!rateLimiter.has(key)) {
    rateLimiter.set(key, { count: 1, firstRequest: now });
    return true;
  }

  const data = rateLimiter.get(key);
  if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
    data.count = 1;
    data.firstRequest = now;
    return true;
  }

  if (data.count >= RATE_LIMIT_MAX) {
    return false;
  }

  data.count++;
  return true;
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
}

function hashIp(ip) {
  if (ip === 'unknown') return 'unknown';
  return crypto
    .createHash('sha256')
    .update(ip + process.env.IP_SALT || 'default-salt')
    .digest('hex');
}

function isAdmin(session) {
  return session && session.role === 'admin';
}

function isOwner(session, feedbackUserId) {
  return session && session.sub === feedbackUserId;
}

function hasAccess(session, feedbackUserId) {
  return isAdmin(session) || isOwner(session, feedbackUserId);
}

function getPaginationParams(req) {
  const page = Math.max(1, parseInt(req.query?.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query?.limit) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function getCacheKey(userId, page, limit) {
  return `feedback_history_${userId}_${page}_${limit}`;
}

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

function clearCache(userId = null) {
  if (userId) {
    for (const key of cache.keys()) {
      if (key.includes(userId)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

export async function handleSubmitFeedback(req, res) {
  const session = getSession(req);
  const ip = getClientIp(req);
  const hashedIp = hashIp(ip);

  if (!checkRateLimit(hashedIp)) {
    return sendJson(res, 429, {
      error: 'Too many feedback submissions. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000),
    });
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (err) {
    return sendJson(res, 400, { error: 'Invalid JSON body.', code: 'INVALID_JSON' });
  }

  const { feedbackType, subject, message } = payload;

  if (!feedbackType || !subject || !message) {
    return sendJson(res, 400, {
      error: 'Feedback type, subject, and message are required.',
      code: 'MISSING_FIELDS',
    });
  }

  const typeValidation = validateFeedbackType(feedbackType);
  if (!typeValidation.valid) {
    return sendJson(res, 400, { error: typeValidation.message, code: 'INVALID_TYPE' });
  }

  const subjectValidation = validateSubject(subject);
  if (!subjectValidation.valid) {
    return sendJson(res, 400, { error: subjectValidation.message, code: 'INVALID_SUBJECT' });
  }

  const messageValidation = validateMessage(message);
  if (!messageValidation.valid) {
    return sendJson(res, 400, { error: messageValidation.message, code: 'INVALID_MESSAGE' });
  }

  const feedbackData = {
    userId: session ? session.sub : null,
    userName: session ? session.name : null,
    userEmail: session ? session.email : null,
    userIp: hashedIp,
    feedbackType: typeValidation.value,
    subject: subjectValidation.value,
    message: messageValidation.value,
    status: 'new',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const db = initializeFirebase();
    if (db) {
      const docRef = await db.collection('feedback').add(feedbackData);
      feedbackData.id = docRef.id;
    } else {
      const feedbackFile = path.join(DATA_DIR, 'feedback.json');
      await fs.mkdir(DATA_DIR, { recursive: true });
      let feedbackList = [];
      try {
        const raw = await fs.readFile(feedbackFile, 'utf8');
        feedbackList = JSON.parse(raw || '[]');
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
      feedbackData.id = crypto.randomUUID();
      feedbackList.push(feedbackData);
      await fs.writeFile(feedbackFile, JSON.stringify(feedbackList, null, 2) + '\n');
    }

    clearCache(feedbackData.userId);
    return sendJson(res, 201, { success: true, feedback: feedbackData });
  } catch (err) {
    console.error('Error saving feedback:', err);
    return sendJson(res, 500, { error: 'Failed to save feedback.', code: 'SAVE_ERROR' });
  }
}

export async function handleGetFeedbackHistory(req, res) {
  const session = getSession(req);
  if (!session || !session.sub) {
    return sendJson(res, 401, { error: 'Unauthorized. Please login.', code: 'UNAUTHORIZED' });
  }

  const { page, limit, offset } = getPaginationParams(req);
  const cacheKey = getCacheKey(session.sub, page, limit);

  const cached = getCached(cacheKey);
  if (cached) {
    return sendJson(res, 200, { ...cached, cached: true });
  }

  try {
    const db = initializeFirebase();
    let feedbackList = [];

    if (db) {
      const snapshot = await db
        .collection('feedback')
        .where('userId', '==', session.sub)
        .orderBy('createdAt', 'desc')
        .offset(offset)
        .limit(limit)
        .get();

      snapshot.forEach((doc) => {
        feedbackList.push({ id: doc.id, ...doc.data() });
      });

      const totalSnapshot = await db
        .collection('feedback')
        .where('userId', '==', session.sub)
        .count()
        .get();

      const total = totalSnapshot.data().count || 0;

      const result = {
        feedback: feedbackList,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
      setCache(cacheKey, result);
      return sendJson(res, 200, result);
    } else {
      const feedbackFile = path.join(DATA_DIR, 'feedback.json');
      try {
        const raw = await fs.readFile(feedbackFile, 'utf8');
        const allFeedback = JSON.parse(raw || '[]');
        const userFeedback = allFeedback
          .filter((f) => f.userId === session.sub)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const total = userFeedback.length;
        const paginated = userFeedback.slice(offset, offset + limit);

        const result = {
          feedback: paginated,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
        setCache(cacheKey, result);
        return sendJson(res, 200, result);
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
        return sendJson(res, 200, {
          feedback: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
    }
  } catch (err) {
    console.error('Error fetching feedback history:', err);
    return sendJson(res, 500, { error: 'Failed to fetch feedback history.', code: 'FETCH_ERROR' });
  }
}

export async function handleUpdateFeedbackStatus(req, res) {
  const session = getSession(req);
  if (!session || !isAdmin(session)) {
    return sendJson(res, 403, { error: 'Admin access required.', code: 'FORBIDDEN' });
  }

  const { id } = req.params || {};
  if (!id) {
    return sendJson(res, 400, { error: 'Feedback ID is required.', code: 'MISSING_ID' });
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (err) {
    return sendJson(res, 400, { error: 'Invalid JSON body.', code: 'INVALID_JSON' });
  }

  const { status } = payload;
  const statusValidation = validateStatus(status);
  if (!statusValidation.valid) {
    return sendJson(res, 400, { error: statusValidation.message, code: 'INVALID_STATUS' });
  }

  try {
    const db = initializeFirebase();
    if (db) {
      await db.collection('feedback').doc(id).update({
        status: statusValidation.value,
        updatedAt: new Date().toISOString(),
        updatedBy: session.sub,
      });
    } else {
      const feedbackFile = path.join(DATA_DIR, 'feedback.json');
      const raw = await fs.readFile(feedbackFile, 'utf8');
      let feedbackList = JSON.parse(raw || '[]');
      const index = feedbackList.findIndex((f) => f.id === id);
      if (index === -1) {
        return sendJson(res, 404, { error: 'Feedback not found.', code: 'NOT_FOUND' });
      }
      feedbackList[index].status = statusValidation.value;
      feedbackList[index].updatedAt = new Date().toISOString();
      feedbackList[index].updatedBy = session.sub;
      await fs.writeFile(feedbackFile, JSON.stringify(feedbackList, null, 2) + '\n');
    }

    clearCache();
    return sendJson(res, 200, {
      success: true,
      message: `Feedback status updated to ${statusValidation.value}`,
      status: statusValidation.value,
    });
  } catch (err) {
    console.error('Error updating feedback status:', err);
    return sendJson(res, 500, { error: 'Failed to update feedback status.', code: 'UPDATE_ERROR' });
  }
}

export async function handleDeleteFeedback(req, res) {
  const session = getSession(req);
  if (!session || !session.sub) {
    return sendJson(res, 401, { error: 'Unauthorized. Please login.', code: 'UNAUTHORIZED' });
  }

  const { id } = req.params || {};
  if (!id) {
    return sendJson(res, 400, { error: 'Feedback ID is required.', code: 'MISSING_ID' });
  }

  try {
    const db = initializeFirebase();
    if (db) {
      const doc = await db.collection('feedback').doc(id).get();
      if (!doc.exists) {
        return sendJson(res, 404, { error: 'Feedback not found.', code: 'NOT_FOUND' });
      }

      const data = doc.data();
      if (!hasAccess(session, data.userId)) {
        return sendJson(res, 403, {
          error: "You don't have permission to delete this feedback.",
          code: 'FORBIDDEN',
        });
      }

      await db.collection('feedback').doc(id).delete();
    } else {
      const feedbackFile = path.join(DATA_DIR, 'feedback.json');
      const raw = await fs.readFile(feedbackFile, 'utf8');
      let feedbackList = JSON.parse(raw || '[]');
      const index = feedbackList.findIndex((f) => f.id === id);
      if (index === -1) {
        return sendJson(res, 404, { error: 'Feedback not found.', code: 'NOT_FOUND' });
      }

      if (!hasAccess(session, feedbackList[index].userId)) {
        return sendJson(res, 403, {
          error: "You don't have permission to delete this feedback.",
          code: 'FORBIDDEN',
        });
      }

      feedbackList.splice(index, 1);
      await fs.writeFile(feedbackFile, JSON.stringify(feedbackList, null, 2) + '\n');
    }

    clearCache(session.sub);
    return sendJson(res, 200, { success: true, message: 'Feedback deleted successfully.' });
  } catch (err) {
    console.error('Error deleting feedback:', err);
    return sendJson(res, 500, { error: 'Failed to delete feedback.', code: 'DELETE_ERROR' });
  }
}

export async function handleGetFeedbackStats(req, res) {
  const session = getSession(req);
  if (!session || !isAdmin(session)) {
    return sendJson(res, 403, { error: 'Admin access required.', code: 'FORBIDDEN' });
  }

  try {
    const db = initializeFirebase();
    let stats = {};

    if (db) {
      const totalSnapshot = await db.collection('feedback').count().get();
      const total = totalSnapshot.data().count || 0;

      const statusCounts = {};
      for (const status of VALID_STATUSES) {
        const snapshot = await db
          .collection('feedback')
          .where('status', '==', status)
          .count()
          .get();
        statusCounts[status] = snapshot.data().count || 0;
      }

      const typeCounts = {};
      for (const type of ALLOWED_FEEDBACK_TYPES) {
        const snapshot = await db
          .collection('feedback')
          .where('feedbackType', '==', type)
          .count()
          .get();
        typeCounts[type] = snapshot.data().count || 0;
      }

      stats = { total, byStatus: statusCounts, byType: typeCounts };
    } else {
      const feedbackFile = path.join(DATA_DIR, 'feedback.json');
      try {
        const raw = await fs.readFile(feedbackFile, 'utf8');
        const feedbackList = JSON.parse(raw || '[]');

        const total = feedbackList.length;
        const statusCounts = {};
        const typeCounts = {};

        for (const status of VALID_STATUSES) {
          statusCounts[status] = 0;
        }
        for (const type of ALLOWED_FEEDBACK_TYPES) {
          typeCounts[type] = 0;
        }

        feedbackList.forEach((f) => {
          if (statusCounts[f.status] !== undefined) statusCounts[f.status]++;
          if (typeCounts[f.feedbackType] !== undefined) typeCounts[f.feedbackType]++;
        });

        stats = { total, byStatus: statusCounts, byType: typeCounts };
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
        stats = { total: 0, byStatus: {}, byType: {} };
      }
    }

    return sendJson(res, 200, stats);
  } catch (err) {
    console.error('Error fetching feedback stats:', err);
    return sendJson(res, 500, {
      error: 'Failed to fetch feedback statistics.',
      code: 'STATS_ERROR',
    });
  }
}
