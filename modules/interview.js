let isAiInterviewerActive = false;
let workspaceSocket = null;

(function injectAiHintStyles() {
  if (document.getElementById('ai-hint-styles')) return;
  const style = document.createElement('style');
  style.id = 'ai-hint-styles';
  style.textContent = `
    #ai-hint-bubble { position: absolute; bottom: 70px; right: 16px; width: 300px; max-width: calc(100% - 32px); background: #0f1f1a; border: 1px solid #10b981; border-left: 4px solid #10b981; border-radius: 12px; padding: 14px 16px; z-index: 99999; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6); font-family: 'Poppins', sans-serif; animation: ai-hint-slide-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1); pointer-events: all; }
    #ai-hint-bubble.ai-hint-dismissing { animation: ai-hint-slide-out 0.2s ease-in forwards; }
    @keyframes ai-hint-slide-in { from { opacity: 0; transform: translateY(16px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes ai-hint-slide-out { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(12px); } }
    #ai-hint-bubble .ai-hint-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    #ai-hint-bubble .ai-hint-title { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: #10b981; letter-spacing: 0.3px; font-family: 'Orbitron', sans-serif; }
    #ai-hint-bubble .ai-hint-close { background: none; border: none; cursor: pointer; color: #64748b; font-size: 18px; line-height: 1; padding: 0; transition: color 0.15s ease; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 4px; }
    #ai-hint-bubble .ai-hint-close:hover { color: #e2e8f0; background: rgba(255, 255, 255, 0.06); }
    #ai-hint-bubble .ai-hint-body { font-size: 13.5px; color: #cbd5e1; line-height: 1.6; font-family: 'Poppins', sans-serif; }
    #ai-hint-bubble .ai-hint-footer { display: flex; align-items: center; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(16, 185, 129, 0.15); }
    #ai-hint-bubble .ai-hint-pulse { width: 7px; height: 7px; background: #10b981; border-radius: 50%; flex-shrink: 0; animation: ai-hint-pulse 1.6s ease-in-out infinite; }
    @keyframes ai-hint-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.85); } }
    #ai-hint-bubble .ai-hint-footer-text { font-size: 11px; color: #475569; font-family: 'Fira Code', monospace; }
  `;
  document.head.appendChild(style);
}());

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function initAiInterviewer() {
    const editor = document.getElementById('codeEditor');
    if (!workspaceSocket && typeof io !== 'undefined') {
        workspaceSocket = io();
    }
    if (!editor || !workspaceSocket) {
        void 0;
        return;
    }

    const sendLiveCodeToAi = debounce((code) => {
        if (!isAiInterviewerActive || code.trim().length < 10) return;
        const lang = document.getElementById('languageSelect')?.value || 'javascript';
        const problemTitle = currentProblem ? currentProblem.title : "Free Workspace";
        workspaceSocket.emit('ai-evaluate-code', {
            code: code,
            language: lang,
            problem: problemTitle
        });
    }, 2500);

    editor.addEventListener('input', (e) => {
        if (isAiInterviewerActive) {
            sendLiveCodeToAi(e.target.value);
        }
    });

    workspaceSocket.on('ai-interviewer-feedback', (data) => {
        if (!data || !data.hint) return;
        const existing = document.getElementById('ai-hint-bubble');
        if (existing) existing.remove();

        const bubble = document.createElement('div');
        bubble.id = 'ai-hint-bubble';
        bubble.setAttribute('role', 'status');
        bubble.setAttribute('aria-live', 'polite');

        const hintText = document.createTextNode(data.hint);
        const hintSpan = document.createElement('span');
        hintSpan.appendChild(hintText);

        bubble.innerHTML = `
            <div class="ai-hint-header">
            <div class="ai-hint-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
                AI Interviewer
            </div>
            <button class="ai-hint-close" aria-label="Dismiss hint">&#x2715;</button>
            </div>
            <div class="ai-hint-body"></div>
            <div class="ai-hint-footer">
            <div class="ai-hint-pulse"></div>
            <span class="ai-hint-footer-text">Observing your code live</span>
            </div>
        `;

        bubble.querySelector('.ai-hint-body').appendChild(hintSpan);

        const target = document.querySelector('.quiz-modal-content') || document.getElementById('quizEditorModal') || document.body;
        if (target !== document.body) {
            target.style.position = 'relative';
        }
        target.appendChild(bubble);

        const closeBtn = bubble.querySelector('.ai-hint-close');
        closeBtn.addEventListener('click', () => {
            bubble.classList.add('ai-hint-dismissing');
            bubble.addEventListener('animationend', () => bubble.remove(), { once: true });
        });

        const autoDismiss = setTimeout(() => {
            if (document.getElementById('ai-hint-bubble')) {
                bubble.classList.add('ai-hint-dismissing');
                bubble.addEventListener('animationend', () => bubble.remove(), { once: true });
            }
        }, 18000);

        closeBtn.addEventListener('click', () => clearTimeout(autoDismiss), { once: true });
    });
}

function toggleAiInterviewer() {
    isAiInterviewerActive = !isAiInterviewerActive;
    const toggleBtn = document.getElementById('aiInterviewerToggle');
    if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', isAiInterviewerActive.toString());
    }
    if (isAiInterviewerActive) {
        if (!workspaceSocket && typeof io !== 'undefined') {
            workspaceSocket = io();
            initAiInterviewer();
        }
        if (typeof showNotification === 'function') showNotification("🤖 Agentic AI Interviewer is now observing your code.", "success");
    } else {
        if (typeof showNotification === 'function') showNotification("🤖 Agentic AI Interviewer deactivated.", "info");
        const existing = document.getElementById('ai-hint-bubble');
        if (existing) {
            existing.classList.add('ai-hint-dismissing');
            existing.addEventListener('animationend', () => existing.remove(), { once: true });
        }
    }
}

window.toggleAiInterviewer = toggleAiInterviewer;
window.isAiInterviewerActive = isAiInterviewerActive;

export { initAiInterviewer, toggleAiInterviewer };
