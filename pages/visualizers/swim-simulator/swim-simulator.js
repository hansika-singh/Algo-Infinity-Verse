// swim-simulator.js

const canvas = document.getElementById('swimCanvas');
const ctx = canvas.getContext('2d');
const logContainer = document.getElementById('simLog');

let width, height;
let nodes = [];
let messages = []; // Animated messages
let simInterval;
let animFrame;
let isPlaying = false;
let globalTime = 0;

// Protocol Constants
const PERIOD_MS = 2000;
const SUSPECT_TIMEOUT = 3; // Protocol periods before suspect -> dead
const PING_REQ_K = 2; // Number of indirect probes

function getColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#1a1a1a' : '#ffffff',
        text: isDark ? '#ffffff' : '#333333',
        nodeBorder: isDark ? '#666666' : '#cccccc',
        alive: isDark ? '#81c784' : '#4CAF50',
        suspect: isDark ? '#ffd54f' : '#FFC107',
        dead: isDark ? '#e57373' : '#F44336',
        msgPing: isDark ? '#64b5f6' : '#2196F3',
        msgAck: isDark ? '#81c784' : '#4CAF50',
        msgPingReq: isDark ? '#ba68c8' : '#9C27B0'
    };
}

function log(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString([], {hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit'});
    el.textContent = `[${time}] ${msg}`;
    logContainer.appendChild(el);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function initCluster() {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
    
    nodes = [];
    messages = [];
    const n = 8;
    const radius = Math.min(width, height) * 0.35;
    const cx = width / 2;
    const cy = height / 2;
    
    for(let i=0; i<n; i++) {
        const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
        nodes.push({
            id: i,
            name: `Node ${i}`,
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
            status: 'alive', // alive, suspect, dead, offline
            incarnation: 0,
            suspectTimer: 0,
            // Node's local membership list
            members: Array.from({length: n}, (_, k) => ({ id: k, status: 'alive', inc: 0 }))
        });
    }
    
    logContainer.innerHTML = '';
    log('Cluster initialized. All nodes alive.');
    
    if(animFrame) cancelAnimationFrame(animFrame);
    renderLoop();
}

function getRandomPeer(sourceId) {
    const alive = nodes.filter(n => n.id !== sourceId && n.status !== 'offline');
    if(alive.length === 0) return null;
    return alive[Math.floor(Math.random() * alive.length)];
}

function sendMsg(sourceId, targetId, type, data = null, callback = null) {
    const s = nodes.find(n => n.id === sourceId);
    const t = nodes.find(n => n.id === targetId);
    if(!s || !t) return;
    
    messages.push({
        sourceId, targetId, type, data,
        x: s.x, y: s.y,
        tx: t.x, ty: t.y,
        progress: 0,
        speed: 0.02, // 50 frames
        callback
    });
}

function processProtocolPeriod() {
    globalTime++;
    
    // Each ALIVE node picks a random peer to ping
    nodes.filter(n => n.status === 'alive').forEach(source => {
        const target = getRandomPeer(source.id);
        if(!target) return;
        
        log(`${source.name} PINGs ${target.name}`, 'ping');
        
        // Send Ping
        sendMsg(source.id, target.id, 'ping', null, () => {
            if(target.status === 'offline') {
                // Timeout! Initiate indirect probes
                log(`${source.name} direct PING to ${target.name} TIMEOUT`, 'suspect');
                initiateIndirectProbes(source, target);
            } else {
                // Target is alive, send ACK
                sendMsg(target.id, source.id, 'ack');
            }
        });
    });
    
    // Process Suspect Timers
    nodes.forEach(n => {
        if(n.status === 'suspect') {
            n.suspectTimer++;
            if(n.suspectTimer >= SUSPECT_TIMEOUT) {
                n.status = 'dead';
                log(`${n.name} declared DEAD (Suspect timeout)`, 'dead');
                // Gossip dead state
            }
        }
    });
}

function initiateIndirectProbes(source, suspect) {
    // Pick K random peers excluding suspect and source
    const peers = nodes.filter(n => n.id !== source.id && n.id !== suspect.id && n.status === 'alive');
    // Shuffle and pick
    const kPeers = peers.sort(() => 0.5 - Math.random()).slice(0, PING_REQ_K);
    
    if(kPeers.length === 0) {
        markSuspect(suspect);
        return;
    }
    
    let acksReceived = 0;
    let reqsCompleted = 0;
    
    kPeers.forEach(peer => {
        log(`${source.name} sends PING-REQ to ${peer.name} for ${suspect.name}`, 'ping-req');
        sendMsg(source.id, peer.id, 'ping-req', { suspectId: suspect.id }, () => {
            // Peer sends ping to suspect
            sendMsg(peer.id, suspect.id, 'ping', null, () => {
                if(suspect.status === 'offline') {
                    // Indirect ping failed
                    reqsCompleted++;
                    if(reqsCompleted === kPeers.length && acksReceived === 0) {
                        markSuspect(suspect);
                    }
                } else {
                    // Indirect ping succeeded
                    sendMsg(suspect.id, peer.id, 'ack', null, () => {
                        sendMsg(peer.id, source.id, 'ack');
                        acksReceived++;
                    });
                }
            });
        });
    });
}

function markSuspect(target) {
    if(target.status === 'offline' && target.status !== 'dead') {
        target.status = 'suspect';
        target.suspectTimer = 0;
        log(`${target.name} marked SUSPECT (Gossiping to cluster)`, 'suspect');
    }
}

function renderLoop() {
    const c = getColors();
    ctx.clearRect(0, 0, width, height);
    
    // Draw links between all nodes faintly
    ctx.strokeStyle = c.nodeBorder;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.2;
    nodes.forEach((n1, i) => {
        nodes.slice(i+1).forEach(n2 => {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
        });
    });
    ctx.globalAlpha = 1.0;
    
    // Update and draw messages
    for(let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        m.progress += m.speed;
        
        const cx = m.x + (m.tx - m.x) * m.progress;
        const cy = m.y + (m.ty - m.y) * m.progress;
        
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, 2*Math.PI);
        if(m.type === 'ping') ctx.fillStyle = c.msgPing;
        if(m.type === 'ack') ctx.fillStyle = c.msgAck;
        if(m.type === 'ping-req') ctx.fillStyle = c.msgPingReq;
        ctx.fill();
        
        if(m.progress >= 1) {
            if(m.callback) m.callback();
            messages.splice(i, 1);
        }
    }
    
    // Draw nodes
    nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 25, 0, 2*Math.PI);
        
        if(node.status === 'alive') ctx.fillStyle = c.alive;
        else if(node.status === 'suspect') ctx.fillStyle = c.suspect;
        else if(node.status === 'dead') ctx.fillStyle = c.dead;
        else if(node.status === 'offline') {
            ctx.fillStyle = c.nodeBorder;
            // Draw cross
        }
        
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = c.bg;
        ctx.stroke();
        
        if(node.status === 'offline') {
            ctx.beginPath();
            ctx.moveTo(node.x - 15, node.y - 15);
            ctx.lineTo(node.x + 15, node.y + 15);
            ctx.moveTo(node.x + 15, node.y - 15);
            ctx.lineTo(node.x - 15, node.y + 15);
            ctx.strokeStyle = '#F44336';
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        ctx.fillStyle = c.text;
        ctx.font = '12px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y - 35);
    });
    
    animFrame = requestAnimationFrame(renderLoop);
}

// Interaction
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    nodes.forEach(node => {
        const dist = Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2));
        if (dist < 25) {
            if(node.status === 'alive') {
                node.status = 'offline';
                log(`${node.name} CRASHED!`, 'dead');
            } else if(node.status === 'offline' || node.status === 'dead') {
                node.status = 'alive';
                node.incarnation++;
                log(`${node.name} RECOVERED. Incarnation: ${node.incarnation}`, 'info');
            }
        }
    });
});

document.getElementById('btnPlay').addEventListener('click', () => {
    isPlaying = true;
    document.getElementById('btnPlay').disabled = true;
    document.getElementById('btnPause').disabled = false;
    processProtocolPeriod();
    simInterval = setInterval(processProtocolPeriod, PERIOD_MS);
});

document.getElementById('btnPause').addEventListener('click', () => {
    isPlaying = false;
    document.getElementById('btnPlay').disabled = false;
    document.getElementById('btnPause').disabled = true;
    clearInterval(simInterval);
});

document.getElementById('btnReset').addEventListener('click', () => {
    clearInterval(simInterval);
    isPlaying = false;
    document.getElementById('btnPlay').disabled = false;
    document.getElementById('btnPause').disabled = true;
    initCluster();
});

window.addEventListener('resize', () => {
    const oldW = width, oldH = height;
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
    nodes.forEach(n => {
        n.x = (n.x / oldW) * width;
        n.y = (n.y / oldH) * height;
    });
});

initCluster();
