/**
 * Algo-Infinity-Verse | LZ77 Sliding Window Compression Visualizer
 * Simulates Dictionary Encoding with Search & Lookahead Buffers using Generator mechanics.
 */

class LZ77Visualizer {
    constructor() {
        // UI Inputs
        this.inputString = document.getElementById('input-string');
        this.btnInit = document.getElementById('btn-initialize');
        this.btnPlay = document.getElementById('btn-play');
        this.btnStep = document.getElementById('btn-step');
        this.btnReset = document.getElementById('btn-reset');
        this.speedSlider = document.getElementById('speed-slider');
        this.statusText = document.getElementById('status-text');
        
        // Telemetry
        this.valOrig = document.getElementById('val-original');
        this.valComp = document.getElementById('val-compressed');
        this.ratioBar = document.getElementById('ratio-bar');
        this.ratioText = document.getElementById('ratio-text');

        // Containers
        this.charRow = document.getElementById('char-row');
        this.svgLayer = document.getElementById('match-svg');
        this.winSearch = document.getElementById('window-search');
        this.winLookahead = document.getElementById('window-lookahead');
        this.tokenContainer = document.getElementById('token-container');
        this.trackContainer = document.getElementById('memory-track');

        // Engine State
        this.text = "";
        this.charCells = [];
        this.searchSize = 10;
        this.lookaheadSize = 6;
        
        // Stats
        this.originalBytes = 0;
        this.compressedBytes = 0; // Each token = 3 bytes
        
        this.generator = null;
        this.isPlaying = false;
        this.animSpeed = 1.0;
        this.autoPlayTimeout = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeEngine();
        
        // Handle resize to fix SVG if needed
        window.addEventListener('resize', () => {
            // Re-render SVG curve if window resizes during a match pause
            this.svgLayer.innerHTML = ''; 
        });
    }

    bindEvents() {
        this.btnInit.addEventListener('click', () => this.initializeEngine());
        this.btnReset.addEventListener('click', () => this.initializeEngine());
        
        this.btnPlay.addEventListener('click', () => {
            if (this.isPlaying) this.pauseAutoPlay();
            else this.startAutoPlay();
        });
        
        this.btnStep.addEventListener('click', () => {
            this.pauseAutoPlay();
            this.stepForward();
        });
        
        this.speedSlider.addEventListener('input', (e) => {
            this.animSpeed = parseFloat(e.target.value);
            document.getElementById('speed-val').textContent = `${this.animSpeed.toFixed(1)}x`;
        });
    }

    /* --- Data Initialization --- */

    initializeEngine() {
        let raw = this.inputString.value.toLowerCase().replace(/[^a-z0-9 ]/g, '');
        if (!raw) raw = "abracadabra";
        this.text = raw;
        this.inputString.value = raw;
        
        this.originalBytes = this.text.length;
        this.compressedBytes = 0;
        
        this.buildDOMString();
        this.resetUI();
        
        this.generator = this.lz77Algorithm();
        this.btnStep.disabled = false;
        this.btnPlay.disabled = false;
        this.updateStatus('Data loaded. Ready to compress.', '');
    }

    buildDOMString() {
        this.charRow.innerHTML = '';
        this.charCells = [];
        
        for (let i = 0; i < this.text.length; i++) {
            const cell = document.createElement('div');
            cell.className = 'char-cell';
            // Use non-breaking space for visibility
            cell.textContent = this.text[i] === ' ' ? '\u00A0' : this.text[i]; 
            this.charRow.appendChild(cell);
            this.charCells.push(cell);
        }
        
        // Ensure SVG matches exact track width
        setTimeout(() => {
            this.svgLayer.style.width = `${this.charRow.scrollWidth}px`;
        }, 50);
    }

    resetUI() {
        this.svgLayer.innerHTML = '';
        this.tokenContainer.innerHTML = '<span class="empty-stream">No tokens emitted yet...</span>';
        this.winSearch.style.width = '0px';
        this.winSearch.style.left = '0px';
        this.winLookahead.style.width = '0px';
        this.winLookahead.style.left = '0px';
        this.updateTelemetry();
    }

    /* --- LZ77 Algorithm Generator --- */

    *lz77Algorithm() {
        let cursor = 0;
        
        while (cursor < this.text.length) {
            // 1. Define Window Boundaries
            let searchStart = Math.max(0, cursor - this.searchSize);
            let searchEnd = cursor;
            
            // Lookahead needs at least 1 char for the 'next_symbol', so match length can't exceed remaining - 1
            let remaining = this.text.length - cursor;
            let currentLookaheadSize = Math.min(this.lookaheadSize, remaining);
            let matchLimit = currentLookaheadSize - 1; 

            // Edge case: End of string, force match limit to 0 so we just emit the final char natively
            if (remaining === 1) matchLimit = 0;

            yield {
                type: 'scan',
                msg: `Scanning windows... Cursor at index ${cursor}`,
                cursor, searchStart, searchEnd, currentLookaheadSize
            };

            // 2. Find Longest Match
            let bestLen = 0;
            let bestDist = 0;
            
            if (matchLimit > 0) {
                // Iterate distances from 1 up to search buffer size
                for (let dist = 1; dist <= (cursor - searchStart); dist++) {
                    let len = 0;
                    // Note: LZ77 allows overlapping into the lookahead buffer!
                    while (len < matchLimit && this.text[cursor - dist + len] === this.text[cursor + len]) {
                        len++;
                    }
                    if (len > bestLen) {
                        bestLen = len;
                        bestDist = dist;
                    }
                }
            }

            // 3. Highlight Match
            if (bestLen > 0) {
                yield {
                    type: 'match',
                    msg: `Pattern found! Distance: ${bestDist}, Length: ${bestLen}`,
                    cursor, matchStart: cursor - bestDist, bestLen, bestDist
                };
            } else {
                yield {
                    type: 'nomatch',
                    msg: `No pattern found in search buffer.`,
                    cursor
                };
            }

            // 4. Emit Token
            let nextChar = this.text[cursor + bestLen];
            let token = { d: bestDist, l: bestLen, c: nextChar };
            
            this.compressedBytes += 3; // 3 bytes per token
            
            yield {
                type: 'token',
                msg: `Emitting Token <${token.d}, ${token.l}, '${token.c === ' ' ? 'SPC' : token.c}'>`,
                token, cursor, bestLen
            };

            // Advance cursor
            cursor += bestLen + 1;
        }

        yield { type: 'done', msg: 'Compression Complete!' };
    }

    /* --- Visual Frame Applier --- */

    stepForward() {
        if (!this.generator) return;
        const { value, done } = this.generator.next();
        
        if (done) {
            this.pauseAutoPlay();
            this.btnStep.disabled = true;
            this.btnPlay.disabled = true;
            if(value) this.updateStatus(value.msg);
            return;
        }
        this.applyState(value);
    }

    applyState(state) {
        this.updateStatus(state.msg);

        // Clear transient styles
        this.svgLayer.innerHTML = '';
        this.charCells.forEach(c => {
            c.classList.remove('char-matched', 'char-cursor');
        });

        if (state.type === 'scan') {
            this.updateWindows(state.searchStart, state.searchEnd, state.cursor, state.currentLookaheadSize);
            this.charCells[state.cursor].classList.add('char-cursor');
            this.autoScrollTrack(state.cursor);
        }

        if (state.type === 'match') {
            // Highlight cells
            for (let i = 0; i < state.bestLen; i++) {
                this.charCells[state.matchStart + i].classList.add('char-matched');
                this.charCells[state.cursor + i].classList.add('char-matched');
            }
            this.drawSvgCurve(state.matchStart, state.cursor, state.bestLen);
        }

        if (state.type === 'token') {
            this.appendToken(state.token);
            this.updateTelemetry();
        }
    }

    updateWindows(sStart, sEnd, cursor, lSize) {
        // Calculate physical positions based on cell offsets
        if (sEnd > sStart) {
            const startCell = this.charCells[sStart];
            const endCell = this.charCells[sEnd - 1]; // up to cursor-1
            this.winSearch.style.left = `${startCell.offsetLeft}px`;
            this.winSearch.style.width = `${(endCell.offsetLeft + endCell.offsetWidth) - startCell.offsetLeft}px`;
        } else {
            this.winSearch.style.width = '0px';
        }

        if (lSize > 0 && cursor < this.charCells.length) {
            const lStartCell = this.charCells[cursor];
            const lEndCell = this.charCells[cursor + lSize - 1];
            this.winLookahead.style.left = `${lStartCell.offsetLeft}px`;
            this.winLookahead.style.width = `${(lEndCell.offsetLeft + lEndCell.offsetWidth) - lStartCell.offsetLeft}px`;
        } else {
            this.winLookahead.style.width = '0px';
        }
    }

    drawSvgCurve(sourceIdx, targetIdx, length) {
        // Draw Bezier curve from source start to target start
        const cellS = this.charCells[sourceIdx];
        const cellT = this.charCells[targetIdx];
        
        // Calculate width of the match to draw a bounding bracket-like curve
        const matchWidth = (this.charCells[sourceIdx + length - 1].offsetLeft + this.charCells[sourceIdx + length - 1].offsetWidth) - cellS.offsetLeft;
        
        const startX = cellS.offsetLeft + (matchWidth / 2);
        const endX = cellT.offsetLeft + (matchWidth / 2);
        // Curve goes up above the cells (top of window is offset by track padding)
        const startY = cellS.offsetTop - 5; 
        const endY = cellT.offsetTop - 5;
        
        const controlY = startY - 60; // Peak of the arc

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${startX},${startY} Q ${(startX+endX)/2},${controlY} ${endX},${endY}`;
        
        path.setAttribute('d', d);
        path.setAttribute('class', 'match-path');
        
        this.svgLayer.appendChild(path);
    }

    appendToken(token) {
        const empty = this.tokenContainer.querySelector('.empty-stream');
        if (empty) empty.remove();

        const tDiv = document.createElement('div');
        tDiv.className = 'lz-token';
        
        const displayChar = token.c === ' ' ? '␣' : token.c;
        
        tDiv.innerHTML = `
            &lt;<span class="token-d">${token.d}</span>, 
            <span class="token-l">${token.l}</span>, 
            <span class="token-c">'${displayChar}'</span>&gt;
        `;
        this.tokenContainer.appendChild(tDiv);
        this.tokenContainer.scrollLeft = this.tokenContainer.scrollWidth;
    }

    updateTelemetry() {
        this.valOrig.textContent = this.originalBytes;
        this.valComp.textContent = this.compressedBytes;
        
        let ratio = 100;
        if (this.originalBytes > 0 && this.compressedBytes > 0) {
            ratio = Math.round((this.compressedBytes / this.originalBytes) * 100);
        }
        
        // Cap visual bar at 100% even if data expands (negative compression)
        const visualRatio = Math.min(100, ratio);
        this.ratioBar.style.width = `${visualRatio}%`;
        
        if (ratio < 100) {
            this.ratioBar.style.background = 'var(--accent-emerald)';
            this.ratioBar.style.boxShadow = '0 0 8px var(--accent-emerald)';
            this.ratioText.textContent = `Ratio: ${ratio}% (Compression Successful!)`;
        } else {
            this.ratioBar.style.background = 'var(--danger)';
            this.ratioBar.style.boxShadow = '0 0 8px var(--danger)';
            this.ratioText.textContent = `Ratio: ${ratio}% (Data Expanded!)`;
        }
    }

    updateStatus(msg) {
        this.statusText.textContent = msg;
    }

    autoScrollTrack(cursorIdx) {
        const cell = this.charCells[cursorIdx];
        if (!cell) return;
        
        const trackLeft = this.trackContainer.scrollLeft;
        const trackWidth = this.trackContainer.clientWidth;
        const cellLeft = cell.offsetLeft;
        
        // Keep cursor roughly in the middle of the view
        if (cellLeft > trackLeft + (trackWidth * 0.7) || cellLeft < trackLeft) {
            this.trackContainer.scrollTo({
                left: cellLeft - (trackWidth * 0.3),
                behavior: 'smooth'
            });
        }
    }

    /* --- Auto Play Mechanics --- */

    startAutoPlay() {
        this.isPlaying = true;
        this.btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        this.btnPlay.classList.replace('btn-primary', 'btn-accent');
        
        const tick = () => {
            if (!this.isPlaying) return;
            this.stepForward();
            if (this.btnStep.disabled) {
                this.pauseAutoPlay();
                return;
            }
            const delay = Math.max(150, 1200 / this.animSpeed);
            this.autoPlayTimeout = setTimeout(tick, delay);
        };
        tick();
    }

    pauseAutoPlay() {
        this.isPlaying = false;
        clearTimeout(this.autoPlayTimeout);
        this.btnPlay.innerHTML = '<i class="fa-solid fa-play"></i> Auto Play';
        this.btnPlay.classList.replace('btn-accent', 'btn-primary');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LZ77Visualizer();
});
