// Loading Service
// Single Responsibility: Manage loading states, progress indicators, and UI blocking prevention

class LoadingService {
    constructor() {
        this.isLoading = false;
        this.currentOperation = null;
        this.progress = 0;
        this.loadingElement = null;
        this.progressBar = null;
        this.progressText = null;
        this.debounceTimer = null;
        this.initializeLoadingUI();
    }

    /**
     * Initialize loading UI elements
     */
    initializeLoadingUI() {
        // Create loading overlay
        this.loadingElement = document.createElement('div');
        this.loadingElement.id = 'loading-overlay';
        this.loadingElement.className = 'loading-overlay';
        this.loadingElement.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">Processing ASCII Art...</div>
                <div class="loading-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar" id="progress-bar"></div>
                    </div>
                    <div class="progress-text" id="progress-text">0%</div>
                </div>
                <div class="loading-details" id="loading-details"></div>
            </div>
        `;

        // Cache progress elements
        this.progressBar = this.loadingElement.querySelector('#progress-bar');
        this.progressText = this.loadingElement.querySelector('#progress-text');
        this.loadingDetails = this.loadingElement.querySelector('#loading-details');

        // Add to DOM but keep hidden
        this.loadingElement.style.display = 'none';
        document.body.appendChild(this.loadingElement);

        // Initialize styles if not already present
        this.initializeStyles();
    }

    /**
     * Initialize CSS styles for loading elements
     */
    initializeStyles() {
        if (document.getElementById('loading-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                backdrop-filter: blur(2px);
            }

            .loading-content {
                background: var(--card-bg, #0a0a0a);
                border: 2px solid var(--border-color, #00ff00);
                border-radius: 8px;
                padding: 30px;
                text-align: center;
                box-shadow: var(--shadow, 0 0 20px rgba(0, 255, 0, 0.3));
                min-width: 300px;
                max-width: 500px;
            }

            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 3px solid rgba(0, 255, 0, 0.2);
                border-top: 3px solid var(--primary-color, #00ff00);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }

            .loading-text {
                color: var(--text-color, #00ff00);
                font-family: 'Courier New', monospace;
                font-size: 1.2em;
                margin-bottom: 20px;
                text-shadow: var(--glow, 0 0 10px rgba(0, 255, 0, 0.5));
            }

            .loading-progress {
                margin-bottom: 15px;
            }

            .progress-bar-container {
                width: 100%;
                height: 10px;
                background: rgba(0, 255, 0, 0.2);
                border-radius: 5px;
                overflow: hidden;
                margin-bottom: 10px;
                border: 1px solid rgba(0, 255, 0, 0.5);
            }

            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, 
                    var(--primary-color, #00ff00), 
                    var(--secondary-color, #00cc00)
                );
                width: 0%;
                transition: width 0.3s ease;
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
            }

            .progress-text {
                color: var(--text-color, #00ff00);
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
                margin-bottom: 5px;
            }

            .loading-details {
                color: rgba(0, 255, 0, 0.7);
                font-family: 'Courier New', monospace;
                font-size: 0.8em;
                min-height: 1.2em;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .loading-fade-in {
                animation: loadingFadeIn ${CONFIG.LOADING.ANIMATION_DURATION}ms ease;
            }

            .loading-fade-out {
                animation: loadingFadeOut ${CONFIG.LOADING.ANIMATION_DURATION}ms ease;
            }

            @keyframes loadingFadeIn {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
            }

            @keyframes loadingFadeOut {
                from { opacity: 1; transform: scale(1); }
                to { opacity: 0; transform: scale(0.9); }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show loading indicator with debouncing
     * @param {string} operation - Description of current operation
     * @param {string} details - Additional details
     */
    show(operation = 'Processing...', details = '') {
        console.log('[LOADING] Show requested:', operation, details);
        
        // Clear any existing debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        // Show immediately for ASCII generation (no debouncing)
        this._showImmediate(operation, details);
    }

    /**
     * Show loading immediately (internal method)
     * @param {string} operation - Description of current operation
     * @param {string} details - Additional details
     */
    _showImmediate(operation, details) {
        console.log('[LOADING] Show immediate called:', operation, details, 'isLoading:', this.isLoading);
        
        if (this.isLoading) {
            console.log('[LOADING] Already loading, ignoring show request');
            return;
        }

        this.isLoading = true;
        this.currentOperation = operation;
        this.progress = 0;

        console.log('[LOADING] Setting up loading elements...');
        
        // Update content
        this.loadingElement.querySelector('.loading-text').textContent = operation;
        this.loadingDetails.textContent = details;
        this.updateProgress(0);

        // Show with animation
        this.loadingElement.style.display = 'flex';
        this.loadingElement.classList.add('loading-fade-in');
        
        // Disable page interactions
        document.body.style.overflow = 'hidden';
        
        console.log('[LOADING] Loading screen now visible');
    }

    /**
     * Hide loading indicator
     */
    hide() {
        console.log('[LOADING] Hide called, isLoading:', this.isLoading);
        
        if (!this.isLoading) {
            console.log('[LOADING] Not currently loading, ignoring hide request');
            return;
        }

        // Clear debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        console.log('[LOADING] Hiding loading screen...');

        this.isLoading = false;
        this.currentOperation = null;
        this.progress = 0;

        // Hide immediately without animation for fast operations
        this.loadingElement.classList.remove('loading-fade-in');
        this.loadingElement.style.display = 'none';
        
        // Re-enable page interactions
        document.body.style.overflow = '';
        
        console.log('[LOADING] Loading screen now hidden');
    }

    /**
     * Update progress percentage and details
     * @param {number} percentage - Progress percentage (0-100)
     * @param {string} details - Optional details text
     */
    updateProgress(percentage, details = '') {
        console.log('[LOADING] Progress update:', percentage + '%', details);
        
        this.progress = Math.max(0, Math.min(100, percentage));
        
        if (this.progressBar) {
            this.progressBar.style.width = this.progress + '%';
        }
        
        if (this.progressText) {
            this.progressText.textContent = Math.round(this.progress) + '%';
        }

        if (details && this.loadingDetails) {
            this.loadingDetails.textContent = details;
        }
    }

    /**
     * Check if currently loading
     * @returns {boolean} True if loading
     */
    isCurrentlyLoading() {
        return this.isLoading;
    }

    /**
     * Get current operation description
     * @returns {string} Current operation or null
     */
    getCurrentOperation() {
        return this.currentOperation;
    }

    /**
     * Force hide loading (emergency stop)
     */
    forceHide() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        
        this.isLoading = false;
        this.currentOperation = null;
        this.loadingElement.style.display = 'none';
        this.loadingElement.classList.remove('loading-fade-in', 'loading-fade-out');
        document.body.style.overflow = '';
    }

    /**
     * Create a sleep function for yielding control back to the browser
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Promise that resolves after the specified time
     */
    sleep(ms = 0) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Yield control back to browser to prevent UI blocking
     * @returns {Promise} Promise that resolves on next tick
     */
    async yield() {
        return this.sleep(0);
    }
}