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

// State
let currentLessonIndex = 0;
let completedLessons = JSON.parse(localStorage.getItem('docker-k8s-completed')) || [];

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

// Initialization
function init() {
  renderSidebar();
  loadLesson(0);
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
  lessonBody.innerHTML = lesson.content;

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
  const percent = Math.round((completedLessons.length / curriculum.length) * 100);
  progressBar.style.width = percent + '%';
  progressText.textContent = percent + '%';
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

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
  });
}

init();
