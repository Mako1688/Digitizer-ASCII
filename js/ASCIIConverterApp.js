/**
 * ASCIIConverterApp - Main application orchestrator
 * Follows Dependency Inversion Principle and coordinates all components
 */
import { ASCIIProcessor } from './ASCIIProcessor.js';
import { ImageProcessor } from './ImageProcessor.js';
import { ExportService } from './ExportService.js';
import { UIController } from './UIController.js';

export class ASCIIConverterApp {
    constructor() {
        // Initialize dependencies (Dependency Injection)
        this.asciiProcessor = new ASCIIProcessor();
        this.imageProcessor = new ImageProcessor();
        this.exportService = new ExportService();
        this.uiController = new UIController();
        
        // Application state
        this.currentImage = null;
        this.currentASCII = null;
        
        this.initialize();
    }

    /**
     * Initialize the application
     */
    initialize() {
        this.setupEventHandlers();
        this.checkCameraSupport();
        this.setupCleanup();
    }

    /**
     * Setup cleanup handlers
     */
    setupCleanup() {
        // Clean up camera when page is closed or refreshed
        window.addEventListener('beforeunload', () => {
            this.imageProcessor.stopCamera();
        });
        
        // Clean up camera when page loses focus (optional)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.imageProcessor.stream) {
                this.handleCameraClose();
            }
        });
    }

    /**
     * Check camera support and update UI accordingly
     */
    checkCameraSupport() {
        if (!this.imageProcessor.isCameraSupported()) {
            this.uiController.disableCameraButton();
        }
    }

    /**
     * Setup event handlers using dependency injection
     */
    setupEventHandlers() {
        const callbacks = {
            onFileUpload: (event) => this.handleFileUpload(event),
            onCameraOpen: () => this.handleCameraOpen(),
            onCapture: () => this.handleCapture(),
            onCameraClose: () => this.handleCameraClose(),
            onGenerate: () => this.handleGenerate(),
            onCopy: () => this.handleCopy(),
            onDownload: () => this.handleDownload(),
            onResize: () => this.handleResize()
        };
        
        this.uiController.setupEventListeners(callbacks);
    }

    /**
     * Handle file upload
     * @param {Event} event - File input change event
     */
    async handleFileUpload(event) {
        const file = this.uiController.getUploadedFile();
        if (!file) return;

        // Validate file
        const validation = this.imageProcessor.validateFile(file);
        if (!validation.valid) {
            this.uiController.showError(validation.error);
            return;
        }

        try {
            // Load image
            this.currentImage = await this.imageProcessor.loadImageFromFile(file);
            
            // Update UI
            this.uiController.displayImagePreview(this.currentImage);
            
        } catch (error) {
            this.uiController.showError('Error loading image. Please try a different file.');
        }
    }

    /**
     * Handle camera open
     */
    async handleCameraOpen() {
        try {
            this.uiController.showCameraLoading();
            
            await this.imageProcessor.startCamera();
            
            this.uiController.showCameraInterface();
            
            // Wait for video to load and enable capture
            const video = this.imageProcessor.videoElement;
            
            // Use a named function to avoid duplicate listeners
            const onVideoReady = () => {
                this.uiController.enableCameraCapture();
                video.removeEventListener('loadedmetadata', onVideoReady);
            };
            
            video.addEventListener('loadedmetadata', onVideoReady);
            
            // Fallback timeout in case loadedmetadata doesn't fire
            setTimeout(() => {
                if (video.videoWidth > 0 && video.videoHeight > 0) {
                    this.uiController.enableCameraCapture();
                }
            }, 2000);
            
        } catch (error) {
            this.uiController.resetCameraButton();
            this.uiController.showError('Camera access denied or not available: ' + error.message);
        }
    }

    /**
     * Handle photo capture from camera
     */
    async handleCapture() {
        try {
            this.currentImage = await this.imageProcessor.captureImageFromCamera();
            
            // Update UI
            this.uiController.displayImagePreview(this.currentImage);
            
            // Close camera after successful capture
            this.handleCameraClose();
            
        } catch (error) {
            this.uiController.showError('Error capturing photo: ' + error.message);
        }
    }

    /**
     * Handle camera close
     */
    handleCameraClose() {
        this.imageProcessor.stopCamera();
        this.uiController.hideCameraInterface();
        this.uiController.resetCameraButton();
    }

    /**
     * Handle ASCII generation
     */
    async handleGenerate() {
        if (!this.currentImage) return;

        const config = this.uiController.getCurrentConfig();
        
        // Calculate target dimensions
        const dimensions = this.imageProcessor.calculateScaledDimensions(
            this.currentImage, 
            config.scale
        );

        try {
            // Update UI to show generation in progress
            this.uiController.setASCIIPreviewState('generating');
            this.uiController.setGenerateButtonState(false);

            // Get image data
            const imageData = this.imageProcessor.getImageData(
                this.currentImage,
                dimensions.width,
                dimensions.height
            );

            // Generate ASCII with progress callback
            const asciiResult = await this.asciiProcessor.processImageToASCII(
                imageData,
                dimensions.width,
                dimensions.height,
                config.pixelSize,
                (progress) => this.uiController.updateProgress(progress)
            );

            // Store result with additional metadata
            this.currentASCII = {
                ...asciiResult,
                scale: config.scale,
                originalWidth: this.currentImage.width,
                originalHeight: this.currentImage.height,
                processedWidth: dimensions.width,
                processedHeight: dimensions.height
            };

            // Update UI
            this.uiController.displayASCIIResult(this.currentASCII);

        } catch (error) {
            this.uiController.setASCIIPreviewState('error');
        } finally {
            this.uiController.setGenerateButtonState(true);
        }
    }

    /**
     * Handle copy to clipboard
     */
    async handleCopy() {
        if (!this.currentASCII) return;

        try {
            await this.exportService.copyToClipboard(this.currentASCII.html);
            this.uiController.showCopySuccess();
        } catch (error) {
            this.uiController.showError('Error copying to clipboard');
        }
    }

    /**
     * Handle download as image
     */
    handleDownload() {
        if (!this.currentASCII) return;

        try {
            const config = this.uiController.getCurrentConfig();
            this.exportService.downloadAsImage(this.currentASCII, config.downloadQuality);
        } catch (error) {
            this.uiController.showError('Error downloading image');
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (this.currentASCII) {
            this.uiController.calculateOptimalFontSize();
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ASCIIConverterApp();
});