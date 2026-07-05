/**
 * fcfs-visualizer.js
 * Implements the First Come First Serve CPU Scheduling Algorithm.
 * Handles process input, algorithm execution, and dynamic Gantt Chart rendering.
 */

document.addEventListener("DOMContentLoaded", () => {
    initFCFS();
});

// --- Application State ---
let processes = [];
let processIdCounter = 1;

// --- DOM Elements ---
const els = {
    // Inputs
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
    cpuUtil: document.getElementById('cpuUtil')
};

// ==========================================
// 1. INITIALIZATION & EVENTS
// ==========================================
function initFCFS() {
    els.btnAddProcess.addEventListener('click', handleAddProcess);
    els.btnStartSimulation.addEventListener('click', runFCFSSimulation);
    els.btnReset.addEventListener('click', resetEnvironment);
    
    // Allow 'Enter' key to add process
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

    if (isNaN(at) || at < 0) return alert("Arrival Time must be a positive number.");
    if (isNaN(bt) || bt <= 0) return alert("Burst Time must be greater than 0.");

    const process = {
        pid: `P${processIdCounter++}`,
        at: at,
        bt: bt,
        ct: 0,
        tat: 0,
        wt: 0
    };

    processes.push(process);
    renderInputTable();
    
    // Reset inputs for convenience (auto-increment Arrival Time slightly)
    els.arrivalTime.value = at + 1;
    els.burstTime.value = Math.floor(Math.random() * 5) + 2; // Randomize next BT a bit
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

    // Render list (sorted visually by insertion, algorithm will sort by AT later)
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
    
    // Hide visualization
    els.emptyGantt.style.display = 'flex';
    els.ganttChart.innerHTML = '';
    els.ganttChart.appendChild(els.emptyGantt);
    
    els.metricsDashboard.classList.add('hidden');
    els.resultsSection.classList.add('hidden');
    
    els.engineBadge.classList.remove('active');
    els.btnStartSimulation.innerHTML = '<i class="fas fa-play"></i> Run Scheduler';
}

// ==========================================
// 3. FCFS SCHEDULING ALGORITHM
// ==========================================
function runFCFSSimulation() {
    if (processes.length === 0) return;

    els.btnStartSimulation.innerHTML = '<i class="fas fa-check"></i> Executed';
    els.engineBadge.classList.add('active');

    // Deep copy to avoid mutating original input array directly during calculation
    let readyQueue = JSON.parse(JSON.stringify(processes));

    // 1. Sort by Arrival Time. If AT is same, sort by PID.
    readyQueue.sort((a, b) => {
        if (a.at === b.at) {
            return parseInt(a.pid.substring(1)) - parseInt(b.pid.substring(1));
        }
        return a.at - b.at;
    });

    let currentTime = 0;
    let totalIdleTime = 0;
    let ganttTimeline = [];
    let totalTAT = 0;
    let totalWT = 0;

    // 2. Execute Processes
    readyQueue.forEach(p => {
        // Handle Idle Time if CPU is ready before process arrives
        if (currentTime < p.at) {
            const idleDuration = p.at - currentTime;
            ganttTimeline.push({
                type: 'IDLE',
                start: currentTime,
                end: p.at,
                duration: idleDuration
            });
            totalIdleTime += idleDuration;
            currentTime = p.at;
        }

        // Execute Process
        p.ct = currentTime + p.bt;       // Completion Time
        p.tat = p.ct - p.at;             // Turnaround Time
        p.wt = p.tat - p.bt;             // Waiting Time

        totalTAT += p.tat;
        totalWT += p.wt;

        ganttTimeline.push({
            type: 'PROCESS',
            pid: p.pid,
            start: currentTime,
            end: p.ct,
            duration: p.bt
        });

        currentTime = p.ct;
    });

    // 3. Calculate Averages & CPU Utilization
    const n = readyQueue.length;
    const avgTAT = (totalTAT / n).toFixed(2);
    const avgWT = (totalWT / n).toFixed(2);
    
    // CPU Utilization = (Total Time - Idle Time) / Total Time
    const totalTime = currentTime; 
    const cpuUtilization = (((totalTime - totalIdleTime) / totalTime) * 100).toFixed(2);

    // 4. Render Results
    renderGanttChart(ganttTimeline, totalTime);
    renderMetrics(avgWT, avgTAT, cpuUtilization);
    renderResultsTable(readyQueue);
}

// ==========================================
// 4. VISUALIZATION RENDERING
// ==========================================
function renderGanttChart(timeline, totalTime) {
    els.emptyGantt.style.display = 'none';
    
    // Keep empty state in DOM for resets, but clear other blocks
    Array.from(els.ganttChart.children).forEach(child => {
        if (child.id !== 'emptyGantt') child.remove();
    });

    let animationDelay = 0;

    timeline.forEach(block => {
        // Calculate flex-grow basis (percentage of total time)
        const widthPercentage = (block.duration / totalTime) * 100;
        
        const div = document.createElement('div');
        div.className = `gantt-block ${block.type === 'IDLE' ? 'gantt-idle' : 'gantt-process'}`;
        div.style.flexBasis = `${widthPercentage}%`;
        div.style.animationDelay = `${animationDelay}s`;
        
        const label = block.type === 'IDLE' ? 'IDLE' : block.pid;
        
        // Show start time only on the first block, or if it's an idle block following another
        const showStart = true; // For FCFS, showing both bounds is clearer

        div.innerHTML = `
            ${label}
            ${showStart ? `<span class="gantt-time time-start">${block.start}</span>` : ''}
            <span class="gantt-time time-end">${block.end}</span>
        `;
        
        els.ganttChart.appendChild(div);
        
        // Stagger animation timing slightly for visual effect
        animationDelay += 0.1;
    });
}

function renderMetrics(avgWT, avgTAT, cpuUtilization) {
    els.avgWT.textContent = `${avgWT} ms`;
    els.avgTAT.textContent = `${avgTAT} ms`;
    els.cpuUtil.textContent = `${cpuUtilization}%`;
    
    // Remove hidden class to trigger CSS animation
    els.metricsDashboard.classList.remove('hidden');
}

function renderResultsTable(processedData) {
    els.resultsTableBody.innerHTML = '';
    
    processedData.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.pid}</strong></td>
            <td>${p.at}</td>
            <td>${p.bt}</td>
            <td class="text-accent">${p.ct}</td>
            <td class="text-primary">${p.tat}</td>
            <td class="text-success">${p.wt}</td>
        `;
        els.resultsTableBody.appendChild(tr);
    });

    els.resultsSection.classList.remove('hidden');
}
