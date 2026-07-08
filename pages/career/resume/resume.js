import { initLoader } from "/modules/loader.js";
import { initTheme } from "/modules/theme.js";
import { initNavbar } from "/modules/navbar.js";
import { initScrollTop } from "/modules/scrollTop.js";
import { escapeHtml } from "/modules/domSanitizer.js";

// DSA Topics database for progress calculation
const dsaTopics = [
  {
    name: "Arrays",
    icon: "📊",
    problemIds: [1, 4, 5, 9, 16, 17, 19, 20, 21],
  },
  {
    name: "Strings",
    icon: "🔤",
    problemIds: [2, 18],
  },
  {
    name: "Linked List",
    icon: "🔗",
    problemIds: [3, 10],
  },
  {
    name: "Trees",
    icon: "🌳",
    problemIds: [11, 12],
  },
  {
    name: "Graphs",
    icon: "🕸️",
    problemIds: [6, 8, 13, 15],
  },
  {
    name: "Dynamic Programming",
    icon: "🎯",
    problemIds: [7, 14, 22],
  },
];

// Badge template definition
const badgeTemplates = [
  {
    id: 1,
    icon: "🌟",
    name: "First Steps",
    description: "Begin your journey",
    criteria: "Solve 1 problem",
  },
  {
    id: 2,
    icon: "🔥",
    name: "On Fire",
    description: "Keep the momentum going",
    criteria: "Maintain a 7-day streak",
  },
  {
    id: 3,
    icon: "💎",
    name: "Diamond",
    description: "Reach a major XP milestone",
    criteria: "Earn 5,000 XP",
  },
  {
    id: 4,
    icon: "🚀",
    name: "Rocket",
    description: "Speed through problems",
    criteria: "Solve 50 problems",
  },
  {
    id: 5,
    icon: "👑",
    name: "Master",
    description: "Achieve expert problem-solving",
    criteria: "Solve 100 problems",
  },
  {
    id: 6,
    icon: "🎯",
    name: "Sharpshooter",
    description: "Hit the target with consistency",
    criteria: "Solve 25 problems and earn 2,500 XP",
  },
];

// Default User State Structure
let userProgress = {
  name: "Learner",
  email: "",
  avatar: "🚀",
  xp: 0,
  level: 1,
  completedProblems: [],
  solved: 0,
  streak: 0,
  badges: [],
  joinDate: "",
};

// Reconciled Solved Count
let solvedCount = 0;

function loadUserData() {
  try {
    const saved = localStorage.getItem("userProgress") || localStorage.getItem("algoInfinityVerse");
    if (saved) {
      const data = JSON.parse(saved);
      userProgress = { ...userProgress, ...data };
    }
    
    // Safety check completedProblems array
    if (!userProgress.completedProblems) {
      userProgress.completedProblems = [];
    }

    // Determine solved count based on completedProblems array length or solved property
    solvedCount = userProgress.solved !== undefined && typeof userProgress.solved === 'number'
      ? userProgress.solved
      : userProgress.completedProblems.length;
  } catch (error) {
    console.error("Error loading user data:", error);
  }
}

function formatDate(dateVal) {
  if (!dateVal) return "June 2026";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return dateVal;
  }
}

function populateProfileInfo() {
  const avatarEl = document.getElementById("resumeAvatar");
  const nameEl = document.getElementById("resumeName");
  const emailEl = document.getElementById("resumeEmail");
  const joinDateEl = document.getElementById("resumeJoinDate");

  if (avatarEl) avatarEl.textContent = userProgress.avatar || "🚀";
  if (nameEl) nameEl.textContent = userProgress.name || "Learner";
  
  if (emailEl) {
    if (userProgress.email) {
      emailEl.innerHTML = `<i class="fas fa-envelope"></i> ${escapeHtml(userProgress.email)}`;
    } else {
      emailEl.innerHTML = `<i class="fas fa-envelope"></i> Not Provided`;
    }
  }
  
  if (joinDateEl) {
    joinDateEl.innerHTML = `<i class="fas fa-calendar-alt"></i> Joined: ${escapeHtml(formatDate(userProgress.joinDate))}`;
  }
}

function populateStats() {
  const xpEl = document.getElementById("resumeXP");
  const levelEl = document.getElementById("resumeLevel");
  const solvedEl = document.getElementById("resumeSolved");
  const streakEl = document.getElementById("resumeStreak");

  if (xpEl) xpEl.textContent = (userProgress.xp || 0).toLocaleString();
  if (levelEl) levelEl.textContent = userProgress.level || 1;
  if (solvedEl) solvedEl.textContent = solvedCount;
  if (streakEl) streakEl.textContent = userProgress.streak || 0;
}

function renderDSAMastery() {
  const container = document.getElementById("dsaProgressContainer");
  if (!container) return;

  container.innerHTML = dsaTopics.map(topic => {
    const completed = topic.problemIds.filter(id => userProgress.completedProblems.includes(id)).length;
    const total = topic.problemIds.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return `
      <div class="dsa-progress-item">
        <div class="dsa-progress-label">
          <span class="dsa-topic-name">${topic.icon} ${topic.name}</span>
          <span class="dsa-topic-pct">${pct}% (${completed}/${total})</span>
        </div>
        <div class="dsa-progress-bar-bg">
          <div class="dsa-progress-bar-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderBadges() {
  const grid = document.getElementById("badgesGrid");
  if (!grid) return;

  grid.innerHTML = badgeTemplates.map(badge => {
    // Evaluate if badge is earned
    let isEarned = false;
    if (userProgress.badges && userProgress.badges.includes(badge.id)) {
      isEarned = true;
    } else {
      // Dynamic fallback evaluations matching script.js requirements
      if (badge.id === 1 && solvedCount >= 1) isEarned = true;
      if (badge.id === 2 && userProgress.streak >= 7) isEarned = true;
      if (badge.id === 3 && userProgress.xp >= 5000) isEarned = true;
      if (badge.id === 4 && solvedCount >= 50) isEarned = true;
      if (badge.id === 5 && solvedCount >= 100) isEarned = true;
      if (badge.id === 6 && solvedCount >= 25 && userProgress.xp >= 2500) isEarned = true;
    }

    return `
      <div class="resume-badge-card ${isEarned ? 'earned' : 'locked'}">
        ${!isEarned ? '<span class="resume-badge-lock"><i class="fas fa-lock"></i></span>' : ''}
        <div class="resume-badge-icon">${badge.icon}</div>
        <div class="resume-badge-name">${badge.name}</div>
        <div class="resume-badge-desc">${badge.description}</div>
      </div>
    `;
  }).join("");
}

function initExportPdf() {
  const btn = document.getElementById("exportPdfBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      window.print();
    });
  }
}
async function initResumeAnalyzer(){

  const button = document.getElementById("analyzeResumeBtn");
  const fileInput = document.getElementById("resumeUpload");


  if(!button) return;


  button.addEventListener("click", async ()=>{


    const file = fileInput.files[0];


    if(!file){
      void 0;
      return;
    }


    const formData = new FormData();

    formData.append("resume", file);



    try{


      button.innerHTML = "Analyzing...";


      const response = await fetch(
        "/api/analyze-resume",
        {
          method:"POST",
          body:formData
        }
      );


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze resume");
      }



      document.getElementById("resumeAnalysisResult")
      .style.display="block";



      document.getElementById("atsScore")
      .textContent=data.atsScore+"%";



      document.getElementById("missingSkills").innerHTML = 
        data.missingSkills && data.missingSkills.length > 0
          ? data.missingSkills.map(skill => `<li>${escapeHtml(skill)}</li>`).join("")
          : `<li style="border-left-color: #9ca3af; color: #9ca3af; background: rgba(156, 163, 175, 0.1);">No missing skills found!</li>`;



      document.getElementById("resumeSuggestions").innerHTML = 
        data.suggestions && data.suggestions.length > 0
          ? data.suggestions.map(item => `<li>${escapeHtml(item)}</li>`).join("")
          : `<li style="border-left-color: #9ca3af; color: #9ca3af; background: rgba(156, 163, 175, 0.1);">Looking great! No suggestions.</li>`;



      button.innerHTML="Analyze Resume";

      // Save to Audit History
      try {
        await fetch("/api/audit/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repoUrl: "Resume Upload",
            overallScore: data.atsScore,
            categoryScores: data.missingSkills || [],
            issuesCount: (data.missingSkills || []).length,
            recommendations: data.suggestions || []
          })
        });
        initAuditHistory();
      } catch (err) {
        console.error("Failed to save audit history:", err);
      }

    }
    catch(error){

      console.error(error);
      void 0;

      button.innerHTML="Analyze Resume";

    }


  });


}

function initJsonUpload() {
  const dropZone = document.getElementById("jsonDropZone");
  const fileInput = document.getElementById("jsonUploadInput");
  const browseBtn = document.getElementById("browseJsonBtn");
  const messageEl = document.getElementById("jsonUploadMessage");

  if (!dropZone || !fileInput || !browseBtn) return;

  // Browse button click
  browseBtn.addEventListener("click", () => {
    fileInput.click();
  });

  // Highlight drop zone on drag events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add("drag-active");
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("drag-active");
    }, false);
  });

  // Handle drop
  dropZone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  });

  // Handle file input change
  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  });

  function showMessage(msg, isError = false) {
    if(!messageEl) return;
    const iconClass = isError ? "fa-exclamation-circle" : "fa-check-circle";
    messageEl.innerHTML = `<i class="fas ${iconClass}"></i> ${escapeHtml(msg)}`;
    messageEl.style.display = "block";
    messageEl.className = "upload-message " + (isError ? "error" : "success");
    setTimeout(() => {
      messageEl.style.display = "none";
    }, 5000);
  }

  function processFile(file) {
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      showMessage("Invalid file type. Please upload a JSON file.", true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        
        // Basic validation
        if (!json || typeof json !== 'object') {
          throw new Error("Invalid JSON structure");
        }
        
        // Update userProgress
        userProgress = { ...userProgress, ...json };
        
        // Safety check completedProblems array
        if (!userProgress.completedProblems) {
          userProgress.completedProblems = [];
        }

        // Determine solved count
        solvedCount = userProgress.solved !== undefined && typeof userProgress.solved === 'number'
          ? userProgress.solved
          : userProgress.completedProblems.length;

        // Save to localStorage
        localStorage.setItem("userProgress", JSON.stringify(userProgress));
        
        // Update UI
        populateProfileInfo();
        populateStats();
        renderDSAMastery();
        renderBadges();
        
        showMessage("Resume data imported successfully!");
        
        // Reset input
        fileInput.value = "";
      } catch (err) {
        console.error("JSON Parsing Error:", err);
        showMessage("Failed to parse JSON file. Ensure it is correctly formatted.", true);
      }
    };
    reader.onerror = () => {
      showMessage("Error reading the file.", true);
    };
    
    reader.readAsText(file);
  }
}

let trendsChartInstance = null;

async function initAuditHistory() {
  const card = document.getElementById("auditHistoryCard");
  const tbody = document.getElementById("auditHistoryTableBody");
  if (!card || !tbody) return;

  try {
    const historyRes = await fetch("/api/audit/history");
    if (!historyRes.ok) return;
    const historyData = await historyRes.json();
    
    if (!historyData || historyData.length === 0) {
      card.style.display = "none";
      return;
    }

    card.style.display = "block";

    // Populate Table
    tbody.innerHTML = historyData.map((audit, index) => {
      const prevAudit = historyData[index + 1];
      let deltaStr = "-";
      if (prevAudit) {
        const delta = audit.overallScore - prevAudit.overallScore;
        if (delta > 0) deltaStr = `<span style="color: #4ade80;">+${delta}</span>`;
        else if (delta < 0) deltaStr = `<span style="color: #f87171;">${delta}</span>`;
        else deltaStr = `<span style="color: #9ca3af;">0</span>`;
      }

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 10px;">${new Date(audit.timestamp).toLocaleDateString()}</td>
          <td style="padding: 10px; font-weight: bold;" class="gradient-text">${audit.overallScore}%</td>
          <td style="padding: 10px;">${audit.issuesCount}</td>
          <td style="padding: 10px;">${deltaStr}</td>
        </tr>
      `;
    }).join("");

    // Render Chart
    const trendsRes = await fetch("/api/audit/trends");
    if (!trendsRes.ok) return;
    const trendsData = await trendsRes.json();

    const ctx = document.getElementById("trendsChart");
    if (!ctx) return;

    if (trendsChartInstance) {
      trendsChartInstance.destroy();
    }

    const labels = trendsData.map(t => new Date(t.timestamp).toLocaleDateString());
    const data = trendsData.map(t => t.overallScore);

    trendsChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "ATS Score",
          data,
          borderColor: "#60a5fa",
          backgroundColor: "rgba(96, 165, 250, 0.1)",
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });

  } catch (err) {
    console.error("Failed to load audit history:", err);
  }
}


// Page Initialization
document.addEventListener("DOMContentLoaded", () => {
  
  // Page utilities setup
  initLoader();
  initTheme();
  initNavbar();
  initScrollTop();
  initResumeAnalyzer();
  initJsonUpload();
  initAuditHistory();

  // Load and render user journey data
  loadUserData();
  populateProfileInfo();
  populateStats();
  renderDSAMastery();
  renderBadges();
  initExportPdf();
  

});
