self.onmessage = function(e) {
    const { code, sizes, editorId } = e.data;
    const results = [];
    let timeline = [];
    let maxMemTimeline = [];
    
    // Define global tracker state
    self.__memTracker = {
        currentMemory: 0,
        maxMemory: 0,
        stepCount: 0,
        timeline: [],
        
        // Downsample factor to avoid huge arrays
        downsampleRate: 1,
        
        reset: function() {
            this.currentMemory = 0;
            this.maxMemory = 0;
            this.stepCount = 0;
            this.timeline = [];
        },
        
        track: function(type, count, metadata) {
            this.stepCount++;
            let bytes = 0;
            
            if (type === 'array') {
                bytes = count * 8; // approx 8 bytes per element
            } else if (type === 'object') {
                bytes = count * 16; // approx 16 bytes per key
            } else if (type === 'call') {
                bytes = 64; // approx 64 bytes per call stack frame
            } else if (type === 'return') {
                bytes = -64; // free call stack frame
            }

            this.currentMemory += bytes;
            if (this.currentMemory < 0) this.currentMemory = 0;
            
            if (this.currentMemory > this.maxMemory) {
                this.maxMemory = this.currentMemory;
            }

            // Record timeline (downsampling will be applied later or here)
            // To prevent memory overflow during profiling, only keep max 1000 data points
            if (this.stepCount % this.downsampleRate === 0 && this.timeline.length < 2000) {
                this.timeline.push(this.currentMemory);
            }
        }
    };

    const wrapper = `
        let __t = self.__memTracker;
        function __track(type, size, val) {
            __t.track(type, size, val);
            return val;
        }
        function __call(name) {
            __t.track('call', 1);
        }
        function __ret(val) {
            __t.track('return', 1);
            return val;
        }

        ${code}

        // Return the first available function
        if (typeof solve === 'function') return solve;
        if (typeof sort === 'function') return sort;
        if (typeof search === 'function') return search;
        return null;
    `;

    let targetFn;
    try {
        targetFn = new Function(wrapper)();
    } catch (err) {
        self.postMessage({ error: "Compilation error: " + err.message, editorId });
        return;
    }

    if (!targetFn) {
        self.postMessage({ error: "Could not find a function named 'solve', 'sort', or 'search'.", editorId });
        return;
    }

    for (let i = 0; i < sizes.length; i++) {
        const n = sizes[i];
        const isLast = (i === sizes.length - 1);
        
        self.__memTracker.reset();
        self.__memTracker.downsampleRate = Math.max(1, Math.floor(n / 100)); // Dynamic downsampling

        try {
            // Generate input array
            const arr = Array.from({ length: n }, (_, idx) => idx);
            
            targetFn(arr, n/2); // n/2 as target for search algorithms
            
            results.push({ n, maxMemory: self.__memTracker.maxMemory });
            
            if (isLast) {
                maxMemTimeline = self.__memTracker.timeline;
            }
        } catch (err) {
            self.postMessage({ error: "Execution error at N=" + n + ": " + err.message, editorId });
            return;
        }
    }
    
    // Normalize timeline to a fixed length (e.g. 100 points) for chart rendering
    let finalTimeline = [];
    if (maxMemTimeline.length > 0) {
        const step = Math.max(1, Math.floor(maxMemTimeline.length / 100));
        for (let i = 0; i < maxMemTimeline.length; i += step) {
            finalTimeline.push(maxMemTimeline[i]);
        }
    }

    self.postMessage({ 
        success: true, 
        editorId, 
        results,
        timeline: finalTimeline,
        totalAllocations: self.__memTracker.stepCount
    });
};
