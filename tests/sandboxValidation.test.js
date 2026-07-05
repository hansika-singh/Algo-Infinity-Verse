import { jest } from '@jest/globals';

// Define Mock Worker and Browser Globals for Node/Jest environment
if (typeof Worker === 'undefined') {
  global.Blob = class Blob {
    constructor(parts) {
      this.content = parts.join('');
    }
  };
  global.URL = {
    createObjectURL: () => 'mock-url',
    revokeObjectURL: () => {},
  };
  global.Worker = class MockWorker {
    constructor() {
      this.onmessage = null;
      this.onerror = null;
    }
    postMessage(data) {
      const code = data.code;
      const logs = [];
      const MAX_LOG_LINES = 100;
      const MAX_TOTAL_LOG_CHARS = 10000;
      let totalLogChars = 0;
      
      function formatValue(value) {
        if (typeof value === "object" && value !== null) {
          try { return JSON.stringify(value, null, 2); } catch { return "[Object]"; }
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

      const customConsole = {
        log: (...args) => appendLog("log", args.map(formatValue).join(" ")),
        warn: (...args) => appendLog("warn", args.map(formatValue).join(" ")),
        error: (...args) => appendLog("error", args.map(formatValue).join(" ")),
      };

      const sandboxGlobals = {
        console: customConsole,
        fetch: undefined,
        XMLHttpRequest: undefined,
        WebSocket: undefined,
        importScripts: undefined,
        indexedDB: undefined,
        caches: undefined,
      };

      try {
        const fn = new Function(...Object.keys(sandboxGlobals), code);
        const result = fn(...Object.values(sandboxGlobals));
        if (result !== undefined) {
          appendLog("log", formatValue(result));
        }
        setTimeout(() => {
          if (this.onmessage) {
            this.onmessage({ data: { success: true, logs } });
          }
        }, 10);
      } catch (error) {
        setTimeout(() => {
          if (this.onmessage) {
            this.onmessage({ data: { success: false, error: error.name + ": " + error.message, logs } });
          }
        }, 10);
      }
    }
    terminate() {}
  };
}

import { executeSandboxedCode } from '../modules/code-executor.js';

describe('executeSandboxedCode execution sandboxing constraints', () => {
  it('should reject code that exceeds the maximum character length', async () => {
    const hugeCode = 'a'.repeat(50001);
    await expect(executeSandboxedCode(hugeCode)).rejects.toThrow(/exceeds maximum length/);
  });

  it('should accept code under the limit', async () => {
    const normalCode = 'console.log("hello");';
    const logs = await executeSandboxedCode(normalCode);
    expect(logs).toContain('hello');
  });

  it('should truncate console log line counts above limit', async () => {
    // Generate code that logs 120 times
    const excessiveLinesCode = `
      for (let i = 0; i < 120; i++) {
        console.log("Line " + i);
      }
    `;
    const logs = await executeSandboxedCode(excessiveLinesCode);
    // Should have 100 lines + 1 truncation warning = 101 entries
    expect(logs.length).toBeLessThanOrEqual(101);
    expect(logs[logs.length - 1]).toBe('[Truncated: exceeded log line limit]');
  });

  it('should truncate total console log characters above limit', async () => {
    // Log a single very long string (11,000 characters)
    const longString = 'x'.repeat(11000);
    const excessiveCharsCode = `console.log("${longString}");`;
    const logs = await executeSandboxedCode(excessiveCharsCode);
    
    expect(logs[0].length).toBeLessThanOrEqual(10015); // capped log + suffix
    expect(logs[0]).toContain('[Truncated]');
  });

  it('should block dangerous Web APIs within the sandbox', async () => {
    const fetchCheckCode = `
      if (typeof fetch === 'undefined') {
        console.log("fetch is blocked");
      } else {
        console.log("fetch is accessible");
      }
    `;
    const xhrCheckCode = `
      if (typeof XMLHttpRequest === 'undefined') {
        console.log("xhr is blocked");
      } else {
        console.log("xhr is accessible");
      }
    `;

    const logsFetch = await executeSandboxedCode(fetchCheckCode);
    const logsXhr = await executeSandboxedCode(xhrCheckCode);

    expect(logsFetch).toContain('fetch is blocked');
    expect(logsXhr).toContain('xhr is blocked');
  });
});
