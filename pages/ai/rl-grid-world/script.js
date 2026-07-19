class QLearningAgent {
  constructor(rows, cols, actions = ['up', 'down', 'left', 'right']) {
    this.rows = rows;
    this.cols = cols;
    this.actions = actions;
    this.qTable = {};
    this.epsilon = 1.0;
    this.alpha = 0.1;
    this.gamma = 0.9;
    this.episode = 0;
    this.totalSteps = 0;
    this.totalReward = 0;
  }

  getStateKey(row, col) {
    return `${row},${col}`;
  }

  getQValues(state) {
    if (!this.qTable[state]) {
      this.qTable[state] = {};
      this.actions.forEach(a => this.qTable[state][a] = 0);
    }
    return this.qTable[state];
  }

  chooseAction(state, explore = true) {
    const qValues = this.getQValues(state);
    if (explore && Math.random() < this.epsilon) {
      return this.actions[Math.floor(Math.random() * this.actions.length)];
    }
    let bestAction = this.actions[0];
    let bestValue = -Infinity;
    for (const [action, value] of Object.entries(qValues)) {
      if (value > bestValue) {
        bestValue = value;
        bestAction = action;
      }
    }
    return bestAction;
  }

  update(state, action, reward, nextState) {
    const qValues = this.getQValues(state);
    const nextQValues = this.getQValues(nextState);
    const maxNext = Math.max(...Object.values(nextQValues));
    qValues[action] += this.alpha * (reward + this.gamma * maxNext - qValues[action]);
  }

  decayEpsilon() {
    this.epsilon = Math.max(0.01, this.epsilon * 0.995);
  }
}

// Grid World
class GridWorld {
  constructor(rows, cols, start, goal, walls) {
    this.rows = rows;
    this.cols = cols;
    this.start = start;
    this.goal = goal;
    this.walls = walls;
    this.reset();
  }

  reset() {
    this.agent = { ...this.start };
    return this.agent;
  }

  step(action) {
    const { row, col } = this.agent;
    let newRow = row, newCol = col;

    if (action === 'up') newRow = Math.max(0, row - 1);
    else if (action === 'down') newRow = Math.min(this.rows - 1, row + 1);
    else if (action === 'left') newCol = Math.max(0, col - 1);
    else if (action === 'right') newCol = Math.min(this.cols - 1, col + 1);

    if (this.walls.some(w => w[0] === newRow && w[1] === newCol)) {
      return { reward: -1, done: false };
    }

    this.agent = { row: newRow, col: newCol };

    if (newRow === this.goal.row && newCol === this.goal.col) {
      return { reward: 10, done: true };
    }

    return { reward: -0.1, done: false };
  }
}

// Main
const rows = 5, cols = 5;
const start = { row: 0, col: 0 };
const goal = { row: 4, col: 4 };
const walls = [
  [1, 1], [1, 2], [1, 3],
  [2, 1], [3, 1]
];

const world = new GridWorld(rows, cols, start, goal, walls);
const agent = new QLearningAgent(rows, cols);
let isTraining = false;
let trainingInterval = null;

// Canvas
const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');
const cellSize = canvas.width / rows;

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellSize, y = r * cellSize;
      ctx.strokeStyle = '#ddd';
      ctx.strokeRect(x, y, cellSize, cellSize);

      if (walls.some(w => w[0] === r && w[1] === c)) {
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, cellSize, cellSize);
      } else if (r === goal.row && c === goal.col) {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.fillStyle = '#333';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', x + cellSize/2, y + cellSize/2);
      }
    }
  }

  // Draw agent
  const agentX = world.agent.col * cellSize + cellSize/2;
  const agentY = world.agent.row * cellSize + cellSize/2;
  ctx.fillStyle = '#6c63ff';
  ctx.beginPath();
  ctx.arc(agentX, agentY, cellSize/3, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🤖', agentX, agentY);
}

function updateQTable() {
  const container = document.getElementById('qTable');
  let html = '<table>';
  const states = Object.keys(agent.qTable).sort();
  html += '<tr><th>State</th><th>↑</th><th>↓</th><th>←</th><th>→</th></tr>';
  states.forEach(state => {
    const q = agent.qTable[state];
    html += `<tr><td>${state}</td>
      <td>${q.up?.toFixed(2) || 0}</td>
      <td>${q.down?.toFixed(2) || 0}</td>
      <td>${q.left?.toFixed(2) || 0}</td>
      <td>${q.right?.toFixed(2) || 0}</td></tr>`;
  });
  html += '</table>';
  container.innerHTML = html;
}

function updateStats() {
  document.getElementById('episodeInfo').textContent = `Episode: ${agent.episode}`;
  document.getElementById('stepsInfo').textContent = `Steps: ${agent.totalSteps}`;
  document.getElementById('rewardDisplay').textContent = agent.totalReward;
  document.getElementById('epsilonDisplay').textContent = agent.epsilon.toFixed(3);
  document.getElementById('qSizeDisplay').textContent = Object.keys(agent.qTable).length;
}

function step() {
  const state = agent.getStateKey(world.agent.row, world.agent.col);
  const action = agent.chooseAction(state);
  const { reward, done } = world.step(action);
  const nextState = agent.getStateKey(world.agent.row, world.agent.col);
  agent.update(state, action, reward, nextState);
  agent.totalReward += reward;
  agent.totalSteps++;

  if (done) {
    agent.episode++;
    agent.decayEpsilon();
    world.reset();
  }

  drawGrid();
  updateQTable();
  updateStats();
}

function train() {
  if (isTraining) {
    clearInterval(trainingInterval);
    isTraining = false;
    document.getElementById('trainBtn').textContent = '▶️ Train';
    return;
  }

  isTraining = true;
  document.getElementById('trainBtn').textContent = '⏹️ Stop';
  const speedText = document.getElementById('speedBtn').textContent;
  const speed = speedText.includes('Fast') ? 50 : speedText.includes('Normal') ? 200 : 500;
  trainingInterval = setInterval(step, speed);
}

function resetAll() {
  if (isTraining) {
    clearInterval(trainingInterval);
    isTraining = false;
    document.getElementById('trainBtn').textContent = '▶️ Train';
  }
  world.reset();
  agent.qTable = {};
  agent.epsilon = 1.0;
  agent.episode = 0;
  agent.totalSteps = 0;
  agent.totalReward = 0;
  drawGrid();
  updateQTable();
  updateStats();
}

// Event listeners
document.getElementById('trainBtn').addEventListener('click', train);
document.getElementById('resetBtn').addEventListener('click', resetAll);
document.getElementById('stepBtn').addEventListener('click', step);

document.getElementById('speedBtn').addEventListener('click', function() {
  const speeds = ['⏱️ Speed: Slow', '⏱️ Speed: Normal', '⏱️ Speed: Fast'];
  let idx = speeds.indexOf(this.textContent);
  idx = (idx + 1) % speeds.length;
  this.textContent = speeds[idx];
  if (isTraining) {
    clearInterval(trainingInterval);
    const speed = this.textContent.includes('Fast') ? 50 : this.textContent.includes('Normal') ? 200 : 500;
    trainingInterval = setInterval(step, speed);
  }
});

// Initial render
drawGrid();
updateQTable();
updateStats();