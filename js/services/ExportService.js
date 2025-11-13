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
     */
    downloadAsImage(asciiText, coloredData, settings, scaledWidth, scaledHeight) {
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
            scaledHeight
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
     * @returns {HTMLCanvasElement} Canvas with rendered ASCII art
     */
    createCanvasForExport(asciiText, coloredData, settings, scaledWidth, scaledHeight) {
        console.log('[EXPORT] Creating canvas for export...');
        console.log('[EXPORT] Target dimensions:', { scaledWidth, scaledHeight });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate optimal font size first to determine actual needed canvas size
        const minFontSize = 12; // Minimum readable font size
        let fontSize = this.calculateOptimalFontSize(asciiText, scaledWidth, scaledHeight);
        fontSize = Math.max(fontSize, minFontSize); // Ensure minimum readable size
        console.log('[EXPORT] Calculated font size:', fontSize, '(minimum enforced:', minFontSize + ')');

        // Calculate actual content dimensions based on ASCII text
        const lines = asciiText.split('\n').filter(line => line.length > 0);
        const maxLineLength = Math.max(...lines.map(line => line.length));
        const charWidth = fontSize * 0.6; // Monospace character width
        const lineHeight = fontSize * 1.2; // Line spacing
        const actualContentWidth = Math.ceil(maxLineLength * charWidth);
        const actualContentHeight = Math.ceil(lines.length * lineHeight);

        console.log('[EXPORT] Actual content dimensions:', {
            actualContentWidth,
            actualContentHeight,
            lines: lines.length,
            maxLineLength,
            charWidth,
            lineHeight
        });

        // Use actual content dimensions, but ensure minimum canvas size for quality
        const minCanvasWidth = Math.max(800, actualContentWidth);
        const minCanvasHeight = Math.max(600, actualContentHeight);
        const finalWidth = Math.min(minCanvasWidth, Math.max(actualContentWidth, scaledWidth));
        const finalHeight = Math.min(minCanvasHeight, Math.max(actualContentHeight, scaledHeight));

        console.log('[EXPORT] Final canvas dimensions:', { finalWidth, finalHeight });
        
        // Set canvas to actual final size (no DPI scaling that causes blur)
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        
        console.log('[EXPORT] Canvas setup complete:', {
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            noDPIScaling: true
        });
        
        // Set background
        ctx.fillStyle = CONFIG.CANVAS.BACKGROUND_COLOR;
        ctx.fillRect(0, 0, finalWidth, finalHeight);
        
        // Set text properties for crisp rendering
        ctx.font = `${fontSize}px ${CONFIG.CANVAS.FONT_FAMILY}`;
        ctx.textBaseline = 'top'; // Use 'top' for more predictable positioning
        ctx.textAlign = 'left';
        ctx.imageSmoothingEnabled = false; // Crisp pixel art style
        
        // Additional properties for sharp text rendering
        ctx.textRenderingOptimization = 'optimizeLegibility';
        if (ctx.fontKerning) ctx.fontKerning = 'none'; // Disable kerning for monospace
        
        // Force crisp rendering by setting pixel boundaries
        ctx.translate(0.5, 0.5); // Align to pixel grid
        
        console.log('[EXPORT] Text properties set:', {
            font: ctx.font,
            baseline: ctx.textBaseline,
            align: ctx.textAlign,
            smoothing: ctx.imageSmoothingEnabled,
            pixelAligned: true
        });

        // Render ASCII art
        if (settings.colored && coloredData && coloredData.length > 0) {
            console.log('[EXPORT] Rendering colored ASCII...');
            this.renderColoredASCII(ctx, coloredData, fontSize);
        } else {
            console.log('[EXPORT] Rendering monochrome ASCII...');
            this.renderMonochromeASCII(ctx, asciiText, fontSize);
        }
        
        return canvas;
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
     */
    renderColoredASCII(ctx, coloredData, fontSize) {
        const charWidth = fontSize * 0.6; // Proper monospace character width
        const lineHeight = fontSize * 1.2; // Line spacing
        
        console.log('[EXPORT] Rendering colored ASCII with:', {
            fontSize,
            charWidth,
            lineHeight,
            totalLines: coloredData.length,
            firstLineLength: coloredData[0]?.length || 0
        });
        
        coloredData.forEach((lineData, lineIndex) => {
            lineData.forEach((charData, charIndex) => {
                if (charData.char && charData.char.trim()) { // Only render non-whitespace
                    ctx.fillStyle = charData.color;
                    const x = charIndex * charWidth;
                    const y = lineIndex * lineHeight;
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
     */
    renderMonochromeASCII(ctx, asciiText, fontSize) {
        ctx.fillStyle = CONFIG.CANVAS.TEXT_COLOR;
        const lines = asciiText.split('\n').filter(line => line.length > 0);
        const lineHeight = fontSize * 1.2; // Line spacing
        
        console.log('[EXPORT] Rendering monochrome ASCII with:', {
            fontSize,
            lineHeight,
            totalLines: lines.length,
            maxLineLength: Math.max(...lines.map(l => l.length)),
            fillStyle: ctx.fillStyle
        });
        
        lines.forEach((line, index) => {
            if (line.trim()) { // Only render non-empty lines
                const x = 0;
                const y = index * lineHeight;
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
