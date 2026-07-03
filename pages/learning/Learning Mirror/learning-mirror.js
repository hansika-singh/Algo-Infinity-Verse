document.addEventListener("DOMContentLoaded", () => {
  const snapshots = {
    30: {
      title: "30 Days Ago",
      badge: "Snapshot",
      topics: 12,
      xp: 320,
      streak: 5,
      level: "Beginner",
      progress: 18,
      replayLabel: "Day 1",
      replayText: "Day 1: started the journey with basic topic exploration."
    },
    60: {
      title: "60 Days Ago",
      badge: "Snapshot",
      topics: 28,
      xp: 720,
      streak: 15,
      level: "Intermediate",
      progress: 42,
      replayLabel: "Day 30",
      replayText: "Day 30: consistency improved and more problem patterns were understood."
    },
    90: {
      title: "90 Days Ago",
      badge: "Snapshot",
      topics: 50,
      xp: 1400,
      streak: 30,
      level: "Advanced",
      progress: 68,
      replayLabel: "Day 60",
      replayText: "Day 60: stronger problem solving, better speed, and more confidence."
    }
  };

  const current = {
    topics: 75,
    xp: 2200,
    streak: 21,
    level: "Expert",
    progress: 100
  };

  const elements = {
    currentTopics: document.getElementById("currentTopics"),
    currentXp: document.getElementById("currentXp"),
    currentStreak: document.getElementById("currentStreak"),
    currentLevel: document.getElementById("currentLevel"),

    compareCurrentTopics: document.getElementById("compareCurrentTopics"),
    compareCurrentXp: document.getElementById("compareCurrentXp"),
    compareCurrentStreak: document.getElementById("compareCurrentStreak"),
    compareCurrentLevel: document.getElementById("compareCurrentLevel"),
    compareCurrentBar: document.getElementById("compareCurrentBar"),

    snapshotTitle: document.getElementById("snapshotTitle"),
    snapshotBadge: document.getElementById("snapshotBadge"),
    snapshotTopics: document.getElementById("snapshotTopics"),
    snapshotXp: document.getElementById("snapshotXp"),
    snapshotStreak: document.getElementById("snapshotStreak"),
    snapshotLevel: document.getElementById("snapshotLevel"),
    snapshotBar: document.getElementById("snapshotBar"),

    replayDayLabel: document.getElementById("replayDayLabel"),
    replayOutput: document.getElementById("replayOutput"),

    replayBtn: document.getElementById("replayBtn"),
    resetBtn: document.getElementById("resetBtn"),
    viewButtons: document.querySelectorAll(".mirror-view-btn")
  };

  // Validate critical elements exist
  const requiredElements = [
    'currentTopics', 'currentXp', 'currentStreak', 'currentLevel',
    'compareCurrentTopics', 'snapshotTitle', 'replayBtn', 'resetBtn'
  ];
  
  const missingElements = requiredElements.filter(key => !elements[key]);
  if (missingElements.length > 0) {
    console.error('Learning Mirror: Missing required elements:', missingElements);
    return; // Exit gracefully
  }

  let activeView = "30";
  let replayTimer = null;
  let replayIndex = 0;

  function setCurrentUI() {
    elements.currentTopics.textContent = current.topics;
    elements.currentXp.textContent = current.xp;
    elements.currentStreak.textContent = `${current.streak} days`;
    elements.currentLevel.textContent = current.level;

    elements.compareCurrentTopics.textContent = current.topics;
    elements.compareCurrentXp.textContent = current.xp;
    elements.compareCurrentStreak.textContent = `${current.streak} days`;
    elements.compareCurrentLevel.textContent = current.level;
    elements.compareCurrentBar.style.width = `${current.progress}%`;
  }

  function setSnapshot(view) {
    const snap = snapshots[view];
    if (!snap) return;

    activeView = view;

    elements.snapshotTitle.textContent = snap.title;
    document.getElementById("selectedPeriod")
    .textContent = snap.title;
    elements.snapshotBadge.textContent = snap.badge;
    elements.snapshotTopics.textContent = snap.topics;
    elements.snapshotXp.textContent = snap.xp;
    elements.snapshotStreak.textContent = `${snap.streak} days`;
    elements.snapshotLevel.textContent = snap.level;
    elements.snapshotBar.style.width = `${snap.progress}%`;

    // Growth Summary Update
    document.getElementById("topicsGrowth").textContent =
      "+" + (current.topics - snap.topics);

    document.getElementById("xpGrowth").textContent =
      "+" + (current.xp - snap.xp);

    document.getElementById("streakGrowth").textContent =
      "+" + (current.streak - snap.streak) + " Days";
    const topicsDelta = current.topics - snap.topics;
    document.getElementById("topicsGrowth").textContent =
      (topicsDelta >= 0 ? "+" : "") + topicsDelta;

    const xpDelta = current.xp - snap.xp;
    document.getElementById("xpGrowth").textContent =
      (xpDelta >= 0 ? "+" : "") + xpDelta;

    const streakDelta = current.streak - snap.streak;
    document.getElementById("streakGrowth").textContent =
      (streakDelta >= 0 ? "+" : "") + streakDelta + " Days";


    elements.replayDayLabel.textContent = snap.replayLabel;
    elements.replayOutput.textContent = snap.replayText;

    elements.viewButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });

    localStorage.setItem("learning-mirror-view", view);
      const isSelected = btn.dataset.view === view;
      btn.classList.toggle("active", isSelected);
      btn.setAttribute("aria-selected", isSelected);
    });

    try {
      localStorage.setItem("learning-mirror-view", view);
    } catch (error) {
      console.warn('Learning Mirror: Could not save view preference to localStorage', error);
      // Feature degrades gracefully - view preference just won't persist
    }
  }

  function replayJourney() {
    const steps = [
      {
        day: "Day 1",
        text: "Started the journey with curiosity and basic topic exploration."
      },
      {
      day:"Day 15",
      text:"Completed Arrays, Patterns and Basic Recursion."
      },
      {
        day:"Day 30",
        text:"Solved first 100 coding problems."
      },
      {
         day:"Day 60",
         text:"Mastered Binary Search and Two Pointers."
      },
      {
        day:"Day 90",
        text:"Became interview ready for DSA rounds."
      }
    ];

    clearInterval(replayTimer);
    replayIndex = 0;

    const nodes = document.querySelectorAll(".mirror-replay-node");
    nodes.forEach((node) => node.classList.remove("active"));

    replayTimer = setInterval(() => {
      nodes.forEach((node) => node.classList.remove("active"));
      if (nodes[replayIndex]) {
        nodes[replayIndex].classList.add("active");
      }

      elements.replayDayLabel.textContent = steps[replayIndex].day;
      elements.replayOutput.textContent = steps[replayIndex].text;

      replayIndex += 1;
      if (replayIndex >= steps.length) {
        clearInterval(replayTimer);
      }
    }, 1200);
  }

  elements.viewButtons.forEach((button) => {
    button.addEventListener("click", () => setSnapshot(button.dataset.view));
  });

  elements.replayBtn.addEventListener("click", replayJourney);

  elements.resetBtn.addEventListener("click", () => {
    clearInterval(replayTimer);
    replayIndex = 0;
    setSnapshot("30");
    setCurrentUI();

    const nodes = document.querySelectorAll(".mirror-replay-node");
    nodes.forEach((node, index) => {
      node.classList.toggle("active", index === 0);
    });
  });

  const savedView = localStorage.getItem("learning-mirror-view");
  setCurrentUI();
  setSnapshot(savedView && snapshots[savedView] ? savedView : "30");
});