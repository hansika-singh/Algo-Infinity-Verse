/**
 * ELI5 (Explain Like I'm 5) content for Redis Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5RedisData = {
  'm1-l1': `
    <p>Think of Redis like a big locker room. Each locker has a label (the key) and something inside (the value).</p>
    <ul>
      <li><strong>SET</strong> is like putting something in a locker.</li>
      <li><strong>GET</strong> is like opening a locker to see what's inside.</li>
      <li><strong>DEL</strong> is like cleaning out a locker.</li>
      <li><strong>KEYS</strong> is like looking at all the locker labels at once.</li>
    </ul>
    <p>Keys can be anything — "user:1", "color", "score". Values can hold text, numbers, or even the contents of a whole book (up to 512 MB)!</p>
  `,
  'm1-l2': `
    <p>Imagine you have a scoreboard at a basketball game.</p>
    <ul>
      <li><strong>INCR</strong> is like adding 1 point to the score.</li>
      <li><strong>DECR</strong> is like subtracting 1 point.</li>
      <li><strong>INCRBY</strong> is like adding many points at once, like a 3-pointer.</li>
    </ul>
    <p>The special thing Redis does: if two people try to change the score at the exact same time, Redis makes sure neither one gets lost. That's called being <strong>atomic</strong> — like an atom that can't be split in half. The whole "add 1" happens in one step, no matter what.</p>
    <p>This is why Redis counters are used for real-time likes, page views, and game leaderboards!</p>
  `,
  'm2-l1': `
    <p>A cache is like your <strong>nightstand drawer</strong>. You keep things you reach for often there — glasses, phone charger, a book — instead of walking to the kitchen cabinet every single time.</p>
    <p>Redis stores data in memory (RAM), which is <strong>100-1000x faster</strong> than reading from a database on disk. It's like keeping a copy of your fridge items in a mini-fridge at your desk.</p>
    <p><strong>TTL (Time To Live)</strong> is like a "best before" date on food. After the time runs out, the item disappears from the cache automatically — so you never eat stale data!</p>
    <ul>
      <li><code>EXPIRE key 30</code> = "This snack expires in 30 seconds"</li>
      <li><code>TTL key</code> = "How many seconds until this snack goes bad?"</li>
      <li>-2 means the snack doesn't exist. -1 means it never expires.</li>
    </ul>
  `,
  'm2-l2': `
    <p>The <strong>Cache-Aside pattern</strong> is like checking your fridge before going to the grocery store:</p>
    <ol>
      <li>First, look in the fridge (cache) for milk. ✅ Found it? Great, you're done!</li>
      <li>❌ No milk? Walk to the store (database), buy milk, and put it in the fridge (cache) for next time.</li>
    </ol>
    <p><strong>Cache Invalidation</strong> is like throwing away old leftovers. When you cook a fresh meal (update the database), you toss the old Tupperware (delete the cache entry) so nobody eats yesterday's spaghetti.</p>
    <p>With TTL-based expiration, even if you forget to throw something out, the cache will auto-clean after the timer runs down. It's like having a smart fridge that tosses food after its expiry date!</p>
  `,
  'm3-l1': `
    <p>A Redis List is like a <strong>line of people at a ticket counter</strong>.</p>
    <ul>
      <li><strong>LPUSH</strong> is like someone cutting to the front of the line.</li>
      <li><strong>RPUSH</strong> adds someone to the back of the line (normal behavior).</li>
      <li><strong>LPOP</strong> removes the person at the very front.</li>
      <li><strong>RPOP</strong> removes the person at the back.</li>
      <li><strong>LRANGE</strong> lets you peek at a section of the line to see who's waiting.</li>
      <li><strong>LLEN</strong> tells you how many people are in line.</li>
    </ul>
    <p>Lists are great for <strong>to-do queues</strong> and activity feeds — like showing "Latest 10 things that happened on Twitter."</p>
  `,
  'm3-l2': `
    <p>Think of a job queue like a <strong>"To Do" list for a computer</strong>.</p>
    <p>The <strong>producer</strong> (the boss) adds tasks with LPUSH — "Resize this image!", "Send this email!", "Index this document!"</p>
    <p>The <strong>consumer</strong> (the worker) picks tasks from the bottom with RPOP. This is called <strong>FIFO</strong> (First In, First Out) — like a printer queue where your document prints in the order you sent it.</p>
    <p>For an <strong>activity feed</strong>, use LPUSH to add new activities and LRANGE to show the latest 10. It's like adding a new post to the top of your Instagram feed, then displaying the top 10 posts.</p>
  `,
  'm4-l1': `
    <p>If strings are lockers with one item, <strong>Hashes</strong> are filing cabinets with many labeled folders inside.</p>
    <p>Think of a user profile. Without hashes, you'd need separate lockers for <code>user:1:name</code>, <code>user:1:age</code>, <code>user:1:email</code> — three keys for one person!</p>
    <p>With a hash, it's one key (<code>user:1</code>) with three fields: name, age, email. Much cleaner!</p>
    <ul>
      <li><strong>HSET</strong> = "put a paper into a folder"</li>
      <li><strong>HGET</strong> = "open one folder to read a specific paper"</li>
      <li><strong>HGETALL</strong> = "dump out the whole drawer to see everything"</li>
      <li><strong>HDEL</strong> = "remove a paper from the folder"</li>
    </ul>
    <p>Hashes are also more <strong>memory-efficient</strong> — like using one big box for all your books instead of wrapping each book in its own box.</p>
  `,
  'm5-l1': `
    <p>A <strong>Sorted Set</strong> is like a classroom leaderboard where every student has a score. When new scores come in, the board <strong>automatically rearranges</strong> to show who's on top.</p>
    <ul>
      <li><strong>ZADD</strong> = "Alice scored 100 points, Bob scored 250" — adds them to the board.</li>
      <li><strong>ZRANGE</strong> = "List the students from lowest to highest score."</li>
      <li><strong>ZRANK</strong> = "Where does Bob rank?" → Answer: position 2 (highest).</li>
      <li><strong>ZSCORE</strong> = "What is Alice's exact score?" → Answer: 100.</li>
      <li><strong>ZINCRBY</strong> = "Give Bob 50 bonus points!" — updates automatically.</li>
    </ul>
    <p>This is why gaming leaderboards, real-time rankings, and priority queues all use sorted sets — the sorting happens automatically, no extra work needed!</p>
  `,
  'm6-l1': `
    <p><strong>Pub/Sub</strong> is like a <strong>radio station</strong>.</p>
    <ul>
      <li>The <strong>publisher</strong> (radio DJ) broadcasts music on a channel — say, "News FM 101".</li>
      <li><strong>Subscribers</strong> (people with radios tuned to 101 FM) hear the broadcast.</li>
      <li>If nobody is listening... the music plays anyway, but nobody hears it. It's <strong>not saved</strong> for later.</li>
    </ul>
    <p>Redis Pub/Sub commands:</p>
    <ul>
      <li><strong>SUBSCRIBE news</strong> = "Tune my radio to the News channel"</li>
      <li><strong>PUBLISH news "Breaking story!"</strong> = "DJ says something on the News channel"</li>
      <li><strong>UNSUBSCRIBE news</strong> = "Turn off the radio for News"</li>
    </ul>
    <p>Real-world uses: live chat notifications, stock price updates, sports scores, and multiplayer game events.</p>
  `,
  'm7-l1': `
    <p>A Redis transaction (<strong>MULTI / EXEC</strong>) is like handing a chef a <strong>list of recipes</strong> all at once:</p>
    <ol>
      <li><strong>MULTI</strong> = "Chef, get ready! I'm about to give you a list."</li>
      <li><strong>SET ..., SET ..., SET ...</strong> = The recipes (all queued up).</li>
      <li><strong>EXEC</strong> = "GO! Cook all of them, in order, without stopping."</li>
    </ol>
    <p>The chef will cook everything on the list in order before starting anything else. No interruptions!</p>
    <p><strong>But here's the twist</strong>: unlike a bank transaction, if one recipe burns, the chef <strong>keeps cooking the others</strong>. There's no "undo all" button. Redis is all about speed, not rollback.</p>
    <ul>
      <li><strong>DISCARD</strong> = "Actually, chef, forget the whole list. Throw it away."</li>
    </ul>
  `,
};

/* Expose globally for script-tag usage */
window.eli5RedisData = eli5RedisData;
