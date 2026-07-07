// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: System Design Interview Simulator logic only
// All globals prefixed sds_ or SDS_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  sdsRenderRubricRef();
  sdsInitControls();
});

/* ─── Prompts ─── */
let SDS_PROMPTS = {
  urlshortener: {
    title: 'Design a URL Shortener (like bit.ly)',
    context: 'A URL shortening service that converts long URLs into short aliases and redirects users when they visit the short URL.',
    scale: '100M URLs created per day, 10B redirects per day'
  },
  twitter: {
    title: 'Design Twitter / Social Media Feed',
    context: 'A social platform where users post tweets, follow others, and see a ranked feed of posts from people they follow.',
    scale: '300M daily users, 500M tweets per day'
  },
  netflix: {
    title: 'Design Netflix / Video Streaming',
    context: 'A video streaming service where users can browse, search, and stream high-quality video content on demand.',
    scale: '200M subscribers, 700TB content uploaded per day'
  },
  uber: {
    title: 'Design Uber / Ride Sharing',
    context: 'A ride-hailing platform that matches drivers and riders in real time based on location, availability, and pricing.',
    scale: '20M trips per day, 5M drivers online'
  },
  whatsapp: {
    title: 'Design WhatsApp / Messaging System',
    context: 'An end-to-end encrypted messaging platform supporting 1-on-1 and group chats, media sharing, and delivery receipts.',
    scale: '100B messages per day, 2B users'
  },
  googledrive: {
    title: 'Design Google Drive / File Storage',
    context: 'A cloud file storage system where users can upload, store, share, and collaboratively edit files.',
    scale: '1B users, 2 trillion files stored, 1PB uploaded per day'
  },
  ratelimiter: {
    title: 'Design a Rate Limiter',
    context: 'A system that controls the rate of requests a client can make to an API to prevent abuse and ensure fair usage.',
    scale: '10M API calls per second across distributed servers'
  },
  searchautocomplete: {
    title: 'Design Search Autocomplete / Typeahead',
    context: 'A real-time autocomplete system that suggests search queries as users type, like Google Search suggestions.',
    scale: '10M searches per day, 100ms response time requirement'
  },
  ticketmaster: {
    title: 'Design a Ticket Booking System',
    context: 'A concert and event ticket booking platform with seat selection, payment, and high-concurrency booking under flash sale conditions.',
    scale: '1M concurrent users, 10K events, flash sales causing 100K req/sec spikes'
  },
  amazoncart: {
    title: 'Design Amazon Shopping Cart',
    context: 'An e-commerce shopping cart that persists across devices, handles concurrent updates, and integrates with inventory and checkout.',
    scale: '500M users, 100M items, 1M orders per day'
  }
};

/* ─── Phases ─── */
let SDS_PHASES = [
  {
    name: 'Phase 1: Clarify Requirements',
    short: 'Clarify',
    icon: '❓',
    color: '#06b6d4',
    desc: 'Ask clarifying questions. Understand scope, users, scale, and constraints before designing anything.',
    hints: [
      'How many users? Daily active vs total?',
      'Read-heavy or write-heavy? What ratio?',
      'Latency requirements? (real-time vs eventual)',
      'Global or single-region?',
      'Strong or eventual consistency needed?',
      'What features are in scope for this interview?'
    ],
    placeholder: 'Write your clarifying questions and assumptions here...\n\nExample:\n- How many daily active users?\n- Is this read-heavy or write-heavy?\n- Do we need real-time updates?\n- Global deployment or single region?'
  },
  {
    name: 'Phase 2: Capacity Estimation',
    short: 'Estimate',
    icon: '📊',
    color: '#f59e0b',
    desc: 'Estimate QPS, storage, bandwidth, and memory. Let numbers guide your architecture decisions.',
    hints: [
      'Calculate read QPS and write QPS',
      'Estimate storage per day / per year',
      'Calculate bandwidth (inbound + outbound)',
      'Estimate cache memory needed',
      'Consider peak vs average traffic'
    ],
    placeholder: 'Write your back-of-envelope calculations here...\n\nExample:\n- DAU: 100M users\n- Each user reads 10x per day = 1B reads/day = ~12K RPS\n- Each write = 1KB → 1M writes/day = 1GB/day storage\n- With 5 year retention: 1.8TB total'
  },
  {
    name: 'Phase 3: High-Level Design',
    short: 'Design',
    icon: '🏛️',
    color: '#a855f7',
    desc: 'Draw the big picture. Define APIs, components, and data flow. Include clients, LB, services, DB, cache.',
    hints: [
      'Define API endpoints (GET/POST/etc)',
      'Identify core services / microservices',
      'Choose SQL vs NoSQL — justify why',
      'Where does caching fit? (CDN, Redis, in-memory)',
      'Load balancer placement and strategy',
      'How does data flow end-to-end?'
    ],
    placeholder: 'Describe your high-level architecture...\n\nExample:\n- API Layer: REST API with /shorten and /redirect endpoints\n- Application Server: stateless, horizontally scalable\n- Database: MySQL for URL mappings (strong consistency)\n- Cache: Redis for hot URLs (LRU eviction)\n- CDN: for static assets'
  },
  {
    name: 'Phase 4: Deep Dive',
    short: 'Deep Dive',
    icon: '🔍',
    color: '#ef4444',
    desc: 'Drill into the hardest component. Address bottlenecks, failure modes, scalability, and edge cases.',
    hints: [
      'What is the hardest problem to solve?',
      'How does the system handle failure?',
      'Database sharding strategy?',
      'Replication: master-slave or multi-master?',
      'Message queues for async processing?',
      'How to handle hotspots / celebrity problem?',
      'Rate limiting strategy?'
    ],
    placeholder: 'Deep dive into the most critical components...\n\nExample:\nSharding strategy: hash(short_url) % 256 shards\nReplication: 3 replicas per shard (1 master, 2 read replicas)\nCache invalidation: TTL=1hr for most URLs, permanent for popular ones\nBottleneck: write throughput → use async writes with message queue'
  },
  {
    name: 'Phase 5: Review & Trade-offs',
    short: 'Review',
    icon: '✅',
    color: '#22c55e',
    desc: 'Summarize your design, discuss trade-offs, and identify what you would do differently at larger scale.',
    hints: [
      'What are the main trade-offs in your design?',
      'Consistency vs Availability — where did you land?',
      'What would you change with 10x more traffic?',
      'What monitoring and alerting would you add?',
      'Any security concerns?',
      'What was left out of scope?'
    ],
    placeholder: 'Summarize trade-offs and design decisions...\n\nExample:\nTrade-offs:\n- Chose eventual consistency for URL metadata (availability > consistency)\n- SQL over NoSQL: we need ACID for billing but NoSQL for analytics\n\nAt 10x scale:\n- Move to distributed cache cluster\n- Implement consistent hashing for sharding\n\nMonitoring: P99 latency, cache hit rate, error rate dashboards'
  }
];

/* ─── Rubric ─── */
let SDS_RUBRIC = [
  {
    key: 'scalability',
    icon: '📈',
    title: 'Scalability',
    desc: 'Does the design handle 10x, 100x growth? Horizontal scaling, sharding, partitioning discussed?',
    points: ['Horizontal scaling', 'Database sharding', 'Load balancing', 'Stateless services']
  },
  {
    key: 'reliability',
    icon: '🛡️',
    title: 'Reliability',
    desc: 'Does the system handle failures gracefully? Replication, failover, retry logic addressed?',
    points: ['Replication strategy', 'Failover handling', 'Retry with backoff', 'Circuit breakers']
  },
  {
    key: 'availability',
    icon: '⚡',
    title: 'Availability',
    desc: 'Is the system designed for high availability? SLAs, redundancy, multi-region discussed?',
    points: ['Multi-region deployment', 'SLA targets (99.9%?)', 'CDN for static content', 'Health checks']
  },
  {
    key: 'database',
    icon: '🗃️',
    title: 'Database Choices',
    desc: 'Are database choices justified? SQL vs NoSQL reasoning, indexing, schema design covered?',
    points: ['SQL vs NoSQL justification', 'Indexing strategy', 'Query patterns', 'Data modeling']
  },
  {
    key: 'caching',
    icon: '💾',
    title: 'Caching Strategy',
    desc: 'Is caching discussed at multiple layers? Eviction policy, cache-aside vs write-through, TTL?',
    points: ['Cache placement (CDN/Redis)', 'Eviction policy (LRU/LFU)', 'Cache invalidation', 'Hit rate targets']
  }
];

/* ─── State ─── */
let sdsState = {
  phase         : 0,
  totalSeconds  : 45 * 60,
  secondsLeft   : 45 * 60,
  phaseSeconds  : [],
  phaseSecondsLeft: [],
  timer         : null,
  phaseTimer    : null,
  prompt        : null,
  notes         : ['', '', '', '', ''],
  running       : false,
  ended         : false,
};

let SDS_PHASE_RATIOS = [5/45, 5/45, 20/45, 10/45, 5/45]; // proportion of total

/* ─── Helpers ─── */
function sdsFmt(s) {
  let m = Math.floor(s / 60);
  let sec = s % 60;
  return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
}

function sdsPickPrompt(key) {
  if (key === 'random') {
    let keys = Object.keys(SDS_PROMPTS);
    key = keys[Math.floor(Math.random() * keys.length)];
  }
  return SDS_PROMPTS[key];
}

/* ─── Render Rubric Reference ─── */
function sdsRenderRubricRef() {
  let grid = document.getElementById('sdsRubricGrid');
  if (!grid) return;
  grid.innerHTML = SDS_RUBRIC.map(function(r) {
    let pts = r.points.map(function(p) {
      return '<span class="sds-rubric-ref-point">' + p + '</span>';
    }).join('');
    return '<div class="sds-rubric-ref-card">' +
      '<div class="sds-rubric-ref-title">' + r.icon + ' ' + r.title + '</div>' +
      '<div class="sds-rubric-ref-desc">' + r.desc + '</div>' +
      '<div class="sds-rubric-ref-points">' + pts + '</div>' +
    '</div>';
  }).join('');
}

/* ─── Start Interview ─── */
function sdsStart(topicKey, durationMin) {
  sdsState.prompt        = sdsPickPrompt(topicKey);
  sdsState.totalSeconds  = durationMin * 60;
  sdsState.secondsLeft   = durationMin * 60;
  sdsState.phase         = 0;
  sdsState.notes         = ['', '', '', '', ''];
  sdsState.running       = true;
  sdsState.ended         = false;

  // Calculate phase seconds
  sdsState.phaseSeconds = SDS_PHASE_RATIOS.map(function(r) {
    return Math.round(r * sdsState.totalSeconds);
  });
  sdsState.phaseSecondsLeft = sdsState.phaseSeconds.slice();

  // Show interview screen
  document.getElementById('sdsStartScreen').classList.add('hidden');
  document.getElementById('sdsResultsScreen').classList.add('hidden');
  document.getElementById('sdsInterviewScreen').classList.remove('hidden');

  // Set prompt
  document.getElementById('sdsPromptLabel').textContent = sdsState.prompt.title;
  document.getElementById('sdsResultsPrompt').textContent = sdsState.prompt.title;

  sdsRenderPhasesBar();
  sdsRenderPhaseDots();
  sdsLoadPhase(0);
  sdsStartTimers();
}

/* ─── Phase Bar & Dots ─── */
function sdsRenderPhasesBar() {
  let bar = document.getElementById('sdsPhasesBar');
  if (!bar) return;
  bar.innerHTML = SDS_PHASES.map(function(p, i) {
    return '<div class="sds-phase-tab" data-phase="' + i + '">' + p.icon + ' ' + p.short + '</div>';
  }).join('');
}

function sdsRenderPhaseDots() {
  let dots = document.getElementById('sdsPhaseDots');
  if (!dots) return;
  dots.innerHTML = SDS_PHASES.map(function(p, i) {
    return '<div class="sds-phase-dot" data-dot="' + i + '"></div>';
  }).join('');
}

function sdsUpdatePhaseUI() {
  // Phase tabs
  let tabs = document.querySelectorAll('.sds-phase-tab');
  tabs.forEach(function(tab) {
    let idx = parseInt(tab.getAttribute('data-phase'));
    tab.classList.remove('active', 'done');
    if (idx === sdsState.phase) tab.classList.add('active');
    if (idx < sdsState.phase)  tab.classList.add('done');
  });

  // Dots
  let dots = document.querySelectorAll('.sds-phase-dot');
  dots.forEach(function(dot) {
    let idx = parseInt(dot.getAttribute('data-dot'));
    dot.classList.remove('active', 'done');
    if (idx === sdsState.phase) dot.classList.add('active');
    if (idx < sdsState.phase)  dot.classList.add('done');
  });

  // Prev/Next buttons
  let prevBtn = document.getElementById('sdsPrevPhaseBtn');
  let nextBtn = document.getElementById('sdsNextPhaseBtn');
  if (prevBtn) prevBtn.disabled = sdsState.phase === 0;
  if (nextBtn) {
    if (sdsState.phase >= SDS_PHASES.length - 1) {
      nextBtn.innerHTML = '<i class="fas fa-flag-checkered"></i> Finish & Score';
    } else {
      nextBtn.innerHTML = 'Next Phase <i class="fas fa-arrow-right"></i>';
    }
  }
}

/* ─── Load Phase ─── */
function sdsLoadPhase(idx) {
  let phase = SDS_PHASES[idx];
  if (!phase) return;

  // Save current notes
  let notesEl = document.getElementById('sdsNotes');
  if (notesEl) sdsState.notes[sdsState.phase] = notesEl.value;

  sdsState.phase = idx;

  // Update header
  let iconEl  = document.getElementById('sdsPhaseIcon');
  let nameEl  = document.getElementById('sdsPhaseName');
  let descEl  = document.getElementById('sdsPhaseDesc');
  let nameSmEl = document.getElementById('sdsPhaseNameSmall');
  if (iconEl)  iconEl.textContent  = phase.icon;
  if (nameEl)  nameEl.textContent  = phase.name;
  if (descEl)  descEl.textContent  = phase.desc;
  if (nameSmEl) nameSmEl.textContent = phase.short;

  // Hints
  let hintsList = document.getElementById('sdsHintsList');
  if (hintsList) {
    hintsList.innerHTML = phase.hints.map(function(h) {
      return '<span class="sds-hint-chip">' + h + '</span>';
    }).join('');
  }

  // Restore notes
  if (notesEl) {
    notesEl.value       = sdsState.notes[idx] || '';
    notesEl.placeholder = phase.placeholder || 'Write your notes here...';
  }

  // Phase timer
  let phaseTimerEl = document.getElementById('sdsPhaseTimer');
  if (phaseTimerEl) phaseTimerEl.textContent = sdsFmt(sdsState.phaseSecondsLeft[idx]);

  sdsUpdatePhaseUI();
}

/* ─── Timers ─── */
function sdsStartTimers() {
  if (sdsState.timer) clearInterval(sdsState.timer);

  sdsState.timer = setInterval(function() {
    if (!sdsState.running) return;

    sdsState.secondsLeft--;
    sdsState.phaseSecondsLeft[sdsState.phase] = Math.max(0, sdsState.phaseSecondsLeft[sdsState.phase] - 1);

    // Update total timer
    let timerEl = document.getElementById('sdsTimer');
    if (timerEl) {
      timerEl.textContent = sdsFmt(sdsState.secondsLeft);
      timerEl.className = 'sds-timer';
      if (sdsState.secondsLeft <= 120) timerEl.classList.add('danger');
      else if (sdsState.secondsLeft <= 300) timerEl.classList.add('warning');
    }

    // Update phase timer
    let phaseTimerEl = document.getElementById('sdsPhaseTimer');
    if (phaseTimerEl) phaseTimerEl.textContent = sdsFmt(sdsState.phaseSecondsLeft[sdsState.phase]);

    // Auto end when time runs out
    if (sdsState.secondsLeft <= 0) {
      sdsEnd();
    }
  }, 1000);
}

function sdsStopTimers() {
  if (sdsState.timer) { clearInterval(sdsState.timer); sdsState.timer = null; }
}

/* ─── End & Score ─── */
function sdsEnd() {
  if (sdsState.ended) return;
  sdsState.ended = true;
  sdsState.running = false;
  sdsStopTimers();

  // Save current phase notes
  let notesEl = document.getElementById('sdsNotes');
  if (notesEl) sdsState.notes[sdsState.phase] = notesEl.value;

  sdsScore();
}

/* ─── Scoring ─── */
function sdsKeywords() {
  return {
    scalability: ['horizontal', 'scaling', 'shard', 'partition', 'replica', 'load balance', 'stateless', 'auto-scale', 'distributed', 'cluster'],
    reliability: ['replica', 'failover', 'retry', 'circuit break', 'backup', 'redundan', 'replicat', 'fault', 'recovery', 'ack'],
    availability: ['cdn', 'multi-region', 'availability zone', '99.9', 'sla', 'health check', 'uptime', 'redundan', 'replicate', 'global'],
    database: ['sql', 'nosql', 'index', 'schema', 'relational', 'mongodb', 'cassandra', 'postgres', 'mysql', 'dynamo', 'sharding', 'partition key'],
    caching: ['cache', 'redis', 'memcached', 'cdn', 'ttl', 'eviction', 'lru', 'lfu', 'write-through', 'cache-aside', 'invalidat']
  };
}

function sdsScoreCategory(allNotes, keywords) {
  let text = allNotes.toLowerCase();
  let found = 0;
  keywords.forEach(function(kw) { if (text.indexOf(kw) !== -1) found++; });
  return Math.min(20, Math.round((found / keywords.length) * 20));
}

function sdsScore() {
  let allNotes = sdsState.notes.join(' ');
  let kw = sdsKeywords();
  let scores = {
    scalability: sdsScoreCategory(allNotes, kw.scalability),
    reliability: sdsScoreCategory(allNotes, kw.reliability),
    availability: sdsScoreCategory(allNotes, kw.availability),
    database:    sdsScoreCategory(allNotes, kw.database),
    caching:     sdsScoreCategory(allNotes, kw.caching),
  };

  let total = scores.scalability + scores.reliability + scores.availability + scores.database + scores.caching;

  let grade = '📚 Needs Work';
  if (total >= 90) grade = '🏆 Outstanding';
  else if (total >= 75) grade = '🔥 Strong Design';
  else if (total >= 60) grade = '👍 Solid Foundation';
  else if (total >= 40) grade = '📝 Developing';

  sdsRenderResults(scores, total, grade);
}

/* ─── Render Results ─── */
function sdsRenderResults(scores, total, grade) {
  document.getElementById('sdsInterviewScreen').classList.add('hidden');
  document.getElementById('sdsResultsScreen').classList.remove('hidden');

  // Score
  document.getElementById('sdsOverallScore').textContent = total;
  document.getElementById('sdsOverallGrade').textContent = grade;

  // Rubric scores
  let rubricEl = document.getElementById('sdsRubricScores');
  if (rubricEl) {
    rubricEl.innerHTML = SDS_RUBRIC.map(function(r) {
      let score  = scores[r.key];
      let pct    = (score / 20) * 100;
      let color  = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
      let fb     = score >= 15 ? 'Well covered.' : score >= 10 ? 'Partially addressed.' : score >= 5 ? 'Mentioned briefly — needs more depth.' : 'Not covered — add this to your design.';
      return '<div class="sds-rubric-score-card">' +
        '<div class="sds-rubric-score-title">' + r.icon + ' ' + r.title + ' <span style="margin-left:auto;font-family:Fira Code,monospace;color:' + color + '">' + score + '/20</span></div>' +
        '<div class="sds-rubric-bar-wrap"><div class="sds-rubric-bar-fill" style="width:0%;background:' + color + '" data-pct="' + pct + '"></div></div>' +
        '<div class="sds-rubric-bar-val">' + score + '/20</div>' +
        '<div class="sds-rubric-feedback">' + fb + '</div>' +
      '</div>';
    }).join('');

    // Animate bars
    requestAnimationFrame(function() {
      setTimeout(function() {
        rubricEl.querySelectorAll('.sds-rubric-bar-fill').forEach(function(bar) {
          bar.style.width = bar.getAttribute('data-pct') + '%';
        });
      }, 100);
    });
  }

  // Notes review
  let notesReviewEl = document.getElementById('sdsNotesReview');
  if (notesReviewEl) {
    let html = '<div class="sds-notes-review-title">📝 Your Phase Notes</div>';
    SDS_PHASES.forEach(function(phase, i) {
      let note   = sdsState.notes[i] || '(No notes written)';
      let wordCt = note.trim().split(/\s+/).filter(function(w) { return w.length > 0; }).length;
      html += '<div class="sds-notes-review-card">' +
        '<div class="sds-notes-review-header" data-phase-review="' + i + '">' +
          phase.icon + ' ' + phase.short + ' — ' + wordCt + ' words ' +
          '<i class="fas fa-chevron-down" style="margin-left:auto;color:var(--text-secondary);font-size:0.75rem"></i>' +
        '</div>' +
        '<div class="sds-notes-review-body" id="sdsReviewBody' + i + '">' + sdsEscape(note) + '</div>' +
      '</div>';
    });
    notesReviewEl.innerHTML = html;

    notesReviewEl.querySelectorAll('.sds-notes-review-header').forEach(function(hdr) {
      hdr.addEventListener('click', function() {
        let idx  = hdr.getAttribute('data-phase-review');
        let body = document.getElementById('sdsReviewBody' + idx);
        if (body) body.classList.toggle('open');
      });
    });
  }

  // Feedback
  let feedbackEl = document.getElementById('sdsFeedbackGrid');
  if (feedbackEl) {
    let strengths    = [];
    let improvements = [];
    SDS_RUBRIC.forEach(function(r) {
      let sc = scores[r.key];
      if (sc >= 14) strengths.push('Strong ' + r.title.toLowerCase() + ' coverage (' + sc + '/20)');
      else if (sc <= 7) improvements.push('Expand ' + r.title.toLowerCase() + ' — discuss ' + r.points[0].toLowerCase() + ' and ' + r.points[1].toLowerCase());
    });

    if (strengths.length === 0)    strengths.push('Keep practicing — reviewing real architectures helps build intuition.');
    if (improvements.length === 0) improvements.push('Great job! Consider adding monitoring and observability to future designs.');

    let sHtml = strengths.map(function(s) { return '<div class="sds-feedback-item">' + s + '</div>'; }).join('');
    let iHtml = improvements.map(function(s) { return '<div class="sds-feedback-item">' + s + '</div>'; }).join('');

    feedbackEl.innerHTML =
      '<div class="sds-feedback-card">' +
        '<div class="sds-feedback-card-title strengths"><i class="fas fa-check-circle"></i> Strengths</div>' + sHtml +
      '</div>' +
      '<div class="sds-feedback-card">' +
        '<div class="sds-feedback-card-title improvement"><i class="fas fa-arrow-up"></i> Areas for Improvement</div>' + iHtml +
      '</div>';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function sdsEscape(str) {
  let d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ─── Init Controls ─── */
function sdsInitControls() {
  let startBtn  = document.getElementById('sdsStartBtn');
  let endBtn    = document.getElementById('sdsEndBtn');
  let nextBtn   = document.getElementById('sdsNextPhaseBtn');
  let prevBtn   = document.getElementById('sdsPrevPhaseBtn');
  let tryAgain  = document.getElementById('sdsTryAgainBtn');
  let newPrompt = document.getElementById('sdsNewPromptBtn');

  if (startBtn) {
    startBtn.addEventListener('click', function() {
      let topicKey  = document.getElementById('sdsTopicSelect').value;
      let durationMin = parseInt(document.getElementById('sdsDurationSelect').value);
      sdsStart(topicKey, durationMin);
    });
  }

  if (endBtn) {
    endBtn.addEventListener('click', function() {
      if (false /* confirm removed */) sdsEnd();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      // Save notes
      let notesEl = document.getElementById('sdsNotes');
      if (notesEl) sdsState.notes[sdsState.phase] = notesEl.value;

      if (sdsState.phase >= SDS_PHASES.length - 1) {
        sdsEnd();
      } else {
        sdsLoadPhase(sdsState.phase + 1);
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function() {
      if (sdsState.phase <= 0) return;
      let notesEl = document.getElementById('sdsNotes');
      if (notesEl) sdsState.notes[sdsState.phase] = notesEl.value;
      sdsLoadPhase(sdsState.phase - 1);
    });
  }

  if (tryAgain) {
    tryAgain.addEventListener('click', function() {
      sdsStopTimers();
      document.getElementById('sdsResultsScreen').classList.add('hidden');
      document.getElementById('sdsStartScreen').classList.remove('hidden');
    });
  }

  if (newPrompt) {
    newPrompt.addEventListener('click', function() {
      sdsStopTimers();
      document.getElementById('sdsResultsScreen').classList.add('hidden');
      document.getElementById('sdsStartScreen').classList.remove('hidden');
      let sel = document.getElementById('sdsTopicSelect');
      if (sel) sel.value = 'random';
    });
  }
}