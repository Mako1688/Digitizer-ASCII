/**
 * ExportService - Handles clipboard and download operations
 * Follows Single Responsibility Principle
 */
export class ExportService {
    /**
     * Copy ASCII text to clipboard
     * @param {string} asciiHTML - ASCII art HTML
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(asciiHTML) {
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = asciiHTML;
            const plainText = tempDiv.textContent || tempDiv.innerText;
            
            await navigator.clipboard.writeText(plainText);
            return true;
        } catch (error) {
            throw new Error('Failed to copy to clipboard');
        }
    }

    /**
     * Download ASCII art as image
     * @param {Object} asciiResult - ASCII result object
     * @param {number} fontSize - Font size for rendering
     * @returns {string} Generated filename
     */
    downloadAsImage(asciiResult, fontSize) {
        const canvas = this.createDownloadCanvas(asciiResult, fontSize);
        const qualityName = this.getQualityName(fontSize);
        const filename = `ascii-art-${asciiResult.scale}x-${qualityName}-${Date.now()}.png`;
        
        // Trigger download
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        return filename;
    }

    /**
     * Create canvas for download
     * @param {Object} asciiResult - ASCII result object
     * @param {number} fontSize - Font size
     * @returns {HTMLCanvasElement} Canvas element
     */
    createDownloadCanvas(asciiResult, fontSize) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate character dimensions for Courier New
        const charWidth = fontSize * 0.6;
        const charHeight = fontSize;
        
        // Set canvas dimensions
        canvas.width = Math.ceil(asciiResult.width * charWidth);
        canvas.height = Math.ceil(asciiResult.height * charHeight);
        
        // Configure canvas for crisp text rendering
        ctx.imageSmoothingEnabled = false;
        ctx.font = `${fontSize}px Courier New, monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Render ASCII to canvas
        this.renderASCIIToCanvas(ctx, asciiResult.html, charWidth, charHeight);
        
        return canvas;
    }

    /**
     * Render ASCII HTML to canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} asciiHTML - ASCII HTML
     * @param {number} charWidth - Character width
     * @param {number} charHeight - Character height
     */
    renderASCIIToCanvas(ctx, asciiHTML, charWidth, charHeight) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = asciiHTML;
        
        const rows = tempDiv.querySelectorAll('div');
        
        for (let y = 0; y < rows.length; y++) {
            const row = rows[y];
            const spans = row.querySelectorAll('span');
            
            for (let x = 0; x < spans.length; x++) {
                const span = spans[x];
                const char = span.textContent;
                const color = span.style.color;
                
                // Skip transparent spans and invisible spaces
                if (color && color !== 'transparent' && char !== ' ') {
                    ctx.fillStyle = color;
                    ctx.fillText(char, x * charWidth, y * charHeight);
                }
            }
        }
    }

    /**
     * Get quality name from font size
     * @param {number} fontSize - Font size
     * @returns {string} Quality name
     */
    getQualityName(fontSize) {
        if (fontSize <= 6) return 'verylow';
        if (fontSize <= 8) return 'low';
        if (fontSize <= 12) return 'high';
        if (fontSize <= 16) return 'veryhigh';
        if (fontSize <= 20) return 'ultra';
        if (fontSize <= 24) return 'maximum';
        if (fontSize <= 32) return 'extreme';
        return 'professional';
    }
}