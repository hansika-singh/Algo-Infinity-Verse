/**
 * heap-3d-visualizer.js
 * Implements the 3D Binary Heap & Priority Queue Visualizer.
 * State machine for insertions, sift operations, array hover highlights, and 3D rotations.
 */

document.addEventListener("DOMContentLoaded", () => {
    window.heapVisualizer = new Heap3DVisualizer();
});

class Heap3DVisualizer {
    constructor() {
        this.cacheDOM();
        this.init();
    }

    cacheDOM() {
        this.dom = {
            btnMinMode: document.getElementById("btnMinMode"),
            btnMaxMode: document.getElementById("btnMaxMode"),
            nodeValueInput: document.getElementById("nodeValueInput"),
            btnInsertNode: document.getElementById("btnInsertNode"),
            btnExtractRoot: document.getElementById("btnExtractRoot"),
            btnPresetRandom: document.getElementById("btnPresetRandom"),
            btnPresetSorted: document.getElementById("btnPresetSorted"),
            
            rotateX: document.getElementById("rotateX"),
            rotateXVal: document.getElementById("rotateXVal"),
            rotateY: document.getElementById("rotateY"),
            rotateYVal: document.getElementById("rotateYVal"),
            btnResetRotation: document.getElementById("btnResetRotation"),
            
            speedSlider: document.getElementById("speedSlider"),
            speedValue: document.getElementById("speedValue"),
            btnStepForward: document.getElementById("btnStepForward"),
            btnResetAll: document.getElementById("btnResetAll"),
            
            viewport3DWrapper: document.getElementById("viewport3DWrapper"),
            svgOverlay3D: document.getElementById("svgOverlay3D"),
            treeContainer3D: document.getElementById("treeContainer3D"),
            arrayContainer: document.getElementById("arrayContainer"),
            
            logContainer: document.getElementById("logContainer"),
            btnClearLogs: document.getElementById("btnClearLogs"),
            
            hudActiveIndex: document.getElementById("hudActiveIndex"),
            hudParentIndex: document.getElementById("hudParentIndex"),
            hudLeftIndex: document.getElementById("hudLeftIndex"),
            hudRightIndex: document.getElementById("hudRightIndex")
        };
    }

    init() {
        this.heap = [];
        this.mode = "min"; // default Mode
        this.speed = 1.0;
        this.pitch = 10;   // rotateX
        this.yaw = -10;    // rotateY
        
        this.isPlaying = false;
        this.animationQueue = [];
        this.currentStepIdx = 0;
        this.swapTransitionTime = 600; // in milliseconds
        this.activeConnectorHighlight = null;

        this.bindEvents();
        this.update3DTransforms();
        this.renderInitialUI();
    }

    bindEvents() {
        // Mode Selector
        this.dom.btnMinMode.addEventListener("click", () => this.setMode("min"));
        this.dom.btnMaxMode.addEventListener("click", () => this.setMode("max"));

        // Insert / Extract
        this.dom.btnInsertNode.addEventListener("click", () => this.insertValue());
        this.dom.nodeValueInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") this.insertValue();
        });
        this.dom.btnExtractRoot.addEventListener("click", () => this.extractRoot());

        // Presets
        this.dom.btnPresetRandom.addEventListener("click", () => this.loadRandomPreset());
        this.dom.btnPresetSorted.addEventListener("click", () => this.loadSortedPreset());

        // Viewport rotation sliders
        this.dom.rotateX.addEventListener("input", (e) => {
            this.pitch = parseInt(e.target.value);
            this.dom.rotateXVal.textContent = `${this.pitch}°`;
            this.update3DTransforms();
            this.drawConnectors();
        });
        this.dom.rotateY.addEventListener("input", (e) => {
            this.yaw = parseInt(e.target.value);
            this.dom.rotateYVal.textContent = `${this.yaw}°`;
            this.update3DTransforms();
            this.drawConnectors();
        });
        this.dom.btnResetRotation.addEventListener("click", () => {
            this.pitch = 10;
            this.yaw = -10;
            this.dom.rotateX.value = this.pitch;
            this.dom.rotateY.value = this.yaw;
            this.dom.rotateXVal.textContent = `${this.pitch}°`;
            this.dom.rotateYVal.textContent = `${this.yaw}°`;
            this.update3DTransforms();
            this.drawConnectors();
            this.log("3D Viewport rotation reset.", "sys");
        });

        // Config Controls
        this.dom.speedSlider.addEventListener("input", (e) => {
            this.speed = parseFloat(e.target.value);
            this.dom.speedValue.textContent = `${this.speed.toFixed(1)}x`;
            this.swapTransitionTime = 600 / this.speed;
        });
        this.dom.btnStepForward.addEventListener("click", () => this.stepForward());
        this.dom.btnResetAll.addEventListener("click", () => this.clearAll());
        this.dom.btnClearLogs.addEventListener("click", () => {
            this.dom.logContainer.innerHTML = "";
            this.log("Logs cleared.", "sys");
        });

        // Responsiveness
        window.addEventListener("resize", () => {
            this.drawConnectors();
        });
    }

    log(msg, type = "sys") {
        const div = document.createElement("div");
        div.className = `log-entry ${type}`;
        div.textContent = `> ${msg}`;
        this.dom.logContainer.appendChild(div);
        this.dom.logContainer.scrollTop = this.dom.logContainer.scrollHeight;

        if (this.dom.logContainer.children.length > 200) {
            this.dom.logContainer.removeChild(this.dom.logContainer.firstChild);
        }
    }

    setMode(mode) {
        if (this.isPlaying) return;
        if (this.mode === mode) return;

        this.mode = mode;
        this.dom.btnMinMode.classList.toggle("active", mode === "min");
        this.dom.btnMaxMode.classList.toggle("active", mode === "max");
        this.dom.btnMinMode.setAttribute("aria-pressed", String(mode === "min"));
        this.dom.btnMaxMode.setAttribute("aria-pressed", String(mode === "max"));
        this.log(`Heap Mode changed to: ${mode.toUpperCase()}-HEAP`, "sys");

        // Re-heapify current tree
        this.rebuildHeapFromCurrent();
    }

    rebuildHeapFromCurrent() {
        const values = [...this.heap];
        this.heap = [];
        values.forEach(v => {
            // Re-insert silently
            this.heap.push(v);
            this.siftUpSilently(this.heap.length - 1);
        });
        this.renderInitialUI();
        this.log("Heap reorganized according to the new Mode.", "sys");
    }

    siftUpSilently(index) {
        while (index > 0) {
            const parentIdx = Math.floor((index - 1) / 2);
            if (this.compareValues(this.heap[index], this.heap[parentIdx])) {
                const temp = this.heap[index];
                this.heap[index] = this.heap[parentIdx];
                this.heap[parentIdx] = temp;
                index = parentIdx;
            } else {
                break;
            }
        }
    }

    compareValues(v1, v2) {
        if (this.mode === "min") {
            return v1 < v2;
        } else {
            return v1 > v2;
        }
    }

    update3DTransforms() {
        // Apply pitch (X) and yaw (Y) to the rotated container
        this.dom.treeContainer3D.style.transform = `rotateX(${this.pitch}deg) rotateY(${this.yaw}deg)`;
    }

    getNodeCoords(i) {
        const depth = Math.floor(Math.log2(i + 1));
        const nodesInLevel = Math.pow(2, depth);
        const posInLevel = i - (nodesInLevel - 1);
        
        const verticalSpacing = 85;
        const maxTreeWidth = 520;
        
        // As we go deeper, pack nodes closer horizontally
        const levelWidth = maxTreeWidth / Math.pow(1.5, depth);
        
        const x = ((posInLevel + 0.5) / nodesInLevel - 0.5) * levelWidth;
        const y = (depth * verticalSpacing) - 120;
        const z = -depth * 40; // depth offsets in 3D
        
        return { x, y, z };
    }

    renderInitialUI() {
        this.renderTree();
        this.renderArray();
        this.drawConnectors();
    }

    renderTree() {
        this.dom.treeContainer3D.innerHTML = "";
        this.heap.forEach((val, idx) => {
            const coords = this.getNodeCoords(idx);
            
            const node = document.createElement("div");
            node.className = "heap-node-3d";
            node.id = `node-${idx}`;
            node.setAttribute("data-index", idx);
            node.style.transform = `translate3d(${coords.x}px, ${coords.y}px, ${coords.z}px)`;
            node.style.transition = `transform ${this.swapTransitionTime / 1000}s cubic-bezier(0.25, 0.8, 0.25, 1), border-color 0.3s, box-shadow 0.3s`;
            
            node.innerHTML = `
                <span class="node-value">${val}</span>
                <div class="node-index-bubble">${idx}</div>
            `;
            
            this.dom.treeContainer3D.appendChild(node);
        });
    }

    renderArray() {
        this.dom.arrayContainer.innerHTML = "";
        
        if (this.heap.length === 0) {
            this.dom.arrayContainer.innerHTML = `<div class="empty-array-msg">Heap is empty. Insert nodes to view memory mapping!</div>`;
            return;
        }

        this.heap.forEach((val, idx) => {
            const cell = document.createElement("div");
            cell.className = "array-cell";
            cell.id = `cell-${idx}`;
            cell.setAttribute("data-index", idx);
            cell.innerHTML = `
                <span class="index-label">${idx}</span>
                <span class="value-display">${val}</span>
            `;

            // Hover index highlights
            cell.addEventListener("mouseenter", () => this.highlightNodeRelations(idx));
            cell.addEventListener("mouseleave", () => this.clearNodeRelations());

            this.dom.arrayContainer.appendChild(cell);
        });
    }

    drawConnectors() {
        const wrapperRect = this.dom.viewport3DWrapper.getBoundingClientRect();
        this.dom.svgOverlay3D.innerHTML = "";

        this.heap.forEach((val, idx) => {
            if (idx === 0) return;
            const parentIdx = Math.floor((idx - 1) / 2);
            
            const parentNode = document.getElementById(`node-${parentIdx}`);
            const childNode = document.getElementById(`node-${idx}`);
            
            if (parentNode && childNode) {
                const pRect = parentNode.getBoundingClientRect();
                const cRect = childNode.getBoundingClientRect();
                
                const x1 = pRect.left - wrapperRect.left + pRect.width / 2;
                const y1 = pRect.top - wrapperRect.top + pRect.height / 2;
                const x2 = cRect.left - wrapperRect.left + cRect.width / 2;
                const y2 = cRect.top - wrapperRect.top + cRect.height / 2;

                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", x1);
                line.setAttribute("y1", y1);
                line.setAttribute("x2", x2);
                line.setAttribute("y2", y2);
                
                let cls = "svg-line-connector";
                if (this.activeConnectorHighlight && 
                    this.activeConnectorHighlight.parent === parentIdx && 
                    this.activeConnectorHighlight.child === idx) {
                    cls += ` ${this.activeConnectorHighlight.type}`;
                }
                line.setAttribute("class", cls);
                line.id = `connector-${parentIdx}-${idx}`;
                
                this.dom.svgOverlay3D.appendChild(line);
            }
        });
    }

    highlightNodeRelations(i) {
        this.clearNodeRelations();

        const parentIdx = Math.floor((i - 1) / 2);
        const leftIdx = 2 * i + 1;
        const rightIdx = 2 * i + 2;

        const setHighlight = (idx, cls) => {
            const node = document.getElementById(`node-${idx}`);
            const cell = document.getElementById(`cell-${idx}`);
            if (node) node.classList.add(cls);
            if (cell) cell.classList.add(cls);
        };

        // Active node
        setHighlight(i, "active-focus");
        this.dom.hudActiveIndex.textContent = i;

        // Parent node
        if (i > 0) {
            setHighlight(parentIdx, "highlight-rel");
            this.dom.hudParentIndex.textContent = parentIdx;
        } else {
            this.dom.hudParentIndex.textContent = "N/A (Root)";
        }

        // Left child
        if (leftIdx < this.heap.length) {
            setHighlight(leftIdx, "highlight-rel");
            this.dom.hudLeftIndex.textContent = leftIdx;
        } else {
            this.dom.hudLeftIndex.textContent = "N/A";
        }

        // Right child
        if (rightIdx < this.heap.length) {
            setHighlight(rightIdx, "highlight-rel");
            this.dom.hudRightIndex.textContent = rightIdx;
        } else {
            this.dom.hudRightIndex.textContent = "N/A";
        }
    }

    clearNodeRelations() {
        const classes = ["active-focus", "highlight-rel"];
        for (let r = 0; r < this.heap.length; r++) {
            const node = document.getElementById(`node-${r}`);
            const cell = document.getElementById(`cell-${r}`);
            if (node) node.classList.remove(...classes);
            if (cell) cell.classList.remove(...classes);
        }

        this.dom.hudActiveIndex.textContent = "-";
        this.dom.hudParentIndex.textContent = "-";
        this.dom.hudLeftIndex.textContent = "-";
        this.dom.hudRightIndex.textContent = "-";
    }

    // ==========================================
    // ACTION TRIGGERS
    // ==========================================
    insertValue() {
        if (this.isPlaying) return;

        const val = parseInt(this.dom.nodeValueInput.value);
        if (isNaN(val) || val < 1 || val > 99) {
            void 0;
            return;
        }

        if (this.heap.length >= 31) {
            void 0;
            return;
        }

        this.isPlaying = true;
        this.dom.btnInsertNode.disabled = true;
        this.dom.btnExtractRoot.disabled = true;
        this.dom.btnStepForward.disabled = false;

        this.log(`Inserting value ${val}...`, "add");

        // Compute step-by-step sifting
        const mockHeap = new BinaryHeapMock(this.mode, [...this.heap]);
        this.animationQueue = mockHeap.insert(val);
        this.currentStepIdx = 0;

        // Push enqueued node visually at the end
        this.heap.push(val);
        this.renderInitialUI();

        // Run sift-up animation timeline
        this.stepForward();
    }

    extractRoot() {
        if (this.isPlaying) return;
        if (this.heap.length === 0) {
            this.log("Error: Heap is empty. Nothing to extract.", "err");
            return;
        }

        this.isPlaying = true;
        this.dom.btnInsertNode.disabled = true;
        this.dom.btnExtractRoot.disabled = true;
        this.dom.btnStepForward.disabled = false;

        const rootVal = this.heap[0];
        this.log(`Extracting root node (${rootVal})...`, "ext");

        // Swap root and last element
        const lastIdx = this.heap.length - 1;
        
        // Sift down steps calculation
        const mockHeap = new BinaryHeapMock(this.mode, [...this.heap]);
        const res = mockHeap.extractRoot();
        
        this.animationQueue = [
            { type: "swap", from: 0, to: lastIdx, valFrom: this.heap[0], valTo: this.heap[lastIdx], isExtractionInitSwap: true },
            ...res.steps
        ];
        this.currentStepIdx = 0;

        this.stepForward();
    }

    stepForward() {
        if (this.currentStepIdx >= this.animationQueue.length) {
            this.finishAnimation();
            return;
        }

        const step = this.animationQueue[this.currentStepIdx];
        this.currentStepIdx++;

        this.clearHighlights();

        if (step.type === "compare") {
            this.log(`Comparing node at Index ${step.index1} (${step.val1}) with parent at Index ${step.index2} (${step.val2})...`, "comp");
            this.highlightElements([step.index1, step.index2], "compare");
            this.highlightConnector(step.index2, step.index1, "compare");
            this.drawConnectors();

            // Pause slightly for visual review, then proceed
            setTimeout(() => this.stepForward(), this.swapTransitionTime * 1.5);
        } else if (step.type === "swap") {
            this.log(`Swapping nodes: Index ${step.from} (${step.valFrom}) ↔ Index ${step.to} (${step.valTo})`, "swp");
            this.highlightElements([step.from, step.to], "swap");
            this.highlightConnector(step.getParent ? step.getParent : Math.min(step.from, step.to), Math.max(step.from, step.to), "swap");
            this.drawConnectors();

            // Start dynamic connector updates during node movement
            let startTime = performance.now();
            const animateConnectors = (now) => {
                this.drawConnectors();
                if (now - startTime < this.swapTransitionTime) {
                    requestAnimationFrame(animateConnectors);
                } else {
                    this.drawConnectors();
                }
            };
            requestAnimationFrame(animateConnectors);

            // Physical swap of tree nodes (translate3d values swap)
            const nodeFrom = document.getElementById(`node-${step.from}`);
            const nodeTo = document.getElementById(`node-${step.to}`);
            
            const cellFrom = document.getElementById(`cell-${step.from}`);
            const cellTo = document.getElementById(`cell-${step.to}`);

            if (nodeFrom && nodeTo) {
                const coordsFrom = this.getNodeCoords(step.from);
                const coordsTo = this.getNodeCoords(step.to);

                // Animate positions
                nodeFrom.style.transform = `translate3d(${coordsTo.x}px, ${coordsTo.y}px, ${coordsTo.z}px)`;
                nodeTo.style.transform = `translate3d(${coordsFrom.x}px, ${coordsFrom.y}px, ${coordsFrom.z}px)`;
            }

            if (cellFrom && cellTo) {
                cellFrom.classList.add("swap");
                cellTo.classList.add("swap");
            }

            // After animation transition, commit swap to state and re-render
            setTimeout(() => {
                const temp = this.heap[step.from];
                this.heap[step.from] = this.heap[step.to];
                this.heap[step.to] = temp;
                
                // If it is the initial extraction swap, we slice the last node
                if (step.isExtractionInitSwap) {
                    this.heap.pop();
                }

                this.renderInitialUI();
                this.stepForward();
            }, this.swapTransitionTime);
        }
    }

    finishAnimation() {
        this.isPlaying = false;
        this.dom.btnInsertNode.disabled = false;
        this.dom.btnExtractRoot.disabled = false;
        this.dom.btnStepForward.disabled = true;

        this.clearHighlights();
        this.renderInitialUI();

        this.log("Heapify operation completed successfully.", "sys");
    }

    clearHighlights() {
        this.activeConnectorHighlight = null;
        const classes = ["compare", "swap", "active-focus", "highlight-rel"];
        for (let r = 0; r < this.heap.length; r++) {
            const node = document.getElementById(`node-${r}`);
            const cell = document.getElementById(`cell-${r}`);
            if (node) node.classList.remove(...classes);
            if (cell) cell.classList.remove(...classes);
        }
        this.drawConnectors();
    }

    highlightElements(indexes, cls) {
        indexes.forEach(idx => {
            const node = document.getElementById(`node-${idx}`);
            const cell = document.getElementById(`cell-${idx}`);
            if (node) node.classList.add(cls);
            if (cell) cell.classList.add(cls);
        });
    }

    highlightConnector(parent, child, cls) {
        this.activeConnectorHighlight = { parent, child, type: cls };
    }

    clearAll() {
        if (this.isPlaying) return;
        this.heap = [];
        this.log("Heap cleared completely.", "sys");
        this.renderInitialUI();
    }

    loadRandomPreset() {
        if (this.isPlaying) return;
        this.heap = [];
        const size = Math.floor(Math.random() * 8) + 7; // 7 to 14 elements
        for (let i = 0; i < size; i++) {
            const val = Math.floor(Math.random() * 80) + 10;
            this.heap.push(val);
            this.siftUpSilently(this.heap.length - 1);
        }
        this.renderInitialUI();
        this.log(`Loaded random preset with ${size} elements.`, "sys");
    }

    loadSortedPreset() {
        if (this.isPlaying) return;
        this.heap = [];
        const size = 10;
        const base = this.mode === "min" ? [5, 10, 15, 20, 25, 30, 35, 40, 45, 50] : [99, 90, 80, 70, 60, 50, 40, 30, 20, 10];
        base.forEach(v => {
            this.heap.push(v);
        });
        this.renderInitialUI();
        this.log(`Loaded sorted preset heap matching ${this.mode.toUpperCase()}-HEAP layout.`, "sys");
    }
}

// ==========================================
// MOCK CLASS FOR STEPPING CALCULATIONS
// ==========================================
class BinaryHeapMock {
    constructor(type = "min", initialHeap = []) {
        this.type = type;
        this.heap = initialHeap;
        this.steps = [];
    }

    getParentIndex(i) { return Math.floor((i - 1) / 2); }
    getLeftChildIndex(i) { return 2 * i + 1; }
    getRightChildIndex(i) { return 2 * i + 2; }

    swap(i, j) {
        this.steps.push({ type: "swap", from: i, to: j, valFrom: this.heap[i], valTo: this.heap[j] });
        const temp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = temp;
    }

    compare(i, j) {
        this.steps.push({ type: "compare", index1: i, index2: j, val1: this.heap[i], val2: this.heap[j] });
        if (this.type === "min") {
            return this.heap[i] < this.heap[j];
        } else {
            return this.heap[i] > this.heap[j];
        }
    }

    insert(value) {
        this.steps = [];
        this.heap.push(value);
        this.siftUp(this.heap.length - 1);
        return this.steps;
    }

    siftUp(index) {
        while (index > 0) {
            const parentIdx = this.getParentIndex(index);
            if (this.compare(index, parentIdx)) {
                this.swap(index, parentIdx);
                index = parentIdx;
            } else {
                break;
            }
        }
    }

    extractRoot() {
        if (this.heap.length === 0) return null;
        this.steps = [];
        
        const root = this.heap[0];
        const last = this.heap.pop();
        
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.siftDown(0);
        }
        
        return { root, steps: this.steps };
    }

    siftDown(index) {
        const length = this.heap.length;
        while (true) {
            let priorityIdx = index;
            const leftIdx = this.getLeftChildIndex(index);
            const rightIdx = this.getRightChildIndex(index);

            if (leftIdx < length && this.compare(leftIdx, priorityIdx)) {
                priorityIdx = leftIdx;
            }

            if (rightIdx < length && this.compare(rightIdx, priorityIdx)) {
                priorityIdx = rightIdx;
            }

            if (priorityIdx !== index) {
                this.swap(index, priorityIdx);
                index = priorityIdx;
            } else {
                break;
            }
        }
    }
}
