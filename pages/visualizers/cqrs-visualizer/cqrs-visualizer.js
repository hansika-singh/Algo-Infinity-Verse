/**
 * cqrs-visualizer.js
 * Interactive simulator for Event Sourcing & CQRS.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCQRS();
});

// --- State ---
const EventStore = [];
let CurrentProjection = { id: 1, status: 'Pending Creation' };
let messageBusQueue = [];

// DOM Elements
const els = {
  commandType: document.getElementById('commandType'),
  commandPayload: document.getElementById('commandPayload'),
  btnSubmitCommand: document.getElementById('btnSubmitCommand'),
  eventLog: document.getElementById('eventLog'),
  eventLogEmpty: document.getElementById('eventLogEmpty'),
  busFlowTrack: document.getElementById('busFlowTrack'),
  busLag: document.getElementById('busLag'),
  jsonProjection: document.getElementById('jsonProjection'),
  btnRunQuery: document.getElementById('btnRunQuery'),
  queryResult: document.getElementById('queryResult'),
  btnReplay: document.getElementById('btnReplay'),
  engineBadge: document.getElementById('engineBadge'),
  consistencyStatus: document.getElementById('consistencyStatus'),
};

// --- Initialization ---
function initCQRS() {
  updateProjectionView();

  els.btnSubmitCommand.addEventListener('click', handleCommand);
  els.btnRunQuery.addEventListener('click', handleQuery);
  els.btnReplay.addEventListener('click', replayEvents);

  // Start Message Bus consumer loop
  setInterval(processMessageBus, 500);
}

// --- Write Side: Command Handling & Event Sourcing ---
function handleCommand() {
  const type = els.commandType.value;
  let payload = els.commandPayload.value.trim();

  if (!payload) {
    if (type === 'CreateUser') payload = 'name: John Doe';
    if (type === 'UpdateEmail') payload = 'email: new@domain.com';
    if (type === 'ChangeAddress') payload = 'city: New York';
  }

  // 1. Generate Event
  const event = {
    id: `evt_${Date.now()}`,
    type: type.replace('Command', '') + 'Event', // e.g. CreateUser -> CreateUserEvent
    timestamp: new Date().toLocaleTimeString(),
    data: payload,
  };

  // 2. Append to Event Store (Append-Only Ledger)
  EventStore.push(event);
  renderEventLog(event);

  // 3. Publish to Message Bus (Async)
  publishToBus(event);

  els.commandPayload.value = '';
}

function renderEventLog(event) {
  if (els.eventLogEmpty) {
    els.eventLogEmpty.style.display = 'none';
  }

  const div = document.createElement('div');
  div.className = 'event-item';
  div.innerHTML = `
        <div class="event-type">${event.type}</div>
        <div class="event-data">{ ${event.data} }</div>
        <div class="event-meta">${event.timestamp} | ${event.id}</div>
    `;

  els.eventLog.appendChild(div);
  els.eventLog.scrollTop = els.eventLog.scrollHeight;
}

// --- Async Message Bus (The Bridge) ---
function publishToBus(event) {
  messageBusQueue.push(event);
  updateLagUI();
  setConsistency(false);
}

function processMessageBus() {
  if (messageBusQueue.length === 0) return;

  const event = messageBusQueue.shift();
  updateLagUI();

  // Animate packet on the bus
  const packet = document.createElement('div');
  packet.className = 'event-packet';
  els.busFlowTrack.appendChild(packet);

  // When animation finishes, apply to Read Projection
  setTimeout(() => {
    packet.remove();
    applyToProjection(event);

    if (messageBusQueue.length === 0) {
      setConsistency(true);
    }
  }, 1000); // 1 second network delay
}

function updateLagUI() {
  els.busLag.textContent = messageBusQueue.length;
}

function setConsistency(isSynced) {
  if (isSynced) {
    els.engineBadge.classList.remove('lagging');
    els.consistencyStatus.textContent = 'Synced';
  } else {
    els.engineBadge.classList.add('lagging');
    els.consistencyStatus.textContent = 'Lagging (Eventual)';
  }
}

// --- Read Side: Projections & Materialized View ---
function applyToProjection(event) {
  // Pure Reducer Logic
  if (event.type === 'CreateUserEvent') {
    CurrentProjection.status = 'Active';
    CurrentProjection.name = extractValue(event.data);
  } else if (event.type === 'UpdateEmailEvent') {
    CurrentProjection.email = extractValue(event.data);
  } else if (event.type === 'ChangeAddressEvent') {
    CurrentProjection.address = extractValue(event.data);
  }

  CurrentProjection.version = EventStore.findIndex((e) => e.id === event.id) + 1;
  CurrentProjection.lastUpdated = event.timestamp;

  updateProjectionView();
}

function updateProjectionView() {
  // Format JSON with syntax highlighting pseudo-classes
  let jsonStr = '{\n';
  for (const [key, value] of Object.entries(CurrentProjection)) {
    let valStr =
      typeof value === 'number'
        ? `<span class="number">${value}</span>`
        : `<span class="string">"${value}"</span>`;
    jsonStr += `  <span class="key">"${key}"</span>: ${valStr},\n`;
  }
  jsonStr = jsonStr.slice(0, -2) + '\n}';

  els.jsonProjection.innerHTML = jsonStr;
}

function handleQuery() {
  els.queryResult.className = 'query-result success';
  els.queryResult.innerHTML = `[200 OK] Fetched in 1ms.<br/>Read Model Version: ${CurrentProjection.version || 0}`;

  // Reset after a bit
  setTimeout(() => {
    els.queryResult.className = 'query-result';
    els.queryResult.innerHTML = '// Execute a query to view instantaneous read performance';
  }, 2500);
}

// --- Utilities ---
function extractValue(payload) {
  // Simple parser for "key: value" payload
  const parts = payload.split(':');
  return parts.length > 1 ? parts[1].trim() : payload;
}

// --- Time Travel Replay ---
function replayEvents() {
  if (EventStore.length === 0) return;

  // Reset State
  CurrentProjection = { id: 1, status: 'Pending Creation' };
  updateProjectionView();
  messageBusQueue = [];

  // Push all historical events back onto the bus with a slight delay
  EventStore.forEach((event, index) => {
    setTimeout(() => {
      publishToBus(event);
    }, index * 300); // staggering them
  });
}
