// Shared client helper for Runtime Complexity Analyzer
window.analyzeComplexity = async function(code) {
  try {
    const compRes = await fetch('/api/analyze-complexity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code })
    });
    if (compRes.ok) {
      const compData = await compRes.json();
      if (compData.complexity && !compData.error) {
        return compData.complexity;
      }
    }
  } catch (err) {
    console.error("Complexity analysis failed", err);
  }
  return null;
};

// Also export for ES module environments if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeComplexity: window.analyzeComplexity };
} else if (typeof exports !== 'undefined') {
  exports.analyzeComplexity = window.analyzeComplexity;
}
