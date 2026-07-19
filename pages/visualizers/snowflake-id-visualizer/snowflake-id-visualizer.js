document.addEventListener('DOMContentLoaded', () => {
    const btnGenerate = document.getElementById('btn-generate');
    const inputDc = document.getElementById('input-datacenter');
    const inputWorker = document.getElementById('input-worker');
    
    const bitsContainer = document.getElementById('bits-container');
    const resDecimal = document.getElementById('res-decimal');
    const resHex = document.getElementById('res-hex');
    const resDate = document.getElementById('res-date');
    const idList = document.getElementById('id-list');

    // Custom Epoch (e.g., 2026-01-01)
    const EPOCH = 1767225600000n;
    
    let sequence = 0n;
    let lastTimestamp = -1n;

    const bitElements = [];

    // Initialize 64 bit elements
    for (let i = 0; i < 64; i++) {
        const bit = document.createElement('div');
        bit.className = 'bit';
        
        if (i === 0) bit.classList.add('b-sign');
        else if (i <= 41) bit.classList.add('b-time');
        else if (i <= 46) bit.classList.add('b-dc');
        else if (i <= 51) bit.classList.add('b-worker');
        else bit.classList.add('b-seq');
        
        bit.textContent = '0';
        bitsContainer.appendChild(bit);
        bitElements.push(bit);
    }

    function timeGen() {
        return BigInt(Date.now());
    }

    function updateBitsUI(binString) {
        // Pad to 64 bits
        const padded = binString.padStart(64, '0');
        for (let i = 0; i < 64; i++) {
            bitElements[i].textContent = padded[i];
            if (padded[i] === '1') {
                bitElements[i].classList.add('active');
            } else {
                bitElements[i].classList.remove('active');
            }
        }
    }

    function generateId() {
        let timestamp = timeGen();

        if (timestamp < lastTimestamp) {
            alert("Clock moved backwards. Refusing to generate id.");
            return;
        }

        if (timestamp === lastTimestamp) {
            sequence = (sequence + 1n) & 4095n; // 12 bits max
            if (sequence === 0n) {
                // Wait for next millisecond
                while (timestamp <= lastTimestamp) {
                    timestamp = timeGen();
                }
            }
        } else {
            sequence = 0n;
        }

        lastTimestamp = timestamp;

        const dcId = BigInt(inputDc.value) & 31n;
        const workerId = BigInt(inputWorker.value) & 31n;

        // Shift and OR to combine bits
        const id = ((timestamp - EPOCH) << 22n) |
                   (dcId << 17n) |
                   (workerId << 12n) |
                   sequence;

        // Update UI
        const binStr = id.toString(2);
        updateBitsUI(binStr);

        resDecimal.textContent = id.toString();
        resHex.textContent = '0x' + id.toString(16).toUpperCase();
        
        const actualDate = new Date(Number(timestamp));
        resDate.textContent = actualDate.toISOString();

        // Add to log
        const logEntry = document.createElement('div');
        logEntry.className = 'id-entry';
        logEntry.innerHTML = `
            <span>${id.toString()}</span>
            <span style="color: #64748b">Seq: ${sequence}</span>
        `;
        idList.prepend(logEntry);
        
        // limit log size
        if(idList.children.length > 20) {
            idList.removeChild(idList.lastChild);
        }
    }

    btnGenerate.addEventListener('click', generateId);
});
