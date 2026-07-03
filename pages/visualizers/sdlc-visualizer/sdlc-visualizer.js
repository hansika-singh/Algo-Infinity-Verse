/* ============================================================
   INTERACTIVE SDLC VISUALIZER
   sdlc-visualizer.js  |  Issue #985 — Algo Infinity Verse

   Architecture:
   ─ STAGES[]     : all content for all 7 phases
   ─ state{}      : which stage + tab + tour status
   ─ render()     : redraws pipeline + detail panel
   ─ goTo(n)      : navigate to stage n
   ─ switchTab(t) : switch tab without changing stage
   ─ tour         : auto-cycle through all stages
============================================================ */

/* ── Stage data ──────────────────────────────────────── */
const STAGES = [
  {
    id      : 'requirements',
    num     : 1,
    title   : 'Requirements',
    icon    : 'fa-clipboard-list',
    color   : '#8b5cf6',
    rgb     : '139,92,246',
    tagline : 'Define what the system must do',
    description: 'The Requirements phase is the foundation of the entire SDLC. Teams work with stakeholders to gather, document, and validate exactly what the software must accomplish — both functionally (what it does) and non-functionally (how well it performs). Poor requirements are the single biggest cause of project failure.',
    objectives: [
      'Identify and engage all key stakeholders early',
      'Define functional requirements — what the system does',
      'Define non-functional requirements — performance, security, scalability',
      'Prioritize requirements using the MoSCoW method',
      'Obtain formal sign-off from stakeholders',
      'Establish a Requirements Traceability Matrix (RTM)',
    ],
    deliverables: [
      'Software Requirements Specification (SRS)',
      'Use Case Diagrams',
      'User Stories & Acceptance Criteria',
      'Stakeholder Analysis Document',
      'Feasibility Study Report',
      'Requirements Traceability Matrix',
    ],
    practices: [
      'Involve stakeholders from day one — not just at the end for sign-off',
      'Use clear, unambiguous language — avoid vague terms like "fast" or "user-friendly"',
      'Apply MoSCoW prioritization: Must Have, Should Have, Could Have, Won\'t Have',
      'Version-control all requirement documents like you version code',
      'Validate requirements with real users through walkthroughs and reviews',
    ],
    tools: ['JIRA', 'Confluence', 'Notion', 'Miro', 'Lucidchart', 'Trello', 'Microsoft Word'],
    questions: [
      {
        q: 'What is the difference between functional and non-functional requirements?',
        a: 'Functional requirements define WHAT the system does (e.g., "user can log in with email and password"). Non-functional requirements define HOW WELL it does it — performance ("login must complete in under 2 seconds"), security, scalability, and availability. Both are equally critical.',
      },
      {
        q: 'What is the MoSCoW prioritization method?',
        a: 'MoSCoW helps prioritize requirements: Must Have (critical — project fails without these), Should Have (important but not vital for launch), Could Have (nice-to-have if time permits), Won\'t Have this time (explicitly out of scope now). It aligns the team and stakeholders on what truly matters.',
      },
      {
        q: 'What is a Software Requirements Specification (SRS)?',
        a: 'A formal document describing the intended purpose, complete scope, and detailed requirements of a software system. It serves as a contract between developers and stakeholders, covering functional specs, external interface requirements, performance requirements, and system constraints.',
      },
      {
        q: 'How do you handle conflicting requirements from different stakeholders?',
        a: 'Facilitate a requirements workshop to surface conflicts early. Use a priority matrix — rank by business value and impact. Escalate unresolved conflicts to a product owner or steering committee. Always document the final agreed-upon decision with the rationale, so no one relitigates it later.',
      },
      {
        q: 'What is requirements traceability and why does it matter?',
        a: 'The ability to link each requirement forward to design decisions, code modules, and test cases — and backward to the business need that drove it. It ensures every feature has a justification, every test covers a requirement, and no requirement is accidentally dropped during development.',
      },
    ],
  },

  {
    id      : 'planning',
    num     : 2,
    title   : 'Planning',
    icon    : 'fa-calendar-days',
    color   : '#3b82f6',
    rgb     : '59,130,246',
    tagline : 'Chart the roadmap to successful delivery',
    description: 'Planning transforms requirements into a concrete roadmap. The team estimates effort, allocates resources, identifies risks, and creates a schedule. This phase determines the project\'s methodology (Agile, Waterfall, or hybrid) and sets clear milestones, budgets, and success metrics before a single line of code is written.',
    objectives: [
      'Estimate project cost, effort, and timeline accurately',
      'Define the scope boundary — what is in and what is out',
      'Allocate human, technical, and financial resources',
      'Identify, assess, and create mitigation plans for risks',
      'Select development methodology (Agile, Waterfall, Scrum, Kanban)',
      'Define communication cadence and reporting structure',
    ],
    deliverables: [
      'Project Plan & Schedule',
      'Work Breakdown Structure (WBS)',
      'Risk Register & Mitigation Plan',
      'Resource Allocation Matrix',
      'Budget Estimates & Cost Baseline',
      'Communication & Reporting Plan',
    ],
    practices: [
      'Involve the development team in estimation — estimates made without devs are fiction',
      'Break large tasks into estimable units of 1-3 days maximum',
      'Build in contingency buffer — projects without buffer always overrun',
      'Review and update the risk register in every status meeting',
      'Use story points or t-shirt sizing in agile to capture relative effort, not hours',
    ],
    tools: ['Microsoft Project', 'Asana', 'Monday.com', 'JIRA', 'Smartsheet', 'Confluence', 'Notion'],
    questions: [
      {
        q: 'What is the difference between Agile and Waterfall methodology?',
        a: 'Waterfall is linear and sequential — each phase must complete before the next begins, making it predictable but inflexible to change. Agile is iterative, delivering working software in short sprints (1-4 weeks) with continuous stakeholder feedback. Agile handles changing requirements far better; Waterfall suits projects with fixed, well-understood scope.',
      },
      {
        q: 'What is a Work Breakdown Structure (WBS)?',
        a: 'A hierarchical decomposition of the entire project scope into smaller, manageable deliverables and work packages. Each level breaks work into progressively smaller pieces. The WBS is the foundation for scheduling, resource assignment, cost estimation, and risk identification.',
      },
      {
        q: 'How do you estimate software development effort?',
        a: 'Common techniques: Story Points (relative complexity sizing in agile), Function Point Analysis (based on inputs, outputs, files), Three-Point Estimation (optimistic + 4×most-likely + pessimistic ÷ 6), and reference-class forecasting (using historical data from similar past projects). No single technique is perfect — combine them.',
      },
      {
        q: 'What is critical path analysis?',
        a: 'Identifies the longest chain of dependent tasks that determines the minimum possible project duration. Any delay on the critical path delays the entire project. Tasks off the critical path have "float" — they can slip without affecting the end date. Focus management attention on critical path tasks.',
      },
      {
        q: 'How do you manage scope creep effectively?',
        a: 'Establish a formal change control process before the project starts. Document all requirements upfront with stakeholder sign-off. For every change request, assess its impact on scope, timeline, and budget — then get formal approval before incorporating it. Never let changes slip in informally through conversations.',
      },
    ],
  },

  {
    id      : 'design',
    num     : 3,
    title   : 'Design',
    icon    : 'fa-drafting-compass',
    color   : '#06b6d4',
    rgb     : '6,182,212',
    tagline : 'Blueprint the system before building',
    description: 'Design translates requirements into a technical blueprint. High-Level Design (HLD) covers system architecture, component interactions, and technology stack decisions. Low-Level Design (LLD) covers detailed class diagrams, database schemas, API contracts, and algorithm specifics. Investing in good design prevents exponentially more expensive rework later.',
    objectives: [
      'Define overall system architecture — monolith, microservices, or serverless',
      'Design database schema and entity relationships',
      'Create UI/UX wireframes, mockups, and interactive prototypes',
      'Define API contracts and endpoint specifications',
      'Select technology stack, frameworks, and third-party services',
      'Establish security architecture and data protection strategy',
    ],
    deliverables: [
      'High-Level Design (HLD) Document',
      'Low-Level Design (LLD) Document',
      'Database Entity-Relationship Diagrams',
      'UI/UX Wireframes & Clickable Prototypes',
      'API Documentation (Swagger/OpenAPI)',
      'Architecture Decision Records (ADRs)',
    ],
    practices: [
      'Apply SOLID principles from the very first design decision',
      'Use proven design patterns — don\'t solve solved problems from scratch',
      'Create low-fidelity wireframes first, then iterate to high-fidelity prototypes',
      'Involve developers in design reviews — they catch implementation landmines early',
      'Document every significant architectural decision and its trade-offs in an ADR',
    ],
    tools: ['Figma', 'Adobe XD', 'draw.io', 'Lucidchart', 'MySQL Workbench', 'Swagger UI', 'Sketch'],
    questions: [
      {
        q: 'What is the difference between High-Level Design (HLD) and Low-Level Design (LLD)?',
        a: 'HLD describes the overall system architecture: components, data flow, technology choices, deployment topology, and how major modules interact. LLD dives into implementation details: class diagrams, method signatures, database schema DDL, and algorithm pseudocode. HLD answers "what", LLD answers "how".',
      },
      {
        q: 'Explain the SOLID principles.',
        a: 'S: Single Responsibility — one class, one reason to change. O: Open/Closed — open for extension, closed for modification. L: Liskov Substitution — subtypes must be substitutable for their base types. I: Interface Segregation — clients shouldn\'t depend on interfaces they don\'t use. D: Dependency Inversion — depend on abstractions, not concretions.',
      },
      {
        q: 'What are design patterns? Name and classify the common ones.',
        a: 'Reusable solutions to recurring design problems. Creational (how objects are created): Singleton, Factory Method, Abstract Factory, Builder, Prototype. Structural (how objects are composed): Adapter, Decorator, Proxy, Composite, Facade. Behavioral (how objects communicate): Observer, Strategy, Command, Template Method, Iterator.',
      },
      {
        q: 'Monolith vs Microservices — when should you choose each?',
        a: 'Start monolith: simpler to develop, test, and deploy — ideal for small teams and early-stage products where requirements are still evolving. Move to microservices when you have: independent scalability needs, multiple teams on distinct domains, or deployment frequency mismatches. Microservices add significant operational complexity — only take that on when the benefits justify it.',
      },
      {
        q: 'How do you design a RESTful API?',
        a: 'Use nouns for resources (not verbs): /users, /orders. Use HTTP methods: GET (read), POST (create), PUT/PATCH (update), DELETE (remove). Return appropriate status codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Server Error. Be stateless, version your API (/api/v1/), use JSON, and document with OpenAPI/Swagger.',
      },
    ],
  },

  {
    id      : 'development',
    num     : 4,
    title   : 'Development',
    icon    : 'fa-code',
    color   : '#22c55e',
    rgb     : '34,197,94',
    tagline : 'Transform designs into working software',
    description: 'Development is where the code gets written. Developers implement features based on design documents, following agreed coding standards and version control workflows. This phase uses iterative sprints, mandatory code reviews, and continuous integration pipelines to maintain quality as the codebase grows and complexity increases.',
    objectives: [
      'Implement features exactly per approved design specifications',
      'Write clean, self-documenting, maintainable code',
      'Conduct peer code reviews for every change before merging',
      'Write unit and integration tests alongside production code',
      'Integrate all components continuously using CI pipelines',
      'Maintain a clean, meaningful version control history',
    ],
    deliverables: [
      'Working, Tested Source Code',
      'Unit Tests & Integration Tests',
      'Code Review Approvals',
      'Build Artifacts (JAR, Docker images, bundles)',
      'API Implementation',
      'Technical Documentation & Code Comments',
    ],
    practices: [
      'Follow the Boy Scout Rule: always leave code cleaner than you found it',
      'Keep commits small, atomic, and with meaningful messages (what + why)',
      'Never push directly to main/master — use feature branches and pull requests',
      'Write tests first (TDD) or at minimum alongside the code, never after',
      'Review code for logic correctness, security vulnerabilities, and readability',
    ],
    tools: ['VS Code', 'IntelliJ IDEA', 'Git', 'GitHub / GitLab', 'Docker', 'Postman', 'SonarQube'],
    questions: [
      {
        q: 'What is Test-Driven Development (TDD) and what are its benefits?',
        a: 'Red-Green-Refactor cycle: write a failing test → write minimal code to make it pass → refactor for quality. Benefits: forces you to think about the API before implementation, produces naturally testable code, creates a safety net for refactoring, and results in near-100% test coverage organically.',
      },
      {
        q: 'What is CI/CD and why is it important?',
        a: 'CI (Continuous Integration): developers merge to main frequently, automated builds and tests run on every commit to catch integration issues immediately. CD (Continuous Delivery/Deployment): every passing build is automatically deployed to staging (Delivery) or production (Deployment). Together they eliminate "integration hell", reduce deployment risk, and enable faster, safer releases.',
      },
      {
        q: 'Explain Git branching strategies — GitFlow vs Trunk-Based Development.',
        a: 'GitFlow uses long-lived branches (feature, develop, release, hotfix, main) — good for versioned product releases with defined release cycles. Trunk-Based Development keeps all developers committing to main/trunk frequently with short-lived branches (< 1 day), using feature flags to hide incomplete work. TBD is better for high-frequency CI/CD.',
      },
      {
        q: 'What is technical debt? How do you manage it?',
        a: 'The implied cost of choosing a quick, expedient solution now instead of the better approach that takes longer. It accrues "interest" — the longer you wait, the harder it gets to fix. Manage it: make debt visible by tracking it in the backlog, prioritize high-interest debt (things you change often), and allocate 15-20% of every sprint to debt reduction.',
      },
      {
        q: 'What are SOLID principles and why do they matter in development?',
        a: 'SOLID principles guide you toward writing code that is easy to maintain, extend, and test. In practice: Single Responsibility keeps classes focused and easy to understand. Open/Closed lets you add features without modifying existing code. Dependency Inversion makes code testable by depending on interfaces, not concrete implementations. Applying them consistently prevents the spaghetti code that makes every change dangerous.',
      },
    ],
  },

  {
    id      : 'testing',
    num     : 5,
    title   : 'Testing',
    icon    : 'fa-bug',
    color   : '#f59e0b',
    rgb     : '245,158,11',
    tagline : 'Validate quality before your users find bugs',
    description: 'Testing systematically verifies that software meets requirements and is free of critical defects. It spans multiple levels — from unit tests written by developers to end-to-end acceptance tests by QA engineers and performance tests under load. The earlier a bug is found, the cheaper it is to fix: a bug found in production costs 100× more than one caught in development.',
    objectives: [
      'Verify all functional requirements are correctly implemented',
      'Identify, document, and track defects systematically',
      'Execute non-functional testing: performance, security, and usability',
      'Run regression tests after every bug fix and new feature',
      'Validate the software meets user acceptance criteria (UAT)',
      'Measure and achieve target test coverage thresholds',
    ],
    deliverables: [
      'Test Plan',
      'Test Cases & Automated Test Scripts',
      'Bug / Defect Reports',
      'Test Summary Report',
      'Performance & Load Test Results',
      'UAT Sign-off Document',
    ],
    practices: [
      'Shift left — test as early as possible, not just at the end of development',
      'Follow the testing pyramid: many unit tests, fewer integration, very few E2E',
      'Automate regression tests to run on every code change in the CI pipeline',
      'Write test cases from the user\'s perspective, based on requirements',
      'Track defect density by module to identify problem areas in the codebase',
    ],
    tools: ['Jest', 'JUnit', 'Selenium', 'Cypress', 'JMeter', 'Postman', 'TestRail', 'SonarQube'],
    questions: [
      {
        q: 'What is the testing pyramid?',
        a: 'A guide for the right proportion of test types. Base (many): Unit Tests — fast, cheap, test one function in isolation. Middle (some): Integration Tests — test interaction between modules. Top (few): E2E Tests — slow, expensive, simulate a real user through the full stack. The anti-pattern is the "ice cream cone" — mostly manual and E2E tests, which are slow and brittle.',
      },
      {
        q: 'What is the difference between regression testing and retesting?',
        a: 'Retesting: re-executing a specific failed test case after the reported bug is fixed, to confirm the fix works. Regression testing: running the broader test suite after any change to ensure the fix didn\'t accidentally break existing functionality elsewhere. Retesting is narrow and focused; regression testing is wide.',
      },
      {
        q: 'What is boundary value analysis?',
        a: 'A black-box technique that tests at the edges of input ranges, where bugs most commonly lurk (off-by-one errors). For a field accepting values 1-100: test 0, 1, 2 (just below, at, and just above the lower boundary) and 99, 100, 101 (just below, at, and just above the upper boundary). Always paired with Equivalence Partitioning.',
      },
      {
        q: 'Difference between black-box and white-box testing?',
        a: 'Black-box testing: tester has no knowledge of internal code implementation. Tests are based on inputs, expected outputs, and requirements. Examples: functional testing, UAT, system testing. White-box testing: tester knows the code. Designs tests to exercise specific code paths, branches, and conditions. Examples: unit testing, code coverage analysis, path testing.',
      },
      {
        q: 'How do you prioritize bug fixes when you have a long defect list?',
        a: 'Use a Severity × Priority matrix. Severity is technical impact: Critical (system crash/data loss), Major (feature unusable), Minor (workaround exists), Trivial (cosmetic). Priority is business urgency: how many users are blocked, SLA breach risk, and revenue impact. P1 Critical = fix today. P2 Major = fix this sprint. P3 Minor = next sprint. P4 Trivial = backlog.',
      },
    ],
  },

  {
    id      : 'deployment',
    num     : 6,
    title   : 'Deployment',
    icon    : 'fa-rocket',
    color   : '#f43f5e',
    rgb     : '244,63,94',
    tagline : 'Release to the world safely and reliably',
    description: 'Deployment moves tested, approved software from a staging environment to production, making it available to real users. Modern deployment practices prioritize zero-downtime releases, fully automated pipelines, and instant rollback capabilities. A botched production deployment can erase all the value created in previous phases.',
    objectives: [
      'Execute the deployment plan with zero or minimal downtime',
      'Configure production environment, infrastructure, and networking',
      'Set up monitoring, structured logging, and alerting',
      'Validate deployment success with automated smoke tests',
      'Communicate the release to all relevant stakeholders',
      'Confirm rollback procedure is tested, documented, and ready to execute',
    ],
    deliverables: [
      'Deployment Plan & Pre-Deployment Checklist',
      'Release Notes',
      'Infrastructure Configuration (as code)',
      'Monitoring Dashboard & Alert Rules',
      'Rollback Procedure Document',
      'Post-Deployment Smoke Test Results',
    ],
    practices: [
      'Automate every deployment step — manual deployment steps introduce human error',
      'Always test your rollback procedure before deploying to production',
      'Deploy during low-traffic windows to limit blast radius of any issues',
      'Use feature flags to decouple deployment from feature release',
      'Monitor error rates, latency, and business metrics for 24-48h after every deployment',
    ],
    tools: ['Jenkins', 'GitHub Actions', 'GitLab CI', 'Docker', 'Kubernetes', 'Terraform', 'AWS / Azure / GCP'],
    questions: [
      {
        q: 'What is blue-green deployment?',
        a: 'Maintain two identical production environments: Blue (current live version) and Green (new version). Deploy to Green, run automated smoke tests. If they pass, switch all traffic to Green instantly. If issues arise post-switch, route traffic back to Blue in seconds. Achieves zero-downtime deployment with instant rollback, at the cost of double infrastructure.',
      },
      {
        q: 'What is a canary deployment?',
        a: 'Gradually roll out the new version to a small percentage of users (the "canary in the coal mine") — say 5% — before expanding to 100%. Monitor error rates and latency for the canary group. If metrics stay healthy, incrementally increase traffic to 25%, 50%, 100%. If issues appear, roll back only the canary. Reduces blast radius of bad releases.',
      },
      {
        q: 'Explain Docker and why it matters for deployment.',
        a: 'Docker packages an application along with all its dependencies (runtime, libraries, config) into a container — a lightweight, portable, self-sufficient unit. It eliminates "works on my machine" issues because the container runs identically in dev, staging, and production. Images are versioned and immutable, making rollback trivial.',
      },
      {
        q: 'What is Infrastructure as Code (IaC)?',
        a: 'Managing and provisioning infrastructure through declarative or imperative code (Terraform, AWS CloudFormation, Ansible, Pulumi) instead of manual console clicks. Benefits: infrastructure is version-controlled and peer-reviewed, environments are reproducible, changes are auditable, and configuration drift between environments is eliminated.',
      },
      {
        q: 'What should you monitor immediately after a production deployment?',
        a: 'Error rate (any spike above baseline = red flag), P95/P99 latency (slowdowns hurt users), throughput (requests per second — unexpected drop = traffic issue), CPU and memory usage, database query times, and business metrics (transactions, conversions, signups). Set automated alerts with thresholds so you know before your users do.',
      },
    ],
  },

  {
    id      : 'maintenance',
    num     : 7,
    title   : 'Maintenance',
    icon    : 'fa-gears',
    color   : '#ec4899',
    rgb     : '236,72,153',
    tagline : 'Keep software healthy, secure, and evolving',
    description: 'Maintenance is typically the longest and most expensive SDLC phase — it can account for 60-80% of total software lifetime cost. It covers post-release bug fixes, performance optimizations, security patches, and new feature additions. Effective maintenance requires strong monitoring, comprehensive documentation, and a mature change management process.',
    objectives: [
      'Identify and resolve post-release defects rapidly (within SLA)',
      'Monitor system health, performance, and availability continuously',
      'Apply security patches and dependency updates promptly',
      'Optimize performance and efficiency based on real production usage data',
      'Collect, analyze, and incorporate user feedback into the product',
      'Plan and prioritize future enhancements in a roadmap',
    ],
    deliverables: [
      'Patch Releases & Hotfixes',
      'Performance & Availability Reports',
      'Updated Technical Documentation',
      'Security Audit Reports',
      'User Feedback Analysis',
      'Product Enhancement Roadmap',
    ],
    practices: [
      'Set up automated monitoring and alerting — know about problems before your users report them',
      'Maintain a comprehensive, timestamped CHANGELOG for every release',
      'Schedule regular dependency audits and automate security vulnerability scanning',
      'Conduct quarterly security reviews and annual penetration tests',
      'Build a systematic feedback loop: collect → analyze → prioritize → implement → measure',
    ],
    tools: ['Datadog', 'New Relic', 'Sentry', 'PagerDuty', 'Grafana', 'Prometheus', 'JIRA'],
    questions: [
      {
        q: 'What are the 4 types of software maintenance?',
        a: 'Corrective: finding and fixing bugs discovered after release. Adaptive: modifying software to work in a changed environment (new OS version, new browser API, new regulations). Perfective: improving performance or adding features users want. Preventive: refactoring and restructuring to prevent future failures — paying down technical debt before it accrues interest.',
      },
      {
        q: 'What is an SLA (Service Level Agreement) and what are typical metrics?',
        a: 'A formal contract between service provider and customer defining the expected service level. Key metrics: Availability (99.9% = max 8.7 hours downtime/year; 99.99% = 52 minutes/year), Response Time (API returns in < 200ms), MTTR (Mean Time To Recovery — average time to restore service after an incident). Breaching SLAs typically incurs financial penalties.',
      },
      {
        q: 'How do you prioritize maintenance bug reports?',
        a: 'Combine Severity (technical impact: data loss, crash, functional failure, cosmetic) with Business Priority (how many users affected, revenue impact, SLA breach risk). P1 Critical: system down or data at risk — drop everything, fix now. P2 Major: key feature broken, no workaround — fix this week. P3 Minor: workaround exists — next release. P4 Low: cosmetic — schedule in backlog.',
      },
      {
        q: 'What is MTTR and how do you reduce it?',
        a: 'Mean Time To Recovery — the average time to restore service after an incident. Reduce it by: automated monitoring with smart alerts (detect faster), clear runbooks with step-by-step recovery procedures (diagnose and fix faster), on-call rotations with defined escalation paths (respond faster), post-mortems after every incident to eliminate root causes (prevent recurrence).',
      },
      {
        q: 'How do you approach a legacy codebase with no tests and poor documentation?',
        a: 'Start with characterization tests: write tests that document the current behavior (even if wrong) before touching anything. Identify the highest-risk areas using change frequency (git log) and bug density. Apply the Strangler Fig pattern: gradually replace legacy components with new implementations while keeping the system running. Never do a "big-bang" rewrite — they almost always fail.',
      },
    ],
  },
];

/* ── Tabs definition ─────────────────────────────────── */
const TABS = [
  { key:'overview',     label:'Overview',       icon:'fa-circle-info'   },
  { key:'objectives',   label:'Objectives',     icon:'fa-bullseye'      },
  { key:'deliverables', label:'Deliverables',   icon:'fa-boxes-stacked' },
  { key:'practices',    label:'Best Practices', icon:'fa-star'          },
  { key:'tools',        label:'Tools',          icon:'fa-wrench'        },
  { key:'questions',    label:'Interview Q',    icon:'fa-comments'      },
];

/* ── App state ───────────────────────────────────────── */
const state = {
  active  : 0,         // current stage index
  tab     : 'overview',// current tab key
  visited : new Set([0]),
  tourId  : null,      // setInterval id when touring
  tourMs  : 3000,      // step delay in tour mode
};

/* ── DOM refs ────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const DOM = {
  pipeline     : $('pipeline'),
  detailHeader : $('detailHeader'),
  detailIcon   : $('detailIcon'),
  phaseBadge   : $('phaseBadge'),
  stageTitle   : $('stageTitle'),
  stageTagline : $('stageTagline'),
  tabBar       : $('tabBar'),
  tabContent   : $('tabContent'),
  navBar       : null, // accessed via prev/next
  prevBtn      : $('prevBtn'),
  nextBtn      : $('nextBtn'),
  miniDots     : $('miniDots'),
  globalDots   : $('globalDots'),
  globalLabel  : $('globalLabel'),
  tourBtn      : $('tourBtn'),
  tourIcon     : $('tourIcon'),
  tourLabel    : $('tourLabel'),
  tourSpeed    : $('tourSpeed'),
};

/* ============================================================
   PIPELINE RENDER
============================================================ */
function renderPipeline() {
  DOM.pipeline.innerHTML = '';

  STAGES.forEach((stage, i) => {
    /* ── Stage node ── */
    const node = document.createElement('div');
    node.className = `sdlc-node${i === state.active ? ' active' : ''}`;
    node.dataset.i  = i;
    node.style.setProperty('--node-clr', stage.color);
    node.style.setProperty('--node-rgb', stage.rgb);
    node.setAttribute('role', 'button');
    node.setAttribute('aria-label', `Go to ${stage.title}`);
    node.tabIndex = 0;

    node.innerHTML = `
      <div class="sdlc-node-left">
        <div class="sdlc-node-ring">
          <div class="sdlc-node-icon">
            <i class="fas ${stage.icon}"></i>
          </div>
        </div>
      </div>
      <div class="sdlc-node-body">
        <span class="sdlc-node-num">Phase 0${stage.num}</span>
        <h3  class="sdlc-node-title">${stage.title}</h3>
        <p   class="sdlc-node-tagline">${stage.tagline}</p>
      </div>
    `;

    node.addEventListener('click', () => goTo(i));
    node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') goTo(i); });
    DOM.pipeline.appendChild(node);

    /* ── Connector between nodes ── */
    if (i < STAGES.length - 1) {
      const next    = STAGES[i + 1];
      const spacer  = document.createElement('div');
      spacer.className = 'sdlc-node-spacer';
      spacer.innerHTML = `
        <div class="sdlc-spacer-line-col">
          <div class="sdlc-connector${i === state.active ? ' lit' : ''}"
               style="--node-clr:${stage.color};--next-clr:${next.color}">
            <div class="sdlc-flow-dot"></div>
          </div>
        </div>
        <div style="flex:1"></div>
      `;
      DOM.pipeline.appendChild(spacer);
    }
  });
}

/* ============================================================
   GLOBAL PROGRESS DOTS
============================================================ */
function renderGlobalDots() {
  DOM.globalDots.innerHTML = '';
  STAGES.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = `sdlc-gp-dot${i === state.active ? ' active' : ''}${state.visited.has(i) && i !== state.active ? ' visited' : ''}`;
    d.style.setProperty('--stage-clr', s.color);
    d.style.setProperty('--stage-rgb', s.rgb);
    d.title = s.title;
    d.addEventListener('click', () => goTo(i));
    DOM.globalDots.appendChild(d);
  });
  DOM.globalLabel.textContent = `Phase ${state.active + 1} of ${STAGES.length}`;
}

/* ============================================================
   MINI DOTS (inside nav bar)
============================================================ */
function renderMiniDots() {
  DOM.miniDots.innerHTML = '';
  STAGES.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = `sdlc-mini-dot${i === state.active ? ' active' : ''}`;
    d.style.setProperty('--stage-clr', s.color);
    d.style.setProperty('--stage-rgb', s.rgb);
    d.addEventListener('click', () => goTo(i));
    DOM.miniDots.appendChild(d);
  });
}

/* ============================================================
   DETAIL PANEL — HEADER
============================================================ */
function renderHeader() {
  const s = STAGES[state.active];

  /* Inject CSS variable on :root so all child elements pick it up */
  document.documentElement.style.setProperty('--stage-clr', s.color);
  document.documentElement.style.setProperty('--stage-rgb', s.rgb);

  DOM.detailIcon.innerHTML  = `<i class="fas ${s.icon}"></i>`;
  DOM.detailIcon.style.background = s.color;
  DOM.detailIcon.style.boxShadow  = `0 8px 28px rgba(${s.rgb},.45)`;

  DOM.phaseBadge.textContent  = `Phase ${s.num} of ${STAGES.length}`;
  DOM.stageTitle.textContent  = s.title;
  DOM.stageTagline.textContent = s.tagline;

  DOM.prevBtn.disabled = state.active === 0;
  DOM.nextBtn.disabled = state.active === STAGES.length - 1;
  DOM.nextBtn.style.color       = s.color;
  DOM.nextBtn.style.borderColor = `rgba(${s.rgb},.4)`;
}

/* ============================================================
   DETAIL PANEL — TAB CONTENT
============================================================ */

/* Render based on active tab key */
function renderTabContent() {
  const s   = STAGES[state.active];
  let html  = '';

  switch (state.tab) {
    case 'overview':
      html = renderOverview(s); break;
    case 'objectives':
      html = renderList(s.objectives, s, 'numbered'); break;
    case 'deliverables':
      html = renderDeliverables(s); break;
    case 'practices':
      html = renderList(s.practices, s, 'star'); break;
    case 'tools':
      html = renderTools(s); break;
    case 'questions':
      html = renderQuestions(s); break;
    default:
      html = renderOverview(s);
  }

  /* Animate out → update → animate in */
  DOM.tabContent.classList.remove('sdlc-fade-in');
  DOM.tabContent.classList.add('sdlc-fade-out');

  setTimeout(() => {
    DOM.tabContent.innerHTML = html;
    DOM.tabContent.classList.remove('sdlc-fade-out');
    DOM.tabContent.classList.add('sdlc-fade-in');

    /* Attach accordion listeners for Q tab */
    if (state.tab === 'questions') {
      DOM.tabContent.querySelectorAll('.sdlc-q-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const item   = btn.closest('.sdlc-q-item');
          const isOpen = item.classList.contains('sdlc-open');
          DOM.tabContent.querySelectorAll('.sdlc-q-item.sdlc-open')
            .forEach(el => el.classList.remove('sdlc-open'));
          if (!isOpen) item.classList.add('sdlc-open');
        });
      });
    }
  }, 220);
}

/* ── Overview ───────────────────────────────────────── */
function renderOverview(s) {
  return `
    <p class="sdlc-desc">${s.description}</p>
    <div class="sdlc-quick-stats">
      <div class="sdlc-stat-card">
        <span class="sdlc-stat-num">${s.objectives.length}</span>
        <span class="sdlc-stat-label">Key Objectives</span>
      </div>
      <div class="sdlc-stat-card">
        <span class="sdlc-stat-num">${s.deliverables.length}</span>
        <span class="sdlc-stat-label">Deliverables</span>
      </div>
      <div class="sdlc-stat-card">
        <span class="sdlc-stat-num">${s.tools.length}</span>
        <span class="sdlc-stat-label">Tools Used</span>
      </div>
    </div>
  `;
}

/* ── Generic numbered or star list ──────────────────── */
function renderList(items, s, style) {
  const listItems = items.map((item, i) => {
    const badge = style === 'star'
      ? `<span class="sdlc-star-icon" style="background:${s.color}22;color:${s.color}"><i class="fas fa-star"></i></span>`
      : `<span class="sdlc-list-num" style="background:${s.color}22;color:${s.color}">${i + 1}</span>`;

    return `
      <li class="sdlc-list-item">
        ${badge}
        <span>${item}</span>
      </li>
    `;
  }).join('');

  return `<ul class="sdlc-list">${listItems}</ul>`;
}

/* ── Deliverables grid ──────────────────────────────── */
function renderDeliverables(s) {
  const cards = s.deliverables.map(d => `
    <div class="sdlc-del-card" style="border-color:rgba(${s.rgb},.22)">
      <i class="fas fa-file-lines" style="color:${s.color}"></i>
      <span>${d}</span>
    </div>
  `).join('');

  return `<div class="sdlc-del-grid">${cards}</div>`;
}

/* ── Tools chips ────────────────────────────────────── */
function renderTools(s) {
  const chips = s.tools.map(t => `
    <div class="sdlc-tool-chip"
         style="background:rgba(${s.rgb},.12);
                border-color:rgba(${s.rgb},.35);
                color:${s.color}">
      <i class="fas fa-wrench"></i> ${t}
    </div>
  `).join('');

  return `<div class="sdlc-tools-wrap">${chips}</div>`;
}

/* ── Interview questions accordion ──────────────────── */
function renderQuestions(s) {
  const items = s.questions.map((item, i) => `
    <div class="sdlc-q-item">
      <button class="sdlc-q-btn">
        <span class="sdlc-q-num"
              style="background:rgba(${s.rgb},.18);color:${s.color}">
          ${i + 1}
        </span>
        <span class="sdlc-q-text">${item.q}</span>
        <i class="fas fa-chevron-down sdlc-q-chevron"></i>
      </button>
      <div class="sdlc-q-answer">
        <p>${item.a}</p>
      </div>
    </div>
  `).join('');

  return `<div class="sdlc-questions">${items}</div>`;
}

/* ============================================================
   NAVIGATION — goTo
============================================================ */
function goTo(index) {
  if (index < 0 || index >= STAGES.length) return;
  state.active = index;
  state.visited.add(index);

  renderPipeline();
  renderGlobalDots();
  renderMiniDots();
  renderHeader();
  renderTabContent();

  /* Scroll pipeline node into view on mobile (horizontal) */
  const activeNode = DOM.pipeline.querySelector('.sdlc-node.active');
  if (activeNode) {
    activeNode.scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' });
  }
}

/* ============================================================
   TAB SWITCHING
============================================================ */
function switchTab(key) {
  state.tab = key;

  DOM.tabBar.querySelectorAll('.sdlc-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === key);
  });

  renderTabContent();
}

/* ============================================================
   AUTO TOUR
============================================================ */
function startTour() {
  if (state.tourId) return;

  DOM.tourBtn.classList.add('touring');
  DOM.tourIcon.className  = 'fas fa-stop';
  DOM.tourLabel.textContent = 'Stop Tour';

  /* If at last stage, restart from beginning */
  if (state.active === STAGES.length - 1) goTo(0);

  state.tourId = setInterval(() => {
    const next = state.active + 1;
    if (next >= STAGES.length) {
      stopTour();
      return;
    }
    goTo(next);
  }, state.tourMs);
}

function stopTour() {
  clearInterval(state.tourId);
  state.tourId = null;

  DOM.tourBtn.classList.remove('touring');
  DOM.tourIcon.className   = 'fas fa-play';
  DOM.tourLabel.textContent = 'Auto Tour';
}

/* ============================================================
   EVENT LISTENERS
============================================================ */
/* Tab bar clicks */
DOM.tabBar.querySelectorAll('.sdlc-tab').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* Prev / Next */
DOM.prevBtn.addEventListener('click', () => { stopTour(); goTo(state.active - 1); });
DOM.nextBtn.addEventListener('click', () => { stopTour(); goTo(state.active + 1); });

/* Tour button */
DOM.tourBtn.addEventListener('click', () => {
  state.tourId ? stopTour() : startTour();
});

/* Tour speed slider */
DOM.tourSpeed.addEventListener('input', () => {
  state.tourMs = +DOM.tourSpeed.value;
  if (state.tourId) {
    stopTour();
    startTour();
  }
});

/* Keyboard nav: arrow keys */
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return; // don't hijack slider
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { stopTour(); goTo(state.active + 1); }
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { stopTour(); goTo(state.active - 1); }
  if (e.key === 'Escape')                               { stopTour(); }
});

/* ============================================================
   INIT
============================================================ */
(function init() {
  goTo(0);
})();