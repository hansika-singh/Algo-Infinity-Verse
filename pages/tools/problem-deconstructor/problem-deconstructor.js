document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------
  // LOADING SCREEN FIX (IMPORTANT)
  // -----------------------------
  const loader = document.getElementById("loading-screen");

  if (loader) {
    setTimeout(() => {
      loader.style.opacity = "0";
      loader.style.transition = "opacity 0.5s ease";

      setTimeout(() => {
        loader.style.display = "none";
      }, 500);
    }, 300);
  }

  // -----------------------------
  // ELEMENT REFERENCES
  // -----------------------------
  const analyzeBtn = document.getElementById("analyzeBtn");
  const problemInput = document.getElementById("problemInput");

  const patternType = document.getElementById("patternType");
  const subProblemsEl = document.getElementById("subProblems");
  const templateType = document.getElementById("templateType");
  const similarProblemsEl = document.getElementById("similarProblems");

  // Safety check
  if (
    !analyzeBtn ||
    !problemInput ||
    !patternType ||
    !subProblemsEl ||
    !templateType ||
    !similarProblemsEl
  ) {
    return;
  }

  // -----------------------------
  // ANALYZE BUTTON LOGIC
  // -----------------------------
  analyzeBtn.addEventListener("click", () => {
    const inputText = problemInput.value.trim();

    if (!inputText) {
      alert("Please enter a problem statement.");
      return;
    }

    const text = inputText.toLowerCase();

    let pattern = "General DSA";
    let subProblems = "Understand constraints and identify the core logic";
    let template = "Basic Problem Solving Template";
    let similar = "Two Sum";

    if (text.includes("substring")) {
      pattern = "Sliding Window";
      subProblems = "Maintain a window and track character frequency";
      template = "Sliding Window Template";
      similar = "Longest Substring Without Repeating Characters";

    } else if (text.includes("tree")) {
      pattern = "Tree Traversal";
      subProblems = "Visit nodes and process child relationships";
      template = "DFS/BFS Tree Template";
      similar = "Binary Tree Level Order Traversal";

    } else if (text.includes("graph")) {
      pattern = "Graph Algorithms";
      subProblems = "Model the graph and traverse connected nodes";
      template = "BFS/DFS Graph Template";
      similar = "Number of Islands";
    }

    // -----------------------------
    // OUTPUT UPDATE
    // -----------------------------
    patternType.textContent = pattern;
    subProblemsEl.textContent = subProblems;
    templateType.textContent = template;
    similarProblemsEl.textContent = similar;
  });
});
