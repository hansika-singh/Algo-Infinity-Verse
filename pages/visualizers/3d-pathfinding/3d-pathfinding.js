/**
 * 3d-pathfinding.js
 * Generates Procedural Terrain using Sine/Cosine waves and renders it via Three.js InstancedMesh.
 * Executes the A* Pathfinding algorithm to navigate the 3D topology.
 */

document.addEventListener("DOMContentLoaded", () => {
    try {
        if (typeof THREE === "undefined") {
            throw new Error("Three.js not loaded.");
        }

        initPathfinder();
    } catch (error) {
        console.error("Failed to initialize visualizer:", error);
        showError("3D visualization could not be loaded on this device.");
    }
});

// --- Config & Globals ---
const GRID_SIZE = 40;
const TOTAL_NODES = GRID_SIZE * GRID_SIZE;
const CUBE_SIZE = 1;
const HEIGHT_MULTIPLIER = 5;

// Colors
const COLORS = {
    WATER: new THREE.Color(0x3b82f6),
    GRASS: new THREE.Color(0x10b981),
    DIRT: new THREE.Color(0xa8a29e),
    SNOW: new THREE.Color(0xf8fafc),
    START: new THREE.Color(0x10b981), // Emerald
    END: new THREE.Color(0xef4444),   // Red
    OPEN: new THREE.Color(0xf59e0b),  // Amber
    CLOSED: new THREE.Color(0x8b5cf6),// Violet
    PATH: new THREE.Color(0xec4899)   // Pink
};

// State
let scene, camera, renderer, controls;
let instancedMesh;
let dummy = new THREE.Object3D();
let gridData = []; // Stores node objects {x, y, height, index, color}
let startIndex = -1;
let endIndex = -1;
let isSearching = false;
let searchGenerator = null;
let animationReq = null;

// DOM
const els = {
    container: document.getElementById('threejs-container'),
    btnGenerate: document.getElementById('btnGenerate'),
    btnStartSearch: document.getElementById('btnStartSearch'),
    speedSlider: document.getElementById('speedSlider'),
    statExplored: document.getElementById('statExplored'),
    statCost: document.getElementById('statCost')
};

function showError(message) {
    if (els.container) {
        els.container.innerHTML = `
            <div style="
                display:flex;
                align-items:center;
                justify-content:center;
                height:100%;
                color:white;
                text-align:center;
                padding:20px;
            ">
                <div>
                    <h3>Visualization Unavailable</h3>
                    <p>${message}</p>
                </div>
            </div>
        `;
    }
}

// --- MinHeap Priority Queue for A* ---
class MinHeap {
    constructor(scorer) {
        this.data = [];
        this.scorer = scorer; // Function to evaluate score (f-score)
    }
    push(element) {
        this.data.push(element);
        this.bubbleUp(this.data.length - 1);
    }
    pop() {
        const result = this.data[0];
        const end = this.data.pop();
        if (this.data.length > 0) {
            this.data[0] = end;
            this.sinkDown(0);
        }
        return result;
    }
    bubbleUp(n) {
        let element = this.data[n];
        let score = this.scorer(element);
        while (n > 0) {
            let parentN = Math.floor((n + 1) / 2) - 1;
            let parent = this.data[parentN];
            if (score >= this.scorer(parent)) break;
            this.data[parentN] = element;
            this.data[n] = parent;
            n = parentN;
        }
    }
    sinkDown(n) {
        let length = this.data.length;
        let element = this.data[n];
        let elemScore = this.scorer(element);
        while (true) {
            let child2N = (n + 1) * 2, child1N = child2N - 1;
            let swap = null;
            if (child1N < length) {
                let child1 = this.data[child1N];
                let child1Score = this.scorer(child1);
                if (child1Score < elemScore) swap = child1N;
            }
            if (child2N < length) {
                let child2 = this.data[child2N];
                let child2Score = this.scorer(child2);
                if (child2Score < (swap == null ? elemScore : this.scorer(this.data[child1N]))) {
                    swap = child2N;
                }
            }
            if (swap == null) break;
            this.data[n] = this.data[swap];
            this.data[swap] = element;
            n = swap;
        }
    }
    size() { return this.data.length; }
}

// ==========================================
// 1. THREE.JS INITIALIZATION
// ==========================================
function initPathfinder() {
    setupScene();
    setupLighting();
    buildInstancedMesh();
    
    window.addEventListener('resize', onWindowResize, false);
    
    els.btnGenerate.addEventListener('click', generateTerrain);
    els.btnStartSearch.addEventListener('click', startSearch);
    
    // Initial Terrain
    generateTerrain();
    animate();
}

function setupScene() {
    try {
        scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.015);
    
    const aspect = els.container.clientWidth / els.container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    // Position camera dynamically based on grid
    camera.position.set(GRID_SIZE * 0.8, GRID_SIZE * 0.8, GRID_SIZE * 0.8);
    
    renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
    });
        renderer.setSize(els.container.clientWidth, els.container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for perf
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute('aria-label', '3D Pathfinding Visualization');
    els.container.appendChild(renderer.domElement);
    
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;

    } catch (error) {
        console.error("Scene initialization failed:", error);
        showError("WebGL is not supported or failed to initialize.");
        throw error;
    }
}
function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(GRID_SIZE, GRID_SIZE, GRID_SIZE);
    scene.add(dirLight);
    
    const fillLight = new THREE.DirectionalLight(0x14b8a6, 0.3); // Teal fill
    fillLight.position.set(-GRID_SIZE, GRID_SIZE/2, -GRID_SIZE);
    scene.add(fillLight);
}

function buildInstancedMesh() {
    // Beveled box geometry for a cleaner look
    const geometry = new THREE.BoxGeometry(CUBE_SIZE * 0.95, CUBE_SIZE, CUBE_SIZE * 0.95);
    // Move origin to bottom of cube so scaling scales upwards
    geometry.translate(0, CUBE_SIZE / 2, 0); 

    const material = new THREE.MeshPhongMaterial({ 
        color: 0xffffff, 
        shininess: 30,
        flatShading: true
    });
    
    instancedMesh = new THREE.InstancedMesh(geometry, material, TOTAL_NODES);
    scene.add(instancedMesh);
}

// ==========================================
// 2. PROCEDURAL TERRAIN GENERATION
// ==========================================
function getPseudoNoise(x, y, seed) {
    // Simple harmonic combinations to simulate Perlin noise locally
    const n = Math.sin(x * 0.1 + seed) * 2 + 
              Math.cos(y * 0.1 - seed) * 2 + 
              Math.sin((x + y) * 0.05) * 1.5;
    return n; // Range roughly -5.5 to +5.5
}

function getTerrainColor(heightValue) {
    if (heightValue < -1.5) return COLORS.WATER;
    if (heightValue < 2) return COLORS.GRASS;
    if (heightValue < 4) return COLORS.DIRT;
    return COLORS.SNOW;
}

function generateTerrain() {
    if (isSearching) stopSearch();
    
    gridData = [];
    const seed = Math.random() * 100;
    const offset = (GRID_SIZE * CUBE_SIZE) / 2;
    
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            const index = x * GRID_SIZE + y;
            
            // Raw noise
            const noiseVal = getPseudoNoise(x, y, seed);
            
            // Adjust height (water level is flat)
            const height = noiseVal < -1.5 ? -1.5 : noiseVal;
            
            // World coordinates
            const px = (x * CUBE_SIZE) - offset;
            const pz = (y * CUBE_SIZE) - offset;
            const py = height; 

            // Base Color
            const color = getTerrainColor(noiseVal);

            gridData.push({
                index, x, y, height, px, py, pz,
                baseColor: color,
                currentColor: color
            });

            // Set Instance Matrix & Color
            dummy.position.set(px, py, pz);
            
            // Stretch the cube down so there are no holes under the terrain
            dummy.scale.set(1, (py + 10), 1); 
            dummy.updateMatrix();
            
            instancedMesh.setMatrixAt(index, dummy.matrix);
            instancedMesh.setColorAt(index, color);
        }
    }
    
    // Pick Start and End points (Ensure they aren't deep underwater)
    do { startIndex = Math.floor(Math.random() * TOTAL_NODES); } while (gridData[startIndex].height < -1.0);
    do { endIndex = Math.floor(Math.random() * TOTAL_NODES); } while (endIndex === startIndex || gridData[endIndex].height < -1.0);
    
    updateNodeColor(startIndex, COLORS.START);
    updateNodeColor(endIndex, COLORS.END);
    
    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.instanceColor.needsUpdate = true;
    
    els.btnStartSearch.disabled = false;
    els.btnStartSearch.innerHTML = '<i class="fas fa-play"></i> Start Search';
    els.statExplored.textContent = '0';
    els.statCost.textContent = '0.00';
}

function updateNodeColor(index, color) {
    gridData[index].currentColor = color;
    instancedMesh.setColorAt(index, color);
}

// ==========================================
// 3. A* PATHFINDING ALGORITHM
// ==========================================
function startSearch() {
    // Reset colors from previous search without regenerating terrain
    gridData.forEach((node, i) => {
        if (i !== startIndex && i !== endIndex) {
            updateNodeColor(i, node.baseColor);
        }
    });
    instancedMesh.instanceColor.needsUpdate = true;

    els.btnGenerate.disabled = true;
    els.btnStartSearch.disabled = true;
    els.btnStartSearch.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
    els.statExplored.textContent = '0';
    
    isSearching = true;
    searchGenerator = aStarAlgorithm(startIndex, endIndex);
    stepSearch();
}

function stopSearch() {
    isSearching = false;
    clearTimeout(animationReq);
    els.btnGenerate.disabled = false;
    els.btnStartSearch.disabled = false;
    els.btnStartSearch.innerHTML = '<i class="fas fa-play"></i> Start Search';
}

// Distance heuristic mapping 3D space
function heuristic(idxA, idxB) {
    const nodeA = gridData[idxA];
    const nodeB = gridData[idxB];
    const dx = Math.abs(nodeA.x - nodeB.x);
    const dy = Math.abs(nodeA.y - nodeB.y);
    const dz = Math.abs(nodeA.height - nodeB.height);
    // Manhattan distance on grid + slope penalty
    return (dx + dy) + (dz * 2); 
}

function getNeighbors(index) {
    const neighbors = [];
    const node = gridData[index];
    
    const dirs = [[0,-1], [1,0], [0,1], [-1,0]]; // N, E, S, W
    
    for (let [dx, dy] of dirs) {
        const nx = node.x + dx;
        const ny = node.y + dy;
        
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            const nIndex = nx * GRID_SIZE + ny;
            const neighbor = gridData[nIndex];
            
            // Slope validation (can't climb sheer cliffs)
            const heightDiff = Math.abs(neighbor.height - node.height);
            if (heightDiff <= 2.5) { 
                neighbors.push(nIndex);
            }
        }
    }
    return neighbors;
}

// Generator function allowing us to pause and animate the loop
function* aStarAlgorithm(startIdx, endIdx) {
    const openSet = new MinHeap(node => fScore[node]);
    openSet.push(startIdx);
    
    const cameFrom = new Map();
    const gScore = {};
    const fScore = {};
    
    gridData.forEach((_, i) => {
        gScore[i] = Infinity;
        fScore[i] = Infinity;
    });
    
    gScore[startIdx] = 0;
    fScore[startIdx] = heuristic(startIdx, endIdx);
    
    const openSetHash = new Set([startIdx]);
    let exploredCount = 0;

    while (openSet.size() > 0) {
        const current = openSet.pop();
        openSetHash.delete(current);
        
        exploredCount++;

        if (current === endIdx) {
            // Path Found! Reconstruct.
            let curr = current;
            const path = [curr];
            while (cameFrom.has(curr)) {
                curr = cameFrom.get(curr);
                path.unshift(curr);
            }
            yield { type: 'path', path, exploredCount, cost: gScore[endIdx] };
            return;
        }

        // Color node closed (if not start)
        if (current !== startIdx) {
            updateNodeColor(current, COLORS.CLOSED);
        }

        const neighbors = getNeighbors(current);
        for (let neighbor of neighbors) {
            // Calculate movement cost considering elevation changes
            const heightDiff = Math.abs(gridData[current].height - gridData[neighbor].height);
            const moveCost = 1 + (heightDiff * 1.5); 
            const tentative_gScore = gScore[current] + moveCost;

            if (tentative_gScore < gScore[neighbor]) {
                cameFrom.set(neighbor, current);
                gScore[neighbor] = tentative_gScore;
                fScore[neighbor] = gScore[neighbor] + heuristic(neighbor, endIdx);

                if (!openSetHash.has(neighbor)) {
                    openSet.push(neighbor);
                    openSetHash.add(neighbor);
                    if (neighbor !== endIdx) {
                        updateNodeColor(neighbor, COLORS.OPEN);
                    }
                }
            }
        }
        
        instancedMesh.instanceColor.needsUpdate = true;
        yield { type: 'explore', exploredCount };
    }
    
    // No path found
    yield { type: 'no_path', exploredCount };
}

function stepSearch() {
    if (!isSearching) return;
    
    // Speed control determines how many nodes we process per frame
    const speed = parseInt(els.speedSlider.value);
    let result;
    
    for (let i = 0; i < speed; i++) {
        result = searchGenerator.next();
        if (result.done) break;
    }
    
    if (!result.done) {
        els.statExplored.textContent = result.value.exploredCount;
        animationReq = setTimeout(stepSearch, 16); // ~60fps
    } else {
        // Algorithm Finished
        els.statExplored.textContent = result.value.exploredCount;
        
        if (result.value.type === 'path') {
            els.statCost.textContent = result.value.cost.toFixed(2);
            // Draw Path in gold
            result.value.path.forEach((nodeIdx, i) => {
                if (i > 0 && i < result.value.path.length - 1) {
                    updateNodeColor(nodeIdx, COLORS.PATH);
                    
                    // Elevate the path cubes slightly to pop out visually
                    const node = gridData[nodeIdx];
                    dummy.position.set(node.px, node.py + 0.5, node.pz);
                    dummy.scale.set(1, (node.py + 10.5), 1);
                    dummy.updateMatrix();
                    instancedMesh.setMatrixAt(nodeIdx, dummy.matrix);
                }
            });
            instancedMesh.instanceMatrix.needsUpdate = true;
            instancedMesh.instanceColor.needsUpdate = true;
            els.btnStartSearch.innerHTML = '<i class="fas fa-check"></i> Path Found';
        } else {
            els.btnStartSearch.innerHTML = '<i class="fas fa-times"></i> No Path';
        }
        isSearching = false;
        els.btnGenerate.disabled = false;
    }
}

// ==========================================
// 4. RENDER LOOP
// ==========================================
function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = els.container.clientWidth / els.container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(els.container.clientWidth, els.container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
