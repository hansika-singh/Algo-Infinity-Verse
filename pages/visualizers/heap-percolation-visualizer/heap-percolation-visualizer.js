/* ─────────────────────────────────────────────
   Heap Percolation Visualizer
   ───────────────────────────────────────────── */

class Heap {
  constructor(type = 'min') {
    this.type = type;
    this.heap = [];
    this.steps = [];
    this.currentStep = -1;
  }

  cloneHeap() {
    return this.heap.slice();
  }

  recordStep(message, highlight = [], heap = null) {
    this.steps.push({
      heap: (heap !== null ? heap : this.cloneHeap()).slice(),
      message,
      highlight: [...highlight]
    });
  }

  compare(a, b) {
    if (this.type === 'min') {
      return a < b;
    }
    return a > b;
  }

  parentIndex(index) {
    return Math.floor((index - 1) / 2);
  }

  leftChildIndex(index) {
    return 2 * index + 1;
  }

  rightChildIndex(index) {
    return 2 * index + 2;
  }

  swap(i, j) {
    if (i === j) return;
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  siftUp(index) {
    let current = index;
    while (current > 0) {
      const parent = this.parentIndex(current);
      const currentValue = this.heap[current];
      const parentValue = this.heap[parent];

      this.recordStep(`Compare node ${currentValue} with parent ${parentValue}.`, [current, parent]);

      if (this.compare(parentValue, currentValue)) {
        this.recordStep(`Heap property satisfied for parent ${parentValue}.`, [parent, current]);
        break;
      }

      this.recordStep(`Swap ${currentValue} with parent ${parentValue}.`, [current, parent]);
      this.swap(current, parent);
      current = parent;
    }

    if (current === 0) {
      this.recordStep('Heap property satisfied at root.', [0]);
    }
  }

  siftDown(index = 0) {
    const length = this.heap.length;
    let current = index;

    while (true) {
      const left = this.leftChildIndex(current);
      const right = this.rightChildIndex(current);
      let target = -1;

      if (left < length) {
        const leftValue = this.heap[left];
        const currentValue = this.heap[current];
        this.recordStep(`Compare child ${leftValue} with parent ${currentValue}.`, [current, left]);
        target = left;
        if (right < length) {
          const rightValue = this.heap[right];
          this.recordStep(`Compare child ${rightValue} with child ${leftValue}.`, [right, left]);
          if (this.compare(rightValue, leftValue)) {
            target = right;
          }
        }
      }

      if (target === -1) {
        this.recordStep('Heap property satisfied for this subtree.', [current]);
        break;
      }

      const targetValue = this.heap[target];
      const currentValue = this.heap[current];
      if (this.compare(currentValue, targetValue)) {
        this.recordStep(`Heap property satisfied for node ${currentValue}.`, [current, target]);
        break;
      }

      this.recordStep(`Swap ${currentValue} with child ${targetValue}.`, [current, target]);
      this.swap(current, target);
      current = target;
    }
  }

  heapify() {
    this.steps = [];
    this.currentStep = -1;
    const values = this.heap.slice();
    this.heap = values;

    this.recordStep('Starting heapify from the provided array.', this.heap.map((_, idx) => idx));

    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i -= 1) {
      this.recordStep(`Heapify subtree rooted at index ${i}.`, [i]);
      this.siftDown(i);
    }

    this.recordStep('Heapify complete. Heap property is satisfied.', this.heap.map((_, idx) => idx));
    return this.steps;
  }

  insert(value) {
    this.steps = [];
    this.recordStep(`Inserted ${value} into the heap.`, []);
    this.heap.push(value);
    this.recordStep(`Added ${value} at the end of the heap.`, [this.heap.length - 1]);
    this.siftUp(this.heap.length - 1);
    this.recordStep(`Finished inserting ${value}.`, [this.heap.length - 1]);
    return this.steps;
  }

  extractRoot() {
    if (this.heap.length === 0) {
      this.recordStep('The heap is empty, so there is nothing to extract.', []);
      return this.steps;
    }

    const root = this.heap[0];
    this.steps = [];
    this.recordStep(`Extracting root ${root}.`, [0]);

    const last = this.heap.pop();
    if (this.heap.length === 0) {
      this.recordStep('Heap is now empty.', []);
      return this.steps;
    }
    this.heap[0] = last;
    this.recordStep(`Moved the last value ${last} to the root.`, [0]);
    this.siftDown(0);
    this.recordStep(`Finished extracting root ${root}.`, [0]);
    return this.steps;
  }
}

function initHeroTyping() {
  const el = document.getElementById('typingTextVisualizer');
  if (!el) return;

  const words = [
    'Trace Min and Max Heap Percolation',
    'Visualize Heapify, Insert, and Extract',
    'Step Through Swaps and Comparisons'
  ];

  let wordIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    el.textContent = words[0];
    return;
  }

  const typeTick = () => {
    const current = words[wordIndex];
    if (deleting) {
      el.textContent = current.substring(0, charIndex - 1);
      charIndex -= 1;
    } else {
      el.textContent = current.substring(0, charIndex + 1);
      charIndex += 1;
    }

    let speed = deleting ? 45 : 80;

    if (!deleting && charIndex === current.length) {
      speed = 1600;
      deleting = true;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      speed = 500;
    }

    requestAnimationFrame(() => setTimeout(typeTick, speed));
  };

  typeTick();
}

function initHeapVisualizer() {
  const arrayInput = document.getElementById('array-input');
  const insertInput = document.getElementById('insert-input');
  const statusMessage = document.getElementById('status-message');
  const arrayDisplay = document.getElementById('array-display');
  const nodesLayer = document.getElementById('nodes-layer');
  const edgesSvg = document.getElementById('edges-svg');
  const speedSlider = document.getElementById('speed-slider');
  const speedValue = document.getElementById('speed-val');
  const btnMin = document.getElementById('btn-min-heap');
  const btnMax = document.getElementById('btn-max-heap');
  const btnHeapify = document.getElementById('btn-heapify');
  const btnInsert = document.getElementById('btn-insert');
  const btnExtract = document.getElementById('btn-extract');
  const btnPrev = document.getElementById('btn-prev');
  const btnStep = document.getElementById('btn-step');
  const btnNext = document.getElementById('btn-next');
  const btnPlay = document.getElementById('btn-play');
  const btnReset = document.getElementById('btn-reset');

  let isPlaying = false;
  let playTimer = null;
  let animationSpeed = parseInt(speedSlider.value, 10);

  function syncHeapState() {
    window.heap = heap;
  }

  function updateButtons() {
    btnPrev.disabled = currentStep <= 0;
    btnNext.disabled = currentStep >= steps.length - 1;
  }

  function setStatus(message) {
    statusMessage.textContent = message;
  }

  function renderArray() {
    arrayDisplay.textContent = `[${heap.heap.join(', ')}]`;
  }

  function drawEdges() {
    const width = nodesLayer.clientWidth || 700;
    const height = nodesLayer.clientHeight || 520;
    edgesSvg.innerHTML = '';

    if (!heap.heap.length) return;

    const nodeElements = Array.from(nodesLayer.querySelectorAll('.heap-node'));
    if (!nodeElements.length) return;

    const positions = new Map();
    nodeElements.forEach((node) => {
      const index = Number(node.dataset.index);
      positions.set(index, {
        x: Number(node.style.left.replace('%', '')) / 100 * width,
        y: Number(node.style.top.replace('%', '')) / 100 * height
      });
    });

    for (let i = 0; i < heap.heap.length; i += 1) {
      const left = thisLeftChild(i);
      const right = thisRightChild(i);
      const parentPos = positions.get(i);
      if (!parentPos) continue;

      [left, right].forEach((childIndex) => {
        if (childIndex >= heap.heap.length) return;
        const childPos = positions.get(childIndex);
        if (!childPos) return;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', parentPos.x);
        line.setAttribute('y1', parentPos.y);
        line.setAttribute('x2', childPos.x);
        line.setAttribute('y2', childPos.y);
        line.setAttribute('class', 'tree-edge');
        edgesSvg.appendChild(line);
      });
    }
  }

  function thisLeftChild(index) {
    return 2 * index + 1;
  }

  function thisRightChild(index) {
    return 2 * index + 2;
  }

  function renderTree() {
    nodesLayer.innerHTML = '';
    edgesSvg.innerHTML = '';

    if (!heap.heap.length) {
      renderArray();
      return;
    }

    const width = nodesLayer.clientWidth || 700;
    const height = nodesLayer.clientHeight || 520;
    const totalLevels = Math.ceil(Math.log2(heap.heap.length + 1));
    const levelHeight = Math.min(140, height / Math.max(totalLevels + 1, 3));

    const positions = [];
    const queue = [{ index: 0, x: 50, y: 18 }];

    while (queue.length) {
      const node = queue.shift();
      const xPercent = Math.min(92, Math.max(8, node.x));
      const yPercent = Math.min(92, Math.max(12, node.y));
      positions[node.index] = { x: xPercent, y: yPercent };

      const left = thisLeftChild(node.index);
      const right = thisRightChild(node.index);
      const nextLevel = node.y + 16;
      if (left < heap.heap.length) {
        queue.push({ index: left, x: node.x - 12 + (node.index === 0 ? 0 : 4), y: nextLevel });
      }
      if (right < heap.heap.length) {
        queue.push({ index: right, x: node.x + 12 - (node.index === 0 ? 0 : 4), y: nextLevel });
      }
    }

    positions.forEach((pos, index) => {
      const node = document.createElement('div');
      node.className = 'heap-node';
      node.dataset.index = index;
      node.style.left = `${pos.x}%`;
      node.style.top = `${pos.y}%`;
      if (steps.length && currentStep >= 0 && steps[currentStep] && steps[currentStep].highlight.includes(index)) {
        node.classList.add('current');
      }
      node.innerHTML = `<span class="heap-node-label">${heap.heap[index]}</span>`;
      nodesLayer.appendChild(node);
    });

    requestAnimationFrame(() => drawEdges());
    renderArray();
  }

  function showStep(index) {
    if (!steps.length || index < 0 || index >= steps.length) return;
    currentStep = index;
    heap.heap = steps[index].heap.slice();
    setStatus(steps[index].message);
    renderTree();
    updateButtons();
  }

  function nextStep() {
    if (currentStep < steps.length - 1) {
      showStep(currentStep + 1);
    } else {
      pause();
    }
  }

  function previousStep() {
    if (currentStep > 0) {
      showStep(currentStep - 1);
    }
  }

  function play() {
    if (!steps.length) return;
    isPlaying = true;
    btnPlay.innerHTML = '<i class="fas fa-pause"></i>';
    btnPlay.setAttribute('aria-label', 'Pause animation');
    btnPlay.setAttribute('title', 'Pause animation');
    if (currentStep >= steps.length - 1) {
      currentStep = 0;
      syncHeapState();
    }
    playTimer = setInterval(() => {
      if (currentStep < steps.length - 1) {
        nextStep();
      } else {
        pause();
      }
    }, animationSpeed);
  }

  function pause() {
    isPlaying = false;
    btnPlay.innerHTML = '<i class="fas fa-play"></i>';
    btnPlay.setAttribute('aria-label', 'Play animation');
    btnPlay.setAttribute('title', 'Play animation');
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
  }

  function reset() {
    pause();
    heap = new Heap(heapType);
    steps = [];
    currentStep = -1;
    syncHeapState();
    arrayInput.value = '10,40,20,5,30';
    insertInput.value = '';
    arrayDisplay.textContent = '[]';
    nodesLayer.innerHTML = '';
    edgesSvg.innerHTML = '';
    setStatus('Visualizer reset. Enter an array and heapify it to begin.');
    updateButtons();
  }

  function parseInputValues() {
    const raw = arrayInput.value.trim();
    if (!raw) return [];
    return raw.split(',').map((entry) => Number(entry.trim())).filter((entry) => !Number.isNaN(entry));
  }

  function applyHeapify() {
    pause();
    const values = parseInputValues();
    if (!values.length) {
      setStatus('Please enter at least one numeric value.');
      return;
    }

    heap = new Heap(heapType);
    heap.heap = values;
    syncHeapState();
    steps = heap.heapify();
    currentStep = steps.length ? steps.length - 1 : -1;
    if (steps.length) {
      heap.heap = steps[steps.length - 1].heap.slice();
      showStep(currentStep);
      setStatus('Heapify complete. Use step controls or play to replay the process.');
    } else {
      renderTree();
      setStatus('No steps recorded.');
    }
    updateButtons();
  }

  function applyInsert() {
    pause();
    const value = Number(insertInput.value);
    if (Number.isNaN(value)) {
      setStatus('Please enter a valid value to insert.');
      return;
    }

    if (!heap.heap.length) {
      heap = new Heap(heapType);
      syncHeapState();
    }

    heap.heap = steps.length && currentStep >= 0 ? steps[currentStep].heap.slice() : heap.heap;
    steps = heap.insert(value);
    currentStep = steps.length ? steps.length - 1 : -1;
    if (steps.length) {
      heap.heap = steps[steps.length - 1].heap.slice();
      showStep(currentStep);
      setStatus(`Inserted ${value} into the ${heapType === 'min' ? 'min' : 'max'} heap.`);
    }
    updateButtons();
  }

  function applyExtractRoot() {
    pause();
    if (!heap.heap.length) {
      setStatus('The heap is empty.');
      return;
    }

    heap.heap = steps.length && currentStep >= 0 ? steps[currentStep].heap.slice() : heap.heap;
    steps = heap.extractRoot();
    currentStep = steps.length ? steps.length - 1 : -1;
    if (steps.length) {
      heap.heap = steps[steps.length - 1].heap.slice();
      showStep(currentStep);
      setStatus('Extracted the root from the heap.');
    }
    updateButtons();
  }

  btnMin.addEventListener('click', () => {
    heapType = 'min';
    btnMin.classList.add('active');
    btnMax.classList.remove('active');
    heap = new Heap(heapType);
    steps = [];
    currentStep = -1;
    syncHeapState();
    renderTree();
    setStatus('Switched to Min Heap mode.');
    updateButtons();
  });

  btnMax.addEventListener('click', () => {
    heapType = 'max';
    btnMax.classList.add('active');
    btnMin.classList.remove('active');
    heap = new Heap(heapType);
    steps = [];
    currentStep = -1;
    syncHeapState();
    renderTree();
    setStatus('Switched to Max Heap mode.');
    updateButtons();
  });

  btnHeapify.addEventListener('click', applyHeapify);
  btnInsert.addEventListener('click', applyInsert);
  btnExtract.addEventListener('click', applyExtractRoot);
  btnPrev.addEventListener('click', previousStep);
  btnStep.addEventListener('click', nextStep);
  btnNext.addEventListener('click', nextStep);
  btnPlay.addEventListener('click', () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  });
  btnReset.addEventListener('click', reset);

  speedSlider.addEventListener('input', (event) => {
    animationSpeed = Number(event.target.value);
    speedValue.textContent = `${animationSpeed}ms`;
    if (isPlaying) {
      pause();
      play();
    }
  });

  insertInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      applyInsert();
    }
  });

  arrayInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      applyHeapify();
    }
  });

  window.addEventListener('resize', () => {
    renderTree();
  });

  initHeroTyping();
  updateButtons();
  renderTree();
  setStatus('Enter an array and heapify it to begin tracing the percolation process.');
}

document.addEventListener('DOMContentLoaded', initHeapVisualizer);
