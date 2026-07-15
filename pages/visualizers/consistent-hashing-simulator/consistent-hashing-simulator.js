document.addEventListener('DOMContentLoaded', () => {
    const addNodeBtn = document.getElementById('add-node-btn');
    const removeNodeBtn = document.getElementById('remove-node-btn');
    const routeKeyBtn = document.getElementById('route-key-btn');
    const keyInput = document.getElementById('key-input');
    const logsArea = document.getElementById('logs-area');
    const ringContainer = document.getElementById('ring-container');
    const statNodes = document.getElementById('stat-nodes');
    const statKeys = document.getElementById('stat-keys');

    const RING_RADIUS = 160;
    let nodes = [];
    let keys = [];
    let nextNodeId = 1;

    // Simple hash function for string to 0-359 angle
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0; 
        }
        return Math.abs(hash) % 360;
    }

    function logMessage(msg) {
        const entry = document.createElement('div');
        entry.textContent = `> ${msg}`;
        entry.style.marginBottom = "4px";
        logsArea.appendChild(entry);
        logsArea.scrollTop = logsArea.scrollHeight;
    }

    function getCoords(angle, radius = RING_RADIUS) {
        const rad = (angle - 90) * (Math.PI / 180);
        // Center is 200, 200 in the container
        return {
            x: 200 + radius * Math.cos(rad),
            y: 200 + radius * Math.sin(rad)
        };
    }

    function renderNode(node) {
        const coords = getCoords(node.angle);
        
        const el = document.createElement('div');
        el.className = 'server-node';
        el.id = `node-${node.id}`;
        el.style.left = `${coords.x}px`;
        el.style.top = `${coords.y}px`;
        
        el.innerHTML = `
            <i class="fa-solid fa-server"></i>
            <div class="node-label">Node ${node.id}</div>
        `;
        
        ringContainer.appendChild(el);
        node.el = el;
    }

    function renderKey(keyObj) {
        const coords = getCoords(keyObj.angle, RING_RADIUS - 30);
        
        const el = document.createElement('div');
        el.className = 'data-key';
        el.style.left = `${coords.x}px`;
        el.style.top = `${coords.y}px`;
        
        el.innerHTML = `
            <div class="key-label">${keyObj.key}</div>
        `;
        
        ringContainer.appendChild(el);
        keyObj.el = el;
        
        // Find target node and animate towards it
        const target = findTargetNode(keyObj.angle);
        if (target) {
            logMessage(`Key '${keyObj.key}' mapped to Node ${target.id}`);
            setTimeout(() => {
                const targetCoords = getCoords(target.angle, RING_RADIUS);
                el.style.left = `${targetCoords.x}px`;
                el.style.top = `${targetCoords.y}px`;
            }, 50);
        }
    }

    function findTargetNode(keyAngle) {
        if (nodes.length === 0) return null;
        
        // Find first node with angle >= keyAngle
        let sortedNodes = [...nodes].sort((a, b) => a.angle - b.angle);
        for (let node of sortedNodes) {
            if (node.angle >= keyAngle) return node;
        }
        // Wraparound
        return sortedNodes[0];
    }

    function updateStats() {
        statNodes.textContent = nodes.length;
        statKeys.textContent = keys.length;
    }

    function rebalanceKeys() {
        if (nodes.length === 0) {
            keys.forEach(k => k.el.style.display = 'none');
            return;
        }
        
        keys.forEach(keyObj => {
            keyObj.el.style.display = 'flex';
            const target = findTargetNode(keyObj.angle);
            const targetCoords = getCoords(target.angle, RING_RADIUS);
            keyObj.el.style.left = `${targetCoords.x}px`;
            keyObj.el.style.top = `${targetCoords.y}px`;
        });
    }

    addNodeBtn.addEventListener('click', () => {
        const id = nextNodeId++;
        const angle = Math.floor(Math.random() * 360);
        const node = { id, angle };
        nodes.push(node);
        renderNode(node);
        logMessage(`Added Node ${id} at angle ${angle}°`);
        rebalanceKeys();
        updateStats();
    });

    removeNodeBtn.addEventListener('click', () => {
        if (nodes.length === 0) return;
        const node = nodes.pop();
        node.el.remove();
        logMessage(`Removed Node ${node.id}. Rebalancing keys...`);
        rebalanceKeys();
        updateStats();
    });

    routeKeyBtn.addEventListener('click', () => {
        if (nodes.length === 0) {
            alert("Add at least one node first!");
            return;
        }
        const key = keyInput.value.trim() || `data_${Math.floor(Math.random()*1000)}`;
        const angle = simpleHash(key);
        
        const keyObj = { key, angle };
        keys.push(keyObj);
        logMessage(`Hashing '${key}' -> Angle ${angle}°`);
        renderKey(keyObj);
        updateStats();
        keyInput.value = '';
    });

    // Init with 3 nodes
    for(let i=0; i<3; i++) {
        addNodeBtn.click();
    }
});
