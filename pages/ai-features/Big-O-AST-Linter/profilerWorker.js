self.onmessage = function(e) {
    const { code, sizes, editorId } = e.data;
    const results = [];
    
    // We expect the user's code to define a function `sort(arr)`
    // Wrap the user's code so we can call their sort function safely.
    const wrapper = `
        ${code}
        return (typeof sort === "function") ? sort : null;
    `;
    
    let sortFn;
    try {
        sortFn = new Function(wrapper)();
    } catch (err) {
        self.postMessage({ error: "Compilation error: " + err.message, editorId });
        return;
    }
    
    if (!sortFn) {
        self.postMessage({ error: "Could not find a function named 'sort'.", editorId });
        return;
    }

    // Warm-up run (JIT warmup)
    try {
        const warmupArr = Array.from({ length: 50 }, () => Math.random() * 100);
        sortFn(warmupArr);
    } catch(err) {
        self.postMessage({ error: "Execution error during warm-up: " + err.message, editorId });
        return;
    }

    // Actual profiling
    for (const n of sizes) {
        try {
            // Generate random array of size n
            const arr = Array.from({ length: n }, () => Math.random() * 10000);
            
            const start = performance.now();
            sortFn(arr);
            const end = performance.now();
            
            results.push({ n, timeMs: end - start });
        } catch (err) {
            self.postMessage({ error: "Execution error at N=" + n + ": " + err.message, editorId });
            return;
        }
    }
    
    self.postMessage({ success: true, editorId, results });
};
