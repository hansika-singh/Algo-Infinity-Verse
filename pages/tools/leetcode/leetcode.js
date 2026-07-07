/**
 * LeetCode Metric Sync Engine
 * Architecture: Clean Asynchronous Lifecycle Management with Error Boundary Handling
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Element Declarations
    const usernameInput = document.getElementById('leetcode-username');
    const syncButton = document.getElementById('sync-engine-btn');
    const btnText = syncButton.querySelector('.btn-text');
    const spinner = syncButton.querySelector('.spinner');

    const statTotal = document.getElementById('stat-total-solved');
    const statEasy = document.getElementById('stat-easy-solved');
    const statMedium = document.getElementById('stat-medium-solved');
    const statHard = document.getElementById('stat-hard-solved');

    // 2. State Controller (Protects against fast double-clicks)
    let isFetching = false;

    // 3. Main Asynchronous Sync Engine
    async function syncLeetCodeProfile() {
        const username = usernameInput.value.trim();

        // Input Validation Layer
        if (!username) {
            void 0;
            return;
        }

        if (isFetching) return;

        // Enter Loading Lifecycle State
        setLoadingState(true);

        try {
            // Using a highly reliable public open-source worker proxy to fetch clean LeetCode GraphQL statistics
            const targetUrl = `https://leetcode-api-faisalshohag.vercel.app/${username}`;
            
            const response = await fetch(targetUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP Error status: ${response.status}`);
            }

            const data = await response.json();

            // Error Boundary check for missing or invalid users
            if (!data || (data.errors && data.errors.length > 0) || data.matchedUser === null || data.status === 'error') {
                throw new Error('User profile data could not be found or fetched.');
            }

            // Successfully received data -> Update UI Layout smoothly
            renderMetrics(data);

        } catch (error) {
            console.error('Execution Exception:', error);
            void 0;
            resetMetricsDisplay();
        } finally {
            // Exit Loading Lifecycle State
            setLoadingState(false);
        }
    }

    // 4. UI Rendering Layer (Maps API response to UI elements)
    function renderMetrics(data) {
        // Safe parsing with fallback values to avoid runtime crashes
        const totalSolved = data.totalSolved || 0;
        const easySolved = data.easySolved || 0;
        const mediumSolved = data.mediumSolved || 0;
        const hardSolved = data.hardSolved || 0;

        // Elegant text incrementation feel
        statTotal.textContent = totalSolved;
        statEasy.textContent = easySolved;
        statMedium.textContent = mediumSolved;
        statHard.textContent = hardSolved;
    }

    // 5. UI Loading State Controller
    function setLoadingState(loading) {
        isFetching = loading;
        syncButton.disabled = loading;
        
        if (loading) {
            btnText.textContent = 'Syncing...';
            spinner.classList.remove('hidden');
            syncButton.style.opacity = '0.7';
            syncButton.style.cursor = 'not-allowed';
        } else {
            btnText.textContent = 'Sync Profile';
            spinner.classList.add('hidden');
            syncButton.style.opacity = '1';
            syncButton.style.cursor = 'pointer';
        }
    }

    // 6. UI Reset Fallback Layer
    function resetMetricsDisplay() {
        statTotal.textContent = '0';
        statEasy.textContent = '0';
        statMedium.textContent = '0';
        statHard.textContent = '0';
    }

    // 7. Event Binding Initializer
    syncButton.addEventListener('click', syncLeetCodeProfile);

    // Form Accessibility Feature: Allow triggering via Enter key
    usernameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            syncLeetCodeProfile();
        }
    });
});