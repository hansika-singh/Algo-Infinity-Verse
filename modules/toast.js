/**
 * Centralized Toast Notification System
 * A global utility to present consistent non-blocking notifications.
 */

class ToastService {
    constructor() {
        this.initContainer();
    }

    initContainer() {
        if (document.getElementById('toast-container')) return;
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 3000) {
        if (!this.container) this.initContainer();

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        
        let icon = '';
        switch(type) {
            case 'success': icon = 'fa-check-circle'; break;
            case 'error': icon = 'fa-exclamation-circle'; break;
            case 'warning': icon = 'fa-exclamation-triangle'; break;
            default: icon = 'fa-info-circle'; break;
        }

        toast.innerHTML = `
            <div class="toast-icon"><i class="fas ${icon}"></i></div>
            <div class="toast-message">${this.escapeHTML(message)}</div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;

        this.container.appendChild(toast);

        // Entrance animation
        setTimeout(() => toast.classList.add('toast-visible'), 10);

        // Setup removal
        let timeoutId;
        const removeToast = () => {
            toast.classList.remove('toast-visible');
            setTimeout(() => {
                if (this.container.contains(toast)) {
                    this.container.removeChild(toast);
                }
            }, 300); // Wait for transition
        };

        timeoutId = setTimeout(removeToast, duration);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timeoutId);
            removeToast();
        });
    }

    success(message, duration) { this.show(message, 'success', duration); }
    error(message, duration) { this.show(message, 'error', duration); }
    warning(message, duration) { this.show(message, 'warning', duration); }
    info(message, duration) { this.show(message, 'info', duration); }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Attach to window globally
window.Toast = new ToastService();
