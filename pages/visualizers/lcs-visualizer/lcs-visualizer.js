/**
 * 2D Dynamic Programming (LCS) Engine
 */

class LCSVisualizer {
  constructor() {
    this.gridContainer = document.getElementById('dp-grid-container');
    this.btnPlay = document.getElementById('btn-play');
    this.btnStep = document.getElementById('btn-step');
    this.btnReset = document.getElementById('btn-reset');
    this.btnGenerate = document.getElementById('btn-generate');
    this.speedSlider = document.getElementById('slider-speed');

    this.mathPanel = document.getElementById('math-overlay');
    this.mathEq = document.getElementById('math-equation');

    this.animating = false;
    this.generator = null;
    this.timer = null;
    this.dp = [];
    this.s1 = '';
    this.s2 = '';

    this.bindEvents();
    this.initGrid();
  }

  bindEvents() {
    this.btnGenerate.addEventListener('click', () => this.initGrid());
    this.btnReset.addEventListener('click', () => this.initGrid());
    this.btnStep.addEventListener('click', () => this.step());
    this.btnPlay.addEventListener('click', () => this.togglePlay());
  }

  initGrid() {
    this.animating = false;
    if (this.timer) clearTimeout(this.timer);
    this.generator = null;
    this.btnPlay.innerHTML = '<i class="fas fa-play"></i> Auto Run';
    this.btnPlay.disabled = false;
    this.btnStep.disabled = false;
    this.mathPanel.classList.add('hidden');
    document.querySelectorAll('.code-line').forEach((el) => el.classList.remove('active'));

    this.s1 = document.getElementById('input-str1').value.trim();
    this.s2 = document.getElementById('input-str2').value.trim();

    const m = this.s1.length;
    const n = this.s2.length;

    this.gridContainer.style.gridTemplateColumns = `repeat(${n + 2}, 1fr)`;
    this.gridContainer.innerHTML = '';

    this.dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = -1; i <= m; i++) {
      for (let j = -1; j <= n; j++) {
        const cell = document.createElement('div');
        cell.className = 'dp-cell';
        cell.id = `cell-${i}-${j}`;

        if (i === -1) {
          cell.classList.add('header');
          cell.innerText = j === -1 ? '' : j === 0 ? 'ε' : this.s2[j - 1];
        } else if (j === -1) {
          cell.classList.add('header');
          cell.innerText = i === 0 ? 'ε' : this.s1[i - 1];
        } else {
          cell.innerText = '';
        }

        this.gridContainer.appendChild(cell);
      }
    }

    document.getElementById('main-status').innerText =
      `Status: Grid Ready | String 1: "${this.s1}" | String 2: "${this.s2}"`;
    document.getElementById('stat-cell').innerText = `—`;
    document.getElementById('stat-ans').innerText = `—`;
    document.getElementById('stat-str').innerText = `—`;
  }

  getCell(i, j) {
    return document.getElementById(`cell-${i}-${j}`);
  }

  clearHighlights() {
    const cells = document.querySelectorAll('.dp-cell');
    cells.forEach((c) => {
      c.classList.remove('active', 'check');
    });
  }

  highlightCode(stepId) {
    document.querySelectorAll('.code-line').forEach((el) => el.classList.remove('active'));
    if (stepId) document.getElementById(stepId).classList.add('active');
  }

  updateMath(equation) {
    this.mathEq.innerHTML = equation;
    this.mathPanel.classList.remove('hidden');
  }

  *runDP() {
    const m = this.s1.length;
    const n = this.s2.length;

    // --- STEP 1: Initialization ---
    this.highlightCode('step-init');
    document.getElementById('main-status').innerText = `Status: Initializing Base Cases`;

    for (let i = 0; i <= m; i++) {
      this.dp[i][0] = 0;
      const cell = this.getCell(i, 0);
      cell.innerText = 0;
      cell.classList.add('filled');
    }
    for (let j = 0; j <= n; j++) {
      if (j === 0) continue;
      this.dp[0][j] = 0;
      const cell = this.getCell(0, j);
      cell.innerText = 0;
      cell.classList.add('filled');
    }

    this.updateMath(`Base cases: LCS with empty string is 0.`);
    yield;

    // --- STEP 2: Main DP Loop ---
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        this.clearHighlights();
        this.highlightCode('step-loop');

        const currentCell = this.getCell(i, j);
        currentCell.classList.add('active');
        document.getElementById('stat-cell').innerText = `(${i}, ${j})`;
        document.getElementById('main-status').innerText = `Status: Evaluating dp[${i}][${j}]`;

        this.getCell(i, -1).classList.add('check');
        this.getCell(-1, j).classList.add('check');

        yield;

        if (this.s1[i - 1] === this.s2[j - 1]) {
          // Match
          this.highlightCode('step-match');
          this.getCell(i - 1, j - 1).classList.add('check');

          this.dp[i][j] = 1 + this.dp[i - 1][j - 1];
          this.updateMath(
            `'${this.s1[i - 1]}' == '${this.s2[j - 1]}' <br> dp[${i}][${j}] = 1 + dp[${i - 1}][${j - 1}] = <span class="eq-hl">${this.dp[i][j]}</span>`
          );

          yield;
          this.highlightCode('step-match-op');
        } else {
          // Mismatch
          this.highlightCode('step-mismatch');

          const top = this.dp[i - 1][j];
          const left = this.dp[i][j - 1];

          this.getCell(i, j - 1).classList.add('check');
          this.getCell(i - 1, j).classList.add('check');

          this.updateMath(
            `'${this.s1[i - 1]}' != '${this.s2[j - 1]}' <br> dp[${i}][${j}] = max(<span class="eq-p">T:${top}</span>, <span class="eq-hl">L:${left}</span>)`
          );
          yield;

          this.highlightCode('step-mismatch-op');
          this.dp[i][j] = Math.max(left, top);
          this.updateMath(`dp[${i}][${j}] = <span class="eq-hl">${this.dp[i][j]}</span>`);
        }

        currentCell.innerText = this.dp[i][j];
        currentCell.classList.add('filled');
        yield;
      }
    }

    // --- STEP 3: Backtrack Path ---
    this.clearHighlights();
    this.highlightCode('step-backtrack');
    document.getElementById('main-status').innerText = `Status: Backtracking LCS`;
    this.updateMath(`Tracing path backward from dp[${m}][${n}]`);

    let i = m,
      j = n;
    this.getCell(i, j).classList.add('path');
    document.getElementById('stat-ans').innerText = this.dp[m][n];
    let lcsStr = '';
    yield;

    while (i > 0 && j > 0) {
      if (this.s1[i - 1] === this.s2[j - 1]) {
        this.updateMath(`'${this.s1[i - 1]}' matches! Included in LCS. Moving Diagonal.`);
        this.getCell(i, -1).classList.add('highlight-char');
        this.getCell(-1, j).classList.add('highlight-char');
        lcsStr = this.s1[i - 1] + lcsStr;
        document.getElementById('stat-str').innerText = lcsStr;
        i--;
        j--;
      } else if (this.dp[i - 1][j] > this.dp[i][j - 1]) {
        this.updateMath(`dp[${i - 1}][${j}] > dp[${i}][${j - 1}]. Moving Up.`);
        i--;
      } else {
        this.updateMath(`dp[${i}][${j - 1}] >= dp[${i - 1}][${j}]. Moving Left.`);
        j--;
      }
      this.getCell(i, j).classList.add('path');
      yield;
    }

    document.getElementById('main-status').innerText =
      `Status: Complete | LCS Length: ${this.dp[m][n]}`;
    this.btnPlay.innerHTML = '<i class="fas fa-check"></i> Done';
    this.btnPlay.disabled = true;
    this.btnStep.disabled = true;
    this.animating = false;
  }

  togglePlay() {
    this.animating = !this.animating;
    this.btnPlay.innerHTML = this.animating
      ? '<i class="fas fa-pause"></i> Pause'
      : '<i class="fas fa-play"></i> Auto Run';
    if (this.animating) this.autoStep();
  }

  step() {
    if (!this.generator) {
      this.generator = this.runDP();
    }

    const res = this.generator.next();

    if (res.done) {
      this.generator = null;
      return false;
    }
    return true;
  }

  autoStep() {
    if (!this.animating) return;

    const hasNext = this.step();
    if (hasNext) {
      const speed = parseInt(this.speedSlider.value, 10);
      this.timer = setTimeout(() => this.autoStep(), speed);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.visualizer = new LCSVisualizer();
});
