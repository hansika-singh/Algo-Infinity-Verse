// fast-slow-pointer-simulator.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Typing Effect for Hero ---
    const typingText = document.getElementById('typingTextSimulator');
    if (typingText) {
        const textToType = "Visualize cycle detection and middle node algorithms step-by-step.";
        let i = 0;
        function typeWriter() {
            if (i < textToType.length) {
                typingText.innerHTML += textToType.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        }
        setTimeout(typeWriter, 1000);
    }

    // --- State Variables ---
    let listSize = parseInt(document.getElementById('listSizeRange').value);
    let isCyclic = true;
    let cycleEntryIndex = -1; // -1 if linear
    let nodes = []; // array of {id, x, y, value, next: index}
    
    // Simulation state
    let simSteps = []; // array of { slowIdx, fastIdx, message, phase }
    let currentStep = 0;
    let isPlaying = false;
    let animationId = null;
    let speed = parseInt(document.getElementById('speedRange').value);
    let delayMs = 1100 - (speed * 100);

    // --- DOM Elements ---
    const canvas = document.getElementById('linkedListCanvas');
    const nodesContainer = document.getElementById('nodesContainer');
    const arrowLayer = document.getElementById('arrowLayer');
    
    // Controls
    const algoSelect = document.getElementById('algoSelect');
    const btnCyclic = document.getElementById('btnCyclic');
    const btnLinear = document.getElementById('btnLinear');
    const listSizeRange = document.getElementById('listSizeRange');
    const listSizeDisplay = document.getElementById('listSizeDisplay');
    const speedRange = document.getElementById('speedRange');
    
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stepPrevBtn = document.getElementById('stepPrevBtn');
    const stepNextBtn = document.getElementById('stepNextBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // Info Panels
    const slowDistText = document.getElementById('slowDist');
    const fastDistText = document.getElementById('fastDist');
    const cycleProofText = document.getElementById('cycleProofText');
    const slowNodeStatus = document.getElementById('slowNodeStatus');
    const fastNodeStatus = document.getElementById('fastNodeStatus');

    // --- Initialize SVG Defs ---
    function initSVG() {
        arrowLayer.innerHTML = `
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-secondary)" />
                </marker>
                <marker id="arrowhead-highlight" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent)" />
                </marker>
            </defs>
        `;
    }

    // --- Graph Generation ---
    function generateList() {
        nodes = [];
        nodesContainer.innerHTML = '';
        initSVG();

        // Calculate positions
        const startX = 50;
        const startY = canvas.clientHeight / 2;
        const gapX = Math.max(80, (canvas.clientWidth - 100) / listSize);

        for (let i = 0; i < listSize; i++) {
            nodes.push({
                id: i,
                x: startX + (i * gapX),
                y: startY,
                value: Math.floor(Math.random() * 90) + 10,
                next: (i < listSize - 1) ? i + 1 : null
            });
        }

        if (isCyclic && listSize > 2) {
            // Pick a random entry point in the first half of the list
            cycleEntryIndex = Math.floor(Math.random() * (Math.floor(listSize / 2))) + 1;
            nodes[listSize - 1].next = cycleEntryIndex;
        } else {
            cycleEntryIndex = -1;
        }

        renderGraph();
        prepareSimulation();
    }

    function renderGraph() {
        nodesContainer.innerHTML = '';
        let svgContent = arrowLayer.querySelector('defs').outerHTML;

        // Render Nodes
        nodes.forEach((node, i) => {
            const nodeEl = document.createElement('div');
            nodeEl.className = 'll-node-wrapper';
            nodeEl.id = `node-${i}`;
            nodeEl.style.left = `${node.x - 30}px`;
            nodeEl.style.top = `${node.y - 30}px`;
            nodeEl.innerText = node.value;
            nodesContainer.appendChild(nodeEl);
            
            // Render Arrows
            if (node.next !== null) {
                const target = nodes[node.next];
                if (node.next === i + 1) {
                    // Straight line
                    svgContent += `<path class="arrow-path" d="M ${node.x + 30} ${node.y} L ${target.x - 35} ${target.y}" id="arrow-${i}-${node.next}" />`;
                } else {
                    // Curved line for cycle
                    const curveOffset = 100 + ((listSize - cycleEntryIndex) * 10);
                    svgContent += `<path class="arrow-path" d="M ${node.x} ${node.y + 30} Q ${(node.x + target.x)/2} ${node.y + curveOffset} ${target.x} ${target.y + 35}" id="arrow-${i}-${node.next}" />`;
                }
            }
        });

        // Add Tortoise and Hare pointers
        const slowPointer = document.createElement('i');
        slowPointer.className = 'fas fa-turtle pointer-icon pointer-slow';
        slowPointer.id = 'pointerSlow';
        slowPointer.style.display = 'none';
        
        const fastPointer = document.createElement('i');
        fastPointer.className = 'fas fa-rabbit-fast pointer-icon pointer-fast';
        fastPointer.id = 'pointerFast';
        fastPointer.style.display = 'none';

        nodesContainer.appendChild(slowPointer);
        nodesContainer.appendChild(fastPointer);

        arrowLayer.innerHTML = svgContent;
    }

    // --- Simulation Engine ---
    function prepareSimulation() {
        simSteps = [];
        currentStep = 0;
        const algo = algoSelect.value;
        
        let slow = 0;
        let fast = 0;
        let slowDist = 0;
        let fastDist = 0;
        let met = false;
        
        // Initial state
        simSteps.push({ slowIdx: slow, fastIdx: fast, slowDist, fastDist, message: "Initialize pointers at head.", phase: 'init' });

        if (algo === 'detect-cycle' || algo === 'find-entry' || algo === 'cycle-length') {
            while (fast !== null && nodes[fast].next !== null) {
                slow = nodes[slow].next;
                slowDist++;
                
                fast = nodes[fast].next;
                if (fast !== null) {
                    fast = nodes[fast].next;
                    fastDist += 2;
                }

                if (fast === null) {
                    simSteps.push({ slowIdx: slow, fastIdx: null, slowDist, fastDist, message: "Fast pointer reached end. No cycle detected.", phase: 'done' });
                    break;
                }

                if (slow === fast) {
                    met = true;
                    simSteps.push({ slowIdx: slow, fastIdx: fast, slowDist, fastDist, message: "Pointers met! Cycle detected.", phase: 'meet' });
                    break;
                } else {
                    simSteps.push({ slowIdx: slow, fastIdx: fast, slowDist, fastDist, message: "Moving slow by 1, fast by 2.", phase: 'search' });
                }
            }
            if (!met && (fast === null || nodes[fast].next === null)) {
                simSteps.push({ slowIdx: slow, fastIdx: fast, slowDist, fastDist, message: "Fast pointer reached end. No cycle detected.", phase: 'done' });
            }
        }

        if (met && algo === 'find-entry') {
            slow = 0;
            simSteps.push({ slowIdx: slow, fastIdx: fast, slowDist, fastDist, message: "Reset slow to head to find entry point.", phase: 'entry-search' });
            while (slow !== fast) {
                slow = nodes[slow].next;
                fast = nodes[fast].next;
                slowDist++;
                fastDist++;
                
                if (slow === fast) {
                    simSteps.push({ slowIdx: slow, fastIdx: fast, slowDist, fastDist, message: "Pointers met again! This is the cycle entry.", phase: 'done' });
                } else {
                    simSteps.push({ slowIdx: slow, fastIdx: fast, slowDist, fastDist, message: "Moving both pointers by 1 step.", phase: 'entry-search' });
                }
            }
        }

        if (met && algo === 'cycle-length') {
            let length = 0;
            let startNode = slow;
            simSteps.push({ slowIdx: slow, fastIdx: fast, slowDist, fastDist, message: "Keep slow stationary, move fast by 1 to count length.", phase: 'count' });
            
            do {
                fast = nodes[fast].next;
                length++;
                simSteps.push({ slowIdx: slow, fastIdx: fast, slowDist, fastDist, message: \`Length count: \${length}\`, phase: 'count' });
            } while (fast !== startNode);
            
            simSteps.push({ slowIdx: slow, fastIdx: fast, slowDist, fastDist, message: \`Cycle length is \${length}.\`, phase: 'done' });
        }

        if (algo === 'find-middle') {
             while (fast !== null && nodes[fast].next !== null) {
                slow = nodes[slow].next;
                slowDist++;
                fast = nodes[nodes[fast].next].next;
                fastDist += 2;
                
                if (fast === null || nodes[fast].next === null) {
                     simSteps.push({ slowIdx: slow, fastIdx: fast, slowDist, fastDist, message: "Fast reached end. Slow is at the middle.", phase: 'done' });
                     break;
                } else {
                     simSteps.push({ slowIdx: slow, fastIdx: fast, slowDist, fastDist, message: "Moving slow by 1, fast by 2.", phase: 'search' });
                }
             }
        }

        resetSimulation();
    }

    function resetSimulation() {
        stopSimulation();
        currentStep = 0;
        updateUI();
        startBtn.disabled = false;
        stepNextBtn.disabled = false;
        stepPrevBtn.disabled = true;
    }

    // --- UI Updates ---
    function updateUI() {
        if (simSteps.length === 0) return;
        
        const step = simSteps[currentStep];
        
        // Reset node highlights
        document.querySelectorAll('.ll-node-wrapper').forEach(n => {
            n.className = 'll-node-wrapper';
        });

        const slowPtr = document.getElementById('pointerSlow');
        const fastPtr = document.getElementById('pointerFast');

        if (step.slowIdx !== null && nodes[step.slowIdx]) {
            slowPtr.style.display = 'block';
            slowPtr.style.left = \`\${nodes[step.slowIdx].x - 15}px\`;
            slowPtr.style.top = \`\${nodes[step.slowIdx].y - 65}px\`;
            slowNodeStatus.innerText = \`Node: \${nodes[step.slowIdx].value}\`;
            document.getElementById(\`node-\${step.slowIdx}\`).classList.add('highlight-slow');
        }

        if (step.fastIdx !== null && nodes[step.fastIdx]) {
            fastPtr.style.display = 'block';
            fastPtr.style.left = \`\${nodes[step.fastIdx].x - 15}px\`;
            fastPtr.style.top = \`\${nodes[step.fastIdx].y + 35}px\`;
            fastNodeStatus.innerText = \`Node: \${nodes[step.fastIdx].value}\`;
            
            if (step.slowIdx === step.fastIdx) {
                document.getElementById(\`node-\${step.fastIdx}\`).className = 'll-node-wrapper highlight-both';
            } else {
                document.getElementById(\`node-\${step.fastIdx}\`).classList.add('highlight-fast');
            }
        } else {
            fastPtr.style.display = 'none';
            fastNodeStatus.innerText = 'Node: NULL';
        }

        // Update Math Dashboard
        slowDistText.innerText = step.slowDist;
        fastDistText.innerText = step.fastDist;
        
        const algo = algoSelect.value;
        if (algo === 'detect-cycle') {
            if (step.phase === 'init' || step.phase === 'search') {
                 cycleProofText.innerHTML = \`<p>\${step.message}</p>\`;
            } else if (step.phase === 'meet') {
                 cycleProofText.innerHTML = \`<p style="color:var(--accent); font-weight:bold;">\${step.message}</p>
                 <span class="math-eq">Fast = 2 × Slow</span>
                 <span class="math-eq">\${step.fastDist} = 2 × \${step.slowDist}</span>\`;
            } else if (step.phase === 'done' && step.fastIdx === null) {
                 cycleProofText.innerHTML = \`<p>\${step.message}</p>\`;
            }
        } else if (algo === 'find-entry') {
            if (step.phase === 'meet') {
                cycleProofText.innerHTML = \`<p>\${step.message}</p>
                <span class="math-eq">2(a + b) = a + b + k(c)</span>
                <span class="math-eq">a = k(c) - b</span>\`;
            } else if (step.phase === 'entry-search' || step.phase === 'done') {
                cycleProofText.innerHTML = \`<p>\${step.message}</p>\`;
            }
        } else if (algo === 'find-middle') {
             cycleProofText.innerHTML = \`<p>\${step.message}</p>
             <span class="math-eq">Middle = Total / 2</span>
             <span class="math-eq">\${step.slowDist} = \${step.fastDist} / 2</span>\`;
        } else {
             cycleProofText.innerHTML = \`<p>\${step.message}</p>\`;
        }

        // Button states
        stepPrevBtn.disabled = currentStep === 0;
        stepNextBtn.disabled = currentStep === simSteps.length - 1;
        
        if (currentStep === simSteps.length - 1) {
            stopSimulation();
        }
    }

    function stepNext() {
        if (currentStep < simSteps.length - 1) {
            currentStep++;
            updateUI();
        }
    }

    function stepPrev() {
        if (currentStep > 0) {
            currentStep--;
            updateUI();
        }
    }

    // --- Playback ---
    function startSimulation() {
        if (currentStep === simSteps.length - 1) {
            currentStep = 0; // restart if at end
        }
        isPlaying = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        function loop() {
            if (!isPlaying) return;
            stepNext();
            if (currentStep < simSteps.length - 1) {
                animationId = setTimeout(loop, delayMs);
            }
        }
        loop();
    }

    function stopSimulation() {
        isPlaying = false;
        clearTimeout(animationId);
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }

    // --- Event Listeners ---
    listSizeRange.addEventListener('input', (e) => {
        listSize = parseInt(e.target.value);
        listSizeDisplay.innerText = listSize;
        generateList();
    });

    speedRange.addEventListener('input', (e) => {
        speed = parseInt(e.target.value);
        delayMs = 1100 - (speed * 100);
    });

    btnCyclic.addEventListener('click', () => {
        isCyclic = true;
        btnCyclic.classList.replace('btn-secondary', 'btn-primary');
        btnLinear.classList.replace('btn-primary', 'btn-secondary');
        generateList();
    });

    btnLinear.addEventListener('click', () => {
        isCyclic = false;
        btnLinear.classList.replace('btn-secondary', 'btn-primary');
        btnCyclic.classList.replace('btn-primary', 'btn-secondary');
        generateList();
    });

    algoSelect.addEventListener('change', () => {
        prepareSimulation();
    });

    startBtn.addEventListener('click', startSimulation);
    pauseBtn.addEventListener('click', stopSimulation);
    stepNextBtn.addEventListener('click', () => { stopSimulation(); stepNext(); });
    stepPrevBtn.addEventListener('click', () => { stopSimulation(); stepPrev(); });
    resetBtn.addEventListener('click', resetSimulation);

    // Initial setup
    generateList();
});
