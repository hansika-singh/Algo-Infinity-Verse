import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { execFile } from "child_process";
import fs from "fs/promises";
import path from "path";


// These are imported from server.js to reuse existing utilities
import { 
  sendJson, 
  readJsonBody, 
  getSession,
  updateExecutionStore,
  applyRateLimit,
  logErrorLimiter,
  appendToJsonArrayFile,
  CLIENT_ERRORS_FILE,
  DATA_DIR,
  MAX_CLIENT_ERROR_ENTRIES
} from "../../server.js";

import { instrumentJS } from "../../modules/code-tracer.js";

const JUDGE0_LANGUAGE_IDS = {
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

export async function getCsrfToken(req, res) {
  const secret = crypto.randomBytes(32).toString("hex");
  const token = crypto.createHmac("sha256", process.env.CSRF_SALT || "infinity-verse-secure-salt")
                      .update(secret)
                      .digest("hex");
  const isProd = process.env.NODE_ENV === "production";
  const cookieString = `csrfSecret=${secret}; HttpOnly; ${isProd ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=3600`;
  return sendJson(res, 200, { csrfToken: token }, { "Set-Cookie": cookieString });
}

export async function logError(req, res) {
  if (!applyRateLimit(req, res, logErrorLimiter, "Too many error reports. Please try again later.")) {
    return;
  }
  try {
    const payload = await readJsonBody(req);
    await appendToJsonArrayFile(CLIENT_ERRORS_FILE, payload, MAX_CLIENT_ERROR_ENTRIES);
    return sendJson(res, 200, { success: true });
  } catch (err) {
    console.error("Error logging client error:", err);
    return sendJson(res, 500, { error: "Failed to log error" });
  }
}

export async function executeCode(req, res) {
  try {
    const session = getSession(req);
    if (!session) {
      return sendJson(res, 401, {
        success: false,
        message: "Authentication required.",
      });
    }

    let payload;
    try {
      payload = await readJsonBody(req);
    } catch (err) {
      const tooLarge = err?.message === "Request body is too large.";
      return sendJson(res, tooLarge ? 413 : 400, {
        success: false,
        message: tooLarge ? "Request body is too large." : "Invalid JSON body.",
      });
    }
    const sourceCode = payload.sourceCode ?? payload.source_code;
    const originalCode = payload.originalCode;
    const { language, stdin } = payload;

    if (
      typeof sourceCode !== "string" ||
      !sourceCode.trim() ||
      typeof language !== "string" ||
      !language.trim()
    ) {
      return sendJson(res, 400, { success: false, message: 'Source code and language are required.' });
    }

    const languageId = JUDGE0_LANGUAGE_IDS[language.toLowerCase()];

    if (!languageId) {
       return sendJson(res, 400, { success: false, message: 'Unsupported language.' });
    }

    const JUDGE0_API = 'https://ce.judge0.com';
    const b64 = (s) => Buffer.from(s, 'utf-8').toString('base64');
    const d64 = (s) => s ? Buffer.from(s, 'base64').toString('utf-8') : '';

    const executionId = uuidv4();
    const startedAt = new Date().toISOString();

    let stdout = "", stderr = "", exitCode = 0, cpuTime = null, memory = null, execError = null;

    try {
      const submitRes = await fetch(`${JUDGE0_API}/submissions?base64_encoded=true&wait=false`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: b64(sourceCode),
          language_id: languageId,
          stdin: b64(stdin || ""),
          compiler_options: languageId === 54 ? '-std=c++17' : undefined,
        })
      });

      if (!submitRes.ok) {
        const errText = await submitRes.text();
        throw new Error(`Judge0 submission error: ${errText}`);
      }

      const { token } = await submitRes.json();
      if (!token) throw new Error('No submission token received from Judge0');

      let result;
      for (let i = 0; i < 50; i++) {
        await new Promise(r => setTimeout(r, 600));
        const pollRes = await fetch(`${JUDGE0_API}/submissions/${encodeURIComponent(token)}?base64_encoded=true`);
        if (!pollRes.ok) throw new Error(`Judge0 poll error: ${await pollRes.text()}`);
        result = await pollRes.json();
        if (result.status && result.status.id >= 3) break;
      }

      if (!result || (result.status && result.status.id < 3)) {
        throw new Error('Judge0 execution timed out');
      }

      stdout = d64(result.stdout);
      stderr = d64(result.stderr) || d64(result.compile_output) || '';
      exitCode = result.status?.id === 3 ? 0 : 1;
      cpuTime = result.time ?? null;
      memory = result.memory ?? null;
    } catch (fetchErr) {
      execError = fetchErr.message;
    }

    const execution = {
      id: executionId,
      userId: session.sub,
      sourceCode,
      originalCode,
      language,
      stdin: stdin || "",
      stdout,
      stderr,
      exitCode: execError ? 1 : exitCode,
      cpuTime,
      memory,
      error: execError,
      createdAt: startedAt,
      variableSnapshots: []
    };

    await updateExecutionStore((store) => {
      store.push(execution);
    });

    if (execError) {
      return sendJson(res, 500, {
          success: false,
          message: execError,
          executionId
      });
    }

    return sendJson(res, 200, {
        success: true,
        executionId,
        data: {
            output: stdout,
            stderr,
            memory,
            cpuTime
        }
    });
  } catch (error) {
      console.error('Server Execution Error:', error);
      return sendJson(res, 500, { success: false, message: 'Internal server proxy error.' });
  }
}

export async function executeTracedCode(req, res) {
  try {
    const session = getSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, message: "Authentication required." });
    }

    const payload = await readJsonBody(req);
    const sourceCode = payload.sourceCode ?? payload.source_code;
    const originalCode = payload.originalCode;
    const stdin = payload.stdin ?? "";

    if (!sourceCode || typeof sourceCode !== "string") {
      return sendJson(res, 400, { success: false, message: "Source code is required." });
    }

    const { instrumented, variableNames, error: instrumentError } = instrumentJS(sourceCode);
    if (instrumentError) {
      return sendJson(res, 400, { success: false, message: instrumentError });
    }

    const tmpFile = path.join(DATA_DIR, `__trace_${crypto.randomUUID()}.mjs`);
    let snapshots = [];
    let userOutput = "";
    let traceError = null;

    try {
      await fs.writeFile(tmpFile, instrumented, "utf8");
      await new Promise((resolve, reject) => {
        execFile(process.execPath, ["--permission", tmpFile], {
          timeout: 10000,
          maxBuffer: 1024 * 1024,
          env: {},
        }, (err, stdout, stderr) => {
          if (stdout) {
            try {
              const parsed = JSON.parse(stdout);
              if (parsed.snapshots && Array.isArray(parsed.snapshots)) {
                snapshots = parsed.snapshots;
                userOutput = (parsed.output || []).join("\n");
              } else {
                userOutput = stdout;
              }
            } catch {
              userOutput = stdout;
            }
          }

          if (err) {
            if (snapshots.length === 0) {
              reject(new Error(stderr || err.message));
            } else {
              resolve();
            }
          } else {
            resolve();
          }
        });
      });
    } catch (execError) {
      traceError = execError.message;
      userOutput = `Execution error: ${traceError}`;
    } finally {
      await fs.unlink(tmpFile).catch(() => {});
    }
    const executionId = uuidv4();
    const execution = {
      id: executionId,
      userId: session.sub,
      sourceCode,
      originalCode,
      language: "javascript",
      stdin,
      stdout: userOutput,
      stderr: traceError || "",
      exitCode: traceError ? 1 : 0,
      cpuTime: null,
      memory: null,
      error: traceError,
      createdAt: new Date().toISOString(),
      variableSnapshots: snapshots,
      traced: true,
    };

    await updateExecutionStore((store) => {
      store.push(execution);
    });

    return sendJson(res, 200, {
      success: !traceError,
      executionId,
      data: { output: userOutput },
      snapshots,
    });
  } catch (error) {
    console.error("Traced Execution Error:", error);
    return sendJson(res, 500, { success: false, message: "Traced execution failed." });
  }
}
