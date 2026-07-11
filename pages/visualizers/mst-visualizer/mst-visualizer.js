document.addEventListener('DOMContentLoaded', () => {
  const kruskalSvg = document.getElementById('kruskalSvg');
  const primSvg = document.getElementById('primSvg');
  const kruskalLog = document.getElementById('kruskalLog');
  const primLog = document.getElementById('primLog');

  const addNodeBtn = document.getElementById('addNodeBtn');
  const addEdgeBtn = document.getElementById('addEdgeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const startBtn = document.getElementById('startBtn');
  const speedRange = document.getElementById('speedRange');

  let mode = 'addNode'; // "addNode" or "addEdge"
  let nodes = [];
  let edges = [];
  let nextNodeId = 0;
  let selectedNode = null;
  let isRunning = false;

  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Event Listeners for controls
  addNodeBtn.addEventListener('click', () => {
    if (isRunning) return;
    mode = 'addNode';
    addNodeBtn.classList.add('active');
    addEdgeBtn.classList.remove('active');
    selectedNode = null;
  });

  addEdgeBtn.addEventListener('click', () => {
    if (isRunning) return;
    mode = 'addEdge';
    addEdgeBtn.classList.add('active');
    addNodeBtn.classList.remove('active');
  });

  clearBtn.addEventListener('click', () => {
    if (isRunning) return;
    nodes = [];
    edges = [];
    nextNodeId = 0;
    selectedNode = null;
    kruskalLog.textContent = 'Waiting to start...';
    primLog.textContent = 'Waiting to start...';
    drawGraph();
  });

  const getEventCoordinates = (e, svg) => {
    const rect = svg.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Add click listeners to only ONE canvas (Kruskal) to build the graph,
  // but let's allow both for convenience
  const handleSvgClick = (e, svg) => {
    if (isRunning) return;
    const { x, y } = getEventCoordinates(e, svg);

    if (mode === 'addNode') {
      // Check collision
      const overlap = nodes.find((n) => Math.hypot(n.x - x, n.y - y) < 40);
      if (!overlap) {
        nodes.push({ id: nextNodeId++, x, y });
        drawGraph();
      }
    }
  };

  kruskalSvg.addEventListener('click', (e) => handleSvgClick(e, kruskalSvg));
  primSvg.addEventListener('click', (e) => handleSvgClick(e, primSvg));

  // Node clicking for edges is handled by event delegation in drawGraph
  const handleNodeClick = (nodeId) => {
    if (isRunning || mode !== 'addEdge') return;

    if (selectedNode === null) {
      selectedNode = nodeId;
      drawGraph(); // Just to highlight
    } else {
      if (selectedNode !== nodeId) {
        // Check if edge exists
        const exists = edges.find(
          (e) =>
            (e.u === selectedNode && e.v === nodeId) || (e.v === selectedNode && e.u === nodeId)
        );
        if (!exists) {
          const weight = parseInt(prompt('Enter edge weight (positive integer):', '1'), 10);
          if (!isNaN(weight) && weight > 0) {
            edges.push({
              id: `e-${selectedNode}-${nodeId}`,
              u: selectedNode,
              v: nodeId,
              weight,
            });
          }
        }
      }
      selectedNode = null;
      drawGraph();
    }
  };

  const getDelay = () => parseInt(speedRange.value, 10);
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Graph Drawing
  function drawGraph() {
    kruskalSvg.innerHTML = '';
    primSvg.innerHTML = '';

    // Draw on both
    renderToSvg(kruskalSvg, 'kruskal');
    renderToSvg(primSvg, 'prim');
  }

  function renderToSvg(svg, algPrefix) {
    // Draw edges first so they are under nodes
    edges.forEach((edge) => {
      const u = nodes.find((n) => n.id === edge.u);
      const v = nodes.find((n) => n.id === edge.v);

      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', u.x);
      line.setAttribute('y1', u.y);
      line.setAttribute('x2', v.x);
      line.setAttribute('y2', v.y);
      line.classList.add('edge-line');
      line.id = `${algPrefix}-edge-${edge.id}`;
      svg.appendChild(line);

      // Edge weight
      const midX = (u.x + v.x) / 2;
      const midY = (u.y + v.y) / 2;

      const bg = document.createElementNS(SVG_NS, 'rect');
      bg.setAttribute('x', midX - 10);
      bg.setAttribute('y', midY - 10);
      bg.setAttribute('width', 20);
      bg.setAttribute('height', 20);
      bg.classList.add('edge-text-bg');

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', midX);
      text.setAttribute('y', midY);
      text.textContent = edge.weight;
      text.classList.add('edge-text');

      svg.appendChild(bg);
      svg.appendChild(text);
    });

    // Draw nodes
    nodes.forEach((node) => {
      const g = document.createElementNS(SVG_NS, 'g');
      g.style.cursor = mode === 'addEdge' ? 'pointer' : 'default';

      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', node.x);
      circle.setAttribute('cy', node.y);
      circle.setAttribute('r', 15);
      circle.classList.add('node-circle');
      circle.id = `${algPrefix}-node-${node.id}`;

      if (node.id === selectedNode) {
        circle.classList.add('node-considering');
      }

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', node.x);
      text.setAttribute('y', node.y);
      text.textContent = node.id;
      text.classList.add('node-text');

      g.appendChild(circle);
      g.appendChild(text);

      g.addEventListener('click', (e) => {
        e.stopPropagation();
        handleNodeClick(node.id);
      });

      svg.appendChild(g);
    });
  }

  // --- Kruskal's Algorithm ---
  class UnionFind {
    constructor(size) {
      this.parent = Array.from({ length: size }, (_, i) => i);
    }
    find(i) {
      if (this.parent[i] === i) return i;
      return (this.parent[i] = this.find(this.parent[i]));
    }
    union(i, j) {
      const rootI = this.find(i);
      const rootJ = this.find(j);
      if (rootI !== rootJ) {
        this.parent[rootI] = rootJ;
        return true;
      }
      return false;
    }
  }

  async function runKruskal() {
    if (nodes.length === 0) return;
    const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
    const uf = new UnionFind(nextNodeId);
    let mstWeight = 0;

    kruskalLog.textContent = 'Sorted edges by weight. Starting...';
    await delay(getDelay());

    for (let edge of sortedEdges) {
      const edgeEl = document.getElementById(`kruskal-edge-${edge.id}`);
      if (edgeEl) edgeEl.classList.add('edge-considering');

      kruskalLog.textContent = `Considering edge (${edge.u}-${edge.v}) weight ${edge.weight}`;
      await delay(getDelay());

      if (uf.union(edge.u, edge.v)) {
        if (edgeEl) {
          edgeEl.classList.remove('edge-considering');
          edgeEl.classList.add('edge-accepted');
        }
        mstWeight += edge.weight;

        document.getElementById(`kruskal-node-${edge.u}`).classList.add('node-visited');
        document.getElementById(`kruskal-node-${edge.v}`).classList.add('node-visited');

        kruskalLog.textContent = `Added edge (${edge.u}-${edge.v}). No cycle formed.`;
      } else {
        if (edgeEl) {
          edgeEl.classList.remove('edge-considering');
          edgeEl.classList.add('edge-rejected');
        }
        kruskalLog.textContent = `Rejected edge (${edge.u}-${edge.v}). Forms a cycle.`;
      }
      await delay(getDelay());
    }
    kruskalLog.textContent = `Finished! Total MST Weight: ${mstWeight}`;
  }

  // --- Prim's Algorithm ---
  async function runPrim() {
    if (nodes.length === 0) return;

    // Convert to adjacency list
    const adj = {};
    nodes.forEach((n) => (adj[n.id] = []));
    edges.forEach((e) => {
      adj[e.u].push({ node: e.v, weight: e.weight, id: e.id });
      adj[e.v].push({ node: e.u, weight: e.weight, id: e.id });
    });

    const visited = new Set();
    const pq = []; // Simple array acting as PQ
    let mstWeight = 0;

    // Start with node 0 (or first available)
    const startNode = nodes[0].id;
    visited.add(startNode);
    document.getElementById(`prim-node-${startNode}`).classList.add('node-visited');

    // Add initial edges
    adj[startNode].forEach((e) => pq.push({ u: startNode, v: e.node, weight: e.weight, id: e.id }));

    primLog.textContent = `Starting at Node ${startNode}...`;
    await delay(getDelay());

    while (pq.length > 0 && visited.size < nodes.length) {
      // Sort PQ descending, pop last for min
      pq.sort((a, b) => b.weight - a.weight);
      const minEdge = pq.pop();

      if (visited.has(minEdge.v)) continue;

      const edgeEl = document.getElementById(`prim-edge-${minEdge.id}`);
      if (edgeEl) edgeEl.classList.add('edge-considering');

      primLog.textContent = `Considering edge (${minEdge.u}-${minEdge.v}) weight ${minEdge.weight}`;
      await delay(getDelay());

      // Accept edge
      visited.add(minEdge.v);
      mstWeight += minEdge.weight;

      if (edgeEl) {
        edgeEl.classList.remove('edge-considering');
        edgeEl.classList.add('edge-accepted');
      }
      document.getElementById(`prim-node-${minEdge.v}`).classList.add('node-visited');
      primLog.textContent = `Added edge (${minEdge.u}-${minEdge.v}) to MST.`;

      // Add new edges to PQ
      adj[minEdge.v].forEach((e) => {
        if (!visited.has(e.node)) {
          pq.push({ u: minEdge.v, v: e.node, weight: e.weight, id: e.id });
        }
      });

      await delay(getDelay());
    }
    primLog.textContent = `Finished! Total MST Weight: ${mstWeight}`;
  }

  // --- Start Execution ---
  startBtn.addEventListener('click', async () => {
    if (isRunning || edges.length === 0) return;
    isRunning = true;
    startBtn.disabled = true;
    addNodeBtn.disabled = true;
    addEdgeBtn.disabled = true;
    clearBtn.disabled = true;

    // Reset visual state but keep geometry
    drawGraph();

    // Run both simultaneously
    await Promise.all([runKruskal(), runPrim()]);

    isRunning = false;
    startBtn.disabled = false;
    addNodeBtn.disabled = false;
    addEdgeBtn.disabled = false;
    clearBtn.disabled = false;
  });

  // Init empty
  drawGraph();
});
