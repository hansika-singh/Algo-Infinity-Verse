// pages/revision/revision.js

import { loadRevisionData, saveRevisionData } from '../../modules/revisionStorage.js';
import { calculateStats } from '../../modules/revisionStats.js';
import { RevisionCalendar } from '../../modules/revisionCalendar.js';
import { buildRevisionTasks, toDateKey, toggleRevisionTaskCompletion } from '../../modules/revisionScheduler.js';
import { defaultRevisionEngine } from '../../modules/revisionEngine.js';

let activeTab = "today";
let revisionCalendarInstance = null;
let currentTaskAction = null; // Stores task node during modal action

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Load data from sync/local storage
  await loadRevisionData(window.userProgress);

  // 2. Initial page render
  refreshDashboard();

  // 3. Bind tab buttons
  const tabs = {
    today: document.getElementById("tabToday"),
    overdue: document.getElementById("tabOverdue"),
    upcoming: document.getElementById("tabUpcoming")
  };

  const panels = {
    today: document.getElementById("panelToday"),
    overdue: document.getElementById("panelOverdue"),
    upcoming: document.getElementById("panelUpcoming")
  };

  Object.keys(tabs).forEach(tabKey => {
    const tabEl = tabs[tabKey];
    if (tabEl) {
      tabEl.addEventListener("click", () => {
        Object.keys(tabs).forEach(k => {
          tabs[k]?.classList.remove("active");
          tabs[k]?.setAttribute("aria-selected", "false");
          if (panels[k]) {
            panels[k].style.display = "none";
            panels[k].classList.remove("active");
          }
        });
        tabEl.classList.add("active");
        tabEl.setAttribute("aria-selected", "true");
        if (panels[tabKey]) {
          panels[tabKey].style.display = "block";
          panels[tabKey].classList.add("active");
        }
        activeTab = tabKey;
      });
    }
  });

  // 4. Bind Quick Start
  const quickStartBtn = document.getElementById("quickStartBtn");
  if (quickStartBtn) {
    quickStartBtn.addEventListener("click", () => {
      const state = buildRevisionTasks(window.userProgress);
      const overdueTasks = filterTasks(state.tasks, "overdue");
      const todayTasks = filterTasks(state.tasks, "today");

      const nextTask = overdueTasks[0] || todayTasks[0];
      if (nextTask) {
        startRevisionTask(nextTask);
      } else {
        if (window.Toast) {
          window.Toast.info("All caught up! No due revisions to start.", 3000);
        }
      }
    });
  }

  // 5. Bind modals
  setupModals();
});

function refreshDashboard() {
  const state = buildRevisionTasks(window.userProgress);
  const tasks = state.tasks || [];

  // Categorize tasks
  const todayTasks = filterTasks(tasks, "today");
  const overdueTasks = filterTasks(tasks, "overdue");
  const upcomingTasks = filterTasks(tasks, "upcoming");

  // Render list counters
  document.getElementById("countToday").textContent = todayTasks.length;
  document.getElementById("countOverdue").textContent = overdueTasks.length;
  document.getElementById("countUpcoming").textContent = upcomingTasks.length;

  // Render cards lists
  renderTasksList(document.getElementById("listToday"), todayTasks, "No revisions scheduled for today.");
  renderTasksList(document.getElementById("listOverdue"), overdueTasks, "Clear! No overdue revision sessions.");
  renderTasksList(document.getElementById("listUpcoming"), upcomingTasks, "No upcoming revisions scheduled.");

  // Render Stats & Streak
  const stats = calculateStats(window.userProgress);
  document.getElementById("streakCount").textContent = stats.streak;
  document.getElementById("longestStreakCount").textContent = stats.longestStreak;
  document.getElementById("totalRevisionsCount").textContent = stats.totalRevisions;
  document.getElementById("revisionLevelText").textContent = `Level ${stats.revisionLevel}`;
  document.getElementById("quizImprovementText").textContent = (stats.averageQuizImprovement >= 0 ? "+" : "") + stats.averageQuizImprovement + "%";

  const completedToday = tasks.filter(t => t.completed && isSameDay(new Date(t.nextReviewDate), new Date())).length;
  const totalToday = todayTasks.length + completedToday;
  const completionPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
  document.getElementById("completionToday").textContent = `${completionPercentage}%`;

  // Render Retention Dial
  document.getElementById("retentionScoreText").textContent = `${stats.overallRetentionEstimate}%`;
  const path = document.getElementById("retentionProgressPath");
  if (path) {
    path.style.strokeDasharray = `${stats.overallRetentionEstimate}, 100`;
  }

  // Render Mastered and Weak lists
  renderTopicsSummaryList(document.getElementById("masteredTopicsList"), stats.masteredTopics, "No topics mastered yet. Keep learning!");
  renderTopicsSummaryList(document.getElementById("weakestTopicsList"), stats.weakestTopics, "No weak areas detected.");

  // Render Timeline
  renderWeeklyTimeline(tasks);

  // Render Calendar
  const calContainer = document.getElementById("revisionCalendarContainer");
  if (calContainer) {
    if (!revisionCalendarInstance) {
      revisionCalendarInstance = new RevisionCalendar(calContainer, window.userProgress, {
        onDateClick: (dateKey, dateObj) => {
          showDateDetails(dateKey, dateObj, tasks);
        }
      });
    }
    revisionCalendarInstance.render();
  }
}

function filterTasks(tasks, category) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(today);

  return tasks.filter(task => {
    if (!task.nextReviewDate) return false;
    const taskDate = new Date(task.nextReviewDate);
    const taskDateKey = toDateKey(taskDate);

    if (category === "overdue") {
      return taskDate < today && !task.completed;
    } else if (category === "today") {
      return taskDateKey === todayKey && !task.completed;
    } else if (category === "upcoming") {
      return taskDate > today && !task.completed;
    }
    return false;
  });
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function getTopicLearningUrl(topicKey) {
  const map = {
    arrays: '/pages/learning/array-learning/array-learning.html',
    strings: '/pages/learning/trie-string-learning/trie-string-learning.html',
    linkedlist: '/pages/learning/linkedlist-learning/linkedlist-learning.html',
    trees: '/pages/learning/trees-learning/trees-learning.html',
    graphs: '/pages/learning/graph-learning/graph-learning.html',
    dp: '/pages/learning/dp-learning/dp-learning.html',
    matrix: '/pages/learning/matrix-learning/matrix-learning.html'
  };
  return map[topicKey] || '/index.html#topics';
}

function renderTasksList(container, tasksList, emptyMsg) {
  if (!container) return;
  if (tasksList.length === 0) {
    container.innerHTML = `<p class="empty-state">${emptyMsg}</p>`;
    return;
  }

  container.innerHTML = "";
  tasksList.forEach(task => {
    const card = document.createElement("div");
    card.className = `task-card ${task.priority || "medium"}`;

    card.innerHTML = `
      <div class="task-card-header">
        <div>
          <h4>${escapeHtml(task.topic)}</h4>
          <div class="task-meta-pills">
            <span class="pill-difficulty ${task.difficulty?.toLowerCase()}">${escapeHtml(task.difficulty)}</span>
            <span>• Stage ${task.intervalDays}d</span>
            <span>• Score: ${task.score}%</span>
          </div>
        </div>
        <span class="revision-pill ${task.priority || "medium"}">${task.priority}</span>
      </div>
      <p class="task-reason">${escapeHtml(task.reason)}</p>
      <div class="task-card-footer">
        <div class="task-footer-info">
          <span><i class="fas fa-clock"></i> ${task.duration || 15} mins</span>
        </div>
        <div class="task-actions">
          <button class="btn btn-primary btn-start-task" data-id="${task.id}">Start</button>
          <button class="btn btn-secondary btn-complete-task" data-id="${task.id}">Complete</button>
          <button class="btn btn-outline btn-skip-task" data-id="${task.id}">Skip</button>
          <button class="btn btn-outline btn-reschedule-task" data-id="${task.id}" aria-label="Reschedule task"><i class="fas fa-calendar-days"></i></button>
        </div>
      </div>
    `;

    // Bind card actions
    card.querySelector(".btn-start-task").addEventListener("click", () => startRevisionTask(task));
    card.querySelector(".btn-complete-task").addEventListener("click", () => promptRecallModal(task));
    card.querySelector(".btn-skip-task").addEventListener("click", () => skipRevisionTask(task));
    card.querySelector(".btn-reschedule-task").addEventListener("click", () => promptRescheduleModal(task));

    container.appendChild(card);
  });
}

function renderTopicsSummaryList(container, list, emptyMsg) {
  if (!container) return;
  if (list.length === 0) {
    container.innerHTML = `<li class="empty-state">${emptyMsg}</li>`;
    return;
  }
  container.innerHTML = "";
  list.forEach(topicKey => {
    const li = document.createElement("li");
    const name = (topicKey.charAt(0).toUpperCase() + topicKey.slice(1)).replace("linkedlist", "Linked List");
    li.innerHTML = `<span><i class="fas fa-chevron-right text-success"></i> ${escapeHtml(name)}</span>`;
    container.appendChild(li);
  });
}

function renderWeeklyTimeline(tasks) {
  const timelineGrid = document.getElementById("weeklyTimeline");
  if (!timelineGrid) return;
  timelineGrid.innerHTML = "";

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();

  for (let i = 0; i < 7; i++) {
    const day = new Date();
    day.setDate(now.getDate() + i);
    const dayKey = toDateKey(day);

    // Count tasks due on this day
    const dayTasks = tasks.filter(t => {
      if (t.completed) return false;
      const reviewDate = new Date(t.nextReviewDate);
      return toDateKey(reviewDate) === dayKey;
    });

    const timelineDay = document.createElement("div");
    timelineDay.className = "timeline-day" + (i === 0 ? " today" : "");

    timelineDay.innerHTML = `
      <span class="timeline-day-name">${weekdays[day.getDay()]}</span>
      <span class="timeline-day-date">${day.getDate()}</span>
      <span class="timeline-day-tasks ${dayTasks.length > 0 ? "has-tasks" : ""}">${dayTasks.length} task${dayTasks.length !== 1 ? "s" : ""}</span>
    `;

    timelineGrid.appendChild(timelineDay);
  }
}

function showDateDetails(dateKey, dateObj, tasks) {
  const drawer = document.getElementById("selectedDateDrawer");
  const container = document.getElementById("drawerTasksContainer");
  const title = document.getElementById("drawerDateTitle");

  if (!drawer || !container) return;

  const dateTasks = tasks.filter(t => toDateKey(new Date(t.nextReviewDate)) === dateKey);

  title.textContent = `Tasks on ${dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}:`;
  container.innerHTML = "";

  if (dateTasks.length === 0) {
    container.innerHTML = '<p class="empty-state">No revision sessions scheduled.</p>';
  } else {
    dateTasks.forEach(task => {
      const row = document.createElement("div");
      row.className = "drawer-task-row";
      row.innerHTML = `
        <strong>${escapeHtml(task.topic)}</strong>
        <span>Stage: ${task.intervalDays}d (${task.difficulty})</span>
      `;
      container.appendChild(row);
    });
  }

  drawer.classList.remove("hidden");
}

function startRevisionTask(task) {
  if (window.Toast) {
    window.Toast.info(`Redirecting to study materials for ${task.topic}...`, 2000);
  }
  setTimeout(() => {
    window.location.href = getTopicLearningUrl(task.topicKey);
  }, 1000);
}

function promptRecallModal(task) {
  currentTaskAction = task;
  document.getElementById("recallTopicName").textContent = task.topic;
  document.getElementById("completeRecallModal").classList.add("active");
}

function promptRescheduleModal(task) {
  currentTaskAction = task;
  document.getElementById("rescheduleModal").classList.add("active");
}

async function skipRevisionTask(task) {
  // Delays revision by 1 day, keeping current stage
  const now = new Date();
  const rescheduleDate = new Date();
  rescheduleDate.setDate(now.getDate() + 1);

  const schedule = window.userProgress.revisionSchedule[task.topicKey] || { currentStage: 0, history: [] };
  
  window.userProgress.revisionSchedule[task.topicKey] = {
    ...schedule,
    nextReviewDate: rescheduleDate.toISOString(),
    history: [
      ...(schedule.history || []),
      {
        reviewedAt: now.toISOString(),
        stageCompleted: schedule.currentStage,
        daysCalculated: 1,
        status: 'skipped'
      }
    ]
  };

  await saveRevisionData(window.userProgress);
  if (window.Toast) {
    window.Toast.success(`Postponed ${task.topic} by 1 day.`, 3000);
  }
  refreshDashboard();
}

function setupModals() {
  // Bind recall ratings
  document.querySelectorAll(".recall-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const quality = parseInt(btn.dataset.quality);
      if (!currentTaskAction) return;

      const task = currentTaskAction;
      const now = new Date();
      const dayKey = toDateKey(now);
      const schedule = window.userProgress.revisionSchedule[task.topicKey] || { currentStage: 0, history: [] };

      // Spaced repetition interval calculations based on quality
      const nextReviewResult = defaultRevisionEngine.calculateNext(schedule, {
        scorePercentage: quality >= 3 ? 95 : 50, // Map Good/Easy to 95% pass, Again to fail (50%)
        isIncorrect: quality < 3,
        difficulty: task.difficulty
      });

      // Update schedule
      window.userProgress.revisionSchedule[task.topicKey] = {
        ...schedule,
        currentStage: nextReviewResult.nextStage,
        nextReviewDate: nextReviewResult.nextReviewDate,
        history: [
          ...(schedule.history || []),
          {
            reviewedAt: now.toISOString(),
            stageCompleted: nextReviewResult.nextStage,
            daysCalculated: nextReviewResult.intervalDays,
            status: 'completed',
            quality
          }
        ]
      };

      // Add to calendar history log
      if (!window.userProgress.revisionCalendar) {
        window.userProgress.revisionCalendar = { tasks: [], history: [], streak: 0, longestStreak: 0, stats: {} };
      }
      window.userProgress.revisionCalendar.history.push({
        dayKey,
        completed: true,
        taskId: task.id,
        status: 'completed'
      });

      // Add XP points (standard + quality bonus)
      const xpGained = 40 + (quality === 5 ? 20 : 10);
      window.userProgress.xp = (Number(window.userProgress.xp) || 0) + xpGained;

      await saveRevisionData(window.userProgress);

      document.getElementById("completeRecallModal").classList.remove("active");
      if (window.Toast) {
        window.Toast.success(`Revision recorded! +${xpGained} XP. Next review in ${nextReviewResult.intervalDays} days.`, 4000);
      }
      
      refreshDashboard();
      currentTaskAction = null;
    });
  });

  // Bind custom reschedule modal
  const rescheduleModal = document.getElementById("rescheduleModal");
  document.querySelectorAll(".reschedule-opt-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const days = parseInt(btn.dataset.days);
      const date = new Date();
      date.setDate(date.getDate() + days);
      document.getElementById("customDatePicker").value = toDateKey(date);
    });
  });

  document.getElementById("confirmRescheduleBtn").addEventListener("click", async () => {
    const selectedDateStr = document.getElementById("customDatePicker").value;
    if (!selectedDateStr || !currentTaskAction) return;

    const rescheduleDate = new Date(selectedDateStr);
    rescheduleDate.setHours(9, 0, 0, 0); // Morning reminder default

    const task = currentTaskAction;
    const schedule = window.userProgress.revisionSchedule[task.topicKey] || { currentStage: 0, history: [] };

    window.userProgress.revisionSchedule[task.topicKey] = {
      ...schedule,
      nextReviewDate: rescheduleDate.toISOString(),
      history: [
        ...(schedule.history || []),
        {
          reviewedAt: new Date().toISOString(),
          stageCompleted: schedule.currentStage,
          daysCalculated: Math.round((rescheduleDate - Date.now()) / (1000 * 60 * 60 * 24)),
          status: 'rescheduled'
        }
      ]
    };

    await saveRevisionData(window.userProgress);
    rescheduleModal.classList.remove("active");
    if (window.Toast) {
      window.Toast.success(`Rescheduled ${task.topic} to ${rescheduleDate.toLocaleDateString()}`, 3000);
    }
    refreshDashboard();
    currentTaskAction = null;
  });

  // Modal closers
  document.getElementById("closeRecallBtn").addEventListener("click", () => {
    document.getElementById("completeRecallModal").classList.remove("active");
    currentTaskAction = null;
  });
  document.getElementById("closeRescheduleBtn").addEventListener("click", () => {
    rescheduleModal.classList.remove("active");
    currentTaskAction = null;
  });
  document.getElementById("cancelRescheduleBtn").addEventListener("click", () => {
    rescheduleModal.classList.remove("active");
    currentTaskAction = null;
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
