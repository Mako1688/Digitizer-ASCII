// ASCII Character Service
// Single Responsibility: Manage ASCII character sets and character selection based on brightness

class ASCIICharacterService {
    constructor(asciiChars = CONFIG.ASCII_CHARS) {
        this.asciiChars = asciiChars;
        this.asciiCharsInverted = [...asciiChars].reverse();
    }

    /**
     * Get the appropriate character set based on inversion setting
     * @param {boolean} inverted - Whether to use inverted character set
     * @returns {Array<string>} The character set array
     */
    getCharacterSet(inverted = false) {
        return inverted ? this.asciiCharsInverted : this.asciiChars;
    }

    /**
     * Convert a brightness value (0-1) to an ASCII character
     * @param {number} brightness - Normalized brightness value (0-1)
     * @param {boolean} inverted - Whether to use inverted mapping
     * @returns {string} The corresponding ASCII character
     */
    brightnessToChar(brightness, inverted = false) {
        const chars = this.getCharacterSet(inverted);
        const charIndex = Math.floor(brightness * (chars.length - 1));
        return chars[charIndex];
    }

    /**
     * Calculate brightness from RGB values
     * @param {number} r - Red value (0-255)
     * @param {number} g - Green value (0-255)
     * @param {number} b - Blue value (0-255)
     * @returns {number} Normalized brightness (0-1)
     */
    rgbToBrightness(r, g, b) {
        // Using luminance formula for perceptually accurate brightness
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }

    /**
     * Get the total number of characters in the set
     * @returns {number} Character set length
     */
    getCharacterSetLength() {
        return this.asciiChars.length;
    }
}
