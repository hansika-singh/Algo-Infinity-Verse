// Game State
let player = {
    hp: 100,
    maxHp: 100,
    xp: 0,
    level: 1,
    combo: 0
};

const BOSSES = [
    {
        name: "THE ARRAY LEVIATHAN",
        maxHp: 500,
        hp: 500,
        testCases: [
            { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
            { input: [[3, 2, 4], 6], expected: [1, 2] },
            { input: [[3, 3], 6], expected: [0, 1] },
            { input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
            { input: [[10, 20, 30, 40, 50, 60], 110], expected: [4, 5] } // Edge case
        ],
        problemName: "Two Sum",
        functionName: "twoSum"
    }
];

let currentBossIndex = 0;
let currentBoss = JSON.parse(JSON.stringify(BOSSES[currentBossIndex])); // Deep copy

// UI Elements
const playerHpBar = document.getElementById('player-hp');
const playerHpText = document.getElementById('player-hp-text');
const bossHpBar = document.getElementById('boss-hp');
const bossHpText = document.getElementById('boss-hp-text');
const xpBar = document.getElementById('xp-bar');
const comboCounter = document.getElementById('combo-counter');
const levelDisplay = document.getElementById('level-display');

const playerSprite = document.getElementById('player-sprite');
const bossSprite = document.getElementById('boss-sprite');
const damageOverlay = document.getElementById('damage-overlay');
const logContent = document.getElementById('log-content');
const codeEditor = document.getElementById('code-editor');

const perfTime = document.getElementById('perf-time');
const perfComplexity = document.getElementById('perf-complexity');
const perfEdgeCases = document.getElementById('perf-edge-cases');

function logToTerminal(message, type = '') {
    const p = document.createElement('p');
    p.innerHTML = `> ${message}`;
    if (type) p.className = type;
    logContent.appendChild(p);
    logContent.parentElement.scrollTop = logContent.parentElement.scrollHeight;
}

function updateUI() {
    // Health Bars
    const pPercent = Math.max(0, (player.hp / player.maxHp) * 100);
    playerHpBar.style.width = pPercent + '%';
    playerHpText.innerText = `${player.hp}/${player.maxHp}`;
    
    const bPercent = Math.max(0, (currentBoss.hp / currentBoss.maxHp) * 100);
    bossHpBar.style.width = bPercent + '%';
    bossHpText.innerText = `${currentBoss.hp}/${currentBoss.maxHp}`;

    // Stats
    comboCounter.innerText = player.combo;
    levelDisplay.innerText = `LVL ${player.level}`;
    
    // XP Bar (Level up every 100 XP)
    const xpPercent = player.xp % 100;
    xpBar.style.width = xpPercent + '%';
}

function triggerAnimation(element, animClass) {
    element.classList.remove(animClass);
    void element.offsetWidth; // Trigger reflow
    element.classList.add(animClass);
    setTimeout(() => {
        element.classList.remove(animClass);
    }, 1000); // Remove after animation ends roughly
}

function playerAttack(damage, isCritical = false) {
    triggerAnimation(playerSprite, 'anim-attack');
    
    setTimeout(() => {
        triggerAnimation(bossSprite, 'anim-hurt');
        currentBoss.hp -= damage;
        
        if (isCritical) {
            logToTerminal(`CRITICAL HIT! Dealt ${damage} damage!`, 'log-critical');
            damageOverlay.classList.add('active');
            setTimeout(() => damageOverlay.classList.remove('active'), 200);
        } else {
            logToTerminal(`You dealt ${damage} damage!`, 'log-success');
        }
        
        if (currentBoss.hp <= 0) {
            currentBoss.hp = 0;
            updateUI();
            triggerVictory();
        } else {
            updateUI();
        }
    }, 150); // delay so it visually hits
}

function bossAttack(errorMessage) {
    triggerAnimation(bossSprite, 'anim-attack');
    
    setTimeout(() => {
        triggerAnimation(playerSprite, 'anim-hurt');
        const damage = 20; // Fixed damage per fail
        player.hp -= damage;
        player.combo = 0; // Break combo
        
        logToTerminal(`The Boss strikes! Edge Case Failed: ${errorMessage}`, 'log-error');
        
        if (player.hp <= 0) {
            player.hp = 0;
            updateUI();
            triggerDefeat();
        } else {
            updateUI();
        }
    }, 150);
}

function triggerVictory() {
    triggerAnimation(bossSprite, 'anim-die');
    setTimeout(() => {
        document.getElementById('end-title').innerText = "VICTORY!";
        document.getElementById('end-title').style.color = "var(--hp-green)";
        document.getElementById('end-desc').innerText = `You have slain ${currentBoss.name}!`;
        document.getElementById('end-screen').classList.remove('hidden');
        
        // Grant XP
        player.xp += 150;
        if (player.xp >= player.level * 100) {
            player.level++;
            player.maxHp += 20;
            player.hp = player.maxHp;
        }
        updateUI();
    }, 1000);
}

function triggerDefeat() {
    triggerAnimation(playerSprite, 'anim-die');
    setTimeout(() => {
        document.getElementById('end-title').innerText = "DEFEAT";
        document.getElementById('end-title').style.color = "var(--hp-red)";
        document.getElementById('end-desc').innerText = "Your algorithm was not strong enough...";
        document.getElementById('end-screen').classList.remove('hidden');
    }, 1000);
}

document.getElementById('restart-btn').addEventListener('click', () => {
    // Reset Battle
    player.hp = player.maxHp;
    currentBoss = JSON.parse(JSON.stringify(BOSSES[currentBossIndex]));
    player.combo = 0;
    
    document.getElementById('end-screen').classList.add('hidden');
    playerSprite.classList.remove('anim-die');
    bossSprite.classList.remove('anim-die');
    
    logContent.innerHTML = '';
    logToTerminal(`A wild ${currentBoss.name} appears!`);
    
    updateUI();
});

// Compare arrays for equality (order-independent for Two Sum)
function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    
    // Sort copies so [1, 0] equals [0, 1]
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    
    for (var i = 0; i < sortedA.length; ++i) {
        if (sortedA[i] !== sortedB[i]) return false;
    }
    return true;
}

// Execution Logic
document.getElementById('attack-btn').addEventListener('click', () => {
    if (player.hp <= 0 || currentBoss.hp <= 0) return;
    
    const code = codeEditor.value;
    logToTerminal("Casting spell... compiling...");
    perfEdgeCases.innerText = "";
    
    try {
        // Create an isolated function with explicit parameter names
        const wrapper = `
            ${code}
            if (typeof ${currentBoss.functionName} !== 'function') throw new Error("${currentBoss.functionName} function not found.");
            return ${currentBoss.functionName}(arg1, arg2);
        `;
        const testFunc = new Function('arg1', 'arg2', wrapper);
        
        let passedCases = 0;
        let failedReason = null;
        
        const startTime = performance.now();

        // Run all test cases
        for (let i = 0; i < currentBoss.testCases.length; i++) {
            const testCase = currentBoss.testCases[i];
            
            // Clone inputs to prevent mutation
            const input1 = JSON.parse(JSON.stringify(testCase.input[0]));
            const input2 = JSON.parse(JSON.stringify(testCase.input[1] !== undefined ? testCase.input[1] : null));
            
            const result = testFunc(input1, input2);
            
            // Validate result
            if (Array.isArray(testCase.expected)) {
                if (!arraysEqual(result, testCase.expected)) {
                    failedReason = `Test Case ${i+1} Failed: Expected [${testCase.expected}], got [${result}]`;
                    break;
                }
            } else {
                if (result !== testCase.expected) {
                    failedReason = `Test Case ${i+1} Failed: Expected ${testCase.expected}, got ${result}`;
                    break;
                }
            }
            passedCases++;
        }
        
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        perfTime.innerText = `${executionTime.toFixed(2)} ms`;
        
        if (failedReason) {
            perfEdgeCases.innerText = failedReason;
            bossAttack(failedReason);
        } else {
            // Success!
            player.combo++;
            
            // Check if highly optimized (e.g. O(n) using Map runs extremely fast, < 1ms usually in JS for small sets, but let's use a threshold)
            let isCritical = false;
            let damage = 100 * player.combo; // Damage scales with combo
            
            if (executionTime < 2) {
                isCritical = true;
                damage *= 2;
                perfComplexity.innerText = "O(n) - OPTIMIZED";
                perfComplexity.style.color = "var(--hp-green)";
            } else {
                perfComplexity.innerText = "O(n^2) - SUBOPTIMAL";
                perfComplexity.style.color = "yellow";
            }
            
            playerAttack(damage, isCritical);
        }
        
    } catch (err) {
        perfEdgeCases.innerText = `Syntax/Runtime Error: ${err.message}`;
        bossAttack(err.message);
    }
});

// Init
updateUI();
