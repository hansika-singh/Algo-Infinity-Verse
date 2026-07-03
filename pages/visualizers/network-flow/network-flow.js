/**
 * ALGO INFINITY VERSE - MAXIMUM FLOW ENGINE
 * Implements Edmonds-Karp, Dinic's, and Push-Relabel algorithms.
 * Utilizes ES6 Generators for step-by-step UI telemetry mapping.
 */

const logConsole = document.getElementById('execution-log');
const log = (msg, type = 'system') => {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.innerHTML = `> ${msg}`;
    logConsole.appendChild(div);
    logConsole.scrollTop = logConsole.scrollHeight;
};

// --- DATA STRUCTURES ---
let nodes = [
    { id: 'S', isSource: true, x: 100, y: 300 },
    { id: 'A', x: 300, y: 150 },
    { id: 'B', x: 300, y: 450 },
    { id: 'C', x: 500, y: 150 },
    { id: 'D', x: 500, y: 450 },
    { id: 'T', isSink: true, x: 700, y: 300 }
];

let links = [
    { source: 'S', target: 'A', cap: 10, flow: 0 },
    { source: 'S', target: 'B', cap: 10, flow: 0 },
    { source: 'A', target: 'C', cap: 4, flow: 0 },
    { source: 'A', target: 'B', cap: 2, flow: 0 },
    { source: 'A', target: 'D', cap: 8, flow: 0 },
    { source: 'B', target: 'D', cap: 9, flow: 0 },
    { source: 'D', target: 'C', cap: 6, flow: 0 },
    { source: 'C', target: 'T', cap: 10, flow: 0 },
    { source: 'D', target: 'T', cap: 10, flow: 0 }
];

// Editor State
let currentTool = 'move';
let dragSource = null;
let nodeCounter = 1;
let currentGenerator = null;
let isPlaying = false;

// --- D3 ENGINE ---
const svg = d3.select("#flow-canvas");
const width = document.querySelector('.visualization-stage').clientWidth;
const height = document.querySelector('.visualization-stage').clientHeight;
const g = svg.append("g");

function renderGraph() {
    g.selectAll("*").remove();

    // Render Edges
    const linkGroup = g.selectAll(".link")
        .data(links)
        .enter().append("g")
        .attr("class", d => `link id-${d.source.id || d.source}-${d.target.id || d.target}`);

    // Base path
    linkGroup.append("path")
        .attr("class", "base-layer")
        .attr("marker-end", "url(#arrow)")
        .attr("d", getEdgePath);

    // Flow path (overlapped, dynamic thickness)
    linkGroup.append("path")
        .attr("class", "flow-layer")
        .attr("d", getEdgePath)
        .style("stroke-width", d => Math.max(0, (d.flow / d.cap) * 10));

    // Edge Labels (Flow / Cap)
    linkGroup.append("text")
        .attr("x", d => getEdgeCenter(d).x)
        .attr("y", d => getEdgeCenter(d).y)
        .attr("dy", -5)
        .text(d => `${d.flow}/${d.cap}`);

    // Render Nodes
    const nodeGroup = g.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", d => `node ${d.isSource ? 'source' : ''} ${d.isSink ? 'sink' : ''} id-${d.id}`)
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("click", handleNodeClick);

    nodeGroup.append("circle").attr("r", 25);
    nodeGroup.append("text")
        .attr("class", "label")
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .text(d => d.id);
    
    // Push-Relabel Props
    nodeGroup.append("text")
        .attr("class", "props")
        .attr("dy", 35)
        .attr("text-anchor", "middle")
        .text(d => (d.h !== undefined) ? `h:${d.h} e:${d.e}` : "");
}

// Math helpers for curved edges (Bezier to prevent bidirectional overlap)
function getEdgePath(d) {
    const s = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source);
    const t = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target);
    const dx = t.x - s.x, dy = t.y - s.y;
    const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; 
    return `M${s.x},${s.y} Q${s.x + dx/2 - dy/5},${s.y + dy/2 + dx/5} ${t.x},${t.y}`;
}

function getEdgeCenter(d) {
    const s = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source);
    const t = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target);
    const dx = t.x - s.x, dy = t.y - s.y;
    return { x: s.x + dx/2 - dy/10, y: s.y + dy/2 + dx/10 };
}

// Drag behaviors
function dragstarted(event, d) { if (currentTool !== 'move') return; d3.select(this).raise().classed("active", true); }
function dragged(event, d) { if (currentTool !== 'move') return; d.x = event.x; d.y = event.y; renderGraph(); }
function dragended(event, d) { if (currentTool !== 'move') return; d3.select(this).classed("active", false); }

// Editor Interactions
svg.on("click", function(event) {
    if (currentTool === 'node') {
        const coords = d3.pointer(event);
        nodes.push({ id: `N${nodeCounter++}`, x: coords[0], y: coords[1] });
        renderGraph();
    }
});

function handleNodeClick(event, d) {
    if (currentTool === 'edge') {
        if (!dragSource) {
            dragSource = d;
            d3.select(this).classed("active", true);
            log(`Edge source selected: ${d.id}`, 'system');
        } else {
            if (dragSource.id !== d.id) {
                const cap = parseInt(prompt(`Enter capacity for edge ${dragSource.id} -> ${d.id}:`, 10));
                if (!isNaN(cap) && cap > 0) {
                    links.push({ source: dragSource.id, target: d.id, cap: cap, flow: 0 });
                    log(`Edge created: ${dragSource.id} -> ${d.id} [Cap: ${cap}]`, 'success');
                }
            }
            d3.selectAll(".node").classed("active", false);
            dragSource = null;
            renderGraph();
        }
    }
}

document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentTool = e.target.id.replace('tool-', '');
        dragSource = null;
        d3.selectAll(".node").classed("active", false);
    });
});

// --- ALGORITHMS (GENERATORS) ---

function getAdjList() {
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    links.forEach(l => {
        const u = typeof l.source === 'object' ? l.source.id : l.source;
        const v = typeof l.target === 'object' ? l.target.id : l.target;
        adj[u].push({ v, cap: l.cap, flow: l.flow, isRev: false, ref: l });
        adj[v].push({ v: u, cap: 0, flow: -l.flow, isRev: true, ref: l }); // Residual back-edge
    });
    return adj;
}

// 1. Edmonds-Karp
function* runEdmondsKarp(sourceId, sinkId) {
    let maxFlow = 0;
    while (true) {
        const adj = getAdjList();
        const parent = {};
        const queue = [sourceId];
        const visited = new Set([sourceId]);
        
        while (queue.length > 0) {
            const u = queue.shift();
            for (let edge of adj[u]) {
                if (!visited.has(edge.v) && edge.cap - edge.flow > 0) {
                    visited.add(edge.v);
                    parent[edge.v] = { u, edge };
                    queue.push(edge.v);
                }
            }
        }

        if (!parent[sinkId]) break; // No augmenting path

        let pushFlow = Infinity;
        let curr = sinkId;
        const pathEdges = [];
        
        while (curr !== sourceId) {
            const { u, edge } = parent[curr];
            pushFlow = Math.min(pushFlow, edge.cap - edge.flow);
            pathEdges.push({u, v: curr});
            curr = u;
        }

        yield { type: 'path', path: pathEdges, flow: pushFlow, algo: 'EK' };

        curr = sinkId;
        while (curr !== sourceId) {
            const { u, edge } = parent[curr];
            if (edge.isRev) edge.ref.flow -= pushFlow;
            else edge.ref.flow += pushFlow;
            curr = u;
        }

        maxFlow += pushFlow;
        yield { type: 'update', maxFlow };
    }
    yield { type: 'done', maxFlow };
}

// 2. Dinic's Algorithm
function* runDinic(sourceId, sinkId) {
    let maxFlow = 0;
    
    while (true) {
        const adj = getAdjList();
        const level = {};
        const queue = [sourceId];
        level[sourceId] = 0;
        
        // BFS for Level Graph
        while (queue.length > 0) {
            const u = queue.shift();
            for (let edge of adj[u]) {
                if (level[edge.v] === undefined && edge.cap - edge.flow > 0) {
                    level[edge.v] = level[u] + 1;
                    queue.push(edge.v);
                }
            }
        }
        
        if (level[sinkId] === undefined) break; // Terminate
        yield { type: 'level_graph', level, algo: 'Dinic' };

        const ptr = {};
        nodes.forEach(n => ptr[n.id] = 0);

        // DFS for blocking flow
        function dfs(u, pushed) {
            if (pushed === 0) return 0;
            if (u === sinkId) return pushed;
            
            for (; ptr[u] < adj[u].length; ptr[u]++) {
                const edge = adj[u][ptr[u]];
                if (level[u] + 1 !== level[edge.v] || edge.cap - edge.flow === 0) continue;
                
                const tr = dfs(edge.v, Math.min(pushed, edge.cap - edge.flow));
                if (tr === 0) continue;
                
                if (edge.isRev) edge.ref.flow -= tr;
                else edge.ref.flow += tr;
                return tr;
            }
            return 0;
        }

        let pushed;
        while ((pushed = dfs(sourceId, Infinity)) > 0) {
            maxFlow += pushed;
            yield { type: 'update', maxFlow, algo: 'Dinic DFS' };
        }
    }
    yield { type: 'done', maxFlow };
}

// 3. Push-Relabel
function* runPushRelabel(sourceId, sinkId) {
    const adj = getAdjList();
    nodes.forEach(n => { n.h = 0; n.e = 0; });
    
    const sourceNode = nodes.find(n => n.id === sourceId);
    sourceNode.h = nodes.length;

    // Initialize preflow
    for (let edge of adj[sourceId]) {
        if (!edge.isRev) {
            edge.ref.flow = edge.cap;
            nodes.find(n => n.id === edge.v).e = edge.cap;
            sourceNode.e -= edge.cap;
        }
    }
    
    yield { type: 'preflow', algo: 'Push-Relabel' };

    function getActiveNode() {
        return nodes.find(n => n.id !== sourceId && n.id !== sinkId && n.e > 0);
    }

    let active;
    while ((active = getActiveNode()) !== undefined) {
        let pushed = false;
        const uNode = active;
        const u = active.id;

        for (let edge of adj[u]) {
            const vNode = nodes.find(n => n.id === edge.v);
            if (edge.cap - edge.flow > 0 && uNode.h === vNode.h + 1) {
                const delta = Math.min(uNode.e, edge.cap - edge.flow);
                if (edge.isRev) edge.ref.flow -= delta;
                else edge.ref.flow += delta;
                
                uNode.e -= delta;
                vNode.e += delta;
                pushed = true;
                yield { type: 'push', u, v: edge.v, delta, algo: 'Push' };
                break;
            }
        }

        if (!pushed) {
            let minH = Infinity;
            for (let edge of adj[u]) {
                if (edge.cap - edge.flow > 0) {
                    const vNode = nodes.find(n => n.id === edge.v);
                    minH = Math.min(minH, vNode.h);
                }
            }
            uNode.h = minH + 1;
            yield { type: 'relabel', u, h: uNode.h, algo: 'Relabel' };
        }
    }
    
    const maxFlow = nodes.find(n => n.id === sinkId).e;
    yield { type: 'done', maxFlow };
}

// --- ENGINE CONTROLLER ---

function processGeneratorStep(step) {
    d3.selectAll('.link').classed('active bottleneck cut', false);
    d3.selectAll('.node').classed('active cut', false);

    if (step.type === 'path') {
        log(`[${step.algo}] Augmenting Path Found. Bottleneck: ${step.flow}`, 'process');
        step.path.forEach(p => {
            d3.select(`.id-${p.u}-${p.v}`).classed('active', true);
            d3.select(`.id-${p.v}-${p.u}`).classed('active', true);
        });
    } 
    else if (step.type === 'update') {
        log(`Flow updated. Current Network Flow: ${step.maxFlow}`, 'highlight');
        document.getElementById('max-flow-display').innerHTML = `<i class="fas fa-chart-line"></i> Current Flow: ${step.maxFlow}`;
    }
    else if (step.type === 'level_graph') {
        log(`[Dinic] Level Graph constructed via BFS. Executing blocking flows...`, 'process');
    }
    else if (step.type === 'preflow' || step.type === 'push' || step.type === 'relabel') {
        if(step.type === 'push') log(`[Push-Relabel] Pushed ${step.delta} units from ${step.u} to ${step.v}`, 'process');
        if(step.type === 'relabel') log(`[Push-Relabel] Relabeled Node ${step.u} to height ${step.h}`, 'highlight');
    }
    else if (step.type === 'done') {
        log(`Algorithm Complete. Maximum Flow is ${step.maxFlow}`, 'success');
        isPlaying = false;
        document.getElementById('btn-play').innerHTML = `<i class="fas fa-play"></i> Run`;
    }
    renderGraph();
}

const engineTick = () => {
    if (!isPlaying || !currentGenerator) return;
    const { value, done } = currentGenerator.next();
    if (value) processGeneratorStep(value);
    if (!done) setTimeout(engineTick, 1000); // 1 second per frame
};

// --- BINDINGS ---

document.getElementById('btn-play').addEventListener('click', () => {
    if (isPlaying) {
        isPlaying = false;
        document.getElementById('btn-play').innerHTML = `<i class="fas fa-play"></i> Run`;
        return;
    }
    
    if (!currentGenerator) {
        // Init Generator
        const algo = document.getElementById('algo-select').value;
        const source = nodes.find(n => n.isSource)?.id || 'S';
        const sink = nodes.find(n => n.isSink)?.id || 'T';
        
        if (algo === 'edmonds-karp') currentGenerator = runEdmondsKarp(source, sink);
        if (algo === 'dinic') currentGenerator = runDinic(source, sink);
        if (algo === 'push-relabel') currentGenerator = runPushRelabel(source, sink);
        
        log(`Initializing ${algo.toUpperCase()}...`, 'system');
    }
    
    isPlaying = true;
    document.getElementById('btn-play').innerHTML = `<i class="fas fa-pause"></i> Pause`;
    engineTick();
});

document.getElementById('btn-step').addEventListener('click', () => {
    if (isPlaying) return;
    if (!currentGenerator) document.getElementById('btn-play').click();
    else {
        const { value, done } = currentGenerator.next();
        if (value) processGeneratorStep(value);
    }
});

document.getElementById('btn-reset').addEventListener('click', () => {
    links.forEach(l => l.flow = 0);
    nodes.forEach(n => { delete n.h; delete n.e; });
    currentGenerator = null;
    isPlaying = false;
    document.getElementById('btn-play').innerHTML = `<i class="fas fa-play"></i> Run`;
    document.getElementById('max-flow-display').innerHTML = `<i class="fas fa-chart-line"></i> Current Flow: 0`;
    log('Network flow reset to 0.', 'system');
    d3.selectAll('.link').classed('active bottleneck cut', false);
    d3.selectAll('.node').classed('active cut', false);
    renderGraph();
});

document.getElementById('btn-clear-graph').addEventListener('click', () => {
    nodes = [{ id: 'S', isSource: true, x: 100, y: 300 }, { id: 'T', isSink: true, x: 700, y: 300 }];
    links = [];
    document.getElementById('btn-reset').click();
    log('Graph cleared. Draw a new network.', 'error');
});

document.getElementById('btn-min-cut').addEventListener('click', () => {
    const sourceId = nodes.find(n => n.isSource)?.id || 'S';
    const adj = getAdjList();
    const visited = new Set([sourceId]);
    const queue = [sourceId];
    
    while (queue.length > 0) {
        const u = queue.shift();
        for (let edge of adj[u]) {
            if (!visited.has(edge.v) && edge.cap - edge.flow > 0) {
                visited.add(edge.v);
                queue.push(edge.v);
            }
        }
    }
    
    d3.selectAll('.node').classed('cut', d => visited.has(d.id));
    d3.selectAll('.link').classed('cut', d => {
        const sId = typeof d.source === 'object' ? d.source.id : d.source;
        const tId = typeof d.target === 'object' ? d.target.id : d.target;
        return visited.has(sId) && !visited.has(tId);
    });
    
    log('Min-Cut visualized: Source partition (Red nodes), Cut Edges (Dashed red).', 'error');
});

// Init
renderGraph();
window.addEventListener('resize', () => { renderGraph(); });
