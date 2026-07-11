/* kube-scheduler.js */
const UI = {
    btnSpawnSmall: document.getElementById('btnSpawnSmall'),
    btnSpawnLarge: document.getElementById('btnSpawnLarge'),
    btnScheduleNext: document.getElementById('btnScheduleNext'),
    podQueue: document.getElementById('podQueue'),
    clusterGrid: document.getElementById('clusterGrid'),
    scheduleStatus: document.getElementById('scheduleStatus'),
    logTerminal: document.getElementById('logTerminal')
};

function log(msg, type = '') {
    const div = document.createElement('div');
    div.className = `log-entry ${type ? 'log-' + type : ''}`;
    div.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
    UI.logTerminal.appendChild(div);
    UI.logTerminal.scrollTop = UI.logTerminal.scrollHeight;
}

// State
let podQueue = [];
let podCounter = 1;
let isScheduling = false;

const nodes = [
    { id: 'Node-1', maxCpu: 8, maxMem: 16, cpu: 0, mem: 0, pods: [] },
    { id: 'Node-2', maxCpu: 4, maxMem: 8, cpu: 0, mem: 0, pods: [] },
    { id: 'Node-3', maxCpu: 16, maxMem: 32, cpu: 0, mem: 0, pods: [] }
];

function renderNodes() {
    UI.clusterGrid.innerHTML = '';
    nodes.forEach((node, index) => {
        const cpuPct = (node.cpu / node.maxCpu) * 100;
        const memPct = (node.mem / node.maxMem) * 100;
        
        let podsHtml = node.pods.map(p => `<div class="pod-mini ${p.type}"></div>`).join('');
        
        const nodeEl = document.createElement('div');
        nodeEl.className = 'kube-node';
        nodeEl.id = `node-${index}`;
        nodeEl.innerHTML = `
            <div class="node-header">
                <h3><i class="fas fa-server"></i> ${node.id}</h3>
                <div class="node-score" id="score-${index}">0</div>
            </div>
            <div class="resource-bar-container">
                <div class="resource-label">
                    <span>CPU (${node.cpu}/${node.maxCpu})</span>
                    <span>${cpuPct.toFixed(0)}%</span>
                </div>
                <div class="resource-bar">
                    <div class="resource-fill cpu" style="width: ${cpuPct}%"></div>
                </div>
            </div>
            <div class="resource-bar-container">
                <div class="resource-label">
                    <span>RAM (${node.mem}/${node.maxMem}G)</span>
                    <span>${memPct.toFixed(0)}%</span>
                </div>
                <div class="resource-bar">
                    <div class="resource-fill mem" style="width: ${memPct}%"></div>
                </div>
            </div>
            <div class="node-pods">${podsHtml}</div>
        `;
        UI.clusterGrid.appendChild(nodeEl);
    });
}

function renderQueue() {
    UI.podQueue.innerHTML = '';
    podQueue.forEach(pod => {
        UI.podQueue.innerHTML += `
            <div class="pod-card ${pod.type}">
                <span class="pod-title"><i class="fas fa-box"></i> ${pod.id}</span>
                <span class="pod-res">${pod.cpu}C / ${pod.mem}G</span>
            </div>
        `;
    });
}

UI.btnSpawnSmall.addEventListener('click', () => {
    podQueue.push({ id: `pod-${podCounter++}`, type: 'small', cpu: 1, mem: 1 });
    renderQueue();
    log(`Spawned small pod (1C/1G)`);
});

UI.btnSpawnLarge.addEventListener('click', () => {
    podQueue.push({ id: `pod-${podCounter++}`, type: 'large', cpu: 4, mem: 8 });
    renderQueue();
    log(`Spawned large pod (4C/8G)`);
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

UI.btnScheduleNext.addEventListener('click', async () => {
    if (isScheduling || podQueue.length === 0) return;
    isScheduling = true;
    const pod = podQueue[0];
    
    UI.scheduleStatus.innerText = "Scheduling...";
    UI.scheduleStatus.style.background = "#d29922";
    log(`Kube-Scheduler triggered for ${pod.id}. Req: ${pod.cpu}C/${pod.mem}G`, "warn");
    
    // 1. FILTERING PHASE
    log(`Phase 1: Filtering Nodes (Predicate Checks)...`);
    const validNodes = [];
    
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const el = document.getElementById(`node-${i}`);
        el.classList.add('filtering');
        
        await sleep(500);
        
        const hasCpu = (node.maxCpu - node.cpu) >= pod.cpu;
        const hasMem = (node.maxMem - node.mem) >= pod.mem;
        
        if (hasCpu && hasMem) {
            validNodes.push({ node, index: i });
            log(`- ${node.id}: Passed (Sufficient resources)`, "success");
        } else {
            el.classList.add('filtered-out');
            log(`- ${node.id}: Failed (Insufficient resources)`, "error");
        }
        el.classList.remove('filtering');
    }
    
    if (validNodes.length === 0) {
        log(`CRITICAL: No nodes available for ${pod.id}. Pod stays pending!`, "error");
        UI.scheduleStatus.innerText = "Pending";
        UI.scheduleStatus.style.background = "#f85149";
        document.querySelectorAll('.kube-node').forEach(el => el.classList.remove('filtered-out'));
        isScheduling = false;
        return;
    }
    
    await sleep(800);
    
    // 2. SCORING PHASE (LeastAllocated heuristic)
    log(`Phase 2: Scoring Nodes (LeastAllocated Heuristic)...`);
    let bestNode = null;
    let bestScore = -1;
    let bestIndex = -1;
    
    for (let {node, index} of validNodes) {
        const el = document.getElementById(`node-${index}`);
        el.classList.add('scoring');
        
        // Simple LeastAllocated Score: (FreeCPU/MaxCPU + FreeMem/MaxMem) * 50 = Score out of 100
        const freeCpuPct = (node.maxCpu - node.cpu) / node.maxCpu;
        const freeMemPct = (node.maxMem - node.mem) / node.maxMem;
        const score = Math.round((freeCpuPct + freeMemPct) * 50);
        
        document.getElementById(`score-${index}`).innerText = score;
        log(`- ${node.id} Score: ${score}`, "success");
        
        if (score > bestScore) {
            bestScore = score;
            bestNode = node;
            bestIndex = index;
        }
        
        await sleep(600);
        el.classList.remove('scoring');
    }
    
    // 3. BINDING PHASE
    log(`Phase 3: Binding ${pod.id} to ${bestNode.id} (Winner with score ${bestScore})`, "success");
    const winnerEl = document.getElementById(`node-${bestIndex}`);
    winnerEl.classList.add('selected');
    
    await sleep(800);
    
    bestNode.cpu += pod.cpu;
    bestNode.mem += pod.mem;
    bestNode.pods.push(pod);
    
    podQueue.shift(); // Remove from queue
    
    renderNodes();
    renderQueue();
    
    UI.scheduleStatus.innerText = "Idle";
    UI.scheduleStatus.style.background = "#238636";
    isScheduling = false;
});

// Init
renderNodes();
