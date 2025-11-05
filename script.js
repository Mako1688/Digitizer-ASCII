// ASCII Image Digitizer
// Main application logic

class ASCIIDigitizer {
    constructor() {
        // Extended ASCII character set from darkest to lightest for better depth representation
        // More characters = better gradient and depth perception
        this.asciiChars = [
            '$', '@', 'B', '%', '8', '&', 'W', 'M', '#', '*', 
            'o', 'a', 'h', 'k', 'b', 'd', 'p', 'q', 'w', 'm', 
            'Z', 'O', '0', 'Q', 'L', 'C', 'J', 'U', 'Y', 'X', 
            'z', 'c', 'v', 'u', 'n', 'x', 'r', 'j', 'f', 't', 
            '/', '\\', '|', '(', ')', '1', '{', '}', '[', ']', 
            '?', '-', '_', '+', '~', '<', '>', 'i', '!', 'l', 
            'I', ';', ':', ',', '"', '^', '`', "'", '.', ' '
        ];
        this.asciiCharsInverted = [...this.asciiChars].reverse();
        
        // Application state
        this.currentImage = null;
        this.currentImageUrl = null;
        this.asciiText = '';
        this.coloredData = null;
        this.stream = null;
        
        // Settings
        this.settings = {
            resolution: 100,
            fontSize: 8,
            contrast: 1.0,
            colored: false,
            inverted: false,
            zoom: 100
        };
        
        this.initializeElements();
        this.attachEventListeners();
    }
    
    initializeElements() {
        // Buttons
        this.uploadBtn = document.getElementById('uploadBtn');
        this.cameraBtn = document.getElementById('cameraBtn');
        this.fileInput = document.getElementById('fileInput');
        this.captureBtn = document.getElementById('captureBtn');
        this.closeCameraBtn = document.getElementById('closeCameraBtn');
        this.generateBtn = document.getElementById('generateBtn');
        this.copyTextBtn = document.getElementById('copyTextBtn');
        this.downloadImageBtn = document.getElementById('downloadImageBtn');
        this.downloadTextBtn = document.getElementById('downloadTextBtn');
        
        // Zoom controls
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.fitBtn = document.getElementById('fitBtn');
        this.zoomLevel = document.getElementById('zoomLevel');
        
        // Controls
        this.resolutionSlider = document.getElementById('resolutionSlider');
        this.fontSizeSlider = document.getElementById('fontSizeSlider');
        this.contrastSlider = document.getElementById('contrastSlider');
        this.colorToggle = document.getElementById('colorToggle');
        this.invertToggle = document.getElementById('invertToggle');
        
        // Display elements
        this.cameraContainer = document.getElementById('cameraContainer');
        this.videoElement = document.getElementById('videoElement');
        this.imageCanvas = document.getElementById('imageCanvas');
        this.originalPreview = document.getElementById('originalPreview');
        this.asciiPreview = document.getElementById('asciiPreview');
        
        // Value displays
        this.resolutionValue = document.getElementById('resolutionValue');
        this.fontSizeValue = document.getElementById('fontSizeValue');
        this.contrastValue = document.getElementById('contrastValue');
    }
    
    attachEventListeners() {
        // File upload
        this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Camera
        this.cameraBtn.addEventListener('click', () => this.openCamera());
        this.captureBtn.addEventListener('click', () => this.capturePhoto());
        this.closeCameraBtn.addEventListener('click', () => this.closeCamera());
        
        // Generate
        this.generateBtn.addEventListener('click', () => this.generateASCII());
        
        // Export
        this.copyTextBtn.addEventListener('click', () => this.copyToClipboard());
        this.downloadImageBtn.addEventListener('click', () => this.downloadAsImage());
        this.downloadTextBtn.addEventListener('click', () => this.downloadAsText());
        
        // Settings
        this.resolutionSlider.addEventListener('input', (e) => {
            this.settings.resolution = parseInt(e.target.value);
            this.resolutionValue.textContent = e.target.value;
        });
        
        this.fontSizeSlider.addEventListener('input', (e) => {
            this.settings.fontSize = parseInt(e.target.value);
            this.fontSizeValue.textContent = e.target.value;
            this.updateASCIIDisplay();
        });
        
        this.contrastSlider.addEventListener('input', (e) => {
            this.settings.contrast = parseFloat(e.target.value);
            this.contrastValue.textContent = e.target.value;
        });
        
        this.colorToggle.addEventListener('change', (e) => {
            this.settings.colored = e.target.checked;
            if (this.asciiText) {
                this.generateASCII();
            }
        });
        
        this.invertToggle.addEventListener('change', (e) => {
            this.settings.inverted = e.target.checked;
        });
        
        // Zoom controls
        this.zoomInBtn.addEventListener('click', () => this.adjustZoom(10));
        this.zoomOutBtn.addEventListener('click', () => this.adjustZoom(-10));
        this.fitBtn.addEventListener('click', () => this.fitToView());
    }
    
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            alert('ERROR: Please upload a valid image file (PNG, JPG, JPEG, or GIF)');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.loadImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }
    
    async openCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            this.videoElement.srcObject = this.stream;
            this.cameraContainer.hidden = false;
        } catch (error) {
            alert('ERROR: Unable to access camera. Please check your camera permissions in browser settings.');
            console.error('Camera error:', error);
        }
    }
    
    capturePhoto() {
        const canvas = this.imageCanvas;
        const video = this.videoElement;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        const imageDataUrl = canvas.toDataURL('image/png');
        this.loadImage(imageDataUrl);
        this.closeCamera();
    }
    
    closeCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.cameraContainer.hidden = true;
    }
    
    loadImage(dataUrl) {
        this.currentImageUrl = dataUrl;
        
        const img = new Image();
        img.onload = () => {
            this.currentImage = img;
            this.displayOriginalImage();
            this.generateBtn.disabled = false;
        };
        img.src = dataUrl;
    }
    
    displayOriginalImage() {
        this.originalPreview.innerHTML = `<img src="${this.currentImageUrl}" alt="Original Image">`;
    }
    
    generateASCII() {
        if (!this.currentImage) return;
        
        const canvas = this.imageCanvas;
        const ctx = canvas.getContext('2d');
        
        // Use original image dimensions to maintain exact pixel size
        // Resolution slider now controls the character density/sampling
        const originalWidth = this.currentImage.width;
        const originalHeight = this.currentImage.height;
        
        // Calculate character dimensions to match pixel size
        // ASCII characters are roughly 0.6 width-to-height ratio in monospace fonts
        const charAspectRatio = 0.6;
        const scale = this.settings.resolution / 100;
        
        // Calculate how many characters we need to fill the original dimensions
        const charWidth = Math.floor(originalWidth / (this.settings.fontSize * charAspectRatio) * scale);
        const charHeight = Math.floor(originalHeight / this.settings.fontSize * scale);
        
        canvas.width = charWidth;
        canvas.height = charHeight;
        
        // Draw and process image
        ctx.drawImage(this.currentImage, 0, 0, charWidth, charHeight);
        const imageData = ctx.getImageData(0, 0, charWidth, charHeight);
        
        // Generate ASCII
        if (this.settings.colored) {
            this.generateColoredASCII(imageData, charWidth, charHeight);
        } else {
            this.generateMonochromeASCII(imageData, charWidth, charHeight);
        }
        
        // Enable export buttons
        this.copyTextBtn.disabled = false;
        this.downloadImageBtn.disabled = false;
        this.downloadTextBtn.disabled = false;
        
        // Enable zoom controls
        this.zoomInBtn.disabled = false;
        this.zoomOutBtn.disabled = false;
        this.fitBtn.disabled = false;
        
        // Reset zoom to 100%
        this.settings.zoom = 100;
        this.updateZoomDisplay();
    }
    
    generateMonochromeASCII(imageData, width, height) {
        const chars = this.settings.inverted ? this.asciiCharsInverted : this.asciiChars;
        let ascii = '';
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const offset = (y * width + x) * 4;
                const r = imageData.data[offset];
                const g = imageData.data[offset + 1];
                const b = imageData.data[offset + 2];
                
                // Convert to grayscale and apply contrast
                let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                brightness = this.applyContrast(brightness);
                
                const charIndex = Math.floor(brightness * (chars.length - 1));
                ascii += chars[charIndex];
            }
            ascii += '\n';
        }
        
        this.asciiText = ascii;
        this.asciiPreview.textContent = ascii;
        this.updateASCIIDisplay();
    }
    
    generateColoredASCII(imageData, width, height) {
        const chars = this.settings.inverted ? this.asciiCharsInverted : this.asciiChars;
        this.asciiPreview.innerHTML = '';
        let asciiTextOnly = '';
        
        // Store colored data for image export
        this.coloredData = [];
        
        // Create a line-by-line approach for better performance and rendering
        for (let y = 0; y < height; y++) {
            const lineDiv = document.createElement('div');
            lineDiv.style.margin = '0';
            lineDiv.style.padding = '0';
            lineDiv.style.lineHeight = `${this.settings.fontSize}px`;
            lineDiv.style.height = `${this.settings.fontSize}px`;
            lineDiv.style.whiteSpace = 'nowrap';
            
            const lineData = [];
            
            for (let x = 0; x < width; x++) {
                const offset = (y * width + x) * 4;
                const r = imageData.data[offset];
                const g = imageData.data[offset + 1];
                const b = imageData.data[offset + 2];
                
                // Calculate brightness for character selection
                let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                brightness = this.applyContrast(brightness);
                
                const charIndex = Math.floor(brightness * (chars.length - 1));
                const char = chars[charIndex];
                
                // Store character and color data
                lineData.push({ char, r, g, b });
                
                // Create colored span
                const span = document.createElement('span');
                span.textContent = char;
                span.style.color = `rgb(${r},${g},${b})`;
                span.style.fontSize = `${this.settings.fontSize}px`;
                span.style.lineHeight = `${this.settings.fontSize}px`;
                lineDiv.appendChild(span);
                
                asciiTextOnly += char;
            }
            
            this.coloredData.push(lineData);
            this.asciiPreview.appendChild(lineDiv);
            asciiTextOnly += '\n';
        }
        
        this.asciiText = asciiTextOnly;
        this.updateASCIIDisplay();
    }
    
    applyContrast(value) {
        // Apply contrast adjustment
        const factor = (259 * (this.settings.contrast * 255 + 255)) / 
                      (255 * (259 - this.settings.contrast * 255));
        value = factor * (value - 0.5) + 0.5;
        return Math.max(0, Math.min(1, value));
    }
    
    updateASCIIDisplay() {
        const scaledFontSize = this.settings.fontSize * (this.settings.zoom / 100);
        this.asciiPreview.style.fontSize = `${scaledFontSize}px`;
        this.asciiPreview.style.lineHeight = `${scaledFontSize}px`;
        
        // Update colored ASCII if it exists
        if (this.settings.colored && this.asciiPreview.children.length > 0) {
            const divs = this.asciiPreview.querySelectorAll('div');
            divs.forEach(div => {
                div.style.lineHeight = `${scaledFontSize}px`;
                div.style.height = `${scaledFontSize}px`;
                const spans = div.querySelectorAll('span');
                spans.forEach(span => {
                    span.style.fontSize = `${scaledFontSize}px`;
                    span.style.lineHeight = `${scaledFontSize}px`;
                });
            });
        }
    }
    
    adjustZoom(delta) {
        this.settings.zoom = Math.max(25, Math.min(400, this.settings.zoom + delta));
        this.updateZoomDisplay();
        this.updateASCIIDisplay();
    }
    
    fitToView() {
        // Calculate the optimal zoom to fit the ASCII in the preview area
        const previewWidth = this.asciiPreview.clientWidth - 30; // Account for padding
        const previewHeight = this.asciiPreview.clientHeight - 30;
        
        if (this.asciiText) {
            const lines = this.asciiText.split('\n').filter(line => line.length > 0);
            const maxLineLength = Math.max(...lines.map(line => line.length));
            const lineCount = lines.length;
            
            const charAspectRatio = 0.6;
            const currentCharWidth = this.settings.fontSize * charAspectRatio;
            const currentCharHeight = this.settings.fontSize;
            
            const totalWidth = maxLineLength * currentCharWidth;
            const totalHeight = lineCount * currentCharHeight;
            
            const widthZoom = (previewWidth / totalWidth) * 100;
            const heightZoom = (previewHeight / totalHeight) * 100;
            
            this.settings.zoom = Math.floor(Math.min(widthZoom, heightZoom, 100));
            this.updateZoomDisplay();
            this.updateASCIIDisplay();
        }
    }
    
    updateZoomDisplay() {
        this.zoomLevel.textContent = `${this.settings.zoom}%`;
    }
    
    copyToClipboard() {
        navigator.clipboard.writeText(this.asciiText).then(() => {
            this.showNotification('ASCII art copied to clipboard successfully!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('ERROR: Failed to copy to clipboard. Please try again.');
        });
    }
    
    downloadAsImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Match original image dimensions exactly
        const originalWidth = this.currentImage.width;
        const originalHeight = this.currentImage.height;
        
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        
        // Calculate font size to fit the dimensions
        const lines = this.asciiText.split('\n').filter(line => line.length > 0);
        const maxLineLength = Math.max(...lines.map(line => line.length));
        const charAspectRatio = 0.6;
        
        // Calculate optimal font size to match dimensions
        const fontSizeByWidth = originalWidth / (maxLineLength * charAspectRatio);
        const fontSizeByHeight = originalHeight / lines.length;
        const optimalFontSize = Math.min(fontSizeByWidth, fontSizeByHeight);
        
        // Set background
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set text properties
        ctx.font = `${optimalFontSize}px "Courier New", monospace`;
        ctx.textBaseline = 'top';
        
        if (this.settings.colored && this.coloredData && this.coloredData.length > 0) {
            // Render colored ASCII using stored data
            this.coloredData.forEach((lineData, lineIndex) => {
                let x = 0;
                const y = lineIndex * optimalFontSize;
                
                lineData.forEach(charData => {
                    ctx.fillStyle = `rgb(${charData.r},${charData.g},${charData.b})`;
                    ctx.fillText(charData.char, x, y);
                    x += optimalFontSize * charAspectRatio;
                });
            });
        } else {
            // Render monochrome ASCII
            ctx.fillStyle = '#ffffff';
            lines.forEach((line, index) => {
                ctx.fillText(line, 0, index * optimalFontSize);
            });
        }
        
        // Download
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ascii-art-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
            this.showNotification(`Image saved successfully! (${originalWidth}x${originalHeight}px)`);
        });
    }
    
    downloadAsText() {
        const blob = new Blob([this.asciiText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ascii-art-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        this.showNotification('Text file saved successfully!');
    }
    
    showNotification(message) {
        // Terminal-style notification
        const notification = document.createElement('div');
        notification.textContent = `> ${message}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #000000;
            color: #00ff00;
            padding: 15px 25px;
            border: 2px solid #00ff00;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
            text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the application
const app = new ASCIIDigitizer();
