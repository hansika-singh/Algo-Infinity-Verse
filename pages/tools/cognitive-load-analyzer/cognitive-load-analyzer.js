// Cognitive Load Analyzer JavaScript
// Tracks time per line, confusion zones (long pauses), and rewrite frequency.

(() => {
  const editor = document.getElementById('claCodeEditor');
  const lineNumbers = document.getElementById('claLineNumbers');
  const startBtn = document.getElementById('claStartBtn');
  const resetBtn = document.getElementById('claResetBtn');
  const generateBtn = document.getElementById('claGenerateBtn');
  const copyBtn = document.getElementById('claCopyBtn');
  const insightsContainer = document.getElementById('claInsightsContainer');
  const totalLinesSpan = document.getElementById('claTotalLines');
  const confusionSpan = document.getElementById('claConfusionCount');
  const rewriteSpan = document.getElementById('claRewriteCount');
  const lineCountSpan = document.getElementById('claLineCount');
  const languageSelect = document.getElementById('claLanguageSelect');

  // State tracking
  let tracking = false;
  let lastTimestamp = null;
  let prevContentLines = [];
  const lineStats = {}; // {lineNumber: {time: ms, rewrites: count, edits: count}}

  const CONFUSION_THRESHOLD = 5000; // ms of accumulated time considered confusion
  const MAX_STEP_TIME = 10000; // cap single step elapsed time at 10s to ignore long idle times

  const CODE_TEMPLATES = {
    python: `def find_target(arr, target):
    # Find index of target in sorted array using binary search
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
`,
    javascript: `function reverseLinkedList(head) {
    // Reverse a singly linked list in-place
    let prev = null;
    let curr = head;
    while (curr !== null) {
        let nextTemp = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
}
`,
    cpp: `#include <iostream>
using namespace std;

struct Node {
    int val;
    Node* next;
};

// Remove elements matching val from linked list and deallocate memory
Node* removeElements(Node* head, int val) {
    Node* dummy = new Node();
    dummy->next = head;
    Node* curr = dummy;
    while (curr->next != nullptr) {
        if (curr->next->val == val) {
            Node* temp = curr->next;
            curr->next = curr->next->next;
            delete temp;
        } else {
            curr = curr->next;
        }
    }
    Node* result = dummy->next;
    delete dummy;
    return result;
}
`,
    java: `public class Solution {
    // Find contiguous subarray with the largest sum
    public int maxSubArray(int[] nums) {
        int maxSoFar = nums[0];
        int currMax = nums[0];
        for (int i = 1; i < nums.length; i++) {
            currMax = Math.max(nums[i], currMax + nums[i]);
            maxSoFar = Math.max(maxSoFar, currMax);
        }
        return maxSoFar;
    }
}
`
  };

  function resetState() {
    tracking = false;
    lastTimestamp = null;
    prevContentLines = [];
    for (const key in lineStats) delete lineStats[key];
    
    // Load template code
    const lang = languageSelect.value;
    editor.value = CODE_TEMPLATES[lang] || '';
    
    editor.disabled = true;
    startBtn.disabled = false;
    resetBtn.disabled = true;
    generateBtn.disabled = true;
    copyBtn.disabled = true;
    totalLinesSpan.textContent = '0';
    confusionSpan.textContent = '0';
    rewriteSpan.textContent = '0';
    
    updateLines();
    insightsContainer.innerHTML = '<p class="cla-placeholder">Run a session and click “Generate Insights” to see feedback.</p>';
  }

  function startSession() {
    editor.disabled = false;
    editor.focus();
    tracking = true;
    lastTimestamp = Date.now();
    prevContentLines = editor.value.split('\n');
    startBtn.disabled = true;
    resetBtn.disabled = false;
    generateBtn.disabled = false;
    copyBtn.disabled = true; // only enable copy after insights are generated
    
    updateLines();
  }

  function handleInput() {
    if (!tracking) return;
    const now = Date.now();
    const elapsed = Math.min(now - lastTimestamp, MAX_STEP_TIME);
    
    const cursorPos = editor.selectionStart;
    const currentLine = (editor.value.slice(0, cursorPos).match(/\n/g) || []).length + 1;

    // Ensure stats object for the line exists
    if (!lineStats[currentLine]) {
      lineStats[currentLine] = {time: 0, rewrites: 0, edits: 0};
    }
    // Accumulate time spent on this line since last event
    lineStats[currentLine].time += elapsed;

    // Detect rewrite: compare current line content with previous snapshot
    const currentLines = editor.value.split('\n');
    const prevLineContent = prevContentLines[currentLine - 1] || '';
    const curLineContent = currentLines[currentLine - 1] || '';
    if (prevLineContent !== curLineContent) {
      lineStats[currentLine].rewrites += 1;
      lineStats[currentLine].edits += 1;
    }
    // Update previous snapshot for changed lines
    prevContentLines = currentLines;

    // Update UI stats & line numbers
    updateStatsUI();
    updateLines();
    lastTimestamp = now;
  }

  function updateLines() {
    const text = editor.value;
    const lines = text.split('\n');
    const count = lines.length;
    
    // Determine active line of the cursor
    const cursorPos = editor.selectionStart;
    const activeLine = (text.slice(0, cursorPos).match(/\n/g) || []).length + 1;
    
    let html = '';
    for (let i = 1; i <= Math.max(count, 1); i++) {
      if (i === activeLine && tracking) {
        html += `<span class="cla-line-number active">${i}</span>\n`;
      } else {
        html += `<span class="cla-line-number">${i}</span>\n`;
      }
    }
    lineNumbers.innerHTML = html;
    lineCountSpan.textContent = count + (count === 1 ? ' line' : ' lines');
    lineNumbers.scrollTop = editor.scrollTop;
  }

  function updateStatsUI() {
    const linesEdited = Object.keys(lineStats).length;
    const confusionLines = Object.values(lineStats).filter(s => s.time >= CONFUSION_THRESHOLD).length;
    const totalRewrites = Object.values(lineStats).reduce((a, s) => a + s.rewrites, 0);
    totalLinesSpan.textContent = linesEdited;
    confusionSpan.textContent = confusionLines;
    rewriteSpan.textContent = totalRewrites;
  }

  function analyzeLineCategory(lineContent) {
    const text = lineContent.trim();
    if (/\b(new|delete|malloc|free)\b|->|[*&]/.test(text)) {
      return {
        category: 'pointer',
        title: 'Pointer & Memory Logic',
        icon: 'fa-microchip',
        desc: 'You spent significant time editing pointer operations or dynamic memory references on this line. This often indicates cognitive burden related to heap allocation or dereferencing mechanics.',
        tip: 'Verify that pointers are non-null before dereferencing, and draw memory block layouts to visualize reference updates.'
      };
    }
    if (/\b(for|while)\b/.test(text)) {
      return {
        category: 'loop',
        title: 'Loop Control & Bounds',
        icon: 'fa-redo',
        desc: 'This line contains a loop statement and required multiple revisions or long pauses. Loop invariants and exit conditions are frequent sites of cognitive load.',
        tip: 'Verify loop initialization, termination boundaries (off-by-one errors), and check if the loop progress variable is modified correctly.'
      };
    }
    if (/\bif\b.*\breturn\b/.test(text) || /\breturn\s+(-?\d+|null|nullptr|true|false)\b/.test(text)) {
      return {
        category: 'recursion',
        title: 'Recursion & Base Cases',
        icon: 'fa-history',
        desc: 'You spent substantial time here, which matches a recursion base case or return checkpoint. Defining termination conditions correctly is critical for recursive structures.',
        tip: 'Ensure that the recursion always progresses closer to the base case, and that all branch paths return appropriate default values.'
      };
    }
    if (/\[.*\]|\b(size|length|len)\b/.test(text)) {
      return {
        category: 'array',
        title: 'Array Indexing & Bounds',
        icon: 'fa-layer-group',
        desc: 'You made repeated changes to index expressions or array boundary limits. Subscript calculations and boundary offsets can easily trigger out-of-bound faults.',
        tip: 'Double-check extreme values (e.g. index 0 or length-1) and simplify complex pointer-to-index offset operations.'
      };
    }
    if (/\b(if|else|switch)\b|&&|\|\||!/.test(text)) {
      return {
        category: 'conditional',
        title: 'Conditional Branching',
        icon: 'fa-code-branch',
        desc: 'This line contains conditional logic that was frequently modified. Complex Boolean expressions increase mental mapping load.',
        tip: 'Deconstruct compound logic expressions into intermediate variables or utilize guard clauses to flatten nesting.'
      };
    }
    
    return {
      category: 'general',
      title: 'General Expression Logic',
      icon: 'fa-cog',
      desc: 'You spent a high amount of time or made multiple edits on this line. This suggests general implementation load during block restructuring.',
      tip: 'Break down multi-operation expressions into simpler, single-step variables with self-explanatory names.'
    };
  }

  function generateInsights() {
    if (!tracking) return;
    
    // Finalize last line timing
    const now = Date.now();
    const elapsed = Math.min(now - lastTimestamp, MAX_STEP_TIME);
    const cursorPos = editor.selectionStart;
    const currentLine = (editor.value.slice(0, cursorPos).match(/\n/g) || []).length + 1;
    if (!lineStats[currentLine]) {
      lineStats[currentLine] = {time: 0, rewrites: 0, edits: 0};
    }
    lineStats[currentLine].time += elapsed;
    lastTimestamp = now;

    // Generate insights layout
    let insightsHtml = '';

    // Overall summary metrics
    const activeLines = Object.keys(lineStats).map(Number);
    const totalTime = Object.values(lineStats).reduce((a, s) => a + s.time, 0);
    const totalRewrites = Object.values(lineStats).reduce((a, s) => a + s.rewrites, 0);
    const avgTime = activeLines.length > 0 ? (totalTime / activeLines.length / 1000).toFixed(1) : '0';

    insightsHtml += `
      <div class="cla-insight-card" style="border-left: 4px solid var(--primary);">
        <div class="cla-insight-header">
          <div class="cla-insight-title">
            <i class="fas fa-chart-line"></i>
            <span>Session Summary Report</span>
          </div>
          <span class="cla-insight-badge" style="background: rgba(124, 58, 237, 0.15); color: var(--primary-light); border: 1px solid rgba(124, 58, 237, 0.3);">Metrics</span>
        </div>
        <div class="cla-insight-desc">
          Your session lasted <strong>${(totalTime / 1000).toFixed(1)}s</strong>. 
          You edited <strong>${activeLines.length}</strong> unique line(s) with an average of <strong>${avgTime}s</strong> per line and recorded <strong>${totalRewrites}</strong> rewrite events.
        </div>
      </div>
    `;

    // Filter lines that exceed thresholds: spent >= 5000ms or rewrites >= 3
    const highLoadLines = Object.entries(lineStats)
      .map(([ln, stats]) => ({ line: parseInt(ln, 10), ...stats }))
      .filter(l => l.time >= CONFUSION_THRESHOLD || l.rewrites >= 3)
      .sort((a, b) => b.time - a.time);

    if (highLoadLines.length > 0) {
      highLoadLines.forEach(item => {
        const lineContent = editor.value.split('\n')[item.line - 1] || '';
        const analysis = analyzeLineCategory(lineContent);
        const severity = item.time >= 15000 || item.rewrites >= 5 ? 'high' : 'medium';
        const severityLabel = severity === 'high' ? 'High Load Alert' : 'Moderate Load';
        
        insightsHtml += `
          <div class="cla-insight-card">
            <div class="cla-insight-header">
              <div class="cla-insight-title">
                <i class="fas ${analysis.icon}"></i>
                <span>${analysis.title} (Line ${item.line})</span>
              </div>
              <span class="cla-insight-badge ${severity}">${severityLabel}</span>
            </div>
            <div class="cla-insight-code">${item.line}: ${lineContent.trim() || '[Empty Line]'}</div>
            <div class="cla-insight-desc">
              ${analysis.desc} 
              Spent <strong>${(item.time / 1000).toFixed(1)}s</strong> and made <strong>${item.rewrites}</strong> rewrite(s) on this line.
            </div>
            <div class="cla-insight-tip">
              <i class="fas fa-lightbulb"></i>
              <span><strong>Tip:</strong> ${analysis.tip}</span>
            </div>
          </div>
        `;
      });
    } else {
      insightsHtml += `
        <div class="cla-insight-card" style="border-left: 4px solid #10b981;">
          <div class="cla-insight-header">
            <div class="cla-insight-title" style="color: #34d399;">
              <i class="fas fa-smile-beam"></i>
              <span>Flow State Achieved</span>
            </div>
            <span class="cla-insight-badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">Optimal</span>
          </div>
          <div class="cla-insight-desc">
            No high cognitive load lines or confusion zones were detected. You maintained a smooth flow state during this coding run!
          </div>
        </div>
      `;
    }

    insightsContainer.innerHTML = insightsHtml;
    copyBtn.disabled = false;
    updateStatsUI();
  }

  function copyInsights() {
    const temp = document.createElement('textarea');
    temp.value = insightsContainer.innerText.trim();
    document.body.appendChild(temp);
    temp.select();
    try {
      document.execCommand('copy');
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = 'Copy Insights'), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(temp);
  }

  // Event Listeners
  languageSelect.addEventListener('change', () => {
    if (tracking && editor.value.trim().length > 0) {
      if (false /* confirm removed */) {
        resetState();
      } else {
        // Revert select option to matches current active editor
      }
    } else {
      resetState();
    }
  });

  editor.addEventListener('input', handleInput);
  editor.addEventListener('click', updateLines);
  editor.addEventListener('keyup', updateLines);
  editor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = editor.scrollTop;
  });

  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = editor.selectionStart;
      const ePos = editor.selectionEnd;
      editor.value = editor.value.substring(0, s) + '    ' + editor.value.substring(ePos);
      editor.selectionStart = editor.selectionEnd = s + 4;
      updateLines();
      handleInput();
    }
  });

  startBtn.addEventListener('click', startSession);
  resetBtn.addEventListener('click', resetState);
  generateBtn.addEventListener('click', generateInsights);
  copyBtn.addEventListener('click', copyInsights);

  // Initialize page
  resetState();
})();
