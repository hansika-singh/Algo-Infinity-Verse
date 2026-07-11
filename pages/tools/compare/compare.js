// compare.js - Code Compare & Diff Viewer

const PROBLEMS = {
    'two-sum': {
        name: 'Two Sum',
        optimal: `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
        time: 'O(n)',
        space: 'O(n)'
    },
    'reverse-linked-list': {
        name: 'Reverse Linked List',
        optimal: `function reverseList(head) {
    let prev = null;
    let curr = head;
    while (curr) {
        const next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}`,
        time: 'O(n)',
        space: 'O(1)'
    },
    'valid-parentheses': {
        name: 'Valid Parentheses',
        optimal: `function isValid(brackets) {
    const stack = [];
    const pairs = { '(': ')', '[': ']', '{': '}' };
    for (const char of brackets) {
        if (pairs[char]) {
            stack.push(char);
        } else {
            if (pairs[stack.pop()] !== char) return false;
        }
    }
    return stack.length === 0;
}`,
        time: 'O(n)',
        space: 'O(n)'
    },
    'merge-sorted-arrays': {
        name: 'Merge Sorted Arrays',
        optimal: `function merge(nums1, m, nums2, n) {
    let i = m - 1, j = n - 1, k = m + n - 1;
    while (j >= 0) {
        if (i >= 0 && nums1[i] > nums2[j]) {
            nums1[k--] = nums1[i--];
        } else {
            nums1[k--] = nums2[j--];
        }
    }
}`,
        time: 'O(m+n)',
        space: 'O(1)'
    },
    'binary-search': {
        name: 'Binary Search',
        optimal: `function search(nums, target) {
    let left = 0, right = nums.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
        time: 'O(log n)',
        space: 'O(1)'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const problemSelect = document.getElementById('problemSelect');
    const loadBtn = document.getElementById('loadCompareBtn');
    const diffBtn = document.getElementById('diffBtn');
    const resetBtn = document.getElementById('resetBtn');
    const userCode = document.getElementById('userCode');
    const optimalCode = document.getElementById('optimalCode');
    const compareView = document.getElementById('compareView');
    const diffResults = document.getElementById('diffResults');
    const diffOutput = document.getElementById('diffOutput');
    const addedCount = document.getElementById('addedCount');
    const removedCount = document.getElementById('removedCount');
    const similarityPercent = document.getElementById('similarityPercent');
    const complexityCompare = document.getElementById('complexityCompare');
    const userTime = document.getElementById('userTime');
    const userSpace = document.getElementById('userSpace');
    const optimalTime = document.getElementById('optimalTime');
    const optimalSpace = document.getElementById('optimalSpace');

    loadBtn.addEventListener('click', loadProblem);
    diffBtn.addEventListener('click', showDiff);
    resetBtn.addEventListener('click', resetComparison);

    function loadProblem() {
        const problemId = problemSelect.value;
        if (!problemId) {
            void 0;
            return;
        }

        const problem = PROBLEMS[problemId];
        if (!problem) return;

        optimalCode.textContent = problem.optimal;
        optimalTime.textContent = problem.time;
        optimalSpace.textContent = problem.space;
        userCode.textContent = '// Write your solution here...';
        userTime.textContent = '?';
        userSpace.textContent = '?';

        compareView.style.display = 'grid';
        diffResults.style.display = 'none';
        complexityCompare.style.display = 'block';
        diffOutput.innerHTML = '';
        document.getElementById('addedCount').textContent = '0';
        document.getElementById('removedCount').textContent = '0';
        document.getElementById('similarityPercent').textContent = '0%';
    }

    function showDiff() {
        const user = userCode.textContent.trim();
        const optimal = optimalCode.textContent.trim();
        
        if (!user || user === '// Write your solution here...') {
            void 0;
            return;
        }

        const diff = computeDiff(user, optimal);
        displayDiff(diff);
    }

    function computeDiff(a, b) {
        const aLines = a.split('\n');
        const bLines = b.split('\n');
        
        const matrix = [];
        for (let i = 0; i <= aLines.length; i++) {
            matrix[i] = [];
            for (let j = 0; j <= bLines.length; j++) {
                if (i === 0) matrix[i][j] = j;
                else if (j === 0) matrix[i][j] = i;
                else if (aLines[i-1] === bLines[j-1]) {
                    matrix[i][j] = matrix[i-1][j-1];
                } else {
                    matrix[i][j] = Math.min(matrix[i-1][j], matrix[i][j-1]) + 1;
                }
            }
        }

        const result = { added: [], removed: [], unchanged: [], modified: [] };
        let i = aLines.length, j = bLines.length;
        
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && aLines[i-1] === bLines[j-1]) {
                result.unchanged.push({ line: aLines[i-1], num: i });
                i--; j--;
            } else if (j > 0 && (i === 0 || matrix[i][j-1] <= matrix[i-1][j])) {
                result.added.push({ line: bLines[j-1], num: j });
                j--;
            } else if (i > 0 && (j === 0 || matrix[i-1][j] < matrix[i][j-1])) {
                result.removed.push({ line: aLines[i-1], num: i });
                i--;
            } else {
                if (i > 0 && j > 0) {
                    result.modified.push({ removed: aLines[i-1], added: bLines[j-1], num: i });
                    i--; j--;
                }
            }
        }

        const total = aLines.length + bLines.length;
        const similarity = total > 0 ? Math.round((1 - (result.added.length + result.removed.length) / total) * 100) : 100;

        return { result, similarity, total };
    }

    function displayDiff(diff) {
        diffResults.style.display = 'block';
        diffOutput.innerHTML = '';
        
        addedCount.textContent = diff.result.added.length;
        removedCount.textContent = diff.result.removed.length;
        similarityPercent.textContent = diff.similarity + '%';
        
        let output = '';
        
        const allChanges = [...diff.result.removed, ...diff.result.added];
        const maxLines = Math.max(diff.result.removed.length, diff.result.added.length);
        
        const maxLen = Math.max(
            diff.result.removed.length,
            diff.result.added.length,
            diff.result.unchanged.length
        );

        output += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';
        output += '<div><strong>Your Solution</strong></div>';
        output += '<div><strong>Optimal Solution</strong></div>';
        
        let idx = 0;
        const removed = diff.result.removed.reverse();
        const added = diff.result.added.reverse();
        const unchanged = diff.result.unchanged.reverse();
        const modified = diff.result.modified.reverse();
        
        for (let i = 0; i < Math.max(removed.length, added.length, unchanged.length, modified.length); i++) {
            const rem = removed[i];
            const add = added[i];
            const mod = modified[i];
            const un = unchanged[i];
            
            if (un) {
                output += `<div class="diff-unchanged">${escapeHtml(un.line)}</div>`;
                output += `<div class="diff-unchanged">${escapeHtml(un.line)}</div>`;
            } else if (mod) {
                output += `<div class="diff-removed-line">- ${escapeHtml(mod.removed)}</div>`;
                output += `<div class="diff-added-line">+ ${escapeHtml(mod.added)}</div>`;
            } else if (rem) {
                output += `<div class="diff-removed-line">- ${escapeHtml(rem.line)}</div>`;
                output += `<div class="diff-empty"></div>`;
            } else if (add) {
                output += `<div class="diff-empty"></div>`;
                output += `<div class="diff-added-line">+ ${escapeHtml(add.line)}</div>`;
            }
        }
        
        output += '</div>';
        diffOutput.innerHTML = output;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function resetComparison() {
        userCode.textContent = '// Write your solution here...';
        diffResults.style.display = 'none';
        diffOutput.innerHTML = '';
        addedCount.textContent = '0';
        removedCount.textContent = '0';
        similarityPercent.textContent = '0%';
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-moon');
                icon.classList.toggle('fa-sun');
            }
        });
    }
});