// modules/revisionCalendar.js

import { toDateKey } from './revisionScheduler.js';

export class RevisionCalendar {
  constructor(container, userProgress, options = {}) {
    this.container = container;
    this.userProgress = userProgress;
    this.currentDate = new Date();
    this.onDateClick = options.onDateClick || (() => {});
    this.focusedDate = new Date();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = "";

    const calendarWrapper = document.createElement("div");
    calendarWrapper.className = "calendar-wrapper";

    // Build Header
    const header = this.buildHeader();
    calendarWrapper.appendChild(header);

    // Build Grid container
    const grid = document.createElement("div");
    grid.className = "calendar-grid-container";
    grid.setAttribute("role", "grid");
    grid.setAttribute("aria-label", "Monthly Study Revision Calendar");

    // Build Day names header row
    const daysHeader = this.buildDaysHeader();
    grid.appendChild(daysHeader);

    // Build Calendar days grid
    const daysGrid = this.buildDaysGrid();
    grid.appendChild(daysGrid);

    calendarWrapper.appendChild(grid);
    this.container.appendChild(calendarWrapper);
  }

  buildHeader() {
    const headerEl = document.createElement("div");
    headerEl.className = "calendar-header";

    const prevBtn = document.createElement("button");
    prevBtn.className = "calendar-nav-btn";
    prevBtn.setAttribute("aria-label", "Previous Month");
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.render();
    });

    const nextBtn = document.createElement("button");
    nextBtn.className = "calendar-nav-btn";
    nextBtn.setAttribute("aria-label", "Next Month");
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.render();
    });

    const titleEl = document.createElement("h4");
    titleEl.className = "calendar-title";
    titleEl.id = "calendarMonthTitle";
    titleEl.setAttribute("aria-live", "polite");
    titleEl.textContent = this.currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    headerEl.appendChild(prevBtn);
    headerEl.appendChild(titleEl);
    headerEl.appendChild(nextBtn);
    return headerEl;
  }

  buildDaysHeader() {
    const daysRow = document.createElement("div");
    daysRow.className = "calendar-weekdays-row";
    daysRow.setAttribute("role", "row");

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    days.forEach(day => {
      const headerCell = document.createElement("div");
      headerCell.className = "calendar-weekday-cell";
      headerCell.setAttribute("role", "columnheader");
      headerCell.setAttribute("aria-label", day);
      headerCell.textContent = day[0]; // just show first letter or full
      daysRow.appendChild(headerCell);
    });

    return daysRow;
  }

  buildDaysGrid() {
    const bodyContainer = document.createElement("div");
    bodyContainer.className = "calendar-grid-body";
    bodyContainer.setAttribute("role", "rowgroup");

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();

    // Map of dates to states
    const dateStateMap = this.getDateStateMap(year, month);

    let row = document.createElement("div");
    row.className = "calendar-week-row";
    row.setAttribute("role", "row");

    // Add empty cell slots for start offsets
    for (let i = 0; i < firstDayIndex; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "calendar-day-cell empty";
      emptyCell.setAttribute("role", "gridcell");
      row.appendChild(emptyCell);
    }

    const todayKey = toDateKey(new Date());

    for (let dayNum = 1; dayNum <= numDays; dayNum++) {
      const cellDate = new Date(year, month, dayNum);
      const dateKey = toDateKey(cellDate);

      // Wrap to new row on Sunday
      if ((firstDayIndex + dayNum - 1) % 7 === 0 && dayNum > 1) {
        bodyContainer.appendChild(row);
        row = document.createElement("div");
        row.className = "calendar-week-row";
        row.setAttribute("role", "row");
      }

      const cell = document.createElement("div");
      cell.className = "calendar-day-cell";
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("tabindex", "0");
      cell.setAttribute("data-date", dateKey);

      const dayNumberLabel = document.createElement("span");
      dayNumberLabel.className = "day-number";
      dayNumberLabel.textContent = dayNum;
      cell.appendChild(dayNumberLabel);

      // State markers & coloring
      const dateState = dateStateMap[dateKey] || { completed: 0, pending: 0, overdue: 0 };
      let accessibilityDesc = `${cellDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. `;

      if (dateKey === todayKey) {
        cell.classList.add("today");
        accessibilityDesc += "Today. ";
      }

      if (dateState.completed > 0 || dateState.pending > 0 || dateState.overdue > 0) {
        const dotContainer = document.createElement("div");
        dotContainer.className = "calendar-dots";

        if (dateState.overdue > 0) {
          cell.classList.add("has-overdue");
          const dot = document.createElement("span");
          dot.className = "dot dot-overdue";
          dotContainer.appendChild(dot);
          accessibilityDesc += `${dateState.overdue} tasks overdue. `;
        }
        if (dateState.pending > 0) {
          cell.classList.add("has-pending");
          const dot = document.createElement("span");
          dot.className = "dot dot-pending";
          dotContainer.appendChild(dot);
          accessibilityDesc += `${dateState.pending} tasks pending. `;
        }
        if (dateState.completed > 0) {
          cell.classList.add("has-completed");
          const dot = document.createElement("span");
          dot.className = "dot dot-completed";
          dotContainer.appendChild(dot);
          accessibilityDesc += `${dateState.completed} tasks completed. `;
        }

        cell.appendChild(dotContainer);
      } else {
        accessibilityDesc += "No tasks scheduled.";
      }

      cell.setAttribute("aria-label", accessibilityDesc);

      // Interactivity
      cell.addEventListener("click", () => {
        // Remove active class from previous
        bodyContainer.querySelectorAll(".calendar-day-cell.active").forEach(el => el.classList.remove("active"));
        cell.classList.add("active");
        this.focusedDate = cellDate;
        this.onDateClick(dateKey, cellDate);
      });

      cell.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          cell.click();
        }
        // Basic Arrow Navigation
        let targetCell = null;
        if (e.key === "ArrowRight") {
          targetCell = cell.nextElementSibling || cell.parentElement.nextElementSibling?.firstElementChild;
        } else if (e.key === "ArrowLeft") {
          targetCell = cell.previousElementSibling || cell.parentElement.previousElementSibling?.lastElementChild;
        }
        if (targetCell && targetCell.classList.contains("calendar-day-cell") && !targetCell.classList.contains("empty")) {
          targetCell.focus();
        }
      });

      row.appendChild(cell);
    }

    // Pad last row
    const totalFilled = firstDayIndex + numDays;
    const paddingNeeded = 7 - (totalFilled % 7);
    if (paddingNeeded < 7) {
      for (let i = 0; i < paddingNeeded; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-day-cell empty";
        emptyCell.setAttribute("role", "gridcell");
        row.appendChild(emptyCell);
      }
    }

    bodyContainer.appendChild(row);
    return bodyContainer;
  }

  getDateStateMap(year, month) {
    const map = {};
    const schedule = this.userProgress.revisionSchedule || {};
    const calendar = this.userProgress.revisionCalendar || {};
    const history = calendar.history || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Process future & current schedules (pending/overdue tasks)
    for (const topicKey in schedule) {
      const s = schedule[topicKey];
      if (!s.nextReviewDate) continue;

      const nextReview = new Date(s.nextReviewDate);
      const nextReviewKey = toDateKey(nextReview);

      if (!map[nextReviewKey]) {
        map[nextReviewKey] = { completed: 0, pending: 0, overdue: 0 };
      }

      if (nextReview < today) {
        map[nextReviewKey].overdue++;
      } else {
        map[nextReviewKey].pending++;
      }
    }

    // 2. Process historical completions
    history.forEach(item => {
      const dateKey = item.dayKey;
      if (!map[dateKey]) {
        map[dateKey] = { completed: 0, pending: 0, overdue: 0 };
      }
      if (item.completed || item.status === 'completed') {
        map[dateKey].completed++;
        // If it was counted in pending/overdue above, balance it
        if (map[dateKey].pending > 0) map[dateKey].pending--;
        else if (map[dateKey].overdue > 0) map[dateKey].overdue--;
      }
    });

    return map;
  }
}
