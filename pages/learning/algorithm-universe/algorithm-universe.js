document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const loader = document.getElementById("loading-screen");
    if (loader) loader.classList.add("hidden");
  }, 1000);

  // Define Universe Data with structured Grid coordinates for a flawless visual Roadmap
  const nodesData = [
    // Row 0
    { id: "arrays", label: "Arrays", group: "core", col: 0, row: 0, icon: "fas fa-layer-group", link: "/pages/learning/array-learning/array-learning.html", desc: "Master contiguous memory blocks.", outcome: "Understand O(1) access and O(n) search." },
    
    // Row 1
    { id: "strings", label: "Strings", group: "core", col: 2, row: 1, icon: "fas fa-font", link: "/pages/learning/trie-string-learning/trie-string-learning.html", desc: "Sequence of characters.", outcome: "Master string manipulation." },
    { id: "matrix", label: "Matrix", group: "core", col: -2, row: 1, icon: "fas fa-border-all", link: "/pages/learning/matrix-learning/matrix-learning.html", desc: "2D Array Operations.", outcome: "Navigate grids and image rotation." },
    
    // Row 2
    { id: "two-pointers", label: "Two Pointers", group: "pattern", col: -1, row: 2, icon: "fas fa-arrows-alt-h", link: "/pages/learning/two-pointers-learning/two-pointers-learning.html", desc: "Searching with two indices.", outcome: "Optimize nested loops to O(N)." },
    { id: "prefix-sum", label: "Prefix Sum", group: "pattern", col: 0, row: 2, icon: "fas fa-chart-line", link: "/pages/learning/prefix-sum-learning/prefix-sum-learning.html", desc: "Cumulative sum array.", outcome: "Reduce O(N) range sum to O(1)." },
    { id: "sliding-window", label: "Sliding Window", group: "pattern", col: 1, row: 2, icon: "fas fa-expand", link: "/pages/learning/sliding-window-learning/sliding-window-learning.html", desc: "Subarray optimization.", outcome: "Solve contiguous subarray problems." },
    
    // Row 3
    { id: "linkedlist", label: "Linked Lists", group: "core", col: -2, row: 3, icon: "fas fa-link", link: "/pages/learning/linkedlist-learning/linkedlist-learning.html", desc: "Nodes connected by pointers.", outcome: "Master pointer manipulation." },
    { id: "binary-search", label: "Binary Search", group: "algo", col: 0, row: 3, icon: "fas fa-search-plus", link: "/pages/learning/binary-search/binary-search.html", desc: "Divide and conquer search.", outcome: "Achieve O(log N) search." },
    { id: "bit-manipulation", label: "Bit Manipulation", group: "pattern", col: 2, row: 3, icon: "fas fa-microchip", link: "/pages/learning/bit-manipulation-learning/bit-manipulation-learning.html", desc: "Bitwise operations.", outcome: "Perform constant time math." },
    
    // Row 4
    { id: "stacks", label: "Stacks", group: "core", col: -2, row: 4, icon: "fas fa-bars", link: "/pages/learning/stack-learning/stack-learning.html", desc: "LIFO structure.", outcome: "Solve history tracking and balancing." },
    { id: "heaps", label: "Heaps", group: "core", col: -1, row: 4, icon: "fas fa-sort-amount-up", link: "/pages/learning/heaps-learning/heaps-learning.html", desc: "Priority Queue.", outcome: "Extract min/max in O(log N)." },
    { id: "trees", label: "Trees", group: "core", col: 0, row: 4, icon: "fas fa-network-wired", link: "/pages/learning/trees-learning/trees-learning.html", desc: "Hierarchical data structure.", outcome: "Understand root, leaves, and traversals." },
    
    // Row 5
    { id: "recursion", label: "Recursion", group: "core", col: -2, row: 5, icon: "fas fa-sync-alt", link: "/pages/learning/recursion-learning/recursion-learning.html", desc: "Function calls itself.", outcome: "Think recursively and construct call trees." },
    { id: "trie", label: "Trie", group: "core", col: -1, row: 5, icon: "fas fa-sitemap", link: "/pages/learning/trie-string-learning/trie-string-learning.html", desc: "Prefix Tree.", outcome: "Perform prefix searches." },
    { id: "dp", label: "Dynamic Programming", group: "advanced", col: 1, row: 5, icon: "fas fa-brain", link: "/pages/learning/dp-learning/dp-learning.html", desc: "Optimization over subproblems.", outcome: "Identify overlapping subproblems." },
    
    // Row 6
    { id: "divide-conquer", label: "Divide & Conquer", group: "algo", col: -2, row: 6, icon: "fas fa-cut", link: "/pages/learning/divide-and-conquer-learning/divide-and-conquer-learning.html", desc: "Split, solve, merge.", outcome: "Implement Merge Sort and Quick Sort." },
    { id: "graphs", label: "Graphs", group: "core", col: 0, row: 6, icon: "fas fa-project-diagram", link: "/pages/learning/graph-learning/graph-learning.html", desc: "Nodes and edges.", outcome: "Model networks using Adjacency Lists." },
    { id: "bitmask-dp", label: "Bitmask DP", group: "advanced", col: 2, row: 6, icon: "fas fa-mask", link: "/pages/learning/bitmask-dp-learning/bitmask-dp-learning.html", desc: "DP with bitmasks.", outcome: "Solve complex subset selection." },
    
    // Row 7
    { id: "bfs", label: "BFS", group: "algo", col: -1.5, row: 7, icon: "fas fa-water", link: "/pages/learning/graph-learning/graph-learning.html", desc: "Breadth-First Search.", outcome: "Find shortest path in unweighted graphs." },
    { id: "dfs", label: "DFS", group: "algo", col: -0.5, row: 7, icon: "fas fa-route", link: "/pages/learning/graph-learning/graph-learning.html", desc: "Depth-First Search.", outcome: "Detect cycles and find connected components." },
    { id: "shortest-path", label: "Shortest Path", group: "algo", col: 0.5, row: 7, icon: "fas fa-map-marked-alt", link: "/pages/learning/shortest-path-learning/shortest-path-learning.html", desc: "Dijkstra and Bellman-Ford.", outcome: "Find shortest paths efficiently." },
    { id: "mst", label: "MST", group: "algo", col: 1.5, row: 7, icon: "fas fa-bezier-curve", link: "/pages/learning/mst-learning/mst-learning.html", desc: "Minimum Spanning Tree.", outcome: "Connect all nodes with minimum weight." },
    
    // Row 8
    { id: "segment-tree", label: "Segment Tree", group: "advanced", col: 0, row: 8, icon: "fas fa-stream", link: "/pages/learning/segment-tree-learning/segment-tree-learning.html", desc: "Dynamic range queries.", outcome: "Perform range queries in O(log N)." },
    
    // Row 9
    { id: "fenwick-tree", label: "Fenwick Tree", group: "advanced", col: -1, row: 9, icon: "fas fa-tree", link: "/pages/learning/fenwick-tree-learning/fenwick-tree-learning.html", desc: "Binary Indexed Tree.", outcome: "Implement simpler range sum queries." },
    { id: "sparse-table", label: "Sparse Table", group: "advanced", col: 1, row: 9, icon: "fas fa-table", link: "/pages/learning/sparse-table-learning/sparse-table-learning.html", desc: "Precomputed table.", outcome: "Answer RMQ in O(1) time." },

    // Row 10
    { id: "google-design", label: "System Design: Google", group: "advanced", col: 0, row: 10, icon: "fab fa-google", link: "/pages/learning/build-google-from-scratch/build-google-from-scratch.html", desc: "Build Google From Scratch.", outcome: "Understand architecture of billion-user apps." }
  ];

  const linksData = [
    // From Arrays/Strings
    { source: "arrays", target: "strings" },
    { source: "arrays", target: "prefix-sum" },
    { source: "arrays", target: "two-pointers" },
    { source: "arrays", target: "sliding-window" },
    { source: "arrays", target: "matrix" },
    
    // Into Intermediate
    { source: "two-pointers", target: "sliding-window" },
    { source: "arrays", target: "binary-search" },
    { source: "arrays", target: "linkedlist" },
    { source: "linkedlist", target: "stacks" },
    { source: "arrays", target: "bit-manipulation" },
    
    // Into Trees/Recursion
    { source: "linkedlist", target: "trees" },
    { source: "stacks", target: "recursion" },
    { source: "binary-search", target: "trees" },
    { source: "binary-search", target: "heaps" },
    
    // Into Advanced Algo
    { source: "recursion", target: "divide-conquer" },
    { source: "recursion", target: "dp" },
    { source: "trees", target: "trie" },
    
    // Into Graphs/DP
    { source: "trees", target: "graphs" },
    { source: "matrix", target: "graphs" },
    { source: "dp", target: "bitmask-dp" },
    { source: "bit-manipulation", target: "bitmask-dp" },
    
    // Graph algos
    { source: "graphs", target: "bfs" },
    { source: "graphs", target: "dfs" },
    { source: "bfs", target: "shortest-path" },
    { source: "graphs", target: "mst" },
    
    // Advanced DS
    { source: "dp", target: "segment-tree" },
    { source: "prefix-sum", target: "segment-tree" },
    { source: "segment-tree", target: "fenwick-tree" },
    { source: "segment-tree", target: "sparse-table" },

    // System Design
    { source: "graphs", target: "google-design" },
    { source: "trie", target: "google-design" },
    { source: "heaps", target: "google-design" }
  ];

  const CARD_WIDTH = 150;
  const CARD_HEIGHT = 44;
  const X_SPACING = 180;
  const Y_SPACING = 100;

  nodesData.forEach(n => {
    n.fx = n.col * X_SPACING;
    n.fy = n.row * Y_SPACING;
  });

  function isTopicCompleted(nodeId) {
    if (typeof userProgress === 'undefined' || !userProgress.completedProblems) return false;
    
    const categoryMap = {
      "arrays": "arrays", "strings": "strings", "linkedlist": "linkedlist",
      "trees": "trees", "graphs": "graphs", "dp": "dp", "stacks": "stacks"
    };
    const cat = categoryMap[nodeId] || nodeId.replaceAll('-', '');
    const hasCompleted = userProgress.completedProblems.some(pid => typeof pid === 'string' && pid.toLowerCase().includes(cat.toLowerCase()));
    
    if (!hasCompleted && typeof practiceProblems !== 'undefined') {
        const topicProbs = practiceProblems.filter(p => p.category === cat);
        if (topicProbs.length > 0) {
            const solved = topicProbs.filter(p => userProgress.completedProblems.includes(p.id)).length;
            if (solved > 0) return true;
        }
    }
    return hasCompleted;
  }

  nodesData.forEach(n => {
      n.completed = isTopicCompleted(n.id);
  });

  const container = document.getElementById("map-canvas");
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const svg = d3.select("#map-canvas")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%");

  const defs = svg.append("defs");
  
  // Adjusted arrow marker to touch the rectangular borders correctly
  defs.append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 5) 
    .attr("refY", 0)
    .attr("orient", "auto")
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "rgba(255, 255, 255, 0.4)");

  const g = svg.append("g");

  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);
  
  const initialTransform = d3.zoomIdentity.translate(width/2, 100).scale(0.85);
  svg.call(zoom.transform, initialTransform);

  const simulation = d3.forceSimulation(nodesData)
    .force("link", d3.forceLink(linksData).id(d => d.id));

  // Curved Paths for links
  const link = g.append("g")
    .attr("class", "links")
    .selectAll("path")
    .data(linksData)
    .enter().append("path")
    .attr("class", "link")
    .attr("stroke-width", 2)
    .attr("stroke", "rgba(255,255,255,0.15)")
    .attr("fill", "none")
    .attr("marker-end", "url(#arrow)");

  function getGroupIcon(group) {
    if(group === 'core') return 'fas fa-cube';
    if(group === 'pattern') return 'fas fa-puzzle-piece';
    if(group === 'algo') return 'fas fa-bolt';
    if(group === 'advanced') return 'fas fa-layer-group';
    return 'fas fa-star';
  }

  // Draw ForeignObject Nodes
  const node = g.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(nodesData)
    .enter().append("g")
    .attr("class", "node")
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended))
    .attr("tabindex", "0")
    .attr("role", "button")
    .attr("aria-label", d => d.label)
    .on("keydown", (event, d) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openOutcomePanel(d);
      }
    })
    .on("click", (event, d) => {
      openOutcomePanel(d);
    })
    .on("mouseover", (event, d) => {
        link.classed("highlighted", l => l.source.id === d.id || l.target.id === d.id);
        // Change stroke dynamically
        d3.selectAll('.link.highlighted').attr('stroke', '#38bdf8').attr('stroke-width', 2.5);
    })
    .on("mouseout", (event, d) => {
        link.classed("highlighted", false);
        d3.selectAll('.link:not(.highlighted)').attr('stroke', 'rgba(255,255,255,0.15)').attr('stroke-width', 2);
    });

  // Inject sleek HTML cards
  node.append("foreignObject")
    .attr("class", "topic-foreign-object")
    .attr("width", CARD_WIDTH)
    .attr("height", CARD_HEIGHT)
    .attr("x", -CARD_WIDTH / 2)
    .attr("y", -CARD_HEIGHT / 2)
    .append("xhtml:div")
    .attr("class", d => `topic-card group-${d.group} ${d.completed ? 'completed' : ''}`)
    .html(d => `
        <div class="topic-icon-wrap">
          <i class="${d.completed ? 'fas fa-check-circle' : (d.icon || getGroupIcon(d.group))}"></i>
        </div>
        <div class="topic-title-wrap">
          <span>${d.label}</span>
        </div>
    `);

  // Bezier curve path generator perfectly attached to rectangular card boundaries
  function linkPath(d) {
    const dx = d.target.x - d.source.x;
    const dy = d.target.y - d.source.y;
    
    let sx = d.source.x, sy = d.source.y;
    let tx = d.target.x, ty = d.target.y;
    
    // Attach to top/bottom or left/right depending on the aspect ratio of the distance
    if (Math.abs(dy) > Math.abs(dx)) {
        if (dy > 0) { sy += CARD_HEIGHT/2; ty -= CARD_HEIGHT/2; } 
        else { sy -= CARD_HEIGHT/2; ty += CARD_HEIGHT/2; }
        return `M${sx},${sy} C${sx},${(sy+ty)/2} ${tx},${(sy+ty)/2} ${tx},${ty}`;
    } else {
        if (dx > 0) { sx += CARD_WIDTH/2; tx -= CARD_WIDTH/2; } 
        else { sx -= CARD_WIDTH/2; tx += CARD_WIDTH/2; }
        return `M${sx},${sy} C${(sx+tx)/2},${sy} ${(sx+tx)/2},${ty} ${tx},${ty}`;
    }
  }

  // Simulation Tick
  simulation.on("tick", () => {
    link.attr("d", linkPath);
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });

  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
  }
  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
  }

  // UI Controls
  document.getElementById("zoomIn").addEventListener("click", () => {
    svg.transition().duration(300).call(zoom.scaleBy, 1.5);
  });
  document.getElementById("zoomOut").addEventListener("click", () => {
    svg.transition().duration(300).call(zoom.scaleBy, 0.75);
  });
  document.getElementById("zoomReset").addEventListener("click", () => {
    svg.transition().duration(750).call(zoom.transform, initialTransform);
  });

  // Search Functionality
  const searchInput = document.getElementById("universeSearch");
  const searchDropdown = document.getElementById("searchDropdown");

  searchInput.addEventListener("mousedown", (e) => e.stopPropagation());

  searchInput.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase();
    searchDropdown.innerHTML = "";
    if (val.length < 1) {
      searchDropdown.classList.add("hidden");
      return;
    }

    const matches = nodesData.filter(n => n.label.toLowerCase().includes(val) || n.desc.toLowerCase().includes(val));
    if (matches.length > 0) {
      searchDropdown.classList.remove("hidden");
      matches.forEach(m => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${m.label}</span> <span class="topic-group">${m.group}</span>`;
        li.addEventListener("click", () => {
          focusNode(m);
          searchInput.value = m.label;
          searchDropdown.classList.add("hidden");
        });
        searchDropdown.appendChild(li);
      });
    } else {
      searchDropdown.classList.add("hidden");
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".universe-search")) {
      searchDropdown.classList.add("hidden");
    }
  });

  function focusNode(nodeData) {
    node.classed("highlighted", false);
    const targetNode = node.filter(d => d.id === nodeData.id);
    targetNode.classed("highlighted", true);
    
    const scale = 1.6;
    const x = width / 2 - nodeData.x * scale;
    const y = height / 2 - nodeData.y * scale;
    const transform = d3.zoomIdentity.translate(x, y).scale(scale);
    
    svg.transition()
      .duration(1000)
      .call(zoom.transform, transform);
      
    setTimeout(() => {
        targetNode.classed("highlighted", false);
    }, 4000);
    
    openOutcomePanel(nodeData);
  }
  
  // Outcome Panel Logic
  const panel = document.getElementById("learningOutcomePanel");
  const closeBtn = document.getElementById("closePanelBtn");
  
  function openOutcomePanel(nodeData) {
      document.getElementById("panelTitle").textContent = nodeData.label;
      document.getElementById("panelOutcome").textContent = nodeData.outcome;
      
      const statusSpan = document.getElementById("panelStatus");
      if (nodeData.completed) {
          statusSpan.textContent = "Completed";
          statusSpan.className = "status-badge completed";
      } else {
          statusSpan.textContent = "Not Started";
          statusSpan.className = "status-badge";
      }
      
      const startBtn = document.getElementById("startLearningBtn");
      startBtn.href = nodeData.link;
      
      panel.classList.remove("hidden");
  }
  
  closeBtn.addEventListener("click", () => {
      panel.classList.add("hidden");
  });
});
