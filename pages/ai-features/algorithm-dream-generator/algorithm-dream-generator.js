// ==========================================================================
// ALGORITHM DREAM GENERATOR - CORE ENGINE & STORIES
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  initDreamApp();
});

// App State
let currentAlgo = "dijkstra";
let currentRealm = "cyberpunk";
let protagonistName = "Dexter";
let currentStepIdx = 0;
let autoPlayActive = false;
let autoPlayTimer = null;
let autoPlaySpeed = 3000; // ms
let activeTab = "tab-state";

// ──────────────────────────────────────────────────────────────────────────
// 📚 DREAM STORIES DATABASE
// ──────────────────────────────────────────────────────────────────────────
const DREAM_DATABASE = {
  dijkstra: {
    title: "The Swift Postman",
    codeLang: "JavaScript",
    code: [
      "function dijkstra(graph, start) {",
      "  let dist = {}; let pq = new MinPriorityQueue();",
      "  for(let node in graph) dist[node] = Infinity;",
      "  dist[start] = 0; pq.insert(start, 0);",
      "  while (!pq.isEmpty()) {",
      "    let u = pq.extractMin();",
      "    for (let neighbor in graph[u]) {",
      "      let weight = graph[u][neighbor];",
      "      let alt = dist[u] + weight;",
      "      if (alt < dist[neighbor]) {",
      "        dist[neighbor] = alt;",
      "        pq.insert(neighbor, alt);",
      "      }",
      "    }",
      "  }",
      "  return dist;",
      "}"
    ],
    steps: [
      {
        narrative: "Our hero {name} stands at the central Post Office (A) ready to map shortest routes across the realm. Initially, the paths to all other landmarks are completely unknown and shrouded in mist, representing distance as <strong>Infinity (∞)</strong>. {name}'s magic logbook writes 0 for the start (A).",
        highlightedLines: [1, 2, 3],
        translation: "<strong>Initialization:</strong> Create a distance table mapping all nodes to <code>Infinity</code> and the start node to <code>0</code>. Insert start node into the Min-Priority Queue.",
        state: {
          "Priority Queue": "[(A, cost: 0)]",
          "Distances": "A: 0, B: ∞, C: ∞, D: ∞, E: ∞",
          "Current Node": "None",
          "Action": "Starting initialization"
        },
        visual: {
          activeNode: "A",
          visited: [],
          activeEdge: null,
          characterPos: "A",
          distances: { A: 0, B: "∞", C: "∞", D: "∞", E: "∞" }
        }
      },
      {
        narrative: "Looking at the magic letter mailbox (Priority Queue), the lowest cost item is Post Office A (cost 0). {name} picks Node A, enters the streets, and examines the immediately neighboring nodes B and C.",
        highlightedLines: [4, 5, 6, 7],
        translation: "<strong>Extract Min:</strong> Remove node with smallest tentative distance from Queue. Node <code>A</code> is chosen. Scan outgoing edges to unvisited neighbors <code>B</code> and <code>C</code>.",
        state: {
          "Priority Queue": "[]",
          "Distances": "A: 0, B: ∞, C: ∞, D: ∞, E: ∞",
          "Current Node": "A (Post Office)",
          "Action": "Extract node A, check neighbors B & C"
        },
        visual: {
          activeNode: "A",
          visited: ["A"],
          activeEdge: null,
          characterPos: "A",
          distances: { A: 0, B: "∞", C: "∞", D: "∞", E: "∞" }
        }
      },
      {
        narrative: "From Post Office A, {name} measures fuel to the Coffee Shop (B) is 4 units, and to the Greenhouse (C) is 2 units. Since 4 and 2 are lower than Infinity, {name} records these in the logbook and schedules deliveries for B and C in the priority queue.",
        highlightedLines: [8, 9, 10, 11, 12],
        translation: "<strong>Relaxing Edges:</strong> Calculate new distances: <code>dist[A] + edge(A->B) = 0 + 4 = 4</code>. Since <code>4 < ∞</code>, update <code>dist[B] = 4</code> and push to Priority Queue. Do same for <code>C</code> (0 + 2 = 2).",
        state: {
          "Priority Queue": "[(C, 2), (B, 4)]",
          "Distances": "A: 0, B: 4, C: 2, D: ∞, E: ∞",
          "Current Node": "A",
          "Action": "Relax A->B (4) and A->C (2)"
        },
        visual: {
          activeNode: "A",
          visited: ["A"],
          activeEdge: "AB_AC",
          characterPos: "A",
          distances: { A: 0, B: 4, C: 2, D: "∞", E: "∞" }
        }
      },
      {
        narrative: "Next, {name} pulls the cheapest destination from the mailbox: Greenhouse (C) with fuel cost 2. {name} travels to C, making it the current active node.",
        highlightedLines: [4, 5, 6],
        translation: "<strong>Extract Min:</strong> Next node in priority queue is <code>C</code> (distance 2). Set current node to <code>C</code>. It is now processed as visited.",
        state: {
          "Priority Queue": "[(B, 4)]",
          "Distances": "A: 0, B: 4, C: 2, D: ∞, E: ∞",
          "Current Node": "C (Greenhouse)",
          "Action": "Extract C, move character to C"
        },
        visual: {
          activeNode: "C",
          visited: ["A", "C"],
          activeEdge: null,
          characterPos: "C",
          distances: { A: 0, B: 4, C: 2, D: "∞", E: "∞" }
        }
      },
      {
        narrative: "{name} stands at Greenhouse C. Neighbors are Coffee Shop B (cost to travel C->B is 1) and Library D (cost C->D is 5). {name} calculates the total fuel to go start->C->B is <code>2 + 1 = 3</code>. This is CHEAPER than the previous path to B (4)! {name} updates B to 3. D is updated to $2 + 5 = 7$.",
        highlightedLines: [7, 8, 9, 10, 11, 12],
        translation: "<strong>Relaxing Edges:</strong> Compare <code>dist[C] + edge(C->B) = 2 + 1 = 3</code> against <code>dist[B] = 4</code>. Since <code>3 < 4</code>, we relax B to 3. Update <code>D</code> to <code>2 + 5 = 7</code>. Push updates.",
        state: {
          "Priority Queue": "[(B, 3), (D, 7)]",
          "Distances": "A: 0, B: 3, C: 2, D: 7, E: ∞",
          "Current Node": "C",
          "Action": "Relax C->B (updates B to 3) and C->D (sets D to 7)"
        },
        visual: {
          activeNode: "C",
          visited: ["A", "C"],
          activeEdge: "CB_CD",
          characterPos: "C",
          distances: { A: 0, B: 3, C: 2, D: 7, E: "∞" }
        }
      },
      {
        narrative: "Checking the mailbox again, the lowest entry is Coffee Shop B (cost 3). {name} speeds over to Coffee Shop B and checks the remaining path to Library D (cost B->D is 2).",
        highlightedLines: [4, 5, 6, 7],
        translation: "<strong>Extract Min:</strong> Choose <code>B</code> (dist 3) from queue. Mark <code>B</code> visited. Scan neighbor <code>D</code>.",
        state: {
          "Priority Queue": "[(D, 7)]",
          "Distances": "A: 0, B: 3, C: 2, D: 7, E: ∞",
          "Current Node": "B (Coffee Shop)",
          "Action": "Extract B, move character to B"
        },
        visual: {
          activeNode: "B",
          visited: ["A", "C", "B"],
          activeEdge: null,
          characterPos: "B",
          distances: { A: 0, B: 3, C: 2, D: 7, E: "∞" }
        }
      },
      {
        narrative: "Going through Coffee Shop B to Library D takes total fuel <code>3 + 2 = 5</code>. This is CHEAPER than going through Greenhouse C (which was 7). {name} updates the distance to Library D in the logbook to 5. B also connects to endpoint E with cost 6, so E is estimated at <code>3 + 6 = 9</code>.",
        highlightedLines: [8, 9, 10, 11, 12],
        translation: "<strong>Relaxing Edges:</strong> <code>dist[B] + edge(B->D) = 3 + 2 = 5 < 7</code>. Distance to <code>D</code> updates to <code>5</code>. Also <code>dist[B] + edge(B->E) = 3 + 6 = 9 < ∞</code>, set <code>E</code> to <code>9</code>.",
        state: {
          "Priority Queue": "[(D, 5), (E, 9)]",
          "Distances": "A: 0, B: 3, C: 2, D: 5, E: 9",
          "Current Node": "B",
          "Action": "Relax B->D (updates D to 5) and B->E (sets E to 9)"
        },
        visual: {
          activeNode: "B",
          visited: ["A", "C", "B"],
          activeEdge: "BD_BE",
          characterPos: "B",
          distances: { A: 0, B: 3, C: 2, D: 5, E: 9 }
        }
      },
      {
        narrative: "{name} extracts Library D (cost 5) and visits it. D's only neighbor is E with cost 1. Total fuel to go start->D->E is <code>5 + 1 = 6</code>. Since 6 is cheaper than E's previous estimate (9), {name} updates E's final route to 6!",
        highlightedLines: [4, 5, 6, 7, 8, 9, 10, 11, 12],
        translation: "<strong>Extract & Relax:</strong> Extract <code>D</code> (dist 5). Relax edge <code>D->E</code>: <code>dist[D] + 1 = 5 + 1 = 6 < 9</code>, update <code>E</code> to 6.",
        state: {
          "Priority Queue": "[(E, 6)]",
          "Distances": "A: 0, B: 3, C: 2, D: 5, E: 6",
          "Current Node": "D (Library)",
          "Action": "Extract D, relax D->E (updates E to 6)"
        },
        visual: {
          activeNode: "D",
          visited: ["A", "C", "B", "D"],
          activeEdge: "DE",
          characterPos: "D",
          distances: { A: 0, B: 3, C: 2, D: 5, E: 6 }
        }
      },
      {
        narrative: "Finally, E (cost 6) is extracted from the queue. All locations have been successfully visited, and the fuel cost in the logbook represents the absolute shortest route. {name} has completed the Dijkstra quest! 🏆",
        highlightedLines: [4, 5, 6, 15, 16],
        translation: "<strong>Completion:</strong> Priority queue is empty. Return the shortest distances dictionary. Dijkstra's search resolves.",
        state: {
          "Priority Queue": "[]",
          "Distances": "A: 0, B: 3, C: 2, D: 5, E: 6",
          "Current Node": "E (Endpoint)",
          "Action": "Extract E, queue empty, quest complete!"
        },
        visual: {
          activeNode: "E",
          visited: ["A", "C", "B", "D", "E"],
          activeEdge: null,
          characterPos: "E",
          distances: { A: 0, B: 3, C: 2, D: 5, E: 6 }
        }
      }
    ],
    quiz: [
      {
        q: "What does the 'Priority Queue' represent in Dijkstra's dream?",
        options: [
          "A sorted magic mailbox containing delivery tasks with fuel estimations.",
          "A stack of books stacked randomly in a warehouse.",
          "A set of pathways connecting different towns."
        ],
        correct: 0,
        explanation: "Correct! The Min-Priority Queue acts as the sorted magic mailbox containing unvisited landmarks arranged from cheapest fuel to most expensive."
      },
      {
        q: "What does updating a landmark's distance to a cheaper path represent in code?",
        options: [
          "Graph traversal depth increase",
          "Relaxing an edge (updating the distance estimation table)",
          "Removing a vertex from memory"
        ],
        correct: 1,
        explanation: "Correct! Checking if a path through the current node is cheaper and updating it is called 'relaxing' the edge."
      },
      {
        q: "Why does the algorithm stop?",
        options: [
          "When the protagonist runs out of health points.",
          "When the magic mailbox is empty, meaning all reachable landmarks have had their shortest paths calculated.",
          "After exactly three steps regardless of graph size."
        ],
        correct: 1,
        explanation: "Correct. Once the Priority Queue is empty, all shortest paths have been finalized."
      }
    ]
  },

  binary_search: {
    title: "The Whispering Library",
    codeLang: "Python",
    code: [
      "def binary_search(scrolls, target):",
      "    low = 0",
      "    high = len(scrolls) - 1",
      "    while low <= high:",
      "        mid = (low + high) // 2",
      "        val = scrolls[mid]",
      "        if val == target:",
      "            return mid",
      "        elif val < target:",
      "            low = mid + 1",
      "        else:",
      "            high = mid - 1",
      "    return -1"
    ],
    steps: [
      {
        narrative: "Our archivist {name} enters the Library of Whispering Scrolls. On the glowing wooden shelf are 8 scrolls sorted by magic frequency: <code>[12, 19, 24, 35, 42, 57, 68, 80]</code>. {name} is searching for the scroll of frequency <strong>42</strong>. Initially, {name} defines the search bounds as the entire shelf: from index <strong>low = 0</strong> to <strong>high = 7</strong>.",
        highlightedLines: [1, 2, 3],
        translation: "<strong>Initialization:</strong> Set the initial search range bounds. <code>low</code> begins at <code>0</code> and <code>high</code> begins at <code>len(scrolls) - 1</code> (index 7). Target is <code>42</code>.",
        state: {
          "Low Index": "0 (Scroll 12)",
          "High Index": "7 (Scroll 80)",
          "Mid Index": "None",
          "Current Search Range": "[12, 19, 24, 35, 42, 57, 68, 80]"
        },
        visual: {
          low: 0,
          high: 7,
          mid: null,
          target: 42,
          scrolls: [12, 19, 24, 35, 42, 57, 68, 80],
          dismissed: []
        }
      },
      {
        narrative: "Rather than scanning book-by-book (linear search, slow!), {name} casts a division spell. She finds the middle scroll on the shelf: <code>(low + high) / 2 = (0 + 7) / 2 = 3</code> (integer division). {name} pulls out Scroll 3, which has the frequency <strong>35</strong>.",
        highlightedLines: [4, 5, 6],
        translation: "<strong>Calculate Midpoint:</strong> Compute the middle index <code>mid = (0 + 7) // 2 = 3</code>. Fetch value at mid: <code>scrolls[3] = 35</code>.",
        state: {
          "Low Index": "0",
          "High Index": "7",
          "Mid Index": "3 (Scroll 35)",
          "Current Search Range": "[12, 19, 24, 35, 42, 57, 68, 80]"
        },
        visual: {
          low: 0,
          high: 7,
          mid: 3,
          target: 42,
          scrolls: [12, 19, 24, 35, 42, 57, 68, 80],
          dismissed: []
        }
      },
      {
        narrative: "{name} compares the mid scroll 35 with the target 42. Since 35 is SMALLER than 42, and the shelf is sorted, the target must lie to the right! {name} collapses and discards the left half of the shelf (indices 0 to 3), updating <strong>low = mid + 1 = 4</strong>.",
        highlightedLines: [7, 8, 9, 10],
        translation: "<strong>Compare & Adjust Low:</strong> Since <code>scrolls[mid] (35) < target (42)</code>, the target must be in the right half. Move <code>low</code> to <code>mid + 1 = 4</code>. Discard indices <code>0</code> through <code>3</code>.",
        state: {
          "Low Index": "4 (Scroll 42)",
          "High Index": "7 (Scroll 80)",
          "Mid Index": "3",
          "Current Search Range": "[42, 57, 68, 80]"
        },
        visual: {
          low: 4,
          high: 7,
          mid: 3,
          target: 42,
          scrolls: [12, 19, 24, 35, 42, 57, 68, 80],
          dismissed: [0, 1, 2, 3]
        }
      },
      {
        narrative: "With the active shelf narrowed down to indices 4 to 7, {name} casts the division spell again. The new midpoint is <code>(low + high) / 2 = (4 + 7) / 2 = 5</code>. She inspects Scroll 5, which reads <strong>57</strong>.",
        highlightedLines: [4, 5, 6],
        translation: "<strong>Recalculate Midpoint:</strong> Compute new midpoint <code>mid = (4 + 7) // 2 = 5</code>. Value at mid is <code>scrolls[5] = 57</code>.",
        state: {
          "Low Index": "4",
          "High Index": "7",
          "Mid Index": "5 (Scroll 57)",
          "Current Search Range": "[42, 57, 68, 80]"
        },
        visual: {
          low: 4,
          high: 7,
          mid: 5,
          target: 42,
          scrolls: [12, 19, 24, 35, 42, 57, 68, 80],
          dismissed: [0, 1, 2, 3]
        }
      },
      {
        narrative: "Comparing the mid scroll 57 with the target 42: 57 is GREATER than 42. Therefore, the target scroll must be to the left of the midpoint. {name} discards indices 5 to 7 by updating <strong>high = mid - 1 = 4</strong>.",
        highlightedLines: [7, 11, 12],
        translation: "<strong>Compare & Adjust High:</strong> Since <code>scrolls[mid] (57) > target (42)</code>, the target must be in the left half of the active range. Move <code>high</code> to <code>mid - 1 = 4</code>. Discard indices <code>5</code> through <code>7</code>.",
        state: {
          "Low Index": "4 (Scroll 42)",
          "High Index": "4 (Scroll 42)",
          "Mid Index": "5",
          "Current Search Range": "[42]"
        },
        visual: {
          low: 4,
          high: 4,
          mid: 5,
          target: 42,
          scrolls: [12, 19, 24, 35, 42, 57, 68, 80],
          dismissed: [0, 1, 2, 3, 5, 6, 7]
        }
      },
      {
        narrative: "Now, the bounds match: <code>low = 4, high = 4</code>. The search window has shrunk to a single scroll! The midpoint is <code>(4 + 4) / 2 = 4</code>. {name} draws Scroll 4: it reads exactly <strong>42</strong>! The whispering scroll is found at index 4! Ada's quest is complete. 🏆",
        highlightedLines: [4, 5, 6, 7, 8],
        translation: "<strong>Match Found:</strong> <code>mid = 4</code>, <code>scrolls[4] = 42</code>. Since <code>42 == target</code>, return index <code>4</code>.",
        state: {
          "Low Index": "4",
          "High Index": "4",
          "Mid Index": "4 (Scroll 42)",
          "Current Search Range": "[42]"
        },
        visual: {
          low: 4,
          high: 4,
          mid: 4,
          target: 42,
          scrolls: [12, 19, 24, 35, 42, 57, 68, 80],
          dismissed: [0, 1, 2, 3, 5, 6, 7]
        }
      }
    ],
    quiz: [
      {
        q: "What requirement must the wooden shelf satisfy for Binary Search to work?",
        options: [
          "The scrolls must be colored green.",
          "The scrolls must be sorted in monotonic order (e.g. increasing frequency).",
          "The shelf must contain at least 100 items."
        ],
        correct: 1,
        explanation: "Correct! Binary Search requires the search space to be monotonic (ordered) so that looking at the center element informs you which half to discard."
      },
      {
        q: "If the mid scroll is smaller than the target scroll, what boundary do we shift?",
        options: [
          "We move the 'low' boundary to mid + 1.",
          "We move the 'high' boundary to mid - 1.",
          "We reset both boundaries to 0."
        ],
        correct: 0,
        explanation: "Correct! If the middle value is smaller than the target, the target must lie to the right, so we shift the 'low' boundary to `mid + 1`."
      },
      {
        q: "What is the time complexity of Ada's scroll search?",
        options: [
          "O(n) - Linear scan",
          "O(log n) - Logarithmic time as the search space is cut in half each step",
          "O(n^2) - Quadratic time"
        ],
        correct: 1,
        explanation: "Correct! Cutting the search space in half at each iteration achieves O(log n) complexity."
      }
    ]
  },

  merge_sort: {
    title: "The Split-Merge Factory",
    codeLang: "JavaScript",
    code: [
      "function mergeSort(arr) {",
      "  if (arr.length <= 1) return arr;",
      "  let mid = Math.floor(arr.length / 2);",
      "  let left = mergeSort(arr.slice(0, mid));",
      "  let right = mergeSort(arr.slice(mid));",
      "  return merge(left, right);",
      "}",
      "function merge(left, right) {",
      "  let res = [];",
      "  while (left.length && right.length) {",
      "    if (left[0] < right[0]) res.push(left.shift());",
      "    else res.push(right.shift());",
      "  }",
      "  return [...res, ...left, ...right];",
      "}"
    ],
    steps: [
      {
        narrative: "Our toy-maker wizard {name} faces a chaotic stack of four magical toy blocks with values: <code>[28, 14, 43, 7]</code>. To sort them, {name} uses the **Divide and Conquer** spell, which starts by splitting the large problem into smaller halves.",
        highlightedLines: [1, 2, 3],
        translation: "<strong>Divide Phase (1):</strong> The array <code>[28, 14, 43, 7]</code> has length 4. Find midpoint <code>mid = 2</code> and split into left <code>[28, 14]</code> and right <code>[43, 7]</code> arrays.",
        state: {
          "Array Stage": "Initial Unsorted",
          "Data Structure": "[28, 14, 43, 7]",
          "Operation": "First Split"
        },
        visual: {
          stage: "split-1",
          activeParts: [0, 1, 2, 3],
          elements: {
            row1: [[28, 14, 43, 7]],
            row2: [],
            row3: []
          }
        }
      },
      {
        narrative: "{name} splits the blocks again. <code>[28, 14]</code> splits into <code>[28]</code> and <code>[14]</code>. <code>[43, 7]</code> splits into <code>[43]</code> and <code>[7]</code>. Now, all blocks stand alone. A single block is already sorted by definition (Base Case reached).",
        highlightedLines: [2, 4, 5],
        translation: "<strong>Divide Phase (2):</strong> Recursively split subarrays until length is 1. Left splits into <code>[28]</code>, <code>[14]</code>. Right splits into <code>[43]</code>, <code>[7]</code>.",
        state: {
          "Array Stage": "Divided to Base Cases",
          "Data Structure": "[28], [14], [43], [7]",
          "Operation": "Split to elements"
        },
        visual: {
          stage: "split-2",
          activeParts: [0, 1, 2, 3],
          elements: {
            row1: [[28, 14, 43, 7]],
            row2: [[28, 14], [43, 7]],
            row3: [[28], [14], [43], [7]]
          }
        }
      },
      {
        narrative: "Now, the **Conquer & Combine** phase begins! {name} compares the first two isolated blocks: 28 and 14. Since 14 is smaller, {name} merges them into a sorted pair: <code>[14, 28]</code>. At the same time, {name} merges 43 and 7 into <code>[7, 43]</code>.",
        highlightedLines: [6, 7, 8, 9, 10, 11, 12, 13, 14],
        translation: "<strong>Merge Phase (1):</strong> Combine single-element lists. Compare <code>28</code> and <code>14</code> -> <code>[14, 28]</code>. Compare <code>43</code> and <code>7</code> -> <code>[7, 43]</code>.",
        state: {
          "Array Stage": "Partial Merge",
          "Data Structure": "[14, 28] and [7, 43]",
          "Operation": "Merging pairs"
        },
        visual: {
          stage: "merge-1",
          activeParts: [0, 1, 2, 3],
          elements: {
            row1: [[28, 14, 43, 7]],
            row2: [[14, 28], [7, 43]],
            row3: [[28], [14], [43], [7]]
          }
        }
      },
      {
        narrative: "Finally, {name} merges the two sorted pairs: <code>[14, 28]</code> and <code>[7, 43]</code>. By comparing the smallest items at the front of each list (7 vs 14 -> push 7; then 14 vs 43 -> push 14; then 28 vs 43 -> push 28; then push 43), {name} forms the fully sorted list: <code>[7, 14, 28, 43]</code>! 🏆",
        highlightedLines: [6, 7, 8, 9, 10, 11, 12, 13, 14],
        translation: "<strong>Merge Phase (2):</strong> Merge two sorted subarrays: <code>[14, 28]</code> and <code>[7, 43]</code>. Use two pointers to compare heads and merge into final sorted array <code>[7, 14, 28, 43]</code>.",
        state: {
          "Array Stage": "Final Merged List",
          "Data Structure": "[7, 14, 28, 43]",
          "Operation": "Complete sorting"
        },
        visual: {
          stage: "merge-2",
          activeParts: [0, 1, 2, 3],
          elements: {
            row1: [[7, 14, 28, 43]],
            row2: [[14, 28], [7, 43]],
            row3: [[28], [14], [43], [7]]
          }
        }
      }
    ],
    quiz: [
      {
        q: "What design paradigm does Merge Sort use in the toy factory dream?",
        options: [
          "Greedy Selection",
          "Divide and Conquer (splitting arrays, sorting base cases, and merging them)",
          "Dynamic Programming with memoization"
        ],
        correct: 1,
        explanation: "Correct! Merge Sort recursively divides the collection, solves the base cases, and combines them (Divide & Conquer)."
      },
      {
        q: "What constitutes the 'Base Case' in Barnaby's splits?",
        options: [
          "When the array is reduced to single-element blocks, which are inherently sorted.",
          "When the array has 0 elements and throws an error.",
          "When all elements are negative."
        ],
        correct: 0,
        explanation: "Correct! A list containing exactly one item is already sorted, representing the base case where splitting stops."
      },
      {
        q: "What is the worst-case time complexity of Merge Sort?",
        options: [
          "O(N^2)",
          "O(N log N)",
          "O(N)"
        ],
        correct: 1,
        explanation: "Correct! Splitting takes O(log N) depth and merging at each level takes O(N) operations, totaling O(N log N) in all cases."
      }
    ]
  },

  knapsack_dp: {
    title: "The Backpack of Wonders",
    codeLang: "JavaScript",
    code: [
      "function knapsack(weights, values, capacity) {",
      "  let n = weights.length;",
      "  let dp = Array.from({length: n+1}, () => Array(capacity+1).fill(0));",
      "  for (let i = 1; i <= n; i++) {",
      "    for (let w = 0; w <= capacity; w++) {",
      "      if (weights[i-1] <= w) {",
      "        dp[i][w] = Math.max(",
      "          values[i-1] + dp[i-1][w - weights[i-1]],",
      "          dp[i-1][w]",
      "        );",
      "      } else {",
      "        dp[i][w] = dp[i-1][w];",
      "      }",
      "    }",
      "  }",
      "  return dp[n][capacity];",
      "}"
    ],
    steps: [
      {
        narrative: "Our explorer {name} finds three treasure artifacts: <ul><li>A: weight 2, value 3</li><li>B: weight 3, value 4</li><li>C: weight 4, value 5</li></ul>{name}'s Backpack has a capacity of <strong>5</strong>. To solve this, {name} uses a magic grid (Dynamic Programming matrix) of dimensions 4x6 (rows = items 0-3, cols = weight capacity 0-5) to store optimal decisions. Initial grid row/col 0 are filled with 0s.",
        highlightedLines: [1, 2, 3, 4, 5],
        translation: "<strong>Initialization:</strong> Create a DP grid of size <code>(N+1) x (W+1)</code>. Set all base values (row 0 and column 0) to <code>0</code>.",
        state: {
          "Backpack Capacity": "5",
          "Available Items": "A(wt:2, val:3), B(wt:3, val:4), C(wt:4, val:5)",
          "Current Item Checked": "None",
          "Grid State": "Initialized with 0s"
        },
        visual: {
          stage: "init",
          currentItemIdx: 0,
          highlightCells: [],
          grid: [
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0]
          ]
        }
      },
      {
        narrative: "{name} considers Item A (weight 2, value 3). For capacities 0 and 1, Item A cannot fit (weight 2 > capacity), so max value remains 0. For capacities 2 to 5, A fits! {name} updates these grid cells to value 3.",
        highlightedLines: [6, 7, 8, 9, 10, 11, 12, 13],
        translation: "<strong>Process Item 1 (A):</strong> Loop capacity <code>w</code> from 0 to 5. For <code>w < 2</code>, <code>dp[1][w] = dp[0][w] = 0</code>. For <code>w >= 2</code>, <code>dp[1][w] = max(3 + dp[0][w-2], dp[0][w]) = 3</code>.",
        state: {
          "Backpack Capacity": "5",
          "Available Items": "A, B, C",
          "Current Item Checked": "Item A (wt:2, val:3)",
          "Grid State": "Row 1 computed"
        },
        visual: {
          stage: "item-1",
          currentItemIdx: 1,
          highlightCells: ["1,2", "1,3", "1,4", "1,5"],
          grid: [
            [0, 0, 0, 0, 0, 0],
            [0, 0, 3, 3, 3, 3],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0]
          ]
        }
      },
      {
        narrative: "{name} considers Item B (weight 3, value 4). For capacity 3, B fits (value 4). For capacity 5, B fits (weight 3) and leaves weight 2. {name} recalls the memory from the previous row: 'For weight 2, I can pack A (value 3)'. Thus, total value is <code>4 + 3 = 7</code>! {name} writes 7 in cell (B, 5).",
        highlightedLines: [6, 7, 8, 9, 10],
        translation: "<strong>Process Item 2 (B):</strong> For capacity <code>w=5</code>, compare: packing <code>B</code> (value 4 + <code>dp[1][5-3]</code> which is 3) vs not packing <code>B</code> (<code>dp[1][5]</code> which is 3). Max is <code>7</code>. Row 2 updated.",
        state: {
          "Backpack Capacity": "5",
          "Available Items": "A, B, C",
          "Current Item Checked": "Item B (wt:3, val:4)",
          "Grid State": "Row 2 computed"
        },
        visual: {
          stage: "item-2",
          currentItemIdx: 2,
          highlightCells: ["2,3", "2,4", "2,5"],
          grid: [
            [0, 0, 0, 0, 0, 0],
            [0, 0, 3, 3, 3, 3],
            [0, 0, 3, 4, 4, 7],
            [0, 0, 0, 0, 0, 0]
          ]
        }
      },
      {
        narrative: "Finally, {name} considers Item C (weight 4, value 5). For capacity 5, packing C (value 5) leaves capacity 1 (which holds value 0). So value is 5. But keeping A and B yields 7! {name} keeps the past memory: 7. The bottom right cell shows the ultimate maximum value: <strong>7</strong>! 🏆",
        highlightedLines: [11, 12, 13, 14, 15, 16],
        translation: "<strong>Process Item 3 (C) & Complete:</strong> For capacity 5, packing <code>C</code> gives <code>5 + dp[2][1] = 5</code>. Not packing gives <code>dp[2][5] = 7</code>. Max is 7. Return <code>dp[3][5] = 7</code>.",
        state: {
          "Backpack Capacity": "5",
          "Available Items": "A, B, C",
          "Current Item Checked": "Item C (wt:4, val:5)",
          "Grid State": "Row 3 computed, final answer = 7"
        },
        visual: {
          stage: "item-3",
          currentItemIdx: 3,
          highlightCells: ["3,4", "3,5"],
          grid: [
            [0, 0, 0, 0, 0, 0],
            [0, 0, 3, 3, 3, 3],
            [0, 0, 3, 4, 4, 7],
            [0, 0, 3, 4, 5, 7]
          ]
        }
      }
    ],
    quiz: [
      {
        q: "What does the magic grid (matrix) represent in Zephyr's backpack quest?",
        options: [
          "A map of the landscape's mountains.",
          "A subproblem cache storing the optimal treasure values for smaller capacity limits and subset of items.",
          "A random sequence of keys."
        ],
        correct: 1,
        explanation: "Correct! The 2D grid caches optimal solutions to smaller capacities, avoiding recomputing."
      },
      {
        q: "When deciding whether to pack an item, what two choices does the algorithm compare?",
        options: [
          "Whether the item fits or not, regardless of its value.",
          "Taking the item (adding value + checking remaining capacity solution) vs leaving the item (keeping the previous row's optimal value).",
          "Adding all items vs throwing away the backpack."
        ],
        correct: 1,
        explanation: "Correct! The recurrence compares the value of including the item + remaining capacity solution against excluding the item."
      },
      {
        q: "Where is the final optimal solution found in the DP matrix?",
        options: [
          "At index [0][0] (top-left).",
          "At index [n][capacity] (bottom-right).",
          "In the column header labels."
        ],
        correct: 1,
        explanation: "Correct. The bottom-right cell represents the optimal solution for all items at maximum capacity."
      }
    ]
  }
};

// ──────────────────────────────────────────────────────────────────────────
// 🎨 REALM STYLING INFRASTRUCTURE
// ──────────────────────────────────────────────────────────────────────────
const REALM_DETAILS = {
  cyberpunk: {
    name: "Cyberpunk Metropolis",
    icon: "🏙️",
    class: "realm-cyberpunk",
    dijkstra_title: "The Swift Postman in Neon Metropolis",
    binary_search_title: "The Library of Whispering Neon Scrolls",
    merge_sort_title: "The Split-Merge Cyber Factory",
    knapsack_dp_title: "The Cyber-Backpack of Quantum Wonders"
  },
  fantasy: {
    name: "The Whispering Library",
    icon: "🧙‍♂️",
    class: "realm-fantasy",
    dijkstra_title: "Dexter's Post Courier in Magic Kingdoms",
    binary_search_title: "The Archive of Whispering Spells",
    merge_sort_title: "Barnaby's Toy-Sorting Sorcery",
    knapsack_dp_title: "The Wizard's Infinite Satchel"
  },
  undersea: {
    name: "Atlantis Trench",
    icon: "🧜‍♂️",
    class: "realm-undersea",
    dijkstra_title: "Sonar Delivery in Deep Atlantis",
    binary_search_title: "Retrieving Sonar Waves in Submarine Trench",
    merge_sort_title: "Sorting Coral Reef Crystals",
    knapsack_dp_title: "The Submarine Cargo optimizer"
  },
  space: {
    name: "Cosmic Void",
    icon: "🚀",
    class: "realm-space",
    dijkstra_title: "Warp Gate Mail Run in Nebula Sector",
    binary_search_title: "Warping to Asteroid Sector 42",
    merge_sort_title: "Sorting Star System Constellations",
    knapsack_dp_title: "Astronaut Cargo Payload Optimiser"
  }
};

// ──────────────────────────────────────────────────────────────────────────
// 🛠️ APPLICATION INITIALIZER
// ──────────────────────────────────────────────────────────────────────────
function initDreamApp() {
  // Elements
  const btnWeave = document.getElementById("btn-weave");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnPlayPause = document.getElementById("btn-play-pause");
  const btnWakeUp = document.getElementById("btn-wake-up");
  const speedSlider = document.getElementById("speed-slider");
  const speedDisplay = document.getElementById("speed-display");
  const selectAlgo = document.getElementById("select-algo");
  const selectRealm = document.getElementById("select-realm");
  const inputProtagonist = document.getElementById("input-protagonist");
  const tabBtnState = document.getElementById("tab-btn-state");
  const tabBtnCode = document.getElementById("tab-btn-code");
  const btnCopyCode = document.getElementById("btn-copy-code");
  
  // Set initial protagonist based on algorithm
  selectAlgo.addEventListener("change", () => {
    const algo = selectAlgo.value;
    if (algo === "dijkstra") inputProtagonist.value = "Dexter";
    else if (algo === "binary_search") inputProtagonist.value = "Ada";
    else if (algo === "merge_sort") inputProtagonist.value = "Barnaby";
    else if (algo === "knapsack_dp") inputProtagonist.value = "Zephyr";
  });

  // Weave Button Click
  btnWeave.addEventListener("click", () => {
    currentAlgo = selectAlgo.value;
    currentRealm = selectRealm.value;
    protagonistName = inputProtagonist.value.trim() || "Hero";
    
    startREMSequence();
  });

  // Slide controls
  btnPrev.addEventListener("click", () => {
    stopAutoPlay();
    navigateStep(-1);
  });
  
  btnNext.addEventListener("click", () => {
    stopAutoPlay();
    navigateStep(1);
  });

  btnPlayPause.addEventListener("click", () => {
    if (autoPlayActive) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  });

  btnWakeUp.addEventListener("click", () => {
    wakeUpToConsole();
  });

  // Speed slider
  speedSlider.addEventListener("input", () => {
    autoPlaySpeed = parseInt(speedSlider.value);
    speedDisplay.textContent = (autoPlaySpeed / 1000).toFixed(1) + "s";
    if (autoPlayActive) {
      // Reset timer
      clearInterval(autoPlayTimer);
      autoPlayTimer = setInterval(() => {
        navigateStep(1);
      }, autoPlaySpeed);
    }
  });

  // Tab switching
  tabBtnState.addEventListener("click", () => switchTab("tab-state"));
  tabBtnCode.addEventListener("click", () => switchTab("tab-code"));

  // Copy code
  btnCopyCode.addEventListener("click", () => {
    const codeText = DREAM_DATABASE[currentAlgo].code.join("\n");
    navigator.clipboard.writeText(codeText).then(() => {
      btnCopyCode.textContent = "Copied!";
      setTimeout(() => { btnCopyCode.textContent = "Copy"; }, 2000);
    });
  });

  // Hide platform loading screen
  const s = document.getElementById("loading-screen");
  if (s) s.classList.add("hidden");
}

// ──────────────────────────────────────────────────────────────────────────
// 🌀 REM LOADING SCREEN SEQUENCE
// ──────────────────────────────────────────────────────────────────────────
function startREMSequence() {
  const consoleCard = document.getElementById("dream-weaver-console");
  const loaderCard = document.getElementById("rem-loader");
  const loaderStatus = document.getElementById("loader-status");
  const loaderSubtext = document.getElementById("loader-subtext");
  const fill = document.getElementById("rem-progress-fill");

  consoleCard.classList.add("hidden");
  loaderCard.classList.remove("hidden");
  fill.style.width = "0%";

  // Apply realm theme colors dynamically
  document.body.className = REALM_DETAILS[currentRealm].class;

  const logs = [
    { pct: 20, status: "Entering REM Phase 1...", sub: "Synchronizing brainwave patterns..." },
    { pct: 40, status: "Extracting Algorithm Structure...", sub: `Translating ${currentAlgo.toUpperCase()} semantic trees...` },
    { pct: 60, status: "Synthesizing Surreal Metaphors...", sub: `Creating thematic assets in ${REALM_DETAILS[currentRealm].name}...` },
    { pct: 85, status: "Weaving Dream Threads...", sub: `Establishing character bounds for ${protagonistName}...` },
    { pct: 100, status: "Dream Synthesized. Synchronizing vision.", sub: "Loading sleep projection..." }
  ];

  let currentLogIdx = 0;
  let progress = 0;

  const interval = setInterval(() => {
    progress += 2;
    fill.style.width = progress + "%";

    if (currentLogIdx < logs.length && progress >= logs[currentLogIdx].pct) {
      loaderStatus.textContent = logs[currentLogIdx].status;
      loaderSubtext.textContent = logs[currentLogIdx].sub;
      currentLogIdx++;
    }

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        loaderCard.classList.add("hidden");
        enterDreamChamber();
      }, 500);
    }
  }, 40);
}

// ──────────────────────────────────────────────────────────────────────────
// 🌌 ENTER THE DREAM CHAMBER (MAIN VIEW)
// ──────────────────────────────────────────────────────────────────────────
function enterDreamChamber() {
  const chamber = document.getElementById("dream-chamber");
  const activeBorder = document.querySelectorAll(".dream-card");
  
  chamber.classList.remove("hidden");
  
  // Highlight active realm borders
  activeBorder.forEach(card => card.classList.add("active-realm-border"));

  // Update Realm displays
  const realmInfo = REALM_DETAILS[currentRealm];
  document.getElementById("display-realm-icon").textContent = realmInfo.icon;
  document.getElementById("display-realm-name").textContent = realmInfo.name;

  // Set story heading based on algorithm & realm
  const algoTitleKey = `${currentAlgo}_title`;
  document.getElementById("dream-heading").textContent = realmInfo[algoTitleKey];

  // Initialize slides
  currentStepIdx = 0;
  renderStep();
}

function wakeUpToConsole() {
  stopAutoPlay();
  
  const consoleCard = document.getElementById("dream-weaver-console");
  const chamber = document.getElementById("dream-chamber");
  const quizSection = document.getElementById("dreamers-challenge");

  chamber.classList.add("hidden");
  quizSection.classList.add("hidden");
  consoleCard.classList.remove("hidden");

  // Remove border highlights
  document.querySelectorAll(".dream-card").forEach(card => card.classList.remove("active-realm-border"));
}

// ──────────────────────────────────────────────────────────────────────────
// 📖 STEP NAVIGATION & NARRATIVE RENDER
// ──────────────────────────────────────────────────────────────────────────
function navigateStep(dir) {
  const algoData = DREAM_DATABASE[currentAlgo];
  const nextIdx = currentStepIdx + dir;
  
  if (nextIdx >= 0 && nextIdx < algoData.steps.length) {
    currentStepIdx = nextIdx;
    renderStep();
  } else if (nextIdx === algoData.steps.length) {
    // End of steps, trigger quiz!
    stopAutoPlay();
    triggerDreamersChallenge();
  }
}

function renderStep() {
  const algoData = DREAM_DATABASE[currentAlgo];
  const step = algoData.steps[currentStepIdx];

  // Enable/disable buttons
  document.getElementById("btn-prev").disabled = (currentStepIdx === 0);
  
  const btnNext = document.getElementById("btn-next");
  if (currentStepIdx === algoData.steps.length - 1) {
    btnNext.innerHTML = `Challenge <i class="fas fa-brain"></i>`;
  } else {
    btnNext.innerHTML = `Next <i class="fas fa-chevron-right"></i>`;
  }

  // Update Page numbers
  document.getElementById("dream-steps-counter").textContent = `Page ${currentStepIdx + 1} / ${algoData.steps.length}`;

  // Update story text (with name interpolation)
  let narrativeInterpolated = step.narrative.replace(/{name}/g, protagonistName);
  document.getElementById("dream-story-text").innerHTML = narrativeInterpolated;

  // Update dictionary translation
  document.getElementById("dream-translation").innerHTML = step.translation;

  // Update Code Inspector Panel
  renderCodePanel(algoData.code, step.highlightedLines);

  // Update State Panel Variables
  renderStatePanel(step.state);

  // Render SVG Visualizer
  renderSVGVisualizer(step.visual);
}

// ──────────────────────────────────────────────────────────────────────────
// 💻 CODE & STATE PANELS
// ──────────────────────────────────────────────────────────────────────────
function renderCodePanel(codeLines, highlightLines) {
  const display = document.getElementById("code-lines-display");
  document.getElementById("code-lang-label").textContent = DREAM_DATABASE[currentAlgo].codeLang;

  display.innerHTML = "";
  codeLines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const isHighlighted = highlightLines.includes(lineNum);
    const lineSpan = document.createElement("span");
    lineSpan.className = `code-line ${isHighlighted ? "highlighted" : ""}`;
    
    // Add line number prefix
    const numSpan = document.createElement("span");
    numSpan.className = "text-muted mr-3 select-none";
    numSpan.style.display = "inline-block";
    numSpan.style.width = "24px";
    numSpan.textContent = lineNum;

    const contentSpan = document.createElement("span");
    contentSpan.textContent = line;

    lineSpan.appendChild(numSpan);
    lineSpan.appendChild(contentSpan);
    display.appendChild(lineSpan);
  });
}

function renderStatePanel(stateData) {
  const display = document.getElementById("state-vars-display");
  display.innerHTML = "";

  Object.entries(stateData).forEach(([key, val]) => {
    const card = document.createElement("div");
    card.className = "state-card";

    const title = document.createElement("div");
    title.className = "state-card-title";
    title.textContent = key;

    const value = document.createElement("div");
    value.className = "state-card-value";
    
    // Special class for highlights
    if (val !== "None" && val !== "Infinity" && val !== "[]") {
      value.classList.add("highlight");
    }
    value.textContent = val;

    card.appendChild(title);
    card.appendChild(value);
    display.appendChild(card);
  });
}

function switchTab(tabId) {
  activeTab = tabId;
  document.getElementById("tab-btn-state").classList.toggle("active", tabId === "tab-state");
  document.getElementById("tab-btn-code").classList.toggle("active", tabId === "tab-code");

  document.getElementById("tab-state").classList.toggle("hidden", tabId !== "tab-state");
  document.getElementById("tab-code").classList.toggle("hidden", tabId !== "tab-code");
}

// ──────────────────────────────────────────────────────────────────────────
// ⏱️ AUTO PLAY CONTROLLER
// ──────────────────────────────────────────────────────────────────────────
function startAutoPlay() {
  autoPlayActive = true;
  document.getElementById("btn-play-pause").innerHTML = `<i class="fas fa-pause"></i> Pause`;
  document.getElementById("btn-play-pause").classList.replace("btn-primary", "btn-secondary");

  autoPlayTimer = setInterval(() => {
    navigateStep(1);
  }, autoPlaySpeed);
}

function stopAutoPlay() {
  autoPlayActive = false;
  document.getElementById("btn-play-pause").innerHTML = `<i class="fas fa-play"></i> Auto Play`;
  document.getElementById("btn-play-pause").classList.replace("btn-secondary", "btn-primary");
  clearInterval(autoPlayTimer);
}

// ──────────────────────────────────────────────────────────────────────────
// 📐 SVG VISUALIZERS (DIJKSTRA, BS, MERGE, KNAPSACK)
// ──────────────────────────────────────────────────────────────────────────
function renderSVGVisualizer(visualData) {
  const svg = document.getElementById("svg-canvas");
  svg.innerHTML = "";
  
  if (currentAlgo === "dijkstra") {
    renderDijkstraSVG(svg, visualData);
  } else if (currentAlgo === "binary_search") {
    renderBinarySearchSVG(svg, visualData);
  } else if (currentAlgo === "merge_sort") {
    renderMergeSortSVG(svg, visualData);
  } else if (currentAlgo === "knapsack_dp") {
    renderKnapsackSVG(svg, visualData);
  }
}

// Dijkstra Graph Data
const DIJKSTRA_GRAPH = {
  nodes: {
    A: { x: 80, y: 190, label: "Post Office (A)" },
    B: { x: 260, y: 90, label: "Coffee Shop (B)" },
    C: { x: 260, y: 290, label: "Greenhouse (C)" },
    D: { x: 440, y: 190, label: "Library (D)" },
    E: { x: 580, y: 190, label: "Endpoint (E)" }
  },
  edges: [
    { from: "A", to: "B", weight: 4, id: "AB" },
    { from: "A", to: "C", weight: 2, id: "AC" },
    { from: "C", to: "B", weight: 1, id: "CB" },
    { from: "C", to: "D", weight: 5, id: "CD" },
    { from: "B", to: "D", weight: 2, id: "BD" },
    { from: "B", to: "E", weight: 6, id: "BE" },
    { from: "D", to: "E", weight: 1, id: "DE" }
  ]
};

function renderDijkstraSVG(svg, visual) {
  const graph = DIJKSTRA_GRAPH;
  document.getElementById("visualizer-status-badge").textContent = visual.characterPos === "E" ? "Finished" : `At Landmark ${visual.characterPos}`;

  // 1. Draw Edges
  graph.edges.forEach(edge => {
    const fromNode = graph.nodes[edge.from];
    const toNode = graph.nodes[edge.to];
    
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", fromNode.x);
    line.setAttribute("y1", fromNode.y);
    line.setAttribute("x2", toNode.x);
    line.setAttribute("y2", toNode.y);
    line.setAttribute("class", "svg-edge");

    // Check if edge is active or relaxed in this step
    if (visual.activeEdge) {
      if (visual.activeEdge === "AB_AC" && (edge.id === "AB" || edge.id === "AC")) {
        line.classList.add("active");
      } else if (visual.activeEdge === "CB_CD" && (edge.id === "CB" || edge.id === "CD")) {
        line.classList.add("active");
      } else if (visual.activeEdge === "BD_BE" && (edge.id === "BD" || edge.id === "BE")) {
        line.classList.add("active");
      } else if (visual.activeEdge === "DE" && edge.id === "DE") {
        line.classList.add("active");
      }
    }
    
    // Highlight shortest path edges already relaxed (visual aid)
    if (visual.visited.includes(edge.from) && visual.visited.includes(edge.to)) {
      line.classList.add("relaxed");
    }

    svg.appendChild(line);

    // Edge weight label
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", (fromNode.x + toNode.x) / 2);
    // Offset label slightly
    text.setAttribute("y", (fromNode.y + toNode.y) / 2 - 8);
    text.setAttribute("class", "svg-edge-label");
    text.textContent = edge.weight;
    svg.appendChild(text);
  });

  // 2. Draw Nodes
  Object.entries(graph.nodes).forEach(([key, val]) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "svg-node");
    if (visual.activeNode === key) g.classList.add("active");
    if (visual.visited.includes(key)) g.classList.add("visited");

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", val.x);
    circle.setAttribute("cy", val.y);
    circle.setAttribute("r", "25");
    circle.setAttribute("class", "svg-node-circle");
    
    // Nodes labels
    const textNode = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textNode.setAttribute("x", val.x);
    textNode.setAttribute("y", val.y + 5);
    textNode.setAttribute("class", "svg-node-text");
    textNode.textContent = key;

    // Tentative distance overlay
    const textDist = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textDist.setAttribute("x", val.x);
    textDist.setAttribute("y", val.y - 32);
    textDist.setAttribute("class", "svg-node-dist");
    textDist.textContent = `dist: ${visual.distances[key]}`;

    // Landmark Name label under node
    const textLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textLabel.setAttribute("x", val.x);
    textLabel.setAttribute("y", val.y + 42);
    textLabel.setAttribute("class", "svg-node-dist");
    textLabel.style.fontSize = "9px";
    textLabel.style.fill = "#71717a";
    textLabel.textContent = val.label.split(" (")[0];

    g.appendChild(circle);
    g.appendChild(textNode);
    g.appendChild(textDist);
    g.appendChild(textLabel);
    svg.appendChild(g);
  });

  // 3. Draw Character Avatar (The Postman)
  if (visual.characterPos) {
    const charNode = graph.nodes[visual.characterPos];
    const avatar = document.createElementNS("http://www.w3.org/2000/svg", "g");
    avatar.setAttribute("transform", `translate(${charNode.x}, ${charNode.y - 12})`);
    
    // Draw a small custom postman hat/flag or glowing star
    const star = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    star.setAttribute("points", "0,-12 4,-3 12,0 4,3 0,12 -4,3 -12,0 -4,-3");
    star.setAttribute("class", "svg-character");
    avatar.appendChild(star);
    svg.appendChild(avatar);
  }
}

function renderBinarySearchSVG(svg, visual) {
  document.getElementById("visualizer-status-badge").textContent = `Checking bounds [${visual.low} - ${visual.high}]`;
  const size = visual.scrolls.length;
  const startX = 50;
  const width = 64;
  const gap = 12;

  visual.scrolls.forEach((scrollVal, idx) => {
    const x = startX + idx * (width + gap);
    const y = 140;
    const height = 90;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y})`);
    
    // Determine scroll state style
    let fill = "rgba(255,255,255,0.03)";
    let stroke = "rgba(255,255,255,0.2)";
    let isMid = (visual.mid === idx);
    let isDismissed = visual.dismissed.includes(idx);

    if (isMid) {
      fill = "rgba(var(--realm-primary), 0.15)";
      stroke = "var(--realm-primary)";
      g.style.filter = "drop-shadow(0 0 8px var(--realm-primary))";
    } else if (isDismissed) {
      fill = "rgba(255,255,255,0.01)";
      stroke = "rgba(255,255,255,0.05)";
      g.style.opacity = "0.2";
    } else if (idx >= visual.low && idx <= visual.high) {
      stroke = "var(--realm-accent)";
      fill = "rgba(236, 72, 153, 0.05)";
    }

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("rx", "8");
    rect.style.fill = fill;
    rect.style.stroke = stroke;
    rect.style.strokeWidth = isMid ? "3" : "1.5";
    rect.style.transition = "all 0.5s ease";

    // Value inside scroll
    const textVal = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textVal.setAttribute("x", width / 2);
    textVal.setAttribute("y", height / 2 + 5);
    textVal.setAttribute("fill", isDismissed ? "#4b5563" : "#fff");
    textVal.setAttribute("font-family", "'Orbitron', sans-serif");
    textVal.setAttribute("font-size", "16px");
    textVal.setAttribute("font-weight", "bold");
    textVal.setAttribute("text-anchor", "middle");
    textVal.textContent = scrollVal;

    // Index label under scroll
    const textIdx = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textIdx.setAttribute("x", width / 2);
    textIdx.setAttribute("y", height + 20);
    textIdx.setAttribute("fill", "#71717a");
    textIdx.setAttribute("font-family", "'Fira Code', sans-serif");
    textIdx.setAttribute("font-size", "11px");
    textIdx.setAttribute("text-anchor", "middle");
    textIdx.textContent = `idx: ${idx}`;

    g.appendChild(rect);
    g.appendChild(textVal);
    g.appendChild(textIdx);
    svg.appendChild(g);

    // Draw high/low markers
    if (idx === visual.low && !isDismissed) {
      drawArrowIndicator(svg, x + width/2, y - 25, "LOW", "var(--realm-accent)");
    }
    if (idx === visual.high && !isDismissed && visual.low !== visual.high) {
      drawArrowIndicator(svg, x + width/2, y - 25, "HIGH", "var(--realm-accent)");
    }
    if (isMid) {
      drawArrowIndicator(svg, x + width/2, y + height + 40, "MID", "var(--realm-primary)");
    }
  });

  // Target Label
  const targetLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  targetLabel.setAttribute("x", 320);
  targetLabel.setAttribute("y", 50);
  targetLabel.setAttribute("fill", "#fff");
  targetLabel.setAttribute("font-family", "'Orbitron', sans-serif");
  targetLabel.setAttribute("font-size", "14px");
  targetLabel.setAttribute("text-anchor", "middle");
  targetLabel.innerHTML = `Searching for Target: <tspan fill="var(--realm-primary)" font-weight="bold">${visual.target}</tspan>`;
  svg.appendChild(targetLabel);
}

function drawArrowIndicator(svg, x, y, label, color) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${x}, ${y})`);

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("fill", color);
  text.setAttribute("font-family", "'Orbitron', sans-serif");
  text.setAttribute("font-size", "9px");
  text.setAttribute("font-weight", "bold");
  text.setAttribute("text-anchor", "middle");
  text.textContent = label;

  const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  if (label === "MID") {
    // Arrow pointing up
    arrow.setAttribute("points", "0,-12 -4,-4 4,-4");
    text.setAttribute("y", 15);
  } else {
    // Arrow pointing down
    arrow.setAttribute("points", "0,12 -4,4 4,4");
    text.setAttribute("y", -2);
  }
  arrow.style.fill = color;

  g.appendChild(text);
  g.appendChild(arrow);
  svg.appendChild(g);
}

function renderMergeSortSVG(svg, visual) {
  document.getElementById("visualizer-status-badge").textContent = `Phase: ${visual.stage.toUpperCase()}`;
  
  // Stages layout:
  // row 1: height 70 (Initial)
  // row 2: height 170 (Halves)
  // row 3: height 270 (Singles)
  
  const yCoords = {
    row1: 60,
    row2: 160,
    row3: 260
  };

  const blockWidth = 32;
  const blockHeight = 35;
  const borderMargin = 12;

  Object.entries(visual.elements).forEach(([rowKey, partitions]) => {
    const y = yCoords[rowKey];
    
    // We calculate total width of partitions to center them
    let totalRowWidth = 0;
    partitions.forEach(arr => {
      totalRowWidth += (arr.length * blockWidth) + 15; // Width of blocks + spacing
    });
    totalRowWidth -= 15;

    let currentX = (640 - totalRowWidth) / 2;

    partitions.forEach(arr => {
      const gPart = document.createElementNS("http://www.w3.org/2000/svg", "g");
      gPart.setAttribute("transform", `translate(${currentX}, ${y})`);
      
      // Draw outer wrapper for array segment
      const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bgRect.setAttribute("width", arr.length * blockWidth);
      bgRect.setAttribute("height", blockHeight);
      bgRect.setAttribute("rx", "4");
      bgRect.style.fill = "rgba(255,255,255,0.02)";
      bgRect.style.stroke = "rgba(255,255,255,0.08)";
      bgRect.style.strokeWidth = "1";
      gPart.appendChild(bgRect);

      arr.forEach((val, valIdx) => {
        const xOffset = valIdx * blockWidth;
        const gCell = document.createElementNS("http://www.w3.org/2000/svg", "g");
        gCell.setAttribute("transform", `translate(${xOffset}, 0)`);

        const cellRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        cellRect.setAttribute("width", blockWidth - 2);
        cellRect.setAttribute("height", blockHeight - 2);
        cellRect.setAttribute("x", "1");
        cellRect.setAttribute("y", "1");
        cellRect.setAttribute("rx", "3");

        // Highlight cells depending on the stage
        let active = false;
        if (visual.stage === "split-1" && rowKey === "row1") active = true;
        if (visual.stage === "split-2" && rowKey === "row2") active = true;
        if (visual.stage === "merge-1" && rowKey === "row3") active = true;
        if (visual.stage === "merge-2" && rowKey === "row2") active = true;

        cellRect.style.fill = active ? "rgba(var(--realm-primary), 0.15)" : "rgba(255, 255, 255, 0.04)";
        cellRect.style.stroke = active ? "var(--realm-primary)" : "rgba(255, 255, 255, 0.15)";
        cellRect.style.strokeWidth = active ? "2" : "1";

        const cellText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        cellText.setAttribute("x", blockWidth / 2);
        cellText.setAttribute("y", blockHeight / 2 + 4);
        cellText.setAttribute("font-family", "'Fira Code', sans-serif");
        cellText.setAttribute("font-size", "12px");
        cellText.setAttribute("fill", "#fff");
        cellText.setAttribute("text-anchor", "middle");
        cellText.textContent = val;

        gCell.appendChild(cellRect);
        gCell.appendChild(cellText);
        gPart.appendChild(gCell);
      });

      svg.appendChild(gPart);
      currentX += (arr.length * blockWidth) + 15;
    });
  });

  // Draw split/merge guide arrows
  if (visual.stage === "split-1") {
    drawGuideArrow(svg, 320, 100, "Split", "down");
  } else if (visual.stage === "split-2") {
    drawGuideArrow(svg, 220, 200, "Split", "down");
    drawGuideArrow(svg, 420, 200, "Split", "down");
  } else if (visual.stage === "merge-1") {
    drawGuideArrow(svg, 220, 250, "Merge", "up");
    drawGuideArrow(svg, 420, 250, "Merge", "up");
  } else if (visual.stage === "merge-2") {
    drawGuideArrow(svg, 320, 150, "Merge", "up");
  }
}

function drawGuideArrow(svg, x, y, label, direction) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${x}, ${y})`);

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  if (direction === "down") {
    path.setAttribute("d", "M 0 0 L 0 30 M -5 25 L 0 30 L 5 25");
  } else {
    path.setAttribute("d", "M 0 30 L 0 0 M -5 5 L 0 0 L 5 5");
  }
  path.style.stroke = "var(--realm-primary)";
  path.style.strokeWidth = "2";
  path.style.fill = "none";

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", "12");
  text.setAttribute("y", "18");
  text.setAttribute("font-family", "'Orbitron', sans-serif");
  text.setAttribute("font-size", "9px");
  text.setAttribute("fill", "var(--realm-primary)");
  text.textContent = label;

  g.appendChild(path);
  g.appendChild(text);
  svg.appendChild(g);
}

function renderKnapsackSVG(svg, visual) {
  document.getElementById("visualizer-status-badge").textContent = `Processed up to Item ${visual.currentItemIdx}`;
  
  const cellW = 55;
  const cellH = 38;
  const startX = 140;
  const startY = 80;

  // Items info:
  // Item 1: wt 2, val 3
  // Item 2: wt 3, val 4
  // Item 3: wt 4, val 5
  const itemLabels = ["Base (0)", "A (wt:2, v:3)", "B (wt:3, v:4)", "C (wt:4, v:5)"];

  // Render Grid Headers (Capacities 0-5)
  for (let w = 0; w <= 5; w++) {
    const headerText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    headerText.setAttribute("x", startX + w * cellW + cellW/2);
    headerText.setAttribute("y", startY - 12);
    headerText.setAttribute("fill", "var(--realm-primary)");
    headerText.setAttribute("font-family", "'Orbitron', sans-serif");
    headerText.setAttribute("font-size", "11px");
    headerText.setAttribute("font-weight", "bold");
    headerText.setAttribute("text-anchor", "middle");
    headerText.textContent = `cap:${w}`;
    svg.appendChild(headerText);
  }

  // Draw Grid Rows
  visual.grid.forEach((row, rIdx) => {
    const y = startY + rIdx * cellH;

    // Row Label (Item Name)
    const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    labelText.setAttribute("x", startX - 15);
    labelText.setAttribute("y", y + cellH/2 + 4);
    labelText.setAttribute("fill", rIdx === visual.currentItemIdx ? "#fff" : "#71717a");
    labelText.setAttribute("font-family", "'Poppins', sans-serif");
    labelText.setAttribute("font-size", "11px");
    labelText.setAttribute("text-anchor", "end");
    labelText.textContent = itemLabels[rIdx];
    svg.appendChild(labelText);

    row.forEach((val, cIdx) => {
      const x = startX + cIdx * cellW;

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", cellW - 2);
      rect.setAttribute("height", cellH - 2);
      rect.setAttribute("rx", "4");

      // Verify if cell is currently highlighted (the decision point)
      const coordStr = `${rIdx},${cIdx}`;
      const isHighlighted = visual.highlightCells.includes(coordStr);

      let fill = "rgba(255, 255, 255, 0.02)";
      let stroke = "rgba(255, 255, 255, 0.08)";
      if (isHighlighted) {
        fill = "rgba(var(--realm-primary), 0.15)";
        stroke = "var(--realm-primary)";
        rect.style.filter = "drop-shadow(0 0 4px var(--realm-primary))";
      } else if (rIdx === visual.currentItemIdx) {
        fill = "rgba(255, 255, 255, 0.05)";
        stroke = "rgba(255, 255, 255, 0.15)";
      }

      rect.style.fill = fill;
      rect.style.stroke = stroke;
      rect.style.strokeWidth = isHighlighted ? "2" : "1";

      const valText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      valText.setAttribute("x", x + cellW/2);
      valText.setAttribute("y", y + cellH/2 + 4);
      valText.setAttribute("fill", val > 0 ? "#fff" : "#4b5563");
      valText.setAttribute("font-family", "'Fira Code', sans-serif");
      valText.setAttribute("font-size", "13px");
      valText.setAttribute("font-weight", val > 0 ? "bold" : "normal");
      valText.setAttribute("text-anchor", "middle");
      valText.textContent = val;

      svg.appendChild(rect);
      svg.appendChild(valText);
    });
  });

  // Draw Legend description at the bottom
  const legendText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  legendText.setAttribute("x", 320);
  legendText.setAttribute("y", startY + 4 * cellH + 20);
  legendText.setAttribute("fill", "#a1a1aa");
  legendText.setAttribute("font-family", "'Poppins', sans-serif");
  legendText.setAttribute("font-size", "11px");
  legendText.setAttribute("text-anchor", "middle");
  legendText.textContent = "Highlight cells show decision calculations using previous items and remaining capacity.";
  svg.appendChild(legendText);
}

// ──────────────────────────────────────────────────────────────────────────
// 🧠 DREAMER'S CHALLENGE (QUIZ ENGINE)
// ──────────────────────────────────────────────────────────────────────────
let quizScore = 0;
let quizQuestionIdx = 0;
let answeredQuestion = false;

function triggerDreamersChallenge() {
  const chamber = document.getElementById("dream-chamber");
  const quizSection = document.getElementById("dreamers-challenge");
  const resultBox = document.getElementById("quiz-result-box");
  const container = document.getElementById("quiz-options-container");
  
  chamber.classList.add("hidden");
  quizSection.classList.remove("hidden");
  resultBox.classList.add("hidden");
  
  document.querySelector(".quiz-container").classList.remove("hidden");

  quizScore = 0;
  quizQuestionIdx = 0;
  
  loadQuizQuestion();
}

function loadQuizQuestion() {
  const algoData = DREAM_DATABASE[currentAlgo];
  const qData = algoData.quiz[quizQuestionIdx];
  answeredQuestion = false;

  // Counter & Progress
  document.getElementById("quiz-counter").textContent = `Question ${quizQuestionIdx + 1} / ${algoData.quiz.length}`;
  const progressPct = ((quizQuestionIdx + 1) / algoData.quiz.length) * 100;
  document.getElementById("quiz-progress-fill").style.width = `${progressPct}%`;

  // Question Text
  document.getElementById("quiz-question-text").textContent = qData.q;

  // Options
  const container = document.getElementById("quiz-options-container");
  container.innerHTML = "";
  
  qData.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.innerHTML = `<span class="option-letter font-bold mr-2">${String.fromCharCode(65 + idx)}.</span> ${opt}`;
    btn.addEventListener("click", () => handleQuizAnswer(idx, btn));
    container.appendChild(btn);
  });

  // Hide Feedback & Next
  document.getElementById("quiz-feedback-box").className = "quiz-feedback hidden";
  document.getElementById("btn-quiz-next").classList.add("hidden");
}

function handleQuizAnswer(selectedIdx, clickedBtn) {
  if (answeredQuestion) return;
  answeredQuestion = true;

  const algoData = DREAM_DATABASE[currentAlgo];
  const qData = algoData.quiz[quizQuestionIdx];
  const isCorrect = (selectedIdx === qData.correct);

  if (isCorrect) quizScore++;

  const optionBtns = document.querySelectorAll(".quiz-option-btn");
  optionBtns.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === qData.correct) {
      btn.classList.add("correct");
    } else if (idx === selectedIdx) {
      btn.classList.add("incorrect");
    }
  });

  // Feedback box
  const feedbackBox = document.getElementById("quiz-feedback-box");
  feedbackBox.className = `quiz-feedback ${isCorrect ? "correct" : "incorrect"}`;
  feedbackBox.innerHTML = `<strong>${isCorrect ? "✅ Splendid!" : "❌ Not quite."}</strong> ${qData.explanation}`;
  
  // Show Next Question button
  const btnNext = document.getElementById("btn-quiz-next");
  btnNext.classList.remove("hidden");
  if (quizQuestionIdx === algoData.quiz.length - 1) {
    btnNext.innerHTML = `Finish Quest <i class="fas fa-check-double"></i>`;
  } else {
    btnNext.innerHTML = `Next Question <i class="fas fa-chevron-right"></i>`;
  }
}

// Next button click listener
document.getElementById("btn-quiz-next").addEventListener("click", () => {
  const algoData = DREAM_DATABASE[currentAlgo];
  quizQuestionIdx++;
  
  if (quizQuestionIdx < algoData.quiz.length) {
    loadQuizQuestion();
  } else {
    showQuizResult();
  }
});

function showQuizResult() {
  document.querySelector(".quiz-container").classList.add("hidden");
  
  const resultBox = document.getElementById("quiz-result-box");
  resultBox.classList.remove("hidden");

  const algoData = DREAM_DATABASE[currentAlgo];
  const total = algoData.quiz.length;
  const accuracy = Math.round((quizScore / total) * 100);

  let grade = "Keep exploring, Dreamer!";
  let icon = "📚";
  if (accuracy === 100) {
    grade = "Absolute Algorithm Master! You've locked the conceptual mappings into your subconscious!";
    icon = "🏆";
  } else if (accuracy >= 66) {
    grade = "Well Done! Excellent intuitive understanding of the algorithm.";
    icon = "🔥";
  }

  resultBox.innerHTML = `
    <div class="result-icon" style="font-size: 4rem; margin-bottom: 1rem;">${icon}</div>
    <h3>Quest Complete!</h3>
    <div class="quiz-result-score">${quizScore} / ${total}</div>
    <p class="section-subtitle">${grade}</p>
    <div class="flex gap-4 justify-center mt-5" style="display: flex; gap: 1rem; justify-content: center;">
      <button class="btn btn-primary" id="btn-quiz-replay"><i class="fas fa-redo"></i> Replay Dream</button>
      <button class="btn btn-secondary" id="btn-quiz-exit"><i class="fas fa-power-off"></i> Wake Up</button>
    </div>
  `;

  document.getElementById("btn-quiz-replay").addEventListener("click", () => {
    document.getElementById("dreamers-challenge").classList.add("hidden");
    enterDreamChamber();
  });

  document.getElementById("btn-quiz-exit").addEventListener("click", () => {
    wakeUpToConsole();
  });
}
