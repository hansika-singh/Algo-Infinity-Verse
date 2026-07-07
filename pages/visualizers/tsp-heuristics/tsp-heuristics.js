/**
 * Simulated Annealing AI Heuristics Engine
 * Solves the Traveling Salesperson Problem on a 2D Euclidean plane.
 */

class City {
    /**
     * Initializes a city node.
     * @param {number} x - Normalized X coordinate (0.0 to 1.0).
     * @param {number} y - Normalized Y coordinate (0.0 to 1.0).
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Calculates the Euclidean distance to another city.
     * @param {City} city - The target city.
     * @param {number} width - Canvas width for absolute scaling.
     * @param {number} height - Canvas height for absolute scaling.
     * @returns {number} The distance in pixels.
     */
    distanceTo(city, width, height) {
        const xDist = Math.abs((this.x * width) - (city.x * width));
        const yDist = Math.abs((this.y * height) - (city.y * height));
        return Math.sqrt((xDist * xDist) + (yDist * yDist));
    }
}

// --- Global State ---
let cities = [];
let bestTour = [];
let bestDistance = Infinity;
let currentTour = [];

let isRunning = false;
let animationId = null;

// SA Parameters
let temperature = 10000;
const coolingRate = 0.9995;
const absoluteTemperature = 0.00001;

// Canvas Setup
const canvas = document.getElementById('viz-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
let cw = canvas.width;
let ch = canvas.height;

/**
 * Resizes the canvas securely based on the window.
 */
function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    cw = canvas.width;
    ch = canvas.height;
    draw();
}

/**
 * Calculates the total distance of a given tour.
 * @param {City[]} tour - The array of cities in order.
 * @returns {number} Total distance in pixels.
 */
function calculateTourDistance(tour) {
    let sum = 0;
    for (let i = 0; i < tour.length; i++) {
        const fromCity = tour[i];
        const toCity = tour[(i + 1) % tour.length]; // Wrap around to start
        sum += fromCity.distanceTo(toCity, cw, ch);
    }
    return sum;
}

/**
 * Swaps two random cities in a tour array.
 * @param {City[]} tour - The array to mutate.
 * @returns {City[]} The newly mutated tour.
 */
function swapRandomCities(tour) {
    const newTour = [...tour];
    const index1 = Math.floor(Math.random() * newTour.length);
    let index2 = Math.floor(Math.random() * newTour.length);
    
    while (index1 === index2) {
        index2 = Math.floor(Math.random() * newTour.length);
    }

    const temp = newTour[index1];
    newTour[index1] = newTour[index2];
    newTour[index2] = temp;
    
    return newTour;
}

/**
 * The core Simulated Annealing engine loop.
 * Executes multiple operations per frame to keep the visualization fast.
 */
function simulatedAnnealingLoop() {
    if (temperature > absoluteTemperature) {
        // Run 50 iterations per frame for speed
        for (let i = 0; i < 50; i++) {
            const newTour = swapRandomCities(currentTour);
            
            const currentEnergy = calculateTourDistance(currentTour);
            const neighbourEnergy = calculateTourDistance(newTour);

            // Acceptance Probability Logic
            if (neighbourEnergy < currentEnergy) {
                currentTour = newTour;
                if (currentEnergy < bestDistance) {
                    bestTour = [...currentTour];
                    bestDistance = currentEnergy;
                }
            } else {
                // If worse, accept with a probability based on temp
                const acceptanceProbability = Math.exp((currentEnergy - neighbourEnergy) / temperature);
                if (Math.random() < acceptanceProbability) {
                    currentTour = newTour;
                }
            }
        }
        
        temperature *= coolingRate;
        updateTelemetry(temperature, calculateTourDistance(currentTour));
        draw();
        
        animationId = requestAnimationFrame(simulatedAnnealingLoop);
    } else {
        isRunning = false;
        document.getElementById('btn-run').disabled = false;
        document.querySelector('.status').innerText = `Status: Algorithm Finished | Cities: ${cities.length}`;
        draw(true); // Draw final state explicitly
    }
}

/**
 * Renders the cities and paths onto the canvas.
 * @param {boolean} isFinal - Whether to highlight the optimal path in green.
 */
function draw(isFinal = false) {
    // Solid background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, cw, ch);

    // Draw active tour paths
    if (currentTour.length > 1) {
        ctx.beginPath();
        ctx.moveTo(currentTour[0].x * cw, currentTour[0].y * ch);
        for (let i = 1; i < currentTour.length; i++) {
            ctx.lineTo(currentTour[i].x * cw, currentTour[i].y * ch);
        }
        ctx.lineTo(currentTour[0].x * cw, currentTour[0].y * ch); // Close loop
        ctx.strokeStyle = isFinal ? '#10b981' : 'rgba(248, 250, 252, 0.2)';
        ctx.lineWidth = isFinal ? 3 : 1;
        ctx.stroke();
    }

    // Draw cities
    ctx.fillStyle = '#38bdf8';
    cities.forEach(city => {
        ctx.beginPath();
        ctx.arc(city.x * cw, city.y * ch, 6, 0, Math.PI * 2);
        ctx.fill();
    });
}

/**
 * Updates the UI DOM with the latest algorithm metrics.
 */
function updateTelemetry(temp, currentDist) {
    document.getElementById('metric-temp').innerText = temp.toFixed(2);
    document.getElementById('metric-dist').innerText = currentDist.toFixed(0);
    document.querySelector('.status').innerText = `Status: Annealing... | Best Distance: ${bestDistance.toFixed(0)}`;
}

// --- Storage Integration & Event Listeners ---
function syncStorage() {
    localStorage.setItem("tsp_cities", JSON.stringify(cities));
}

function loadStorage() {
    const cached = localStorage.getItem("tsp_cities");
    if (cached) {
        const parsed = JSON.parse(cached);
        cities = parsed.map(c => new City(c.x, c.y));
        if (cities.length > 0) {
            currentTour = [...cities];
            bestTour = [...cities];
            bestDistance = calculateTourDistance(cities);
            updateTelemetry(0, bestDistance);
            document.querySelector('.status').innerText = `Status: Awaiting AI | Cities: ${cities.length}`;
        }
        draw();
    }
}

window.addEventListener('resize', resizeCanvas);

document.addEventListener("DOMContentLoaded", () => {
    resizeCanvas();
    loadStorage();

    canvas.addEventListener('click', (e) => {
        if (isRunning) return;
        const rect = canvas.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;
        
        // Store normalized coordinates to survive browser window resizing
        cities.push(new City(rawX / cw, rawY / ch));
        currentTour = [...cities];
        
        bestDistance = calculateTourDistance(currentTour);
        syncStorage();
        draw();
        document.querySelector('.status').innerText = `Status: Awaiting AI | Cities: ${cities.length}`;
    });

    document.getElementById("btn-random").addEventListener("click", () => {
        if (isRunning) return;
        cities = [];
        for (let i = 0; i < 20; i++) {
            // Generate away from absolute edges for visual clarity
            const x = 0.05 + (Math.random() * 0.9);
            const y = 0.05 + (Math.random() * 0.9);
            cities.push(new City(x, y));
        }
        currentTour = [...cities];
        bestDistance = calculateTourDistance(currentTour);
        syncStorage();
        draw();
        document.querySelector('.status').innerText = `Status: Awaiting AI | Cities: 20`;
    });

    document.getElementById("btn-run").addEventListener("click", (e) => {
        if (cities.length < 3 || isRunning) return;
        
        isRunning = true;
        e.target.disabled = true;
        
        // Reset SA state
        temperature = 10000;
        currentTour = [...cities];
        bestTour = [...cities];
        bestDistance = calculateTourDistance(currentTour);
        
        if (animationId) cancelAnimationFrame(animationId);
        simulatedAnnealingLoop();
    });

    document.getElementById("btn-clear").addEventListener("click", () => {
        if (animationId) cancelAnimationFrame(animationId);
        isRunning = false;
        document.getElementById('btn-run').disabled = false;
        
        cities = [];
        currentTour = [];
        bestTour = [];
        bestDistance = Infinity;
        temperature = 0;
        
        syncStorage();
        updateTelemetry(0, 0);
        document.querySelector('.status').innerText = `Status: Plane Cleared`;
        draw();
    });
});
