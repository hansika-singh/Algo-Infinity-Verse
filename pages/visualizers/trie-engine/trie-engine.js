/**
 * Advanced Strings - Trie (Prefix Tree) Engine
 * Dynamic tree visualization mapping string insertions and prefix searches 
 * using an autonomous Force/Hierarchical hybrid layout.
 */

const COLORS = {
    bg: '#13151f',
    nodeBg: '#1e293b',
    nodeBorder: '#334155',
    textMain: '#ffffff',
    textChar: '#06b6d4',
    edge: '#334155',
    activePath: '#a855f7',
    success: '#10b981',
    fail: '#ef4444'
};

class TrieNode {
    constructor(char, depth) {
        this.char = char;
        this.children = new Map();
        this.isEnd = false;
        this.depth = depth;
        // Layout Properties
        this.x = 0;
        this.y = 0;
        this.subtreeWidth = 1;
        // Animation State
        this.isActive = false;
        this.isVisited = false;
    }
}

class TrieVisualizer {
    constructor() {
        this.canvas = document.getElementById('viz-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.root = new TrieNode('Root', 0);
        this.nodeCount = 1;
        
        // UI State
        this.animating = false;
        this.generator = null;
        this.timer = null;
        
        this.tracePanel = document.getElementById('live-trace-overlay');
        this.traceWord = document.getElementById('trace-word');
        
        this.bindEvents();
        this.resize();
        window.addEventListener('resize', () => { this.resize(); this.layoutTree(); });
        
        this.layoutTree();
        this.renderLoop();
    }

    bindEvents() {
        const insertInput = document.getElementById('input-insert');
        const searchInput = document.getElementById('input-search');
        
        // Input sanitization
        const sanitize = (e) => { e.target.value = e.target.value.toLowerCase().replace(/[^a-z]/g, ''); };
        insertInput.addEventListener('input', sanitize);
        searchInput.addEventListener('input', sanitize);

        document.getElementById('btn-insert').addEventListener('click', () => {
            const word = insertInput.value;
            if (word && !this.animating) this.startAlgorithm(this.insertAlgo(word), 'Insert', word);
        });

        document.getElementById('btn-search-word').addEventListener('click', () => {
            const word = searchInput.value;
            if (word && !this.animating) this.startAlgorithm(this.searchAlgo(word, false), 'Search', word);
        });

        document.getElementById('btn-search-prefix').addEventListener('click', () => {
            const word = searchInput.value;
            if (word && !this.animating) this.startAlgorithm(this.searchAlgo(word, true), 'Prefix', word);
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            if (this.animating) return;
            this.root = new TrieNode('Root', 0);
            this.nodeCount = 1;
            this.layoutTree();
            this.updateStatus(`Status: Trie Cleared | Nodes: 1`);
        });

        document.getElementById('btn-play').addEventListener('click', () => this.togglePlay());
        document.getElementById('btn-step').addEventListener('click', () => this.step());
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    updateStatus(msg) {
        document.getElementById('main-status').innerText = msg;
    }

    highlightCode(stepId, mode) {
        document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active'));
        document.getElementById('pseudo-insert').classList.add('hidden');
        document.getElementById('pseudo-search').classList.add('hidden');
        
        const block = mode === 'Insert' ? 'pseudo-insert' : 'pseudo-search';
        document.getElementById(block).classList.remove('hidden');
        
        if (stepId) document.getElementById(stepId).classList.add('active');
    }

    resetNodeStates(node = this.root) {
        node.isActive = false;
        node.isVisited = false;
        for (let [_, child] of node.children) {
            this.resetNodeStates(child);
        }
    }

    // --- Dynamic Layout Algorithm ---
    computeWidth(node) {
        if (node.children.size === 0) {
            node.subtreeWidth = 1;
            return 1;
        }
        let w = 0;
        for (let [_, child] of node.children) w += this.computeWidth(child);
        node.subtreeWidth = w;
        return w;
    }

    setPositions(node, left, right, layerHeight) {
        node.x = (left + right) / 2;
        node.y = 50 + (node.depth * layerHeight);
        
        let currLeft = left;
        for (let [_, child] of node.children) {
            let ratio = child.subtreeWidth / node.subtreeWidth;
            let childRight = currLeft + (right - left) * ratio;
            this.setPositions(child, currLeft, childRight, layerHeight);
            currLeft = childRight;
        }
    }

    layoutTree() {
        this.computeWidth(this.root);
        // Add padding to edges
        const padding = 40;
        const width = this.canvas.width - (padding * 2);
        // Vertical spacing based on max depth
        const layerHeight = 70;
        this.setPositions(this.root, padding, padding + width, layerHeight);
    }

    // --- Trace Overlay Formatting ---
const COLORS = {
    bg: '`#13151f`',
    nodeBg: '`#1e293b`',
    nodeBorder: '`#334155`',
    textMain: '`#ffffff`',
    textMuted: '`#8b949e`',
    textChar: '`#06b6d4`',
    edge: '`#334155`',
    activePath: '`#a855f7`',
    success: '`#10b981`',
    fail: '`#ef4444`'
};

    // --- State Machine Generators ---
    *insertAlgo(word) {
        this.updateStatus(`Status: Inserting "${word}"`);
        this.tracePanel.classList.remove('hidden');
        
        this.highlightCode('ins-1', 'Insert');
        let curr = this.root;
        curr.isActive = true;
        this.traceWord.innerHTML = this.formatTraceWord(word, 0);
        yield;

        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            
            curr.isActive = false;
            curr.isVisited = true;
            this.highlightCode('ins-2', 'Insert');
            this.traceWord.innerHTML = this.formatTraceWord(word, i);
            yield;

            this.highlightCode('ins-3', 'Insert');
            if (!curr.children.has(char)) {
                yield; // Show check
                this.highlightCode('ins-4', 'Insert');
                curr.children.set(char, new TrieNode(char, curr.depth + 1));
                this.nodeCount++;
                this.layoutTree(); // Dynamically realign tree as new branch spawns
                this.updateStatus(`Status: Inserting "${word}" | Nodes: ${this.nodeCount}`);
                yield;
            } else {
                yield; // Exists check
            }

            this.highlightCode('ins-5', 'Insert');
            curr = curr.children.get(char);
            curr.isActive = true;
            yield;
        }

        this.highlightCode('ins-6', 'Insert');
        curr.isEnd = true;
        this.traceWord.innerHTML = this.formatTraceWord(word, word.length, 'eq-ok');
        yield;
    }

    *searchAlgo(word, isPrefix) {
        this.updateStatus(`Status: Searching for ${isPrefix ? 'Prefix' : 'Word'} "${word}"`);
        this.tracePanel.classList.remove('hidden');
        
        this.highlightCode('sch-1', 'Search');
        let curr = this.root;
        curr.isActive = true;
        this.traceWord.innerHTML = this.formatTraceWord(word, 0);
        yield;

        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            
            curr.isActive = false;
            curr.isVisited = true;
            this.highlightCode('sch-2', 'Search');
            this.traceWord.innerHTML = this.formatTraceWord(word, i);
            yield;

            this.highlightCode('sch-3', 'Search');
            yield;

            if (!curr.children.has(char)) {
                this.highlightCode('sch-4', 'Search');
                this.updateStatus(`Status: Not Found (Missing '${char}')`);
                this.traceWord.innerHTML = this.formatTraceWord(word, i, 'eq-err');
                yield;
                return; // Early fail
            }

            this.highlightCode('sch-5', 'Search');
            curr = curr.children.get(char);
            curr.isActive = true;
            yield;
        }

        this.highlightCode('sch-6', 'Search');
        curr.isActive = false;
        curr.isVisited = true;
        
        const success = isPrefix ? true : curr.isEnd;
        if (success) {
            this.updateStatus(`Status: Successfully Found!`);
            this.traceWord.innerHTML = this.formatTraceWord(word, word.length, 'eq-ok');
            curr.isActive = true; // Highlight final node green via render logic
        } else {
            this.updateStatus(`Status: Found Prefix, but not a complete Word.`);
            this.traceWord.innerHTML = this.formatTraceWord(word, word.length, 'eq-err');
        }
        yield;
    }

    // --- Control Flow ---
    startAlgorithm(generator, mode, word) {
        if (this.animating) return;
        
        this.resetNodeStates();
        this.generator = generator;
        this.animating = true;
        
        // UI Reset
        document.getElementById('btn-play').innerHTML = '<i class="fas fa-pause"></i> Pause';
        document.getElementById('btn-play').disabled = false;
        document.getElementById('btn-step').disabled = false;
        
        this.autoStep();
    }

    togglePlay() {
        this.animating = !this.animating;
        const btnPlay = document.getElementById('btn-play');
        btnPlay.innerHTML = this.animating ? '<i class="fas fa-pause"></i> Pause' : '<i class="fas fa-play"></i> Auto Run';
        if (this.animating) {
            this.autoStep();
        } else {
            clearTimeout(this.timer);
        }
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
            this.resetNodeStates();
            setTimeout(() => { this.tracePanel.classList.add('hidden'); }, 3000);
            return false;
        }
        return true;
    }

    autoStep() {
        if (!this.animating) return;
        clearTimeout(this.timer);
        const hasNext = this.step();
        if (hasNext) {
            this.timer = setTimeout(() => this.autoStep(), 600); // 600ms per algorithmic yield
        }
    }

    // --- Render Engine ---
    drawEdges(node) {
        for (let [_, child] of node.children) {
            this.ctx.beginPath();
            this.ctx.moveTo(node.x, node.y);
            this.ctx.lineTo(child.x, child.y);
            this.ctx.lineWidth = child.isVisited || child.isActive ? 3 : 1;
            this.ctx.strokeStyle = child.isActive ? COLORS.activePath : (child.isVisited ? COLORS.activePath : COLORS.edge);
            this.ctx.stroke();
            this.drawEdges(child);
        }
    }

    drawNodes(node) {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, 18, 0, Math.PI * 2);
        
        this.ctx.fillStyle = COLORS.nodeBg;
        this.ctx.fill();
        
        this.ctx.lineWidth = 2;
        if (node.isActive) {
            this.ctx.strokeStyle = COLORS.textChar;
            this.ctx.shadowColor = COLORS.textChar;
            this.ctx.shadowBlur = 15;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        } else {
            this.ctx.strokeStyle = node.isVisited ? COLORS.activePath : COLORS.nodeBorder;
            this.ctx.stroke();
        }

        // isEndOfWord indicator
        if (node.isEnd) {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);
            this.ctx.strokeStyle = COLORS.success;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([4, 4]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // Text
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.font = node.depth === 0 ? '10px Poppins' : '14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(node.depth === 0 ? 'Root' : node.char, node.x, node.y);

        for (let [_, child] of node.children) this.drawNodes(child);
    }

    renderLoop() {
        this.ctx.fillStyle = COLORS.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawEdges(this.root);
        this.drawNodes(this.root);

        requestAnimationFrame(() => this.renderLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new TrieVisualizer();
});
