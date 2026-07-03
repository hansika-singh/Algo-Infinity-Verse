/**
 * big-o-linter.js
 * Implements an in-browser Abstract Syntax Tree (AST) static analyzer.
 * Parses JavaScript using Acorn.js and mathematically calculates Time and Space Complexity.
 */

document.addEventListener("DOMContentLoaded", () => {
    initASTLinter();
});

let editor;
let parseTimeout;
let codeMarkers = [];

// UI Elements
const els = {
    editorContainer: document.getElementById('editorContainer'),
    timeComplexity: document.getElementById('timeComplexity'),
    spaceComplexity: document.getElementById('spaceComplexity'),
    timeMeterBox: document.getElementById('timeMeterBox'),
    spaceMeterBox: document.getElementById('spaceMeterBox'),
    parseStatus: document.getElementById('parseStatus'),
    nodeCount: document.getElementById('nodeCount'),
    parseTime: document.getElementById('parseTime'),
    complexityHud: document.getElementById('complexityHud')
};

// Colors mapping to Big-O
const COMPLEXITY_COLORS = {
    'O(1)': 'var(--o-constant)',
    'O(N)': 'var(--o-linear)',
    'O(N^2)': 'var(--o-quadratic)',
    'O(N^3)': 'var(--o-exponential)',
    'O(2^N)': 'var(--o-exponential)',
    'O(N!)': 'var(--o-exponential)'
};

function initASTLinter() {
    CodeMirror.defineGutter("linter-gutter", {
        class: "CodeMirror-linter-gutter"
    });
    
    editor = CodeMirror(els.editorContainer, {
        lineNumbers: true,
        theme: 'material-palenight',
        mode: 'javascript',
        gutters: ["CodeMirror-linenumbers", "linter-gutter"],
        value: `// Optimized O(N) Two Sum Implementation
function twoSum(nums, target) {
    const map = new Map(); // O(N) space for hash map
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        
        map.set(nums[i], i);
    }
    
    return [];
}

// Try the naive O(N^2) approach to see linter warnings!`,
        indentUnit: 4,
        matchBrackets: true
    });

    // Run initial analysis
    analyzeCode();

    // Debounce the editor changes to prevent blocking the main thread while typing
    editor.on('change', () => {
        clearTimeout(parseTimeout);
        parseTimeout = setTimeout(analyzeCode, 300);
    });
}

// --- The AST Traversal Engine ---
function analyzeCode() {
    const code = editor.getValue();
    const startTime = performance.now();
    let ast;

    try {
        // Parse code into AST using Acorn
        ast = acorn.parse(code, { 
            ecmaVersion: 2022, 
            locations: true, // Crucial: Gives us line numbers for the UI
            sourceType: 'script'
        });
        
        els.parseStatus.className = 'status-indicator valid';
        els.parseStatus.innerHTML = '<i class="fas fa-check-circle"></i> AST Valid';
    } catch (e) {
        // Syntax Error
        els.parseStatus.className = 'status-indicator error';
        els.parseStatus.innerHTML = '<i class="fas fa-times-circle"></i> Syntax Error';
        return; // Halt analysis until syntax is fixed
    }

    // AST State
    const state = {
        totalNodes: 0,
        timeComplexityExp: 0,  // Max loop depth
        spaceComplexityExp: 0, // Max data structure depth inside loops
        isRecursive: false,
        recursiveBranches: 0,
        currentLoopDepth: 0,
        diagnostics: [] // Warnings to map to CodeMirror lines
    };

    // Custom Recursive AST Walker
    function walk(node) {
        if (!node) return;
        state.totalNodes++;

        // 1. Detect Loops for Time Complexity
        const isLoop = ['ForStatement', 'WhileStatement', 'DoWhileStatement', 'ForOfStatement', 'ForInStatement'].includes(node.type);
        
        if (isLoop) {
            state.currentLoopDepth++;
            if (state.currentLoopDepth > state.timeComplexityExp) {
                state.timeComplexityExp = state.currentLoopDepth;
            }
            
            // Add Diagnostic for nested loops
            if (state.currentLoopDepth > 1) {
                state.diagnostics.push({
                    line: node.loc.start.line - 1,
                    type: 'warning',
                    msg: `Nested Loop Detected: Increases time complexity to O(N^${state.currentLoopDepth})`
                });
            }
        }

        // 2. Detect Space Complexity (Arrays/Objects initialized inside loops = Bad)
        if (node.type === 'NewExpression' || node.type === 'ArrayExpression' || node.type === 'ObjectExpression') {
            // If initialized outside loop, O(N). If inside loop, O(N^2) space locally.
            let spacePower = state.currentLoopDepth > 0 ? 2 : 1;
            if (spacePower > state.spaceComplexityExp) state.spaceComplexityExp = spacePower;
            
            if (state.currentLoopDepth > 0) {
                state.diagnostics.push({
                    line: node.loc.start.line - 1,
                    type: 'info',
                    msg: `Memory Allocation inside Loop: Creates new instances per iteration, degrading space complexity.`
                });
            }
        }

        // 3. Detect Recursion (Naive detection of Function calls inside Function declarations)
        // For a true implementation, we'd track the scope, but this proves the concept.
        if (node.type === 'FunctionDeclaration') {
            const funcName = node.id.name;
            let callsToSelf = 0;
            
            // Sub-walk specifically for recursion detection
            function checkRecursion(innerNode) {
                if(!innerNode) return;
                if (innerNode.type === 'CallExpression' && innerNode.callee.name === funcName) {
                    callsToSelf++;
                }
                for (let key in innerNode) {
                    if (innerNode[key] && typeof innerNode[key] === 'object') {
                        if (Array.isArray(innerNode[key])) innerNode[key].forEach(checkRecursion);
                        else checkRecursion(innerNode[key]);
                    }
                }
            }
            checkRecursion(node.body);
            
            if (callsToSelf > 0) {
                state.isRecursive = true;
                state.recursiveBranches = Math.max(state.recursiveBranches, callsToSelf);
                
                if (callsToSelf > 1) {
                    state.diagnostics.push({
                        line: node.loc.start.line - 1,
                        type: 'error',
                        msg: `Exponential Recursion Detected: Multiple branches lead to O(2^N) or worse time complexity.`
                    });
                }
            }
        }

        // Recursively walk children
        for (let key in node) {
            if (node[key] && typeof node[key] === 'object') {
                if (Array.isArray(node[key])) {
                    node[key].forEach(child => walk(child));
                } else if (typeof node[key].type === 'string') {
                    walk(node[key]);
                }
            }
        }

        // Exit node logic
        if (isLoop) {
            state.currentLoopDepth--;
        }
    }

    // Start Traversal
    walk(ast);

    // Calculate Final Complexity
    let finalTime = 'O(1)';
    if (state.isRecursive && state.recursiveBranches > 1) {
        finalTime = 'O(2^N)';
    } else if (state.timeComplexityExp === 1 || (state.isRecursive && state.recursiveBranches === 1)) {
        finalTime = 'O(N)';
    } else if (state.timeComplexityExp > 1) {
        finalTime = `O(N^${state.timeComplexityExp})`;
    }

    let finalSpace = 'O(1)';
    if (state.spaceComplexityExp === 1 || state.isRecursive) {
        finalSpace = 'O(N)'; // Recursion call stack takes O(N) space
    } else if (state.spaceComplexityExp > 1) {
        finalSpace = `O(N^${state.spaceComplexityExp})`;
    }

    // Update UI
    els.timeComplexity.textContent = finalTime;
    els.timeComplexity.style.color = COMPLEXITY_COLORS[finalTime] || COMPLEXITY_COLORS['O(N^3)'];
    
    els.spaceComplexity.textContent = finalSpace;
    els.spaceComplexity.style.color = COMPLEXITY_COLORS[finalSpace] || COMPLEXITY_COLORS['O(N^3)'];

    // Telemetry
    const endTime = performance.now();
    els.nodeCount.textContent = state.totalNodes;
    els.parseTime.textContent = (endTime - startTime).toFixed(2) + 'ms';

    // Apply Diagnostics to CodeMirror Editor
    applyDiagnostics(state.diagnostics);
}

function applyDiagnostics(diagnostics) {
    // Clear old markers
    codeMarkers.forEach(m => { m.clear(); });
    editor.clearGutter("linter-gutter");
    codeMarkers = [];

    diagnostics.forEach(diag => {
        // Gutter Icon
        const marker = document.createElement("div");
        marker.className = diag.type === 'error' ? "linter-gutter-marker linter-gutter-error" : "linter-gutter-marker";
        marker.innerHTML = diag.type === 'error' ? '<i class="fas fa-exclamation-triangle"></i>' : '<i class="fas fa-bolt"></i>';
        marker.title = diag.msg;
        
        editor.setGutterMarker(diag.line, "linter-gutter", marker);

        // Line Background Highlighting
        let bgClass = 'lint-info-bg';
        if (diag.type === 'warning') bgClass = 'lint-warning-bg';
        if (diag.type === 'error') bgClass = 'lint-error-bg';

        const lineMark = editor.addLineClass(diag.line, "background", bgClass);
        
        codeMarkers.push({
            clear: () => {
                editor.removeLineClass(diag.line, "background", bgClass);
            }
        });
    });
}
