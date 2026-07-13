class WhatIfSimulator {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.array = [];
    this.arraySize = 50;
    this.speed = 1;
    this.dataType = 0; // 0=random, 1=sorted, 2=reverse
    this.isRunning = false;
    this.scenarios = JSON.parse(localStorage.getItem('scenarios') || '[]');
    this.comparisonResults = {};
    
    this.init();
  }

  init() {
    this.bindControls();
    this.generateArray();
    this.render();
    this.loadScenarios();
  }

  bindControls() {
    document.getElementById('sizeSlider').addEventListener('input', (e) => {
      this.arraySize = parseInt(e.target.value);
      document.getElementById('sizeValue').textContent = this.arraySize;
      this.generateArray();
      this.render();
    });

    document.getElementById('speedSlider').addEventListener('input', (e) => {
      this.speed = parseFloat(e.target.value);
      document.getElementById('speedValue').textContent = `${this.speed}x`;
    });

    document.getElementById('dataTypeSlider').addEventListener('input', (e) => {
      this.dataType = parseInt(e.target.value);
      const types = ['Random', 'Sorted', 'Reverse'];
      document.getElementById('dataTypeValue').textContent = types[this.dataType];
      this.generateArray();
      this.render();
    });

    document.getElementById('runBtn').addEventListener('click', () => {
      this.runAlgorithm();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      this.reset();
    });

    document.getElementById('compareBtn').addEventListener('click', () => {
      this.runComparison();
    });

    document.getElementById('saveScenarioBtn').addEventListener('click', () => {
      this.saveScenario();
    });
  }

  generateArray() {
    const arr = [];
    for (let i = 0; i < this.arraySize; i++) {
      arr.push(Math.floor(Math.random() * 100) + 1);
    }
    if (this.dataType === 1) arr.sort((a, b) => a - b);
    if (this.dataType === 2) arr.sort((a, b) => b - a);
    this.array = arr;
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const barWidth = w / this.array.length;

    ctx.clearRect(0, 0, w, h);
    
    this.array.forEach((val, i) => {
      const x = i * barWidth;
      const barHeight = (val / 100) * h;
      ctx.fillStyle = '#6c63ff';
      ctx.fillRect(x, h - barHeight, barWidth - 1, barHeight);
    });
  }

  async runAlgorithm() {
    if (this.isRunning) return;
    this.isRunning = true;
    document.getElementById('status').textContent = '🔄 Running...';

    const algorithm = document.getElementById('algorithmSelect').value;
    const arr = [...this.array];
    const startTime = performance.now();

    let comparisons = 0, swaps = 0;

    if (algorithm === 'bubble') {
      const result = await this.bubbleSort(arr);
      comparisons = result.comparisons;
      swaps = result.swaps;
    } else if (algorithm === 'quick') {
      const result = await this.quickSort(arr);
      comparisons = result.comparisons;
      swaps = result.swaps;
    } else if (algorithm === 'merge') {
      const result = await this.mergeSort(arr);
      comparisons = result.comparisons;
      swaps = result.swaps;
    } else if (algorithm === 'binary') {
      // Binary search - find target
      const target = arr[Math.floor(Math.random() * arr.length)];
      const result = this.binarySearch(arr, target);
      comparisons = result.comparisons;
    }

    const endTime = performance.now();
    const elapsed = endTime - startTime;

    document.getElementById('comparisons').textContent = comparisons;
    document.getElementById('swaps').textContent = swaps || 0;
    document.getElementById('time').textContent = `${Math.round(elapsed)}ms`;
    document.getElementById('status').textContent = '✅ Done!';

    this.isRunning = false;
  }

  async bubbleSort(arr) {
    let comparisons = 0, swaps = 0;
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        comparisons++;
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          swaps++;
          this.array = [...arr];
          this.render();
          await this.delay(50 / this.speed);
        }
      }
    }
    return { comparisons, swaps };
  }

  async quickSort(arr) {
    let comparisons = 0, swaps = 0;
    const stack = [[0, arr.length - 1]];
    while (stack.length > 0) {
      const [low, high] = stack.pop();
      if (low < high) {
        const pivot = arr[high];
        let i = low - 1;
        for (let j = low; j < high; j++) {
          comparisons++;
          if (arr[j] < pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
            swaps++;
            this.array = [...arr];
            this.render();
            await this.delay(30 / this.speed);
          }
        }
        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
        swaps++;
        this.array = [...arr];
        this.render();
        await this.delay(30 / this.speed);
        stack.push([low, i]);
        stack.push([i + 2, high]);
      }
    }
    return { comparisons, swaps };
  }

  async mergeSort(arr) {
    let comparisons = 0, swaps = 0;
    const merge = async (left, mid, right) => {
      const leftArr = arr.slice(left, mid + 1);
      const rightArr = arr.slice(mid + 1, right + 1);
      let i = 0, j = 0, k = left;
      while (i < leftArr.length && j < rightArr.length) {
        comparisons++;
        if (leftArr[i] <= rightArr[j]) {
          arr[k] = leftArr[i];
          i++;
        } else {
          arr[k] = rightArr[j];
          j++;
        }
        swaps++;
        k++;
        this.array = [...arr];
        this.render();
        await this.delay(20 / this.speed);
      }
      while (i < leftArr.length) {
        arr[k] = leftArr[i];
        i++; k++; swaps++;
      }
      while (j < rightArr.length) {
        arr[k] = rightArr[j];
        j++; k++; swaps++;
      }
    };

    const ms = async (left, right) => {
      if (left < right) {
        const mid = Math.floor((left + right) / 2);
        await ms(left, mid);
        await ms(mid + 1, right);
        await merge(left, mid, right);
      }
    };
    await ms(0, arr.length - 1);
    return { comparisons, swaps };
  }

  binarySearch(arr, target) {
    let comparisons = 0;
    let left = 0, right = arr.length - 1;
    while (left <= right) {
      comparisons++;
      const mid = Math.floor((left + right) / 2);
      if (arr[mid] === target) return { comparisons, found: true };
      if (arr[mid] < target) left = mid + 1;
      else right = mid - 1;
    }
    return { comparisons, found: false };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reset() {
    this.generateArray();
    this.render();
    document.getElementById('comparisons').textContent = '0';
    document.getElementById('swaps').textContent = '0';
    document.getElementById('time').textContent = '0ms';
    document.getElementById('status').textContent = 'Ready';
  }

  async runComparison() {
    const panel = document.getElementById('comparisonPanel');
    panel.style.display = 'block';
    const algorithms = ['bubble', 'quick', 'merge'];
    const arr = [...this.array];
    const names = ['Bubble Sort', 'Quick Sort', 'Merge Sort'];
    const ids = ['bubbleTime', 'quickTime', 'mergeTime'];

    for (let i = 0; i < algorithms.length; i++) {
      const start = performance.now();
      const copy = [...arr];
      await this[algorithms[i] + 'Sort'](copy);
      const elapsed = performance.now() - start;
      document.getElementById(ids[i]).textContent = `${Math.round(elapsed)}ms`;
    }
  }

  saveScenario() {
    const scenario = {
      id: Date.now(),
      name: `Scenario ${this.scenarios.length + 1}`,
      algorithm: document.getElementById('algorithmSelect').value,
      size: this.arraySize,
      dataType: this.dataType,
      array: this.array,
      timestamp: new Date().toISOString()
    };
    this.scenarios.push(scenario);
    localStorage.setItem('scenarios', JSON.stringify(this.scenarios));
    this.loadScenarios();
  }

  loadScenarios() {
    const container = document.getElementById('scenarioList');
    container.innerHTML = this.scenarios.map(s => `
      <span class="scenario-tag" data-id="${s.id}">
        📌 ${s.name} (${s.algorithm}, n=${s.size})
      </span>
    `).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new WhatIfSimulator();
});