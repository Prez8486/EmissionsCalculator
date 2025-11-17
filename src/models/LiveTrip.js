import { BaseTrip } from './BaseTrip.js';
import L from 'leaflet';
import { API_BASE } from '../config/apiConfig.js';

export class LiveTrip extends BaseTrip {
  constructor(transportMode, userId, options = {}) {
    super(transportMode, userId, options);

    //GPS Trcking State
    this.watchId = null;
    this.path = [];
    this.currentPosition = null;
    this.tripStartTime = null;

    // AI sensor collection state
    this.sensorBuffer = [];
    this.batchSize = 600; // 10Hz * 60 seconds
    this.sensorInterval = null;
    this.tripId = null;
    this.lastPrediction = null;
    this.lastMotionData = null;
    this.lastOrientationData = null;
    this.onPredictionReceived = options.onPredictionReceived || (() => {});

    //Map Integration
    this.map = options.map || null;
    this.polyline = null;

    //Callbacks for GPS updates
    this.onLocationUpdate = options.onLocationUpdate || (() => {});
    this.onDistanceUpdate = options.onDistanceUpdate || (() => {});

    //Route Planning Properties
    this.destination = null // { lat, lon, address }
    this.plannedRoute = null // PlannedRoute instance
    this.selectedRouteType = null;    // 'fastest' or 'greenest'
    this.isFollowingRoute = false;    // Track if user is following planned route
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
        //Check if following planned route
        if (this.destination && this.plannedRoute) {
          this.isFollowingRoute = true;
          console.log(`🗺️ Starting trip following ${this.selectedRouteType} route`);
          console.log('Planned route data:', this.getPlannedRouteData());
        }
      } catch (err) {
        console.error('Error preparing planned route:', err);
      }

      try {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by this browser');
        }

        // Start backend trip to get tripId
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const response = await fetch(`${API_BASE}/trips/start`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                transportMode: this.transportMode,
                userId: this.userId
              })
            });

            if (response.ok) {
              const data = await response.json();
              this.tripId = data.tripId;
              console.log('Backend trip started with ID:', this.tripId);
            }
          } catch (error) {
            console.warn('Failed to start backend trip, continuing with GPS only:', error);
          }
        }

        // Reset trip data
        this.path = [];
        this.data.distance = 0;
        this.emission = null;
        this.sensorBuffer = [];
        this.tripStartTime = Date.now();

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

        // Start sensor collection only if AI is enabled and we have a tripId
        if (this.aiEnabled && this.tripId) {
          this.startSensorCollection();
        }


        this.isActive = true;
        this.onStateChange({
          isActive: true,
          tracking: true,
          aiEnabled: !!this.tripId,
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

      // Stop sensor collection and send final batch
      this.stopSensorCollection();

      // Calculate final distance
      this.calculateTotalDistance();

      // End backend trip if we have a tripId
      if (this.tripId) {
        try {
          const token = localStorage.getItem('token');
          await fetch(`${API_BASE}/trips/end`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              tripId: this.tripId,
              distanceKm: this.data.distance,
              durationSeconds: Math.floor((Date.now() - Date.now()) / 1000), // You'll need to track start time
              path: this.path,
              finalPrediction: this.lastPrediction
            })
          });
        } catch (error) {
          console.error('Failed to end backend trip:', error);
        }
      }

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
        const saved = true;

        if (saved) {
          this.onStateChange({
            tripCompleted: true,
            aiPrediction: this.lastPrediction,
            message: `${this.config.name} trip automatically saved to history!`
          });
        }

        return saved;
      }

      return true;

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
    console.log(this.path);
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
  initializeMap(mapContainer, options = {}, coords = null) {
    return new Promise((resolve, reject) => {
      // Prevent double initialization
      if (this.map) {
        console.log("ℹ️ Map already initialized");
        if (coords) this.map.setView([coords.lat, coords.lng], options.zoom || 15);
        return resolve(this.map);
      }

      // Function to actually create map
      const createMap = (center) => {
        this.map = L.map(mapContainer, {
          center,
          zoom: options.zoom || 15,
          ...options
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.polyline = L.polyline([], {
          color: this.getPathColor(),
          weight: 4,
          opacity: 0.8
        }).addTo(this.map);

        resolve(this.map);
      };

      // If coords passed directly, use them
      if (coords) {
        return createMap([coords.lat, coords.lng]);
      }

      // Otherwise, fetch geolocation
      if (!navigator.geolocation) {
        this.onError('GPS Not Available', 'Geolocation is not supported');
        return reject(new Error('Geolocation not supported'));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => createMap([position.coords.latitude, position.coords.longitude]),
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000 }
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

  // AI Sensor Collection Methods
  startSensorCollection() {
    if (!this.tripId) {
      console.error('❌ Cannot start sensor collection: No tripId available');
      return;
    }

    console.log('🚀 Starting AI sensor collection...');
    console.log('📋 Sensor collection config:', {
      tripId: this.tripId,
      transportMode: this.transportMode,
      batchSize: this.batchSize,
      interval: '100ms (10Hz)'
    });

    // Set up device motion/orientation listeners
    this.setupSensorListeners();

    // Start collecting sensor data every 100ms (10Hz)
    this.sensorInterval = setInterval(() => {
      this.captureAndBufferSensorData();
    }, 100);

    console.log('✅ AI sensor collection started for tripId:', this.tripId);
  }

  stopSensorCollection() {
    if (this.sensorInterval) {
      clearInterval(this.sensorInterval);
      this.sensorInterval = null;
    }

    // Remove sensor listeners
    if (window.DeviceMotionEvent) {
      window.removeEventListener('devicemotion', this.handleDeviceMotion);
    }
    if (window.DeviceOrientationEvent) {
      window.removeEventListener('deviceorientation', this.handleDeviceOrientation);
    }

    // Send final batch if any data remains
    if (this.sensorBuffer.length > 0) {
     /* this.sendSensorBatch(true);*/
    }
  }

  setupSensorListeners() {
    // Bind handlers to maintain 'this' context
    this.handleDeviceMotion = (event) => {
      this.lastMotionData = {
        acceleration: event.acceleration,
        accelerationIncludingGravity: event.accelerationIncludingGravity,
        rotationRate: event.rotationRate
      };
    };

    this.handleDeviceOrientation = (event) => {
      this.lastOrientationData = {
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma
      };
    };

    // Add listeners
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', this.handleDeviceMotion);
    }
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.handleDeviceOrientation);
    }
  }

    captureAndBufferSensorData() {
      const timestamp = new Date().toISOString();

      const packet = {
        timestamp,

        accelerometer: {
          x: Number(this.lastMotionData?.acceleration?.x ?? 0),
          y: Number(this.lastMotionData?.acceleration?.y ?? 0),
          z: Number(this.lastMotionData?.acceleration?.z ?? 0),
        },

        gyroscope: {
          x: Number(this.lastOrientationData?.alpha ?? 0),
          y: Number(this.lastOrientationData?.beta ?? 0),
          z: Number(this.lastOrientationData?.gamma ?? 0),
        },

        gps: {
          lat: Number(this.currentPosition?.lat ?? 0),
          lon: Number(this.currentPosition?.lng ?? 0),
          speed: Number(this.currentPosition?.speed ?? 0),
          accuracy: Number(this.currentPosition?.accuracy ?? 0),
          altitude: Number(this.currentPosition?.altitude ?? 0),
        }
      };

      // Push packet to buffer
      this.sensorBuffer.push(packet);

      // Log every 50 samples to monitor progress
      if (this.sensorBuffer.length % 50 === 0) {
        console.log(`📊 Sensor buffer: ${this.sensorBuffer.length}/${this.batchSize} samples collected`);
      }

      // Only send exactly batchSize samples
      while (this.sensorBuffer.length >= this.batchSize) {
        const batchToSend = this.sensorBuffer.slice(0, this.batchSize);
        console.log(`🚀 Sending batch of ${batchToSend.length} samples to AI service...`);

        this.sendSensorBatch(batchToSend); // pass exact batch
        this.sensorBuffer = this.sensorBuffer.slice(this.batchSize); // remove sent samples
      }
  }

 async sendSensorBatch(forceSend = false) {
    if (!this.sensorBuffer.length && !forceSend) {
      console.log('⏭️ No sensor data to send');
      return;
    }
    if (!this.tripId) {
      console.error('❌ Cannot send sensor batch: No tripId available');
      return;
    }

    console.log(`📤 Sending sensor batch to AI service...`, {
      samplesCount: this.sensorBuffer.length,
      tripId: this.tripId,
      expectedMode: this.transportMode,
      forceSend: forceSend
    });

    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE}/ai/predict`;

      console.log('🌐 Making request to:', url);
      console.log('🔑 Auth token present:', !!token);

      const payload = {
        sensorDataArray: this.sensorBuffer,
        tripId: this.tripId,
        expectedMode: this.transportMode,
        userId: this.userId
      };

      //Size in Payload
      const sizeInKB = new Blob([JSON.stringify(payload)]).size / 1024;
      console.log(`📦 Payload size: ${sizeInKB} KB`);
      //Preview first sample
      console.log("Sending batch sample[0]:", this.sensorBuffer[0]);

      console.log('📦 Request payload:', {
        sensorDataCount: payload.sensorDataArray.length,
        tripId: payload.tripId,
        expectedMode: payload.expectedMode,
        firstSample: payload.sensorDataArray[0],
        lastSample: payload.sensorDataArray[payload.sensorDataArray.length - 1]
      });

      console.log("🚚 Final payload to API:", JSON.stringify({
        tripId: this.tripId,
        expectedMode: this.expectedMode,
        sensorData: this.sensorBuffer
      }, null, 2).slice(0, 500) + " ...");

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ AI Service Response:', result);

      if (result.success && result.prediction) {
        this.lastPrediction = result.prediction;
        console.log('🎯 Prediction received:', {
          predictedMode: result.prediction.mode,
          confidence: `${(result.prediction.confidence * 100).toFixed(1)}%`,
          expectedMode: this.transportMode,
          mismatch: result.prediction.mode !== this.transportMode
        });

        this.onPredictionReceived(result.prediction);

        // Check for prediction mismatch
        if (result.prediction.mode !== this.transportMode && result.prediction.confidence > 0.7) {
          console.log('⚠️ Prediction mismatch detected!');
          this.onStateChange({
            predictionMismatch: true,
            predictedMode: result.prediction.mode,
            confidence: result.prediction.confidence,
            message: `AI detected ${result.prediction.mode} transport (${(result.prediction.confidence * 100).toFixed(1)}% confident). You selected ${this.transportMode}. Is this correct?`
          });
        }
      } else {
        console.warn('⚠️ AI service response missing prediction data:', result);
      }
    } catch (error) {
      console.error('❌ Failed to send sensor batch:', {
        error: error.message,
        stack: error.stack,
        tripId: this.tripId,
        bufferSize: this.sensorBuffer.length
      });
    }

    // Clear buffer regardless of success/failure
    const clearedSamples = this.sensorBuffer.length;
    this.sensorBuffer = [];
    console.log(`🗑️ Cleared ${clearedSamples} samples from buffer`);
  }

  //Methods for Route Planning
  setDestination(destination) {
    this.destination = destination; // { lat, lon, address }
    console.log('Destination set to:', this.destination);
  }

  setPlannedRoute(plannedRoute, routeType) {
    this.plannedRoute = plannedRoute;
    this.selectedRouteType = routeType;
    console.log(`Planned route set: ${routeType}`, plannedRoute);
  }
  getPlannedRouteData() {
    if (!this.plannedRoute) return null;
    return this.plannedRoute.getRoute(this.selectedRouteType);
  }

  //Method for AI Mode Toggle
  setAIMode(enabled) {
    console.log('🎯 Setting AI mode:', enabled);
    this.aiEnabled = enabled;

    if (enabled) {
      console.log('🤖 AI transport detection enabled - will start sensor collection');
    } else {
      console.log('🤖 AI transport detection disabled');
      // Stop any ongoing sensor collection
      this.stopSensorCollection();
    }
  }
}
