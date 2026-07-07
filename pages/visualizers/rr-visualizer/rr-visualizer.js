/**
 * rr-visualizer.js
 * Implements the Round Robin CPU Scheduling Algorithm.
 * Tracks time quantum slices, handles dynamic ready queue updates, 
 * and visualizes the context switches accurately on a Gantt chart.
 */

document.addEventListener("DOMContentLoaded", () => {
    initRR();
});

// --- Application State ---
let processes = [];
let processIdCounter = 1;

// --- DOM Elements ---
const els = {
    // Inputs
    timeQuantum: document.getElementById('timeQuantum'),
    arrivalTime: document.getElementById('arrivalTime'),
    burstTime: document.getElementById('burstTime'),
    btnAddProcess: document.getElementById('btnAddProcess'),
    
    // Tables & Controls
    inputTableBody: document.getElementById('inputTableBody'),
    emptyStateRow: document.getElementById('emptyStateRow'),
    btnStartSimulation: document.getElementById('btnStartSimulation'),
    btnReset: document.getElementById('btnReset'),
    engineBadge: document.getElementById('engineBadge'),
    
    // Visualization
    ganttChart: document.getElementById('ganttChart'),
    emptyGantt: document.getElementById('emptyGantt'),
    metricsDashboard: document.getElementById('metricsDashboard'),
    resultsSection: document.getElementById('resultsSection'),
    resultsTableBody: document.getElementById('resultsTableBody'),
    
    // Metrics
    avgWT: document.getElementById('avgWT'),
    avgTAT: document.getElementById('avgTAT'),
    avgRT: document.getElementById('avgRT')
};

// ==========================================
// 1. INITIALIZATION & EVENTS
// ==========================================
function initRR() {
    els.btnAddProcess.addEventListener('click', handleAddProcess);
    els.btnStartSimulation.addEventListener('click', runRRSimulation);
    els.btnReset.addEventListener('click', resetEnvironment);
    
    els.burstTime.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddProcess();
    });
}

// ==========================================
// 2. INPUT MANAGEMENT
// ==========================================
function handleAddProcess() {
    const at = parseInt(els.arrivalTime.value);
    const bt = parseInt(els.burstTime.value);

    if (isNaN(at) || at < 0) return void 0;
    if (isNaN(bt) || bt <= 0) return void 0;

    const process = {
        pid: `P${processIdCounter++}`,
        at: at,
        bt: bt,
        rt: bt, // Remaining Time initialized to Burst Time
        ct: 0,
        tat: 0,
        wt: 0,
        rtMetric: 0,
        firstStart: undefined
    };

    processes.push(process);
    renderInputTable();
    
    // Comfort feature: auto-increment AT
    els.arrivalTime.value = at + 1;
    els.burstTime.value = Math.floor(Math.random() * 5) + 2; 
    els.arrivalTime.focus();
}

function removeProcess(pid) {
    processes = processes.filter(p => p.pid !== pid);
    renderInputTable();
}

function renderInputTable() {
    if (processes.length === 0) {
        els.emptyStateRow.style.display = 'table-row';
        els.btnStartSimulation.disabled = true;
        els.inputTableBody.innerHTML = '';
        els.inputTableBody.appendChild(els.emptyStateRow);
        return;
    }

    els.emptyStateRow.style.display = 'none';
    els.btnStartSimulation.disabled = false;
    els.inputTableBody.innerHTML = '';

    processes.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.pid}</strong></td>
            <td>${p.at}</td>
            <td>${p.bt}</td>
            <td><button class="btn-sm-danger" onclick="removeProcess('${p.pid}')"><i class="fas fa-trash"></i></button></td>
        `;
        els.inputTableBody.appendChild(tr);
    });
}

function resetEnvironment() {
    processes = [];
    processIdCounter = 1;
    els.arrivalTime.value = 0;
    els.burstTime.value = 5;
    
    renderInputTable();
    
    els.emptyGantt.style.display = 'flex';
    els.ganttChart.innerHTML = '';
    els.ganttChart.appendChild(els.emptyGantt);
    
    els.metricsDashboard.classList.add('hidden');
    els.resultsSection.classList.add('hidden');
    
    els.engineBadge.classList.remove('active');
    els.btnStartSimulation.innerHTML = '<i class="fas fa-sync-alt"></i> Run Scheduler';
    els.btnStartSimulation.disabled = processes.length === 0;
}

// ==========================================
// 3. ROUND ROBIN ALGORITHM
// ==========================================
function runRRSimulation() {
    if (processes.length === 0) return;

    const tq = parseInt(els.timeQuantum.value);
    if (isNaN(tq) || tq <= 0) return void 0;

    els.btnStartSimulation.innerHTML = '<i class="fas fa-check"></i> Executed';
    els.btnStartSimulation.disabled = true;
    els.engineBadge.classList.add('active');

    // Deep copy and sort by Arrival Time
    let procs = JSON.parse(JSON.stringify(processes));
    procs.sort((a, b) => a.at - b.at);

    let readyQueue = [];
    let timeline = [];
    let currentTime = 0;
    let completedCount = 0;
    let n = procs.length;
    let pIdx = 0; // Pointer for un-arrived processes

    // Initialize clock to the first process arrival if it's > 0
    if (procs[0].at > currentTime) {
        let idleDur = procs[0].at - currentTime;
        timeline.push({ type: 'IDLE', start: currentTime, end: procs[0].at, duration: idleDur });
        currentTime = procs[0].at;
    }

    // Push initial processes that arrive at currentTime
    while (pIdx < n && procs[pIdx].at <= currentTime) {
        readyQueue.push(procs[pIdx]);
        pIdx++;
    }

    // Main Execution Loop
    while (completedCount < n) {
        if (readyQueue.length === 0) {
            // CPU is idle, wait for the next process to arrive
            let nextArrival = procs[pIdx].at;
            timeline.push({ type: 'IDLE', start: currentTime, end: nextArrival, duration: nextArrival - currentTime });
            currentTime = nextArrival;
            
            while (pIdx < n && procs[pIdx].at <= currentTime) {
                readyQueue.push(procs[pIdx]);
                pIdx++;
            }
            continue;
        }

        // Pop the front process from ready queue
        let p = readyQueue.shift();

        // Record first start time for Response Time metric
        if (p.firstStart === undefined) {
            p.firstStart = currentTime;
            p.rtMetric = p.firstStart - p.at;
        }

        // Execute for minimum of Remaining Time or Time Quantum
        let execTime = Math.min(p.rt, tq);
        
        timeline.push({
            type: 'PROCESS',
            pid: p.pid,
            start: currentTime,
            end: currentTime + execTime,
            duration: execTime
        });

        currentTime += execTime;
        p.rt -= execTime;

        // **CRUCIAL RR LOGIC**: Any processes that arrive DURING this execution slice
        // must be added to the ready queue BEFORE the current process is re-added.
        while (pIdx < n && procs[pIdx].at <= currentTime) {
            readyQueue.push(procs[pIdx]);
            pIdx++;
        }

        // Re-queue or Mark Completed
        if (p.rt > 0) {
            readyQueue.push(p);
        } else {
            p.ct = currentTime;
            p.tat = p.ct - p.at;
            p.wt = p.tat - p.bt;
            completedCount++;
        }
    }

    // 3. Calculate Aggregates
    let totalTAT = 0, totalWT = 0, totalRT = 0;
    procs.forEach(p => {
        totalTAT += p.tat;
        totalWT += p.wt;
        totalRT += p.rtMetric;
    });

    const avgTAT = (totalTAT / n).toFixed(2);
    const avgWT = (totalWT / n).toFixed(2);
    const avgRT = (totalRT / n).toFixed(2);

    // 4. Render UI
    renderGanttChart(timeline, currentTime);
    renderMetrics(avgWT, avgTAT, avgRT);
    renderResultsTable(procs);
}

// ==========================================
// 4. VISUALIZATION RENDERING
// ==========================================
function renderGanttChart(timeline, totalTime) {
    els.emptyGantt.style.display = 'none';
    
    // Clear previous blocks but keep the empty state div
    Array.from(els.ganttChart.children).forEach(child => {
        if (child.id !== 'emptyGantt') child.remove();
    });

    let animationDelay = 0;

    timeline.forEach((block, index) => {
        // Calculate flex-basis percentage
        const widthPercentage = (block.duration / totalTime) * 100;
        
        const div = document.createElement('div');
        div.className = `gantt-block ${block.type === 'IDLE' ? 'gantt-idle' : 'gantt-process'}`;
        div.style.flexBasis = `${widthPercentage}%`;
        div.style.animationDelay = `${animationDelay}s`;
        
        // Use a generic label or PID
        const label = block.type === 'IDLE' ? 'IDLE' : block.pid;
        
        // Show start time on first block or after an idle, and show end time always
        const showStart = index === 0 || (timeline[index-1].type === 'IDLE' && block.type === 'IDLE');

        div.innerHTML = `
            ${label}
            ${showStart ? `<span class="gantt-time time-start">${block.start}</span>` : ''}
            <span class="gantt-time time-end">${block.end}</span>
        `;
        
        els.ganttChart.appendChild(div);
        animationDelay += 0.05; // Fast stagger to show rapid context switching
    });
}

function renderMetrics(avgWT, avgTAT, avgRT) {
    els.avgWT.textContent = `${avgWT} ms`;
    els.avgTAT.textContent = `${avgTAT} ms`;
    els.avgRT.textContent = `${avgRT} ms`;
    
    els.metricsDashboard.classList.remove('hidden');
}

function renderResultsTable(processedData) {
    els.resultsTableBody.innerHTML = '';
    
    // Sort table by PID for easier reading after processing
    processedData.sort((a, b) => parseInt(a.pid.substring(1)) - parseInt(b.pid.substring(1)));

    processedData.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.pid}</strong></td>
            <td>${p.at}</td>
            <td>${p.bt}</td>
            <td class="text-accent">${p.ct}</td>
            <td class="text-primary">${p.tat}</td>
            <td class="text-success">${p.wt}</td>
            <td style="color: var(--os-accent);">${p.rtMetric}</td>
        `;
        els.resultsTableBody.appendChild(tr);
    });

    els.resultsSection.classList.remove('hidden');
}
