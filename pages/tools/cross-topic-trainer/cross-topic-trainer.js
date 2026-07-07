window.addEventListener("load", () => {
  const loader = document.getElementById("loading-screen");

  if (loader) {
    loader.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const sourceTopic = document.getElementById("sourceTopic");
  const targetTopic = document.getElementById("targetTopic");
  const showConnectionBtn = document.getElementById("showConnectionBtn");

  const sharedConcept = document.getElementById("sharedConcept");
  const transferInsight = document.getElementById("transferInsight");
  const exampleProblems = document.getElementById("exampleProblems");

  // Safety check
  if (
    !sourceTopic ||
    !targetTopic ||
    !showConnectionBtn ||
    !sharedConcept ||
    !transferInsight ||
    !exampleProblems
  ) {
    console.error("Cross Topic Trainer: Required elements not found.");
    return;
  }

  const connections = {
  "recursion-dp": {
    shared: "Breaking problems into smaller subproblems.",
    insight: "DP optimizes recursion through memoization and tabulation.",
    examples: "Fibonacci, Climbing Stairs, Knapsack"
  },

  "trees-graphs": {
    shared: "Node-based data structures.",
    insight: "A tree is a special graph without cycles.",
    examples: "DFS, BFS, Level Order Traversal"
  },

  "sliding-twoPointers": {
    shared: "Efficient range processing.",
    insight: "Sliding Window is a specialized Two Pointer technique.",
    examples: "Longest Substring, Minimum Window Substring"
  },

  "bfs-dfs": {
    shared: "Traversal algorithms.",
    insight: "Both explore structures systematically but in different orders.",
    examples: "Number of Islands, Connected Components"
  },

  "stack-recursion": {
    shared: "LIFO execution flow.",
    insight: "Recursion internally uses the call stack.",
    examples: "Tower of Hanoi, DFS"
  },

  "recursion-trees": {
    shared: "Hierarchical problem decomposition.",
    insight: "Tree traversals are naturally implemented using recursion.",
    examples: "Preorder, Inorder, Postorder"
  },

  "recursion-graphs": {
    shared: "Depth-first exploration.",
    insight: "DFS on graphs is commonly implemented recursively.",
    examples: "Cycle Detection, Connected Components"
  },

  "trees-dp": {
    shared: "Subproblem optimization.",
    insight: "Tree DP solves problems by combining results from children.",
    examples: "Diameter of Tree, House Robber III"
  },

  "graphs-dp": {
    shared: "State transitions.",
    insight: "Many graph problems use DP over paths or DAGs.",
    examples: "Shortest Paths in DAG, DP on Graphs"
  },

  "stack-dfs": {
    shared: "Depth-first processing.",
    insight: "Iterative DFS uses an explicit stack.",
    examples: "Graph Traversal, Maze Solving"
  },

  "bfs-graphs": {
    shared: "Level-wise exploration.",
    insight: "BFS is one of the fundamental graph algorithms.",
    examples: "Shortest Path in Unweighted Graph"
  },

  "dfs-graphs": {
    shared: "Graph traversal.",
    insight: "DFS explores as deep as possible before backtracking.",
    examples: "Topological Sort, Cycle Detection"
  },

  "trees-bfs": {
    shared: "Level traversal.",
    insight: "Level Order Traversal is BFS on a tree.",
    examples: "Binary Tree Level Order Traversal"
  },

  "trees-dfs": {
    shared: "Depth exploration.",
    insight: "Tree traversals are DFS variants.",
    examples: "Preorder, Inorder, Postorder"
  },

  "stack-trees": {
    shared: "Traversal support.",
    insight: "Stacks help implement iterative tree traversals.",
    examples: "Iterative Inorder Traversal"
  }
};

  showConnectionBtn.addEventListener("click", () => {
    const source = sourceTopic.value;
    const target = targetTopic.value;

    // Debug logs
    void 0;
    void 0;

    if (!source || !target) {
      sharedConcept.textContent = "Please select both topics.";
      transferInsight.textContent =
        "Choose one source and one target topic.";
      exampleProblems.textContent = "-";
      return;
    }

    if (source === target) {
      sharedConcept.textContent =
        "Please select two different topics.";
      transferInsight.textContent =
        "A topic cannot be compared with itself.";
      exampleProblems.textContent = "-";
      return;
    }

    const key = `${source}-${target}`;
    const reverseKey = `${target}-${source}`;

    void 0;
    void 0;

    const data =
      connections[key] ||
      connections[reverseKey];

    void 0;

    if (!data) {
      sharedConcept.textContent =
        "No direct relationship available.";

      transferInsight.textContent =
        "Try another pair of topics.";

      exampleProblems.textContent = "-";

      return;
    }

    sharedConcept.textContent = data.shared;
    transferInsight.textContent = data.insight;
    exampleProblems.textContent = data.examples;
  });

  void 0;
});
