let currentProblem = null;
let _running = false;

const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? window.location.origin
  : '';

function getDefaultCode(lang, problem) {
  const fnName = problem.functionName || "solution";
  const params = problem.params || [];
  const tc = problem.testCases?.[0];

  const isClass = /^[A-Z]/.test(fnName);
  if (isClass) {
    return getClassTemplate(lang, problem);
  }

  const paramTypes = tc?.input ? tc.input.map(v => mapType(j2t(v), lang)) : [];
  const retType = tc?.expected !== undefined ? mapType(j2t(tc.expected), lang) : 'auto';

  const paramStr = params.length
    ? params.map((p, i) => {
        const t = paramTypes[i] || 'auto';
        if (lang === 'cpp') return t + ' ' + p;
        if (lang === 'c') {
          const origJt = tc?.input ? j2t(tc.input[i]) : null;
          const is2d = origJt === 'int[][]';
          const isArray = origJt && origJt.endsWith('[]');
          if (is2d) return t + ' ' + p + ', int* ' + p + 'Sizes, int ' + p + 'Size';
          if (isArray) return t + ' ' + p + ', int ' + p + 'Size';
          return t + ' ' + p;
        }
        if (lang === 'java') return t + ' ' + p;
        if (lang === 'swift') return '_ ' + p + ': ' + t;
        return p;
      }).join(', ')
    : 'params';

  let docComment = '';
  if (problem.guide) {
    const lines = problem.guide.split('\n');
    const prefix = lang === 'python' ? '# ' : '// ';
    docComment = lines.map(l => prefix + l).join('\n') + '\n';
  }

  const templates = {
    javascript: docComment + "function " + fnName + "(" + (params.join(', ') || 'params') + ") {\n    \n}",
    python: docComment + "def " + fnName + "(" + (params.join(', ') || 'params') + "):\n    pass\n",
    java: "class Solution {\n" + docComment.replace(/^(.)/gm, '    $1') + "    public " + retType + " " + fnName + "(" + paramStr + ") {\n        \n    }\n}",
    cpp: '#include <string>\n#include <stack>\nusing namespace std;\n\n' + docComment + retType + " " + fnName + "(" + paramStr + ") {\n    \n}",
    c: '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdbool.h>\n\n' + docComment + retType + " " + fnName + "(" + paramStr + ") {\n    \n}",
    swift: docComment + "func " + fnName + "(" + paramStr + ") -> " + retType + " {\n    \n}"
  };
  return templates[lang] || templates.javascript;
}

function getClassTemplate(lang, problem) {
  const fnName = problem.functionName || "LRUCache";
  const params = problem.params || [];

  let docComment = '';
  if (problem.guide) {
    const lines = problem.guide.split('\n');
    const prefix = lang === 'python' ? '# ' : '// ';
    docComment = lines.map(l => prefix + l).join('\n') + '\n';
  }

  const paramStr = params.map((p, i) => {
    const t = mapType('int', lang);
    if (lang === 'cpp') return t + ' ' + p;
    if (lang === 'java') return t + ' ' + p;
    if (lang === 'swift') return '_ ' + p + ': ' + t;
    return p;
  }).join(', ');

  const templates = {
    javascript: docComment + `class ${fnName} {\n    constructor(${paramStr}) {\n        \n    }\n\n    get(key) {\n        \n    }\n\n    put(key, value) {\n        \n    }\n}`,
    python: docComment + `class ${fnName}:\n    def __init__(self, ${params.join(', ')}):\n        pass\n\n    def get(self, key: int) -> int:\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass\n`,
    java: `class ${fnName} {\n${docComment.replace(/^(.)/gm, '    $1')}    public ${fnName}(${paramStr}) {\n        \n    }\n\n    public int get(int key) {\n        return 0;\n    }\n\n    public void put(int key, int value) {\n        \n    }\n}`,
    cpp: `#include <unordered_map>\nusing namespace std;\n\n${docComment}class ${fnName} {\npublic:\n    ${fnName}(${paramStr}) {\n        \n    }\n\n    int get(int key) {\n        return 0;\n    }\n\n    void put(int key, int value) {\n        \n    }\n};`,
    c: `${docComment}// Use a struct with function pointers:\ntypedef struct {\n    int capacity;\n} LRUCache;\n\nLRUCache* createLRUCache(int capacity) {\n    return NULL;\n}\n\nint get(LRUCache* cache, int key) {\n    return 0;\n}\n\nvoid put(LRUCache* cache, int key, int value) {\n    \n}`,
    swift: docComment + `class ${fnName} {\n    init(${paramStr}) {\n        \n    }\n\n    func get(_ key: Int) -> Int {\n        return 0\n    }\n\n    func put(_ key: Int, _ value: Int) {\n        \n    }\n}`
  };
  return templates[lang] || templates.javascript;
}

function buildHarnessCode(code, lang, functionName, testCases, problem) {
  const isClass = problem ? /^[A-Z]/.test(problem.functionName || "") : /^[A-Z]/.test(functionName);
  const tcJson = JSON.stringify(testCases);
  if (lang === "javascript") {
    const clsCheck = isClass ? 'true' : 'false';
    return code + `\n\nconst __TC__ = ${tcJson};\nconst __RES__ = [];\nfor (let i = 0; i < __TC__.length; i++) {\n  const tc = __TC__[i];\n  try {\n    let result;\n    if (${clsCheck}) {\n      const instance = new ${functionName}(...tc.input);\n      if (tc.methods && Array.isArray(tc.methods)) {\n        result = instance;\n        for (const m of tc.methods) {\n          result = instance[m[0]](...m.slice(1));\n        }\n      } else {\n        result = instance;\n      }\n    } else {\n      result = ${functionName}(...tc.input);\n    }\n    const passed = ${clsCheck} ? (tc.methods ? JSON.stringify(result) === JSON.stringify(tc.expected) : true) : JSON.stringify(result) === JSON.stringify(tc.expected);\n    __RES__.push({ index: i, ran: true, passed, actual: ${clsCheck} ? (tc.methods ? result : "instance") : result, expected: tc.expected, input: tc.input, error: null });\n  } catch (e) {\n    __RES__.push({ index: i, ran: true, passed: false, actual: null, expected: tc.expected, input: tc.input, error: e.message });\n  }\n}\nconsole.log("__RESULT__:" + JSON.stringify(__RES__));`;
  }
  if (lang === "python") {
    const esc = tcJson.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const clsCheck = isClass ? 'True' : 'False';
    return `${code}\n\nimport json\n__TC__ = json.loads('${esc}')\n__RES__ = []\nfor i, tc in enumerate(__TC__):\n    try:\n        instance = ${functionName}(*tc["input"])\n        if ${clsCheck} and tc.get("methods"):\n            result = instance\n            for m in tc["methods"]:\n                result = getattr(instance, m[0])(*m[1:])\n        elif ${clsCheck}:\n            result = instance\n        else:\n            result = ${functionName}(*tc["input"])\n        passed = True if ${clsCheck} and not tc.get("methods") else json.dumps(result, default=str) == json.dumps(tc["expected"], default=str)\n        __RES__.append({"index": i, "ran": True, "passed": passed, "actual": str(result) if ${clsCheck} and not tc.get("methods") else result, "expected": tc["expected"], "input": tc["input"], "error": None})\n    except Exception as e:\n        __RES__.append({"index": i, "ran": True, "passed": False, "actual": None, "expected": tc["expected"], "input": tc["input"], "error": str(e)})\nprint("__RESULT__:" + json.dumps(__RES__, default=str))`;
  }
  if (lang === "cpp") {
    return genCppHarness(code, functionName, testCases, isClass);
  }
  if (lang === "java") {
    return genJavaHarness(code, functionName, testCases, isClass);
  }
  if (lang === "c") {
    return genCHarness(code, functionName, testCases, isClass);
  }
  if (lang === "swift") {
    return genSwiftHarness(code, functionName, testCases, isClass);
  }
  return code;
}

function generateExamples(problem) {
  const examples = { 1: `<strong>Example 1:</strong><br>Input: nums = [2,7,11,15], target = 9<br>Output: [0,1]<br><br><strong>Follow-up:</strong> Can you solve it in O(n) using a Hash Map?`, 2: `<strong>Example 1:</strong><br>Input: s = "()"<br>Output: true<br><br><strong>Follow-up:</strong> Can you solve it in O(n) using a Stack?`, 3: `<strong>Example 1:</strong><br>Input: list1 = [1,2,4], list2 = [1,3,4]<br>Output: [1,1,2,3,4,4]<br><br><strong>Follow-up:</strong> Can you solve it both iteratively and recursively?`, 4: `<strong>Example 1:</strong><br>Input: nums = [-2,1,-3,4,-1,2,1,-5,4]<br>Output: 6<br><br><strong>Follow-up:</strong> Can you solve it using Kadane's Algorithm in O(n)?`, 6: `<strong>Example 1:</strong><br>Input: adjList = [[2,4],[1,3],[2,4],[1,3]]<br>Output: [[2,4],[1,3],[2,4],[1,3]]<br><br><strong>Follow-up:</strong> Can you solve it using both BFS and DFS approaches?`, 7: `<strong>Example 1:</strong><br>Input: nums = [10,9,2,5,3,7,101,18]<br>Output: 4<br><br><strong>Follow-up:</strong> Can you improve from O(n²) to O(n log n) using binary search?`, 9: `<strong>Example 1:</strong><br>Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]<br>Output: 6<br><br><strong>Follow-up:</strong> Can you solve it in O(n) time and O(1) space using the two-pointer technique?`, 10: `<strong>Example 1:</strong><br>Input: head = [1,2,3,4,5]<br>Output: [5,4,3,2,1]<br><br><strong>Follow-up:</strong> Can you solve it both iteratively and recursively?`, 11: `<strong>Example 1:</strong><br>Input: root = [4,2,7,1,3,6,9]<br>Output: [4,7,2,9,6,3,1]<br><br><strong>Follow-up:</strong> Can you solve it both recursively and iteratively using a queue or stack?`, 12: `<strong>Example 1:</strong><br>Input: root = [2,1,3]<br>Output: true<br><br><strong>Follow-up:</strong> Can you solve it without recursion using iterative inorder traversal?`, 14: `<strong>Example 1:</strong><br>Input: nums = [1,2,3,1]<br>Output: 4<br><br><strong>Follow-up:</strong> Can you solve it in O(n) time and O(1) space?` };
  return examples[problem.id] || "<strong>Example:</strong><br>Solve this problem";
}

function generateTestCases(problem) {
  return problem.testCases || [];
}

function renderTestCases(testCases, results) {
  const container = document.getElementById("quizTestCasesContainer");
  if (!container) return;
  if (results) {
    container.innerHTML = testCases.map((tc, i) => {
      const r = results[i] || {};
      const passed = r.passed;
      const statusClass = passed ? 'passed' : 'failed';
      const icon = passed ? '✓' : '✗';
      const label = passed ? 'PASS' : 'FAIL';
      const actualStr = r.actual !== undefined && r.actual !== null ? JSON.stringify(r.actual) : '';
      const errorStr = r.error || '';
      return `<div class="test-case ${r.ran ? statusClass : ''}">
        <div class="test-case-header">
          <span class="test-case-name">Test ${i + 1}</span>
          <span class="test-case-result ${r.ran ? statusClass : 'pending'}">
            ${r.ran ? `${icon} ${label}` : '⏳ Pending'}
          </span>
        </div>
        <div class="test-case-details">
          <div class="test-case-input">Input: <code>${Array.isArray(tc.input) ? tc.input.map(v => JSON.stringify(v)).join(', ') : JSON.stringify(tc.input)}</code></div>
          <div class="test-case-expected">Expected: <code>${JSON.stringify(tc.expected)}</code></div>
          ${r.ran && (passed !== undefined) ? `<div class="test-case-actual">Actual: <code>${actualStr || errorStr}</code></div>` : ''}
        </div>
      </div>`;
    }).join("");
  } else {
    container.innerHTML = testCases.map((tc, i) => `
      <div class="test-case">
        <div class="test-case-header">
          <span class="test-case-name">Test ${i + 1}</span>
          <span class="test-case-result pending">⏳ Pending</span>
        </div>
        <div class="test-case-details">
          <div class="test-case-input">Input: <code>${Array.isArray(tc.input) ? tc.input.map(v => JSON.stringify(v)).join(', ') : JSON.stringify(tc.input)}</code></div>
          <div class="test-case-expected">Expected: <code>${JSON.stringify(tc.expected)}</code></div>
        </div>
      </div>
    `).join("");
  }
}

function clearQuizOutput() {
  const el = document.getElementById("quizOutputContent");
  if (el) el.innerHTML = '<p class="output-placeholder">Run your code to see output...</p>';
}

function executeCode(code, lang, problem) {
  const testCases = generateTestCases(problem);
  if (!testCases || testCases.length === 0) {
    return Promise.resolve({ allPassed: false, testResults: [], rawOutput: "This problem has no automated test cases." });
  }
  const fnName = problem.functionName || "solution";
  const harnessCode = buildHarnessCode(code, lang, fnName, testCases, problem);
  return executeViaApi(lang, harnessCode, code).then(result => {
    const stdout = result.stdout;
    const memory = result.memory;
    const cpuTime = result.cpuTime;
    const parsedResults = parseTestResults(stdout, testCases.length);
    parsedResults.metrics = { memory: memory || "N/A", cpuTime: cpuTime || "N/A" };
    return parsedResults;
  }).catch(async (e) => {
    if (lang === "javascript" && window.isAiInterviewerActive) {
      try {
        const { executeSandboxedCode } = await import('./modules/code-executor.js');
        const logs = await executeSandboxedCode(harnessCode, 5000);
        return parseTestResults(logs.join("\n"), testCases.length);
      } catch (sandboxErr) {
        return { allPassed: false, testResults: testCases.map(() => ({ ran: false, passed: false, error: sandboxErr.message })), rawOutput: sandboxErr.message };
      }
    } else {
      return { allPassed: false, testResults: testCases.map(() => ({ ran: false, passed: false, error: e.message })), rawOutput: e.message };
    }
  });
}

function executeViaApi(lang, code, originalCode) {
  return fetch(`${API_BASE}/api/execute`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceCode: code, originalCode: originalCode, language: lang, stdin: "" })
  }).then(response => {
    if (!response.ok) {
      return response.json().catch(() => ({ message: "Execution API error (" + response.status + ")" })).then(err => { throw new Error(err.message || "Failed to execute code"); });
    }
    return response.json();
  }).then(result => {
    if (!result.success) throw new Error(result.message || "Execution failed");
    return { stdout: result.data.output || "", stderr: "", memory: result.data.memory, cpuTime: result.data.cpuTime };
  });
}

function parseTestResults(stdout, testCount) {
  const marker = "__RESULT__:";
  const pos = stdout.lastIndexOf(marker);
  if (pos !== -1) {
    const raw = stdout.substring(0, pos).trim();
    const json = stdout.substring(pos + marker.length).trim();
    try {
      const parsed = JSON.parse(json);
      const testResults = Array.isArray(parsed) ? parsed : [];
      const allPassed = testResults.length > 0 && testResults.every(r => r.passed);
      return { allPassed, testResults, rawOutput: raw };
    } catch (e) { /* fall through */ }
  }
  return { allPassed: false, testResults: Array(testCount).fill({ ran: false, passed: false, error: "No test result marker found" }), rawOutput: stdout };
}

function createSandboxWorker(harnessCode) {
  const blob = new Blob([`self.onmessage=function(e){let logs=[],origLog=console.log;console.log=function(){for(let _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++)args[_key]=arguments[_key];logs.push(args.map(String).join(" "))};try{eval(e.data);self.postMessage({success:true,logs})}catch(error){self.postMessage({success:false,error:error.message,logs})}finally{console.log=origLog}};`], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  return { worker, url };
}

function runWorker(harnessCode, timeoutMs) {
  return new Promise((resolve, reject) => {
    const { worker, url } = createSandboxWorker(harnessCode);
    const timer = setTimeout(() => { worker.terminate(); URL.revokeObjectURL(url); reject(new Error("Execution timed out (> " + (timeoutMs / 1000) + "s)")); }, timeoutMs);
    worker.onmessage = (e) => { clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(url); resolve(e.data); };
    worker.onerror = (e) => { clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(url); reject(new Error(e.message || "Worker error")); };
    worker.postMessage(harnessCode);
  });
}

function setOutput(text, type) {
  const el = document.getElementById("quizOutputContent");
  if (!el) return;
  
  if (type === "running") {
    el.innerHTML = '<p class="output-running">⏳ Running code...</p>';
    return;
  }
  
  el.innerHTML = '';
  const pre = document.createElement("pre");
  
  if (type === "error") {
    pre.className = "output-error";
    pre.textContent = "❌ Error:\n" + text;
  } else if (type === "success") {
    pre.className = "output-success";
    pre.textContent = "✅ " + text;
  } else {
    pre.textContent = text;
  }
  
  el.appendChild(pre);
}

function getProblemSignature(problem) {
  return JSON.stringify({ fn: problem.functionName, params: problem.params, guide: problem.guide, tc: problem.testCases });
}

function saveEditorDraft(problemId, code, signature) {
  try {
    localStorage.setItem(`editorDraft_${problemId}`, code);
    if (signature) localStorage.setItem(`editorDraft_sig_${problemId}`, signature);
  } catch (e) { void 0; }
}

function getEditorDraft(problemId) { try { return localStorage.getItem(`editorDraft_${problemId}`); } catch (e) { return null; } }
function getEditorDraftSignature(problemId) { try { return localStorage.getItem(`editorDraft_sig_${problemId}`); } catch (e) { return null; } }

function clearEditorDraft(problemId) {
  try {
    localStorage.removeItem(`editorDraft_${problemId}`);
    localStorage.removeItem(`editorDraft_sig_${problemId}`);
  } catch (e) { void 0; }
}

function getXPForDifficulty(difficulty) { const map = { easy: 100, medium: 250, hard: 500 }; return map[difficulty.toLowerCase()] || 100; }

function mapType(jt, lang) {
  const m = {
    'int[]':  { java: 'int[]', cpp: 'vector<int>', c: 'int*', swift: '[Int]' },
    'int[][]': { java: 'int[][]', cpp: 'vector<vector<int>>', c: 'int**', swift: '[[Int]]' },
    'string[]': { java: 'String[]', cpp: 'vector<string>', c: 'char**', swift: '[String]' },
    'string[][]': { java: 'String[][]', cpp: 'vector<vector<string>>', c: 'char***', swift: '[[String]]' },
    'bool[]': { java: 'boolean[]', cpp: 'vector<bool>', c: 'int*', swift: '[Bool]' },
    'bool[][]': { java: 'boolean[][]', cpp: 'vector<vector<bool>>', c: 'int**', swift: '[[Bool]]' },
    'int':    { java: 'int', cpp: 'int', c: 'int', swift: 'Int' },
    'string': { java: 'String', cpp: 'string', c: 'char*', swift: 'String' },
    'bool':   { java: 'boolean', cpp: 'bool', c: 'int', swift: 'Bool' },
  };
  return m[jt]?.[lang] || 'auto';
}

function j2t(v) {
  if (v === null || v === undefined) return 'null';
  if (Array.isArray(v)) {
    if (v.length === 0) return 'int[]';
    const inner = j2t(v[0]);
    if (inner === 'null') return 'int[]';
    return inner + '[]';
  }
  if (typeof v === 'number') return 'int';
  if (typeof v === 'string') return 'string';
  if (typeof v === 'boolean') return 'bool';
  return 'int';
}

function valToLit(v, t) {
  if (t === 'int[]') return '[' + v.map(x => x === null || x === undefined ? 0 : x).join(',') + ']';
  if (t === 'string') return '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  if (t === 'bool') return v ? 'true' : 'false';
  if (t === 'string[]') return '[' + v.map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + ']';
  if (t === 'string[][]') return '[' + v.map(row => '[' + row.map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + ']').join(',') + ']';
  return String(v);
}

function genCppHarness(code, fn, tcs, isClass) {
  const outType = j2t(tcs[0].expected);
  const inTypes = tcs[0].input.map(v => j2t(v));
  let s = '#include <iostream>\n#include <string>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\n';
  s += code + '\n\n';
  s += 'string __j(bool v) { return v ? "true" : "false"; }\n';
  s += 'string __j(int v) { return to_string(v); }\n';
  s += 'string __j(const string& v) { return "\\"" + v + "\\""; }\n';
  s += 'template<typename T>\nstring __j(const vector<T>& v) {\n  if (v.empty()) return "[]";\n  stringstream ss;\n  ss << "[" << __j(v[0]);\n  for (size_t i=1;i<v.size();i++) ss << "," << __j(v[i]);\n  ss << "]";\n  return ss.str();\n}\n';
  s += 'int main() {\n  cout << "__RESULT__:";\n  cout << "[";\n';
  for (let i = 0; i < tcs.length; i++) {
    if (i > 0) s += '  cout << ",";\n';
    s += '  try {\n';
    let callArgs = '';
    for (let j = 0; j < inTypes.length; j++) {
      if (j > 0) callArgs += ', ';
      if (inTypes[j] === 'int[]') callArgs += 'vector<int>{' + tcs[i].input[j].map(x => x === null || x === undefined ? 0 : x).join(',') + '}';
      else if (inTypes[j] === 'int[][]') callArgs += 'vector<vector<int>>{' + tcs[i].input[j].map(row => '{' + row.join(',') + '}').join(',') + '}';
      else if (inTypes[j] === 'string[]') callArgs += 'vector<string>{' + tcs[i].input[j].map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '}';
      else if (inTypes[j] === 'string[][]') callArgs += 'vector<vector<string>>{' + tcs[i].input[j].map(row => '{' + row.map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '}').join(',') + '}';
      else callArgs += valToLit(tcs[i].input[j], inTypes[j]);
    }
    s += '    auto __r = ' + fn + '(' + callArgs + ');\n';
    s += '    cout << "{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":";\n';
    let compExpr = '"false"';
    if (outType === 'int[]') compExpr = '(__r == vector<int>{' + tcs[i].expected.map(x => x === null || x === undefined ? 0 : x).join(',') + '} ? "true" : "false")';
    else if (outType === 'int[][]') compExpr = '(__r == vector<vector<int>>{' + tcs[i].expected.map(row => '{' + row.join(',') + '}').join(',') + '} ? "true" : "false")';
    else if (outType === 'int') compExpr = '(__r == ' + valToLit(tcs[i].expected, outType) + ' ? "true" : "false")';
    else if (outType === 'string') compExpr = '(__r == ' + valToLit(tcs[i].expected, outType) + ' ? "true" : "false")';
    else if (outType === 'bool') compExpr = '(__r == ' + valToLit(tcs[i].expected, outType) + ' ? "true" : "false")';
    else compExpr = '"false"';
    s += '    cout << ' + compExpr + ';\n';
    s += '    cout << ",\\"actual\\":" << __j(__r);\n';
    s += '    cout << "}" << flush;\n';
    s += '  } catch (...) {\n';
    s += '    cout << "{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":false,\\"error\\":\\"exception\\"}" << flush;\n';
    s += '  }\n';
  }
  s += '  cout << "]" << endl;\n  return 0;\n}\n';
  return s;
}

function genJavaHarness(code, fn, tcs, isClass) {
  const outType = j2t(tcs[0].expected);
  const inTypes = tcs[0].input.map(v => j2t(v));
  const javaType = outType === 'int[]' ? 'int[]' : outType === 'int[][]' ? 'int[][]' : outType === 'string' ? 'String' : outType === 'bool' ? 'boolean' : 'int';
  let s = code + '\n\nclass Main {\n';
  s += '  static String __j(boolean v) { return String.valueOf(v); }\n';
  s += '  static String __j(int v) { return String.valueOf(v); }\n';
  s += '  static String __j(String v) { return v == null ? "null" : "\\"" + v + "\\""; }\n';
  s += '  static String __j(int[] v) {\n    if (v == null) return "null";\n    StringBuilder sb = new StringBuilder("[");\n    for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(","); sb.append(v[i]); }\n    sb.append("]");\n    return sb.toString();\n  }\n';
  s += '  static boolean __eq(int[] a, int[] b) {\n    if (a == null && b == null) return true;\n    if (a == null || b == null || a.length != b.length) return false;\n    for (int i = 0; i < a.length; i++) if (a[i] != b[i]) return false;\n    return true;\n  }\n';
  if (outType === 'int[][]') {
    s += '  static String __j(int[][] v) {\n    if (v == null) return "null";\n    StringBuilder sb = new StringBuilder("[");\n    for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(","); sb.append(__j(v[i])); }\n    sb.append("]");\n    return sb.toString();\n  }\n';
    s += '  static boolean __eq(int[][] a, int[][] b) {\n    if (a == null && b == null) return true;\n    if (a == null || b == null || a.length != b.length) return false;\n    for (int i = 0; i < a.length; i++) if (!__eq(a[i], b[i])) return false;\n    return true;\n  }\n';
  }
  s += '  public static void main(String[] args) {\n    StringBuilder __res = new StringBuilder("[");\n';
  for (let i = 0; i < tcs.length; i++) {
    if (i > 0) s += '    __res.append(",");\n';
    s += '    try {\n';
    let callArgs = '';
    for (let j = 0; j < inTypes.length; j++) {
      if (j > 0) callArgs += ', ';
      if (inTypes[j] === 'int[]') callArgs += 'new int[]{' + tcs[i].input[j].map(x => x === null || x === undefined ? 0 : x).join(',') + '}';
      else if (inTypes[j] === 'int[][]') callArgs += 'new int[][]{' + tcs[i].input[j].map(row => '{' + row.join(',') + '}').join(',') + '}';
      else if (inTypes[j] === 'string[]') callArgs += 'new String[]{' + tcs[i].input[j].map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '}';
      else if (inTypes[j] === 'string[][]') callArgs += 'new String[][]{' + tcs[i].input[j].map(row => '{' + row.map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '}').join(',') + '}';
      else callArgs += valToLit(tcs[i].input[j], inTypes[j]);
    }
    s += '      ' + javaType + ' __r = new Solution().' + fn + '(' + callArgs + ');\n';
    if (outType === 'int[]') s += '      boolean __p = __eq(__r, new int[]{' + tcs[i].expected.map(x => x === null || x === undefined ? 0 : x).join(',') + '});\n';
    else if (outType === 'int[][]') s += '      boolean __p = __eq(__r, new int[][]{' + tcs[i].expected.map(row => '{' + row.join(',') + '}').join(',') + '});\n';
    else s += '      boolean __p = __r == ' + valToLit(tcs[i].expected, outType) + ';\n';
    s += '      __res.append("{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":" + __p + ",\\"actual\\":" + __j(__r) + "}");\n';
    s += '    } catch (Exception e) {\n';
    s += '      __res.append("{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":false,\\"error\\":\\"" + (e.getMessage() != null ? e.getMessage().replace("\\"","\'") : "null") + "\\"}");\n';
    s += '    }\n';
  }
  s += '    __res.append("]");\n    System.out.println("__RESULT__:" + __res.toString());\n  }\n}\n';
  return s;
}

function genCHarness(code, fn, tcs, isClass) {
  const outType = j2t(tcs[0].expected);
  const inTypes = tcs[0].input.map(v => j2t(v));
  let s = '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdbool.h>\n\n';
  s += code + '\n\n';
  if (outType === 'int[]') {
    s += 'void __j(int* v, int n, char* buf) {\n  if (v == NULL) { strcpy(buf, "null"); return; }\n  buf[0] = \'[\'; int pos = 1;\n  for (int i = 0; i < n; i++) { if (i > 0) buf[pos++] = \',\'; pos += sprintf(buf + pos, "%d", v[i]); }\n  buf[pos++] = \']\'; buf[pos] = 0;\n}\n';
    s += 'int __eq(int* a, int* b, int n) {\n  if (n == 0) return 1;\n  if (a == NULL && b == NULL) return 1;\n  if (a == NULL || b == NULL) return 0;\n  for (int i = 0; i < n; i++) if (a[i] != b[i]) return 0;\n  return 1;\n}\n';
  }
  s += 'int main() {\n  printf("__RESULT__:[");\n';
  for (let i = 0; i < tcs.length; i++) {
    if (i > 0) s += '  printf(",");\n';
    s += '  {\n';
    let callArgs = '';
    for (let j = 0; j < inTypes.length; j++) {
      if (j > 0) callArgs += ', ';
      if (inTypes[j] === 'int[]') {
        const arr = tcs[i].input[j];
        if (arr.length === 0) callArgs += 'NULL, 0';
        else callArgs += '(int[]){' + arr.map(x => x).join(',') + '}, ' + arr.length;
      } else if (inTypes[j] === 'int[][]') {
        const arr = tcs[i].input[j];
        if (arr.length === 0) callArgs += 'NULL, NULL, 0';
        else {
          const rows = arr.map(row => row.length === 0 ? 'NULL' : '(int[]){' + row.join(',') + '}').join(',');
          const sizes = arr.map(row => row.length).join(',');
          callArgs += '(int*[]){' + rows + '}, (int[]){' + sizes + '}, ' + arr.length;
        }
      } else callArgs += valToLit(tcs[i].input[j], inTypes[j]);
    }
    if (isClass) s += '  printf("{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":true,\\"actual\\":\\"instance\\"}");\n';
    else if (outType === 'int[]') {
      const exp = tcs[i].expected;
      const expLen = Array.isArray(exp) ? exp.length : 1;
      s += '  printf("{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":");\n';
      s += '  int* __r = ' + fn + '(' + callArgs + ');\n';
      if (expLen === 0) s += '  int __p = __eq(__r, NULL, 0);\n';
      else s += '  int __p = __eq(__r, (int[]){' + exp.map(x => x === null || x === undefined ? 0 : x).join(',') + '}, ' + expLen + ');\n';
      s += '  printf(__p ? "true" : "false");\n  printf(",\\"actual\\":");\n  char __buf[256]; __j(__r, ' + expLen + ', __buf); printf("%s", __buf);\n  printf("}");\n';
    } else {
      const cType = outType === 'string' ? 'char*' : 'int';
      s += '  printf("{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":");\n';
      s += '  ' + cType + ' __r = ' + fn + '(' + callArgs + ');\n';
      if (outType === 'string') {
        const expStr = valToLit(tcs[i].expected, outType);
        s += '  int __p = __r && ' + expStr + ' && strcmp(__r, ' + expStr + ') == 0;\n';
      } else s += '  int __p = __r == ' + valToLit(tcs[i].expected, outType) + ';\n';
      s += '  printf(__p ? "true" : "false");\n  printf(",\\"actual\\":");\n';
      if (outType === 'string') s += '  printf(__r ? "\\"%s\\"" : "null", __r);\n';
      else if (outType === 'bool') s += '  printf(__r ? "true" : "false");\n';
      else s += '  printf("%d", __r);\n';
      s += '  printf("}");\n';
    }
    s += '  }\n';
  }
  s += '  printf("]\\n");\n  return 0;\n}\n';
  return s;
}

function genSwiftHarness(code, fn, tcs, isClass) {
  const outType = j2t(tcs[0].expected);
  const inTypes = tcs[0].input.map(v => j2t(v));
  let s = 'import Foundation\n\n';
  s += code + '\n\n';
  s += 'func __j(_ v: Int) -> String { return String(v) }\n';
  s += 'func __j(_ v: Bool) -> String { return v ? "true" : "false" }\n';
  s += 'func __j(_ v: String) -> String { return "\\"\\(v)\\"" }\n';
  if (outType === 'int[]' || outType === 'int[][]') {
    s += 'func __j(_ v: [Int]) -> String {\n  if v.isEmpty { return "[]" }\n  return "[" + v.map(String.init).joined(separator: ",") + "]"\n}\n';
  }
  if (outType === 'int[][]') {
    s += 'func __j(_ v: [[Int]]) -> String {\n  return "[" + v.map { __j($0) }.joined(separator: ",") + "]"\n}\n';
  }
  s += 'let __res = "["\n';
  for (let i = 0; i < tcs.length; i++) {
    if (i > 0) s += '__res += ","\n';
    s += 'do {\n';
    let callArgs = '';
    for (let j = 0; j < inTypes.length; j++) {
      if (j > 0) callArgs += ', ';
      if (inTypes[j] === 'int[]') callArgs += '[' + tcs[i].input[j].map(x => x === null || x === undefined ? 0 : x).join(',') + '] as [Int]';
      else if (inTypes[j] === 'int[][]') callArgs += '[' + tcs[i].input[j].map(row => '[' + row.join(',') + ']').join(',') + '] as [[Int]]';
      else if (inTypes[j] === 'string[]') callArgs += '[' + tcs[i].input[j].map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '] as [String]';
      else if (inTypes[j] === 'string[][]') callArgs += '[' + tcs[i].input[j].map(row => '[' + row.map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + ']').join(',') + '] as [[String]]';
      else callArgs += valToLit(tcs[i].input[j], inTypes[j]);
    }
    s += '  let __r = ' + fn + '(' + callArgs + ')\n';
    if (outType === 'int[]') s += '  let __p = __r == [' + tcs[i].expected.map(x => x === null || x === undefined ? 0 : x).join(',') + ']\n';
    else if (outType === 'int[][]') s += '  let __p = __r == [' + tcs[i].expected.map(row => '[' + row.join(',') + ']').join(',') + ']\n';
    else s += '  let __p = __r == ' + valToLit(tcs[i].expected, outType) + '\n';
    s += '  __res += "{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":" + (__p ? "true" : "false") + ",\\"actual\\":" + __j(__r) + "}"\n';
    s += '} catch {\n';
    s += '  __res += "{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":false,\\"error\\":\\"exception\\"}"\n';
    s += '}\n';
  }
  s += '__res += "]"\nprint("__RESULT__:" + __res)\n';
  return s;
}

function updateLineNumbers() {
  const editor = document.getElementById("codeEditor");
  const lineNumbers = document.getElementById("lineNumbers");
  if (!editor || !lineNumbers) return;
  const lines = editor.value.split("\n").length;
  lineNumbers.innerHTML = Array.from({ length: Math.max(lines, 1) }, (_, i) => i + 1).join("\n");
}

function syncScroll() {
  const editor = document.getElementById("codeEditor");
  const lineNumbers = document.getElementById("lineNumbers");
  const highlight = document.getElementById('syntaxHighlight');
  if (editor) { if (lineNumbers) lineNumbers.scrollTop = editor.scrollTop; if (highlight) { highlight.scrollTop = editor.scrollTop; highlight.scrollLeft = editor.scrollLeft; } }
  if (typeof updateCurrentLineHighlight === 'function') updateCurrentLineHighlight();
}

function updateEditorDisplayMode() {
  const editor = document.getElementById('codeEditor');
  const highlight = document.getElementById('syntaxHighlight');
  if (!editor) return;

  // If syntax highlighter isn't loaded/available, keep textarea readable.
  const hasSyntaxHighlighter = typeof updateSyntaxHighlight === 'function' && highlight;

  if (!hasSyntaxHighlighter) {
    editor.style.setProperty('color', 'var(--text-primary)', 'important');
    editor.style.setProperty('-webkit-text-fill-color', 'var(--text-primary)', 'important');
    if (highlight) highlight.hidden = true;
    return;
  }

  // Default rendering: hide textarea text and rely on syntax-highlight layer.
  editor.style.setProperty('color', 'transparent', 'important');
  editor.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
  if (highlight) highlight.hidden = false;
}


function insertSnippet(type) {
  const editor = document.getElementById("codeEditor");
  if (!editor) return;
  const snippets = { for: "for (let i = 0; i < array.length; i++) {\n    \n}", if: "if (condition) {\n    \n} else {\n    \n}", function: "function functionName(params) {\n    \n    return;\n}", while: "while (condition) {\n    \n}", switch: "switch (expression) {\n    case value:\n        break;\n    default:\n        break;\n}" };
  const snippet = snippets[type] || "";
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const before = editor.value.substring(0, start);
  const after = editor.value.substring(end);
  editor.value = before + snippet + after;
  editor.selectionStart = start;
  editor.selectionEnd = start + snippet.length;
  editor.focus();
  editor.dispatchEvent(new Event("input"));
}

function formatCode() {
  const editor = document.getElementById("codeEditor");
  if (!editor) return;
  editor.value = editor.value.split("\n").map(line => line.trimEnd()).join("\n");
  editor.dispatchEvent(new Event("input"));
  if (typeof updateLineNumbers === 'function') updateLineNumbers();
  if (typeof showNotification === 'function') showNotification("Code formatted", "info");
}

function toggleLineComment() {
  const editor = document.getElementById("codeEditor");
  const lang = document.getElementById("languageSelect").value;
  const lines = editor.value.split("\n");
  const cursorPos = editor.selectionStart;
  const textBefore = editor.value.substring(0, cursorPos);
  const currentLine = textBefore.split("\n").length - 1;
  const commentChars = { javascript: "//", python: "#", java: "//", cpp: "//" };
  const char = commentChars[lang] || "//";
  const line = lines[currentLine];
  if (line.trim().startsWith(char)) lines[currentLine] = line.replace(new RegExp(`^\\s*${char}\\s?`), "");
  else lines[currentLine] = char + " " + line;
  editor.value = lines.join("\n");
  editor.dispatchEvent(new Event("input"));
  if (typeof updateLineNumbers === 'function') updateLineNumbers();
}

function toggleOutputPanel() {
  const panel = document.getElementById('outputPanel');
  const icon = document.getElementById('outputToggleIcon');
  const header = document.getElementById('outputHeader');
  if (!panel) return;
  panel.classList.toggle('collapsed');
  const collapsed = panel.classList.contains('collapsed');
  if (icon) { icon.classList.toggle('fa-chevron-down', !collapsed); icon.classList.toggle('fa-chevron-up', collapsed); }
  if (header) header.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}

function openQuizEditor(problem) {
  currentProblem = problem;
  const modal = document.getElementById("quizEditorModal");
  if (!modal) return;
  const quizTitle = document.getElementById("quizTitle");
  if (quizTitle) quizTitle.textContent = problem.title;
  const quizTopicBadge = document.getElementById("quizTopicBadge");
  if (quizTopicBadge) quizTopicBadge.textContent = problem.tags.join(", ");
  const quizDifficulty = document.getElementById("quizDifficulty");
  if (quizDifficulty) {
    quizDifficulty.textContent = problem.difficulty;
    quizDifficulty.className = "quiz-difficulty difficulty-" + problem.difficulty;
  }
  const descEl = document.getElementById("quizDescription");
  if (descEl) {
    if (problem.description) {
      let descHTML = problem.description;
      if (problem.constraints) descHTML += "<br><br><strong>Constraints:</strong><br>" + problem.constraints.map(c => `• ${c}`).join("<br>");
      descEl.innerHTML = descHTML;
    } else descEl.textContent = `Solve the "${problem.title}" problem.`;
  }
  const quizExamples = document.getElementById("quizExamples");
  if (quizExamples) quizExamples.innerHTML = generateExamples(problem);
  renderTestCases(generateTestCases(problem));
  const editor = document.getElementById("codeEditor");
  const langSelect = document.getElementById("languageSelect");
  const lang = langSelect ? langSelect.value : "javascript";
  const defaultCode = getDefaultCode(lang, problem);
  const savedDraft = getEditorDraft(problem.id);
  if (editor) {
    let code = defaultCode;
    if (savedDraft !== null) {
      const draftSig = getEditorDraftSignature(problem.id);
      const currentSig = getProblemSignature(problem);
      const isStale = draftSig === null || draftSig !== currentSig;
      code = isStale ? defaultCode : savedDraft;
      if (isStale) clearEditorDraft(problem.id);
    }
    editor.value = code;
    editor.scrollTop = 0;
    editor.scrollLeft = 0;
    editor.dispatchEvent(new Event('input'));
  }
  updateEditorDisplayMode();
  clearQuizOutput();
  const outputPanel = document.getElementById('outputPanel');
  const outputIcon = document.getElementById('outputToggleIcon');
  if (outputPanel) outputPanel.classList.remove('collapsed');
  if (outputIcon) { outputIcon.classList.remove('fa-chevron-up'); outputIcon.classList.add('fa-chevron-down'); }

  if (!window.__quizButtonsBound) {
    window.__quizButtonsBound = true;
    document.getElementById('quizRunBtn')?.addEventListener('click', runQuizCode);
    document.getElementById('quizSubmitBtn')?.addEventListener('click', submitQuizCode);
    document.getElementById('quizModalClose')?.addEventListener('click', closeQuizEditor);
    document.getElementById('outputHeader')?.addEventListener('click', toggleOutputPanel);
  }

  modal.classList.remove("hidden");
  modal.classList.add("active");
  updateLineNumbers();
  syncScroll();

  if (typeof switchQuizTab === "function") {
    switchQuizTab('problem');
  }
  const userProgress = window.userProgress || {};
  const savedNotes = (userProgress.problemNotes && userProgress.problemNotes[problem.id]) || { notes: "", mnemonics: "", pitfalls: "", whenToUse: "", tags: [] };
  const actualNotes = typeof savedNotes === "string" ? { notes: savedNotes } : savedNotes;
  
  const noteText = document.getElementById("noteText");
  const mnemonicText = document.getElementById("mnemonicText");
  const pitfallsText = document.getElementById("pitfallsText");
  const whenToUseText = document.getElementById("whenToUseText");
  const noteTags = document.getElementById("noteTags");
  const noteSaveStatus = document.getElementById("noteSaveStatus");
  
  if (noteText) noteText.value = actualNotes.notes || "";
  if (mnemonicText) mnemonicText.value = actualNotes.mnemonics || "";
  if (pitfallsText) pitfallsText.value = actualNotes.pitfalls || "";
  if (whenToUseText) whenToUseText.value = actualNotes.whenToUse || "";
  if (noteTags) noteTags.value = (actualNotes.tags || []).join(", ");
  if (noteSaveStatus) noteSaveStatus.textContent = "";

  const sm2Container = document.getElementById("sm2RatingContainer");
  if (sm2Container) sm2Container.style.display = "none";
}

function closeQuizEditor() {
  const el = document.getElementById("quizEditorModal");
  if (el) {
    el.classList.remove("active");
    // Clean up hidden class added by initModalManager's closeModal overlay handler
    el.classList.remove("hidden");
  }
  currentProblem = null;
  // Ensure body scroll is always restored, regardless of MutationObserver timing
  document.body.classList.remove("modal-open");
}

async function runQuizCode() {
  if (_running) return;
  const editor = document.getElementById("codeEditor");
  if (!editor) return;
  const code = editor.value;
  if (!code.trim()) { setOutput("Please write some code first.", "error"); return; }
  if (!currentProblem) { setOutput("No problem selected.", "error"); return; }
  const langSelect = document.getElementById("languageSelect");
  const lang = langSelect ? langSelect.value : "javascript";
  const problem = currentProblem;
  const testCases = generateTestCases(problem);
  if (!testCases || testCases.length === 0) { setOutput("This problem doesn't have automated test cases yet.", "error"); return; }
  renderTestCases(testCases);
  setOutput("", "running");
  _running = true;
  try {
    const result = await executeCode(code, lang, problem);
    if (!result.testResults || !Array.isArray(result.testResults)) { setOutput("Execution returned no test results.", "error"); return; }
    renderTestCases(testCases, result.testResults);
    if (result.allPassed) setOutput("All tests passed!", "success");
    else {
      const failures = result.testResults.filter(r => r && !r.passed);
      const failMsg = failures.length + " / " + result.testResults.length + " tests failed";
      const out = result.rawOutput ? failMsg + "\n\nConsole output:\n" + result.rawOutput : failMsg;
      setOutput(out, "error");
    }
    if (result.metrics && result.metrics.cpuTime) {
      const metricText = `\n\n⏱️ Execution Time: ${result.metrics.cpuTime} sec\n💾 Memory Used: ${result.metrics.memory} KB`;
      const el = document.getElementById("quizOutputContent");
      if (el) el.innerHTML += `<pre style="color:var(--accent); margin-top:10px;">${metricText}</pre>`;
    }
  } catch (e) {
    renderTestCases(testCases);
    setOutput(e.message || "Execution failed", "error");
  } finally { _running = false; }
}

async function submitQuizCode() {
  if (_running) return;
  const editor = document.getElementById("codeEditor");
  if (!editor) return;
  const code = editor.value;
  if (!code.trim()) { if (typeof showNotification === 'function') showNotification("Please write some code before submitting!", "error"); return; }
  if (!currentProblem) { if (typeof showNotification === 'function') showNotification("No problem selected!", "error"); return; }
  const userProgress = window.userProgress || {};
  const problem = currentProblem;
  if (userProgress.completedProblems.includes(problem.id)) { if (typeof showNotification === 'function') showNotification("Already completed!", "info"); return; }
  const langSelect = document.getElementById("languageSelect");
  const lang = langSelect ? langSelect.value : "javascript";
  const testCases = generateTestCases(problem);
  if (!testCases || testCases.length === 0) { if (typeof showNotification === 'function') showNotification("This problem doesn't have automated tests. Submit not available.", "error"); return; }
  if (typeof showNotification === 'function') showNotification("⏳ Running tests...", "info");
  renderTestCases(testCases);
  setOutput("", "running");
  _running = true;
  try {
    const result = await executeCode(code, lang, problem);
    if (!result.testResults || !Array.isArray(result.testResults)) { if (typeof showNotification === 'function') showNotification("Execution returned no test results.", "error"); return; }
    renderTestCases(testCases, result.testResults);
    if (result.allPassed) {
      if (!userProgress.submittedSolutions) userProgress.submittedSolutions = {};
      userProgress.submittedSolutions[problem.id] = { code: code, lang: lang, date: new Date().toISOString() };
      userProgress.completedProblems.push(problem.id);
      const difficulty = problem.difficulty;
      if (typeof addXP === 'function') addXP(getXPForDifficulty(difficulty));
      if (typeof updateStreak === 'function') updateStreak();
      if (typeof recordDailyActivity === 'function') recordDailyActivity(1);
      if (typeof saveUserData === 'function') saveUserData();
      if (typeof updateDashboard === 'function') updateDashboard();
      if (typeof updateGamification === 'function') updateGamification();
      if (typeof initRoadmap === 'function') initRoadmap();
      if (typeof initTopicsSection === 'function') initTopicsSection();
      if (typeof renderActivityHeatmap === 'function') renderActivityHeatmap();
      const submittedId = problem.id;
      const sm2Container = document.getElementById("sm2RatingContainer");
      if (sm2Container) sm2Container.style.display = "flex";
      else { closeQuizEditor(); clearEditorDraft(submittedId); }
      if (typeof showNotification === 'function') showNotification("Problem solved! +" + getXPForDifficulty(difficulty) + " XP. Rate recall difficulty below.", "success");
    } else {
      const failures = result.testResults.filter(r => r && !r.passed);
      setOutput(failures.length + " / " + result.testResults.length + " tests failed. Fix the issues and try again.", "error");
      if (typeof showNotification === 'function') showNotification(failures.length + " test(s) failed. Keep trying!", "error");
    }
  } catch (e) {
    renderTestCases(testCases);
    setOutput(e.message || "Execution failed", "error");
    if (typeof showNotification === 'function') showNotification("Execution error: " + (e.message || "Unknown error"), "error");
  } finally { _running = false; }
}

function wireQuizButtons() {
  const runBtn = document.getElementById('quizRunBtn');
  const submitBtn = document.getElementById('quizSubmitBtn');
  if (runBtn && !runBtn._quizWired) { runBtn.addEventListener('click', runQuizCode); runBtn._quizWired = true; }
  if (submitBtn && !submitBtn._quizWired) { submitBtn.addEventListener('click', submitQuizCode); submitBtn._quizWired = true; }
}

function initializeQuizEditor() {
  const editor = document.getElementById('codeEditor');
  const languageSelect = document.getElementById('languageSelect');
  if (!editor || editor.dataset.initialized === 'true') { wireQuizButtons(); return; }
  editor.dataset.initialized = 'true';
  const syncEditorState = () => { if (typeof updateSyntaxHighlight === 'function') updateSyntaxHighlight(); updateLineNumbers(); syncScroll(); };
  editor.addEventListener('input', () => { syncEditorState(); if (currentProblem) saveEditorDraft(currentProblem.id, editor.value, getProblemSignature(currentProblem)); });
  editor.addEventListener('scroll', syncScroll);
  editor.addEventListener('keyup', () => { if (typeof updateCurrentLineHighlight === 'function') updateCurrentLineHighlight(); });
  editor.addEventListener('click', () => { if (typeof updateCurrentLineHighlight === 'function') updateCurrentLineHighlight(); });
  editor.addEventListener('focus', () => { if (typeof updateCurrentLineHighlight === 'function') updateCurrentLineHighlight(); });
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); const start = editor.selectionStart; const end = editor.selectionEnd; const value = editor.value; editor.value = `${value.slice(0, start)}    ${value.slice(end)}`; editor.selectionStart = editor.selectionEnd = start + 4; syncEditorState(); }
    else if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); runQuizCode(); }
    else if (e.ctrlKey && e.key === 's') { e.preventDefault(); submitQuizCode(); }
  });
  wireQuizButtons();
  if (languageSelect) languageSelect.addEventListener('change', () => { const editor = document.getElementById('codeEditor'); if (editor && currentProblem) { editor.value = getDefaultCode(languageSelect.value, currentProblem); editor.scrollTop = 0; editor.scrollLeft = 0; } syncEditorState(); updateEditorDisplayMode(); });
  syncEditorState();
  initEditorZoom(editor);
}

function initEditorZoom(editor) {
  const zoomMin = 10, zoomMax = 28;
  const container = editor.closest('.code-editor-container') || editor.parentElement;
  let fontSize = parseInt(localStorage.getItem('editorFontSize')) || 14;
  const applyZoom = (size) => {
    size = Math.min(zoomMax, Math.max(zoomMin, size));
    fontSize = size;
    container.style.setProperty('--editor-font-size', size + 'px');
    localStorage.setItem('editorFontSize', size);
    if (typeof updateLineNumbers === 'function') updateLineNumbers();
  };
  applyZoom(fontSize);
  editor.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    applyZoom(fontSize + (e.deltaY > 0 ? -1 : 1));
  }, { passive: false });
  editor.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === '=' || e.key === '+') { e.preventDefault(); applyZoom(fontSize + 1); }
      else if (e.key === '-') { e.preventDefault(); applyZoom(fontSize - 1); }
      else if (e.key === '0') { e.preventDefault(); applyZoom(14); }
    }
  });
}

window.openQuizEditor = openQuizEditor;
window.closeQuizEditor = closeQuizEditor;
window.runQuizCode = runQuizCode;
window.submitQuizCode = submitQuizCode;
window.insertSnippet = insertSnippet;
window.formatCode = formatCode;
window.toggleLineComment = toggleLineComment;
window.toggleOutputPanel = toggleOutputPanel;

export function initEditor() {
  initializeQuizEditor();
}
// Legacy global exports
window.initEditor = initEditor;
