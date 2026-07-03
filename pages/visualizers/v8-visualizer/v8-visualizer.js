/**
 * v8-visualizer.js
 * Implements a mock JavaScript VM to visualize Hidden Classes (Maps) and Inline Caching.
 * Parses user code step-by-step and dynamically updates a D3.js Map Transition Tree.
 */

document.addEventListener("DOMContentLoaded", () => {
    initV8Visualizer();
});

// ==========================================
// 1. ENGINE STATE & DATA STRUCTURES
// ==========================================

const V8Engine = {
    // Hidden Classes (Maps)
    maps: {
        'Map0': { id: 'Map0', props: [], transitions: {} }
    },
    mapCount: 0,
    
    // JS Memory
    objects: {}, // e.g., { 'p1': 'Map2' }
    
    // Inline Caches
    functions: {}, // e.g., { 'getX': { state: 'UNINITIALIZED', cache: Set() } }
    
    // Parser State
    lines: [],
    currentLine: 0
};

// Default Tutorial Script designed to perfectly hit all IC States
const DEFAULT_SCRIPT = 
`// 1. Define a function that reads a property
function getX(obj) { return obj.x; }

// 2. Objects sharing a Hidden Class
let p1 = {};
p1.x = 1;      // Creates Map1
p1.y = 2;      // Creates Map2
getX(p1);      // UNINITIALIZED -> MONOMORPHIC

let p2 = {};
p2.x = 3;
p2.y = 4;
getX(p2);      // Remains MONOMORPHIC (Shares Map2)

// 3. Divergent Property Order
let p3 = {};
p3.y = 5;      // Diverges! Creates Map3
p3.x = 6;      // Creates Map4
getX(p3);      // Map2 & Map4 -> POLYMORPHIC

// 4. Megamorphic De-optimization Cliff
let p4 = {}; p4.a = 1; p4.x = 1; getX(p4);
let p5 = {}; p5.b = 1; p5.x = 1; getX(p5);
let p6 = {}; p6.c = 1; p6.x = 1; getX(p6); // DE-OPTIMIZED!
`;

const els = {
    btnStep: document.getElementById('btnStep'),
    btnReset: document.getElementById('btnReset'),
    logContainer: document.getElementById('logContainer'),
    mapCountDisplay: document.getElementById('mapCountDisplay'),
    icContainer: document.getElementById('icContainer'),
    icEmptyState: document.getElementById('icEmptyState'),
    objGrid: document.getElementById('objGrid'),
    d3Container: document.getElementById('d3Container')
};

let editor;
let d3Svg, d3G, activeMapNodeId = null;

// ==========================================
// 2. INITIALIZATION & UI
// ==========================================

function initV8Visualizer() {
    editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
        lineNumbers: true,
        theme: 'material-darker',
        mode: 'javascript',
        readOnly: false // Allow edits before starting
    });
    
    editor.setValue(DEFAULT_SCRIPT);

    els.btnStep.addEventListener('click', stepExecution);
    els.btnReset.addEventListener('click', resetEngine);

    initD3Tree();
}

function resetEngine() {
    V8Engine.maps = { 'Map0': { id: 'Map0', props: [], transitions: {} } };
    V8Engine.mapCount = 0;
    V8Engine.objects = {};
    V8Engine.functions = {};
    V8Engine.lines = editor.getValue().split('\n');
    V8Engine.currentLine = 0;
    activeMapNodeId = null;

    editor.setOption('readOnly', false);
    
    // Clear UI Highlights
    editor.getAllMarks().forEach(marker => marker.clear());
    els.logContainer.innerHTML = '<div class="log-entry sys">> VM Reset. Memory cleared.</div>';
    els.mapCountDisplay.textContent = '1';
    els.objGrid.innerHTML = '';
    els.icContainer.innerHTML = '';
    els.icContainer.appendChild(els.icEmptyState);
    els.icEmptyState.style.display = 'block';
    els.btnStep.disabled = false;

    renderD3Tree();
}

function logVM(msg, type = 'sys') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = `> ${msg}`;
    els.logContainer.appendChild(div);
    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

// ==========================================
// 3. JIT PARSER & EXECUTION ENGINE
// ==========================================

function stepExecution() {
    // Lock editor on first step
    if (V8Engine.currentLine === 0) {
        editor.setOption('readOnly', true);
        V8Engine.lines = editor.getValue().split('\n');
    }

    if (V8Engine.currentLine >= V8Engine.lines.length) {
        logVM("Execution finished. EOF.", "sys");
        els.btnStep.disabled = true;
        return;
    }

    // Highlight current line
    editor.getAllMarks().forEach(marker => marker.clear());
    editor.markText(
        {line: V8Engine.currentLine, ch: 0},
        {line: V8Engine.currentLine, ch: 100},
        {className: 'active-line-highlight'}
    );

    const rawLine = V8Engine.lines[V8Engine.currentLine];
    const line = rawLine.split('//')[0].trim(); // Remove comments
    V8Engine.currentLine++;

    if (!line) {
        stepExecution(); // Skip empty/comment lines
        return;
    }

    parseAndExecute(line);
    updateUI();
}

function parseAndExecute(line) {
    let m;

    // 1. Function Definition: function getX(obj) { ... }
    if ((m = line.match(/function\s+(\w+)\s*\(/))) {
        const funcName = m[1];
        V8Engine.functions[funcName] = { state: 'UNINITIALIZED', cache: new Set() };
        logVM(`Parsed function definition: ${funcName}()`, "sys");
        return;
    }

    // 2. Object Allocation: let p1 = {};
    if ((m = line.match(/(?:let|const|var)\s+(\w+)\s*=\s*\{\}/))) {
        const objName = m[1];
        V8Engine.objects[objName] = 'Map0';
        activeMapNodeId = 'Map0';
        logVM(`Allocated object '${objName}' -> Map0`, "map");
        return;
    }

    // 3. Inline Allocation: let p4 = {}; p4.a = 1; (Handled by simple splits if on same line)
    // The parser expects separated commands via semi-colons for safety
    const commands = line.split(';').map(s => s.trim()).filter(Boolean);
    if (commands.length > 1) {
        commands.forEach(cmd => parseAndExecute(cmd));
        return;
    }

    // 4. Property Assignment: p1.x = 1;
    if ((m = line.match(/(\w+)\.(\w+)\s*=\s*.+/))) {
        const objName = m[1];
        const propName = m[2];
        
        if (!V8Engine.objects[objName]) {
            logVM(`Error: Object '${objName}' is undefined.`, "sys");
            return;
        }

        let currentMapId = V8Engine.objects[objName];
        let currentMap = V8Engine.maps[currentMapId];

        // Check Hidden Class Transition
        if (currentMap.transitions[propName]) {
            // Follow existing transition
            const nextMapId = currentMap.transitions[propName];
            V8Engine.objects[objName] = nextMapId;
            activeMapNodeId = nextMapId;
            logVM(`Transition: ${objName} (${currentMapId} -> ${nextMapId}) [+${propName}]`, "map");
        } else {
            // Create new Map
            V8Engine.mapCount++;
            const newMapId = 'Map' + V8Engine.mapCount;
            
            V8Engine.maps[newMapId] = {
                id: newMapId,
                props: [...currentMap.props, propName],
                transitions: {}
            };
            currentMap.transitions[propName] = newMapId;
            V8Engine.objects[objName] = newMapId;
            activeMapNodeId = newMapId;
            
            logVM(`Created Hidden Class ${newMapId} [+${propName}]`, "map");
        }
        return;
    }

    // 5. Function Call: getX(p1);
    if ((m = line.match(/(\w+)\((\w+)\)/))) {
        const funcName = m[1];
        const objName = m[2];
        
        if (!V8Engine.functions[funcName] || !V8Engine.objects[objName]) return;

        const objMapId = V8Engine.objects[objName];
        const funcInfo = V8Engine.functions[funcName];
        activeMapNodeId = objMapId;

        // Update Inline Cache
        funcInfo.cache.add(objMapId);
        const cacheSize = funcInfo.cache.size;

        let prevState = funcInfo.state;
        if (cacheSize === 1) funcInfo.state = 'MONOMORPHIC';
        else if (cacheSize <= 4) funcInfo.state = 'POLYMORPHIC';
        else funcInfo.state = 'MEGAMORPHIC';

        if (funcInfo.state !== prevState) {
            if (funcInfo.state === 'MEGAMORPHIC') {
                logVM(`DE-OPTIMIZATION: ${funcName}() hit Megamorphic cliff! (Too many shapes)`, "deopt");
            } else {
                logVM(`IC State Change: ${funcName}() -> ${funcInfo.state}`, "ic");
            }
        } else {
            logVM(`Called ${funcName}(${objName}). Cache hit: ${objMapId}`, "ic");
        }
        return;
    }
}

// ==========================================
// 4. UI SYNCHRONIZATION
// ==========================================

function updateUI() {
    // 1. Update Object Memory Grid
    els.objGrid.innerHTML = '';
    for (const [objName, mapId] of Object.entries(V8Engine.objects)) {
        const div = document.createElement('div');
        div.className = 'obj-card';
        div.innerHTML = `<span class="obj-name">${objName}</span> <span class="obj-ptr">-> ${mapId}</span>`;
        els.objGrid.appendChild(div);
    }

    // 2. Update IC Cards
    els.icContainer.innerHTML = '';
    const funcs = Object.keys(V8Engine.functions);
    if (funcs.length > 0) els.icEmptyState.style.display = 'none';

    funcs.forEach(funcName => {
        const info = V8Engine.functions[funcName];
        const card = document.createElement('div');
        card.className = 'ic-card';
        
        let tagsHtml = Array.from(info.cache).map(mId => `<span class="ic-map-tag">${mId}</span>`).join('');
        if (info.state === 'MEGAMORPHIC') tagsHtml = `<span class="ic-map-tag" style="color:#ef4444; border-color:#ef4444;">Generic Dictionary Lookup</span>`;
        if (info.cache.size === 0) tagsHtml = `<span class="ic-map-tag" style="color:#64748b; border-color:#64748b;">No data</span>`;

        card.innerHTML = `
            <div class="ic-header">
                <span class="ic-func">${funcName}()</span>
                <span class="ic-status ${info.state}">${info.state}</span>
            </div>
            <div class="ic-body">${tagsHtml}</div>
        `;
        els.icContainer.appendChild(card);
    });

    // 3. Map Count
    els.mapCountDisplay.textContent = V8Engine.mapCount + 1;

    // 4. Render D3 Tree
    renderD3Tree();
}

// ==========================================
// 5. D3.JS HIDDEN CLASS TREE RENDERER
// ==========================================

function initD3Tree() {
    const width = els.d3Container.clientWidth;
    const height = els.d3Container.clientHeight || 400;

    d3Svg = d3.select("#d3Container").append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .call(d3.zoom().on("zoom", (event) => {
            d3G.attr("transform", event.transform);
        }));

    d3G = d3Svg.append("g").attr("transform", `translate(${width / 2}, 40)`);
    renderD3Tree();
}

function buildD3Hierarchy(mapId) {
    const map = V8Engine.maps[mapId];
    const node = {
        name: map.id,
        props: map.props.join(', '),
        children: []
    };

    for (const [propName, childMapId] of Object.entries(map.transitions)) {
        const childNode = buildD3Hierarchy(childMapId);
        childNode.transitionProp = propName; // Store for edge label
        node.children.push(childNode);
    }
    return node;
}

function renderD3Tree() {
    d3G.selectAll("*").remove();

    const rootData = buildD3Hierarchy('Map0');
    const root = d3.hierarchy(rootData);
    
    // Setup tree layout
    const treeLayout = d3.tree().nodeSize([120, 80]);
    treeLayout(root);

    // Links
    const links = d3G.selectAll(".link")
        .data(root.links())
        .enter().append("g");

    links.append("path")
        .attr("class", "link")
        .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y));

    // Link Labels (The property that caused the transition)
    links.append("text")
        .attr("class", "link-label")
        .attr("x", d => (d.source.x + d.target.x) / 2 + 10)
        .attr("y", d => (d.source.y + d.target.y) / 2)
        .text(d => `+${d.target.data.transitionProp}`);

    // Nodes
    const nodes = d3G.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", d => `node ${d.data.name === activeMapNodeId ? 'active' : ''}`)
        .attr("transform", d => `translate(${d.x},${d.y})`);

    nodes.append("circle").attr("r", 20);

    nodes.append("text")
        .attr("dy", "-25px")
        .attr("text-anchor", "middle")
        .text(d => d.data.name);

    nodes.append("text")
        .attr("class", "node-props")
        .attr("dy", "5px")
        .attr("text-anchor", "middle")
        .text(d => d.data.props ? `{${d.data.props}}` : '{}');
}
