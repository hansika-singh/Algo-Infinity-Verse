/* Sorting Visualizer Styles */
:root {
    --glass-bg: #0f172a;
    --glass-border: #1e293b;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --dark-surface: #020617;
    
    /* Sorting Theme Colors */
    --sort-primary: #38bdf8; /* Sky Blue */
    --sort-primary-hover: #0284c7;
    --sort-danger: #ef4444;
    --panel-bg: #0b1121;

    /* Bar State Colors */
    --bar-base: #3b82f6;      /* Blue */
    --bar-compare: #eab308;   /* Yellow */
    --bar-swap: #ef4444;      /* Red */
    --bar-pivot: #a855f7;     /* Purple */
    --bar-sorted: #10b981;    /* Emerald */
}

body.sort-body {
    margin: 0;
    padding: 0;
    background-color: var(--dark-surface);
    color: var(--text-primary);
    font-family: 'Poppins', sans-serif;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* Navbar */
.sort-nav { height: 60px; padding: 0 1.5rem; background: rgba(2, 6, 23, 0.95); border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; z-index: 100; }
.nav-logo { font-family: 'Orbitron', sans-serif; font-weight: 700; font-size: 1.2rem; color: var(--sort-primary); }

.engine-badge { font-family: 'Fira Code', monospace; font-size: 0.85rem; color: var(--text-secondary); background: rgba(255,255,255,0.05); padding: 0.4rem 1rem; border-radius: 99px; border: 1px solid var(--glass-border); display: flex; align-items: center; gap: 0.5rem; transition: all 0.3s; }
.engine-badge.active { color: var(--sort-primary); background: rgba(56, 189, 248, 0.1); border-color: rgba(56, 189, 248, 0.3); box-shadow: 0 0 10px rgba(56, 189, 248, 0.2); }

/* Buttons & Inputs */
.btn { padding: 0.8rem 1rem; border-radius: 6px; font-family: 'Poppins', sans-serif; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.85rem; }
.btn-primary { background: var(--sort-primary); color: #020617; }
.btn-primary:hover:not(:disabled) { background: var(--sort-primary-hover); transform: translateY(-1px); box-shadow: 0 4px 15px rgba(56, 189, 248, 0.3); }
.btn-outline { background: transparent; border: 1px solid var(--glass-border); color: var(--text-primary); }
.btn-outline:hover:not(:disabled) { background: rgba(255,255,255,0.05); border-color: var(--text-secondary); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.w-100 { width: 100%; }

/* Workspace */
.sort-workspace { flex: 1; display: flex; overflow: hidden; background: #020617; }

/* Left Panel */
.panel-left { width: 350px; display: flex; flex-direction: column; background: var(--panel-bg); border-right: 1px solid var(--glass-border); z-index: 10; overflow-y: auto; }
.panel-header { padding: 1.2rem 1.5rem; background: #020617; border-bottom: 1px solid var(--glass-border); }
.panel-header h3 { margin: 0; font-family: 'Orbitron', sans-serif; font-size: 1.1rem; color: #fff; display: flex; align-items: center; gap: 0.5rem; }

.control-section { padding: 1.5rem; border-bottom: 1px solid var(--glass-border); display: flex; flex-direction: column; gap: 1.2rem; }
.input-group { display: flex; flex-direction: column; gap: 0.4rem; }
.input-group label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); font-family: 'Fira Code', monospace; display: flex; justify-content: space-between; align-items: center;}
.slider-val { color: var(--sort-primary); font-weight: 700; }
.input-group select { background: #020617; border: 1px solid #334155; color: #fff; padding: 0.6rem; border-radius: 6px; font-family: 'Poppins', sans-serif; font-size: 0.9rem; outline: none; }
.input-group select:focus { border-color: var(--sort-primary); }
.input-group input[type=range] { width: 100%; accent-color: var(--sort-primary); cursor: pointer; background: #334155; height: 6px; border-radius: 3px; outline: none; margin-top: 0.2rem; }
.input-group optgroup { background: #020617; color: var(--text-secondary); font-family: 'Fira Code', monospace; font-size: 0.8rem; }

.action-grid { display: flex; flex-direction: column; gap: 0.8rem; margin-top: 0.5rem; }

/* Info Section */
.info-section { padding: 1.5rem; flex: 1; }
.info-section h4 { margin: 0 0 1rem; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Fira Code', monospace; }
.info-content h5 { font-family: 'Orbitron', sans-serif; font-size: 1.2rem; color: #fff; margin: 0 0 0.5rem; }
.info-content p { font-size: 0.85rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 1.5rem; }

.complexity-grid { display: grid; gap: 0.5rem; background: rgba(0,0,0,0.3); border: 1px solid #1e293b; padding: 1rem; border-radius: 8px; }
.comp-item { display: flex; justify-content: space-between; font-family: 'Fira Code', monospace; font-size: 0.85rem; color: var(--text-secondary); }
.comp-item strong { color: var(--sort-primary); }

/* Right Panel (Visualization) */
.panel-right { flex: 1; display: flex; flex-direction: column; background: #020617; position: relative; }
.canvas-header { height: 50px; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--glass-border); display: flex; justify-content: center; align-items: center; padding: 0 1.5rem; z-index: 2; }

.legend { display: flex; gap: 1.5rem; flex-wrap: wrap; justify-content: center; }
.legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--text-secondary); font-family: 'Fira Code', monospace; }
.color-box { width: 12px; height: 12px; border-radius: 2px; }
.color-box.base { background: var(--bar-base); }
.color-box.compare { background: var(--bar-compare); }
.color-box.swap { background: var(--bar-swap); }
.color-box.pivot { background: var(--bar-pivot); }
.color-box.sorted { background: var(--bar-sorted); box-shadow: 0 0 8px var(--bar-sorted); }

.canvas-wrapper { flex: 1; position: relative; overflow: hidden; background-image: radial-gradient(circle at center, #0f172a 0%, #020617 100%); padding: 2rem; display: flex; align-items: flex-end; justify-content: center; }

/* Array Bars */
.bars-container { width: 100%; height: 100%; display: flex; align-items: flex-end; justify-content: center; margin: 0 auto; }
.array-bar { flex: 1; margin: 0 1px; background-color: var(--bar-base); border-radius: 4px 4px 0 0; transition: background-color 0.1s; /* Height transition removed for immediate algorithm response, but color transitions smooth things out */ }

@media (max-width: 900px) {
    .sort-workspace { flex-direction: column; overflow-y: auto; }
    .panel-left { width: 100%; border-right: none; border-bottom: 1px solid var(--glass-border); flex-shrink: 0; }
    .panel-right { min-height: 400px; flex: none; }
}
