/**
 * compiler-vm.js
 * Implements a complete Frontend Compilation Pipeline:
 * 1. Lexer: Tokenizes the raw input string.
 * 2. Parser: Builds an Abstract Syntax Tree (AST).
 * 3. Compiler: Traverses the AST and emits custom Bytecode.
 * 4. Virtual Machine: Executes the Bytecode instruction by instruction, visualizing Stack and Memory.
 */

document.addEventListener("DOMContentLoaded", () => {
    initSimulator();
});

// --- App State ---
const els = {
    editorContainer: document.getElementById('editorContainer'),
    btnCompile: document.getElementById('btnCompile'),
    btnStep: document.getElementById('btnStep'),
    btnPlay: document.getElementById('btnPlay'),
    btnStop: document.getElementById('btnStop'),
    
    bytecodeView: document.getElementById('bytecodeView'),
    astView: document.getElementById('astView'),
    bytecodeList: document.getElementById('bytecodeList'),
    astTree: document.getElementById('astTree'),
    bcEmpty: document.getElementById('bcEmpty'),
    astEmpty: document.getElementById('astEmpty'),
    
    stackContainer: document.getElementById('stackContainer'),
    memoryGrid: document.getElementById('memoryGrid'),
    termOutput: document.getElementById('termOutput'),
    ipDisplay: document.getElementById('ipDisplay'),
    engineBadge: document.getElementById('engineBadge')
};

let editor;
let compiledBytecode = [];
let vmInstance = null;
let autoRunInterval = null;

function initSimulator() {
    editor = CodeMirror(els.editorContainer, {
        lineNumbers: true,
        theme: 'material-darker',
        mode: 'javascript',
        indentUnit: 4,
        value: `// AlgoLang Fibonacci Sequence
let a = 0;
let b = 1;
let count = 0;

print a;
print b;

while (count < 8) {
    let next = a + b;
    print next;
    a = b;
    b = next;
    count = count + 1;
}
`
    });

    els.btnCompile.addEventListener('click', handleCompilation);
    els.btnStep.addEventListener('click', () => { if (vmInstance) vmInstance.step(); });
    els.btnPlay.addEventListener('click', toggleAutoRun);
    els.btnStop.addEventListener('click', haltVM);

    // Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.compiler-content').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.add('active');
        });
    });
}

function termPrint(msg, type = 'out') {
    const div = document.createElement('div');
    div.className = `term-msg ${type}`;
    div.textContent = type === 'sys' ? `> ${msg}` : msg;
    els.termOutput.appendChild(div);
    els.termOutput.scrollTop = els.termOutput.scrollHeight;
}

// ==========================================
// 1. THE LEXER
// ==========================================
const TokenType = {
    LET: 'LET', WHILE: 'WHILE', PRINT: 'PRINT',
    IDENTIFIER: 'IDENTIFIER', NUMBER: 'NUMBER',
    EQUALS: 'EQUALS', PLUS: 'PLUS', MINUS: 'MINUS', MUL: 'MUL', DIV: 'DIV',
    LT: 'LT', GT: 'GT',
    LPAREN: 'LPAREN', RPAREN: 'RPAREN',
    LBRACE: 'LBRACE', RBRACE: 'RBRACE',
    SEMICOLON: 'SEMICOLON', EOF: 'EOF'
};

class Lexer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
    }

    nextToken() {
        this.skipWhitespace();
        if (this.pos >= this.input.length) return { type: TokenType.EOF, value: '' };

        let char = this.input[this.pos];

        if (/[a-zA-Z]/.test(char)) {
            let str = '';
            while (this.pos < this.input.length && /[a-zA-Z0-9]/.test(this.input[this.pos])) {
                str += this.input[this.pos++];
            }
            if (str === 'let') return { type: TokenType.LET, value: str };
            if (str === 'while') return { type: TokenType.WHILE, value: str };
            if (str === 'print') return { type: TokenType.PRINT, value: str };
            return { type: TokenType.IDENTIFIER, value: str };
        }

        if (/[0-9]/.test(char)) {
            let num = '';
            while (this.pos < this.input.length && /[0-9]/.test(this.input[this.pos])) {
                num += this.input[this.pos++];
            }
            return { type: TokenType.NUMBER, value: parseInt(num) };
        }

        this.pos++;
        switch (char) {
            case '=': return { type: TokenType.EQUALS, value: '=' };
            case '+': return { type: TokenType.PLUS, value: '+' };
            case '-': return { type: TokenType.MINUS, value: '-' };
            case '*': return { type: TokenType.MUL, value: '*' };
            case '/': return { type: TokenType.DIV, value: '/' };
            case '<': return { type: TokenType.LT, value: '<' };
            case '>': return { type: TokenType.GT, value: '>' };
            case '(': return { type: TokenType.LPAREN, value: '(' };
            case ')': return { type: TokenType.RPAREN, value: ')' };
            case '{': return { type: TokenType.LBRACE, value: '{' };
            case '}': return { type: TokenType.RBRACE, value: '}' };
            case ';': return { type: TokenType.SEMICOLON, value: ';' };
            default: throw new Error(`Lexer Error: Unknown character '${char}'`);
        }
    }

    skipWhitespace() {
        while (this.pos < this.input.length) {
            let char = this.input[this.pos];
            if (/\s/.test(char)) {
                this.pos++;
            } else if (char === '/' && this.input[this.pos + 1] === '/') {
                // Skip comments
                while (this.pos < this.input.length && this.input[this.pos] !== '\n') this.pos++;
            } else {
                break;
            }
        }
    }

    tokenizeAll() {
        let tokens = [];
        let token;
        do {
            token = this.nextToken();
            tokens.push(token);
        } while (token.type !== TokenType.EOF);
        return tokens;
    }
}

// ==========================================
// 2. THE PARSER (Recursive Descent)
// ==========================================
class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    peek() { return this.tokens[this.pos]; }
    consume() { return this.tokens[this.pos++]; }
    match(type) {
        if (this.peek().type === type) return this.consume();
        return null;
    }
    expect(type) {
        let token = this.match(type);
        if (!token) throw new Error(`Parser Error: Expected ${type}, got ${this.peek().type}`);
        return token;
    }

    parse() {
        let program = { type: 'Program', body: [] };
        while (this.peek().type !== TokenType.EOF) {
            program.body.push(this.parseStatement());
        }
        return program;
    }

    parseStatement() {
        if (this.match(TokenType.LET)) {
            let id = this.expect(TokenType.IDENTIFIER).value;
            this.expect(TokenType.EQUALS);
            let init = this.parseExpression();
            this.expect(TokenType.SEMICOLON);
            return { type: 'VariableDeclaration', id, init };
        }
        if (this.match(TokenType.PRINT)) {
            let expr = this.parseExpression();
            this.expect(TokenType.SEMICOLON);
            return { type: 'PrintStatement', expr };
        }
        if (this.match(TokenType.WHILE)) {
            this.expect(TokenType.LPAREN);
            let test = this.parseExpression();
            this.expect(TokenType.RPAREN);
            let body = this.parseBlock();
            return { type: 'WhileStatement', test, body };
        }
        if (this.peek().type === TokenType.IDENTIFIER) {
            let id = this.consume().value;
            this.expect(TokenType.EQUALS);
            let expr = this.parseExpression();
            this.expect(TokenType.SEMICOLON);
            return { type: 'AssignmentStatement', id, expr };
        }
        throw new Error(`Parser Error: Unexpected token ${this.peek().value}`);
    }

    parseBlock() {
        this.expect(TokenType.LBRACE);
        let body = [];
        while (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
            body.push(this.parseStatement());
        }
        this.expect(TokenType.RBRACE);
        return { type: 'BlockStatement', body };
    }

    parseExpression() {
        let left = this.parseTerm();
        while (this.peek().type === TokenType.PLUS || this.peek().type === TokenType.MINUS || 
               this.peek().type === TokenType.LT || this.peek().type === TokenType.GT) {
            let operator = this.consume().value;
            let right = this.parseTerm();
            left = { type: 'BinaryExpression', operator, left, right };
        }
        return left;
    }

    parseTerm() {
        let left = this.parseFactor();
        while (this.peek().type === TokenType.MUL || this.peek().type === TokenType.DIV) {
            let operator = this.consume().value;
            let right = this.parseFactor();
            left = { type: 'BinaryExpression', operator, left, right };
        }
        return left;
    }

    parseFactor() {
        if (this.match(TokenType.LPAREN)) {
            let expr = this.parseExpression();
            this.expect(TokenType.RPAREN);
            return expr;
        }
        let token = this.consume();
        if (token.type === TokenType.NUMBER) return { type: 'NumericLiteral', value: token.value };
        if (token.type === TokenType.IDENTIFIER) return { type: 'Identifier', value: token.value };
        throw new Error(`Parser Error: Expected Number or Identifier, got ${token.value}`);
    }
}

// ==========================================
// 3. THE COMPILER (AST -> Bytecode)
// ==========================================
const OP = {
    PUSH: 'PUSH', LOAD: 'LOAD', STORE: 'STORE',
    ADD: 'ADD', SUB: 'SUB', MUL: 'MUL', DIV: 'DIV',
    LT: 'LT', GT: 'GT',
    PRINT: 'PRINT', JMP: 'JMP', JMP_FALSE: 'JMP_FALSE', HALT: 'HALT'
};

class Compiler {
    constructor() {
        this.bytecode = [];
    }

    emit(op, arg = null) {
        this.bytecode.push({ op, arg });
        return this.bytecode.length - 1; // Return address
    }

    compile(ast) {
        this.visit(ast);
        this.emit(OP.HALT);
        return this.bytecode;
    }

    visit(node) {
        switch (node.type) {
            case 'Program':
            case 'BlockStatement':
                node.body.forEach(stmt => this.visit(stmt));
                break;
            case 'VariableDeclaration':
            case 'AssignmentStatement':
                this.visit(node.init || node.expr);
                this.emit(OP.STORE, node.id);
                break;
            case 'PrintStatement':
                this.visit(node.expr);
                this.emit(OP.PRINT);
                break;
            case 'WhileStatement':
                let loopStart = this.bytecode.length;
                this.visit(node.test);
                let jmpFalseAddr = this.emit(OP.JMP_FALSE, 0); // Placeholder
                this.visit(node.body);
                this.emit(OP.JMP, loopStart);
                this.bytecode[jmpFalseAddr].arg = this.bytecode.length; // Patch jump
                break;
            case 'BinaryExpression':
                this.visit(node.left);
                this.visit(node.right);
                if (node.operator === '+') this.emit(OP.ADD);
                if (node.operator === '-') this.emit(OP.SUB);
                if (node.operator === '*') this.emit(OP.MUL);
                if (node.operator === '/') this.emit(OP.DIV);
                if (node.operator === '<') this.emit(OP.LT);
                if (node.operator === '>') this.emit(OP.GT);
                break;
            case 'NumericLiteral':
                this.emit(OP.PUSH, node.value);
                break;
            case 'Identifier':
                this.emit(OP.LOAD, node.value);
                break;
        }
    }
}

// ==========================================
// 4. THE VIRTUAL MACHINE
// ==========================================
class VirtualMachine {
    constructor(bytecode) {
        this.bytecode = bytecode;
        this.ip = 0; // Instruction Pointer
        this.stack = [];
        this.memory = {}; // Heap/Globals
        this.halted = false;
        
        this.renderAll();
    }

    step() {
        if (this.halted || this.ip >= this.bytecode.length) return;

        let inst = this.bytecode[this.ip];
        let a, b;

        switch (inst.op) {
            case OP.PUSH:
                this.stack.push(inst.arg);
                this.ip++;
                break;
            case OP.LOAD:
                if (this.memory[inst.arg] === undefined) throw new Error(`VM Error: Variable '${inst.arg}' not found.`);
                this.stack.push(this.memory[inst.arg]);
                this.ip++;
                break;
            case OP.STORE:
                this.memory[inst.arg] = this.stack.pop();
                this.ip++;
                break;
            case OP.ADD:
                b = this.stack.pop(); a = this.stack.pop();
                this.stack.push(a + b);
                this.ip++;
                break;
            case OP.SUB:
                b = this.stack.pop(); a = this.stack.pop();
                this.stack.push(a - b);
                this.ip++;
                break;
            case OP.MUL:
                b = this.stack.pop(); a = this.stack.pop();
                this.stack.push(a * b);
                this.ip++;
                break;
            case OP.DIV:
                b = this.stack.pop(); a = this.stack.pop();
                this.stack.push(Math.floor(a / b));
                this.ip++;
                break;
            case OP.LT:
                b = this.stack.pop(); a = this.stack.pop();
                this.stack.push(a < b ? 1 : 0);
                this.ip++;
                break;
            case OP.GT:
                b = this.stack.pop(); a = this.stack.pop();
                this.stack.push(a > b ? 1 : 0);
                this.ip++;
                break;
            case OP.PRINT:
                termPrint(this.stack.pop());
                this.ip++;
                break;
            case OP.JMP:
                this.ip = inst.arg;
                break;
            case OP.JMP_FALSE:
                if (this.stack.pop() === 0) {
                    this.ip = inst.arg;
                } else {
                    this.ip++;
                }
                break;
            case OP.HALT:
                this.halted = true;
                termPrint("Execution Completed.", "sys");
                haltVM(); // Updates UI buttons
                break;
        }

        this.renderAll();
    }

    renderAll() {
        // Highlight active Bytecode instruction
        document.querySelectorAll('.bc-inst').forEach((el, idx) => {
            if (idx === this.ip) {
                el.classList.add('active-inst');
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                el.classList.remove('active-inst');
            }
        });

        // Update IP HUD
        els.ipDisplay.textContent = this.ip;

        // Render Stack
        els.stackContainer.innerHTML = '';
        // Iterate backwards so top of stack is at top visually
        for (let i = this.stack.length - 1; i >= 0; i--) {
            const div = document.createElement('div');
            div.className = 'stack-item';
            div.textContent = this.stack[i];
            els.stackContainer.appendChild(div);
        }

        // Render Memory
        els.memoryGrid.innerHTML = '';
        for (const [key, val] of Object.entries(this.memory)) {
            const div = document.createElement('div');
            div.className = 'mem-var';
            div.innerHTML = `<span class="mem-key">${key}</span><span class="mem-val">${val}</span>`;
            els.memoryGrid.appendChild(div);
        }
    }
}

// ==========================================
// 5. ORCHESTRATION & UI GLUE
// ==========================================

function handleCompilation() {
    haltVM();
    els.termOutput.innerHTML = '';
    termPrint("Compiling...", "sys");

    const sourceCode = editor.getValue();
    
    try {
        // Lexing
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenizeAll();
        
        // Parsing
        const parser = new Parser(tokens);
        const ast = parser.parse();
        
        // Syntax Highlighting for AST View
        let astString = JSON.stringify(ast, null, 2);
        astString = astString.replace(/"type": "(.*?)"/g, '"type": "<span class="ast-type">$1</span>"');
        astString = astString.replace(/"value": (.*?)(,?)$/gm, '"value": <span class="ast-val">$1</span>$2');
        
        els.astEmpty.style.display = 'none';
        els.astTree.innerHTML = astString;

        // Compiling
        const compiler = new Compiler();
        compiledBytecode = compiler.compile(ast);
        
        // Render Bytecode UI
        els.bcEmpty.style.display = 'none';
        els.bytecodeList.innerHTML = '';
        compiledBytecode.forEach((inst, idx) => {
            const div = document.createElement('div');
            div.className = 'bc-inst';
            div.id = `bc-${idx}`;
            div.innerHTML = `
                <span class="bc-addr">${idx.toString().padStart(3, '0')}</span>
                <span class="bc-op">${inst.op}</span>
                <span class="bc-arg">${inst.arg !== null ? inst.arg : ''}</span>
            `;
            els.bytecodeList.appendChild(div);
        });

        termPrint("Compilation Successful.", "sys");
        
        // Initialize VM
        vmInstance = new VirtualMachine(compiledBytecode);
        
        // Enable Controls
        els.btnStep.disabled = false;
        els.btnPlay.disabled = false;
        els.engineBadge.classList.add('active');
        els.engineBadge.innerHTML = '<i class="fas fa-microchip"></i> VM Loaded';

    } catch (e) {
        termPrint(e.message, "err");
        els.engineBadge.classList.remove('active');
        els.engineBadge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Compile Error';
    }
}

function toggleAutoRun() {
    if (autoRunInterval) {
        haltVM(); // Just stops interval, doesn't destroy VM state
    } else {
        els.btnPlay.innerHTML = '<i class="fas fa-pause"></i>';
        els.btnStep.disabled = true;
        els.btnStop.disabled = false;
        
        autoRunInterval = setInterval(() => {
            if (vmInstance && !vmInstance.halted) {
                vmInstance.step();
            } else {
                haltVM();
            }
        }, 150); // 150ms per instruction
    }
}

function haltVM() {
    if (autoRunInterval) {
        clearInterval(autoRunInterval);
        autoRunInterval = null;
    }
    els.btnPlay.innerHTML = '<i class="fas fa-play"></i>';
    els.btnStep.disabled = vmInstance ? vmInstance.halted : true;
    els.btnPlay.disabled = vmInstance ? vmInstance.halted : true;
    els.btnStop.disabled = true;
}
