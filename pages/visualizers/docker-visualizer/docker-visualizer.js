/**
 * docker-visualizer.js
 * Simulates OS-level Virtualization: PID Namespaces, Network Namespaces (veth),
 * and cgroup memory throttling (OOM Killer).
 */

document.addEventListener("DOMContentLoaded", () => {
    initContainerEngine();
});

// ==========================================
// 1. KERNEL STATE & DATA STRUCTURES
// ==========================================

const KERNEL = {
    globalPidCounter: 1042,
    totalHostRam: 16384, // 16GB
    usedHostRam: 1200,   // Base OS usage
    processes: [],       // Array of Process objects
    containers: {},      // Map of containerId -> Container object
    vethPairs: 0         // Track virtual ethernet interfaces
};

class Container {
    constructor(memoryLimit) {
        this.id = Math.random().toString(16).substring(2, 8);
        this.name = `fervent_torvalds_${Math.floor(Math.random()*100)}`;
        this.memoryLimit = memoryLimit;
        this.memoryUsage = 0;
        this.localPidCounter = 1; // Namespace isolation: Starts at 1
        this.processes = []; // PIDs running in this container
        
        KERNEL.vethPairs++;
        this.vethHost = `veth${Math.random().toString(16).substring(2, 6)}`;
        this.vethContainer = `eth0`; // Standard isolated interface inside
    }
}

class Process {
    constructor(cmd, memoryReq, containerId = null) {
        this.hostPid = KERNEL.globalPidCounter++;
        this.cmd = cmd;
        this.memory = memoryReq;
        this.containerId = containerId;
        this.localPid = null;
        this.isAlive = true;

        if (containerId) {
            const container = KERNEL.containers[containerId];
            this.localPid = container.localPidCounter++;
            container.processes.push(this.hostPid);
            
            // Note: We don't allocate memory instantly here, the Kernel handles it
            // to check for cgroup limits first.
        }
    }
}

// DOM Elements
const els = {
    // Host OS
    hostRamUsage: document.getElementById('hostRamUsage'),
    hostVethList: document.getElementById('hostVethList'),
    hostProcessTable: document.getElementById('hostProcessTable'),
    hostLogs: document.getElementById('hostLogs'),
    
    // Control CLI
    cgroupLimit: document.getElementById('cgroupLimit'),
    cgroupLimitVal: document.getElementById('cgroupLimitVal'),
    btnMemVal: document.getElementById('btnMemVal'),
    btnCreateContainer: document.getElementById('btnCreateContainer'),
    interactionCard: document.getElementById('interactionCard'),
    activeContainerName: document.getElementById('activeContainerName'),
    btnSpawnNginx: document.getElementById('btnSpawnNginx'),
    btnSpawnNode: document.getElementById('btnSpawnNode'),
    btnAlloc50: document.getElementById('btnAlloc50'),
    btnAlloc200: document.getElementById('btnAlloc200'),
    btnKillContainer: document.getElementById('btnKillContainer'),
    
    // Container View
    containerSelector: document.getElementById('containerSelector'),
    containerWorkspace: document.getElementById('containerWorkspace'),
    containerEmptyState: document.getElementById('containerEmptyState'),
    nsPid: document.getElementById('nsPid'),
    cgroupUsage: document.getElementById('cgroupUsage'),
    cgroupMax: document.getElementById('cgroupMax'),
    cgroupBar: document.getElementById('cgroupBar'),
    oomWarning: document.getElementById('oomWarning'),
    containerProcessTable: document.getElementById('containerProcessTable')
};

// ==========================================
// 2. INITIALIZATION & EVENTS
// ==========================================

function initContainerEngine() {
    // Seed standard host processes
    spawnHostProcess('/sbin/init', 150);
    spawnHostProcess('/lib/systemd/systemd', 200);
    spawnHostProcess('/usr/bin/dockerd', 450);
    
    bindEvents();
    updateHostUI();
}

function bindEvents() {
    els.cgroupLimit.addEventListener('input', (e) => {
        els.cgroupLimitVal.textContent = e.target.value;
        els.btnMemVal.textContent = e.target.value;
    });

    els.btnCreateContainer.addEventListener('click', handleDockerRun);
    
    els.containerSelector.addEventListener('change', (e) => {
        switchContainerContext(e.target.value);
    });

    els.btnSpawnNginx.addEventListener('click', () => spawnContainerProcess('nginx -g "daemon off;"', 20));
    els.btnSpawnNode.addEventListener('click', () => spawnContainerProcess('node server.js', 60));
    
    els.btnAlloc50.addEventListener('click', () => stressMemory(50));
    els.btnAlloc200.addEventListener('click', () => stressMemory(200));
    
    els.btnKillContainer.addEventListener('click', handleDockerRm);
}

function logDmesg(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-line ${type}`;
    const timestamp = `[ ${(performance.now() / 1000).toFixed(4)}]`;
    div.innerHTML = `<code>${timestamp}</code> ${msg}`;
    els.hostLogs.appendChild(div);
    els.hostLogs.scrollTop = els.hostLogs.scrollHeight;
}

// ==========================================
// 3. KERNEL SYSTEM CALLS
// ==========================================

function spawnHostProcess(cmd, memory) {
    const proc = new Process(cmd, memory, null);
    KERNEL.processes.push(proc);
    KERNEL.usedHostRam += memory;
}

function handleDockerRun() {
    const memLimit = parseInt(els.cgroupLimit.value);
    const container = new Container(memLimit);
    
    KERNEL.containers[container.id] = container;
    logDmesg(`docker0: port ${KERNEL.vethPairs} (${container.vethHost}) entered blocking state`, 'info');
    logDmesg(`Created cgroup slice for container ${container.id} (Limit: ${memLimit}MB)`, 'info');

    // Add to dropdown
    const opt = document.createElement('option');
    opt.value = container.id;
    opt.textContent = `${container.id} (${container.name})`;
    els.containerSelector.appendChild(opt);
    els.containerSelector.value = container.id;

    // Automatically switch context
    switchContainerContext(container.id);

    // Docker run inherently spawns a PID 1 process
    spawnContainerProcess('/bin/sh', 10);
    
    updateHostUI();
}

function switchContainerContext(containerId) {
    if (!containerId || !KERNEL.containers[containerId]) {
        els.interactionCard.style.opacity = '0.5';
        els.interactionCard.style.pointerEvents = 'none';
        els.activeContainerName.textContent = 'None';
        els.containerWorkspace.classList.add('hidden');
        els.containerEmptyState.style.display = 'block';
        return;
    }

    const container = KERNEL.containers[containerId];
    
    // Update Control Panel
    els.interactionCard.style.opacity = '1';
    els.interactionCard.style.pointerEvents = 'auto';
    els.activeContainerName.textContent = container.name;

    // Update Right Panel (Container UI)
    els.containerWorkspace.classList.remove('hidden');
    els.containerEmptyState.style.display = 'none';
    els.nsPid.textContent = `[Mapped to Host PID ${container.processes[0] || '...'}]`;
    
    updateContainerUI(containerId);
}

function spawnContainerProcess(cmd, baseMemory) {
    const containerId = els.containerSelector.value;
    if (!containerId) return;

    const container = KERNEL.containers[containerId];
    
    // Check cgroup BEFORE spawning
    if (container.memoryUsage + baseMemory > container.memoryLimit) {
        logDmesg(`cgroup memory limit exceeded trying to spawn '${cmd}'.`, 'oom');
        return console.warn("Alert:", "Cannot spawn process. Container is out of memory (cgroup limit reached).");
    }

    const proc = new Process(cmd, baseMemory, containerId);
    KERNEL.processes.push(proc);
    
    // Allocate
    container.memoryUsage += baseMemory;
    KERNEL.usedHostRam += baseMemory;

    updateHostUI();
    updateContainerUI(containerId);
}

// ==========================================
// 4. CGROUP THROTTLING & OOM KILLER
// ==========================================

function stressMemory(amountMB) {
    const containerId = els.containerSelector.value;
    if (!containerId) return;

    const container = KERNEL.containers[containerId];
    
    // Find largest process in container to allocate to
    let targetProc = null;
    let maxMem = -1;
    
    KERNEL.processes.forEach(p => {
        if (p.isAlive && p.containerId === containerId && p.memory > maxMem) {
            maxMem = p.memory;
            targetProc = p;
        }
    });

    if (!targetProc) return; // Container is dead/empty

    // Apply stress
    targetProc.memory += amountMB;
    container.memoryUsage += amountMB;
    KERNEL.usedHostRam += amountMB;

    logDmesg(`Process ${targetProc.hostPid} (${targetProc.cmd}) requested ${amountMB}MB.`, 'sys');

    // CHECK CGROUP LIMIT (THE OOM KILLER)
    if (container.memoryUsage > container.memoryLimit) {
        triggerOOMKiller(containerId, targetProc);
    } else {
        updateHostUI();
        updateContainerUI(containerId);
    }
}

function triggerOOMKiller(containerId, targetProc) {
    const container = KERNEL.containers[containerId];
    
    logDmesg(`Memory cgroup out of memory: Killed process ${targetProc.hostPid} (${targetProc.cmd}) score 1000 or sacrifice child`, 'oom');
    logDmesg(`OOM killer invoked for container ${container.id}`, 'warn');

    // Mark dead
    targetProc.isAlive = false;
    
    // Reclaim memory
    container.memoryUsage -= targetProc.memory;
    KERNEL.usedHostRam -= targetProc.memory;
    targetProc.memory = 0;

    // Visual Flash
    updateHostUI();
    updateContainerUI(containerId);
    
    // Animate death row
    const hostRow = document.getElementById(`hpid-${targetProc.hostPid}`);
    const localRow = document.getElementById(`lpid-${targetProc.localPid}`);
    
    if (hostRow) hostRow.classList.add('oom-killed');
    if (localRow) localRow.classList.add('oom-killed');

    // Remove from kernel after animation
    setTimeout(() => {
        KERNEL.processes = KERNEL.processes.filter(p => p.hostPid !== targetProc.hostPid);
        container.processes = container.processes.filter(pid => pid !== targetProc.hostPid);
        
        // If PID 1 dies, the container dies
        if (targetProc.localPid === 1) {
            logDmesg(`Container ${container.id} entrypoint PID 1 died. Container exiting.`, 'warn');
            handleDockerRm(containerId);
        } else {
            updateHostUI();
            updateContainerUI(containerId);
        }
    }, 1000);
}

function handleDockerRm(targetId = null) {
    let containerId = typeof targetId === 'string' ? targetId : els.containerSelector.value;
    if (!containerId) return;

    const container = KERNEL.containers[containerId];
    
    // Kill all processes
    container.processes.forEach(pid => {
        const proc = KERNEL.processes.find(p => p.hostPid === pid);
        if (proc && proc.isAlive) {
            KERNEL.usedHostRam -= proc.memory;
        }
    });

    KERNEL.processes = KERNEL.processes.filter(p => p.containerId !== containerId);
    
    logDmesg(`docker0: port ${container.vethHost} disabled`, 'info');
    logDmesg(`Removed cgroup slice and namespaces for ${container.id}`, 'sys');

    // Cleanup State
    delete KERNEL.containers[containerId];
    
    // Update Dropdown
    Array.from(els.containerSelector.options).forEach(opt => {
        if (opt.value === containerId) opt.remove();
    });

    if (els.containerSelector.options.length > 1) {
        els.containerSelector.value = els.containerSelector.options[1].value;
        switchContainerContext(els.containerSelector.value);
    } else {
        els.containerSelector.value = "";
        switchContainerContext("");
    }

    updateHostUI();
}

// ==========================================
// 5. UI SYNCHRONIZATION
// ==========================================

function updateHostUI() {
    els.hostRamUsage.textContent = KERNEL.usedHostRam;
    
    // Render Process Table
    els.hostProcessTable.innerHTML = '';
    KERNEL.processes.forEach(p => {
        const tr = document.createElement('tr');
        if (p.containerId) tr.classList.add('container-proc');
        tr.id = `hpid-${p.hostPid}`;
        
        tr.innerHTML = `
            <td class="pid-tag">${p.hostPid}</td>
            <td><code>${p.cmd}</code></td>
            <td>${p.containerId ? `mnt:[${p.containerId.substring(0,4)}]` : 'host (root)'}</td>
            <td>${p.memory} MB</td>
        `;
        els.hostProcessTable.appendChild(tr);
    });

    // Render VETH interfaces
    els.hostVethList.innerHTML = '';
    Object.values(KERNEL.containers).forEach(c => {
        const div = document.createElement('div');
        div.className = 'veth-item';
        div.innerHTML = `<i class="fas fa-link"></i> <code>${c.vethHost}</code> @if2 (Mapped to ${c.id})`;
        els.hostVethList.appendChild(div);
    });
}

function updateContainerUI(containerId) {
    if (!containerId || !KERNEL.containers[containerId]) return;
    const container = KERNEL.containers[containerId];

    // Cgroup Bar
    els.cgroupUsage.textContent = container.memoryUsage;
    els.cgroupMax.textContent = container.memoryLimit;
    
    const pct = (container.memoryUsage / container.memoryLimit) * 100;
    els.cgroupBar.style.width = `${Math.min(pct, 100)}%`;
    
    if (pct > 90) {
        els.cgroupBar.className = 'cgroup-bar-fill danger';
        els.oomWarning.classList.remove('hidden');
    } else if (pct > 70) {
        els.cgroupBar.className = 'cgroup-bar-fill warning';
        els.oomWarning.classList.add('hidden');
    } else {
        els.cgroupBar.className = 'cgroup-bar-fill';
        els.oomWarning.classList.add('hidden');
    }

    // Local Process Table
    els.containerProcessTable.innerHTML = '';
    KERNEL.processes.filter(p => p.containerId === containerId).forEach(p => {
        const tr = document.createElement('tr');
        tr.id = `lpid-${p.localPid}`;
        tr.innerHTML = `
            <td class="pid-tag">${p.localPid}</td>
            <td><code>${p.cmd}</code></td>
            <td>${p.memory} MB</td>
        `;
        els.containerProcessTable.appendChild(tr);
    });
}
