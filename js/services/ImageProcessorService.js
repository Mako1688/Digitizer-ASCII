// Image Processor Service
// Single Responsibility: Handle all image loading, scaling, and canvas operations

class ImageProcessorService {
    constructor() {
        this.canvas = document.getElementById('imageCanvas');
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Load an image from a data URL
     * @param {string} dataUrl - Image data URL
     * @returns {Promise<HTMLImageElement>} Promise resolving to loaded image
     */
    loadImage(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    /**
     * Validate if a file is a valid image type
     * @param {File} file - File to validate
     * @returns {boolean} True if valid image type
     */
    isValidImageType(file) {
        return CONFIG.VALID_IMAGE_TYPES.includes(file.type);
    }

    /**
     * Read a file as data URL
     * @param {File} file - File to read
     * @returns {Promise<string>} Promise resolving to data URL
     */
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Calculate scaled dimensions for an image
     * @param {HTMLImageElement} image - Source image
     * @param {number} scale - Scale factor
     * @returns {Object} Object with width and height properties
     */
    calculateScaledDimensions(image, scale) {
        return {
            width: Math.floor(image.width * scale),
            height: Math.floor(image.height * scale)
        };
    }

    /**
     * Calculate character grid dimensions based on image size and settings
     * @param {number} scaledWidth - Scaled image width
     * @param {number} scaledHeight - Scaled image height
     * @param {number} fontSize - Font size in pixels
     * @param {number} resolution - Resolution percentage (50-200)
     * @returns {Object} Object with charWidth and charHeight properties
     */
    calculateCharacterDimensions(scaledWidth, scaledHeight, fontSize, resolution) {
        const scale = resolution / 100;
        const charAspectRatio = CONFIG.CHAR_ASPECT_RATIO;
        
        return {
            charWidth: Math.floor(scaledWidth / (fontSize * charAspectRatio) * scale),
            charHeight: Math.floor(scaledHeight / fontSize * scale)
        };
    }

    /**
     * Process image to character-sized canvas and get image data
     * @param {HTMLImageElement} image - Source image
     * @param {number} charWidth - Width in characters
     * @param {number} charHeight - Height in characters
     * @returns {ImageData} Canvas image data
     */
    processImageToCharacterSize(image, charWidth, charHeight) {
        this.canvas.width = charWidth;
        this.canvas.height = charHeight;
        
        // Draw image scaled to character dimensions
        this.ctx.drawImage(image, 0, 0, charWidth, charHeight);
        
        return this.ctx.getImageData(0, 0, charWidth, charHeight);
    }

    /**
     * Apply contrast adjustment to a normalized value (0-1)
     * @param {number} value - Input value (0-1)
     * @param {number} contrast - Contrast multiplier
     * @returns {number} Adjusted value (0-1)
     */
    applyContrast(value, contrast) {
        const { MULTIPLIER, OFFSET, CENTER } = CONFIG.CONTRAST_FORMULA;
        const factor = (MULTIPLIER * (contrast * OFFSET + OFFSET)) / 
                      (OFFSET * (MULTIPLIER - contrast * OFFSET));
        
        const adjusted = factor * (value - CENTER) + CENTER;
        return Math.max(0, Math.min(1, adjusted));
    }

    /**
     * Capture image from video element
     * @param {HTMLVideoElement} videoElement - Video element to capture from
     * @returns {string} Data URL of captured image
     */
    captureFromVideo(videoElement) {
        this.canvas.width = videoElement.videoWidth;
        this.canvas.height = videoElement.videoHeight;
        
        this.ctx.drawImage(videoElement, 0, 0);
        
        return this.canvas.toDataURL('image/png');
    }

    /**
     * Get pixel data at specific coordinates
     * @param {ImageData} imageData - Image data to query
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Image width
     * @returns {Object} Object with r, g, b, a properties
     */
    getPixelData(imageData, x, y, width) {
        const offset = (y * width + x) * 4;
        return {
            r: imageData.data[offset],
            g: imageData.data[offset + 1],
            b: imageData.data[offset + 2],
            a: imageData.data[offset + 3]
        };
    }
}
