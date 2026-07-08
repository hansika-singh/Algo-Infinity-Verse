document.addEventListener('DOMContentLoaded', () => {
  // --- State & DOM ---
  const hashRing = document.getElementById('hash-ring');
  const svg = document.getElementById('animation-svg');
  const appNode = document.getElementById('app-node');
  const dbNode = document.getElementById('db-node');

  const metricHits = document.getElementById('metric-hits');
  const metricMisses = document.getElementById('metric-misses');
  const metricRatio = document.getElementById('metric-ratio');
  const statusText = document.getElementById('main-status');

  let nodes = [];
  let hits = 0;
  let misses = 0;
  const MAX_NODES = 8;
  const MIN_NODES = 1;

  // --- Hash Function ---
  // Simple string hash function for consistent hashing simulation
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // --- Node Management ---
  class MemcachedNode {
    constructor(id, index, total) {
      this.id = id;
      this.cache = new Map(); // key -> { value, expireAt, timerId }
      this.element = document.createElement('div');
      this.element.className = 'memcached-node';
      this.element.id = `node-${id}`;
      this.element.innerHTML = `
                <i class="fas fa-server"></i>
                <span>Node ${id}</span>
                <div class="node-cache" id="cache-${id}"></div>
            `;
      hashRing.appendChild(this.element);
      this.updatePosition(index, total);
    }

    updatePosition(index, total) {
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      const radius = 150;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      this.element.style.transform = `translate(${x}px, ${y}px)`;
    }

    renderCache() {
      const cacheDiv = document.getElementById(`cache-${this.id}`);
      cacheDiv.innerHTML = '';
      if (this.cache.size === 0) {
        cacheDiv.innerHTML = '<em>Empty</em>';
        return;
      }
      this.cache.forEach((data, key) => {
        const remaining = Math.max(0, Math.ceil((data.expireAt - Date.now()) / 1000));
        const item = document.createElement('div');
        item.className = 'cache-item';
        item.innerHTML = `<span>${key}: ${data.value}</span><span class="ttl">${remaining}s</span>`;
        cacheDiv.appendChild(item);
      });
    }

    set(key, value, ttlSec) {
      if (this.cache.has(key)) {
        clearTimeout(this.cache.get(key).timerId);
      }
      const timerId = setTimeout(() => {
        this.cache.delete(key);
        this.renderCache();
      }, ttlSec * 1000);

      this.cache.set(key, {
        value,
        expireAt: Date.now() + ttlSec * 1000,
        timerId,
      });
      this.renderCache();
    }

    get(key) {
      if (this.cache.has(key)) {
        const data = this.cache.get(key);
        if (Date.now() > data.expireAt) {
          this.cache.delete(key);
          this.renderCache();
          return null; // Expired
        }
        return data.value;
      }
      return null;
    }

    delete(key) {
      if (this.cache.has(key)) {
        clearTimeout(this.cache.get(key).timerId);
        this.cache.delete(key);
        this.renderCache();
        return true;
      }
      return false;
    }

    clear() {
      this.cache.forEach((data) => clearTimeout(data.timerId));
      this.cache.clear();
      this.renderCache();
    }
  }

  function initCluster(count = 3) {
    hashRing.innerHTML = '';
    nodes = [];
    for (let i = 0; i < count; i++) {
      nodes.push(new MemcachedNode(i, i, count));
    }
    updateStatus();
  }

  function rebalanceNodes() {
    nodes.forEach((node, idx) => node.updatePosition(idx, nodes.length));
    updateStatus();
  }

  function addNode() {
    if (nodes.length >= MAX_NODES) return;
    const newId = nodes.length > 0 ? Math.max(...nodes.map((n) => n.id)) + 1 : 0;
    nodes.push(new MemcachedNode(newId, nodes.length, nodes.length + 1));
    rebalanceNodes();
    // In a real consistent hashing, keys would migrate. For simplicity, we just clear here or let them miss.
  }

  function removeNode() {
    if (nodes.length <= MIN_NODES) return;
    const node = nodes.pop();
    node.clear();
    node.element.remove();
    rebalanceNodes();
  }

  // --- Consistent Hashing Logic ---
  function getNodeForKey(key) {
    if (nodes.length === 0) return null;
    const hash = hashString(key);
    // Simple modulo for visualizer purposes instead of full ring mapping
    const nodeIndex = hash % nodes.length;
    return nodes[nodeIndex];
  }

  // --- Animations ---
  function animatePacket(startEl, endEl, colorClass, duration = 800) {
    return new Promise((resolve) => {
      const svgRect = svg.getBoundingClientRect();
      const startRect = startEl.getBoundingClientRect();
      const endRect = endEl.getBoundingClientRect();

      const startX = startRect.left + startRect.width / 2 - svgRect.left;
      const startY = startRect.top + startRect.height / 2 - svgRect.top;
      const endX = endRect.left + endRect.width / 2 - svgRect.left;
      const endY = endRect.top + endRect.height / 2 - svgRect.top;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '8');
      circle.setAttribute('class', `data-packet ${colorClass}`);
      svg.appendChild(circle);

      circle.animate(
        [
          { transform: `translate(${startX}px, ${startY}px)` },
          { transform: `translate(${endX}px, ${endY}px)` },
        ],
        {
          duration,
          easing: 'ease-in-out',
          fill: 'forwards',
        }
      ).onfinish = () => {
        circle.remove();
        resolve();
      };
    });
  }

  // --- Metrics ---
  function updateMetrics(isHit) {
    if (isHit !== null) {
      if (isHit) hits++;
      else misses++;
    }
    metricHits.textContent = hits;
    metricMisses.textContent = misses;
    const total = hits + misses;
    metricRatio.textContent = total === 0 ? '0%' : Math.round((hits / total) * 100) + '%';
  }

  function updateStatus() {
    statusText.textContent = `Status: Active | Nodes: ${nodes.length}`;
  }

  // --- Event Listeners ---
  document.getElementById('btn-add-node').addEventListener('click', addNode);
  document.getElementById('btn-remove-node').addEventListener('click', removeNode);
  document.getElementById('btn-reset').addEventListener('click', () => {
    hits = 0;
    misses = 0;
    updateMetrics(null);
    nodes.forEach((n) => n.clear());
    initCluster(3);
  });

  document.getElementById('btn-set').addEventListener('click', async () => {
    const key = document.getElementById('input-set-k').value.trim();
    const val = document.getElementById('input-set-v').value.trim();
    const ttl = parseInt(document.getElementById('input-set-ttl').value) || 10;

    if (!key || !val) {
      alert('Please provide Key and Value');
      return;
    }

    const node = getNodeForKey(key);
    if (!node) return;

    // Animate App -> Node
    await animatePacket(appNode, node.element, 'data-packet-hit');
    node.set(key, val, ttl);
    // Animate Node -> App (Ack)
    await animatePacket(node.element, appNode, 'data-packet-hit');
  });

  document.getElementById('btn-get').addEventListener('click', async () => {
    const key = document.getElementById('input-get-k').value.trim();
    if (!key) return;

    const node = getNodeForKey(key);
    if (!node) return;

    // Animate App -> Node
    await animatePacket(appNode, node.element, '');

    const val = node.get(key);
    if (val !== null) {
      // Cache Hit
      updateMetrics(true);
      await animatePacket(node.element, appNode, 'data-packet-hit');
    } else {
      // Cache Miss
      updateMetrics(false);
      // Animate Node -> DB
      await animatePacket(node.element, dbNode, 'data-packet-miss');
      // Animate DB -> Node
      await animatePacket(dbNode, node.element, 'data-packet-miss');
      node.set(key, 'DB_VAL', 10); // Simulate fetching from DB and caching
      // Animate Node -> App
      await animatePacket(node.element, appNode, 'data-packet-hit');
    }
  });

  document.getElementById('btn-delete').addEventListener('click', async () => {
    const key = document.getElementById('input-delete-k').value.trim();
    if (!key) return;

    const node = getNodeForKey(key);
    if (!node) return;

    await animatePacket(appNode, node.element, 'data-packet-hit');
    node.delete(key);
    await animatePacket(node.element, appNode, 'data-packet-hit');
  });

  // --- Init ---
  initCluster(3);

  // TTL auto-update interval for UI
  setInterval(() => {
    nodes.forEach((node) => node.renderCache());
  }, 1000);
});
