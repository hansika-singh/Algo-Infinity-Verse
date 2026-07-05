/**
 * quantum-simulator.js
 * Combines WebGPU (WGSL compute shaders) for complex matrix multiplication,
 * Three.js for 3D Bloch sphere rendering, and HTML5 Drag-and-Drop for circuit building.
 */

document.addEventListener("DOMContentLoaded", () => {
    initQuantumSimulator();
});

// ==========================================
// 1. STATE & CONSTANTS
// ==========================================
const QUBITS = 3;
const STEPS = 5;

// The Circuit State Grid [qubitIndex][stepIndex] -> 'H', 'X', 'Y', 'Z', null
let circuit = Array.from({ length: QUBITS }, () => Array(STEPS).fill(null));

// Complex numbers: [Real, Imaginary]
// Basis states: |0⟩ = [1,0, 0,0], |1⟩ = [0,0, 1,0]
let stateVectors = [
    [1.0, 0.0, 0.0, 0.0], // q0
    [1.0, 0.0, 0.0, 0.0], // q1
    [1.0, 0.0, 0.0, 0.0]  // q2
];

// Quantum Gate Unitary Matrices (2x2 Complex)
// Format: [R00, I00, R01, I01, R10, I10, R11, I11]
const s2 = 1.0 / Math.sqrt(2);
const GATES = {
    'H': [s2, 0, s2, 0, s2, 0, -s2, 0],
    'X': [0, 0, 1, 0, 1, 0, 0, 0],
    'Y': [0, 0, 0, -1, 0, 1, 0, 0],
    'Z': [1, 0, 0, 0, 0, 0, -1, 0]
};

// App Elements
const els = {
    gpuStatusBadge: document.getElementById('gpuStatusBadge'),
    btnClearCircuit: document.getElementById('btnClearCircuit'),
    btnExecute: document.getElementById('btnExecute'),
    wgslConsole: document.getElementById('wgslConsole'),
    
    vecQ0: document.getElementById('vecQ0'),
    vecQ1: document.getElementById('vecQ1'),
    vecQ2: document.getElementById('vecQ2'),
    
    probChart: document.getElementById('probChart'),
    blochContainer: document.getElementById('blochContainer')
};

let gpuDevice = null;
let computePipeline = null;

let probChartInstance = null;

// Three.js specific
let scene, camera, renderer, controls;
let sphereArrows = []; // The state vectors mapped to the 3D spheres

// ==========================================
// 2. INITIALIZATION
// ==========================================
async function initQuantumSimulator() {
    initChart();
    initThreeJS();
    setupDragAndDrop();
    
    els.btnClearCircuit.addEventListener('click', clearCircuit);
    els.btnExecute.addEventListener('click', executeCircuit);

    try {
        await initWebGPU();
    } catch (e) {
        logGPU(`WebGPU Not Supported: ${e.message}. Falling back to JS Math.`, "error");
        els.gpuStatusBadge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> JS Fallback (No WebGPU)';
        els.gpuStatusBadge.className = 'engine-badge fallback';
    }
}

function logGPU(msg, type = "") {
    els.wgslConsole.innerHTML += `<div class="${type}">> ${msg}</div>`;
    els.wgslConsole.scrollTop = els.wgslConsole.scrollHeight;
}

// ==========================================
// 3. WEBGPU SHADER ENGINE
// ==========================================
async function initWebGPU() {
    if (!navigator.gpu) throw new Error("navigator.gpu is missing");
    
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error("No adapter found");
    
    gpuDevice = await adapter.requestDevice();
    
    els.gpuStatusBadge.innerHTML = '<i class="fas fa-check-circle"></i> WebGPU Accelerated';
    els.gpuStatusBadge.className = 'engine-badge ready';
    logGPU("WebGPU Device requested successfully.");

    // Define WGSL Compute Shader for 2x2 Complex Matrix * 2x1 Complex Vector
    const wgslCode = `
        struct Complex {
            r: f32,
            i: f32
        };

        @group(0) @binding(0) var<storage, read> stateIn: array<Complex>;
        @group(0) @binding(1) var<storage, read> gateMat: array<Complex>;
        @group(0) @binding(2) var<storage, read_write> stateOut: array<Complex>;

        // Complex multiplication: (a+bi)(c+di) = (ac-bd) + (ad+bc)i
        fn mult(a: Complex, b: Complex) -> Complex {
            return Complex(a.r * b.r - a.i * b.i, a.r * b.i + a.i * b.r);
        }

        // Complex addition
        fn add(a: Complex, b: Complex) -> Complex {
            return Complex(a.r + b.r, a.i + b.i);
        }

        @compute @workgroup_size(1)
        fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
            // Read input vector components
            let a0 = stateIn[0]; // alpha
            let a1 = stateIn[1]; // beta

            // Read gate matrix components
            let u00 = gateMat[0]; let u01 = gateMat[1];
            let u10 = gateMat[2]; let u11 = gateMat[3];

            // Matrix multiplication
            stateOut[0] = add(mult(u00, a0), mult(u01, a1));
            stateOut[1] = add(mult(u10, a0), mult(u11, a1));
        }
    `;

    const shaderModule = gpuDevice.createShaderModule({ code: wgslCode });
    computePipeline = await gpuDevice.createComputePipelineAsync({
        layout: 'auto',
        compute: { module: shaderModule, entryPoint: 'main' }
    });
    
    logGPU("WGSL Compute Shader compiled.");
}

// Executes a single gate on a state vector using WebGPU
async function runGateGPU(stateArray, gateArray) {
    if (!gpuDevice || !computePipeline) return runGateJS(stateArray, gateArray); // Fallback
    
    // Buffers: 2 Complex numbers = 4 floats = 16 bytes
    // Matrix: 4 Complex numbers = 8 floats = 32 bytes
    const stateBufferIn = gpuDevice.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    const gateBuffer = gpuDevice.createBuffer({ size: 32, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    const stateBufferOut = gpuDevice.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });

    // Write data
    gpuDevice.queue.writeBuffer(stateBufferIn, 0, new Float32Array(stateArray));
    gpuDevice.queue.writeBuffer(gateBuffer, 0, new Float32Array(gateArray));

    // Bind Group
    const bindGroup = gpuDevice.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: stateBufferIn } },
            { binding: 1, resource: { buffer: gateBuffer } },
            { binding: 2, resource: { buffer: stateBufferOut } }
        ]
    });

    // Encode Commands
    const commandEncoder = gpuDevice.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(computePipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(1);
    passEncoder.end();

    // Copy result back to readable buffer
    const readBuffer = gpuDevice.createBuffer({ size: 16, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
    commandEncoder.copyBufferToBuffer(stateBufferOut, 0, readBuffer, 0, 16);

    // Submit
    gpuDevice.queue.submit([commandEncoder.finish()]);

    // Read result
    await readBuffer.mapAsync(GPUMapMode.READ);
    const result = new Float32Array(readBuffer.getMappedRange());
    const finalState = Array.from(result);
    
    readBuffer.unmap();
    stateBufferIn.destroy();
    gateBuffer.destroy();
    stateBufferOut.destroy();
    readBuffer.destroy();

    return finalState;
}

// Fallback if WebGPU is not supported
function runGateJS(state, gate) {
    const a0r = state[0], a0i = state[1];
    const a1r = state[2], a1i = state[3];

    const u00r = gate[0], u00i = gate[1];
    const u01r = gate[2], u01i = gate[3];
    const u10r = gate[4], u10i = gate[5];
    const u11r = gate[6], u11i = gate[7];

    const r0 = (u00r*a0r - u00i*a0i) + (u01r*a1r - u01i*a1i);
    const i0 = (u00r*a0i + u00i*a0r) + (u01r*a1i + u01i*a1r);
    
    const r1 = (u10r*a0r - u10i*a0i) + (u11r*a1r - u11i*a1i);
    const i1 = (u10r*a0i + u10i*a0r) + (u11r*a1i + u11i*a1r);

    return [r0, i0, r1, i1];
}

// ==========================================
// 4. CIRCUIT DRAG & DROP
// ==========================================
function setupDragAndDrop() {
    let draggedGate = null;

    document.querySelectorAll('.gate-node').forEach(gate => {
        gate.addEventListener('dragstart', (e) => {
            draggedGate = e.target.dataset.gate;
        });
    });

    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            if (draggedGate) {
                const q = parseInt(zone.dataset.q);
                const step = parseInt(zone.dataset.step);
                circuit[q][step] = draggedGate;
                renderCircuitDOM();
            }
        });
    });
}

function renderCircuitDOM() {
    document.querySelectorAll('.drop-zone').forEach(zone => {
        const q = parseInt(zone.dataset.q);
        const step = parseInt(zone.dataset.step);
        const gate = circuit[q][step];
        
        zone.innerHTML = '';
        if (gate) {
            const div = document.createElement('div');
            div.className = `placed-gate gate-${gate}`;
            div.textContent = gate;
            // Remove on click
            div.addEventListener('click', () => {
                circuit[q][step] = null;
                renderCircuitDOM();
            });
            zone.appendChild(div);
        }
    });
}

function clearCircuit() {
    circuit = Array.from({ length: QUBITS }, () => Array(STEPS).fill(null));
    renderCircuitDOM();
    executeCircuit(); // Reset vectors to |0>
}

// ==========================================
// 5. EXECUTION & PROBABILITY CALCULATION
// ==========================================
async function executeCircuit() {
    els.btnExecute.disabled = true;
    els.btnExecute.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Computing...';
    els.wgslConsole.innerHTML = '> Compiling timeline...<br>';
    
    // Reset vectors to |0⟩
    stateVectors = [
        [1.0, 0.0, 0.0, 0.0],
        [1.0, 0.0, 0.0, 0.0],
        [1.0, 0.0, 0.0, 0.0]
    ];

    // Evaluate step by step
    for (let step = 0; step < STEPS; step++) {
        let stepLog = `Step ${step}: `;
        let executedAny = false;
        
        for (let q = 0; q < QUBITS; q++) {
            const gateStr = circuit[q][step];
            if (gateStr) {
                executedAny = true;
                stepLog += `Q${q}[${gateStr}] `;
                const gateMatrix = GATES[gateStr];
                
                // Dispatch to GPU
                stateVectors[q] = await runGateGPU(stateVectors[q], gateMatrix);
            }
        }
        if(executedAny) logGPU(stepLog);
    }

    logGPU("Circuit execution finished. Calculating probabilities.", "success");
    
    updateTelemetry();
    updateBlochSpheres();

    els.btnExecute.disabled = false;
    els.btnExecute.innerHTML = '<i class="fas fa-bolt"></i> Execute Circuit';
}

function formatComplex(r, i) {
    const rStr = Math.abs(r) < 0.001 ? "0.00" : r.toFixed(2);
    let iStr = Math.abs(i) < 0.001 ? "0.00" : i.toFixed(2);
    if (i >= 0) return `${rStr} + ${iStr}i`;
    return `${rStr} - ${Math.abs(i).toFixed(2)}i`;
}

function updateTelemetry() {
    // Update Text Vectors
    stateVectors.forEach((vec, q) => {
        const a0 = formatComplex(vec[0], vec[1]);
        const a1 = formatComplex(vec[2], vec[3]);
        document.getElementById(`vecQ${q}`).textContent = `(${a0})|0⟩ + (${a1})|1⟩`;
    });

    // Update Probabilities (|alpha|^2, |beta|^2)
    const probs = [];
    stateVectors.forEach(vec => {
        const p0 = (vec[0]*vec[0] + vec[1]*vec[1]);
        const p1 = (vec[2]*vec[2] + vec[3]*vec[3]);
        probs.push(p0 * 100);
        probs.push(p1 * 100);
    });

    probChartInstance.data.datasets[0].data = probs;
    probChartInstance.update();
}

function initChart() {
    const ctx = els.probChart.getContext('2d');
    probChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['q0|0⟩', 'q0|1⟩', 'q1|0⟩', 'q1|1⟩', 'q2|0⟩', 'q2|1⟩'],
            datasets: [{
                label: 'Probability (%)',
                data: [100, 0, 100, 0, 100, 0],
                backgroundColor: [
                    'rgba(192, 132, 252, 0.6)', 'rgba(192, 132, 252, 0.6)',
                    'rgba(45, 212, 191, 0.6)', 'rgba(45, 212, 191, 0.6)',
                    'rgba(244, 114, 182, 0.6)', 'rgba(244, 114, 182, 0.6)'
                ],
                borderColor: [
                    '#c084fc', '#c084fc',
                    '#2dd4bf', '#2dd4bf',
                    '#f472b6', '#f472b6'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 100, grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#cbd5e1' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// ==========================================
// 6. THREE.JS 3D BLOCH SPHERES
// ==========================================
function initThreeJS() {
    scene = new THREE.Scene();
    const aspect = els.blochContainer.clientWidth / els.blochContainer.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(0, 2, 8);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(els.blochContainer.clientWidth, els.blochContainer.clientHeight);
    els.blochContainer.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dLight = new THREE.DirectionalLight(0xffffff, 1);
    dLight.position.set(5, 5, 5);
    scene.add(dLight);

    // Create 3 Spheres
    const spacing = 2.5;
    for (let i = 0; i < QUBITS; i++) {
        const group = new THREE.Group();
        group.position.x = (i - 1) * spacing;
        
        // Sphere surface (Wireframe + Transparent Shell)
        const geo = new THREE.SphereGeometry(1, 16, 16);
        const matTrans = new THREE.MeshPhongMaterial({ color: 0x334155, transparent: true, opacity: 0.2, depthWrite: false });
        const matWire = new THREE.MeshBasicMaterial({ color: 0x64748b, wireframe: true, transparent: true, opacity: 0.3 });
        
        group.add(new THREE.Mesh(geo, matTrans));
        group.add(new THREE.Mesh(geo, matWire));

        // Axes (X, Y, Z)
        const axisMat = new THREE.LineBasicMaterial({ color: 0x475569 });
        
        // Z axis (Up/Down) |0> to |1>
        const zGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 1, 0)]);
        group.add(new THREE.Line(zGeo, axisMat));
        
        // X axis
        const xGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)]);
        group.add(new THREE.Line(xGeo, axisMat));
        
        // Y axis
        const yGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 1)]);
        group.add(new THREE.Line(yGeo, axisMat));

        // State Vector Arrow (Starts pointing UP to |0>)
        const arrowGroup = new THREE.Group();
        
        // Shaft
        const cylGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.9);
        const arrMat = new THREE.MeshPhongMaterial({ color: 0xc084fc, emissive: 0xc084fc });
        const cyl = new THREE.Mesh(cylGeo, arrMat);
        cyl.position.y = 0.45;
        arrowGroup.add(cyl);
        
        // Head
        const coneGeo = new THREE.ConeGeometry(0.08, 0.2);
        const cone = new THREE.Mesh(coneGeo, arrMat);
        cone.position.y = 0.95;
        arrowGroup.add(cone);
        
        group.add(arrowGroup);
        sphereArrows.push(arrowGroup);

        scene.add(group);
    }

    window.addEventListener('resize', () => {
        if (!els.blochContainer) return;
        camera.aspect = els.blochContainer.clientWidth / els.blochContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(els.blochContainer.clientWidth, els.blochContainer.clientHeight);
    });

    animateThreeJS();
}

function animateThreeJS() {
    requestAnimationFrame(animateThreeJS);
    controls.update();
    renderer.render(scene, camera);
}

// Convert complex state [a0r, a0i, a1r, a1i] to 3D Cartesian coords for the Bloch Sphere
function updateBlochSpheres() {
    stateVectors.forEach((vec, idx) => {
        const a0r = vec[0], a0i = vec[1];
        const a1r = vec[2], a1i = vec[3];

        // Math: |psi> = cos(theta/2)|0> + e^(i phi) sin(theta/2)|1>
        const p0 = a0r*a0r + a0i*a0i; // prob |0>
        const theta = 2 * Math.acos(Math.sqrt(p0));
        
        // Calculate phase difference
        let phase0 = Math.atan2(a0i, a0r);
        let phase1 = Math.atan2(a1i, a1r);
        let phi = phase1 - phase0;

        // Spherical to Cartesian (Three.js Y is UP)
        // Normal math: z = cos(theta), x = sin(theta)cos(phi), y = sin(theta)sin(phi)
        // Threejs mapping: Y = Z (up/down), X = X, Z = -Y (depth)
        
        const rY = Math.cos(theta);
        const rX = Math.sin(theta) * Math.cos(phi);
        const rZ = -(Math.sin(theta) * Math.sin(phi));

        // Apply rotation to arrow group
        const targetVector = new THREE.Vector3(rX, rY, rZ);
        
        // Use quaternion to smoothly rotate from current orientation (Up = 0,1,0) to target
        const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), targetVector.normalize());
        sphereArrows[idx].quaternion.copy(quaternion);
        
        // Color update based on qubit
        const colors = [0xc084fc, 0x2dd4bf, 0xf472b6];
        sphereArrows[idx].children.forEach(mesh => {
            mesh.material.color.setHex(colors[idx]);
            mesh.material.emissive.setHex(colors[idx]);
        });
    });
}
