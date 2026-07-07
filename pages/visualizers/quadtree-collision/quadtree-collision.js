/**
 * quadtree-collision.js
 * Engine for comparing Naive O(N^2) vs Quadtree O(N log N) collision detection
 */

document.addEventListener("DOMContentLoaded", () => {
    initCollisionVisualizer();
});

// ==========================================
// 1. GEOMETRY & PHYSICS CLASSES
// ==========================================

class Particle {
    constructor(x, y, radius, speedMultiplier) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        // Random velocity between -1 and 1, scaled by speed
        this.vx = (Math.random() - 0.5) * 2 * speedMultiplier;
        this.vy = (Math.random() - 0.5) * 2 * speedMultiplier;
        this.colliding = false;
    }

    update(width, height) {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off walls
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -1;
        } else if (this.x + this.radius > width) {
            this.x = width - this.radius;
            this.vx *= -1;
        }

        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy *= -1;
        } else if (this.y + this.radius > height) {
            this.y = height - this.radius;
            this.vy *= -1;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        if (this.colliding) {
            ctx.fillStyle = '#ef4444'; // Red
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ef4444';
        } else {
            ctx.fillStyle = '#3b82f6'; // Blue
            ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0; // Reset for performance
    }
}

class Rectangle {
    constructor(x, y, w, h) {
        this.x = x; // Center X
        this.y = y; // Center Y
        this.w = w; // Half width
        this.h = h; // Half height
    }

    contains(particle) {
        return (particle.x >= this.x - this.w &&
                particle.x <= this.x + this.w &&
                particle.y >= this.y - this.h &&
                particle.y <= this.y + this.h);
    }

    intersects(range) {
        return !(range.x - range.w > this.x + this.w ||
                 range.x + range.w < this.x - this.w ||
                 range.y - range.h > this.y + this.h ||
                 range.y + range.h < this.y - this.h);
    }
}

// ==========================================
// 2. QUADTREE IMPLEMENTATION
// ==========================================

class QuadTree {
    constructor(boundary, capacity) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.particles = [];
        this.divided = false;
        this.depth = depth;
    }

    insert(particle) {
        if (!this.boundary.contains(particle)) {
            return false;
        }

        if (this.particles.length < this.capacity || this.depth >= 8) {
            this.particles.push(particle);
            return true;
        } else {
            if (!this.divided) {
                this.subdivide();
            }

            if (this.northeast.insert(particle)) return true;
            if (this.northwest.insert(particle)) return true;
            if (this.southeast.insert(particle)) return true;
            if (this.southwest.insert(particle)) return true;
            return false;
        }
    }

    subdivide() {
        let x = this.boundary.x;
        let y = this.boundary.y;
        let w = this.boundary.w / 2;
        let h = this.boundary.h / 2;

        let ne = new Rectangle(x + w, y - h, w, h);
        this.northeast = new QuadTree(ne, this.capacity, this.depth + 1);
        let nw = new Rectangle(x - w, y - h, w, h);
        this.northwest = new QuadTree(nw, this.capacity, this.depth + 1);
        let se = new Rectangle(x + w, y + h, w, h);
        this.southeast = new QuadTree(se, this.capacity, this.depth + 1);
        let sw = new Rectangle(x - w, y + h, w, h);
        this.southwest = new QuadTree(sw, this.capacity, this.depth + 1);

        this.divided = true;
    }
}

    query(range, found) {
        if (!found) found = [];
        
        window.engineStats.checks++; // Count boundary intersection check

        if (!this.boundary.intersects(range)) {
            return found;
        }

        for (let p of this.particles) {
            window.engineStats.checks++; // Count particle inclusion check
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
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)'; // Faint green
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
    canvas: document.getElementById('simulationCanvas'),
    wrapper: document.getElementById('canvasWrapper'),
    modeBtns: document.querySelectorAll('.mode-btn'),
    particleCount: document.getElementById('particleCount'),
    particleVal: document.getElementById('particleVal'),
    particleSpeed: document.getElementById('particleSpeed'),
    speedVal: document.getElementById('speedVal'),
    particleSize: document.getElementById('particleSize'),
    sizeVal: document.getElementById('sizeVal'),
    showGridToggle: document.getElementById('showGridToggle'),
    fpsCount: document.getElementById('fpsCount'),
    fpsBox: document.getElementById('fpsBox'),
    collisionCount: document.getElementById('collisionCount'),
    checksCount: document.getElementById('checksCount')
};

let ctx;
let particles = [];
let width, height;
let mode = 'quadtree'; // 'naive' or 'quadtree'
let animationId;

// Globals for telemetry
window.engineStats = {
    checks: 0,
    collisions: 0
};

// FPS tracking
let lastTime = performance.now();
let frameCount = 0;
let currentFps = 60;

function initCollisionVisualizer() {
    ctx = els.canvas.getContext('2d', { alpha: false }); // Optimize for no transparency on bg
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    bindEvents();
    resetSimulation();
    
    animationId = requestAnimationFrame(engineLoop);
}

function resizeCanvas() {
    const rect = els.wrapper.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    
    // Support high DPI displays
    const dpr = window.devicePixelRatio || 1;
    els.canvas.width = width * dpr;
    els.canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
}

function bindEvents() {
    // Mode toggles
    els.modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            els.modeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            mode = e.target.dataset.mode;
        });
    });

    // Sliders
    els.particleCount.addEventListener('input', (e) => {
        els.particleVal.textContent = e.target.value;
        resetSimulation(); // Re-seed particles on count change
    });

    els.particleSpeed.addEventListener('input', (e) => {
        els.speedVal.textContent = e.target.value + 'x';
        updateParticlePhysics();
    });

    els.particleSize.addEventListener('input', (e) => {
        els.sizeVal.textContent = e.target.value + 'px';
        updateParticlePhysics();
    });
}

function resetSimulation() {
    particles = [];
    const count = parseInt(els.particleCount.value);
    const radius = parseFloat(els.particleSize.value);
    const speed = parseFloat(els.particleSpeed.value);

    for (let i = 0; i < count; i++) {
        // Distribute randomly
        const x = radius + Math.random() * (width - radius * 2);
        const y = radius + Math.random() * (height - radius * 2);
        particles.push(new Particle(x, y, radius, speed));
    }
}

function updateParticlePhysics() {
    const radius = parseFloat(els.particleSize.value);
    const speed = parseFloat(els.particleSpeed.value);
    
    for (let p of particles) {
        p.radius = radius;
        // Normalize current velocity and apply new speed multiplier
        const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (currentSpeed > 0) {
            p.vx = (p.vx / currentSpeed) * speed;
            p.vy = (p.vy / currentSpeed) * speed;
        } else {
            p.vx = (Math.random() - 0.5) * speed;
            p.vy = (Math.random() - 0.5) * speed;
        }
    }
}

// ==========================================
// 4. CORE ENGINE LOOP
// ==========================================

function engineLoop(timestamp) {
    // Calculate FPS (update every 500ms)
    frameCount++;
    if (timestamp - lastTime >= 500) {
        currentFps = Math.round((frameCount * 1000) / (timestamp - lastTime));
        els.fpsCount.textContent = currentFps;
        
        // Update color indicator based on performance
        els.fpsBox.className = 'tel-box ' + (currentFps < 30 ? 'danger' : (currentFps < 50 ? 'warning' : 'good'));
        
        frameCount = 0;
        lastTime = timestamp;
    }

    // Reset canvas and stats
    ctx.fillStyle = '#0f172a'; // Background match
    ctx.fillRect(0, 0, width, height);
    
    window.engineStats.checks = 0;
    window.engineStats.collisions = 0;

    // 1. Move all particles and reset collision state
    for (let p of particles) {
        p.update(width, height);
        p.colliding = false;
    }

    // 2. Perform Collision Detection
    if (mode === 'naive') {
        performNaiveCollision();
    } else {
        performQuadtreeCollision();
    }

    // 3. Render Particles
    for (let p of particles) {
        p.draw(ctx);
    }

    // Update UI Stats
    els.checksCount.textContent = window.engineStats.checks.toLocaleString();
    els.collisionCount.textContent = window.engineStats.collisions.toLocaleString();

    animationId = requestAnimationFrame(engineLoop);
}

// --- O(N^2) Naive Detection ---
function performNaiveCollision() {
    const len = particles.length;
    for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
            const p1 = particles[i];
            const p2 = particles[j];
            
            window.engineStats.checks++; // Count every distance calculation
            
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distanceSq = dx * dx + dy * dy;
            const minDistanceSq = (p1.radius + p2.radius) * (p1.radius + p2.radius);

            if (distanceSq < minDistanceSq) {
                p1.colliding = true;
                p2.colliding = true;
                window.engineStats.collisions++;
            }
        }
    }
}

// --- O(N log N) Quadtree Detection ---
function performQuadtreeCollision() {
    // Build tree for this frame
    let boundary = new Rectangle(width / 2, height / 2, width / 2, height / 2);
    let qtree = new QuadTree(boundary, 4); // Node capacity of 4

    for (let p of particles) {
        qtree.insert(p);
    }

    // Draw tree if enabled
    if (els.showGridToggle.checked) {
        qtree.draw(ctx);
    }

    // Detect collisions via tree queries
    for (let p of particles) {
        // Optimization: if already colliding this frame from another particle's check, we don't skip to allow accurate 'checks' counting 
        // to show true algorithm difference, though skipping would be even faster.
        
        // Define a search area around the particle
        // Range must cover 2 * radius to hit neighbors accurately
        let searchRange = new Rectangle(p.x, p.y, p.radius * 2, p.radius * 2);
        
        // Find potential neighbors
        let neighbors = qtree.query(searchRange);

        // Narrow-phase check (actual distance calculation)
        for (let other of neighbors) {
            if (p !== other) {
                window.engineStats.checks++; // Count distance check
                
                const dx = p.x - other.x;
                const dy = p.y - other.y;
                const distanceSq = dx * dx + dy * dy;
                const minDistanceSq = (p.radius + other.radius) * (p.radius + other.radius);

                if (distanceSq < minDistanceSq) {
                    p.colliding = true;
                    other.colliding = true;
                    // Note: This might double-count actual distinct collision events since both particles check each other, 
                    // but it accurately reflects the logic flow.
                    window.engineStats.collisions++; 
                }
            }
        }
    }
    
    // Halve collisions because A hits B and B hits A
    window.engineStats.collisions = Math.floor(window.engineStats.collisions / 2);
}
