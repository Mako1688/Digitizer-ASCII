// Notification Service
// Single Responsibility: Display user notifications and feedback

class NotificationService {
    /**
     * Check if device is mobile
     * @returns {boolean} True if mobile device detected
     */
    isMobileDevice() {
        return MOBILE_REGEX.test(navigator.userAgent);
    }

    /**
     * Show a notification message to the user
     * @param {string} message - Message to display
     */
    show(message) {
        const notification = this.createNotificationElement(message);
        document.body.appendChild(notification);
        
        // Haptic feedback on mobile devices
        this.provideHapticFeedback();
        
        // Auto-remove notification after delay
        this.scheduleRemoval(notification);
    }

    /**
     * Create notification DOM element
     * @param {string} message - Message to display
     * @returns {HTMLDivElement} Notification element
     */
    createNotificationElement(message) {
        const notification = document.createElement('div');
        notification.textContent = `> ${message}`;
        notification.style.cssText = this.getNotificationStyles();
        return notification;
    }

    /**
     * Get CSS styles for notification based on device type
     * @returns {string} CSS style string
     */
    getNotificationStyles() {
        const isMobile = this.isMobileDevice();
        
        const baseStyles = `
            position: fixed;
            background: #000000;
            color: #00ff00;
            border: 2px solid #00ff00;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
            text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
            text-align: center;
        `;
        
        if (isMobile) {
            return baseStyles + `
                top: 10px;
                left: 10px;
                right: 10px;
                max-width: calc(100% - 20px);
                padding: 12px 15px;
                font-size: 0.85em;
            `;
        } else {
            return baseStyles + `
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                font-size: 1em;
            `;
        }
    }

    /**
     * Provide haptic feedback on supported mobile devices
     */
    provideHapticFeedback() {
        if (this.isMobileDevice() && navigator.vibrate) {
            navigator.vibrate(CONFIG.NOTIFICATION.VIBRATION_DURATION);
        }
    }

    /**
     * Schedule notification removal after delay
     * @param {HTMLElement} notification - Notification element to remove
     */
    scheduleRemoval(notification) {
        setTimeout(() => {
            notification.style.animation = `slideOut ${CONFIG.NOTIFICATION.FADE_OUT_DURATION}ms ease`;
            
            setTimeout(() => {
                notification.remove();
            }, CONFIG.NOTIFICATION.FADE_OUT_DURATION);
        }, CONFIG.NOTIFICATION.DURATION);
    }

    /**
     * Show error notification
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.show(`ERROR: ${message}`);
    }

    /**
     * Initialize CSS animations for notifications
     */
    static initializeAnimations() {
        // Check if animations already exist
        if (document.getElementById('notification-animations')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'notification-animations';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize animations when script loads
NotificationService.initializeAnimations();
