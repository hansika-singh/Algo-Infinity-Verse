// ============================================
// CONVEX HULL VISUALIZER
// ============================================

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let points = [];
let hull = [];
let currentAlgorithm = 'None';
let startTime = 0;
let dragging = null;

// ============================================
// POINT OPERATIONS
// ============================================

function generatePoints() {
    const count = Math.floor(Math.random() * 15) + 5;
    points = [];
    for (let i = 0; i < count; i++) {
        points.push({
            x: Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
            y: Math.random() * canvas.height * 0.8 + canvas.height * 0.1
        });
    }
    hull = [];
    currentAlgorithm = 'None';
    showMessage(`Generated ${count} random points 📊`, 'info');
    updateInfo();
    draw();
}

function clearPoints() {
    points = [];
    hull = [];
    currentAlgorithm = 'None';
    showMessage('Points cleared 🗑️', 'info');
    updateInfo();
    draw();
}

function resetAll() {
    points = [];
    hull = [];
    currentAlgorithm = 'None';
    document.getElementById('timeTaken').textContent = '0ms';
    document.getElementById('complexity').textContent = 'O(n log n)';
    showMessage('Reset complete 🔄', 'info');
    updateInfo();
    draw();
}

// ============================================
// DRAWING
// ============================================

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }

    // Draw hull
    if (hull.length > 2) {
        ctx.beginPath();
        ctx.moveTo(hull[0].x, hull[0].y);
        for (let i = 1; i < hull.length; i++) {
            ctx.lineTo(hull[i].x, hull[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle = '#ffd200';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 210, 0, 0.1)';
        ctx.fill();
        
        // Draw vertices
        hull.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd200';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    // Draw points
    points.forEach((p, i) => {
        const isHull = hull.includes(p);
        const radius = isHull ? 8 : 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isHull ? '#ffd200' : '#4facfe';
        ctx.fill();
        ctx.strokeStyle = isHull ? '#fff' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(i, p.x, p.y - 12);
    });
}

// ============================================
// CROSS PRODUCT (for orientation)
// ============================================

function cross(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}