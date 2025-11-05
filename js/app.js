// ASCII Image Digitizer - Main Application
// Coordinates all services using dependency injection
// Follows SOLID principles: Single Responsibility, Dependency Inversion

class ASCIIDigitizer {
    constructor() {
        // Initialize services with dependency injection
        this.notificationService = new NotificationService();
        this.characterService = new ASCIICharacterService();
        this.imageProcessor = new ImageProcessorService();
        this.cameraService = new CameraService();
        this.asciiGenerator = new ASCIIGeneratorService(
            this.characterService, 
            this.imageProcessor
        );
        this.exportService = new ExportService(this.notificationService);
        
        // Application state
        this.state = {
            currentImage: null,
            currentImageUrl: null,
            asciiText: '',
            coloredData: null,
            settings: { ...CONFIG.DEFAULT_SETTINGS }
        };
        
        // Initialize UI controller with event handlers
        this.uiController = new UIController(this.createEventHandlers());
    }

    /**
     * Create event handlers object for UI controller
     * Uses arrow functions to maintain 'this' context
     * @returns {Object} Event handlers object
     */
    createEventHandlers() {
        return {
            onFileUpload: (e) => this.handleFileUpload(e),
            onCameraOpen: () => this.handleCameraOpen(),
            onCapturePhoto: () => this.handleCapturePhoto(),
            onCameraClose: () => this.handleCameraClose(),
            onGenerate: () => this.handleGenerate(),
            onCopyText: () => this.handleCopyText(),
            onDownloadImage: () => this.handleDownloadImage(),
            onDownloadText: () => this.handleDownloadText(),
            onImageSizeChange: (e) => this.handleImageSizeChange(e),
            onResolutionChange: (e) => this.handleResolutionChange(e),
            onFontSizeChange: (e) => this.handleFontSizeChange(e),
            onContrastChange: (e) => this.handleContrastChange(e),
            onColorToggle: (e) => this.handleColorToggle(e),
            onInvertToggle: (e) => this.handleInvertToggle(e),
            onZoomIn: () => this.handleZoomAdjustment(CONFIG.ZOOM.STEP),
            onZoomOut: () => this.handleZoomAdjustment(-CONFIG.ZOOM.STEP),
            onFitToView: () => this.handleFitToView(),
            onPinchZoom: (newZoom) => this.handlePinchZoom(newZoom),
            getCurrentZoom: () => this.state.settings.zoom,
            hasASCIIArt: () => this.state.asciiText !== ''
        };
    }

    /**
     * Handle file upload event
     */
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!this.imageProcessor.isValidImageType(file)) {
            this.notificationService.showError(
                'Please upload a valid image file (PNG, JPG, JPEG, or GIF)'
            );
            return;
        }
        
        try {
            const dataUrl = await this.imageProcessor.readFileAsDataURL(file);
            await this.loadImage(dataUrl);
        } catch (error) {
            console.error('File upload error:', error);
            this.notificationService.showError('Failed to load image file');
        }
    }

    /**
     * Handle camera open request
     */
    async handleCameraOpen() {
        try {
            await this.cameraService.openCamera();
        } catch (error) {
            this.notificationService.showError(error.message);
        }
    }

    /**
     * Handle photo capture from camera
     */
    async handleCapturePhoto() {
        try {
            const videoElement = this.cameraService.getVideoElement();
            const dataUrl = this.imageProcessor.captureFromVideo(videoElement);
            await this.loadImage(dataUrl);
            this.cameraService.closeCamera();
        } catch (error) {
            console.error('Capture error:', error);
            this.notificationService.showError('Failed to capture photo');
        }
    }

    /**
     * Handle camera close request
     */
    handleCameraClose() {
        this.cameraService.closeCamera();
    }

    /**
     * Load and display an image
     */
    async loadImage(dataUrl) {
        try {
            const image = await this.imageProcessor.loadImage(dataUrl);
            this.state.currentImage = image;
            this.state.currentImageUrl = dataUrl;
            
            this.updateOriginalPreview();
            this.uiController.setGenerateButtonEnabled(true);
        } catch (error) {
            console.error('Image load error:', error);
            this.notificationService.showError('Failed to load image');
        }
    }

    /**
     * Update the original image preview
     */
    updateOriginalPreview() {
        const dimensions = this.imageProcessor.calculateScaledDimensions(
            this.state.currentImage,
            this.state.settings.imageSize
        );
        
        this.uiController.updateOriginalPreview(
            this.state.currentImageUrl,
            dimensions.width,
            dimensions.height
        );
    }

    /**
     * Handle ASCII generation
     */
    handleGenerate() {
        if (!this.state.currentImage) return;
        
        const scaledDimensions = this.imageProcessor.calculateScaledDimensions(
            this.state.currentImage,
            this.state.settings.imageSize
        );
        
        const charDimensions = this.imageProcessor.calculateCharacterDimensions(
            scaledDimensions.width,
            scaledDimensions.height,
            this.state.settings.fontSize,
            this.state.settings.resolution
        );
        
        const imageData = this.imageProcessor.processImageToCharacterSize(
            this.state.currentImage,
            charDimensions.charWidth,
            charDimensions.charHeight
        );
        
        if (this.state.settings.colored) {
            this.generateColoredASCII(imageData, charDimensions);
        } else {
            this.generateMonochromeASCII(imageData, charDimensions);
        }
        
        // Enable export and zoom controls
        this.uiController.setExportButtonsEnabled(true);
        this.uiController.setZoomControlsEnabled(true);
        
        // Reset zoom to default
        this.state.settings.zoom = CONFIG.ZOOM.DEFAULT;
        this.uiController.updateZoomDisplay(this.state.settings.zoom);
    }

    /**
     * Generate monochrome ASCII art
     */
    generateMonochromeASCII(imageData, charDimensions) {
        this.state.asciiText = this.asciiGenerator.generateMonochrome(
            imageData,
            charDimensions.charWidth,
            charDimensions.charHeight,
            this.state.settings
        );
        
        this.state.coloredData = null;
        this.uiController.updateASCIIPreviewText(this.state.asciiText);
        this.updateASCIIDisplay();
    }

    /**
     * Generate colored ASCII art
     */
    generateColoredASCII(imageData, charDimensions) {
        const result = this.asciiGenerator.generateColored(
            imageData,
            charDimensions.charWidth,
            charDimensions.charHeight,
            this.state.settings
        );
        
        this.state.asciiText = result.asciiText;
        this.state.coloredData = result.coloredData;
        
        const fragment = this.asciiGenerator.createColoredHTMLElements(
            this.state.coloredData,
            this.state.settings.fontSize
        );
        
        this.uiController.updateASCIIPreviewHTML(fragment);
        this.updateASCIIDisplay();
    }

    /**
     * Update ASCII display with current zoom and font size
     */
    updateASCIIDisplay() {
        const scaledFontSize = this.state.settings.fontSize * 
                              (this.state.settings.zoom / 100);
        
        this.uiController.updateASCIIFontSize(scaledFontSize);
        
        // Update colored ASCII font size if applicable
        if (this.state.settings.colored && this.state.coloredData) {
            const asciiElement = this.uiController.getASCIIPreviewElement();
            this.asciiGenerator.updateColoredFontSize(asciiElement, scaledFontSize);
        }
    }

    /**
     * Handle image size change
     */
    handleImageSizeChange(event) {
        this.state.settings.imageSize = parseFloat(event.target.value);
        this.uiController.updateImageSizeDisplay(`${event.target.value}x`);
        
        if (this.state.currentImage) {
            this.updateOriginalPreview();
        }
    }

    /**
     * Handle resolution slider change
     */
    handleResolutionChange(event) {
        this.state.settings.resolution = parseInt(event.target.value);
        this.uiController.updateResolutionDisplay(event.target.value);
    }

    /**
     * Handle font size slider change
     */
    handleFontSizeChange(event) {
        this.state.settings.fontSize = parseInt(event.target.value);
        this.uiController.updateFontSizeDisplay(event.target.value);
        this.updateASCIIDisplay();
    }

    /**
     * Handle contrast slider change
     */
    handleContrastChange(event) {
        this.state.settings.contrast = parseFloat(event.target.value);
        this.uiController.updateContrastDisplay(event.target.value);
    }

    /**
     * Handle color toggle change
     */
    handleColorToggle(event) {
        this.state.settings.colored = event.target.checked;
        
        // Regenerate if ASCII art exists
        if (this.state.asciiText) {
            this.handleGenerate();
        }
    }

    /**
     * Handle invert toggle change
     */
    handleInvertToggle(event) {
        this.state.settings.inverted = event.target.checked;
    }

    /**
     * Handle zoom adjustment
     */
    handleZoomAdjustment(delta) {
        this.state.settings.zoom = Math.max(
            CONFIG.ZOOM.MIN,
            Math.min(CONFIG.ZOOM.MAX, this.state.settings.zoom + delta)
        );
        
        this.uiController.updateZoomDisplay(this.state.settings.zoom);
        this.updateASCIIDisplay();
    }

    /**
     * Handle pinch zoom gesture
     */
    handlePinchZoom(newZoom) {
        this.state.settings.zoom = newZoom;
        this.uiController.updateZoomDisplay(this.state.settings.zoom);
        this.updateASCIIDisplay();
    }

    /**
     * Handle fit to view
     */
    handleFitToView() {
        const asciiElement = this.uiController.getASCIIPreviewElement();
        const previewWidth = asciiElement.clientWidth - CONFIG.PREVIEW.PADDING;
        const previewHeight = asciiElement.clientHeight - CONFIG.PREVIEW.PADDING;
        
        if (this.state.asciiText) {
            const lines = this.state.asciiText.split('\n').filter(line => line.length > 0);
            const maxLineLength = Math.max(...lines.map(line => line.length));
            const lineCount = lines.length;
            
            const currentCharWidth = this.state.settings.fontSize * CONFIG.CHAR_ASPECT_RATIO;
            const currentCharHeight = this.state.settings.fontSize;
            
            const totalWidth = maxLineLength * currentCharWidth;
            const totalHeight = lineCount * currentCharHeight;
            
            const widthZoom = (previewWidth / totalWidth) * 100;
            const heightZoom = (previewHeight / totalHeight) * 100;
            
            this.state.settings.zoom = Math.floor(Math.min(widthZoom, heightZoom, 100));
            this.uiController.updateZoomDisplay(this.state.settings.zoom);
            this.updateASCIIDisplay();
            
            // Haptic feedback on mobile
            if (MOBILE_REGEX.test(navigator.userAgent) && navigator.vibrate) {
                navigator.vibrate(CONFIG.NOTIFICATION.VIBRATION_DURATION);
            }
        }
    }

    /**
     * Handle copy to clipboard
     */
    async handleCopyText() {
        try {
            await this.exportService.copyToClipboard(this.state.asciiText);
        } catch (error) {
            this.notificationService.showError(error.message);
        }
    }

    /**
     * Handle download as text
     */
    handleDownloadText() {
        this.exportService.downloadAsText(this.state.asciiText);
    }

    /**
     * Handle download as image
     */
    handleDownloadImage() {
        const scaledDimensions = this.imageProcessor.calculateScaledDimensions(
            this.state.currentImage,
            this.state.settings.imageSize
        );
        
        this.exportService.downloadAsImage(
            this.state.asciiText,
            this.state.coloredData,
            this.state.settings,
            scaledDimensions.width,
            scaledDimensions.height
        );
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new ASCIIDigitizer();
});
