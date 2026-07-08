/**
 * Search Optimization - Median of Two Sorted Arrays
 * Simulates O(log(min(M, N))) Binary Search on Partition lines.
 */

class MedianVisualizer {
    constructor() {
        this.arrAContainer = document.getElementById('array-a-container');
        this.arrBContainer = document.getElementById('array-b-container');
        this.mathPanel = document.getElementById('math-overlay');
        this.mathEq = document.getElementById('math-equation');
        this.statusTxt = document.getElementById('main-status');
        
        this.btnPlay = document.getElementById('btn-play');
        this.btnStep = document.getElementById('btn-step');
        
        this.arrA = [];
        this.arrB = [];

        this.animating = false;
        this.generator = null;
        this.timer = null;

        this.bindEvents();
        this.loadArrays();
    }

    bindEvents() {
        document.getElementById('btn-generate').addEventListener('click', () => {
            if (!this.animating) this.loadArrays();
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            if (!this.animating) this.loadArrays();
        });

        this.btnStep.addEventListener('click', () => this.step());
        this.btnPlay.addEventListener('click', () => this.togglePlay());
    }

    parseInput(id) {
        const raw = document.getElementById(id).value;
        const parsed = raw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        return parsed.sort((a, b) => a - b);
    }

    loadArrays() {
        this.animating = false;
        if (this.timer) clearTimeout(this.timer);
        this.generator = null;

        let A = this.parseInput('input-a');
        let B = this.parseInput('input-b');

        // Constraint 1: Ensure A is the smaller array to guarantee O(log(min(M,N)))
        if (A.length > B.length) {
            this.arrA = B;
            this.arrB = A;
            document.getElementById('input-a').value = B.join(', ');
            document.getElementById('input-b').value = A.join(', ');
            this.statusTxt.innerText = `Status: Swapped Arrays to ensure Length A <= Length B`;
        } else {
            this.arrA = A;
            this.arrB = B;
            this.statusTxt.innerText = `Status: Arrays Loaded`;
        }

        this.renderDOMArrays();

        this.btnPlay.innerHTML = '<i class="fas fa-play"></i> Auto Run';
        this.btnPlay.disabled = false;
        this.btnStep.disabled = false;
        this.mathPanel.classList.add('hidden');
        this.highlightCode(null);
        
        document.getElementById('stat-bounds').innerText = `[0, ${this.arrA.length}]`;
        document.getElementById('stat-parta').innerText = `—`;
        document.getElementById('stat-partb').innerText = `—`;
        document.getElementById('stat-median').innerText = `—`;
    }

    // --- DOM Injectors ---
    createArrayElement(val, type, index) {
        const wrapper = document.createElement('div');
        wrapper.className = 'element-wrapper';

        // Preceding Partition Gap
        const gap = document.createElement('div');
        gap.className = 'partition-gap';
        gap.id = `gap-${type}-${index}`;
        wrapper.appendChild(gap);

        // Actual Value Block
        const block = document.createElement('div');
        block.className = val === -Infinity || val === Infinity ? 'array-block infinity' : 'array-block';
        block.id = `block-${type}-${index}`;
        block.innerText = val === -Infinity ? '-∞' : (val === Infinity ? '+∞' : val);
        
        if (val !== -Infinity && val !== Infinity) {
            const lbl = document.createElement('span');
            lbl.className = 'idx-label';
            lbl.innerText = `i=${index}`;
            block.appendChild(lbl);
        }

        wrapper.appendChild(block);
        return wrapper;
    }

    renderDOMArrays() {
        this.arrAContainer.innerHTML = '';
        this.arrBContainer.innerHTML = '';

        // Array A
        this.arrAContainer.appendChild(this.createArrayElement(-Infinity, 'A', -1)); // Virtual -Infinity
        for (let i = 0; i < this.arrA.length; i++) {
            this.arrAContainer.appendChild(this.createArrayElement(this.arrA[i], 'A', i));
        }
        // Final gap for A (After last element)
        const finalGapA = document.createElement('div');
        finalGapA.className = 'partition-gap';
        finalGapA.id = `gap-A-${this.arrA.length}`;
        this.arrAContainer.appendChild(finalGapA);
        
        this.arrAContainer.appendChild(this.createArrayElement(Infinity, 'A', this.arrA.length).querySelector('.array-block')); // Virtual +Infinity

        // Array B
        this.arrBContainer.appendChild(this.createArrayElement(-Infinity, 'B', -1));
        for (let i = 0; i < this.arrB.length; i++) {
            this.arrBContainer.appendChild(this.createArrayElement(this.arrB[i], 'B', i));
        }
        const finalGapB = document.createElement('div');
        finalGapB.className = 'partition-gap';
        finalGapB.id = `gap-B-${this.arrB.length}`;
        this.arrBContainer.appendChild(finalGapB);

        this.arrBContainer.appendChild(this.createArrayElement(Infinity, 'B', this.arrB.length).querySelector('.array-block'));
    }

    // --- UI State Managers ---
    highlightCode(stepId, styleClass = 'active') {
        document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active', 'active-danger', 'active-emerald'));
        if (stepId) document.getElementById(stepId).classList.add(styleClass);
    }

    updateMath(eq) {
        this.mathEq.innerHTML = eq;
        this.mathPanel.classList.remove('hidden');
    }

    resetBlockStyles() {
        document.querySelectorAll('.array-block').forEach(el => {
            el.className = el.classList.contains('infinity') ? 'array-block infinity' : 'array-block';
            const vLbl = el.querySelector('.var-label');
            if (vLbl) vLbl.remove();
        });
        document.querySelectorAll('.partition-gap').forEach(el => el.classList.remove('active-cut'));
    }

    dimUnsearchedBounds(low, high) {
        for (let i = 0; i < this.arrA.length; i++) {
            if (i < low || i >= high) {
                const el = document.getElementById(`block-A-${i}`);
                if (el) el.classList.add('dimmed');
            }
        }
    }

    applyCrossLabels(partA, partB, m, n) {
        this.resetBlockStyles();

        // Illuminate Cut Lines
        document.getElementById(`gap-A-${partA}`).classList.add('active-cut');
        document.getElementById(`gap-B-${partB}`).classList.add('active-cut');

        // Style MaxLeftA & MinRightA
        const leftA_El = document.getElementById(`block-A-${partA - 1}`);
        const rightA_El = document.getElementById(`block-A-${partA}`);
        
        if (leftA_El) {
            leftA_El.classList.add('left-a');
            leftA_El.innerHTML += `<span class="var-label eq-la">L_A</span>`;
        }
        if (rightA_El) {
            rightA_El.classList.add('right-a');
            rightA_El.innerHTML += `<span class="var-label eq-ra">R_A</span>`;
        }

        // Style MaxLeftB & MinRightB
        const leftB_El = document.getElementById(`block-B-${partB - 1}`);
        const rightB_El = document.getElementById(`block-B-${partB}`);
        
        if (leftB_El) {
            leftB_El.classList.add('left-b');
            leftB_El.innerHTML += `<span class="var-label eq-lb">L_B</span>`;
        }
        if (rightB_El) {
            rightB_El.classList.add('right-b');
            rightB_El.innerHTML += `<span class="var-label eq-rb">R_B</span>`;
        }
    }

    // --- Core Generator ---
    *runAlgorithm() {
        const m = this.arrA.length;
        const n = this.arrB.length;
        
        this.highlightCode('md-1');
        this.updateMath(`M (${m}) &le; N (${n}). Condition Satisfied.`);
        yield;

        let low = 0;
        let high = m;
        
        while (low <= high) {
            this.highlightCode('md-2');
            document.getElementById('stat-bounds').innerText = `[${low}, ${high}]`;
            this.dimUnsearchedBounds(low, high);
            this.updateMath(`Binary Search Space for A: <br> low = ${low}, high = ${high}`);
            yield;

            this.highlightCode('md-4');
            let partA = Math.floor((low + high) / 2);
            document.getElementById('stat-parta').innerText = partA;
            this.updateMath(`partA = floor((${low} + ${high}) / 2) = <span class="eq-la">${partA}</span>`);
            yield;

            this.highlightCode('md-5');
            let partB = Math.floor((m + n + 1) / 2) - partA;
            document.getElementById('stat-partb').innerText = partB;
            this.updateMath(`partB = floor((${m} + ${n} + 1) / 2) - ${partA} = <span class="eq-lb">${partB}</span>`);
            yield;

            this.highlightCode('md-6');
            let maxLeftA = partA === 0 ? -Infinity : this.arrA[partA - 1];
            let minRightA = partA === m ? Infinity : this.arrA[partA];
            let maxLeftB = partB === 0 ? -Infinity : this.arrB[partB - 1];
            let minRightB = partB === n ? Infinity : this.arrB[partB];

            this.applyCrossLabels(partA, partB, m, n);
            this.dimUnsearchedBounds(low, high); // Re-apply dims over new labels
            this.updateMath(`L_A: <span class="eq-la">${maxLeftA === -Infinity ? '-∞' : maxLeftA}</span> | R_A: <span class="eq-ra">${minRightA === Infinity ? '+∞' : minRightA}</span><br>L_B: <span class="eq-lb">${maxLeftB === -Infinity ? '-∞' : maxLeftB}</span> | R_B: <span class="eq-rb">${minRightB === Infinity ? '+∞' : minRightB}</span>`);
            yield;

            this.highlightCode('md-7');
            const cond1 = maxLeftA <= minRightB;
            const cond2 = maxLeftB <= minRightA;
            const strA = maxLeftA === -Infinity ? '-∞' : maxLeftA;
            const strRB = minRightB === Infinity ? '+∞' : minRightB;
            const strB = maxLeftB === -Infinity ? '-∞' : maxLeftB;
            const strRA = minRightA === Infinity ? '+∞' : minRightA;

            this.updateMath(`Checking Validity: <br> L_A (&le;) R_B: <span class="eq-la">${strA}</span> &le; <span class="eq-rb">${strRB}</span> &rarr; ${cond1 ? '<span class="eq-ok">TRUE</span>' : '<span class="eq-err">FALSE</span>'} <br> L_B (&le;) R_A: <span class="eq-lb">${strB}</span> &le; <span class="eq-ra">${strRA}</span> &rarr; ${cond2 ? '<span class="eq-ok">TRUE</span>' : '<span class="eq-err">FALSE</span>'}`);
            yield;

            if (cond1 && cond2) {
                // Partition Found
                this.highlightCode('md-8', 'active-emerald');
                this.statusTxt.innerText = `Status: Optimal Partition Found!`;
                
                let median;
                if ((m + n) % 2 === 0) {
                    let leftMax = Math.max(maxLeftA, maxLeftB);
                    let rightMin = Math.min(minRightA, minRightB);
                    median = (leftMax + rightMin) / 2;
                    this.updateMath(`Total Elements = ${m+n} (Even). <br> Median = (Max(L_A, L_B) + Min(R_A, R_B)) / 2 <br> Median = (${leftMax} + ${rightMin}) / 2 = <span class="eq-ok">${median.toFixed(1)}</span>`);
                } else {
                    median = Math.max(maxLeftA, maxLeftB);
                    this.updateMath(`Total Elements = ${m+n} (Odd). <br> Median = Max(L_A, L_B) <br> Median = <span class="eq-ok">${median}</span>`);
                }
                
                document.getElementById('stat-median').innerText = median;
                yield;
                break; // End
            } 
            else if (maxLeftA > minRightB) {
                this.highlightCode('md-9', 'active-danger');
                yield;
                
                this.highlightCode('md-10', 'active-danger');
                this.updateMath(`L_A (<span class="eq-la">${strA}</span>) > R_B (<span class="eq-rb">${strRB}</span>). <br><span class="eq-err">Cut for A is too far right. Moving Left.</span>`);
                high = partA - 1;
                yield;
            } 
            else {
                this.highlightCode('md-11', 'active-danger');
                yield;

                this.highlightCode('md-12', 'active-danger');
                this.updateMath(`L_B (<span class="eq-lb">${strB}</span>) > R_A (<span class="eq-ra">${strRA}</span>). <br><span class="eq-err">Cut for A is too far left. Moving Right.</span>`);
                low = partA + 1;
                yield;
            }
        }

        this.highlightCode(null);
        this.btnPlay.innerHTML = '<i class="fas fa-check"></i> Done';
        this.btnPlay.disabled = true;
        this.btnStep.disabled = true;
        this.animating = false;
    }

    // --- Control Flow ---
    startAlgorithm() {
        if (this.animating) return;
        this.resetBlockStyles();
        this.generator = this.runAlgorithm();
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
            this.timer = setTimeout(() => this.autoStep(), 1800); // 1.8s Pacing for deep reading of conditions
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new MedianVisualizer();
});
