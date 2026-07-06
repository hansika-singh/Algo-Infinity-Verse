/**
 * System Design - LRU Cache Engine
 * Hybrid Architecture: DOM Absolute Positioning for CSS-accelerated O(1) pointer 
 * animations, backed by a real-time SVG overlay for DLL edges.
 */

class DLLNode {
    constructor(key, value, id) {
        this.key = key;
        this.value = value;
        this.prev = null;
        this.next = null;
        
        // Visualization IDs
        this.domId = `node-${id}`;
        this.x = 0; // Logical horizontal position
    }
}

class LRUCacheVisualizer {
    constructor() {
        this.dllContainer = document.getElementById('dll-container');
        this.mapContainer = document.getElementById('hash-map-table');
        this.svg = document.getElementById('pointer-svg');
        this.mathPanel = document.getElementById('math-overlay');
        this.mathEq = document.getElementById('math-equation');
        this.statusTxt = document.getElementById('main-status');
        
        this.capacity = 4;
        this.size = 0;
        this.nodeCounter = 0;
        this.map = new Map();
        
        this.hits = 0;
        this.misses = 0;

        // Dummy Nodes
        this.head = new DLLNode('HEAD', 'Dummy', 'head');
        this.tail = new DLLNode('TAIL', 'Dummy', 'tail');
        this.head.next = this.tail;
        this.tail.prev = this.head;

        // UI State
        this.animating = false;
        this.generator = null;
        this.timer = null;

        this.bindEvents();
        this.initDOMNodes();
        
        // Arrow Drawing Loop
        this.renderPointers();
    }

    bindEvents() {
        document.getElementById('btn-put').addEventListener('click', () => {
            const k = parseInt(document.getElementById('input-put-k').value, 10);
            const v = parseInt(document.getElementById('input-put-v').value, 10);
            if (!isNaN(k) && !isNaN(v)) {
                if (!this.animating) this.startAlgorithm(this.putAlgo(k, v), 'Put');
            } else {
                this.updateMath(`<span class="eq-err">Invalid Input</span>`);
            }
        });

        document.getElementById('btn-get').addEventListener('click', () => {
            const k = parseInt(document.getElementById('input-get-k').value, 10);
            if (!isNaN(k)) {
                if (!this.animating) this.startAlgorithm(this.getAlgo(k), 'Get');
            }
        });

        document.getElementById('input-cap').addEventListener('change', (e) => {
            let val = parseInt(e.target.value, 10);
            if (val >= 2 && val <= 6) {
                this.capacity = val;
                this.hardReset();
            }
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            if (!this.animating) this.hardReset();
        });

        document.getElementById('btn-step').addEventListener('click', () => this.step());
        document.getElementById('btn-play').addEventListener('click', () => this.togglePlay());
        window.addEventListener('resize', () => this.calculateLayout());
    }

    hardReset() {
        this.animating = false;
        if (this.timer) clearTimeout(this.timer);
        this.generator = null;
        
        this.map.clear();
        this.size = 0;
        this.hits = 0;
        this.misses = 0;
        
        this.head.next = this.tail;
        this.tail.prev = this.head;
        
        this.dllContainer.innerHTML = '<svg id="pointer-svg" class="pointer-svg"></svg>';
        this.svg = document.getElementById('pointer-svg');
        this.mapContainer.innerHTML = '';
        
        this.initDOMNodes();
        this.updateTelemetry();
        
        document.getElementById('btn-play').innerHTML = '<i class="fas fa-play"></i> Auto Run';
        document.getElementById('btn-play').disabled = false;
        document.getElementById('btn-step').disabled = false;
        this.mathPanel.classList.add('hidden');
        this.highlightCode(null);
        this.statusTxt.innerText = `Status: Cache Initialized | Capacity: ${this.capacity}`;
    }

    // --- Core Operations (Logic Only) ---
    _removeNode(node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    _addNodeAfterHead(node) {
        node.prev = this.head;
        node.next = this.head.next;
        this.head.next.prev = node;
        this.head.next = node;
    }

    // --- Visualization Sync Engine ---
    createDOMNode(node) {
        const el = document.createElement('div');
        el.className = `dll-node ${node.key === 'HEAD' || node.key === 'TAIL' ? 'dummy' : ''}`;
        el.id = node.domId;
        
        const keyEl = document.createElement('span');
        keyEl.className = 'node-key';
        keyEl.innerText = node.key === 'HEAD' || node.key === 'TAIL' ? node.key : `Key: ${node.key}`;
        
        const valEl = document.createElement('span');
        valEl.className = 'node-val';
        valEl.innerText = node.value;
        
        el.appendChild(keyEl);
        el.appendChild(valEl);
        this.dllContainer.appendChild(el);
    }

    initDOMNodes() {
        this.createDOMNode(this.head);
        this.createDOMNode(this.tail);
        this.calculateLayout();
    }

    calculateLayout() {
        // Calculates geometric target X based on logical linked list traversal
        const padding = 20;
        const nodeWidth = 80;
        const gap = 60; // Space for arrows
        
        let curr = this.head;
        let index = 0;
        
        // Dynamically center the DLL based on current size
        const containerWidth = this.dllContainer.clientWidth;
        const totalWidth = ((this.size + 2) * nodeWidth) + ((this.size + 1) * gap);
        const startX = Math.max(padding, (containerWidth - totalWidth) / 2);

        while (curr) {
            curr.x = startX + (index * (nodeWidth + gap));
            const domEl = document.getElementById(curr.domId);
            if (domEl) domEl.style.left = `${curr.x}px`;
            
            curr = curr.next;
            index++;
        }
    }

    updateMapUI() {
        this.mapContainer.innerHTML = `<div class="map-row" style="color: var(--text-muted); border-bottom: 1px solid var(--glass-border);"><span>Key</span><span>Pointer</span></div>`;
        for (let [k, node] of this.map.entries()) {
            const row = document.createElement('div');
            row.className = 'map-row';
            row.id = `map-row-${k}`;
            row.innerHTML = `<span>[${k}]</span> <span style="color: var(--accent-purple);">→ Mem(${node.domId.slice(-4)})</span>`;
            this.mapContainer.appendChild(row);
        }
    }

    highlightMapRow(key, type = 'highlight') {
        const row = document.getElementById(`map-row-${key}`);
        if (row) {
            row.classList.add(type);
            setTimeout(() => row.classList.remove(type), 1000);
        }
    }

    // --- SVG Pointer Engine ---
    renderPointers() {
        let svgContent = '';
        // Arrow Defs
        svgContent += `
            <defs>
                <marker id="arrow-next" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
                </marker>
                <marker id="arrow-prev" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
                </marker>
            </defs>
        `;

        const nodeWidth = 80;
        let curr = this.head;
        
        while (curr && curr.next) {
            const nxt = curr.next;
            // Next pointer (Top)
            const nStartX = curr.x + nodeWidth;
            const nStartY = 45; // slightly above center
            const nEndX = nxt.x - 5;
            
            svgContent += `<line x1="${nStartX}" y1="${nStartY}" x2="${nEndX}" y2="${nStartY}" stroke="#a855f7" stroke-width="2" marker-end="url(#arrow-next)" />`;
            
            // Prev pointer (Bottom)
            const pStartX = nxt.x;
            const pStartY = 75; // slightly below center
            const pEndX = curr.x + nodeWidth + 5;

            svgContent += `<line x1="${pStartX}" y1="${pStartY}" x2="${pEndX}" y2="${pStartY}" stroke="#06b6d4" stroke-width="2" marker-end="url(#arrow-prev)" />`;

            curr = curr.next;
        }

        if (this.svg) this.svg.innerHTML = svgContent;
        requestAnimationFrame(() => this.renderPointers()); // Constant loop for smooth CSS tracking
    }

    // --- UI/UX Helpers ---
    updateStatus(msg) { this.statusTxt.innerText = msg; }
    updateMath(eq) { this.mathEq.innerHTML = eq; this.mathPanel.classList.remove('hidden'); }
    updateTelemetry() {
        document.getElementById('stat-size').innerText = `${this.size} / ${this.capacity}`;
        document.getElementById('stat-hits').innerText = this.hits;
        document.getElementById('stat-misses').innerText = this.misses;
    }

    highlightCode(stepId, mode) {
        document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active', 'active-purple', 'active-danger'));
        document.getElementById('pseudo-put').classList.add('hidden');
        document.getElementById('pseudo-get').classList.add('hidden');
        
        if (mode === 'Put') document.getElementById('pseudo-put').classList.remove('hidden');
        if (mode === 'Get') document.getElementById('pseudo-get').classList.remove('hidden');
        
        if (stepId) document.getElementById(stepId).classList.add('active');
    }

    setNodeActive(node, state) {
        const el = document.getElementById(node.domId);
        if (el) {
            if (state) el.classList.add('active');
            else el.classList.remove('active');
        }
    }

    // --- Generator State Machines ---
    *getAlgo(k) {
        this.updateStatus(`Status: Get(${k})`);
        
        this.highlightCode('gt-1', 'Get');
        if (!this.map.has(k)) {
            this.misses++;
            this.updateTelemetry();
            this.updateMath(`Key <span class="eq-hl">[${k}]</span> not found in Map. <br><span class="eq-err">Cache Miss.</span>`);
            yield;
            
            this.highlightCode('gt-2', 'Get');
            this.updateStatus(`Status: Get Complete | Miss`);
            return;
        }

        this.hits++;
        this.updateTelemetry();
        this.highlightCode('gt-3', 'Get');
        this.updateMath(`Key <span class="eq-hl">[${k}]</span> exists. <span class="eq-ok">Cache Hit.</span>`);
        this.highlightMapRow(k);
        yield;

        this.highlightCode('gt-4', 'Get');
        const node = this.map.get(k);
        this.setNodeActive(node, true);
        yield;

        this.highlightCode('gt-5', 'Get');
        this._removeNode(node);
        this.calculateLayout(); // Animates gap closing
        this.updateMath(`Unlinking node from LRU chain.`);
        yield;

        this.highlightCode('gt-6', 'Get');
        this._addNodeAfterHead(node);
        this.calculateLayout(); // Animates node sliding to front
        this.updateMath(`Inserting node at Head <span class="eq-hl">(Most Recently Used)</span>.`);
        yield;

        this.highlightCode('gt-7', 'Get');
        this.setNodeActive(node, false);
        this.updateStatus(`Status: Get Complete | Value: ${node.value}`);
    }

    *putAlgo(k, v) {
        this.updateStatus(`Status: Put(${k}, ${v})`);
        
        this.highlightCode('pt-1', 'Put');
        if (this.map.has(k)) {
            this.updateMath(`Key <span class="eq-hl">[${k}]</span> exists in Map.`);
            this.highlightMapRow(k);
            yield;

            const node = this.map.get(k);
            this.setNodeActive(node, true);
            
            this.highlightCode('pt-2', 'Put');
            node.value = v;
            document.getElementById(node.domId).querySelector('.node-val').innerText = v;
            this.updateMath(`Updating value to <span class="eq-hl">${v}</span>.`);
            yield;

            this.highlightCode('pt-3', 'Put');
            this._removeNode(node);
            this._addNodeAfterHead(node);
            this.calculateLayout();
            this.updateMath(`Moving node to Head <span class="eq-hl">(Most Recently Used)</span>.`);
            yield;

            this.setNodeActive(node, false);
            this.updateStatus(`Status: Put Complete | Updated`);
            return;
        }

        this.highlightCode('pt-4', 'Put');
        this.updateMath(`Key <span class="eq-hl">[${k}]</span> is New.`);
        yield;

        this.highlightCode('pt-5', 'Put');
        if (this.size >= this.capacity) {
            this.updateMath(`Cache Size (${this.size}) == Capacity (${this.capacity}). <br><span class="eq-err">Cache Full. Must Evict.</span>`);
            yield;

            this.highlightCode('pt-6', 'Put');
            const lruNode = this.tail.prev;
            const domEl = document.getElementById(lruNode.domId);
            domEl.classList.add('evict');
            this.updateMath(`Identifying Tail.prev (Least Recently Used) -> Key: <span class="eq-err">[${lruNode.key}]</span>.`);
            yield;

            this.highlightCode('pt-7', 'Put');
            this._removeNode(lruNode);
            this.map.delete(lruNode.key);
            this.size--;
            
            domEl.classList.add('fade-out');
            setTimeout(() => domEl.remove(), 500);
            
            this.updateMapUI();
            this.calculateLayout();
            this.updateTelemetry();
            this.updateMath(`Evicted LRU node and removed from Hash Map.`);
            yield;
        } else {
            this.updateMath(`Cache has space. Proceeding to Insert.`);
            yield;
        }

        this.highlightCode('pt-8', 'Put');
        const newNode = new DLLNode(k, v, this.nodeCounter++);
        this.createDOMNode(newNode);
        this.setNodeActive(newNode, true);
        this.updateMath(`Created new Memory Node for [${k}: ${v}].`);
        yield;

        this.highlightCode('pt-9', 'Put');
        this._addNodeAfterHead(newNode);
        this.calculateLayout();
        this.updateMath(`Inserted new node at Head <span class="eq-hl">(MRU)</span>.`);
        yield;

        this.highlightCode('pt-10', 'Put');
        this.map.set(k, newNode);
        this.size++;
        this.updateMapUI();
        this.updateTelemetry();
        this.highlightMapRow(k);
        yield;

        this.setNodeActive(newNode, false);
        this.updateStatus(`Status: Put Complete | Inserted`);
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
            this.animating = false;
            document.getElementById('btn-play').innerHTML = '<i class="fas fa-check"></i> Done';
            document.getElementById('btn-play').disabled = true;
            document.getElementById('btn-step').disabled = true;
            setTimeout(() => { this.mathPanel.classList.add('hidden'); }, 3000);
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
    window.visualizer = new LRUCacheVisualizer();
});
