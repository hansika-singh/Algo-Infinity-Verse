/**
 * Redis Academy — Mock Engine + Curriculum + Quiz
 * Simulates an in-memory Redis database in the browser.
 */

// ─── MOCK REDIS ENGINE ───────────────────────────────────────────────

class MockRedisEngine {
  constructor() {
    this.strings = new Map();
    this.lists = new Map();
    this.hashes = new Map();
    this.sortedSets = new Map();
    this.timers = new Map();
    this.pubsubChannels = new Map();
    this.transactionQueue = [];
    this.inTransaction = false;
  }

  execute(raw) {
    if (!raw.trim()) return '';
    if (raw.trim().toUpperCase() === 'MULTI') return this._multi();
    if (raw.trim().toUpperCase() === 'DISCARD') return this._discard();
    if (raw.trim().toUpperCase() === 'EXEC') return this._exec();

    if (this.inTransaction) {
      this.transactionQueue.push(raw);
      return 'QUEUED';
    }

    return this._run(raw);
  }

  _run(raw) {
    const tokens = raw.match(/(?:[^\s"]+|"[^"]*")+/g);
    if (!tokens) return '(error) ERR invalid command syntax';
    const args = tokens.map(a => a.replace(/^"|"$/g, ''));
    const cmd = args[0].toUpperCase();

    try {
      switch (cmd) {
        case 'HELP': return this._help();
        case 'SET': return this._set(args);
        case 'GET': return this._get(args);
        case 'DEL': return this._del(args);
        case 'KEYS': return this._keys(args);
        case 'EXISTS': return this._exists(args);
        case 'EXPIRE': return this._expire(args);
        case 'TTL': return this._ttl(args);
        case 'INCR': return this._incr(args);
        case 'INCRBY': return this._incrby(args);
        case 'DECR': return this._decr(args);
        case 'MSET': return this._mset(args);
        case 'MGET': return this._mget(args);
        case 'LPUSH': return this._lpush(args);
        case 'RPUSH': return this._rpush(args);
        case 'LPOP': return this._lpop(args);
        case 'RPOP': return this._rpop(args);
        case 'LRANGE': return this._lrange(args);
        case 'LLEN': return this._llen(args);
        case 'HSET': return this._hset(args);
        case 'HGET': return this._hget(args);
        case 'HGETALL': return this._hgetall(args);
        case 'HDEL': return this._hdel(args);
        case 'ZADD': return this._zadd(args);
        case 'ZRANGE': return this._zrange(args);
        case 'ZRANK': return this._zrank(args);
        case 'ZSCORE': return this._zscore(args);
        case 'ZINCRBY': return this._zincrby(args);
        case 'SUBSCRIBE': return this._subscribe(args);
        case 'UNSUBSCRIBE': return this._unsubscribe(args);
        case 'PUBLISH': return this._publish(args);
        case 'FLUSHALL': return this._flushall();
        default: return `(error) ERR unknown command '${cmd}'`;
      }
    } catch (e) {
      return `(error) ERR ${e.message}`;
    }
  }

  _help() {
    return [
      'Supported commands:',
      '  Strings:  SET GET DEL KEYS EXISTS EXPIRE TTL INCR INCRBY DECR MSET MGET',
      '  Lists:    LPUSH RPUSH LPOP RPOP LRANGE LLEN',
      '  Hashes:   HSET HGET HGETALL HDEL',
      '  Sorted:   ZADD ZRANGE ZRANK ZSCORE ZINCRBY',
      '  Pub/Sub:  SUBSCRIBE UNSUBSCRIBE PUBLISH',
      '  Keys:     FLUSHALL',
    ].join('\n');
  }

  // ── Strings ──

  _set(args) {
    if (args.length < 3) return "(error) ERR wrong number of arguments for 'set' command";
    this._clearTimer(args[1]);
    this.strings.set(args[1], args[2]);
    if (args[3] && args[3].toUpperCase() === 'EX' && args[4]) {
      this._setExpire(args[1], parseInt(args[4]));
    }
    return 'OK';
  }

  _get(args) {
    if (args.length !== 2) return '(error) ERR wrong number of arguments';
    if (this.lists.has(args[1]) || this.hashes.has(args[1]) || this.sortedSets.has(args[1])) {
      return '(error) WRONGTYPE Operation against a key holding the wrong kind of value';
    }
    if (!this.strings.has(args[1])) return '(nil)';
    return `"${this.strings.get(args[1])}"`;
  }

  _del(args) {
    if (args.length < 2) return '(error) ERR wrong number of arguments';
    let count = 0;
    for (let i = 1; i < args.length; i++) {
      if (this._deleteKey(args[i])) count++;
    }
    return `(integer) ${count}`;
  }

  _exists(args) {
    if (args.length !== 2) return '(error) ERR wrong number of arguments';
    const exists = this.strings.has(args[1]) || this.lists.has(args[1]) ||
                   this.hashes.has(args[1]) || this.sortedSets.has(args[1]);
    return `(integer) ${exists ? 1 : 0}`;
  }

  _keys(args) {
    const pattern = args[1] || '*';
    const allKeys = [
      ...this.strings.keys(),
      ...this.lists.keys(),
      ...this.hashes.keys(),
      ...this.sortedSets.keys(),
    ];
    let keys = [...new Set(allKeys)];
    if (pattern !== '*') {
      const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp('^' + escaped.replace(/\*/g, '.*') + '$');
      keys = keys.filter(k => regex.test(k));
    }
    if (keys.length === 0) return '(empty array)';
    return keys.map((k, i) => `${i + 1}) "${k}"`).join('\n');
  }

  _incr(args) {
    if (args.length !== 2) return '(error) ERR wrong number of arguments';
    if (this.lists.has(args[1]) || this.hashes.has(args[1]) || this.sortedSets.has(args[1])) {
      return '(error) WRONGTYPE Operation against a key holding the wrong kind of value';
    }
    const cur = parseInt(this.strings.get(args[1]) || '0');
    if (isNaN(cur)) return '(error) ERR value is not an integer';
    this.strings.set(args[1], String(cur + 1));
    return `(integer) ${cur + 1}`;
  }

  _incrby(args) {
    if (args.length !== 3) return '(error) ERR wrong number of arguments';
    const by = parseInt(args[2]);
    if (isNaN(by)) return '(error) ERR value is not an integer';
    const cur = parseInt(this.strings.get(args[1]) || '0');
    if (isNaN(cur)) return '(error) ERR value is not an integer';
    this.strings.set(args[1], String(cur + by));
    return `(integer) ${cur + by}`;
  }

  _decr(args) {
    if (args.length !== 2) return '(error) ERR wrong number of arguments';
    const cur = parseInt(this.strings.get(args[1]) || '0');
    if (isNaN(cur)) return '(error) ERR value is not an integer';
    this.strings.set(args[1], String(cur - 1));
    return `(integer) ${cur - 1}`;
  }

  _mset(args) {
    if (args.length < 3 || (args.length - 1) % 2 !== 0) {
      return "(error) ERR wrong number of arguments for 'mset' command";
    }
    for (let i = 1; i < args.length; i += 2) {
      this.strings.set(args[i], args[i + 1]);
    }
    return 'OK';
  }

  _mget(args) {
    if (args.length < 2) return '(error) ERR wrong number of arguments';
    return args.slice(1).map((k, i) => {
      const val = this.strings.get(k);
      return val !== undefined ? `${i + 1}) "${val}"` : `${i + 1}) (nil)`;
    }).join('\n');
  }

  // ── Lists ──

  _lpush(args) {
    if (args.length < 3) return "(error) ERR wrong number of arguments for 'lpush'";
    const key = args[1];
    if (this.strings.has(key)) return '(error) WRONGTYPE Operation against a key holding the wrong kind of value';
    if (!this.lists.has(key)) this.lists.set(key, []);
    const list = this.lists.get(key);
    for (let i = 2; i < args.length; i++) list.unshift(args[i]);
    return `(integer) ${list.length}`;
  }

  _rpush(args) {
    if (args.length < 3) return "(error) ERR wrong number of arguments for 'rpush'";
    const key = args[1];
    if (this.strings.has(key)) return '(error) WRONGTYPE Operation against a key holding the wrong kind of value';
    if (!this.lists.has(key)) this.lists.set(key, []);
    const list = this.lists.get(key);
    for (let i = 2; i < args.length; i++) list.push(args[i]);
    return `(integer) ${list.length}`;
  }

  _lpop(args) {
    if (args.length !== 2) return '(error) ERR wrong number of arguments';
    if (!this.lists.has(args[1])) return '(nil)';
    const list = this.lists.get(args[1]);
    const val = list.shift();
    if (list.length === 0) this.lists.delete(args[1]);
    return `"${val}"`;
  }

  _rpop(args) {
    if (args.length !== 2) return '(error) ERR wrong number of arguments';
    if (!this.lists.has(args[1])) return '(nil)';
    const list = this.lists.get(args[1]);
    const val = list.pop();
    if (list.length === 0) this.lists.delete(args[1]);
    return `"${val}"`;
  }

  _lrange(args) {
    if (args.length !== 4) return '(error) ERR wrong number of arguments';
    if (!this.lists.has(args[1])) return '(empty array)';
    let start = parseInt(args[2]);
    let end = parseInt(args[3]);
    const list = this.lists.get(args[1]);
    if (end === -1) end = list.length - 1;
    const sliced = list.slice(start, end + 1);
    if (sliced.length === 0) return '(empty array)';
    return sliced.map((v, i) => `${i + 1}) "${v}"`).join('\n');
  }

  _llen(args) {
    if (args.length !== 2) return '(error) ERR wrong number of arguments';
    if (!this.lists.has(args[1])) return '(integer) 0';
    return `(integer) ${this.lists.get(args[1]).length}`;
  }

  // ── Hashes ──

  _hset(args) {
    if (args.length < 4 || (args.length - 2) % 2 !== 0) {
      return "(error) ERR wrong number of arguments for 'hset' command";
    }
    const key = args[1];
    if (this.strings.has(key)) return '(error) WRONGTYPE Operation against a key holding the wrong kind of value';
    if (!this.hashes.has(key)) this.hashes.set(key, new Map());
    const hash = this.hashes.get(key);
    let added = 0;
    for (let i = 2; i < args.length; i += 2) {
      if (!hash.has(args[i])) added++;
      hash.set(args[i], args[i + 1]);
    }
    return `(integer) ${added}`;
  }

  _hget(args) {
    if (args.length !== 3) return '(error) ERR wrong number of arguments';
    if (!this.hashes.has(args[1])) return '(nil)';
    const val = this.hashes.get(args[1]).get(args[2]);
    return val !== undefined ? `"${val}"` : '(nil)';
  }

  _hgetall(args) {
    if (args.length !== 2) return '(error) ERR wrong number of arguments';
    if (!this.hashes.has(args[1])) return '(empty array)';
    const hash = this.hashes.get(args[1]);
    if (hash.size === 0) return '(empty array)';
    let i = 1;
    const lines = [];
    for (const [field, val] of hash) {
      lines.push(`${i}) "${field}"`, `${i + 1}) "${val}"`);
      i += 2;
    }
    return lines.join('\n');
  }

  _hdel(args) {
    if (args.length < 3) return '(error) ERR wrong number of arguments';
    if (!this.hashes.has(args[1])) return '(integer) 0';
    const hash = this.hashes.get(args[1]);
    let count = 0;
    for (let i = 2; i < args.length; i++) {
      if (hash.delete(args[i])) count++;
    }
    if (hash.size === 0) this.hashes.delete(args[1]);
    return `(integer) ${count}`;
  }

  // ── Sorted Sets ──

  _zadd(args) {
    if (args.length < 4) return "(error) ERR wrong number of arguments for 'zadd' command";
    const key = args[1];
    if (this.strings.has(key) || this.lists.has(key) || this.hashes.has(key)) {
      return '(error) WRONGTYPE Operation against a key holding the wrong kind of value';
    }
    if (!this.sortedSets.has(key)) this.sortedSets.set(key, new Map());
    const zset = this.sortedSets.get(key);
    let added = 0;
    for (let i = 2; i < args.length; i += 2) {
      const score = parseFloat(args[i]);
      const member = args[i + 1];
      if (isNaN(score)) return '(error) ERR value is not a valid float';
      if (!zset.has(member)) added++;
      zset.set(member, score);
    }
    return `(integer) ${added}`;
  }

  _zrange(args) {
    if (args.length < 4) return '(error) ERR wrong number of arguments';
    if (!this.sortedSets.has(args[1])) return '(empty array)';
    const zset = this.sortedSets.get(args[1]);
    let start = parseInt(args[2]);
    let end = parseInt(args[3]);
    const withScores = args[4] && args[4].toUpperCase() === 'WITHSCORES';
    const sorted = [...zset.entries()].sort((a, b) => a[1] - b[1]);
    if (end === -1) end = sorted.length - 1;
    const sliced = sorted.slice(start, end + 1);
    if (sliced.length === 0) return '(empty array)';
    const lines = [];
    sliced.forEach(([member, score], i) => {
      lines.push(`${i + 1}) "${member}"`);
      if (withScores) lines.push(`${i + 2}) "${score}"`);
    });
    return lines.join('\n');
  }

  _zrank(args) {
    if (args.length !== 3) return '(error) ERR wrong number of arguments';
    if (!this.sortedSets.has(args[1])) return '(nil)';
    const zset = this.sortedSets.get(args[1]);
    if (!zset.has(args[2])) return '(nil)';
    const sorted = [...zset.entries()].sort((a, b) => a[1] - b[1]);
    const rank = sorted.findIndex(([m]) => m === args[2]);
    return `(integer) ${rank}`;
  }

  _zscore(args) {
    if (args.length !== 3) return '(error) ERR wrong number of arguments';
    if (!this.sortedSets.has(args[1])) return '(nil)';
    const score = this.sortedSets.get(args[1]).get(args[2]);
    return score !== undefined ? `"${score}"` : '(nil)';
  }

  _zincrby(args) {
    if (args.length !== 4) return '(error) ERR wrong number of arguments';
    const key = args[1];
    const incr = parseFloat(args[2]);
    const member = args[3];
    if (isNaN(incr)) return '(error) ERR value is not a valid float';
    if (!this.sortedSets.has(key)) this.sortedSets.set(key, new Map());
    const zset = this.sortedSets.get(key);
    const cur = zset.get(member) || 0;
    zset.set(member, cur + incr);
    return `"${cur + incr}"`;
  }

  // ── Pub/Sub ──

  _subscribe(args) {
    if (args.length < 2) return '(error) ERR wrong number of arguments';
    for (let i = 1; i < args.length; i++) {
      const ch = args[i];
      if (!this.pubsubChannels.has(ch)) this.pubsubChannels.set(ch, new Set());
      this.pubsubChannels.get(ch).add('__terminal__');
    }
    return `(integer) ${args.length - 1}`;
  }

  _unsubscribe(args) {
    const channels = args.length > 1 ? args.slice(1) : [...this.pubsubChannels.keys()];
    for (const ch of channels) {
      const subs = this.pubsubChannels.get(ch);
      if (subs) subs.delete('__terminal__');
      if (subs && subs.size === 0) this.pubsubChannels.delete(ch);
    }
    return `(integer) ${channels.length}`;
  }

  _publish(args) {
    if (args.length < 3) return '(error) ERR wrong number of arguments';
    const channel = args[1];
    const message = args.slice(2).join(' ');
    const subs = this.pubsubChannels.get(channel);
    const count = subs ? subs.size : 0;
    if (count > 0 && this._onPubSubMessage) {
      this._onPubSubMessage(channel, message);
    }
    return `(integer) ${count}`;
  }

  // ── Transactions ──

  _multi() {
    this.inTransaction = true;
    this.transactionQueue = [];
    return 'OK';
  }

  _discard() {
    this.inTransaction = false;
    this.transactionQueue = [];
    return 'OK';
  }

  _exec() {
    if (!this.inTransaction) return '(error) ERR EXEC without MULTI';
    this.inTransaction = false;
    const results = [];
    for (const cmd of this.transactionQueue) {
      results.push(this._run(cmd));
    }
    this.transactionQueue = [];
    if (results.length === 0) return '(empty array)';
    return results.map((r, i) => `${i + 1}) ${r}`).join('\n');
  }

  // ── Utilities ──

  _flushall() {
    this.strings.clear();
    this.lists.clear();
    this.hashes.clear();
    this.sortedSets.clear();
    for (const t of this.timers.values()) clearTimeout(t.timeoutId);
    this.timers.clear();
    return 'OK';
  }

  _deleteKey(key) {
    this._clearTimer(key);
    let deleted = false;
    if (this.strings.delete(key)) deleted = true;
    if (this.lists.delete(key)) deleted = true;
    if (this.hashes.delete(key)) deleted = true;
    if (this.sortedSets.delete(key)) deleted = true;
    return deleted;
  }

  _setExpire(key, seconds) {
    this._clearTimer(key);
    const expireAt = Date.now() + seconds * 1000;
    const timeoutId = setTimeout(() => this._deleteKey(key), seconds * 1000);
    this.timers.set(key, { timeoutId, expireAt });
  }

  _ttl(args) {
    if (args.length !== 2) return '(error) ERR wrong number of arguments';
    const key = args[1];
    const exists = this.strings.has(key) || this.lists.has(key) ||
                   this.hashes.has(key) || this.sortedSets.has(key);
    if (!exists) return '(integer) -2';
    if (!this.timers.has(key)) return '(integer) -1';
    const remaining = Math.max(0, Math.floor((this.timers.get(key).expireAt - Date.now()) / 1000));
    return `(integer) ${remaining}`;
  }

  _expire(args) {
    if (args.length !== 3) return '(error) ERR wrong number of arguments';
    const key = args[1];
    const exists = this.strings.has(key) || this.lists.has(key) ||
                   this.hashes.has(key) || this.sortedSets.has(key);
    if (!exists) return '(integer) 0';
    this._setExpire(key, parseInt(args[2]));
    return '(integer) 1';
  }

  _clearTimer(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key).timeoutId);
      this.timers.delete(key);
    }
  }

  getState() {
    return {
      strings: Object.fromEntries(this.strings),
      lists: Object.fromEntries([...this.lists.entries()].map(([k, v]) => [k, [...v]])),
      hashes: Object.fromEntries([...this.hashes.entries()].map(([k, v]) => [k, Object.fromEntries(v)])),
      sortedSets: Object.fromEntries([...this.sortedSets.entries()].map(([k, v]) => [k, Object.fromEntries(v)])),
    };
  }
}

// ─── CURRICULUM ──────────────────────────────────────────────────────

const curriculum = [
  {
    id: 'mod-strings',
    title: 'Strings & Key Basics',
    lessons: [
      {
        id: 'm1-l1',
        title: 'SET, GET & Key Operations',
        content: `
          <h3>Redis Strings</h3>
          <p>Strings are the most basic Redis value type. You can store text, numbers, serialized objects, or binary data up to 512 MB.</p>
          <h4>Core Commands</h4>
          <ul>
            <li><code>SET key value</code> — Store a string value</li>
            <li><code>GET key</code> — Retrieve a string value</li>
            <li><code>DEL key [key ...]</code> — Delete one or more keys</li>
            <li><code>KEYS pattern</code> — List keys matching a pattern</li>
            <li><code>EXISTS key</code> — Check if a key exists</li>
          </ul>
          <div class="tip-box">Try <code>SET user:1 "Alice"</code> then <code>GET user:1</code> in the simulator!</div>
          <h4>Multiple Keys</h4>
          <p>Use <code>MSET</code> and <code>MGET</code> to set or get multiple keys atomically:</p>
          <pre><code>MSET name "Bob" age "30" city "NYC"
MGET name age city</code></pre>
        `,
        defaultCode: 'SET user:1 "Alice"\nGET user:1\nKEYS *\nMSET name "Bob" age "30"\nMGET name age',
      },
      {
        id: 'm1-l2',
        title: 'INCR, DECR & Atomic Counters',
        content: `
          <h3>Atomic Counters</h3>
          <p>Redis can increment and decrement integer values atomically — no read-modify-write cycle needed. This makes it perfect for counters, rate limiters, and inventory tracking.</p>
          <h4>Commands</h4>
          <ul>
            <li><code>INCR key</code> — Increment by 1</li>
            <li><code>DECR key</code> — Decrement by 1</li>
            <li><code>INCRBY key increment</code> — Increment by a value</li>
          </ul>
          <pre><code>SET page_views 0
INCR page_views
INCR page_views
INCRBY page_views 10
GET page_views  --> "12"</code></pre>
          <div class="tip-box">Atomic counters are the backbone of rate limiting, leaderboard scores, and inventory management.</div>
        `,
        defaultCode: 'SET counter 0\nINCR counter\nINCR counter\nINCRBY counter 10\nGET counter',
      },
    ],
    quiz: [
      {
        id: 'q1-1',
        question: 'What does the SET command return when successful?',
        options: ['"OK"', '1', '(integer) 1', 'true'],
        correct: 0,
      },
      {
        id: 'q1-2',
        question: 'What happens if you GET a key that does not exist?',
        options: ['(error) ERR', '(nil)', '""', 'null'],
        correct: 1,
      },
      {
        id: 'q1-3',
        question: 'Which command sets multiple keys atomically?',
        options: ['SETALL', 'MSET', 'SETM', 'BATCHSET'],
        correct: 1,
      },
    ],
  },
  {
    id: 'mod-caching',
    title: 'Caching & TTL',
    lessons: [
      {
        id: 'm2-l1',
        title: 'Time To Live (TTL) & Expiration',
        content: `
          <h3>Why Cache with Redis?</h3>
          <p>By temporarily storing expensive database query results in Redis, you dramatically reduce latency for future requests. The key to effective caching is data invalidation — making sure stale data doesn't live forever.</p>
          <h4>Expiration Commands</h4>
          <ul>
            <li><code>EXPIRE key seconds</code> — Set a TTL on an existing key</li>
            <li><code>SET key value EX seconds</code> — Set with inline expiration</li>
            <li><code>TTL key</code> — Check remaining TTL</li>
          </ul>
          <p>The <code>TTL</code> command returns:</p>
          <ul>
            <li><code>(integer) -2</code> — Key does not exist</li>
            <li><code>(integer) -1</code> — Key exists but has no expiration</li>
            <li><code>(integer) N</code> — Seconds remaining</li>
          </ul>
          <pre><code>SET session:abc "Active" EX 30
TTL session:abc    --> (integer) 29</code></pre>
          <div class="tip-box">Set a key with EXPIRE, then run TTL repeatedly to watch the countdown!</div>
        `,
        defaultCode: 'SET session:xyz "Active" EX 10\nTTL session:xyz\nGET session:xyz',
      },
      {
        id: 'm2-l2',
        title: 'Cache Patterns & Invalidation',
        content: `
          <h3>Cache-Aside Pattern</h3>
          <p>The most common caching strategy: check the cache first, and if it's a miss, fetch from the database and store in cache.</p>
          <pre><code>// Pseudocode
value = GET cache:user:123
IF value == nil:
  value = DB.query("SELECT ...")
  SET cache:user:123 value EX 300</code></pre>
          <h3>Cache Invalidation</h3>
          <p>When the underlying data changes, delete the cached version so the next read fetches fresh data:</p>
          <pre><code>DB.update("users", 123, newData)
DEL cache:user:123</code></pre>
          <div class="tip-box">TTL-based expiration is a form of "eventual consistency" — your cache may serve stale data briefly until the TTL expires.</div>
        `,
        defaultCode: 'SET cache:user:1 "Alice" EX 30\nGET cache:user:1\nTTL cache:user:1\nDEL cache:user:1\nGET cache:user:1',
      },
    ],
    quiz: [
      {
        id: 'q2-1',
        question: 'What does TTL return for a key that exists but has no expiration?',
        options: ['(integer) -2', '(integer) -1', '(integer) 0', '(nil)'],
        correct: 1,
      },
      {
        id: 'q2-2',
        question: 'What is the Cache-Aside pattern?',
        options: [
          'Always write to cache first',
          'Check cache, on miss fetch from DB and cache the result',
          'Write to both cache and DB simultaneously',
          'Only use cache, never use a database',
        ],
        correct: 1,
      },
    ],
  },
  {
    id: 'mod-lists',
    title: 'Lists & Queues',
    lessons: [
      {
        id: 'm3-l1',
        title: 'Redis Lists — LPUSH, RPUSH, LRANGE',
        content: `
          <h3>Redis Lists</h3>
          <p>Redis Lists are linked lists of string values. They're ideal for message queues, activity feeds, and job processing pipelines.</p>
          <h4>Commands</h4>
          <ul>
            <li><code>LPUSH key value [value ...]</code> — Push to the head (left)</li>
            <li><code>RPUSH key value [value ...]</code> — Push to the tail (right)</li>
            <li><code>LPOP key</code> — Pop from the head</li>
            <li><code>RPOP key</code> — Pop from the tail</li>
            <li><code>LRANGE key start stop</code> — Get a range of elements</li>
            <li><code>LLEN key</code> — Get list length</li>
          </ul>
          <pre><code>LPUSH tasks "Send Email"
LPUSH tasks "Generate PDF"
LRANGE tasks 0 -1  --> 1) "Generate PDF" 2) "Send Email"</code></pre>
          <div class="tip-box">LPUSH adds to the front, so "Generate PDF" appears first. Use RPUSH if you want FIFO order.</div>
        `,
        defaultCode: 'LPUSH queue "task1"\nLPUSH queue "task2"\nRPUSH queue "task3"\nLRANGE queue 0 -1\nLLEN queue',
      },
      {
        id: 'm3-l2',
        title: 'Job Queues with LPOP/RPOP',
        content: `
          <h3>Processing Queues</h3>
          <p>Combine LPUSH (producer) with RPOP (consumer) to build a FIFO job queue:</p>
          <pre><code>// Producer adds jobs
LPUSH jobs "resize-image"
LPUSH jobs "send-email"

// Consumer processes jobs
RPOP jobs  --> "resize-image"
RPOP jobs  --> "send-email"</code></pre>
          <h3>Activity Streams</h3>
          <p>Use LPUSH to add recent activities, and LRANGE to display the latest N items:</p>
          <pre><code>LPUSH feed "user:alice liked photo:42"
LPUSH feed "user:bob commented on post:7"
LRANGE feed 0 9   // Latest 10 activities</code></pre>
        `,
        defaultCode: 'LPUSH jobs "resize-image"\nLPUSH jobs "send-email"\nLPUSH jobs "index-doc"\nRPOP jobs\nRPOP jobs\nLRANGE jobs 0 -1',
      },
    ],
    quiz: [
      {
        id: 'q3-1',
        question: 'What is the difference between LPUSH and RPUSH?',
        options: [
          'LPUSH is faster than RPUSH',
          'LPUSH adds to the head, RPUSH adds to the tail',
          'LPUSH only works with numbers',
          'There is no difference',
        ],
        correct: 1,
      },
      {
        id: 'q3-2',
        question: 'How do you get all elements from a list?',
        options: [
          'LGETALL key',
          'LRANGE key 0 -1',
          'LALL key',
          'LKEYS key',
        ],
        correct: 1,
      },
    ],
  },
  {
    id: 'mod-hashes',
    title: 'Hashes (Objects)',
    lessons: [
      {
        id: 'm4-l1',
        title: 'HSET, HGET & Hash Operations',
        content: `
          <h3>Redis Hashes</h3>
          <p>Hashes are maps of field-value pairs. They're perfect for representing objects like user profiles, product details, or configuration settings — without needing separate keys for each field.</p>
          <h4>Commands</h4>
          <ul>
            <li><code>HSET key field value [field value ...]</code> — Set fields</li>
            <li><code>HGET key field</code> — Get a single field</li>
            <li><code>HGETALL key</code> — Get all fields and values</li>
            <li><code>HDEL key field [field ...]</code> — Delete fields</li>
          </ul>
          <pre><code>HSET user:1 name "Alice" age "30" email "alice@test.com"
HGET user:1 name    --> "Alice"
HGETALL user:1</code></pre>
          <div class="tip-box">Hashes are more memory-efficient than storing each field as a separate string key.</div>
        `,
        defaultCode: 'HSET user:1 name "Alice" age "30" email "alice@test.com"\nHGET user:1 name\nHGETALL user:1',
      },
    ],
    quiz: [
      {
        id: 'q4-1',
        question: 'Why use Hashes instead of multiple string keys?',
        options: [
          'Hashes are faster to read',
          'Hashes are more memory-efficient for storing object fields',
          'Hashes support TTL on individual fields',
          'Hashes can be used in sorted sets',
        ],
        correct: 1,
      },
    ],
  },
  {
    id: 'mod-sorted-sets',
    title: 'Sorted Sets (Leaderboards)',
    lessons: [
      {
        id: 'm5-l1',
        title: 'ZADD, ZRANGE & Leaderboards',
        content: `
          <h3>Redis Sorted Sets</h3>
          <p>Sorted Sets are like Sets but every member has an associated score. Members are ordered by score, making them perfect for leaderboards, priority queues, and time-series data.</p>
          <h4>Commands</h4>
          <ul>
            <li><code>ZADD key score member [score member ...]</code> — Add members with scores</li>
            <li><code>ZRANGE key start stop [WITHSCORES]</code> — Get members by rank</li>
            <li><code>ZRANK key member</code> — Get rank of a member</li>
            <li><code>ZSCORE key member</code> — Get score of a member</li>
            <li><code>ZINCRBY key increment member</code> — Increment a member's score</li>
          </ul>
          <pre><code>ZADD leaderboard 100 "Alice"
ZADD leaderboard 250 "Bob"
ZADD leaderboard 175 "Charlie"
ZRANGE leaderboard 0 -1 WITHSCORES
ZRANK leaderboard "Bob"  --> (integer) 2 (highest)</code></pre>
          <div class="tip-box">ZRANGE returns members sorted by score ascending. Use ZREVRANGE (not in mock) for descending.</div>
        `,
        defaultCode: 'ZADD leaderboard 100 "Alice"\nZADD leaderboard 250 "Bob"\nZADD leaderboard 175 "Charlie"\nZRANGE leaderboard 0 -1 WITHSCORES\nZRANK leaderboard "Bob"\nZSCORE leaderboard "Alice"',
      },
    ],
    quiz: [
      {
        id: 'q5-1',
        question: 'What makes a Sorted Set different from a regular Set?',
        options: [
          'Sorted Sets allow duplicate members',
          'Every member in a Sorted Set has an associated score',
          'Sorted Sets are unordered',
          'Sorted Sets can only contain numbers',
        ],
        correct: 1,
      },
    ],
  },
  {
    id: 'mod-pubsub',
    title: 'Pub/Sub (Messaging)',
    lessons: [
      {
        id: 'm6-l1',
        title: 'Publish/Subscribe Messaging',
        content: `
          <h3>Redis Pub/Sub</h3>
          <p>Pub/Sub is a messaging pattern where senders (publishers) send messages to channels without knowledge of receivers (subscribers). Redis implements this with three commands.</p>
          <h4>Commands</h4>
          <ul>
            <li><code>SUBSCRIBE channel [channel ...]</code> — Subscribe to one or more channels</li>
            <li><code>UNSUBSCRIBE [channel ...]</code> — Unsubscribe from channels</li>
            <li><code>PUBLISH channel message</code> — Send a message to a channel</li>
          </ul>
          <pre><code>SUBSCRIBE news
PUBLISH news "Breaking: Redis 8 released!"
--> Subscriber receives: "Breaking: Redis 8 released!"</code></pre>
          <div class="tip-box">In this simulator, published messages appear in the terminal output. In production, subscribers receive messages asynchronously.</div>
        `,
        defaultCode: 'SUBSCRIBE updates\nPUBLISH updates "Hello subscribers!"\nPUBLISH updates "New feature launched"',
      },
    ],
    quiz: [
      {
        id: 'q6-1',
        question: 'In Pub/Sub, what happens when a message is published to a channel with no subscribers?',
        options: [
          'The message is stored for later delivery',
          'The message is silently discarded',
          'An error is returned',
          'The message is broadcast to all clients',
        ],
        correct: 1,
      },
    ],
  },
  {
    id: 'mod-transactions',
    title: 'Transactions',
    lessons: [
      {
        id: 'm7-l1',
        title: 'MULTI, EXEC & Atomic Operations',
        content: `
          <h3>Redis Transactions</h3>
          <p>Redis transactions allow you to execute a group of commands atomically. All commands in a transaction are serialized and executed sequentially — no command from another client will be executed during a transaction.</p>
          <h4>Commands</h4>
          <ul>
            <li><code>MULTI</code> — Start a transaction block</li>
            <li><code>EXEC</code> — Execute all commands in the block</li>
            <li><code>DISCARD</code> — Cancel the transaction</li>
          </ul>
          <pre><code>MULTI
SET account:1 "500"
SET account:2 "300"
EXEC
--> Both SET commands execute atomically</code></pre>
          <div class="tip-box">Unlike RDBMS transactions, Redis transactions don't support rollback. If one command fails, the others still execute.</div>
        `,
        defaultCode: 'MULTI\nSET key1 "value1"\nSET key2 "value2"\nEXEC\nGET key1\nGET key2',
      },
    ],
    quiz: [
      {
        id: 'q7-1',
        question: 'What happens if one command in a Redis transaction fails?',
        options: [
          'All commands are rolled back',
          'Only the failed command is skipped; others still execute',
          'The entire Redis server restarts',
          'EXEC returns an error for all commands',
        ],
        correct: 1,
      },
    ],
  },
];

// ─── ACADEMY CONTROLLER ──────────────────────────────────────────────

class RedisAcademy {
  constructor() {
    this.engine = new MockRedisEngine();
    this.engine._onPubSubMessage = (ch, msg) => {
      this.printToTerminal(`[message from "${ch}"] ${msg}`, 'line-pubsub');
    };

    this.completedLessons = new Set(JSON.parse(localStorage.getItem('redisAcademyProgress') || '[]'));
    this.activeModule = 0;
    this.activeLesson = 0;
    this.quizState = {};
    this.activeInspector = 'strings';

    this.dom = {
      moduleList: document.getElementById('module-list'),
      lessonTitle: document.getElementById('lesson-title'),
      lessonBody: document.getElementById('lesson-body'),
      btnComplete: document.getElementById('btn-mark-complete'),
      btnReset: document.getElementById('btn-reset-progress'),
      progText: document.getElementById('progress-text'),
      progPct: document.getElementById('progress-percentage'),
      progBar: document.getElementById('course-progress-bar'),
      termInput: document.getElementById('terminal-input'),
      termOutput: document.getElementById('terminal-output'),
      termWindow: document.getElementById('terminal-window'),
      quizContent: document.getElementById('quiz-content'),
      inspectorContent: document.getElementById('inspector-content'),
    };

    this.init();
  }

  init() {
    this.renderSidebar();
    this.loadLesson(0, 0);
    this.updateProgress();
    this.bindEvents();
  }

  // ── Events ──

  bindEvents() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    document.querySelectorAll('.inspector-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.inspector-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeInspector = btn.dataset.inspector;
        this.renderInspector();
      });
    });

    this.dom.btnComplete.addEventListener('click', () => this.markComplete());

    this.dom.btnReset.addEventListener('click', () => {
      if (confirm('Reset all course progress?')) {
        this.completedLessons.clear();
        this.saveProgress();
        this.updateProgress();
        this.renderSidebar();
        this.loadLesson(0, 0);
      }
    });

    this.dom.termInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const cmd = this.dom.termInput.value.trim();
        if (!cmd) return;
        this.printToTerminal(`127.0.0.1:6379> ${cmd}`, 'line-input');
        this.dom.termInput.value = '';
        const result = this.engine.execute(cmd);
        if (result) {
          const cls = result.startsWith('(error)') ? 'line-error' : 'line-output';
          this.printToTerminal(result, cls);
        }
        this.renderInspector();
      }
    });

    this.dom.termWindow.addEventListener('click', () => this.dom.termInput.focus());

    this.dom.quizContent.addEventListener('click', e => {
      const btn = e.target.closest('.quiz-submit');
      if (btn) this.checkQuiz(btn.dataset.questionId);
      const opt = e.target.closest('.quiz-option');
      if (opt && !opt.closest('.quiz-question').classList.contains('answered')) {
        this.selectQuizOption(opt);
      }
    });
  }

  // ── Tabs ──

  switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('hidden', p.id !== `${tabId}-tab`);
      p.classList.toggle('active', p.id === `${tabId}-tab`);
    });
    if (tabId === 'simulator') this.dom.termInput.focus();
  }

  // ── Sidebar ──

  renderSidebar() {
    this.dom.moduleList.innerHTML = '';
    curriculum.forEach((mod, mIdx) => {
      const groupLabel = document.createElement('li');
      groupLabel.className = 'module-group-label';
      groupLabel.textContent = mod.title;
      this.dom.moduleList.appendChild(groupLabel);

      mod.lessons.forEach((lesson, lIdx) => {
        const isCompleted = this.completedLessons.has(lesson.id);
        const isActive = mIdx === this.activeModule && lIdx === this.activeLesson;
        const li = document.createElement('li');
        li.className = `module-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
        li.setAttribute('tabindex', '0');
        li.setAttribute('role', 'button');
        li.innerHTML = `
          <span>${lesson.title}</span>
          <i class="fa-solid fa-circle-check status-icon"></i>
        `;
        li.addEventListener('click', () => this.loadLesson(mIdx, lIdx));
        li.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.loadLesson(mIdx, lIdx); }
        });
        this.dom.moduleList.appendChild(li);
      });
    });
  }

  // ── Lessons ──

  loadLesson(mIdx, lIdx) {
    this.activeModule = mIdx;
    this.activeLesson = lIdx;
    const lesson = curriculum[mIdx].lessons[lIdx];

    this.dom.lessonTitle.textContent = lesson.title;

    /* ── ELI5: wrap content in data-technical / data-simple ── */
    const eli5 = window.eli5Toggle;
    const simpleContent =
      window.eli5RedisData && lesson.id ? (window.eli5RedisData[lesson.id] || '') : '';
    this.dom.lessonBody.innerHTML = eli5
      ? eli5.wrapContent(lesson.content, simpleContent)
      : lesson.content;

    /* Remove old toggle if present, then re-init */
    const oldToggle = this.dom.lessonBody.querySelector('.eli5-toggle');
    if (oldToggle) oldToggle.remove();

    if (eli5) {
      eli5.initToggle('redis', this.dom.lessonBody);
    }

    const id = lesson.id;
    const done = this.completedLessons.has(id);
    this.dom.btnComplete.disabled = done;
    this.dom.btnComplete.innerHTML = done
      ? '<i class="fa-solid fa-check-double"></i> Completed'
      : '<i class="fa-solid fa-check"></i> Mark Complete';
    this.dom.btnComplete.classList.toggle('btn-accent', !done);
    this.dom.btnComplete.classList.toggle('btn-secondary', done);

    this.renderQuiz(mIdx);
    this.renderSidebar();
  }

  markComplete() {
    const lesson = curriculum[this.activeModule].lessons[this.activeLesson];
    this.completedLessons.add(lesson.id);
    this.saveProgress();
    this.updateProgress();
    this.renderSidebar();
    this.loadLesson(this.activeModule, this.activeLesson);
  }

  // ── Quiz ──

  renderQuiz(mIdx) {
    const quiz = curriculum[mIdx].quiz;
    if (!quiz || quiz.length === 0) {
      this.dom.quizContent.innerHTML = '<h2>Module Knowledge Check</h2><p class="text-secondary">No quiz available for this module.</p>';
      return;
    }

    let html = '<h2>Module Knowledge Check</h2>';
    quiz.forEach((q, i) => {
      this.quizState[q.id] = { answered: false, correct: false };
      html += `
        <div class="quiz-question" id="q-${q.id}">
          <p>${i + 1}. ${q.question}</p>
          <div class="quiz-options">
            ${q.options.map((opt, oIdx) => `
              <label class="quiz-option" data-qid="${q.id}" data-oidx="${oIdx}">
                <input type="radio" name="q-${q.id}" value="${oIdx}">
                <span>${opt}</span>
              </label>
            `).join('')}
          </div>
          <div class="quiz-feedback" id="fb-${q.id}"></div>
          <button class="quiz-submit" data-question-id="${q.id}">Submit</button>
        </div>
      `;
    });
    this.dom.quizContent.innerHTML = html;
  }

  selectQuizOption(opt) {
    const qid = opt.dataset.qid;
    document.querySelectorAll(`[data-qid="${qid}"]`).forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    opt.querySelector('input').checked = true;
  }

  checkQuiz(qId) {
    if (this.quizState[qId]?.answered) return;
    const selected = document.querySelector(`input[name="q-${qId}"]:checked`);
    const feedback = document.getElementById(`fb-${qId}`);
    const container = document.getElementById(`q-${qId}`);
    if (!selected) {
      feedback.textContent = 'Please select an answer.';
      feedback.className = 'quiz-feedback incorrect';
      return;
    }

    let correctIdx = -1;
    for (const mod of curriculum) {
      const q = mod.quiz.find(q => q.id === qId);
      if (q) { correctIdx = q.correct; break; }
    }

    const isCorrect = parseInt(selected.value) === correctIdx;
    this.quizState[qId] = { answered: true, correct: isCorrect };

    container.classList.add('answered');
    container.classList.add(isCorrect ? 'correct' : 'incorrect');

    const selectedLabel = selected.closest('.quiz-option');
    selectedLabel.classList.add(isCorrect ? 'correct-answer' : 'wrong-answer');

    if (!isCorrect) {
      const correctLabel = container.querySelector(`[data-oidx="${correctIdx}"]`);
      if (correctLabel) correctLabel.classList.add('correct-answer');
    }

    container.querySelectorAll('.quiz-submit').forEach(b => b.disabled = true);
    feedback.textContent = isCorrect ? 'Correct!' : 'Incorrect. The correct answer is highlighted above.';
    feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
  }

  // ── Progress ──

  updateProgress() {
    let total = 0;
    curriculum.forEach(m => { total += m.lessons.length; });
    const done = this.completedLessons.size;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    this.dom.progText.textContent = `${done} / ${total} Modules`;
    this.dom.progPct.textContent = `${pct}%`;
    this.dom.progBar.style.width = `${pct}%`;
  }

  saveProgress() {
    localStorage.setItem('redisAcademyProgress', JSON.stringify([...this.completedLessons]));
  }

  // ── Terminal ──

  printToTerminal(text, cls) {
    text.split('\n').forEach(line => {
      const div = document.createElement('div');
      div.className = `log ${cls}`;
      div.textContent = line;
      this.dom.termOutput.appendChild(div);
    });
    this.dom.termWindow.scrollTop = this.dom.termWindow.scrollHeight;
  }

  // ── Inspector ──

  renderInspector() {
    const state = this.engine.getState();
    const c = this.dom.inspectorContent;

    const render = (title, data, valFn) => {
      const entries = Object.entries(data);
      if (entries.length === 0) {
        c.innerHTML = `<div class="empty-state">No ${title.toLowerCase()} stored</div>`;
        return;
      }
      let html = `<div class="inspector-header"><span>Key</span><span>Value</span></div>`;
      entries.forEach(([k, v]) => {
        html += `<div class="inspector-row"><span class="inspector-key">${k}</span><span class="inspector-val">${valFn(v)}</span></div>`;
      });
      c.innerHTML = html;
    };

    switch (this.activeInspector) {
      case 'strings':
        render('Strings', state.strings, v => v);
        break;
      case 'lists':
        render('Lists', state.lists, v => `[${v.join(', ')}]`);
        break;
      case 'hashes':
        render('Hashes', state.hashes, v => {
          return Object.entries(v).map(([f, val]) => `${f}: ${val}`).join(', ');
        });
        break;
      case 'sorted-sets':
        render('Sorted Sets', state.sortedSets, v => {
          return Object.entries(v).map(([m, s]) => `${m} (${s})`).join(', ');
        });
        break;
      case 'pubsub': {
        const channels = [...this.engine.pubsubChannels.entries()]
          .filter(([, subs]) => subs.size > 0)
          .map(([ch, subs]) => [ch, subs.size]);
        if (channels.length === 0) {
          c.innerHTML = '<div class="empty-state">No active subscriptions</div>';
        } else {
          let html = '<div class="inspector-header"><span>Channel</span><span>Subscribers</span></div>';
          channels.forEach(([ch, count]) => {
            html += `<div class="inspector-row"><span class="inspector-key">${ch}</span><span class="inspector-val">${count}</span></div>`;
          });
          c.innerHTML = html;
        }
        break;
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new RedisAcademy());
