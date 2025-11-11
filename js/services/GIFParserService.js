// GIF Parser Service
// Single Responsibility: Parse and extract frames from animated GIF files
// Uses omggif library for reliable frame extraction

class GIFParserService {
    constructor() {
        this.gifCanvas = document.createElement('canvas');
        this.gifCtx = this.gifCanvas.getContext('2d');
    }

    /**
     * Check if a file is a GIF
     * @param {File} file - File to check
     * @returns {boolean} True if file is a GIF
     */
    isGIF(file) {
        return file.type === 'image/gif';
    }

    /**
     * Parse GIF file and extract all frames using omggif library
     * @param {File} file - GIF file to parse
     * @returns {Promise<Object>} Promise resolving to GIF data with frames
     */
    async parseGIF(file) {
        console.log('[GIFParser] Starting parseGIF for:', file.name);
        
        try {
            // Read file as ArrayBuffer for omggif
            const arrayBuffer = await this.fileToArrayBuffer(file);
            console.log('[GIFParser] ArrayBuffer created, size:', arrayBuffer.byteLength);
            
            // Parse GIF using omggif
            const uint8Array = new Uint8Array(arrayBuffer);
            const reader = new GifReader(uint8Array);
            
            console.log('[GIFParser] GIF parsed - Width:', reader.width, 'Height:', reader.height, 'Frames:', reader.numFrames());
            
            // Extract all frames
            const frames = await this.extractFrames(reader);
            console.log('[GIFParser] Extracted frames:', frames.length);
            
            if (frames.length === 0) {
                console.warn('[GIFParser] No frames extracted, falling back to static image');
                return await this.parseAsStaticImage(file);
            }
            
            const result = {
                frames: frames,
                frameCount: frames.length,
                width: reader.width,
                height: reader.height,
                isAnimated: frames.length > 1,
                fileSize: file.size
            };
            
            console.log('[GIFParser] Parse complete:', result);
            return result;
            
        } catch (error) {
            console.error('[GIFParser] omggif parsing failed:', error);
            console.log('[GIFParser] Falling back to static image parsing');
            return await this.parseAsStaticImage(file);
        }
    }

    /**
     * Extract all frames from GIF using omggif reader
     * @param {GifReader} reader - omggif GifReader instance
     * @returns {Promise<Array>} Array of frame objects
     */
    async extractFrames(reader) {
        const frames = [];
        const width = reader.width;
        const height = reader.height;
        const numFrames = reader.numFrames();
        
        // Setup canvas
        this.gifCanvas.width = width;
        this.gifCanvas.height = height;
        
        // Create persistent canvas buffer for frame composition
        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = width;
        compositeCanvas.height = height;
        const compositeCtx = compositeCanvas.getContext('2d');
        
        // Initialize with transparent background
        compositeCtx.clearRect(0, 0, width, height);
        
        for (let frameIndex = 0; frameIndex < numFrames; frameIndex++) {
            try {
                // Get frame info
                const frameInfo = reader.frameInfo(frameIndex);
                
                // Handle disposal method from previous frame
                if (frameIndex > 0) {
                    const prevFrameInfo = reader.frameInfo(frameIndex - 1);
                    // disposal: 0/1 = no disposal, 2 = restore to background, 3 = restore to previous
                    if (prevFrameInfo.disposal === 2) {
                        // Clear to transparent
                        compositeCtx.clearRect(0, 0, width, height);
                    }
                    // For disposal 3, we keep the previous frame (do nothing)
                    // For disposal 0/1, we draw on top (do nothing)
                }
                
                // Decode current frame pixels
                const pixels = new Uint8ClampedArray(width * height * 4);
                reader.decodeAndBlitFrameRGBA(frameIndex, pixels);
                
                // Create ImageData for current frame
                const frameImageData = new ImageData(
                    new Uint8ClampedArray(pixels),
                    width,
                    height
                );
                
                // Blit frame onto composite canvas
                this.gifCtx.putImageData(frameImageData, 0, 0);
                compositeCtx.drawImage(this.gifCanvas, 0, 0);
                
                // Convert composite to data URL and ImageData
                const dataUrl = compositeCanvas.toDataURL('image/png');
                const compositedImageData = compositeCtx.getImageData(0, 0, width, height);
                
                // Get delay (in centiseconds from GIF, convert to milliseconds)
                const delay = (frameInfo.delay || 10) * 10; // Default 100ms if 0
                const clampedDelay = Math.max(
                    CONFIG.GIF.MIN_FRAME_DELAY,
                    Math.min(delay, CONFIG.GIF.MAX_FRAME_DELAY)
                );
                
                frames.push({
                    width: width,
                    height: height,
                    dataUrl: dataUrl,
                    imageData: compositedImageData,
                    delay: clampedDelay,
                    index: frameIndex
                });
                
                console.log(`[GIFParser] Frame ${frameIndex + 1}/${numFrames} extracted (delay: ${clampedDelay}ms, disposal: ${frameInfo.disposal})`);
                
            } catch (frameError) {
                console.error(`[GIFParser] Error extracting frame ${frameIndex}:`, frameError);
            }
        }
        
        return frames;
    }

    /**
     * Parse GIF as static image (fallback)
     * @param {File} file - GIF file
     * @returns {Promise<Object>} GIF data with single frame
     */
    async parseAsStaticImage(file) {
        const dataUrl = await this.fileToDataURL(file);
        const frame = await this.createFrameFromDataURL(dataUrl);
        
        return {
            frames: [frame],
            frameCount: 1,
            width: frame.width,
            height: frame.height,
            isAnimated: false,
            fileSize: file.size
        };
    }

    /**
     * Create a single frame from data URL
     * @param {string} dataUrl - Image data URL
     * @returns {Promise<Object>} Frame object
     */
    async createFrameFromDataURL(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.gifCanvas.width = img.naturalWidth;
                this.gifCanvas.height = img.naturalHeight;
                this.gifCtx.drawImage(img, 0, 0);
                
                const frameDataUrl = this.gifCanvas.toDataURL('image/png');
                const imageData = this.gifCtx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
                
                resolve({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    dataUrl: frameDataUrl,
                    imageData: imageData,
                    delay: CONFIG.GIF.DEFAULT_FRAME_DELAY,
                    index: 0
                });
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = dataUrl;
        });
    }

    /**
     * Convert File to ArrayBuffer
     * @param {File} file - File to convert
     * @returns {Promise<ArrayBuffer>} ArrayBuffer
     */
    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Convert File to Data URL
     * @param {File} file - File to convert
     * @returns {Promise<string>} Data URL
     */
    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Create thumbnail from first frame
     * @param {Object} frame - Frame object with dataUrl
     * @param {number} maxSize - Maximum dimension size
     * @returns {Promise<string>} Thumbnail data URL
     */
    async createThumbnail(frame, maxSize = CONFIG.GIF.THUMBNAIL_SIZE) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(maxSize / img.width, maxSize / img.height);
                const thumbWidth = Math.floor(img.width * scale);
                const thumbHeight = Math.floor(img.height * scale);
                
                this.gifCanvas.width = thumbWidth;
                this.gifCanvas.height = thumbHeight;
                this.gifCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
                
                resolve(this.gifCanvas.toDataURL('image/png'));
            };
            img.src = frame.dataUrl;
        });
    }

    /**
     * Get file size in human-readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    /**
     * Check if GIF file is large and should show warning
     * @param {File} file - GIF file
     * @returns {boolean} True if file exceeds warning threshold
     */
    isLargeFile(file) {
        return file.size > CONFIG.GIF.LARGE_FILE_THRESHOLD;
    }
}
