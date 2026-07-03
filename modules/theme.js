// modules/theme.js

/**
 * Theme management module with event system
 * Supports cross-module communication for theme changes
 */

// Theme constants
const THEME_KEY = 'theme';
const THEME_CHANGE_EVENT = 'themeChanged';

export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
};

let currentTheme = null;
let themeChangeListeners = [];

/**
 * Get current theme from localStorage or system preference
 * @returns {string} 'light' or 'dark'
 */
export function getCurrentTheme() {
    try {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored) return stored;
        
        // Fallback to system preference
        const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        return prefersLight ? THEMES.LIGHT : THEMES.DARK;
    } catch {
        return THEMES.DARK;
    }
}

/**
 * Apply theme to DOM
 * @param {string} theme - 'light' or 'dark'
 */
function applyThemeToDOM(theme) {
    const isLight = theme === THEMES.LIGHT;
    
    if (isLight) {
        document.documentElement.classList.add('light-mode');
        document.documentElement.classList.remove('dark-mode');
    } else {
        document.documentElement.classList.remove('light-mode');
        document.documentElement.classList.add('dark-mode');
    }
}

/**
 * Set theme and dispatch event
 * @param {string} theme - 'light' or 'dark'
 * @param {boolean} dispatchEvent - Whether to dispatch theme change event
 */
export function setTheme(theme, dispatchEvent = true) {
    if (theme !== THEMES.LIGHT && theme !== THEMES.DARK) {
        console.warn('Invalid theme:', theme);
        return;
    }
    
    // Save to localStorage
    localStorage.setItem(THEME_KEY, theme);
    
    // Apply to DOM
    applyThemeToDOM(theme);
    
    // Update current theme
    currentTheme = theme;
    
    // Update theme toggle icon
    updateThemeIcon(theme);
    
    // Dispatch custom event for other modules
    if (dispatchEvent) {
        const event = new CustomEvent(THEME_CHANGE_EVENT, {
            detail: { theme: theme, oldTheme: currentTheme }
        });
        document.dispatchEvent(event);
    }
}

/**
 * Toggle between light and dark themes
 * @returns {string} New theme
 */
export function toggleTheme() {
    const current = getCurrentTheme();
    const next = current === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    setTheme(next);
    return next;
}

/**
 * Update theme toggle button icon
 * @param {string} theme - 'light' or 'dark'
 */
function updateThemeIcon(theme) {
    const toggle = document.getElementById("darkModeToggle");
    if (!toggle) return;
    
    const icon = toggle.querySelector("i");
    if (!icon) return;
    
    const isLight = theme === THEMES.LIGHT;
    
    if (isLight) {
        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");
    } else {
        icon.classList.remove("fa-sun");
        icon.classList.add("fa-moon");
    }
}

/**
 * Initialize theme on page load
 */
export function initTheme() {
    const toggle = document.getElementById("darkModeToggle");
    if (!toggle) return;

    const icon = toggle.querySelector("i");
    
    // Get current theme
    const theme = getCurrentTheme();
    currentTheme = theme;
    
    // Apply theme to DOM
    applyThemeToDOM(theme);
    
    // Sync icon
    if (icon) {
        if (theme === THEMES.LIGHT) {
            icon.classList.remove("fa-moon");
            icon.classList.add("fa-sun");
        } else {
            icon.classList.remove("fa-sun");
            icon.classList.add("fa-moon");
        }
    }

    // Toggle click handler
    toggle.addEventListener("click", () => {
        const nextTheme = toggleTheme();
        
        // The toggleTheme function already handles everything
        // But we need to update the icon which is done in setTheme
    });

    // Sync across tabs
    window.addEventListener('storage', (event) => {
        if (event.key === THEME_KEY) {
            const newTheme = event.newValue || THEMES.DARK;
            const isLight = newTheme === THEMES.LIGHT;
            
            // Apply theme
            applyThemeToDOM(newTheme);
            
            // Update icon
            if (icon) {
                if (isLight) {
                    icon.classList.remove("fa-moon");
                    icon.classList.add("fa-sun");
                } else {
                    icon.classList.remove("fa-sun");
                    icon.classList.add("fa-moon");
                }
            }
            
            // Update current theme
            currentTheme = newTheme;
            
            // Dispatch event for other modules
            const eventObj = new CustomEvent(THEME_CHANGE_EVENT, {
                detail: { theme: newTheme }
            });
            document.dispatchEvent(eventObj);
        }
    });

    // Listen for system theme changes (if user hasn't set a preference)
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', (e) => {
        // Only change if user hasn't manually set a theme
        if (!localStorage.getItem(THEME_KEY)) {
            const theme = e.matches ? THEMES.DARK : THEMES.LIGHT;
            setTheme(theme);
        }
    });
}

/**
 * Listen for theme changes
 * @param {Function} callback - Callback function receiving theme
 * @returns {Function} Unsubscribe function
 */
export function onThemeChange(callback) {
    if (typeof callback !== 'function') {
        console.warn('onThemeChange: callback must be a function');
        return () => {};
    }
    
    const handler = (event) => {
        callback(event.detail.theme, event.detail.oldTheme);
    };
    
    document.addEventListener(THEME_CHANGE_EVENT, handler);
    themeChangeListeners.push(handler);
    
    // Return unsubscribe function
    return () => {
        document.removeEventListener(THEME_CHANGE_EVENT, handler);
        themeChangeListeners = themeChangeListeners.filter(h => h !== handler);
    };
}

/**
 * Get current theme (synchronous)
 * @returns {string} 'light' or 'dark'
 */
export function getTheme() {
    return currentTheme || getCurrentTheme();
}

/**
 * Check if current theme is dark
 * @returns {boolean}
 */
export function isDarkTheme() {
    return getTheme() === THEMES.DARK;
}

/**
 * Check if current theme is light
 * @returns {boolean}
 */
export function isLightTheme() {
    return getTheme() === THEMES.LIGHT;
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}

// Export default
export default {
    THEMES,
    getCurrentTheme,
    setTheme,
    toggleTheme,
    initTheme,
    onThemeChange,
    getTheme,
    isDarkTheme,
    isLightTheme,
    THEME_CHANGE_EVENT
};