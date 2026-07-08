// modules/code-executor.js

const workerScript = `
self.onmessage = function(e) {
    // Disable dangerous Web APIs in the worker sandbox
    self.fetch = undefined;
    self.XMLHttpRequest = undefined;
    self.WebSocket = undefined;
    self.importScripts = undefined;
    self.indexedDB = undefined;
    self.caches = undefined;

    const { code } = e.data;
    const logs = [];
    const MAX_LOG_LINES = 100;
    const MAX_TOTAL_LOG_CHARS = 10000;
    let totalLogChars = 0;
    
    function formatValue(value) {
        if (typeof value === "object" && value !== null) {
            try {
                return JSON.stringify(value, null, 2);
            } catch {
                return "[Object]";
            }
        }
        return String(value);
    }

    function appendLog(level, message) {
        if (logs.length >= MAX_LOG_LINES) {
            if (logs[logs.length - 1] !== "[Truncated: exceeded log line limit]") {
                logs.push("[Truncated: exceeded log line limit]");
            }
            return;
        }
        if (totalLogChars >= MAX_TOTAL_LOG_CHARS) {
            if (logs[logs.length - 1] !== "[Truncated: exceeded log character limit]") {
                logs.push("[Truncated: exceeded log character limit]");
            }
            return;
        }

        let formatted = message;
        if (level === "warn") formatted = "⚠️ " + formatted;
        if (level === "error") formatted = "❌ " + formatted;

        if (totalLogChars + formatted.length > MAX_TOTAL_LOG_CHARS) {
            formatted = formatted.slice(0, MAX_TOTAL_LOG_CHARS - totalLogChars) + "... [Truncated]";
        }

        logs.push(formatted);
        totalLogChars += formatted.length;
    }

    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
    };

    console.log = (...args) => {
        appendLog("log", args.map(formatValue).join(" "));
    };
    console.warn = (...args) => {
        appendLog("warn", args.map(formatValue).join(" "));
    };
    console.error = (...args) => {
        appendLog("error", args.map(formatValue).join(" "));
    };

    try {
        const execute = new Function(code);
        const result = execute();
        
        if (result !== undefined) {
            appendLog("log", formatValue(result));
        }
        
        self.postMessage({ success: true, logs });
    } catch (error) {
        self.postMessage({ success: false, error: error.name + ": " + error.message, logs });
    } finally {
        console.log = originalConsole.log;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
    }
};
`;

/**
 * Safely executes arbitrary JavaScript code within an isolated Web Worker,
 * preventing infinite loops from blocking the main UI thread.
 * 
 * @param {string} code The JavaScript code to execute.
 * @param {number} timeoutMs Maximum allowed execution time in milliseconds.
 * @returns {Promise<string[]>} Resolves with an array of console log strings if successful.
 */
export function executeSandboxedCode(code, timeoutMs = 3000) {
    const MAX_CODE_LENGTH = 50000; // 50KB limit
    
    if (!code || typeof code !== "string") {
        return Promise.reject(new Error("Source code must be a non-empty string."));
    }
    if (code.length > MAX_CODE_LENGTH) {
        return Promise.reject(new Error(`Source code exceeds maximum length of ${MAX_CODE_LENGTH} characters.`));
    }

    return new Promise((resolve, reject) => {
        const blob = new Blob([workerScript], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);
        
        const timeoutId = setTimeout(() => {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            reject(new Error("Timeout / Infinite Loop Detected: Execution exceeded " + timeoutMs + "ms"));
        }, timeoutMs);

        worker.onmessage = (e) => {
            clearTimeout(timeoutId);
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            
            const { success, error, logs } = e.data;
            if (success) {
                resolve(logs);
            } else {
                // Reject with the captured error, but also include logs printed before the error
                reject(new Error(error + (logs.length > 0 ? "\nPartial Output: \n" + logs.join("\n") : "")));
            }
        };

        worker.onerror = (err) => {
            clearTimeout(timeoutId);
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            reject(new Error(err.message || "Unknown Worker Error"));
        };

        worker.postMessage({ code });
    });
}
// Legacy global exports
window.executeSandboxedCode = executeSandboxedCode;
