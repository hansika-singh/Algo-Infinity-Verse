// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Algorithm Genome only
// All globals prefixed ag2_ or AG2_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  ag2Init();
});

/* ─── Gene definitions ─── */
var AG2_GENES = {
  comparison:     { id:'comparison',     icon:'⚖️',  color:'#06b6d4', name:'Comparison',         desc:'Compares two values to determine order, equality, or priority.' },
  divide:         { id:'divide',         icon:'✂️',  color:'#a855f7', name:'Divide',              desc:'Splits the problem into smaller independent subproblems.' },
  merge:          { id:'merge',          icon:'🔗',  color:'#8b5cf6', name:'Merge',               desc:'Combines two sorted or processed halves into one result.' },
  swap:           { id:'swap',           icon:'🔄',  color:'#f59e0b', name:'Swap',                desc:'Exchanges the positions of two elements in-place.' },
  'greedy-pick':  { id:'greedy-pick',    icon:'🎯',  color:'#10b981', name:'Greedy Pick',         desc:'Always selects the locally optimal choice at each step without backtracking.' },
  'relax-edge':   { id:'relax-edge',     icon:'⬇️',  color:'#ef4444', name:'Edge Relaxation',     desc:'Updates the shortest known distance to a node via a new path.' },
  hash:           { id:'hash',           icon:'#️⃣', color:'#f97316', name:'Hashing',             desc:'Maps keys to array indices using a hash function for O(1) lookup.' },
  recurse:        { id:'recurse',        icon:'🌀',  color:'#ec4899', name:'Recursion',           desc:'The function calls itself on a smaller subproblem.' },
  backtrack:      { id:'backtrack',      icon:'↩️',  color:'#dc2626', name:'Backtracking',        desc:'Undoes the last choice and tries an alternative when stuck.' },
  memoize:        { id:'memoize',        icon:'💾',  color:'#7c3aed', name:'Memoization',         desc:'Caches subproblem results to avoid recomputation.' },
  'priority-queue': { id:'priority-queue', icon:'📊', color:'#0891b2', name:'Priority Queue',    desc:'Extracts the element with highest/lowest priority in O(log n).' },
  'union-find':   { id:'union-find',     icon:'🔗',  color:'#059669', name:'Union-Find',          desc:'Tracks connected components via disjoint set union with path compression.' },
  'sliding-window': { id:'sliding-window', icon:'🪟', color:'#db2777', name:'Sliding Window',   desc:'Maintains a moving subarray/subrange of fixed or variable size.' },
  'two-pointer':  { id:'two-pointer',    icon:'👆',  color:'#0284c7', name:'Two Pointers',        desc:'Uses two indices moving toward/away from each other on sorted data.' },
  'dp-table':     { id:'dp-table',       icon:'📋',  color:'#6d28d9', name:'DP Table',            desc:'Builds a 2D table of subproblem solutions bottom-up.' },
  'bfs-queue':    { id:'bfs-queue',      icon:'📬',  color:'#16a34a', name:'BFS Queue',           desc:'Explores neighbors level by level using a FIFO queue.' },
  'dfs-stack':    { id:'dfs-stack',      icon:'📚',  color:'#b45309', name:'DFS Stack',           desc:'Explores as deep as possible before backtracking via a stack.' },
  heapify:        { id:'heapify',        icon:'⛰️',  color:'#be185d', name:'Heapify',             desc:'Restores the heap property after insertion or deletion.' },
  'prefix-sum':   { id:'prefix-sum',     icon:'∑',   color:'#0369a1', name:'Prefix Sum',          desc:'Precomputes cumulative sums for O(1) range queries.' },
  modular:        { id:'modular',        icon:'🔁',  color:'#7e22ce', name:'Modular Arithmetic',  desc:'Uses modulo to avoid integer overflow in hash/string computations.' },
};

/* ─── Algorithm definitions ─── */
var AG2_ALGOS = [
  { id:'bubble-sort',      name:'Bubble Sort',      cat:'sort',    era:1956, inspired:['selection-sort'],    genes:['comparison','swap'] },
  { id:'selection-sort',   name:'Selection Sort',   cat:'sort',    era:1962, inspired:['insertion-sort'],    genes:['comparison','swap'] },
  { id:'insertion-sort',   name:'Insertion Sort',   cat:'sort',    era:1965, inspired:['merge-sort'],        genes:['comparison','swap','two-pointer'] },
  { id:'merge-sort',       name:'Merge Sort',        cat:'sort',    era:1945, inspired:['quick-sort'],       genes:['comparison','divide','merge','recurse'] },
  { id:'quick-sort',       name:'Quick Sort',        cat:'sort',    era:1959, inspired:['heap-sort'],        genes:['comparison','divide','swap','recurse'] },
  { id:'heap-sort',        name:'Heap Sort',         cat:'sort',    era:1964, inspired:[],                   genes:['comparison','swap','heapify'] },
  { id:'binary-search',    name:'Binary Search',     cat:'search',  era:1946, inspired:['bfs'],              genes:['comparison','divide','two-pointer'] },
  { id:'bfs',              name:'BFS',               cat:'graph',   era:1945, inspired:['dijkstra'],         genes:['comparison','bfs-queue'] },
  { id:'dfs',              name:'DFS',               cat:'graph',   era:1945, inspired:['backtrack-dfs'],    genes:['comparison','dfs-stack','recurse'] },
  { id:'backtrack-dfs',    name:'Backtracking',      cat:'graph',   era:1950, inspired:['bellman-ford'],     genes:['comparison','dfs-stack','recurse','backtrack'] },
  { id:'dijkstra',         name:"Dijkstra's",         cat:'graph',   era:1956, inspired:['astar'],           genes:['comparison','greedy-pick','relax-edge','priority-queue'] },
  { id:'astar',            name:'A* Search',          cat:'graph',   era:1968, inspired:['bellman-ford'],    genes:['comparison','greedy-pick','relax-edge','priority-queue','heapify'] },
  { id:'bellman-ford',     name:'Bellman-Ford',       cat:'graph',   era:1958, inspired:['floyd'],           genes:['comparison','relax-edge'] },
  { id:'floyd',            name:'Floyd-Warshall',     cat:'graph',   era:1962, inspired:['kruskal'],         genes:['comparison','relax-edge','dp-table'] },
  { id:'kruskal',          name:"Kruskal's MST",      cat:'graph',   era:1956, inspired:['prim'],            genes:['comparison','greedy-pick','union-find'] },
  { id:'prim',             name:"Prim's MST",         cat:'graph',   era:1957, inspired:['kmp'],             genes:['comparison','greedy-pick','priority-queue'] },
  { id:'kmp',              name:'KMP',                cat:'string',  era:1977, inspired:['rabin-karp'],      genes:['comparison','two-pointer','prefix-sum'] },
  { id:'rabin-karp',       name:'Rabin-Karp',         cat:'string',  era:1987, inspired:['lcs-dp'],         genes:['comparison','hash','sliding-window','modular'] },
  { id:'lcs-dp',           name:'LCS (DP)',            cat:'dp',      era:1970, inspired:['knapsack'],       genes:['comparison','dp-table','memoize'] },
  { id:'knapsack',         name:'0/1 Knapsack',       cat:'dp',      era:1957, inspired:[],                  genes:['comparison','dp-table','memoize','recurse'] },
];

/* ─── State ─── */
var ag2State = {
  selectedA      : null,
  selectedB      : null,
  highlightedGene: null,
};

/* ─── Build gene-to-algo index ─── */
var AG2_GENE_TO_ALGOS = {};
Object.keys(AG2_GENES).forEach(function(gid) { AG2_GENE_TO_ALGOS[gid] = []; });
AG2_ALGOS.forEach(function(algo) {
  algo.genes.forEach(function(gid) {
    if (AG2_GENE_TO_ALGOS[gid]) AG2_GENE_TO_ALGOS[gid].push(algo.id);
  });
});

/* ─── Compute similarity ─── */
function ag2Similarity(algoA, algoB) {
  var genesA = new Set(algoA.genes);
  var genesB = new Set(algoB.genes);
  var shared = algoA.genes.filter(function(g) { return genesB.has(g); });
  var union  = new Set(algoA.genes.concat(algoB.genes));
  return {
    shared    : shared,
    onlyA     : algoA.genes.filter(function(g) { return !genesB.has(g); }),
    onlyB     : algoB.genes.filter(function(g) { return !genesA.has(g); }),
    pct       : Math.round((shared.length / union.size) * 100),
    totalUnion: union.size,
  };
}

/* ─── Render algorithm grids ─── */
function ag2RenderAlgoGrids() {
  var gridA = document.getElementById('ag2GridA');
  var gridB = document.getElementById('ag2GridB');
  if (!gridA || !gridB) return;

  var html = AG2_ALGOS.map(function(algo) {
    return '<div class="ag2-algo-card" data-id="' + algo.id + '" ' +
      'tabindex="0" role="radio" aria-checked="false" ' +
      'aria-label="' + algo.name + '">' +
      algo.name +
    '</div>';
  }).join('');

  gridA.innerHTML = html;
  gridB.innerHTML = html;

  // Wire clicks for Grid A
  gridA.querySelectorAll('.ag2-algo-card').forEach(function(card) {
    card.addEventListener('click', function() { ag2SelectA(card.getAttribute('data-id')); });
    card.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ag2SelectA(card.getAttribute('data-id')); } });
  });

  // Wire clicks for Grid B
  gridB.querySelectorAll('.ag2-algo-card').forEach(function(card) {
    card.addEventListener('click', function() { ag2SelectB(card.getAttribute('data-id')); });
    card.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ag2SelectB(card.getAttribute('data-id')); } });
  });
}

function ag2SelectA(id) {
  if (ag2State.selectedA === id) return;
  ag2State.selectedA = id;
  ag2UpdateGridHighlights();
  ag2UpdateAll();
}

function ag2SelectB(id) {
  if (ag2State.selectedB === id) return;
  ag2State.selectedB = id;
  ag2UpdateGridHighlights();
  ag2UpdateAll();
}

function ag2UpdateGridHighlights() {
  var carriers = ag2State.highlightedGene ? (AG2_GENE_TO_ALGOS[ag2State.highlightedGene] || []) : [];

  // Grid A
  document.querySelectorAll('`#ag2GridA` .ag2-algo-card').forEach(function(card) {
    card.classList.remove('ag2-selected-a', 'ag2-selected-b', 'ag2-highlighted');
    card.setAttribute('aria-checked', 'false');
    if (card.getAttribute('data-id') === ag2State.selectedA) {
      card.classList.add('ag2-selected-a');
      card.setAttribute('aria-checked', 'true');
    } else if (ag2State.highlightedGene && carriers.indexOf(card.getAttribute('data-id')) !== -1) {
      card.classList.add('ag2-highlighted');
    }
  });

  // Grid B
  document.querySelectorAll('`#ag2GridB` .ag2-algo-card').forEach(function(card) {
    card.classList.remove('ag2-selected-a', 'ag2-selected-b', 'ag2-highlighted');
    card.setAttribute('aria-checked', 'false');
    if (card.getAttribute('data-id') === ag2State.selectedB) {
      card.classList.add('ag2-selected-b');
      card.setAttribute('aria-checked', 'true');
    } else if (ag2State.highlightedGene && carriers.indexOf(card.getAttribute('data-id')) !== -1) {
      card.classList.add('ag2-highlighted');
    }
  });
}


/* ─── Gene pool click: highlight all algorithms with that gene ─── */
function ag2HandleGenePoolClick(geneId) {
  // Toggle
  if (ag2State.highlightedGene === geneId) {
    ag2State.highlightedGene = null;
  } else {
    ag2State.highlightedGene = geneId;
  }

  // Update pool button states
  document.querySelectorAll('.ag2-pool-gene').forEach(function(btn) {
    btn.classList.toggle('ag2-pool-active', btn.getAttribute('data-gene') === ag2State.highlightedGene);
  });

  // Highlight algo cards in both grids that carry this gene
  var carriers = ag2State.highlightedGene ? (AG2_GENE_TO_ALGOS[ag2State.highlightedGene] || []) : [];

  ['ag2GridA','ag2GridB'].forEach(function(gridId) {
    document.querySelectorAll('#' + gridId + ' .ag2-algo-card').forEach(function(card) {
      var id = card.getAttribute('data-id');
      var isSelected = (id === ag2State.selectedA && gridId === 'ag2GridA') ||
                       (id === ag2State.selectedB && gridId === 'ag2GridB');
      card.classList.remove('ag2-highlighted');
      if (!isSelected && ag2State.highlightedGene && carriers.indexOf(id) !== -1) {
        card.classList.add('ag2-highlighted');
      }
    });
  });

  // Re-render strands with gene dimming
  ag2RenderStrands();
}

/* ─── Render DNA strands ─── */
function ag2RenderStrands() {
  var algoA = ag2State.selectedA ? AG2_ALGOS.find(function(a){return a.id===ag2State.selectedA;}) : null;
  var algoB = ag2State.selectedB ? AG2_ALGOS.find(function(a){return a.id===ag2State.selectedB;}) : null;

  var nameA = document.getElementById('ag2StrandNameA');
  var nameB = document.getElementById('ag2StrandNameB');
  var strandA = document.getElementById('ag2StrandA');
  var strandB = document.getElementById('ag2StrandB');
  if (!strandA || !strandB) return;

  if (nameA) nameA.textContent = algoA ? algoA.name : '—';
  if (nameB) nameB.textContent = algoB ? algoB.name : '—';

  if (!algoA) { strandA.innerHTML = '<div class="ag2-strand-placeholder">Select Algorithm A above</div>'; }
  if (!algoB) { strandB.innerHTML = '<div class="ag2-strand-placeholder">Select Algorithm B above</div>'; }

  var genesA = algoA ? new Set(algoA.genes) : new Set();
  var genesB = algoB ? new Set(algoB.genes) : new Set();

  // Build union gene list (in a consistent order matching gene pool order)
  var geneOrder = Object.keys(AG2_GENES);

  function buildStrand(algo, genesOther, sideClass) {
    if (!algo) return;
    var el = sideClass === 'A' ? strandA : strandB;
    var myGenes = new Set(algo.genes);
    var html = '';

    // Only show genes this algo has, but also show missing shared genes dimly
    var allRelevantGenes = new Set(algo.genes);
    if (ag2State.selectedA && ag2State.selectedB) {
      genesOther.forEach(function(g) { allRelevantGenes.add(g); });
    }

    geneOrder.forEach(function(gid) {
      if (!allRelevantGenes.has(gid)) return;
      var gene     = AG2_GENES[gid];
      var isIn     = myGenes.has(gid);
      var isShared = myGenes.has(gid) && genesOther.has(gid);
      var geneState;

      if (!isIn) {
        geneState = 'ag2-gene-dim';
      } else if (ag2State.highlightedGene) {
        geneState = gid === ag2State.highlightedGene ? 'ag2-gene-glow' : 'ag2-gene-dim';
      } else if (!ag2State.selectedA || !ag2State.selectedB) {
        geneState = 'ag2-gene-only';
      } else if (isShared) {
        geneState = 'ag2-gene-shared';
      } else {
        geneState = sideClass === 'A' ? 'ag2-gene-only' : 'ag2-gene-only-b';
      }

      var abbr = gid.split('-').map(function(w){return w[0].toUpperCase();}).join('').substring(0,3);
      var style = '--gc:' + gene.color + ';background:' + ag2hexToRgba(gene.color, 0.25) + ';border-color:' + gene.color + ';';

      html += '<div class="ag2-gene ' + geneState + '" data-gene="' + gid + '" tabindex="0" role="button" aria-label="Gene: ' + gene.name + '">' +
        '<div class="ag2-gene-seg" style="' + style + '">' +
          '<span>' + gene.icon + '</span>' +
        '</div>' +
        '<div class="ag2-gene-lbl">' + abbr + '</div>' +
      '</div>';
    });

    el.innerHTML = html || '<div class="ag2-strand-placeholder">No genes</div>';

    // Wire gene hover/click
    el.querySelectorAll('.ag2-gene').forEach(function(geneEl) {
      geneEl.addEventListener('mouseenter', function() { ag2ShowGeneDetail(geneEl.getAttribute('data-gene')); });
      geneEl.addEventListener('mouseleave', ag2HideGeneDetail);
      geneEl.addEventListener('focus',      function() { ag2ShowGeneDetail(geneEl.getAttribute('data-gene')); });
      geneEl.addEventListener('blur',       ag2HideGeneDetail);
      geneEl.addEventListener('click',      function() { ag2HandleGenePoolClick(geneEl.getAttribute('data-gene')); });
      geneEl.addEventListener('keydown',    function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ag2HandleGenePoolClick(geneEl.getAttribute('data-gene')); } });
    });
  }

  buildStrand(algoA, genesB, 'A');
  buildStrand(algoB, genesA, 'B');

  ag2DrawConnectors(algoA, algoB);
}

/* ─── Draw SVG connector lines between shared genes ─── */
function ag2DrawConnectors(algoA, algoB) {
  var connEl = document.getElementById('ag2Connectors');
  if (!connEl) return;

  if (!algoA || !algoB) { connEl.innerHTML = ''; return; }

  var genesA   = new Set(algoA.genes);
  var genesB   = new Set(algoB.genes);
  var sharedIds = algoA.genes.filter(function(g) { return genesB.has(g); });

  if (sharedIds.length === 0) { connEl.innerHTML = ''; return; }

  connEl.innerHTML = '<svg></svg>';
  var svg = connEl.querySelector('svg');

  // After a brief delay to allow DOM layout
  setTimeout(function() {
    svg.innerHTML = '';
    var connRect = connEl.getBoundingClientRect();

    sharedIds.forEach(function(geneId) {
      // Find gene elements in both strands
      var elA = document.querySelector('#ag2StrandA [data-gene="' + geneId + '"]');
      var elB = document.querySelector('#ag2StrandB [data-gene="' + geneId + '"]');
      if (!elA || !elB) return;

      var rA = elA.getBoundingClientRect();
      var rB = elB.getBoundingClientRect();

      // Center-X of each gene relative to connectors container
      var x1 = rA.left + rA.width / 2 - connRect.left;
      var x2 = rB.left + rB.width / 2 - connRect.left;
      var y1 = 0;
      var y2 = connEl.offsetHeight || 24;
      var color = AG2_GENES[geneId] ? AG2_GENES[geneId].color : '#22c55e';

      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('stroke-dasharray', '3 2');
      line.setAttribute('opacity', '0.6');
      svg.appendChild(line);
    });
  }, 60);
}

/* ─── Gene detail panel ─── */
function ag2ShowGeneDetail(geneId) {
  var el   = document.getElementById('ag2GeneDetail');
  var gene = AG2_GENES[geneId];
  if (!el || !gene) return;

  var carriers = (AG2_GENE_TO_ALGOS[geneId] || []).map(function(id) {
    var a = AG2_ALGOS.find(function(al){return al.id===id;});
    return a ? a.name : id;
  });

  el.innerHTML = '<div class="ag2-gene-detail-inner">' +
    '<span class="ag2-gd-icon">' + gene.icon + '</span>' +
    '<div class="ag2-gd-body">' +
      '<div class="ag2-gd-name">' + gene.name + '</div>' +
      '<div class="ag2-gd-desc">' + gene.desc + '</div>' +
      '<div class="ag2-gd-carriers">' +
        carriers.map(function(n) { return '<span class="ag2-carrier-chip">' + n + '</span>'; }).join('') +
      '</div>' +
    '</div>' +
  '</div>';

  el.style.borderColor = gene.color + '55';
}

function ag2HideGeneDetail() {
  // Keep visible — only reset on new selection
}

/* ─── Render similarity score and breakdown ─── */
function ag2RenderSimilarity() {
  var algoA = ag2State.selectedA ? AG2_ALGOS.find(function(a){return a.id===ag2State.selectedA;}) : null;
  var algoB = ag2State.selectedB ? AG2_ALGOS.find(function(a){return a.id===ag2State.selectedB;}) : null;

  var simVal = document.getElementById('ag2SimValue');
  var bkBody = document.getElementById('ag2BreakdownBody');

  if (!algoA || !algoB) {
    if (simVal) simVal.textContent = '—';
    if (bkBody) bkBody.innerHTML = '<div class="ag2-breakdown-placeholder">Select two algorithms to see the breakdown</div>';
    return;
  }

  var sim = ag2Similarity(algoA, algoB);
  if (simVal) simVal.textContent = sim.pct + '%';

  if (!bkBody) return;
  bkBody.innerHTML = ag2BkItem('Shared genes',    sim.shared.length, sim.totalUnion, 'ag2-bk-shared-fill') +
                     ag2BkItem('Only in ' + algoA.name, sim.onlyA.length, sim.totalUnion, 'ag2-bk-a-fill') +
                     ag2BkItem('Only in ' + algoB.name, sim.onlyB.length, sim.totalUnion, 'ag2-bk-b-fill') +
                     '<div style="margin-top:0.6rem;padding-top:0.6rem;border-top:1px solid var(--glass-border);font-size:0.72rem;color:var(--text-secondary)">' +
                       '<strong style="color:var(--text-primary)">Shared: </strong>' +
                       (sim.shared.length ? sim.shared.map(function(g){ return AG2_GENES[g] ? AG2_GENES[g].icon + ' ' + AG2_GENES[g].name : g; }).join(', ') : 'None') +
                     '</div>';
}

function ag2BkItem(label, count, total, fillClass) {
  var pct = total > 0 ? Math.round(count / total * 100) : 0;
  return '<div class="ag2-bk-item">' +
    '<div class="ag2-bk-label">' +
      '<span class="ag2-bk-name">' + label + '</span>' +
      '<span class="ag2-bk-pct">' + count + '/' + total + ' (' + pct + '%)</span>' +
    '</div>' +
    '<div class="ag2-bk-bar-track">' +
      '<div class="ag2-bk-bar-fill ' + fillClass + '" style="width:' + pct + '%"></div>' +
    '</div>' +
  '</div>';
}

/* ─── Render gene pool ─── */
function ag2RenderGenePool() {
  var poolEl = document.getElementById('ag2GenePool');
  if (!poolEl) return;

  poolEl.innerHTML = Object.keys(AG2_GENES).map(function(gid) {
    var gene  = AG2_GENES[gid];
    var count = (AG2_GENE_TO_ALGOS[gid] || []).length;
    return '<button class="ag2-pool-gene" data-gene="' + gid + '" aria-label="' + gene.name + ': ' + count + ' algorithms">' +
      '<span class="ag2-pool-gene-dot" style="background:' + gene.color + '"></span>' +
      gene.icon + ' ' + gene.name +
      '<span class="ag2-pool-gene-count">×' + count + '</span>' +
    '</button>';
  }).join('');

  poolEl.querySelectorAll('.ag2-pool-gene').forEach(function(btn) {
    btn.addEventListener('click', function() { ag2HandleGenePoolClick(btn.getAttribute('data-gene')); });
  });
}

/* ─── Evolutionary lineage canvas ─── */
var AG2_LINEAGE_NODES = [
  { id:'bubble-sort',    label:'Bubble Sort',    x:0.05, y:0.15 },
  { id:'selection-sort', label:'Selection Sort', x:0.05, y:0.4  },
  { id:'insertion-sort', label:'Insertion Sort', x:0.05, y:0.65 },
  { id:'binary-search',  label:'Binary Search',  x:0.05, y:0.88 },
  { id:'merge-sort',     label:'Merge Sort',     x:0.22, y:0.15 },
  { id:'quick-sort',     label:'Quick Sort',     x:0.22, y:0.4  },
  { id:'heap-sort',      label:'Heap Sort',      x:0.22, y:0.65 },
  { id:'bfs',            label:'BFS',            x:0.38, y:0.12 },
  { id:'dfs',            label:'DFS',            x:0.38, y:0.38 },
  { id:'backtrack-dfs',  label:'Backtracking',   x:0.38, y:0.62 },
  { id:'kruskal',        label:"Kruskal's",      x:0.38, y:0.86 },
  { id:'dijkstra',       label:"Dijkstra's",     x:0.55, y:0.12 },
  { id:'prim',           label:"Prim's",         x:0.55, y:0.38 },
  { id:'bellman-ford',   label:'Bellman-Ford',   x:0.55, y:0.62 },
  { id:'floyd',          label:'Floyd-Warshall', x:0.55, y:0.86 },
  { id:'astar',          label:'A*',             x:0.72, y:0.12 },
  { id:'kmp',            label:'KMP',            x:0.72, y:0.38 },
  { id:'rabin-karp',     label:'Rabin-Karp',     x:0.72, y:0.62 },
  { id:'lcs-dp',         label:'LCS (DP)',       x:0.88, y:0.35 },
  { id:'knapsack',       label:'Knapsack',       x:0.88, y:0.65 },
];

function ag2DrawLineage() {
  var canvas = document.getElementById('ag2LineageCanvas');
  if (!canvas) return;

  var wrap = canvas.parentElement;
  var W = wrap.clientWidth || 800;
  var H = Math.max(220, Math.round(W * 0.28));
  canvas.width  = W;
  canvas.height = H;
  var ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, W, H);

  // Build node positions
  var positions = {};
  AG2_LINEAGE_NODES.forEach(function(n) {
    positions[n.id] = { x: Math.round(n.x * W), y: Math.round(n.y * H) };
  });

  // Draw edges first
  AG2_ALGOS.forEach(function(algo) {
    var from = positions[algo.id];
    if (!from) return;
    algo.inspired.forEach(function(toId) {
      var to = positions[toId];
      if (!to) return;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      // Slight curve
      var mx = (from.x + to.x) / 2;
      var my = (from.y + to.y) / 2 - 8;
      ctx.quadraticCurveTo(mx, my, to.x, to.y);
      ctx.strokeStyle = 'rgba(100,116,139,0.3)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Arrow head at destination
      var angle = Math.atan2(to.y - my, to.x - mx);
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(to.x - 8 * Math.cos(angle - 0.4), to.y - 8 * Math.sin(angle - 0.4));
      ctx.lineTo(to.x - 8 * Math.cos(angle + 0.4), to.y - 8 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fillStyle = 'rgba(100,116,139,0.4)';
      ctx.fill();
    });
  });

  // Draw nodes
  AG2_LINEAGE_NODES.forEach(function(n) {
    var pos   = positions[n.id];
    var isA   = n.id === ag2State.selectedA;
    var isB   = n.id === ag2State.selectedB;
    var isAnc = ag2IsAncestor(n.id);

    var fillColor   = 'rgba(255,255,255,0.06)';
    var strokeColor = 'rgba(100,116,139,0.3)';
    var textColor   = '#64748b';
    var radius      = 18;

    if (isA)   { fillColor = 'rgba(0,212,255,0.2)';  strokeColor = '#00d4ff'; textColor = '#00d4ff'; radius = 22; }
    if (isB)   { fillColor = 'rgba(168,85,247,0.2)'; strokeColor = '#a855f7'; textColor = '#a855f7'; radius = 22; }
    if (isAnc) { fillColor = 'rgba(34,197,94,0.15)'; strokeColor = '#22c55e'; textColor = '#22c55e'; }

    // Glow for selected
    if (isA || isB) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + 4, 0, Math.PI * 2);
      ctx.fillStyle = isA ? 'rgba(0,212,255,0.08)' : 'rgba(168,85,247,0.08)';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle   = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth   = isA || isB ? 2.5 : 1.5;
    ctx.stroke();

    // Label
    ctx.fillStyle    = textColor;
    ctx.font         = (isA || isB ? 'bold ' : '') + Math.max(9, Math.round(W * 0.012)) + 'px Poppins,sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    // Truncate long names
    var label = n.label.length > 10 ? n.label.substring(0, 9) + '…' : n.label;
    ctx.fillText(label, pos.x, pos.y);
  });
}

function ag2IsAncestor(id) {
  if (!ag2State.selectedA || !ag2State.selectedB) return false;
  // An ancestor is any node that both A and B are inspired by (transitively simplified)
  var algoA = AG2_ALGOS.find(function(a){return a.id===ag2State.selectedA;});
  var algoB = AG2_ALGOS.find(function(a){return a.id===ag2State.selectedB;});
  if (!algoA || !algoB) return false;

  // Check if id is an ancestor of selectedA or selectedB
  function getAncestors(algoId, visited) {
    if (!visited) visited = {};
    if (visited[algoId]) return visited;
    visited[algoId] = true;
    var algo = AG2_ALGOS.find(function(a){return a.id===algoId;});
    if (!algo) return visited;
    algo.inspired.forEach(function(iId) { getAncestors(iId, visited); });
    return visited;
  }

  var ancestorsA = getAncestors(ag2State.selectedA);
  var ancestorsB = getAncestors(ag2State.selectedB);
  return ancestorsA[id] && ancestorsB[id] &&
         id !== ag2State.selectedA && id !== ag2State.selectedB;
}

/* ─── Main update ─── */
function ag2UpdateAll() {
  ag2RenderStrands();
  ag2RenderSimilarity();
  ag2DrawLineage();
  // Reset gene detail
  var det = document.getElementById('ag2GeneDetail');
  if (det) det.innerHTML = '<div class="ag2-gene-detail-placeholder">Hover a gene segment to see details</div>';
}

/* ─── Hex to rgba ─── */
function ag2hexToRgba(hex, alpha) {
  var r = parseInt(hex.slice(1,3),16);
  var g = parseInt(hex.slice(3,5),16);
  var b = parseInt(hex.slice(5,7),16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

/* ─── Init ─── */
function ag2Init() {
  ag2RenderAlgoGrids();
  ag2RenderGenePool();
  ag2DrawLineage();

  // Default selection
  ag2SelectA('merge-sort');
  ag2SelectB('quick-sort');

  // Redraw lineage on resize
  window.addEventListener('resize', function() {
    ag2DrawLineage();
    ag2DrawConnectors(
      ag2State.selectedA ? AG2_ALGOS.find(function(a){return a.id===ag2State.selectedA;}) : null,
      ag2State.selectedB ? AG2_ALGOS.find(function(a){return a.id===ag2State.selectedB;}) : null
    );
  });
}