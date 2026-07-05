import { runUserCode } from '../backend/jsSandboxRunner.js';

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

  // Validate request body size via Content-Length header
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 100000) { // 100KB limit
    return res.status(413).json({ error: 'Payload too large. Request body must be under 100KB.' });
  }

  const { source_code, language, stdin = '' } = req.body;

  // Validate required fields and constraints
  if (!language || typeof language !== 'string') {
    return res.status(400).json({ error: 'language is required and must be a string' });
  }
  if (!source_code || typeof source_code !== 'string') {
    return res.status(400).json({ error: 'source_code is required and must be a string' });
  }
  if (typeof stdin !== 'string') {
    return res.status(400).json({ error: 'stdin must be a string' });
  }

  const MAX_CODE_LENGTH = 50000; // 50KB
  if (source_code.length > MAX_CODE_LENGTH) {
    return res.status(400).json({ error: `source_code exceeds maximum length of ${MAX_CODE_LENGTH} characters.` });
  }

  const language_id = req.body.language_id ?? LANGUAGE_IDS[language.toLowerCase()];
  if (!language_id) {
    return res.status(400).json({ error: `Unsupported language: ${language}` });
  }

  try {
    // Treat the API request as a single test case for our internal runner
    const tests = [{ input: stdin, expectedOutput: "" }];
    
    // Call our new secure local Docker runner instead of Judge0
    const result = await runUserCode({
      language: language,
      sourceCode: source_code,
      tests: tests,
      timeoutMs: 5000,
      showMySteps: true
    });

    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    const execResult = result.results[0];

    // Maintain the EXACT same JSON shape that the frontend expects from Judge0
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