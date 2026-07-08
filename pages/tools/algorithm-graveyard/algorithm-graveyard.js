document.addEventListener('DOMContentLoaded', function() {
  agRenderGrid(AG_EXHIBITS);
  agInitFilter();
  agInitModal();
});

let AG_SPEED = { 1: 900, 2: 500, 3: 280, 4: 120, 5: 40 };

let AG_EXHIBITS = [
  {
    id: 'linear-vs-binary',
    cat: 'search',
    skull: '💀',
    deadName: 'Linear Search',
    years: 'Used: Ancient — Dead on sorted data',
    epitaph: '"I looked at every element. Even on sorted data. Every. Single. One."',
    cause: 'O(n) on sorted data — ignores ordering information completely',
    replacement: 'Binary Search',
    oldComplexity: 'O(n)',
    newComplexity: 'O(log n)',
    lore: 'Linear Search was the first search algorithm ever devised — simply check every element from left to right. It works on unsorted data, but when the data is sorted, it wastes every advantage that sorting provides. Binary Search was born when someone finally asked: "If the data is sorted, why are we still checking every element?"',
    flaw: 'Fatal Input: a sorted array of 1,000,000 elements. Linear Search makes up to 1,000,000 comparisons. Binary Search makes at most 20.',
    defaultInput: [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 88, 91, 99],
    searchTarget: 91,
    type: 'search',
    runOld: agLinearSearch,
    runNew: agBinarySearch,
  },
  {
    id: 'bubble-vs-merge',
    cat: 'sort',
    skull: '💀',
    deadName: 'Bubble Sort',
    years: 'Used: 1956 — Retired for n > 100',
    epitaph: '"I compared every adjacent pair. Repeatedly. Until nothing moved. It was... a lot."',
    cause: 'O(n²) comparisons — catastrophically slow on large inputs',
    replacement: 'Merge Sort',
    oldComplexity: 'O(n²)',
    newComplexity: 'O(n log n)',
    lore: 'Bubble Sort gets its name from the way large elements "bubble up" to the end of the array with each pass. It is the algorithm students learn first because it is so simple to understand. It is also the algorithm they immediately stop using when they realize O(n²) means 1,000,000 operations for n=1000 — and 1,000,000,000 for n=30,000.',
    flaw: 'Fatal Input: a reverse-sorted array. Bubble Sort makes n×(n-1)/2 swaps — every possible swap. For n=12, that is 66 swaps. For n=1000, that is 499,500.',
    defaultInput: [9, 8, 7, 6, 5, 4, 3, 2, 1],
    type: 'sort',
    runOld: agBubbleSort,
    runNew: agMergeSort,
  },
  {
    id: 'selection-vs-heap',
    cat: 'sort',
    skull: '💀',
    deadName: 'Selection Sort',
    years: 'Used: 1960s — O(n²) even on sorted data',
    epitaph: '"I scanned the entire remaining array to find the minimum. Every time. Even when the answer was obvious."',
    cause: 'O(n²) comparisons regardless of input — no early termination possible',
    replacement: 'Heap Sort',
    oldComplexity: 'O(n²)',
    newComplexity: 'O(n log n)',
    lore: 'Selection Sort finds the minimum element and places it at the front, then finds the next minimum, and so on. Its fatal flaw: it always scans the entire unsorted portion regardless of what it finds. Even on a sorted array, it makes O(n²) comparisons. Heap Sort solved this by maintaining a priority queue — finding the minimum in O(log n) instead of O(n).',
    flaw: 'Fatal Input: any array. Selection Sort always does n×(n-1)/2 comparisons with no way to terminate early — even if the array is already sorted.',
    defaultInput: [3, 7, 1, 9, 2, 8, 4, 6, 5],
    type: 'sort',
    runOld: agSelectionSort,
    runNew: agHeapSort,
  },
  {
    id: 'naive-fib-vs-dp',
    cat: 'dp',
    skull: '💀',
    deadName: 'Naive Recursive Fibonacci',
    years: 'Used: As a teaching example — Never in production',
    epitaph: '"I called myself twice for every call. My call tree was an exponential nightmare."',
    cause: 'O(2ⁿ) time — computes fib(3) 10 times when computing fib(10)',
    replacement: 'Memoized DP Fibonacci',
    oldComplexity: 'O(2ⁿ)',
    newComplexity: 'O(n)',
    lore: 'Naive Fibonacci is the canonical example of why overlapping subproblems are devastating. fib(5) calls fib(4) and fib(3). fib(4) also calls fib(3). fib(3) gets computed exponentially many times. For fib(40), that is over a billion calls. Memoization caches results and reduces this to exactly n calls.',
    flaw: 'Fatal Input: fib(20). Naive recursion makes 21891 function calls. Memoized DP makes exactly 20 unique computations.',
    defaultInput: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
    type: 'fib',
    runOld: agNaiveFib,
    runNew: agMemoFib,
  },
  {
    id: 'naive-search-vs-kmp',
    cat: 'search',
    skull: '💀',
    deadName: 'Naive String Search',
    years: 'Used: Pre-1977 — Retired by KMP',
    epitaph: '"On mismatch, I moved the pattern one position and started over from the beginning. No memory. No mercy."',
    cause: 'O(nm) worst case — re-examines text characters already compared',
    replacement: 'KMP Algorithm',
    oldComplexity: 'O(nm)',
    newComplexity: 'O(n+m)',
    lore: 'Before Knuth, Morris, and Pratt published their algorithm in 1977, everyone used naive string search. The problem: on mismatch, you slide the pattern one position right and restart comparison from the beginning of the pattern. You throw away all knowledge of what you just compared. KMP\'s failure function means you never re-examine a text character you\'ve already passed.',
    flaw: 'Fatal Input: text="AAAAAAAAAB", pattern="AAAB". Naive search: every alignment fails only on the 4th char — O(n×m) comparisons. KMP: O(n+m).',
    defaultInput: ['A','A','A','A','A','A','A','A','A','B'],
    searchTarget: 'AAAB',
    type: 'string',
    runOld: agNaiveString,
    runNew: agKMPString,
  },
  {
    id: 'bfs-weighted-vs-dijkstra',
    cat: 'graph',
    skull: '💀',
    deadName: 'BFS for Weighted Shortest Path',
    years: 'Works on unweighted — Wrong on weighted graphs',
    epitaph: '"I treated every edge as cost 1. On weighted graphs, I confidently returned the wrong answer."',
    cause: 'Treats all edges equally — finds fewest-hops path, not minimum-cost path',
    replacement: "Dijkstra's Algorithm",
    oldComplexity: 'O(V+E) — wrong',
    newComplexity: 'O((V+E) log V) — correct',
    lore: 'BFS is optimal for unweighted graphs — it finds the path with fewest edges. But on weighted graphs, BFS can confidently return a completely wrong answer. A path with 2 edges of weight 100 costs 200, but BFS prefers it over a path with 3 edges of weight 1 costing 3. Dijkstra was designed specifically to handle this — it tracks cumulative cost, not hop count.',
    flaw: 'Fatal Input: graph where shortest-hop path is not shortest-cost path. BFS returns wrong answer with full confidence.',
    defaultInput: null,
    type: 'graph',
    runOld: agBFSWrong,
    runNew: agDijkstraCorrect,
  },
  {
    id: 'adjacency-matrix-vs-list',
    cat: 'structure',
    skull: '💀',
    deadName: 'Adjacency Matrix for Sparse Graphs',
    years: 'Still used for dense graphs — Fatal on sparse',
    epitaph: '"I allocated V² memory cells. Even when the graph had only V edges. Most of my cells were empty zeros."',
    cause: 'O(V²) space for a sparse graph with only O(V) edges — colossal waste',
    replacement: 'Adjacency List',
    oldComplexity: 'O(V²) space',
    newComplexity: 'O(V+E) space',
    lore: 'An adjacency matrix stores a V×V grid where cell [i][j]=1 means edge i→j exists. For a dense graph (many edges), this is fine. For a sparse graph — like the internet, social networks, or road maps where each node has ~10 edges — the matrix is 99.99% zeros. A road network with 1M cities needs 10¹² cells just to store ~10M edges.',
    flaw: 'Fatal Input: a graph with 1000 nodes but only 2000 edges (sparse). Matrix: 1,000,000 cells. Adjacency list: 2000+1000 entries.',
    defaultInput: null,
    type: 'space',
    runOld: agMatrixSpace,
    runNew: agListSpace,
  },
  {
    id: 'stack-overflow-vs-iterative',
    cat: 'structure',
    skull: '💀',
    deadName: 'Recursive DFS (Unbounded)',
    years: 'Works on shallow trees — Crashes on deep ones',
    epitaph: '"I called myself recursively on a 100,000-node tree. The stack frame ran out of memory. Segfault."',
    cause: 'O(h) stack frames — stack overflow on deep or degenerate trees',
    replacement: 'Iterative DFS with Explicit Stack',
    oldComplexity: 'O(h) call stack — can overflow',
    newComplexity: 'O(h) heap — never overflows',
    lore: 'Recursive DFS is elegant and matches how humans think about tree traversal. But every recursive call consumes a stack frame — typically 1-8KB. For a balanced tree of 1M nodes, the depth is ~20 (fine). For a degenerate tree (a linked list), the depth is 1M — which means 1M stack frames, each 1-8KB = gigabytes of stack space. Crash. Iterative DFS uses heap memory, which is orders of magnitude larger.',
    flaw: 'Fatal Input: a degenerate tree (linked list shape) with 10,000+ nodes. Recursive DFS overflows the call stack. Iterative DFS handles it trivially.',
    defaultInput: null,
    type: 'stack',
    runOld: agRecursiveDFS,
    runNew: agIterativeDFS,
  },
  {
    id: 'floyd-vs-johnson',
    cat: 'graph',
    skull: '💀',
    deadName: 'Floyd-Warshall on Sparse Graphs',
    years: 'Still optimal for dense — Overkill for sparse',
    epitaph: '"For every pair of nodes, I computed the shortest path. Even for graphs where 99% of pairs had no connection."',
    cause: 'O(V³) always — ignores sparsity, devastating for large sparse graphs',
    replacement: "Johnson's Algorithm",
    oldComplexity: 'O(V³)',
    newComplexity: 'O(V² log V + VE)',
    lore: 'Floyd-Warshall computes all-pairs shortest paths in O(V³) with O(V²) space. For a small dense graph (V=100, E≈10000), this is excellent. For a sparse graph (V=10000, E≈30000) like a road network, Floyd-Warshall needs 10¹² operations and 10⁸ memory cells. Johnson\'s algorithm uses Bellman-Ford + Dijkstra to handle sparse graphs with negative edges efficiently.',
    flaw: 'Fatal Input: 1000 nodes, 2000 edges. Floyd-Warshall: 10⁹ operations. Johnson\'s: ~30M operations.',
    defaultInput: null,
    type: 'allpairs',
    runOld: agFloydOps,
    runNew: agJohnsonOps,
  },
  {
    id: 'simple-hash-vs-polynomial',
    cat: 'structure',
    skull: '💀',
    deadName: 'Simple Sum Hash',
    years: 'Used: naive implementations — Retired by polynomial hash',
    epitaph: '"I summed the ASCII values of characters. \'abc\' and \'bca\' and \'cab\' all hashed to the same bucket."',
    cause: 'Anagram inputs produce identical hashes — catastrophic collision rate',
    replacement: 'Polynomial Rolling Hash',
    oldComplexity: 'O(n) collisions on anagrams',
    newComplexity: 'O(1) collisions expected',
    lore: 'The simplest hash function for strings: sum the ASCII values of all characters. Simple, fast, and catastrophically broken. Every anagram produces the same hash. "abc", "bca", "cab", "bac" all hash identically. A dictionary full of anagrams (common in English) makes every bucket a linked list — turning O(1) lookups into O(n) linear search. Polynomial hash weights each character by its position, making anagram collisions effectively impossible.',
    flaw: 'Fatal Input: strings "abc", "bca", "cab", "acb", "bac", "cba". All 6 anagrams hash to the same bucket in simple sum hash. Polynomial hash gives 6 different values.',
    defaultInput: ['abc','bca','cab','acb','bac','cba'],
    type: 'hash',
    runOld: agSimpleHash,
    runNew: agPolynomialHash,
  },
];

/* ─── Algorithm implementations (step-based) ─── */

function agLinearSearch(arr, target) {
  let steps = [];
  for (let i = 0; i < arr.length; i++) {
    steps.push({ type: 'compare', idx: i, ops: i + 1, msg: 'Comparing arr[' + i + ']=' + arr[i] + ' with target=' + target });
    if (arr[i] === target) {
      steps.push({ type: 'found', idx: i, ops: i + 1, msg: '✅ Found ' + target + ' at index ' + i + ' after ' + (i+1) + ' comparisons.' });
      return steps;
    }
  }
  steps.push({ type: 'not-found', ops: arr.length, msg: '❌ Not found after ' + arr.length + ' comparisons.' });
  return steps;
}

function agBinarySearch(arr, target) {
  let steps = [];
  let lo = 0, hi = arr.length - 1, ops = 0;
  while (lo <= hi) {
    let mid = Math.floor((lo + hi) / 2);
    ops++;
    steps.push({ type: 'compare', lo: lo, hi: hi, mid: mid, ops: ops, msg: 'lo=' + lo + ' hi=' + hi + ' mid=' + mid + ' arr[mid]=' + arr[mid] });
    if (arr[mid] === target) {
      steps.push({ type: 'found', idx: mid, ops: ops, msg: '✅ Found ' + target + ' at index ' + mid + ' after only ' + ops + ' comparisons!' });
      return steps;
    } else if (arr[mid] < target) {
      lo = mid + 1;
      steps.push({ type: 'right', ops: ops, msg: arr[mid] + ' < ' + target + ' → search right half' });
    } else {
      hi = mid - 1;
      steps.push({ type: 'left', ops: ops, msg: arr[mid] + ' > ' + target + ' → search left half' });
    }
  }
  steps.push({ type: 'not-found', ops: ops, msg: '❌ Not found after ' + ops + ' comparisons.' });
  return steps;
}

function agBubbleSort(arr) {
  let a = arr.slice(); let steps = []; let ops = 0;
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - 1 - i; j++) {
      ops++;
      steps.push({ type: 'compare', arr: a.slice(), j: j, ops: ops, msg: 'Compare a[' + j + ']=' + a[j] + ' and a[' + (j+1) + ']=' + a[j+1] });
      if (a[j] > a[j+1]) {
        let t = a[j]; a[j] = a[j+1]; a[j+1] = t;
        steps.push({ type: 'swap', arr: a.slice(), j: j, ops: ops, msg: 'Swap → ' + a.slice().join(',') });
      }
    }
    steps.push({ type: 'pass', arr: a.slice(), sorted: a.length - 1 - i, ops: ops, msg: 'Pass ' + (i+1) + ' done. Largest element settled.' });
  }
  steps.push({ type: 'done', arr: a.slice(), ops: ops, msg: '✅ Sorted in ' + ops + ' comparisons.' });
  return steps;
}

function agMergeSort(arr) {
  let steps = []; let ops = 0;
  function merge(a, lo, mid, hi) {
    let L = a.slice(lo, mid+1); let R = a.slice(mid+1, hi+1);
    let i = 0, j = 0, k = lo;
    while (i < L.length && j < R.length) {
      ops++;
      steps.push({ type: 'compare', arr: a.slice(), lo: lo, hi: hi, ops: ops, msg: 'Compare L[' + i + ']=' + L[i] + ' R[' + j + ']=' + R[j] });
      if (L[i] <= R[j]) { a[k++] = L[i++]; } else { a[k++] = R[j++]; }
    }
    while (i < L.length) a[k++] = L[i++];
    while (j < R.length) a[k++] = R[j++];
    steps.push({ type: 'merged', arr: a.slice(), lo: lo, hi: hi, ops: ops, msg: 'Merged [' + lo + '..' + hi + '] → ' + a.slice(lo, hi+1).join(',') });
  }
  function sort(a, lo, hi) {
    if (lo >= hi) return;
    let mid = Math.floor((lo + hi) / 2);
    sort(a, lo, mid);
    sort(a, mid+1, hi);
    merge(a, lo, mid, hi);
  }
  let a = arr.slice();
  sort(a, 0, a.length - 1);
  steps.push({ type: 'done', arr: a.slice(), ops: ops, msg: '✅ Merge Sort done in ' + ops + ' comparisons. Much fewer than Bubble Sort!' });
  return steps;
}

function agSelectionSort(arr) {
  let a = arr.slice(); let steps = []; let ops = 0;
  for (let i = 0; i < a.length - 1; i++) {
    let minIdx = i;
    for (let j = i+1; j < a.length; j++) {
      ops++;
      steps.push({ type: 'compare', arr: a.slice(), i: i, j: j, minIdx: minIdx, ops: ops, msg: 'Compare a[' + j + ']=' + a[j] + ' with current min a[' + minIdx + ']=' + a[minIdx] });
      if (a[j] < a[minIdx]) { minIdx = j; steps.push({ type: 'new-min', arr: a.slice(), minIdx: minIdx, ops: ops, msg: 'New min at ' + minIdx + '=' + a[minIdx] }); }
    }
    if (minIdx !== i) { let t = a[i]; a[i] = a[minIdx]; a[minIdx] = t; }
    steps.push({ type: 'placed', arr: a.slice(), i: i, ops: ops, msg: 'Placed ' + a[i] + ' at position ' + i + '. Always scanned entire remaining array!' });
  }
  steps.push({ type: 'done', arr: a.slice(), ops: ops, msg: '✅ Done in ' + ops + ' comparisons — always O(n²), even on sorted input.' });
  return steps;
}

function agHeapSort(arr) {
  let a = arr.slice(); let steps = []; let ops = 0;
  function heapify(n, i) {
    let largest = i, l = 2*i+1, r = 2*i+2;
    ops++;
    steps.push({ type: 'heapify', arr: a.slice(), i: i, ops: ops, msg: 'Heapify at ' + i + ': checking children ' + l + ' and ' + r });
    if (l < n && a[l] > a[largest]) largest = l;
    if (r < n && a[r] > a[largest]) largest = r;
    if (largest !== i) { let t = a[i]; a[i] = a[largest]; a[largest] = t; heapify(n, largest); }
  }
  for (let i = Math.floor(a.length/2)-1; i >= 0; i--) heapify(a.length, i);
  steps.push({ type: 'heap-built', arr: a.slice(), ops: ops, msg: 'Max-heap built in O(n). Now extracting elements.' });
  for (let i = a.length-1; i > 0; i--) {
    let t = a[0]; a[0] = a[i]; a[i] = t;
    steps.push({ type: 'extract', arr: a.slice(), i: i, ops: ops, msg: 'Extracted max ' + a[i] + ' → placed at end. Re-heapify in O(log n).' });
    heapify(i, 0);
  }
  steps.push({ type: 'done', arr: a.slice(), ops: ops, msg: '✅ Heap Sort done in ' + ops + ' comparisons. O(n log n) guaranteed.' });
  return steps;
}

function agNaiveFib(n) {
  let steps = []; let calls = 0;
  function fib(k) {
    calls++;
    steps.push({ type: 'call', n: k, calls: calls, msg: 'fib(' + k + ') called. Total calls so far: ' + calls });
    if (k <= 1) { steps.push({ type: 'base', n: k, calls: calls, msg: 'fib(' + k + ') = ' + k + ' (base case)' }); return k; }
    let a = fib(k-1); let b = fib(k-2);
    steps.push({ type: 'return', n: k, calls: calls, msg: 'fib(' + k + ') = fib(' + (k-1) + ') + fib(' + (k-2) + ') = ' + (a+b) });
    return a + b;
  }
  let result = fib(Math.min(n, 15));
  steps.push({ type: 'done', result: result, calls: calls, msg: '✅ fib(' + n + ')=' + result + ' in ' + calls + ' function calls. Exponential!' });
  return steps;
}

function agMemoFib(n) {
  let steps = []; let calls = 0; let memo = {};
  function fib(k) {
    calls++;
    if (memo[k] !== undefined) {
      steps.push({ type: 'cache-hit', n: k, calls: calls, msg: 'fib(' + k + '): cache hit! Return ' + memo[k] + ' instantly.' });
      return memo[k];
    }
    steps.push({ type: 'compute', n: k, calls: calls, msg: 'fib(' + k + '): computing (first time)' });
    if (k <= 1) { memo[k] = k; return k; }
    let result = fib(k-1) + fib(k-2);
    memo[k] = result;
    steps.push({ type: 'store', n: k, result: result, calls: calls, msg: 'Store fib(' + k + ')=' + result + ' in memo.' });
    return result;
  }
  let result = fib(Math.min(n, 15));
  steps.push({ type: 'done', result: result, calls: calls, msg: '✅ fib(' + n + ')=' + result + ' in only ' + calls + ' calls. O(n)!' });
  return steps;
}

function agNaiveString(arr, pat) {
  let text = arr.join(''); let steps = []; let ops = 0;
  for (let i = 0; i <= text.length - pat.length; i++) {
    let match = true;
    for (let j = 0; j < pat.length; j++) {
      ops++;
      steps.push({ type: 'compare', ti: i+j, pi: j, ops: ops, msg: 'text[' + (i+j) + ']="' + text[i+j] + '" vs pat[' + j + ']="' + pat[j] + '"' });
      if (text[i+j] !== pat[j]) {
        steps.push({ type: 'mismatch', i: i, j: j, ops: ops, msg: 'Mismatch at j=' + j + '. Slide pattern by 1. Start over from beginning of pattern.' });
        match = false; break;
      }
    }
    if (match) steps.push({ type: 'found', i: i, ops: ops, msg: '✅ Pattern found at index ' + i + ' after ' + ops + ' comparisons.' });
  }
  steps.push({ type: 'done', ops: ops, msg: 'Done. ' + ops + ' comparisons. O(n×m) worst case.' });
  return steps;
}

function agKMPString(arr, pat) {
  let text = arr.join(''); let steps = []; let ops = 0;
  // Build failure function
  let fail = new Array(pat.length).fill(0);
  let k = 0;
  for (let i = 1; i < pat.length; i++) {
    while (k > 0 && pat[i] !== pat[k]) k = fail[k-1];
    if (pat[i] === pat[k]) k++;
    fail[i] = k;
  }
  steps.push({ type: 'fail-built', fail: fail.slice(), ops: 0, msg: 'Failure function built: [' + fail.join(',') + ']. No re-examination of text chars!' });
  let j = 0;
  for (let i = 0; i < text.length; i++) {
    ops++;
    while (j > 0 && text[i] !== pat[j]) { steps.push({ type: 'jump', ti: i, pi: j, ops: ops, msg: 'Mismatch. Jump: j=' + j + '→' + fail[j-1] + ' (no re-scan of text!)' }); j = fail[j-1]; }
    if (text[i] === pat[j]) { steps.push({ type: 'match', ti: i, pi: j, ops: ops, msg: 'Match: text[' + i + ']=pat[' + j + ']' }); j++; }
    if (j === pat.length) {
      steps.push({ type: 'found', i: i - pat.length + 1, ops: ops, msg: '✅ Pattern found at index ' + (i - pat.length + 1) + '!' });
      j = fail[j-1];
    }
  }
  steps.push({ type: 'done', ops: ops, msg: 'Done. Only ' + ops + ' comparisons — O(n+m). Text chars never re-examined!' });
  return steps;
}

function agBFSWrong(dummy) {
  // Simplified demo showing BFS picking wrong path on weighted graph
  // Graph: 0→1(w=1), 0→2(w=1), 1→3(w=100), 2→3(w=1) — BFS says 0→1→3 (2 hops), wrong shortest
  let steps = [];
  let graph = [[1,2],[3],[3],[]];
  let weights = {0:{1:1,2:1},1:{3:100},2:{3:1}};
  let visited = {}; let ops = 0;
  let queue = [[0,0,0]]; // [node, hops, cost]
  steps.push({ type:'start', ops:0, msg:'BFS: Start at 0. Queue treats all edges as cost=1.' });
  while (queue.length) {
    ops++;
    let curr = queue.shift(); let node = curr[0]; let hops = curr[1]; let cost = curr[2];
    if (visited[node]) continue;
    visited[node] = true;
    steps.push({ type:'visit', node:node, hops:hops, cost:cost, ops:ops, msg:'Visit node ' + node + ' (hops=' + hops + ', actual cost=' + cost + ')' });
    if (node === 3) { steps.push({ type:'found', hops:hops, cost:cost, ops:ops, msg:'❌ BFS says shortest path cost=' + cost + ' via hops=' + hops + '. WRONG! Actual shortest=2 (path 0→2→3).' }); break; }
    (graph[node] || []).forEach(function(nb) { if (!visited[nb]) queue.push([nb, hops+1, cost+weights[node][nb]]); });
  }
  steps.push({ type:'done', ops:ops, msg:'BFS returned wrong weighted shortest path — it counts hops, not cost.' });
  return steps;
}

function agDijkstraCorrect(dummy) {
  let steps = [];
  let weights = {0:{1:1,2:1},1:{3:100},2:{3:1}};
  let dist = {0:0,1:Infinity,2:Infinity,3:Infinity};
  let visited = {}; let ops = 0;
  let pq = [{n:0,d:0}];
  steps.push({ type:'start', ops:0, msg:"Dijkstra: Start at 0. Priority queue ordered by cumulative cost." });
  while (pq.length) {
    pq.sort(function(a,b){return a.d-b.d;});
    let curr = pq.shift(); ops++;
    if (visited[curr.n]) continue;
    visited[curr.n] = true;
    steps.push({ type:'visit', node:curr.n, cost:curr.d, ops:ops, msg:'Visit node ' + curr.n + ' (cost=' + curr.d + ')' });
    if (curr.n === 3) { steps.push({ type:'found', cost:curr.d, ops:ops, msg:'✅ Dijkstra: shortest path cost=' + curr.d + ' (path 0→2→3). CORRECT!' }); break; }
    Object.keys(weights[curr.n] || {}).forEach(function(nb) {
      let nd = curr.d + weights[curr.n][nb];
      if (nd < dist[nb]) { dist[nb] = nd; pq.push({n:parseInt(nb),d:nd}); steps.push({ type:'relax', node:nb, cost:nd, ops:ops, msg:'Relax node ' + nb + ' → dist=' + nd }); }
    });
  }
  steps.push({ type:'done', ops:ops, msg:"Dijkstra correctly finds minimum-cost path on weighted graphs." });
  return steps;
}

function agMatrixSpace(n) {
  n = n || 10;
  let steps = [];
  let matrix = Math.pow(n, 2);
  let edges = n * 2;
  steps.push({ type:'matrix', ops:matrix, msg:'Adjacency Matrix: V²=' + n + '²=' + matrix + ' cells allocated.' });
  steps.push({ type:'edges', ops:edges, msg:'Actual edges in sparse graph: only ' + edges + '.' });
  steps.push({ type:'waste', ops:matrix-edges, msg:'Wasted cells: ' + (matrix-edges) + ' out of ' + matrix + ' (' + Math.round(100*(matrix-edges)/matrix) + '% empty!)' });
  steps.push({ type:'done', ops:matrix, msg:'Matrix allocated ' + matrix + ' cells for ' + edges + ' edges. Catastrophic waste.' });
  return steps;
}

function agListSpace(n) {
  n = n || 10;
  let steps = [];
  let edges = n * 2;
  let total = n + edges;
  steps.push({ type:'nodes', ops:n, msg:'Adjacency List: ' + n + ' node headers allocated.' });
  steps.push({ type:'edges', ops:edges, msg:'Only ' + edges + ' edge entries allocated — exactly the edges that exist.' });
  steps.push({ type:'done', ops:total, msg:'Total: ' + total + ' entries vs matrix\'s ' + Math.pow(n,2) + '. ' + Math.round(100*total/Math.pow(n,2)) + '% of matrix size.' });
  return steps;
}

function agRecursiveDFS(n) {
  n = n || 12;
  let steps = []; let depth = 0; let maxDepth = 0;
  function dfs(node) {
    depth++;
    if (depth > maxDepth) maxDepth = depth;
    steps.push({ type:'call', node:node, depth:depth, msg:'dfs(' + node + ') → stack frame #' + depth + ' allocated on call stack' });
    if (node >= n) { steps.push({ type:'base', node:node, depth:depth, msg:'Leaf node. Return. Frame freed.' }); depth--; return; }
    if (depth >= 15) { steps.push({ type:'overflow', depth:depth, msg:'⚠️ Stack depth=' + depth + '. On degenerate tree of ' + n + '000 nodes this would CRASH.' }); depth--; return; }
    dfs(node + 1);
    depth--;
  }
  dfs(0);
  steps.push({ type:'done', depth:maxDepth, msg:'Max stack depth: ' + maxDepth + '. On a 100,000-node degenerate tree: 100,000 frames × 8KB = 800MB stack. 💥 Crash.' });
  return steps;
}

function agIterativeDFS(n) {
  n = n || 12;
  let steps = []; let ops = 0;
  let stack = [0]; let visited = {};
  steps.push({ type:'start', ops:0, msg:'Iterative DFS: explicit stack on HEAP memory (gigabytes available, not just MB).' });
  while (stack.length && ops < 20) {
    ops++;
    let node = stack.pop();
    if (visited[node]) continue;
    visited[node] = true;
    steps.push({ type:'visit', node:node, stackSize:stack.length, ops:ops, msg:'Pop node ' + node + '. Heap stack size: ' + stack.length + '. No call stack frames!' });
    if (node < n) stack.push(node + 1);
  }
  steps.push({ type:'done', ops:ops, msg:'✅ Iterative DFS: uses heap memory. Handles 10M+ nodes trivially. No stack overflow possible.' });
  return steps;
}

function agFloydOps(n) {
  n = n || 8;
  let ops = Math.pow(n, 3);
  let steps = [];
  steps.push({ type:'start', ops:0, msg:'Floyd-Warshall: 3 nested loops over ' + n + ' nodes.' });
  for (let k = 0; k < Math.min(n, 4); k++) {
    for (let i = 0; i < Math.min(n, 3); i++) {
      steps.push({ type:'pass', k:k, i:i, ops:(k*n*n+i*n), msg:'Outer k=' + k + ', i=' + i + ': updating row ' + i + ' using node ' + k + ' as intermediate.' });
    }
  }
  steps.push({ type:'done', ops:ops, msg:'Total: ' + ops + ' operations for V=' + n + '. For V=1000: 10⁹ operations. Unusable for large sparse graphs.' });
  return steps;
}

function agJohnsonOps(n) {
  n = n || 8;
  let e = n * 2;
  let ops = Math.round(n*n*Math.log2(n) + n*e);
  let steps = [];
  steps.push({ type:'start', ops:0, msg:"Johnson's: Bellman-Ford once + Dijkstra from each node." });
  steps.push({ type:'bf', ops:n*e, msg:'Bellman-Ford: ' + (n*e) + ' ops to reweight edges (handles negatives).' });
  for (let i = 0; i < Math.min(n, 4); i++) {
    steps.push({ type:'dijkstra', i:i, ops:Math.round(e*Math.log2(n)), msg:'Dijkstra from node ' + i + ': ~' + Math.round(e*Math.log2(n)) + ' ops on sparse graph.' });
  }
  steps.push({ type:'done', ops:ops, msg:"Total: ~" + ops + " ops for V=" + n + ", E=" + e + ". Vs Floyd's " + Math.pow(n,3) + ". Johnson's wins on sparse!" });
  return steps;
}

function agSimpleHash(arr) {
  let steps = [];
  arr.forEach(function(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h += str.charCodeAt(i);
    h = h % 7;
    steps.push({ type:'hash', str:str, hash:h, msg:'hash("' + str + '") = sum(' + str.split('').map(function(c){return c.charCodeAt(0)}).join('+') + ') % 7 = ' + h });
  });
  steps.push({ type:'done', msg:'All ' + arr.length + ' anagrams hashed to same bucket! O(n) lookup — hash map destroyed.' });
  return steps;
}

function agPolynomialHash(arr) {
  let steps = [];
  let BASE = 31; let MOD = 1000003;
  arr.forEach(function(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * BASE + str.charCodeAt(i) - 96) % MOD;
    }
    steps.push({ type:'hash', str:str, hash:h, msg:'polyHash("' + str + '") = ' + h + ' (position-weighted — unique per anagram)' });
  });
  steps.push({ type:'done', msg:'All ' + arr.length + ' anagrams got DIFFERENT hashes. O(1) lookup preserved. ✅' });
  return steps;
}

/* ─── Modal race state ─── */
let agRaceState = {
  exhibit : null,
  oldSteps: [],
  newSteps: [],
  stepIdx : 0,
  playing : false,
  timer   : null,
};

/* ─── Render the exhibit grid ─── */
function agRenderGrid(exhibits) {
  let grid = document.getElementById('agGrid');
  if (!grid) return;

  grid.innerHTML = exhibits.map(function(ex) {
    return '<div class="ag-card" tabindex="0" role="button" data-id="' + ex.id + '" aria-label="Open exhibit: ' + agEsc(ex.deadName) + '">' +
      '<div class="ag-card-rip">' +
        '<span class="ag-card-skull">' + ex.skull + '</span>' +
        '<div class="ag-rip-text">R.I.P.</div>' +
        '<div class="ag-card-dead-name">' + agEsc(ex.deadName) + '</div>' +
        '<div class="ag-card-years">' + agEsc(ex.years) + '</div>' +
      '</div>' +
      '<div class="ag-card-body">' +
        '<div class="ag-card-epitaph">' + agEsc(ex.epitaph) + '</div>' +
        '<div class="ag-complexity-row">' +
          '<span class="ag-comp-old">' + agEsc(ex.oldComplexity) + '</span>' +
          '<span class="ag-comp-arrow">→</span>' +
          '<span class="ag-comp-new">' + agEsc(ex.newComplexity) + '</span>' +
        '</div>' +
        '<div class="ag-card-cause"><i class="fas fa-skull"></i> Cause of Death</div>' +
        '<div class="ag-card-cause-text">' + agEsc(ex.cause) + '</div>' +
        '<div class="ag-card-replacement">' +
          '<i class="fas fa-arrow-right"></i> Replaced by:' +
          '<span class="ag-card-replacement-name">' + agEsc(ex.replacement) + '</span>' +
        '</div>' +
        '<div class="ag-card-cta"><i class="fas fa-skull-crossbones"></i> View the Fatal Demo</div>' +
      '</div>' +
    '</div>';
  }).join('');

  grid.querySelectorAll('.ag-card').forEach(function(card) {
    let open = function() { agOpenModal(card.getAttribute('data-id')); };
    card.addEventListener('click', open);
    card.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
}

/* ─── Filter ─── */
function agInitFilter() {
  document.querySelectorAll('.ag-filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.ag-filter-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      let cat = btn.getAttribute('data-cat');
      let filtered = cat === 'all' ? AG_EXHIBITS : AG_EXHIBITS.filter(function(e) { return e.cat === cat; });
      agRenderGrid(filtered);
    });
  });
}

/* ─── Modal ─── */
function agInitModal() {
  let modal    = document.getElementById('agModal');
  let closeBtn = document.getElementById('agModalClose');
  if (!modal || !closeBtn) return;
  closeBtn.addEventListener('click', function() { modal.classList.remove('active'); agStopRace(); });
  modal.addEventListener('click', function(e) { if (e.target === modal) { modal.classList.remove('active'); agStopRace(); } });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { modal.classList.remove('active'); agStopRace(); } });
}

function agOpenModal(id) {
  let ex = AG_EXHIBITS.find(function(e) { return e.id === id; });
  if (!ex) return;

  let modal = document.getElementById('agModal');
  let body  = document.getElementById('agModalBody');
  if (!modal || !body) return;

  agStopRace();
  agRaceState.exhibit  = ex;
  agRaceState.oldSteps = [];
  agRaceState.newSteps = [];
  agRaceState.stepIdx  = 0;

  body.innerHTML =
    '<div class="ag-modal-header">' +
      '<div class="ag-modal-rip">R.I.P. — Exhibit ' + ex.skull + '</div>' +
      '<div class="ag-modal-title">' + agEsc(ex.deadName) + ' vs ' + agEsc(ex.replacement) + '</div>' +
      '<div class="ag-modal-epitaph">' + agEsc(ex.epitaph) + '</div>' +
    '</div>' +
    '<div class="ag-modal-inner">' +

      '<div class="ag-modal-section-title"><i class="fas fa-scroll"></i> The Story</div>' +
      '<div class="ag-lore-box">' + agEsc(ex.lore) + '</div>' +

      '<div class="ag-modal-section-title"><i class="fas fa-skull"></i> Fatal Flaw</div>' +
      '<div class="ag-flaw-box"><span class="ag-flaw-label">⚠️ Fatal Input</span>' + agEsc(ex.flaw) + '</div>' +

      '<div class="ag-modal-section-title"><i class="fas fa-flag-checkered"></i> Live Demo — Fatal Input Race</div>' +

      '<div class="ag-race-controls">' +
        '<button class="ag-race-btn ag-race-btn-run" id="agRaceRun"><i class="fas fa-play"></i> Run Race</button>' +
        '<button class="ag-race-btn ag-race-btn-step" id="agRaceStep" disabled><i class="fas fa-step-forward"></i> Step</button>' +
        '<button class="ag-race-btn ag-race-btn-reset" id="agRaceReset"><i class="fas fa-undo"></i> Reset</button>' +
        '<div class="ag-speed-wrap">' +
          '<span class="ag-speed-label">Speed:</span>' +
          '<input type="range" id="agSpeed" class="ag-speed-range" min="1" max="5" value="3" aria-label="Speed" />' +
        '</div>' +
      '</div>' +

      '<div class="ag-race-status" id="agRaceStatus">Click Run Race to see the fatal input in action.</div>' +
      '<div class="ag-winner-badge hidden" id="agWinnerBadge">🏆 <span id="agWinnerText"></span></div>' +

      '<div class="ag-race-wrap">' +
        '<div class="ag-race-panel ag-panel-old">' +
          '<div class="ag-race-panel-title"><i class="fas fa-skull"></i> ' + agEsc(ex.deadName) + ' <span style="opacity:0.6;font-size:0.65rem">(' + agEsc(ex.oldComplexity) + ')</span></div>' +
          '<div class="ag-viz-area" id="agOldViz"></div>' +
          '<div class="ag-ops-row"><span>Operations:</span><span class="ag-ops-val" id="agOldOps">0</span></div>' +
        '</div>' +
        '<div class="ag-race-panel ag-panel-new">' +
          '<div class="ag-race-panel-title"><i class="fas fa-check-circle"></i> ' + agEsc(ex.replacement) + ' <span style="opacity:0.6;font-size:0.65rem">(' + agEsc(ex.newComplexity) + ')</span></div>' +
          '<div class="ag-viz-area" id="agNewViz"></div>' +
          '<div class="ag-ops-row"><span>Operations:</span><span class="ag-ops-val" id="agNewOps">0</span></div>' +
        '</div>' +
      '</div>' +

      (ex.defaultInput ? agBuildCustomInput(ex) : '') +

    '</div>';

  // Wire up controls
  let runBtn   = document.getElementById('agRaceRun');
  let stepBtn  = document.getElementById('agRaceStep');
  let resetBtn = document.getElementById('agRaceReset');
  if (runBtn)   runBtn.addEventListener('click',   function() { agStartRace(ex); });
  if (stepBtn)  stepBtn.addEventListener('click',  agStepRace);
  if (resetBtn) resetBtn.addEventListener('click', function() { agResetRace(ex); });

  // Initial viz
  agRenderVizForExhibit(ex, [], [], document.getElementById('agOldViz'), document.getElementById('agNewViz'));

  modal.classList.add('active');
}

function agBuildCustomInput(ex) {
  if (!ex.defaultInput) return '';
  let placeholder = Array.isArray(ex.defaultInput) ? ex.defaultInput.join(', ') : '';
  return '<div class="ag-modal-section-title"><i class="fas fa-pencil-alt"></i> Try Your Own Input</div>' +
    '<div class="ag-custom-input">' +
      '<span class="ag-custom-label">Input:</span>' +
      '<input type="text" id="agCustomInput" class="ag-custom-text" value="' + agEsc(placeholder) + '" placeholder="comma separated values" />' +
      (ex.searchTarget !== undefined ? '<span class="ag-custom-label" style="margin-left:0.25rem">Target:</span><input type="text" id="agCustomTarget" class="ag-custom-text" style="max-width:80px" value="' + agEsc(String(ex.searchTarget)) + '" />' : '') +
      '<button class="ag-custom-btn" id="agCustomRun">Run on this input</button>' +
    '</div>';
}

/* ─── Race logic ─── */
function agStartRace(ex) {
  agStopRace();
  let input  = agGetInput(ex);
  let target = agGetTarget(ex);

  agRaceState.oldSteps = ex.runOld(input, target);
  agRaceState.newSteps = ex.runNew(input, target);
  agRaceState.stepIdx  = 0;

  let stepBtn = document.getElementById('agRaceStep');
  if (stepBtn) stepBtn.disabled = false;

  let badge = document.getElementById('agWinnerBadge');
  if (badge) badge.classList.add('hidden');

  let statusEl = document.getElementById('agRaceStatus');
  if (statusEl) statusEl.textContent = 'Race started! Watch the operations counter...';

  // Wire custom input button now that race is ready
  let customBtn = document.getElementById('agCustomRun');
  if (customBtn) {
    customBtn.onclick = function() { agStartRace(ex); };
  }

  agRaceState.playing = true;
  agPlayRace(ex);
}

function agGetInput(ex) {
  let el = document.getElementById('agCustomInput');
  if (el && el.value.trim()) {
    let vals = el.value.split(',').map(function(v) { return v.trim(); });
    if (ex.type === 'sort' || ex.type === 'search') {
      return vals.map(function(v) { return isNaN(v) ? v : parseInt(v); });
    }
    return vals;
  }
  return ex.defaultInput || [];
}

function agGetTarget(ex) {
  let el = document.getElementById('agCustomTarget');
  if (el && el.value.trim()) {
    let v = el.value.trim();
    return isNaN(v) ? v : parseInt(v);
  }
  return ex.searchTarget;
}

function agGetDelay() {
  let el = document.getElementById('agSpeed');
  return AG_SPEED[el ? el.value : 3] || 280;
}

function agPlayRace(ex) {
  if (!agRaceState.playing) return;
  let maxSteps = Math.max(agRaceState.oldSteps.length, agRaceState.newSteps.length);
  if (agRaceState.stepIdx >= maxSteps) {
    agRaceState.playing = false;
    agShowWinner(ex);
    return;
  }
  agApplyRaceStep(ex, agRaceState.stepIdx);
  agRaceState.stepIdx++;
  agRaceState.timer = setTimeout(function() { agPlayRace(ex); }, agGetDelay());
}

function agStepRace() {
  if (agRaceState.playing) { agStopRace(); return; }
  let ex = agRaceState.exhibit;
  if (!ex || agRaceState.oldSteps.length === 0) return;
  let maxSteps = Math.max(agRaceState.oldSteps.length, agRaceState.newSteps.length);
  if (agRaceState.stepIdx >= maxSteps) { agShowWinner(ex); return; }
  agApplyRaceStep(ex, agRaceState.stepIdx);
  agRaceState.stepIdx++;
}

function agApplyRaceStep(ex, idx) {
  let oldStep = agRaceState.oldSteps[idx] || agRaceState.oldSteps[agRaceState.oldSteps.length - 1];
  let newStep = agRaceState.newSteps[idx] || agRaceState.newSteps[agRaceState.newSteps.length - 1];

  let oldOpsEl = document.getElementById('agOldOps');
  let newOpsEl = document.getElementById('agNewOps');
  let statusEl = document.getElementById('agRaceStatus');
  let oldViz   = document.getElementById('agOldViz');
  let newViz   = document.getElementById('agNewViz');

  if (oldOpsEl && oldStep) oldOpsEl.textContent = oldStep.ops || 0;
  if (newOpsEl && newStep) newOpsEl.textContent = newStep.ops || 0;

  if (statusEl && oldStep) {
    statusEl.textContent = '👈 Dead algo: ' + oldStep.msg;
    if (newStep && newStep.msg !== oldStep.msg) statusEl.textContent += '   |   👉 Replacement: ' + newStep.msg;
  }

  agRenderVizForExhibit(ex, agRaceState.oldSteps.slice(0, idx+1), agRaceState.newSteps.slice(0, idx+1), oldViz, newViz);
}

function agShowWinner(ex) {
  let badge    = document.getElementById('agWinnerBadge');
  let textEl   = document.getElementById('agWinnerText');
  let oldOps   = (agRaceState.oldSteps[agRaceState.oldSteps.length-1] || {}).ops || 0;
  let newOps   = (agRaceState.newSteps[agRaceState.newSteps.length-1] || {}).ops || 0;
  let ratio    = oldOps > 0 && newOps > 0 ? Math.round(oldOps / newOps) : '∞';

  if (badge && textEl) {
    textEl.textContent = ex.replacement + ' wins! ' + oldOps + ' ops vs ' + newOps + ' ops (' + ratio + '× fewer)';
    badge.classList.remove('hidden');
  }

  let statusEl = document.getElementById('agRaceStatus');
  if (statusEl) statusEl.textContent = '💀 ' + ex.deadName + ': ' + oldOps + ' operations. ✅ ' + ex.replacement + ': ' + newOps + ' operations. ' + ratio + '× improvement.';
}

function agStopRace() {
  agRaceState.playing = false;
  if (agRaceState.timer) { clearTimeout(agRaceState.timer); agRaceState.timer = null; }
}

function agResetRace(ex) {
  agStopRace();
  agRaceState.oldSteps = [];
  agRaceState.newSteps = [];
  agRaceState.stepIdx  = 0;

  let oldOpsEl = document.getElementById('agOldOps');
  let newOpsEl = document.getElementById('agNewOps');
  let statusEl = document.getElementById('agRaceStatus');
  let badge    = document.getElementById('agWinnerBadge');
  let stepBtn  = document.getElementById('agRaceStep');

  if (oldOpsEl) oldOpsEl.textContent = '0';
  if (newOpsEl) newOpsEl.textContent = '0';
  if (statusEl) statusEl.textContent = 'Click Run Race to see the fatal input in action.';
  if (badge)    badge.classList.add('hidden');
  if (stepBtn)  stepBtn.disabled = true;

  let oldViz = document.getElementById('agOldViz');
  let newViz = document.getElementById('agNewViz');
  agRenderVizForExhibit(ex, [], [], oldViz, newViz);
}

/* ─── Visualization renderer ─── */
function agRenderVizForExhibit(ex, oldSteps, newSteps, oldVizEl, newVizEl) {
  if (!oldVizEl || !newVizEl) return;

  let oldLast = oldSteps.length > 0 ? oldSteps[oldSteps.length-1] : null;
  let newLast = newSteps.length > 0 ? newSteps[newSteps.length-1] : null;

  let type = ex.type;

  if (type === 'search') {
    agRenderSearchViz(oldVizEl, ex.defaultInput, oldSteps, 'old');
    agRenderSearchViz(newVizEl, ex.defaultInput, newSteps, 'new');
  } else if (type === 'sort') {
    agRenderSortViz(oldVizEl, ex.defaultInput, oldSteps, 'old');
    agRenderSortViz(newVizEl, ex.defaultInput, newSteps, 'new');
  } else if (type === 'string') {
    agRenderStringViz(oldVizEl, ex.defaultInput, oldSteps);
    agRenderStringViz(newVizEl, ex.defaultInput, newSteps);
  } else if (type === 'fib') {
    agRenderFibViz(oldVizEl, oldLast);
    agRenderFibViz(newVizEl, newLast);
  } else if (type === 'hash') {
    agRenderHashViz(oldVizEl, oldSteps);
    agRenderHashViz(newVizEl, newSteps);
  } else {
    // Generic: show last status message
    let msg = (oldLast && oldLast.msg) ? oldLast.msg : 'Waiting...';
    oldVizEl.innerHTML = '<div style="font-size:0.75rem;color:var(--text-secondary);line-height:1.5;padding:0.5rem">' + agEsc(msg) + '</div>';
    let nmsg = (newLast && newLast.msg) ? newLast.msg : 'Waiting...';
    newVizEl.innerHTML = '<div style="font-size:0.75rem;color:var(--text-secondary);line-height:1.5;padding:0.5rem">' + agEsc(nmsg) + '</div>';
  }
}

function agRenderSearchViz(el, arr, steps, side) {
  if (!el || !arr) return;
  let last = steps.length > 0 ? steps[steps.length-1] : null;
  let activeIdx = -1; let foundIdx = -1; let loIdx = -1; let hiIdx = -1; let midIdx = -1;
  if (last) {
    if (last.idx !== undefined) activeIdx = last.idx;
    if (last.type === 'found')  foundIdx  = last.idx !== undefined ? last.idx : (last.mid !== undefined ? last.mid : -1);
    if (last.lo  !== undefined) loIdx  = last.lo;
    if (last.hi  !== undefined) hiIdx  = last.hi;
    if (last.mid !== undefined) midIdx = last.mid;
  }
  el.innerHTML = '<div class="ag-cell-row">' + arr.map(function(v, i) {
    let cls = 'ag-cell';
    if (i === foundIdx)   cls += ' ag-cell-found';
    else if (i === midIdx)     cls += ' ag-cell-active';
    else if (i === activeIdx && side === 'old') cls += ' ag-cell-compare';
    else if (loIdx >= 0 && hiIdx >= 0 && i >= loIdx && i <= hiIdx) cls += ' ag-cell-current';
    return '<div class="' + cls + '">' + v + '</div>';
  }).join('') + '</div>';
}

function agRenderSortViz(el, arr, steps, side) {
  if (!el || !arr) return;
  let last = steps.length > 0 ? steps[steps.length-1] : null;
  let displayArr = last && last.arr ? last.arr : arr;
  let maxVal = Math.max.apply(null, displayArr);
  el.innerHTML = displayArr.map(function(v, i) {
    let h = maxVal > 0 ? Math.round((v / maxVal) * 70) : 10;
    let cls = side === 'old' ? '#ef4444' : '#22c55e';
    if (last && last.j !== undefined && (i === last.j || i === last.j+1)) cls = '#f59e0b';
    if (last && last.type === 'done') cls = '#22c55e';
    return '<div class="ag-bar" style="height:' + h + 'px;background:' + cls + '"></div>';
  }).join('');
}

function agRenderStringViz(el, arr, steps) {
  if (!el || !arr) return;
  let last = steps.length > 0 ? steps[steps.length-1] : null;
  let tiIdx = last && last.ti !== undefined ? last.ti : -1;
  let foundStart = last && last.i !== undefined && last.type === 'found' ? last.i : -1;
  el.innerHTML = '<div class="ag-cell-row">' + arr.map(function(v, i) {
    let cls = 'ag-cell';
    if (foundStart >= 0 && i >= foundStart && i < foundStart + 4) cls += ' ag-cell-found';
    else if (i === tiIdx) cls += ' ag-cell-active';
    return '<div class="' + cls + '">' + v + '</div>';
  }).join('') + '</div>';
}

function agRenderFibViz(el, step) {
  if (!el) return;
  let calls = step ? (step.calls || 0) : 0;
  let result = step ? (step.result || '') : '';
  el.innerHTML = '<div style="padding:0.5rem;font-family:Fira Code,monospace;font-size:0.75rem;color:var(--text-secondary)">' +
    '<div>Function calls: <span style="color:#ef4444;font-weight:700">' + calls + '</span></div>' +
    (result ? '<div>Result: <span style="color:#22c55e;font-weight:700">' + result + '</span></div>' : '') +
    (step && step.n !== undefined ? '<div>Currently: fib(' + step.n + ')</div>' : '') +
  '</div>';
}

function agRenderHashViz(el, steps) {
  if (!el) return;
  if (steps.length === 0) { el.innerHTML = '<div style="font-size:0.72rem;color:var(--text-secondary);padding:0.5rem">Waiting...</div>'; return; }
  el.innerHTML = '<div style="padding:0.25rem;width:100%">' +
    steps.filter(function(s) { return s.type === 'hash'; }).slice(-6).map(function(s) {
      return '<div style="font-size:0.65rem;font-family:Fira Code,monospace;color:var(--text-secondary);padding:0.15rem 0;border-bottom:1px solid rgba(255,255,255,0.04)">' +
        '"' + s.str + '" → <span style="color:' + (s.hash !== undefined ? '#22c55e' : '#ef4444') + ';font-weight:700">' + s.hash + '</span>' +
      '</div>';
    }).join('') +
  '</div>';
}

function agEsc(str) {
  let d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}