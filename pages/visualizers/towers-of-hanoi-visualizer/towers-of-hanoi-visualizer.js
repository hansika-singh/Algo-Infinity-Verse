/* =========================================
   Towers of Hanoi Visualizer Logic
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const disksSlider = document.getElementById('toh-disks');
  const disksDisplay = document.getElementById('toh-disks-display');
  const speedSlider = document.getElementById('toh-speed');
  const playBtn = document.getElementById('toh-play');
  const pauseBtn = document.getElementById('toh-pause');
  const stepBtn = document.getElementById('toh-step');
  const resetBtn = document.getElementById('toh-reset');
  const statusBox = document.getElementById('toh-status');
  const stackContainer = document.getElementById('toh-stack');
  const logContainer = document.getElementById('toh-log');

  const pegs = {
    A: document.getElementById('peg-A'),
    B: document.getElementById('peg-B'),
    C: document.getElementById('peg-C'),
  };

  // State
  let numDisks = parseInt(disksSlider.value);
  let isPlaying = false;
  let isPaused = false;
  let animationQueue = [];
  let currentStep = 0;
  let pegState = { A: [], B: [], C: [] };

  // Initialize Board
  function initBoard() {
    // Clear all pegs
    for (const p in pegs) {
      pegs[p].innerHTML = '';
      pegState[p] = [];
    }
    stackContainer.innerHTML = '<div class="toh-empty-msg">Call stack is empty.</div>';
    logContainer.innerHTML = '<div class="toh-empty-msg">Log will appear here.</div>';

    // Add disks to Peg A (bottom up)
    for (let i = numDisks; i >= 1; i--) {
      const disk = document.createElement('div');
      disk.className = 'toh-disk';
      disk.setAttribute('data-size', i);
      disk.textContent = i;
      pegs['A'].appendChild(disk); // appendChild adds to the bottom visually since we use flex column-reverse
      pegState['A'].push(i);
    }

    currentStep = 0;
    isPlaying = false;
    isPaused = false;
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    stepBtn.disabled = false;
    statusBox.textContent = `Ready with ${numDisks} disks.`;

    // Generate Animation Steps
    animationQueue = [];
    generateHanoiSteps(numDisks, 'A', 'C', 'B');
  }

  // Recursive step generator
  function generateHanoiSteps(n, source, target, aux) {
    // Push Call
    animationQueue.push({ type: 'PUSH_CALL', n, source, target, aux });

    if (n === 1) {
      animationQueue.push({ type: 'MOVE_DISK', disk: 1, from: source, to: target });
    } else {
      generateHanoiSteps(n - 1, source, aux, target);
      animationQueue.push({ type: 'MOVE_DISK', disk: n, from: source, to: target });
      generateHanoiSteps(n - 1, aux, target, source);
    }

    // Pop Call
    animationQueue.push({ type: 'POP_CALL', n, source, target, aux });
  }

  // Sleep utility
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getDelay() {
    // Speed slider: 1 (slow) to 100 (fast)
    // 1 -> 1500ms, 100 -> 50ms
    const val = parseInt(speedSlider.value);
    return 1500 - (val - 1) * (1450 / 99);
  }

  function logMessage(msg) {
    const empty = logContainer.querySelector('.toh-empty-msg');
    if (empty) empty.remove();

    const entry = document.createElement('div');
    entry.className = 'toh-log-entry';
    entry.textContent = msg;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  // Execute a single step
  async function executeStep(step) {
    if (!step) return;

    if (step.type === 'PUSH_CALL') {
      const empty = stackContainer.querySelector('.toh-empty-msg');
      if (empty) empty.remove();

      // Deactivate others
      document.querySelectorAll('.toh-stack-frame').forEach((el) => el.classList.remove('active'));

      const frame = document.createElement('div');
      frame.className = 'toh-stack-frame active';
      frame.id = `frame-${step.n}-${step.source}-${step.target}`;
      frame.innerHTML = `hanoi(n: ${step.n}, src: '${step.source}', tgt: '${step.target}', aux: '${step.aux}')`;

      // Prepend so it appears at top
      stackContainer.prepend(frame);
      statusBox.textContent = `Pushing hanoi(${step.n}) to call stack...`;
      await sleep(getDelay() / 2);
    } else if (step.type === 'POP_CALL') {
      const frames = stackContainer.querySelectorAll('.toh-stack-frame');
      if (frames.length > 0) {
        const topFrame = frames[0];
        topFrame.classList.add('popping');
        statusBox.textContent = `Returning from hanoi(${step.n})...`;
        await sleep(getDelay() / 2);
        topFrame.remove();

        // Make new top active
        if (frames.length > 1) {
          frames[1].classList.add('active');
        } else {
          stackContainer.innerHTML = '<div class="toh-empty-msg">Call stack is empty.</div>';
        }
      }
    } else if (step.type === 'MOVE_DISK') {
      statusBox.textContent = `Moving disk ${step.disk} from ${step.from} to ${step.to}`;
      logMessage(`Move disk ${step.disk} from ${step.from} -> ${step.to}`);

      // Physical DOM move
      const sourcePeg = pegs[step.from];
      const targetPeg = pegs[step.to];

      if (sourcePeg.lastElementChild) {
        const diskEl = sourcePeg.lastElementChild;
        // Basic instant append for now (flex column-reverse handles stacking)
        targetPeg.appendChild(diskEl);
      }

      await sleep(getDelay());
    }
  }

  // Play loop
  async function play() {
    if (isPlaying) return;
    isPlaying = true;
    isPaused = false;
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    stepBtn.disabled = true;
    disksSlider.disabled = true;

    while (currentStep < animationQueue.length && isPlaying && !isPaused) {
      await executeStep(animationQueue[currentStep]);
      currentStep++;
    }

    if (currentStep >= animationQueue.length) {
      statusBox.textContent = 'Algorithm complete!';
      isPlaying = false;
      playBtn.disabled = false;
      pauseBtn.disabled = true;
      stepBtn.disabled = true;
      disksSlider.disabled = false;
    }
  }

  // Event Listeners
  disksSlider.addEventListener('input', (e) => {
    disksDisplay.textContent = e.target.value;
    numDisks = parseInt(e.target.value);
    initBoard();
  });

  playBtn.addEventListener('click', play);

  pauseBtn.addEventListener('click', () => {
    isPaused = true;
    isPlaying = false;
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    stepBtn.disabled = false;
    statusBox.textContent = 'Paused.';
  });

  stepBtn.addEventListener('click', async () => {
    if (currentStep < animationQueue.length) {
      playBtn.disabled = true;
      stepBtn.disabled = true;
      await executeStep(animationQueue[currentStep]);
      currentStep++;
      stepBtn.disabled = false;
      playBtn.disabled = false;
      if (currentStep >= animationQueue.length) {
        statusBox.textContent = 'Algorithm complete!';
        stepBtn.disabled = true;
        disksSlider.disabled = false;
      }
    }
  });

  resetBtn.addEventListener('click', () => {
    isPlaying = false;
    isPaused = false;
    initBoard();
    disksSlider.disabled = false;
  });

  // Init on load
  initBoard();
});
