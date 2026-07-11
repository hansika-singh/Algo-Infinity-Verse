/**
 * Space Complexity Profiler Engine v2
 * Instruments code via AST and visualizes memory usage.
 */

let editorA;
let editorB;
let memoryChart;
let els = {};

const defaultCodeA = `// Editor A: Iterative Binary Search (O(1) Space)
function search(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`;

const defaultCodeB = `// Editor B: Recursive Merge Sort (O(N) Space)
function sort(arr) {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = sort(arr.slice(0, mid));
    const right = sort(arr.slice(mid));
    return merge(left, right);
}

function merge(left, right) {
    const result = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
        if (left[i] < right[j]) result.push(left[i++]);
        else result.push(right[j++]);
    }
    return result.concat(left.slice(i)).concat(right.slice(j));
}`;

document.addEventListener("DOMContentLoaded", function () {
    // Cache elements
    els.editorContainerA = document.getElementById('editorContainerA');
    els.editorContainerB = document.getElementById('editorContainerB');
    els.peakMemA = document.getElementById('peakMemA');
    els.peakMemB = document.getElementById('peakMemB');
    els.spaceComplexityA = document.getElementById('spaceComplexityA');
    els.spaceComplexityB = document.getElementById('spaceComplexityB');
    els.profilerStatus = document.getElementById('profilerStatus');
    els.runProfilerBtn = document.getElementById('runProfilerBtn');

    initEditors();
    initChart();
    els.runProfilerBtn.addEventListener('click', runSpaceProfiler);
});

function initEditors() {
    editorA = CodeMirror(els.editorContainerA, {
        lineNumbers: true,
        theme: 'material-palenight',
        mode: 'javascript',
        value: defaultCodeA,
        indentUnit: 4,
        matchBrackets: true
    });

    editorB = CodeMirror(els.editorContainerB, {
        lineNumbers: true,
        theme: 'material-palenight',
        mode: 'javascript',
        value: defaultCodeB,
        indentUnit: 4,
        matchBrackets: true
    });
}

function initChart() {
    const ctx = document.getElementById('memoryChart');
    if (!ctx) return;

    memoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 100 }, (_, i) => i + 1),
            datasets: [
                {
                    label: 'Editor A (Bytes)',
                    data: new Array(100).fill(0),
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    tension: 0.3,
                    pointRadius: 0
                },
                {
                    label: 'Editor B (Bytes)',
                    data: new Array(100).fill(0),
                    borderColor: 'rgba(6, 182, 212, 1)',
                    backgroundColor: 'rgba(6, 182, 212, 0.2)',
                    tension: 0.3,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: 'Execution Steps', color: '#94a3b8' },
                    ticks: { display: false }
                },
                y: {
                    title: { display: true, text: 'Memory (Bytes)', color: '#94a3b8' },
                    ticks: { color: '#94a3b8' },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: { labels: { color: '#f8fafc' } }
            },
            animation: { duration: 800, easing: 'easeOutQuart' }
        }
    });
}

// ─── Instrumentation ───────────────────────────────────────────────────────

function injectFunctionTracking(node, edits) {
    if (node.body && node.body.type === 'BlockStatement') {
        edits.push({ pos: node.body.start + 1, text: '\n__call();\n' });
        edits.push({ pos: node.body.end - 1, text: '\n__ret();\n' });
    }
}

function instrumentCode(code) {
    let ast;
    try {
        ast = acorn.parse(code, { ecmaVersion: 2022 });
    } catch (err) {
        console.warn("AST parse error, running uninstrumented:", err.message);
        return code;
    }

    const edits = [];

    // Use the walk library - it may be exposed as acornWalk or acorn.walk
    const walker = (typeof acornWalk !== 'undefined') ? acornWalk
                 : (typeof acorn.walk !== 'undefined') ? acorn.walk
                 : null;

    if (!walker) {
        console.warn("acorn-walk not available, skipping instrumentation");
        return code;
    }

    walker.simple(ast, {
        ArrayExpression: function(node) {
            edits.push({ pos: node.start, text: '__track(\'array\',' + node.elements.length + ',' });
            edits.push({ pos: node.end, text: ')' });
        },
        ObjectExpression: function(node) {
            edits.push({ pos: node.start, text: '__track(\'object\',' + node.properties.length + ',' });
            edits.push({ pos: node.end, text: ')' });
        },
        NewExpression: function(node) {
            if (node.callee && node.callee.name === 'Array') {
                var sizeStr = '1';
                if (node.arguments.length === 1 && node.arguments[0].type === 'Literal') {
                    sizeStr = String(node.arguments[0].value);
                } else if (node.arguments.length === 1 && node.arguments[0].type === 'Identifier') {
                    sizeStr = node.arguments[0].name;
                }
                edits.push({ pos: node.start, text: '__track(\'array\',' + sizeStr + '||1,' });
                edits.push({ pos: node.end, text: ')' });
            }
        },
        FunctionDeclaration: function(node) { injectFunctionTracking(node, edits); },
        FunctionExpression: function(node) { injectFunctionTracking(node, edits); }
    });

    edits.sort(function(a, b) { return b.pos - a.pos; });

    var instrumented = code;
    for (var i = 0; i < edits.length; i++) {
        var edit = edits[i];
        instrumented = instrumented.slice(0, edit.pos) + edit.text + instrumented.slice(edit.pos);
    }

    return instrumented;
}

// ─── Complexity Estimation ─────────────────────────────────────────────────

function estimateSpaceComplexity(results) {
    if (!results || results.length < 2) return 'Unknown';
    var first = results[0];
    var last = results[results.length - 1];
    var nRatio = last.n / first.n;
    var memFirst = first.maxMemory || 1;
    var memLast = last.maxMemory || 1;
    var memRatio = memLast / memFirst;

    if (memRatio <= 2) return 'O(1)';
    if (memRatio < nRatio * 1.5) return 'O(N)';
    return 'O(N\u00B2)';
}

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    i = Math.max(0, Math.min(i, sizes.length - 1));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getComplexityColor(complexity) {
    if (complexity === 'O(1)') return '#10b981';
    if (complexity === 'O(N)') return '#f59e0b';
    if (complexity === 'O(N\u00B2)') return '#ef4444';
    return '#94a3b8';
}

// ─── Worker Execution ──────────────────────────────────────────────────────

function runWorker(code, sizes, editorId) {
    return new Promise(function(resolve) {
        var workerUrl = new URL('profiler-worker.js', window.location.href).href;
        var worker;

        try {
            worker = new Worker(workerUrl);
        } catch (e) {
            console.error('Worker creation failed:', e.message);
            resolve({ results: sizes.map(function(n) { return { n: n, maxMemory: 0 }; }), timeline: new Array(100).fill(0) });
            return;
        }

        var timeoutId = setTimeout(function() {
            worker.terminate();
            console.warn('Worker timeout for editor ' + editorId);
            if (els.profilerStatus) {
                els.profilerStatus.innerHTML = '<span class="error"><i class="fas fa-times-circle"></i> Timeout: possible infinite loop in Editor ' + editorId + '.</span>';
            }
            resolve({ results: sizes.map(function(n) { return { n: n, maxMemory: 0 }; }), timeline: new Array(100).fill(0) });
        }, 8000);

        worker.onmessage = function(e) {
            clearTimeout(timeoutId);
            worker.terminate();
            if (e.data.error) {
                console.error('Worker error (' + editorId + '):', e.data.error);
                if (els.profilerStatus) {
                    els.profilerStatus.innerHTML = '<span class="error"><i class="fas fa-times-circle"></i> Error in Editor ' + editorId + ': ' + e.data.error + '</span>';
                }
                resolve({ results: sizes.map(function(n) { return { n: n, maxMemory: 0 }; }), timeline: new Array(100).fill(0) });
            } else if (e.data.success) {
                resolve({ results: e.data.results, timeline: e.data.timeline, totalAllocations: e.data.totalAllocations });
            }
        };

        worker.onerror = function(err) {
            clearTimeout(timeoutId);
            worker.terminate();
            console.error('Worker global error (' + editorId + '):', err.message);
            if (els.profilerStatus) {
                els.profilerStatus.innerHTML = '<span class="error"><i class="fas fa-times-circle"></i> Worker error in Editor ' + editorId + ': ' + err.message + '</span>';
            }
            resolve({ results: sizes.map(function(n) { return { n: n, maxMemory: 0 }; }), timeline: new Array(100).fill(0) });
        };

        worker.postMessage({ code: code, sizes: sizes, editorId: editorId });
    });
}

// ─── Main Run ──────────────────────────────────────────────────────────────

function runSpaceProfiler() {
    if (!editorA || !editorB) {
        alert('Editors not ready. Please wait and try again.');
        return;
    }

    els.runProfilerBtn.disabled = true;
    els.runProfilerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Profiling...';
    els.profilerStatus.innerHTML = '<span style="color:#6366f1"><i class="fas fa-cog fa-spin"></i> Analyzing code...</span>';

    var sizes = [10, 100, 500, 1000];
    var resultsA = null;
    var resultsB = null;

    function checkComplete() {
        if (resultsA && resultsB) {
            // Update HUD
            var lastA = resultsA.results[resultsA.results.length - 1];
            var lastB = resultsB.results[resultsB.results.length - 1];

            els.peakMemA.innerText = formatBytes(lastA.maxMemory);
            els.spaceComplexityA.innerText = estimateSpaceComplexity(resultsA.results);

            els.peakMemB.innerText = formatBytes(lastB.maxMemory);
            els.spaceComplexityB.innerText = estimateSpaceComplexity(resultsB.results);

            els.spaceComplexityA.style.color = getComplexityColor(els.spaceComplexityA.innerText);
            els.spaceComplexityB.style.color = getComplexityColor(els.spaceComplexityB.innerText);

            updateChart(resultsA.timeline, resultsB.timeline);

            els.runProfilerBtn.disabled = false;
            els.runProfilerBtn.innerHTML = '<i class="fas fa-play"></i> Run Space Profiler';
            els.profilerStatus.innerHTML = '<span class="valid"><i class="fas fa-check-circle"></i> Profiling complete!</span>';
        }
    }

    var codeA = instrumentCode(editorA.getValue());
    var codeB = instrumentCode(editorB.getValue());

    runWorker(codeA, sizes, 'A').then(function(res) {
        resultsA = res;
        checkComplete();
    });

    runWorker(codeB, sizes, 'B').then(function(res) {
        resultsB = res;
        checkComplete();
    });
}

// ─── Chart Update ──────────────────────────────────────────────────────────

function updateChart(timelineA, timelineB) {
    if (!memoryChart) return;

    var maxLen = Math.max((timelineA || []).length, (timelineB || []).length, 100);

    function pad(arr, len) {
        var res = (arr || []).slice();
        var lastVal = res.length > 0 ? res[res.length - 1] : 0;
        while (res.length < len) res.push(lastVal);
        return res;
    }

    memoryChart.data.labels = Array.from({ length: maxLen }, function(_, i) { return i + 1; });
    memoryChart.data.datasets[0].data = pad(timelineA, maxLen);
    memoryChart.data.datasets[1].data = pad(timelineB, maxLen);
    memoryChart.update();
}
