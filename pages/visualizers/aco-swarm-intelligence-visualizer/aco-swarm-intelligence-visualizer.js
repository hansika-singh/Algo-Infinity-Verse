/**
 * Algo-Infinity-Verse | Ant Colony Optimization (ACO) Swarm Visualizer
 * Simulates independent ant agents performing TSP graph traversal with pheromone updates.
 */

class ACOVisualizer {
    constructor() {
        // UI DOM Elements
        this.canvas = document.getElementById('aco-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.btnPlay = document.getElementById('btn-play');
        this.btnClear = document.getElementById('btn-clear');
        this.btnReset = document.getElementById('btn-reset');
        
        this.valGenerations = document.getElementById('metric-generations');
        this.valBestDist = document.getElementById('metric-best-dist');
        this.statusText = document.getElementById('status-text');

        // Sliders & Params
        this.bindSliders();
        this.updateParamsFromUI();

        // Algorithm Constants
        this.numNodes = 15;
        this.Q = 1000; // Pheromone deposit scaling factor
        this.initialPheromone = 0.1;
        this.antSpeed = 3.0; // Base movement pixels per frame

        // Graph State
        this.nodes = [];
        this.distances = [];
        this.pheromones = [];
        this.ants = [];
        
        this.bestTour = null;
        this.bestDistance = Infinity;
        this.generationCount = 0;

        // Render Loop State
        this.isPlaying = true;
        this.animationFrameId = null;

        this.init();
    }

    bindSliders() {
        const attachSlider = (id, targetId) => {
            const el = document.getElementById(id);
            const valEl = document.getElementById(targetId);
            el.addEventListener('input', (e) => {
                valEl.textContent = e.target.value;
                this.updateParamsFromUI();
            });
        };

        attachSlider('slider-alpha', 'val-alpha');
        attachSlider('slider-beta', 'val-beta');
        attachSlider('slider-evap', 'val-evap');
        
        // Ant count specifically triggers a re-allocation of agent pool
        const antSlider = document.getElementById('slider-ants');
        antSlider.addEventListener('input', (e) => {
            document.getElementById('val-ants').textContent = e.target.value;
            this.updateParamsFromUI();
            this.syncAntPopulation();
        });
    }

    updateParamsFromUI() {
        this.alpha = parseFloat(document.getElementById('slider-alpha').value);
        this.beta = parseFloat(document.getElementById('slider-beta').value);
        this.evaporationRate = parseFloat(document.getElementById('slider-evap').value);
        this.numAnts = parseInt(document.getElementById('slider-ants').value);
    }

    init() {
        this.btnPlay.addEventListener('click', () => this.togglePlay());
        this.btnClear.addEventListener('click', () => this.clearPheromones());
        this.btnReset.addEventListener('click', () => this.generateGraph());

        let resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.resize();
                this.generateGraph();
            }, 250);
        });

        this.resize();
        this.generateGraph();
        this.startRenderLoop();
    }

    resize() {
        const wrapper = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = wrapper.clientWidth * dpr;
        this.canvas.height = wrapper.clientHeight * dpr;
        this.ctx.scale(dpr, dpr);
    }

    /* --- Graph Generation & ACO Setup --- */

    generateGraph() {
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);
        const padding = 40;

        // Reset tracking
        this.nodes = [];
        this.bestTour = null;
        this.bestDistance = Infinity;
        this.generationCount = 0;
        this.valGenerations.textContent = '0';
        this.valBestDist.textContent = '∞';
        this.statusText.textContent = "Agents exploring new state space. Pheromones accumulating.";

        // 1. Generate Nodes (Sites)
        for (let i = 0; i < this.numNodes; i++) {
            this.nodes.push({
                x: padding + Math.random() * (w - padding * 2),
                y: padding + Math.random() * (h - padding * 2)
            });
        }

        // 2. Precompute Distances & Init Pheromones
        this.distances = Array(this.numNodes).fill(null).map(() => Array(this.numNodes).fill(0));
        this.pheromones = Array(this.numNodes).fill(null).map(() => Array(this.numNodes).fill(this.initialPheromone));

        for (let i = 0; i < this.numNodes; i++) {
            for (let j = 0; j < this.numNodes; j++) {
                if (i !== j) {
                    const dx = this.nodes[i].x - this.nodes[j].x;
                    const dy = this.nodes[i].y - this.nodes[j].y;
                    this.distances[i][j] = Math.sqrt(dx * dx + dy * dy);
                }
            }
        }

        // 3. Spawn Ant Agents
        this.ants = [];
        this.syncAntPopulation();
    }

    syncAntPopulation() {
        // If more ants needed, add them
        while (this.ants.length < this.numAnts) {
            this.ants.push(this.createAnt());
        }
        // If fewer ants needed, slice the array
        if (this.ants.length > this.numAnts) {
            this.ants = this.ants.slice(0, this.numAnts);
        }
    }

    createAnt() {
        const startNode = Math.floor(Math.random() * this.numNodes);
        return {
            tour: [startNode],
            visited: new Set([startNode]),
            currentNode: startNode,
            targetNode: this.pickNextNode(startNode, new Set([startNode])),
            progress: 0, // distance traveled along current edge
            tourDistance: 0
        };
    }

    clearPheromones() {
        for (let i = 0; i < this.numNodes; i++) {
            for (let j = 0; j < this.numNodes; j++) {
                this.pheromones[i][j] = this.initialPheromone;
            }
        }
        this.bestTour = null;
        this.bestDistance = Infinity;
        this.valBestDist.textContent = '∞';
        this.statusText.textContent = "Pheromones cleared. Swarm memory erased.";
    }

    /* --- Swarm Core Logic --- */

    pickNextNode(current, visitedSet) {
        if (visitedSet.size === this.numNodes) {
            return this.ants[0].tour[0]; // Return to start to complete loop
        }

        const probabilities = [];
        let probSum = 0;

        // Calculate ACO probability for all unvisited adjacent nodes
        for (let i = 0; i < this.numNodes; i++) {
            if (!visitedSet.has(i)) {
                // Epsilon to prevent NaN/Infinity crashing the math
                let tau = Math.max(0.0001, this.pheromones[current][i]);
                let eta = 1.0 / Math.max(0.1, this.distances[current][i]); 

                let p = Math.pow(tau, this.alpha) * Math.pow(eta, this.beta);
                probabilities.push({ node: i, prob: p });
                probSum += p;
            }
        }

        // Roulette Wheel Selection
        let rand = Math.random() * probSum;
        let cumulative = 0;
        
        for (let i = 0; i < probabilities.length; i++) {
            cumulative += probabilities[i].prob;
            if (rand <= cumulative) {
                return probabilities[i].node;
            }
        }
        
        // Fallback safety
        return probabilities[probabilities.length - 1].node;
    }

    updateAnts() {
        let allAntsFinished = true;

        for (let ant of this.ants) {
            if (ant.tour.length > this.numNodes) continue; // Ant is waiting for next generation

            allAntsFinished = false;
            
            const distToTarget = this.distances[ant.currentNode][ant.targetNode];
            
            // Move ant physically along edge
            ant.progress += this.antSpeed;

            // Reached target node?
            if (ant.progress >= distToTarget) {
                ant.tourDistance += distToTarget;
                ant.currentNode = ant.targetNode;
                ant.tour.push(ant.currentNode);
                ant.visited.add(ant.currentNode);
                ant.progress = 0;

                // Did the ant complete the TSP tour? (V nodes + 1 return to start)
                if (ant.tour.length <= this.numNodes) {
                    ant.targetNode = this.pickNextNode(ant.currentNode, ant.visited);
                }
            }
        }

        // Epoch Complete: Evaporate, Deposit, and Restart Swarm
        if (allAntsFinished) {
            this.completeGeneration();
        }
    }

    completeGeneration() {
        this.generationCount++;
        this.valGenerations.textContent = this.generationCount;

        // 1. Evaporate Pheromones
        for (let i = 0; i < this.numNodes; i++) {
            for (let j = 0; j < this.numNodes; j++) {
                this.pheromones[i][j] *= (1.0 - this.evaporationRate);
                this.pheromones[i][j] = Math.max(this.initialPheromone, this.pheromones[i][j]); // Floor
            }
        }

        // 2. Evaluate Ants & Deposit Pheromones
        let generationBestDist = Infinity;

        for (let ant of this.ants) {
            if (ant.tourDistance < this.bestDistance) {
                this.bestDistance = ant.tourDistance;
                this.bestTour = [...ant.tour];
                this.valBestDist.textContent = Math.round(this.bestDistance);
            }

            // Pheromone Delta = Q / L
            const deltaTau = this.Q / ant.tourDistance;
            
            for (let i = 0; i < ant.tour.length - 1; i++) {
                const u = ant.tour[i];
                const v = ant.tour[i + 1];
                this.pheromones[u][v] += deltaTau;
                this.pheromones[v][u] += deltaTau; // Undirected graph
            }

            // Reset Ant for next epoch
            const startNode = Math.floor(Math.random() * this.numNodes);
            ant.tour = [startNode];
            ant.visited = new Set([startNode]);
            ant.currentNode = startNode;
            ant.targetNode = this.pickNextNode(startNode, ant.visited);
            ant.progress = 0;
            ant.tourDistance = 0;
        }

        if (this.generationCount % 10 === 0) {
            this.statusText.textContent = `Generation ${this.generationCount} complete. Optimization converging.`;
        }
    }

    /* --- Visual Loop & Canvas Drawing --- */

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) {
            this.btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Swarm';
            this.btnPlay.classList.replace('btn-accent', 'btn-primary');
        } else {
            this.btnPlay.innerHTML = '<i class="fa-solid fa-play"></i> Resume Swarm';
            this.btnPlay.classList.replace('btn-primary', 'btn-accent');
        }
    }

    startRenderLoop() {
        const loop = () => {
            if (this.isPlaying) {
                this.updateAnts();
            }
            this.draw();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        loop();
    }

    draw() {
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);
        this.ctx.clearRect(0, 0, w, h);

        // Normalize pheromones for rendering brightness
        let maxPhero = this.initialPheromone;
        for (let i = 0; i < this.numNodes; i++) {
            for (let j = 0; j < this.numNodes; j++) {
                if (this.pheromones[i][j] > maxPhero) maxPhero = this.pheromones[i][j];
            }
        }

        // 1. Draw Pheromone Edges
        this.ctx.lineCap = 'round';
        for (let i = 0; i < this.numNodes; i++) {
            for (let j = i + 1; j < this.numNodes; j++) {
                const tau = this.pheromones[i][j];
                if (tau > this.initialPheromone * 1.5) {
                    const intensity = Math.min(1, tau / maxPhero);
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
                    this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
                    
                    // Emerald green mapping
                    this.ctx.strokeStyle = `rgba(16, 185, 129, ${intensity * 0.8})`;
                    this.ctx.lineWidth = 1 + (intensity * 4); // Thicker paths
                    this.ctx.stroke();
                }
            }
        }

        // 2. Draw Best Found Path (Glowing White/Emerald overlay)
        if (this.bestTour) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.nodes[this.bestTour[0]].x, this.nodes[this.bestTour[0]].y);
            for (let i = 1; i < this.bestTour.length; i++) {
                this.ctx.lineTo(this.nodes[this.bestTour[i]].x, this.nodes[this.bestTour[i]].y);
            }
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.lineWidth = 1.5;
            this.ctx.setLineDash([5, 5]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // 3. Draw Graph Nodes
        this.ctx.fillStyle = '#1e293b';
        this.ctx.strokeStyle = '#475569';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < this.numNodes; i++) {
            this.ctx.beginPath();
            this.ctx.arc(this.nodes[i].x, this.nodes[i].y, 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        }

        // 4. Draw Active Ant Particles
        this.ctx.fillStyle = '#06b6d4'; // Cyan
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = '#06b6d4';

        for (let ant of this.ants) {
            if (ant.tour.length > this.numNodes) continue; // Finished

            const start = this.nodes[ant.currentNode];
            const end = this.nodes[ant.targetNode];
            const dist = this.distances[ant.currentNode][ant.targetNode];
            
            // Linear interpolation for current physical position
            const ratio = ant.progress / dist;
            const px = start.x + (end.x - start.x) * ratio;
            const py = start.y + (end.y - start.y) * ratio;

            this.ctx.beginPath();
            this.ctx.arc(px, py, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.shadowBlur = 0; // Reset for next frame
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ACOVisualizer();
});
