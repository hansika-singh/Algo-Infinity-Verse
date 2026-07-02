// minimax-visualizer.js

/**
 * Game Theory Minimax & Alpha-Beta Pruning Visualizer
 * Implements Tic-Tac-Toe AI that generates an evaluation trace to be rendered via D3.js.
 */

const PLAYER_HUMAN = 'X';
const PLAYER_AI = 'O';
const EMPTY = '';

let board = Array(9).fill(EMPTY);
let gameActive = false;
let humanTurn = true;
let searchDepth = 9;
let useAlphaBeta = true;

// Trace & Tree Data
let searchTreeRoot = null;
let evaluationTrace = [];
let traceIndex = 0;
let nextNodeId = 0;

// Playback
let isPlaying = false;
let playInterval = null;
let playSpeedMs = 500;

// UI Elements
const ticTacToeBoard = document.getElementById('ticTacToeBoard');
const gameStatus = document.getElementById('gameStatus');
const algoSelect = document.getElementById('algoSelect');
const depthSlider = document.getElementById('depthSlider');
const depthVal = document.getElementById('depthVal');
const btnHumanStart = document.getElementById('btnHumanStart');
const btnAIStart = document.getElementById('btnAIStart');
const btnResetGame = document.getElementById('btnResetGame');

const btnPlayPause = document.getElementById('btnPlayPause');
const btnStep = document.getElementById('btnStep');
const speedSlider = document.getElementById('speedSlider');
const statNodes = document.getElementById('statNodes');
const statPruned = document.getElementById('statPruned');
const statScore = document.getElementById('statScore');

const treeOverlay = document.getElementById('treeOverlay');

// D3 Setup
const container = document.getElementById('treeContainer');
const svg = d3.select('#treeSvg');
const gWrapper = svg.append('g');
const zoom = d3.zoom().scaleExtent([0.1, 3]).on('zoom', (event) => {
    gWrapper.attr('transform', event.transform);
});
svg.call(zoom);

let treeLayout = d3.tree().nodeSize([60, 100]); // [dx, dy]

// Setup DOM Board
function initBoard() {
    ticTacToeBoard.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'ttt-cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(i));
        ticTacToeBoard.appendChild(cell);
    }
}

// Game Logic
function checkWin(b) {
    const wins = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    for (let w of wins) {
        if (b[w[0]] !== EMPTY && b[w[0]] === b[w[1]] && b[w[1]] === b[w[2]]) {
            return { winner: b[w[0]], line: w };
        }
    }
    if (!b.includes(EMPTY)) return { winner: 'Tie', line: [] };
    return null;
}

function evaluateBoard(b) {
    const res = checkWin(b);
    if (res) {
        if (res.winner === PLAYER_AI) return 10;
        if (res.winner === PLAYER_HUMAN) return -10;
        return 0; // Tie
    }
    return 0; // Incomplete
}

function updateBoardUI(winResult = null) {
    const cells = ticTacToeBoard.children;
    for (let i = 0; i < 9; i++) {
        cells[i].textContent = board[i];
        cells[i].className = 'ttt-cell ' + (board[i] === PLAYER_HUMAN ? 'x ' : (board[i] === PLAYER_AI ? 'o ' : '')) + (board[i] !== EMPTY ? 'taken' : '');
    }
    if (winResult && winResult.line) {
        for (let idx of winResult.line) {
            cells[idx].classList.add('win-highlight');
        }
    }
}

function startGame(humanFirst = true) {
    board = Array(9).fill(EMPTY);
    gameActive = true;
    humanTurn = humanFirst;
    updateBoardUI();
    clearTree();
    statNodes.textContent = '0';
    statPruned.textContent = '0';
    statScore.textContent = '-';
    
    if (humanTurn) {
        gameStatus.textContent = 'Your Turn (X)';
    } else {
        gameStatus.textContent = 'AI is thinking... (O)';
        setTimeout(makeAIMove, 100);
    }
}

function handleCellClick(idx) {
    if (!gameActive || !humanTurn || board[idx] !== EMPTY) return;
    board[idx] = PLAYER_HUMAN;
    updateBoardUI();
    
    const win = checkWin(board);
    if (win) {
        gameActive = false;
        gameStatus.textContent = win.winner === 'Tie' ? "It's a Tie!" : `You Win!`;
        updateBoardUI(win);
        return;
    }
    
    humanTurn = false;
    gameStatus.textContent = 'AI is thinking... (O)';
    setTimeout(makeAIMove, 100);
}

// AI Engine (Trace Generation)
function makeAIMove() {
    nextNodeId = 0;
    evaluationTrace = [];
    
    // Construct root node for the tree
    searchTreeRoot = {
        id: nextNodeId++,
        board: [...board],
        player: PLAYER_AI,
        isMax: true,
        children: [],
        score: null,
        alpha: -Infinity,
        beta: Infinity,
        pruned: false,
        parent: null
    };

    const bestMove = minimax(board, searchDepth, -Infinity, Infinity, true, searchTreeRoot);
    
    // Setup visualizer
    traceIndex = 0;
    btnPlayPause.disabled = false;
    btnStep.disabled = false;
    treeOverlay.style.display = 'none';
    
    // Render initial empty tree
    renderD3Tree(searchTreeRoot);
    
    // Center tree
    setTimeout(() => {
        const rootNodeEl = gWrapper.select('.node').node();
        if (rootNodeEl) {
            const bbox = gWrapper.node().getBBox();
            const width = container.clientWidth;
            const transform = d3.zoomIdentity.translate(width/2, 50).scale(1);
            svg.transition().duration(500).call(zoom.transform, transform);
        }
    }, 100);

    // Auto play if configured
    playInterval = setInterval(stepVisualization, playSpeedMs);
    isPlaying = true;
    btnPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
    
    // We delay the actual board update until visualization completes
    // Store best move to apply later
    searchTreeRoot.bestMove = bestMove.index;
}

function minimax(currentBoard, depth, alpha, beta, isMaximizing, treeNode) {
    // Record visit
    evaluationTrace.push({ type: 'visit', node: treeNode });
    
    const winState = checkWin(currentBoard);
    if (winState || depth === 0) {
        let score = evaluateBoard(currentBoard);
        if (winState) {
            // Adjust score by depth to prefer faster wins
            if (score === 10) score -= (9 - depth);
            if (score === -10) score += (9 - depth);
        }
        treeNode.score = score;
        evaluationTrace.push({ type: 'eval', node: treeNode, score: score });
        return { score: score };
    }

    const availableMoves = [];
    for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === EMPTY) availableMoves.push(i);
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        let bestMove = -1;

        for (let i = 0; i < availableMoves.length; i++) {
            const move = availableMoves[i];
            const nextBoard = [...currentBoard];
            nextBoard[move] = PLAYER_AI;

            const childNode = {
                id: nextNodeId++,
                board: nextBoard,
                player: PLAYER_HUMAN,
                isMax: false,
                children: [],
                score: null,
                alpha: alpha,
                beta: beta,
                pruned: false,
                parent: treeNode,
                moveIdx: move
            };
            treeNode.children.push(childNode);
            
            // Recurse
            const result = minimax(nextBoard, depth - 1, alpha, beta, false, childNode);
            
            if (result.score > bestScore) {
                bestScore = result.score;
                bestMove = move;
            }
            
            treeNode.score = bestScore;
            evaluationTrace.push({ type: 'update', node: treeNode, score: bestScore });

            if (useAlphaBeta) {
                alpha = Math.max(alpha, bestScore);
                // Pruning condition
                if (beta <= alpha) {
                    // Mark remaining unsearched siblings as pruned?
                    // We just break, and visualize pruning
                    evaluationTrace.push({ type: 'prune', node: treeNode, cause: 'beta <= alpha' });
                    break;
                }
            }
        }
        return { score: bestScore, index: bestMove };

    } else {
        let bestScore = Infinity;
        let bestMove = -1;

        for (let i = 0; i < availableMoves.length; i++) {
            const move = availableMoves[i];
            const nextBoard = [...currentBoard];
            nextBoard[move] = PLAYER_HUMAN;

            const childNode = {
                id: nextNodeId++,
                board: nextBoard,
                player: PLAYER_AI,
                isMax: true,
                children: [],
                score: null,
                alpha: alpha,
                beta: beta,
                pruned: false,
                parent: treeNode,
                moveIdx: move
            };
            treeNode.children.push(childNode);
            
            // Recurse
            const result = minimax(nextBoard, depth - 1, alpha, beta, true, childNode);
            
            if (result.score < bestScore) {
                bestScore = result.score;
                bestMove = move;
            }

            treeNode.score = bestScore;
            evaluationTrace.push({ type: 'update', node: treeNode, score: bestScore });

            if (useAlphaBeta) {
                beta = Math.min(beta, bestScore);
                if (beta <= alpha) {
                    evaluationTrace.push({ type: 'prune', node: treeNode, cause: 'beta <= alpha' });
                    break;
                }
            }
        }
        return { score: bestScore, index: bestMove };
    }
}

// Tree Visualization
let currentRenderedNodes = new Set();
let nodesEvaluatedCount = 0;
let branchesPrunedCount = 0;

function clearTree() {
    gWrapper.selectAll("*").remove();
    treeOverlay.style.display = 'block';
    btnPlayPause.disabled = true;
    btnStep.disabled = true;
    currentRenderedNodes.clear();
    nodesEvaluatedCount = 0;
    branchesPrunedCount = 0;
}

function renderD3Tree(rootData, activeNodeId = null) {
    if (!rootData) return;
    
    // Create hierarchy
    // We only want to render nodes that have been "visited" in the trace
    const root = d3.hierarchy(rootData, d => d.children.filter(c => currentRenderedNodes.has(c.id)));
    treeLayout(root);

    // Links
    const link = gWrapper.selectAll(".link")
        .data(root.links(), d => d.target.data.id);
        
    link.enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y))
        .attr("opacity", 0)
        .transition().duration(200).attr("opacity", 1);
        
    link.attr("d", d3.linkVertical().x(d => d.x).y(d => d.y))
        .classed("pruned", d => d.target.data.pruned)
        .classed("active-eval", d => d.target.data.id === activeNodeId || d.source.data.id === activeNodeId);
        
    link.exit().remove();

    // Nodes
    const node = gWrapper.selectAll(".node")
        .data(root.descendants(), d => d.data.id);
        
    const nodeEnter = node.enter().append("g")
        .attr("class", d => `node ${d.data.isMax ? 'max-node' : 'min-node'}`)
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("opacity", 0);
        
    nodeEnter.transition().duration(200).attr("opacity", 1);

    // Node shapes
    nodeEnter.append("circle")
        .attr("r", 18);
        
    // Node text (Score)
    nodeEnter.append("text")
        .attr("class", "score-text")
        .attr("dy", 5)
        .text(d => d.data.score !== null ? d.data.score : "?");

    // Board preview text below node
    nodeEnter.append("text")
        .attr("class", "board-text")
        .attr("dy", 30)
        .text(d => d.data.moveIdx !== undefined ? `Move ${d.data.moveIdx}` : 'Root');

    // Update
    node.attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("class", d => {
            let c = `node ${d.data.isMax ? 'max-node' : 'min-node'}`;
            if (d.data.pruned) c += " pruned";
            if (d.data.id === activeNodeId) c += " active-eval";
            return c;
        });
        
    node.select(".score-text")
        .text(d => d.data.score !== null ? d.data.score : "?");
        
    node.exit().remove();
    
    // Stats update
    statNodes.textContent = nodesEvaluatedCount;
    statPruned.textContent = branchesPrunedCount;
    if (rootData.score !== null) statScore.textContent = rootData.score;
}

function stepVisualization() {
    if (traceIndex >= evaluationTrace.length) {
        // Finish
        pauseVisualization();
        btnPlayPause.disabled = true;
        btnStep.disabled = true;
        
        // Apply AI Move
        if (searchTreeRoot && searchTreeRoot.bestMove !== undefined && searchTreeRoot.bestMove !== -1) {
            board[searchTreeRoot.bestMove] = PLAYER_AI;
            updateBoardUI();
            
            const win = checkWin(board);
            if (win) {
                gameActive = false;
                gameStatus.textContent = win.winner === 'Tie' ? "It's a Tie!" : `AI Wins!`;
                updateBoardUI(win);
            } else {
                humanTurn = true;
                gameStatus.textContent = 'Your Turn (X)';
            }
        }
        
        // Final render to remove highlights
        renderD3Tree(searchTreeRoot, null);
        return;
    }

    const step = evaluationTrace[traceIndex];
    let activeId = step.node.id;

    if (step.type === 'visit') {
        currentRenderedNodes.add(step.node.id);
        nodesEvaluatedCount++;
    } else if (step.type === 'eval') {
        // leaf eval
    } else if (step.type === 'update') {
        // internal node update
    } else if (step.type === 'prune') {
        // Visual indicator of pruning
        step.node.pruned = true;
        branchesPrunedCount++;
    }
    
    renderD3Tree(searchTreeRoot, activeId);
    
    // Auto Pan to follow active node if there are many nodes
    if (nodesEvaluatedCount > 10) {
        const root = d3.hierarchy(searchTreeRoot, d => d.children.filter(c => currentRenderedNodes.has(c.id)));
        treeLayout(root);
        const activeNodeData = root.descendants().find(d => d.data.id === activeId);
        if (activeNodeData) {
            const width = container.clientWidth;
            const height = container.clientHeight;
            const scale = 0.8;
            const tx = width/2 - activeNodeData.x * scale;
            const ty = height/3 - activeNodeData.y * scale;
            svg.transition().duration(playSpeedMs * 0.8).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
        }
    }

    traceIndex++;
}

function togglePlay() {
    if (isPlaying) {
        pauseVisualization();
    } else {
        isPlaying = true;
        btnPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
        playInterval = setInterval(stepVisualization, playSpeedMs);
    }
}

function pauseVisualization() {
    isPlaying = false;
    btnPlayPause.innerHTML = '<i class="fas fa-play"></i>';
    clearInterval(playInterval);
}

// Event Listeners
btnHumanStart.addEventListener('click', () => {
    btnHumanStart.className = 'btn-primary';
    btnAIStart.className = 'btn-secondary';
});
btnAIStart.addEventListener('click', () => {
    btnAIStart.className = 'btn-primary';
    btnHumanStart.className = 'btn-secondary';
});

btnResetGame.addEventListener('click', () => {
    pauseVisualization();
    startGame(btnHumanStart.classList.contains('btn-primary'));
});

depthSlider.addEventListener('input', (e) => {
    depthVal.textContent = e.target.value;
    searchDepth = parseInt(e.target.value);
});

algoSelect.addEventListener('change', (e) => {
    useAlphaBeta = e.target.value === 'alphabeta';
});

btnPlayPause.addEventListener('click', togglePlay);
btnStep.addEventListener('click', () => {
    pauseVisualization();
    stepVisualization();
});

speedSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    // 1: 1000ms, 2: 700ms, 3: 400ms, 4: 150ms, 5: 20ms
    const speeds = {1: 1000, 2: 700, 3: 400, 4: 150, 5: 20};
    playSpeedMs = speeds[val];
    if (isPlaying) {
        pauseVisualization();
        togglePlay();
    }
});

// Graph Controls
document.getElementById('btnZoomIn').addEventListener('click', () => svg.transition().duration(300).call(zoom.scaleBy, 1.3));
document.getElementById('btnZoomOut').addEventListener('click', () => svg.transition().duration(300).call(zoom.scaleBy, 0.7));
document.getElementById('btnResetView').addEventListener('click', () => {
    const width = container.clientWidth;
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(width/2, 50).scale(1));
});

// Initialize
initBoard();
startGame(true);
