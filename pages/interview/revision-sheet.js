// revision-sheet.js
// This module builds a personalized interview revision sheet using existing data sources.
// It runs as an ES module and expects the global `dsaTopics` array (loaded from script.js) to be present.

import { getCompletedTopics, getUserProgress } from '../../modules/topics.js';

/** Utility: safely get a value from an object or fallback */
const safeGet = (obj, key, fallback) => (obj && key in obj ? obj[key] : fallback);

/** Mapping of common algorithms per topic (simplified) */
const COMMON_ALGORITHMS = {
  Arrays: ['Binary Search', 'Merge Sort', 'Two Pointer', 'Sliding Window', 'Kadane'],
  Strings: ['KMP', 'Rabin‑Karp', 'Two Pointer', 'Sliding Window'],
  "Linked List": ['Fast & Slow Pointer', 'Reverse List', 'Merge Two Sorted Lists'],
  Trees: ['Binary Search Tree', 'AVL Rotations', 'Tree Traversals', 'Lowest Common Ancestor', 'Heap'],
  Graphs: ['BFS', 'DFS', 'Dijkstra', 'Kruskal / Union‑Find', 'Topological Sort'],
  "Dynamic Programming": ['Knapsack', 'Longest Increasing Subsequence', 'Edit Distance', 'Fibonacci DP']
};

/** Build the entire revision sheet DOM */
function buildRevisionSheet() {
  const container = document.getElementById('revisionContent');
  if (!container) return;
  container.innerHTML = '';
  const userProgress = getUserProgress();
  const completed = getCompletedTopics();

  // Empty state handling
  if (completed.length === 0) {
    container.innerHTML = `<section class="revision-section empty-state" aria-live="polite">
      <h2>No completed topics yet</h2>
      <p>Complete some topics in the learning modules to generate a personalized revision sheet.</p>
    </section>`;
    return;
  }

  // ---- Section: Completed Topics ----
  const completedSection = document.createElement('section');
  completedSection.className = 'revision-section';
  completedSection.innerHTML = `<h2>✅ Completed Topics (${completed.length})</h2>`;
  const topicList = document.createElement('ul');
  completed.forEach(t => {
    const li = document.createElement('li');
    li.textContent = t.name;
    topicList.appendChild(li);
  });
  completedSection.appendChild(topicList);
  container.appendChild(completedSection);

  // ---- Section: Key Concepts & Theory ----
  const conceptsSection = document.createElement('section');
  conceptsSection.className = 'revision-section';
  conceptsSection.innerHTML = '<h2>🧠 Key Concepts & Theory</h2>';
  completed.forEach(topic => {
    const card = document.createElement('div');
    card.className = 'revision-card';
    // `topic.theory` already contains rich HTML (tables, lists, etc.)
    card.innerHTML = `<h3>${topic.name}</h3>${topic.theory}`;
    conceptsSection.appendChild(card);
  });
  container.appendChild(conceptsSection);

  // ---- Section: Important Algorithms ----
  const algoSection = document.createElement('section');
  algoSection.className = 'revision-section';
  algoSection.innerHTML = '<h2>🔧 Important Algorithms</h2>';
  completed.forEach(topic => {
    const algos = COMMON_ALGORITHMS[topic.name] || [];
    if (algos.length === 0) return;
    const card = document.createElement('div');
    card.className = 'revision-card';
    card.innerHTML = `<h3>${topic.name}</h3><ul>${algos.map(a => `<li>${a}</li>`).join('')}</ul>`;
    algoSection.appendChild(card);
  });
  container.appendChild(algoSection);

  // ---- Section: Complexity Summary ----
  const complexitySection = document.createElement('section');
  complexitySection.className = 'revision-section';
  complexitySection.innerHTML = '<h2>⏱️ Time & Space Complexity</h2>';
  completed.forEach(topic => {
    // Attempt to extract the first HTML table from `topic.theory` – it usually holds complexity.
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = topic.theory;
    const table = tempDiv.querySelector('table');
    const card = document.createElement('div');
    card.className = 'revision-card';
    card.innerHTML = `<h3>${topic.name}</h3>`;
    if (table) {
      card.appendChild(table.cloneNode(true));
    } else {
      card.innerHTML += '<p>Complexity table not available.</p>';
    }
    complexitySection.appendChild(card);
  });
  container.appendChild(complexitySection);

  // ---- Section: Common Mistakes & Patterns ----
  const mistakeSection = document.createElement('section');
  mistakeSection.className = 'revision-section';
  mistakeSection.innerHTML = '<h2>⚠️ Common Interview Mistakes & Patterns</h2>';
  completed.forEach(topic => {
    const card = document.createElement('div');
    card.className = 'revision-card';
    // Re‑use the "Must‑Know Interview Patterns" list from the theory if present.
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = topic.theory;
    const patternList = tempDiv.querySelector('ul'); // first ul often holds patterns.
    card.innerHTML = `<h3>${topic.name}</h3>`;
    if (patternList) {
      card.appendChild(patternList.cloneNode(true));
    } else {
      card.innerHTML += '<p>No pattern list detected.</p>';
    }
    mistakeSection.appendChild(card);
  });
  container.appendChild(mistakeSection);

  // ---- Section: Frequently Asked Interview Questions ----
  const faqSection = document.createElement('section');
  faqSection.className = 'revision-section';
  faqSection.innerHTML = '<h2>❓ Frequently Asked Interview Questions</h2>';
  // Pull from practiceProblems that belong to each completed topic.
  const allProblems = safeGet(window, 'practiceProblems', []);
  completed.forEach(topic => {
    const related = allProblems.filter(p => p.tags && p.tags.includes(topic.name.toLowerCase()));
    if (related.length === 0) return;
    const card = document.createElement('div');
    card.className = 'revision-card';
    card.innerHTML = `<h3>${topic.name}</h3><ul>${related.slice(0, 5).map(p => `<li>${p.title}</li>`).join('')}</ul>`;
    faqSection.appendChild(card);
  });
  container.appendChild(faqSection);

  // ---- Section: Revision Status Overview ----
  const statusSection = document.createElement('section');
  statusSection.className = 'revision-section';
  statusSection.innerHTML = '<h2>📊 Revision Status</h2>';
  const totalTopics = safeGet(window, 'dsaTopics', []).length;
  const pendingCount = totalTopics - completed.length;
  // Determine strongest / weakest based on quizScores (0‑100). Missing scores default to 0.
  const scores = safeGet(userProgress, 'quizScores', {});
  const scoredTopics = Object.entries(scores).map(([id, val]) => ({ id: Number(id), score: val }));
  const strongest = scoredTopics.reduce((a, b) => (b.score > a.score ? b : a), { id: null, score: -1 });
  const weakest = scoredTopics.reduce((a, b) => (b.score < a.score ? b : a), { id: null, score: 101 });
  const getName = id => {
    const t = (window.dsaTopics || []).find(t => t.id === id);
    return t ? t.name : 'Unknown';
  };
  statusSection.innerHTML += `<p>Topics revised: ${completed.length}</p>`;
  statusSection.innerHTML += `<p>Topics pending: ${pendingCount}</p>`;
  statusSection.innerHTML += `<p>Recommended next revision: ${pendingCount > 0 ? (window.dsaTopics.find(t => !(completed.map(c=>c.id).includes(t.id)))?.name || 'N/A') : 'All done! 🎉'}</p>`;
  statusSection.innerHTML += `<p>Strongest topic: ${strongest.id ? getName(strongest.id) + ' (' + strongest.score + '%)' : 'N/A'}</p>`;
  statusSection.innerHTML += `<p>Weakest topic: ${weakest.id ? getName(weakest.id) + ' (' + weakest.score + '%)' : 'N/A'}</p>`;
  container.appendChild(statusSection);
}

/** Export / Download helpers */
function downloadTXT(content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `revision-sheet-${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function generatePlainText() {
  const lines = [];
  const userProgress = getUserProgress();
  const completed = getCompletedTopics();

  lines.push('Personalized Interview Revision Sheet');
  lines.push('Generated on ' + new Date().toLocaleString());
  lines.push('');
  lines.push('Completed Topics:');
  completed.forEach(t => lines.push('- ' + t.name));
  lines.push('');
  lines.push('Important Algorithms per Topic:');
  completed.forEach(t => {
    const algos = COMMON_ALGORITHMS[t.name] || [];
    if (algos.length) {
      lines.push(t.name + ':');
      algos.forEach(a => lines.push('  * ' + a));
    }
  });
  lines.push('');
  lines.push('Revision Status:');
  const total = (window.dsaTopics || []).length;
  lines.push(`Revised: ${completed.length}/${total}`);
  lines.push('');
  return lines.join('\n');
}

/** Event bindings */
document.addEventListener('DOMContentLoaded', () => {
  buildRevisionSheet();

  const downloadBtn = document.getElementById('downloadBtn');
  const copyBtn = document.getElementById('copyBtn');
  const printBtn = document.getElementById('printBtn');

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const txt = generatePlainText();
      downloadTXT(txt);
    });
  }
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(generatePlainText());
        void 0;
      } catch (e) {
        console.error('Clipboard error', e);
        void 0;
      }
    });
  }
  if (printBtn) {
    // Directly trigger the browser's print dialog.
    printBtn.addEventListener('click', () => window.print());
  }
});

export { buildRevisionSheet, generatePlainText };
