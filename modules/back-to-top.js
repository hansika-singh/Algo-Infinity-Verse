export function initScrollEffects() {
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  const setVisibleState = () => {
    const shouldShow = window.scrollY > 500;
    if (scrollTopBtn) scrollTopBtn.classList.toggle("visible", shouldShow);
  };
  window.addEventListener("scroll", setVisibleState);
  setVisibleState();
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => {
      scrollTopBtn.style.pointerEvents = "none";
      window.scrollTo({ top: 0, behavior: "smooth" });
      const onScrollEnd = () => {
        if (window.scrollY === 0 || window.scrollY < 10) {
          scrollTopBtn.style.pointerEvents = "";
          window.removeEventListener("scroll", onScrollEnd);
        }
      };
      window.addEventListener("scroll", onScrollEnd, { passive: true });
    });
  }
  const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add("animate-in"); }); }, { threshold: 0.1 });
  document.querySelectorAll(".topic-card, .problem-card, .interview-card, .dashboard-card").forEach(el => observer.observe(el));
}
// Legacy global exports
window.initScrollEffects = initScrollEffects;
