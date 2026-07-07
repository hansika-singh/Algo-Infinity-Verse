/**
 * wasm-execution.js
 * main thread
 * Main thread logic for the Client-Side Polyglot Execution Engine.
 * Manages the CodeMirror editor, Terminal UI, and Web Worker communication.
 */

document.addEventListener("DOMContentLoaded", () => {
    initWasmEngine();
});

const els = {
    editorContainer: document.getElementById('editorContainer'),
    btnRunCode: document.getElementById('btnRunCode'),
    terminalOutput: document.getElementById('terminalOutput'),
    btnClearConsole: document.getElementById('btnClearConsole'),
    engineStatusBadge: document.getElementById('engineStatusBadge')
};

let editor;
let pyodideWorker;
let isEngineReady = false;

function initWasmEngine() {
    // 1. Initialize CodeMirror Editor
    editor = CodeMirror(els.editorContainer, {
        lineNumbers: true,
        theme: 'monokai',
        mode: 'python',
        indentUnit: 4,
        matchBrackets: true,
        autoCloseBrackets: true,
        value: `# Python 3.11 environment (powered by Pyodide WebAssembly)
# Standard output (print) is captured and displayed below!

def two_sum(nums, target):
    num_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i
    return []

# Let's run a test case
nums = [2, 7, 11, 15]
target = 9

print(f"Testing two_sum with nums={nums}, target={target}")
result = two_sum(nums, target)
print(f"Result: {result}")

if result == [0, 1]:
    print("✅ TEST PASSED!")
else:
    print("❌ TEST FAILED!")
`
    });

    // 2. Initialize the Web Worker to load Pyodide (Wasm)
    setupWebWorker();

    // 3. Bind UI Events
    els.btnRunCode.addEventListener('click', executeCode);
    els.btnClearConsole.addEventListener('click', () => {
        els.terminalOutput.innerHTML = '';
    });
}

function setupWebWorker() {
    try {
        // Create worker
        pyodideWorker = new Worker('pyodide-worker.js');
        
        // Listen to worker messages
        pyodideWorker.onmessage = (event) => {
            const msg = event.data;
            
            switch (msg.type) {
                case 'status':
                    if (msg.status === 'ready') {
                        isEngineReady = true;
                        els.btnRunCode.disabled = false;
                        els.engineStatusBadge.className = 'engine-status ready';
                        els.engineStatusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Wasm Engine Ready';
                        appendTerminal('Pyodide engine loaded successfully. Ready to execute Python code.', 'sys-msg');
                    }
                    break;
                case 'stdout':
                    // Standard print() output
                    appendTerminal(msg.text, 'stdout');
                    break;
                case 'stderr':
                    // Error traces
                    appendTerminal(msg.text, 'stderr');
                    break;
                case 'result':
                    // Final return value of the execution (if any), and time
                    appendTerminal(`--- Execution finished in ${msg.executionTime}ms ---`, 'result');
                    
                    // Re-enable button
                    els.btnRunCode.disabled = false;
                    els.btnRunCode.innerHTML = '<i class="fas fa-play"></i> Run Code';
                    break;
                case 'error':
                    // Catch-all errors
                    appendTerminal(`Runtime Error: ${msg.error}`, 'stderr');
                    els.btnRunCode.disabled = false;
                    els.btnRunCode.innerHTML = '<i class="fas fa-play"></i> Run Code';
                    break;
            }
        };
    } catch (e) {
        console.error("Worker Error:", e);
        appendTerminal("Error loading WebAssembly Worker. Ensure you are running on a local web server (e.g., Live Server) to prevent CORS issues.", 'stderr');
    }
}

function executeCode() {
    if (!isEngineReady) return;
    
    // Clear terminal (optional, but good for fresh runs)
    els.terminalOutput.innerHTML = '';
    appendTerminal('> Executing script...', 'sys-msg');
    
    // Lock button
    els.btnRunCode.disabled = true;
    els.btnRunCode.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
    
    // Get code and send to worker
    const code = editor.getValue();
    pyodideWorker.postMessage({ type: 'execute', code: code });
}

function appendTerminal(text, className) {
    // Skip empty stdout flushes
    if (className === 'stdout' && text.trim() === '') return;
    
    const line = document.createElement('div');
    line.className = `term-line ${className}`;
    line.textContent = text;
    els.terminalOutput.appendChild(line);
    
    // Auto-scroll to bottom
    els.terminalOutput.scrollTop = els.terminalOutput.scrollHeight;
}
