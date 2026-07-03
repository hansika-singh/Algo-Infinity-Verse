function truncate(str, max) {
  const s = String(str ?? "");
  if (!Number.isFinite(max) || max <= 0) return "";
  return s.length > max ? s.slice(0, max) + "\n[truncated]" : s;
}

function normalizeTestCase(t) {
  if (t == null || typeof t !== "object") {
    return {
      input: "",
      expectedOutput: "",
      name: undefined,
      show: true,
    };
  }

  if ("input" in t) {
    return {
      name: t.name ?? undefined,
      input: t.input,
      expectedOutput: t.expectedOutput ?? t.expected ?? "",
      isHidden: Boolean(t.isHidden),
    };
  }

  if ("stdin" in t) {
    return {
      name: t.name ?? undefined,
      input: t.stdin,
      expectedOutput: t.expected ?? "",
      isHidden: Boolean(t.isHidden),
    };
  }

  return {
    name: t.name ?? undefined,
    input: t.value ?? "",
    expectedOutput: t.expectedOutput ?? t.expected ?? "",
    isHidden: Boolean(t.isHidden),
  };
}

async function runWithPiston({ language, sourceCode, tests, timeoutMs, maxOutputChars, showMySteps }) {
  const versionMap = { python: "3.10.0", cpp: "10.2.0", javascript: "18.15.0" };
  const langIdMap = { python: "python", cpp: "c++", javascript: "javascript" };
  const langId = langIdMap[language] || language;
  
  let finalSourceCode = sourceCode;
  if (language === "javascript") {
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
    
    try {
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: langId,
          version: versionMap[language] || "*",
          files: [{ content: finalSourceCode }],
          stdin: stdinStr || "",
          compile_timeout: timeoutMs,
          run_timeout: timeoutMs,
        })
      });
      
      const data = await response.json();
      
      if (data.compile && data.compile.code !== 0) {
        runtimeError = { message: "Compilation Error:\n" + data.compile.stderr };
      } else if (data.run) {
        const rawStdout = data.run.stdout || "";
        const rawStderr = data.run.stderr || "";
        
        const MAX_LOG_LINES = 100;
        const MAX_TOTAL_LOG_CHARS = 10000;
        
        function enforceLimits(text) {
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
        }

        stdout = enforceLimits(rawStdout);
        stderr = enforceLimits(rawStderr);
        
        if (data.run.signal === "SIGKILL") {
          timedOut = true;
          runtimeError = { message: "Execution timed out" };
        } else if (data.run.code !== 0) {
          runtimeError = { message: stderr || `Process exited with code ${data.run.code}` };
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
      } else {
         runtimeError = { message: data.message || "Unknown error" };
      }
    } catch (e) {
      runtimeError = { message: e.message };
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
  
  return {
    ok: true,
    results,
    runtimeMeta: { timeoutMs, maxOutputChars, showMySteps }
  };
}

export async function runUserCode({
  language,
  sourceCode,
  tests,
  timeoutMs = 1000,
  maxOutputChars = 20000,
  showMySteps = false,
}) {
  const MAX_CODE_LENGTH = 50000; // 50KB limit
  
  if (!sourceCode || typeof sourceCode !== "string") {
    return { ok: false, error: "Source code must be a non-empty string." };
  }
  if (sourceCode.length > MAX_CODE_LENGTH) {
    return { ok: false, error: `Source code exceeds maximum length of ${MAX_CODE_LENGTH} characters.` };
  }

  const normalizedTests = Array.isArray(tests) ? tests.map(normalizeTestCase) : [];

  // Route supported languages to Piston
  if (language === "python" || language === "cpp" || language === "javascript") {
    return await runWithPiston({
      language,
      sourceCode,
      tests: normalizedTests,
      timeoutMs,
      maxOutputChars,
      showMySteps,
    });
  }

  return {
    ok: false,
    error: `Unsupported language for MVP sandbox: ${language}`,
  };
}
