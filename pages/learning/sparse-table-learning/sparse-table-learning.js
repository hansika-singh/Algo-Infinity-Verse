document.addEventListener('DOMContentLoaded', () => {

  const STORAGE_KEY = 'sparse-table-learning-progress-v2';
  let completedTopics = [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    completedTopics = raw.filter(id => !isNaN(id) && id !== null && id !== undefined && id !== "");
    if (raw.length !== completedTopics.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTopics));
    }
  } catch {
    completedTopics = [];
  }

  // Common utilities
  function showSuccess(feedbackEl, completeBtn, msg) {
    feedbackEl.style.display = 'block';
    feedbackEl.style.background = 'rgba(76,175,80,0.1)';
    feedbackEl.style.border = '1px solid #4CAF50';
    feedbackEl.style.color = '#4CAF50';
    feedbackEl.innerHTML = "✓ " + msg;
    completeBtn.disabled = false;
  }

  function showError(feedbackEl, msg) {
    feedbackEl.style.display = 'block';
    feedbackEl.style.background = 'rgba(244,67,54,0.1)';
    feedbackEl.style.border = '1px solid #f44336';
    feedbackEl.style.color = '#f44336';
    feedbackEl.innerHTML = "✗ " + msg;
  }

  const topicsData = [
    {
      id: "1",
      title: "Fundamentals & Intuition",
      icon: "📖",
      content: `<p>A <strong>Sparse Table</strong> is a data structure that answers static range queries efficiently. "Static" means the array elements do not change after the table is built (no updates are allowed).</p>
                <div class="api-concept-card">
                  <h4>Why use a Sparse Table?</h4>
                  <p>For operations like <strong>Minimum</strong>, <strong>Maximum</strong>, or <strong>GCD</strong>, a Sparse Table can answer queries in an incredible <strong>O(1) time</strong> after an O(N log N) preprocessing step.</p>
                </div>
                <p>The intuition relies on the fact that any integer can be represented as a sum of powers of 2. A Sparse Table stores the answers for all intervals of length 2<sup>k</sup>. Since any range can be covered by at most two overlapping power-of-2 intervals, we can answer queries instantly.</p>
                <div class="api-callout">
                  <span class="api-callout-icon">💡</span>
                  <p>Overlapping intervals do not affect the result for <strong>idempotent operations</strong>. For example, <code>min(A, B, C)</code> is the same as <code>min(min(A, B), min(B, C))</code>.</p>
                </div>`,
      challenge: {
        title: "Idempotent Operations Classifier",
        instruction: "Which of the following operations are idempotent and therefore strictly suitable for O(1) Sparse Table queries?",
        html: `
          <div class="match-container">
            <div class="match-item-row" style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <div class="match-question">
                <strong>1. Minimum (Min)</strong>
              </div>
              <div class="match-select-wrapper">
                <select id="q1" class="api-select" style="padding: 0.5rem; border-radius: 6px; background: var(--dark-surface); color: var(--text-primary); border: 1px solid var(--glass-border);">
                  <option value="">Select...</option>
                  <option value="yes">Idempotent (O(1) suitable)</option>
                  <option value="no">Not Idempotent</option>
                </select>
              </div>
            </div>
            <div class="match-item-row" style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <div class="match-question">
                <strong>2. Sum (+)</strong>
              </div>
              <div class="match-select-wrapper">
                <select id="q2" class="api-select" style="padding: 0.5rem; border-radius: 6px; background: var(--dark-surface); color: var(--text-primary); border: 1px solid var(--glass-border);">
                  <option value="">Select...</option>
                  <option value="yes">Idempotent (O(1) suitable)</option>
                  <option value="no">Not Idempotent</option>
                </select>
              </div>
            </div>
            <div class="match-item-row" style="display: flex; justify-content: space-between; align-items: center;">
              <div class="match-question">
                <strong>3. Greatest Common Divisor (GCD)</strong>
              </div>
              <div class="match-select-wrapper">
                <select id="q3" class="api-select" style="padding: 0.5rem; border-radius: 6px; background: var(--dark-surface); color: var(--text-primary); border: 1px solid var(--glass-border);">
                  <option value="">Select...</option>
                  <option value="yes">Idempotent (O(1) suitable)</option>
                  <option value="no">Not Idempotent</option>
                </select>
              </div>
            </div>
          </div>
        `
      }
    },
    {
      id: "2",
      title: "Logarithm Preprocessing",
      icon: "⚡",
      content: `<p>To achieve O(1) query time, we need to know the largest power of 2 that fits inside a query range of length L. We do this by computing the base-2 logarithm of all numbers up to N beforehand.</p>
                <div class="api-concept-card">
                  <h4>Precomputing Log Values</h4>
                  <pre style="background:#1e1e1e; padding:1rem; border-radius:8px;"><code class="language-cpp" style="color:#d4d4d4;">int log_val[MAXN + 1];
log_val[1] = 0;
for (int i = 2; i <= MAXN; i++) {
    log_val[i] = log_val[i / 2] + 1;
}</code></pre>
                </div>`,
      challenge: {
        title: "Log Array Builder",
        instruction: "Complete the `log_val` array for lengths 1 through 8. Remember that `log_val[i] = floor(log2(i))`.",
        html: `
          <div class="challenge-grid" style="display:flex; flex-wrap:wrap; gap: 10px; align-items:center;">
            <div style="background:var(--dark-surface); padding:10px; border-radius:8px;"><code>log_val[1] = </code><input type="number" id="l1" style="width:50px; padding:4px;" class="api-input"></div>
            <div style="background:var(--dark-surface); padding:10px; border-radius:8px;"><code>log_val[2] = </code><input type="number" id="l2" style="width:50px; padding:4px;" class="api-input"></div>
            <div style="background:var(--dark-surface); padding:10px; border-radius:8px;"><code>log_val[3] = </code><input type="number" id="l3" style="width:50px; padding:4px;" class="api-input"></div>
            <div style="background:var(--dark-surface); padding:10px; border-radius:8px;"><code>log_val[4] = </code><input type="number" id="l4" style="width:50px; padding:4px;" class="api-input"></div>
            <div style="background:var(--dark-surface); padding:10px; border-radius:8px;"><code>log_val[5] = </code><input type="number" id="l5" style="width:50px; padding:4px;" class="api-input"></div>
            <div style="background:var(--dark-surface); padding:10px; border-radius:8px;"><code>log_val[6] = </code><input type="number" id="l6" style="width:50px; padding:4px;" class="api-input"></div>
            <div style="background:var(--dark-surface); padding:10px; border-radius:8px;"><code>log_val[7] = </code><input type="number" id="l7" style="width:50px; padding:4px;" class="api-input"></div>
            <div style="background:var(--dark-surface); padding:10px; border-radius:8px;"><code>log_val[8] = </code><input type="number" id="l8" style="width:50px; padding:4px;" class="api-input"></div>
          </div>
        `
      }
    },
    {
      id: "3",
      title: "Construction Process",
      icon: "🏗️",
      content: `<p>Let <code>st[i][j]</code> store the answer (e.g., minimum) for the range starting at index <code>i</code> of length <code>2<sup>j</sup></code>. The range is <code>[i, i + 2<sup>j</sup> - 1]</code>.</p>
                <div class="api-concept-card">
                  <h4>Dynamic Programming Transition</h4>
                  <p>We can compute this dynamically by combining two intervals of length <code>2<sup>j-1</sup></code>:
                  <br><code style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;">st[i][j] = min(st[i][j-1], st[i + 2<sup>j-1</sup>][j-1])</code></p>
                </div>`,
      challenge: {
        title: "Code Completion: Building the Table",
        instruction: "Select the correct transition variables to build the table correctly.",
        html: `
          <div class="api-terminal" style="font-size: 0.9rem; line-height: 1.6; padding: 15px; background:#1e1e1e; color:#d4d4d4; border-radius:8px;">
            <div>
              <span style="color:#c586c0;">for</span> (<span style="color:#569cd6;">int</span> j = 1; j < K; j++) {
              <br>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#c586c0;">for</span> (<span style="color:#569cd6;">int</span> i = 0; i + (1 << j) <= N; i++) {
              <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;st[i][j] = min(st[i][
              <select id="c1" class="api-select" style="display:inline-block; width:100px; padding:2px; height:auto; font-size:0.8rem; margin-bottom:0; color:#fff; background:#333; border:1px solid #555;">
                <option value="">...</option>
                <option value="j">j</option>
                <option value="j-1">j-1</option>
                <option value="j+1">j+1</option>
              </select>
              ], st[
              <select id="c2" class="api-select" style="display:inline-block; width:150px; padding:2px; height:auto; font-size:0.8rem; margin-bottom:0; color:#fff; background:#333; border:1px solid #555;">
                <option value="">...</option>
                <option value="i + (1 << (j-1))">i + (1 << (j-1))</option>
                <option value="i + (1 << j)">i + (1 << j)</option>
                <option value="i + j">i + j</option>
              </select>
              ][j-1]);
              <br>&nbsp;&nbsp;&nbsp;&nbsp;}
              <br>}
            </div>
          </div>
        `
      }
    },
    {
      id: "4",
      title: "Range Minimum Query",
      icon: "🎯",
      content: `<p>To find the minimum in range <code>[L, R]</code>, we calculate the length <code>length = R - L + 1</code>. Then, we find the largest power of 2 that fits in this length: <code>j = log2(length)</code>.</p>
                <div class="api-concept-card">
                  <h4>The Query Formula</h4>
                  <p><code style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;">min_val = min(st[L][j], st[R - (1 << j) + 1][j])</code></p>
                  <p>This covers the entire range using two overlapping segments of length <code>2<sup>j</sup></code>.</p>
                </div>`,
      challenge: {
        title: "RMQ Overlap Calculator",
        instruction: "Calculate the exact overlapping query boundaries for a query `[L=2, R=10]`.",
        html: `
          <div class="challenge-grid" style="display:flex; flex-direction:column; gap:15px;">
            <div>
              <label class="api-label" style="display:block; margin-bottom:5px;">1. What is the length of the range [2, 10]?</label>
              <input type="number" id="rmqLen" class="api-input" style="padding:0.5rem; border-radius:6px; background:var(--dark-surface); border:1px solid var(--glass-border); color:white;">
            </div>
            <div>
              <label class="api-label" style="display:block; margin-bottom:5px;">2. What is the value of 'j' (largest power of 2 exponent)?</label>
              <input type="number" id="rmqJ" class="api-input" style="padding:0.5rem; border-radius:6px; background:var(--dark-surface); border:1px solid var(--glass-border); color:white;">
            </div>
            <div>
              <label class="api-label" style="display:block; margin-bottom:5px;">3. What is the starting index of the second segment? (Formula: <code>R - (1 &lt;&lt; j) + 1</code>)</label>
              <input type="number" id="rmqStart2" class="api-input" style="padding:0.5rem; border-radius:6px; background:var(--dark-surface); border:1px solid var(--glass-border); color:white;">
            </div>
          </div>
        `
      }
    },
    {
      id: "5",
      title: "Complexity Analysis",
      icon: "⏳",
      content: `<p>Sparse Table trades initial setup time and memory for lightning-fast queries.</p>
                <ul style="line-height: 1.8;">
                  <li><strong>Build Time:</strong> O(N log N) - we compute log N arrays of size N.</li>
                  <li><strong>Query Time:</strong> O(1) - just looking up two values and finding their minimum.</li>
                  <li><strong>Space Complexity:</strong> O(N log N) - for storing the <code>st</code> table.</li>
                </ul>`,
      challenge: {
        title: "Complexity Validation",
        instruction: "Match the complexities correctly for a Sparse Table performing RMQ.",
        html: `
          <div class="match-container">
            <div class="match-item-row" style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">
              <div class="match-question">
                <strong>1. Space Complexity</strong>
              </div>
              <div class="match-select-wrapper">
                <select id="comp1" class="api-select" style="padding:0.5rem; border-radius:6px; background:var(--dark-surface); color:var(--text-primary); border:1px solid var(--glass-border);">
                  <option value="">Select...</option>
                  <option value="O(N)">O(N)</option>
                  <option value="O(N log N)">O(N log N)</option>
                  <option value="O(1)">O(1)</option>
                </select>
              </div>
            </div>
            <div class="match-item-row" style="display:flex; justify-content:space-between; align-items:center;">
              <div class="match-question">
                <strong>2. Query Time</strong>
              </div>
              <div class="match-select-wrapper">
                <select id="comp2" class="api-select" style="padding:0.5rem; border-radius:6px; background:var(--dark-surface); color:var(--text-primary); border:1px solid var(--glass-border);">
                  <option value="">Select...</option>
                  <option value="O(log N)">O(log N)</option>
                  <option value="O(1)">O(1)</option>
                  <option value="O(N)">O(N)</option>
                </select>
              </div>
            </div>
          </div>
        `
      }
    }
  ];

  const mainContent = document.getElementById('mainContent');
  const progressFill = document.getElementById('progressFill');
  const progressPercent = document.getElementById('progressPercent');
  const progressCount = document.getElementById('progressCount');
  const topicNavList = document.getElementById('topicNav');

  function updateGlobalProgress() {
    const total = topicsData.length;
    const completed = completedTopics.length;
    const percentage = Math.round((completed / total) * 100);

    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressPercent) progressPercent.textContent = `${percentage}%`;
    if (progressCount) progressCount.textContent = completed;

    // Trigger sidebar complete ticks update
    document.querySelectorAll('.sparse-table-sidebar-nav a').forEach(link => {
      const id = link.getAttribute('data-topic-id');
      if (id !== 'hub' && completedTopics.includes(id)) {
        link.classList.add('completed-nav-item');
        // Add checkmark if it doesn't have one
        if(!link.innerHTML.includes('✓')) {
           link.innerHTML += ' <span style="margin-left:auto; color:#4CAF50;">✓</span>';
        }
      }
    });
  }

  function updateActiveNav(id) {
    document.querySelectorAll('.sparse-table-sidebar-nav a').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-topic-id') === id) {
        link.classList.add('active');
      }
    });
  }

  function renderHub() {
    let html = `<div class="sparse-table-lesson-header" style="margin-bottom: 2rem;">
                  <h3 style="font-size: 1.8rem; color: var(--primary-light);">Sparse Table Learning Hub</h3>
                </div>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">Select a topic below to begin learning. You must complete the interactive challenge in each section to mark it as completed!</p>
                <div class="api-hub-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">`;
    
    topicsData.forEach(topic => {
      const isCompleted = completedTopics.includes(topic.id);
      html += `
        <div class="api-hub-card ${isCompleted ? 'completed' : ''}" data-id="${topic.id}" style="background: var(--glass-bg); border: 1px solid ${isCompleted ? '#4CAF50' : 'var(--glass-border)'}; border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all 0.3s ease; position: relative;">
          ${isCompleted ? '<div style="position:absolute; top:10px; right:10px; color:#4CAF50;"><i class="fas fa-check-circle"></i></div>' : ''}
          <div class="api-hub-card-icon" style="font-size: 2.5rem; margin-bottom: 1rem;">${topic.icon}</div>
          <div class="api-hub-card-title" style="font-weight: 600; color: var(--text-primary); font-size: 1.1rem;">${topic.title}</div>
        </div>
      `;
    });
    html += `</div>`;
    
    mainContent.innerHTML = html;

    document.querySelectorAll('.api-hub-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        renderTopic(id);
      });
      card.addEventListener('mouseover', () => {
        card.style.borderColor = 'var(--primary)';
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
      });
      card.addEventListener('mouseout', () => {
        const isCompleted = completedTopics.includes(card.getAttribute('data-id'));
        card.style.borderColor = isCompleted ? '#4CAF50' : 'var(--glass-border)';
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
      });
    });

    updateActiveNav('hub');
  }

  function renderTopic(id) {
    const topic = topicsData.find(t => t.id === id);
    if (!topic) return;

    const isCompleted = completedTopics.includes(id);

    let html = `
      <article class="sparse-table-lesson" style="background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 16px; padding: 2.5rem; backdrop-filter: blur(10px); animation: fadeIn 0.5s ease;">
        <div class="sparse-table-lesson-header" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--glass-border);">
          <span class="sparse-table-lesson-number" style="font-family: Orbitron; font-size: 1.8rem; font-weight: 700; background: var(--gradient-1); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${id.padStart(2, '0')}</span>
          <h3 style="font-size: 1.6rem; font-weight: 700; margin: 0; color: var(--text-primary);">${topic.title}</h3>
        </div>
        
        <div style="font-size: 1.05rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: 2rem;">
          ${topic.content}
        </div>

        <div class="quiz-container" style="background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); border-radius: 12px; padding: 1.8rem; margin-top: 2rem; box-shadow: inset 0 2px 10px rgba(0,0,0,0.1);">
          <h4 style="margin-top: 0; margin-bottom:1rem; color:var(--primary-light); font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-laptop-code"></i> Interactive Workspace</h4>
          <p style="font-size:0.95rem; margin-bottom:1.5rem; color:var(--text-secondary); padding-left: 0.5rem; border-left: 3px solid var(--primary);">
            ${topic.challenge.instruction}
          </p>
          <div id="challengeWorkspace">
            ${topic.challenge.html}
          </div>
          
          <div id="feedbackContainer" style="margin-top: 20px; display:none; padding:15px; border-radius:8px; font-size:0.9rem; line-height:1.5;"></div>

          <div style="display:flex; gap:15px; margin-top:25px;">
            <button id="checkBtn" class="btn btn-secondary" style="flex:1; padding: 0.8rem; font-weight: 600;">Run Checks</button>
            <button id="completeBtn" class="btn btn-primary complete-topic-btn" disabled style="flex:1.5; padding: 0.8rem; font-weight: 600;">Mark as Completed</button>
          </div>
        </div>
      </article>
    `;

    mainContent.innerHTML = html;
    
    // Smooth scroll to top of content
    const layoutEl = document.querySelector('.sparse-table-layout');
    if (layoutEl) {
       const yOffset = -100; 
       const y = layoutEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
       window.scrollTo({top: y, behavior: 'smooth'});
    } else {
       window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateActiveNav(id);

    const completeBtn = document.getElementById('completeBtn');
    const checkBtn = document.getElementById('checkBtn');
    const feedback = document.getElementById('feedbackContainer');

    if (isCompleted) {
      completeBtn.textContent = "Topic Completed - Return to Hub";
      completeBtn.disabled = false;
      completeBtn.classList.replace('btn-primary', 'btn-secondary');
      checkBtn.style.display = 'none';
      
      showSuccess(feedback, completeBtn, "You have successfully completed this interactive workspace challenge!");
    }

    setupChallengeListeners(id, checkBtn, completeBtn, feedback);

    completeBtn.addEventListener('click', () => {
      if (!isCompleted) {
        completedTopics.push(id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTopics));
        updateGlobalProgress();
      }
      renderHub();
    });
  }

  function setupChallengeListeners(topicId, checkBtn, completeBtn, feedback) {
    if (topicId === "1") {
      checkBtn.addEventListener('click', () => {
        const q1 = document.getElementById('q1').value;
        const q2 = document.getElementById('q2').value;
        const q3 = document.getElementById('q3').value;

        if (q1 === 'yes' && q2 === 'no' && q3 === 'yes') {
          showSuccess(feedback, completeBtn, "Correct! Minimum and GCD are idempotent operations. Sum is not, because taking the sum of overlapping intervals would double-count the overlapping elements!");
        } else {
          showError(feedback, "Incorrect. Remember, an operation is idempotent if applying it multiple times does not change the result beyond the initial application. (e.g. min(A, A) = A).");
        }
      });
    } else if (topicId === "2") {
      checkBtn.addEventListener('click', () => {
        const expected = [0, 1, 1, 2, 2, 2, 2, 3];
        let ok = true;
        for (let i = 1; i <= 8; i++) {
          const val = parseInt(document.getElementById('l' + i).value);
          if (val !== expected[i - 1]) ok = false;
        }
        if (ok) {
          showSuccess(feedback, completeBtn, "Correct! The log array correctly maps length to the highest power of 2 exponent.");
        } else {
          showError(feedback, "Incorrect. Remember log_val[i] = floor(log2(i)). e.g., log2(5) is 2.something, so floor is 2.");
        }
      });
    } else if (topicId === "3") {
      checkBtn.addEventListener('click', () => {
        const c1 = document.getElementById('c1').value;
        const c2 = document.getElementById('c2').value;

        if (c1 === 'j-1' && c2 === 'i + (1 << (j-1))') {
          showSuccess(feedback, completeBtn, "Correct! We combine the interval starting at `i` of length 2^(j-1) and the interval starting at `i + 2^(j-1)` of length 2^(j-1).");
        } else {
          showError(feedback, "Incorrect. Look at the transition formula closely. We are combining two segments of length 2^(j-1).");
        }
      });
    } else if (topicId === "4") {
      checkBtn.addEventListener('click', () => {
        const l = parseInt(document.getElementById('rmqLen').value);
        const j = parseInt(document.getElementById('rmqJ').value);
        const s2 = parseInt(document.getElementById('rmqStart2').value);

        if (l === 9 && j === 3 && s2 === 3) {
          showSuccess(feedback, completeBtn, "Correct! The length is 10 - 2 + 1 = 9. The max power of 2 is 2^3 = 8, so j=3. The second segment starts at R - 8 + 1 = 10 - 8 + 1 = 3.");
        } else {
          showError(feedback, "Incorrect. For length, use R - L + 1. For j, use floor(log2(length)). For the start index of the second segment, use the given formula.");
        }
      });
    } else if (topicId === "5") {
      checkBtn.addEventListener('click', () => {
        const c1 = document.getElementById('comp1').value;
        const c2 = document.getElementById('comp2').value;

        if (c1 === 'O(N log N)' && c2 === 'O(1)') {
          showSuccess(feedback, completeBtn, "Correct! Space complexity is O(N log N) to store the table, and query time is O(1).");
        } else {
          showError(feedback, "Incorrect. Sparse table has a large memory footprint but extremely fast query time.");
        }
      });
    }
  }

  // Set up sidebar clicks
  document.querySelectorAll('.sparse-table-sidebar-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('data-topic-id');
      if (id === 'hub') {
        renderHub();
      } else {
        renderTopic(id);
      }
    });
  });

  // Hero section animations and init
  function initHeroTyping() {
    const el = document.getElementById("typingTextSparseTable");
    if (!el) return;
    const words = ["Range Minimum Query", "Static Array", "O(1) Retrieval", "Log Preprocessing", "Idempotent Operations"];
    let wordIdx = 0; let charIdx = 0; let isDeleting = false;
    function tick() {
      const current = words[wordIdx];
      if (isDeleting) {
        el.textContent = current.substring(0, charIdx - 1);
        charIdx--;
      } else {
        el.textContent = current.substring(0, charIdx + 1);
        charIdx++;
      }
      let speed = isDeleting ? 50 : 100;
      if (!isDeleting && charIdx === current.length) {
        speed = 2000; isDeleting = true;
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false; wordIdx = (wordIdx + 1) % words.length; speed = 500;
      }
      requestAnimationFrame(() => setTimeout(tick, speed));
    }
    tick();
  }

  function initStatsAnimation() {
    const statNumbers = document.querySelectorAll(".stat-number[data-target]");
    if (!statNumbers.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (typeof animateValue === "function") {
            animateValue(entry.target);
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    statNumbers.forEach((s) => observer.observe(s));
  }

  initHeroTyping();
  initStatsAnimation();
  updateGlobalProgress();
  renderHub(); // initial view
});
