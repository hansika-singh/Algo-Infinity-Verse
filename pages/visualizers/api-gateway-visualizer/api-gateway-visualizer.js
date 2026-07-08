document.addEventListener('DOMContentLoaded', () => {
  const btnSendRequest = document.getElementById('btnSendRequest');
  const btnReset = document.getElementById('btnReset');
  const packet = document.getElementById('dataPacket');
  const logOutput = document.getElementById('logOutput');
  const requestStatus = document.getElementById('requestStatus');

  const toggleJwt = document.getElementById('toggleJwt');
  const toggleRateLimit = document.getElementById('toggleRateLimit');
  const toggleCache = document.getElementById('toggleCache');

  const routeSelect = document.getElementById('routeSelect');
  const authSelect = document.getElementById('authSelect');

  const nodeClient = document.getElementById('nodeClient');
  const nodeAuth = document.getElementById('nodeAuth');
  const nodeLimit = document.getElementById('nodeLimit');
  const nodeRoute = document.getElementById('nodeRoute');
  const nodeCache = document.getElementById('nodeCache');

  const nodeServiceA = document.getElementById('nodeServiceA');
  const nodeServiceB = document.getElementById('nodeServiceB');

  let isAnimating = false;
  let rateLimitCounter = 0;

  // Reset rate limit every 5 seconds
  setInterval(() => {
    rateLimitCounter = 0;
  }, 5000);

  function setStatus(status, type) {
    requestStatus.textContent = status;
    requestStatus.className = `state-badge ${type}`;
  }

  function logMessage(msg, type = 'info') {
    const color = type === 'error' ? '#ef4444' : type === 'warn' ? '#f59e0b' : '#10b981';
    logOutput.innerHTML += `<br><span style="color:${color}">> ${msg}</span>`;
    logOutput.scrollTop = logOutput.scrollHeight;
  }

  function resetSimulation() {
    isAnimating = false;
    rateLimitCounter = 0;

    packet.style.opacity = '0';
    packet.style.transition = 'none';
    packet.style.left = '0%';
    packet.className = 'packet';
    packet.innerHTML = '<i class="fas fa-envelope"></i>';

    const allNodes = [
      nodeClient,
      nodeAuth,
      nodeLimit,
      nodeRoute,
      nodeCache,
      nodeServiceA,
      nodeServiceB,
    ];
    allNodes.forEach((n) => {
      n.classList.remove('pulse');
      n.classList.remove('pulse-error');
    });

    logOutput.innerHTML = '> Ready to receive requests...';
    setStatus('IDLE', '');

    // Force reflow
    void packet.offsetWidth;
    packet.style.transition = 'left 1s linear, top 1s linear, opacity 0.2s';
  }

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function sendRequest() {
    if (isAnimating) return;
    isAnimating = true;

    setStatus('PROCESSING', 'warn');
    logMessage('Client dispatched request to API Gateway...', 'info');

    // Setup Packet
    packet.className = 'packet';
    packet.innerHTML = '<i class="fas fa-envelope"></i>';
    packet.style.transition = 'none';
    packet.style.opacity = '1';
    packet.style.left = '0%';

    // Force reflow
    void packet.offsetWidth;
    packet.style.transition = 'left 1s linear, opacity 0.2s';

    // 1. Move to Gateway
    nodeClient.classList.add('pulse');
    packet.style.left = '50%'; // Middle of edge1
    await delay(1000);
    nodeClient.classList.remove('pulse');

    // 2. Auth Check
    nodeAuth.classList.add('pulse');
    await delay(500);
    if (toggleJwt.checked) {
      if (authSelect.value !== 'valid') {
        nodeAuth.classList.remove('pulse');
        nodeAuth.classList.add('pulse-error');
        packet.classList.add('error');
        logMessage(
          `Auth Failed: ${authSelect.value === 'none' ? 'Missing Token' : 'Invalid Token'}`,
          'error'
        );
        setStatus('401 UNAUTHORIZED', 'error');
        isAnimating = false;
        return;
      }
      logMessage('Auth Success: Valid JWT Verified.', 'info');
    } else {
      logMessage('Auth Skipped: JWT verification disabled.', 'warn');
    }
    nodeAuth.classList.remove('pulse');
    await delay(300);

    // 3. Rate Limit Check
    nodeLimit.classList.add('pulse');
    await delay(500);
    if (toggleRateLimit.checked) {
      rateLimitCounter++;
      if (rateLimitCounter > 2) {
        nodeLimit.classList.remove('pulse');
        nodeLimit.classList.add('pulse-error');
        packet.classList.add('error');
        logMessage(`Rate Limit Exceeded: ${rateLimitCounter} requests in window.`, 'error');
        setStatus('429 TOO MANY REQUESTS', 'error');
        isAnimating = false;
        return;
      }
      logMessage(`Rate Limit OK (${rateLimitCounter}/2).`, 'info');
    } else {
      logMessage('Rate Limiter Skipped.', 'warn');
    }
    nodeLimit.classList.remove('pulse');
    await delay(300);

    // 4. Cache Check
    nodeCache.classList.add('pulse');
    await delay(500);
    if (toggleCache.checked && routeSelect.value !== 'invalid') {
      logMessage('Cache Hit: Returning cached response.', 'info');
      packet.classList.add('success');
      setStatus('200 CACHED', 'success');
      nodeCache.classList.remove('pulse');
      isAnimating = false;
      return;
    } else if (toggleCache.checked) {
      logMessage('Cache Miss: Proceeding to route.', 'info');
    } else {
      logMessage('Cache Skipped.', 'warn');
    }
    nodeCache.classList.remove('pulse');
    await delay(300);

    // 5. Routing
    nodeRoute.classList.add('pulse');
    await delay(500);
    logMessage(`Routing to /api/${routeSelect.value}...`, 'info');
    nodeRoute.classList.remove('pulse');

    // Move to microservices
    packet.style.left = '100%';
    await delay(1000);

    // Target processing
    if (routeSelect.value === 'users') {
      nodeServiceA.classList.add('pulse');
      await delay(800);
      logMessage('Service A processed request successfully.', 'info');
      packet.classList.add('success');
      setStatus('200 OK', 'success');
      nodeServiceA.classList.remove('pulse');
    } else if (routeSelect.value === 'orders') {
      nodeServiceB.classList.add('pulse');
      await delay(800);
      logMessage('Service B processed request successfully.', 'info');
      packet.classList.add('success');
      setStatus('200 OK', 'success');
      nodeServiceB.classList.remove('pulse');
    } else {
      packet.classList.add('error');
      logMessage('404 Not Found: No matching route.', 'error');
      setStatus('404 NOT FOUND', 'error');
    }

    isAnimating = false;
  }

  btnSendRequest.addEventListener('click', sendRequest);
  btnReset.addEventListener('click', resetSimulation);
});
