/**
 * consistent-hashing-visualizer.js
 * Visualizes Consistent Hashing on a Hash Ring using the HTML5 Canvas API.
 * Demonstrates node distribution, data (key) migration, and Virtual Nodes.
 */

document.addEventListener("DOMContentLoaded", () => {
    initDHTVisualizer();
});

// ==========================================
// 1. ENGINE STATE & CONFIG
// ==========================================
const CONFIG = {
    RING_RADIUS_RATIO: 0.35, // Relative to canvas min(width, height)
    VNODES_PER_SERVER: 5,
    COLORS: ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#eab308', '#6366f1']
};

let state = {
    servers: [], // { id, name, color, hashes: [] }
    keys: [],    // { id, angle, currentServerId, targetServerId, color, radiusOffset, isMigrating, ... }
    useVNodes: false,
    serverCounter: 1,
    chartInstance: null,
    animationReq: null,
    hoveredServer: null,
    selectedServer: null,
    activeRoutingKeys: [] // { id, angle, startAngle, currentAngle, targetAngle, targetServerId, color, speed }
};

let serverRipples = []; // { serverId, radius, maxRadius, alpha, speed }

const els = {
    canvas: document.getElementById('dhtCanvas'),
    wrapper: document.getElementById('canvasWrapper'),
    tooltip: document.getElementById('canvasTooltip'),
    
    btnAddServer: document.getElementById('btnAddServer'),
    btnKillServer: document.getElementById('btnKillServer'),
    btnGenerateKeys: document.getElementById('btnGenerateKeys'),
    btnReset: document.getElementById('btnReset'),
    vNodeToggle: document.getElementById('vNodeToggle'),
    
    txtKeyInput: document.getElementById('txtKeyInput'),
    btnRouteKey: document.getElementById('btnRouteKey'),
    selKillServer: document.getElementById('selKillServer'),
    btnKillSpecificServer: document.getElementById('btnKillSpecificServer'),
    
    stdDevValue: document.getElementById('stdDevValue'),
    keyCountDisplay: document.getElementById('keyCountDisplay'),
    logContainer: document.getElementById('logContainer')
};

let ctx;

// ==========================================
// 2. INITIALIZATION & UTILITIES
// ==========================================
function initDHTVisualizer() {
    ctx = els.canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    initChart();
    bindEvents();
    
    // Setup Initial Cluster (3 Servers)
    addServer();
    addServer();
    addServer();
    
    populateServerSelect();
    startRenderLoop();
}

function resizeCanvas() {
    const rect = els.wrapper.getBoundingClientRect();
    els.canvas.width = rect.width * window.devicePixelRatio;
    els.canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    els.canvas.style.width = `${rect.width}px`;
    els.canvas.style.height = `${rect.height}px`;
}

function logMsg(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = `> ${msg}`;
    els.logContainer.appendChild(div);
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

function triggerServerRipple(serverId) {
    serverRipples.push({
        serverId: serverId,
        radius: 5,
        maxRadius: 35,
        alpha: 1.0,
        speed: 1.5
    });
}

function hexToRgb(hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        parseInt(result[1], 16) + "," + parseInt(result[2], 16) + "," + parseInt(result[3], 16)
        : "6, 182, 212";
}

function populateServerSelect() {
    if (!els.selKillServer) return;
    els.selKillServer.innerHTML = '';
    state.servers.forEach(server => {
        const opt = document.createElement('option');
        opt.value = server.id;
        opt.textContent = server.name;
        els.selKillServer.appendChild(opt);
    });
    
    if (state.selectedServer && state.servers.find(s => s.id === state.selectedServer)) {
        els.selKillServer.value = state.selectedServer;
    } else if (state.servers.length > 0) {
        state.selectedServer = state.servers[0].id;
        els.selKillServer.value = state.servers[0].id;
    } else {
        state.selectedServer = null;
    }
}

function stGetRing() {
    let ring = [];
    state.servers.forEach(server => {
        server.hashes.forEach(angle => {
            ring.push({ angle, serverId: server.id, color: server.color, name: server.name });
        });
    });
    ring.sort((a, b) => a.angle - b.angle);
    return ring;
}

function findNearestServerNode(angle) {
    const ring = stGetRing();
    if (ring.length === 0) return null;
    let target = ring.find(node => node.angle >= angle);
    if (!target) target = ring[0];
    return target;
}

function handleRouteCustomKey() {
    if (!els.txtKeyInput) return;
    const text = els.txtKeyInput.value.trim();
    if (!text) return;
    
    if (state.servers.length === 0) {
        alert("Build/Add servers first!");
        return;
    }
    
    const angle = hashStringToAngle(text);
    const target = findNearestServerNode(angle);
    if (!target) return;
    
    state.activeRoutingKeys = state.activeRoutingKeys || [];
    if (state.activeRoutingKeys.some(k => k.id === text)) {
        return;
    }
    
    state.activeRoutingKeys.push({
        id: text,
        angle: angle,
        startAngle: angle,
        currentAngle: angle,
        targetAngle: target.angle,
        targetServerId: target.serverId,
        color: '#a855f7',
        progress: 0,
        speed: 3,
        radiusOffset: 0
    });
    
    els.txtKeyInput.value = '';
    logMsg(`Routing Key "${text}" clockwise on the ring (hash angle: ${angle.toFixed(1)}°)...`, "sys");
}

function bindEvents() {
    els.btnAddServer.addEventListener('click', () => {
        addServer();
        recalculateKeys();
    });
    
    els.btnKillServer.addEventListener('click', () => {
        if (state.servers.length <= 1) return alert("Cannot kill the last server.");
        const idx = Math.floor(Math.random() * state.servers.length);
        const serverToKill = state.servers[idx];
        removeServer(serverToKill.id);
    });

    els.btnGenerateKeys.addEventListener('click', () => {
        generateKeys(1000);
        recalculateKeys();
    });

    els.btnReset.addEventListener('click', () => {
        state.servers = [];
        state.keys = [];
        state.serverCounter = 1;
        state.selectedServer = null;
        state.activeRoutingKeys = [];
        serverRipples = [];
        els.logContainer.innerHTML = '';
        updateChart();
        addServer(); addServer(); addServer();
        populateServerSelect();
        logMsg("Cluster reset to 3 nodes.", "sys");
    });

    els.vNodeToggle.addEventListener('change', (e) => {
        state.useVNodes = e.target.checked;
        logMsg(state.useVNodes ? "Virtual Nodes ENABLED." : "Virtual Nodes DISABLED.", "vnode");
        
        state.servers.forEach(s => generateServerHashes(s));
        recalculateKeys();
        populateServerSelect();
    });

    // Canvas click interaction for selection
    els.canvas.addEventListener('click', (e) => {
        const rect = els.canvas.getBoundingClientRect();
        const scaleX = els.canvas.width / rect.width;
        const scaleY = els.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        let clicked = null;
        state.servers.forEach(server => {
            if (!server.renderX || !server.renderY) return;
            const dist = Math.hypot(server.renderX - mouseX, server.renderY - mouseY);
            if (dist < 20 * window.devicePixelRatio) {
                clicked = server;
            }
        });
        
        if (clicked) {
            state.selectedServer = clicked.id;
            if (els.selKillServer) els.selKillServer.value = clicked.id;
            logMsg(`Selected server: ${clicked.name}`, "sys");
        }
    });

    if (els.btnRouteKey) {
        els.btnRouteKey.addEventListener('click', handleRouteCustomKey);
    }
    if (els.txtKeyInput) {
        els.txtKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleRouteCustomKey();
            }
        });
    }

    if (els.btnKillSpecificServer) {
        els.btnKillSpecificServer.addEventListener('click', () => {
            const targetId = els.selKillServer ? els.selKillServer.value : null;
            if (!targetId) return;
            if (state.servers.length <= 1) return alert("Cannot kill the last server.");
            removeServer(targetId);
        });
    }

    // Canvas Hover Interaction (Tooltips)
    els.canvas.addEventListener('mousemove', handleCanvasMouseMove);
    els.canvas.addEventListener('mouseout', () => {
        els.tooltip.classList.add('hidden');
        state.hoveredServer = null;
    });
}

// ==========================================
// 3. CORE HASH RING LOGIC
// ==========================================

function hashStringToAngle(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) % 360;
}

function generateServerHashes(server) {
    server.hashes = [];
    const count = state.useVNodes ? CONFIG.VNODES_PER_SERVER : 1;
    for (let i = 0; i < count; i++) {
        const hashStr = `${server.id}-replica-${i}`;
        server.hashes.push(hashStringToAngle(hashStr));
    }
    server.hashes.sort((a, b) => a - b);
}

function addServer() {
    const id = `S${state.serverCounter++}`;
    const color = CONFIG.COLORS[state.servers.length % CONFIG.COLORS.length];
    
    const server = { id, name: `Node ${id}`, color, hashes: [] };
    generateServerHashes(server);
    state.servers.push(server);
    
    logMsg(`Added ${server.name} to the ring.`, 'add');
    populateServerSelect();
    if(state.keys.length > 0) recalculateKeys();
    else updateChart();
}

function removeServer(id) {
    const s = state.servers.find(s => s.id === id);
    if (!s) return;
    
    state.servers = state.servers.filter(server => server.id !== id);
    logMsg(`Killed ${s.name}. Keys are migrating to neighbors...`, 'kill');
    populateServerSelect();
    recalculateKeys();
}

function generateKeys(count) {
    for (let i = 0; i < count; i++) {
        const id = `K-${Date.now()}-${Math.random()}`;
        const angle = hashStringToAngle(id);
        
        state.keys.push({
            id: id,
            angle: angle,
            currentServerId: null,
            targetServerId: null,
            color: '#475569',
            radiusOffset: (Math.random() - 0.5) * 40,
            isMigrating: false
        });
    }
    els.keyCountDisplay.textContent = state.keys.length;
    logMsg(`Generated ${count} data keys.`, 'sys');
}

function recalculateKeys() {
    if (state.servers.length === 0 || state.keys.length === 0) return;

    let ring = stGetRing();

    state.keys.forEach(key => {
        let target = ring.find(node => node.angle >= key.angle);
        if (!target) target = ring[0];
        
        if (key.currentServerId === null) {
            key.currentServerId = target.serverId;
            key.color = target.color;
            key.targetServerId = target.serverId;
            key.isMigrating = false;
        } else if (key.currentServerId !== target.serverId) {
            key.isMigrating = true;
            key.migrationStartAngle = key.angle;
            key.migrationCurrentAngle = key.angle;
            key.migrationTargetAngle = target.angle;
            key.targetServerId = target.serverId;
            key.targetColor = target.color;
            key.migrationSpeed = 2 + Math.random() * 2;
        } else {
            key.targetServerId = target.serverId;
        }
    });

    updateChart();
}

// ==========================================
// 4. CHART.JS & TELEMETRY
// ==========================================
function initChart() {
    const canvas = document.getElementById('distributionChart');
    state.chartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'Keys per Server', data: [], backgroundColor: [] }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#cbd5e1', font: { family: 'Fira Code' } } }
            },
            plugins: { legend: { display: false } },
            animation: { duration: 500 }
        }
    });
}

function updateChart() {
    if (!state.chartInstance) return;

    const distribution = {};
    state.servers.forEach(s => distribution[s.id] = 0);
    state.keys.forEach(k => {
        const dest = k.isMigrating ? k.targetServerId : k.currentServerId;
        if (distribution[dest] !== undefined) {
            distribution[dest]++;
        }
    });

    const labels = [];
    const data = [];
    const bgColors = [];

    state.servers.forEach(s => {
        labels.push(s.name);
        data.push(distribution[s.id] || 0);
        bgColors.push(s.color);
    });

    state.chartInstance.data.labels = labels;
    state.chartInstance.data.datasets[0].data = data;
    state.chartInstance.data.datasets[0].backgroundColor = bgColors;
    state.chartInstance.update();

    if (data.length > 0) {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
        const stdDev = Math.sqrt(variance);
        els.stdDevValue.textContent = stdDev.toFixed(2);
        
        if(stdDev > 150) els.stdDevValue.style.color = '#ef4444';
        else if (stdDev > 50) els.stdDevValue.style.color = '#f59e0b';
        else els.stdDevValue.style.color = '#10b981';
    } else {
        els.stdDevValue.textContent = "0.00";
    }
}

// ==========================================
// 5. CANVAS RENDER LOOP & DRAWING
// ==========================================
function startRenderLoop() {
    function loop() {
        render();
        state.animationReq = requestAnimationFrame(loop);
    }
    loop();
}

function render() {
    const w = els.canvas.clientWidth;
    const h = els.canvas.clientHeight;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * CONFIG.RING_RADIUS_RATIO;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Base Ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 2. Draw Keys (Permanent + Migrating)
    state.keys.forEach(key => {
        let drawAngle = key.angle;
        let drawColor = key.color;
        
        if (key.isMigrating) {
            key.migrationCurrentAngle += key.migrationSpeed;
            const totalDist = (key.migrationTargetAngle - key.migrationStartAngle + 360) % 360;
            const distTraveled = (key.migrationCurrentAngle - key.migrationStartAngle + 360) % 360;
            
            if (distTraveled >= (totalDist === 0 ? 360 : totalDist)) {
                key.isMigrating = false;
                key.currentServerId = key.targetServerId;
                key.color = key.targetColor;
                drawColor = key.targetColor;
                triggerServerRipple(key.targetServerId);
                updateChart();
            } else {
                drawAngle = key.migrationCurrentAngle;
                drawColor = '#ef4444'; // Red-orange to represent migration rehash warning
            }
        }

        const rad = (drawAngle - 90) * (Math.PI / 180);
        const r = radius + key.radiusOffset;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);

        ctx.beginPath();
        ctx.arc(x, y, key.isMigrating ? 3.5 : 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = drawColor;
        
        if (state.hoveredServer && key.currentServerId === state.hoveredServer) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = key.color;
            ctx.fillStyle = '#fff';
        } else if (key.isMigrating) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ef4444';
        } else {
            ctx.shadowBlur = 0;
        }
        
        ctx.fill();
    });
    ctx.shadowBlur = 0;

    // 3. Update and Draw Active Custom Routing Keys
    state.activeRoutingKeys = (state.activeRoutingKeys || []).filter(key => {
        key.currentAngle += key.speed;
        if (key.currentAngle >= 360) {
            key.currentAngle -= 360;
        }
        
        const totalDist = (key.targetAngle - key.startAngle + 360) % 360;
        const distTraveled = (key.currentAngle - key.startAngle + 360) % 360;
        const arrived = distTraveled >= (totalDist === 0 ? 360 : totalDist);
        
        if (arrived) {
            const targetServer = state.servers.find(s => s.id === key.targetServerId);
            const color = targetServer ? targetServer.color : '#06b6d4';
            
            const existingIdx = state.keys.findIndex(k => k.id === key.id);
            const keyObj = {
                id: key.id,
                angle: key.startAngle,
                currentServerId: key.targetServerId,
                targetServerId: key.targetServerId,
                color: color,
                radiusOffset: (Math.random() - 0.5) * 40,
                isMigrating: false
            };
            
            if (existingIdx !== -1) {
                state.keys[existingIdx] = keyObj;
            } else {
                state.keys.push(keyObj);
            }
            
            els.keyCountDisplay.textContent = state.keys.length;
            triggerServerRipple(key.targetServerId);
            logMsg(`Custom Key "${key.id}" routed to ${targetServer ? targetServer.name : key.targetServerId} (hash angle: ${key.startAngle.toFixed(1)}° -> server hash angle: ${key.targetAngle.toFixed(1)}°)`, "sys");
            updateChart();
            return false;
        }
        
        const currentRad = (key.currentAngle - 90) * (Math.PI / 180);
        const px = cx + radius * Math.cos(currentRad);
        const py = cy + radius * Math.sin(currentRad);
        
        const startRad = (key.startAngle - 90) * (Math.PI / 180);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startRad, currentRad, false);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
        
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#a855f7';
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#a855f7';
        ctx.fill();
        ctx.restore();
        
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(key.id, px, py - 12);
        
        return true;
    });

    // 4. Draw Server Ripples
    serverRipples.forEach((ripple, idx) => {
        const server = state.servers.find(s => s.id === ripple.serverId);
        if (!server || !server.hashes || server.hashes.length === 0) {
            serverRipples.splice(idx, 1);
            return;
        }
        
        server.hashes.forEach(angle => {
            const rad = (angle - 90) * (Math.PI / 180);
            const x = cx + radius * Math.cos(rad);
            const y = cy + radius * Math.sin(rad);
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, ripple.radius, 0, 2 * Math.PI);
            ctx.strokeStyle = `rgba(${hexToRgb(server.color)}, ${ripple.alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        });
        
        ripple.radius += ripple.speed;
        ripple.alpha -= 0.04;
        if (ripple.alpha <= 0) {
            serverRipples.splice(idx, 1);
        }
    });

    // 5. Draw Server Circles
    state.servers.forEach(server => {
        server.hashes.forEach((angle, idx) => {
            const rad = (angle - 90) * (Math.PI / 180);
            const x = cx + radius * Math.cos(rad);
            const y = cy + radius * Math.sin(rad);
            
            const isPhysical = (idx === 0);
            const isHovered = (server.id === state.hoveredServer);
            const isSelected = (server.id === state.selectedServer);
            
            ctx.beginPath();
            if (isPhysical && !state.useVNodes) {
                ctx.arc(x, y, 10, 0, 2 * Math.PI);
                ctx.fillStyle = '#020617';
                ctx.fill();
                ctx.lineWidth = isSelected ? 5 : (isHovered ? 4 : 2);
                ctx.strokeStyle = isSelected ? '#fff' : server.color;
                ctx.shadowBlur = isSelected ? 25 : (isHovered ? 20 : 10);
                ctx.shadowColor = server.color;
                ctx.stroke();
            } else {
                ctx.arc(x, y, isPhysical ? 8 : 5, 0, 2 * Math.PI);
                ctx.fillStyle = isPhysical ? server.color : '#020617';
                ctx.fill();
                ctx.lineWidth = isSelected ? 3 : 2;
                ctx.strokeStyle = isSelected ? '#fff' : server.color;
                ctx.shadowBlur = isSelected ? 20 : (isHovered ? 15 : 5);
                ctx.shadowColor = server.color;
                ctx.stroke();
            }
            
            if (isPhysical) {
                server.renderX = x;
                server.renderY = y;
            }
        });
    });
    ctx.shadowBlur = 0;
}

// Canvas Mouse Interaction for Tooltips
function handleCanvasMouseMove(e) {
    const rect = els.canvas.getBoundingClientRect();
    const scaleX = els.canvas.width / rect.width;
    const scaleY = els.canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    let hovered = null;
    
    state.servers.forEach(server => {
        if (!server.renderX || !server.renderY) return;
        const dist = Math.hypot(server.renderX - mouseX, server.renderY - mouseY);
        if (dist < 20 * window.devicePixelRatio) {
            hovered = server;
        }
    });
    
    if (hovered) {
        state.hoveredServer = hovered.id;
        const keyCount = state.keys.filter(k => (k.isMigrating ? k.targetServerId : k.currentServerId) === hovered.id).length;
        els.tooltip.textContent = `${hovered.name} (${keyCount} Keys)`;
        els.tooltip.style.left = `${e.clientX - rect.left}px`;
        els.tooltip.style.top = `${e.clientY - rect.top - 15}px`;
        els.tooltip.classList.remove('hidden');
        els.canvas.style.cursor = 'pointer';
    } else {
        state.hoveredServer = null;
        els.tooltip.classList.add('hidden');
        els.canvas.style.cursor = 'default';
    }
}
