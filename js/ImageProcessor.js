/**
 * ImageProcessor - Handles image loading and canvas operations
 * Follows Single Responsibility Principle
 */
export class ImageProcessor {
    constructor() {
        this.MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
        this.canvas = document.getElementById('imageCanvas');
        this.ctx = this.canvas.getContext('2d');
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
}