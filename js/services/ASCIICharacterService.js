// ASCII Character Service
// Single Responsibility: Manage ASCII character sets and character selection based on brightness

class ASCIICharacterService {
    constructor(asciiChars = CONFIG.ASCII_CHARS) {
        this.asciiChars = asciiChars;
        this.asciiCharsInverted = [...asciiChars].reverse();
        
        // Edge-aware character sets (ordered by visual density/complexity)
        this.edgeChars = {
            high: ['#', '@', '$', '%', '&', 'M', 'W', 'B', '8', '*', 'N', 'H'],
            medium: ['o', 'a', 'h', 'k', 'b', 'd', 'p', 'q', 'w', 'm', 'Z', 'O'],
            low: ['0', 'Q', 'L', 'C', 'J', 'U', 'Y', 'X', 'z', 'c', 'v', 'u'],
            minimal: ['n', 'x', 'r', 'j', 'f', 't', '/', '\\', '|', '(', ')'],
            sparse: ['1', '{', '}', '[', ']', '?', '-', '_', '+', '~', '<', '>'],
            light: ['i', '!', 'l', 'I', ';', ':', ',', '"', '^', '`', "'", '.'],
            transparent: [' ']
        };
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
     * Enhanced for better dark color handling
     * @param {number} brightness - Normalized brightness value (0-1)
     * @param {boolean} inverted - Whether to use inverted mapping
     * @returns {string} The corresponding ASCII character
     */
    brightnessToChar(brightness, inverted = false) {
        const chars = this.getCharacterSet(inverted);
        
        // Apply gamma correction for better dark color representation
        // This makes dark values more distinguishable
        const gammaCorrectedBrightness = Math.pow(brightness, 0.8);
        
        // Ensure minimum visibility - don't use spaces for any color above 10% brightness
        let adjustedBrightness = gammaCorrectedBrightness;
        if (brightness > 0.1 && adjustedBrightness > 0.95) {
            adjustedBrightness = 0.95; // Prevent mapping to spaces for non-transparent colors
        }
        
        const charIndex = Math.floor(adjustedBrightness * (chars.length - 1));
        return chars[charIndex];
    }

    /**
     * Select character based on brightness and edge intensity (edge-aware selection)
     * Enhanced for better dark color handling
     * @param {number} brightness - Normalized brightness value (0-1)
     * @param {number} edgeIntensity - Edge intensity (0-1)
     * @param {boolean} inverted - Whether to use inverted mapping
     * @returns {string} The best ASCII character for the region
     */
    selectEdgeAwareCharacter(brightness, edgeIntensity, inverted = false) {
        // Apply gamma correction for dark colors
        const gammaCorrectedBrightness = Math.pow(brightness, 0.8);
        
        // Determine character complexity based on edge intensity
        let charSet;
        if (edgeIntensity > 0.7) {
            charSet = this.edgeChars.high;
        } else if (edgeIntensity > 0.5) {
            charSet = this.edgeChars.medium;
        } else if (edgeIntensity > 0.3) {
            charSet = this.edgeChars.low;
        } else if (edgeIntensity > 0.1) {
            charSet = this.edgeChars.minimal;
        } else if (brightness > 0.05) { // Lower threshold for using sparse characters
            charSet = this.edgeChars.sparse;
        } else {
            charSet = this.edgeChars.light;
        }
        
        // Select character based on brightness within the edge-appropriate set
        if (inverted) {
            charSet = [...charSet].reverse();
        }
        
        // Ensure we don't map dark colors to spaces
        let adjustedBrightness = gammaCorrectedBrightness;
        if (brightness > 0.1 && adjustedBrightness > 0.95) {
            adjustedBrightness = 0.95;
        }
        
        const charIndex = Math.floor(adjustedBrightness * (charSet.length - 1));
        return charSet[charIndex];
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
