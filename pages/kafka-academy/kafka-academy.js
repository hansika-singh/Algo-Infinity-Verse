// Curriculum Data
const curriculum = [
  {
    id: 'intro',
    title: 'Introduction to Kafka',
    icon: 'fa-info-circle',
    content: `
            <h3>What is Apache Kafka?</h3>
            <p>Apache Kafka is a distributed event streaming platform open-sourced by the Apache Software Foundation. It is designed to handle high volumes of data in real-time.</p>
            <h3>Core Concepts</h3>
            <ul>
                <li><strong>Event:</strong> A record of something that happened in the world or in your business.</li>
                <li><strong>Event Streaming:</strong> The practice of capturing data in real-time from event sources like databases, sensors, mobile devices, and software applications.</li>
            </ul>
        `,
  },
  {
    id: 'topics-partitions',
    title: 'Topics & Partitions',
    icon: 'fa-layer-group',
    content: `
            <h3>Topics</h3>
            <p>Events are organized and durably stored in <strong>topics</strong>. Very simplified, a topic is similar to a folder in a filesystem, and the events are the files in that folder.</p>
            <h3>Partitions</h3>
            <p>Topics are broken down into a number of <strong>partitions</strong>. When a new event is published to a topic, it is actually appended to one of the topic's partitions. Events with the same event key are written to the same partition, and Kafka guarantees that any consumer of a given topic-partition will always read that partition's events in exactly the same order as they were written.</p>
        `,
  },
  {
    id: 'producers-consumers',
    title: 'Producers & Consumers',
    icon: 'fa-exchange-alt',
    content: `
            <h3>Producers</h3>
            <p>Producers are those client applications that publish (write) events to Kafka.</p>
            <h3>Consumers</h3>
            <p>Consumers are those that subscribe to (read and process) these events. In Kafka, producers and consumers are fully decoupled and agnostic of each other, which is a key design element to achieve the high scalability that Kafka is known for.</p>
        `,
  },
];

// State
let currentLessonIndex = 0;
let completedLessons = JSON.parse(localStorage.getItem('kafka-completed')) || [];

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
                    <i class="fas ${lesson.icon} text-red-400"></i>
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
    : 'px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium shadow-sm';

  renderSidebar();
}

function updateProgress() {
  const percent = Math.round((completedLessons.length / curriculum.length) * 100);
  progressBar.style.width = percent + '%';
  progressText.textContent = percent + '%';
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
      localStorage.setItem('kafka-completed', JSON.stringify(completedLessons));
      updateProgress();
      loadLesson(currentLessonIndex);
    }
  });

  // Tab Switching
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('active', 'border-red-600', 'text-red-700');
        t.classList.add('border-transparent', 'text-gray-500');
      });
      tab.classList.remove('border-transparent', 'text-gray-500');
      tab.classList.add('active', 'border-red-600', 'text-red-700');

      tabContents.forEach((content) => content.classList.add('hidden'));
      document.getElementById(tab.dataset.tab + '-tab').classList.remove('hidden');
    });
  });

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
  });
}

init();
