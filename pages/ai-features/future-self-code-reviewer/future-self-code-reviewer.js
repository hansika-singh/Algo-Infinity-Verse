/* Future Self Code Reviewer AI Logic */

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const codeEditor = document.getElementById('codeEditor');
  const editorLineNumbers = document.getElementById('editorLineNumbers');
  const problemPreset = document.getElementById('problemPreset');
  const languageSelect = document.getElementById('languageSelect');
  const btnRunReview = document.getElementById('btnRunReview');
  const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
  const timelineContainer = document.getElementById('timelineContainer');
  const comparisonContainer = document.getElementById('comparisonContainer');

  // Bullets containers
  const juniorBullets = document.getElementById('juniorBullets');
  const midBullets = document.getElementById('midBullets');
  const seniorBullets = document.getElementById('seniorBullets');

  // Comparison columns
  const juniorComp = document.getElementById('juniorComp');
  const midComp = document.getElementById('midComp');
  const seniorComp = document.getElementById('seniorComp');

  // Annotator Elements
  const annotatorSection = document.getElementById('annotatorSection');
  const annotatedCodeDisplay = document.getElementById('annotatedCodeDisplay');
  const emptyAnnotationState = document.getElementById('emptyAnnotationState');
  const annotationDetailsContent = document.getElementById('annotationDetailsContent');
  const annotationLineHeader = document.getElementById('annotationLineHeader');
  const lineJuniorFeedback = document.getElementById('lineJuniorFeedback');
  const lineMidFeedback = document.getElementById('lineMidFeedback');
  const lineSeniorFeedback = document.getElementById('lineSeniorFeedback');

  // Presets definition
  const presets = {
    twosum: {
      javascript: `function twoSum(nums, target) {\n    for (let i = 0; i < nums.length; i++) {\n        for (let j = i + 1; j < nums.length; j++) {\n            if (nums[i] + nums[j] === target) {\n                return [i, j];\n            }\n        }\n    }\n    return [];\n}`,
      python: `def two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []`,
      cpp: `#include <vector>\n\nstd::vector<int> twoSum(std::vector<int>& nums, int target) {\n    for (int i = 0; i < nums.size(); ++i) {\n        for (int j = i + 1; j < nums.size(); ++j) {\n            if (nums[i] + nums[j] == target) {\n                return {i, j};\n            }\n        }\n    }\n    return {};\n}`,
      java: `import java.util.*;\n\npublic class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        for (int i = 0; i < nums.length; i++) {\n            for (int j = i + 1; j < nums.length; j++) {\n                if (nums[i] + nums[j] == target) {\n                    return new int[] { i, j };\n                }\n            }\n        }\n        return new int[0];\n    }\n}`
    },
    'reverse-list': {
      javascript: `function reverseList(head) {\n    let prev = null;\n    let curr = head;\n    while (curr !== null) {\n        let nextTemp = curr.next;\n        curr.next = prev;\n        prev = curr;\n        curr = nextTemp;\n    }\n    return prev;\n}`,
      python: `def reverse_list(head):\n    prev = None\n    curr = head\n    while curr:\n        next_temp = curr.next\n        curr.next = prev\n        prev = curr\n        curr = next_temp\n    return prev`,
      cpp: `struct ListNode {\n    int val;\n    ListNode* next;\n};\n\nListNode* reverseList(ListNode* head) {\n    ListNode* prev = nullptr;\n    ListNode* curr = head;\n    while (curr != nullptr) {\n        ListNode* nextTemp = curr->next;\n        curr->next = prev;\n        prev = curr;\n        curr = nextTemp;\n    }\n    return prev;\n}`,
      java: `public class Solution {\n    public ListNode reverseList(ListNode head) {\n        ListNode prev = null;\n        ListNode curr = head;\n        while (curr != null) {\n            ListNode nextTemp = curr.next;\n            curr.next = prev;\n            prev = curr;\n            curr = nextTemp;\n        }\n        return prev;\n    }\n}`
    },
    'binary-search': {
      javascript: `function search(nums, target) {\n    let left = 0;\n    let right = nums.length - 1;\n    while (left <= right) {\n        let mid = Math.floor((left + right) / 2);\n        if (nums[mid] === target) return mid;\n        if (nums[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}`,
      python: `def search(nums, target):\n    left = 0\n    right = len(nums) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1`,
      cpp: `#include <vector>\n\nint search(std::vector<int>& nums, int target) {\n    int left = 0;\n    int right = nums.size() - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (nums[mid] == target) return mid;\n        if (nums[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}`,
      java: `public class Solution {\n    public int search(int[] nums, int target) {\n        int left = 0;\n        int right = nums.length - 1;\n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            if (nums[mid] == target) return mid;\n            if (nums[mid] < target) left = mid + 1;\n            else right = mid - 1;\n        }\n        return -1;\n    }\n}`
    },
    'valid-parentheses': {
      javascript: `function isValid(brackets) {\n    let stack = [];\n    for (let i = 0; i < brackets.length; i++) {\n        let char = brackets[i];\n        if (char === '(' || char === '{' || char === '[') {\n            stack.push(char);\n        } else {\n            if (stack.length === 0) return false;\n            let top = stack.pop();\n            if (char === ')' && top !== '(') return false;\n            if (char === '}' && top !== '{') return false;\n            if (char === ']' && top !== '[') return false;\n        }\n    }\n    return stack.length === 0;\n}`,
      python: `def is_valid(brackets):\n    stack = []\n    mapping = {")": "(", "}": "{", "]": "["}\n    for char in brackets:\n        if char in mapping.values():\n            stack.append(char)\n        elif char in mapping.keys():\n            if not stack or stack.pop() != mapping[char]:\n                return False\n    return len(stack) == 0`,
      cpp: `#include <string>\n#include <stack>\n\nbool isValid(std::string brackets) {\n    std::stack<char> st;\n    for (char c : brackets) {\n        if (c == '(' || c == '{' || c == '[') {\n            st.push(c);\n        } else {\n            if (st.empty()) return false;\n            char top = st.top();\n            st.pop();\n            if (c == ')' && top != '(') return false;\n            if (c == '}' && top != '{') return false;\n            if (c == ']' && top != '[') return false;\n        }\n    }\n    return st.empty();\n}`,
      java: `import java.util.*;\n\npublic class Solution {\n    public boolean isValid(String brackets) {\n        Stack<Character> stack = new Stack<>();\n        for (char c : brackets.toCharArray()) {\n            if (c == '(' || c == '{' || c == '[') {\n                stack.push(c);\n            } else {\n                if (stack.isEmpty()) return false;\n                char top = stack.pop();\n                if (c == ')' && top != '(') return false;\n                if (c == '}' && top != '{') return false;\n                if (c == ']' && top != '[') return false;\n            }\n        }\n        return stack.isEmpty();\n    }\n}`
    }
  };

  // Sync scroll of line numbers and textarea
  codeEditor.addEventListener('scroll', () => {
    editorLineNumbers.scrollTop = codeEditor.scrollTop;
  });

  // Generate line numbers
  function updateLineNumbers() {
    const linesCount = codeEditor.value.split('\n').length;
    editorLineNumbers.innerHTML = Array.from({ length: linesCount }, (_, i) => `<div>${i + 1}</div>`).join('');
  }

  codeEditor.addEventListener('input', updateLineNumbers);

  // Load preset on change
  function loadPreset() {
    const key = problemPreset.value;
    const lang = languageSelect.value;
    if (key === 'custom') {
      codeEditor.value = '';
    } else if (presets[key] && presets[key][lang]) {
      codeEditor.value = presets[key][lang];
    }
    updateLineNumbers();
  }

  problemPreset.addEventListener('change', loadPreset);
  languageSelect.addEventListener('change', loadPreset);

  // Initialize line numbers
  updateLineNumbers();

  // Toggle View Handler
  viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.getAttribute('data-view');
      if (view === 'timeline') {
        timelineContainer.classList.add('active');
        comparisonContainer.classList.remove('active');
      } else {
        timelineContainer.classList.remove('active');
        comparisonContainer.classList.add('active');
      }
    });
  });

  // Review Engine
  btnRunReview.addEventListener('click', () => {
    const code = codeEditor.value.trim();
    if (!code) {
      void 0;
      return;
    }

    // Hide loader screen if visible (standard page behavior helper)
    const loader = document.getElementById('loading-screen');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.style.display = 'none', 500);
    }

    const presetKey = problemPreset.value;
    const lang = languageSelect.value;
    const results = generateReviews(code, presetKey, lang);

    renderReviews(results);
    renderAnnotations(code, results.annotations);

    // Show annotations panel
    annotatorSection.style.display = 'block';
    annotatorSection.scrollIntoView({ behavior: 'smooth' });
  });

  // Review Generator logic
  function generateReviews(code, presetKey, lang) {
    const lowerCode = code.toLowerCase();
    
    // Core Feedback Packages
    let juniorFeedback = [];
    let midFeedback = [];
    let seniorFeedback = [];
    let annotations = {}; // line -> { junior, mid, senior }

    // Detect line-by-line boundaries
    const codeLines = code.split('\n');

    if (presetKey === 'twosum') {
      // Junior feedback
      juniorFeedback = [
        "Looks clean! I can easily follow the two loops checking elements.",
        "Maybe add a comment at the top explaining that `nums` is the array of numbers and `target` is the sum we want.",
        "The spacing around elements looks good, but we could use standard indentation for the return statement to look more professional."
      ];

      // Mid feedback
      midFeedback = [
        "This is a classic brute force solution with O(N²) time complexity due to nested loops. We should optimize it to O(N).",
        "We can use a HashMap (Map object in JS) to store elements as we traverse the array, allowing a single-pass lookup.",
        "Consider using const/let variables instead of any loose scoping depending on our lint config."
      ];

      // Senior feedback
      seniorFeedback = [
        "While a Hash Map optimization reduces time complexity to O(N), it adds O(N) auxiliary space. If memory consumption is critical, this could be a bottleneck on large inputs.",
        "If the input array is already sorted, we can avoid the Hash Map entirely and use a Two-Pointer approach to maintain O(1) space with O(N) time.",
        "Edge Cases: We need strict bounds checking. If `nums` is null or has length less than 2, this function should fail gracefully rather than executing loops."
      ];

      // Line specific annotations
      // Find line with loops
      codeLines.forEach((line, idx) => {
        const lineNum = idx + 1;
        if (line.includes('for')) {
          annotations[lineNum] = {
            junior: "I see a loop here. It's clear and standard! We should comment what it traverses.",
            mid: "Nested loop here results in O(N²) quadratic time complexity. We can avoid this completely with hashing.",
            senior: "Quadratic time complexity fails production scale. Ensure loop invariants are document-friendly."
          };
        } else if (line.includes('return') && line.includes('[')) {
          annotations[lineNum] = {
            junior: "Returning the array index pairs! Nice job.",
            mid: "Standard output format. Make sure the indices are correctly typed.",
            senior: "Before returning, check if there are multiple solutions. This assumes only one unique solution exists."
          };
        }
      });

    } else if (presetKey === 'reverse-list') {
      juniorFeedback = [
        "Nice, you created the variables `prev` and `curr` correctly.",
        "The temporary swap logic `curr.next = prev` is clear. Let's add comments explaining why we store `curr.next` in a temporary variable.",
        "Ensure we use descriptive variable names like `previousNode` and `currentNode` to make it easier for other junior developers."
      ];

      midFeedback = [
        "This is an optimal O(N) time and O(1) auxiliary space iterative solution. Clean structure.",
        "Make sure to avoid memory leaks if this were implemented in an environment without garbage collection (like C++ pointer re-linking).",
        "Consider extracting the node pointer manipulation logic into a smaller helper function if we expand the list features."
      ];

      seniorFeedback = [
        "Good iterative implementation. An alternative recursive approach is elegant but runs the risk of Stack Overflow for deep lists due to call stack overhead.",
        "Edge Case: If the head is null or contains only one node (`head.next == null`), we can return the head immediately, skipping loop initialization entirely.",
        "Thread-Safety: In a multi-threaded system, modifying list node pointers in place without synchronization can lead to corrupted cycles. Consider if returning a new list is safer."
      ];

      codeLines.forEach((line, idx) => {
        const lineNum = idx + 1;
        if (line.includes('curr.next = prev') || line.includes('curr->next = prev')) {
          annotations[lineNum] = {
            junior: "This changes the pointer connection. Be careful not to lose the rest of the list!",
            mid: "Re-linking node references in place. Space complexity is safely kept at O(1).",
            senior: "Pointer re-assignment occurs here. Ensure no garbage collection or reference cycles are introduced."
          };
        } else if (line.includes('while')) {
          annotations[lineNum] = {
            junior: "Looping until the node pointer reaches null. Perfect.",
            mid: "O(N) traversal loop. Loop condition checks list head/current reference.",
            senior: "Crucial guard condition. If head is null, this loop never runs, which is safe, but we could check list length early."
          };
        }
      });

    } else if (presetKey === 'binary-search') {
      juniorFeedback = [
        "You calculated the mid point and checked if it matches. Very logical!",
        "It's good that we add `left = mid + 1` to move the boundaries.",
        "Let's put comments inside the if-conditions explaining what target values we're shifting boundaries for."
      ];

      midFeedback = [
        "Calculating `(left + right) / 2` can cause integer overflow in languages like C++ or Java if the sum exceeds maximum integer bounds. Use `left + (right - left) / 2` instead.",
        "This runs correctly in O(log N) time complexity. Ensure the array input is always pre-sorted before calling this function.",
        "We can implement this using bitwise shift `(left + right) >> 1` to slightly optimize execution depending on compiler tuning."
      ];

      seniorFeedback = [
        "Standard Binary Search. The integer overflow bug on average calculation must be resolved for system robustness.",
        "API Contract: If the target value is not present, we return -1. In library design, it is often more useful to return the insertion point (like `-(insert_idx + 1)`) so callers can insert elements while preserving sort order.",
        "Duplicate values: What if the list contains duplicates? This implementation does not guarantee returning the first or last occurrence of the target."
      ];

      codeLines.forEach((line, idx) => {
        const lineNum = idx + 1;
        if (line.includes('mid =')) {
          annotations[lineNum] = {
            junior: "Finding the center index of the array! Clear math.",
            mid: "Risk of integer overflow if `left + right` exceeds maximum integer capacity.",
            senior: "Arithmetic overflow guard needed. Use subtraction safe formula to prevent boundary crash."
          };
        } else if (line.includes('while')) {
          annotations[lineNum] = {
            junior: "We loop while boundaries don't overlap.",
            mid: "Ensures O(log N) runtime bound. Standard search loop.",
            senior: "Boundary convergence invariant. Ensure loop terminates under all index bounds configurations."
          };
        }
      });

    } else if (presetKey === 'valid-parentheses') {
      juniorFeedback = [
        "Great use of a stack (array) to push open brackets and pop them when matching.",
        "Checking if `stack.length === 0` is a good way to see if there are too many closing brackets.",
        "We should add a dictionary or map mapping brackets so the code is cleaner."
      ];

      midFeedback = [
        "Using a stack handles linear nested structures perfectly in O(N) time and O(N) auxiliary space.",
        "Instead of multiple `if` checks for bracket pairs, use a static lookup map or dictionary configuration. This increases modularity.",
        "We can check early bounds: if the string length is odd, it's impossible to match, so we should return false immediately."
      ];

      seniorFeedback = [
        "Good stack solution. However, memory allocation for the stack is O(N). If the input string is very long (e.g., streaming bracket config), we should define maximum heap sizes.",
        "L1 Cache benefits: In compiled languages, using a lightweight stack buffer array can drastically outperform dynamic list sizing due to cache locality.",
        "Input Validation: The characters must be strictly validated. What if the string contains whitespace, alphanumeric values, or unicode? Define an explicit character vocabulary."
      ];

      codeLines.forEach((line, idx) => {
        const lineNum = idx + 1;
        if (line.includes('stack.push') || line.includes('stack.append')) {
          annotations[lineNum] = {
            junior: "Storing the open brackets for matching later. Standard push!",
            mid: "Pushing brackets onto auxiliary stack. Space scales linearly.",
            senior: "Stack depth grows to O(N) in worst case (e.g., string of all open brackets). Monitor memory limits."
          };
        } else if (line.includes('stack.pop') || line.includes('stack.isEmpty') || line.includes('stack.length')) {
          annotations[lineNum] = {
            junior: "Checking stack size or popping elements. Simple logic.",
            mid: "Stack validation. Popping elements to verify balance matches.",
            senior: "Underflow check. Ensure we guard against popping from empty stacks to avoid null reference crashes."
          };
        }
      });

    } else {
      // General Custom Code Analysis
      const hasLoops = /for|while/.test(lowerCode);
      const nestedLoops = (lowerCode.match(/for|while/g) || []).length > 1;
      const hasRecursion = (lowerCode.includes('def') || lowerCode.includes('function')) && 
                           (lowerCode.match(/\b\w+\s*\(/g) || []).length > 1; // rough regex check
      const hasComments = lowerCode.includes('//') || lowerCode.includes('#') || lowerCode.includes('/*');
      const hasNullChecks = /null|undefined|none|nil/.test(lowerCode);
      const shortVariableNames = /\b[i-kxy]\b/.test(lowerCode);

      juniorFeedback.push("I like the overall structure. The code is compact!");
      if (hasComments) {
        juniorFeedback.push("Great job adding comments! It really helps explain what the code is doing.");
      } else {
        juniorFeedback.push("You should add more comments explaining what variables are used and how loops iterate.");
      }
      if (shortVariableNames) {
        juniorFeedback.push("Try to use longer variable names instead of just single-letter variables like i, j, or x so that beginners can understand it.");
      }

      midFeedback.push("The code logic executes linearly. However, we should verify index bounds.");
      if (nestedLoops) {
        midFeedback.push("Be careful with nested loops! This results in quadratic time complexity (O(N²)) which can slow down with larger datasets.");
      }
      if (!hasNullChecks) {
        midFeedback.push("Consider using standard guard conditions to avoid running unnecessary loops on empty arguments.");
      }
      midFeedback.push("Ensure variable definitions follow uniform scoping conventions (const/let or local variables).");

      seniorFeedback.push("This implementation represents a good starting draft, but lacks core enterprise robustness.");
      if (nestedLoops) {
        seniorFeedback.push("The quadratic O(N²) complexity is a scaling liability. Consider optimizing to linear O(N) or logarithmic O(log N) using pre-sorting, hashing, or two-pointers.");
      }
      if (!hasNullChecks) {
        seniorFeedback.push("Production readiness requires explicit input validation. Null checks, type checks, and bounds guards should be verified at the API entrance.");
      }
      if (hasRecursion) {
        seniorFeedback.push("Recursive calls introduce call-stack frame growth. Ensure a strict base-case boundary is defined to avoid catastrophic Stack Overflow crashes.");
      } else {
        seniorFeedback.push("This iterative approach is safe from call stack overflow and maintains predictable memory patterns.");
      }

      // Add dummy annotations for custom code on loop lines or function definition
      codeLines.forEach((line, idx) => {
        const lineNum = idx + 1;
        if (line.includes('function') || line.includes('def') || line.includes('class')) {
          annotations[lineNum] = {
            junior: "Here we define the function. Looks clear and standard!",
            mid: "Standard API entry point. Ensure parameters are typed or documented.",
            senior: "Interface design: Validate that arguments are immutable to prevent unintended side effects."
          };
        } else if (line.includes('for') || line.includes('while')) {
          annotations[lineNum] = {
            junior: "I see a loop starting here. We are going to iterate through elements.",
            mid: "Loop execution block. Watch out for infinite conditions and indexing boundaries.",
            senior: "Verify list iterator bounds. Under high-performance paths, check cache locality of memory accesses."
          };
        }
      });
    }

    return {
      junior: juniorFeedback,
      mid: midFeedback,
      senior: seniorFeedback,
      annotations: annotations
    };
  }

  // Render Reviews into containers
  function renderReviews(results) {
    // Junior Render
    juniorBullets.innerHTML = results.junior.map(bullet => `
      <div class="bullet-item">
        <i class="fas fa-chevron-right bullet-icon"></i>
        <span>${bullet}</span>
      </div>
    `).join('');
    juniorComp.innerHTML = results.junior.map(bullet => `<p>• ${bullet}</p>`).join('');

    // Mid Render
    midBullets.innerHTML = results.mid.map(bullet => `
      <div class="bullet-item">
        <i class="fas fa-chevron-right bullet-icon"></i>
        <span>${bullet}</span>
      </div>
    `).join('');
    midComp.innerHTML = results.mid.map(bullet => `<p>• ${bullet}</p>`).join('');

    // Senior Render
    seniorBullets.innerHTML = results.senior.map(bullet => `
      <div class="bullet-item">
        <i class="fas fa-chevron-right bullet-icon"></i>
        <span>${bullet}</span>
      </div>
    `).join('');
    seniorComp.innerHTML = results.senior.map(bullet => `<p>• ${bullet}</p>`).join('');
  }

  // Render Code with Clickable line markers
  function renderAnnotations(code, annotations) {
    const lines = code.split('\n');
    annotatedCodeDisplay.innerHTML = lines.map((line, idx) => {
      const lineNum = idx + 1;
      const hasCritique = annotations[lineNum] ? 'has-critique' : '';
      // Escape HTML entities to prevent rendering bugs
      const escapedLine = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

      return `
        <div class="annotated-line ${hasCritique}" data-line="${lineNum}">
          <span class="line-num-lbl">${lineNum}</span>
          <span class="line-text-lbl">${escapedLine || ' '}</span>
        </div>
      `;
    }).join('');

    // Add click event listeners
    const lineElements = annotatedCodeDisplay.querySelectorAll('.annotated-line');
    lineElements.forEach(lineEl => {
      lineEl.addEventListener('click', () => {
        lineElements.forEach(el => el.classList.remove('selected'));
        lineEl.classList.add('selected');

        const lineNum = parseInt(lineEl.getAttribute('data-line'), 10);
        showLineCritique(lineNum, annotations[lineNum]);
      });
    });

    // Reset details panel state
    emptyAnnotationState.style.display = 'block';
    annotationDetailsContent.style.display = 'none';
  }

  // Show selected line feedback
  function showLineCritique(lineNum, critique) {
    if (!critique) {
      // If no critique for this line, supply placeholder messages
      annotationLineHeader.textContent = `Line ${lineNum} Review`;
      lineJuniorFeedback.textContent = "No specific syntax or cosmetic comments for this line.";
      lineMidFeedback.textContent = "No code structure or DRY violation flags on this line.";
      lineSeniorFeedback.textContent = "No concurrency, stack frame risk, or boundary failures on this line.";
    } else {
      annotationLineHeader.textContent = `Line ${lineNum} Detailed Review`;
      lineJuniorFeedback.textContent = critique.junior || "Looks clean!";
      lineMidFeedback.textContent = critique.mid || "No structural concerns.";
      lineSeniorFeedback.textContent = critique.senior || "No architectural vulnerabilities.";
    }

    emptyAnnotationState.style.display = 'none';
    annotationDetailsContent.style.display = 'block';
  }
});


window.addEventListener("resize", () => {
  if (typeof updateLineNumbers === 'function') updateLineNumbers();
});
