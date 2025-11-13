/**
 * ImageProcessor - Handles image loading and canvas operations
 * Follows Single Responsibility Principle
 */
export class ImageProcessor {
    constructor() {
        this.MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
        this.canvas = document.getElementById('imageCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Camera-related properties
        this.stream = null;
        this.videoElement = null;
        this.captureCanvas = null;
        this.captureCtx = null;
    }

    /**
     * Validate uploaded file
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateFile(file) {
        if (!file) {
            return { valid: false, error: 'No file selected.' };
        }

        if (!file.type.startsWith('image/')) {
            return { valid: false, error: 'Please select a valid image file.' };
        }

        if (file.size > this.MAX_FILE_SIZE) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            return { 
                valid: false, 
                error: `File size exceeds 100MB limit. Current size: ${sizeMB}MB` 
            };
        }

        return { valid: true };
    }

    /**
     * Load image from file
     * @param {File} file - Image file to load
     * @returns {Promise<HTMLImageElement>} Loaded image
     */
    async loadImageFromFile(file) {
        const imageUrl = URL.createObjectURL(file);
        return this.loadImageFromUrl(imageUrl);
    }

    /**
     * Load image from URL
     * @param {string} imageUrl - Image URL
     * @returns {Promise<HTMLImageElement>} Loaded image
     */
    async loadImageFromUrl(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = imageUrl;
        });
    }

    /**
     * Get image data from canvas
     * @param {HTMLImageElement} image - Source image
     * @param {number} targetWidth - Target width
     * @param {number} targetHeight - Target height
     * @returns {ImageData} Image data
     */
    getImageData(image, targetWidth, targetHeight) {
        this.canvas.width = targetWidth;
        this.canvas.height = targetHeight;
        
        // Clear canvas and draw image
        this.ctx.clearRect(0, 0, targetWidth, targetHeight);
        this.ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
        
        return this.ctx.getImageData(0, 0, targetWidth, targetHeight);
    }

    /**
     * Calculate scaled dimensions
     * @param {HTMLImageElement} image - Source image
     * @param {number} scale - Scale factor
     * @returns {Object} Scaled dimensions
     */
    calculateScaledDimensions(image, scale) {
        return {
            width: Math.round(image.width * scale),
            height: Math.round(image.height * scale)
        };
    }

    /**
     * Initialize camera elements
     */
    initializeCameraElements() {
        this.videoElement = document.getElementById('videoElement');
        this.captureCanvas = document.getElementById('captureCanvas');
        this.captureCtx = this.captureCanvas.getContext('2d');
    }

    /**
     * Start camera stream
     * @returns {Promise<MediaStream>} Camera stream
     */
    async startCamera() {
        try {
            // Initialize camera elements if not already done
            if (!this.videoElement) {
                this.initializeCameraElements();
            }

            // Request camera access with high quality settings
            const constraints = {
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: 'user' // Default to front camera, can be changed to 'environment' for back camera
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            
            return this.stream;
        } catch (error) {
            throw new Error('Camera access denied or not available: ' + error.message);
        }
    }

    /**
     * Stop camera stream
     */
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
    }

    /**
     * Capture image from camera
     * @returns {Promise<HTMLImageElement>} Captured image
     */
    async captureImageFromCamera() {
        if (!this.videoElement || !this.captureCanvas) {
            throw new Error('Camera elements not initialized');
        }

        // Wait for video to be ready
        if (this.videoElement.videoWidth === 0 || this.videoElement.videoHeight === 0) {
            throw new Error('Camera video not ready');
        }

        // Set canvas dimensions to match video
        const videoWidth = this.videoElement.videoWidth;
        const videoHeight = this.videoElement.videoHeight;
        
        this.captureCanvas.width = videoWidth;
        this.captureCanvas.height = videoHeight;

        // Draw video frame to canvas
        this.captureCtx.drawImage(this.videoElement, 0, 0, videoWidth, videoHeight);

        // Convert canvas to image
        return new Promise((resolve, reject) => {
            this.captureCanvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Failed to capture image'));
                    return;
                }

                const img = new Image();
                img.onload = () => {
                    URL.revokeObjectURL(img.src); // Clean up object URL
                    resolve(img);
                };
                img.onerror = () => reject(new Error('Failed to load captured image'));
                img.src = URL.createObjectURL(blob);
            }, 'image/png');
        });
    }

    /**
     * Check if camera is supported
     * @returns {boolean} Camera support status
     */
    isCameraSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }
}