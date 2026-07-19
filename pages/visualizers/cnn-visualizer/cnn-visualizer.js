/**
 * cnn-visualizer.js
 * Interactive client-side CNN Visualizer & Feature Map Explorer
 */

const PRESET_PATTERNS = {
  smiley: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0],
    [0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
    [0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  cross: [
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  ],
  circle: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  stripes: [
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
  ],
};

const KERNELS = {
  sobelV: [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ],
  sobelH: [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ],
  ridge: [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1],
  ],
  sharpen: [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ],
  gaussian: [
    [0.0625, 0.125, 0.0625],
    [0.125, 0.25, 0.125],
    [0.0625, 0.125, 0.0625],
  ],
  identity: [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ],
};

document.addEventListener('DOMContentLoaded', () => {
  new CNNVisualizer();
});

class CNNVisualizer {
  constructor() {
    this.inputMatrix = [];
    this.cacheDOM();
    this.bindEvents();
    this.resetState();
    this.loadPresetPattern();
    this.renderKernel();
  }

  cacheDOM() {
    this.els = {
      imageSelect: document.getElementById('imageSelect'),
      fileInput: document.getElementById('fileInput'),
      kernelSelect: document.getElementById('kernelSelect'),
      paddingSelect: document.getElementById('paddingSelect'),
      strideSelect: document.getElementById('strideSelect'),
      activationSelect: document.getElementById('activationSelect'),
      poolingSelect: document.getElementById('poolingSelect'),
      speedSlider: document.getElementById('speedSlider'),
      speedVal: document.getElementById('speedVal'),
      playBtn: document.getElementById('playBtn'),
      stepBtn: document.getElementById('stepBtn'),
      resetBtn: document.getElementById('resetBtn'),
      mathFormula: document.getElementById('mathFormula'),
      inputGrid: document.getElementById('inputGrid'),
      kernelGrid: document.getElementById('kernelGrid'),
      featureMapGrid: document.getElementById('featureMapGrid'),
      pooledGrid: document.getElementById('pooledGrid'),

      // Softmax bars
      barCat: document.getElementById('bar-cat'),
      valCat: document.getElementById('val-cat'),
      barDog: document.getElementById('bar-dog'),
      valDog: document.getElementById('val-dog'),
      barCar: document.getElementById('bar-car'),
      valCar: document.getElementById('val-car'),
      barPlane: document.getElementById('bar-plane'),
      valPlane: document.getElementById('val-plane'),
    };
  }

  bindEvents() {
    this.els.imageSelect.addEventListener('change', () => {
      this.loadPresetPattern();
      this.resetAnimation();
    });

    this.els.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

    this.els.kernelSelect.addEventListener('change', () => {
      this.renderKernel();
      this.resetAnimation();
    });

    this.els.paddingSelect.addEventListener('change', () => this.resetAnimation());
    this.els.strideSelect.addEventListener('change', () => this.resetAnimation());
    this.els.activationSelect.addEventListener('change', () => this.resetAnimation());
    this.els.poolingSelect.addEventListener('change', () => this.resetAnimation());

    this.els.speedSlider.addEventListener('input', (e) => {
      this.els.speedVal.textContent = e.target.value + 'ms';
    });

    this.els.playBtn.addEventListener('click', () => this.togglePlay());
    this.els.stepBtn.addEventListener('click', () => this.stepForward());
    this.els.resetBtn.addEventListener('click', () => this.resetAnimation());
  }

  resetState() {
    this.isPlaying = false;
    this.currentStage = 'conv'; // 'conv', 'pool', 'done'
    this.currentR = 0;
    this.currentC = 0;
    this.featureMap = [];
    this.pooledMap = [];

    this.els.playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
    this.els.mathFormula.textContent = "Select a cell on the feature map or click 'Play' to start.";

    clearTimeout(this.animationTimeout);
  }

  resetAnimation() {
    const playing = this.isPlaying;
    this.resetState();

    this.initGrids();
    this.updatePredictionDisplay([0.25, 0.25, 0.25, 0.25]); // Default uniform distribution

    if (playing) {
      this.togglePlay();
    }
  }

  loadPresetPattern() {
    const key = this.els.imageSelect.value;
    const pattern = PRESET_PATTERNS[key];
    this.inputMatrix = pattern.map((row) => [...row]);
    this.resetAnimation();
  }

  handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      if (typeof showNotification === 'function') {
        showNotification('Please upload an image file.', 'error');
      } else {
        alert('Please upload an image file.');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 14;
        canvas.height = 14;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 14, 14);

        const imgData = ctx.getImageData(0, 0, 14, 14);
        const mat = [];
        for (let r = 0; r < 14; r++) {
          const row = [];
          for (let c = 0; c < 14; c++) {
            const idx = (r * 14 + c) * 4;
            const red = imgData.data[idx];
            const green = imgData.data[idx + 1];
            const blue = imgData.data[idx + 2];
            // Grayscale luminance
            const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
            row.push(luminance);
          }
          mat.push(row);
        }
        this.inputMatrix = mat;
        this.resetAnimation();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  getKernel() {
    const key = this.els.kernelSelect.value;
    return KERNELS[key];
  }

  initGrids() {
    // Draw Input Grid
    this.els.inputGrid.innerHTML = '';
    this.els.inputGrid.style.gridTemplateColumns = `repeat(14, 16px)`;
    this.els.inputGrid.style.gridTemplateRows = `repeat(14, 16px)`;
    for (let r = 0; r < 14; r++) {
      for (let c = 0; c < 14; c++) {
        const cell = document.createElement('div');
        cell.className = 'pixel-cell';
        const val = this.inputMatrix[r] ? this.inputMatrix[r][c] : 0;
        cell.style.backgroundColor = `rgba(255, 255, 255, ${val})`;
        cell.dataset.r = r;
        cell.dataset.c = c;
        this.els.inputGrid.appendChild(cell);
      }
    }

    // Feature Map dimensions
    const pad = parseInt(this.els.paddingSelect.value);
    const stride = parseInt(this.els.strideSelect.value);
    this.featRows = Math.floor((14 - 3 + 2 * pad) / stride) + 1;
    this.featCols = this.featRows; // Square map

    // Draw Feature Grid
    this.els.featureMapGrid.innerHTML = '';
    this.els.featureMapGrid.style.gridTemplateColumns = `repeat(${this.featCols}, 16px)`;
    this.els.featureMapGrid.style.gridTemplateRows = `repeat(${this.featRows}, 16px)`;
    this.featureMap = Array(this.featRows)
      .fill(null)
      .map(() => Array(this.featCols).fill(0));

    for (let r = 0; r < this.featRows; r++) {
      for (let c = 0; c < this.featCols; c++) {
        const cell = document.createElement('div');
        cell.className = 'pixel-cell';
        cell.style.backgroundColor = `rgba(16, 185, 129, 0)`; // Green empty cells
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.addEventListener('click', () => this.inspectConvCell(r, c));
        this.els.featureMapGrid.appendChild(cell);
      }
    }

    // Pooling dimensions
    this.poolRows = Math.floor(this.featRows / 2);
    this.poolCols = this.poolRows;

    // Draw Pooled Grid
    this.els.pooledGrid.innerHTML = '';
    this.els.pooledGrid.style.gridTemplateColumns = `repeat(${this.poolCols}, 16px)`;
    this.els.pooledGrid.style.gridTemplateRows = `repeat(${this.poolRows}, 16px)`;
    this.pooledMap = Array(this.poolRows)
      .fill(null)
      .map(() => Array(this.poolCols).fill(0));

    for (let r = 0; r < this.poolRows; r++) {
      for (let c = 0; c < this.poolCols; c++) {
        const cell = document.createElement('div');
        cell.className = 'pixel-cell';
        cell.style.backgroundColor = `rgba(245, 158, 11, 0)`; // Amber/Orange empty cells
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.addEventListener('click', () => this.inspectPoolCell(r, c));
        this.els.pooledGrid.appendChild(cell);
      }
    }
  }

  renderKernel() {
    this.els.kernelGrid.innerHTML = '';
    const kernel = this.getKernel();
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cell = document.createElement('div');
        cell.className = 'kernel-cell';
        const v = kernel[r][c];
        cell.textContent = Number.isInteger(v) ? v : v.toFixed(2);
        this.els.kernelGrid.appendChild(cell);
      }
    }
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.els.playBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
      this.runAnimationLoop();
    } else {
      this.els.playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
      clearTimeout(this.animationTimeout);
    }
  }

  runAnimationLoop() {
    if (!this.isPlaying) return;
    this.stepForward();
    if (this.currentStage !== 'done') {
      const delay = parseInt(this.els.speedSlider.value);
      this.animationTimeout = setTimeout(() => this.runAnimationLoop(), delay);
    } else {
      this.isPlaying = false;
      this.els.playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
    }
  }

  stepForward() {
    if (this.currentStage === 'conv') {
      this.stepConvolution();
    } else if (this.currentStage === 'pool') {
      this.stepPooling();
    }
  }

  stepConvolution() {
    const pad = parseInt(this.els.paddingSelect.value);
    const stride = parseInt(this.els.strideSelect.value);
    const act = this.els.activationSelect.value;
    const kernel = this.getKernel();

    const r = this.currentR;
    const c = this.currentC;

    // Clear all previous highlight classes
    this.clearHighlights();

    // Calculate center coordinate in the input image coordinates
    const centerR = r * stride - pad + 1;
    const centerC = c * stride - pad + 1;

    // Apply Convolution dot product
    let sum = 0;
    let details = [];

    for (let kr = 0; kr < 3; kr++) {
      for (let kc = 0; kc < 3; kc++) {
        const ir = centerR + kr - 1;
        const ic = centerC + kc - 1;
        let val = 0;

        if (ir >= 0 && ir < 14 && ic >= 0 && ic < 14) {
          val = this.inputMatrix[ir][ic];
          const inputCell = this.getInputCell(ir, ic);
          if (inputCell) {
            inputCell.classList.add(kr === 1 && kc === 1 ? 'active-center' : 'active-input');
          }
        }
        const weight = kernel[kr][kc];
        sum += val * weight;
        details.push(`(${val.toFixed(1)}*${weight.toFixed(1)})`);
      }
    }

    // Apply activation
    let actValue = sum;
    if (act === 'relu') {
      actValue = Math.max(0, sum);
    }

    this.featureMap[r][c] = actValue;

    // Update feature map cell
    const featCell = this.getFeatureCell(r, c);
    if (featCell) {
      featCell.classList.add('active-feature');
      featCell.style.backgroundColor = `rgba(16, 185, 129, ${Math.min(1, actValue)})`;
    }

    // Show math formula breakdown
    this.els.mathFormula.textContent =
      `Conv(R:${r}, C:${c})\n` +
      `Inputs: [${details.slice(0, 3).join('+')}\n` +
      `         ${details.slice(3, 6).join('+')}\n` +
      `         ${details.slice(6, 9).join('+')}]\n` +
      `Raw Output = ${sum.toFixed(3)}\n` +
      `ReLU(${sum.toFixed(3)}) = ${actValue.toFixed(3)}`;

    // Advance convolution pointer
    this.currentC++;
    if (this.currentC >= this.featCols) {
      this.currentC = 0;
      this.currentR++;
      if (this.currentR >= this.featRows) {
        this.currentStage = 'pool';
        this.currentR = 0;
        this.currentC = 0;
      }
    }
  }

  stepPooling() {
    const type = this.els.poolingSelect.value;
    const r = this.currentR;
    const c = this.currentC;

    this.clearHighlights();

    // Highlighting pool window source coordinates in feature map
    const sourceR = r * 2;
    const sourceC = c * 2;
    const vals = [];

    for (let pr = 0; pr < 2; pr++) {
      for (let pc = 0; pc < 2; pc++) {
        const fr = sourceR + pr;
        const fc = sourceC + pc;
        if (fr < this.featRows && fc < this.featCols) {
          vals.push(this.featureMap[fr][fc]);
          const featCell = this.getFeatureCell(fr, fc);
          if (featCell) {
            featCell.classList.add('active-pooling-in');
          }
        }
      }
    }

    // Perform Max / Average operation
    let finalVal = 0;
    if (type === 'max') {
      finalVal = Math.max(...vals);
    } else {
      const sum = vals.reduce((a, b) => a + b, 0);
      finalVal = sum / vals.length;
    }

    this.pooledMap[r][c] = finalVal;

    // Update pooled cell
    const poolCell = this.getPooledCell(r, c);
    if (poolCell) {
      poolCell.classList.add('active-pooling-out');
      poolCell.style.backgroundColor = `rgba(245, 158, 11, ${Math.min(1, finalVal)})`;
    }

    this.els.mathFormula.textContent =
      `Pooling(R:${r}, C:${c})\n` +
      `Source Region Values: [${vals.map((v) => v.toFixed(3)).join(', ')}]\n` +
      `${type === 'max' ? 'Max' : 'Avg'} Pool Output = ${finalVal.toFixed(3)}`;

    // Advance pooling pointer
    this.currentC++;
    if (this.currentC >= this.poolCols) {
      this.currentC = 0;
      this.currentR++;
      if (this.currentR >= this.poolRows) {
        this.currentStage = 'done';
        this.clearHighlights();
        this.runClassification();
      }
    }
  }

  runClassification() {
    // Flatten Pooled Matrix
    const flattened = [];
    for (let r = 0; r < this.poolRows; r++) {
      for (let c = 0; c < this.poolCols; c++) {
        flattened.push(this.pooledMap[r][c]);
      }
    }

    // Simple mock fully connected prediction weights
    // Cat, Dog, Car, Plane predictions based on edge/blur density
    const size = flattened.length;
    if (size === 0) return;

    let scores = [0, 0, 0, 0]; // Cat, Dog, Car, Plane scores

    // Define standard heuristics mapping weights based on index regions
    // Class 0: Cat (central circle/curves)
    // Class 1: Dog (lower curves/complex)
    // Class 2: Car (horizontal/bottom dense edges)
    // Class 3: Plane (cross/diagonal features)
    for (let i = 0; i < size; i++) {
      const v = flattened[i];
      const r = Math.floor(i / this.poolCols);
      const c = i % this.poolCols;

      // Cat weights: Central heavy
      const centerR = (this.poolRows - 1) / 2;
      const centerC = (this.poolCols - 1) / 2;
      const distFromCenter = Math.abs(r - centerR) + Math.abs(c - centerC);
      scores[0] += v * (2.0 - distFromCenter / 2.0);

      // Dog weights: Bottom heavy
      scores[1] += v * (r > centerR ? 1.5 : 0.5);

      // Car weights: Horizontal features
      scores[2] += v * (r > this.poolRows / 3 && r < (2 * this.poolRows) / 3 ? 1.6 : 0.4);

      // Plane weights: Diagonal/Cross features
      scores[3] += v * (r === c || r === this.poolRows - 1 - c ? 1.8 : 0.3);
    }

    // Apply Softmax normalization
    const exps = scores.map((s) => Math.exp(s));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map((e) => e / sumExps);

    this.updatePredictionDisplay(probs);
    this.els.mathFormula.textContent =
      'Pipeline complete!\n' +
      '1. Image Convolved & Activated\n' +
      '2. Features Pooled & Flattened\n' +
      '3. Softmax Classification completed.';
  }

  updatePredictionDisplay(probs) {
    const catPct = Math.round(probs[0] * 100);
    const dogPct = Math.round(probs[1] * 100);
    const carPct = Math.round(probs[2] * 100);
    const planePct = Math.round(probs[3] * 100);

    this.els.barCat.style.width = catPct + '%';
    this.els.valCat.textContent = catPct + '%';

    this.els.barDog.style.width = dogPct + '%';
    this.els.valDog.textContent = dogPct + '%';

    this.els.barCar.style.width = carPct + '%';
    this.els.valCar.textContent = carPct + '%';

    this.els.barPlane.style.width = planePct + '%';
    this.els.valPlane.textContent = planePct + '%';
  }

  inspectConvCell(r, c) {
    this.isPlaying = false;
    this.els.playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
    clearTimeout(this.animationTimeout);

    this.currentStage = 'conv';
    this.currentR = r;
    this.currentC = c;
    this.stepConvolution();
  }

  inspectPoolCell(r, c) {
    this.isPlaying = false;
    this.els.playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
    clearTimeout(this.animationTimeout);

    this.currentStage = 'pool';
    this.currentR = r;
    this.currentC = c;
    this.stepPooling();
  }

  clearHighlights() {
    const elsList = this.els.inputGrid.querySelectorAll('.pixel-cell');
    elsList.forEach((cell) => {
      cell.classList.remove('active-input', 'active-center');
    });

    const featList = this.els.featureMapGrid.querySelectorAll('.pixel-cell');
    featList.forEach((cell) => {
      cell.classList.remove('active-feature', 'active-pooling-in');
    });

    const poolList = this.els.pooledGrid.querySelectorAll('.pixel-cell');
    poolList.forEach((cell) => {
      cell.classList.remove('active-pooling-out');
    });
  }

  getInputCell(r, c) {
    return this.els.inputGrid.querySelector(`[data-r="${r}"][data-c="${c}"]`);
  }

  getFeatureCell(r, c) {
    return this.els.featureMapGrid.querySelector(`[data-r="${r}"][data-c="${c}"]`);
  }

  getPooledCell(r, c) {
    return this.els.pooledGrid.querySelector(`[data-r="${r}"][data-c="${c}"]`);
  }
}
