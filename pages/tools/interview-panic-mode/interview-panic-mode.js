// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Interview Panic Mode logic only
// All globals prefixed ipm_ or IPM_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  ipmRenderQuestions();
  ipmInitTimer();
  ipmInitProgress();
});

/* ─── Common Interview Questions Data ─── */
let IPM_QUESTIONS = [
  {
    topic: '🔢 Arrays',
    questions: [
      'Two Sum — find pair summing to target',
      'Maximum Subarray — Kadane\'s algorithm',
      'Best Time to Buy and Sell Stock',
      'Product of Array Except Self (no division)',
      'Container With Most Water (two pointers)',
      'Trapping Rain Water',
    ]
  },
  {
    topic: '🔤 Strings',
    questions: [
      'Valid Palindrome (clean then check)',
      'Longest Substring Without Repeating Characters',
      'Group Anagrams (sort or frequency map)',
      'Valid Parentheses (stack)',
      'Minimum Window Substring (sliding window)',
      'Encode and Decode Strings',
    ]
  },
  {
    topic: '🌳 Trees',
    questions: [
      'Maximum Depth of Binary Tree',
      'Invert Binary Tree',
      'Validate Binary Search Tree (with bounds)',
      'Lowest Common Ancestor',
      'Binary Tree Level Order Traversal (BFS)',
      'Serialize and Deserialize Binary Tree',
    ]
  },
  {
    topic: '🔗 Linked Lists',
    questions: [
      'Reverse a Linked List',
      'Detect Cycle — Floyd\'s algorithm',
      'Merge Two Sorted Lists (dummy node)',
      'Remove Nth Node From End (two pointers)',
      'Find Middle of Linked List',
      'LRU Cache (HashMap + Doubly Linked List)',
    ]
  },
  {
    topic: '📊 Dynamic Programming',
    questions: [
      'Climbing Stairs (Fibonacci DP)',
      'Coin Change (unbounded knapsack)',
      'Longest Common Subsequence',
      'House Robber (no adjacent)',
      'Unique Paths (grid DP)',
      'Word Break (DP + trie/hash)',
    ]
  },
  {
    topic: '🕸️ Graphs',
    questions: [
      'Number of Islands (BFS/DFS on grid)',
      'Clone Graph (DFS + HashMap)',
      'Course Schedule (cycle detection, topo sort)',
      'Pacific Atlantic Water Flow',
      'Longest Consecutive Sequence',
      'Network Delay Time (Dijkstra\'s)',
    ]
  },
  {
    topic: '🔥 Heaps',
    questions: [
      'Top K Frequent Elements (min-heap size K)',
      'K Closest Points to Origin',
      'Find Median from Data Stream (two heaps)',
      'Merge K Sorted Lists (heap + list index)',
      'Kth Largest Element in Array',
      'Task Scheduler (greedy + heap)',
    ]
  },
  {
    topic: '🧩 Backtracking',
    questions: [
      'Subsets (power set via backtrack)',
      'Permutations (swap-based or used[])',
      'Combination Sum (repeat allowed)',
      'Word Search (DFS on grid)',
      'N-Queens (column/diagonal tracking)',
      'Letter Combinations of Phone Number',
    ]
  },
];

/* ─── Render Questions ─── */
function ipmRenderQuestions() {
  let grid = document.getElementById('ipmQGrid');
  if (!grid) return;

  grid.innerHTML = IPM_QUESTIONS.map(function(cat) {
    let items = cat.questions.map(function(q) {
      return '<li class="ipm-q-item">' + ipmEscape(q) + '</li>';
    }).join('');

    return '<div class="ipm-q-card">' +
      '<div class="ipm-q-card-title">' +
        '<label class="ipm-check-label" style="flex:1">' +
          '<input type="checkbox" class="ipm-check" aria-label="Mark ' + ipmEscape(cat.topic) + ' as reviewed" />' +
          '<span class="ipm-check-title">' + cat.topic + '</span>' +
        '</label>' +
      '</div>' +
      '<ul class="ipm-q-list">' + items + '</ul>' +
    '</div>';
  }).join('');

  // Re-bind checkboxes after render
  ipmBindCheckboxes();
}

function ipmEscape(str) {
  let d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ─── Progress Tracker ─── */
let ipmTotalChecks  = 0;
let ipmCheckedCount = 0;

function ipmBindCheckboxes() {
  let allChecks = document.querySelectorAll('.ipm-check');
  ipmTotalChecks = allChecks.length;

  let totalEl = document.getElementById('ipmTotalCount');
  if (totalEl) totalEl.textContent = ipmTotalChecks;

  allChecks.forEach(function(chk) {
    chk.addEventListener('change', ipmUpdateProgress);
    // Mark parent card as checked
    chk.addEventListener('change', function() {
      let card = chk.closest('.ipm-card, .ipm-q-card, .ipm-sd-card, .ipm-table-card');
      if (card) card.classList.toggle('checked', chk.checked);
    });
  });
}

function ipmUpdateProgress() {
  let allChecks = document.querySelectorAll('.ipm-check');
  let checked   = 0;
  allChecks.forEach(function(c) { if (c.checked) checked++; });
  ipmCheckedCount = checked;

  let pct    = ipmTotalChecks > 0 ? Math.round((checked / ipmTotalChecks) * 100) : 0;
  let fill   = document.getElementById('ipmProgressFill');
  let countEl = document.getElementById('ipmCheckedCount');
  let finalCk  = document.getElementById('ipmFinalChecked');
  let finalPct = document.getElementById('ipmFinalPct');

  if (fill)    fill.style.width    = pct + '%';
  if (countEl) countEl.textContent = checked;
  if (finalCk) finalCk.textContent = checked;
  if (finalPct) finalPct.textContent = pct + '%';
}

function ipmInitProgress() {
  // Bind after questions are already rendered
  let allChecks = document.querySelectorAll('.ipm-check');
  ipmTotalChecks = allChecks.length;
  let totalEl = document.getElementById('ipmTotalCount');
  if (totalEl) totalEl.textContent = ipmTotalChecks;

  allChecks.forEach(function(chk) {
    chk.addEventListener('change', ipmUpdateProgress);
    chk.addEventListener('change', function() {
      let card = chk.closest('.ipm-card, .ipm-q-card, .ipm-sd-card, .ipm-table-card');
      if (card) card.classList.toggle('checked', chk.checked);
    });
  });
}

/* ─── Timer ─── */
let ipmTimer = {
  total    : 30 * 60,
  left     : 30 * 60,
  running  : false,
  interval : null,
  elapsed  : 0,
};

function ipmFmt(s) {
  let m   = Math.floor(s / 60);
  let sec = s % 60;
  return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
}

function ipmUpdateTimerUI() {
  let displayEl = document.getElementById('ipmTimerDisplay');
  let barEl     = document.getElementById('ipmTimerBar');
  let labelEl   = document.getElementById('ipmTimerLabel');
  let finalTimeEl = document.getElementById('ipmFinalTime');

  if (displayEl) {
    displayEl.textContent = ipmFmt(ipmTimer.left);
    displayEl.className = 'ipm-timer-display';
    if (ipmTimer.left <= 120) displayEl.classList.add('danger');
    else if (ipmTimer.left <= 300) displayEl.classList.add('warning');
  }

  if (barEl) {
    let pct = (ipmTimer.left / ipmTimer.total) * 100;
    barEl.style.width = pct + '%';
  }

  if (labelEl) {
    if (!ipmTimer.running && ipmTimer.left === ipmTimer.total) {
      labelEl.textContent = 'Ready when you are';
    } else if (!ipmTimer.running && ipmTimer.left < ipmTimer.total && ipmTimer.left > 0) {
      labelEl.textContent = 'Paused — ' + ipmFmt(ipmTimer.left) + ' remaining';
    } else if (ipmTimer.left <= 0) {
      labelEl.textContent = '⏰ Time\'s up! Go get that offer!';
    } else {
      let spent = ipmTimer.total - ipmTimer.left;
      if (spent < 8 * 60)       labelEl.textContent = '📐 Focus: DSA Formulas';
      else if (spent < 13 * 60) labelEl.textContent = '⚡ Focus: Complexity Table';
      else if (spent < 23 * 60) labelEl.textContent = '🎯 Focus: Common Questions';
      else                       labelEl.textContent = '🏗️ Focus: System Design';
    }
  }

  if (finalTimeEl) {
    finalTimeEl.textContent = ipmFmt(ipmTimer.total - ipmTimer.left);
  }
}

function ipmStartTimer() {
  if (ipmTimer.running || ipmTimer.left <= 0) return;
  ipmTimer.running = true;
  ipmTimer.deadline = Date.now() + (ipmTimer.left * 1000);

  let startBtn  = document.getElementById('ipmStartBtn');
  let pauseBtn  = document.getElementById('ipmPauseBtn');
  if (startBtn) startBtn.classList.add('hidden');
  if (pauseBtn) pauseBtn.classList.remove('hidden');

  ipmTimer.interval = setInterval(function() {
    let remaining = Math.max(0, Math.ceil((ipmTimer.deadline - Date.now()) / 1000));
    ipmTimer.left = remaining;
    ipmUpdateTimerUI();
    if (ipmTimer.left <= 0) {
      clearInterval(ipmTimer.interval);
      ipmTimer.interval = null;
      ipmTimer.running = false;
      let pBtn = document.getElementById('ipmPauseBtn');
      let sBtn = document.getElementById('ipmStartBtn');
      if (pBtn) pBtn.classList.add('hidden');
      if (sBtn) { sBtn.classList.remove('hidden'); sBtn.innerHTML = '<i class="fas fa-check"></i> Time\'s Up!'; sBtn.disabled = true; }
    }
  }, 250);
}

function ipmPauseTimer() {
  ipmTimer.running = false;
  if (ipmTimer.interval) { clearInterval(ipmTimer.interval); ipmTimer.interval = null; }

  let startBtn = document.getElementById('ipmStartBtn');
  let pauseBtn = document.getElementById('ipmPauseBtn');
  if (startBtn) { startBtn.classList.remove('hidden'); startBtn.innerHTML = '<i class="fas fa-play"></i> Resume'; }
  if (pauseBtn) pauseBtn.classList.add('hidden');

  ipmUpdateTimerUI();
}

function ipmResetTimer() {
  ipmTimer.running = false;
  if (ipmTimer.interval) { clearInterval(ipmTimer.interval); ipmTimer.interval = null; }
  ipmTimer.left = ipmTimer.total;

  let startBtn = document.getElementById('ipmStartBtn');
  let pauseBtn = document.getElementById('ipmPauseBtn');
  if (startBtn) { startBtn.classList.remove('hidden'); startBtn.innerHTML = '<i class="fas fa-play"></i> Start 30-Min Revision'; startBtn.disabled = false; }
  if (pauseBtn) pauseBtn.classList.add('hidden');

  ipmUpdateTimerUI();
}

function ipmInitTimer() {
  ipmUpdateTimerUI();

  let startBtn = document.getElementById('ipmStartBtn');
  let pauseBtn = document.getElementById('ipmPauseBtn');
  let resetBtn = document.getElementById('ipmResetBtn');

  if (startBtn) startBtn.addEventListener('click', ipmStartTimer);
  if (pauseBtn) pauseBtn.addEventListener('click', ipmPauseTimer);
  if (resetBtn) resetBtn.addEventListener('click', ipmResetTimer);
}