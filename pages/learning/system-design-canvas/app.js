document.addEventListener('DOMContentLoaded', initApp);

const state = {
  nodes: [], // { id, type, x, y, name, icon, status: 'online'|'offline' }
  edges: [], // { id, sourceId, targetId }
  packets: [], // { id, edgeId, sourceId, targetId, progress: 0-1, status: 'active'|'dropped' }
  selectedNode: null,
  isSimulating: false,
  nextNodeId: 1,
};

const DOM = {
  workspace: document.getElementById('workspace'),
  nodesContainer: document.getElementById('nodesContainer'),
  canvas: document.getElementById('connectionCanvas'),
  emptyMsg: document.getElementById('workspaceEmptyMsg'),
  simulateBtn: document.getElementById('simulateBtn'),
  stopBtn: document.getElementById('stopBtn'),
  clearBtn: document.getElementById('clearBtn'),
};

let ctx;

function initApp() {
  ctx = DOM.canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  initDragAndDrop();

  DOM.simulateBtn.addEventListener('click', startSimulation);
  DOM.stopBtn.addEventListener('click', stopSimulation);
  DOM.clearBtn.addEventListener('click', clearCanvas);

  // Click outside to deselect
  DOM.workspace.addEventListener('click', (e) => {
    if (e.target === DOM.workspace || e.target === DOM.canvas) {
      selectNode(null);
    }
  });

  // Delegated node removal
  DOM.nodesContainer.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action="remove-node"]');
    if (el) {
      e.stopPropagation();
      removeNode(parseInt(el.dataset.nodeId));
    }
  });

  renderLoop();
}

function resizeCanvas() {
  const rect = DOM.workspace.getBoundingClientRect();
  DOM.canvas.width = rect.width;
  DOM.canvas.height = rect.height;
}

// --- DRAG AND DROP ---
function initDragAndDrop() {
  const items = document.querySelectorAll('.component-item');
  items.forEach((item) => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.dataset.type);
      e.dataTransfer.effectAllowed = 'copy';
    });
  });

  DOM.workspace.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  DOM.workspace.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    if (!type) return;

    const rect = DOM.workspace.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addNode(type, x, y);
  });
}

// --- NODE MANAGEMENT ---
const NODE_INFO = {
  client: { icon: 'fa-mobile-alt', name: 'Client' },
  dns: { icon: 'fa-globe', name: 'DNS' },
  lb: { icon: 'fa-network-wired', name: 'Load Balancer' },
  api: { icon: 'fa-door-open', name: 'API Gateway' },
  service: { icon: 'fa-server', name: 'Microservice' },
  'db-primary': { icon: 'fa-database', name: 'Primary DB' },
  'db-replica': { icon: 'fa-database', name: 'Replica DB' },
  cache: { icon: 'fa-bolt', name: 'Cache' },
  mq: { icon: 'fa-envelope', name: 'Message Queue' },
};

function addNode(type, x, y) {
  const info = NODE_INFO[type];
  const node = {
    id: state.nextNodeId++,
    type,
    x,
    y,
    name: info.name,
    icon: info.icon,
    status: 'online',
  };
  state.nodes.push(node);
  DOM.emptyMsg.style.display = 'none';
  renderNodes();
}

function removeNode(id) {
  state.nodes = state.nodes.filter((n) => n.id !== id);
  state.edges = state.edges.filter((e) => e.sourceId !== id && e.targetId !== id);
  state.packets = state.packets.filter((p) => p.sourceId !== id && p.targetId !== id);
  if (state.selectedNode && state.selectedNode.id === id) selectNode(null);
  if (state.nodes.length === 0) DOM.emptyMsg.style.display = 'block';
  renderNodes();
}

function renderNodes() {
  DOM.nodesContainer.innerHTML = '';
  state.nodes.forEach((node) => {
    const el = document.createElement('div');
    el.className = `canvas-node ${node.status === 'offline' ? 'offline' : ''} ${state.selectedNode && state.selectedNode.id === node.id ? 'selected' : ''}`;
    el.style.left = node.x + 'px';
    el.style.top = node.y + 'px';
    el.dataset.id = node.id;

    el.innerHTML = `
            <div class="node-delete" data-node-id="${node.id}" data-action="remove-node"><i class="fas fa-times"></i></div>
            <i class="fas ${node.icon}"></i>
            <span>${node.name}</span>
        `;

    // Interaction
    let isDragging = false;
    let startX, startY;

    el.addEventListener('mousedown', (e) => {
      if (e.target.closest('.node-delete')) return;
      isDragging = true;
      startX = e.clientX - node.x;
      startY = e.clientY - node.y;
      selectNode(node);
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      node.x = e.clientX - startX;
      node.y = e.clientY - startY;
      el.style.left = node.x + 'px';
      el.style.top = node.y + 'px';
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    el.addEventListener('dblclick', () => {
      node.status = node.status === 'online' ? 'offline' : 'online';
      renderNodes();
    });

    DOM.nodesContainer.appendChild(el);
  });
}

function selectNode(node) {
  if (state.selectedNode && node && state.selectedNode.id !== node.id) {
    // Attempt to connect
    addEdge(state.selectedNode.id, node.id);
    state.selectedNode = null;
  } else {
    state.selectedNode = node;
  }
  renderNodes();
}

// --- EDGES ---
function addEdge(sourceId, targetId) {
  // Prevent duplicate or self edges
  if (sourceId === targetId) return;
  if (
    state.edges.some(
      (e) =>
        (e.sourceId === sourceId && e.targetId === targetId) ||
        (e.sourceId === targetId && e.targetId === sourceId)
    )
  )
    return;

  state.edges.push({
    id: Date.now() + Math.random(),
    sourceId,
    targetId,
  });
}

function clearCanvas() {
  state.nodes = [];
  state.edges = [];
  state.packets = [];
  state.selectedNode = null;
  stopSimulation();
  DOM.emptyMsg.style.display = 'block';
  renderNodes();
}

// --- SIMULATION & CANVAS DRAWING ---
function startSimulation() {
  state.isSimulating = true;
  DOM.simulateBtn.style.display = 'none';
  DOM.stopBtn.style.display = 'block';
}

function stopSimulation() {
  state.isSimulating = false;
  state.packets = [];
  DOM.simulateBtn.style.display = 'block';
  DOM.stopBtn.style.display = 'none';
}

function renderLoop() {
  ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);

  // Draw Edges
  state.edges.forEach((edge) => {
    const source = state.nodes.find((n) => n.id === edge.sourceId);
    const target = state.nodes.find((n) => n.id === edge.targetId);
    if (!source || !target) return;

    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    if (state.isSimulating) {
      ctx.setLineDash([5, 10]);
      ctx.lineDashOffset = -(Date.now() / 50) % 15;
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.5)';
    }

    ctx.stroke();
  });

  if (state.isSimulating) {
    updateAndDrawPackets();
    spawnPackets();
  }

  requestAnimationFrame(renderLoop);
}

function spawnPackets() {
  // Spawn packets randomly from 'client' nodes
  if (Math.random() > 0.05) return; // Control spawn rate

  const clients = state.nodes.filter((n) => n.type === 'client');
  if (clients.length === 0) return;

  const client = clients[Math.floor(Math.random() * clients.length)];

  routePacketFrom(client);
}

function routePacketFrom(sourceNode) {
  // Find outbound edges
  const outboundEdges = state.edges.filter((e) => e.sourceId === sourceNode.id);
  if (outboundEdges.length === 0) return;

  let selectedEdge = outboundEdges[Math.floor(Math.random() * outboundEdges.length)];
  let targetNode = state.nodes.find((n) => n.id === selectedEdge.targetId);

  // LB Logic: Try to pick an online target
  if (sourceNode.type === 'lb') {
    const onlineTargets = outboundEdges
      .map((e) => ({ edge: e, node: state.nodes.find((n) => n.id === e.targetId) }))
      .filter((t) => t.node.status === 'online');

    if (onlineTargets.length > 0) {
      const t = onlineTargets[Math.floor(Math.random() * onlineTargets.length)];
      selectedEdge = t.edge;
      targetNode = t.node;
    }
  }

  state.packets.push({
    id: Date.now() + Math.random(),
    edgeId: selectedEdge.id,
    sourceId: sourceNode.id,
    targetId: targetNode.id,
    progress: 0,
    status: 'active',
  });
}

function updateAndDrawPackets() {
  const SPEED = 0.015;

  for (let i = state.packets.length - 1; i >= 0; i--) {
    const p = state.packets[i];

    if (p.status === 'dropped') {
      p.progress += SPEED * 0.5;
      if (p.progress > 1.2) {
        state.packets.splice(i, 1);
        continue;
      }
    } else {
      p.progress += SPEED;
    }

    const source = state.nodes.find((n) => n.id === p.sourceId);
    const target = state.nodes.find((n) => n.id === p.targetId);

    if (!source || !target) {
      state.packets.splice(i, 1);
      continue;
    }

    // Check arrival
    if (p.progress >= 1 && p.status === 'active') {
      if (target.status === 'offline') {
        p.status = 'dropped'; // Visual drop
      } else {
        // Arrived safely, remove packet and route further if not endpoint
        state.packets.splice(i, 1);
        if (['client', 'db-primary', 'db-replica', 'cache'].indexOf(target.type) === -1) {
          routePacketFrom(target);
        }
        continue;
      }
    }

    // Draw
    const x = source.x + (target.x - source.x) * Math.min(p.progress, 1);
    let y = source.y + (target.y - source.y) * Math.min(p.progress, 1);

    if (p.status === 'dropped') {
      y += (p.progress - 1) * 50; // Fall down
      ctx.globalAlpha = Math.max(0, 1 - (p.progress - 1) * 5);
    }

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = p.status === 'dropped' ? '#ef4444' : '#10b981';
    ctx.fill();
    ctx.globalAlpha = 1;

    if (p.status === 'active') {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#10b981';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}
