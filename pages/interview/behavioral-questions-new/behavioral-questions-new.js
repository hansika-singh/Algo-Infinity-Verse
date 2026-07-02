/**
 * behavioral-questions.js
 * Implements optimized chunked rendering, pagination, and event delegation
 * to prevent DOM bloat and improve mobile performance (Resolves Issue #100).
 */

// Generate a robust mock dataset representing a large payload.
// In a real scenario, this would likely be fetched from an API.
const behavioralDatabase = [
    { id: 1, category: "Leadership", question: "Tell me about a time you had to lead a project without formal authority.", star: { s: "Our team was assigned a critical feature, but the tech lead was suddenly pulled onto an emergency outage.", t: "Someone needed to coordinate the daily standups, unblock team members, and ensure we hit the sprint deadline.", a: "I stepped up by organizing a lightweight Jira board, volunteering to handle cross-team communication, and pairing with junior devs on complex PRs.", r: "We delivered the feature 2 days early, and my manager formally commended my proactive leadership in my performance review." }},
    { id: 2, category: "Conflict", question: "Describe a time you disagreed with a coworker on a technical approach.", star: { s: "We were building a new microservice. My colleague wanted to use NoSQL, but I strongly believed SQL was better suited for our highly relational data.", t: "We needed to agree on the database architecture before the end of the week without causing friction.", a: "Instead of arguing, I proposed we both write a short 1-page RFC (Request for Comments) outlining pros/cons, and then run a quick benchmarking test on mock data.", r: "The benchmark proved SQL was 40% faster for our specific join queries. My colleague agreed based on the data, and we maintained a great relationship." }},
    { id: 3, category: "Failure", question: "Tell me about a time you failed or made a significant mistake.", star: { s: "In my first year as a dev, I accidentally dropped a production database table during a manual migration script execution.", t: "I needed to restore the data immediately and prevent the company from losing client trust.", a: "I immediately alerted my tech lead and the operations channel. We utilized the automated AWS backups I had configured earlier that month to restore the data.", r: "The downtime was limited to 15 minutes. To prevent it from happening again, I wrote a post-mortem and implemented a CI/CD rule that requires dual-approval for production schema changes." }},
    { id: 4, category: "Teamwork", question: "Give an example of a time you had to work with a difficult team member.", star: { s: "I was paired with a developer who frequently delivered late code and missed daily syncs.", t: "I needed their API endpoints to complete my frontend work, and the project deadline was at risk.", a: "Instead of reporting them immediately, I scheduled a 1-on-1 coffee chat. I learned they were struggling with a new framework. I offered to pair-program with them for 1 hour a day.", r: "Their velocity increased significantly, we met the deadline, and they became one of my most reliable collaborators on future projects." }},
    { id: 5, category: "Leadership", question: "Tell me about a time you mentored someone.", star: { s: "Our company hired a cohort of recent bootcamp graduates who were struggling with our legacy monolithic codebase.", t: "They needed to be onboarded and productive within 4 weeks.", a: "I created a 'Lunch & Learn' series every Friday, breaking down different system modules. I also created 'good first issue' tags in our backlog specifically for them.", r: "All 3 graduates successfully merged their first production features within 2 weeks, drastically reducing the standard onboarding time." }},
    { id: 6, category: "Conflict", question: "How do you handle changing requirements from stakeholders mid-sprint?", star: { s: "Midway through a 2-week sprint, the product manager requested a massive overhaul to the UI workflow we were building.", t: "I had to manage expectations while keeping the development team from burning out.", a: "I arranged a meeting with the PM, mapped out the new requirements, and quantified the engineering hours required. I negotiated swapping out lower-priority tickets to accommodate the new request without expanding the sprint scope.", r: "The PM understood the trade-offs, the team avoided crunch time, and the new UI was successfully launched." }},
    { id: 7, category: "Failure", question: "Tell me about a project that did not meet its deadline.", star: { s: "We were building a third-party API integration that ended up having terrible documentation.", t: "We realized 3 days before launch that we misunderstood their authentication flow.", a: "I immediately flagged the risk to stakeholders, owned the oversight, and drafted a revised timeline. I then scheduled a direct call with the third-party's engineering team.", r: "We launched 1 week late, but the transparent communication maintained client trust, and I implemented a mandatory 'API Discovery' phase for all future projects." }},
    { id: 8, category: "Teamwork", question: "Describe a time you stepped outside your usual role to help the team.", star: { s: "Our QA engineer fell ill during the final week of our release cycle.", t: "We had 40 user stories that needed rigorous regression testing before deployment.", a: "Even though I am a backend engineer, I paused my low-priority technical debt tasks, read the QA test plans, and manually executed front-end cross-browser tests.", r: "We discovered two critical blockers that would have broken the checkout flow. We fixed them and launched on time." }},
    { id: 9, category: "Leadership", question: "Tell me about a time you proposed a new idea that improved the team's workflow.", star: { s: "Our code review process was taking an average of 4 days, causing massive bottlenecks.", t: "We needed a way to review code faster without sacrificing quality.", a: "I researched and integrated a static analysis tool (SonarQube) into our GitHub Actions pipeline to automatically catch syntax and styling errors, so reviewers only had to focus on business logic.", r: "Average PR review time dropped from 4 days to 1.5 days, increasing our sprint velocity by 20%." }},
    { id: 10, category: "Conflict", question: "Describe a time you received negative feedback from a manager.", star: { s: "In an early performance review, my manager told me I was too quiet in architecture meetings and wasn't sharing my ideas.", t: "I needed to become more vocal and visible to the team.", a: "I thanked them for the feedback. I started preparing notes 24 hours before every meeting so I felt confident. I made a personal goal to speak up at least once in every technical discussion.", r: "By the next quarter, I was leading architectural white-boarding sessions, and my manager specifically praised my improved communication." }}
];

// Configuration
const ITEMS_PER_PAGE = 5;

// State Management
let state = {
    allData: behavioralDatabase,
    filteredData: behavioralDatabase,
    currentPage: 1,
    searchQuery: '',
    categoryFilter: 'all'
};

// DOM Elements
const dom = {
    searchInput: document.getElementById('searchInput'),
    categoryFilters: document.getElementById('categoryFilters'),
    questionsList: document.getElementById('questionsList'),
    paginationControls: document.getElementById('paginationControls'),
    noResults: document.getElementById('noResults'),
    loadingState: document.getElementById('loadingState')
};

document.addEventListener("DOMContentLoaded", () => {
    initOptimizedApp();
});

function initOptimizedApp() {
    setupEventListeners();
    updateDataAndRender();
}

function setupEventListeners() {
    // 1. Search (Debounced slightly for performance)
    let debounceTimer;
    dom.searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            state.searchQuery = e.target.value.toLowerCase();
            state.currentPage = 1; // Reset to page 1 on search
            updateDataAndRender();
        }, 300);
    });

    // 2. Category Filters (Event Delegation)
    dom.categoryFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            // Update active styling
            dom.categoryFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update state
            state.categoryFilter = e.target.getAttribute('data-category');
            state.currentPage = 1; // Reset to page 1 on filter
            updateDataAndRender();
        }
    });

    // 3. Accordion Toggles (Event Delegation to save memory)
    dom.questionsList.addEventListener('click', (e) => {
        const header = e.target.closest('.q-header');
        if (header) {
            const card = header.parentElement;
            const isExpanded = card.classList.contains('expanded');
            
            // Optional: Close others (accordion style)
            dom.questionsList.querySelectorAll('.q-card').forEach(c => c.classList.remove('expanded'));
            
            if (!isExpanded) {
                card.classList.add('expanded');
            }
        }
    });

    // 4. Pagination Controls (Event Delegation)
    dom.paginationControls.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn || btn.disabled) return;

        const action = btn.getAttribute('data-action');
        const totalPages = Math.ceil(state.filteredData.length / ITEMS_PER_PAGE);

        if (action === 'prev' && state.currentPage > 1) {
            state.currentPage--;
        } else if (action === 'next' && state.currentPage < totalPages) {
            state.currentPage++;
        } else if (action === 'page') {
            state.currentPage = parseInt(btn.getAttribute('data-page'));
        }

        updateDataAndRender();
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll back to top of list
    });
}

/**
 * Core rendering pipeline. Filters memory, calculates chunk, updates DOM.
 */
function updateDataAndRender() {
    // 1. Filter Data
    state.filteredData = state.allData.filter(q => {
        const matchesSearch = q.question.toLowerCase().includes(state.searchQuery) || 
                              q.category.toLowerCase().includes(state.searchQuery);
        const matchesCategory = state.categoryFilter === 'all' || q.category === state.categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // 2. Handle Empty State
    if (state.filteredData.length === 0) {
        dom.questionsList.innerHTML = '';
        dom.paginationControls.innerHTML = '';
        dom.noResults.style.display = 'block';
        return;
    }
    
    dom.noResults.style.display = 'none';

    // 3. Calculate Pagination Chunk
    const startIndex = (state.currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const chunkToRender = state.filteredData.slice(startIndex, endIndex);

    // 4. Efficient DOM Hydration using Template Literals
    const htmlString = chunkToRender.map(q => `
        <div class="q-card">
            <div class="q-header" role="button" aria-expanded="false">
                <div class="q-main">
                    <span class="q-cat">${q.category}</span>
                    <h3 class="q-title">${q.question}</h3>
                </div>
                <div class="q-toggle"><i class="fas fa-chevron-down"></i></div>
            </div>
            <div class="q-body">
                <div class="star-grid">
                    <div class="star-item">
                        <span class="star-label"><i class="fas fa-map-marker-alt"></i> Situation</span>
                        <p class="star-text">${q.star.s}</p>
                    </div>
                    <div class="star-item">
                        <span class="star-label"><i class="fas fa-bullseye"></i> Task</span>
                        <p class="star-text">${q.star.t}</p>
                    </div>
                    <div class="star-item">
                        <span class="star-label"><i class="fas fa-running"></i> Action</span>
                        <p class="star-text">${q.star.a}</p>
                    </div>
                    <div class="star-item">
                        <span class="star-label"><i class="fas fa-trophy" style="color: var(--beh-primary);"></i> Result</span>
                        <p class="star-text">${q.star.r}</p>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Inject exact chunk into DOM, replacing old chunk
    dom.questionsList.innerHTML = htmlString;

    // 5. Render Pagination UI
    renderPaginationUI();
}

function renderPaginationUI() {
    const totalPages = Math.ceil(state.filteredData.length / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) {
        dom.paginationControls.innerHTML = '';
        return;
    }

    let pHtml = `<button class="page-btn" data-action="prev" ${state.currentPage === 1 ? 'disabled' : ''}><i class="fas fa-angle-left"></i></button>`;

    // Logic for page numbers (simplified for demo size, handles up to ~5 pages cleanly)
    for (let i = 1; i <= totalPages; i++) {
        pHtml += `<button class="page-btn ${state.currentPage === i ? 'active' : ''}" data-action="page" data-page="${i}">${i}</button>`;
    }

    pHtml += `<button class="page-btn" data-action="next" ${state.currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-angle-right"></i></button>`;

    dom.paginationControls.innerHTML = pHtml;
}
