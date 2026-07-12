import { initLoadingScreen } from './loading.js';
import { initNavbar } from './navbar.js';
import { initHeroSection } from './hero.js';
import { initTopicOfTheDay, initTopicsSection } from './topics.js';
import { initQuizSection } from './quiz-game.js';

import { initRoadmap } from './roadmap.js';
import { initDashboard } from './dashboard.js';
import { initGamification, initDailyChallenge } from './gamification.js';
import { initChatbot } from './chatbot.js';
import { initProfile } from './profile.js';
import { initScrollEffects } from './back-to-top.js';
import { initAiInterviewer } from './interview.js';
import { initNewsletterValidation } from './newsletter.js';
import { initFlashcardsRevision } from './flashcards.js';
import { initKeyboardShortcuts } from './keyboard-shortcuts.js';
import { initDidYouKnow } from './did-you-know.js';
import { initLanguageDetect } from './language-detect.js';
import { initActivityFeed } from './activity-feed.js';
import { initModalManager } from './modal-manager.js';
import { initProfileEdit } from './profile-edit.js';
import { initServiceWorker } from './service-worker.js';
import { initHashRouter } from './hash-router.js';
import { initEditor } from './editor.js';
import { initMistakeDna } from './mistake-dna.js';
import { initPersonalityQuiz } from './personality-quiz.js';
import { initBookmarkCollections } from './bookmarkUI.js';

function loadUserData() {
  if (typeof window.loadUserData === 'function') {
    return window.loadUserData();
  }
  const saved = localStorage.getItem('algoInfinityVerse');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data && typeof data === 'object') {
        window.userProgress = window.userProgress || {};
        Object.assign(window.userProgress, data);
      }
    } catch (e) {
      console.error('Error loading progress:', e);
    }
  }
}
function initFooterCurrentDate() {
  const yearEl = document.getElementById('footer-current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  const dateEl = document.getElementById('footer-current-date');
  if (dateEl)
    dateEl.textContent =
      'Today: ' +
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
}
window.initFooterCurrentDate = initFooterCurrentDate;

function initDateDisplay() {
  const currentDateEl = document.getElementById('currentDateDisplay');
  const profileDateEl = document.getElementById('profileCurrentDate');
  const resetTimerEl = document.getElementById('resetTimer');

  const now = new Date();
  const shortDate = now.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  const fullDate = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  if (currentDateEl) currentDateEl.textContent = `📅 ${shortDate}`;
  if (profileDateEl) profileDateEl.textContent = fullDate;

  function getTimeUntilMidnight() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return `${h}h ${m}m ${s}s`;
  }

  if (resetTimerEl) {
    resetTimerEl.textContent = getTimeUntilMidnight();
    setInterval(() => {
      resetTimerEl.textContent = getTimeUntilMidnight();
    }, 1000);
  }
}
window.initDateDisplay = initDateDisplay;

function initializeApp() {
  loadUserData();
  initLoadingScreen();
  initNavbar();
  initHeroSection();
  initTopicOfTheDay();
  initTopicsSection();
  initQuizSection();

  initRoadmap();
  initDashboard();
  initGamification();
  initDailyChallenge();
  initChatbot();
  initProfile();
  initBookmarkCollections();
  initAiInterviewer();
  initNewsletterValidation();
  initScrollEffects();
  initFlashcardsRevision();
  initKeyboardShortcuts();
  initDidYouKnow();
  initFooterCurrentDate();
  initDateDisplay();
  initLanguageDetect();
  initActivityFeed();
  initModalManager();
  initProfileEdit();
  initServiceWorker();
  initHashRouter();
  initEditor();
  initMistakeDna();
  initPersonalityQuiz();
}

if (window.partialsLoadedFlag) {
  initializeApp();
} else {
  document.addEventListener('partialsLoaded', initializeApp);
}
