/**
         * kademlia-visualizer.js
         * Implements 160-bit XOR distance, K-Buckets, and the FIND_NODE algorithm.
         * Visualizes concurrent Alpha RPC requests using D3.js.
         */

        document.addEventListener("DOMContentLoaded", () => {
            initKademlia();
        });

        // ==========================================
        // 1. CONSTANTS & MATH (XOR DISTANCE)
        // ==========================================
        const K = 5;
        const ALPHA = 3;
        const BIT_LENGTH = 160;
        const NUM_NODES = 100;

        // Generate 40-char hex string (160 bits)
        function generateNodeId() {
            let hex = "";
            const chars = "0123456789abcdef";
            for (let i = 0; i < 40; i++) {
                hex += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return hex;
        }

        // Convert Hex String to BigInt for exact math
        function hexToBigInt(hex) {
            return BigInt("0x" + hex);
        }

        // Kademlia Distance Metric: A XOR B
        function xorDistance(id1, id2) {
            return hexToBigInt(id1) ^ hexToBigInt(id2);
        }

        // Find which K-bucket a target belongs in relative to a source
        // Bucket index is the index of the most significant differing bit
        function getBucketIndex(id1, id2) {
            const dist = xorDistance(id1, id2);
            if (dist === 0n) return -1;
            return dist.toString(2).length - 1; // 0 to 159
        }

        function shortId(id) {
            return id.substring(0, 4) + ".." + id.substring(36, 40);
        }

        // ==========================================
        // 2. KADEMLIA NODE DEFINITION
        // ==========================================
        class KademliaNode {
            constructor() {
                this.id = generateNodeId();
                this.bigId = hexToBigInt(this.id);
                // 160 buckets, each holds up to K nodes
                this.buckets = Array.from({ length: BIT_LENGTH }, () => []);
            }

            // Insert a peer into the routing table
            addPeer(peerNode) {
                if (peerNode.id === this.id) return;
                const idx = getBucketIndex(this.id, peerNode.id);
                const bucket = this.buckets[idx];
                
                // If not already in bucket and bucket not full
                if (!bucket.find(n => n.id === peerNode.id)) {
                    if (bucket.length < K) {
                        bucket.push(peerNode);
                    }
                }
            }

            // Returns the 'count' closest nodes to 'targetId' that this node knows about
            findClosest(targetId, count) {
                let allPeers = [];
                this.buckets.forEach(b => allPeers.push(...b));
                
                // Sort by XOR distance to target
                allPeers.sort((a, b) => {
                    const dA = xorDistance(a.id, targetId);
                    const dB = xorDistance(b.id, targetId);
                    return dA < dB ? -1 : (dA > dB ? 1 : 0);
                });
                
                return allPeers.slice(0, count);
            }
        }

        // ==========================================
        // 3. SYSTEM STATE & UI BINDING
        // ==========================================
        let nodesMap = new Map(); // id -> Node
        let nodesArray = [];
        let isSimulating = false;

        // D3 State
        let svg, g, d3Nodes, simulation;
        let width, height;

        const els = {
            btnSpawn: document.getElementById('btnSpawn'),
            btnFindNode: document.getElementById('btnFindNode'),
            lookupControls: document.getElementById('lookupControls'),
            sourceSelect: document.getElementById('sourceSelect'),
            targetSelect: document.getElementById('targetSelect'),
            logContainer: document.getElementById('logContainer'),
            engineBadge: document.getElementById('engineBadge'),
            emptyState: document.getElementById('emptyState'),
            d3Container: document.getElementById('d3Container'),
            
            // Inspector
            inspectorPanel: document.getElementById('inspectorPanel'),
            btnCloseInsp: document.getElementById('btnCloseInsp'),
            inspId: document.getElementById('inspId'),
            inspBuckets: document.getElementById('inspBuckets')
        };

        function initKademlia() {
            els.btnSpawn.addEventListener('click', spawnNetwork);
            els.btnFindNode.addEventListener('click', startLookupSimulation);
            els.btnCloseInsp.addEventListener('click', () => els.inspectorPanel.classList.remove('active'));
            
            width = els.d3Container.clientWidth;
            height = els.d3Container.clientHeight;
            
            // Setup base SVG with Zoom
            svg = d3.select("#d3Container")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .call(d3.zoom().on("zoom", (event) => {
                    g.attr("transform", event.transform);
                }));
            g = svg.append("g");
        }

        function logSys(msg, type = 'sys') {
            const div = document.createElement('div');
            div.className = `log-entry ${type}`;
            div.innerHTML = `> ${msg}`;
            els.logContainer.appendChild(div);
            els.logContainer.scrollTop = els.logContainer.scrollHeight;
        }

        const sleep = ms => new Promise(r => setTimeout(r, ms));

        // ==========================================
        // 4. NETWORK BOOTSTRAPPING
        // ==========================================
        function spawnNetwork() {
            els.btnSpawn.disabled = true;
            els.btnSpawn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Bootstrapping...';
            
            setTimeout(() => {
                // Clear state
                nodesMap.clear();
                nodesArray = [];
                els.sourceSelect.innerHTML = '';
                els.targetSelect.innerHTML = '';
                g.selectAll("*").remove();

                // 1. Generate Nodes
                for (let i = 0; i < NUM_NODES; i++) {
                    const n = new KademliaNode();
                    nodesArray.push(n);
                    nodesMap.set(n.id, n);
                }

                // 2. Populate Routing Tables (Complete Mesh for visualizer reliability)
                // In a real DHT, this happens progressively via bootstrapping
                for (let i = 0; i < NUM_NODES; i++) {
                    for (let j = 0; j < NUM_NODES; j++) {
                        if (i !== j) nodesArray[i].addPeer(nodesArray[j]);
                    }
                }

                // 3. Populate Dropdowns
                nodesArray.forEach(n => {
                    const label = shortId(n.id);
                    els.sourceSelect.add(new Option(label, n.id));
                    els.targetSelect.add(new Option(label, n.id));
                });
                
                // Pick different target by default
                els.targetSelect.selectedIndex = Math.floor(NUM_NODES / 2);

                // 4. Render D3 Graph
                renderD3Graph();

                els.emptyState.classList.add('hidden');
                els.lookupControls.style.display = 'block';
                els.engineBadge.classList.add('active');
                els.engineBadge.innerHTML = '<i class="fas fa-globe"></i> Mesh Active';
                
                logSys(`Bootstrapped 100 nodes. K-Buckets populated.`, 'success');
                els.btnSpawn.style.display = 'none';
            }, 500);
        }

        // ==========================================
        // 5. D3 RENDERING (STATIC MESH)
        // ==========================================
        function renderD3Graph() {
            // We use D3 Force layout to generate a nice blob, then freeze it
            const graphNodes = nodesArray.map(n => ({ id: n.id, ref: n }));
            
            simulation = d3.forceSimulation(graphNodes)
                .force("charge", d3.forceManyBody().strength(-30))
                .force("center", d3.forceCenter(width / 2, height / 2))
                .force("collide", d3.forceCollide().radius(12));

            // Pre-calculate layout to freeze nodes (optimization)
            for (let i = 0; i < 300; ++i) simulation.tick();
            simulation.stop();

            // Draw Nodes
            d3Nodes = g.selectAll(".node")
                .data(graphNodes)
                .enter().append("g")
                .attr("class", "node")
                .attr("id", d => `node-${d.id}`)
                .attr("transform", d => `translate(${d.x},${d.y})`);

            d3Nodes.append("circle")
                .attr("r", 6)
                .on("click", (event, d) => showInspector(d.ref));
                
            d3Nodes.append("title")
                .text(d => shortId(d.id));
        }

        function showInspector(node) {
            els.inspId.textContent = shortId(node.id);
            els.inspBuckets.innerHTML = '';
            
            let activeBuckets = 0;
            node.buckets.forEach((bucket, idx) => {
                if (bucket.length > 0) {
                    activeBuckets++;
                    const row = document.createElement('div');
                    row.className = 'bucket-row';
                    row.innerHTML = `<span>Bucket [${idx}]</span> <span>${bucket.length} peers</span>`;
                    els.inspBuckets.appendChild(row);
                }
            });
            
            if(activeBuckets === 0) els.inspBuckets.innerHTML = '<i>No peers</i>';
            els.inspectorPanel.classList.add('active');
        }

        function clearGraphHighlights() {
            d3Nodes.attr("class", "node");
            g.selectAll(".rpc-link").remove();
        }

        // ==========================================
        // 6. FIND_NODE ALGORITHM & ANIMATION
        // ==========================================
        async function startLookupSimulation() {
            if (isSimulating) return;
            isSimulating = true;
            
            els.btnFindNode.disabled = true;
            els.btnFindNode.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Routing...';
            els.engineBadge.innerHTML = '<i class="fas fa-exchange-alt"></i> Routing...';
            
            clearGraphHighlights();
            els.logContainer.innerHTML = ''; // Clear logs

            const sId = els.sourceSelect.value;
            const tId = els.targetSelect.value;
            
            if (sId === tId) {
                logSys("Source and Target are the same node.", "error");
                resetSimState();
                return;
            }

            const sourceNode = nodesMap.get(sId);
            
            logSys(`[INIT] Node <span class="hex-id">${shortId(sId)}</span> looking up <span class="hex-id">${shortId(tId)}</span>`, 'start');
            
            // Highlight Source and Target
            d3.select(`#node-${sId}`).attr("class", "node source");
            d3.select(`#node-${tId}`).attr("class", "node target");

            // --- Kademlia FIND_NODE Logic ---
            let queried = new Set([sId]);
            let shortlist = sourceNode.findClosest(tId, K);
            let bestDistance = xorDistance(shortlist[0].id, tId);
            
            let round = 1;
            
            while (true) {
                // Pick ALPHA nodes from shortlist that haven't been queried
                let toQuery = shortlist.filter(n => !queried.has(n.id)).slice(0, ALPHA);
                
                if (toQuery.length === 0) {
                    logSys(`[DONE] No more nodes to query. Lookup finished.`, 'success');
                    break;
                }

                logSys(`[ROUND ${round}] Firing parallel RPCs to $\\alpha=${toQuery.length}$ peers...`, 'action');
                
                // --- Animation: Draw Laser RPCs ---
                // Find physical DOM coordinates of current query origin (Usually source, but conceptually could be distributed. We animate from source for clarity)
                const sourceD3 = simulation.nodes().find(n => n.id === sId);
                
                // Draw lines
                const lines = [];
                toQuery.forEach(target => {
                    const targetD3 = simulation.nodes().find(n => n.id === target.id);
                    const line = g.append("line")
                        .attr("class", "rpc-link")
                        .attr("x1", sourceD3.x)
                        .attr("y1", sourceD3.y)
                        .attr("x2", sourceD3.x) // Start at source
                        .attr("y2", sourceD3.y);
                        
                    // Transition line to target
                    line.transition().duration(600).ease(d3.easeCubicOut)
                        .attr("x2", targetD3.x)
                        .attr("y2", targetD3.y);
                        
                    lines.push(line);
                });
                
                await sleep(650); // Wait for rays
                
                // Highlight queried nodes
                toQuery.forEach(target => {
                    if (target.id !== tId) d3.select(`#node-${target.id}`).attr("class", "node queried");
                });
                
                // Fade out rays
                lines.forEach(l => l.transition().duration(300).style("opacity", 0).remove());

                // --- Process Responses ---
                let foundTarget = false;
                let newlyDiscovered = [];
                
                for (let peer of toQuery) {
                    queried.add(peer.id);
                    if (peer.id === tId) {
                        foundTarget = true;
                        break;
                    }
                    // Peer returns its K closest nodes to the target
                    newlyDiscovered.push(...peer.findClosest(tId, K));
                }

                if (foundTarget) {
                    logSys(`[SUCCESS] Exact target node located in network!`, 'success');
                    break;
                }

                // Merge and sort new shortlist
                let merged = [...shortlist, ...newlyDiscovered];
                let uniqueMap = new Map();
                merged.forEach(n => uniqueMap.set(n.id, n));
                
                let uniqueList = Array.from(uniqueMap.values());
                uniqueList.sort((a, b) => {
                    const dA = xorDistance(a.id, tId);
                    const dB = xorDistance(b.id, tId);
                    return dA < dB ? -1 : (dA > dB ? 1 : 0);
                });
                
                shortlist = uniqueList.slice(0, K);
                
                // Check termination condition: Did we get any closer?
                const newBest = xorDistance(shortlist[0].id, tId);
                if (newBest >= bestDistance && round > 1) {
                    // Fallback to prevent infinite loops if trapped in local minimum
                    logSys(`[HALT] Responses did not yield closer nodes. Network partition?`, 'sys');
                    break;
                }
                bestDistance = newBest;
                round++;
                await sleep(400); // Breathe before next round
            }

            resetSimState();
        }

        function resetSimState() {
            isSimulating = false;
            els.btnFindNode.disabled = false;
            els.btnFindNode.innerHTML = '<i class="fas fa-search"></i> Execute FIND_NODE';
            els.engineBadge.innerHTML = '<i class="fas fa-globe"></i> Mesh Active';
        }
