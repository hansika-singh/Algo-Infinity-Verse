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
