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

const JUDGE0 = 'https://ce.judge0.com';
const POLL_INTERVAL = 600;
const MAX_POLLS = 50;
const b64 = (s) => Buffer.from(s, 'utf-8').toString('base64');
const d64 = (s) => s ? Buffer.from(s, 'base64').toString('utf-8') : '';

async function pollSubmission(token) {
  for (let i = 0; i < MAX_POLLS; i++) {
    const resp = await fetch(`${JUDGE0}/submissions/${token}?base64_encoded=true`);
    if (!resp.ok) throw new Error(`Judge0 poll error: ${await resp.text()}`);
    const data = await resp.json();
    if (data.status && data.status.id >= 3) return data;
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
  throw new Error('Judge0 execution timed out');
}

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
    const submitResp = await fetch(
      `${JUDGE0}/submissions?base64_encoded=true&wait=false`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_code: b64(source_code), language_id, stdin: b64(stdin), compiler_options: language_id === 54 ? '-std=c++17' : undefined }),
      }
    );

    if (!submitResp.ok) {
      return res.status(submitResp.status).json({ error: `Judge0 error: ${await submitResp.text()}` });
    }

    const { token } = await submitResp.json();
    if (!token) return res.status(500).json({ error: 'Judge0 did not return a token' });

    const data = await pollSubmission(token);

    return res.status(200).json({
      stdout: d64(data.stdout),
      stderr: d64(data.stderr) || d64(data.compile_output) || '',
      code: data.status?.id === 3 ? 0 : 1,
      status: data.status?.description ?? 'Unknown',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
