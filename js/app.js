// ASCII Image Converter - Simple Implementation
// Clean slate implementation for colored ASCII art generation

console.log('ASCII Image Converter initialized - Ready for fresh implementation');

class ASCIIConverter {
    constructor() {
        // ASCII characters arranged by visual density (light to dark)
        this.ASCII_CHARS = ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
        
        // Configuration
        this.MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
        this.SQUARE_FONT_SIZE = 8; // Base font size for square characters
        this.currentImage = null;
        this.currentImageData = null;
        this.asciiResult = null;
        
        // DOM elements
        this.elements = {
            uploadBtn: document.getElementById('uploadBtn'),
            fileInput: document.getElementById('fileInput'),
            generateBtn: document.getElementById('generateBtn'),
            resolutionSelect: document.getElementById('resolutionSelect'),
            resolutionValue: document.getElementById('resolutionValue'),
            pixelSizeSlider: document.getElementById('pixelSizeSlider'),
            pixelSizeValue: document.getElementById('pixelSizeValue'),
            downloadQualitySelect: document.getElementById('downloadQualitySelect'),
            downloadQualityValue: document.getElementById('downloadQualityValue'),
            originalPreview: document.getElementById('originalPreview'),
            asciiPreview: document.getElementById('asciiPreview'),
            copyTextBtn: document.getElementById('copyTextBtn'),
            downloadImageBtn: document.getElementById('downloadImageBtn'),
            canvas: document.getElementById('imageCanvas')
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.elements.uploadBtn.addEventListener('click', () => {
            this.elements.fileInput.click();
        });
        
        this.elements.fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });
        
        this.elements.generateBtn.addEventListener('click', () => {
            this.generateASCII();
        });
        
        this.elements.copyTextBtn.addEventListener('click', () => {
            this.copyToClipboard();
        });
        
        this.elements.downloadImageBtn.addEventListener('click', () => {
            this.downloadAsImage();
        });
        
        this.elements.resolutionSelect.addEventListener('change', (e) => {
            this.elements.resolutionValue.textContent = e.target.value + 'x';
        });
        
        this.elements.pixelSizeSlider.addEventListener('input', (e) => {
            const pixelSize = parseInt(e.target.value);
            this.elements.pixelSizeValue.textContent = pixelSize;
            
            // Update the description based on pixel size
            const description = pixelSize === 1 ? 'px per char' : 
                               pixelSize <= 3 ? 'px per char (Fine)' :
                               pixelSize <= 6 ? 'px per char (Medium)' :
                               'px per char (Chunky)';
            this.elements.pixelSizeValue.textContent = `${pixelSize} ${description}`;
        });
        
        this.elements.downloadQualitySelect.addEventListener('change', (e) => {
            const quality = parseInt(e.target.value);
            let qualityText = 'High';
            if (quality <= 8) qualityText = 'Low';
            else if (quality <= 12) qualityText = 'High';
            else if (quality <= 16) qualityText = 'Very High';
            else qualityText = 'Ultra High';
            this.elements.downloadQualityValue.textContent = qualityText;
        });
        
        // Add window resize listener to recalculate font size
        window.addEventListener('resize', () => {
            if (this.asciiResult) {
                this.calculateAndApplyOptimalFontSize();
            }
        });
    }
    
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }
        
        // Validate file size
        if (file.size > this.MAX_FILE_SIZE) {
            alert(`File size exceeds 100MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
            return;
        }
        
        try {
            // Load and display image
            const imageUrl = URL.createObjectURL(file);
            await this.loadImage(imageUrl);
            
            // Enable generate button
            this.elements.generateBtn.disabled = false;
            
            // Reset export buttons
            this.elements.copyTextBtn.disabled = true;
            this.elements.downloadImageBtn.disabled = true;
            
            // Clear previous ASCII result
            this.elements.asciiPreview.innerHTML = '<p class="placeholder-text">[ READY FOR CONVERSION ]</p>';
            
        } catch (error) {
            console.error('Error loading image:', error);
            alert('Error loading image. Please try a different file.');
        }
    }
    
    async loadImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                
                // Display in preview
                this.elements.originalPreview.innerHTML = '';
                this.elements.originalPreview.appendChild(img);
                
                console.log(`Image loaded: ${img.width}x${img.height}`);
                resolve();
            };
            img.onerror = reject;
            img.src = imageUrl;
        });
    }
    
    async generateASCII() {
        if (!this.currentImage) return;
        
        const scale = parseFloat(this.elements.resolutionSelect.value);
        console.log(`Generating ASCII with ${scale}x resolution...`);
        
        // Show progress
        this.elements.asciiPreview.innerHTML = '<p class="placeholder-text">[ GENERATING ASCII ART... ]</p>';
        this.elements.generateBtn.disabled = true;
        
        try {
            // Calculate target dimensions
            const targetWidth = Math.round(this.currentImage.width * scale);
            const targetHeight = Math.round(this.currentImage.height * scale);
            
            console.log(`Target dimensions: ${targetWidth}x${targetHeight}`);
            
            // Get image data
            const imageData = this.getImageData(targetWidth, targetHeight);
            
            // Generate ASCII with progress updates
            await this.processImageToASCII(imageData, targetWidth, targetHeight, scale);
            
        } catch (error) {
            console.error('Error generating ASCII:', error);
            this.elements.asciiPreview.innerHTML = '<p class="placeholder-text">[ ERROR GENERATING ASCII ART ]</p>';
        } finally {
            this.elements.generateBtn.disabled = false;
        }
    }
    
    getImageData(width, height) {
        const canvas = this.elements.canvas;
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image to canvas
        ctx.drawImage(this.currentImage, 0, 0, width, height);
        
        return ctx.getImageData(0, 0, width, height);
    }
    
    async processImageToASCII(imageData, width, height, scale) {
        const { data } = imageData;
        const chars = this.ASCII_CHARS;
        const charCount = chars.length - 1;
        
        // Get character block size
        const pixelSize = parseInt(this.elements.pixelSizeSlider.value);
        
        // Calculate new dimensions based on pixel block size
        const asciiWidth = Math.floor(width / pixelSize);
        const asciiHeight = Math.floor(height / pixelSize);
        
        let asciiHTML = '';
        const totalBlocks = asciiWidth * asciiHeight;
        let processedBlocks = 0;
        
        // Process each character block
        for (let y = 0; y < asciiHeight; y++) {
            let rowHTML = '';
            
            for (let x = 0; x < asciiWidth; x++) {
                // Sample a block of pixels and average them
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
                
                // Average the sampled pixels
                const avgR = Math.round(totalR / samplesCount);
                const avgG = Math.round(totalG / samplesCount);
                const avgB = Math.round(totalB / samplesCount);
                const avgA = Math.round(totalA / samplesCount);
                
                // Check if this block is transparent (threshold of 25 for mostly transparent areas)
                if (avgA < 25) {
                    // For transparent areas, add invisible space to maintain structure
                    rowHTML += `<span style="color:transparent">&nbsp;</span>`;
                } else {
                    // Calculate brightness (luminance) for visible pixels
                    const brightness = (avgR * 0.299 + avgG * 0.587 + avgB * 0.114) / 255;
                    
                    // Add slight variation for visual complexity
                    const variation = (Math.random() - 0.5) * 0.1;
                    const adjustedBrightness = Math.max(0, Math.min(1, brightness + variation));
                    
                    // Select character based on brightness
                    const charIndex = Math.floor(adjustedBrightness * charCount);
                    const char = chars[charIndex];
                    
                    // Use averaged pixel color with alpha
                    const alpha = avgA / 255;
                    const color = `rgba(${avgR},${avgG},${avgB},${alpha})`;
                    
                    rowHTML += `<span style="color:${color}">${char}</span>`;
                }
                processedBlocks++;
            }
            
            asciiHTML += `<div>${rowHTML}</div>`;
            
            // Yield control periodically for progress updates
            if (y % 20 === 0) {
                const progress = Math.round((processedBlocks / totalBlocks) * 100);
                this.elements.asciiPreview.innerHTML = `<p class="placeholder-text">[ GENERATING... ${progress}% ]</p>`;
                await this.delay(1);
            }
        }
        
        // Store result and display
        this.asciiResult = {
            html: asciiHTML,
            width: asciiWidth,  // Use actual ASCII dimensions after block sizing
            height: asciiHeight, // Use actual ASCII dimensions after block sizing
            scale: scale,
            pixelSize: pixelSize,
            originalWidth: this.currentImage.width,
            originalHeight: this.currentImage.height,
            processedWidth: width,  // Keep track of the processed image dimensions
            processedHeight: height
        };
        
        this.displayASCIIResult();
    }
    
    displayASCIIResult() {
        // Set the HTML content first
        this.elements.asciiPreview.innerHTML = this.asciiResult.html;
        
        // Use a small delay to ensure the content is rendered and container dimensions are available
        setTimeout(() => {
            this.calculateAndApplyOptimalFontSize();
        }, 10);
        
        // Enable export buttons
        this.elements.copyTextBtn.disabled = false;
        this.elements.downloadImageBtn.disabled = false;
        
        console.log(`ASCII art generated: ${this.asciiResult.width}x${this.asciiResult.height} characters`);
    }
    
    calculateAndApplyOptimalFontSize() {
        // Get the actual container dimensions
        const containerRect = this.elements.asciiPreview.getBoundingClientRect();
        const containerWidth = containerRect.width - 30; // Account for padding
        const containerHeight = Math.max(300, containerRect.height - 30); // Ensure minimum height
        
        // Use the actual ASCII dimensions (after block sizing)
        const asciiWidth = this.asciiResult.width;
        const asciiHeight = this.asciiResult.height;
        
        // Calculate how much space each character needs
        const maxFontWidthFit = containerWidth / asciiWidth;
        const maxFontHeightFit = containerHeight / asciiHeight;
        
        // Use the smaller of the two to ensure it fits in both dimensions
        // Courier New is roughly square, so use the limiting dimension
        let optimalFontSize = Math.floor(Math.min(maxFontWidthFit, maxFontHeightFit));
        
        // Clamp font size to reasonable bounds
        optimalFontSize = Math.max(1, Math.min(16, optimalFontSize));
        
        console.log(`Container: ${containerWidth.toFixed(1)}x${containerHeight.toFixed(1)}, ASCII: ${asciiWidth}x${asciiHeight}, Block Size: ${this.asciiResult.pixelSize}px, Font: ${optimalFontSize}px`);
        
        // Apply styling for proper ASCII display
        this.elements.asciiPreview.style.fontSize = `${optimalFontSize}px`;
        this.elements.asciiPreview.style.lineHeight = `${optimalFontSize}px`;
        this.elements.asciiPreview.style.fontFamily = 'Courier New, monospace';
        this.elements.asciiPreview.style.display = 'block';
        this.elements.asciiPreview.style.whiteSpace = 'nowrap'; // Prevent wrapping
        this.elements.asciiPreview.style.overflow = 'auto';
        this.elements.asciiPreview.style.textAlign = 'left';
        this.elements.asciiPreview.style.width = '100%';
        this.elements.asciiPreview.style.height = 'auto';
        
        // If the font is very small, show a message
        if (optimalFontSize <= 2) {
            console.warn('Font size very small - ASCII art may be hard to read. Consider using lower resolution or larger character block size.');
        }
        
        // Scroll the ASCII preview into view
        setTimeout(() => {
            this.elements.asciiPreview.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest',
                inline: 'start'
            });
        }, 100);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async copyToClipboard() {
        if (!this.asciiResult) return;
        
        try {
            // Extract plain text from HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.asciiResult.html;
            const plainText = tempDiv.textContent || tempDiv.innerText;
            
            await navigator.clipboard.writeText(plainText);
            
            // Show feedback
            const originalText = this.elements.copyTextBtn.textContent;
            this.elements.copyTextBtn.textContent = '> COPIED!';
            setTimeout(() => {
                this.elements.copyTextBtn.textContent = originalText;
            }, 1000);
            
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            alert('Error copying to clipboard');
        }
    }
    
    downloadAsImage() {
        if (!this.asciiResult) return;
        
        try {
            // Get the selected download quality (font size)
            const baseFontSize = parseInt(this.elements.downloadQualitySelect.value);
            
            // Create canvas based on ASCII dimensions, not original image dimensions
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate character dimensions for Courier New font
            // Courier New has approximately 0.6 width-to-height ratio
            const charWidth = baseFontSize * 0.6;
            const charHeight = baseFontSize;
            
            // Calculate canvas dimensions based on ASCII grid and font size
            canvas.width = Math.ceil(this.asciiResult.width * charWidth);
            canvas.height = Math.ceil(this.asciiResult.height * charHeight);
            
            console.log(`Download canvas: ${canvas.width}x${canvas.height}, Font: ${baseFontSize}px, ASCII: ${this.asciiResult.width}x${this.asciiResult.height}`);
            
            // Set up canvas for crisp text rendering
            ctx.imageSmoothingEnabled = false; // Crisp pixel rendering
            ctx.font = `${baseFontSize}px Courier New, monospace`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            
            // Leave background transparent - don't fill with black
            // This allows the transparent parts of the ASCII art to remain transparent
            
            // Render ASCII art with proper spacing
            this.renderHighQualityASCIIToCanvas(ctx, baseFontSize, charWidth, charHeight);
            
            // Generate filename with quality and resolution info
            const qualityName = baseFontSize <= 8 ? 'low' : baseFontSize <= 12 ? 'high' : baseFontSize <= 16 ? 'veryhigh' : 'ultra';
            const filename = `ascii-art-${this.asciiResult.scale}x-${qualityName}-${Date.now()}.png`;
            
            // Download the image
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            console.log(`Downloaded: ${filename} (${canvas.width}x${canvas.height})`);
            
        } catch (error) {
            console.error('Error downloading image:', error);
            alert('Error downloading image');
        }
    }
    
    renderHighQualityASCIIToCanvas(ctx, fontSize, charWidth, charHeight) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.asciiResult.html;
        
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
                    // Use proper character spacing
                    ctx.fillText(char, x * charWidth, y * charHeight);
                }
            }
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ASCIIConverter();
    console.log('ASCII Converter ready!');
});