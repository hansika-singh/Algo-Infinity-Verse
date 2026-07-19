document.addEventListener("DOMContentLoaded", () => {
    // 1. Interactive Typing Engine Configuration
    const typingContainer = document.getElementById("typingTextDjango");
    if (typingContainer) {
        const phrases = ["ORM Architecture...", "Admin Interfaces...", "MVT Design Patterns..."];
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
                typeSpeed = 2000;
                isDeleting = true;
            } else if (isDeleting && charIdx === 0) {
                isDeleting = false;
                phraseIdx = (phraseIdx + 1) % phrases.length;
                typeSpeed = 500;
            }
            setTimeout(type, typeSpeed);
        }
        type();
    }

    // 2. Local View Reset Loader Actions
    const loader = document.getElementById("loading-screen");
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = "0";
            setTimeout(() => loader.remove(), 400);
        }, 600);
    }

    // 3. Quiz Keys & Tracking Mechanics
    const correctAnswers = { d1: "B", d2: "A" };
    const topicsCompleted = new Set();
    const totalTopics = 9;

    document.querySelectorAll(".django-quiz-card").forEach(card => {
        const checkBtn = card.querySelector(".btn-quiz-check");
        const quizId = card.getAttribute("data-quiz-id");
        const feedback = card.querySelector(".quiz-feedback");

        checkBtn.addEventListener("click", () => {
            const selectedOpt = card.querySelector(`input[name="${quizId}"]:checked`);
            if (!selectedOpt) {
                feedback.textContent = "Please choose an answer option!";
                feedback.className = "quiz-feedback wrong";
                return;
            }

            if (selectedOpt.value === correctAnswers[quizId]) {
                feedback.textContent = "Correct validation! Excellent execution.";
                feedback.className = "quiz-feedback correct";
                
                const lessonCard = card.closest(".django-lesson");
                if (lessonCard) {
                    topicsCompleted.add(lessonCard.getAttribute("data-topic"));
                    updateProgressBar();
                }
            } else {
                feedback.textContent = "Answer misconfigured. Re-read the snippet documentation and try again.";
                feedback.className = "quiz-feedback wrong";
            }
        });
    });

    function updateProgressBar() {
        const currentCount = topicsCompleted.size;
        const currentPercent = Math.round((currentCount / totalTopics) * 100);

        document.getElementById("progressCount").textContent = currentCount;
        document.getElementById("progressFill").style.width = `${currentPercent}%`;
        document.getElementById("progressPercent").textContent = `${currentPercent}%`;
    }

    // 4. Clipboard Processing Setup
    document.querySelectorAll(".django-code-copy").forEach(btn => {
        btn.addEventListener("click", () => {
            const codeBlock = btn.closest(".django-code-block").querySelector("code");
            navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                btn.textContent = "Copied!";
                setTimeout(() => btn.textContent = "Copy", 2000);
            });
        });
    });
});