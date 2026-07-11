/**
 * Algo-Infinity-Verse | Cassandra Learning Hub
 * Features: Mock CQL Engine, Token Ring Hash Visualizer, Module Progress Tracker.
 */

// --- 1. MOCK CQL ENGINE ---
class MockCQLEngine {
    constructor() {
        // Pre-populated mock table
        this.tables = {
            users: [
                { id: 1, username: 'alice', email: 'alice@example.com', country: 'US' },
                { id: 2, username: 'bob', email: 'bob@example.com', country: 'UK' },
                { id: 3, username: 'charlie', email: 'charlie@example.com', country: 'CA' }
            ]
        };
    }

    execute(query) {
        if (!query.trim()) return "";
        const cleanQuery = query.trim().replace(/;$/, '');
        const qUpper = cleanQuery.toUpperCase();

        try {
            if (qUpper === 'HELP') {
                return `Documented commands:\n--------------------\nSELECT   INSERT   UPDATE   DELETE   DESCRIBE`;
            }
            
            if (qUpper.startsWith('DESCRIBE TABLES') || qUpper.startsWith('DESC TABLES')) {
                return Object.keys(this.tables).join('\n');
            }

            // MOCK SELECT
            if (qUpper.startsWith('SELECT')) {
                const match = qUpper.match(/SELECT\s+(.+)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/);
                if (!match) throw new Error("SyntaxException: line 1: missing EOF at 'select'");
                
                const fields = match[1].split(',').map(s => s.trim().toLowerCase());
                const table = match[2].toLowerCase();
                const whereClause = match[3];

                if (!this.tables[table]) throw new Error(`InvalidRequest: unconfigured table ${table}`);

                let results = this.tables[table];

                if (whereClause) {
                    const condition = whereClause.match(/(\w+)\s*=\s*(.+)/);
                    if (condition) {
                        const key = condition[1].toLowerCase();
                        let val = condition[2].replace(/^'|'$/g, '');
                        // Mock type casting for ID
                        if (key === 'id') val = parseInt(val);
                        results = results.filter(row => row[key] === val);
                    }
                }

                if (results.length === 0) return "(0 rows)";
                return this.formatTable(results, fields.includes('*') ? Object.keys(results[0]) : fields);
            }

            // MOCK INSERT
            if (qUpper.startsWith('INSERT INTO')) {
                const match = qUpper.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/);
                if (!match) throw new Error("SyntaxException: line 1: missing EOF at 'insert'");

                const table = match[1].toLowerCase();
                const cols = match[2].split(',').map(s => s.trim().toLowerCase());
                const vals = match[3].split(',').map(s => s.trim().replace(/^'|'$/g, ''));

                if (!this.tables[table]) this.tables[table] = [];

                const newRow = {};
                cols.forEach((col, idx) => {
                    newRow[col] = (col === 'id') ? parseInt(vals[idx]) : vals[idx];
                });

                this.tables[table].push(newRow);
                return ""; // CQL INSERT returns nothing on success
            }

            return `SyntaxException: unhandled statement '${cleanQuery}'`;
            
        } catch (e) {
            return e.message;
        }
    }

    formatTable(data, columns) {
        if (!data || data.length === 0) return "";
        let header = columns.join(' | ');
        let separator = columns.map(c => '-'.repeat(c.length)).join('-+-');
        
        let rows = data.map(row => {
            return columns.map(col => row[col] !== undefined ? row[col] : 'null').join(' | ');
        });

        return `${header}\n${separator}\n${rows.join('\n')}\n\n(${data.length} rows)`;
    }
}


// --- 2. CASSANDRA RING VISUALIZER (HTML5 Canvas) ---
class RingVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.numNodes = 6;
        this.activeHashAngle = null;
        this.replicaNodes = [];
        
        this.initNodes();
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    initNodes() {
        for(let i=0; i<this.numNodes; i++) {
            // Distribute 6 nodes evenly around the ring (0 to 360 deg)
            this.nodes.push({
                id: `Node-${i+1}`,
                angle: (i * (Math.PI * 2)) / this.numNodes,
                color: '#334155'
            });
        }
    }

    resize() {
        const wrapper = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = wrapper.clientWidth * dpr;
        this.canvas.height = wrapper.clientHeight * dpr;
        this.ctx.scale(dpr, dpr);
        this.centerX = wrapper.clientWidth / 2;
        this.centerY = wrapper.clientHeight / 2;
        this.radius = Math.min(this.centerX, this.centerY) - 40;
        this.render();
    }

    // Very simple mock hash function to map a string to an angle (0 to 2PI)
    mockMurmur3HashToAngle(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        hash = Math.abs(hash);
        return (hash % 360) * (Math.PI / 180);
    }

    simulateWrite(partitionKey) {
        this.activeHashAngle = this.mockMurmur3HashToAngle(partitionKey);
        
        // Find Primary Node (First node moving clockwise from hash angle)
        let primaryIdx = -1;
        let minDiff = Infinity;
        
        for (let i = 0; i < this.nodes.length; i++) {
            let diff = this.nodes[i].angle - this.activeHashAngle;
            if (diff < 0) diff += Math.PI * 2;
            if (diff < minDiff) {
                minDiff = diff;
                primaryIdx = i;
            }
        }

        // RF=3: Primary + Next 2 nodes clockwise
        this.replicaNodes = [
            primaryIdx,
            (primaryIdx + 1) % this.numNodes,
            (primaryIdx + 2) % this.numNodes
        ];

        this.render();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Ring
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 15;
        this.ctx.stroke();

        // Draw Data Hash Point
        if (this.activeHashAngle !== null) {
            const hx = this.centerX + this.radius * Math.cos(this.activeHashAngle);
            const hy = this.centerY + this.radius * Math.sin(this.activeHashAngle);
            
            this.ctx.beginPath();
            this.ctx.arc(hx, hy, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = '#06b6d4'; // Cyan for Data
            this.ctx.fill();
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#06b6d4';
            
            this.ctx.fillStyle = '#f8fafc';
            this.ctx.font = '12px "Fira Code"';
            this.ctx.fillText("Data Hash", hx + 15, hy);
            this.ctx.shadowBlur = 0; // Reset
        }

        // Draw Nodes & Replication Arrows
        this.nodes.forEach((node, idx) => {
            const nx = this.centerX + this.radius * Math.cos(node.angle);
            const ny = this.centerY + this.radius * Math.sin(node.angle);
            
            let isPrimary = this.replicaNodes[0] === idx;
            let isReplica = this.replicaNodes.includes(idx) && !isPrimary;
            
            // Draw Replication connection lines from Primary
            if (isReplica && this.replicaNodes.length > 0) {
                const px = this.centerX + this.radius * Math.cos(this.nodes[this.replicaNodes[0]].angle);
                const py = this.centerY + this.radius * Math.sin(this.nodes[this.replicaNodes[0]].angle);
                
                this.ctx.beginPath();
                this.ctx.moveTo(px, py);
                this.ctx.lineTo(nx, ny);
                this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
                this.ctx.setLineDash([5, 5]);
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }

            // Node Circle
            this.ctx.beginPath();
            this.ctx.arc(nx, ny, 16, 0, Math.PI * 2);
            if (isPrimary) {
                this.ctx.fillStyle = '#3b82f6'; // Blue for Primary
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#3b82f6';
            } else if (isReplica) {
                this.ctx.fillStyle = '#10b981'; // Green for Replica
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#10b981';
            } else {
                this.ctx.fillStyle = '#1e293b'; // Default
                this.ctx.shadowBlur = 0;
            }
            this.ctx.fill();
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = isPrimary || isReplica ? '#fff' : '#475569';
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            // Node Label
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.font = '10px Inter';
            this.ctx.textAlign = 'center';
            // Offset text outside the ring
            const textOffset = 30;
            this.ctx.fillText(node.id, nx + Math.cos(node.angle) * textOffset, ny + Math.sin(node.angle) * textOffset);
            
            if (isPrimary) this.ctx.fillText("(Primary)", nx + Math.cos(node.angle) * textOffset, ny + 12 + Math.sin(node.angle) * textOffset);
            if (isReplica) this.ctx.fillText("(Replica)", nx + Math.cos(node.angle) * textOffset, ny + 12 + Math.sin(node.angle) * textOffset);
        });
    }
}


// --- 3. CURRICULUM DATA ---
const MODULES = [
    {
        id: 'basics', title: '1. Cassandra Basics & Architecture',
        content: `
            <h3>What is Apache Cassandra?</h3>
            <p>Cassandra is a highly scalable, distributed NoSQL database designed to handle large amounts of data across many commodity servers, providing high availability with <strong>no single point of failure</strong>.</p>
            <h3>Masterless Architecture</h3>
            <p>Unlike relational databases, all nodes in a Cassandra cluster are exactly identical (peer-to-peer). They communicate state via a <em>Gossip Protocol</em>.</p>
            <ul>
                <li><strong>High Availability:</strong> If a node dies, others serve the data.</li>
                <li><strong>Linear Scalability:</strong> Need more capacity? Just add another node to the ring.</li>
            </ul>
        `
    },
    {
        id: 'partitioning', title: '2. Partition Keys & Token Ring',
        content: `
            <h3>How data is distributed</h3>
            <p>Cassandra distributes data across the cluster using a <strong>Token Ring</strong> architecture. When you insert a row, Cassandra hashes the <code>Partition Key</code> (e.g., using Murmur3) to generate a Token.</p>
            <p>This Token determines exactly which node in the ring owns that piece of data.</p>
            <h3>Try it out!</h3>
            <p>Use the <strong>Token Ring Visualizer</strong> below. Enter a Partition Key and click 'Simulate Write'. Watch how the hash calculates a position on the ring and assigns it to a Primary Node.</p>
        `
    },
    {
        id: 'replication', title: '3. Replication & RF',
        content: `
            <h3>Replication Factor (RF)</h3>
            <p>To ensure data isn't lost if a node fails, Cassandra replicates data to multiple nodes. If RF=3, data is written to the Primary Node, and then copied to the next two nodes moving clockwise around the ring.</p>
            <p><em>Check the Visualizer below. Notice how the Primary node (Blue) forwards data to the next 2 Replicas (Green).</em></p>
            <h3>Consistency Levels (CL)</h3>
            <p>CL determines how many nodes must acknowledge a read/write before considering it successful.</p>
            <ul>
                <li><strong>CL.ONE:</strong> Fast, but you might read stale data.</li>
                <li><strong>CL.QUORUM:</strong> Majority must agree (e.g., 2 out of 3). Strong consistency.</li>
                <li><strong>CL.ALL:</strong> Safest, but if one node is down, the query fails.</li>
            </ul>
        `
    },
    {
        id: 'cql', title: '4. Cassandra Query Language (CQL)',
        content: `
            <h3>Interacting with Data</h3>
            <p>Cassandra uses CQL, which looks very similar to SQL, but operates quite differently under the hood due to the distributed nature of the data.</p>
            <p><strong>Practice in the Terminal below!</strong></p>
            <ul>
                <li><code>SELECT * FROM users;</code></li>
                <li><code>INSERT INTO users (id, username, country) VALUES (4, 'david', 'AU');</code></li>
                <li><code>SELECT username, country FROM users WHERE id = 4;</code></li>
            </ul>
            <p><em>Note: In real Cassandra, you can only use <code>WHERE</code> clauses on Partition Keys or explicitly indexed columns!</em></p>
        `
    },
    {
        id: 'modeling', title: '5. Data Modeling Basics',
        content: `
            <h3>Query-Driven Modeling</h3>
            <p>In RDBMS (SQL), you model data based on relations and use JOINs. <strong>In Cassandra, JOINs do not exist.</strong> You must model your tables based on the exact queries your application will run.</p>
            <ul>
                <li><strong>Rule 1:</strong> Data that is read together must be stored together (in the same partition).</li>
                <li><strong>Rule 2:</strong> Denormalization is good. It's okay to duplicate data across different tables to satisfy different query patterns.</li>
            </ul>
        `
    },
    {
        id: 'quiz', title: '6. Knowledge Check',
        content: `
            <h3>Quick Quiz</h3>
            <p><strong>Q1: What happens if a node goes down in Cassandra?</strong><br>
            A: The cluster continues to operate. Client requests are routed to Replica nodes.</p>
            <p><strong>Q2: Why are there no JOINs in Cassandra?</strong><br>
            A: Because data is distributed across different physical servers. A JOIN would require expensive network calls between servers, killing performance.</p>
            <p><em>Great job! You have completed the Cassandra basics module.</em></p>
        `
    }
];

// --- 4. MAIN UI CONTROLLER ---
class CassandraHub {
    constructor() {
        this.cqlEngine = new MockCQLEngine();
        this.ringViz = new RingVisualizer('cassandra-ring-canvas');
        this.completedModules = new Set();
        this.activeModuleId = MODULES[0].id;

        // DOM Elements
        this.moduleListDom = document.getElementById('module-list');
        this.lessonTitle = document.getElementById('lesson-title');
        this.lessonBody = document.getElementById('lesson-body');
        this.btnComplete = document.getElementById('btn-mark-complete');
        this.progText = document.getElementById('progress-text');
        this.progBar = document.getElementById('course-progress-bar');
        
        // Terminal DOM
        this.termInput = document.getElementById('terminal-input');
        this.termOutput = document.getElementById('terminal-output');
        this.termWindow = document.getElementById('terminal-window');

        // Ring DOM
        this.btnSimWrite = document.getElementById('btn-simulate-write');
        this.inputPartKey = document.getElementById('partition-key-input');

        this.init();
    }

    init() {
        this.renderSidebar();
        this.loadModule(this.activeModuleId);
        this.updateProgressUI();
        this.bindEvents();
    }

    bindEvents() {
        // Module Completion
        this.btnComplete.addEventListener('click', () => {
            this.completedModules.add(this.activeModuleId);
            this.updateProgressUI();
            this.renderSidebar();
            
            const currIdx = MODULES.findIndex(m => m.id === this.activeModuleId);
            if (currIdx < MODULES.length - 1) {
                this.loadModule(MODULES[currIdx + 1].id);
            }
        });

        // Terminal Interaction
        this.termInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = this.termInput.value;
                if (!cmd.trim()) return;
                
                this.printToTerminal(`cqlsh> ${cmd}`, 'line-input');
                this.termInput.value = '';
                
                const result = this.cqlEngine.execute(cmd);
                if (result) {
                    const typeClass = result.startsWith('SyntaxException') || result.startsWith('InvalidRequest') ? 'line-error' : 'line-output';
                    this.printToTerminal(result, typeClass);
                }
            }
        });

        this.termWindow.addEventListener('click', () => this.termInput.focus());

        // Ring Visualizer Interaction
        this.btnSimWrite.addEventListener('click', () => {
            const key = this.inputPartKey.value || 'testKey';
            this.ringViz.simulateWrite(key);
        });
    }

    renderSidebar() {
        this.moduleListDom.innerHTML = '';
        MODULES.forEach(mod => {
            const isCompleted = this.completedModules.has(mod.id);
            const isActive = this.activeModuleId === mod.id;
            
            const li = document.createElement('li');
            li.className = `module-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
            li.innerHTML = `
                <span>${mod.title}</span>
                <i class="fa-solid fa-circle-check status-icon"></i>
            `;
            li.addEventListener('click', () => this.loadModule(mod.id));
            this.moduleListDom.appendChild(li);
        });
    }

    loadModule(id) {
        this.activeModuleId = id;
        const mod = MODULES.find(m => m.id === id);
        
        this.lessonTitle.textContent = mod.title;
        this.lessonBody.innerHTML = mod.content;
        
        if (this.completedModules.has(id)) {
            this.btnComplete.disabled = true;
            this.btnComplete.innerHTML = '<i class="fa-solid fa-check-double"></i> Completed';
            this.btnComplete.classList.replace('btn-accent', 'btn-secondary');
        } else {
            this.btnComplete.disabled = false;
            this.btnComplete.innerHTML = '<i class="fa-solid fa-check"></i> Mark Complete';
            this.btnComplete.classList.replace('btn-secondary', 'btn-accent');
        }

        this.renderSidebar();
    }

    updateProgressUI() {
        const total = MODULES.length;
        const completed = this.completedModules.size;
        const percent = Math.round((completed / total) * 100);
        
        this.progText.textContent = `${completed} / ${total} Modules Completed`;
        document.getElementById('progress-percentage').textContent = `${percent}%`;
        this.progBar.style.width = `${percent}%`;
    }

    printToTerminal(text, className) {
        const div = document.createElement('div');
        div.className = `log ${className}`;
        div.textContent = text;
        this.termOutput.appendChild(div);
        this.termWindow.scrollTop = this.termWindow.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CassandraHub();
});
