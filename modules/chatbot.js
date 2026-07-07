function initChatbot() {
  const chatbotResponses = window.chatbotResponses || {};
  const toggle = document.getElementById("chatbotToggle");
  const windowEl = document.getElementById("chatbotWindow");
  const close = document.getElementById("chatbotClose");
  const input = document.getElementById("chatbotInput");
  const send = document.getElementById("chatbotSend");
  const quickQs = document.querySelectorAll(".quick-q");
  if (!toggle || !windowEl || !close || !input || !send) return;

  const header = windowEl.querySelector(".chatbot-header");
  if (header && !document.getElementById("doubtGenToggle")) {
    if (!document.getElementById("doubt-gen-styles")) {
      const styleEl = document.createElement("style");
      styleEl.id = "doubt-gen-styles";
      styleEl.textContent = `.doubt-gen-toggle-container{display:flex;align-items:center;gap:6px;margin-left:auto;margin-right:12px;font-size:0.75rem;color:rgba(255,255,255,0.7);user-select:none;background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);}.doubt-gen-toggle-container span{font-weight:600;letter-spacing:0.5px;}.doubt-gen-switch{position:relative;display:inline-block;width:32px;height:18px;}.doubt-gen-switch input{opacity:0;width:0;height:0;}.doubt-gen-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:rgba(255,255,255,0.15);transition:.3s ease;border-radius:34px;}.doubt-gen-slider:before{position:absolute;content:"";height:12px;width:12px;left:3px;bottom:3px;background-color:#fff;transition:.3s ease;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.4);}.doubt-gen-switch input:checked+.doubt-gen-slider{background-color:var(--primary,#8b5cf6);box-shadow:0 0 8px rgba(139,92,246,0.5);}.doubt-gen-switch input:checked+.doubt-gen-slider:before{transform:translateX(14px);}`;
      document.head.appendChild(styleEl);
    }
    const toggleContainer = document.createElement("div");
    toggleContainer.className = "doubt-gen-toggle-container";
    toggleContainer.innerHTML = `<span>Doubt Gen</span><label class="doubt-gen-switch"><input type="checkbox" id="doubtGenToggle"><span class="doubt-gen-slider"></span></label>`;
    header.insertBefore(toggleContainer, close);
    const toggleInput = document.getElementById("doubtGenToggle");
    const headerTitle = header.querySelector("h4");
    if (toggleInput && headerTitle) {
      toggleInput.addEventListener("change", () => {
        if (toggleInput.checked) { headerTitle.textContent = "Doubt Generator"; if (typeof showNotification === 'function') showNotification("Self-Debugging Mode Activated!", "success"); addChatMessage(`<div style="font-size:0.85rem;color:#a7f3d0;background:rgba(16,185,129,0.1);border:1px dashed #10b981;padding:8px 12px;border-radius:8px;margin-bottom:5px;">🔍 <strong>Doubt Generator Enabled</strong><br>I will ask Socratic questions to help you spot bugs!</div>`, "bot", { html: true }); }
        else { headerTitle.textContent = "Algo Assistant"; if (typeof showNotification === 'function') showNotification("Standard Mode Activated.", "info"); addChatMessage(`<div style="font-size:0.85rem;color:#c084fc;background:rgba(139,92,246,0.1);border:1px dashed #a855f7;padding:8px 12px;border-radius:8px;margin-bottom:5px;">💡 <strong>Standard Assistant Enabled</strong><br>I will provide direct code templates and explanations!</div>`, "bot", { html: true }); }
      });
    }
  }

  toggle.addEventListener("click", () => { windowEl.classList.toggle("hidden"); const badge = toggle.querySelector(".chatbot-badge"); if (badge) badge.style.display = "none"; });
  close.addEventListener("click", () => windowEl.classList.add("hidden"));

  function sendMessage() {
    const message = input.value.trim();
    if (!message) return;
    addChatMessage(message, "user");
    input.value = "";
    const loadingEl = document.createElement("div");
    loadingEl.className = "message bot loading";
    loadingEl.innerHTML = `<p>⏳ Algo Assistant is typing...</p>`;
    const messagesContainer = document.getElementById("chatbotMessages");
    messagesContainer.appendChild(loadingEl);
    messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: "smooth" });
    setTimeout(() => { loadingEl.remove(); const response = getBotResponse(message); addChatMessage(response, "bot", { html: true }); }, 1000);
  }

  send.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
  quickQs.forEach(btn => btn.addEventListener("click", () => { input.value = btn.getAttribute("data-question"); sendMessage(); }));
}

function addChatMessage(message, sender, { html = false } = {}) {
  const messagesContainer = document.getElementById("chatbotMessages");
  const messageEl = document.createElement("div");
  messageEl.className = `message ${sender}`;
  if (html) {
    if (typeof window !== 'undefined' && window.DOMSanitizer?.sanitizeHTML) {
      messageEl.innerHTML = window.DOMSanitizer.sanitizeHTML(message);
    } else {
      messageEl.textContent = String(message ?? '');
    }
  } else {
    messageEl.textContent = message;
  }
  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getBotResponse(question) {
  const chatbotResponses = window.chatbotResponses || {};
  const userProgress = window.userProgress || {};
  const q = question.toLowerCase();
  const doubtGenToggle = document.getElementById("doubtGenToggle");
  const isDoubtGenActive = doubtGenToggle && doubtGenToggle.checked;

  if (isDoubtGenActive) {
    let category = "General", doubtQuestion = "", debuggingTip = "";
    const isCode = q.includes("{") || q.includes("}") || q.includes("function") || q.includes("def ") || q.includes("for(") || q.includes("while(");
    if (isCode) { category = "Code Analysis"; doubtQuestion = "Look closely at your loop/recursion variables. Are they guaranteed to change in every iteration?"; debuggingTip = "Trace the value of your loop counters for the first 3 iterations."; }
    else if (q.includes("sort")) { category = "Sorting Algorithms"; doubtQuestion = "What happens to equal elements during comparisons?"; debuggingTip = "Dry-run with a small duplicate array."; }
    else if (q.includes("recursion")) { category = "Recursion"; doubtQuestion = "Is your recursion guaranteed to reach the base case?"; debuggingTip = "Add console logs at the top to print input values."; }
    else if (q.includes("dp") || q.includes("dynamic")) { category = "Dynamic Programming"; doubtQuestion = "Are the base cases of your DP table correctly initialized?"; debuggingTip = "Draw a small DP table and fill first 3 cells manually."; }
    else if (q.includes("tree") || q.includes("graph")) { category = "Trees & Graphs"; doubtQuestion = "Does your traversal check for cycles or visited nodes?"; debuggingTip = "Verify 'visited' set initialization."; }
    else if (q.includes("array") || q.includes("list") || q.includes("index")) { category = "Arrays & Memory Bounds"; doubtQuestion = "What happens if the input is empty or has only one element?"; debuggingTip = "Check index calculation on last iteration."; }
    else { category = "General Self-Debugging"; doubtQuestion = "What are the exact inputs and outputs you expect?"; debuggingTip = "Try explaining your algorithm line-by-line."; }
    return `<div class="assistant-response doubt-gen-response"><h4 style="color:var(--accent,#a78bfa);"><i class="fas fa-question-circle"></i> Doubt Generator Mode</h4><div style="margin-top:8px;"><strong>Category:</strong> <span style="background:rgba(139,92,246,0.2);padding:2px 6px;border-radius:4px;font-size:0.8rem;color:#c084fc;">${category}</span></div><div style="margin-top:12px;border-left:3px solid var(--primary,#8b5cf6);padding-left:10px;"><h5 style="margin:0 0 4px 0;font-size:0.9rem;color:var(--accent,#a78bfa);">🔍 Socratic Question:</h5><p style="font-style:italic;color:#f1f5f9;margin:0;line-height:1.4;">"${doubtQuestion}"</p></div><div style="margin-top:14px;background:rgba(255,255,255,0.02);padding:8px 12px;border-radius:6px;"><h5 style="margin:0 0 4px 0;font-size:0.9rem;color:#10b981;">🛠️ Debugging Tip:</h5><p style="margin:0;font-size:0.85rem;line-height:1.4;color:#cbd5e1;">${debuggingTip}</p></div><div style="margin-top:14px;font-size:0.75rem;color:#94a3b8;border-top:1px solid rgba(255,255,255,0.05);padding-top:8px;"><i class="fas fa-info-circle"></i> <em>Answer the question to locate the bug. Turn off "Doubt Gen" for direct solutions.</em></div></div>`;
  }

  let response = chatbotResponses["default"];
  for (const key in chatbotResponses) { if (q.includes(key)) { response = chatbotResponses[key]; break; } }
  const cpType = userProgress.codingPersonality?.type || "brute-force first";
  let personalityHint = "";
  if (cpType === "brute-force first") personalityHint = `<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-left:3px solid #ef4444;padding:8px 12px;border-radius:6px;margin-top:15px;font-size:0.8rem;line-height:1.4;color:#f87171;">⚠️ <strong>Tip (Brute-Force First)</strong>: Remember edge checks before typing logic!</div>`;
  else if (cpType === "over-optimizer") personalityHint = `<div style="background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.2);border-left:3px solid #a855f7;padding:8px 12px;border-radius:6px;margin-top:15px;font-size:0.8rem;line-height:1.4;color:#c084fc;">⚡ <strong>Tip (Over-Optimizer)</strong>: Focus on clean code readability!</div>`;
  else if (cpType === "slow but accurate") personalityHint = `<div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-left:3px solid #3b82f6;padding:8px 12px;border-radius:6px;margin-top:15px;font-size:0.8rem;line-height:1.4;color:#60a5fa;">⏱️ <strong>Tip (Slow but Accurate)</strong>: Try setting a timer for 15 minutes!</div>`;
  else if (cpType === "greedy thinker") personalityHint = `<div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-left:3px solid #10b981;padding:8px 12px;border-radius:6px;margin-top:15px;font-size:0.8rem;line-height:1.4;color:#34d399;">🎯 <strong>Tip (Greedy Thinker)</strong>: Ensure greedy choice guarantees global optimum!</div>`;
  return `<div class="assistant-response"><h4>🧠 Problem Understanding</h4><p>${escapeHtml(question)}</p><h4>⚡ Approach</h4><p>${response}</p><h4>💻 Code Solution</h4><pre><code>function solveProblem() { /* Your logic here */ }</code></pre><h4>📊 Complexity Analysis</h4><p>Time Complexity: O(n)</p><p>Space Complexity: O(1)</p>${personalityHint}</div>`;
}

export { initChatbot, addChatMessage, getBotResponse };
