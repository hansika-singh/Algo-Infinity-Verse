function loadProgress() {
  try {
    const saved = localStorage.getItem('algoInfinityVerse');
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function saveProgress(data) {
  localStorage.setItem('algoInfinityVerse', JSON.stringify(data));
}

function closeProfileModal() {
  const modal = document.getElementById('profileEditModal');
  if (modal) modal.classList.remove('active');
}

function saveProfileChanges() {
  const nameInput = document.getElementById('profileNameInput');
  const nameVal = nameInput ? nameInput.value.trim() : '';
  if (!nameVal) {
    if (typeof showNotification === 'function') showNotification('Please enter a display name.', 'error');
    return;
  }
  const userLangs = [];
  document.querySelectorAll('.lang-edit-checkbox').forEach(cb => {
    if (cb.checked) userLangs.push(cb.value);
  });
  const progress = loadProgress();
  progress.name = nameVal;
  progress.languages = userLangs;
  saveProgress(progress);
  if (typeof window.saveUserData === 'function') window.saveUserData();
  if (typeof window.userProgress !== 'undefined') {
    window.userProgress.name = nameVal;
    window.userProgress.languages = userLangs;
  }
  updateProfileViews();
  closeProfileModal();
  if (typeof showNotification === 'function') showNotification('Profile updated successfully!', 'success');
}

function updateProfileViews() {
  const progress = loadProgress();
  const profileName = document.getElementById('profileName');
  if (profileName) profileName.textContent = progress.name;
  const profileSectionName = document.getElementById('profileSectionName');
  if (profileSectionName) profileSectionName.textContent = progress.name;
  const userNameEl = document.getElementById('userName');
  if (userNameEl) userNameEl.textContent = progress.name;
  const cardUserName = document.getElementById('cardUserName');
  if (cardUserName) cardUserName.textContent = progress.name;
  renderLanguageChips();
}

function renderLanguageChips() {
  const progress = loadProgress();
  const userLangs = progress.languages || [];
  const containers = [
    document.getElementById('profileLanguagesSection'),
    document.getElementById('profileLanguages')
  ];
  const colors = { 'C++': '#f34b7d', 'Java': '#b07219', 'Python': '#3572A5', 'JavaScript': '#f1e05a', 'Rust': '#dea584', 'TypeScript': '#3178c6', 'Go': '#00add8', 'Kotlin': '#7f52ff', 'Swift': '#f05138', 'C#': '#178600', 'Ruby': '#701516', 'PHP': '#777bb4', 'SQL': '#e38c00' };
  const textColors = { 'JavaScript': '#000000' };
  containers.forEach(container => {
    if (!container) return;
    if (userLangs.length === 0) {
      container.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.9rem; font-style: italic;">No languages added yet.</span>';
      return;
    }
    container.innerHTML = userLangs.map(lang => {
      const bg = colors[lang] || 'var(--primary)';
      const color = textColors[lang] || '#ffffff';
      return `<span class="lang-chip" style="display:inline-flex;align-items:center;background:${bg};color:${color};font-size:0.8rem;font-weight:600;padding:0.3rem 0.8rem;border-radius:20px;box-shadow:0 2px 5px rgba(0,0,0,0.2);text-transform:uppercase;letter-spacing:0.5px;">${lang}</span>`;
    }).join('');
  });
}

function setupProfileListeners() {
  const mainEditBtn = document.getElementById('profileSectionEditBtn');
  if (mainEditBtn) mainEditBtn.onclick = openProfileModal;
  const dashEditBtn = document.getElementById('profileEditBtn');
  if (dashEditBtn) dashEditBtn.onclick = openProfileModal;
  const pageEditBtn = document.getElementById('profilePageEditBtn');
  if (pageEditBtn) pageEditBtn.onclick = openProfileModal;
  const closeCrossBtn = document.getElementById('profileModalClose');
  if (closeCrossBtn) closeCrossBtn.onclick = closeProfileModal;
  renderLanguageChips();
}

function openProfileModal() {
  const modal = document.getElementById('profileEditModal');
  const nameInput = document.getElementById('profileNameInput');
  const progress = loadProgress();
  if (nameInput) nameInput.value = progress.name || 'Learner';
  const userLangs = progress.languages || [];
  document.querySelectorAll('.lang-edit-checkbox').forEach(cb => {
    cb.checked = userLangs.includes(cb.value);
  });
  if (modal) modal.classList.add('active');
}

export function initProfileEdit() {
  setupProfileListeners();
}
window.initProfileEdit = initProfileEdit;
window.closeProfileModal = closeProfileModal;
window.saveProfileChanges = saveProfileChanges;
window.renderLanguageChips = renderLanguageChips;
window.updateProfileViews = updateProfileViews;
window.openProfileModal = openProfileModal;
