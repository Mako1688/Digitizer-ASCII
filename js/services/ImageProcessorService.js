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
        console.log('[IMG-PROC] Calculating character dimensions for:', scaledWidth, 'x', scaledHeight);
        console.log('[IMG-PROC] Font size:', fontSize, 'Resolution:', resolution + '%');
        
        const scale = resolution / 100;
        console.log('[IMG-PROC] Resolution scale factor:', scale);
        
        // Ensure we have valid input dimensions
        if (scaledWidth <= 0 || scaledHeight <= 0) {
            console.warn('[IMG-PROC] Invalid image dimensions:', scaledWidth, scaledHeight);
            return { charWidth: 80, charHeight: 60 }; // Fallback dimensions
        }
        
        const aspectRatio = scaledWidth / scaledHeight;
        console.log('[IMG-PROC] Image aspect ratio:', aspectRatio.toFixed(3));
        
        // Calculate character dimensions based on font size and resolution
        // Smaller fonts = more characters for more detail
        const baseCharacterWidth = Math.floor(scaledWidth / (fontSize * 0.6)); // Characters fit based on font width
        const baseCharacterHeight = Math.floor(scaledHeight / fontSize); // Characters fit based on font height
        
        console.log('[IMG-PROC] Base character dimensions from font size:', baseCharacterWidth, 'x', baseCharacterHeight);
        
        // Apply resolution scaling
        let charWidth = Math.floor(baseCharacterWidth * scale);
        let charHeight = Math.floor(baseCharacterHeight * scale);
        
        console.log('[IMG-PROC] After resolution scaling:', charWidth, 'x', charHeight);
        
        // Calculate original aspect ratio to preserve it during bounds checking
        const originalAspectRatio = charWidth / charHeight;
        console.log('[IMG-PROC] Original character aspect ratio:', originalAspectRatio.toFixed(3));
        
        // Apply bounds checking while preserving aspect ratio
        const maxWidth = 500;
        const maxHeight = 300;
        const minWidth = 20;
        const minHeight = 10;
        
        // Check if we need to scale down to fit within bounds
        let scaleDownFactor = 1;
        if (charWidth > maxWidth) {
            scaleDownFactor = Math.min(scaleDownFactor, maxWidth / charWidth);
        }
        if (charHeight > maxHeight) {
            scaleDownFactor = Math.min(scaleDownFactor, maxHeight / charHeight);
        }
        
        // Check if we need to scale up to meet minimum requirements
        let scaleUpFactor = 1;
        if (charWidth < minWidth) {
            scaleUpFactor = Math.max(scaleUpFactor, minWidth / charWidth);
        }
        if (charHeight < minHeight) {
            scaleUpFactor = Math.max(scaleUpFactor, minHeight / charHeight);
        }
        
        // Apply the appropriate scaling factor
        const finalScaleFactor = scaleDownFactor < 1 ? scaleDownFactor : scaleUpFactor;
        
        if (finalScaleFactor !== 1) {
            charWidth = Math.floor(charWidth * finalScaleFactor);
            charHeight = Math.floor(charHeight * finalScaleFactor);
            console.log('[IMG-PROC] Applied proportional scaling factor:', finalScaleFactor.toFixed(3));
        }
        
        console.log('[IMG-PROC] After proportional bounds checking:', charWidth, 'x', charHeight);
        
        // For very small images, ensure we get enough detail
        if (scaledWidth < 200 || scaledHeight < 200) {
            const minDetailWidth = Math.max(charWidth, 60);  // Ensure at least 60 chars width for small images
            const minDetailHeight = Math.max(charHeight, 30); // Ensure at least 30 chars height for small images
            charWidth = minDetailWidth;
            charHeight = minDetailHeight;
            console.log('[IMG-PROC] Small image detail boost applied:', charWidth, 'x', charHeight);
        }
        
        console.log('[IMG-PROC] Final aspect ratio:', (charWidth / charHeight).toFixed(3));
        
        const result = {
            charWidth: charWidth,
            charHeight: charHeight
        };
        
        console.log('[IMG-PROC] Returning character dimensions:', result);
        return result;
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

    /**
     * Multi-sample pixels in a character cell for better color accuracy
     * @param {ImageData} imageData - Source image data
     * @param {HTMLImageElement} originalImage - Original high-res image
     * @param {number} charX - Character X position
     * @param {number} charY - Character Y position
     * @param {number} charWidth - Total characters width
     * @param {number} charHeight - Total characters height
     * @returns {Object} Averaged color and edge data
     */
    multiSampleCharacterCell(imageData, originalImage, charX, charY, charWidth, charHeight) {
        const sampleGrid = CONFIG.ASCII_QUALITY.MULTI_SAMPLE_GRID;
        const cellWidth = originalImage.width / charWidth;
        const cellHeight = originalImage.height / charHeight;
        
        // Create temporary canvas for high-res sampling
        const sampleCanvas = document.createElement('canvas');
        const sampleCtx = sampleCanvas.getContext('2d');
        const sampleSize = Math.max(cellWidth, cellHeight) * sampleGrid;
        
        sampleCanvas.width = sampleSize;
        sampleCanvas.height = sampleSize;
        
        // Extract high-resolution cell
        const srcX = charX * cellWidth;
        const srcY = charY * cellHeight;
        
        sampleCtx.drawImage(
            originalImage,
            srcX, srcY, cellWidth, cellHeight,
            0, 0, sampleSize, sampleSize
        );
        
        const sampleData = sampleCtx.getImageData(0, 0, sampleSize, sampleSize);
        
        // Multi-sample within the cell
        let totalR = 0, totalG = 0, totalB = 0, totalA = 0;
        let edgeIntensity = 0;
        let samples = 0;
        let transparentPixels = 0;
        const totalPixels = sampleGrid * sampleGrid;
        
        for (let sy = 0; sy < sampleSize; sy += Math.floor(sampleSize / sampleGrid)) {
            for (let sx = 0; sx < sampleSize; sx += Math.floor(sampleSize / sampleGrid)) {
                const pixel = this.getPixelData(sampleData, sx, sy, sampleSize);
                
                // Much more lenient transparency detection - only truly transparent pixels
                if (pixel.a > 50) { // Lower threshold for alpha - dark colors are not transparent
                    totalR += pixel.r;
                    totalG += pixel.g;
                    totalB += pixel.b;
                    totalA += pixel.a;
                    samples++;
                    
                    // Calculate local edge intensity
                    edgeIntensity += this.calculateLocalEdgeIntensity(sampleData, sx, sy, sampleSize);
                } else {
                    transparentPixels++;
                }
            }
        }
        
        if (samples === 0) {
            return {
                r: 0, g: 0, b: 0, a: 0,
                edgeIntensity: 0,
                isTransparent: true
            };
        }

        const avgColor = {
            r: Math.round(totalR / samples),
            g: Math.round(totalG / samples),
            b: Math.round(totalB / samples),
            a: Math.round(totalA / samples)
        };

        // Only consider transparent if majority of pixels are actually transparent
        const transparencyRatio = transparentPixels / totalPixels;
        const isTransparent = transparencyRatio > 0.7; // 70% threshold for transparency

        return {
            ...avgColor,
            edgeIntensity: edgeIntensity / samples,
            isTransparent: isTransparent
        };
    }    /**
     * Calculate edge intensity using Sobel operator
     * @param {ImageData} imageData - Image data
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Image width
     * @returns {number} Edge intensity (0-1)
     */
    calculateLocalEdgeIntensity(imageData, x, y, width) {
        const sobelX = CONFIG.ASCII_QUALITY.EDGE_DETECTION.SOBEL_KERNEL;
        const sobelY = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];
        
        let gx = 0, gy = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
                const px = Math.max(0, Math.min(width - 1, x + kx));
                const py = Math.max(0, Math.min(imageData.height - 1, y + ky));
                
                const pixel = this.getPixelData(imageData, px, py, width);
                const brightness = (0.299 * pixel.r + 0.587 * pixel.g + 0.114 * pixel.b) / 255;
                
                gx += brightness * sobelX[ky + 1][kx + 1];
                gy += brightness * sobelY[ky + 1][kx + 1];
            }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        return Math.min(1, magnitude);
    }

    /**
     * Convert RGB to HSV
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {Object} HSV object with h, s, v properties
     */
    rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        let h = 0;
        if (delta !== 0) {
            switch (max) {
                case r: h = 60 * ((g - b) / delta % 6); break;
                case g: h = 60 * ((b - r) / delta + 2); break;
                case b: h = 60 * ((r - g) / delta + 4); break;
            }
        }
        
        const s = max === 0 ? 0 : delta / max;
        const v = max;
        
        return { h: h < 0 ? h + 360 : h, s, v };
    }

    /**
     * Quantize color to terminal palette with dithering
     * @param {Object} color - Original RGB color
     * @param {number} x - X position for dithering
     * @param {number} y - Y position for dithering
     * @param {Array} errorMatrix - Accumulated error for dithering
     * @returns {Object} Quantized color and error
     */
    quantizeColorWithDithering(color, x, y, errorMatrix) {
        // Apply accumulated error from previous pixels
        const ditheredR = Math.max(0, Math.min(255, color.r + (errorMatrix[y] && errorMatrix[y][x] ? errorMatrix[y][x].r : 0)));
        const ditheredG = Math.max(0, Math.min(255, color.g + (errorMatrix[y] && errorMatrix[y][x] ? errorMatrix[y][x].g : 0)));
        const ditheredB = Math.max(0, Math.min(255, color.b + (errorMatrix[y] && errorMatrix[y][x] ? errorMatrix[y][x].b : 0)));
        
        // Find closest terminal color
        const quantizedColor = this.findClosestTerminalColor({ r: ditheredR, g: ditheredG, b: ditheredB });
        
        // Calculate quantization error
        const error = {
            r: ditheredR - quantizedColor.r,
            g: ditheredG - quantizedColor.g,
            b: ditheredB - quantizedColor.b
        };
        
        // Distribute error using Floyd-Steinberg dithering
        this.distributeError(error, x, y, errorMatrix);
        
        return quantizedColor;
    }

    /**
     * Find closest color in terminal palette
     * @param {Object} color - RGB color to match
     * @returns {Object} Closest terminal color
     */
    findClosestTerminalColor(color) {
        let minDistance = Infinity;
        let closestColor = CONFIG.TERMINAL_COLORS[0];
        
        for (const terminalColor of CONFIG.TERMINAL_COLORS) {
            const distance = Math.sqrt(
                Math.pow(color.r - terminalColor[0], 2) +
                Math.pow(color.g - terminalColor[1], 2) +
                Math.pow(color.b - terminalColor[2], 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = terminalColor;
            }
        }
        
        return {
            r: closestColor[0],
            g: closestColor[1],
            b: closestColor[2]
        };
    }

    /**
     * Distribute quantization error for dithering
     * @param {Object} error - RGB error values
     * @param {number} x - Current X position
     * @param {number} y - Current Y position
     * @param {Array} errorMatrix - Error accumulation matrix
     */
    distributeError(error, x, y, errorMatrix) {
        const { ERROR_DIFFUSION_MATRIX, INTENSITY } = CONFIG.ASCII_QUALITY.DITHERING;
        
        for (let dy = 0; dy < ERROR_DIFFUSION_MATRIX.length; dy++) {
            for (let dx = 0; dx < ERROR_DIFFUSION_MATRIX[dy].length; dx++) {
                const factor = ERROR_DIFFUSION_MATRIX[dy][dx] * INTENSITY;
                if (factor > 0) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (!errorMatrix[ny]) errorMatrix[ny] = {};
                    if (!errorMatrix[ny][nx]) errorMatrix[ny][nx] = { r: 0, g: 0, b: 0 };
                    
                    errorMatrix[ny][nx].r += error.r * factor;
                    errorMatrix[ny][nx].g += error.g * factor;
                    errorMatrix[ny][nx].b += error.b * factor;
                }
            }
        }
    }
}
