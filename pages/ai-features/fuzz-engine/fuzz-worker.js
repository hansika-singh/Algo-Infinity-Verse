/**
 * fuzz-worker.js
 * web worker thread
 * Runs the aggressive property-based fuzzing loop in an isolated background thread.
 * * 1. Safely evaluates user code.
 * 2. Rapidly generates tens of thousands of random arrays based on properties.
 * 3. Compares the output of the user code against a known Perfect Reference Implementation.
 */

// --- The Reference (Perfect) Implementation ---
// We compare the user's output against this to determine correctness.
function referenceSolution(nums) {
    if (!nums || nums.length === 0) return 0;
    let maxSoFar = nums[0];
    let currentMax = nums[0];
    
    for(let i = 1; i < nums.length; i++) {
        currentMax = Math.max(nums[i], currentMax + nums[i]);
        maxSoFar = Math.max(maxSoFar, currentMax);
    }
    return maxSoFar;
}

// --- Data Generator ---
function generateRandomArray(maxLen, minVal, maxVal) {
    // Array length between 1 and maxLen
    const len = Math.floor(Math.random() * maxLen) + 1;
    const arr = new Array(len);
    for (let i = 0; i < len; i++) {
        // Value between minVal and maxVal inclusive
        arr[i] = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
    }
    return arr;
}

// --- Main Worker Listener ---
self.onmessage = (event) => {
    const msg = event.data;

    if (msg.type === 'start') {
        runFuzzer(msg.config);
    }
};

function runFuzzer(config) {
    let userFunc;

    try {
        // Evaluate user code safely in a restricted worker context
        // Shadow sensitive globals to prevent unauthorized access
        // This expects the user's code to declare a function named `maxSubArray`
        // We append the function name so eval returns the function reference.
        userFunc = new Function(
            'fetch',
            'XMLHttpRequest',
            'WebSocket',
            'indexedDB',
            'importScripts',
            `
            "use strict";
            ${config.code}
            return maxSubArray;
            `
        )(undefined, undefined, undefined, undefined, undefined);
        
        if (typeof userFunc !== 'function') {
            throw new Error("Could not find function 'maxSubArray'. Ensure your function name is correct.");
        }
    } catch (err) {
        self.postMessage({ type: 'error', error: err.toString() });
        return;
    }

    // Fuzzing Loop
    for (let i = 1; i <= config.iterations; i++) {
        // 1. Generate random input based on constraints
        const testInput = generateRandomArray(config.maxLen, config.minVal, config.maxVal);
        
        try {
            // 2. Execute both implementations
            const expectedOutput = referenceSolution(testInput);
            const actualOutput = userFunc(testInput);
            
            // 3. Compare Results
            if (expectedOutput !== actualOutput) {
                // CRASH DETECTED! Send payload to Main Thread
                self.postMessage({
                    type: 'fail',
                    input: testInput,
                    expected: expectedOutput,
                    actual: actualOutput
                });
                return; // Halt worker
            }
        } catch (err) {
            // User code threw an exception (e.g. TypeError on an edge case)
            self.postMessage({
                type: 'fail',
                input: testInput,
                expected: "Valid execution (number)",
                actual: `Exception Thrown: ${err.message}`
            });
            return; // Halt worker
        }

        // Throttle postMessage to avoid flooding the DOM thread
        // Update UI every 500 iterations
        if (i % 500 === 0) {
            self.postMessage({ type: 'progress', count: i });
        }
    }

    // If loop completes without returning early, the code is robust!
    self.postMessage({ type: 'pass' });
}
