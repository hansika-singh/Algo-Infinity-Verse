// rsync-simulator.js

const BLOCK_SIZE = 4;
const REMOTE_STR = "The quick brown fox jumps over the lazy dog.";
const LOCAL_STR =  "The fast brown fox leaped over the lazy dog!";

const remoteBlocksEl = document.getElementById('remoteBlocks');
const remoteHashesEl = document.getElementById('remoteHashes');
const localStreamEl = document.getElementById('localStream');
const deltaStreamEl = document.getElementById('deltaStream');
const rollingChecksumEl = document.getElementById('rollingChecksum');

const fullBytesEl = document.getElementById('fullBytes');
const rsyncBytesEl = document.getElementById('rsyncBytes');
const savedBytesEl = document.getElementById('savedBytes');

let remoteBlocks = [];
let remoteHashes = [];
let localChars = [];
let windowPos = 0;
let isPlaying = false;
let syncInterval;

let rsyncBytesSent = 0;
let unmatchedBuffer = "";

// Simple rolling hash (Adler-32 inspired for simulation)
function adler32(str) {
    let a = 1, b = 0;
    for (let i = 0; i < str.length; i++) {
        a = (a + str.charCodeAt(i)) % 65521;
        b = (b + a) % 65521;
    }
    return (b << 16) | a;
}

function initData() {
    // 1. Chunk Remote File
    remoteBlocksEl.innerHTML = '';
    remoteHashesEl.innerHTML = '';
    remoteBlocks = [];
    remoteHashes = [];
    
    for (let i = 0; i < REMOTE_STR.length; i += BLOCK_SIZE) {
        const chunk = REMOTE_STR.substring(i, i + BLOCK_SIZE);
        const hash = adler32(chunk).toString(16).padStart(8, '0');
        
        remoteBlocks.push(chunk);
        remoteHashes.push({ chunk, hash });
        
        const bEl = document.createElement('div');
        bEl.className = 'block';
        bEl.textContent = chunk.replace(/ /g, '␣');
        remoteBlocksEl.appendChild(bEl);
        
        const hEl = document.createElement('div');
        hEl.className = 'hash-item';
        hEl.innerHTML = `<strong>B${i/BLOCK_SIZE}</strong>: ${hash}`;
        remoteHashesEl.appendChild(hEl);
    }
    
    // 2. Prepare Local File Stream
    localStreamEl.innerHTML = '';
    localChars = [];
    for (let i = 0; i < LOCAL_STR.length; i++) {
        const c = LOCAL_STR[i];
        const span = document.createElement('span');
        span.className = 'char-box';
        span.textContent = c === ' ' ? '␣' : c;
        localStreamEl.appendChild(span);
        localChars.push({ char: c, el: span });
    }
    
    // Create sliding window element
    const windowEl = document.createElement('div');
    windowEl.className = 'sliding-window';
    windowEl.id = 'slidingWindow';
    windowEl.style.width = (BLOCK_SIZE * 24) + 'px';
    localStreamEl.appendChild(windowEl);
    
    // 3. Reset State
    windowPos = 0;
    rsyncBytesSent = 0;
    unmatchedBuffer = "";
    deltaStreamEl.innerHTML = '';
    rollingChecksumEl.textContent = '--';
    
    fullBytesEl.textContent = LOCAL_STR.length + ' B';
    rsyncBytesEl.textContent = '0 B';
    savedBytesEl.textContent = '0%';
    
    updateWindowPosition();
}

function updateWindowPosition() {
    const win = document.getElementById('slidingWindow');
    if(win) {
        win.style.left = (windowPos * 24 + 8) + 'px'; // 8px padding
    }
    
    if (windowPos <= LOCAL_STR.length - BLOCK_SIZE) {
        const chunk = LOCAL_STR.substring(windowPos, windowPos + BLOCK_SIZE);
        rollingChecksumEl.textContent = adler32(chunk).toString(16).padStart(8, '0');
    } else if (windowPos < LOCAL_STR.length) {
        const chunk = LOCAL_STR.substring(windowPos);
        rollingChecksumEl.textContent = adler32(chunk).toString(16).padStart(8, '0');
    } else {
        rollingChecksumEl.textContent = 'Done';
    }
}

function processStep() {
    if (windowPos >= LOCAL_STR.length) {
        if (unmatchedBuffer.length > 0) {
            emitLiteral(unmatchedBuffer);
            unmatchedBuffer = "";
        }
        clearInterval(syncInterval);
        isPlaying = false;
        document.getElementById('btnStart').disabled = true;
        document.getElementById('btnPause').disabled = true;
        return;
    }
    
    let chunk = LOCAL_STR.substring(windowPos, windowPos + BLOCK_SIZE);
    
    if (chunk.length === BLOCK_SIZE) {
        const hash = adler32(chunk).toString(16).padStart(8, '0');
        const matchIndex = remoteHashes.findIndex(h => h.hash === hash && h.chunk === chunk); // strong check
        
        if (matchIndex !== -1) {
            // Found a match
            if (unmatchedBuffer.length > 0) {
                emitLiteral(unmatchedBuffer);
                unmatchedBuffer = "";
            }
            
            emitMatch(matchIndex, chunk);
            
            // Highlight chars
            for(let i=0; i<BLOCK_SIZE; i++) {
                localChars[windowPos+i].el.classList.add('matched');
            }
            
            windowPos += BLOCK_SIZE;
            updateWindowPosition();
            return;
        }
    }
    
    // No match, slide by 1
    unmatchedBuffer += LOCAL_STR[windowPos];
    localChars[windowPos].el.classList.add('diff');
    windowPos++;
    updateWindowPosition();
}

function emitLiteral(str) {
    const div = document.createElement('div');
    div.className = 'delta-entry literal';
    div.innerHTML = `<strong>LITERAL:</strong> "${str.replace(/ /g, '␣')}"`;
    deltaStreamEl.appendChild(div);
    deltaStreamEl.scrollTop = deltaStreamEl.scrollHeight;
    
    rsyncBytesSent += str.length;
    updateStats();
}

function emitMatch(blockIndex, str) {
    const div = document.createElement('div');
    div.className = 'delta-entry match';
    div.innerHTML = `<strong>MATCH B${blockIndex}:</strong> "${str.replace(/ /g, '␣')}"`;
    deltaStreamEl.appendChild(div);
    deltaStreamEl.scrollTop = deltaStreamEl.scrollHeight;
    
    rsyncBytesSent += 2; // Simulated size of a block reference (e.g. 2 bytes)
    updateStats();
}

function updateStats() {
    rsyncBytesEl.textContent = rsyncBytesSent + ' B';
    const total = LOCAL_STR.length;
    const saved = Math.max(0, total - rsyncBytesSent);
    const percent = Math.round((saved / total) * 100);
    savedBytesEl.textContent = percent + '%';
}

document.getElementById('btnStart').addEventListener('click', () => {
    isPlaying = true;
    document.getElementById('btnStart').disabled = true;
    document.getElementById('btnPause').disabled = false;
    syncInterval = setInterval(processStep, 300);
});

document.getElementById('btnPause').addEventListener('click', () => {
    isPlaying = false;
    document.getElementById('btnStart').disabled = false;
    document.getElementById('btnPause').disabled = true;
    clearInterval(syncInterval);
});

document.getElementById('btnReset').addEventListener('click', () => {
    clearInterval(syncInterval);
    isPlaying = false;
    document.getElementById('btnStart').disabled = false;
    document.getElementById('btnPause').disabled = true;
    initData();
});

initData();
