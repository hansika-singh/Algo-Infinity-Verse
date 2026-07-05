// ============================================
// ABORT MANAGER
// ============================================
class AbortManager {
  constructor() {
    this.controllers = new Map();
  }
  getSignal(key) {
    if (this.controllers.has(key)) {
      this.controllers.get(key).abort();
    }
    const controller = new AbortController();
    this.controllers.set(key, controller);
    return controller.signal;
  }
  clearSignal(key) {
    this.controllers.delete(key);
  }
}

const apiAbort = new AbortManager();
window.apiAbort = apiAbort;
