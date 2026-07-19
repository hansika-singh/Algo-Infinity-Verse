// Curriculum Data
const curriculum = [
  {
    id: 'intro',
    title: 'Introduction to Docker',
    icon: 'fa-docker',
    content: `
            <h3>What is Docker?</h3>
            <p>Docker is an open platform for developing, shipping, and running applications. Docker enables you to separate your applications from your infrastructure so you can deliver software quickly.</p>
            <h3>Containers vs VMs</h3>
            <ul>
                <li><strong>Containers:</strong> Shared OS kernel, lightweight, starts in milliseconds.</li>
                <li><strong>Virtual Machines:</strong> Full Guest OS per VM, resource-heavy, slower boot time.</li>
            </ul>
        `,
  },
  {
    id: 'images',
    title: 'Images & Containers',
    icon: 'fa-box-open',
    content: `
            <h3>Docker Images</h3>
            <p>An image is a read-only template with instructions for creating a Docker container. Often, an image is based on another image, with some additional customization.</p>
            <h3>Docker Containers</h3>
            <p>A container is a runnable instance of an image. You can create, start, stop, move, or delete a container using the Docker API or CLI.</p>
        `,
  },
  {
    id: 'k8s-intro',
    title: 'Kubernetes (K8s) Intro',
    icon: 'fa-dharmachakra',
    content: `
            <h3>What is Kubernetes?</h3>
            <p>Kubernetes is a portable, extensible, open-source platform for managing containerized workloads and services, that facilitates both declarative configuration and automation.</p>
            <h3>Core Concepts</h3>
            <p>Pods, Nodes, Clusters, Deployments, and Services are the fundamental building blocks of a Kubernetes environment.</p>
        `,
  },
];

// Quiz Data
const quiz = [
  {
    id: 'q1',
    question: 'What is the main advantage containers have over virtual machines?',
    options: [
      'They run a full guest OS for stronger isolation',
      'They share the host OS kernel, making them lightweight and fast to start',
      'They require a hypervisor to run',
      'They are always larger than VM images',
    ],
    correct: 1,
  },
  {
    id: 'q2',
    question: 'What is a Docker image?',
    options: [
      'A running instance of a container',
      'A live snapshot of a running process',
      'A read-only template with instructions for creating a container',
      'A Kubernetes configuration file',
    ],
    correct: 2,
  },
  {
    id: 'q3',
    question: 'How does a Docker container relate to a Docker image?',
    options: [
      'A container is a runnable instance of an image',
      'An image is a runnable instance of a container',
      'They are unrelated concepts',
      'An image can only be created after a container exists',
    ],
    correct: 0,
  },
  {
    id: 'q4',
    question: 'What does Kubernetes primarily manage?',
    options: [
      'Individual Docker image builds',
      'Containerized workloads and services across a cluster',
      'Virtual machine hypervisors',
      'Source code version control',
    ],
    correct: 1,
  },
  {
    id: 'q5',
    question: 'Which of the following is a core Kubernetes building block?',
    options: ['Dockerfile', 'Pod', 'Registry', 'Volume Mount'],
    correct: 1,
  },
  {
    id: 'q6',
    question: 'Which Docker CLI command lists currently running containers?',
    options: ['docker ps', 'docker ls', 'docker containers', 'docker show'],
    correct: 0,
  },
];

// State
let currentLessonIndex = 0;
let completedLessons = JSON.parse(localStorage.getItem('docker-k8s-completed')) || [];
let completedQuizzes = JSON.parse(localStorage.getItem('docker-k8s-quiz-completed')) || [];

// DOM Elements
const sidebarContent = document.getElementById('sidebar-content');
const lessonTitle = document.getElementById('lesson-title');
const lessonBody = document.getElementById('lesson-body');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const markCompleteBtn = document.getElementById('mark-complete-btn');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');
const quizContainer = document.getElementById('quiz-container');

// Initialization
function init() {
  renderSidebar();
  loadLesson(0);
  renderQuiz();
  updateProgress();
  setupEventListeners();
}

function renderSidebar() {
  sidebarContent.innerHTML = '';
  curriculum.forEach((lesson, index) => {
    const isCompleted = completedLessons.includes(lesson.id);
    const el = document.createElement('div');
    el.className = 'sidebar-item cursor-pointer mb-2';
    el.innerHTML = `
            <div class="sidebar-item-content flex items-center justify-between p-3 rounded-lg text-gray-700 bg-gray-50 border border-gray-100 ${index === currentLessonIndex ? 'active' : ''}">
                <div class="flex items-center gap-3">
                    <i class="${lesson.icon.startsWith('fa-') && lesson.icon !== 'fa-docker' ? 'fas' : 'fab'} ${lesson.icon} text-blue-400"></i>
                    <span class="text-sm">${lesson.title}</span>
                </div>
                ${isCompleted ? '<i class="fas fa-check-circle completed-check"></i>' : ''}
            </div>
        `;
    el.addEventListener('click', () => loadLesson(index));
    sidebarContent.appendChild(el);
  });
}

function loadLesson(index) {
  currentLessonIndex = index;
  const lesson = curriculum[index];

  lessonTitle.textContent = lesson.title;
  lessonBody.innerHTML = (window.eli5Toggle ? window.eli5Toggle.wrapContent(lesson.content, '') : lesson.content);
  if (window.eli5Toggle) {
    window.eli5Toggle.initToggle('docker-k8s', lessonBody);
  }

  prevBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
  nextBtn.style.visibility = index === curriculum.length - 1 ? 'hidden' : 'visible';

  const isCompleted = completedLessons.includes(lesson.id);
  markCompleteBtn.innerHTML = isCompleted
    ? 'Completed <i class="fas fa-check-double ml-2"></i>'
    : 'Mark as Read <i class="fas fa-check ml-2"></i>';
  markCompleteBtn.className = isCompleted
    ? 'px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium shadow-sm'
    : 'px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium shadow-sm';

  renderSidebar();
}

function updateProgress() {
  const totalItems = curriculum.length + quiz.length;
  const completedItems = completedLessons.length + completedQuizzes.length;
  const percent = Math.round((completedItems / totalItems) * 100);
  progressBar.style.width = percent + '%';
  progressText.textContent = percent + '%';
}

// Quiz Rendering
function renderQuiz() {
  let html = '';

  quiz.forEach((q, i) => {
    const isCompleted = completedQuizzes.includes(q.id);
    html += `
            <div class="p-6 rounded-lg border quiz-question ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-100'}" id="q-container-${q.id}">
                <p class="font-semibold text-lg text-gray-800 mb-4">${i + 1}. ${q.question}</p>
                <div class="space-y-2">
        `;

    q.options.forEach((opt, oIndex) => {
      html += `
                <label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="quiz-${q.id}" value="${oIndex}" class="mr-3 w-4 h-4 text-blue-600">
                    <span class="text-gray-700">${opt}</span>
                </label>
            `;
    });

    html += `
                </div>
                <button data-quiz-id="${q.id}" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                    Submit Answer
                </button>
                <div id="q-feedback-${q.id}" class="mt-3 hidden text-sm font-medium"></div>
            </div>
        `;
  });

  quizContainer.innerHTML = html;
}

// Check Quiz Answer
function checkAnswer(qId) {
  const q = quiz.find((item) => item.id === qId);
  const selected = document.querySelector(`input[name="quiz-${qId}"]:checked`);
  const feedback = document.getElementById(`q-feedback-${qId}`);
  const container = document.getElementById(`q-container-${qId}`);

  if (!selected) {
    feedback.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Please select an answer.';
    feedback.className = 'mt-3 text-sm font-medium text-amber-600 block';
    return;
  }

  if (parseInt(selected.value) === q.correct) {
    feedback.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Correct! Great job.';
    feedback.className = 'mt-3 text-sm font-medium text-green-600 block';
    container.classList.remove('bg-blue-50', 'border-blue-100');
    container.classList.add('bg-green-50', 'border-green-200');

    if (!completedQuizzes.includes(qId)) {
      completedQuizzes.push(qId);
      localStorage.setItem('docker-k8s-quiz-completed', JSON.stringify(completedQuizzes));
      updateProgress();
    }
  } else {
    feedback.innerHTML = '<i class="fas fa-times-circle mr-1"></i> Incorrect. Try again.';
    feedback.className = 'mt-3 text-sm font-medium text-red-600 block';
  }
}

function handleTerminalCommand(cmd) {
  const outputLine = document.createElement('div');
  const inputEcho = document.createElement('div');
  inputEcho.innerHTML = `<span class="text-blue-400">$</span> ${cmd}`;
  terminalOutput.appendChild(inputEcho);

  let response = '';
  const args = cmd
    .trim()
    .split(' ')
    .filter((c) => c !== '');

  if (args.length === 0) return;

  const base = args[0];
  if (base === 'help') {
    response = 'Available commands: docker, kubectl, clear, help';
  } else if (base === 'clear') {
    terminalOutput.innerHTML = '';
    return;
  } else if (base === 'docker') {
    if (args[1] === 'ps')
      response = 'CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES';
    else if (args[1] === 'run')
      response = 'Unable to find image locally... Pulling from library...';
    else response = 'Usage: docker [OPTIONS] COMMAND\n\nA self-sufficient runtime for containers.';
  } else if (base === 'kubectl') {
    if (args[1] === 'get' && args[2] === 'pods')
      response = 'No resources found in default namespace.';
    else response = 'kubectl controls the Kubernetes cluster manager.';
  } else {
    response = `bash: ${base}: command not found`;
  }

  if (response) {
    outputLine.className = 'text-gray-300 whitespace-pre-wrap';
    outputLine.textContent = response;
    terminalOutput.appendChild(outputLine);
  }

  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function setupEventListeners() {
  prevBtn.addEventListener('click', () => {
    if (currentLessonIndex > 0) loadLesson(currentLessonIndex - 1);
  });

  nextBtn.addEventListener('click', () => {
    if (currentLessonIndex < curriculum.length - 1) loadLesson(currentLessonIndex + 1);
  });

  markCompleteBtn.addEventListener('click', () => {
    const lessonId = curriculum[currentLessonIndex].id;
    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId);
      localStorage.setItem('docker-k8s-completed', JSON.stringify(completedLessons));
      updateProgress();
      loadLesson(currentLessonIndex);
    }
  });

  // Tab Switching
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('active', 'border-blue-600', 'text-blue-700');
        t.classList.add('border-transparent', 'text-gray-500');
      });
      tab.classList.remove('border-transparent', 'text-gray-500');
      tab.classList.add('active', 'border-blue-600', 'text-blue-700');

      tabContents.forEach((content) => content.classList.add('hidden'));
      document.getElementById(tab.dataset.tab + '-tab').classList.remove('hidden');

      if (tab.dataset.tab === 'simulator') {
        terminalInput.focus();
      }
    });
  });

  // Terminal input handling
  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleTerminalCommand(terminalInput.value);
      terminalInput.value = '';
    }
  });

  // Quiz answer submission
  quizContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-quiz-id]');
    if (btn) {
      checkAnswer(btn.dataset.quizId);
    }
  });

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
  });
}

init();
