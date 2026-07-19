/**
 * Auth Visual — ASCII Art Terminal for Login / Signup pages
 * Renders Matrix rain on a <canvas>
 * using monospace font for a retro terminal look.
 */

const CHARS_RAIN =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテト';

/* ──────────────────────────────────────────────
 * Main renderer
 * ────────────────────────────────────────────── */
export function initAuthVisual(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return null;

  /* ---- create canvas ---- */
  const canvas = document.createElement('canvas');
  canvas.className = 'auth-visual-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let W, H, cols, rows, charW, charH, fontSize;

  function resize() {
    const rect = container.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    fontSize = Math.max(10, Math.min(16, Math.floor(W / 72)));
    ctx.font = `bold ${fontSize}px 'Fira Code', 'Courier New', monospace`;
    const metrics = ctx.measureText('W');
    charW = metrics.width || fontSize * 0.6;
    charH = fontSize * 1.35;

    cols = Math.floor(W / charW) - 1;
    rows = Math.floor(H / charH) - 1;

    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.font = `bold ${fontSize}px 'Fira Code', 'Courier New', monospace`;
  }

  resize();

  /* ---- state ---- */
  let time = 0;

  // Matrix drops
  const drops = [];
  // Extra drops for density — 2.2x columns for thick rain
  const extraDropCount = Math.floor(cols * 2.2);

  function initDrops() {
    drops.length = 0;
    for (let i = 0; i < cols + extraDropCount; i++) {
      drops.push({
        x: Math.floor(Math.random() * cols),
        y: Math.random() * rows * 1.5 - rows * 0.25,
        speed: 0.8 + Math.random() * 3.5,
        length: 6 + Math.floor(Math.random() * 14),
        chars: [],
        bright: Math.random() > 0.7,
      });
    }
  }
  initDrops();

  /* ---- rendering ---- */
  function render() {
    time += 0.025;

    // Background
    ctx.fillStyle = '#060612';
    ctx.fillRect(0, 0, W, H);

    // Subtle scanlines
    ctx.fillStyle = 'rgba(255,255,255,0.015)';
    for (let r = 0; r < rows; r += 2) {
      ctx.fillRect(0, r * charH, W, 1);
    }

    /* ---- Matrix Rain ---- */
    for (const drop of drops) {
      // generate new char
      const ch = CHARS_RAIN[Math.floor(Math.random() * CHARS_RAIN.length)];
      drop.chars.unshift(ch);
      if (drop.chars.length > drop.length) drop.chars.pop();

      drop.y += drop.speed * 0.12;
      if (drop.y > rows + 2) {
        drop.y = -drop.length - Math.random() * 5;
        drop.speed = 0.8 + Math.random() * 3.5;
        drop.length = 6 + Math.floor(Math.random() * 14);
        drop.bright = Math.random() > 0.4;
      }

      for (let i = 0; i < drop.chars.length; i++) {
        const row = Math.floor(drop.y) - i;
        if (row < 0 || row >= rows || drop.x < 0 || drop.x >= cols) continue;

        let color;
        if (i === 0) {
          // Head — bright
          color = drop.bright
            ? 'rgba(255, 255, 255, 0.98)'
            : 'rgba(210, 185, 255, 0.95)'; // pastel lavender
        } else if (i < 3) {
          // near-head: bright lavender → soft indigo
          color = `rgba(${195 - i * 25}, ${165 - i * 20}, ${255 - i * 25}, ${0.85 - i * 0.1})`;
        } else {
          // trail: fade from purple to deep indigo
          const fade = Math.max(0.06, 0.55 - (i / drop.length) * 0.55);
          const b = Math.max(80, Math.floor(220 - i * 10));
          color = `rgba(${Math.floor(b * 0.7)}, ${Math.floor(b * 0.5)}, ${b}, ${fade})`;
        }

        ctx.fillStyle = color;
        ctx.fillText(drop.chars[i], drop.x * charW, (row + 1) * charH);
      }
    }


    /* ---- corner decorations ---- */
    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.font = '10px monospace';
    const corner = '>_ TERMINAL v2.inf ∞';
    ctx.fillText(corner, 1, charH * 2);

    const status = `UPTIME ${Math.floor(time * 2)}s :: CHAOS ${drops.length} :: ∞ 0x${(Math.floor(time * 100) % 0xFFFF).toString(16).toUpperCase().padStart(4, '0')}`;
    ctx.fillText(status, 1, rows * charH - 2);
    ctx.font = `bold ${fontSize}px 'Fira Code', 'Courier New', monospace`;

    /* ---- subtle vignette overlay ---- */
    const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  /* ---- loop ---- */
  let rafId;
  let lastTime = 0;
  const fps = 24;
  const interval = 1000 / fps;

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    if (delta >= interval) {
      lastTime = timestamp - (delta % interval);
      render(timestamp);
    }
    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame(loop);

  /* ---- resize handler ---- */
  let prevCols = cols;
  const ro = new ResizeObserver(() => {
    resize();
    // Only re-init drops if column count actually changed
    if (cols !== prevCols) {
      initDrops();
      prevCols = cols;
    }
    // Clamp existing drops to new bounds
    for (const d of drops) {
      if (d.x >= cols) d.x = cols - 1;
    }

  });
  ro.observe(container);

  /* ---- cleanup ---- */
  return () => {
    cancelAnimationFrame(rafId);
    ro.disconnect();
  };
}
