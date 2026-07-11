/* git-visualizer.js */
const UI = {
    terminalInput: document.getElementById('terminalInput'),
    terminalOutput: document.getElementById('terminalOutput'),
    headTarget: document.getElementById('headTarget'),
    canvas: document.getElementById('dagCanvas'),
    reflogSlider: document.getElementById('reflogSlider'),
    reflogInfo: document.getElementById('reflogInfo')
};

const ctx = UI.canvas.getContext('2d');
let cw, ch;
function resize() {
    cw = UI.canvas.width = UI.canvas.parentElement.clientWidth;
    ch = UI.canvas.height = UI.canvas.parentElement.clientHeight;
    drawGraph();
}
window.addEventListener('resize', resize);
resize();

// --- Git Data Structures ---
let commitHashCounter = 1000;
function generateHash() { return (commitHashCounter++).toString(16).substring(0, 7); }

class Commit {
    constructor(message, parents) {
        this.hash = generateHash();
        this.message = message;
        this.parents = parents || []; // Array of parent hashes
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.color = '#f05033';
    }
}

let commits = {}; // hash -> Commit
let branches = { 'main': null }; // branch_name -> commit_hash
let HEAD = 'main'; // points to a branch name, or directly to a commit hash if detached
let reflog = []; // History of repo states for time travel
let currentReflogIndex = -1;

function initRepo() {
    const root = new Commit("Initial commit", []);
    commits[root.hash] = root;
    branches['main'] = root.hash;
    HEAD = 'main';
    saveReflog("Initial repo setup");
}

function resolveHEAD() {
    if (branches[HEAD]) return branches[HEAD];
    return HEAD; // Detached head
}

// --- Terminal Logic ---
function logTerm(msg, type = 'info') {
    const div = document.createElement('div');
    div.className = `log-${type}`;
    div.innerText = msg;
    UI.terminalOutput.appendChild(div);
    div.scrollIntoView();
}

UI.terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = UI.terminalInput.value.trim();
        UI.terminalInput.value = '';
        if (!cmd) return;
        
        logTerm(`user@algo-verse:~/repo$ ${cmd}`, 'cmd');
        processCommand(cmd);
    }
});

function processCommand(cmdLine) {
    const args = cmdLine.split(' ').filter(Boolean);
    if (args[0] !== 'git') {
        logTerm(`bash: ${args[0]}: command not found`, 'error');
        return;
    }
    
    const cmd = args[1];
    
    try {
        switch (cmd) {
            case 'commit':
                handleCommit(args);
                break;
            case 'branch':
                handleBranch(args);
                break;
            case 'checkout':
                handleCheckout(args);
                break;
            case 'merge':
                handleMerge(args);
                break;
            case 'rebase':
                handleRebase(args);
                break;
            case 'reset':
                handleReset(args);
                break;
            default:
                logTerm(`git: '${cmd}' is not a git command.`, 'error');
        }
    } catch (e) {
        logTerm(`Error: ${e.message}`, 'error');
    }
}

function handleCommit(args) {
    let msg = "Update";
    if (args[2] === '-m' && args[3]) {
        msg = args.slice(3).join(' ').replace(/['"]/g, '');
    }
    
    const headHash = resolveHEAD();
    const newCommit = new Commit(msg, [headHash]);
    commits[newCommit.hash] = newCommit;
    
    if (branches[HEAD]) {
        branches[HEAD] = newCommit.hash;
    } else {
        HEAD = newCommit.hash; // Detached head moves
    }
    
    logTerm(`[${HEAD === newCommit.hash ? 'detached HEAD' : HEAD} ${newCommit.hash}] ${msg}`, 'success');
    saveReflog(`commit: ${msg}`);
}

function handleBranch(args) {
    const branchName = args[2];
    if (!branchName) {
        logTerm(Object.keys(branches).map(b => (b === HEAD ? '* ' : '  ') + b).join('\n'), 'info');
        return;
    }
    if (branches[branchName]) throw new Error(`branch '${branchName}' already exists.`);
    
    branches[branchName] = resolveHEAD();
    logTerm(`Branch '${branchName}' created.`, 'success');
    saveReflog(`branch: Created ${branchName}`);
}

function handleCheckout(args) {
    let target = args[2];
    if (args[2] === '-b' && args[3]) {
        handleBranch(['git', 'branch', args[3]]);
        target = args[3];
    }
    
    if (branches[target]) {
        HEAD = target;
        logTerm(`Switched to branch '${target}'`, 'success');
    } else if (commits[target]) {
        HEAD = target;
        logTerm(`Note: checking out '${target}'. You are in 'detached HEAD' state.`, 'warn');
    } else {
        throw new Error(`pathspec '${target}' did not match any file(s) known to git`);
    }
    saveReflog(`checkout: moving to ${target}`);
}

function handleMerge(args) {
    const targetBranch = args[2];
    if (!branches[targetBranch]) throw new Error(`${targetBranch} not found.`);
    
    const headHash = resolveHEAD();
    const targetHash = branches[targetBranch];
    
    if (headHash === targetHash) {
        logTerm('Already up to date.', 'info');
        return;
    }
    
    const msg = `Merge branch '${targetBranch}' into ${HEAD}`;
    const newCommit = new Commit(msg, [headHash, targetHash]);
    commits[newCommit.hash] = newCommit;
    
    if (branches[HEAD]) {
        branches[HEAD] = newCommit.hash;
    } else {
        HEAD = newCommit.hash;
    }
    
    logTerm(`Merge made by the 'recursive' strategy.`, 'success');
    saveReflog(`merge: ${targetBranch}`);
}

function handleRebase(args) {
    const targetBranch = args[2];
    if (!branches[targetBranch]) throw new Error(`${targetBranch} not found.`);
    
    const currentBranchName = HEAD;
    if (!branches[currentBranchName]) throw new Error(`Cannot rebase detached HEAD easily in this sim.`);
    
    const targetHash = branches[targetBranch];
    const headHash = branches[currentBranchName];
    
    // Simplistic rebase: just point current branch to target branch (fast-forward) 
    // Real rebase would rewrite history. For visual impact, we just move the pointer.
    branches[currentBranchName] = targetHash;
    logTerm(`Successfully rebased and updated ${currentBranchName}.`, 'success');
    saveReflog(`rebase: ${targetBranch}`);
}

function handleReset(args) {
    if (args[2] !== '--hard') throw new Error(`Only --hard supported in this sim.`);
    const target = args[3];
    if (!commits[target] && !branches[target]) throw new Error(`${target} not found.`);
    
    const targetHash = branches[target] || target;
    
    if (branches[HEAD]) {
        branches[HEAD] = targetHash;
    } else {
        HEAD = targetHash;
    }
    
    logTerm(`HEAD is now at ${targetHash}`, 'success');
    saveReflog(`reset: moving to ${target}`);
}


// --- Reflog State Management ---
function saveReflog(actionMsg) {
    // Deep clone state
    const state = {
        commits: JSON.parse(JSON.stringify(commits)),
        branches: JSON.parse(JSON.stringify(branches)),
        HEAD: HEAD,
        msg: actionMsg
    };
    
    // Truncate future if we time traveled
    if (currentReflogIndex < reflog.length - 1) {
        reflog = reflog.slice(0, currentReflogIndex + 1);
    }
    
    reflog.push(state);
    currentReflogIndex = reflog.length - 1;
    updateUI();
}

function restoreReflog(index) {
    const state = reflog[index];
    commits = JSON.parse(JSON.stringify(state.commits));
    branches = JSON.parse(JSON.stringify(state.branches));
    HEAD = state.HEAD;
    currentReflogIndex = index;
    updateUI();
}

UI.reflogSlider.addEventListener('input', (e) => {
    restoreReflog(parseInt(e.target.value));
});


// --- Layout & Drawing Engine ---
function updateUI() {
    UI.headTarget.innerText = HEAD;
    UI.reflogSlider.max = reflog.length - 1;
    UI.reflogSlider.value = currentReflogIndex;
    UI.reflogInfo.innerText = `[${currentReflogIndex}] ${reflog[currentReflogIndex].msg}`;
    UI.reflogSlider.disabled = reflog.length <= 1;
    
    calculateLayout();
    drawGraph();
}

function calculateLayout() {
    // Basic topological layout (simplistic)
    const levels = {};
    const processed = new Set();
    
    function assignLevel(hash, depth) {
        if (!commits[hash] || processed.has(hash)) return;
        processed.add(hash);
        levels[hash] = depth;
        commits[hash].parents.forEach(p => assignLevel(p, depth - 1));
    }
    
    // Start from all branch heads
    Object.values(branches).forEach(h => assignLevel(h, 100));
    
    // Normalize levels
    const minLevel = Math.min(...Object.values(levels));
    
    const levelCounts = {};
    Object.keys(commits).forEach(hash => {
        if (levels[hash] === undefined) {
            levels[hash] = minLevel; // Orphaned
        }
        const l = levels[hash] - minLevel;
        if (!levelCounts[l]) levelCounts[l] = 0;
        
        commits[hash].targetX = 100 + l * 80;
        commits[hash].targetY = ch/2 + (levelCounts[l] * 60) * (levelCounts[l] % 2 === 0 ? 1 : -1);
        levelCounts[l]++;
    });
}

function drawGraph() {
    ctx.clearRect(0, 0, cw, ch);
    
    // Animate positions towards targets
    let animating = false;
    Object.values(commits).forEach(c => {
        if (c.x === 0 && c.y === 0) { c.x = c.targetX; c.y = c.targetY; }
        c.x += (c.targetX - c.x) * 0.2;
        c.y += (c.targetY - c.y) * 0.2;
        if (Math.abs(c.targetX - c.x) > 1 || Math.abs(c.targetY - c.y) > 1) animating = true;
    });
    
    // Draw edges
    ctx.lineWidth = 2;
    Object.values(commits).forEach(c => {
        c.parents.forEach(pHash => {
            const p = commits[pHash];
            if (!p) return;
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            // Curvy lines
            ctx.bezierCurveTo(c.x - 40, c.y, p.x + 40, p.y, p.x, p.y);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.stroke();
        });
    });
    
    // Draw nodes
    Object.values(commits).forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = c.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = '10px Fira Code';
        ctx.textAlign = 'center';
        ctx.fillText(c.hash, c.x, c.y + 30);
    });
    
    // Draw branches as floating tags
    const branchOffsets = {};
    Object.entries(branches).forEach(([bName, targetHash]) => {
        const target = commits[targetHash];
        if (!target) return;
        
        if (!branchOffsets[targetHash]) branchOffsets[targetHash] = 0;
        const offsetY = -30 - (branchOffsets[targetHash] * 25);
        branchOffsets[targetHash]++;
        
        ctx.fillStyle = (bName === HEAD) ? '#58a6ff' : '#30363d';
        ctx.fillRect(target.x - 20, target.y + offsetY - 12, 40 + bName.length * 6, 24);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(bName, target.x - 15, target.y + offsetY);
        
        // Line pointing to commit
        ctx.beginPath();
        ctx.moveTo(target.x, target.y + offsetY + 12);
        ctx.lineTo(target.x, target.y - 15);
        ctx.strokeStyle = (bName === HEAD) ? '#58a6ff' : '#30363d';
        ctx.stroke();
    });
    
    // Draw detached HEAD
    if (!branches[HEAD] && commits[HEAD]) {
        const target = commits[HEAD];
        ctx.fillStyle = '#d73a49';
        ctx.fillRect(target.x - 20, target.y - 42, 60, 24);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText("HEAD", target.x - 15, target.y - 30);
    }
    
    if (animating) requestAnimationFrame(drawGraph);
}

// Init
initRepo();
updateUI();
