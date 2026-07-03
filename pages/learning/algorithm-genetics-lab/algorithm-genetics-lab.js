// Data Model for Algorithm DNA with Expert Insights
const dnaData = {
    nodes: [
        { 
            id: "binary_search", label: "Binary Search", paradigm: "Divide & Conquer", type: "core", 
            time: "O(log N)", space: "O(1)", 
            applications: "Finding elements, dictionary search, checking monotonic functions.",
            icon: "\uf002", // fa-search
            learningOutcome: "Expert Insight: The true power of Binary Search isn't finding elements—it's optimizing monotonic search spaces. By establishing an invariant (L <= R), you guarantee termination while exponentially shrinking the realm of possibilities.",
            snippet: "while (low <= high) {\n  let mid = low + Math.floor((high - low) / 2);\n  if (arr[mid] === target) return mid;\n  if (arr[mid] < target) low = mid + 1;\n  else high = mid - 1;\n}"
        },
        { 
            id: "lower_bound", label: "Lower Bound", paradigm: "Divide & Conquer", type: "intermediate", 
            time: "O(log N)", space: "O(1)", 
            applications: "Finding insertion points, counting duplicates, range queries.",
            icon: "\uf152", // fa-caret-square-down
            learningOutcome: "Expert Insight: Lower Bound teaches you to stop looking for an 'exact match' and instead search for a 'boundary'. It finds the first element that satisfies the condition (arr[mid] >= target), which is crucial for handling arrays with duplicates.",
            snippet: "let ans = arr.length;\nwhile (low <= high) {\n  let mid = low + Math.floor((high-low)/2);\n  if (arr[mid] >= target) {\n    ans = mid; high = mid - 1;\n  } else {\n    low = mid + 1;\n  }\n}"
        },
        { 
            id: "upper_bound", label: "Upper Bound", paradigm: "Divide & Conquer", type: "intermediate", 
            time: "O(log N)", space: "O(1)", 
            applications: "Finding the strict upper limit, frequency counting.",
            icon: "\uf151", // fa-caret-square-up
            learningOutcome: "Expert Insight: Upper Bound complements Lower Bound by shifting the condition strictly to (arr[mid] > target). Together, they form the bedrock of logarithmic range querying (Count = UpperBound - LowerBound).",
            snippet: "let ans = arr.length;\nwhile (low <= high) {\n  let mid = low + Math.floor((high-low)/2);\n  if (arr[mid] > target) {\n    ans = mid; high = mid - 1;\n  } else {\n    low = mid + 1;\n  }\n}"
        },
        { 
            id: "bs_on_answer", label: "BS on Answer", paradigm: "Divide & Conquer", type: "advanced", 
            time: "O(N log(Max))", space: "O(1)", 
            applications: "Min-Max optimization (e.g., Book Allocation, Painter's Partition, Aggressive Cows).",
            icon: "\uf542", // fa-balance-scale
            learningOutcome: "Expert Insight: A massive paradigm shift. Instead of searching an array, you search the domain of possible answers. If an answer 'X' is valid, is 'X-1' also valid? This transforms complex NP-hard looking problems into simple O(N log(Max)) checks.",
            snippet: "let low = minPossible, high = maxPossible;\nwhile(low <= high) {\n  let mid = low + Math.floor((high-low)/2);\n  if(isValid(mid)) {\n    ans = mid; high = mid - 1; // Optimize\n  } else {\n    low = mid + 1;\n  }\n}"
        },
        { 
            id: "recursion", label: "Recursion", paradigm: "Core Concept", type: "core", 
            time: "O(b^d)", space: "O(d)", 
            applications: "Tree traversal, divide and conquer algorithms, fractals.",
            icon: "\uf01e", // fa-redo
            learningOutcome: "Expert Insight: Recursion isn't just a function calling itself; it's mathematical induction implemented in code. You assume the function works for (N-1) (the recursive leap of faith) and only focus on solving the Nth step.",
            snippet: "function solve(n) {\n  if (n <= 1) return 1; // Base case\n  return n * solve(n - 1); // Inductive step\n}"
        },
        { 
            id: "backtracking", label: "Backtracking", paradigm: "Backtracking", type: "intermediate", 
            time: "O(2^N) or O(N!)", space: "O(N)", 
            applications: "N-Queens, Sudoku, Combinations, Permutations, Pathfinding.",
            icon: "\uf3e5", // fa-undo-alt
            learningOutcome: "Expert Insight: Backtracking is Depth-First Search with an 'Undo' button. The genius lies in State Reversion—modifying a global state to explore a branch, then reverting it so the next branch starts with a clean slate without copying memory.",
            snippet: "function backtrack(path) {\n  if (isComplete(path)) res.push([...path]);\n  for (let opt of options) {\n    if (isValid(opt)) {\n      path.push(opt); // DO\n      backtrack(path); // EXPLORE\n      path.pop(); // UNDO\n    }\n  }\n}"
        },
        { 
            id: "dp", label: "Dynamic Programming", paradigm: "Dynamic Programming", type: "advanced", 
            time: "O(States * Transitions)", space: "O(States)", 
            applications: "Knapsack, Shortest path, Edit distance, Subsequence optimization.",
            icon: "\uf1b3", // fa-cubes
            learningOutcome: "Expert Insight: DP is fundamentally just smart brute force. By identifying that recursive subproblems overlap, DP trades memory for time, reducing an exponential O(2^N) tree explosion into a polynomial O(N^2) DAG traversal.",
            snippet: "let dp = new Array(n + 1).fill(0);\ndp[0] = 0; dp[1] = 1;\nfor (let i = 2; i <= n; i++) {\n  dp[i] = dp[i-1] + dp[i-2];\n}"
        },
        { 
            id: "memoization", label: "Memoization", paradigm: "Dynamic Programming", type: "intermediate", 
            time: "O(States)", space: "O(States)", 
            applications: "Top-down DP optimization, Fibonacci optimization.",
            icon: "\uf0c7", // fa-save
            learningOutcome: "Expert Insight: Memoization bridges the gap between intuitive Recursion and rigid DP. It lazily evaluates the state space, meaning it only computes states that are actually visited, which can be faster than bottom-up DP in sparse graphs.",
            snippet: "let memo = new Map();\nfunction solve(n) {\n  if (memo.has(n)) return memo.get(n);\n  if (n <= 1) return n;\n  let ans = solve(n-1) + solve(n-2);\n  memo.set(n, ans);\n  return ans;\n}"
        },
        { 
            id: "bfs", label: "Breadth-First Search", paradigm: "Graph Traversal", type: "core", 
            time: "O(V + E)", space: "O(V)", 
            applications: "Shortest path on unweighted graphs, level order traversal, network broadcasting.",
            icon: "\uf1e0", // fa-share-nodes
            learningOutcome: "Expert Insight: BFS acts as an expanding ripple in a pond. Because it processes nodes strictly by their distance from the source, the moment it hits a target, it mathematically guarantees that the path found is the absolute shortest possible (in unweighted graphs).",
            snippet: "let q = [start];\nlet vis = new Set([start]);\nwhile(q.length) {\n  let curr = q.shift();\n  for(let nei of graph[curr]) {\n    if(!vis.has(nei)) {\n      vis.add(nei); q.push(nei);\n    }\n  }\n}"
        },
        { 
            id: "dfs", label: "Depth-First Search", paradigm: "Graph Traversal", type: "core", 
            time: "O(V + E)", space: "O(V)", 
            applications: "Cycle detection, topological sorting, connected components, maze solving.",
            icon: "\uf542", // fa-route
            learningOutcome: "Expert Insight: DFS forms the backbone of Graph Theory. By keeping track of 'Entry' and 'Exit' times (Discovery & Finish times), DFS can classify edges into Tree, Back, Forward, and Cross edges, unlocking complex algorithms like Tarjan's Strongly Connected Components.",
            snippet: "let vis = new Set();\nfunction dfs(node) {\n  vis.add(node);\n  for(let nei of graph[node]) {\n    if(!vis.has(nei)) dfs(nei);\n  }\n}"
        },
        { 
            id: "two_pointers", label: "Two Pointers", paradigm: "Two Pointers", type: "core", 
            time: "O(N)", space: "O(1)", 
            applications: "Pair sums in sorted arrays, checking palindromes, removing duplicates in-place.",
            icon: "\uf337", // fa-hand-point-up (representing pointers)
            learningOutcome: "Expert Insight: Two Pointers exploits structure (usually sorted order) to drop an entire dimension of time complexity. Moving a pointer is a decision that permanently discards an invalid subset of the search space, achieving O(N) instead of O(N^2).",
            snippet: "let i = 0, j = arr.length - 1;\nwhile (i < j) {\n  let sum = arr[i] + arr[j];\n  if (sum === target) return true;\n  if (sum < target) i++; // Discard smaller\n  else j--; // Discard larger\n}"
        },
        { 
            id: "sliding_window", label: "Sliding Window", paradigm: "Two Pointers", type: "intermediate", 
            time: "O(N)", space: "O(1) to O(K)", 
            applications: "Subarray sums, longest substring without repeating characters, max element in window.",
            icon: "\uf2d0", // fa-window-maximize
            learningOutcome: "Expert Insight: Sliding Window converts repeated O(K) subarray checks into an O(1) state transition. By analyzing what leaves the window and what enters it, you completely eliminate redundant calculations across overlapping boundaries.",
            snippet: "let left = 0, maxLen = 0, sum = 0;\nfor(let right = 0; right < arr.length; right++) {\n  sum += arr[right]; // Add incoming\n  while(sum > target) {\n    sum -= arr[left]; // Remove outgoing\n    left++;\n  }\n  maxLen = Math.max(maxLen, right - left + 1);\n}"
        }
    ],
    edges: [
        { source: "binary_search", target: "lower_bound" },
        { source: "binary_search", target: "upper_bound" },
        { source: "binary_search", target: "bs_on_answer" },
        
        { source: "recursion", target: "backtracking" },
        { source: "recursion", target: "memoization" },
        { source: "recursion", target: "dfs" },
        { source: "memoization", target: "dp" },
        { source: "backtracking", target: "dp" },
        
        { source: "bfs", target: "dfs" }, // Often compared together
        
        { source: "two_pointers", target: "sliding_window" },
        { source: "two_pointers", target: "binary_search" } // Both are Array searching techniques
    ]
};

// D3 Graph Implementation
const container = document.getElementById("d3-container");
let width = container.clientWidth;
let height = container.clientHeight;

// Set up SVG
const svg = d3.select("#d3-container").append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom().scaleExtent([0.2, 4]).on("zoom", (event) => {
        g.attr("transform", event.transform);
    }))
    .on("dblclick.zoom", null); // Disable double click zoom for better UX

const g = svg.append("g");

// Center the graph initially
const initialScale = 0.8;
g.attr("transform", `translate(${width*0.1}, ${height*0.1}) scale(${initialScale})`);

// Arrow marker for directed edges
svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "-0 -5 10 10")
    .attr("refX", 28) // Adjust based on node radius
    .attr("refY", 0)
    .attr("orient", "auto")
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("xoverflow", "visible")
    .append("svg:path")
    .attr("d", "M 0,-5 L 10 ,0 L 0,5")
    .attr("fill", "rgba(255,255,255,0.3)");

// Highlight Arrow marker
svg.append("defs").append("marker")
    .attr("id", "arrowhead-highlight")
    .attr("viewBox", "-0 -5 10 10")
    .attr("refX", 28)
    .attr("refY", 0)
    .attr("orient", "auto")
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("xoverflow", "visible")
    .append("svg:path")
    .attr("d", "M 0,-5 L 10 ,0 L 0,5")
    .attr("fill", "#3b82f6");

// Prepare data for D3
const nodesData = dnaData.nodes.map(d => Object.create(d));
const linksData = dnaData.edges.map(d => Object.create(d));

let selectedNodeId = null;
let hoveredNodeId = null;

// Structured layout based on type (Core -> Left, Intermediate -> Middle, Advanced -> Right)
const levelX = {
    "core": width * 0.25,
    "intermediate": width * 0.5,
    "advanced": width * 0.75
};

// Initialize Force Simulation with Structured Forces
const simulation = d3.forceSimulation(nodesData)
    .force("link", d3.forceLink(linksData).id(d => d.id).distance(120))
    .force("charge", d3.forceManyBody().strength(-1200)) // Strong repel to keep nodes apart
    .force("x", d3.forceX(d => levelX[d.type] || width/2).strength(0.8)) // Structured Left-to-Right flow
    .force("y", d3.forceY(height / 2).strength(0.15)) // Keep them vertically centered
    .force("collide", d3.forceCollide().radius(60)); // Prevent overlapping

// Draw Links
const link = g.append("g")
    .selectAll(".link")
    .data(linksData)
    .join("line")
    .attr("class", "link")
    .attr("marker-end", "url(#arrowhead)");

// Colors
const typeColors = {
    core: "#3b82f6",
    intermediate: "#8b5cf6",
    advanced: "#f59e0b"
};

// Draw Nodes
const node = g.append("g")
    .selectAll(".node-group")
    .data(nodesData)
    .join("g")
    .attr("class", "node-group")
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
    .on("click", (event, d) => selectNode(d))
    .on("mouseenter", (event, d) => {
        hoveredNodeId = d.id;
        updateHighlighting();
    })
    .on("mouseleave", () => {
        hoveredNodeId = null;
        updateHighlighting();
    });

node.append("circle")
    .attr("class", "node-circle")
    .attr("r", d => d.type === 'core' ? 26 : (d.type === 'intermediate' ? 22 : 18))
    .attr("fill", "rgba(10, 10, 15, 0.95)")
    .attr("stroke", d => typeColors[d.type] || "#ffffff");

node.append("text")
    .attr("class", "node-icon")
    .text(d => d.icon || "\uf0c3") // Font Awesome unicode
    .style("fill", d => typeColors[d.type] || "#ffffff");

node.append("text")
    .attr("class", "node-label")
    .attr("dy", d => (d.type === 'core' ? 26 : (d.type === 'intermediate' ? 22 : 18)) + 18)
    .text(d => d.label);

// Simulation tick updates
simulation.on("tick", () => {
    // Bound nodes within a padded box so they never fly off-screen completely
    const padding = 50;
    nodesData.forEach(d => {
        d.x = Math.max(padding, Math.min(width * 2 - padding, d.x));
        d.y = Math.max(padding, Math.min(height * 2 - padding, d.y));
    });

    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("transform", d => `translate(${d.x},${d.y})`);
});

// Drag functions
function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

// Highlighting Logic
function updateHighlighting() {
    node.select(".node-circle")
        .style("stroke-width", d => (d.id === selectedNodeId || d.id === hoveredNodeId) ? "4px" : "2px")
        .style("filter", d => {
            if (d.id === selectedNodeId) return `drop-shadow(0 0 15px ${typeColors[d.type]})`;
            if (d.id === hoveredNodeId) return `drop-shadow(0 0 8px ${typeColors[d.type]})`;
            return "none";
        });

    link
        .classed("highlight", d => {
            if (selectedNodeId && (d.source.id === selectedNodeId || d.target.id === selectedNodeId)) return true;
            if (hoveredNodeId && (d.source.id === hoveredNodeId || d.target.id === hoveredNodeId)) return true;
            return false;
        })
        .attr("marker-end", d => {
            if (selectedNodeId && (d.source.id === selectedNodeId || d.target.id === selectedNodeId)) return "url(#arrowhead-highlight)";
            if (hoveredNodeId && (d.source.id === hoveredNodeId || d.target.id === hoveredNodeId)) return "url(#arrowhead-highlight)";
            return "url(#arrowhead)";
        });
}

// Select Node and populate Right Panel
function selectNode(d) {
    if (typeof d === 'string') d = nodesData.find(n => n.id === d);
    if (!d) return;

    selectedNodeId = d.id;
    updateHighlighting();

    // Populate UI
    document.getElementById("dna-placeholder").style.display = "none";
    document.getElementById("dna-card").style.display = "flex";

    document.getElementById("dna-title").innerText = d.label;
    document.getElementById("dna-title").style.color = typeColors[d.type];
    document.getElementById("dna-title-icon").className = "fas node-icon-font";
    document.getElementById("dna-title-icon").innerText = d.icon;
    document.getElementById("dna-title-icon").style.color = typeColors[d.type];

    document.getElementById("dna-paradigm").innerText = d.paradigm;
    document.getElementById("dna-paradigm").style.color = typeColors[d.type];
    document.getElementById("dna-paradigm").style.borderColor = typeColors[d.type];

    document.getElementById("dna-time").innerText = d.time;
    document.getElementById("dna-space").innerText = d.space;
    
    // Use innerHTML so we can style the Expert Insight nicely
    const outcomeHtml = d.learningOutcome.replace("Expert Insight:", "<strong style='color: var(--accent-green)'>Expert Insight:</strong>");
    document.getElementById("dna-learning-outcome").innerHTML = outcomeHtml;
    
    document.getElementById("dna-applications").innerText = d.applications;
    document.getElementById("dna-snippet").innerText = d.snippet || "// Code logic goes here";

    // Prerequisites (Incoming edges)
    const prereqList = document.getElementById("dna-prereq");
    prereqList.innerHTML = "";
    const incoming = linksData.filter(l => l.target.id === d.id);
    if (incoming.length === 0) {
        prereqList.innerHTML = "<li><span style='color: var(--text-secondary);'>Foundational</span></li>";
    } else {
        incoming.forEach(l => {
            const li = document.createElement("li");
            li.innerText = l.source.label;
            li.onclick = () => selectNode(l.source);
            prereqList.appendChild(li);
        });
    }

    // Derived (Outgoing edges)
    const derivedList = document.getElementById("dna-derived");
    derivedList.innerHTML = "";
    const outgoing = linksData.filter(l => l.source.id === d.id);
    if (outgoing.length === 0) {
        derivedList.innerHTML = "<li><span style='color: var(--text-secondary);'>Terminal Node</span></li>";
    } else {
        outgoing.forEach(l => {
            const li = document.createElement("li");
            li.innerText = l.target.label;
            li.onclick = () => selectNode(l.target);
            derivedList.appendChild(li);
        });
    }

    // Smooth transition panel animation
    const card = document.getElementById("dna-card");
    card.style.animation = 'none';
    card.offsetHeight; /* trigger reflow */
    card.style.animation = null; 
}

// Search and Filter Logic
function applyFilters() {
    const searchTerm = document.getElementById("algo-search").value.toLowerCase();
    const paradigmFilter = document.getElementById("paradigm-filter").value;
    
    // Dim nodes that don't match
    node.style("opacity", d => {
        const matchesSearch = d.label.toLowerCase().includes(searchTerm) || d.applications.toLowerCase().includes(searchTerm);
        const matchesParadigm = paradigmFilter === "all" || d.paradigm === paradigmFilter;
        return (matchesSearch && matchesParadigm) ? 1 : 0.1;
    });

    link.style("opacity", d => {
        const sMatches = (d.source.label.toLowerCase().includes(searchTerm) || d.source.applications.toLowerCase().includes(searchTerm)) && 
                         (paradigmFilter === "all" || d.source.paradigm === paradigmFilter);
        const tMatches = (d.target.label.toLowerCase().includes(searchTerm) || d.target.applications.toLowerCase().includes(searchTerm)) && 
                         (paradigmFilter === "all" || d.target.paradigm === paradigmFilter);
        return (sMatches && tMatches) ? 1 : 0.05;
    });
}

document.getElementById("algo-search").addEventListener("input", applyFilters);
document.getElementById("paradigm-filter").addEventListener("change", applyFilters);

// Window Resize handling
window.addEventListener("resize", () => {
    width = container.clientWidth;
    height = container.clientHeight;
    svg.attr("width", width).attr("height", height);
    
    levelX.core = width * 0.25;
    levelX.intermediate = width * 0.5;
    levelX.advanced = width * 0.75;
    
    simulation.force("x", d3.forceX(d => levelX[d.type] || width/2).strength(0.8));
    simulation.force("y", d3.forceY(height / 2).strength(0.15));
    simulation.alpha(0.3).restart();
});

// Zoom Controls UI
document.getElementById("zoom-in").addEventListener("click", () => {
    svg.transition().call(d3.zoom().scaleBy, 1.3);
});

document.getElementById("zoom-out").addEventListener("click", () => {
    svg.transition().call(d3.zoom().scaleBy, 0.7);
});

document.getElementById("zoom-reset").addEventListener("click", () => {
    svg.transition().duration(750).call(
        d3.zoom().transform, 
        d3.zoomIdentity.translate(width*0.1, height*0.1).scale(0.8)
    );
});
