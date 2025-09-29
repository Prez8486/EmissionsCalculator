// src/utils/platformDetector.js
// Advanced platform detection for mobile app vs web browser

export class PlatformDetector {
  constructor() {
    this.userAgent = navigator.userAgent.toLowerCase();
    this.platform = navigator.platform.toLowerCase();
  }

  // Main method - determines if this is a mobile app vs web
  isMobileApp() {
    return this.isCordovaApp() ||
           this.isCapacitorApp() ||
           this.isElectronApp() ||
           this.isPWAStandalone() ||
           this.isMobileWebWithGPS();
  }

  // Check for Apache Cordova/PhoneGap
  isCordovaApp() {
    return !!(window.cordova || window.PhoneGap || window.phonegap);
  }

  // Check for Ionic Capacitor
  isCapacitorApp() {
    return !!(window.Capacitor || window.capacitor);
  }

  // Check for Electron (desktop app)
  isElectronApp() {
    return !!(window.require && window.require('electron'));
  }

  // Check if PWA is running in standalone mode
  isPWAStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  // Fallback: Mobile web browser with GPS capabilities
  isMobileWebWithGPS() {
    const isMobileDevice = this.isMobileDevice();
    const hasGeolocation = 'geolocation' in navigator;
    const hasTouchSupport = 'ontouchstart' in window;

    return isMobileDevice && hasGeolocation && hasTouchSupport;
  }

  // Check if running on mobile device
  isMobileDevice() {
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    return mobileRegex.test(this.userAgent) ||
           (window.innerWidth <= 768 && 'ontouchstart' in window);
  }

  // Check if running on iOS
  isIOS() {
    return /ipad|iphone|ipod/.test(this.userAgent);
  }

  // Check if running on Android
  isAndroid() {
    return /android/.test(this.userAgent);
  }

  // Check if GPS permissions are available
  async checkGPSAvailability() {
    if (!navigator.geolocation) {
      return { available: false, reason: 'Geolocation not supported' };
    }

    try {
      // Check permissions API if available
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          return { available: false, reason: 'GPS permission denied' };
        }
      }

      // Try to get current position with short timeout
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { timeout: 3000, enableHighAccuracy: false }
        );
      });

      return { available: true };
    } catch (error) {
      return {
        available: false,
        reason: `GPS error: ${error.message}`
      };
    }
  }

  // Get device info for debugging
  getDeviceInfo() {
    return {
      userAgent: this.userAgent,
      platform: this.platform,
      isMobileApp: this.isMobileApp(),
      isMobileDevice: this.isMobileDevice(),
      isIOS: this.isIOS(),
      isAndroid: this.isAndroid(),
      isCordova: this.isCordovaApp(),
      isCapacitor: this.isCapacitorApp(),
      isElectron: this.isElectronApp(),
      isPWAStandalone: this.isPWAStandalone(),
      hasGeolocation: 'geolocation' in navigator,
      hasTouch: 'ontouchstart' in window,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight
    };
  }
}

// Simple function export for quick use
export function detectPlatform() {
  const detector = new PlatformDetector();
  return {
    isMobileApp: detector.isMobileApp(),
    isWeb: !detector.isMobileApp(),
    deviceInfo: detector.getDeviceInfo()
  };
}

// Export singleton instance
export const platformDetector = new PlatformDetector();
