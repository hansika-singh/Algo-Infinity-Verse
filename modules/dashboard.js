let leaderboardRequestId = 0;
const LEADERBOARD_LIMIT = 10;
let currentLeaderboardPage = 1;
let totalLeaderboardPages = 1;
let totalLeaderboardUsers = 0;

function initDashboard() {
    updateDashboard();
    if (typeof updateProfile === 'function') updateProfile();
}

function updateDashboard() {
    const userProgress = window.userProgress || {};
    const completedProblems = Array.isArray(userProgress.completedProblems) ? userProgress.completedProblems : [];
    
    const completedProblemsEl = document.getElementById("completedProblems");
    if (completedProblemsEl) completedProblemsEl.textContent = completedProblems.length;
    
    const currentStreakEl = document.getElementById("currentStreak");
    if (currentStreakEl) currentStreakEl.textContent = userProgress.streak || 0;
    
    const currentFreezes = document.getElementById("currentFreezes");
    if (currentFreezes) currentFreezes.textContent = userProgress.freezes || 0;
    
    const totalXPEl = document.getElementById("totalXP");
    if (totalXPEl) totalXPEl.textContent = userProgress.xp || 0;
    
    updateCurrentDate();
    updateActivityList();
    if (typeof renderActivityHeatmap === 'function') renderActivityHeatmap();
    if (typeof updateFreezeHistoryList === 'function') updateFreezeHistoryList();
    updateBadges();
    updateRecentProblems();
    updateRecommendations();
    updateLeaderboard();
    
    const grid = document.querySelector(".dashboard-grid");
    if (grid && !document.getElementById("personalityCard")) {
        const pCard = document.createElement("div");
        pCard.className = "dashboard-card personality-card";
        pCard.id = "personalityCard";
        const profileCard = grid.querySelector(".profile-card");
        if (profileCard) profileCard.after(pCard);
        else grid.prepend(pCard);
    }
    if (typeof renderPersonalityCard === 'function') renderPersonalityCard();
    
    if (grid && !document.getElementById("mistakeDnaCard")) {
        const mCard = document.createElement("div");
        mCard.className = "dashboard-card mistake-dna-card";
        mCard.id = "mistakeDnaCard";
        const personalityCard = document.getElementById("personalityCard");
        if (personalityCard) personalityCard.after(mCard);
        else {
            const profileCard = grid.querySelector(".profile-card");
            if (profileCard) profileCard.after(mCard);
            else grid.prepend(mCard);
        }
    }
    if (typeof renderMistakeDnaCard === 'function') renderMistakeDnaCard();
}

function updateCurrentDate() {
    const dateEl = document.getElementById("dashboard-current-date");
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    }
}

function updateActivityList() {
    const userProgress = window.userProgress || {};
    const practiceProblems = window.practiceProblems || [];
    const activityList = document.getElementById("activityList");
    if (!activityList) return;
    
    const completedProblems = Array.isArray(userProgress.completedProblems) ? userProgress.completedProblems : [];
    if (completedProblems.length === 0) {
        activityList.innerHTML = '<p class="empty-state">No recent activity. Start solving problems!</p>';
        return;
    }
    
    const activities = completedProblems.slice(-5).map(pid => {
        const problem = findProblemById(practiceProblems, pid);
        return {
            problem: problem ? problem.title : "Unknown",
            time: "Today"
        };
    });
    
    activityList.innerHTML = activities.map(activity =>
        `<div class="activity-item">
            <div class="activity-type">
                <span class="activity-icon"><i class="fas fa-code"></i></span>
                <span>Solved: ${escapeHtml(activity.problem)}</span>
            </div>
            <span class="activity-time">${activity.time}</span>
        </div>`
    ).join("");
}

function updateRecentProblems() {
    const userProgress = window.userProgress || {};
    const practiceProblems = window.practiceProblems || [];
    const container = document.getElementById("recentProblemsList");
    if (!container) return;
    
    const recentProblems = Array.isArray(userProgress.recentProblems) ? userProgress.recentProblems : [];
    if (recentProblems.length === 0) {
        container.innerHTML = '<p class="empty-state">No recently viewed problems</p>';
        return;
    }
    
    const recentItems = recentProblems.map(id => findProblemById(practiceProblems, id)).filter(Boolean);
    if (recentItems.length === 0) {
        container.innerHTML = '<p class="empty-state">No recently viewed problems</p>';
        return;
    }
    
    container.innerHTML = recentItems.map(problem =>
        `<button class="recent-problem" type="button" data-id="${problem.id}">
            ${escapeHtml(problem.title)}
        </button>`
    ).join("");
    
    container.querySelectorAll(".recent-problem").forEach(item => {
        item.addEventListener("click", () => {
            const problem = findProblemById(practiceProblems, item.dataset.id);
            if (problem && typeof openQuizEditor === 'function') openQuizEditor(problem);
        });
    });
}

function updateRecommendations() {
    const container = document.getElementById("recommendationsContainer");
    if (!container) return;

    const userProgress = window.userProgress || {};
    const practiceProblems = window.practiceProblems || [];
    const completed = new Set((Array.isArray(userProgress.completedProblems) ? userProgress.completedProblems : []).map(String));
    const recent = new Set((Array.isArray(userProgress.recentProblems) ? userProgress.recentProblems : []).map(String));
    const personalityType = userProgress.codingPersonality?.type || "brute-force first";
    
    const difficultyByPersonality = {
        "brute-force first": "easy",
        "slow but accurate": "medium",
        "greedy thinker": "medium",
        "over-optimizer": "hard"
    };
    const preferredDifficulty = difficultyByPersonality[personalityType] || "easy";
    
    const recommendations = practiceProblems
        .filter(problem => !completed.has(String(problem.id)))
        .sort((a, b) => {
            const aRecent = recent.has(String(a.id)) ? 1 : 0;
            const bRecent = recent.has(String(b.id)) ? 1 : 0;
            const aDifficulty = a.difficulty === preferredDifficulty ? 0 : 1;
            const bDifficulty = b.difficulty === preferredDifficulty ? 0 : 1;
            return aRecent - bRecent || aDifficulty - bDifficulty || a.id - b.id;
        })
        .slice(0, 4);

    if (recommendations.length === 0) {
        container.innerHTML = '<p class="empty-state">No recommendations available yet.</p>';
        return;
    }

    container.innerHTML = recommendations.map(problem => (
        `<button class="recommendation-item" type="button" data-id="${problem.id}">
            <span>${escapeHtml(problem.title)}</span>
            <small>${escapeHtml(problem.difficulty)} &middot; ${escapeHtml(problem.category || "practice")}</small>
        </button>`
    )).join("");

    container.querySelectorAll(".recommendation-item").forEach(item => {
        item.addEventListener("click", () => {
            const problem = findProblemById(practiceProblems, item.dataset.id);
            if (problem && typeof openQuizEditor === 'function') openQuizEditor(problem);
        });
    });
}

function updateFreezeHistoryList() {
    const userProgress = window.userProgress || {};
    const freezeHistoryList = document.getElementById("freezeHistoryList");
    if (!freezeHistoryList) return;
    
    const history = userProgress.freezeHistory || [];
    if (history.length === 0) {
        freezeHistoryList.innerHTML = '<p class="empty-state">No freezes used yet.</p>';
        return;
    }
    
    freezeHistoryList.innerHTML = history.slice(-5).reverse().map(h =>
        `<div class="activity-item">
            <div class="activity-type">
                <span class="activity-icon"><i class="fas fa-snowflake" style="color:#00d2ff;"></i></span>
                <span>${h.reason}</span>
            </div>
            <span class="activity-time">${new Date(h.date).toLocaleDateString()}</span>
        </div>`
    ).join("");
}

function updateBadges() {
    const userProgress = window.userProgress || {};
    const container = document.getElementById("badgesContainer");
    const grid = document.getElementById("badgesGrid");
    const completedProblems = Array.isArray(userProgress.completedProblems) ? userProgress.completedProblems : [];
    
    const badges = [
        {
            id: 1,
            icon: "🌟",
            name: "First Steps",
            description: "Begin your journey",
            criteria: "Solve 1 problem",
            earned: completedProblems.length >= 1
        },
        {
            id: 2,
            icon: "🔥",
            name: "On Fire",
            description: "Keep the momentum going",
            criteria: "Maintain a 7-day streak",
            earned: (userProgress.streak || 0) >= 7
        },
        {
            id: 3,
            icon: "💎",
            name: "Diamond",
            description: "Reach a major XP milestone",
            criteria: "Earn 5,000 XP",
            earned: (userProgress.xp || 0) >= 5000
        },
        {
            id: 4,
            icon: "🚀",
            name: "Rocket",
            description: "Speed through problems",
            criteria: "Solve 50 problems",
            earned: completedProblems.length >= 50
        },
        {
            id: 5,
            icon: "👑",
            name: "Master",
            description: "Achieve expert problem-solving",
            criteria: "Solve 100 problems",
            earned: completedProblems.length >= 100
        },
        {
            id: 6,
            icon: "🎯",
            name: "Sharpshooter",
            description: "Hit the target with consistency",
            criteria: "Solve 25 problems and earn 2,500 XP",
            earned: completedProblems.length >= 25 && (userProgress.xp || 0) >= 2500
        }
    ];
    
    const earned = badges.filter(b => b.earned).map(b => b.id);
    if (JSON.stringify(earned) !== JSON.stringify(userProgress.badges)) {
        userProgress.badges = earned;
        if (typeof saveUserData === 'function') saveUserData();
    }
    
    if (container) {
        container.innerHTML = badges.map(badge =>
            `<div class="badge ${badge.earned ? '' : 'locked'}" tabindex="0">
                <span class="badge-tooltip">
                    <strong>${badge.name}</strong>
                    <span>${badge.description}</span>
                    <span>${badge.criteria}</span>
                </span>
                ${badge.icon}
            </div>`
        ).join("");
    }
    
    if (grid) {
        grid.innerHTML = badges.map(badge =>
            `<div class="badge-lg ${badge.earned ? '' : 'locked'}" tabindex="0">
                <span class="badge-tooltip">
                    <strong>${badge.name}</strong>
                    <span>${badge.description}</span>
                    <span>${badge.criteria}</span>
                </span>
                ${badge.icon}
            </div>`
        ).join("");
    }
}

function updateLeaderboard(page = 1) {
    const leaderboardList = document.getElementById("leaderboardList");
    if (!leaderboardList) return;
    
    const requestId = ++leaderboardRequestId;
    currentLeaderboardPage = page;
    
    renderLeaderboardRows([], getCurrentUserId(), { emptyMessage: "Loading leaderboard..." });
    renderPaginationControls(true);
    
    loadLeaderboard(page).then(({ leaders, currentUserId, total }) => {
        if (requestId !== leaderboardRequestId) return;
        
        const resolvedCurrentUserId = currentUserId || getCurrentUserId();
        totalLeaderboardUsers = total || leaders.length;
        totalLeaderboardPages = Math.ceil(totalLeaderboardUsers / LEADERBOARD_LIMIT);
        
        renderLeaderboardRows(
            buildLeaderboardRows(leaders, resolvedCurrentUserId),
            resolvedCurrentUserId
        );
        renderPaginationControls(false);
    }).catch(error => {
        if (error.name === 'AbortError') return;
        console.warn("Could not load leaderboard:", error);
        if (requestId !== leaderboardRequestId) return;
        renderLeaderboardRows([], getCurrentUserId(), { emptyMessage: "Leaderboard unavailable." });
        renderPaginationControls(true, true);
    });
}

async function loadLeaderboard(page = 1) {
    const apiAbort = window.apiAbort;
    const apiCache = window.apiCache;
    
    if (location.protocol === "file:") {
        return { leaders: [], currentUserId: null, total: 0 };
    }
    if (!apiAbort || !apiCache) {
        return { leaders: [], currentUserId: null, total: 0 };
    }
    
    const limit = LEADERBOARD_LIMIT;
    const skip = (page - 1) * limit;
    const signal = apiAbort.getSignal('leaderboard');
    
    try {
        const response = await apiCache.fetchWithCache(
            `/api/leaderboard?limit=${limit}&skip=${skip}`,
            { credentials: "include", signal },
            300000,
            'json'
        );
        return {
            leaders: response.users || response.leaders || [],
            currentUserId: response.currentUserId || null,
            total: response.total || 0
        };
    } finally {
        apiAbort.clearSignal('leaderboard');
    }
}

function buildLeaderboardRows(leaders = [], currentUserId = getCurrentUserId()) {
    const userProgress = window.userProgress || {};
    const rowsById = new Map();
    
    leaders.forEach(leader => {
        const normalized = normalizeLeaderboardEntry(leader);
        if (normalized.id) rowsById.set(normalized.id, normalized);
    });
    
    const currentEntry = getCurrentLeaderboardEntry(currentUserId);
    if (currentUserId !== "local-user" || userProgress.xp > 350 || leaders.length === 0) {
        rowsById.set(currentEntry.id, currentEntry);
    }
    
    const rankedRows = Array.from(rowsById.values())
        .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name))
        .map((leader, index) => ({ ...leader, rank: index + 1 }));
    
    const visibleRows = rankedRows.slice(0, LEADERBOARD_LIMIT);
    
    if (!visibleRows.some(leader => leader.id === currentEntry.id)) {
        const currentRow = rankedRows.find(leader => leader.id === currentEntry.id);
        if (currentRow) visibleRows[visibleRows.length - 1] = currentRow;
    }
    
    return visibleRows;
}

function normalizeLeaderboardEntry(entry) {
    return {
        id: String(entry.id || ""),
        name: String(entry.name || "Learner"),
        xp: Math.max(0, Number(entry.xp) || 0),
        level: Math.max(1, Number(entry.level) || 1),
        avatar: String(entry.avatar || "🚀"),
        rank: Number(entry.rank) || null
    };
}

function getCurrentLeaderboardEntry(currentUserId = getCurrentUserId()) {
    const userProgress = window.userProgress || {};
    return normalizeLeaderboardEntry({
        id: currentUserId || "local-user",
        name: getCurrentDisplayName(),
        xp: userProgress.xp,
        level: userProgress.level,
        avatar: userProgress.avatar
    });
}

function getCurrentUserId() {
    return window.algoAuth?.user?.sub ||
        window.algoAuth?.user?.id ||
        (typeof cachedSession !== 'undefined' ? cachedSession?.user?.sub : null) ||
        "local-user";
}

function getCurrentDisplayName() {
    return window.algoAuth?.user?.name ||
        (typeof cachedSession !== 'undefined' ? cachedSession?.user?.name : null) ||
        (window.userProgress ? window.userProgress.name : null) ||
        "Learner";
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function findProblemById(problems, id) {
    const targetId = String(id);
    return problems.find(problem => String(problem.id) === targetId);
}

function getAvatarImageUrl(avatar) {
    if (!avatar || typeof avatar !== "string") return "";
    if (avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("data:image/")) {
        return avatar;
    }
    if (avatar.startsWith("//")) return `https:${avatar}`;
    if (/^[\w.-]+\.[a-z]{2,}\//i.test(avatar)) return `https://${avatar}`;
    return "";
}

function renderLeaderboardRows(rows, currentUserId = getCurrentUserId(), options = {}) {
    const leaderboardList = document.getElementById("leaderboardList");
    if (!leaderboardList) return;
    
    if (!rows.length) {
        leaderboardList.innerHTML = `<p class="empty-state">${options.emptyMessage || "No leaderboard data yet."}</p>`;
        return;
    }
    
    leaderboardList.innerHTML = rows.map(user => {
        const isCurrentUser = user.id === currentUserId || (currentUserId === "local-user" && user.id === "local-user");
        const displayName = isCurrentUser ? `${user.name} (You)` : user.name;
        let avatarHtml = escapeHtml(user.avatar);
        const avatarUrl = getAvatarImageUrl(user.avatar);
        if (avatarUrl) {
            avatarHtml = `<img src="${escapeHtml(avatarUrl)}" alt="" loading="lazy">`;
        }
        return `<div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
            <span class="leader-rank">#${user.rank}</span>
            <span class="leader-avatar" aria-hidden="true">${avatarHtml}</span>
            <span class="leader-name">${escapeHtml(displayName)}</span>
            <span class="leader-xp">${user.xp.toLocaleString()} XP</span>
        </div>`;
    }).join("");
}

function renderPaginationControls(isLoading = false, hasError = false) {
    const paginationContainer = document.getElementById("paginationContainer");
    if (!paginationContainer) {
        createPaginationContainer();
    }
    
    const container = document.getElementById("paginationContainer");
    if (!container) return;
    
    if (totalLeaderboardPages <= 1 && !isLoading) {
        container.innerHTML = '';
        return;
    }
    
    if (isLoading) {
        container.innerHTML = `
            <div class="pagination-controls">
                <span class="pagination-info">Loading leaderboard...</span>
            </div>
        `;
        return;
    }
    
    if (hasError) {
        container.innerHTML = `
            <div class="pagination-controls">
                <span class="pagination-info error">Failed to load leaderboard</span>
            </div>
        `;
        return;
    }
    
    const currentPage = currentLeaderboardPage;
    const totalPages = totalLeaderboardPages;
    
    let html = '<div class="pagination-controls">';
    
    html += `
        <button class="pagination-btn" onclick="goToLeaderboardPage(${currentPage - 1})" 
            ${currentPage <= 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i> Previous
        </button>
    `;
    
    html += `<span class="pagination-info">Page ${currentPage} of ${totalPages}</span>`;
    
    html += `
        <button class="pagination-btn" onclick="goToLeaderboardPage(${currentPage + 1})" 
            ${currentPage >= totalPages ? 'disabled' : ''}>
            Next <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    html += '</div>';
    container.innerHTML = html;
}

function goToLeaderboardPage(page) {
    if (page < 1 || page > totalLeaderboardPages) return;
    if (page === currentLeaderboardPage) return;
    updateLeaderboard(page);
}

function createPaginationContainer() {
    const leaderboardList = document.getElementById("leaderboardList");
    if (!leaderboardList) return;
    
    const existingContainer = document.getElementById("paginationContainer");
    if (existingContainer) return;
    
    const container = document.createElement("div");
    container.id = "paginationContainer";
    container.className = "pagination-container";
    leaderboardList.parentNode.insertBefore(container, leaderboardList.nextSibling);
}

window.updateLeaderboard = updateLeaderboard;
window.goToLeaderboardPage = goToLeaderboardPage;

function getActivityLevel(count) {
    if (!count || count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count <= 4) return 3;
    return 4;
}

function renderActivityHeatmap() {
    const container = document.getElementById("activityHeatmap");
    if (!container) return;
    
    const userProgress = window.userProgress || {};
    const activityData = userProgress.activityData || {};
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const WEEKS_TO_SHOW = 52;
    const dayOfWeek = today.getDay();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (WEEKS_TO_SHOW * 7 - 1) - dayOfWeek);
    startDate.setHours(0, 0, 0, 0);
    
    const weeks = [];
    const monthLabels = [];
    let currentWeek = [];
    let prevMonth = -1;
    const d = new Date(startDate);
    
    for (let i = 0; i < WEEKS_TO_SHOW * 7; i++) {
        const dow = d.getDay();
        if (dow === 0 && currentWeek.length > 0) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);
    
    weeks.forEach((week, wi) => {
        const thuIdx = Math.min(4, week.length - 1);
        const thuDate = week[thuIdx];
        const month = thuDate.getMonth();
        if (month !== prevMonth) {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            monthLabels.push({ weekIndex: wi, label: monthNames[month] });
            prevMonth = month;
        }
    });
    
    const weekdayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];
    let html = "";
    html += '<div class="heatmap-months-row">';
    monthLabels.forEach(ml => {
        html += `<span class="heatmap-month-label" style="grid-column:${ml.weekIndex + 2}">${ml.label}</span>`;
    });
    html += "</div>";
    html += '<div class="heatmap-grid"><div class="heatmap-weekday-labels">';
    weekdayLabels.forEach(label => {
        html += `<span class="heatmap-weekday-label">${label}</span>`;
    });
    html += "</div>";
    
    const formatDateKey = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };
    
    const parseDateKey = (key) => {
        const [y, m, d] = key.split("-").map(Number);
        return new Date(y, m - 1, d);
    };
    
    weeks.forEach(week => {
        html += '<div class="heatmap-week">';
        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
            if (dayIdx < week.length) {
                const date = week[dayIdx];
                const dateKey = formatDateKey(date);
                const count = activityData[dateKey] || 0;
                const level = getActivityLevel(count);
                const isFuture = date > today;
                html += `<div class="heatmap-day" data-level="${isFuture ? -1 : level}" data-date="${dateKey}" data-count="${count}" data-future="${isFuture}" title="${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}: ${count} ${count === 1 ? 'problem' : 'problems'} solved"></div>`;
            } else {
                html += '<div class="heatmap-day" data-future="true"></div>';
            }
        }
        html += "</div>";
    });
    html += "</div>";
    container.innerHTML = html;
    attachHeatmapTooltips(parseDateKey);
}

function attachHeatmapTooltips(parseDateKey) {
    const tooltip = document.getElementById("heatmapTooltip");
    if (!tooltip) return;
    if (tooltip.parentElement !== document.body) document.body.appendChild(tooltip);
    
    const days = document.querySelectorAll(".heatmap-day:not([data-future='true'])");
    days.forEach(day => {
        day.addEventListener("mouseenter", (e) => {
            const date = day.dataset.date;
            const count = parseInt(day.dataset.count) || 0;
            const parsed = parseDateKey(date);
            const dateStr = parsed.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
            tooltip.innerHTML = `<strong>${dateStr}</strong>${count} ${count === 1 ? 'problem' : 'problems'} solved`;
            tooltip.classList.add("visible");
            positionHeatmapTooltip(e);
        });
        day.addEventListener("mousemove", positionHeatmapTooltip);
        day.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
    });
}

function positionHeatmapTooltip(e) {
    const tooltip = document.getElementById("heatmapTooltip");
    if (!tooltip) return;
    const rect = tooltip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = e.clientX + 14;
    let top = e.clientY - rect.height - 12;
    if (left + rect.width + 8 > vw) left = e.clientX - rect.width - 14;
    if (top < 8) top = e.clientY + 12;
    if (left < 8) left = 8;
    if (left + rect.width + 8 > vw) left = vw - rect.width - 8;
    if (top + rect.height + 8 > vh) top = vh - rect.height - 8;
    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
}

window.renderActivityHeatmap = renderActivityHeatmap;

export {
    initDashboard,
    updateDashboard,
    updateLeaderboard,
    updateBadges,
    updateFreezeHistoryList,
    renderActivityHeatmap,
    goToLeaderboardPage
};