/**
 * Algo-Infinity-Verse | DPLL 3-SAT Solver Physics Visualizer
 * Fully automated, Generator-driven Boolean Satisfiability Logic Engine.
 */

class Literal {
  constructor(variable, isPositive) {
    this.variable = variable; // String name e.g. 'A', 'B'
    this.isPositive = isPositive; // Boolean flag polarity
  }
  toString() {
    return this.isPositive ? this.variable : `¬${this.variable}`;
  }
}

class Clause {
  constructor(id, literals) {
    this.id = id;
    this.literals = literals; // Array of Literal objects
  }
}

class DecisionNode {
  constructor(variable, value, parent = null, branchType = 'BRANCH') {
    this.variable = variable;
    this.value = value; // true or false
    this.parent = parent;
    this.branchType = branchType; // 'BRANCH', 'UNIT', 'PURE'
    this.children = [];

    // Dynamic tree positions mapping
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.radius = 16;
    this.isBacktracked = false;
    this.isSuccess = false;
  }
}

class DPLLVisualizer {
  constructor() {
    // DOM bindings
    this.canvas = document.getElementById('dpll-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.formulaContainer = document.getElementById('formula-container');
    this.varBadgesContainer = document.getElementById('var-badges');
    this.statusText = document.getElementById('status-text');

    this.btnPlay = document.getElementById('btn-play');
    this.btnStep = document.getElementById('btn-step');
    this.btnReset = document.getElementById('btn-reset');
    this.speedSlider = document.getElementById('speed-slider');

    this.valBacktracks = document.getElementById('val-backtracks');
    this.valClauses = document.getElementById('val-clauses');

    // State variables
    this.variables = ['A', 'B', 'C', 'D'];
    this.baseClauses = [];
    this.assignments = {}; // variable -> true/false/null
    this.backtrackCount = 0;

    this.treeRoot = null;
    this.activeNode = null;
    this.generator = null;
    this.isPlaying = false;
    this.animSpeed = 1.0;
    this.autoPlayTimeout = null;

    this.init();
  }

  init() {
    this.bindEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.loadSample3SAT();
    this.startRenderLoop();
  }

  bindEvents() {
    this.btnPlay.addEventListener('click', () => {
      if (this.isPlaying) this.pause();
      else this.play();
    });
    this.btnStep.addEventListener('click', () => {
      this.pause();
      this.step();
    });
    this.btnReset.addEventListener('click', () => this.loadSample3SAT());

    this.speedSlider.addEventListener('input', (e) => {
      this.animSpeed = parseFloat(e.target.value);
      document.getElementById('speed-val').textContent = `${this.animSpeed.toFixed(1)}x`;
    });
  }

  resize() {
    const wrapper = this.canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = wrapper.clientWidth * dpr;
    this.canvas.height = wrapper.clientHeight * dpr;
    this.ctx.scale(dpr, dpr);
    this.updateTreeLayout();
  }

  loadSample3SAT() {
    this.pause();
    this.backtrackCount = 0;
    this.treeRoot = new DecisionNode('ROOT', null, null, 'ROOT');
    this.treeRoot.x = this.treeRoot.targetX =
      this.canvas.width / (window.devicePixelRatio || 1) / 2;
    this.treeRoot.y = this.treeRoot.targetY = 30;
    this.activeNode = this.treeRoot;

    // Initialize variables to null assignment states
    this.variables.forEach((v) => (this.assignments[v] = null));

    // Pre-load an illustrative contradictory/backtracking 3-SAT formula
    this.baseClauses = [
      new Clause(1, [new Literal('A', true), new Literal('B', true), new Literal('C', false)]),
      new Clause(2, [new Literal('A', false), new Literal('B', true), new Literal('D', true)]),
      new Clause(3, [new Literal('B', false), new Literal('C', true), new Literal('D', false)]),
      new Clause(4, [new Literal('A', true), new Literal('C', false), new Literal('D', false)]),
      new Clause(5, [new Literal('A', false), new Literal('B', false), new Literal('C', true)]),
      new Clause(6, [new Literal('C', true), new Literal('D', true), new Literal('A', true)]),
      new Clause(7, [new Literal('B', false), new Literal('D', false), new Literal('C', false)]),
    ];

    this.renderFormulaBoard();
    this.renderVariableBadges();
    this.updateTelemetry();

    this.generator = this.dpllSolverGenerator();
    this.btnStep.disabled = false;
    this.btnPlay.disabled = false;
    this.updateUIStatus('CNF Formula registry generated. Ready to solve.', '');
  }

  /* --- Core DPLL Solver Generator --- */

  *dpllSolverGenerator() {
    const success = yield* this.dpll();
    if (success) {
      this.updateActivePhaseIndicator('');
      this.markSuccessPath(this.activeNode);
      yield { msg: 'Formula is SATISFIABLE! Valid model assignment verified.' };
    } else {
      yield { msg: 'Formula is UNSATISFIABLE! Complete search space exhausted.' };
    }
  }

  *dpll() {
    this.renderFormulaBoard();
    this.renderVariableBadges();
    this.updateTelemetry();

    // 1. Check Clause Status evaluation under current assignments
    let allSatisfied = true;
    let conflictDetected = false;

    for (let clause of this.baseClauses) {
      let clauseStatus = this.evaluateClause(clause);
      if (clauseStatus === 'CONFLICT') conflictDetected = true;
      if (clauseStatus !== 'SATISFIED') allSatisfied = false;
    }

    if (allSatisfied) return true;
    if (conflictDetected) {
      this.updateActivePhaseIndicator('backtrack');
      this.backtrackCount++;
      if (this.activeNode) this.activeNode.isBacktracked = true;
      this.renderFormulaBoard(true); // Highlights conflict brick visually
      yield {
        msg: 'Conflict detected (Empty Clause generated)! Backtracking call stack sequence...',
      };
      return false;
    }

    // 2. UNIT PROPAGATION HEURISTIC MATCH
    let unitLit = this.findUnitClauseLiteral();
    if (unitLit) {
      this.updateActivePhaseIndicator('unit');
      const targetVal = unitLit.isPositive;
      this.assignments[unitLit.variable] = targetVal;

      const unitNode = new DecisionNode(unitLit.variable, targetVal, this.activeNode, 'UNIT');
      this.activeNode.children.push(unitNode);
      this.activeNode = unitNode;

      this.updateTreeLayout();
      this.highlightFormulaLiteral(unitLit.variable, 'lit-active-unit');
      yield {
        msg: `Unit Propagation: Forcing ${unitLit.variable} = ${targetVal.toString().toUpperCase()}`,
      };

      if (yield* this.dpll()) return true;

      // Revert assignment on backtracking path sequence
      this.assignments[unitLit.variable] = null;
      this.activeNode = unitNode.parent;
      return false;
    }

    // 3. PURE LITERAL ELIMINATION HEURISTIC MATCH
    let pureLit = this.findPureLiteral();
    if (pureLit) {
      this.updateActivePhaseIndicator('pure');
      const targetVal = pureLit.isPositive;
      this.assignments[pureLit.variable] = targetVal;

      const pureNode = new DecisionNode(pureLit.variable, targetVal, this.activeNode, 'PURE');
      this.activeNode.children.push(pureNode);
      this.activeNode = pureNode;

      this.updateTreeLayout();
      this.highlightFormulaLiteral(pureLit.variable, 'lit-active-pure');
      yield {
        msg: `Pure Literal Rule: Eliminating via ${pureLit.variable} = ${targetVal.toString().toUpperCase()}`,
      };

      if (yield* this.dpll()) return true;

      this.assignments[pureLit.variable] = null;
      this.activeNode = pureNode.parent;
      return false;
    }

    // 4. HEURISTIC BRANCHING (SPECULATIVE GUESS CHOICES)
    this.updateActivePhaseIndicator('branch');
    let nextVar = this.variables.find((v) => this.assignments[v] === null);
    if (!nextVar) return false;

    // Branch 1: Try True
    this.assignments[nextVar] = true;
    const trueNode = new DecisionNode(nextVar, true, this.activeNode, 'BRANCH');
    this.activeNode.children.push(trueNode);
    this.activeNode = trueNode;

    this.updateTreeLayout();
    yield { msg: `Branching: Speculating choice assignment ${nextVar} = TRUE` };
    if (yield* this.dpll()) return true;

    // Revert Choice & Branch 2: Try False
    this.updateActivePhaseIndicator('branch');
    this.assignments[nextVar] = false;
    const falseNode = new DecisionNode(nextVar, false, trueNode.parent, 'BRANCH');
    trueNode.parent.children.push(falseNode);
    this.activeNode = falseNode;

    this.updateTreeLayout();
    yield { msg: `Branching: Speculating alternative selection assignment ${nextVar} = FALSE` };
    if (yield* this.dpll()) return true;

    // Clean unwind unwind
    this.assignments[nextVar] = null;
    this.activeNode = falseNode.parent;
    return false;
  }

  /* --- Helper Checking Formulas --- */

  evaluateClause(clause) {
    let hasUnassigned = false;
    for (let lit of clause.literals) {
      const val = this.assignments[lit.variable];
      if (val === null) {
        hasUnassigned = true;
      } else if ((val && lit.isPositive) || (!val && !lit.isPositive)) {
        return 'SATISFIED';
      }
    }
    return hasUnassigned ? 'UNDETERMINED' : 'CONFLICT';
  }

  findUnitClauseLiteral() {
    for (let clause of this.baseClauses) {
      if (this.evaluateClause(clause) !== 'UNDETERMINED') continue;

      let unassignedLit = null;
      let unassignedCount = 0;

      for (let lit of clause.literals) {
        if (this.assignments[lit.variable] === null) {
          unassignedCount++;
          unassignedLit = lit;
        }
      }
      if (unassignedCount === 1) return unassignedLit;
    }
    return null;
  }

  findPureLiteral() {
    const polarities = {}; // var -> set of polarities seen

    for (let clause of this.baseClauses) {
      if (this.evaluateClause(clause) === 'SATISFIED') continue;

      for (let lit of clause.literals) {
        if (this.assignments[lit.variable] !== null) continue;
        if (!polarities[lit.variable]) polarities[lit.variable] = new Set();
        polarities[lit.variable].add(lit.isPositive);
      }
    }

    for (let varName in polarities) {
      if (polarities[varName].size === 1) {
        const isPositive = polarities[varName].has(true);
        return new Literal(varName, isPositive);
      }
    }
    return null;
  }

  markSuccessPath(node) {
    if (!node) return;
    node.isSuccess = true;
    this.markSuccessPath(node.parent);
  }

  /* --- UI Render Manipulations (O(1) updates) --- */

  renderFormulaBoard(highlightConflicts = false) {
    this.formulaContainer.innerHTML = '';
    let unassignedCount = 0;

    this.baseClauses.forEach((clause) => {
      const brick = document.createElement('div');
      brick.className = 'clause-brick';

      const status = this.evaluateClause(clause);
      if (status === 'SATISFIED') brick.classList.add('clause-satisfied');
      if (status === 'CONFLICT' && highlightConflicts) brick.classList.add('clause-conflict');
      if (status === 'UNDETERMINED') unassignedCount++;

      clause.literals.forEach((lit, idx) => {
        if (idx > 0) {
          const orOp = document.createElement('span');
          orOp.className = 'lit-or-operator';
          orOp.textContent = '∨';
          brick.appendChild(orOp);
        }

        const span = document.createElement('span');
        span.className = 'lit-item';
        span.textContent = lit.toString();

        // Strike literal out if assignment evaluates it false inside the brick row context
        const varVal = this.assignments[lit.variable];
        if (varVal !== null && ((varVal && !lit.isPositive) || (!varVal && lit.isPositive))) {
          span.className = 'lit-item lit-struck';
        }
        brick.appendChild(span);
      });

      this.formulaContainer.appendChild(brick);
    });

    this.valClauses.textContent = unassignedCount;
  }

  renderVariableBadges() {
    this.varBadgesContainer.innerHTML = '';
    this.variables.forEach((v) => {
      const badge = document.createElement('span');
      const val = this.assignments[v];

      if (val === null) {
        badge.className = 'var-badge badge-unassigned';
        badge.textContent = `${v}: ?`;
      } else {
        badge.className = val ? 'var-badge badge-true' : 'var-badge badge-false';
        badge.textContent = `${v}: ${val.toString().toUpperCase()}`;
      }
      this.varBadgesContainer.appendChild(badge);
    });
  }

  highlightFormulaLiteral(variable, cssClass) {
    // Scans items to dynamically append transient heuristic indicator classes safely
    document.querySelectorAll('.lit-item').forEach((el) => {
      if (el.textContent.includes(variable) && !el.classList.contains('lit-struck')) {
        el.classList.add(cssClass);
      }
    });
  }

  updateTelemetry() {
    this.valBacktracks.textContent = this.backtrackCount;
  }

  updateUIStatus(msg) {
    this.statusText.textContent = msg;
  }

  updateActivePhaseIndicator(phaseStr) {
    document.querySelectorAll('.phase-item').forEach((el) => el.classList.remove('active-phase'));
    if (phaseStr) {
      const el = document.getElementById(`phase-${phaseStr}`);
      if (el) el.classList.add('active-phase');
    }
  }

  /* --- Simulation Flow Playback Controls --- */

  step() {
    if (!this.generator) return;
    const { value, done } = this.generator.next();
    if (done) {
      this.pause();
      return;
    }
    if (value && value.msg) this.updateUIStatus(value.msg);
  }

  play() {
    this.isPlaying = true;
    this.btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Solver';
    this.btnPlay.classList.replace('btn-primary', 'btn-accent');

    const tick = () => {
      if (!this.isPlaying) return;
      this.step();
      if (this.btnStep.disabled) {
        this.pause();
        return;
      }
      const delay = Math.max(150, 1500 / this.animSpeed);
      this.autoPlayTimeout = setTimeout(tick, delay);
    };
    tick();
  }

  pause() {
    this.isPlaying = false;
    clearTimeout(this.autoPlayTimeout);
    this.btnPlay.innerHTML = '<i class="fa-solid fa-play"></i> Auto Solve';
    this.btnPlay.classList.replace('btn-accent', 'btn-primary');
  }

  /* --- Tree Layout Math & Canvas Painting Loop --- */

  updateTreeLayout() {
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    this.calculateTreeCoordinates(this.treeRoot, 0, w, 40, 55);
  }

  calculateTreeCoordinates(node, xMin, xMax, y, levelHeight) {
    if (!node) return;
    node.targetX = xMin + (xMax - xMin) / 2;
    node.targetY = y;

    if (node.children.length === 0) return;
    const sector = (xMax - xMin) / node.children.length;
    node.children.forEach((child, idx) => {
      this.calculateTreeCoordinates(
        child,
        xMin + idx * sector,
        xMin + (idx + 1) * sector,
        y + levelHeight,
        levelHeight
      );
    });
  }

  startRenderLoop() {
    const loop = () => {
      this.updatePhysicsPositions(this.treeRoot);

      const w = this.canvas.width / (window.devicePixelRatio || 1);
      const h = this.canvas.height / (window.devicePixelRatio || 1);
      this.ctx.clearRect(0, 0, w, h);

      this.paintConnections(this.treeRoot);
      this.paintNodes(this.treeRoot);

      requestAnimationFrame(loop);
    };
    loop();
  }

  updatePhysicsPositions(node) {
    if (!node) return;
    node.x += (node.targetX - node.x) * 0.15;
    node.y += (node.targetY - node.y) * 0.15;
    node.children.forEach((c) => this.updatePhysicsPositions(c));
  }

  paintConnections(node) {
    if (!node) return;
    this.ctx.lineWidth = 2;
    node.children.forEach((child) => {
      this.ctx.beginPath();
      this.ctx.moveTo(node.x, node.y);
      this.ctx.lineTo(child.x, child.y);

      if (child.isSuccess) {
        this.ctx.strokeStyle = '#10b981';
        this.ctx.lineWidth = 3.5;
      } else if (child.isBacktracked) {
        this.ctx.strokeStyle = 'rgba(244,63,94,0.15)';
        this.ctx.lineWidth = 1.5;
      } else {
        this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      }
      this.ctx.stroke();
      this.paintConnections(child);
    });
  }

  paintNodes(node) {
    if (!node) return;
    this.ctx.save();

    let strokeColor = '#475569';
    let fillColor = '#1e293b';

    if (node === this.activeNode && node.variable !== 'ROOT') {
      strokeColor = '#fff';
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = '#fff';
    } else if (node.isSuccess) {
      strokeColor = '#10b981';
      fillColor = 'rgba(16,185,129,0.15)';
    } else if (node.isBacktracked) {
      strokeColor = '#f43f5e';
      fillColor = 'rgba(244,63,94,0.05)';
    } else {
      switch (node.branchType) {
        case 'BRANCH':
          strokeColor = '#7c3aed';
          break;
        case 'UNIT':
          strokeColor = '#06b6d4';
          break;
        case 'PURE':
          strokeColor = '#f59e0b';
          break;
      }
    }

    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Node String parameters text mapping
    this.ctx.fillStyle = node.isBacktracked ? '#64748b' : '#fff';
    this.ctx.font = 'bold 9px "Fira Code"';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    let label = node.variable;
    if (node.variable !== 'ROOT') {
      label += node.value ? '⁺' : '⁻';
    }
    this.ctx.fillText(label, node.x, node.y);

    this.ctx.restore();
    node.children.forEach((c) => this.paintNodes(c));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new DPLLVisualizer();
});
