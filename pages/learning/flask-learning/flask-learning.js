document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Interactive Typing Elements
    const typingContainer = document.getElementById("typingTextFlask");
    if (typingContainer) {
        const phrases = ["Routing Patterns...", "Micro-Architectures...", "REST Frameworks..."];
        let phraseIdx = 0;
        let charIdx = 0;
        let isDeleting = false;

        function type() {
            const currentPhrase = phrases[phraseIdx];
            if (isDeleting) {
                typingContainer.textContent = currentPhrase.substring(0, charIdx - 1);
                charIdx--;
            } else {
                typingContainer.textContent = currentPhrase.substring(0, charIdx + 1);
                charIdx++;
            }

            let typeSpeed = isDeleting ? 50 : 100;

            if (!isDeleting && charIdx === currentPhrase.length) {
                typeSpeed = 2000; // Pause at end
                isDeleting = true;
            } else if (isDeleting && charIdx === 0) {
                isDeleting = false;
                phraseIdx = (phraseIdx + 1) % phrases.length;
                typeSpeed = 500; // Pause before new word
            }

            setTimeout(type, typeSpeed);
        }
        type();
    }

    // 2. Clear out local sandbox loaders matching global configurations
    const loader = document.getElementById("loading-screen");
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = "0";
            setTimeout(() => loader.remove(), 400);
        }, 600);
    }

    // 3. Quiz Validation Engine Mapping
    const correctAnswers = {
        q1: "A",
        q2: "A"
    };

    const topicsCompleted = new Set();
    const totalTopics = 9;

    document.querySelectorAll(".flask-quiz-card").forEach(card => {
        const checkBtn = card.querySelector(".btn-quiz-check");
        const quizId = card.getAttribute("data-quiz-id");
        const feedback = card.querySelector(".quiz-feedback");

        checkBtn.addEventListener("click", () => {
            const selectedOpt = card.querySelector(`input[name="${quizId}"]:checked`);
            if (!selectedOpt) {
                feedback.textContent = "Please select an option first!";
                feedback.className = "quiz-feedback wrong";
                return;
            }

            if (selectedOpt.value === correctAnswers[quizId]) {
                feedback.textContent = "Correct answer! Excellent processing.";
                feedback.className = "quiz-feedback correct";
                
                // Track completed topics
                const lessonCard = card.closest(".flask-lesson");
                if (lessonCard) {
                    const topicNum = lessonCard.getAttribute("data-topic");
                    topicsCompleted.add(topicNum);
                    updateProgressBar();
                }
            } else {
                feedback.textContent = "Incorrect configuration. Review the module files above and try again.";
                feedback.className = "quiz-feedback wrong";
            }
        });
    });

    // 4. Update Application Progress Layout Bars Dynamically
    function updateProgressBar() {
        const countContainer = document.getElementById("progressCount");
        const fillContainer = document.getElementById("progressFill");
        const percentContainer = document.getElementById("progressPercent");

        const currentCount = topicsCompleted.size;
        const currentPercent = Math.round((currentCount / totalTopics) * 100);

        if (countContainer) countContainer.textContent = currentCount;
        if (fillContainer) fillContainer.style.width = `${currentPercent}%`;
        if (percentContainer) percentContainer.textContent = `${currentPercent}%`;
    }

    // 5. Code Copy Actions
    document.querySelectorAll(".flask-code-copy").forEach(btn => {
        btn.addEventListener("click", () => {
            const codeBlock = btn.closest(".flask-code-block").querySelector("code");
            navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                btn.textContent = "Copied!";
                setTimeout(() => btn.textContent = "Copy", 2000);
            });
        });
    });
});
