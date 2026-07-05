/**
 * fluid-solver.js
 * Implements an Eulerian Fluid Dynamics solver using WebGPU Compute Shaders.
 * Calculates Advection, Divergence, and Poisson Pressure projections in real-time.
 */

document.addEventListener("DOMContentLoaded", () => {
    initWebGPUFluid();
});

// Configuration
const SIM_RES = 512; // Internal simulation grid resolution

// App State
let device, context, canvasFormat;
let linearSampler;
let isInteracting = false;
let splatQueue = [];
let lastMouse = { x: 0, y: 0 };
let hueCounter = 0;
let lastFrameTime = performance.now();

// DOM Elements
const els = {
    canvas: document.getElementById('fluidCanvas'),
    engineStatusBadge: document.getElementById('engineStatusBadge'),
    overlay: document.getElementById('interactionOverlay'),
    
    jacobiIters: document.getElementById('jacobiIters'),
    jacobiVal: document.getElementById('jacobiVal'),
    dyeDecay: document.getElementById('dyeDecay'),
    dyeVal: document.getElementById('dyeVal'),
    velDecay: document.getElementById('velDecay'),
    velVal: document.getElementById('velVal'),
    displayMode: document.getElementById('displayMode'),
    
    btnClearFluid: document.getElementById('btnClearFluid'),
    fpsDisplay: document.getElementById('fpsDisplay')
};

// Ping-Pong Texture Helper
class FBO {
    constructor(dev, width, height, format) {
        this.read = createTexture(dev, width, height, format);
        this.write = createTexture(dev, width, height, format);
    }
    swap() {
        let temp = this.read;
        this.read = this.write;
        this.write = temp;
    }
}

// Global Resources
let dyeFBO, velocityFBO, pressureFBO;
let divergenceTex;
let advectConfigBuf, splatConfigBuf, renderConfigBuf;
let advectPipeline, divergencePipeline, jacobiPipeline, subtractPipeline, splatPipeline, renderPipeline;

// ==========================================
// 1. WEBGPU INITIALIZATION & PIPELINE SETUP
// ==========================================
async function initWebGPUFluid() {
    try {
        if (!navigator.gpu) throw new Error("WebGPU not supported in this browser.");
        
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error("No appropriate WebGPU adapter found.");
        
        device = await adapter.requestDevice();
        
        // Canvas Setup
        context = els.canvas.getContext('webgpu');
        canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({ device: device, format: canvasFormat, alphaMode: 'premultiplied' });

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // UI Binding
        bindEvents();

        // Build Engine
        allocateResources();
        buildPipelines();

        els.engineStatusBadge.classList.add('ready');
        els.engineStatusBadge.innerHTML = '<i class="fas fa-check-circle"></i> WebGPU Engine Active';

        requestAnimationFrame(renderLoop);
        
    } catch (err) {
        console.error(err);
        els.engineStatusBadge.classList.add('error');
        els.engineStatusBadge.innerHTML = '<i class="fas fa-times-circle"></i> Hardware Error';
        els.overlay.innerHTML = `<i class="fas fa-exclamation-triangle" style="color:#ef4444; font-size:3rem; margin-bottom:1rem;"></i><h2>${err.message}</h2>`;
    }
}

function resizeCanvas() {
    const rect = els.canvas.parentElement.getBoundingClientRect();
    els.canvas.width = rect.width * window.devicePixelRatio;
    els.canvas.height = rect.height * window.devicePixelRatio;
}

function bindEvents() {
    els.jacobiIters.addEventListener('input', e => els.jacobiVal.textContent = e.target.value);
    els.dyeDecay.addEventListener('input', e => els.dyeVal.textContent = parseFloat(e.target.value).toFixed(3));
    els.velDecay.addEventListener('input', e => els.velVal.textContent = parseFloat(e.target.value).toFixed(3));

    els.btnClearFluid.addEventListener('click', allocateResources); // Quick way to zero memory

    // Mouse Interaction
    const handleSplat = (e) => {
        if (!isInteracting) return;
        els.overlay.style.opacity = '0'; // Hide overlay on first touch

        const rect = els.canvas.getBoundingClientRect();
        // Calculate position in SIM_RES space (Y axis is inverted from window to WebGPU text coords)
        const x = ((e.clientX - rect.left) / rect.width) * SIM_RES;
        const y = (1.0 - (e.clientY - rect.top) / rect.height) * SIM_RES;
        
        const dx = e.clientX - lastMouse.x;
        const dy = -(e.clientY - lastMouse.y); // Invert DY for WebGPU logic

        hueCounter = (hueCounter + 1) % 360;
        const color = hslToRgb(hueCounter, 1, 0.6);

        // Queue Dye Splat
        splatQueue.push({ pos: [x, y], color: [color[0], color[1], color[2], 1.0], radius: 400.0, target: 'dye' });
        
        // Queue Velocity Splat (Scale vector for force)
        splatQueue.push({ pos: [x, y], color: [dx * 5.0, dy * 5.0, 0.0, 1.0], radius: 400.0, target: 'velocity' });

        lastMouse = { x: e.clientX, y: e.clientY };
    };

    els.canvas.addEventListener('mousedown', (e) => {
        isInteracting = true;
        lastMouse = { x: e.clientX, y: e.clientY };
        handleSplat(e);
    });
    
    window.addEventListener('mouseup', () => isInteracting = false);
    els.canvas.addEventListener('mousemove', handleSplat);
}

// ==========================================
// 2. RESOURCE & SHADER ALLOCATION
// ==========================================

function createTexture(dev, width, height, format) {
    return dev.createTexture({
        size: [width, height, 1],
        format: format,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST
    });
}

function allocateResources() {
    linearSampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
    
    dyeFBO = new FBO(device, SIM_RES, SIM_RES, 'rgba16float');
    velocityFBO = new FBO(device, SIM_RES, SIM_RES, 'rgba16float');
    pressureFBO = new FBO(device, SIM_RES, SIM_RES, 'rgba16float');
    divergenceTex = createTexture(device, SIM_RES, SIM_RES, 'rgba16float');

    // Uniforms
    advectConfigBuf = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    splatConfigBuf = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    renderConfigBuf = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
}

function buildPipelines() {
    // Helper to compile shaders
    const createCompute = (code) => device.createComputePipeline({
        layout: 'auto', compute: { module: device.createShaderModule({ code }), entryPoint: 'main' }
    });

    // 1. Splat Shader
    splatPipeline = createCompute(`
        struct SplatUniforms { pos: vec2<f32>, radius: f32, pad: f32, color: vec4<f32> };
        @group(0) @binding(0) var targetIn: texture_2d<f32>;
        @group(0) @binding(1) var targetOut: texture_storage_2d<rgba16float, write>;
        @group(0) @binding(2) var<uniform> config: SplatUniforms;

        @compute @workgroup_size(16, 16)
        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
            let size = textureDimensions(targetIn);
            if (id.x >= size.x || id.y >= size.y) { return; }
            let coord = vec2<i32>(id.xy);
            let p = vec2<f32>(coord) - config.pos;
            let d = exp(-dot(p, p) / config.radius);
            let base = textureLoad(targetIn, coord, 0).xyz;
            let outVal = base + config.color.xyz * d;
            textureStore(targetOut, coord, vec4<f32>(outVal, 1.0));
        }
    `);

    // 2. Advection Shader (Semi-Lagrangian)
    advectPipeline = createCompute(`
        struct AdvectUniforms { dt: f32, decay: f32, pad1: f32, pad2: f32 };
        @group(0) @binding(0) var samp: sampler;
        @group(0) @binding(1) var velocityTex: texture_2d<f32>;
        @group(0) @binding(2) var targetIn: texture_2d<f32>;
        @group(0) @binding(3) var targetOut: texture_storage_2d<rgba16float, write>;
        @group(0) @binding(4) var<uniform> config: AdvectUniforms;

        @compute @workgroup_size(16, 16)
        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
            let size = textureDimensions(targetIn);
            if (id.x >= size.x || id.y >= size.y) { return; }
            let coord = vec2<i32>(id.xy);
            let uv = (vec2<f32>(coord) + 0.5) / vec2<f32>(size);
            let vel = textureSampleLevel(velocityTex, samp, uv, 0.0).xy;
            
            let pastUv = uv - (vel * config.dt / vec2<f32>(size));
            let val = textureSampleLevel(targetIn, samp, pastUv, 0.0).xyz;
            textureStore(targetOut, coord, vec4<f32>(val * config.decay, 1.0));
        }
    `);

    // 3. Divergence Shader
    divergencePipeline = createCompute(`
        @group(0) @binding(0) var velocityTex: texture_2d<f32>;
        @group(0) @binding(1) var divOut: texture_storage_2d<rgba16float, write>;

        @compute @workgroup_size(16, 16)
        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
            let size = textureDimensions(velocityTex);
            if (id.x >= size.x || id.y >= size.y) { return; }
            let coord = vec2<i32>(id.xy);
            
            let L = textureLoad(velocityTex, max(coord - vec2<i32>(1, 0), vec2<i32>(0, 0)), 0).xy;
            let R = textureLoad(velocityTex, min(coord + vec2<i32>(1, 0), vec2<i32>(size.x - 1, size.y - 1)), 0).xy;
            let B = textureLoad(velocityTex, max(coord - vec2<i32>(0, 1), vec2<i32>(0, 0)), 0).xy;
            let T = textureLoad(velocityTex, min(coord + vec2<i32>(0, 1), vec2<i32>(size.x - 1, size.y - 1)), 0).xy;

            let div = 0.5 * (R.x - L.x + T.y - B.y);
            textureStore(divOut, coord, vec4<f32>(div, 0.0, 0.0, 1.0));
        }
    `);

    // 4. Jacobi Pressure Solver
    jacobiPipeline = createCompute(`
        @group(0) @binding(0) var pressureIn: texture_2d<f32>;
        @group(0) @binding(1) var divTex: texture_2d<f32>;
        @group(0) @binding(2) var pressureOut: texture_storage_2d<rgba16float, write>;

        @compute @workgroup_size(16, 16)
        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
            let size = textureDimensions(pressureIn);
            if (id.x >= size.x || id.y >= size.y) { return; }
            let coord = vec2<i32>(id.xy);

            let L = textureLoad(pressureIn, max(coord - vec2<i32>(1, 0), vec2<i32>(0, 0)), 0).x;
            let R = textureLoad(pressureIn, min(coord + vec2<i32>(1, 0), vec2<i32>(size.x - 1, size.y - 1)), 0).x;
            let B = textureLoad(pressureIn, max(coord - vec2<i32>(0, 1), vec2<i32>(0, 0)), 0).x;
            let T = textureLoad(pressureIn, min(coord + vec2<i32>(0, 1), vec2<i32>(size.x - 1, size.y - 1)), 0).x;
            let div = textureLoad(divTex, coord, 0).x;

            let p = (L + R + B + T - div) * 0.25;
            textureStore(pressureOut, coord, vec4<f32>(p, 0.0, 0.0, 1.0));
        }
    `);

    // 5. Gradient Subtraction
    subtractPipeline = createCompute(`
        @group(0) @binding(0) var pressureTex: texture_2d<f32>;
        @group(0) @binding(1) var velocityIn: texture_2d<f32>;
        @group(0) @binding(2) var velocityOut: texture_storage_2d<rgba16float, write>;

        @compute @workgroup_size(16, 16)
        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
            let size = textureDimensions(pressureTex);
            if (id.x >= size.x || id.y >= size.y) { return; }
            let coord = vec2<i32>(id.xy);

            let L = textureLoad(pressureTex, max(coord - vec2<i32>(1, 0), vec2<i32>(0, 0)), 0).x;
            let R = textureLoad(pressureTex, min(coord + vec2<i32>(1, 0), vec2<i32>(size.x - 1, size.y - 1)), 0).x;
            let B = textureLoad(pressureTex, max(coord - vec2<i32>(0, 1), vec2<i32>(0, 0)), 0).x;
            let T = textureLoad(pressureTex, min(coord + vec2<i32>(0, 1), vec2<i32>(size.x - 1, size.y - 1)), 0).x;

            let v = textureLoad(velocityIn, coord, 0).xy;
            let newV = v - vec2<f32>(R - L, T - B) * 0.5;
            textureStore(velocityOut, coord, vec4<f32>(newV, 0.0, 1.0));
        }
    `);

    // 6. Display Render Pipeline
    renderPipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: device.createShaderModule({
                code: `
                    struct VertexOutput { @builtin(position) pos: vec4<f32>, @location(0) uv: vec2<f32> };
                    @vertex fn main(@builtin(vertex_index) id: u32) -> VertexOutput {
                        let uv = vec2<f32>(vec2<u32>((id << 1u) & 2u, id & 2u));
                        var out: VertexOutput;
                        out.uv = vec2<f32>(uv.x, 1.0 - uv.y); // Flip Y to match WebGPU texture format
                        out.pos = vec4<f32>(uv * 2.0 - 1.0, 0.0, 1.0);
                        return out;
                    }
                `
            }),
            entryPoint: 'main'
        },
        fragment: {
            module: device.createShaderModule({
                code: `
                    struct RenderConfig { mode: u32, pad1: u32, pad2: u32, pad3: u32 };
                    @group(0) @binding(0) var tex: texture_2d<f32>;
                    @group(0) @binding(1) var samp: sampler;
                    @group(0) @binding(2) var<uniform> config: RenderConfig;

                    @fragment fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
                        let val = textureSample(tex, samp, uv).rgb;
                        if (config.mode == 1u) {
                            // Map velocity -1..1 to 0..1 for color visualization
                            return vec4<f32>(val * 0.5 + 0.5, 1.0);
                        }
                        return vec4<f32>(val, 1.0);
                    }
                `
            }),
            entryPoint: 'main',
            targets: [{ format: canvasFormat }]
        },
        primitive: { topology: 'triangle-list' }
    });
}

// Helper to create bindings cleanly
function createBindGroup(pipeline, resources) {
    return device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: resources.map((res, i) => ({
            binding: i,
            resource: res.buffer ? res : res.createView()
        }))
    });
}

// ==========================================
// 3. EXECUTION LOOP
// ==========================================
function renderLoop(time) {
    const dt = time - lastFrameTime;
    lastFrameTime = time;
    if (dt > 0) els.fpsDisplay.textContent = Math.round(1000 / dt);

    const commandEncoder = device.createCommandEncoder();
    const dispatchSize = Math.ceil(SIM_RES / 16);

    const runCompute = (pipeline, bg) => {
        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bg);
        pass.dispatchWorkgroups(dispatchSize, dispatchSize);
        pass.end();
    };

    // 1. Process Mouse Splats
    for (let s of splatQueue) {
        // Struct memory layout: pos(vec2), radius(f32), pad(f32), color(vec4)
        device.queue.writeBuffer(splatConfigBuf, 0, new Float32Array([
            s.pos[0], s.pos[1], s.radius, 0,
            s.color[0], s.color[1], s.color[2], s.color[3]
        ]));
        
        let target = s.target === 'dye' ? dyeFBO : velocityFBO;
        let bg = createBindGroup(splatPipeline, [target.read, target.write, { buffer: splatConfigBuf }]);
        runCompute(splatPipeline, bg);
        target.swap();
    }
    splatQueue = [];

    // 2. Advect Velocity
    device.queue.writeBuffer(advectConfigBuf, 0, new Float32Array([0.16, parseFloat(els.velDecay.value), 0, 0]));
    let bgAdvectVel = createBindGroup(advectPipeline, [linearSampler, velocityFBO.read, velocityFBO.read, velocityFBO.write, { buffer: advectConfigBuf }]);
    runCompute(advectPipeline, bgAdvectVel);
    velocityFBO.swap();

    // 3. Advect Dye
    device.queue.writeBuffer(advectConfigBuf, 0, new Float32Array([0.16, parseFloat(els.dyeDecay.value), 0, 0]));
    let bgAdvectDye = createBindGroup(advectPipeline, [linearSampler, velocityFBO.read, dyeFBO.read, dyeFBO.write, { buffer: advectConfigBuf }]);
    runCompute(advectPipeline, bgAdvectDye);
    dyeFBO.swap();

    // 4. Divergence
    let bgDiv = createBindGroup(divergencePipeline, [velocityFBO.read, divergenceTex]);
    runCompute(divergencePipeline, bgDiv);

    // 5. Jacobi (Pressure Solver)
    const iters = parseInt(els.jacobiIters.value);
    for (let i = 0; i < iters; i++) {
        let bgJacobi = createBindGroup(jacobiPipeline, [pressureFBO.read, divergenceTex, pressureFBO.write]);
        runCompute(jacobiPipeline, bgJacobi);
        pressureFBO.swap();
    }

    // 6. Gradient Subtraction
    let bgSub = createBindGroup(subtractPipeline, [pressureFBO.read, velocityFBO.read, velocityFBO.write]);
    runCompute(subtractPipeline, bgSub);
    velocityFBO.swap();

    // 7. Render to Canvas
    const mode = els.displayMode.value === 'dye' ? 0 : 1;
    device.queue.writeBuffer(renderConfigBuf, 0, new Uint32Array([mode, 0, 0, 0]));

    const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store'
        }]
    });
    
    let displayTex = mode === 0 ? dyeFBO.read : velocityFBO.read;
    let bgRender = createBindGroup(renderPipeline, [displayTex, linearSampler, { buffer: renderConfigBuf }]);
    
    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, bgRender);
    renderPass.draw(3, 1, 0, 0); // 3 vertices for fullscreen triangle
    renderPass.end();

    // Submit Commands
    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(renderLoop);
}

// Utility: HSL to RGB
function hslToRgb(h, s, l) {
    h /= 360;
    let r, g, b;
    if (s === 0) { r = g = b = l; } 
    else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [r, g, b];
}
