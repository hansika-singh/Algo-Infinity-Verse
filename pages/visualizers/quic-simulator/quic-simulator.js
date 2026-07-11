/* quic-simulator.js */
const UI = {
    btnRunTcpHandshake: document.getElementById('btnRunTcpHandshake'),
    btnRunQuicHandshake: document.getElementById('btnRunQuicHandshake'),
    btnDropPacket: document.getElementById('btnDropPacket'),
    btnStartTransfer: document.getElementById('btnStartTransfer'),
    btnSwitchNetwork: document.getElementById('btnSwitchNetwork'),
    tcpTime: document.getElementById('tcpTime'),
    quicTime: document.getElementById('quicTime'),
    tcpStatus: document.querySelector('.tcp-status'),
    quicStatus: document.querySelector('.quic-status'),
    logTerminal: document.getElementById('logTerminal'),
    tcpCanvas: document.getElementById('tcpCanvas'),
    quicCanvas: document.getElementById('quicCanvas')
};

function log(msg, type = '') {
    const div = document.createElement('div');
    div.className = `log-entry ${type ? 'log-' + type : ''}`;
    div.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
    UI.logTerminal.appendChild(div);
    UI.logTerminal.scrollTop = UI.logTerminal.scrollHeight;
}

// Canvas Setup
let tcpCtx = UI.tcpCanvas.getContext('2d');
let quicCtx = UI.quicCanvas.getContext('2d');

function resizeCanvas() {
    [UI.tcpCanvas, UI.quicCanvas].forEach(canvas => {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    });
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Packet Animation Engine
class Packet {
    constructor(isTcp, x, y, targetX, color, label, speed, onComplete) {
        this.isTcp = isTcp;
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.color = color;
        this.label = label;
        this.speed = speed;
        this.onComplete = onComplete;
        this.radius = 12;
        this.dropped = false;
        this.dead = false;
    }
    
    update() {
        if (this.dead) return;
        if (this.dropped) {
            this.y += 2; // Fall down if dropped
            this.color = '#f85149';
            if (this.y > 200) this.dead = true;
            return;
        }

        const dir = Math.sign(this.targetX - this.x);
        this.x += dir * this.speed;

        if ((dir > 0 && this.x >= this.targetX) || (dir < 0 && this.x <= this.targetX)) {
            this.x = this.targetX;
            this.dead = true;
            if (this.onComplete) this.onComplete();
        }
    }

    draw(ctx) {
        if (this.dead && !this.dropped) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '10px Fira Code';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, this.x, this.y - 20);
    }
}

let packets = [];

function animate() {
    tcpCtx.clearRect(0, 0, UI.tcpCanvas.width, UI.tcpCanvas.height);
    quicCtx.clearRect(0, 0, UI.quicCanvas.width, UI.quicCanvas.height);

    packets.forEach(p => {
        p.update();
        p.draw(p.isTcp ? tcpCtx : quicCtx);
    });

    packets = packets.filter(p => !p.dead || p.dropped && p.y < 200);
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

function sendPacket(isTcp, fromClient, color, label, delay, onComplete) {
    setTimeout(() => {
        const canvas = isTcp ? UI.tcpCanvas : UI.quicCanvas;
        const startX = fromClient ? 20 : canvas.width - 20;
        const endX = fromClient ? canvas.width - 20 : 20;
        const y = canvas.height / 2;
        const speed = canvas.width / 60; // Approx 1 second
        
        const p = new Packet(isTcp, startX, y, endX, color, label, speed, onComplete);
        packets.push(p);
    }, delay);
}

// Handshake Logic
UI.btnRunTcpHandshake.addEventListener('click', () => {
    log("Starting TCP + TLS 1.3 Handshake (3-RTT for initial connection)", "warn");
    UI.tcpTime.innerText = "0ms";
    let time = 0;
    
    // SYN
    sendPacket(true, true, '#8b949e', 'SYN', 0, () => {
        time += 50; UI.tcpTime.innerText = `${time}ms`;
        // SYN-ACK
        sendPacket(true, false, '#8b949e', 'SYN-ACK', 0, () => {
            time += 50; UI.tcpTime.innerText = `${time}ms`;
            // ACK + ClientHello (TLS)
            sendPacket(true, true, '#d29922', 'ACK+ClientHello', 0, () => {
                time += 50; UI.tcpTime.innerText = `${time}ms`;
                // ServerHello
                sendPacket(true, false, '#d29922', 'ServerHello', 0, () => {
                    time += 50; UI.tcpTime.innerText = `${time}ms`;
                    // Finished
                    sendPacket(true, true, '#3fb950', 'Finished+Data', 0, () => {
                        time += 50; UI.tcpTime.innerText = `${time}ms`;
                        UI.tcpStatus.innerText = "Connected";
                        UI.tcpStatus.classList.add("connected");
                        log("TCP+TLS Handshake complete. Total: 3 RTT (approx 250ms).", "success");
                    });
                });
            });
        });
    });
});

UI.btnRunQuicHandshake.addEventListener('click', () => {
    log("Starting QUIC 0-RTT Handshake (Returning Client)", "success");
    UI.quicTime.innerText = "0ms";
    let time = 0;
    
    // 0-RTT: Send ClientHello AND Data immediately
    sendPacket(false, true, '#3fb950', 'ClientHello+Data', 0, () => {
        time += 50; UI.quicTime.innerText = `${time}ms`;
        // ServerHello + Data Ack
        sendPacket(false, false, '#3fb950', 'ServerHello+Ack', 0, () => {
            time += 50; UI.quicTime.innerText = `${time}ms`;
            UI.quicStatus.innerText = "Connected";
            UI.quicStatus.classList.add("connected");
            log("QUIC Handshake complete. Total: 1 RTT (approx 100ms) with 0-RTT data sent!", "success");
        });
    });
});

// Multiplexing & Drops
let isTransferring = false;
UI.btnStartTransfer.addEventListener('click', () => {
    if (isTransferring) return;
    isTransferring = true;
    log("Starting multiplexed file transfer (Streams 1, 2, 3)...");

    // TCP Sends packets sequentially
    sendPacket(true, true, '#0366d6', 'Stream 1', 100);
    sendPacket(true, true, '#d29922', 'Stream 2', 600);
    sendPacket(true, true, '#3fb950', 'Stream 3', 1100, () => { isTransferring = false; });

    // QUIC Sends packets independently
    sendPacket(false, true, '#0366d6', 'Stream 1', 100);
    sendPacket(false, true, '#d29922', 'Stream 2', 600);
    sendPacket(false, true, '#3fb950', 'Stream 3', 1100);
});

UI.btnDropPacket.addEventListener('click', () => {
    log("Injecting network loss...", "error");
    // Find a TCP packet to drop
    const tcpP = packets.find(p => p.isTcp && !p.dropped);
    if (tcpP) {
        tcpP.dropped = true;
        log("TCP Packet dropped! Head-of-Line blocking occurs. Subsequent streams are stalled until timeout and retransmission.", "error");
        
        // Pause all other TCP packets (HoL Blocking)
        packets.filter(p => p.isTcp && !p.dropped).forEach(p => p.speed = 0);
        
        setTimeout(() => {
            log("TCP Timeout. Retransmitting...", "warn");
            packets.filter(p => p.isTcp && p.speed === 0).forEach(p => p.speed = UI.tcpCanvas.width/60);
        }, 3000);
    }

    // Find a QUIC packet to drop
    const quicP = packets.find(p => !p.isTcp && !p.dropped);
    if (quicP) {
        quicP.dropped = true;
        log("QUIC Packet dropped. ONLY that stream is blocked. Other streams continue unhindered!", "success");
        // QUIC does NOT pause other streams!
    }
});

// Connection Migration
UI.btnSwitchNetwork.addEventListener('click', () => {
    log("Client switched from Wi-Fi to Cellular (IP Changed).", "warn");
    document.querySelectorAll('.ip-address').forEach(el => el.innerText = "10.0.0.99");
    
    if (UI.tcpStatus.innerText === "Connected") {
        UI.tcpStatus.innerText = "Disconnected";
        UI.tcpStatus.classList.remove("connected");
        log("TCP Connection LOST! Socket bound to old IP tuple. Must re-handshake.", "error");
    }
    
    if (UI.quicStatus.innerText === "Connected") {
        log("QUIC Connection MAINTAINED! Connection ID used instead of IP.", "success");
    }
});
