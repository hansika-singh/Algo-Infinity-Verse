document.addEventListener('DOMContentLoaded', () => {
    const btnSend = document.getElementById('btn-send-requests');
    const btnReset = document.getElementById('btn-reset');
    
    const http1QueueEl = document.getElementById('http1-queue');
    const http2QueueEl = document.getElementById('http2-queue');

    const TOTAL_REQUESTS = 12;
    let isRunning = false;

    // HTTP/1.1 State
    let http1Queue = [];
    let http1Active = [false, false, false, false, false, false];

    // HTTP/2 State
    let http2Queue = [];

    function renderQueues() {
        http1QueueEl.innerHTML = '';
        http1Queue.forEach(id => {
            const div = document.createElement('div');
            div.className = 'queue-item';
            div.textContent = id;
            http1QueueEl.appendChild(div);
        });

        http2QueueEl.innerHTML = '';
        http2Queue.forEach(id => {
            const div = document.createElement('div');
            div.className = 'queue-item';
            div.textContent = id;
            http2QueueEl.appendChild(div);
        });
    }

    function createPacket(id, isHttp2) {
        const p = document.createElement('div');
        p.className = `packet ${isHttp2 ? 'packet-http2' : 'packet-http1'}`;
        p.textContent = id;
        p.style.left = '0%';
        return p;
    }

    function processHttp1() {
        if (!isRunning) return;
        
        for (let i = 0; i < 6; i++) {
            if (!http1Active[i] && http1Queue.length > 0) {
                const reqId = http1Queue.shift();
                http1Active[i] = true;
                renderQueues();

                const track = document.getElementById(`http1-track-${i+1}`);
                const packet = createPacket(reqId, false);
                track.appendChild(packet);

                // Animate to right
                setTimeout(() => {
                    packet.style.left = '100%';
                }, 50);

                // Wait for arrival (2s animation)
                setTimeout(() => {
                    packet.remove();
                    http1Active[i] = false;
                    processHttp1(); // trigger next
                }, 2050);
            }
        }
    }

    function processHttp2() {
        if (!isRunning) return;
        if (http2Queue.length === 0) return;

        const track = document.getElementById('http2-track');
        
        // HTTP/2 sends ALL remaining immediately via multiplexing
        const toSend = [...http2Queue];
        http2Queue = [];
        renderQueues();

        toSend.forEach((reqId, index) => {
            const packet = createPacket(reqId, true);
            // Stagger them slightly vertically or horizontally to show multiplexing
            packet.style.top = `${30 + (index % 3)*15}%`;
            track.appendChild(packet);

            setTimeout(() => {
                packet.style.left = '100%';
            }, 50 + (index * 100)); // Slight stagger for visual effect

            setTimeout(() => {
                packet.remove();
            }, 2050 + (index * 100));
        });
    }

    btnSend.addEventListener('click', () => {
        if (isRunning) return;
        isRunning = true;
        btnSend.disabled = true;

        for (let i = 1; i <= TOTAL_REQUESTS; i++) {
            http1Queue.push(i);
            http2Queue.push(i);
        }
        renderQueues();

        processHttp1();
        processHttp2();
        
        // Unlock after all are theoretically done
        setTimeout(() => {
            isRunning = false;
            btnSend.disabled = false;
        }, 5000); // 12 reqs on 6 lines = 2 batches = ~4.5s
    });

    btnReset.addEventListener('click', () => {
        isRunning = false;
        btnSend.disabled = false;
        http1Queue = [];
        http2Queue = [];
        http1Active = [false, false, false, false, false, false];
        renderQueues();
        document.querySelectorAll('.packet').forEach(p => p.remove());
    });
});
