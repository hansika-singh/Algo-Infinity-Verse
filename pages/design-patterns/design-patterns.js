const patterns = [
  {
    id: 'singleton',
    name: 'Singleton',
    category: 'creational',
    icon: 'fa-cube',
    desc: 'Ensures a class has only one instance and provides a global point of access to it.',
  },
  {
    id: 'factory',
    name: 'Factory Method',
    category: 'creational',
    icon: 'fa-industry',
    desc: 'Creates objects without specifying the exact class to create.',
  },
  {
    id: 'builder',
    name: 'Builder',
    category: 'creational',
    icon: 'fa-hammer',
    desc: 'Constructs complex objects step by step.',
  },
  {
    id: 'adapter',
    name: 'Adapter',
    category: 'structural',
    icon: 'fa-plug',
    desc: 'Allows classes with incompatible interfaces to work together.',
  },
  {
    id: 'decorator',
    name: 'Decorator',
    category: 'structural',
    icon: 'fa-layer-group',
    desc: 'Adds new functionality to an existing object without altering its structure.',
  },
  {
    id: 'facade',
    name: 'Facade',
    category: 'structural',
    icon: 'fa-building',
    desc: 'Provides a simplified interface to a library, a framework, or any other complex set of classes.',
  },
  {
    id: 'observer',
    name: 'Observer',
    category: 'behavioral',
    icon: 'fa-eye',
    desc: 'Lets you define a subscription mechanism to notify multiple objects about any events that happen to the object they’re observing.',
  },
  {
    id: 'strategy',
    name: 'Strategy',
    category: 'behavioral',
    icon: 'fa-chess-knight',
    desc: 'Lets you define a family of algorithms, put each of them into a separate class, and make their objects interchangeable.',
  },
  {
    id: 'command',
    name: 'Command',
    category: 'behavioral',
    icon: 'fa-terminal',
    desc: 'Turns a request into a stand-alone object that contains all information about the request.',
  },
];

const grid = document.getElementById('patterns-grid');
const filterBtns = document.querySelectorAll('.filter-btn');
const themeToggle = document.getElementById('theme-toggle');

function renderPatterns(filter = 'all') {
  grid.innerHTML = '';
  const filtered = filter === 'all' ? patterns : patterns.filter((p) => p.category === filter);

  filtered.forEach((pattern) => {
    const categoryColor = {
      creational: 'text-blue-500 bg-blue-100 dark:bg-blue-900',
      structural: 'text-green-500 bg-green-100 dark:bg-green-900',
      behavioral: 'text-purple-500 bg-purple-100 dark:bg-purple-900',
    }[pattern.category];

    const card = document.createElement('div');
    card.className = 'pattern-card';
    card.innerHTML = `
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center ${categoryColor}">
                    <i class="fas ${pattern.icon} text-xl"></i>
                </div>
                <h3 class="font-bold text-xl">${pattern.name}</h3>
            </div>
            <span class="inline-block px-2 py-1 text-xs font-semibold rounded mb-3 w-max capitalize ${categoryColor}">${pattern.category}</span>
            <p class="text-sm opacity-80 flex-1">${pattern.desc}</p>
            <a href="/pages/design-patterns/${pattern.id}.html" class="mt-4 text-indigo-500 font-medium hover:text-indigo-700 text-left transition-colors flex items-center gap-1 group">
                Learn more <i class="fas fa-arrow-right text-xs transform group-hover:translate-x-1 transition-transform"></i>
            </a>
        `;
    grid.appendChild(card);
  });
}

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    renderPatterns(btn.dataset.category);
  });
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Init
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
  themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}
renderPatterns();
