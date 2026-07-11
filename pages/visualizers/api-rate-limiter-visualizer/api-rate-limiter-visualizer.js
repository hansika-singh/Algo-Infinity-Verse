document.addEventListener('DOMContentLoaded', () => {
  const btnSendRequest = document.getElementById('btnSendRequest');
  const btnBurst = document.getElementById('btnBurst');
  const btnReset = document.getElementById('btnReset');
  const logOutput = document.getElementById('logOutput');
  const requestStatus = document.getElementById('requestStatus');

  const algorithmSelect = document.getElementById('algorithmSelect');
  const capacityInput = document.getElementById('capacityInput');
  const refillRateInput = document.getElementById('refillRateInput');

  const bucketFill = document.getElementById('bucketFill');
  const bucketStatus = document.getElementById('bucketStatus');
  const requestsTrack = document.getElementById('requestsTrack');
  const refillRateContainer = document.getElementById('refillRateContainer');
  const capacityLabel = document.getElementById('capacityLabel');

  let state = {
    tokens: 0,
    capacity: 5,
    refillRate: 2,
    lastRefill: Date.now(),
    windowStart: Date.now(),
    requestCount: 0,
    slidingWindowLog: [],
  };

  function setStatus(status, type) {
    requestStatus.textContent = status;
    requestStatus.className = `state-badge ${type}`;
  }

  function logMessage(msg, type = 'info') {
    const color = type === 'error' ? '#ef4444' : type === 'warn' ? '#f59e0b' : '#10b981';
    logOutput.innerHTML += `<br><span style="color:${color}">> ${msg}</span>`;
    logOutput.scrollTop = logOutput.scrollHeight;
  }

  function updateVisuals() {
    let fillPercentage = 0;

    switch (algorithmSelect.value) {
      case 'token_bucket':
        fillPercentage = (state.tokens / state.capacity) * 100;
        bucketStatus.textContent = `Tokens: ${Math.floor(state.tokens)} / ${state.capacity}`;
        break;
      case 'leaky_bucket':
        // For leaky bucket, tokens represent "water" in the bucket
        fillPercentage = (state.tokens / state.capacity) * 100;
        bucketStatus.textContent = `Water: ${Math.floor(state.tokens)} / ${state.capacity}`;
        break;
      case 'fixed_window':
      case 'sliding_window':
        fillPercentage = (state.requestCount / state.capacity) * 100;
        bucketStatus.textContent = `Requests: ${state.requestCount} / ${state.capacity}`;
        break;
    }

    bucketFill.style.height = `${Math.min(100, Math.max(0, fillPercentage))}%`;
  }

  function updateLogic() {
    const now = Date.now();
    const algorithm = algorithmSelect.value;
    state.capacity = parseInt(capacityInput.value) || 5;
    state.refillRate = parseInt(refillRateInput.value) || 2;

    if (algorithm === 'token_bucket') {
      const elapsed = (now - state.lastRefill) / 1000;
      const tokensToAdd = elapsed * state.refillRate;

      if (tokensToAdd >= 1) {
        state.tokens = Math.min(state.capacity, state.tokens + tokensToAdd);
        state.lastRefill = now;
      }
    } else if (algorithm === 'leaky_bucket') {
      // Leak water over time
      const elapsed = (now - state.lastRefill) / 1000;
      const leaked = elapsed * state.refillRate;

      if (leaked >= 1) {
        state.tokens = Math.max(0, state.tokens - leaked);
        state.lastRefill = now;
      }
    } else if (algorithm === 'fixed_window') {
      // Reset window every 10 seconds for visualization purposes
      const windowSize = 10000;
      if (now - state.windowStart > windowSize) {
        state.windowStart = now;
        state.requestCount = 0;
        logMessage('--- New Fixed Window Started ---', 'info');
      }
    } else if (algorithm === 'sliding_window') {
      // Remove logs older than window size (10 seconds)
      const windowSize = 10000;
      state.slidingWindowLog = state.slidingWindowLog.filter((time) => now - time < windowSize);
      state.requestCount = state.slidingWindowLog.length;
    }

    updateVisuals();
  }

  function checkRateLimit() {
    const algorithm = algorithmSelect.value;
    const now = Date.now();
    let allowed = false;

    if (algorithm === 'token_bucket') {
      if (state.tokens >= 1) {
        state.tokens--;
        allowed = true;
      }
    } else if (algorithm === 'leaky_bucket') {
      if (state.tokens < state.capacity) {
        state.tokens++;
        allowed = true;
      }
    } else if (algorithm === 'fixed_window') {
      if (state.requestCount < state.capacity) {
        state.requestCount++;
        allowed = true;
      }
    } else if (algorithm === 'sliding_window') {
      if (state.slidingWindowLog.length < state.capacity) {
        state.slidingWindowLog.push(now);
        state.requestCount++;
        allowed = true;
      }
    }

    return allowed;
  }

  function handleAlgorithmChange() {
    const algo = algorithmSelect.value;
    if (algo === 'token_bucket' || algo === 'leaky_bucket') {
      refillRateContainer.style.display = 'flex';
      capacityLabel.textContent =
        algo === 'token_bucket' ? 'Bucket Capacity (Tokens)' : 'Bucket Capacity (Water)';
    } else {
      refillRateContainer.style.display = 'none';
      capacityLabel.textContent = 'Request Limit (per 10s window)';
    }
    resetSimulation();
  }

  function resetSimulation() {
    state.capacity = parseInt(capacityInput.value) || 5;
    state.refillRate = parseInt(refillRateInput.value) || 2;
    state.tokens = algorithmSelect.value === 'token_bucket' ? state.capacity : 0;
    state.lastRefill = Date.now();
    state.windowStart = Date.now();
    state.requestCount = 0;
    state.slidingWindowLog = [];

    requestsTrack.innerHTML = '';
    logOutput.innerHTML = '> Simulation reset. Ready to receive requests...';
    setStatus('IDLE', '');
    updateVisuals();
  }

  function animateRequest(isAllowed) {
    const req = document.createElement('div');
    req.className = 'req-packet';
    req.innerHTML = '<i class="fas fa-envelope"></i>';
    requestsTrack.appendChild(req);

    // Force reflow
    void req.offsetWidth;

    req.style.left = '80%';

    setTimeout(() => {
      if (isAllowed) {
        req.classList.add('accepted');
        req.style.left = '100%';
        req.style.opacity = '0';
      } else {
        req.classList.add('rejected');
      }

      setTimeout(() => {
        if (requestsTrack.contains(req)) {
          requestsTrack.removeChild(req);
        }
      }, 500);
    }, 500);
  }

  function sendSingleRequest() {
    const isAllowed = checkRateLimit();
    updateVisuals();

    if (isAllowed) {
      logMessage('Request Accepted (200 OK)', 'success');
      setStatus('200 OK', 'success');
    } else {
      logMessage('Request Throttled (429 Too Many Requests)', 'error');
      setStatus('429 TOO MANY REQUESTS', 'error');
    }

    animateRequest(isAllowed);
  }

  btnSendRequest.addEventListener('click', sendSingleRequest);

  btnBurst.addEventListener('click', () => {
    let count = 0;
    const interval = setInterval(() => {
      if (count >= 5) {
        clearInterval(interval);
        return;
      }
      sendSingleRequest();
      count++;
    }, 200);
  });

  btnReset.addEventListener('click', resetSimulation);
  algorithmSelect.addEventListener('change', handleAlgorithmChange);
  capacityInput.addEventListener('change', resetSimulation);
  refillRateInput.addEventListener('change', resetSimulation);

  // Initialize
  handleAlgorithmChange();
  setInterval(updateLogic, 100);
});
