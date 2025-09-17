import { BaseTrip } from './BaseTrip.js';
import L from 'leaflet';

export class LiveTrip extends BaseTrip {
  constructor(transportMode, userId, options = {}) {
    super(transportMode, userId, options);

    //GPS Trcking State
    this.watchId = null;
    this.path = [];
    this.currentPosition = null;

    //Map Integration
    this.map = options.map || null;
    this.polyline = null;

    //Callbacks for GPS updates
    this.onLocationUpdate = options.onLocationUpdate || (() => {});
    this.onDistanceUpdate = options.onDistanceUpdate || (() => {});
  }

  //Start GPS Tracking and Trip
  async startTrip() {
      if (this.isActive) {
        console.warn('Trip is already active');
        return false;
      }

      if (!this.config.gps.enabled) {
        this.onError('GPS not supported', `${this.transportMode} does not support GPS tracking`);
        return false;
      }

      try {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by this browser');
        }

        // Reset trip data
        this.path = [];
        this.data.distance = 0;
        this.emission = null;

        // Start GPS tracking
        this.watchId = navigator.geolocation.watchPosition(
          this.handleLocationUpdate.bind(this),
          this.handleLocationError.bind(this),
          {
            enableHighAccuracy: this.config.gps.accuracy === 'high',
            timeout: 10000,
            maximumAge: 0
          }
        );

        this.isActive = true;
        this.onStateChange({
          isActive: true,
          tracking: true,
          message: `${this.config.name} trip started - GPS tracking active`
        });

        return true;

      } catch (error) {
        console.error('Failed to start GPS tracking:', error);
        this.onError('GPS Error', error.message);
        return false;
      }
    }

  // End GPS tracking and finalize trip
  async endTrip() {
    if (!this.isActive) {
      console.warn('No active trip to end');
      return false;
    }

    try {
      // Stop GPS tracking
      if (this.watchId) {
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }

      // Calculate final distance
      this.calculateTotalDistance();

      this.isActive = false;
      this.onStateChange({
        isActive: false,
        tracking: false,
        message: `${this.config.name} trip ended - Distance: ${this.data.distance.toFixed(2)} km`
      });

      // Auto-calculate emissions
      const calculated = await this.calculateEmissions();

      if (calculated) {
        // AUTO-SAVE for live trips (this is the key difference from manual trips)
        const saved = await this.saveTrip();

        if (saved) {
          this.onStateChange({
            autoSaved: true,
            message: `${this.config.name} trip automatically saved to history!`
          });
        }

        return saved;
      }

      return false;

    } catch (error) {
      console.error('Failed to end trip:', error);
      this.onError('End Trip Error', error.message);
      return false;
    }
  }

  // Handle GPS location updates
  handleLocationUpdate(position) {
    const newPosition = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: Date.now(),
      accuracy: position.coords.accuracy
    };

    this.currentPosition = newPosition;
    this.path.push([newPosition.lat, newPosition.lng]);

    // Update map if available
    if (this.map && this.isActive) {
      this.updateMap(newPosition);
    }

    // Calculate distance in real-time
    this.calculateTotalDistance();

    // Notify listeners
    this.onLocationUpdate(newPosition);
    this.onDistanceUpdate(this.data.distance);
  }

  // Handle GPS errors
  handleLocationError(error) {
    let message;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = "Location access denied. Please enable GPS permissions.";
        break;
      case error.POSITION_UNAVAILABLE:
        message = "Location information unavailable. Please check GPS signal.";
        break;
      case error.TIMEOUT:
        message = "Location request timed out. Please try again.";
        break;
      default:
        message = "An unknown GPS error occurred.";
        break;
    }

    console.error('GPS Error:', error);
    this.onError('GPS Error', message);
  }

  // Calculate total distance from path
  calculateTotalDistance() {
    if (this.path.length < 2) {
      this.data.distance = 0;
      return;
    }

    let totalDistance = 0;
    for (let i = 1; i < this.path.length; i++) {
      const prev = L.latLng(this.path[i - 1]);
      const curr = L.latLng(this.path[i]);
      totalDistance += prev.distanceTo(curr); // Returns meters
    }

    // Convert to kilometers and round to 2 decimal places
    this.data.distance = parseFloat((totalDistance / 1000).toFixed(2));
    this.onDataUpdate({ distance: this.data.distance });
  }

  // Update map display
  updateMap(position) {
    if (!this.map) return;

    const latLng = L.latLng(position.lat, position.lng);

    // Add marker for current position
    L.marker(latLng)
      .bindPopup(`Current position<br/>Accuracy: ${position.accuracy}m`)
      .addTo(this.map);

    // Update polyline path
    if (!this.polyline) {
      this.polyline = L.polyline([], {
        color: this.getPathColor(),
        weight: 4,
        opacity: 0.8
      }).addTo(this.map);
    }

    this.polyline.addLatLng(latLng);

    // Center map on current position
    this.map.panTo(latLng);
  }

  // Get color for path based on transport mode
  getPathColor() {
    const colors = {
      car: '#ff0000',      // Red
      bus: '#0066cc',      // Blue
      tram: '#00cc66',     // Green
      metro: '#ff6600',    // Orange
      flight: '#9966cc'    // Purple
    };
    return colors[this.transportMode] || '#000000';
  }

  // Initialize map (called by UI component)
  initializeMap(mapContainer, options = {}) {
    if (!navigator.geolocation) {
      this.onError('GPS Not Available', 'Geolocation is not supported');
      return null;
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const center = [position.coords.latitude, position.coords.longitude];

          this.map = L.map(mapContainer, {
            center: center,
            zoom: options.zoom || 15,
            ...options
          });

          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(this.map);

          // Initialize polyline
          this.polyline = L.polyline([], {
            color: this.getPathColor(),
            weight: 4,
            opacity: 0.8
          }).addTo(this.map);

          resolve(this.map);
        },
        (error) => {
          console.error('Failed to get initial position:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000
        }
      );
    });
  }

  // Get trip summary for display
  getTripSummary() {
    return {
      ...this.getState(),
      path: this.path,
      totalPoints: this.path.length,
      startTime: this.path.length > 0 ? this.path[0].timestamp : null,
      endTime: this.isActive ? null : Date.now(),
      averageSpeed: this.calculateAverageSpeed()
    };
  }

  // Calculate average speed (km/h)
  calculateAverageSpeed() {
    if (this.path.length < 2 || this.data.distance === 0) return 0;

    const startTime = this.path[0].timestamp || Date.now();
    const endTime = this.isActive ? Date.now() : (this.path[this.path.length - 1].timestamp || Date.now());
    const durationHours = (endTime - startTime) / (1000 * 60 * 60);

    return durationHours > 0 ? (this.data.distance / durationHours).toFixed(1) : 0;
  }

  // Cleanup GPS tracking
  destroy() {
    super.destroy();

    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.path = [];
    this.polyline = null;
  }
}
