// script.js
class CDNVisualizer {
  constructor() {
    this.edgeLocations = [
      { id: 'us-east', name: 'US East', x: 20, y: 30 },
      { id: 'us-west', name: 'US West', x: 15, y: 45 },
      { id: 'eu', name: 'Europe', x: 45, y: 20 },
      { id: 'asia', name: 'Asia', x: 70, y: 35 },
      { id: 'au', name: 'Australia', x: 85, y: 60 },
    ];

    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      originRequests: 0,
      totalLatency: 0,
      totalRequests: 0,
    };

    this.ttl = 30;
    this.requests = [];
    this.isAnimating = false;
    this.originServer = { x: 50, y: 70, name: 'Origin Server' };

    this.init();
  }

  init() {
    this.bindControls();
    this.renderGraph();
    this.updateStats();
    this.addLog('🚀 CDN initialized', 'info');
    this.simulateInitialRequests();
  }

  bindControls() {
    document.getElementById('userRegion').addEventListener('change', () => {
      this.renderGraph();
    });

    document.getElementById('ttlValue').addEventListener('change', (e) => {
      this.ttl = parseInt(e.target.value) || 30;
      this.addLog(`⏱️ TTL updated to ${this.ttl}s`, 'info');
    });

    document.getElementById('clearCacheBtn').addEventListener('click', () => {
      this.clearCache();
    });

    document.getElementById('purgeCacheBtn').addEventListener('click', () => {
      this.purgeCache();
    });

    document.getElementById('simulateTrafficBtn').addEventListener('click', () => {
      this.simulateTraffic();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      this.reset();
    });
  }

  getNearestEdge(region) {
    // Simulate geo-routing
    const edges = {
      'us-east': 'us-east',
      'us-west': 'us-west',
      'eu': 'eu',
      'asia': 'asia',
      'au': 'au',
    };
    return edges[region] || 'us-east';
  }

  requestAsset(assetId, region, fromSimulation = false) {
    if (this.isAnimating && !fromSimulation) return;
    this.isAnimating = true;

    const edgeId = this.getNearestEdge(region);
    const edge = this.edgeLocations.find(e => e.id === edgeId);
    const cacheKey = `${assetId}:${edgeId}`;

    this.addLog(`📤 Request: ${assetId} from ${region} (${edge.name})`, 'info');

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.ttl * 1000) {
        // Cache Hit
        this.stats.hits++;
        this.stats.totalRequests++;
        this.stats.totalLatency += 10;
        this.addLog(`✅ CACHE HIT: ${assetId} from ${edge.name} (${cached.timestamp})`, 'hit');
        this.animateHit(edge, assetId);
        this.isAnimating = false;
        this.updateStats();
        this.renderGraph();
        return;
      } else {
        this.addLog(`⏰ TTL Expired for ${assetId} at ${edge.name}`, 'info');
        this.cache.delete(cacheKey);
      }
    }

    // Cache Miss - Fetch from Origin
    this.stats.misses++;
    this.stats.originRequests++;
    this.stats.totalRequests++;
    const latency = 50 + Math.random() * 100;
    this.stats.totalLatency += latency;

    this.addLog(`❌ CACHE MISS: ${assetId} - Fetching from Origin`, 'miss');
    this.animateMiss(edge, assetId, latency);

    // Store in cache
    this.cache.set(cacheKey, {
      assetId,
      timestamp: Date.now(),
      edgeId,
      region,
    });

    this.addLog(`💾 Cached ${assetId} at ${edge.name} (TTL: ${this.ttl}s)`, 'info');
    this.isAnimating = false;
    this.updateStats();
    this.renderGraph();
  }

  animateHit(edge, assetId) {
    const svg = document.getElementById('cdnFlow');
    // Visual feedback for cache hit
    const hitCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hitCircle.setAttribute('cx', edge.x + '%');
    hitCircle.setAttribute('cy', edge.y + '%');
    hitCircle.setAttribute('r', '15');
    hitCircle.setAttribute('fill', '#4CAF50');
    hitCircle.setAttribute('opacity', '0.8');
    hitCircle.setAttribute('class', 'pulse');
    svg.appendChild(hitCircle);

    setTimeout(() => {
      hitCircle.remove();
    }, 1000);
  }

  animateMiss(edge, assetId, latency) {
    const svg = document.getElementById('cdnFlow');
    // Visual feedback for cache miss - show origin fetch
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const edgeX = (edge.x / 100) * svg.clientWidth;
    const edgeY = (edge.y / 100) * svg.clientHeight;
    const originX = (this.originServer.x / 100) * svg.clientWidth;
    const originY = (this.originServer.y / 100) * svg.clientHeight;

    path.setAttribute('d', `M ${edgeX} ${edgeY} L ${originX} ${originY}`);
    path.setAttribute('stroke', '#f44336');
    path.setAttribute('stroke-width', '3');
    path.setAttribute('stroke-dasharray', '5,5');
    svg.appendChild(path);

    setTimeout(() => {
      path.remove();
    }, latency);

    this.addLog(`⬆️ Origin fetch: ${assetId} (${Math.round(latency)}ms)`, 'origin');
  }

  clearCache() {
    this.cache.clear();
    this.addLog('🗑️ Cache cleared', 'purge');
    this.renderGraph();
    this.updateStats();
  }

  purgeCache() {
    // Simulate cache purge - remove oldest 50%
    const keys = Array.from(this.cache.keys());
    const toRemove = keys.slice(0, Math.floor(keys.length / 2));
    toRemove.forEach(key => this.cache.delete(key));
    this.addLog(`🔥 Cache purged: ${toRemove.length} items removed`, 'purge');
    this.renderGraph();
    this.updateStats();
  }

  simulateTraffic() {
    this.addLog('🚀 Simulating high traffic...', 'info');
    const assets = ['style.css', 'app.js', 'logo.png', 'data.json', 'index.html'];
    const regions = ['us-east', 'us-west', 'eu', 'asia', 'au'];

    for (let i = 0; i < 20; i++) {
      const asset = assets[Math.floor(Math.random() * assets.length)];
      const region = regions[Math.floor(Math.random() * regions.length)];
      setTimeout(() => {
        this.requestAsset(`${asset}${i}`, region, true);
      }, i * 200);
    }

    setTimeout(() => {
      this.addLog('✅ Traffic simulation complete', 'info');
    }, 5000);
  }

  reset() {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      originRequests: 0,
      totalLatency: 0,
      totalRequests: 0,
    };
    this.requests = [];
    document.getElementById('logMessages').innerHTML = '';
    this.addLog('🔄 Reset complete', 'info');
    this.renderGraph();
    this.updateStats();
  }

  simulateInitialRequests() {
    const assets = ['style.css', 'app.js', 'logo.png'];
    const regions = ['us-east', 'eu', 'asia'];
    assets.forEach((asset, i) => {
      setTimeout(() => {
        this.requestAsset(asset, regions[i % regions.length], true);
      }, i * 1000);
    });
  }

  renderGraph() {
    const svg = document.getElementById('cdnFlow');
    const width = svg.clientWidth || 800;
    const height = svg.clientHeight || 500;

    // Clear previous
    svg.innerHTML = '';

    // Background grid
    const grid = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    grid.setAttribute('width', '100%');
    grid.setAttribute('height', '100%');
    grid.setAttribute('fill', '#fafafa');
    grid.setAttribute('rx', '8');
    svg.appendChild(grid);

    // Draw connections from edge to origin
    this.edgeLocations.forEach(edge => {
      const edgeX = (edge.x / 100) * width;
      const edgeY = (edge.y / 100) * height;
      const originX = (this.originServer.x / 100) * width;
      const originY = (this.originServer.y / 100) * height;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', edgeX);
      line.setAttribute('y1', edgeY);
      line.setAttribute('x2', originX);
      line.setAttribute('y2', originY);
      line.setAttribute('stroke', '#ddd');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-dasharray', '4,4');
      svg.appendChild(line);
    });

    // Draw edge nodes
    this.edgeLocations.forEach(edge => {
      const x = (edge.x / 100) * width;
      const y = (edge.y / 100) * height;

      // Circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', '20');
      circle.setAttribute('fill', '#2196F3');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '3');
      svg.appendChild(circle);

      // Label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x);
      label.setAttribute('y', y + 35);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '10');
      label.setAttribute('fill', '#333');
      label.textContent = edge.name;
      svg.appendChild(label);

      // Cache indicator
      const cacheKey = Object.keys(this.cache).find(k => k.includes(edge.id));
      if (cacheKey) {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', x + 25);
        dot.setAttribute('cy', y - 25);
        dot.setAttribute('r', '6');
        dot.setAttribute('fill', '#4CAF50');
        svg.appendChild(dot);
      }
    });

    // Origin Server
    const ox = (this.originServer.x / 100) * width;
    const oy = (this.originServer.y / 100) * height;

    const originRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    originRect.setAttribute('x', ox - 40);
    originRect.setAttribute('y', oy - 20);
    originRect.setAttribute('width', '80');
    originRect.setAttribute('height', '40');
    originRect.setAttribute('fill', '#FF9800');
    originRect.setAttribute('rx', '8');
    originRect.setAttribute('stroke', '#fff');
    originRect.setAttribute('stroke-width', '3');
    svg.appendChild(originRect);

    const originLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    originLabel.setAttribute('x', ox);
    originLabel.setAttribute('y', oy + 5);
    originLabel.setAttribute('text-anchor', 'middle');
    originLabel.setAttribute('font-size', '12');
    originLabel.setAttribute('fill', '#fff');
    originLabel.setAttribute('font-weight', 'bold');
    originLabel.textContent = 'Origin Server';
    svg.appendChild(originLabel);

    // User indicator
    const region = document.getElementById('userRegion').value;
    const userEdge = this.edgeLocations.find(e => e.id === region);
    if (userEdge) {
      const ux = (userEdge.x / 100) * width;
      const uy = ((userEdge.y - 10) / 100) * height;

      const userRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      userRect.setAttribute('x', ux - 25);
      userRect.setAttribute('y', uy - 35);
      userRect.setAttribute('width', '50');
      userRect.setAttribute('height', '25');
      userRect.setAttribute('fill', '#9C27B0');
      userRect.setAttribute('rx', '12');
      svg.appendChild(userRect);

      const userLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      userLabel.setAttribute('x', ux);
      userLabel.setAttribute('y', uy - 18);
      userLabel.setAttribute('text-anchor', 'middle');
      userLabel.setAttribute('font-size', '10');
      userLabel.setAttribute('fill', '#fff');
      userLabel.textContent = '👤 User';
      svg.appendChild(userLabel);
    }
  }

  updateStats() {
    const total = this.stats.hits + this.stats.misses;
    const ratio = total > 0 ? Math.round((this.stats.hits / total) * 100) : 0;
    const avgLatency = this.stats.totalRequests > 0
      ? Math.round(this.stats.totalLatency / this.stats.totalRequests)
      : 0;

    document.getElementById('cacheHits').textContent = this.stats.hits;
    document.getElementById('cacheMisses').textContent = this.stats.misses;
    document.getElementById('hitRatio').textContent = `${ratio}%`;
    document.getElementById('originRequests').textContent = this.stats.originRequests;
    document.getElementById('avgLatency').textContent = `${avgLatency}ms`;
    document.getElementById('cachedAssets').textContent = this.cache.size;
  }

  addLog(message, type = 'info') {
    const container = document.getElementById('logMessages');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
    container.prepend(entry);

    // Keep only last 50 entries
    while (container.children.length > 50) {
      container.removeChild(container.lastChild);
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new CDNVisualizer();
});