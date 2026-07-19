// Load Balancer Visualizer Logic

document.addEventListener('DOMContentLoaded', () => {
  // Predefined Client IPs for IP Hash and display
  const clientIPs = [
    '192.168.1.45',
    '10.0.0.122',
    '172.16.254.1',
    '192.168.1.99',
    '10.0.0.15',
    '8.8.8.8',
    '172.16.0.40',
  ];

  // Educational Explanations Data
  const algorithmInfo = {
    round_robin: {
      title: 'Round Robin',
      summary:
        'Requests are distributed sequentially across the list of servers. When it reaches the end of the list, it loops back to the beginning.',
      pros: [
        'Extremely simple to implement and understand.',
        'Zero state or connection tracking overhead.',
        'Works well if all servers have equal capacity.',
      ],
      cons: [
        'Assumes all servers have identical hardware specs.',
        'Assumes all requests place equal load on servers.',
        'Can overload slower servers in a heterogeneous cluster.',
      ],
      application:
        'Default routing in NGINX, HAProxy DNS round-robin, and basic cloud target groups.',
    },
    weighted_round_robin: {
      title: 'Weighted Round Robin',
      summary:
        'Allows assigning a weight to each server based on its capacity. Servers with higher weights receive a proportionally larger share of requests.',
      pros: [
        'Accounts for differences in server hardware capacity.',
        'Simple arithmetic calculation, keeping routing fast.',
        'Prevents weak servers from being overwhelmed.',
      ],
      cons: [
        'Weights must be statically configured (non-dynamic).',
        'Does not check real-time server load or response times.',
        'Long-lived sessions can still cause load imbalances.',
      ],
      application:
        'Weighted target groups in AWS Application Load Balancer, NGINX Upstream Weight.',
    },
    least_connections: {
      title: 'Least Connections',
      summary:
        'Routes requests to the server with the lowest number of active client connections. This is a dynamic load-balancing strategy.',
      pros: [
        'Highly effective for sessions of variable length.',
        'Naturally balances load when requests take different times to process.',
        'Adapts to server load variations in real time.',
      ],
      cons: [
        'Requires load balancer to track active connection state.',
        'Slower routing due to dynamic lookup of connection counters.',
        'Can send traffic to slow/failing servers that resolve connections slowly.',
      ],
      application:
        'Database proxy load-balancing, large file downloads, and long-lived websocket connections.',
    },
    least_response_time: {
      title: 'Least Response Time (Least Latency)',
      summary:
        'Routes incoming requests to the server with the lowest active connections AND the lowest average response time. Highly dynamic and adaptive.',
      pros: [
        'Ensures the fastest user experience by targeting quick servers.',
        'Naturally isolates slower or degraded servers.',
        'Balances both queue length and latency.',
      ],
      cons: [
        'High resource overhead on the load balancer to monitor latencies.',
        'Complex algorithms can lead to connection clustering on a single fast server.',
        'Requires continuous monitoring/pinging of backends.',
      ],
      application:
        'Advanced API gateways, global server load balancing (GSLB), and HAProxy backend optimizations.',
    },
    ip_hash: {
      title: 'IP Hash',
      summary:
        'Calculates a hash from the client IP address and maps it to a specific server. This guarantees that requests from the same client always reach the same backend.',
      pros: [
        'Provides easy session persistence (sticky sessions) without storing server-side state.',
        'Useful for applications requiring local session caching.',
        'Deterministic routing logic.',
      ],
      cons: [
        'Can lead to uneven traffic distribution (e.g. if many clients reside behind a single corporate NAT proxy).',
        'If a server crashes, its sticky clients must be redistributed, breaking their sessions.',
        'Incompatible with dynamic server scaling without complex virtual node hashing.',
      ],
      application:
        'Stateful web applications, shopping carts, and chat servers with local memory storage.',
    },
    random: {
      title: 'Random Selection',
      summary:
        'Routes requests to backends selected completely at random. Statistically, it distributes load evenly across identical servers over a large volume of requests.',
      pros: [
        'Completely stateless and overhead-free.',
        'Very fast decision time.',
        'Easy to implement in basic distributed environments.',
      ],
      cons: [
        'No guarantees of uniform distribution for small request counts.',
        'Does not account for server health degradation or capability differences.',
        'No session stickiness.',
      ],
      application:
        'Distributed microservice meshes (e.g., Istio, Envoy) when request volumes are very high.',
    },
  };

  // Initial State Variables
  let servers = [
    {
      id: 1,
      name: 'Server A',
      weight: 5,
      activeConnections: 0,
      responseTime: 250,
      isHealthy: true,
      totalProcessed: 0,
      totalFailed: 0,
    },
    {
      id: 2,
      name: 'Server B',
      weight: 3,
      activeConnections: 0,
      responseTime: 450,
      isHealthy: true,
      totalProcessed: 0,
      totalFailed: 0,
    },
    {
      id: 3,
      name: 'Server C',
      weight: 1,
      activeConnections: 0,
      responseTime: 650,
      isHealthy: true,
      totalProcessed: 0,
      totalFailed: 0,
    },
  ];

  let nextServerId = 4;
  let totalRequestsCount = 0;
  let totalSuccessfulCount = 0;
  let totalFailedCount = 0;

  let isPlaying = false;
  let trafficInterval = null;
  let requestRate = 5; // reqs per second
  let roundRobinIndex = 0;
  let weightedIndex = 0;

  // DOM Elements
  const algorithmSelect = document.getElementById('algorithmSelect');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const btnReset = document.getElementById('btnReset');
  const btnSingleRequest = document.getElementById('btnSingleRequest');
  const btnBurst = document.getElementById('btnBurst');
  const btnAddServer = document.getElementById('btnAddServer');
  const rateSlider = document.getElementById('rateSlider');
  const rateVal = document.getElementById('rateVal');
  const serverWeightInput = document.getElementById('serverWeightInput');
  const clientNodesContainer = document.getElementById('clientNodes');
  const serversGrid = document.getElementById('serversGrid');
  const loadBalancerNode = document.getElementById('loadBalancerNode');
  const lbAlgoTag = document.getElementById('lbAlgoTag');
  const animationOverlay = document.getElementById('animationOverlay');

  // Stats Displays
  const statTotalRequests = document.getElementById('statTotalRequests');
  const statActiveConnections = document.getElementById('statActiveConnections');
  const statSuccessful = document.getElementById('statSuccessful');
  const statFailed = document.getElementById('statFailed');

  // Educational Displays
  const eduTitle = document.getElementById('eduTitle');
  const eduSummary = document.getElementById('eduSummary');
  const eduPros = document.getElementById('eduPros');
  const eduCons = document.getElementById('eduCons');
  const eduApplication = document.getElementById('eduApplication');

  // 1. Initialize Clients
  function initClients() {
    clientNodesContainer.innerHTML = '';
    clientIPs.forEach((ip, idx) => {
      const node = document.createElement('div');
      node.className = 'client-node';
      node.id = `client-${idx}`;
      node.textContent = ip;
      clientNodesContainer.appendChild(node);
    });
  }

  // 2. Render Backend Servers
  function renderServers() {
    serversGrid.innerHTML = '';
    servers.forEach((server) => {
      const card = document.createElement('div');
      card.className = `server-card ${server.isHealthy ? '' : 'dead'}`;
      card.id = `server-card-${server.id}`;

      // Calculate utilization capacity percentage
      const maxConnLimit = 15;
      const utilPercent = Math.min(
        100,
        Math.round((server.activeConnections / maxConnLimit) * 100)
      );

      card.innerHTML = `
        <div class="server-header">
          <div class="server-title">
            <i class="fas fa-server"></i>
            <span>${server.name} (W: ${server.weight})</span>
          </div>
          <div class="status-indicator"></div>
        </div>
        <div class="server-metrics">
          <div class="metric">Connections: <span id="server-conn-${server.id}">${server.activeConnections}</span></div>
          <div class="metric">Response: <span>${server.responseTime}ms</span></div>
          <div class="metric">Processed: <span>${server.totalProcessed}</span></div>
          <div class="metric">Failed: <span>${server.totalFailed}</span></div>
        </div>
        <div class="server-utilization">
          <div class="utilization-bar">
            <div class="utilization-fill" style="width: ${utilPercent}%; background-color: ${getUtilColor(utilPercent)};"></div>
          </div>
        </div>
        <div class="server-actions">
          <button class="btn-mini ${server.isHealthy ? 'btn-mini-danger' : 'btn-mini-success'}" onclick="toggleServerHealth(${server.id})">
            ${server.isHealthy ? '<i class="fas fa-heart-crack"></i> Crash' : '<i class="fas fa-heart"></i> Recover'}
          </button>
          <button class="btn-mini btn-mini-danger" onclick="removeServer(${server.id})">
            <i class="fas fa-trash"></i> Remove
          </button>
        </div>
      `;
      serversGrid.appendChild(card);
    });
  }

  function getUtilColor(percent) {
    if (percent < 50) return 'var(--accent)';
    if (percent < 85) return 'var(--yellow)';
    return 'var(--red)';
  }

  // Expose health toggle & server deletion to window for inline onclick execution
  window.toggleServerHealth = function (serverId) {
    const server = servers.find((s) => s.id === serverId);
    if (server) {
      server.isHealthy = !server.isHealthy;
      if (!server.isHealthy) {
        // Drop any active connections on crash
        totalFailedCount += server.activeConnections;
        server.totalFailed += server.activeConnections;
        server.activeConnections = 0;
      }
      renderServers();
      updateStats();
    }
  };

  window.removeServer = function (serverId) {
    if (servers.length <= 1) {
      alert('Must keep at least one server in the cluster!');
      return;
    }
    const idx = servers.findIndex((s) => s.id === serverId);
    if (idx !== -1) {
      const removed = servers[idx];
      totalFailedCount += removed.activeConnections;
      servers.splice(idx, 1);
      renderServers();
      updateStats();
    }
  };

  // 3. Update Education Panel
  function updateEducation() {
    const algo = algorithmSelect.value;
    const info = algorithmInfo[algo];
    if (info) {
      eduTitle.textContent = info.title;
      eduSummary.textContent = info.summary;

      eduPros.innerHTML = '';
      info.pros.forEach((pro) => {
        const li = document.createElement('li');
        li.textContent = pro;
        eduPros.appendChild(li);
      });

      eduCons.innerHTML = '';
      info.cons.forEach((con) => {
        const li = document.createElement('li');
        li.textContent = con;
        eduCons.appendChild(li);
      });

      eduApplication.textContent = info.application;
      lbAlgoTag.textContent = info.title;
    }
  }

  // 4. Update Stats Displays
  function updateStats() {
    let currentActive = 0;
    servers.forEach((s) => (currentActive += s.activeConnections));

    statTotalRequests.textContent = totalRequestsCount;
    statActiveConnections.textContent = currentActive;
    statSuccessful.textContent = totalSuccessfulCount;
    statFailed.textContent = totalFailedCount;
  }

  // 5. Select Backend Server based on chosen algorithm
  function selectServer(clientIp) {
    const healthyServers = servers.filter((s) => s.isHealthy);
    if (healthyServers.length === 0) return null;

    const algo = algorithmSelect.value;

    if (algo === 'round_robin') {
      const target = healthyServers[roundRobinIndex % healthyServers.length];
      roundRobinIndex++;
      return target;
    } else if (algo === 'weighted_round_robin') {
      // Build weighted representation array: e.g. [S1, S1, S1, S2, S2]
      const weightedPool = [];
      healthyServers.forEach((server) => {
        for (let i = 0; i < server.weight; i++) {
          weightedPool.push(server);
        }
      });
      if (weightedPool.length === 0) return healthyServers[0];
      const target = weightedPool[weightedIndex % weightedPool.length];
      weightedIndex++;
      return target;
    } else if (algo === 'least_connections') {
      // Sort ascending by active connections
      healthyServers.sort((a, b) => a.activeConnections - b.activeConnections);
      return healthyServers[0];
    } else if (algo === 'least_response_time') {
      // Sort ascending by estimated queue latency: responseTime * (activeConnections + 1)
      healthyServers.sort((a, b) => {
        const scoreA = a.responseTime * (a.activeConnections + 1);
        const scoreB = b.responseTime * (b.activeConnections + 1);
        return scoreA - scoreB;
      });
      return healthyServers[0];
    } else if (algo === 'ip_hash') {
      // Hash IP address: sum characters
      let hash = 0;
      for (let i = 0; i < clientIp.length; i++) {
        hash += clientIp.charCodeAt(i);
      }
      return healthyServers[hash % healthyServers.length];
    } else if (algo === 'random') {
      const randIdx = Math.floor(Math.random() * healthyServers.length);
      return healthyServers[randIdx];
    }

    return null;
  }

  // 6. Handle Request Simulation & Animations
  function handleRequest() {
    totalRequestsCount++;
    updateStats();

    // Select random client IP and highlight node
    const clientIdx = Math.floor(Math.random() * clientIPs.length);
    const clientIp = clientIPs[clientIdx];
    const clientNode = document.getElementById(`client-${clientIdx}`);

    if (clientNode) {
      clientNode.classList.add('active');
      setTimeout(() => clientNode.classList.remove('active'), 250);
    }

    // Determine target server
    const targetServer = selectServer(clientIp);

    // Get coordinates relative to visualization container
    const vizRect = document.querySelector('.visualization-area').getBoundingClientRect();
    const clientRect = clientNode ? clientNode.getBoundingClientRect() : null;
    const lbRect = loadBalancerNode.getBoundingClientRect();

    // Create moving packet dot
    const packet = document.createElement('div');
    packet.className = 'packet';

    // Set initial position at client node
    let clientX = vizRect.width * 0.1;
    let clientY = vizRect.height * 0.5;
    if (clientRect) {
      clientX = clientRect.left - vizRect.left + clientRect.width / 2;
      clientY = clientRect.top - vizRect.top + clientRect.height / 2;
    }
    packet.style.left = `${clientX}px`;
    packet.style.top = `${clientY}px`;
    animationOverlay.appendChild(packet);

    // Calculate Load Balancer coordinates
    const lbX = lbRect.left - vizRect.left + lbRect.width / 2;
    const lbY = lbRect.top - vizRect.top + lbRect.height / 2;

    // First transition: Client -> Load Balancer
    setTimeout(() => {
      packet.style.left = `${lbX}px`;
      packet.style.top = `${lbY}px`;
    }, 10);

    // After reaching load balancer, determine target routing
    setTimeout(() => {
      // Trigger load balancer active state
      loadBalancerNode.classList.add('active');
      setTimeout(() => loadBalancerNode.classList.remove('active'), 200);

      if (targetServer) {
        // Target server card exists
        const serverCard = document.getElementById(`server-card-${targetServer.id}`);
        if (!serverCard || !targetServer.isHealthy) {
          // Fallback if server died during transmission path
          packet.classList.add('failed');
          totalFailedCount++;
          targetServer.totalFailed++;
          updateStats();
          animateFailedPacket(packet, lbX, lbY, vizRect);
          return;
        }

        const sRect = serverCard.getBoundingClientRect();
        const sX = sRect.left - vizRect.left + sRect.width / 2;
        const sY = sRect.top - vizRect.top + sRect.height / 2;

        // Increment server connections
        targetServer.activeConnections++;
        serverCard.classList.add('active');
        renderServers();
        updateStats();

        // Second transition: Load Balancer -> Backend Server
        packet.style.left = `${sX}px`;
        packet.style.top = `${sY}px`;

        // Process request on backend server
        setTimeout(() => {
          packet.remove();
          serverCard.classList.remove('active');

          // Hold connection for simulated processing duration
          setTimeout(() => {
            if (targetServer.isHealthy) {
              targetServer.activeConnections = Math.max(0, targetServer.activeConnections - 1);
              targetServer.totalProcessed++;
              totalSuccessfulCount++;
            } else {
              // Server died during processing
              targetServer.activeConnections = 0;
            }
            renderServers();
            updateStats();
          }, targetServer.responseTime);
        }, 400); // 400ms duration of visual transit from LB to Server
      } else {
        // No healthy servers (503 Service Unavailable)
        packet.classList.add('failed');
        totalFailedCount++;
        updateStats();
        animateFailedPacket(packet, lbX, lbY, vizRect);
      }
    }, 410); // 400ms duration of visual transit from Client to LB
  }

  function animateFailedPacket(packet, fromX, fromY, vizRect) {
    // Drop the packet downwards off the screen as a failure representation
    packet.style.top = `${vizRect.height + 20}px`;
    packet.style.left = `${fromX + (Math.random() * 40 - 20)}px`;
    setTimeout(() => {
      packet.remove();
    }, 400);
  }

  // 7. Dynamic Response Time Fluctuations
  setInterval(() => {
    servers.forEach((server) => {
      if (server.isHealthy) {
        // Fluctuate response times by up to +/- 10%
        const delta = Math.floor((Math.random() * 0.2 - 0.1) * server.responseTime);
        server.responseTime = Math.max(100, Math.min(1500, server.responseTime + delta));
      }
    });
    renderServers();
  }, 1500);

  // 8. Event Listeners
  algorithmSelect.addEventListener('change', () => {
    updateEducation();
    roundRobinIndex = 0;
    weightedIndex = 0;
  });

  btnPlayPause.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      btnPlayPause.innerHTML = '<i class="fas fa-pause"></i> Pause';
      btnPlayPause.classList.add('btn-secondary');
      btnPlayPause.classList.remove('btn-primary');
      startTraffic();
    } else {
      btnPlayPause.innerHTML = '<i class="fas fa-play"></i> Play';
      btnPlayPause.classList.add('btn-primary');
      btnPlayPause.classList.remove('btn-secondary');
      stopTraffic();
    }
  });

  function startTraffic() {
    stopTraffic();
    const intervalMs = 1000 / requestRate;
    trafficInterval = setInterval(handleRequest, intervalMs);
  }

  function stopTraffic() {
    if (trafficInterval) {
      clearInterval(trafficInterval);
      trafficInterval = null;
    }
  }

  rateSlider.addEventListener('input', (e) => {
    requestRate = parseInt(e.target.value);
    rateVal.textContent = requestRate;
    if (isPlaying) {
      startTraffic();
    }
  });

  btnReset.addEventListener('click', () => {
    stopTraffic();
    isPlaying = false;
    btnPlayPause.innerHTML = '<i class="fas fa-play"></i> Play';
    btnPlayPause.classList.add('btn-primary');
    btnPlayPause.classList.remove('btn-secondary');

    servers = [
      {
        id: 1,
        name: 'Server A',
        weight: 5,
        activeConnections: 0,
        responseTime: 250,
        isHealthy: true,
        totalProcessed: 0,
        totalFailed: 0,
      },
      {
        id: 2,
        name: 'Server B',
        weight: 3,
        activeConnections: 0,
        responseTime: 450,
        isHealthy: true,
        totalProcessed: 0,
        totalFailed: 0,
      },
      {
        id: 3,
        name: 'Server C',
        weight: 1,
        activeConnections: 0,
        responseTime: 650,
        isHealthy: true,
        totalProcessed: 0,
        totalFailed: 0,
      },
    ];
    nextServerId = 4;
    totalRequestsCount = 0;
    totalSuccessfulCount = 0;
    totalFailedCount = 0;
    roundRobinIndex = 0;
    weightedIndex = 0;

    // Clear animations overlay
    animationOverlay.innerHTML = '';

    renderServers();
    updateStats();
  });

  btnSingleRequest.addEventListener('click', () => {
    handleRequest();
  });

  btnBurst.addEventListener('click', () => {
    let count = 0;
    const burstTimer = setInterval(() => {
      handleRequest();
      count++;
      if (count >= 10) {
        clearInterval(burstTimer);
      }
    }, 80);
  });

  btnAddServer.addEventListener('click', () => {
    if (servers.length >= 6) {
      alert('Max limit of 6 servers reached for the visualization layout.');
      return;
    }
    const weight = Math.max(1, Math.min(10, parseInt(serverWeightInput.value) || 3));
    const name = `Server ${String.fromCharCode(64 + nextServerId)}`;

    // Pick a baseline response time
    const baselines = [300, 400, 500, 700];
    const respTime = baselines[Math.floor(Math.random() * baselines.length)];

    servers.push({
      id: nextServerId,
      name: name,
      weight: weight,
      activeConnections: 0,
      responseTime: respTime,
      isHealthy: true,
      totalProcessed: 0,
      totalFailed: 0,
    });
    nextServerId++;
    renderServers();
  });

  // 9. Initial Load setup
  initClients();
  renderServers();
  updateEducation();
  updateStats();
});
