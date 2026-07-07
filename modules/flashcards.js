/* global quizQuestions, userProgress, saveUserData, showNotification */

const CATEGORY_LABELS = {
  arrays: 'Arrays',
  strings: 'Strings',
  linkedlist: 'Linked List',
  trees: 'Trees',
  graphs: 'Graphs',
  dp: 'Dynamic Programming'
};

let currentCategory = 'arrays';
let currentCardIndex = 0;
let flashcards = [];
let revealedCards = new Set();
let isCardFlipped = false;

function buildFlashcards(category) {
  const questions = (window.quizQuestions || quizQuestions)[category];
  if (!questions || questions.length === 0) {
    flashcards = [];
    return;
  }
  flashcards = questions.map((q, idx) => ({
    id: `${category}-${idx}`,
    question: q.question,
    answer: q.options[q.correct] + (q.explanation ? ' — ' + q.explanation : ''),
    options: q.options,
    correctIndex: q.correct
  }));
}

function renderFlashcard() {
  const questionEl = document.getElementById('flashcardQuestion');
  const answerEl = document.getElementById('flashcardAnswer');
  const revealBtn = document.getElementById('flashcardsRevealBtn');
  const prevBtn = document.getElementById('flashcardsPrevBtn');
  const nextBtn = document.getElementById('flashcardsNextBtn');
  const progressText = document.getElementById('flashcardsProgressText');
  const totalText = document.getElementById('flashcardsTotalText');
  const hintEl = document.getElementById('flashcardsSmallHint');

  if (!questionEl) return;

  if (flashcards.length === 0) {
    questionEl.textContent = 'No flashcards available for this category.';
    answerEl.textContent = '';
    if (hintEl) hintEl.textContent = '';
    if (progressText) progressText.textContent = 'Reviewed 0 / 0';
    if (totalText) totalText.textContent = '';
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    if (revealBtn) revealBtn.disabled = true;
    return;
  }

  isCardFlipped = false;
  const card = flashcards[currentCardIndex];
  questionEl.textContent = card.question;
  answerEl.textContent = '';

  if (revealBtn) {
    revealBtn.disabled = false;
    revealBtn.innerHTML = '<i class="fas fa-eye"></i> Reveal Answer';
  }

  if (totalText) totalText.textContent = `Card ${currentCardIndex + 1} of ${flashcards.length}`;
  if (progressText) progressText.textContent = `Reviewed ${revealedCards.size} / ${flashcards.length}`;
  if (hintEl) hintEl.textContent = revealedCards.has(currentCardIndex) ? '✓ Already reviewed' : '';

  if (prevBtn) prevBtn.disabled = currentCardIndex <= 0;
  if (nextBtn) nextBtn.disabled = currentCardIndex >= flashcards.length - 1;
}

function revealAnswer() {
  const answerEl = document.getElementById('flashcardAnswer');
  const revealBtn = document.getElementById('flashcardsRevealBtn');
  const hintEl = document.getElementById('flashcardsSmallHint');

  if (!answerEl || !revealBtn) return;

  if (isCardFlipped) {
    const card = flashcards[currentCardIndex];
    const optionsHtml = card.options.map((opt, i) =>
      `<div class="flashcard-option ${i === card.correctIndex ? 'correct' : ''}">${opt}</div>`
    ).join('');
    answerEl.innerHTML = `<div class="flashcard-options">${optionsHtml}</div>`;
    revealBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Show Explanation';
    if (hintEl) hintEl.textContent = 'Green highlight indicates the correct answer.';
    return;
  }

  revealedCards.add(currentCardIndex);
  answerEl.textContent = flashcards[currentCardIndex].answer;
  revealBtn.innerHTML = '<i class="fas fa-list"></i> Show Options';
  isCardFlipped = true;

  const progressText = document.getElementById('flashcardsProgressText');
  if (progressText) progressText.textContent = `Reviewed ${revealedCards.size} / ${flashcards.length}`;
  if (hintEl) hintEl.textContent = '';
  updateFlashcardProgress();
}

function navigateFlashcard(direction) {
  const newIndex = currentCardIndex + direction;
  if (newIndex < 0 || newIndex >= flashcards.length) return;
  currentCardIndex = newIndex;
  renderFlashcard();
}

function switchFlashcardCategory(category) {
  currentCategory = category;
  currentCardIndex = 0;
  buildFlashcards(category);
  renderFlashcard();
}

function updateFlashcardProgress() {
  if (!userProgress) return;
  if (!userProgress.flashcardProgress) userProgress.flashcardProgress = {};
  const key = currentCategory;
  userProgress.flashcardProgress[key] = {
    lastReviewed: new Date().toISOString(),
    reviewedCount: revealedCards.size,
    totalCount: flashcards.length
  };
  if (typeof saveUserData === 'function') saveUserData();
}

export function initFlashcardsRevision() {
  const root = document.getElementById('flashcardRoot');
  if (!root) return;

  buildFlashcards(currentCategory);
  renderFlashcard();

  const revealBtn = document.getElementById('flashcardsRevealBtn');
  const prevBtn = document.getElementById('flashcardsPrevBtn');
  const nextBtn = document.getElementById('flashcardsNextBtn');
  const filterBtns = document.querySelectorAll('[data-flashcards-category]');

  if (revealBtn) revealBtn.addEventListener('click', revealAnswer);
  if (prevBtn) prevBtn.addEventListener('click', () => navigateFlashcard(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigateFlashcard(1));

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchFlashcardCategory(btn.dataset.flashcardsCategory);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') navigateFlashcard(-1);
    if (e.key === 'ArrowRight') navigateFlashcard(1);
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); revealAnswer(); }
  });
}
// Legacy global exports
window.initFlashcardsRevision = initFlashcardsRevision;
