document.addEventListener('DOMContentLoaded', () => {
  const btnSendRequest = document.getElementById('btnSendRequest');
  const btnReset = document.getElementById('btnReset');
  const packet = document.getElementById('dataPacket');
  const logOutput = document.getElementById('logOutput');
  const requestStatus = document.getElementById('requestStatus');

  const toggleMtls = document.getElementById('toggleMtls');
  const toggleRetry = document.getElementById('toggleRetry');
  const toggleCircuitBreaker = document.getElementById('toggleCircuitBreaker');
  const targetStatus = document.getElementById('targetStatus');

  const clientSidecar = document.querySelector('.client-sidecar');
  const serverSidecar = document.querySelector('.server-sidecar');

  let isAnimating = false;
  let circuitOpen = false;

  function setStatus(status, type) {
    requestStatus.textContent = status;
    requestStatus.className = `state-badge ${type}`;
  }

  function logMessage(msg) {
    logOutput.innerHTML += `<br>- ${msg}`;
  }

  function resetSimulation() {
    isAnimating = false;
    circuitOpen = false;
    packet.style.opacity = '0';
    packet.style.transition = 'none';
    packet.style.left = '0%';
    packet.className = 'packet';
    packet.innerHTML = '<i class="fas fa-envelope"></i>';

    clientSidecar.classList.remove('pulse');
    serverSidecar.classList.remove('pulse');

    logOutput.innerHTML = 'Ready to send request.';
    setStatus('IDLE', '');

    // Force reflow
    void packet.offsetWidth;
    packet.style.transition = 'left 1.5s linear, opacity 0.2s';
  }

  async function sendRequest(attempt = 1) {
    if (isAnimating && attempt === 1) return;
    isAnimating = true;

    if (attempt === 1) logOutput.innerHTML = 'Starting request...';

    const useMtls = toggleMtls.checked;
    const useCb = toggleCircuitBreaker.checked;
    const target = targetStatus.value;
    const maxRetries = toggleRetry.checked ? 3 : 1;

    // Circuit Breaker Check
    if (useCb && circuitOpen) {
      logMessage('Circuit Breaker is OPEN. Request rejected immediately.');
      setStatus('FAILED FAST', 'error');
      isAnimating = false;
      return;
    }

    logMessage(`Attempt ${attempt}: Service A -> Proxy A`);
    clientSidecar.classList.add('pulse');

    // Setup Packet
    packet.style.opacity = '1';
    packet.style.left = '0%';
    if (useMtls) {
      packet.classList.add('mtls');
      packet.innerHTML = '<i class="fas fa-lock"></i>';
      logMessage('Proxy A encrypted payload (mTLS).');
    } else {
      packet.classList.remove('mtls');
      packet.innerHTML = '<i class="fas fa-envelope"></i>';
    }

    // Animate across network
    await new Promise((resolve) => {
      setTimeout(() => {
        packet.style.left = '100%';
        setTimeout(resolve, 1500); // match CSS transition
      }, 50);
    });

    clientSidecar.classList.remove('pulse');
    serverSidecar.classList.add('pulse');

    logMessage('Packet arrived at Proxy B.');
    if (useMtls) logMessage('Proxy B decrypted payload.');

    // Target processing
    await new Promise((r) => setTimeout(r, 500));
    serverSidecar.classList.remove('pulse');

    if (target === 'healthy') {
      logMessage('Service B processed successfully (200 OK).');
      setStatus('SUCCESS', 'success');
      circuitOpen = false;
      isAnimating = false;
    } else if (target === 'transient') {
      logMessage('Service B returned 503 (Transient Error).');
      if (attempt < maxRetries) {
        logMessage(`Proxy A will retry...`);
        resetPacketPosition();
        await new Promise((r) => setTimeout(r, 800));
        sendRequest(attempt + 1);
      } else {
        logMessage('Max retries exceeded.');
        setStatus('FAILED', 'error');
        isAnimating = false;
      }
    } else if (target === 'down') {
      logMessage('Service B is unreachable.');
      if (useCb && attempt === 1) {
        // Open on first direct fail for simplicity
        circuitOpen = true;
        logMessage('Proxy A Circuit Breaker opened!');
      }
      if (attempt < maxRetries) {
        logMessage(`Proxy A will retry...`);
        resetPacketPosition();
        await new Promise((r) => setTimeout(r, 800));
        sendRequest(attempt + 1);
      } else {
        logMessage('Max retries exceeded.');
        setStatus('FAILED', 'error');
        isAnimating = false;
      }
    }
  }

  function resetPacketPosition() {
    packet.style.transition = 'none';
    packet.style.opacity = '0';
    packet.style.left = '0%';
    void packet.offsetWidth;
    packet.style.transition = 'left 1.5s linear, opacity 0.2s';
  }

  btnSendRequest.addEventListener('click', () => sendRequest(1));
  btnReset.addEventListener('click', resetSimulation);

  // Initial setup
  packet.style.transition = 'left 1.5s linear, opacity 0.2s';
});
