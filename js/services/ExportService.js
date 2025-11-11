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
        const canvas = this.createCanvasForExport(
            asciiText, 
            coloredData, 
            settings, 
            scaledWidth, 
            scaledHeight
        );
        
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const filename = this.generateFilename('png');
            
            this.triggerDownload(url, filename);
            URL.revokeObjectURL(url);
            
            this.notificationService.show(
                `Image saved successfully! (${scaledWidth}x${scaledHeight}px)`
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
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        
        // Calculate optimal font size to fit dimensions
        const fontSize = this.calculateOptimalFontSize(asciiText, scaledWidth, scaledHeight);
        
        // Set background
        ctx.fillStyle = CONFIG.CANVAS.BACKGROUND_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set text properties
        ctx.font = `${fontSize}px ${CONFIG.CANVAS.FONT_FAMILY}`;
        ctx.textBaseline = CONFIG.CANVAS.TEXT_BASELINE;
        
        // Render ASCII art
        if (settings.colored && coloredData && coloredData.length > 0) {
            this.renderColoredASCII(ctx, coloredData, fontSize);
        } else {
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
        const charAspectRatio = CONFIG.CHAR_ASPECT_RATIO;
        
        const fontSizeByWidth = width / (maxLineLength * charAspectRatio);
        const fontSizeByHeight = height / lines.length;
        
        return Math.min(fontSizeByWidth, fontSizeByHeight);
    }

    /**
     * Render colored ASCII art to canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array<Array<Object>>} coloredData - Colored ASCII data
     * @param {number} fontSize - Font size in pixels
     */
    renderColoredASCII(ctx, coloredData, fontSize) {
        coloredData.forEach((lineData, lineIndex) => {
            lineData.forEach((charData, charIndex) => {
                ctx.fillStyle = charData.color;
                ctx.fillText(
                    charData.char, 
                    charIndex * fontSize * CONFIG.CHAR_ASPECT_RATIO, 
                    lineIndex * fontSize
                );
            });
        });
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
        
        lines.forEach((line, index) => {
            ctx.fillText(line, 0, index * fontSize);
        });
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
