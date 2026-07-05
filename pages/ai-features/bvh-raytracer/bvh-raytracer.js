/**
 * bvh-raytracer.js
 * Implements a WebGPU-accelerated Ray Tracer using a custom Bounding Volume Hierarchy (BVH).
 * Generates an asteroid field mesh, builds the BVH tree via spatial partitioning in JS,
 * flattens it for VRAM, and evaluates intersections using an iterative WGSL stack.
 */

document.addEventListener("DOMContentLoaded", () => {
    initWebGPURayTracer();
});

// App State
let device, context, canvasFormat;
let pipeline;
let bindGroup;
let renderConfigBuffer, cameraBuffer;
let isEngineReady = false;

// Geometry State
let rawTriangles = [];
let bvhNodes = [];
let bvhRootIndex = 0;

// Camera State (Orbit)
let camAzimuth = 0.5;
let camElevation = 0.3;
let camRadius = 25.0;
let isDragging = false;
let lastMouse = { x: 0, y: 0 };
let lastFrameTime = performance.now();
let animationFrameId;

// DOM Elements
const els = {
    canvas: document.getElementById('raytracerCanvas'),
    gpuStatusBadge: document.getElementById('gpuStatusBadge'),
    overlay: document.getElementById('overlay'),
    
    meshComplexity: document.getElementById('meshComplexity'),
    btnGenerateScene: document.getElementById('btnGenerateScene'),
    btnBuildBVH: document.getElementById('btnBuildBVH'),
    
    viewBtns: document.querySelectorAll('.view-btn'),
    modeDesc: document.getElementById('modeDesc'),
    
    fpsDisplay: document.getElementById('fpsDisplay'),
    bvhNodesDisplay: document.getElementById('bvhNodesDisplay'),
    bvhDepthDisplay: document.getElementById('bvhDepthDisplay'),
    buildTimeDisplay: document.getElementById('buildTimeDisplay')
};

let renderMode = 0; // 0: BVH, 1: Brute, 2: Heatmap

// ==========================================
// 1. INITIALIZATION & UI
// ==========================================
async function initWebGPURayTracer() {
    try {
        if (!navigator.gpu) throw new Error("WebGPU is not supported by your browser.");
        
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error("No appropriate WebGPU adapter found.");
        
        device = await adapter.requestDevice();
        
        context = els.canvas.getContext('webgpu');
        canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({ device: device, format: canvasFormat, alphaMode: 'premultiplied' });

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        bindEvents();

        isEngineReady = true;
        els.gpuStatusBadge.classList.add('ready');
        els.gpuStatusBadge.innerHTML = '<i class="fas fa-check-circle"></i> WebGPU Engine Active';
        
    } catch (err) {
        console.error(err);
        els.gpuStatusBadge.classList.add('error');
        els.gpuStatusBadge.innerHTML = '<i class="fas fa-times-circle"></i> Hardware Error';
        els.overlay.innerHTML = `<i class="fas fa-exclamation-triangle" style="color:#ef4444; font-size:3rem; margin-bottom:1rem;"></i><h2>${err.message}</h2>`;
    }
}

function resizeCanvas() {
    const rect = els.canvas.parentElement.getBoundingClientRect();
    els.canvas.width = rect.width * window.devicePixelRatio;
    els.canvas.height = rect.height * window.devicePixelRatio;
}

function bindEvents() {
    els.btnGenerateScene.addEventListener('click', generateAsteroidField);
    els.btnBuildBVH.addEventListener('click', buildBVH);
    
    els.viewBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!pipeline) return; // Not built yet
            els.viewBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderMode = parseInt(e.target.dataset.mode);
            
            if (renderMode === 0) els.modeDesc.innerHTML = "Fast $O(\\log N)$ rendering using AABB spatial partitioning.";
            else if (renderMode === 1) els.modeDesc.innerHTML = "Naive $O(N)$ execution. Warning: Huge FPS drop expected.";
            else els.modeDesc.innerHTML = "Debug View: Brightness correlates to the depth of BVH node traversals.";
            
            updateRenderConfig();
        });
    });

    // Camera Orbit Physics
    els.canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastMouse = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mouseup', () => isDragging = false);
    els.canvas.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMouse.x;
        const dy = e.clientY - lastMouse.y;
        camAzimuth -= dx * 0.01;
        camElevation = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, camElevation + dy * 0.01));
        lastMouse = { x: e.clientX, y: e.clientY };
        updateCameraBuffer();
    });
    els.canvas.addEventListener('wheel', (e) => {
        camRadius = Math.max(5.0, Math.min(100.0, camRadius + e.deltaY * 0.05));
        updateCameraBuffer();
    }, {passive: true});
}

// ==========================================
// 2. SCENE GENERATION
// ==========================================
function generateAsteroidField() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    els.overlay.classList.remove('hidden');
    els.overlay.innerHTML = '<i class="fas fa-spinner fa-spin pulse-icon"></i><h2>Generating Geometry...</h2>';

    // Offload to avoid freezing UI
    setTimeout(() => {
        const count = parseInt(els.meshComplexity.value);
        rawTriangles = [];
        
        // Generate random "asteroids" (clusters of triangles)
        const numAsteroids = count / 10;
        
        for (let i = 0; i < numAsteroids; i++) {
            // Random position in a spherical shell
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 5 + Math.random() * 10;
            const cx = r * Math.sin(phi) * Math.cos(theta);
            const cy = r * Math.sin(phi) * Math.sin(theta);
            const cz = r * Math.cos(phi);
            
            const color = [
                0.2 + Math.random() * 0.5, // R
                0.2 + Math.random() * 0.5, // G
                0.5 + Math.random() * 0.5  // B
            ];

            // Generate 10 triangles per asteroid
            for (let j = 0; j < 10; j++) {
                const s = 1.0 + Math.random() * 0.5; // Size
                const v0 = [cx + (Math.random()-0.5)*s, cy + (Math.random()-0.5)*s, cz + (Math.random()-0.5)*s];
                const v1 = [cx + (Math.random()-0.5)*s, cy + (Math.random()-0.5)*s, cz + (Math.random()-0.5)*s];
                const v2 = [cx + (Math.random()-0.5)*s, cy + (Math.random()-0.5)*s, cz + (Math.random()-0.5)*s];
                
                // Calculate centroid for BVH sorting
                const centroid = [
                    (v0[0] + v1[0] + v2[0]) / 3,
                    (v0[1] + v1[1] + v2[1]) / 3,
                    (v0[2] + v1[2] + v2[2]) / 3
                ];

                rawTriangles.push({ v0, v1, v2, color, centroid });
            }
        }

        els.btnBuildBVH.disabled = false;
        els.overlay.innerHTML = '<i class="fas fa-check-circle" style="color:var(--bvh-success);"></i><h2>Geometry Ready</h2><p>Click "Build BVH" to compute spatial partitions.</p>';
    }, 50);
}

// ==========================================
// 3. BVH CONSTRUCTION
// ==========================================
function updateAABB(node) {
    node.aabbMin = [Infinity, Infinity, Infinity];
    node.aabbMax = [-Infinity, -Infinity, -Infinity];

    for (let i = node.firstTri; i < node.firstTri + node.triCount; i++) {
        const tri = rawTriangles[i];
        for (let j = 0; j < 3; j++) {
            node.aabbMin[j] = Math.min(node.aabbMin[j], tri.v0[j], tri.v1[j], tri.v2[j]);
            node.aabbMax[j] = Math.max(node.aabbMax[j], tri.v0[j], tri.v1[j], tri.v2[j]);
        }
    }
}

function buildBVH() {
    els.btnBuildBVH.disabled = true;
    els.btnGenerateScene.disabled = true;
    els.overlay.innerHTML = '<i class="fas fa-sitemap pulse-icon"></i><h2>Constructing BVH...</h2>';

    setTimeout(() => {
        const startTime = performance.now();
        bvhNodes = [];
        
        // Root node encompasses all triangles
        let root = {
            leftFirst: 0,
            triCount: rawTriangles.length,
            firstTri: 0, // Temp var for builder
            depth: 0
        };
        bvhNodes.push(root);
        updateAABB(root);

        let maxDepth = 0;

        // Iterative builder to avoid deep recursion limits
        let stack = [0]; // Store indices of bvhNodes
        
        while (stack.length > 0) {
            let nodeIdx = stack.pop();
            let node = bvhNodes[nodeIdx];
            
            maxDepth = Math.max(maxDepth, node.depth);

            // Terminate leaf if 2 or fewer triangles
            if (node.triCount <= 2) continue;

            // Find longest axis to split (Spatial Median Split)
            const extent = [
                node.aabbMax[0] - node.aabbMin[0],
                node.aabbMax[1] - node.aabbMin[1],
                node.aabbMax[2] - node.aabbMin[2]
            ];
            
            let axis = 0;
            if (extent[1] > extent[0]) axis = 1;
            if (extent[2] > extent[extent[1] > extent[0] ? 1 : 0]) axis = 2;

            const splitPos = node.aabbMin[axis] + extent[axis] * 0.5;

            // Partition triangles in-place (Lomuto partition scheme)
            let i = node.firstTri;
            let j = i + node.triCount - 1;
            
            while (i <= j) {
                if (rawTriangles[i].centroid[axis] < splitPos) {
                    i++;
                } else {
                    // Swap
                    let temp = rawTriangles[i];
                    rawTriangles[i] = rawTriangles[j];
                    rawTriangles[j] = temp;
                    j--;
                }
            }

            let leftCount = i - node.firstTri;
            if (leftCount === 0 || leftCount === node.triCount) continue; // Split failed, leave as leaf

            // Create Children
            let leftChildIdx = bvhNodes.length;
            let rightChildIdx = leftChildIdx + 1;
            
            let leftChild = { firstTri: node.firstTri, triCount: leftCount, leftFirst: 0, depth: node.depth + 1 };
            let rightChild = { firstTri: i, triCount: node.triCount - leftCount, leftFirst: 0, depth: node.depth + 1 };
            
            updateAABB(leftChild);
            updateAABB(rightChild);
            
            bvhNodes.push(leftChild);
            bvhNodes.push(rightChild);
            
            // Convert current node to Internal Node
            node.leftFirst = leftChildIdx;
            node.triCount = 0; // 0 indicates internal node to the shader
            
            stack.push(rightChildIdx);
            stack.push(leftChildIdx);
        }

        const buildTime = (performance.now() - startTime).toFixed(1);
        els.buildTimeDisplay.textContent = buildTime;
        els.bvhNodesDisplay.textContent = bvhNodes.length.toLocaleString();
        els.bvhDepthDisplay.textContent = maxDepth;

        setupWebGPUPipeline();
    }, 50);
}

// ==========================================
// 4. WEBGPU PIPELINE & DATA FLATTENING
// ==========================================
async function setupWebGPUPipeline() {
    
    // Flatten Data into ArrayBuffers based on strict WGSL 16-byte alignment rules
    // Triangles: vec4(v0, pad), vec4(v1, pad), vec4(v2, pad), vec4(color, pad) -> 64 bytes per tri
    const triBufferArray = new Float32Array(rawTriangles.length * 16);
    for (let i = 0; i < rawTriangles.length; i++) {
        const t = rawTriangles[i];
        const offset = i * 16;
        triBufferArray.set([...t.v0, 0], offset);
        triBufferArray.set([...t.v1, 0], offset + 4);
        triBufferArray.set([...t.v2, 0], offset + 8);
        triBufferArray.set([...t.color, 0], offset + 12);
    }

    // BVH Nodes: vec4(min, leftFirst), vec4(max, triCount) -> 32 bytes per node
    const bvhBufferArray = new Float32Array(bvhNodes.length * 8);
    for (let i = 0; i < bvhNodes.length; i++) {
        const n = bvhNodes[i];
        const offset = i * 8;
        // leftFirst is uint32, but we can store it in Float32Array as it converts safely up to 2^24
        bvhBufferArray.set([...n.aabbMin, n.leftFirst], offset);
        bvhBufferArray.set([...n.aabbMax, n.triCount], offset + 4);
    }

    // Create GPU Buffers
    const makeGPUBuffer = (data, usage) => {
        const buffer = device.createBuffer({ size: data.byteLength, usage, mappedAtCreation: true });
        new Float32Array(buffer.getMappedRange()).set(data);
        buffer.unmap();
        return buffer;
    };

    const gpuTriBuffer = makeGPUBuffer(triBufferArray, GPUBufferUsage.STORAGE);
    const gpuBvhBuffer = makeGPUBuffer(bvhBufferArray, GPUBufferUsage.STORAGE);
    
    // Uniforms: Camera (pos:vec3, pad, right:vec3, pad, up:vec3, pad, forward:vec3, pad) = 64 bytes
    cameraBuffer = device.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    
    // Config: Mode (u32), TriCount (u32), padding -> 16 bytes
    renderConfigBuffer = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

    // --- WGSL SHADER CODE ---
    const shaderCode = `
        struct Triangle {
            v0: vec3<f32>,
            v1: vec3<f32>,
            v2: vec3<f32>,
            color: vec3<f32>
        };

        struct BVHNode {
            aabbMin: vec3<f32>,
            leftFirst: u32,
            aabbMax: vec3<f32>,
            triCount: u32
        };

        struct Camera {
            pos: vec4<f32>,
            right: vec4<f32>,
            up: vec4<f32>,
            forward: vec4<f32>
        };

        struct Config {
            mode: u32,
            numTris: u32,
        };

        @group(0) @binding(0) var<storage, read> triangles: array<Triangle>;
        @group(0) @binding(1) var<storage, read> bvh: array<BVHNode>;
        @group(0) @binding(2) var<uniform> camera: Camera;
        @group(0) @binding(3) var<uniform> config: Config;

        // Möller–Trumbore ray-triangle intersection
        fn intersectTriangle(orig: vec3<f32>, dir: vec3<f32>, tri: Triangle) -> f32 {
            let edge1 = tri.v1 - tri.v0;
            let edge2 = tri.v2 - tri.v0;
            let h = cross(dir, edge2);
            let a = dot(edge1, h);
            
            if (a > -0.0001 && a < 0.0001) { return -1.0; }
            let f = 1.0 / a;
            let s = orig - tri.v0;
            let u = f * dot(s, h);
            if (u < 0.0 || u > 1.0) { return -1.0; }
            
            let q = cross(s, edge1);
            let v = f * dot(dir, q);
            if (v < 0.0 || u + v > 1.0) { return -1.0; }
            
            let t = f * dot(edge2, q);
            if (t > 0.0001) { return t; }
            return -1.0;
        }

        // Slab method for AABB
        fn intersectAABB(orig: vec3<f32>, invDir: vec3<f32>, bMin: vec3<f32>, bMax: vec3<f32>) -> bool {
            let t0 = (bMin - orig) * invDir;
            let t1 = (bMax - orig) * invDir;
            let tmin = min(t0, t1);
            let tmax = max(t0, t1);
            let tnear = max(max(tmin.x, tmin.y), tmin.z);
            let tfar = min(min(tmax.x, tmax.y), tmax.z);
            return tfar >= tnear && tfar > 0.0;
        }

        @vertex fn vs_main(@builtin(vertex_index) id: u32) -> @builtin(position) vec4<f32> {
            // Generate full screen triangle
            let uv = vec2<f32>(vec2<u32>((id << 1u) & 2u, id & 2u));
            return vec4<f32>(uv * 2.0 - 1.0, 0.0, 1.0);
        }

        @fragment fn fs_main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
            // Compute screen UV
            // Assuming viewport resolution is uniform in WebGPU fragCoord, map it roughly.
            let uv = (fragCoord.xy / 800.0) * 2.0 - 1.0; // Approximation for aspect ratio
            
            let rayDir = normalize(camera.forward.xyz + uv.x * camera.right.xyz - uv.y * camera.up.xyz);
            let invDir = 1.0 / rayDir;
            
            var tMin = 999999.0;
            var hitTri = -1;
            var heat = 0u;

            if (config.mode == 1u) {
                // BRUTE FORCE O(N)
                for(var i = 0u; i < config.numTris; i++) {
                    heat++;
                    let t = intersectTriangle(camera.pos.xyz, rayDir, triangles[i]);
                    if (t > 0.0 && t < tMin) {
                        tMin = t;
                        hitTri = i32(i);
                    }
                }
            } else {
                // ACCELERATED BVH O(log N)
                var stack: array<u32, 64>;
                var stackPtr = 0u;
                stack[stackPtr] = 0u; // Push root
                stackPtr++;

                while(stackPtr > 0u) {
                    stackPtr--;
                    let nodeIdx = stack[stackPtr];
                    let node = bvh[nodeIdx];
                    
                    heat++; // Track AABB tests for heatmap
                    
                    if (!intersectAABB(camera.pos.xyz, invDir, node.aabbMin, node.aabbMax)) { continue; }
                    
                    if (node.triCount > 0u) {
                        // Leaf Node
                        for(var i = 0u; i < node.triCount; i++) {
                            heat++;
                            let triIdx = node.leftFirst + i;
                            let t = intersectTriangle(camera.pos.xyz, rayDir, triangles[triIdx]);
                            if (t > 0.0 && t < tMin) {
                                tMin = t;
                                hitTri = i32(triIdx);
                            }
                        }
                    } else {
                        // Internal Node - Push children
                        stack[stackPtr] = node.leftFirst; stackPtr++;
                        stack[stackPtr] = node.leftFirst + 1u; stackPtr++;
                    }
                }
            }

            // Output shading
            if (config.mode == 2u) {
                // Heatmap Mode
                let intensity = f32(heat) / 150.0; // Scale heat
                return vec4<f32>(intensity, intensity * 0.2, 0.5 - intensity, 1.0);
            }

            if (hitTri != -1) {
                let col = triangles[hitTri].color;
                // Basic fake diffuse lighting based on depth
                let shade = max(0.2, 1.0 - (tMin / 50.0));
                return vec4<f32>(col * shade, 1.0);
            }

            // Background space color
            return vec4<f32>(0.02, 0.04, 0.09, 1.0);
        }
    `;

    const shaderModule = device.createShaderModule({ code: shaderCode });

    pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: { module: shaderModule, entryPoint: 'vs_main' },
        fragment: { 
            module: shaderModule, 
            entryPoint: 'fs_main',
            targets: [{ format: canvasFormat }]
        },
        primitive: { topology: 'triangle-list' }
    });

    bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: gpuTriBuffer } },
            { binding: 1, resource: { buffer: gpuBvhBuffer } },
            { binding: 2, resource: { buffer: cameraBuffer } },
            { binding: 3, resource: { buffer: renderConfigBuffer } }
        ]
    });

    updateRenderConfig();
    updateCameraBuffer();
    
    els.overlay.classList.add('hidden');
    els.btnGenerateScene.disabled = false;
    els.viewBtns.forEach(b => b.disabled = false);

    if(!animationFrameId) renderLoop();
}

function updateRenderConfig() {
    if (!renderConfigBuffer) return;
    const configData = new Uint32Array([renderMode, rawTriangles.length, 0, 0]);
    device.queue.writeBuffer(renderConfigBuffer, 0, configData);
}

function updateCameraBuffer() {
    if (!cameraBuffer) return;
    
    // Spherical to Cartesian
    const px = camRadius * Math.sin(camAzimuth) * Math.cos(camElevation);
    const py = camRadius * Math.sin(camElevation);
    const pz = camRadius * Math.cos(camAzimuth) * Math.cos(camElevation);
    
    // Calculate basis vectors
    const forward = [-px, -py, -pz]; // Look at origin
    let len = Math.hypot(forward[0], forward[1], forward[2]);
    forward[0] /= len; forward[1] /= len; forward[2] /= len;
    
    const worldUp = [0, 1, 0];
    const right = [
        worldUp[1]*forward[2] - worldUp[2]*forward[1],
        worldUp[2]*forward[0] - worldUp[0]*forward[2],
        worldUp[0]*forward[1] - worldUp[1]*forward[0]
    ];
    len = Math.hypot(right[0], right[1], right[2]);
    right[0] /= len; right[1] /= len; right[2] /= len;
    
    const up = [
        forward[1]*right[2] - forward[2]*right[1],
        forward[2]*right[0] - forward[0]*right[2],
        forward[0]*right[1] - forward[1]*right[0]
    ];

    const camData = new Float32Array([
        px, py, pz, 0,
        right[0], right[1], right[2], 0,
        up[0], up[1], up[2], 0,
        forward[0], forward[1], forward[2], 0
    ]);
    
    device.queue.writeBuffer(cameraBuffer, 0, camData);
}

// ==========================================
// 5. RENDER LOOP
// ==========================================
function renderLoop(time) {
    if (!isEngineReady || !pipeline) return;

    // Calculate FPS
    const dt = time - lastFrameTime;
    lastFrameTime = time;
    if (dt > 0) els.fpsDisplay.textContent = Math.round(1000 / dt);

    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: textureView,
            clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store'
        }]
    });

    renderPass.setPipeline(pipeline);
    renderPass.setBindGroup(0, bindGroup);
    // Draw 3 vertices to create a full screen triangle
    renderPass.draw(3, 1, 0, 0); 
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);

    animationFrameId = requestAnimationFrame(renderLoop);
}
