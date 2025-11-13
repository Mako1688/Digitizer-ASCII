// ASCII Generator Service
// Single Responsibility: Generate ASCII art from image data (both monochrome and colored)

class ASCIIGeneratorService {
    constructor(characterService, imageProcessor, loadingService = null) {
        this.characterService = characterService;
        this.imageProcessor = imageProcessor;
        this.loadingService = loadingService;
    }

    /**
     * Generate monochrome ASCII art from image data (async with progress)
     * @param {ImageData} imageData - Image data to convert
     * @param {number} width - Width in characters
     * @param {number} height - Height in characters
     * @param {Object} settings - Generation settings (inverted, contrast)
     * @param {HTMLImageElement} originalImage - Original high-res image for multi-sampling
     * @returns {Promise<string>} ASCII art as plain text
     */
    /**
     * Generate monochrome ASCII art from image data (async with progress)
     * @param {ImageData} imageData - Image data to convert
     * @param {number} width - Width in characters
     * @param {number} height - Height in characters
     * @param {Object} settings - Generation settings (inverted, contrast)
     * @param {HTMLImageElement} originalImage - Original high-res image for multi-sampling
     * @returns {Promise<string>} ASCII art as plain text
     */
    async generateMonochrome(imageData, width, height, settings, originalImage = null) {
        if (width <= 0 || height <= 0) {
            console.error('[GENERATOR-MONO] Invalid ASCII dimensions:', width, height);
            throw new Error('Invalid ASCII dimensions');
        }
        
        const { inverted, contrast } = settings;
        let asciiText = '';
        
        const chunkSize = Math.max(1, CONFIG.LOADING.CHUNK_SIZE); // Ensure at least 1
        let totalProcessed = 0;
        
        for (let y = 0; y < height; y += chunkSize) {
            const endY = Math.min(y + chunkSize, height);
            
            // Process chunk
            for (let row = y; row < endY; row++) {
                const line = this.generateMonochromeLineEnhanced(
                    imageData, originalImage, row, width, height, inverted, contrast, settings
                );
                asciiText += line;
                if (row < height - 1) asciiText += '\n';
                totalProcessed++;
            }
            
            // Update progress and yield control
            const progress = (totalProcessed / height) * 100;
            
            if (this.loadingService) {
                this.loadingService.updateProgress(progress, 'Processing line ' + totalProcessed + ' of ' + height);
                await this.loadingService.yield();
            }
            
            // Safety check to prevent infinite loops
            if (totalProcessed >= height) {
                break;
            }
        }
        
        return asciiText;
    }

    /**
     * Generate a single line of enhanced monochrome ASCII
     * @param {ImageData} imageData - Low-res image data
     * @param {HTMLImageElement} originalImage - High-res original image
     * @param {number} y - Y coordinate (row)
     * @param {number} width - Width in characters
     * @param {number} height - Height in characters
     * @param {boolean} inverted - Whether to invert brightness
     * @param {number} contrast - Contrast multiplier
     * @param {Object} settings - Generation settings
     * @returns {string} Single line of ASCII characters
     */
    generateMonochromeLineEnhanced(imageData, originalImage, y, width, height, inverted, contrast, settings = {}) {
        let line = '';
        
        for (let x = 0; x < width; x++) {
            let pixelData;
            
            // Use faster simple sampling by default, only use multi-sampling if explicitly enabled
            if (originalImage && settings.edgeEnhanced) {
                pixelData = this.imageProcessor.multiSampleCharacterCell(
                    imageData, originalImage, x, y, width, height
                );
            } else {
                // Fast path: simple pixel sampling
                const pixel = this.imageProcessor.getPixelData(imageData, x, y, width);
                pixelData = {
                    r: pixel.r, g: pixel.g, b: pixel.b, a: pixel.a,
                    edgeIntensity: 0,
                    isTransparent: pixel.a < 50  // Much lower threshold - only truly transparent pixels
                };
            }
            
            const brightness = this.characterService.rgbToBrightness(pixelData.r, pixelData.g, pixelData.b);
            const adjustedBrightness = this.imageProcessor.applyContrast(brightness, contrast);
            
            // Use faster standard character selection unless edge enhancement is specifically enabled
            let char;
            if (settings.edgeEnhanced && pixelData.edgeIntensity > 0) {
                char = this.characterService.selectEdgeAwareCharacter(
                    adjustedBrightness,
                    pixelData.edgeIntensity,
                    inverted
                );
            } else {
                // Fast path: standard brightness-to-character mapping
                char = this.characterService.brightnessToChar(adjustedBrightness, inverted);
            }
            
            line += char;
        }
        
        return line;
    }

    /**
     * Generate colored ASCII art from image data (async with progress)
     * @param {ImageData} imageData - Image data to convert
     * @param {number} width - Width in characters
     * @param {number} height - Height in characters
     * @param {Object} settings - Generation settings (inverted, contrast, fontSize)
     * @param {HTMLImageElement} originalImage - Original high-res image for multi-sampling
     * @returns {Promise<Object>} Object with coloredData array and asciiText string
     */
    /**
     * Generate colored ASCII art from image data (async with progress)
     * @param {ImageData} imageData - Image data to convert
     * @param {number} width - Width in characters
     * @param {number} height - Height in characters
     * @param {Object} settings - Generation settings (inverted, contrast, fontSize)
     * @param {HTMLImageElement} originalImage - Original high-res image for multi-sampling
     * @returns {Promise<Object>} Object with coloredData array and asciiText string
     */
    async generateColored(imageData, width, height, settings, originalImage = null) {
        console.log('[GENERATOR-COLOR] Starting colored ASCII generation:', width, 'x', height, 'characters');
        console.log('[GENERATOR-COLOR] Input imageData:', imageData.width, 'x', imageData.height, 'pixels');
        console.log('[GENERATOR-COLOR] Settings:', settings);
        
        if (width <= 0 || height <= 0) {
            console.error('[GENERATOR-COLOR] Invalid ASCII dimensions:', width, height);
            throw new Error('Invalid ASCII dimensions');
        }
        
        const { inverted, contrast, fontSize } = settings;
        const coloredData = [];
        let asciiText = '';
        
        // Initialize error diffusion matrix for dithering
        const errorMatrix = {};
        const chunkSize = Math.max(1, CONFIG.LOADING.CHUNK_SIZE); // Ensure at least 1
        let totalProcessed = 0;
        
        for (let y = 0; y < height; y += chunkSize) {
            const endY = Math.min(y + chunkSize, height);
            
            // Process chunk of lines
            for (let row = y; row < endY; row++) {
                const lineResult = this.generateColoredLineEnhanced(
                    imageData, 
                    originalImage,
                    row, 
                    width, 
                    height,
                    inverted, 
                    contrast, 
                    errorMatrix,
                    settings
                );
                coloredData.push(lineResult.lineData);
                
                // Build ASCII text from line data
                const lineText = lineResult.lineData.map(charData => charData.char).join('');
                asciiText += lineText;
                if (row < height - 1) asciiText += '\n';
                totalProcessed++;
            }
            
            // Update progress and yield control
            const progress = (totalProcessed / height) * 100;
            
            if (this.loadingService) {
                this.loadingService.updateProgress(progress, 'Processing colored line ' + totalProcessed + ' of ' + height);
                await this.loadingService.yield();
            }
            
            // Safety check to prevent infinite loops
            if (totalProcessed >= height) {
                break;
            }
        }
        
        return { coloredData, asciiText };
    }

    /**
     * Generate enhanced colored line with multi-sampling and edge detection
     * @param {ImageData} imageData - Low-res image data
     * @param {HTMLImageElement} originalImage - High-res original image
     * @param {number} y - Y coordinate (row)
     * @param {number} width - Width in characters
     * @param {number} height - Height in characters
     * @param {boolean} inverted - Whether to invert brightness
     * @param {number} contrast - Contrast multiplier
     * @param {Object} errorMatrix - Dithering error matrix
     * @param {Object} settings - Generation settings
     * @returns {Object} Object with lineData array containing character and color info
     */
    generateColoredLineEnhanced(imageData, originalImage, y, width, height, inverted, contrast, errorMatrix, settings = {}) {
        const lineData = [];
        
        for (let x = 0; x < width; x++) {
            let pixelData;
            
            // Use faster simple sampling by default, only use multi-sampling if explicitly enabled
            if (originalImage && settings.edgeEnhanced) {
                pixelData = this.imageProcessor.multiSampleCharacterCell(
                    imageData, originalImage, x, y, width, height
                );
            } else {
                // Fast path: simple pixel sampling
                const pixel = this.imageProcessor.getPixelData(imageData, x, y, width);
                pixelData = {
                    r: pixel.r, g: pixel.g, b: pixel.b, a: pixel.a,
                    edgeIntensity: 0,
                    isTransparent: pixel.a < 50  // Much lower threshold - only truly transparent pixels
                };
            }
            
            // Calculate brightness and apply contrast
            const brightness = this.characterService.rgbToBrightness(pixelData.r, pixelData.g, pixelData.b);
            const adjustedBrightness = this.imageProcessor.applyContrast(brightness, contrast);
            
            // Debug logging for dark colors (limit output)
            if (x === 0 && y % 20 === 0 && brightness < 0.2) {
                console.log('[GENERATOR] Dark pixel at', x, y, ':', {
                    rgb: [pixelData.r, pixelData.g, pixelData.b],
                    alpha: pixelData.a,
                    brightness: brightness.toFixed(3),
                    adjustedBrightness: adjustedBrightness.toFixed(3),
                    isTransparent: pixelData.isTransparent
                });
            }
            
            // Special handling for dark colors to ensure they get visible characters
            let char;
            if (pixelData.isTransparent) {
                // Truly transparent pixels get spaces
                char = ' ';
            } else if (settings.edgeEnhanced && pixelData.edgeIntensity > 0) {
                char = this.characterService.selectEdgeAwareCharacter(
                    adjustedBrightness,
                    pixelData.edgeIntensity,
                    inverted
                );
            } else {
                // Fast path: standard brightness-to-character mapping
                char = this.characterService.brightnessToChar(adjustedBrightness, inverted);
            }
            
            // Enhance dark colors for better visibility
            let color = 'rgb(' + pixelData.r + ', ' + pixelData.g + ', ' + pixelData.b + ')';
            
            // For very dark pixels, ensure minimum visibility by brightening slightly
            if (!pixelData.isTransparent && brightness < 0.15) {
                const brightnessFactor = Math.max(1.3, 1 / Math.max(brightness, 0.05));
                const enhancedR = Math.min(255, Math.round(pixelData.r * brightnessFactor));
                const enhancedG = Math.min(255, Math.round(pixelData.g * brightnessFactor));
                const enhancedB = Math.min(255, Math.round(pixelData.b * brightnessFactor));
                color = 'rgb(' + enhancedR + ', ' + enhancedG + ', ' + enhancedB + ')';
            }
            
            lineData.push({
                char: char,
                color: color,
                isTransparent: pixelData.isTransparent,
                isGreenScreen: pixelData.isGreenScreen,
                edgeIntensity: pixelData.edgeIntensity
            });
        }
        
        return { lineData };
    }

    /**
     * Create HTML elements for colored ASCII display
     * @param {Array<Array<Object>>} coloredData - 2D array of character/color data
     * @param {number} fontSize - Font size in pixels
     * @returns {DocumentFragment} Document fragment containing colored ASCII elements
     */
    createColoredHTMLElements(coloredData, fontSize) {
        const fragment = document.createDocumentFragment();
        
        coloredData.forEach(lineData => {
            const lineDiv = this.createColoredLine(lineData, fontSize);
            fragment.appendChild(lineDiv);
        });
        
        return fragment;
    }

    /**
     * Create a single colored line element
     * @param {Array<Object>} lineData - Array of character/color objects
     * @param {number} fontSize - Font size in pixels
     * @returns {HTMLDivElement} Div element containing the colored line
     */
    createColoredLine(lineData, fontSize) {
        const lineDiv = document.createElement('div');
        lineDiv.style.margin = '0';
        lineDiv.style.padding = '0';
        lineDiv.style.lineHeight = `${fontSize}px`;
        lineDiv.style.height = `${fontSize}px`;
        lineDiv.style.whiteSpace = 'nowrap';
        
        lineData.forEach(charData => {
            const span = document.createElement('span');
            span.textContent = charData.char;
            
            // Handle transparency and green screen with special styling
            if (charData.isTransparent || charData.isGreenScreen) {
                span.style.color = 'transparent';
                span.style.backgroundColor = 'transparent';
                // Add a subtle visual indicator for transparent areas during editing
                if (charData.char === ' ') {
                    span.style.background = 'rgba(0, 255, 0, 0.1)'; // Very subtle green tint
                }
            } else {
                span.style.color = charData.color;
                
                // Add subtle glow effect for high-edge characters (video game aesthetic)
                if (charData.edgeIntensity && charData.edgeIntensity > 0.6) {
                    span.style.textShadow = `0 0 2px ${charData.color}`;
                }
            }
            
            lineDiv.appendChild(span);
        });
        
        return lineDiv;
    }

    /**
     * Update font size for existing colored ASCII elements
     * @param {HTMLElement} container - Container element with colored ASCII
     * @param {number} fontSize - New font size in pixels
     */
    updateColoredFontSize(container, fontSize) {
        const divs = container.querySelectorAll('div');
        divs.forEach(div => {
            div.style.lineHeight = `${fontSize}px`;
            div.style.height = `${fontSize}px`;
        });
    }
}
