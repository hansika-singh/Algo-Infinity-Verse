/**
 * loading.js — Bridge module
 *
 * Re‑exports the loading‑screen animation from the dedicated
 * loading-animation/ folder so that existing imports (via init.js)
 * continue to work without change.
 */

export {
  initLoadingScreen,
  cleanupLoadingScreen
} from '../loading-animation/splash.js';
