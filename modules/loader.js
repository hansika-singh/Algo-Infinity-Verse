
export function initLoader() {
  setTimeout(() => {
    const loader = document.getElementById("loading-screen");

    if (loader) {
      loader.classList.add("hidden");
    }
  }, 1000);
}

export function initLoader() {
  const loader = document.getElementById("loading-screen");
  if (loader) {
    loader.classList.add("hidden");
  }
}
// Legacy global exports
window.initLoader = initLoader;
