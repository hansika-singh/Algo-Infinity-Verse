// 1. Declare these at the very top so they are available everywhere
let focusTimer = null;
let timeLeft = 1500; // 25 minutes * 60 seconds

/**
 * Updates the timer display element with the current formatted time.
 * Depends on timerDisplay DOM element and global timeLeft variable.
 */
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    if (!timerDisplay) return;
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 2. Now this will work because focusTimer is defined above
document.getElementById('start-btn')?.addEventListener('click', () => {
    if (!focusTimer) {
        focusTimer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(focusTimer);
                focusTimer = null;
                timeLeft = 1500; 
                updateTimerDisplay();
                void 0;
            }
        }, 1000);
    }
});

// Add your pause and reset logic below here...
// Pause button logic
document.getElementById('pause-btn')?.addEventListener('click', () => {
    if (focusTimer) {
        clearInterval(focusTimer);
        focusTimer = null;
    }
});

// Reset button logic
document.getElementById('reset-btn')?.addEventListener('click', () => {
    clearInterval(focusTimer);
    focusTimer = null;
    timeLeft = 1500; // Reset to 25 minutes
    updateTimerDisplay();
});