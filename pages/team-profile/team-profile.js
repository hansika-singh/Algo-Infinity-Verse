// pages/team-profile/team-profile.js

document.addEventListener('DOMContentLoaded', () => {
    // We'll use a hardcoded ID for demonstration, 
    // or parse it from query params e.g. ?id=team-alpha
    const urlParams = new URLSearchParams(window.location.search);
    const TEAM_ID = urlParams.get('id') || 'demo-team-1';

    let currentVersion = null;

    // DOM Elements
    const teamNameInput = document.getElementById('teamName');
    const teamDescriptionInput = document.getElementById('teamDescription');
    const headerTeamName = document.getElementById('headerTeamName');
    const headerVersion = document.getElementById('headerVersion');
    const form = document.getElementById('teamProfileForm');
    const conflictAlert = document.getElementById('conflictAlert');
    const successAlert = document.getElementById('successAlert');
    const refreshBtn = document.getElementById('refreshBtn');
    const saveBtn = document.getElementById('saveBtn');
    const saveStatus = document.getElementById('saveStatus');

    // Fetch Profile
    async function loadProfile() {
        try {
            saveStatus.textContent = 'Loading...';
            const res = await fetch(`/api/team-profile?id=${TEAM_ID}`);
            if (!res.ok) throw new Error('Failed to fetch profile');
            
            const data = await res.json();
            
            // Populate Data
            currentVersion = data.version;
            teamNameInput.value = data.name || '';
            teamDescriptionInput.value = data.description || '';
            
            headerTeamName.textContent = data.name || 'Unnamed Team';
            headerVersion.textContent = `Version: ${data.version}`;
            
            saveStatus.textContent = '';
            hideAlerts();
            
            // Re-enable form if it was disabled due to conflict
            saveBtn.disabled = false;
        } catch (err) {
            console.error(err);
            saveStatus.textContent = 'Error loading profile.';
        }
    }

    // Save Profile
    async function saveProfile(e) {
        e.preventDefault();
        
        if (currentVersion === null) return;
        
        const payload = {
            id: TEAM_ID,
            version: currentVersion,
            name: teamNameInput.value.trim(),
            description: teamDescriptionInput.value.trim()
        };

        try {
            saveBtn.disabled = true;
            saveStatus.textContent = 'Saving...';
            hideAlerts();

            const res = await fetch('/api/team-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.status === 409) {
                // OCC Conflict
                showConflictAlert();
                saveStatus.textContent = '';
            } else if (!res.ok) {
                throw new Error(data.error || 'Failed to save');
            } else {
                // Success
                currentVersion = data.version;
                headerTeamName.textContent = data.name;
                headerVersion.textContent = `Version: ${data.version}`;
                showSuccessAlert();
                saveStatus.textContent = '';
                saveBtn.disabled = false;
            }
        } catch (err) {
            console.error(err);
            saveStatus.textContent = 'Error saving profile.';
            saveBtn.disabled = false;
        }
    }

    function showConflictAlert() {
        conflictAlert.classList.remove('hidden');
    }

    function showSuccessAlert() {
        successAlert.classList.remove('hidden');
        setTimeout(() => {
            successAlert.classList.add('hidden');
        }, 3000);
    }

    function hideAlerts() {
        conflictAlert.classList.add('hidden');
        successAlert.classList.add('hidden');
    }

    // Event Listeners
    form.addEventListener('submit', saveProfile);
    refreshBtn.addEventListener('click', loadProfile);

    // Initial Load
    loadProfile();
});
