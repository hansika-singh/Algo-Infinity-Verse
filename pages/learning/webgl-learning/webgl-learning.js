document.addEventListener("DOMContentLoaded", () => {
    // 1. Setup Typing Animations
    const typingContainer = document.getElementById("typingTextWebGL");
    if (typingContainer) {
        const phrases = ["GPU Buffer Matrix...", "Custom Raster Shaders...", "Vector Transform Matrices..."];
        let pIdx = 0, cIdx = 0, isDeleting = false;
        function type() {
            const current = phrases[pIdx];
            typingContainer.textContent = isDeleting ? current.substring(0, cIdx - 1) : current.substring(0, cIdx + 1);
            cIdx += isDeleting ? -1 : 1;
            let speed = isDeleting ? 40 : 80;
            if (!isDeleting && cIdx === current.length) { speed = 2000; isDeleting = true; }
            else if (isDeleting && cIdx === 0) { isDeleting = false; pIdx = (pIdx + 1) % phrases.length; speed = 400; }
            setTimeout(type, speed);
        }
        type();
    }

    // 2. Initialize Core WebGL Live Sandbox Context
    const canvas = document.getElementById("webglCanvas");
    const gl = canvas.getContext("webgl");
    const editor = document.getElementById("shaderEditor");
    const consoleLogs = document.getElementById("compilerConsole");
    let animationActive = false;
    let timeUniformLocation = null;
    let startTime = Date.now();

    if (!gl) {
        consoleLogs.textContent = "Error: WebGL not supported on this platform hardware loop.";
        consoleLogs.className = "compiler-console output-error";
        return;
    }

    // Baseline Vertex Shader configuration
    const vsSource = `
        attribute vec2 position;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    // Initialize full canvas full resolution buffer geometries
    const vertices = new Float32Array([-1, -1,  1, -1, -1,  1, -1,  1,  1, -1,  1,  1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    function compileAndRender() {
        const fsSource = `
            precision mediump float;
            uniform float u_time;
            ${editor.value}
        `;

        // Create GPU program targets
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vsSource);
        gl.compileShader(vs);

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fsSource);
        gl.compileShader(fs);

        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            consoleLogs.textContent = "GLSL Compiler Error: " + gl.getShaderInfoLog(fs);
            consoleLogs.className = "compiler-console output-error";
            return;
        }

        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        gl.useProgram(program);
        consoleLogs.textContent = "Shader Pipeline: Successfully compiled and linked onto GPU core.";
        consoleLogs.className = "compiler-console output-clean";

        const positionLocation = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        timeUniformLocation = gl.getUniformLocation(program, "u_time");
        
        // Initial Draw
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // Render Animation loops
    function renderLoop() {
        if (!animationActive) return;
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (timeUniformLocation) {
            gl.uniform1f(timeUniformLocation, (Date.now() - startTime) / 1000.0);
        }
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(renderLoop);
    }

    // Trigger compilations
    document.getElementById("compileBtn").addEventListener("click", compileAndRender);

    document.getElementById("animateBtn").addEventListener("click", () => {
        animationActive = !animationActive;
        const btn = document.getElementById("animateBtn");
        if (animationActive) {
            btn.innerHTML = '<i class="fas fa-pause"></i> Stop Effect';
            editor.value = `void main() {
  float wave = sin(gl_FragCoord.x * 0.05 + u_time * 3.0) * 0.5 + 0.5;
  gl_FragColor = vec4(0.1, wave, 0.9, 1.0);
}`;
            compileAndRender();
            renderLoop();
        } else {
            btn.innerHTML = '<i class="fas fa-bolt"></i> Wave Effect';
        }
    });

    // Run baseline initial engine compilation load
    compileAndRender();

    // 3. Simple Static Quiz Mechanics
    const topicsCompleted = new Set();
    document.querySelectorAll(".webgl-quiz-card").forEach(card => {
        const checkBtn = card.querySelector(".btn-quiz-check");
        const feedback = card.querySelector(".quiz-feedback");
        checkBtn.addEventListener("click", () => {
            const selected = card.querySelector('input[type="radio"]:checked');
            if (selected && selected.value === "A") {
                feedback.textContent = "Correct! Triangles successfully rasterized.";
                feedback.className = "quiz-feedback correct";
                topicsCompleted.add(card.closest(".webgl-lesson").getAttribute("data-topic"));
                
                // Update bar metrics
                const percent = Math.round((topicsCompleted.size / 4) * 100);
                document.getElementById("progressCount").textContent = topicsCompleted.size;
                document.getElementById("progressFill").style.width = `${percent}%`;
                document.getElementById("progressPercent").textContent = `${percent}%`;
            } else {
                feedback.textContent = "Pipeline execution stalled. Verify options and re-check.";
                feedback.className = "quiz-feedback wrong";
            }
        });
    });

    // Clear loader overlays
    const loader = document.getElementById("loading-screen");
    if (loader) setTimeout(() => loader.remove(), 600);
});
