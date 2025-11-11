// GIF Frame Decoder Service
// Decodes animated GIF files and extracts individual frames
// Based on omggif library concepts - pure JavaScript GIF decoder

class GIFFrameDecoder {
    /**
     * Decode GIF and extract all frames
     * @param {ArrayBuffer} arrayBuffer - GIF file data
     * @returns {Promise<Object>} GIF metadata and frames
     */
    async decode(arrayBuffer) {
        const data = new Uint8Array(arrayBuffer);
        
        // Validate GIF signature
        const signature = String.fromCharCode(...data.slice(0, 3));
        if (signature !== 'GIF') {
            throw new Error('Invalid GIF file');
        }
        
        // Parse GIF header
        const width = data[6] | (data[7] << 8);
        const height = data[8] | (data[9] << 8);
        const globalColorTableFlag = (data[10] & 0x80) >> 7;
        const globalColorTableSize = 2 << (data[10] & 0x07);
        
        let pos = 13;
        let globalColorTable = null;
        
        // Read global color table if present
        if (globalColorTableFlag) {
            globalColorTable = this.readColorTable(data, pos, globalColorTableSize);
            pos += globalColorTableSize * 3;
        }
        
        // Extract frames
        const frames = [];
        let frameDelay = 100; // Default delay
        
        while (pos < data.length) {
            const blockType = data[pos];
            
            if (blockType === 0x21) { // Extension block
                const extensionType = data[pos + 1];
                
                if (extensionType === 0xF9) { // Graphics Control Extension
                    frameDelay = (data[pos + 4] | (data[pos + 5] << 8)) * 10; // Convert to ms
                    pos += 8;
                } else {
                    pos = this.skipBlock(data, pos + 2);
                }
            } else if (blockType === 0x2C) { // Image block
                const frame = this.parseImageBlock(data, pos, width, height, globalColorTable);
                frame.delay = frameDelay || 100;
                frames.push(frame);
                pos = this.skipBlock(data, pos + 10);
            } else if (blockType === 0x3B) { // Trailer
                break;
            } else {
                pos++;
            }
        }
        
        return {
            width,
            height,
            frames,
            frameCount: frames.length,
            isAnimated: frames.length > 1
        };
    }

    /**
     * Read color table from GIF data
     * @param {Uint8Array} data - GIF data
     * @param {number} pos - Position in data
     * @param {number} size - Color table size
     * @returns {Array} Color table
     */
    readColorTable(data, pos, size) {
        const colorTable = [];
        for (let i = 0; i < size; i++) {
            colorTable.push([
                data[pos + i * 3],
                data[pos + i * 3 + 1],
                data[pos + i * 3 + 2]
            ]);
        }
        return colorTable;
    }

    /**
     * Parse image block and create frame
     * @param {Uint8Array} data - GIF data
     * @param {number} pos - Position in data
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @param {Array} globalColorTable - Global color table
     * @returns {Object} Frame data
     */
    parseImageBlock(data, pos, width, height, globalColorTable) {
        const left = data[pos + 1] | (data[pos + 2] << 8);
        const top = data[pos + 3] | (data[pos + 4] << 8);
        const frameWidth = data[pos + 5] | (data[pos + 6] << 8);
        const frameHeight = data[pos + 7] | (data[pos + 8] << 8);
        const flags = data[pos + 9];
        
        const localColorTableFlag = (flags & 0x80) >> 7;
        const localColorTableSize = 2 << (flags & 0x07);
        
        let colorTable = globalColorTable;
        let dataPos = pos + 10;
        
        // Read local color table if present
        if (localColorTableFlag) {
            colorTable = this.readColorTable(data, dataPos, localColorTableSize);
            dataPos += localColorTableSize * 3;
        }
        
        // Create canvas for this frame
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // For now, return a simple frame structure
        // Full LZW decompression would go here
        const dataUrl = canvas.toDataURL('image/png');
        const imageData = ctx.getImageData(0, 0, width, height);
        
        return {
            width,
            height,
            left,
            top,
            frameWidth,
            frameHeight,
            dataUrl,
            imageData,
            delay: 100
        };
    }

    /**
     * Skip a block of data
     * @param {Uint8Array} data - GIF data
     * @param {number} pos - Current position
     * @returns {number} New position
     */
    skipBlock(data, pos) {
        let blockSize = data[pos];
        pos++;
        
        while (blockSize > 0) {
            pos += blockSize;
            blockSize = data[pos];
            pos++;
        }
        
        return pos;
    }
}
