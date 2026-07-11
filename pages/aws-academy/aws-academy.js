/* global checkAnswer, removeService */
// State Variables
let activeModule = 0;
let activeLesson = 0;
let userProgress = JSON.parse(localStorage.getItem('awsHubProgress')) || {
  completedLessons: [],
  completedQuizzes: [],
};

// Simulator State
let deployedServices = [];
let serviceCounter = 1;

// Curriculum Data
const curriculum = [
  {
    id: 'mod-1',
    title: 'IAM & Security Basics',
    lessons: [
      {
        id: 'm1-l1',
        title: 'Identity and Access Management',
        content: `
                    <div class="lesson-prose">
                        <h2>AWS IAM</h2>
                        <p>AWS Identity and Access Management (IAM) enables you to manage access to AWS services and resources securely.</p>
                        <h3>Core Concepts</h3>
                        <ul>
                            <li><strong>Users:</strong> End users (people or apps).</li>
                            <li><strong>Groups:</strong> A collection of users.</li>
                            <li><strong>Roles:</strong> Temporary identities that can be assumed by users or AWS services (like an EC2 instance).</li>
                            <li><strong>Policies:</strong> JSON documents that define permissions (Allow or Deny).</li>
                        </ul>
                        <p>Security in AWS is a shared responsibility. AWS manages the security <em>of</em> the cloud, while you manage security <em>in</em> the cloud.</p>
                    </div>
                `,
      },
    ],
    quiz: [
      {
        id: 'q1',
        question:
          'Which IAM entity do you attach to an EC2 instance so it can securely access an S3 bucket?',
        options: ['IAM User', 'IAM Group', 'IAM Role', 'IAM Policy directly to the instance'],
        correct: 2,
      },
    ],
  },
  {
    id: 'mod-2',
    title: 'Compute & Networking (EC2 + VPC)',
    lessons: [
      {
        id: 'm2-l1',
        title: 'Virtual Private Cloud (VPC)',
        content: `
                    <div class="lesson-prose">
                        <h2>Amazon VPC</h2>
                        <p>Amazon Virtual Private Cloud (VPC) lets you provision a logically isolated section of the AWS Cloud where you can launch AWS resources in a virtual network that you define.</p>
                        <p>It resembles a traditional network that you'd operate in your own data center, but with the scalable infrastructure of AWS.</p>
                    </div>
                `,
      },
      {
        id: 'm2-l2',
        title: 'Elastic Compute Cloud (EC2)',
        content: `
                    <div class="lesson-prose">
                        <h2>Amazon EC2</h2>
                        <p>Amazon EC2 provides scalable computing capacity in the AWS cloud. You can use EC2 to launch as many or as few virtual servers as you need, configure security and networking, and manage storage.</p>
                        <p>Go to the <strong>Architecture Simulator</strong> tab and try adding an EC2 instance to your VPC canvas. Watch how it affects your estimated monthly cost!</p>
                    </div>
                `,
      },
    ],
    quiz: [
      {
        id: 'q2',
        question: 'What is the primary function of Amazon EC2?',
        options: [
          'Database storage',
          'Virtual servers in the cloud',
          'Domain Name System (DNS)',
          'Content Delivery Network (CDN)',
        ],
        correct: 1,
      },
    ],
  },
  {
    id: 'mod-3',
    title: 'Storage & Databases (S3 + RDS)',
    lessons: [
      {
        id: 'm3-l1',
        title: 'Amazon S3',
        content: `
                    <div class="lesson-prose">
                        <h2>Simple Storage Service (S3)</h2>
                        <p>Amazon S3 is an object storage service that offers industry-leading scalability, data availability, security, and performance. You store files (objects) in containers called "Buckets".</p>
                        <p>It is excellent for storing images, videos, backups, and static website files.</p>
                    </div>
                `,
      },
      {
        id: 'm3-l2',
        title: 'Amazon RDS',
        content: `
                    <div class="lesson-prose">
                        <h2>Relational Database Service (RDS)</h2>
                        <p>Amazon RDS makes it easy to set up, operate, and scale a relational database in the cloud. It provides cost-efficient and resizable capacity while automating time-consuming administration tasks.</p>
                        <p>Head to the <strong>Architecture Simulator</strong> and build a classic 3-tier architecture: Add an EC2 instance (App) and an RDS instance (Database) to see the generated Infrastructure as Code JSON.</p>
                    </div>
                `,
      },
    ],
    quiz: [
      {
        id: 'q3',
        question: 'Which AWS service is best suited for storing millions of user-uploaded images?',
        options: ['Amazon RDS', 'Amazon EC2', 'Amazon S3', 'Amazon VPC'],
        correct: 2,
      },
    ],
  },
];

// DOM Elements
const elements = {
  sidebarContent: document.getElementById('sidebar-content'),
  lessonContent: document.getElementById('lesson-content'),
  quizContent: document.getElementById('quiz-content'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),

  // Simulator Elements
  addServiceBtns: document.querySelectorAll('.add-service-btn'),
  clearCanvasBtn: document.getElementById('clear-canvas-btn'),
  architectureCanvas: document.getElementById('architecture-canvas'),
  canvasEmptyState: document.getElementById('canvas-empty-state'),
  totalCost: document.getElementById('total-cost'),
  iacOutput: document.getElementById('iac-output'),
};

// Initialization
function init() {
  renderSidebar();
  loadLesson(activeModule, activeLesson);
  updateProgress();
  setupEventListeners();
  updateArchitectureUI(); // initial render for simulator
}

// Setup Event Listeners
function setupEventListeners() {
  elements.tabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.closest('button').dataset.tab);
    });
  });

  elements.mobileMenuBtn.addEventListener('click', toggleSidebar);
  elements.sidebarOverlay.addEventListener('click', toggleSidebar);

  // Simulator Listeners
  elements.addServiceBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const btnEl = e.target.closest('button');
      addService(btnEl.dataset.type, parseFloat(btnEl.dataset.cost), btnEl.dataset.icon);
    });
  });

  elements.clearCanvasBtn.addEventListener('click', () => {
    deployedServices = [];
    serviceCounter = 1;
    updateArchitectureUI();
  });

  elements.sidebarContent.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-module]');
    if (btn) {
      loadLesson(parseInt(btn.dataset.module), parseInt(btn.dataset.lesson));
    }
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-quiz-id]');
    if (btn) {
      checkAnswer(btn.dataset.quizId, parseInt(btn.dataset.module), parseInt(btn.dataset.option));
    }
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-service-id]');
    if (btn) {
      removeService(btn.dataset.serviceId);
    }
  });
}

function toggleSidebar() {
  const isClosed = elements.sidebar.classList.contains('-translate-x-full');
  if (isClosed) {
    elements.sidebar.classList.remove('-translate-x-full');
    elements.sidebarOverlay.classList.remove('hidden');
  } else {
    elements.sidebar.classList.add('-translate-x-full');
    elements.sidebarOverlay.classList.add('hidden');
  }
}

// Tab Management
function switchTab(tabId) {
  elements.tabBtns.forEach((btn) => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active', 'border-orange-500', 'text-orange-600');
      btn.classList.remove('text-gray-500', 'border-transparent');
    } else {
      btn.classList.remove('active', 'border-orange-500', 'text-orange-600');
      btn.classList.add('text-gray-500', 'border-transparent');
    }
  });

  elements.tabPanes.forEach((pane) => {
    if (pane.id === `${tabId}-tab`) {
      pane.classList.remove('hidden');
      if (tabId === 'simulator') {
        pane.classList.add('flex'); // Uses flex layout
      } else {
        pane.classList.add('block');
      }
    } else {
      pane.classList.add('hidden');
      pane.classList.remove('block', 'flex');
    }
  });
}

// Sidebar Rendering
function renderSidebar() {
  let html = '';
  curriculum.forEach((mod, mIndex) => {
    html += `
            <div class="sidebar-module">
                <h3 class="sidebar-module-title">${mod.title}</h3>
                <ul class="space-y-1">
        `;

    mod.lessons.forEach((lesson, lIndex) => {
      const isCompleted = userProgress.completedLessons.includes(lesson.id);
      const isActive = mIndex === activeModule && lIndex === activeLesson;

      html += `
                <li>
                    <button class="w-full text-left sidebar-lesson ${isActive ? 'active' : ''}" 
                            data-module="${mIndex}" data-lesson="${lIndex}">
                        <i class="${isCompleted ? 'fas fa-check-circle text-orange-500' : 'far fa-circle text-gray-400'} mr-2 w-4"></i>
                        ${lesson.title}
                    </button>
                </li>
            `;
    });

    html += `</ul></div>`;
  });

  elements.sidebarContent.innerHTML = html;
}

// Load specific lesson
function loadLesson(mIndex, lIndex) {
  activeModule = mIndex;
  activeLesson = lIndex;
  const lesson = curriculum[mIndex].lessons[lIndex];

  if (!userProgress.completedLessons.includes(lesson.id)) {
    markLessonComplete(lesson.id);
  }

  elements.lessonContent.innerHTML = lesson.content;

  renderQuiz(mIndex);
  renderSidebar();

  if (window.innerWidth < 768 && !elements.sidebar.classList.contains('-translate-x-full')) {
    toggleSidebar();
  }
}

// Quiz Rendering
function renderQuiz(mIndex) {
  const quiz = curriculum[mIndex].quiz;
  let html = `<h2 class="text-2xl font-bold mb-6 text-gray-800">Module Knowledge Check</h2>`;

  if (!quiz || quiz.length === 0) {
    elements.quizContent.innerHTML = html + '<p>No quiz for this module.</p>';
    return;
  }

  quiz.forEach((q, i) => {
    html += `
            <div class="mb-8 p-6 bg-orange-50 rounded-lg border border-orange-100 quiz-question" id="q-container-${q.id}">
                <p class="font-semibold text-lg text-gray-800 mb-4">${i + 1}. ${q.question}</p>
                <div class="space-y-2">
        `;

    q.options.forEach((opt, oIndex) => {
      html += `
                <label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="quiz-${q.id}" value="${oIndex}" class="mr-3 w-4 h-4 text-orange-500">
                    <span class="text-gray-700">${opt}</span>
                </label>
            `;
    });

    html += `
                </div>
                <button data-quiz-id="${q.id}" data-module="${mIndex}" data-option="${i}" class="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                    Submit Answer
                </button>
                <div id="q-feedback-${q.id}" class="mt-3 hidden text-sm font-medium"></div>
            </div>
        `;
  });

  elements.quizContent.innerHTML = html;
}

// Check Quiz Answer
window.checkAnswer = function (qId, mIndex, qIndex) {
  const selected = document.querySelector(`input[name="quiz-${qId}"]:checked`);
  const feedback = document.getElementById(`q-feedback-${qId}`);
  const container = document.getElementById(`q-container-${qId}`);

  if (!selected) {
    feedback.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Please select an answer.';
    feedback.className = 'mt-3 text-sm font-medium text-amber-600 block';
    return;
  }

  const correctAns = curriculum[mIndex].quiz[qIndex].correct;

  if (parseInt(selected.value) === correctAns) {
    feedback.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Correct! Great job.';
    feedback.className = 'mt-3 text-sm font-medium text-orange-600 block';
    container.classList.replace('bg-orange-50', 'bg-green-50');
    container.classList.replace('border-orange-100', 'border-green-200');

    if (!userProgress.completedQuizzes.includes(qId)) {
      userProgress.completedQuizzes.push(qId);
      saveProgress();
    }
  } else {
    feedback.innerHTML = '<i class="fas fa-times-circle mr-1"></i> Incorrect. Try again.';
    feedback.className = 'mt-3 text-sm font-medium text-red-600 block';
  }
};

// Progress Tracking
function markLessonComplete(lessonId) {
  if (!userProgress.completedLessons.includes(lessonId)) {
    userProgress.completedLessons.push(lessonId);
    saveProgress();
  }
}

function saveProgress() {
  localStorage.setItem('awsHubProgress', JSON.stringify(userProgress));
  updateProgress();
}

function updateProgress() {
  let totalItems = 0;
  curriculum.forEach((m) => {
    totalItems += m.lessons.length;
    if (m.quiz) totalItems += m.quiz.length;
  });

  const completedItems =
    userProgress.completedLessons.length + userProgress.completedQuizzes.length;
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  elements.progressBar.style.width = `${percentage}%`;
  elements.progressText.textContent = `${percentage}%`;
}

// ----------------------------------------------------
// Architecture Simulator Engine
// ----------------------------------------------------

function addService(type, cost, icon) {
  const id = `${type.toLowerCase()}-${serviceCounter++}`;
  deployedServices.push({ id, type, cost, icon });
  updateArchitectureUI();
}

window.removeService = function (id) {
  deployedServices = deployedServices.filter((s) => s.id !== id);
  updateArchitectureUI();
};

function updateArchitectureUI() {
  renderCanvas();
  updateEstimator();
  generateIaC();
}

function renderCanvas() {
  // Clear current non-empty state elements
  const existingNodes = elements.architectureCanvas.querySelectorAll('.service-node');
  existingNodes.forEach((n) => n.remove());

  if (deployedServices.length === 0) {
    elements.canvasEmptyState.classList.remove('hidden');
  } else {
    elements.canvasEmptyState.classList.add('hidden');

    deployedServices.forEach((service) => {
      const node = document.createElement('div');
      node.className = `service-node service-${service.type.toLowerCase()}`;
      node.innerHTML = `
                <div class="icon-container">
                    <i class="fas ${service.icon}"></i>
                </div>
                <div class="details">
                    <div class="name">${service.type} Instance</div>
                    <div class="cost">$${service.cost.toFixed(2)}/mo</div>
                </div>
                <button class="remove-btn" data-service-id="${service.id}" title="Remove Service">
                    <i class="fas fa-times"></i>
                </button>
            `;
      elements.architectureCanvas.appendChild(node);
    });
  }
}

function updateEstimator() {
  const total = deployedServices.reduce((sum, service) => sum + service.cost, 0);

  // Animate numbers for nice effect
  let startTimestamp = null;
  const duration = 500;
  const startVal = parseFloat(elements.totalCost.textContent);

  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const currentVal = startVal + (total - startVal) * progress;

    elements.totalCost.textContent = currentVal.toFixed(2);

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

function generateIaC() {
  if (deployedServices.length === 0) {
    elements.iacOutput.innerHTML =
      '<span class="text-gray-400 italic">// Add services to generate IaC...</span>';
    return;
  }

  // Mocking a Terraform/CloudFormation JSON structure
  const resources = {};

  deployedServices.forEach((srv) => {
    let resourceType = '';
    switch (srv.type) {
      case 'EC2':
        resourceType = 'AWS::EC2::Instance';
        break;
      case 'S3':
        resourceType = 'AWS::S3::Bucket';
        break;
      case 'RDS':
        resourceType = 'AWS::RDS::DBInstance';
        break;
      case 'Lambda':
        resourceType = 'AWS::Lambda::Function';
        break;
      default:
        resourceType = 'AWS::Custom::Resource';
    }

    resources[`${srv.type}Resource_${srv.id.split('-')[1]}`] = {
      Type: resourceType,
      Properties: {
        // Mock properties based on type
        ...(srv.type === 'EC2' && { InstanceType: 't3.micro', ImageId: 'ami-0abcdef1234567890' }),
        ...(srv.type === 'S3' && { AccessControl: 'Private' }),
        ...(srv.type === 'RDS' && { DBInstanceClass: 'db.t3.micro', Engine: 'mysql' }),
        ...(srv.type === 'Lambda' && { Runtime: 'nodejs18.x', Handler: 'index.handler' }),
      },
    };
  });

  const cloudFormationTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Auto-generated template from AWS Academy Simulator',
    Resources: resources,
  };

  // Syntax highlight the JSON output
  const jsonStr = JSON.stringify(cloudFormationTemplate, null, 2);
  const highlighted = jsonStr.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    function (match) {
      let cls = 'text-blue-600'; // default number/boolean
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-gray-800 font-semibold'; // Key
        } else {
          cls = 'text-green-700'; // String
        }
      }
      return '<span class="' + cls + '">' + match + '</span>';
    }
  );

  elements.iacOutput.innerHTML = highlighted;
}

// Run init on load
document.addEventListener('DOMContentLoaded', init);
