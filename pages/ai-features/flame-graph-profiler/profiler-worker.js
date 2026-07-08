// profiler-worker.js
// ==========================================
// TRACING ENGINE (Instrumentation)
// ==========================================

const Tracer = {
    stack: [],
    root: null,
    
    reset() {
        this.stack = [];
        this.root = null;
    },

    enter(name) {
        const node = { 
            name: name, 
            startTime: performance.now(), 
            children: [], 
            totalTime: 0, 
            exclusiveTime: 0 
        };

        if (this.stack.length > 0) {
            this.stack[this.stack.length - 1].children.push(node);
        } else {
            this.root = node;
        }
        this.stack.push(node);
    },

    exit() {
        if (this.stack.length === 0) return;
        
        const node = this.stack.pop();
        node.totalTime = performance.now() - node.startTime;
        
        // Calculate exclusive time (total time minus the time spent in children)
        const childrenTime = node.children.reduce((sum, child) => sum + child.totalTime, 0);
        
        // Prevent negative exclusive time due to JS float precision limits
        node.exclusiveTime = Math.max(0.001, node.totalTime - childrenTime);
    },

    getTraceData() {
        return this.root;
    }
};

// Expose globally so new Function() can use it
self.Tracer = Tracer;

// Mock heavy workload
self.simulateHeavyWork = function(ms) {
    const start = performance.now();
    while (performance.now() - start < ms) {
        // block thread
    }
};

self.onmessage = function(e) {
    const { code } = e.data;
    
    Tracer.reset();
    
    try {
        // Execute the user's code in a restricted worker context
        // Shadow sensitive globals to prevent unauthorized access
        const execWrapper = new Function(
            'fetch',
            'XMLHttpRequest',
            'WebSocket',
            'indexedDB',
            'importScripts',
            `
            "use strict";
            ${code}
            `
        );
        execWrapper(undefined, undefined, undefined, undefined, undefined);
        
        self.postMessage({ success: true, traceData: Tracer.getTraceData() });
    } catch (err) {
        self.postMessage({ success: false, error: err.message });
    }
};
