(() => {
  // ------------------ Helpers ------------------
  const qs = (sel) => document.querySelector(sel);

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function normalizeTextInput(s) {
    return String(s || '').trim();
  }

  // ------------------ Naive diagram data (compressed suffix-trie demo) ------------------
  // We will not build a full suffix trie with edge compression.
  // Instead, for educational visuals:
  // - create a root -> suffix paths in a trie-like manner
  // - compress chains of single-child nodes into edge labels
  // This is enough to demonstrate the concept interactively.

  function buildCompressedRepresentation(s) {
    // Trie nodes: { children: Map<char, node>, id }
    let nextId = 0;
    function newNode() {
      return { id: nextId++, children: new Map(), terminal: false };
    }

    const root = newNode();

    // Insert all suffixes
    for (let start = 0; start < s.length; start++) {
      let cur = root;
      for (let i = start; i < s.length; i++) {
        const ch = s[i];
        if (!cur.children.has(ch)) cur.children.set(ch, newNode());
        cur = cur.children.get(ch);
      }
      cur.terminal = true;
    }

    // Compress: build new structure where chains are merged.
    // Compressed nodes are subset of trie nodes: those with !=1 child or terminal or root.

    function isBranchNode(node) {
      const childCount = node.children.size;
      return node === root || node.terminal || childCount !== 1;
    }

    const compressedNodes = [];
    const compRoot = { id: root.id, node: root, children: new Map(), terminal: root.terminal };

    const visited = new Map();
    visited.set(root, compRoot);

    function getCompNode(trieNode) {
      if (visited.has(trieNode)) return visited.get(trieNode);
      const cn = {
        id: trieNode.id,
        node: trieNode,
        children: new Map(),
        terminal: trieNode.terminal,
      };
      visited.set(trieNode, cn);
      compressedNodes.push(cn);
      return cn;
    }

    // We'll do DFS from root compressing edges.
    function dfs(trieNode, compNode) {
      // For each outgoing child, walk until branch node.
      for (const [ch, child] of trieNode.children.entries()) {
        let label = ch;
        let cur = child;
        // Walk down while current is non-branch and has exactly 1 child and not terminal.
        while (!isBranchNode(cur)) {
          const onlyEntry = Array.from(cur.children.entries())[0];
          const [nextCh, nextNode] = onlyEntry;
          label += nextCh;
          cur = nextNode;
        }

        const targetComp = getCompNode(cur);
        compNode.children.set(label, targetComp);
        dfs(cur, targetComp);
      }
    }

    compressedNodes.push(compRoot);
    dfs(root, compRoot);

    // Prepare a list of edges with labels and a list of nodes.
    // We'll use a simple layout by BFS depth.
    const edges = [];
    const nodes = [];

    // BFS for depth
    const depth = new Map();
    depth.set(compRoot, 0);
    const q = [compRoot];
    const seen = new Set([compRoot]);

    while (q.length) {
      const n = q.shift();
      nodes.push(n);
      for (const [label, target] of n.children.entries()) {
        edges.push({ from: n, to: target, label });
        if (!seen.has(target)) {
          seen.add(target);
          depth.set(target, (depth.get(n) || 0) + 1);
          q.push(target);
        }
      }
    }

    // Layout: group by depth
    const groups = new Map();
    for (const n of nodes) {
      const d = depth.get(n) || 0;
      if (!groups.has(d)) groups.set(d, []);
      groups.get(d).push(n);
    }

    const sortedDepths = Array.from(groups.keys()).sort((a, b) => a - b);
    const maxDepth = sortedDepths[sortedDepths.length - 1] || 0;

    const W = 900;
    const H = 520;
    const padX = 60;
    const padY = 60;

    const xStep = maxDepth === 0 ? 0 : (W - padX * 2) / maxDepth;

    const positions = new Map();

    sortedDepths.forEach((d) => {
      const arr = groups.get(d);
      const count = arr.length;
      const yStep = count === 1 ? 0 : (H - padY * 2) / (count - 1);
      arr.forEach((n, idx) => {
        const x = padX + d * xStep;
        const y = padY + idx * yStep;
        positions.set(n, { x, y });
      });
    });

    return {
      root: compRoot,
      nodes,
      edges,
      positions,
    };
  }

  function drawDiagram(svgEl, diagram, highlightStep) {
    svgEl.innerHTML = '';

    const { nodes, edges, positions } = diagram;
    if (!nodes || nodes.length === 0) return;

    // Determine how many edges to show based on highlightStep.
    const total = edges.length || 1;
    const maxVisible = clamp(highlightStep, 0, total);
    const visibleEdges = edges.slice(0, maxVisible);
    const visibleNodes = new Set();
    for (const e of visibleEdges) {
      visibleNodes.add(e.from);
      visibleNodes.add(e.to);
    }

    // Draw edges (with simple bezier)
    visibleEdges.forEach((e) => {
      const p1 = positions.get(e.from);
      const p2 = positions.get(e.to);
      if (!p1 || !p2) return;

      const dx = p2.x - p1.x;
      const c1x = p1.x + dx * 0.35;
      const c2x = p1.x + dx * 0.65;

      const path = `M ${p1.x} ${p1.y} C ${c1x} ${p1.y}, ${c2x} ${p2.y}, ${p2.x} ${p2.y}`;

      const stroke = 'rgba(124, 58, 237, 0.9)';
      const opacity = 0.95;

      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', path);
      pathEl.setAttribute('fill', 'none');
      pathEl.setAttribute('stroke', stroke);
      pathEl.setAttribute('stroke-width', '2.2');
      pathEl.setAttribute('opacity', opacity);
      svgEl.appendChild(pathEl);

      // Label at mid point
      const labelEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2 - 8;
      labelEl.setAttribute('x', mx);
      labelEl.setAttribute('y', my);
      labelEl.setAttribute('fill', 'rgba(167, 139, 250, 0.95)');
      labelEl.setAttribute('font-size', '12');
      labelEl.setAttribute('font-family', 'Fira Code, monospace');
      labelEl.setAttribute('text-anchor', 'middle');
      labelEl.textContent = e.label.length > 7 ? e.label.slice(0, 7) + '…' : e.label;
      svgEl.appendChild(labelEl);
    });

    // Draw nodes
    Array.from(visibleNodes).forEach((n) => {
      const p = positions.get(n);
      if (!p) return;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', p.x);
      circle.setAttribute('cy', p.y);
      circle.setAttribute('r', '20');
      circle.setAttribute('fill', 'rgba(6, 182, 212, 0.85)');
      circle.setAttribute('stroke', 'rgba(255,255,255,0.15)');
      circle.setAttribute('stroke-width', '2');
      svgEl.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', p.x);
      text.setAttribute('y', p.y + 5);
      text.setAttribute('fill', '#06121d');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-family', 'Fira Code, monospace');
      text.setAttribute('text-anchor', 'middle');
      text.textContent = n.terminal ? '★' : String(n.id).slice(0, 2);
      svgEl.appendChild(text);
    });

    // Root marker label
    const rootP = positions.get(diagram.root);
    if (rootP) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', rootP.x);
      label.setAttribute('y', rootP.y - 30);
      label.setAttribute('fill', 'rgba(34, 211, 238, 0.95)');
      label.setAttribute('font-size', '13');
      label.setAttribute('font-family', 'Fira Code, monospace');
      label.setAttribute('text-anchor', 'middle');
      label.textContent = 'root';
      svgEl.appendChild(label);
    }
  }

  // ------------------ Quiz ------------------
  function initQuizSection() {
    const container = document.getElementById('stlQuizContainer');
    if (!container) return;

    // Load shared quiz module dynamically (repo uses ES modules).
    // Some pages may rely on global window.initQuiz already; we handle both.

    const quiz = [
      {
        question: 'In a suffix tree, what do edge labels typically represent?',
        options: [
          'The full suffix strings stored explicitly',
          'Intervals into the original text',
          'Hashes of substrings only',
          'Only single characters',
        ],
        answer: 'Intervals into the original text',
        explanation:
          'Suffix trees compress tries by storing edge labels as references (typically intervals) into the text.',
      },
      {
        question: "What is the purpose of a suffix link in Ukkonen's algorithm?",
        options: [
          'To jump between related partial matches without restarting',
          'To guarantee lexicographic ordering',
          'To store occurrence positions only',
          'To detect palindromes',
        ],
        answer: 'To jump between related partial matches without restarting',
        explanation:
          'Suffix links connect internal nodes so the algorithm can transfer the work for multiple extensions efficiently.',
      },
      {
        question:
          "Which statement about complexity is correct for Ukkonen's suffix tree construction?",
        options: [
          'It is always O(n^2)',
          'It runs in linear time O(n) in the standard model',
          'It is O(n log n) but not linear',
          'It depends on the alphabet size and can be quadratic',
        ],
        answer: 'It runs in linear time O(n) in the standard model',
        explanation:
          "Ukkonen's algorithm achieves amortized O(n) construction time using active points and suffix links.",
      },
      {
        question: 'How does substring search generally work on a suffix tree?',
        options: [
          'By brute-force comparing every position',
          'By traversing edges following the pattern characters',
          'By sorting all suffixes first',
          'By dynamic programming over prefixes',
        ],
        answer: 'By traversing edges following the pattern characters',
        explanation:
          'A pattern corresponds to a path from the root; if traversal succeeds, the pattern occurs in the subtree.',
      },
    ];

    const durationSeconds = 45;

    const start = () => {
      const initQuiz = window.initQuiz;
      if (typeof initQuiz === 'function') {
        // initQuiz signature: initQuiz({ containerId, questions, duration })
        window.initQuiz({
          containerId: 'stlQuizContainer',
          questions: quiz,
          duration: durationSeconds,
        });
        return;
      }

      // If not available globally, try module import.
      import('/modules/quiz.js')
        .then((mod) => {
          if (mod?.initQuiz) {
            mod.initQuiz({
              containerId: 'stlQuizContainer',
              questions: quiz,
              duration: durationSeconds,
            });
          }
        })
        .catch(() => {
          container.innerHTML = `<div style="color:var(--text-secondary);padding:1rem;">Quiz module not available.</div>`;
        });
    };

    // Start immediately.
    start();
  }

  // ------------------ Init ------------------
  function init() {
    // Diagram controls
    const textInput = document.getElementById('stlTextInput');
    const genBtn = document.getElementById('stlGenerateBtn');
    const slider = document.getElementById('stlStepSlider');
    const stepBadge = document.getElementById('stlStepBadge');
    const backBtn = document.getElementById('stlStepBack');
    const fwdBtn = document.getElementById('stlStepForward');
    const explainer = document.getElementById('stlStepExplanation');
    const svg = document.getElementById('stlTreeSvg');

    let diagram = null;
    let stepCount = 0;
    let curStep = 0;

    function updateUI() {
      stepBadge.textContent = `Step ${curStep} / ${Math.max(0, stepCount)}`;
      backBtn.disabled = curStep <= 0;
      fwdBtn.disabled = curStep >= stepCount;
      drawDiagram(svg, diagram, curStep);

      if (curStep === 0)
        explainer.textContent = 'Generate a string to visualize how edges compress.';
      else explainer.textContent = 'Higher steps reveal more of the compressed edge structure.';
    }

    function generate() {
      const s = normalizeTextInput(textInput?.value);
      if (!s) {
        explainer.textContent = 'Enter a non-empty text to visualize.';
        svg.innerHTML = '';
        diagram = null;
        stepCount = 0;
        curStep = 0;
        updateUI();
        return;
      }

      diagram = buildCompressedRepresentation(s);
      stepCount = diagram.edges.length || 0;
      curStep = 0;

      slider.max = String(stepCount);
      slider.value = '0';

      explainer.textContent = 'Start stepping to reveal compressed edges.';
      updateUI();
    }

    if (genBtn) genBtn.addEventListener('click', generate);
    if (slider) {
      slider.addEventListener('input', (e) => {
        curStep = Number(e.target.value);
        updateUI();
      });
    }
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        curStep = clamp(curStep - 1, 0, stepCount);
        if (slider) slider.value = String(curStep);
        updateUI();
      });
    }
    if (fwdBtn) {
      fwdBtn.addEventListener('click', () => {
        curStep = clamp(curStep + 1, 0, stepCount);
        if (slider) slider.value = String(curStep);
        updateUI();
      });
    }

    // initial render (based on default value)
    generate();

    // Quiz
    initQuizSection();

    // Scroll helper
    document.querySelectorAll('[data-jump]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-jump');
        const el = qs(target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
