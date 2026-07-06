/**
 * Fortune's Algorithm (Sweepline & Beachline) Architecture
 * Visualizes Voronoi Diagram construction using geometric parabola math.
 */

class Site {
    /**
     * Initializes a Voronoi site (seed point).
     * @param {number} x - The X coordinate.
     * @param {number} y - The Y coordinate.
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.id = Math.random().toString(36).substr(2, 9);
    }
}

// --- Engine State ---
let sites = [];
let sweeplineY = 0;
let isSweeping = false;
let animationId = null;

// Canvas Setup (Dual Layer)
const bgCanvas = document.getElementById('bg-canvas');
const fgCanvas = document.getElementById('fg-canvas');
const bgCtx = bgCanvas.getContext('2d', { alpha: false });
const fgCtx = fgCanvas.getContext('2d', { alpha: true });
let cw = 0, ch = 0;

/**
 * Sizes both canvases to fill the wrapper.
 */
function resizeCanvases() {
    const parent = fgCanvas.parentElement;
    const prevW = cw, prevH = ch;
    cw = parent.clientWidth;
    ch = parent.clientHeight;
    
    if (prevW && prevH) {
        const sx = cw / prevW, sy = ch / prevH;
        sites.forEach(s => { s.x *= sx; s.y *= sy; });
    }
    
    bgCanvas.width = cw; bgCanvas.height = ch;
    fgCanvas.width = cw; fgCanvas.height = ch;
    
    clearBackground();
    drawForeground();
}

/**
 * Wipes the background (Voronoi edges trail).
 */
function clearBackground() {
    bgCtx.fillStyle = '#0f172a';
    bgCtx.fillRect(0, 0, cw, ch);
}

/**
 * Calculates the Y coordinate of a parabola given a directrix and a focus.
 * Math: y = (L^2 - s_y^2 - (x - s_x)^2) / (2 * (L - s_y))
 * @param {number} x - The specific X pixel being evaluated.
 * @param {Site} site - The focus of the parabola.
 * @param {number} L - The directrix (Sweepline Y coordinate).
 * @returns {number} The Y coordinate of the parabola curve at X.
 */
function getParabolaY(x, site, L) {
    const dp = L - site.y;
    if (dp <= 0) return Infinity; // Site is below sweepline, no parabola yet
    
    // Prevent division by zero asymptote issues
    const safeDp = Math.max(dp, 0.1); 
    
    const a = L * L;
    const b = site.y * site.y;
    const c = (x - site.x) * (x - site.x);
    
    return (a - b - c) / (2 * safeDp);
}

/**
 * The core render loop. Animates the sweepline and calculates the beachline.
 */
function sweepLoop() {
    if (!isSweeping) return;

    sweeplineY += 2; // Sweep speed
    
    if (sweeplineY > ch + 200) {
        isSweeping = false;
        document.getElementById('btn-run').disabled = false;
        updateStatus(`Status: Sweep Complete | Voronoi Cells: ${sites.length}`);
        drawForeground();
        return;
    }

    drawForeground();
    updateTelemetry();
    animationId = requestAnimationFrame(sweepLoop);
}

/**
 * Draws the foreground elements: Sites, Sweepline, and the dynamic Beachline.
 * Also traces the Voronoi edges permanently onto the background canvas.
 */
function drawForeground() {
    fgCtx.clearRect(0, 0, cw, ch);

    // 1. Draw Sites
    fgCtx.fillStyle = '#38bdf8';
    sites.forEach(site => {
        fgCtx.beginPath();
        fgCtx.arc(site.x, site.y, 4, 0, Math.PI * 2);
        fgCtx.fill();
    });

    if (!isSweeping && sweeplineY === 0) return;

    // 2. Draw Sweepline
    fgCtx.strokeStyle = '#ef4444';
    fgCtx.lineWidth = 1.5;
    fgCtx.beginPath();
    fgCtx.moveTo(0, sweeplineY);
    fgCtx.lineTo(cw, sweeplineY);
    fgCtx.stroke();

    // 3. Render Beachline & Trace Breakpoints
    fgCtx.strokeStyle = '#10b981';
    fgCtx.lineWidth = 2;
    fgCtx.beginPath();

    let previousSiteId = null;
    let activeParabolas = new Set();

    for (let x = 0; x < cw; x++) {
        let maxY = -Infinity;
        let ownerSite = null;

        // Find which parabola dominates this X coordinate (highest Y on standard plane, lowest numerically on Canvas)
        for (let i = 0; i < sites.length; i++) {
            if (sites[i].y >= sweeplineY) continue; // Site not active yet

            const y = getParabolaY(x, sites[i], sweeplineY);
            if (y > maxY) {
                maxY = y;
                ownerSite = sites[i];
            }
        }

        if (ownerSite) {
            activeParabolas.add(ownerSite.id);
            
            // Draw Beachline curve
            if (x === 0 || previousSiteId !== ownerSite.id) {
                fgCtx.moveTo(x, maxY);
            } else {
                fgCtx.lineTo(x, maxY);
            }

            // Detect Breakpoint (Voronoi Edge Formation)
            if (previousSiteId !== null && previousSiteId !== ownerSite.id) {
                // Trace this intersection point onto the BACKGROUND canvas
                bgCtx.fillStyle = 'rgba(168, 85, 247, 0.8)'; // Purple edge color
                bgCtx.fillRect(x - 1, maxY - 1, 2, 2);
            }

            previousSiteId = ownerSite.id;
        }
    }
    
    fgCtx.stroke();

    // Telemetry update hook
    document.getElementById('metric-parabolas').innerText = activeParabolas.size;
}

/**
 * Updates UI telemetry elements.
 */
function updateTelemetry() {
    document.getElementById('metric-y').innerText = sweeplineY.toFixed(0);
}

/**
 * Helper to update the ARIA Live Region status text.
 * @param {string} msg - The status message.
 */
function updateStatus(msg) {
    document.querySelector('.status').innerText = msg;
}

// --- Storage Integration & Event Listeners ---
function syncStorage() {
    localStorage.setItem("voronoi_sites", JSON.stringify(sites));
}

function loadStorage() {
    const cached = localStorage.getItem("voronoi_sites");
    if (!cached) return;
    try {
        const parsed = JSON.parse(cached);
        sites = Array.isArray(parsed) ? parsed.map(c => new Site(c.x, c.y)) : [];
    } catch (e) {
        console.warn('Failed to parse cached sites, resetting.', e);
        sites = [];
        localStorage.removeItem("voronoi_sites");
    }
    updateStatus(`Status: Awaiting Sweep | Voronoi Cells: ${sites.length}`);
    drawForeground();
}

window.addEventListener('resize', resizeCanvases);

document.addEventListener("DOMContentLoaded", () => {
    resizeCanvases();
    loadStorage();

    fgCanvas.addEventListener('click', (e) => {
        if (isSweeping) return;
        const rect = fgCanvas.getBoundingClientRect();
        
        // Exact pixel coordinates relative to the canvas
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        sites.push(new Site(x, y));
        syncStorage();
        drawForeground();
        updateStatus(`Status: Awaiting Sweep | Voronoi Cells: ${sites.length}`);
    });

    document.getElementById("btn-random").addEventListener("click", () => {
        if (isSweeping) return;
        sites = [];
        
        const numSites = parseInt(Math.random() * 15 + 10, 10); // CodeRabbit Compliance: Radix 10
        for (let i = 0; i < numSites; i++) {
            const x = 50 + (Math.random() * (cw - 100));
            const y = 50 + (Math.random() * (ch - 100));
            sites.push(new Site(x, y));
        }
        
        syncStorage();
        drawForeground();
        updateStatus(`Status: Awaiting Sweep | Voronoi Cells: ${sites.length}`);
    });

    document.getElementById("btn-run").addEventListener("click", (e) => {
        if (sites.length < 2 || isSweeping) return;
        
        isSweeping = true;
        e.target.disabled = true;
        
        sweeplineY = 0;
        clearBackground(); // Wipe old edges before new sweep
        updateStatus(`Status: Sweeping...`);
        
        if (animationId) cancelAnimationFrame(animationId);
        sweepLoop();
    });

    document.getElementById("btn-clear").addEventListener("click", () => {
        if (animationId) cancelAnimationFrame(animationId);
        isSweeping = false;
        document.getElementById('btn-run').disabled = false;
        
        sites = [];
        sweeplineY = 0;
        
        syncStorage();
        clearBackground();
        drawForeground();
        updateTelemetry();
        updateStatus(`Status: Canvas Cleared`);
    });
});
