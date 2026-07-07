

/**
 * Highlight search term in text
 * @param {string} text - The text to highlight
 * @param {string} searchTerm - The term to highlight
 * @returns {string} HTML with highlighted text
 */
const HTML_ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => HTML_ESCAPE_MAP[char]);
}

function highlightText(text, searchTerm) {
    const source = String(text ?? '');
    const term = String(searchTerm ?? '').trim();

    if (!source || term === '') {
        return escapeHtml(source);
    }
    
    // Escape special regex characters to prevent injection
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedTerm, 'gi');
    
    let highlighted = '';
    let lastIndex = 0;

    source.replace(regex, (match, offset) => {
        highlighted += escapeHtml(source.slice(lastIndex, offset));
        highlighted += `<span class="search-highlight">${escapeHtml(match)}</span>`;
        lastIndex = offset + match.length;
        return match;
    });

    return highlighted + escapeHtml(source.slice(lastIndex));
}

/**
 * Search problems with highlighting
 * @param {string} searchTerm - The search term
 */
function searchProblems(searchTerm) {
    const container = document.querySelector('.problems-list');
    if (!container) return;
    
    // Get problems from your data source
    const problems = Array.isArray(window.problemsData)
        ? window.problemsData
        : (typeof window.getAllProblems === 'function' ? window.getAllProblems() : []);
    
    if (!searchTerm || searchTerm.trim() === '') {
        renderProblems(problems, '');
        return;
    }
    
    const filtered = problems.filter(problem => {
        const titleMatch = problem.title.toLowerCase().includes(searchTerm.toLowerCase());
        const descMatch = problem.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const tagsMatch = problem.tags?.some(tag => 
            tag.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return titleMatch || descMatch || tagsMatch;
    });
    
    renderProblems(filtered, searchTerm);
}

/**
 * Render problems with highlighting
 * @param {Array} problems - List of problems
 * @param {string} searchTerm - The search term
 */
function renderProblems(problems, searchTerm = '') {
    const container = document.querySelector('.problems-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!problems || problems.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';

        const icon = document.createElement('i');
        icon.className = 'fas fa-search';

        const message = document.createElement('p');
        const term = document.createElement('strong');
        term.textContent = searchTerm;
        message.append('No problems found matching "', term, '"');

        noResults.append(icon, message);
        container.appendChild(noResults);
        return;
    }
    
    problems.forEach(problem => {
        const card = document.createElement('div');
        card.className = 'problem-card';
        card.dataset.id = problem.id;
        
        // Apply highlighting
        const highlightedTitle = highlightText(problem.title, searchTerm);
        const highlightedDesc = highlightText(problem.description || '', searchTerm);
        
        // Build tags with highlighting
        let tagsHTML = '';
        if (problem.tags && problem.tags.length > 0) {
            const highlightedTags = problem.tags.map(tag => 
                highlightText(tag, searchTerm)
            );
            tagsHTML = `<div class="problem-tags">${highlightedTags.map(tag => 
                `<span class="tag">${tag}</span>`
            ).join('')}</div>`;
        }
        
        card.innerHTML = `
            <div class="problem-header">
                <h3 class="problem-title">${highlightedTitle}</h3>
                <span class="difficulty-badge ${problem.difficulty?.toLowerCase() || 'easy'}">
                    ${problem.difficulty || 'Easy'}
                </span>
            </div>
            <p class="problem-description">${highlightedDesc}</p>
            ${tagsHTML}
            <button class="btn-solve" data-id="${problem.id}">
                <i class="fas fa-code"></i> Solve Problem
            </button>
        `;
        
        container.appendChild(card);
    });
}

/**
 * Debounce function to prevent excessive search calls
 * @param {Function} func - The function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Initialize search functionality
 */
function initSearch() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;
    
    const debouncedSearch = debounce((e) => {
        searchProblems(e.target.value.trim());
    }, 300);
    
    searchInput.addEventListener('input', debouncedSearch);
    
    // Also handle form submission if wrapped in a form
    const searchForm = searchInput.closest('form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            searchProblems(searchInput.value.trim());
        });
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initSearch);

// Export functions for use in other modules
export { 
    highlightText, 
    searchProblems, 
    renderProblems, 
    initSearch 
};