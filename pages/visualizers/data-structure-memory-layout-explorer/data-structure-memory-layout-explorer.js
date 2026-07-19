// ============================================================
// Data Structure Memory Layout Explorer — page interactivity
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initSmoothAnchorScroll();
  initSectionHighlightOnArrival();
  initArrayCalculator();
  initLinkedListTraversal();
  initHeapCalculator();
  initHashCalculator();
  initQueueSimulator();
  initStackSimulator();
});

// ---------- Smooth scroll for overview cards + hero buttons ----------
function initSmoothAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      highlightSection(target);
    });
  });
}

// ---------- Highlight whichever section is the current hash target ----------
function initSectionHighlightOnArrival() {
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      // wait for layout to settle before scrolling/highlighting
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        highlightSection(target);
      }, 50);
    }
  }
}

function highlightSection(section) {
  section.classList.add('dsml-highlight');
  setTimeout(() => {
    section.classList.remove('dsml-highlight');
  }, 1200);
}

// ============================================================
// 1. ARRAY — index → address calculator
// ============================================================
function initArrayCalculator() {
  const input = document.getElementById('dsml-array-index');
  const button = document.getElementById('dsml-array-compute');
  const result = document.getElementById('dsml-array-result');
  if (!input || !button || !result) return;

  const ELEMENT_SIZE = 4;
  const BASE = 0;
  let activeCell = null;

  button.addEventListener('click', () => {
    const idx = parseInt(input.value, 10);

    if (activeCell) {
      activeCell.classList.remove('dsml-cell-active');
      activeCell = null;
    }

    if (Number.isNaN(idx) || idx < 0 || idx > 3) {
      result.textContent =
        'Enter an index between 0 and 3 — this example array only has 4 elements.';
      result.classList.add('dsml-interactive-error');
      return;
    }

    result.classList.remove('dsml-interactive-error');
    const addr = BASE + idx * ELEMENT_SIZE;
    const hex = '0x' + addr.toString(16).toUpperCase().padStart(2, '0');
    result.innerHTML = `address = 0x00 + (${idx} × ${ELEMENT_SIZE}) = <strong>${hex}</strong>`;

    const cell = document.getElementById(`dsml-array-cell-${idx}`);
    if (cell) {
      cell.classList.add('dsml-cell-active');
      activeCell = cell;
    }
  });
}

// ============================================================
// 2. LINKED LIST — step-by-step traversal
// ============================================================
function initLinkedListTraversal() {
  const stepBtn = document.getElementById('dsml-ll-step');
  const resetBtn = document.getElementById('dsml-ll-reset');
  const result = document.getElementById('dsml-ll-result');
  if (!stepBtn || !resetBtn || !result) return;

  const nodes = [0, 1, 2].map((i) => document.getElementById(`dsml-ll-node-${i}`));
  const arrows = [0, 1].map((i) => document.getElementById(`dsml-ll-arrow-${i}`));

  const steps = [
    'At node @ 0x1A → data 12, next → 0x77.',
    'Followed the pointer to 0x77 → data 7, next → 0x4F. Notice there was no way to reach this node except by hopping through the last one.',
    'Followed the pointer to 0x4F → data 45, next → NULL. End of the list reached — that took 3 hops, unlike an array where any index is one step away.',
  ];

  let step = -1;

  function clearHighlights() {
    nodes.forEach((n) => n && n.classList.remove('dsml-node-active'));
    arrows.forEach((a) => a && a.classList.remove('dsml-arrow-active'));
  }

  function render() {
    clearHighlights();
    if (step === -1) {
      result.textContent =
        'Click "Start traversal" to follow the pointers one hop at a time — this is the only way to reach node 3, there\'s no shortcut like arr[2].';
      stepBtn.textContent = 'Start traversal';
      return;
    }
    if (nodes[step]) nodes[step].classList.add('dsml-node-active');
    if (step > 0 && arrows[step - 1]) arrows[step - 1].classList.add('dsml-arrow-active');
    result.textContent = steps[step];
    stepBtn.textContent = step === steps.length - 1 ? 'Restart' : 'Next hop →';
  }

  stepBtn.addEventListener('click', () => {
    step = step >= steps.length - 1 ? -1 : step + 1;
    render();
  });

  resetBtn.addEventListener('click', () => {
    step = -1;
    render();
  });

  render();
}

// ============================================================
// 3. TREE (array-based) — parent → children index calculator
// ============================================================
function initHeapCalculator() {
  const input = document.getElementById('dsml-heap-index');
  const button = document.getElementById('dsml-heap-compute');
  const result = document.getElementById('dsml-heap-result');
  if (!input || !button || !result) return;

  let activeCells = [];

  button.addEventListener('click', () => {
    const idx = parseInt(input.value, 10);

    activeCells.forEach((c) => c.classList.remove('dsml-cell-active'));
    activeCells = [];

    if (Number.isNaN(idx) || idx < 0) {
      result.textContent = 'Enter a non-negative parent index.';
      result.classList.add('dsml-interactive-error');
      return;
    }

    result.classList.remove('dsml-interactive-error');
    const left = 2 * idx + 1;
    const right = 2 * idx + 2;

    const parentCell = document.getElementById(`dsml-heap-cell-${idx}`);
    if (parentCell) {
      parentCell.classList.add('dsml-cell-active');
      activeCells.push(parentCell);
    }

    const leftCell = document.getElementById(`dsml-heap-cell-${left}`);
    const rightCell = document.getElementById(`dsml-heap-cell-${right}`);
    if (leftCell) {
      leftCell.classList.add('dsml-cell-active');
      activeCells.push(leftCell);
    }
    if (rightCell) {
      rightCell.classList.add('dsml-cell-active');
      activeCells.push(rightCell);
    }

    const inRangeNote =
      leftCell || rightCell
        ? ''
        : ' (both fall outside this 3-element example, but the formula still holds for a bigger heap)';
    result.innerHTML = `left child = 2×${idx}+1 = <strong>${left}</strong>, right child = 2×${idx}+2 = <strong>${right}</strong>${inRangeNote}`;
  });
}

// ============================================================
// 4. HASH TABLE — live key hasher
// ============================================================
function initHashCalculator() {
  const input = document.getElementById('dsml-hash-key');
  const button = document.getElementById('dsml-hash-compute');
  const result = document.getElementById('dsml-hash-result');
  if (!input || !button || !result) return;

  const CAPACITY = 3;
  let activeBucket = null;

  function hashKey(key) {
    let sum = 0;
    for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
    return { sum, bucket: sum % CAPACITY };
  }

  button.addEventListener('click', () => {
    const key = input.value.trim();

    if (activeBucket) {
      activeBucket.classList.remove('dsml-cell-active');
      activeBucket = null;
    }

    if (!key) {
      result.textContent = 'Type a key to hash it.';
      result.classList.add('dsml-interactive-error');
      return;
    }

    result.classList.remove('dsml-interactive-error');
    const { sum, bucket } = hashKey(key);
    result.innerHTML = `hash("${key}") = ${sum} → ${sum} % ${CAPACITY} = bucket <strong>[${bucket}]</strong>`;

    const cell = document.getElementById(`dsml-bucket-${bucket}`);
    if (cell) {
      cell.classList.add('dsml-cell-active');
      activeBucket = cell;
    }
  });
}

// ============================================================
// 5. QUEUE — enqueue / dequeue simulator (circular buffer)
// ============================================================
function initQueueSimulator() {
  const container = document.getElementById('dsml-queue-svg-container');
  const valueInput = document.getElementById('dsml-queue-value');
  const enqueueBtn = document.getElementById('dsml-queue-enqueue');
  const dequeueBtn = document.getElementById('dsml-queue-dequeue');
  const resetBtn = document.getElementById('dsml-queue-reset');
  const result = document.getElementById('dsml-queue-result');
  if (!container || !valueInput || !enqueueBtn || !dequeueBtn || !resetBtn || !result) return;

  const CAPACITY = 6;
  const CELL_W = 90,
    CELL_GAP = 10,
    START_X = 20,
    CELL_Y = 40,
    CELL_H = 60;

  function initialState() {
    return { buffer: [null, null, 9, 2, 6, null], front: 2, rear: 4, size: 3 };
  }
  let state = initialState();

  function cellX(i) {
    return START_X + i * (CELL_W + CELL_GAP);
  }

  function renderSVG() {
    const cells = [];
    for (let i = 0; i < CAPACITY; i++) {
      const x = cellX(i);
      const filled = state.buffer[i] !== null;
      cells.push(
        `<rect x="${x}" y="${CELL_Y}" width="${CELL_W}" height="${CELL_H}" rx="6" class="dsml-cell ${filled ? 'dsml-cell-filled' : 'dsml-cell-empty'}" />`
      );
      if (filled) {
        cells.push(
          `<text x="${x + CELL_W / 2}" y="${CELL_Y + 35}" text-anchor="middle" class="dsml-cell-text">${state.buffer[i]}</text>`
        );
      }
    }

    let labels = '';
    if (state.size > 0) {
      const frontX = cellX(state.front) + CELL_W / 2;
      const rearX = cellX(state.rear) + CELL_W / 2;
      labels += `<text x="${frontX}" y="${CELL_Y - 10}" text-anchor="middle" class="dsml-idx dsml-ptr">FRONT</text>`;
      labels += `<text x="${rearX}" y="${CELL_Y - 10}" text-anchor="middle" class="dsml-idx dsml-ptr">REAR</text>`;
    } else {
      labels += `<text x="${START_X}" y="${CELL_Y - 10}" class="dsml-idx dsml-dim">empty</text>`;
    }

    const wrapNote = `<text x="${START_X}" y="${CELL_Y + CELL_H + 30}" class="dsml-formula-sub">front/rear wrap to index 0 when they pass index ${CAPACITY - 1}</text>`;

    container.innerHTML = `
            <svg viewBox="0 0 ${CAPACITY * (CELL_W + CELL_GAP) + 20} 160" xmlns="http://www.w3.org/2000/svg" class="dsml-svg">
                <g font-family="Fira Code, monospace" font-size="12">
                    ${cells.join('')}
                    ${labels}
                    ${wrapNote}
                </g>
            </svg>`;
  }

  function enqueue(value) {
    if (state.size === CAPACITY) {
      result.textContent =
        'Queue is full — dequeue first, or in a real system this would trigger a resize.';
      result.classList.add('dsml-interactive-error');
      return;
    }
    result.classList.remove('dsml-interactive-error');
    if (state.size === 0) {
      state.front = 0;
      state.rear = 0;
    } else {
      state.rear = (state.rear + 1) % CAPACITY;
    }
    state.buffer[state.rear] = value;
    state.size++;
    result.textContent = `Enqueued ${value} at index ${state.rear} (REAR).`;
    renderSVG();
  }

  function dequeue() {
    if (state.size === 0) {
      result.textContent = 'Queue is empty — nothing to dequeue.';
      result.classList.add('dsml-interactive-error');
      return;
    }
    result.classList.remove('dsml-interactive-error');
    const value = state.buffer[state.front];
    state.buffer[state.front] = null;
    const oldFront = state.front;
    state.front = (state.front + 1) % CAPACITY;
    state.size--;
    result.textContent = `Dequeued ${value} from index ${oldFront} (old FRONT).`;
    renderSVG();
  }

  enqueueBtn.addEventListener('click', () => {
    const val = parseInt(valueInput.value, 10);
    enqueue(Number.isNaN(val) ? 0 : val);
  });
  dequeueBtn.addEventListener('click', dequeue);
  resetBtn.addEventListener('click', () => {
    state = initialState();
    result.classList.remove('dsml-interactive-error');
    result.textContent = 'Reset to the starting buffer.';
    renderSVG();
  });

  renderSVG();
}

// ============================================================
// 6. STACK — push / pop simulator
// ============================================================
function initStackSimulator() {
  const container = document.getElementById('dsml-stack-svg-container');
  const valueInput = document.getElementById('dsml-stack-value');
  const pushBtn = document.getElementById('dsml-stack-push');
  const popBtn = document.getElementById('dsml-stack-pop');
  const resetBtn = document.getElementById('dsml-stack-reset');
  const result = document.getElementById('dsml-stack-result');
  if (!container || !valueInput || !pushBtn || !popBtn || !resetBtn || !result) return;

  const CAPACITY = 5;
  const CELL_W = 90,
    CELL_GAP = 10,
    START_X = 20,
    CELL_Y = 40,
    CELL_H = 60;

  function initialState() {
    return { stack: [4, 8, 1] };
  }
  let state = initialState();

  function cellX(i) {
    return START_X + i * (CELL_W + CELL_GAP);
  }

  function renderSVG() {
    const cells = [];
    for (let i = 0; i < CAPACITY; i++) {
      const x = cellX(i);
      const filled = i < state.stack.length;
      cells.push(
        `<rect x="${x}" y="${CELL_Y}" width="${CELL_W}" height="${CELL_H}" rx="6" class="dsml-cell ${filled ? 'dsml-cell-filled' : 'dsml-cell-empty'}" />`
      );
      if (filled) {
        cells.push(
          `<text x="${x + CELL_W / 2}" y="${CELL_Y + 35}" text-anchor="middle" class="dsml-cell-text">${state.stack[i]}</text>`
        );
      }
    }

    let sp = '';
    if (state.stack.length > 0) {
      const topX = cellX(state.stack.length - 1) + CELL_W / 2;
      sp += `<path d="M${topX},${CELL_Y - 20} L${topX},${CELL_Y - 5}" class="dsml-arrow" />`;
      sp += `<text x="${topX}" y="${CELL_Y - 25}" text-anchor="middle" class="dsml-idx dsml-ptr">SP (top)</text>`;
    } else {
      sp += `<text x="${START_X}" y="${CELL_Y - 10}" class="dsml-idx dsml-dim">empty — SP at base</text>`;
    }

    container.innerHTML = `
            <svg viewBox="0 0 ${CAPACITY * (CELL_W + CELL_GAP) + 20} 160" xmlns="http://www.w3.org/2000/svg" class="dsml-svg">
                <g font-family="Fira Code, monospace" font-size="12">
                    ${cells.join('')}
                    ${sp}
                    <text x="${START_X}" y="${CELL_Y + CELL_H + 30}" class="dsml-addr">base</text>
                </g>
            </svg>`;
  }

  function push(value) {
    if (state.stack.length === CAPACITY) {
      result.textContent =
        'Stack is full — pop first, or in a real system this would trigger a resize.';
      result.classList.add('dsml-interactive-error');
      return;
    }
    result.classList.remove('dsml-interactive-error');
    state.stack.push(value);
    result.textContent = `Pushed ${value} onto the top, index ${state.stack.length - 1}.`;
    renderSVG();
  }

  function pop() {
    if (state.stack.length === 0) {
      result.textContent = 'Stack is empty — nothing to pop.';
      result.classList.add('dsml-interactive-error');
      return;
    }
    result.classList.remove('dsml-interactive-error');
    const value = state.stack.pop();
    result.textContent = `Popped ${value} off the top.`;
    renderSVG();
  }

  pushBtn.addEventListener('click', () => {
    const val = parseInt(valueInput.value, 10);
    push(Number.isNaN(val) ? 0 : val);
  });
  popBtn.addEventListener('click', pop);
  resetBtn.addEventListener('click', () => {
    state = initialState();
    result.classList.remove('dsml-interactive-error');
    result.textContent = 'Reset to the starting stack.';
    renderSVG();
  });

  renderSVG();
}
