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

const MAX_TOPIC_LENGTH = 100; // Defined the missing character limit metric

export function setupApiRoutes(req, res, pathname) {
  
  // Guest Login
  if (pathname === '/api/guest') {
    if (req.method !== 'POST') return res.status(405).setHeader('Allow', 'POST').json({ error: 'Method Not Allowed. Use POST.' });
    return handleGuestLogin(req, res);
  }

  // Session
  if (pathname === '/api/session') {
    if (req.method !== 'GET') return res.status(405).setHeader('Allow', 'GET').json({ error: 'Method Not Allowed. Use GET.' });
    return handleSession(req, res);
  }

  // Signup
  if (pathname === '/api/signup') {
    if (req.method !== 'POST') return res.status(405).setHeader('Allow', 'POST').json({ error: 'Method Not Allowed. Use POST.' });
    return handleSignup(req, res);
  }

  // Login
  if (pathname === '/api/login') {
    if (req.method !== 'POST') return res.status(405).setHeader('Allow', 'POST').json({ error: 'Method Not Allowed. Use POST.' });
    return handleLogin(req, res);
  }

  // Deactivate Account
  if (pathname === '/api/deactivate-account') {
    if (req.method !== 'POST') return res.status(405).setHeader('Allow', 'POST').json({ error: 'Method Not Allowed. Use POST.' });
    return handleDeactivateAccount(req, res);
  }

  // Logout
  if (pathname === '/api/logout') {
    if (req.method !== 'POST') return res.status(405).setHeader('Allow', 'POST').json({ error: 'Method Not Allowed. Use POST.' });
    return handleLogout(req, res);
  }

  // Resume Analysis
  if (pathname === '/api/analyze-resume') {
    if (req.method !== 'POST') return res.status(405).setHeader('Allow', 'POST').json({ error: 'Method Not Allowed. Use POST.' });
    return handleAnalyzeResume(req, res);
  }

  // Feedback
  if (pathname === '/api/feedback') {
    if (req.method !== 'POST') return res.status(405).setHeader('Allow', 'POST').json({ error: 'Method Not Allowed. Use POST.' });
    return handleSubmitFeedback(req, res);
  }

  // Interview Experiences
  if (pathname === '/api/interview-experiences') {
    if (req.method !== 'POST') return res.status(405).setHeader('Allow', 'POST').json({ error: 'Method Not Allowed. Use POST.' });
    return handleSubmitInterviewExperience(req, res);
  }

  // ============================================
  // MEMORY ROUTES
  // ============================================

  // POST /api/memory/log
  if (pathname === '/api/memory/log') {
    if (req.method !== 'POST') return res.status(405).setHeader('Allow', 'POST').json({ error: 'Method Not Allowed. Use POST.' });
    return handleMemoryLog(req, res);
  }

  // GET /api/memory/due
  if (pathname === '/api/memory/due') {
    if (req.method !== 'GET') return res.status(405).setHeader('Allow', 'GET').json({ error: 'Method Not Allowed. Use GET.' });
    return handleMemoryDue(req, res);
  }

  // GET /api/memory/all
  if (pathname === '/api/memory/all') {
    if (req.method !== 'GET') return res.status(405).setHeader('Allow', 'GET').json({ error: 'Method Not Allowed. Use GET.' });
    return handleMemoryAll(req, res);
  }

  // GET /api/memory/stats
  if (pathname === '/api/memory/stats') {
    if (req.method !== 'GET') return res.status(405).setHeader('Allow', 'GET').json({ error: 'Method Not Allowed. Use GET.' });
    return handleMemoryStats(req, res);
  }

  // POST /api/memory/reset
  if (pathname === '/api/memory/reset') {
    if (req.method !== 'POST') return res.status(405).setHeader('Allow', 'POST').json({ error: 'Method Not Allowed. Use POST.' });
    return handleMemoryReset(req, res);
  }

  // DELETE /api/memory/:topic - Dynamic Route
  if (pathname.startsWith('/api/memory/')) {
    const isDynamicRoute = !['/api/memory/log', '/api/memory/due', '/api/memory/all', '/api/memory/stats', '/api/memory/reset'].includes(pathname);

    if (isDynamicRoute) {
      if (req.method !== 'DELETE') {
        return res.status(405).setHeader('Allow', 'DELETE').json({ error: 'Method Not Allowed. Use DELETE.' });
      }

      const rawTopic = pathname.replace('/api/memory/', '');
      if (rawTopic && rawTopic.length > 0) {
        req.params = req.params || {};
        
        try {
          const decodedTopic = decodeURIComponent(rawTopic);
          const trimmedTopic = decodedTopic.trim();

          // Enforce maximum length
          if (trimmedTopic.length > MAX_TOPIC_LENGTH) {
            return res.status(400).json({
              error: `Topic exceeds maximum length of ${MAX_TOPIC_LENGTH} characters.`
            });
          }

          // Validate against supported character rules 
          if (!/^[a-zA-Z0-9\s\-_.]+$/.test(trimmedTopic)) {
            return res.status(400).json({
              error: 'Topic contains unsupported characters. Only letters, numbers, spaces, hyphens, underscores, and periods are allowed.'
            });
          }

          // Assign sanitized topic and route to the handler
          req.params.topic = trimmedTopic;
          return handleMemoryDelete(req, res);

        } catch (error) {
          if (error instanceof URIError) {
            return res.status(400).json({
              error: 'Invalid URL-encoded route parameter. Please provide a valid topic identifier.'
            });
          }
          throw error; 
        }
      }
    }
  }

  // Coding Personality
  if (pathname === '/api/user/personality') {
    if (req.method !== 'GET') return res.status(405).setHeader('Allow', 'GET').json({ error: 'Method Not Allowed. Use GET.' });
    return handleUserPersonality(req, res);
  }

  // If no route matches, return null
  return null;
}
