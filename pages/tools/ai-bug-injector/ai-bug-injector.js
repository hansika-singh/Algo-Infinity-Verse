/* ─────────────────────────────────────────────
   AI Bug-Injector Code Deception Simulator
   ───────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
    initHeroTyping();
    initGame();
});

function initHeroTyping() {
    const el = document.getElementById("typingTextVisualizer");
    if (!el) return;

    const words = [
        "Spot Code Deceptions",
        "Write Failing Proof Tests",
        "Outsmart Decepto-AI",
        "Master Defensive Coding"
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
   Challenge Dictionary
   ───────────────────────────────────────────── */
const CHALLENGES = [
    {
        id: "binary_search",
        name: "Binary Search",
        correctText: `function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}`,
        buggyText: `function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    let loopGuard = 0;
    while (left < right) {
        if (++loopGuard > 1000) throw new Error("Infinite loop detected!");
        let mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}`,
        bugLineIndex: 4, // "while (left < right) {"
        inputs: [
            { id: "bs-arr", name: "Array (JSON)", placeholder: "[1, 3, 5, 7, 9]", default: "[1, 2, 3, 4, 5]" },
            { id: "bs-target", name: "Target", placeholder: "5", default: "5" }
        ],
        parseArgs: () => {
            const arr = JSON.parse(document.getElementById("bs-arr").value);
            const target = parseInt(document.getElementById("bs-target").value);
            if (!Array.isArray(arr)) throw new Error("First argument must be an array.");
            if (isNaN(target)) throw new Error("Target must be a number.");
            return [arr, target];
        },
        verifyFailure: (correctRes, buggyRes) => {
            return correctRes !== buggyRes;
        }
    },
    {
        id: "two_sum",
        name: "Two Sum (Sorted Array)",
        correctText: `function twoSum(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    while (left < right) {
        let sum = arr[left] + arr[right];
        if (sum === target) {
            return [left, right];
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
    return null;
}`,
        buggyText: `function twoSum(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    while (left <= right) {
        let sum = arr[left] + arr[right];
        if (sum === target) {
            return [left, right];
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
    return null;
}`,
        bugLineIndex: 3, // "while (left <= right) {"
        inputs: [
            { id: "ts-arr", name: "Sorted Array (JSON)", placeholder: "[2, 3, 5, 8]", default: "[2, 3, 5, 8]" },
            { id: "ts-target", name: "Target Sum", placeholder: "6", default: "6" }
        ],
        parseArgs: () => {
            const arr = JSON.parse(document.getElementById("ts-arr").value);
            const target = parseInt(document.getElementById("ts-target").value);
            if (!Array.isArray(arr)) throw new Error("First argument must be an array.");
            if (isNaN(target)) throw new Error("Target must be a number.");
            return [arr, target];
        },
        verifyFailure: (correctRes, buggyRes) => {
            if (correctRes === null && Array.isArray(buggyRes)) {
                return buggyRes[0] === buggyRes[1]; // reused same index element
            }
            return JSON.stringify(correctRes) !== JSON.stringify(buggyRes);
        }
    },
    {
        id: "bubble_sort",
        name: "Bubble Sort",
        correctText: `function bubbleSort(arr) {
    let n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    return arr;
}`,
        buggyText: `function bubbleSort(arr) {
    let n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 2; j++) {
            if (arr[j] > arr[j + 1]) {
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    return arr;
}`,
        bugLineIndex: 3, // "for (let j = 0; j < n - i - 2; j++) {"
        inputs: [
            { id: "bsort-arr", name: "Unsorted Array (JSON)", placeholder: "[5, 4, 3, 2, 1]", default: "[5, 4, 3, 2, 1]" }
        ],
        parseArgs: () => {
            const arr = JSON.parse(document.getElementById("bsort-arr").value);
            if (!Array.isArray(arr)) throw new Error("Argument must be an array.");
            return [arr];
        },
        verifyFailure: (correctRes, buggyRes) => {
            return JSON.stringify(correctRes) !== JSON.stringify(buggyRes);
        }
    },
    {
        id: "is_palindrome",
        name: "Palindrome Check",
        correctText: `function isPalindrome(str) {
    let clean = str.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    let left = 0;
    let right = clean.length - 1;
    while (left < right) {
        if (clean[left] !== clean[right]) {
            return false;
        }
        left++;
        right--;
    }
    return true;
}`,
        buggyText: `function isPalindrome(str) {
    let clean = str.replace(/[^a-zA-Z]/g, "").toLowerCase();
    let left = 0;
    let right = clean.length - 1;
    while (left < right) {
        if (clean[left] !== clean[right]) {
            return false;
        }
        left++;
        right--;
    }
    return true;
}`,
        bugLineIndex: 1, // "let clean = str.replace(/[^a-zA-Z]/g, "").toLowerCase();"
        inputs: [
            { id: "pal-str", name: "Input String", placeholder: "race1car", default: "race1car" }
        ],
        parseArgs: () => {
            const str = document.getElementById("pal-str").value;
            if (typeof str !== 'string') throw new Error("Input must be a string.");
            return [str];
        },
        verifyFailure: (correctRes, buggyRes) => {
            return correctRes !== buggyRes;
        }
    }
];

/* ─────────────────────────────────────────────
   Game Controller Logic
   ───────────────────────────────────────────── */
function initGame() {
    let currentChallengeIdx = 0;
    let score = 1000;
    let multiplier = 1.0;
    let timeLeft = 120;
    let maxTime = 120;
    let timerInterval = null;

    let isBugSpotted = false;
    let isChallengeCleared = false;

    // DOM selectors
    const challengeListContainer = document.getElementById("challenge-list");
    const editorCodeWindow = document.getElementById("editor-code-window");
    const editorStatus = document.getElementById("editor-status-banner");
    
    const testProofSection = document.getElementById("test-proof-section");
    const proofStatusBadge = document.getElementById("proof-status-badge");
    const inputsWrapper = document.getElementById("inputs-wrapper");
    const btnRunProof = document.getElementById("btn-run-proof");
    const terminalConsole = document.getElementById("terminal-console");

    const gameScoreEl = document.getElementById("game-score");
    const gameMultiplierEl = document.getElementById("game-multiplier");
    const gameTimerEl = document.getElementById("game-timer");
    const timerProgress = document.getElementById("timer-progress");

    const aiSpeech = document.getElementById("ai-speech");
    const aiStatus = document.getElementById("ai-status-indicator");
    const btnReset = document.getElementById("btn-reset-game");

    const aiDialogues = {
        load: [
            "I've injected a nasty defect in this code. Care to click on it?",
            "Can you spot my logical error before your servers crash?",
            "A small typo is all it takes to trigger chaos. Let's see you find it!"
        ],
        incorrectClick: [
            "Ha! That line is completely clean. Click again, amateur!",
            "Wrong line! Check your boundary limits.",
            "Nope. That statement evaluates perfectly. Penalty applied!"
        ],
        correctClick: [
            "Impudent human! You spotted my line. But can you PROVE it with a failing test case?",
            "Okay, you found the typo. Now feed my bug an input that actually triggers a failure!",
            "Spotting it is only half the battle. Write a test to expose the difference!"
        ],
        testSuccess: [
            "Argh! Your test case exposed the flaw. My code lies defeated!",
            "No! That input triggers the error. You beat my deception!",
            "Challenge solved. You are a defensive testing wizard."
        ],
        testFailure: [
            "Your test input is too weak! My buggy variant handled it just fine.",
            "That input produces identical output. Try again, think of edge cases!",
            "Failed! My bug remains concealed. Think of boundary conditions!"
        ],
        timeout: [
            "Time's up! Production is offline. Better luck next time!",
            "You ran out of time. My bug wins this round!"
        ]
    };

    function selectRandomDialogue(category) {
        const list = aiDialogues[category];
        return list[Math.floor(Math.random() * list.length)];
    }

    function buildChallengeSelector() {
        challengeListContainer.innerHTML = '';
        CHALLENGES.forEach((challenge, idx) => {
            const btn = document.createElement("button");
            btn.className = `btn-challenge ${idx === currentChallengeIdx ? 'active' : ''}`;
            btn.innerHTML = `<span>${challenge.name}</span><i class="fas ${idx === currentChallengeIdx ? 'fa-play-circle' : 'fa-lock-open'}"></i>`;
            btn.addEventListener("click", () => {
                loadChallenge(idx);
            });
            challengeListContainer.appendChild(btn);
        });
    }

    function loadChallenge(index) {
        clearInterval(timerInterval);
        currentChallengeIdx = index;
        isBugSpotted = false;
        isChallengeCleared = false;
        score = 1000;
        multiplier = 1.0;
        timeLeft = 120;

        // Update UI Dashboard
        buildChallengeSelector();
        gameScoreEl.innerText = score;
        gameMultiplierEl.innerText = `${multiplier.toFixed(1)}x`;
        gameTimerEl.innerText = `${timeLeft}s`;
        timerProgress.style.width = "100%";
        timerProgress.classList.remove("warning");

        aiStatus.className = "ai-status glow-green";
        aiStatus.innerText = "Injected Defect";
        aiSpeech.innerText = selectRandomDialogue("load");

        // Lock test proof panel
        testProofSection.classList.add("locked");
        proofStatusBadge.innerText = "Locked";
        proofStatusBadge.style.borderColor = "#ef4444";
        proofStatusBadge.style.color = "#ef4444";
        btnRunProof.disabled = true;

        editorStatus.innerHTML = `<i class="fas fa-search"></i> STEP 1: Scan the code and click on the logical bug line.`;
        terminalConsole.innerHTML = `[SYSTEM]: Console ready. Awaiting bug line selection to unlock testing suite.`;

        // Render code
        renderCodeTemplate(CHALLENGES[index].buggyText);

        // Inject dynamic input form fields
        buildInputForm(CHALLENGES[index].inputs);

        // Start countdown timer
        startCountdown();
    }

    function buildInputForm(inputs) {
        inputsWrapper.innerHTML = '';
        inputs.forEach(input => {
            const group = document.createElement("div");
            group.className = "input-group";
            group.innerHTML = `
                <label for="${input.id}">${input.name}</label>
                <input type="text" id="${input.id}" placeholder="${input.placeholder}" value="${input.default}" />
            `;
            inputsWrapper.appendChild(group);
        });
    }

    function syntaxHighlight(codeText) {
        const lines = codeText.split("\n");
        return lines.map(line => {
            // Escape HTML characters
            let escaped = line
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            
            // Comment checks
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
        const builtins = ["Math.floor", "Math.max", "replace", "toLowerCase"];
        
        let result = text;
        
        // Highlight keywords
        keywords.forEach(kw => {
            const regex = new RegExp(`\\b${kw}\\b`, 'g');
            result = result.replace(regex, `<span class="keyword">${kw}</span>`);
        });

        // Highlight builtins
        builtins.forEach(bi => {
            // escape dot for regex
            const escapedBi = bi.split('.').join('\\.');
            const regex = new RegExp(`\\b${escapedBi}\\b`, 'g');
            result = result.replace(regex, `<span class="builtin">${bi}</span>`);
        });

        // Highlight numbers
        result = result.replace(/\b\d+\b/g, `<span class="number">$&</span>`);
        
        return result;
    }

    function renderCodeTemplate(codeText) {
        editorCodeWindow.innerHTML = '';
        const highlightedLines = syntaxHighlight(codeText);

        highlightedLines.forEach((lineHtml, lineIdx) => {
            const row = document.createElement("div");
            row.className = "code-line";
            row.dataset.lineIndex = lineIdx;

            const numCol = document.createElement("span");
            numCol.className = "line-number";
            numCol.innerText = lineIdx + 1;

            const textCol = document.createElement("span");
            textCol.className = "line-content";
            textCol.innerHTML = lineHtml;

            row.appendChild(numCol);
            row.appendChild(textCol);

            // Add click listener
            row.addEventListener("click", () => {
                handleCodeLineClick(lineIdx, row);
            });

            editorCodeWindow.appendChild(row);
        });
    }

    function handleCodeLineClick(clickedIdx, element) {
        if (isBugSpotted || timeLeft <= 0) return;

        const challenge = CHALLENGES[currentChallengeIdx];
        if (clickedIdx === challenge.bugLineIndex) {
            // Correct click! Spot bug
            isBugSpotted = true;
            element.classList.add("correct-selection");
            
            // Adjust multiplier and score
            multiplier += 0.5;
            gameMultiplierEl.innerText = `${multiplier.toFixed(1)}x`;
            gameMultiplierEl.classList.add("streak-glow");

            // Unlock test panel
            testProofSection.classList.remove("locked");
            proofStatusBadge.innerText = "UNLOCKED";
            proofStatusBadge.style.borderColor = "#10b981";
            proofStatusBadge.style.color = "#10b981";
            btnRunProof.disabled = false;

            editorStatus.innerHTML = `<i class="fas fa-check-circle" style="color: #10b981;"></i> Bug Line Spotted! Let's write a test case to prove it.`;
            terminalConsole.innerHTML = `[SYSTEM]: Bug line successfully verified! Testing suite unlocked.\nInput your parameters above and click 'Run Proof Test' to generate a divergence test.`;

            aiStatus.className = "ai-status";
            aiStatus.style.color = "#ef4444";
            aiStatus.innerText = "Bug Spotted!";
            aiSpeech.innerText = selectRandomDialogue("correctClick");
        } else {
            // Incorrect click! Apply penalty
            element.classList.add("incorrect-selection");
            setTimeout(() => {
                element.classList.remove("incorrect-selection");
            }, 600);

            score = Math.max(100, score - 150);
            gameScoreEl.innerText = score;
            aiSpeech.innerText = selectRandomDialogue("incorrectClick");
        }
    }

    function runProofTest() {
        if (!isBugSpotted || isChallengeCleared || timeLeft <= 0) return;

        const challenge = CHALLENGES[currentChallengeIdx];
        let args = [];
        try {
            args = challenge.parseArgs();
        } catch(err) {
            terminalConsole.innerHTML = `<span class="terminal-line error">[PARSING ERROR]: Invalid inputs. ${err.message}</span>`;
            return;
        }

        terminalConsole.innerHTML = `<span class="terminal-line info">[RUNNER]: Initiating code comparisons...</span>\n`;

        // 1. Compile & Execute correct version safely
        let correctFn = new Function(
            'fetch',
            'XMLHttpRequest',
            'WebSocket',
            'indexedDB',
            'document',
            'window',
            'localStorage',
            'sessionStorage',
            `
            "use strict";
            return ${challenge.correctText};
            `
        )(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
        let correctRes;
        let correctErr = null;
        try {
            correctRes = correctFn(...JSON.parse(JSON.stringify(args)));
        } catch(err) {
            correctErr = err.message;
        }

        // 2. Compile & Execute buggy version safely
        let buggyFn = new Function(
            'fetch',
            'XMLHttpRequest',
            'WebSocket',
            'indexedDB',
            'document',
            'window',
            'localStorage',
            'sessionStorage',
            `
            "use strict";
            return ${challenge.buggyText};
            `
        )(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
        let buggyRes;
        let buggyErr = null;
        try {
            buggyRes = buggyFn(...JSON.parse(JSON.stringify(args)));
        } catch(err) {
            buggyErr = err.message;
        }

        // Log outputs to terminal
        setTimeout(() => {
            let log = `[INPUTS]: ${JSON.stringify(args)}\n`;
            if (correctErr) {
                log += `[CORRECT]: Crashed with Error: "${correctErr}"\n`;
            } else {
                log += `[CORRECT]: Returned "${JSON.stringify(correctRes)}"\n`;
            }

            if (buggyErr) {
                log += `[BUGGY]: Crashed/Timed-out with Error: "${buggyErr}"\n`;
            } else {
                log += `[BUGGY]: Returned "${JSON.stringify(buggyRes)}"\n`;
            }

            terminalConsole.innerHTML += `<span class="terminal-line">${log}</span>`;

            // Validate if bug was exposed
            const bugExposed = challenge.verifyFailure(
                correctErr ? { error: correctErr } : correctRes,
                buggyErr ? { error: buggyErr } : buggyRes
            );

            if (bugExposed) {
                // Success! Exposed deception
                isChallengeCleared = true;
                clearInterval(timerInterval);
                
                // Add score calculation
                const finalScore = Math.floor(score * multiplier + timeLeft * 3);
                gameScoreEl.innerText = finalScore;
                
                terminalConsole.innerHTML += `<span class="terminal-line success">\n[SUCCESS]: Defect exposed successfully! Test input triggered divergent results.\nChallenge cleared. Resilience Score added: +${finalScore} XP!</span>`;
                aiSpeech.innerText = selectRandomDialogue("testSuccess");
                editorStatus.innerHTML = `<i class="fas fa-trophy" style="color: #eab308;"></i> Challenger Cleared! Choose another challenge in the sidebar.`;
                btnRunProof.disabled = true;
            } else {
                // Fail
                score = Math.max(100, score - 100);
                gameScoreEl.innerText = score;
                terminalConsole.innerHTML += `<span class="terminal-line error">\n[FAILED]: Test inputs did not expose the defect. Both versions returned identical results.\nTry again with an edge case input!</span>`;
                aiSpeech.innerText = selectRandomDialogue("testFailure");
            }
        }, 400);
    }

    function startCountdown() {
        timerInterval = setInterval(() => {
            timeLeft--;
            gameTimerEl.innerText = `${timeLeft}s`;
            
            const pct = (timeLeft / maxTime) * 100;
            timerProgress.style.width = `${pct}%`;

            if (timeLeft <= 30) {
                timerProgress.classList.add("warning");
            }

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                handleGameOver();
            }
        }, 1000);
    }

    function handleGameOver() {
        score = 0;
        gameScoreEl.innerText = score;
        aiSpeech.innerText = selectRandomDialogue("timeout");
        aiStatus.className = "ai-status";
        aiStatus.style.color = "#ef4444";
        aiStatus.innerText = "System Defeated";
        editorStatus.innerHTML = `<i class="fas fa-times-circle" style="color: #ef4444;"></i> LEVEL FAILED: Time limit exceeded.`;
        terminalConsole.innerHTML = `<span class="terminal-line error">[SYSTEM ERROR]: Level failed. Time limit expired. Production crashed.</span>`;
        btnRunProof.disabled = true;
    }

    // Attach listeners
    btnRunProof.addEventListener("click", runProofTest);
    btnReset.addEventListener("click", () => {
        loadChallenge(currentChallengeIdx);
    });

    // Load first level initial
    loadChallenge(0);
}
