/**
 * pyodide-worker.js
 * Runs entirely in a background Web Worker.
 * Loads the Pyodide WebAssembly distribution of CPython.
 * Intercepts stdout/stderr to capture Python `print()` statements and errors.
 */

// Import Pyodide CDN
importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodideReadyPromise = null;

async function initPyodide() {
    try {
        // Load the Wasm binary.
        // We pass custom stdout/stderr callbacks to capture print statements
        const pyodide = await loadPyodide({
            stdout: (text) => {
                self.postMessage({ type: 'stdout', text: text });
            },
            stderr: (text) => {
                self.postMessage({ type: 'stderr', text: text });
            }
        });
        
        // Notify main thread we are ready
        self.postMessage({ type: 'status', status: 'ready' });
        return pyodide;
    } catch (err) {
        self.postMessage({ type: 'error', error: err.message });
        throw err;
    }
}

// Start loading immediately when the worker boots
pyodideReadyPromise = initPyodide();

self.onmessage = async (event) => {
    const msg = event.data;
    
    if (msg.type === 'execute') {
        const code = msg.code;
        
        try {
            // Wait for engine to be ready if it isn't already
            const pyodide = await pyodideReadyPromise;
            
            // Measure execution time
            const startTime = performance.now();
            
            // Run the Python code
            // runPythonAsync handles async python code, but works for sync too.
            await pyodide.runPythonAsync(code);
            
            const endTime = performance.now();
            
            // Notify main thread of completion
            self.postMessage({ 
                type: 'result', 
                executionTime: (endTime - startTime).toFixed(2)
            });
            
        } catch (err) {
            // Send runtime compilation/execution errors back to terminal
            self.postMessage({ type: 'stderr', text: err.toString() });
            
            // Still unlock the button on the main thread
            self.postMessage({ type: 'result', executionTime: "0.00" });
        }
    }
};
