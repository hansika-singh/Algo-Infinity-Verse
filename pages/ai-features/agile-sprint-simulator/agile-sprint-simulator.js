/* ============================================================
   AGILE SPRINT SIMULATOR  |  agile-sprint-simulator.js
   Issue #987 — Algo Infinity Verse

   ARCHITECTURE RULES (enforced by test suite):
   ① render*() / drawBurndown() → innerHTML only, ZERO addEventListener
   ② bindDnD()   → all drag listeners, called ONCE from init
   ③ bindClicks() → all click listeners via delegation, called ONCE
   ④ DND{}        → transient drag state, reset after every cycle
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  _bootLoader();
  _bootScrollTop();
  _bootNavbar();
  initAgileSprintSimulator();
});

/* ── Boot helpers (project-standard) ──────────────────── */
function _bootLoader() {
  setTimeout(() => {
    const s = document.getElementById("loading-screen");
    if (s) s.classList.add("hidden");
  }, 1500);
}
function _bootScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  window.addEventListener("scroll", () => btn.classList.toggle("visible", window.scrollY > 400));
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}
function _bootNavbar() {
  const toggle = document.getElementById("menuToggle");
  const nav    = document.getElementById("navLinks");
  if (!toggle || !nav) return;
  let overlay = document.querySelector(".nav-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    document.body.appendChild(overlay);
  }
  const open = (v) => {
    const o = v !== undefined ? v : !nav.classList.contains("active");
    nav.classList.toggle("active", o);
    toggle.setAttribute("aria-expanded", o);
    overlay.classList.toggle("active", o);
    document.body.style.overflow = o ? "hidden" : "";
    const ic = toggle.querySelector("i");
    if (ic) { ic.classList.toggle("fa-bars", !o); ic.classList.toggle("fa-times", o); }
  };
  toggle.addEventListener("click", (e) => { e.stopPropagation(); open(); });
  overlay.addEventListener("click", () => open(false));
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => open(false)));
}

/* ============================================================
   CONSTANTS & SAMPLE DATA
============================================================ */
const STORAGE_KEY = "agileSprintSim_v3";

const SAMPLE_STORIES = [
  { title:"User Login & Registration",  points:8,  priority:"critical", epic:"Auth"          },
  { title:"Product Listing Page",       points:5,  priority:"high",     epic:"Catalog"       },
  { title:"Shopping Cart",              points:8,  priority:"high",     epic:"Commerce"      },
  { title:"Checkout & Payment Flow",    points:13, priority:"critical", epic:"Commerce"      },
  { title:"User Profile Page",          points:3,  priority:"medium",   epic:"Auth"          },
  { title:"Email Notifications",        points:5,  priority:"medium",   epic:"Notifications" },
  { title:"Search & Filters",           points:8,  priority:"high",     epic:"Catalog"       },
  { title:"Admin Dashboard",            points:13, priority:"low",      epic:"Admin"         },
  { title:"Product Reviews & Ratings",  points:5,  priority:"low",      epic:"Catalog"       },
  { title:"Mobile Responsive Design",   points:8,  priority:"medium",   epic:"UI/UX"         },
  { title:"API Rate Limiting",          points:3,  priority:"medium",   epic:"Backend"       },
  { title:"Dark Mode Toggle",           points:2,  priority:"low",      epic:"UI/UX"         },
];

/* ============================================================
   STATE SHAPE
============================================================ */
function defaultState() {
  return {
    nextId : SAMPLE_STORIES.length + 1,
    backlog: SAMPLE_STORIES.map((s, i) => ({
      id: i + 1, title: s.title, points: s.points,
      priority: s.priority, epic: s.epic,
    })),
    sprint : {
      number    : 1,
      name      : "Sprint 1",
      duration  : 14,
      capacity  : 30,
      status    : "planning",       // 'planning' | 'active' | 'completed'
      stories   : [],               // stories committed during planning
      board     : { todo:[], inProgress:[], done:[] },
      totalPts  : 0,
      currentDay: 0,
      burndown  : [],               // [{day, remaining}]
    },
    velocityHistory: [],            // [{name, planned, actual}]
  };
}

let S  = {};

/* Drag-and-drop transient state — reset after every drag cycle */
const DND = { id: null, from: null };

/* ============================================================
   PERSISTENCE
============================================================ */
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); } catch (_) {}
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || !p.sprint || !Array.isArray(p.backlog)) return null;
    // Forward-compat: fill any missing board keys
    p.sprint.board = p.sprint.board || {};
    ["todo","inProgress","done"].forEach(k => {
      if (!Array.isArray(p.sprint.board[k])) p.sprint.board[k] = [];
    });
    if (!Array.isArray(p.velocityHistory)) p.velocityHistory = [];
    return p;
  } catch (_) { return null; }
}

/* ============================================================
   UTILITIES
============================================================ */
const $   = id => document.getElementById(id);
const esc = str => {
  const d = document.createElement("div");
  d.textContent = String(str || "");
  return d.innerHTML;
};
const sumPts = arr => (arr || []).reduce((s, st) => s + (st.points || 0), 0);

function committedPts() {
  const sp = S.sprint;
  if (sp.status === "planning") return sumPts(sp.stories);
  return sumPts([...sp.board.todo, ...sp.board.inProgress, ...sp.board.done]);
}
const donePts   = ()  => sumPts(S.sprint.board.done);
const remaining = ()  => Math.max(0, S.sprint.totalPts - donePts());

/* ============================================================
   STORY OPERATIONS
============================================================ */
function addStory(title, points, priority, epic) {
  S.backlog.push({
    id: S.nextId++,
    title   : title.trim(),
    points  : Number(points),
    priority,
    epic    : (epic || "General").trim(),
  });
  save();
  render();
}

function deleteStory(id) {
  S.backlog = S.backlog.filter(s => s.id !== id);
  save();
  render();
}

function assignToSprint(id) {
  if (S.sprint.status !== "planning") return;
  const idx = S.backlog.findIndex(s => s.id === id);
  if (idx < 0) return;
  const story = S.backlog.splice(idx, 1)[0];
  S.sprint.stories.push(story);
  save();
  render();
}

function returnToBacklog(id) {
  if (S.sprint.status !== "planning") return;
  const idx = S.sprint.stories.findIndex(s => s.id === id);
  if (idx < 0) return;
  const story = S.sprint.stories.splice(idx, 1)[0];
  S.backlog.push(story);
  save();
  render();
}

/* ============================================================
   SPRINT LIFECYCLE
============================================================ */
function startSprint() {
  const sp = S.sprint;
  if (!sp.stories.length) return;
  sp.name      = ($("spsSprintName").value || "").trim() || `Sprint ${sp.number}`;
  sp.duration  = Number($("spsSprintDuration").value) || 14;
  sp.capacity  = Number($("spsCapacity").value)       || 30;
  sp.status    = "active";
  sp.board.todo = [...sp.stories];
  sp.stories   = [];
  sp.totalPts  = sumPts(sp.board.todo);
  sp.currentDay = 0;
  sp.burndown  = [{ day: 0, remaining: sp.totalPts }];
  save();
  render();
}

function moveStory(id, toCol) {
  if (S.sprint.status !== "active") return;
  const board = S.sprint.board;
  let story = null;

  for (const col of ["todo","inProgress","done"]) {
    const idx = board[col].findIndex(s => s.id === id);
    if (idx >= 0) { story = board[col].splice(idx, 1)[0]; break; }
  }
  if (!story) return;

  board[toCol].push(story);

  // Update today's burndown snapshot
  const rem  = remaining();
  const bd   = S.sprint.burndown;
  const last = bd[bd.length - 1];
  if (last && last.day === S.sprint.currentDay) last.remaining = rem;
  else bd.push({ day: S.sprint.currentDay, remaining: rem });

  save();
  render();
}

function advanceDay() {
  const sp = S.sprint;
  if (sp.status !== "active") return;
  if (sp.currentDay >= sp.duration) { completeSprint(); return; }
  sp.currentDay++;
  sp.burndown.push({ day: sp.currentDay, remaining: remaining() });
  if (sp.currentDay >= sp.duration) { completeSprint(); return; }
  save();
  render();
}

function completeSprint() {
  const sp = S.sprint;
  sp.status    = "completed";
  const actual = donePts();
  S.velocityHistory.push({ name: sp.name, planned: sp.totalPts, actual });
  // Ensure final burndown point
  const last = sp.burndown[sp.burndown.length - 1];
  if (!last || last.day !== sp.duration) {
    sp.burndown.push({ day: sp.duration, remaining: remaining() });
  }
  save();
  render();
}

function startNewSprint() {
  const sp = S.sprint;
  // Carry incomplete stories back
  S.backlog.unshift(...sp.board.todo, ...sp.board.inProgress);
  S.sprint = {
    number    : sp.number + 1,
    name      : `Sprint ${sp.number + 1}`,
    duration  : sp.duration,
    capacity  : sp.capacity,
    status    : "planning",
    stories   : [],
    board     : { todo:[], inProgress:[], done:[] },
    totalPts  : 0,
    currentDay: 0,
    burndown  : [],
  };
  save();
  render();
}

function resetAllData() {
  if (!confirm("Clear all sprint data and start fresh? This cannot be undone.")) return;
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  S = defaultState();
  render();
  // Reset form pickers to defaults
  resetPickersToDefault();
}

/* ============================================================
   RENDER — pure innerHTML, ZERO addEventListener
============================================================ */
function render() {
  renderConfigBar();
  renderBacklog();
  renderBoard();
  renderActions();
  renderStats();
  drawBurndown();
  renderVelocity();
  renderReview();
}

/* ── Config bar ─────────────────────────────────────── */
function renderConfigBar() {
  const sp     = S.sprint;
  const locked = sp.status !== "planning";

  ["spsSprintName","spsSprintDuration","spsCapacity"].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.disabled = locked;
    if (!locked) {
      if (id === "spsSprintName")     el.value = sp.name;
      if (id === "spsSprintDuration") el.value = sp.duration;
      if (id === "spsCapacity")       el.value = sp.capacity;
    }
  });

  const badge = $("spsPhaseBadge");
  if (badge) {
    badge.className = `sps-phase-badge ${sp.status}`;
    badge.innerHTML = {
      planning : '<i class="fas fa-drafting-compass"></i> Planning',
      active   : '<i class="fas fa-bolt"></i> Sprint Active',
      completed: '<i class="fas fa-flag-checkered"></i> Completed',
    }[sp.status] || '<i class="fas fa-drafting-compass"></i> Planning';
  }

  const ctr = $("spsDayCounter");
  if (ctr) ctr.textContent = `Day ${sp.currentDay} / ${sp.duration}`;
}

/* ── Backlog panel ──────────────────────────────────── */
function renderBacklog() {
  const list   = $("spsBacklogList");
  const metaEl = $("spsBacklogMeta");
  if (!list) return;

  const sp       = S.sprint;
  const inSprint = new Set([
    ...sp.stories.map(s => s.id),
    ...sp.board.todo.map(s => s.id),
    ...sp.board.inProgress.map(s => s.id),
    ...sp.board.done.map(s => s.id),
  ]);

  if (metaEl) {
    metaEl.innerHTML = `
      <span>${S.backlog.length} stories</span>
      <span><strong>${sumPts(S.backlog)}</strong> pts total</span>
    `;
  }

  if (!S.backlog.length) {
    list.innerHTML = `
      <div style="text-align:center;color:var(--text-secondary);padding:1.5rem .5rem;font-size:.82rem;opacity:.6">
        <i class="fas fa-inbox" style="display:block;font-size:1.4rem;margin-bottom:.5rem;opacity:.3"></i>
        Backlog is empty. Add stories above.
      </div>
    `;
    return;
  }

  list.innerHTML = S.backlog.map(s => backlogCardHTML(s, inSprint.has(s.id))).join("");
}

function backlogCardHTML(s, dimmed) {
  return `
    <div class="sps-story-card${dimmed ? " in-sprint" : ""}"
         draggable="${!dimmed}"
         data-id="${s.id}"
         data-source="backlog"
         data-priority="${esc(s.priority)}">
      <i class="fas fa-grip-vertical sps-drag-handle"></i>
      <div class="sps-story-body">
        <div class="sps-story-title-text" title="${esc(s.title)}">${esc(s.title)}</div>
        <div class="sps-story-chips">
          <span class="sps-epic-chip">${esc(s.epic)}</span>
          <span class="sps-pri-chip ${esc(s.priority)}">${esc(s.priority)}</span>
        </div>
      </div>
      <span class="sps-pts-badge">${s.points}</span>
      ${dimmed ? "" : `
        <button class="sps-del-btn" data-action="delete-story" data-id="${s.id}" title="Delete story">
          <i class="fas fa-xmark"></i>
        </button>
      `}
    </div>
  `;
}

/* ── Sprint board ───────────────────────────────────── */
function renderBoard() {
  const sp     = S.sprint;
  const cap    = sp.capacity || 30;
  const commit = committedPts();
  const pct    = cap > 0 ? Math.min(200, Math.round((commit / cap) * 100)) : 0;

  const fill  = $("spsCapacityFill");
  const info  = $("spsCapacityInfo");
  const pctEl = $("spsCapacityPct");
  const title = $("spsBoardTitle");

  if (fill) {
    fill.style.width = `${Math.min(100, pct)}%`;
    fill.className   = `sps-capacity-fill${pct > 100 ? " over" : ""}`;
  }
  if (info)  info.textContent  = `${commit} / ${cap} pts committed`;
  if (pctEl) {
    pctEl.textContent = `${pct}% loaded`;
    pctEl.style.color = pct > 100 ? "#ef4444" : pct >= 90 ? "#f59e0b" : "var(--text-secondary)";
  }
  if (title) title.innerHTML = `<i class="fas fa-bolt"></i> ${esc(sp.name)}`;

  if (sp.status === "planning") {
    renderPlanningZone();
    const pz = $("spsPlanningZone"); if (pz) pz.classList.remove("hidden");
    const kb = $("spsKanban");       if (kb) kb.classList.add("hidden");
  } else {
    const pz = $("spsPlanningZone"); if (pz) pz.classList.add("hidden");
    const kb = $("spsKanban");       if (kb) kb.classList.remove("hidden");
    renderKanban();
  }
}

function renderPlanningZone() {
  const stories = $("spsSprintStories");
  const emptyEl = $("spsPlanningEmpty");
  const sp      = S.sprint;

  if (emptyEl) emptyEl.style.display = sp.stories.length ? "none" : "";
  if (!stories) return;

  stories.innerHTML = sp.stories.map(s => `
    <div class="sps-sprint-story" data-priority="${esc(s.priority)}">
      <span class="sps-pts-badge">${s.points}</span>
      <span class="sps-story-title-text" style="flex:1" title="${esc(s.title)}">${esc(s.title)}</span>
      <span class="sps-epic-chip">${esc(s.epic)}</span>
      <button class="sps-return-btn" data-action="return-story" data-id="${s.id}">
        <i class="fas fa-arrow-left"></i> Remove
      </button>
    </div>
  `).join("");
}

function renderKanban() {
  const COLS = {
    todo      : { bodyId:"bodyTodo",       countId:"countTodo"       },
    inProgress: { bodyId:"bodyInProgress", countId:"countInProgress" },
    done      : { bodyId:"bodyDone",       countId:"countDone"       },
  };
  const board  = S.sprint.board;
  const locked = S.sprint.status === "completed";

  Object.entries(COLS).forEach(([col, { bodyId, countId }]) => {
    const body    = $(bodyId);
    const countEl = $(countId);
    if (!body) return;

    const stories = board[col] || [];
    if (countEl) countEl.textContent = stories.length;

    body.innerHTML = stories.length
      ? stories.map(s => kanbanCardHTML(s, col, locked)).join("")
      : `<div class="sps-col-empty">Drop stories here</div>`;
  });
}

function kanbanCardHTML(s, col, locked) {
  const prev = { inProgress:"todo",      done:"inProgress" }[col];
  const next = { todo:"inProgress", inProgress:"done"      }[col];
  return `
    <div class="sps-kb-card"
         draggable="${!locked}"
         data-id="${s.id}"
         data-source="${col}"
         data-priority="${esc(s.priority)}">
      <div class="sps-kb-title">${esc(s.title)}</div>
      <div class="sps-kb-footer">
        <span class="sps-kb-pts">${s.points} pts</span>
        <span class="sps-kb-epic">${esc(s.epic)}</span>
      </div>
      ${locked ? "" : `
        <div class="sps-kb-move-btns">
          ${prev ? `<button class="sps-kb-move" data-action="move-story" data-id="${s.id}" data-to="${prev}">← Back</button>` : ""}
          ${next ? `<button class="sps-kb-move" data-action="move-story" data-id="${s.id}" data-to="${next}">→ ${next === "done" ? "Done" : "Start"}</button>` : ""}
        </div>
      `}
    </div>
  `;
}

/* ── Action bar ─────────────────────────────────────── */
function renderActions() {
  const el = $("spsActions");
  if (!el) return;
  const sp     = S.sprint;
  const n      = sp.stories.length;
  const commit = committedPts();
  const dayPct = Math.min(100, Math.round((sp.currentDay / sp.duration) * 100));
  const isLast = sp.currentDay >= sp.duration;

  el.innerHTML = {
    planning: `
      <button class="sps-btn sps-btn-green" data-action="start-sprint" ${n ? "" : "disabled"}>
        <i class="fas fa-rocket"></i> Start Sprint
      </button>
      <span class="sps-action-info">
        ${n} stor${n !== 1 ? "ies" : "y"} &middot; <b>${commit} pts</b> committed
      </span>
    `,
    active: `
      <button class="sps-btn sps-btn-blue" data-action="advance-day">
        <i class="fas fa-forward-step"></i> ${isLast ? "End Sprint" : "Advance Day"}
      </button>
      <button class="sps-btn sps-btn-ghost sps-btn-sm" data-action="complete-sprint">
        <i class="fas fa-flag-checkered"></i> Complete Now
      </button>
      <div class="sps-day-progress">
        <span class="sps-day-progress-lbl">Day ${sp.currentDay} of ${sp.duration}</span>
        <div class="sps-dp-track">
          <div class="sps-dp-fill" style="width:${dayPct}%"></div>
        </div>
      </div>
    `,
    completed: `
      <button class="sps-btn sps-btn-green" data-action="new-sprint">
        <i class="fas fa-rotate"></i> Start Sprint ${sp.number + 1}
      </button>
      <span class="sps-action-done">
        <i class="fas fa-check-circle"></i>
        Sprint ${sp.number} complete — ${donePts()} pts delivered
      </span>
    `,
  }[sp.status] || "";
}

/* ── Stats grid ─────────────────────────────────────── */
function renderStats() {
  const el = $("spsStatsGrid");
  if (!el) return;
  const sp      = S.sprint;
  const cap     = sp.capacity || 30;
  const commit  = committedPts();
  const done    = donePts();
  const pct     = cap > 0 ? Math.min(200, Math.round((commit / cap) * 100)) : 0;
  const hist    = S.velocityHistory;
  const vel     = hist.length
    ? Math.round(hist.reduce((s, v) => s + v.actual, 0) / hist.length)
    : "—";

  const loadClr = pct > 100 ? "#ef4444" : pct >= 85 ? "#f59e0b" : "#22c55e";
  const doneClr = done > 0  ? "#22c55e" : "var(--text-secondary)";

  el.innerHTML = [
    { icon:"fa-gauge-high",   lbl:"Team Capacity",   val:cap,
      sub:"story points",           clr:"var(--text-primary)"  },
    { icon:"fa-database",     lbl:"Committed",        val:commit,
      sub:`${pct}% of capacity`,    clr:loadClr                },
    { icon:"fa-check-double", lbl:"Points Done",
      val:sp.status === "planning" ? "—" : done,
      sub:sp.status === "planning" ? "not started" : `of ${sp.totalPts} total`,
      clr:doneClr },
    { icon:"fa-bolt",         lbl:"Avg Velocity",     val:vel,
      sub:"pts/sprint (history)",   clr:"#3b82f6"              },
  ].map(s => `
    <div class="sps-stat-card">
      <div class="sps-stat-lbl">
        <i class="fas ${s.icon}" style="color:${s.clr}"></i> ${s.lbl}
      </div>
      <div class="sps-stat-val" style="color:${s.clr}">${s.val}</div>
      <div class="sps-stat-sub">${s.sub}</div>
    </div>
  `).join("");
}

/* ── Burndown chart ──────────────────────────────────── */
function drawBurndown() {
  const canvas = $("spsBurndownCanvas");
  if (!canvas) return;
  const sp  = S.sprint;
  const ctx = canvas.getContext("2d");
  const W   = canvas.clientWidth || 248;
  const H   = 185;
  canvas.width  = W;
  canvas.height = H;

  const PAD      = { t:18, r:14, b:34, l:44 };
  const cW       = W - PAD.l - PAD.r;
  const cH       = H - PAD.t - PAD.b;
  const totalPts = sp.totalPts || committedPts() || 30;
  const dur      = sp.duration || 14;

  const xOf = d   => PAD.l + (d / dur) * cW;
  const yOf = pts => PAD.t + cH - (Math.max(0, pts) / totalPts) * cH;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "rgba(0,0,0,.18)";
  ctx.fillRect(0, 0, W, H);

  // Placeholder before sprint starts
  if (sp.status === "planning") {
    ctx.fillStyle = "rgba(255,255,255,.22)";
    ctx.font      = "12px Poppins,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Start sprint to see burndown", W / 2, H / 2);
    return;
  }

  // Grid
  ctx.strokeStyle = "rgba(255,255,255,.05)";
  ctx.lineWidth   = 1;
  const xStep = dur <= 7 ? 1 : Math.ceil(dur / 7);
  for (let d = 0; d <= dur; d += xStep) {
    ctx.beginPath(); ctx.moveTo(xOf(d), PAD.t); ctx.lineTo(xOf(d), PAD.t + cH); ctx.stroke();
  }
  for (let i = 0; i <= 4; i++) {
    const y = PAD.t + (i / 4) * cH;
    ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + cW, y); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = "rgba(255,255,255,.15)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, PAD.t + cH);
  ctx.lineTo(PAD.l + cW, PAD.t + cH);
  ctx.stroke();

  // X-axis labels
  ctx.fillStyle = "rgba(255,255,255,.4)";
  ctx.font      = "10px Poppins,sans-serif";
  ctx.textAlign = "center";
  for (let d = 0; d <= dur; d += xStep) ctx.fillText(`D${d}`, xOf(d), H - 8);

  // Y-axis labels
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const pts = Math.round((totalPts / 4) * (4 - i));
    ctx.fillText(pts, PAD.l - 5, yOf(pts) + 4);
  }

  // Ideal burndown (dashed violet)
  ctx.strokeStyle = "rgba(139,92,246,.65)";
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(totalPts));
  ctx.lineTo(xOf(dur), yOf(0));
  ctx.stroke();
  ctx.setLineDash([]);

  // Actual burndown (solid green)
  const bd = sp.burndown;
  if (bd && bd.length > 1) {
    // Fill under curve
    ctx.fillStyle = "rgba(34,197,94,.08)";
    ctx.beginPath();
    ctx.moveTo(xOf(bd[0].day), yOf(bd[0].remaining));
    bd.forEach(p => ctx.lineTo(xOf(p.day), yOf(p.remaining)));
    ctx.lineTo(xOf(bd[bd.length - 1].day), PAD.t + cH);
    ctx.lineTo(xOf(bd[0].day), PAD.t + cH);
    ctx.closePath();
    ctx.fill();

    // Line
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth   = 2;
    ctx.beginPath();
    bd.forEach((p, i) => i === 0
      ? ctx.moveTo(xOf(p.day), yOf(p.remaining))
      : ctx.lineTo(xOf(p.day), yOf(p.remaining)));
    ctx.stroke();

    // Dots
    ctx.fillStyle = "#22c55e";
    bd.forEach(p => {
      ctx.beginPath();
      ctx.arc(xOf(p.day), yOf(p.remaining), 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

/* ── Velocity history bars ───────────────────────────── */
function renderVelocity() {
  const el = $("spsVelocityCard");
  if (!el) return;
  const vh = S.velocityHistory;

  if (!vh.length) {
    el.innerHTML = `
      <div class="sps-vel-title"><i class="fas fa-tachometer-alt"></i> Velocity History</div>
      <div class="sps-vel-empty">Complete a sprint to see velocity.</div>
    `;
    return;
  }

  const last5      = vh.slice(-5);
  const maxActual  = Math.max(...last5.map(v => v.actual), 1);

  el.innerHTML = `
    <div class="sps-vel-title"><i class="fas fa-chart-column"></i> Velocity History</div>
    <div class="sps-vel-bars">
      ${last5.map(v => {
        const h = Math.max(16, Math.round((v.actual / maxActual) * 52));
        return `
          <div class="sps-vel-col">
            <div class="sps-vel-bar" style="height:${h}px">${v.actual}</div>
            <div class="sps-vel-lbl" title="${esc(v.name)}">${esc(v.name)}</div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/* ── Sprint review ───────────────────────────────────── */
function renderReview() {
  const el = $("spsReviewCard");
  if (!el) return;
  const sp = S.sprint;

  if (sp.status !== "completed") {
    el.innerHTML = `<div class="sps-review-empty">Sprint review appears here after completion.</div>`;
    return;
  }

  const planned    = sp.totalPts;
  const actual     = donePts();
  const incomplete = sp.board.todo.length + sp.board.inProgress.length;
  const doneCnt    = sp.board.done.length;
  const total      = doneCnt + incomplete;
  const pct        = planned > 0 ? Math.round((actual / planned) * 100) : 0;
  const hist       = S.velocityHistory;
  const avgVel     = hist.length
    ? Math.round(hist.reduce((s, v) => s + v.actual, 0) / hist.length)
    : actual;

  const rows = [
    ["Stories Completed", `${doneCnt} / ${total}`,         "#4ade80"],
    ["Points Delivered",  `${actual} / ${planned} pts`,    "#4ade80"],
    ["Completion Rate",   `${pct}%`,
      pct >= 80 ? "#4ade80" : pct >= 50 ? "#f59e0b" : "#ef4444"],
    ["Velocity (sprint)", `${actual} pts`,                 "#60a5fa"],
    ["Avg Team Velocity", `${avgVel} pts`,                 "#60a5fa"],
    ...(incomplete > 0
      ? [["Carried Over", `${incomplete} stor${incomplete !== 1 ? "ies" : "y"}`, "#f59e0b"]]
      : []),
  ];

  el.innerHTML = `
    <div class="sps-review-title">
      <i class="fas fa-flag-checkered"></i> ${esc(sp.name)} Review
    </div>
    ${rows.map(([lbl, val, clr]) => `
      <div class="sps-review-row">
        <span class="sps-review-lbl">${lbl}</span>
        <span class="sps-review-val" style="color:${clr}">${val}</span>
      </div>
    `).join("")}
    <button class="sps-btn sps-btn-green sps-review-new-btn" data-action="new-sprint">
      <i class="fas fa-rotate"></i> Start Sprint ${sp.number + 1}
    </button>
  `;
}

/* ============================================================
   DRAG AND DROP  —  bindDnD() called ONCE, uses delegation
============================================================ */
function bindDnD() {

  /* ── Backlog: drag source ── */
  const backlogList = $("spsBacklogList");
  if (backlogList) {
    backlogList.addEventListener("dragstart", e => {
      const card = e.target.closest(".sps-story-card:not(.in-sprint)");
      if (!card) return;
      DND.id   = Number(card.dataset.id);
      DND.from = "backlog";
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(DND.id));
    });
    backlogList.addEventListener("dragend", e => {
      e.target.closest(".sps-story-card")?.classList.remove("dragging");
      clearDragUI();
    });
  }

  /* ── Planning zone: drop target ── */
  const planZone = $("spsPlanningZone");
  if (planZone) {
    planZone.addEventListener("dragover", e => {
      if (DND.from !== "backlog" || S.sprint.status !== "planning") return;
      e.preventDefault();
      planZone.classList.add("drag-over");
    });
    planZone.addEventListener("dragleave", e => {
      if (!planZone.contains(e.relatedTarget)) planZone.classList.remove("drag-over");
    });
    planZone.addEventListener("drop", e => {
      e.preventDefault();
      planZone.classList.remove("drag-over");
      if (DND.from === "backlog" && DND.id) assignToSprint(DND.id);
      clearDragUI();
    });
  }

  /* ── Kanban: drag source + drop targets ── */
  const kanban = $("spsKanban");
  if (kanban) {
    kanban.addEventListener("dragstart", e => {
      const card = e.target.closest(".sps-kb-card");
      if (!card) return;
      DND.id   = Number(card.dataset.id);
      DND.from = card.dataset.source;
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(DND.id));
    });
    kanban.addEventListener("dragend", e => {
      e.target.closest(".sps-kb-card")?.classList.remove("dragging");
      clearDragUI();
    });
    kanban.addEventListener("dragover", e => {
      if (!DND.id || S.sprint.status !== "active") return;
      const body = e.target.closest(".sps-col-body");
      if (!body) return;
      e.preventDefault();
      document.querySelectorAll(".sps-col-body").forEach(b => b.classList.remove("drag-over"));
      body.classList.add("drag-over");
    });
    kanban.addEventListener("dragleave", e => {
      const body = e.target.closest(".sps-col-body");
      if (body && !body.contains(e.relatedTarget)) body.classList.remove("drag-over");
    });
    kanban.addEventListener("drop", e => {
      const body = e.target.closest(".sps-col-body");
      if (!body) return;
      e.preventDefault();
      body.classList.remove("drag-over");
      const toCol = body.dataset.col;
      if (DND.id && toCol && toCol !== DND.from) moveStory(DND.id, toCol);
      clearDragUI();
    });
  }
}

function clearDragUI() {
  document.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
  DND.id   = null;
  DND.from = null;
}

/* ============================================================
   CLICK DELEGATION  —  bindClicks() called ONCE
============================================================ */
function bindClicks() {

  /* ── Global data-action delegation ── */
  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const id     = Number(btn.dataset.id);
    const to     = btn.dataset.to;

    switch (action) {
      case "start-sprint"   : startSprint();        break;
      case "advance-day"    : advanceDay();          break;
      case "complete-sprint": completeSprint();      break;
      case "new-sprint"     : startNewSprint();      break;
      case "delete-story"   : deleteStory(id);       break;
      case "return-story"   : returnToBacklog(id);   break;
      case "move-story"     : moveStory(id, to);     break;
      case "reset-data"     : resetAllData();        break;
    }
  });

  /* ── Story points picker ── */
  const ptsPicker = $("spsPtsPicker");
  if (ptsPicker) {
    ptsPicker.addEventListener("click", e => {
      const btn = e.target.closest(".sps-pt-btn");
      if (!btn) return;
      ptsPicker.querySelectorAll(".sps-pt-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const hidden = $("spsStoryPoints");
      if (hidden) hidden.value = btn.dataset.pts;
    });
  }

  /* ── Priority picker ── */
  const priPicker = $("spsPriPicker");
  if (priPicker) {
    priPicker.addEventListener("click", e => {
      const btn = e.target.closest(".sps-pri-btn");
      if (!btn) return;
      priPicker.querySelectorAll(".sps-pri-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const hidden = $("spsStoryPriority");
      if (hidden) hidden.value = btn.dataset.pri;
    });
  }

  /* ── Add story toggle ── */
  $("spsAddToggleBtn")?.addEventListener("click", () => {
    const form = $("spsAddForm");
    if (!form) return;
    const opening = form.classList.contains("hidden");
    form.classList.toggle("hidden");
    if (opening) $("spsStoryTitle")?.focus();
  });

  /* ── Cancel add ── */
  $("spsCancelAddBtn")?.addEventListener("click", () => {
    $("spsAddForm")?.classList.add("hidden");
    const t = $("spsStoryTitle"); if (t) t.value = "";
  });

  /* ── Add story submit ── */
  $("spsAddStoryBtn")?.addEventListener("click", () => {
    const titleEl = $("spsStoryTitle");
    const title   = titleEl?.value.trim() || "";
    const points  = $("spsStoryPoints")?.value  || "";
    const priority= $("spsStoryPriority")?.value || "medium";
    const epic    = $("spsStoryEpic")?.value.trim() || "General";

    if (!title)  { titleEl?.focus();  return; }
    if (!points) {
      // Flash the points picker
      const picker = $("spsPtsPicker");
      if (picker) {
        picker.style.outline = "2px solid #ef4444";
        setTimeout(() => { picker.style.outline = ""; }, 1200);
      }
      return;
    }

    addStory(title, points, priority, epic);

    // Reset form
    if (titleEl) titleEl.value = "";
    const epicEl = $("spsStoryEpic"); if (epicEl) epicEl.value = "";
    $("spsAddForm")?.classList.add("hidden");
    resetPickersToDefault();
  });

  /* ── Enter key on title input ── */
  $("spsStoryTitle")?.addEventListener("keydown", e => {
    if (e.key === "Enter") $("spsAddStoryBtn")?.click();
  });

  /* ── Config inputs ── */
  $("spsSprintName")?.addEventListener("input", e => {
    if (S.sprint.status === "planning") S.sprint.name = e.target.value;
  });
  $("spsSprintDuration")?.addEventListener("change", e => {
    if (S.sprint.status === "planning") {
      S.sprint.duration = Number(e.target.value) || 14;
      renderConfigBar();
    }
  });
  $("spsCapacity")?.addEventListener("input", e => {
    if (S.sprint.status === "planning") {
      S.sprint.capacity = Number(e.target.value) || 30;
      renderBoard();
      renderStats();
    }
  });
}

/* ── Reset pickers to default values (pts=5, priority=medium) ── */
function resetPickersToDefault() {
  const ptsPicker = $("spsPtsPicker");
  if (ptsPicker) {
    ptsPicker.querySelectorAll(".sps-pt-btn").forEach(b =>
      b.classList.toggle("active", b.dataset.pts === "5")
    );
  }
  const ptsHidden = $("spsStoryPoints");
  if (ptsHidden) ptsHidden.value = "5";

  const priPicker = $("spsPriPicker");
  if (priPicker) {
    priPicker.querySelectorAll(".sps-pri-btn").forEach(b =>
      b.classList.toggle("active", b.dataset.pri === "medium")
    );
  }
  const priHidden = $("spsStoryPriority");
  if (priHidden) priHidden.value = "medium";
}

/* ============================================================
   INIT
============================================================ */
function initAgileSprintSimulator() {
  S = loadPersisted() || defaultState();
  bindDnD();
  bindClicks();
  render();

  // Redraw chart on window resize
  window.addEventListener("resize", drawBurndown);
}