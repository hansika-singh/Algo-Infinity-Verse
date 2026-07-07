document.addEventListener('DOMContentLoaded', function() {
  ceInit();
});

let CE_KEYWORDS = new Set([
  'function','var','let','const','return','if','else','for','while','do',
  'break','continue','new','delete','typeof','instanceof','in','of',
  'class','extends','import','export','default','switch','case','throw',
  'try','catch','finally','true','false','null','undefined','this',
  'async','await','yield','static','super','void',
]);

let CE_BUILTINS = new Set([
  'console','Math','Array','Object','String','Number','Boolean','JSON',
  'Promise','Set','Map','Date','RegExp','Error','parseInt','parseFloat',
  'isNaN','isFinite','setTimeout','setInterval','clearTimeout','clearInterval',
]);

/* ─── Presets ─── */
let CE_PRESETS = [
  {
    label: 'Simple Assignment',
    code: 'let x = 10;\nvar y = 20;\nvar sum = x + y;\nconsole.log(sum);',
  },
  {
    label: 'For Loop',
    code: 'function sumArray(arr) {\n  let total = 0;\n  for (let i = 0; i < arr.length; i++) {\n    total = total + arr[i];\n  }\n  return total;\n}',
  },
  {
    label: 'Binary Search',
    code: 'function binarySearch(arr, target) {\n  let lo = 0;\n  let hi = arr.length - 1;\n  while (lo <= hi) {\n    let mid = Math.floor((lo + hi) / 2);\n    if (arr[mid] === target) return mid;\n    else if (arr[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}',
  },
  {
    label: 'Recursion (Fibonacci)',
    code: 'function fib(n) {\n  if (n <= 1) return n;\n  return fib(n - 1) + fib(n - 2);\n}',
  },
  {
    label: 'Bubble Sort',
    code: 'function bubbleSort(arr) {\n  let n = arr.length;\n  for (let i = 0; i < n; i++) {\n    for (let j = 0; j < n - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        let temp = arr[j];\n        arr[j] = arr[j + 1];\n        arr[j + 1] = temp;\n      }\n    }\n  }\n  return arr;\n}',
  },
  {
    label: 'Closure',
    code: 'function makeCounter() {\n  let count = 0;\n  return function() {\n    count = count + 1;\n    return count;\n  };\n}\nvar counter = makeCounter();\ncounter();\ncounter();',
  },
  {
    label: 'If-Else Chain',
    code: 'function grade(score) {\n  if (score >= 90) {\n    return "A";\n  } else if (score >= 80) {\n    return "B";\n  } else if (score >= 70) {\n    return "C";\n  } else {\n    return "F";\n  }\n}',
  },
  {
    label: 'Constant Folding (Demo)',
    code: 'let x = 2 + 3;\nvar y = x * 10;\nif (false) {\n  console.log("dead code");\n}\nvar PI = 3.14159;\nfor (let i = 0; i < 100; i++) {\n  let area = PI * 5 * 5;\n}',
  },
];

/* ─── Tokenizer ─── */
function ceTokenize(code) {
  let tokens = [];
  let i = 0;
  let len = code.length;

  while (i < len) {
    let ch = code[i];

    // Newline
    if (ch === '\n') { tokens.push({ type: 'newline', value: '\n', line: tokens.filter(function(t){return t.type==='newline';}).length + 1 }); i++; continue; }

    // Whitespace
    if (/\s/.test(ch)) { let ws = ''; while (i < len && /[ \t\r]/.test(code[i])) ws += code[i++]; tokens.push({ type: 'whitespace', value: ws }); continue; }

    // Line comment
    if (code[i] === '/' && code[i+1] === '/') {
      let cmt = ''; while (i < len && code[i] !== '\n') cmt += code[i++];
      tokens.push({ type: 'comment', value: cmt }); continue;
    }

    // Block comment
    if (code[i] === '/' && code[i+1] === '*') {
      let cmt = ''; i += 2; while (i < len && !(code[i] === '*' && code[i+1] === '/')) cmt += code[i++]; i += 2;
      tokens.push({ type: 'comment', value: '/*' + cmt + '*/' }); continue;
    }

    // String
    if (ch === '"' || ch === "'" || ch === '`') {
      let q = ch; let str = q; i++;
      while (i < len && code[i] !== q) { if (code[i] === '\\') str += code[i++]; str += code[i++]; }
      str += q; i++;
      tokens.push({ type: 'string', value: str }); continue;
    }

    // Number
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(code[i+1]))) {
      let num = ''; while (i < len && /[0-9._]/.test(code[i])) num += code[i++];
      tokens.push({ type: 'number', value: num }); continue;
    }

    // Identifier or keyword
    if (/[a-zA-Z_$]/.test(ch)) {
      let word = ''; while (i < len && /[a-zA-Z0-9_$]/.test(code[i])) word += code[i++];
      let type = CE_KEYWORDS.has(word) ? 'keyword' : CE_BUILTINS.has(word) ? 'builtin' : 'identifier';
      if (word === 'true' || word === 'false' || word === 'null' || word === 'undefined') type = 'boolean';
      tokens.push({ type: type, value: word }); continue;
    }

    // Operators
    let twoChar = code.substring(i, i+2);
    if (['===','!==','>>>','**=','<<=','>>='].includes(code.substring(i,i+3))) {
      tokens.push({ type: 'operator', value: code.substring(i,i+3) }); i+=3; continue;
    }
    if (['==','!=','<=','>=','&&','||','++','--','+=','-=','*=','/=','%=','**','??','?.','=>','<<','>>'].includes(twoChar)) {
      tokens.push({ type: 'operator', value: twoChar }); i+=2; continue;
    }

    // Punctuation
    if (/[{}()\[\];,.]/.test(ch)) { tokens.push({ type: 'punctuation', value: ch }); i++; continue; }

    // Single operator
    if (/[+\-*/%=<>!&|^~?:]/.test(ch)) { tokens.push({ type: 'operator', value: ch }); i++; continue; }

    // Unknown
    tokens.push({ type: 'identifier', value: ch }); i++;
  }

  return tokens;
}

/* ─── Simple AST parser ─── */
// Produces a lightweight tree for visualization, not a full spec-compliant parser

function ceParse(tokens) {
  let filtered = tokens.filter(function(t) { return t.type !== 'whitespace' && t.type !== 'newline' && t.type !== 'comment'; });
  let pos = 0;
  let nodeCount = 0;

  function peek()    { return filtered[pos]; }
  function consume() { return filtered[pos++]; }
  function expect(val) { if (filtered[pos] && filtered[pos].value === val) return consume(); return null; }
  function at(val)   { return filtered[pos] && filtered[pos].value === val; }
  function makeNode(type, children, value) { nodeCount++; return { type: type, children: children || [], value: value || null, id: nodeCount }; }

  function parseProgram() {
    let body = [];
    while (pos < filtered.length) { let s = parseStatement(); if (s) body.push(s); else pos++; }
    return makeNode('Program', body);
  }

  function parseStatement() {
    let tok = peek();
    if (!tok) return null;

    if (tok.type === 'keyword') {
      if (tok.value === 'function') return parseFunctionDecl();
      if (tok.value === 'var' || tok.value === 'let' || tok.value === 'const') return parseVarDecl();
      if (tok.value === 'return') { consume(); let arg = parseExpr(); return makeNode('ReturnStatement', arg ? [arg] : []); }
      if (tok.value === 'if') return parseIf();
      if (tok.value === 'for') return parseFor();
      if (tok.value === 'while') return parseWhile();
      if (tok.value === 'break' || tok.value === 'continue') { let v = consume().value; return makeNode(v === 'break' ? 'BreakStatement' : 'ContinueStatement', []); }
    }

    if (tok.type === 'punctuation' && tok.value === '{') return parseBlock();

    let expr = parseExpr();
    if (peek() && peek().value === ';') consume();
    return expr ? makeNode('ExprStatement', [expr]) : null;
  }

  function parseFunctionDecl() {
    consume(); // 'function'
    let name = peek() && peek().type === 'identifier' ? consume().value : '(anonymous)';
    expect('(');
    let params = [];
    while (peek() && peek().value !== ')') {
      if (peek().type === 'identifier') params.push(makeNode('Identifier', [], peek().value));
      if (peek() && peek().value === ',') consume();
      else if (peek() && peek().value !== ')') consume();
    }
    expect(')');
    let body = parseBlock();
    let node = makeNode('FunctionDecl', [body], name);
    node.params = params;
    return node;
  }

  function parseVarDecl() {
    let kind = consume().value; // var/let/const
    let name = peek() && peek().type === 'identifier' ? consume().value : '?';
    let init = null;
    if (peek() && peek().value === '=') { consume(); init = parseExpr(); }
    if (peek() && peek().value === ';') consume();
    return makeNode('VarDecl', init ? [init] : [], kind + ' ' + name);
  }

  function parseIf() {
    consume(); // 'if'
    expect('(');
    let test = parseExpr();
    expect(')');
    let consequent = parseStatement();
    let alternate = null;
    if (peek() && peek().value === 'else') { consume(); alternate = parseStatement(); }
    return makeNode('IfStatement', [test, consequent, alternate].filter(Boolean));
  }

  function parseFor() {
    consume(); // 'for'
    expect('(');
    let init = parseStatement();
    let test = parseExpr(); expect(';');
    let update = parseExpr(); expect(')');
    let body = parseStatement();
    return makeNode('ForStatement', [init, test, update, body].filter(Boolean));
  }

  function parseWhile() {
    consume(); // 'while'
    expect('(');
    let test = parseExpr(); expect(')');
    let body = parseStatement();
    return makeNode('WhileStatement', [test, body].filter(Boolean));
  }

  function parseBlock() {
    expect('{');
    let stmts = [];
    while (pos < filtered.length && !(peek() && peek().value === '}')) {
      let s = parseStatement(); if (s) stmts.push(s); else if (peek() && peek().value !== '}') pos++;
    }
    expect('}');
    return makeNode('Block', stmts);
  }

  function parseExpr() {
    return parseAssign();
  }

  function parseAssign() {
    let left = parseComparison();
    if (!left) return null;
    if (peek() && /^(=|\+=|-=|\*=|\/=|%=)$/.test(peek().value)) {
      let op = consume().value; let right = parseAssign();
      return makeNode('AssignExpr', [left, right].filter(Boolean), op);
    }
    return left;
  }

  function parseComparison() {
    let left = parseAddSub();
    while (peek() && /^(===|!==|==|!=|<=|>=|<|>|\|\||&&)$/.test(peek().value)) {
      let op = consume().value; let right = parseAddSub();
      left = makeNode('BinaryExpr', [left, right].filter(Boolean), op);
    }
    return left;
  }

  function parseAddSub() {
    let left = parseMulDiv();
    while (peek() && /^[+\-]$/.test(peek().value)) {
      let op = consume().value; let right = parseMulDiv();
      left = makeNode('BinaryExpr', [left, right].filter(Boolean), op);
    }
    return left;
  }

  function parseMulDiv() {
    let left = parseUnary();
    while (peek() && /^[*\/\%]$/.test(peek().value)) {
      let op = consume().value; let right = parseUnary();
      left = makeNode('BinaryExpr', [left, right].filter(Boolean), op);
    }
    return left;
  }

  function parseUnary() {
    if (peek() && /^(!|-|\+\+|--)$/.test(peek().value)) {
      let op = consume().value; let arg = parseCall();
      return makeNode('UnaryExpr', [arg].filter(Boolean), op);
    }
    return parseCall();
  }

  function parseCall() {
    let callee = parsePrimary();
    while (peek() && (peek().value === '(' || peek().value === '.' || peek().value === '[')) {
      if (peek().value === '(') {
        consume();
        let args = [];
        while (peek() && peek().value !== ')') {
          let a = parseExpr(); if (a) args.push(a);
          if (peek() && peek().value === ',') consume();
          else if (peek() && peek().value !== ')') break;
        }
        expect(')');
        callee = makeNode('CallExpression', [callee].concat(args).filter(Boolean), callee ? callee.value : '');
      } else if (peek().value === '.') {
        consume();
        let prop = peek() && peek().type === 'identifier' ? consume().value : '?';
        callee = makeNode('MemberExpr', [callee].filter(Boolean), '.' + prop);
      } else {
        consume();
        let idx = parseExpr(); expect(']');
        callee = makeNode('MemberExpr', [callee, idx].filter(Boolean), '[]');
      }
    }
    return callee;
  }

  function parsePrimary() {
    let tok = peek();
    if (!tok) return null;
    if (tok.type === 'number')  { consume(); return makeNode('Literal', [], tok.value); }
    if (tok.type === 'string')  { consume(); return makeNode('Literal', [], tok.value); }
    if (tok.type === 'boolean') { consume(); return makeNode('Literal', [], tok.value); }
    if (tok.type === 'keyword' && (tok.value === 'true'||tok.value==='false'||tok.value==='null'||tok.value==='undefined')) { consume(); return makeNode('Literal',[],tok.value); }
    if (tok.type === 'identifier' || tok.type === 'builtin') { consume(); return makeNode('Identifier', [], tok.value); }
    if (tok.type === 'keyword' && tok.value === 'new') { consume(); return makeNode('NewExpr', [parsePrimary()].filter(Boolean)); }
    if (tok.type === 'keyword' && tok.value === 'function') return parseFunctionDecl();
    if (tok.value === '(') { consume(); let e = parseExpr(); expect(')'); return e; }
    if (tok.value === '[') {
      consume();
      let els = [];
      while (peek() && peek().value !== ']') { let el = parseExpr(); if (el) els.push(el); if (peek() && peek().value === ',') consume(); else break; }
      expect(']');
      return makeNode('ArrayExpr', els);
    }
    if (tok.value === '{') return parseBlock();
    return null;
  }

  try { return { ast: parseProgram(), nodeCount: nodeCount }; }
  catch(e) { return { ast: { type: 'Program', children: [], value: null, id: 0 }, nodeCount: 0 }; }
}

/* ─── Optimizer ─── */
function ceOptimize(code, ast) {
  let hints = [];
  let lines  = code.split('\n');

  // 1. Constant folding: detect "2 + 3" or similar numeric literals in binary expr
  lines.forEach(function(line, idx) {
    let foldMatch = line.match(/(\d+\.?\d*)\s*([+\-\*\/])\s*(\d+\.?\d*)/);
    if (foldMatch && !line.trim().startsWith('//')) {
      let a = parseFloat(foldMatch[1]); let op = foldMatch[2]; let b = parseFloat(foldMatch[3]);
      let result = op === '+' ? a+b : op === '-' ? a-b : op === '*' ? a*b : op === '/' && b!==0 ? a/b : null;
      if (result !== null) {
        hints.push({ type: 'ok', icon: '🔁', title: 'Constant Folding', desc: 'This binary expression uses two literals and can be evaluated at compile time — no need to compute at runtime.', before: foldMatch[0], after: String(result), line: idx + 1 });
      }
    }
  });

  // 2. Dead code: if(false) or if(0)
  lines.forEach(function(line, idx) {
    if (/if\s*\(\s*(false|0|null|undefined)\s*\)/.test(line)) {
      hints.push({ type: 'danger', icon: '💀', title: 'Dead Code Elimination', desc: 'This condition is always false — the entire if-block will never execute. The optimizer removes it entirely.', before: line.trim(), after: '// (removed — unreachable)', line: idx + 1 });
    }
  });

  // 3. Loop invariant: variable assigned constant inside loop
  let loopStart = -1;
  lines.forEach(function(line, idx) {
    if (/^\s*(for|while)\s*\(/.test(line)) loopStart = idx;
    if (loopStart >= 0 && /var\s+\w+\s*=\s*[\d.]+\s*\*\s*[\d.]+/.test(line)) {
      hints.push({ type: 'warn', icon: '🔼', title: 'Loop Invariant Hoisting', desc: 'This computation does not depend on loop variables — it produces the same result every iteration. Move it before the loop.', before: line.trim(), after: '// Hoist this before the loop', line: idx + 1 });
      loopStart = -1;
    }
  });

  // 4. Unused variable detection (declared but never referenced after)
  let declared = {};
  lines.forEach(function(line, idx) {
    let m = line.match(/(?:var|let|const)\s+(\w+)\s*=/);
    if (m) declared[m[1]] = { name: m[1], line: idx + 1, used: false };
  });
  Object.keys(declared).forEach(function(name) {
    let occurrences = (code.match(new RegExp('\\b' + name + '\\b', 'g')) || []).length;
    if (occurrences <= 1) {
      hints.push({ type: 'warn', icon: '👻', title: 'Potentially Unused Variable', desc: '"' + name + '" is declared but may never be read. Consider removing it to reduce memory footprint.', before: 'var/let/const ' + name + ' = ...', after: '// (potentially removable)', line: declared[name].line });
    }
  });

  // 5. Nested ternary warning
  lines.forEach(function(line, idx) {
    if ((line.match(/\?/g) || []).length >= 2) {
      hints.push({ type: 'warn', icon: '🪆', title: 'Nested Ternary Detected', desc: 'Nested ternaries reduce readability. The optimizer may have difficulty applying branch prediction optimizations. Consider if-else chains.', before: line.trim(), after: '// Refactor to if-else for clarity', line: idx + 1 });
    }
  });

  // 6. String concatenation in loop
  loopStart = -1;
  lines.forEach(function(line, idx) {
    if (/^\s*(for|while)\s*\(/.test(line)) loopStart = idx;
    if (loopStart >= 0 && /\+=\s*['"]|str\s*\+=|string\s*\+=/.test(line)) {
      hints.push({ type: 'warn', icon: '🪢', title: 'String Concatenation in Loop', desc: 'String concatenation inside a loop creates a new string object each iteration — O(n²) total. Collect into an array and join() after.', before: line.trim(), after: '// arr.push(item); result = arr.join("");', line: idx + 1 });
    }
  });

  // 7. Console.log in hot path
  lines.forEach(function(line, idx) {
    if (/console\.(log|warn|error)/.test(line) && loopStart >= 0) {
      hints.push({ type: 'warn', icon: '🔕', title: 'Logging in Hot Path', desc: 'console.log() inside a loop is expensive — I/O operations block the event loop. Remove before production.', before: line.trim(), after: '// Remove console.log from loops', line: idx + 1 });
    }
  });

  if (hints.length === 0) {
    hints.push({ type: 'ok', icon: '✅', title: 'No Obvious Optimizations Found', desc: 'The optimizer did not detect constant folding opportunities, dead code, loop invariants, or unused variables in this snippet.', before: null, after: null, line: null });
  }

  return hints;
}

/* ─── Bytecode generator ─── */
let CE_BC_ADDR = 0;

function ceGenBytecode(ast, code) {
  CE_BC_ADDR = 0;
  let instructions = [];
  let labels = {};

  function addr() { return '0x' + (CE_BC_ADDR++).toString(16).toUpperCase().padStart(4,'0'); }
  function emit(op, operand, comment, cls) { instructions.push({ addr: addr(), op: op, operand: operand || '', comment: comment || '', cls: cls || 'ce-op-special' }); }

  function walkNode(node, depth) {
    if (!node || depth > 8) return;
    let type = node.type;

    if (type === 'Program') {
      emit('ENTER_SCOPE', 'global', 'Enter global scope', 'ce-op-scope');
      node.children.forEach(function(c) { walkNode(c, depth+1); });
      emit('EXIT_SCOPE', 'global', 'Exit global scope', 'ce-op-scope');
      return;
    }

    if (type === 'FunctionDecl') {
      let lbl = 'fn_' + (node.value || 'anon');
      emit('DEF_FUNC', lbl, 'Define function "' + node.value + '"', 'ce-op-scope');
      emit('ENTER_SCOPE', lbl, 'Function scope start', 'ce-op-scope');
      node.children.forEach(function(c) { walkNode(c, depth+1); });
      emit('RETURN', 'undefined', 'Implicit return', 'ce-op-return');
      emit('EXIT_SCOPE', lbl, 'Function scope end', 'ce-op-scope');
      return;
    }

    if (type === 'VarDecl') {
      let parts = (node.value || '').split(' ');
      let name  = parts[1] || '?';
      if (node.children.length) { walkNode(node.children[0], depth+1); emit('STORE', name, 'Store into ' + name, 'ce-op-store'); }
      else { emit('LOAD_UNDEF', name, 'Initialize ' + name + ' = undefined', 'ce-op-load'); emit('STORE', name, 'Store into ' + name, 'ce-op-store'); }
      return;
    }

    if (type === 'AssignExpr') {
      node.children.slice(1).forEach(function(c){walkNode(c,depth+1);});
      let target = (node.children[0] && node.children[0].value) || '?';
      let opStr  = node.value === '=' ? '' : node.value.replace('=','');
      if (opStr) { emit('LOAD', target, 'Load ' + target + ' for compound assign', 'ce-op-load'); emit(opStr === '+' ? 'ADD' : opStr === '-' ? 'SUB' : opStr === '*' ? 'MUL' : 'DIV', '', 'Compute ' + node.value, 'ce-op-arith'); }
      emit('STORE', target, 'Store result into ' + target, 'ce-op-store');
      return;
    }

    if (type === 'BinaryExpr') {
      node.children.forEach(function(c){walkNode(c,depth+1);});
      let opMap = { '+':'ADD', '-':'SUB', '*':'MUL', '/':'DIV', '%':'MOD', '===':'EQ_STRICT', '!==':'NEQ_STRICT', '<':'LT', '>':'GT', '<=':'LTE', '>=':'GTE', '&&':'AND', '||':'OR' };
      emit(opMap[node.value] || 'OP_' + node.value, '', 'Binary ' + node.value, 'ce-op-arith');
      return;
    }

    if (type === 'Literal') {
      let isStr = /^['"`]/.test(String(node.value));
      emit(isStr ? 'LOAD_CONST_STR' : 'LOAD_CONST', node.value, 'Push literal ' + node.value, 'ce-op-load');
      return;
    }

    if (type === 'Identifier') {
      emit('LOAD', node.value, 'Load variable ' + node.value, 'ce-op-load');
      return;
    }

    if (type === 'ReturnStatement') {
      node.children.forEach(function(c){walkNode(c,depth+1);});
      emit('RETURN', node.children.length ? 'tos' : 'undefined', 'Return from function', 'ce-op-return');
      return;
    }

    if (type === 'ForStatement') {
      node.children.forEach(function(c,i){ if(i===0) walkNode(c,depth+1); }); // init
      let loopLbl = 'for_' + CE_BC_ADDR;
      emit('LABEL', loopLbl, 'Loop start', 'ce-op-jump');
      if (node.children[1]) { walkNode(node.children[1], depth+1); emit('JUMP_IF_FALSE', 'exit_' + loopLbl, 'Exit if condition false', 'ce-op-jump'); }
      if (node.children[3]) walkNode(node.children[3], depth+1); // body
      if (node.children[2]) walkNode(node.children[2], depth+1); // update
      emit('JUMP', loopLbl, 'Back to loop start', 'ce-op-jump');
      emit('LABEL', 'exit_' + loopLbl, 'Loop end', 'ce-op-jump');
      return;
    }

    if (type === 'WhileStatement') {
      let loopLbl = 'while_' + CE_BC_ADDR;
      emit('LABEL', loopLbl, 'While loop start', 'ce-op-jump');
      if (node.children[0]) { walkNode(node.children[0], depth+1); emit('JUMP_IF_FALSE', 'exit_' + loopLbl, 'Exit if false', 'ce-op-jump'); }
      if (node.children[1]) walkNode(node.children[1], depth+1);
      emit('JUMP', loopLbl, 'Back to while start', 'ce-op-jump');
      emit('LABEL', 'exit_' + loopLbl, 'While end', 'ce-op-jump');
      return;
    }

    if (type === 'IfStatement') {
      if (node.children[0]) { walkNode(node.children[0], depth+1); }
      let elseLbl = 'else_' + CE_BC_ADDR; let endLbl = 'endif_' + CE_BC_ADDR;
      emit('JUMP_IF_FALSE', node.children[2] ? elseLbl : endLbl, 'Jump to else/end', 'ce-op-jump');
      if (node.children[1]) walkNode(node.children[1], depth+1);
      if (node.children[2]) { emit('JUMP', endLbl, 'Skip else', 'ce-op-jump'); emit('LABEL', elseLbl, 'Else branch', 'ce-op-jump'); walkNode(node.children[2], depth+1); }
      emit('LABEL', endLbl, 'End of if', 'ce-op-jump');
      return;
    }

    if (type === 'CallExpression') {
      node.children.slice(1).forEach(function(c){walkNode(c,depth+1);});
      let argCount = Math.max(0, node.children.length - 1);
      let fnName   = (node.children[0] && node.children[0].value) || '(unknown)';
      emit('PUSH_ARGC', String(argCount), 'Push ' + argCount + ' argument(s)', 'ce-op-call');
      if (node.children[0]) walkNode(node.children[0], depth+1);
      emit('CALL', fnName + '/' + argCount, 'Call ' + fnName, 'ce-op-call');
      return;
    }

    if (type === 'Block') {
      node.children.forEach(function(c){walkNode(c,depth+1);});
      return;
    }

    if (type === 'ExprStatement') {
      node.children.forEach(function(c){walkNode(c,depth+1);});
      emit('POP', '', 'Discard expression result', 'ce-op-special');
      return;
    }

    // Fallback
    node.children && node.children.forEach(function(c){walkNode(c,depth+1);});
  }

  emit('PROGRAM_START', '', 'Begin execution', 'ce-op-special');
  walkNode(ast, 0);
  emit('PROGRAM_END', '', 'Halt', 'ce-op-special');

  return instructions;
}

/* ─── Render functions ─── */

function ceRenderTokens(tokens) {
  let stream = document.getElementById('ceTokenStream');
  let countEl = document.getElementById('ceTokenCount');
  if (!stream) return;

  let visible = tokens.filter(function(t) { return t.type !== 'whitespace'; });
  if (countEl) countEl.textContent = visible.length;

  stream.innerHTML = tokens.map(function(tok) {
    if (tok.type === 'whitespace') return '';
    if (tok.type === 'newline') return '<span class="ce-tok newline"></span>';
    let val = tok.value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    let title = 'title="' + tok.type.toUpperCase() + '"';
    return '<span class="ce-tok ' + tok.type + '" ' + title + '>' +
      val +
      '<span class="ce-tok-type">' + tok.type.substring(0,3).toUpperCase() + '</span>' +
    '</span>';
  }).join('');

  document.getElementById('ceTokenStat').innerHTML = '<i class="fas fa-circle ce-dot-dim"></i> Tokens: ' + visible.length;
}

function ceRenderAST(ast, nodeCount) {
  let treeEl = document.getElementById('ceAstTree');
  let countEl = document.getElementById('ceAstCount');
  if (!treeEl) return;
  if (countEl) countEl.textContent = nodeCount;

  function nodeClass(type) {
    let map = {
      'Program':'ce-nt-Program','FunctionDecl':'ce-nt-FunctionDecl','VarDecl':'ce-nt-VarDecl',
      'ForStatement':'ce-nt-ForStatement','WhileStatement':'ce-nt-WhileStatement',
      'IfStatement':'ce-nt-IfStatement','ReturnStatement':'ce-nt-ReturnStatement',
      'CallExpression':'ce-nt-CallExpression','BinaryExpr':'ce-nt-BinaryExpr',
      'AssignExpr':'ce-nt-AssignExpr','Identifier':'ce-nt-Identifier','Literal':'ce-nt-Literal',
      'Block':'ce-nt-Block','ExprStatement':'ce-nt-ExprStatement',
    };
    return map[type] || 'ce-nt-Default';
  }

  function buildNode(node, depth) {
    let hasChildren = node.children && node.children.length > 0;
    let toggleHtml  = hasChildren ? '<span class="ce-ast-toggle open">▶</span>' : '<span class="ce-ast-toggle" style="visibility:hidden">▶</span>';
    let val = node.value !== null && node.value !== undefined ? '<span class="ce-ast-value">' + String(node.value).substring(0,30).replace(/</g,'&lt;') + '</span>' : '';

    let html = '<div class="ce-ast-node" data-nodeid="' + node.id + '">' +
      '<div class="ce-ast-row" data-nodeid="' + node.id + '">' +
        toggleHtml +
        '<span class="ce-ast-type ' + nodeClass(node.type) + '">' + node.type + '</span>' +
        val +
      '</div>';

    if (hasChildren) {
      html += '<div class="ce-ast-children">';
      node.children.forEach(function(child) { if (child) html += buildNode(child, depth+1); });
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  treeEl.innerHTML = buildNode(ast, 0);

  // Toggle clicks
  treeEl.querySelectorAll('.ce-ast-row').forEach(function(row) {
    row.addEventListener('click', function(e) {
      let nodeEl   = row.parentElement;
      let children = nodeEl.querySelector('.ce-ast-children');
      let toggle   = row.querySelector('.ce-ast-toggle');
      if (!children) return;
      let collapsed = children.classList.toggle('collapsed');
      if (toggle) toggle.classList.toggle('open', !collapsed);
    });
  });

  document.getElementById('ceNodeStat').innerHTML = '<i class="fas fa-circle ce-dot-dim"></i> AST nodes: ' + nodeCount;
}

function ceRenderOptimizer(hints) {
  let listEl  = document.getElementById('ceOptList');
  let countEl = document.getElementById('ceOptCount');
  if (!listEl) return;

  let warnCount = hints.filter(function(h) { return h.type !== 'ok'; }).length;
  if (countEl) countEl.textContent = warnCount || '✓';

  if (hints.length === 0) { listEl.innerHTML = '<div class="ce-opt-none">No optimization hints for this code.</div>'; return; }

  listEl.innerHTML = hints.map(function(h) {
    let codeBlock = '';
    if (h.before) {
      codeBlock = '<div class="ce-opt-code">' +
        '<span class="ce-opt-before">' + h.before.replace(/</g,'&lt;') + '</span><br>' +
        '<span class="ce-opt-after">→ ' + h.after.replace(/</g,'&lt;') + '</span>' +
      '</div>';
    }
    let lineRef = h.line ? '<div class="ce-opt-line">Line ' + h.line + '</div>' : '';
    return '<div class="ce-opt-item ce-opt-' + h.type + '">' +
      '<span class="ce-opt-icon">' + h.icon + '</span>' +
      '<div class="ce-opt-body">' +
        '<div class="ce-opt-title">' + h.title + '</div>' +
        '<div class="ce-opt-desc">' + h.desc.replace(/</g,'&lt;') + '</div>' +
        codeBlock + lineRef +
      '</div>' +
    '</div>';
  }).join('');

  document.getElementById('ceOptStat').innerHTML = '<i class="fas fa-circle ce-dot-warn"></i> Hints: ' + warnCount;
}

function ceRenderBytecode(instructions) {
  let wrapEl  = document.getElementById('ceBytecodeWrap');
  let countEl = document.getElementById('ceBcCount');
  if (!wrapEl) return;
  if (countEl) countEl.textContent = instructions.length;

  wrapEl.innerHTML = '<table class="ce-bytecode-table">' +
    '<thead><tr><th>Addr</th><th>Opcode</th><th>Operand</th><th>Comment</th></tr></thead>' +
    '<tbody>' +
    instructions.map(function(instr) {
      let opEsc = instr.op.replace(/</g,'&lt;');
      let opEscOp = instr.operand.replace(/</g,'&lt;');
      let opEscCmt = instr.comment.replace(/</g,'&lt;');
      return '<tr>' +
        '<td class="ce-bc-addr">' + instr.addr + '</td>' +
        '<td class="ce-bc-op"><span class="' + instr.cls + '">' + opEsc + '</span></td>' +
        '<td class="ce-bc-operand">' + opEscOp + '</td>' +
        '<td class="ce-bc-comment">; ' + opEscCmt + '</td>' +
      '</tr>';
    }).join('') +
    '</tbody></table>';
}

/* ─── Pipeline progress ─── */
function ceSetPipStage(stage) {
  document.querySelectorAll('.ce-stage-pip').forEach(function(pip, i) {
    pip.classList.remove('ce-pip-done', 'ce-pip-active');
    if (i < stage)  pip.classList.add('ce-pip-done');
    if (i === stage) pip.classList.add('ce-pip-active');
  });
}

function ceSetPipDone() {
  document.querySelectorAll('.ce-stage-pip').forEach(function(pip) {
    pip.classList.remove('ce-pip-active');
    pip.classList.add('ce-pip-done');
  });
}

/* ─── Tab switching ─── */
function ceSwitchTab(stage) {
  document.querySelectorAll('.ce-stage-tab').forEach(function(tab, i) {
    tab.classList.toggle('active', i === stage);
  });
  document.querySelectorAll('.ce-stage-panel').forEach(function(panel, i) {
    panel.classList.toggle('active', i === stage);
  });
}

/* ─── Gutter / line numbers ─── */
function ceUpdateGutter(code) {
  let gutter = document.getElementById('ceGutter');
  if (!gutter) return;
  let count = code.split('\n').length;
  gutter.innerHTML = Array.from({ length: count }, function(_, i) {
    return '<span class="ce-gutter-line">' + (i+1) + '</span>';
  }).join('');
}

/* ─── Status bar ─── */
function ceSetStatus(msg) {
  let el = document.getElementById('ceStatusMsg');
  if (el) el.textContent = msg;
}

/* ─── Main compile function ─── */
function ceCompile() {
  let sourceEl = document.getElementById('ceSource');
  if (!sourceEl) return;
  let code = sourceEl.value.trim();
  if (!code) { ceSetStatus('No code to compile. Paste some code or load an example.'); return; }

  let runBtn = document.getElementById('ceRunBtn');
  if (runBtn) runBtn.classList.add('ce-running');
  ceSetStatus('Compiling...');

  // Stage 0: Tokenize
  ceSetPipStage(0);
  setTimeout(function() {
    let tokens = ceTokenize(code);
    ceRenderTokens(tokens);

    // Stage 1: Parse AST
    ceSetPipStage(1);
    setTimeout(function() {
      let parsed = ceParse(tokens);
      ceRenderAST(parsed.ast, parsed.nodeCount);

      // Stage 2: Optimize
      ceSetPipStage(2);
      setTimeout(function() {
        let hints = ceOptimize(code, parsed.ast);
        ceRenderOptimizer(hints);

        // Stage 3: Bytecode
        ceSetPipStage(3);
        setTimeout(function() {
          let instructions = ceGenBytecode(parsed.ast, code);
          ceRenderBytecode(instructions);

          ceSetPipDone();
          if (runBtn) runBtn.classList.remove('ce-running');
          ceSetStatus('Compiled successfully — ' + tokens.filter(function(t){return t.type!=='whitespace';}).length + ' tokens, ' + parsed.nodeCount + ' AST nodes, ' + instructions.length + ' instructions.');

          // Switch to tokens tab to show result
          ceSwitchTab(0);

        }, 200);
      }, 200);
    }, 200);
  }, 50);
}

/* ─── Syntax highlight overlay ─── */
function ceHighlight(code) {
  let hl = document.getElementById('ceHighlight');
  if (!hl) return;
  let escaped = code
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');

  // Apply simple highlights via regex substitution
  // Order matters: comments first, then strings, then keywords
  escaped = escaped.replace(/(\/\/[^\n]*)/g, '<span class="ce-hl-comment">$1</span>');
  escaped = escaped.replace(/(["'`])(?:\\.|[^\\])*?\1/g, function(m) { return '<span class="ce-hl-string">' + m + '</span>'; });
  escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, '<span class="ce-hl-number">$1</span>');

  let kws = Array.from(CE_KEYWORDS).join('|');
  escaped = escaped.replace(new RegExp('\\b(' + kws + ')\\b', 'g'), '<span class="ce-hl-keyword">$1</span>');

  let builtins = Array.from(CE_BUILTINS).join('|');
  escaped = escaped.replace(new RegExp('\\b(' + builtins + ')\\b', 'g'), '<span class="ce-hl-builtin">$1</span>');

  hl.innerHTML = escaped;
  hl.scrollTop  = document.getElementById('ceSource').scrollTop;
  hl.scrollLeft = document.getElementById('ceSource').scrollLeft;
}

/* ─── Resize handle ─── */
function ceInitResize() {
  let handle    = document.getElementById('ceResizeHandle');
  let editorPane = document.getElementById('ceEditorPane');
  if (!handle || !editorPane) return;

  let dragging = false; let startX = 0; let startW = 0;

  handle.addEventListener('mousedown', function(e) {
    dragging = true; startX = e.clientX; startW = editorPane.offsetWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    let delta = e.clientX - startX;
    let newW  = Math.max(180, Math.min(startW + delta, window.innerWidth - 300));
    editorPane.style.width = newW + 'px';
  });

  document.addEventListener('mouseup', function() {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}

/* ─── Init ─── */
function ceInit() {
  let sourceEl = document.getElementById('ceSource');
  let runBtn   = document.getElementById('ceRunBtn');
  let selectEl = document.getElementById('cePresetSelect');

  // Populate preset dropdown
  if (selectEl) {
    CE_PRESETS.forEach(function(p, i) {
      let opt = document.createElement('option');
      opt.value = i; opt.textContent = p.label;
      selectEl.appendChild(opt);
    });

    selectEl.addEventListener('change', function() {
      let idx = parseInt(selectEl.value);
      if (isNaN(idx) || !CE_PRESETS[idx]) return;
      if (sourceEl) {
        sourceEl.value = CE_PRESETS[idx].value || CE_PRESETS[idx].code;
        ceUpdateGutter(sourceEl.value);
        ceHighlight(sourceEl.value);
        // Update file tab name
        let tab = document.getElementById('ceCurrentFile');
        if (tab) tab.textContent = CE_PRESETS[idx].label.toLowerCase().replace(/ /g,'-') + '.js';
      }
      ceCompile();
      selectEl.value = '';
    });
  }

  // Run button
  if (runBtn) runBtn.addEventListener('click', ceCompile);

  // Source editor events
  if (sourceEl) {
    sourceEl.addEventListener('input', function() {
      ceUpdateGutter(sourceEl.value);
      ceHighlight(sourceEl.value);
    });

    sourceEl.addEventListener('scroll', function() {
      let gutter = document.getElementById('ceGutter');
      let hl     = document.getElementById('ceHighlight');
      if (gutter) gutter.scrollTop = sourceEl.scrollTop;
      if (hl) { hl.scrollTop = sourceEl.scrollTop; hl.scrollLeft = sourceEl.scrollLeft; }
    });

    sourceEl.addEventListener('keydown', function(e) {
      // Ctrl+Enter to compile
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); ceCompile(); return; }

      // Tab key inserts 2 spaces
      if (e.key === 'Tab') {
        e.preventDefault();
        let start = sourceEl.selectionStart;
        let end   = sourceEl.selectionEnd;
        sourceEl.value = sourceEl.value.substring(0, start) + '  ' + sourceEl.value.substring(end);
        sourceEl.selectionStart = sourceEl.selectionEnd = start + 2;
        ceUpdateGutter(sourceEl.value);
        ceHighlight(sourceEl.value);
      }
    });

    // Cursor position
    sourceEl.addEventListener('click', function() { ceUpdateCursorPos(); });
    sourceEl.addEventListener('keyup',  function() { ceUpdateCursorPos(); });
  }

  // Stage tabs
  document.querySelectorAll('.ce-stage-tab').forEach(function(tab, i) {
    tab.addEventListener('click', function() { ceSwitchTab(i); });
  });

  // Expand/Collapse all AST buttons
  let expandAll   = document.getElementById('ceAstExpandAll');
  let collapseAll = document.getElementById('ceAstCollapseAll');
  if (expandAll) {
    expandAll.addEventListener('click', function() {
      document.querySelectorAll('#ceAstTree .ce-ast-children').forEach(function(c) { c.classList.remove('collapsed'); });
      document.querySelectorAll('#ceAstTree .ce-ast-toggle').forEach(function(t) { t.classList.add('open'); });
    });
  }
  if (collapseAll) {
    collapseAll.addEventListener('click', function() {
      document.querySelectorAll('#ceAstTree .ce-ast-children').forEach(function(c) { c.classList.add('collapsed'); });
      document.querySelectorAll('#ceAstTree .ce-ast-toggle').forEach(function(t) { t.classList.remove('open'); });
    });
  }

  // Resize handle
  ceInitResize();

  // Load first preset
  if (sourceEl && CE_PRESETS[1]) {
    sourceEl.value = CE_PRESETS[1].code;
    ceUpdateGutter(sourceEl.value);
    ceHighlight(sourceEl.value);
    ceCompile();
  }
}

function ceUpdateCursorPos() {
  let sourceEl = document.getElementById('ceSource');
  let el = document.getElementById('ceLinCol');
  if (!sourceEl || !el) return;
  let text   = sourceEl.value.substring(0, sourceEl.selectionStart);
  let lines  = text.split('\n');
  let ln     = lines.length;
  let col    = lines[lines.length - 1].length + 1;
  el.textContent = 'Ln ' + ln + ', Col ' + col;
}