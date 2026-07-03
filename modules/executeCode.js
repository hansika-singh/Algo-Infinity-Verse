const API_BASE = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? 'http://localhost:3001'
  : '';

export async function executeCode({ source_code, language, stdin = '' }) {
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
