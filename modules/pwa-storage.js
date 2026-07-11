export function initPwaStorageUsage() {
  const el = document.getElementById('pwa-storage-usage');
  if (!el) return;

  function getTotalBytes() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      total += (key.length + (value ? value.length : 0)) * 2;
    }
    return total;
  }

  function update() {
    try {
      const bytes = getTotalBytes();
      const kb = (bytes / 1024).toFixed(1);
      el.textContent = `Storage: ${kb} KB`;
      el.style.display = '';
    } catch {
      el.style.display = 'none';
    }
  }

  update();
  setInterval(update, 1500);
}
