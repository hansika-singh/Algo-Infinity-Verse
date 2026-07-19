/**
 * parser-engine.js
 * Implements a complete LL(1) / LR(1) Parsing and Visualization Engine.
 */

document.addEventListener('DOMContentLoaded', () => {
  initParserApp();
});

// Default grammars for quick load
const DEFAULT_GRAMMARS = {
  LL1: `E -> T E'
E' -> + T E' | epsilon
T -> F T'
T' -> * F T' | epsilon
F -> ( E ) | id`,
  LR1: `S -> E
E -> E + T | T
T -> T * F | F
F -> ( E ) | id`,
};

// DOM Elements
let els = {};
function cacheElements() {
  els = {
    grammarInput: document.getElementById('grammarInput'),
    parserTypeSelect: document.getElementById('parserTypeSelect'),
    stringInput: document.getElementById('stringInput'),
    btnBuild: document.getElementById('btnBuild'),
    engineLogs: document.getElementById('engineLogs'),

    tabSetsBtn: document.getElementById('tabSetsBtn'),
    tabTableBtn: document.getElementById('tabTableBtn'),
    tabLrSetsBtn: document.getElementById('tabLrSetsBtn'),

    setsEmpty: document.getElementById('setsEmpty'),
    setsGrid: document.getElementById('setsGrid'),

    tableEmpty: document.getElementById('tableEmpty'),
    tableContent: document.getElementById('tableContent'),
    conflictBanner: document.getElementById('conflictBanner'),
    conflictText: document.getElementById('conflictText'),
    parseTable: document.getElementById('parseTable'),
    parseTableHead: document.getElementById('parseTableHead'),
    parseTableBody: document.getElementById('parseTableBody'),

    lrSetsEmpty: document.getElementById('lrSetsEmpty'),
    itemSetsContainer: document.getElementById('itemSetsContainer'),

    btnStep: document.getElementById('btnStep'),
    btnPlay: document.getElementById('btnPlay'),
    btnReset: document.getElementById('btnReset'),

    stackContent: document.getElementById('stackContent'),
    tapeCells: document.getElementById('tapeCells'),
    treeSvg: document.getElementById('treeSvg'),
    simLogs: document.getElementById('simLogs'),
    engineBadge: document.getElementById('engineBadge'),
  };
}

// App State
let gGrammar = null;
let gFirstSets = {};
let gFollowSets = {};
let gLL1Table = null;
let gLR1Collection = [];
let gLR1ActionTable = null;
let gLR1GotoTable = null;
let gConflicts = [];

// Simulation State
let gSimType = ''; // "LL1" or "LR1"
let gSimStack = []; // contains symbols (LL1) or alternating states & symbols/nodes (LR1)
let gSimInput = []; // tokens array
let gSimInputPointer = 0;
let gSimTreeNodes = []; // array of node objects for layout
let gSimActiveNodeId = null;
let gSimInterval = null;
let gSimIsPlaying = false;
let gSimDone = false;
let gSimError = false;
let gLL1TreeStack = []; // LL1 specific tree node trace pointer stack

// AST Node construction
let gNodeIdCounter = 0;
class TreeNode {
  constructor(symbol, isTerminal = false) {
    this.id = `n_${++gNodeIdCounter}`;
    this.symbol = symbol;
    this.isTerminal = isTerminal;
    this.children = [];
    this.x = 0;
    this.y = 0;
    this.depth = 0;
  }
}

function initParserApp() {
  cacheElements();

  // Set default grammar
  els.grammarInput.value = DEFAULT_GRAMMARS.LL1;

  // Wire main events
  els.btnBuild.addEventListener('click', handleBuildParser);
  els.parserTypeSelect.addEventListener('change', handleParserTypeChange);

  // Simulation controls
  els.btnStep.addEventListener('click', stepSimulation);
  els.btnPlay.addEventListener('click', togglePlaySimulation);
  els.btnReset.addEventListener('click', resetSimulation);

  // Tab controls
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.pe-tab-content').forEach((c) => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetId).classList.add('active');
    });
  });

  logEngine('Awaiting configuration. Select a parser type and click Build.', 'sys');
}

function handleParserTypeChange() {
  const type = els.parserTypeSelect.value;
  els.grammarInput.value = DEFAULT_GRAMMARS[type];

  if (type === 'LR1') {
    els.tabLrSetsBtn.style.display = 'block';
  } else {
    els.tabLrSetsBtn.style.display = 'none';
    // If we were on LR1 tab, switch back to FIRST/FOLLOW
    if (els.tabLrSetsBtn.classList.contains('active')) {
      els.tabSetsBtn.click();
    }
  }

  resetSimState();
  logEngine(
    `Switched to ${type} parser. Loaded default grammar. Click Build to generate tables.`,
    'sys'
  );
}

function logEngine(msg, type = 'sys') {
  const line = document.createElement('div');
  line.className = `log-line ${type}`;
  line.textContent = type === 'sys' ? `> ${msg}` : msg;
  els.engineLogs.appendChild(line);
  els.engineLogs.scrollTop = els.engineLogs.scrollHeight;
}

function updateEngineBadge(status, type = 'ready') {
  els.engineBadge.className = `engine-badge ${type}`;
  if (type === 'active') {
    els.engineBadge.innerHTML = `<i class="fas fa-cog fa-spin"></i> Engine: Running`;
  } else if (type === 'error') {
    els.engineBadge.innerHTML = `<i class="fas fa-times-circle"></i> Engine: Error`;
  } else {
    els.engineBadge.innerHTML = `<i class="fas fa-check-circle"></i> Engine: ${status}`;
  }
}

// ==========================================
// 1. CFG GRAMMAR PARSING
// ==========================================
class CFGGrammar {
  constructor(rawText) {
    this.nonTerminals = new Set();
    this.terminals = new Set();
    this.productions = []; // array of { lhs, rhs: [] }
    this.startSymbol = null;
    this.parse(rawText);
  }

  parse(rawText) {
    const lines = rawText.split('\n');

    // Phase 1: Parse Productions and LHS non-terminals
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#') || line.startsWith('//')) continue;

      const parts = line.split('->');
      if (parts.length !== 2) {
        throw new Error(`Invalid rule syntax: "${line}". Missing "->"`);
      }

      const lhs = parts[0].trim();
      if (!lhs) {
        throw new Error(`Empty LHS in rule: "${line}"`);
      }

      this.nonTerminals.add(lhs);
      if (!this.startSymbol) this.startSymbol = lhs;

      const alternatives = parts[1].split('|');
      for (let alt of alternatives) {
        alt = alt.trim();
        let rhsSymbols = [];
        if (alt) {
          // Check if spaces exist. If yes, split by spaces, else parse character sequences.
          if (alt.includes(' ')) {
            rhsSymbols = alt
              .split(/\s+/)
              .map((s) => s.trim())
              .filter(Boolean);
          } else {
            // Fallback: split by chars but keep special words
            if (alt === 'epsilon' || alt === 'ε') {
              rhsSymbols = ['epsilon'];
            } else if (alt === 'id') {
              rhsSymbols = ['id'];
            } else {
              rhsSymbols = alt.split('');
            }
          }
        } else {
          rhsSymbols = ['epsilon'];
        }

        // Map epsilon representation
        rhsSymbols = rhsSymbols.map((sym) => (sym === 'ε' || sym === 'epsilon' ? 'epsilon' : sym));

        this.productions.push({ lhs, rhs: rhsSymbols });
      }
    }

    // Phase 2: Identify terminals
    for (const prod of this.productions) {
      for (const sym of prod.rhs) {
        if (!this.nonTerminals.has(sym) && sym !== 'epsilon') {
          this.terminals.add(sym);
        }
      }
    }

    if (this.productions.length === 0) {
      throw new Error('No valid rules found in grammar!');
    }
  }
}

// ==========================================
// 2. FIRST & FOLLOW SET GENERATOR
// ==========================================
function computeFirstAndFollow(grammar) {
  const first = {};
  const follow = {};

  // Initialize
  for (const nt of grammar.nonTerminals) {
    first[nt] = new Set();
    follow[nt] = new Set();
  }

  // --- Compute FIRST sets ---
  let changed = true;
  let iterationLimit = 100;

  while (changed && iterationLimit-- > 0) {
    changed = false;

    for (const prod of grammar.productions) {
      const A = prod.lhs;
      const rhs = prod.rhs;
      const beforeSize = first[A].size;

      // Rule: If RHS is epsilon, add epsilon to FIRST(A)
      if (rhs.length === 1 && rhs[0] === 'epsilon') {
        first[A].add('epsilon');
      } else {
        // Rule: If RHS starts with terminal, add terminal to FIRST(A)
        let allEpsilon = true;
        for (const symbol of rhs) {
          if (grammar.terminals.has(symbol)) {
            first[A].add(symbol);
            allEpsilon = false;
            break;
          } else if (grammar.nonTerminals.has(symbol)) {
            // Add FIRST(symbol) except epsilon
            for (const fSym of first[symbol]) {
              if (fSym !== 'epsilon') {
                first[A].add(fSym);
              }
            }

            if (!first[symbol].has('epsilon')) {
              allEpsilon = false;
              break;
            }
          } else {
            // Unrecognized terminal, add as terminal
            grammar.terminals.add(symbol);
            first[A].add(symbol);
            allEpsilon = false;
            break;
          }
        }

        if (allEpsilon) {
          first[A].add('epsilon');
        }
      }

      if (first[A].size > beforeSize) {
        changed = true;
      }
    }
  }

  // --- Compute FOLLOW sets ---
  // Rule: Add $ to FOLLOW(StartSymbol)
  follow[grammar.startSymbol].add('$');

  changed = true;
  iterationLimit = 100;
  while (changed && iterationLimit-- > 0) {
    changed = false;

    for (const prod of grammar.productions) {
      const A = prod.lhs;
      const rhs = prod.rhs;

      // E.g., A -> X1 X2 ... Xk
      for (let i = 0; i < rhs.length; i++) {
        const B = rhs[i];
        if (!grammar.nonTerminals.has(B)) continue; // Only compute FOLLOW for non-terminals

        const beforeSize = follow[B].size;

        // Rule: For production A -> alpha B beta, add FIRST(beta) except epsilon to FOLLOW(B)
        let allEpsilon = true;
        for (let j = i + 1; j < rhs.length; j++) {
          const nextSym = rhs[j];
          if (grammar.terminals.has(nextSym)) {
            follow[B].add(nextSym);
            allEpsilon = false;
            break;
          } else if (grammar.nonTerminals.has(nextSym)) {
            for (const fSym of first[nextSym]) {
              if (fSym !== 'epsilon') {
                follow[B].add(fSym);
              }
            }
            if (!first[nextSym].has('epsilon')) {
              allEpsilon = false;
              break;
            }
          }
        }

        // Rule: If beta is empty or FIRST(beta) contains epsilon, add FOLLOW(A) to FOLLOW(B)
        if (allEpsilon) {
          for (const folSym of follow[A]) {
            follow[B].add(folSym);
          }
        }

        if (follow[B].size > beforeSize) {
          changed = true;
        }
      }
    }
  }

  return { first, follow };
}

// Compute FIRST for a string of symbols
function computeFirstOfString(symbols, firstSets, terminals) {
  const result = new Set();
  let allEpsilon = true;

  for (const sym of symbols) {
    if (sym === 'epsilon') {
      break;
    } else if (terminals.has(sym)) {
      result.add(sym);
      allEpsilon = false;
      break;
    } else if (firstSets[sym]) {
      for (const f of firstSets[sym]) {
        if (f !== 'epsilon') result.add(f);
      }
      if (!firstSets[sym].has('epsilon')) {
        allEpsilon = false;
        break;
      }
    } else {
      // Treat as terminal fallback
      result.add(sym);
      allEpsilon = false;
      break;
    }
  }

  if (allEpsilon) {
    result.add('epsilon');
  }

  return result;
}

// ==========================================
// 3. LL(1) PARSE TABLE GENERATOR
// ==========================================
function buildLL1Table(grammar, firstSets, followSets) {
  const table = {};
  const conflicts = [];

  for (const nt of grammar.nonTerminals) {
    table[nt] = {};
    for (const t of grammar.terminals) {
      table[nt][t] = [];
    }
    table[nt]['$'] = [];
  }

  grammar.productions.forEach((prod, index) => {
    const A = prod.lhs;
    const rhs = prod.rhs;

    // Compute FIRST(rhs)
    const firstRhs = computeFirstOfString(rhs, firstSets, grammar.terminals);

    for (const symbol of firstRhs) {
      if (symbol !== 'epsilon') {
        table[A][symbol].push(index);
        if (table[A][symbol].length > 1) {
          conflicts.push({ nonTerminal: A, terminal: symbol, rules: table[A][symbol] });
        }
      }
    }

    if (firstRhs.has('epsilon')) {
      for (const symbol of followSets[A]) {
        table[A][symbol].push(index);
        if (table[A][symbol].length > 1) {
          conflicts.push({ nonTerminal: A, terminal: symbol, rules: table[A][symbol] });
        }
      }
    }
  });

  return { table, conflicts };
}

// ==========================================
// 4. LR(1) PARSER CANONICAL COLLECTION BUILDER
// ==========================================
class LR1Item {
  constructor(prodIndex, lhs, rhs, dot, lookahead) {
    this.prodIndex = prodIndex; // augmented index is -1
    this.lhs = lhs;
    this.rhs = rhs; // array of symbols
    this.dot = dot; // integer pointer position (0 to rhs.length)
    this.lookahead = lookahead; // string terminal symbol
    this.key = `${this.prodIndex}:${this.lhs}->${this.rhs.join(' ')}:${this.dot}:${this.lookahead}`;
  }

  isCompleted() {
    return this.dot === this.rhs.length || (this.rhs.length === 1 && this.rhs[0] === 'epsilon');
  }

  getNextSymbol() {
    if (this.isCompleted()) return null;
    return this.rhs[this.dot];
  }

  getNextBeta() {
    // Returns the string list of symbols after the next symbol
    if (this.dot + 1 >= this.rhs.length) return [];
    return this.rhs.slice(this.dot + 1);
  }

  moveDot() {
    return new LR1Item(this.prodIndex, this.lhs, this.rhs, this.dot + 1, this.lookahead);
  }
}

function lr1Closure(itemSet, grammar, firstSets) {
  const closure = new Map();
  const queue = [];

  for (const item of itemSet) {
    closure.set(item.key, item);
    queue.push(item);
  }

  let loopGuard = 1000;
  while (queue.length > 0 && loopGuard-- > 0) {
    const item = queue.shift();
    const B = item.getNextSymbol();

    // If the dot is before a non-terminal B
    if (B && grammar.nonTerminals.has(B)) {
      const beta = item.getNextBeta();
      // Lookahead targets are FIRST(beta a)
      const betaA = [...beta, item.lookahead];
      const firstBetaA = computeFirstOfString(betaA, firstSets, grammar.terminals);

      grammar.productions.forEach((prod, index) => {
        if (prod.lhs === B) {
          for (const b of firstBetaA) {
            const newItem = new LR1Item(index, prod.lhs, prod.rhs, 0, b);
            if (!closure.has(newItem.key)) {
              closure.set(newItem.key, newItem);
              queue.push(newItem);
            }
          }
        }
      });
    }
  }

  return Array.from(closure.values());
}

function lr1Goto(itemSet, symbol, grammar, firstSets) {
  const moved = [];
  for (const item of itemSet) {
    if (item.getNextSymbol() === symbol) {
      moved.push(item.moveDot());
    }
  }
  return lr1Closure(moved, grammar, firstSets);
}

function getLR1SetKey(itemSet) {
  // Sort items to get a deterministic key representation for the state
  const keys = itemSet.map((it) => it.key).sort();
  return keys.join('|');
}

function buildLR1CanonicalCollection(grammar, firstSets) {
  // Augment Grammar: S' -> StartSymbol
  const augmentedProd = { lhs: grammar.startSymbol + "'", rhs: [grammar.startSymbol] };
  const startItem = new LR1Item(-1, augmentedProd.lhs, augmentedProd.rhs, 0, '$');

  const initialSet = lr1Closure([startItem], grammar, firstSets);

  const states = [initialSet];
  const stateMap = new Map();
  stateMap.set(getLR1SetKey(initialSet), 0);

  const transitions = []; // list of { from, symbol, to }

  let i = 0;
  let loopGuard = 500;

  while (i < states.length && loopGuard-- > 0) {
    const I = states[i];

    // Collect all symbols that follow the dot in set I
    const symbols = new Set();
    for (const item of I) {
      const nextSym = item.getNextSymbol();
      if (nextSym) symbols.add(nextSym);
    }

    for (const sym of symbols) {
      const nextSet = lr1Goto(I, sym, grammar, firstSets);
      if (nextSet.length === 0) continue;

      const nextKey = getLR1SetKey(nextSet);
      let nextIndex = stateMap.get(nextKey);

      if (nextIndex === undefined) {
        nextIndex = states.length;
        states.push(nextSet);
        stateMap.set(nextKey, nextIndex);
      }

      transitions.push({ from: i, symbol: sym, to: nextIndex });
    }
    i++;
  }

  return { states, transitions };
}

function buildLR1Tables(grammar, states, transitions) {
  const actionTable = [];
  const gotoTable = [];
  const conflicts = [];

  // Initialize empty cells
  for (let i = 0; i < states.length; i++) {
    actionTable.push({});
    gotoTable.push({});
    for (const t of grammar.terminals) actionTable[i][t] = [];
    actionTable[i]['$'] = [];
    for (const nt of grammar.nonTerminals) gotoTable[i][nt] = null;
  }

  // 1. Shift transitions & GOTO transitions
  for (const t of transitions) {
    const from = t.from;
    const sym = t.symbol;
    const to = t.to;

    if (grammar.terminals.has(sym)) {
      actionTable[from][sym].push({ type: 'shift', state: to });
    } else if (grammar.nonTerminals.has(sym)) {
      gotoTable[from][sym] = to;
    }
  }

  // 2. Reduce transitions & Accept
  for (let i = 0; i < states.length; i++) {
    const itemSet = states[i];

    for (const item of itemSet) {
      if (item.isCompleted()) {
        if (item.lhs === grammar.startSymbol + "'") {
          // S' -> S ., $
          if (item.lookahead === '$') {
            actionTable[i]['$'].push({ type: 'accept' });
          }
        } else {
          // A -> alpha ., a
          actionTable[i][item.lookahead].push({ type: 'reduce', ruleIndex: item.prodIndex });
        }
      }
    }
  }

  // 3. Conflict Detection
  for (let i = 0; i < states.length; i++) {
    // ACTION conflicts
    const allSymbols = [...grammar.terminals, '$'];
    for (const sym of allSymbols) {
      if (actionTable[i][sym].length > 1) {
        conflicts.push({
          state: i,
          symbol: sym,
          actions: actionTable[i][sym],
        });
      }
    }
  }

  return { actionTable, gotoTable, conflicts };
}

// ==========================================
// 5. PARSER COMPILER TRIGGER HANDLER
// ==========================================
function handleBuildParser() {
  const rawGrammar = els.grammarInput.value.trim();
  const type = els.parserTypeSelect.value;

  if (!rawGrammar) {
    logEngine('Error: Grammar text is empty!', 'error');
    updateEngineBadge('Grammar Empty', 'error');
    return;
  }

  try {
    updateEngineBadge('Building...', 'active');
    logEngine(`Parsing Context-Free Grammar...`, 'sys');

    gGrammar = new CFGGrammar(rawGrammar);
    logEngine(`Grammar Parsed. Start symbol: ${gGrammar.startSymbol}`, 'success');
    logEngine(`Non-Terminals: ${Array.from(gGrammar.nonTerminals).join(', ')}`, 'success');
    logEngine(`Terminals: ${Array.from(gGrammar.terminals).join(', ')}`, 'success');

    // Compute FIRST & FOLLOW Sets
    const { first, follow } = computeFirstAndFollow(gGrammar);
    gFirstSets = first;
    gFollowSets = follow;

    // Render sets
    renderFirstAndFollow();

    // Build tables based on choice
    if (type === 'LL1') {
      const { table, conflicts } = buildLL1Table(gGrammar, first, follow);
      gLL1Table = table;
      gConflicts = conflicts;
      gLR1Collection = [];

      renderLL1Table();
      els.tabLrSetsBtn.style.display = 'none';
    } else {
      // LR1 canonical items
      logEngine('Constructing Canonical Collection of LR(1) item sets...', 'sys');
      const { states, transitions } = buildLR1CanonicalCollection(gGrammar, first);
      gLR1Collection = states;

      logEngine(`Canonical LR(1) states built. Total states: ${states.length}`, 'success');

      const { actionTable, gotoTable, conflicts } = buildLR1Tables(gGrammar, states, transitions);
      gLR1ActionTable = actionTable;
      gLR1GotoTable = gotoTable;
      gConflicts = conflicts;

      renderLR1Table();
      renderLR1ItemSets();
      els.tabLrSetsBtn.style.display = 'block';
    }

    logEngine('Parser built successfully!', 'success');
    if (gConflicts.length > 0) {
      logEngine(
        `Warning: Grammar contains ${gConflicts.length} conflict(s). Highlighted in tables.`,
        'warn'
      );
    }

    updateEngineBadge('Built Ready', 'ready');

    // Initialize parser simulator
    initSimulation();
  } catch (err) {
    logEngine(`Compilation Error: ${err.message}`, 'error');
    console.error(err);
    updateEngineBadge(err.message, 'error');
  }
}

// ==========================================
// 6. UI RENDERING FOR ANALYSIS TAB
// ==========================================
function renderFirstAndFollow() {
  els.setsEmpty.style.display = 'none';
  els.setsGrid.style.display = 'flex';
  els.setsGrid.innerHTML = '';

  for (const nt of gGrammar.nonTerminals) {
    const row = document.createElement('div');
    row.className = 'set-row';

    const symbolDiv = document.createElement('div');
    symbolDiv.className = 'set-symbol';
    symbolDiv.textContent = nt;
    row.appendChild(symbolDiv);

    const container = document.createElement('div');
    container.className = 'set-values-container';

    // First set
    const firstDiv = document.createElement('div');
    firstDiv.className = 'set-vals';
    firstDiv.innerHTML = `<span class="set-label">FIRST:</span> <span class="set-tokens">{ ${Array.from(gFirstSets[nt]).join(', ')} }</span>`;
    container.appendChild(firstDiv);

    // Follow set
    const followDiv = document.createElement('div');
    followDiv.className = 'set-vals';
    followDiv.innerHTML = `<span class="set-label">FOLLOW:</span> <span class="set-tokens">{ ${Array.from(gFollowSets[nt]).join(', ')} }</span>`;
    container.appendChild(followDiv);

    row.appendChild(container);
    els.setsGrid.appendChild(row);
  }
}

function renderLL1Table() {
  els.tableEmpty.style.display = 'none';
  els.tableContent.style.display = 'block';

  // Display conflict status
  if (gConflicts.length > 0) {
    els.conflictBanner.style.display = 'block';
    els.conflictText.textContent = `Grammar is not LL(1). Multiple entries exist for ${gConflicts.length} cell(s). Highlighted in rose.`;
  } else {
    els.conflictBanner.style.display = 'none';
  }

  const terminalsList = [...gGrammar.terminals, '$'];

  // Header
  els.parseTableHead.innerHTML = '<th>Non-Terminal</th>';
  terminalsList.forEach((t) => {
    const th = document.createElement('th');
    th.textContent = t;
    els.parseTableHead.appendChild(th);
  });

  // Body
  els.parseTableBody.innerHTML = '';
  for (const nt of gGrammar.nonTerminals) {
    const tr = document.createElement('tr');

    const headCell = document.createElement('td');
    headCell.className = 'header-col';
    headCell.textContent = nt;
    tr.appendChild(headCell);

    terminalsList.forEach((t) => {
      const cell = document.createElement('td');
      const ruleIndices = gLL1Table[nt][t] || [];

      if (ruleIndices.length > 1) {
        cell.className = 'conflict-cell';
        cell.title = 'LL(1) Ambiguity Conflict';
      }

      ruleIndices.forEach((idx) => {
        const prod = gGrammar.productions[idx];
        const ruleSpan = document.createElement('span');
        ruleSpan.className = 'production-rule';
        ruleSpan.textContent = `${prod.lhs} -> ${prod.rhs.join(' ')}`;
        cell.appendChild(ruleSpan);
      });

      tr.appendChild(cell);
    });

    els.parseTableBody.appendChild(tr);
  }
}

function renderLR1Table() {
  els.tableEmpty.style.display = 'none';
  els.tableContent.style.display = 'block';

  if (gConflicts.length > 0) {
    els.conflictBanner.style.display = 'block';
    els.conflictText.textContent = `Grammar is not LR(1). Conflict found in ${gConflicts.length} cell(s) (marked in rose).`;
  } else {
    els.conflictBanner.style.display = 'none';
  }

  const actionSymbols = [...gGrammar.terminals, '$'];
  const gotoSymbols = [...gGrammar.nonTerminals];

  // Header
  els.parseTableHead.innerHTML = '<th rowspan="2">State</th>';
  const actionTh = document.createElement('th');
  actionTh.setAttribute('colspan', actionSymbols.length.toString());
  actionTh.textContent = 'ACTION';
  actionTh.style.textAlign = 'center';

  const gotoTh = document.createElement('th');
  gotoTh.setAttribute('colspan', gotoSymbols.length.toString());
  gotoTh.textContent = 'GOTO';
  gotoTh.style.textAlign = 'center';

  const headRow1 = els.parseTableHead;
  headRow1.appendChild(actionTh);
  headRow1.appendChild(gotoTh);

  // Create second header row inside the table head
  let row2 = document.getElementById('parseTableHeadRow2');
  if (!row2) {
    row2 = document.createElement('tr');
    row2.id = 'parseTableHeadRow2';
    els.parseTable.querySelector('thead').appendChild(row2);
  }
  row2.innerHTML = '';

  actionSymbols.forEach((s) => {
    const th = document.createElement('th');
    th.textContent = s;
    row2.appendChild(th);
  });
  gotoSymbols.forEach((s) => {
    const th = document.createElement('th');
    th.textContent = s;
    row2.appendChild(th);
  });

  // Body
  els.parseTableBody.innerHTML = '';
  for (let i = 0; i < gLR1Collection.length; i++) {
    const tr = document.createElement('tr');

    const stateCell = document.createElement('td');
    stateCell.className = 'header-col';
    stateCell.textContent = `I${i}`;
    tr.appendChild(stateCell);

    // ACTION columns
    actionSymbols.forEach((sym) => {
      const cell = document.createElement('td');
      const actions = gLR1ActionTable[i][sym] || [];

      if (actions.length > 1) {
        cell.className = 'conflict-cell';
      }

      actions.forEach((act) => {
        const span = document.createElement('span');
        span.className = 'production-rule';
        if (act.type === 'shift') {
          span.textContent = `s${act.state}`;
          span.style.color = 'var(--pe-primary)';
        } else if (act.type === 'reduce') {
          span.textContent = `r${act.ruleIndex}`;
          span.style.color = 'var(--pe-accent)';
        } else if (act.type === 'accept') {
          span.textContent = 'acc';
          span.style.color = 'var(--pe-success)';
          span.style.fontWeight = 'bold';
        }
        cell.appendChild(span);
      });
      tr.appendChild(cell);
    });

    // GOTO columns
    gotoSymbols.forEach((sym) => {
      const cell = document.createElement('td');
      const target = gLR1GotoTable[i][sym];
      if (target !== null) {
        cell.textContent = target;
        cell.style.color = '#38bdf8';
      }
      tr.appendChild(cell);
    });

    els.parseTableBody.appendChild(tr);
  }
}

function renderLR1ItemSets() {
  els.lrSetsEmpty.style.display = 'none';
  els.itemSetsContainer.style.display = 'flex';
  els.itemSetsContainer.innerHTML = '';

  gLR1Collection.forEach((state, i) => {
    const card = document.createElement('div');
    card.className = 'item-set-card';

    const title = document.createElement('h4');
    title.className = 'item-set-title';
    title.textContent = `State I${i}`;
    card.appendChild(title);

    const itemList = document.createElement('div');
    itemList.className = 'item-list';

    state.forEach((item) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'lr-item';

      const beforeDot = item.rhs.slice(0, item.dot).join(' ');
      const afterDot = item.rhs.slice(item.dot).join(' ');

      // Format epsilon correctly
      const ruleStr =
        beforeDot || afterDot
          ? `${beforeDot} <span class="dot">.</span> ${afterDot}`
          : '<span class="dot">.</span> epsilon';

      itemDiv.innerHTML = `${item.lhs} -> ${ruleStr} <span class="lookahead">, [${item.lookahead}]</span>`;
      itemList.appendChild(itemDiv);
    });
    card.appendChild(itemList);

    // Transitions
    const transList = document.createElement('div');
    transList.className = 'transition-list';

    // Scan transitions for state i
    let hasTrans = false;
    // From global state, collect transitions
    for (const nt of gGrammar.nonTerminals) {
      const target = gLR1GotoTable[i][nt];
      if (target !== null) {
        const trItem = document.createElement('div');
        trItem.className = 'lr-trans-item';
        trItem.innerHTML = `Goto(<span class="trans-symbol">${nt}</span>) -> <span class="trans-target">I${target}</span>`;
        transList.appendChild(trItem);
        hasTrans = true;
      }
    }
    for (const t of [...gGrammar.terminals]) {
      const acts = gLR1ActionTable[i][t] || [];
      acts.forEach((act) => {
        if (act.type === 'shift') {
          const trItem = document.createElement('div');
          trItem.className = 'lr-trans-item';
          trItem.innerHTML = `Shift(<span class="trans-symbol">${t}</span>) -> <span class="trans-target">I${act.state}</span>`;
          transList.appendChild(trItem);
          hasTrans = true;
        }
      });
    }

    if (hasTrans) {
      card.appendChild(transList);
    }

    els.itemSetsContainer.appendChild(card);
  });
}

// ==========================================
// 7. SIMULATOR EXECUTION CONTROLLER
// ==========================================
function initSimulation() {
  resetSimState();

  const type = els.parserTypeSelect.value;
  const inputStr = els.stringInput.value.trim();

  if (!inputStr) {
    logSim('Error: Parse input string is empty!', 'error');
    return;
  }

  // Tokenize
  gSimInput = inputStr.split(/\s+/).filter(Boolean);
  gSimInput.push('$'); // Add end marker

  gSimType = type;
  gNodeIdCounter = 0;

  // Render tape
  renderTape();

  if (type === 'LL1') {
    // Initialize Stack for LL(1): [$, StartSymbol]
    // Initially, the startSymbol represents the root node of the AST
    const rootNode = new TreeNode(gGrammar.startSymbol);
    gSimTreeNodes = [rootNode];

    gSimStack = ['$', rootNode];
    gLL1TreeStack = [null, rootNode]; // traces target node pointers matching gSimStack indices

    logSim(`LL(1) simulator initialized. Stack: [$, ${gGrammar.startSymbol}]`, 'match');
  } else {
    // Initialize Stack for LR(1): [0] (State 0)
    gSimStack = [0];
    logSim('LR(1) simulator initialized. Stack: [0]', 'shift');
  }

  renderStack();
  renderParseTree();

  // Enable controls
  els.btnStep.disabled = false;
  els.btnPlay.disabled = false;
  els.btnReset.disabled = false;

  updateEngineBadge('Simulating', 'active');
}

function resetSimulation() {
  stopPlay();
  initSimulation();
}

function resetSimState() {
  gSimStack = [];
  gSimInput = [];
  gSimInputPointer = 0;
  gSimTreeNodes = [];
  gSimActiveNodeId = null;
  gSimDone = false;
  gSimError = false;
  gLL1TreeStack = [];

  els.btnStep.disabled = true;
  els.btnPlay.disabled = true;
  els.btnReset.disabled = true;

  els.stackContent.innerHTML =
    '<div class="tab-empty-state" style="height: 100%; margin: 0;">Stack Empty</div>';
  els.tapeCells.innerHTML = '<span class="help-text">Awaiting build...</span>';
  els.simLogs.innerHTML =
    '<div style="color: #475569; font-style: italic;">Awaiting simulation start...</div>';

  // Clear SVG
  els.treeSvg.innerHTML = '';
}

function logSim(msg, type = 'match') {
  const line = document.createElement('div');
  line.className = `sim-log-line ${type}`;
  line.textContent = `> ${msg}`;
  els.simLogs.appendChild(line);
  els.simLogs.scrollTop = els.simLogs.scrollHeight;
}

function renderTape() {
  els.tapeCells.innerHTML = '';
  gSimInput.forEach((token, idx) => {
    const cell = document.createElement('span');
    cell.className = 'tape-cell';
    cell.textContent = token;
    cell.id = `tape_cell_${idx}`;
    if (idx === gSimInputPointer) {
      cell.className = 'tape-cell active-cell';
    }
    els.tapeCells.appendChild(cell);
  });
}

function renderStack() {
  els.stackContent.innerHTML = '';

  if (gSimType === 'LL1') {
    // LL1 stack contains mixed strings & Node objects
    for (let i = 0; i < gSimStack.length; i++) {
      const item = gSimStack[i];
      const div = document.createElement('div');
      div.className = 'stack-node';
      div.textContent = typeof item === 'string' ? item : item.symbol;
      els.stackContent.appendChild(div);
    }
  } else {
    // LR1 stack contains alternating states (numbers) and symbols (strings or tree node objects)
    for (let i = 0; i < gSimStack.length; i++) {
      const item = gSimStack[i];
      const div = document.createElement('div');
      div.className = 'stack-node';

      if (typeof item === 'number') {
        div.textContent = `State ${item}`;
        div.style.background = 'rgba(168, 85, 247, 0.08)';
        div.style.borderColor = 'rgba(168, 85, 247, 0.4)';
      } else if (typeof item === 'string') {
        div.textContent = item;
      } else {
        // AST TreeNode object
        div.textContent = item.symbol;
        div.style.borderColor = 'var(--pe-success)';
        div.style.background = 'rgba(16, 185, 129, 0.08)';
      }
      els.stackContent.appendChild(div);
    }
  }
}

// ==========================================
// 8. SIMULATION STEP ALGORITHMS
// ==========================================
function stepSimulation() {
  if (gSimDone || gSimError) return;

  const lookahead = gSimInput[gSimInputPointer];

  if (gSimType === 'LL1') {
    stepLL1(lookahead);
  } else {
    stepLR1(lookahead);
  }

  renderTape();
  renderStack();
  renderParseTree();
}

function stepLL1(lookahead) {
  const X = gSimStack[gSimStack.length - 1];

  if (X === undefined) {
    logSim('Error: Stack is empty but lookahead remains.', 'error');
    gSimError = true;
    updateEngineBadge('Parse Error', 'error');
    return;
  }

  // Case 1: Match EOF
  if (X === '$' && lookahead === '$') {
    gSimStack.pop();
    gLL1TreeStack.pop();
    logSim('Parsing complete! Input string accepted.', 'success');
    gSimDone = true;
    stopPlay();
    updateEngineBadge('Success Accepted', 'ready');
    return;
  }

  // Case 2: Match terminals
  if (typeof X === 'string' && gGrammar.terminals.has(X)) {
    if (X === lookahead) {
      gSimStack.pop();
      gLL1TreeStack.pop();
      logSim(`Matched terminal: "${lookahead}"`, 'match');
      gSimInputPointer++;
    } else {
      logSim(`Error: Mismatch. Expected terminal "${X}", found "${lookahead}"`, 'error');
      gSimError = true;
      stopPlay();
      updateEngineBadge('Mismatch Error', 'error');
    }
    return;
  }

  // Case 3: Process TreeNode (corresponds to active non-terminal in top-down AST expansion)
  if (X instanceof TreeNode) {
    const ntSymbol = X.symbol;

    // Find parsing table rules
    const rulesList = gLL1Table[ntSymbol][lookahead] || [];

    if (rulesList.length === 0) {
      logSim(`Error: No transition rule found for [${ntSymbol}, ${lookahead}]`, 'error');
      gSimError = true;
      stopPlay();
      updateEngineBadge('Syntax Error', 'error');
      gSimActiveNodeId = X.id; // Highlight error node
      return;
    }

    if (rulesList.length > 1) {
      logSim(
        `Error: Non-deterministic step. Multiple rules for [${ntSymbol}, ${lookahead}]. Grammar is ambiguous.`,
        'error'
      );
      gSimError = true;
      stopPlay();
      updateEngineBadge('Conflict Error', 'error');
      return;
    }

    // Get the single rule
    const ruleIdx = rulesList[0];
    const prod = gGrammar.productions[ruleIdx];

    logSim(`Expand: ${prod.lhs} -> ${prod.rhs.join(' ')}`, 'reduce');

    // Highlight current node in simulation
    gSimActiveNodeId = X.id;

    // Pop the non-terminal node from stack
    gSimStack.pop();
    gLL1TreeStack.pop();

    // Push RHS symbols in reverse order
    const childrenNodes = [];
    const rhs = prod.rhs;

    if (rhs.length === 1 && rhs[0] === 'epsilon') {
      // Epsilon child node
      const epsilonNode = new TreeNode('ε', true);
      X.children.push(epsilonNode);
      gSimTreeNodes.push(epsilonNode);
      // No symbols pushed to execution stack for epsilon
    } else {
      // Push children nodes in reverse order on stack, but add left-to-right as children
      for (let i = 0; i < rhs.length; i++) {
        const sym = rhs[i];
        const isT = gGrammar.terminals.has(sym) || sym === '$';
        const node = new TreeNode(sym, isT);
        X.children.push(node);
        gSimTreeNodes.push(node);
        childrenNodes.push(node);
      }

      // Push to stack in reverse
      for (let i = childrenNodes.length - 1; i >= 0; i--) {
        gSimStack.push(childrenNodes[i]);
      }
    }
  }
}

function stepLR1(lookahead) {
  const state = gSimStack[gSimStack.length - 1];

  if (typeof state !== 'number') {
    logSim('Error: Invalid stack layout. Top element must be a state number.', 'error');
    gSimError = true;
    stopPlay();
    updateEngineBadge('Internal Error', 'error');
    return;
  }

  const actions = gLR1ActionTable[state][lookahead] || [];

  if (actions.length === 0) {
    logSim(`Error: No ACTION transition for State I${state} on lookahead "${lookahead}"`, 'error');
    gSimError = true;
    stopPlay();
    updateEngineBadge('Syntax Error', 'error');
    return;
  }

  if (actions.length > 1) {
    logSim(
      `Error: Conflict state. Multiple ACTION choices for [State I${state}, Lookahead "${lookahead}"]`,
      'error'
    );
    gSimError = true;
    stopPlay();
    updateEngineBadge('Conflict Error', 'error');
    return;
  }

  const act = actions[0];

  if (act.type === 'shift') {
    // Shift lookahead terminal, push terminal node, and transition to target state
    const targetState = act.state;
    const node = new TreeNode(lookahead, true);
    gSimTreeNodes.push(node);

    gSimStack.push(node);
    gSimStack.push(targetState);

    logSim(`Shift: Push terminal "${lookahead}", move to State I${targetState}`, 'shift');
    gSimInputPointer++;
  } else if (act.type === 'reduce') {
    const prod = gGrammar.productions[act.ruleIndex];
    const lhs = prod.lhs;
    const rhs = prod.rhs;

    logSim(`Reduce: By production ${lhs} -> ${rhs.join(' ')}`, 'reduce');

    const parentNode = new TreeNode(lhs, false);
    gSimTreeNodes.push(parentNode);

    const children = [];

    if (rhs.length === 1 && rhs[0] === 'epsilon') {
      // Epsilon reduction: parent node gets a single epsilon leaf child
      const epLeaf = new TreeNode('ε', true);
      gSimTreeNodes.push(epLeaf);
      parentNode.children.push(epLeaf);
    } else {
      // Pop 2 * rhs.length elements
      // E.g. [State, Node, State, Node] -> pops alternating State, then Node.
      for (let k = 0; k < rhs.length; k++) {
        gSimStack.pop(); // pop state number
        const poppedSymbolNode = gSimStack.pop(); // pop TreeNode object or terminal string

        if (poppedSymbolNode instanceof TreeNode) {
          children.push(poppedSymbolNode);
        } else if (typeof poppedSymbolNode === 'string') {
          // fallback conversion
          const wrapNode = new TreeNode(poppedSymbolNode, true);
          gSimTreeNodes.push(wrapNode);
          children.push(wrapNode);
        }
      }

      // Since we popped from stack in reverse order, reverse them back for child mapping
      children.reverse();
      for (const child of children) {
        parentNode.children.push(child);
      }
    }

    // Find GOTO transition
    const topState = gSimStack[gSimStack.length - 1];
    const gotoState = gLR1GotoTable[topState][lhs];

    if (gotoState === null) {
      logSim(
        `Error: Reduce error. No GOTO transition for State I${topState} on non-terminal "${lhs}"`,
        'error'
      );
      gSimError = true;
      stopPlay();
      updateEngineBadge('GOTO Error', 'error');
      return;
    }

    // Push LHS parentNode, then push gotoState
    gSimStack.push(parentNode);
    gSimStack.push(gotoState);

    gSimActiveNodeId = parentNode.id;
  } else if (act.type === 'accept') {
    logSim('Parsing complete! Input string accepted by LR(1) parser.', 'success');
    gSimDone = true;
    stopPlay();
    updateEngineBadge('Success Accepted', 'ready');
  }
}

// ==========================================
// 9. AUTOMATIC EXECUTION TIMER
// ==========================================
function togglePlaySimulation() {
  if (gSimIsPlaying) {
    stopPlay();
  } else {
    startPlay();
  }
}

function startPlay() {
  if (gSimDone || gSimError) return;
  gSimIsPlaying = true;
  els.btnPlay.innerHTML = `<i class="fas fa-pause"></i> Pause`;
  els.btnPlay.className = 'btn-icon';
  els.btnPlay.style.color = 'var(--pe-accent)';
  els.btnPlay.style.borderColor = 'var(--pe-accent)';

  gSimInterval = setInterval(() => {
    if (gSimDone || gSimError) {
      stopPlay();
    } else {
      stepSimulation();
    }
  }, 1200);
}

function stopPlay() {
  gSimIsPlaying = false;
  if (gSimInterval) {
    clearInterval(gSimInterval);
    gSimInterval = null;
  }
  els.btnPlay.innerHTML = `<i class="fas fa-play"></i> Auto Run`;
  els.btnPlay.className = 'btn-icon';
  els.btnPlay.style.color = '#fff';
  els.btnPlay.style.borderColor = '#334155';
}

// ==========================================
// 10. AST TREE LAYOUT & SVG RENDERER
// ==========================================
function computeTreeLayout() {
  // Find root nodes. For LL(1) or LR(1) completed parse, root is the startSymbol node.
  // However, during intermediate parse states, we might have multiple disjoint subtree roots.
  // We will scan all tree nodes to find the roots (nodes that have no incoming parent references).
  const childrenIds = new Set();
  gSimTreeNodes.forEach((node) => {
    node.children.forEach((c) => childrenIds.add(c.id));
  });

  const roots = gSimTreeNodes.filter((node) => !childrenIds.has(node.id));

  if (roots.length === 0) return;

  // Assign depth levels
  function assignDepth(node, depth) {
    node.depth = depth;
    node.children.forEach((child) => assignDepth(child, depth + 1));
  }
  roots.forEach((root) => assignDepth(root, 0));

  // X layout coordinate calculator
  let leafXCounter = 0;
  function layoutDFS(node) {
    if (node.children.length === 0) {
      node.x = leafXCounter++;
    } else {
      node.children.forEach((child) => layoutDFS(child));
      // Parent X is average of children
      const sumX = node.children.reduce((acc, c) => acc + c.x, 0);
      node.x = sumX / node.children.length;
    }
  }
  roots.forEach((root) => layoutDFS(root));
}

function renderParseTree() {
  // Clear canvas
  els.treeSvg.innerHTML = '';

  if (gSimTreeNodes.length === 0) return;

  // Compute positions
  computeTreeLayout();

  // SVG sizing settings
  const nodeRadius = 22;
  const levelHeight = 65;
  const spacingX = 65;

  // Compute bounds and dimensions
  let maxX = 0;
  let maxDepth = 0;
  gSimTreeNodes.forEach((node) => {
    if (node.x > maxX) maxX = node.x;
    if (node.depth > maxDepth) maxDepth = node.depth;
  });

  const svgWidth = Math.max(600, (maxX + 1.5) * spacingX);
  const svgHeight = Math.max(380, (maxDepth + 1.5) * levelHeight);

  els.treeSvg.setAttribute('width', svgWidth.toString());
  els.treeSvg.setAttribute('height', svgHeight.toString());

  // Center tree inside SVG if it is smaller than viewport
  const wrapperWidth = els.treeSvg.parentElement.clientWidth;
  const offsetX = Math.max(30, (wrapperWidth - maxX * spacingX) / 2);
  const offsetY = 40;

  // Define tree layout coords mapping
  gSimTreeNodes.forEach((node) => {
    node.posX = node.x * spacingX + offsetX;
    node.posY = node.depth * levelHeight + offsetY;
  });

  // Draw edges
  gSimTreeNodes.forEach((node) => {
    node.children.forEach((child) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', node.posX);
      line.setAttribute('y1', node.posY);
      line.setAttribute('x2', child.posX);
      line.setAttribute('y2', child.posY);

      let isActEdge = node.id === gSimActiveNodeId || child.id === gSimActiveNodeId;
      line.setAttribute('class', `tree-node-edge ${isActEdge ? 'active-edge' : ''}`);
      els.treeSvg.appendChild(line);
    });
  });

  // Draw circles and texts
  gSimTreeNodes.forEach((node) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.posX);
    circle.setAttribute('cy', node.posY);
    circle.setAttribute('r', nodeRadius);

    let nodeClass = 'tree-node-circle';
    if (node.id === gSimActiveNodeId) {
      nodeClass += ' active-node';
    }
    if (node.isTerminal) {
      nodeClass += ' terminal-node';
    }
    circle.setAttribute('class', nodeClass);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', node.posX);
    text.setAttribute('y', node.posY);
    text.setAttribute('class', 'tree-node-text');
    text.textContent = node.symbol;

    g.appendChild(circle);
    g.appendChild(text);
    els.treeSvg.appendChild(g);
  });
}
