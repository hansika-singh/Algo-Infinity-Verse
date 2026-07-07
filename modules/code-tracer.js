import * as acorn from "acorn";

function isIdentifierPattern(pat) {
  return pat && pat.type === "Identifier";
}

function isFunctionLike(node) {
  return (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression" ||
    node.type === "MethodDefinition"
  );
}

function collectTopLevelAssignedNames(sourceCode) {
  let ast;
  try {
    ast = acorn.parse(sourceCode, {
      ecmaVersion: 2022,
      sourceType: "script",
      locations: true,
    });
  } catch {
    return new Set();
  }

  const names = new Set();

  function walk(node, inFunction) {
    if (!node || typeof node !== "object") return;
    if (inFunction) return;
    if (isFunctionLike(node)) return;

    if (node.type === "VariableDeclarator" && isIdentifierPattern(node.id)) {
      names.add(node.id.name);
    }
    if (node.type === "AssignmentExpression" && isIdentifierPattern(node.left)) {
      names.add(node.left.name);
    }
    if (node.type === "UpdateExpression" && isIdentifierPattern(node.argument)) {
      names.add(node.argument.name);
    }

    for (const key of Object.keys(node)) {
      if (key === "start" || key === "end" || key === "loc") continue;
      const val = node[key];
      if (Array.isArray(val)) {
        for (let i = val.length - 1; i >= 0; i--) walk(val[i], inFunction);
      } else if (val && typeof val === "object") {
        walk(val, inFunction);
      }
    }
  }

  walk(ast, false);
  return names;
}

export function instrumentJS(sourceCode) {
  let ast;
  try {
    ast = acorn.parse(sourceCode, {
      ecmaVersion: 2022,
      sourceType: "script",
      locations: true,
    });
  } catch (err) {
    return { instrumented: sourceCode, variableNames: [], error: "Failed to parse JavaScript code." };
  }

  const allVariableNames = collectTopLevelAssignedNames(sourceCode);
  const lines = sourceCode.split("\n");
  const instrumentedLines = [];
  const isInsideFunction = new Array(lines.length).fill(false);

  function markFunctions(node) {
    if (!node || typeof node !== "object") return;
    if (isFunctionLike(node) || node.type === "ClassDeclaration" || node.type === "ClassExpression") {
      const bodyNode = node.body || node;
      if (bodyNode.loc) {
        const startLine = bodyNode.loc.start.line;
        const endLine = bodyNode.loc.end.line;
        
        for (let i = startLine; i <= endLine; i++) {
          // If the function spans multiple lines, mark the internal lines as strictly inside.
          // If it's a single-line function, mark the line itself as inside.
          if (startLine === endLine) {
            isInsideFunction[i - 1] = true;
          } else if (i > startLine && i < endLine) {
            isInsideFunction[i - 1] = true;
          }
        }
      }
    }
    
    for (const key of Object.keys(node)) {
      if (key === "start" || key === "end" || key === "loc") continue;
      const val = node[key];
      if (Array.isArray(val)) {
        for (let j = val.length - 1; j >= 0; j--) markFunctions(val[j]);
      } else if (val && typeof val === "object") {
        markFunctions(val);
      }
    }
  }

  markFunctions(ast);

  const skipLine = (trimmed, idx) => {
    if (!trimmed) return true;
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) return true;
    if (trimmed === "{" || trimmed === "}" || trimmed.endsWith("{")) return true;
    if (isInsideFunction[idx]) return true;
    if (/^(?:function|class|if|else|switch|for|while|do|try|catch|finally|case|default|return)\b/.test(trimmed)) return true;
    return false;
  };

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const trimmed = lines[i].trim();
    instrumentedLines.push(lines[i]);

    if (skipLine(trimmed, i)) continue;
    if (allVariableNames.size === 0) continue;

    const hasDecl = /^(?:let|var|const)\s+\w+\s*[=;]/.test(trimmed);
    const hasAssign = /^\w+\s*(?:[+\-*/%&|^<>]=|=[^=])/.test(trimmed);
    const hasUpdate = /^\w+\s*(?:\+\+|--)\s*$/.test(trimmed) || /^(?:\+\+|--)\w+/.test(trimmed);

    if (hasDecl || hasAssign || hasUpdate) {
      instrumentedLines.push(`__snap(${lineNum});`);
    }
  }

  const wrapped = [
    `(function() {`,
    `  let __snapshots = [];`,
    `  let __origLog = console.log;`,
    `  let __userOutput = [];`,
    `  console.log = function() {`,
    `    let msg = Array.prototype.map.call(arguments, function(a) {`,
    `      return typeof a === 'object' ? JSON.stringify(a) : String(a);`,
    `    }).join(' ');`,
    `    __userOutput.push(msg);`,
    `  };`,
    `  function __snap($$line) {`,
    `    try {`,
    `      let __v = {};`,
    ...Array.from(allVariableNames).map((v) =>
      `      try { __v["${v}"] = ${v}; } catch(e) {}`
    ),
    `      __snapshots.push({ line: $$line, vars: __v });`,
    `    } catch(e) {}`,
    `  }`,
    ...instrumentedLines.map((l) => `  ${l}`),
    `  console.log = __origLog;`,
    `  let __result = JSON.stringify({ snapshots: __snapshots, output: __userOutput });`,
    `  process.stdout.write(__result);`,
    `})()`,
  ].join("\n");

  return {
    instrumented: wrapped,
    variableNames: Array.from(allVariableNames),
  };
}

export function extractSnapshotsFromOutput(stdout) {
  try {
    const parsed = JSON.parse(stdout);
    if (parsed && Array.isArray(parsed.snapshots)) {
      return parsed.snapshots;
    }
  } catch {}
  return null;
}
// Legacy global exports (browser only)
if (typeof window !== 'undefined') {
  window.instrumentJS = instrumentJS;
  window.extractSnapshotsFromOutput = extractSnapshotsFromOutput;
}
