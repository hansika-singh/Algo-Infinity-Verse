/**
 * ALGO INFINITY VERSE - HLD LEARNING ENGINE
 * Executes client-side DFS algorithms to dynamically construct 
 * and visualize the Heavy-Light Decomposition.
 */

// --- 1. MOCK GRAPH DATA (Adjacency List) ---
const n = 15;
const adj = {
    1: [2, 3, 4],
    2: [5, 6],
    3: [7],
    4: [8, 9, 10],
    5: [11, 12],
    6: [],
    7: [13],
    8: [],
    9: [14, 15],
    10: [],
    11: [], 12: [], 13: [], 14: [], 15: []
};

// Internal Arrays for DFS processing
const sz = {};
const head = {};
const heavyChild = {}; // Maps u -> v (where v is heavy child)

// --- 2. THE ALGORITHMS (Ran on Client Initialization) ---

// Pass 1: Calculate sizes and designate heavy children
function dfs1(v = 1, p = 0) {
    sz[v] = 1;
    let maxSize = 0;
    heavyChild[v] = -1;

    for (let to of adj[v]) {
        if (to === p) continue;
        dfs1(to, v);
        sz[v] += sz[to];
        
        if (sz[to] > maxSize) {
            maxSize = sz[to];
            heavyChild[v] = to; // Assign Heavy Child
        }
    }
}

// Pass 2: Assign heads of chains
function dfs2(v = 1, p = 0, curr_head = 1) {
    head[v] = curr_head;

    if (heavyChild[v] !== -1) {
        dfs2(heavyChild[v], v, curr_head); // Heavy edge continues the chain
    }

    for (let to of adj[v]) {
        if (to === p || to === heavyChild[v]) continue;
        dfs2(to, v, to); // Light edge starts a new chain
    }
}

// Execute the math
dfs1(1);
dfs2(1);

// --- 3. D3.JS VISUALIZATION ENGINE ---

function buildD3Hierarchy(v = 1) {
    const node = { id: v, head: head[v], size: sz[v] };
    if (adj[v].length > 0) {
        node.children = [];
        for (let to of adj[v]) {
            node.children.push(buildD3Hierarchy(to));
        }
    }
    return node;
}

const rootData = buildD3Hierarchy(1);

const container = document.getElementById('d3-hld-canvas');
const width = container.clientWidth;
const height = container.clientHeight;

const svg = d3.select("#d3-hld-canvas")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const margin = {top: 40, right: 20, bottom: 40, left: 20};
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const treeLayout = d3.tree().size([innerWidth, innerHeight]);
const rootNode = d3.hierarchy(rootData);
treeLayout(rootNode);

// Render Links (Edges)
g.selectAll(".link")
    .data(rootNode.links())
    .enter().append("path")
    .attr("class", d => {
        // Core Logic: If parent's heavy child is this target, it's a heavy edge.
        const isHeavy = heavyChild[d.source.data.id] === d.target.data.id;
        return `link ${isHeavy ? 'heavy' : 'light'}`;
    })
    .attr("d", d3.linkVertical()
        .x(d => d.x)
        .y(d => d.y));

// Render Nodes
const node = g.selectAll(".node")
    .data(rootNode.descendants())
    .enter().append("g")
    .attr("class", d => {
        // Highlight the heads of the chains
        const isHead = head[d.data.id] === d.data.id;
        return `node ${isHead ? 'head' : ''}`;
    })
    .attr("transform", d => `translate(${d.x},${d.y})`);

node.append("circle").attr("r", 15);

node.append("text")
    .attr("dy", "4")
    .attr("text-anchor", "middle")
    .text(d => d.data.id);

// Append Size telemetry to nodes
node.append("text")
    .attr("dy", "28")
    .attr("text-anchor", "middle")
    .style("fill", "var(--text-muted)")
    .style("font-size", "10px")
    .text(d => `sz:${d.data.size}`);

// --- 4. SCROLL SPY LOGIC ---
const sections = document.querySelectorAll('.doc-section');
const navLinks = document.querySelectorAll('.toc-link');
const scrollContainer = document.querySelector('.scroll-container');

scrollContainer.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollContainer.scrollTop >= sectionTop - 100) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
});

window.addEventListener('resize', () => {
    // Basic re-render logic could go here for responsiveness
});
