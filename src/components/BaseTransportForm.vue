<template>
  <div class="transport-form-container">
    <!-- Transport Mode Header -->
    <div class="transport-header">
      <h2>{{ config?.icon }} {{ config?.name }} Trip</h2>
      <div class="mode-indicator">
        {{ isLiveMode ? '📍 Live Tracking' : '📝 Manual Entry' }}
      </div>
    </div>

    <!-- Live Tracking Mode (Mobile) -->
    <LiveTrackingUI
      v-if="isLiveMode && trip"
      :trip="trip"
      :is-active="tripState.isActive"
      :distance="tripState.data.distance || 0"
      :loading="tripState.loading"
      @start-trip="startTrip"
      @end-trip="endTrip"
    />

    <!-- Manual Input Mode (Web) -->
    <ManualInputUI
      v-else-if="!isLiveMode && trip"
      :trip="trip"
      :form-data="tripState.data"
      :errors="tripState.errors"
      :loading="tripState.loading"
      :plugins="plugins"
      :emission="tripState.emission"
      @update-field="updateField"
      @calculate="calculateEmissions"
      @save-trip="saveTrip"

    />

    <!-- AI Prediction Display (Live Mode Only) -->
    <div v-if="isLiveMode && aiPrediction" class="ai-prediction-section">
      <h4>AI Transport Detection</h4>
      <div class="prediction-card" :class="{ 'prediction-mismatch': predictionMismatch }">
        <div class="prediction-info">
          <span class="predicted-mode">
            {{ getTransportIcon(aiPrediction.mode) }} {{ aiPrediction.mode }}
          </span>
          <span class="confidence">
            {{ (aiPrediction.confidence * 100).toFixed(1) }}% confident
          </span>
        </div>
        <div v-if="predictionMismatch" class="mismatch-warning">
          Different from your selection ({{ transportMode }})
        </div>
      </div>
    </div>

    <!-- Emissions Results (Both Modes) -->
    <!--<EmissionsSummary
      v-if="tripState.emission"
      :emission="tripState.emission"
      :transport-mode="transportMode"
      :trip-data="tripState.data"
    />-->



    <!-- Status Messages -->
    <div v-if="statusMessage" class="status-message" :class="messageType">
      {{ statusMessage }}
    </div>

    <!-- Error Display -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- Trip Summary Modal -->
    <TripSummary
      :show="showTripSummary"
      :trip-data="tripSummaryData"
      @close="closeTripSummary"
      @save="saveTripFromSummary"
    />
  </div>
</template>

<script>
import { nextTick } from 'vue';
import { LiveTrip } from '../models/LiveTrip.js';
import { ManualTrip } from '../models/ManualTrip.js';
import { CarAPIPlugin } from '../plugins/carAPI.js';
import { FlightAPIPlugin } from '../plugins/flightAPI.js';

import LiveTrackingUI from './LiveTrackingUI.vue';
import ManualInputUI from './ManualTrackingUI.vue';
import EmissionsSummary from './EmissionsSummary.vue';
import TripSummary from './TripSummary.vue';
import { API_BASE } from '@/config/apiConfig';

export default {
  name: 'BaseTransportForm',
  components: {
    LiveTrackingUI,
    ManualInputUI,
    EmissionsSummary,
    TripSummary
  },

  props: {
    transportMode: {
      type: String,
      required: true,
      validator: (value) => ['car', 'bus', 'tram', 'metro', 'flight'].includes(value)
    }
  },

  data() {
    return {
      trip: null,
      tripState: {
        data: {
          distance: 0,
          duration: 0
        },
        isActive: false,
        loading: false,
        emission: 0
      },
      tripEnding: false,
      tripSaved: false,
      plugins: {},
      isLiveMode: false,
      statusMessage: '',
      errorMessage: '',
      messageType: 'info',

      aiPrediction: null,
      showTripSummary: false,
      tripSummaryData: null,
      predictionMismatch: false,

      // Track trip timing
      tripStartTime: null,
      tripEndTime: null
    };
  },

  computed: {
    config() {
      return this.trip?.config || null;
    },

    userId() {
      // Get from auth store or localStorage
      return localStorage.getItem('userId') || 'anonymous';
    }
  },

  async mounted() {
    try {
      // Ensure transportMode is passed
      if (!this.transportMode) throw new Error('Missing transportMode prop');

      // Initialize the trip asynchronously
      await this.initializeTrip();
    } catch (err) {
      console.error('Failed to initialize trip:', err);
    }
  },

  beforeUnmount() {
    if (this.trip) {
      this.trip.destroy();
    }
  },

  methods: {
    // Detect platform and initialize appropriate trip type
    async initializeTrip() {
      try {
        // Advanced platform detection
        this.isLiveMode = await this.detectMobilePlatform();

        // Create trip instance
        if (this.isLiveMode) {
          this.trip = new LiveTrip(this.transportMode, this.userId, {
            onStateChange: this.handleStateChange,
            onDataUpdate: this.handleDataUpdate,
            onError: this.handleError,
            onLocationUpdate: this.handleLocationUpdate,
            onDistanceUpdate: this.handleDistanceUpdate,
            onPredictionReceived: this.handlePredictionReceived
          });
        } else {
          this.trip = new ManualTrip(this.transportMode, this.userId, {
            onStateChange: this.handleStateChange,
            onDataUpdate: this.handleDataUpdate,
            onError: this.handleError
          });
        }

        // Load plugins
        await this.loadPlugins();

        // Initialize trip state
        this.tripState = this.trip.getState();

        // Auto-start manual trips (they just show the form)
        if (!this.isLiveMode) {
          await this.trip.startTrip();
        }

      } catch (error) {
        console.error('Failed to initialize trip:', error);
        this.handleError('Initialization Error', error.message);
      }
    },

    // Advanced platform detection with GPS check
    async detectMobilePlatform() {
      const { platformDetector } = await import('../utils/platformDetector.js');

      // First check if it's definitely a mobile app
      if (platformDetector.isCordovaApp() || platformDetector.isCapacitorApp()) {
        console.log('Detected: Native mobile app');
        return true;
      }

      // Check if it's a PWA in standalone mode
      if (platformDetector.isPWAStandalone()) {
        console.log('Detected: PWA in standalone mode');
        return true;
      }

      // For web browsers, check GPS availability and mobile characteristics
      if (platformDetector.isMobileDevice()) {
        const gpsCheck = await platformDetector.checkGPSAvailability();

        if (gpsCheck.available) {
          console.log('Detected: Mobile web with GPS - using live mode');
          return true;
        } else {
          console.log('Detected: Mobile web without GPS - using manual mode');
          this.showMessage(`GPS not available: ${gpsCheck.reason}. Using manual entry mode.`, 'info');
          return false;
        }
      }

      // Desktop/laptop - always use manual mode
      console.log('Detected: Desktop/web browser - using manual mode');
      return false;
    },

    // Load transport-specific plugins
    async loadPlugins() {
      const availablePlugins = {};

      // Load car API plugin
      if (this.trip.config.plugins.includes('carAPI')) {
        availablePlugins.carAPI = new CarAPIPlugin();
      }

      // Load flight API plugin
      if (this.trip.config.plugins.includes('flightAPI')) {
        availablePlugins.flightAPI = new FlightAPIPlugin();
      }

      this.plugins = availablePlugins;
      await this.trip.loadPlugins(availablePlugins);
    },

    // Trip control methods
    async startTrip() {
      this.tripStartTime = Date.now();
      const success = await this.trip.startTrip();
      if (success) {
        this.showMessage('Trip started successfully!', 'success');
      }
    },

    async endTrip() {
      if (this.tripEnding) return; // prevent double-clicks
      this.tripEnding = true;
      console.log("Ending trip...");

      this.tripEndTime = Date.now();
      const success = await this.trip.endTrip();

      if (!success) {
        this.showMessage('Failed to end trip', 'error');
        this.tripEnding = false;
        return;
      }

      console.log("Trip ended successfully");

      try {
        // Step 1: Calculate emissions
        const emissionCalculated = await this.trip.calculateEmissions();
        if (!emissionCalculated) {
          this.showMessage("⚠ Could not calculate emissions automatically.", "warning");
        }

        // Step 2: Prepare trip data
        const duration = this.calculateTripDuration();
        const distance = this.tripState.data.distance || 0;
        const emission = this.tripState.emission || this.trip.data.emissionKg || 0;

        console.log('Trip data:', { duration, distance, emission, path: this.trip.path });

        // Step 3: Auto-save trip immediately (for live mode)
        if (this.isLiveMode) {
          this.showMessage("💾 Saving trip...", "info");
          const saved = await this.trip.saveTrip();

          if (!saved) {
            this.showMessage("⚠ Failed to save trip", "warning");
          } else {
            console.log("✅ Trip saved successfully");
          }
        }

        // Step 4: Call post-trip analysis API
        let analysisData = null;

        if (this.isLiveMode && this.trip.path && this.trip.path.length >= 2) {
          this.showMessage("🔍 Analyzing your route...", "info");

          try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/routes/post-trip-analysis`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                trip_id: this.trip.tripId || 'temp-' + Date.now(),
                actual_route: this.trip.path.map(coord => ({
                  lat: Array.isArray(coord) ? coord[0] : coord.lat,
                  lon: Array.isArray(coord) ? coord[1] : (coord.lon || coord.lng)
                })),
                actual_emissions: emission,
                transport_mode: this.transportMode
              })
            });

            if (response.ok) {
              analysisData = await response.json();
              console.log('✅ Post-trip analysis received:', analysisData);
            } else {
              console.warn('Post-trip analysis failed:', response.status);
            }
          } catch (error) {
            console.error('Post-trip analysis error:', error);
            // Don't fail the trip if analysis fails
          }
        }

        // Step 5: Prepare trip summary data
        this.tripSummaryData = {
          transportMode: this.transportMode,
          distance: distance,
          emission: emission,
          duration: duration,
          path: this.trip.path || [],
          aiPrediction: this.aiPrediction,
          startTime: this.tripStartTime,
          endTime: this.tripEndTime,

          // Formatted strings for display
          distanceDisplay: `${distance.toFixed(2)} km`,
          emissionDisplay: `${emission.toFixed(3)} kg CO₂`,
          durationDisplay: this.formatDurationString(duration),
          averageSpeedDisplay: this.calculateAverageSpeedDisplay(distance, duration),

          // Post-trip analysis data
          analysis: analysisData,
          autoSaved: this.isLiveMode
        };

        console.log('Formatted trip summary data:', this.tripSummaryData);

        // Step 6: Show summary modal
        this.showTripSummary = true;

        if (analysisData?.has_green_alternative) {
          this.showMessage('✅ Trip completed! Review your environmental impact below.', 'success');
        } else {
          this.showMessage('✅ Trip completed! You took an efficient route.', 'success');
        }

      } catch (error) {
        console.error('Error in endTrip flow:', error);
        this.showMessage('⚠ Trip ended but analysis failed', 'warning');
      } finally {
        this.tripEnding = false;
      }
    },

    calculateTripDuration() {
      if (this.tripStartTime && this.tripEndTime) {
        return this.tripEndTime - this.tripStartTime;
      }

      // Fallback: try to get duration from trip state or default to 0
      if (this.tripState.data.duration) {
        return this.tripState.data.duration;
      }

      return 0;
    },

    formatDistance(distance) {
      const numDistance = Number(distance);
      return isNaN(numDistance) ? 0 : parseFloat(numDistance.toFixed(2));
    },

    formatEmission(emission) {
      const numEmission = Number(emission);
      return isNaN(numEmission) ? 0 : parseFloat(numEmission.toFixed(3));
    },

    formatDuration(duration) {
      const numDuration = Number(duration);
      return isNaN(numDuration) ? 0 : Math.max(0, Math.floor(numDuration));
    },

    formatDurationString(duration) {
      const numDuration = Number(duration);
      if (isNaN(numDuration) || numDuration <= 0) return '00:00:00';

      const hours = Math.floor(numDuration / (1000 * 60 * 60));
      const minutes = Math.floor((numDuration % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((numDuration % (1000 * 60)) / 1000);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    calculateAverageSpeedDisplay(distance, duration) {
      const numDistance = Number(distance);
      const numDuration = Number(duration);

      if (isNaN(numDistance) || isNaN(numDuration) || numDistance <= 0 || numDuration <= 0) {
        return '0.0 km/h';
      }

      const hours = numDuration / (1000 * 60 * 60);
      const speed = numDistance / hours;

      return isNaN(speed) ? '0.0 km/h' : `${speed.toFixed(1)} km/h`;
    },

    async calculateEmissions() {
      const success = await this.trip.calculateEmissions();
      if (success) {
        this.showMessage('Emissions calculated successfully!', 'success');

        // Wait for DOM to finish updating (prevents parentNode null error)
        await nextTick();

        // Safely compute display data
        const distance = this.tripState.data.distance || 0;
        const emission = this.tripState.emission || 0;
        const duration = this.tripState.data.duration || 0;

        // Build formatted summary object
        this.tripSummaryData = {
          transportMode: this.transportMode,
          distance,
          emission,
          duration,
          aiPrediction: this.aiPrediction,
          distanceDisplay: `${ distance.toFixed(2) } km`,
            emissionDisplay: `${ emission.toFixed(3) } kg CO₂`,
        durationDisplay: this.formatDurationString(duration),
          averageSpeedDisplay: this.calculateAverageSpeedDisplay(distance, duration)
      };

      // Show trip summary modal (v-show safer than v-if)
      this.showTripSummary = true;
    } else {
      this.showMessage('Failed to calculate emissions. Please check your inputs.', 'warning');
    }
    },

    async saveTrip() {
      const success = await this.trip.saveTrip();
      if (success) {
        this.showMessage('Trip saved to history!', 'success');
        // Redirect after a short delay
        setTimeout(() => {
          this.$router.push('/home');
        }, 2000);
      }
    },

    // Form handling for manual mode
    updateField(fieldName, value) {
      if (this.trip && this.trip.updateField) {
        this.trip.updateField(fieldName, value);
      }
    },

    // Event handlers from trip classes
    handleStateChange(state) {
      this.tripState = { ...this.tripState, ...state };

      if (state.message) {
        this.showMessage(state.message, state.autoSaved ? 'success' : 'info');
      }
    },

    handleDataUpdate(data) {
      this.tripState.data = { ...this.tripState.data, ...data };
    },

    handleError(type, message) {
      this.errorMessage = `${type}: ${message}`;
      setTimeout(() => {
        this.errorMessage = '';
      }, 5000);
    },

    handleLocationUpdate(position) {
      // Handle GPS location updates for live tracking
      console.log('Location update:', position);
    },

    handleDistanceUpdate(distance) {
      // Handle real-time distance updates
      console.log('Distance update:', distance);
    },

    handlePredictionReceived(prediction) {
      console.log('AI Prediction received:', prediction);
      this.aiPrediction = prediction;

      // Check for mismatch
      this.predictionMismatch = prediction.mode !== this.transportMode && prediction.confidence > 0.7;

      if (this.predictionMismatch) {
        this.showMessage(
          `AI detected ${prediction.mode} transport (${(prediction.confidence * 100).toFixed(1)}% confident). You selected ${this.transportMode}. Is this correct?`,
          'warning'
        );
      }
    },

    // UI helpers
    showMessage(message, type = 'info') {
      this.statusMessage = message;
      this.messageType = type;

      setTimeout(() => {
        this.statusMessage = '';
      }, 3000);
    },

    closeTripSummary() {
      this.showTripSummary = false;

      // In live mode, navigate back to home after closing summary
      if (this.isLiveMode) {
        this.$router.push('/home');
      }
    },
    async saveTripFromSummary() {
      // For live trips, already saved automatically
      if (this.isLiveMode) {
        this.showMessage("✅ Trip already saved!", "success");
        this.closeTripSummary();
        return;
      }

      // For manual trips, save now
      if (this.tripSaved) return; // prevent double saves
      this.tripSaved = true;

      try {
        this.showMessage("Saving trip...", "info");
        const success = await this.trip.saveTrip();

        if (success) {
          this.showMessage("✅ Trip saved successfully!", "success");
          setTimeout(() => {
            this.$router.push("/home");
          }, 1500);
        } else {
          this.showMessage("❌ Failed to save trip.", "warning");
          this.tripSaved = false;
        }
      } catch (err) {
        console.error("Error saving trip:", err);
        this.showMessage("⚠ Error saving trip. Check console.", "warning");
        this.tripSaved = false;
      }
    },

    getTransportIcon(mode) {
      const icons = {
        car: '🚗',
        bus: '🚌',
        tram: '🚊',
        metro: '🚇',
        flight: '✈️'
      };
      return icons[mode] || '🚶';
    }
  }
};
</script>

<style scoped>
.transport-form-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.transport-header {
  text-align: center;
  margin-bottom: 20px;
}

.transport-header h2 {
  margin: 0;
  color: #333;
}

.mode-indicator {
  margin-top: 10px;
  padding: 8px 16px;
  background: #f0f0f0;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  display: inline-block;
}

.save-section {
  margin-top: 20px;
  text-align: center;
}

.save-button {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-button:hover {
  background: #218838;
}

.save-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.status-message {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}

.status-message.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.status-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.error-message {
  margin-top: 15px;
  padding: 10px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  text-align: center;
}

.ai-prediction-section {
  margin: 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.ai-prediction-section h4 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 1rem;
}

.prediction-card {
  background: white;
  border: 2px solid #28a745;
  border-radius: 6px;
  padding: 12px;
}

.prediction-card.prediction-mismatch {
  border-color: #ffc107;
  background: #fff3cd;
}

.prediction-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.predicted-mode {
  font-weight: bold;
  color: #333;
  font-size: 1.1rem;
}

.confidence {
  color: #6c757d;
  font-size: 0.9rem;
}

.mismatch-warning {
  color: #856404;
  font-size: 0.85rem;
  font-style: italic;
}
</style>
