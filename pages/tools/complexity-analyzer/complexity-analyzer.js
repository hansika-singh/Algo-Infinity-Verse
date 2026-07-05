// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Code to Complexity Analyzer only
// All globals prefixed ca_ or CA_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  caInit();
});

/* ─── Complexity levels ─── */
var CA_LEVELS = ['O(1)','O(log n)','O(n)','O(n log n)','O(n²)','O(n³)','O(2ⁿ)','O(n!)'];
var CA_RANK   = { 'O(1)':0,'O(log n)':1,'O(n)':2,'O(n log n)':3,'O(n²)':4,'O(n³)':5,'O(2ⁿ)':6,'O(n!)':7 };
var CA_CLASS  = { 'O(1)':'ca-o1','O(log n)':'ca-ologn','O(n)':'ca-on','O(n log n)':'ca-onlogn','O(n²)':'ca-on2','O(n³)':'ca-on3','O(2ⁿ)':'ca-o2n','O(n!)':'ca-ofact' };
var CA_DANGER = {
  'O(1)':'ok','O(log n)':'ok','O(n)':'ok','O(n log n)':'ok',
  'O(n²)':'warn','O(n³)':'bad','O(2ⁿ)':'bad','O(n!)':'bad'
};
var CA_DANGER_LABEL = {
  'O(1)':'✅ Excellent','O(log n)':'✅ Excellent','O(n)':'✅ Good',
  'O(n log n)':'✅ Good','O(n²)':'⚠️ Warning — slow on large n',
  'O(n³)':'❌ Danger — avoid for n > 500','O(2ⁿ)':'❌ Critical — exponential growth',
  'O(n!)':'❌ Critical — only feasible for n < 12'
};

/* ─── Code presets ─── */
var CA_PRESETS = [
  {
    label: 'Linear Search',
    code: [
      'function linearSearch(arr, target) {',
      '  for (let i = 0; i < n; i++) {',
      '    if (arr[i] === target) {',
      '      return i;',
      '    }',
      '  }',
      '  return -1;',
      '}',
    ].join('\n'),
  },
  {
    label: 'Binary Search',
    code: [
      'function binarySearch(arr, target) {',
      '  let lo = 0, hi = n - 1;',
      '  while (lo <= hi) {',
      '    let mid = Math.floor((lo + hi) / 2);',
      '    if (arr[mid] === target) return mid;',
      '    else if (arr[mid] < target) lo = mid + 1;',
      '    else hi = mid - 1;',
      '  }',
      '  return -1;',
      '}',
    ].join('\n'),
  },
  {
    label: 'Bubble Sort',
    code: [
      'function bubbleSort(arr) {',
      '  for (let i = 0; i < n; i++) {',
      '    for (let j = 0; j < n - i - 1; j++) {',
      '      if (arr[j] > arr[j+1]) {',
      '        let temp = arr[j];',
      '        arr[j] = arr[j+1];',
      '        arr[j+1] = temp;',
      '      }',
      '    }',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'Merge Sort',
    code: [
      'function mergeSort(arr, lo, hi) {',
      '  if (lo >= hi) return;',
      '  let mid = Math.floor((lo + hi) / 2);',
      '  mergeSort(arr, lo, mid);',
      '  mergeSort(arr, mid + 1, hi);',
      '  merge(arr, lo, mid, hi);',
      '}',
      'function merge(arr, lo, mid, hi) {',
      '  let L = arr.slice(lo, mid + 1);',
      '  let R = arr.slice(mid + 1, hi + 1);',
      '  let i = 0, j = 0, k = lo;',
      '  while (i < L.length && j < R.length) {',
      '    if (L[i] <= R[j]) arr[k++] = L[i++];',
      '    else arr[k++] = R[j++];',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'BFS Graph',
    code: [
      'function bfs(graph, start) {',
      '  let visited = new Set();',
      '  let queue = [start];',
      '  visited.add(start);',
      '  while (queue.length > 0) {',
      '    let node = queue.shift();',
      '    for (let neighbor of graph[node]) {',
      '      if (!visited.has(neighbor)) {',
      '        visited.add(neighbor);',
      '        queue.push(neighbor);',
      '      }',
      '    }',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'Naive Fibonacci',
    code: [
      'function fib(n) {',
      '  if (n <= 1) return n;',
      '  return fib(n - 1) + fib(n - 2);',
      '}',
    ].join('\n'),
  },
  {
    label: 'LCS (DP)',
    code: [
      'function lcs(s1, s2) {',
      '  let m = s1.length, n = s2.length;',
      '  let dp = [];',
      '  for (let i = 0; i <= m; i++) {',
      '    dp[i] = new Array(n + 1).fill(0);',
      '    for (let j = 0; j <= n; j++) {',
      '      if (i === 0 || j === 0) dp[i][j] = 0;',
      '      else if (s1[i-1] === s2[j-1])',
      '        dp[i][j] = dp[i-1][j-1] + 1;',
      '      else',
      '        dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);',
      '    }',
      '  }',
      '  return dp[m][n];',
      '}',
    ].join('\n'),
  },
  {
    label: 'Matrix Multiply',
    code: [
      'function matMul(A, B, n) {',
      '  let C = [];',
      '  for (let i = 0; i < n; i++) {',
      '    C[i] = [];',
      '    for (let j = 0; j < n; j++) {',
      '      C[i][j] = 0;',
      '      for (let k = 0; k < n; k++) {',
      '        C[i][j] += A[i][k] * B[k][j];',
      '      }',
      '    }',
      '  }',
      '  return C;',
      '}',
    ].join('\n'),
  },
];

/* ─── Pattern detectors ─── */
// Returns array of {lineIdx, complexity, reason, pattern}
function caAnalyzeCode(code) {
  var lines   = code.split('\n');
  var results = [];
  var loopStack = []; // track nesting: each entry = 'loop'|'halving'|'recurse'|'other'

  // Heuristics per line
  lines.forEach(function(raw, idx) {
    var line    = raw.trim();
    var lineNum = idx + 1;

    if (!line || line.startsWith('//') || line.startsWith('#') || line.startsWith('/*') || line.startsWith('*')) {
      results.push({ lineNum: lineNum, complexity: null, reason: null, pattern: 'comment' });
      return;
    }

    var complexity = null;
    var reason     = null;
    var pattern    = null;

    // ── Closing brace: pop loop stack ──
    if (/^\}/.test(line) || /^end$/.test(line)) {
      if (loopStack.length > 0) loopStack.pop();
      results.push({ lineNum: lineNum, complexity: null, reason: null, pattern: 'close' });
      return;
    }

    // ── Recursion with two calls (exponential) ──
    var twoRecurse = line.match(/\b(\w+)\s*\(.*\)\s*\+\s*\1\s*\(/);
    if (!twoRecurse) {
      twoRecurse = line.match(/return\s+\w+\(.*\)\s*[+\-\*\/]\s*\w+\(/);
    }
    if (twoRecurse) {
      loopStack.push('recurse2');
      complexity = 'O(2ⁿ)';
      reason     = 'Two recursive calls per invocation → exponential branching';
      pattern    = 'double-recursion';
    }

    // ── Single recursion (check for n-1 pattern) ──
    else if (!complexity && /\b\w+\s*\(\s*\w+\s*-\s*1\s*\)/.test(line) && /return/.test(line)) {
      loopStack.push('recurse1');
      complexity = 'O(n)';
      reason     = 'Single tail recursion — linear depth call stack';
      pattern    = 'tail-recursion';
    }

    // ── Permutation / factorial pattern ──
    else if (!complexity && (/permut/i.test(line) || /factorial/i.test(line) || /\bn!\b/.test(line))) {
      complexity = 'O(n!)';
      reason     = 'Permutation/factorial generation — visits all n! orderings';
      pattern    = 'factorial';
    }

    // ── for/while loop ──
    else if (!complexity && /^\s*(for|while)\s*\(/.test(raw)) {
      // Detect halving: lo = mid+1 / hi = mid-1 / i *= 2 / i >>= 1
      var halvingInBody = false;
      // Look ahead up to 5 lines for halving signals
      for (var k = idx+1; k < Math.min(idx+6, lines.length); k++) {
        if (/mid\s*[+\-]\s*1|i\s*\*=\s*2|i\s*>>=\s*1|n\s*\/=\s*2|hi\s*=\s*mid|lo\s*=\s*mid/.test(lines[k])) {
          halvingInBody = true; break;
        }
      }

      var depth = loopStack.filter(function(t) { return t === 'loop' || t === 'halving'; }).length;

      if (halvingInBody) {
        loopStack.push('halving');
        complexity = depth === 0 ? 'O(log n)' : depth === 1 ? 'O(n log n)' : 'O(n² log n)';
        reason     = depth === 0 ? 'Loop halves the search space each iteration → O(log n)' :
                     depth === 1 ? 'Outer loop O(n) × inner halving O(log n) → O(n log n)' :
                                   'Nested inside loop(s) × halving → O(n² log n)';
        pattern    = depth === 0 ? 'binary-search-pattern' : 'divide-conquer';
      } else {
        loopStack.push('loop');
        complexity = depth === 0 ? 'O(n)' :
                     depth === 1 ? 'O(n²)' :
                     depth >= 2  ? 'O(n³)' : 'O(n)';
        reason     = depth === 0 ? 'Single loop over input → O(n)' :
                     depth === 1 ? 'Nested inside 1 loop → O(n²)' :
                                   'Triple nested loops → O(n³)';
        pattern    = depth === 0 ? 'single-loop' :
                     depth === 1 ? 'nested-loop' : 'triple-nested';
      }
    }

    // ── Divide-and-conquer recursion: mergeSort(arr, lo, mid) style ──
    else if (!complexity && /\b\w+\s*\(\s*\w+\s*,\s*(lo|left|start|mid)/.test(line) && /recurse|sort|search|merge|divide/.test(line.toLowerCase())) {
      complexity = 'O(n log n)';
      reason     = 'Divide-and-conquer recursion — log n levels, O(n) work per level';
      pattern    = 'divide-conquer';
    }

    // ── Array/map access ──
    else if (!complexity && (/\w+\[/.test(line) || /\.get\(|\.set\(|\.has\(/.test(line)) && !/for|while/.test(line)) {
      complexity = 'O(1)';
      reason     = 'Array index or hash map operation — constant time';
      pattern    = 'constant-access';
    }

    // ── Sort call ──
    else if (!complexity && /\.sort\(/.test(line)) {
      var depth = loopStack.filter(function(t) { return t === 'loop'; }).length;
      complexity = depth === 0 ? 'O(n log n)' : 'O(n² log n)';
      reason     = depth === 0 ? 'Built-in sort — O(n log n)' : 'Sort inside loop → O(n² log n)';
      pattern    = 'builtin-sort';
    }

    // ── Queue shift (common BFS) ──
    else if (!complexity && /\.shift\(\)/.test(line)) {
      var shiftDepth = loopStack.filter(function(t) { return t === 'loop' || t === 'halving'; }).length;
      complexity = shiftDepth === 0 ? 'O(n)' : shiftDepth === 1 ? 'O(n²)' : 'O(n³)';
      reason     = shiftDepth > 0
        ? 'Array.shift() inside a loop is O(n) per iteration. Use a proper queue/head index for O(1) dequeue.'
        : 'Array.shift() is O(n) — each call re-indexes the array. Use a proper queue for O(1).';
      pattern    = 'shift-warning';
    }

    // ── Push/pop ──
    else if (!complexity && (/\.push\(|\.pop\(\)/.test(line)) && !/for|while/.test(line)) {
      complexity = 'O(1)';
      reason     = 'Array push/pop — amortized O(1)';
      pattern    = 'constant';
    }

    // ── Assignment, return, comparison — O(1) ──
    else if (!complexity && (/^\s*(let|const|var|int|float|string)\s/.test(raw) || /^return\s/.test(line) || /^if\s*\(|^else/.test(line))) {
      complexity = 'O(1)';
      reason     = 'Single statement — constant time';
      pattern    = 'constant';
    }

    results.push({ lineNum: lineNum, complexity: complexity, reason: reason, pattern: pattern, raw: raw });
  });

  return results;
}

/* ─── Derive overall complexity ─── */
function caDeriveOverall(lineResults) {
  var maxTime  = 'O(1)';
  var maxSpace = 'O(1)';
  var steps    = [];
  var patterns = [];

  lineResults.forEach(function(r) {
    if (!r.complexity) return;
    if (CA_RANK[r.complexity] > CA_RANK[maxTime]) {
      maxTime = r.complexity;
    }
    // Space heuristics
    if (r.pattern === 'nested-loop' || r.pattern === 'divide-conquer') {
      if (CA_RANK['O(n)'] > CA_RANK[maxSpace]) maxSpace = 'O(n)';
    }
    if (r.pattern === 'double-recursion') {
      if (CA_RANK['O(n)'] > CA_RANK[maxSpace]) maxSpace = 'O(n)';
    }
  });

  // Build derivation steps
  var seenPatterns = {};
  lineResults.forEach(function(r) {
    if (!r.complexity || !r.reason || seenPatterns[r.pattern]) return;
    seenPatterns[r.pattern] = true;

    var type = 'ca-deriv-base';
    if (r.pattern === 'nested-loop' || r.pattern === 'double-recursion') type = 'ca-deriv-multiply';
    if (r.pattern === 'single-loop' || r.pattern === 'tail-recursion') type = 'ca-deriv-add';

    steps.push({ icon: caPatternIcon(r.pattern), text: r.reason, complexity: r.complexity, type: type, lineNum: r.lineNum });

    if (!seenPatterns['_detected_' + r.pattern]) {
      seenPatterns['_detected_' + r.pattern] = true;
      patterns.push({ icon: caPatternIcon(r.pattern), name: caPatternName(r.pattern), detail: r.reason, lineNum: r.lineNum });
    }
  });

  // Final step
  steps.push({
    icon: '🏁',
    text: 'Overall time complexity: dominant term wins → ' + maxTime,
    complexity: maxTime,
    type: 'ca-deriv-final',
    lineNum: null,
  });

  return { time: maxTime, space: maxSpace, steps: steps, patterns: patterns };
}

function caPatternIcon(p) {
  var map = {
    'double-recursion':'🌳','tail-recursion':'🔄','single-loop':'➰','nested-loop':'🔁',
    'triple-nested':'🔂','halving':'✂️','binary-search-pattern':'🔍','divide-conquer':'⚡',
    'constant':'⚡','constant-access':'📦','builtin-sort':'🔃','factorial':'🌌',
    'shift-warning':'⚠️','comment':'💬','close':'',
  };
  return map[p] || '▶️';
}

function caPatternName(p) {
  var map = {
    'double-recursion':'Exponential Branching Recursion',
    'tail-recursion':'Linear Recursion',
    'single-loop':'Single Loop (O(n))',
    'nested-loop':'Nested Loops (O(n²))',
    'triple-nested':'Triple Nested Loops (O(n³))',
    'binary-search-pattern':'Halving Loop (Binary Search)',
    'divide-conquer':'Divide and Conquer',
    'constant':'Constant Operation',
    'constant-access':'O(1) Data Structure Access',
    'builtin-sort':'Built-in Sort (n log n)',
    'factorial':'Factorial / Permutation',
    'shift-warning':'⚠️ Array.shift() — Hidden O(n)',
  };
  return map[p] || p;
}

/* ─── Render line numbers ─── */
function caRenderLineNums(code) {
  var el = document.getElementById('caLineNums');
  if (!el) return;
  var count = code.split('\n').length;
  el.innerHTML = Array.from({ length: count }, function(_, i) {
    return '<span class="ca-line-num">' + (i+1) + '</span>';
  }).join('');
}

/* ─── Render annotations ─── */
function caRenderAnnotations(lineResults) {
  var el = document.getElementById('caAnnotations');
  if (!el) return;
  el.innerHTML = lineResults.map(function(r) {
    if (!r.complexity) return '<div class="ca-anno-line"></div>';
    var cls = CA_CLASS[r.complexity] || 'ca-o1';
    var title = r.reason ? 'title="' + caEsc(r.reason) + '"' : '';
    return '<div class="ca-anno-line"><span class="ca-badge ' + cls + '" ' + title + '>' + caEsc(r.complexity) + '</span></div>';
  }).join('');
}

/* ─── Render verdict ─── */
function caRenderVerdict(result) {
  var card = document.getElementById('caVerdictCard');
  if (!card) return;
  card.setAttribute('role', 'status');
  card.setAttribute('aria-live', 'polite');
  card.setAttribute('aria-atomic', 'true');

  var timeCls   = CA_CLASS[result.time]  || 'ca-on';
  var spaceCls  = CA_CLASS[result.space] || 'ca-on';
  var dangerCls = 'ca-danger-' + (CA_DANGER[result.time] || 'ok');
  var dangerLbl = CA_DANGER_LABEL[result.time] || '';

  card.innerHTML =
    '<div class="ca-card-title"><i class="fas fa-gavel"></i> Complexity Verdict</div>' +
    '<div class="ca-verdict-result">' +
      '<div class="ca-verdict-time">' +
        '<span class="ca-verdict-label">Time</span>' +
        '<span class="ca-verdict-badge ' + timeCls + '">' + caEsc(result.time) + '</span>' +
      '</div>' +
      '<div class="ca-verdict-space">' +
        '<span class="ca-verdict-label">Space</span>' +
        '<span class="ca-verdict-badge ' + spaceCls + '">' + caEsc(result.space) + '</span>' +
      '</div>' +
      '<div class="ca-verdict-explanation">' +
        '<strong>Why:</strong> ' + caGetExplanation(result.time) +
      '</div>' +
      '<div class="ca-danger-badge ' + dangerCls + '">' + caEsc(dangerLbl) + '</div>' +
    '</div>'
}
    '</div>';

  card.style.borderColor = caGetBorderColor(result.time);


function caGetBorderColor(c) {
  var map = { 'O(1)':'rgba(100,116,139,0.35)','O(log n)':'rgba(34,197,94,0.35)','O(n)':'rgba(6,182,212,0.35)','O(n log n)':'rgba(168,85,247,0.35)','O(n²)':'rgba(245,158,11,0.45)','O(n³)':'rgba(249,115,22,0.45)','O(2ⁿ)':'rgba(239,68,68,0.45)','O(n!)':'rgba(236,72,153,0.5)' };
  return map[c] || 'var(--glass-border)';
}

function caGetExplanation(c) {
  var map = {
    'O(1)':'Constant time — no loops, no recursion. Executes the same number of operations regardless of input size.',
    'O(log n)':'Logarithmic — the search space is halved each step. For n=1,000,000, only ~20 iterations needed.',
    'O(n)':'Linear — one pass through the input. For n=1,000,000, about 1M operations. Fast and scalable.',
    'O(n log n)':'Linearithmic — typical of efficient divide-and-conquer sorts. For n=1M: ~20M operations. Industry standard.',
    'O(n²)':'Quadratic — nested loops. For n=10,000: 100M operations. Acceptable for small n, painful for large n.',
    'O(n³)':'Cubic — triple nested loops. For n=1,000: 1B operations. Avoid for n > 500.',
    'O(2ⁿ)':'Exponential — doubles with each added element. For n=30: over 1 billion operations. Never acceptable without memoization.',
    'O(n!)':'Factorial — for n=12: 479M operations, for n=13: 6.2B. Only feasible for n < 12.',
  };
  return map[c] || 'Complexity determined by dominant term.';
}

/* ─── Render derivation ─── */
function caRenderDerivation(steps) {
  var el = document.getElementById('caDerivationBody');
  if (!el) return;

  if (steps.length === 0) {
    el.innerHTML = '<div class="ca-deriv-placeholder">No complexity patterns detected.</div>';
    return;
  }

  el.innerHTML = steps.map(function(s) {
    var linePart = s.lineNum ? '<span class="ca-pattern-line">line ' + s.lineNum + '</span>' : '';
    var comp = s.complexity ? '<span class="ca-badge ' + (CA_CLASS[s.complexity] || 'ca-on') + '">' + caEsc(s.complexity) + '</span>' : '';
    return '<div class="ca-deriv-step ' + s.type + '">' +
      '<span class="ca-deriv-icon">' + (s.icon || '▶️') + '</span>' +
      '<span class="ca-deriv-text">' + caEsc(s.text) + ' ' + linePart + '</span>' +
      '<span class="ca-deriv-complexity">' + comp + '</span>' +
    '</div>';
  }).join('');
}

/* ─── Render patterns ─── */
function caRenderPatterns(patterns) {
  var el = document.getElementById('caPatternsBody');
  if (!el) return;

  if (patterns.length === 0) {
    el.innerHTML = '<div class="ca-deriv-placeholder">No patterns detected.</div>';
    return;
  }

  el.innerHTML = patterns.map(function(p) {
    return '<div class="ca-pattern-item">' +
      '<span class="ca-pattern-icon">' + (p.icon || '▶️') + '</span>' +
      '<span class="ca-pattern-text">' + caEsc(p.name) + '<br>' +
        '<span class="ca-pattern-line">' + caEsc(p.detail) + (p.lineNum ? ' (line ' + p.lineNum + ')' : '') + '</span>' +
      '</span>' +
    '</div>';
  }).join('');
}

/* ─── Main analyze function ─── */
function caAnalyze() {
  var editor = document.getElementById('caEditor');
  if (!editor) return;
  var code = editor.value;
  if (!code.trim()) {
    var verdictCard = document.getElementById('caVerdictCard');
    if (verdictCard) verdictCard.innerHTML = '<div class="ca-verdict-placeholder"><i class="fas fa-exclamation-circle"></i><p>Paste some code first!</p></div>';
    var annos = document.getElementById('caAnnotations');
    if (annos) annos.innerHTML = '';
    caRenderDerivation([]);
    caRenderPatterns([]);
    return;
  }

  var lineResults = caAnalyzeCode(code);
  var overall     = caDeriveOverall(lineResults);

  caRenderLineNums(code);
  caRenderAnnotations(lineResults);
  caRenderVerdict(overall);
  caRenderDerivation(overall.steps);
  caRenderPatterns(overall.patterns);
}

/* ─── Sync line numbers on scroll/type ─── */
function caSyncLineNums() {
  var editor  = document.getElementById('caEditor');
  var lineNums = document.getElementById('caLineNums');
  var annos   = document.getElementById('caAnnotations');
  if (!editor || !lineNums) return;
  lineNums.scrollTop = editor.scrollTop;
  if (annos) annos.scrollTop = editor.scrollTop;
}

/* ─── Init ─── */
function caInit() {
  var editor     = document.getElementById('caEditor');
  var analyzeBtn = document.getElementById('caAnalyzeBtn');
  var clearBtn   = document.getElementById('caClearBtn');
  var copyBtn    = document.getElementById('caCopyBtn');
  var presetWrap = document.getElementById('caPresetBtns');

  // Presets
  if (presetWrap) {
    CA_PRESETS.forEach(function(p, i) {
      var btn = document.createElement('button');
      btn.className = 'ca-preset-btn';
      btn.type = 'button';
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = p.label;
      btn.addEventListener('click', function() {
        presetWrap.querySelectorAll('.ca-preset-btn').forEach(function(b) {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        if (editor) {
          editor.value = p.code;
          caRenderLineNums(p.code);
          // Clear annotations until user re-analyzes
          var annos = document.getElementById('caAnnotations');
          if (annos) annos.innerHTML = '';
          caAnalyze();
        }
      });
      presetWrap.appendChild(btn);
    });
  }

  // Analyze button
  if (analyzeBtn) analyzeBtn.addEventListener('click', caAnalyze);

  // Keyboard shortcut: Ctrl+Enter
  if (editor) {
    editor.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); caAnalyze(); }
    });
    editor.addEventListener('input', function() { caRenderLineNums(editor.value); });
    editor.addEventListener('scroll', caSyncLineNums);
  }

  // Clear
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (editor) editor.value = '';
      var lineNums = document.getElementById('caLineNums');
      var annos    = document.getElementById('caAnnotations');
      if (lineNums) lineNums.innerHTML = '';
      if (annos)    annos.innerHTML = '';
      var verdict = document.getElementById('caVerdictCard');
      if (verdict) verdict.innerHTML = '<div class="ca-verdict-placeholder"><i class="fas fa-magnifying-glass-chart"></i><p>Paste code and click Analyze to see your complexity verdict.</p></div>';
      var deriv = document.getElementById('caDerivationBody');
      if (deriv) deriv.innerHTML = '<div class="ca-deriv-placeholder">Derivation steps will appear here after analysis.</div>';
      var pats = document.getElementById('caPatternsBody');
      if (pats) pats.innerHTML = '<div class="ca-deriv-placeholder">Recognized code patterns appear here.</div>';
      presetWrap && presetWrap.querySelectorAll('.ca-preset-btn').forEach(function(b) { b.classList.remove('active'); });
    });
  }

  // Copy
  if (copyBtn) {
    copyBtn.addEventListener('click', function() {
      if (!editor) return;
      navigator.clipboard.writeText(editor.value).then(function() {
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(function() { copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 1500);
      });
    });
  }

  // Load first preset by default
  if (presetWrap) {
    var first = presetWrap.querySelector('.ca-preset-btn');
    if (first) first.click();
  }
}

/* ─── Escape ─── */
function caEsc(str) {
  var d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}