import * as acorn from "acorn";

export function analyzeComplexity(sourceCode) {
    try {
        const ast = acorn.parse(sourceCode, {
            ecmaVersion: 2022,
            sourceType: "script"
        });

        let maxLoopDepth = 0;
        let isRecursive = false;
        let hasMemoization = false;
        let recursiveCallCount = 0;

        const loopTypes = new Set(['ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement']);
        
        function walkWithVar(node, currentLoopDepth, currentFuncName, params) {
            if (!node || typeof node !== 'object') return;
            
            if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
                if (node.init && (node.init.type === 'FunctionExpression' || node.init.type === 'ArrowFunctionExpression')) {
                    const funcName = node.id.name;
                    const nextParams = new Set(node.init.params.map(p => p.name).filter(Boolean));
                    walk(node.init.body, 0, funcName, nextParams);
                    return; 
                }
            }
            walk(node, currentLoopDepth, currentFuncName, params);
        }

        function walk(node, currentLoopDepth, currentFuncName, params) {
            if (!node || typeof node !== 'object') return;

            let nextLoopDepth = currentLoopDepth;
            let nextFuncName = currentFuncName;
            let nextParams = params;

            if (loopTypes.has(node.type)) {
                nextLoopDepth = currentLoopDepth + 1;
                if (nextLoopDepth > maxLoopDepth) {
                    maxLoopDepth = nextLoopDepth;
                }
            }

            if (node.type === 'FunctionDeclaration') {
                nextFuncName = node.id ? node.id.name : currentFuncName;
                nextParams = new Set(node.params.map(p => p.name).filter(Boolean));
                nextLoopDepth = 0;
            }

            if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
                if (currentFuncName && node.callee.name === currentFuncName) {
                    isRecursive = true;
                    recursiveCallCount++;
                }
            }

            // Memoization via object/array (e.g. memo[n] = ...)
            if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression') {
                if (node.left.property && node.left.property.type === 'Identifier' && params && params.has(node.left.property.name)) {
                    hasMemoization = true;
                }
            }

            // Memoization via Map/Set (e.g. cache.set(n, ...))
            if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
                if (node.callee.property && node.callee.property.type === 'Identifier' && node.callee.property.name === 'set') {
                    if (node.arguments.length > 0 && node.arguments[0].type === 'Identifier' && params && params.has(node.arguments[0].name)) {
                        hasMemoization = true;
                    }
                }
            }

            for (const key in node) {
                if (key === 'start' || key === 'end' || key === 'loc' || key === 'type') continue;
                const child = node[key];
                if (Array.isArray(child)) {
                    child.forEach(c => walkWithVar(c, nextLoopDepth, nextFuncName, nextParams));
                } else if (child && typeof child === 'object') {
                    walkWithVar(child, nextLoopDepth, nextFuncName, nextParams);
                }
            }
        }

        walkWithVar(ast, 0, null, null);

        let complexity = "O(1)";
        if (maxLoopDepth === 1) {
            complexity = "O(n)";
        } else if (maxLoopDepth === 2) {
            complexity = "O(n²)";
        } else if (maxLoopDepth >= 3) {
            complexity = "O(n³)";
        }

        if (isRecursive) {
            if (hasMemoization) {
                complexity = "O(n)"; // usually O(n) or O(vertices) when memoized
            } else if (recursiveCallCount > 1) {
                complexity = "O(2ⁿ)"; // Branching recursion
            } else {
                complexity = "O(n)"; // Single linear recursion
            }
        }

        return { complexity, maxLoopDepth, isRecursive, hasMemoization, recursiveCallCount };
    } catch (e) {
        return { complexity: "Unknown (Parse Error)", error: e.message };
    }
}
