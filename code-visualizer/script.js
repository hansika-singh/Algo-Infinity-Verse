// ====== CODE EXECUTOR ENGINE ======
class CodeExecutor {
    constructor(code) {
        this.code = code;
        this.lines = code.split('\n').map((line, i) => ({
            number: i + 1,
            text: line,
            trimmed: line.trim()
        }));
        this.variables = {};
        this.trace = [];
        this.output = [];
        this.currentLine = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.isFinished = false;
        this.originalConsoleLog = console.log;
        this.history = [{
            currentLine: 0,
            variables: {},
            output: [],
            trace: [],
            explanation: "Ready to start execution."
        }];
        this.playInterval = null;
        this.updateExplanationUI("Ready to start execution.");
    }

    // Step forward one line
    stepForward() {
        if (this.isFinished || this.currentLine >= this.lines.length) {
            this.isFinished = true;
            this.addTrace('⏹️ Execution complete!');
            this.updateStatus('Finished');
            this.updateExplanationUI("Execution complete! Click Reset to edit or run again.");
            if (this.playInterval) {
                clearInterval(this.playInterval);
                this.playInterval = null;
            }
            if (typeof updateControlsUI === 'function') updateControlsUI();
            return false;
        }

        const line = this.lines[this.currentLine];
        const trimmed = line.trimmed;

        // Skip empty lines
        if (!trimmed || trimmed.startsWith('//')) {
            this.addTrace(`⏭️ Skipped: "${trimmed || 'empty line'}"`);
            this.currentLine++;
            return this.stepForward();
        }

        this.addTrace(`▶️ Executing line ${line.number}: "${trimmed}"`);

        try {
            // Execute the line
            this.executeLine(trimmed);
            this.updateStatus(`Line ${line.number} executed`);
            this.currentLine++;
            this.highlightLine(this.currentLine);
            this.updateVariables();

            // Check if finished
            if (this.currentLine >= this.lines.length) {
                this.isFinished = true;
                this.addTrace('✅ Execution complete!');
                this.updateStatus('Finished');
            }

            // Generate step explanation
            const explanation = this.generateExplanation(trimmed);
            this.updateExplanationUI(explanation);

            // Record snapshot in history
            this.history.push({
                currentLine: this.currentLine,
                variables: JSON.parse(JSON.stringify(this.variables)),
                output: [...this.output],
                trace: [...this.trace],
                explanation: explanation
            });

            if (typeof updateControlsUI === 'function') updateControlsUI();
            return true;
        } catch (error) {
            this.addTrace(`❌ Error: ${error.message}`);
            this.updateStatus('Error');
            this.updateExplanationUI(`Runtime Error on line ${line.number}: ${error.message}`);
            this.isFinished = true;
            if (this.playInterval) {
                clearInterval(this.playInterval);
                this.playInterval = null;
            }
            if (typeof updateControlsUI === 'function') updateControlsUI();
            return false;
        }
    }

    // Step backward one line
    stepBackward() {
        if (this.history.length <= 1) {
            this.reset();
            return false;
        }

        // Pop the current step
        this.history.pop();

        // Restore state to previous step
        const prevState = this.history[this.history.length - 1];
        this.variables = JSON.parse(JSON.stringify(prevState.variables));
        this.output = [...prevState.output];
        this.trace = [...prevState.trace];
        this.currentLine = prevState.currentLine;
        this.isFinished = false;

        this.highlightLine(this.currentLine);
        this.updateVariables();
        updateTraceUI(this.trace);
        updateConsoleUI(this.output);
        this.updateExplanationUI(prevState.explanation);
        
        if (this.currentLine === 0) {
            this.updateStatus('Ready');
        } else {
            this.updateStatus(`Stepped back to Line ${this.currentLine}`);
        }

        if (typeof updateControlsUI === 'function') updateControlsUI();
        return true;
    }

    // Generate readable explanations of what code does at runtime
    generateExplanation(line) {
        if (line.startsWith('console.log(')) {
            const match = line.match(/console\.log\((.*)\)/);
            if (match) {
                const expr = match[1].trim();
                const evaluatedVal = this.output[this.output.length - 1];
                return `Line prints the expression <code>${expr}</code> to the console output.<br>Evaluated value printed: <strong style="color: var(--accent); font-family: monospace;">${evaluatedVal !== undefined ? evaluatedVal : 'undefined'}</strong>.`;
            }
            return "Executing <code>console.log</code> statement to output details.";
        }

        if (line.startsWith('let ')) {
            const parts = line.replace('let ', '').split('=');
            const varName = parts[0].trim();
            const value = this.variables[varName];
            const displayVal = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
            return `Declaring local variable <code>${varName}</code> and initializing it to <strong style="color: #22c55e; font-family: monospace;">${displayVal !== undefined ? displayVal : 'undefined'}</strong>.`;
        }

        // Handle simple variable assignments
        const assignmentMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)/);
        if (assignmentMatch) {
            const varName = assignmentMatch[1];
            const value = this.variables[varName];
            const displayVal = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
            return `Updating variable <code>${varName}</code> to <strong style="color: #22c55e; font-family: monospace;">${displayVal !== undefined ? displayVal : 'undefined'}</strong>.`;
        }

        return `Executing line: <code style="color: #cbd5e1; font-family: monospace;">${line}</code>.`;
    }

    // Update explanation panel
    updateExplanationUI(text) {
        const container = document.getElementById('explanationContainer');
        if (container) {
            container.innerHTML = `<div class="explanation-step-text" style="line-height: 1.6; font-size: 0.95rem;">${text}</div>`;
        }
    }

    // Execute a single line
    executeLine(line) {
        // Handle console.log
        if (line.startsWith('console.log(')) {
            const match = line.match(/console\.log\((.*)\)/);
            if (match) {
                const args = match[1].split(',').map(arg => {
                    const trimmedArg = arg.trim();
                    // Check if it's a variable
                    if (this.variables[trimmedArg] !== undefined) {
                        return this.variables[trimmedArg];
                    }
                    // Check if it's a string
                    if (trimmedArg.startsWith('"') || trimmedArg.startsWith("'")) {
                        return trimmedArg.slice(1, -1);
                    }
                    // Check if it's a number
                    if (!isNaN(trimmedArg)) {
                        return Number(trimmedArg);
                    }
                    return trimmedArg;
                });
                const output = args.join(' ');
                this.output.push(output);
                this.addTrace(`📤 Output: ${output}`);
                // Also show in console
                console.log(output);
                return;
            }
        }

        // Handle variable declaration with let
        if (line.startsWith('let ')) {
            const parts = line.replace('let ', '').split('=');
            const varName = parts[0].trim();
            let value = parts.length > 1 ? parts[1].trim() : undefined;
            
            if (value !== undefined) {
                // Check if value is a number
                if (!isNaN(value)) {
                    value = Number(value);
                }
                // Check if value is another variable
                else if (this.variables[value] !== undefined) {
                    value = this.variables[value];
                }
            }
            
            this.variables[varName] = value;
            this.addTrace(`📦 ${varName} = ${value !== undefined ? value : 'undefined'}`);
            return;
        }

        // Handle variable assignment (no let)
        const assignmentMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)/);
        if (assignmentMatch) {
            const varName = assignmentMatch[1];
            let value = assignmentMatch[2].trim();
            
            // Check if value is a number
            if (!isNaN(value)) {
                value = Number(value);
            }
            // Check if value is another variable
            else if (this.variables[value] !== undefined) {
                value = this.variables[value];
            }
            
            this.variables[varName] = value;
            this.addTrace(`📦 ${varName} = ${value}`);
            return;
        }

        // Handle simple expressions (e.g., x + y)
        const exprMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\+\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (exprMatch) {
            const varName = exprMatch[1];
            const left = exprMatch[2];
            const right = exprMatch[3];
            
            if (this.variables[left] !== undefined && this.variables[right] !== undefined) {
                this.variables[varName] = this.variables[left] + this.variables[right];
                this.addTrace(`📦 ${varName} = ${this.variables[left]} + ${this.variables[right]} = ${this.variables[varName]}`);
                return;
            }
        }

        // If we get here, we don't know how to execute the line
        this.addTrace(`⚠️ Unknown command: "${line}"`);
    }

    // Add to trace
    addTrace(message) {
        this.trace.push({
            line: this.currentLine + 1,
            message: message,
            time: new Date().toISOString()
        });
        updateTraceUI(this.trace);
    }

    // Update status
    updateStatus(status) {
        const el = document.getElementById('statusText');
        if (el) el.textContent = `⏹️ ${status}`;
    }

    // Highlight current line
    highlightLine(lineNumber) {
        const highlightLineEl = document.getElementById('highlightLine');
        if (!highlightLineEl) return;
        if (lineNumber <= 0) {
            highlightLineEl.style.display = 'none';
            return;
        }
        const lineHeight = 1.6 * 16; // ~25.6px
        const top = (lineNumber - 1) * lineHeight;
        highlightLineEl.style.top = `${top}px`;
        highlightLineEl.style.display = 'block';
        
        const lineStatusEl = document.getElementById('lineStatus');
        if (lineStatusEl) lineStatusEl.textContent = `Line: ${lineNumber}`;
    }

    // Update variables UI
    updateVariables() {
        updateVariablesUI(this.variables);
    }

    // Run all code
    runAll() {
        this.reset();
        this.isRunning = true;
        this.updateStatus('Running...');
        while (!this.isFinished && this.currentLine < this.lines.length) {
            const result = this.stepForward();
            if (!result) break;
        }
        this.isRunning = false;
    }

    // Reset everything
    reset() {
        this.variables = {};
        this.trace = [];
        this.output = [];
        this.currentLine = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.isFinished = false;
        this.highlightLine(0);
        this.updateVariables();
        this.history = [{
            currentLine: 0,
            variables: {},
            output: [],
            trace: [],
            explanation: "Ready to start execution."
        }];
        this.updateExplanationUI("Ready to start execution.");
        updateTraceUI([]);
        updateConsoleUI([]);
        this.updateStatus('Ready');
        console.log = this.originalConsoleLog;
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
        if (typeof updateControlsUI === 'function') updateControlsUI();
    }

    // Get the code lines
    getLines() {
        return this.lines;
    }
}

// ====== UI UPDATE FUNCTIONS ======

// Update variables UI
function updateVariablesUI(variables) {
    const container = document.getElementById('variablesContainer');
    const keys = Object.keys(variables);
    
    if (keys.length === 0) {
        container.innerHTML = '<div class="empty-state">No variables yet. Run some code!</div>';
        return;
    }

    let html = '';
    for (const key of keys) {
        const value = variables[key];
        const displayValue = typeof value === 'string' ? `"${value}"` : value;
        html += `
            <div class="variable-item">
                <span class="variable-name">${key}</span>
                <span class="variable-value">${displayValue !== undefined ? displayValue : 'undefined'}</span>
            </div>
        `;
    }
    container.innerHTML = html;
}

// Update trace UI
function updateTraceUI(trace) {
    const container = document.getElementById('traceContainer');
    
    if (trace.length === 0) {
        container.innerHTML = '<div class="empty-state">Trace will appear here...</div>';
        return;
    }

    let html = '';
    for (const item of trace) {
        const isError = item.message.includes('❌') || item.message.includes('Error');
        const isActive = item.message.includes('▶️');
        html += `
            <div class="trace-item ${isActive ? 'active' : ''}" style="${isError ? 'color: #ef4444;' : ''}">
                ${item.message}
            </div>
        `;
    }
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

// Update console UI
function updateConsoleUI(output) {
    const container = document.getElementById('outputConsole');
    
    if (output.length === 0) {
        container.innerHTML = '<div class="empty-state">Output will appear here...</div>';
        return;
    }

    let html = '';
    for (const line of output) {
        html += `<div class="log-line">> ${line}</div>`;
    }
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

// ====== SETUP EXECUTOR ======

let executor = null;

// Get code from editor
function getCodeFromEditor() {
    return document.getElementById('codeEditor').value;
}

// Initialize executor
function initExecutor() {
    try {
        const code = getCodeFromEditor();

        executor = new CodeExecutor(code);
        executor.highlightLine(0);

        return executor;
    } catch (error) {
        console.error(error);

        executor = null;

        updateConsoleUI([
            "Failed to initialize executor.",
            error.message,
        ]);

        updateTraceUI([
            {
                line: 0,
                message: `❌ ${error.message}`,
                time: new Date().toISOString(),
            },
        ]);

        const status = document.getElementById("statusText");
        if (status) {
            status.textContent = "❌ Executor initialization failed";
        }

        return null;
    }
}

// ====== BUTTON HANDLERS ======

function updateControlsUI() {
    const prevBtn = document.getElementById('prevBtn');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stepBtn = document.getElementById('stepBtn');
    const runBtn = document.getElementById('runBtn');

    if (!executor) {
        if (prevBtn) prevBtn.disabled = true;
        if (playBtn) playBtn.disabled = false;
        if (playBtn) playBtn.style.display = 'inline-block';
        if (pauseBtn) pauseBtn.style.display = 'none';
        return;
    }

    if (prevBtn) {
        prevBtn.disabled = executor.history.length <= 1;
    }

    if (executor.playInterval) {
        if (playBtn) playBtn.style.display = 'none';
        if (pauseBtn) pauseBtn.style.display = 'inline-block';
        if (stepBtn) stepBtn.disabled = true;
        if (runBtn) runBtn.disabled = true;
    } else {
        if (playBtn) playBtn.style.display = 'inline-block';
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (stepBtn) stepBtn.disabled = executor.isFinished;
        if (runBtn) runBtn.disabled = executor.isFinished;
    }
}

// Run
document.getElementById('runBtn').addEventListener('click', () => {
    if (!executor) {
        executor = initExecutor();
    }

    if (!executor) return;

    try {
        executor.runAll();
        updateConsoleUI(executor.output);
        updateVariablesUI(executor.variables);
    } catch (error) {
        console.error(error);

        updateConsoleUI([
            "Execution failed.",
            error.message,
        ]);

        updateTraceUI([
            {
                line: executor?.currentLine ?? 0,
                message: `❌ ${error.message}`,
                time: new Date().toISOString(),
            },
        ]);
    }
});

// Step
document.getElementById('stepBtn').addEventListener('click', () => {
    if (!executor) {
        executor = initExecutor();
    }

    if (!executor) return;

    try {
        executor.stepForward();
        updateConsoleUI(executor.output);
        updateVariablesUI(executor.variables);
    } catch (error) {
        console.error(error);

        updateConsoleUI([
            "Execution failed.",
            error.message,
        ]);

        updateTraceUI([
            {
                line: executor?.currentLine ?? 0,
                message: `❌ ${error.message}`,
                time: new Date().toISOString(),
            },
        ]);
    }
});

// Prev Step
document.getElementById('prevBtn').addEventListener('click', () => {
    if (!executor) return;
    try {
        executor.stepBackward();
    } catch (error) {
        console.error(error);
    }
});

// Play
document.getElementById('playBtn').addEventListener('click', () => {
    if (!executor) {
        executor = initExecutor();
    }
    if (!executor) return;

    if (executor.playInterval) return;

    executor.playInterval = setInterval(() => {
        if (executor.isFinished) {
            clearInterval(executor.playInterval);
            executor.playInterval = null;
            updateControlsUI();
            return;
        }
        executor.stepForward();
        updateConsoleUI(executor.output);
        updateVariablesUI(executor.variables);
    }, 1000); // Step every 1000ms

    updateControlsUI();
});

// Pause
document.getElementById('pauseBtn').addEventListener('click', () => {
    if (!executor || !executor.playInterval) return;
    clearInterval(executor.playInterval);
    executor.playInterval = null;
    updateControlsUI();
});

// Reset
document.getElementById('resetBtn').addEventListener('click', () => {
    if (!executor) {
        executor = initExecutor();
    }

    if (!executor) return;

    try {
        executor.reset();
        updateConsoleUI([]);
        updateVariablesUI({});
    } catch (error) {
        console.error(error);

        updateConsoleUI([
            "Reset failed.",
            error.message,
        ]);
    }
});

// ====== DARK MODE TOGGLE ======
// Add dark mode toggle to navbar if you want
// Simple keyboard shortcut: press 'd' to toggle
document.addEventListener('keydown', (e) => {
    if (e.key === 'd' && e.ctrlKey) {
        document.body.classList.toggle('dark-mode');
    }
});

// ====== INITIAL SETUP ======
document.addEventListener('DOMContentLoaded', () => {
    // Set default code
    const editor = document.getElementById('codeEditor');
    editor.value = defaultCode;
    updateLineNumbers();
    
    // Initialize executor
    executor = initExecutor();

    if (!executor) {
        return;
    }
    
    // Show initial state
    updateVariablesUI({});
    updateTraceUI([]);
    updateConsoleUI([]);
});

// ====== UPDATE LINE NUMBERS (from editor.js) ======
function updateLineNumbers() {
    const lines = document.getElementById('codeEditor').value.split('\n');
    const count = lines.length;
    let html = '';
    for (let i = 1; i <= count; i++) {
        html += `<span>${i}</span>`;
    }
    document.getElementById('lineNumbers').innerHTML = html;
}

// Re-initialize when code changes
document.getElementById('codeEditor').addEventListener('input', () => {
    if (executor) {
        try {
            executor.reset();
        } catch (error) {
            console.error(error);

            updateConsoleUI([
                "Reset failed.",
                error.message,
            ]);
        }
    }

    executor = initExecutor();

    if (!executor) return;

    updateVariablesUI({});
    updateTraceUI([]);
    updateConsoleUI([]);

    updateVariablesUI({});
    updateTraceUI([]);
    updateConsoleUI([]);
});

window.addEventListener("resize", () => {
  if (typeof updateLineNumbers === 'function') updateLineNumbers();
});

/**
 * Generates and downloads a stylized PDF certificate client-side.
 * @param {string} userName - Name printed on the certificate
 * @param {string} topicName - Completed learning track roadmap
 * @param {string} date - Date of completion
 * @param {string} certId - Unique verifiable hash/ID
 */
function downloadCertificatePDF(userName, topicName, date, certId) {
  // Access the bundled library from window scope
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [842, 595] // Standard A4 Landscape dimension
  });

  // --- 1. Draw Aesthetic Certificate Background/Borders ---
  doc.setFillColor(253, 253, 251); // Off-white ivory background
  doc.rect(0, 0, 842, 595, 'F');

  // Decorative elegant double borders
  doc.setDrawColor(118, 75, 162); // Purple primary theme accent
  doc.setLineWidth(8);
  doc.rect(20, 20, 802, 555);
  
  doc.setDrawColor(102, 126, 234); // Indigo secondary inner border
  doc.setLineWidth(2);
  doc.rect(32, 32, 778, 531);

  // --- 2. Typography & Header Section ---
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(118, 75, 162);
  doc.text("CERTIFICATE OF COMPLETION", 421, 110, { align: "center" });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(16);
  doc.setTextColor(102, 102, 102);
  doc.text("THIS IS PROUDLY PRESENTED TO", 421, 170, { align: "center" });

  // --- 3. Dynamic User Name ---
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(34, 34, 34);
  doc.text(userName, 421, 225, { align: "center" });

  // Elegant decorative line below name
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(1);
  doc.line(250, 245, 592, 245);

  // --- 4. Topic Completion Statement ---
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(16);
  doc.setTextColor(102, 102, 102);
  doc.text("for successfully mastering and completing the structured learning track on", 421, 285, { align: "center" });

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(118, 75, 162);
  doc.text(topicName, 421, 330, { align: "center" });

  // --- 5. Footer Analytics (Date, Signatures, IDs) ---
  // Date Field
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(102, 102, 102);
  doc.text(`Date of Completion: ${date}`, 100, 460);

  // Verification Hash Stamp
  doc.setFont("Courier", "normal");
  doc.setFontSize(10);
  doc.setTextColor(153, 153, 153);
  doc.text(`Certificate ID: ${certId}`, 100, 480);

  // Decorative Digital Board Seal/Signature Placeholder
  doc.setDrawColor(118, 75, 162);
  doc.line(600, 460, 720, 460);
  doc.setFont("Helvetica", "italic");
  doc.setFontSize(12);
  doc.setTextColor(51, 51, 51);
  doc.text("Authorized Platform Board", 660, 475, { align: "center" });

  // Trigger browser download workflow natively
  doc.save(`Certificate-${topicName.replace(/\s+/g, '-')}.pdf`);
}

/**
 * Validates requirements and lists cert items on user history panel
 */
function renderCertificatesDashboard(tracks) {
  const certListContainer = document.getElementById('certificates-list');
  if (!certListContainer) return;
  
  certListContainer.innerHTML = ''; // clear out loading tags

  tracks.forEach(track => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.padding = '12px 15px';
    li.style.marginBottom = '10px';
    li.style.background = '#fafafa';
    li.style.border = '1px solid #f0f0f0';
    li.style.borderRadius = '6px';

    // Verification check markup layout
    const infoDiv = document.createElement('div');
    infoDiv.innerHTML = `
      <strong style="color:#333; font-size:15px;">${track.topicName} Roadmap</strong>
      <div style="font-size:12px; color:#888; margin-top:2px;">
        Completed: ${track.completionDate} | Status: <span style="color:#16a34a; font-weight:600;">✓ Verified</span>
      </div>
    `;

    const downloadBtn = document.createElement('button');
    downloadBtn.innerText = 'Download PDF';
    downloadBtn.style.padding = '6px 12px';
    downloadBtn.style.background = '#667eea';
    downloadBtn.style.color = '#fff';
    downloadBtn.style.border = 'none';
    downloadBtn.style.borderRadius = '4px';
    downloadBtn.style.cursor = 'pointer';
    downloadBtn.style.fontSize = '12px';
    downloadBtn.style.fontWeight = '600';

    // Hook click action to client-side canvas renderer
    downloadBtn.addEventListener('click', () => {
      // Real-time verification safety wrapper
      if (track.isCompleted) {
        // Automatically uses structural records cleanly 
        downloadCertificatePDF("Prasiddhi Mishra", track.topicName, track.completionDate, track.certificateId);
      } else {
        alert("This roadmap track is not fully completed yet.");
      }
    });

    li.appendChild(infoDiv);
    li.appendChild(downloadBtn);
    certListContainer.appendChild(li);
  });
}

// Mock completion database list for roadmaps
const mockUserCompletedRoadmaps = [
  { topicName: "Data Structures & Algorithms", isCompleted: true, completionDate: "2026-05-14", certificateId: "CERT-DSA-9941X" },
  { topicName: "System Design Foundation", isCompleted: true, completionDate: "2026-06-20", certificateId: "CERT-SYS-2180Z" }
];

// Execute layout setup on dashboard load hook
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('certificates-dashboard')) {
    renderCertificatesDashboard(mockUserCompletedRoadmaps);
  }
});

// Function to update user interface metrics for Interview Readiness
function renderReadinessDashboard(data) {
  // Update numbers
  document.getElementById('overall-score-badge').innerText = `${data.overallPercentage}%`;
  document.getElementById('dsa-score').innerText = `${data.breakdown.dsa}%`;
  document.getElementById('design-score').innerText = `${data.breakdown.systemDesign}%`;
  document.getElementById('quiz-score').innerText = `${data.breakdown.interview}%`;

  // Render Suggestions
  const suggestionsList = document.getElementById('suggestions-list');
  suggestionsList.innerHTML = ''; // clear out loading placeholder
  data.suggestions.forEach(tip => {
    const li = document.createElement('li');
    li.style.fontSize = '14px';
    li.style.color = '#444';
    li.style.marginBottom = '8px';
    li.innerHTML = `💡 ${tip}`;
    suggestionsList.appendChild(li);
  });

  // Render Missing Topics
  const tagsContainer = document.getElementById('missing-topics-tags');
  tagsContainer.innerHTML = '';
  data.missingTopics.forEach(topic => {
    const span = document.createElement('span');
    span.className = 'topic-tag';
    span.innerText = `⚠️ ${topic}`;
    tagsContainer.appendChild(span);
  });
}

// Mocking data simulation (or replace URL with real backend fetch call if running)
const dummyDataReport = {
  overallPercentage: 74,
  breakdown: { dsa: 80, systemDesign: 50, interview: 85 },
  missingTopics: ['Microservices', 'System Design Basics', 'Graphs'],
  suggestions: [
    "Take more mock quizzes to boost your quick recall.",
    "Focus on learning missing foundational topics: Microservices.",
    "Try solving at least 2 DSA problems daily to hit your target."
  ]
};

// Auto-run dashboard on load 
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('readiness-dashboard')) {
     renderReadinessDashboard(dummyDataReport);
  }
});

/**
 * Saves the current page's bookmark details to browser local storage.
 * Call this function whenever a user opens/navigates to a learning resource page or visualizer.
 * @param {string} title - The title of the module or topic
 * @param {string} category - e.g., 'DSA', 'System Design', 'Interview Prep'
 * @param {string} relativeUrl - The file path or query string to load upon click
 */
function trackUserProgress(title, category, relativeUrl) {
  const progressMetadata = {
    title,
    category,
    relativeUrl,
    timestamp: new Date().toLocaleString()
  };
  localStorage.setItem('last_visited_learning_page', JSON.stringify(progressMetadata));
}

/**
 * Checks local storage for previous progress and loads the resume widget if data exists.
 */
function initResumeWidget() {
  const widget = document.getElementById('resume-learning-widget');
  const titleElem = document.getElementById('resume-page-title');
  const categoryElem = document.getElementById('resume-page-category');
  const timeElem = document.getElementById('resume-page-time');
  const resumeBtn = document.getElementById('resume-learning-btn');

  if (!widget) return;

  const savedData = localStorage.getItem('last_visited_learning_page');

  if (savedData) {
    const progress = JSON.parse(savedData);

    // Update UI elements with retrieved metadata
    titleElem.innerText = progress.title;
    categoryElem.innerText = progress.category;
    timeElem.innerText = progress.timestamp;

    // Display widget card reactively
    widget.style.display = 'block';

    // Hook up click functionality to redirect user
    resumeBtn.onclick = () => {
      window.location.href = progress.relativeUrl;
    };
  } else {
    widget.style.display = 'none';
  }
}

// Simulated Tracker Event: Let's log a baseline entry if no history exists for demonstration purposes
document.addEventListener('DOMContentLoaded', () => {
  // If the user is checking out the dashboard for the first time, mock an active track
  if (!localStorage.getItem('last_visited_learning_page')) {
    trackUserProgress("Graph Traversals (BFS & DFS)", "Data Structures & Algorithms", "#graph-visualizer");
  }

  // Initialize and check layout visibility rules
  initResumeWidget();
});

