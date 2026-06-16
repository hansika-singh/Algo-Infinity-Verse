document.addEventListener('DOMContentLoaded', () => {
  // ── Navigation & Active State Tracking ──
  const sections = document.querySelectorAll('.dc-lesson');
  const navLinks = document.querySelectorAll('.dc-sidebar-nav a');

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60% 0px', // Trigger when section is in top 40%
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Remove active class from all
        navLinks.forEach((link) => link.classList.remove('active'));
        
        // Add active class to corresponding nav link
        const targetId = entry.target.getAttribute('id');
        const activeLink = document.querySelector(`.dc-sidebar-nav a[href="#${targetId}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
        }
        
        // Update Progress Bar
        updateProgress(targetId);
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));

  // ── Progress Bar Calculation ──
  function updateProgress(activeId) {
    const total = sections.length;
    let currentIndex = 0;
    
    sections.forEach((section, index) => {
      if (section.id === activeId) {
        currentIndex = index + 1;
      }
    });

    const percent = Math.round((currentIndex / total) * 100);
    const progressFill = document.getElementById('dc-progress-fill');
    const progressText = document.getElementById('dc-progress-text');

    if (progressFill && progressText) {
      progressFill.style.width = `${percent}%`;
      progressText.textContent = `${percent}% Completed`;
    }
    
    // Save progress to local storage with guard
    try {
      localStorage.setItem('divideAndConquerProgress', percent);
    } catch (e) {
      console.warn('localStorage is not available', e);
    }
  }

  // Restore progress on load if previously saved
  try {
    const savedProgress = localStorage.getItem('divideAndConquerProgress');
    if (savedProgress) {
      const progressFill = document.getElementById('dc-progress-fill');
      const progressText = document.getElementById('dc-progress-text');
      if (progressFill && progressText) {
        progressFill.style.width = `${savedProgress}%`;
        progressText.textContent = `${savedProgress}% Completed`;
      }
    }
  } catch(e) {
    console.warn('localStorage is not available', e);
  }

  // ── Code Block Copy Functionality ──
  const copyButtons = document.querySelectorAll('.dc-code-copy');
  
  copyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const codeBlock = document.getElementById(targetId);
      
      if (codeBlock) {
        // Get raw text without any HTML tags
        const textToCopy = codeBlock.innerText;
        
        navigator.clipboard.writeText(textToCopy).then(() => {
          // Visual feedback
          const originalText = button.innerHTML;
          button.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
          button.classList.add('copied');
          
          setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy text: ', err);
        });
      }
    });
  });

  // ── Solution Toggle Functionality ──
  const toggleButtons = document.querySelectorAll('.dc-exercise-toggle');
  
  toggleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const solutionBlock = document.getElementById(targetId);
      
      if (solutionBlock) {
        const isVisible = solutionBlock.classList.contains('visible');
        
        if (isVisible) {
          solutionBlock.classList.remove('visible');
          button.innerHTML = '<i class="fa-solid fa-eye"></i> View Solution';
        } else {
          solutionBlock.classList.add('visible');
          button.innerHTML = '<i class="fa-solid fa-eye-slash"></i> Hide Solution';
        }
      }
    });
  });

  // ── Smooth Scrolling for Sidebar Links ──
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection) {
        // Adjust scroll position for fixed navbar
        const navbarHeight = document.querySelector('.navbar') ? document.querySelector('.navbar').offsetHeight : 80;
        const targetPosition = targetSection.getBoundingClientRect().top + window.scrollY - navbarHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
});
