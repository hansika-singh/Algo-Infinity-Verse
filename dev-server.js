import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const EXECUTIONS_FILE = path.join(DATA_DIR, 'executions.json');

let execWriteQueue = Promise.resolve();

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { await fs.access(EXECUTIONS_FILE); }
  catch { await fs.writeFile(EXECUTIONS_FILE, '[]\n'); }
}

async function appendExecution(record) {
  const task = execWriteQueue.then(async () => {
    await ensureStore();
    const raw = await fs.readFile(EXECUTIONS_FILE, 'utf8');
    const store = JSON.parse(raw || '[]');
    store.push(record);
    const tmp = `${EXECUTIONS_FILE}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, `${JSON.stringify(store, null, 2)}\n`);
    await fs.rename(tmp, EXECUTIONS_FILE);
  });
  execWriteQueue = task.catch(() => {});
  return task;
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

const JUDGE0 = 'https://ce.judge0.com';
const POLL_INTERVAL = 600;
const MAX_POLLS = 50;
const b64 = (s) => Buffer.from(s, 'utf-8').toString('base64');
const d64 = (s) => s ? Buffer.from(s, 'base64').toString('utf-8') : '';

async function pollSubmission(token) {
  const safeToken = encodeURIComponent(token);
  for (let i = 0; i < MAX_POLLS; i++) {
    const resp = await fetch(`${JUDGE0}/submissions/${safeToken}?base64_encoded=true`);
    if (!resp.ok) throw new Error(`Judge0 poll error: ${await resp.text()}`);
    const data = await resp.json();
    if (data.status && data.status.id >= 3) return data;
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
  throw new Error('Judge0 execution timed out');
}

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/execute', async (req, res) => {
  // Validate request body size via Content-Length header
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 100000) { // 100KB limit
    return res.status(413).json({ error: 'Payload too large. Request body must be under 100KB.' });
  }

  const source_code = req.body.source_code ?? req.body.sourceCode;
  const originalCode = req.body.originalCode;
  const { language, stdin = '' } = req.body;

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
    if (typeof token !== 'string' || !/^[a-zA-Z0-9-]+$/.test(token)) {
      return res.status(500).json({ error: 'Invalid token format received' });
    }

    const data = await pollSubmission(token);

    const stdout = d64(data.stdout);
    const stderr = d64(data.stderr) || d64(data.compile_output) || '';
    const exitCode = data.status?.id === 3 ? 0 : 1;

    const executionRecord = {
      id: crypto.randomUUID(),
      userId: req.headers['x-user-id'] || 'local-dev',
      sourceCode: source_code,
      originalCode,
      language,
      stdin,
      stdout,
      stderr,
      exitCode,
      cpuTime: data.time ?? null,
      memory: data.memory ?? null,
      error: exitCode !== 0 ? (data.status?.description || 'Execution error') : null,
      createdAt: new Date().toISOString(),
      variableSnapshots: [],
    };
    appendExecution(executionRecord).catch((e) => console.error('Failed to save execution log:', e));

    return res.status(200).json({
      success: true,
      data: {
        output: stdout,
        stderr,
        memory: data.memory ?? null,
        cpuTime: data.time ?? null,
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  void 0;
  void 0;
});
