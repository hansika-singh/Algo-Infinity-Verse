document.addEventListener('DOMContentLoaded', () => {
    const btnSend = document.getElementById('btn-send');
    const jsInput = document.getElementById('js-input');
    const jsLogs = document.getElementById('js-logs');
    const wasmLogs = document.getElementById('wasm-logs');
    const memoryGrid = document.getElementById('memory-grid');

    const MEMORY_SIZE = 64; // 64 bytes for visualization
    const bytesElements = [];

    // Initialize Memory Grid
    for (let i = 0; i < MEMORY_SIZE; i++) {
        const byteEl = document.createElement('div');
        byteEl.className = 'memory-byte';
        byteEl.innerHTML = `
            <span class="address">${i}</span>
            <span class="value">00</span>
            <span class="char-value"></span>
        `;
        memoryGrid.appendChild(byteEl);
        bytesElements.push(byteEl);
    }

    function logJs(msg) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = `> ${msg}`;
        jsLogs.appendChild(entry);
        jsLogs.scrollTop = jsLogs.scrollHeight;
    }

    function logWasm(msg) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.style.color = '#6ee7b7';
        entry.textContent = `> ${msg}`;
        wasmLogs.appendChild(entry);
        wasmLogs.scrollTop = wasmLogs.scrollHeight;
    }

    async function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function resetMemory() {
        bytesElements.forEach(el => {
            el.className = 'memory-byte';
            el.querySelector('.value').textContent = '00';
            el.querySelector('.char-value').textContent = '';
        });
        jsLogs.innerHTML = '<div class="log-entry">> JS Context Ready.</div>';
        wasmLogs.innerHTML = '<div class="log-entry" style="color: #6ee7b7">> Wasm Instance Ready.</div>';
    }

    async function processMemoryTransfer() {
        btnSend.disabled = true;
        resetMemory();

        const str = jsInput.value || "Default";
        const encoder = new TextEncoder();
        const utf8Array = encoder.encode(str);
        
        const ptr = 8; // Simulate allocating at memory index 8
        const len = utf8Array.length;

        logJs(`Encoding string "${str}" to UTF-8...`);
        await sleep(600);
        logJs(`String length: ${len} bytes.`);
        await sleep(600);

        logJs(`Allocating memory at Pointer [${ptr}]...`);
        
        // JS copying to memory
        for (let i = 0; i < len; i++) {
            const index = ptr + i;
            if (index >= MEMORY_SIZE) break;

            const el = bytesElements[index];
            el.classList.add('allocating');
            
            const hex = utf8Array[i].toString(16).padStart(2, '0').toUpperCase();
            el.querySelector('.value').textContent = hex;
            el.querySelector('.char-value').textContent = String.fromCharCode(utf8Array[i]);

            await sleep(200);
            el.classList.remove('allocating');
            el.classList.add('allocated');
        }

        logJs(`Copy complete. Calling Wasm: processString(ptr: ${ptr}, len: ${len})`);
        await sleep(1000);

        // Wasm reading memory
        logWasm(`processString(${ptr}, ${len}) invoked.`);
        await sleep(600);
        
        let resultStr = "";
        for (let i = 0; i < len; i++) {
            const index = ptr + i;
            if (index >= MEMORY_SIZE) break;

            const el = bytesElements[index];
            el.classList.add('reading');
            
            logWasm(`Reading memory[${index}] -> 0x${el.querySelector('.value').textContent}`);
            resultStr += el.querySelector('.char-value').textContent;

            await sleep(300);
            el.classList.remove('reading');
        }

        logWasm(`Result string constructed: "${resultStr}"`);
        await sleep(500);
        logWasm(`Function execution complete.`);

        btnSend.disabled = false;
    }

    btnSend.addEventListener('click', processMemoryTransfer);
});
