/**
 * Advanced Arrays - Fenwick Tree (Binary Indexed Tree) Engine
 * Visualizes the implicit hierarchical tree and the LSB bitwise operations
 * necessary to achieve O(log N) updates and prefix sum queries.
 */

class FenwickVisualizer {
    constructor() {
        this.canvas = document.getElementById('viz-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.arrContainer = document.getElementById('bit-array-container');
        
        this.mathPanel = document.getElementById('math-overlay');
        this.mathEq = document.getElementById('math-equation');
        this.statusTxt = document.getElementById('main-status');
        
        this.btnPlay = document.getElementById('btn-play');
        this.btnStep = document.getElementById('btn-step');

        this.N = 16; // Fixed size for clean complete binary tree
        this.tree = new Array(this.N + 1).fill(0);
        
        this.animating = false;
        this.generator = null;
        this.timer = null;
        
        this.activeNodes = new Set(); // Stores indices currently highlighted
        this.evalMode = 'none'; // 'add' or 'query'

        this.bindEvents();
        this.initDOMArray();
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        this.renderLoop();
    }

    bindEvents() {
        document.getElementById('btn-add').addEventListener('click', () => {
            const idx = parseInt(document.getElementById('input-add-idx').value, 10);
            const val = parseInt(document.getElementById('input-add-val').value, 10);
            if (!isNaN(idx) && !isNaN(val) && idx >= 1 && idx <= this.N) {
                if (!this.animating) this.startAlgorithm(this.addAlgo(idx, val), 'add');
            } else {
                this.updateMath(`<span class="eq-err">Invalid Input. Index must be 1-16.</span>`);
            }
        });

        document.getElementById('btn-query').addEventListener('click', () => {
            const idx = parseInt(document.getElementById('input-query-idx').value, 10);
            if (!isNaN(idx) && idx >= 1 && idx <= this.N) {
                if (!this.animating) this.startAlgorithm(this.queryAlgo(idx), 'query');
            } else {
                this.updateMath(`<span class="eq-err">Invalid Input. Index must be 1-16.</span>`);
            }
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            if (!this.animating) this.resetState();
        });

        this.btnStep.addEventListener('click', () => this.step());
        this.btnPlay.addEventListener('click', () => this.togglePlay());
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    initDOMArray() {
        this.arrContainer.innerHTML = '';
        for (let i = 1; i <= this.N; i++) {
            const block = document.createElement('div');
            block.className = 'array-block';
            block.id = `block-${i}`;
            block.innerText = '0';
            
            const idx = document.createElement('span');
            idx.className = 'idx-label';
            idx.innerText = i;
            block.appendChild(idx);

            const bin = document.createElement('span');
            bin.className = 'bin-label';
            bin.innerText = i.toString(2).padStart(5, '0');
            block.appendChild(bin);

            this.arrContainer.appendChild(block);
        }
    }

    resetState() {
        this.animating = false;
        if (this.timer) clearTimeout(this.timer);
        this.generator = null;
        
        this.tree.fill(0);
        for (let i = 1; i <= this.N; i++) {
            const block = document.getElementById(`block-${i}`);
            block.childNodes[0].nodeValue = '0'; // update text node safely
            block.classList.remove('eval-cyan', 'eval-purple');
        }
        
        this.activeNodes.clear();
        this.evalMode = 'none';
        
        this.btnPlay.innerHTML = '<i class="fas fa-play"></i> Auto Run';
        this.btnPlay.disabled = false;
        this.btnStep.disabled = false;
        this.mathPanel.classList.add('hidden');
        this.highlightCode(null);
        document.getElementById('stat-idx').innerText = '—';
        document.getElementById('stat-sum').innerText = '0';
        this.statusTxt.innerText = `Status: Array Reset | N = ${this.N}`;
    }

    // --- Bitwise & Telemetry Helpers ---
    getLSB(i) {
        return i & (-i);
    }

    formatBinaryStr(i) {
        const bin = i.toString(2).padStart(5, '0');
        const lsb = this.getLSB(i);
        const lsbStr = lsb.toString(2);
        
        // Find position of the '1' that represents the LSB
        const sliceIdx = bin.length - lsbStr.length;
        const prefix = bin.substring(0, sliceIdx);
        const suffix = bin.substring(sliceIdx + 1);
        
        return `${prefix}<span class="eq-lsb">1</span>${suffix}`;
    }

    updateMath(eq) {
        this.mathEq.innerHTML = eq;
        this.mathPanel.classList.remove('hidden');
    }

    highlightCode(stepId, mode) {
        document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active', 'active-purple'));
        document.getElementById('pseudo-add').classList.add('hidden');
        document.getElementById('pseudo-query').classList.add('hidden');
        
        if (mode === 'add') document.getElementById('pseudo-add').classList.remove('hidden');
        if (mode === 'query') document.getElementById('pseudo-query').classList.remove('hidden');
        
        if (stepId) {
            const colorClass = mode === 'add' ? 'active' : 'active-purple';
            document.getElementById(stepId).classList.add(colorClass);
        }
    }

    setBlockActive(index, mode) {
        document.querySelectorAll('.array-block').forEach(b => b.classList.remove('eval-cyan', 'eval-purple'));
        this.activeNodes.clear();
        
        if (index >= 1 && index <= this.N) {
            this.activeNodes.add(index);
            const style = mode === 'add' ? 'eval-cyan' : 'eval-purple';
            document.getElementById(`block-${index}`).classList.add(style);
        }
    }

    // --- Generators ---
    *addAlgo(idx, delta) {
        this.evalMode = 'add';
        this.statusTxt.innerText = `Status: Add(index: ${idx}, delta: ${delta})`;
        
        while (idx <= this.N) {
            this.highlightCode('ad-1', 'add');
            document.getElementById('stat-idx').innerText = idx;
            this.setBlockActive(idx, 'add');
            
            this.updateMath(`Evaluating Index: ${idx} <br> Binary: ${this.formatBinaryStr(idx)}`);
            yield;

            this.highlightCode('ad-2', 'add');
            this.tree[idx] += delta;
            document.getElementById(`block-${idx}`).childNodes[0].nodeValue = this.tree[idx];
            this.updateMath(`tree[<span class="eq-hl">${idx}</span>] += ${delta} <br> New Value: <span class="eq-hl">${this.tree[idx]}</span>`);
            yield;

            this.highlightCode('ad-3', 'add');
            const lsb = this.getLSB(idx);
            this.updateMath(`Extract Least Significant Bit (LSB): <br> ${idx} & -${idx} = <span class="eq-lsb">${lsb}</span>`);
            yield;

            this.highlightCode('ad-4', 'add');
            const nextIdx = idx + lsb;
            this.updateMath(`Advance to Parent: index += LSB <br> <span class="eq-hl">${idx}</span> + <span class="eq-lsb">${lsb}</span> = <span class="eq-hl">${nextIdx}</span>`);
            idx = nextIdx;
            yield;
        }

        this.highlightCode(null, 'add');
        this.mathPanel.classList.add('hidden');
        this.setBlockActive(-1, 'none');
        this.statusTxt.innerText = `Status: Add Operation Complete`;
        this.btnPlay.innerHTML = '<i class="fas fa-check"></i> Done';
        this.btnPlay.disabled = true;
        this.btnStep.disabled = true;
        this.animating = false;
        this.evalMode = 'none';
    }

    *queryAlgo(idx) {
        this.evalMode = 'query';
        this.statusTxt.innerText = `Status: PrefixSum(${idx})`;
        
        this.highlightCode('qr-1', 'query');
        let sum = 0;
        document.getElementById('stat-sum').innerText = sum;
        this.updateMath(`Initialize sum = 0`);
        yield;

        while (idx > 0) {
            this.highlightCode('qr-2', 'query');
            document.getElementById('stat-idx').innerText = idx;
            this.setBlockActive(idx, 'query');
            
            this.updateMath(`Evaluating Index: ${idx} <br> Binary: ${this.formatBinaryStr(idx)}`);
            yield;

            this.highlightCode('qr-3', 'query');
            sum += this.tree[idx];
            document.getElementById('stat-sum').innerText = sum;
            this.updateMath(`sum += tree[<span class="eq-p">${idx}</span>] <br> sum += ${this.tree[idx]} = <span class="eq-p">${sum}</span>`);
            yield;

            this.highlightCode('qr-4', 'query');
            const lsb = this.getLSB(idx);
            this.updateMath(`Extract Least Significant Bit (LSB): <br> ${idx} & -${idx} = <span class="eq-lsb">${lsb}</span>`);
            yield;

            this.highlightCode('qr-5', 'query');
            const nextIdx = idx - lsb;
            this.updateMath(`Fallback to aggregate prior range: index -= LSB <br> <span class="eq-p">${idx}</span> - <span class="eq-lsb">${lsb}</span> = <span class="eq-p">${nextIdx}</span>`);
            idx = nextIdx;
            yield;
        }

        this.highlightCode('qr-6', 'query');
        this.updateMath(`Index reached 0. <br> Final Prefix Sum = <span class="eq-p">${sum}</span>`);
        yield;

        this.highlightCode(null, 'query');
        setTimeout(() => this.mathPanel.classList.add('hidden'), 3000);
        this.setBlockActive(-1, 'none');
        this.statusTxt.innerText = `Status: Query Complete | Result: ${sum}`;
        this.btnPlay.innerHTML = '<i class="fas fa-check"></i> Done';
        this.btnPlay.disabled = true;
        this.btnStep.disabled = true;
        this.animating = false;
        this.evalMode = 'none';
    }

    // --- Control Flow ---
    startAlgorithm(generator, mode) {
        if (this.animating) return;
        this.generator = generator;
        this.animating = true;
        
        this.btnPlay.innerHTML = '<i class="fas fa-pause"></i> Pause';
        this.btnPlay.disabled = false;
        document.getElementById('btn-step').disabled = false;
        
        this.autoStep();
    }

    togglePlay() {
        this.animating = !this.animating;
        const btnPlay = document.getElementById('btn-play');
        btnPlay.innerHTML = this.animating ? '<i class="fas fa-pause"></i> Pause' : '<i class="fas fa-play"></i> Auto Run';
        if (this.animating) this.autoStep();
    }

    step() {
        if (!this.generator) return false;
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
            this.timer = setTimeout(() => this.autoStep(), 1500); // 1.5s Pacing to absorb the bitwise math
        }
    }

    // --- Canvas Drawing (Implicit Tree) ---
    getDOMCenter(index) {
        const el = document.getElementById(`block-${index}`);
        if (!el) return { x: 0 };
        
        // Relative to the visualizer-stage
        const stageRect = document.querySelector('.visualizer-stage').getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        
        return {
            x: (elRect.left - stageRect.left) + (elRect.width / 2)
        };
    }

    renderLoop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Drawing Coverage Brackets
        // Level Y coordinates based on LSB power (1, 2, 4, 8, 16)
        const levels = { 1: 180, 2: 140, 4: 100, 8: 60, 16: 20 };
        
        for (let i = 1; i <= this.N; i++) {
            const lsb = this.getLSB(i);
            const startIdx = i - lsb + 1;
            
            const startPos = this.getDOMCenter(startIdx);
            const endPos = this.getDOMCenter(i);
            const y = levels[lsb];

            const isActive = this.activeNodes.has(i);

            this.ctx.beginPath();
            this.ctx.moveTo(startPos.x, y + 10);
            this.ctx.lineTo(startPos.x, y);
            this.ctx.lineTo(endPos.x, y);
            this.ctx.lineTo(endPos.x, y + 10);

            if (isActive) {
                this.ctx.lineWidth = 4;
                this.ctx.strokeStyle = this.evalMode === 'add' ? '#06b6d4' : '#a855f7';
                this.ctx.shadowColor = this.ctx.strokeStyle;
                this.ctx.shadowBlur = 10;
            } else {
                this.ctx.lineWidth = 1.5;
                this.ctx.strokeStyle = '#334155';
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.stroke();
            this.ctx.shadowBlur = 0; // reset
            
            // Draw connection line down to the array block
            this.ctx.beginPath();
            this.ctx.moveTo(endPos.x, y);
            this.ctx.lineTo(endPos.x, 220); // bottom of canvas area
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = isActive ? (this.evalMode === 'add' ? '#06b6d4' : '#a855f7') : '#1e293b';
            this.ctx.stroke();
        }

        requestAnimationFrame(() => this.renderLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Small delay to allow DOM Flexbox to settle before initial Canvas mapping
    setTimeout(() => {
        window.visualizer = new FenwickVisualizer();
    }, 100);
});
