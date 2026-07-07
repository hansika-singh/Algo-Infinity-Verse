/**
 * concurrency-simulator.js
 * Implements a Visual Concurrency & Thread Pool Simulator.
 * Fully client-side state machine and animation loops.
 */

document.addEventListener("DOMContentLoaded", () => {
    window.simulator = new ConcurrencySimulator();
});

class ConcurrencySimulator {
    constructor() {
        this.cacheDOM();
        this.init();
    }

    cacheDOM() {
        this.dom = {
            speedSlider: document.getElementById("speedSlider"),
            speedValue: document.getElementById("speedValue"),
            btnPlayPause: document.getElementById("btnPlayPause"),
            playIcon: document.getElementById("playIcon"),
            playText: document.getElementById("playText"),
            btnStep: document.getElementById("btnStep"),
            btnResetAll: document.getElementById("btnResetAll"),
            
            btnScenarioPool: document.getElementById("btnScenarioPool"),
            btnScenarioRace: document.getElementById("btnScenarioRace"),
            btnScenarioSafe: document.getElementById("btnScenarioSafe"),
            btnScenarioDeadlock: document.getElementById("btnScenarioDeadlock"),
            
            taskName: document.getElementById("taskName"),
            stepSelector: document.getElementById("stepSelector"),
            btnAddStep: document.getElementById("btnAddStep"),
            stepsList: document.getElementById("stepsList"),
            btnEnqueueCustom: document.getElementById("btnEnqueueCustom"),
            
            taskQueueContainer: document.getElementById("taskQueueContainer"),
            threadPoolContainer: document.getElementById("threadPoolContainer"),
            resourcesCacheContainer: document.getElementById("resourcesCacheContainer"),
            svgOverlay: document.getElementById("svgOverlay"),
            panelCenter: document.getElementById("panelCenter"),
            simStatusBadge: document.getElementById("simStatusBadge"),
            expectedBox: document.getElementById("expectedBox"),
            
            logContainer: document.getElementById("logContainer"),
            btnClearLogs: document.getElementById("btnClearLogs")
        };
    }

    init() {
        this.speed = 1.0;
        this.isPlaying = false;
        this.lastTickTime = 0;
        this.baseTickInterval = 1000; // 1 second base tick interval

        this.customTaskSteps = [];
        this.tasksQueue = [];
        
        // Define threads
        this.threads = [
            { id: 1, state: "idle", currentTask: null, waitingOnResource: null },
            { id: 2, state: "idle", currentTask: null, waitingOnResource: null },
            { id: 3, state: "idle", currentTask: null, waitingOnResource: null },
            { id: 4, state: "idle", currentTask: null, waitingOnResource: null }
        ];

        // Define resources
        this.resources = {
            "A": { id: "A", name: "Resource A (Balance)", lockedBy: null, value: 1000, isBalance: true },
            "B": { id: "B", name: "Resource B", lockedBy: null, value: 1000 },
            "C": { id: "C", name: "Resource C", lockedBy: null, value: 0 },
            "D": { id: "D", name: "Resource D", lockedBy: null, value: 0 }
        };

        this.bindEvents();
        this.renderInitialUI();
        
        // Start animation/tick loop
        this.animationFrameId = requestAnimationFrame((t) => this.loop(t));

        // Re-draw connections on window resize
        window.addEventListener("resize", () => this.drawConnections());
    }

    bindEvents() {
        // Controls
        this.dom.speedSlider.addEventListener("input", (e) => {
            this.speed = parseFloat(e.target.value);
            this.dom.speedValue.textContent = `${this.speed.toFixed(1)}x`;
            this.log(`Simulation speed adjusted to ${this.speed.toFixed(1)}x`, "sys");
        });

        this.dom.btnPlayPause.addEventListener("click", () => this.togglePlay());
        this.dom.btnStep.addEventListener("click", () => this.step());
        this.dom.btnResetAll.addEventListener("click", () => this.reset());

        // Scenarios
        this.dom.btnScenarioPool.addEventListener("click", () => this.loadScenarioPool());
        this.dom.btnScenarioRace.addEventListener("click", () => this.loadScenarioRace());
        this.dom.btnScenarioSafe.addEventListener("click", () => this.loadScenarioSafe());
        this.dom.btnScenarioDeadlock.addEventListener("click", () => this.loadScenarioDeadlock());

        // Custom Task Builder
        this.dom.btnAddStep.addEventListener("click", () => this.addCustomStep());
        this.dom.btnEnqueueCustom.addEventListener("click", () => this.enqueueCustomTask());
        this.dom.btnClearLogs.addEventListener("click", () => {
            this.dom.logContainer.innerHTML = "";
            this.log("Logs cleared.", "sys");
        });
    }

    renderInitialUI() {
        this.renderThreadPool();
        this.renderResources();
        this.renderQueue();
        this.drawConnections();
    }

    renderThreadPool() {
        this.dom.threadPoolContainer.innerHTML = "";
        this.threads.forEach(thread => {
            const node = document.createElement("div");
            node.className = `thread-node state-idle`;
            node.id = `thread-node-${thread.id}`;
            node.innerHTML = `
                <div class="thread-header">
                    <i class="fas fa-microchip"></i>
                    <h5>Core ${thread.id}</h5>
                </div>
                <span class="thread-status-badge idle">Idle</span>
                <div class="thread-task-info">
                    <span class="task-name-text">No active task</span>
                    <span class="thread-task-step"></span>
                </div>
            `;
            this.dom.threadPoolContainer.appendChild(node);
        });
    }

    renderResources() {
        this.dom.resourcesCacheContainer.innerHTML = "";
        Object.values(this.resources).forEach(res => {
            const card = document.createElement("div");
            card.className = `resource-card unlocked`;
            card.id = `resource-node-${res.id}`;
            card.innerHTML = `
                <div class="resource-title">${res.id}</div>
                <div class="mutex-badge"><i class="fas fa-lock-open"></i> Mutex ${res.id}</div>
                <div class="resource-value-display">${res.isBalance ? `$${res.value}` : res.value}</div>
                <div class="resource-holder-info">Unlocked</div>
            `;
            this.dom.resourcesCacheContainer.appendChild(card);
        });
    }

    renderQueue() {
        const queueContainer = this.dom.taskQueueContainer;
        // Keep elements that are not task cards
        const nonTaskElements = Array.from(queueContainer.children).filter(el => !el.classList.contains("task-card"));
        queueContainer.innerHTML = "";
        nonTaskElements.forEach(el => queueContainer.appendChild(el));

        if (this.tasksQueue.length === 0) {
            this.dom.taskQueueContainer.innerHTML = `<div class="no-tasks-msg" id="noTasksMsg">Queue is empty. Trigger a scenario or add custom tasks!</div>`;
            return;
        }

        this.tasksQueue.forEach((task, idx) => {
            const card = document.createElement("div");
            card.className = `task-card`;
            
            // Assign class based on task behavior to color code it
            let typeClass = "type-compute";
            if (task.steps.some(s => s.type === "lock" || s.type === "unlock")) {
                typeClass = "type-rw";
            }
            if (task.steps.some(s => s.type === "yield") && task.steps.some(s => s.type === "lock")) {
                typeClass = "type-deadlock";
            }
            card.classList.add(typeClass);

            const stepsDesc = task.steps.map(s => {
                if (s.type === "lock") return `L(${s.resource})`;
                if (s.type === "unlock") return `U(${s.resource})`;
                if (s.type === "read") return `R(${s.resource})`;
                if (s.type === "write") return `W(${s.resource})`;
                if (s.type === "yield") return `Yield`;
                return `Compute`;
            }).join(" → ");

            card.innerHTML = `
                <div class="task-name">${task.name}</div>
                <div class="task-steps-summary" title="${stepsDesc}">${stepsDesc}</div>
                <span class="task-status-pill" style="background: rgba(255,255,255,0.05); color: var(--text-secondary);">queued</span>
            `;
            queueContainer.appendChild(card);
        });
    }

    log(msg, type = "sys") {
        const div = document.createElement("div");
        div.className = `log-entry ${type}`;
        div.textContent = `> ${msg}`;
        this.dom.logContainer.appendChild(div);
        this.dom.logContainer.scrollTop = this.dom.logContainer.scrollHeight;

        // Cleanup if logs grow too large
        if (this.dom.logContainer.children.length > 300) {
            this.dom.logContainer.removeChild(this.dom.logContainer.firstChild);
        }
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) {
            this.dom.playIcon.className = "fas fa-pause";
            this.dom.playText.textContent = "Pause";
            this.dom.simStatusBadge.textContent = "STATUS: RUNNING";
            this.dom.simStatusBadge.style.color = "var(--conc-success)";
            this.dom.simStatusBadge.style.borderColor = "var(--conc-success)";
            this.log("Simulation started.", "sys");
        } else {
            this.dom.playIcon.className = "fas fa-play";
            this.dom.playText.textContent = "Play";
            this.dom.simStatusBadge.textContent = "STATUS: PAUSED";
            this.dom.simStatusBadge.style.color = "var(--conc-warning)";
            this.dom.simStatusBadge.style.borderColor = "var(--conc-warning)";
            this.log("Simulation paused.", "sys");
        }
    }

    step() {
        if (this.isPlaying) {
            this.togglePlay();
        }
        this.tick();
    }

    reset() {
        this.isPlaying = false;
        this.dom.playIcon.className = "fas fa-play";
        this.dom.playText.textContent = "Play";
        this.dom.simStatusBadge.textContent = "STATUS: READY";
        this.dom.simStatusBadge.style.color = "var(--conc-accent)";
        this.dom.simStatusBadge.style.borderColor = "var(--conc-accent)";
        
        this.tasksQueue = [];
        
        this.threads = [
            { id: 1, state: "idle", currentTask: null, waitingOnResource: null },
            { id: 2, state: "idle", currentTask: null, waitingOnResource: null },
            { id: 3, state: "idle", currentTask: null, waitingOnResource: null },
            { id: 4, state: "idle", currentTask: null, waitingOnResource: null }
        ];

        this.resources = {
            "A": { id: "A", name: "Resource A (Balance)", lockedBy: null, value: 1000, isBalance: true },
            "B": { id: "B", name: "Resource B", lockedBy: null, value: 1000 },
            "C": { id: "C", name: "Resource C", lockedBy: null, value: 0 },
            "D": { id: "D", name: "Resource D", lockedBy: null, value: 0 }
        };

        this.dom.logContainer.innerHTML = "";
        this.log("System Reset. Memory cleared and Thread Pool reinitialized.", "sys");
        
        this.renderInitialUI();
    }

    loop(timestamp) {
        if (this.isPlaying) {
            const delta = timestamp - this.lastTickTime;
            const currentInterval = this.baseTickInterval / this.speed;
            
            if (delta >= currentInterval) {
                this.tick();
                this.lastTickTime = timestamp;
            }
        }
        this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
    }

    // ==========================================
    // SIMULATION TICK ENGINE
    // ==========================================
    tick() {
        // 1. Assign enqueued tasks to idle threads
        let updatedQueue = false;
        for (let thread of this.threads) {
            if (thread.state === "idle" && this.tasksQueue.length > 0) {
                const task = this.tasksQueue.shift();
                task.status = "running";
                thread.currentTask = task;
                thread.state = "running";
                this.log(`Thread ${thread.id} picked up task: ${task.name}`, `t${thread.id}`);
                updatedQueue = true;
            }
        }
        if (updatedQueue) {
            this.renderQueue();
        }

        // 2. Execute task steps
        let stateChanged = false;
        for (let thread of this.threads) {
            if (thread.state === "idle") continue;

            const task = thread.currentTask;
            if (!task) continue;

            const step = task.steps[task.currentStepIndex];
            if (!step) {
                // Task is finished
                this.log(`Thread ${thread.id} completed task: ${task.name}`, `t${thread.id}`);
                thread.state = "idle";
                thread.currentTask = null;
                task.status = "completed";
                stateChanged = true;
                continue;
            }

            // Execute depending on thread state
            if (thread.state === "waiting" || thread.state === "spinning") {
                // Check if resource can be acquired now
                const neededRes = thread.waitingOnResource;
                const resource = this.resources[neededRes];
                
                if (resource.lockedBy === null) {
                    resource.lockedBy = thread.id;
                    thread.waitingOnResource = null;
                    thread.state = "running";
                    this.log(`Thread ${thread.id} woke up and locked Resource ${neededRes}`, `t${thread.id}`);
                    task.currentStepIndex++;
                    stateChanged = true;
                } else {
                    // Still waiting or spinning
                    if (thread.state === "spinning") {
                        this.log(`Thread ${thread.id} spinning on lock for Resource ${neededRes}...`, `t${thread.id}`);
                    } else {
                        this.log(`Thread ${thread.id} blocked, waiting for Resource ${neededRes}`, `t${thread.id}`);
                    }
                }
            } else if (thread.state === "running") {
                if (step.type === "compute") {
                    this.log(`Thread ${thread.id} running computation step`, `t${thread.id}`);
                    task.currentStepIndex++;
                    stateChanged = true;
                } else if (step.type === "lock") {
                    const resId = step.resource;
                    const resource = this.resources[resId];
                    
                    if (resource.lockedBy === null) {
                        resource.lockedBy = thread.id;
                        this.log(`Thread ${thread.id} successfully locked Resource ${resId}`, `t${thread.id}`);
                        task.currentStepIndex++;
                        stateChanged = true;
                    } else if (resource.lockedBy === thread.id) {
                        this.log(`Thread ${thread.id} already holds lock for Resource ${resId}`, `t${thread.id}`);
                        task.currentStepIndex++;
                        stateChanged = true;
                    } else {
                        // Resource is locked! Block this thread.
                        // Simulate SPINLOCK vs OS WAIT: if spinlock, thread remains 'spinning'
                        // Let's decide randomly or make it 'waiting' (OS sleep)
                        const isSpin = Math.random() > 0.6;
                        thread.state = isSpin ? "spinning" : "waiting";
                        thread.waitingOnResource = resId;
                        this.log(`Thread ${thread.id} BLOCKED! Resource ${resId} is locked by Core ${resource.lockedBy}. Entering ${thread.state.toUpperCase()} state.`, `t${thread.id}`);
                        stateChanged = true;
                    }
                } else if (step.type === "unlock") {
                    const resId = step.resource;
                    const resource = this.resources[resId];
                    
                    if (resource.lockedBy === thread.id) {
                        resource.lockedBy = null;
                        this.log(`Thread ${thread.id} released lock on Resource ${resId}`, `t${thread.id}`);
                        task.currentStepIndex++;
                        stateChanged = true;
                    } else {
                        this.log(`Error: Thread ${thread.id} tried to unlock Resource ${resId} but did not hold it!`, "err");
                        task.currentStepIndex++;
                        stateChanged = true;
                    }
                } else if (step.type === "read") {
                    const resId = step.resource;
                    task.localVal = this.resources[resId].value;
                    this.log(`Thread ${thread.id} read Resource ${resId} value = ${task.localVal}`, `t${thread.id}`);
                    task.currentStepIndex++;
                    stateChanged = true;
                } else if (step.type === "write") {
                    const resId = step.resource;
                    const oldVal = this.resources[resId].value;
                    const newVal = step.valueModifier(task.localVal !== undefined ? task.localVal : oldVal);
                    this.resources[resId].value = newVal;
                    
                    this.log(`Thread ${thread.id} wrote Resource ${resId} value: ${oldVal} → ${newVal}`, `t${thread.id}`);
                    task.currentStepIndex++;
                    stateChanged = true;
                } else if (step.type === "yield") {
                    this.log(`Thread ${thread.id} yielded execution slice (Context Switch)`, `t${thread.id}`);
                    task.currentStepIndex++;
                    stateChanged = true;
                }
            }
        }

        // 3. Deadlock Cycle Detection
        const deadlocks = this.detectDeadlocks();
        if (deadlocks.length > 0) {
            this.log(`DEADLOCK IN PROGRESS! Circular wait detected: ${JSON.stringify(deadlocks)}`, "err");
            this.dom.simStatusBadge.textContent = "STATUS: DEADLOCKED";
            this.dom.simStatusBadge.style.color = "var(--conc-danger)";
            this.dom.simStatusBadge.style.borderColor = "var(--conc-danger)";
            
            // Mark all threads in the cycle as deadlocked
            for (let threadId of new Set(deadlocks.flat())) {
                const thread = this.threads.find(t => t.id === threadId);
                if (thread && thread.state !== "deadlocked") {
                    thread.state = "deadlocked";
                    this.log(`Thread ${thread.id} flagged as DEADLOCKED.`, "err");
                    stateChanged = true;
                }
            }
        }

        // Update UI
        this.updateVisuals(deadlocks);
    }

    detectDeadlocks() {
        const adj = {};
        for (let thread of this.threads) {
            if ((thread.state === "waiting" || thread.state === "spinning" || thread.state === "deadlocked") && thread.waitingOnResource) {
                const holder = this.resources[thread.waitingOnResource].lockedBy;
                if (holder !== null) {
                    adj[thread.id] = holder;
                }
            }
        }

        const cycles = [];
        const visited = new Set();

        for (let startNode in adj) {
            const numStart = parseInt(startNode);
            if (visited.has(numStart)) continue;

            const path = [];
            const pathSet = new Set();
            let curr = numStart;

            while (curr !== undefined) {
                if (pathSet.has(curr)) {
                    const cycleStartIdx = path.indexOf(curr);
                    const cycle = path.slice(cycleStartIdx);
                    cycles.push(cycle);
                    break;
                }
                if (visited.has(curr)) break;

                visited.add(curr);
                path.push(curr);
                pathSet.add(curr);
                curr = adj[curr];
            }
        }
        return cycles;
    }

    // ==========================================
    // UI UPDATES & SVG CONNECTIONS DRAWING
    // ==========================================
    updateVisuals(deadlocks = []) {
        // Update Threads
        this.threads.forEach(thread => {
            const el = document.getElementById(`thread-node-${thread.id}`);
            if (!el) return;

            // Remove previous state classes
            el.className = "thread-node";
            el.classList.add(`state-${thread.state}`);

            const badge = el.querySelector(".thread-status-badge");
            badge.className = `thread-status-badge ${thread.state}`;
            badge.textContent = thread.state;

            const nameText = el.querySelector(".task-name-text");
            const stepText = el.querySelector(".thread-task-step");

            if (thread.currentTask) {
                nameText.textContent = thread.currentTask.name;
                const step = thread.currentTask.steps[thread.currentTask.currentStepIndex];
                if (step) {
                    if (step.type === "lock") stepText.textContent = `Acquiring lock ${step.resource}`;
                    else if (step.type === "unlock") stepText.textContent = `Releasing lock ${step.resource}`;
                    else if (step.type === "read") stepText.textContent = `Reading ${step.resource}`;
                    else if (step.type === "write") stepText.textContent = `Writing ${step.resource}`;
                    else if (step.type === "yield") stepText.textContent = `Yielding CPU`;
                    else stepText.textContent = `Executing CPU task`;
                } else {
                    stepText.textContent = `Wrapping up`;
                }
            } else {
                nameText.textContent = "No active task";
                stepText.textContent = "";
            }
        });

        // Update Resources
        let hasCorruption = false;
        Object.values(this.resources).forEach(res => {
            const card = document.getElementById(`resource-node-${res.id}`);
            if (!card) return;

            const valDisplay = card.querySelector(".resource-value-display");
            const holderText = card.querySelector(".resource-holder-info");
            const badge = card.querySelector(".mutex-badge");

            valDisplay.textContent = res.isBalance ? `$${res.value}` : res.value;

            card.className = "resource-card";
            if (res.lockedBy !== null) {
                card.classList.add("locked");
                badge.innerHTML = `<i class="fas fa-lock"></i> Mutex ${res.id}`;
                holderText.textContent = `Locked by Core ${res.lockedBy}`;
            } else {
                card.classList.add("unlocked");
                badge.innerHTML = `<i class="fas fa-lock-open"></i> Mutex ${res.id}`;
                holderText.textContent = "Unlocked";
            }

            // Flag corruption on Resource A (Balance)
            if (res.isBalance) {
                const activeWorkersExist = this.threads.some(t => t.currentTask !== null);
                if (!activeWorkersExist && res.value !== 1000) {
                    card.classList.add("corrupted");
                    hasCorruption = true;
                }
            }
        });

        if (hasCorruption) {
            this.dom.expectedBox.style.borderColor = "var(--conc-danger)";
            this.dom.expectedBox.style.color = "var(--conc-danger)";
            this.dom.expectedBox.innerHTML = `Resource A (Shared Balance) CORRUPTED: <strong>$${this.resources["A"].value}</strong> (expected $1000).`;
        } else {
            this.dom.expectedBox.style.borderColor = "var(--glass-border)";
            this.dom.expectedBox.style.color = "var(--text-secondary)";
            this.dom.expectedBox.innerHTML = `Resource A (Shared Balance) expected final: <strong>$1000</strong> (if thread-safe).`;
        }

        // Draw overlay connections
        this.drawConnections(deadlocks);
    }

    drawConnections(deadlocks = []) {
        const svg = this.dom.svgOverlay;
        svg.innerHTML = ""; // Clear canvas

        const centerRect = this.dom.panelCenter.getBoundingClientRect();
        
        // Setup markers for arrow heads
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        
        const createMarker = (id, color) => {
            const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
            marker.setAttribute("id", id);
            marker.setAttribute("viewBox", "0 0 10 10");
            marker.setAttribute("refX", "6");
            marker.setAttribute("refY", "5");
            marker.setAttribute("markerWidth", "6");
            marker.setAttribute("markerHeight", "6");
            marker.setAttribute("orient", "auto-start-reverse");
            
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", "M 0 1 L 10 5 L 0 9 z");
            path.setAttribute("fill", color);
            marker.appendChild(path);
            return marker;
        };

        defs.appendChild(createMarker("arrow-yellow", "#eab308"));
        defs.appendChild(createMarker("arrow-green", "#10b981"));
        defs.appendChild(createMarker("arrow-red", "#ef4444"));
        svg.appendChild(defs);

        // 1. Draw Lock Ownerships & Waiting relationships
        this.threads.forEach(thread => {
            const threadEl = document.getElementById(`thread-node-${thread.id}`);
            if (!threadEl) return;

            const tRect = threadEl.getBoundingClientRect();
            const tx = tRect.left + tRect.width / 2 - centerRect.left;
            const ty = tRect.top + tRect.height / 2 - centerRect.top;

            // If thread is waiting on a resource
            if (thread.waitingOnResource) {
                const resEl = document.getElementById(`resource-node-${thread.waitingOnResource}`);
                if (resEl) {
                    const rRect = resEl.getBoundingClientRect();
                    const rx = rRect.left + rRect.width / 2 - centerRect.left;
                    const ry = rRect.top + rRect.height / 2 - centerRect.top;

                    // Draw line from Thread to Resource (Waiting line)
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    
                    // Create a curved path to avoid straight overlap
                    const dx = rx - tx;
                    const dy = ry - ty;
                    const cx = tx + dx / 2 - dy * 0.15;
                    const cy = ty + dy / 2 + dx * 0.15;

                    path.setAttribute("d", `M ${tx} ${ty} Q ${cx} ${cy} ${rx} ${ry}`);
                    path.setAttribute("class", "svg-line-request");
                    path.setAttribute("marker-end", "url(#arrow-yellow)");
                    svg.appendChild(path);
                }
            }
        });

        // For locked resources, draw owner line from Resource to Thread
        Object.values(this.resources).forEach(res => {
            if (res.lockedBy !== null) {
                const resEl = document.getElementById(`resource-node-${res.id}`);
                const threadEl = document.getElementById(`thread-node-${res.lockedBy}`);

                if (resEl && threadEl) {
                    const rRect = resEl.getBoundingClientRect();
                    const rx = rRect.left + rRect.width / 2 - centerRect.left;
                    const ry = rRect.top + rRect.height / 2 - centerRect.top;

                    const tRect = threadEl.getBoundingClientRect();
                    const tx = tRect.left + tRect.width / 2 - centerRect.left;
                    const ty = tRect.top + tRect.height / 2 - centerRect.top;

                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    
                    // Curve path slightly
                    const dx = tx - rx;
                    const dy = ty - ry;
                    const cx = rx + dx / 2 + dy * 0.15;
                    const cy = ry + dy / 2 - dx * 0.15;

                    path.setAttribute("d", `M ${rx} ${ry} Q ${cx} ${cy} ${tx} ${ty}`);
                    path.setAttribute("class", "svg-line-owner");
                    path.setAttribute("marker-end", "url(#arrow-green)");
                    svg.appendChild(path);
                }
            }
        });

        // 2. Draw Deadlock Cycles (if any)
        deadlocks.forEach(cycle => {
            // Draw lines connecting the deadlocked thread elements and resources circular
            const points = [];
            
            cycle.forEach(threadId => {
                const thread = this.threads.find(t => t.id === threadId);
                if (!thread) return;

                const tEl = document.getElementById(`thread-node-${thread.id}`);
                if (tEl) {
                    const tRect = tEl.getBoundingClientRect();
                    points.push({
                        x: tRect.left + tRect.width / 2 - centerRect.left,
                        y: tRect.top + tRect.height / 2 - centerRect.top,
                        type: "thread",
                        id: thread.id
                    });
                }

                if (thread.waitingOnResource) {
                    const rEl = document.getElementById(`resource-node-${thread.waitingOnResource}`);
                    if (rEl) {
                        const rRect = rEl.getBoundingClientRect();
                        points.push({
                            x: rRect.left + rRect.width / 2 - centerRect.left,
                            y: rRect.top + rRect.height / 2 - centerRect.top,
                            type: "resource",
                            id: thread.waitingOnResource
                        });
                    }
                }
            });

            if (points.length >= 2) {
                // Connect them in a loop
                const pathStr = points.map((p, idx) => {
                    return `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`;
                }).join(" ") + " Z";

                const cyclePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                cyclePath.setAttribute("d", pathStr);
                cyclePath.setAttribute("class", "svg-line-deadlock");
                cyclePath.setAttribute("marker-end", "url(#arrow-red)");
                svg.appendChild(cyclePath);
            }
        });
    }

    // ==========================================
    // SCENARIO LOADER FUNCTIONS
    // ==========================================
    loadScenarioPool() {
        this.reset();
        this.log("Scenario Loaded: Thread Pool Load Balancing Demo.", "sys");
        this.log("Description: 8 simple computational tasks are queued. Watch the 4 cores split the workload evenly.", "sys");

        for (let i = 1; i <= 8; i++) {
            // Random duration represented by number of compute steps
            const stepsCount = Math.floor(Math.random() * 3) + 2; // 2 to 4 steps
            const steps = [];
            for (let s = 0; s < stepsCount; s++) {
                steps.push({ type: "compute" });
            }

            this.tasksQueue.push({
                name: `ComputeTask-${i}`,
                steps: steps,
                status: "queued",
                currentStepIndex: 0
            });
        }

        this.renderQueue();
        this.togglePlay();
    }

    loadScenarioRace() {
        this.reset();
        this.log("Scenario Loaded: Race Condition (Unsafe).", "sys");
        this.log("Description: deposit and withdraw tasks will execute concurrently on Resource A without any mutex locks. A context switch is forced mid-operation, resulting in balance corruption.", "sys");

        this.resources["A"].value = 1000;

        // DepositTask
        this.tasksQueue.push({
            name: "DepositTask (Core 1)",
            steps: [
                { type: "read", resource: "A" },
                { type: "yield" }, // Force context switch
                { type: "write", resource: "A", valueModifier: (val) => val + 100 }
            ],
            status: "queued",
            currentStepIndex: 0
        });

        // WithdrawTask
        this.tasksQueue.push({
            name: "WithdrawTask (Core 2)",
            steps: [
                { type: "read", resource: "A" },
                { type: "yield" }, // Force context switch
                { type: "write", resource: "A", valueModifier: (val) => val - 100 }
            ],
            status: "queued",
            currentStepIndex: 0
        });

        this.renderQueue();
        this.renderResources();
        this.togglePlay();
    }

    loadScenarioSafe() {
        this.reset();
        this.log("Scenario Loaded: Thread-Safe Mutex Execution.", "sys");
        this.log("Description: Same deposit/withdraw tasks, but wrapped inside Lock/Unlock commands for Mutex A. Core 2 is blocked until Core 1 finishes writing and unlocks Mutex A.", "sys");

        this.resources["A"].value = 1000;

        // SafeDepositTask
        this.tasksQueue.push({
            name: "SafeDepositTask",
            steps: [
                { type: "lock", resource: "A" },
                { type: "read", resource: "A" },
                { type: "yield" },
                { type: "write", resource: "A", valueModifier: (val) => val + 100 },
                { type: "unlock", resource: "A" }
            ],
            status: "queued",
            currentStepIndex: 0
        });

        // SafeWithdrawTask
        this.tasksQueue.push({
            name: "SafeWithdrawTask",
            steps: [
                { type: "lock", resource: "A" },
                { type: "read", resource: "A" },
                { type: "yield" },
                { type: "write", resource: "A", valueModifier: (val) => val - 100 },
                { type: "unlock", resource: "A" }
            ],
            status: "queued",
            currentStepIndex: 0
        });

        this.renderQueue();
        this.renderResources();
        this.togglePlay();
    }

    loadScenarioDeadlock() {
        this.reset();
        this.log("Scenario Loaded: Mutual Deadlock.", "sys");
        this.log("Description: Thread 1 locks Mutex A, then yields to Thread 2 which locks Mutex B. Thread 1 requests Mutex B (blocked) while Thread 2 requests Mutex A (blocked). Circle is drawn.", "sys");

        // Thread 1: Lock A, lock B
        this.tasksQueue.push({
            name: "DeadlockTask-1",
            steps: [
                { type: "lock", resource: "A" },
                { type: "yield" },
                { type: "lock", resource: "B" },
                { type: "unlock", resource: "B" },
                { type: "unlock", resource: "A" }
            ],
            status: "queued",
            currentStepIndex: 0
        });

        // Thread 2: Lock B, lock A
        this.tasksQueue.push({
            name: "DeadlockTask-2",
            steps: [
                { type: "lock", resource: "B" },
                { type: "yield" },
                { type: "lock", resource: "A" },
                { type: "unlock", resource: "A" },
                { type: "unlock", resource: "B" }
            ],
            status: "queued",
            currentStepIndex: 0
        });

        this.renderQueue();
        this.togglePlay();
    }

    // ==========================================
    // CUSTOM TASK CREATOR
    // ==========================================
    addCustomStep() {
        const stepVal = this.dom.stepSelector.value;
        let stepText = "";
        let stepObj = {};

        if (stepVal === "compute") {
            stepText = "Compute";
            stepObj = { type: "compute" };
        } else if (stepVal === "lock_A") {
            stepText = "Lock Mutex A";
            stepObj = { type: "lock", resource: "A" };
        } else if (stepVal === "lock_B") {
            stepText = "Lock Mutex B";
            stepObj = { type: "lock", resource: "B" };
        } else if (stepVal === "unlock_A") {
            stepText = "Unlock Mutex A";
            stepObj = { type: "unlock", resource: "A" };
        } else if (stepVal === "unlock_B") {
            stepText = "Unlock Mutex B";
            stepObj = { type: "unlock", resource: "B" };
        } else if (stepVal === "read_A") {
            stepText = "Read A";
            stepObj = { type: "read", resource: "A" };
        } else if (stepVal === "write_A") {
            stepText = "Write A (+/- 50)";
            // Let custom write adjust value randomly +50 or -50 for visual effect
            const mod = Math.random() > 0.5 ? 50 : -50;
            stepObj = { type: "write", resource: "A", valueModifier: (val) => val + mod };
        } else if (stepVal === "yield") {
            stepText = "Yield (CPU)";
            stepObj = { type: "yield" };
        }

        this.customTaskSteps.push(stepObj);
        this.renderCustomSteps();
    }

    renderCustomSteps() {
        const stepsContainer = this.dom.stepsList;
        stepsContainer.innerHTML = "";
        
        if (this.customTaskSteps.length === 0) {
            stepsContainer.innerHTML = `<div class="no-steps-placeholder">No steps added yet. Click '+' to build.</div>`;
            return;
        }

        this.customTaskSteps.forEach((step, idx) => {
            const pill = document.createElement("div");
            pill.className = "step-pill";
            
            let label = "Step";
            if (step.type === "compute") label = "Compute";
            else if (step.type === "lock") label = `Lock ${step.resource}`;
            else if (step.type === "unlock") label = `Unlock ${step.resource}`;
            else if (step.type === "read") label = `Read ${step.resource}`;
            else if (step.type === "write") label = `Write ${step.resource}`;
            else if (step.type === "yield") label = "Yield";

            pill.innerHTML = `
                <span>${idx + 1}. ${label}</span>
                <button onclick="window.simulator.removeCustomStep(${idx})"><i class="fas fa-times"></i></button>
            `;
            stepsContainer.appendChild(pill);
        });
    }

    removeCustomStep(index) {
        this.customTaskSteps.splice(index, 1);
        this.renderCustomSteps();
    }

    enqueueCustomTask() {
        const name = this.dom.taskName.value.trim() || "CustomTask";
        if (this.customTaskSteps.length === 0) {
            this.log("Error: Cannot enqueue task with no steps.", "err");
            void 0;
            return;
        }

        const task = {
            name: `${name} (${this.tasksQueue.length + 1})`,
            steps: [...this.customTaskSteps],
            status: "queued",
            currentStepIndex: 0
        };

        this.tasksQueue.push(task);
        this.log(`Enqueued custom task: ${task.name}`, "sys");
        
        // Reset builder state
        this.customTaskSteps = [];
        this.renderCustomSteps();
        this.renderQueue();
    }
}
