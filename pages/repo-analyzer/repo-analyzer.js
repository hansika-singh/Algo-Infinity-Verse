import { initTheme } from "../../modules/theme.js";
import { initNavbar } from "../../modules/navbar.js";
import { initLoader } from "../../modules/loader.js";

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNavbar();
  initLoader();

  const analyzeBtn = document.getElementById("analyzeBtn");
  const repoUrlInput = document.getElementById("repoUrlInput");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const resultsContainer = document.getElementById("resultsContainer");

  const scoreDisplay = document.getElementById("scoreDisplay");
  const depsIcon = document.getElementById("depsIcon");
  const depsText = document.getElementById("depsText");
  const testsIcon = document.getElementById("testsIcon");
  const testsText = document.getElementById("testsText");
  const recommendationsList = document.getElementById("recommendationsList");

  analyzeBtn.addEventListener("click", async () => {
    const repoUrl = repoUrlInput.value.trim();
    if (!repoUrl) {
      alert("Please enter a valid GitHub URL");
      return;
    }

    loadingIndicator.style.display = "block";
    resultsContainer.style.display = "none";
    analyzeBtn.disabled = true;

    try {
      const response = await fetch("/api/analyze-repository", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze repository");
      }

      // Update UI with results
      scoreDisplay.textContent = data.score;
      
      // Update Dependencies Status
      if (data.details.hasDependencies) {
        depsIcon.innerHTML = '<i class="fas fa-check-circle icon-success"></i>';
        depsText.textContent = "Configured";
      } else {
        depsIcon.innerHTML = '<i class="fas fa-times-circle icon-error"></i>';
        depsText.textContent = "Missing";
      }

      // Update Tests Status
      if (data.details.hasTests) {
        testsIcon.innerHTML = '<i class="fas fa-check-circle icon-success"></i>';
        testsText.textContent = "Configured";
      } else {
        testsIcon.innerHTML = '<i class="fas fa-times-circle icon-error"></i>';
        testsText.textContent = "Missing";
      }

      // Update Recommendations
      recommendationsList.innerHTML = data.recommendations.map(rec => 
        `<li><i class="fas fa-arrow-right mr-2"></i> ${rec}</li>`
      ).join('');

      resultsContainer.style.display = "block";

    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      loadingIndicator.style.display = "none";
      analyzeBtn.disabled = false;
    }
  });
});
