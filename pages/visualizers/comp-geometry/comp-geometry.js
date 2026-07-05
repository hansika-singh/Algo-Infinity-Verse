// --- TELEMETRY ---
const logConsole = document.getElementById('execution-log');
const log = (msg, type = 'system') => {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.innerHTML = msg;
    logConsole.appendChild(div);
    logConsole.scrollTop = logConsole.scrollHeight;
};

// --- CORE STATE ---
let currentTool = 'point';
const state = {
    points: [],          // Array of {x, y}
    segments: [],        // Array of [{x,y}, {x,y}]
    polygons: [],        // Array of [{x,y}, ...]
    draftPolygon: [],    // Current polygon being drawn
    draftSegment: null,  // Current segment start point
    overlays: {
        hull: null,
        closestPair: null,
        intersections: [],
        clippedPoly: null
    }
};

// --- D3 ENGINE SETUP ---
const svg = d3.select("#geo-canvas");
const stage = document.getElementById('stage-container');

svg.on("click", handleCanvasClick);
svg.on("mousemove", handleCanvasMove);
svg.on("contextmenu", handleCanvasRightClick); // Finish Polygon

// --- RENDER LOOP ---
function render() {
    svg.selectAll(".layer").remove();
    const g = svg.append("g").attr("class", "layer");

    // 1. Polygons
    state.polygons.forEach(poly => {
        g.append("polygon")
            .attr("class", "geo-poly")
            .attr("points", poly.map(p => `${p.x},${p.y}`).join(" "));
    });

    // Draft Polygon
    if (state.draftPolygon.length > 0) {
        g.append("polyline")
            .attr("class", "geo-draft-poly")
            .attr("points", state.draftPolygon.map(p => `${p.x},${p.y}`).join(" "));
        state.draftPolygon.forEach(p => {
            g.append("circle").attr("class", "geo-point").attr("cx", p.x).attr("cy", p.y).attr("r", 4);
        });
    }

    // 2. Segments
    state.segments.forEach(seg => {
        g.append("line")
            .attr("class", "geo-segment")
            .attr("x1", seg[0].x).attr("y1", seg[0].y)
            .attr("x2", seg[1].x).attr("y2", seg[1].y);
    });

    // Draft Segment
    if (state.draftSegment && currentMousePos) {
        g.append("line")
            .attr("class", "geo-draft-line")
            .attr("x1", state.draftSegment.x).attr("y1", state.draftSegment.y)
            .attr("x2", currentMousePos.x).attr("y2", currentMousePos.y);
    }

    // 3. Points
    state.points.forEach(p => {
        g.append("circle")
            .attr("class", "geo-point")
            .attr("cx", p.x).attr("cy", p.y)
            .attr("r", 5);
    });

    // 4. Overlays (Algorithm Results)
    if (state.overlays.hull) {
        g.append("polygon")
            .attr("class", "overlay-hull")
            .attr("points", state.overlays.hull.map(p => `${p.x},${p.y}`).join(" "));
    }

    if (state.overlays.closestPair) {
        g.append("line")
            .attr("class", "overlay-pair")
            .attr("x1", state.overlays.closestPair[0].x).attr("y1", state.overlays.closestPair[0].y)
            .attr("x2", state.overlays.closestPair[1].x).attr("y2", state.overlays.closestPair[1].y);
    }

    state.overlays.intersections.forEach(p => {
        g.append("circle")
            .attr("class", "overlay-intersect")
            .attr("cx", p.x).attr("cy", p.y).attr("r", 6);
    });

    if (state.overlays.clippedPoly && state.overlays.clippedPoly.length > 0) {
        g.append("polygon")
            .attr("class", "overlay-clip")
            .attr("points", state.overlays.clippedPoly.map(p => `${p.x},${p.y}`).join(" "));
    }
}

// --- INTERACTION LOGIC ---
let currentMousePos = null;

function handleCanvasClick(event) {
    const [x, y] = d3.pointer(event);
    const pt = {x, y};
    clearOverlays(); // Reset math visuals on new input

    if (currentTool === 'point') {
        state.points.push(pt);
        log(`Plotted Point: (${Math.round(x)}, ${Math.round(y)})`, 'system');
    } 
    else if (currentTool === 'segment') {
        if (!state.draftSegment) {
            state.draftSegment = pt;
        } else {
            state.segments.push([state.draftSegment, pt]);
            log(`Drew Segment: (${Math.round(state.draftSegment.x)}, ${Math.round(state.draftSegment.y)}) to (${Math.round(x)}, ${Math.round(y)})`, 'process');
            state.draftSegment = null;
        }
    }
    else if (currentTool === 'polygon') {
        state.draftPolygon.push(pt);
    }
    render();
}

function handleCanvasMove(event) {
    if (currentTool === 'segment' && state.draftSegment) {
        const [x, y] = d3.pointer(event);
        currentMousePos = {x, y};
        render();
    }
    if (currentTool === 'polygon' && state.draftPolygon.length > 0) {
        const [x, y] = d3.pointer(event);
        currentMousePos = {x, y};
        render(); // Polylines don't auto-connect to mouse, but we could add a floating line
    }
}

function handleCanvasRightClick(event) {
    event.preventDefault();
    if (currentTool === 'polygon' && state.draftPolygon.length > 2) {
        state.polygons.push([...state.draftPolygon]);
        log(`Polygon mapped with ${state.draftPolygon.length} vertices.`, 'success');
        state.draftPolygon = [];
        render();
    }
}

function clearOverlays() {
    state.overlays = { hull: null, closestPair: null, intersections: [], clippedPoly: null };
}

// --- COMPUTATIONAL MATH LIBRARY ---

// 1. Cross Product / Orientation ( > 0 Left, < 0 Right, 0 Collinear)
const crossProduct = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
const distSq = (p1, p2) => (p1.x - p2.x)**2 + (p1.y - p2.y)**2;

// 2. Convex Hull (Monotone Chain)
function computeConvexHull() {
    if (state.points.length < 3) return log('Error: Need at least 3 points for a hull.', 'error');
    
    // Sort by X, then Y
    const pts = [...state.points].sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
    
    const lower = [];
    for (let p of pts) {
        while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
        lower.push(p);
    }
    
    const upper = [];
    for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
        upper.push(p);
    }
    
    upper.pop(); lower.pop();
    state.overlays.hull = lower.concat(upper);
    log(`Convex Hull mapped bounding ${state.overlays.hull.length} vertices.`, 'highlight');
    render();
}

// 3. Closest Pair (O(N^2) reliable implementation for interactive UI limits)
function computeClosestPair() {
    if (state.points.length < 2) return log('Error: Need at least 2 points.', 'error');
    let minDist = Infinity;
    let pair = [];
    for(let i=0; i<state.points.length; i++) {
        for(let j=i+1; j<state.points.length; j++) {
            let d = distSq(state.points[i], state.points[j]);
            if (d < minDist) { minDist = d; pair = [state.points[i], state.points[j]]; }
        }
    }
    state.overlays.closestPair = pair;
    log(`Closest Pair calculated. Distance: ${Math.sqrt(minDist).toFixed(2)}px`, 'highlight');
    render();
}

// 4. Shoelace Theorem
function computeArea() {
    if (state.polygons.length === 0) return log('Error: No polygons drawn.', 'error');
    const poly = state.polygons[state.polygons.length - 1]; // Use latest
    let area = 0;
    for (let i = 0; i < poly.length; i++) {
        let j = (i + 1) % poly.length;
        area += poly[i].x * poly[j].y;
        area -= poly[j].x * poly[i].y;
    }
    area = Math.abs(area) / 2;
    log(`Polygon Area (Shoelace): ${area.toFixed(2)} sq pixels.`, 'highlight');
}

// 5. Point in Polygon (Ray-Casting)
function computePointInPoly() {
    if (state.points.length === 0 || state.polygons.length === 0) return log('Error: Requires 1 point and 1 polygon.', 'error');
    const pt = state.points[state.points.length - 1];
    const poly = state.polygons[state.polygons.length - 1];
    
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        let xi = poly[i].x, yi = poly[i].y;
        let xj = poly[j].x, yj = poly[j].y;
        
        let intersect = ((yi > pt.y) !== (yj > pt.y)) && (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    if (inside) log(`Point (${Math.round(pt.x)}, ${Math.round(pt.y)}) is INSIDE the polygon.`, 'success');
    else log(`Point (${Math.round(pt.x)}, ${Math.round(pt.y)}) is OUTSIDE the polygon.`, 'error');
}

// 6. Line Intersection
function computeIntersections() {
    if (state.segments.length < 2) return log('Error: Need at least 2 segments.', 'error');
    state.overlays.intersections = [];
    
    const getIntersection = (p0, p1, p2, p3) => {
        let s1_x = p1.x - p0.x, s1_y = p1.y - p0.y;
        let s2_x = p3.x - p2.x, s2_y = p3.y - p2.y;
        let s, t;
        s = (-s1_y * (p0.x - p2.x) + s1_x * (p0.y - p2.y)) / (-s2_x * s1_y + s1_x * s2_y);
        t = ( s2_x * (p0.y - p2.y) - s2_y * (p0.x - p2.x)) / (-s2_x * s1_y + s1_x * s2_y);

        if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
            return { x: p0.x + (t * s1_x), y: p0.y + (t * s1_y) };
        }
        return null;
    };

    let count = 0;
    for (let i=0; i<state.segments.length; i++) {
        for (let j=i+1; j<state.segments.length; j++) {
            let pt = getIntersection(state.segments[i][0], state.segments[i][1], state.segments[j][0], state.segments[j][1]);
            if (pt) { state.overlays.intersections.push(pt); count++; }
        }
    }
    log(`Found ${count} segment intersection(s).`, 'highlight');
    render();
}

// 7. Sutherland-Hodgman Clipping
function computeClipping() {
    if (state.polygons.length < 2) return log('Error: Requires 2 polygons. (First = Subject, Second = Convex Clipper)', 'error');
    
    let subject = state.polygons[state.polygons.length - 2];
    const clipper = state.polygons[state.polygons.length - 1];

    const clipEdge = (poly, p1, p2) => {
        const inside = (p) => (p2.x - p1.x) * (p.y - p1.y) - (p2.y - p1.y) * (p.x - p1.x) >= 0;
        const intersection = (a, b) => {
            const dcX = p1.x - p2.x, dcY = p1.y - p2.y;
            const dpX = a.x - b.x, dpY = a.y - b.y;
            const n1 = p1.x * p2.y - p1.y * p2.x;
            const n2 = a.x * b.y - a.y * b.x;
            const den = dcX * dpY - dcY * dpX;
            return { x: (n1 * dpX - n2 * dcX) / den, y: (n1 * dpY - n2 * dcY) / den };
        };

        const clipped = [];
        for (let i = 0; i < poly.length; i++) {
            let curr = poly[i];
            let prev = poly[(i === 0) ? poly.length - 1 : i - 1];
            if (inside(curr)) {
                if (!inside(prev)) clipped.push(intersection(prev, curr));
                clipped.push(curr);
            } else if (inside(prev)) {
                clipped.push(intersection(prev, curr));
            }
        }
        return clipped;
    };

    // Ensure clipper orientation is standard (Counter-Clockwise)
    let area = 0;
    for (let i = 0; i < clipper.length; i++) {
        let j = (i + 1) % clipper.length;
        area += clipper[i].x * clipper[j].y - clipper[j].x * clipper[i].y;
    }
    const safeClipper = area > 0 ? clipper : [...clipper].reverse();

    for (let i = 0; i < safeClipper.length; i++) {
        let p1 = safeClipper[i];
        let p2 = safeClipper[(i + 1) % safeClipper.length];
        subject = clipEdge(subject, p1, p2);
    }

    state.overlays.clippedPoly = subject;
    log(`Sutherland-Hodgman Executed. Clipped Polygon created with ${subject.length} vertices.`, 'highlight');
    render();
}

// --- EVENT BINDINGS ---
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentTool = e.target.id.replace('tool-', '');
        state.draftSegment = null;
        state.draftPolygon = [];
        log(`Equipped Tool: ${currentTool.toUpperCase()}`, 'system');
    });
});

document.getElementById('btn-hull').addEventListener('click', computeConvexHull);
document.getElementById('btn-closest').addEventListener('click', computeClosestPair);
document.getElementById('btn-intersect').addEventListener('click', computeIntersections);
document.getElementById('btn-area').addEventListener('click', computeArea);
document.getElementById('btn-pip').addEventListener('click', computePointInPoly);
document.getElementById('btn-clip').addEventListener('click', computeClipping);

document.getElementById('btn-clear').addEventListener('click', () => {
    state.points = []; state.segments = []; state.polygons = [];
    state.draftPolygon = []; state.draftSegment = null;
    clearOverlays();
    log('Canvas Wiped. Matrix reset.', 'error');
    render();
});

// Init
render();
