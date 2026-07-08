/**
 * interview-panic-mode.js
 * Handles the 30-minute countdown timer and flashcard logic.
 * * FIX: Resolved scoping and runtime errors by utilizing a single, properly 
 * scoped state object `ipmTimer` and removing all nested function declarations.
 */

document.addEventListener("DOMContentLoaded", () => {
    initPanicMode();
});

// ==========================================
// 1. GLOBAL STATE & TIMER CONFIG
// ==========================================

// FIXED: Single declaration. No nesting or re-declarations.
const ipmTimer = {
    intervalId: null,
    timeLeft: 1800, // 30 minutes in seconds
    isRunning: false
};

const state = {
    currentCardIndex: 0,
    isFlipped: false
};

// Mock Flashcard Database
const flashcards = [
    {
        category: "Time Complexity",
        question: "What is the average and worst-case Time Complexity of QuickSort?",
        backTitle: "QuickSort Complexities",
        contentHtml: `
            <div class="complexity-row">
                <span>Average Case:</span>
                <strong class="text-success">O(N log N)</strong>
            </div>
            <div class="complexity-row">
                <span>Worst Case:</span>
                <strong class="text-danger">O(N²)</strong>
            </div>
            <p class="card-note">Worst case occurs when the array is already sorted and the pivot is chosen poorly (e.g., last element).</p>
        `
    },
    {
        category: "Data Structures",
        question: "How does a Hash Map handle collisions?",
        backTitle: "Hash Collision Resolution",
        contentHtml: `
            <div class="complexity-row" style="font-size: 1rem; flex-direction: column; align-items: flex-start; gap: 10px;">
                <span>1. Separate Chaining (Linked Lists at each index)</span>
                <span>2. Open Addressing (Linear/Quadratic Probing)</span>
            </div>
            <p class="card-note">In modern implementations like Java, buckets convert from Linked Lists to Red-Black Trees when they exceed 8 elements for O(log N) worst-case lookup.</p>
        `
    },
    {
        category: "Graph Algorithms",
        question: "What is the primary difference between Dijkstra's and Bellman-Ford?",
        backTitle: "Shortest Path Algorithms",
        contentHtml: `
            <p style="text-align: left; font-size: 0.95rem; margin-bottom: 1rem;">
                <strong>Dijkstra's:</strong> Single-source. Fails on negative weight edges. Uses a Priority Queue. O((V+E) log V).
            </p>
            <p style="text-align: left; font-size: 0.95rem;">
                <strong>Bellman-Ford:</strong> Single-source. Can handle negative weights. DP based. Slower O(V * E).
            </p>
        `
    }
];

// DOM Elements
const els = {
    // Areas
    panicHero: document.getElementById('panicHero'),
    activeRevisionArea: document.getElementById('activeRevisionArea'),
    completionModal: document.getElementById('completionModal'),
    
    // Timer
    timerBadge: document.getElementById('timerBadge'),
    panicTimerDisplay: document.getElementById('panicTimerDisplay'),
    
    // Buttons
    btnStartRevision: document.getElementById('btnStartRevision'),
    btnStopRevision: document.getElementById('btnStopRevision'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    
    // Flashcards
    flashcard: document.getElementById('flashcard'),
    cardFront: document.getElementById('cardFront'),
    cardBack: document.getElementById('cardBack'),
    flashcardProgressText: document.getElementById('flashcardProgressText'),
    flashcardProgressBar: document.getElementById('flashcardProgressBar'),
    
    btnPrevCard: document.getElementById('btnPrevCard'),
    btnNextCard: document.getElementById('btnNextCard'),
    btnFlipCard: document.getElementById('btnFlipCard')
};

// ==========================================
// 2. INITIALIZATION & EVENTS
// ==========================================
function initPanicMode() {
    // Timer Events
    els.btnStartRevision.addEventListener('click', ipmStartTimer);
    els.btnStopRevision.addEventListener('click', ipmStopTimer);
    els.btnCloseModal.addEventListener('click', resetModule);
    
    // Flashcard Events
    els.flashcard.addEventListener('click', toggleCardFlip);
    els.btnFlipCard.addEventListener('click', toggleCardFlip);
    els.btnNextCard.addEventListener('click', nextCard);
    els.btnPrevCard.addEventListener('click', prevCard);
}

// ==========================================
// 3. TIMER LOGIC (CLEAN & FLAT)
// ==========================================

function ipmStartTimer() {
    // Prevent multiple intervals
    if (ipmTimer.isRunning) return;
    
    // 1. Update UI to Active State
    els.panicHero.classList.add('hidden');
    els.activeRevisionArea.classList.remove('hidden');
    els.timerBadge.classList.add('active');
    
    // Render first card
    renderCard();
    
    // 2. Set State
    ipmTimer.isRunning = true;
    
    // 3. Start Interval
    ipmTimer.intervalId = setInterval(() => {
        ipmTimer.timeLeft--;
        updateTimerDisplay();
        
        // Add urgent pulsing effect at 5 minutes (300 seconds) left
        if (ipmTimer.timeLeft === 300) {
            els.timerBadge.classList.add('urgent');
        }
        
        // Time is up
        if (ipmTimer.timeLeft <= 0) {
            triggerTimeUp();
        }
    }, 1000);
}

function ipmStopTimer() {
    // 1. Clear Interval
    clearInterval(ipmTimer.intervalId);
    ipmTimer.intervalId = null;
    ipmTimer.isRunning = false;
    
    // 2. Reset UI back to default
    resetModule();
}

function triggerTimeUp() {
    clearInterval(ipmTimer.intervalId);
    ipmTimer.isRunning = false;
    els.timerBadge.classList.remove('urgent');
    els.panicTimerDisplay.textContent = "00:00";
    els.completionModal.classList.remove('hidden');
}

function updateTimerDisplay() {
    const minutes = Math.floor(ipmTimer.timeLeft / 60).toString().padStart(2, '0');
    const seconds = (ipmTimer.timeLeft % 60).toString().padStart(2, '0');
    els.panicTimerDisplay.textContent = `${minutes}:${seconds}`;
}

function resetModule() {
    // Reset Data
    ipmTimer.timeLeft = 1800;
    state.currentCardIndex = 0;
    state.isFlipped = false;
    
    // Reset UI
    updateTimerDisplay();
    els.timerBadge.classList.remove('active', 'urgent');
    els.completionModal.classList.add('hidden');
    els.activeRevisionArea.classList.add('hidden');
    els.panicHero.classList.remove('hidden');
    els.flashcard.classList.remove('is-flipped');
}

// ==========================================
// 4. FLASHCARD LOGIC
// ==========================================

function toggleCardFlip() {
    state.isFlipped = !state.isFlipped;
    if (state.isFlipped) {
        els.flashcard.classList.add('is-flipped');
    } else {
        els.flashcard.classList.remove('is-flipped');
    }
}

function nextCard() {
    if (state.currentCardIndex < flashcards.length - 1) {
        state.currentCardIndex++;
        // Unflip before changing content to hide the transition
        state.isFlipped = false;
        els.flashcard.classList.remove('is-flipped');
        
        // Wait for unflip animation before rendering
        setTimeout(renderCard, 200); 
    }
}

function prevCard() {
    if (state.currentCardIndex > 0) {
        state.currentCardIndex--;
        state.isFlipped = false;
        els.flashcard.classList.remove('is-flipped');
        
        setTimeout(renderCard, 200);
    }
}

function renderCard() {
    const cardData = flashcards[state.currentCardIndex];
    
    // Update Front
    els.cardFront.innerHTML = `
        <span class="card-category">${cardData.category}</span>
        <h3>${cardData.question}</h3>
        <p class="card-hint"><i class="fas fa-undo"></i> Click to flip</p>
    `;
    
    // Update Back
    els.cardBack.innerHTML = `
        <h3>${cardData.backTitle}</h3>
        ${cardData.contentHtml}
    `;
    
    // Update Progress
    els.flashcardProgressText.textContent = `${state.currentCardIndex + 1} / ${flashcards.length}`;
    els.flashcardProgressBar.style.width = `${((state.currentCardIndex + 1) / flashcards.length) * 100}%`;
    
    // Update Button States
    els.btnPrevCard.disabled = state.currentCardIndex === 0;
    els.btnNextCard.disabled = state.currentCardIndex === flashcards.length - 1;
}
