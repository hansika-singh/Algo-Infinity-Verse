document.addEventListener('DOMContentLoaded', () => {
    const resolveBtn = document.getElementById('resolve-btn');
    const resetBtn = document.getElementById('reset-btn');
    const cacheToggle = document.getElementById('cache-toggle');
    const logsArea = document.getElementById('logs-area');
    const canvas = document.getElementById('network-canvas');

    let isAnimating = false;
    let cache = {};

    const nodes = {
        browser: document.getElementById('node-browser'),
        resolver: document.getElementById('node-resolver'),
        root: document.getElementById('node-root'),
        tld: document.getElementById('node-tld'),
        auth: document.getElementById('node-auth')
    };

    function logMessage(msg) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = `> ${msg}`;
        logsArea.appendChild(entry);
        logsArea.scrollTop = logsArea.scrollHeight;
    }

    function getCenter(el) {
        const rect = el.getBoundingClientRect();
        const parentRect = canvas.getBoundingClientRect();
        return {
            x: rect.left - parentRect.left + rect.width / 2,
            y: rect.top - parentRect.top + rect.height / 2
        };
    }

    function createPacket(startNode) {
        const packet = document.createElement('div');
        packet.className = 'packet';
        const start = getCenter(startNode);
        packet.style.left = `${start.x}px`;
        packet.style.top = `${start.y}px`;
        canvas.appendChild(packet);
        return packet;
    }

    function movePacket(packet, targetNode) {
        return new Promise(resolve => {
            const target = getCenter(targetNode);
            // Trigger reflow
            void packet.offsetWidth;
            packet.style.left = `${target.x}px`;
            packet.style.top = `${target.y}px`;
            
            setTimeout(() => {
                resolve();
            }, 1000); // 1s animation duration matches CSS
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
        resolveBtn.disabled = true;
        
        const domain = document.getElementById('domain-input').value;
        logMessage(`Starting resolution for ${domain}...`);

        // Step 1: Browser to Resolver
        setActive(nodes.browser, true);
        const packet = createPacket(nodes.browser);
        logMessage(`Browser asking Recursive Resolver for IP.`);
        await movePacket(packet, nodes.resolver);
        setActive(nodes.browser, false);
        setActive(nodes.resolver, true);

        // Check Cache
        if (cacheToggle.checked && cache[domain]) {
            await sleep(500);
            logMessage(`✅ Cache HIT in Resolver! IP: ${cache[domain]}`);
            await movePacket(packet, nodes.browser);
            packet.remove();
            setActive(nodes.resolver, false);
            logMessage(`Resolution complete. Time saved via caching!`);
            isAnimating = false;
            resolveBtn.disabled = false;
            return;
        }

        if (cacheToggle.checked) {
            logMessage(`❌ Cache MISS in Resolver. Performing recursive lookup.`);
        } else {
            logMessage(`Recursive lookup required.`);
        }
        await sleep(500);

        // Step 2: Resolver to Root
        logMessage(`Resolver queries Root Server (.) for Top-Level Domain info.`);
        await movePacket(packet, nodes.root);
        setActive(nodes.resolver, false);
        setActive(nodes.root, true);
        await sleep(500);
        logMessage(`Root Server replies: "I don't know, ask the .com TLD Server."`);
        await movePacket(packet, nodes.resolver);
        setActive(nodes.root, false);
        setActive(nodes.resolver, true);
        await sleep(500);

        // Step 3: Resolver to TLD
        logMessage(`Resolver queries TLD Server (.com) for authoritative server info.`);
        await movePacket(packet, nodes.tld);
        setActive(nodes.resolver, false);
        setActive(nodes.tld, true);
        await sleep(500);
        logMessage(`TLD Server replies: "Ask the Authoritative Server for algo-infinity.com."`);
        await movePacket(packet, nodes.resolver);
        setActive(nodes.tld, false);
        setActive(nodes.resolver, true);
        await sleep(500);

        // Step 4: Resolver to Auth
        logMessage(`Resolver queries Authoritative Name Server for exact IP record.`);
        await movePacket(packet, nodes.auth);
        setActive(nodes.resolver, false);
        setActive(nodes.auth, true);
        await sleep(500);
        const ip = "192.168.1.42"; // Mock IP
        logMessage(`Authoritative Server replies with A Record: ${ip}`);
        await movePacket(packet, nodes.resolver);
        setActive(nodes.auth, false);
        setActive(nodes.resolver, true);
        await sleep(500);

        // Step 5: Cache and return
        if (cacheToggle.checked) {
            cache[domain] = ip;
            logMessage(`Resolver caches the IP address (TTL applied).`);
        }
        
        logMessage(`Resolver returns IP ${ip} to Browser.`);
        await movePacket(packet, nodes.browser);
        packet.remove();
        setActive(nodes.resolver, false);
        setActive(nodes.browser, true);
        
        await sleep(500);
        setActive(nodes.browser, false);
        logMessage(`Resolution complete. Browser connects to ${ip}.`);
        
        isAnimating = false;
        resolveBtn.disabled = false;
    }

    resolveBtn.addEventListener('click', runSimulation);
    
    resetBtn.addEventListener('click', () => {
        if(isAnimating) return;
        logsArea.innerHTML = '';
        cache = {};
        document.querySelectorAll('.packet').forEach(p => p.remove());
        logMessage('Simulator reset. Cache cleared.');
    });
});
