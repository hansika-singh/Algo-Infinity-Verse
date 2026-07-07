import { 
  handleGuestLogin, handleSignup, handleLogin, 
  handleLogout, handleDeactivateAccount, handleSession 
} from '../handlers/authHandlers.js';
import { handleAnalyzeResume } from '../handlers/resumeHandlers.js';
import { handleSubmitFeedback } from '../handlers/feedbackHandlers.js';
import { handleSubmitInterviewExperience } from '../handlers/interviewHandlers.js';
import { handleMemoryLog, handleMemoryDue, handleMemoryAll } from '../handlers/memoryHandlers.js';
import { handleUserPersonality } from '../handlers/personalityHandlers.js';

export function setupApiRoutes(req, res, pathname) {
  // Guest Login
  if (pathname === "/api/guest" && req.method === "POST") {
    return handleGuestLogin(req, res);
  }

  // Session
  if (pathname === "/api/session" && req.method === "GET") {
    return handleSession(req, res);
  }

  // Signup
  if (pathname === "/api/signup" && req.method === "POST") {
    return handleSignup(req, res);
  }

  // Login
  if (pathname === "/api/login" && req.method === "POST") {
    return handleLogin(req, res);
  }

  // Deactivate Account
  if (pathname === "/api/deactivate-account" && req.method === "POST") {
    return handleDeactivateAccount(req, res);
  }

  // Logout
  if (pathname === "/api/logout" && req.method === "POST") {
    return handleLogout(req, res);
  }

  // Resume Analysis
  if (pathname === "/api/analyze-resume" && req.method === "POST") {
    return handleAnalyzeResume(req, res);
  }

  // Feedback
  if (pathname === "/api/feedback" && req.method === "POST") {
    return handleSubmitFeedback(req, res);
  }

  // Interview Experiences
  if (pathname === "/api/interview-experiences" && req.method === "POST") {
    return handleSubmitInterviewExperience(req, res);
  }

  // Memory Operations
  if (pathname === "/api/memory/log" && req.method === "POST") {
    return handleMemoryLog(req, res);
  }
  if (pathname === "/api/memory/due" && req.method === "GET") {
    return handleMemoryDue(req, res);
  }
  if (pathname === "/api/memory/all" && req.method === "GET") {
    return handleMemoryAll(req, res);
  }

  // Coding Personality
  if (pathname === "/api/user/personality" && req.method === "GET") {
    return handleUserPersonality(req, res);
  }

  return null;
}