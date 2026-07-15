import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import util from 'util';

const execPromise = util.promisify(exec);

// Docker Configuration for Supported Languages
const RUNTIME_CONFIG = {
  python: { image: 'python:3.9-alpine', ext: '.py', getCmd: (f) => `python ${f}` },
  cpp: { image: 'gcc:latest', ext: '.cpp', getCmd: (f) => `g++ -O2 -o /tmp/out ${f} && /tmp/out` },
  javascript: { image: 'node:18-alpine', ext: '.js', getCmd: (f) => `node ${f}` },
  java: { image: 'openjdk:11-jdk-slim', ext: '.java', getCmd: (f) => `java ${f}` }
};

function truncate(str, max) {
  const s = String(str ?? "");
  if (!Number.isFinite(max) || max <= 0) return "";
  return s.length > max ? s.slice(0, max) + "\n[truncated]" : s;
}

function normalizeTestCase(t) {
  if (t == null || typeof t !== "object") {
    return { input: "", expectedOutput: "", name: undefined, show: true };
  }
  if ("input" in t) {
    return { name: t.name ?? undefined, input: t.input, expectedOutput: t.expectedOutput ?? t.expected ?? "", isHidden: Boolean(t.isHidden) };
  }
  if ("stdin" in t) {
    return { name: t.name ?? undefined, input: t.stdin, expectedOutput: t.expected ?? "", isHidden: Boolean(t.isHidden) };
  }
  return { name: t.name ?? undefined, input: t.value ?? "", expectedOutput: t.expectedOutput ?? t.expected ?? "", isHidden: Boolean(t.isHidden) };
}

function sanitizeFilePath(filePath) {
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(os.tmpdir())) throw new Error("Invalid path");
  return normalized;
}

async function runWithDocker({ language, sourceCode, tests, timeoutMs, maxOutputChars, showMySteps }) {
  const langIdMap = { python: "python", cpp: "cpp", javascript: "javascript", 'c++': 'cpp', java: 'java' };
  const langKey = langIdMap[language.toLowerCase()] || language.toLowerCase();
  const langConfig = RUNTIME_CONFIG[langKey];

  if (!langConfig) {
    return { ok: false, error: `Unsupported language for local docker sandbox: ${language}` };
  }
  
  let finalSourceCode = sourceCode;
  
  // KEEPING ORIGINAL JS WRAPPER LOGIC INTACT
  if (langKey === "javascript") {
    finalSourceCode = `
${sourceCode}

const fs = require('fs');
const stdin = fs.readFileSync(0, 'utf-8');

let __solve = null;
if (typeof solve === 'function') __solve = solve;
else if (typeof globalThis !== 'undefined' && typeof globalThis.solve === 'function') __solve = globalThis.solve;
else if (typeof module !== 'undefined' && module.exports && typeof module.exports.solve === 'function') {
  __solve = module.exports.solve;
}

if (!__solve) {
  console.error('No solve function found. Expected a function named solve(input).');
  process.exit(1);
}

try {
  let input = stdin;
  try {
    input = JSON.parse(stdin);
  } catch (e) {
    // leave as string
  }
  const result = __solve(input);
  if (result !== undefined) {
    if (typeof result === 'object') {
      console.log(JSON.stringify(result));
    } else {
      console.log(result);
    }
  }
} catch (e) {
  console.error(e);
  process.exit(1);
}
`;
  }
  
  const results = [];
  const tmpDir = os.tmpdir();
  
  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    const start = Date.now();
    
    const stdinStr = typeof t.input === "string" ? t.input : JSON.stringify(t.input);
    const expected = t.expectedOutput;
    
    let actualOutput = null;
    let passed = false;
    let runtimeError = null;
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    
    const execId = crypto.randomUUID();
    const fileName = langKey === 'java' ? `Main_${execId.replace(/-/g, '')}${langConfig.ext}` : `${execId}${langConfig.ext}`;
    const hostFilePath = sanitizeFilePath(path.join(tmpDir, fileName));
    const containerFilePath = `/tmp/${fileName}`;
    const hostInputPath = sanitizeFilePath(path.join(tmpDir, `${execId}.in`));
    const containerInputPath = `/tmp/${execId}.in`;

    try {
      await fs.writeFile(hostFilePath, finalSourceCode);
      await fs.writeFile(hostInputPath, stdinStr || "");

      // SECURE DOCKER COMMAND (Replaces Piston API)
      const dockerCmd = `docker run --rm -i --network none --memory 256m --cpus 0.5 -v ${hostFilePath}:${containerFilePath}:ro -v ${hostInputPath}:${containerInputPath}:ro ${langConfig.image} sh -c "${langConfig.getCmd(containerFilePath)} < ${containerInputPath}"`;

      let rawStdout = "";
      let rawStderr = "";
      let exitCode = 0;

      try {
        const { stdout: out, stderr: err } = await execPromise(dockerCmd, { timeout: timeoutMs });
        rawStdout = out;
        rawStderr = err;
      } catch (execErr) {
        if (execErr.killed || execErr.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
          timedOut = true;
          rawStderr = "Execution timed out";
        } else {
          rawStdout = execErr.stdout || "";
          rawStderr = execErr.stderr || "";
          exitCode = execErr.code || 1;
        }
      }

      // KEEPING ORIGINAL LIMIT ENFORCEMENT
      const MAX_LOG_LINES = 100;
      const MAX_TOTAL_LOG_CHARS = 10000;
      
      const enforceLimits = (text) => {
        if (!text) return "";
        let lines = text.split("\n");
        let truncated = false;
        if (lines.length > MAX_LOG_LINES) {
          lines = lines.slice(0, MAX_LOG_LINES);
          truncated = true;
        }
        let result = lines.join("\n");
        if (result.length > MAX_TOTAL_LOG_CHARS) {
          result = result.slice(0, MAX_TOTAL_LOG_CHARS);
          truncated = true;
        }
        if (truncated) {
          result += "\n[Output Truncated: exceeded log size or line limits]";
        }
        return result;
      };

      stdout = enforceLimits(rawStdout);
      stderr = enforceLimits(rawStderr);
      
      if (timedOut) {
        runtimeError = { message: "Execution timed out" };
      } else if (exitCode !== 0 || stderr) {
        runtimeError = { message: stderr || `Process exited with code ${exitCode}` };
      } else {
        actualOutput = stdout.trim();
        if (typeof expected === "string") {
          passed = actualOutput === String(expected).trim();
        } else {
          try {
            const parsedActual = JSON.parse(actualOutput);
            passed = JSON.stringify(parsedActual) === JSON.stringify(expected);
          } catch {
            passed = actualOutput === String(expected).trim();
          }
        }
      }
    } catch (e) {
      runtimeError = { message: e.message };
    } finally {
      await fs.unlink(hostFilePath).catch(() => {});
      await fs.unlink(hostInputPath).catch(() => {});
    }
    
    results.push({
      testName: t.name ?? `test_${i + 1}`,
      input: t.input,
      expectedOutput: expected,
      actualOutput: timedOut ? null : actualOutput,
      passed,
      durationMs: Date.now() - start,
      timedOut,
      runtimeError,
      transcript: showMySteps ? {
        stdout: truncate(stdout, maxOutputChars),
        stderr: truncate(stderr, maxOutputChars),
      } : undefined,
    });
  }
  
  return { ok: true, results, runtimeMeta: { timeoutMs, maxOutputChars, showMySteps } };
}

export async function runUserCode({ language, sourceCode, tests, timeoutMs = 2000, maxOutputChars = 20000, showMySteps = false }) {
  const MAX_CODE_LENGTH = 50000;
  
  if (!sourceCode || typeof sourceCode !== "string") {
    return { ok: false, error: "Source code must be a non-empty string." };
  }
  if (sourceCode.length > MAX_CODE_LENGTH) {
    return { ok: false, error: `Source code exceeds maximum length of ${MAX_CODE_LENGTH} characters.` };
  }

  const normalizedTests = Array.isArray(tests) ? tests.map(normalizeTestCase) : [];

  if (normalizedTests.length > 20) {
    return { ok: false, error: "Exceeded maximum allowed test cases (20)." };
  }

  return await runWithDocker({ language, sourceCode, tests: normalizedTests, timeoutMs, maxOutputChars, showMySteps });
}