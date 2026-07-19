/* global quizQuestions, userProgress, saveUserData, showNotification */
import { playFlipSound, toggleSound, isSoundEnabled } from './audio.js';

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
    correctIndex: q.correct,
    explanation: q.explanation || ''
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

  const flashcard = document.querySelector('.flashcard');
  if (flashcard) flashcard.classList.remove('is-revealed');

  if (revealBtn) {
    revealBtn.disabled = false;
    revealBtn.style.display = '';
    revealBtn.textContent = 'Reveal Options';
  }

  if (totalText) totalText.textContent = `Card ${currentCardIndex + 1} of ${flashcards.length}`;
  if (progressText) progressText.textContent = `Reviewed ${revealedCards.size} / ${flashcards.length}`;
  if (hintEl) hintEl.textContent = revealedCards.has(currentCardIndex) ? '✓ Already reviewed' : '';

  if (prevBtn) prevBtn.disabled = currentCardIndex <= 0;
  if (nextBtn) nextBtn.disabled = currentCardIndex >= flashcards.length - 1;
}

function revealAnswer() {
  if (isCardFlipped) return;
  playFlipSound();
  const answerEl = document.getElementById('flashcardAnswer');
  const revealBtn = document.getElementById('flashcardsRevealBtn');
  const hintEl = document.getElementById('flashcardsSmallHint');

  if (!answerEl || !revealBtn) return;

  const card = flashcards[currentCardIndex];
  if (!card) return;

  revealedCards.add(currentCardIndex);

  const optionsHtml = card.options.map((opt, i) =>
    `<div class="flashcard-option" data-option-index="${i}">${opt}</div>`
  ).join('');
  answerEl.innerHTML = `<div class="flashcard-options">${optionsHtml}</div>`;
  revealBtn.style.display = 'none';
  if (hintEl) hintEl.textContent = '';
  isCardFlipped = true;

  const flashcard = document.querySelector('.flashcard');
  if (flashcard) flashcard.classList.add('is-revealed');

  const progressText = document.getElementById('flashcardsProgressText');
  if (progressText) progressText.textContent = `Reviewed ${revealedCards.size} / ${flashcards.length}`;
  updateFlashcardProgress();
}

function handleOptionClick(e) {
  const optionEl = e.target.closest('.flashcard-option');
  if (!optionEl) return;
  if (optionEl.classList.contains('correct') || optionEl.classList.contains('incorrect')) return;

  const card = flashcards[currentCardIndex];
  if (!card) return;
  const answerEl = document.getElementById('flashcardAnswer');

  const selectedIndex = parseInt(optionEl.dataset.optionIndex);
  const isCorrect = selectedIndex === card.correctIndex;

  if (isCorrect) {
    optionEl.classList.add('correct');
  } else {
    optionEl.classList.add('incorrect');
    document.querySelectorAll('.flashcard-option').forEach(el => {
      if (parseInt(el.dataset.optionIndex) === card.correctIndex) {
        el.classList.add('correct');
      }
    });
  }

  const explanationHtml = card.explanation
    ? `<div class="flashcard-explanation">${card.explanation}</div>`
    : '';
  answerEl.insertAdjacentHTML('beforeend', explanationHtml);
}

function navigateFlashcard(direction) {
  const newIndex = currentCardIndex + direction;
  if (newIndex < 0 || newIndex >= flashcards.length) return;
  playFlipSound();

  const inner = document.querySelector('.flashcard-inner');
  if (!inner) {
    currentCardIndex = newIndex;
    renderFlashcard();
    return;
  }

  const rotation = direction > 0 ? '-180deg' : '180deg';
  const reverseRotation = direction > 0 ? '180deg' : '-180deg';

  inner.style.transition = 'transform 0.25s ease';
  inner.style.transform = `rotateY(${rotation})`;

  setTimeout(() => {
    currentCardIndex = newIndex;
    renderFlashcard();

    inner.style.transition = 'none';
    inner.style.transform = `rotateY(${reverseRotation})`;

    requestAnimationFrame(() => {
      inner.style.transition = 'transform 0.25s ease';
      inner.style.transform = 'rotateY(0deg)';

      setTimeout(() => {
        inner.style.transition = '';
        inner.style.transform = '';
      }, 300);
    });
  }, 280);
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

  const answerEl = document.getElementById('flashcardAnswer');
  if (answerEl) answerEl.addEventListener('click', handleOptionClick);

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchFlashcardCategory(btn.dataset.flashcardsCategory);
    });
  });

  const soundToggle = document.getElementById('flashcardsSoundToggle');
  if (soundToggle) {
    const updateSoundIcon = () => {
      const enabled = isSoundEnabled();
      soundToggle.innerHTML = enabled
        ? '<i class="fas fa-volume-up"></i>'
        : '<i class="fas fa-volume-mute"></i>';
      soundToggle.classList.toggle('muted', !enabled);
    };
    updateSoundIcon();
    soundToggle.addEventListener('click', () => {
      toggleSound();
      updateSoundIcon();
      showNotification(isSoundEnabled() ? 'Sound on' : 'Sound off', 'info');
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') navigateFlashcard(-1);
    if (e.key === 'ArrowRight') navigateFlashcard(1);
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); revealAnswer(); }
  });
}
// Legacy global exports
window.initFlashcardsRevision = initFlashcardsRevision;
