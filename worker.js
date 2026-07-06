// worker.js

self.onmessage = function(e) {
    const { code, lang } = e.data;
    
    // Fallback for non-JS simulations
    if (lang !== 'javascript') {
        self.postMessage({ success: true, output: `Code executed in ${lang.toUpperCase()} (simulation).` });
        return;
    }

    try {
        // Intercept and capture console.log outputs
        let outputBuffer = [];
        const originalConsoleLog = console.log;
        
        console.log = (...args) => {
            const parsedArgs = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a));
            outputBuffer.push(parsedArgs.join(' '));
        };

        // Execute the user's code safely in the worker context
        let result = eval(code);
        
        // Restore original console.log
        console.log = originalConsoleLog;

        // Format the final output
        let finalOutput = outputBuffer.join('\n');
        
        // Append return value if it exists
        if (result !== undefined) {
            finalOutput += (finalOutput ? '\n' : '') + 'Return: ' + String(result);
        }
        
        if (!finalOutput) {
            finalOutput = 'Executed successfully (No output).';
        }

        self.postMessage({ success: true, output: finalOutput });
    } catch (error) {
        // Catch SyntaxErrors, ReferenceErrors, etc.
        self.postMessage({ success: false, error: error.toString() });
    }
};