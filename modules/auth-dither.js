export function initAuthDither(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'dither-bg-canvas';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.maskImage = 'linear-gradient(100deg, black 0%, black 50%, transparent 100%)';
  canvas.style.webkitMaskImage = 'linear-gradient(100deg, black 0%, black 50%, transparent 100%)';
  canvas.setAttribute('aria-hidden', 'true');
  container.insertBefore(canvas, container.firstChild);

  // Set z-index of auth-panel to relative so it sits on top
  const panel = container.querySelector('.auth-panel');
  if (panel) {
    panel.style.position = 'relative';
    panel.style.zIndex = '10';
  }

  const gl = canvas.getContext('webgl2');
  if (!gl) {
    console.warn('WebGL2 not supported, skipping dither background');
    return;
  }

  const vsSource = `#version 300 es
    in vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // Use a subtle pastel purple for front color #9b82f3
  // and deep background color #0a0a1a to match the theme better than #001122
  const fsSource = `#version 300 es
    precision highp float;
    out vec4 outColor;
    
    uniform float u_time;
    uniform vec2 u_resolution;
    
    const float pxSize = 3.0;
    
    // Theme colors matching Algo Infinity Verse but keeping the dark/pastel contrast
    const vec3 colorBack = vec3(0.04, 0.04, 0.10); // #0a0a1a
    const vec3 colorFront = vec3(0.61, 0.51, 0.95); // #9b82f3 subtle pastel purple
    
    int dither[64] = int[](
      0, 32, 8, 40, 2, 34, 10, 42,
      48, 16, 56, 24, 50, 18, 58, 26,
      12, 44, 4, 36, 14, 46, 6, 38,
      60, 28, 52, 20, 62, 30, 54, 22,
      3, 35, 11, 43, 1, 33, 9, 41,
      51, 19, 59, 27, 49, 17, 57, 25,
      15, 47, 7, 39, 13, 45, 5, 37,
      63, 31, 55, 23, 61, 29, 53, 21
    );

    void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      vec2 coord = floor(fragCoord / pxSize) * pxSize;
      vec2 uv = coord / u_resolution;
      
      // Wave shape generator
      vec2 p = uv * 2.0 - 1.0;
      p.x *= u_resolution.x / u_resolution.y;
      
      // Create organic wave patterns
      float wave = sin(p.x * 2.5 + u_time * 0.6) * 0.5 + 0.5;
      float wave2 = cos(p.y * 2.0 - u_time * 0.8) * 0.5 + 0.5;
      float wave3 = sin((p.x + p.y) * 1.5 + u_time * 0.5) * 0.5 + 0.5;
      
      float val = (wave + wave2 + wave3) / 3.0;
      
      // Enhance contrast
      val = smoothstep(0.3, 0.7, val);

      // Dither pattern application
      int x = int(mod(coord.x / pxSize, 8.0));
      int y = int(mod(coord.y / pxSize, 8.0));
      int index = y * 8 + x;
      float limit = (float(dither[index]) + 1.0) / 65.0;
      
      vec3 color = (val > limit) ? colorFront : colorBack;
      
      // Add a vignette effect for better focus on the center
      float dist = length(uv - 0.5);
      color *= smoothstep(0.8, 0.2, dist);

      outColor = vec4(color, 1.0);
    }
  `;

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return;
  }

  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
     1.0,  1.0
  ]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const timeLocation = gl.getUniformLocation(program, 'u_time');
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');

  let animationFrameId;
  let startTime = Date.now();

  function resize() {
    // Check if element is still in DOM
    if (!document.body.contains(canvas)) {
      cancelAnimationFrame(animationFrameId);
      return;
    }
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener('resize', resize);
  resize();

  function render() {
    if (!document.body.contains(canvas)) return;
    
    const currentTime = (Date.now() - startTime) / 1000.0;
    
    gl.uniform1f(timeLocation, currentTime);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    animationFrameId = requestAnimationFrame(render);
  }

  render();
}
