/**
 * main thread
 * ai-tutor.js
 * Handles the UI and communication with the background Web Worker.
 */
document.addEventListener("DOMContentLoaded", () => {
    initTutor();
});

const els = {
    aiStatusBadge: document.getElementById('aiStatusBadge'),
    modelLoader: document.getElementById('modelLoader'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    chatHistory: document.getElementById('chatHistory'),
    chatInput: document.getElementById('chatInput'),
    btnSend: document.getElementById('btnSend'),
    editorContainer: document.getElementById('editorContainer')
};

let editor;
let aiWorker;
let isModelReady = false;
let currentAiMessageBubble = null; // Stores the bubble currently being streamed to

function initTutor() {
    // 1. Initialize CodeMirror
    editor = CodeMirror(els.editorContainer, {
        lineNumbers: true,
        theme: 'material-darker',
        mode: 'javascript',
        value: `function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\n// Ask the AI to optimize this!`,
        indentUnit: 4
    });

    // 2. Initialize the Web Worker (IMPORTANT: Must be type: module to use Transformers.js)
    try {
        aiWorker = new Worker('ai-worker.js', { type: 'module' });
        setupWorkerListeners();
    } catch (e) {
        els.aiStatusBadge.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Worker Failed (CORS issue?)`;
        console.error("Worker Error: Are you running this on a local web server (like Live Server)? Modules don't work on file:// protocols.", e);
    }

    // 3. Bind UI
    els.btnSend.addEventListener('click', handleSend);
    els.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
}

function setupWorkerListeners() {
    aiWorker.addEventListener('message', (event) => {
        const { status, data, output, error } = event.data;

        switch (status) {
            case 'initiate':
                // Model is starting to download
                els.modelLoader.classList.remove('hidden');
                break;
            
            case 'progress':
                // Model downloading progress
                if (data.progress) {
                    els.progressBar.style.width = `${data.progress}%`;
                    els.progressText.textContent = `${Math.round(data.progress)}%`;
                }
                break;

            case 'ready':
                // Model is loaded into GPU/RAM
                isModelReady = true;
                els.modelLoader.classList.add('hidden');
                els.aiStatusBadge.className = 'ai-status ready';
                els.aiStatusBadge.innerHTML = `<i class="fas fa-check-circle"></i> AI Engine Ready`;
                els.btnSend.disabled = false;
                break;

            case 'update':
                // Streaming tokens
                if (currentAiMessageBubble) {
                    // Simple formatting for code ticks
                    const formattedText = output.replace(/`([^`]+)`/g, '<code>$1</code>');
                    currentAiMessageBubble.innerHTML = formattedText;
                    els.chatHistory.scrollTop = els.chatHistory.scrollHeight;
                }
                break;

            case 'complete':
                // Generation finished
                els.btnSend.disabled = false;
                els.chatInput.disabled = false;
                els.chatInput.focus();
                currentAiMessageBubble = null;
                break;

            case 'error':
                console.error("AI Error:", error);
                appendMessage("AI", "Sorry, an error occurred in the neural network engine.", "ai");
                els.btnSend.disabled = false;
                els.chatInput.disabled = false;
                break;
        }
    });
}

function handleSend() {
    const text = els.chatInput.value.trim();
    if (!text || !isModelReady) return;

    // Grab current code from editor for context
    const codeContext = editor.getValue();

    // 1. Add User Message to UI
    appendMessage("You", text, "user");
    els.chatInput.value = '';
    els.chatInput.disabled = true;
    els.btnSend.disabled = true;

    // 2. Create an empty bubble for the AI to stream into
    currentAiMessageBubble = appendMessage("AI", "...", "ai");

    // 3. Send data to background Worker
    aiWorker.postMessage({
        text: text,
        codeContext: codeContext
    });
}

// Helper to add chat bubbles to the DOM
function appendMessage(sender, text, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    
    const avatarIcon = type === 'user' ? 'fa-user' : 'fa-robot';
    
    msgDiv.innerHTML = `
        <div class="msg-avatar"><i class="fas ${avatarIcon}"></i></div>
        <div class="msg-bubble">${text}</div>
    `;
    
    els.chatHistory.appendChild(msgDiv);
    els.chatHistory.scrollTop = els.chatHistory.scrollHeight;
    
    return msgDiv.querySelector('.msg-bubble');
}
