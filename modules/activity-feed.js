function getRecentActivity() {
    const activities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
    return activities.slice(0, 10);
}

function addActivity(type, text) {
    const activities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
    activities.unshift({
        type: type,
        text: text,
        date: new Date().toISOString()
    });
    if (activities.length > 50) {
        activities.length = 50;
    }
    localStorage.setItem('recentActivities', JSON.stringify(activities));
    renderActivityFeed();
}

function renderActivityFeed() {
    const container = document.getElementById('activityFeed') || document.getElementById('recentActivityFeed');
    if (!container) return;

    const activities = getRecentActivity();
    const activityCount = document.getElementById('activityCount');
    if (activityCount) activityCount.textContent = `${activities.length} ${activities.length === 1 ? 'activity' : 'activities'}`;

    if (activities.length === 0) {
        container.innerHTML = `
            <div class="activity-empty">
                <i class="fas fa-inbox"></i>
                <p>No recent activity yet. Start solving problems!</p>
            </div>
        `;
        return;
    }

    const icons = {
        solved: '✅',
        quiz: '📝',
        badge: '🏆'
    };

    container.innerHTML = activities.map(activity => `
        <div class="activity-feed-item">
            <span class="activity-feed-icon">${icons[activity.type] || '📌'}</span>
            <span class="activity-feed-text">${escapeHtml(activity.text)}</span>
            <span class="activity-feed-time">${timeAgo(activity.date)}</span>
        </div>
    `).join('');
}

function timeAgo(date) {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
}

function trackProblemSolved(problemName) {
    addActivity('solved', `Solved ${problemName}`);
}

function trackQuizCompleted(topic) {
    addActivity('quiz', `Completed ${topic} quiz`);
}

function trackBadgeEarned(badgeName) {
    addActivity('badge', `Earned ${badgeName} badge`);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

window.trackProblemSolved = trackProblemSolved;
window.trackQuizCompleted = trackQuizCompleted;
window.trackBadgeEarned = trackBadgeEarned;

export function initActivityFeed() {
    renderActivityFeed();
}
// Legacy global exports
window.initActivityFeed = initActivityFeed;
