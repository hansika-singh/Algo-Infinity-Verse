/* bittorrent-simulator.js */
const UI = {
    btnAddLeecher: document.getElementById('btnAddLeecher'),
    btnAddSeeder: document.getElementById('btnAddSeeder'),
    btnKillSeeder: document.getElementById('btnKillSeeder'),
    chkRarestFirst: document.getElementById('chkRarestFirst'),
    chkTitForTat: document.getElementById('chkTitForTat'),
    statSeeders: document.getElementById('statSeeders'),
    statLeechers: document.getElementById('statLeechers'),
    statHealth: document.getElementById('statHealth'),
    logTerminal: document.getElementById('logTerminal'),
    canvas: document.getElementById('swarmCanvas')
};

const ctx = UI.canvas.getContext('2d');
let cw, ch;
function resize() {
    cw = UI.canvas.width = UI.canvas.parentElement.clientWidth;
    ch = UI.canvas.height = UI.canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resize);
resize();

function log(msg, type = '') {
    const div = document.createElement('div');
    div.className = `log-entry ${type ? 'log-' + type : ''}`;
    div.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
    UI.logTerminal.appendChild(div);
    UI.logTerminal.scrollTop = UI.logTerminal.scrollHeight;
}

const TOTAL_PIECES = 16;
let peerCounter = 1;
let peers = [];
let connections = []; // Data transfers

class Peer {
    constructor(isSeeder) {
        this.id = peerCounter++;
        this.isSeeder = isSeeder;
        this.pieces = new Array(TOTAL_PIECES).fill(isSeeder);
        
        // Physics
        this.x = Math.random() * (cw - 100) + 50;
        this.y = Math.random() * (ch - 100) + 50;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.radius = 20;
        
        // Tit-for-Tat
        this.uploadedBytes = 0;
        this.downloadedBytes = 0;
    }
    
    get completion() {
        return this.pieces.filter(p => p).length / TOTAL_PIECES;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x <= 20 || this.x >= cw - 20) this.vx *= -1;
        if (this.y <= 20 || this.y >= ch - 20) this.vy *= -1;
        
        if (!this.isSeeder && this.completion === 1) {
            this.isSeeder = true;
            log(`Peer ${this.id} finished downloading and became a Seeder!`, "success");
            updateStats();
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isSeeder ? '#3fb950' : '#0366d6';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '10px Fira Code';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`P${this.id}`, this.x, this.y);

        // Draw chunks grid above peer
        const gridW = 40;
        const gridH = 10;
        const startX = this.x - gridW / 2;
        const startY = this.y - this.radius - 15;
        
        for (let i = 0; i < TOTAL_PIECES; i++) {
            const px = startX + (i % 8) * 5;
            const py = startY + Math.floor(i / 8) * 5;
            ctx.fillStyle = this.pieces[i] ? '#3fb950' : '#30363d';
            ctx.fillRect(px, py, 4, 4);
        }
    }
}

class Transfer {
    constructor(from, to, pieceIndex) {
        this.from = from;
        this.to = to;
        this.pieceIndex = pieceIndex;
        this.progress = 0;
        this.choked = false;
    }
    
    update() {
        if (this.choked) return;
        this.progress += 0.02; // Speed
        if (this.progress >= 1) {
            this.to.pieces[this.pieceIndex] = true;
            this.from.uploadedBytes++;
            this.to.downloadedBytes++;
            return true; // Finished
        }
        return false;
    }
    
    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.from.x, this.from.y);
        ctx.lineTo(this.to.x, this.to.y);
        ctx.strokeStyle = this.choked ? '#d73a49' : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = this.choked ? 1 : 2;
        ctx.stroke();

        if (!this.choked) {
            const px = this.from.x + (this.to.x - this.from.x) * this.progress;
            const py = this.from.y + (this.to.y - this.from.y) * this.progress;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#3fb950';
            ctx.fill();
        }
    }
}

// Init Swarm
peers.push(new Peer(true)); // 1 Seeder
peers.push(new Peer(false));
peers.push(new Peer(false));
peers.push(new Peer(false));
updateStats();

function updateStats() {
    const seeders = peers.filter(p => p.isSeeder).length;
    const leechers = peers.filter(p => !p.isSeeder).length;
    
    // Calculate global piece availability (Health)
    let globalPieces = new Array(TOTAL_PIECES).fill(false);
    peers.forEach(p => {
        p.pieces.forEach((hasPiece, i) => { if (hasPiece) globalPieces[i] = true; });
    });
    const health = (globalPieces.filter(Boolean).length / TOTAL_PIECES) * 100;

    UI.statSeeders.innerText = seeders;
    UI.statLeechers.innerText = leechers;
    UI.statHealth.innerText = `${health.toFixed(0)}%`;
    UI.statHealth.style.color = health === 100 ? '#3fb950' : '#d73a49';
}

function processTransfers() {
    // 1. Clean finished/dead connections
    connections = connections.filter(c => !c.update());
    
    // 2. Choking Logic (Tit-for-Tat)
    if (UI.chkTitForTat.checked) {
        connections.forEach(c => {
            // If Peer A is uploading to Peer B, but Peer B has never uploaded to A, choke them (simplified)
            // In reality, it's based on active download rates
            if (Math.random() < 0.01) {
                c.choked = !c.choked;
                if (c.choked) log(`Tit-for-Tat: P${c.from.id} choked P${c.to.id} due to low ratio.`);
            }
        });
    } else {
        connections.forEach(c => c.choked = false);
    }

    // 3. New Requests (Rarest First)
    if (Math.random() < 0.2 && peers.length > 1) { // Throttle new requests
        const leecher = peers[Math.floor(Math.random() * peers.length)];
        if (leecher.isSeeder) return;

        // Find missing pieces
        const missing = leecher.pieces.map((has, i) => has ? -1 : i).filter(i => i !== -1);
        if (missing.length === 0) return;

        let targetPiece = missing[Math.floor(Math.random() * missing.length)];

        if (UI.chkRarestFirst.checked) {
            // Count frequency of missing pieces across swarm
            const frequencies = new Array(TOTAL_PIECES).fill(0);
            peers.forEach(p => {
                p.pieces.forEach((has, i) => { if(has) frequencies[i]++; });
            });
            
            // Find rarest missing piece
            let minFreq = Infinity;
            missing.forEach(i => {
                if (frequencies[i] < minFreq && frequencies[i] > 0) {
                    minFreq = frequencies[i];
                    targetPiece = i;
                }
            });
        }

        // Find a peer that has this piece
        const potentialSources = peers.filter(p => p.id !== leecher.id && p.pieces[targetPiece]);
        if (potentialSources.length > 0) {
            const source = potentialSources[Math.floor(Math.random() * potentialSources.length)];
            
            // Check if already downloading this piece
            const alreadyDownloading = connections.some(c => c.to.id === leecher.id && c.pieceIndex === targetPiece);
            if (!alreadyDownloading) {
                connections.push(new Transfer(source, leecher, targetPiece));
            }
        }
    }
}

function render() {
    ctx.clearRect(0, 0, cw, ch);
    
    connections.forEach(c => c.draw(ctx));
    peers.forEach(p => { p.update(); p.draw(ctx); });
    
    processTransfers();
    requestAnimationFrame(render);
}
render();

// Controls
UI.btnAddLeecher.addEventListener('click', () => {
    peers.push(new Peer(false));
    log("New Leecher joined the swarm.");
    updateStats();
});

UI.btnAddSeeder.addEventListener('click', () => {
    peers.push(new Peer(true));
    log("New Seeder joined the swarm.", "success");
    updateStats();
});

UI.btnKillSeeder.addEventListener('click', () => {
    const seederIdx = peers.findIndex(p => p.isSeeder);
    if (seederIdx !== -1) {
        log(`Killed Seeder P${peers[seederIdx].id}!`, "error");
        peers.splice(seederIdx, 1);
        
        // Kill connections involving this peer
        connections = connections.filter(c => c.from.id !== peers[seederIdx]?.id && c.to.id !== peers[seederIdx]?.id);
        
        updateStats();
        if (peers.filter(p => p.isSeeder).length === 0) {
            log("WARNING: Swarm has no full seeders! If health < 100%, some pieces are permanently lost.", "warn");
        }
    }
});

// Click to kill any peer
UI.canvas.addEventListener('click', (e) => {
    const rect = UI.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (let i = peers.length - 1; i >= 0; i--) {
        const p = peers[i];
        const dist = Math.hypot(p.x - mx, p.y - my);
        if (dist <= p.radius) {
            log(`User assassinated P${p.id}`, "error");
            peers.splice(i, 1);
            connections = connections.filter(c => c.from.id !== p.id && c.to.id !== p.id);
            updateStats();
            break;
        }
    }
});
