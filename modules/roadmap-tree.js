// roadmap-tree.js - Dynamic SVG Node Renderer for Individual Roadmaps
(function () {
  const layouts = {
    beginner: {
      nodes: [
        { id: 1, x: 300, y: 50 },
        { id: 2, x: 300, y: 150 },
        { id: 3, x: 150, y: 250 },
        { id: 4, x: 450, y: 250 },
        { id: 5, x: 80, y: 350 },
        { id: 6, x: 220, y: 350 },
        { id: 7, x: 450, y: 350 },
        { id: 8, x: 150, y: 450 },
        { id: 9, x: 450, y: 450 },
        { id: 10, x: 300, y: 550 },
      ],
      links: [
        { source: 1, target: 2 },
        { source: 2, target: 3 },
        { source: 2, target: 4 },
        { source: 3, target: 5 },
        { source: 3, target: 6 },
        { source: 4, target: 7 },
        { source: 5, target: 8 },
        { source: 6, target: 8 },
        { source: 7, target: 9 },
        { source: 8, target: 10 },
        { source: 9, target: 10 },
      ],
    },
    intermediate: {
      nodes: [
        { id: 1, x: 300, y: 50 },
        { id: 2, x: 300, y: 150 },
        { id: 3, x: 150, y: 250 },
        { id: 4, x: 450, y: 250 },
        { id: 5, x: 150, y: 350 },
        { id: 6, x: 450, y: 350 },
        { id: 7, x: 300, y: 450 },
        { id: 8, x: 300, y: 550 },
      ],
      links: [
        { source: 1, target: 2 },
        { source: 2, target: 3 },
        { source: 2, target: 4 },
        { source: 3, target: 5 },
        { source: 4, target: 6 },
        { source: 5, target: 7 },
        { source: 6, target: 7 },
        { source: 7, target: 8 },
      ],
    },
    advanced: {
      nodes: [
        { id: 1, x: 300, y: 50 },
        { id: 2, x: 300, y: 150 },
        { id: 3, x: 150, y: 250 },
        { id: 4, x: 450, y: 250 },
        { id: 5, x: 150, y: 350 },
        { id: 6, x: 450, y: 350 },
        { id: 7, x: 150, y: 450 },
        { id: 8, x: 450, y: 450 },
        { id: 9, x: 300, y: 550 },
        { id: 10, x: 300, y: 650 },
      ],
      links: [
        { source: 1, target: 2 },
        { source: 2, target: 3 },
        { source: 2, target: 4 },
        { source: 3, target: 5 },
        { source: 4, target: 6 },
        { source: 5, target: 7 },
        { source: 6, target: 8 },
        { source: 7, target: 9 },
        { source: 8, target: 9 },
        { source: 9, target: 10 },
      ],
    },
  };

  // Inject CSS styles
  const style = document.createElement('style');
  style.textContent = `
    .roadmap-visual-tree {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    .roadmap-svg {
      width: 100%;
      height: 600px;
      background: #0f0f15;
      border-radius: 12px;
      overflow: visible;
    }
    .tree-link {
      fill: none;
      stroke: #334155;
      stroke-width: 3;
      transition: stroke 0.3s;
    }
    .tree-link.active {
      stroke: #8b5cf6;
    }
    .tree-node {
      cursor: pointer;
    }
    .node-circle {
      fill: #1e293b;
      stroke: #475569;
      stroke-width: 3;
      transition: fill 0.2s, stroke 0.2s;
    }
    .tree-node:hover .node-circle {
      stroke: #94a3b8;
      fill: #1e2536;
    }
    .node-icon {
      font-family: "Font Awesome 6 Free";
      font-weight: 900;
      fill: #94a3b8;
      text-anchor: middle;
      dominant-baseline: central;
      font-size: 16px;
    }
    .tree-node:hover .node-icon {
      fill: #e2e2e8;
    }
    .node-label {
      fill: #cbd5e1;
      font-size: 12px;
      font-weight: 500;
      text-anchor: middle;
    }
    .node-num {
      fill: #64748b;
      font-size: 10px;
      text-anchor: middle;
      font-weight: bold;
    }
    .tree-detail-panel {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid rgba(148, 163, 184, 0.2);
      padding: 15px;
      border-radius: 12px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      z-index: 10;
      display: none;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, 10px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    .tree-detail-panel h4 {
      margin: 0 0 5px 0;
      color: #e2e2e8;
      font-size: 1.1rem;
    }
    .tree-detail-panel p {
      margin: 0 0 10px 0;
      font-size: 0.85rem;
      color: #cbd5e1;
      line-height: 1.4;
    }
    .tree-detail-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .tree-detail-meta span {
      background: rgba(255, 255, 255, 0.05);
      padding: 2px 8px;
      border-radius: 4px;
    }
    .view-toggle {
      display: flex;
      justify-content: center;
      margin: 1.5rem 0;
    }
    .view-toggle button {
      border: 1px solid #475569;
      background: #1e293b;
      color: #cbd5e1;
      padding: 8px 16px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .view-toggle button:first-child {
      border-top-left-radius: 8px;
      border-bottom-left-radius: 8px;
    }
    .view-toggle button:last-child {
      border-top-right-radius: 8px;
      border-bottom-right-radius: 8px;
      border-left: none;
    }
    .view-toggle button.active {
      background: #8b5cf6;
      border-color: #8b5cf6;
      color: #fff;
    }
  `;
  document.head.appendChild(style);

  window.initRoadmapTree = function (type, steps) {
    const layout = layouts[type];
    if (!layout) return;

    const container = document.getElementById('roadmapVisualTree');
    if (!container) return;

    // Create details panel inside container
    const panel = document.createElement('div');
    panel.className = 'tree-detail-panel';
    panel.innerHTML = `
      <h4 id="treeDetailTitle"></h4>
      <p id="treeDetailDesc"></p>
      <div class="tree-detail-meta">
        <span id="treeDetailDifficulty"></span>
        <span id="treeDetailTime"></span>
      </div>
    `;
    container.appendChild(panel);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'roadmap-svg');
    svg.setAttribute('viewBox', '0 0 600 700');
    svg.setAttribute('preserveAspectRatio', 'xMidYMin meet');
    container.appendChild(svg);

    // Draw Links
    layout.links.forEach((link) => {
      const sourceNode = layout.nodes.find((n) => n.id === link.source);
      const targetNode = layout.nodes.find((n) => n.id === link.target);
      if (sourceNode && targetNode) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dy = targetNode.y - sourceNode.y;
        const cx1 = sourceNode.x;
        const cy1 = sourceNode.y + dy / 2;
        const cx2 = targetNode.x;
        const cy2 = targetNode.y - dy / 2;
        path.setAttribute(
          'd',
          `M ${sourceNode.x} ${sourceNode.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${targetNode.x} ${targetNode.y}`
        );
        path.setAttribute('class', 'tree-link');
        svg.appendChild(path);
      }
    });

    // Draw Nodes
    layout.nodes.forEach((node) => {
      const step = steps[node.id - 1];
      if (!step) return;

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'tree-node');
      group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
      group.setAttribute('tabindex', '0');
      group.setAttribute('role', 'button');
      group.setAttribute('aria-label', `${step.title}, ${step.difficulty || 'Medium'} difficulty`);

      // Circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '24');
      circle.setAttribute('class', 'node-circle');
      group.appendChild(circle);

      // Icon
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      icon.setAttribute('class', 'node-icon');
      const iconUnicode = getIconUnicode(step.icon);
      icon.textContent = iconUnicode;
      group.appendChild(icon);

      // Label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('class', 'node-label');
      label.setAttribute('y', '38');
      const shortTitle = step.title.length > 20 ? step.title.substring(0, 18) + '..' : step.title;
      label.textContent = shortTitle;
      group.appendChild(label);

      // Node number
      const num = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      num.setAttribute('class', 'node-num');
      num.setAttribute('y', '-30');
      num.textContent = `#${node.id.toString().padStart(2, '0')}`;
      group.appendChild(num);

      // Click Event
      const showDetail = (e) => {
        e.stopPropagation();
        document.getElementById('treeDetailTitle').textContent = step.title;
        document.getElementById('treeDetailDesc').textContent = step.desc;
        document.getElementById('treeDetailDifficulty').textContent = step.difficulty || 'Medium';
        document.getElementById('treeDetailTime').textContent = step.estimatedTime || 'N/A';
        panel.style.display = 'block';
      };
      group.addEventListener('click', showDetail);
      group.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') showDetail(e);
      });

      svg.appendChild(group);
    });

    // Close panel when clicking outside
    svg.addEventListener('click', () => {
      panel.style.display = 'none';
    });
  };

  function getIconUnicode(iconClass) {
    const map = {
      'fa-code': '\uf121',
      'fa-clock': '\uf017',
      'fa-th': '\uf00a',
      'fa-font': '\uf031',
      'fa-search': '\uf002',
      'fa-sort': '\uf0dc',
      'fa-hashtag': '\uf292',
      'fa-recycle': '\uf1b8',
      'fa-layer-group': '\uf5fd',
      'fa-trophy': '\uf091',
      'fa-link': '\uf0c1',
      'fa-sitemap': '\uf0e8',
      'fa-mountain': '\uf6fc',
      'fa-project-diagram': '\uf542',
      'fa-bolt': '\uf0e7',
      'fa-brain': '\uf5dc',
      'fa-puzzle-piece': '\uf12e',
      'fa-tree': '\uf1bb',
      'fa-network-wired': '\uf6ff',
      'fa-compress-arrows-alt': '\uf78c',
      'fa-random': '\uf074',
      'fa-chess': '\uf439',
      'fa-cubes': '\uf1b3',
      'fa-laptop-code': '\uf5fc',
    };
    return map[iconClass] || '\uf0e8';
  }
})();
