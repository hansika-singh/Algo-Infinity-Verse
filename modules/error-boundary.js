/**
 * Global Error Boundary & Fallback UI
 * Captures unhandled exceptions and promise rejections to prevent blank screens.
 * Includes a localized boundary utility `ErrorBoundary.run()`.
 */

class ErrorBoundaryService {
    constructor() {
        this.initGlobalListeners();
    }

    initGlobalListeners() {
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event.error || event.message, event.filename, event.lineno, event.colno);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError(event.reason, 'Promise Rejection', 0, 0);
        });
    }

    async logErrorToServer(errorInfo) {
        try {
            await fetch('/api/log-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: errorInfo.message,
                    stack: errorInfo.stack,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (e) {
            console.error('Failed to log error to backend:', e);
        }
    }

    handleGlobalError(error, source, lineno, colno) {
        console.error('Global Error Caught:', error);
        
        const errorInfo = {
            message: error?.message || error || 'Unknown Error',
            stack: error?.stack || `${source}:${lineno}:${colno}`
        };

        this.logErrorToServer(errorInfo);
        this.showGlobalFallback(errorInfo);
    }

    showGlobalFallback(errorInfo) {
        // Prevent multiple modals
        if (document.getElementById('global-error-fallback')) return;

        const overlay = document.createElement('div');
        overlay.id = 'global-error-fallback';
        overlay.className = 'error-boundary-overlay';

        overlay.innerHTML = `
            <div class="error-boundary-modal glass-card">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2>Something went wrong</h2>
                <p>We're sorry, but an unexpected error occurred. The application was unable to continue rendering.</p>
                <div class="error-details-toggle" onclick="this.nextElementSibling.classList.toggle('show')">
                    Show Error Details <i class="fas fa-chevron-down"></i>
                </div>
                <pre class="error-details">${this.escapeHTML(errorInfo.message)}\n\n${this.escapeHTML(errorInfo.stack)}</pre>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="window.location.reload()">Reload Page</button>
                    <button class="btn btn-outline" onclick="window.location.href='/'">Go Home</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden'; // prevent scrolling
    }

    /**
     * Localized Error Boundary Wrapper
     * @param {Function} fn - The function to run
     * @param {string} containerId - The DOM ID where a fallback should render if it fails
     */
    run(fn, containerId) {
        try {
            const result = fn();
            // Handle async functions
            if (result && result.catch) {
                return result.catch(err => this.renderLocalizedFallback(err, containerId));
            }
            return result;
        } catch (error) {
            this.renderLocalizedFallback(error, containerId);
        }
    }

    renderLocalizedFallback(error, containerId) {
        console.error('Localized Error Caught:', error);
        this.logErrorToServer({ message: error.message, stack: error.stack });
        
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="localized-error-fallback">
                    <i class="fas fa-times-circle"></i>
                    <div>
                        <strong>Failed to load component.</strong>
                        <button onclick="window.location.reload()" class="btn-link">Retry</button>
                    </div>
                </div>
            `;
        }
    }

    escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Attach to window globally
window.ErrorBoundary = new ErrorBoundaryService();
