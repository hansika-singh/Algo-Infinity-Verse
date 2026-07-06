/**
 * Reusable quiz module for Algo Infinity Verse
 */

// --- QUIZ TIMER STATE ---
let timerInterval = null;
let timeLeft = 0;
let isTimerRunning = false;
let quizDuration = 60; // Default duration in seconds

// --- SCORE ANIMATION STATE ---
let scoreAnimationId = null;
let scoreInterval = null;

// --- QUIZ PROGRESS STATE ---
let currentQuestionIndex = 0;
let totalQuestions = 0;
let answeredQuestions = new Set();

// --- RESIZE HANDLER ---
let resizeTimeout = null;

export function initQuiz({ containerId, questions, duration = 60 }) {
  const container = document.getElementById(containerId);
  if (!container || !questions || questions.length === 0) return;

  let currentQuestions = [];
  let hasSubmitted = false;
  quizDuration = duration;

  // Helper to shuffle an array (Fisher-Yates)
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // --- TIMER FUNCTIONS ---
  function startQuizTimer(onComplete) {
    // Clear any existing timer
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    
    timeLeft = quizDuration;
    isTimerRunning = true;
    updateTimerDisplay(timeLeft);
    
    timerInterval = setInterval(() => {
      timeLeft--;
      
      // CRITICAL FIX: Stop at 0, don't go negative
      if (timeLeft <= 0) {
        timeLeft = 0;
        updateTimerDisplay(timeLeft);
        stopQuizTimer();
        
        // Show "Time's Up!" message
        const timerDisplay = document.querySelector('.quiz-timer-display');
        if (timerDisplay) {
          timerDisplay.textContent = '⏰ Time\'s Up!';
          timerDisplay.classList.add('times-up');
        }
        
        // Auto-submit quiz
        if (typeof onComplete === 'function') {
          onComplete();
        }
        return;
      }
      
      updateTimerDisplay(timeLeft);
    }, 1000);
  }

  function stopQuizTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    isTimerRunning = false;
  }

  /**
   * Update timer display with mobile optimizations
   * @param {number} seconds - Remaining seconds
   */
  function updateTimerDisplay(seconds) {
    const timerDisplay = document.querySelector('.quiz-timer-display');
    if (!timerDisplay) return;
    
    // Check if mobile
    const isMobile = window.innerWidth <= 480;
    
    // Format time display
    let displayText = '';
    if (seconds > 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      displayText = `⏱️ ${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      displayText = `⏱️ ${seconds}s`;
    }
    
    // Add urgent emoji for critical time on mobile
    if (seconds <= 10 && seconds > 0 && isMobile) {
      displayText = `🔴 ${seconds}s`;
    } else if (seconds <= 30 && seconds > 10 && isMobile) {
      displayText = `🟡 ${seconds}s`;
    }
    
    timerDisplay.textContent = displayText;
    
    // Remove existing state classes
    timerDisplay.classList.remove('time-warning', 'time-critical', 'times-up');
    
    // Add appropriate state class based on time remaining
    if (seconds <= 0) {
      timerDisplay.classList.add('times-up');
      if (isMobile) {
        timerDisplay.textContent = '⏰ Time\'s Up!';
      }
    } else if (seconds <= 10) {
      timerDisplay.classList.add('time-critical');
    } else if (seconds <= 30) {
      timerDisplay.classList.add('time-warning');
    }
    
    // Set ARIA label for accessibility
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    let ariaLabel = '';
    if (seconds <= 0) {
      ariaLabel = 'Time is up';
    } else if (minutes > 0) {
      ariaLabel = `${minutes} minute${minutes > 1 ? 's' : ''} and ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''} remaining`;
    } else {
      ariaLabel = `${seconds} second${seconds !== 1 ? 's' : ''} remaining`;
    }
    timerDisplay.setAttribute('aria-label', ariaLabel);
  }

  function resetQuizTimer() {
    stopQuizTimer();
    const timerDisplay = document.querySelector('.quiz-timer-display');
    if (timerDisplay) {
      timerDisplay.textContent = `⏱️ ${quizDuration}s`;
      timerDisplay.classList.remove('times-up', 'time-warning', 'time-critical');
    }
    timeLeft = quizDuration;
    isTimerRunning = false;
  }

  // --- QUIZ PROGRESS FUNCTIONS ---

  /**
   * Update quiz progress bar
   * @param {number} current - Current question index (0-based)
   * @param {number} total - Total number of questions
   */
  function updateQuizProgress(current, total) {
    const progressBar = document.querySelector('.quiz-progress-fill');
    const progressText = document.querySelector('.quiz-progress-text');
    const progressContainer = document.querySelector('.quiz-progress-container');
    
    if (progressBar) {
      const percentage = ((current + 1) / total) * 100;
      progressBar.style.width = percentage + '%';
      
      // FORCE REPAINT FOR MOBILE - Critical fix for mobile devices
      // This ensures mobile browsers redraw the element
      progressBar.style.transform = 'translateZ(0)';
      progressBar.style.webkitTransform = 'translateZ(0)';
      
      // Force reflow for mobile Safari - critical for iOS
      void progressBar.offsetHeight;
      
      // Add smooth transition
      progressBar.style.transition = 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      
      // Update progress color based on percentage
      progressBar.classList.remove('progress-low', 'progress-medium', 'progress-high');
      if (percentage < 30) {
        progressBar.classList.add('progress-low');
      } else if (percentage < 70) {
        progressBar.classList.add('progress-medium');
      } else {
        progressBar.classList.add('progress-high');
      }
      
      // Add completion animation when done
      if (percentage === 100) {
        progressBar.classList.add('complete');
        setTimeout(() => {
          progressBar.classList.remove('complete');
        }, 1000);
      }
    }
    
    if (progressText) {
      progressText.textContent = `${current + 1}/${total}`;
    }
    
    if (progressContainer) {
      // Update aria-valuenow for accessibility
      progressContainer.setAttribute('aria-valuenow', ((current + 1) / total) * 100);
      progressContainer.setAttribute('aria-valuetext', `Question ${current + 1} of ${total}`);
    }
  }

  /**
   * Reset quiz progress
   * @param {number} total - Total number of questions
   */
  function resetQuizProgress(total) {
    currentQuestionIndex = 0;
    totalQuestions = total;
    answeredQuestions = new Set();
    updateQuizProgress(0, total);
  }

  /**
   * Advance to next question and update progress
   */
  function nextQuestion() {
    if (currentQuestionIndex < totalQuestions - 1) {
      currentQuestionIndex++;
      updateQuizProgress(currentQuestionIndex, totalQuestions);
      
      // Scroll to next question on mobile
      const nextQuestionEl = document.getElementById(`question-block-${currentQuestionIndex}`);
      if (nextQuestionEl && window.innerWidth <= 768) {
        setTimeout(() => {
          nextQuestionEl.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 300);
      }
    }
  }

  /**
   * Get current progress status
   */
  function getProgressStatus() {
    return {
      current: currentQuestionIndex + 1,
      total: totalQuestions,
      percentage: ((currentQuestionIndex + 1) / totalQuestions) * 100,
      answered: answeredQuestions.size
    };
  }

  // --- SCORE ANIMATION FUNCTIONS ---

  /**
   * Animate quiz score with smooth counter (2 seconds)
   * @param {number} finalScore - Final score percentage (0-100)
   * @param {number} duration - Animation duration in milliseconds
   */
  function animateScore(finalScore, duration = 2000) {
    const scoreElement = document.querySelector('.percentage-number');
    if (!scoreElement) {
      // Fallback: try to find any score display
      const altElement = document.querySelector('.score-number');
      if (altElement) {
        altElement.textContent = finalScore + '%';
      }
      return;
    }
    
    // Clear any existing animation
    if (scoreAnimationId) {
      cancelAnimationFrame(scoreAnimationId);
      scoreAnimationId = null;
    }
    
    const startTime = performance.now();
    const startScore = 0;
    
    // Easing function for smooth animation (ease-out cubic)
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }
    
    function updateScore(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const currentScore = Math.round(startScore + (finalScore - startScore) * easedProgress);
      
      // Update the percentage number display
      scoreElement.textContent = currentScore + '%';
      
      // Also update the score circle if it exists
      const scoreCircle = document.querySelector('.score-number');
      if (scoreCircle) {
        scoreCircle.textContent = `${Math.round((currentScore / 100) * currentQuestions.length)}/${currentQuestions.length}`;
      }
      
      // Add visual effects based on score
      const scoreContainer = document.querySelector('.quiz-score-container');
      if (scoreContainer) {
        scoreContainer.classList.remove('score-low', 'score-medium', 'score-high', 'score-perfect');
        
        if (currentScore === 100) {
          scoreContainer.classList.add('score-perfect');
        } else if (currentScore >= 80) {
          scoreContainer.classList.add('score-high');
        } else if (currentScore >= 60) {
          scoreContainer.classList.add('score-medium');
        } else {
          scoreContainer.classList.add('score-low');
        }
      }
      
      if (progress < 1) {
        scoreAnimationId = requestAnimationFrame(updateScore);
      } else {
        // Final update to ensure correct value
        scoreElement.textContent = finalScore + '%';
        scoreAnimationId = null;
        
        // Trigger celebration for perfect score
        if (finalScore === 100) {
          triggerCelebration();
        }
      }
    }
    
    scoreAnimationId = requestAnimationFrame(updateScore);
  }

  /**
   * Alternative: Step-based animation for better compatibility
   * @param {number} finalScore - Final score percentage (0-100)
   */
  function animateScoreStepBased(finalScore) {
    const scoreElement = document.querySelector('.percentage-number');
    if (!scoreElement) return;
    
    // Clear any existing interval
    if (scoreInterval) {
      clearInterval(scoreInterval);
      scoreInterval = null;
    }
    
    let currentScore = 0;
    const totalSteps = 20;
    const stepSize = Math.max(1, Math.ceil(finalScore / totalSteps));
    const intervalTime = Math.max(50, Math.min(150, 1800 / totalSteps));
    
    scoreInterval = setInterval(() => {
      currentScore += stepSize;
      if (currentScore >= finalScore) {
        currentScore = finalScore;
        clearInterval(scoreInterval);
        scoreInterval = null;
        
        if (finalScore === 100) {
          triggerCelebration();
        }
      }
      scoreElement.textContent = currentScore + '%';
    }, intervalTime);
  }

  /**
   * Trigger celebration effects for perfect score
   */
  function triggerCelebration() {
    const container = document.querySelector('.quiz-score-container');
    if (!container) return;
    
    // Add celebration class
    container.classList.add('celebrating');
    
    // Create confetti
    createConfetti();
    
    // Add sparkle effect
    const scoreElement = document.querySelector('.percentage-number');
    if (scoreElement) {
      scoreElement.classList.add('perfect-score');
    }
  }

  /**
   * Create confetti effect for perfect score
   */
  function createConfetti() {
    const container = document.querySelector('.quiz-score-container');
    if (!container) return;
    
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#22c55e', '#fbbf24'];
    const confettiCount = 60;
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      confetti.style.left = (Math.random() * 90 + 5) + '%';
      confetti.style.top = '-10px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.width = (Math.random() * 8 + 4) + 'px';
      confetti.style.height = (Math.random() * 8 + 4) + 'px';
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      confetti.style.position = 'absolute';
      confetti.style.pointerEvents = 'none';
      confetti.style.zIndex = '10';
      confetti.style.animation = `confettiFall ${Math.random() * 2 + 2}s linear forwards`;
      confetti.style.animationDelay = Math.random() * 0.8 + 's';
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      
      container.appendChild(confetti);
      
      // Remove confetti after animation
      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.remove();
        }
      }, 4000);
    }
  }

  /**
   * Animate XP gained with counter
   * @param {number} xpGained - XP amount
   * @param {number} duration - Animation duration in milliseconds
   */
  function animateXP(xpGained, duration = 1500) {
    // Look for XP display elements
    const xpElements = document.querySelectorAll('.xp-gained, .xp-earned');
    if (xpElements.length === 0) return;
    
    const xpElement = xpElements[0];
    const startTime = performance.now();
    const startXP = 0;
    
    function easeOutQuad(t) {
      return 1 - (1 - t) * (1 - t);
    }
    
    function updateXP(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuad(progress);
      const currentXP = Math.round(startXP + (xpGained - startXP) * easedProgress);
      
      xpElement.textContent = '+' + currentXP + ' XP';
      
      if (progress < 1) {
        requestAnimationFrame(updateXP);
      } else {
        xpElement.textContent = '+' + xpGained + ' XP ✨';
      }
    }
    
    requestAnimationFrame(updateXP);
  }

  /**
   * Show performance message based on score
   * @param {number} percentage - Score percentage
   */
  function showPerformanceMessage(percentage) {
    const messageElement = document.querySelector('.score-message');
    if (!messageElement) return;
    
    let message, emoji;
    
    if (percentage === 100) {
      message = '🌟 Perfect Score! You\'re a DSA Master! 🏆';
    } else if (percentage >= 80) {
      message = '🎉 Excellent! You have a great understanding! 💪';
    } else if (percentage >= 60) {
      message = '📚 Good job! Keep up the great work! 📖';
    } else if (percentage >= 40) {
      message = '🔄 Keep learning! Practice makes perfect! 🎯';
    } else {
      message = '📝 Don\'t give up! Review and try again! 💪';
    }
    
    messageElement.textContent = message;
    messageElement.style.animation = 'fadeInUp 0.5s ease';
  }


  // --- RESIZE HANDLER ---
  function handleResize() {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(() => {
      if (timeLeft !== undefined && timeLeft !== null) {
        updateTimerDisplay(timeLeft);
      }
    }, 250);

  // --- QUIZ SUBMISSION CONFIRMATION ---

  /**
   * Get count of unanswered questions
   * @param {string} containerId - The container ID of the quiz
   * @param {Array} questions - The current questions array
   * @returns {number} Count of unanswered questions
   */
  function getUnansweredCount(containerId, questions) {
    const form = document.getElementById(`${containerId}-form`);
    if (!form) return 0;
    
    let count = 0;
    questions.forEach((_, index) => {
      const selected = form.querySelector(`input[name="question-${index}"]:checked`);
      if (!selected) count++;
    });
    return count;
  }

  /**
   * Show custom confirmation modal for quiz submission
   * @param {Object} options - Configuration options
   */
  function showCustomConfirmModal(options) {
    const {
      title = 'Submit Quiz',
      message,
      confirmText = 'Yes, Submit',
      cancelText = 'Review Answers',
      onConfirm,
      unanswered = 0,
      total = 0
    } = options;
    
    // Remove existing modal if any
    const existing = document.getElementById('quizConfirmModal');
    if (existing) existing.remove();
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'quizConfirmModal';
    modal.className = 'quiz-confirm-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    
    const isComplete = unanswered === 0;
    const icon = isComplete ? '✅' : '⚠️';
    const iconColor = isComplete ? '#22c55e' : '#eab308';
    const statusText = isComplete ? 'All Questions Answered!' : `${unanswered} Question${unanswered > 1 ? 's' : ''} Unanswered`;
    
    modal.innerHTML = `
      <div class="quiz-confirm-modal-content">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 48px; margin-bottom: 12px;">${icon}</div>
          <h3 style="font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0;">${title}</h3>
          <p style="color: ${iconColor}; font-weight: 600; font-size: 14px; margin: 0;">${statusText}</p>
        </div>
        
        <div style="background: var(--bg-primary); border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid var(--border-color);">
          <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin: 0;">
            ${message}
          </p>
          ${unanswered > 0 ? `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
              <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">
                💡 <strong>${unanswered}</strong> question${unanswered > 1 ? 's' : ''} left unanswered
              </p>
            </div>
          ` : ''}
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="quizConfirmCancel" class="btn-cancel">${cancelText}</button>
          <button id="quizConfirmSubmit" class="btn-confirm ${isComplete ? 'complete' : ''}">${confirmText}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles if not already present
    if (!document.getElementById('quiz-confirm-styles')) {
      const style = document.createElement('style');
      style.id = 'quiz-confirm-styles';
      style.textContent = `
        .quiz-confirm-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          animation: quizFadeIn 0.3s ease;
        }
        .quiz-confirm-modal-content {
          background: var(--bg-secondary);
          border-radius: 20px;
          padding: 32px;
          max-width: 440px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
          animation: quizScaleIn 0.3s ease;
        }
        .quiz-confirm-modal .btn-cancel {
          padding: 10px 20px;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s ease;
          flex: 1;
        }
        .quiz-confirm-modal .btn-cancel:hover {
          background: var(--bg-hover);
        }
        .quiz-confirm-modal .btn-confirm {
          padding: 10px 20px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: white;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
          flex: 1;
        }
        .quiz-confirm-modal .btn-confirm.complete {
          background: linear-gradient(135deg, #22c55e, #16a34a);
        }
        .quiz-confirm-modal .btn-confirm:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
        }
        @keyframes quizFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes quizScaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .dark .quiz-confirm-modal-content {
          background: #1e293b;
          border-color: #334155;
        }
        .dark .quiz-confirm-modal .btn-cancel {
          color: #94a3b8;
          border-color: #334155;
        }
        .dark .quiz-confirm-modal .btn-cancel:hover {
          background: #334155;
        }
        @media (max-width: 480px) {
          .quiz-confirm-modal-content {
            padding: 24px;
          }
          .quiz-confirm-modal .btn-cancel,
          .quiz-confirm-modal .btn-confirm {
            width: 100%;
            justify-content: center;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Handle button clicks
    const cancelBtn = document.getElementById('quizConfirmCancel');
    const submitBtn = document.getElementById('quizConfirmSubmit');
    
    cancelBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    submitBtn.addEventListener('click', () => {
      modal.remove();
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
    });
    
    // Close on ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Show confirmation dialog before quiz submission
   * @param {string} containerId - The container ID of the quiz
   * @param {Array} questions - The current questions array
   * @param {Function} onConfirm - Callback when user confirms
   */
  function confirmQuizSubmission(containerId, questions, onConfirm) {
    const unanswered = getUnansweredCount(containerId, questions);
    const total = questions.length;
    
    let message = 'Are you sure you want to submit your quiz?';
    
    if (unanswered > 0) {
      message = `You have ${unanswered} unanswered question(s) out of ${total}. Are you sure you want to submit?`;
    } else {
      message = `You've answered all ${total} questions! Are you sure you want to submit?`;
    }
    
    showCustomConfirmModal({
      title: 'Submit Quiz',
      message: message,
      confirmText: 'Yes, Submit',
      cancelText: 'Review Answers',
      onConfirm: onConfirm,
      unanswered: unanswered,
      total: total
    });
  }

  // --- UPDATED HANDLE SUBMIT ---

  function handleSubmit() {
    if (hasSubmitted) return;
    
    // Show confirmation before submitting
    confirmQuizSubmission(containerId, currentQuestions, () => {
      // This runs only if user confirms
      performSubmit();
    });
  }

  /**
   * Perform the actual quiz submission
   */
  function performSubmit() {
    hasSubmitted = true;
    
    // Stop the timer
    stopQuizTimer();
    
    const form = document.getElementById(`${containerId}-form`);
    let score = 0;
    
    currentQuestions.forEach((q, index) => {
      const selectedInput = form.querySelector(`input[name="question-${index}"]:checked`);
      const selectedValue = selectedInput ? selectedInput.value : null;
      
      const isCorrect = selectedValue === q.answer;
      if (isCorrect) score++;
      
      // Highlight options
      const labels = form.querySelectorAll(`input[name="question-${index}"]`);
      labels.forEach(input => {
        input.disabled = true;
        const label = input.parentElement;
        if (input.value === q.answer) {
          label.classList.add('correct');
        } else if (input.checked && !isCorrect) {
          label.classList.add('incorrect');
        }
      });
      
      // Show feedback
      const feedbackDiv = document.getElementById(`feedback-${index}`);
      feedbackDiv.style.display = 'block';
      if (isCorrect) {
        feedbackDiv.innerHTML = `<p class="feedback-correct"><i class="fas fa-check-circle"></i> Correct! ${q.explanation || ''}</p>`;
      } else {
        feedbackDiv.innerHTML = `<p class="feedback-incorrect"><i class="fas fa-times-circle"></i> Incorrect. ${q.explanation || ''}</p>`;
      }
    });
    
    // Hide submit button
    const submitBtn = form.querySelector('.submit-quiz-btn');
    if (submitBtn) submitBtn.style.display = 'none';
    
    // Show score
    const scoreDiv = document.getElementById(`${containerId}-score`);
    scoreDiv.style.display = 'block';
    
    const totalQuestions = currentQuestions.length;
    const pct = Math.round((score / totalQuestions) * 100);
    
    // Check if time ran out
    const timeRanOut = timeLeft === 0;
    const timeMessage = timeRanOut ? '⏰ Time ran out! ' : '';
    
    // Build score display with animation support
    scoreDiv.innerHTML = `
      <div class="score-header">
        <h3>${timeMessage}Quiz Results</h3>
        <div class="score-circle ${pct >= 70 ? 'good' : 'needs-work'}">
          <span class="score-number">${score}/${totalQuestions}</span>
        </div>
      </div>
      <div class="score-percentage">
        <span class="percentage-number">0%</span>
        <span class="percentage-label">Score</span>
      </div>
      <div class="xp-gained">+0 XP</div>
      <p class="score-message"></p>
      <button class="btn btn-secondary retake-quiz-btn" id="${containerId}-retake">
        <i class="fas fa-redo"></i> Retake Quiz
      </button>
    `;
    
    // --- START ANIMATIONS ---
    
    // Animate score from 0 to final percentage (2 seconds)
    animateScore(pct, 2000);
    
    // Animate XP (if available)
    const xpEarned = Math.round((score / totalQuestions) * 50);
    animateXP(xpEarned, 1500);
    
    // Show performance message
    showPerformanceMessage(pct);
    
    // Retake button handler
    document.getElementById(`${containerId}-retake`).addEventListener('click', () => {
      setupQuiz();
      const y = container.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({top: y, behavior: 'smooth'});
    });

  }

  // Initialize and shuffle quiz data
  function setupQuiz() {
    hasSubmitted = false;
    resetQuizTimer();
    currentQuestions = shuffleArray(questions).map(q => {
      return {
        ...q,
        shuffledOptions: shuffleArray(q.options)
      };
    });
    renderQuiz();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
  }

  // Clean up function
  function cleanupQuiz() {
    window.removeEventListener('resize', handleResize);
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
      resizeTimeout = null;
    }
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // Render the quiz UI
  function renderQuiz() {
    container.innerHTML = '';
    
    // --- Timer Display with Mobile Support ---
    const timerContainer = document.createElement('div');
    timerContainer.className = 'quiz-timer-container';
    timerContainer.setAttribute('role', 'timer');
    timerContainer.setAttribute('aria-live', 'polite');
    
    // Check if mobile for different layout
    const isMobile = window.innerWidth <= 480;
    
    timerContainer.innerHTML = `
      <div class="quiz-timer-wrapper">
        <span class="quiz-timer-label">
          <i class="fas fa-clock"></i> 
          ${isMobile ? '' : 'Time Remaining:'}
        </span>
        <span class="quiz-timer-display" aria-label="Timer">⏱️ ${quizDuration}s</span>
      </div>
    `;
    container.appendChild(timerContainer);
    
    // --- Progress Bar ---
    const progressContainer = document.createElement('div');
    progressContainer.className = 'quiz-progress-container';
    progressContainer.setAttribute('role', 'progressbar');
    progressContainer.setAttribute('aria-valuemin', '0');
    progressContainer.setAttribute('aria-valuemax', '100');
    progressContainer.setAttribute('aria-valuenow', '0');
    progressContainer.innerHTML = `
      <div class="quiz-progress-header">
        <span class="quiz-progress-label">
          <i class="fas fa-tasks"></i> Progress
        </span>
        <span class="quiz-progress-text">1/${currentQuestions.length}</span>
      </div>
      <div class="quiz-progress-track">
        <div class="quiz-progress-fill" style="width: 0%;"></div>
      </div>
    `;
    container.appendChild(progressContainer);
    
    // Reset progress
    resetQuizProgress(currentQuestions.length);
    
    const quizForm = document.createElement('form');
    quizForm.className = 'quiz-form';
    quizForm.id = `${containerId}-form`;
    
    currentQuestions.forEach((q, index) => {
      const questionBlock = document.createElement('div');
      questionBlock.className = 'quiz-question-block glass-card';
      questionBlock.id = `question-block-${index}`;
      
      const questionTitle = document.createElement('h4');
      questionTitle.className = 'quiz-question-title';
      questionTitle.innerHTML = `<span class="question-number">${index + 1}.</span> ${q.question}`;
      questionBlock.appendChild(questionTitle);
      
      const optionsList = document.createElement('div');
      optionsList.className = 'quiz-options';
      
      q.shuffledOptions.forEach((option, optIndex) => {
        const optionLabel = document.createElement('label');
        optionLabel.className = 'quiz-option-label';
        
        const optionInput = document.createElement('input');
        optionInput.type = 'radio';
        optionInput.name = `question-${index}`;
        optionInput.value = option;
        
        // Add event listener to update progress on answer selection
        optionInput.addEventListener('change', function() {
          if (this.checked) {
            // Update progress when answer is selected
            answeredQuestions.add(index);
            updateQuizProgress(index, currentQuestions.length);
          }
        });
        
        const optionText = document.createElement('span');
        optionText.className = 'quiz-option-text';
        optionText.textContent = option;
        
        optionLabel.appendChild(optionInput);
        optionLabel.appendChild(optionText);
        optionsList.appendChild(optionLabel);
      });
      
      questionBlock.appendChild(optionsList);
      
      // Feedback container (hidden initially)
      const feedbackDiv = document.createElement('div');
      feedbackDiv.className = 'quiz-feedback';
      feedbackDiv.id = `feedback-${index}`;
      feedbackDiv.style.display = 'none';
      questionBlock.appendChild(feedbackDiv);
      
      quizForm.appendChild(questionBlock);
    });
    
    // Actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'quiz-actions';
    
    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = 'btn btn-primary submit-quiz-btn';
    submitBtn.textContent = 'Submit Quiz';
    submitBtn.addEventListener('click', handleSubmit);
    
    actionsDiv.appendChild(submitBtn);
    quizForm.appendChild(actionsDiv);
    
    // Score container (hidden initially)
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'quiz-score-container glass-card';
    scoreDiv.id = `${containerId}-score`;
    scoreDiv.style.display = 'none';
    
    container.appendChild(quizForm);
    container.appendChild(scoreDiv);

    // --- Start the timer ---
    startQuizTimer(() => {
      // Auto-submit when time runs out
      if (!hasSubmitted) {
        handleSubmit();
      }
    });
  }

  // --- QUIZ SUBMISSION CONFIRMATION ---

  /**
   * Get count of unanswered questions
   * @param {string} containerId - The container ID of the quiz
   * @param {Array} questions - The current questions array
   * @returns {number} Count of unanswered questions
   */
  function getUnansweredCount(containerId, questions) {
    const form = document.getElementById(`${containerId}-form`);
    if (!form) return 0;
    
    let count = 0;
    questions.forEach((_, index) => {
      const selected = form.querySelector(`input[name="question-${index}"]:checked`);
      if (!selected) count++;
    });
    return count;
  }

  /**
   * Show custom confirmation modal for quiz submission
   * @param {Object} options - Configuration options
   */
  function showCustomConfirmModal(options) {
    const {
      title = 'Submit Quiz',
      message,
      confirmText = 'Yes, Submit',
      cancelText = 'Review Answers',
      onConfirm,
      unanswered = 0,
      total = 0
    } = options;
    
    // Remove existing modal if any
    const existing = document.getElementById('quizConfirmModal');
    if (existing) existing.remove();
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'quizConfirmModal';
    modal.className = 'quiz-confirm-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    
    const isComplete = unanswered === 0;
    const icon = isComplete ? '✅' : '⚠️';
    const iconColor = isComplete ? '#22c55e' : '#eab308';
    const statusText = isComplete ? 'All Questions Answered!' : `${unanswered} Question${unanswered > 1 ? 's' : ''} Unanswered`;
    
    modal.innerHTML = `
      <div class="quiz-confirm-modal-content">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 48px; margin-bottom: 12px;">${icon}</div>
          <h3 style="font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0;">${title}</h3>
          <p style="color: ${iconColor}; font-weight: 600; font-size: 14px; margin: 0;">${statusText}</p>
        </div>
        
        <div style="background: var(--bg-primary); border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid var(--border-color);">
          <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin: 0;">
            ${message}
          </p>
          ${unanswered > 0 ? `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
              <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">
                💡 <strong>${unanswered}</strong> question${unanswered > 1 ? 's' : ''} left unanswered
              </p>
            </div>
          ` : ''}
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="quizConfirmCancel" class="btn-cancel">${cancelText}</button>
          <button id="quizConfirmSubmit" class="btn-confirm ${isComplete ? 'complete' : ''}">${confirmText}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles if not already present
    if (!document.getElementById('quiz-confirm-styles')) {
      const style = document.createElement('style');
      style.id = 'quiz-confirm-styles';
      style.textContent = `
        .quiz-confirm-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          animation: quizFadeIn 0.3s ease;
        }
        .quiz-confirm-modal-content {
          background: var(--bg-secondary);
          border-radius: 20px;
          padding: 32px;
          max-width: 440px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
          animation: quizScaleIn 0.3s ease;
        }
        .quiz-confirm-modal .btn-cancel {
          padding: 10px 20px;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s ease;
          flex: 1;
        }
        .quiz-confirm-modal .btn-cancel:hover {
          background: var(--bg-hover);
        }
        .quiz-confirm-modal .btn-confirm {
          padding: 10px 20px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: white;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
          flex: 1;
        }
        .quiz-confirm-modal .btn-confirm.complete {
          background: linear-gradient(135deg, #22c55e, #16a34a);
        }
        .quiz-confirm-modal .btn-confirm:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
        }
        @keyframes quizFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes quizScaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .dark .quiz-confirm-modal-content {
          background: #1e293b;
          border-color: #334155;
        }
        .dark .quiz-confirm-modal .btn-cancel {
          color: #94a3b8;
          border-color: #334155;
        }
        .dark .quiz-confirm-modal .btn-cancel:hover {
          background: #334155;
        }
        @media (max-width: 480px) {
          .quiz-confirm-modal-content {
            padding: 24px;
          }
          .quiz-confirm-modal .btn-cancel,
          .quiz-confirm-modal .btn-confirm {
            width: 100%;
            justify-content: center;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Handle button clicks
    const cancelBtn = document.getElementById('quizConfirmCancel');
    const submitBtn = document.getElementById('quizConfirmSubmit');
    
    cancelBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    submitBtn.addEventListener('click', () => {
      modal.remove();
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
    });
    
    // Close on ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Show confirmation dialog before quiz submission
   * @param {string} containerId - The container ID of the quiz
   * @param {Array} questions - The current questions array
   * @param {Function} onConfirm - Callback when user confirms
   */
  function confirmQuizSubmission(containerId, questions, onConfirm) {
    const unanswered = getUnansweredCount(containerId, questions);
    const total = questions.length;
    
    let message = 'Are you sure you want to submit your quiz?';
    
    if (unanswered > 0) {
      message = `You have ${unanswered} unanswered question(s) out of ${total}. Are you sure you want to submit?`;
    } else {
      message = `You've answered all ${total} questions! Are you sure you want to submit?`;
    }
    
    showCustomConfirmModal({
      title: 'Submit Quiz',
      message: message,
      confirmText: 'Yes, Submit',
      cancelText: 'Review Answers',
      onConfirm: onConfirm,
      unanswered: unanswered,
      total: total
    });
  }

  // --- UPDATED HANDLE SUBMIT ---

  function handleSubmit() {
    if (hasSubmitted) return;
    
    // Show confirmation before submitting
    confirmQuizSubmission(containerId, currentQuestions, () => {
      // This runs only if user confirms
      performSubmit();
    });
  }

  /**
   * Perform the actual quiz submission
   */
  function performSubmit() {
    hasSubmitted = true;
    
    // Stop the timer
    stopQuizTimer();
    
    const form = document.getElementById(`${containerId}-form`);
    let score = 0;
    
    currentQuestions.forEach((q, index) => {
      const selectedInput = form.querySelector(`input[name="question-${index}"]:checked`);
      const selectedValue = selectedInput ? selectedInput.value : null;
      
      const isCorrect = selectedValue === q.answer;
      if (isCorrect) score++;
      
      // Highlight options
      const labels = form.querySelectorAll(`input[name="question-${index}"]`);
      labels.forEach(input => {
        input.disabled = true;
        const label = input.parentElement;
        if (input.value === q.answer) {
          label.classList.add('correct');
        } else if (input.checked && !isCorrect) {
          label.classList.add('incorrect');
        }
      });
      
      // Show feedback
      const feedbackDiv = document.getElementById(`feedback-${index}`);
      feedbackDiv.style.display = 'block';
      if (isCorrect) {
        feedbackDiv.innerHTML = `<p class="feedback-correct"><i class="fas fa-check-circle"></i> Correct! ${q.explanation || ''}</p>`;
      } else {
        feedbackDiv.innerHTML = `<p class="feedback-incorrect"><i class="fas fa-times-circle"></i> Incorrect. ${q.explanation || ''}</p>`;
      }
    });
    
    // Hide submit button
    const submitBtn = form.querySelector('.submit-quiz-btn');
    if (submitBtn) submitBtn.style.display = 'none';
    
    // Show score
    const scoreDiv = document.getElementById(`${containerId}-score`);
    scoreDiv.style.display = 'block';
    
    const totalQuestions = currentQuestions.length;
    const pct = Math.round((score / totalQuestions) * 100);
    
    // Check if time ran out
    const timeRanOut = timeLeft === 0;
    const timeMessage = timeRanOut ? '⏰ Time ran out! ' : '';
    
    // Build score display with animation support
    scoreDiv.innerHTML = `
      <div class="score-header">
        <h3>${timeMessage}Quiz Results</h3>
        <div class="score-circle ${pct >= 70 ? 'good' : 'needs-work'}">
          <span class="score-number">${score}/${totalQuestions}</span>
        </div>
      </div>
      <div class="score-percentage">
        <span class="percentage-number">0%</span>
        <span class="percentage-label">Score</span>
      </div>
      <div class="xp-gained">+0 XP</div>
      <p class="score-message"></p>
      <button class="btn btn-secondary retake-quiz-btn" id="${containerId}-retake">
        <i class="fas fa-redo"></i> Retake Quiz
      </button>
    `;
    
    // --- START ANIMATIONS ---
    
    // Animate score from 0 to final percentage (2 seconds)
    animateScore(pct, 2000);
    
    // Animate XP (if available)
    const xpEarned = Math.round((score / totalQuestions) * 50);
    animateXP(xpEarned, 1500);
    
    // Show performance message
    showPerformanceMessage(pct);
    
    // Retake button handler
    document.getElementById(`${containerId}-retake`).addEventListener('click', () => {
      // Clean up old quiz
      cleanupQuiz();
      setupQuiz();
      // Scroll to top of quiz container
      const y = container.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({top: y, behavior: 'smooth'});
    });
  }


  // Start the quiz
  setupQuiz();
}

// --- EXPORT FUNCTIONS ---
export { 
  startQuizTimer, 
  stopQuizTimer, 
  resetQuizTimer, 
  updateTimerDisplay,
  getTimerStatus,
  animateScore,
  animateScoreStepBased,
  animateXP,
  triggerCelebration,
  createConfetti,
  updateQuizProgress,
  resetQuizProgress,
  nextQuestion,
  getProgressStatus,
  cleanupQuiz,
  handleResize
};

function getTimerStatus() {
  return {
    timeLeft: timeLeft,
    isRunning: isTimerRunning
  };
}

// Legacy global exports
window.initQuiz = initQuiz;
