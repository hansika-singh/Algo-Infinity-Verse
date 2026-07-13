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

export function setupApiRoutes(req, res, pathname) {
  // Guest Login
  if (pathname === '/api/guest' && req.method === 'POST') {
    return handleGuestLogin(req, res);
  }

  // Session
  if (pathname === '/api/session' && req.method === 'GET') {
    return handleSession(req, res);
  }

  // Signup
  if (pathname === '/api/signup' && req.method === 'POST') {
    return handleSignup(req, res);
  }

  // Login
  if (pathname === '/api/login' && req.method === 'POST') {
    return handleLogin(req, res);
  }

  // Deactivate Account
  if (pathname === '/api/deactivate-account' && req.method === 'POST') {
    return handleDeactivateAccount(req, res);
  }

  // Logout
  if (pathname === '/api/logout' && req.method === 'POST') {
    return handleLogout(req, res);
  }

  // Resume Analysis
  if (pathname === '/api/analyze-resume' && req.method === 'POST') {
    return handleAnalyzeResume(req, res);
  }

  // Feedback
  if (pathname === '/api/feedback' && req.method === 'POST') {
    return handleSubmitFeedback(req, res);
  }

  // Interview Experiences
  if (pathname === '/api/interview-experiences' && req.method === 'POST') {
    return handleSubmitInterviewExperience(req, res);
  }

  // ============================================
  // MEMORY ROUTES (Spaced Repetition System)
  // ============================================

  // POST /api/memory/log - Log a memory review
  if (pathname === '/api/memory/log' && req.method === 'POST') {
    return handleMemoryLog(req, res);
  }

  // GET /api/memory/due - Get due cards
  if (pathname === '/api/memory/due' && req.method === 'GET') {
    return handleMemoryDue(req, res);
  }

  // GET /api/memory/all - Get all cards
  if (pathname === '/api/memory/all' && req.method === 'GET') {
    return handleMemoryAll(req, res);
  }

  // DELETE /api/memory/:topic - Delete a card
  if (pathname.startsWith('/api/memory/') && req.method === 'DELETE') {
    const topic = pathname.replace('/api/memory/', '');
    if (topic && topic.length > 0) {
      req.params = req.params || {};
      req.params.topic = decodeURIComponent(topic);
      return handleMemoryDelete(req, res);
    }
  }

  // GET /api/memory/stats - Get statistics
  if (pathname === '/api/memory/stats' && req.method === 'GET') {
    return handleMemoryStats(req, res);
  }

  // POST /api/memory/reset - Reset all cards
  if (pathname === '/api/memory/reset' && req.method === 'POST') {
    return handleMemoryReset(req, res);
  }

  // Coding Personality
  if (pathname === '/api/user/personality' && req.method === 'GET') {
    return handleUserPersonality(req, res);
  }

  // Learning Session Replay & Timeline
  // handled by api/[...path].js catch-all for these routes.

  return null;
}
