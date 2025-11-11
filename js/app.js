// ASCII Image Digitizer - Main Application
// Coordinates all services using dependency injection
// Follows SOLID principles: Single Responsibility, Dependency Inversion

class ASCIIDigitizer {
    constructor() {
        // Initialize services with dependency injection
        this.notificationService = new NotificationService();
        this.characterService = new ASCIICharacterService();
        this.imageProcessor = new ImageProcessorService();
        this.gifParser = new GIFParserService();
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
            settings: { ...CONFIG.DEFAULT_SETTINGS },
            // GIF-specific state
            isGIF: false,
            gifData: null,
            gifFrames: [],
            currentFrameIndex: 0,
            animationId: null,
            isPlaying: false
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
            onDownloadGif: () => this.handleDownloadGif(),
            onDownloadFrames: () => this.handleDownloadFrames(),
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
            // Check if file is a GIF
            console.log('[DEBUG] File uploaded:', file.name, 'Type:', file.type);
            const isGIF = this.gifParser.isGIF(file);
            console.log('[DEBUG] Is GIF?', isGIF);
            
            if (isGIF) {
                console.log('[DEBUG] Calling handleGIFUpload...');
                await this.handleGIFUpload(file);
            } else {
                console.log('[DEBUG] Loading as static image...');
                const dataUrl = await this.imageProcessor.readFileAsDataURL(file);
                await this.loadImage(dataUrl);
            }
        } catch (error) {
            console.error('File upload error:', error);
            this.notificationService.showError('Failed to load image file');
        }
    }

    /**
     * Handle GIF file upload
     * @param {File} file - GIF file
     */
    async handleGIFUpload(file) {
        try {
            console.log('[DEBUG] handleGIFUpload started for:', file.name);
            
            // Show warning for large files
            if (this.gifParser.isLargeFile(file)) {
                const fileSize = this.gifParser.formatFileSize(file.size);
                console.log('[DEBUG] Large file warning:', fileSize);
                this.notificationService.show(
                    `Large GIF file detected (${fileSize}). Processing may take time...`
                );
            }
            
            // Parse GIF and extract all frames
            this.notificationService.show('Extracting GIF frames...');
            console.log('[DEBUG] Starting GIF parsing...');
            const gifData = await this.gifParser.parseGIF(file);
            console.log('[DEBUG] GIF parsed successfully:', gifData);
            console.log('[DEBUG] Frame count:', gifData.frameCount);
            console.log('[DEBUG] Is animated:', gifData.isAnimated);
            
            // Store GIF data
            this.state.isGIF = true;
            this.state.gifData = gifData;
            this.state.gifFrames = gifData.frames;
            this.state.currentFrameIndex = 0;
            console.log('[DEBUG] State updated with', gifData.frames.length, 'frames');
            
            // Load first frame as current image
            const firstFrame = gifData.frames[0];
            console.log('[DEBUG] Loading first frame...');
            const image = await this.imageProcessor.loadImage(firstFrame.dataUrl);
            this.state.currentImage = image;
            this.state.currentImageUrl = firstFrame.dataUrl;
            
            // Create and display thumbnail
            console.log('[DEBUG] Creating thumbnail...');
            const thumbnail = await this.gifParser.createThumbnail(firstFrame);
            
            // Update UI with GIF info
            console.log('[DEBUG] Showing GIF info panel...');
            this.uiController.showGIFInfo({
                isAnimated: gifData.isAnimated,
                width: gifData.width,
                height: gifData.height,
                frameCount: gifData.frameCount,
                fileSize: this.gifParser.formatFileSize(gifData.fileSize),
                thumbnail: thumbnail,
                showWarning: this.gifParser.isLargeFile(file)
            });
            
            this.updateOriginalPreview();
            
            // Start original GIF preview animation if animated
            if (gifData.isAnimated) {
                this.startOriginalGIFPreview();
            }
            
            this.uiController.setGenerateButtonEnabled(true);
            
            this.notificationService.show(
                `GIF loaded successfully! ${gifData.frameCount} frames detected.`
            );
            console.log('[DEBUG] GIF upload complete!');
        } catch (error) {
            console.error('[ERROR] GIF upload error:', error);
            console.error('[ERROR] Error stack:', error.stack);
            this.notificationService.showError('Failed to load GIF file');
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
        
        // Stop any existing animation
        this.stopAnimation();
        
        if (this.state.isGIF && this.state.gifFrames.length > 1) {
            // Generate ASCII for all GIF frames
            this.generateGIFASCII();
        } else {
            // Generate single frame ASCII
            this.generateSingleFrameASCII();
        }
        
        // Enable export and zoom controls
        this.uiController.setExportButtonsEnabled(true);
        this.uiController.setZoomControlsEnabled(true);
        
        // Reset zoom to default
        this.state.settings.zoom = CONFIG.ZOOM.DEFAULT;
        this.uiController.updateZoomDisplay(this.state.settings.zoom);
    }

    /**
     * Generate ASCII for single image
     */
    generateSingleFrameASCII() {
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
    }

    /**
     * Generate ASCII for all GIF frames
     */
    async generateGIFASCII() {
        this.notificationService.show(
            `Processing ${this.state.gifFrames.length} frames...`
        );
        
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
        
        // Generate ASCII for each frame
        const asciiFrames = [];
        
        for (let i = 0; i < this.state.gifFrames.length; i++) {
            const frame = this.state.gifFrames[i];
            const imageData = frame.imageData;
            
            if (this.state.settings.colored) {
                const result = this.asciiGenerator.generateColored(
                    imageData,
                    charDimensions.charWidth,
                    charDimensions.charHeight,
                    this.state.settings
                );
                asciiFrames.push({
                    coloredData: result.coloredData,
                    asciiText: result.asciiText,
                    delay: frame.delay || CONFIG.GIF.DEFAULT_FRAME_DELAY
                });
            } else {
                const asciiText = this.asciiGenerator.generateMonochrome(
                    imageData,
                    charDimensions.charWidth,
                    charDimensions.charHeight,
                    this.state.settings
                );
                asciiFrames.push({
                    asciiText: asciiText,
                    delay: frame.delay || CONFIG.GIF.DEFAULT_FRAME_DELAY
                });
            }
        }
        
        // Store ASCII frames
        this.state.asciiFrames = asciiFrames;
        this.state.currentFrameIndex = 0;
        
        // Display first frame
        this.displayFrame(0);
        
        // Show frame counter
        this.uiController.showFrameCounter(this.state.gifFrames.length);
        this.uiController.updateFrameCounter(1, this.state.gifFrames.length);
        
        // Show GIF export options
        this.uiController.showGIFExportOptions();
        
        // Start animation
        this.startAnimation();
        
        this.notificationService.show('GIF ASCII art generated successfully!');
    }

    /**
     * Display a specific frame of the animation
     * @param {number} frameIndex - Index of frame to display
     */
    displayFrame(frameIndex) {
        const frame = this.state.asciiFrames[frameIndex];
        
        if (this.state.settings.colored && frame.coloredData) {
            const fragment = this.asciiGenerator.createColoredHTMLElements(
                frame.coloredData,
                this.state.settings.fontSize
            );
            this.uiController.updateASCIIPreviewHTML(fragment);
            this.state.coloredData = frame.coloredData;
        } else {
            this.uiController.updateASCIIPreviewText(frame.asciiText);
            this.state.coloredData = null;
        }
        
        this.state.asciiText = frame.asciiText;
        this.updateASCIIDisplay();
        
        // Update frame counter
        this.uiController.updateFrameCounter(
            frameIndex + 1,
            this.state.gifFrames.length
        );
    }

    /**
     * Start animation playback
     */
    startAnimation() {
        if (this.state.isPlaying || !this.state.asciiFrames) return;
        
        this.state.isPlaying = true;
        this.state.currentFrameIndex = 0;
        
        const playNextFrame = () => {
            if (!this.state.isPlaying) return;
            
            const frame = this.state.asciiFrames[this.state.currentFrameIndex];
            this.displayFrame(this.state.currentFrameIndex);
            
            // Move to next frame
            this.state.currentFrameIndex = 
                (this.state.currentFrameIndex + 1) % this.state.asciiFrames.length;
            
            // Schedule next frame
            const delay = Math.max(
                CONFIG.GIF.MIN_FRAME_DELAY,
                Math.min(CONFIG.GIF.MAX_FRAME_DELAY, frame.delay)
            );
            
            this.state.animationId = setTimeout(playNextFrame, delay);
        };
        
        playNextFrame();
    }

    /**
     * Stop animation playback
     */
    stopAnimation() {
        if (this.state.animationId) {
            clearTimeout(this.state.animationId);
            this.state.animationId = null;
        }
        this.state.isPlaying = false;
    }

    /**
     * Start original GIF preview animation
     */
    startOriginalGIFPreview() {
        if (!this.state.gifFrames || this.state.gifFrames.length <= 1) return;
        
        // Stop any existing preview animation
        this.stopOriginalGIFPreview();
        
        let previewFrameIndex = 0;
        
        const playNextPreviewFrame = () => {
            const frame = this.state.gifFrames[previewFrameIndex];
            
            // Update the original preview image
            const originalPreview = document.querySelector('.image-preview img');
            if (originalPreview) {
                originalPreview.src = frame.dataUrl;
            }
            
            // Move to next frame
            previewFrameIndex = (previewFrameIndex + 1) % this.state.gifFrames.length;
            
            // Schedule next frame
            this.state.previewAnimationId = setTimeout(playNextPreviewFrame, frame.delay);
        };
        
        playNextPreviewFrame();
    }

    /**
     * Stop original GIF preview animation
     */
    stopOriginalGIFPreview() {
        if (this.state.previewAnimationId) {
            clearTimeout(this.state.previewAnimationId);
            this.state.previewAnimationId = null;
        }
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

    /**
     * Handle download as animated GIF
     */
    async handleDownloadGif() {
        if (!this.state.isGIF || !this.state.asciiFrames) {
            this.notificationService.showError('No GIF animation to export');
            return;
        }
        
        try {
            this.notificationService.show('Generating animated GIF... This may take a moment.');
            
            await this.exportService.downloadAsGIF(
                this.state.asciiFrames,
                this.state.settings,
                this.state.gifData.width,
                this.state.gifData.height
            );
        } catch (error) {
            console.error('GIF export error:', error);
            this.notificationService.showError('Failed to export animated GIF');
        }
    }

    /**
     * Handle download all frames as ZIP
     */
    async handleDownloadFrames() {
        if (!this.state.isGIF || !this.state.asciiFrames) {
            this.notificationService.showError('No GIF frames to export');
            return;
        }
        
        try {
            this.notificationService.show(`Preparing ${this.state.asciiFrames.length} frames for download...`);
            
            await this.exportService.downloadFramesAsZip(
                this.state.asciiFrames,
                this.state.settings,
                this.state.gifData.width,
                this.state.gifData.height
            );
        } catch (error) {
            console.error('Frames export error:', error);
            this.notificationService.showError('Failed to export frames');
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new ASCIIDigitizer();
});
