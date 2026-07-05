/**
 * sql-visualizer.js
 * Initializes WebAssembly SQLite, populates mock data, executes user SQL queries,
 * and parses EXPLAIN QUERY PLAN data into a D3.js interactive tree.
 */

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

// State & Globals
let db = null;
let editor = null;

const els = {
    engineBadge: document.getElementById('engineBadge'),
    editorContainer: document.getElementById('editorContainer'),
    btnRunQuery: document.getElementById('btnRunQuery'),
    btnSeedData: document.getElementById('btnSeedData'),
    btnCreateIndex: document.getElementById('btnCreateIndex'),
    btnPresetSlow: document.getElementById('btnPresetSlow'),
    btnPresetJoin: document.getElementById('btnPresetJoin'),
    
    tableHead: document.getElementById('tableHead'),
    tableBody: document.getElementById('tableBody'),
    executionTime: document.getElementById('executionTime'),
    
    graphContainer: document.getElementById('graphContainer'),
    graphEmptyState: document.getElementById('graphEmptyState')
};

// ==========================================
// 1. INITIALIZATION & WASM SETUP
// ==========================================
async function initApp() {
    initCodeMirror();
    
    try {
        // Initialize SQL.js via WebAssembly
        const SQL = await initSqlJs({
            // Fetch WASM binary from CDN
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        
        // Create an in-memory database
        db = new SQL.Database();
        
        // Update UI
        els.engineBadge.classList.add('ready');
        els.engineBadge.innerHTML = '<i class="fas fa-check-circle"></i> SQLite Wasm Ready';
        els.btnRunQuery.disabled = false;
        
        setupEvents();
        createSchema(); // Build basic tables
        
    } catch (err) {
        console.error("WASM Load Error:", err);
        els.engineBadge.innerHTML = '<i class="fas fa-times-circle"></i> Engine Failed to Load';
        els.engineBadge.style.color = '#ef4444';
    }
}

function initCodeMirror() {
    editor = CodeMirror(els.editorContainer, {
        lineNumbers: true,
        theme: 'material-ocean',
        mode: 'text/x-sql',
        indentUnit: 4,
        value: `-- Find users older than 45 in 'New York'
SELECT * FROM users 
WHERE age > 45 AND city = 'New York'
ORDER BY age DESC;`
    });
}

function setupEvents() {
    els.btnRunQuery.addEventListener('click', executeUserQuery);
    
    els.btnSeedData.addEventListener('click', () => {
        seedMockData(10000); // 10k rows for realistic query plan parsing
    });
    
    els.btnCreateIndex.addEventListener('click', () => {
        const start = performance.now();
        db.run("CREATE INDEX idx_users_age ON users(age);");
        const t = (performance.now() - start).toFixed(1);
        renderSuccessTable(`Index created on users(age) in ${t}ms. Run the query again to see the plan change!`);
        
        els.btnCreateIndex.disabled = true;
        els.btnCreateIndex.innerHTML = '<i class="fas fa-check"></i> Index Added';
    });

    els.btnPresetSlow.addEventListener('click', () => {
        editor.setValue(`SELECT * FROM users \nWHERE age = 30 AND city = 'Los Angeles';`);
    });

    els.btnPresetJoin.addEventListener('click', () => {
        editor.setValue(`SELECT u.name, o.amount \nFROM users u \nJOIN orders o ON u.id = o.user_id \nWHERE u.age > 40 \nORDER BY o.amount DESC \nLIMIT 10;`);
    });
}

// ==========================================
// 2. DATABASE OPERATIONS
// ==========================================
function createSchema() {
    const schema = `
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            age INTEGER,
            city TEXT
        );
        CREATE TABLE orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            amount DECIMAL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `;
    db.run(schema);
    renderSuccessTable("Schema created. Click 'Seed 10k Rows' to populate data.");
}

function seedMockData(count) {
    els.btnSeedData.disabled = true;
    els.btnSeedData.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Seeding...';
    
    // Use setTimeout to allow UI to render the loading state before blocking thread
    setTimeout(() => {
        const start = performance.now();
        
        // Optimize mass inserts using a transaction
        db.run("BEGIN TRANSACTION;");
        const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'London', 'Tokyo'];
        
        const insertUser = db.prepare("INSERT INTO users (name, age, city) VALUES (?, ?, ?)");
        const insertOrder = db.prepare("INSERT INTO orders (user_id, amount) VALUES (?, ?)");
        
        for (let i = 1; i <= count; i++) {
            const age = Math.floor(Math.random() * 60) + 18;
            const city = cities[Math.floor(Math.random() * cities.length)];
            insertUser.run([`User_${i}`, age, city]);
            
            // Randomly create an order for some users
            if (Math.random() > 0.5) {
                insertOrder.run([i, (Math.random() * 500).toFixed(2)]);
            }
        }
        
        insertUser.free();
        insertOrder.free();
        db.run("COMMIT;");
        
        const duration = (performance.now() - start).toFixed(1);
        renderSuccessTable(`Successfully seeded ${count} users and orders in ${duration}ms.`);
        
        els.btnSeedData.innerHTML = '<i class="fas fa-check"></i> Seeded';
    }, 50);
}

async function executeUserQuery() {
    const sql = editor.getValue().trim();
    if (!sql) return;

    const start = performance.now();
    try {
        // 1. Execute actual query and render table
        const results = db.exec(sql);
        const time = (performance.now() - start).toFixed(1);
        els.executionTime.textContent = `${time}ms`;
        
        renderResultsTable(results);

        // 2. Generate and Render EXPLAIN QUERY PLAN
        const planSql = `EXPLAIN QUERY PLAN ${sql}`;
        const planResults = db.exec(planSql);
        
        parseAndRenderQueryPlan(planResults);

    } catch (err) {
        els.executionTime.textContent = `Error`;
        renderErrorTable(err.message);
        els.graphContainer.innerHTML = '';
        els.graphContainer.appendChild(els.graphEmptyState);
        els.graphEmptyState.style.display = 'block';
    }
}

// ==========================================
// 3. TABLE RENDERING
// ==========================================
function renderResultsTable(results) {
    els.tableHead.innerHTML = '';
    els.tableBody.innerHTML = '';

    if (!results || results.length === 0) {
        els.tableHead.innerHTML = '<th>Success</th>';
        els.tableBody.innerHTML = '<tr><td>0 rows returned.</td></tr>';
        return;
    }

    const columns = results[0].columns;
    const values = results[0].values;

    // Headers
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        els.tableHead.appendChild(th);
    });

    // Rows (Limit to 50 for performance in UI)
    const limit = Math.min(values.length, 50);
    for (let i = 0; i < limit; i++) {
        const tr = document.createElement('tr');
        values[i].forEach(val => {
            const td = document.createElement('td');
            td.textContent = val !== null ? val : 'NULL';
            tr.appendChild(td);
        });
        els.tableBody.appendChild(tr);
    }

    if (values.length > 50) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = columns.length;
        td.textContent = `... and ${values.length - 50} more rows (hidden for UI performance)`;
        td.style.fontStyle = 'italic';
        td.style.color = 'var(--text-secondary)';
        tr.appendChild(td);
        els.tableBody.appendChild(tr);
    }
}

function renderSuccessTable(msg) {
    els.tableHead.innerHTML = '<th>System Message</th>';
    els.tableBody.innerHTML = `<tr><td style="color: var(--sql-accent);">${msg}</td></tr>`;
}

function renderErrorTable(msg) {
    els.tableHead.innerHTML = '<th>Execution Error</th>';
    els.tableBody.innerHTML = `<tr><td class="sql-error">${msg}</td></tr>`;
}

// ==========================================
// 4. D3.JS QUERY PLAN GRAPH RENDERING
// ==========================================
function parseAndRenderQueryPlan(planResults) {
    els.graphEmptyState.style.display = 'none';
    
    // SQLite EXPLAIN QUERY PLAN returns: [id, parent, notused, detail]
    // We must format this into a D3 Hierarchy
    let planData = [
        { id: "root", parent: "", detail: "QUERY EXECUTION" }
    ];

    if (planResults && planResults.length > 0 && planResults[0].values) {
        planResults[0].values.forEach(row => {
            // row[0] = id, row[1] = parent
            let parentId = row[1] === 0 ? "root" : row[1].toString();
            planData.push({
                id: row[0].toString(),
                parent: parentId,
                detail: row[3]
            });
        });
    } else {
        planData.push({ id: "1", parent: "root", detail: "SIMPLE EXECUTION" });
    }

    renderD3Tree(planData);
}

function renderD3Tree(data) {
    // Clear previous SVG
    d3.select("#graphContainer").selectAll("svg").remove();

    const containerRect = els.graphContainer.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;
    const margin = { top: 40, right: 90, bottom: 40, left: 90 };

    // Set up D3 SVG with Zoom/Pan
    const svg = d3.select("#graphContainer")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom().on("zoom", (event) => {
            svgGroup.attr("transform", event.transform);
        }))
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
        
    const svgGroup = svg; // The group that actually scales/moves

    try {
        // Build Hierarchy
        const root = d3.stratify()
            .id(d => d.id)
            .parentId(d => d.parent)(data);

        // Configure Tree Layout
        // Spread nodes out vertically
        const treeLayout = d3.tree().nodeSize([60, 200]);
        treeLayout(root);

        // Center the tree horizontally
        const xOffset = width / 2;
        root.each(d => d.x += xOffset);

        // 1. Draw Links (Edges)
        svgGroup.selectAll(".link")
            .data(root.links())
            .enter().append("path")
            .attr("class", "link")
            .attr("d", d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y)
            );

        // 2. Draw Nodes
        const node = svgGroup.selectAll(".node")
            .data(root.descendants())
            .enter().append("g")
            .attr("class", d => {
                const detail = d.data.detail.toUpperCase();
                if (detail.includes("SCAN TABLE")) return "node node-scan";
                if (detail.includes("SEARCH TABLE")) return "node node-search";
                return "node node-default";
            })
            .attr("transform", d => `translate(${d.x},${d.y})`);

        // Node Rectangles
        node.append("rect")
            .attr("width", 220)
            .attr("height", 40)
            .attr("x", -110)
            .attr("y", -20);

        // Node Text (Wrap text logic simplified by truncating for now, or multi-tspan)
        node.append("text")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(d => {
                let txt = d.data.detail;
                return txt.length > 30 ? txt.substring(0, 27) + "..." : txt;
            })
            .append("title") // Native HTML tooltip for full text
            .text(d => d.data.detail);

    } catch (e) {
        console.error("D3 Rendering Error: ", e);
        els.graphEmptyState.style.display = 'block';
        els.graphEmptyState.innerHTML = '<p>Error generating execution plan graph.</p>';
    }
}
