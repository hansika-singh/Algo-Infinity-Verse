window.initGoogleLab = function(labId) {
    if (labId === 'mapreduce-lab') {
        initMapReduceLab();
    } else if (labId === 'consistent-hashing-lab') {
        initConsistentHashingLab();
    }
};

// --- MapReduce Simulator ---
function initMapReduceLab() {
    // Check if controls already exist
    let controls = document.querySelector('.lab-controls');
    if (!controls) {
        const container = document.getElementById('mapreduce-lab-canvas');
        if (!container) return;
        
        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; width:100%; text-align:left;">
                <div class="lab-column">
                    <h6>Input Documents</h6>
                    <pre id="mr-input">Doc1: "google is good"\nDoc2: "google search is fast"\nDoc3: "fast search is good"</pre>
                </div>
                <div class="lab-column">
                    <h6>Map Phase <i class="fas fa-arrow-right"></i></h6>
                    <pre id="mr-map" style="opacity: 0.5;">Waiting...</pre>
                </div>
                <div class="lab-column">
                    <h6>Shuffle/Sort <i class="fas fa-arrow-right"></i></h6>
                    <pre id="mr-shuffle" style="opacity: 0.5;">Waiting...</pre>
                </div>
                <div class="lab-column">
                    <h6>Reduce Phase (Output)</h6>
                    <pre id="mr-reduce" style="opacity: 0.5;">Waiting...</pre>
                </div>
            </div>
            <div class="lab-controls" style="position:absolute; top:20px; right:20px;">
                <button id="runMapReduceBtn" class="btn btn-sm btn-primary">Run MapReduce Job</button>
            </div>
        `;
    }

    const runBtn = document.getElementById('runMapReduceBtn');
    const mapOut = document.getElementById('mr-map');
    const shuffleOut = document.getElementById('mr-shuffle');
    const reduceOut = document.getElementById('mr-reduce');

    if (!runBtn) return;

    // Reset listener to avoid duplicates
    const newBtn = runBtn.cloneNode(true);
    runBtn.parentNode.replaceChild(newBtn, runBtn);

    newBtn.addEventListener('click', () => {
        newBtn.disabled = true;
        mapOut.style.opacity = '1';
        mapOut.innerHTML = 'Mapping...';
        shuffleOut.style.opacity = '0.5';
        shuffleOut.innerHTML = 'Waiting...';
        reduceOut.style.opacity = '0.5';
        reduceOut.innerHTML = 'Waiting...';

        setTimeout(() => {
            mapOut.innerHTML = `("google", 1)\n("is", 1)\n("good", 1)\n("google", 1)\n("search", 1)\n("is", 1)\n("fast", 1)\n("fast", 1)\n("search", 1)\n("is", 1)\n("good", 1)`;
            shuffleOut.style.opacity = '1';
            shuffleOut.innerHTML = 'Shuffling...';

            setTimeout(() => {
                shuffleOut.innerHTML = `"fast": [1, 1]\n"good": [1, 1]\n"google": [1, 1]\n"is": [1, 1, 1]\n"search": [1, 1]`;
                reduceOut.style.opacity = '1';
                reduceOut.innerHTML = 'Reducing...';

                setTimeout(() => {
                    reduceOut.innerHTML = `"fast": 2\n"good": 2\n"google": 2\n"is": 3\n"search": 2`;
                    newBtn.disabled = false;
                    newBtn.textContent = 'Run Again';
                }, 1500);
            }, 1500);
        }, 1500);
    });
}

// --- Consistent Hashing Lab ---
function initConsistentHashingLab() {
    const canvasContainer = document.getElementById('consistent-hashing-lab-canvas');
    if (!canvasContainer) return;
    
    // Clear previous if any
    canvasContainer.innerHTML = '';
    
    // Add Controls
    const controls = document.createElement('div');
    controls.className = 'lab-controls';
    controls.style.position = 'absolute';
    controls.style.top = '20px';
    controls.style.right = '20px';
    controls.style.display = 'flex';
    controls.style.gap = '10px';
    controls.innerHTML = `
        <button id="addNodeBtn" class="btn btn-sm btn-primary">Add Server</button>
        <button id="removeNodeBtn" class="btn btn-sm btn-secondary">Remove Server</button>
        <button id="addKeyBtn" class="btn btn-sm btn-success">Add Key</button>
    `;
    canvasContainer.appendChild(controls);

    if (typeof d3 === 'undefined') {
        canvasContainer.innerHTML += '<p>Error: D3.js not loaded.</p>';
        return;
    }

    const canvas = d3.select("#consistent-hashing-lab-canvas");
    const width = 400;
    const height = 300;
    const radius = 100;

    const svg = canvas.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width/2}, ${height/2 + 20})`);

    svg.append("circle")
        .attr("r", radius)
        .attr("fill", "none")
        .attr("stroke", "rgba(255,255,255,0.2)")
        .attr("stroke-width", 4);

    let servers = [
        { id: 'S1', angle: 0 },
        { id: 'S2', angle: 120 },
        { id: 'S3', angle: 240 }
    ];
    let keys = [];
    let serverCounter = 3;
    let keyCounter = 0;

    function draw() {
        const serverNodes = svg.selectAll(".server").data(servers, d => d.id);
        const serverEnter = serverNodes.enter().append("g").attr("class", "server");
        serverEnter.append("circle").attr("r", 14).attr("fill", "#4285F4");
        serverEnter.append("text").attr("dy", 4).attr("text-anchor", "middle").attr("fill", "#fff").attr("font-size", "10px").attr("font-weight", "bold").text(d => d.id);

        serverNodes.merge(serverEnter)
            .transition().duration(500)
            .attr("transform", d => `translate(${radius * Math.cos((d.angle - 90) * Math.PI / 180)}, ${radius * Math.sin((d.angle - 90) * Math.PI / 180)})`);
        serverNodes.exit().remove();

        const keyNodes = svg.selectAll(".data-key").data(keys, d => d.id);
        keyNodes.enter().append("circle").attr("class", "data-key").attr("r", 6).attr("fill", "#FBBC05").attr("stroke", "#000").attr("stroke-width", 1)
            .merge(keyNodes)
            .transition().duration(500)
            .attr("transform", d => `translate(${(radius - 15) * Math.cos((d.angle - 90) * Math.PI / 180)}, ${(radius - 15) * Math.sin((d.angle - 90) * Math.PI / 180)})`);
        keyNodes.exit().remove();
        
        const lines = svg.selectAll(".ownership-line").data(keys, d => d.id);
        lines.enter().append("line").attr("class", "ownership-line").attr("stroke", "rgba(251, 188, 5, 0.4)").attr("stroke-width", 2).attr("stroke-dasharray", "2,2")
            .merge(lines)
            .transition().duration(500)
            .attr("x1", d => (radius - 15) * Math.cos((d.angle - 90) * Math.PI / 180))
            .attr("y1", d => (radius - 15) * Math.sin((d.angle - 90) * Math.PI / 180))
            .attr("x2", d => {
                let targetServer = servers[0];
                for(let i=0; i<servers.length; i++) {
                    if (servers[i].angle >= d.angle) { targetServer = servers[i]; break; }
                }
                return radius * Math.cos((targetServer.angle - 90) * Math.PI / 180);
            })
            .attr("y2", d => {
                let targetServer = servers[0];
                for(let i=0; i<servers.length; i++) {
                    if (servers[i].angle >= d.angle) { targetServer = servers[i]; break; }
                }
                return radius * Math.sin((targetServer.angle - 90) * Math.PI / 180);
            });
        lines.exit().remove();
    }

    function sortServers() { servers.sort((a, b) => a.angle - b.angle); }

    document.getElementById('addNodeBtn').addEventListener('click', () => {
        serverCounter++;
        servers.push({ id: 'S' + serverCounter, angle: Math.floor(Math.random() * 360) });
        sortServers(); draw();
    });

    document.getElementById('removeNodeBtn').addEventListener('click', () => {
        if (servers.length > 1) {
            const idx = Math.floor(Math.random() * servers.length);
            servers.splice(idx, 1);
            draw();
        }
    });

    document.getElementById('addKeyBtn').addEventListener('click', () => {
        keyCounter++;
        keys.push({ id: 'K' + keyCounter, angle: Math.floor(Math.random() * 360) });
        draw();
    });

    sortServers(); draw();
}
