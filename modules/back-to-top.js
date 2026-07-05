export function initScrollEffects() {
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  const backToTopBtn = document.getElementById("backToTopBtn");
  const setVisibleState = () => {
    const shouldShow = window.scrollY > 500;
    if (scrollTopBtn) scrollTopBtn.classList.toggle("visible", shouldShow);
    if (backToTopBtn) backToTopBtn.classList.toggle("show", shouldShow);
  };
  window.addEventListener("scroll", setVisibleState);
  setVisibleState();
  if (scrollTopBtn) scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  if (backToTopBtn) backToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add("animate-in"); }); }, { threshold: 0.1 });
  document.querySelectorAll(".topic-card, .problem-card, .interview-card, .dashboard-card").forEach(el => observer.observe(el));
}
