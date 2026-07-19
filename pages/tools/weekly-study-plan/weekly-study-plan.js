/**
 * Weekly DSA Study Plan Generator
 * Hours + weak topics + goal date → 7-day plan with quiz/visualizer deep links.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'aivWeeklyStudyPlan';
  const XP_PER_DAY = 25;
  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const TOPICS = [
    {
      id: 'arrays',
      label: 'Arrays',
      focus: ['Two pointers drills', 'Prefix / sliding window patterns', 'Edge-case dry runs'],
      learn: '/pages/learning/array-learning/array-learning.html',
      visualizer: '/pages/visualizers/sorting-visualizer/sorting-visualizer.html',
      quiz: '/index.html#quiz',
    },
    {
      id: 'strings',
      label: 'Strings',
      focus: ['Anagram / frequency maps', 'KMP intuition', 'Palindrome patterns'],
      learn: '/pages/learning/trie-string-learning/trie-string-learning.html',
      visualizer: '/pages/visualizers/string-matching-visualizer/string-matching-visualizer.html',
      quiz: '/index.html#quiz',
    },
    {
      id: 'linkedlist',
      label: 'Linked Lists',
      focus: ['Reversal & cycles', 'Two-pointer tricks', 'Dummy-node patterns'],
      learn: '/pages/learning/linkedlist-learning/linkedlist-learning.html',
      visualizer: '/pages/visualizers/linked-list-visualizer/linked-list-visualizer.html',
      quiz: '/index.html#quiz',
    },
    {
      id: 'stacks',
      label: 'Stacks & Queues',
      focus: ['Monotonic stack', 'BFS queue drills', 'Parentheses / next greater'],
      learn: '/pages/learning/stack-learning/stack-learning.html',
      visualizer: '/pages/visualizers/stack-queue-visualizer/stack-queue-visualizer.html',
      quiz: '/index.html#quiz',
    },
    {
      id: 'trees',
      label: 'Trees',
      focus: ['Traversals', 'BST invariants', 'LCA / diameter practice'],
      learn: '/pages/learning/trees-learning/trees-learning.html',
      visualizer: '/pages/visualizers/tree-visualizer/tree-visualizer.html',
      quiz: '/index.html#quiz',
    },
    {
      id: 'graphs',
      label: 'Graphs',
      focus: ['BFS/DFS templates', 'Topo sort', 'Shortest path sketches'],
      learn: '/pages/learning/graph-learning/graph-learning.html',
      visualizer: '/pages/visualizers/bfs-dfs-visualizer/bfs-dfs-visualizer.html',
      quiz: '/index.html#quiz',
    },
    {
      id: 'dp',
      label: 'Dynamic Programming',
      focus: ['1D DP warmups', 'Grid / knapsack patterns', 'State transition talk-through'],
      learn: '/pages/learning/dp-learning/dp-learning.html',
      visualizer: '/pages/visualizers/dp-visualizer/dp-visualizer.html',
      quiz: '/index.html#quiz',
    },
    {
      id: 'twopointers',
      label: 'Two Pointers',
      focus: ['Sorted pair sums', 'Container / rain water', 'Partition patterns'],
      learn: '/pages/learning/two-pointers-learning/two-pointers-learning.html',
      visualizer: '/pages/tools/brute-to-optimal-studio/brute-to-optimal-studio.html',
      quiz: '/index.html#quiz',
    },
    {
      id: 'sliding',
      label: 'Sliding Window',
      focus: ['Fixed vs variable window', 'At-most-k patterns', 'Complexity proofs'],
      learn: '/pages/learning/sliding-window-learning/sliding-window-learning.html',
      visualizer: '/pages/visualizers/big-o-analyzer/big-o-analyzer.html',
      quiz: '/index.html#quiz',
    },
    {
      id: 'heaps',
      label: 'Heaps',
      focus: ['Top-K patterns', 'Merge K lists mindset', 'Priority queue ops'],
      learn: '/pages/learning/heaps-learning/heaps-learning.html',
      visualizer: '/pages/visualizers/heap-percolation-visualizer/heap-percolation-visualizer.html',
      quiz: '/index.html#quiz',
    },
    {
      id: 'recursion',
      label: 'Recursion',
      focus: ['Base cases', 'Decision trees', 'Backtracking templates'],
      learn: '/pages/learning/recursion-learning/recursion-learning.html',
      visualizer: '/pages/visualizers/recursion-tree-visualizer/recursion-tree-visualizer.html',
      quiz: '/index.html#quiz',
    },
    {
      id: 'bit',
      label: 'Bit Manipulation',
      focus: ['Masks & toggles', 'Subset tricks', 'Interview bit puzzles'],
      learn: '/pages/learning/bit-manipulation-learning/bit-manipulation-learning.html',
      visualizer: '/pages/visualizers/bitmask-dp/bitmask-dp.html',
      quiz: '/index.html#quiz',
    },
  ];

  const FOCUS_TYPES = ['learn', 'visualize', 'quiz', 'mixed'];

  const els = {
    hours: document.getElementById('wspHours'),
    hoursVal: document.getElementById('wspHoursVal'),
    goal: document.getElementById('wspGoal'),
    goalHint: document.getElementById('wspGoalHint'),
    topicGrid: document.getElementById('wspTopicGrid'),
    generate: document.getElementById('wspGenerate'),
    clear: document.getElementById('wspClear'),
    status: document.getElementById('wspStatus'),
    dailyBudget: document.getElementById('wspDailyBudget'),
    daysLeft: document.getElementById('wspDaysLeft'),
    topicCount: document.getElementById('wspTopicCount'),
    doneCount: document.getElementById('wspDoneCount'),
    progressFill: document.getElementById('wspProgressFill'),
    planMeta: document.getElementById('wspPlanMeta'),
    days: document.getElementById('wspDays'),
  };

  let selectedTopics = new Set(['arrays', 'dp']);
  let plan = null;

  function topicById(id) {
    return TOPICS.find((t) => t.id === id);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const goal = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(goal.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((goal - today) / 86400000);
  }

  function intensityLabel(daysLeft) {
    if (daysLeft == null) return 'Steady pace';
    if (daysLeft < 0) return 'Goal date passed — keep a maintenance week';
    if (daysLeft <= 7) return 'Sprint mode — prioritize weak topics';
    if (daysLeft <= 21) return 'Focused prep — balance depth + mocks';
    return 'Build foundations — consistent daily reps';
  }

  function allocateMinutes(hoursPerWeek) {
    const totalMins = hoursPerWeek * 60;
    // Slightly heavier mid-week, lighter Sunday
    const weights = [1.1, 1.15, 1.2, 1.15, 1.1, 0.9, 0.7];
    const sumW = weights.reduce((a, b) => a + b, 0);
    return weights.map((w) => Math.max(20, Math.round((totalMins * w) / sumW)));
  }

  function buildPlan(hours, topicIds, goalDate) {
    const topics = topicIds.map(topicById).filter(Boolean);
    if (!topics.length) return null;

    const minutes = allocateMinutes(hours);
    const days = DAY_NAMES.map((name, i) => {
      const topic = topics[i % topics.length];
      const focusType = FOCUS_TYPES[i % FOCUS_TYPES.length];
      const focusLine = topic.focus[i % topic.focus.length];
      let primaryLabel = 'Mixed session';
      if (focusType === 'learn') primaryLabel = 'Theory + notes';
      if (focusType === 'visualize') primaryLabel = 'Visualizer deep dive';
      if (focusType === 'quiz') primaryLabel = 'Quiz + recall';

      return {
        dayIndex: i,
        dayName: name,
        minutes: minutes[i],
        topicId: topic.id,
        topicLabel: topic.label,
        focusType,
        focusLine,
        primaryLabel,
        links: [
          { label: 'Learn', href: topic.learn, kind: 'learn' },
          { label: 'Visualizer', href: topic.visualizer, kind: 'viz' },
          { label: 'Quiz', href: topic.quiz, kind: 'quiz' },
        ],
        done: false,
        xpAwarded: false,
      };
    });

    return {
      createdAt: new Date().toISOString(),
      hoursPerWeek: hours,
      goalDate: goalDate || null,
      topicIds: [...topicIds],
      days,
    };
  }

  function renderTopics() {
    els.topicGrid.replaceChildren(
      ...TOPICS.map((topic) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `wsp-topic-chip${selectedTopics.has(topic.id) ? ' active' : ''}`;
        btn.setAttribute('aria-pressed', String(selectedTopics.has(topic.id)));
        btn.textContent = topic.label;
        btn.addEventListener('click', () => {
          if (selectedTopics.has(topic.id)) {
            if (selectedTopics.size === 1) {
              setStatus('Keep at least one weak topic selected.', true);
              return;
            }
            selectedTopics.delete(topic.id);
          } else {
            selectedTopics.add(topic.id);
          }
          btn.classList.toggle('active', selectedTopics.has(topic.id));
          btn.setAttribute('aria-pressed', String(selectedTopics.has(topic.id)));
          updateSnapshot();
        });
        return btn;
      })
    );
  }

  function updateSnapshot() {
    const hours = Number(els.hours.value) || 10;
    els.hoursVal.textContent = `${hours}h`;
    const avg = Math.round((hours * 60) / 7);
    els.dailyBudget.textContent = `~${avg} min`;
    els.topicCount.textContent = String(selectedTopics.size);

    const left = daysUntil(els.goal.value);
    els.daysLeft.textContent = left == null ? '—' : String(left);
    els.goalHint.textContent = intensityLabel(left);

    if (plan) {
      const done = plan.days.filter((d) => d.done).length;
      const total = plan.days.length;
      els.doneCount.textContent = `${done} / ${total}`;
      els.progressFill.style.width = `${(done / total) * 100}%`;
    } else {
      els.doneCount.textContent = '0 / 0';
      els.progressFill.style.width = '0%';
    }
  }

  function setStatus(msg, isError = false) {
    els.status.textContent = msg;
    els.status.style.color = isError ? '#f87171' : 'var(--wsp-green)';
  }

  function renderPlan() {
    if (!plan) {
      els.days.innerHTML = '<p class="wsp-empty">No plan yet. Select weak topics and hit Generate.</p>';
      els.planMeta.textContent = 'Generate a plan to get started';
      updateSnapshot();
      return;
    }

    const left = daysUntil(plan.goalDate);
    els.planMeta.textContent = `${plan.hoursPerWeek}h/week · ${intensityLabel(left)}`;

    els.days.replaceChildren(
      ...plan.days.map((day) => {
        const card = document.createElement('article');
        card.className = `wsp-day${day.done ? ' done' : ''}`;
        card.setAttribute('role', 'listitem');
        card.innerHTML = `
          <div class="wsp-day-head">
            <h3 class="wsp-day-title">${escapeHtml(day.dayName)} · ${escapeHtml(day.primaryLabel)}</h3>
            <span class="wsp-day-mins">${day.minutes} min</span>
          </div>
          <div class="wsp-day-topic">${escapeHtml(day.topicLabel)}</div>
          <p class="wsp-day-focus">${escapeHtml(day.focusLine)}</p>
          <div class="wsp-day-links">
            ${day.links
              .map(
                (l) =>
                  `<a class="${escapeHtml(l.kind)}" href="${escapeHtml(l.href)}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>`
              )
              .join('')}
          </div>
        `;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'wsp-complete-btn';
        btn.textContent = day.done ? 'Completed ✓' : 'Mark complete (+25 XP)';
        btn.addEventListener('click', () => toggleDayComplete(day.dayIndex));
        card.appendChild(btn);
        return card;
      })
    );

    updateSnapshot();
  }

  function awardXP(amount) {
    if (typeof window.addXP === 'function') {
      window.addXP(amount, 'weekly-study-plan');
      return true;
    }

    // Soft integration: bump algoInfinityVerse XP if present
    try {
      const raw = localStorage.getItem('algoInfinityVerse');
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return false;
      data.xp = (Number(data.xp) || 0) + amount;
      data.lastActive = new Date().toISOString();
      localStorage.setItem('algoInfinityVerse', JSON.stringify(data));
      if (window.userProgress) {
        window.userProgress.xp = data.xp;
      }
      return true;
    } catch {
      return false;
    }
  }

  function toggleDayComplete(dayIndex) {
    if (!plan) return;
    const day = plan.days[dayIndex];
    if (!day) return;

    if (!day.done) {
      day.done = true;
      if (!day.xpAwarded) {
        const ok = awardXP(XP_PER_DAY);
        day.xpAwarded = true;
        setStatus(ok ? `Day marked complete · +${XP_PER_DAY} XP` : 'Day marked complete (XP hook unavailable on this page).');
      } else {
        setStatus('Day marked complete.');
      }
    } else {
      day.done = false;
      setStatus('Day marked incomplete.');
    }

    persist();
    renderPlan();
  }

  function persist() {
    if (!plan) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        plan,
        selectedTopics: [...selectedTopics],
        hours: Number(els.hours.value),
        goalDate: els.goal.value || '',
      })
    );
  }

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      if (Array.isArray(data.selectedTopics) && data.selectedTopics.length) {
        selectedTopics = new Set(data.selectedTopics);
      }
      if (data.hours) els.hours.value = String(data.hours);
      if (data.goalDate) els.goal.value = data.goalDate;
      if (data.plan && Array.isArray(data.plan.days)) {
        plan = data.plan;
      }
    } catch {
      /* ignore corrupt storage */
    }
  }

  function handleGenerate() {
    const hours = Number(els.hours.value) || 10;
    if (selectedTopics.size === 0) {
      setStatus('Select at least one weak topic.', true);
      return;
    }
    plan = buildPlan(hours, [...selectedTopics], els.goal.value || null);
    persist();
    renderPlan();
    setStatus('7-day plan generated and saved to localStorage.');
  }

  function handleClear() {
    if (!localStorage.getItem(STORAGE_KEY) && !plan) {
      setStatus('Nothing saved yet.', true);
      return;
    }
    if (!window.confirm('Clear the saved weekly study plan?')) return;
    plan = null;
    localStorage.removeItem(STORAGE_KEY);
    renderPlan();
    setStatus('Saved plan cleared.');
  }

  // Default goal: +21 days
  function setDefaultGoal() {
    if (els.goal.value) return;
    const d = new Date();
    d.setDate(d.getDate() + 21);
    els.goal.value = d.toISOString().slice(0, 10);
  }

  els.hours.addEventListener('input', updateSnapshot);
  els.goal.addEventListener('change', () => {
    updateSnapshot();
    if (plan) {
      plan.goalDate = els.goal.value || null;
      persist();
      renderPlan();
    }
  });
  els.generate.addEventListener('click', handleGenerate);
  els.clear.addEventListener('click', handleClear);

  const scrollBtn = document.getElementById('scrollTopBtn');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('visible', window.scrollY > 400);
    });
    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  loadSaved();
  setDefaultGoal();
  renderTopics();
  updateSnapshot();
  renderPlan();
  if (plan) setStatus('Restored your saved weekly plan.');
})();
