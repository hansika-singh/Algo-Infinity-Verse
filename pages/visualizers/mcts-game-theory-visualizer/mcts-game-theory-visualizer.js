/**
 * Algo-Infinity-Verse | Monte Carlo Tree Search (MCTS) Physics Visualizer
 * Core logic orchestrating dynamic asymmetrically branching choices.
 */

class GameState {
  constructor(agentPos = 12) {
    this.agentPos = agentPos; // Default starting spot: bottom row index 12
    this.gridSize = 4;

    // Define fixed board tiles map
    this.targets = [3, 7]; // High-reward goal state nodes
    this.traps = [5, 10]; // Low-reward trap state nodes
  }

  getPossibleMoves() {
    if (this.isTerminal()) return [];

    // Strategy options: 0 (Left-Up), 1 (Straight Up), 2 (Right-Up)
    const row = Math.floor(this.agentPos / this.gridSize);
    if (row === 0) return []; // Reached top row boundary

    const moves = [];
    const nextRow = row - 1;
    const col = this.agentPos % this.gridSize;

    // Choice 0: Move diagonally Left-Up
    if (col > 0) moves.push(nextRow * this.gridSize + (col - 1));
    // Choice 1: Move Straight Up
    moves.push(nextRow * this.gridSize + col);
    // Choice 2: Move diagonally Right-Up
    if (col < this.gridSize - 1) moves.push(nextRow * this.gridSize + (col + 1));

    return moves;
  }

  applyMove(nextPos) {
    return new GameState(nextPos);
  }

  isTerminal() {
    return (
      this.targets.includes(this.agentPos) ||
      this.traps.includes(this.agentPos) ||
      Math.floor(this.agentPos / this.gridSize) === 0
    );
  }

  getReward() {
    if (this.targets.includes(this.agentPos)) return 1.0; // Maximum Reward
    if (this.traps.includes(this.agentPos)) return 0.0; // Failure Penalty
    return 0.2; // Neutral finish tile row reward boundary
  }
}

class MCTSNode {
  constructor(state, parent = null, generatingMove = null) {
    this.state = state;
    this.parent = parent;
    this.generatingMove = generatingMove;
    this.children = [];

    this.wins = 0;
    this.visits = 0;
    this.untriedMoves = state.getPossibleMoves();

    // Physics-driven Layout positions
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.radius = 18;

    this.renderPhase = 'IDLE'; // IDLE, SELECTION, EXPANSION, SIMULATION, BACKPROP
  }

  isFullyExpanded() {
    return this.untriedMoves.length === 0;
  }

  getBestUCB1(c = 1.41) {
    let bestChild = null;
    let bestScore = -Infinity;
    const evaluations = [];

    this.children.forEach((child) => {
      const exploitation = child.wins / child.visits;
      const exploration = c * Math.sqrt(Math.log(this.visits) / child.visits);
      const ucb1 = exploitation + exploration;

      evaluations.push({ id: child.state.agentPos, score: ucb1 });

      if (ucb1 > bestScore) {
        bestScore = ucb1;
        bestChild = child;
      }
    });

    return { bestChild, evaluations };
  }
}

class MCTSVisualizer {
  constructor() {
    // DOM bindings
    this.canvas = document.getElementById('mcts-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.boardContainer = document.getElementById('board-grid');
    this.statusText = document.getElementById('status-text');
    this.mathStream = document.getElementById('math-stream');

    this.btnPlay = document.getElementById('btn-play');
    this.btnStep = document.getElementById('btn-step');
    this.btnReset = document.getElementById('btn-reset');
    this.speedSlider = document.getElementById('speed-slider');

    this.valIterations = document.getElementById('val-iterations');
    this.valDepth = document.getElementById('val-depth');

    // State Machine
    this.rootNode = null;
    this.totalIterations = 0;
    this.maxDepth = 0;

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
    this.resetSimulation();
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
    this.btnReset.addEventListener('click', () => this.resetSimulation());

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
    this.updateTreePhysicsLayout();
  }

  resetSimulation() {
    this.pause();
    this.totalIterations = 0;
    this.maxDepth = 0;

    const initialGame = new GameState();
    this.rootNode = new MCTSNode(initialGame);

    // Position initial root at top center area
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    this.rootNode.x = this.rootNode.targetX = w / 2;
    this.rootNode.y = this.rootNode.targetY = 40;

    this.renderBoardState(initialGame);
    this.updateTelemetry();
    this.mathStream.innerHTML =
      '<div class="empty-stream">Awaiting selection phase to display UCB1 evaluations...</div>';

    this.generator = this.mctsLoopGenerator();
    this.btnStep.disabled = false;
    this.btnPlay.disabled = false;
    this.updateUIStatus('Simulation Reset. Tree hierarchy cleared.', '');
  }

  /* --- MCTS Generator Loop Coroutine --- */

  *mctsLoopGenerator() {
    while (true) {
      this.clearNodePhases(this.rootNode);
      let node = this.rootNode;
      let depthCounter = 0;

      // 1. SELECTION PHASE
      this.updateActivePhaseIndicator('selection');
      while (node.isFullyExpanded() && node.children.length > 0) {
        node.renderPhase = 'SELECTION';
        const { bestChild, evaluations } = node.getBestUCB1();

        this.renderBoardState(node.state);
        this.logUCB1Metrics(node.id || 'Root', evaluations);
        yield { msg: `Selection Phase: Choosing highest UCB1 child path.`, node };

        node = bestChild;
        depthCounter++;
      }
      node.renderPhase = 'SELECTION';
      this.renderBoardState(node.state);
      yield { msg: `Selection node reached boundary criteria.`, node };

      // 2. EXPANSION PHASE
      if (!node.state.isTerminal() && node.untriedMoves.length > 0) {
        this.updateActivePhaseIndicator('expansion');
        const move = node.untriedMoves.pop();
        const nextState = node.state.applyMove(move);
        const childNode = new MCTSNode(nextState, node, move);

        node.children.push(childNode);
        node.renderPhase = 'EXPANSION';
        childNode.renderPhase = 'EXPANSION';

        this.updateTreePhysicsLayout();
        this.renderBoardState(childNode.state);
        depthCounter++;
        if (depthCounter > this.maxDepth) this.maxDepth = depthCounter;

        yield {
          msg: `Expansion Phase: Creating child node tracking state index ${move}.`,
          node: childNode,
        };
        node = childNode;
      }

      // 3. SIMULATION (ROLLOUT) PHASE
      this.updateActivePhaseIndicator('simulation');
      node.renderPhase = 'SIMULATION';
      let rolloutState = node.state;

      this.renderBoardState(rolloutState, true);
      yield {
        msg: `Simulation Phase: Starting random playout from cell ${rolloutState.agentPos}.`,
        node,
      };

      while (!rolloutState.isTerminal()) {
        const possible = rolloutState.getPossibleMoves();
        const randomMove = possible[Math.floor(Math.random() * possible.length)];
        rolloutState = rolloutState.applyMove(randomMove);

        this.renderBoardState(rolloutState, true);
        yield { msg: `Playout rolling forward down branch sequence...`, node };
      }

      const score = rolloutState.getReward();
      this.renderBoardState(rolloutState, true);
      yield { msg: `Rollout complete! Achieved final reward payout value: ${score}.`, node };

      // 4. BACKPROPAGATION PHASE
      this.updateActivePhaseIndicator('backprop');
      this.totalIterations++;

      let backpropNode = node;
      while (backpropNode !== null) {
        backpropNode.renderPhase = 'BACKPROP';
        backpropNode.visits++;
        backpropNode.wins += score;

        yield {
          msg: `Backpropagation: Incremented score metrics up parent structure path.`,
          node: backpropNode,
        };
        backpropNode = backpropNode.parent;
      }

      this.updateTelemetry();
    }
  }

  clearNodePhases(node) {
    if (!node) return;
    node.renderPhase = 'IDLE';
    node.children.forEach((c) => this.clearNodePhases(c));
  }

  /* --- Physics Layout Alignment Engine --- */

  updateTreePhysicsLayout() {
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const levelHeight = 70;
    this.positionTreeNodesSymmetrically(this.rootNode, 0, w, 40, levelHeight);
  }

  positionTreeNodesSymmetrically(node, xMin, xMax, y, levelHeight) {
    if (!node) return;

    node.targetX = xMin + (xMax - xMin) / 2;
    node.targetY = y;

    if (node.children.length === 0) return;

    const partitionWidth = (xMax - xMin) / node.children.length;
    node.children.forEach((child, idx) => {
      this.positionTreeNodesSymmetrically(
        child,
        xMin + idx * partitionWidth,
        xMin + (idx + 1) * partitionWidth,
        y + levelHeight,
        levelHeight
      );
    });
  }

  /* --- UI Render Controllers --- */

  renderBoardState(gameState, isSimulating = false) {
    this.boardContainer.innerHTML = '';
    for (let i = 0; i < 16; i++) {
      const cell = document.createElement('div');
      cell.className = 'board-cell';

      if (gameState.targets.includes(i)) cell.classList.add('cell-target');
      else if (gameState.traps.includes(i)) cell.classList.add('cell-trap');

      if (gameState.agentPos === i) {
        cell.classList.add('cell-agent');
        cell.textContent = 'A';
        if (isSimulating) cell.classList.add('cell-simulated');
      } else if (gameState.targets.includes(i)) {
        cell.textContent = '+1';
      } else if (gameState.traps.includes(i)) {
        cell.textContent = '✖';
      }
      this.boardContainer.appendChild(cell);
    }
  }

  logUCB1Metrics(nodeId, evals) {
    this.mathStream.innerHTML = '';
    evals.forEach((ev) => {
      const line = document.createElement('div');
      line.className = 'math-line';
      line.textContent = `Node -> Cell ${ev.id} | calculated UCT score value = ${ev.score.toFixed(4)}`;
      this.mathStream.appendChild(line);
    });
  }

  updateTelemetry() {
    this.valIterations.textContent = this.totalIterations;
    this.valDepth.textContent = this.maxDepth;
  }

  updateUIStatus(msg) {
    this.statusText.textContent = msg;
  }

  updateActivePhaseIndicator(phaseStr) {
    document.querySelectorAll('.phase-item').forEach((el) => el.classList.remove('active-phase'));
    if (phaseStr) {
      const activeEl = document.getElementById(`phase-${phaseStr}`);
      if (activeEl) activeEl.classList.add('active-phase');
    }
  }

  /* --- Run Execution Logic --- */

  step() {
    if (!this.generator) return;
    const { value, done } = this.generator.next();
    if (done) {
      this.pause();
      return;
    }
    this.updateUIStatus(value.msg);
  }

  play() {
    this.isPlaying = true;
    this.btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Execution';
    this.btnPlay.classList.replace('btn-primary', 'btn-accent');

    const runLoop = () => {
      if (!this.isPlaying) return;
      this.step();
      const delay = Math.max(50, 1000 / this.animSpeed);
      this.autoPlayTimeout = setTimeout(runLoop, delay);
    };
    runLoop();
  }

  pause() {
    this.isPlaying = false;
    clearTimeout(this.autoPlayTimeout);
    this.btnPlay.innerHTML = '<i class="fa-solid fa-play"></i> Run Iterations';
    this.btnPlay.classList.replace('btn-accent', 'btn-primary');
  }

  /* --- Canvas Painting Loop --- */

  startRenderLoop() {
    const drawLoop = () => {
      const w = this.canvas.width / (window.devicePixelRatio || 1);
      const h = this.canvas.height / (window.devicePixelRatio || 1);
      this.ctx.clearRect(0, 0, w, h);

      this.updatePhysicsCalculations(this.rootNode);
      this.drawTreeConnections(this.rootNode);
      this.drawTreeNodesElements(this.rootNode);

      this.animFrame = requestAnimationFrame(drawLoop);
    };
    drawLoop();
  }

  updatePhysicsCalculations(node) {
    if (!node) return;
    node.x += (node.targetX - node.x) * 0.15;
    node.y += (node.targetY - node.y) * 0.15;
    node.children.forEach((c) => this.updatePhysicsCalculations(c));
  }

  drawTreeConnections(node) {
    if (!node) return;
    this.ctx.lineWidth = 2;
    node.children.forEach((child) => {
      this.ctx.beginPath();
      this.ctx.moveTo(node.x, node.y);
      this.ctx.lineTo(child.x, child.y);

      if (child.renderPhase === 'SELECTION' || child.renderPhase === 'BACKPROP') {
        this.ctx.strokeStyle = child.renderPhase === 'SELECTION' ? '#06b6d4' : '#10b981';
        this.ctx.lineWidth = 3.5;
      } else {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 2;
      }
      this.ctx.stroke();
      this.drawTreeConnections(child);
    });
  }

  drawTreeNodesElements(node) {
    if (!node) return;
    this.ctx.save();

    let strokeColor = '#475569';
    let fillColor = '#1e293b';

    switch (node.renderPhase) {
      case 'SELECTION':
        strokeColor = '#06b6d4';
        fillColor = 'rgba(6, 182, 212, 0.2)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#06b6d4';
        break;
      case 'EXPANSION':
        strokeColor = '#f59e0b';
        fillColor = 'rgba(245, 158, 11, 0.2)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#f59e0b';
        break;
      case 'SIMULATION':
        strokeColor = '#ec4899';
        fillColor = 'rgba(236, 72, 153, 0.2)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ec4899';
        break;
      case 'BACKPROP':
        strokeColor = '#10b981';
        fillColor = 'rgba(16, 185, 129, 0.2)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#10b981';
        break;
    }

    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0; // Reset

    // Render mini fractional metrics text values inside nodes
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 9px "Fira Code"';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`${Math.round(node.wins)}/${node.visits}`, node.x, node.y);

    this.ctx.restore();
    node.children.forEach((c) => this.drawTreeNodesElements(c));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MCTSVisualizer();
});
