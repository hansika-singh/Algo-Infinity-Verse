(() => {
document.addEventListener("DOMContentLoaded", () => {
    initFailAcademy();
});

// The Problem Database
const academyProblems = [
    {
        id: "SP-01",
        title: "Shortest Path in a Weighted Graph",
        description: "Given a directed graph where edges have positive weights, find the minimum cost path from node A to node B.",
        mistakes: [
            "<strong>Assuming DFS finds the shortest path:</strong> DFS explores as deep as possible and returns the *first* path it finds, completely ignoring edge weights.",
            "<strong>Using basic BFS:</strong> BFS finds the path with the fewest *number of edges*, which is only optimal if all edges have weight 1."
        ],
        optimalTime: "O((V + E) log V)",
        optimalApproachId: "dijkstra",
        approaches: [
            {
                id: "dfs",
                name: "Depth-First Search (DFS)",
                isCorrect: false,
                explanation: "❌ DFS dives deep into the graph. In a weighted graph, it might take a path with fewer edges but massive weights, ignoring a slightly longer route with tiny weights.",
                visualType: "graph_dfs",
                compText: "Returns the first path found. Cost: 100"
            },
            {
                id: "dijkstra",
                name: "Dijkstra's Algorithm",
                isCorrect: true,
                explanation: "✅ Dijkstra acts like a water ripple, expanding outward based on accumulated edge weights, ensuring the first time it reaches the destination is definitively the shortest path.",
                visualType: "graph_dijk",
                compText: "Explores by minimum weight. Cost: 15"
            }
        ]
    },
    {
        id: "CC-02",
        title: "Coin Change (Target Sum)",
        description: "Given an array of coin denominations (e.g., [1, 3, 4]) and a target amount (e.g., 6), find the minimum number of coins needed to make the target.",
        mistakes: [
            "<strong>Using a Greedy Approach:</strong> Always picking the largest possible coin works for standard currencies (US Dollars) but fails on arbitrary coin sets.",
            "<strong>Ignoring overlapping subproblems:</strong> Solving it with naive recursion leads to massive redundant calculations (TLE)."
        ],
        optimalTime: "O(Target * Coins)",
        optimalApproachId: "dp",
        approaches: [
            {
                id: "greedy",
                name: "Greedy Algorithm",
                isCorrect: false,
                explanation: "❌ Greedy blindly picks the largest coin first. For coins [1, 3, 4] and target 6, it picks '4', leaving '2'. It then needs two '1' coins. Total: 3 coins (4, 1, 1). Optimal is 2 coins (3, 3).",
                visualType: "coin_greedy",
                compText: "Picks largest first: 4 + 1 + 1 (3 coins)"
            },
            {
                id: "dp",
                name: "Dynamic Programming",
                isCorrect: true,
                explanation: "✅ DP considers all combinations by building up from smaller targets. It realizes that `dp[6] = min(dp[6-1], dp[6-3], dp[6-4]) + 1`, finding the optimal (3+3).",
                visualType: "coin_dp",
                compText: "Checks all states: 3 + 3 (2 coins)"
            }
        ]
    },
    {
        id: "LPS-03",
        title: "Longest Palindromic Substring",
        description: "Given a string `s`, find the longest contiguous substring that reads the same forwards and backwards.",
        mistakes: [
            "<strong>Reversing the string and finding Longest Common Substring:</strong> This is a classic trap! It fails when a reversed non-palindromic substring appears elsewhere in the string.",
            "<strong>Naive O(N³) checking:</strong> Generating all substrings and checking if they are palindromes is too slow for strings longer than 1000 chars."
        ],
        optimalTime: "O(N²)",
        optimalApproachId: "expand",
        approaches: [
            {
                id: "reverse_lcs",
                name: "Reverse & LCS",
                isCorrect: false,
                explanation: "❌ Fails on `s = 'abacdfgdcaba'`. Reverse is `s' = 'abacdgfdcaba'`. The LCS is 'abacd', but 'abacd' is NOT a palindrome!",
                visualType: "text_lcs",
                compText: "Finds false positives in O(N²)"
            },
            {
                id: "expand",
                name: "Expand Around Center",
                isCorrect: true,
                explanation: "✅ Iterates through each character (and pair of characters) treating them as the center, expanding outward as long as it remains a palindrome.",
                visualType: "text_expand",
                compText: "Only finds true palindromes in O(N²)"
            }
        ]
    }
];

// State
let currentProblem = null;

// DOM Elements
const els = {
    problemList: document.getElementById('problemList'),
    labIdDisplay: document.getElementById('labIdDisplay'),
    labTitleDisplay: document.getElementById('labTitleDisplay'),
    labDescDisplay: document.getElementById('labDescDisplay'),
    approachesGrid: document.getElementById('approachesGrid'),
    
    analysisPanel: document.getElementById('analysisPanel'),
    analysisStatus: document.getElementById('analysisStatus'),
    analysisTitle: document.getElementById('analysisTitle'),
    explanationText: document.getElementById('explanationText'),
    ceVisual: document.getElementById('ceVisual'),
    
    compSelectedText: document.getElementById('compSelectedText'),
    compSelectedTime: document.getElementById('compSelectedTime'),
    compOptimalText: document.getElementById('compOptimalText'),
    compOptimalTime: document.getElementById('compOptimalTime'),
    
    mistakesSection: document.getElementById('mistakesSection'),
    mistakesList: document.getElementById('mistakesList')
};

function initFailAcademy() {
    renderSidebar();
    if (academyProblems.length > 0) {
        loadProblem(academyProblems[0].id);
    }
}

function renderSidebar() {
    els.problemList.innerHTML = '';
    academyProblems.forEach(p => {
        const li = document.createElement('li');
        li.className = `prob-item ${currentProblem && currentProblem.id === p.id ? 'active' : ''}`;
        li.addEventListener("click", () => loadProblem(p.id));
        li.innerHTML = `
            <span class="p-id">${p.id}</span>
            <span class="p-title">${p.title}</span>
        `;
        els.problemList.appendChild(li);
    });
}

function loadProblem(id) {
    currentProblem = academyProblems.find(p => p.id === id);
    if (!currentProblem) return;

    // Reset UI
    els.analysisPanel.classList.remove('visible');
    els.mistakesSection.style.display = 'block';

    // Set Text
    els.labIdDisplay.textContent = `MODULE ${currentProblem.id}`;
    els.labTitleDisplay.textContent = currentProblem.title;
    els.labDescDisplay.textContent = currentProblem.description;

    // Render Approaches
    els.approachesGrid.innerHTML = '';
    currentProblem.approaches.forEach(app => {
        const btn = document.createElement('button');
        btn.className = 'approach-btn';
        btn.textContent = app.name;
        btn.addEventListener("click", () => selectApproach(app.id, btn));
        els.approachesGrid.appendChild(btn);
    });

    // Render Mistakes
    els.mistakesList.innerHTML = '';
    currentProblem.mistakes.forEach(m => {
        const li = document.createElement('li');
        li.innerHTML = m;
        els.mistakesList.appendChild(li);
    });

    renderSidebar();
}

function selectApproach(appId, btnElement) {
    // Update active button
    document.querySelectorAll('.approach-btn').forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');

    const approach = currentProblem.approaches.find(a => a.id === appId);
    const optimalApproach = currentProblem.approaches.find(a => a.id === currentProblem.optimalApproachId);

    // Update Analysis Panel Theme
    els.analysisPanel.className = `analysis-panel visible ${approach.isCorrect ? 'success' : 'error'}`;
    els.analysisStatus.innerHTML = approach.isCorrect 
        ? '<i class="fas fa-check-circle"></i> Optimal Approach'
        : '<i class="fas fa-times-circle"></i> Approach Failed';
    
    // Set content
    els.analysisTitle.textContent = approach.name;
    els.explanationText.textContent = approach.explanation;

    // Set Comparison
    els.compSelectedText.textContent = approach.compText;
    els.compSelectedTime.textContent = "See Logic"; // Generic placeholder
    els.compOptimalText.textContent = optimalApproach.compText;
    els.compOptimalTime.textContent = currentProblem.optimalTime;

    // Render Visuals
    renderVisual(approach.visualType);
}

function renderVisual(type) {
    els.ceVisual.innerHTML = '';

    if (type === 'graph_dfs') {
        els.ceVisual.innerHTML = `
            <div class="graph-diagram">
                <div class="graph-row">
                    <div class="node start">A</div>
                    <div class="edge heavy">Cost 100<br>DFS Path</div>
                    <div class="node visited">B</div>
                </div>
                <div class="ce-label">DFS finds A -> B directly and stops, missing the shortcut!</div>
            </div>
        `;
    } else if (type === 'graph_dijk') {
        els.ceVisual.innerHTML = `
            <div class="graph-diagram">
                <div class="graph-row">
                    <div class="node start">A</div>
                    <div class="edge light">Cost 5</div>
                    <div class="node optimal">C</div>
                    <div class="edge light">Cost 10</div>
                    <div class="node end">B</div>
                </div>
                <div class="ce-label">Dijkstra finds A -> C -> B (Total Cost: 15)</div>
            </div>
        `;
    } else if (type === 'coin_greedy') {
        els.ceVisual.innerHTML = `
            <div class="coin-diagram">
                <div class="ce-label">Target: 6 | Coins: [1, 3, 4]</div>
                <div class="coin-row">
                    <div class="coin selected">4</div>
                    <div class="coin selected">1</div>
                    <div class="coin selected">1</div>
                </div>
                <div class="ce-label">Greedy trapped! Takes largest first. (Total 3 coins)</div>
            </div>
        `;
    } else if (type === 'coin_dp') {
        els.ceVisual.innerHTML = `
            <div class="coin-diagram">
                <div class="ce-label">Target: 6 | Coins: [1, 3, 4]</div>
                <div class="coin-row">
                    <div class="coin optimal">3</div>
                    <div class="coin optimal">3</div>
                </div>
                <div class="ce-label">DP evaluates all paths. (Total 2 coins)</div>
            </div>
        `;
    } else if (type === 'text_lcs') {
        els.ceVisual.innerHTML = `
            <div class="coin-diagram" style="align-items:flex-start;">
                <div class="ce-label">Original: &nbsp;<b>abacd</b>fgdcaba</div>
                <div class="ce-label">Reversed: &nbsp;abacdgfdc<b>abacd</b></div>
                <div class="ce-label" style="color:var(--fail-primary); margin-top:10px;">LCS is "abacd" -> NOT a palindrome!</div>
            </div>
        `;
    } else if (type === 'text_expand') {
        els.ceVisual.innerHTML = `
            <div class="coin-diagram">
                <div class="ce-label">Expand around center 'g' or 'dd'</div>
                <div class="coin-row">
                    <span style="letter-spacing:5px; font-size:1.2rem; color:#fff;">abacd<span style="color:var(--fail-success); font-weight:bold;">fgdf</span>caba</span>
                </div>
                <div class="ce-label" style="color:var(--fail-success);">Safely identifies valid palindromes only.</div>
            </div>
        `;
    }
}
})();
