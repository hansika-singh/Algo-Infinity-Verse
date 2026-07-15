// ============================================
// XP REWARD STORE — Purchase & Inventory Logic
// ============================================

const STORE_ITEMS = {
  streakFreeze: {
    key: 'streakFreeze',
    name: 'Streak Freeze',
    price: 500,
    type: 'consumable',
    inventoryKey: 'streakFreezes',
    maxOwnable: 99,
    onPurchase(userProgress) {
      userProgress.inventory.streakFreezes =
        (userProgress.inventory.streakFreezes || 0) + 1;
      // Also update the legacy freezes counter so the streak system sees it
      userProgress.freezes = (userProgress.freezes || 0) + 1;
    },
  },
  hintTokens: {
    key: 'hintTokens',
    name: 'Hint Token',
    price: 200,
    type: 'consumable',
    inventoryKey: 'hintTokens',
    maxOwnable: 99,
    onPurchase(userProgress) {
      userProgress.inventory.hintTokens =
        (userProgress.inventory.hintTokens || 0) + 1;
    },
  },
  avatarPacks: {
    key: 'avatarPacks',
    name: 'Avatar Pack',
    price: 1000,
    type: 'cosmetic',
    inventoryKey: 'avatarPacks',
    maxOwnable: 1,
    onPurchase(userProgress) {
      userProgress.inventory.avatarPacks =
        userProgress.inventory.avatarPacks || [];
      if (!userProgress.inventory.avatarPacks.includes('premium')) {
        userProgress.inventory.avatarPacks.push('premium');
      }
    },
  },
  xpBoosters: {
    key: 'xpBoosters',
    name: 'XP Booster',
    price: 2000,
    type: 'booster',
    inventoryKey: 'xpBoosters',
    maxOwnable: 10,
    onPurchase(userProgress) {
      userProgress.inventory.xpBoosters =
        (userProgress.inventory.xpBoosters || 0) + 1;
    },
  },
  exclusiveBadge: {
    key: 'exclusiveBadge',
    name: 'Exclusive Badge',
    price: 5000,
    type: 'cosmetic',
    inventoryKey: 'exclusiveBadge',
    maxOwnable: 1,
    onPurchase(userProgress) {
      userProgress.inventory.exclusiveBadge = true;
      // Add badge to badges array if not already present
      if (!Array.isArray(userProgress.badges)) userProgress.badges = [];
      const badgeId = 9; // unique badge ID
      if (!userProgress.badges.includes(badgeId)) {
        userProgress.badges.push(badgeId);
      }
    },
  },
};

/**
 * Returns the store item definition for a given item key.
 */
function getStoreItem(itemKey) {
  return STORE_ITEMS[itemKey] || null;
}

/**
 * Returns the count of owned items for a given store item.
 */
function getOwnedCount(userProgress, itemKey) {
  const item = STORE_ITEMS[itemKey];
  if (!item) return 0;

  if (item.type === 'cosmetic' && item.inventoryKey === 'exclusiveBadge') {
    return userProgress.inventory?.exclusiveBadge ? 1 : 0;
  }
  if (item.inventoryKey === 'avatarPacks') {
    const packs = userProgress.inventory?.avatarPacks || [];
    return packs.includes('premium') ? 1 : 0;
  }
  return userProgress.inventory?.[item.inventoryKey] || 0;
}

/**
 * Attempts to purchase a store item.
 * Returns { success: boolean, message: string, item?: object }
 */
function purchaseItem(userProgress, itemKey) {
  const item = STORE_ITEMS[itemKey];
  if (!item) {
    return { success: false, message: 'Unknown item.' };
  }

  // Validate userProgress and inventory exist
  if (!userProgress) {
    return { success: false, message: 'User data not available.' };
  }
  if (!userProgress.inventory) {
    userProgress.inventory = {
      streakFreezes: 0,
      hintTokens: 0,
      xpBoosters: 0,
      exclusiveBadge: false,
      avatarPacks: [],
    };
  }

  // Check if already at max
  const owned = getOwnedCount(userProgress, itemKey);
  if (owned >= item.maxOwnable) {
    return {
      success: false,
      message: `You already own the maximum number of ${item.name}(s).`,
    };
  }

  // Check XP balance
  const currentXP = userProgress.xp || 0;
  if (currentXP < item.price) {
    const shortfall = item.price - currentXP;
    return {
      success: false,
      message: `Not enough XP! You need ${shortfall.toLocaleString()} more XP for a ${item.name}.`,
    };
  }

  // Deduct XP and grant item
  userProgress.xp = currentXP - item.price;
  item.onPurchase(userProgress);

  // Save state
  if (typeof saveUserData === 'function') {
    saveUserData();
  } else {
    localStorage.setItem('algoInfinityVerse', JSON.stringify(userProgress));
  }

  // Refresh UI
  if (typeof updateXPBar === 'function') updateXPBar();
  if (typeof updateGamification === 'function') updateGamification();
  if (typeof updateProfile === 'function') updateProfile();
  if (typeof updateDashboard === 'function') updateDashboard();
  if (typeof renderStoreUI === 'function') renderStoreUI();
  if (typeof renderInventoryDisplay === 'function') renderInventoryDisplay();

  // Also do a synchronous save as backup (async saveUserData may not complete before refresh)
  try {
    localStorage.setItem('algoInfinityVerse', JSON.stringify(userProgress));
  } catch (e) { void 0; }

  return {
    success: true,
    message: `Purchased ${item.name}!`,
    item,
  };
}

/**
 * Check if an XP Booster is active. Returns remaining problems or 0.
 */
function getActiveBoosterCount(userProgress) {
  if (!userProgress.inventory?.xpBoostersTimer) return 0;
  const timer = userProgress.inventory.xpBoostersTimer;
  if (timer.problemsRemaining <= 0) return 0;
  return timer.problemsRemaining;
}

/**
 * Activates an XP Booster (called when user wants to use it).
 * Returns true if activation succeeded.
 */
function activateXPBooster(userProgress) {
  if (!userProgress.inventory) return false;
  const boosters = userProgress.inventory.xpBoosters || 0;
  if (boosters <= 0) return false;

  userProgress.inventory.xpBoosters = boosters - 1;
  userProgress.inventory.xpBoostersTimer = {
    problemsRemaining: 3,
    activatedAt: new Date().toISOString(),
  };

  if (typeof saveUserData === 'function') saveUserData();
  return true;
}

/**
 * Consumes one booster charge. Call this when a problem is solved with booster active.
 */
function consumeBoosterCharge(userProgress) {
  const timer = userProgress.inventory?.xpBoostersTimer;
  if (!timer || timer.problemsRemaining <= 0) return false;

  timer.problemsRemaining -= 1;
  if (timer.problemsRemaining <= 0) {
    delete userProgress.inventory.xpBoostersTimer;
    if (typeof showNotification === 'function') {
      showNotification('XP Booster expired!', 'info');
    }
  }

  if (typeof saveUserData === 'function') saveUserData();
  return true;
}

/**
 * Calculates the boosted XP amount.
 */
function applyBooster(userProgress, baseXP) {
  const timer = userProgress.inventory?.xpBoostersTimer;
  if (timer && timer.problemsRemaining > 0) {
    return baseXP * 2;
  }
  return baseXP;
}

/**
 * Uses one hint token from inventory.
 * Returns true if a token was available and consumed.
 */
function useHintToken(userProgress) {
  if (!userProgress.inventory) return false;
  const tokens = userProgress.inventory.hintTokens || 0;
  if (tokens <= 0) return false;

  userProgress.inventory.hintTokens = tokens - 1;
  if (typeof saveUserData === 'function') saveUserData();
  return true;
}

/**
 * Returns how many hint tokens the user has.
 */
function getHintTokenCount(userProgress) {
  return userProgress.inventory?.hintTokens || 0;
}

/**
 * Returns how many XP boosters the user has in inventory.
 */
function getXPBoosterCount(userProgress) {
  return userProgress.inventory?.xpBoosters || 0;
}

/**
 * Gets the count of each item for rendering the store UI.
 */
function getStoreInventory(userProgress) {
  if (!userProgress.inventory) {
    userProgress.inventory = {
      streakFreezes: 0,
      hintTokens: 0,
      xpBoosters: 0,
      exclusiveBadge: false,
      avatarPacks: [],
    };
  }
  return {
    streakFreezes: userProgress.inventory.streakFreezes || 0,
    hintTokens: userProgress.inventory.hintTokens || 0,
    xpBoosters: userProgress.inventory.xpBoosters || 0,
    exclusiveBadge: userProgress.inventory.exclusiveBadge || false,
    avatarPacks: (userProgress.inventory.avatarPacks || []).includes('premium'),
    activeBooster: getActiveBoosterCount(userProgress),
  };
}

// ============================================
// UI: Open / Close / Render Store Modal
// ============================================

let storeInitialized = false;

function initStoreModal() {
  if (storeInitialized) return;
  storeInitialized = true;

  // Bind events for the initial (non-lazy) path
  bindStoreEvents();

  // Wire up the navbar XP Store button (if present in DOM)
  wireNavButton();

  // Load store data each time the modal opens
  document.addEventListener('xpStoreOpening', () => {
    renderStoreUI();
  });
}

function wireNavButton() {
  const navBtn = document.getElementById('xpStoreNavBtn');
  if (!navBtn) {
    // Navbar might not be loaded yet; retry once after a short delay
    setTimeout(() => {
      const retryBtn = document.getElementById('xpStoreNavBtn');
      if (retryBtn && !retryBtn._storeWired) {
        retryBtn._storeWired = true;
        retryBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openStoreModal();
        });
      }
    }, 500);
    return;
  }
  if (navBtn._storeWired) return;
  navBtn._storeWired = true;
  navBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openStoreModal();
  });
}

function openStoreModal() {
  const existingModal = document.getElementById('xpStoreModal');
  if (existingModal) {
    existingModal.classList.add('active');
    document.dispatchEvent(new Event('xpStoreOpening'));
    initStoreModal();
    return;
  }

  // Lazy-load the modal partial if not already in the DOM
  const placeholder = document.getElementById('xp-store-placeholder');
  if (placeholder && placeholder.innerHTML.trim() === '') {
    if (typeof loadPartial === 'function') {
      loadPartial('xp-store-placeholder', '/partials/xp-store-modal.html').then(() => {
        bindStoreEvents();
        const modal = document.getElementById('xpStoreModal');
        if (modal) {
          modal.classList.add('active');
          document.dispatchEvent(new Event('xpStoreOpening'));
          renderStoreUI();
        }
      }).catch(() => {
        fetchStoreModalAndOpen();
      });
      return;
    }
  }

  fetchStoreModalAndOpen();
}

function fetchStoreModalAndOpen() {
  fetch('/partials/xp-store-modal.html')
    .then(r => r.text())
    .then(html => {
      const div = document.createElement('div');
      div.innerHTML = html;
      const modal = div.querySelector('#xpStoreModal');
      if (modal) {
        document.body.appendChild(modal);
        bindStoreEvents();
        modal.classList.add('active');
        document.dispatchEvent(new Event('xpStoreOpening'));
        renderStoreUI();
      }
    })
    .catch(err => {
      console.warn('Failed to load XP Store modal:', err);
      if (typeof showNotification === 'function') {
        showNotification('Could not load the XP Store. Please try again.', 'error');
      }
    });
}

function bindStoreEvents() {
  const closeBtn = document.getElementById('xpStoreClose');
  const modal = document.getElementById('xpStoreModal');
  const body = document.getElementById('xpStoreBody');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeStoreModal);
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeStoreModal();
    });
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeStoreModal();
    });
  }
  if (body) {
    // Remove any previous handler to avoid duplicates
    if (body._buyHandler) body.removeEventListener('click', body._buyHandler);
    body._buyHandler = (e) => {
      const btn = e.target.closest('.xp-store-buy-btn');
      if (!btn) return;
      const itemKey = btn.dataset.item;
      const price = parseInt(btn.dataset.price, 10);
      handlePurchase(itemKey, price, btn);
    };
    body.addEventListener('click', body._buyHandler);
  }
}

function closeStoreModal() {
  const modal = document.getElementById('xpStoreModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function renderStoreUI() {
  const userProgress = window.userProgress || {};
  const balanceEl = document.getElementById('xpStoreBalanceAmount');
  if (balanceEl) {
    balanceEl.textContent = (userProgress.xp || 0).toLocaleString();
  }

  // Update each item's buy button state
  Object.keys(STORE_ITEMS).forEach((itemKey) => {
    const item = STORE_ITEMS[itemKey];
    const owned = getOwnedCount(userProgress, itemKey);
    const btn = document.querySelector(`.xp-store-buy-btn[data-item="${itemKey}"]`);
    if (!btn) return;

    const buyText = btn.querySelector('.btn-buy-text');
    const ownedText = btn.querySelector('.btn-owned-text');

    if (owned > 0 && item.maxOwnable <= 1) {
      // One-time purchase items: show "Owned"
      buyText.style.display = 'none';
      ownedText.style.display = 'inline';
      btn.disabled = true;
      btn.classList.add('owned');
    } else if (owned >= item.maxOwnable) {
      buyText.style.display = 'none';
      ownedText.style.display = 'inline';
      ownedText.innerHTML = '<i class="fas fa-check"></i> Max';
      btn.disabled = true;
      btn.classList.add('owned');
    } else {
      buyText.style.display = 'inline';
      ownedText.style.display = 'none';
      btn.disabled = false;
      btn.classList.remove('owned');
      if (owned > 0) {
        buyText.textContent = `Buy (+${owned})`;
      } else {
        buyText.textContent = 'Buy';
      }
    }
  });
}

function handlePurchase(itemKey, price, btnElement) {
  const userProgress = window.userProgress || {};
  const result = purchaseItem(userProgress, itemKey);

  const toast = document.getElementById('xpStoreToast');
  if (!toast) return;

  if (result.success) {
    toast.textContent = result.message;
    toast.className = 'xp-store-toast success';
    toast.classList.add('show');

    // Animate the purchased button
    if (btnElement) {
      btnElement.classList.add('just-purchased');
      setTimeout(() => btnElement.classList.remove('just-purchased'), 600);
    }
  } else {
    toast.textContent = result.message;
    toast.className = 'xp-store-toast error';
    toast.classList.add('show');
  }

  // Auto-hide toast
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);

  // Refresh balance display
  const balanceEl = document.getElementById('xpStoreBalanceAmount');
  if (balanceEl) {
    balanceEl.textContent = (userProgress.xp || 0).toLocaleString();
  }

  renderStoreUI();
}



// ============================================
// Inventory display on dashboard
// ============================================

/**
 * Renders the My Items inventory card on the dashboard.
 * Shows owned items with counts and visual indicators.
 */
function renderInventoryDisplay() {
  const grid = document.getElementById('inventoryGrid');
  if (!grid) return;

  const userProgress = window.userProgress || {};
  const inv = userProgress.inventory;
  if (!inv) {
    grid.innerHTML = '<p class="empty-state inventory-empty">No items yet. Visit the XP Store!</p>';
    return;
  }

  const items = [];

  // Streak Freezes
  const freezeCount = (inv.streakFreezes || 0);
  if (freezeCount > 0) {
    items.push(`<div class="inv-item">
      <div class="inv-icon inv-icon--blue"><i class="fas fa-snowflake"></i></div>
      <div class="inv-info">
        <span class="inv-name">Streak Freeze</span>
        <span class="inv-count">x${freezeCount}</span>
      </div>
    </div>`);
  }

  // Hint Tokens
  const hintCount = (inv.hintTokens || 0);
  if (hintCount > 0) {
    items.push(`<div class="inv-item">
      <div class="inv-icon inv-icon--amber"><i class="fas fa-lightbulb"></i></div>
      <div class="inv-info">
        <span class="inv-name">Hint Token</span>
        <span class="inv-count">x${hintCount}</span>
      </div>
    </div>`);
  }

  // XP Boosters
  const boosterCount = (inv.xpBoosters || 0);
  if (boosterCount > 0) {
    const active = inv.xpBoostersTimer?.problemsRemaining > 0;
    items.push(`<div class="inv-item">
      <div class="inv-icon inv-icon--mint"><i class="fas fa-bolt"></i></div>
      <div class="inv-info">
        <span class="inv-name">XP Booster${active ? ' <span class="inv-active">ACTIVE</span>' : ''}</span>
        <span class="inv-count">x${boosterCount}</span>
      </div>
    </div>`);
  }

  // Avatar Pack
  if (inv.avatarPacks?.includes('premium')) {
    items.push(`<div class="inv-item">
      <div class="inv-icon inv-icon--rose"><i class="fas fa-palette"></i></div>
      <div class="inv-info">
        <span class="inv-name">Avatar Pack</span>
        <span class="inv-count inv-owned"><i class="fas fa-check"></i> Owned</span>
      </div>
    </div>`);
  }

  // Exclusive Badge
  if (inv.exclusiveBadge) {
    items.push(`<div class="inv-item">
      <div class="inv-icon inv-icon--lavender"><i class="fas fa-gem"></i></div>
      <div class="inv-info">
        <span class="inv-name">Exclusive Badge</span>
        <span class="inv-count inv-owned"><i class="fas fa-check"></i> Owned</span>
      </div>
    </div>`);
  }

  if (items.length === 0) {
    grid.innerHTML = '<p class="empty-state inventory-empty">No items yet. Visit the XP Store!</p>';
    return;
  }

  grid.innerHTML = items.join('');
}

// Export to window for legacy script usage
window.openStoreModal = openStoreModal;
window.closeStoreModal = closeStoreModal;
window.getStoreItem = getStoreItem;
window.getOwnedCount = getOwnedCount;
window.purchaseItem = purchaseItem;
window.getHintTokenCount = getHintTokenCount;
window.getXPBoosterCount = getXPBoosterCount;
window.useHintToken = useHintToken;
window.activateXPBooster = activateXPBooster;
window.applyBooster = applyBooster;
window.getActiveBoosterCount = getActiveBoosterCount;
window.consumeBoosterCharge = consumeBoosterCharge;
window.initStoreModal = initStoreModal;
window.renderStoreUI = renderStoreUI;
window.renderInventoryDisplay = renderInventoryDisplay;

export {
  initStoreModal,
  openStoreModal,
  closeStoreModal,
  renderStoreUI,
  renderInventoryDisplay,
  getStoreItem,
  getOwnedCount,
  purchaseItem,
  getHintTokenCount,
  getXPBoosterCount,
  useHintToken,
  activateXPBooster,
  applyBooster,
  getActiveBoosterCount,
  consumeBoosterCharge,
  STORE_ITEMS,
};
