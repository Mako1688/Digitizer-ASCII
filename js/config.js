// Configuration constants for ASCII Image Digitizer
// Contains all magic numbers and configurable values

const CONFIG = {
    // ASCII character sets (ordered from darkest to lightest)
    ASCII_CHARS: [
        '$', '@', 'B', '%', '8', '&', 'W', 'M', '#', '*', 
        'o', 'a', 'h', 'k', 'b', 'd', 'p', 'q', 'w', 'm', 
        'Z', 'O', '0', 'Q', 'L', 'C', 'J', 'U', 'Y', 'X', 
        'z', 'c', 'v', 'u', 'n', 'x', 'r', 'j', 'f', 't', 
        '/', '\\', '|', '(', ')', '1', '{', '}', '[', ']', 
        '?', '-', '_', '+', '~', '<', '>', 'i', '!', 'l', 
        'I', ';', ':', ',', '"', '^', '`', "'", '.', ' '
    ],

    // Valid image file types
    VALID_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],

    // Default settings
    DEFAULT_SETTINGS: {
        imageSize: 1,
        resolution: 100,
        fontSize: 8,
        contrast: 1.0,
        colored: false,
        inverted: false,
        zoom: 100
    },

    // UI ranges and limits
    ZOOM: {
        MIN: 25,
        MAX: 400,
        STEP: 10,
        DEFAULT: 100
    },

    RESOLUTION: {
        MIN: 50,
        MAX: 200,
        DEFAULT: 100,
        STEP: 10
    },

    FONT_SIZE: {
        MIN: 4,
        MAX: 16,
        DEFAULT: 8,
        STEP: 1
    },

    CONTRAST: {
        MIN: 0.5,
        MAX: 2.0,
        DEFAULT: 1.0,
        STEP: 0.1
    },

    // Character aspect ratio (monospace fonts are roughly 0.6 width-to-height)
    CHAR_ASPECT_RATIO: 0.6,

    // Contrast calculation constants
    CONTRAST_FORMULA: {
        MULTIPLIER: 259,
        OFFSET: 255,
        CENTER: 0.5
    },

    // Camera settings
    CAMERA: {
        MOBILE_WIDTH: 1920,
        MOBILE_HEIGHT: 1080,
        DESKTOP_WIDTH: 1280,
        DESKTOP_HEIGHT: 720,
        SCROLL_DELAY: 300 // ms
    },

    // Notification settings
    NOTIFICATION: {
        DURATION: 3000, // ms
        FADE_OUT_DURATION: 300, // ms
        VIBRATION_DURATION: 50 // ms
    },

    // Canvas and export settings
    CANVAS: {
        BACKGROUND_COLOR: '#1e1e1e',
        TEXT_COLOR: '#ffffff',
        FONT_FAMILY: '"Courier New", monospace',
        TEXT_BASELINE: 'top'
    },

    // Preview dimensions
    PREVIEW: {
        PADDING: 30 // px to account for when fitting to view
    },

    // GIF animation settings
    GIF: {
        LARGE_FILE_THRESHOLD: 10 * 1024 * 1024, // 10MB - show warning for files larger than this
        THUMBNAIL_SIZE: 120, // px for thumbnail preview
        DEFAULT_FRAME_DELAY: 100, // ms - default delay if not specified in GIF
        MIN_FRAME_DELAY: 20, // ms - minimum delay to prevent too-fast playback
        MAX_FRAME_DELAY: 5000, // ms - maximum delay
        EXPORT_QUALITY: 10 // Quality for GIF export (1-30, lower is better)
    }
};

// Mobile device detection regex
const MOBILE_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
