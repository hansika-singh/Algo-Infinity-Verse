/**
 * Algo-Infinity-Verse | DOM-Based Suffix Array & LCP Matrix Engine
 * Visualizes Prefix-Doubling Cyclic Sorts and Kasai's Linear LCP Algorithm.
 */

class SuffixArrayVisualizer {
  constructor() {
    // Inputs & Controls
    this.inputString = document.getElementById('input-string');
    this.btnGen = document.getElementById('btn-generate');
    this.btnPlay = document.getElementById('btn-play');
    this.btnStep = document.getElementById('btn-step');
    this.btnReset = document.getElementById('btn-reset');
    this.speedSlider = document.getElementById('speed-slider');
    
    // Search
    this.inputSearch = document.getElementById('input-search');
    this.btnSearch = document.getElementById('btn-search');
    this.searchResultBox = document.getElementById('search-result');
    
    // DOM Targets
    this.matrixContainer = document.getElementById('matrix-container');
    this.statusText = document.getElementById('status-text');

    // Engine State
    this.text = "";
    this.n = 0;
    this.rowElements = []; 
    // rowElements track physical DOM nodes. Index corresponds to original text suffix index.
    
    this.generator = null;
    this.isPlaying = false;
    this.animSpeed = 1.0;
    this.autoPlayTimeout = null;
    
    // Final calculated arrays (for search capabilities)
    this.SA = [];
    this.LCP = [];

    this.bindEvents();
    this.ROW_HEIGHT = 42; // pixels (height + margin)
  }

  bindEvents() {
    this.btnGen.addEventListener('click', () => this.initializeEngine());
    
    this.btnPlay.addEventListener('click', () => {
      if (this.isPlaying) this.pauseAutoPlay();
      else this.startAutoPlay();
    });

    this.btnStep.addEventListener('click', () => {
      this.pauseAutoPlay();
      this.stepForward();
    });

    this.btnReset.addEventListener('click', () => {
      this.pauseAutoPlay();
      this.initializeEngine();
    });

    this.speedSlider.addEventListener('input', (e) => {
      this.animSpeed = parseFloat(e.target.value);
      document.getElementById('speed-val').textContent = `${this.animSpeed.toFixed(1)}x`;
    });

    this.btnSearch.addEventListener('click', () => this.performSearch());
    this.inputSearch.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.performSearch();
    });
  }

  /* --- DOM Engine Initialization --- */
  
  initializeEngine() {
    // Sanitize and append terminal
    let raw = this.inputString.value.toLowerCase().replace(/[^a-z]/g, '').slice(0, 15);
    if (!raw) raw = "banana";
    this.text = raw + "$";
    this.n = this.text.length;
    
    this.inputString.value = raw; // Clean UI
    this.searchResultBox.innerHTML = "Ready to search.";
    this.SA = [];
    this.LCP = new Array(this.n).fill(0);
    this.rowElements = [];
    this.matrixContainer.innerHTML = '';
    
    // Create physical rows
    for (let i = 0; i < this.n; i++) {
      const suffixString = this.text.substring(i);
      const row = this.createRowDOM(i, suffixString);
      row.style.top = `${i * this.ROW_HEIGHT}px`; // Initial raw order
      this.matrixContainer.appendChild(row);
      this.rowElements.push({
        id: i,
        dom: row,
        saIdxCell: row.querySelector('.cell-sa-val'),
        lcpCell: row.querySelector('.cell-lcp-val'),
        charCells: Array.from(row.querySelectorAll('.char-cell'))
      });
      this.SA.push(i);
    }
    
    this.generator = this.algorithmGenerator();
    this.btnStep.disabled = false;
    this.btnPlay.disabled = false;
    this.updateStatus('Engine Loaded. Press Step to begin Prefix-Doubling Cyclic Sort.', 0);
  }

  createRowDOM(originalIdx, suffixStr) {
    const row = document.createElement('div');
    row.className = 'suffix-row';
    
    let charsHtml = '';
    for (let c of suffixStr) {
      const charClass = c === '$' ? 'char-terminal' : '';
      charsHtml += `<div class="char-cell ${charClass}">${c}</div>`;
    }

    row.innerHTML = `
      <div class="col-idx cell-val text-secondary">${originalIdx}</div>
      <div class="col-sa cell-val cell-sa-val">-</div>
      <div class="col-lcp cell-val cell-lcp-val">-</div>
      <div class="col-suffix string-wrapper">${charsHtml}</div>
    `;
    return row;
  }

  /* --- Generator Engine (Sorting & Kasai's) --- */

  *algorithmGenerator() {
    // PHASE 1: Prefix-Doubling Cyclic Sort Approximation
    yield* this.simulatePrefixDoubling();
    
    // Clear highlights from sort phase
    this.clearAllHighlights();

    // PHASE 2: Kasai's LCP Algorithm
    yield* this.runKasaisAlgorithm();
    
    yield {
      msg: 'Matrix Generation Complete! Ready for O(M log N) substring searches.',
      phase: 0,
      activeRow: null,
      compareRow: null
    };
  }

  *simulatePrefixDoubling() {
    let k = 1;
    while (k < this.n) {
      // Sort SA based on prefixes of length k
      this.SA.sort((a, b) => {
        const strA = this.text.substring(a, Math.min(a + k, this.n));
        const strB = this.text.substring(b, Math.min(b + k, this.n));
        if (strA === strB) return 0; // Maintain stability visually for same prefixes
        return strA < strB ? -1 : 1;
      });

      yield {
        msg: `Cyclic Sort: Sorting by prefixes of length ${k}`,
        phase: 1,
        prefixLength: k
      };

      k *= 2; // Doubling phase
    }

    // Final sorting pass (Full resolution)
    this.SA.sort((a, b) => {
        return this.text.substring(a).localeCompare(this.text.substring(b));
    });

    yield {
      msg: `Suffix Array fully sorted! SA generation complete.`,
      phase: 1,
      prefixLength: this.n // Trigger final physical arrangement
    };
  }

  *runKasaisAlgorithm() {
    // Generate Inverse Suffix Array
    const invSA = new Array(this.n);
    for (let i = 0; i < this.n; i++) invSA[this.SA[i]] = i;
    
    let k = 0; // LCP length

    for (let i = 0; i < this.n; i++) {
      const saIndex = invSA[i]; // Where is suffix `i` in the sorted SA?
      const currRow = this.rowElements[i];

      if (saIndex === 0) {
        k = 0;
        this.LCP[saIndex] = 0;
        currRow.lcpCell.textContent = '0';
        yield { msg: `Kasai's: Skip SA[0] (no previous suffix to compare). LCP is 0.`, phase: 2, activeRow: currRow, compareRow: null };
        continue;
      }

      const prevSuffixIdx = this.SA[saIndex - 1]; // Previous suffix in sorted array
      const prevRow = this.rowElements[prevSuffixIdx];

      yield { 
        msg: `Kasai's: Evaluating original suffix ${i}. Comparing with previous SA entry.`, 
        phase: 2, 
        activeRow: currRow, 
        compareRow: prevRow,
        highlightK: 0
      };

      // Visually calculate LCP
      while (i + k < this.n && prevSuffixIdx + k < this.n && this.text[i + k] === this.text[prevSuffixIdx + k]) {
        k++;
        yield { 
          msg: `Kasai's: Character Match! LCP length is now ${k}.`, 
          phase: 2, 
          activeRow: currRow, 
          compareRow: prevRow,
          highlightK: k // Tell UI to highlight up to length k
        };
      }

      this.LCP[saIndex] = k;
      currRow.lcpCell.textContent = k;

      if (k > 0) {
        k--; // Kasai's rule: LCP of next suffix is at least k - 1
        yield { 
          msg: `Kasai's: Mismatch reached. LCP logged. Decrement k to ${k} for next suffix optimization.`, 
          phase: 2, 
          activeRow: currRow, 
          compareRow: prevRow,
          highlightK: k + 1,
          showMismatch: true
        };
      } else {
        yield { 
          msg: `Kasai's: Mismatch. LCP is 0. Resetting.`, 
          phase: 2, 
          activeRow: currRow, 
          compareRow: prevRow,
          showMismatch: true
        };
      }
    }
  }

  /* --- UI Frame Applier --- */
  
  stepForward() {
    if (!this.generator) return;
    const { value, done } = this.generator.next();

    if (done || !value) {
      this.pauseAutoPlay();
      this.btnStep.disabled = true;
      this.btnPlay.disabled = true;
      return;
    }
    this.applyState(value);
  }

  applyState(state) {
    this.updateStatus(state.msg, state.phase);
    this.clearAllHighlights();

    // PHASE 1 Logic: Physical Sorting
    if (state.phase === 1 && state.prefixLength) {
      this.applyPhysicalSort(state.prefixLength);
    }

    // PHASE 2 Logic: Kasai's Visualization
    if (state.phase === 2 && state.activeRow) {
      state.activeRow.dom.classList.add('row-active-kasai');
      
      if (state.compareRow) {
        state.compareRow.dom.classList.add('row-compare-kasai');
        
        // Highlight matching characters based on k
        const k = state.highlightK || 0;
        for(let j=0; j < k; j++) {
           if(state.activeRow.charCells[j]) state.activeRow.charCells[j].classList.add('char-match');
           if(state.compareRow.charCells[j]) state.compareRow.charCells[j].classList.add('char-match');
        }

        // Highlight the mismatched character failure point
        if (state.showMismatch) {
           if(state.activeRow.charCells[k]) state.activeRow.charCells[k].classList.add('char-mismatch');
           if(state.compareRow.charCells[k]) state.compareRow.charCells[k].classList.add('char-mismatch');
        }
      }
    }
  }

  applyPhysicalSort(prefixLen) {
    // Update DOM 'top' positions based on current SA order
    for (let saIndex = 0; saIndex < this.n; saIndex++) {
      const originalIdx = this.SA[saIndex];
      const rowData = this.rowElements[originalIdx];
      
      // Update vertical position in Flex/Absolute matrix
      rowData.dom.style.top = `${saIndex * this.ROW_HEIGHT}px`;
      
      // Update SA index column
      rowData.saIdxCell.textContent = saIndex;
      rowData.saIdxCell.style.color = 'var(--primary)';

      // Highlight the prefix being evaluated
      rowData.charCells.forEach((cell, idx) => {
        if (idx < prefixLen && cell.textContent !== '$') {
          cell.style.color = '#fff';
          cell.style.borderColor = 'var(--primary)';
        } else {
          cell.style.color = '';
          cell.style.borderColor = '';
        }
      });
    }
  }

  clearAllHighlights() {
    this.rowElements.forEach(r => {
      r.dom.classList.remove('row-active-kasai', 'row-compare-kasai', 'row-search-hit');
      r.charCells.forEach(c => {
        c.classList.remove('char-match', 'char-mismatch');
        c.style.color = '';
        c.style.borderColor = '';
      });
    });
  }

  updateStatus(msg, phase) {
    this.statusText.textContent = msg;
    document.querySelectorAll('.phase-item').forEach(el => el.classList.remove('active-phase'));
    if (phase >= 1 && phase <= 2) {
      document.getElementById(`phase-${phase}-indicator`).classList.add('active-phase');
    }
  }

  /* --- Substring Search (Binary Search on SA) --- */

  performSearch() {
    if (this.SA.length === 0 || this.btnPlay.disabled === false) {
      this.searchResultBox.innerHTML = `<span class="not-found-msg">Generate and build the matrix first!</span>`;
      return;
    }
    
    this.clearAllHighlights();
    const pattern = this.inputSearch.value.toLowerCase().trim();
    if (!pattern) return;

    const m = pattern.length;
    
    // Binary Search to find Left Bound
    let l = 0, r = this.n - 1, leftBound = -1;
    while (l <= r) {
      const mid = Math.floor((l + r) / 2);
      const suffix = this.text.substring(this.SA[mid]);
      const res = suffix.substring(0, m).localeCompare(pattern);
      if (res === 0) {
        leftBound = mid;
        r = mid - 1; // Keep searching left for first occurrence
      } else if (res < 0) l = mid + 1;
      else r = mid - 1;
    }

    if (leftBound === -1) {
      this.searchResultBox.innerHTML = `<span class="not-found-msg">Pattern '${pattern}' not found in string.</span>`;
      return;
    }

    // Binary Search to find Right Bound
    l = 0; r = this.n - 1;
    let rightBound = -1;
    while (l <= r) {
      const mid = Math.floor((l + r) / 2);
      const suffix = this.text.substring(this.SA[mid]);
      const res = suffix.substring(0, m).localeCompare(pattern);
      if (res === 0) {
        rightBound = mid;
        l = mid + 1; // Keep searching right for last occurrence
      } else if (res < 0) l = mid + 1;
      else r = mid - 1;
    }

    const count = rightBound - leftBound + 1;
    this.searchResultBox.innerHTML = `<span class="found-msg">Found ${count} occurrence(s) between SA indices [${leftBound}, ${rightBound}].</span>`;

    // Highlight found rows
    for (let i = leftBound; i <= rightBound; i++) {
      const originalIdx = this.SA[i];
      const rowData = this.rowElements[originalIdx];
      rowData.dom.classList.add('row-search-hit');
      
      // Highlight exact matched chars in the suffix
      for(let j=0; j<m; j++) {
         if (rowData.charCells[j]) rowData.charCells[j].classList.add('char-match');
      }
    }
  }

  /* --- Playback Controllers --- */

  startAutoPlay() {
    this.isPlaying = true;
    this.btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    this.btnPlay.classList.replace('btn-primary', 'btn-accent');
    
    const tick = () => {
      if (!this.isPlaying) return;
      this.stepForward();
      
      if (this.btnStep.disabled) {
        this.pauseAutoPlay();
        return;
      }
      const delay = Math.max(200, 1500 / this.animSpeed);
      this.autoPlayTimeout = setTimeout(tick, delay);
    };
    tick();
  }

  pauseAutoPlay() {
    this.isPlaying = false;
    clearTimeout(this.autoPlayTimeout);
    this.btnPlay.innerHTML = '<i class="fa-solid fa-play"></i> Auto Play';
    this.btnPlay.classList.replace('btn-accent', 'btn-primary');
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  new SuffixArrayVisualizer();
});
