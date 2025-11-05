// ASCII Generator Service
// Single Responsibility: Generate ASCII art from image data (both monochrome and colored)

class ASCIIGeneratorService {
    constructor(characterService, imageProcessor) {
        this.characterService = characterService;
        this.imageProcessor = imageProcessor;
    }

    /**
     * Generate monochrome ASCII art from image data
     * @param {ImageData} imageData - Image data to convert
     * @param {number} width - Width in characters
     * @param {number} height - Height in characters
     * @param {Object} settings - Generation settings (inverted, contrast)
     * @returns {string} ASCII art as plain text
     */
    generateMonochrome(imageData, width, height, settings) {
        const { inverted, contrast } = settings;
        let asciiText = '';
        
        for (let y = 0; y < height; y++) {
            asciiText += this.generateMonochromeLine(imageData, y, width, inverted, contrast);
            asciiText += '\n';
        }
        
        return asciiText;
    }

    /**
     * Generate a single line of monochrome ASCII
     * @param {ImageData} imageData - Image data
     * @param {number} y - Y coordinate (row)
     * @param {number} width - Width in characters
     * @param {boolean} inverted - Whether to invert brightness
     * @param {number} contrast - Contrast multiplier
     * @returns {string} Single line of ASCII characters
     */
    generateMonochromeLine(imageData, y, width, inverted, contrast) {
        let line = '';
        
        for (let x = 0; x < width; x++) {
            const pixel = this.imageProcessor.getPixelData(imageData, x, y, width);
            const brightness = this.characterService.rgbToBrightness(pixel.r, pixel.g, pixel.b);
            const adjustedBrightness = this.imageProcessor.applyContrast(brightness, contrast);
            const char = this.characterService.brightnessToChar(adjustedBrightness, inverted);
            line += char;
        }
        
        return line;
    }

    /**
     * Generate colored ASCII art from image data
     * @param {ImageData} imageData - Image data to convert
     * @param {number} width - Width in characters
     * @param {number} height - Height in characters
     * @param {Object} settings - Generation settings (inverted, contrast, fontSize)
     * @returns {Object} Object with coloredData array and asciiText string
     */
    generateColored(imageData, width, height, settings) {
        const { inverted, contrast, fontSize } = settings;
        const coloredData = [];
        let asciiText = '';
        
        for (let y = 0; y < height; y++) {
            const lineResult = this.generateColoredLine(imageData, y, width, inverted, contrast);
            coloredData.push(lineResult.lineData);
            asciiText += '\n';
        }
        
        return { coloredData, asciiText };
    }

    /**
     * Generate a single line of colored ASCII data
     * @param {ImageData} imageData - Image data
     * @param {number} y - Y coordinate (row)
     * @param {number} width - Width in characters
     * @param {boolean} inverted - Whether to invert brightness
     * @param {number} contrast - Contrast multiplier
     * @returns {Object} Object with lineData array containing character and color info
     */
    generateColoredLine(imageData, y, width, inverted, contrast) {
        const lineData = [];
        
        for (let x = 0; x < width; x++) {
            const pixel = this.imageProcessor.getPixelData(imageData, x, y, width);
            const brightness = this.characterService.rgbToBrightness(pixel.r, pixel.g, pixel.b);
            const adjustedBrightness = this.imageProcessor.applyContrast(brightness, contrast);
            const char = this.characterService.brightnessToChar(adjustedBrightness, inverted);
            
            lineData.push({
                char: char,
                color: `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`
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
            span.style.color = charData.color;
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
