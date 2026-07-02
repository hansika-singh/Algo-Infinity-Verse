/**
 * spatial-visualizer.js
 * Implements a dynamic Quadtree for 2D spatial partitioning and a Z-order curve (Geohash simulation).
 * Demonstrates O(log N) radial proximity searching vs O(N) brute force.
 */

document.addEventListener("DOMContentLoaded", () => {
    initSpatialVisualizer();
});

// ==========================================
// 1. GEOMETRY UTILITIES
// ==========================================
class Point {
    constructor(x, y, data) {
        this.x = x;
        this.y = y;
        this.data = data; // { isStatic, dx, dy, color }
    }
}

class Rectangle {
    constructor(x, y, w, h) {
        this.x = x; // Center x
        this.y = y; // Center y
        this.w = w; // Half width
        this.h = h; // Half height
    }

    contains(point) {
        return (point.x >= this.x - this.w &&
                point.x <= this.x + this.w &&
                point.y >= this.y - this.h &&
                point.y <= this.y + this.h);
    }

    intersects(range) {
        return !(range.x - range.w > this.x + this.w ||
                 range.x + range.w < this.x - this.w ||
                 range.y - range.h > this.y + this.h ||
                 range.y + range.h < this.y - this.h);
    }
}

class Circle {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.rSquared = this.r * this.r;
    }

    contains(point) {
        const d = Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2);
        return d <= this.rSquared;
    }

    intersects(range) {
        const xDist = Math.abs(range.x - this.x);
        const yDist = Math.abs(range.y - this.y);

        const r = this.r;
        const w = range.w;
        const h = range.h;

        const edges = Math.pow(xDist - w, 2) + Math.pow(yDist - h, 2);

        // No intersection
        if (xDist > r + w || yDist > r + h) return false;
        // Intersection within rect
        if (xDist <= w || yDist <= h) return true;
        // Intersection on corner
        return edges <= this.rSquared;
    }
}

// ==========================================
// 2. QUADTREE IMPLEMENTATION
// ==========================================
class QuadTree {
    constructor(boundary, capacity) {
        this.boundary = boundary; // Rectangle
        this.capacity = capacity;
        this.points = [];
        this.divided = false;
        // Telemetry
        this.checks = 0;
    }

    insert(point) {
        if (!this.boundary.contains(point)) return false;

        if (this.points.length < this.capacity) {
            this.points.push(point);
            return true;
        } else {
            if (!this.divided) this.subdivide();
            
            if (this.northeast.insert(point)) return true;
            if (this.northwest.insert(point)) return true;
            if (this.southeast.insert(point)) return true;
            if (this.southwest.insert(point)) return true;
        }
    }

    subdivide() {
        const x = this.boundary.x;
        const y = this.boundary.y;
        const w = this.boundary.w / 2;
        const h = this.boundary.h / 2;

        const ne = new Rectangle(x + w, y - h, w, h);
        this.northeast = new QuadTree(ne, this.capacity);
        const nw = new Rectangle(x - w, y - h, w, h);
        this.northwest = new QuadTree(nw, this.capacity);
        const se = new Rectangle(x + w, y + h, w, h);
        this.southeast = new QuadTree(se, this.capacity);
        const sw = new Rectangle(x - w, y + h, w, h);
        this.southwest = new QuadTree(sw, this.capacity);

        this.divided = true;
    }

    query(range, found) {
        if (!found) found = [];
        this.checks++; // Telemetry: Count how many nodes we visit

        if (!this.boundary.intersects(range)) {
            return found; // Skip entire subdivision
        }

        for (let p of this.points) {
            this.checks++; // Count point checks
            if (range.contains(p)) {
                found.push(p);
            }
        }

        if (this.divided) {
            this.northwest.query(range, found);
            this.northeast.query(range, found);
            this.southwest.query(range, found);
            this.southeast.query(range, found);
        }

        return found;
    }

    draw(ctx) {
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)'; // Greenish boundary
        ctx.lineWidth = 1;
        ctx.strokeRect(
            this.boundary.x - this.boundary.w,
            this.boundary.y - this.boundary.h,
            this.boundary.w * 2,
            this.boundary.h * 2
        );

        if (this.divided) {
            this.northeast.draw(ctx);
            this.northwest.draw(ctx);
            this.southeast.draw(ctx);
            this.southwest.draw(ctx);
        }
    }
}

// ==========================================
// 3. ENGINE STATE & INITIALIZATION
// ==========================================
const els = {
    canvas: document.getElementById('mapCanvas'),
    wrapper: document.getElementById('canvasWrapper'),
    searchHint: document.getElementById('searchHint'),
    
    // Controls
    modeBtns: document.querySelectorAll('.mode-btn'),
    driverCount: document.getElementById('driverCount'),
    driverVal: document.getElementById('driverVal'),
    staticCount: document.getElementById('staticCount'),
    staticVal: document.getElementById('staticVal'),
    searchRadius: document.getElementById('searchRadius'),
    radiusVal: document.getElementById('radiusVal'),
    showGridToggle: document.getElementById('showGridToggle'),
    
    // Telemetry
    bruteChecks: document.getElementById('bruteChecks'),
    quadChecks: document.getElementById('quadChecks'),
    foundCount: document.getElementById('foundCount'),
    efficiencyRatio: document.getElementById('efficiencyRatio'),
    logContainer: document.getElementById('logContainer')
};

let ctx;
let qtree;
let points = [];
let width, height;
let mouse = { x: -1000, y: -1000, active: false };
let animationId;
let mode = 'quadtree'; // quadtree, geohash

// Interleave bits (Morton Code / Z-Curve simulation)
function mortonEncode(x, y) {
    let res = 0;
    for (let i = 0; i < 16; i++) {
        res |= ((x & (1 << i)) << i) | ((y & (1 << i)) << (i + 1));
    }
    return res;
}

function initSpatialVisualizer() {
    ctx = els.canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    bindEvents();
    populateEntities();
    
    requestAnimationFrame(renderLoop);
}

function resizeCanvas() {
    const rect = els.wrapper.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    
    els.canvas.width = width * window.devicePixelRatio;
    els.canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    els.canvas.style.width = `${width}px`;
    els.canvas.style.height = `${height}px`;
}

function logSys(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = `> ${msg}`;
    els.logContainer.appendChild(div);
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

function bindEvents() {
    els.modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            els.modeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            mode = e.target.dataset.mode;
            logSys(`Switched to ${mode} mode.`, "info");
        });
    });

    els.driverCount.addEventListener('input', (e) => {
        els.driverVal.textContent = e.target.value;
        populateEntities();
    });
    
    els.staticCount.addEventListener('input', (e) => {
        els.staticVal.textContent = e.target.value;
        populateEntities();
    });

    els.searchRadius.addEventListener('input', (e) => {
        els.radiusVal.textContent = `${e.target.value} km`;
    });

    els.canvas.addEventListener('mousemove', (e) => {
        const rect = els.canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.active = true;
        els.searchHint.classList.add('hidden');
    });

    els.canvas.addEventListener('mouseleave', () => {
        mouse.active = false;
        els.searchHint.classList.remove('hidden');
    });
}

function populateEntities() {
    points = [];
    const dCount = parseInt(els.driverCount.value);
    const sCount = parseInt(els.staticCount.value);

    // Add Drivers (Moving)
    for (let i = 0; i < dCount; i++) {
        points.push(new Point(
            Math.random() * width,
            Math.random() * height,
            {
                isStatic: false,
                dx: (Math.random() - 0.5) * 2,
                dy: (Math.random() - 0.5) * 2
            }
        ));
    }

    // Add Restaurants (Static)
    for (let i = 0; i < sCount; i++) {
        points.push(new Point(
            Math.random() * width,
            Math.random() * height,
            { isStatic: true }
        ));
    }
}

// ==========================================
// 4. RENDER & LOGIC LOOP
// ==========================================
function renderLoop() {
    // 1. Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // 2. Build Quadtree
    const boundary = new Rectangle(width / 2, height / 2, width / 2, height / 2);
    qtree = new QuadTree(boundary, 4); // Capacity 4 per node

    // 3. Update Positions & Insert into Tree
    for (let p of points) {
        if (!p.data.isStatic) {
            p.x += p.data.dx;
            p.y += p.data.dy;

            // Bounce off edges
            if (p.x < 0 || p.x > width) p.data.dx *= -1;
            if (p.y < 0 || p.y > height) p.data.dy *= -1;
        }
        qtree.insert(p);
    }

    // 4. Draw Index Grid (Quadtree or Geohash Z-Curve)
    if (els.showGridToggle.checked) {
        if (mode === 'quadtree') {
            qtree.draw(ctx);
        } else {
            drawZCurve();
        }
    }

    // 5. Draw Points
    for (let p of points) {
        ctx.beginPath();
        if (p.data.isStatic) {
            // Restaurant (Square)
            ctx.rect(p.x - 2, p.y - 2, 4, 4);
            ctx.fillStyle = '#ffffff';
        } else {
            // Driver (Circle)
            ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI);
            ctx.fillStyle = '#3b82f6';
        }
        ctx.fill();
    }

    // 6. Handle Radial Search
    if (mouse.active) {
        const radius = parseInt(els.searchRadius.value);
        const range = new Circle(mouse.x, mouse.y, radius);
        
        // Draw Search Area
        ctx.beginPath();
        ctx.arc(range.x, range.y, range.r, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Perform Spatial Query
        qtree.checks = 0; // Reset metrics
        const found = qtree.query(range);

        // Highlight Found Points
        for (let p of found) {
            ctx.beginPath();
            if (p.data.isStatic) {
                ctx.rect(p.x - 3, p.y - 3, 6, 6);
            } else {
                ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
            }
            ctx.fillStyle = '#f59e0b';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#f59e0b';
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Update Telemetry UI
        els.foundCount.textContent = found.length;
        els.bruteChecks.textContent = points.length; // Brute force checks EVERY point
        els.quadChecks.textContent = qtree.checks;
        
        const efficiency = ((1 - (qtree.checks / points.length)) * 100).toFixed(1);
        els.efficiencyRatio.textContent = efficiency < 0 ? "0%" : `${efficiency}%`;
    }

    animationId = requestAnimationFrame(renderLoop);
}

// Draw a stylized Z-Order Curve mapping to demonstrate Geohash concept
function drawZCurve() {
    // Determine grid size (e.g. 8x8)
    const res = 8; 
    const cellW = width / res;
    const cellH = height / res;

    // Grid lines
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 1;
    for(let i=0; i<=res; i++) {
        ctx.beginPath(); ctx.moveTo(i*cellW, 0); ctx.lineTo(i*cellW, height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i*cellH); ctx.lineTo(width, i*cellH); ctx.stroke();
    }

    // Generate Z-order coordinates
    let curvePoints = [];
    for (let x = 0; x < res; x++) {
        for (let y = 0; y < res; y++) {
            let m = mortonEncode(x, y);
            curvePoints.push({x, y, m});
        }
    }
    
    // Sort by Morton Code to get the Z-curve path
    curvePoints.sort((a, b) => a.m - b.m);

    // Draw the curve
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < curvePoints.length; i++) {
        const pt = curvePoints[i];
        const px = pt.x * cellW + cellW/2;
        const py = pt.y * cellH + cellH/2;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
}
