// Data for challenges
const challenges = {
    sumArray: {
        title: "Sum of Array",
        desc: "Write a function `f(a)` that takes an array of numbers and returns their sum.",
        defaultCode: "function f(a) {\n    let sum = 0;\n    for(let i = 0; i < a.length; i++) {\n        sum += a[i];\n    }\n    return sum;\n}",
        testCases: [
            { input: [[1, 2, 3]], expected: 6 },
            { input: [[-1, 5, 10]], expected: 14 },
            { input: [[]], expected: 0 }
        ],
        leaderboard: [
            { user: "ArrowMaster", bytes: 19, code: "f=a=>a.reduce((x,y)=>x+y,0)" },
            { user: "EvalHacker", bytes: 14, code: "f=a=>eval(a.join('+'))||0" }
        ]
    },
    fizzBuzz: {
        title: "FizzBuzz Array",
        desc: "Write a function `f(n)` returning an array from 1 to n. Replace multiples of 3 with 'Fizz', 5 with 'Buzz', 15 with 'FizzBuzz'.",
        defaultCode: "function f(n) {\n    let res = [];\n    for(let i=1; i<=n; i++) {\n        if(i%15==0) res.push('FizzBuzz');\n        else if(i%3==0) res.push('Fizz');\n        else if(i%5==0) res.push('Buzz');\n        else res.push(i);\n    }\n    return res;\n}",
        testCases: [
            { input: [5], expected: [1, 2, 'Fizz', 4, 'Buzz'] },
            { input: [15], expected: [1,2,'Fizz',4,'Buzz','Fizz',7,8,'Fizz','Buzz',11,'Fizz',13,14,'FizzBuzz'] }
        ],
        leaderboard: [
            { user: "ShortyCoder", bytes: 62, code: "f=n=>[...Array(n)].map((_,i)=>(++i%3?'':'Fizz')+(i%5?'':'Buzz')||i)" }
        ]
    },
    palindrome: {
        title: "Valid Palindrome",
        desc: "Write a function `f(s)` that returns true if string `s` is a palindrome (ignore spaces and case).",
        defaultCode: "function f(s) {\n    s = s.toLowerCase().replace(/ /g, '');\n    return s === s.split('').reverse().join('');\n}",
        testCases: [
            { input: ["racecar"], expected: true },
            { input: ["Race car"], expected: true },
            { input: ["hello"], expected: false }
        ],
        leaderboard: [
            { user: "RegexGod", bytes: 55, code: "f=s=>(s=s.toLowerCase().replace(/ /g,''))===[...s].reverse().join('')" }
        ]
    }
};

const selectChallenge = document.getElementById('challenge-select');
const cTitle = document.getElementById('c-title');
const cDesc = document.getElementById('c-desc');
const leaderboardEl = document.getElementById('leaderboard');
const editor = document.getElementById('code-editor');
const heatmapLayer = document.getElementById('heatmap-layer');
const charCountEl = document.getElementById('char-count');
const byteCountEl = document.getElementById('byte-count');
const btnRun = document.getElementById('btn-run');
const btnHeatmap = document.getElementById('btn-heatmap');
const terminalOut = document.getElementById('terminal-out');

let currentChallenge = 'sumArray';
let heatmapActive = false;

// Initialize
function init() {
    loadChallenge(currentChallenge);
    
    selectChallenge.addEventListener('change', (e) => {
        currentChallenge = e.target.value;
        loadChallenge(currentChallenge);
    });

    editor.addEventListener('input', updateMetrics);
    editor.addEventListener('scroll', syncScroll);
    
    btnRun.addEventListener('click', runTests);
    btnHeatmap.addEventListener('click', toggleHeatmap);
}

function loadChallenge(key) {
    const c = challenges[key];
    cTitle.innerText = c.title;
    cDesc.innerText = c.desc;
    editor.value = c.defaultCode;
    
    // Load Leaderboard
    leaderboardEl.innerHTML = '';
    c.leaderboard.forEach((entry, idx) => {
        const li = document.createElement('li');
        li.className = `lb-item rank-${idx+1}`;
        const userSpan = document.createElement('span');
        userSpan.className = 'lb-user';
        userSpan.textContent = `${idx+1}. ${entry.user}`;
        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'lb-score';
        scoreSpan.textContent = `${entry.bytes} B`;
        li.appendChild(userSpan);
        li.appendChild(scoreSpan);
        // Tooltip for code
        li.title = entry.code;
        leaderboardEl.appendChild(li);
    });

    updateMetrics();
    log("Loaded challenge: " + c.title);
}

function updateMetrics() {
    const code = editor.value;
    
    // Char count
    const chars = code.length;
    charCountEl.innerText = chars;
    
    // Byte count (UTF-8 encoding)
    const bytes = new Blob([code]).size;
    byteCountEl.innerText = bytes;

    if (heatmapActive) {
        renderHeatmap();
    }
}

function syncScroll() {
    heatmapLayer.scrollTop = editor.scrollTop;
    heatmapLayer.scrollLeft = editor.scrollLeft;
}

// ---------------------------
// HEATMAP LOGIC
// ---------------------------
function toggleHeatmap() {
    heatmapActive = !heatmapActive;
    if (heatmapActive) {
        btnHeatmap.classList.add('active');
        renderHeatmap();
    } else {
        btnHeatmap.classList.remove('active');
        heatmapLayer.innerHTML = '';
    }
}

function renderHeatmap() {
    let code = editor.value;
    
    // Escape HTML to prevent injection in the heatmap layer
    code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Identify anti-golf patterns (Highlight Red)
    const wastePatterns = [
        /function/g, /return/g, /let /g, /const /g, /var /g,
        /if\s*\(/g, /else/g, /true/g, /false/g
    ];

    wastePatterns.forEach(regex => {
        code = code.replace(regex, match => `<span class="hm-waste">${match}</span>`);
    });

    // Identify excessive spaces/newlines (Highlight Yellow)
    // Match 2 or more spaces, or tabs, or newlines
    code = code.replace(/(\s{2,}|\t|\n+)/g, match => `<span class="hm-space">${match}</span>`);

    heatmapLayer.innerHTML = code;
}

// ---------------------------
// EXECUTION ENGINE (WEB WORKER)
// ---------------------------
function log(msg, color = 'var(--text-muted)') {
    const p = document.createElement('p');
    p.style.color = color;
    p.innerText = `> ${msg}`;
    terminalOut.appendChild(p);
    terminalOut.scrollTop = terminalOut.scrollHeight;
}

// Create the Web Worker code as a Blob
const workerCode = `
self.onmessage = function(e) {
    const { code, testCases } = e.data;
    try {
        const execCode = code + '\\nreturn typeof f === "function" ? f : null;';
        const func = new Function(execCode)();
        
        if (!func) {
            self.postMessage({ type: 'error', error: "You must define a function named 'f'" });
            return;
        }
        
        let allPassed = true;
        let results = [];
        
        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const inputClone = JSON.parse(JSON.stringify(tc.input));
            
            try {
                const result = func(...inputClone);
                const expectedStr = JSON.stringify(tc.expected);
                const resultStr = JSON.stringify(result);
                
                if (expectedStr !== resultStr) {
                    results.push({ pass: false, msg: \`Test Case \${i+1} FAILED. Expected \${expectedStr}, got \${resultStr}\` });
                    allPassed = false;
                    break; // Stop on first failure
                } else {
                    results.push({ pass: true, msg: \`Test Case \${i+1} Passed.\` });
                }
            } catch(err) {
                results.push({ pass: false, msg: \`Test Case \${i+1} THREW ERROR: \${err.message}\` });
                allPassed = false;
                break;
            }
        }
        
        self.postMessage({ type: 'done', success: allPassed, results });
    } catch(err) {
        self.postMessage({ type: 'error', error: err.message });
    }
};
`;

const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(workerBlob);

function runTests() {
    terminalOut.innerHTML = '';
    const code = editor.value;
    const c = challenges[currentChallenge];
    const byteSize = new Blob([code]).size;
    
    log(`Executing code (${byteSize} Bytes)...`, 'white');
    btnRun.disabled = true;
    btnRun.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Running`;

    const worker = new Worker(workerUrl);
    let settled = false;
    
    // Infinite loop protection timeout (2 seconds)
    const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        worker.terminate();
        log(`Execution Timed Out (Infinite Loop Detected!)`, 'var(--accent-red)');
        btnRun.disabled = false;
        btnRun.innerHTML = `<i class="fas fa-play"></i> Run Tests`;
    }, 2000);

    worker.onmessage = function(e) {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        const data = e.data;
        
        if (data.type === 'error') {
            log(`Error: ${data.error}`, 'var(--accent-red)');
        } else if (data.type === 'done') {
            // Print results
            data.results.forEach(res => {
                log(res.msg, res.pass ? 'var(--accent-green)' : 'var(--accent-red)');
            });
            
            // Won Case
            if (data.success) {
                log(`\n🎉 SUCCESS! All test cases passed!`, 'var(--accent-gold)');
                log(`Final Size: ${byteSize} Bytes`, 'var(--accent-gold)');
                
                const topScore = c.leaderboard[0].bytes;
                if (byteSize <= topScore) {
                    log(`🏆 INCREDIBLE! You tied or beat the top community score!`, 'var(--accent-gold)');
                    terminalOut.style.boxShadow = "0 0 20px rgba(251, 191, 36, 0.5) inset";
                    setTimeout(() => { terminalOut.style.boxShadow = "none"; }, 2000);
                } else {
                    log(`Can you optimize it further to beat ${topScore} Bytes?`, '`#bbb`');
                }
            }
        }
        
        worker.terminate();
        btnRun.disabled = false;
        btnRun.innerHTML = `<i class="fas fa-play"></i> Run Tests`;
    };
    
    worker.onerror = function(e) {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        log(`Worker Error: ${e.message || 'Failed to start execution worker'}`, 'var(--accent-red)');
        worker.terminate();
        btnRun.disabled = false;
        btnRun.innerHTML = `<i class="fas fa-play"></i> Run Tests`;
    };
    
    worker.postMessage({ code: code, testCases: c.testCases });
}

init();
