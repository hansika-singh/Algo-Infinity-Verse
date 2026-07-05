/**
 * map-reduce-simulator.js
 * Main controller for the Interactive MapReduce Simulator.
 */

class MapReduceSimulator {
    constructor() {
        this.state = {
            isRunning: false,
            workers: [],
            chunks: [],
            mapResults: [], // Array of arrays containing KV pairs
            shuffledData: {}, // Grouped by key
            reduceResults: {}, // Final results
            stats: {
                startTime: 0,
                mapPairs: 0,
                reduceKeys: 0
            },
            config: {
                mappers: 4,
                reducers: 2,
                speedMultiplier: 1.0
            }
        };

        this.dom = {
            input: document.getElementById('dataInput'),
            mapperSlider: document.getElementById('mapperCount'),
            mapperValue: document.getElementById('mapperValue'),
            reducerSlider: document.getElementById('reducerCount'),
            reducerValue: document.getElementById('reducerValue'),
            speedSlider: document.getElementById('simulationSpeed'),
            speedValue: document.getElementById('speedValue'),
            
            btnStart: document.getElementById('btnStartSimulation'),
            btnReset: document.getElementById('btnResetAll'),
            
            stages: {
                split: document.getElementById('splitContent'),
                map: document.getElementById('mapContent'),
                shuffle: document.getElementById('shuffleContent'),
                reduce: document.getElementById('reduceContent'),
                output: document.getElementById('outputContent')
            },

            stats: {
                status: document.getElementById('statStatus'),
                time: document.getElementById('statTime'),
                mapPairs: document.getElementById('statMapPairs'),
                reduceKeys: document.getElementById('statReduceKeys')
            }
        };

        this.timerInterval = null;
        this.initEventListeners();
    }

    initEventListeners() {
        this.dom.mapperSlider.addEventListener('input', (e) => {
            this.state.config.mappers = parseInt(e.target.value);
            this.dom.mapperValue.textContent = this.state.config.mappers;
        });

        this.dom.reducerSlider.addEventListener('input', (e) => {
            this.state.config.reducers = parseInt(e.target.value);
            this.dom.reducerValue.textContent = this.state.config.reducers;
        });

        this.dom.speedSlider.addEventListener('input', (e) => {
            this.state.config.speedMultiplier = parseFloat(e.target.value);
            this.dom.speedValue.textContent = this.state.config.speedMultiplier.toFixed(1) + 'x';
        });

        this.dom.btnStart.addEventListener('click', () => this.startJob());
        this.dom.btnReset.addEventListener('click', () => this.resetSimulation());
    }

    showToast(message, type = 'info') {
        // Use existing toast system if available, else simple fallback
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    updateStatus(statusStr, type = 'secondary') {
        this.dom.stats.status.textContent = statusStr;
        this.dom.stats.status.className = `badge bg-${type}`;
    }

    startTimer() {
        this.state.stats.startTime = performance.now();
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            const current = performance.now();
            const elapsed = Math.floor(current - this.state.stats.startTime);
            this.dom.stats.time.textContent = `${elapsed} ms`;
        }, 50); // Update every 50ms
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    resetSimulation() {
        // Terminate existing workers
        this.state.workers.forEach(w => w.terminate());
        
        this.state = {
            ...this.state,
            isRunning: false,
            workers: [],
            chunks: [],
            mapResults: [],
            shuffledData: {},
            reduceResults: {},
            stats: {
                startTime: 0,
                mapPairs: 0,
                reduceKeys: 0
            }
        };

        this.stopTimer();

        // Reset DOM
        this.updateStatus('Idle', 'secondary');
        this.dom.stats.time.textContent = '0 ms';
        this.dom.stats.mapPairs.textContent = '0';
        this.dom.stats.reduceKeys.textContent = '0';
        
        this.dom.btnStart.disabled = false;

        // Clear pipeline contents
        Object.values(this.dom.stages).forEach(container => {
            container.innerHTML = '<div class="placeholder-text">Waiting...</div>';
        });

        this.showToast('Simulation reset.', 'info');
    }

    async startJob() {
        if (this.state.isRunning) return;
        
        const inputText = this.dom.input.value.trim();
        if (!inputText) {
            this.showToast('Please enter some text to process.', 'warning');
            return;
        }

        this.resetSimulation(); // Ensure clean state
        this.state.isRunning = true;
        this.dom.btnStart.disabled = true;
        this.updateStatus('Running...', 'primary');
        this.startTimer();

        try {
            await this.executeSplitPhase(inputText);
            await this.executeMapPhase();
            await this.executeShufflePhase();
            await this.executeReducePhase();
            
            this.updateStatus('Completed', 'success');
            this.showToast('MapReduce Job completed successfully!', 'success');
        } catch (error) {
            console.error(error);
            this.updateStatus('Error', 'danger');
            this.showToast('An error occurred during execution.', 'danger');
        } finally {
            this.state.isRunning = false;
            this.dom.btnStart.disabled = false;
            this.stopTimer();
        }
    }

    /**
     * Phase 1: Input Split
     * Divides input text into chunks based on the number of mappers
     */
    async executeSplitPhase(text) {
        return new Promise((resolve) => {
            this.dom.stages.split.innerHTML = '';
            
            const words = text.split(/\s+/).filter(w => w.length > 0);
            
            if (words.length === 0) {
                this.showToast('No valid words found to process.', 'warning');
                setTimeout(resolve, 500);
                return;
            }

            const numChunks = Math.min(this.state.config.mappers, words.length);
            
            // Re-adjust mappers if words < mappers requested
            if (numChunks < this.state.config.mappers) {
                this.state.config.mappers = numChunks;
                this.dom.mapperSlider.value = numChunks;
                this.dom.mapperValue.textContent = numChunks;
            }

            const chunkSize = Math.ceil(words.length / numChunks);
            
            for (let i = 0; i < numChunks; i++) {
                const chunkWords = words.slice(i * chunkSize, (i + 1) * chunkSize);
                if (chunkWords.length === 0) continue;
                
                const chunkText = chunkWords.join(' ');
                this.state.chunks.push(chunkText);
                
                // Create DOM Element
                const chunkEl = document.createElement('div');
                chunkEl.className = 'data-chunk';
                chunkEl.innerHTML = `
                    <div class="chunk-header">Chunk ${i + 1} (${chunkWords.length} words)</div>
                    <div class="chunk-text">${chunkText}</div>
                `;
                this.dom.stages.split.appendChild(chunkEl);
            }

            // Simulate delay before next phase
            setTimeout(resolve, 500 / this.state.config.speedMultiplier);
        });
    }

    /**
     * Phase 2: Map
     * Spawns Web Workers to map chunks to K-V pairs concurrently
     */
    async executeMapPhase() {
        this.dom.stages.map.innerHTML = '';
        
        const promises = this.state.chunks.map((chunkText, index) => {
            return new Promise((resolve) => {
                // Create Worker Node UI
                const nodeEl = document.createElement('div');
                nodeEl.className = 'worker-node processing';
                nodeEl.id = `mapper-${index}`;
                nodeEl.innerHTML = `
                    <div class="worker-header">
                        <span>Mapper ${index + 1}</span>
                        <i class="fas fa-cog worker-spinner"></i>
                    </div>
                    <div class="worker-items" id="mapper-items-${index}"></div>
                `;
                this.dom.stages.map.appendChild(nodeEl);

                // Instantiate Worker
                const worker = new Worker('worker.js');
                this.state.workers.push(worker);

                worker.onmessage = (e) => {
                    if (e.data.type === 'MAP_COMPLETE') {
                        const pairs = e.data.result;
                        this.state.mapResults.push(pairs);
                        
                        // Update UI
                        nodeEl.classList.remove('processing');
                        nodeEl.classList.add('done');
                        const itemsContainer = document.getElementById(`mapper-items-${index}`);
                        
                        pairs.forEach(p => {
                            this.state.stats.mapPairs++;
                            const kvEl = document.createElement('span');
                            kvEl.className = 'kv-pair';
                            kvEl.innerHTML = `<span class="kv-key">${p.key}</span>:<span class="kv-value">${p.value}</span>`;
                            itemsContainer.appendChild(kvEl);
                        });
                        
                        this.dom.stats.mapPairs.textContent = this.state.stats.mapPairs;
                        worker.terminate();
                        resolve();
                    }
                };

                // Send data to worker
                worker.postMessage({
                    type: 'MAP',
                    payload: { chunkId: index, text: chunkText },
                    speedMultiplier: this.state.config.speedMultiplier
                });
            });
        });

        // Wait for all mappers to finish
        await Promise.all(promises);
        
        // Small delay before transition
        return new Promise(resolve => setTimeout(resolve, 600 / this.state.config.speedMultiplier));
    }

    /**
     * Phase 3: Shuffle & Sort
     * Groups identical keys from all mapper outputs
     */
    async executeShufflePhase() {
        return new Promise((resolve) => {
            this.dom.stages.shuffle.innerHTML = '';
            
            // Flatten map results and group by key
            this.state.mapResults.flat().forEach(pair => {
                if (!this.state.shuffledData[pair.key]) {
                    this.state.shuffledData[pair.key] = [];
                }
                this.state.shuffledData[pair.key].push(pair.value);
            });

            // Sort keys alphabetically
            const sortedKeys = Object.keys(this.state.shuffledData).sort();
            
            let delayTime = 0;
            const delayIncrement = 100 / this.state.config.speedMultiplier;

            sortedKeys.forEach((key, i) => {
                setTimeout(() => {
                    const values = this.state.shuffledData[key];
                    const groupEl = document.createElement('div');
                    groupEl.className = 'shuffle-group';
                    groupEl.innerHTML = `
                        <div class="shuffle-key">${key}</div>
                        <div class="shuffle-values">[${values.join(', ')}]</div>
                    `;
                    this.dom.stages.shuffle.appendChild(groupEl);
                    
                    // Scroll to bottom
                    this.dom.stages.shuffle.scrollTop = this.dom.stages.shuffle.scrollHeight;
                }, delayTime);
                delayTime += delayIncrement;
            });

            // Resolve after all animations complete
            setTimeout(resolve, delayTime + 500 / this.state.config.speedMultiplier);
        });
    }

    /**
     * Phase 4: Reduce & Output
     * Dispatches shuffled keys to reducers
     */
    async executeReducePhase() {
        this.dom.stages.reduce.innerHTML = '';
        this.dom.stages.output.innerHTML = '';
        
        const sortedKeys = Object.keys(this.state.shuffledData).sort();
        this.state.stats.reduceKeys = sortedKeys.length;
        this.dom.stats.reduceKeys.textContent = this.state.stats.reduceKeys;

        // Create Reducer Nodes UI
        const numReducers = Math.min(this.state.config.reducers, sortedKeys.length);
        const reducerElements = [];

        for(let i=0; i<numReducers; i++) {
            const nodeEl = document.createElement('div');
            nodeEl.className = 'worker-node processing';
            nodeEl.id = `reducer-${i}`;
            nodeEl.innerHTML = `
                <div class="worker-header">
                    <span>Reducer ${i + 1}</span>
                    <i class="fas fa-cog worker-spinner"></i>
                </div>
                <div class="worker-items" id="reducer-items-${i}"></div>
            `;
            this.dom.stages.reduce.appendChild(nodeEl);
            reducerElements.push(nodeEl);
        }

        // Partition keys among reducers
        const partitions = Array.from({length: numReducers}, () => []);
        sortedKeys.forEach((key, index) => {
            partitions[index % numReducers].push(key);
        });

        // Execute Reducers
        const promises = partitions.map((keysForReducer, reducerIdx) => {
            return new Promise(async (resolveReducer) => {
                const nodeEl = reducerElements[reducerIdx];
                const itemsContainer = document.getElementById(`reducer-items-${reducerIdx}`);
                
                // Process each key assigned to this reducer sequentially (to simulate reducer processing its partition)
                for (const key of keysForReducer) {
                    await new Promise((resolveKey) => {
                        const worker = new Worker('worker.js');
                        this.state.workers.push(worker);

                        worker.onmessage = (e) => {
                            if (e.data.type === 'REDUCE_COMPLETE') {
                                const { key, result } = e.data;
                                this.state.reduceResults[key] = result;
                                
                                // Show in Reducer UI
                                const kvEl = document.createElement('span');
                                kvEl.className = 'kv-pair';
                                kvEl.innerHTML = `<span class="kv-key">${key}</span>:<span class="kv-value">${result}</span>`;
                                itemsContainer.appendChild(kvEl);
                                
                                // Show in Output UI immediately
                                this.appendOutput(key, result);
                                
                                worker.terminate();
                                resolveKey();
                            }
                        };

                        worker.postMessage({
                            type: 'REDUCE',
                            payload: { key, values: this.state.shuffledData[key] },
                            speedMultiplier: this.state.config.speedMultiplier
                        });
                    });
                }
                
                nodeEl.classList.remove('processing');
                nodeEl.classList.add('done');
                resolveReducer();
            });
        });

        await Promise.all(promises);
    }

    appendOutput(key, value) {
        const outEl = document.createElement('div');
        outEl.className = 'output-item';
        outEl.innerHTML = `
            <span class="out-key">${key}</span>
            <span class="out-val">${value}</span>
        `;
        
        // Keep output sorted alphabetically for presentation
        const currentItems = Array.from(this.dom.stages.output.children);
        const insertIndex = currentItems.findIndex(el => {
            const existingKey = el.querySelector('.out-key').textContent;
            return key < existingKey;
        });

        if (insertIndex === -1) {
            this.dom.stages.output.appendChild(outEl);
        } else {
            this.dom.stages.output.insertBefore(outEl, currentItems[insertIndex]);
        }
        
        // Auto scroll
        this.dom.stages.output.scrollTop = this.dom.stages.output.scrollHeight;
    }
}

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    window.mrSimulator = new MapReduceSimulator();
});
