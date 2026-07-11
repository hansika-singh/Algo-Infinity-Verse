/**
 * Algo-Infinity-Verse | Redis Learning Hub & Mock Engine
 * Simulates an in-memory Redis database in the browser using JS Maps and Sets.
 */

// --- 1. MOCK REDIS ENGINE ---
class MockRedisEngine {
    constructor() {
        this.store = new Map(); // KV store for Strings
        this.lists = new Map(); // Store for Lists
        this.timers = new Map(); // TTL Expiration timers
    }

    execute(commandString) {
        if (!commandString.trim()) return "";
        
        // Parse command respecting quotes for multi-word strings
        const tokens = commandString.match(/(?:[^\s"]+|"[^"]*")+/g);
        if (!tokens) return "(error) ERR invalid command syntax";
        const args = tokens.map(arg => arg.replace(/^"|"$/g, ''));
        const cmd = args[0].toUpperCase();
        
        try {
            switch (cmd) {
                case 'HELP': return "Supported commands: SET, GET, DEL, KEYS, EXPIRE, TTL, LPUSH, LRANGE, FLUSHALL";
                
                case 'SET':
                    if (args.length < 3) return "(error) ERR wrong number of arguments for 'set' command";
                    this.setKey(args[1], args[2]);
                    // Handle EX flag inline if provided (e.g. SET key val EX 10)
                    if (args[3] && args[3].toUpperCase() === 'EX' && args[4]) {
                        this.setExpire(args[1], parseInt(args[4]));
                    }
                    return "OK";
                    
                case 'GET':
                    if (args.length !== 2) return "(error) ERR wrong number of arguments";
                    return this.getKey(args[1]);
                    
                case 'DEL':
                    if (args.length < 2) return "(error) ERR wrong number of arguments";
                    let delCount = 0;
                    for (let i = 1; i < args.length; i++) {
                        if (this.deleteKey(args[i])) delCount++;
                    }
                    return `(integer) ${delCount}`;

                case 'KEYS':
                    let pattern = args[1] || '*';
                    let keys = Array.from(this.store.keys()).concat(Array.from(this.lists.keys()));
                    if (pattern !== '*') {
                        const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
                        const regex = new RegExp('^' + escaped.replace(/\*/g, '.*') + '$');
                        keys = keys.filter(k => regex.test(k));
                    }
                    if (keys.length === 0) return "(empty array)";
                    return keys.map((k, i) => `${i + 1}) "${k}"`).join('\n');

                case 'EXPIRE':
                    if (args.length !== 3) return "(error) ERR wrong number of arguments";
                    return this.setExpire(args[1], parseInt(args[2])) ? "(integer) 1" : "(integer) 0";

                case 'TTL':
                    if (args.length !== 2) return "(error) ERR wrong number of arguments";
                    return this.getTTL(args[1]);

                case 'LPUSH':
                    if (args.length < 3) return "(error) ERR wrong number of arguments for 'lpush'";
                    const lkey = args[1];
                    if (this.store.has(lkey)) return "(error) WRONGTYPE Operation against a key holding the wrong kind of value";
                    if (!this.lists.has(lkey)) this.lists.set(lkey, []);
                    const list = this.lists.get(lkey);
                    for (let i = 2; i < args.length; i++) {
                        list.unshift(args[i]); // Push to front
                    }
                    return `(integer) ${list.length}`;

                case 'LRANGE':
                    if (args.length !== 4) return "(error) ERR wrong number of arguments";
                    const rkey = args[1];
                    if (this.store.has(rkey)) return "(error) WRONGTYPE Operation against a key holding the wrong kind of value";
                    if (!this.lists.has(rkey)) return "(empty array)";
                    let start = parseInt(args[2]);
                    let end = parseInt(args[3]);
                    const tgtList = this.lists.get(rkey);
                    if (end === -1) end = tgtList.length - 1;
                    const sliced = tgtList.slice(start, end + 1);
                    if (sliced.length === 0) return "(empty array)";
                    return sliced.map((val, i) => `${i + 1}) "${val}"`).join('\n');

                case 'FLUSHALL':
                    this.store.clear();
                    this.lists.clear();
                    for (let timer of this.timers.values()) clearTimeout(timer.timeoutId);
                    this.timers.clear();
                    return "OK";

                default:
                    return `(error) ERR unknown command '${cmd}'`;
            }
        } catch (e) {
            return `(error) ERR ${e.message}`;
        }
    }

    setKey(key, value) {
        if (this.lists.has(key)) this.lists.delete(key); // Overwrite type
        this.store.set(key, value);
        this.clearTimer(key);
    }

    getKey(key) {
        if (this.lists.has(key)) return "(error) WRONGTYPE Operation against a key holding the wrong kind of value";
        if (!this.store.has(key)) return "(nil)";
        return `"${this.store.get(key)}"`;
    }

    deleteKey(key) {
        this.clearTimer(key);
        let deleted = false;
        if (this.store.has(key)) { this.store.delete(key); deleted = true; }
        if (this.lists.has(key)) { this.lists.delete(key); deleted = true; }
        return deleted;
    }

    setExpire(key, seconds) {
        if (!this.store.has(key) && !this.lists.has(key)) return false;
        this.clearTimer(key);
        
        const expireAt = Date.now() + (seconds * 1000);
        const timeoutId = setTimeout(() => {
            this.deleteKey(key);
        }, seconds * 1000);
        
        this.timers.set(key, { timeoutId, expireAt });
        return true;
    }

    getTTL(key) {
        if (!this.store.has(key) && !this.lists.has(key)) return "-2"; // Key does not exist
        if (!this.timers.has(key)) return "-1"; // Key exists but has no associated expire
        
        const data = this.timers.get(key);
        const remaining = Math.max(0, Math.floor((data.expireAt - Date.now()) / 1000));
        return `(integer) ${remaining}`;
    }

    clearTimer(key) {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key).timeoutId);
            this.timers.delete(key);
        }
    }
}

// --- 2. LEARNING HUB CURRICULUM ---
const CURRICULUM = [
    {
        id: 'basics',
        title: '1. Redis Basics & Strings',
        content: `
            <h3>Introduction to Redis</h3>
            <p>Redis is an open-source, in-memory data structure store used as a database, cache, message broker, and streaming engine. Because it holds all data in RAM, it is incredibly fast.</p>
            <h3>Strings</h3>
            <p>Strings are the most basic type of Redis value. You can use them to store text, serialized objects, or even numbers (which can be incremented).</p>
            <p><strong>Try these commands in the terminal:</strong></p>
            <ul>
                <li><code>SET user:1 "Alice"</code> - Stores the string "Alice"</li>
                <li><code>GET user:1</code> - Retrieves the value</li>
                <li><code>KEYS *</code> - Lists all keys in the database</li>
                <li><code>DEL user:1</code> - Deletes the key</li>
            </ul>
        `
    },
    {
        id: 'caching',
        title: '2. Caching & TTL (Time To Live)',
        content: `
            <h3>Why use Redis for Caching?</h3>
            <p>By temporarily storing expensive database query results in Redis, you dramatically reduce latency for future requests. A key feature of caching is data invalidation—making sure old data doesn't live forever.</p>
            <h3>Time to Live (TTL)</h3>
            <p>You can set an expiration time on a key using the <code>EXPIRE</code> command. Once the TTL reaches 0, Redis automatically deletes the key.</p>
            <p><strong>Interactive Lab:</strong></p>
            <ul>
                <li><code>SET session:xyz "Active"</code></li>
                <li><code>EXPIRE session:xyz 10</code> - Key will self-destruct in 10 seconds.</li>
                <li><code>TTL session:xyz</code> - Run this repeatedly to watch the countdown!</li>
                <li>Wait 10 seconds, then run <code>GET session:xyz</code>. It should return (nil).</li>
            </ul>
        `
    },
    {
        id: 'lists',
        title: '3. Lists (Queues & Activity Streams)',
        content: `
            <h3>Redis Lists</h3>
            <p>Redis Lists are simply linked lists of string values. They are frequently used to implement Background Job Queues or timeline feeds.</p>
            <p>You can push elements to the head (Left) or tail (Right) of the list.</p>
            <p><strong>Try these commands:</strong></p>
            <ul>
                <li><code>LPUSH recent_tasks "Send Email"</code></li>
                <li><code>LPUSH recent_tasks "Generate PDF"</code></li>
                <li><code>LRANGE recent_tasks 0 -1</code> - Returns all items in the list. Notice the order!</li>
            </ul>
            <p>Because elements were pushed to the Left (Head), "Generate PDF" will be index 1.</p>
        `
    },
    {
        id: 'ratelimiting',
        title: '4. Rate Limiting Concepts',
        content: `
            <h3>Protecting your APIs</h3>
            <p>Rate limiting restricts the number of requests a user can make in a given time period. Redis is perfect for this because of its speed and atomic operations.</p>
            <h3>The Fixed Window Approach</h3>
            <p>Imagine tracking API calls for an IP address per minute. You can combine <code>SET</code>, <code>EXPIRE</code>, and counting.</p>
            <p><strong>Simulate it:</strong></p>
            <ul>
                <li><code>SET rate:ip:127.0.0.1 1 EX 60</code> - Initializes counter to 1, expires in 60s.</li>
                <li>(In a real app, you would use <code>INCR rate:ip:127.0.0.1</code> to increment this atomically).</li>
                <li><code>TTL rate:ip:127.0.0.1</code> - Check when the user's rate limit window resets.</li>
            </ul>
        `
    }
];

// --- 3. UI CONTROLLER ---
class LearningHub {
    constructor() {
        this.engine = new MockRedisEngine();
        this.completedModules = new Set(JSON.parse(localStorage.getItem('algoRedisProgress') || '[]'));
        this.activeModuleId = CURRICULUM[0].id;

        // DOM Elements
        this.moduleListDom = document.getElementById('module-list');
        this.lessonTitle = document.getElementById('lesson-title');
        this.lessonBody = document.getElementById('lesson-body');
        this.btnComplete = document.getElementById('btn-mark-complete');
        this.btnResetProg = document.getElementById('btn-reset-progress');
        this.progText = document.getElementById('progress-text');
        this.progBar = document.getElementById('course-progress-bar');
        
        // Terminal DOM
        this.termInput = document.getElementById('terminal-input');
        this.termOutput = document.getElementById('terminal-output');
        this.termWindow = document.getElementById('terminal-window');

        this.init();
    }

    init() {
        this.renderSidebar();
        this.loadModule(this.activeModuleId);
        this.updateProgressUI();
        this.bindEvents();
    }

    bindEvents() {
        this.btnComplete.addEventListener('click', () => {
            this.completedModules.add(this.activeModuleId);
            this.saveProgress();
            this.updateProgressUI();
            this.renderSidebar();
            
            // Auto advance
            const currIdx = CURRICULUM.findIndex(m => m.id === this.activeModuleId);
            if (currIdx < CURRICULUM.length - 1) {
                this.loadModule(CURRICULUM[currIdx + 1].id);
            }
        });

        this.btnResetProg.addEventListener('click', () => {
            if(confirm("Reset all course progress?")) {
                this.completedModules.clear();
                this.saveProgress();
                this.updateProgressUI();
                this.renderSidebar();
                this.loadModule(CURRICULUM[0].id);
            }
        });

        // Terminal Events
        this.termInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = this.termInput.value;
                if (!cmd.trim()) return;
                
                this.printToTerminal(`127.0.0.1:6379> ${cmd}`, 'line-input');
                this.termInput.value = '';
                
                const result = this.engine.execute(cmd);
                if (result) {
                    const typeClass = result.startsWith('(error)') ? 'line-error' : 'line-output';
                    this.printToTerminal(result, typeClass);
                }
            }
        });

        // Keep focus on terminal when clicking window
        this.termWindow.addEventListener('click', () => this.termInput.focus());
    }

    renderSidebar() {
        this.moduleListDom.innerHTML = '';
        CURRICULUM.forEach(mod => {
            const isCompleted = this.completedModules.has(mod.id);
            const isActive = this.activeModuleId === mod.id;
            
            const li = document.createElement('li');
            li.className = `module-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
            li.setAttribute('tabindex', '0');
            li.setAttribute('role', 'button');
            li.innerHTML = `
                <span>${mod.title}</span>
                <i class="fa-solid fa-circle-check status-icon"></i>
            `;
            li.addEventListener('click', () => this.loadModule(mod.id));
            li.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.loadModule(mod.id);
                }
            });
            this.moduleListDom.appendChild(li);
        });
    }

    loadModule(id) {
        this.activeModuleId = id;
        const mod = CURRICULUM.find(m => m.id === id);
        
        this.lessonTitle.textContent = mod.title;
        this.lessonBody.innerHTML = mod.content;
        
        // Disable complete button if already done
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
        const total = CURRICULUM.length;
        const completed = this.completedModules.size;
        const percent = Math.round((completed / total) * 100);
        
        this.progText.textContent = `${completed} / ${total} Modules Completed`;
        document.getElementById('progress-percentage').textContent = `${percent}%`;
        this.progBar.style.width = `${percent}%`;
    }

    saveProgress() {
        localStorage.setItem('algoRedisProgress', JSON.stringify(Array.from(this.completedModules)));
    }

    printToTerminal(text, className) {
        // Split by newline to support multi-line output (like LRANGE)
        const lines = text.split('\n');
        lines.forEach(line => {
            const div = document.createElement('div');
            div.className = `log ${className}`;
            div.textContent = line;
            this.termOutput.appendChild(div);
        });
        this.termWindow.scrollTop = this.termWindow.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LearningHub();
});
