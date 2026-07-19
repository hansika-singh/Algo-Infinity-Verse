/**
 * distributed-tracing.js
 * Simulate Jaeger/OpenTelemetry span propagation across microservices.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTracing();
});

const els = {
  btnTrigger: document.getElementById('btnTriggerRequest'),
  waterfallBody: document.getElementById('waterfallBody'),
  currentTraceId: document.getElementById('currentTraceId'),
  nodes: {
    gw: document.getElementById('node-gateway'),
    auth: document.getElementById('node-auth'),
    billing: document.getElementById('node-billing'),
    db: document.getElementById('node-db'),
  },
};

let currentTrace = [];
const TOTAL_TIMELINE_MS = 200; // Total width of the timeline in ms

function initTracing() {
  els.btnTrigger.addEventListener('click', triggerRequest);
}

function generateId() {
  return Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
}

function triggerRequest() {
  // Reset state
  els.waterfallBody.innerHTML = '';
  currentTrace = [];
  const traceId = generateId();
  els.currentTraceId.textContent = traceId;

  els.btnTrigger.disabled = true;

  // Simulate the trace waterfall
  // Root span: API Gateway (0 to 180ms)
  const gwSpanId = generateId();
  addSpan('gw', 'GET /api/checkout', traceId, gwSpanId, null, 0, 180);
  animateNode('gw', 0, 180);

  // Child 1: Auth Service (10 to 40ms)
  setTimeout(() => {
    animatePacket('gw', 'auth', () => {
      const authSpanId = generateId();
      addSpan('auth', 'POST /verify_token', traceId, authSpanId, gwSpanId, 10, 30);
      animateNode('auth', 10, 30);
    });
  }, 100); // UI visual delay for packet

  // Child 2: Billing Service (50 to 160ms)
  setTimeout(() => {
    animatePacket('gw', 'billing', () => {
      const billingSpanId = generateId();
      addSpan('billing', 'POST /process_payment', traceId, billingSpanId, gwSpanId, 50, 110);
      animateNode('billing', 50, 110);

      // Grandchild: DB Service called by Billing (80 to 140ms)
      setTimeout(() => {
        animatePacket('billing', 'db', () => {
          const dbSpanId = generateId();
          addSpan('db', 'UPDATE users_balance', traceId, dbSpanId, billingSpanId, 80, 60);
          animateNode('db', 80, 60);
        });
      }, 300); // nested delay
    });
  }, 500);

  // Re-enable button after trace completes
  setTimeout(() => {
    els.btnTrigger.disabled = false;
  }, 2000);
}

function addSpan(serviceId, operationName, traceId, spanId, parentId, startMs, durationMs) {
  const span = { serviceId, operationName, traceId, spanId, parentId, startMs, durationMs };
  currentTrace.push(span);

  const row = document.createElement('div');
  row.className = 'span-row';

  // Calculate indentation based on parent (simplified: gw = 0, auth/billing = 1, db = 2)
  let indent = 0;
  if (parentId) {
    if (serviceId === 'db') indent = 30;
    else indent = 15;
  }

  const info = document.createElement('div');
  info.className = 'span-info';
  info.style.paddingLeft = `${indent}px`;
  info.innerHTML = `<strong>${serviceId.toUpperCase()}</strong>: ${operationName}`;

  const barContainer = document.createElement('div');
  barContainer.className = 'span-bar-container';

  const bar = document.createElement('div');
  bar.className = `span-bar span-${serviceId}`;

  // Calculate left percentage and width percentage relative to TOTAL_TIMELINE_MS
  const leftPct = (startMs / TOTAL_TIMELINE_MS) * 100;
  const widthPct = (durationMs / TOTAL_TIMELINE_MS) * 100;

  bar.style.left = `${leftPct}%`;
  bar.style.width = `${widthPct}%`;
  bar.textContent = `${durationMs}ms`;

  barContainer.appendChild(bar);
  row.appendChild(info);
  row.appendChild(barContainer);

  els.waterfallBody.appendChild(row);
}

// Visual animations on the architecture graph
function animateNode(serviceId, startMs, durationMs) {
  const node = els.nodes[serviceId];
  node.classList.add('active');

  // Convert simulated ms to actual visual ms (slowed down by 10x for visual clarity)
  setTimeout(() => {
    node.classList.remove('active');
  }, durationMs * 10);
}

function animatePacket(fromId, toId, onComplete) {
  const packet = document.getElementById(`packet-${fromId}-${toId}`);
  if (!packet) {
    onComplete();
    return;
  }

  const line = document.getElementById(`edge-${fromId}-${toId}`);
  const x1 = line.getAttribute('x1');
  const y1 = line.getAttribute('y1');
  const x2 = line.getAttribute('x2');
  const y2 = line.getAttribute('y2');

  packet.setAttribute('cx', x1);
  packet.setAttribute('cy', y1);
  packet.classList.remove('hidden');

  // Animate via Web Animations API
  const animation = packet.animate(
    [
      { cx: x1, cy: y1 },
      { cx: x2, cy: y2 },
    ],
    {
      duration: 300,
      easing: 'ease-in-out',
    }
  );

  animation.onfinish = () => {
    packet.classList.add('hidden');
    onComplete();
  };
}
