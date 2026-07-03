/* ─────────────────────────────────────────────
   Spatial Complexity Profiler JavaScript
   ───────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
    initHeroTyping();
    initProfiler();
});

function initHeroTyping() {
    const el = document.getElementById("typingTextVisualizer");
    if (!el) return;

    const words = [
        "Track Recursive Stack Depth",
        "Visualize Heap Array Allocation",
        "Generate Code Execution Heatmaps",
        "Master Space Complexity Analysis"
    ];

    let wordIdx = 0;
    let charIdx = 0;
    let isDeleting = false;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
        el.textContent = words[0];
        return;
    }

    function tick() {
        const current = words[wordIdx];

        if (isDeleting) {
            el.textContent = current.substring(0, charIdx - 1);
            charIdx--;
        } else {
            el.textContent = current.substring(0, charIdx + 1);
            charIdx++;
        }

        let speed = isDeleting ? 40 : 80;

        if (!isDeleting && charIdx === current.length) {
            speed = 1800;
            isDeleting = true;
        } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            wordIdx = (wordIdx + 1) % words.length;
            speed = 400;
        }

        requestAnimationFrame(() => setTimeout(tick, speed));
    }

    tick();
}

/* ─────────────────────────────────────────────
   Complexity Trace Generators
   ───────────────────────────────────────────── */
function* fibRecursiveGen(n) {
    let lineCounts = {};
    let stack = [];
    let peakStack = 0;
    
    function incLine(idx) {
        lineCounts[idx] = (lineCounts[idx] || 0) + 1;
    }
    
    function* fib(val) {
        const frame = { name: `fib(${val})` };
        stack.push(frame);
        if (stack.length > peakStack) peakStack = stack.length;
        
        incLine(0); // function header
        yield { lineIndex: 0, lineCounts: {...lineCounts}, stack: [...stack], heap: [], peakStack, peakHeap: 0 };

        incLine(1); // if (val <= 1)
        yield { lineIndex: 1, lineCounts: {...lineCounts}, stack: [...stack], heap: [], peakStack, peakHeap: 0 };
        if (val <= 1) {
            incLine(2); // return val;
            yield { lineIndex: 2, lineCounts: {...lineCounts}, stack: [...stack], heap: [], peakStack, peakHeap: 0 };
            stack.pop();
            return val;
        }

        incLine(4); // return fib(val - 1) + fib(val - 2)
        yield { lineIndex: 4, lineCounts: {...lineCounts}, stack: [...stack], heap: [], peakStack, peakHeap: 0 };
        
        const a = yield* fib(val - 1);
        const b = yield* fib(val - 2);
        
        stack.pop();
        return a + b;
    }
    
    yield* fib(n);
}

function* fibIterativeGen(n) {
    let lineCounts = {};
    let stack = [{ name: `fibIterative(${n})` }];
    let heap = [];
    let peakStack = 1;
    let peakHeap = 0;
    
    function incLine(idx) {
        lineCounts[idx] = (lineCounts[idx] || 0) + 1;
    }
    
    incLine(0);
    yield { lineIndex: 0, lineCounts: {...lineCounts}, stack: [...stack], heap: [...heap], peakStack, peakHeap };
    
    incLine(1);
    heap.push({ name: "fibArray", size: 2 });
    peakHeap = 2;
    yield { lineIndex: 1, lineCounts: {...lineCounts}, stack: [...stack], heap: JSON.parse(JSON.stringify(heap)), peakStack, peakHeap };
    
    for (let i = 2; i <= n; i++) {
        incLine(2);
        yield { lineIndex: 2, lineCounts: {...lineCounts}, stack: [...stack], heap: JSON.parse(JSON.stringify(heap)), peakStack, peakHeap };
        
        incLine(3);
        heap[0].size = i + 1;
        if (heap[0].size > peakHeap) peakHeap = heap[0].size;
        yield { lineIndex: 3, lineCounts: {...lineCounts}, stack: [...stack], heap: JSON.parse(JSON.stringify(heap)), peakStack, peakHeap };
    }
    
    incLine(5);
    yield { lineIndex: 5, lineCounts: {...lineCounts}, stack: [...stack], heap: JSON.parse(JSON.stringify(heap)), peakStack, peakHeap };
}

function* mergeSortGen(arr) {
    let lineCounts = {};
    let stack = [];
    let heap = [];
    let peakStack = 0;
    let peakHeap = 0;

    function incLine(idx) {
        lineCounts[idx] = (lineCounts[idx] || 0) + 1;
    }

    function* sort(subArr, name = "mergeSort") {
        stack.push({ name: `${name}(size: ${subArr.length})` });
        if (stack.length > peakStack) peakStack = stack.length;

        incLine(0);
        yield { lineIndex: 0, lineCounts: {...lineCounts}, stack: [...stack], heap: JSON.parse(JSON.stringify(heap)), peakStack, peakHeap };

        incLine(1);
        yield { lineIndex: 1, lineCounts: {...lineCounts}, stack: [...stack], heap: JSON.parse(JSON.stringify(heap)), peakStack, peakHeap };
        if (subArr.length <= 1) {
            stack.pop();
            return subArr;
        }

        incLine(3);
        yield { lineIndex: 3, lineCounts: {...lineCounts}, stack: [...stack], heap: JSON.parse(JSON.stringify(heap)), peakStack, peakHeap };
        const mid = Math.floor(subArr.length / 2);

        const left = yield* sort(subArr.slice(0, mid), "leftPart");
        const right = yield* sort(subArr.slice(mid), "rightPart");

        incLine(6);
        const tempHeapIdx = heap.push({ name: "tempMergeArray", size: subArr.length }) - 1;
        if (subArr.length > peakHeap) peakHeap = subArr.length;
        yield { lineIndex: 6, lineCounts: {...lineCounts}, stack: [...stack], heap: JSON.parse(JSON.stringify(heap)), peakStack, peakHeap };

        const merged = [];
        let lIdx = 0, rIdx = 0;
        while (lIdx < left.length && rIdx < right.length) {
            if (left[lIdx] < right[rIdx]) merged.push(left[lIdx++]);
            else merged.push(right[rIdx++]);
        }
        while (lIdx < left.length) merged.push(left[lIdx++]);
        while (rIdx < right.length) merged.push(right[rIdx++]);

        heap.splice(tempHeapIdx, 1);
        stack.pop();
        return merged;
    }

    yield* sort(arr);
}

function* quickSortGen(arr) {
    let lineCounts = {};
    let stack = [];
    let heap = [{ name: "inPlaceArray", size: arr.length }];
    let peakStack = 0;
    let peakHeap = arr.length;

    function incLine(idx) {
        lineCounts[idx] = (lineCounts[idx] || 0) + 1;
    }

    function* qsort(left, right) {
        stack.push({ name: `qsort(L: ${left}, R: ${right})` });
        if (stack.length > peakStack) peakStack = stack.length;

        incLine(0);
        yield { lineIndex: 0, lineCounts: {...lineCounts}, stack: [...stack], heap: JSON.parse(JSON.stringify(heap)), peakStack, peakHeap };

        incLine(1);
        yield { lineIndex: 1, lineCounts: {...lineCounts}, stack: [...stack], heap: JSON.parse(JSON.stringify(heap)), peakStack, peakHeap };
        if (left >= right) {
            stack.pop();
            return;
        }

        incLine(3);
        yield { lineIndex: 3, lineCounts: {...lineCounts}, stack: [...stack], heap: JSON.parse(JSON.stringify(heap)), peakStack, peakHeap };
        
        let pivot = arr[right];
        let i = left;
        for (let j = left; j < right; j++) {
            incLine(4);
            yield { lineIndex: 4, lineCounts: {...lineCounts}, stack: [...stack], heap: JSON.parse(JSON.stringify(heap)), peakStack, peakHeap };
            if (arr[j] < pivot) {
                let temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
                i++;
            }
        }
        let temp = arr[i];
        arr[i] = arr[right];
        arr[right] = temp;

        const pivotIdx = i;

        yield* qsort(left, pivotIdx - 1);
        yield* qsort(pivotIdx + 1, right);

        stack.pop();
    }

    yield* qsort(0, arr.length - 1);
}

/* ─────────────────────────────────────────────
   Profiler UI Initialization
   ───────────────────────────────────────────── */
const ALGORITHMS = [
    {
        id: "fib_recursive",
        name: "Fibonacci (Recursive)",
        complexity: "O(N)",
        codeText: `function fibRecursive(n) {
    if (n <= 1) {
        return n;
    }
    return fibRecursive(n - 1) + fibRecursive(n - 2);
}`,
        getGenerator: (n) => fibRecursiveGen(n),
        insights: "Recursive Fibonacci pushes call frames onto the execution stack. At N=5, it reaches a peak stack depth of 4. Since it makes duplicate calls, it has O(2^N) exponential time but O(N) space."
    },
    {
        id: "fib_iterative",
        name: "Fibonacci (Iterative)",
        complexity: "O(1) stack, O(N) heap",
        codeText: `function fibIterative(n) {
    let fib = [0, 1];
    for (let i = 2; i <= n; i++) {
        fib[i] = fib[i-1] + fib[i-2];
    }
    return fib[n];
}`,
        getGenerator: (n) => fibIterativeGen(n),
        insights: "Iterative Fibonacci uses a single call stack frame throughout execution. It allocates an auxiliary array of size N+1 in heap memory, resulting in O(N) space and O(N) time."
    },
    {
        id: "merge_sort",
        name: "Merge Sort",
        complexity: "O(log N) stack, O(N) heap",
        codeText: `function mergeSort(arr) {
    if (arr.length <= 1) {
        return arr;
    }
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    return merge(left, right);
}`,
        getGenerator: (n) => {
            const arr = Array.from({ length: n }, (_, i) => n - i);
            return mergeSortGen(arr);
        },
        insights: "Merge Sort splits arrays recursively, reaching a stack depth of O(log N). During the merge step, it allocates an auxiliary temp array of size N on the heap, making space complexity O(N)."
    },
    {
        id: "quick_sort",
        name: "Quick Sort",
        complexity: "O(log N) stack, O(1) heap",
        codeText: `function quickSort(arr, left, right) {
    if (left >= right) {
        return;
    }
    let pivot = partition(arr, left, right);
    quickSort(arr, left, pivot - 1);
    quickSort(arr, pivot + 1, right);
}`,
        getGenerator: (n) => {
            const arr = Array.from({ length: n }, (_, i) => n - i);
            return quickSortGen(arr);
        },
        insights: "Quick Sort sorts the array in-place, meaning auxiliary heap allocation is O(1). The recursive stack depth averages O(log N), making it highly space-efficient compared to Merge Sort."
    }
];

function initProfiler() {
    let activeAlgoIdx = 0;
    let inputSize = 5;
    
    let history = [];
    let currentStepIdx = -1;
    let isPlaying = false;
    let playTimer = null;
    let speed = 800;

    // DOM Elements
    const algorithmList = document.getElementById("algorithm-list");
    const editorCodeWindow = document.getElementById("editor-code-window");
    
    const inputSizeEl = document.getElementById("input-size");
    const btnApplySize = document.getElementById("btn-apply-size");

    const btnPrev = document.getElementById("btn-prev");
    const btnPlay = document.getElementById("btn-play");
    const btnNext = document.getElementById("btn-next");
    const speedSlider = document.getElementById("speed-slider");
    const speedVal = document.getElementById("speed-val");

    const metricStackPeak = document.getElementById("metric-stack-peak");
    const metricHeapPeak = document.getElementById("metric-heap-peak");
    const metricComplexity = document.getElementById("metric-complexity");

    const aiSpeech = document.getElementById("ai-speech");
    const stackFrameContainer = document.getElementById("stack-frame-container");
    const heapAllocationContainer = document.getElementById("heap-allocation-container");

    function loadAlgorithm(index) {
        pauseAutoPlay();
        activeAlgoIdx = index;
        const algo = ALGORITHMS[index];

        // Update active class on sidebar buttons
        buildAlgorithmSelector();

        // Render code
        renderCodeTemplate(algo.codeText);

        // Reset metrics
        metricComplexity.innerText = algo.complexity;

        // Compile history
        compileTraceHistory();
    }

    function buildAlgorithmSelector() {
        algorithmList.innerHTML = '';
        ALGORITHMS.forEach((algo, idx) => {
            const btn = document.createElement("button");
            btn.className = `btn-algo ${idx === activeAlgoIdx ? 'active' : ''}`;
            btn.innerHTML = `<span>${algo.name}</span><i class="fas ${idx === activeAlgoIdx ? 'fa-play-circle' : 'fa-code'}"></i>`;
            btn.addEventListener("click", () => {
                loadAlgorithm(idx);
            });
            algorithmList.appendChild(btn);
        });
    }

    function syntaxHighlight(codeText) {
        const lines = codeText.split("\n");
        return lines.map(line => {
            let escaped = line
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            
            if (escaped.includes("//")) {
                const idx = escaped.indexOf("//");
                const code = escaped.substring(0, idx);
                const comment = escaped.substring(idx);
                return highlightKeywords(code) + `<span class="comment">${comment}</span>`;
            }
            return highlightKeywords(escaped);
        });
    }

    function highlightKeywords(text) {
        const keywords = ["function", "let", "const", "var", "return", "while", "for", "if", "else", "throw", "new", "Error"];
        const builtins = ["Math.floor", "Math.max", "slice", "push", "splice"];
        
        let result = text;
        keywords.forEach(kw => {
            const regex = new RegExp(`\\b${kw}\\b`, 'g');
            result = result.replace(regex, `<span class="keyword">${kw}</span>`);
        });

        builtins.forEach(bi => {
            const regex = new RegExp(`\\b${bi}\\b`, 'g');
            result = result.replace(regex, `<span class="builtin">${bi}</span>`);
        });

        result = result.replace(/\b\d+\b/g, `<span class="number">$&</span>`);
        return result;
    }

    function renderCodeTemplate(codeText) {
        editorCodeWindow.innerHTML = '';
        const highlightedLines = syntaxHighlight(codeText);

        highlightedLines.forEach((lineHtml, lineIdx) => {
            const row = document.createElement("div");
            row.className = "code-line";
            row.id = `line-${lineIdx}`;

            const numCol = document.createElement("span");
            numCol.className = "line-number";
            numCol.innerText = lineIdx + 1;

            const textCol = document.createElement("span");
            textCol.className = "line-content";
            textCol.innerHTML = lineHtml;

            const countBubble = document.createElement("span");
            countBubble.className = "exec-count";
            countBubble.innerText = "x0";

            row.appendChild(numCol);
            row.appendChild(textCol);
            row.appendChild(countBubble);

            editorCodeWindow.appendChild(row);
        });
    }

    function compileTraceHistory() {
        const algo = ALGORITHMS[activeAlgoIdx];
        const generator = algo.getGenerator(inputSize);

        history = [];
        let step = generator.next();
        while (!step.done) {
            history.push(step.value);
            step = generator.next();
        }

        showStep(0);
    }

    function showStep(index) {
        if (index < 0 || index >= history.length) return;
        currentStepIdx = index;
        const state = history[index];

        // 1. Update metric peaks
        metricStackPeak.innerText = state.peakStack;
        metricHeapPeak.innerText = state.peakHeap;

        // 2. Render Heatmap Code Line execution HSL values
        updateCodeHeatmap(state);

        // 3. Render Call Stack
        updateCallStack(state.stack);

        // 4. Render Heap space allocations
        updateHeapSpace(state.heap);

        // 5. Update controls
        btnPrev.disabled = index === 0;
        btnNext.disabled = index === history.length - 1;

        if (index === history.length - 1 && isPlaying) {
            pauseAutoPlay();
        }

        // 6. AI Dialogue comments
        updateAiInsights(state);
    }

    function updateCodeHeatmap(state) {
        // Clear all active line selections
        document.querySelectorAll(".code-line").forEach(line => {
            line.classList.remove("active-line");
        });

        // Set active line
        const activeLine = document.getElementById(`line-${state.lineIndex}`);
        if (activeLine) {
            activeLine.classList.add("active-line");
        }

        // Render line execution counts and heatmap backgrounds
        // Find max execution count
        const counts = state.lineCounts;
        const maxVal = Math.max(...Object.values(counts), 1);

        Object.keys(counts).forEach(lineIdx => {
            const line = document.getElementById(`line-${lineIdx}`);
            if (line) {
                const count = counts[lineIdx];
                line.classList.add("has-runs");
                line.querySelector(".exec-count").innerText = `x${count}`;

                // Compute HSL scale: green HSL(120) for 1 run, red HSL(0) for heavy runs (capped at 12 runs)
                const intensity = Math.min(1, count / 12);
                const hue = Math.max(0, 120 - intensity * 120);

                line.style.backgroundColor = `hsla(${hue}, 80%, 40%, 0.12)`;
                line.style.borderLeft = `3px solid hsl(${hue}, 80%, 50%)`;
            }
        });
    }

    function updateCallStack(stack) {
        stackFrameContainer.innerHTML = '';
        if (stack.length === 0) {
            stackFrameContainer.innerHTML = '<div class="empty-state">Stack Empty</div>';
            return;
        }

        stack.forEach(frame => {
            const card = document.createElement("div");
            card.className = "stack-frame-card";
            card.innerText = frame.name;
            stackFrameContainer.appendChild(card);
        });
    }

    function updateHeapSpace(heap) {
        heapAllocationContainer.innerHTML = '';
        if (heap.length === 0) {
            heapAllocationContainer.innerHTML = '<div class="empty-state">Heap Empty</div>';
            return;
        }

        heap.forEach(heapVar => {
            const card = document.createElement("div");
            card.className = "heap-array-card";
            
            const meta = document.createElement("div");
            meta.className = "heap-array-meta";
            meta.innerHTML = `<span>${heapVar.name}</span><span>Size: ${heapVar.size}</span>`;
            card.appendChild(meta);

            const grid = document.createElement("div");
            grid.className = "heap-grid-blocks";

            // Inject block cells representing memory indices
            for (let i = 0; i < heapVar.size; i++) {
                const block = document.createElement("div");
                block.className = "heap-memory-block";
                grid.appendChild(block);
            }

            card.appendChild(grid);
            heapAllocationContainer.appendChild(card);
        });
    }

    function updateAiInsights(state) {
        const algo = ALGORITHMS[activeAlgoIdx];
        if (currentStepIdx === history.length - 1) {
            // End of execution
            aiSpeech.innerText = algo.insights;
        } else {
            // Middle execution triggers
            if (state.stack.length > 3) {
                aiSpeech.innerText = `Call stack growing deep! Active recursion stack reached depth of ${state.stack.length}. Frame pushes consume O(1) auxiliary space each.`;
            } else if (state.heap.length > 0 && state.heap[0].size > 2) {
                aiSpeech.innerText = `Heap allocation detected! Array variable "${state.heap[0].name}" has allocated auxiliary space of size ${state.heap[0].size}.`;
            } else {
                aiSpeech.innerText = `Stepping through line ${state.lineIndex + 1}. Note how loop iterations will increase execution frequency count (turning lines red on the heatmap).`;
            }
        }
    }

    // Auto Play loop
    function startAutoPlay() {
        if (history.length === 0) return;
        isPlaying = true;
        btnPlay.innerHTML = '<i class="fas fa-pause"></i>';

        if (currentStepIdx === history.length - 1) {
            currentStepIdx = -1;
        }

        playTimer = setInterval(() => {
            if (currentStepIdx < history.length - 1) {
                showStep(currentStepIdx + 1);
            } else {
                pauseAutoPlay();
            }
        }, speed);
    }

    function pauseAutoPlay() {
        isPlaying = false;
        btnPlay.innerHTML = '<i class="fas fa-play"></i>';
        if (playTimer) {
            clearInterval(playTimer);
            playTimer = null;
        }
    }

    // Bind Listeners
    btnApplySize.addEventListener("click", () => {
        const sizeVal = parseInt(inputSizeEl.value);
        const algoId = ALGORITHMS[activeAlgoIdx].id;

        // Custom bounds for Fibonacci to avoid call stack limits
        const maxLimit = algoId.includes("fib") ? 10 : 12;

        if (isNaN(sizeVal) || sizeVal < 1 || sizeVal > maxLimit) {
            alert(`Please enter a valid input size N between 1 and ${maxLimit}.`);
            return;
        }

        inputSize = sizeVal;
        pauseAutoPlay();
        compileTraceHistory();
    });

    btnPrev.addEventListener("click", () => {
        pauseAutoPlay();
        if (currentStepIdx > 0) {
            showStep(currentStepIdx - 1);
        }
    });

    btnNext.addEventListener("click", () => {
        pauseAutoPlay();
        if (currentStepIdx < history.length - 1) {
            showStep(currentStepIdx + 1);
        }
    });

    btnPlay.addEventListener("click", () => {
        if (isPlaying) {
            pauseAutoPlay();
        } else {
            startAutoPlay();
        }
    });

    speedSlider.addEventListener("input", (e) => {
        speed = parseInt(e.target.value);
        speedVal.innerText = `${speed}ms`;
        if (isPlaying) {
            pauseAutoPlay();
            startAutoPlay();
        }
    });

    // Initial load
    loadAlgorithm(0);
}
