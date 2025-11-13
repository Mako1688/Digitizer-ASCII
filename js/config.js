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
        zoom: 100,
        edgeEnhanced: false  // Disable expensive edge enhancement by default for performance
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

    // Loading and performance settings
    LOADING: {
        PROGRESS_UPDATE_INTERVAL: 25, // ms - how often to update progress (reduced for better responsiveness)
        CHUNK_SIZE: 20, // Lines to process per chunk (increased for better performance)
        ANIMATION_DURATION: 200, // ms for loading animations (reduced)
        SPINNER_SPEED: 800, // ms per rotation (faster)
        DEBOUNCE_DELAY: 50 // ms to debounce rapid generation requests (reduced)
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
    },

    // ASCII Generation Quality Settings
    ASCII_QUALITY: {
        // Multi-sampling for better color accuracy (reduced for performance)
        MULTI_SAMPLE_GRID: 2, // Sample 2x2 grid per character cell (reduced from 3x3)
        
        // Edge detection settings
        EDGE_DETECTION: {
            THRESHOLD: 0.15, // Edge detection sensitivity (increased threshold for faster processing)
            SOBEL_KERNEL: [
                [-1, -2, -1],
                [ 0,  0,  0],
                [ 1,  2,  1]
            ]
        },
        
        // Dithering settings
        DITHERING: {
            ERROR_DIFFUSION_MATRIX: [
                [0, 0, 7/16],
                [3/16, 5/16, 1/16]
            ],
            INTENSITY: 0.75 // How much error to diffuse (0-1)
        },
        
        // Green screen / transparency handling
        GREEN_SCREEN: {
            HUE_RANGE: [60, 180], // Green hue range in HSV
            SATURATION_MIN: 0.3, // Minimum saturation to consider "green"
            TRANSPARENCY_CHAR: ' ', // Character for transparent areas
            BACKGROUND_REPLACEMENT: [0, 0, 0, 0] // RGBA for green screen replacement
        }
    },

    // Terminal color palette (16 colors + grayscale variants)
    TERMINAL_COLORS: [
        // Standard 16 terminal colors
        [0, 0, 0],       // Black
        [128, 0, 0],     // Dark Red
        [0, 128, 0],     // Dark Green  
        [128, 128, 0],   // Dark Yellow
        [0, 0, 128],     // Dark Blue
        [128, 0, 128],   // Dark Magenta
        [0, 128, 128],   // Dark Cyan
        [192, 192, 192], // Light Gray
        [128, 128, 128], // Dark Gray
        [255, 0, 0],     // Red
        [0, 255, 0],     // Green
        [255, 255, 0],   // Yellow
        [0, 0, 255],     // Blue
        [255, 0, 255],   // Magenta
        [0, 255, 255],   // Cyan
        [255, 255, 255], // White
        
        // Extended grayscale for better monochrome representation
        [32, 32, 32],    // Very Dark Gray
        [64, 64, 64],    // Dark Gray 2
        [96, 96, 96],    // Medium Dark Gray
        [160, 160, 160], // Medium Light Gray
        [224, 224, 224]  // Very Light Gray
    ]
};

// Mobile device detection regex
const MOBILE_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
