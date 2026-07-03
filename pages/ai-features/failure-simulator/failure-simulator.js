// Failure Simulation Engine JavaScript
// Simulates high-pressure technical interviews with time shocks, memory shifts, edge case failures, and interruptions.

(() => {
  const editor = document.getElementById('fseCodeEditor');
  const lineNumbers = document.getElementById('fseLineNumbers');
  const languageSelect = document.getElementById('fseLanguageSelect');
  const problemSelect = document.getElementById('fseProblemSelect');
  const runBtn = document.getElementById('fseRunBtn');
  const submitBtn = document.getElementById('fseSubmitBtn');
  
  // Setup & controls
  const startBtn = document.getElementById('fseStartBtn');
  const resetBtn = document.getElementById('fseResetBtn');
  const stressorTime = document.getElementById('fseStressorTime');
  const stressorMemory = document.getElementById('fseStressorMemory');
  const stressorEdge = document.getElementById('fseStressorEdge');
  const stressorInterruption = document.getElementById('fseStressorInterruption');
  
  // Displays & Logs
  const completedVal = document.getElementById('fseCompletedVal');
  const resilienceVal = document.getElementById('fseResilienceVal');
  const stressorsVal = document.getElementById('fseStressorsVal');
  const pressureFill = document.getElementById('fsePressureFill');
  const pressureVal = document.getElementById('fsePressureVal');
  const timerVal = document.getElementById('fseTimerVal');
  const timerStatus = document.getElementById('fseTimerStatus');
  const timerBox = document.getElementById('fseTimerBox');
  const consoleStream = document.getElementById('fseConsoleStream');
  
  // Dialogue Box
  const dialogueBox = document.getElementById('fseDialogueBox');
  const dialoguePrompt = document.getElementById('fseDialoguePrompt');
  const dialogueOptions = document.getElementById('fseDialogueOptions');
  
  // Results
  const resultsCard = document.getElementById('fseResultsCard');
  const resultsBadge = document.getElementById('fseResultsBadge');
  const finalScoreVal = document.getElementById('fseFinalScoreVal');
  const robustnessScore = document.getElementById('fseRobustnessScore');
  const timeScore = document.getElementById('fseTimeScore');
  const memoryScore = document.getElementById('fseMemoryScore');
  const dialogueScore = document.getElementById('fseDialogueScore');
  const retroReport = document.getElementById('fseRetroReport');
  const editorFrame = document.querySelector('.fse-editor-frame');
  const lineCountSpan = document.getElementById('fseLineCount');

  // Simulation State
  let sessionActive = false;
  let timeRemaining = 600; // 10 minutes in seconds
  let timerInterval = null;
  let pressureLevel = 0;
  let pressureInterval = null;
  let activeInterruption = null;
  let currentProblemKey = 'twosum';
  
  // Metrics collected
  let timeContractionTriggered = false;
  let memoryShiftTriggered = false;
  let edgeCasesAttempted = 0;
  let edgeCasesResolved = 0;
  let dialogueAttempts = 0;
  let dialogueScoreTotal = 0;
  let pressureOverloadTicks = 0;
  let sessionStartTime = null;

  // Challenge Boilerplates
  const PROBLEM_TEMPLATES = {
    twosum: {
      python: `def twoSum(nums, target):
    # Find two indices that add up to target
    # nums is pre-sorted if O(1) space constraint is applied
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []
`,
      javascript: `function twoSum(nums, target) {
    // Find two indices that add up to target
    // nums is pre-sorted if O(1) space constraint is applied
    for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] === target) {
                return [i, j];
            }
        }
    }
    return [];
}
`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Find two indices that add up to target
        // nums is pre-sorted if O(1) space constraint is applied
        for (int i = 0; i < nums.size(); i++) {
            for (int j = i + 1; j < nums.size(); j++) {
                if (nums[i] + nums[j] == target) {
                    return {i, j};
                }
            }
        }
        return {};
    }
};
`,
      java: `import java.util.*;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Find two indices that add up to target
        // nums is pre-sorted if O(1) space constraint is applied
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) {
                    return new int[]{i, j};
                }
            }
        }
        return new int[0];
    }
}
`
    },
    'reverse-list': {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverseList(head):
    # Write your O(1) space solution here...
    pass
`,
      javascript: `function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val)
    this.next = (next===undefined ? null : next)
}

function reverseList(head) {
    // Write your O(1) space solution here...
    return null;
}
`,
      cpp: `struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        // Write your O(1) space solution here...
        return nullptr;
    }
};
`,
      java: `public class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

public class Solution {
    public ListNode reverseList(ListNode head) {
        // Write your O(1) space solution here...
        return null;
    }
}
`
    },
    'valid-parentheses': {
      python: `def is_valid(brackets):
    # brackets: string of '()', '{}', '[]' characters
    # returns: True if every opening bracket has a matching closing
    #          bracket in the correct order, False otherwise
    #
    # Use a stack to track opening brackets.
    # For each char in brackets:
    #   - If it's an opening bracket, push onto stack
    #   - If it's a closing bracket, pop from stack and check it matches
    # Examples:
    #   is_valid("()[]{}") -> True
    #   is_valid("(]")     -> False
    pass
`,
      javascript: `function isValid(brackets) {
    // brackets: string of '()', '{}', '[]' characters
    // returns: true if every opening bracket has a matching closing
    //          bracket in the correct order, false otherwise
    //
    // Use a stack to track opening brackets.
    // For each char in brackets:
    //   - If it's an opening bracket, push onto stack
    //   - If it's a closing bracket, pop from stack and check it matches
    // Examples:
    //   isValid("()[]{}") -> true
    //   isValid("(]")     -> false
    return false;
}
`,
      cpp: `#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    bool isValid(string brackets) {
        // brackets: string of '()', '{}', '[]' characters
        // returns: true if every opening bracket has a matching closing
        //          bracket in the correct order, false otherwise
        //
        // Use a stack to track opening brackets.
        // For each char in brackets:
        //   - If it's an opening bracket, push onto stack
        //   - If it's a closing bracket, pop from stack and check it matches
        // Examples:
        //   isValid("()[]{}") -> true
        //   isValid("(]")     -> false
        return false;
    }
};
`,
      java: `import java.util.*;

public class Solution {
    public boolean isValid(String brackets) {
        // brackets: string of '()', '{}', '[]' characters
        // returns: true if every opening bracket has a matching closing
        //          bracket in the correct order, false otherwise
        //
        // Use a stack to track opening brackets.
        // For each char in brackets:
        //   - If it's an opening bracket, push onto stack
        //   - If it's a closing bracket, pop from stack and check it matches
        // Examples:
        //   isValid("()[]{}") -> true
        //   isValid("(]")     -> false
        return false;
    }
}
`
    },
    'binary-search': {
      python: `def search(nums, target):
      # Search target in sorted list
      # Time complexity must be O(log N)
      pass
`,
      javascript: `function search(nums, target) {
    // Search target in sorted list
    // Time complexity must be O(log N)
    return -1;
}
`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        // Search target in sorted list
        // Time complexity must be O(log N)
        return -1;
    }
};
`,
      java: `public class Solution {
    public int search(int[] nums, int target) {
        // Search target in sorted list
        // Time complexity must be O(log N)
        return -1;
    }
}
`
    }
  };

  // Dialogue Tree definition
  const DIALOGUES = [
    {
      triggerTime: 480, // 8 minutes remaining
      prompt: "Interviewer: 'Before we go deeper, could you explain the worst-case space complexity of your current plan?'",
      options: [
        { text: "A. It uses O(N) auxiliary space to store elements in a lookup table / buffer.", score: 15, pressureChange: -5, msg: "Interviewer: 'Correct. Let's see if we can optimize it if needed.'" },
        { text: "B. I believe it is O(1) space because I am only editing existing nodes.", score: 5, pressureChange: 15, msg: "Interviewer: 'Are you sure? Storing copies of all elements in a set/stack takes linear space.'" },
        { text: "C. It's O(N) now, but if we have pre-sorted inputs, I can use two pointers to reduce it to O(1) space.", score: 25, pressureChange: -10, msg: "Interviewer: 'Excellent forward-thinking. That is exactly what I would look for!'" }
      ]
    },
    {
      triggerTime: 300, // 5 minutes remaining
      prompt: "Interviewer: 'How would your code handle negative inputs, duplicate values, or empty bounds?'",
      options: [
        { text: "A. It might crash. I should add guard clauses at the beginning of the function.", score: 20, pressureChange: -5, msg: "Interviewer: 'Good. Defensive checking is vital in production code.'" },
        { text: "B. The loop conditions already check sizes, so it will handle them correctly.", score: 10, pressureChange: 10, msg: "Interviewer: 'Let's verify that when we run tests. Make sure you don't access index -1.'" },
        { text: "C. I will write checks for null/empty inputs and verify bounds arithmetic.", score: 25, pressureChange: -8, msg: "Interviewer: 'Spot on. Edge case readiness is key.'" }
      ]
    }
  ];

  // Helper: Load stats from LocalStorage
  function loadStats() {
    const defaultStats = { completedCount: 0, avgResilience: 0, totalStressorsDefeated: 0, history: [] };
    const saved = localStorage.getItem('fse_simulations_stats');
    if (!saved) return defaultStats;
    try { return JSON.parse(saved); } catch (e) { return defaultStats; }
  }

  function saveStats(stats) {
    localStorage.setItem('fse_simulations_stats', JSON.stringify(stats));
    updateStatsUI(stats);
  }

  function updateStatsUI(stats) {
    const s = stats || loadStats();
    completedVal.textContent = s.completedCount;
    resilienceVal.textContent = s.completedCount > 0 ? `${Math.round(s.avgResilience)}%` : 'N/A';
    stressorsVal.textContent = s.totalStressorsDefeated;
  }

  function appendLog(source, msg, type = 'system') {
    const entry = document.createElement('div');
    entry.className = `fse-log-entry ${type}`;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'fse-log-time';
    timeSpan.textContent = `[${source}]`;
    
    const msgSpan = document.createElement('span');
    msgSpan.className = 'fse-log-msg';
    msgSpan.textContent = msg;
    
    entry.appendChild(timeSpan);
    entry.appendChild(msgSpan);
    consoleStream.appendChild(entry);
    consoleStream.scrollTop = consoleStream.scrollHeight;
  }

  function updateLines() {
    const text = editor.value;
    const lines = text.split('\n');
    const count = lines.length;
    const cursorPos = editor.selectionStart;
    const activeLine = (text.slice(0, cursorPos).match(/\n/g) || []).length + 1;
    
    let html = '';
    for (let i = 1; i <= Math.max(count, 1); i++) {
      if (i === activeLine && sessionActive) {
        html += `<span class="fse-line-number active">${i}</span>\n`;
      } else {
        html += `<span class="fse-line-number">${i}</span>\n`;
      }
    }
    lineNumbers.innerHTML = html;
    lineCountSpan.textContent = count + (count === 1 ? ' line' : ' lines');
    lineNumbers.scrollTop = editor.scrollTop;
  }

  function setPressure(level) {
    pressureLevel = Math.max(0, Math.min(level, 100));
    pressureFill.style.width = `${pressureLevel}%`;
    pressureVal.textContent = `${Math.round(pressureLevel)}%`;
    
    if (pressureLevel >= 80) {
      editorFrame.classList.add('warning');
      timerBox.classList.add('critical');
    } else {
      editorFrame.classList.remove('warning');
      timerBox.classList.remove('critical');
    }
  }

  function loadBoilerplate() {
    const prob = problemSelect.value;
    const lang = languageSelect.value;
    const template = PROBLEM_TEMPLATES[prob]?.[lang] || '';
    editor.value = template;
    updateLines();
  }

  function resetEngine() {
    clearInterval(timerInterval);
    clearInterval(pressureInterval);
    sessionActive = false;
    timeRemaining = 600;
    setPressure(0);
    
    editor.disabled = true;
    runBtn.disabled = true;
    submitBtn.disabled = true;
    startBtn.disabled = false;
    resetBtn.disabled = true;
    problemSelect.disabled = false;
    languageSelect.disabled = false;
    
    timerVal.textContent = '10:00';
    timerStatus.textContent = 'Inactive';
    dialogueBox.classList.add('hidden');
    resultsCard.classList.add('hidden');
    
    timeContractionTriggered = false;
    memoryShiftTriggered = false;
    edgeCasesAttempted = 0;
    edgeCasesResolved = 0;
    dialogueAttempts = 0;
    dialogueScoreTotal = 0;
    pressureOverloadTicks = 0;
    activeInterruption = null;
    
    consoleStream.innerHTML = '';
    appendLog('System', 'Engine reset. Configure parameters and click "Initialize Simulation".', 'system');
    loadBoilerplate();
  }

  function startSimulation() {
    resetEngine();
    
    sessionActive = true;
    currentProblemKey = problemSelect.value;
    sessionStartTime = Date.now();
    
    editor.disabled = false;
    editor.focus();
    runBtn.disabled = false;
    submitBtn.disabled = false;
    startBtn.disabled = true;
    resetBtn.disabled = false;
    problemSelect.disabled = true;
    languageSelect.disabled = true;
    
    timerStatus.textContent = 'Simulating';
    
    appendLog('System', 'Simulation session initialized. Constraints applied.', 'system');
    appendLog('Interviewer', 'Okay, here is your problem. Please read the description and begin coding. Let me know when you run your first test.', 'interviewer');
    
    // Core Timer Loop
    timerInterval = setInterval(() => {
      timeRemaining--;
      if (timeRemaining <= 0) {
        timeRemaining = 0;
        appendLog('System', 'Time limit reached! Submission locked.', 'error');
        endSimulation(true);
      }
      
      const m = Math.floor(timeRemaining / 60);
      const s = timeRemaining % 60;
      timerVal.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
      
      // Critical timer warnings
      if (timeRemaining === 60) {
        appendLog('Interviewer', 'One minute remaining. Please finalize your solution.', 'warning');
      }
      
      // Dynamic Stressors tick triggers
      checkStressorTriggers();
    }, 1000);

    // Pressure loop
    pressureInterval = setInterval(() => {
      // Pressure rises slowly naturally
      let pRate = 1;
      if (timeRemaining < 120) pRate += 2; // timer pressure
      if (activeInterruption) pRate += 3; // unanswered question pressure
      
      setPressure(pressureLevel + pRate);
      if (pressureLevel >= 100) pressureOverloadTicks++;
    }, 3000);
  }

  function checkStressorTriggers() {
    if (!sessionActive) return;
    
    // 1. Time Contraction Stressor (Shocks at 6 minutes / 360 seconds remaining)
    if (stressorTime.checked && !timeContractionTriggered && timeRemaining <= 380 && timeRemaining > 200) {
      timeContractionTriggered = true;
      // Fire any dialogues that would be skipped by the time jump
      if (stressorInterruption.checked) {
        DIALOGUES.forEach(d => {
          if (d.triggerTime < timeRemaining && d.triggerTime > 120 && !activeInterruption) {
            triggerDialogue(d);
          }
        });
      }
      timeRemaining = 120; // drop to 2 minutes left
      appendLog('Stressor', 'Timer Contraction Applied: Interviewer has limited time!', 'stressor');
      appendLog('Interviewer', 'Excuse me, I have another meeting starting shortly. Can we conclude your implementation in the next 2 minutes?', 'interviewer');
      setPressure(pressureLevel + 30);
    }
    
    // 2. Memory Overhead Constraint Shift (Shocks at 5 minutes / 300 seconds remaining)
    if (stressorMemory.checked && !memoryShiftTriggered && timeRemaining <= 300 && timeRemaining > 150) {
      memoryShiftTriggered = true;
      appendLog('Stressor', 'Memory Overhead Constraint Shift Injected!', 'stressor');
      appendLog('Interviewer', 'We need this function to operate in O(1) auxiliary space (in-place modification). Please adjust your code to avoid extra allocations.', 'interviewer');
      setPressure(pressureLevel + 20);
    }
    
    // 3. AI Interruptions (Q&A dialog triggers)
    if (stressorInterruption.checked) {
      DIALOGUES.forEach(d => {
        if (timeRemaining === d.triggerTime && !activeInterruption) {
          triggerDialogue(d);
        }
      });
    }
  }

  function triggerDialogue(d) {
    activeInterruption = d;
    dialogueBox.classList.remove('hidden');
    dialoguePrompt.textContent = d.prompt;
    
    // Log to console stream
    appendLog('Interviewer', d.prompt.replace("Interviewer: '", "").replace("'", ""), 'interviewer');
    
    dialogueOptions.innerHTML = '';
    d.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'fse-dialogue-option';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => handleDialogueChoice(opt));
      dialogueOptions.appendChild(btn);
    });
  }

  function handleDialogueChoice(opt) {
    dialogueAttempts++;
    dialogueScoreTotal += opt.score;
    
    // Apply changes
    setPressure(pressureLevel + opt.pressureChange);
    appendLog('You', opt.text.substring(3), 'system');
    appendLog('Interviewer', opt.msg.replace("Interviewer: '", "").replace("'", ""), 'interviewer');
    
    // Hide panel
    dialogueBox.classList.add('hidden');
    activeInterruption = null;
  }

  function runCode() {
    if (!sessionActive) return;
    
    appendLog('System', 'Compiling solution...', 'system');
    runBtn.disabled = true;
    
    setTimeout(() => {
      runBtn.disabled = false;
      const code = editor.value;
      const results = evaluateCodeDraft(code);
      
      if (results.compiled) {
        appendLog('System', 'Compilation successful. Running test suites...', 'success');
        
        if (results.passed) {
          appendLog('System', 'Basic test cases PASSED.', 'success');
        } else {
          // edge case injection logic
          if (stressorEdge.checked) {
            edgeCasesAttempted++;
            appendLog('System', `Failed: ${results.errorMsg}`, 'error');
            setPressure(pressureLevel + 15);
          } else {
            appendLog('System', 'Incorrect output on sample case.', 'error');
          }
        }
      } else {
        appendLog('System', `Compiler error: ${results.errorMsg}`, 'error');
        setPressure(pressureLevel + 20);
      }
    }, 1000);
  }

  function evaluateCodeDraft(code) {
    const text = code.toLowerCase();
    
    // Simple mock compilation checks (e.g. check open brackets parity)
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    
    if (openBraces !== closeBraces || openParens !== closeParens) {
      return { compiled: false, passed: false, errorMsg: "SyntaxError: Unmatched parentheses or block braces." };
    }
    
    // Language specific validations
    if (languageSelect.value === 'python' && code.includes('def') && !code.includes(':')) {
      return { compiled: false, passed: false, errorMsg: "IndentationError: expected a ':' at function definition." };
    }

    // Problem specific logical semantic checks
    if (currentProblemKey === 'twosum') {
      const hasLoops = /for|while/.test(text);
      if (!hasLoops) return { compiled: true, passed: false, errorMsg: "LogicalError: No array traversal loops detected." };
      
      // If memory overhead constraint is active, check space complexity
      if (memoryShiftTriggered && stressorMemory.checked) {
        // If they use standard hashing (e.g. object, dict, map, set), they fail O(1) space constraint!
        const usesExtraMemory = /\b(map|set|dict|hash)\b|new\s+int\b|new\s+vector\b/.test(text);
        if (usesExtraMemory) {
          return { compiled: true, passed: false, errorMsg: "MemoryLimitExceeded: Auxiliary space complexity limit O(1) violated on line-size." };
        }
      }
      
      // Hidden edge case testing
      if (stressorEdge.checked) {
        // If they don't check for array length or duplicates
        const handlesEmpty = /len|length|size|nums\s*==\s*null|nums\.length\s*==\s*0/.test(code);
        if (!handlesEmpty) {
          return { compiled: true, passed: false, errorMsg: "NullPointerException: Crashed on empty/null input bounds checking." };
        }
      }
      
      return { compiled: true, passed: true };
    }
    
    if (currentProblemKey === 'reverse-list') {
      const updatesPointers = /next|prev|curr|temp/.test(text);
      if (!updatesPointers) return { compiled: true, passed: false, errorMsg: "LogicalError: Nodes are never dereferenced or re-linked." };
      
      if (stressorEdge.checked) {
        const checksNull = /head\s*(==|===)\s*(null|nullptr|none)/.test(text);
        if (!checksNull) {
          return { compiled: true, passed: false, errorMsg: "NullPointerException: Crashed on input size <= 1." };
        }
      }
      return { compiled: true, passed: true };
    }
    
    if (currentProblemKey === 'valid-parentheses') {
      const usesStack = /\b(push|pop)\b/.test(text) || /\b(stack|Stack)\b/.test(code);
      if (!usesStack) return { compiled: true, passed: false, errorMsg: "LogicalError: Use a stack (push/pop) to track opening brackets and validate nesting order." };

      const hasBracketMap = /\(|\)|\{|\}|\[|\]/.test(code);
      if (!hasBracketMap) return { compiled: true, passed: false, errorMsg: "LogicalError: No bracket characters found. Expected logic to match parentheses '()', '{}', '[]'." };

      const checksEmpty = /\b(length|size|len|empty|isEmpty)\b/.test(text);
      if (!checksEmpty) return { compiled: true, passed: false, errorMsg: "IndexOutOfBoundsError: Stack underflow risk — check for empty stack before popping." };

      if (stressorEdge.checked) {
        const oddLengthCheck = /\b(length|size|len)\b/.test(text) && /%/.test(text);
        if (!oddLengthCheck) {
          return { compiled: true, passed: false, errorMsg: "PerformanceWarning: Odd-length strings can never be valid — add early exit when brackets.length % 2 !== 0." };
        }
      }
      return { compiled: true, passed: true };
    }
    
    if (currentProblemKey === 'binary-search') {
      const divides = /mid|\/|>>|div/.test(text);
      if (!divides) return { compiled: true, passed: false, errorMsg: "TimeLimitExceeded: Code performs sequential linear scan (expected O(log N) complexity)." };
      
      if (stressorEdge.checked) {
        const checksLength = /len|length|size/.test(text);
        if (!checksLength) {
          return { compiled: true, passed: false, errorMsg: "IndexOutOfBoundsException: Failed to resolve index checks on single-element list [10] with target 5." };
        }
      }
      return { compiled: true, passed: true };
    }
    
    return { compiled: true, passed: true };
  }

  function submitCode() {
    if (!sessionActive) return;
    endSimulation(false);
  }

  function endSimulation(timedOut) {
    clearInterval(timerInterval);
    clearInterval(pressureInterval);
    sessionActive = false;
    
    editor.disabled = true;
    runBtn.disabled = true;
    submitBtn.disabled = true;
    resetBtn.disabled = false;
    
    timerStatus.textContent = timedOut ? 'TIMEOUT' : 'COMPLETE';
    
    // Compile final analysis
    const code = editor.value;
    const evaluation = evaluateCodeDraft(code);
    
    // Resilience calculation formula
    let finalScore = 100;
    
    // Time resilience
    let timeRes = 'Passed';
    if (timedOut) {
      finalScore -= 30;
      timeRes = 'Failed (Timeout)';
    } else if (timeContractionTriggered) {
      // Finished after contraction
      finalScore += 5; // bonus points for finishing under sudden crunch
      timeRes = 'Excellent (Survived Crunch)';
    } else {
      timeRes = 'Passed';
    }
    
    // Robustness calculations
    let robustCount = 0;
    if (evaluation.compiled && evaluation.passed) {
      robustCount = 3;
    } else if (evaluation.compiled) {
      robustCount = 1; // partially runs
    } else {
      robustCount = 0;
    }
    finalScore -= (3 - robustCount) * 20;
    robustnessScore.textContent = `${robustCount}/3`;
    
    // Memory overhead validation
    let memoryRes = 'Optimal';
    if (stressorMemory.checked) {
      if (evaluation.compiled && evaluation.errorMsg && evaluation.errorMsg.includes('MemoryLimitExceeded')) {
        finalScore -= 20;
        memoryRes = 'Failed (Violated space limits)';
      } else if (memoryShiftTriggered) {
        memoryRes = 'Survived (In-place refactored)';
        finalScore += 5; // bonus for adapting to memory shift
      } else {
        memoryRes = 'Passed';
      }
    } else {
      memoryRes = 'Not Applied';
    }
    memoryScore.textContent = memoryRes;
    
    // Dialogue answers score
    let dialScore = 'N/A';
    if (stressorInterruption.checked && dialogueAttempts > 0) {
      const ratio = dialogueScoreTotal / (dialogueAttempts * 25); // max 25 score per question
      finalScore -= (1 - ratio) * 15;
      dialScore = `${Math.round(ratio * 100)}%`;
    }
    dialogueScore.textContent = dialScore;
    
    // Pressure penalties
    const pressurePenalty = Math.min(pressureOverloadTicks * 2, 20);
    finalScore -= pressurePenalty;
    
    finalScore = Math.max(0, Math.min(finalScore, 100));
    
    // Update local storage history
    const stats = loadStats();
    stats.completedCount += 1;
    stats.totalStressorsDefeated += (stressorTime.checked ? 1 : 0) + (stressorMemory.checked ? 1 : 0) + (stressorEdge.checked ? 1 : 0) + (stressorInterruption.checked ? 1 : 0);
    stats.avgResilience = ((stats.avgResilience * (stats.completedCount - 1)) + finalScore) / stats.completedCount;
    stats.history.push({ score: finalScore, date: new Date().toISOString(), problem: currentProblemKey });
    saveStats(stats);
    
    // Render Results retrospective
    resultsBadge.textContent = finalScore >= 70 ? 'Resilience Passed' : 'Resilience Vulnerable';
    resultsBadge.className = `fse-results-badge ${finalScore >= 70 ? '' : 'failed'}`;
    finalScoreVal.textContent = `${Math.round(finalScore)}%`;
    
    // Render retrospective advice
    let adviceHtml = '';
    if (finalScore >= 85) {
      adviceHtml = `
        <p>🎉 <strong>Resilience Level: elite.</strong> You maintained cognitive composure under severe stressors. Even with timer constraints and dynamic complexity constraints, you kept your logic robust. You responded constructively to conversational interruptions without letting syntax checks drift.</p>
        <p>💡 <strong>Tip:</strong> Keep practicing on harder stacks. Try adding multiple simultaneous problem challenges to train context switching.</p>
      `;
    } else if (finalScore >= 70) {
      adviceHtml = `
        <p>👍 <strong>Resilience Level: robust.</strong> You resolved most edge cases and survived pressure events, but there was a drop in speed or accuracy. Your response to interviewer dialogue checks was logical, but syntax compilation errors caused spikes in pressure.</p>
        <p>💡 <strong>Tip:</strong> Before running compile, double-check bracket indentation. Minimizing compiler warnings prevents pressure indicators from spiking during real reviews.</p>
      `;
    } else {
      adviceHtml = `
        <p>⚠️ <strong>Resilience Level: vulnerable.</strong> Under constraints, your space efficiency or bounds checking broke down. Spikes in pressure caused syntax loops or unanswered interruptions, which is normal for early training.</p>
        <p>💡 <strong>Tip:</strong> Socratic review recommends laying out pseudocode first. If a memory limit check is injected halfway, do not panic—refactor slowly rather than patching loops iteratively.</p>
      `;
    }
    retroReport.innerHTML = adviceHtml;
    resultsCard.classList.remove('hidden');
    resultsCard.scrollIntoView({ behavior: 'smooth' });
    
    appendLog('System', `Simulation completed. Final Resilience Score: ${Math.round(finalScore)}%`, 'success');
  }

  // Event bindings
  startBtn.addEventListener('click', startSimulation);
  resetBtn.addEventListener('click', resetEngine);
  runBtn.addEventListener('click', runCode);
  submitBtn.addEventListener('click', submitCode);
  problemSelect.addEventListener('change', loadBoilerplate);
  languageSelect.addEventListener('change', loadBoilerplate);
  
  editor.addEventListener('input', updateLines);
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
    }
  });

  // Initialize
  updateStatsUI();
  resetEngine();

  setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.classList.add('hidden');
  }, 300);
})();
