/**
 * cp-patterns.js
 * Drives the Competitive Programming Patterns Library.
 * Handles dynamic content injection, navigation, and code formatting.
 */

document.addEventListener("DOMContentLoaded", () => {
    initLibrary();
});

// ==========================================
// 1. DATA: PATTERNS DATABASE
// ==========================================
const patternsData = [
    {
        id: "prefix-sum",
        title: "Prefix Sum",
        icon: "fa-plus-square",
        difficulty: "Easy",
        timeComplexity: "O(1) Queries, O(N) Precomputation",
        spaceComplexity: "O(N)",
        useCase: "Fast Range Sum Queries",
        description: "Prefix sum is a highly efficient technique to answer multiple range sum queries on an array in $O(1)$ time after a single $O(N)$ precomputation pass. The prefix sum array stores the cumulative sum of elements up to a given index.",
        code: `// 1D Prefix Sum Construction
vector<int> buildPrefixSum(const vector<int>& arr) {
    int n = arr.size();
    vector<int> pref(n + 1, 0); // 1-based indexing for safety
    for(int i = 0; i < n; i++) {
        pref[i + 1] = pref[i] + arr[i];
    }
    return pref;
}

// Query sum in range [L, R] (0-based indices)
int query(const vector<int>& pref, int L, int R) {
    return pref[R + 1] - pref[L];
}`
    },
    {
        id: "difference-array",
        title: "Difference Array",
        icon: "fa-arrows-alt-h",
        difficulty: "Medium",
        timeComplexity: "O(1) Updates, O(N) Evaluation",
        spaceComplexity: "O(N)",
        useCase: "Range Updates (Add/Sub)",
        description: "The Difference Array pattern allows you to apply multiple range addition/subtraction operations in $O(1)$ time per query. After all updates are queued, a single prefix sum pass computes the final array state in $O(N)$ time.",
        code: `// Difference Array Range Update
void addRange(vector<int>& diff, int L, int R, int val) {
    diff[L] += val;
    if (R + 1 < diff.size()) {
        diff[R + 1] -= val;
    }
}

// Reconstruct the final array
vector<int> reconstruct(const vector<int>& diff) {
    vector<int> res(diff.size());
    int currentSum = 0;
    for(int i = 0; i < diff.size(); i++) {
        currentSum += diff[i];
        res[i] = currentSum;
    }
    return res;
}`
    },
    {
        id: "sliding-window",
        title: "Sliding Window",
        icon: "fa-window-maximize",
        difficulty: "Medium",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        useCase: "Contiguous Subarray Problems",
        description: "Sliding Window transforms nested loops into a single loop to find optimal contiguous subarrays (e.g., longest substring, min sum array). It maintains a 'window' defined by left and right pointers that slide across the data.",
        code: `// Example: Longest Subarray with sum <= k
int longestSubarray(const vector<int>& arr, int k) {
    int n = arr.size();
    int left = 0, maxLength = 0;
    long long currentSum = 0;
    
    for(int right = 0; right < n; right++) {
        currentSum += arr[right];
        
        // Shrink window if invalid
        while(currentSum > k && left <= right) {
            currentSum -= arr[left];
            left++;
        }
        
        maxLength = max(maxLength, right - left + 1);
    }
    return maxLength;
}`
    },
    {
        id: "two-pointers",
        title: "Two Pointers",
        icon: "fa-hand-point-left",
        difficulty: "Easy",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        useCase: "Searching Sorted Data",
        description: "Two Pointers is commonly used on sorted arrays to find pairs satisfying a condition. By utilizing opposite-directional pointers (start and end), you can eliminate $O(N^2)$ brute force searches down to $O(N)$.",
        code: `// Example: Two Sum on a Sorted Array
vector<int> twoSum(const vector<int>& arr, int target) {
    int left = 0;
    int right = arr.size() - 1;
    
    while(left < right) {
        int sum = arr[left] + arr[right];
        if (sum == target) {
            return {left, right};
        } else if (sum < target) {
            left++; // Need a larger sum
        } else {
            right--; // Need a smaller sum
        }
    }
    return {-1, -1}; // Not found
}`
    },
    {
        id: "binary-search",
        title: "Binary Search (On Answer)",
        icon: "fa-search",
        difficulty: "Medium",
        timeComplexity: "O(N log(Max_Value))",
        spaceComplexity: "O(1)",
        useCase: "Optimization Problems (Min of Max)",
        description: "When a problem asks to 'minimize the maximum' or 'maximize the minimum', and the search space of the answer exhibits a monotonic property (e.g., F F F T T T), we can binary search directly on the answer.",
        code: `// Binary Search on Answer Template
bool isValid(int candidateAnswer) {
    // Implement monotonic condition check here
    return true; 
}

int binarySearchOnAnswer(int low, int high) {
    int ans = -1;
    while(low <= high) {
        int mid = low + (high - low) / 2;
        
        if (isValid(mid)) {
            ans = mid;      // Record possible answer
            high = mid - 1; // Try to find a smaller valid answer
        } else {
            low = mid + 1;  // Candidate too small, search right
        }
    }
    return ans;
}`
    },
    {
        id: "sweep-line",
        title: "Sweep Line Algorithm",
        icon: "fa-wave-square",
        difficulty: "Hard",
        timeComplexity: "O(N log N)",
        spaceComplexity: "O(N)",
        useCase: "Intervals & Geometric Overlaps",
        description: "Sweep Line is a geometric algorithm technique where a conceptual 'line' sweeps across the plane to process events (like interval starts/ends) sequentially. It's powerful for overlap counting and union area calculations.",
        code: `// Example: Max Overlapping Intervals
struct Event {
    int time, type; // type: +1 for start, -1 for end
    bool operator<(const Event& e) const {
        if (time != e.time) return time < e.time;
        return type < e.type; // Process ends before starts on ties
    }
};

int maxOverlaps(const vector<pair<int, int>>& intervals) {
    vector<Event> events;
    for(auto& i : intervals) {
        events.push_back({i.first, 1});
        events.push_back({i.second, -1});
    }
    
    sort(events.begin(), events.end());
    
    int currentActive = 0, maxActive = 0;
    for(auto& ev : events) {
        currentActive += ev.type;
        maxActive = max(maxActive, currentActive);
    }
    return maxActive;
}`
    },
    {
        id: "coord-compression",
        title: "Coordinate Compression",
        icon: "fa-compress-arrows-alt",
        difficulty: "Medium",
        timeComplexity: "O(N log N)",
        spaceComplexity: "O(N)",
        useCase: "Dense Mapping of Sparse Data",
        description: "When array values are extremely large (e.g., $10^9$) but you only care about their relative order, Coordinate Compression maps them down to the dense range $[1 \\dots N]$. This allows using arrays instead of hash maps for segment trees or frequency arrays.",
        code: `// Coordinate Compression Template
void compress(vector<int>& a) {
    vector<int> vals = a; // Copy original values
    
    // Sort and remove duplicates
    sort(vals.begin(), vals.end());
    vals.erase(unique(vals.begin(), vals.end()), vals.end());
    
    // Replace original values with their dense ranks (0-based)
    for(int i = 0; i < a.size(); i++) {
        a[i] = lower_bound(vals.begin(), vals.end(), a[i]) - vals.begin();
    }
}`
    },
    {
        id: "offline-queries",
        title: "Offline Queries",
        icon: "fa-box-open",
        difficulty: "Hard",
        timeComplexity: "O(Q log Q + Processing)",
        spaceComplexity: "O(Q)",
        useCase: "Non-dynamic Multi-Query Problems",
        description: "If a problem allows reading all queries beforehand without enforcing online responses, we can sort the queries (Offline Queries) to process them in a more optimal order (e.g., by right endpoint, or using Mo's Algorithm).",
        code: `// Offline Queries by Right Endpoint
struct Query {
    int L, R, id;
    bool operator<(const Query& other) const {
        return R < other.R; // Sort by right endpoint
    }
};

vector<int> processOffline(vector<Query>& queries, const vector<int>& arr) {
    sort(queries.begin(), queries.end());
    vector<int> answers(queries.size());
    
    int currentR = -1;
    // Data structure like Fenwick/Segment Tree goes here
    
    for(auto& q : queries) {
        while(currentR < q.R) {
            currentR++;
            // add arr[currentR] to data structure
        }
        // compute answer for range [q.L, q.R]
        // answers[q.id] = queryDataStructure(q.L);
    }
    return answers;
}`
    },
    {
        id: "digit-dp",
        title: "Digit DP",
        icon: "fa-sort-numeric-up-alt",
        difficulty: "Hard",
        timeComplexity: "O(Digits * States)",
        spaceComplexity: "O(Digits * States)",
        useCase: "Counting Numbers in Range [L, R]",
        description: "Digit DP is used to find the number of integers in a range $[L, R]$ that satisfy a certain property. It builds the number digit-by-digit using memoization, tracking if the current prefix is strictly bounded ('tight') by the upper limit.",
        code: `// Digit DP Base Template
long long dp[20][2][...]; // [index][isTight][states...]

long long solve(string& num, int idx, bool tight, int state) {
    if (idx == num.length()) {
        return /* 1 if valid state, else 0 */;
    }
    
    if (dp[idx][tight][state] != -1) 
        return dp[idx][tight][state];
        
    int limit = tight ? (num[idx] - '0') : 9;
    long long ans = 0;
    
    for(int digit = 0; digit <= limit; digit++) {
        bool newTight = tight && (digit == limit);
        int newState = /* update state based on digit */;
        ans += solve(num, idx + 1, newTight, newState);
    }
    
    return dp[idx][tight][state] = ans;
}`
    },
    {
        id: "sos-dp",
        title: "Sum Over Subsets (SOS DP)",
        icon: "fa-project-diagram",
        difficulty: "Elite",
        timeComplexity: "O(N * 2^N)",
        spaceComplexity: "O(2^N)",
        useCase: "Bitmask DP and Submask Sums",
        description: "SOS DP elegantly calculates the sum over all subsets of a bitmask in $O(N \cdot 2^N)$ time instead of the naive $O(3^N)$. It treats bitmasks as dimensions in a hypercube and accumulates sums iteratively across bits.",
        code: `// SOS DP Template
void sosDP(vector<int>& F, int N) {
    // F is an array of size 2^N
    // F[mask] initially holds the value of the mask itself.
    // We want F[mask] = sum(A[i]) for all i that are submasks of mask.
    
    for(int i = 0; i < N; ++i) {
        for(int mask = 0; mask < (1 << N); ++mask) {
            if(mask & (1 << i)) {
                // If the i-th bit is ON, add the value from the 
                // state where the i-th bit is OFF
                F[mask] += F[mask ^ (1 << i)];
            }
        }
    }
}`
    }
];

// ==========================================
// 2. UI ORCHESTRATION
// ==========================================

const els = {
    patternNav: document.getElementById('patternNav'),
    
    // Content Elements
    patternTitle: document.getElementById('patternTitle'),
    patternDifficulty: document.getElementById('patternDifficulty'),
    patternDesc: document.getElementById('patternDesc'),
    
    metricsGrid: document.getElementById('metricsGrid'),
    timeComplexity: document.getElementById('timeComplexity'),
    spaceComplexity: document.getElementById('spaceComplexity'),
    useCase: document.getElementById('useCase'),
    
    codeSection: document.getElementById('codeSection'),
    codeTemplate: document.getElementById('codeTemplate'),
    btnCopyCode: document.getElementById('btnCopyCode')
};

function initLibrary() {
    renderSidebar();
    bindEvents();
    
    // Auto-select first item
    if (patternsData.length > 0) {
        selectPattern(patternsData[0].id);
    }
}

function renderSidebar() {
    els.patternNav.innerHTML = '';
    
    patternsData.forEach(p => {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.id = `nav-${p.id}`;
        li.innerHTML = `<i class="fas ${p.icon}"></i> ${p.title}`;
        
        li.addEventListener('click', () => selectPattern(p.id));
        els.patternNav.appendChild(li);
    });
}

function selectPattern(patternId) {
    // Update active state in sidebar
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeNav = document.getElementById(`nav-${patternId}`);
    if (activeNav) activeNav.classList.add('active');

    // Retrieve data
    const data = patternsData.find(p => p.id === patternId);
    if (!data) return;

    // Reveal hidden sections
    els.metricsGrid.classList.remove('hidden');
    els.codeSection.classList.remove('hidden');

    // Inject Content
    els.patternTitle.textContent = data.title;
    
    els.patternDifficulty.textContent = data.difficulty;
    // Color code difficulty
    if (data.difficulty === "Easy") els.patternDifficulty.style.color = "var(--cp-success)", els.patternDifficulty.style.borderColor = "var(--cp-success)";
    else if (data.difficulty === "Medium") els.patternDifficulty.style.color = "var(--cp-primary)", els.patternDifficulty.style.borderColor = "var(--cp-primary)";
    else els.patternDifficulty.style.color = "var(--cp-accent)", els.patternDifficulty.style.borderColor = "var(--cp-accent)";

    // Format Math in Description (Quick Regex to wrap $...$ in a monospace span)
    let formattedDesc = data.description.replace(/\$(.*?)\$/g, '<code style="color: #a5b4fc; background: transparent; padding: 0;">$1</code>');
    els.patternDesc.innerHTML = formattedDesc;

    els.timeComplexity.innerHTML = data.timeComplexity.replace(/O\((.*?)\)/g, 'O(<code>$1</code>)');
    els.spaceComplexity.innerHTML = data.spaceComplexity.replace(/O\((.*?)\)/g, 'O(<code>$1</code>)');
    els.useCase.textContent = data.useCase;

    // Inject and mock-highlight code
    els.codeTemplate.innerHTML = mockSyntaxHighlight(data.code);
    
    // Reset copy button
    els.btnCopyCode.innerHTML = '<i class="fas fa-copy"></i>';
    els.btnCopyCode.style.color = '#94a3b8';
}

function bindEvents() {
    els.btnCopyCode.addEventListener('click', () => {
        const activeItem = document.querySelector('.nav-item.active');
        if (!activeItem) return;
        
        const patternId = activeItem.id.replace('nav-', '');
        const data = patternsData.find(p => p.id === patternId);
        
        navigator.clipboard.writeText(data.code).then(() => {
            els.btnCopyCode.innerHTML = '<i class="fas fa-check"></i>';
            els.btnCopyCode.style.color = 'var(--cp-success)';
            setTimeout(() => {
                els.btnCopyCode.innerHTML = '<i class="fas fa-copy"></i>';
                els.btnCopyCode.style.color = '#94a3b8';
            }, 2000);
        });
    });
}

// Very basic regex-based syntax highlighter for C++ presentation
function mockSyntaxHighlight(code) {
    let highlighted = code
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/(\/\/.*)/g, '<span class="code-comment">$1</span>') // Comments
        .replace(/\b(int|long|void|bool|auto|vector|pair|struct|const)\b/g, '<span class="code-type">$1</span>') // Types
        .replace(/\b(for|while|if|else|return|break|continue)\b/g, '<span class="code-keyword">$1</span>') // Keywords
        .replace(/([a-zA-Z0-9_]+)(?=\()/g, '<span class="code-func">$1</span>'); // Functions
        
    return highlighted;
}
