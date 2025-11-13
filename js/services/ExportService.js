// Export Service
// Single Responsibility: Handle all export operations (copy, download text, download image)

class ExportService {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Copy ASCII text to clipboard
     * @param {string} asciiText - ASCII art text to copy
     * @returns {Promise<void>}
     */
    async copyToClipboard(asciiText) {
        try {
            await navigator.clipboard.writeText(asciiText);
            this.notificationService.show('ASCII art copied to clipboard successfully!');
        } catch (error) {
            console.error('Failed to copy:', error);
            throw new Error('Failed to copy to clipboard. Please try again.');
        }
    }

    /**
     * Download ASCII art as text file
     * @param {string} asciiText - ASCII art text to download
     */
    downloadAsText(asciiText) {
        const blob = new Blob([asciiText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const filename = this.generateFilename('txt');
        
        this.triggerDownload(url, filename);
        URL.revokeObjectURL(url);
        
        this.notificationService.show('Text file saved successfully!');
    }

    /**
     * Download ASCII art as PNG image
     * @param {string} asciiText - ASCII art text
     * @param {Array<Array<Object>>} coloredData - Colored ASCII data (optional)
     * @param {Object} settings - Export settings
     * @param {number} scaledWidth - Target image width
     * @param {number} scaledHeight - Target image height
     * @param {Object} charDimensions - Character grid dimensions from generation
     */
    downloadAsImage(asciiText, coloredData, settings, scaledWidth, scaledHeight, charDimensions) {
        console.log('[EXPORT] Starting image download...');
        console.log('[EXPORT] Input parameters:', {
            scaledWidth,
            scaledHeight,
            settings,
            asciiTextLength: asciiText.length,
            hasColoredData: !!coloredData
        });

        const canvas = this.createCanvasForExport(
            asciiText, 
            coloredData, 
            settings, 
            scaledWidth, 
            scaledHeight,
            charDimensions
        );
        
        console.log('[EXPORT] Canvas created:', {
            actualWidth: canvas.width,
            actualHeight: canvas.height,
            styleWidth: canvas.style.width,
            styleHeight: canvas.style.height,
            devicePixelRatio: window.devicePixelRatio || 1
        });
        
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const filename = this.generateFilename('png');
            
            console.log('[EXPORT] Blob created:', {
                filename,
                blobSize: blob.size,
                reportedDimensions: `${scaledWidth}x${scaledHeight}`,
                actualCanvasDimensions: `${canvas.width}x${canvas.height}`
            });

            this.triggerDownload(url, filename);
            URL.revokeObjectURL(url);
            
            this.notificationService.show(
                `Image saved successfully! (${canvas.width}x${canvas.height}px)`
            );
        });
    }

    /**
     * Create canvas with rendered ASCII art for export
     * @param {string} asciiText - ASCII art text
     * @param {Array<Array<Object>>} coloredData - Colored ASCII data (optional)
     * @param {Object} settings - Export settings (colored, imageSize)
     * @param {number} scaledWidth - Target image width
     * @param {number} scaledHeight - Target image height
     * @param {Object} charDimensions - Character grid dimensions from generation
     * @returns {HTMLCanvasElement} Canvas with rendered ASCII art
     */
    createCanvasForExport(asciiText, coloredData, settings, scaledWidth, scaledHeight, charDimensions) {
        console.log('[EXPORT] Creating canvas for export...');
        console.log('[EXPORT] Target dimensions:', { scaledWidth, scaledHeight });
        console.log('[EXPORT] Character dimensions:', charDimensions);

        // Create high-resolution canvas for crisp rendering
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2); // Limit to 2x for performance
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set logical canvas size with high-DPI support
        canvas.width = scaledWidth * pixelRatio;
        canvas.height = scaledHeight * pixelRatio;
        
        // Set display size for proper scaling
        canvas.style.width = scaledWidth + 'px';
        canvas.style.height = scaledHeight + 'px';
        
        // Scale context to match pixel ratio for crisp rendering
        ctx.scale(pixelRatio, pixelRatio);
        
        console.log('[EXPORT] Canvas created with pixel ratio:', { 
            pixelRatio, 
            physicalSize: `${canvas.width}x${canvas.height}`,
            logicalSize: `${scaledWidth}x${scaledHeight}`
        });
        
        // Use the character dimensions from ASCII generation, not the text parsing
        // This ensures we scale based on what was actually generated
        const charWidth = charDimensions.charWidth;
        const charHeight = charDimensions.charHeight;
        
        // Define target content coverage (percentage of canvas the ASCII should fill)
        const TARGET_COVERAGE_WIDTH = 0.90;  // 90% width coverage
        const TARGET_COVERAGE_HEIGHT = 0.90; // 90% height coverage
        
        // Calculate font size to achieve target coverage
        // We want the ASCII content to fill a specific percentage of the canvas
        const charWidthRatio = 0.6; // Monospace character width
        const lineHeightRatio = 1.2; // Line spacing
        
        // Calculate font sizes needed for target coverage
        const fontSizeForWidthCoverage = (scaledWidth * TARGET_COVERAGE_WIDTH) / (charWidth * charWidthRatio);
        const fontSizeForHeightCoverage = (scaledHeight * TARGET_COVERAGE_HEIGHT) / (charHeight * lineHeightRatio);
        
        // Use the smaller font size to ensure both dimensions fit within target coverage
        let fontSize = Math.min(fontSizeForWidthCoverage, fontSizeForHeightCoverage);
        
        // Apply reasonable bounds but allow much larger sizes for high-res exports
        const minFontSize = 8;
        const maxFontSize = Math.max(200, scaledWidth / 8); // Increased max for better scaling
        fontSize = Math.max(minFontSize, Math.min(maxFontSize, fontSize));
        
        // Ensure font size is integer for crisp rendering
        fontSize = Math.round(fontSize);
        
        console.log('[EXPORT] Font size calculation for target coverage:', {
            charGridWidth: charWidth,
            charGridHeight: charHeight,
            targetCanvas: `${scaledWidth}x${scaledHeight}`,
            targetCoverage: `${(TARGET_COVERAGE_WIDTH*100).toFixed(0)}%x${(TARGET_COVERAGE_HEIGHT*100).toFixed(0)}%`,
            fontSizeForWidthCoverage: fontSizeForWidthCoverage.toFixed(2),
            fontSizeForHeightCoverage: fontSizeForHeightCoverage.toFixed(2),
            selectedFontSize: fontSize,
            minBound: minFontSize,
            maxBound: maxFontSize,
            pixelRatio
        });
        
        // Calculate actual content dimensions with this font size
        const actualContentWidth = charWidth * fontSize * charWidthRatio;
        const actualContentHeight = charHeight * fontSize * lineHeightRatio;
        
        // Center the content on the canvas
        const offsetX = (scaledWidth - actualContentWidth) / 2;
        const offsetY = (scaledHeight - actualContentHeight) / 2;
        
        console.log('[EXPORT] Content positioning:', {
            actualContentWidth: actualContentWidth.toFixed(2),
            actualContentHeight: actualContentHeight.toFixed(2),
            offsetX: offsetX.toFixed(2),
            offsetY: offsetY.toFixed(2),
            canvasSize: `${scaledWidth}x${scaledHeight}`,
            contentFillRatio: {
                width: (actualContentWidth / scaledWidth * 100).toFixed(1) + '%',
                height: (actualContentHeight / scaledHeight * 100).toFixed(1) + '%'
            }
        });
        
        // Set background
        ctx.fillStyle = CONFIG.CANVAS.BACKGROUND_COLOR;
        ctx.fillRect(0, 0, scaledWidth, scaledHeight);
        
        // Critical settings for crisp, sharp text rendering
        this.setupCrispTextRendering(ctx, fontSize);
        
        console.log('[EXPORT] Canvas setup complete:', {
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            fontSize,
            font: ctx.font,
            renderingOptimizations: 'Applied'
        });

        // Render ASCII art with proper positioning
        if (settings.colored && coloredData && coloredData.length > 0) {
            console.log('[EXPORT] Rendering colored ASCII...');
            this.renderColoredASCII(ctx, coloredData, fontSize, offsetX, offsetY);
        } else {
            console.log('[EXPORT] Rendering monochrome ASCII...');
            this.renderMonochromeASCII(ctx, asciiText, fontSize, offsetX, offsetY);
        }
        
        return canvas;
    }

    /**
     * Setup optimal canvas context properties for crisp text rendering
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} fontSize - Font size in pixels
     */
    setupCrispTextRendering(ctx, fontSize) {
        // Disable all smoothing and anti-aliasing for pixel-perfect rendering
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.oImageSmoothingEnabled = false;
        
        // Set high-quality text rendering properties
        ctx.textRenderingOptimization = 'optimizeSpeed'; // Prioritize sharpness over smoothness
        if (ctx.fontKerning) ctx.fontKerning = 'none'; // Disable kerning for monospace consistency
        
        // Use integer font size and ensure font is loaded
        const integerFontSize = Math.round(fontSize);
        
        // Use high-quality monospace fonts with explicit font loading
        const fontFamilies = [
            '"SF Mono"', // macOS system font
            '"Cascadia Code"', // Windows Terminal font  
            '"Fira Code"', // Popular programming font
            '"Courier New"', // Fallback
            '"Monaco"', // macOS fallback
            '"Menlo"', // macOS fallback
            '"Consolas"', // Windows fallback
            'monospace' // Ultimate fallback
        ];
        
        ctx.font = `${integerFontSize}px ${fontFamilies.join(', ')}`;
        
        // Set precise text alignment
        ctx.textBaseline = 'top'; // Most predictable baseline
        ctx.textAlign = 'left';
        
        // Don't translate for high-DPI contexts as pixel alignment is handled differently
        // The scaling already handles pixel-perfect alignment
        
        console.log('[EXPORT] Text rendering setup:', {
            fontSize: integerFontSize,
            font: ctx.font,
            smoothing: false,
            fontFamilies: fontFamilies.length,
            optimization: 'crisp'
        });
    }

    /**
     * Calculate optimal font size to fit ASCII art in dimensions
     * @param {string} asciiText - ASCII art text
     * @param {number} width - Target width
     * @param {number} height - Target height
     * @returns {number} Optimal font size in pixels
     */
    calculateOptimalFontSize(asciiText, width, height) {
        const lines = asciiText.split('\n').filter(line => line.length > 0);
        const maxLineLength = Math.max(...lines.map(line => line.length));
        
        console.log('[EXPORT] Font size calculation:', {
            totalLines: lines.length,
            maxLineLength,
            targetWidth: width,
            targetHeight: height
        });
        
        // Use proper monospace character width ratio (0.6 is typical for monospace fonts)
        const charWidthRatio = 0.6;
        const lineHeightRatio = 1.2;
        
        const fontSizeByWidth = width / (maxLineLength * charWidthRatio);
        const fontSizeByHeight = height / (lines.length * lineHeightRatio);
        
        let optimalFontSize = Math.min(fontSizeByWidth, fontSizeByHeight);
        
        // Ensure minimum font size for readability (12px minimum)
        const minFontSize = 12;
        const maxFontSize = 48; // Also cap maximum to prevent huge fonts
        
        optimalFontSize = Math.max(minFontSize, Math.min(maxFontSize, optimalFontSize));
        
        console.log('[EXPORT] Font size calculation results:', {
            charWidthRatio,
            lineHeightRatio,
            fontSizeByWidth: fontSizeByWidth.toFixed(2),
            fontSizeByHeight: fontSizeByHeight.toFixed(2),
            rawOptimal: Math.min(fontSizeByWidth, fontSizeByHeight).toFixed(2),
            finalOptimal: optimalFontSize,
            minEnforced: minFontSize,
            maxEnforced: maxFontSize
        });
        
        return optimalFontSize;
    }

    /**
     * Render colored ASCII art to canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array<Array<Object>>} coloredData - Colored ASCII data
     * @param {number} fontSize - Font size in pixels
     * @param {number} offsetX - X offset for centering
     * @param {number} offsetY - Y offset for centering
     */
    renderColoredASCII(ctx, coloredData, fontSize, offsetX = 0, offsetY = 0) {
        const charWidth = fontSize * 0.6; // Proper monospace character width
        const lineHeight = fontSize * 1.2; // Line spacing
        
        console.log('[EXPORT] Rendering colored ASCII with:', {
            fontSize,
            charWidth,
            lineHeight,
            offsetX: offsetX.toFixed(2),
            offsetY: offsetY.toFixed(2),
            totalLines: coloredData.length,
            firstLineLength: coloredData[0]?.length || 0
        });
        
        coloredData.forEach((lineData, lineIndex) => {
            lineData.forEach((charData, charIndex) => {
                if (charData.char && charData.char.trim()) { // Only render non-whitespace
                    ctx.fillStyle = charData.color;
                    
                    // Calculate pixel-aligned position for crisp rendering
                    const x = Math.round(offsetX + charIndex * charWidth);
                    const y = Math.round(offsetY + lineIndex * lineHeight);
                    
                    // Render with crisp positioning
                    ctx.fillText(charData.char, x, y);
                }
            });
        });
        
        console.log('[EXPORT] Colored ASCII rendering complete');
    }

    /**
     * Render monochrome ASCII art to canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} asciiText - ASCII art text
     * @param {number} fontSize - Font size in pixels
     * @param {number} offsetX - X offset for centering
     * @param {number} offsetY - Y offset for centering
     */
    renderMonochromeASCII(ctx, asciiText, fontSize, offsetX = 0, offsetY = 0) {
        ctx.fillStyle = CONFIG.CANVAS.TEXT_COLOR;
        const lines = asciiText.split('\n').filter(line => line.length > 0);
        const lineHeight = fontSize * 1.2; // Line spacing
        
        console.log('[EXPORT] Rendering monochrome ASCII with:', {
            fontSize,
            lineHeight,
            offsetX: offsetX.toFixed(2),
            offsetY: offsetY.toFixed(2),
            totalLines: lines.length,
            maxLineLength: Math.max(...lines.map(l => l.length)),
            fillStyle: ctx.fillStyle
        });
        
        lines.forEach((line, index) => {
            if (line.trim()) { // Only render non-empty lines
                // Calculate pixel-aligned position for crisp rendering
                const x = Math.round(offsetX);
                const y = Math.round(offsetY + index * lineHeight);
                
                // Render with crisp positioning
                ctx.fillText(line, x, y);
            }
        });
        
        console.log('[EXPORT] Monochrome ASCII rendering complete');
    }

    /**
     * Generate filename with timestamp
     * @param {string} extension - File extension (without dot)
     * @returns {string} Generated filename
     */
    generateFilename(extension) {
        return `ascii-art-${Date.now()}.${extension}`;
    }

    /**
     * Trigger file download
     * @param {string} url - Object URL to download
     * @param {string} filename - Filename for download
     */
    triggerDownload(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    }

    /**
     * Download ASCII frames as animated GIF
     * @param {Array} asciiFrames - Array of ASCII frame data
     * @param {Object} settings - Export settings
     * @param {number} width - Original GIF width
     * @param {number} height - Original GIF height
     */
    async downloadAsGIF(asciiFrames, settings, width, height) {
        // For now, we'll export frames as images
        // Full GIF encoding would require gif.js library
        this.notificationService.show('Creating individual frame images...');
        
        // Create a canvas for each frame and compile
        const frames = [];
        
        for (let i = 0; i < asciiFrames.length; i++) {
            const frame = asciiFrames[i];
            const canvas = this.createCanvasForExport(
                frame.asciiText,
                frame.coloredData,
                settings,
                width,
                height
            );
            
            const blob = await new Promise(resolve => canvas.toBlob(resolve));
            frames.push({
                blob,
                delay: frame.delay
            });
        }
        
        // For now, download as ZIP since we don't have gif.js loaded
        // This will be enhanced with actual GIF encoding
        await this.downloadFramesAsZip(asciiFrames, settings, width, height);
        
        this.notificationService.show('GIF frames exported! (Full GIF encoding coming soon)');
    }

    /**
     * Download all frames as individual PNG files in a ZIP
     * @param {Array} asciiFrames - Array of ASCII frame data
     * @param {Object} settings - Export settings
     * @param {number} width - Frame width
     * @param {number} height - Frame height
     */
    async downloadFramesAsZip(asciiFrames, settings, width, height) {
        // Create a simple ZIP-like download by creating a folder with individual images
        // In a full implementation, we'd use JSZip library
        
        this.notificationService.show(
            `Downloading ${asciiFrames.length} frames individually...`
        );
        
        for (let i = 0; i < asciiFrames.length; i++) {
            const frame = asciiFrames[i];
            const canvas = this.createCanvasForExport(
                frame.asciiText,
                frame.coloredData,
                settings,
                width,
                height
            );
            
            await new Promise((resolve) => {
                canvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);
                    const filename = `ascii-frame-${String(i + 1).padStart(4, '0')}.png`;
                    this.triggerDownload(url, filename);
                    URL.revokeObjectURL(url);
                    
                    // Small delay between downloads to prevent browser blocking
                    setTimeout(resolve, 100);
                });
            });
        }
        
        this.notificationService.show(
            `All ${asciiFrames.length} frames downloaded successfully!`
        );
    }

    /**
     * Create a simple text file with frame information
     * @param {Array} asciiFrames - Array of ASCII frames
     * @returns {string} Frame info text
     */
    createFrameInfoText(asciiFrames) {
        let info = '=== ASCII GIF FRAME INFORMATION ===\n\n';
        info += `Total Frames: ${asciiFrames.length}\n\n`;
        
        asciiFrames.forEach((frame, index) => {
            info += `Frame ${index + 1}:\n`;
            info += `Delay: ${frame.delay}ms\n`;
            info += `---\n`;
        });
        
        return info;
    }
}
