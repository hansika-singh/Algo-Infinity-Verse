// Contributor Data & UI logic. For dynamic GitHub fetching, contributors/index.html
// already loads GitHub data in-page and opens a modal profile with full details.
// If you prefer a separate profile page instead of a modal, replace the modal
// redirect in contributors/index.html with: `window.location.href='profile.html?username=' + username;`
// and update this file to read from the query param there.

const contributorsData = [
    {
        id: 1,
        username: "Eshajha19",
        name: "Esha Jha",
        avatar: "https://avatars.githubusercontent.com/Eshajha19",
        contributions: 45,
        prs: 12,
        issues: 8,
        badges: ["Gold", "Bug Hunter", "Top Contributor"],
        joined: "2024-01-15"
    },
    {
        id: 2,
        username: "Aharshi3614",
        name: "Aharshi",
        avatar: "https://avatars.githubusercontent.com/Aharshi3614",
        contributions: 32,
        prs: 8,
        issues: 5,
        badges: ["Silver", "Bug Hunter"],
        joined: "2024-02-01"
    },
    {
        id: 3,
        username: "kunal-yelgate",
        name: "Kunal Yelgate",
        avatar: "https://avatars.githubusercontent.com/kunal-yelgate",
        contributions: 28,
        prs: 6,
        issues: 4,
        badges: ["Bronze"],
        joined: "2024-02-15"
    }
];

function renderLeaderboard(contributors) {
    const sorted = [...contributors].sort((a, b) => b.contributions - a.contributions);
    const top3 = sorted.slice(0, 3);
    const leaderboardEl = document.getElementById('leaderboard');

    const ranks = ['1', '2', '3'];

    leaderboardEl.innerHTML = top3.map((contributor, index) => `
        <div class="leaderboard-item" data-username="${contributor.username}">
            <span class="leaderboard-rank">${ranks[index] || `#${index + 1}`}</span>
            <div class="leaderboard-avatar">
                <img src="${contributor.avatar}" alt="${contributor.name}" loading="lazy">
            </div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${contributor.name}</div>
                <div class="leaderboard-stats">
                    <span> ${contributor.contributions} contributions</span>
                    <span> ${contributor.prs} PRs</span>
                    <span> ${contributor.issues} issues</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderContributors(contributors) {
    const grid = document.getElementById('contributorsGrid');

    grid.innerHTML = contributors.map(contributor => `
        <div class="contributor-card" data-username="${contributor.username}">
            <div class="contributor-avatar">
                <img src="${contributor.avatar}" alt="${contributor.name}" loading="lazy">
            </div>
            <div class="contributor-name">${contributor.name}</div>
            <div class="contributor-username">@${contributor.username}</div>
            <div class="contributor-badges">
                ${contributor.badges.map(badge => `
                    <span class="badge badge-${badge.toLowerCase()}">${badge}</span>
                `).join('')}
            </div>
            <div class="contributor-stats">
                <div class="stat">
                    <span class="stat-value">${contributor.contributions}</span>
                    <span class="stat-label">Contributions</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${contributor.prs}</span>
                    <span class="stat-label">PRs</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${contributor.issues}</span>
                    <span class="stat-label">Issues</span>
                </div>
            </div>
        </div>
    `).join('');
}

function viewProfile(username) {
    window.location.href = `profile.html?username=${username}`;
}

function attachProfileNavigation() {
    const leaderboard = document.getElementById("leaderboard");
    const contributorsGrid = document.getElementById("contributorsGrid");

    leaderboard?.addEventListener("click", (event) => {
        const item = event.target.closest(".leaderboard-item");
        if (!item) return;

        viewProfile(item.dataset.username);
    });

    contributorsGrid?.addEventListener("click", (event) => {
        const card = event.target.closest(".contributor-card");
        if (!card) return;

        viewProfile(card.dataset.username);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderLeaderboard(contributorsData);
    renderContributors(contributorsData);
    attachProfileNavigation();
});



// ===== SEARCH AND FILTER FUNCTIONALITY =====

function filterContributors(searchTerm, filterType) {
  const term = searchTerm.toLowerCase().trim();
  const cards = document.querySelectorAll('.contributor-card');
  let visibleCount = 0;

  // Get all contributor data from cards
  const cardData = [];
  cards.forEach(card => {
    const name = card.querySelector('.contributor-name')?.textContent?.trim() || '';
    const username = card.querySelector('.contributor-username')?.textContent?.trim()?.replace('@', '') || '';
    const stats = card.querySelectorAll('.stat-value');
    const contributions = stats.length > 0 ? parseInt(stats[0].textContent) || 0 : 0;
    const prs = stats.length > 1 ? parseInt(stats[1].textContent) || 0 : 0;
    const issues = stats.length > 2 ? parseInt(stats[2].textContent) || 0 : 0;
    const badges = card.querySelectorAll('.badge').length || 0;
    cardData.push({ element: card, name, username, contributions, prs, issues, badges });
  });

  // Filter by search term
  let filteredData = cardData;
  if (term) {
    filteredData = filteredData.filter(item => 
      item.name.toLowerCase().includes(term) || 
      item.username.toLowerCase().includes(term)
    );
  }

  // Sort by filter type
  if (filterType === 'contributions') {
    filteredData.sort((a, b) => b.contributions - a.contributions);
  } else if (filterType === 'prs') {
    filteredData.sort((a, b) => b.prs - a.prs);
  } else if (filterType === 'issues') {
    filteredData.sort((a, b) => b.issues - a.issues);
  } else if (filterType === 'badges') {
    filteredData.sort((a, b) => b.badges - a.badges);
  }

  // Show/hide cards
  const grid = document.getElementById('contributorsGrid');
  filteredData.forEach(item => {
    item.element.classList.remove('hidden');
  });
  
  // Hide cards not in filteredData
  cardData.forEach(item => {
    if (!filteredData.includes(item)) {
      item.element.classList.add('hidden');
    }
  });

  // Reorder cards in DOM
  filteredData.forEach(item => {
    grid.appendChild(item.element);
  });

  visibleCount = filteredData.length;

  // Show no results message
  let noResults = document.querySelector('.no-results');
  if (visibleCount === 0 && cardData.length > 0) {
    if (!noResults) {
      noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.textContent = 'No contributors found matching your search.';
      grid.appendChild(noResults);
    }
    noResults.style.display = 'block';
  } else if (noResults) {
    noResults.style.display = 'none';
  }
}

// Event Listeners for Search and Filter
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchContributor');
  const clearBtn = document.getElementById('clearSearch');
  const filterSelect = document.getElementById('filterBy');
  
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const filterType = filterSelect ? filterSelect.value : 'all';
      filterContributors(this.value, filterType);
    });
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (searchInput) {
        searchInput.value = '';
        filterContributors('', filterSelect ? filterSelect.value : 'all');
        searchInput.focus();
      }
    });
  }
  
  if (filterSelect) {
    filterSelect.addEventListener('change', function() {
      const searchTerm = searchInput ? searchInput.value : '';
      filterContributors(searchTerm, this.value);
    });
  }
});