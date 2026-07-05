/**
 * dp-3d-visualizer.js
 * Initializes a WebGL Three.js scene to render a 3D Dynamic Programming matrix.
 * Uses InstancedMesh for high-performance rendering of the cube grid.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Ensure Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error("Three.js not loaded. Make sure the CDN links are accessible.");
        return;
    }
    initVisualizer();
});

// Settings & Globals
const GRID_SIZE = 5;
const TOTAL_STATES = GRID_SIZE * GRID_SIZE * GRID_SIZE;
const CUBE_SIZE = 0.8;
const GAP = 1.0; // Distance between centers

// Colors
const COLOR_UNCALC = new THREE.Color(0x1e293b); // Dark slate
const COLOR_ACTIVE = new THREE.Color(0xfde047); // Bright Yellow
const COLOR_CALC = new THREE.Color(0x10b981);   // Emerald Green

// DOM Elements
const els = {
    container: document.getElementById('threejs-container'),
    currentStateDisplay: document.getElementById('currentStateDisplay'),
    btnPlayPause: document.getElementById('btnPlayPause'),
    btnStepFwd: document.getElementById('btnStepFwd'),
    btnStepBack: document.getElementById('btnStepBack'),
    btnReset: document.getElementById('btnReset'),
    timelineSlider: document.getElementById('timelineSlider'),
    timelineProgress: document.getElementById('timelineProgress')
};

// Three.js Core
let scene, camera, renderer, controls;
let instancedMesh;
let dummy = new THREE.Object3D(); // Used to calculate transforms for InstancedMesh

// State Machine
let currentStep = 0;
let isPlaying = false;
let animationTimer = null;

function initVisualizer() {
    setupScene();
    createMatrix();
    setupLighting();
    
    // Resize handler
    window.addEventListener('resize', onWindowResize, false);
    
    // Animation loop
    animate();
    
    // UI Events
    setupControls();
    
    // Initialize first state
    updateVisualization(0);
}

function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Match page background
    
    // Camera
    const aspect = els.container.clientWidth / els.container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    // Position camera diagonally to see the 3D volume
    camera.position.set(GRID_SIZE * 1.5, GRID_SIZE * 1.5, GRID_SIZE * 1.5);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(els.container.clientWidth, els.container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    els.container.appendChild(renderer.domElement);
    
    // Orbit Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0); // Look at center of grid
}

function createMatrix() {
    // We use a rounded box geometry for aesthetics, but standard box works too.
    const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    
    // Basic material that reacts to light. Transparent slightly to see inner cubes.
    const material = new THREE.MeshPhongMaterial({ 
        color: 0xffffff, // Base color will be overwritten by InstanceColor
        transparent: true,
        opacity: 0.85,
        shininess: 60
    });
    
    // Create InstancedMesh (Geometry, Material, Count)
    instancedMesh = new THREE.InstancedMesh(geometry, material, TOTAL_STATES);
    
    // Offset calculation to center the entire grid at (0,0,0)
    const offset = (GRID_SIZE - 1) * GAP / 2;
    
    let index = 0;
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                
                // Position each cube
                const px = (x * GAP) - offset;
                const py = (y * GAP) - offset;
                const pz = (z * GAP) - offset;
                
                dummy.position.set(px, py, pz);
                dummy.updateMatrix();
                
                // Set matrix and initial color
                instancedMesh.setMatrixAt(index, dummy.matrix);
                instancedMesh.setColorAt(index, COLOR_UNCALC);
                
                index++;
            }
        }
    }
    
    scene.add(instancedMesh);
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft global white light
    scene.add(ambientLight);
    
    const dirLight1 = new THREE.DirectionalLight(0x06b6d4, 0.8); // Cyan directional
    dirLight1.position.set(10, 20, 10);
    scene.add(dirLight1);
    
    const dirLight2 = new THREE.DirectionalLight(0x3b82f6, 0.5); // Blue secondary
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);
}

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

// ----------------------------------------------------
// UI and State Logic
// ----------------------------------------------------

function setupControls() {
    els.timelineSlider.max = TOTAL_STATES - 1;
    
    els.btnPlayPause.addEventListener('click', togglePlay);
    
    els.btnStepFwd.addEventListener('click', () => {
        pausePlayback();
        if (currentStep < TOTAL_STATES - 1) updateVisualization(currentStep + 1);
    });
    
    els.btnStepBack.addEventListener('click', () => {
        pausePlayback();
        if (currentStep > 0) updateVisualization(currentStep - 1);
    });
    
    els.btnReset.addEventListener('click', () => {
        pausePlayback();
        updateVisualization(0);
    });
    
    els.timelineSlider.addEventListener('input', (e) => {
        pausePlayback();
        updateVisualization(parseInt(e.target.value));
    });
}

function togglePlay() {
    if (isPlaying) {
        pausePlayback();
    } else {
        if (currentStep >= TOTAL_STATES - 1) updateVisualization(0); // Loop
        isPlaying = true;
        els.btnPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
        
        animationTimer = setInterval(() => {
            if (currentStep < TOTAL_STATES - 1) {
                updateVisualization(currentStep + 1);
            } else {
                pausePlayback();
            }
        }, 150); // Speed: 150ms per state calculation
    }
}

function pausePlayback() {
    isPlaying = false;
    els.btnPlayPause.innerHTML = '<i class="fas fa-play"></i>';
    clearInterval(animationTimer);
}

/**
 * Core rendering logic.
 * In a nested loop scenario for (x) for (y) for (z), the flat index is:
 * index = (x * Y * Z) + (y * Z) + z
 */
function updateVisualization(targetStep) {
    currentStep = targetStep;
    
    // Update UI HUD
    els.timelineSlider.value = currentStep;
    els.timelineProgress.textContent = `${currentStep + 1} / ${TOTAL_STATES}`;
    
    // Decode 1D index back to 3D coords for the HUD Display
    // Note: Depends on loop nesting order. Assuming x outer, y middle, z inner.
    let temp = currentStep;
    const z = temp % GRID_SIZE;
    temp = Math.floor(temp / GRID_SIZE);
    const y = temp % GRID_SIZE;
    temp = Math.floor(temp / GRID_SIZE);
    const x = temp % GRID_SIZE;
    
    els.currentStateDisplay.innerHTML = `State: <span style="color:var(--color-active);">dp[${x}][${y}][${z}]</span>`;
    
    // Update InstancedMesh Colors
    for (let i = 0; i < TOTAL_STATES; i++) {
        if (i < currentStep) {
            instancedMesh.setColorAt(i, COLOR_CALC); // Already computed
        } else if (i === currentStep) {
            instancedMesh.setColorAt(i, COLOR_ACTIVE); // Currently computing
        } else {
            instancedMesh.setColorAt(i, COLOR_UNCALC); // Pending computation
        }
    }
    
    // Crucial: Tell Three.js the colors array has changed
    instancedMesh.instanceColor.needsUpdate = true;
}
