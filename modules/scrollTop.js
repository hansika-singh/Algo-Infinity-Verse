export function initScrollTop() {
  const scrollTopBtn = document.getElementById("scrollTopBtn");

  if (!scrollTopBtn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      scrollTopBtn.classList.add("visible");
    } else {
      scrollTopBtn.classList.remove("visible");
    }
  });

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

// Legacy global exports
window.initScrollTop = initScrollTop;
