/**
 * srtf-visualizer.js
 * Implements the Shortest Remaining Time First (SRTF) Preemptive CPU Scheduling Algorithm.
 * Accurately tracks context switches, computes metrics, and dynamically renders the Gantt chart.
 */

document.addEventListener("DOMContentLoaded", () => {
    initSRTF();
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
    avgRT: document.getElementById('avgRT')
};

// ==========================================
// 1. INITIALIZATION & EVENTS
// ==========================================
function initSRTF() {
    els.btnAddProcess.addEventListener('click', handleAddProcess);
    els.btnStartSimulation.addEventListener('click', runSRTFSimulation);
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

    if (isNaN(at) || at < 0) return console.warn("Alert:", "Arrival Time must be a positive number.");
    if (isNaN(bt) || bt <= 0) return console.warn("Alert:", "Burst Time must be greater than 0.");

    const process = {
        pid: `P${processIdCounter++}`,
        at: at,
        bt: bt,
        rt: bt, // Remaining Time initialized to Burst Time
        ct: 0,
        tat: 0,
        wt: 0,
        respT: 0,
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
    els.btnStartSimulation.innerHTML = '<i class="fas fa-play"></i> Run Scheduler';
    els.btnStartSimulation.disabled = processes.length === 0;
}

// ==========================================
// 3. SRTF (PREEMPTIVE) ALGORITHM
// ==========================================
function runSRTFSimulation() {
    if (processes.length === 0) return;

    els.btnStartSimulation.innerHTML = '<i class="fas fa-check"></i> Executed';
    els.btnStartSimulation.disabled = true;
    els.engineBadge.classList.add('active');

    // Deep copy to prevent mutating the original inputs
    let readyQueue = JSON.parse(JSON.stringify(processes));
    
    let currentTime = 0;
    let completed = 0;
    const n = readyQueue.length;
    
    let timeline = [];
    let currentBlock = null;

    // Loop tick by tick
    while (completed < n) {
        let minRt = Infinity;
        let shortestIdx = -1;

        // Find the process with the shortest remaining time among arrived processes
        for (let i = 0; i < n; i++) {
            let p = readyQueue[i];
            if (p.at <= currentTime && p.rt > 0) {
                if (p.rt < minRt) {
                    minRt = p.rt;
                    shortestIdx = i;
                } else if (p.rt === minRt) {
                    // Tie-breaker: First Come First Serve (Arrival Time)
                    if (p.at < readyQueue[shortestIdx].at) {
                        shortestIdx = i;
                    }
                }
            }
        }

        if (shortestIdx !== -1) {
            let p = readyQueue[shortestIdx];
            
            // Record first start time for Response Time metric
            if (p.firstStart === undefined) {
                p.firstStart = currentTime;
                p.respT = p.firstStart - p.at;
            }

            // Build Timeline for Gantt Chart (Merge consecutive blocks of same process)
            if (currentBlock && currentBlock.type === 'PROCESS' && currentBlock.pid === p.pid) {
                currentBlock.duration++;
                currentBlock.end = currentTime + 1;
            } else {
                currentBlock = { type: 'PROCESS', pid: p.pid, start: currentTime, end: currentTime + 1, duration: 1 };
                timeline.push(currentBlock);
            }

            // Execute for 1 unit of time
            p.rt--;
            currentTime++;

            // If process finishes
            if (p.rt === 0) {
                completed++;
                p.ct = currentTime;
                p.tat = p.ct - p.at;
                p.wt = p.tat - p.bt;
            }
        } else {
            // No process available, CPU is Idle
            if (currentBlock && currentBlock.type === 'IDLE') {
                currentBlock.duration++;
                currentBlock.end = currentTime + 1;
            } else {
                currentBlock = { type: 'IDLE', start: currentTime, end: currentTime + 1, duration: 1 };
                timeline.push(currentBlock);
            }
            currentTime++;
        }
    }

    // 3. Calculate Aggregates
    let totalTAT = 0, totalWT = 0, totalRT = 0;
    readyQueue.forEach(p => {
        totalTAT += p.tat;
        totalWT += p.wt;
        totalRT += p.respT;
    });

    const avgTAT = (totalTAT / n).toFixed(2);
    const avgWT = (totalWT / n).toFixed(2);
    const avgRT = (totalRT / n).toFixed(2);

    // 4. Render UI
    renderGanttChart(timeline, currentTime);
    renderMetrics(avgWT, avgTAT, avgRT);
    renderResultsTable(readyQueue);
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
        
        const label = block.type === 'IDLE' ? 'IDLE' : block.pid;
        
        // Render start time on the first block, and end time on all blocks
        const showStart = index === 0 || (timeline[index-1].type === 'IDLE' && block.type === 'IDLE');

        div.innerHTML = `
            ${label}
            ${showStart ? `<span class="gantt-time time-start">${block.start}</span>` : ''}
            <span class="gantt-time time-end">${block.end}</span>
        `;
        
        els.ganttChart.appendChild(div);
        animationDelay += 0.05; // Fast stagger for context switches
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
            <td style="color: var(--os-primary);">${p.respT}</td>
        `;
        els.resultsTableBody.appendChild(tr);
    });

    els.resultsSection.classList.remove('hidden');
}
