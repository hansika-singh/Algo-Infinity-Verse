/**
 * ast-refactor-engine.js
 * Implements the AI-Driven AST Refactoring Engine and Visualizer.
 * Acorn JS parsing, custom Python-to-ESTree compilation, tree visual layouts, and morphing animations.
 */

document.addEventListener("DOMContentLoaded", () => {
    window.astEngine = new ASTRefactorEngine();
});

// AST Presets definitions
const AST_PRESETS = {
    'js-fib': {
        lang: 'javascript',
        complexityBefore: 'O(2^N)',
        complexityAfter: 'O(N)',
        code: `// Naive Exponential Fibonacci
function fibonacci(n) {
    if (n <= 1) {
        return n;
    }
    // Redundant recursion branches
    return fibonacci(n - 1) + fibonacci(n - 2);
}`
    },
    'py-fib': {
        lang: 'python',
        complexityBefore: 'O(2^N)',
        complexityAfter: 'O(N)',
        code: `# Naive Exponential Fibonacci
def fibonacci(n):
    if n <= 1:
        return n
    # Redundant recursion branches
    return fibonacci(n - 1) + fibonacci(n - 2)`
    },
    'js-loops': {
        lang: 'javascript',
        complexityBefore: 'O(N^2)',
        complexityAfter: 'O(N)',
        code: `// Nested loops running in O(N^2)
function processMatrix(N, M) {
    for (let i = 0; i < N; i++) {
        // Inner loop duplicates iterations
        for (let j = 0; j < M; j++) {
            process(i, j);
        }
    }
}`
    },
    'py-loops': {
        lang: 'python',
        complexityBefore: 'O(N^2)',
        complexityAfter: 'O(N)',
        code: `# Nested loops running in O(N^2)
def processMatrix(N, M):
    for i in range(N):
        # Inner loop duplicates iterations
        for j in range(M):
            process(i, j)`
    },
    'js-dead': {
        lang: 'javascript',
        complexityBefore: 'O(1)',
        complexityAfter: 'O(1)',
        code: `// Unused variable and dead code
function calculateTotal(price, tax) {
    let unusedDiscount = 0.15;
    let rate = 1 + tax;
    let total = price * rate;
    return total;
}`
    },
    'py-dead': {
        lang: 'python',
        complexityBefore: 'O(1)',
        complexityAfter: 'O(1)',
        code: `# Unused variable and dead code
def calculateTotal(price, tax):
    unusedDiscount = 0.15
    rate = 1 + tax
    total = price * rate
    return total`
    }
};

class ASTRefactorEngine {
    constructor() {
        this.cacheDOM();
        this.init();
    }

    cacheDOM() {
        this.dom = {
            presetSelect: document.getElementById("presetSelect"),
            btnLangJS: document.getElementById("btnLangJS"),
            btnLangPY: document.getElementById("btnLangPY"),
            btnOptimize: document.getElementById("btnOptimize"),
            speedSlider: document.getElementById("speedSlider"),
            speedValText: document.getElementById("speedValText"),
            
            rawEditorContainer: document.getElementById("rawEditorContainer"),
            refactoredEditorContainer: document.getElementById("refactoredEditorContainer"),
            
            astViewportWrapper: document.getElementById("astViewportWrapper"),
            astSvgCanvas: document.getElementById("astSvgCanvas"),
            astNodesLayer: document.getElementById("astNodesLayer"),
            
            nodeHoverHud: document.getElementById("nodeHoverHud"),
            hudNodeType: document.getElementById("hudNodeType"),
            hudNodeLoc: document.getElementById("hudNodeLoc"),
            hudNodeProps: document.getElementById("hudNodeProps"),
            
            complexityBefore: document.getElementById("complexityBefore"),
            complexityAfter: document.getElementById("complexityAfter"),
            logsContainer: document.getElementById("logsContainer")
        };
    }

    init() {
        this.lang = "javascript";
        this.speed = 1.0;
        this.isPlaying = false;
        this.warnings = [];
        this.visualNodesMap = {}; // Maps id to node info
        
        // Setup CodeMirror Editors
        this.rawEditor = CodeMirror(this.dom.rawEditorContainer, {
            lineNumbers: true,
            theme: 'material-palenight',
            mode: 'javascript',
            indentUnit: 4,
            matchBrackets: true
        });

        this.refactoredEditor = CodeMirror(this.dom.refactoredEditorContainer, {
            lineNumbers: true,
            theme: 'material-palenight',
            mode: 'javascript',
            readOnly: true,
            indentUnit: 4
        });

        this.bindEvents();
        this.loadPreset("js-fib");
    }

    bindEvents() {
        // Preset selector
        this.dom.presetSelect.addEventListener("change", (e) => this.loadPreset(e.target.value));

        // Language buttons
        this.dom.btnLangJS.addEventListener("click", () => this.setLanguage("javascript"));
        this.dom.btnLangPY.addEventListener("click", () => this.setLanguage("python"));

        // Optimize trigger
        this.dom.btnOptimize.addEventListener("click", () => this.optimizeAST());

        // Speed slider
        this.dom.speedSlider.addEventListener("input", (e) => {
            this.speed = parseFloat(e.target.value);
            this.dom.speedValText.textContent = `${this.speed.toFixed(1)}x`;
        });

        // Parse on editor changes (debounced)
        let parseTimeout;
        this.rawEditor.on("change", () => {
            clearTimeout(parseTimeout);
            parseTimeout = setTimeout(() => this.parseAndVisualize(), 300);
        });

        // Window resize redraw
        window.addEventListener("resize", () => {
            if (this.currentVisualTree) {
                this.renderVisualTree(this.currentVisualTree);
            }
        });
    }

    log(msg, type = "sys") {
        const div = document.createElement("div");
        div.className = `log-line ${type}`;
        div.textContent = `> ${msg}`;
        this.dom.logsContainer.appendChild(div);
        this.dom.logsContainer.scrollTop = this.dom.logsContainer.scrollHeight;
    }

    setLanguage(lang) {
        if (this.isPlaying) return;
        if (this.lang === lang) return;
        this.lang = lang;
        
        this.dom.btnLangJS.classList.toggle("active", lang === "javascript");
        this.dom.btnLangPY.classList.toggle("active", lang === "python");
        
        const mode = lang === "javascript" ? "javascript" : "python";
        this.rawEditor.setOption("mode", mode);
        this.refactoredEditor.setOption("mode", mode);
        
        // Auto load corresponding preset for the language
        const currentVal = this.dom.presetSelect.value;
        const basePreset = currentVal.substring(3); // e.g. "fib" or "loops"
        const nextPreset = (lang === "javascript" ? "js-" : "py-") + basePreset;
        this.dom.presetSelect.value = nextPreset;
        this.loadPreset(nextPreset);
    }

    loadPreset(presetName) {
        if (this.isPlaying) return;
        const preset = AST_PRESETS[presetName];
        if (!preset) return;

        this.lang = preset.lang;
        this.dom.btnLangJS.classList.toggle("active", this.lang === "javascript");
        this.dom.btnLangPY.classList.toggle("active", this.lang === "python");

        const mode = this.lang === "javascript" ? "javascript" : "python";
        this.rawEditor.setOption("mode", mode);
        this.refactoredEditor.setOption("mode", mode);

        this.rawEditor.setValue(preset.code);
        this.refactoredEditor.setValue("");

        this.dom.complexityBefore.textContent = preset.complexityBefore;
        this.dom.complexityAfter.textContent = "-";
        
        this.log(`Loaded preset: ${presetName.toUpperCase()}`, "sys");
        this.parseAndVisualize();
    }

    // ==========================================
    // AST PARSING AND STATIC ANALYSIS
    // ==========================================
    parseAndVisualize() {
        const code = this.rawEditor.getValue();
        let ast = null;

        try {
            if (this.lang === "javascript") {
                ast = acorn.parse(code, { ecmaVersion: 2022, locations: true });
            } else {
                const pyParser = new PythonToESTreeParser();
                ast = pyParser.parse(code);
            }
            this.log("Code parsed successfully to AST.", "sys");
        } catch (e) {
            this.log(`Syntax Error: ${e.message}`, "warn");
            return;
        }

        // Static Analysis
        const analyzer = new ASTStaticAnalyzer();
        const stats = analyzer.analyze(ast);
        this.warnings = stats.warnings;

        // Simplify AST for clean visual layout
        const visualTree = this.buildVisualTree(ast);
        this.currentVisualTree = visualTree;

        // Render Tree
        this.renderVisualTree(visualTree);
        
        // Apply inefficiency highlights
        this.applyWarningsToNodes();
    }

    buildVisualTree(node) {
        if (!node) return null;
        
        let label = node.type;
        let value = "";
        let children = [];
        
        const showNode = [
            'Program', 'FunctionDeclaration', 'ForStatement', 'WhileStatement',
            'IfStatement', 'VariableDeclaration', 'ReturnStatement',
            'AssignmentExpression', 'CallExpression', 'ExpressionStatement'
        ].includes(node.type);
        
        if (!showNode) {
            for (let key in node) {
                if (node[key] && typeof node[key] === 'object') {
                    if (Array.isArray(node[key])) {
                        node[key].forEach(child => {
                            const ct = this.buildVisualTree(child);
                            if (ct) {
                                if (Array.isArray(ct)) children.push(...ct);
                                else children.push(ct);
                            }
                        });
                    } else if (node[key].type) {
                        const ct = this.buildVisualTree(node[key]);
                        if (ct) {
                            if (Array.isArray(ct)) children.push(...ct);
                            else children.push(ct);
                        }
                    }
                }
            }
            return children.length === 1 ? children[0] : (children.length > 0 ? children : null);
        }
        
        switch (node.type) {
            case 'Program':
                label = 'Program';
                value = this.lang === 'javascript' ? 'main.js' : 'main.py';
                break;
            case 'FunctionDeclaration':
                label = 'Function';
                value = `${node.id.name}(${node.params.map(p => p.name).join(', ')})`;
                break;
            case 'ForStatement':
                label = 'For Loop';
                if (node.range) {
                    value = `${node.init.id.name} in range(${node.range.join(', ')})`;
                } else {
                    value = `i = 0; i < N`;
                }
                break;
            case 'IfStatement':
                label = 'If Condition';
                value = this.getExpressionString(node.test);
                break;
            case 'VariableDeclaration':
                label = 'Declare';
                value = node.declarations.map(d => `${d.id.name} = ${this.getExpressionString(d.init)}`).join(', ');
                break;
            case 'ReturnStatement':
                label = 'Return';
                value = this.getExpressionString(node.argument);
                break;
            case 'CallExpression':
                label = 'Call';
                value = `${node.callee.name}(...)`;
                break;
            case 'ExpressionStatement':
                return this.buildVisualTree(node.expression);
        }
        
        for (let key in node) {
            if (key === 'consequent' || key === 'alternate' || key === 'body' || key === 'declarations') {
                const childVal = node[key];
                if (Array.isArray(childVal)) {
                    childVal.forEach(c => {
                        const ct = this.buildVisualTree(c);
                        if (ct) {
                            if (Array.isArray(ct)) children.push(...ct);
                            else children.push(ct);
                        }
                    });
                } else if (childVal && childVal.type) {
                    const ct = this.buildVisualTree(childVal);
                    if (ct) {
                        if (Array.isArray(ct)) children.push(...ct);
                        else children.push(ct);
                    }
                }
            }
        }
        
        return {
            id: `node-${Math.random().toString(36).substr(2, 9)}`,
            type: node.type,
            label: label,
            value: value,
            loc: node.loc,
            children: children
        };
    }

    getExpressionString(node) {
        if (!node) return "";
        if (node.type === 'Identifier') return node.name;
        if (node.type === 'Literal') return node.value;
        if (node.type === 'BinaryExpression') {
            return `${this.getExpressionString(node.left)} ${node.operator} ${this.getExpressionString(node.right)}`;
        }
        if (node.type === 'CallExpression') {
            return `${node.callee.name}(${node.arguments.map(a => this.getExpressionString(a)).join(', ')})`;
        }
        return node.type;
    }

    // ==========================================
    // TREE LAYOUT AND SVG RENDERING
    // ==========================================
    renderVisualTree(tree) {
        this.dom.astNodesLayer.innerHTML = "";
        this.dom.astSvgCanvas.innerHTML = "";
        this.visualNodesMap = {};
        
        if (!tree) return;

        const viewportRect = this.dom.astViewportWrapper.getBoundingClientRect();
        const width = viewportRect.width || 600;
        
        // Depth mapping logic
        const levels = {};
        const getLevels = (node, depth) => {
            if (!node) return;
            if (!levels[depth]) levels[depth] = [];
            levels[depth].push(node);
            
            node.children.forEach(c => getLevels(c, depth + 1));
        };
        getLevels(tree, 0);

        const levelCount = Object.keys(levels).length;
        const levelHeight = 90;
        const startY = 50;

        // Calculate (x,y) positions
        for (let depth in levels) {
            const nodesInLevel = levels[depth];
            const depthNum = parseInt(depth);
            
            nodesInLevel.forEach((node, idx) => {
                const x = ((idx + 0.5) / nodesInLevel.length) * width;
                const y = startY + depthNum * levelHeight;
                
                node.x = x;
                node.y = y;
                
                this.visualNodesMap[node.id] = node;
                this.createNodeCard(node);
            });
        }

        // Draw SVG bezier lines
        this.drawTreeConnectors(tree);
    }

    createNodeCard(node) {
        const card = document.createElement("div");
        card.className = `ast-node-card ${this.getNodeCategoryClass(node.type)}`;
        card.id = node.id;
        card.style.left = `${node.x}px`;
        card.style.top = `${node.y}px`;
        
        card.innerHTML = `
            <div class="ast-node-title">${node.label}</div>
            <div class="ast-node-value">${node.value}</div>
        `;

        // Hover listeners
        card.addEventListener("mouseenter", () => {
            this.dom.nodeHoverHud.classList.add("visible");
            this.dom.hudNodeType.textContent = node.type;
            this.dom.hudNodeLoc.textContent = node.loc ? `Line ${node.loc.start.line}` : "N/A";
            this.dom.hudNodeProps.textContent = node.value || "N/A";
        });
        
        card.addEventListener("mouseleave", () => {
            this.dom.nodeHoverHud.classList.remove("visible");
        });

        this.dom.astNodesLayer.appendChild(card);
    }

    getNodeCategoryClass(type) {
        if (type.includes('Declaration')) return 'decl';
        if (type.includes('For') || type.includes('While')) return 'loop';
        if (type.includes('If')) return 'cond';
        if (type.includes('Return')) return 'ret';
        return 'expr';
    }

    drawTreeConnectors(node) {
        node.children.forEach(c => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
            
            // Draw a smooth bezier curve between levels
            const x1 = node.x;
            const y1 = node.y;
            const x2 = c.x;
            const y2 = c.y;
            
            const midY = (y1 + y2) / 2;
            const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
            
            line.setAttribute("d", d);
            line.setAttribute("class", "ast-svg-line");
            line.id = `connector-${node.id}-${c.id}`;
            
            this.dom.astSvgCanvas.appendChild(line);
            
            this.drawTreeConnectors(c);
        });
    }

    // ==========================================
    // WARNING HIGHLIGHTS
    // ==========================================
    applyWarningsToNodes() {
        this.warnings.forEach(warn => {
            // Find nodes matching loop or function types
            for (let id in this.visualNodesMap) {
                const node = this.visualNodesMap[id];
                const card = document.getElementById(node.id);
                if (!card) continue;

                if (warn.type === 'unused_variable' && node.type === 'VariableDeclaration' && node.value.includes(warn.variable)) {
                    card.classList.add("warning-glow");
                    card.title = warn.msg;
                } else if (warn.type === 'nested_loop' && (node.type === 'ForStatement' || node.type === 'WhileStatement')) {
                    // Check if it's the inner loop (depth 2+)
                    if (this.getNodeDepth(node) > 1) {
                        card.classList.add("warning-glow");
                        card.title = warn.msg;
                    }
                } else if (warn.type === 'multiple_recursion' && node.type === 'ReturnStatement' && node.value.includes('fibonacci')) {
                    card.classList.add("error-glow");
                    card.title = warn.msg;
                }
            }
        });
    }

    getNodeDepth(targetNode) {
        let maxDepth = 0;
        const findDepth = (current, depth) => {
            if (current.id === targetNode.id) {
                maxDepth = depth;
                return;
            }
            current.children.forEach(c => findDepth(c, depth + 1));
        };
        findDepth(this.currentVisualTree, 0);
        return maxDepth;
    }

    // ==========================================
    // ANIMATED OPTIMIZATION & REFLECTION
    // ==========================================
    optimizeAST() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.dom.btnOptimize.disabled = true;

        const presetVal = this.dom.presetSelect.value;
        const optType = presetVal.includes('fib') ? 'recursion' : (presetVal.includes('loops') ? 'nested_loops' : 'dead_code');

        this.log(`Launching compiler optimizer [Pass: ${optType}]...`, "sys");

        // Trigger morphing animation sequence
        const transitionDuration = 1200 / this.speed;

        // 1. Highlight nodes to be deleted or restructured
        this.playOptimizeAnimation(optType, transitionDuration);
        
        setTimeout(() => {
            // 2. Commit optimized AST and output code
            const optimizer = new ASTOptimizer();
            const result = optimizer.optimize(null, optType, this.lang);
            
            this.refactoredEditor.setValue(result.code);
            
            // Print compiler logs
            result.logs.forEach(logLine => this.log(logLine, "opt"));
            
            // Update Complexity HUD
            this.dom.complexityAfter.textContent = AST_PRESETS[presetVal].complexityAfter;
            
            this.isPlaying = false;
            this.dom.btnOptimize.disabled = false;
            this.log("AST Refactoring process finished.", "sys");
        }, transitionDuration * 1.5);
    }

    playOptimizeAnimation(type, duration) {
        const deletedNodes = [];
        const morphNodes = [];

        for (let id in this.visualNodesMap) {
            const node = this.visualNodesMap[id];
            const card = document.getElementById(node.id);
            if (!card) continue;

            if (type === 'dead_code' && node.type === 'VariableDeclaration' && node.value.includes('unusedDiscount')) {
                deletedNodes.push(node);
            } else if (type === 'recursion' && node.type === 'ReturnStatement') {
                morphNodes.push(node);
            } else if (type === 'nested_loops' && node.type === 'ForStatement' && this.getNodeDepth(node) > 1) {
                deletedNodes.push(node);
            }
        }

        // Play Fade out on deleted nodes
        deletedNodes.forEach(node => {
            const card = document.getElementById(node.id);
            if (card) card.classList.add("fade-out");
            
            // Fade out connected lines
            node.children.forEach(c => {
                const line = document.getElementById(`connector-${node.id}-${c.id}`);
                if (line) line.style.opacity = 0;
            });
            // Fade parent connection
            const svgPaths = this.dom.astSvgCanvas.querySelectorAll("path");
            svgPaths.forEach(p => {
                if (p.id.endsWith(`-${node.id}`)) {
                    p.style.opacity = 0;
                }
            });
        });

        // Play morph effect on collapsed nodes
        morphNodes.forEach(node => {
            const card = document.getElementById(node.id);
            if (card) {
                card.style.borderColor = 'var(--ast-decl)';
                card.classList.add("warning-glow");
            }
        });
    }
}

// ==========================================
// MOCK PARSER AND ANALYZER HELPER CLASSES
// ==========================================
class PythonToESTreeParser {
    parse(code) {
        const lines = code.split('\n');
        const root = {
            type: "Program",
            body: [],
            loc: { start: { line: 1, column: 0 }, end: { line: lines.length, column: 0 } }
        };
        
        let currentBlock = root.body;
        const blockStack = [{ indent: -1, body: root.body }];
        
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            
            const indent = line.length - line.trimStart().length;
            
            while (blockStack.length > 1 && indent <= blockStack[blockStack.length - 1].indent) {
                blockStack.pop();
            }
            currentBlock = blockStack[blockStack.length - 1].body;
            
            const defMatch = trimmed.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:/);
            if (defMatch) {
                const funcName = defMatch[1];
                const params = defMatch[2].split(',').map(p => p.trim()).filter(Boolean).map(name => ({
                    type: "Identifier",
                    name: name
                }));
                const node = {
                    type: "FunctionDeclaration",
                    id: { type: "Identifier", name: funcName },
                    params: params,
                    body: { type: "BlockStatement", body: [] },
                    loc: { start: { line: lineNum, column: indent } }
                };
                currentBlock.push(node);
                blockStack.push({ indent: indent, body: node.body.body });
                return;
            }
            
            const ifMatch = trimmed.match(/^if\s+([^:]+)\s*:/);
            if (ifMatch) {
                const cond = ifMatch[1].trim();
                const node = {
                    type: "IfStatement",
                    test: this.parseExpression(cond, lineNum),
                    consequent: { type: "BlockStatement", body: [] },
                    loc: { start: { line: lineNum, column: indent } }
                };
                currentBlock.push(node);
                blockStack.push({ indent: indent, body: node.consequent.body });
                return;
            }
            
            const forMatch = trimmed.match(/^for\s+(\w+)\s+in\s+range\(([^)]+)\)\s*:/);
            if (forMatch) {
                const loopVar = forMatch[1];
                const rangeArgs = forMatch[2].split(',').map(a => a.trim());
                const node = {
                    type: "ForStatement",
                    init: { type: "VariableDeclarator", id: { type: "Identifier", name: loopVar } },
                    range: rangeArgs,
                    body: { type: "BlockStatement", body: [] },
                    loc: { start: { line: lineNum, column: indent } }
                };
                currentBlock.push(node);
                blockStack.push({ indent: indent, body: node.body.body });
                return;
            }
            
            if (trimmed.startsWith('return ')) {
                const argStr = trimmed.substring(7).trim();
                const node = {
                    type: "ReturnStatement",
                    argument: this.parseExpression(argStr, lineNum),
                    loc: { start: { line: lineNum, column: indent } }
                };
                currentBlock.push(node);
                return;
            }
            
            const assignMatch = trimmed.match(/^(\w+)\s*=\s*(.*)/);
            if (assignMatch) {
                const varName = assignMatch[1];
                const valueStr = assignMatch[2].trim();
                const node = {
                    type: "VariableDeclaration",
                    declarations: [{
                        type: "VariableDeclarator",
                        id: { type: "Identifier", name: varName },
                        init: this.parseExpression(valueStr, lineNum)
                    }],
                    kind: "let",
                    loc: { start: { line: lineNum, column: indent } }
                };
                currentBlock.push(node);
                return;
            }
            
            const node = {
                type: "ExpressionStatement",
                expression: this.parseExpression(trimmed, lineNum),
                loc: { start: { line: lineNum, column: indent } }
            };
            currentBlock.push(node);
        });
        
        return root;
    }
    
    parseExpression(str, lineNum) {
        if (!isNaN(str)) {
            return { type: "Literal", value: Number(str) };
        }
        
        const opMatch = str.match(/([^+-\s]+)\s*(\+|-|\*|\/|<=|>=|<|>|==)\s*(.+)/);
        if (opMatch) {
            return {
                type: "BinaryExpression",
                operator: opMatch[2],
                left: this.parseExpression(opMatch[1].trim(), lineNum),
                right: this.parseExpression(opMatch[3].trim(), lineNum)
            };
        }
        
        const callMatch = str.match(/^(\w+)\(([^)]*)\)$/);
        if (callMatch) {
            const name = callMatch[1];
            const args = callMatch[2].split(',').map(a => a.trim()).filter(Boolean).map(a => this.parseExpression(a, lineNum));
            return {
                type: "CallExpression",
                callee: { type: "Identifier", name: name },
                arguments: args
            };
        }
        
        return { type: "Identifier", name: str };
    }
}

class ASTStaticAnalyzer {
    analyze(ast) {
        const stats = {
            totalNodes: 0,
            nestedLoopDepth: 0,
            currentLoopDepth: 0,
            isRecursive: false,
            recursionSelfCalls: 0,
            declaredVars: new Set(),
            referencedVars: new Set(),
            warnings: []
        };
        
        this.traverse(ast, stats);
        
        const unusedVars = [...stats.declaredVars].filter(v => !stats.referencedVars.has(v));
        unusedVars.forEach(vName => {
            stats.warnings.push({
                type: "unused_variable",
                msg: `Unused variable detected: '${vName}'. Can be eliminated.`,
                variable: vName
            });
        });
        
        return stats;
    }
    
    traverse(node, stats) {
        if (!node) return;
        stats.totalNodes++;
        
        const isLoop = ['ForStatement', 'WhileStatement', 'ForOfStatement', 'ForInStatement'].includes(node.type);
        if (isLoop) {
            stats.currentLoopDepth++;
            if (stats.currentLoopDepth > stats.nestedLoopDepth) {
                stats.nestedLoopDepth = stats.currentLoopDepth;
            }
            if (stats.currentLoopDepth > 1) {
                stats.warnings.push({
                    type: "nested_loop",
                    line: node.loc?.start?.line,
                    msg: `Nested Loop Detected: Increases time complexity exponentially.`
                });
            }
        }
        
        if (node.type === 'VariableDeclarator') {
            stats.declaredVars.add(node.id.name);
        }
        
        if (node.type === 'Identifier') {
            stats.referencedVars.add(node.name);
        }
        
        if (node.type === 'FunctionDeclaration') {
            const funcName = node.id.name;
            node.params.forEach(p => stats.referencedVars.delete(p.name));
            
            let calls = 0;
            const searchSelfCalls = (inner) => {
                if (!inner) return;
                if (inner.type === 'CallExpression' && inner.callee.name === funcName) {
                    calls++;
                }
                for (let key in inner) {
                    if (inner[key] && typeof inner[key] === 'object') {
                        if (Array.isArray(inner[key])) inner[key].forEach(searchSelfCalls);
                        else searchSelfCalls(inner[key]);
                    }
                }
            };
            searchSelfCalls(node.body);
            
            if (calls > 0) {
                stats.isRecursive = true;
                stats.recursionSelfCalls = calls;
                if (calls > 1) {
                    stats.warnings.push({
                        type: "multiple_recursion",
                        line: node.loc?.start?.line,
                        msg: `Exponential recursion branches detected: ${calls} calls to self without base guards.`
                    });
                }
            }
        }
        
        for (let key in node) {
            if (node[key] && typeof node[key] === 'object') {
                if (node.type === 'VariableDeclarator' && key === 'id') continue;
                if (node.type === 'FunctionDeclaration' && (key === 'id' || key === 'params')) continue;
                
                if (Array.isArray(node[key])) {
                    node[key].forEach(child => this.traverse(child, stats));
                } else if (typeof node[key].type === 'string') {
                    this.traverse(node[key], stats);
                }
            }
        }
        
        if (isLoop) {
            stats.currentLoopDepth--;
        }
    }
}

class ASTOptimizer {
    constructor() {
        this.logs = [];
    }
    
    optimize(ast, type, lang = "javascript") {
        this.logs = [];
        let code = "";
        
        if (type === "recursion") {
            this.logs.push("Detected exponential recursion in function.");
            this.logs.push("Applying Recursion-to-Iteration transformation pass.");
            this.logs.push("Reconstructed function body as an iterative linear process.");
            
            if (lang === "javascript") {
                code = `function fibonacci(n) {
    if (n <= 1) return n;
    let prev2 = 0;
    let prev1 = 1;
    for (let i = 2; i <= n; i++) {
        let curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}`;
            } else {
                code = `def fibonacci(n):
    if n <= 1:
        return n
    prev2, prev1 = 0, 1
    for i in range(2, n + 1):
        curr = prev1 + prev2
        prev2 = prev1
        prev1 = curr
    return prev1`;
            }
        } else if (type === "nested_loops") {
            this.logs.push("Detected nesting loop structure causing O(N^2) time complexity.");
            this.logs.push("Applying Loop Flattening compiler pass.");
            this.logs.push("Merged inner loop boundary into 1D pointer math layout.");
            
            if (lang === "javascript") {
                code = `// Optimized Loop Flattening
function processMatrix(N, M) {
    const total = N * M;
    for (let k = 0; k < total; k++) {
        let i = Math.floor(k / M);
        let j = k % M;
        process(i, j);
    }
}`;
            } else {
                code = `# Optimized Loop Flattening
def processMatrix(N, M):
    total = N * M
    for k in range(total):
        i = k // M
        j = k % M
        process(i, j)`;
            }
        } else if (type === "dead_code") {
            this.logs.push("Detected dead code / unused variables.");
            this.logs.push("Applying Dead Code Elimination pass.");
            this.logs.push("Pruned unused variable definitions from AST scope.");
            
            if (lang === "javascript") {
                code = `function calculateTotal(price, tax) {
    let rate = 1 + tax;
    let total = price * rate;
    return total;
}`;
            } else {
                code = `def calculateTotal(price, tax):
    rate = 1 + tax
    total = price * rate
    return total`;
            }
        }
        
        return { code, logs: this.logs };
    }
}
