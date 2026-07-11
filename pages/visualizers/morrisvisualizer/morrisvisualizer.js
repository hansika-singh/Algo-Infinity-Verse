/**
 * Algo-Infinity-Verse | Morris Inorder Traversal O(1) Space Visualizer
 * Strictly encapsulated physics and visualization engine. Zero global scope leakage.
 */

class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
    
    // Physics & Rendering Coordinates
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    
    // Aesthetic Styling Properties
    this.color = '#1e293b';       // Base fill
    this.borderColor = '#38bdf8'; // Normal border
    this.glowColor = 'transparent';
    this.radius = 24;
    this.isProcessed = false;
  }

  // Smooth linear interpolation for layout transitions
  updatePhysics(speed = 0.1) {
    this.x += (this.targetX - this.x) * speed;
    this.y += (this.targetY - this.y) * speed;
  }
}

class MorrisVisualizer {
  constructor() {
    // DOM References
    this.canvas = document.getElementById('tree-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.btnGen = document.getElementById('btn-generate');
    this.btnPlay = document.getElementById('btn-play');
    this.btnStep = document.getElementById('btn-step');
    this.btnReset = document.getElementById('btn-reset');
    this.speedSlider = document.getElementById('speed-slider');
    this.speedVal = document.getElementById('speed-val');
    
    this.statusText = document.getElementById('status-text');
    this.ptrCurr = document.getElementById('ptr-curr');
    this.ptrPred = document.getElementById('ptr-pred');
    this.valStack = document.getElementById('val-stack');
    this.barStack = document.getElementById('bar-stack');
    this.outputStream = document.getElementById('output-stream');
    
    // Internal State
    this.root = null;
    this.nodes = [];
    this.threads = []; // Array of active thread objects { from: TreeNode, to: TreeNode }
    this.generator = null;
    this.isPlaying = false;
    this.animSpeed = 1.0;
    this.animationFrameId = null;
    this.maxTreeDepth = 0;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Generate initial tree and launch render loop
    this.generateNewTree();
    this.startRenderLoop();
  }

  setupEventListeners() {
    this.btnGen.addEventListener('click', () => {
      this.pauseAutoPlay();
      this.generateNewTree();
    });

    this.btnPlay.addEventListener('click', () => {
      if (this.isPlaying) {
        this.pauseAutoPlay();
      } else {
        this.startAutoPlay();
      }
    });

    this.btnStep.addEventListener('click', () => {
      this.pauseAutoPlay();
      this.stepForward();
    });

    this.btnReset.addEventListener('click', () => {
      this.pauseAutoPlay();
      this.resetTraversal();
    });

    this.speedSlider.addEventListener('input', (e) => {
      this.animSpeed = parseFloat(e.target.value);
      this.speedVal.textContent = `${this.animSpeed.toFixed(1)}x`;
    });
  }

  resizeCanvas() {
    const wrapper = this.canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = wrapper.clientWidth * dpr;
    this.canvas.height = wrapper.clientHeight * dpr;
    this.ctx.scale(dpr, dpr);
    
    // Re-calculate layouts on resize
    if (this.root) this.calculateTreeLayout();
  }

  /* --- Tree Generation & Layout Engine --- */

  generateNewTree() {
    this.nodes = [];
    this.threads = [];
    this.outputStream.innerHTML = '<span class="empty-stream">No nodes processed yet...</span>';
    this.updateStatus('New tree generated. Ready for traversal.', 0);
    this.ptrCurr.textContent = 'null';
    this.ptrPred.textContent = 'null';
    this.updateSpaceTracker(0);

    // Create a well-balanced randomized binary tree (10-12 nodes)
    const values = Array.from({ length: 11 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    this.root = this.insertLevelOrder(values, 0);
    
    // Calculate depth for complexity tracker scaling
    this.maxTreeDepth = this.getTreeDepth(this.root);
    
    this.calculateTreeLayout();
    
    // Snap initial coordinates immediately without sliding
    this.nodes.forEach(node => {
      node.x = node.targetX;
      node.y = node.targetY;
    });

    this.resetTraversal();
  }

  insertLevelOrder(arr, i) {
    if (i >= arr.length || arr[i] === null) return null;
    
    const node = new TreeNode(arr[i]);
    this.nodes.push(node);
    
    // Randomly prune some branches to make tree look organic
    if (Math.random() > 0.15 || i === 0) node.left = this.insertLevelOrder(arr, 2 * i + 1);
    if (Math.random() > 0.15 || i === 0) node.right = this.insertLevelOrder(arr, 2 * i + 2);
    
    return node;
  }

  getTreeDepth(node) {
    if (!node) return 0;
    return 1 + Math.max(this.getTreeDepth(node.left), this.getTreeDepth(node.right));
  }

  calculateTreeLayout() {
    if (!this.root) return;
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    
    const levelHeight = Math.min(80, (height - 100) / (this.maxTreeDepth || 1));
    this.assignCoordinates(this.root, 0, width, 50, levelHeight);
  }

  assignCoordinates(node, xMin, xMax, y, levelHeight) {
    if (!node) return;
    
    node.targetX = xMin + (xMax - xMin) / 2;
    node.targetY = y;

    this.assignCoordinates(node.left, xMin, node.targetX, y + levelHeight, levelHeight);
    this.assignCoordinates(node.right, node.targetX, xMax, y + levelHeight, levelHeight);
  }

  /* --- Morris Traversal Generator Engine --- */

  *morrisInorderGenerator(root) {
    let curr = root;
    let stackSimulationDepth = 0;

    while (curr !== null) {
      // Simulate standard call-stack depth for tracking comparison
      stackSimulationDepth = this.simulateStackDepth(root, curr);

      if (curr.left === null) {
        // Phase 2: No left child. Evaluate current and move right.
        yield {
          curr,
          pred: null,
          phase: 2,
          message: `Node (${curr.val}) has no left subtree. Extracting data and advancing right.`,
          stackDepth: stackSimulationDepth,
          extract: curr,
          threads: [...this.threads]
        };

        curr = curr.right;
      } else {
        // Find the inorder predecessor of curr
        let pred = curr.left;
        while (pred.right !== null && pred.right !== curr) {
          pred = pred.right;
        }

        if (pred.right === null) {
          // Phase 1: Create temporary thread back to root
          pred.right = curr;
          this.threads.push({ from: pred, to: curr });

          yield {
            curr,
            pred,
            phase: 1,
            message: `Found Predecessor (${pred.val}). Creating thread to Current (${curr.val}) and moving left.`,
            stackDepth: stackSimulationDepth,
            extract: null,
            threads: [...this.threads]
          };

          curr = curr.left;
        } else {
          // Phase 3: Thread already exists. Revert tree changes.
          pred.right = null;
          this.threads = this.threads.filter(t => !(t.from === pred && t.to === curr));

          yield {
            curr,
            pred,
            phase: 3,
            message: `Thread discovered from (${pred.val}) to (${curr.val}). Un-threading tree structure.`,
            stackDepth: stackSimulationDepth,
            extract: null,
            threads: [...this.threads]
          };

          // Phase 2: After un-threading, evaluate current node
          yield {
            curr,
            pred,
            phase: 2,
            message: `Tree restored. Extracting data from (${curr.val}) and advancing right.`,
            stackDepth: stackSimulationDepth,
            extract: curr,
            threads: [...this.threads]
          };

          curr = curr.right;
        }
      }
    }

    yield {
      curr: null,
      pred: null,
      phase: 0,
      message: 'Morris Inorder Traversal Complete! Tree restored to original state with O(1) auxiliary space.',
      stackDepth: 0,
      extract: null,
      threads: []
    };
  }

  // Estimates depth from root to node to simulate O(N) recursion stack height
  simulateStackDepth(root, target) {
    let depth = 0;
    let curr = root;
    while (curr && curr !== target) {
      depth++;
      // Simple heuristic approximation for tree traversal depth mapping
      if (target.val < curr.val) curr = curr.left;
      else curr = curr.right;
    }
    return depth + 1;
  }

  /* --- State & UI Controllers --- */

  resetTraversal() {
    this.nodes.forEach(n => {
      n.isProcessed = false;
      n.color = '#1e293b';
      n.borderColor = '#38bdf8';
      n.glowColor = 'transparent';
      n.left = null;
      n.right = null;
    });

    // Re-link structural edges cleanly
    this.generateCleanConnections(this.root);
    this.threads = [];
    this.outputStream.innerHTML = '<span class="empty-stream">No nodes processed yet...</span>';
    this.ptrCurr.textContent = 'null';
    this.ptrPred.textContent = 'null';
    this.updateSpaceTracker(0);
    this.updateStatus('Ready to start Morris Traversal.', 0);
    
    this.generator = this.morrisInorderGenerator(this.root);
    this.btnStep.disabled = false;
    this.btnPlay.disabled = false;
  }

  generateCleanConnections(node) {
    if (!node) return;
    // Strip temporary right-pointer threads that might remain from aborted runs
    if (node.right && !this.nodes.includes(node.right)) node.right = null;
    this.generateCleanConnections(node.left);
    this.generateCleanConnections(node.right);
  }

  stepForward() {
    if (!this.generator) return;
    const { value, done } = this.generator.next();

    if (done || !value) {
      this.pauseAutoPlay();
      this.btnStep.disabled = true;
      this.btnPlay.disabled = true;
      return;
    }

    this.applyState(value);
  }

  applyState(state) {
    // Reset visual decorations
    this.nodes.forEach(n => {
      if (!n.isProcessed) {
        n.color = '#1e293b';
        n.borderColor = '#38bdf8';
        n.glowColor = 'transparent';
      }
    });

    // Update pointers and indicators
    this.ptrCurr.textContent = state.curr ? state.curr.val : 'null';
    this.ptrPred.textContent = state.pred ? state.pred.val : 'null';
    this.updateStatus(state.message, state.phase);
    this.updateSpaceTracker(state.stackDepth);
    this.threads = state.threads || [];

    // Highlight active current pointer
    if (state.curr) {
      state.curr.borderColor = '#06b6d4';
      state.curr.glowColor = '#06b6d4';
      state.curr.color = '#0e7490';
    }

    // Highlight active predecessor pointer
    if (state.pred) {
      state.pred.borderColor = '#c084fc';
      state.pred.glowColor = '#c084fc';
      state.pred.color = '#6b21a8';
    }

    // Handle data extraction (Phase 2)
    if (state.extract) {
      state.extract.isProcessed = true;
      state.extract.color = '#065f46';
      state.extract.borderColor = '#10b981';
      state.extract.glowColor = '#10b981';
      
      this.appendOutputStream(state.extract.val);
    }
  }

  appendOutputStream(val) {
    const emptySpan = this.outputStream.querySelector('.empty-stream');
    if (emptySpan) emptySpan.remove();

    const nodeEl = document.createElement('span');
    nodeEl.className = 'stream-node';
    nodeEl.textContent = val;
    this.outputStream.appendChild(nodeEl);
    this.outputStream.scrollLeft = this.outputStream.scrollWidth;
  }

  updateStatus(message, phase) {
    this.statusText.textContent = message;
    
    // Update Phase legend indicators
    document.querySelectorAll('.phase-item').forEach(el => el.classList.remove('active-phase'));
    if (phase >= 1 && phase <= 3) {
      document.getElementById(`phase-${phase}-indicator`).classList.add('active-phase');
    }
  }

  updateSpaceTracker(stackDepth) {
    this.valStack.textContent = stackDepth;
    const percentage = Math.min(100, (stackDepth / (this.maxTreeDepth || 1)) * 100);
    this.barStack.style.width = `${percentage}%`;
  }

  startAutoPlay() {
    this.isPlaying = true;
    this.btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    this.btnPlay.classList.replace('btn-primary', 'btn-accent');
    
    const playStep = () => {
      if (!this.isPlaying) return;
      
      this.stepForward();
      if (this.btnStep.disabled) {
        this.pauseAutoPlay();
        return;
      }

      // Dynamic timing controlled by speed slider
      const delay = Math.max(200, 1500 / this.animSpeed);
      this.autoPlayTimeout = setTimeout(playStep, delay);
    };

    playStep();
  }

  pauseAutoPlay() {
    this.isPlaying = false;
    clearTimeout(this.autoPlayTimeout);
    this.btnPlay.innerHTML = '<i class="fa-solid fa-play"></i> Auto Play';
    this.btnPlay.classList.replace('btn-accent', 'btn-primary');
  }

  /* --- HTML5 Canvas Rendering Engine --- */

  startRenderLoop() {
    const render = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Update smooth physics transitions
      this.nodes.forEach(node => node.updatePhysics(0.15));
      
      // Draw standard structural tree edges
      this.drawStandardEdges(this.root);
      
      // Draw dynamic Morris threads (Dashed purple curves)
      this.drawThreadEdges();
      
      // Draw node entities above edges
      this.nodes.forEach(node => this.drawNode(node));

      this.animationFrameId = requestAnimationFrame(render);
    };

    render();
  }

  drawStandardEdges(node) {
    if (!node) return;

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    this.ctx.setLineDash([]);

    if (node.left && this.nodes.includes(node.left)) {
      this.ctx.beginPath();
      this.ctx.moveTo(node.x, node.y);
      this.ctx.lineTo(node.left.x, node.left.y);
      this.ctx.stroke();
      this.drawStandardEdges(node.left);
    }

    // Ignore threaded connections during structural rendering
    if (node.right && this.nodes.includes(node.right) && !this.isThreadLink(node, node.right)) {
      this.ctx.beginPath();
      this.ctx.moveTo(node.x, node.y);
      this.ctx.lineTo(node.right.x, node.right.y);
      this.ctx.stroke();
      this.drawStandardEdges(node.right);
    }
  }

  isThreadLink(fromNode, toNode) {
    return this.threads.some(t => t.from === fromNode && t.to === toNode);
  }

  drawThreadEdges() {
    this.threads.forEach(thread => {
      const { from, to } = thread;
      if (!from || !to) return;

      this.ctx.save();
      this.ctx.lineWidth = 2.5;
      this.ctx.strokeStyle = '#c084fc';
      this.ctx.setLineDash([6, 6]);
      this.ctx.shadowColor = '#c084fc';
      this.ctx.shadowBlur = 10;

      this.ctx.beginPath();
      this.ctx.moveTo(from.x, from.y);

      // Create sweeping Bezier arc curving upwards to clearly distinguish threads from tree edges
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const cpX = from.x + dx / 2 + (dx > 0 ? 40 : -40);
      const cpY = Math.min(from.y, to.y) - Math.abs(dx) * 0.3 - 30;

      this.ctx.quadraticCurveTo(cpX, cpY, to.x, to.y);
      this.ctx.stroke();
      
      // Draw directional arrow head pointing to ancestor root
      this.drawArrowHead(cpX, cpY, to.x, to.y);
      
      this.ctx.restore();
    });
  }

  drawArrowHead(fromX, fromY, toX, toY) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLen = 10;

    this.ctx.beginPath();
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    this.ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    this.ctx.closePath();
    this.ctx.fillStyle = '#c084fc';
    this.ctx.fill();
  }

  drawNode(node) {
    this.ctx.save();

    // Outer Glow Effect
    if (node.glowColor !== 'transparent') {
      this.ctx.shadowColor = node.glowColor;
      this.ctx.shadowBlur = 18;
    }

    // Node Circle Body
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = node.color;
    this.ctx.fill();

    // Node Border
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeStyle = node.borderColor;
    this.ctx.stroke();

    // Typography
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.font = '600 13px "Fira Code", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(node.val, node.x, node.y);

    this.ctx.restore();
  }
}

// Bootstrap Engine cleanly when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new MorrisVisualizer();
});
