/**
 * System Design - LFU Cache Engine
 * Multi-tiered DOM architecture visualizing O(1) Frequency Maps and Double Linked Lists.
 * Uses absolute coordinates to float nodes between frequency rows during promotion.
 */

class LFUNode {
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.freq = 1;
        this.prev = null;
        this.next = null;
        this.domId = `node-${key}`;
    }
}

class DoublyLinkedList {
    constructor() {
        this.head = new LFUNode('H', 0);
        this.tail = new LFUNode('T', 0);
        this.head.next = this.tail;
        this.tail.prev = this.head;
        this.size = 0;
    }
    
    addFirst(node) {
        node.prev = this.head;
        node.next = this.head.next;
        this.head.next.prev = node;
        this.head.next = node;
        this.size++;
    }
    
    remove(node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
        this.size--;
    }
    
    removeLast() {
        if (this.size === 0) return null;
        const res = this.tail.prev;
        this.remove(res);
        return res;
    }
}

class LFUVisualizer {
    constructor() {
        // UI Elements
        this.mapContainer = document.getElementById('hash-map-table');
        this.tiersBgContainer = document.getElementById('tiers-background');
        this.nodesLayer = document.getElementById('nodes-layer');
        this.mathPanel = document.getElementById('math-overlay');
        this.mathEq = document.getElementById('math-equation');
        this.statusTxt = document.getElementById('main-status');
        
        this.btnPlay = document.getElementById('btn-play');
        this.btnStep = document.getElementById('btn-step');

        // LFU State
        this.capacity = 4;
        this.size = 0;
        this.minFreq = 0;
        this.keyMap = new Map(); // key -> LFUNode
        this.freqMap = new Map(); // freq -> DLL
        
        this.hits = 0;
        this.misses = 0;
        this.activeFrequencies = new Set(); // To render UI rows

        // Engine State
        this.animating = false;
        this.generator = null;
        this.timer = null;

        this.bindEvents();
        this.hardReset();
        window.addEventListener('resize', () => this.calculateLayout());
    }

    bindEvents() {
        document.getElementById('btn-put').addEventListener('click', () => {
            const k = parseInt(document.getElementById('input-put-k').value, 10);
            const v = parseInt(document.getElementById('input-put-v').value, 10);
            if (!isNaN(k) && !isNaN(v)) {
                if (!this.animating) this.startAlgorithm(this.putAlgo(k, v), 'Put');
            }
        });

        document.getElementById('btn-get').addEventListener('click', () => {
            const k = parseInt(document.getElementById('input-get-k').value, 10);
            if (!isNaN(k)) {
                if (!this.animating) this.startAlgorithm(this.getAlgo(k, true), 'Get');
            }
        });

        document.getElementById('input-cap').addEventListener('change', (e) => {
            let val = parseInt(e.target.value, 10);
            if (val >= 2 && val <= 8) {
                this.capacity = val;
                this.hardReset();
            }
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            if (!this.animating) this.hardReset();
        });

        this.btnStep.addEventListener('click', () => this.step());
        this.btnPlay.addEventListener('click', () => this.togglePlay());
    }

    hardReset() {
        this.animating = false;
        if (this.timer) clearTimeout(this.timer);
        this.generator = null;
        
        this.keyMap.clear();
        this.freqMap.clear();
        this.activeFrequencies.clear();
        
        this.size = 0;
        this.minFreq = 0;
        this.hits = 0;
        this.misses = 0;
        
        this.tiersBgContainer.innerHTML = '';
        this.nodesLayer.innerHTML = '';
        this.mapContainer.innerHTML = '';
        
        this.ensureTierExists(1);
        this.updateTelemetry();
        
        this.btnPlay.innerHTML = '<i class="fas fa-play"></i> Auto Run';
        this.btnPlay.disabled = false;
        this.btnStep.disabled = false;
        this.mathPanel.classList.add('hidden');
        this.highlightCode(null);
        this.statusTxt.innerText = `Status: Cache Initialized | Capacity: ${this.capacity}`;
    }

    // --- Visualization Architecture ---
    
    ensureTierExists(f) {
        if (!this.freqMap.has(f)) {
            this.freqMap.set(f, new DoublyLinkedList());
            this.activeFrequencies.add(f);
            this.renderTierBackgrounds();
        }
    }

    renderTierBackgrounds() {
        this.tiersBgContainer.innerHTML = '';
        // Sort descending so highest frequency is at the top of the flex-column-reverse
        let sortedFreqs = Array.from(this.activeFrequencies).sort((a,b) => a - b);
        
        // Ensure at least Freq 1 is visible
        if (sortedFreqs.length === 0) sortedFreqs = [1];

        sortedFreqs.forEach((f, index) => {
            const row = document.createElement('div');
            row.className = `tier-row ${f === this.minFreq ? 'min-freq' : ''}`;
            row.id = `tier-bg-${f}`;
            
            const label = document.createElement('div');
            label.className = 'tier-label';
            label.innerText = `Freq ${f}`;
            row.appendChild(label);
            
            // Only add MRU/LRU labels to the bottom tier
            if (index === 0) {
                const markers = document.createElement('div');
                markers.className = 'mru-lru-markers';
                markers.innerHTML = `<span>← MRU</span><span>LRU →</span>`;
                row.appendChild(markers);
            }
            
            this.tiersBgContainer.appendChild(row);
        });
        
        // Wait a tick for DOM layout, then physically arrange nodes
        setTimeout(() => this.calculateLayout(), 10);
    }

    createDOMNode(node) {
        const el = document.createElement('div');
        el.className = 'lfu-node';
        el.id = node.domId;
        
        el.innerHTML = `
            <span class="node-f">${node.freq}</span>
            <span class="node-k">Key: ${node.key}</span>
            <span class="node-v">${node.value}</span>
        `;
        this.nodesLayer.appendChild(el);
    }

    calculateLayout() {
        const stageRect = this.nodesLayer.getBoundingClientRect();
        const startX = 60; // Padding from left
        const nodeWidth = 70;
        
        // We calculate positions relative to the dynamically stacked tier-rows
        for (let [f, dll] of this.freqMap.entries()) {
            const bgRow = document.getElementById(`tier-bg-${f}`);
            if (!bgRow) continue;
            
            // Find absolute center of the row relative to the nodesLayer
            const rowRect = bgRow.getBoundingClientRect();
            const relativeY = rowRect.top - stageRect.top + (rowRect.height / 2);
            
            let curr = dll.head.next;
            let index = 0;
            
            while (curr !== dll.tail) {
                const domEl = document.getElementById(curr.domId);
                if (domEl) {
                    const relativeX = startX + (index * nodeWidth);
                    domEl.style.left = `${relativeX}px`;
                    domEl.style.top = `${relativeY}px`;
                    
                    // Update frequency badge
                    const fBadge = domEl.querySelector('.node-f');
                    if (fBadge) fBadge.innerText = curr.freq;
                }
                curr = curr.next;
                index++;
            }
        }
    }

    updateMapUI() {
        this.mapContainer.innerHTML = `<div class="map-row" style="color: var(--text-muted); border-bottom: 1px solid var(--glass-border);"><span>Key</span><span>Freq</span></div>`;
        for (let [k, node] of this.keyMap.entries()) {
            const row = document.createElement('div');
            row.className = 'map-row';
            row.id = `map-row-${k}`;
            row.innerHTML = `<span>[${k}]</span> <span style="color: var(--accent-purple);">f=${node.freq}</span>`;
            this.mapContainer.appendChild(row);
        }
    }

    highlightMapRow(key) {
        const row = document.getElementById(`map-row-${key}`);
        if (row) {
            row.classList.add('highlight');
            setTimeout(() => row.classList.remove('highlight'), 1000);
        }
    }

    setNodeActive(node, state) {
        const el = document.getElementById(node.domId);
        if (el) {
            if (state) el.classList.add('active');
            else el.classList.remove('active');
        }
    }

    // --- State Generators ---
    
    // Internal Get Routine (Yields execution to the caller)
    *getRoutine(k) {
        const node = this.keyMap.get(k);
        this.setNodeActive(node, true);
        
        const oldFreq = node.freq;
        this.updateMath(`Node <span class="eq-hl">[${k}]</span> found. <br> Current Freq = <span class="eq-p">${oldFreq}</span>`);
        yield;

        this.highlightCode('gt-5', 'Get');
        this.freqMap.get(oldFreq).remove(node);
        this.calculateLayout(); // Slide gap closed
        this.updateMath(`Removed from freqMap[<span class="eq-p">${oldFreq}</span>]`);
        yield;

        this.highlightCode('gt-6', 'Get');
        if (this.freqMap.get(oldFreq).size === 0 && this.minFreq === oldFreq) {
            this.highlightCode('gt-7', 'Get');
            this.minFreq++;
            this.updateTelemetry();
            this.renderTierBackgrounds();
            this.updateMath(`freqMap[${oldFreq}] is empty and minFreq == ${oldFreq}. <br> <span class="eq-w">minFreq incremented to ${this.minFreq}</span>`);
            yield;
        }

        this.highlightCode('gt-8', 'Get');
        node.freq++;
        this.ensureTierExists(node.freq);
        this.updateMath(`node.freq incremented to <span class="eq-p">${node.freq}</span>`);
        yield;

        this.highlightCode('gt-9', 'Get');
        this.freqMap.get(node.freq).addFirst(node);
        this.updateMapUI();
        this.calculateLayout(); // Animate floating up to new tier
        this.updateMath(`Inserted node at Head of freqMap[<span class="eq-p">${node.freq}</span>]`);
        yield;
        
        return node;
    }

    *getAlgo(k, isStandalone) {
        this.updateStatus(`Status: Get(${k})`);
        this.highlightCode('gt-1', 'Get');
        
        if (!this.keyMap.has(k)) {
            this.misses++;
            this.updateTelemetry();
            this.updateMath(`Key <span class="eq-hl">[${k}]</span> not in Map. <br><span class="eq-err">Cache Miss.</span>`);
            yield;
            
            this.highlightCode('gt-2', 'Get');
            this.updateStatus(`Status: Get Complete | Miss`);
            this.highlightCode(null);
            this.animating = false;
            return;
        }

        this.hits++;
        this.updateTelemetry();
        this.highlightCode('gt-3', 'Get');
        this.highlightMapRow(k);
        this.updateMath(`Key <span class="eq-hl">[${k}]</span> exists. <span class="eq-ok">Cache Hit.</span>`);
        yield;

        this.highlightCode('gt-4', 'Get');
        yield;

        const node = yield* this.getRoutine(k);

        this.highlightCode('gt-10', 'Get');
        this.setNodeActive(node, false);
        this.updateStatus(`Status: Get Complete | Value: ${node.value}`);
        this.highlightCode(null);
        this.mathPanel.classList.add('hidden');
        this.animating = false;
    }

    *putAlgo(k, v) {
        this.updateStatus(`Status: Put(${k}, ${v})`);
        
        this.highlightCode('pt-1', 'Put');
        if (this.keyMap.has(k)) {
            this.highlightCode('pt-2', 'Put');
            const node = this.keyMap.get(k);
            node.value = v;
            document.getElementById(node.domId).querySelector('.node-v').innerText = v;
            this.updateMath(`Key <span class="eq-hl">[${k}]</span> exists. Updated value to <span class="eq-hl">${v}</span>`);
            this.highlightMapRow(k);
            yield;

            this.highlightCode('pt-3', 'Put');
            this.updateMath(`Calling internal Get(${k}) to promote frequency.`);
            yield;

            // Switch to Get Pseudocode briefly
            document.getElementById('pseudo-put').classList.add('hidden');
            document.getElementById('pseudo-get').classList.remove('hidden');
            const updatedNode = yield* this.getRoutine(k);
            this.setNodeActive(updatedNode, false);
            
            document.getElementById('pseudo-put').classList.remove('hidden');
            document.getElementById('pseudo-get').classList.add('hidden');

            this.updateStatus(`Status: Put Complete | Updated & Promoted`);
            this.highlightCode(null);
            this.mathPanel.classList.add('hidden');
            this.animating = false;
            return;
        }

        this.highlightCode('pt-4', 'Put');
        this.updateMath(`Key <span class="eq-hl">[${k}]</span> is New.`);
        yield;

        this.highlightCode('pt-5', 'Put');
        if (this.size >= this.capacity) {
            this.updateMath(`Cache Full (${this.size}/${this.capacity}). <br><span class="eq-err">Must Evict LRU from minFreq tier.</span>`);
            yield;

            this.highlightCode('pt-6', 'Put');
            const minList = this.freqMap.get(this.minFreq);
            this.updateMath(`Targeting DLL at freqMap[<span class="eq-w">${this.minFreq}</span>]`);
            yield;

            this.highlightCode('pt-7', 'Put');
            const evictNode = minList.removeLast();
            const domEl = document.getElementById(evictNode.domId);
            domEl.classList.add('evict');
            this.updateMath(`Evicting Tail (LRU): Key <span class="eq-err">[${evictNode.key}]</span>`);
            yield;

            this.highlightCode('pt-8', 'Put');
            this.keyMap.delete(evictNode.key);
            this.size--;
            
            domEl.classList.add('fade-out');
            setTimeout(() => domEl.remove(), 500);
            
            this.updateMapUI();
            this.calculateLayout();
            this.updateTelemetry();
            yield;
        }

        this.highlightCode('pt-9', 'Put');
        const newNode = new LFUNode(k, v);
        this.createDOMNode(newNode);
        this.setNodeActive(newNode, true);
        this.updateMath(`Created new Node [${k}:${v}]. Initial Freq = 1.`);
        yield;

        this.highlightCode('pt-10', 'Put');
        this.ensureTierExists(1);
        this.freqMap.get(1).addFirst(newNode);
        this.calculateLayout();
        this.updateMath(`Inserted at Head of freqMap[1].`);
        yield;

        this.highlightCode('pt-11', 'Put');
        this.keyMap.set(k, newNode);
        this.minFreq = 1;
        this.size++;
        this.updateMapUI();
        this.updateTelemetry();
        this.renderTierBackgrounds(); // updates glow
        this.highlightMapRow(k);
        this.updateMath(`Updated Map and Size. <br> <span class="eq-w">minFreq reset to 1.</span>`);
        yield;

        this.setNodeActive(newNode, false);
        this.updateStatus(`Status: Put Complete | Inserted`);
        this.highlightCode(null);
        this.mathPanel.classList.add('hidden');
        this.animating = false;
    }

    // --- Control Flow ---
    startAlgorithm(generator, mode) {
        if (this.animating) return;
        this.generator = generator;
        this.animating = true;
        
        const btnPlay = document.getElementById('btn-play');
        btnPlay.innerHTML = '<i class="fas fa-pause"></i> Pause';
        btnPlay.disabled = false;
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
            document.getElementById('btn-play').innerHTML = '<i class="fas fa-check"></i> Done';
            document.getElementById('btn-play').disabled = true;
            document.getElementById('btn-step').disabled = true;
            return false;
        }
        return true;
    }

    autoStep() {
        if (!this.animating) return;
        const hasNext = this.step();
        if (hasNext) {
            this.timer = setTimeout(() => this.autoStep(), 1200);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new LFUVisualizer();
});
