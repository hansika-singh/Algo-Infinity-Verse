/**
 * Algo-Infinity-Verse | Dinic's Maximum Flow Algorithm Visualizer
 * Encapsulated Graph Engine. Simulates Level Graphs, DFS Pushing, and Dead-End Pruning.
 */

class FlowNode {
  constructor(id, label, isSource = false, isSink = false) {
    this.id = id;
    this.label = label;
    this.isSource = isSource;
    this.isSink = isSink;
    
    // Algorithm State
    this.level = -1;
    this.isDead = false; // Pruned in DFS
    
    // Physics / Rendering State
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.radius = 22;
    this.color = isSource ? '#047857' : (isSink ? '#b91c1c' : '#1e293b');
    this.borderColor = isSource ? '#10b981' : (isSink ? '#ef4444' : '#38bdf8');
    this.glowColor = 'transparent';
  }

  updatePhysics(speed = 0.1) {
    this.x += (this.targetX - this.x) * speed;
    this.y += (this.targetY - this.y) * speed;
  }
}

class FlowEdge {
  constructor(u, v, capacity, isResidual = false) {
    this.u = u;         // from node
    this.v = v;         // to node
    this.capacity = capacity;
    this.flow = 0;
    
    // Dinic specific
    this.isResidual = isResidual;
    this.reverseEdge = null; // Pointer to the anti-parallel edge
    
    // Visual State
    this.isActive = false;
    this.isPath = false;
  }
}

class DinicVisualizer {
  constructor() {
    this.canvas = document.getElementById('graph-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // DOM Controls
    this.btnPlay = document.getElementById('btn-play');
    this.btnStep = document.getElementById('btn-step');
    this.btnReset = document.getElementById('btn-reset');
    this.speedSlider = document.getElementById('speed-slider');
    this.speedVal = document.getElementById('speed-val');
    
    // Status Trackers
    this.statusText = document.getElementById('status-text');
    this.valMaxFlow = document.getElementById('val-max-flow');
    this.flowBar = document.getElementById('flow-bar');
    this.outputStream = document.getElementById('output-stream');

    // Engine State
    this.nodes = [];
    this.edges = [];
    this.adjacencyList = new Map();
    this.source = 0;
    this.sink = 5;
    
    this.totalFlow = 0;
    this.maxTheoreticalFlow = 20; // Specific to the hardcoded graph
    
    this.generator = null;
    this.isPlaying = false;
    this.animSpeed = 1.0;
    this.animationFrameId = null;

    this.init();
  }

  init() {
    this.bindEvents();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.buildDefaultGraph();
    this.startRenderLoop();
  }

  bindEvents() {
    this.btnPlay.addEventListener('click', () => {
      if (this.isPlaying) this.pauseAutoPlay();
      else this.startAutoPlay();
    });

    this.btnStep.addEventListener('click', () => {
      this.pauseAutoPlay();
      this.stepForward();
    });

    this.btnReset.addEventListener('click', () => {
      this.pauseAutoPlay();
      this.resetEngine();
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
    this.calculateInitialLayout();
  }

  /* --- Graph Construction --- */
  
  buildDefaultGraph() {
    this.nodes = [
      new FlowNode(0, 'S', true, false),
      new FlowNode(1, 'A'),
      new FlowNode(2, 'B'),
      new FlowNode(3, 'C'),
      new FlowNode(4, 'D'),
      new FlowNode(5, 'T', false, true)
    ];

    this.nodes.forEach(n => this.adjacencyList.set(n.id, []));

    // Construct Edges & Residuals simultaneously
    this.addEdge(0, 1, 10);
    this.addEdge(0, 2, 10);
    this.addEdge(1, 2, 2);
    this.addEdge(1, 3, 4);
    this.addEdge(1, 4, 8);
    this.addEdge(2, 4, 9);
    this.addEdge(4, 3, 6);
    this.addEdge(3, 5, 10);
    this.addEdge(4, 5, 10);

    this.resetEngine();
  }

  addEdge(uId, vId, capacity) {
    const forward = new FlowEdge(this.nodes[uId], this.nodes[vId], capacity, false);
    const backward = new FlowEdge(this.nodes[vId], this.nodes[uId], 0, true);
    
    forward.reverseEdge = backward;
    backward.reverseEdge = forward;

    this.edges.push(forward, backward);
    this.adjacencyList.get(uId).push(forward);
    this.adjacencyList.get(vId).push(backward);
  }

  calculateInitialLayout() {
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    
    // Organic, scattered layout before BFS stratification
    const positions = [
      { x: w * 0.1, y: h * 0.5 },    // S
      { x: w * 0.35, y: h * 0.25 },  // A
      { x: w * 0.35, y: h * 0.75 },  // B
      { x: w * 0.65, y: h * 0.25 },  // C
      { x: w * 0.65, y: h * 0.75 },  // D
      { x: w * 0.9, y: h * 0.5 }     // T
    ];

    this.nodes.forEach((n, i) => {
      n.targetX = positions[i].x;
      n.targetY = positions[i].y;
      if (!this.generator) { // Snap immediately on first load
        n.x = n.targetX;
        n.y = n.targetY;
      }
    });
  }

  /* --- Algorithm Engine (Generators) --- */

  *dinicAlgorithm() {
    this.totalFlow = 0;
    
    while (true) {
      // Phase 1: Build Level Graph via BFS
      yield* this.buildLevelGraph();
      
      // If sink is unreachable, algorithm terminates
      if (this.nodes[this.sink].level === -1) break;

      // Phase 2: Find blocking flow via DFS
      // Array to keep track of next edge to explore for each node (optimizes DFS)
      const ptr = new Array(this.nodes.length).fill(0);
      
      while (true) {
        const flowObj = { value: 0 };
        yield* this.findBlockingFlow(this.nodes[this.source], Infinity, ptr, flowObj, []);
        
        if (flowObj.value === 0) break; // Blocking flow completed
        
        this.totalFlow += flowObj.value;
        yield { type: 'flow', msg: `Pushed ${flowObj.value} units of flow! Total: ${this.totalFlow}`, phase: 2 };
      }
    }

    yield { type: 'done', msg: `Dinic's Complete! Maximum Flow is ${this.totalFlow}.`, phase: 0 };
  }

  *buildLevelGraph() {
    // Reset levels and visual states
    this.nodes.forEach(n => { n.level = -1; n.isDead = false; n.glowColor = 'transparent'; });
    this.edges.forEach(e => { e.isActive = false; e.isPath = false; });
    
    let queue = [this.nodes[this.source]];
    this.nodes[this.source].level = 0;

    yield { type: 'bfs', msg: 'Starting BFS to construct Level Graph.', phase: 1 };

    while (queue.length > 0) {
      let curr = queue.shift();
      curr.glowColor = '#c084fc';
      yield { type: 'bfs', msg: `BFS evaluating Node ${curr.label} (Level ${curr.level})`, phase: 1 };

      const neighbors = this.adjacencyList.get(curr.id);
      for (let edge of neighbors) {
        // Can only traverse if residual capacity > 0 and unvisited
        if (edge.capacity - edge.flow > 0 && edge.v.level === -1) {
          edge.v.level = curr.level + 1;
          edge.isActive = true;
          queue.push(edge.v);
          yield { type: 'bfs', msg: `Discovered Node ${edge.v.label}. Assigned Level ${edge.v.level}.`, phase: 1 };
          edge.isActive = false;
        }
      }
      curr.glowColor = 'transparent';
    }

    // Trigger Dynamic Relayout to visually stratify by BFS level
    this.realignLevelGraph();
    yield { type: 'layout', msg: 'Level Graph constructed. Stratifying nodes into columns by distance.', phase: 1 };
  }

  *findBlockingFlow(u, maxFlow, ptr, resultOut, pathEdges) {
    if (u.id === this.sink) {
      resultOut.value = maxFlow;
      return;
    }

    u.glowColor = '#0ea5e9'; // DFS Active color
    
    const neighbors = this.adjacencyList.get(u.id);
    
    for (; ptr[u.id] < neighbors.length; ptr[u.id]++) {
      let edge = neighbors[ptr[u.id]];
      
      // DFS explores only strict level progress (+1) and valid residual capacity
      if (edge.v.level === u.level + 1 && edge.capacity - edge.flow > 0 && !edge.v.isDead) {
        
        edge.isPath = true;
        pathEdges.push(edge);
        yield { type: 'dfs', msg: `DFS probing path: ${u.label} -> ${edge.v.label}`, phase: 2 };
        
        let minCap = Math.min(maxFlow, edge.capacity - edge.flow);
        yield* this.findBlockingFlow(edge.v, minCap, ptr, resultOut, pathEdges);
        
        if (resultOut.value > 0) {
          // Augment Flow
          edge.flow += resultOut.value;
          edge.reverseEdge.flow -= resultOut.value;
          u.glowColor = 'transparent';
          return;
        }
        
        // Backtrack
        edge.isPath = false;
        pathEdges.pop();
        yield { type: 'dfs', msg: `Backtracking from ${edge.v.label}`, phase: 2 };
      }
    }

    // Dead-end Pruning Optimization
    u.isDead = true;
    u.glowColor = 'transparent';
    if (u.id !== this.source) {
       yield { type: 'prune', msg: `Pruning Node ${u.label}. It cannot push flow to Sink.`, phase: 3 };
    }
  }

  realignLevelGraph() {
    // Group nodes by level
    const levels = {};
    let maxLevelFound = 0;
    
    this.nodes.forEach(n => {
      if (n.level === -1) return; // unreachable
      if (!levels[n.level]) levels[n.level] = [];
      levels[n.level].push(n);
      if (n.level > maxLevelFound) maxLevelFound = n.level;
    });

    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    
    const paddingX = w * 0.15;
    const availableW = w - (paddingX * 2);
    const colSpacing = maxLevelFound > 0 ? availableW / maxLevelFound : availableW;

    // Assign new physical targets based on level column
    for (let lvl = 0; lvl <= maxLevelFound; lvl++) {
      if (!levels[lvl]) continue;
      const colNodes = levels[lvl];
      const targetX = paddingX + (lvl * colSpacing);
      
      const rowSpacing = h / (colNodes.length + 1);
      colNodes.forEach((node, idx) => {
        node.targetX = targetX;
        node.targetY = rowSpacing * (idx + 1);
      });
    }

    // Scatter dead/unreachable nodes to bottom
    this.nodes.filter(n => n.level === -1).forEach((n, idx) => {
       n.targetX = w * 0.5 + (idx * 50);
       n.targetY = h * 0.9;
    });
  }

  /* --- UI Controllers --- */

  resetEngine() {
    this.edges.forEach(e => { e.flow = 0; e.isActive = false; e.isPath = false; });
    this.nodes.forEach(n => { n.level = -1; n.isDead = false; n.glowColor = 'transparent'; });
    
    this.totalFlow = 0;
    this.generator = this.dinicAlgorithm();
    
    this.updateUIStatus('Graph reset. Ready to run.', 0);
    this.updateMaxFlowTracker();
    this.outputStream.innerHTML = '<div class="log-entry">System initialized. Graph loaded.</div>';
    this.calculateInitialLayout(); // Return to scattered form
    
    this.btnStep.disabled = false;
    this.btnPlay.disabled = false;
  }

  stepForward() {
    if (!this.generator) return;
    const { value, done } = this.generator.next();

    if (done) {
      this.pauseAutoPlay();
      this.btnStep.disabled = true;
      this.btnPlay.disabled = true;
      return;
    }

    this.applyState(value);
  }

  applyState(state) {
    if (!state) return;

    this.updateUIStatus(state.msg, state.phase);
    
    // Log formatting
    let logHtml = `<span class="log-highlight">${state.msg}</span>`;
    if (state.type === 'prune') logHtml = `<span class="log-prune"><i class="fa-solid fa-scissors"></i> ${state.msg}</span>`;
    if (state.type === 'flow') logHtml = `<span class="log-flow"><i class="fa-solid fa-water"></i> ${state.msg}</span>`;
    
    this.appendLog(logHtml);
    
    if (state.type === 'flow') this.updateMaxFlowTracker();
  }

  appendLog(htmlStr) {
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = htmlStr;
    this.outputStream.appendChild(div);
    this.outputStream.scrollTop = this.outputStream.scrollHeight;
  }

  updateUIStatus(msg, phase) {
    this.statusText.textContent = msg;
    document.querySelectorAll('.phase-item').forEach(el => el.classList.remove('active-phase'));
    if (phase >= 1 && phase <= 3) {
      document.getElementById(`phase-${phase}-indicator`).classList.add('active-phase');
    }
  }

  updateMaxFlowTracker() {
    this.valMaxFlow.textContent = this.totalFlow;
    const percentage = Math.min(100, (this.totalFlow / this.maxTheoreticalFlow) * 100);
    this.flowBar.style.width = `${percentage}%`;
  }

  startAutoPlay() {
    this.isPlaying = true;
    this.btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    this.btnPlay.classList.replace('btn-primary', 'btn-accent');
    
    const tick = () => {
      if (!this.isPlaying) return;
      this.stepForward();
      
      if (this.btnStep.disabled) {
        this.pauseAutoPlay();
        return;
      }
      const delay = Math.max(100, 1000 / this.animSpeed);
      this.autoPlayTimeout = setTimeout(tick, delay);
    };
    tick();
  }

  pauseAutoPlay() {
    this.isPlaying = false;
    clearTimeout(this.autoPlayTimeout);
    this.btnPlay.innerHTML = '<i class="fa-solid fa-play"></i> Auto Play';
    this.btnPlay.classList.replace('btn-accent', 'btn-primary');
  }

  /* --- Canvas Graphics Engine --- */

  startRenderLoop() {
    const render = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Update Physics
      this.nodes.forEach(n => n.updatePhysics(0.15));
      
      // Render Edges
      this.edges.forEach(edge => {
        if (!edge.isResidual) this.drawForwardEdge(edge);
        else if (edge.flow < 0) this.drawReverseResidual(edge); // Only draw reverse if flow exists
      });
      
      // Render Nodes
      this.nodes.forEach(node => this.drawNode(node));

      this.animationFrameId = requestAnimationFrame(render);
    };
    render();
  }

  drawForwardEdge(edge) {
    const { u, v } = edge;
    this.ctx.save();
    
    // Styling based on state
    if (edge.isPath) {
      this.ctx.strokeStyle = '#0ea5e9'; // Active DFS Path
      this.ctx.lineWidth = 3;
      this.ctx.shadowColor = '#0ea5e9';
      this.ctx.shadowBlur = 10;
    } else if (edge.isActive) {
      this.ctx.strokeStyle = '#c084fc'; // Active BFS Edge
      this.ctx.lineWidth = 2.5;
    } else if (edge.capacity - edge.flow === 0) {
      this.ctx.strokeStyle = '#475569'; // Saturated
      this.ctx.lineWidth = 1;
    } else if (edge.v.isDead) {
       this.ctx.strokeStyle = '#334155'; // Leads to pruned node
       this.ctx.lineWidth = 1;
    } else {
      this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'; // Default
      this.ctx.lineWidth = 2;
    }

    // Draw Line
    this.ctx.beginPath();
    this.ctx.moveTo(u.x, u.y);
    this.ctx.lineTo(v.x, v.y);
    this.ctx.stroke();

    // Draw Arrow Head at target boundary
    this.drawArrowHead(u.x, u.y, v.x, v.y, u.radius + 2, this.ctx.strokeStyle);

    // Text Label (Flow / Cap)
    const midX = (u.x + v.x) / 2;
    const midY = (u.y + v.y) / 2;
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = (edge.capacity - edge.flow === 0) ? '#94a3b8' : '#f8fafc';
    this.ctx.font = '500 12px "Fira Code", monospace';
    this.ctx.textAlign = 'center';
    
    // Offset text slightly above line
    const angle = Math.atan2(v.y - u.y, v.x - u.x);
    this.ctx.fillText(`${edge.flow}/${edge.capacity}`, midX - Math.sin(angle)*15, midY + Math.cos(angle)*15);

    this.ctx.restore();
  }

  drawReverseResidual(edge) {
    // Residual edges curve heavily to avoid overlapping forward edges
    const { u, v } = edge; // Note: u and v are reversed relative to forward edge
    this.ctx.save();
    
    this.ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)'; // Green for backflow
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([4, 4]);

    const dx = v.x - u.x;
    const dy = v.y - u.y;
    // Curve control point
    const cpX = u.x + dx / 2 - dy * 0.3;
    const cpY = u.y + dy / 2 + dx * 0.3;

    this.ctx.beginPath();
    this.ctx.moveTo(u.x, u.y);
    this.ctx.quadraticCurveTo(cpX, cpY, v.x, v.y);
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  drawArrowHead(fromX, fromY, toX, toY, radius, color) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    // Move target back by node radius so arrow doesn't clip inside circle
    const endX = toX - radius * Math.cos(angle);
    const endY = toY - radius * Math.sin(angle);
    const headLen = 10;

    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
    this.ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  drawNode(node) {
    this.ctx.save();

    let bgColor = node.color;
    let borderColor = node.borderColor;

    if (node.isDead) {
      bgColor = '#1e293b';
      borderColor = '#475569'; // Dimmed when pruned
    } else if (node.glowColor !== 'transparent') {
      this.ctx.shadowColor = node.glowColor;
      this.ctx.shadowBlur = 15;
      borderColor = node.glowColor;
    }

    // Outer Circle
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = bgColor;
    this.ctx.fill();

    this.ctx.lineWidth = 2.5;
    this.ctx.strokeStyle = borderColor;
    this.ctx.stroke();

    // Text Label
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = node.isDead ? '#94a3b8' : '#f8fafc';
    this.ctx.font = '600 14px "Fira Code", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(node.label, node.x, node.y);
    
    // Level Badge (Top Right)
    if (node.level >= 0) {
      this.ctx.fillStyle = '#c084fc';
      this.ctx.font = 'bold 10px Inter';
      this.ctx.beginPath();
      this.ctx.arc(node.x + 16, node.y - 16, 8, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillText(`L${node.level}`, node.x + 16, node.y - 16);
    }

    this.ctx.restore();
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  new DinicVisualizer();
});
