/**
 * Performance Monitor for High-FPS Algorithm Animations
 * Tracks and displays FPS, frame time, and optionally DOM operations.
 */

export class PerformanceMonitor {
    constructor(container = document.body) {
        this.container = container;
        this.hud = document.createElement('div');
        
        // Inline styles for zero-dependency HUD
        this.hud.style.position = 'fixed';
        this.hud.style.top = '70px'; // Below navbar
        this.hud.style.right = '20px';
        this.hud.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
        this.hud.style.color = '#38bdf8';
        this.hud.style.padding = '10px 15px';
        this.hud.style.borderRadius = '8px';
        this.hud.style.fontFamily = 'monospace';
        this.hud.style.fontSize = '12px';
        this.hud.style.zIndex = '9999';
        this.hud.style.backdropFilter = 'blur(4px)';
        this.hud.style.border = '1px solid rgba(56, 189, 248, 0.3)';
        this.hud.style.pointerEvents = 'none'; // Don't block clicks
        this.hud.style.display = 'flex';
        this.hud.style.flexDirection = 'column';
        this.hud.style.gap = '4px';

        this.fpsElement = document.createElement('div');
        this.renderTimeElement = document.createElement('div');
        
        this.hud.appendChild(this.fpsElement);
        this.hud.appendChild(this.renderTimeElement);
        this.container.appendChild(this.hud);

        // State
        this.frames = 0;
        this.lastTime = performance.now();
        this.lastFpsUpdateTime = this.lastTime;
        this.currentFps = 0;
        
        this.isRunning = false;
        this.loop = this.loop.bind(this);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.lastFpsUpdateTime = this.lastTime;
        requestAnimationFrame(this.loop);
    }

    stop() {
        this.isRunning = false;
    }

    destroy() {
        this.stop();
        if (this.hud && this.hud.parentElement) {
            this.hud.parentElement.removeChild(this.hud);
        }
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        this.frames++;
        const delta = timestamp - this.lastFpsUpdateTime;

        // Update HUD every 500ms
        if (delta >= 500) {
            this.currentFps = Math.round((this.frames * 1000) / delta);
            
            // Color coding based on FPS
            if (this.currentFps >= 55) this.fpsElement.style.color = '#4ade80'; // Green
            else if (this.currentFps >= 30) this.fpsElement.style.color = '#facc15'; // Yellow
            else this.fpsElement.style.color = '#f87171'; // Red
            
            this.fpsElement.innerText = `FPS: ${this.currentFps}`;
            
            // Frame time estimation (naive)
            const frameTimeMs = (1000 / this.currentFps).toFixed(1);
            this.renderTimeElement.innerText = `Frame: ${frameTimeMs}ms`;

            this.frames = 0;
            this.lastFpsUpdateTime = timestamp;
        }

        requestAnimationFrame(this.loop);
    }
}
