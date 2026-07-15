let roadmapsData = null;
let activeRoadmap = 'beginner';

async function fetchRoadmaps() {
  try {
    const res = await fetch('/api/roadmaps');
    if (!res.ok) throw new Error('Failed to fetch roadmaps');
    roadmapsData = await res.json();
    renderRoadmap();
  } catch (err) {
    console.error(err);
    document.getElementById('timelineContainer').innerHTML = `
      <p style="text-align: center; color: #ef4444; padding: 2rem;">
        Failed to load roadmaps from registry. Please try again later.
      </p>
    `;
  }
}

function renderRoadmap() {
  if (!roadmapsData) return;
  const roadmap = roadmapsData[activeRoadmap];
  if (!roadmap) return;

  document.getElementById('currentRoadmapTitle').textContent = roadmap.title;
  document.getElementById('currentRoadmapDesc').textContent = roadmap.description;
  document.getElementById('currentRoadmapTime').textContent =
    `⏱️ Estimated: ${roadmap.estimatedTime}`;

  const searchQuery = document.getElementById('stepSearch').value.toLowerCase().trim();
  const filteredSteps = roadmap.steps.filter((step) => {
    return (
      step.title.toLowerCase().includes(searchQuery) ||
      step.desc.toLowerCase().includes(searchQuery)
    );
  });

  const timelineContainer = document.getElementById('timelineContainer');
  if (filteredSteps.length === 0) {
    timelineContainer.innerHTML = `
      <p style="text-align: center; color: var(--text-secondary); padding: 2rem;">
        No steps match your search query.
      </p>
    `;
    return;
  }

  timelineContainer.innerHTML = filteredSteps
    .map(
      (step, idx) => `
    <div class="timeline-item">
      <div class="timeline-icon-box">
        <i class="fas ${step.icon || 'fa-code'}"></i>
      </div>
      <div class="timeline-content">
        <h3>${idx + 1}. ${step.title}</h3>
        <p>${step.desc}</p>
        <div class="timeline-footer">
          <span class="badge badge-${step.difficulty.toLowerCase()}">${step.difficulty}</span>
          <span class="time-estimate"><i class="far fa-clock"></i> ${step.estimatedTime}</span>
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

document.addEventListener('DOMContentLoaded', () => {
  // Load partials
  if (typeof window.loadPartial === 'function') {
    window.loadPartial('navbar-placeholder', '/partials/navbar.html');
    window.loadPartial('footer-placeholder', '/partials/footer.html');
  }

  // Fetch roadmaps
  fetchRoadmaps();

  // Setup sidebar card click handlers
  document.querySelectorAll('.roadmap-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.roadmap-card').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      activeRoadmap = card.dataset.roadmap;
      renderRoadmap();
    });
  });

  // Setup search input listener
  document.getElementById('stepSearch').addEventListener('input', renderRoadmap);
});
