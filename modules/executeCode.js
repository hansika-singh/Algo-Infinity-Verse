const API_BASE = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? ''
  : '';

export async function executeCode({ source_code, language, stdin = '' }) {
  if (!navigator.onLine) {
    // Offline Sandbox Execution via Web Worker
    return new Promise((resolve, reject) => {
      const worker = new Worker('/worker.js');
      
      const timeoutId = setTimeout(() => {
        worker.terminate();
        reject(new Error('Execution timed out. Potential infinite loop.'));
      }, 5000); // 5 second timeout

      worker.onmessage = (e) => {
        clearTimeout(timeoutId);
        worker.terminate();
        if (e.data && e.data.success) {
          // Format the response to match the backend /api/execute structure
          resolve({ run: { output: e.data.output, stderr: '' }, status: 200 });
        } else {
          resolve({ run: { output: '', stderr: e.data.error || 'Execution failed' }, status: 400 });
        }
      };

      worker.onerror = (err) => {
        clearTimeout(timeoutId);
        worker.terminate();
        reject(new Error(err.message || 'Worker encountered an error'));
      };

      worker.postMessage({ code: source_code, lang: language, stdin });
    });
  }

  // Online Execution
  const res = await fetch(`${API_BASE}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_code, language, stdin }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}
// Legacy global exports
window.executeCode = executeCode;
