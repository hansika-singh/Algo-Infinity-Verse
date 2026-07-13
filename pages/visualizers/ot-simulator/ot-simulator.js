/* ot-simulator.js */

const UI = {
  inputA: document.getElementById('inputA'),
  inputB: document.getElementById('inputB'),
  serverText: document.getElementById('serverText'),
  logsA: document.getElementById('logsA'),
  logsB: document.getElementById('logsB'),
  logsServer: document.getElementById('logsServer'),
  matrixDisplay: document.getElementById('matrixDisplay'),
  canvas: document.getElementById('networkCanvas'),
  latencySlider: document.getElementById('latencySlider'),
  btnPause: document.getElementById('btnPause'),
  btnStep: document.getElementById('btnStep'),
};

const ctx = UI.canvas.getContext('2d');
let cw, ch;
let nodeA_pos, nodeB_pos, server_pos;

function resize() {
  cw = UI.canvas.width = UI.canvas.parentElement.clientWidth;
  ch = UI.canvas.height = UI.canvas.parentElement.clientHeight;

  // Hardcoded relative positions based on CSS layout
  const rectA = document.getElementById('clientA').getBoundingClientRect();
  const rectB = document.getElementById('clientB').getBoundingClientRect();
  const rectS = document.getElementById('serverNode').getBoundingClientRect();
  const canvasRect = UI.canvas.getBoundingClientRect();

  nodeA_pos = {
    x: rectA.right - canvasRect.left,
    y: rectA.top + rectA.height / 2 - canvasRect.top,
  };
  nodeB_pos = { x: rectB.left - canvasRect.left, y: rectB.top + rectB.height / 2 - canvasRect.top };
  server_pos = {
    x: rectS.left + rectS.width / 2 - canvasRect.left,
    y: rectS.top + rectS.height / 2 - canvasRect.top,
  };
}
window.addEventListener('resize', resize);

// --- OT Math & State ---
class Operation {
  constructor(clientId, retain, insert, del) {
    this.clientId = clientId;
    this.retain = retain; // index to apply at
    this.insert = insert; // string to insert
    this.del = del; // number of chars to delete
    this.id = Math.random().toString(36).substr(2, 5);
  }

  toString() {
    if (this.insert) return `Retain(${this.retain}), Insert("${this.insert}")`;
    if (this.del) return `Retain(${this.retain}), Delete(${this.del})`;
    return `Retain(${this.retain})`;
  }
}

// Simplified Transform Function: T(op1, op2) -> op1'
// Transforms op1 against op2 (meaning op2 happened before op1 on the server)
function transform(op1, op2) {
  let newRetain = op1.retain;
  let logMsg = `T(Op1: ${op1.toString()}, Op2: ${op2.toString()}) -> `;

  if (op1.retain >= op2.retain) {
    if (op2.insert) {
      // op2 inserted something before op1, so op1 must shift right
      newRetain += op2.insert.length;
    }
    if (op2.del) {
      // op2 deleted something before op1, so op1 must shift left
      newRetain -= op2.del;
      if (newRetain < op2.retain) newRetain = op2.retain;
    }
  }

  const transformed = new Operation(op1.clientId, newRetain, op1.insert, op1.del);

  logMsg += transformed.toString();
  const div = document.createElement('div');
  div.innerText = logMsg;
  UI.matrixDisplay.appendChild(div);
  UI.matrixDisplay.scrollTop = UI.matrixDisplay.scrollHeight;

  return transformed;
}

function applyOperation(text, op) {
  const before = text.slice(0, op.retain);
  const after = text.slice(op.retain + (op.del || 0));
  return before + (op.insert || '') + after;
}

// --- Network Engine ---
let packets = [];
let isPaused = false;

class Packet {
  constructor(from, to, op, color) {
    this.from = from;
    this.to = to;
    this.op = op;
    this.progress = 0;
    this.color = color;
    this.speed = (101 - UI.latencySlider.value) * 0.0005; // 0.005 to 0.05
  }
}

let serverText = 'Hello';
let serverRevision = 0;

// Client State
const clients = {
  A: { text: 'Hello', revision: 0, pending: [], id: 'A', color: '#58a6ff' },
  B: { text: 'Hello', revision: 0, pending: [], id: 'B', color: '#8e44ad' },
};

function logState(panel, msg) {
  const div = document.createElement('div');
  div.className = 'op-log';
  div.innerText = msg;
  panel.appendChild(div);
  panel.scrollTop = panel.scrollHeight;
}

function handleInput(clientId, e) {
  const client = clients[clientId];
  const newText = e.target.value;

  // Find diff (simplified to single char insert/delete at end or middle)
  let op = null;
  if (newText.length > client.text.length) {
    // Insertion
    for (let i = 0; i < newText.length; i++) {
      if (newText[i] !== client.text[i]) {
        op = new Operation(clientId, i, newText[i], 0);
        break;
      }
    }
  } else if (newText.length < client.text.length) {
    // Deletion
    for (let i = 0; i < client.text.length; i++) {
      if (newText[i] !== client.text[i]) {
        op = new Operation(clientId, i, '', 1);
        break;
      }
    }
  }

  if (op) {
    client.text = newText;
    client.pending.push(op);
    logState(UI[`logs${clientId}`], `Created: ${op.toString()}`);

    // Send to server
    packets.push(
      new Packet(clientId === 'A' ? nodeA_pos : nodeB_pos, server_pos, op, client.color)
    );
  }
}

UI.inputA.addEventListener('input', (e) => handleInput('A', e));
UI.inputB.addEventListener('input', (e) => handleInput('B', e));

function processServerReceive(packet) {
  const op = packet.op;
  let finalOp = op;

  // Check for concurrent operations that the server processed but this client didn't know about yet
  // (In a real OT, we track revision numbers. For this sim, we just transform against any currently flying packets from the OTHER client that arrived first)

  logState(UI.logsServer, `Rcvd from ${packet.op.clientId}: ${op.toString()}`);

  // Simple concurrent resolution: If another op was applied since this client last synced, transform!
  // We simulate this by checking if server text length changed unexpectedly (this is a visual hack for the sim).
  if (clients[op.clientId].revision < serverRevision) {
    // Simulate Transformation
    // In real OT, server keeps a history buffer of operations.
    const mockConcurrentOp = new Operation('Server', 0, '', 0);
    // For visual sake, let's just do a math transform if indices clash
    if (serverText.length !== clients[op.clientId].text.length) {
      let diff = serverText.length - clients[op.clientId].text.length;
      if (diff > 0) mockConcurrentOp.insert = ' '.repeat(diff);
      else mockConcurrentOp.del = -diff;
    }
    finalOp = transform(op, mockConcurrentOp);
  }

  serverText = applyOperation(serverText, finalOp);
  serverRevision++;
  UI.serverText.innerText = serverText;

  // Broadcast to OTHER client
  const targetId = op.clientId === 'A' ? 'B' : 'A';
  packets.push(
    new Packet(server_pos, targetId === 'A' ? nodeA_pos : nodeB_pos, finalOp, '#3fb950')
  );
}

function processClientReceive(packet) {
  const clientId = packet.to === nodeA_pos ? 'A' : 'B';
  const client = clients[clientId];
  const op = packet.op;

  logState(UI[`logs${clientId}`], `Rcvd Sync: ${op.toString()}`);

  client.text = applyOperation(client.text, op);
  client.revision++;

  if (clientId === 'A') UI.inputA.value = client.text;
  else UI.inputB.value = client.text;
}

function render() {
  ctx.clearRect(0, 0, cw, ch);

  // Draw pipes
  ctx.beginPath();
  ctx.moveTo(nodeA_pos.x, nodeA_pos.y);
  ctx.lineTo(server_pos.x, server_pos.y);
  ctx.lineTo(nodeB_pos.x, nodeB_pos.y);
  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Process packets
  for (let i = packets.length - 1; i >= 0; i--) {
    const p = packets[i];

    if (!isPaused) {
      p.speed = (101 - UI.latencySlider.value) * 0.0005;
      p.progress += p.speed;
    }

    const px = p.from.x + (p.to.x - p.from.x) * p.progress;
    const py = p.from.y + (p.to.y - p.from.y) * p.progress;

    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (p.progress >= 1) {
      // Arrived
      if (p.to === server_pos) {
        processServerReceive(p);
      } else {
        processClientReceive(p);
      }
      packets.splice(i, 1);
    }
  }

  requestAnimationFrame(render);
}

UI.btnPause.addEventListener('click', () => {
  isPaused = !isPaused;
  UI.btnPause.innerHTML = isPaused
    ? '<i class="fas fa-play"></i> Resume Network'
    : '<i class="fas fa-pause"></i> Pause Network';
  UI.btnPause.classList.toggle('active', isPaused);
});

UI.btnStep.addEventListener('click', () => {
  if (!isPaused) return;
  packets.forEach((p) => (p.progress += 0.1));
});

setTimeout(resize, 100);
render();
