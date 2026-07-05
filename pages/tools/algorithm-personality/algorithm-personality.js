// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Algorithm Personality Assessment only
// All globals prefixed ap_ or AP_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  apRenderPersonalitiesGrid();
  apInitControls();
});

/* ─── Personality Definitions ─── */
var AP_PERSONALITIES = {
  quicksort: {
    name: 'QuickSort',
    emoji: '⚡',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    tagline: 'Fast, adaptive, but occasionally chaotic.',
    desc: 'You are QuickSort — the person who dives in headfirst and figures it out as you go. You\'re usually the fastest one in the room, and you thrive on energy and momentum. Sometimes your impulsiveness leads to a worst-case situation, but most of the time your instincts are right on target.',
    traits: [
      { label: 'Fast decision maker', type: 'positive' },
      { label: 'Highly adaptive', type: 'positive' },
      { label: 'Thrives in average case', type: 'positive' },
      { label: 'Can be chaotic', type: 'negative' },
      { label: 'Occasionally worst-case', type: 'negative' },
      { label: 'Pivot thinker', type: 'neutral' },
    ],
    complexity: ['Avg: O(n log n)', 'Worst: O(n²)', 'Space: O(log n)'],
    famous: '🌍 Used in: C++ std::sort, Java Arrays.sort (for primitives), Python\'s Timsort hybrid, Linux kernel.',
    advice: '💡 Career tip: You excel in fast-paced startups and agile teams. Watch out for the O(n²) worst case — sometimes slowing down to pick the right pivot saves time overall.',
  },
  mergesort: {
    name: 'Merge Sort',
    emoji: '🌊',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    tagline: 'Methodical, stable, and always reliable.',
    desc: 'You are Merge Sort — the person everyone can count on. You take problems apart systematically, handle each piece perfectly, and put everything back together flawlessly. You prefer to work in structured environments and always deliver consistent results, even if you\'re not the absolute fastest.',
    traits: [
      { label: 'Consistent & reliable', type: 'positive' },
      { label: 'Stable under pressure', type: 'positive' },
      { label: 'Guaranteed O(n log n)', type: 'positive' },
      { label: 'High memory usage', type: 'negative' },
      { label: 'Not always fastest', type: 'neutral' },
      { label: 'Divide and conquer', type: 'neutral' },
    ],
    complexity: ['Time: O(n log n)', 'Space: O(n)', 'Stable: ✅'],
    famous: '🌍 Used in: Python\'s Timsort, Java Collections.sort, Git merge algorithm, external sorting for large files.',
    advice: '💡 Career tip: You\'re built for large organizations and complex projects. Your stability is your superpower. You might use extra resources, but the quality is always worth it.',
  },
  bfs: {
    name: 'BFS',
    emoji: '📡',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #06b6d4 100%)',
    tagline: 'Social, thorough, and always finds the shortest path.',
    desc: 'You are Breadth-First Search — the ultimate team player and networker. You explore all possibilities at every level before going deeper. You always find the shortest route to your goal, and you never skip a connection. People love how comprehensive and fair you are.',
    traits: [
      { label: 'Thorough explorer', type: 'positive' },
      { label: 'Finds optimal path', type: 'positive' },
      { label: 'Level-headed', type: 'positive' },
      { label: 'High memory (wide graphs)', type: 'negative' },
      { label: 'Systematic', type: 'neutral' },
      { label: 'Fair to all neighbors', type: 'neutral' },
    ],
    complexity: ['Time: O(V+E)', 'Space: O(V)', 'Shortest path: ✅'],
    famous: '🌍 Used in: Google Maps shortest routes, social network friend suggestions, GPS navigation, web crawlers.',
    advice: '💡 Career tip: You shine in project management, networking, and team coordination. Never rush to go deep — your breadth of knowledge is your biggest asset.',
  },
  dfs: {
    name: 'DFS',
    emoji: '🌑',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    tagline: 'Deep, intense, and explores the unknown.',
    desc: 'You are Depth-First Search — the philosopher and deep thinker. You don\'t do small talk. You go all-in on one thing until you\'ve exhausted every possibility. You\'re great at solving complex recursive problems, detecting hidden patterns, and exploring uncharted territories others are afraid of.',
    traits: [
      { label: 'Deep thinker', type: 'positive' },
      { label: 'Great at complex problems', type: 'positive' },
      { label: 'Memory efficient', type: 'positive' },
      { label: 'Can get lost in depth', type: 'negative' },
      { label: 'May miss optimal path', type: 'negative' },
      { label: 'Recursive nature', type: 'neutral' },
    ],
    complexity: ['Time: O(V+E)', 'Space: O(h)', 'Stack-based: 🔁'],
    famous: '🌍 Used in: Maze solving, topological sort, cycle detection, compilers, chess AI backtracking.',
    advice: '💡 Career tip: You thrive in research, deep specialization, and creative problem solving. Remember to backtrack occasionally — sometimes the first path isn\'t the best one.',
  },
  hashmap: {
    name: 'HashMap',
    emoji: '⚡',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    tagline: 'Instant answers, zero patience for slow searches.',
    desc: 'You are a HashMap — the person with an answer for everything, instantly. You hate inefficiency. When others are still thinking, you\'ve already looked it up, indexed it, and moved on. You trade memory for speed without hesitation, and you have a key for every door.',
    traits: [
      { label: 'Lightning fast lookup', type: 'positive' },
      { label: 'Incredibly efficient', type: 'positive' },
      { label: 'Organized thinker', type: 'positive' },
      { label: 'High memory usage', type: 'negative' },
      { label: 'Hash collision averse', type: 'negative' },
      { label: 'Key-value mindset', type: 'neutral' },
    ],
    complexity: ['Avg: O(1)', 'Worst: O(n)', 'Space: O(n)'],
    famous: '🌍 Used in: Language dictionaries, database indexing, caches, symbol tables in compilers, DNS lookup.',
    advice: '💡 Career tip: You excel in analytics, data engineering, and optimization. Your biggest weakness is bad hash functions — surround yourself with people who challenge your assumptions.',
  },
  heap: {
    name: 'Heap',
    emoji: '🔥',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
    tagline: 'Always knows who\'s most important right now.',
    desc: 'You are a Heap — the natural priority-setter. You always know what matters most and you surface it immediately. Others may take time deciding what to do next, but you always have the highest priority ready at the top. You\'re the scheduler, the prioritizer, the one who keeps everything from falling apart under pressure.',
    traits: [
      { label: 'Master prioritizer', type: 'positive' },
      { label: 'O(1) access to top', type: 'positive' },
      { label: 'Handles high-pressure well', type: 'positive' },
      { label: 'Bad at random access', type: 'negative' },
      { label: 'Linear search internally', type: 'negative' },
      { label: 'Parent-focused mindset', type: 'neutral' },
    ],
    complexity: ['Peek: O(1)', 'Insert/Delete: O(log n)', 'Build: O(n)'],
    famous: '🌍 Used in: Operating system schedulers, Dijkstra\'s algorithm, hospital triage systems, event-driven simulations.',
    advice: '💡 Career tip: You\'re a natural leader and project manager. Make sure you\'re not just prioritizing work — prioritize rest and long-term thinking too.',
  },
  dp: {
    name: 'Dynamic Programming',
    emoji: '🧠',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
    tagline: 'Never solves the same problem twice.',
    desc: 'You are Dynamic Programming — the ultimate strategic thinker. You never waste effort. You decompose every problem into overlapping subproblems, solve each one exactly once, and build the optimal solution from the ground up. You are patient, methodical, and your solutions are always provably optimal.',
    traits: [
      { label: 'Provably optimal', type: 'positive' },
      { label: 'Never repeats work', type: 'positive' },
      { label: 'Strategic thinker', type: 'positive' },
      { label: 'Slow to get started', type: 'negative' },
      { label: 'High memory usage', type: 'negative' },
      { label: 'Bottom-up builder', type: 'neutral' },
    ],
    complexity: ['Varies by problem', 'Usually O(n²) or O(n)', 'Space: O(n) or O(n²)'],
    famous: '🌍 Used in: Google Maps route optimization, bioinformatics (DNA alignment), spell checkers, financial modeling.',
    advice: '💡 Career tip: You\'re built for consulting, architecture, and long-term strategy. Don\'t let the setup time discourage you — your final solutions are always worth the investment.',
  },
  greedy: {
    name: 'Greedy Algorithm',
    emoji: '💰',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)',
    tagline: 'Takes the best option now and never looks back.',
    desc: 'You are a Greedy Algorithm — the decisive opportunist. You always take the locally optimal choice and never second-guess it. You move fast, commit hard, and often get surprisingly good results. Sometimes you miss the global optimum because you didn\'t look far enough ahead, but in most situations, your quick decisions work out great.',
    traits: [
      { label: 'Decisive & fast', type: 'positive' },
      { label: 'Simple to execute', type: 'positive' },
      { label: 'Often near-optimal', type: 'positive' },
      { label: 'May miss global optimum', type: 'negative' },
      { label: 'Can\'t revise decisions', type: 'negative' },
      { label: 'Local-first thinking', type: 'neutral' },
    ],
    complexity: ['Usually O(n log n)', 'Space: O(1) typically', 'No backtracking'],
    famous: '🌍 Used in: Huffman encoding, Kruskal\'s MST, coin change (special cases), activity selection, network routing.',
    advice: '💡 Career tip: You\'re great in sales, entrepreneurship, and fast decision environments. Practice looking at the bigger picture — sometimes the best local choice today creates problems tomorrow.',
  },
  linkedlist: {
    name: 'Linked List',
    emoji: '🔗',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)',
    tagline: 'Adaptable, connected, and always pointing forward.',
    desc: 'You are a Linked List — the free spirit who hates being boxed in. You don\'t need contiguous space. You point to the next thing, wherever it may be. You\'re highly adaptable to change, great at inserting yourself into new situations, and you navigate life one connection at a time.',
    traits: [
      { label: 'Dynamic & flexible', type: 'positive' },
      { label: 'Efficient at insertion', type: 'positive' },
      { label: 'Connects everything', type: 'positive' },
      { label: 'Slow random access', type: 'negative' },
      { label: 'Extra pointer overhead', type: 'negative' },
      { label: 'Sequential thinker', type: 'neutral' },
    ],
    complexity: ['Access: O(n)', 'Insert/Delete: O(1)', 'Search: O(n)'],
    famous: '🌍 Used in: Undo/redo history, browser back/forward, music playlists, blockchain structure, LRU cache implementation.',
    advice: '💡 Career tip: You thrive in creative, non-structured environments. Your flexibility is your superpower — just remember that sometimes random access matters, so don\'t shy away from structure when needed.',
  },
  binarysearch: {
    name: 'Binary Search',
    emoji: '🔍',
    color: '#14b8a6',
    gradient: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
    tagline: 'Laser-focused, eliminates half the problem every time.',
    desc: 'You are Binary Search — the precision thinker. You don\'t waste time. Every decision cuts the problem in half. You have a gift for knowing exactly where to look, and you always find what you\'re seeking in record time — as long as things are in order. You prefer structured environments where you can apply your razor-sharp logic.',
    traits: [
      { label: 'Extremely efficient', type: 'positive' },
      { label: 'Precision focused', type: 'positive' },
      { label: 'O(log n) elimination', type: 'positive' },
      { label: 'Needs sorted data', type: 'negative' },
      { label: 'Rigid structure required', type: 'negative' },
      { label: 'Divide and decide', type: 'neutral' },
    ],
    complexity: ['Time: O(log n)', 'Space: O(1)', 'Requires sorted input'],
    famous: '🌍 Used in: Dictionary lookup, Git bisect (finding bugs), database index search, gaming loot tables, sqrt computation.',
    advice: '💡 Career tip: You\'re exceptional in data science, finance, and analytical roles. Make sure your world is "sorted" — you perform best in environments with clear rules and structure.',
  }
};

/* ─── Questions ─── */
var AP_QUESTIONS = [
  {
    q: 'You get a complex project with no clear instructions. What do you do?',
    options: [
      { text: 'Dive in immediately and figure it out as I go', scores: { quicksort: 3, greedy: 2, hashmap: 1 } },
      { text: 'Break it into smaller pieces and tackle each systematically', scores: { mergesort: 3, dp: 2, binarysearch: 1 } },
      { text: 'Map out all possibilities before starting anything', scores: { bfs: 3, dp: 2, linkedlist: 1 } },
      { text: 'Go deep on the most interesting part first', scores: { dfs: 3, dp: 1, linkedlist: 2 } },
    ]
  },
  {
    q: 'When making an important decision, you typically...',
    options: [
      { text: 'Go with your gut — the best option right now is obvious', scores: { greedy: 3, quicksort: 2, hashmap: 1 } },
      { text: 'Analyze all data carefully before committing', scores: { dp: 3, mergesort: 2, binarysearch: 2 } },
      { text: 'Ask everyone in your network and weigh all inputs', scores: { bfs: 3, linkedlist: 1, heap: 1 } },
      { text: 'Think deeply about long-term consequences', scores: { dp: 2, dfs: 2, mergesort: 1 } },
    ]
  },
  {
    q: 'Your relationship with memory and resources:',
    options: [
      { text: 'I trade memory for speed — time is the most precious resource', scores: { hashmap: 3, heap: 2, quicksort: 1 } },
      { text: 'I use exactly what I need, no more, no less', scores: { binarysearch: 3, greedy: 2, dfs: 2 } },
      { text: 'I prefer to precompute and cache everything for later', scores: { dp: 3, hashmap: 2, mergesort: 1 } },
      { text: 'I adapt to whatever resources are available dynamically', scores: { linkedlist: 3, quicksort: 1, bfs: 1 } },
    ]
  },
  {
    q: 'How do you handle setbacks?',
    options: [
      { text: 'I backtrack and try a completely different path', scores: { dfs: 3, dp: 2, linkedlist: 1 } },
      { text: 'I learn from it and add it to my knowledge base', scores: { dp: 3, hashmap: 2, mergesort: 1 } },
      { text: 'I pick the next best available option and move on', scores: { greedy: 3, heap: 2, quicksort: 1 } },
      { text: 'I systematically explore all alternatives', scores: { bfs: 3, mergesort: 2, binarysearch: 1 } },
    ]
  },
  {
    q: 'Your friends would describe you as...',
    options: [
      { text: 'The fast, energetic one who always finds a way', scores: { quicksort: 3, greedy: 2, hashmap: 1 } },
      { text: 'The reliable, structured one everyone counts on', scores: { mergesort: 3, binarysearch: 2, heap: 1 } },
      { text: 'The deep, thoughtful one who goes all-in', scores: { dfs: 3, dp: 2, linkedlist: 1 } },
      { text: 'The networker who knows everyone and everything', scores: { bfs: 3, linkedlist: 2, hashmap: 1 } },
    ]
  },
  {
    q: 'In a team project, you naturally gravitate toward...',
    options: [
      { text: 'Leading with intuition and inspiring others to act fast', scores: { quicksort: 3, greedy: 2, heap: 1 } },
      { text: 'Managing priorities and deciding what gets done first', scores: { heap: 3, greedy: 2, mergesort: 1 } },
      { text: 'Connecting dots between people, finding shortest path to goal', scores: { bfs: 3, linkedlist: 2, hashmap: 1 } },
      { text: 'Solving the hardest sub-problem nobody else can crack', scores: { dp: 3, dfs: 2, binarysearch: 2 } },
    ]
  },
  {
    q: 'When exploring a new city, you:',
    options: [
      { text: 'Find the nearest hotspot and explore systematically outward', scores: { bfs: 3, heap: 1, mergesort: 1 } },
      { text: 'Pick one street and follow it to the very end', scores: { dfs: 3, linkedlist: 2, quicksort: 1 } },
      { text: 'Look up the best places instantly and go straight there', scores: { hashmap: 3, binarysearch: 2, greedy: 1 } },
      { text: 'Plan the most efficient route to cover maximum ground', scores: { dp: 3, binarysearch: 2, mergesort: 1 } },
    ]
  },
  {
    q: 'Your approach to learning something new:',
    options: [
      { text: 'Jump into projects immediately and learn by doing', scores: { quicksort: 3, greedy: 2, dfs: 1 } },
      { text: 'Build a solid foundation before touching advanced material', scores: { mergesort: 3, dp: 2, binarysearch: 2 } },
      { text: 'Connect it to everything I already know', scores: { bfs: 2, linkedlist: 2, hashmap: 3 } },
      { text: 'Find the core insight and derive everything from it', scores: { binarysearch: 3, dp: 2, dfs: 1 } },
    ]
  },
  {
    q: 'How do you prioritize tasks?',
    options: [
      { text: 'Whatever seems most impactful right now', scores: { greedy: 3, heap: 2, quicksort: 1 } },
      { text: 'Strict priority queue — highest value, highest priority', scores: { heap: 3, dp: 1, mergesort: 1 } },
      { text: 'I solve the easiest ones first to build momentum', scores: { greedy: 2, bfs: 2, quicksort: 1 } },
      { text: 'I plan the optimal order upfront, then execute', scores: { dp: 3, binarysearch: 2, mergesort: 2 } },
    ]
  },
  {
    q: 'When you have a database of information, you prefer to:',
    options: [
      { text: 'Index everything upfront for instant future lookup', scores: { hashmap: 3, dp: 2, binarysearch: 1 } },
      { text: 'Sort it once so I can binary search forever after', scores: { binarysearch: 3, mergesort: 2, dp: 1 } },
      { text: 'Keep it flexible — I\'ll traverse when needed', scores: { linkedlist: 3, dfs: 2, bfs: 1 } },
      { text: 'Build a smart structure that self-optimizes', scores: { heap: 3, dp: 2, hashmap: 1 } },
    ]
  },
  {
    q: 'Your relationship with structure and rules:',
    options: [
      { text: 'Rules exist for good reason — I follow them precisely', scores: { binarysearch: 3, mergesort: 2, heap: 1 } },
      { text: 'I break rules when it makes things faster', scores: { quicksort: 2, greedy: 3, hashmap: 1 } },
      { text: 'I create my own flexible structure as I go', scores: { linkedlist: 3, dfs: 2, quicksort: 1 } },
      { text: 'I work within any structure — I adapt to the environment', scores: { bfs: 3, dp: 2, mergesort: 1 } },
    ]
  },
  {
    q: 'When you fail at something, you:',
    options: [
      { text: 'Immediately try again — fail fast, learn fast', scores: { quicksort: 3, greedy: 2, hashmap: 1 } },
      { text: 'Record what happened and never make that mistake again', scores: { dp: 3, hashmap: 2, mergesort: 1 } },
      { text: 'Backtrack completely and explore a different approach', scores: { dfs: 3, linkedlist: 2, dp: 1 } },
      { text: 'Eliminate what doesn\'t work, halve the search space', scores: { binarysearch: 3, greedy: 2, quicksort: 1 } },
    ]
  },
  {
    q: 'What excites you most about solving problems?',
    options: [
      { text: 'The speed — solving it faster than anyone else', scores: { quicksort: 3, hashmap: 3, greedy: 1 } },
      { text: 'The elegance — finding the provably optimal solution', scores: { dp: 3, mergesort: 2, binarysearch: 2 } },
      { text: 'The depth — uncovering hidden complexity', scores: { dfs: 3, dp: 2, linkedlist: 1 } },
      { text: 'The connections — seeing how everything relates', scores: { bfs: 3, linkedlist: 2, hashmap: 1 } },
    ]
  },
  {
    q: 'Your ideal work environment:',
    options: [
      { text: 'Fast-paced startup where everything moves quickly', scores: { quicksort: 3, greedy: 2, hashmap: 1 } },
      { text: 'Structured organization with clear processes and reliability', scores: { mergesort: 3, binarysearch: 2, heap: 1 } },
      { text: 'Research lab where I can explore deeply without interruption', scores: { dfs: 3, dp: 2, linkedlist: 1 } },
      { text: 'Collaborative environment with many connections and touchpoints', scores: { bfs: 3, linkedlist: 2, heap: 1 } },
    ]
  },
  {
    q: 'On weekends you are most likely to:',
    options: [
      { text: 'Spontaneously try something new on a whim', scores: { quicksort: 2, greedy: 3, dfs: 1 } },
      { text: 'Plan the optimal sequence of activities in advance', scores: { dp: 3, binarysearch: 2, mergesort: 1 } },
      { text: 'Catch up with your wide network of friends', scores: { bfs: 3, linkedlist: 2, hashmap: 1 } },
      { text: 'Go deep on a passion project for hours', scores: { dfs: 3, dp: 2, linkedlist: 1 } },
    ]
  },
];

/* ─── State ─── */
var apState = {
  answers  : [],   // index = question idx, value = selected option idx or -1
  current  : 0,
  scores   : {},
};

/* ─── Helpers ─── */
function apEscape(str) {
  var d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function apScrollToQuiz() {
  var el = document.getElementById('quiz');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ─── Init ─── */
function apInitControls() {
  var startHeroBtn = document.getElementById('apStartHeroBtn');
  var startMainBtn = document.getElementById('apStartMainBtn');
  var prevBtn      = document.getElementById('apPrevBtn');
  var nextBtn      = document.getElementById('apNextBtn');
  var retakeBtn    = document.getElementById('apRetakeBtn');
  var shareBtn     = document.getElementById('apShareBtn');

  if (startHeroBtn) startHeroBtn.addEventListener('click', function() {
    apScrollToQuiz();
    setTimeout(apStartQuiz, 400);
  });

  if (startMainBtn) startMainBtn.addEventListener('click', apStartQuiz);
  if (prevBtn)      prevBtn.addEventListener('click', apPrev);
  if (nextBtn)      nextBtn.addEventListener('click', apNext);
  if (retakeBtn)    retakeBtn.addEventListener('click', apRetake);
  if (shareBtn)     shareBtn.addEventListener('click', apShare);
}

/* ─── Start ─── */
function apStartQuiz() {
  apState.answers = new Array(AP_QUESTIONS.length).fill(-1);
  apState.current = 0;
  apState.scores  = {};
  Object.keys(AP_PERSONALITIES).forEach(function(k) { apState.scores[k] = 0; });

  document.getElementById('apStartCard').classList.add('hidden');
  document.getElementById('apResultCard').classList.add('hidden');
  document.getElementById('apQuizCard').classList.remove('hidden');

  apRenderDots();
  apRenderQuestion();
  apScrollToQuiz();
}

/* ─── Render Question ─── */
function apRenderQuestion() {
  var q       = AP_QUESTIONS[apState.current];
  var total   = AP_QUESTIONS.length;
  var current = apState.current;
  var pct     = Math.round((current / total) * 100);

  // Progress
  var bar = document.getElementById('apProgressBar');
  var ctr = document.getElementById('apQuizCounter');
  var pctEl = document.getElementById('apQuizPct');
  if (bar) bar.style.width = pct + '%';
  if (ctr) ctr.textContent = 'Question ' + (current + 1) + ' of ' + total;
  if (pctEl) pctEl.textContent = pct + '% complete';

  // Question text
  var qEl = document.getElementById('apQuestion');
  if (qEl) qEl.textContent = q.q;

  // Options
  var optEl = document.getElementById('apOptions');
  if (optEl) {
    var letters = ['A', 'B', 'C', 'D'];
    optEl.innerHTML = q.options.map(function(opt, i) {
      var isSelected = apState.answers[current] === i;
      return '<button class="ap-option' + (isSelected ? ' selected' : '') + '" data-idx="' + i + '" aria-label="Option ' + letters[i] + ': ' + apEscape(opt.text) + '">' +
        '<span class="ap-option-letter">' + letters[i] + '</span>' +
        '<span>' + apEscape(opt.text) + '</span>' +
      '</button>';
    }).join('');

    optEl.querySelectorAll('.ap-option').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.getAttribute('data-idx'));
        apSelectOption(idx);
      });
    });
  }

  // Nav buttons
  var prevBtn = document.getElementById('apPrevBtn');
  var nextBtn = document.getElementById('apNextBtn');
  if (prevBtn) prevBtn.disabled = current === 0;
  if (nextBtn) {
    nextBtn.disabled = apState.answers[current] === -1;
    if (current === total - 1) {
      nextBtn.innerHTML = 'See Result <i class="fas fa-star"></i>';
    } else {
      nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
    }
  }

  apUpdateDots();
}

/* ─── Select Option ─── */
function apSelectOption(idx) {
  var current = apState.current;
  apState.answers[current] = idx;

  // Update option styles
  document.querySelectorAll('.ap-option').forEach(function(btn) {
    btn.classList.toggle('selected', parseInt(btn.getAttribute('data-idx')) === idx);
  });

  // Enable next
  var nextBtn = document.getElementById('apNextBtn');
  if (nextBtn) nextBtn.disabled = false;

  apUpdateDots();
}

/* ─── Dots ─── */
function apRenderDots() {
  var dots = document.getElementById('apQuizDots');
  if (!dots) return;
  dots.innerHTML = AP_QUESTIONS.map(function(q, i) {
    return '<div class="ap-quiz-dot" data-dot="' + i + '"></div>';
  }).join('');
}

function apUpdateDots() {
  document.querySelectorAll('.ap-quiz-dot').forEach(function(dot) {
    var i = parseInt(dot.getAttribute('data-dot'));
    dot.classList.remove('answered', 'current');
    if (i === apState.current) dot.classList.add('current');
    else if (apState.answers[i] !== -1) dot.classList.add('answered');
  });
}

/* ─── Navigation ─── */
function apPrev() {
  if (apState.current > 0) {
    apState.current--;
    apRenderQuestion();
  }
}

function apNext() {
  var current = apState.current;
  if (apState.answers[current] === -1) return;

  if (current === AP_QUESTIONS.length - 1) {
    apCalculateResult();
  } else {
    apState.current++;
    apRenderQuestion();
  }
}

/* ─── Calculate Result ─── */
function apCalculateResult() {
  // Tally scores
  var scores = {};
  Object.keys(AP_PERSONALITIES).forEach(function(k) { scores[k] = 0; });

  AP_QUESTIONS.forEach(function(q, qi) {
    var ans = apState.answers[qi];
    if (ans === -1) return;
    var optScores = q.options[ans].scores;
    Object.keys(optScores).forEach(function(k) {
      if (scores[k] !== undefined) scores[k] += optScores[k];
    });
  });

  apState.scores = scores;

  // Find winner
  var winner = Object.keys(scores).reduce(function(a, b) {
    return scores[a] >= scores[b] ? a : b;
  });

  apShowResult(winner, scores);
}

/* ─── Show Result ─── */
function apShowResult(winner, scores) {
  var p = AP_PERSONALITIES[winner];

  document.getElementById('apQuizCard').classList.add('hidden');
  var resultCard = document.getElementById('apResultCard');
  resultCard.classList.remove('hidden');

  // Top section
  var topEl = document.getElementById('apResultTop');
  if (topEl) topEl.style.background = p.gradient;

  var emojiEl   = document.getElementById('apResultEmoji');
  var nameEl    = document.getElementById('apResultName');
  var taglineEl = document.getElementById('apResultTagline');
  if (emojiEl)   emojiEl.textContent   = p.emoji;
  if (nameEl)    nameEl.textContent    = p.name;
  if (taglineEl) taglineEl.textContent = p.tagline;

  // Desc
  var descEl = document.getElementById('apResultDesc');
  if (descEl) descEl.textContent = p.desc;

  // Traits
  var traitsEl = document.getElementById('apResultTraits');
  if (traitsEl) {
    traitsEl.innerHTML = p.traits.map(function(t) {
      var icon = t.type === 'positive' ? '✅' : t.type === 'negative' ? '⚠️' : '💡';
      return '<span class="ap-trait ' + t.type + '">' + icon + ' ' + apEscape(t.label) + '</span>';
    }).join('');
  }

  // Complexity
  var compEl = document.getElementById('apResultComplexity');
  if (compEl) {
    compEl.innerHTML = p.complexity.map(function(c) {
      return '<span class="ap-comp-chip">' + apEscape(c) + '</span>';
    }).join('');
  }

  // Famous
  var famousEl = document.getElementById('apResultFamous');
  if (famousEl) famousEl.textContent = p.famous;

  // Advice
  var adviceEl = document.getElementById('apResultAdvice');
  if (adviceEl) adviceEl.textContent = p.advice;

  // Score breakdown
  apRenderScoreBreakdown(scores, winner);

  apScrollToQuiz();
}

/* ─── Score Breakdown ─── */
function apRenderScoreBreakdown(scores, winner) {
  var el = document.getElementById('apScoreBreakdown');
  if (!el) return;

  var maxScore = Math.max.apply(null, Object.values(scores));

  // Sort by score descending, top 5
  var sorted = Object.keys(scores).sort(function(a, b) {
    return scores[b] - scores[a];
  }).slice(0, 6);

  var rowsHtml = sorted.map(function(key) {
    var p    = AP_PERSONALITIES[key];
    var pct  = maxScore > 0 ? Math.round((scores[key] / maxScore) * 100) : 0;
    var isWinner = key === winner;
    var barColor = isWinner ? p.gradient : 'rgba(100,116,139,0.4)';
    return '<div class="ap-score-row">' +
      '<span class="ap-score-label">' + p.emoji + ' ' + p.name + (isWinner ? ' 🏆' : '') + '</span>' +
      '<div class="ap-score-bar-track">' +
        '<div class="ap-score-bar-fill" style="width:0%; background:' + barColor + '" data-pct="' + pct + '"></div>' +
      '</div>' +
      '<span class="ap-score-val">' + scores[key] + '</span>' +
    '</div>';
  }).join('');

  el.innerHTML = '<div class="ap-score-title">Your Algorithm Affinity Scores</div>' +
    '<div class="ap-score-rows">' + rowsHtml + '</div>';

  // Animate bars
  requestAnimationFrame(function() {
    setTimeout(function() {
      el.querySelectorAll('.ap-score-bar-fill').forEach(function(bar) {
        bar.style.width = bar.getAttribute('data-pct') + '%';
        bar.style.transition = 'width 1s ease';
      });
    }, 100);
  });
}

/* ─── Retake ─── */
function apRetake() {
  document.getElementById('apResultCard').classList.add('hidden');
  document.getElementById('apStartCard').classList.remove('hidden');
  apScrollToQuiz();
}

/* ─── Share ─── */
function apShare() {
  var winner = Object.keys(apState.scores).reduce(function(a, b) {
    return apState.scores[a] >= apState.scores[b] ? a : b;
  });
  var p    = AP_PERSONALITIES[winner];
  var text = 'I just took the Algorithm Personality Assessment on Algo Infinity Verse!\n\n' +
    '🎯 I am ' + p.name + '!\n' +
    '"' + p.tagline + '"\n\n' +
    'Discover your algorithm personality at: algoinfinityverse.com';

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      apShowShareMsg();
    }).catch(function() { apShareFallback(text); });
  } else {
    apShareFallback(text);
  }
}

function apShareFallback(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(ta);
  apShowShareMsg();
}

function apShowShareMsg() {
  var msg = document.getElementById('apShareMsg');
  if (!msg) return;
  msg.classList.remove('hidden');
  setTimeout(function() { msg.classList.add('hidden'); }, 3000);
}

/* ─── Render All Personalities ─── */
function apRenderPersonalitiesGrid() {
  var grid = document.getElementById('apPersonalitiesGrid');
  if (!grid) return;

  grid.innerHTML = Object.keys(AP_PERSONALITIES).map(function(key) {
    var p    = AP_PERSONALITIES[key];
    var tags = p.traits.slice(0, 3).map(function(t) {
      return '<span class="ap-personality-trait">' + apEscape(t.label) + '</span>';
    }).join('');

    return '<div class="ap-personality-card" style="--card-color:' + p.color + '">' +
      '<div class="ap-personality-emoji">' + p.emoji + '</div>' +
      '<div class="ap-personality-name">' + apEscape(p.name) + '</div>' +
      '<div class="ap-personality-tagline">' + apEscape(p.tagline) + '</div>' +
      '<div class="ap-personality-traits">' + tags + '</div>' +
    '</div>';
  }).join('');

  // Apply gradient border tops
  var cards = grid.querySelectorAll('.ap-personality-card');
  var keys  = Object.keys(AP_PERSONALITIES);
  cards.forEach(function(card, i) {
    var p = AP_PERSONALITIES[keys[i]];
    card.style.setProperty('--card-gradient', p.gradient);
    card.style.borderColor = p.color + '33';
    card.querySelector('.ap-personality-emoji').style.cssText += '';
  });

  // Pseudo ::before can't be set via JS — use inline style workaround
  cards.forEach(function(card, i) {
    var p = AP_PERSONALITIES[keys[i]];
    var topBar = document.createElement('div');
    topBar.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:4px;background:' + p.gradient + ';border-radius:18px 18px 0 0';
    card.insertBefore(topBar, card.firstChild);
  });
}