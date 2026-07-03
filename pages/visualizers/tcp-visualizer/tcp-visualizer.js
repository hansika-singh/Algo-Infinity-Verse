/**
 * tcp-visualizer.js
 * Implements a mock TCP Reno state machine and orchestrates Chart.js plotting
 * alongside HTML5 Canvas packet flow animations.
 */

document.addEventListener("DOMContentLoaded", () => {
    initTCPVisualizer();
});

// ==========================================
// 1. ENGINE STATE & CONSTANTS
// ==========================================
const TCP_STATES = {
    SLOW_START: { id: 'SLOW_START', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', desc: 'CWND doubles every RTT. The sender aggressively probes the network for available bandwidth until the Slow Start Threshold (ssthresh) is reached.' },
    CONGESTION_AVOIDANCE: { id: 'CONGESTION AVOIDANCE', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', desc: 'CWND grows linearly (+1 per RTT). The sender cautiously probes for more bandwidth to avoid causing a network traffic jam.' },
    FAST_RECOVERY: { id: 'FAST RECOVERY', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', desc: 'Triggered by 3 Duplicate ACKs. ssthresh drops to CWND/2, and CWND drops to ssthresh. Skipped the harsh Slow Start phase for a faster recovery.' },
    TIMEOUT: { id: 'TIMEOUT', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', desc: 'Severe congestion detected (ACKs not returning). ssthresh drops to CWND/2, and CWND resets entirely back to 1. Back to Slow Start.' }
};

let simState = {
    isRunning: false,
    timer: null,
    
    // TCP Variables
    round: 0,
    cwnd: 1,
    ssthresh: 16,
    state: TCP_STATES.SLOW_START,
    
    // Config
    lossProb: 0.02,
    rttMs: 800,
    
    // Manual Triggers
    forceDupAck: false,
    forceTimeout: false,

    // Chart Data
    labels: [],
    cwndData: [],
    ssthreshData: []
};

// Canvas Packet Engine
let packets = []; // { x, y, targetX, targetY, progress, type: 'DATA'|'ACK'|'DROP', id }

const els = {
    btnToggleSim: document.getElementById('btnToggleSim'),
    btnReset: document.getElementById('btnReset'),
    btnForceDupAck: document.getElementById('btnForceDupAck'),
    btnForceTimeout: document.getElementById('btnForceTimeout'),
    
    lossRateSlider: document.getElementById('lossRateSlider'),
    lossRateVal: document.getElementById('lossRateVal'),
    initSsthresh: document.getElementById('initSsthresh'),
    speedSlider: document.getElementById('speedSlider'),
    speedVal: document.getElementById('speedVal'),
    
    engineBadge: document.getElementById('engineBadge'),
    stateExplanationBox: document.getElementById('stateExplanationBox'),
    currentStateBadge: document.getElementById('currentStateBadge'),
    stateDescription: document.getElementById('stateDescription'),
    dispCwnd: document.getElementById('dispCwnd'),
    dispSsthresh: document.getElementById('dispSsthresh'),
    
    canvas: document.getElementById('networkCanvas'),
    canvasContainer: document.getElementById('canvasContainer')
};

let chartInstance;
let ctx;
let canvasAnimId;

// ==========================================
// 2. INITIALIZATION & EVENTS
// ==========================================
function initTCPVisualizer() {
    initChart();
    initCanvas();
    updateUIState();
    
    // Event Listeners
    els.btnToggleSim.addEventListener('click', toggleSimulation);
    els.btnReset.addEventListener('click', resetSimulation);
    
    els.btnForceDupAck.addEventListener('click', () => { if(simState.isRunning) simState.forceDupAck = true; });
    els.btnForceTimeout.addEventListener('click', () => { if(simState.isRunning) simState.forceTimeout = true; });
    
    els.lossRateSlider.addEventListener('input', (e) => {
        simState.lossProb = e.target.value / 100;
        els.lossRateVal.textContent = `${e.target.value}%`;
    });
    
    els.speedSlider.addEventListener('input', (e) => {
        simState.rttMs = parseInt(e.target.value);
        els.speedVal.textContent = `${simState.rttMs}ms`;
        if (simState.isRunning) {
            clearInterval(simState.timer);
            simState.timer = setInterval(tcpTick, simState.rttMs);
        }
    });

    els.initSsthresh.addEventListener('change', (e) => {
        if (!simState.isRunning && simState.round === 0) {
            simState.ssthresh = parseInt(e.target.value);
            els.dispSsthresh.textContent = simState.ssthresh;
            updateChartDirect();
        }
    });
}

// ==========================================
// 3. TCP RENO STATE MACHINE
// ==========================================
function toggleSimulation() {
    if (simState.isRunning) {
        simState.isRunning = false;
        clearInterval(simState.timer);
        els.btnToggleSim.innerHTML = '<i class="fas fa-play"></i> Resume Simulation';
        els.engineBadge.classList.remove('active');
    } else {
        simState.isRunning = true;
        // Grab initial ssthresh if just starting
        if (simState.round === 0) simState.ssthresh = parseInt(els.initSsthresh.value) || 16;
        
        simState.timer = setInterval(tcpTick, simState.rttMs);
        els.btnToggleSim.innerHTML = '<i class="fas fa-pause"></i> Pause Simulation';
        els.engineBadge.classList.add('active');
        
        // Ensure initial state is recorded
        if (simState.round === 0) recordChartData();
    }
}

function resetSimulation() {
    simState.isRunning = false;
    clearInterval(simState.timer);
    
    simState.round = 0;
    simState.cwnd = 1;
    simState.ssthresh = parseInt(els.initSsthresh.value) || 16;
    simState.state = TCP_STATES.SLOW_START;
    
    simState.forceDupAck = false;
    simState.forceTimeout = false;
    
    simState.labels = [];
    simState.cwndData = [];
    simState.ssthreshData = [];
    
    packets = []; // Clear visual packets
    
    els.btnToggleSim.innerHTML = '<i class="fas fa-play"></i> Start Simulation';
    els.engineBadge.classList.remove('active');
    
    updateUIState();
    updateChartDirect();
}

/**
 * Executes a single Round Trip Time (RTT).
 * Implements simplified TCP Reno logic for educational visualization.
 */
function tcpTick() {
    simState.round++;
    let hadLoss = false;

    // 1. Check for packet drops (Manual or Random)
    if (simState.forceTimeout || Math.random() < (simState.lossProb * 0.2)) { // 20% of losses are strict timeouts
        // TIMEOUT
        simState.ssthresh = Math.max(Math.floor(simState.cwnd / 2), 2);
        simState.cwnd = 1;
        simState.state = TCP_STATES.TIMEOUT;
        simState.forceTimeout = false;
        hadLoss = true;
        spawnPackets(true, 'TIMEOUT');
    } 
    else if (simState.forceDupAck || Math.random() < (simState.lossProb * 0.8)) { // 80% are 3 DUP ACKs
        // 3 DUP ACKs (Fast Retransmit / Fast Recovery)
        simState.ssthresh = Math.max(Math.floor(simState.cwnd / 2), 2);
        simState.cwnd = simState.ssthresh; // Skipping actual +3 exact math for visual simplicity
        simState.state = TCP_STATES.FAST_RECOVERY;
        simState.forceDupAck = false;
        hadLoss = true;
        spawnPackets(true, 'DUP_ACK');
    }

    // 2. Successful Transmission
    if (!hadLoss) {
        // If we were recovering/timeout last tick, transition back to standard flow
        if (simState.state === TCP_STATES.FAST_RECOVERY) {
            simState.state = TCP_STATES.CONGESTION_AVOIDANCE;
        } else if (simState.state === TCP_STATES.TIMEOUT) {
            simState.state = TCP_STATES.SLOW_START;
        }

        // Increase Window
        if (simState.state === TCP_STATES.SLOW_START) {
            simState.cwnd *= 2; // Exponential Growth
            
            if (simState.cwnd >= simState.ssthresh) {
                simState.cwnd = simState.ssthresh;
                simState.state = TCP_STATES.CONGESTION_AVOIDANCE;
            }
        } else if (simState.state === TCP_STATES.CONGESTION_AVOIDANCE) {
            simState.cwnd += 1; // Linear Growth
        }
        
        spawnPackets(false);
    }

    // Ensure floating points don't mess up display
    simState.cwnd = Math.floor(simState.cwnd);

    // 3. Update Visuals
    recordChartData();
    updateUIState();
}

function updateUIState() {
    const s = simState.state;
    els.currentStateBadge.textContent = s.id;
    els.currentStateBadge.style.color = s.color;
    els.currentStateBadge.style.borderColor = s.color;
    els.currentStateBadge.style.backgroundColor = s.bg;
    
    els.stateExplanationBox.style.borderColor = s.color;
    els.stateDescription.textContent = s.desc;
    
    els.dispCwnd.textContent = simState.cwnd;
    els.dispSsthresh.textContent = simState.ssthresh;
}

// ==========================================
// 4. CHART.JS INTEGRATION
// ==========================================
function initChart() {
    const canvas = document.getElementById('cwndChart');
    chartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: simState.labels,
            datasets: [
                {
                    label: 'CWND',
                    data: simState.cwndData,
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 4,
                    pointBackgroundColor: '#0284c7'
                },
                {
                    label: 'ssthresh',
                    data: simState.ssthreshData,
                    borderColor: '#a855f7',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 300 },
            scales: {
                y: { 
                    beginAtZero: true, 
                    title: { display: true, text: 'Window Size (Segments)', color: '#94a3b8' },
                    grid: { color: '#1e293b' },
                    ticks: { color: '#94a3b8', stepSize: 10 }
                },
                x: { 
                    title: { display: true, text: 'Transmission Round (RTT)', color: '#94a3b8' },
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function recordChartData() {
    simState.labels.push(simState.round);
    simState.cwndData.push(simState.cwnd);
    simState.ssthreshData.push(simState.ssthresh);
    
    // Keep window sliding if too long
    if (simState.labels.length > 30) {
        simState.labels.shift();
        simState.cwndData.shift();
        simState.ssthreshData.shift();
    }
    
    updateChartDirect();
}

function updateChartDirect() {
    chartInstance.update();
}

// ==========================================
// 5. CANVAS PACKET ANIMATION
// ==========================================
function initCanvas() {
    ctx = els.canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    startCanvasLoop();
}

function resizeCanvas() {
    const rect = els.canvasContainer.getBoundingClientRect();
    els.canvas.width = rect.width * window.devicePixelRatio;
    els.canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    els.canvas.style.width = `${rect.width}px`;
    els.canvas.style.height = `${rect.height}px`;
}

function spawnPackets(hasLoss, lossType) {
    const rect = els.canvasContainer.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    
    // Limits visual clutter. Draw max 15 packets even if CWND is huge.
    const visualCount = Math.min(simState.cwnd, 15); 
    
    const senderX = 100; // Approx edge of sender box
    const receiverX = w - 100; // Approx edge of receiver box
    
    // Calculate animation speed based on RTT so they arrive just as the next tick happens
    // 60 fps * (rttMs / 1000) = frames per RTT. Progress per frame = 1 / frames.
    const framesPerRTT = 60 * (simState.rttMs / 1000);
    const speed = 1.0 / (framesPerRTT * 0.8); // Slightly faster to clear the screen before next round

    for (let i = 0; i < visualCount; i++) {
        // Spread packets vertically
        const yOffset = (h / 2) + ((Math.random() - 0.5) * 60);
        
        let type = 'DATA';
        let failAt = 1.0; // Assume success
        
        if (hasLoss && i === visualCount - 1) {
            // Make the last packet the dropped one for visual feedback
            type = lossType;
            failAt = 0.4 + (Math.random() * 0.4); // Drops somewhere in the middle
        }
        
        packets.push({
            id: Math.random(),
            x: senderX,
            y: yOffset,
            targetX: receiverX,
            progress: 0, // 0.0 to 1.0 (DATA) then 1.0 to 2.0 (ACK)
            speed: speed,
            type: type,
            failAt: failAt
        });
    }
}

function startCanvasLoop() {
    function loop() {
        renderCanvas();
        canvasAnimId = requestAnimationFrame(loop);
    }
    loop();
}

function renderCanvas() {
    const w = els.canvas.clientWidth;
    const h = els.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    
    const senderX = 100;
    const receiverX = w - 100;

    for (let i = packets.length - 1; i >= 0; i--) {
        let p = packets[i];
        
        p.progress += p.speed;

        if (p.type === 'DATA') {
            // Forward journey
            if (p.progress <= 1.0) {
                p.x = senderX + (receiverX - senderX) * p.progress;
                drawPacket(p.x, p.y, '#0ea5e9'); // Blue Data
            } 
            // Return journey (ACK)
            else if (p.progress <= 2.0) {
                p.x = receiverX - (receiverX - senderX) * (p.progress - 1.0);
                drawPacket(p.x, p.y, '#10b981', true); // Green ACK
            } 
            // Done
            else {
                packets.splice(i, 1);
            }
        } 
        else if (p.type === 'TIMEOUT' || p.type === 'DUP_ACK') {
            // Forward journey until failure point
            if (p.progress <= p.failAt) {
                p.x = senderX + (receiverX - senderX) * p.progress;
                drawPacket(p.x, p.y, '#0ea5e9');
            } else {
                // Draw Explosion/X
                drawExplosion(p.x, p.y);
                // Remove packet shortly after
                if (p.progress > p.failAt + 0.2) {
                    packets.splice(i, 1);
                }
            }
        }
    }
}

function drawPacket(x, y, color, isAck = false) {
    ctx.beginPath();
    if (isAck) {
        // Small circle for ACK
        ctx.arc(x, y, 5, 0, Math.PI * 2);
    } else {
        // Small rectangle for Data
        ctx.rect(x - 8, y - 5, 16, 10);
    }
    ctx.fillStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0; // Reset
}

function drawExplosion(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.8)'; // Red
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ef4444';
    ctx.fill();
    
    // Draw X
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5);
    ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
}
