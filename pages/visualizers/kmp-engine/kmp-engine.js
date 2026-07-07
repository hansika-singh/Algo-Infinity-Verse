/**
 * String Algorithms - Knuth-Morris-Pratt (KMP) Pattern Matching
 * Hybrid DOM execution engine. Uses dynamic CSS transforms (translateX)
 * to physically animate the $O(1)$ string shifts across the screen.
 */

class KMPVisualizer {
    constructor() {
        // UI Elements
        this.lpsPatContainer = document.getElementById('lps-pattern-container');
        this.lpsValContainer = document.getElementById('lps-values-container');
        this.txtContainer = document.getElementById('search-text-container');
        this.patContainer = document.getElementById('search-pattern-container');
        
        this.mathPanel = document.getElementById('math-overlay');
        this.mathEq = document.getElementById('math-equation');
        this.statusTxt = document.getElementById('main-status');

        this.btnPlay = document.getElementById('btn-play');
        this.btnStep = document.getElementById('btn-step');
        
        // Data State
        this.text = "";
        this.pattern = "";
        this.lps = [];
        this.charWidth = 44; // 40px width + 4px gap mapping to CSS
        
        // Engine State
        this.animating = false;
        this.generator = null;
        this.timer = null;

        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('btn-generate').addEventListener('click', () => {
            this.text = document.getElementById('input-text').value.trim();
            this.pattern = document.getElementById('input-pattern').value.trim();
            
            if (this.text.length > 0 && this.pattern.length > 0) {
                this.initDOMArrays();
            } else {
                this.updateMath(`<span class="eq-err">Error: Text and Pattern cannot be empty.</span>`);
            }
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            if (!this.animating) {
                this.lpsPatContainer.innerHTML = '';
                this.lpsValContainer.innerHTML = '';
                this.txtContainer.innerHTML = '';
                this.patContainer.innerHTML = '';
                this.btnPlay.disabled = true;
                this.btnStep.disabled = true;
                document.getElementById('stage-lps').classList.remove('active-stage');
                document.getElementById('stage-search').classList.remove('active-stage');
                this.updateStatus(`Status: Arrays Reset`);
            }
        });

        this.btnStep.addEventListener('click', () => this.step());
        this.btnPlay.addEventListener('click', () => this.togglePlay());
    }

    // --- DOM Array Injectors ---
    createCharBlock(char, id, indexLbl, topLbl = null) {
        const block = document.createElement('div');
        block.className = 'char-block';
        block.id = id;
        block.innerText = char;
        
        if (indexLbl !== null) {
            const idx = document.createElement('span');
            idx.className = 'idx-lbl';
            idx.innerText = indexLbl;
            block.appendChild(idx);
        }
        
        if (topLbl !== null) {
            const tlbl = document.createElement('span');
            tlbl.className = 'top-lbl';
            tlbl.innerText = topLbl;
            tlbl.id = `${id}-top`;
            block.appendChild(tlbl);
        }
        
        return block;
    }

    initDOMArrays() {
        this.animating = false;
        if (this.timer) clearTimeout(this.timer);
        this.generator = null;
        this.lps = new Array(this.pattern.length).fill(0);
        
        // Clear containers
        this.lpsPatContainer.innerHTML = '';
        this.lpsValContainer.innerHTML = '';
        this.txtContainer.innerHTML = '';
        this.patContainer.innerHTML = '';
        
        // Reset CSS Transforms
        this.patContainer.style.transform = `translateX(0px)`;

        // Phase 1: LPS Arrays
        for (let i = 0; i < this.pattern.length; i++) {
            this.lpsPatContainer.appendChild(this.createCharBlock(this.pattern[i], `lps-p-${i}`, i, null));
            this.lpsValContainer.appendChild(this.createCharBlock('', `lps-v-${i}`, i, null));
        }

        // Phase 2: Search Arrays
        for (let i = 0; i < this.text.length; i++) {
            this.txtContainer.appendChild(this.createCharBlock(this.text[i], `txt-${i}`, i, null));
        }
        for (let j = 0; j < this.pattern.length; j++) {
            this.patContainer.appendChild(this.createCharBlock(this.pattern[j], `pat-${j}`, j, null));
        }

        // Setup UI State
        this.btnPlay.innerHTML = '<i class="fas fa-play"></i> Auto Run';
        this.btnPlay.disabled = false;
        this.btnStep.disabled = false;
        this.mathPanel.classList.add('hidden');
        document.getElementById('stage-lps').classList.remove('active-stage');
        document.getElementById('stage-search').classList.remove('active-stage');
        
        this.updateStatus(`Status: Strings Initialized. Ready for LPS Generation.`);
    }

    // --- UI Update Helpers ---
    updateStatus(msg) { this.statusTxt.innerText = msg; }
    updateMath(eq) { this.mathEq.innerHTML = eq; this.mathPanel.classList.remove('hidden'); }
    
    highlightCode(stepId, mode) {
        document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active', 'active-purple', 'active-danger'));
        document.getElementById('pseudo-lps').classList.add('hidden');
        document.getElementById('pseudo-search').classList.add('hidden');
        
        const block = mode === 'lps' ? 'pseudo-lps' : 'pseudo-search';
        document.getElementById(block).classList.remove('hidden');
        
        if (stepId) document.getElementById(stepId).classList.add('active');
    }

    clearBlockHighlights(prefix) {
        document.querySelectorAll(`.char-block[id^="${prefix}"]`).forEach(b => {
            b.classList.remove('eval-cyan', 'eval-purple', 'match', 'mismatch');
            const topLbl = b.querySelector('.top-lbl');
            if (topLbl) topLbl.innerText = '';
        });
    }

    setBlockState(id, stateClass, topText = null) {
        const block = document.getElementById(id);
        if (block) {
            block.className = `char-block ${stateClass}`;
            if (topText !== null) {
                let lbl = document.getElementById(`${id}-top`);
                if (!lbl) {
                    lbl = document.createElement('span');
                    lbl.className = 'top-lbl';
                    lbl.id = `${id}-top`;
                    block.appendChild(lbl);
                }
                lbl.innerText = topText;
            }
        }
    }

    // --- Algorithms as Generators ---
    
    *generateLPS() {
        document.getElementById('stage-lps').classList.add('active-stage');
        this.updateStatus(`Status: Phase 1 - Building LPS Array`);
        
        this.highlightCode('lps-1', 'lps');
        let len = 0;
        let i = 1;
        this.lps[0] = 0;
        
        // Update first DOM cell
        document.getElementById('lps-v-0').innerText = '0';
        document.getElementById('lps-v-0').classList.add('match');
        this.updateMath(`Base Case: lps[0] is always <span class="eq-hl">0</span>.`);
        yield;

        while (i < this.pattern.length) {
            this.clearBlockHighlights('lps-p');
            this.highlightCode('lps-2', 'lps');
            
            this.setBlockState(`lps-p-${len}`, 'eval-purple', 'len');
            this.setBlockState(`lps-p-${i}`, 'eval-cyan', 'i');
            yield;

            this.highlightCode('lps-3', 'lps');
            if (this.pattern[i] === this.pattern[len]) {
                this.updateMath(`pat[i] (<span class="eq-hl">${this.pattern[i]}</span>) == pat[len] (<span class="eq-p">${this.pattern[len]}</span>)`);
                yield;

                this.highlightCode('lps-4', 'lps');
                len++;
                this.lps[i] = len;
                
                document.getElementById(`lps-v-${i}`).innerText = len;
                document.getElementById(`lps-v-${i}`).classList.add('match');
                this.updateMath(`Increment len. <br> lps[${i}] = <span class="eq-hl">${len}</span>.`);
                i++;
                yield;
            } else {
                this.updateMath(`pat[i] (<span class="eq-hl">${this.pattern[i]}</span>) != pat[len] (<span class="eq-p">${this.pattern[len]}</span>) <br><span class="eq-err">Mismatch!</span>`);
                this.setBlockState(`lps-p-${i}`, 'mismatch', 'i');
                yield;

                this.highlightCode('lps-5', 'lps');
                yield;

                if (len !== 0) {
                    this.highlightCode('lps-6', 'lps');
                    this.updateMath(`len != 0. Fallback to previous LPS value: <br> len = lps[${len-1}] = <span class="eq-p">${this.lps[len - 1]}</span>`);
                    len = this.lps[len - 1];
                    yield;
                } else {
                    this.highlightCode('lps-7', 'lps');
                    this.lps[i] = 0;
                    document.getElementById(`lps-v-${i}`).innerText = 0;
                    document.getElementById(`lps-v-${i}`).classList.add('match');
                    this.updateMath(`len == 0. No matching prefix. <br> lps[${i}] = <span class="eq-hl">0</span>.`);
                    i++;
                    yield;
                }
            }
        }
        
        this.clearBlockHighlights('lps-p');
        this.highlightCode(null, 'lps');
        this.updateStatus(`Status: Phase 1 Complete. LPS Array Generated.`);
    }

    *runKMP() {
        // Phase 1: Build LPS
        yield* this.generateLPS();
        
        // Transition to Phase 2
        document.getElementById('stage-lps').classList.remove('active-stage');
        document.getElementById('stage-search').classList.add('active-stage');
        this.updateStatus(`Status: Phase 2 - Pattern Matching`);
        
        this.highlightCode('kmp-1', 'search');
        let i = 0; // index for text
        let j = 0; // index for pattern
        this.updateMath(`Initialize Pointers: i = 0, j = 0`);
        yield;

        while (i < this.text.length) {
            this.clearBlockHighlights('txt');
            this.clearBlockHighlights('pat');
            
            // Re-color confirmed matches in pattern behind j
            for (let k = 0; k < j; k++) {
                document.getElementById(`pat-${k}`).classList.add('match');
                document.getElementById(`txt-${i - j + k}`).classList.add('match');
            }

            this.highlightCode('kmp-2', 'search');
            this.setBlockState(`txt-${i}`, 'eval-cyan', 'i');
            this.setBlockState(`pat-${j}`, 'eval-purple', 'j');
            yield;

            if (this.pattern[j] === this.text[i]) {
                this.highlightCode('kmp-3', 'search');
                this.updateMath(`text[i] (<span class="eq-hl">${this.text[i]}</span>) == pat[j] (<span class="eq-p">${this.pattern[j]}</span>). <br><span style="color:var(--accent-emerald)">Match. Advancing pointers.</span>`);
                
                this.setBlockState(`txt-${i}`, 'match');
                this.setBlockState(`pat-${j}`, 'match');
                i++;
                j++;
                yield;

                this.highlightCode('kmp-4', 'search');
                if (j === this.pattern.length) {
                    this.highlightCode('kmp-5', 'search');
                    this.updateMath(`j == M. <br><span style="color:var(--accent-emerald)">Full Pattern Found at index ${i - j}!</span>`);
                    yield;

                    // Fallback to continue searching
                    const shift = j - this.lps[j - 1];
                    this.updateMath(`Searching for more... Fallback: <br> j = lps[${j-1}] = <span class="eq-p">${this.lps[j-1]}</span>`);
                    j = this.lps[j - 1];
                    
                    // Slide Pattern Window via CSS Transform
                    this.patContainer.style.transform = `translateX(${shift * this.charWidth}px)`;
                    yield;
                }
            } 
            else {
                this.highlightCode('kmp-6', 'search');
                this.updateMath(`text[i] (<span class="eq-hl">${this.text[i]}</span>) != pat[j] (<span class="eq-p">${this.pattern[j]}</span>) <br><span class="eq-err">Mismatch!</span>`);
                this.setBlockState(`txt-${i}`, 'mismatch');
                this.setBlockState(`pat-${j}`, 'mismatch');
                yield;

                if (j !== 0) {
                    this.highlightCode('kmp-7', 'search');
                    
                    const newJ = this.lps[j - 1];
                    const physicalShift = (i - newJ); // Calculate alignment logic
                    
                    this.updateMath(`j != 0. Using LPS Array to avoid back-tracking 'i'. <br> j = lps[${j-1}] = <span class="eq-p">${newJ}</span>`);
                    
                    // Slide Pattern Window via CSS Transform
                    this.patContainer.style.transform = `translateX(${physicalShift * this.charWidth}px)`;
                    j = newJ;
                    yield;
                } 
                else {
                    this.highlightCode('kmp-8', 'search');
                    this.updateMath(`j == 0. Pattern start mismatch. <br> Sliding window forward: <span class="eq-hl">i++</span>.`);
                    
                    // Slide Pattern Window by 1 block
                    const physicalShift = i + 1;
                    this.patContainer.style.transform = `translateX(${physicalShift * this.charWidth}px)`;
                    i++;
                    yield;
                }
            }
        }

        this.clearBlockHighlights('txt');
        this.clearBlockHighlights('pat');
        this.highlightCode(null, 'search');
        this.mathPanel.classList.add('hidden');
        this.updateStatus(`Status: Algorithm Complete. Reached end of text.`);
        this.btnPlay.innerHTML = '<i class="fas fa-check"></i> Done';
        this.btnPlay.disabled = true;
        this.btnStep.disabled = true;
        this.animating = false;
    }

    // --- Control Flow ---
    startAlgorithm() {
        if (this.animating) return;
        this.generator = this.runKMP();
        this.animating = true;
        
        this.btnPlay.innerHTML = '<i class="fas fa-pause"></i> Pause';
        this.btnPlay.disabled = false;
        document.getElementById('btn-step').disabled = false;
        
        this.autoStep();
    }

    togglePlay() {
        if (!this.generator) {
            this.startAlgorithm();
            return;
        }
        
        this.animating = !this.animating;
        this.btnPlay.innerHTML = this.animating ? '<i class="fas fa-pause"></i> Pause' : '<i class="fas fa-play"></i> Auto Run';
        if (this.animating) this.autoStep();
    }

    step() {
        if (!this.generator) this.startAlgorithm();
        
        const res = this.generator.next();
        if (res.done) {
            this.generator = null;
            return false;
        }
        return true;
    }

    autoStep() {
        if (!this.animating) return;
        const hasNext = this.step();
        if (hasNext) {
            this.timer = setTimeout(() => this.autoStep(), 1200); // 1.2s Educational Pacing
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new KMPVisualizer();
});
