/**
 * UIController - Handles DOM manipulation and user interactions
 * Follows Single Responsibility Principle and Interface Segregation
 */
export class UIController {
    constructor() {
        this.elements = this.initializeElements();
        this.currentImage = null;
        this.asciiResult = null;
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        return {
            uploadBtn: document.getElementById('uploadBtn'),
            fileInput: document.getElementById('fileInput'),
            generateBtn: document.getElementById('generateBtn'),
            resolutionSelect: document.getElementById('resolutionSelect'),
            resolutionValue: document.getElementById('resolutionValue'),
            pixelSizeSlider: document.getElementById('pixelSizeSlider'),
            pixelSizeValue: document.getElementById('pixelSizeValue'),
            downloadQualitySelect: document.getElementById('downloadQualitySelect'),
            downloadQualityValue: document.getElementById('downloadQualityValue'),
            originalPreview: document.getElementById('originalPreview'),
            asciiPreview: document.getElementById('asciiPreview'),
            copyTextBtn: document.getElementById('copyTextBtn'),
            downloadImageBtn: document.getElementById('downloadImageBtn')
        };
    }

    /**
     * Setup event listeners with callback functions
     * @param {Object} callbacks - Event callback functions
     */
    setupEventListeners(callbacks) {
        this.elements.uploadBtn.addEventListener('click', () => {
            this.elements.fileInput.click();
        });
        
        this.elements.fileInput.addEventListener('change', callbacks.onFileUpload);
        this.elements.generateBtn.addEventListener('click', callbacks.onGenerate);
        this.elements.copyTextBtn.addEventListener('click', callbacks.onCopy);
        this.elements.downloadImageBtn.addEventListener('click', callbacks.onDownload);
        
        this.elements.resolutionSelect.addEventListener('change', (e) => {
            this.elements.resolutionValue.textContent = e.target.value + 'x';
        });
        
        this.elements.pixelSizeSlider.addEventListener('input', (e) => {
            this.updatePixelSizeDisplay(parseInt(e.target.value));
        });
        
        this.elements.downloadQualitySelect.addEventListener('change', (e) => {
            this.updateDownloadQualityDisplay(parseInt(e.target.value));
        });
        
        window.addEventListener('resize', callbacks.onResize);
    }

    /**
     * Update pixel size display
     */
    updatePixelSizeDisplay(pixelSize) {
        const description = pixelSize === 1 ? 'px per char' : 
                          pixelSize <= 3 ? 'px per char (Fine)' :
                          pixelSize <= 6 ? 'px per char (Medium)' :
                          'px per char (Chunky)';
        this.elements.pixelSizeValue.textContent = `${pixelSize} ${description}`;
    }

    /**
     * Update download quality display
     */
    updateDownloadQualityDisplay(quality) {
        let qualityText = 'High';
        if (quality <= 6) qualityText = 'Very Low';
        else if (quality <= 8) qualityText = 'Low';
        else if (quality <= 12) qualityText = 'High';
        else if (quality <= 16) qualityText = 'Very High';
        else if (quality <= 20) qualityText = 'Ultra High';
        else if (quality <= 24) qualityText = 'Maximum';
        else if (quality <= 32) qualityText = 'Extreme';
        else qualityText = 'Professional';
        this.elements.downloadQualityValue.textContent = qualityText;
    }

    /**
     * Display uploaded image in preview
     * @param {HTMLImageElement} image - Image to display
     */
    displayImagePreview(image) {
        this.currentImage = image;
        this.elements.originalPreview.innerHTML = '';
        this.elements.originalPreview.appendChild(image);
        this.setGenerateButtonState(true);
        this.resetExportButtons();
        this.setASCIIPreviewState('ready');
    }

    /**
     * Display ASCII result
     * @param {Object} asciiResult - ASCII result object
     */
    displayASCIIResult(asciiResult) {
        this.asciiResult = asciiResult;
        this.elements.asciiPreview.innerHTML = asciiResult.html;
        
        setTimeout(() => {
            this.calculateOptimalFontSize();
        }, 10);
        
        this.setExportButtonsState(true);
    }

    /**
     * Calculate and apply optimal font size for ASCII display
     */
    calculateOptimalFontSize() {
        if (!this.asciiResult) return;

        const containerRect = this.elements.asciiPreview.getBoundingClientRect();
        const containerWidth = containerRect.width - 30;
        const containerHeight = Math.max(300, containerRect.height - 30);
        
        const asciiWidth = this.asciiResult.width;
        const asciiHeight = this.asciiResult.height;
        
        const maxFontWidthFit = containerWidth / asciiWidth;
        const maxFontHeightFit = containerHeight / asciiHeight;
        
        let optimalFontSize = Math.floor(Math.min(maxFontWidthFit, maxFontHeightFit));
        optimalFontSize = Math.max(1, Math.min(16, optimalFontSize));
        
        this.applyASCIIDisplayStyles(optimalFontSize);
        this.scrollASCIIIntoView();
    }

    /**
     * Apply styling for ASCII display
     */
    applyASCIIDisplayStyles(fontSize) {
        const preview = this.elements.asciiPreview;
        preview.style.fontSize = `${fontSize}px`;
        preview.style.lineHeight = `${fontSize}px`;
        preview.style.fontFamily = 'Courier New, monospace';
        preview.style.display = 'block';
        preview.style.whiteSpace = 'nowrap';
        preview.style.overflow = 'auto';
        preview.style.textAlign = 'left';
        preview.style.width = '100%';
        preview.style.height = 'auto';
    }

    /**
     * Scroll ASCII preview into view
     */
    scrollASCIIIntoView() {
        setTimeout(() => {
            this.elements.asciiPreview.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest',
                inline: 'start'
            });
        }, 100);
    }

    /**
     * Set ASCII preview state with placeholder text
     * @param {string} state - State ('ready', 'generating', 'error')
     */
    setASCIIPreviewState(state) {
        const messages = {
            ready: '[ READY FOR CONVERSION ]',
            generating: '[ GENERATING ASCII ART... ]',
            error: '[ ERROR GENERATING ASCII ART ]'
        };
        
        this.elements.asciiPreview.innerHTML = `<p class="placeholder-text">${messages[state]}</p>`;
    }

    /**
     * Update progress during ASCII generation
     * @param {number} progress - Progress percentage
     */
    updateProgress(progress) {
        this.elements.asciiPreview.innerHTML = `<p class="placeholder-text">[ GENERATING... ${progress}% ]</p>`;
    }

    /**
     * Set generate button state
     * @param {boolean} enabled - Enable/disable state
     */
    setGenerateButtonState(enabled) {
        this.elements.generateBtn.disabled = !enabled;
    }

    /**
     * Set export buttons state
     * @param {boolean} enabled - Enable/disable state
     */
    setExportButtonsState(enabled) {
        this.elements.copyTextBtn.disabled = !enabled;
        this.elements.downloadImageBtn.disabled = !enabled;
    }

    /**
     * Reset export buttons to disabled state
     */
    resetExportButtons() {
        this.setExportButtonsState(false);
    }

    /**
     * Show copy success feedback
     */
    showCopySuccess() {
        const originalText = this.elements.copyTextBtn.textContent;
        this.elements.copyTextBtn.textContent = '> COPIED!';
        setTimeout(() => {
            this.elements.copyTextBtn.textContent = originalText;
        }, 1000);
    }

    /**
     * Get current configuration values
     */
    getCurrentConfig() {
        return {
            scale: parseFloat(this.elements.resolutionSelect.value),
            pixelSize: parseInt(this.elements.pixelSizeSlider.value),
            downloadQuality: parseInt(this.elements.downloadQualitySelect.value)
        };
    }

    /**
     * Get uploaded file
     */
    getUploadedFile() {
        return this.elements.fileInput.files[0];
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        alert(message);
    }
}