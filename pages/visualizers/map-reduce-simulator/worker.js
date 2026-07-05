// worker.js - MapReduce simulated worker node

/**
 * Worker script to simulate Mapper and Reducer nodes in a distributed environment.
 * Receives messages containing tasks and posts back results.
 */

self.onmessage = function(e) {
    const { type, payload, speedMultiplier } = e.data;
    
    // Simulate network/processing delay to make visualization obvious
    const baseDelay = 1000;
    const delay = baseDelay / (speedMultiplier || 1);

    if (type === 'MAP') {
        setTimeout(() => {
            const { chunkId, text } = payload;
            const mappedPairs = mapFunction(text);
            self.postMessage({ type: 'MAP_COMPLETE', chunkId, result: mappedPairs });
        }, delay);
    } 
    else if (type === 'REDUCE') {
        setTimeout(() => {
            const { key, values } = payload;
            const reducedValue = reduceFunction(key, values);
            self.postMessage({ type: 'REDUCE_COMPLETE', key, result: reducedValue });
        }, delay * 1.2); // Slightly longer delay for reduce
    }
};

/**
 * Word Count Map Function
 * Input: text chunk
 * Output: Array of {key: word, value: 1}
 */
function mapFunction(text) {
    if (!text || text.trim() === '') return [];
    
    // Simple tokenizer: split by non-alphanumeric characters, convert to lowercase
    const words = text.toLowerCase().split(/[^a-z0-9]+/i).filter(w => w.length > 0);
    
    return words.map(word => ({ key: word, value: 1 }));
}

/**
 * Word Count Reduce Function
 * Input: key, Array of values (e.g., [1, 1, 1])
 * Output: Reduced value (sum)
 */
function reduceFunction(key, values) {
    return values.reduce((sum, val) => sum + val, 0);
}
