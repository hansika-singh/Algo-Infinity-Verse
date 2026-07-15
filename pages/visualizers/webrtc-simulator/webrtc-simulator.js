document.addEventListener('DOMContentLoaded', () => {
    const btnConnect = document.getElementById('btn-connect');
    const btnReset = document.getElementById('btn-reset');
    const natToggle = document.getElementById('nat-toggle');
    const logsArea = document.getElementById('logs-area');
    const canvas = document.getElementById('network-canvas');
    const natA = document.getElementById('nat-a');
    const natB = document.getElementById('nat-b');
    
    const p2pLine = document.getElementById('p2p-line');
    const turnLine = document.getElementById('turn-line');

    let isAnimating = false;

    const nodes = {
        signaling: document.getElementById('node-signaling'),
        stun: document.getElementById('node-stun'),
        turn: document.getElementById('node-turn'),
        peerA: document.getElementById('node-peer-a'),
        peerB: document.getElementById('node-peer-b'),
    };

    function logMessage(msg, color = "#a6e22e") {
        const entry = document.createElement('div');
        entry.innerHTML = `<span style="color:${color}">></span> ${msg}`;
        entry.style.marginBottom = "4px";
        logsArea.appendChild(entry);
        logsArea.scrollTop = logsArea.scrollHeight;
    }

    natToggle.addEventListener('change', () => {
        if(natToggle.checked) {
            natA.classList.add('nat-strict');
            natB.classList.add('nat-strict');
            logMessage("Strict Symmetric NAT Enabled. Direct P2P will fail.", "#ef4444");
        } else {
            natA.classList.remove('nat-strict');
            natB.classList.remove('nat-strict');
            logMessage("Standard NAT. STUN hole-punching will succeed.");
        }
    });

    function getCenter(el) {
        const rect = el.getBoundingClientRect();
        const parentRect = canvas.getBoundingClientRect();
        return {
            x: rect.left - parentRect.left + rect.width / 2,
            y: rect.top - parentRect.top + rect.height / 2
        };
    }

    function createPacket(startNode, typeClass, text) {
        const packet = document.createElement('div');
        packet.className = `packet ${typeClass}`;
        packet.textContent = text;
        const start = getCenter(startNode);
        packet.style.left = `${start.x}px`;
        packet.style.top = `${start.y}px`;
        canvas.appendChild(packet);
        return packet;
    }

    function movePacket(packet, targetNode) {
        return new Promise(resolve => {
            const target = getCenter(targetNode);
            void packet.offsetWidth; // trigger reflow
            packet.style.left = `${target.x}px`;
            packet.style.top = `${target.y}px`;
            
            setTimeout(() => {
                resolve();
            }, 1000); // match CSS transition
        });
    }

    function setActive(node, active) {
        if (active) node.classList.add('active');
        else node.classList.remove('active');
    }

    async function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    async function runSimulation() {
        if (isAnimating) return;
        isAnimating = true;
        btnConnect.disabled = true;
        p2pLine.style.display = 'none';
        turnLine.style.display = 'none';
        logsArea.innerHTML = '';
        
        logMessage("Starting WebRTC Connection Sequence...", "#4facfe");

        // Step 1: SDP Offer
        setActive(nodes.peerA, true);
        const sdp1 = createPacket(nodes.peerA, 'packet-sdp', 'OFFER');
        logMessage("Peer A generates SDP Offer and sends to Signaling Server.");
        await movePacket(sdp1, nodes.signaling);
        setActive(nodes.peerA, false);
        setActive(nodes.signaling, true);
        await sleep(300);

        logMessage("Signaling Server relays Offer to Peer B.");
        await movePacket(sdp1, nodes.peerB);
        sdp1.remove();
        setActive(nodes.signaling, false);
        setActive(nodes.peerB, true);
        await sleep(500);

        // Step 2: SDP Answer
        const sdp2 = createPacket(nodes.peerB, 'packet-sdp', 'ANSWER');
        logMessage("Peer B accepts Offer, generates SDP Answer.");
        await movePacket(sdp2, nodes.signaling);
        setActive(nodes.peerB, false);
        setActive(nodes.signaling, true);
        await sleep(300);

        logMessage("Signaling Server relays Answer to Peer A.");
        await movePacket(sdp2, nodes.peerA);
        sdp2.remove();
        setActive(nodes.signaling, false);
        setActive(nodes.peerA, true);
        await sleep(500);

        // Step 3: ICE Candidate / STUN
        logMessage("Peers begin gathering ICE Candidates (Public IPs) via STUN.", "#ec4899");
        const ice1 = createPacket(nodes.peerA, 'packet-ice', 'STUN');
        const ice2 = createPacket(nodes.peerB, 'packet-ice', 'STUN');
        await Promise.all([
            movePacket(ice1, nodes.stun),
            movePacket(ice2, nodes.stun)
        ]);
        setActive(nodes.peerA, false);
        setActive(nodes.stun, true);
        await sleep(300);

        logMessage("STUN server returns public IPs to peers (UDP hole-punching).");
        ice1.textContent = 'IP A';
        ice2.textContent = 'IP B';
        await Promise.all([
            movePacket(ice1, nodes.peerA),
            movePacket(ice2, nodes.peerB)
        ]);
        ice1.remove(); ice2.remove();
        setActive(nodes.stun, false);
        await sleep(500);

        // Step 4: Attempt Direct Connection
        logMessage("Attempting Direct Peer-to-Peer connection...");
        const p2p = createPacket(nodes.peerA, 'packet-media', 'PING');
        
        if (natToggle.checked) {
            // Strict NAT fails
            // move half way and bounce
            p2p.style.left = '50%';
            await sleep(1000);
            p2p.style.backgroundColor = '#ef4444';
            p2p.textContent = 'DROP';
            logMessage("❌ Direct connection FAILED due to Strict Symmetric NAT.", "#ef4444");
            await movePacket(p2p, nodes.peerA);
            p2p.remove();
            
            await sleep(500);
            logMessage("Falling back to TURN Server Relay...", "#f59e0b");
            const turnPack = createPacket(nodes.peerA, 'packet-media', 'DATA');
            turnPack.style.backgroundColor = '#f59e0b';
            
            await movePacket(turnPack, nodes.turn);
            setActive(nodes.turn, true);
            await movePacket(turnPack, nodes.peerB);
            
            turnPack.remove();
            turnLine.style.display = 'block';
            logMessage("✅ Connection established via TURN Server. Media is relaying.", "#f59e0b");

        } else {
            // Success
            await movePacket(p2p, nodes.peerB);
            p2p.remove();
            p2pLine.style.display = 'block';
            logMessage("✅ Direct P2P connection established! Media is flowing.", "#10b981");
        }

        isAnimating = false;
        btnConnect.disabled = false;
    }

    btnConnect.addEventListener('click', runSimulation);

    btnReset.addEventListener('click', () => {
        if(isAnimating) return;
        document.querySelectorAll('.packet').forEach(p => p.remove());
        logsArea.innerHTML = '';
        p2pLine.style.display = 'none';
        turnLine.style.display = 'none';
        Object.values(nodes).forEach(n => n.classList.remove('active'));
    });
});
