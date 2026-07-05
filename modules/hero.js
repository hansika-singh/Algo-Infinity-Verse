export function initHeroSection() {
  const typingElement = document.getElementById("typingText");
  if (!typingElement) return;
  const dsaTopics = window.dsaTopics || [];
  const texts = dsaTopics.length > 0 ? dsaTopics.map(t => t.name) : ["Arrays", "Linked Lists", "Trees", "Graphs", "Dynamic Programming", "System Design"];
  let textIndex = 0, charIndex = 0, isDeleting = false;

  function typeEffect() {
    const currentText = texts[textIndex];
    if (isDeleting) { typingElement.textContent = currentText.substring(0, charIndex - 1); charIndex--; }
    else { typingElement.textContent = currentText.substring(0, charIndex + 1); charIndex++; }
    let typeSpeed = isDeleting ? 50 : 100;
    if (!isDeleting && charIndex === currentText.length) { typeSpeed = 2000; isDeleting = true; }
    else if (isDeleting && charIndex === 0) { isDeleting = false; textIndex = (textIndex + 1) % texts.length; typeSpeed = 500; }
    setTimeout(typeEffect, typeSpeed);
  }
  typeEffect();

  const statNumbers = document.querySelectorAll(".stat-number");
  const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { animateValue(entry.target); observer.unobserve(entry.target); } }); }, { threshold: 0.5 });
  statNumbers.forEach(stat => observer.observe(stat));
}

function animateValue(element) {
  const target = parseInt(element.getAttribute("data-target"));
  const duration = 2000;
  const increment = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => { current += increment; if (current >= target) { current = target; clearInterval(timer); } element.textContent = Math.ceil(current).toLocaleString(); }, 16);
}
