export function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
          
          if (registration.waiting) {
            showUpdateToast(registration.waiting);
          }
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateToast(newWorker);
              }
            });
          });
        })
        .catch((error) => {
          console.log('ServiceWorker registration failed: ', error);
        });
        
      navigator.serviceWorker.addEventListener('message', async (event) => {
        if (event.data && event.data.type === 'PROCESS_OFFLINE_QUEUE') {
          if (window.offlineStore && typeof window.offlineStore.syncQueue === 'function') {
            console.log('[App] Processing offline action queue...');
            await window.offlineStore.syncQueue();
          }
        }
      });
      
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(estimate => {
          const usageMB = (estimate.usage / (1024 * 1024)).toFixed(2);
          const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2);
          const storageEl = document.getElementById('pwa-storage-usage');
          if (storageEl) {
            storageEl.textContent = `Offline Storage: ${usageMB} MB / ${quotaMB} MB`;
          }
        });
      }
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }

  window.addEventListener('load', () => {
    function updateOnlineStatus() {
      const banner = document.getElementById('offline-banner');
      if (banner) {
        if (navigator.onLine) {
          banner.classList.add('hidden');
        } else {
          banner.classList.remove('hidden');
        }
      }
    }
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    if (window.syncProblemNotesDown) {
      window.syncProblemNotesDown();
    }
    if (window.syncSpacedRepetitionDown) {
      window.syncSpacedRepetitionDown();
    }
  });
}

function showUpdateToast(worker) {
  let toast = document.getElementById('pwa-update-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'pwa-update-toast';
    toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: rgba(16, 23, 42, 0.95); border: 1px solid var(--primary); padding: 1rem; border-radius: 8px; color: white; z-index: 10000; display: flex; gap: 1rem; align-items: center; box-shadow: 0 5px 15px rgba(0,0,0,0.5); backdrop-filter: blur(10px);';
    
    const text = document.createElement('span');
    text.textContent = 'A new version is available!';
    
    const btn = document.createElement('button');
    btn.textContent = 'Refresh';
    btn.style.cssText = 'background: var(--primary); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: 600;';
    btn.onclick = () => {
      worker.postMessage({ type: 'SKIP_WAITING' });
    };
    
    toast.appendChild(text);
    toast.appendChild(btn);
    document.body.appendChild(toast);
  }
}

window.rateRecallDifficulty = async function(quality) {
  const currentProblem = window.currentProblem;
  const userProgress = window.userProgress || {};
  if (!currentProblem) return;
  const problemId = currentProblem.id;

  if (!userProgress.spacedRepetition) userProgress.spacedRepetition = {};
  const existing = userProgress.spacedRepetition[problemId] || { repetitions: 0, easeFactor: 2.5, interval: 0 };

  try {
    const res = await fetch(`/api/spaced-repetition/${problemId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ existing, quality })
    });
    const data = await res.json();
    if (data.success && data.card) {
      userProgress.spacedRepetition[problemId] = data.card;
      if (quality >= 3) {
        userProgress.reviewStreak = (userProgress.reviewStreak || 0) + 1;
      }
      if (typeof saveUserData === 'function') saveUserData();
      if (typeof showNotification === 'function') showNotification(`Scheduled! Next review in ${data.card.interval} days 📅`, "success");
    } else {
      if (typeof showNotification === 'function') showNotification("Could not schedule on cloud. Saved locally.", "info");
    }
  } catch (err) {
    console.warn("Spaced repetition sync failed:", err);
    const q = Math.max(0, Math.min(5, Number(quality)));
    let { repetitions = 0, easeFactor = 2.5, interval = 0 } = existing;
    if (q < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      repetitions += 1;
      if (repetitions === 1) interval = 1;
      else if (repetitions === 2) interval = 6;
      else interval = Math.round(interval * easeFactor);
      userProgress.reviewStreak = (userProgress.reviewStreak || 0) + 1;
    }
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    userProgress.spacedRepetition[problemId] = {
      problemId,
      repetitions,
      easeFactor: Math.round(easeFactor * 100) / 100,
      interval,
      lastReviewed: new Date().toISOString(),
      nextReviewDate: nextReviewDate.toISOString(),
      lastQuality: q
    };
    if (typeof saveUserData === 'function') saveUserData();
    if (typeof showNotification === 'function') showNotification(`Next review in ${interval} days 📅`, "success");
  }

  const submittedId = currentProblem.id;
  if (typeof closeQuizEditor === 'function') closeQuizEditor();
  if (typeof clearEditorDraft === 'function') clearEditorDraft(submittedId);
  if (typeof refreshReviewQueue === 'function') refreshReviewQueue();
};

window.syncSpacedRepetitionDown = async function() {
  const userProgress = window.userProgress || {};
  if (location.protocol === "file:") return;
  if (!window.algoAuth || !window.algoAuth.authenticated) return;
  try {
    const res = await fetch("/api/spaced-repetition", { credentials: "include" });
    if (res.status === 200) {
      const data = await res.json();
      if (data.success && data.cards) {
        userProgress.spacedRepetition = { ...(userProgress.spacedRepetition || {}), ...data.cards };
        if (typeof saveUserData === "function") saveUserData();
        else localStorage.setItem("algoInfinityVerse", JSON.stringify(userProgress));
      }
    }
  } catch (err) {
    console.warn("Could not sync spaced repetition down:", err);
  }
};
// Legacy global exports
window.initServiceWorker = initServiceWorker;
