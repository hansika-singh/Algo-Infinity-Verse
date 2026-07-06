/**
 * git-visualizer.js
 * Implements a local Directed Acyclic Graph (DAG) to mimic Git Version Control.
 * Renders SVG paths and HTML nodes dynamically to visualize branching.
 */

document.addEventListener("DOMContentLoaded", () => {
    initGitVisualizer();
});

// ==========================================
// 1. IN-MEMORY GIT ENGINE
// ==========================================
class LocalGit {
    constructor() {
        this.commits = []; // The DAG
        this.branches = { 'main': null }; // Maps branch name -> commit id
        this.HEAD = 'main'; // Points to branch name OR commit id if detached
        
        // For visualization rendering
        this.tracks = { 'main': 0 }; 
        this.trackCounter = 0;
        
        // Aesthetic Track Colors
        this.colors = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];
    }

    get currentCommitId() {
        if (this.branches[this.HEAD] !== undefined) {
            return this.branches[this.HEAD];
        }
        return this.HEAD; // Detached state
    }

    commit(message, code) {
        const id = Math.random().toString(16).substring(2, 8);
        const parentId = this.currentCommitId;
        const branch = this.branches[this.HEAD] !== undefined ? this.HEAD : 'detached';

        // Assign a visual track (X-axis column)
        let track = this.tracks[branch];
        if (track === undefined) {
            track = ++this.trackCounter;
            this.tracks[branch] = track;
        }

        const level = this.commits.length; // Y-axis
        const timestamp = new Date().toLocaleTimeString();

        const newCommit = { id, message, code, parentId, branch, level, track, timestamp };
        this.commits.push(newCommit);

        // Advance HEAD pointer
        if (branch !== 'detached') {
            this.branches[branch] = id;
        } else {
            this.HEAD = id;
        }

        return newCommit;
    }

    createBranch(name) {
        if (this.branches[name] !== undefined) throw new Error("Branch already exists");
        if (!name.trim()) throw new Error("Branch name cannot be empty");
        
        this.branches[name] = this.currentCommitId;
        this.HEAD = name;
        this.tracks[name] = ++this.trackCounter;
    }

    checkout(target) {
        if (this.branches[target] !== undefined) {
            this.HEAD = target; // Attached
            return this.commits.find(c => c.id === this.branches[target]);
        } else {
            this.HEAD = target; // Detached
            return this.commits.find(c => c.id === target);
        }
    }
}

// ==========================================
// 2. APP STATE & EDITOR
// ==========================================
let editor;
let git;

const els = {
    editorContainer: document.getElementById('editorContainer'),
    commitMessage: document.getElementById('commitMessage'),
    btnCommit: document.getElementById('btnCommit'),
    branchName: document.getElementById('branchName'),
    btnBranch: document.getElementById('btnBranch'),
    btnReset: document.getElementById('btnReset'),
    
    // Graph
    graphContainer: document.getElementById('graphContainer'),
    gitLines: document.getElementById('gitLines'),
    gitNodes: document.getElementById('gitNodes'),
    emptyState: document.getElementById('emptyState'),
    
    // HUD
    headLabel: document.getElementById('headLabel'),
    headStatusBadge: document.getElementById('headStatusBadge'),
    
    // Tooltip
    gitTooltip: document.getElementById('gitTooltip'),
    ttHash: document.getElementById('ttHash'),
    ttMsg: document.getElementById('ttMsg'),
    ttDate: document.getElementById('ttDate')
};

function initGitVisualizer() {
    editor = CodeMirror(els.editorContainer, {
        lineNumbers: true,
        theme: 'material-darker',
        mode: 'javascript',
        value: `function fibonacci(n) {\n    if (n <= 1) return n;\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\n// Try optimizing this, commit your changes, and branch out!`,
        indentUnit: 4
    });

    git = new LocalGit();
    
    // Create initial commit
    git.commit("Initial naive implementation", editor.getValue());
    
    setupEventListeners();
    updateUI();
}

function setupEventListeners() {
    els.btnCommit.addEventListener('click', () => {
        const msg = els.commitMessage.value.trim() || "Update solution.js";
        git.commit(msg, editor.getValue());
        els.commitMessage.value = '';
        updateUI();
    });

    els.commitMessage.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') els.btnCommit.click();
    });

    els.btnBranch.addEventListener('click', () => {
        const name = els.branchName.value.trim().replace(/\s+/g, '-');
        try {
            git.createBranch(name);
            els.branchName.value = '';
            updateUI();
        } catch (e) {
            console.warn("Alert:", e.message);
        }
    });

    els.btnReset.addEventListener('click', () => {
        if(false /* confirm removed */) {
            const currentCode = editor.getValue();
            git = new LocalGit();
            git.commit("Initial commit", currentCode);
            updateUI();
        }
    });

    // Close tooltip if scrolling
    els.graphContainer.addEventListener('scroll', hideTooltip);
}

// ==========================================
// 3. GRAPH RENDERER
// ==========================================
const X_SPACING = 60;
const Y_SPACING = 70;
const X_OFFSET = 40;
const Y_OFFSET = 40;

function updateUI() {
    renderGraph();
    updateHUD();
    
    // Auto-scroll to bottom of graph
    els.graphContainer.scrollTop = els.graphContainer.scrollHeight;
}

function updateHUD() {
    const isDetached = git.branches[git.HEAD] === undefined;
    els.headLabel.textContent = git.HEAD;
    els.headStatusBadge.className = `head-status ${isDetached ? 'detached' : ''}`;
}

function renderGraph() {
    if (git.commits.length === 0) {
        els.emptyState.classList.remove('hidden');
        return;
    }
    els.emptyState.classList.add('hidden');

    // Clear previous render
    els.gitLines.innerHTML = '';
    els.gitNodes.innerHTML = '';

    // Calculate required SVG height
    const maxLevel = git.commits.length;
    els.gitLines.style.height = `${maxLevel * Y_SPACING + Y_OFFSET * 2}px`;
    els.gitLines.style.width = `${Object.keys(git.tracks).length * X_SPACING + X_OFFSET * 4}px`;

    // 1. Draw SVG Lines (Edges)
    git.commits.forEach(commit => {
        if (!commit.parentId) return; // Root commit has no line
        
        const parent = git.commits.find(c => c.id === commit.parentId);
        if (!parent) return;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'git-edge');
        
        const color = git.colors[commit.track % git.colors.length];
        path.setAttribute('stroke', color);

        // Coordinates
        const px = parent.track * X_SPACING + X_OFFSET;
        const py = parent.level * Y_SPACING + Y_OFFSET;
        const cx = commit.track * X_SPACING + X_OFFSET;
        const cy = commit.level * Y_SPACING + Y_OFFSET;

        if (parent.track === commit.track) {
            // Straight vertical line
            path.setAttribute('d', `M ${px} ${py} L ${cx} ${cy}`);
        } else {
            // Cubic Bezier Curve for smooth branching
            path.setAttribute('d', `M ${px} ${py} C ${px} ${(py+cy)/2}, ${cx} ${(py+cy)/2}, ${cx} ${cy}`);
        }

        els.gitLines.appendChild(path);
    });

    // 2. Draw HTML Nodes (Commits)
    git.commits.forEach(commit => {
        const cx = commit.track * X_SPACING + X_OFFSET;
        const cy = commit.level * Y_SPACING + Y_OFFSET;
        const color = git.colors[commit.track % git.colors.length];

        const node = document.createElement('div');
        node.className = 'commit-node';
        node.style.left = `${cx}px`;
        node.style.top = `${cy}px`;
        node.style.backgroundColor = color;

        // Highlight Active HEAD
        if (commit.id === git.currentCommitId) {
            node.classList.add('active-head');
        }

        // Interactions
        node.addEventListener('mouseenter', (e) => showTooltip(e, commit));
        node.addEventListener('mouseleave', hideTooltip);
        
        node.addEventListener('click', () => {
            const restored = git.checkout(commit.id); // Checkout detached commit
            editor.setValue(restored.code);
            updateUI();
        });

        els.gitNodes.appendChild(node);

        // 3. Draw Branch Labels pointing to this commit
        Object.entries(git.branches).forEach(([bName, bTarget]) => {
            if (bTarget === commit.id) {
                const label = document.createElement('div');
                label.className = 'branch-label';
                label.style.left = `${cx + 15}px`; // Offset to right
                label.style.top = `${cy}px`;
                label.style.backgroundColor = `${color}40`; // Semi-transparent
                label.style.color = color;
                
                // Add HEAD pointer if this branch is active
                let headHtml = '';
                if (git.HEAD === bName) {
                    headHtml = '<span class="head-pointer">HEAD</span>';
                }
                
                label.innerHTML = `${headHtml} <i class="fas fa-code-branch"></i> ${bName}`;
                
                // Click label to checkout branch
                label.style.cursor = 'pointer';
                label.style.pointerEvents = 'auto';
                label.addEventListener("click", () => {
                    const restored = git.checkout(bName);
                    editor.setValue(restored.code);
                    updateUI();
                });

                els.gitNodes.appendChild(label);
            }
        });
    });
}

// ==========================================
// 4. TOOLTIP UX
// ==========================================
function showTooltip(e, commit) {
    els.ttHash.textContent = commit.id;
    els.ttMsg.textContent = commit.message;
    els.ttDate.textContent = commit.timestamp;

    // Get position relative to the graph container
    const rect = e.target.getBoundingClientRect();
    const containerRect = els.graphContainer.getBoundingClientRect();

    els.gitTooltip.style.left = `${rect.left - containerRect.left + (rect.width / 2)}px`;
    els.gitTooltip.style.top = `${rect.top - containerRect.top}px`; // Translates up via CSS
    
    els.gitTooltip.classList.remove('hidden');
    els.gitTooltip.style.opacity = '1';
}

function hideTooltip() {
    els.gitTooltip.classList.add('hidden');
    els.gitTooltip.style.opacity = '0';
}
