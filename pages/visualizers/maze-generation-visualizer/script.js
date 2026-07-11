const gridContainer = document.getElementById('mazeGrid');
const generateBtn = document.getElementById('generateBtn');
const resetBtn = document.getElementById('resetBtn');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const stackSizeDisplay = document.getElementById('stackSize');
const algoStatusDisplay = document.getElementById('algoStatus');

const ROWS = 31;
const COLS = 31;
let grid = [];
let isGenerating = false;
let animationId = null;
let delay = 10; // ms

// Define cell states
const STATE = {
  WALL: 'wall',
  UNVISITED: 'unvisited',
  PATH: 'path',
  ACTIVE: 'active',
  BACKTRACKED: 'backtracked',
};

function initGrid() {
  gridContainer.innerHTML = '';
  gridContainer.style.gridTemplateColumns = `repeat(${COLS}, 15px)`;
  gridContainer.style.gridTemplateRows = `repeat(${ROWS}, 15px)`;
  grid = [];

  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      // Starting state: all are walls
      cell.classList.add('cell', STATE.WALL);
      cell.id = `cell-${r}-${c}`;
      gridContainer.appendChild(cell);

      row.push({
        r,
        c,
        element: cell,
        state: STATE.WALL,
      });
    }
    grid.push(row);
  }
}

function setCellState(r, c, state) {
  if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
    const cell = grid[r][c];
    cell.element.className = `cell ${state}`;
    cell.state = state;
  }
}

function getNeighbors(r, c) {
  const neighbors = [];
  // Jump by 2 to keep walls between paths
  const directions = [
    [0, 2],
    [2, 0],
    [0, -2],
    [-2, 0],
  ];

  for (let [dr, dc] of directions) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr > 0 && nr < ROWS - 1 && nc > 0 && nc < COLS - 1) {
      if (grid[nr][nc].state === STATE.WALL) {
        neighbors.push({ r: nr, c: nc, dr: dr / 2, dc: dc / 2 }); // Store mid point diff
      }
    }
  }

  // Shuffle neighbors randomly
  for (let i = neighbors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
  }

  return neighbors;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function updateSpeedLabel() {
  const val = speedSlider.value;
  delay = 101 - val; // Reverse mapping: higher slider = lower delay
  if (val > 80) speedValue.textContent = 'Fast';
  else if (val > 40) speedValue.textContent = 'Normal';
  else speedValue.textContent = 'Slow';
}

speedSlider.addEventListener('input', updateSpeedLabel);

async function generateMaze() {
  if (isGenerating) return;
  isGenerating = true;
  generateBtn.disabled = true;
  algoStatusDisplay.textContent = 'Generating...';

  // Create current generation token to abort if reset is clicked
  const currentAnimationId = Date.now();
  animationId = currentAnimationId;

  initGrid();

  // Inner cells that can be part of the maze (avoiding outer borders)
  const startR = 1;
  const startC = 1;

  let stack = [];
  stack.push({ r: startR, c: startC });
  setCellState(startR, startC, STATE.ACTIVE);

  while (stack.length > 0) {
    if (animationId !== currentAnimationId) return; // Abort if reset

    stackSizeDisplay.textContent = stack.length;

    const current = stack[stack.length - 1];
    setCellState(current.r, current.c, STATE.ACTIVE);

    const neighbors = getNeighbors(current.r, current.c);

    if (neighbors.length > 0) {
      const next = neighbors[0];
      // Carve wall between current and next
      setCellState(current.r + next.dr, current.c + next.dc, STATE.PATH);
      // Re-color current to regular path (as next will be active)
      setCellState(current.r, current.c, STATE.PATH);

      stack.push({ r: next.r, c: next.c });
      setCellState(next.r, next.c, STATE.ACTIVE);
    } else {
      // Backtrack
      const popped = stack.pop();
      setCellState(popped.r, popped.c, STATE.BACKTRACKED);
      if (stack.length > 0) {
        const peek = stack[stack.length - 1];
        setCellState(peek.r, peek.c, STATE.ACTIVE);
      }
    }

    await sleep(delay);
  }

  if (animationId === currentAnimationId) {
    algoStatusDisplay.textContent = 'Completed!';
    isGenerating = false;
    generateBtn.disabled = false;
    stackSizeDisplay.textContent = '0';
  }
}

function resetMaze() {
  animationId = null; // Stop current generation
  isGenerating = false;
  generateBtn.disabled = false;
  algoStatusDisplay.textContent = 'Idle';
  stackSizeDisplay.textContent = '0';
  initGrid();
}

generateBtn.addEventListener('click', generateMaze);
resetBtn.addEventListener('click', resetMaze);

// Init
initGrid();
updateSpeedLabel();
