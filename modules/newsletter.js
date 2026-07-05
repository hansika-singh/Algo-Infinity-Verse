export function initNewsletterValidation() {
  const form = document.getElementById("newsletterForm");
  if (!form) return;
  const input = document.getElementById("newsletterEmail");
  const errorSpan = document.getElementById("newsletterError");
  if (!input || !errorSpan) return;
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const showError = (msg) => { errorSpan.textContent = msg; input.classList.add("input-error"); input.classList.remove("input-success"); input.setAttribute("aria-invalid", "true"); };
  const showSuccess = () => { errorSpan.textContent = ""; input.classList.remove("input-error"); input.classList.add("input-success"); input.removeAttribute("aria-invalid"); };
  const clearState = () => { errorSpan.textContent = ""; input.classList.remove("input-error", "input-success"); input.removeAttribute("aria-invalid"); };
  input.addEventListener("blur", () => { const val = input.value.trim(); if (!val) showError("Email address is required."); else if (!validateEmail(val)) showError("Please enter a valid email address."); else showSuccess(); });
  input.addEventListener("input", clearState);
  form.addEventListener("submit", (e) => { e.preventDefault(); const val = input.value.trim(); if (!val) { showError("Email address is required."); input.focus(); return; } if (!validateEmail(val)) { showError("Please enter a valid email address."); input.focus(); return; } showSuccess(); if (typeof showNotification === 'function') showNotification("🎉 Successfully subscribed to the newsletter!", "success"); input.value = ""; setTimeout(clearState, 1500); });
}
