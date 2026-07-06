/* ==========================================================
   DSA STORY MODE — Algo Infinity Verse
   CORRECTED VERSION
   Bugs fixed:
     1. pauseBtn.addEventListener missing "click" type
     2. Binary search variables/functions were block-scoped
        inside a switch case — now at module level
     3. renderBinarySearch() was defined but never called
     4. finishStory() was declared twice with conflicting logic
     5. init() and initializePage() were both called (double init)
     6. BFS/DFS/Merge/Stack/Dijkstra all showed "Coming Soon"
     7. .array-box.active and .array-box.found were duplicated
        in CSS, stripping scale transform and pulse animation
========================================================== */

/* ============================================================
   DOM REFERENCES
============================================================ */

const simulationCanvas = document.getElementById("simulationCanvas");
const simulationStatus = document.getElementById("simulationStatus");
const playBtn          = document.getElementById("playBtn");
const pauseBtn         = document.getElementById("pauseBtn");
const resetBtn         = document.getElementById("resetBtn");
const copyBtn          = document.getElementById("copyCodeBtn");
const storyTitle       = document.getElementById("storyTitle");
const storyText        = document.getElementById("storyText");
const codeBlock        = document.getElementById("codeBlock");
const progressFill     = document.getElementById("progressFill");
const progressText     = document.getElementById("progressText");
const storyButtons     = document.querySelectorAll(".story-btn");
const timelineItems    = document.querySelectorAll(".timeline-item");

/* ============================================================
   APPLICATION STATE
============================================================ */

const appState = {
    currentAlgorithm : "binary",
    completedStories : new Set(),
    animationTimeouts: [],
    isPlaying        : false,
    isPaused         : false
};

/* ============================================================
   STORY DATA
============================================================ */

const storyData = {

    binary : {
        title : "Binary Search",
        story :
`Imagine searching for a book in a huge library.
Instead of checking every shelf one by one, you always
open the middle shelf first. Half the remaining shelves
are immediately eliminated. Repeat until you find the book.`,
        code  :
`int binarySearch(vector<int>& arr, int target)
{
    int left  = 0;
    int right = arr.size() - 1;

    while (left <= right)
    {
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) return mid;
        if (arr[mid] <  target) left  = mid + 1;
        else                    right = mid - 1;
    }
    return -1;
}`
    },

    bfs : {
        title : "Breadth First Search",
        story :
`Imagine a rumor spreading through a city.
Your closest friends hear it first, then their friends —
everyone at the same distance hears it together.
BFS explores nodes level by level using a queue.`,
        code  :
`void bfs(int start)
{
    queue<int> q;
    q.push(start);
    visited[start] = true;

    while (!q.empty())
    {
        int node = q.front();
        q.pop();

        for (auto next : adj[node])
        {
            if (!visited[next])
            {
                visited[next] = true;
                q.push(next);
            }
        }
    }
}`
    },

    dfs : {
        title : "Depth First Search",
        story :
`Imagine exploring a maze.
You keep walking deeper until you hit a dead end.
Only then do you backtrack and try another path.
DFS goes as deep as possible before backtracking.`,
        code  :
`void dfs(int node)
{
    visited[node] = true;

    for (auto next : adj[node])
    {
        if (!visited[next])
            dfs(next);
    }
}`
    },

    dijkstra : {
        title : "Dijkstra",
        story :
`Imagine finding the cheapest flight route between cities.
At every step, pick the city with the lowest total
travel cost known so far. Dijkstra guarantees the
shortest path in a graph with non-negative edge weights.`,
        code  :
`void dijkstra(int src)
{
    priority_queue<
        pair<int,int>,
        vector<pair<int,int>>,
        greater<pair<int,int>>
    > pq;

    dist[src] = 0;
    pq.push({0, src});

    while (!pq.empty())
    {
        auto [d, u] = pq.top();
        pq.pop();

        for (auto [v, w] : adj[u])
        {
            if (dist[u] + w < dist[v])
            {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
}`
    },

    merge : {
        title : "Merge Sort",
        story :
`Imagine organising a big stack of exam papers.
Divide the pile in half, sort each half separately,
then merge them back together in sorted order.
Merge Sort divides until single elements, then merges up.`,
        code  :
`void mergeSort(vector<int>& arr, int l, int r)
{
    if (l >= r) return;

    int mid = (l + r) / 2;

    mergeSort(arr, l,     mid);
    mergeSort(arr, mid+1, r  );
    merge    (arr, l, mid, r );
}`
    },

    stack : {
        title : "Stack",
        story :
`Think of stacking plates in a restaurant.
The last plate placed is always the first one removed.
This is LIFO — Last In, First Out.
Stacks power undo operations, call stacks, and parsing.`,
        code  :
`stack<int> st;

st.push(10);       // [10]
st.push(20);       // [10, 20]
st.push(30);       // [10, 20, 30]

cout << st.top();  // 30
st.pop();          // [10, 20]`
    }

};

/* ============================================================
   BINARY SEARCH — MODULE-LEVEL STATE
   FIX for Bug #2: these were inside a switch case block.
   let/const are block-scoped — they died when the switch
   exited. Event listeners calling startBinaryAnimation(),
   pauseBinaryAnimation(), resetBinarySearch() all got
   ReferenceErrors.
============================================================ */

const binaryArray  = [5, 9, 14, 18, 21, 25, 30];
const binaryTarget = 25;

const binarySteps = [
    {
        left: 0, mid: 3, right: 6,
        message : "Step 1 — Check middle element (index 3 → value 18).",
        found   : false
    },
    {
        left: 4, mid: 5, right: 6,
        message : "Step 2 — 18 &lt; 25. Eliminate left half. Search right.",
        found   : false
    },
    {
        left: 5, mid: 5, right: 5,
        message : "Step 3 — Found <strong>25</strong> at index 5! ✅",
        found   : true
    }
];

let binaryAnimIndex = 0;
let binaryRunning   = false;

/* ============================================================
   UTILITIES
============================================================ */

function clearAnimations() {
    appState.animationTimeouts.forEach(id => clearTimeout(id));
    appState.animationTimeouts = [];
}

function schedule(fn, delay) {
    const id = setTimeout(fn, delay);
    appState.animationTimeouts.push(id);
    return id;
}

function setStatus(text) {
    simulationStatus.textContent = text;
}

function updateStory() {
    const d = storyData[appState.currentAlgorithm];
    storyTitle.textContent = d.title;
    storyText.textContent  = d.story;
}

function updateCode() {
    codeBlock.textContent = storyData[appState.currentAlgorithm].code;
}

function updateActiveButton() {
    storyButtons.forEach(btn => {
        btn.classList.toggle(
            "active",
            btn.dataset.algo === appState.currentAlgorithm
        );
    });
}

function resetTimeline() {
    timelineItems.forEach(i => i.classList.remove("active"));
    timelineItems[0]?.classList.add("active");
}

function activateTimeline(index) {
    timelineItems.forEach(i => i.classList.remove("active"));
    timelineItems[index]?.classList.add("active");
}

function finishTimeline() {
    timelineItems.forEach(i => i.classList.add("active"));
}

function updateProgress() {
    const done  = appState.completedStories.size;
    const total = Object.keys(storyData).length;
    progressFill.style.width = (done / total) * 100 + "%";
    progressText.textContent = `${done} / ${total} Completed`;
}

/*
   FIX for Bug #4: finishStory was declared TWICE.
   Lines 1233 and 1501 had conflicting implementations.
   This is the single, correct version.
*/
function finishStory() {
    appState.completedStories.add(appState.currentAlgorithm);
    appState.isPlaying = false;
    appState.isPaused  = false;
    binaryRunning      = false;
    finishTimeline();
    updateProgress();
    simulationStatus.innerHTML = "✅ Completed";
}

/* ============================================================
   ALGORITHM SWITCHING
============================================================ */

function switchAlgorithm(algo) {
    if (!storyData[algo]) return;
    clearAnimations();
    appState.currentAlgorithm = algo;
    appState.isPlaying = false;
    appState.isPaused  = false;
    binaryRunning      = false;
    binaryAnimIndex    = 0;
    updateStory();
    updateCode();
    updateActiveButton();
    resetTimeline();
    setStatus("Ready");
    renderCurrentAlgorithm();
}

/* ============================================================
   RENDER CONTROLLER
   FIX for Bug #2 + Bug #3: switch now just calls functions.
   Previously the entire binary search implementation was
   nested inside case "binary" — functions were defined but
   renderBinarySearch() was never actually called.
============================================================ */

function renderCurrentAlgorithm() {
    switch (appState.currentAlgorithm) {
        case "binary"  : renderBinarySearch(); break;
        case "bfs"     : renderBFS();          break;
        case "dfs"     : renderDFS();          break;
        case "dijkstra": renderDijkstra();     break;
        case "merge"   : renderMergeSort();    break;
        case "stack"   : renderStack();        break;
    }
}

/* ============================================================
   PLAY CONTROLLER
============================================================ */

function playCurrentAlgorithm() {
    switch (appState.currentAlgorithm) {
        case "binary"  : startBinaryAnimation(); break;
        case "bfs"     : animateBFS();           break;
        case "dfs"     : animateDFS();           break;
        case "dijkstra": animateDijkstra();      break;
        case "merge"   : animateMergeSort();     break;
        case "stack"   : animateStack();         break;
    }
}

/* ============================================================
   BINARY SEARCH — RENDER
============================================================ */

function renderBinarySearch() {
    simulationCanvas.innerHTML = `
        <div class="binary-search-container">

            <div class="binary-header">
                <div class="target-card">
                    🎯 Target <span>${binaryTarget}</span>
                </div>
                <div class="status-card">Binary Search Ready</div>
            </div>

            <div class="pointer-row">
                ${binaryArray.map((_, i) => {
                    let lbl = "";
                    if (i === 0) lbl = "L";
                    if (i === 3) lbl = "M";
                    if (i === 6) lbl = "R";
                    return `<div class="pointer">${lbl}</div>`;
                }).join("")}
            </div>

            <div class="array-row">
                ${binaryArray.map(n =>
                    `<div class="array-box">${n}</div>`
                ).join("")}
            </div>

            <div class="step-description">
                Press <strong>Play</strong> to begin Binary Search.
            </div>

        </div>
    `;
}

/* ============================================================
   BINARY SEARCH — UPDATE VIEW PER STEP
============================================================ */

function updateBinaryView(step) {
    const boxes    = document.querySelectorAll(".array-box");
    const pointers = document.querySelectorAll(".pointer");
    const desc     = document.querySelector(".step-description");

    /* Reset all boxes */
    boxes.forEach((b, i) => {
        b.classList.remove("active", "found", "eliminated");
        if (i < step.left || i > step.right) {
            b.classList.add("eliminated");
        }
    });

    /* Reset all pointers */
    pointers.forEach(p => {
        p.textContent     = "";
        p.style.opacity   = "0.3";
        p.style.transform = "translateY(0)";
    });

    /* Set L, M, R */
    const markPointer = (index, label) => {
        if (!pointers[index]) return;
        pointers[index].textContent     = label;
        pointers[index].style.opacity   = "1";
        pointers[index].style.transform = "translateY(-14px)";
    };

    markPointer(step.left,  "L");
    markPointer(step.right, "R");
    markPointer(step.mid,   "M");

    /* Highlight mid box */
    if (boxes[step.mid]) boxes[step.mid].classList.add("active");

    /* Update description */
    if (desc) desc.innerHTML = step.message;
}

/* ============================================================
   BINARY SEARCH — ANIMATE
============================================================ */

function startBinaryAnimation() {
    if (binaryRunning) return;
    binaryRunning   = true;
    binaryAnimIndex = 0;
    setStatus("Searching...");
    activateTimeline(2);
    runBinaryFrame();
}

function runBinaryFrame() {
    if (!binaryRunning) return;

    if (binaryAnimIndex >= binarySteps.length) {
        /* Mark found box green */
        const lastStep = binarySteps[binarySteps.length - 1];
        const boxes    = document.querySelectorAll(".array-box");
        boxes[lastStep.mid]?.classList.remove("active");
        boxes[lastStep.mid]?.classList.add("found");
        binaryRunning = false;
        schedule(finishStory, 700);
        return;
    }

    updateBinaryView(binarySteps[binaryAnimIndex]);
    binaryAnimIndex++;
    schedule(runBinaryFrame, 1800);
}

function pauseBinaryAnimation() {
    binaryRunning = false;
    clearAnimations();
    setStatus("Paused");
}

function resumeBinaryAnimation() {
    if (binaryRunning) return;
    binaryRunning = true;
    runBinaryFrame();
}

function resetBinarySearch() {
    binaryRunning   = false;
    binaryAnimIndex = 0;
    renderBinarySearch();
}

/* ============================================================
   BFS — RENDER & ANIMATE
   FIX for Bug #6: was "Coming Soon" placeholder
============================================================ */

function renderBFS() {
    simulationCanvas.innerHTML = `
        <div class="graph-container">
            <svg class="graph-svg" viewBox="0 0 500 310">
                <line x1="250" y1="55"  x2="130" y2="155" stroke="#475569" stroke-width="2"/>
                <line x1="250" y1="55"  x2="370" y2="155" stroke="#475569" stroke-width="2"/>
                <line x1="130" y1="155" x2="70"  y2="265" stroke="#475569" stroke-width="2"/>
                <line x1="130" y1="155" x2="190" y2="265" stroke="#475569" stroke-width="2"/>
                <line x1="370" y1="155" x2="310" y2="265" stroke="#475569" stroke-width="2"/>
                <line x1="370" y1="155" x2="430" y2="265" stroke="#475569" stroke-width="2"/>

                <circle id="bnode-0" cx="250" cy="55"  r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>
                <circle id="bnode-1" cx="130" cy="155" r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>
                <circle id="bnode-2" cx="370" cy="155" r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>
                <circle id="bnode-3" cx="70"  cy="265" r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>
                <circle id="bnode-4" cx="190" cy="265" r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>
                <circle id="bnode-5" cx="310" cy="265" r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>
                <circle id="bnode-6" cx="430" cy="265" r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>

                <text x="250" y="61"  text-anchor="middle" fill="white" font-size="15" font-weight="bold">A</text>
                <text x="130" y="161" text-anchor="middle" fill="white" font-size="15" font-weight="bold">B</text>
                <text x="370" y="161" text-anchor="middle" fill="white" font-size="15" font-weight="bold">C</text>
                <text x="70"  y="271" text-anchor="middle" fill="white" font-size="15" font-weight="bold">D</text>
                <text x="190" y="271" text-anchor="middle" fill="white" font-size="15" font-weight="bold">E</text>
                <text x="310" y="271" text-anchor="middle" fill="white" font-size="15" font-weight="bold">F</text>
                <text x="430" y="271" text-anchor="middle" fill="white" font-size="15" font-weight="bold">G</text>
            </svg>
            <div class="step-description">
                Press <strong>Play</strong> to start BFS — Level by Level.
            </div>
        </div>
    `;
}

function animateBFS() {
    setStatus("Running BFS...");
    activateTimeline(2);
    renderBFS();

    const steps = [
        { id: "bnode-0", msg: "Level 0 — Visit <strong>A</strong> (start). Add B and C to queue." },
        { id: "bnode-1", msg: "Level 1 — Visit <strong>B</strong>. Add D and E to queue." },
        { id: "bnode-2", msg: "Level 1 — Visit <strong>C</strong>. Add F and G to queue." },
        { id: "bnode-3", msg: "Level 2 — Visit <strong>D</strong>." },
        { id: "bnode-4", msg: "Level 2 — Visit <strong>E</strong>." },
        { id: "bnode-5", msg: "Level 2 — Visit <strong>F</strong>." },
        { id: "bnode-6", msg: "Level 2 — Visit <strong>G</strong>. BFS complete! ✅" }
    ];

    steps.forEach(({ id, msg }, i) => {
        schedule(() => {
            const el   = document.getElementById(id);
            const desc = document.querySelector(".step-description");
            if (el)   el.setAttribute("fill", "#06b6d4");
            if (desc) desc.innerHTML = msg;
            if (i === steps.length - 1) schedule(finishStory, 700);
        }, i * 950);
    });
}

/* ============================================================
   DFS — RENDER & ANIMATE
   FIX for Bug #6: was "Coming Soon" placeholder
============================================================ */

function renderDFS() {
    simulationCanvas.innerHTML = `
        <div class="graph-container">
            <svg class="graph-svg" viewBox="0 0 500 310">
                <line x1="250" y1="55"  x2="130" y2="155" stroke="#475569" stroke-width="2"/>
                <line x1="250" y1="55"  x2="370" y2="155" stroke="#475569" stroke-width="2"/>
                <line x1="130" y1="155" x2="70"  y2="265" stroke="#475569" stroke-width="2"/>
                <line x1="130" y1="155" x2="190" y2="265" stroke="#475569" stroke-width="2"/>
                <line x1="370" y1="155" x2="310" y2="265" stroke="#475569" stroke-width="2"/>
                <line x1="370" y1="155" x2="430" y2="265" stroke="#475569" stroke-width="2"/>

                <circle id="dnode-0" cx="250" cy="55"  r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>
                <circle id="dnode-1" cx="130" cy="155" r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>
                <circle id="dnode-2" cx="370" cy="155" r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>
                <circle id="dnode-3" cx="70"  cy="265" r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>
                <circle id="dnode-4" cx="190" cy="265" r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>
                <circle id="dnode-5" cx="310" cy="265" r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>
                <circle id="dnode-6" cx="430" cy="265" r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>

                <text x="250" y="61"  text-anchor="middle" fill="white" font-size="15" font-weight="bold">A</text>
                <text x="130" y="161" text-anchor="middle" fill="white" font-size="15" font-weight="bold">B</text>
                <text x="370" y="161" text-anchor="middle" fill="white" font-size="15" font-weight="bold">C</text>
                <text x="70"  y="271" text-anchor="middle" fill="white" font-size="15" font-weight="bold">D</text>
                <text x="190" y="271" text-anchor="middle" fill="white" font-size="15" font-weight="bold">E</text>
                <text x="310" y="271" text-anchor="middle" fill="white" font-size="15" font-weight="bold">F</text>
                <text x="430" y="271" text-anchor="middle" fill="white" font-size="15" font-weight="bold">G</text>
            </svg>
            <div class="step-description">
                Press <strong>Play</strong> to start DFS — Go Deep First.
            </div>
        </div>
    `;
}

function animateDFS() {
    setStatus("Running DFS...");
    activateTimeline(2);
    renderDFS();

    /* DFS path: A → B → D → backtrack → E → backtrack to A → C → F → backtrack → G */
    const steps = [
        { id: "dnode-0", msg: "Visit <strong>A</strong> — Start. Recurse into B." },
        { id: "dnode-1", msg: "Visit <strong>B</strong> — Recurse into D." },
        { id: "dnode-3", msg: "Visit <strong>D</strong> — Dead end. Backtrack to B." },
        { id: "dnode-4", msg: "Visit <strong>E</strong> — Dead end. Backtrack to A." },
        { id: "dnode-2", msg: "Visit <strong>C</strong> — Recurse into F." },
        { id: "dnode-5", msg: "Visit <strong>F</strong> — Dead end. Backtrack to C." },
        { id: "dnode-6", msg: "Visit <strong>G</strong> — DFS complete! ✅" }
    ];

    steps.forEach(({ id, msg }, i) => {
        schedule(() => {
            const el   = document.getElementById(id);
            const desc = document.querySelector(".step-description");
            if (el)   el.setAttribute("fill", "#8b5cf6");
            if (desc) desc.innerHTML = msg;
            if (i === steps.length - 1) schedule(finishStory, 700);
        }, i * 950);
    });
}

/* ============================================================
   DIJKSTRA — RENDER & ANIMATE
   FIX for Bug #6: was "Coming Soon" placeholder
============================================================ */

function renderDijkstra() {
    simulationCanvas.innerHTML = `
        <div class="graph-container">
            <svg class="graph-svg" viewBox="0 0 520 310">
                <line x1="80"  y1="155" x2="210" y2="80"  stroke="#475569" stroke-width="2"/>
                <line x1="80"  y1="155" x2="210" y2="230" stroke="#475569" stroke-width="2"/>
                <line x1="210" y1="80"  x2="370" y2="80"  stroke="#475569" stroke-width="2"/>
                <line x1="210" y1="230" x2="370" y2="230" stroke="#475569" stroke-width="2"/>
                <line x1="370" y1="80"  x2="460" y2="155" stroke="#475569" stroke-width="2"/>
                <line x1="370" y1="230" x2="460" y2="155" stroke="#475569" stroke-width="2"/>
                <line x1="210" y1="80"  x2="210" y2="230" stroke="#475569" stroke-width="2"/>

                <text x="132" y="100" fill="#94a3b8" font-size="12" font-weight="600">4</text>
                <text x="132" y="220" fill="#94a3b8" font-size="12" font-weight="600">2</text>
                <text x="284" y="68"  fill="#94a3b8" font-size="12" font-weight="600">3</text>
                <text x="284" y="255" fill="#94a3b8" font-size="12" font-weight="600">1</text>
                <text x="420" y="102" fill="#94a3b8" font-size="12" font-weight="600">1</text>
                <text x="420" y="220" fill="#94a3b8" font-size="12" font-weight="600">5</text>
                <text x="222" y="160" fill="#94a3b8" font-size="12" font-weight="600">6</text>

                <circle id="djnode-A" cx="80"  cy="155" r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>
                <circle id="djnode-B" cx="210" cy="80"  r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>
                <circle id="djnode-C" cx="210" cy="230" r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>
                <circle id="djnode-D" cx="370" cy="80"  r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>
                <circle id="djnode-E" cx="370" cy="230" r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>
                <circle id="djnode-F" cx="460" cy="155" r="28" fill="#1e293b" stroke="#475569" stroke-width="3"/>

                <text x="80"  y="161" text-anchor="middle" fill="white" font-size="14" font-weight="bold">A</text>
                <text x="210" y="86"  text-anchor="middle" fill="white" font-size="14" font-weight="bold">B</text>
                <text x="210" y="236" text-anchor="middle" fill="white" font-size="14" font-weight="bold">C</text>
                <text x="370" y="86"  text-anchor="middle" fill="white" font-size="14" font-weight="bold">D</text>
                <text x="370" y="236" text-anchor="middle" fill="white" font-size="14" font-weight="bold">E</text>
                <text x="460" y="161" text-anchor="middle" fill="white" font-size="14" font-weight="bold">F</text>

                <text id="ddist-A" x="80"  y="140" text-anchor="middle" fill="#f59e0b" font-size="11">0</text>
                <text id="ddist-B" x="210" y="65"  text-anchor="middle" fill="#64748b" font-size="11">∞</text>
                <text id="ddist-C" x="210" y="215" text-anchor="middle" fill="#64748b" font-size="11">∞</text>
                <text id="ddist-D" x="370" y="65"  text-anchor="middle" fill="#64748b" font-size="11">∞</text>
                <text id="ddist-E" x="370" y="215" text-anchor="middle" fill="#64748b" font-size="11">∞</text>
                <text id="ddist-F" x="460" y="140" text-anchor="middle" fill="#64748b" font-size="11">∞</text>
            </svg>
            <div class="step-description">
                Press <strong>Play</strong> — numbers on edges are travel costs. Find shortest path from A.
            </div>
        </div>
    `;
}

function animateDijkstra() {
    setStatus("Running Dijkstra...");
    activateTimeline(2);
    renderDijkstra();

    const steps = [
        {
            nodeId: "djnode-A", color: "#f59e0b",
            msg   : "Visit <strong>A</strong> (dist=0). Set B=4, C=2.",
            dists : { B: "4", C: "2" }
        },
        {
            nodeId: "djnode-C", color: "#06b6d4",
            msg   : "Visit <strong>C</strong> (dist=2) — cheapest. Update E: 2+1=3.",
            dists : { C: "2", E: "3" }
        },
        {
            nodeId: "djnode-E", color: "#06b6d4",
            msg   : "Visit <strong>E</strong> (dist=3). Update F: 3+5=8.",
            dists : { E: "3", F: "8" }
        },
        {
            nodeId: "djnode-B", color: "#06b6d4",
            msg   : "Visit <strong>B</strong> (dist=4). Update D: 4+3=7.",
            dists : { B: "4", D: "7" }
        },
        {
            nodeId: "djnode-D", color: "#22c55e",
            msg   : "Visit <strong>D</strong> (dist=7). F via D: 7+1=8 — no change.",
            dists : { D: "7" }
        },
        {
            nodeId: "djnode-F", color: "#22c55e",
            msg   : "Visit <strong>F</strong> (dist=8). All shortest paths found! ✅",
            dists : { F: "8" }
        }
    ];

    steps.forEach((step, i) => {
        schedule(() => {
            const nodeEl = document.getElementById(step.nodeId);
            const desc   = document.querySelector(".step-description");
            if (nodeEl) nodeEl.setAttribute("fill", step.color);
            if (desc)   desc.innerHTML = step.msg;

            Object.entries(step.dists).forEach(([k, v]) => {
                const el = document.getElementById(`ddist-${k}`);
                if (el) { el.textContent = v; el.setAttribute("fill", "#f59e0b"); }
            });

            if (i === steps.length - 1) schedule(finishStory, 700);
        }, i * 1400);
    });
}

/* ============================================================
   MERGE SORT — RENDER & ANIMATE
   FIX for Bug #6: was "Coming Soon" placeholder
============================================================ */

const mergeArr = [38, 27, 43, 3, 9, 82, 10];

function renderMergeSort() {
    simulationCanvas.innerHTML = `
        <div class="merge-container">

            <div class="merge-level" id="mlevel-0">
                ${mergeArr.map(n => `<div class="merge-box">${n}</div>`).join("")}
            </div>

            <div class="merge-arrow" id="marrow-1" style="opacity:0">▼ Divide</div>

            <div class="merge-level" id="mlevel-1" style="opacity:0">
                <div class="merge-box merge-half">38 &nbsp; 27 &nbsp; 43</div>
                <div class="merge-box merge-half">3 &nbsp; 9 &nbsp; 82 &nbsp; 10</div>
            </div>

            <div class="merge-arrow" id="marrow-2" style="opacity:0">▼ Sort & Merge</div>

            <div class="merge-level" id="mlevel-2" style="opacity:0">
                ${[3,9,10,27,38,43,82].map(n =>
                    `<div class="merge-box merge-sorted">${n}</div>`
                ).join("")}
            </div>

            <div class="step-description">
                Press <strong>Play</strong> to see Merge Sort.
            </div>
        </div>
    `;
}

function animateMergeSort() {
    setStatus("Running Merge Sort...");
    activateTimeline(2);
    renderMergeSort();

    const desc = () => document.querySelector(".step-description");
    const show  = (id, delay = 0) => schedule(() => {
        const el = document.getElementById(id);
        if (el) el.style.opacity = "1";
    }, delay);

    schedule(() => {
        if (desc()) desc().innerHTML = "Step 1 — Divide the array into two halves.";
        show("marrow-1");
        show("mlevel-1");
    }, 800);

    schedule(() => {
        if (desc()) desc().innerHTML = "Step 2 — Recursively sort each half.";
    }, 1900);

    schedule(() => {
        if (desc()) desc().innerHTML = "Step 3 — Merge both halves back in sorted order.";
        show("marrow-2");
        show("mlevel-2");
        document.querySelectorAll(".merge-sorted").forEach((box, i) => {
            setTimeout(() => {
                box.style.background = "#22c55e";
                box.style.transform  = "translateY(-6px)";
            }, i * 130);
        });
    }, 3000);

    schedule(finishStory, 4600);
}

/* ============================================================
   STACK — RENDER & ANIMATE
   FIX for Bug #6: was "Coming Soon" placeholder
============================================================ */

function renderStack() {
    simulationCanvas.innerHTML = `
        <div class="stack-container">
            <div class="stack-label">Stack — LIFO</div>
            <div class="stack" id="stackDisplay">
                <div class="stack-item" style="background:#8b5cf6">10 — Bottom</div>
                <div class="stack-item" style="background:#0ea5e9">20</div>
                <div class="stack-item" style="background:#06b6d4">30 — Top ↑</div>
            </div>
            <div class="step-description">
                Press <strong>Play</strong> to simulate push &amp; pop.
            </div>
        </div>
    `;
}

function animateStack() {
    setStatus("Running Stack...");
    activateTimeline(2);

    simulationCanvas.innerHTML = `
        <div class="stack-container">
            <div class="stack-label">Stack — LIFO (Last In, First Out)</div>
            <div class="stack" id="stackDisplay"></div>
            <div class="step-description">Stack is empty. Starting simulation.</div>
        </div>
    `;

    const getStack = () => document.getElementById("stackDisplay");
    const getDesc  = () => document.querySelector(".step-description");

    const pushItem = (label, color) => {
        const item = document.createElement("div");
        item.className        = "stack-item";
        item.style.background = color;
        item.textContent      = label;
        item.style.opacity    = "0";
        item.style.transform  = "translateY(20px)";
        getStack()?.appendChild(item);
        requestAnimationFrame(() => {
            item.style.transition = "all 0.4s ease";
            item.style.opacity    = "1";
            item.style.transform  = "translateY(0)";
        });
    };

    const popItem = () => {
        const s = getStack();
        if (!s?.lastChild) return;
        const last = s.lastChild;
        last.style.transition = "all 0.4s ease";
        last.style.opacity    = "0";
        last.style.transform  = "translateY(-20px)";
        setTimeout(() => last.remove(), 420);
    };

    const steps = [
        { fn: () => pushItem("10", "#8b5cf6"), msg: "push(10) — Add 10. Stack: [10]" },
        { fn: () => pushItem("20", "#0ea5e9"), msg: "push(20) — Add 20 on top. Stack: [10, 20]" },
        { fn: () => pushItem("30", "#06b6d4"), msg: "push(30) — Add 30. Stack: [10, 20, 30]" },
        { fn: () => {},                        msg: "top() → 30 — Peek at top without removing." },
        { fn: () => popItem(),                 msg: "pop() — Remove 30 (last in, first out). Stack: [10, 20]" },
        { fn: () => popItem(),                 msg: "pop() — Remove 20. Stack: [10]. ✅" }
    ];

    steps.forEach(({ fn, msg }, i) => {
        schedule(() => {
            fn();
            const d = getDesc();
            if (d) d.innerHTML = msg;
            if (i === steps.length - 1) schedule(finishStory, 800);
        }, i * 1100);
    });
}

/* ============================================================
   EVENT LISTENERS
============================================================ */

storyButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        switchAlgorithm(btn.dataset.algo);
    });
});

playBtn.addEventListener("click", () => {
    if (appState.isPlaying) return;
    appState.isPlaying = true;
    appState.isPaused  = false;
    timelineItems[1]?.classList.add("active");
    playCurrentAlgorithm();
});

/*
   FIX for Bug #1: was `pauseBtn.addEventListener(()=>{`
   Missing "click" event type → addEventListener requires a
   string as first argument. Without it, JS throws TypeError
   and the pause button never works.
*/
pauseBtn.addEventListener("click", () => {
    if (!appState.isPlaying) return;

    clearAnimations();

    if (appState.currentAlgorithm === "binary") {
        pauseBinaryAnimation();
    } else {
        setStatus("Paused");
    }

    appState.isPlaying = false;
    appState.isPaused  = true;
});

resetBtn.addEventListener("click", () => {
    clearAnimations();
    appState.isPlaying = false;
    appState.isPaused  = false;
    binaryRunning      = false;
    binaryAnimIndex    = 0;
    resetTimeline();
    setStatus("Ready");
    renderCurrentAlgorithm();
});

copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(codeBlock.textContent);
    copyBtn.classList.add("copied");
    copyBtn.innerHTML = `<i class="fas fa-check"></i> Copied`;
    setTimeout(() => {
        copyBtn.classList.remove("copied");
        copyBtn.innerHTML = `<i class="far fa-copy"></i> Copy`;
    }, 1500);
});

/* ============================================================
   INITIALIZE — single call
   FIX for Bug #5: previously both init() and initializePage()
   were called, causing double DOM manipulation on load.
============================================================ */

function initializePage() {
    progressFill.style.width = "0%";
    progressText.textContent = `0 / ${Object.keys(storyData).length} Completed`;
    updateStory();
    updateCode();
    updateActiveButton();
    resetTimeline();
    setStatus("Ready");
    renderCurrentAlgorithm();
}

initializePage();