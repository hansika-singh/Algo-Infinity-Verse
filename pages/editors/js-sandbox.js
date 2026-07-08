import { executeJavaScriptSandbox } from "/backend/jsSandboxRunner.js";

const SAMPLE_TESTS = [
  { name: "reverse-1", input: [[1, 2, 3]], expected: [3, 2, 1] },
  { name: "reverse-2", input: [["a", "b"]], expected: ["b", "a"] },
];

function $(id) {
  return document.getElementById(id);
}

function safePretty(v) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setTranscript(text) {
  const pre = $("transcript");
  if (pre) pre.textContent = text;
}

function renderResults(data) {
  const { tests } = data;
  const testsList = $("testsList");
  const summary = $("summary");
  if (!testsList || !summary) return;

  testsList.innerHTML = "";

  let passed = 0;
  for (const t of tests) if (t.pass) passed += 1;

  summary.textContent = `Passed ${passed}/${tests.length}.`;

  tests.forEach((t, idx) => {
    const row = document.createElement("div");
    row.className = `test-row ${t.pass ? "pass" : "fail"}`;

    const expectedStr = t.expected === undefined ? "undefined" : safePretty(t.expected);
    const actualStr = t.actual === undefined ? "undefined" : safePretty(t.actual);

    row.innerHTML = `
      <div class="test-name">${idx + 1}. ${escapeHtml(t.name)} ${
      t.pass ? "✅" : "❌"
    }</div>
      ${t.pass ? "" : `
        <div class="diff">
          <div><b>Expected:</b> <code>${escapeHtml(expectedStr)}</code></div>
          <div><b>Actual:</b> <code>${escapeHtml(actualStr)}</code></div>
        </div>
        ${
          t.error
            ? `<div class="error-msg"><b>Runtime:</b> <pre>${escapeHtml(
                safePretty(t.error.message || t.error.name || "Error")
              )}</pre></div>`
            : ""
        }

        results.push({
            name: test.name,
            pass,
            actual,
            expected: test.expected,
            stdout: stdoutBuf,
            error
        });
    }

    return { tests: results };
}

document.addEventListener("DOMContentLoaded", () => {
  $("runSample")?.addEventListener("click", () => run({ hidden: false }));
  $("runHidden")?.addEventListener("click", () => run({ hidden: true }));
});
