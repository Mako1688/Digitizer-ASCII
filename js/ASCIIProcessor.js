/**
 * ASCIIProcessor - Core ASCII conversion logic
 * Follows Single Responsibility Principle
 */
export class ASCIIProcessor {
    constructor() {
        // ASCII characters arranged by visual density (light to dark)
        this.ASCII_CHARS = ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
    }

    /**
     * Convert image data to ASCII art
     * @param {ImageData} imageData - Canvas image data
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @param {number} pixelSize - Character block size
     * @param {Function} progressCallback - Progress update callback
     * @returns {Promise<Object>} ASCII result object
     */
    async processImageToASCII(imageData, width, height, pixelSize, progressCallback = null) {
        const { data } = imageData;
        const chars = this.ASCII_CHARS;
        const charCount = chars.length - 1;
        
        // Calculate ASCII dimensions
        const asciiWidth = Math.floor(width / pixelSize);
        const asciiHeight = Math.floor(height / pixelSize);
        
        let asciiHTML = '';
        const totalBlocks = asciiWidth * asciiHeight;
        let processedBlocks = 0;
        
        // Process each character block
        for (let y = 0; y < asciiHeight; y++) {
            let rowHTML = '';
            
            for (let x = 0; x < asciiWidth; x++) {
                const charData = this.processPixelBlock(data, x, y, width, height, pixelSize);
                rowHTML += this.createCharacterSpan(charData, chars, charCount);
                processedBlocks++;
            }
            
            asciiHTML += `<div>${rowHTML}</div>`;
            
            // Report progress periodically
            if (y % 20 === 0 && progressCallback) {
                const progress = Math.round((processedBlocks / totalBlocks) * 100);
                progressCallback(progress);
                await this.delay(1);
            }
        }
        
        return {
            html: asciiHTML,
            width: asciiWidth,
            height: asciiHeight,
            pixelSize: pixelSize
        };
    }

    /**
     * Process a single pixel block to extract color and brightness
     */
    processPixelBlock(data, x, y, width, height, pixelSize) {
        let totalR = 0, totalG = 0, totalB = 0, totalA = 0;
        let samplesCount = 0;
        
        // Sample the pixel block
        for (let blockY = y * pixelSize; blockY < Math.min((y + 1) * pixelSize, height); blockY++) {
            for (let blockX = x * pixelSize; blockX < Math.min((x + 1) * pixelSize, width); blockX++) {
                const pixelIndex = (blockY * width + blockX) * 4;
                totalR += data[pixelIndex];
                totalG += data[pixelIndex + 1];
                totalB += data[pixelIndex + 2];
                totalA += data[pixelIndex + 3];
                samplesCount++;
            }
        }
        
        // Return averaged pixel data
        return {
            r: Math.round(totalR / samplesCount),
            g: Math.round(totalG / samplesCount),
            b: Math.round(totalB / samplesCount),
            a: Math.round(totalA / samplesCount)
        };
    }

    /**
     * Create HTML span element for character with styling
     */
    createCharacterSpan(pixelData, chars, charCount) {
        const { r, g, b, a } = pixelData;
        
        // Handle transparent pixels
        if (a < 25) {
            return '<span style="color:transparent">&nbsp;</span>';
        }
        
        // Calculate brightness (luminance)
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        
        // Add slight variation for visual complexity
        const variation = (Math.random() - 0.5) * 0.1;
        const adjustedBrightness = Math.max(0, Math.min(1, brightness + variation));
        
        // Select character based on brightness
        const charIndex = Math.floor(adjustedBrightness * charCount);
        const char = chars[charIndex];
        
        // Create colored span
        const alpha = a / 255;
        const color = `rgba(${r},${g},${b},${alpha})`;
        
        return `<span style="color:${color}">${char}</span>`;
    }

    /**
     * Extract plain text from ASCII HTML
     */
    extractPlainText(asciiHTML) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = asciiHTML;
        return tempDiv.textContent || tempDiv.innerText;
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}