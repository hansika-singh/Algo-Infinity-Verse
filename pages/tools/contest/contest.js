document.querySelectorAll(".register-btn").forEach(button => {
  button.addEventListener("click", () => {
    button.textContent = "Registered ✓";
    button.disabled = true;
  });
});
