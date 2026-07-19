/**
 * Brute → Optimal Diff Studio
 * Side-by-side storytelling diffs with annotated optimization moves.
 */
(() => {
  'use strict';

  const STORIES = [
    {
      id: 'two-sum',
      title: 'Two Sum',
      difficulty: 'Easy',
      tags: ['Array', 'Hash Map'],
      desc: 'Return indices of two numbers that add up to target. Exactly one solution exists.',
      steps: [
        {
          move: 'nested loops → HashMap lookup',
          why: 'Instead of scanning every pair, remember what you have already seen and check the complement in O(1).',
          before: {
            label: 'Brute',
            time: 'O(n²)',
            space: 'O(1)',
            code: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
}`,
          },
          after: {
            label: 'Optimal',
            time: 'O(n)',
            space: 'O(n)',
            code: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
}`,
          },
          insight:
            'Trade a little space for a huge time win. Interview gold: one pass + HashMap.',
          takeaways: [
            'Ask: can I store past work to avoid re-scanning?',
            'Complement pattern: need = target − nums[i]',
            'State time/space tradeoff out loud in interviews',
          ],
        },
      ],
    },
    {
      id: 'two-sum-sorted',
      title: 'Two Sum II (Sorted)',
      difficulty: 'Medium',
      tags: ['Two Pointers', 'Array'],
      desc: 'Sorted array (1-indexed). Find two numbers that sum to target using constant extra space.',
      steps: [
        {
          move: 'unsorted mindset → exploit sorted order',
          why: 'Once sorted, you no longer need nested scans or a hash map — direction of the sum guides the pointers.',
          before: {
            label: 'Brute',
            time: 'O(n²)',
            space: 'O(1)',
            code: `function twoSumSorted(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i + 1, j + 1];
      }
    }
  }
}`,
          },
          after: {
            label: 'Better',
            time: 'O(n)',
            space: 'O(1)',
            code: `function twoSumSorted(nums, target) {
  // Still not using the sorted property fully
  // (shown as intermediate thinking)
  const need = new Map();
  for (let i = 0; i < nums.length; i++) {
    if (need.has(nums[i])) return [need.get(nums[i]), i + 1];
    need.set(target - nums[i], i + 1);
  }
}`,
          },
          insight: 'HashMap works, but wastes the sorted guarantee and uses O(n) space.',
          takeaways: [
            'Read constraints: sorted is a gift',
            'HashMap is not always the best “O(n)” answer',
          ],
        },
        {
          move: 'sorted → two pointers',
          why: 'Start at both ends. If sum is too small, move left up; if too big, move right down. One pass, O(1) space.',
          before: {
            label: 'HashMap',
            time: 'O(n)',
            space: 'O(n)',
            code: `function twoSumSorted(nums, target) {
  const need = new Map();
  for (let i = 0; i < nums.length; i++) {
    if (need.has(nums[i])) return [need.get(nums[i]), i + 1];
    need.set(target - nums[i], i + 1);
  }
}`,
          },
          after: {
            label: 'Optimal',
            time: 'O(n)',
            space: 'O(1)',
            code: `function twoSumSorted(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const sum = nums[lo] + nums[hi];
    if (sum === target) return [lo + 1, hi + 1];
    if (sum < target) lo++;
    else hi--;
  }
}`,
          },
          insight: 'Classic interview move: sorted data + two pointers beats HashMap on space.',
          takeaways: [
            'Pattern phrase: “sorted → two pointers”',
            'Prove progress: each step shrinks the window',
            'Prefer O(1) space when constraints allow',
          ],
        },
      ],
    },
    {
      id: 'max-subarray',
      title: 'Maximum Subarray',
      difficulty: 'Medium',
      tags: ['DP', 'Kadane'],
      desc: 'Find the contiguous subarray with the largest sum.',
      steps: [
        {
          move: 'all subarrays → running local max',
          why: 'You do not need every [i..j]. At each index, decide: extend the previous sum or start fresh.',
          before: {
            label: 'Brute',
            time: 'O(n²)',
            space: 'O(1)',
            code: `function maxSubArray(nums) {
  let best = -Infinity;
  for (let i = 0; i < nums.length; i++) {
    let sum = 0;
    for (let j = i; j < nums.length; j++) {
      sum += nums[j];
      best = Math.max(best, sum);
    }
  }
  return best;
}`,
          },
          after: {
            label: 'Optimal (Kadane)',
            time: 'O(n)',
            space: 'O(1)',
            code: `function maxSubArray(nums) {
  let best = nums[0];
  let cur = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  return best;
}`,
          },
          insight: 'Kadane’s algorithm is DP in disguise: optimal substructure at each index.',
          takeaways: [
            'Ask: can the answer end at index i?',
            'Reset when the running sum turns harmful',
            'Name the pattern: Kadane / local vs global max',
          ],
        },
      ],
    },
    {
      id: 'anagram',
      title: 'Valid Anagram',
      difficulty: 'Easy',
      tags: ['String', 'Counting'],
      desc: 'Return true if t is an anagram of s.',
      steps: [
        {
          move: 'sort both → count frequency',
          why: 'Sorting works but is O(n log n). Character counts prove equality in linear time.',
          before: {
            label: 'Brute / Sort',
            time: 'O(n log n)',
            space: 'O(n)',
            code: `function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  return [...s].sort().join('') === [...t].sort().join('');
}`,
          },
          after: {
            label: 'Optimal',
            time: 'O(n)',
            space: 'O(1)*',
            code: `function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const freq = Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    freq[s.charCodeAt(i) - 97]++;
    freq[t.charCodeAt(i) - 97]--;
  }
  return freq.every((c) => c === 0);
}
// *O(1) if alphabet is fixed (e.g. 26 letters)`,
          },
          insight: 'Fixed alphabets unlock O(1) extra space counting arrays.',
          takeaways: [
            'Sorting is a valid first answer — then optimize',
            'Counting beats sorting for equality checks',
            'Clarify alphabet size in interviews',
          ],
        },
      ],
    },
    {
      id: 'contains-dup',
      title: 'Contains Duplicate',
      difficulty: 'Easy',
      tags: ['Set', 'Hashing'],
      desc: 'Return true if any value appears at least twice.',
      steps: [
        {
          move: 'nested compare → Set membership',
          why: 'Checking every pair is O(n²). A Set answers “have I seen this?” in expected O(1).',
          before: {
            label: 'Brute',
            time: 'O(n²)',
            space: 'O(1)',
            code: `function containsDuplicate(nums) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] === nums[j]) return true;
    }
  }
  return false;
}`,
          },
          after: {
            label: 'Optimal',
            time: 'O(n)',
            space: 'O(n)',
            code: `function containsDuplicate(nums) {
  const seen = new Set();
  for (const x of nums) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}`,
          },
          insight: 'Membership queries scream HashSet. Mention sorting O(n log n) as a middle ground.',
          takeaways: [
            'Duplicate detection ≈ Set insertion',
            'Early exit as soon as a collision appears',
            'Space tradeoff is usually acceptable',
          ],
        },
      ],
    },
    {
      id: 'move-zeroes',
      title: 'Move Zeroes',
      difficulty: 'Easy',
      tags: ['Two Pointers', 'In-place'],
      desc: 'Move all zeroes to the end while keeping the relative order of non-zero elements.',
      steps: [
        {
          move: 'extra array → write pointer',
          why: 'Collecting non-zeroes into a new array wastes space. Keep a write index and overwrite in place.',
          before: {
            label: 'Brute',
            time: 'O(n)',
            space: 'O(n)',
            code: `function moveZeroes(nums) {
  const nonZero = nums.filter((x) => x !== 0);
  const zeros = nums.length - nonZero.length;
  for (let i = 0; i < nonZero.length; i++) nums[i] = nonZero[i];
  for (let i = 0; i < zeros; i++) nums[nonZero.length + i] = 0;
}`,
          },
          after: {
            label: 'Optimal',
            time: 'O(n)',
            space: 'O(1)',
            code: `function moveZeroes(nums) {
  let write = 0;
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) {
      [nums[write], nums[read]] = [nums[read], nums[write]];
      write++;
    }
  }
}`,
          },
          insight: 'Read/write two pointers turn “filter + pad” into a single in-place pass.',
          takeaways: [
            'In-place often means a slow write pointer',
            'Preserve relative order carefully',
            'Same time, better space — say it in the interview',
          ],
        },
      ],
    },
  ];

  const els = {
    tabs: document.getElementById('btoStoryTabs'),
    title: document.getElementById('btoProblemTitle'),
    desc: document.getElementById('btoProblemDesc'),
    tags: document.getElementById('btoProblemTags'),
    timeline: document.getElementById('btoTimeline'),
    counter: document.getElementById('btoStepCounter'),
    prev: document.getElementById('btoPrev'),
    next: document.getElementById('btoNext'),
    moveLabel: document.getElementById('btoMoveLabel'),
    moveWhy: document.getElementById('btoMoveWhy'),
    beforeComp: document.getElementById('btoBeforeComp'),
    afterComp: document.getElementById('btoAfterComp'),
    leftCode: document.getElementById('btoLeftCode'),
    rightCode: document.getElementById('btoRightCode'),
    leftBadge: document.getElementById('btoLeftBadge'),
    rightBadge: document.getElementById('btoRightBadge'),
    insight: document.getElementById('btoInsight'),
    takeaways: document.getElementById('btoTakeaways'),
  };

  let storyIndex = 0;
  let stepIndex = 0;

  function currentStory() {
    return STORIES[storyIndex];
  }

  function currentStep() {
    return currentStory().steps[stepIndex];
  }

  function renderTabs() {
    els.tabs.replaceChildren(
      ...STORIES.map((story, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `bto-story-tab${i === storyIndex ? ' active' : ''}`;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', String(i === storyIndex));
        btn.textContent = story.title;
        btn.addEventListener('click', () => {
          storyIndex = i;
          stepIndex = 0;
          renderAll();
        });
        return btn;
      })
    );
  }

  function renderProblemMeta() {
    const story = currentStory();
    els.title.textContent = story.title;
    els.desc.textContent = story.desc;
    const diffTag = document.createElement('span');
    diffTag.className = 'bto-tag bto-diff-tag';
    diffTag.textContent = story.difficulty;
    const topicTags = story.tags.map((tag) => {
      const el = document.createElement('span');
      el.className = 'bto-tag';
      el.textContent = tag;
      return el;
    });
    els.tags.replaceChildren(diffTag, ...topicTags);
  }

  function renderTimeline() {
    const story = currentStory();
    els.timeline.replaceChildren(
      ...story.steps.map((step, i) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `bto-step${i === stepIndex ? ' active' : ''}`;
        btn.setAttribute('aria-current', i === stepIndex ? 'step' : 'false');
        btn.innerHTML = `
          <span class="bto-step-num">Step ${i + 1}</span>
          <span class="bto-step-label">${escapeHtml(step.move)}</span>
        `;
        btn.addEventListener('click', () => {
          stepIndex = i;
          renderStep();
        });
        li.appendChild(btn);
        return li;
      })
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderStep() {
    const story = currentStory();
    const step = currentStep();
    const total = story.steps.length;

    els.counter.textContent = `Step ${stepIndex + 1} of ${total}`;
    els.prev.disabled = stepIndex === 0;
    els.next.disabled = stepIndex === total - 1;

    els.moveLabel.textContent = step.move;
    els.moveWhy.textContent = step.why;
    els.beforeComp.textContent = `${step.before.time} · ${step.before.space}`;
    els.afterComp.textContent = `${step.after.time} · ${step.after.space}`;

    els.leftBadge.textContent = step.before.time;
    els.rightBadge.textContent = step.after.time;
    els.leftBadge.classList.toggle('good', false);
    els.rightBadge.classList.add('good');

    els.leftCode.textContent = step.before.code;
    els.rightCode.textContent = step.after.code;

    els.insight.textContent = step.insight;
    els.takeaways.replaceChildren(
      ...step.takeaways.map((t) => {
        const li = document.createElement('li');
        li.textContent = t;
        return li;
      })
    );

    // Sync timeline active state without full rebuild when only step changes
    els.timeline.querySelectorAll('.bto-step').forEach((btn, i) => {
      btn.classList.toggle('active', i === stepIndex);
      btn.setAttribute('aria-current', i === stepIndex ? 'step' : 'false');
    });
  }

  function renderAll() {
    renderTabs();
    renderProblemMeta();
    renderTimeline();
    renderStep();
  }

  els.prev.addEventListener('click', () => {
    if (stepIndex > 0) {
      stepIndex -= 1;
      renderStep();
    }
  });

  els.next.addEventListener('click', () => {
    if (stepIndex < currentStory().steps.length - 1) {
      stepIndex += 1;
      renderStep();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    if (e.key === 'ArrowLeft') {
      els.prev.click();
    } else if (e.key === 'ArrowRight') {
      els.next.click();
    }
  });

  const scrollBtn = document.getElementById('scrollTopBtn');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('visible', window.scrollY > 400);
    });
    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  renderAll();
})();
