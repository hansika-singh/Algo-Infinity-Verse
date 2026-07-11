import { runUserCode } from '../backend/jsSandboxRunner.js';
import { SESSION_COOKIE, verifySessionToken, parseCookies } from "../backend/utils/sessionToken.js";

// ============================================
// CONFIGURABLE SETTINGS
// ============================================

const EXECUTION_CONFIG = {
  TIMEOUT_MS: parseInt(process.env.CODE_EXECUTION_TIMEOUT_MS) || 5000,
  MAX_CODE_LENGTH: parseInt(process.env.MAX_CODE_LENGTH) || 50000,
  MAX_PAYLOAD_SIZE: parseInt(process.env.MAX_PAYLOAD_SIZE) || 100000,
};

// ─── Auth helpers ──────────────────────────────────────────────────────────
function getUser(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return verifySessionToken(cookies[SESSION_COOKIE]);
}

const LANGUAGE_IDS = {
  python:      71,
  javascript:  63,
  java:        62,
  'c++':       54,
  cpp:         54,
  c:           50,
  typescript:  74,
  go:          60,
  rust:        73,
  ruby:        72,
  swift:       83,
  dart:        98,
  haskell:     89,
  kotlin:      78,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized — please log in' });
  }

  // Validate request body size via Content-Length header
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > EXECUTION_CONFIG.MAX_PAYLOAD_SIZE) {
    return res.status(413).json({ 
      error: `Payload too large. Request body must be under ${EXECUTION_CONFIG.MAX_PAYLOAD_SIZE / 1000}KB.` 
    });
  }

  const { source_code, language, stdin = '' } = req.body;

  if (!language || typeof language !== 'string') {
    return res.status(400).json({ error: 'language is required and must be a string' });
  }
  if (!source_code || typeof source_code !== 'string') {
    return res.status(400).json({ error: 'source_code is required and must be a string' });
  }
  if (typeof stdin !== 'string') {
    return res.status(400).json({ error: 'stdin must be a string' });
  }

  if (source_code.length > EXECUTION_CONFIG.MAX_CODE_LENGTH) {
    return res.status(400).json({ 
      error: `source_code exceeds maximum length of ${EXECUTION_CONFIG.MAX_CODE_LENGTH} characters.` 
    });
  }

  const language_id = req.body.language_id ?? LANGUAGE_IDS[language.toLowerCase()];
  if (!language_id) {
    return res.status(400).json({ error: `Unsupported language: ${language}` });
  }

  try {
    const tests = [{ input: stdin, expectedOutput: "" }];
    
    const result = await runUserCode({
      language: language,
      sourceCode: source_code,
      tests: tests,
      timeoutMs: EXECUTION_CONFIG.TIMEOUT_MS,
      showMySteps: true
    });

    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    const execResult = result.results[0];

    return res.status(200).json({
      stdout: execResult.transcript?.stdout || execResult.actualOutput || '',
      stderr: execResult.runtimeError?.message || execResult.transcript?.stderr || '',
      code: execResult.runtimeError ? 1 : 0,
      status: execResult.timedOut ? 'Time Limit Exceeded' : (execResult.runtimeError ? 'Runtime Error' : 'Accepted'),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}