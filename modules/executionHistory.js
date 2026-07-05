const API = "/api";

export class ExecutionHistory {
  constructor(containerEl) {
    this.container = containerEl;
    this.executions = [];
    this.filtered = [];
    this.state = "list";
    this.currentExecution = null;
    this.currentStep = -1;
    this.snapshots = [];
    this.currentCodeLines = [];

    this.render();
  }

  async render() {
    this.container.innerHTML = `
      <div class="exec-filters">
        <select id="execFilterLang" class="exec-filter-select" aria-label="Filter by language">
          <option value="">All Languages</option>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>
        <input type="date" id="execFilterFrom" class="exec-filter-date" aria-label="From date" />
        <input type="date" id="execFilterTo" class="exec-filter-date" aria-label="To date" />
        <button id="execFilterBtn" class="exec-btn exec-btn-sm" aria-label="Filter">
          <i class="fas fa-filter"></i> Filter
        </button>
        <button id="execClearFilterBtn" class="exec-btn exec-btn-sm exec-btn-ghost" aria-label="Clear filters">
          Clear
        </button>
      </div>
      <div id="execListView" class="exec-list-view"></div>
      <div id="execReplayView" class="exec-replay-view" style="display:none"></div>
    `;

    this.listView = this.container.querySelector("#execListView");
    this.replayView = this.container.querySelector("#execReplayView");

    this.container.querySelector("#execFilterBtn").addEventListener("click", () => this.applyFilters());
    this.container.querySelector("#execClearFilterBtn").addEventListener("click", () => this.clearFilters());

    await this.fetchExecutions();
  }

  async fetchExecutions() {
    this.listView.innerHTML = `<div class="exec-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
    try {
      const res = await fetch(`${API}/executions`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.executions = data.executions || [];
      this.filtered = [...this.executions];
      this.renderList();
    } catch (err) {
      this.listView.innerHTML = `<div class="exec-empty">Failed to load execution history. ${err.message}</div>`;
    }
  }

  applyFilters() {
    const lang = this.container.querySelector("#execFilterLang").value;
    const from = this.container.querySelector("#execFilterFrom").value;
    const to = this.container.querySelector("#execFilterTo").value;

    this.filtered = this.executions.filter((e) => {
      if (lang && e.language?.toLowerCase() !== lang.toLowerCase()) return false;
      if (from && new Date(e.createdAt) < new Date(from)) return false;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        if (new Date(e.createdAt) > end) return false;
      }
      return true;
    });
    this.renderList();
  }

  clearFilters() {
    this.container.querySelector("#execFilterLang").value = "";
    this.container.querySelector("#execFilterFrom").value = "";
    this.container.querySelector("#execFilterTo").value = "";
    this.filtered = [...this.executions];
    this.renderList();
  }

  renderList() {
    if (this.filtered.length === 0) {
      this.listView.innerHTML = `<div class="exec-empty"><i class="fas fa-inbox"></i> No execution records found.</div>`;
      return;
    }

    const total = this.executions.length;
    this.listView.innerHTML = `
      <div class="exec-count">Showing ${this.filtered.length} of ${total} execution${total !== 1 ? "s" : ""}</div>
      <div class="exec-cards">${this.filtered.map((e) => this.cardHTML(e)).join("")}</div>
    `;

    this.listView.querySelectorAll(".exec-card").forEach((card) => {
      const id = card.dataset.id;
      card.addEventListener("click", () => this.openReplay(id));
    });
  }

  cardHTML(e) {
    const status = e.error ? "error" : e.exitCode === 0 ? "success" : "error";
    const date = new Date(e.createdAt).toLocaleString();
    const langIcon = this.langIcon(e.language);
    const hasSnapshots = e.hasSnapshots;

    return `
      <div class="exec-card" data-id="${e.id}" tabindex="0" role="button" aria-label="Open execution ${e.id}">
        <div class="exec-card-header">
          <span class="exec-card-lang">${langIcon} ${e.language || "unknown"}</span>
          <span class="exec-card-status exec-status-${status}">${status}</span>
        </div>
        <div class="exec-card-body">
          <pre class="exec-card-preview"><code>${this.escapeHtml(e.preview || "")}</code></pre>
        </div>
        <div class="exec-card-footer">
          <span class="exec-card-date"><i class="far fa-clock"></i> ${date}</span>
          ${e.cpuTime ? `<span class="exec-card-cpu"><i class="fas fa-microchip"></i> ${e.cpuTime}s</span>` : ""}
          ${hasSnapshots ? `<span class="exec-card-trace"><i class="fas fa-list"></i> Trace</span>` : ""}
        </div>
      </div>
    `;
  }

  async openReplay(execId) {
    this.listView.style.display = "none";
    this.replayView.style.display = "block";
    this.replayView.innerHTML = `<div class="exec-loading"><i class="fas fa-spinner fa-spin"></i> Loading execution...</div>`;

    try {
      const res = await fetch(`${API}/executions/${execId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.currentExecution = data.execution;
      this.currentStep = -1;
      this.snapshots = this.currentExecution.variableSnapshots || [];
      this.currentCodeLines = (this.currentExecution.originalCode || this.stripHarness(this.currentExecution.sourceCode) || this.currentExecution.sourceCode || "").split("\n");
      this.renderReplay();
    } catch (err) {
      this.replayView.innerHTML = `
        <div class="exec-empty">
          <p>Failed to load execution.</p>
          <button class="exec-btn" onclick="document.querySelector('#execListView').style.display='block'; document.querySelector('#execReplayView').style.display='none'">
            <i class="fas fa-arrow-left"></i> Back
          </button>
        </div>`;
    }
  }

  renderReplay() {
    const exec = this.currentExecution;
    const date = new Date(exec.createdAt).toLocaleString();
    const langIcon = this.langIcon(exec.language);
    const hasSnapshots = this.snapshots.length > 0;
    const canTrace = exec.language?.toLowerCase() === "javascript";

    this.replayView.innerHTML = `
      <div class="exec-replay-layout">
        <div class="exec-replay-toolbar">
          <button id="replayBackBtn" class="exec-btn exec-btn-ghost">
            <i class="fas fa-arrow-left"></i> Back
          </button>
          <span class="exec-replay-title">${langIcon} ${exec.language} — ${date}</span>
          <div class="exec-replay-stats">
            ${exec.cpuTime ? `<span><i class="fas fa-microchip"></i> ${exec.cpuTime}s</span>` : ""}
            ${exec.memory ? `<span><i class="fas fa-memory"></i> ${exec.memory}</span>` : ""}
          </div>
        </div>

        <div class="exec-replay-main">
          <div class="exec-replay-code-panel">
            <div class="exec-replay-panel-header">
              <span><i class="fas fa-code"></i> Source Code</span>
              ${canTrace ? `<span class="exec-trace-badge ${hasSnapshots ? 'has-trace' : ''}">
                <i class="fas fa-list"></i> ${hasSnapshots ? `${this.snapshots.length} snapshots` : 'No trace'}
              </span>` : ""}
            </div>
            <div class="exec-code-display" id="execCodeDisplay">
              <table class="exec-code-table">
                <tbody>${this.currentCodeLines.map((line, i) => `
                  <tr class="exec-code-line" data-line="${i + 1}" id="codeline-${i + 1}">
                    <td class="exec-line-num">${i + 1}</td>
                    <td class="exec-line-code"><pre><code>${this.escapeHtml(line || " ")}</code></pre></td>
                  </tr>`).join("")}
                </tbody>
              </table>
            </div>
            <div class="exec-replay-controls">
              <button id="replayStepStart" class="exec-btn exec-btn-sm" title="Go to start">
                <i class="fas fa-step-backward"></i>
              </button>
              <button id="replayStepPrev" class="exec-btn exec-btn-sm" title="Previous step">
                <i class="fas fa-chevron-left"></i>
              </button>
              <span id="replayStepCounter">Step 0 / ${hasSnapshots ? this.snapshots.length : this.currentCodeLines.length}</span>
              <button id="replayStepNext" class="exec-btn exec-btn-sm exec-btn-primary" title="Next step">
                <i class="fas fa-chevron-right"></i>
              </button>
              <button id="replayStepEnd" class="exec-btn exec-btn-sm" title="Go to end">
                <i class="fas fa-step-forward"></i>
              </button>
            </div>
          </div>

          <div class="exec-replay-sidebar">
            <div class="exec-replay-panel-header">
              <span><i class="fas fa-chart-simple"></i> Variables</span>
            </div>
            <div id="execVarsPanel" class="exec-vars-panel">
              <div class="exec-vars-empty">Press <strong>Step</strong> to inspect variable state.</div>
            </div>
            <div class="exec-replay-panel-header" style="margin-top:12px">
              <span><i class="fas fa-terminal"></i> Output</span>
            </div>
            <div id="execOutputPanel" class="exec-output-panel">
              <pre><code>${this.escapeHtml(exec.stdout || "(no output)")}</code></pre>
              ${exec.stderr ? `<pre class="exec-stderr"><code>${this.escapeHtml(exec.stderr)}</code></pre>` : ""}
              ${exec.error ? `<pre class="exec-stderr"><code>Error: ${this.escapeHtml(exec.error)}</code></pre>` : ""}
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector("#replayBackBtn").addEventListener("click", () => this.closeReplay());
    this.container.querySelector("#replayStepStart").addEventListener("click", () => this.goToStep(-1));
    this.container.querySelector("#replayStepPrev").addEventListener("click", () => this.prevStep());
    this.container.querySelector("#replayStepNext").addEventListener("click", () => this.nextStep());
    this.container.querySelector("#replayStepEnd").addEventListener("click", () => this.goToStep(hasSnapshots ? this.snapshots.length : this.currentCodeLines.length));
  }

  nextStep() {
    const max = this.snapshots.length > 0 ? this.snapshots.length - 1 : this.currentCodeLines.length - 1;
    if (this.currentStep < max) {
      this.goToStep(this.currentStep + 1);
    }
  }

  prevStep() {
    if (this.currentStep > -1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  goToStep(step) {
    this.currentStep = step;
    this.highlightCodeLine(step);
    this.renderVariables(step);
    this.updateStepCounter(step);
  }

  highlightCodeLine(step) {
    this.container.querySelectorAll(".exec-code-line").forEach((el) => {
      el.classList.remove("exec-line-active", "exec-line-executed");
    });

    if (step < 0) return;

    let targetLine = -1;
    if (this.snapshots.length > 0 && step < this.snapshots.length) {
      targetLine = this.snapshots[step].line;
    } else {
      targetLine = Math.min(step, this.currentCodeLines.length - 1) + 1;
    }

    const el = this.container.querySelector(`#codeline-${targetLine}`);
    if (el) {
      el.classList.add("exec-line-active");
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    for (let i = 1; i <= step && i <= this.currentCodeLines.length && this.snapshots.length === 0; i++) {
      const prev = this.container.querySelector(`#codeline-${i}`);
      if (prev) prev.classList.add("exec-line-executed");
    }

    if (this.snapshots.length > 0) {
      for (let s = 0; s <= step && s < this.snapshots.length; s++) {
        const sl = this.snapshots[s].line;
        const prev = this.container.querySelector(`#codeline-${sl}`);
        if (prev && sl !== targetLine) prev.classList.add("exec-line-executed");
      }
    }
  }

  renderVariables(step) {
    const panel = this.container.querySelector("#execVarsPanel");
    if (!panel) return;

    if (step < 0 || this.snapshots.length === 0) {
      panel.innerHTML = `<div class="exec-vars-empty">Press <strong>Step</strong> to inspect variable state.</div>`;
      return;
    }

    if (step >= this.snapshots.length) {
      step = this.snapshots.length - 1;
    }

    const snap = this.snapshots[step];
    if (!snap || !snap.vars || Object.keys(snap.vars).length === 0) {
      panel.innerHTML = `<div class="exec-vars-empty">No variables tracked at this step.</div>`;
      return;
    }

    const vars = snap.vars;
    const entries = Object.entries(vars).filter(([, v]) => v !== undefined);

    panel.innerHTML = `
      <div class="exec-vars-step">Line ${snap.line} — Step ${step + 1} of ${this.snapshots.length}</div>
      <div class="exec-vars-list">${entries.map(([name, value]) => `
        <div class="exec-var-item">
          <span class="exec-var-name">${this.escapeHtml(name)}</span>
          <span class="exec-var-eq">=</span>
          <span class="exec-var-value">${this.formatValue(value)}</span>
        </div>`).join("")}
      </div>`;
  }

  updateStepCounter(step) {
    const el = this.container.querySelector("#replayStepCounter");
    if (!el) return;
    const total = this.snapshots.length > 0 ? this.snapshots.length : this.currentCodeLines.length;
    el.textContent = `Step ${Math.max(0, step) + 1} / ${total}`;
  }

  stripHarness(code) {
    if (!code) return "";
    const markers = [
      "const __TC__",
      "__TC__ = json.loads",
      'cout << "__RESULT__',
      'printf("__RESULT__',
      'System.out.print("__RESULT__',
      'print("__RESULT__',
    ];
    const lines = code.split("\n");
    let cutAt = lines.length;
    for (const marker of markers) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(marker)) {
          cutAt = Math.min(cutAt, i);
          break;
        }
      }
    }
    return cutAt < lines.length ? lines.slice(0, cutAt).join("\n") : code;
  }

  closeReplay() {
    this.state = "list";
    this.currentExecution = null;
    this.currentStep = -1;
    this.snapshots = [];
    this.listView.style.display = "block";
    this.replayView.style.display = "none";
  }

  formatValue(val) {
    if (val === null) return `<span class="exec-val-null">null</span>`;
    if (val === undefined) return `<span class="exec-val-undefined">undefined</span>`;
    if (typeof val === "boolean") return `<span class="exec-val-bool">${val}</span>`;
    if (typeof val === "number") return `<span class="exec-val-number">${val}</span>`;
    if (typeof val === "string") {
      if (val.length > 80) return `<span class="exec-val-string">"${this.escapeHtml(val.slice(0, 80))}…"</span>`;
      return `<span class="exec-val-string">"${this.escapeHtml(val)}"</span>`;
    }
    if (Array.isArray(val)) {
      if (val.length > 10) return `[${val.slice(0, 10).map((v) => this.formatValueShort(v)).join(", ")}, …] (${val.length} items)`;
      return `[${val.map((v) => this.formatValueShort(v)).join(", ")}]`;
    }
    if (typeof val === "object") {
      try {
        return this.escapeHtml(JSON.stringify(val, null, 1));
      } catch {
        return `[Object]`;
      }
    }
    return this.escapeHtml(String(val));
  }

  formatValueShort(val) {
    if (val === null) return "null";
    if (typeof val === "string") return `"${val.slice(0, 20)}"`;
    if (typeof val === "number") return String(val);
    if (Array.isArray(val)) return `[${val.length}]`;
    return typeof val;
  }

  langIcon(lang) {
    const icons = {
      javascript: '<i class="fab fa-js" style="color:#f7df1e"></i>',
      python: '<i class="fab fa-python" style="color:#3776AB"></i>',
      java: '<i class="fab fa-java" style="color:#ED8B00"></i>',
      cpp: '<i class="fas fa-code" style="color:#00599C"></i>',
    };
    return icons[lang?.toLowerCase()] || '<i class="fas fa-code"></i>';
  }

  escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
}
