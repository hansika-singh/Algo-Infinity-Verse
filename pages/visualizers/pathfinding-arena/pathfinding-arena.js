/**
 * pathfinding-arena.js
 * Implements a Side-by-Side Pathfinding Arena Comparison.
 * Synchronized drawing, parallel algorithm execution, and dual search wave animations.
 */

document.addEventListener("DOMContentLoaded", () => {
    window.arena = new PathfindingArena();
});

class PathfindingArena {
    constructor() {
        this.cacheDOM();
        this.init();
    }

    cacheDOM() {
        this.dom = {
            toolStart: document.getElementById("toolStart"),
            toolTarget: document.getElementById("toolTarget"),
            toolWall: document.getElementById("toolWall"),
            toolWeight: document.getElementById("toolWeight"),
            toolEraser: document.getElementById("toolEraser"),
            
            btnStartRace: document.getElementById("btnStartRace"),
            btnPauseRace: document.getElementById("btnPauseRace"),
            btnClearPaths: document.getElementById("btnClearPaths"),
            btnResetGrids: document.getElementById("btnResetGrids"),
            
            gridSizeSelector: document.getElementById("gridSizeSelector"),
            speedSlider: document.getElementById("speedSlider"),
            speedDisplay: document.getElementById("speedDisplay"),
            
            algoSelectLeft: document.getElementById("algoSelectLeft"),
            algoSelectRight: document.getElementById("algoSelectRight"),
            
            visitedLeft: document.getElementById("visitedLeft"),
            costLeft: document.getElementById("costLeft"),
            waveLeft: document.getElementById("waveLeft"),
            
            visitedRight: document.getElementById("visitedRight"),
            costRight: document.getElementById("costRight"),
            waveRight: document.getElementById("waveRight"),
            
            gridContainerLeft: document.getElementById("gridContainerLeft"),
            gridContainerRight: document.getElementById("gridContainerRight")
        };
    }

    init() {
        this.rows = parseInt(this.dom.gridSizeSelector.value);
        this.cols = this.rows;
        
        this.activeTool = "start"; // default tool
        this.isDrawing = false;
        this.isPlaying = false;
        this.animationFrameId = null;
        this.speed = parseInt(this.dom.speedSlider.value);
        
        this.startNode = { r: Math.floor(this.rows / 2), c: 3 };
        this.targetNode = { r: Math.floor(this.rows / 2), c: this.cols - 4 };
        
        this.walls = new Set();
        this.weights = new Map(); // key -> weight (5)
        
        this.leftPath = [];
        this.leftVisited = [];
        this.rightPath = [];
        this.rightVisited = [];
        
        this.animIndexLeft = 0;
        this.animIndexRight = 0;
        this.isPathDrawingLeft = false;
        this.isPathDrawingRight = false;
        this.pathIndexLeft = 0;
        this.pathIndexRight = 0;

        this.bindEvents();
        this.rebuildGrids();
    }

    bindEvents() {
        // Tool Buttons
        const toolBtns = [this.dom.toolStart, this.dom.toolTarget, this.dom.toolWall, this.dom.toolWeight, this.dom.toolEraser];
        toolBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                toolBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                this.activeTool = btn.getAttribute("data-tool");
            });
        });

        // Config Controls
        this.dom.gridSizeSelector.addEventListener("change", (e) => {
            this.rows = parseInt(e.target.value);
            this.cols = this.rows;
            this.startNode = { r: Math.floor(this.rows / 2), c: 3 };
            this.targetNode = { r: Math.floor(this.rows / 2), c: this.cols - 4 };
            this.resetGrids();
        });

        this.dom.speedSlider.addEventListener("input", (e) => {
            this.speed = parseInt(e.target.value);
            this.dom.speedDisplay.textContent = `${this.speed}x`;
        });

        // Simulation Controls
        this.dom.btnStartRace.addEventListener("click", () => this.startRace());
        this.dom.btnPauseRace.addEventListener("click", () => this.togglePause());
        this.dom.btnClearPaths.addEventListener("click", () => this.clearPaths());
        this.dom.btnResetGrids.addEventListener("click", () => this.resetGrids());

        // Mouse drawing triggers
        document.body.addEventListener("mouseup", () => {
            this.isDrawing = false;
        });
    }

    rebuildGrids() {
        this.dom.gridContainerLeft.innerHTML = "";
        this.dom.gridContainerRight.innerHTML = "";
        
        // Set CSS grid size variables
        this.dom.gridContainerLeft.style.setProperty("--grid-cols", this.cols);
        this.dom.gridContainerLeft.style.setProperty("--grid-rows", this.rows);
        this.dom.gridContainerRight.style.setProperty("--grid-cols", this.cols);
        this.dom.gridContainerRight.style.setProperty("--grid-rows", this.rows);
        
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cellL = this.createCellDOM(r, c, "left");
                const cellR = this.createCellDOM(r, c, "right");
                
                this.dom.gridContainerLeft.appendChild(cellL);
                this.dom.gridContainerRight.appendChild(cellR);
            }
        }

        this.syncCellVisualsAll();
    }

    createCellDOM(r, c, side) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.id = `cell-${side}-${r}-${c}`;
        cell.setAttribute("data-row", r);
        cell.setAttribute("data-col", c);

        // Bind grid synchronization drag-drawing
        cell.addEventListener("mousedown", (e) => {
            e.preventDefault();
            this.isDrawing = true;
            this.applyTool(r, c);
        });

        cell.addEventListener("mouseenter", () => {
            if (this.isDrawing) {
                this.applyTool(r, c);
            }
        });

        return cell;
    }

    getKey(r, c) {
        return `${r},${c}`;
    }

    applyTool(r, c) {
        if (this.isPlaying) return; // Cannot edit during animation

        const key = this.getKey(r, c);
        
        if (this.activeTool === "start") {
            if (r === this.targetNode.r && c === this.targetNode.c) return; // Cannot overlap
            this.startNode = { r, c };
            this.walls.delete(key);
            this.weights.delete(key);
            this.syncCellVisualsAll();
        } else if (this.activeTool === "target") {
            if (r === this.startNode.r && c === this.startNode.c) return;
            this.targetNode = { r, c };
            this.walls.delete(key);
            this.weights.delete(key);
            this.syncCellVisualsAll();
        } else if (this.activeTool === "wall") {
            if ((r === this.startNode.r && c === this.startNode.c) || (r === this.targetNode.r && c === this.targetNode.c)) return;
            this.walls.add(key);
            this.weights.delete(key);
            this.syncCellVisual(r, c);
        } else if (this.activeTool === "weight") {
            if ((r === this.startNode.r && c === this.startNode.c) || (r === this.targetNode.r && c === this.targetNode.c)) return;
            this.weights.set(key, 5); // cost of weight cell is 5
            this.walls.delete(key);
            this.syncCellVisual(r, c);
        } else if (this.activeTool === "erase") {
            this.walls.delete(key);
            this.weights.delete(key);
            this.syncCellVisual(r, c);
        }
    }

    syncCellVisual(r, c) {
        const key = this.getKey(r, c);
        const cellL = document.getElementById(`cell-left-${r}-${c}`);
        const cellR = document.getElementById(`cell-right-${r}-${c}`);
        
        if (!cellL || !cellR) return;

        // Clean cell state classes
        const classes = ["wall", "weight", "start", "target", "shortest-path", "visited-left", "visited-right", "frontier-left", "frontier-right"];
        cellL.classList.remove(...classes);
        cellR.classList.remove(...classes);

        if (r === this.startNode.r && c === this.startNode.c) {
            cellL.classList.add("start");
            cellR.classList.add("start");
        } else if (r === this.targetNode.r && c === this.targetNode.c) {
            cellL.classList.add("target");
            cellR.classList.add("target");
        } else if (this.walls.has(key)) {
            cellL.classList.add("wall");
            cellR.classList.add("wall");
        } else if (this.weights.has(key)) {
            cellL.classList.add("weight");
            cellR.classList.add("weight");
        }
    }

    syncCellVisualsAll() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.syncCellVisual(r, c);
            }
        }
    }

    clearPaths() {
        this.isPlaying = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.dom.btnStartRace.innerHTML = `<i class="fas fa-flag-checkered"></i> Start Race`;
        this.dom.btnPauseRace.textContent = "Pause";
        
        // Reset stats
        this.dom.visitedLeft.textContent = "0";
        this.dom.costLeft.textContent = "0";
        this.dom.waveLeft.textContent = "0";
        this.dom.visitedRight.textContent = "0";
        this.dom.costRight.textContent = "0";
        this.dom.waveRight.textContent = "0";

        // Remove visited/shortest-path classes
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cellL = document.getElementById(`cell-left-${r}-${c}`);
                const cellR = document.getElementById(`cell-right-${r}-${c}`);
                
                if (cellL) cellL.classList.remove("visited-left", "shortest-path", "frontier-left");
                if (cellR) cellR.classList.remove("visited-right", "shortest-path", "frontier-right");
            }
        }
    }

    resetGrids() {
        this.clearPaths();
        this.walls.clear();
        this.weights.clear();
        this.rebuildGrids();
    }

    getNeighbors(r, c) {
        const neighbors = [];
        const dirs = [
            [-1, 0], // Up
            [1, 0],  // Down
            [0, -1], // Left
            [0, 1]   // Right
        ];

        for (let [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                if (!this.walls.has(this.getKey(nr, nc))) {
                    neighbors.push({ r: nr, c: nc });
                }
            }
        }
        return neighbors;
    }

    getWeight(r, c) {
        const key = this.getKey(r, c);
        return this.weights.has(key) ? this.weights.get(key) : 1;
    }

    // ==========================================
    // PATHFINDING ALGORITHMS
    // ==========================================

    runBFS() {
        const visited = [];
        const queue = [this.startNode];
        const visitedSet = new Set([this.getKey(this.startNode.r, this.startNode.c)]);
        const parent = {};
        let found = false;

        while (queue.length > 0) {
            const curr = queue.shift();
            visited.push(curr);

            if (curr.r === this.targetNode.r && curr.c === this.targetNode.c) {
                found = true;
                break;
            }

            for (let neighbor of this.getNeighbors(curr.r, curr.c)) {
                const key = this.getKey(neighbor.r, neighbor.c);
                if (!visitedSet.has(key)) {
                    visitedSet.add(key);
                    parent[key] = curr;
                    queue.push(neighbor);
                }
            }
        }

        const path = found ? this.backtrackPath(parent) : [];
        return { path, visited };
    }

    runDFS() {
        const visited = [];
        const stack = [this.startNode];
        const visitedSet = new Set();
        const parent = {};
        let found = false;

        while (stack.length > 0) {
            const curr = stack.pop();
            const currKey = this.getKey(curr.r, curr.c);

            if (visitedSet.has(currKey)) continue;
            visitedSet.add(currKey);
            visited.push(curr);

            if (curr.r === this.targetNode.r && curr.c === this.targetNode.c) {
                found = true;
                break;
            }

            for (let neighbor of this.getNeighbors(curr.r, curr.c)) {
                const key = this.getKey(neighbor.r, neighbor.c);
                if (!visitedSet.has(key)) {
                    parent[key] = curr;
                    stack.push(neighbor);
                }
            }
        }

        const path = found ? this.backtrackPath(parent) : [];
        return { path, visited };
    }

    runDijkstra() {
        const visited = [];
        const parent = {};
        const dist = {};
        
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                dist[this.getKey(r, c)] = Infinity;
            }
        }
        dist[this.getKey(this.startNode.r, this.startNode.c)] = 0;

        const openSet = [{ node: this.startNode, d: 0 }];
        const closedSet = new Set();
        let found = false;

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.d - b.d);
            const { node: curr } = openSet.shift();
            const currKey = this.getKey(curr.r, curr.c);

            if (closedSet.has(currKey)) continue;
            closedSet.add(currKey);
            visited.push(curr);

            if (curr.r === this.targetNode.r && curr.c === this.targetNode.c) {
                found = true;
                break;
            }

            for (let neighbor of this.getNeighbors(curr.r, curr.c)) {
                const neighborKey = this.getKey(neighbor.r, neighbor.c);
                if (closedSet.has(neighborKey)) continue;

                const alt = dist[currKey] + this.getWeight(neighbor.r, neighbor.c);
                if (alt < dist[neighborKey]) {
                    dist[neighborKey] = alt;
                    parent[neighborKey] = curr;
                    openSet.push({ node: neighbor, d: alt });
                }
            }
        }

        const path = found ? this.backtrackPath(parent) : [];
        return { path, visited };
    }

    runAStar() {
        const visited = [];
        const parent = {};
        const gScore = {};
        const fScore = {};

        const heuristic = (node) => {
            return Math.abs(node.r - this.targetNode.r) + Math.abs(node.c - this.targetNode.c);
        };

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const key = this.getKey(r, c);
                gScore[key] = Infinity;
                fScore[key] = Infinity;
            }
        }

        const startKey = this.getKey(this.startNode.r, this.startNode.c);
        gScore[startKey] = 0;
        fScore[startKey] = heuristic(this.startNode);

        const openSet = [{ node: this.startNode, f: fScore[startKey], g: 0 }];
        const openSetKeys = new Set([startKey]);
        const closedSet = new Set();
        let found = false;

        while (openSet.length > 0) {
            openSet.sort((a, b) => {
                if (a.f === b.f) {
                    return b.g - a.g; // prefer higher g-score
                }
                return a.f - b.f;
            });
            const { node: curr, g } = openSet.shift();
            const currKey = this.getKey(curr.r, curr.c);
            openSetKeys.delete(currKey);

            if (closedSet.has(currKey)) continue;
            closedSet.add(currKey);
            visited.push(curr);

            if (curr.r === this.targetNode.r && curr.c === this.targetNode.c) {
                found = true;
                break;
            }

            for (let neighbor of this.getNeighbors(curr.r, curr.c)) {
                const neighborKey = this.getKey(neighbor.r, neighbor.c);
                if (closedSet.has(neighborKey)) continue;

                const tentativeG = gScore[currKey] + this.getWeight(neighbor.r, neighbor.c);

                if (tentativeG < gScore[neighborKey]) {
                    parent[neighborKey] = curr;
                    gScore[neighborKey] = tentativeG;
                    fScore[neighborKey] = tentativeG + heuristic(neighbor);

                    if (!openSetKeys.has(neighborKey)) {
                        openSet.push({ node: neighbor, f: fScore[neighborKey], g: tentativeG });
                        openSetKeys.add(neighborKey);
                    }
                }
            }
        }

        const path = found ? this.backtrackPath(parent) : [];
        return { path, visited };
    }

    backtrackPath(parent) {
        const path = [];
        let curr = this.targetNode;
        while (curr) {
            path.push(curr);
            curr = parent[this.getKey(curr.r, curr.c)];
        }
        return path.reverse();
    }

    getPathCost(path) {
        if (path.length === 0) return 0;
        let cost = 0;
        for (let i = 1; i < path.length; i++) {
            cost += this.getWeight(path[i].r, path[i].c);
        }
        return cost;
    }

    // ==========================================
    // ANIMATION timeline PLAYBACK
    // ==========================================
    startRace() {
        this.clearPaths();
        
        const algoLeft = this.dom.algoSelectLeft.value;
        const algoRight = this.dom.algoSelectRight.value;
        
        // Execute pathfinding algorithms
        const resLeft = this.executeAlgorithm(algoLeft);
        this.leftVisited = resLeft.visited;
        this.leftPath = resLeft.path;
        
        const resRight = this.executeAlgorithm(algoRight);
        this.rightVisited = resRight.visited;
        this.rightPath = resRight.path;

        // Reset animation indices
        this.animIndexLeft = 0;
        this.animIndexRight = 0;
        this.isPathDrawingLeft = false;
        this.isPathDrawingRight = false;
        this.pathIndexLeft = 0;
        this.pathIndexRight = 0;

        this.isPlaying = true;
        this.dom.btnStartRace.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Racing...`;
        this.dom.btnPauseRace.textContent = "Pause";

        // Start requestAnimationFrame loop
        this.animationFrameId = requestAnimationFrame(() => this.playbackLoop());
    }

    executeAlgorithm(name) {
        if (name === "astar") return this.runAStar();
        if (name === "dijkstra") return this.runDijkstra();
        if (name === "bfs") return this.runBFS();
        return this.runDFS();
    }

    togglePause() {
        if (!this.isPlaying && (this.animIndexLeft < this.leftVisited.length || this.animIndexRight < this.rightVisited.length)) {
            // Resume
            this.isPlaying = true;
            this.dom.btnPauseRace.textContent = "Pause";
            this.animationFrameId = requestAnimationFrame(() => this.playbackLoop());
        } else {
            // Pause
            this.isPlaying = false;
            this.dom.btnPauseRace.textContent = "Resume";
            if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        }
    }

    playbackLoop() {
        if (!this.isPlaying) return;

        // Step speed multiplier per frame
        const stepsPerFrame = this.speed;

        // 1. Animate Left Side
        if (!this.isPathDrawingLeft) {
            // Visited animation
            for (let i = 0; i < stepsPerFrame && this.animIndexLeft < this.leftVisited.length; i++) {
                const node = this.leftVisited[this.animIndexLeft];
                
                // Keep start/target cell classes intact
                if (!(node.r === this.startNode.r && node.c === this.startNode.c) && 
                    !(node.r === this.targetNode.r && node.c === this.targetNode.c)) {
                    
                    const cell = document.getElementById(`cell-left-${node.r}-${node.c}`);
                    if (cell) {
                        cell.classList.remove("frontier-left");
                        cell.classList.add("visited-left");
                    }
                }
                this.animIndexLeft++;
            }
            
            // Highlight frontier (the most recently enqueued/visited cells)
            const frontierLeft = this.leftVisited.slice(Math.max(0, this.animIndexLeft - 5), this.animIndexLeft);
            frontierLeft.forEach(node => {
                if (!(node.r === this.startNode.r && node.c === this.startNode.c) && 
                    !(node.r === this.targetNode.r && node.c === this.targetNode.c)) {
                    const cell = document.getElementById(`cell-left-${node.r}-${node.c}`);
                    if (cell) cell.classList.add("frontier-left");
                }
            });

            this.dom.visitedLeft.textContent = this.animIndexLeft;

            if (this.animIndexLeft >= this.leftVisited.length) {
                // Done visited expansion, trigger path drawing
                this.isPathDrawingLeft = true;
                this.pathIndexLeft = 0;
                // Clear all remaining frontiers
                for (let r = 0; r < this.rows; r++) {
                    for (let c = 0; c < this.cols; c++) {
                        const cell = document.getElementById(`cell-left-${r}-${c}`);
                        if (cell) cell.classList.remove("frontier-left");
                    }
                }
            }
        } else {
            // Shortest path animation
            for (let i = 0; i < stepsPerFrame && this.pathIndexLeft < this.leftPath.length; i++) {
                const node = this.leftPath[this.pathIndexLeft];
                if (!(node.r === this.startNode.r && node.c === this.startNode.c) && 
                    !(node.r === this.targetNode.r && node.c === this.targetNode.c)) {
                    
                    const cell = document.getElementById(`cell-left-${node.r}-${node.c}`);
                    if (cell) cell.classList.add("shortest-path");
                }
                this.pathIndexLeft++;
            }

            if (this.pathIndexLeft >= this.leftPath.length) {
                this.dom.costLeft.textContent = this.getPathCost(this.leftPath);
                this.dom.waveLeft.textContent = this.leftVisited.length;
            }
        }

        // 2. Animate Right Side
        if (!this.isPathDrawingRight) {
            // Visited animation
            for (let i = 0; i < stepsPerFrame && this.animIndexRight < this.rightVisited.length; i++) {
                const node = this.rightVisited[this.animIndexRight];
                
                if (!(node.r === this.startNode.r && node.c === this.startNode.c) && 
                    !(node.r === this.targetNode.r && node.c === this.targetNode.c)) {
                    
                    const cell = document.getElementById(`cell-right-${node.r}-${node.c}`);
                    if (cell) {
                        cell.classList.remove("frontier-right");
                        cell.classList.add("visited-right");
                    }
                }
                this.animIndexRight++;
            }

            // Frontier highlights
            const frontierRight = this.rightVisited.slice(Math.max(0, this.animIndexRight - 5), this.animIndexRight);
            frontierRight.forEach(node => {
                if (!(node.r === this.startNode.r && node.c === this.startNode.c) && 
                    !(node.r === this.targetNode.r && node.c === this.targetNode.c)) {
                    const cell = document.getElementById(`cell-right-${node.r}-${node.c}`);
                    if (cell) cell.classList.add("frontier-right");
                }
            });

            this.dom.visitedRight.textContent = this.animIndexRight;

            if (this.animIndexRight >= this.rightVisited.length) {
                this.isPathDrawingRight = true;
                this.pathIndexRight = 0;
                for (let r = 0; r < this.rows; r++) {
                    for (let c = 0; c < this.cols; c++) {
                        const cell = document.getElementById(`cell-right-${r}-${c}`);
                        if (cell) cell.classList.remove("frontier-right");
                    }
                }
            }
        } else {
            // Shortest path animation
            for (let i = 0; i < stepsPerFrame && this.pathIndexRight < this.rightPath.length; i++) {
                const node = this.rightPath[this.pathIndexRight];
                if (!(node.r === this.startNode.r && node.c === this.startNode.c) && 
                    !(node.r === this.targetNode.r && node.c === this.targetNode.c)) {
                    
                    const cell = document.getElementById(`cell-right-${node.r}-${node.c}`);
                    if (cell) cell.classList.add("shortest-path");
                }
                this.pathIndexRight++;
            }

            if (this.pathIndexRight >= this.rightPath.length) {
                this.dom.costRight.textContent = this.getPathCost(this.rightPath);
                this.dom.waveRight.textContent = this.rightVisited.length;
            }
        }

        // Check if both finished
        const leftFinished = this.isPathDrawingLeft && this.pathIndexLeft >= this.leftPath.length;
        const rightFinished = this.isPathDrawingRight && this.pathIndexRight >= this.rightPath.length;

        if (leftFinished && rightFinished) {
            this.isPlaying = false;
            this.dom.btnStartRace.innerHTML = `<i class="fas fa-flag-checkered"></i> Start Race`;
            this.dom.btnPauseRace.textContent = "Pause";
            this.logCompletedRace();
            return;
        }

        this.animationFrameId = requestAnimationFrame(() => this.playbackLoop());
    }

    logCompletedRace() {
        const leftCost = this.getPathCost(this.leftPath);
        const rightCost = this.getPathCost(this.rightPath);
        const leftVisited = this.leftVisited.length;
        const rightVisited = this.rightVisited.length;
        
        console.log(`Race Finished! Left Path Cost: ${leftCost}, Nodes Visited: ${leftVisited}. Right Path Cost: ${rightCost}, Nodes Visited: ${rightVisited}.`);
    }
}
