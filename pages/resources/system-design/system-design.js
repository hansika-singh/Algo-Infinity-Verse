function initHeroSection() {
  // Typing animation
  const typingElement = document.getElementById("typingText_systemDes");
  const texts = [
    "Scalability",
    "Load Balancing",
    "Caching Strategies",
    "Database Design",
    "Microservices",
    "Distributed Systems",
  ];

  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    if (typingElement) {
      typingElement.textContent = texts[0];
    }
    return;
  }

  function typeEffect() {
    const currentText = texts[textIndex];

    if (isDeleting) {
      typingElement.textContent = currentText.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typingElement.textContent = currentText.substring(0, charIndex + 1);
      charIndex++;
    }

    let typeSpeed = isDeleting ? 50 : 100;

    if (!isDeleting && charIndex === currentText.length) {
      typeSpeed = 2000;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
      typeSpeed = 500;
    }

    requestAnimationFrame(() => {
      setTimeout(typeEffect, typeSpeed);
    });
  }

  if (typingElement) {
    typeEffect();
  }

  // Animate stats
  const statNumbers = document.querySelectorAll(".stat-number");

  const observerOptions = {
    threshold: 0.5,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateValue(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    observerOptions
  );

  statNumbers.forEach((stat) => observer.observe(stat));

  window.addEventListener(
    "beforeunload",
    () => observer.disconnect(),
    { once: true }
  );
}