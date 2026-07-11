// Recursion vs Iteration — page interactivity
 
document.addEventListener('DOMContentLoaded', () => {
    initTypingEffect();
    initStatCounters();
    initStackSimulation();
    initRecursiveTree();
    initPerformanceChart();
    initMistakeCards();
    initExerciseToggles();
});
 
// ---------- Hero typing effect ----------
function initTypingEffect() {
    const el = document.getElementById('typingTextRVI');
    if (!el) return;
    const phrases = [
        'Same problem. Two different shapes.',
        'Recursion trades stack space for clarity.',
        'Iteration trades clarity for constant memory.'
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
 
    function tick() {
        const current = phrases[phraseIndex];
        if (!deleting) {
            charIndex++;
            el.textContent = current.slice(0, charIndex);
            if (charIndex === current.length) {
                deleting = true;
                setTimeout(tick, 1400);
                return;
            }
        } else {
            charIndex--;
            el.textContent = current.slice(0, charIndex);
            if (charIndex === 0) {
                deleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
            }
        }
        setTimeout(tick, deleting ? 35 : 55);
    }
    tick();
}
 
// ---------- Hero stat counters ----------
function initStatCounters() {
    document.querySelectorAll('.stat-number').forEach((el) => {
        const target = parseInt(el.dataset.target, 10) || 0;
        let current = 0;
        const step = Math.max(1, Math.ceil(target / 40));
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            el.textContent = current;
        }, 30);
    });
}
 
// ---------- Stack simulation (factorial(5)) ----------
function initStackSimulation() {
    const stackEl = document.getElementById('simStack');
    const explainEl = document.getElementById('simExplain');
    const stepLabel = document.getElementById('simStepLabel');
    const nextBtn = document.getElementById('simNext');
    const prevBtn = document.getElementById('simPrev');
    const resetBtn = document.getElementById('simReset');
    if (!stackEl) return;
 
    // Build the sequence of steps for factorial(5): push phase then pop/resolve phase.
    const n = 5;
    const steps = [];
 
    for (let i = n; i >= 1; i--) {
        steps.push({
            type: 'push',
            frames: Array.from({ length: n - i + 1 }, (_, k) => `factorial(${n - k})`),
            explain: i === 1
                ? `factorial(1) is called. n <= 1, so this hits the base case and returns 1 immediately — no further push needed.`
                : `factorial(${i}) is called. Since ${i} > 1, it calls factorial(${i - 1}) and waits — a new frame is pushed.`
        });
    }
 
    let resolvedValue = 1;
    for (let i = 1; i <= n; i++) {
        const framesRemaining = Array.from({ length: n - i }, (_, k) => `factorial(${n - k})`);
        if (i === 1) {
            steps.push({
                type: 'pop',
                frames: framesRemaining,
                explain: `factorial(1) returns 1. Its frame pops off the stack.`
            });
        } else {
            resolvedValue *= i;
            steps.push({
                type: 'pop',
                frames: framesRemaining,
                explain: `factorial(${i - 1}) returned, so factorial(${i}) computes ${i} * ${resolvedValue / i} = ${resolvedValue} and pops its own frame.`
            });
        }
    }
 
    let stepIndex = -1;
 
    function render() {
        if (stepIndex < 0) {
            stackEl.innerHTML = '';
            explainEl.textContent = 'Click "Next" to begin the simulation.';
            stepLabel.textContent = `Step 0 / ${steps.length}`;
            prevBtn.disabled = true;
            nextBtn.disabled = false;
            return;
        }
        const step = steps[stepIndex];
        stackEl.innerHTML = step.frames
            .map((f) => `<div class="rvi-sim-frame">${f}</div>`)
            .join('');
        explainEl.textContent = step.explain;
        stepLabel.textContent = `Step ${stepIndex + 1} / ${steps.length}`;
        prevBtn.disabled = false;
        nextBtn.disabled = stepIndex === steps.length - 1;
    }
 
    nextBtn.addEventListener('click', () => {
        if (stepIndex < steps.length - 1) {
            stepIndex++;
            render();
        }
    });
    prevBtn.addEventListener('click', () => {
        if (stepIndex > -1) {
            stepIndex--;
            render();
        }
    });
    resetBtn.addEventListener('click', () => {
        stepIndex = -1;
        render();
    });
 
    render();
}
 
// ---------- Recursive tree (naive Fibonacci call tree) ----------
function initRecursiveTree() {
    const svg = document.getElementById('treeSvg');
    const slider = document.getElementById('treeN');
    const valueLabel = document.getElementById('treeNValue');
    const countLabel = document.getElementById('treeCallCount');
    if (!svg || !slider) return;
 
    function buildTree(n, depth = 0, x = 450, y = 40, spread = 220) {
        const node = { n, x, y, children: [] };
        if (n > 1) {
            node.children.push(buildTree(n - 1, depth + 1, x - spread, y + 70, spread / 1.7));
            node.children.push(buildTree(n - 2, depth + 1, x + spread, y + 70, spread / 1.7));
        }
        return node;
    }
 
    function countCalls(node) {
        if (!node.children.length) return 1;
        return 1 + node.children.reduce((sum, c) => sum + countCalls(c), 0);
    }
 
    function draw(node, parts) {
        node.children.forEach((child) => {
            parts.push(
                `<line x1="${node.x}" y1="${node.y}" x2="${child.x}" y2="${child.y}" stroke="var(--glass-border)" stroke-width="2" />`
            );
            draw(child, parts);
        });
        const isLeaf = node.children.length === 0;
        parts.push(`
            <circle cx="${node.x}" cy="${node.y}" r="20"
                fill="${isLeaf ? 'rgba(59,130,246,0.25)' : 'rgba(124,58,237,0.25)'}"
                stroke="${isLeaf ? '#3b82f6' : '#7c3aed'}" stroke-width="1.5" />
            <text x="${node.x}" y="${node.y + 5}" text-anchor="middle"
                font-family="Fira Code, monospace" font-size="12" fill="#fff">fib(${node.n})</text>
        `);
    }
 
    function render() {
        const n = parseInt(slider.value, 10);
        valueLabel.textContent = n;
        const root = buildTree(n);
        const total = countCalls(root);
        countLabel.textContent = `${total} total calls for fib(${n})`;
        const parts = [];
        draw(root, parts);
        svg.innerHTML = parts.join('');
    }
 
    slider.addEventListener('input', render);
    render();
}
 
// ---------- Performance comparison chart ----------
function initPerformanceChart() {
    const svg = document.getElementById('perfChart');
    if (!svg) return;
 
    function fibCallCount(n) {
        if (n <= 1) return 1;
        return 1 + fibCallCount(n - 1) + fibCallCount(n - 2);
    }
 
    const inputs = [5, 10, 15, 20, 25, 30];
    const recursiveCalls = inputs.map(fibCallCount);
    const iterativeCalls = inputs.map((n) => n);
 
    const width = 900;
    const height = 380;
    const padding = 50;
    const maxVal = Math.max(...recursiveCalls);
    const barGroupWidth = (width - padding * 2) / inputs.length;
    const barWidth = barGroupWidth / 3;
 
    function barHeight(val) {
        // log scale so both series are visible on the same chart
        return ((Math.log(val + 1) / Math.log(maxVal + 1)) * (height - padding * 2));
    }
 
    const parts = [];
    inputs.forEach((n, i) => {
        const groupX = padding + i * barGroupWidth;
        const recH = barHeight(recursiveCalls[i]);
        const iterH = barHeight(iterativeCalls[i]);
 
        parts.push(`
            <rect x="${groupX}" y="${height - padding - recH}" width="${barWidth}" height="${recH}"
                fill="#7c3aed" rx="3" />
            <rect x="${groupX + barWidth + 8}" y="${height - padding - iterH}" width="${barWidth}" height="${iterH}"
                fill="#3b82f6" rx="3" />
            <text x="${groupX + barWidth}" y="${height - padding + 20}" text-anchor="middle"
                font-family="Poppins, sans-serif" font-size="13" fill="var(--text-secondary)">n=${n}</text>
        `);
    });
 
    parts.push(`<line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="var(--glass-border)" stroke-width="1" />`);
    parts.push(`<text x="${width / 2}" y="24" text-anchor="middle" font-family="Poppins, sans-serif" font-size="14" fill="var(--text-secondary)">Function calls (log scale) — recursive vs iterative Fibonacci</text>`);
 
    svg.innerHTML = parts.join('');
}
 
// ---------- Common mistakes flip cards ----------
function initMistakeCards() {
    document.querySelectorAll('.rvi-mistake-card').forEach((card) => {
        card.addEventListener('click', () => {
            card.classList.toggle('flipped');
        });
    });
}
 
// ---------- Exercise solution toggles ----------
function initExerciseToggles() {
    document.querySelectorAll('.rvi-exercise').forEach((exercise) => {
        const btn = exercise.querySelector('.rvi-toggle-btn');
        const body = exercise.querySelector('.rvi-exercise-body');
        if (!btn || !body) return;
        btn.addEventListener('click', () => {
            const isOpen = body.classList.toggle('open');
            btn.textContent = isOpen ? 'Hide Solutions' : 'Show Solutions';
        });
    });
}
 