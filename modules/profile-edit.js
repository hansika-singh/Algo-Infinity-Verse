const PROFILE_AVATARS = ["🚀", "💻", "🧠", "🔥", "🦄", "⚡", "🤖", "🎨"];
let selectedProfileAvatar = "";

window.openProfileModal = function() {
    const modal = document.getElementById("profileEditModal");
    const nameInput = document.getElementById("profileNameInput");
    const userProgress = window.userProgress || {};
    
    if (nameInput) nameInput.value = userProgress.name || "Learner";
    selectedProfileAvatar = userProgress.avatar || "🚀";
    
    renderAvatarOptions();
    
    const userLangs = userProgress.languages || [];
    const checkboxes = document.querySelectorAll(".lang-edit-checkbox");
    checkboxes.forEach(cb => {
        cb.checked = userLangs.includes(cb.value);
    });
    
    if (modal) modal.classList.add("active");
};

window.closeProfileModal = function() {
    const modal = document.getElementById("profileEditModal");
    if (modal) modal.classList.remove("active");
};

window.selectProfileAvatar = function(av) {
    selectedProfileAvatar = av;
    renderAvatarOptions();
};

function renderAvatarOptions() {
    const avatarOpts = document.getElementById("avatarOptions");
    if (!avatarOpts) return;
    avatarOpts.innerHTML = PROFILE_AVATARS.map(av => `
        <span class="avatar-option ${selectedProfileAvatar === av ? 'selected' : ''}" 
              onclick="selectProfileAvatar('${av}')" 
              style="cursor: pointer; font-size: 2rem; padding: 0.25rem 0.5rem; border-radius: 8px; border: 2px solid ${selectedProfileAvatar === av ? 'var(--primary)' : 'transparent'}; transition: all 0.2s; display: inline-block;">
            ${av}
        </span>
    `).join("");
}

window.saveProfileChanges = function() {
    const userProgress = window.userProgress || {};
    const nameInput = document.getElementById("profileNameInput");
    const nameVal = nameInput ? nameInput.value.trim() : "";
    
    if (!nameVal) {
        console.warn("Alert:", "Please enter a valid display name.");
        return;
    }
    
    const userLangs = [];
    const checkboxes = document.querySelectorAll(".lang-edit-checkbox");
    checkboxes.forEach(cb => {
        if (cb.checked) userLangs.push(cb.value);
    });
    
    userProgress.name = nameVal;
    userProgress.avatar = selectedProfileAvatar;
    userProgress.languages = userLangs;
    
    if (typeof saveUserData === 'function') {
        saveUserData();
    } else {
        localStorage.setItem("algoInfinityVerse", JSON.stringify(userProgress));
    }
    
    updateProfileViews();
    window.closeProfileModal();
    
    if (typeof showNotification === 'function') {
        showNotification("Profile updated successfully!", "success");
    }
};

window.renderLanguageChips = function() {
    const userProgress = window.userProgress || {};
    if (typeof userProgress === 'undefined') return;
    const userLangs = userProgress.languages || [];
    const containers = [
        document.getElementById("profileLanguagesSection"),
        document.getElementById("profileLanguages")
    ];
    
    const colors = {
        "C++": "#f34b7d",
        "Java": "#b07219",
        "Python": "#3572A5",
        "JavaScript": "#f1e05a",
        "Rust": "#dea584"
    };

    const textColors = {
        "JavaScript": "#000000"
    };
    
    containers.forEach(container => {
        if (!container) return;
        if (userLangs.length === 0) {
            container.innerHTML = `<span style="color: var(--text-secondary); font-size: 0.9rem; font-style: italic;">No languages added yet. Click edit to add!</span>`;
            return;
        }
        
        container.innerHTML = userLangs.map(lang => {
            const bg = colors[lang] || "var(--primary)";
            const color = textColors[lang] || "#ffffff";
            return `
                <span class="lang-chip" style="
                    display: inline-flex;
                    align-items: center;
                    background: ${bg};
                    color: ${color};
                    font-size: 0.8rem;
                    font-weight: 600;
                    padding: 0.3rem 0.8rem;
                    border-radius: 20px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">${lang}</span>
            `;
        }).join("");
    });
};

function updateProfileViews() {
    const userProgress = window.userProgress || {};
    const profileName = document.getElementById("profileName");
    if (profileName) profileName.textContent = userProgress.name;
    const profileSectionName = document.getElementById("profileSectionName");
    if (profileSectionName) profileSectionName.textContent = userProgress.name;
    
    const userNameEl = document.getElementById("userName");
    if (userNameEl) userNameEl.textContent = userProgress.name;
    const cardUserName = document.getElementById("cardUserName");
    if (cardUserName) cardUserName.textContent = userProgress.name;
    
    document.querySelectorAll(".avatar-icon").forEach(el => el.textContent = userProgress.avatar || "🚀");
    const cardAvatar = document.getElementById("cardAvatar");
    if (cardAvatar) cardAvatar.textContent = userProgress.avatar || "🚀";
    
    if (typeof initIdentityCard === 'function') {
        initIdentityCard();
    }
    
    window.renderLanguageChips();
}

function setupProfileListeners() {
    const mainEditBtn = document.getElementById("profileSectionEditBtn");
    if (mainEditBtn) mainEditBtn.onclick = window.openProfileModal;
    const dashEditBtn = document.getElementById("profileEditBtn");
    if (dashEditBtn) dashEditBtn.onclick = window.openProfileModal;
    const pageEditBtn = document.getElementById("profilePageEditBtn");
    if (pageEditBtn) pageEditBtn.onclick = window.openProfileModal;
    
    const closeCrossBtn = document.getElementById("profileModalClose");
    if (closeCrossBtn) closeCrossBtn.onclick = window.closeProfileModal;
    
    window.renderLanguageChips();
}

export function initProfileEdit() {
    setupProfileListeners();
}
// Legacy global exports
window.initProfileEdit = initProfileEdit;
