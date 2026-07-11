/**
 * Big-O-AST-Linter.js
 * Implements an in-browser Abstract Syntax Tree (AST) static analyzer
 * AND a Dynamic Runtime Complexity Profiler.
 */

/* global CodeMirror, Chart, acorn */

document.addEventListener('DOMContentLoaded', () => {
  initEditors();
  initDynamicProfiler();
});

let editorA;
let editorB;
let parseTimeout;
let codeMarkersA = [];
let profilerChart;

// UI Elements
const els = {
  editorContainerA: document.getElementById('editorContainerA'),
  editorContainerB: document.getElementById('editorContainerB'),
  timeComplexity: document.getElementById('timeComplexity'),
  spaceComplexity: document.getElementById('spaceComplexity'),
  parseStatus: document.getElementById('parseStatus'),
  nodeCount: document.getElementById('nodeCount'),
  parseTime: document.getElementById('parseTime'),
  runProfilerBtn: document.getElementById('runProfilerBtn'),
};

const COMPLEXITY_COLORS = {
  'O(1)': 'var(--o-constant)',
  'O(N)': 'var(--o-linear)',
  'O(N^2)': 'var(--o-quadratic)',
  'O(2^N)': 'var(--o-exponential)',
  'O(N!)': 'var(--o-exponential)',
};

const defaultBubbleSort = `// Editor A: Bubble Sort (O(N^2))
function sort(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    return arr;
}`;

const defaultQuickSort = `// Editor B: Quick Sort (O(N log N))
function sort(arr) {
    if (arr.length <= 1) return arr;
    const pivot = arr[arr.length - 1];
    const left = [];
    const right = [];
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] < pivot) left.push(arr[i]);
        else right.push(arr[i]);
    }
    return [...sort(left), pivot, ...sort(right)];
}`;

function initEditors() {
  CodeMirror.defineGutter('linter-gutter', {
    class: 'CodeMirror-linter-gutter',
  });

  // Editor A
  editorA = CodeMirror(els.editorContainerA, {
    lineNumbers: true,
    theme: 'material-palenight',
    mode: 'javascript',
    gutters: ['CodeMirror-linenumbers', 'linter-gutter'],
    value: defaultBubbleSort,
    indentUnit: 4,
    matchBrackets: true,
  });

  // Editor B
  editorB = CodeMirror(els.editorContainerB, {
    lineNumbers: true,
    theme: 'material-palenight',
    mode: 'javascript',
    value: defaultQuickSort,
    indentUnit: 4,
    matchBrackets: true,
  });

  // Run initial AST analysis on Editor A
  analyzeCode(editorA);

  editorA.on('change', () => {
    clearTimeout(parseTimeout);
    parseTimeout = setTimeout(() => analyzeCode(editorA), 300);
  });
}

// --- Dynamic Profiler Engine ---
function initDynamicProfiler() {
  const ctx = document.getElementById('profilerChart');
  if (!ctx) return;

  profilerChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [10, 100, 1000, 5000],
      datasets: [
        {
          label: 'Editor A (Runtime ms)',
          data: [0, 0, 0, 0],
          borderColor: 'rgba(245, 158, 11, 1)', // Yellow
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          tension: 0.4,
        },
        {
          label: 'Editor B (Runtime ms)',
          data: [0, 0, 0, 0],
          borderColor: 'rgba(16, 185, 129, 1)', // Green
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Input Size (N)', color: '#94a3b8' },
          ticks: { color: '#94a3b8' },
        },
        y: {
          title: { display: true, text: 'Execution Time (ms)', color: '#94a3b8' },
          ticks: { color: '#94a3b8' },
        },
      },
      plugins: {
        legend: { labels: { color: '#f8fafc' } },
      },
    },
  });

  els.runProfilerBtn.addEventListener('click', runDynamicProfiler);
}

function runDynamicProfiler() {
  els.runProfilerBtn.disabled = true;
  els.runProfilerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Profiling...';

  const sizes = [10, 100, 1000, 5000];
  let resultsA = null;
  let resultsB = null;

  function checkComplete() {
    if (resultsA && resultsB) {
      updateChart(sizes, resultsA, resultsB);
      els.runProfilerBtn.disabled = false;
      els.runProfilerBtn.innerHTML = '<i class="fas fa-play"></i> Run Dynamic Profiler';
    }
  }

  runWorker(editorA.getValue(), sizes, 'A').then((res) => {
    resultsA = res;
    checkComplete();
  });

  runWorker(editorB.getValue(), sizes, 'B').then((res) => {
    resultsB = res;
    checkComplete();
  });
}

function runWorker(code, sizes, editorId) {
  return new Promise((resolve) => {
    const worker = new Worker('profilerWorker.js');

    worker.onmessage = function (e) {
      if (e.data.error) {
        console.error('Worker Error (' + editorId + '):', e.data.error);
        resolve(sizes.map(() => 0)); // Fallback
      } else if (e.data.success) {
        resolve(e.data.results.map((r) => r.timeMs));
      }
      worker.terminate();
    };

    worker.postMessage({ code, sizes, editorId });
  });
}

function updateChart(sizes, dataA, dataB) {
  profilerChart.data.labels = sizes;
  profilerChart.data.datasets[0].data = dataA;
  profilerChart.data.datasets[1].data = dataB;
  profilerChart.update();
}

// --- The AST Traversal Engine (Editor A Only) ---
function analyzeCode(cm) {
  const code = cm.getValue();
  const startTime = performance.now();
  let ast;

  try {
    ast = acorn.parse(code, { ecmaVersion: 2022, locations: true, sourceType: 'script' });
    if (els.parseStatus) {
      els.parseStatus.className = 'status-indicator valid';
      els.parseStatus.innerHTML = '<i class="fas fa-check-circle"></i> AST Valid';
    }
  } catch (e) {
    if (els.parseStatus) {
      els.parseStatus.className = 'status-indicator error';
      els.parseStatus.innerHTML = '<i class="fas fa-times-circle"></i> Syntax Error';
    }
    return;
  }

  const state = {
    totalNodes: 0,
    timeComplexityExp: 0,
    spaceComplexityExp: 0,
    isRecursive: false,
    recursiveBranches: 0,
    currentLoopDepth: 0,
    diagnostics: [],
  };

  const walk = function (node) {
    if (!node) return;
    state.totalNodes++;

    const isLoop = [
      'ForStatement',
      'WhileStatement',
      'DoWhileStatement',
      'ForOfStatement',
      'ForInStatement',
    ].includes(node.type);
    if (isLoop) {
      state.currentLoopDepth++;
      if (state.currentLoopDepth > state.timeComplexityExp)
        state.timeComplexityExp = state.currentLoopDepth;
      if (state.currentLoopDepth > 1) {
        state.diagnostics.push({
          line: node.loc.start.line - 1,
          type: 'warning',
          msg: `Nested Loop Detected: Increases time complexity to O(N^${state.currentLoopDepth})`,
        });
      }
    }

    if (
      node.type === 'NewExpression' ||
      node.type === 'ArrayExpression' ||
      node.type === 'ObjectExpression'
    ) {
      let spacePower = state.currentLoopDepth > 0 ? 2 : 1;
      if (spacePower > state.spaceComplexityExp) state.spaceComplexityExp = spacePower;
    }

    if (node.type === 'FunctionDeclaration') {
      const funcName = node.id.name;
      let callsToSelf = 0;
      const checkRecursion = function (innerNode) {
        if (!innerNode) return;
        if (innerNode.type === 'CallExpression' && innerNode.callee.name === funcName)
          callsToSelf++;
        for (let key in innerNode) {
          if (innerNode[key] && typeof innerNode[key] === 'object') {
            if (Array.isArray(innerNode[key])) innerNode[key].forEach(checkRecursion);
            else checkRecursion(innerNode[key]);
          }
        }
      };
      checkRecursion(node.body);
      if (callsToSelf > 0) {
        state.isRecursive = true;
        state.recursiveBranches = Math.max(state.recursiveBranches, callsToSelf);
      }
    }

    for (let key in node) {
      if (node[key] && typeof node[key] === 'object') {
        if (Array.isArray(node[key])) node[key].forEach((child) => walk(child));
        else if (typeof node[key].type === 'string') walk(node[key]);
      }
    }

    if (isLoop) state.currentLoopDepth--;
  };

  walk(ast);

  let finalTime = 'O(1)';
  if (state.isRecursive && state.recursiveBranches > 1) finalTime = 'O(2^N)';
  else if (state.timeComplexityExp === 1 || (state.isRecursive && state.recursiveBranches === 1))
    finalTime = 'O(N)';
  else if (state.timeComplexityExp > 1) finalTime = `O(N^${state.timeComplexityExp})`;

  let finalSpace = 'O(1)';
  if (state.spaceComplexityExp === 1 || state.isRecursive) finalSpace = 'O(N)';
  else if (state.spaceComplexityExp > 1) finalSpace = `O(N^${state.spaceComplexityExp})`;

  if (els.timeComplexity) {
    els.timeComplexity.textContent = finalTime;
    els.timeComplexity.style.color = COMPLEXITY_COLORS[finalTime] || COMPLEXITY_COLORS['O(N^2)'];
  }

  if (els.spaceComplexity) {
    els.spaceComplexity.textContent = finalSpace;
    els.spaceComplexity.style.color = COMPLEXITY_COLORS[finalSpace] || COMPLEXITY_COLORS['O(N^2)'];
  }

  const endTime = performance.now();
  if (els.nodeCount) els.nodeCount.textContent = state.totalNodes;
  if (els.parseTime) els.parseTime.textContent = (endTime - startTime).toFixed(2) + 'ms';

  applyDiagnostics(cm, state.diagnostics);
}

function applyDiagnostics(cm, diagnostics) {
  codeMarkersA.forEach((m) => m.clear());
  cm.clearGutter('linter-gutter');
  codeMarkersA = [];

  diagnostics.forEach((diag) => {
    const marker = document.createElement('div');
    marker.className =
      diag.type === 'error' ? 'linter-gutter-marker linter-gutter-error' : 'linter-gutter-marker';
    marker.innerHTML =
      diag.type === 'error'
        ? '<i class="fas fa-exclamation-triangle"></i>'
        : '<i class="fas fa-bolt"></i>';
    marker.title = diag.msg;

    cm.setGutterMarker(diag.line, 'linter-gutter', marker);

    let bgClass = 'lint-info-bg';
    if (diag.type === 'warning') bgClass = 'lint-warning-bg';
    if (diag.type === 'error') bgClass = 'lint-error-bg';

    cm.addLineClass(diag.line, 'background', bgClass);

    codeMarkersA.push({
      clear: () => {
        cm.removeLineClass(diag.line, 'background', bgClass);
      },
    });
  });
}
