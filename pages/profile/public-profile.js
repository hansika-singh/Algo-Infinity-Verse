// Fetch profile data
async function fetchProfile() {
    try {
        const response = await fetch('/api/user/profile');
        const data = await response.json();
        
        if (data.success) {
            renderProfile(data.data);
        } else {
            document.querySelector('.profile-container').innerHTML = `
                <div class="profile-card glass-card big-box" style="text-align:center; padding: 50px;">
                    <h2>User not found</h2>
                    <p>Please login to view your profile.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        document.querySelector('.profile-container').innerHTML = `
            <div class="profile-card glass-card big-box" style="text-align:center; padding: 50px;">
                <h2>Error loading profile</h2>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

function renderProfile(data) {
    const { user, stats, badges, languages, projects, recentActivity } = data;
    
    document.getElementById('profileAvatar').textContent = user.avatar || '🚀';
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileUsername').textContent = `@${user.username}`;
    document.getElementById('profileBio').textContent = user.bio || 'No bio yet';
    document.getElementById('joinedDate').textContent = new Date(user.joinedDate).toLocaleDateString();
    
    document.getElementById('statSolved').textContent = stats.totalSolved;
    document.getElementById('statXP').textContent = stats.xp.toLocaleString();
    document.getElementById('statStreak').textContent = stats.streak;
    document.getElementById('statLevel').textContent = stats.level;
    
    // Badges
    document.getElementById('badgesGrid').innerHTML = badges.map(badge => `
        <span class="badge-item">${badge}</span>
    `).join('');
    
    // Languages
    document.getElementById('languagesList').innerHTML = languages.map(lang => `
        <div class="language-item">
            <span>${lang.name}</span>
            <div class="language-bar">
                <div style="width: ${lang.percentage}%;"></div>
            </div>
            <span>${lang.percentage}%</span>
        </div>
    `).join('');
    
    // Projects
    document.getElementById('projectsGrid').innerHTML = projects.map(project => `
        <a href="${project.link}" class="project-card" target="_blank">
            <h4>${project.name}</h4>
            <p>${project.description}</p>
        </a>
    `).join('');
    
    // Activity
    document.getElementById('activityList').innerHTML = recentActivity.map(activity => `
        <div class="activity-item">
            <span>${activity.action}</span>
            <span class="activity-date">${new Date(activity.date).toLocaleDateString()}</span>
        </div>
    `).join('');
}

function shareProfile() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        void 0;
    });
}

// Load profile
document.addEventListener("DOMContentLoaded", () => {
    const shareBtn = document.getElementById("shareProfileBtn");

    if (shareBtn) {
        shareBtn.addEventListener("click", shareProfile);
    }

    fetchProfile();
});