(function () {
  const CATEGORIES = [
    { value: 'sorting', label: 'Sorting', emojis: ['🧹', '🧠'] },
    { value: 'graph', label: 'Graph', emojis: ['🕸️', '🧭'] },
    { value: 'dp', label: 'Dynamic Programming', emojis: ['🎯', '🧩'] },
    { value: 'misc', label: 'Miscellaneous', emojis: ['🧪', '🔧'] },
  ];

  // Minimal, self-contained dataset. Extend freely.
  const CEMETERY_ITEMS = [
    {
      id: 'sorting-1',
      category: 'sorting',
      title: 'Assuming QuickSort is always O(n log n)',
      summary:
        'Worst-case partitioning can degrade performance to O(n^2). Always reason about pivot strategy / randomness / constraints.',
      lessons: [
        'Prefer randomized pivots or median-of-three in practice',
        'Understand recursion depth and worst-case behavior',
      ],
    },
    {
      id: 'sorting-2',
      category: 'sorting',
      title: 'Forgetting stability requirements',
      summary:
        'Some problems rely on stable sorting to preserve relative order. Using an unstable sort breaks assumptions.',
      lessons: ['Identify whether stability matters before choosing algorithm', 'Use stable variants (e.g., merge sort) when required'],
    },
    {
      id: 'graph-1',
      category: 'graph',
      title: 'No visited set in DFS/BFS',
      summary:
        'Graphs can contain cycles. Without visited tracking, traversal may loop or blow up exponentially.',
      lessons: ['Track visited nodes/edges', 'For shortest paths in unweighted graphs, use BFS'],
    },
    {
      id: 'graph-2',
      category: 'graph',
      title: 'Trying Dijkstra without non-negative weights',
      summary:
        'Dijkstra’s correctness depends on non-negative edge weights. Negative edges require different algorithms.',
      lessons: ['Use Bellman-Ford / Johnson’s for negatives', 'Verify constraints before choosing algorithm'],
    },
    {
      id: 'dp-1',
      category: 'dp',
      title: 'Missing base cases in DP',
      summary:
        'Uninitialized states cause cascading wrong transitions. DP is only correct if base states match the recurrence.',
      lessons: ['Write state definition first', 'Initialize DP table/recursion base properly'],
    },
    {
      id: 'dp-2',
      category: 'dp',
      title: 'Overlapping subproblems ignored',
      summary:
        'If subproblems repeat, memoization/tabulation is the fix. Brute force often becomes infeasible.',
      lessons: ['Look for repeated computations', 'Add caching or bottom-up filling'],
    },
    {
      id: 'misc-1',
      category: 'misc',
      title: 'Off-by-one errors at boundaries',
      summary:
        'Most “mysterious” WA issues in arrays/loops come from incorrect inclusive/exclusive indices.',
      lessons: ['Draw small examples', 'Check loop conditions for first/last element'],
    },
    {
      id: 'misc-2',
      category: 'misc',
      title: 'Mixing up 0-based vs 1-based indexing',
      summary:
        'Common in prefix sums, heaps, and problem statements. Convert once—consistently—throughout the solution.',
      lessons: ['Convert at boundaries', 'Document index meaning in your code'],
    },
  ];

  const gridEl = () => document.getElementById('cemetery-grid');
  const selectEl = () => document.getElementById('category-filter');

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '<')
      .replaceAll('>', '>')
      .replaceAll('"', '"')
      .replaceAll("'", '&#39;');
  }

  function buildCard(item) {
    const lessons = (item.lessons || [])
      .map((l) => `<li>${escapeHtml(l)}</li>`)
      .join('');

    const icon = (CATEGORIES.find((c) => c.value === item.category)?.emojis || ['🪦'])[0];

    return `
      <article class="cemetery-card" data-category="${escapeHtml(item.category)}">
        <h3>${escapeHtml(icon)} ${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>
        ${lessons ? `<ul style="margin:0.75rem 0 0; padding-left:1.1rem; color:#e9e9f3;">${lessons}</ul>` : ''}
      </article>
    `;
  }

  function getFilteredItems() {
    const sel = selectEl();
    const val = sel ? sel.value : 'all';
    if (!val || val === 'all') return CEMETERY_ITEMS;
    return CEMETERY_ITEMS.filter((x) => x.category === val);
  }

  function render() {
    const grid = gridEl();
    if (!grid) return;
    const items = getFilteredItems();

    if (!items.length) {
      grid.innerHTML = `
        <div class="empty-state" style="text-align:center; padding:3rem; color:rgba(255,255,255,0.75);">
          No cemetery entries found for this category.
        </div>
      `;
      return;
    }

    grid.innerHTML = items.map(buildCard).join('');
  }

  function init() {
    const sel = selectEl();
    if (!sel) return;

    render();

    sel.addEventListener('change', () => {
      // small UX: scroll to top of grid when filtering
      render();
      document.getElementById('filters')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

