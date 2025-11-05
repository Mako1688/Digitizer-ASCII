// UI Controller
// Single Responsibility: Manage all UI elements, event listeners, and user interactions

class UIController {
    constructor(eventHandlers) {
        this.eventHandlers = eventHandlers;
        this.elements = this.initializeElements();
        this.attachEventListeners();
        this.initTouchGestures();
    }

    /**
     * Initialize and cache all DOM elements
     * @returns {Object} Object containing all UI elements
     */
    initializeElements() {
        return {
            // Buttons
            uploadBtn: document.getElementById('uploadBtn'),
            cameraBtn: document.getElementById('cameraBtn'),
            fileInput: document.getElementById('fileInput'),
            captureBtn: document.getElementById('captureBtn'),
            closeCameraBtn: document.getElementById('closeCameraBtn'),
            generateBtn: document.getElementById('generateBtn'),
            copyTextBtn: document.getElementById('copyTextBtn'),
            downloadImageBtn: document.getElementById('downloadImageBtn'),
            downloadTextBtn: document.getElementById('downloadTextBtn'),
            
            // Zoom controls
            zoomInBtn: document.getElementById('zoomInBtn'),
            zoomOutBtn: document.getElementById('zoomOutBtn'),
            fitBtn: document.getElementById('fitBtn'),
            zoomLevel: document.getElementById('zoomLevel'),
            
            // Input controls
            imageSizeSelect: document.getElementById('imageSizeSelect'),
            imageSizeValue: document.getElementById('imageSizeValue'),
            resolutionSlider: document.getElementById('resolutionSlider'),
            fontSizeSlider: document.getElementById('fontSizeSlider'),
            contrastSlider: document.getElementById('contrastSlider'),
            colorToggle: document.getElementById('colorToggle'),
            invertToggle: document.getElementById('invertToggle'),
            
            // Display elements
            originalPreview: document.getElementById('originalPreview'),
            asciiPreview: document.getElementById('asciiPreview'),
            
            // Value displays
            resolutionValue: document.getElementById('resolutionValue'),
            fontSizeValue: document.getElementById('fontSizeValue'),
            contrastValue: document.getElementById('contrastValue')
        };
    }

    /**
     * Attach all event listeners to UI elements
     */
    attachEventListeners() {
        // File upload events
        this.elements.uploadBtn.addEventListener('click', 
            () => this.elements.fileInput.click());
        this.elements.fileInput.addEventListener('change', 
            (e) => this.eventHandlers.onFileUpload(e));
        
        // Camera events
        this.elements.cameraBtn.addEventListener('click', 
            () => this.eventHandlers.onCameraOpen());
        this.elements.captureBtn.addEventListener('click', 
            () => this.eventHandlers.onCapturePhoto());
        this.elements.closeCameraBtn.addEventListener('click', 
            () => this.eventHandlers.onCameraClose());
        
        // Generate event
        this.elements.generateBtn.addEventListener('click', 
            () => this.eventHandlers.onGenerate());
        
        // Export events
        this.elements.copyTextBtn.addEventListener('click', 
            () => this.eventHandlers.onCopyText());
        this.elements.downloadImageBtn.addEventListener('click', 
            () => this.eventHandlers.onDownloadImage());
        this.elements.downloadTextBtn.addEventListener('click', 
            () => this.eventHandlers.onDownloadText());
        
        // Settings events
        this.elements.imageSizeSelect.addEventListener('change', 
            (e) => this.eventHandlers.onImageSizeChange(e));
        this.elements.resolutionSlider.addEventListener('input', 
            (e) => this.eventHandlers.onResolutionChange(e));
        this.elements.fontSizeSlider.addEventListener('input', 
            (e) => this.eventHandlers.onFontSizeChange(e));
        this.elements.contrastSlider.addEventListener('input', 
            (e) => this.eventHandlers.onContrastChange(e));
        this.elements.colorToggle.addEventListener('change', 
            (e) => this.eventHandlers.onColorToggle(e));
        this.elements.invertToggle.addEventListener('change', 
            (e) => this.eventHandlers.onInvertToggle(e));
        
        // Zoom events
        this.elements.zoomInBtn.addEventListener('click', 
            () => this.eventHandlers.onZoomIn());
        this.elements.zoomOutBtn.addEventListener('click', 
            () => this.eventHandlers.onZoomOut());
        this.elements.fitBtn.addEventListener('click', 
            () => this.eventHandlers.onFitToView());
    }

    /**
     * Initialize touch gestures for pinch-to-zoom
     */
    initTouchGestures() {
        let initialDistance = 0;
        let initialZoom = CONFIG.ZOOM.DEFAULT;
        
        this.elements.asciiPreview.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                initialDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                initialZoom = this.eventHandlers.getCurrentZoom();
            }
        }, { passive: false });
        
        this.elements.asciiPreview.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && this.eventHandlers.hasASCIIArt()) {
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                
                const scale = currentDistance / initialDistance;
                const newZoom = Math.max(
                    CONFIG.ZOOM.MIN, 
                    Math.min(CONFIG.ZOOM.MAX, initialZoom * scale)
                );
                
                this.eventHandlers.onPinchZoom(Math.round(newZoom));
            }
        }, { passive: false });
    }

    /**
     * Update original image preview
     * @param {string} imageUrl - Image URL to display
     * @param {number} width - Display width
     * @param {number} height - Display height
     */
    updateOriginalPreview(imageUrl, width, height) {
        this.elements.originalPreview.innerHTML = 
            `<img src="${imageUrl}" alt="Original Image" style="width: ${width}px; height: ${height}px;">`;
    }

    /**
     * Update ASCII preview with text
     * @param {string} asciiText - ASCII art text
     */
    updateASCIIPreviewText(asciiText) {
        this.elements.asciiPreview.textContent = asciiText;
    }

    /**
     * Update ASCII preview with colored HTML
     * @param {DocumentFragment} fragment - Document fragment with colored ASCII
     */
    updateASCIIPreviewHTML(fragment) {
        this.elements.asciiPreview.innerHTML = '';
        this.elements.asciiPreview.appendChild(fragment);
    }

    /**
     * Update ASCII preview font size
     * @param {number} fontSize - Font size in pixels
     */
    updateASCIIFontSize(fontSize) {
        this.elements.asciiPreview.style.fontSize = `${fontSize}px`;
        this.elements.asciiPreview.style.lineHeight = `${fontSize}px`;
    }

    /**
     * Update zoom level display
     * @param {number} zoom - Zoom percentage
     */
    updateZoomDisplay(zoom) {
        this.elements.zoomLevel.textContent = `${zoom}%`;
    }

    /**
     * Update image size display
     * @param {string} value - Size value (e.g., "1x")
     */
    updateImageSizeDisplay(value) {
        this.elements.imageSizeValue.textContent = value;
    }

    /**
     * Update resolution display
     * @param {string} value - Resolution percentage
     */
    updateResolutionDisplay(value) {
        this.elements.resolutionValue.textContent = value;
    }

    /**
     * Update font size display
     * @param {string} value - Font size in pixels
     */
    updateFontSizeDisplay(value) {
        this.elements.fontSizeValue.textContent = value;
    }

    /**
     * Update contrast display
     * @param {string} value - Contrast multiplier
     */
    updateContrastDisplay(value) {
        this.elements.contrastValue.textContent = value;
    }

    /**
     * Enable/disable generate button
     * @param {boolean} enabled - Whether button should be enabled
     */
    setGenerateButtonEnabled(enabled) {
        this.elements.generateBtn.disabled = !enabled;
    }

    /**
     * Enable/disable export buttons
     * @param {boolean} enabled - Whether buttons should be enabled
     */
    setExportButtonsEnabled(enabled) {
        this.elements.copyTextBtn.disabled = !enabled;
        this.elements.downloadImageBtn.disabled = !enabled;
        this.elements.downloadTextBtn.disabled = !enabled;
    }

    /**
     * Enable/disable zoom controls
     * @param {boolean} enabled - Whether controls should be enabled
     */
    setZoomControlsEnabled(enabled) {
        this.elements.zoomInBtn.disabled = !enabled;
        this.elements.zoomOutBtn.disabled = !enabled;
        this.elements.fitBtn.disabled = !enabled;
    }

    /**
     * Get ASCII preview element
     * @returns {HTMLElement} ASCII preview element
     */
    getASCIIPreviewElement() {
        return this.elements.asciiPreview;
    }

    /**
     * Show placeholder in ASCII preview
     * @param {string} message - Placeholder message
     */
    showASCIIPlaceholder(message) {
        this.elements.asciiPreview.innerHTML = 
            `<p class="placeholder-text">${message}</p>`;
    }
}
