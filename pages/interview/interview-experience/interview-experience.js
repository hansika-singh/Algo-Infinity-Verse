const IEP_STORAGE_KEY = 'algoInfinityVerse_interviewExperiences';

const initialExperiences = [
  {
    id: 1,
    company: 'Google',
    role: 'SDE-1',
    difficulty: 'hard',
    rating: 4,
    title: 'Google SDE-1 Interview - A Learning Journey',
    content: 'The process started with a phone screen where I was asked about merge intervals and a system design question about URL shortener. After clearing that, there were 4 onsite rounds: 2 coding (LRU cache, serialize/deserialize binary tree), 1 system design (design WhatsApp), and 1 behavioral. The interviewers were friendly and focused on problem-solving approach rather than just the correct answer. Tip: Practice explaining your thought process out loud.',
    topics: ['arrays', 'system-design', 'trees', 'caching'],
    rounds: 4,
    offerStatus: 'selected',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    upvotes: 24,
    userVote: 0
  },
  {
    id: 2,
    company: 'Amazon',
    role: 'SDE-2',
    difficulty: 'medium',
    rating: 3,
    title: 'Amazon SDE-2 Interview Experience',
    content: 'Had 3 rounds: Online assessment with 2 coding problems (top K frequent elements, word ladder), followed by 2 virtual onsite rounds. First round focused on LP questions and a coding problem about designing an autocomplete system. Second round was system design: design a recommendation system. The LP questions are crucial - prepare STAR format stories for each leadership principle.',
    topics: ['hashmap', 'graphs', 'system-design', 'leadership-principles'],
    rounds: 3,
    offerStatus: 'rejected',
    timestamp: new Date(Date.now() - 345600000).toISOString(),
    upvotes: 18,
    userVote: 0
  },
  {
    id: 3,
    company: 'Microsoft',
    role: 'Frontend Engineer',
    difficulty: 'medium',
    rating: 5,
    title: 'Microsoft Frontend - Great Experience!',
    content: 'One of the best interview experiences. The process was smooth: screening call -> coding round (implement a virtual list component) -> system design round (design a collaborative editor) -> behavioral with hiring manager. The team was very supportive and provided constructive feedback after each round. Make sure you know your JavaScript fundamentals well - closures, prototypes, event loop.',
    topics: ['javascript', 'react', 'system-design', 'frontend'],
    rounds: 4,
    offerStatus: 'selected',
    timestamp: new Date(Date.now() - 518400000).toISOString(),
    upvotes: 32,
    userVote: 0
  }
];

function getExperiences() {
  const stored = localStorage.getItem(IEP_STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
  }
  localStorage.setItem(IEP_STORAGE_KEY, JSON.stringify(initialExperiences));
  return initialExperiences;
}

function saveExperiences(experiences) {
  localStorage.setItem(IEP_STORAGE_KEY, JSON.stringify(experiences));
}

function generateId(experiences) {
  let id = Date.now();
  while (experiences.some(e => e.id === id)) id++;
  return id;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function starsHtml(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= rating
      ? '<i class="fas fa-star"></i>'
      : '<i class="far fa-star"></i>';
  }
  return html;
}

// ===== STATE =====
let currentCompany = 'all';
let currentDifficulty = 'all';
let currentSearch = '';
let currentSort = 'newest';

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  sessionStorage.setItem('algoInfinityVerse_appLoaded', 'true');
  initLoadingScreen();
  initNavbar();
  initIEP();
});

function initLoadingScreen() {
  setTimeout(() => {
    const s = document.getElementById('loading-screen');
    if (s) s.classList.add('hidden');
  }, 1500);
}

function initNavbar() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  let overlay = document.querySelector('.nav-overlay');
  if (!overlay && menuToggle && navLinks) {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);
  }

  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains('active');
    navLinks.classList.toggle('active', isOpen);
    menuToggle.setAttribute('aria-expanded', isOpen);
    if (overlay) overlay.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    const icon = menuToggle.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-bars', !isOpen);
      icon.classList.toggle('fa-times', isOpen);
    }
  };

  const closeMenu = () => {
    if (!navLinks.classList.contains('active')) return;
    toggleMenu(false);
  };

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });
    if (overlay) overlay.addEventListener('click', closeMenu);
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
  const isMobile = () => window.matchMedia('(max-width: 1024px)').matches;

  dropdownToggles.forEach(toggle => {
    const parent = toggle.closest('.has-dropdown');
    const menu = parent?.querySelector('.dropdown-menu');
    if (!parent || !menu) return;

    let hoverTimeout;

    const showMenu = () => { clearTimeout(hoverTimeout); parent.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); };
    const hideMenu = () => { hoverTimeout = setTimeout(() => { parent.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }, 250); };

    parent.addEventListener('mouseenter', () => { if (!isMobile()) showMenu(); });
    parent.addEventListener('mouseleave', () => { if (!isMobile()) hideMenu(); });
    toggle.addEventListener('focus', () => { if (!isMobile()) showMenu(); });
    menu.addEventListener('focusin', () => { if (!isMobile()) showMenu(); });
    parent.addEventListener('focusout', () => { if (!isMobile()) hideMenu(); });

    toggle.addEventListener('click', (e) => {
      if (isMobile()) { e.preventDefault(); e.stopPropagation(); const isOpen = parent.classList.toggle('open'); toggle.setAttribute('aria-expanded', isOpen); }
    });

    menu.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        if (isMobile()) { parent.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
      });
    });
  });

  window.addEventListener('resize', () => {
    if (!isMobile()) {
      document.querySelectorAll('.has-dropdown.open').forEach(el => el.classList.remove('open'));
      dropdownToggles.forEach(toggle => toggle.setAttribute('aria-expanded', 'false'));
    }
  });

  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.style.background = window.scrollY > 50 ? 'rgba(10, 10, 26, 0.95)' : 'rgba(10, 10, 26, 0.95)';
    }
  });
}
// ===== MAIN IEP LOGIC =====
function initIEP() {
  renderList();
  updateStats();

  // Star rating
  const stars = document.querySelectorAll('#iepStarRating i');
  const ratingInput = document.getElementById('iepRating');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const value = parseInt(star.dataset.star);
      ratingInput.value = value;
      stars.forEach(s => {
        const sv = parseInt(s.dataset.star);
        s.className = sv <= value ? 'fas fa-star' : 'far fa-star';
      });
    });
    star.addEventListener('mouseenter', () => {
      const value = parseInt(star.dataset.star);
      stars.forEach(s => {
        const sv = parseInt(s.dataset.star);
        s.className = sv <= value ? 'fas fa-star' : 'far fa-star';
      });
    });
    star.addEventListener('mouseleave', () => {
      const selected = parseInt(ratingInput.value) || 0;
      stars.forEach(s => {
        const sv = parseInt(s.dataset.star);
        s.className = sv <= selected ? 'fas fa-star' : 'far fa-star';
      });
    });
  });

  // Company other toggle
  const companySelect = document.getElementById('iepCompany');
  const otherInput = document.getElementById('iepCompanyOther');
  companySelect.addEventListener('change', () => {
    otherInput.disabled = companySelect.value !== 'Other';
    if (companySelect.value !== 'Other') otherInput.value = '';
  });

  // Form submit
  document.getElementById('iepForm').addEventListener('submit', (e) => {
    e.preventDefault();
    submitExperience();
  });

  // Search
  document.getElementById('iepSearch').addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase();
    renderList();
  });

  // Company filters
  document.querySelectorAll('#iepCompanyFilters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#iepCompanyFilters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCompany = btn.dataset.company;
      renderList();
    });
  });

  // Difficulty filters
  document.querySelectorAll('#iepDiffFilters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#iepDiffFilters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDifficulty = btn.dataset.diff;
      renderList();
    });
  });

  // Sort
  document.getElementById('iepSort').addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderList();
  });
}

function submitExperience() {
  const companySelect = document.getElementById('iepCompany');
  const otherInput = document.getElementById('iepCompanyOther');
  const role = document.getElementById('iepRole').value.trim();
  const difficulty = document.getElementById('iepDifficulty').value;
  const rating = parseInt(document.getElementById('iepRating').value);
  const title = document.getElementById('iepTitle').value.trim();
  const content = document.getElementById('iepContent').value.trim();
  const topicsInput = document.getElementById('iepTopics').value.trim();
  const rounds = parseInt(document.getElementById('iepRounds').value) || null;
  const offerStatus = document.getElementById('iepOffer').value;

  let company = companySelect.value;
  if (company === 'Other' && otherInput.value.trim()) {
    company = otherInput.value.trim();
  }

  if (!company || !role || !difficulty || !rating || !title || !content) {
    void 0;
    return;
  }

  let topics = [];
  if (topicsInput) {
    topics = topicsInput.split(',').map(t => t.trim()).filter(t => t);
  }

  let experiences = getExperiences();
  const newExp = {
    id: generateId(experiences),
    company,
    role,
    difficulty,
    rating,
    title,
    content,
    topics,
    rounds,
    offerStatus,
    timestamp: new Date().toISOString(),
    upvotes: 0,
    userVote: 0
  };

  experiences.push(newExp);
  saveExperiences(experiences);

  document.getElementById('iepForm').reset();
  document.getElementById('iepCompanyOther').disabled = true;
  document.getElementById('iepRating').value = '';
  document.querySelectorAll('#iepStarRating i').forEach(s => s.className = 'far fa-star');

  renderList();
  updateStats();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderList() {
  const container = document.getElementById('iepList');
  const empty = document.getElementById('iepEmpty');
  const resultCount = document.getElementById('iepResultCount');

  let experiences = getExperiences();

  // Filter by company
  if (currentCompany !== 'all') {
    experiences = experiences.filter(e => e.company.toLowerCase() === currentCompany.toLowerCase());
  }

  // Filter by difficulty
  if (currentDifficulty !== 'all') {
    experiences = experiences.filter(e => e.difficulty === currentDifficulty);
  }

  // Filter by search
  if (currentSearch) {
    experiences = experiences.filter(e =>
      e.title.toLowerCase().includes(currentSearch) ||
      e.company.toLowerCase().includes(currentSearch) ||
      e.role.toLowerCase().includes(currentSearch) ||
      e.content.toLowerCase().includes(currentSearch) ||
      (e.topics && e.topics.some(t => t.toLowerCase().includes(currentSearch)))
    );
  }

  // Sort
  experiences.sort((a, b) => {
    switch (currentSort) {
      case 'oldest': return new Date(a.timestamp) - new Date(b.timestamp);
      case 'most_upvotes': return (b.upvotes || 0) - (a.upvotes || 0);
      case 'highest_rated': return (b.rating || 0) - (a.rating || 0);
      default: return new Date(b.timestamp) - new Date(a.timestamp);
    }
  });

  if (resultCount) {
    resultCount.textContent = `${experiences.length} experience${experiences.length !== 1 ? 's' : ''}`;
  }

  container.innerHTML = '';

  if (experiences.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';

  experiences.forEach(exp => {
    const card = document.createElement('div');
    card.className = 'iep-card animate-in';

    const companyIcon = getCompanyIcon(exp.company);
    const topicsHtml = exp.topics && exp.topics.length > 0
      ? '<div class="iep-card-tags">' + exp.topics.map(t => `<span class="iep-tag">${escapeHtml(t)}</span>`).join('') + '</div>'
      : '';

    const statusBadge = exp.offerStatus
      ? `<span class="iep-status-badge iep-status-${exp.offerStatus}">${exp.offerStatus}</span>`
      : '';

    const roundsHtml = exp.rounds ? `<span class="iep-card-stat"><i class="fas fa-layer-group"></i> ${exp.rounds} rounds</span>` : '';

    const contentPreview = exp.content.length > 200
      ? exp.content.substring(0, 200) + '...'
      : exp.content;

    const isTruncated = exp.content.length > 200;

    card.innerHTML = `
      <div class="iep-card-header">
        <div>
          <span class="iep-card-company">${companyIcon} ${escapeHtml(exp.company)}</span>
          <span class="iep-card-role">${escapeHtml(exp.role)}</span>
        </div>
        <div class="iep-stars-display">${starsHtml(exp.rating)}</div>
      </div>
      <div class="iep-card-meta">
        <span class="iep-diff-badge iep-diff-${exp.difficulty}">${exp.difficulty}</span>
        <span class="iep-card-stat"><i class="far fa-calendar"></i> ${formatDate(exp.timestamp)}</span>
        ${roundsHtml}
        ${statusBadge}
      </div>
      <h4 class="iep-card-title">${escapeHtml(exp.title)}</h4>
      <div class="iep-card-content" id="iepContent-${exp.id}">${escapeHtml(contentPreview)}</div>
      ${isTruncated ? `<button class="iep-read-more" data-id="${exp.id}">Read more</button>` : ''}
      ${topicsHtml}
      <div class="iep-card-footer">
        <div class="iep-card-actions">
          <button class="iep-upvote-btn ${exp.userVote === 1 ? 'voted' : ''}" data-action="upvote" data-id="${exp.id}">
            <i class="fas fa-arrow-up"></i>
            <span>${exp.upvotes || 0}</span>
          </button>
          <button class="iep-upvote-btn" data-action="view" data-id="${exp.id}">
            <i class="fas fa-eye"></i> View Details
          </button>
        </div>
      </div>
    `;
      card.querySelectorAll('button[data-action]').forEach(button => {
          button.addEventListener('click', (e) => {
              e.stopPropagation();

              const id = Number(button.dataset.id);

              if (button.dataset.action === 'upvote') {
                  handleUpvote(id);
              }

              if (button.dataset.action === 'view') {
                  openModal(id);
              }
          });
      });


      const readMoreBtn = card.querySelector('.iep-read-more');

      if (readMoreBtn) {
          readMoreBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              toggleExpand(Number(readMoreBtn.dataset.id));
          });
      }
    card.addEventListener('click', (e) => {
      const target = e.target.closest('button, a, .iep-tag, .iep-card-company, .iep-diff-badge, .iep-status-badge');
      if (!target) openModal(exp.id);
    });
    container.appendChild(card);
  });
}

function getCompanyIcon(company) {
  const icons = {
    'amazon': '<i class="fab fa-amazon"></i>',
    'google': '<i class="fab fa-google"></i>',
    'microsoft': '<i class="fab fa-microsoft"></i>',
    'meta': '<i class="fab fa-meta"></i>',
    'adobe': '<i class="fas fa-bezier-curve"></i>'
  };
  return icons[company.toLowerCase()] || '<i class="fas fa-building"></i>';
}

function toggleExpand(id) {
  const contentDiv = document.getElementById(`iepContent-${id}`);
  if (!contentDiv) return;
  const btn = contentDiv.nextElementSibling;
  if (!btn) return;
  const exp = getExperiences().find(e => e.id === id);
  if (!exp) return;
  if (contentDiv.classList.contains('expanded')) {
    contentDiv.classList.remove('expanded');
    contentDiv.textContent = exp.content.substring(0, 200) + '...';
    btn.textContent = 'Read more';
  } else {
    contentDiv.classList.add('expanded');
    contentDiv.textContent = exp.content;
    btn.textContent = 'Show less';
  }
}

function handleUpvote(id) {
  let experiences = getExperiences();
  const exp = experiences.find(e => e.id === id);
  if (!exp) return;

  if (exp.userVote === 1) {
    exp.upvotes--;
    exp.userVote = 0;
  } else {
    if (exp.userVote === -1) exp.upvotes++;
    exp.upvotes++;
    exp.userVote = 1;
  }

  saveExperiences(experiences);
  renderList();
  updateStats();
}

function openModal(id) {
  const experiences = getExperiences();
  const exp = experiences.find(e => e.id === id);
  if (!exp) return;

  const overlay = document.createElement('div');
  overlay.className = 'iep-modal-overlay';overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {closeModal(overlay);}});

  const companyIcon = getCompanyIcon(exp.company);
  const topicsHtml = exp.topics && exp.topics.length > 0
    ? '<div class="iep-card-tags" style="margin-top:1rem;">' + exp.topics.map(t => `<span class="iep-tag">${escapeHtml(t)}</span>`).join('') + '</div>'
    : '';

  const statusBadge = exp.offerStatus
    ? `<span class="iep-status-badge iep-status-${exp.offerStatus}">${exp.offerStatus}</span>`
    : '';

  const roundsHtml = exp.rounds ? `<span class="iep-card-stat"><i class="fas fa-layer-group"></i> ${exp.rounds} rounds</span>` : '';

  overlay.innerHTML = `
    <div class="iep-modal">
      <div class="iep-modal-header">
        <h2>${escapeHtml(exp.title)}</h2>
        <button class="iep-modal-close" data-action="close-modal">&times;</button>
      </div>
      <div class="iep-modal-meta">
        <span class="iep-card-company">${companyIcon} ${escapeHtml(exp.company)}</span>
        <span class="iep-card-role">${escapeHtml(exp.role)}</span>
        <span class="iep-diff-badge iep-diff-${exp.difficulty}">${exp.difficulty}</span>
        ${statusBadge}
      </div>
      <div class="iep-modal-meta">
        <span class="iep-card-stat"><i class="far fa-calendar"></i> ${formatDate(exp.timestamp)}</span>
        ${roundsHtml}
        <span class="iep-card-stat"><div class="iep-stars-display">${starsHtml(exp.rating)}</div></span>
        <span class="iep-card-stat"><i class="fas fa-arrow-up"></i> ${exp.upvotes || 0} upvotes</span>
      </div>
      <div class="iep-modal-content">${escapeHtml(exp.content)}</div>
      ${topicsHtml}
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
    const closeButton = overlay.querySelector('[data-action="close-modal"]');

    closeButton.addEventListener('click', () => {
        closeModal(overlay);
    });

  function escapeHandler(e) {
    if (e.key === 'Escape') closeModal(overlay);
  }
  document.addEventListener('keydown', escapeHandler);
  overlay._escapeHandler = escapeHandler;
}

function closeModal(overlay) {
  if (overlay._escapeHandler) {
    document.removeEventListener('keydown', overlay._escapeHandler);
  }
  overlay.remove();
  document.body.style.overflow = '';
}

function updateStats() {
  const experiences = getExperiences();
  document.getElementById('iepTotalExperiences').textContent = experiences.length;
  const companies = new Set(experiences.map(e => e.company));
  document.getElementById('iepCompaniesCovered').textContent = companies.size;
  const totalUpvotes = experiences.reduce((sum, e) => sum + (e.upvotes || 0), 0);
  document.getElementById('iepTotalUpvotes').textContent = totalUpvotes;
}
