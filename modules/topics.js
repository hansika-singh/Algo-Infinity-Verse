// modules/topics.js

/**
 * Get user progress from localStorage
 * @returns {Object} User progress data
 */
function getUserProgress() {
    try {
        const saved = localStorage.getItem('algoInfinityVerse');
        if (saved) {
            const data = JSON.parse(saved);
            return data.progress || {};
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
    return {};
}

/**
 * Save user progress to localStorage
 * @param {Object} progress - Progress data
 */
function saveUserProgress(progress) {
    try {
        const saved = localStorage.getItem('algoInfinityVerse');
        const data = saved ? JSON.parse(saved) : {};
        data.progress = progress;
        localStorage.setItem('algoInfinityVerse', JSON.stringify(data));
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

/**
 * Render topic cards with completion status
 * @param {Array} topics - Array of topic objects
 */
function renderTopicCards(topics = []) {
    const container = document.querySelector('.topics-grid');
    if (!container) return;

    const userProgress = getUserProgress();
    
    // Get topics from global or passed parameter
    const allTopics = topics.length > 0 ? topics : (window.dsaTopics || []);
    
    if (allTopics.length === 0) {
        container.innerHTML = `
            <div class="no-topics">
                <i class="fas fa-book-open"></i>
                <p>No topics available</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    allTopics.forEach(topic => {
        const progress = userProgress[topic.id] || 0;
        const isComplete = progress >= 100;
        
        const card = document.createElement('div');
        card.className = `topic-card ${isComplete ? 'completed' : ''}`;
        card.dataset.topicId = topic.id;
        
        // Build status indicator HTML
        let statusHTML = '';
        if (isComplete) {
            statusHTML = `
                <div class="completion-badge" title="Topic Complete! 🎉">
                    <i class="fas fa-check-circle"></i>
                    <span>Completed</span>
                </div>
            `;
        } else if (progress > 0) {
            statusHTML = `
                <div class="progress-wrapper">
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${progress}%</span>
                </div>
            `;
        } else {
            statusHTML = `
                <div class="progress-wrapper">
                    <span class="progress-text not-started">Not Started</span>
                </div>
            `;
        }
        
        card.innerHTML = `
            <div class="topic-icon">${topic.icon || '📚'}</div>
            <h3 class="topic-title">${topic.name || 'Topic'}</h3>
            <p class="topic-description">${topic.description || 'Learn this topic'}</p>
            ${statusHTML}
            <a href="/pages/learning/${topic.id}.html" class="btn btn-primary">
                ${isComplete ? 'Review Topic' : 'Start Learning'}
                <i class="fas fa-arrow-right"></i>
            </a>
        `;
        
        container.appendChild(card);
    });
}

/**
 * Update topic progress
 * @param {string} topicId - Topic ID
 * @param {number} newProgress - New progress value (0-100)
 */
function updateTopicProgress(topicId, newProgress) {
    const progress = getUserProgress();
    progress[topicId] = Math.min(Math.max(newProgress, 0), 100);
    saveUserProgress(progress);
    
    // Re-render topics if the grid is visible
    const container = document.querySelector('.topics-grid');
    if (container) {
        renderTopicCards();
    }
}

/**
 * Get progress for a specific topic
 * @param {string} topicId - Topic ID
 * @returns {number} Progress percentage (0-100)
 */
function getTopicProgress(topicId) {
    const progress = getUserProgress();
    return progress[topicId] || 0;
}

/**
 * Check if a topic is completed
 * @param {string} topicId - Topic ID
 * @returns {boolean} True if completed
 */
function isTopicCompleted(topicId) {
    return getTopicProgress(topicId) >= 100;
}

/**
 * Get an array of topic objects that the user has fully completed (progress >= 100%).
 * Utilizes existing getUserProgress and the global dsaTopics array.
 */
function getCompletedTopics() {
    const progress = getUserProgress();
    const all = window.dsaTopics || [];
    return all.filter(topic => (progress[topic.id] || 0) >= 100);
}

// Export functions
export { 
    renderTopicCards, 
    updateTopicProgress, 
    getTopicProgress, 
    isTopicCompleted,
    getUserProgress,
    saveUserProgress,
    getCompletedTopics
};

// Initialize on DOM ready if topics exist
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.topics-grid')) {
        renderTopicCards();
    }
});