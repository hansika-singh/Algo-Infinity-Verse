import { initLoader } from "./modules/loader.js";
import { initTheme } from "./modules/theme.js";
import { initNavbar } from "./modules/navbar.js";
import { initScrollTop } from "./modules/scrollTop.js";

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
      emailEl.innerHTML = `<i class="fas fa-envelope"></i> ${userProgress.email}`;
    } else {
      emailEl.innerHTML = `<i class="fas fa-envelope"></i> Not Provided`;
    }
  }
  
  if (joinDateEl) {
    joinDateEl.innerHTML = `<i class="fas fa-calendar-alt"></i> Joined: ${formatDate(userProgress.joinDate)}`;
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
      alert("Please upload your resume first");
      return;
    }


    const formData = new FormData();

    formData.append("resume", file);



    try{


      button.innerHTML = "Analyzing...";


      const response = await fetch(
        "http://localhost:5000/analyze-resume",
        {
          method:"POST",
          body:formData
        }
      );


      const data = await response.json();



      document.getElementById("resumeAnalysisResult")
      .style.display="block";



      document.getElementById("atsScore")
      .textContent=data.atsScore+"%";



      document.getElementById("missingSkills")
      .innerHTML=
      data.missingSkills
      .map(skill=>`<li>${skill}</li>`)
      .join("");



      document.getElementById("resumeSuggestions")
      .innerHTML=
      data.suggestions
      .map(item=>`<li>${item}</li>`)
      .join("");



      button.innerHTML="Analyze Resume";


    }
    catch(error){

      console.error(error);
      alert("Something went wrong");

      button.innerHTML="Analyze Resume";

    }


  });


}

// Page Initialization
document.addEventListener("DOMContentLoaded", () => {
  
  // Page utilities setup
  initLoader();
  initTheme();
  initNavbar();
  initScrollTop();
  initResumeAnalyzer();

  // Load and render user journey data
  loadUserData();
  populateProfileInfo();
  populateStats();
  renderDSAMastery();
  renderBadges();
  initExportPdf();
  

});
