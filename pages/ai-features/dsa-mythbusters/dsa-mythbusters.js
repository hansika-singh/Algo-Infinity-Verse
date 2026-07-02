// script.js handles: loading screen, navbar, dark mode, scroll top

document.addEventListener("DOMContentLoaded", () => {
  initMyths();
  initMythQuiz();
});

/* ─── Escape helper ─── */
function mbEscapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function mbShuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ─── Myth Data ─── */
const MB_MYTHS = [
  {
    id: 1,
    myth: "Binary Search only works on arrays",
    truth: "Binary Search works on any monotonic search space — not just arrays. It can be applied to answer spaces, rotated sorted arrays, real-valued functions, and custom data structures.",
    counterCode: `// Binary search on the ANSWER SPACE — no array!\nfunction minEatingSpeed(piles, h) {\n  let lo = 1, hi = Math.max(...piles);\n  while (lo < hi) {\n    const mid = Math.floor((lo + hi) / 2);\n    const hours = piles.reduce((s, p) => s + Math.ceil(p / mid), 0);\n    if (hours <= h) hi = mid;\n    else lo = mid + 1;\n  }\n  return lo;\n}\n// Search space is [1, max(piles)] — monotonically ordered.\n// No sorted array being searched at all.`,
    demoLabel: "Run Binary Search on Answer Space",
    demoFn: function() {
      const piles = [3, 6, 7, 11], h = 8;
      const lines = [];
      lines.push({ text: "piles = [3,6,7,11], h = 8", cls: "cyan" });
      lines.push({ text: "Search space: [1, 11] — NOT an array", cls: "yellow" });
      let lo = 1, hi = Math.max(...piles), steps = 0;
      while (lo < hi) {
        steps++;
        const mid = Math.floor((lo + hi) / 2);
        const hours = piles.reduce((s, p) => s + Math.ceil(p / mid), 0);
        if (hours <= h) { lines.push({ text: "Step " + steps + ": mid=" + mid + ", hours=" + hours + " <= " + h + " → hi=" + mid, cls: "green" }); hi = mid; }
        else { lines.push({ text: "Step " + steps + ": mid=" + mid + ", hours=" + hours + " > " + h + " → lo=" + (mid+1), cls: "red" }); lo = mid + 1; }
      }
      lines.push({ text: "Minimum speed = " + lo + " bananas/hour ✅", cls: "green" });
      return lines;
    }
  },
  {
    id: 2,
    myth: "Dynamic Programming means memorizing formulas",
    truth: "DP is about identifying overlapping subproblems and optimal substructure. There are no formulas to memorize. You derive the recurrence from the problem definition every time.",
    counterCode: `// No formula memorized — derived from the problem\nfunction numDecodings(s) {\n  if (!s || s[0] === '0') return 0;\n  const n = s.length;\n  const dp = new Array(n + 1).fill(0);\n  dp[0] = 1; dp[1] = 1;\n  for (let i = 2; i <= n; i++) {\n    const one = parseInt(s[i - 1]);\n    const two = parseInt(s.slice(i - 2, i));\n    if (one >= 1) dp[i] += dp[i - 1];\n    if (two >= 10 && two <= 26) dp[i] += dp[i - 2];\n  }\n  return dp[n];\n}\n// Recurrence DERIVED by asking:\n// "How can position i be reached?" — not memorized.`,
    demoLabel: "Trace DP Derivation Live",
    demoFn: function() {
      const s = "226";
      const lines = [];
      lines.push({ text: 'Input: "' + s + '" (A=1,B=2,...,Z=26)', cls: "cyan" });
      lines.push({ text: "Derive: dp[i] = ways to decode s[0..i-1]", cls: "yellow" });
      const n = s.length;
      const dp = new Array(n + 1).fill(0);
      dp[0] = 1; dp[1] = 1;
      lines.push({ text: "dp[0]=1 (base), dp[1]=1", cls: "purple" });
      for (let i = 2; i <= n; i++) {
        const one = parseInt(s[i - 1]);
        const two = parseInt(s.slice(i - 2, i));
        if (one >= 1) dp[i] += dp[i - 1];
        if (two >= 10 && two <= 26) dp[i] += dp[i - 2];
        lines.push({ text: "dp[" + i + "]=" + dp[i] + "  (one='" + s[i-1] + "', two='" + s.slice(i-2,i) + "')", cls: "green" });
      }
      lines.push({ text: 'Total ways to decode "' + s + '" = ' + dp[n] + " ✅", cls: "green" });
      lines.push({ text: "(BB, BZ, VF — three valid decodings)", cls: "cyan" });
      return lines;
    }
  },
  {
    id: 3,
    myth: "Recursion is always slow",
    truth: "Recursion is only slow when it recomputes subproblems (naive recursion without memoization). With memoization, recursive solutions can be just as fast as iterative ones.",
    counterCode: `// Naive — O(2^n)\nfunction fibSlow(n) {\n  if (n <= 1) return n;\n  return fibSlow(n-1) + fibSlow(n-2);\n}\n\n// Memoized — O(n), same as iterative\nfunction fibFast(n, memo = {}) {\n  if (n in memo) return memo[n];\n  if (n <= 1) return n;\n  memo[n] = fibFast(n-1, memo) + fibFast(n-2, memo);\n  return memo[n];\n}\n// The issue is RECOMPUTATION, not recursion itself.`,
    demoLabel: "Compare Naive vs Memoized Calls",
    demoFn: function() {
      const lines = [];
      let slowCalls = 0;
      function fibSlow(n) { slowCalls++; if (n <= 1) return n; return fibSlow(n-1) + fibSlow(n-2); }
      let fastCalls = 0;
      function fibFast(n, memo) { fastCalls++; if (!memo) memo = {}; if (n in memo) return memo[n]; if (n <= 1) return n; memo[n] = fibFast(n-1, memo) + fibFast(n-2, memo); return memo[n]; }
      const n = 20;
      fibSlow(n); fibFast(n);
      lines.push({ text: "fib(" + n + ") naive recursion:", cls: "cyan" });
      lines.push({ text: "  Function calls: " + slowCalls.toLocaleString() + " 🔴", cls: "red" });
      lines.push({ text: "  Complexity: O(2^n)", cls: "red" });
      lines.push({ text: "", cls: "" });
      lines.push({ text: "fib(" + n + ") memoized recursion:", cls: "cyan" });
      lines.push({ text: "  Function calls: " + fastCalls + " 🟢", cls: "green" });
      lines.push({ text: "  Complexity: O(n) — each n computed once", cls: "green" });
      lines.push({ text: "", cls: "" });
      lines.push({ text: "Speedup: " + Math.round(slowCalls / fastCalls) + "x faster with memoization ✅", cls: "yellow" });
      return lines;
    }
  },
  {
    id: 4,
    myth: "HashMaps are always O(1)",
    truth: "HashMaps have O(1) average case but O(n) worst case due to hash collisions. With poor hash functions or adversarial inputs, all keys can map to the same bucket.",
    counterCode: `// Average case: O(1) — different buckets\nconst map = new Map();\nmap.set('alice', 1); // → bucket A\nmap.set('bob', 2);   // → bucket B\n\n// Worst case: O(n) — all keys in one bucket\n// If hash(k) = 0 for all k:\n// bucket 0: alice → bob → charlie → ... (chain)\n// Lookup = scan entire chain = O(n)\n\n// Real attack: Java HashMap DoS — predictable\n// String.hashCode() let attackers craft inputs\n// causing O(n^2) request parsing in web servers.`,
    demoLabel: "Simulate Hash Collision",
    demoFn: function() {
      const lines = [];
      const keys = ["alpha","beta","gamma","delta","epsilon","zeta","eta","theta"];
      lines.push({ text: "Simulating 5-bucket HashMap with 8 keys:", cls: "cyan" });
      lines.push({ text: "", cls: "" });
      const goodHash = function(k) { let h = 0; for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) % 5; return h; };
      const badHash  = function(k) { return k.length % 5; };
      const good = Array.from({length:5}, function() { return []; });
      const bad  = Array.from({length:5}, function() { return []; });
      keys.forEach(function(k) { good[goodHash(k)].push(k); bad[badHash(k)].push(k); });
      lines.push({ text: "Good hash distribution:", cls: "green" });
      good.forEach(function(b, i) { lines.push({ text: "  Bucket " + i + ": [" + (b.join(", ") || "empty") + "]", cls: b.length > 2 ? "red" : "green" }); });
      lines.push({ text: "", cls: "" });
      lines.push({ text: "Bad hash (key.length % 5):", cls: "red" });
      bad.forEach(function(b, i) { lines.push({ text: "  Bucket " + i + ": [" + (b.join(", ") || "empty") + "]" + (b.length > 2 ? " <- O(n) chain!" : ""), cls: b.length > 2 ? "red" : "green" }); });
      const maxChain = Math.max.apply(null, bad.map(function(b) { return b.length; }));
      lines.push({ text: "", cls: "" });
      lines.push({ text: "Longest chain: " + maxChain + " — lookup = O(" + maxChain + "), not O(1) ✅", cls: "yellow" });
      return lines;
    }
  },
  {
    id: 5,
    myth: "BFS is always better than DFS",
    truth: "BFS and DFS solve different problems. BFS guarantees shortest path but uses O(w) memory. DFS uses O(h) memory and is better for cycle detection, topological sort, and exhaustive search.",
    counterCode: `// Neither is universally better!\n\n// DFS is BETTER for:\n// - Topological sort\n// - Cycle detection in directed graphs\n// - Finding ALL paths (backtracking)\n// - Memory when tree is wide but shallow\n\n// BFS is BETTER for:\n// - Shortest path in unweighted graphs\n// - Level-order traversal\n// - Memory when tree is narrow but deep\n\n// Complete binary tree, depth=10:\n// BFS memory: O(512) — entire last level in queue\n// DFS memory: O(10)  — just the path depth`,
    demoLabel: "Compare BFS vs DFS Memory",
    demoFn: function() {
      const lines = [];
      lines.push({ text: "Complete binary tree — memory comparison:", cls: "cyan" });
      lines.push({ text: "", cls: "" });
      [5, 10, 15].forEach(function(depth) {
        const nodes = Math.pow(2, depth) - 1;
        const lastLevel = Math.pow(2, depth - 1);
        lines.push({ text: "Depth=" + (depth-1) + ", Nodes=" + nodes.toLocaleString() + ":", cls: "yellow" });
        lines.push({ text: "  BFS max queue: " + lastLevel.toLocaleString() + " nodes" + (lastLevel > 100 ? " 🔴" : " 🟢"), cls: lastLevel > 100 ? "red" : "green" });
        lines.push({ text: "  DFS max stack: " + depth + " nodes 🟢", cls: "green" });
        lines.push({ text: "  Ratio: " + Math.round(lastLevel / depth) + "x more memory for BFS", cls: "cyan" });
        lines.push({ text: "", cls: "" });
      });
      lines.push({ text: "Choose based on problem — neither is always better ✅", cls: "green" });
      return lines;
    }
  }
];

/* ─── Quiz Data ─── */
const MB_QUIZ = [
  { q: "Binary search can be applied to a monotonic answer space, not just sorted arrays.", correct: 0, options: ["True — this is a standard technique", "False — binary search only works on sorted arrays"], explanation: "True! Binary search on answer space is common. The key requirement is monotonicity, not an array." },
  { q: "The worst-case time complexity of HashMap lookup is O(1).", correct: 1, options: ["True — HashMap is always O(1)", "False — worst case is O(n) due to hash collisions"], explanation: "False. HashMap has O(1) average but O(n) worst case when all keys collide into one bucket." },
  { q: "Memoizing a recursive Fibonacci changes its time complexity from O(2^n) to O(n).", correct: 0, options: ["True — each subproblem computed exactly once", "False — recursion is inherently exponential"], explanation: "True! With memoization, each of the n subproblems is computed exactly once." },
  { q: "DFS always uses more memory than BFS.", correct: 1, options: ["True — DFS has deeper recursion stacks", "False — DFS uses O(h), BFS uses O(w); wide trees favor DFS on memory"], explanation: "False! For a wide tree, BFS holds entire levels in the queue. DFS only needs the current path depth." },
  { q: "Dynamic Programming requires memorizing specific recurrence formulas.", correct: 1, options: ["True — each DP problem has a unique formula to recall", "False — the recurrence is derived from the problem structure"], explanation: "False. DP is a technique. You derive the recurrence from the problem every time — nothing to memorize." },
  { q: "Binary search on a rotated sorted array [4,5,6,1,2,3] is possible in O(log n).", correct: 0, options: ["True — check which half is sorted and adjust bounds", "False — array must be fully sorted for binary search"], explanation: "True! At least one half is always sorted. Check which half, then decide which side your target must be." },
  { q: "BFS guarantees shortest path in a weighted graph.", correct: 1, options: ["True — BFS always finds shortest path", "False — BFS only guarantees shortest path in unweighted graphs"], explanation: "False! BFS finds shortest path by edge count in unweighted graphs only. Use Dijkstra for weighted graphs." },
  { q: "A recursive function with tail-call optimization uses O(1) stack space.", correct: 0, options: ["True — TCO reuses the same stack frame", "False — all recursive functions use a growing call stack"], explanation: "True! Tail-call optimization rewrites the call as a jump, reusing the stack frame — O(1) stack space." },
  { q: "HashMaps with a good hash function guarantee O(1) lookup in all cases.", correct: 1, options: ["True — good hash = always O(1)", "False — even with a good hash, adversarial inputs can cause collisions"], explanation: "False. Even good hash functions can be targeted by adversarial inputs. O(1) is average, not worst case." },
  { q: "DFS is the correct choice for finding the shortest path in an unweighted maze.", correct: 1, options: ["True — DFS explores deep paths and finds exit fast", "False — BFS is correct; DFS may find a longer path first"], explanation: "False! DFS may find a long path first. BFS expands level by level and guarantees the shortest path." }
];

/* ─── Render Myths ─── */
function initMyths() {
  const grid = document.getElementById("mbMythsGrid");
  if (!grid) return;

  grid.innerHTML = MB_MYTHS.map(function(myth) {
    return '<div class="mb-myth-card" id="myth-' + myth.id + '">' +
      '<div class="mb-myth-header" tabindex="0" role="button" aria-expanded="false" aria-controls="myth-body-' + myth.id + '">' +
        '<span class="mb-myth-num">0' + myth.id + '</span>' +
        '<div class="mb-myth-title-wrap">' +
          '<div class="mb-myth-label"><i class="fas fa-times-circle"></i> Myth</div>' +
          '<div class="mb-myth-heading">' + mbEscapeHtml(myth.myth) + '</div>' +
        '</div>' +
        '<i class="fas fa-chevron-down mb-myth-chevron"></i>' +
      '</div>' +
      '<div class="mb-myth-body" id="myth-body-' + myth.id + '">' +
        '<div class="mb-truth-panel">' +
          '<span class="mb-truth-icon">✅</span>' +
          '<div class="mb-truth-content">' +
            '<h4>The Truth</h4>' +
            '<p>' + mbEscapeHtml(myth.truth) + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="mb-counter-title"><i class="fas fa-code"></i> Counterexample</div>' +
        '<div class="js-code-block">' +
          '<div class="js-code-header">' +
            '<span class="js-code-lang">JavaScript</span>' +
            '<button class="js-code-copy" aria-label="Copy code" data-code="' + encodeURIComponent(myth.counterCode) + '">Copy</button>' +
          '</div>' +
          '<pre><code>' + mbEscapeHtml(myth.counterCode) + '</code></pre>' +
        '</div>' +
        '<div class="mb-demo">' +
          '<div class="mb-demo-title"><i class="fas fa-flask"></i> Interactive Demo</div>' +
          '<div class="mb-demo-controls">' +
            '<button class="mb-demo-btn mb-demo-run" data-myth="' + myth.id + '" aria-label="Run demo"><i class="fas fa-play"></i> ' + mbEscapeHtml(myth.demoLabel) + '</button>' +
            '<button class="mb-demo-btn mb-demo-clear" data-myth="' + myth.id + '" aria-label="Clear output"><i class="fas fa-trash"></i> Clear</button>' +
          '</div>' +
          '<div class="mb-demo-output" id="demo-output-' + myth.id + '">Click the button to run the demo...</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join("");

  /* Accordion */
  grid.querySelectorAll(".mb-myth-header").forEach(function(header) {
    var card = header.closest(".mb-myth-card");
    function toggleCard() {
      var isOpen = card.classList.toggle("open");
      header.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }
    header.addEventListener("click", toggleCard);
    header.addEventListener("keydown", function(e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleCard(); }
    });
  });

  /* Run demos */
  grid.querySelectorAll(".mb-demo-run").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var id = parseInt(btn.getAttribute("data-myth"));
      var myth = null;
      for (var i = 0; i < MB_MYTHS.length; i++) { if (MB_MYTHS[i].id === id) { myth = MB_MYTHS[i]; break; } }
      if (!myth) return;
      var output = document.getElementById("demo-output-" + id);
      if (!output) return;
      var lines = myth.demoFn();
      output.innerHTML = lines.map(function(l) {
        return '<span class="mb-output-line ' + (l.cls || "") + '">' + mbEscapeHtml(l.text) + '</span>';
      }).join("\n");
    });
  });

  /* Clear demos */
  grid.querySelectorAll(".mb-demo-clear").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var id = parseInt(btn.getAttribute("data-myth"));
      var output = document.getElementById("demo-output-" + id);
      if (output) output.textContent = "Click the button to run the demo...";
    });
  });

  /* Copy buttons */
  grid.querySelectorAll(".js-code-copy").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var code = decodeURIComponent(btn.getAttribute("data-code") || "");
      var finish = function() {
        btn.textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(function() { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(finish).catch(finish);
      } else {
        var ta = document.createElement("textarea");
        ta.value = code;
        ta.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch(e) {}
        document.body.removeChild(ta);
        finish();
      }
    });
  });
}

/* ─── Quiz ─── */
function initMythQuiz() {
  var questionEl = document.getElementById("mbQuizQuestion");
  var optionsEl  = document.getElementById("mbQuizOptions");
  var feedbackEl = document.getElementById("mbQuizFeedback");
  var nextBtn    = document.getElementById("mbQuizNext");
  var counterEl  = document.getElementById("mbQuizCounter");
  var fillEl     = document.getElementById("mbQuizFill");
  var resultEl   = document.getElementById("mbQuizResult");
  var quizCard   = document.querySelector(".mb-quiz-card");

  if (!questionEl || !optionsEl || !feedbackEl || !nextBtn || !counterEl || !fillEl || !resultEl || !quizCard) return;

  var questions = mbShuffle(MB_QUIZ.slice());
  var idx = 0, score = 0, answered = false;

  function renderQuestion() {
    if (idx >= questions.length) { showResult(); return; }
    answered = false;
    var q = questions[idx];
    counterEl.textContent = "Question " + (idx + 1) + " / " + questions.length;
    fillEl.style.width = Math.round(((idx + 1) / questions.length) * 100) + "%";
    questionEl.textContent = q.q;

    optionsEl.innerHTML = q.options.map(function(opt, i) {
      return '<button class="mb-quiz-option" data-idx="' + i + '" aria-label="Option ' + String.fromCharCode(65 + i) + '">' +
        '<span>' + String.fromCharCode(65 + i) + '.</span> ' + mbEscapeHtml(opt) +
      '</button>';
    }).join("");

    feedbackEl.className = "mb-quiz-feedback hidden";
    feedbackEl.textContent = "";
    nextBtn.classList.add("hidden");

    optionsEl.querySelectorAll(".mb-quiz-option").forEach(function(btn) {
      btn.addEventListener("click", function() {
        handleAnswer(parseInt(btn.getAttribute("data-idx")), q);
      });
    });
  }

  function handleAnswer(selected, q) {
    if (answered) return;
    answered = true;
    var isCorrect = selected === q.correct;
    if (isCorrect) score++;

    optionsEl.querySelectorAll(".mb-quiz-option").forEach(function(btn) {
      btn.disabled = true;
      var i = parseInt(btn.getAttribute("data-idx"));
      if (i === q.correct && isCorrect)  btn.classList.add("correct");
      if (i === selected  && !isCorrect) btn.classList.add("wrong");
      if (i === q.correct && !isCorrect) btn.classList.add("reveal");
    });

    feedbackEl.className = "mb-quiz-feedback " + (isCorrect ? "correct" : "wrong");
    feedbackEl.textContent = (isCorrect ? "✅ " : "❌ ") + q.explanation;
    nextBtn.classList.remove("hidden");
  }

  nextBtn.addEventListener("click", function() { idx++; renderQuestion(); });

  function showResult() {
    quizCard.classList.add("hidden");
    var pct = Math.round((score / questions.length) * 100);
    var grade = "📚 Keep Learning";
    if (pct >= 90)      grade = "🏆 Myth Master";
    else if (pct >= 70) grade = "🔥 Sharp Thinker";
    else if (pct >= 50) grade = "👍 Good Effort";

    resultEl.innerHTML =
      '<div class="mb-result-score">' + score + "/" + questions.length + '</div>' +
      '<div class="mb-result-label">' + grade + '</div>' +
      '<div class="mb-result-grid">' +
        '<div class="mb-result-stat"><span>' + pct + '%</span><label>Accuracy</label></div>' +
        '<div class="mb-result-stat"><span>' + score + '</span><label>Correct</label></div>' +
        '<div class="mb-result-stat"><span>' + (questions.length - score) + '</span><label>Wrong</label></div>' +
      '</div>' +
      '<button class="btn btn-primary mb-play-again" id="mbPlayAgain"><i class="fas fa-redo"></i> Try Again</button>';
    resultEl.classList.remove("hidden");

    var playAgain = document.getElementById("mbPlayAgain");
    if (playAgain) {
      playAgain.addEventListener("click", function() {
        idx = 0; score = 0; answered = false;
        questions = mbShuffle(MB_QUIZ.slice());
        resultEl.classList.add("hidden");
        quizCard.classList.remove("hidden");
        renderQuestion();
      });
    }
  }

  renderQuestion();
}