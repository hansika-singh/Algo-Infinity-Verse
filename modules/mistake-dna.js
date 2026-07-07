function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function logMistake(category, details, problemName) {
  const userProgress = window.userProgress || {};
  if (!userProgress.mistakeDna) userProgress.mistakeDna = { offByOneCount: 0, recursionBaseCaseCount: 0, wrongLogicCount: 0, recentLogs: [] };
  const md = userProgress.mistakeDna;
  if (category === 'off-by-one') md.offByOneCount = (md.offByOneCount || 0) + 1;
  else if (category === 'recursion') md.recursionBaseCaseCount = (md.recursionBaseCaseCount || 0) + 1;
  else if (category === 'logic') md.wrongLogicCount = (md.wrongLogicCount || 0) + 1;
  if (!md.recentLogs) md.recentLogs = [];
  md.recentLogs.push({ message: details, problem: problemName || "Workspace Practice", date: new Date().toISOString() });
  if (md.recentLogs.length > 5) md.recentLogs.shift();
  if (typeof saveUserData === 'function') saveUserData();
  renderMistakeDnaCard();
}

function renderMistakeDnaCard() {
  const userProgress = window.userProgress || {};
  const mCard = document.getElementById("mistakeDnaCard");
  if (!mCard) return;
  const md = userProgress.mistakeDna || { offByOneCount: 0, recursionBaseCaseCount: 0, wrongLogicCount: 0, recentLogs: [] };
  const offByOne = md.offByOneCount || 0, recursion = md.recursionBaseCaseCount || 0, wrongLogic = md.wrongLogicCount || 0, total = offByOne + recursion + wrongLogic;
  const pctOff = total > 0 ? Math.round((offByOne / total) * 100) : 0, pctRec = total > 0 ? Math.round((recursion / total) * 100) : 0, pctLogic = total > 0 ? Math.round((wrongLogic / total) * 100) : 0;
  let recommendation = "No mistakes logged yet!", recTitle = "DNA Engine Diagnostic", recColor = "#fb923c", recBorderColor = "#f97316", maxVal = 0;
  if (total > 0) {
    maxVal = Math.max(offByOne, recursion, wrongLogic);
    if (maxVal === offByOne) { recTitle = "Off-by-One / Boundary Alert"; recommendation = "Socratic Hint: Have you verified your loop bounds and empty input checks?"; recColor = "#f59e0b"; recBorderColor = "#f59e0b"; }
    else if (maxVal === recursion) { recTitle = "Recursion Base Case Alert"; recommendation = "Socratic Hint: Does every execution path reach a valid termination state?"; recColor = "#06b6d4"; recBorderColor = "#06b6d4"; }
    else { recTitle = "Wrong Logic Alert"; recommendation = "Socratic Hint: Can we solve this using fewer lookups or with a hash-map?"; recColor = "#ec4899"; recBorderColor = "#ec4899"; }
  }
  const logs = md.recentLogs || [];
  let logsHtml = logs.length === 0 ? `<p class="empty-state" style="font-size:0.8rem;color:var(--text-secondary);margin:0;">No recent mistake traces found.</p>` : [...logs].reverse().slice(0, 5).map(item => `<div class="recent-mistake-log-item"><div><span class="recent-mistake-desc">${escapeHtml(item.message)}</span><span class="recent-mistake-source">Problem: ${escapeHtml(item.problem)}</span></div><span class="recent-mistake-time-badge">${formatMistakeDate(item.date)}</span></div>`).join("");
  mCard.innerHTML = `<h3>🧬 Mistake DNA Tracker</h3><div class="mistake-dna-content"><div class="mistake-dna-header"><div class="mistake-dna-title-group"><span class="mistake-dna-subtitle" style="margin-top:0;">Behavior-Based Error Clustering</span></div><svg class="dna-helix-visualizer" viewBox="0 0 100 40"><g fill="none" stroke-width="2"><path d="M 10,20 Q 25,5 40,20 T 70,20 T 100,20" stroke="url(#dnaGrad1)" opacity="0.6"/><path d="M 10,20 Q 25,35 40,20 T 70,20 T 100,20" stroke="url(#dnaGrad2)" opacity="0.6"/><line x1="25" y1="12" x2="25" y2="28" stroke="rgba(249,115,22,0.4)" stroke-dasharray="2,2"/><line x1="55" y1="12" x2="55" y2="28" stroke="rgba(249,115,22,0.4)" stroke-dasharray="2,2"/><line x1="85" y1="12" x2="85" y2="28" stroke="rgba(249,115,22,0.4)" stroke-dasharray="2,2"/><circle class="dna-node-dot" cx="25" cy="12" r="3" fill="#f59e0b" style="animation-delay:0s;"/><circle class="dna-node-dot" cx="25" cy="28" r="3" fill="#ec4899" style="animation-delay:0.5s;"/><circle class="dna-node-dot" cx="55" cy="12" r="3" fill="#06b6d4" style="animation-delay:1s;"/><circle class="dna-node-dot" cx="55" cy="28" r="3" fill="#f97316" style="animation-delay:1.5s;"/><circle class="dna-node-dot" cx="85" cy="12" r="3" fill="#ef4444" style="animation-delay:0.2s;"/><circle class="dna-node-dot" cx="85" cy="28" r="3" fill="#3b82f6" style="animation-delay:0.7s;"/></g><defs><linearGradient id="dnaGrad1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#f97316"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient><linearGradient id="dnaGrad2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#ec4899"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs></svg></div><div class="mistake-map-bars"><div class="mistake-bar-group"><div class="mistake-bar-label"><span class="category-name">Off-by-One / Boundary Errors</span><span>${offByOne} (${pctOff}%)</span></div><div class="mistake-bar-track"><div class="mistake-bar-fill" id="barOffByOne" style="width:${pctOff}%; background: #f59e0b;"></div></div></div><div class="mistake-bar-group"><div class="mistake-bar-label"><span class="category-name">Recursion Base Case</span><span>${recursion} (${pctRec}%)</span></div><div class="mistake-bar-track"><div class="mistake-bar-fill" id="barRecursion" style="width:${pctRec}%; background: #06b6d4;"></div></div></div><div class="mistake-bar-group"><div class="mistake-bar-label"><span class="category-name">Wrong Logic</span><span>${wrongLogic} (${pctLogic}%)</span></div><div class="mistake-bar-track"><div class="mistake-bar-fill" id="barLogic" style="width:${pctLogic}%; background: #ec4899;"></div></div></div></div><div class="dna-recommendation" style="background:${recColor}12;border:1px solid ${recBorderColor}44;border-left:4px solid ${recBorderColor};"><div class="dna-recommendation-icon">🧬</div><div><strong style="color:${recColor};">${recTitle}</strong><p style="margin:0.25rem 0 0 0;font-size:0.85rem;opacity:0.9;">${recommendation}</p></div></div><div class="mistake-timeline"><h4 class="timeline-title">⏱️ Recent Mistake Traces</h4>${logsHtml}</div></div>`;
}

function formatMistakeDate(dateStr) {
  try { const d = new Date(dateStr); const now = new Date(); const diffMs = now - d; const diffMins = Math.floor(diffMs / 60000); if (diffMins < 1) return "Just now"; if (diffMins < 60) return `${diffMins}m ago`; const diffHours = Math.floor(diffMins / 60); if (diffHours < 24) return `${diffHours}h ago`; return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch (e) { return "Recently"; }
}

window.renderMistakeDnaCard = renderMistakeDnaCard;

export function initMistakeDna() {
  renderMistakeDnaCard();
}
// Legacy global exports
window.initMistakeDna = initMistakeDna;
