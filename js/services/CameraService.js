// Camera Service
// Single Responsibility: Handle all camera-related operations

class CameraService {
    constructor() {
        this.stream = null;
        this.videoElement = document.getElementById('videoElement');
        this.cameraContainer = document.getElementById('cameraContainer');
    }

    /**
     * Check if device is mobile
     * @returns {boolean} True if mobile device detected
     */
    isMobileDevice() {
        return MOBILE_REGEX.test(navigator.userAgent);
    }

    /**
     * Get camera constraints based on device type
     * @returns {Object} MediaStream constraints object
     */
    getCameraConstraints() {
        const isMobile = this.isMobileDevice();
        
        return {
            video: {
                // Use back camera on mobile, front camera on desktop
                facingMode: isMobile ? { ideal: 'environment' } : 'user',
                width: { 
                    ideal: isMobile ? CONFIG.CAMERA.MOBILE_WIDTH : CONFIG.CAMERA.DESKTOP_WIDTH 
                },
                height: { 
                    ideal: isMobile ? CONFIG.CAMERA.MOBILE_HEIGHT : CONFIG.CAMERA.DESKTOP_HEIGHT 
                }
            }
        };
    }

    /**
     * Open camera and start video stream
     * @returns {Promise<void>}
     * @throws {Error} If camera access fails
     */
    async openCamera() {
        try {
            const constraints = this.getCameraConstraints();
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            this.cameraContainer.hidden = false;
            
            // Scroll to camera view on mobile after brief delay
            if (this.isMobileDevice()) {
                setTimeout(() => {
                    this.cameraContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, CONFIG.CAMERA.SCROLL_DELAY);
            }
        } catch (error) {
            console.error('Camera access error:', error);
            throw new Error('Unable to access camera. Please check camera permissions.');
        }
    }

    /**
     * Close camera and stop all tracks
     */
    closeCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.cameraContainer.hidden = true;
    }

    /**
     * Get current video element
     * @returns {HTMLVideoElement} The video element
     */
    getVideoElement() {
        return this.videoElement;
    }

    /**
     * Check if camera is currently active
     * @returns {boolean} True if camera stream is active
     */
    isCameraActive() {
        return this.stream !== null && this.stream.active;
    }
}
