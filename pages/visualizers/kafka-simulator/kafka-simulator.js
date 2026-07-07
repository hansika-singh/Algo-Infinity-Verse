        
        document.addEventListener("DOMContentLoaded", () => {
            initKafkaSimulator();
        });

        // --- State & Config ---
        const NUM_PARTITIONS = 4;
        const CONSUMER_COLORS = ['#06b6d4', '#a855f7', '#facc15', '#10b981', '#f43f5e'];
        
        const state = {
            partitions: [[], [], [], []], // Stores message objects
            highWatermarks: [0, 0, 0, 0], // Total messages produced per partition
            committedOffsets: [0, 0, 0, 0], // Read offsets
            
            consumers: [], // { id, color, assignedPartitions: [], domElement }
            consumerIdCounter: 1,
            
            isRebalancing: false,
            firehoseInterval: null,
            consumeInterval: null,
            roundRobinPtr: 0
        };

        const els = {
            routingStrategy: document.getElementById('routingStrategy'),
            keyInputGroup: document.getElementById('keyInputGroup'),
            msgKeyInput: document.getElementById('msgKeyInput'),
            btnProduceSingle: document.getElementById('btnProduceSingle'),
            btnStartFirehose: document.getElementById('btnStartFirehose'),
            
            btnAddConsumer: document.getElementById('btnAddConsumer'),
            btnKillConsumer: document.getElementById('btnKillConsumer'),
            consumersList: document.getElementById('consumersList'),
            
            mappingLayer: document.getElementById('mappingLayer'),
            rebalanceOverlay: document.getElementById('rebalanceOverlay'),
            engineBadge: document.getElementById('engineBadge')
        };

        // --- Initialization ---
        function initKafkaSimulator() {
            bindEvents();
            
            // Start with 2 consumers
            addConsumer();
            addConsumer();
            
            // Start Consumer Polling Loop
            state.consumeInterval = setInterval(consumeTick, 500); // Poll every 500ms
            
            window.addEventListener('resize', drawMappingLines);
        }

        function bindEvents() {
            els.routingStrategy.addEventListener('change', (e) => {
                if (e.target.value === 'hash') els.keyInputGroup.classList.remove('hidden');
                else els.keyInputGroup.classList.add('hidden');
            });

            els.btnProduceSingle.addEventListener('click', produceMessage);
            
            els.btnStartFirehose.addEventListener('click', () => {
                if (state.firehoseInterval) {
                    clearInterval(state.firehoseInterval);
                    state.firehoseInterval = null;
                    els.btnStartFirehose.innerHTML = '<i class="fas fa-fire"></i> Start Firehose';
                    els.btnStartFirehose.classList.remove('btn-danger');
                    els.btnStartFirehose.classList.add('btn-outline');
                } else {
                    state.firehoseInterval = setInterval(produceMessage, 150);
                    els.btnStartFirehose.innerHTML = '<i class="fas fa-stop"></i> Stop Firehose';
                    els.btnStartFirehose.classList.remove('btn-outline');
                    els.btnStartFirehose.classList.add('btn-danger');
                }
            });

            els.btnAddConsumer.addEventListener('click', addConsumer);
            els.btnKillConsumer.addEventListener('click', killConsumer);
        }

        // --- Hashing Utility ---
        function hashCode(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            return Math.abs(hash);
        }

        // --- PRODUCER LOGIC ---
        function produceMessage() {
            const strategy = els.routingStrategy.value;
            let targetPartition = 0;
            let msgKey = "null";

            if (strategy === 'round-robin') {
                targetPartition = state.roundRobinPtr;
                state.roundRobinPtr = (state.roundRobinPtr + 1) % NUM_PARTITIONS;
            } else {
                msgKey = els.msgKeyInput.value.trim() || `User_${Math.floor(Math.random()*1000)}`;
                targetPartition = hashCode(msgKey) % NUM_PARTITIONS;
            }

            const offset = state.highWatermarks[targetPartition];
            const msgId = Math.random().toString(16).substring(2, 6).toUpperCase();
            
            const msg = { offset: offset, key: msgKey, id: msgId };
            state.partitions[targetPartition].push(msg);
            state.highWatermarks[targetPartition]++;

            // Update UI
            document.getElementById(`hw-${targetPartition}`).textContent = state.highWatermarks[targetPartition];
            
            renderMessage(targetPartition, msg);
        }

        function renderMessage(pIdx, msg) {
            const container = document.getElementById(`msg-container-${pIdx}`);
            const div = document.createElement('div');
            div.className = 'message-block';
            div.id = `msg-${pIdx}-${msg.offset}`;
            
            let displayVal = msg.key !== "null" ? msg.key : msg.id;
            
            div.innerHTML = `<span>${displayVal}</span> <span class="msg-offset">#${msg.offset}</span>`;
            
            // Prepend so newest is at top, standard for these visualizers
            container.prepend(div);

            // Optimization: Keep DOM clean, remove elements > 20
            if (container.children.length > 20) {
                container.removeChild(container.lastChild);
            }
        }

        // --- CONSUMER GROUP LOGIC ---
        function addConsumer() {
            if (state.consumers.length >= 5) return void 0;
            
            const id = state.consumerIdCounter++;
            const color = CONSUMER_COLORS[(id - 1) % CONSUMER_COLORS.length];
            
            const el = document.createElement('div');
            el.className = 'consumer-node active';
            el.id = `consumer-${id}`;
            
            el.innerHTML = `
                <div class="cg-header">
                    <span style="color: ${color};"><i class="fas fa-desktop"></i> Consumer-${id}</span>
                    <span class="cg-status" id="c-status-${id}">IDLE</span>
                </div>
                <div class="cg-assignments" id="c-assign-${id}">Waiting for assignment...</div>
            `;
            
            els.consumersList.appendChild(el);
            state.consumers.push({ id, color, assignedPartitions: [], domElement: el });
            
            triggerRebalance();
        }

        function killConsumer() {
            if (state.consumers.length === 0) return;
            
            // Kill a random consumer
            const targetIdx = Math.floor(Math.random() * state.consumers.length);
            const killed = state.consumers[targetIdx];
            
            killed.domElement.remove();
            state.consumers.splice(targetIdx, 1);
            
            triggerRebalance();
        }

        function triggerRebalance() {
            if (state.isRebalancing) return;
            state.isRebalancing = true;
            
            els.rebalanceOverlay.classList.remove('hidden');
            els.engineBadge.className = 'engine-badge rebalancing';
            els.engineBadge.innerHTML = '<i class="fas fa-sync fa-spin"></i> Rebalancing...';
            els.mappingLayer.innerHTML = ''; // Clear lines
            
            // Reset assignments
            state.consumers.forEach(c => {
                c.assignedPartitions = [];
                document.getElementById(`c-assign-${c.id}`).innerHTML = 'Revoked';
                document.getElementById(`c-status-${c.id}`).className = 'cg-status';
                document.getElementById(`c-status-${c.id}`).textContent = 'STW'; // Stop The World
                c.domElement.classList.replace('active', 'idle');
                c.domElement.style.borderColor = '#334155';
                c.domElement.style.boxShadow = 'none';
            });

            // Simulate Stop-The-World Rebalance Delay
            setTimeout(() => {
                performAssignment();
                
                els.rebalanceOverlay.classList.add('hidden');
                els.engineBadge.className = 'engine-badge';
                els.engineBadge.innerHTML = '<i class="fas fa-check-circle"></i> Cluster Healthy';
                state.isRebalancing = false;
                
            }, 1500);
        }

        // Kafka RangeAssignor Logic (Simplified)
        function performAssignment() {
            const numConsumers = state.consumers.length;
            if (numConsumers === 0) return;

            const partsPerConsumer = Math.floor(NUM_PARTITIONS / numConsumers);
            let remainder = NUM_PARTITIONS % numConsumers;
            let currentPartition = 0;

            for (let i = 0; i < numConsumers; i++) {
                const c = state.consumers[i];
                let assignCount = partsPerConsumer + (remainder > 0 ? 1 : 0);
                remainder--;

                for (let j = 0; j < assignCount; j++) {
                    if (currentPartition < NUM_PARTITIONS) {
                        c.assignedPartitions.push(currentPartition);
                        currentPartition++;
                    }
                }

                // Update UI
                if (c.assignedPartitions.length > 0) {
                    c.domElement.classList.replace('idle', 'active');
                    c.domElement.style.borderColor = c.color;
                    c.domElement.style.boxShadow = `0 0 15px ${c.color}33`;
                    
                    const badges = c.assignedPartitions.map(p => `<span class="part-badge">P-${p}</span>`).join('');
                    document.getElementById(`c-assign-${c.id}`).innerHTML = `Assigned: ${badges}`;
                    document.getElementById(`c-status-${c.id}`).textContent = 'READY';
                } else {
                    document.getElementById(`c-assign-${c.id}`).innerHTML = 'Idle (No partitions)';
                    document.getElementById(`c-status-${c.id}`).textContent = 'IDLE';
                }
            }
            
            drawMappingLines();
        }

        // --- CONSUMER POLLING LOGIC ---
        function consumeTick() {
            if (state.isRebalancing || state.consumers.length === 0) return;

            state.consumers.forEach(c => {
                if (c.assignedPartitions.length === 0) return;
                
                let readAny = false;
                const statusEl = document.getElementById(`c-status-${c.id}`);

                c.assignedPartitions.forEach(pIdx => {
                    const commitOffset = state.committedOffsets[pIdx];
                    const hw = state.highWatermarks[pIdx];
                    
                    if (commitOffset < hw) {
                        // Read message
                        readAny = true;
                        state.committedOffsets[pIdx]++;
                        
                        // Update Telemetry
                        const td = document.getElementById(`off-${pIdx}`);
                        td.textContent = state.committedOffsets[pIdx];
                        td.style.color = c.color; // Color code offset to consumer
                        
                        // Visual update on message block
                        const msgEl = document.getElementById(`msg-${pIdx}-${commitOffset}`);
                        if (msgEl) {
                            msgEl.classList.add('consumed');
                            msgEl.style.borderLeftColor = '#334155'; // Grey out
                        }
                    }
                });

                if (readAny) {
                    statusEl.textContent = 'POLLING';
                    statusEl.className = 'cg-status reading';
                } else {
                    statusEl.textContent = 'WAITING';
                    statusEl.className = 'cg-status';
                }
            });
        }

        // --- SVG MAPPING LINES ---
        function drawMappingLines() {
            els.mappingLayer.innerHTML = '';
            if (state.isRebalancing || state.consumers.length === 0) return;

            const layerRect = els.mappingLayer.getBoundingClientRect();

            state.consumers.forEach(c => {
                if (c.assignedPartitions.length === 0) return;
                
                const cRect = c.domElement.getBoundingClientRect();
                const startX = cRect.left - layerRect.left;
                const startY = cRect.top + (cRect.height / 2) - layerRect.top;

                c.assignedPartitions.forEach(pIdx => {
                    const pEl = document.getElementById(`part-${pIdx}`);
                    if (!pEl) return;
                    
                    const pRect = pEl.getBoundingClientRect();
                    const endX = pRect.right - layerRect.left;
                    const endY = pRect.top + 20 - layerRect.top; // Point to header

                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute('class', 'mapping-line active');
                    path.setAttribute('stroke', c.color);
                    
                    // Bezier Curve
                    const offset = Math.abs(startX - endX) * 0.5;
                    const d = `M ${startX} ${startY} C ${startX - offset} ${startY}, ${endX + offset} ${endY}, ${endX} ${endY}`;
                    path.setAttribute('d', d);
                    
                    els.mappingLayer.appendChild(path);
                });
            });
        }
