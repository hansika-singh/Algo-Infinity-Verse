import {
  handleGuestLogin,
  handleSignup,
  handleLogin,
  handleLogout,
  handleDeactivateAccount,
  handleSession,
} from '../handlers/authHandlers.js';
import { handleAnalyzeResume } from '../handlers/resumeHandlers.js';
import { handleSubmitFeedback } from '../handlers/feedbackHandlers.js';
import { handleSubmitInterviewExperience } from '../handlers/interviewHandlers.js';
import {
  handleMemoryLog,
  handleMemoryDue,
  handleMemoryAll,
  handleMemoryDelete,
  handleMemoryStats,
  handleMemoryReset,
} from '../handlers/memoryHandlers.js';
import { handleUserPersonality } from '../handlers/personalityHandlers.js';

const MAX_TOPIC_LENGTH = 100;

const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMITS = {
  default: { maxRequests: 60, tier: 'default' },
  memory: { maxRequests: 30, tier: 'memory' },
  critical: { maxRequests: 10, tier: 'critical' },
};

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

function applySecurityHeaders(res) {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

function checkRateLimit(req, res, tier = 'default') {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  const key = `${ip}:${tier}`;
  const now = Date.now();
  const config = RATE_LIMITS[tier] || RATE_LIMITS.default;
  const windowMs = RATE_LIMIT_WINDOW;

  if (!rateLimiter.has(key)) {
    rateLimiter.set(key, { count: 1, firstRequest: now, tier: config.tier });
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', config.maxRequests - 1);
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
    return true;
  }

  const data = rateLimiter.get(key);
  if (now - data.firstRequest > windowMs) {
    data.count = 1;
    data.firstRequest = now;
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', config.maxRequests - 1);
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
    return true;
  }

  if (data.count >= config.maxRequests) {
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', new Date(data.firstRequest + windowMs).toISOString());
    res.setHeader('Retry-After', Math.ceil((data.firstRequest + windowMs - now) / 1000));
    return false;
  }

  data.count++;
  res.setHeader('X-RateLimit-Limit', config.maxRequests);
  res.setHeader('X-RateLimit-Remaining', config.maxRequests - data.count);
  res.setHeader('X-RateLimit-Reset', new Date(data.firstRequest + windowMs).toISOString());
  return true;
}

function sanitizeInput(value) {
  if (typeof value === 'string') {
    return value.trim().replace(/[<>]/g, '').slice(0, 5000);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeInput(item));
  }
  if (value && typeof value === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeInput(val);
    }
    return sanitized;
  }
  return value;
}

function sanitizeBody(req) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeInput(req.body);
  }
}

function addSecurityLogging(req, action, details = {}) {
  const timestamp = new Date().toISOString();
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  console.log(`[SECURITY] ${timestamp} | ${action} | IP: ${ip} | UA: ${userAgent}`, details);
}

function validateSession(req) {
  const session = req.session || {};
  return !!session.userId;
}

function validatePasswordPolicy(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  return { valid: true };
}

function sendError(res, statusCode, message, code = null) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  const response = { error: message };
  if (code) response.code = code;
  res.end(JSON.stringify(response));
}

function wrapHandler(handler, tier = 'default', requiresAuth = true) {
  return async (req, res) => {
    try {
      applySecurityHeaders(res);
      sanitizeBody(req);

      if (requiresAuth && !validateSession(req)) {
        addSecurityLogging(req, 'UNAUTHORIZED_ACCESS', { path: req.pathname });
        return sendError(res, 401, 'Unauthorized', 'SESSION_INVALID');
      }

      // Check primary rate limit tier
      if (!checkRateLimit(req, res, tier)) {
        addSecurityLogging(req, 'RATE_LIMIT_EXCEEDED', { tier });
        const config = RATE_LIMITS[tier] || RATE_LIMITS.default;
        return sendError(
          res,
          429,
          `Rate limit exceeded. Maximum ${config.maxRequests} requests per minute.`,
          'RATE_LIMIT_EXCEEDED'
        );
      }

      // Secondary critical limit check (Only applies if the primary tier isn't already 'critical')
      const isCritical = req.pathname?.includes('/reset') || req.pathname?.includes('/delete');
      if (isCritical) {
        if (tier !== 'critical') {
          if (!checkRateLimit(req, res, 'critical')) {
            addSecurityLogging(req, 'CRITICAL_RATE_LIMIT_EXCEEDED', { path: req.pathname });
            const config = RATE_LIMITS.critical;
            return sendError(
              res,
              429,
              `Critical rate limit exceeded. Maximum ${config.maxRequests} requests per minute.`,
              'CRITICAL_RATE_LIMIT_EXCEEDED'
            );
          }
        }
        addSecurityLogging(req, 'CRITICAL_OPERATION', { path: req.pathname, method: req.method });
      }

      if (req.method === 'POST' || req.method === 'PUT') {
        const password = req.body?.password || req.body?.newPassword;
        if (password) {
          const validation = validatePasswordPolicy(password);
          if (!validation.valid) {
            addSecurityLogging(req, 'INVALID_PASSWORD_ATTEMPT', { path: req.pathname });
            return sendError(res, 400, validation.message, 'INVALID_PASSWORD');
          }
        }
      }

      const handlerStart = Date.now();
      await handler(req, res);
      const handlerDuration = Date.now() - handlerStart;

      if (handlerDuration > 1000) {
        addSecurityLogging(req, 'SLOW_HANDLER', { path: req.pathname, duration: handlerDuration });
      }
    } catch (error) {
      console.error('[API] Handler error:', error);
      addSecurityLogging(req, 'HANDLER_ERROR', { path: req.pathname, error: error.message });
      sendError(res, 500, 'Internal server error', 'HANDLER_ERROR');
    }
  };
}

export function setupApiRoutes(req, res, pathname) {
  req.pathname = pathname;

  if (pathname === '/api/guest' && req.method === 'POST') {
    return wrapHandler(handleGuestLogin, 'default', false)(req, res);
  }

  if (pathname === '/api/session' && req.method === 'GET') {
    return wrapHandler(handleSession, 'default', false)(req, res);
  }

  if (pathname === '/api/signup' && req.method === 'POST') {
    return wrapHandler(handleSignup, 'default', false)(req, res);
  }

  if (pathname === '/api/login' && req.method === 'POST') {
    return wrapHandler(handleLogin, 'default', false)(req, res);
  }

  if (pathname === '/api/deactivate-account' && req.method === 'POST') {
    return wrapHandler(handleDeactivateAccount, 'critical', true)(req, res);
  }

  if (pathname === '/api/logout' && req.method === 'POST') {
    return wrapHandler(handleLogout, 'default', true)(req, res);
  }

  if (pathname === '/api/analyze-resume' && req.method === 'POST') {
    return wrapHandler(handleAnalyzeResume, 'memory', true)(req, res);
  }

  if (pathname === '/api/feedback' && req.method === 'POST') {
    return wrapHandler(handleSubmitFeedback, 'default', true)(req, res);
  }

  if (pathname === '/api/interview-experiences' && req.method === 'POST') {
    return wrapHandler(handleSubmitInterviewExperience, 'default', true)(req, res);
  }

  // MEMORY ROUTES
  if (pathname === '/api/memory/log' && req.method === 'POST') {
    return wrapHandler(handleMemoryLog, 'memory', true)(req, res);
  }

  if (pathname === '/api/memory/due' && req.method === 'GET') {
    return wrapHandler(handleMemoryDue, 'memory', true)(req, res);
  }

  if (pathname === '/api/memory/all' && req.method === 'GET') {
    return wrapHandler(handleMemoryAll, 'memory', true)(req, res);
  }

  if (pathname === '/api/memory/stats' && req.method === 'GET') {
    return wrapHandler(handleMemoryStats, 'memory', true)(req, res);
  }

  if (pathname === '/api/memory/reset' && req.method === 'POST') {
    return wrapHandler(handleMemoryReset, 'critical', true)(req, res);
  }

  if (pathname.startsWith('/api/memory/') && req.method === 'DELETE') {
    const rawTopic = pathname.replace('/api/memory/', '');
    if (rawTopic && rawTopic.length > 0) {
      try {
        const decodedTopic = decodeURIComponent(rawTopic);
        const trimmedTopic = decodedTopic.trim();

        if (trimmedTopic.length > MAX_TOPIC_LENGTH) {
          return sendError(
            res,
            400,
            `Topic exceeds maximum length of ${MAX_TOPIC_LENGTH} characters.`,
            'TOPIC_TOO_LONG'
          );
        }

        if (!/^[a-zA-Z0-9\s\-_.]+$/.test(trimmedTopic)) {
          return sendError(
            res,
            400,
            'Topic contains unsupported characters. Only letters, numbers, spaces, hyphens, underscores, and periods are allowed.',
            'INVALID_TOPIC'
          );
        }

        req.params = req.params || {};
        req.params.topic = trimmedTopic;
        return wrapHandler(handleMemoryDelete, 'critical', true)(req, res);
      } catch (error) {
        if (error instanceof URIError) {
          return sendError(
            res,
            400,
            'Invalid URL-encoded route parameter. Please provide a valid topic identifier.',
            'INVALID_TOPIC_ENCODING'
          );
        }
        throw error;
      }
    }
  }

  if (pathname === '/api/user/personality' && req.method === 'GET') {
    return wrapHandler(handleUserPersonality, 'default', true)(req, res);
  }

  return null;
}
