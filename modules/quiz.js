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

  function updateTimerDisplay(seconds) {
    const timerDisplay = document.querySelector('.quiz-timer-display');
    if (!timerDisplay) return;
    
    // Format as MM:SS if needed
    if (seconds > 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      timerDisplay.textContent = `⏱️ ${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      timerDisplay.textContent = `⏱️ ${seconds}s`;
    }
    
    // Visual warnings for low time
    timerDisplay.classList.remove('time-warning', 'time-critical');
    if (seconds <= 10 && seconds > 0) {
      timerDisplay.classList.add('time-critical');
    } else if (seconds <= 30) {
      timerDisplay.classList.add('time-warning');
    }
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
  }

  // Render the quiz UI
  function renderQuiz() {
    container.innerHTML = '';
    
    // --- Timer Display ---
    const timerContainer = document.createElement('div');
    timerContainer.className = 'quiz-timer-container';
    timerContainer.innerHTML = `
      <div class="quiz-timer-wrapper">
        <span class="quiz-timer-label"><i class="fas fa-clock"></i> Time Remaining:</span>
        <span class="quiz-timer-display">⏱️ ${quizDuration}s</span>
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
            
            // Auto-advance to next question after short delay (optional)
            // setTimeout(() => nextQuestion(), 800);
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

  // Handle quiz submission
  function handleSubmit() {
    if (hasSubmitted) return;
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
        input.disabled = true; // Lock inputs
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
    const xpEarned = Math.round((score / totalQuestions) * 50); // 50 XP max
    animateXP(xpEarned, 1500);
    
    // Show performance message
    showPerformanceMessage(pct);
    
    // Retake button handler
    document.getElementById(`${containerId}-retake`).addEventListener('click', () => {
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
  getProgressStatus
};

function getTimerStatus() {
  return {
    timeLeft: timeLeft,
    isRunning: isTimerRunning
  };
}