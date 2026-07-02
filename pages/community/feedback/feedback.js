document.addEventListener("DOMContentLoaded", () => {
  // 1. Session and Authentication Verification
  const sessionNotice = document.getElementById("sessionNotice");
  
  async function verifySession() {
    try {
      const response = await fetch("/api/session", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          sessionNotice.className = "session-notice authenticated";
          const safeName = window.DOMSanitizer ? window.DOMSanitizer.escapeHtml(data.user.name) : data.user.name;
          const safeEmail = window.DOMSanitizer ? window.DOMSanitizer.escapeHtml(data.user.email) : data.user.email;
          sessionNotice.innerHTML = `<i class="fas fa-circle-check"></i> Submitting feedback as <strong>${safeName}</strong> (${safeEmail})`;
          return;
        }
      }
    } catch (err) {
      console.error("Failed to check user session:", err);
    }
    
    // Guest User Fallback
    sessionNotice.className = "session-notice guest";
    sessionNotice.innerHTML = `<i class="fas fa-circle-exclamation"></i> Submitting as <strong>Guest</strong>. <a href="login.html?next=feedback.html">Log in</a> to link this submission with your profile.`;
  }
  
  verifySession();

  // 2. Interactive Selection Cards Logic
  const typeCards = document.querySelectorAll(".type-card");
  const hiddenInput = document.getElementById("selectedFeedbackType");

  typeCards.forEach((card) => {
    card.addEventListener("click", () => {
      selectTypeCard(card);
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectTypeCard(card);
      }
    });
  });

  function selectTypeCard(selectedCard) {
    typeCards.forEach((c) => {
      c.classList.remove("selected");
      c.setAttribute("aria-checked", "false");
    });

    selectedCard.classList.add("selected");
    selectedCard.setAttribute("aria-checked", "true");
    hiddenInput.value = selectedCard.dataset.value;

    // Remove invalid style from type group
    selectedCard.closest(".form-group").classList.remove("invalid");
  }

  // 3. Textarea Character Counter
  const messageTextarea = document.getElementById("message");
  const charCounter = document.getElementById("charCounter");

  messageTextarea.addEventListener("input", () => {
    const len = messageTextarea.value.length;
    charCounter.textContent = `${len} / 1000 characters`;

    if (len >= 10 && len <= 1000) {
      messageTextarea.closest(".form-group").classList.remove("invalid");
    }
  });

  // Remove invalid style from subject input when typed
  const subjectInput = document.getElementById("subject");
  subjectInput.addEventListener("input", () => {
    if (subjectInput.value.trim().length >= 3) {
      subjectInput.closest(".form-group").classList.remove("invalid");
    }
  });

  // 4. Form Validation & Submission
  const feedbackForm = document.getElementById("feedbackForm");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = submitBtn.querySelector(".btn-text");
  const btnLoader = submitBtn.querySelector(".btn-loader");
  const submitMessage = document.getElementById("formSubmitMessage");

  feedbackForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let isValid = true;

    // Validate type card selection
    if (!hiddenInput.value) {
      hiddenInput.closest(".form-group").classList.add("invalid");
      isValid = false;
    } else {
      hiddenInput.closest(".form-group").classList.remove("invalid");
    }

    // Validate subject length (min 3 chars)
    if (subjectInput.value.trim().length < 3) {
      subjectInput.closest(".form-group").classList.add("invalid");
      isValid = false;
    } else {
      subjectInput.closest(".form-group").classList.remove("invalid");
    }

    // Validate message details (min 10 chars)
    if (messageTextarea.value.trim().length < 10) {
      messageTextarea.closest(".form-group").classList.add("invalid");
      isValid = false;
    } else {
      messageTextarea.closest(".form-group").classList.remove("invalid");
    }

    if (!isValid) {
      // Focus on first invalid input
      const firstInvalid = feedbackForm.querySelector(".form-group.invalid");
      if (firstInvalid) {
        const input = firstInvalid.querySelector("input, textarea, .type-card");
        if (input) input.focus();
      }
      return;
    }

    // Transition to loading state
    submitBtn.disabled = true;
    btnText.classList.add("hidden");
    btnLoader.classList.remove("hidden");
    submitMessage.classList.add("hidden");
    submitMessage.textContent = "";

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedbackType: hiddenInput.value,
          subject: subjectInput.value.trim(),
          message: messageTextarea.value.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "An error occurred while submitting feedback.");
      }

      // Submission Success
      showSuccessModal();
    } catch (err) {
      console.error("Feedback submission error:", err);
      submitMessage.textContent = err.message || "Failed to submit feedback. Please try again later.";
      submitMessage.className = "form-submit-message error";
      submitMessage.classList.remove("hidden");

      // Reset loading state
      submitBtn.disabled = false;
      btnText.classList.remove("hidden");
      btnLoader.classList.add("hidden");
    }
  });

  // 5. Success Modal Interaction
  const successModalOverlay = document.getElementById("successModalOverlay");
  const successModalCloseBtn = document.getElementById("successModalCloseBtn");

  function showSuccessModal() {
    successModalOverlay.classList.remove("hidden");
    successModalCloseBtn.focus();
  }

  successModalCloseBtn.addEventListener("click", () => {
    successModalOverlay.classList.add("hidden");
    feedbackForm.reset();

    // Reset Type Selection Cards
    typeCards.forEach((c) => {
      c.classList.remove("selected");
      c.setAttribute("aria-checked", "false");
    });
    hiddenInput.value = "";
    charCounter.textContent = "0 / 1000 characters";

    // Reset button states
    submitBtn.disabled = false;
    btnText.classList.remove("hidden");
    btnLoader.classList.add("hidden");

    // Redirect to home page
    window.location.href = "index.html";
  });
});
